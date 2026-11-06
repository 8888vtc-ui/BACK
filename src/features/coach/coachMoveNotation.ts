/**
 * Notation des coups du Coach — numérotation ABSOLUE du plateau (1..24).
 * Module 100 % pur : aucune dépendance React, DOM ou réseau.
 */
import type { Move, Player } from '../../engine/backgammonEngine';
import { X_BAR, O_BAR, X_OFF, O_OFF, applyMove } from '../../engine/backgammonEngine';

export function formatCoachPoint(point: number, isDestination = false): string {
    if (point === X_BAR || point === O_BAR) {
        return isDestination ? 'off' : 'bar';
    }
    return String(point);
}

/**
 * Formate un sous-mouvement en numérotation ABSOLUE (ex: {from: 13, to: 11} -> "13/11").
 */
export function formatCoachSingleMove(move: Move): string {
    return `${formatCoachPoint(move.from, false)}/${formatCoachPoint(move.to, true)}`;
}

/**
 * Formate une séquence complète en numérotation ABSOLUE, en marquant les
 * frappes d'un astérisque (ex. `13/7` suivi d'une étoile).
 */
export function formatCoachMoveSequence(
    moves: ReadonlyArray<Move>,
    player: Player,
    board: ReadonlyArray<number>,
): string {
    if (!moves || moves.length === 0) return 'Pass';

    let currentBoard = [...board];
    const tokens: string[] = [];

    for (const move of moves) {
        const token = formatCoachSingleMove(move);
        const isOff = move.to === X_OFF || move.to === O_OFF;
        const isHit =
            !isOff &&
            (player === 'X' ? currentBoard[move.to] === -1 : currentBoard[move.to] === 1);
        tokens.push(isHit ? `${token}*` : token);
        currentBoard = applyMove(currentBoard, move, player);
    }

    return tokens.join(' ');
}

/**
 * Notation STANDARD de Backgammon (perspective du joueur au trait) d'une
 * séquence complète de sous-mouvements (« de 24 vers 1 »).
 */
export function formatStandardMoveSequence(
    moves: ReadonlyArray<Move>,
    player: Player,
    board: ReadonlyArray<number>,
): string {
    if (!moves || moves.length === 0) return 'Pass';

    const toRelative = (point: number, isDestination: boolean): string => {
        if (isDestination) {
            if (point === X_OFF || point === O_OFF) return 'off';
        } else if (point === X_BAR || point === O_BAR) {
            return 'bar';
        }
        return player === 'X' ? String(point) : String(25 - point);
    };

    let currentBoard = board && board.length >= 26 ? [...board] : null;
    const tokens: string[] = [];

    for (const move of moves) {
        const token = `${toRelative(move.from, false)}/${toRelative(move.to, true)}`;
        const isOff = move.to === X_OFF || move.to === O_OFF;
        const isHit =
            currentBoard !== null &&
            !isOff &&
            (player === 'X' ? currentBoard[move.to] === -1 : currentBoard[move.to] === 1);
        tokens.push(isHit ? `${token}*` : token);
        if (currentBoard !== null) currentBoard = applyMove(currentBoard, move, player);
    }

    return tokens.join(' ');
}

/**
 * Reconstruit la liste des sous-mouvements entre deux plateaux (26 entiers).
 */
export function movesFromBoardDiff(
    boardBefore: ReadonlyArray<number>,
    boardAfter: ReadonlyArray<number>,
    player: Player,
): Move[] {
    if (!boardBefore || !boardAfter) return [];
    if (boardBefore.length < 26 || boardAfter.length < 26) return [];

    const before = [...boardBefore];
    const after = [...boardAfter];
    const myCount = (v: number) => (player === 'X' ? Math.max(0, v) : Math.max(0, -v));
    const barIndex = player === 'X' ? X_BAR : O_BAR;
    const offIndex = player === 'X' ? X_OFF : O_OFF;

    const sources: number[] = [];
    const destinations: number[] = [];

    const barDelta = myCount(before[barIndex]) - myCount(after[barIndex]);
    for (let i = 0; i < barDelta; i++) sources.push(barIndex);

    const offBefore = countOff(before, player);
    const offAfter = countOff(after, player);
    const offDelta = offAfter - offBefore;
    for (let i = 0; i < offDelta; i++) destinations.push(offIndex);

    for (let p = 1; p <= 24; p++) {
        const delta = myCount(after[p]) - myCount(before[p]);
        if (delta > 0) {
            for (let i = 0; i < delta; i++) destinations.push(p);
        } else if (delta < 0) {
            for (let i = 0; i < -delta; i++) sources.push(p);
        }
    }

    if (sources.length === 0 || destinations.length === 0) return [];

    const moves: Move[] = [];
    const barSources = sources.filter((s) => s === barIndex);
    const otherSources = sources.filter((s) => s !== barIndex);
    const offDests = destinations.filter((d) => d === offIndex);
    const pointDests = destinations.filter((d) => d !== offIndex);

    const sortedPointDests = [...pointDests].sort((a, b) => (player === 'X' ? b - a : a - b));
    for (const _ of barSources) {
        const dst = sortedPointDests.shift();
        if (dst === undefined) break;
        moves.push({ from: barIndex, to: dst });
    }

    const sortedSources = [...otherSources].sort((a, b) => (player === 'X' ? b - a : a - b));
    const remainingSources: number[] = [];
    for (const src of sortedSources) {
        const dst = sortedPointDests.shift();
        if (dst !== undefined) {
            moves.push({ from: src, to: dst });
        } else {
            remainingSources.push(src);
        }
    }

    for (const _ of offDests) {
        const src = remainingSources.shift();
        if (src === undefined) break;
        moves.push({ from: src, to: offIndex });
    }

    let replay = [...before];
    for (const m of moves) {
        replay = applyMove(replay, m, player);
    }
    return moves;
}

function countOff(board: ReadonlyArray<number>, player: Player): number {
    let onBoard = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        if (player === 'X' && v > 0) onBoard += v;
        if (player === 'O' && v < 0) onBoard += -v;
    }
    const bar = player === 'X' ? Math.max(0, board[X_BAR]) : Math.max(0, -board[O_BAR]);
    onBoard += bar;
    return 15 - onBoard;
}

export function formatCoachMoveSequenceFromBoard(
    boardBefore: ReadonlyArray<number>,
    boardAfter: ReadonlyArray<number>,
    player: Player,
): string {
    const moves = movesFromBoardDiff(boardBefore, boardAfter, player);
    return formatCoachMoveSequence(moves, player, boardBefore);
}

// Développe un jeton potentiellement chaîné et/ou multiplié en pas élémentaires.
function expandMultiSlashToken(rawToken: string): string[] {
    const clean = rawToken.replace(/\*/g, '').trim();
    if (!clean) return [];
    const m = clean.match(/^(.+)\((\d+)\)$/);
    const base = m ? m[1] : clean;
    const count = m ? Math.max(1, Math.min(4, Number(m[2]))) : 1;
    const parts = base.split('/').filter(Boolean);
    if (parts.length < 2) return [clean];
    const expanded: string[] = [];
    for (let k = 0; k < parts.length - 1; k++) {
        const step = `${parts[k]}/${parts[k + 1]}`;
        for (let c = 0; c < count; c++) {
            expanded.push(step);
        }
    }
    return expanded;
}

// Normalise une notation pour comparaison insensible à l'ordre, aux astérisques et aux multiplicateurs.
export function normalizeCoachNotation(notation: string): string {
    if (!notation) return '';
    return notation
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .flatMap((token) => expandMultiSlashToken(token))
        .sort()
        .join(' ');
}

export function relativeNotationToAbsolute(notation: string, player: Player): string {
    if (!notation || player === 'X') return notation;

    return notation
        .split(/\s+/)
        .filter(Boolean)
        .map((token) => {
            const multMatch = token.match(/^(.+?)(\(\d+\))?$/);
            if (!multMatch) return token;
            const [, body, mult] = multMatch;
            const segments = body.split('/');
            if (segments.length < 2) return token;
            const converted = segments.map((seg, idx) => {
                const segMatch = seg.match(/^(bar|off|\d+)(\*?)$/i);
                if (!segMatch) return seg;
                const [, ptStr, star] = segMatch;
                const lower = ptStr.toLowerCase();
                const pt = lower === 'bar' ? O_BAR : lower === 'off' ? O_OFF : 25 - Number(ptStr);
                return `${formatCoachPoint(pt, idx > 0)}${star ?? ''}`;
            });
            return `${converted.join('/')}${mult ?? ''}`;
        })
        .join(' ');
}

export function parseCoachNotationMoves(
    notation: string,
    player: Player = 'X',
    dice?: readonly [number, number] | null,
): Move[] {
    if (!notation) return [];
    const absNotation = player === 'O' ? relativeNotationToAbsolute(notation, 'O') : notation;
    const bar = player === 'X' ? X_BAR : O_BAR;
    const off = player === 'X' ? X_OFF : O_OFF;
    const isDouble = Boolean(dice && dice[0] > 0 && dice[0] === dice[1]);
    const doubleDie = isDouble && dice ? dice[0] : 0;

    return absNotation
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .flatMap((token) => expandMultiSlashToken(token))
        .flatMap((stepToken) => {
            const m = stepToken.match(/^(bar|\d+)\/(off|\d+)$/i);
            if (!m) return [];
            const from = m[1].toLowerCase() === 'bar' ? bar : Number(m[1]);
            const to = m[2].toLowerCase() === 'off' ? off : Number(m[2]);
            if (isDouble && doubleDie > 0 && to !== off) {
                const dist = player === 'X'
                    ? (from === X_BAR ? 25 - to : from - to)
                    : (from === O_BAR ? to : to - from);
                if (dist > doubleDie && dist % doubleDie === 0) {
                    const steps = dist / doubleDie;
                    const subMoves: Move[] = [];
                    let cur = from;
                    for (let s = 0; s < steps; s++) {
                        const next = player === 'X'
                            ? (cur === X_BAR ? 25 - doubleDie : cur - doubleDie)
                            : (cur === O_BAR ? doubleDie : cur + doubleDie);
                        subMoves.push({ from: cur, to: next });
                        cur = next;
                    }
                    return subMoves;
                }
            }
            return [{ from, to }];
        });
}

// Applique une notation bgsage ou standard sur boardBefore en tenant compte des dés et des frappes intermédiaires.
export function applyBgsageNotationToBoard(
    boardBefore: readonly number[],
    notation: string,
    diceRolled: readonly [number, number],
    player: Player = 'X',
): number[] | null {
    if (!notation || notation === 'Pass' || notation === 'Double' || notation === 'Take' || notation === 'Drop') {
        return null;
    }
    const isDouble = diceRolled[0] === diceRolled[1];
    const availableDice = isDouble
        ? [diceRolled[0], diceRolled[0], diceRolled[0], diceRolled[0]]
        : [diceRolled[0], diceRolled[1]];

    const absNotation = player === 'O' ? relativeNotationToAbsolute(notation, 'O') : notation;
    const rawTokens = absNotation.trim().split(/\s+/).filter(Boolean);
    const tokens: Array<{ step: string; hasHitStar: boolean }> = [];
    for (const rawTok of rawTokens) {
        const hasHitStar = rawTok.includes('*');
        for (const step of expandMultiSlashToken(rawTok)) {
            tokens.push({ step, hasHitStar });
        }
    }

    let board = [...boardBefore];
    const bar = player === 'X' ? X_BAR : O_BAR;
    const off = player === 'X' ? X_OFF : O_OFF;

    for (const { step: tok, hasHitStar } of tokens) {
        const parts = tok.split('/');
        if (parts.length < 2) continue;
        const fromStr = parts[0].toLowerCase();
        const toStr = parts[1].toLowerCase();
        const from = fromStr === 'bar' ? bar : Number(fromStr);
        const to = toStr === 'off' ? off : Number(toStr);

        const dist = player === 'X'
            ? (from === X_BAR ? 25 - to : to === X_OFF ? from : from - to)
            : (from === O_BAR ? to : to === O_OFF ? 25 - from : to - from);

        const exactDieIdx = availableDice.indexOf(dist);
        if (exactDieIdx !== -1) {
            availableDice.splice(exactDieIdx, 1);
            board = applyMove(board, { from, to }, player);
            continue;
        }

        const d0 = diceRolled[0];
        if (isDouble && d0 > 0 && dist > d0 && dist % d0 === 0) {
            const stepsCount = dist / d0;
            let cur = from;
            let validChain = true;
            let simBoard = [...board];
            for (let s = 0; s < stepsCount; s++) {
                const next = s === stepsCount - 1
                    ? to
                    : player === 'X'
                        ? (cur === X_BAR ? 25 - d0 : cur - d0)
                        : (cur === O_BAR ? d0 : cur + d0);
                if (next !== off && next >= 1 && next <= 24) {
                    const isBlocked = player === 'X' ? simBoard[next] <= -2 : simBoard[next] >= 2;
                    if (isBlocked) {
                        validChain = false;
                        break;
                    }
                }
                simBoard = applyMove(simBoard, { from: cur, to: next }, player);
                cur = next;
            }
            if (validChain) {
                board = simBoard;
                for (let s = 0; s < stepsCount; s++) {
                    const idx = availableDice.indexOf(d0);
                    if (idx !== -1) availableDice.splice(idx, 1);
                }
                continue;
            }
        }

        let stepResolved = false;
        const candidates: Array<{ i: number; d1: number; d2: number; mid: number; hitsMid: boolean }> = [];
        for (let i = 0; i < availableDice.length; i++) {
            const d1 = availableDice[i];
            const remainingDice = [...availableDice];
            remainingDice.splice(i, 1);
            const d2 = remainingDice.find((d) => d1 + d === dist);
            if (d2 !== undefined) {
                const mid = player === 'X'
                    ? (from === X_BAR ? 25 - d1 : from - d1)
                    : (from === O_BAR ? d1 : from + d1);
                const isBlocked = player === 'X' ? board[mid] <= -2 : board[mid] >= 2;
                if (!isBlocked && mid >= 1 && mid <= 24) {
                    const hitsMid = player === 'X' ? board[mid] === -1 : board[mid] === 1;
                    candidates.push({ i, d1, d2, mid, hitsMid });
                }
            }
        }
        if (candidates.length > 0) {
            candidates.sort((a, b) => (hasHitStar ? Number(b.hitsMid) - Number(a.hitsMid) : Number(a.hitsMid) - Number(b.hitsMid)));
            const chosen = candidates[0];
            board = applyMove(board, { from, to: chosen.mid }, player);
            board = applyMove(board, { from: chosen.mid, to }, player);
            availableDice.splice(chosen.i, 1);
            const j = availableDice.indexOf(chosen.d2);
            if (j !== -1) availableDice.splice(j, 1);
            stepResolved = true;
        }
        if (!stepResolved) {
            board = applyMove(board, { from, to }, player);
        }
    }
    return board;
}
