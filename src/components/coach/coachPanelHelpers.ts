/**
 * Helpers purs du panneau Coach (aucune dépendance React / DOM).
 *
 * Rôle :
 *   - Types partagés (`MatchStats`, `CandidateMove`, `ParsedExplanation`, `CoachPanelProps`).
 *   - Calcul du Performance Rating et de son badge de niveau.
 *   - Parsing incrémental du flux JSON d'explication (streaming SSE).
 *   - Recommandation d'ouvrage de référence et helpers de déclenchement.
 *
 * Module 100 % pur : testable sans DOM (< 300 lignes, 0 any).
 */

import type { DecisionCounters } from './CoachPrDashboard';
import type { CandidateRow } from './CoachCandidatesTable';
import type { MatchContext, BuildMatchContextParams, StrategicFeatures } from '../../features/coach';
import { buildMatchContext } from '../../features/coach';
import type { RolloutResult } from '../../lib/engine/rolloutClient';
import type { RawGameTurn } from '../../features/rating/types';
import type { CoachVerdict } from '../../features/coach/logAnalyzer';

/** Verdict affiché dans le panneau Coach (4 paliers officiels + alias legacy 'doubtful'). */
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
    /** Diagnostic stratégique automatique en français (tacticalExplainer). */
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
    rawText: string;
}

export function formatGammonPrice(val?: number): string {
    if (val === undefined || isNaN(val)) return '0.50';
    return val.toFixed(2);
}

export function formatPercent(val?: number): string {
    if (val === undefined || isNaN(val)) return '25.0%';
    return `${(val * 100).toFixed(1)}%`;
}

/** Calcule le Performance Rating (PR) : (totalEquityLoss / decisionsCount) * 500. */
export function computePerformanceRating(stats: MatchStats): number {
    if (stats.decisionsCount === 0) return 0;
    return (stats.totalEquityLoss / stats.decisionsCount) * 500;
}

/** Détermine le badge de niveau à partir du PR (aligné sur getPRCategory). */
export function getPRBadge(pr: number): string {
    if (pr < 3.0) return 'Grandmaster';
    if (pr < 5.0) return 'Master';
    if (pr < 7.5) return 'Expert';
    if (pr < 10.0) return 'Advanced';
    if (pr < 15.0) return 'Intermédiaire';
    return 'Débutant';
}

/** Classe Tailwind de couleur du PR selon le niveau. */
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

    if (text.includes('course') || text.includes('race') || text.includes('bearoff') || text.includes('endgame') || text.includes('fin')) {
        return {
            author: 'Michihito Kageyama (Michy)',
            bookTitle: 'Endgame Technique (Backgammon Odyssey Vol. 2)',
            conceptSnippet: '« Façonnez vos pions comme une amibe ("Amoeba Play") pour ne jamais concéder de tir direct sous contact. »',
            conceptId: 'michy-endgame-technique',
            buyUrl: 'https://bgmichy.com/authors',
            publisher: 'bgmichy.com',
        };
    }

    if (text.includes('opening') || text.includes('ouverture') || text.includes('tiger') || text.includes('mountain') || text.includes('split')) {
        return {
            author: 'Michihito Kageyama & Roland Herrera',
            bookTitle: 'Opening Concepts (Backgammon Odyssey Vol. 1)',
            conceptSnippet: '« Mémorisez les 21 proverbes d’or pour maîtriser les 15 lancers d’ouverture sans hésitation. »',
            conceptId: 'michy-proverbs-opening',
            buyUrl: 'https://bgmichy.com/authors',
            publisher: 'bgmichy.com',
        };
    }

    if (text.includes('cube') || text.includes('videau') || text.includes('met') || text.includes('pr') || text.includes('duplication')) {
        return {
            author: 'Masayuki Mochizuki (Mochy) & Marc Olsen',
            bookTitle: 'Backgammon Masterclass (2023)',
            conceptSnippet: '« Les secrets de pureté et de calcul d’équité dynamique expliqués par le numéro 1 mondial. »',
            conceptId: 'mochy-masterclass',
            buyUrl: 'https://shop.backgammongalaxy.com/products/backgammon-masterclass-by-mochy-olsen',
            publisher: 'Backgammon Galaxy',
        };
    }

    return {
        author: 'François Tardieu (Triple Champion d’Europe)',
        bookTitle: 'Backgammon: Strategic Concepts',
        conceptSnippet: '« Ne dispersez aucun blot sans ancre de repli : la structure des ancres est la fondation absolue de toute stratégie. »',
        conceptId: 'tardieu-strategic-concepts',
        buyUrl: 'https://shop.backgammongalaxy.com/products/backgammon-strategic-concepts-by-francois-tardieu-softcover',
        publisher: 'Backgammon Galaxy & Roadkill Books',
    };
}

/** Extrait les champs structurés du flux JSON, y compris en cours de streaming partiel. */
export function parseStreamedExplanation(text: string): ParsedExplanation {
    if (!text) return { rawText: '' };

    try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        if (typeof parsed === 'object' && parsed !== null) {
            return {
                summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
                explanation: typeof parsed.explanation === 'string' ? parsed.explanation : undefined,
                keyConcept: typeof parsed.keyConcept === 'string' ? parsed.keyConcept : undefined,
                advice: typeof parsed.advice === 'string' ? parsed.advice : undefined,
                whyFailed: typeof parsed.whyFailed === 'string' ? parsed.whyFailed : undefined,
                whyOptimal: typeof parsed.whyOptimal === 'string' ? parsed.whyOptimal : undefined,
                conceptId: typeof parsed.conceptId === 'string' ? parsed.conceptId : undefined,
                rawText: typeof parsed.explanation === 'string' ? parsed.explanation : text,
            };
        }
    } catch {
        // Streaming partiel : parsing progressif par expressions régulières
    }

    const unescapeJson = (str?: string) =>
        str ? str.replace(/\\n/g, '\n').replace(/\\"/g, '"') : undefined;

    const extractedSummary = unescapeJson(text.match(/"summary":\s*"((?:[^"\\]|\\.)*)/)?.[1]);
    const extractedExplanation = unescapeJson(text.match(/"explanation":\s*"((?:[^"\\]|\\.)*)/)?.[1]);
    const extractedConcept = unescapeJson(text.match(/"keyConcept":\s*"((?:[^"\\]|\\.)*)/)?.[1]);
    const extractedAdvice = unescapeJson(text.match(/"advice":\s*"((?:[^"\\]|\\.)*)/)?.[1]);
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

/** Normalise et calcule le contexte de match MET complet. */
export function resolveMatchContext(
    raw?: MatchContext | Partial<BuildMatchContextParams> | null,
): MatchContext | null {
    if (!raw) return null;
    if ('gammonPrice' in raw && 'takePoint' in raw && 'pointsToWin' in raw) {
        return raw as MatchContext;
    }
    return buildMatchContext({
        matchLength: raw.matchLength ?? 7,
        scoreX: raw.scoreX ?? 0,
        scoreO: raw.scoreO ?? 0,
        crawford: raw.crawford,
        cubeValue: raw.cubeValue ?? 1,
        cubeOwner: raw.cubeOwner ?? null,
    });
}

/** Construit les lignes du tableau analytique des candidats (Top 3 à 5). */
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

/** Dérive les compteurs des 4 paliers à partir des statistiques de match. */
export function deriveDecisionCounters(matchStats?: MatchStats): DecisionCounters {
    if (matchStats?.decisionCounters) return matchStats.decisionCounters;
    const blunders = matchStats?.blundersCount ?? 0;
    const decisions = matchStats?.decisionsCount ?? 0;
    return {
        optimal: Math.max(0, decisions - blunders),
        good: 0,
        inaccuracy: 0,
        blunder: blunders,
    };
}

/** Vérifie si l'explication automatique doit se déclencher selon le mode et le seuil. */
export function shouldAutoTriggerExplanation(
    verdict: CoachDisplayVerdict | null,
    playedMove: string | null,
    triggerMode: 'auto' | 'manual',
    autoThreshold: 'blunder' | 'doubtful',
): boolean {
    if (!verdict || !playedMove || triggerMode !== 'auto') return false;
    if (verdict === 'blunder') return true;
    return autoThreshold === 'doubtful' && (verdict === 'doubtful' || verdict === 'inaccuracy');
}

/** Construit les libellés traduits transmis à `CoachPanelView`. */
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
