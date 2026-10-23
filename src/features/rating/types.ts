/**
 * Types pour l'estimation du Rating / Performance Rating (PR) sur une partie complète.
 *
 * Repose sur les standards officiels de Snowie / GNU Backgammon / eXtreme Gammon :
 * - Perte d'équité (Equity Loss) par décision non forcée (EMG)
 * - Error Rate (XG) = (CheckerLoss + CubeLoss) / (UnforcedCheckerMoves + CloseCubeDecisions)
 * - Snowie Error Rate = Perte totale / Total des tours joués
 * - PR = Error Rate * 500
 * - Luck-Adjusted PR & MWC (%) via la table Kazaross-XG2
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
    /** État du plateau avant le coup (26-28 entiers) */
    boardBefore: number[];
    /** État du plateau après le coup (26-28 entiers) */
    boardAfter: number[];
    /** Notation standard du coup joué (ex: "24/20 13/11") */
    playedNotation: string;
    /** Notation standard du coup optimal certifié (ex: "24/18") */
    optimalNotation: string;
    /** Perte d'équité subie (négative ou nulle, ex: -0.045 EMG) */
    equityLoss: number;
    /** Équité EMG optimale avant/avec le jet (ex: +0.240) */
    equityBefore?: number;
    /** Équité EMG après le coup joué (ex: +0.195) */
    equityAfter?: number;
    /** Probabilité de gain du match MWC (%) avant le coup (0 à 100) */
    mwcBefore?: number;
    /** Probabilité de gain du match MWC (%) après le coup (0 à 100) */
    mwcAfter?: number;
    /** Chance du jet de dés en EMG (Luck = Equity(Roll) - AvgEquity) */
    luck?: number;
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
    /** Perte d'équité éventuelle sur décision de videau (Cube) lors de ce tour */
    cubeEquityLoss?: number;
    /** Indique si le tour comportait une décision de videau serrée (Close Cube Decision) */
    isCloseCubeDecision?: boolean;
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
    /** Nombre de décisions non forcées considérées dans le calcul (Checker + Close Cube) */
    unforcedDecisionsCount: number;
    /** Nombre de décisions de videau serrées (Close Cube Decisions) */
    closeCubeDecisionsCount?: number;
    /** Perte d'équité totale accumulée (EMG : Checker + Cube) */
    totalEquityLoss: number;
    /** Perte d'équité spécifique au videau (EMG) */
    cubeEquityLoss?: number;
    /** PR spécifique au jeu de pions (Checker Play PR) */
    checkerPR?: number;
    /** PR spécifique au videau (Cube Play PR) */
    cubePR?: number;
    /** Taux d'erreur moyen par décision non forcée (XG Error Rate) */
    errorRate: number;
    /** Taux d'erreur non pondéré Snowie (Perte totale / Total des tours) */
    snowieErrorRate?: number;
    /** Performance Rating officiel combiné (GNU / XG : ((CheckerLoss + CubeLoss) / (UnforcedChecker + CloseCube)) * 500) */
    performanceRating: number;
    /** Chance totale des dés cumulée sur la partie (EMG) */
    totalLuck?: number;
    /** Chance moyenne par jet de dés (EMG / tour) */
    luckRate?: number;
    /** Performance Rating ajusté à la chance (Luck-Adjusted PR) */
    luckAdjustedPR?: number;
    /** Estimation du niveau Elo dérivée du PR */
    estimatedRating: number;
    /** Catégorie de PR */
    prCategory: PRCategory;
    /** Ventilation des coups par qualité */
    breakdown: MoveBreakdown;
    /** Détail de tous les coups évalués de la partie */
    evaluatedMoves: EvaluatedTurn[];
}

export interface RawCubeTurnDecision {
    /** Action choisie sur le videau ('no_double' | 'double' | 'take' | 'pass') */
    action: 'no_double' | 'double' | 'take' | 'pass';
    /** Indique explicitement s'il s'agissait d'une décision de videau serrée (Close Cube Decision) */
    isCloseDecision?: boolean;
    /** Perte d'équité subie sur la décision de videau (EMG, ex: 0.065) */
    cubeEquityLoss?: number;
}

export interface RawGameTurn {
    turnNumber: number;
    player: Player;
    dice: [number, number];
    boardBefore: number[];
    boardAfter: number[];
    moves: Move[];
    cubeValue?: number;
    cubeOwner?: Player | null;
    crawford?: boolean;
    cubeDecision?: RawCubeTurnDecision;
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
