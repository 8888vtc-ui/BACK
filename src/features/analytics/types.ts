/**
 * Types pour le module Analytics du Backgammon :
 * - Error rate par type de coup (Phase / Tactique)
 * - Heatmap des concepts faibles
 * - Courbe de progression temporelle
 */

import type { EvaluatedTurn, CompleteGameAnalysis } from '../rating/types';

export type MoveTypeCategory =
    | 'opening'        // Jet d'ouverture
    | 'hit_attack'     // Frappe & Blitz
    | 'point_making'   // Fabrication de porte & Prime
    | 'anchor_defense' // Ancrage & Fond de court
    | 'pure_race'      // Course pure & Avance
    | 'bear_off';      // Sortie des pions

export interface MoveTypeMetric {
    type: MoveTypeCategory;
    label: string;
    description: string;
    icon: string;
    decisionsCount: number;
    errorCount: number;
    blunderCount: number;
    totalEquityLoss: number;
    errorRate: number; // Perte moyenne par coup (ΔEq)
    masteryPercentage: number; // 0 à 100%
}

export type GamePhase = 'opening' | 'middle_game' | 'endgame';

export interface HeatmapCell {
    conceptId: string;
    conceptName: string;
    category: string;
    phase: GamePhase;
    phaseLabel: string;
    errorCount: number;
    blunderCount: number;
    totalEquityLoss: number;
    intensity: number; // Normalisé 0 (parfait/vert) à 1 (critique/rouge)
}

export interface ProgressionDataPoint {
    gameNumber: number;
    gameId: string;
    date: string;
    performanceRating: number;
    movingAveragePR: number;
    errorRate: number;
    estimatedElo: number;
    winner: boolean;
}

export interface AnalyticsSummary {
    totalGames: number;
    totalDecisions: number;
    moveTypeMetrics: MoveTypeMetric[];
    heatmapCells: HeatmapCell[];
    progressionPoints: ProgressionDataPoint[];
    overallMastery: number;
}
