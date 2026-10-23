/**
 * Règles pures et déterministes de sortie des pions (Audit 4 / 20 — Bear-Off Speed & Trays).
 *
 * Normes WBF / eXtreme Gammon 2 / Backgammon Galaxy :
 *   1. Un joueur ne peut sortir ses pions (bear off) que lorsque ses 15 pions sont
 *      dans son jan intérieur (`1..6` pour X, `19..24` pour O) ou déjà sortis, et qu'aucun
 *      pion n'est sur la barre.
 *   2. Règle de correspondance exacte : un dé égal à la distance exacte (`distance === dieValue`)
 *      sort prioritairement le pion de cette flèche.
 *   3. Règle du sur-lancer (Over-roll) : si la flèche correspondant exactement au dé est vide,
 *      un dé supérieur (`dieValue > highestDistance`) permet de sortir un pion UNIQUEMENT
 *      depuis la flèche occupée la plus éloignée de la sortie (`highestOccupiedPoint`).
 *   4. Détection du swipe horizontal rapide vers le sabot extérieur (`isQuickBearOffSwipe`).
 *
 * Strictement 0 `any`, module pur < 300 lignes.
 */

import { X_BAR, O_BAR, X_OFF, O_OFF, type Player } from './backgammonEngine';

export const MAX_CHECKERS_PER_PLAYER = 15;
export const BEAR_OFF_SWIPE_MIN_DX_PX = 28;

export interface DeterministicBearOffMove {
    from: number;
    to: number;
    die: 0 | 1;
    dieValue?: number;
    isOverRoll: boolean;
}

/** Retourne l'index moteur du sabot de sortie (`0` pour X, `25` pour O). */
export function getPlayerOffPoint(player: Player): number {
    return player === 'X' ? X_OFF : O_OFF;
}

/**
 * Calcule la distance (en pips, de 1 à 24) d'une flèche par rapport à la sortie du joueur :
 * - Pour `X` : `pointNumber` (`1..6` dans le jan intérieur).
 * - Pour `O` : `25 - pointNumber` (`1..6` pour les flèches `24..19`).
 */
export function getInnerBoardDistance(pointNumber: number, player: Player): number {
    return player === 'X' ? pointNumber : 25 - pointNumber;
}

/**
 * Vérifie si tous les pions restants en jeu de `player` sont dans son jan intérieur
 * (`1..6` pour X, `19..24` pour O) et qu'aucun pion n'est sur la barre.
 */
export function canPlayerBearOff(board: readonly number[], player: Player): boolean {
    if (player === 'X') {
        if ((board[X_BAR] ?? 0) > 0) return false;
        for (let pt = 7; pt <= 24; pt++) {
            if ((board[pt] ?? 0) > 0) return false;
        }
        for (let pt = 1; pt <= 6; pt++) {
            if ((board[pt] ?? 0) > 0) return true;
        }
        return false;
    }

    if ((board[O_BAR] ?? 0) < 0) return false;
    for (let pt = 1; pt <= 18; pt++) {
        if ((board[pt] ?? 0) < 0) return false;
    }
    for (let pt = 19; pt <= 24; pt++) {
        if ((board[pt] ?? 0) < 0) return true;
    }
    return false;
}

/**
 * Trouve la flèche occupée la plus éloignée de la sortie dans le jan intérieur du joueur.
 * Retourne `{ point, distance }` où `distance` est compris entre `1` et `6`, ou `null` si vide.
 */
export function getHighestOccupiedInnerPoint(
    board: readonly number[],
    player: Player,
): { point: number; distance: number } | null {
    for (let dist = 6; dist >= 1; dist--) {
        const pt = player === 'X' ? dist : 25 - dist;
        const val = board[pt] ?? 0;
        const hasChecker = player === 'X' ? val > 0 : val < 0;
        if (hasChecker) {
            return { point: pt, distance: dist };
        }
    }
    return null;
}

/**
 * Vérifie si la sortie depuis `pointNumber` avec un dé `dieValue` constitue un sur-lancer
 * légal (over-roll) selon les règles officielles :
 * - Tous les pions doivent être dans le jan intérieur (`canPlayerBearOff`).
 * - La flèche exacte `distance === dieValue` est vide.
 * - `dieValue > distance` ET `pointNumber` est la flèche occupée la plus éloignée (`highestOccupied`).
 */
export function isLegalOverRollBearOff(
    board: readonly number[],
    player: Player,
    pointNumber: number,
    dieValue: number,
): boolean {
    if (!canPlayerBearOff(board, player)) return false;
    const distance = getInnerBoardDistance(pointNumber, player);
    if (distance < 1 || distance > 6) return false;
    if (dieValue <= distance) return false;

    const highest = getHighestOccupiedInnerPoint(board, player);
    if (!highest) return false;
    return highest.point === pointNumber && dieValue > highest.distance;
}

/**
 * Sélectionne de manière 100 % déterministe la flèche source pour sortir un pion vers `offPoint`
 * à partir d'une table de cibles d'un dé :
 * 1. Correspondance exacte (`distance === dieValue`) en priorité absolue.
 * 2. À défaut (sur-lancer), le pion le plus éloigné de la sortie (`distance` maximale).
 */
export function selectBestBearOffSourceForTargets(
    targets: ReadonlyMap<number, readonly number[]>,
    offPoint: number,
    player: Player,
    dieValue?: number,
): { from: number; isOverRoll: boolean } | null {
    const candidates: number[] = [];
    for (const [from, dests] of targets.entries()) {
        if (dests.includes(offPoint)) {
            candidates.push(from);
        }
    }
    if (candidates.length === 0) return null;

    candidates.sort(
        (a, b) => getInnerBoardDistance(b, player) - getInnerBoardDistance(a, player),
    );

    if (dieValue !== undefined && dieValue !== null) {
        const exact = candidates.find((pt) => getInnerBoardDistance(pt, player) === dieValue);
        if (exact !== undefined) {
            return { from: exact, isOverRoll: false };
        }
    }

    const furthest = candidates[0];
    const furthestDist = getInnerBoardDistance(furthest, player);
    const isOverRoll = dieValue !== undefined && dieValue !== null ? dieValue > furthestDist : false;
    return { from: furthest, isOverRoll };
}

/**
 * Résout le coup de sortie optimal (1-tap / clic droit sur le sabot) en respectant :
 * 1. Toute correspondance exacte (`distance === dieValue`) sur le dé préféré, puis sur le second dé.
 * 2. Sinon, le sur-lancer valide (over-roll depuis le pion le plus éloigné) sur le dé préféré, puis sur le second dé.
 */
export function resolveDeterministicBearOffMove(params: {
    player: Player;
    offPoint: number;
    leftDieTargets?: ReadonlyMap<number, readonly number[]>;
    rightDieTargets?: ReadonlyMap<number, readonly number[]>;
    dice?: readonly [number, number] | null;
    preferredDie?: 0 | 1;
}): DeterministicBearOffMove | null {
    const {
        player,
        offPoint,
        leftDieTargets,
        rightDieTargets,
        dice = null,
        preferredDie = 0,
    } = params;

    if (!leftDieTargets || !rightDieTargets) return null;

    const secondaryDie: 0 | 1 = (1 - preferredDie) as 0 | 1;
    const primaryTargets = preferredDie === 0 ? leftDieTargets : rightDieTargets;
    const secondaryTargets = preferredDie === 0 ? rightDieTargets : leftDieTargets;
    const primaryDieValue = dice ? dice[preferredDie] : undefined;
    const secondaryDieValue = dice ? dice[secondaryDie] : undefined;

    const primaryPick = selectBestBearOffSourceForTargets(
        primaryTargets,
        offPoint,
        player,
        primaryDieValue,
    );
    const secondaryPick = selectBestBearOffSourceForTargets(
        secondaryTargets,
        offPoint,
        player,
        secondaryDieValue,
    );

    // 1. Priorité absolue à une correspondance exacte (non over-roll)
    if (primaryPick && !primaryPick.isOverRoll && primaryDieValue !== undefined) {
        return {
            from: primaryPick.from,
            to: offPoint,
            die: preferredDie,
            dieValue: primaryDieValue,
            isOverRoll: false,
        };
    }
    if (secondaryPick && !secondaryPick.isOverRoll && secondaryDieValue !== undefined) {
        return {
            from: secondaryPick.from,
            to: offPoint,
            die: secondaryDie,
            dieValue: secondaryDieValue,
            isOverRoll: false,
        };
    }

    // 2. Sinon, sur-lancer (over-roll) sur le pion le plus éloigné de la sortie
    if (primaryPick) {
        return {
            from: primaryPick.from,
            to: offPoint,
            die: preferredDie,
            dieValue: primaryDieValue,
            isOverRoll: primaryPick.isOverRoll,
        };
    }
    if (secondaryPick) {
        return {
            from: secondaryPick.from,
            to: offPoint,
            die: secondaryDie,
            dieValue: secondaryDieValue,
            isOverRoll: secondaryPick.isOverRoll,
        };
    }

    return null;
}

/**
 * Détecte si un geste de glissement (swipe) correspond à un envoi rapide vers le sabot extérieur.
 */
export function isQuickBearOffSwipe(deltaX: number, deltaY: number): boolean {
    return deltaX >= BEAR_OFF_SWIPE_MIN_DX_PX && Math.abs(deltaX) > Math.abs(deltaY) * 1.15;
}

/** Formate le compteur exact du sabot au format `0/15` .. `15/15`. */
export function formatBearOffCounter(count: number): string {
    const clamped = Math.max(0, Math.min(MAX_CHECKERS_PER_PLAYER, Math.trunc(count)));
    return `${clamped}/${MAX_CHECKERS_PER_PLAYER}`;
}
