/**
 * Types pour l'estimation du Rating / Performance Rating (PR) sur une partie complète.
 *
 * Repose sur les standards officiels de Snowie / GNU Backgammon / eXtreme Gammon :
 * - Perte d'équité (Equity Loss) par décision non forcée
 * - Error Rate = Perte totale / Décisions non forcées
 * - PR = Error Rate * 500
 * - Estimated Rating (Elo) = 2150 - (PR * 52)
 */

import type { Player, Move } from '../../engine/backgammonEngine';

export type MoveVerdict = 'optimal' | 'acceptable' | 'doubtful' | 'blunder' | 'howler';

export type PRCategory =
    | 'Grand-Maître'
    | 'Maître'
    | 'Expert'
    | 'Avancé'
    | 'Intermédiaire'
    | 'Débutant';

export interface EvaluatedTurn {
    /** Numéro d'ordre du coup dans la partie */
    moveNumber: number;
    /** Joueur au trait */
    player: Player;
    /** Jet de dés utilisé [d1, d2] */
    dice: [number, number];
    /** État du plateau avant le coup (28 entiers) */
    boardBefore: number[];
    /** État du plateau après le coup (28 entiers) */
    boardAfter: number[];
    /** Notation standard du coup joué (ex: "24/20 13/11") */
    playedNotation: string;
    /** Notation standard du coup optimal certifié (ex: "24/18") */
    optimalNotation: string;
    /** Perte d'équité subie (négative ou nulle, ex: -0.045) */
    equityLoss: number;
    /** Qualification du coup */
    verdict: MoveVerdict;
    /** Décision non forcée (plus d'un choix légal possible) */
    isUnforced: boolean;
    /** Nombre de séquences légales candidates examinées */
    candidateCount: number;
    /** Explication stratégique sommaire */
    explanation?: string;
    /** Concept stratégique associé si blunder ou douteux */
    conceptId?: string;
}

export interface MoveBreakdown {
    optimal: number;
    acceptable: number;
    doubtful: number;
    blunder: number;
    howler: number;
}

export interface CompleteGameAnalysis {
    /** Identifiant unique de l'analyse */
    id: string;
    /** Identifiant de la partie source */
    gameId: string;
    /** Date de la partie (ISO string) */
    date: string;
    /** Couleur du joueur analysé */
    player: Player;
    /** Adversaire */
    opponentType: 'ai' | 'human';
    /** Difficulté de l'IA si applicable */
    opponentDifficulty?: string | null;
    /** Vainqueur de la manche */
    winner?: Player | null;
    /** Type de victoire */
    winType?: 'single' | 'gammon' | 'backgammon' | 'pass' | null;
    /** Points remportés */
    pointsWon?: number;
    /** Score de X */
    scoreX: number;
    /** Score de O */
    scoreO: number;
    /** Longueur du match en points */
    matchLength: number;
    /** Nombre total de demi-coups joués */
    totalMovesCount: number;
    /** Nombre de décisions prises */
    decisionsCount: number;
    /** Nombre de décisions non forcées considérées dans le calcul */
    unforcedDecisionsCount: number;
    /** Perte d'équité totale accumulée */
    totalEquityLoss: number;
    /** Taux d'erreur moyen par décision non forcée */
    errorRate: number;
    /** Performance Rating officiel (GNU / XG) */
    performanceRating: number;
    /** Estimation du niveau Elo dérivée du PR */
    estimatedRating: number;
    /** Catégorie de PR */
    prCategory: PRCategory;
    /** Ventilation des coups par qualité */
    breakdown: MoveBreakdown;
    /** Détail de tous les coups évalués de la partie */
    evaluatedMoves: EvaluatedTurn[];
}

export interface RawGameTurn {
    turnNumber: number;
    player: Player;
    dice: [number, number];
    boardBefore: number[];
    boardAfter: number[];
    moves: Move[];
}

export interface RatingHistoryPoint {
    id: string;
    gameId: string;
    date: string;
    performanceRating: number;
    estimatedRating: number;
    prCategory: PRCategory;
    winner: Player;
    isPlayerWinner: boolean;
    movesCount: number;
    errorRate: number;
}
