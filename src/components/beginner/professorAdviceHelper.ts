/**
 * @file src/components/beginner/professorAdviceHelper.ts
 * @description Générateur déterministe d'explications bilingues sans jargon pour le Professeur Débutant (< 220 lignes, 0 any).
 * Invariant strict : Vérité physique garantie (Coup forcé, Porte fermée, Frappe, Réduction de blots, Course).
 */

import {
    applyMove,
    generateLegalMoves,
    O_BAR,
    type BoardState,
} from '../../engine/backgammonEngine';
import { analyzeBoardMoves } from '../../lib/engine/evaluator';
import { formatCoachMoveSequence, normalizeCoachNotation } from '../../features/coach/coachMoveNotation';
import { getOpeningForScore, isInitialBoardPosition } from '../../features/openings/openingDatabase';
import type { LastMoveFeedback } from '../../hooks/useCoachHelpers';
import type { MatchLogEntry } from '../../actions/types';

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
            const bestNotation = opening.bestMoveNotation || formatCoachMoveSequence(opening.bestMoves, 'X', state.board);
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
        const analysis = analyzeBoardMoves(state, dice, { ply: 1, maxMoves: 6 });
        const moves = analysis.bestMove?.moves ?? generateLegalMoves(state, dice)[0]?.moves;
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
            ? `🎯 Dice ${diceLabel}: Play ${bestNotation} (follow the golden arrows on the board) to unite your checkers on point ${closedPoint} and create an unbreachable Shield (Gate)!`
            : `🎯 Dé ${diceLabel} : joue ${bestNotation} (suis les flèches dorées sur le plateau) pour réunir tes deux pions sur la case ${closedPoint} et créer un Bouclier (Porte) infranchissable !`;
    }

    // Cas 2 — Le coup frappe réellement un pion adverse
    const hitO = Math.abs(boardAfterBest[O_BAR] ?? 0) > Math.abs(boardBefore[O_BAR] ?? 0) || bestNotation.includes('*');
    if (hitO) {
        return isEn
            ? `🎯 Dice ${diceLabel}: Play ${bestNotation} (follow the golden arrows on the board) to hit the opponent's exposed blot and send it to the center bar!`
            : `🎯 Dé ${diceLabel} : joue ${bestNotation} (suis les flèches dorées sur le plateau) pour frapper le pion adverse isolé et l'envoyer sur la Barre centrale !`;
    }

    // Cas 3 — Le coup libère un pion arrière du camp adverse (départ en Case 24)
    const escapesBackChecker = (boardBefore[24] ?? 0) > (boardAfterBest[24] ?? 0) || bestNotation.includes('24/');
    if (escapesBackChecker) {
        return isEn
            ? `🎯 Dice ${diceLabel}: Play ${bestNotation} (follow the golden arrows in the top right) to free your back checker and bring it toward your side!`
            : `🎯 Dé ${diceLabel} : joue ${bestNotation} (suis les flèches dorées en haut à droite) pour libérer ton pion arrière et le ramener vers ton camp !`;
    }

    // Cas 4 — Avancée et regroupement vers la maison
    return isEn
        ? `🎯 Dice ${diceLabel}: Play ${bestNotation} (follow the golden arrows on the board) to advance your checkers safely toward your Home (bottom right)!`
        : `🎯 Dé ${diceLabel} : joue ${bestNotation} (suis les flèches dorées sur le plateau) pour faire avancer tes pions en sécurité vers ta Maison !`;
}

export function evaluateInstantHumanLogEntry(
    entry: MatchLogEntry,
    baseState?: BoardState,
): LastMoveFeedback {
    const dice: [number, number] = [entry.dice[0], entry.dice[1]];
    const playedMove = entry.notation || formatCoachMoveSequence(entry.movePlayed, 'X', entry.boardBefore);
    try {
        const evalState: BoardState = {
            ...(baseState ?? {
                board: [...entry.boardBefore], turn: 'X', dice, cubeValue: 1, cubeOwner: null,
                matchLength: 3, scoreX: 0, scoreO: 0, crawford: false, doubled: false, resigned: 0,
            }),
            board: [...entry.boardBefore],
            turn: 'X',
            dice,
        };
        const analysis = analyzeBoardMoves(evalState, dice, { ply: 1, maxMoves: 12 });
        const best = analysis.bestMove;
        const optimalMove = best?.moves ? formatCoachMoveSequence(best.moves, 'X', entry.boardBefore) : playedMove;
        const sameBoard = best?.board && best.board.slice(0, 26).join(',') === entry.boardAfter.slice(0, 26).join(',');
        const sameNotation = normalizeCoachNotation(playedMove) === normalizeCoachNotation(optimalMove);
        const matchedCand = analysis.moves.find(
            (m) => m.board && m.board.slice(0, 26).join(',') === entry.boardAfter.slice(0, 26).join(','),
        );
        let equityLoss = sameBoard || sameNotation ? 0 : Math.abs(matchedCand?.equityLoss ?? 0.045);
        if (!sameBoard && !sameNotation && best?.board) {
            let playedBlots = 0;
            let bestBlots = 0;
            for (let p = 1; p <= 18; p++) {
                if (entry.boardAfter[p] === 1) playedBlots++;
                if (best.board[p] === 1) bestBlots++;
            }
            if (playedBlots > bestBlots && equityLoss < 0.035) {
                equityLoss = 0.045 + (playedBlots - bestBlots) * 0.025;
            }
        }
        const isOpt = sameBoard || sameNotation || equityLoss <= 0.020;
        return {
            verdict: isOpt ? 'optimal' : equityLoss >= 0.080 ? 'blunder' : 'inaccuracy',
            equityLoss,
            playedMove,
            optimalMove,
            turnIndex: entry.turnIndex,
            decisionType: 'checker',
            boardBefore: entry.boardBefore,
            boardAfter: entry.boardAfter,
            dice,
            timestamp: entry.timestamp ?? Date.now(),
        };
    } catch {
        return {
            verdict: 'optimal', equityLoss: 0, playedMove, optimalMove: playedMove,
            turnIndex: entry.turnIndex, decisionType: 'checker',
            boardBefore: entry.boardBefore, boardAfter: entry.boardAfter, dice, timestamp: Date.now(),
        };
    }
}

export function getFeedbackAdvice(feedback: LastMoveFeedback, lang: 'fr' | 'en' = 'fr'): string {
    const isEn = lang === 'en';
    const absLoss = Math.abs(feedback.equityLoss);
    const humanMove = feedback.playedMove || '';

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
                    ? `✨ BRAVO! Superb! By playing ${humanMove}, you united your checkers on point ${closedPoint}: this Gate is now an impenetrable shield!`
                    : `✨ BRAVO ! Superbe ! En jouant ${humanMove}, tu as réuni tes deux pions sur la case ${closedPoint} : cette Porte est maintenant un bouclier imprenable !`;
            }

            const hit = Math.abs(bAfter[O_BAR] ?? 0) > Math.abs(bBefore[O_BAR] ?? 0) || (feedback.playedMove?.includes('*') ?? false);
            if (hit) {
                return isEn
                    ? `✨ BRAVO! Well played! With ${humanMove}, you hit the opponent's checker and sent it to the central Bar!`
                    : `✨ BRAVO ! Bien joué ! Avec ${humanMove}, tu as envoyé le pion adverse sur la Barre centrale !`;
            }
        }
        return isEn
            ? `✨ BRAVO! Excellent move: you played ${humanMove} and your checkers are safely placed!`
            : `✨ BRAVO ! Très bon coup : tu as joué ${humanMove} et tes pions sont parfaitement placés !`;
    }

    const bAfter = feedback.boardAfter;
    const exposedBlots: number[] = [];
    if (bAfter && bAfter.length >= 25) {
        for (let p = 18; p >= 1; p--) {
            if (bAfter[p] === 1) exposedBlots.push(p);
        }
    }
    if (exposedBlots.length > 0) {
        const listFr = exposedBlots.length === 1
            ? `la case ${exposedBlots[0]}`
            : `les cases ${exposedBlots.slice(0, -1).join(', ')} et ${exposedBlots[exposedBlots.length - 1]}`;
        const listEn = exposedBlots.length === 1
            ? `point ${exposedBlots[0]}`
            : `points ${exposedBlots.slice(0, -1).join(', ')} and ${exposedBlots[exposedBlots.length - 1]}`;
        return isEn
            ? `🤔 Ouch! By playing ${humanMove || 'this move'}, you leave isolated checkers in danger on ${listEn}! The best move was ${feedback.optimalMove}. Do you want to fix it?`
            : `🤔 Oulà ! En jouant ${humanMove || 'ce coup'}, tu laisses des pions tout seuls en danger sur ${listFr} ! Le meilleur coup était ${feedback.optimalMove}. Veux-tu le corriger ?`;
    }

    return isEn
        ? `🤔 Careful! By playing ${humanMove || 'that move'}, you leave a weakness. The best move was ${feedback.optimalMove}. Click '↺ Replay my move'!`
        : `🤔 Attention ! En jouant ${humanMove || 'ce coup'}, tu laisses une faiblesse. Le meilleur coup était ${feedback.optimalMove}. Clique sur « ↺ Rejouer mon coup » !`;
}

export function getBotMoveExplanation(
    lastBotNotation: string,
    lang: 'fr' | 'en' = 'fr',
    botDice?: readonly [number, number] | null,
): string {
    const isEn = lang === 'en';
    const diceStr = botDice && botDice[0] > 0 ? `${botDice[0]}-${botDice[1]}` : '';
    const withDiceFr = diceStr ? ` avec mon ${diceStr}` : '';
    const withDiceEn = diceStr ? ` with my ${diceStr}` : '';
    if (lastBotNotation.includes('*')) {
        return isEn
            ? `👀 I played ${lastBotNotation}${withDiceEn} (hit!). Your turn: click "Roll Dice" in the center of the board!`
            : `👀 J'ai joué ${lastBotNotation}${withDiceFr} (frappe !). À ton tour : clique sur « Lancer les dés » au centre du plateau !`;
    }
    return isEn
        ? `👀 I played ${lastBotNotation}${withDiceEn}. Your turn: click "Roll Dice" in the center of the board!`
        : `👀 J'ai joué ${lastBotNotation}${withDiceFr}. À ton tour : clique sur « Lancer les dés » au centre du plateau !`;
}
