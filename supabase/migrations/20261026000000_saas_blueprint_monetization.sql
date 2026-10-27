-- ==============================================================================
-- MIGRATION : BLUEPRINT SAAS 2026 — 3 PALIERS (CLUB CHOUETTE), IDEMPOTENCE STRIPE,
--             GRACE PERIOD (DUNNING 30J), PAUSE, HEALTH SCORE & LEDGER MARGE IA
-- ==============================================================================

-- 1. Extension des contraintes et colonnes sur public.profiles
alter table public.profiles
    drop constraint if exists profiles_subscription_tier_check,
    drop constraint if exists profiles_subscription_status_check;

alter table public.profiles
    add constraint profiles_subscription_tier_check
        check (subscription_tier in ('free', 'pro_reverse_trial', 'coach_monthly', 'coach_yearly', 'club_chouette')),
    add constraint profiles_subscription_status_check
        check (subscription_status in ('active', 'trialing', 'past_due', 'paused', 'canceled', 'incomplete', 'none'));

alter table public.profiles
    add column if not exists reverse_trial_ends_at timestamptz,
    add column if not exists grace_period_ends_at timestamptz,
    add column if not exists pause_resumes_at timestamptz,
    add column if not exists period_inference_cost_usd numeric(10, 4) not null default 0.0000,
    add column if not exists monthly_revenue_usd numeric(10, 2) not null default 0.00,
    add column if not exists activated_at timestamptz,
    add column if not exists ttfv_seconds integer,
    add column if not exists health_score numeric(5, 2) not null default 100.00,
    add column if not exists last_active_at timestamptz not null default now();

-- 2. Registre immuable de consommation IA (Protection Marge Brute >= 50 % contre Heavy-Users)
create table if not exists public.credit_usage_ledger (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    task_type text not null,
    model_routed text not null,
    prompt_tokens integer not null default 0,
    completion_tokens integer not null default 0,
    actual_inference_cost_usd numeric(10, 6) not null default 0.000000,
    credits_deducted integer not null default 1,
    idempotency_key text unique not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_credit_ledger_user_period
    on public.credit_usage_ledger(user_id, created_at);

alter table public.credit_usage_ledger enable row level security;

create policy "Users can view own credit usage ledger"
    on public.credit_usage_ledger for select
    using (auth.uid() = user_id);

-- 3. Table d'idempotence événementielle des Webhooks Stripe (event_id UNIQUE)
create table if not exists public.processed_webhooks_events (
    id uuid primary key default gen_random_uuid(),
    event_id text not null unique,
    event_type text not null,
    user_id uuid references public.profiles(id) on delete set null,
    processed_at timestamptz not null default now()
);

alter table public.processed_webhooks_events enable row level security;

-- 4. Table de verrouillage des sessions Checkout (Idempotence Métier FOR UPDATE)
create table if not exists public.checkout_sessions_lock (
    session_id text primary key,
    user_id uuid not null references public.profiles(id) on delete cascade,
    is_open boolean not null default true,
    amount_total integer not null default 0,
    currency text not null default 'eur',
    finalized_at timestamptz
);

alter table public.checkout_sessions_lock enable row level security;

-- 5. Mise à jour de la RPC consume_daily_coach_analysis (supporte club_chouette, reverse_trial et grace_period_ends_at)
create or replace function public.consume_daily_coach_analysis(
    p_user_id uuid,
    p_max_daily integer default 3
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_profile record;
    v_now timestamptz := now();
    v_new_count integer;
    v_new_reset timestamptz;
    v_is_vip boolean;
begin
    select
        id,
        subscription_tier,
        subscription_status,
        grace_period_ends_at,
        reverse_trial_ends_at,
        daily_analyses_count,
        last_analysis_reset_at
    into v_profile
    from public.profiles
    where id = p_user_id
    for update;

    if not found then
        return jsonb_build_object(
            'allowed', false,
            'daily_analyses_count', 0,
            'last_analysis_reset_at', v_now,
            'subscription_tier', 'free',
            'subscription_status', 'none'
        );
    end if;

    v_is_vip := (
        v_profile.subscription_tier in ('coach_monthly', 'coach_yearly', 'club_chouette', 'pro_reverse_trial')
        and (
            coalesce(v_profile.subscription_status, 'active') in ('active', 'trialing')
            or (
                v_profile.subscription_status = 'past_due'
                and v_profile.grace_period_ends_at is not null
                and v_profile.grace_period_ends_at > v_now
            )
        )
    );

    if v_profile.last_analysis_reset_at is null
       or (v_now - v_profile.last_analysis_reset_at) >= interval '24 hours' then
        v_new_count := 0;
        v_new_reset := v_now;
    else
        v_new_count := coalesce(v_profile.daily_analyses_count, 0);
        v_new_reset := v_profile.last_analysis_reset_at;
    end if;

    if v_is_vip then
        update public.profiles
        set daily_analyses_count = v_new_count + 1,
            last_analysis_reset_at = v_new_reset,
            last_active_at = v_now,
            updated_at = v_now
        where id = p_user_id;

        return jsonb_build_object(
            'allowed', true,
            'daily_analyses_count', v_new_count + 1,
            'last_analysis_reset_at', v_new_reset,
            'subscription_tier', v_profile.subscription_tier,
            'subscription_status', v_profile.subscription_status
        );
    end if;

    if v_new_count >= p_max_daily then
        update public.profiles
        set daily_analyses_count = v_new_count,
            last_analysis_reset_at = v_new_reset,
            last_active_at = v_now,
            updated_at = v_now
        where id = p_user_id;

        return jsonb_build_object(
            'allowed', false,
            'daily_analyses_count', v_new_count,
            'last_analysis_reset_at', v_new_reset,
            'subscription_tier', v_profile.subscription_tier,
            'subscription_status', v_profile.subscription_status
        );
    end if;

    v_new_count := v_new_count + 1;

    update public.profiles
    set daily_analyses_count = v_new_count,
        last_analysis_reset_at = v_new_reset,
        last_active_at = v_now,
        updated_at = v_now
    where id = p_user_id;

    return jsonb_build_object(
        'allowed', true,
        'daily_analyses_count', v_new_count,
        'last_analysis_reset_at', v_new_reset,
        'subscription_tier', v_profile.subscription_tier,
        'subscription_status', v_profile.subscription_status
    );
end;
$$;

-- 6. Fonction SQL Cron Quotidien (Section 6.4 du Blueprint : Auto-Downgrade J+14, Reprise Pause & Health Score)
create or replace function public.run_daily_lifecycle_engine()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_downgraded_count integer := 0;
    v_resumed_count integer := 0;
    v_health_updated_count integer := 0;
begin
    -- 1. Auto-Downgrade des Reverse Trials expirés (J+14) vers le plan Free sans perte de données
    with downgraded as (
        update public.profiles
        set subscription_tier = 'free',
            subscription_status = 'active',
            updated_at = now()
        where subscription_tier = 'pro_reverse_trial'
          and subscription_status = 'trialing'
          and reverse_trial_ends_at is not null
          and reverse_trial_ends_at <= now()
        returning id
    )
    select count(*) into v_downgraded_count from downgraded;

    -- 2. Réactivation automatique des abonnements en Pause arrivés à terme (1 à 3 mois)
    with resumed as (
        update public.profiles
        set subscription_status = 'active',
            pause_resumes_at = null,
            updated_at = now()
        where subscription_status = 'paused'
          and pause_resumes_at is not null
          and pause_resumes_at <= now()
        returning id
    )
    select count(*) into v_resumed_count from resumed;

    -- 3. Recalcul du Health Score pondéré (0-100) selon la formule de rétention :
    --    Connexion (30%) + Usage (25%) + Support (15%) + Facturation (15%) + Engagement/Activation (15%)
    with scored as (
        update public.profiles
        set health_score = greatest(0, least(100,
            (case
                when last_active_at >= now() - interval '3 days' then 100
                when last_active_at >= now() - interval '7 days' then 70
                when last_active_at >= now() - interval '14 days' then 40
                else 10
            end * 0.30) +
            (least(100, (coalesce(daily_analyses_count, 0)::numeric / 3.0) * 100) * 0.25) +
            (85 * 0.15) +
            (case when subscription_status = 'past_due' then 20 else 100 end * 0.15) +
            (case when activated_at is not null then 100 else 20 end * 0.15)
        )),
        updated_at = now()
        where subscription_status in ('active', 'past_due', 'trialing')
        returning id
    )
    select count(*) into v_health_updated_count from scored;

    return jsonb_build_object(
        'downgraded_count', v_downgraded_count,
        'resumed_count', v_resumed_count,
        'health_updated_count', v_health_updated_count
    );
end;
$$;
