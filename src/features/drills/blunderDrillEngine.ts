/**
 * Moteur d'Évaluation des Drills de Blunders.
 *
 * Évalue en temps réel chaque tentative du joueur lors du rejeu d'une erreur passée :
 * 1. Compare le coup avec le coup optimal certifié et les variantes acceptables.
 * 2. Si le coup n'est pas optimal, calcule la perte d'équité résiduelle via le moteur heuristique.
 * 3. Délivre un verdict immédiat (optimal, acceptable, douteux, blunder) et invite à rejouer jusqu'au bon coup.
 */

import type { Move, BoardState } from '../../engine/backgammonEngine';
import {
    analyzeBoardMoves,
    formatMoveSequenceNotation,
} from '../../lib/engine/evaluator';
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

/**
 * Valide un coup joué par l'utilisateur lors d'un exercice de drill.
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

    // 1. Correspondance exacte avec le coup optimal certifié
    if (normalizedPlayed === normalizedOptimal) {
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

    // 3. Analyse en profondeur par le moteur déterministe
    const boardState: BoardState = {
        board: blunder.board,
        turn: blunder.player,
        cubeValue: blunder.matchContext?.cubeValue ?? 1,
        cubeOwner: blunder.matchContext?.cubeOwner ?? null,
        dice: blunder.dice,
        matchLength: blunder.matchContext?.matchLength ?? 7,
        scoreX: blunder.matchContext?.scoreX ?? 0,
        scoreO: blunder.matchContext?.scoreO ?? 0,
        crawford: blunder.matchContext?.crawford ?? false,
        doubled: false,
        resigned: 0,
    };

    let analysis;
    try {
        analysis = analyzeBoardMoves(boardState, blunder.dice, { ply: 2, maxMoves: 8 });
    } catch {
        // En cas d'exception du moteur, repli gracieux
        analysis = undefined;
    }

    // Recherche du coup joué parmi les candidats évalués par le moteur
    const evaluatedMove = analysis?.moves.find(
        (m) => normalizeMoveNotation(m.notation) === normalizedPlayed,
    );

    const equityLoss = evaluatedMove
        ? Math.abs(evaluatedMove.equityLoss)
        : Math.max(0.08, blunder.equityLoss * 0.85);

    // Si le coup joué est très proche de l'optimal selon l'analyse (perte <= 0.025)
    if (equityLoss <= 0.025) {
        return {
            isCorrect: true,
            verdict: 'acceptable',
            equityLoss: Number(equityLoss.toFixed(4)),
            playedNotation,
            optimalNotation: blunder.optimalMove,
            feedbackMessage: `Bien joué ! Variante acceptable (perte minime de -${equityLoss.toFixed(3)} d’équité).`,
            hint: blunder.hint,
            canRetry: false,
            analysis,
        };
    }

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
        analysis,
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
