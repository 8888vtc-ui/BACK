/**
 * Micro-programme atomique : validation et commit du tour joueur (LOI 1 & LOI 2)
 *
 * Rôles :
 * - Valide le coup de X et fige le résultat dans une entrée immuable de `matchLog`.
 * - Déclenche l'évaluation log-driven du joueur via `analyzeHumanLogAction`.
 * - Fait transiter la machine à états de 'HUMAN_READY_TO_COMMIT' (ou 'HUMAN_MOVING') vers 'AI_TURN_ROLLING'.
 */

import type { GamePhase, MatchLogEntry, CommitHumanMoveParams } from './types';
import { analyzeHumanLogAction, type HumanLogAnalysisResult } from '../features/coach/analyzeHumanLogAction';
import { formatMoveSequenceNotationWithHits } from '../lib/engine/evaluator';
import { createCommittedHumanMovePacket, type CommittedHumanMovePacket } from '../features/coach/turnSnapshot';

export interface CommitHumanMoveResult {
    readonly nextPhase: GamePhase;
    readonly newLogEntry: MatchLogEntry;
    readonly updatedLog: ReadonlyArray<MatchLogEntry>;
    readonly analysis: HumanLogAnalysisResult | null;
    readonly packet?: CommittedHumanMovePacket;
}

export function commitHumanMoveAction(
    params: CommitHumanMoveParams,
): CommitHumanMoveResult {
    const {
        currentPhase,
        turnIndex,
        player,
        dice,
        boardBefore,
        movesPlayed,
        boardAfter,
        matchLog,
        localConnectedPlayer = 'X',
        isGameOver = false,
    } = params;

    // Vérification de la phase légale
    if (currentPhase !== 'HUMAN_READY_TO_COMMIT' && currentPhase !== 'HUMAN_MOVING') {
        throw new Error(
            `[commitHumanMoveAction] Transition illégale depuis la phase "${currentPhase}". Phase attendue : HUMAN_READY_TO_COMMIT ou HUMAN_MOVING.`,
        );
    }

    // LOI 3 : Immuabilité absolue de l'entrée de log
    const notation = formatMoveSequenceNotationWithHits([...movesPlayed], player, [...boardBefore]);
    const packet = player === 'X' ? createCommittedHumanMovePacket({
        turnNumber: turnIndex,
        boardBeforeMove: boardBefore,
        boardAfterMove: boardAfter,
        diceRolled: [dice[0], dice[1]],
        playedMoveNotation: notation,
        playedSubMoves: movesPlayed.map((m) => ({ from: m.from, to: m.to })),
        matchContext: {
            scoreX: params.scoreX ?? 0,
            scoreO: params.scoreO ?? 0,
            matchLength: params.matchLength ?? 7,
            cubeValue: params.cubeValue ?? 1,
            cubeOwner: params.cubeOwner ?? null,
            crawford: params.crawford ?? false,
        },
    }) : undefined;

    const newLogEntry: MatchLogEntry = Object.freeze({
        turnIndex,
        player,
        dice: Object.freeze([dice[0], dice[1]]) as readonly [number, number],
        boardBefore: Object.freeze([...boardBefore]),
        movePlayed: Object.freeze(movesPlayed.map((m) => ({ ...m }))),
        boardAfter: Object.freeze([...boardAfter]),
        notation,
        timestamp: Date.now(),
        packet,
    });

    const updatedLog: ReadonlyArray<MatchLogEntry> = Object.freeze([...matchLog, newLogEntry]);

    // LOI 4 : Analyse réservée au joueur connecté (X) sur la base de newLogEntry
    const analysis = analyzeHumanLogAction({
        logEntry: newLogEntry,
        localConnectedPlayer,
    });

    // LOI 2 : Passage systématique de la phase
    const nextPhase: GamePhase = isGameOver ? 'GAME_OVER' : 'AI_TURN_ROLLING';

    return {
        nextPhase,
        newLogEntry,
        updatedLog,
        analysis,
        packet,
    };
}
