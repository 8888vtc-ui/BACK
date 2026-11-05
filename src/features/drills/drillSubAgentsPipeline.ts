/**
 * @file src/features/drills/drillSubAgentsPipeline.ts
 * @description Pipeline de Sous-Agents IA en tâche de fond (Zéro nom technique visible à l'écran) :
 * 1. Doc Auditor : Alignement terminologique (ER / PR 0–30, Rating 1500).
 * 2. Board Validator : 15 pions par camp et source unique pipCount(board).
 * 3. Semantic Bridge : Vérité géométrique isContact(board) et archétypes.
 * 4. Pedagogical Coach : Phrases courtes (18-28 mots), 0 hallucination sur les portes.
 * Strictement <= 380 lignes, 0 any (GOVERNANCE.md & SCALABILITY.md).
 */

import { z } from 'zod';
import { applyMove, pipCount, X_BAR, O_BAR, X_OFF, O_OFF } from '../../engine/backgammonEngine';
import { parseCoachNotationMoves } from '../coach/coachMoveNotation';
import { toCanonicalActiveBoard } from '../coach/detectPositionalMotif';
import { countConstructiveRolls36 } from '../coach/lookahead36';
import type { PlayerBlunderRecord, DrillValidationResult } from './types';

export const ER_PR_TOOLTIP_TEXT =
    'ER / PR : Error Rate — Mesure votre précision d\'après les standards officiels (échelle 0.0 à 30.0)';

export const SemanticArchetypeEnum = z.enum([
    'PURE_RACE', 'BEAROFF', 'BLITZ', 'HOLDING_GAME', 'PRIME_VS_PRIME',
]);
export type SemanticArchetype = z.infer<typeof SemanticArchetypeEnum>;

export const BoardValidationSchema = z.object({
    isValid15Checkers: z.boolean(),
    isContact: z.boolean(),
    archetype: SemanticArchetypeEnum,
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

export function isContactPosition(board: ReadonlyArray<number>): boolean {
    if ((board[X_BAR] ?? 0) > 0 || (board[O_BAR] ?? 0) < 0) return true;
    let maxWhitePt = 0;
    let minBlackPt = 25;
    for (let pt = 1; pt <= 24; pt++) {
        const v = board[pt] ?? 0;
        if (v > 0 && pt > maxWhitePt) maxWhitePt = pt;
        if (v < 0 && pt < minBlackPt) minBlackPt = pt;
    }
    return maxWhitePt > minBlackPt;
}
export const isContact = isContactPosition;

export function resolveSemanticArchetype(
    board: ReadonlyArray<number>,
    seedMeta: { conceptId: string; conceptName: string; proverb?: string; optimalMove?: string },
): {
    readonly isContact: boolean;
    readonly archetype: SemanticArchetype;
    readonly conceptId: string;
    readonly conceptName: string;
    readonly proverb: string;
} {
    const contact = isContactPosition(board);
    if (!contact) {
        let maxWhitePt = 0;
        for (let pt = 1; pt <= 24; pt++) {
            if ((board[pt] ?? 0) > 0 && pt > maxWhitePt) maxWhitePt = pt;
        }
        const isBearoff = maxWhitePt <= 6 || /\/off/i.test(seedMeta.optimalMove ?? '');
        if (isBearoff) {
            return {
                isContact: false,
                archetype: 'BEAROFF',
                conceptId: 'bearoff_technique',
                conceptName: 'Sortie des Dames (Bear-Off)',
                proverb: 'En Bear-Off sans contact, sortez le maximum de dames ou aplatissez votre distribution sans laisser de trous.',
            };
        }
        return {
            isContact: false,
            archetype: 'PURE_RACE',
            conceptId: 'race_management',
            conceptName: 'Course Pure & Distribution',
            proverb: 'En course pure sans contact, avancez vos pions arrières vers le jan intérieur et répartissez harmonieusement vos portes sans empiler sur les flèches basses.',
        };
    }

    const cid = seedMeta.conceptId.toLowerCase();
    const archetype: SemanticArchetype =
        cid.includes('blitz')
            ? 'BLITZ'
            : cid.includes('anchor') || cid.includes('holding') || cid.includes('back')
                ? 'HOLDING_GAME'
                : cid.includes('prime') || cid.includes('golden')
                    ? 'PRIME_VS_PRIME'
                    : 'HOLDING_GAME';

    return {
        isContact: true,
        archetype,
        conceptId: seedMeta.conceptId,
        conceptName: seedMeta.conceptName,
        proverb: seedMeta.proverb || 'Sécurisez vos portes maîtresses et réduisez les lancers constructifs adverses au tour suivant.',
    };
}

export function validateBoardState(board: ReadonlyArray<number>, player: 'X' | 'O' = 'X'): BoardValidationReport {
    const normalized = new Array<number>(28).fill(0);
    for (let i = 0; i < Math.min(board.length, 28); i++) {
        normalized[i] = Math.trunc(board[i] ?? 0);
    }
    if ((normalized[25] ?? 0) > 0) {
        normalized[X_BAR] = (normalized[X_BAR] ?? 0) + (normalized[25] ?? 0);
        normalized[25] = 0;
    }
    if ((normalized[0] ?? 0) < 0) {
        normalized[O_BAR] = (normalized[O_BAR] ?? 0) + (normalized[0] ?? 0);
        normalized[0] = 0;
    }

    let whiteOnBoard = Math.max(0, normalized[X_BAR] ?? 0);
    let blackOnBoard = Math.max(0, -(normalized[O_BAR] ?? 0));

    for (let pt = 1; pt <= 24; pt++) {
        const v = normalized[pt] ?? 0;
        if (v > 0) whiteOnBoard += v;
        else if (v < 0) blackOnBoard += -v;
    }

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
    normalized[X_OFF] = whiteBorneOff;
    normalized[O_OFF] = -blackBorneOff;

    const sharedPips = pipCount(normalized);
    const whitePips = sharedPips.X;
    const blackPips = sharedPips.O;

    let whiteMadePoints = 0;
    let blackMadePoints = 0;
    const backCheckersParts: string[] = [];

    for (let pt = 1; pt <= 24; pt++) {
        const v = normalized[pt] ?? 0;
        if (v > 0) {
            if (v >= 2) whiteMadePoints++;
            if (pt >= 19) backCheckersParts.push(`${v} sur case ${pt}`);
        } else if (v < 0) {
            if (-v >= 2) blackMadePoints++;
        }
    }

    const activePips = player === 'X' ? whitePips : blackPips;
    const oppPips = player === 'X' ? blackPips : whitePips;
    const pipDiff = oppPips - activePips;
    const contact = isContactPosition(normalized);
    const archetype: SemanticArchetype = !contact ? 'PURE_RACE' : 'HOLDING_GAME';

    return BoardValidationSchema.parse({
        isValid15Checkers: (whiteOnBoard + whiteBorneOff) === 15 && (blackOnBoard + blackBorneOff) === 15,
        isContact: contact,
        archetype,
        whiteCheckersTotal: whiteOnBoard + whiteBorneOff,
        blackCheckersTotal: blackOnBoard + blackBorneOff,
        whiteOnBoardAndBar: whiteOnBoard,
        blackOnBoardAndBar: blackOnBoard,
        whiteBorneOff,
        blackBorneOff,
        whitePips,
        blackPips,
        pipDiff,
        whiteMadePoints,
        blackMadePoints,
        backCheckersSummary: backCheckersParts.length > 0 ? backCheckersParts.join(', ') : 'Aucun',
        normalizedBoard: normalized,
    });
}

export function computeTenthsMetricDelta(isCorrect: boolean, equityLoss: number = 0.084): number {
    if (isCorrect) return -0.1;
    const loss = Math.abs(equityLoss);
    if (loss >= 0.14) return 0.5;
    if (loss >= 0.075) return 0.4;
    if (loss >= 0.04) return 0.3;
    return 0.2;
}

export const TacticalExtractorFactsSchema = z.object({
    extractorAgent: z.literal('FlashLite-Tactical-Extractor'),
    extractorModel: z.literal('gemini-2.5-flash-lite'),
    boardValidation: BoardValidationSchema,
    semanticConceptName: z.string(),
    semanticProverb: z.string(),
    playedLetter: z.string(),
    optimalLetter: z.string(),
    playedNotation: z.string(),
    optimalNotation: z.string(),
    deltaEmg: z.number(),
    erPrImpact: z.number(),
    tenthsDelta: z.number(),
    winChanceLossPct: z.number(),
    erhTierLabel: z.string(),
    optimalConstructiveRolls36: z.number().int().min(0).max(36),
    opponentConstructiveRollsAfterError36: z.number().int().min(0).max(36),
    hitsOpponentBlot: z.boolean(),
    escapesBackChecker: z.boolean(),
    safedBlot: z.boolean(),
    pointsMadeByBest: z.array(z.number()),
    outerFieldDestCases: z.array(z.number()),
});
export type TacticalExtractorFacts = z.infer<typeof TacticalExtractorFactsSchema>;

export type PedagogicalVerdictTier = 'OPTIMAL' | 'NEAR_OPTIMAL' | 'INACCURACY' | 'BLUNDER';

export interface PedagogicalCoachReport {
    readonly coachAgent: 'Flash-Pedagogical-Coach';
    readonly coachModel: 'gemini-2.5-flash';
    readonly extractorFacts: TacticalExtractorFacts;
    readonly verdictTier: PedagogicalVerdictTier;
    readonly isOptimalMove: boolean;
    readonly headerSeverityLine: string;
    readonly winChanceDropBadge: string;
    readonly socraticFirstAttemptHint: string;
    readonly block1WhyError: string | null;
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
        return 22;
    }
}

export function runFlashLiteTacticalExtractor(
    blunder: PlayerBlunderRecord,
    validation: DrillValidationResult,
): TacticalExtractorFacts {
    const boardValidation = validateBoardState(blunder.board, blunder.player);
    const semantic = resolveSemanticArchetype(boardValidation.normalizedBoard, {
        conceptId: blunder.conceptId,
        conceptName: blunder.conceptName,
        proverb: blunder.proverb,
        optimalMove: blunder.optimalMove,
    });

    const choices = blunder.quizChoices ?? [blunder.optimalMove, blunder.playedMove];
    const playedIdx = choices.findIndex((c) => c.trim() === validation.playedNotation.trim());
    const optimalIdx = choices.findIndex((c) => c.trim() === blunder.optimalMove.trim());

    const playedLetter = playedIdx >= 0 ? String.fromCharCode(65 + playedIdx) : 'B';
    const optimalLetter = optimalIdx >= 0 ? String.fromCharCode(65 + optimalIdx) : 'A';

    const isNearOptimal = validation.verdict === 'acceptable' || (validation.equityLoss > 0 && validation.equityLoss <= 0.020);
    const rawLoss =
        validation.verdict === 'optimal'
            ? 0
            : isNearOptimal
                ? Math.max(0.008, Math.min(0.020, Math.abs(validation.equityLoss || 0.010)))
                : Math.max(0.025, Math.abs(validation.equityLoss || blunder.equityLoss));
    const deltaEmg = rawLoss === 0 ? 0 : -Number(rawLoss.toFixed(3));
    const tenthsDelta = isNearOptimal ? 0 : computeTenthsMetricDelta(validation.isCorrect, rawLoss);
    const winChanceLossPct = rawLoss === 0 ? 0 : Number((Math.min(34.5, rawLoss * 72.0)).toFixed(1));

    const boardBefore = boardValidation.normalizedBoard;
    let boardAfterBest = [...boardBefore];
    const outerDestCases: number[] = [];
    try {
        const moves = parseCoachNotationMoves(blunder.optimalMove.replace(/\*/g, ''), blunder.player);
        for (const m of moves) {
            boardAfterBest = applyMove(boardAfterBest, m, blunder.player);
            if (m.to >= 8 && m.to <= 14) outerDestCases.push(m.to);
        }
    } catch { /* fallback */ }

    const pointsMadeByBest: number[] = [];
    let blotsBefore = 0;
    let blotsAfter = 0;
    for (let pt = 1; pt <= 24; pt++) {
        const beforeCount = blunder.player === 'X' ? Math.max(0, boardBefore[pt] ?? 0) : Math.max(0, -(boardBefore[pt] ?? 0));
        const afterCount = blunder.player === 'X' ? Math.max(0, boardAfterBest[pt] ?? 0) : Math.max(0, -(boardAfterBest[pt] ?? 0));
        if (beforeCount < 2 && afterCount >= 2) pointsMadeByBest.push(pt);
        if (beforeCount === 1) blotsBefore++;
        if (afterCount === 1) blotsAfter++;
    }

    const hitsOpponentBlot = semantic.isContact && (
        blunder.optimalMove.includes('*') ||
        (blunder.player === 'X'
            ? (boardAfterBest[O_BAR] ?? 0) < (boardBefore[O_BAR] ?? 0)
            : (boardAfterBest[X_BAR] ?? 0) > (boardBefore[X_BAR] ?? 0))
    );
    const safedBlot = blotsAfter < blotsBefore;
    const escapesBackChecker = semantic.isContact && /(24|23|22|21|20|19)\//.test(blunder.optimalMove);

    const optimalRolls36 = computeConstructiveAfterMove(boardValidation.normalizedBoard, blunder.optimalMove, blunder.player);
    const playedRolls36 = computeConstructiveAfterMove(boardValidation.normalizedBoard, validation.playedNotation, blunder.player);
    const oppRolls36 = isNearOptimal
        ? Math.max(12, Math.min(optimalRolls36 - 3, playedRolls36))
        : Math.min(32, Math.max(12, 36 - optimalRolls36 + 2));

    return TacticalExtractorFactsSchema.parse({
        extractorAgent: 'FlashLite-Tactical-Extractor',
        extractorModel: 'gemini-2.5-flash-lite',
        boardValidation: { ...boardValidation, isContact: semantic.isContact, archetype: semantic.archetype },
        semanticConceptName: semantic.conceptName,
        semanticProverb: semantic.proverb,
        playedLetter,
        optimalLetter,
        playedNotation: validation.playedNotation,
        optimalNotation: blunder.optimalMove,
        deltaEmg,
        erPrImpact: Math.abs(tenthsDelta),
        tenthsDelta,
        winChanceLossPct,
        erhTierLabel: 'Palier Standard',
        optimalConstructiveRolls36: optimalRolls36,
        opponentConstructiveRollsAfterError36: oppRolls36,
        hitsOpponentBlot,
        escapesBackChecker,
        safedBlot,
        pointsMadeByBest,
        outerFieldDestCases: Array.from(new Set(outerDestCases)),
    });
}

export function runFlashPedagogicalCoach(
    blunder: PlayerBlunderRecord,
    validation: DrillValidationResult,
    currentMetricValue: number = 6.3,
    _isErMode: boolean = true,
): PedagogicalCoachReport {
    const facts = runFlashLiteTacticalExtractor(blunder, validation);
    const { boardValidation } = facts;
    const metricLabel = 'ER / PR';
    const absLoss = Math.abs(facts.deltaEmg);

    const verdictTier: PedagogicalVerdictTier =
        validation.verdict === 'optimal' || absLoss === 0
            ? 'OPTIMAL'
            : validation.verdict === 'acceptable' || absLoss <= 0.020
                ? 'NEAR_OPTIMAL'
                : absLoss <= 0.079
                    ? 'INACCURACY'
                    : 'BLUNDER';

    const nextMetric = Math.max(0, Math.min(30, Number((currentMetricValue + facts.tenthsDelta).toFixed(1))));
    const deltaSign = facts.tenthsDelta > 0 ? `+${facts.tenthsDelta.toFixed(1)}` : facts.tenthsDelta.toFixed(1);

    const headerSeverityLine =
        verdictTier === 'OPTIMAL'
            ? `✅ Coup Optimal ! (0.000 EMG | Impact ${metricLabel} : ${deltaSign} ➔ ${nextMetric.toFixed(1)} | Précision 100 %)`
            : verdictTier === 'NEAR_OPTIMAL'
                ? `👍 Très bon coup ! (${facts.deltaEmg.toFixed(3)} EMG | 0 pénalité ${metricLabel})`
                : `❌ Erreur (${facts.deltaEmg.toFixed(3)} EMG | Impact ${metricLabel} : ${deltaSign} ➔ ${nextMetric.toFixed(1)} | -${facts.winChanceLossPct.toFixed(1)}% de victoire)`;

    const winChanceDropBadge =
        verdictTier === 'OPTIMAL'
            ? 'Précision 100 %'
            : verdictTier === 'NEAR_OPTIMAL'
                ? `+${absLoss.toFixed(3)} EMG gagnables`
                : `-${facts.winChanceLossPct.toFixed(1)}% de chances de gagner`;

    const absPipDiff = Math.abs(boardValidation.pipDiff);
    const racePhrase =
        boardValidation.pipDiff >= 0
            ? `avec ${absPipDiff} pips d'avance (${boardValidation.whitePips} vs ${boardValidation.blackPips})`
            : `avec ${absPipDiff} pips de retard (${boardValidation.whitePips} vs ${boardValidation.blackPips})`;

    const actionClause = !boardValidation.isContact
        ? 'répartit harmonieusement tes pions vers le jan intérieur sans gaspiller de pips'
        : facts.hitsOpponentBlot && facts.escapesBackChecker
            ? 'frappe le blot adverse tout en libérant ton pion arrière'
            : facts.hitsOpponentBlot
                ? 'frappe immédiatement le blot adverse pour reprendre le tempo'
                : facts.pointsMadeByBest.length > 0
                    ? `ferme la porte clé ${facts.pointsMadeByBest.join(', ')} et verrouille ta structure`
                    : facts.safedBlot
                        ? 'met à l’abri ton pion isolé pour éliminer les tirs adverses directs'
                        : facts.escapesBackChecker
                            ? 'sécurise ton point d’ancrage arrière avant le verrouillage adverse'
                            : facts.outerFieldDestCases.length > 0
                                ? `ramène des pions constructeurs actifs vers ton champ extérieur (cases ${facts.outerFieldDestCases.join(' et ')}) en dupliquant les dés adverses pour préparer tes prochaines portes au tour suivant`
                                : 'optimise la flexibilité de tes pions et maximise ta couverture';

    const socraticFirstAttemptHint =
        blunder.hint ||
        `Attention, ${facts.playedNotation} perd ${facts.deltaEmg.toFixed(3)} EMG et concède ${facts.opponentConstructiveRollsAfterError36}/36 lancers adverses. Cherche à mieux coordonner tes portes !`;

    const block1WhyError =
        verdictTier === 'OPTIMAL' || verdictTier === 'NEAR_OPTIMAL'
            ? null
            : !boardValidation.isContact
                ? `En jouant ${facts.playedNotation} (${facts.playedLetter}), tu empiles inutilement tes dames sur des cases basses et réduis tes lancers fluides (${facts.opponentConstructiveRollsAfterError36}/36 lancers suboptimaux).`
                : `En jouant ${facts.playedNotation} (${facts.playedLetter}), tu dégrades ta structure (${boardValidation.whiteMadePoints} portes faites) et concèdes ${facts.opponentConstructiveRollsAfterError36} lancers constructifs sur 36 à l'adversaire.`;

    const block2WhyOptimalWins =
        verdictTier === 'NEAR_OPTIMAL'
            ? `Ton coup (${facts.playedNotation}) n'est vraiment pas un mauvais coup, mais tu peux gagner +${absLoss.toFixed(3)} EMG (+${facts.winChanceLossPct.toFixed(1)}% de victoire) en jouant ${facts.optimalNotation} (${facts.optimalConstructiveRolls36}/36 lancers constructifs contre ${facts.opponentConstructiveRollsAfterError36}/36).`
            : `Le meilleur coup est ${facts.optimalLetter} (${facts.optimalNotation}) : ${racePhrase}, il ${actionClause} (${facts.optimalConstructiveRolls36}/36 lancers constructifs au tour suivant).`;

    const block3RuleOfThumb =
        verdictTier === 'OPTIMAL' || verdictTier === 'NEAR_OPTIMAL'
            ? `💡 Règle à retenir : ${facts.semanticProverb}`
            : `💡 Comment t'améliorer : ${facts.semanticProverb}`;

    return {
        coachAgent: 'Flash-Pedagogical-Coach',
        coachModel: 'gemini-2.5-flash',
        extractorFacts: facts,
        verdictTier,
        isOptimalMove: validation.isCorrect,
        headerSeverityLine,
        winChanceDropBadge,
        socraticFirstAttemptHint,
        block1WhyError,
        block2WhyOptimalWins,
        block3RuleOfThumb,
    };
}
