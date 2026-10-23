-- ==============================================================================
-- MIGRATION : CACHE GLOBAL PARTAGÉ POUR COACH_EXPLANATIONS (L2 Cache Supabase)
-- Date : 23 Octobre 2026
-- Objectif : Transformer `public.coach_explanations` en cache global partagé L2
--            interrogeable par `position_key` par tous les joueurs (connectés ou invités).
-- ==============================================================================

-- 1. Autoriser les contributions anonymes/invités au cache global partagé
alter table public.coach_explanations
    alter column user_id drop not null;

-- 2. Index composite optimisé pour le lookup L2 par clé canonique `position_key`
create index if not exists idx_coach_explanations_position_key_source
    on public.coach_explanations(position_key, source, created_at desc);

-- 3. Politique RLS de lecture globale partagée (L2 Cache accessible à anon et authenticated)
drop policy if exists "Les utilisateurs peuvent consulter uniquement leurs propres explications coach"
    on public.coach_explanations;

drop policy if exists "Lecture globale partagée du cache coach_explanations"
    on public.coach_explanations;

create policy "Lecture globale partagée du cache coach_explanations"
    on public.coach_explanations for select
    to anon, authenticated
    using (true);

-- 4. Politique d'insertion sécurisée (utilisateur authentifié ou contribution anonyme sans usurpation d'UUID)
drop policy if exists "Les utilisateurs peuvent enregistrer leurs explications coach"
    on public.coach_explanations;

create policy "Insertion partagée dans le cache coach_explanations"
    on public.coach_explanations for insert
    to anon, authenticated
    with check (auth.uid() = user_id or user_id is null);
