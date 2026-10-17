-- ==============================================================================
-- MIGRATION : MULTIJOUEUR EN LIGNE & MATCHMAKING PUBLIC ELO
-- Tables : matchmaking_queue, enrichissement de games avec les colonnes multijoueur
-- Politiques RLS & fonction d'appariement atomique
-- ==============================================================================

-- 1. ENRICHISSEMENT DE LA TABLE GAMES POUR LE MULTIJOUEUR
alter table public.games 
    add column if not exists player_x_id uuid references public.profiles(id) on delete set null,
    add column if not exists player_o_id uuid references public.profiles(id) on delete set null,
    add column if not exists room_id text,
    add column if not exists elo_x_before integer,
    add column if not exists elo_o_before integer,
    add column if not exists elo_x_delta integer,
    add column if not exists elo_o_delta integer;

create index if not exists idx_games_room_id on public.games(room_id);
create index if not exists idx_games_player_x on public.games(player_x_id);
create index if not exists idx_games_player_o on public.games(player_o_id);

-- RLS pour les deux participants d'une partie multijoueur
create policy "Les participants d'une partie multijoueur peuvent la consulter"
    on public.games for select
    to authenticated
    using (auth.uid() = player_x_id or auth.uid() = player_o_id);

create policy "Les participants d'une partie multijoueur peuvent la mettre à jour"
    on public.games for update
    to authenticated
    using (auth.uid() = player_x_id or auth.uid() = player_o_id)
    with check (auth.uid() = player_x_id or auth.uid() = player_o_id);

-- ==============================================================================
-- 2. TABLE MATCHMAKING_QUEUE (File d'attente pour matchmaking public)
-- ==============================================================================
create table if not exists public.matchmaking_queue (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade,
    guest_id text,
    display_name text not null,
    rating integer not null default 1500 check (rating >= 100),
    match_length integer not null default 7 check (match_length >= 0),
    status text not null check (status in ('waiting', 'matched', 'cancelled')) default 'waiting',
    matched_room_id text,
    matched_opponent_id text,
    matched_opponent_name text,
    matched_role text check (matched_role in ('X', 'O')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index d'optimisation de recherche dans la file
create index if not exists idx_matchmaking_status_rating on public.matchmaking_queue(status, match_length, rating);
create index if not exists idx_matchmaking_created_at on public.matchmaking_queue(created_at desc);

-- Activation de RLS sur la file
alter table public.matchmaking_queue enable row level security;

-- N'importe quel joueur peut voir les tickets en attente pour trouver un match
create policy "Lecture de la file d'attente pour matchmaking"
    on public.matchmaking_queue for select
    using (status = 'waiting' or auth.uid() = user_id or guest_id is not null);

-- Les joueurs peuvent insérer leur ticket
create policy "Insertion de ticket dans la file"
    on public.matchmaking_queue for insert
    with check (true);

-- Les joueurs peuvent annuler leur ticket ou un adversaire peut marquer l'appariement
create policy "Mise à jour de son ticket ou appariement"
    on public.matchmaking_queue for update
    using (true)
    with check (true);

-- Nettoyage des vieux tickets annulés
create policy "Suppression de son propre ticket"
    on public.matchmaking_queue for delete
    using (auth.uid() = user_id or guest_id is not null);
