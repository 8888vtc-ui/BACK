-- ==============================================================================
-- MIGRATION : ERREURS RÉCURRENTES (Recurring Errors)
-- Table : recurring_errors
-- Objectif : agréger les erreurs répétées d'un joueur par concept stratégique,
--            afin d'identifier les axes de progression prioritaires.
-- ==============================================================================

-- ==============================================================================
-- TABLE : RECURRING_ERRORS (Erreurs récurrentes agrégées par concept)
-- ==============================================================================
create table if not exists public.recurring_errors (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    concept_id text not null,
    concept_label text not null,
    occurrence_count integer not null default 1 check (occurrence_count >= 1),
    total_equity_loss numeric(8, 4) not null default 0.0,
    last_seen_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- Unicité : un seul agrégat par (utilisateur, concept)
    constraint recurring_errors_user_concept_unique unique (user_id, concept_id)
);

-- Index pour les requêtes fréquentes
create index if not exists idx_recurring_errors_user_id on public.recurring_errors(user_id);
create index if not exists idx_recurring_errors_user_count on public.recurring_errors(user_id, occurrence_count desc);

-- RLS pour recurring_errors (Strictement réservé au propriétaire)
alter table public.recurring_errors enable row level security;

create policy "Les utilisateurs peuvent consulter uniquement leurs propres erreurs récurrentes"
    on public.recurring_errors for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Les utilisateurs peuvent enregistrer leurs erreurs récurrentes"
    on public.recurring_errors for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Les utilisateurs peuvent modifier leurs erreurs récurrentes"
    on public.recurring_errors for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Les utilisateurs peuvent supprimer leurs erreurs récurrentes"
    on public.recurring_errors for delete
    to authenticated
    using (auth.uid() = user_id);

-- ==============================================================================
-- FONCTION : UPSERT D'ERREUR RÉCURRENTE
-- Incrémente le compteur et cumule la perte d'équité pour un concept donné.
-- ==============================================================================
create or replace function public.upsert_recurring_error(
    p_user_id uuid,
    p_concept_id text,
    p_concept_label text,
    p_equity_loss numeric
)
returns public.recurring_errors as $$
declare
    v_row public.recurring_errors;
begin
    insert into public.recurring_errors (
        user_id,
        concept_id,
        concept_label,
        occurrence_count,
        total_equity_loss,
        last_seen_at
    )
    values (
        p_user_id,
        p_concept_id,
        p_concept_label,
        1,
        coalesce(p_equity_loss, 0.0),
        now()
    )
    on conflict (user_id, concept_id) do update
    set
        occurrence_count = public.recurring_errors.occurrence_count + 1,
        total_equity_loss = public.recurring_errors.total_equity_loss + coalesce(excluded.total_equity_loss, 0.0),
        concept_label = excluded.concept_label,
        last_seen_at = now(),
        updated_at = now()
    returning * into v_row;

    return v_row;
end;
$$ language plpgsql security definer;

-- ==============================================================================
-- TRIGGER : MISE À JOUR AUTOMATIQUE DE updated_at
-- ==============================================================================
create or replace function public.set_recurring_errors_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_recurring_errors_updated_at on public.recurring_errors;
create trigger trg_recurring_errors_updated_at
    before update on public.recurring_errors
    for each row
    execute function public.set_recurring_errors_updated_at();
