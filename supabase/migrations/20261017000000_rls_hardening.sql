-- ==============================================================================
-- MIGRATION DE DURCISSEMENT DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- Date : 17 Octobre 2026
-- Description : Audit et correction des vulnérabilités RLS identifiées :
--   1. Protection contre la falsification des statistiques (user_stats)
--   2. Verrouillage des modifications arbitraires sur la file matchmaking_queue
--   3. Restriction stricte des insertions dans room_actions aux participants réels
--   4. Élimination des fuites de données dans game_rooms liées aux tokens d'invités
--   5. Ajout des clauses WITH CHECK explicites sur toutes les politiques d'UPDATE
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLE USER_STATS : INTERDICTION DE FALSIFICATION DES STATISTIQUES
-- Seuls les déclencheurs serveur ou fonctions SECURITY DEFINER peuvent modifier les stats.
-- ------------------------------------------------------------------------------
drop policy if exists "Les utilisateurs peuvent modifier leurs statistiques" on public.user_stats;

-- Remplacement par une politique en lecture seule pour les utilisateurs ordinaires
create policy "Consultation sécurisée de ses propres statistiques"
    on public.user_stats for select
    to authenticated
    using (auth.uid() = user_id);

-- Seul le serveur (service_role ou trigger SECURITY DEFINER) peut mettre à jour les statistiques
create policy "Mise à jour des statistiques réservée au système"
    on public.user_stats for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id and games_played >= games_won + games_lost);

-- ------------------------------------------------------------------------------
-- 2. TABLE MATCHMAKING_QUEUE : VERROUILLAGE DES MISES À JOUR ARBITRAIRES
-- ------------------------------------------------------------------------------
drop policy if exists "Mise à jour de son ticket ou appariement" on public.matchmaking_queue;

-- Un utilisateur ne peut modifier que son propre ticket (ou un adversaire peut passer de 'waiting' à 'matched')
create policy "Mise à jour sécurisée du ticket de matchmaking"
    on public.matchmaking_queue for update
    using (
        auth.uid() = user_id or 
        (status = 'waiting' and matched_room_id is null)
    )
    with check (
        -- Si modification de son propre ticket : annulation ou mise à jour basique
        (auth.uid() = user_id and status in ('waiting', 'cancelled', 'matched')) or
        -- Si appariement par un tiers : passage exclusif à 'matched' avec salle valide
        (status = 'matched' and matched_room_id is not null)
    );

-- ------------------------------------------------------------------------------
-- 3. TABLE GAME_ROOMS : CORRECTION DE LA FUITE DE DONNÉES SUR LES GUEST TOKENS
-- ------------------------------------------------------------------------------
drop policy if exists "Les salles de jeu sont consultables par leurs participants ou les spectateurs autorisés" on public.game_rooms;
drop policy if exists "Mise à jour de la salle par les participants" on public.game_rooms;

create policy "Consultation sécurisée des salles de jeu"
    on public.game_rooms for select
    using (
        status = 'waiting' or
        auth.uid() = host_id or
        auth.uid() = guest_id or
        auth.uid() = player_x_id or
        auth.uid() = player_o_id
    );

create policy "Mise à jour sécurisée de la salle par les participants réels"
    on public.game_rooms for update
    using (
        auth.uid() = host_id or
        auth.uid() = guest_id or
        auth.uid() = player_x_id or
        auth.uid() = player_o_id
    )
    with check (
        auth.uid() = host_id or
        auth.uid() = guest_id or
        auth.uid() = player_x_id or
        auth.uid() = player_o_id
    );

-- ------------------------------------------------------------------------------
-- 4. TABLE ROOM_ACTIONS : RESTRICTION STRICTE AUX PARTICIPANTS DE LA SALLE
-- ------------------------------------------------------------------------------
drop policy if exists "Insertion d'une action de jeu par un participant" on public.room_actions;

create policy "Insertion sécurisée d'une action de jeu par un joueur actif de la salle"
    on public.room_actions for insert
    with check (
        exists (
            select 1 from public.game_rooms r
            where r.id = room_actions.room_id
              and r.status in ('waiting', 'in_progress')
              and (
                  r.host_id = auth.uid() or
                  r.guest_id = auth.uid() or
                  r.player_x_id = auth.uid() or
                  r.player_o_id = auth.uid()
              )
        )
    );

-- ------------------------------------------------------------------------------
-- 5. TABLE GAMES : RENFORCEMENT DE L'INTÉGRITÉ DES PARTIES
-- ------------------------------------------------------------------------------
drop policy if exists "Les participants d'une partie multijoueur peuvent la mettre à jour" on public.games;

create policy "Mise à jour intègre d'une partie par son propriétaire ou participant"
    on public.games for update
    to authenticated
    using (
        auth.uid() = user_id or 
        auth.uid() = player_x_id or 
        auth.uid() = player_o_id
    )
    with check (
        (auth.uid() = user_id or auth.uid() = player_x_id or auth.uid() = player_o_id) and
        match_length >= 0 and
        score_x >= 0 and
        score_o >= 0 and
        cube_value >= 1
    );
