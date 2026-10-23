/**
 * Micro-programme atomique : Prévisualisation & Replay depuis le Log (LOI 1 & LOI 3)
 *
 * Permet en cliquant sur une ligne de la Feuille de Match de reconstruire
 * fidèlement la position correspondante sans muter le plateau de jeu courant.
 */

import type { ReplayFromLogParams, ReplayFromLogResult } from './types';

export function replayFromLogAction(params: ReplayFromLogParams): ReplayFromLogResult {
    const { logEntry, showBefore = false } = params;

    // LOI 3 : Les plateaux sont extraits sous forme de copies gelées immuables
    const sourceBoard = showBefore ? logEntry.boardBefore : logEntry.boardAfter;
    const previewBoard = Object.freeze([...sourceBoard]);

    return {
        previewBoard,
        activePlayer: logEntry.player,
        dice: Object.freeze([logEntry.dice[0], logEntry.dice[1]]) as readonly [number, number],
        arrows: Object.freeze(logEntry.movePlayed.map((m) => ({ ...m }))),
        turnIndex: logEntry.turnIndex,
    };
}
