/**
 * Système d'historique de tour et d'annulation pas-à-pas (Audit 7 / 20 — Undo System).
 *
 * Exigences :
 *   1. Annulation pas-à-pas (dé par dé) ou complète du tour tant qu'il n'est pas validé.
 *   2. Restauration exacte de la position (y compris remise en place d'un blot adverse frappé
 *      depuis la barre centrale vers sa flèche d'origine).
 *   3. Détection du clic inverse sur la flèche d'arrivée du dernier pion déplacé (`isReverseClickOnLastMovedChecker`).
 *   4. Identification du dé réanimé (`reanimatedDieIndex`) pour réactivation UI sans scintillement.
 *   5. Verrouillage définitif de l'historique dès que le tour est validé et passe à l'adversaire.
 *
 * Strictement 0 `any`, module pur < 300 lignes.
 */

import { X_BAR, O_BAR, type Move } from './backgammonEngine';

export interface TurnSubMove {
    readonly from: number;
    readonly to: number;
    readonly die?: number;
    readonly dieIndex?: number;
}

export interface TurnSubMoveEntry {
    readonly boardBefore: ReadonlyArray<number>;
    readonly usedDiceBefore: ReadonlyArray<boolean>;
    readonly move: TurnSubMove;
    readonly wasHit: boolean;
}

export interface TurnHistoryStack {
    readonly steps: ReadonlyArray<TurnSubMoveEntry>;
    readonly isLocked: boolean;
}

export interface UndoStepResult {
    readonly nextStack: TurnHistoryStack;
    readonly restored: TurnSubMoveEntry | null;
    readonly reanimatedDieIndex: number | null;
}

/** Crée une pile d'historique de tour vierge et déverrouillée. */
export function createTurnHistoryStack(): TurnHistoryStack {
    return {
        steps: [],
        isLocked: false,
    };
}

/**
 * Détecte si la transition entre `boardBefore` et `boardAfter` a envoyé un blot adverse sur la barre.
 */
export function didMoveHitOpponentBlot(
    boardBefore: ReadonlyArray<number>,
    boardAfter: ReadonlyArray<number>,
): boolean {
    const xBarBefore = Math.max(0, boardBefore[X_BAR] ?? 0);
    const xBarAfter = Math.max(0, boardAfter[X_BAR] ?? 0);
    const oBarBefore = Math.max(0, -(boardBefore[O_BAR] ?? 0));
    const oBarAfter = Math.max(0, -(boardAfter[O_BAR] ?? 0));
    return xBarAfter > xBarBefore || oBarAfter > oBarBefore;
}

/**
 * Enregistre un sous-coup (1 dé joué) dans la pile du tour courant.
 * Si le tour est déjà verrouillé (`isLocked === true`), la pile reste inchangée.
 */
export function pushTurnSubMove(
    stack: TurnHistoryStack,
    params: {
        boardBefore: ReadonlyArray<number>;
        boardAfter?: ReadonlyArray<number>;
        usedDiceBefore: ReadonlyArray<boolean>;
        move: TurnSubMove | Move;
    },
): TurnHistoryStack {
    if (stack.isLocked) return stack;

    const wasHit = params.boardAfter
        ? didMoveHitOpponentBlot(params.boardBefore, params.boardAfter)
        : false;

    const entry: TurnSubMoveEntry = {
        boardBefore: [...params.boardBefore],
        usedDiceBefore: [...params.usedDiceBefore],
        move: { ...params.move },
        wasHit,
    };

    return {
        ...stack,
        steps: [...stack.steps, entry],
    };
}

/**
 * Identifie l'index du dé réanimé en comparant `usedDiceAfter` (avant annulation)
 * et `usedDiceBefore` (restauré par l'annulation).
 */
export function findReanimatedDieIndex(
    usedDiceCurrent: ReadonlyArray<boolean>,
    usedDiceRestored: ReadonlyArray<boolean>,
): number | null {
    const len = Math.min(usedDiceCurrent.length, usedDiceRestored.length);
    for (let i = len - 1; i >= 0; i--) {
        if (usedDiceCurrent[i] && !usedDiceRestored[i]) {
            return i;
        }
    }
    return null;
}

/**
 * Annule le tout dernier sous-coup joué (dé par dé) :
 * - Retourne `restored: null` si la pile est vide ou verrouillée (`isLocked`).
 * - Sinon, dépile la dernière entrée et fournit `boardBefore`, `usedDiceBefore` et `reanimatedDieIndex`.
 */
export function undoLastSubMove(
    stack: TurnHistoryStack,
    currentUsedDice?: ReadonlyArray<boolean>,
): UndoStepResult {
    if (stack.isLocked || stack.steps.length === 0) {
        return {
            nextStack: stack,
            restored: null,
            reanimatedDieIndex: null,
        };
    }

    const lastIdx = stack.steps.length - 1;
    const restored = stack.steps[lastIdx];
    const nextSteps = stack.steps.slice(0, lastIdx);

    const reanimatedDieIndex = currentUsedDice
        ? findReanimatedDieIndex(currentUsedDice, restored.usedDiceBefore)
        : (restored.move.dieIndex ?? null);

    return {
        nextStack: {
            ...stack,
            steps: nextSteps,
        },
        restored,
        reanimatedDieIndex,
    };
}

/**
 * Annule l'intégralité des sous-coups joués pendant le tour courant et restaure
 * la position exacte au début du lancer de dés.
 */
export function undoEntireTurn(stack: TurnHistoryStack): {
    nextStack: TurnHistoryStack;
    initialEntry: TurnSubMoveEntry | null;
} {
    if (stack.isLocked || stack.steps.length === 0) {
        return { nextStack: stack, initialEntry: null };
    }
    const initialEntry = stack.steps[0];
    return {
        nextStack: {
            ...stack,
            steps: [],
        },
        initialEntry,
    };
}

/**
 * Vérifie si un clic inverse sur `clickedPoint` cible le pion qui vient d'être déplacé
 * lors du dernier sous-coup, permettant de l'annuler en 1 clic.
 */
export function isReverseClickOnLastMovedChecker(
    stack: TurnHistoryStack,
    clickedPoint: number,
): boolean {
    if (stack.isLocked || stack.steps.length === 0) return false;
    const last = stack.steps[stack.steps.length - 1];
    return last.move.to === clickedPoint;
}

/**
 * Verrouille définitivement et vide l'historique du tour dès que le tour est validé
 * et que la main passe à l'adversaire.
 */
export function lockTurnHistory(stack: TurnHistoryStack): TurnHistoryStack {
    if (stack.isLocked && stack.steps.length === 0) return stack;
    return {
        steps: [],
        isLocked: true,
    };
}
