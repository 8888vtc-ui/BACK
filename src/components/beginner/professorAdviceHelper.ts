/**
 * @file src/components/beginner/professorAdviceHelper.ts
 * @description Générateur déterministe d'explications bilingues sans jargon pour le Professeur Débutant (< 150 lignes, 0 any).
 * Invariant strict : Vérité physique garantie (Coup forcé, Porte fermée, Frappe, Réduction de blots, Course).
 */

import {
    applyMove,
    generateLegalMoves,
    O_BAR,
    type BoardState,
    type Move,
} from '../../engine/backgammonEngine';
import { analyzeBoardMoves } from '../../lib/engine/evaluator';
import { formatCoachMoveSequence } from '../../features/coach/coachMoveNotation';
import { getOpeningForScore, isInitialBoardPosition } from '../../features/openings/openingDatabase';
import type { LastMoveFeedback } from '../../hooks/useCoachHelpers';

export interface ProactiveAdvice {
    readonly bestNotation: string;
    readonly text: string;
}

export function getProactiveAdvice(
    state: BoardState,
    dice: [number, number] | null,
    lang: 'fr' | 'en' = 'fr',
): ProactiveAdvice | null {
    if (!dice || (dice[0] === 0 && dice[1] === 0) || state.turn !== 'X') {
        return null;
    }

    // 1. Détection livre d'ouverture au tour initial
    if (isInitialBoardPosition(state.board) && dice[0] !== dice[1]) {
        const opening = getOpeningForScore(dice[0], dice[1], 'NORMAL');
        if (opening) {
            const bestNotation = opening.bestMoveNotation;
            const text = lang === 'en'
                ? `💡 Professor Tip (Dice ${dice[0]}-${dice[1]}): Play ${bestNotation} to secure an advanced anchor and control the tempo.`
                : `💡 Conseil du Professeur (Dés ${dice[0]}-${dice[1]}) : Joue ${bestNotation} pour ancrer tes pions et prendre l'initiative.`;
            return { bestNotation, text };
        }
    }

    // 2. Évaluation rapide 1-ply des coups légaux et détection de vérité physique
    try {
        const analysis = analyzeBoardMoves(state, dice, { ply: 1, maxMoves: 4 });
        const moves = analysis.bestMove?.moves;
        if (moves && moves.length > 0) {
            const bestNotation = formatCoachMoveSequence(moves, 'X', state.board);
            let boardAfterBest = [...state.board];
            for (const mv of moves) {
                boardAfterBest = applyMove(boardAfterBest, mv, 'X');
            }

            const legals = generateLegalMoves(state, dice);
            const legalMovesCount = legals.length;
            const dHigh = Math.max(dice[0], dice[1]);
            const sourcePointsForHighDie = new Set<number>();
            for (const seq of legals) {
                for (const mv of seq.moves) {
                    if (
                        mv.from - mv.to === dHigh ||
                        (mv.from === 0 && 25 - mv.to === dHigh) ||
                        (mv.to === 0 && mv.from <= dHigh)
                    ) {
                        sourcePointsForHighDie.add(mv.from);
                    }
                }
            }
            const isForcedHighDie = sourcePointsForHighDie.size === 1;

            const text = formatAdviceTextWithPhysicalTruth(
                state.board,
                boardAfterBest,
                bestNotation,
                dice,
                legalMovesCount,
                isForcedHighDie,
                lang,
            );
            return { bestNotation, text };
        }
    } catch {
        /* fallback */
    }

    return null;
}

function formatAdviceTextWithPhysicalTruth(
    boardBefore: readonly number[],
    boardAfterBest: readonly number[],
    bestNotation: string,
    dice: [number, number],
    legalMovesCount: number,
    isForcedHighDie: boolean,
    lang: 'fr' | 'en',
): string {
    const isEn = lang === 'en';
    const diceLabel = `${dice[0]}-${dice[1]}`;
    const dHigh = Math.max(dice[0], dice[1]);

    // Cas A — Coup forcé (1 seul coup légal ou le dé fort n'est jouable que depuis une seule case)
    if (legalMovesCount <= 1 || isForcedHighDie) {
        return isEn
            ? `💡 Professor Tip (Dice ${diceLabel}): Play ${bestNotation}. Moving with the ${dHigh} is forced: advance toward your home board and consolidate your checkers.`
            : `💡 Conseil du Professeur (Dés ${diceLabel}) : Joue ${bestNotation}. Le déplacement avec le ${dHigh} est forcé : avance au maximum vers ton camp et resserre tes pions dans ta maison.`;
    }

    // Cas C — Le coup frappe réellement un pion adverse
    const hitO = Math.abs(boardAfterBest[O_BAR] ?? 0) > Math.abs(boardBefore[O_BAR] ?? 0) || bestNotation.includes('*');
    if (hitO) {
        return isEn
            ? `💡 Professor Tip (Dice ${diceLabel}): Play ${bestNotation} to hit the opponent's exposed blot and send it to the center bar!`
            : `💡 Conseil du Professeur (Dés ${diceLabel}) : Joue ${bestNotation} pour frapper le pion adverse isolé et l'envoyer sur la barre centrale !`;
    }

    // Cas B — Le coup ferme réellement une nouvelle porte (boardBefore[p] < 2 && boardAfterBest[p] >= 2)
    let closedPoint: number | null = null;
    for (let p = 1; p <= 24; p++) {
        if ((boardBefore[p] ?? 0) < 2 && (boardAfterBest[p] ?? 0) >= 2) {
            closedPoint = p;
            break;
        }
    }
    if (closedPoint !== null) {
        return isEn
            ? `💡 Professor Tip (Dice ${diceLabel}): Play ${bestNotation} to secure Point ${closedPoint} with at least 2 checkers and build a solid gate.`
            : `💡 Conseil du Professeur (Dés ${diceLabel}) : Joue ${bestNotation} pour fermer la Case ${closedPoint} avec au moins 2 pions et créer une porte solide.`;
    }

    // Cas D — Le coup réduit réellement le nombre de pions isolés
    const blotsBefore = boardBefore.slice(1, 25).filter((v) => v === 1).length;
    const blotsAfter = boardAfterBest.slice(1, 25).filter((v) => v === 1).length;
    if (blotsAfter < blotsBefore) {
        return isEn
            ? `💡 Professor Tip (Dice ${diceLabel}): Play ${bestNotation} to bring your exposed blot to safety with another checker.`
            : `💡 Conseil du Professeur (Dés ${diceLabel}) : Joue ${bestNotation} pour mettre ton pion isolé en sécurité avec un autre pion.`;
    }

    // Cas E — Sinon (Course / Sortie / Regroupement)
    return isEn
        ? `💡 Professor Tip (Dice ${diceLabel}): Play ${bestNotation} to advance your checkers and prepare bearing them off at Point 1.`
        : `💡 Conseil du Professeur (Dés ${diceLabel}) : Joue ${bestNotation} pour faire avancer tes pions et préparer leur sortie en Case 1.`;
}

export function getFeedbackAdvice(feedback: LastMoveFeedback, lang: 'fr' | 'en' = 'fr'): string {
    const isEn = lang === 'en';
    const absLoss = Math.abs(feedback.equityLoss);

    if (absLoss <= 0.020 || feedback.verdict === 'optimal') {
        return isEn
            ? '✅ Excellent move! Your checkers are well coordinated and secure.'
            : '✅ Excellent coup ! Tes pions sont bien coordonnés et en sécurité.';
    }

    const lossPct = Math.max(1, Math.round(absLoss * 50));
    return isEn
        ? `💡 Professor Tip: Your move costs ~${lossPct}% winning chances compared to ${feedback.optimalMove}. Click '↺ Undo / Retry move' to test the best play!`
        : `💡 Astuce du Professeur : Ton coup perd ~${lossPct} % de chances de gagner par rapport à ${feedback.optimalMove}. Clique sur « ↺ Rejouer mon dernier coup » pour tester le meilleur coup !`;
}

export function getBotMoveExplanation(lastBotNotation: string, lang: 'fr' | 'en' = 'fr'): string {
    const isEn = lang === 'en';
    if (lastBotNotation.includes('*')) {
        return isEn
            ? `👀 What your opponent did: They played ${lastBotNotation} to hit your blot. It's your turn: click Roll Dice!`
            : `👀 Ce qu'a fait ton adversaire : Il a joué ${lastBotNotation} pour frapper ton pion. C'est à toi : clique sur Lancer les dés !`;
    }
    return isEn
        ? `👀 What your opponent did: They played ${lastBotNotation} to advance checkers. It's your turn: click Roll Dice!`
        : `👀 Ce qu'a fait ton adversaire : Il a joué ${lastBotNotation} pour avancer ses pions. C'est à toi : clique sur Lancer les dés !`;
}
