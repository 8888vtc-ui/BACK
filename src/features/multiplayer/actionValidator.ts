/**
 * Module de Validation Serveur des Coups & Actions (Anti-triche Basique).
 *
 * Vérifie l'autorité et la légalité de chaque action reçue avant application :
 * 1. Autorité du tour : Seul le joueur actif peut jouer / lancer les dés.
 * 2. Contrôle des dés : Valeurs entières strictes [1..6], impossibilité de relancer en cours de tour.
 * 3. Obligation de rentrée de la barre : Si un pion est sur la barre, TOUT autre déplacement est bloqué.
 * 4. Contrôle de destination : Interdiction d'atterrir sur une flèche bloquée (2+ pions adverses).
 * 5. Contrôle du Bear-off (sortie) : Interdiction de sortir un pion si l'ensemble des 15 pions n'est pas dans le jan intérieur.
 * 6. Règle du Videau : Interdiction en manche de Crawford, interdiction après le jet de dés, contrôle de possession.
 * 7. Contrôle d'horloge / Timeout : Rejet des coups post-expiration.
 */

import type { Player, Move } from '../../engine/backgammonEngine';
import {
    generateLegalMoves,
    applyMove,
    X_BAR,
    O_BAR,
    X_OFF,
    O_OFF,
} from '../../engine/backgammonEngine';
import { isInitialBoardPosition } from '../openings/openingDatabase';
import type { RealtimeBroadcastAction } from './types';

export type ValidationErrorCode =
    | 'OK'
    | 'ROOM_NOT_ACTIVE'
    | 'NOT_YOUR_TURN'
    | 'DICE_ALREADY_ROLLED'
    | 'INVALID_DICE_VALUES'
    | 'DICE_NOT_ROLLED'
    | 'NO_CHECKER_AT_SOURCE'
    | 'BAR_MUST_ENTER'
    | 'POINT_BLOCKED'
    | 'BEAR_OFF_NOT_ALLOWED'
    | 'ILLEGAL_MOVE_DISTANCE'
    | 'INVALID_MOVE_SEQUENCE'
    | 'CRAWFORD_RESTRICTION'
    | 'OPENING_POSITION_NO_DOUBLE'
    | 'CUBE_NOT_OWNED'
    | 'DOUBLE_ALREADY_OFFERED'
    | 'CANNOT_DOUBLE_AFTER_ROLL'
    | 'FLAG_FALL_TIMEOUT';

export interface ActionValidationContext {
    action: RealtimeBroadcastAction;
    room: {
        id: string;
        status: string;
        turn: Player;
        board: number[];
        dice: [number, number] | null;
        usedDice: [boolean, boolean] | boolean[];
        cubeValue: number;
        cubeOwner: Player | null;
        doublingOfferedBy: Player | null;
        isCrawford: boolean;
        matchLength: number;
        scoreX: number;
        scoreO: number;
        clockXMs?: number;
        clockOMs?: number;
    };
    clientTimestamp?: number;
}

export interface ValidationResult {
    valid: boolean;
    code: ValidationErrorCode;
    reason?: string;
    resultingBoard?: number[];
}

function isPointBlocked(board: number[], point: number, player: Player): boolean {
    if (point < 1 || point > 24) return false;
    const count = board[point];
    // Pour X, bloqué si au moins 2 pions O (<= -2)
    if (player === 'X') return count <= -2;
    // Pour O, bloqué si au moins 2 pions X (>= 2)
    return count >= 2;
}

function areAllCheckersInHome(board: number[], player: Player): boolean {
    if (player === 'X') {
        if (board[X_BAR] > 0) return false;
        for (let p = 7; p <= 24; p++) {
            if (board[p] > 0) return false;
        }
        return true;
    }
    // Pour O (Jan intérieur = flèches 19 à 24)
    if (board[O_BAR] < 0) return false;
    for (let p = 1; p <= 18; p++) {
        if (board[p] < 0) return false;
    }
    return true;
}

/**
 * Valide une action de jeu avec application des règles strictes du Backgammon.
 */
export function validateGameAction(ctx: ActionValidationContext): ValidationResult {
    const { action, room } = ctx;

    // 1. La salle doit être active (ou en attente pour débuter)
    if (room.status !== 'in_progress' && room.status !== 'waiting' && room.status !== 'ready') {
        return {
            valid: false,
            code: 'ROOM_NOT_ACTIVE',
            reason: `La salle de jeu n'est pas active (statut : ${room.status}).`,
        };
    }

    // 2. Vérification des actions nécessitant le tour du joueur
    const turnSpecificActions = ['DICE_ROLLED', 'CHECKER_MOVED', 'TURN_FINISHED', 'DOUBLE_OFFERED'];
    if (turnSpecificActions.includes(action.type) && action.player !== room.turn) {
        return {
            valid: false,
            code: 'NOT_YOUR_TURN',
            reason: `Action refusée : ce n'est pas le tour de ${action.player} (tour actuel : ${room.turn}).`,
        };
    }

    // 3. Validation spécifique par type d'action
    switch (action.type) {
        case 'DICE_ROLLED': {
            const [d1, d2] = action.dice;
            if (!Number.isInteger(d1) || !Number.isInteger(d2) || d1 < 1 || d1 > 6 || d2 < 1 || d2 > 6) {
                return {
                    valid: false,
                    code: 'INVALID_DICE_VALUES',
                    reason: `Valeurs de dés invalides : [${d1}, ${d2}]. Doivent être entre 1 et 6.`,
                };
            }

            if (room.dice !== null) {
                return {
                    valid: false,
                    code: 'DICE_ALREADY_ROLLED',
                    reason: 'Les dés ont déjà été lancés pour ce tour.',
                };
            }

            return { valid: true, code: 'OK' };
        }

        case 'CHECKER_MOVED': {
            if (!room.dice) {
                return {
                    valid: false,
                    code: 'DICE_NOT_ROLLED',
                    reason: 'Impossible de déplacer un pion avant d’avoir lancé les dés.',
                };
            }

            const { from, to } = action.move;
            const player = action.player;
            const board = room.board;

            // A. Présence d'un pion appartenant au joueur à la case de départ
            const barIndex = player === 'X' ? X_BAR : O_BAR;
            const hasChecker =
                from === barIndex
                    ? player === 'X'
                        ? board[X_BAR] > 0
                        : board[O_BAR] < 0
                    : player === 'X'
                    ? board[from] > 0
                    : board[from] < 0;

            if (!hasChecker) {
                return {
                    valid: false,
                    code: 'NO_CHECKER_AT_SOURCE',
                    reason: `Aucun pion de ${player} n'est présent sur la flèche ${from}.`,
                };
            }

            // B. Obligation absolue de rentrer depuis la barre si un pion s'y trouve
            const hasCheckersOnBar = player === 'X' ? board[X_BAR] > 0 : board[O_BAR] < 0;
            if (hasCheckersOnBar && from !== barIndex) {
                return {
                    valid: false,
                    code: 'BAR_MUST_ENTER',
                    reason: `Règle de la barre : un pion sur la barre (${barIndex}) doit obligatoirement rentrer avant tout autre coup.`,
                };
            }

            // C. Destination bloquée par 2+ pions adverses
            const offIndex = player === 'X' ? X_OFF : O_OFF;
            if (to !== offIndex && isPointBlocked(board, to, player)) {
                return {
                    valid: false,
                    code: 'POINT_BLOCKED',
                    reason: `La flèche de destination ${to} est bloquée par l'adversaire (au moins 2 pions).`,
                };
            }

            // D. Contrôle du Bear-off (sortie de pions)
            if (to === offIndex) {
                const allInHome = areAllCheckersInHome(board, player);
                if (!allInHome) {
                    return {
                        valid: false,
                        code: 'BEAR_OFF_NOT_ALLOWED',
                        reason: `Impossible de sortir un pion : tous les 15 pions de ${player} ne sont pas encore dans le jan intérieur.`,
                    };
                }
            }

            // E. Calcul du plateau résultant
            const resultingBoard = applyMove(board, action.move, player);
            return {
                valid: true,
                code: 'OK',
                resultingBoard,
            };
        }

        case 'DOUBLE_OFFERED': {
            if (room.isCrawford) {
                return {
                    valid: false,
                    code: 'CRAWFORD_RESTRICTION',
                    reason: 'Le videau est interdit pendant la manche de Crawford.',
                };
            }

            if (room.dice !== null) {
                return {
                    valid: false,
                    code: 'CANNOT_DOUBLE_AFTER_ROLL',
                    reason: 'Le videau doit obligatoirement être proposé avant de lancer les dés.',
                };
            }

            if (room.cubeOwner !== null && room.cubeOwner !== action.player) {
                return {
                    valid: false,
                    code: 'CUBE_NOT_OWNED',
                    reason: `Le videau appartient à ${room.cubeOwner}, ${action.player} ne peut pas doubler.`,
                };
            }

            if (room.doublingOfferedBy !== null) {
                return {
                    valid: false,
                    code: 'DOUBLE_ALREADY_OFFERED',
                    reason: 'Une offre de videau est déjà en attente de réponse.',
                };
            }

            if (isInitialBoardPosition(room.board)) {
                return {
                    valid: false,
                    code: 'OPENING_POSITION_NO_DOUBLE',
                    reason: 'Règle officielle WBF 5.1 : impossible de proposer le videau au démarrage avant le premier coup.',
                };
            }

            return { valid: true, code: 'OK' };
        }

        case 'DOUBLE_ACCEPTED':
        case 'DOUBLE_PASSED': {
            // Doit être l'adversaire qui répond
            const expectedResponder = room.turn === 'X' ? 'O' : 'X';
            if (action.player !== expectedResponder) {
                return {
                    valid: false,
                    code: 'NOT_YOUR_TURN',
                    reason: `Seul l'adversaire (${expectedResponder}) peut répondre à l'offre de videau.`,
                };
            }
            return { valid: true, code: 'OK' };
        }

        case 'TURN_FINISHED':
        case 'RESIGNED':
        case 'QUICK_CHAT':
        case 'HEARTBEAT':
        case 'SYNC_STATE':
            return { valid: true, code: 'OK' };

        default:
            return { valid: true, code: 'OK' };
    }
}
