import type { BoardState, MoveSequence } from '../../engine/backgammonEngine';
import type { AIDifficulty } from '../../engine/aiHeuristics';
import { selectBotMoveWithBgsage } from '../../lib/engine/bgsageClient';
import { findOpeningBookSequenceForOpponent, isInitialBoardPosition } from '../../features/openings';
import { recordBotMoveEquityLoss } from '../../features/personas/botRealPr';

/**
 * Sélection du coup du bot — OPEN SAGE UNIQUEMENT (décision du 2026-11-01).
 *
 * L'audit `scripts/audit_bots_vs_gnubg.ts` (référence GNU Backgammon 3-ply, 50 positions) a montré que
 * les moteurs locaux (BT-Core, BT-PR_ONLY, heuristiques, ancien repli local) ne sont PAS exploitables :
 * ~40 % de coups identiques à GNUBG, quel que soit le niveau affiché. Ils ont été retirés du chemin de jeu.
 *
 * Si Open Sage ne répond pas, on réessaie et on affiche un message ; on ne joue JAMAIS un coup local
 * de remplacement (Règle 2 : zéro repli silencieux).
 */

/** Délais entre deux tentatives Open Sage (ms). Au-delà, on réessaie toutes les 8 s. */
const RETRY_DELAYS_MS = [0, 1500, 3000, 5000, 8000];

export interface ResolveOpponentMoveParams {
    stateWithDice: BoardState;
    currentBoard: number[];
    rolledDice: [number, number];
    legalSeqs: MoveSequence[];
    difficulty: AIDifficulty;
    computeHardDeadlineMs: number;
    isCustomTestTiming: boolean;
    /** Appelé quand Open Sage n'a pas répondu et qu'une nouvelle tentative va être faite. */
    onEngineRetry?: (attempt: number) => void;
    /** Permet d'arrêter les tentatives si le tour est annulé (nouvelle partie, abandon...). */
    isAborted?: () => boolean;
}

export function pickOpeningBook(
    board: number[],
    rolledDice: [number, number],
    legalSeqs: MoveSequence[],
    difficulty: AIDifficulty,
): MoveSequence | null {
    try {
        if (difficulty !== 'beginner' && isInitialBoardPosition(board)) {
            return findOpeningBookSequenceForOpponent(board, rolledDice, legalSeqs);
        }
    } catch {
        // Livre indisponible : on passe à Open Sage
    }
    return null;
}

/**
 * Coup déterministe RÉSERVÉ AUX TESTS UNITAIRES synchrones (`isCustomTestTiming`).
 * Ce n'est pas un bot : il joue le livre d'ouverture, sinon la première séquence légale.
 */
export function pickTestStubMove(
    board: number[],
    rolledDice: [number, number],
    legalSeqs: MoveSequence[],
    difficulty: AIDifficulty,
): MoveSequence | null {
    return pickOpeningBook(board, rolledDice, legalSeqs, difficulty) ?? legalSeqs[0] ?? null;
}

function wait(ms: number): Promise<void> {
    return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

export async function resolveOpponentMoveSequence({
    stateWithDice,
    currentBoard,
    rolledDice,
    legalSeqs,
    difficulty,
    computeHardDeadlineMs,
    isCustomTestTiming,
    onEngineRetry,
    isAborted,
}: ResolveOpponentMoveParams): Promise<MoveSequence | null> {
    if (legalSeqs.length === 0) return null;
    if (legalSeqs.length === 1) return legalSeqs[0];

    // Coup du livre d'ouverture : non mesuré par Open Sage, donc exclu du PR (aucune valeur supposée).
    const book = pickOpeningBook(currentBoard, rolledDice, legalSeqs, difficulty);
    if (book) return book;

    if (isCustomTestTiming) {
        return pickTestStubMove(currentBoard, rolledDice, legalSeqs, difficulty);
    }

    const timeoutMs = Math.max(computeHardDeadlineMs, 4500);
    for (let attempt = 0; ; attempt++) {
        if (isAborted?.()) return null;
        await wait(RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)] ?? 8000);
        if (isAborted?.()) return null;
        try {
            const choice = await selectBotMoveWithBgsage(stateWithDice, legalSeqs, difficulty, timeoutMs);
            if (choice?.sequence) {
                recordBotMoveEquityLoss(choice.equityLoss, choice.isForced);
                return choice.sequence;
            }
        } catch {
            // Open Sage injoignable : nouvelle tentative ci-dessous
        }
        onEngineRetry?.(attempt + 1);
    }
}
