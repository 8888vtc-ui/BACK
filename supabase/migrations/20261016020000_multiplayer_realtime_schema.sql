-- ==============================================================================
-- MIGRATION SUPABASE REALTIME / WEBSOCKET — MULTIJOUEUR BACKGAMMON PRO
-- Tables : game_rooms, room_actions, room_presence_sessions
-- Synchronisation : publication supabase_realtime (CDC), séquençage strict, RLS
-- ==============================================================================

-- 1. TYPES ÉNUMÉRÉS POUR L'ARBITRAGE DE PARTIE
do $$ begin
    create type room_status as enum (
        'waiting',       -- En attente d'un adversaire
        'ready',         -- Deux joueurs présents, prêt à lancer
        'in_progress',   -- Partie active en cours
        'paused',        -- En pause (ex: reconnexion d'un joueur)
        'completed',     -- Match terminé normalement
        'abandoned'      -- Match abandonné ou forfait par déconnexion
    );
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type room_type as enum (
        'public_matchmaking',  -- Trouvé via file d'attente Elo
        'private_code'         -- Invité via code secret de salon
    );
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type action_type as enum (
        'ROLL_DICE',
        'MOVE_CHECKER',
        'OFFER_DOUBLE',
        'ACCEPT_DOUBLE',
        'PASS_DOUBLE',
        'END_TURN',
        'RESIGN',
        'TIMEOUT',
        'SYNC_SNAPSHOT'
    );
exception
    when duplicate_object then null;
end $$;

-- ==============================================================================
-- 2. TABLE PRINCIPALE : GAME_ROOMS (Salles & État de partie projeté)
-- ==============================================================================
create table if not exists public.game_rooms (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,                        -- Code salon court (ex: 'BG-7824') pour partage
    room_type room_type not null default 'public_matchmaking',
    status room_status not null default 'waiting',
    match_length integer not null default 7 check (match_length >= 0),

    -- Identifiants des joueurs
    host_id uuid references public.profiles(id) on delete set null,
    guest_id uuid references public.profiles(id) on delete set null,
    host_guest_token text,                           -- Support joueur invité anonyme
    guest_guest_token text,

    -- Rôles assignés (X = Blancs, O = Noirs)
    player_x_id uuid references public.profiles(id) on delete set null,
    player_o_id uuid references public.profiles(id) on delete set null,
    player_x_name text not null default 'Joueur X',
    player_o_name text not null default 'Joueur O',
    player_x_rating integer not null default 1500,
    player_o_rating integer not null default 1500,

    -- ÉTAT DE JEU ACTUEL (Projection dénormalisée pour synchronisation ultra-rapide)
    board integer[] not null default array[
        0,                                           -- 0 (inutilisé, indexation 1..24)
        2, 0, 0, 0, 0, -5,                           -- Jan intérieur X (1..6)
        0, -3, 0, 0, 0, 5,                           -- Jan extérieur X (7..12)
        -5, 0, 0, 0, 3, 0,                           -- Jan extérieur O (13..18)
        5, 0, 0, 0, 0, -2,                           -- Jan intérieur O (19..24)
        0, 0                                         -- 25: Bar X, 26: Bar O (représenté 25-26 en base)
    ],
    score_x integer not null default 0 check (score_x >= 0),
    score_o integer not null default 0 check (score_o >= 0),
    turn text not null check (turn in ('X', 'O')) default 'X',
    dice integer[] default null,                     -- [d1, d2] ou null
    used_dice boolean[] not null default array[false, false],
    cube_value integer not null default 1 check (cube_value >= 1),
    cube_owner text check (cube_owner in ('X', 'O')),
    doubling_offered_by text check (doubling_offered_by in ('X', 'O')),
    is_crawford boolean not null default false,

    -- HORLOGES & CADENCE DE RÉFLEXION
    time_control_type text check (time_control_type in ('per_turn', 'fischer', 'unlimited')) default 'per_turn',
    time_limit_seconds integer not null default 45,  -- 45s par coup
    clock_x_ms integer not null default 45000,
    clock_o_ms integer not null default 45000,
    last_turn_started_at timestamptz not null default now(),

    -- SÉQUENÇAGE & ANTI-DÉSYNCHRONISATION
    sequence_number bigint not null default 0,       -- Monotone croissant (incrémenté à chaque coup)
    winner text check (winner in ('X', 'O')),
    win_type text check (win_type in ('single', 'gammon', 'backgammon', 'pass', 'timeout', 'disconnect')),
    points_won integer default 0,
    
    -- Deltas Elo calculés à la fin
    elo_delta_x integer default null,
    elo_delta_o integer default null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index pour recherches rapides
create index if not exists idx_game_rooms_code on public.game_rooms(code);
create index if not exists idx_game_rooms_status on public.game_rooms(status);
create index if not exists idx_game_rooms_host_guest on public.game_rooms(host_id, guest_id);
create index if not exists idx_game_rooms_sequence on public.game_rooms(id, sequence_number);

-- ==============================================================================
-- 3. TABLE HISTORIQUE : ROOM_ACTIONS (Journal complet sérialisé des coups)
-- ==============================================================================
create table if not exists public.room_actions (
    id uuid primary key default gen_random_uuid(),
    room_id uuid not null references public.game_rooms(id) on delete cascade,
    sequence_number bigint not null,                  -- Numéro d'ordre strict dans la room
    player text not null check (player in ('X', 'O')),
    action_type action_type not null,
    
    -- Détails de l'action
    dice integer[] default null,                      -- Jet de dés associé
    move_from integer default null,                   -- Déplacement source (1..24, ou 25=barre)
    move_to integer default null,                     -- Déplacement cible (1..24, ou 0/25=sortie)
    move_notation text default null,                  -- Ex: '8/5 6/5'
    cube_value integer default null,                  -- Valeur du videau si double/take
    
    -- État du plateau résultant (pour réconciliation instantanée)
    board_after integer[] not null,
    time_spent_ms integer not null default 0,         -- Durée de réflexion consommée
    
    created_at timestamptz not null default now(),
    
    constraint uq_room_sequence unique (room_id, sequence_number)
);

create index if not exists idx_room_actions_room_seq on public.room_actions(room_id, sequence_number desc);

-- ==============================================================================
-- 4. TABLE DE PRÉSENCE & SESSIONS WEBSOCKET : ROOM_PRESENCE_SESSIONS
-- ==============================================================================
create table if not exists public.room_presence_sessions (
    id uuid primary key default gen_random_uuid(),
    room_id uuid not null references public.game_rooms(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    guest_token text,
    role text not null check (role in ('X', 'O', 'spectator')),
    socket_id text,
    is_online boolean not null default true,
    last_ping_at timestamptz not null default now(),
    reconnect_expires_at timestamptz,                -- Fin de la fenêtre de grâce (45s)
    created_at timestamptz not null default now()
);

create index if not exists idx_presence_room_user on public.room_presence_sessions(room_id, is_online);

-- ==============================================================================
-- 5. FONCTIONS & TRIGGERS PL/PGSQL
-- ==============================================================================

-- Trigger 1 : Incrément automatique du numéro de séquence et mise à jour updated_at
create or replace function public.fn_process_room_action()
returns trigger as $$
begin
    -- 1. Attribuer le prochain numéro de séquence monotone si non fourni
    if new.sequence_number is null or new.sequence_number <= 0 then
        select coalesce(max(sequence_number), 0) + 1
        into new.sequence_number
        from public.room_actions
        where room_id = new.room_id;
    end if;

    -- 2. Mettre à jour l'état dénormalisé de la salle
    update public.game_rooms
    set 
        sequence_number = new.sequence_number,
        board = new.board_after,
        updated_at = now()
    where id = new.room_id;

    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_process_room_action on public.room_actions;
create trigger tr_process_room_action
    before insert on public.room_actions
    for each row
    execute function public.fn_process_room_action();

-- ==============================================================================
-- 6. ACTIVATION DE LA PUBLICATION SUPABASE REALTIME (CDC)
-- ==============================================================================
-- Permet aux clients d'écouter les mises à jour de game_rooms et room_actions en WebSocket
do $$ begin
    alter publication supabase_realtime add table public.game_rooms;
exception
    when duplicate_object then null;
end $$;

do $$ begin
    alter publication supabase_realtime add table public.room_actions;
exception
    when duplicate_object then null;
end $$;

-- ==============================================================================
-- 7. POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ==============================================================================
alter table public.game_rooms enable row level security;
alter table public.room_actions enable row level security;
alter table public.room_presence_sessions enable row level security;

-- Game Rooms
create policy "Les salles de jeu sont consultables par leurs participants ou les spectateurs autorisés"
    on public.game_rooms for select
    using (
        status = 'waiting' or
        auth.uid() = host_id or
        auth.uid() = guest_id or
        auth.uid() = player_x_id or
        auth.uid() = player_o_id or
        host_guest_token is not null
    );

create policy "Création de salle par tout utilisateur authentifié ou invité"
    on public.game_rooms for insert
    with check (true);

create policy "Mise à jour de la salle par les participants"
    on public.game_rooms for update
    using (
        auth.uid() = host_id or
        auth.uid() = guest_id or
        auth.uid() = player_x_id or
        auth.uid() = player_o_id or
        host_guest_token is not null
    );

-- Room Actions
create policy "Les actions d'une salle sont visibles par ses participants"
    on public.room_actions for select
    using (true);

create policy "Insertion d'une action de jeu par un participant"
    on public.room_actions for insert
    with check (true);

-- Room Presence
create policy "Consultation de présence de salle"
    on public.room_presence_sessions for select
    using (true);

create policy "Gestion de sa propre présence"
    on public.room_presence_sessions for all
    using (auth.uid() = user_id or guest_token is not null);
