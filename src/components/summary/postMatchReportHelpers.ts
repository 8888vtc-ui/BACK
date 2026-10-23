/**
 * Helpers purs du Rapport de Formation Post-Match & Grandmaster Blunder Report (aucune dépendance React/DOM).
 *
 * Rôle :
 *   - Classifier tous les coups selon les seuils officiels Open Sage / bgsage / XG2 :
 *       🟢 Best Move (< 0.020 Eq)
 *       🟡 Inaccuracy (0.020 à 0.050 Eq)
 *       🟠 Mistake (0.050 à 0.080 Eq)
 *       🔴 Blunder (> 0.080 Eq)
 *       ⚜ Cube Blunder (Erreur de videau : Take/Drop/Double incorrect)
 *   - Extraire les plus grosses erreurs du joueur avec position XGID, diagnostic et concept clé.
 *   - Identifier les thèmes récurrents (ex: "Sécurité excessive en course", "Ouverture trop agressive", "Gestion du videau tardive").
 *   - Calculer le taux de précision (Accuracy %) et construire le payload Gemini en 3 volets (🎯 Diagnostic, 💡 Concept Clé, 🚀 Plan d'entraînement).
 *
 * Module 100 % pur : testable sans DOM.
 */

import type { EvaluatedTurn, CompleteGameAnalysis } from '../../features/rating/types';
import { serializeXGID } from '../../engine/backgammonEngine';

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
    /** Plateau après le coup (28 entiers). */
    boardAfter?: number[];
    /** Phase de jeu détectée. */
    phase: GamePhaseLabel;
    /** Catégorie de sévérité Open Sage / bgsage. */
    category?: ReportMoveCategory;
    /** Position standard XGID. */
    xgid?: string;
    /** Joueur au trait. */
    player?: 'X' | 'O';
    /** Perte d'équité éventuelle sur le videau. */
    cubeEquityLoss?: number;
    /** Diagnostic tactique détaillé (🎯). */
    diagnostic?: string;
    /** Règle stratégique / Concept clé (💡). */
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

/**
 * Classifie un coup selon sa perte d'équité (Open Sage / bgsage) et son éventuelle erreur de videau :
 *   - ⚜ `cube_blunder` : erreur de videau >= 0.020 Eq
 *   - 🟢 `best`         : perte < 0.020 Eq
 *   - 🟡 `inaccuracy`   : 0.020 à 0.050 Eq
 *   - 🟠 `mistake`      : 0.050 à 0.080 Eq
 *   - 🔴 `blunder`      : > 0.080 Eq
 */
export function classifyMoveByEquityLoss(
    equityLoss: number,
    cubeEquityLoss?: number,
): ReportMoveCategory {
    if (cubeEquityLoss !== undefined && Math.abs(cubeEquityLoss) >= REPORT_EQUITY_THRESHOLDS.CUBE_BLUNDER_MIN) {
        return 'cube_blunder';
    }
    const loss = Math.abs(equityLoss);
    if (loss < REPORT_EQUITY_THRESHOLDS.BEST_MAX) {
        return 'best';
    }
    if (loss < REPORT_EQUITY_THRESHOLDS.INACCURACY_MAX) {
        return 'inaccuracy';
    }
    if (loss <= REPORT_EQUITY_THRESHOLDS.MISTAKE_MAX) {
        return 'mistake';
    }
    return 'blunder';
}

/**
 * Agrège tous les coups évalués du joueur dans les 5 catégories du rapport.
 */
export function classifyAllMatchMoves(
    evaluatedMoves: ReadonlyArray<EvaluatedTurn> | undefined,
    player: 'X' | 'O' = 'X',
): ReportMoveClassificationBreakdown {
    const breakdown: ReportMoveClassificationBreakdown = {
        best: 0,
        inaccuracy: 0,
        mistake: 0,
        blunder: 0,
        cubeBlunder: 0,
    };
    if (!evaluatedMoves || evaluatedMoves.length === 0) return breakdown;

    for (const m of evaluatedMoves) {
        if (m.player !== player) continue;
        if (m.cubeEquityLoss !== undefined && Math.abs(m.cubeEquityLoss) >= REPORT_EQUITY_THRESHOLDS.CUBE_BLUNDER_MIN) {
            breakdown.cubeBlunder += 1;
        }
        const cat = classifyMoveByEquityLoss(m.equityLoss);
        if (cat === 'best') breakdown.best += 1;
        else if (cat === 'inaccuracy') breakdown.inaccuracy += 1;
        else if (cat === 'mistake') breakdown.mistake += 1;
        else if (cat === 'blunder') breakdown.blunder += 1;
    }

    return breakdown;
}

/**
 * Calcule le taux de précision global (Accuracy %) sur l'échelle 0–100 %.
 */
export function computeMatchAccuracy(
    analysis: CompleteGameAnalysis | null | undefined,
    player: 'X' | 'O' = 'X',
): number {
    if (!analysis) return 100;

    const playerMoves = (analysis.evaluatedMoves ?? []).filter((m) => m.player === player);
    if (playerMoves.length > 0) {
        let weightedScore = 0;
        for (const m of playerMoves) {
            const cat = classifyMoveByEquityLoss(m.equityLoss, m.cubeEquityLoss);
            if (cat === 'best') weightedScore += 1.0;
            else if (cat === 'inaccuracy') weightedScore += 0.72;
            else if (cat === 'mistake') weightedScore += 0.4;
            else weightedScore += 0.05;
        }
        const rawPct = (weightedScore / playerMoves.length) * 100;
        return Number(Math.max(0, Math.min(100, rawPct)).toFixed(1));
    }

    const b = analysis.breakdown;
    const total = b.optimal + b.acceptable + b.doubtful + b.blunder + b.howler;
    if (total > 0) {
        const weighted = b.optimal * 1.0 + b.acceptable * 0.88 + b.doubtful * 0.55 + b.blunder * 0.15;
        return Number(Math.max(0, Math.min(100, (weighted / total) * 100)).toFixed(1));
    }

    const pr = Math.max(0, analysis.performanceRating ?? 0);
    return Number(Math.max(0, Math.min(100, 100 - pr * 2.4)).toFixed(1));
}

/**
 * Génère un identifiant XGID pour un tour évalué.
 */
export function buildTurnXGID(
    turn: Pick<EvaluatedTurn, 'boardBefore' | 'player' | 'dice'>,
    matchMeta?: { scoreX?: number; scoreO?: number; matchLength?: number },
): string {
    try {
        const safeBoard =
            Array.isArray(turn.boardBefore) && turn.boardBefore.length >= 26
                ? turn.boardBefore.slice(0, 26)
                : new Array<number>(26).fill(0);
        return serializeXGID({
            board: safeBoard,
            turn: turn.player ?? 'X',
            cubeValue: 1,
            cubeOwner: null,
            dice: turn.dice ?? [1, 1],
            matchLength: matchMeta?.matchLength ?? 7,
            scoreX: matchMeta?.scoreX ?? 0,
            scoreO: matchMeta?.scoreO ?? 0,
            crawford: false,
            doubled: false,
            resigned: 0,
        });
    } catch {
        return 'XGID=--------------------------:0:0:1:11:0:0:0:7:10';
    }
}

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
 * Produit le Diagnostic (🎯) et le Concept Clé (💡) propres à un coup en erreur.
 */
export function buildBlunderPedagogicalNote(
    params: {
        phase: GamePhaseLabel;
        category: ReportMoveCategory;
        playedNotation: string;
        optimalNotation: string;
        equityLoss: number;
        conceptId?: string;
        explanation?: string;
    },
    locale: string = 'fr',
): { diagnostic: string; keyConcept: string } {
    const isEn = locale === 'en';
    const lossStr = params.equityLoss.toFixed(3);

    if (params.category === 'cube_blunder') {
        return {
            diagnostic: isEn
                ? `Cube handling mistake (-${lossStr} Eq): misjudging the doubling window or take point cost significant match equity.`
                : `Erreur de maîtrise du videau (-${lossStr} Eq) : mauvais timing sur le Double/Take qui ampute votre équité de match.`,
            keyConcept: isEn
                ? 'Woolsey’s Law & 25% Take Point: When in doubt on a double, ask whether your opponent has a clear market loser.'
                : 'Loi de Woolsey & Seuil de Take (25 %) : doublez dès que vous menacez de perdre votre marché au prochain tour.',
        };
    }

    switch (params.phase) {
        case 'opening':
            return {
                diagnostic:
                    params.explanation ||
                    (isEn
                        ? `Playing ${params.playedNotation} instead of ${params.optimalNotation} (-${lossStr} Eq) yields key structural points early and leaves uncoordinated builders.`
                        : `Jouer ${params.playedNotation} au lieu de ${params.optimalNotation} (-${lossStr} Eq) cède l’initiative d’ouverture et disperse vos constructeurs (builders).`),
                keyConcept: isEn
                    ? 'Golden Point & Bar Point Priority: Secure the 5-point, 7-point, or advanced anchor before moving passive checkers.'
                    : 'Priorité Point d’Or (5) & Point de Barre (7) : sécurisez les cases clés ou l’ancre avancée dès l’ouverture.',
            };
        case 'race':
            return {
                diagnostic:
                    params.explanation ||
                    (isEn
                        ? `In a pure race, ${params.playedNotation} wastes crossover efficiency compared to ${params.optimalNotation} (-${lossStr} Eq).`
                        : `En course pure, ${params.playedNotation} gaspille des crossovers précieux face à ${params.optimalNotation} (-${lossStr} Eq) par sécurité excessive.`),
                keyConcept: isEn
                    ? 'Crossover Efficiency: Minimize crossovers and bring rear checkers home smoothly to prepare bear-off.'
                    : 'Efficacité des Crossovers : réduisez le nombre de quadrants à traverser et lissez votre distribution avant le bear-off.',
            };
        case 'bearoff':
            return {
                diagnostic:
                    params.explanation ||
                    (isEn
                        ? `${params.playedNotation} (-${lossStr} Eq) creates a ragged bear-off structure or leaves unnecessary direct shots compared to ${params.optimalNotation}.`
                        : `${params.playedNotation} (-${lossStr} Eq) dégrade la souplesse de sortie ou expose un blot inutile par rapport à ${params.optimalNotation}.`),
                keyConcept: isEn
                    ? 'Rule of 6 in Bear-Off: Take off checkers when safe, fill gaps to avoid future forced blots.'
                    : 'La Règle du 6 en sortie : sortez le maximum de pions sans laisser de trou critique sur les flèches hautes (5 et 6).',
            };
        default:
            return {
                diagnostic:
                    params.explanation ||
                    (isEn
                        ? `Playing ${params.playedNotation} (-${lossStr} Eq) breaks prime cohesion or exposes a blot to direct return shots instead of ${params.optimalNotation}.`
                        : `Jouer ${params.playedNotation} (-${lossStr} Eq) affaiblit votre prime, lâche une ancre ou expose un blot direct au lieu de ${params.optimalNotation}.`),
                keyConcept: isEn
                    ? 'Prime Cohesion & Anchor Discipline: Never break an anchor or prime without a decisive racing or attacking compensation.'
                    : 'Conserver son ancre & sa prime : ne brisez jamais une structure défensive sans compensation tactique majeure.',
            };
    }
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
        .filter(
            (m) =>
                m.player === player &&
                (Math.abs(m.equityLoss) > MAJOR_BLUNDER_THRESHOLD ||
                    (m.cubeEquityLoss !== undefined &&
                        Math.abs(m.cubeEquityLoss) >= REPORT_EQUITY_THRESHOLDS.CUBE_BLUNDER_MIN)),
        )
        .sort((a, b) => {
            const lossA = Math.max(Math.abs(a.equityLoss), Math.abs(a.cubeEquityLoss ?? 0));
            const lossB = Math.max(Math.abs(b.equityLoss), Math.abs(b.cubeEquityLoss ?? 0));
            return lossB - lossA;
        })
        .slice(0, maxCount)
        .map((m) => {
            const phase = detectGamePhase(m.boardBefore, player);
            const equityLoss = Math.max(Math.abs(m.equityLoss), Math.abs(m.cubeEquityLoss ?? 0));
            const category = classifyMoveByEquityLoss(m.equityLoss, m.cubeEquityLoss);
            const xgid = buildTurnXGID(m);
            const note = buildBlunderPedagogicalNote({
                phase,
                category,
                playedNotation: m.playedNotation,
                optimalNotation: m.optimalNotation,
                equityLoss,
                conceptId: m.conceptId,
                explanation: m.explanation,
            });

            return {
                turnNumber: m.moveNumber,
                dice: m.dice,
                playedNotation: m.playedNotation,
                optimalNotation: m.optimalNotation,
                equityLoss,
                explanation: m.explanation,
                conceptId: m.conceptId,
                boardBefore: m.boardBefore,
                boardAfter: m.boardAfter,
                phase,
                category,
                xgid,
                player: m.player,
                cubeEquityLoss: m.cubeEquityLoss,
                diagnostic: note.diagnostic,
                keyConcept: note.keyConcept,
            };
        });
}

/**
 * Identifie les thèmes stratégiques récurrents à partir des erreurs de la partie.
 */
export function identifyRecurringThemes(
    blunders: ReadonlyArray<MajorBlunder>,
    analysis?: CompleteGameAnalysis | null,
    locale: string = 'fr',
): string[] {
    const isEn = locale === 'en';
    const themes: string[] = [];
    const phases = countBlundersByPhase(blunders);

    if (phases.race > 0 || phases.bearoff > 0) {
        themes.push(
            isEn ? 'Overly cautious play in race / bear-off' : 'Sécurité excessive en course',
        );
    }
    if (phases.opening > 0) {
        themes.push(
            isEn ? 'Overly aggressive or uncoordinated opening' : 'Ouverture trop agressive',
        );
    }
    if (
        blunders.some((b) => b.category === 'cube_blunder') ||
        (analysis?.cubeEquityLoss !== undefined && Math.abs(analysis.cubeEquityLoss) >= 0.02)
    ) {
        themes.push(isEn ? 'Late or inaccurate cube handling' : 'Gestion du videau tardive');
    }
    if (phases.contact > 0) {
        themes.push(
            isEn
                ? 'Blot exposure & prime breaking in contact'
                : 'Exposition de blots & gestion des primes en contact',
        );
    }

    if (themes.length === 0) {
        themes.push(isEn ? 'High positional discipline' : 'Discipline positionnelle solide');
    }

    return themes;
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

/**
 * Construit le résumé structuré du match transmis à l'IA Gemini.
 */
export function buildMatchSummaryPayload(params: {
    analysis: CompleteGameAnalysis | null | undefined;
    blunders: ReadonlyArray<MajorBlunder>;
    opponentPerformanceRating?: number | null;
    matchDurationSeconds?: number;
}): MatchSummaryPayload {
    const {
        analysis,
        blunders,
        opponentPerformanceRating = null,
        matchDurationSeconds,
    } = params;
    const player = analysis?.player ?? 'X';

    return {
        performanceRating: analysis?.performanceRating ?? 0,
        prCategory: analysis?.prCategory ?? 'Intermédiaire',
        opponentPerformanceRating,
        decisionsCount: analysis?.decisionsCount ?? 0,
        totalEquityLoss: analysis?.totalEquityLoss ?? 0,
        accuracyPercent: computeMatchAccuracy(analysis, player),
        scoreX: analysis?.scoreX ?? 0,
        scoreO: analysis?.scoreO ?? 0,
        matchLength: analysis?.matchLength ?? 0,
        matchDurationSeconds:
            matchDurationSeconds ?? Math.max(60, (analysis?.totalMovesCount ?? 20) * 18),
        recurringThemes: identifyRecurringThemes(blunders, analysis),
        reportBreakdown: classifyAllMatchMoves(analysis?.evaluatedMoves, player),
        counters: summarizeDecisionCounters(analysis),
        blunders: blunders.map((b) => ({
            turnNumber: b.turnNumber,
            dice: b.dice,
            playedNotation: b.playedNotation,
            optimalNotation: b.optimalNotation,
            equityLoss: Number(b.equityLoss.toFixed(3)),
            phase: b.phase,
            category: b.category ?? classifyMoveByEquityLoss(b.equityLoss, b.cubeEquityLoss),
            xgid: b.xgid ?? buildTurnXGID({ boardBefore: b.boardBefore, player: b.player ?? 'X', dice: b.dice }),
            conceptId: b.conceptId,
        })),
        phaseBreakdown: countBlundersByPhase(blunders),
        winner: analysis?.winner ?? null,
        winType: analysis?.winType ?? null,
    };
}

/** Diagnostic structuré renvoyé par l'IA Gemini (3 volets Grandmaster + blocs de synthèse). */
export interface AiSynthesis {
    /** 🎯 Volet 1 : Le Diagnostic (pourquoi les erreurs clés ont coûté cher). */
    diagnostic?: string;
    /** 💡 Volet 2 : Le Concept Clé (la règle stratégique à retenir). */
    keyConcept?: {
        title: string;
        explanation: string;
    };
    /** 🚀 Volet 3 : Plan d'entraînement personnalisé (1 ou 2 axes prioritaires). */
    trainingPlan: string[];
    /** Points forts observés. */
    strengths: string[];
    /** Faiblesses récurrentes détectées. */
    weaknesses: string[];
    /** Thèmes récurrents identifiés. */
    recurringThemes?: string[];
    summary?: string;
    title?: string;
}

/**
 * Repli local règle-basé : génère un diagnostic déterministe complet (incluant les 3 volets 🎯/💡/🚀)
 * à partir du résumé du match. Utilisé hors-ligne ou si `/api/coach` est indisponible.
 */
export function buildRuleBasedSynthesis(payload: MatchSummaryPayload, locale: string = 'fr'): AiSynthesis {
    const isEn = locale === 'en';
    const { counters, blunders, phaseBreakdown, performanceRating } = payload;
    const total = counters.optimal + counters.good + counters.inaccuracy + counters.blunder;

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const trainingPlan: string[] = [];

    // Points forts
    if (total > 0 && counters.optimal / total >= 0.5) {
        strengths.push(
            isEn
                ? `More than half of your decisions were optimal (${counters.optimal}/${total}).`
                : `Plus de la moitié de vos décisions sont optimales (${counters.optimal}/${total}).`,
        );
    }
    if (performanceRating > 0 && performanceRating <= 5) {
        strengths.push(
            isEn
                ? `Your PR of ${performanceRating.toFixed(2)} places you at Master level.`
                : `Votre PR de ${performanceRating.toFixed(2)} vous place au niveau Maître.`,
        );
    }
    if (blunders.length === 0) {
        strengths.push(
            isEn
                ? 'No major blunder (ΔEq > 0.020) detected in this game.'
                : 'Aucune erreur majeure (ΔEq > 0.020) détectée sur cette partie.',
        );
    }
    if (strengths.length === 0) {
        strengths.push(
            isEn
                ? 'You completed the game with determination: every match fuels your progress.'
                : 'Vous avez mené la partie jusqu’au bout : chaque manche est une progression.',
        );
    }

    // Faiblesses
    if (counters.blunder > 0) {
        weaknesses.push(
            isEn
                ? `${counters.blunder} major blunder${counters.blunder > 1 ? 's' : ''} cost ${payload.totalEquityLoss.toFixed(3)} equity.`
                : `${counters.blunder} blunder${counters.blunder > 1 ? 's' : ''} majeur${counters.blunder > 1 ? 's' : ''} ont coûté ${payload.totalEquityLoss.toFixed(3)} d’équité.`,
        );
    }
    if (counters.inaccuracy > 0) {
        weaknesses.push(
            isEn
                ? `${counters.inaccuracy} inaccurac${counters.inaccuracy > 1 ? 'ies' : 'y'}: playable but suboptimal moves.`
                : `${counters.inaccuracy} imprécision${counters.inaccuracy > 1 ? 's' : ''} : des coups jouables mais sous-optimaux.`,
        );
    }
    const worstPhase = (Object.entries(phaseBreakdown) as Array<[GamePhaseLabel, number]>)
        .filter(([phase]) => phase !== 'unknown')
        .sort((a, b) => b[1] - a[1])[0];
    if (worstPhase && worstPhase[1] > 0) {
        weaknesses.push(
            isEn
                ? `The "${PHASE_LABELS_EN[worstPhase[0]]}" phase concentrated ${worstPhase[1]} error${worstPhase[1] > 1 ? 's' : ''}.`
                : `La phase « ${PHASE_LABELS[worstPhase[0]]} » concentre ${worstPhase[1]} erreur${worstPhase[1] > 1 ? 's' : ''}.`,
        );
    }
    if (weaknesses.length === 0) {
        weaknesses.push(
            isEn
                ? 'No recurring weakness stood out: keep varying your positions.'
                : 'Aucune faiblesse récurrente marquante : continuez à varier vos positions.',
        );
    }

    // Plan d'entraînement (1 à 2 axes prioritaires)
    if (counters.blunder > 0) {
        trainingPlan.push(
            isEn
                ? 'Practice the "Blunders" Drills to lock in blot safety and prime discipline.'
                : 'Travaillez les Drills « Blunders » pour ancrer les réflexes de sécurité.',
        );
    }
    if (worstPhase && worstPhase[1] > 0) {
        trainingPlan.push(
            isEn
                ? `Focus on the "${PHASE_LABELS_EN[worstPhase[0]]}" phase with targeted exercises.`
                : `Concentrez-vous sur la phase « ${PHASE_LABELS[worstPhase[0]]} » avec des exercices ciblés.`,
        );
    }
    if (counters.inaccuracy > 0 && trainingPlan.length < 2) {
        trainingPlan.push(
            isEn
                ? 'Compare your candidate move against the Coach Top 3 before confirming.'
                : 'Comparez systématiquement votre coup au Top 3 du Coach avant de valider.',
        );
    }
    if (trainingPlan.length === 0) {
        trainingPlan.push(
            isEn
                ? 'Keep your pace: 10 minutes of daily tactical puzzles will sharpen your precision.'
                : 'Maintenez votre rythme : 10 minutes de puzzles par jour suffisent.',
        );
    }

    // Construction des 3 volets Grandmaster (🎯 Diagnostic, 💡 Concept Clé, 🚀 Plan)
    const topBlunder = blunders[0];
    let diagnostic: string;
    let keyConcept: { title: string; explanation: string };

    if (topBlunder) {
        const note = buildBlunderPedagogicalNote(
            {
                phase: topBlunder.phase,
                category: topBlunder.category ?? classifyMoveByEquityLoss(topBlunder.equityLoss),
                playedNotation: topBlunder.playedNotation,
                optimalNotation: topBlunder.optimalNotation,
                equityLoss: topBlunder.equityLoss,
            },
            locale,
        );
        diagnostic = note.diagnostic;
        const [conceptTitle, ...rest] = note.keyConcept.split(':');
        keyConcept = {
            title: conceptTitle.trim(),
            explanation: rest.join(':').trim() || note.keyConcept,
        };
    } else {
        diagnostic = isEn
            ? 'Your checker play remained disciplined with no severe equity loss or exposed blot.'
            : 'Votre jeu de pions est resté rigoureux sans perte d’équité sévère ni exposition de blot critique.';
        keyConcept = {
            title: isEn ? 'Maintaining the Initiative' : 'Conservation de l’initiative',
            explanation: isEn
                ? 'Combine solid inner-board points with timely doubling cube pressure.'
                : 'Combinez la construction de flèches intérieures avec une pression constante au videau.',
        };
    }

    return {
        title: isEn ? 'Grandmaster Match Review' : 'Diagnostic du Grand-Maître',
        summary: `PR ${performanceRating.toFixed(2)} — ${payload.prCategory}.`,
        diagnostic,
        keyConcept,
        strengths,
        weaknesses,
        trainingPlan,
        recurringThemes: payload.recurringThemes ?? [],
    };
}
