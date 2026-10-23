/**
 * Micro-programme atomique : Exécution du tour de l'IA avec Cadencement Humanisé (LOI 1, 2, 3 & Audit 19 / 20)
 *
 * Exécute le tour de 'O' en 3 paliers temporels propres et garantit mathématiquement
 * par un bloc try / finally le retour à 'HUMAN_WAITING_ROLL'.
 *
 * Paliers :
 * 1. AI_TURN_ROLLING : affichage des dés sans mouvement de pion
 * 2. AI_TURN_SHOWING_ARROWS : réflexion modulée (150ms forcé, 600–1100ms complexe) + tracé des flèches
 * 3. Exécution séquentielle des sous-coups espacés de 180ms (`onSubMoveStep`) + application de `boardAfter`
 * 4. finally : passage immédiat à HUMAN_WAITING_ROLL
 */

import type { GamePhase, MatchLogEntry, RunAiTurnParams, RunAiTurnCallbacks } from './types';
import {
    applyMove,
    BoardState,
    generateLegalMoves,
    MoveSequence,
} from '../engine/backgammonEngine';
import { selectBestOpponentSequence } from '../engine/aiHeuristics';
import { formatMoveSequenceNotationAbsolute } from '../lib/engine/evaluator';
import {
    AI_SUB_MOVE_SPACING_MS,
    computeHumanizedAiTiming,
} from '../engine/aiHumanizedTiming';

function waitMs(ms: number): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runAiTurnAction(
    params: RunAiTurnParams,
    callbacks: RunAiTurnCallbacks,
): Promise<MatchLogEntry> {
    const {
        currentBoard,
        turnIndex,
        dice,
        difficulty = 'expert',
        rollDurationMs = 700,
        previewDurationMs,
        subMoveSpacingMs,
        isGameOver = false,
    } = params;

    const boardBefore = Object.freeze([...currentBoard]);
    let movesPlayed: MoveSequence['moves'] = [];
    let boardAfter: ReadonlyArray<number> = boardBefore;
    let createdEntry: MatchLogEntry;

    try {
        // Palier 1 : Affichage des dés lancés
        callbacks.onPhaseChange('AI_TURN_ROLLING');
        await waitMs(rollDurationMs);

        // Calcul du coup légal de l'IA sur boardBefore
        const stateWithDice: BoardState = {
            board: [...boardBefore],
            turn: 'O',
            dice: [dice[0], dice[1]],
            cubeValue: 1,
            cubeOwner: null,
            matchLength: 7,
            scoreX: 0,
            scoreO: 0,
            crawford: false,
            doubled: false,
            resigned: 0,
        };

        const legalSeqs = generateLegalMoves(stateWithDice, [dice[0], dice[1]]);
        const bestSeq = selectBestOpponentSequence(legalSeqs, 'O', difficulty);

        if (bestSeq && bestSeq.moves.length > 0) {
            movesPlayed = bestSeq.moves;
            boardAfter = Object.freeze([...bestSeq.board]);

            const timingPlan = computeHumanizedAiTiming({
                legalSequenceCount: legalSeqs.length,
                subMoveCount: movesPlayed.length,
                subMoveSpacingMs:
                    subMoveSpacingMs ?? (previewDurationMs === 0 ? 0 : AI_SUB_MOVE_SPACING_MS),
            });

            const effectiveThinkMs =
                previewDurationMs !== undefined ? previewDurationMs : timingPlan.thinkDurationMs;

            // Palier 2 : Affichage des flèches sur le plateau gelé avec réflexion modulée
            callbacks.onPhaseChange('AI_TURN_SHOWING_ARROWS');
            if (callbacks.onArrowsReady) {
                callbacks.onArrowsReady(movesPlayed.map((m) => ({ from: m.from, to: m.to })));
            }
            await waitMs(effectiveThinkMs);

            // Palier 2b : Exécution séquentielle pas-à-pas (espacement 180ms entre sous-coups)
            if (callbacks.onSubMoveStep) {
                let runningBoard = [...boardBefore];
                for (let idx = 0; idx < movesPlayed.length; idx++) {
                    if (idx > 0 && timingPlan.subMoveSpacingMs > 0) {
                        await waitMs(timingPlan.subMoveSpacingMs);
                    }
                    const subMove = movesPlayed[idx];
                    runningBoard = applyMove(runningBoard, subMove, 'O');
                    callbacks.onSubMoveStep(Object.freeze([...runningBoard]), subMove, idx);
                }
            }
        }

        // Palier 3 : Application du nouvel état et inscription au log immuable
        if (callbacks.onApplyBoard) {
            callbacks.onApplyBoard(boardAfter);
        }

        const notation = formatMoveSequenceNotationAbsolute([...movesPlayed], 'O');
        createdEntry = Object.freeze({
            turnIndex,
            player: 'O',
            dice: Object.freeze([dice[0], dice[1]]) as readonly [number, number],
            boardBefore,
            movePlayed: Object.freeze(movesPlayed.map((m) => ({ ...m }))),
            boardAfter,
            notation,
            timestamp: Date.now(),
        });

        if (callbacks.onLogEntryAdded) {
            callbacks.onLogEntryAdded(createdEntry);
        }
    } finally {
        // LOI 2 : Le bloc finally garantit mathématiquement le déverrouillage pour le joueur
        const nextPhase: GamePhase = isGameOver ? 'GAME_OVER' : 'HUMAN_WAITING_ROLL';
        callbacks.onPhaseChange(nextPhase);
        if (callbacks.onTurnComplete) {
            callbacks.onTurnComplete(nextPhase);
        }
    }

    return createdEntry;
}
