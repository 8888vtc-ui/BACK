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
            let boardAfterBest = [...state.board];
            for (const mv of opening.bestMoves) {
                boardAfterBest = applyMove(boardAfterBest, mv, 'X');
            }
            const text = formatAdviceTextWithPhysicalTruth(state.board, boardAfterBest, bestNotation, dice, lang);
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

            const text = formatAdviceTextWithPhysicalTruth(
                state.board,
                boardAfterBest,
                bestNotation,
                dice,
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
    lang: 'fr' | 'en',
): string {
    const isEn = lang === 'en';
    const diceLabel = `${dice[0]}-${dice[1]}`;

    // Cas 1 — Le coup ferme réellement une nouvelle porte (bouclier)
    let closedPoint: number | null = null;
    for (let p = 1; p <= 24; p++) {
        if ((boardBefore[p] ?? 0) < 2 && (boardAfterBest[p] ?? 0) >= 2) {
            closedPoint = p;
            break;
        }
    }
    if (closedPoint !== null) {
        return isEn
            ? `Professor Tip (Dice ${diceLabel}): Follow the two golden arrows on the board to unite your two checkers on the same point and create an unbreachable Shield (Gate)!`
            : `Conseil du Professeur (Dés ${diceLabel}) : Suis les deux flèches dorées sur le plateau pour réunir tes deux pions sur la même pointe et créer un Bouclier (Porte) infranchissable !`;
    }

    // Cas 2 — Le coup frappe réellement un pion adverse
    const hitO = Math.abs(boardAfterBest[O_BAR] ?? 0) > Math.abs(boardBefore[O_BAR] ?? 0) || bestNotation.includes('*');
    if (hitO) {
        return isEn
            ? `Professor Tip (Dice ${diceLabel}): Follow the golden arrow to hit the opponent's exposed blot and send it to the center bar!`
            : `Conseil du Professeur (Dés ${diceLabel}) : Suis la flèche dorée pour frapper le pion adverse isolé et l'envoyer en prison sur la Barre centrale !`;
    }

    // Cas 3 — Le coup libère un pion arrière du camp adverse (départ en Case 24, en haut à droite)
    const escapesBackChecker = (boardBefore[24] ?? 0) > (boardAfterBest[24] ?? 0) || bestNotation.includes('24/');
    if (escapesBackChecker) {
        return isEn
            ? `Professor Tip (Dice ${diceLabel}): Follow the long golden arrow in the top right to free your back checker and bring it toward your side.`
            : `Conseil du Professeur (Dés ${diceLabel}) : Suis la longue flèche dorée en haut à droite pour libérer ton pion arrière et le ramener vers ton camp.`;
    }

    // Cas 4 — Avancée et regroupement vers la maison
    return isEn
        ? `Professor Tip (Dice ${diceLabel}): Follow the golden arrows on the board to advance your checkers safely toward your Home (bottom right).`
        : `Conseil du Professeur (Dés ${diceLabel}) : Suis les flèches dorées sur le plateau pour faire avancer tes pions en sécurité vers ta Maison (en bas à droite).`;
}

export function getFeedbackAdvice(feedback: LastMoveFeedback, lang: 'fr' | 'en' = 'fr'): string {
    const isEn = lang === 'en';
    const absLoss = Math.abs(feedback.equityLoss);

    if (absLoss <= 0.020 || feedback.verdict === 'optimal') {
        const bBefore = feedback.boardBefore;
        const bAfter = feedback.boardAfter;
        if (bBefore && bAfter && bBefore.length === 26 && bAfter.length === 26) {
            let closedPoint: number | null = null;
            for (let p = 1; p <= 24; p++) {
                if ((bBefore[p] ?? 0) < 2 && (bAfter[p] ?? 0) >= 2) {
                    closedPoint = p;
                    break;
                }
            }
            if (closedPoint !== null) {
                return isEn
                    ? `Superb! You united your checkers on point ${closedPoint}: this Gate is now an impenetrable shield!`
                    : `Superbe ! Tu as réuni tes deux pions sur la case ${closedPoint} : cette Porte est maintenant un bouclier imprenable !`;
            }

            const hit = Math.abs(bAfter[O_BAR] ?? 0) > Math.abs(bBefore[O_BAR] ?? 0) || (feedback.playedMove?.includes('*') ?? false);
            if (hit) {
                return isEn
                    ? "Well played! You hit the opponent's checker and sent it to the central Bar!"
                    : "Bien joué ! Tu as envoyé le pion adverse sur la Barre centrale !";
            }
        }
        return isEn
            ? 'Great move! Your checkers advance toward your Home without leaving an exposed target.'
            : 'Très bon coup ! Tes pions avancent vers ta Maison sans laisser de cible isolée.';
    }

    const lossPct = Math.max(1, Math.round(absLoss * 50));
    return isEn
        ? `Professor Tip: Your move costs ~${lossPct}% winning chances compared to ${feedback.optimalMove}. Click '↺ Undo / Retry move' to test the best play!`
        : `Conseil du Professeur : Ton coup perd ~${lossPct} % de chances de gagner par rapport à ${feedback.optimalMove}. Clique sur « ↺ Rejouer le coup » pour tester le meilleur coup !`;
}

export function getBotMoveExplanation(lastBotNotation: string, lang: 'fr' | 'en' = 'fr'): string {
    const isEn = lang === 'en';
    if (lastBotNotation.includes('*')) {
        return isEn
            ? `What your opponent did: They played ${lastBotNotation} to hit your blot. It's your turn: click Roll Dice!`
            : `Ce qu'a fait ton adversaire : Il a joué ${lastBotNotation} pour frapper ton pion. C'est à toi : clique sur Lancer les dés !`;
    }
    return isEn
        ? `What your opponent did: They played ${lastBotNotation} to advance checkers. It's your turn: click Roll Dice!`
        : `Ce qu'a fait ton adversaire : Il a joué ${lastBotNotation} pour avancer ses pions. C'est à toi : clique sur Lancer les dés !`;
}
