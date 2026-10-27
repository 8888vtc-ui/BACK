/**
 * Types et constantes partagés du Rapport de Formation Post-Match & Grandmaster Blunder Report.
 */

/** Phase de jeu dans laquelle une erreur a été commise. */
export type GamePhaseLabel = 'opening' | 'contact' | 'race' | 'bearoff' | 'unknown';

/** Catégorie de coup selon l'échelle d'équité Open Sage / bgsage / XG2. */
export type ReportMoveCategory = 'best' | 'inaccuracy' | 'mistake' | 'blunder' | 'cube_blunder';

/** Seuils d'équité officiels (en valeur absolue EMG). */
export const REPORT_EQUITY_THRESHOLDS = {
    BEST_MAX: 0.02,
    INACCURACY_MAX: 0.05,
    MISTAKE_MAX: 0.08,
    CUBE_BLUNDER_MIN: 0.02,
} as const;

/** Métadonnées visuelles et libellés bilingues pour les 5 catégories de coups. */
export const REPORT_CATEGORY_META: Record<
    ReportMoveCategory,
    {
        icon: string;
        labelFr: string;
        labelEn: string;
        shortFr: string;
        shortEn: string;
        badgeClass: string;
    }
> = {
    best: {
        icon: '🟢',
        labelFr: 'Best Move (< 0.020 Eq)',
        labelEn: 'Best Move (< 0.020 Eq)',
        shortFr: 'Best Move',
        shortEn: 'Best Move',
        badgeClass: 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300',
    },
    inaccuracy: {
        icon: '🟡',
        labelFr: 'Inaccuracy (0.020 – 0.050 Eq)',
        labelEn: 'Inaccuracy (0.020 – 0.050 Eq)',
        shortFr: 'Inaccuracy',
        shortEn: 'Inaccuracy',
        badgeClass: 'border-yellow-500/50 bg-yellow-950/60 text-yellow-200',
    },
    mistake: {
        icon: '🟠',
        labelFr: 'Mistake (0.050 – 0.080 Eq)',
        labelEn: 'Mistake (0.050 – 0.080 Eq)',
        shortFr: 'Mistake',
        shortEn: 'Mistake',
        badgeClass: 'border-orange-500/55 bg-orange-950/65 text-orange-200',
    },
    blunder: {
        icon: '🔴',
        labelFr: 'Blunder (> 0.080 Eq)',
        labelEn: 'Blunder (> 0.080 Eq)',
        shortFr: 'Gaffe majeure',
        shortEn: 'Blunder',
        badgeClass: 'border-rose-500/65 bg-rose-950/75 text-rose-200',
    },
    cube_blunder: {
        icon: '⚜',
        labelFr: 'Cube Blunder (Erreur de videau)',
        labelEn: 'Cube Blunder (Cube error)',
        shortFr: 'Cube Blunder',
        shortEn: 'Cube Blunder',
        badgeClass: 'border-[#d4af37]/70 bg-[#2d1a0b]/90 text-[#f3c65f]',
    },
};

/** Ventilation complète des coups selon les 5 catégories du rapport. */
export interface ReportMoveClassificationBreakdown {
    best: number;
    inaccuracy: number;
    mistake: number;
    blunder: number;
    cubeBlunder: number;
}

/** Erreur majeure affichée dans la galerie et le carrousel de revue. */
export interface MajorBlunder {
    turnNumber: number;
    dice: [number, number];
    playedNotation: string;
    optimalNotation: string;
    equityLoss: number;
    explanation?: string;
    conceptId?: string;
    boardBefore: number[];
    boardAfter?: number[];
    phase: GamePhaseLabel;
    category?: ReportMoveCategory;
    xgid?: string;
    player?: 'X' | 'O';
    cubeEquityLoss?: number;
    diagnostic?: string;
    keyConcept?: string;
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

/** Libellés anglais des phases de jeu. */
export const PHASE_LABELS_EN: Record<GamePhaseLabel, string> = {
    opening: 'Opening',
    contact: 'Contact',
    race: 'Race',
    bearoff: 'Bear-off',
    unknown: 'Unknown',
};

/** Résumé structuré envoyé à `/api/coach` pour la synthèse pédagogique Gemini. */
export interface MatchSummaryPayload {
    performanceRating: number;
    prCategory: string;
    opponentPerformanceRating: number | null;
    decisionsCount: number;
    totalEquityLoss: number;
    accuracyPercent?: number;
    scoreX?: number;
    scoreO?: number;
    matchLength?: number;
    matchDurationSeconds?: number;
    recurringThemes?: string[];
    reportBreakdown?: ReportMoveClassificationBreakdown;
    counters: DecisionCountersSummary;
    blunders: Array<{
        turnNumber: number;
        dice: [number, number];
        playedNotation: string;
        optimalNotation: string;
        equityLoss: number;
        phase: GamePhaseLabel;
        category?: ReportMoveCategory;
        xgid?: string;
        conceptId?: string;
    }>;
    phaseBreakdown: Record<GamePhaseLabel, number>;
    winner: 'X' | 'O' | null;
    winType: string | null;
}

/** Diagnostic structuré renvoyé par l'IA Gemini (3 volets Grandmaster + blocs de synthèse). */
export interface AiSynthesis {
    diagnostic?: string;
    keyConcept?: {
        title: string;
        explanation: string;
    };
    trainingPlan: string[];
    strengths: string[];
    weaknesses: string[];
    recurringThemes?: string[];
    summary?: string;
    title?: string;
}
