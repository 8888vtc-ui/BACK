-- ==============================================================================
-- MIGRATION : FINTECH MONETIZATION, SUBSCRIPTIONS, CLUB PACKS & BEHAVIORAL PAYWALL
-- Date : 2026-10-30
-- Tables : subscriptions, club_packs, club_pack_members, stripe_webhook_events, usage_quotas
-- ==============================================================================

-- 1. Table des Abonnements SaaS (Paliers Individuels & Club)
create table if not exists public.subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    plan_tier text not null check (plan_tier in ('free', 'pro_individual', 'club_chouette', 'vip_enterprise')),
    status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'paused', 'canceled', 'incomplete')),
    stripe_subscription_id text unique,
    stripe_customer_id text,
    current_period_start timestamptz not null default now(),
    current_period_end timestamptz not null default (now() + interval '30 days'),
    cancel_at_period_end boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user_status
    on public.subscriptions(user_id, status);

-- 2. Table des Packs Club (Multi-Sièges : max 5 sièges inclus)
create table if not exists public.club_packs (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references public.profiles(id) on delete cascade,
    subscription_id uuid references public.subscriptions(id) on delete set null,
    name text not null,
    max_seats integer not null default 5 check (max_seats = 5),
    invite_code text unique not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_club_packs_owner
    on public.club_packs(owner_id);

-- 3. Membres des Packs Club
create table if not exists public.club_pack_members (
    id uuid primary key default gen_random_uuid(),
    pack_id uuid not null references public.club_packs(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    role text not null default 'member' check (role in ('owner', 'admin', 'member')),
    joined_at timestamptz not null default now(),
    unique(pack_id, user_id)
);

create index if not exists idx_club_pack_members_user
    on public.club_pack_members(user_id);

-- 4. Registre d'Idempotence des Webhooks Stripe (Code 23505 sur duplicate event_id)
create table if not exists public.stripe_webhook_events (
    event_id text primary key,
    event_type text not null,
    payload jsonb not null default '{}'::jsonb,
    processed_at timestamptz not null default now()
);

-- 5. Quotas d'Utilisation Comportementale (Paywall Progressif)
create table if not exists public.usage_quotas (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    quota_type text not null check (quota_type in ('coach_analysis', 'daily_puzzle', 'karma_swap', 'chouette_games')),
    used_count integer not null default 0 check (used_count >= 0),
    max_count integer not null default 3,
    window_start timestamptz not null default now(),
    window_end timestamptz not null default (now() + interval '24 hours'),
    updated_at timestamptz not null default now(),
    unique(user_id, quota_type, window_start)
);

create index if not exists idx_usage_quotas_lookup
    on public.usage_quotas(user_id, quota_type, window_end);

-- 6. Activation de la Sécurité Ligne par Ligne (RLS)
alter table public.subscriptions enable row level security;
alter table public.club_packs enable row level security;
alter table public.club_pack_members enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.usage_quotas enable row level security;

-- Politiques RLS
create policy "Users can view own subscription"
    on public.subscriptions for select
    using (auth.uid() = user_id);

create policy "Users can view club packs they own or belong to"
    on public.club_packs for select
    using (
        auth.uid() = owner_id
        or exists (
            select 1 from public.club_pack_members m
            where m.pack_id = club_packs.id and m.user_id = auth.uid()
        )
    );

create policy "Pack owners can manage club pack"
    on public.club_packs for all
    using (auth.uid() = owner_id);

create policy "Pack members can view their pack membership"
    on public.club_pack_members for select
    using (
        auth.uid() = user_id
        or exists (
            select 1 from public.club_packs p
            where p.id = club_pack_members.pack_id and p.owner_id = auth.uid()
        )
    );

create policy "Users can view own usage quotas"
    on public.usage_quotas for select
    using (auth.uid() = user_id);

-- 7. Fonction d'Éligibilité Complète Utilisateur (check_user_entitlement)
create or replace function public.check_user_entitlement(target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_sub record;
    v_pack record;
begin
    -- 1. Vérification d'abonnement individuel direct
    select plan_tier, status, current_period_end
    into v_sub
    from public.subscriptions
    where user_id = target_user_id
      and status in ('active', 'trialing')
      and current_period_end > now()
    order by created_at desc
    limit 1;

    if found then
        return jsonb_build_object(
            'is_entitled', true,
            'plan_tier', v_sub.plan_tier,
            'source', 'direct',
            'pack_id', null,
            'expires_at', v_sub.current_period_end
        );
    end if;

    -- 2. Vérification d'appartenance à un Pack Club actif
    select cp.id as pack_id, s.current_period_end
    into v_pack
    from public.club_pack_members cpm
    join public.club_packs cp on cp.id = cpm.pack_id
    left join public.subscriptions s on s.id = cp.subscription_id
    where cpm.user_id = target_user_id
      and (s.status is null or s.status in ('active', 'trialing'))
      and (s.current_period_end is null or s.current_period_end > now())
    limit 1;

    if found then
        return jsonb_build_object(
            'is_entitled', true,
            'plan_tier', 'club_chouette',
            'source', 'club_pack',
            'pack_id', v_pack.pack_id,
            'expires_at', v_pack.current_period_end
        );
    end if;

    return jsonb_build_object(
        'is_entitled', false,
        'plan_tier', 'free',
        'source', 'none',
        'pack_id', null,
        'expires_at', null
    );
end;
$$;
