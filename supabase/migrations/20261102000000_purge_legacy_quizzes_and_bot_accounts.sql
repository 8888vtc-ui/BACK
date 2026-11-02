-- =============================================================================
-- Migration : 20261102000000_purge_legacy_quizzes_and_bot_accounts.sql
-- Description : Purge intégrale (TRUNCATE / DELETE) des anciens quiz/puzzles non
--               certifiés GNUBG 3-ply, du cache d'explications legacy et de toute
--               salle ou partie simulée générée par d'anciens bots locaux.
-- =============================================================================

-- 1. Purge intégrale de 100 % des anciens puzzles, cartes FSRS et erreurs récurrentes
TRUNCATE TABLE
    public.daily_puzzles,
    public.fsrs_reviews,
    public.fsrs_cards,
    public.recurring_errors,
    public.coach_explanations_cache
RESTART IDENTITY CASCADE;

-- 2. Suppression de toute salle ou partie simulée issue d'anciens bots ou mocks
DELETE FROM public.rooms
WHERE id LIKE 'mock_%'
   OR id LIKE 'bot_%'
   OR player_x LIKE 'bot_%'
   OR player_o LIKE 'bot_%';

