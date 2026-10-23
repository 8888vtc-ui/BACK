-- ==============================================================================
-- MIGRATION : MONÉTISATION FREEMIUM ÉTHIQUE, QUOTAS COACH (3/24H) & STRIPE BILLING
-- Table étendue : public.profiles
-- ==============================================================================

-- 1. Colonnes d'abonnement Stripe & Quota journalier de revues Coach IA
alter table public.profiles
    add column if not exists subscription_tier text not null default 'free'
        check (subscription_tier in ('free', 'coach_monthly', 'coach_yearly')),
    add column if not exists subscription_status text default 'none'
        check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'none')),
    add column if not exists stripe_customer_id text,
    add column if not exists stripe_subscription_id text,
    add column if not exists daily_analyses_count integer not null default 0
        check (daily_analyses_count >= 0),
    add column if not exists last_analysis_reset_at timestamptz not null default now();

create index if not exists idx_profiles_stripe_customer_id
    on public.profiles(stripe_customer_id)
    where stripe_customer_id is not null;

create index if not exists idx_profiles_stripe_subscription_id
    on public.profiles(stripe_subscription_id)
    where stripe_subscription_id is not null;

-- 2. Fonction RPC atomique de vérification et d'incrémentation du quota (3 analyses / 24h)
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
        v_profile.subscription_tier in ('coach_monthly', 'coach_yearly')
        and coalesce(v_profile.subscription_status, 'active') in ('active', 'trialing')
    );

    -- Fenêtre glissante de 24h : réinitialisation automatique si >= 24 heures
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
