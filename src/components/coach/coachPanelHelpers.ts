/**
 * Helpers purs du panneau Coach (aucune dépendance React / DOM, < 290 lignes, 0 any).
 */

import type { DecisionCounters } from './CoachPrDashboard';
import type { CandidateRow } from './CoachCandidatesTable';
import type { MatchContext, BuildMatchContextParams, StrategicFeatures } from '../../features/coach';
import { buildMatchContext } from '../../features/coach';
import type { RolloutResult } from '../../lib/engine/rolloutClient';
import type { RawGameTurn } from '../../features/rating/types';
import type { CoachVerdict } from '../../features/coach/logAnalyzer';
import type { PedagogicalExplanation, SymbolicAudit } from '../../lib/coach/symbolicAudit';

export type CoachDisplayVerdict = CoachVerdict | 'doubtful';

export interface CoachPanelProps {
    verdict: CoachDisplayVerdict | null;
    equityLoss: number | null;
    playedMove: string | null;
    optimalMove: string | null;
    explanation?: string | null;
    whyFailed?: string | null;
    whyOptimal?: string | null;
    summary?: string | null;
    tacticalSummary?: string | null;
    onExplain?: () => void;
    onDismiss: () => void;
    onOpenKnowledgeConcept?: (conceptId: string) => void;
    isLoading?: boolean;
    features?: StrategicFeatures;
    matchStats?: MatchStats;
    topMoves?: CandidateMove[];
    boardBefore?: number[];
    onReplayMove?: () => void;
    matchContext?: MatchContext | Partial<BuildMatchContextParams>;
    playerLevel?: 'beginner' | 'intermediate' | 'expert';
    apiUrl?: string;
    triggerMode?: 'auto' | 'manual';
    onTriggerModeChange?: (mode: 'auto' | 'manual') => void;
    autoThreshold?: 'blunder' | 'doubtful';
    onAutoThresholdChange?: (threshold: 'blunder' | 'doubtful') => void;
    isOffline?: boolean;
    onOfflineToggle?: (offline: boolean) => void;
    positionKey?: string | null;
    gameId?: string | null;
    dice?: [number, number] | null;
    board?: number[];
    xgid?: string | null;
    candidateMoves?: string[];
    showRollout?: boolean;
    onRolloutCompleted?: (result: RolloutResult) => void;
    onBlunderClick?: () => void;
    onCandidateHover?: (notation: string | null) => void;
    turnsHistory?: RawGameTurn[] | unknown[];
    matchStatsO?: MatchStats;
}

export interface MatchStats {
    decisionsCount: number;
    totalEquityLoss: number;
    blundersCount: number;
    decisionCounters?: DecisionCounters;
}

export interface CandidateMove {
    rank: number;
    notation: string;
    equity: number;
    equityLoss: number;
    winProbability?: number;
    gammonProbability?: number;
    backgammonProbability?: number;
}

export interface ParsedExplanation {
    summary?: string;
    explanation?: string;
    keyConcept?: string;
    advice?: string;
    whyFailed?: string;
    whyOptimal?: string;
    conceptId?: string;
    symbolicAudit?: SymbolicAudit;
    pedagogicalExplanation?: PedagogicalExplanation;
    rawText: string;
}

export function formatGammonPrice(val?: number): string {
    return val === undefined || isNaN(val) ? '0.50' : val.toFixed(2);
}

export function formatPercent(val?: number): string {
    return val === undefined || isNaN(val) ? '25.0%' : `${(val * 100).toFixed(1)}%`;
}

export function computePerformanceRating(stats: MatchStats): number {
    return stats.decisionsCount === 0 ? 0 : (stats.totalEquityLoss / stats.decisionsCount) * 500;
}

export function getPRBadge(pr: number): string {
    if (pr < 3.0) return 'Grandmaster';
    if (pr < 5.0) return 'Master';
    if (pr < 7.5) return 'Expert';
    if (pr < 10.0) return 'Advanced';
    if (pr < 15.0) return 'Intermédiaire';
    return 'Débutant';
}

export function getPRColor(pr: number): string {
    if (pr < 3.0) return 'text-emerald-400';
    if (pr < 5.0) return 'text-green-400';
    if (pr < 7.5) return 'text-blue-400';
    if (pr < 10.0) return 'text-cyan-400';
    if (pr < 15.0) return 'text-yellow-400';
    return 'text-red-400';
}

export interface MasterBookPromo {
    author: string;
    bookTitle: string;
    conceptSnippet: string;
    conceptId: string;
    buyUrl: string;
    publisher: string;
}

export function getMasterBookRecommendation(conceptId?: string, keyConcept?: string): MasterBookPromo {
    const text = `${conceptId || ''} ${keyConcept || ''}`.toLowerCase();
    if (/course|race|bearoff|endgame|fin/.test(text)) {
        return {
            author: 'Maître Kenji Sato & Walter Trice',
            bookTitle: 'Technique de Fin de Partie (Amoeba & EPC)',
            conceptSnippet: '« Façonnez vos pions comme une amibe ("Amoeba Play") pour ne jamais concéder de tir direct sous contact. »',
            conceptId: 'michy-endgame-technique',
            buyUrl: '/academy/concepts/michy-endgame-technique',
            publisher: 'Académie Royale Monte-Carlo',
        };
    }
    if (/opening|ouverture|tiger|mountain|split/.test(text)) {
        return {
            author: 'Maître Kenji Sato',
            bookTitle: 'Les 21 Proverbes d’Ouverture (Académie Monte-Carlo)',
            conceptSnippet: '« Mémorisez les 21 proverbes d’or pour maîtriser les 15 lancers d’ouverture sans hésitation. »',
            conceptId: 'michy-proverbs-opening',
            buyUrl: '/academy/concepts/michy-proverbs-opening',
            publisher: 'Académie Royale Monte-Carlo',
        };
    }
    if (/cube|videau|met|pr|duplication/.test(text)) {
        return {
            author: 'Viktor Orlov (L’Oracle de Monte-Carlo)',
            bookTitle: 'Masterclass Équité & Duplication 3-Ply',
            conceptSnippet: '« Les secrets de pureté et de calcul d’équité dynamique expliqués par le Grand-Maître Monte-Carlo. »',
            conceptId: 'mochy-masterclass',
            buyUrl: '/academy/concepts/mochy-masterclass',
            publisher: 'Académie Royale Monte-Carlo',
        };
    }
    return {
        author: 'Viktor Orlov & Paul Magriel',
        bookTitle: 'Concepts Stratégiques Grand-Maître',
        conceptSnippet: '« Ne dispersez aucun blot sans ancre de repli : la structure des ancres est la fondation absolue de toute stratégie. »',
        conceptId: 'tardieu-strategic-concepts',
        buyUrl: '/academy/concepts/tardieu-strategic-concepts',
        publisher: 'Académie Royale Monte-Carlo',
    };
}

/** Extrait les champs structurés du flux JSON, y compris en cours de streaming partiel. */
export function parseStreamedExplanation(text: string): ParsedExplanation {
    if (!text) return { rawText: '' };

    try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        if (typeof parsed === 'object' && parsed !== null) {
            const ped = parsed.pedagogical_explanation as PedagogicalExplanation | undefined;
            const sym = parsed.symbolic_audit as SymbolicAudit | undefined;
            const summary =
                typeof parsed.summary === 'string'
                    ? parsed.summary
                    : typeof ped?.headline === 'string'
                      ? ped.headline
                      : undefined;
            const explanation =
                typeof parsed.explanation === 'string'
                    ? parsed.explanation
                    : typeof ped?.tactical_rationale === 'string'
                      ? ped.tactical_rationale
                      : undefined;
            return {
                summary,
                explanation,
                keyConcept: typeof parsed.keyConcept === 'string' ? parsed.keyConcept : sym?.dominant_theme,
                advice: typeof parsed.advice === 'string' ? parsed.advice : ped?.zare_luck_vs_skill,
                whyFailed: typeof parsed.whyFailed === 'string' ? parsed.whyFailed : ped?.idea_problem_solution?.structural_problem,
                whyOptimal: typeof parsed.whyOptimal === 'string' ? parsed.whyOptimal : ped?.idea_problem_solution?.canonical_solution,
                conceptId: typeof parsed.conceptId === 'string' ? parsed.conceptId : undefined,
                symbolicAudit: sym,
                pedagogicalExplanation: ped,
                rawText: explanation ?? text,
            };
        }
    } catch {
        // Streaming partiel : parsing progressif par expressions régulières
    }

    const unescapeJson = (str?: string) => (str ? str.replace(/\\n/g, '\n').replace(/\\"/g, '"') : undefined);
    const extractedSummary =
        unescapeJson(text.match(/"summary":\s*"((?:[^"\\]|\\.)*)/)?.[1]) ??
        unescapeJson(text.match(/"headline":\s*"((?:[^"\\]|\\.)*)/)?.[1]);
    const extractedExplanation =
        unescapeJson(text.match(/"explanation":\s*"((?:[^"\\]|\\.)*)/)?.[1]) ??
        unescapeJson(text.match(/"tactical_rationale":\s*"((?:[^"\\]|\\.)*)/)?.[1]);
    const extractedConcept = unescapeJson(text.match(/"keyConcept":\s*"((?:[^"\\]|\\.)*)/)?.[1]);
    const extractedAdvice =
        unescapeJson(text.match(/"advice":\s*"((?:[^"\\]|\\.)*)/)?.[1]) ??
        unescapeJson(text.match(/"zare_luck_vs_skill":\s*"((?:[^"\\]|\\.)*)/)?.[1]);
    const extractedWhyFailed = unescapeJson(text.match(/"whyFailed":\s*"((?:[^"\\]|\\.)*)/)?.[1]);
    const extractedWhyOptimal = unescapeJson(text.match(/"whyOptimal":\s*"((?:[^"\\]|\\.)*)/)?.[1]);
    const extractedConceptId = text.match(/"conceptId":\s*"([a-z0-9-]+)"/)?.[1];

    if (extractedExplanation || extractedSummary || extractedWhyFailed) {
        return {
            summary: extractedSummary,
            explanation: extractedExplanation,
            keyConcept: extractedConcept,
            advice: extractedAdvice,
            whyFailed: extractedWhyFailed,
            whyOptimal: extractedWhyOptimal,
            conceptId: extractedConceptId,
            rawText: extractedExplanation || text,
        };
    }

    return { rawText: text };
}

export function resolveMatchContext(
    raw?: MatchContext | Partial<BuildMatchContextParams> | null,
): MatchContext | null {
    if (!raw) return null;
    if ('gammonPrice' in raw && 'takePoint' in raw && 'pointsToWin' in raw) return raw as MatchContext;
    return buildMatchContext({
        matchLength: raw.matchLength ?? 7,
        scoreX: raw.scoreX ?? 0,
        scoreO: raw.scoreO ?? 0,
        crawford: raw.crawford,
        cubeValue: raw.cubeValue ?? 1,
        cubeOwner: raw.cubeOwner ?? null,
    });
}

export function buildCandidateRows(topMoves?: CandidateMove[]): CandidateRow[] {
    if (!topMoves || topMoves.length === 0) return [];
    return topMoves.slice(0, 5).map((m, index) => ({
        rank: m.rank ?? index + 1,
        notation: m.notation,
        equity: m.equity,
        equityLoss: m.equityLoss,
        winProbability: m.winProbability,
        gammonProbability: m.gammonProbability,
        backgammonProbability: m.backgammonProbability,
    }));
}

export function deriveDecisionCounters(matchStats?: MatchStats): DecisionCounters {
    if (matchStats?.decisionCounters) return matchStats.decisionCounters;
    const blunders = matchStats?.blundersCount ?? 0;
    const decisions = matchStats?.decisionsCount ?? 0;
    return { optimal: Math.max(0, decisions - blunders), good: 0, inaccuracy: 0, blunder: blunders };
}

export function shouldAutoTriggerExplanation(
    verdict: CoachDisplayVerdict | null,
    playedMove: string | null,
    triggerMode: 'auto' | 'manual',
    autoThreshold: 'blunder' | 'doubtful',
): boolean {
    if (!verdict || !playedMove || triggerMode !== 'auto') return false;
    const trimmed = playedMove.trim();
    if (
        trimmed.startsWith('Videau') ||
        /^(Double|No double|Take|Pass|Redouble|Beaver)\b/i.test(trimmed)
    ) {
        return false;
    }
    if (verdict === 'blunder') return true;
    return autoThreshold === 'doubtful' && (verdict === 'doubtful' || verdict === 'inaccuracy');
}

export function buildCoachViewLabels(t: (key: string) => string) {
    return {
        title: t('coach.title'),
        close: t('common.close'),
        sourceCache: t('coach.sourceCache'),
        sourceRuleBased: t('coach.sourceRuleBased'),
        sourceLlm: t('coach.sourceLlm'),
        retry: t('common.retry'),
        explainError: t('coach.explainError'),
    };
}
