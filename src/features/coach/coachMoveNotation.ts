/**
 * Notation des coups du Coach — numérotation ABSOLUE du plateau (1..24).
 *
 * PROBLÈME RÉSOLU (bug d'affichage « 13/9 » au lieu de « 13/11 ») :
 *
 * Le plateau visuel (`Board.tsx`) affiche les flèches en numérotation ABSOLUE
 * (1..24, identique pour les deux joueurs). En revanche, `formatSingleMove`
 * (evaluator.ts) produit une notation RELATIVE au joueur au trait : pour O, la
 * flèche absolue `p` est rendue `25 - p`. Résultat : un coup réellement joué
 * `13 → 11` par X pouvait être affiché `13/9` si la notation était produite
 * depuis une perspective miroir (ou depuis un board bgsage ré-indexé 0..23).
 *
 * Ce module fournit une source de vérité UNIQUE pour la notation affichée dans
 * le panneau Coach :
 *   - `formatCoachMoveSequence` : notation absolue, avec astérisque de frappe.
 *   - `formatCoachMoveSequenceFromBoard` : idem, mais reconstruit la séquence
 *     de sous-mouvements depuis `boardBefore` / `boardAfter` (utile quand le
 *     moteur ne renvoie que le plateau final, ex. bgsage).
 *   - `movesFromBoardDiff` : appariement déterministe source → destination.
 *
 * Module 100 % pur : aucune dépendance React, DOM ou réseau.
 */

import type { Move, Player } from '../../engine/backgammonEngine';
import { X_BAR, O_BAR, X_OFF, O_OFF, applyMove } from '../../engine/backgammonEngine';

/**
 * Libellé d'une flèche en numérotation absolue (1..24, barre, sortie).
 *
 * ATTENTION : dans le moteur, `X_BAR === X_OFF === 0` et
 * `O_BAR === O_OFF === 25`. Le même index désigne donc la barre en `from` et
 * la sortie en `to`. On distingue les deux par le rôle (`isDestination`).
 */
export function formatCoachPoint(point: number, isDestination = false): string {
    if (point === X_BAR || point === O_BAR) {
        return isDestination ? 'off' : 'bar';
    }
    return String(point);
}

/**
 * Formate un sous-mouvement en numérotation ABSOLUE (identique au plateau).
 * Exemple : `{ from: 13, to: 11 }` → `"13/11"`, quel que soit le joueur.
 */
export function formatCoachSingleMove(move: Move): string {
    return `${formatCoachPoint(move.from, false)}/${formatCoachPoint(move.to, true)}`;
}

/**
 * Formate une séquence complète en numérotation ABSOLUE, en marquant les
 * frappes d'un astérisque (ex. `13/7` suivi d'une étoile).
 *
 * @param moves  Séquence de sous-mouvements dans l'ordre de jeu.
 * @param player Joueur au trait (pour détecter les frappes).
 * @param board  Plateau AVANT la séquence (26 entiers).
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
 * séquence complète de sous-mouvements.
 *
 * Contrairement à `formatCoachMoveSequence` (numérotation ABSOLUE du plateau,
 * utilisée par le panneau Coach), cette fonction produit la notation lue
 * « de 24 vers 1 » du point de vue de celui qui joue : pour O, la flèche
 * absolue `p` est rendue `25 - p`. Un coup adverse `24 → 18 → 13` s'affiche
 * donc `24/18 18/13`, jamais `1/7 7/12`.
 *
 * Les frappes sont marquées d'un astérisque et les sorties rendues `off`.
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

    // Plateau de repli : si l'appelant ne fournit pas le plateau avant le coup,
    // on reconstruit une position neutre (aucune frappe détectée) plutôt que de
    // planter sur un index indéfini.
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
 *
 * Algorithme déterministe :
 *   1. Collecte les sources (pions retirés) et destinations (pions ajoutés).
 *   2. Apparie les entrées de barre en premier (`bar/x`).
 *   3. Apparie les sorties (`x/off`) en dernier.
 *   4. Apparie le reste par distance croissante (heuristique stable).
 *
 * Les frappes sont gérées : un blot adverse remplacé par un pion du joueur
 * apparaît comme une destination, et le pion adverse est renvoyé à la barre.
 *
 * @returns La séquence de coups, ou `[]` si les plateaux sont identiques.
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

    // Barre : pions ré-entrés.
    const barDelta = myCount(before[barIndex]) - myCount(after[barIndex]);
    for (let i = 0; i < barDelta; i++) sources.push(barIndex);

    // Sortie : pions retirés du plateau.
    const offBefore = countOff(before, player);
    const offAfter = countOff(after, player);
    const offDelta = offAfter - offBefore;
    for (let i = 0; i < offDelta; i++) destinations.push(offIndex);

    // Flèches 1..24.
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

    // 1. Entrées de barre en premier.
    const barSources = sources.filter((s) => s === barIndex);
    const otherSources = sources.filter((s) => s !== barIndex);

    // 2. Sorties en dernier.
    const offDests = destinations.filter((d) => d === offIndex);
    const pointDests = destinations.filter((d) => d !== offIndex);

    // Appariement barre → flèche : X entre en 24..19 (décroissant), O entre en 1..6 (croissant).
    const sortedPointDests = [...pointDests].sort((a, b) =>
        player === 'X' ? b - a : a - b,
    );
    for (const _ of barSources) {
        const dst = sortedPointDests.shift();
        if (dst === undefined) break;
        moves.push({ from: barIndex, to: dst });
    }

    // Appariement flèche → flèche : sources les plus reculées d'abord (24→1 pour X, 1→24 pour O).
    const sortedSources = [...otherSources].sort((a, b) =>
        player === 'X' ? b - a : a - b,
    );
    const remainingSources: number[] = [];
    for (const src of sortedSources) {
        const dst = sortedPointDests.shift();
        if (dst !== undefined) {
            moves.push({ from: src, to: dst });
        } else {
            remainingSources.push(src);
        }
    }

    // Appariement flèche → sortie.
    for (const _ of offDests) {
        const src = remainingSources.shift();
        if (src === undefined) break;
        moves.push({ from: src, to: offIndex });
    }

    // Vérification de cohérence : la séquence doit reproduire `boardAfter`.
    let replay = [...before];
    for (const m of moves) {
        replay = applyMove(replay, m, player);
    }
    if (replay.join(',') !== after.join(',')) {
        // Repli : on retourne la séquence brute (meilleur effort) plutôt que rien.
        return moves;
    }

    return moves;
}

/** Nombre de pions sortis (bear-off) d'un joueur. */
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

/**
 * Notation absolue d'un coup à partir des plateaux avant/après.
 * Utilisé quand le moteur ne fournit que le plateau final (bgsage, rollout).
 */
export function formatCoachMoveSequenceFromBoard(
    boardBefore: ReadonlyArray<number>,
    boardAfter: ReadonlyArray<number>,
    player: Player,
): string {
    const moves = movesFromBoardDiff(boardBefore, boardAfter, player);
    return formatCoachMoveSequence(moves, player, boardBefore);
}

/**
 * Normalise une notation pour comparaison insensible à l'ordre, aux astérisques et aux multiplicateurs.
 * Exemple : `"13/11 8/5"` ≡ `"8/5 13/11"`, `"8/5(2)"` ≡ `"8/5 8/5"`.
 */
export function normalizeCoachNotation(notation: string): string {
    if (!notation) return '';
    return notation
        .replace(/\*/g, '')
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .flatMap((token) => {
            const m = token.match(/^(.+)\((\d+)\)$/);
            if (!m) return [token];
            const count = Math.max(1, Math.min(4, Number(m[2])));
            return Array.from({ length: count }, () => m[1]);
        })
        .sort()
        .join(' ');
}

/**
 * Convertit une notation RELATIVE au joueur (format `formatSingleMove`) vers la
 * notation ABSOLUE du plateau. Utile pour réparer les notations produites par
 * des moteurs externes (bgsage) qui raisonnent en perspective joueur.
 *
 * @param notation Notation relative (ex. `"13/9"` pour O).
 * @param player   Joueur au trait de la notation.
 */
export function relativeNotationToAbsolute(notation: string, player: Player): string {
    if (!notation || player === 'X') return notation;

    return notation
        .split(/\s+/)
        .filter(Boolean)
        .map((token) => {
            const match = token.match(/^(bar|\d+)\/(off|\d+)(\*?)(\(\d+\))?$/i);
            if (!match) return token;
            const [, fromStr, toStr, star, mult] = match;
            const from = fromStr.toLowerCase() === 'bar' ? O_BAR : 25 - Number(fromStr);
            const to = toStr.toLowerCase() === 'off' ? O_OFF : 25 - Number(toStr);
            return `${formatCoachPoint(from, false)}/${formatCoachPoint(to, true)}${star ?? ''}${mult ?? ''}`;
        })
        .join(' ');
}

/**
 * Parse une notation de coup Coach en liste de Move.
 */
export function parseCoachNotationMoves(notation: string, player: Player = 'X'): Move[] {
    if (!notation) return [];
    const bar = player === 'X' ? X_BAR : O_BAR;
    const off = player === 'X' ? X_OFF : O_OFF;
    return notation
        .trim()
        .split(/\s+/)
        .flatMap((token) => {
            const m = token.match(/^(bar|\d+)\/(off|\d+)\*?(\((\d+)\))?$/i);
            if (!m) return [];
            const from = m[1].toLowerCase() === 'bar' ? bar : Number(m[1]);
            const to = m[2].toLowerCase() === 'off' ? off : Number(m[2]);
            const count = m[4] ? Number(m[4]) : 1;
            return Array.from({ length: count }, () => ({ from, to }));
        });
}
