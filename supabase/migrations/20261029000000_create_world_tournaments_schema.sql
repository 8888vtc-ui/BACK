-- =============================================================================
-- Migration : Base de Données Mondiale des Tournois Backgammon Tour
-- Tables : public.tournaments & public.user_tournament_bookmarks
-- Classification : 'moyen' (15-50 j.), 'grand' (50-150 j.), 'mega' (150+ j. / Majors)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('moyen', 'grand', 'mega')),
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
    registration_deadline DATE,
    country_code CHAR(2) NOT NULL,
    country_name TEXT NOT NULL,
    city TEXT NOT NULL,
    venue_name TEXT NOT NULL,
    region TEXT NOT NULL CHECK (region IN ('europe', 'north_america', 'middle_east', 'asia_pacific', 'latin_america')),
    federation TEXT NOT NULL DEFAULT 'WBGF' CHECK (federation IN ('WBGF', 'USBGF', 'FFB', 'UKBGF', 'EUBGF', 'WBA', 'Independent')),
    entry_fee_main NUMERIC(10, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'GBP', 'CHF', 'JPY')),
    estimated_prize_pool NUMERIC(12, 2),
    expected_players_min INTEGER NOT NULL DEFAULT 32,
    expected_players_max INTEGER NOT NULL DEFAULT 128,
    match_length_main INTEGER NOT NULL DEFAULT 13,
    clock_rules TEXT NOT NULL DEFAULT 'Fischer 12s/move + 2min/pt',
    speed_variant TEXT NOT NULL DEFAULT 'classic' CHECK (speed_variant IN ('classic', 'blitz', 'doubles', 'chouette')),
    side_events TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    official_url TEXT NOT NULL,
    registration_url TEXT,
    organizer_name TEXT NOT NULL,
    description_fr TEXT NOT NULL,
    description_en TEXT NOT NULL DEFAULT '',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tournaments_dates_check CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_tournaments_dates_tier ON public.tournaments (start_date ASC, tier);
CREATE INDEX IF NOT EXISTS idx_tournaments_region_country ON public.tournaments (region, country_code);
CREATE INDEX IF NOT EXISTS idx_tournaments_federation ON public.tournaments (federation);
CREATE INDEX IF NOT EXISTS idx_tournaments_verified ON public.tournaments (is_verified);

-- Table d'agenda personnel (tournois suivis / épinglés par un joueur)
CREATE TABLE IF NOT EXISTS public.user_tournament_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tournament_id TEXT NOT NULL,
    reminder_enabled BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, tournament_id)
);

CREATE INDEX IF NOT EXISTS idx_user_tournament_bookmarks_user ON public.user_tournament_bookmarks (user_id);

-- Sécurité RLS (Row Level Security)
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tournament_bookmarks ENABLE ROW LEVEL SECURITY;

-- Lecture publique des tournois vérifiés (et des tournois soumis par leur auteur)
CREATE POLICY "Public read verified tournaments"
    ON public.tournaments
    FOR SELECT
    USING (is_verified = true OR auth.uid() = submitted_by);

-- Soumission d'un tournoi par un organisateur authentifié (is_verified forcé à false)
CREATE POLICY "Authenticated users can submit tournament"
    ON public.tournaments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = submitted_by AND is_verified = false);

-- Gestion de l'agenda personnel par le propriétaire
CREATE POLICY "Users manage own tournament bookmarks"
    ON public.user_tournament_bookmarks
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

