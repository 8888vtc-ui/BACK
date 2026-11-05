/**
 * @file src/features/coach/coachTruthAuditor.ts
 * @description Détecteur de mensonges et vérificateur d'intégrité zéro-hallucination du Coach IA.
 * Vérifie mathématiquement les 7 Péchés Capitaux du Coach et du Bot.
 * Strictement <= 300 lignes, 0 any.
 */

import {
    applyMove, borneOffCount, X_BAR, O_BAR, X_OFF, O_OFF, type Player, type Move,
} from '../../engine/backgammonEngine';
import { parseCoachNotationMoves } from './coachMoveNotation';
import { BEGINNER_FORBIDDEN_TERMS } from '../../lib/coach/coachAdaptiveKnowledgeDb';
import { BLUNDER_CAP_EMG_BY_DIFFICULTY } from '../personas/botPersonas';
import type { AIDifficulty } from '../../engine/aiHeuristics';

export type CoachSinType =
    | 'ILLEGAL_RECOMMENDED_MOVE'
    | 'MISMATCHED_PLAYED_MOVE'
    | 'WRONG_TURN_OR_POST_MOVE_BOARD'
    | 'LLM_TEXT_HALLUCINATION'
    | 'FALSE_BLUNDER_ON_OPTIMAL'
    | 'TIER_JARGON_VIOLATION'
    | 'BOT_ABSURD_MOVE';

export interface CoachAuditInput {
    readonly player: Player;
    readonly boardBeforeMove: readonly number[];
    readonly boardAfterMove: readonly number[];
    readonly boardAfterBestMove?: readonly number[];
    readonly diceRolled: readonly [number, number];
    readonly playedMoveNotation: string;
    readonly recommendedMoveNotation: string;
    readonly equityLossEmg: number;
    readonly coachExplanationText?: string;
    readonly playerTier?: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
    readonly botDifficulty?: string;
    readonly isOpponentTurn?: boolean;
    readonly isPostMoveEvaluation?: boolean;
}

export interface CoachAuditResult {
    readonly isValid: boolean;
    readonly sin?: CoachSinType;
    readonly errorMessage?: string;
}

function verifyMovePhysicallyLegal(
    moves: readonly Move[],
    boardBefore: readonly number[],
    dice: readonly [number, number],
    player: Player,
): { legal: boolean; error?: string } {
    if (moves.length === 0) return { legal: true };

    let sim = [...boardBefore];
    const isDouble = dice[0] === dice[1];
    const availDice = isDouble ? [dice[0], dice[0], dice[0], dice[0]] : [dice[0], dice[1]];
    const opp = player === 'X' ? 'O' : 'X';

    for (const m of moves) {
        const { from, to } = m;
        // 1. Case de départ
        if (from === X_BAR || (player === 'O' && from === O_BAR)) {
            const barCount = player === 'X' ? sim[X_BAR] : -sim[O_BAR];
            if (barCount <= 0) return { legal: false, error: `Aucun pion sur la barre (${player})` };
        } else if (from >= 1 && from <= 24) {
            const count = player === 'X' ? sim[from] : -sim[from];
            if (count <= 0) return { legal: false, error: `Case de départ ${from} vide de pions ${player}` };
        } else {
            return { legal: false, error: `Case de départ ${from} hors limites` };
        }

        // 2. Case d'arrivée bloquée
        if (to >= 1 && to <= 24) {
            const oppCount = opp === 'X' ? sim[to] : -sim[to];
            if (oppCount >= 2) return { legal: false, error: `Case d'arrivée ${to} bloquée par l'adversaire (${oppCount} pions)` };
        }

        // 3. Distance cohérente avec un dé disponible ou combiné
        const dist = player === 'X'
            ? (from === X_BAR ? 25 - to : to === X_OFF ? from : from - to)
            : (from === O_BAR ? to : to === O_OFF ? 25 - from : to - from);

        const exactIdx = availDice.indexOf(dist);
        if (exactIdx !== -1) {
            availDice.splice(exactIdx, 1);
        }

        sim = applyMove(sim, m, player);
    }

    // 4. Conservation des 15 pions
    const offX = borneOffCount(sim, 'X');
    const offO = borneOffCount(sim, 'O');
    let activeX = sim[X_BAR];
    let activeO = -sim[O_BAR];
    for (let p = 1; p <= 24; p++) {
        if (sim[p] > 0) activeX += sim[p];
        if (sim[p] < 0) activeO += -sim[p];
    }
    if (activeX + offX !== 15 || activeO + offO !== 15) {
        return { legal: false, error: `Conservation des 15 pions violée (X=${activeX + offX}, O=${activeO + offO})` };
    }

    return { legal: true };
}

export function auditCoachTruth(input: CoachAuditInput): CoachAuditResult {
    const {
        player,
        boardBeforeMove,
        boardAfterMove,
        boardAfterBestMove,
        diceRolled,
        playedMoveNotation,
        recommendedMoveNotation,
        equityLossEmg,
        coachExplanationText = '',
        playerTier = 'EXPERT',
        botDifficulty,
        isOpponentTurn = false,
        isPostMoveEvaluation = false,
    } = input;

    // Péché #3 : Confusion Joueur / Adversaire ou Plateau Post-Coup
    if (isOpponentTurn) {
        return { isValid: false, sin: 'WRONG_TURN_OR_POST_MOVE_BOARD', errorMessage: 'Le Coach évalue le tour adverse comme une erreur du joueur humain.' };
    }
    if (isPostMoveEvaluation) {
        return { isValid: false, sin: 'WRONG_TURN_OR_POST_MOVE_BOARD', errorMessage: 'Le Coach évalue le plateau post-coup au lieu du plateau pré-coup.' };
    }

    // Péché #1 : Coup Recommandé Fantôme ou Illégal
    if (recommendedMoveNotation && recommendedMoveNotation !== 'Pass' && recommendedMoveNotation !== 'Take') {
        const moves = parseCoachNotationMoves(recommendedMoveNotation, player);
        let check = verifyMovePhysicallyLegal(moves, boardBeforeMove, diceRolled, player);
        if (!check.legal && player === 'O') {
            const rawMoves = parseCoachNotationMoves(recommendedMoveNotation, 'X');
            const altMoves = rawMoves.map((m) => ({
                from: m.from === X_BAR ? O_BAR : m.from,
                to: m.to === X_OFF ? O_OFF : m.to,
            }));
            const altCheck = verifyMovePhysicallyLegal(altMoves, boardBeforeMove, diceRolled, player);
            if (altCheck.legal) check = altCheck;
        }
        if (!check.legal) {
            return {
                isValid: false,
                sin: 'ILLEGAL_RECOMMENDED_MOVE',
                errorMessage: `Coup recommandé "${recommendedMoveNotation}" physiquement illégal : ${check.error}`,
            };
        }
    }

    // Péché #2 : Coup Joué Mal Identifié
    if (playedMoveNotation && playedMoveNotation !== 'Pass') {
        const movesPlayed = parseCoachNotationMoves(playedMoveNotation, player);
        let simPlayed = [...boardBeforeMove];
        for (const m of movesPlayed) simPlayed = applyMove(simPlayed, m, player);
        let matchPoints = true;
        for (let p = 1; p <= 24; p++) {
            if (simPlayed[p] !== boardAfterMove[p]) {
                matchPoints = false;
                break;
            }
        }
        if (!matchPoints && player === 'O') {
            const rawMoves = parseCoachNotationMoves(playedMoveNotation, 'X');
            let simRaw = [...boardBeforeMove];
            for (const m of rawMoves) {
                const from = m.from === X_BAR ? O_BAR : m.from;
                const to = m.to === X_OFF ? O_OFF : m.to;
                simRaw = applyMove(simRaw, { from, to }, 'O');
            }
            let rawMatches = true;
            for (let p = 1; p <= 24; p++) {
                if (simRaw[p] !== boardAfterMove[p]) {
                    rawMatches = false;
                    break;
                }
            }
            if (rawMatches) matchPoints = true;
        }
        if (!matchPoints && movesPlayed.length > 0) {
            return {
                isValid: false,
                sin: 'MISMATCHED_PLAYED_MOVE',
                errorMessage: `Le coup joué "${playedMoveNotation}" ne correspond pas à boardAfterMove`,
            };
        }
    }

    // Péché #5 : Faux Blâme sur un Bon Coup (<= 0.020 EMG)
    const absLoss = Math.abs(equityLossEmg);
    if (absLoss <= 0.020) {
        const blundersTerms = /grave\s+erreur|blunder|grosse\s+faute|faute\s+majeure/i;
        if (blundersTerms.test(coachExplanationText)) {
            return {
                isValid: false,
                sin: 'FALSE_BLUNDER_ON_OPTIMAL',
                errorMessage: `Perte mineure (${absLoss.toFixed(3)} EMG) qualifiée à tort de faute majeure dans le texte.`,
            };
        }
    }

    // Péché #6 : Violation du Vocabulaire par Niveau
    if (playerTier === 'BEGINNER') {
        for (const term of BEGINNER_FORBIDDEN_TERMS) {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, 'iu');
            if (regex.test(coachExplanationText)) {
                return {
                    isValid: false,
                    sin: 'TIER_JARGON_VIOLATION',
                    errorMessage: `Terme professionnel interdit en mode Débutant : "${term}"`,
                };
            }
        }
    } else if (playerTier === 'INTERMEDIATE' && coachExplanationText.length > 20) {
        const hasConcreteReasoning = /\b\d{1,2}\/36\b/i.test(coachExplanationText) ||
            coachExplanationText.includes('36') ||
            /course|race|prime|barrage|blitz|ancre|contact|sécurité/i.test(coachExplanationText);
        if (!hasConcreteReasoning) {
            return {
                isValid: false,
                sin: 'TIER_JARGON_VIOLATION',
                errorMessage: 'Mode Intermédiaire sans mention du plan concret ni des 36 lancers.',
            };
        }
    } else if (playerTier === 'EXPERT' && coachExplanationText.length > 20) {
        const hasExpertMetrics = /EMG|ΔEMG|Eq|MWC|%/i.test(coachExplanationText);
        if (!hasExpertMetrics) {
            return {
                isValid: false,
                sin: 'TIER_JARGON_VIOLATION',
                errorMessage: 'Mode Expert sans équité chirurgicale (EMG ou MWC).',
            };
        }
    }

    // Péché #4 : Hallucination de Notation ou de Cases dans le Texte
    if (coachExplanationText) {
        // A. Vérification des fausses allégations de blots (pions isolés)
        const blotRegex = /(?:pion(?:s)?\s+isolé(?:s)?|blot(?:s)?)\s+(?:sur\s+(?:(?:la|le|les)\s+)?flèche(?:s)?|point(?:s)?)\s+([0-9,\s–et]+)/gi;
        let blotMatch: RegExpExecArray | null;
        while ((blotMatch = blotRegex.exec(coachExplanationText)) !== null) {
            const rawPts = blotMatch[1].match(/\b\d{1,2}\b/g) ?? [];
            for (const ptStr of rawPts) {
                const pt = Number(ptStr);
                if (pt >= 1 && pt <= 24) {
                    const count = player === 'X' ? boardAfterMove[pt] : -boardAfterMove[pt];
                    if (count !== 1) {
                        return {
                            isValid: false,
                            sin: 'LLM_TEXT_HALLUCINATION',
                            errorMessage: `Le Coach hallucine un pion isolé sur la flèche ${pt} (réel : ${count} pions)`,
                        };
                    }
                }
            }
        }

        // B. Vérification des fausses allégations de portes fermées (points made)
        const gateRegex = /(?:porte|fermeture|ancre)\s+(?:sur\s+(?:la\s+)?flèche|au\s+point)\s+(\d{1,2})/gi;
        let gateMatch: RegExpExecArray | null;
        while ((gateMatch = gateRegex.exec(coachExplanationText)) !== null) {
            const pt = Number(gateMatch[1]);
            if (pt >= 1 && pt <= 24 && boardAfterBestMove) {
                const count = player === 'X' ? boardAfterBestMove[pt] : -boardAfterBestMove[pt];
                if (count < 2) {
                    return {
                        isValid: false,
                        sin: 'LLM_TEXT_HALLUCINATION',
                        errorMessage: `Le Coach hallucine la fermeture d'une porte sur la flèche ${pt} (réel : ${count} pion(s))`,
                    };
                }
            }
        }
    }

    // Péché #7 : Coup Invraisemblable du Robot
    if (botDifficulty && botDifficulty in BLUNDER_CAP_EMG_BY_DIFFICULTY) {
        const cap = BLUNDER_CAP_EMG_BY_DIFFICULTY[botDifficulty as AIDifficulty] + 0.010;
        if (absLoss > cap) {
            return {
                isValid: false,
                sin: 'BOT_ABSURD_MOVE',
                errorMessage: `Le bot ${botDifficulty} a joué un coup perdant ${absLoss.toFixed(3)} EMG (plafond autorisé : ${cap.toFixed(3)} EMG)`,
            };
        }
    }

    return { isValid: true };
}
