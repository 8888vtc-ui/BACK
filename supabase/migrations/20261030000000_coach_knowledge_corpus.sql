-- ==============================================================================
-- MIGRATION : CORPUS EXHAUSTIF DE CONNAISSANCES DU COACH GRAND-MAÎTRE (RAG & XAI)
-- Date : 30 Octobre 2026
-- Objectif : Stocker dans Supabase (`public.coach_knowledge_corpus`) l'intégralité
--            des bases de connaissances certifiées pour assister le Coach IA :
--            1. Les 30 Concepts Théoriques Grand-Maître (Magriel, Trice, Woolsey,
--               Robertie, Olsen, Kazaross, Mochy)
--            2. Les Proverbes Neuro-Symboliques de Michy (Michihito Kageyama) & Magriel
--            3. La Taxonomie fermée des 18 Motifs Géométriques XAI (Cercle Monte-Carlo)
--            4. Les 6 Algorithmes de Videau en Course (Timmes 2026, Isight, Keith,
--               Trice/Benjamin, Benjamin 3v3, EPC 7n+1) & Équations de Janowski (2013)
--            5. Les 15 Rouleaux d'Ouverture Certifiés Monte-Carlo 3-Ply (PR 0.23)
--            6. Le Glossaire Polyglotte Officiel WBGF en 7 Langues (FR, EN, DE, ES, IT, JA, AR)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.coach_knowledge_corpus (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    corpus_type TEXT NOT NULL CHECK (corpus_type IN (
        'theory_concept',
        'michy_proverb',
        'positional_motif',
        'race_cube_formula',
        'opening_roll_3ply',
        'wbgf_glossary_7lang'
    )),
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'master')),
    author TEXT NOT NULL,
    motif_id TEXT,
    dominant_theme TEXT CHECK (dominant_theme IN ('RACE', 'BLITZ', 'PRIME', 'HOLDING', 'BEAROFF', 'CUBE', 'OPENING', 'TERMINOLOGY')),
    title_fr TEXT NOT NULL,
    title_en TEXT NOT NULL,
    summary_fr TEXT NOT NULL,
    summary_en TEXT NOT NULL,
    golden_rule_fr TEXT NOT NULL DEFAULT '',
    golden_rule_en TEXT NOT NULL DEFAULT '',
    socratic_question_fr TEXT,
    socratic_question_en TEXT,
    formula_expression TEXT,
    xgid_example TEXT,
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    translations_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    payload_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_knowledge_corpus_type ON public.coach_knowledge_corpus (corpus_type);
CREATE INDEX IF NOT EXISTS idx_coach_knowledge_corpus_category ON public.coach_knowledge_corpus (category);
CREATE INDEX IF NOT EXISTS idx_coach_knowledge_corpus_motif ON public.coach_knowledge_corpus (motif_id);
CREATE INDEX IF NOT EXISTS idx_coach_knowledge_corpus_theme ON public.coach_knowledge_corpus (dominant_theme);
CREATE INDEX IF NOT EXISTS idx_coach_knowledge_corpus_tags ON public.coach_knowledge_corpus USING GIN (tags);

ALTER TABLE public.coach_knowledge_corpus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique globale du corpus de connaissances du Coach"
    ON public.coach_knowledge_corpus;

CREATE POLICY "Lecture publique globale du corpus de connaissances du Coach"
    ON public.coach_knowledge_corpus
    FOR SELECT
    TO anon, authenticated
    USING (true);

