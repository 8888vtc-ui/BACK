/**
 * Règles pures de sortie de la barre centrale (Audit 3 / 20 — Re-entry Ergonomics).
 *
 * Normes WBF / eXtreme Gammon 2 / Backgammon Galaxy :
 *   1. Tant que `bar[player] > 0`, tous les pions situés sur les flèches 1..24 sont
 *      strictement verrouillés (visuellement et fonctionnellement).
 *   2. Seules les flèches d'entrée légales du jan intérieur adverse (19..24 pour X,
 *      1..6 pour O) peuvent être ciblées et illuminées.
 *   3. Si aucun dé disponible ne permet d'entrer sur une flèche ouverte (<= 1 pion adverse),
 *      le joueur « danse » (Danced / Fanned) : affichage explicite et passage automatique
 *      du tour après `BAR_FANNED_AUTO_PASS_MS` (800 ms).
 *
 * Strictement 0 `any`, module pur < 300 lignes.
 */

import { X_BAR, O_BAR, type Player } from './backgammonEngine';

/** Délai réglementaire (ms) avant passage automatique du tour en cas de danse sur la barre. */
export const BAR_FANNED_AUTO_PASS_MS = 800;

/** Message explicite affiché lorsque toutes les portes d'entrée sont fermées. */
export const BAR_DANCED_MESSAGE = 'Aucun coup possible — Portes fermées (Danse)';

/** Retourne l'index moteur de la barre pour un joueur donné (`0` pour X, `25` pour O). */
export function getPlayerBarPoint(player: Player): number {
    return player === 'X' ? X_BAR : O_BAR;
}

/** Retourne le nombre de pions de `player` actuellement sur la barre centrale. */
export function getPlayerBarCount(board: readonly number[], player: Player): number {
    if (player === 'X') {
        return Math.max(0, board[X_BAR] ?? 0);
    }
    return Math.max(0, -(board[O_BAR] ?? 0));
}

/** Vrai si le joueur possède au moins un pion frappé sur la barre centrale. */
export function hasCheckerOnBar(board: readonly number[], player: Player): boolean {
    return getPlayerBarCount(board, player) > 0;
}

/**
 * Vérifie si `point` appartient au jan intérieur adverse (zone de rentrée légale) :
 * - Pour `X` (se déplace de 24 vers 1) : jan intérieur de O = flèches `19..24`.
 * - Pour `O` (se déplace de 1 vers 24) : jan intérieur de X = flèches `1..6`.
 */
export function isOpponentInnerBoardPoint(point: number, player: Player): boolean {
    if (player === 'X') {
        return point >= 19 && point <= 24;
    }
    return point >= 1 && point <= 6;
}

/**
 * Calcule la flèche d'entrée dans le jan intérieur adverse correspondant à `dieValue` (1..6) :
 * - Pour `X` : `25 - dieValue` (`24` pour un as, `19` pour un 6).
 * - Pour `O` : `dieValue` (`1` pour un as, `6` pour un 6).
 */
export function getBarEntryPointForDie(player: Player, dieValue: number): number | null {
    if (!Number.isInteger(dieValue) || dieValue < 1 || dieValue > 6) return null;
    return player === 'X' ? 25 - dieValue : dieValue;
}

/**
 * Vérifie si la flèche d'entrée correspondant à `dieValue` est ouverte pour `player`
 * (c.-à-d. occupée par au plus 1 pion adverse).
 */
export function isBarEntryOpenForDie(
    board: readonly number[],
    player: Player,
    dieValue: number,
): boolean {
    const entryPoint = getBarEntryPointForDie(player, dieValue);
    if (entryPoint === null) return false;
    const val = board[entryPoint] ?? 0;
    return player === 'X' ? val >= -1 : val <= 1;
}

/**
 * Retourne l'ensemble des points d'entrée légaux dans le jan intérieur adverse (19..24 ou 1..6)
 * lorsque le joueur a au moins un pion sur la barre.
 * Si le joueur n'a aucun pion sur la barre, retourne un `Set` vide.
 */
export function getLegalBarEntryPoints(
    board: readonly number[],
    player: Player,
    leftDieTargets?: ReadonlyMap<number, readonly number[]>,
    rightDieTargets?: ReadonlyMap<number, readonly number[]>,
    dice?: readonly [number, number] | null,
    usedDice?: readonly boolean[],
): Set<number> {
    const entries = new Set<number>();
    if (!hasCheckerOnBar(board, player)) return entries;

    const barPoint = getPlayerBarPoint(player);

    // 1. Source prioritaire : cibles légales calculées par le moteur
    const hasEngineTargets =
        (leftDieTargets !== undefined && leftDieTargets.size > 0) ||
        (rightDieTargets !== undefined && rightDieTargets.size > 0);

    if (hasEngineTargets) {
        const leftDests = leftDieTargets?.get(barPoint) ?? [];
        const rightDests = rightDieTargets?.get(barPoint) ?? [];
        for (const pt of [...leftDests, ...rightDests]) {
            if (isOpponentInnerBoardPoint(pt, player)) {
                entries.add(pt);
            }
        }
        return entries;
    }

    // 2. Fallback direct à partir des dés non consommés si les maps moteur sont vides
    if (dice) {
        const isDouble = dice[0] === dice[1];
        const availableValues = new Set<number>();
        if (isDouble) {
            const anyUnused = !usedDice || usedDice.length === 0 || usedDice.some((u) => !u);
            if (anyUnused) availableValues.add(dice[0]);
        } else {
            if (!usedDice || !usedDice[0]) availableValues.add(dice[0]);
            if (!usedDice || !usedDice[1]) availableValues.add(dice[1]);
        }

        for (const dieVal of availableValues) {
            const pt = getBarEntryPointForDie(player, dieVal);
            if (pt !== null && isBarEntryOpenForDie(board, player, dieVal)) {
                entries.add(pt);
            }
        }
    }

    return entries;
}

/**
 * Détermine si un pion sur une flèche `pointNumber` (1..24) est verrouillé à cause d'un pion
 * ami présent sur la barre centrale.
 */
export function isPointLockedByBar(
    board: readonly number[],
    player: Player,
    pointNumber: number,
): boolean {
    if (pointNumber < 1 || pointNumber > 24) return false;
    if (!hasCheckerOnBar(board, player)) return false;
    const count = board[pointNumber] ?? 0;
    const hasPlayerChecker = player === 'X' ? count > 0 : count < 0;
    return hasPlayerChecker;
}

/**
 * Détecte l'état « Danced / Fanned » sur la barre :
 * Le joueur a au moins un pion sur la barre, les dés sont lancés, il reste au moins un dé
 * à jouer (ou aucun coup n'a pu être joué), mais aucun point d'entrée du jan intérieur adverse
 * n'est légal.
 */
export function isDancedOnBar(
    board: readonly number[],
    player: Player,
    dice: readonly [number, number] | null | undefined,
    leftDieTargets?: ReadonlyMap<number, readonly number[]>,
    rightDieTargets?: ReadonlyMap<number, readonly number[]>,
    usedDice?: readonly boolean[],
): boolean {
    if (!hasCheckerOnBar(board, player)) return false;
    if (!dice) return false;

    const entries = getLegalBarEntryPoints(
        board,
        player,
        leftDieTargets,
        rightDieTargets,
        dice,
        usedDice,
    );
    if (entries.size > 0) return false;

    // Vérifie directement sur le plateau si les dés restants (ou tous les dés du lancer) butent sur des portes adverses
    const d1Blocked = !isBarEntryOpenForDie(board, player, dice[0]);
    const d2Blocked = !isBarEntryOpenForDie(board, player, dice[1]);

    if (d1Blocked && d2Blocked) return true;

    if (usedDice && usedDice.length >= 2) {
        const unusedValues: number[] = [];
        if (dice[0] === dice[1]) {
            if (usedDice.some((u) => !u)) unusedValues.push(dice[0]);
        } else {
            if (!usedDice[0]) unusedValues.push(dice[0]);
            if (!usedDice[1]) unusedValues.push(dice[1]);
        }
        if (unusedValues.length > 0 && unusedValues.every((v) => !isBarEntryOpenForDie(board, player, v))) {
            return true;
        }
    }

    return false;
}
