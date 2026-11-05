/**
 * @file src/components/beginner/professorAdviceHelper.ts
 * @description Générateur déterministe d'explications bilingues sans jargon pour le Professeur Débutant (< 140 lignes, 0 any).
 */

import type { BoardState } from '../../engine/backgammonEngine';
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
            const text = formatAdviceText(bestNotation, dice, lang);
            return { bestNotation, text };
        }
    }

    // 2. Évaluation rapide 1-ply des coups légaux
    try {
        const analysis = analyzeBoardMoves(state, dice, { ply: 1, maxMoves: 4 });
        const moves = analysis.bestMove?.moves;
        if (moves && moves.length > 0) {
            const bestNotation = formatCoachMoveSequence(moves, 'X', state.board);
            const text = formatAdviceText(bestNotation, dice, lang);
            return { bestNotation, text };
        }
    } catch {
        /* fallback */
    }

    return null;
}

function formatAdviceText(bestNotation: string, dice: [number, number], lang: 'fr' | 'en'): string {
    const isEn = lang === 'en';
    const diceLabel = `${dice[0]}-${dice[1]}`;

    if (bestNotation.includes('*')) {
        return isEn
            ? `💡 Professor Tip: With ${diceLabel}, play ${bestNotation} to hit the opponent's exposed blot and send it to the bar!`
            : `💡 Conseil du Professeur : Profite de ce ${diceLabel} pour jouer ${bestNotation} : tu frappes le pion adverse isolé et le renvoies sur la barre !`;
    }

    const makesGate = /\b(?:13\/7|8\/7|6\/2|8\/2|24\/20|13\/9)\b/.test(bestNotation) || /24\/18\s+13\/9/.test(bestNotation);
    if (makesGate) {
        return isEn
            ? `💡 Professor Tip: With ${diceLabel}, the best plan is ${bestNotation} to build a solid gate and shield your position!`
            : `💡 Conseil du Professeur : Avec ce ${diceLabel}, le meilleur plan est ${bestNotation} pour construire une porte et créer un bouclier solide !`;
    }

    return isEn
        ? `💡 Professor Tip: Play ${bestNotation} to bring your checkers to safety and advance toward your home board (Point 1).`
        : `💡 Conseil du Professeur : Joue ${bestNotation} pour mettre tes pions en sécurité et avancer vers ta zone de sortie (Case 1).`;
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
