/**
 * Types atomiques pour l'architecture constitutionnelle "1 Bouton = 1 Micro-Programme"
 * Gouvernés par les 5 Lois Fondamentales de SCALABILITY.md.
 */

import type { Player, Move } from '../engine/backgammonEngine';
import type { AIDifficulty } from '../engine/aiHeuristics';

/**
 * Machine à États Finis Unique (LOI 2)
 * Aucune superposition de booléens contradictoires : une seule phase régit l'affichage et les droits d'action.
 */
export type GamePhase =
    | 'HUMAN_WAITING_ROLL'
    | 'HUMAN_MOVING'
    | 'HUMAN_READY_TO_COMMIT'
    | 'AI_TURN_ROLLING'
    | 'AI_TURN_SHOWING_ARROWS'
    | 'GAME_OVER';

/**
 * Entrée immuable de log de match (LOI 3)
 * Source de vérité absolue pour l'analyse coach et la reconstitution historique.
 */
export interface MatchLogEntry {
    readonly turnIndex: number;
    readonly player: Player;
    readonly dice: readonly [number, number];
    readonly boardBefore: ReadonlyArray<number>;
    readonly movePlayed: ReadonlyArray<Move>;
    readonly boardAfter: ReadonlyArray<number>;
    readonly notation?: string;
    readonly timestamp?: number;
}

/**
 * Contexte de base pour les micro-programmes d'action
 */
export interface ActionContext {
    readonly gamePhase: GamePhase;
    readonly matchLog: ReadonlyArray<MatchLogEntry>;
    readonly currentBoard: ReadonlyArray<number>;
    readonly localConnectedPlayer?: Player;
}

/**
 * Paramètres pour l'action commitHumanMoveAction
 */
export interface CommitHumanMoveParams {
    readonly currentPhase: GamePhase;
    readonly turnIndex: number;
    readonly player: Player;
    readonly dice: readonly [number, number];
    readonly boardBefore: ReadonlyArray<number>;
    readonly movesPlayed: ReadonlyArray<Move>;
    readonly boardAfter: ReadonlyArray<number>;
    readonly matchLog: ReadonlyArray<MatchLogEntry>;
    readonly localConnectedPlayer?: Player;
    readonly isGameOver?: boolean;
}

/**
 * Paramètres pour l'action runAiTurnAction
 */
export interface RunAiTurnParams {
    readonly currentBoard: ReadonlyArray<number>;
    readonly turnIndex: number;
    readonly dice: readonly [number, number];
    readonly difficulty?: AIDifficulty;
    readonly matchLog?: ReadonlyArray<MatchLogEntry>;
    readonly rollDurationMs?: number;
    readonly previewDurationMs?: number;
    /** Espacement entre chaque sous-coup de l'IA (défaut : 180ms — Audit 19/20). */
    readonly subMoveSpacingMs?: number;
    readonly isGameOver?: boolean;
}

/**
 * Callbacks d'orchestration pour runAiTurnAction
 */
export interface RunAiTurnCallbacks {
    readonly onPhaseChange: (phase: GamePhase) => void;
    readonly onArrowsReady?: (arrows: Array<{ from: number; to: number }>) => void;
    /** Callback optionnel déclenché à chaque sous-coup intermédiaire (espacement 180ms — Audit 19/20). */
    readonly onSubMoveStep?: (
        partialBoard: ReadonlyArray<number>,
        move: Move,
        stepIndex: number,
    ) => void;
    readonly onApplyBoard?: (board: ReadonlyArray<number>) => void;
    readonly onLogEntryAdded?: (entry: MatchLogEntry) => void;
    readonly onTurnComplete?: (nextPhase: GamePhase) => void;
}

/**
 * Paramètres pour l'action replayFromLogAction
 */
export interface ReplayFromLogParams {
    readonly logEntry: MatchLogEntry;
    readonly showBefore?: boolean;
}

export interface ReplayFromLogResult {
    readonly previewBoard: ReadonlyArray<number>;
    readonly activePlayer: Player;
    readonly dice: readonly [number, number];
    readonly arrows: ReadonlyArray<Move>;
    readonly turnIndex: number;
}
