-- ==============================================================================
-- MIGRATION INITIALE : SCHÉMA SUPABASE BACKGAMMON TOURNAMENT PRO
-- Tables : profiles, games, moves, coach_explanations, user_stats
-- Politiques RLS strictes : isolation par utilisateur (auth.uid() = user_id)
-- ==============================================================================

-- 1. EXTENSIONS REQUISES
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- TABLE 1 : PROFILES (Profils joueurs liés à auth.users)
-- ==============================================================================
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique,
    display_name text,
    avatar_url text,
    rating integer not null default 1500 check (rating >= 100),
    experience_level text check (experience_level in ('beginner', 'intermediate', 'expert')) default 'intermediate',
    preferred_theme text default 'midnight',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- RLS pour profiles
alter table public.profiles enable row level security;

-- N'importe qui peut lire les profils publics (classement, adversaire)
create policy "Les profils sont consultables par tous les utilisateurs authentifiés"
    on public.profiles for select
    to authenticated
    using (true);

-- Seul le propriétaire peut créer son profil
create policy "Les utilisateurs peuvent insérer leur propre profil"
    on public.profiles for insert
    to authenticated
    with check (auth.uid() = id);

-- Seul le propriétaire peut modifier son profil
create policy "Les utilisateurs peuvent modifier leur propre profil"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Seul le propriétaire peut supprimer son profil
create policy "Les utilisateurs peuvent supprimer leur propre profil"
    on public.profiles for delete
    to authenticated
    using (auth.uid() = id);

-- ==============================================================================
-- TABLE 2 : GAMES (Parties & matches joués)
-- ==============================================================================
create table if not exists public.games (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    opponent_type text not null check (opponent_type in ('ai', 'human')) default 'ai',
    opponent_difficulty text check (opponent_difficulty in ('beginner', 'intermediate', 'expert')),
    match_length integer not null default 7 check (match_length >= 0),
    score_x integer not null default 0 check (score_x >= 0),
    score_o integer not null default 0 check (score_o >= 0),
    winner text check (winner in ('X', 'O')),
    win_type text check (win_type in ('single', 'gammon', 'backgammon', 'pass')),
    points_won integer default 0 check (points_won >= 0),
    cube_value integer not null default 1 check (cube_value >= 1),
    cube_owner text check (cube_owner in ('X', 'O')),
    is_crawford boolean not null default false,
    status text not null check (status in ('in_progress', 'completed', 'abandoned')) default 'in_progress',
    started_at timestamptz not null default now(),
    ended_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index pour les requêtes fréquentes
create index if not exists idx_games_user_id on public.games(user_id);
create index if not exists idx_games_status on public.games(status);
create index if not exists idx_games_created_at on public.games(created_at desc);

-- RLS pour games (Strictement réservé au propriétaire de la partie)
alter table public.games enable row level security;

create policy "Les utilisateurs peuvent voir uniquement leurs propres parties"
    on public.games for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Les utilisateurs peuvent créer des parties pour eux-mêmes"
    on public.games for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Les utilisateurs peuvent modifier uniquement leurs propres parties"
    on public.games for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Les utilisateurs peuvent supprimer uniquement leurs propres parties"
    on public.games for delete
    to authenticated
    using (auth.uid() = user_id);

-- ==============================================================================
-- TABLE 3 : MOVES (Historique coup par coup avec analyse GNU Backgammon)
-- ==============================================================================
create table if not exists public.moves (
    id uuid primary key default gen_random_uuid(),
    game_id uuid not null references public.games(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    move_number integer not null check (move_number >= 1),
    player text not null check (player in ('X', 'O')),
    dice smallint[] not null,
    move_notation text not null,
    board_before smallint[] not null,
    board_after smallint[] not null,
    equity_loss numeric(6, 4),
    verdict text check (verdict in ('optimal', 'bon', 'douteux', 'blunder', 'howler', 'good', 'doubtful')),
    optimal_move text,
    played_at timestamptz not null default now()
);

create index if not exists idx_moves_game_id on public.moves(game_id);
create index if not exists idx_moves_user_id on public.moves(user_id);
create index if not exists idx_moves_verdict on public.moves(verdict);

-- RLS pour moves (Strictement réservé au propriétaire de la partie)
alter table public.moves enable row level security;

create policy "Les utilisateurs peuvent voir uniquement leurs propres coups"
    on public.moves for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Les utilisateurs peuvent insérer leurs propres coups"
    on public.moves for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Les utilisateurs peuvent supprimer leurs propres coups"
    on public.moves for delete
    to authenticated
    using (auth.uid() = user_id);

-- ==============================================================================
-- TABLE 4 : COACH_EXPLANATIONS (Explications générées par le Coach IA)
-- ==============================================================================
create table if not exists public.coach_explanations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    game_id uuid references public.games(id) on delete cascade,
    move_id uuid references public.moves(id) on delete cascade,
    position_key text not null,
    played_move text not null,
    optimal_move text not null,
    verdict text not null,
    equity_loss numeric(6, 4) not null,
    summary text not null,
    explanation text not null,
    key_concept text,
    advice text,
    source text not null check (source in ('llm', 'rule-based', 'cache')) default 'llm',
    created_at timestamptz not null default now()
);

create index if not exists idx_coach_explanations_user_id on public.coach_explanations(user_id);
create index if not exists idx_coach_explanations_pos_move on public.coach_explanations(position_key, played_move);
create index if not exists idx_coach_explanations_game_id on public.coach_explanations(game_id);

-- RLS pour coach_explanations (Strictement réservé à l'utilisateur)
alter table public.coach_explanations enable row level security;

create policy "Les utilisateurs peuvent consulter uniquement leurs propres explications coach"
    on public.coach_explanations for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Les utilisateurs peuvent enregistrer des explications coach pour eux-mêmes"
    on public.coach_explanations for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Les utilisateurs peuvent supprimer leurs propres explications coach"
    on public.coach_explanations for delete
    to authenticated
    using (auth.uid() = user_id);

-- ==============================================================================
-- TABLE 5 : USER_STATS (Statistiques agrégées du joueur)
-- ==============================================================================
create table if not exists public.user_stats (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    games_played integer not null default 0 check (games_played >= 0),
    games_won integer not null default 0 check (games_won >= 0),
    games_lost integer not null default 0 check (games_lost >= 0),
    gammons_won integer not null default 0 check (gammons_won >= 0),
    backgammons_won integer not null default 0 check (backgammons_won >= 0),
    total_blunders integer not null default 0 check (total_blunders >= 0),
    total_errors integer not null default 0 check (total_errors >= 0),
    total_equity_loss numeric(8, 4) not null default 0.0,
    average_error_rate numeric(6, 4) not null default 0.0,
    updated_at timestamptz not null default now()
);

-- RLS pour user_stats
alter table public.user_stats enable row level security;

create policy "Les utilisateurs peuvent consulter leurs propres statistiques"
    on public.user_stats for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Les utilisateurs peuvent insérer leurs statistiques initiales"
    on public.user_stats for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Les utilisateurs peuvent modifier leurs statistiques"
    on public.user_stats for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ==============================================================================
-- TRIGGERS & FONCTIONS AUTOMATIQUES
-- ==============================================================================

-- 1. Fonction automatique de création de profil & stats lors de l'inscription auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, username, display_name, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)),
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
    )
    on conflict (id) do nothing;

    insert into public.user_stats (user_id)
    values (new.id)
    on conflict (user_id) do nothing;

    return new;
end;
$$ language plpgsql security definer;

-- Trigger sur auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- 2. Fonction mise à jour automatique de updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();

create trigger trg_games_updated_at
    before update on public.games
    for each row execute function public.set_updated_at();

create trigger trg_user_stats_updated_at
    before update on public.user_stats
    for each row execute function public.set_updated_at();
