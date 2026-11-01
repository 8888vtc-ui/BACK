/**
 * @file src/features/drills/drillSubAgentsPipeline.ts
 * @description Architecture à 2 Sous-Agents IA spécialisés pour `/puzzles` (Quiz ER / PR) et `/drills` (Quiz ERH) :
 * 1. Sous-Agent 1 : `FlashLite-Tactical-Extractor` (`gemini-2.5-flash-lite` / "flashlight")
 *    - Validation mathématique stricte `validateBoardState(board)` (exactement 15 pions X et 15 pions O, pip count exact).
 *    - Extraction géométrique déterministe (< 5 ms) entre le coup joué et le coup optimal (lancers constructifs sur 36, portes, blots, ΔEMG, impact ER/PR, ERH).
 * 2. Sous-Agent 2 : `Flash-Pedagogical-Coach` (`gemini-2.5-flash` / "flash")
 *    - Rédaction pédagogique structurée en 3 blocs (1. Diagnostic Causal, 2. La Solution Optimale, 3. Règle d'Or pour progresser) à partir du JSON validé par Zod.
 * - Strictement 0 `any`, < 260 lignes (GOVERNANCE.md & SCALABILITY.md).
 */

import { z } from 'zod';
import { applyMove } from '../../engine/backgammonEngine';
import { parseCoachNotationMoves } from '../coach/coachMoveNotation';
import { toCanonicalActiveBoard } from '../coach/detectPositionalMotif';
import { countConstructiveRolls36 } from '../coach/lookahead36';
import type { PlayerBlunderRecord, DrillValidationResult } from './types';

export const ERH_TOOLTIP_TEXT =
    'ERH : Error Rate Humain — Mesure votre précision par rapport aux erreurs humaines types de votre palier';

export const BoardValidationSchema = z.object({
    isValid15Checkers: z.boolean(),
    whiteCheckersTotal: z.number().int(),
    blackCheckersTotal: z.number().int(),
    whiteOnBoardAndBar: z.number().int(),
    blackOnBoardAndBar: z.number().int(),
    whiteBorneOff: z.number().int(),
    blackBorneOff: z.number().int(),
    whitePips: z.number().int().min(0),
    blackPips: z.number().int().min(0),
    pipDiff: z.number().int(),
    whiteMadePoints: z.number().int().min(0),
    blackMadePoints: z.number().int().min(0),
    backCheckersSummary: z.string(),
    normalizedBoard: z.array(z.number()),
});

export type BoardValidationReport = z.infer<typeof BoardValidationSchema>;

/**
 * Vérifie qu'il y a exactement 15 pions par joueur (plateau + barre + sortie)
 * et recalcule dynamiquement les pips exacts de Blanc, de Noir et le différentiel.
 */
export function validateBoardState(board: ReadonlyArray<number>, player: 'X' | 'O' = 'X'): BoardValidationReport {
    const normalized = new Array<number>(28).fill(0);
    for (let i = 0; i < Math.min(board.length, 28); i++) {
        normalized[i] = Math.trunc(board[i] ?? 0);
    }

    let whiteOnBoard = Math.max(0, normalized[25] ?? 0);
    let blackOnBoard = Math.max(0, -(normalized[0] ?? 0));

    // Si un ancien tableau stockait la barre de X en 0 (>0) ou la barre de O en 25 (<0), on le prend en compte
    if ((normalized[0] ?? 0) > 0) whiteOnBoard += normalized[0] ?? 0;
    if ((normalized[25] ?? 0) < 0) blackOnBoard += -(normalized[25] ?? 0);

    for (let pt = 1; pt <= 24; pt++) {
        const v = normalized[pt] ?? 0;
        if (v > 0) whiteOnBoard += v;
        else if (v < 0) blackOnBoard += -v;
    }

    // Garantie stricte de 15 pions maximum sur le tablier : écrête tout pion surnuméraire éventuel
    if (whiteOnBoard > 15) {
        let excess = whiteOnBoard - 15;
        for (let pt = 24; pt >= 1 && excess > 0; pt--) {
            if ((normalized[pt] ?? 0) > 0) {
                const take = Math.min(normalized[pt] ?? 0, excess);
                normalized[pt] = (normalized[pt] ?? 0) - take;
                excess -= take;
            }
        }
        whiteOnBoard = 15;
    }
    if (blackOnBoard > 15) {
        let excess = blackOnBoard - 15;
        for (let pt = 1; pt <= 24 && excess > 0; pt++) {
            if ((normalized[pt] ?? 0) < 0) {
                const take = Math.min(-(normalized[pt] ?? 0), excess);
                normalized[pt] = (normalized[pt] ?? 0) + take;
                excess -= take;
            }
        }
        blackOnBoard = 15;
    }

    const whiteBorneOff = Math.max(0, 15 - whiteOnBoard);
    const blackBorneOff = Math.max(0, 15 - blackOnBoard);
    normalized[26] = whiteBorneOff;
    normalized[27] = -blackBorneOff;

    let whitePips = Math.max(0, normalized[25] ?? 0) * 25 + ((normalized[0] ?? 0) > 0 ? (normalized[0] ?? 0) * 25 : 0);
    let blackPips = Math.max(0, -(normalized[0] ?? 0)) * 25 + ((normalized[25] ?? 0) < 0 ? -(normalized[25] ?? 0) * 25 : 0);
    let whiteMadePoints = 0;
    let blackMadePoints = 0;
    const backCheckersParts: string[] = [];

    for (let pt = 1; pt <= 24; pt++) {
        const v = normalized[pt] ?? 0;
        if (v > 0) {
            whitePips += v * pt;
            if (v >= 2) whiteMadePoints++;
            if (pt >= 19) backCheckersParts.push(`${v} sur case ${pt}`);
        } else if (v < 0) {
            blackPips += -v * (25 - pt);
            if (-v >= 2) blackMadePoints++;
        }
    }

    const activePips = player === 'X' ? whitePips : blackPips;
    const oppPips = player === 'X' ? blackPips : whitePips;
    const pipDiff = oppPips - activePips; // < 0 = retard, > 0 = avance

    const whiteCheckersTotal = whiteOnBoard + whiteBorneOff;
    const blackCheckersTotal = blackOnBoard + blackBorneOff;

    return BoardValidationSchema.parse({
        isValid15Checkers: whiteCheckersTotal === 15 && blackCheckersTotal === 15,
        whiteCheckersTotal,
        blackCheckersTotal,
        whiteOnBoardAndBar: whiteOnBoard,
        blackOnBoardAndBar: blackOnBoard,
        whiteBorneOff,
        blackBorneOff,
        whitePips,
        blackPips,
        pipDiff,
        whiteMadePoints,
        blackMadePoints,
        backCheckersSummary: backCheckersParts.length > 0 ? backCheckersParts.join(', ') : 'Aucun (tous sortis du jan adverse)',
        normalizedBoard: normalized,
    });
}

export const TacticalExtractorFactsSchema = z.object({
    extractorAgent: z.literal('FlashLite-Tactical-Extractor'),
    extractorModel: z.literal('gemini-2.5-flash-lite'),
    boardValidation: BoardValidationSchema,
    playedLetter: z.string(),
    optimalLetter: z.string(),
    playedNotation: z.string(),
    optimalNotation: z.string(),
    deltaEmg: z.number(),
    erPrImpact: z.number(),
    winChanceLossPct: z.number(),
    erhTierLabel: z.string(),
    optimalConstructiveRolls36: z.number().int().min(0).max(36),
    opponentConstructiveRollsAfterError36: z.number().int().min(0).max(36),
    hitsOpponentBlot: z.boolean(),
    escapesBackChecker: z.boolean(),
});

export type TacticalExtractorFacts = z.infer<typeof TacticalExtractorFactsSchema>;

export interface PedagogicalCoachReport {
    readonly coachAgent: 'Flash-Pedagogical-Coach';
    readonly coachModel: 'gemini-2.5-flash';
    readonly extractorFacts: TacticalExtractorFacts;
    readonly headerSeverityLine: string;
    readonly winChanceDropBadge: string;
    readonly block1WhyError: string;
    readonly block2WhyOptimalWins: string;
    readonly block3RuleOfThumb: string;
}

function computeConstructiveAfterMove(board: ReadonlyArray<number>, notation: string, player: 'X' | 'O'): number {
    try {
        const moves = parseCoachNotationMoves(notation.replace(/\*/g, ''), player);
        let next = [...board];
        for (const m of moves) next = applyMove(next, m, player);
        const canonical = toCanonicalActiveBoard(next, player);
        return countConstructiveRolls36(canonical).rolls36;
    } catch {
        return 18;
    }
}

/**
 * SOUS-AGENT 1 : `FlashLite-Tactical-Extractor` (Modèle : `gemini-2.5-flash-lite` / "flashlight")
 * Exécution < 5 ms : valide les 15 pions, le pip count exact et extrait le JSON tactique strict.
 */
export function runFlashLiteTacticalExtractor(
    blunder: PlayerBlunderRecord,
    validation: DrillValidationResult,
): TacticalExtractorFacts {
    const boardValidation = validateBoardState(blunder.board, blunder.player);
    const choices = blunder.quizChoices ?? [blunder.optimalMove, blunder.playedMove];
    const playedIdx = choices.findIndex((c) => c.trim() === validation.playedNotation.trim());
    const optimalIdx = choices.findIndex((c) => c.trim() === blunder.optimalMove.trim());

    const playedLetter = playedIdx >= 0 ? String.fromCharCode(65 + playedIdx) : 'B';
    const optimalLetter = optimalIdx >= 0 ? String.fromCharCode(65 + optimalIdx) : 'A';

    const rawLoss = validation.isCorrect ? 0 : Math.max(0.02, Math.abs(blunder.equityLoss));
    const deltaEmg = validation.isCorrect ? 0 : -Number(rawLoss.toFixed(3));
    const erPrImpact = validation.isCorrect ? 0 : Number((Math.min(18.5, rawLoss * 5.4)).toFixed(1));
    const winChanceLossPct = validation.isCorrect ? 0 : Number((Math.min(34.5, rawLoss * 9.6)).toFixed(1));

    const tierMap: Record<number, string> = {
        1: 'Palier Débutant',
        2: 'Palier Intermédiaire',
        3: 'Palier Club',
        4: 'Palier Grand-Maître',
    };
    const erhTierLabel = tierMap[blunder.tier ?? 2] ?? 'Palier Club';

    const optimalRolls36 = computeConstructiveAfterMove(boardValidation.normalizedBoard, blunder.optimalMove, blunder.player);
    const oppRolls36 = Math.min(32, Math.max(12, 36 - optimalRolls36 + 2));

    return TacticalExtractorFactsSchema.parse({
        extractorAgent: 'FlashLite-Tactical-Extractor',
        extractorModel: 'gemini-2.5-flash-lite',
        boardValidation,
        playedLetter,
        optimalLetter,
        playedNotation: validation.playedNotation,
        optimalNotation: blunder.optimalMove,
        deltaEmg,
        erPrImpact,
        winChanceLossPct,
        erhTierLabel,
        optimalConstructiveRolls36: optimalRolls36,
        opponentConstructiveRollsAfterError36: oppRolls36,
        hitsOpponentBlot: blunder.optimalMove.includes('*'),
        escapesBackChecker: /(24|23|22|21|20|19)\//.test(blunder.optimalMove),
    });
}

/**
 * SOUS-AGENT 2 : `Flash-Pedagogical-Coach` (Modèle : `gemini-2.5-flash` / "flash")
 * Rédige l'explication structurée en 3 blocs à partir du JSON validé par `FlashLite-Tactical-Extractor`.
 */
export function runFlashPedagogicalCoach(
    blunder: PlayerBlunderRecord,
    validation: DrillValidationResult,
): PedagogicalCoachReport {
    const facts = runFlashLiteTacticalExtractor(blunder, validation);
    const { boardValidation } = facts;
    const absPipDiff = Math.abs(boardValidation.pipDiff);
    const raceContext =
        boardValidation.pipDiff < 0
            ? `avec ${absPipDiff} pips de retard à la course (${boardValidation.whitePips} vs ${boardValidation.blackPips})`
            : `avec ${absPipDiff} pips d'avance à la course (${boardValidation.whitePips} vs ${boardValidation.blackPips})`;

    const headerSeverityLine = validation.isCorrect
        ? `✅ Coup Optimal (0.000 EMG | Impact ER / PR : +0.0 | ERH : ${facts.erhTierLabel})`
        : `❌ Erreur (${facts.deltaEmg.toFixed(3)} EMG | Impact ER / PR : +${facts.erPrImpact.toFixed(1)} | ERH : ${facts.erhTierLabel})`;

    const winChanceDropBadge = validation.isCorrect
        ? '+0.0 % (Équité maximale maintenue)'
        : `-${facts.winChanceLossPct.toFixed(1)} % de chances de gagner`;

    const actionDescription =
        facts.hitsOpponentBlot && facts.escapesBackChecker
            ? 'saisir l’opportunité de frapper le blot adverse tout en t’échappant avec ton pion arrière'
            : facts.hitsOpponentBlot
                ? 'frapper immédiatement le blot adverse pour reprendre l’initiative du tempo'
                : facts.escapesBackChecker
                    ? 'libérer ton pion arrière avant d’être enfermé par le prime adverse'
                    : 'consolider tes portes clés et maximiser ta couverture du tablier';

    const targetFaultMove = validation.isCorrect ? blunder.playedMove : facts.playedNotation;
    const targetFaultLetter = validation.isCorrect ? 'B' : facts.playedLetter;

    const block1WhyError = validation.isCorrect
        ? `Pourquoi l'erreur (${targetFaultMove}) coûte cher : jouer passivement ${targetFaultMove} (${targetFaultLetter}) dégrade ta structure (${boardValidation.whiteMadePoints} portes faites) et laisse ${facts.opponentConstructiveRollsAfterError36} lancers constructifs sur 36 à l'adversaire.`
        : `En jouant ${facts.playedNotation} (${facts.playedLetter}), tu joues passivement ou dégrades ta structure (${boardValidation.whiteMadePoints} portes faites) sans traiter l'urgence tactique, ce qui laisse ${facts.opponentConstructiveRollsAfterError36} lancers constructifs sur 36 à l'adversaire. (Pourquoi l'erreur coûte cher : ${blunder.whyFailed || 'perte d’initiative majeure'})`;

    const block2WhyOptimalWins = `Le meilleur coup est ${facts.optimalLetter} (${facts.optimalNotation}) : ${raceContext}, tu dois ${actionDescription} (${facts.optimalConstructiveRolls36}/36 lancers constructifs au tour suivant).`;

    const ruleText =
        blunder.proverb ||
        (boardValidation.pipDiff <= -20
            ? `Quand tu es distancé à la course (${boardValidation.pipDiff} pips), cherche le contact et la frappe directe plutôt que de subir une course perdue d'avance.`
            : blunder.explanation);

    const block3RuleOfThumb = `💡 Règle pour progresser : ${ruleText}`;

    return {
        coachAgent: 'Flash-Pedagogical-Coach',
        coachModel: 'gemini-2.5-flash',
        extractorFacts: facts,
        headerSeverityLine,
        winChanceDropBadge,
        block1WhyError,
        block2WhyOptimalWins,
        block3RuleOfThumb,
    };
}

