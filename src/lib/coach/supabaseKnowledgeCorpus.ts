/**
 * @file src/lib/coach/supabaseKnowledgeCorpus.ts
 * @description Agrégateur et service Supabase du Corpus de Connaissances Grand-Maître
 * (`public.coach_knowledge_corpus`) pour assister le Coach IA Neuro-Symbolique :
 * - 30 Concepts Théoriques Grand-Maître (`KNOWLEDGE_BASE_CONCEPTS`)
 * - 10 Proverbes Neuro-Symboliques de Michy & Magriel (`MICHY_AND_MAGRIEL_PROVERBS`)
 * - 18 Motifs Géométriques XAI (« Cercle Monte-Carlo »)
 * - 7 Formules Mathématiques de Videau & Course (Timmes 2026, Isight, Keith, Trice, Benjamin 3v3, EPC, Janowski 2013)
 * - 15 Rouleaux d'Ouverture Certifiés Monte-Carlo 3-Ply (PR 0.23)
 * - 18 Termes Officiels du Glossaire Polyglotte WBGF en 7 Langues (FR, EN, DE, ES, IT, JA, AR)
 *
 * Strictement < 260 lignes, 0 `any`.
 */

import { KNOWLEDGE_BASE_CONCEPTS } from '../../features/knowledge/knowledgeBaseData';
import type { MotifId } from '../../features/coach/detectPositionalMotif';
import { MICHY_AND_MAGRIEL_PROVERBS } from './michyProverbs';
import { WBGF_MULTILINGUAL_GLOSSARY } from './ttsPhoneticTransducer';
import {
    POSITIONAL_MOTIFS_CATALOG,
    RACE_CUBE_AND_MET_FORMULAS,
    OPENING_ROLLS_3PLY,
} from './supabaseKnowledgeCatalogs';
import { supabase, isSupabaseConfigured } from '../supabase/client';

export type KnowledgeCorpusType =
    | 'theory_concept'
    | 'michy_proverb'
    | 'positional_motif'
    | 'race_cube_formula'
    | 'opening_roll_3ply'
    | 'wbgf_glossary_7lang';

export type CorpusDominantTheme =
    | 'RACE'
    | 'BLITZ'
    | 'PRIME'
    | 'HOLDING'
    | 'BEAROFF'
    | 'CUBE'
    | 'OPENING'
    | 'TERMINOLOGY';

export interface CoachKnowledgeCorpusRow {
    readonly id: string;
    readonly slug: string;
    readonly corpus_type: KnowledgeCorpusType;
    readonly category: string;
    readonly difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master';
    readonly author: string;
    readonly motif_id: string | null;
    readonly dominant_theme: CorpusDominantTheme;
    readonly title_fr: string;
    readonly title_en: string;
    readonly summary_fr: string;
    readonly summary_en: string;
    readonly golden_rule_fr: string;
    readonly golden_rule_en: string;
    readonly socratic_question_fr: string | null;
    readonly socratic_question_en: string | null;
    readonly formula_expression: string | null;
    readonly xgid_example: string | null;
    readonly tags: readonly string[];
    readonly translations_json: Record<string, string>;
    readonly payload_json: Record<string, unknown>;
}

/**
 * Construit le corpus complet déterministe (98 entrées certifiées) prêt à être
 * injecté dans `public.coach_knowledge_corpus` sur Supabase ou interrogé en mémoire.
 */
export function buildFullCoachKnowledgeCorpus(): CoachKnowledgeCorpusRow[] {
    const rows: CoachKnowledgeCorpusRow[] = [];

    for (const c of KNOWLEDGE_BASE_CONCEPTS) {
        rows.push({
            id: `concept:${c.id}`,
            slug: c.slug,
            corpus_type: 'theory_concept',
            category: c.category,
            difficulty: c.difficulty,
            author: c.author,
            motif_id: null,
            dominant_theme:
                c.category === 'cube-theory' || c.category === 'match-play'
                    ? 'CUBE'
                    : c.category === 'race-bearoff'
                      ? 'RACE'
                      : c.category === 'openings'
                        ? 'OPENING'
                        : 'PRIME',
            title_fr: c.title.fr,
            title_en: c.title.en,
            summary_fr: c.summary.fr,
            summary_en: c.summary.en,
            golden_rule_fr: c.goldenRule.fr,
            golden_rule_en: c.goldenRule.en,
            socratic_question_fr: c.keyTakeaway.fr,
            socratic_question_en: c.keyTakeaway.en,
            formula_expression: c.formulaOrRule?.formula ?? null,
            xgid_example: null,
            tags: c.tags,
            translations_json: { fr: c.title.fr, en: c.title.en },
            payload_json: {
                explanation: c.explanation,
                practicalExamples: c.practicalExamples,
                sources: c.sources,
            },
        });
    }

    for (const [key, p] of Object.entries(MICHY_AND_MAGRIEL_PROVERBS)) {
        const slug = `proverb-${key.toLowerCase().replace(/_/g, '-')}`;
        rows.push({
            id: `proverb:${key}`,
            slug,
            corpus_type: 'michy_proverb',
            category: 'rules-of-thumb',
            difficulty: 'intermediate',
            author: p.author,
            motif_id: null,
            dominant_theme: p.theme,
            title_fr: p.name,
            title_en: p.name,
            summary_fr: p.proverbFr,
            summary_en: p.proverbEn,
            golden_rule_fr: p.tacticalRuleFr,
            golden_rule_en: p.tacticalRuleEn,
            socratic_question_fr: p.socraticQuestionFr,
            socratic_question_en: p.socraticQuestionEn,
            formula_expression: null,
            xgid_example: null,
            tags: ['michy', 'proverb', p.theme.toLowerCase(), p.id],
            translations_json: { fr: p.proverbFr, en: p.proverbEn },
            payload_json: { conceptId: p.id },
        });
    }

    for (const m of POSITIONAL_MOTIFS_CATALOG) {
        const slug = `motif-${m.motifId.toLowerCase().replace(/_/g, '-')}`;
        rows.push({
            id: `motif:${m.motifId}`,
            slug,
            corpus_type: 'positional_motif',
            category: 'fundamentals',
            difficulty: 'intermediate',
            author: 'Cercle Monte-Carlo XAI (18 Motifs)',
            motif_id: m.motifId,
            dominant_theme: m.theme,
            title_fr: m.titleFr,
            title_en: m.titleEn,
            summary_fr: m.summaryFr,
            summary_en: m.summaryEn,
            golden_rule_fr: m.goldenRuleFr,
            golden_rule_en: m.goldenRuleEn,
            socratic_question_fr: null,
            socratic_question_en: null,
            formula_expression: null,
            xgid_example: null,
            tags: ['xai-motif', m.motifId.toLowerCase(), m.theme.toLowerCase()],
            translations_json: { fr: m.titleFr, en: m.titleEn },
            payload_json: { motifId: m.motifId },
        });
    }

    for (const f of RACE_CUBE_AND_MET_FORMULAS) {
        rows.push({
            id: `formula:${f.id}`,
            slug: f.slug,
            corpus_type: 'race_cube_formula',
            category: 'race-bearoff',
            difficulty: 'advanced',
            author: f.author,
            motif_id: 'BEAROFF_WASTAGE_EPC',
            dominant_theme: 'RACE',
            title_fr: f.titleFr,
            title_en: f.titleEn,
            summary_fr: f.summaryFr,
            summary_en: f.summaryEn,
            golden_rule_fr: f.summaryFr,
            golden_rule_en: f.summaryEn,
            socratic_question_fr: null,
            socratic_question_en: null,
            formula_expression: f.formula,
            xgid_example: null,
            tags: ['formula', 'race', 'cube', f.slug],
            translations_json: { fr: f.titleFr, en: f.titleEn },
            payload_json: { formula: f.formula },
        });
    }

    for (const o of OPENING_ROLLS_3PLY) {
        rows.push({
            id: `opening:${o.roll}`,
            slug: `opening-roll-${o.roll}`,
            corpus_type: 'opening_roll_3ply',
            category: 'openings',
            difficulty: 'beginner',
            author: 'Open Sage 3-Ply / eXtreme Gammon (PR 0.23)',
            motif_id: null,
            dominant_theme: 'OPENING',
            title_fr: `Ouverture ${o.roll} : ${o.bestMove}`,
            title_en: `Opening ${o.roll}: ${o.bestMove}`,
            summary_fr: o.summaryFr,
            summary_en: o.summaryEn,
            golden_rule_fr: `Meilleur coup 3-ply sur ${o.roll} : ${o.bestMove} (Alternative : ${o.altMove}).`,
            golden_rule_en: `Best 3-ply play on ${o.roll}: ${o.bestMove} (Alternative: ${o.altMove}).`,
            socratic_question_fr: null,
            socratic_question_en: null,
            formula_expression: o.bestMove,
            xgid_example: o.xgid,
            tags: ['opening', o.roll, '3-ply'],
            translations_json: { fr: o.summaryFr, en: o.summaryEn },
            payload_json: { roll: o.roll, bestMove: o.bestMove, altMove: o.altMove },
        });
    }

    for (const [termKey, translations] of Object.entries(WBGF_MULTILINGUAL_GLOSSARY)) {
        const slug = `wbgf-term-${termKey.toLowerCase().replace(/_/g, '-')}`;
        rows.push({
            id: `glossary:${termKey}`,
            slug,
            corpus_type: 'wbgf_glossary_7lang',
            category: 'fundamentals',
            difficulty: 'beginner',
            author: 'World Backgammon Federation (WBGF)',
            motif_id: null,
            dominant_theme: 'TERMINOLOGY',
            title_fr: translations.fr,
            title_en: translations.en,
            summary_fr: `Terme officiel WBGF : ${translations.fr} (EN: ${translations.en}, DE: ${translations.de}, ES: ${translations.es}, PT: ${translations.pt}, JA: ${translations.ja}, AR: ${translations.ar}).`,
            summary_en: `Official WBGF term: ${translations.en} (FR: ${translations.fr}, DE: ${translations.de}, ES: ${translations.es}, PT: ${translations.pt}, JA: ${translations.ja}, AR: ${translations.ar}).`,
            golden_rule_fr: translations.fr,
            golden_rule_en: translations.en,
            socratic_question_fr: null,
            socratic_question_en: null,
            formula_expression: null,
            xgid_example: null,
            tags: ['wbgf', 'glossary', '7-languages', termKey.toLowerCase()],
            translations_json: { ...translations },
            payload_json: { termId: termKey, translations },
        });
    }

    return rows;
}

const LOCAL_CORPUS_INDEX = buildFullCoachKnowledgeCorpus();

/**
 * Recherche déterministe (Supabase + index mémoire instantané 0 ms) pour enrichir le Coach IA.
 */
export async function queryCoachKnowledgeForContext(params: {
    readonly motifId?: MotifId | null;
    readonly dominantTheme?: CorpusDominantTheme | null;
    readonly diceRoll?: string | null;
}): Promise<CoachKnowledgeCorpusRow[]> {
    if (isSupabaseConfigured()) {
        try {
            let query = supabase.from('coach_knowledge_corpus').select('*');
            if (params.motifId) {
                query = query.eq('motif_id', params.motifId);
            } else if (params.dominantTheme) {
                query = query.eq('dominant_theme', params.dominantTheme);
            }
            const { data, error } = await query.limit(5);
            if (!error && Array.isArray(data) && data.length > 0) {
                return data as unknown as CoachKnowledgeCorpusRow[];
            }
        } catch {
            // Repli déterministe sur le même corpus certifié en mémoire
        }
    }

    return LOCAL_CORPUS_INDEX.filter((row) => {
        if (params.motifId && row.motif_id === params.motifId) return true;
        if (params.diceRoll && row.id === `opening:${params.diceRoll}`) return true;
        if (params.dominantTheme && row.dominant_theme === params.dominantTheme) return true;
        return false;
    }).slice(0, 5);
}
