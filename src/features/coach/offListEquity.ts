/**
 * Estimation de la perte d'équité d'un coup humain ABSENT de la liste des
 * candidats renvoyée par Open Sage (`bgsage-service`).
 *
 * Open Sage ne renvoie que ses meilleurs candidats (top-N trié par équité).
 * Si le coup joué n'y figure pas, il est donc, selon l'oracle neuronal, au
 * moins aussi mauvais que le dernier candidat listé. On combine :
 *
 * 1. **Détection de fin de partie** (`evaluateWin`) : un coup qui gagne la
 *    partie ne peut pas être une erreur.
 * 2. **Différentiel positionnel local cubeless** : chaque plateau légal est
 *    évalué du point de vue de l'adversaire (même évaluateur, même profondeur),
 *    et la perte vaut `meilleur local − coup joué local`.
 * 3. **Plancher neuronal** : si la liste Open Sage est tronquée, la perte est
 *    au minimum celle du pire candidat listé.
 * 4. **Plancher catastrophe** : l'heuristique locale compresse les grosses
 *    erreurs ; tout coup jugé « blunder » par le différentiel local reçoit au
 *    moins `CATASTROPHIC_LOSS_FLOOR` (0.15), jamais un forfait de 0.04.
 */

import type { BoardState, MoveSequence, Player } from '../../engine/backgammonEngine';
import { evaluateWin } from '../../engine/aiHeuristics';
import { evaluateBoard } from '../../lib/engine/evaluator';
import { boardsMatchOnPointsAndBar, type BgsageMove } from '../../lib/engine/bgsageClient';

/** Perte minimale attribuée à un coup hors-liste jugé catastrophique. */
export const CATASTROPHIC_LOSS_FLOOR = 0.15;

/** Seuil local (identique au palier Blunder du Coach) déclenchant le plancher catastrophe. */
const LOCAL_BLUNDER_THRESHOLD = 0.08;

export interface OffListLossParams {
    /** État avant le coup (joueur au trait = auteur du coup). */
    readonly evalState: BoardState;
    /** Plateau effectivement obtenu après le coup joué. */
    readonly playedBoard: ReadonlyArray<number>;
    /** Séquences légales du lancer. */
    readonly legalSeqs: ReadonlyArray<MoveSequence>;
    /** Candidats renvoyés par Open Sage (triés par équité décroissante). */
    readonly candidates: ReadonlyArray<BgsageMove>;
    /** Équité du meilleur candidat Open Sage. */
    readonly bestEquity: number;
    /** Profondeur demandée (l'évaluation locale se fait à `ply - 1`). */
    readonly ply?: number;
}

export interface OffListLossResult {
    readonly equityLoss: number;
    readonly localLoss: number;
    readonly neuralFloor: number;
    readonly catastrophic: boolean;
}

/** Équité locale cubeless d'un plateau, du point de vue de `player` qui vient de jouer. */
function localEquityAfterMove(state: BoardState, board: ReadonlyArray<number>, player: Player, ply: number): number {
    const win = evaluateWin([...board], 1);
    if (win) return win.winner === player ? win.multiplier : -win.multiplier;
    const opponent: Player = player === 'X' ? 'O' : 'X';
    const oppEval = evaluateBoard({ ...state, board: [...board], turn: opponent, dice: null }, ply);
    return -oppEval.cubelessEquity;
}

/** Nombre de plateaux d'arrivée distincts parmi les séquences légales. */
function countDistinctBoards(seqs: ReadonlyArray<MoveSequence>): number {
    const keys = new Set<string>();
    for (const s of seqs) keys.add(s.board.join(','));
    return keys.size;
}

export function estimateOffListEquityLoss(params: OffListLossParams): OffListLossResult {
    const { evalState, playedBoard, legalSeqs, candidates, bestEquity } = params;
    const player = evalState.turn;
    const localPly = Math.max(0, (params.ply ?? 2) - 1);

    // 1. Un coup qui termine la partie en gagnant n'est jamais une erreur.
    const win = evaluateWin([...playedBoard], 1);
    if (win && win.winner === player) {
        return { equityLoss: 0, localLoss: 0, neuralFloor: 0, catastrophic: false };
    }

    // 2. Différentiel positionnel local (même évaluateur pour tous les plateaux).
    const playedLocal = localEquityAfterMove(evalState, playedBoard, player, localPly);
    let bestLocal = playedLocal;
    for (const seq of legalSeqs) {
        if (boardsMatchOnPointsAndBar(seq.board, playedBoard)) continue;
        const eq = localEquityAfterMove(evalState, seq.board, player, localPly);
        if (eq > bestLocal) bestLocal = eq;
    }
    const localLoss = Math.max(0, bestLocal - playedLocal);

    // 3. Plancher neuronal : liste tronquée ⇒ le coup est sous le pire candidat listé.
    let neuralFloor = 0;
    if (candidates.length > 0 && candidates.length < countDistinctBoards(legalSeqs)) {
        const worstListed = Math.min(...candidates.map((c) => c.equity));
        neuralFloor = Math.max(0, bestEquity - worstListed);
    }

    // 4. Plancher catastrophe.
    const catastrophic = localLoss > LOCAL_BLUNDER_THRESHOLD;
    const equityLoss = Math.max(localLoss, neuralFloor, catastrophic ? CATASTROPHIC_LOSS_FLOOR : 0);

    return {
        equityLoss: Number(equityLoss.toFixed(4)),
        localLoss: Number(localLoss.toFixed(4)),
        neuralFloor: Number(neuralFloor.toFixed(4)),
        catastrophic,
    };
}
