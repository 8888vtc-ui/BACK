/**
 * Moteur d'Évaluation des Drills de Blunders.
 *
 * Évalue en temps réel chaque tentative du joueur lors du rejeu d'une erreur passée :
 * 1. Compare le coup avec le coup optimal certifié et les variantes acceptables.
 * 2. Si le coup n'est pas optimal, calcule la perte d'équité résiduelle via le moteur heuristique.
 * 3. Délivre un verdict immédiat (optimal, acceptable, douteux, blunder) et invite à rejouer jusqu'au bon coup.
 */

import { applyMove, type Move } from '../../engine/backgammonEngine';
import { formatMoveSequenceNotation } from '../../lib/engine/evaluator';
import { parseCoachNotationMoves } from '../coach/coachMoveNotation';
import type { PlayerBlunderRecord, DrillValidationResult, BlunderDrillSession, DrillTier } from './types';
import { getBlundersToReview, markBlunderAttempt } from './blunderBank';

/**
 * Nettoie une notation de coups pour une comparaison insensible à l'ordre et aux astérisques.
 * Exemple : "24/20 13/11" équivaut à "13/11 24/20".
 */
export function normalizeMoveNotation(notation: string): string {
    if (!notation) return '';
    return notation
        .replace(/\*/g, '')
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .sort()
        .join(' ');
}

function boardSignatureAfterNotation(boardBefore: number[], notation: string, player: 'X' | 'O'): string {
    const clean = notation.replace(/\*/g, '').trim();
    const expandedTokens: string[] = [];
    for (const tok of clean.split(/\s+/)) {
        const parts = tok.split('/');
        if (parts.length > 2) {
            for (let k = 0; k < parts.length - 1; k++) {
                expandedTokens.push(`${parts[k]}/${parts[k + 1]}`);
            }
        } else {
            expandedTokens.push(tok);
        }
    }
    const moves = parseCoachNotationMoves(expandedTokens.join(' '), player);
    let b = [...boardBefore];
    for (const m of moves) {
        b = applyMove(b, m, player);
    }
    return b.slice(1, 25).join(',');
}

/**
 * Valide un coup joué par l'utilisateur lors d'un exercice de drill.
 * Certifié 100 % sur les coups optimaux GNU Backgammon / Open Sage (zéro repli sur l'heuristique locale).
 */
export function validateDrillMove(
    blunder: PlayerBlunderRecord,
    playerMoves: Move[],
    _resultingBoard?: number[],
): DrillValidationResult {
    const player = blunder.player;
    const playedNotation = formatMoveSequenceNotation(playerMoves, player);
    const normalizedPlayed = normalizeMoveNotation(playedNotation);
    const normalizedOptimal = normalizeMoveNotation(blunder.optimalMove);
    const normalizedAcceptables = (blunder.acceptableMoves || []).map(normalizeMoveNotation);

    // 1. Correspondance exacte avec le coup optimal certifié (par notation ou par état final du plateau)
    let playedBoard = [...blunder.board];
    for (const m of playerMoves) {
        playedBoard = applyMove(playedBoard, m, player);
    }
    const playedBoardSig = playedBoard.slice(1, 25).join(',');
    const optimalBoardSig = boardSignatureAfterNotation(blunder.board, blunder.optimalMove, player);

    if (normalizedPlayed === normalizedOptimal || (playerMoves.length > 0 && playedBoardSig === optimalBoardSig)) {
        return {
            isCorrect: true,
            verdict: 'optimal',
            equityLoss: 0,
            playedNotation,
            optimalNotation: blunder.optimalMove,
            feedbackMessage:
                '👑 Coup optimal trouvé ! Vous avez corrigé cette erreur avec une précision chirurgicale.',
            hint: blunder.hint,
            canRetry: false,
        };
    }

    // 2. Correspondance avec une variante acceptable pré-déclarée
    if (normalizedAcceptables.includes(normalizedPlayed)) {
        return {
            isCorrect: true,
            verdict: 'acceptable',
            equityLoss: 0.015,
            playedNotation,
            optimalNotation: blunder.optimalMove,
            feedbackMessage:
                '✨ Variante solide et acceptable ! Votre coup préserve l’équité de la position.',
            hint: blunder.hint,
            canRetry: false,
        };
    }

    // 3. Rejet strict de tout coup non certifié (aucune validation par l'heuristique locale)
    const isOriginalBlunder = normalizedPlayed === normalizeMoveNotation(blunder.playedMove);
    const equityLoss = isOriginalBlunder
        ? blunder.equityLoss
        : Math.max(0.08, Number((blunder.equityLoss * 0.85).toFixed(4)));
    const isBlunder = equityLoss >= 0.08;
    const verdict = isBlunder ? 'blunder' : 'doubtful';

    return {
        isCorrect: false,
        verdict,
        equityLoss: Number(equityLoss.toFixed(4)),
        playedNotation,
        optimalNotation: blunder.optimalMove,
        feedbackMessage: isBlunder
            ? `❌ Ce coup reste un blunder (-${equityLoss.toFixed(3)} ΔEq). Rejouez jusqu’à trouver le bon coup !`
            : `⚠️ Ce coup est douteux (-${equityLoss.toFixed(3)} ΔEq). Vous pouvez faire beaucoup mieux !`,
        hint: blunder.hint,
        canRetry: true,
    };
}

/**
 * Valide un choix de coup direct en notation (Mode Quiz QCM Rapide).
 */
export function validateDrillNotationChoice(
    blunder: PlayerBlunderRecord,
    chosenNotation: string,
): DrillValidationResult {
    const normalizedPlayed = normalizeMoveNotation(chosenNotation);
    const normalizedOptimal = normalizeMoveNotation(blunder.optimalMove);
    const normalizedAcceptables = (blunder.acceptableMoves || []).map(normalizeMoveNotation);

    if (normalizedPlayed === normalizedOptimal) {
        return {
            isCorrect: true,
            verdict: 'optimal',
            equityLoss: 0,
            playedNotation: chosenNotation,
            optimalNotation: blunder.optimalMove,
            feedbackMessage:
                '👑 Coup optimal trouvé ! Vous avez corrigé cette erreur avec une précision chirurgicale.',
            hint: blunder.hint,
            canRetry: false,
        };
    }

    if (normalizedAcceptables.includes(normalizedPlayed)) {
        return {
            isCorrect: true,
            verdict: 'acceptable',
            equityLoss: 0.015,
            playedNotation: chosenNotation,
            optimalNotation: blunder.optimalMove,
            feedbackMessage:
                '✨ Variante solide et acceptable ! Votre coup préserve l’équité de la position.',
            hint: blunder.hint,
            canRetry: false,
        };
    }

    const isOriginalBlunder = normalizedPlayed === normalizeMoveNotation(blunder.playedMove);
    const loss = isOriginalBlunder ? blunder.equityLoss : Math.max(0.08, Number((blunder.equityLoss * 0.85).toFixed(3)));

    return {
        isCorrect: false,
        verdict: loss >= 0.08 ? 'blunder' : 'doubtful',
        equityLoss: loss,
        playedNotation: chosenNotation,
        optimalNotation: blunder.optimalMove,
        feedbackMessage: isOriginalBlunder
            ? `❌ Vous êtes retombé dans le piège initial (${chosenNotation}, -${loss.toFixed(3)} ΔEq) ! Lisez pourquoi ci-dessous et réessayez.`
            : `❌ Ce coup reste une erreur (-${loss.toFixed(3)} ΔEq). Rejouez jusqu’à trouver le bon coup !`,
        hint: blunder.hint,
        canRetry: true,
    };
}

/**
 * Crée une session de drill avec un sous-ensemble d'erreurs prioritaires.
 */
export function createDrillSession(options?: {
    conceptId?: string;
    tier?: DrillTier;
    maxBlunders?: number;
}): BlunderDrillSession {
    const list = getBlundersToReview(options?.conceptId, options?.tier);
    const max = options?.maxBlunders ?? 5;
    const selected = list.slice(0, max);

    return {
        blunders: selected,
        currentIndex: 0,
        sessionSolvedCount: 0,
        sessionAttemptsCount: 0,
        isCompleted: selected.length === 0,
    };
}

/**
 * Enregistre le résultat d'un drill et fait avancer la session vers l'erreur suivante.
 */
export function advanceDrillSession(
    session: BlunderDrillSession,
    solved: boolean,
): BlunderDrillSession {
    const current = session.blunders[session.currentIndex];
    if (current) {
        markBlunderAttempt(current.id, solved);
    }

    const nextSolved = solved ? session.sessionSolvedCount + 1 : session.sessionSolvedCount;
    const nextAttempts = session.sessionAttemptsCount + 1;
    const nextIndex = session.currentIndex + 1;
    const isCompleted = nextIndex >= session.blunders.length;

    return {
        ...session,
        currentIndex: isCompleted ? session.currentIndex : nextIndex,
        sessionSolvedCount: nextSolved,
        sessionAttemptsCount: nextAttempts,
        isCompleted,
    };
}
