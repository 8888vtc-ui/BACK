/**
 * Helpers purs du Rapport de Formation Post-Match (aucune dépendance React/DOM).
 *
 * Rôle :
 *   - Extraire les plus grosses erreurs du joueur depuis `matchLog` / analyses.
 *   - Classer chaque erreur dans une phase de jeu (ouverture, contact, course, bear-off).
 *   - Agréger les compteurs des 4 paliers et la perte d'équité cumulée.
 *   - Construire le résumé structuré envoyé à `/api/coach`.
 *
 * Module 100 % pur : testable sans DOM.
 *
 * Retrait :
 *   Supprimer ce fichier et son usage dans `PostMatchTrainingReport.tsx`.
 */

import type { EvaluatedTurn, CompleteGameAnalysis } from '../../features/rating/types';

/** Phase de jeu dans laquelle une erreur a été commise. */
export type GamePhaseLabel = 'opening' | 'contact' | 'race' | 'bearoff' | 'unknown';

/** Erreur majeure affichée dans la galerie. */
export interface MajorBlunder {
    /** Numéro de tour (1-based). */
    turnNumber: number;
    /** Tirage de dés. */
    dice: [number, number];
    /** Notation du coup joué. */
    playedNotation: string;
    /** Notation du coup optimal. */
    optimalNotation: string;
    /** Perte d'équité (valeur positive). */
    equityLoss: number;
    /** Explication tactique éventuelle. */
    explanation?: string;
    /** Concept stratégique associé. */
    conceptId?: string;
    /** Plateau avant le coup (28 entiers) pour la revue visuelle. */
    boardBefore: number[];
    /** Phase de jeu détectée. */
    phase: GamePhaseLabel;
}

/** Compteurs des 4 paliers de décision. */
export interface DecisionCountersSummary {
    optimal: number;
    good: number;
    inaccuracy: number;
    blunder: number;
}

/** Seuil minimal pour figurer dans la galerie des erreurs majeures. */
export const MAJOR_BLUNDER_THRESHOLD = 0.02;

/** Nombre maximal d'erreurs affichées. */
export const MAX_MAJOR_BLUNDERS = 5;

/** Libellés français des phases de jeu. */
export const PHASE_LABELS: Record<GamePhaseLabel, string> = {
    opening: 'Ouverture',
    contact: 'Contact',
    race: 'Course',
    bearoff: 'Bear-off',
    unknown: 'Indéterminée',
};

/**
 * Détermine la phase de jeu à partir d'un plateau (28 entiers).
 *
 * Heuristique :
 *   - `bearoff` : tous les pions du joueur sont dans son jan intérieur.
 *   - `race` : plus aucun contact possible (pions séparés).
 *   - `opening` : moins de 6 pions sortis du jan de départ.
 *   - `contact` : sinon.
 */
export function detectGamePhase(board: ReadonlyArray<number>, player: 'X' | 'O' = 'X'): GamePhaseLabel {
    if (!board || board.length < 26) return 'unknown';

    const homeRange = player === 'X' ? [1, 2, 3, 4, 5, 6] : [19, 20, 21, 22, 23, 24];
    const startRange = player === 'X' ? [19, 20, 21, 22, 23, 24] : [1, 2, 3, 4, 5, 6];

    let onBoard = 0;
    let inHome = 0;
    let inStart = 0;
    let minX = 25;
    let maxX = 0;
    let minO = 25;
    let maxO = 0;

    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        if (v === 0) continue;
        const count = Math.abs(v);
        const isPlayer = player === 'X' ? v > 0 : v < 0;

        if (isPlayer) {
            onBoard += count;
            if (homeRange.includes(p)) inHome += count;
            if (startRange.includes(p)) inStart += count;
            minX = Math.min(minX, p);
            maxX = Math.max(maxX, p);
        } else {
            minO = Math.min(minO, p);
            maxO = Math.max(maxO, p);
        }
    }

    // Bear-off : tous les pions du joueur sont dans son jan intérieur.
    if (onBoard > 0 && inHome === onBoard) return 'bearoff';

    // Course : plus aucun contact (les deux camps sont séparés).
    if (maxX > 0 && minO < 25 && maxX < minO) return 'race';
    if (maxO > 0 && minX < 25 && maxO < minX) return 'race';

    // Ouverture : la majorité des pions est encore dans le jan de départ.
    if (inStart >= 8) return 'opening';

    return 'contact';
}

/**
 * Extrait les N plus grosses erreurs du joueur (ΔEq > seuil), triées par gravité.
 */
export function extractMajorBlunders(
    evaluatedMoves: ReadonlyArray<EvaluatedTurn> | undefined,
    player: 'X' | 'O' = 'X',
    maxCount: number = MAX_MAJOR_BLUNDERS,
): MajorBlunder[] {
    if (!evaluatedMoves || evaluatedMoves.length === 0) return [];

    return evaluatedMoves
        .filter((m) => m.player === player && Math.abs(m.equityLoss) > MAJOR_BLUNDER_THRESHOLD)
        .sort((a, b) => Math.abs(b.equityLoss) - Math.abs(a.equityLoss))
        .slice(0, maxCount)
        .map((m) => ({
            turnNumber: m.moveNumber,
            dice: m.dice,
            playedNotation: m.playedNotation,
            optimalNotation: m.optimalNotation,
            equityLoss: Math.abs(m.equityLoss),
            explanation: m.explanation,
            conceptId: m.conceptId,
            boardBefore: m.boardBefore,
            phase: detectGamePhase(m.boardBefore, player),
        }));
}

/**
 * Agrège les compteurs des 4 paliers depuis une analyse complète.
 * Les verdicts `acceptable` sont comptés comme « Bons », `howler` comme « Blunders ».
 */
export function summarizeDecisionCounters(
    analysis: CompleteGameAnalysis | null | undefined,
): DecisionCountersSummary {
    if (!analysis) {
        return { optimal: 0, good: 0, inaccuracy: 0, blunder: 0 };
    }
    const b = analysis.breakdown;
    return {
        optimal: b.optimal,
        good: b.acceptable,
        inaccuracy: b.doubtful,
        blunder: b.blunder + b.howler,
    };
}

/** Répartition des erreurs par phase de jeu. */
export function countBlundersByPhase(
    blunders: ReadonlyArray<MajorBlunder>,
): Record<GamePhaseLabel, number> {
    const counts: Record<GamePhaseLabel, number> = {
        opening: 0,
        contact: 0,
        race: 0,
        bearoff: 0,
        unknown: 0,
    };
    for (const b of blunders) counts[b.phase] += 1;
    return counts;
}

/** Résumé structuré envoyé à `/api/coach` pour la synthèse pédagogique. */
export interface MatchSummaryPayload {
    performanceRating: number;
    prCategory: string;
    opponentPerformanceRating: number | null;
    decisionsCount: number;
    totalEquityLoss: number;
    counters: DecisionCountersSummary;
    blunders: Array<{
        turnNumber: number;
        dice: [number, number];
        playedNotation: string;
        optimalNotation: string;
        equityLoss: number;
        phase: GamePhaseLabel;
        conceptId?: string;
    }>;
    phaseBreakdown: Record<GamePhaseLabel, number>;
    winner: 'X' | 'O' | null;
    winType: string | null;
}

/**
 * Construit le résumé structuré du match transmis à l'IA.
 */
export function buildMatchSummaryPayload(params: {
    analysis: CompleteGameAnalysis | null | undefined;
    blunders: ReadonlyArray<MajorBlunder>;
    opponentPerformanceRating?: number | null;
}): MatchSummaryPayload {
    const { analysis, blunders, opponentPerformanceRating = null } = params;
    return {
        performanceRating: analysis?.performanceRating ?? 0,
        prCategory: analysis?.prCategory ?? 'Intermédiaire',
        opponentPerformanceRating,
        decisionsCount: analysis?.decisionsCount ?? 0,
        totalEquityLoss: analysis?.totalEquityLoss ?? 0,
        counters: summarizeDecisionCounters(analysis),
        blunders: blunders.map((b) => ({
            turnNumber: b.turnNumber,
            dice: b.dice,
            playedNotation: b.playedNotation,
            optimalNotation: b.optimalNotation,
            equityLoss: Number(b.equityLoss.toFixed(3)),
            phase: b.phase,
            conceptId: b.conceptId,
        })),
        phaseBreakdown: countBlundersByPhase(blunders),
        winner: analysis?.winner ?? null,
        winType: analysis?.winType ?? null,
    };
}

/** Diagnostic structuré en 3 blocs renvoyé par l'IA. */
export interface AiSynthesis {
    strengths: string[];
    weaknesses: string[];
    trainingPlan: string[];
    summary?: string;
    title?: string;
}

/**
 * Repli local règle-basé : génère un diagnostic déterministe à partir du résumé.
 * Utilisé hors-ligne ou si `/api/coach` est indisponible.
 */
export function buildRuleBasedSynthesis(payload: MatchSummaryPayload): AiSynthesis {
    const { counters, blunders, phaseBreakdown, performanceRating } = payload;
    const total = counters.optimal + counters.good + counters.inaccuracy + counters.blunder;

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const trainingPlan: string[] = [];

    // Points forts
    if (total > 0 && counters.optimal / total >= 0.5) {
        strengths.push(
            `Plus de la moitié de vos décisions sont optimales (${counters.optimal}/${total}).`,
        );
    }
    if (performanceRating > 0 && performanceRating <= 5) {
        strengths.push(`Votre PR de ${performanceRating.toFixed(2)} vous place au niveau Maître.`);
    }
    if (blunders.length === 0) {
        strengths.push('Aucune erreur majeure (ΔEq > 0.020) détectée sur cette partie.');
    }
    if (strengths.length === 0) {
        strengths.push('Vous avez mené la partie jusqu’au bout : chaque manche est une progression.');
    }

    // Faiblesses
    if (counters.blunder > 0) {
        weaknesses.push(
            `${counters.blunder} blunder${counters.blunder > 1 ? 's' : ''} majeur${counters.blunder > 1 ? 's' : ''} ont coûté ${payload.totalEquityLoss.toFixed(3)} d’équité.`,
        );
    }
    if (counters.inaccuracy > 0) {
        weaknesses.push(
            `${counters.inaccuracy} imprécision${counters.inaccuracy > 1 ? 's' : ''} : des coups jouables mais sous-optimaux.`,
        );
    }
    const worstPhase = (Object.entries(phaseBreakdown) as Array<[GamePhaseLabel, number]>)
        .filter(([phase]) => phase !== 'unknown')
        .sort((a, b) => b[1] - a[1])[0];
    if (worstPhase && worstPhase[1] > 0) {
        weaknesses.push(
            `La phase « ${PHASE_LABELS[worstPhase[0]]} » concentre ${worstPhase[1]} erreur${worstPhase[1] > 1 ? 's' : ''}.`,
        );
    }
    if (weaknesses.length === 0) {
        weaknesses.push('Aucune faiblesse récurrente marquante : continuez à varier vos positions.');
    }

    // Plan d'entraînement
    if (counters.blunder > 0) {
        trainingPlan.push('Travaillez les Drills « Blunders » pour ancrer les réflexes de sécurité.');
    }
    if (worstPhase && worstPhase[1] > 0) {
        trainingPlan.push(
            `Concentrez-vous sur la phase « ${PHASE_LABELS[worstPhase[0]]} » avec des exercices ciblés.`,
        );
    }
    if (counters.inaccuracy > 0) {
        trainingPlan.push('Comparez systématiquement votre coup au Top 3 du Coach avant de valider.');
    }
    if (trainingPlan.length === 0) {
        trainingPlan.push('Maintenez votre rythme : 10 minutes de puzzles par jour suffisent.');
    }

    return {
        title: 'Diagnostic du Grand-Maître',
        summary: `PR ${performanceRating.toFixed(2)} — ${payload.prCategory}.`,
        strengths,
        weaknesses,
        trainingPlan,
    };
}
