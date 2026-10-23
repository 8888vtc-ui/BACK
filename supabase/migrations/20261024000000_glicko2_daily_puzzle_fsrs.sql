-- ==============================================================================
-- MIGRATION : GLICKO-2 PUZZLE RATING, STREAKS & ORDONNANCEUR FSRS
-- Tables étendues : public.profiles, public.recurring_errors
-- ==============================================================================

-- 1. Extension de public.profiles pour le Daily Puzzle (Streaks & Glicko-2 Puzzle Rating)
alter table public.profiles
    add column if not exists current_streak integer not null default 0 check (current_streak >= 0),
    add column if not exists max_streak integer not null default 0 check (max_streak >= 0),
    add column if not exists puzzle_rating integer not null default 1500 check (puzzle_rating >= 100),
    add column if not exists puzzle_rd numeric(6, 2) not null default 350.00 check (puzzle_rd >= 30.00),
    add column if not exists puzzle_volatility numeric(8, 6) not null default 0.060000,
    add column if not exists last_puzzle_date date;

-- 2. Extension de public.recurring_errors pour l'ordonnanceur à répétition espacée FSRS
alter table public.recurring_errors
    add column if not exists next_review_date timestamptz default (now() + interval '1 day'),
    add column if not exists repetition_count integer not null default 0 check (repetition_count >= 0),
    add column if not exists ease_factor numeric(4, 2) not null default 2.50 check (ease_factor >= 1.30),
    add column if not exists position_xgid text;

create index if not exists idx_recurring_errors_next_review
    on public.recurring_errors(user_id, next_review_date asc);
