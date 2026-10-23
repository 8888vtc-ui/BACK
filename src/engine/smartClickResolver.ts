/**
 * Résolveur « Smart Point Click » (Game Feel Spec §1.5).
 *
 * Remplace le double-clic natif : chaque clic est résolu immédiatement, une seule fois,
 * à partir des SÉQUENCES LÉGALES restantes du tour. Un sous-coup proposé est toujours le
 * préfixe d'une séquence légale (règle du maximum de dés + règle du dé le plus fort),
 * ce qui garantit qu'aucun clic ne peut produire un état illégal.
 *
 * Priorité Destination-First :
 *   1. pion sélectionné → coup simple depuis ce pion, sinon combiné depuis ce pion ;
 *   2. destination sans pion à moi + 2 pions différents peuvent y converger → PORT ;
 *   3. coup SIMPLE (sources classées par heuristique déterministe) ;
 *   4. coup COMBINÉ le plus court (2, 3 puis 4 sous-coups d'un même pion).
 */

import {
    applyMove,
    generateLegalMoves,
    generateSingleMoves,
    O_BAR,
    O_OFF,
    X_BAR,
    X_OFF,
    type BoardState,
    type Move,
    type Player,
} from './backgammonEngine';

export interface SubMove {
    readonly from: number;
    readonly to: number;
}

export type SmartResolution =
    | { readonly kind: 'single'; readonly moves: readonly [SubMove] }
    | { readonly kind: 'combined'; readonly moves: readonly SubMove[] }
    | { readonly kind: 'port'; readonly moves: readonly [SubMove, SubMove] }
    | { readonly kind: 'none' };

export const NO_RESOLUTION: SmartResolution = Object.freeze({ kind: 'none' });

export interface SmartClickContext {
    /** Séquences légales COMPLÈTES restantes pour le tour. */
    readonly legalSequences: ReadonlyArray<ReadonlyArray<SubMove>>;
    readonly board: ReadonlyArray<number>;
    readonly player: Player;
    readonly selectedSource: number | null;
    readonly higherDieFirst: boolean;
}

/** Distance parcourue par un sous-coup (= valeur de dé, sauf bear-off avec dé excédentaire). */
export function subMoveDistance(m: SubMove, player: Player): number {
    if (player === 'X') {
        if (m.from === X_BAR) return 25 - m.to;
        if (m.to === X_OFF) return m.from;
        return m.from - m.to;
    }
    if (m.from === O_BAR) return m.to;
    if (m.to === O_OFF) return 25 - m.from;
    return m.to - m.from;
}

/** Pips restant à parcourir depuis un point (barre = 25). */
export function pipOfPoint(point: number, player: Player): number {
    if (player === 'X') return point === X_BAR ? 25 : point;
    return point === O_BAR ? 25 : 25 - point;
}

function isBoardPoint(point: number): boolean {
    return point >= 1 && point <= 24;
}

function ownAt(board: ReadonlyArray<number>, point: number, player: Player): number {
    if (!isBoardPoint(point)) return 0;
    const v = board[point] ?? 0;
    return player === 'X' ? Math.max(v, 0) : Math.max(-v, 0);
}

function remainingDiceValues(dice: readonly [number, number], usedDice: ReadonlyArray<boolean>): number[] {
    const [d1, d2] = dice;
    if (d1 === d2) {
        const used = usedDice.filter(Boolean).length;
        return Array<number>(Math.max(0, 4 - used)).fill(d1);
    }
    const out: number[] = [];
    if (!usedDice[0]) out.push(d1);
    if (!usedDice[1]) out.push(d2);
    return out;
}

function enumerate(board: number[], player: Player, dice: number[], idx: number, current: Move[], out: Move[][]): void {
    if (idx === dice.length) {
        if (current.length > 0) out.push(current);
        return;
    }
    const singles = generateSingleMoves(board, player, dice[idx]);
    if (singles.length === 0) {
        enumerate(board, player, dice, idx + 1, current, out);
        return;
    }
    for (const m of singles) {
        enumerate(applyMove(board, m, player), player, dice, idx + 1, [...current, m], out);
    }
}

/**
 * Séquences légales restantes à partir de la position courante et des dés non joués.
 * - Aucun dé joué (non-double) → `generateLegalMoves` (max-dés + dé le plus fort).
 * - Double partiellement joué → énumération des pions restants, longueur maximale.
 * - Un seul dé restant → coups simples de ce dé.
 */
export function computeRemainingSequences(
    board: ReadonlyArray<number>,
    player: Player,
    dice: readonly [number, number] | null,
    usedDice: ReadonlyArray<boolean>,
): SubMove[][] {
    if (!dice) return [];
    const remaining = remainingDiceValues(dice, usedDice);
    if (remaining.length === 0) return [];
    const b = [...board];
    if (dice[0] !== dice[1] && remaining.length === 2) {
        const state = { board: b, turn: player } as unknown as BoardState;
        const legal = generateLegalMoves(state, [dice[0], dice[1]]);
        if (legal.length === 0) return [];
        const maxLen = Math.max(...legal.map((s) => s.moves.length));
        if (maxLen < 2) return legal.map((s) => s.moves.map((m) => ({ from: m.from, to: m.to })));
        // `generateLegalMoves` déduplique par position finale : on réintègre les deux ordres de dés
        // menant à une position légale, sinon le chemin alternatif d'un coup combiné serait perdu.
        const legalBoards = new Set(legal.map((s) => s.board.join(',')));
        const raw: Move[][] = [];
        enumerate(b, player, [dice[0], dice[1]], 0, [], raw);
        enumerate(b, player, [dice[1], dice[0]], 0, [], raw);
        const seen = new Set<string>();
        const out: SubMove[][] = [];
        for (const s of raw) {
            if (s.length !== maxLen) continue;
            const finalBoard = s.reduce<number[]>((acc, m) => applyMove(acc, m, player), b);
            if (!legalBoards.has(finalBoard.join(','))) continue;
            const seq = s.map((m) => ({ from: m.from, to: m.to }));
            const k = keyOf(seq);
            if (seen.has(k)) continue;
            seen.add(k);
            out.push(seq);
        }
        return out;
    }
    if (remaining.length === 1) {
        return generateSingleMoves(b, player, remaining[0]).map((m) => [{ from: m.from, to: m.to }]);
    }
    const all: Move[][] = [];
    enumerate(b, player, remaining, 0, [], all);
    if (all.length === 0) return [];
    const max = Math.max(...all.map((s) => s.length));
    return all.filter((s) => s.length === max).map((s) => s.map((m) => ({ from: m.from, to: m.to })));
}

const keyOf = (ms: ReadonlyArray<SubMove>) => ms.map((m) => `${m.from}>${m.to}`).join('|');

function uniquePrefixes(seqs: SmartClickContext['legalSequences'], len: number): SubMove[][] {
    const seen = new Map<string, SubMove[]>();
    for (const s of seqs) {
        if (s.length < len) continue;
        const p = s.slice(0, len);
        const k = keyOf(p);
        if (!seen.has(k)) seen.set(k, [...p]);
    }
    return [...seen.values()];
}

function isChain(ms: ReadonlyArray<SubMove>): boolean {
    for (let i = 1; i < ms.length; i++) if (ms[i].from !== ms[i - 1].to) return false;
    return true;
}

/** Plus le score est haut, plus la source est naturelle. Heuristique déterministe. */
export function sourceScore(board: ReadonlyArray<number>, from: number, player: Player): number {
    const own = ownAt(board, from, player);
    let s = 0;
    if (own === 2) s -= 50; // casserait une case faite (laisse un blot)
    if (own === 1) s += 30; // déplace un blot (le met en sécurité)
    if (own >= 3) s += 20; // pion surnuméraire
    return s * 1000 + pipOfPoint(from, player); // départage : le plus en arrière d'abord
}

export function resolveDestinationClick(ctx: SmartClickContext, dest: number): SmartResolution {
    const { board, player } = ctx;
    const bySource = (ms: SubMove[]) => ctx.selectedSource === null || ms[0].from === ctx.selectedSource;

    const singles = uniquePrefixes(ctx.legalSequences, 1).filter((p) => p[0].to === dest && bySource(p));

    if (ctx.selectedSource === null && isBoardPoint(dest) && ownAt(board, dest, player) === 0) {
        const port = uniquePrefixes(ctx.legalSequences, 2).find(
            (p) => p[0].to === dest && p[1].to === dest && p[1].from !== dest,
        );
        if (port) return { kind: 'port', moves: [port[0], port[1]] };
    }

    if (singles.length > 0) {
        singles.sort((a, b) => sourceScore(board, b[0].from, player) - sourceScore(board, a[0].from, player));
        return { kind: 'single', moves: [singles[0][0]] };
    }

    for (let len = 2; len <= 4; len++) {
        const combos = uniquePrefixes(ctx.legalSequences, len).filter(
            (p) => isChain(p) && p[len - 1].to === dest && bySource(p),
        );
        if (combos.length === 0) continue;
        combos.sort((a, b) => {
            const src = sourceScore(board, b[0].from, player) - sourceScore(board, a[0].from, player);
            if (src !== 0) return src;
            const order = subMoveDistance(b[0], player) - subMoveDistance(a[0], player);
            return ctx.higherDieFirst ? order : -order;
        });
        return { kind: 'combined', moves: combos[0] };
    }
    return NO_RESOLUTION;
}

/**
 * Coup combiné (d1+d2, ou 2d/3d/4d en double) d'un seul pion depuis `source` :
 * remplace le double-clic. Retourne la destination la plus lointaine atteignable
 * en enchaînant tous les dés restants, sinon NO_RESOLUTION.
 */
export function resolveCombinedFromSource(ctx: SmartClickContext, source: number): SmartResolution {
    const maxLen = Math.max(0, ...ctx.legalSequences.map((s) => s.length));
    for (let len = maxLen; len >= 2; len--) {
        const combos = uniquePrefixes(ctx.legalSequences, len).filter((p) => p[0].from === source && isChain(p));
        if (combos.length === 0) continue;
        combos.sort((a, b) => {
            const order = subMoveDistance(b[0], ctx.player) - subMoveDistance(a[0], ctx.player);
            return ctx.higherDieFirst ? order : -order;
        });
        return { kind: 'combined', moves: combos[0] };
    }
    return NO_RESOLUTION;
}

export type DiceClickAction = 'swap' | 'confirm' | 'noop';

/**
 * Clic sur les dés, sens déduit du contexte (états disjoints, jamais de validation accidentelle) :
 *  - aucun coup joué → inverser l'ordre des dés ;
 *  - tour complet (plus aucun coup légal) et validation manuelle → valider (« ramasser les dés ») ;
 *  - sinon → rien.
 */
export function resolveDiceClick(p: {
    readonly subMovesPlayed: number;
    readonly hasRemainingLegalMove: boolean;
    readonly isDouble: boolean;
    readonly autoConfirm: boolean;
}): DiceClickAction {
    if (p.subMovesPlayed === 0) return p.isDouble ? 'noop' : 'swap';
    if (!p.hasRemainingLegalMove && !p.autoConfirm) return 'confirm';
    return 'noop';
}
