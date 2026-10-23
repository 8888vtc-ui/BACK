/**
 * Calculateur Analytics — Error Rate par type de coup, Blunder Heatmap Tactique (3×5),
 * Heatmap des concepts et Courbe de progression.
 */

import type { EvaluatedTurn, CompleteGameAnalysis } from '../rating/types';
import {
    STRATEGIC_CONCEPTS_CATALOG,
    categorizeExplanation,
} from '../../lib/stats/statsAggregator';
import type {
    MoveTypeCategory,
    MoveTypeMetric,
    GamePhase,
    TacticalTheme,
    TacticalHeatmapCell,
    HeatmapCell,
    ProgressionDataPoint,
    AnalyticsSummary,
} from './types';

export const TACTICAL_THEME_CONFIGS: Record<
    TacticalTheme,
    { label: string; description: string; icon: string }
> = {
    slotting: {
        label: 'Slotting',
        description: 'Exposition calculée d’un blot sur une case clé (Point 5, 4 ou Bar-point) pour préparer une porte.',
        icon: '🎯',
    },
    priming: {
        label: 'Priming',
        description: 'Construction d’un mur de portes consécutives (Prime de 4, 5 ou 6 portes) pour enfermer les pions adverses.',
        icon: '🏰',
    },
    blitz: {
        label: 'Blitz',
        description: 'Attaque frontale dans le jan intérieur avec frappes répétées et fermeture de portes pour viser le Gammon.',
        icon: '⚡',
    },
    holding: {
        label: 'Holding',
        description: 'Maintien d’une ancre haute ou basse dans le camp adverse pour contrôler le timing et menacer un coup direct.',
        icon: '⚓',
    },
    racing: {
        label: 'Racing',
        description: 'Course pure sans contact, gestion du Pip Count, rapatriement sécurisé et sortie des pions (Bearing off).',
        icon: '🏁',
    },
};

export const MOVE_TYPE_CONFIGS: Record<
    MoveTypeCategory,
    { label: string; description: string; icon: string }
> = {
    opening: {
        label: 'Ouvertures',
        description: 'Jets initiaux de début de partie (sans doubles).',
        icon: '📖',
    },
    hit_attack: {
        label: 'Frappe & Attaque',
        description: 'Frappes de blots adverses, blitz et combat de contact.',
        icon: '⚔️',
    },
    point_making: {
        label: 'Fabrication de Portes',
        description: 'Construction de portes maîtresses et développement de primes.',
        icon: '🏰',
    },
    anchor_defense: {
        label: 'Ancrage & Défense',
        description: 'Création d’ancres arrières et sécurité des pions exposés.',
        icon: '🛡️',
    },
    pure_race: {
        label: 'Course & Rapatriement',
        description: 'Progression sans contact et gestion de l’avance au Pip Count.',
        icon: '🏃',
    },
    bear_off: {
        label: 'Sortie des Pions',
        description: 'Bear-off dans le jan intérieur et sécurité des derniers pions.',
        icon: '🏁',
    },
};

/**
 * Classifie un coup dans l'un des 5 thèmes tactiques fondamentaux :
 * Slotting, Priming, Blitz, Holding, Racing.
 */
export function classifyTacticalTheme(turn: EvaluatedTurn): TacticalTheme {
    const played = (turn.playedNotation || '').toLowerCase();
    const explanation = (turn.explanation || '').toLowerCase();

    // 0. Sortie des pions (Bearing off) -> Racing
    if (played.includes('/off') || played.includes('/0')) {
        return 'racing';
    }

    // 1. Blitz : frappe dans le jan intérieur (/1*, /2*, /3*, /4*, /5*, /6*) ou mention explicite
    if (
        explanation.includes('blitz') ||
        /\/[1-6]\*/.test(played) ||
        (played.includes('*') && (explanation.includes('attaque') || explanation.includes('attack')))
    ) {
        return 'blitz';
    }

    // 2. Slotting : mention explicite de slot/blot ou coup unique exposant une flèche clé (5, 4, 7)
    const parts = played.split(/\s+/).filter(Boolean);
    const dests = parts.map((p) => p.split('/')[1]?.replace('*', ''));
    const isPointMade =
        dests.length >= 2 &&
        dests[0] !== undefined &&
        dests[0] !== 'off' &&
        dests[0] !== '0' &&
        dests[0] === dests[1];

    if (
        explanation.includes('slot') ||
        explanation.includes('blot') ||
        turn.conceptId === 'blot_safety' ||
        (!isPointMade && /\b(13\/7|8\/5|6\/5|8\/4|6\/4)\b/.test(played))
    ) {
        return 'slotting';
    }

    // 3. Priming : construction de portes consécutives ou deux pions sur la même case
    if (
        isPointMade ||
        explanation.includes('prime') ||
        explanation.includes('mur') ||
        explanation.includes('porte') ||
        turn.conceptId === 'prime_building' ||
        turn.conceptId === 'golden_point'
    ) {
        return 'priming';
    }

    // 4. Holding : ancre arrière (points 20 à 24 ou entrée depuis la barre)
    if (
        explanation.includes('ancre') ||
        explanation.includes('anchor') ||
        explanation.includes('holding') ||
        turn.conceptId === 'anchor_defense' ||
        played.includes('bar/') ||
        played.includes('24/') ||
        /\/2[0-4]\b/.test(played)
    ) {
        return 'holding';
    }

    // 5. Racing : course pure et sortie des pions (Bearing off)
    return 'racing';
}

/**
 * Génère la Blunder Heatmap Tactique 2D :
 * 3 Phases (Opening, Midgame, Bearing off) × 5 Thèmes (Slotting, Priming, Blitz, Holding, Racing).
 */
export function calculateTacticalBlunderHeatmap(
    analyses: CompleteGameAnalysis[],
): TacticalHeatmapCell[] {
    const phases: Array<{ phase: GamePhase; label: string }> = [
        { phase: 'opening', label: 'Opening (Ouverture)' },
        { phase: 'middle_game', label: 'Midgame (Milieu de jeu)' },
        { phase: 'endgame', label: 'Bearing off (Sortie)' },
    ];

    const themes: TacticalTheme[] = ['slotting', 'priming', 'blitz', 'holding', 'racing'];
    const cellMap = new Map<string, TacticalHeatmapCell>();

    for (const theme of themes) {
        const cfg = TACTICAL_THEME_CONFIGS[theme];
        for (const p of phases) {
            const key = `${theme}_${p.phase}`;
            cellMap.set(key, {
                theme,
                themeLabel: cfg.label,
                themeDescription: cfg.description,
                phase: p.phase,
                phaseLabel: p.label,
                decisionsCount: 0,
                errorCount: 0,
                blunderCount: 0,
                totalEquityLoss: 0,
                intensity: 0,
            });
        }
    }

    let maxLossInCell = 0.05;

    for (const analysis of analyses) {
        for (const move of analysis.evaluatedMoves) {
            const theme = classifyTacticalTheme(move);
            const phase = classifyGamePhase(move.moveNumber, move.boardBefore);
            const key = `${theme}_${phase}`;
            const cell = cellMap.get(key);
            if (!cell) continue;

            cell.decisionsCount += 1;
            const isError =
                move.verdict === 'doubtful' ||
                move.verdict === 'blunder' ||
                move.verdict === 'howler';

            if (isError) {
                cell.errorCount += 1;
                if (move.verdict === 'blunder' || move.verdict === 'howler') {
                    cell.blunderCount += 1;
                }
                cell.totalEquityLoss += Math.abs(move.equityLoss);
                if (cell.totalEquityLoss > maxLossInCell) {
                    maxLossInCell = cell.totalEquityLoss;
                }
            }
        }
    }

    return Array.from(cellMap.values()).map((cell) => {
        const intensity = Math.min(1, cell.totalEquityLoss / maxLossInCell);
        return {
            ...cell,
            totalEquityLoss: Number(cell.totalEquityLoss.toFixed(3)),
            intensity: Number(intensity.toFixed(2)),
        };
    });
}

/**
 * Détermine la catégorie tactique d'un coup.
 */
export function classifyMoveType(turn: EvaluatedTurn): MoveTypeCategory {
    const notation = (turn.playedNotation || '').toLowerCase();

    // 1. Début de partie (Tour 1)
    if (turn.moveNumber <= 1) {
        return 'opening';
    }

    // 2. Sortie de pions (bear-off)
    if (notation.includes('/off') || notation.includes('/0')) {
        return 'bear_off';
    }

    // 3. Frappe de pion adverse (hit)
    if (notation.includes('*')) {
        return 'hit_attack';
    }

    // Vérifie si un pion adverse a été envoyé à la barre
    if (turn.boardBefore && turn.boardAfter) {
        const oBarBefore = turn.boardBefore[25] || 0;
        const oBarAfter = turn.boardAfter[25] || 0;
        if (oBarAfter < oBarBefore) {
            return 'hit_attack';
        }
    }

    // 4. Ancrage arrière (pions sur 20, 21, 22, 23, 24 ou venant de la barre 25)
    if (
        notation.includes('24/') ||
        notation.includes('bar/') ||
        notation.includes('/20') ||
        notation.includes('/21') ||
        notation.includes('/22')
    ) {
        return 'anchor_defense';
    }

    // 5. Fabrication de porte (Point making) : 8/5 6/5, 8/4 6/4, 8/3 6/3, etc.
    const parts = notation.split(/\s+/);
    if (parts.length >= 2) {
        const dests = parts.map((p) => p.split('/')[1]);
        if (dests.length >= 2 && dests[0] === dests[1] && dests[0] !== undefined) {
            return 'point_making';
        }
    }

    // 6. Par défaut : Course / Rapatriement
    return 'pure_race';
}

/**
 * Détermine la phase de jeu (Ouverture, Milieu de jeu, Fin de partie).
 */
export function classifyGamePhase(moveNumber: number, board: number[]): GamePhase {
    if (moveNumber <= 2) return 'opening';

    // Compte les pions dans le jan intérieur (flèches 1 à 6 pour X)
    let homeCheckers = 0;
    if (board && board.length >= 26) {
        for (let i = 1; i <= 6; i++) {
            if (board[i] > 0) homeCheckers += board[i];
        }
    }

    if (homeCheckers >= 10 || moveNumber >= 14) {
        return 'endgame';
    }

    return 'middle_game';
}

/**
 * Calcule l'error rate et les métriques de chaque type de coup.
 */
export function calculateMoveTypeMetrics(analyses: CompleteGameAnalysis[]): MoveTypeMetric[] {
    const buckets: Record<
        MoveTypeCategory,
        {
            decisionsCount: number;
            errorCount: number;
            blunderCount: number;
            totalEquityLoss: number;
        }
    > = {
        opening: { decisionsCount: 0, errorCount: 0, blunderCount: 0, totalEquityLoss: 0 },
        hit_attack: { decisionsCount: 0, errorCount: 0, blunderCount: 0, totalEquityLoss: 0 },
        point_making: { decisionsCount: 0, errorCount: 0, blunderCount: 0, totalEquityLoss: 0 },
        anchor_defense: { decisionsCount: 0, errorCount: 0, blunderCount: 0, totalEquityLoss: 0 },
        pure_race: { decisionsCount: 0, errorCount: 0, blunderCount: 0, totalEquityLoss: 0 },
        bear_off: { decisionsCount: 0, errorCount: 0, blunderCount: 0, totalEquityLoss: 0 },
    };

    for (const analysis of analyses) {
        for (const move of analysis.evaluatedMoves) {
            const cat = classifyMoveType(move);
            const b = buckets[cat];
            b.decisionsCount += 1;
            b.totalEquityLoss += Math.abs(move.equityLoss);

            if (move.verdict === 'doubtful' || move.verdict === 'blunder' || move.verdict === 'howler') {
                b.errorCount += 1;
            }
            if (move.verdict === 'blunder' || move.verdict === 'howler') {
                b.blunderCount += 1;
            }
        }
    }

    const categories: MoveTypeCategory[] = [
        'opening',
        'hit_attack',
        'point_making',
        'anchor_defense',
        'pure_race',
        'bear_off',
    ];

    return categories.map((type) => {
        const b = buckets[type];
        const config = MOVE_TYPE_CONFIGS[type];
        const count = Math.max(1, b.decisionsCount);
        const errorRate = Number((b.totalEquityLoss / count).toFixed(4));

        const masteryPercentage = Math.max(
            15,
            Math.min(100, Math.round(100 - errorRate * 600)),
        );

        return {
            type,
            label: config.label,
            description: config.description,
            icon: config.icon,
            decisionsCount: b.decisionsCount,
            errorCount: b.errorCount,
            blunderCount: b.blunderCount,
            totalEquityLoss: Number(b.totalEquityLoss.toFixed(3)),
            errorRate,
            masteryPercentage,
        };
    });
}

/**
 * Génère la Heatmap 2D des concepts faibles croisés par phase de jeu.
 */
export function generateConceptsHeatmap(analyses: CompleteGameAnalysis[]): HeatmapCell[] {
    const phases: Array<{ phase: GamePhase; label: string }> = [
        { phase: 'opening', label: 'Ouverture' },
        { phase: 'middle_game', label: 'Milieu de jeu' },
        { phase: 'endgame', label: 'Sortie / Course' },
    ];

    const cellMap = new Map<string, HeatmapCell>();

    for (const concept of STRATEGIC_CONCEPTS_CATALOG) {
        for (const p of phases) {
            const key = `${concept.id}_${p.phase}`;
            cellMap.set(key, {
                conceptId: concept.id,
                conceptName: concept.name,
                category: concept.category,
                phase: p.phase,
                phaseLabel: p.label,
                errorCount: 0,
                blunderCount: 0,
                totalEquityLoss: 0,
                intensity: 0,
            });
        }
    }

    let maxLossInCell = 0.05;

    for (const analysis of analyses) {
        for (const move of analysis.evaluatedMoves) {
            const isError =
                move.verdict === 'doubtful' || move.verdict === 'blunder' || move.verdict === 'howler';
            if (!isError) continue;

            const conceptId =
                move.conceptId ||
                categorizeExplanation(move.explanation, `${move.playedNotation} ${move.optimalNotation}`);
            const phase = classifyGamePhase(move.moveNumber, move.boardBefore);
            const key = `${conceptId}_${phase}`;

            let cell = cellMap.get(key);
            if (!cell) {
                cell = cellMap.get(`${STRATEGIC_CONCEPTS_CATALOG[0].id}_${phase}`)!;
            }

            if (cell) {
                cell.errorCount += 1;
                if (move.verdict === 'blunder' || move.verdict === 'howler') {
                    cell.blunderCount += 1;
                }
                cell.totalEquityLoss += Math.abs(move.equityLoss);
                if (cell.totalEquityLoss > maxLossInCell) {
                    maxLossInCell = cell.totalEquityLoss;
                }
            }
        }
    }

    const cells = Array.from(cellMap.values()).map((cell) => {
        const intensity = Math.min(1, cell.totalEquityLoss / maxLossInCell);
        return {
            ...cell,
            totalEquityLoss: Number(cell.totalEquityLoss.toFixed(3)),
            intensity: Number(intensity.toFixed(2)),
        };
    });

    return cells;
}

/**
 * Calcule la courbe chronologique de progression (PR, moyenne mobile, Elo estimé).
 */
export function calculateProgressionTimeline(
    analyses: CompleteGameAnalysis[],
): ProgressionDataPoint[] {
    const sorted = [...analyses].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const windowSize = 3;
    const history: ProgressionDataPoint[] = [];

    for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];

        const start = Math.max(0, i - windowSize + 1);
        const windowSlice = sorted.slice(start, i + 1);
        const avgPR =
            windowSlice.reduce((sum, g) => sum + g.performanceRating, 0) / windowSlice.length;

        history.push({
            gameNumber: i + 1,
            gameId: item.gameId,
            date: item.date,
            performanceRating: item.performanceRating,
            movingAveragePR: Number(avgPR.toFixed(1)),
            errorRate: item.errorRate,
            estimatedElo: item.estimatedRating,
            winner: item.winner === item.player,
        });
    }

    return history;
}

/**
 * Synthèse globale Analytics.
 */
export function computeAnalyticsSummary(analyses: CompleteGameAnalysis[]): AnalyticsSummary {
    const moveTypeMetrics = calculateMoveTypeMetrics(analyses);
    const heatmapCells = generateConceptsHeatmap(analyses);
    const tacticalHeatmapCells = calculateTacticalBlunderHeatmap(analyses);
    const progressionPoints = calculateProgressionTimeline(analyses);

    const totalDecisions = moveTypeMetrics.reduce((acc, m) => acc + m.decisionsCount, 0);
    const overallMastery =
        moveTypeMetrics.length > 0
            ? Math.round(
                  moveTypeMetrics.reduce((acc, m) => acc + m.masteryPercentage, 0) /
                      moveTypeMetrics.length,
              )
            : 80;

    return {
        totalGames: analyses.length,
        totalDecisions,
        moveTypeMetrics,
        heatmapCells,
        tacticalHeatmapCells,
        progressionPoints,
        overallMastery,
    };
}
