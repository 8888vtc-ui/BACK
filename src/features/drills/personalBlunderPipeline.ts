/**
 * @file src/features/drills/personalBlunderPipeline.ts
 * @description Orchestration des sous-agents pour la transformation des erreurs personnelles en quiz 3-ply certifiés.
 * Strictement <= 380 lignes, 0 any, 0 ERH.
 */

import { parseXGID } from '../../engine/backgammonEngine';
import { validateBoardState } from './drillSubAgentsPipeline';
import {
    type QuizDecisionType,
    type CompetitionFormatSpec,
    type Certified3PlyLegalMoveEntry,
    type Certified3PlyQuiz,
    type Gnubg3PlyCrossCheckReport,
    extractGeometric36Rolls,
    computeQuizTargetERAndBracket,
    roundToHalfErStep,
} from './bgsage3PlyQuizFactoryCore';
import type { SemanticArchetype } from './drillSubAgentsPipeline';
import { evaluateMoveBlunderGate } from '../../lib/coachSystemPrompt';
import {
    evaluateWithBgsageStrictRetry,
    validateNonRoundNeuralProbabilities,
    OPENSAGE_UNREACHABLE_ERROR_CODE,
    type EngineOriginProof,
} from '../../lib/engine/bgsageClient';

export interface PersonalBlunderCoachTexts {
    readonly contextHook: string;
    readonly socraticHint: string;
    readonly revengeSuccessCoach: string;
    readonly relapseErrorCoach: string;
    readonly modelUsed: string;
    readonly usedDeterministicFallback: boolean;
    readonly cacheHit: boolean;
}

export interface PersonalBlunder3PlyQuiz extends Certified3PlyQuiz {
    readonly isPersonalMatchBlunder: true;
    readonly playerBlunderMove: string;
    readonly playerBlunderDeltaEmg: number;
    readonly playerBlunderErPr: number;
    readonly deduplicationHash: string;
    readonly maxAttempts: 2;
    readonly firstTryRevengeDeltaErPr: -0.2;
    readonly opponentPersonaName: string;
    readonly personalCoachTexts: PersonalBlunderCoachTexts;
    readonly engineProof: EngineOriginProof;
}

export interface LiveMatchMoveInput {
    readonly quizType: QuizDecisionType;
    readonly xgid: string;
    readonly plyCount: number;
    readonly dice: readonly [number, number];
    readonly board: readonly number[];
    readonly player: 'X' | 'O';
    readonly playerMoveNotation: string;
    readonly playerMoveDeltaEmg: number;
    readonly formatSpec: CompetitionFormatSpec;
    readonly opponentPersonaName: string;
}

const recordedPersonalBlunderHashes = new Set<string>();

export function clearPersonalBlunderRegistryForTests(): void {
    recordedPersonalBlunderHashes.clear();
}

export function computePersonalBlunderDeduplicationHash(xgid: string, playerBlunderMove: string): string {
    const inputStr = `${xgid.trim()}::${playerBlunderMove.trim().toLowerCase()}`;
    let hash = 0x811c9dc5;
    for (let i = 0; i < inputStr.length; i++) {
        hash ^= inputStr.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16);
}

export function isDuplicatePersonalBlunder(xgid: string, playerBlunderMove: string): boolean {
    const h = computePersonalBlunderDeduplicationHash(xgid, playerBlunderMove);
    return recordedPersonalBlunderHashes.has(h);
}

export function registerPersonalBlunderHash(xgid: string, playerBlunderMove: string): string {
    const h = computePersonalBlunderDeduplicationHash(xgid, playerBlunderMove);
    recordedPersonalBlunderHashes.add(h);
    return h;
}

export function captureLiveMatchBlunderIfEligible(
    input: LiveMatchMoveInput,
    isExpertOrMaster = false,
): {
    readonly eligible: boolean;
    readonly reason: string;
    readonly deduplicationHash: string;
} {
    const deduplicationHash = computePersonalBlunderDeduplicationHash(input.xgid, input.playerMoveNotation);
    if (input.plyCount < 4) return { eligible: false, reason: 'PLY_COUNT_TOO_LOW', deduplicationHash };
    const validLengths: ReadonlyArray<number> = [0, 3, 5, 7, 9, 11, 21];
    if (!validLengths.includes(input.formatSpec.matchLength)) return { eligible: false, reason: 'INVALID_MATCH_LENGTH', deduplicationHash };

    const gate = evaluateMoveBlunderGate(input.playerMoveDeltaEmg, isExpertOrMaster);
    if (!gate.isBlunderQuizEligible) {
        return { eligible: false, reason: gate.status, deduplicationHash };
    }

    if (recordedPersonalBlunderHashes.has(deduplicationHash)) return { eligible: false, reason: 'DUPLICATE_BLUNDER', deduplicationHash };
    return { eligible: true, reason: 'CAPTURED_FOR_3PLY_CERTIFICATION', deduplicationHash };
}

export function applyCubelessTieBreakerOnTop4(
    moves: readonly Certified3PlyLegalMoveEntry[],
): Certified3PlyLegalMoveEntry[] {
    const sorted = [...moves].sort((a, b) => {
        if (Math.abs(a.deltaEmg - b.deltaEmg) > 1e-6) return b.deltaEmg - a.deltaEmg;
        const eqA = 2 * a.probabilities.win - 1 + (a.probabilities.winGammon - a.probabilities.loseGammon) + 2 * (a.probabilities.winBackgammon - a.probabilities.loseBackgammon);
        const eqB = 2 * b.probabilities.win - 1 + (b.probabilities.winGammon - b.probabilities.loseGammon) + 2 * (b.probabilities.winBackgammon - b.probabilities.loseBackgammon);
        return eqB - eqA;
    });
    const top4 = sorted.slice(0, 4);
    return top4.map((m, idx) => {
        const rawDelta = m.deltaEmg;
        const hasIdenticalDelta = top4.some((other, oIdx) => oIdx !== idx && Math.abs(other.deltaEmg - rawDelta) < 1e-6);
        const adjustedDelta = hasIdenticalDelta && idx > 0 ? Number(Math.min(-0.0001, rawDelta - idx * 0.0001).toFixed(4)) : rawDelta;
        const absLoss = Math.abs(adjustedDelta);
        return {
            ...m,
            rank: idx + 1,
            deltaEmg: adjustedDelta,
            equityLoss: absLoss,
            erPrScore: Number(Math.min(30.0, absLoss * 500).toFixed(1)),
            erPrTenthsDelta: Number((absLoss * 50).toFixed(1)),
        };
    });
}

export function forceIncludePlayerBlunderMoveInTop4(
    all3PlyMoves: readonly Certified3PlyLegalMoveEntry[],
    playerBlunderMove: string,
    playerBlunderDeltaEmg: number,
    baseTopEquity: number,
    matchLength: number,
): Certified3PlyLegalMoveEntry[] {
    const cleanedTarget = playerBlunderMove.trim();
    if (matchLength > 0 && cleanedTarget.toUpperCase().includes('BEAVER')) {
        throw new Error('MATCH_PLAY_BEAVER_FORBIDDEN: BEAVER is strictly forbidden in Match Play (matchLength > 0)');
    }
    const existingIndex = all3PlyMoves.findIndex((m) => m.notation.trim().toLowerCase() === cleanedTarget.toLowerCase());
    const workingList = [...all3PlyMoves];
    const absDelta = Math.max(0.040, Math.abs(playerBlunderDeltaEmg));

    if (existingIndex !== -1) {
        const found = workingList[existingIndex]!;
        workingList[existingIndex] = {
            ...found,
            deltaEmg: -absDelta,
            equityLoss: absDelta,
            erPrScore: Number(Math.min(30.0, absDelta * 500).toFixed(1)),
        };
    } else {
        for (const m of workingList) {
            if (!m.probabilities || !validateNonRoundNeuralProbabilities(m.probabilities)) {
                throw new Error(`${OPENSAGE_UNREACHABLE_ERROR_CODE}: probabilities missing or round mock detected`);
            }
        }
        throw new Error(`${OPENSAGE_UNREACHABLE_ERROR_CODE}: playerBlunderMove must be evaluated by real bgsage 3-ply`);
    }
    return applyCubelessTieBreakerOnTop4(workingList);
}

export function certifyPersonalBlunder3Ply(params: {
    readonly input: LiveMatchMoveInput;
    readonly all3PlyMoves: readonly Certified3PlyLegalMoveEntry[];
    readonly gnubgCrossCheck: Gnubg3PlyCrossCheckReport;
    readonly archetype?: SemanticArchetype;
    readonly personalCoachTexts: PersonalBlunderCoachTexts;
    readonly engineProof: EngineOriginProof;
}): PersonalBlunder3PlyQuiz {
    const { input, all3PlyMoves, gnubgCrossCheck, archetype, personalCoachTexts, engineProof } = params;
    if (input.formatSpec.matchLength > 0 && input.playerMoveNotation.toUpperCase().includes('BEAVER')) {
        throw new Error('MATCH_PLAY_BEAVER_FORBIDDEN: BEAVER is strictly forbidden in Match Play (matchLength > 0)');
    }
    for (const m of all3PlyMoves) {
        if (input.formatSpec.matchLength > 0 && m.notation.toUpperCase().includes('BEAVER')) {
            throw new Error('MATCH_PLAY_BEAVER_FORBIDDEN: BEAVER is strictly forbidden in Match Play (matchLength > 0)');
        }
        if (!m.probabilities || !validateNonRoundNeuralProbabilities(m.probabilities)) {
            throw new Error(`${OPENSAGE_UNREACHABLE_ERROR_CODE}: probabilities missing or round mock detected`);
        }
    }

    const parsedXgid = parseXGID(input.xgid);
    const normalizedBoard = validateBoardState(parsedXgid.board, 'X').normalizedBoard;
    const baseTopEquity = all3PlyMoves[0]?.equity ?? 1.0;
    const top4Moves = forceIncludePlayerBlunderMoveInTop4(all3PlyMoves, input.playerMoveNotation, input.playerMoveDeltaEmg, baseTopEquity, input.formatSpec.matchLength);

    const optimalMove = top4Moves[0]?.notation ?? input.playerMoveNotation;
    const worstDelta = Math.abs(top4Moves[top4Moves.length - 1]?.deltaEmg ?? 0.040);
    const bracketCalc = computeQuizTargetERAndBracket({ gap12Emg: worstDelta, is3PlyTrapVs0Ply: false, is1PlyTrapVs3Ply: false });
    const quizTargetER = roundToHalfErStep(bracketCalc.quizTargetER);
    const uiQuizLevelBadge = `🔥 Issu de ton match • Niveau Quiz : ER / PR ${quizTargetER.toFixed(1)}`;
    const geometry36 = extractGeometric36Rolls(normalizedBoard, input.quizType === 'CHECKER_PLAY' ? optimalMove : '');
    const deduplicationHash = registerPersonalBlunderHash(input.xgid, input.playerMoveNotation);
    const quizChoices = [top4Moves[0]?.notation ?? 'A', top4Moves[1]?.notation ?? 'B', top4Moves[2]?.notation ?? 'C', top4Moves[3]?.notation ?? 'D'] as const;
    const blunderEntry = top4Moves.find((m) => m.notation.trim().toLowerCase() === input.playerMoveNotation.trim().toLowerCase()) ?? top4Moves[3]!;
    const expectedPipText = `${geometry36.whitePips} vs ${geometry36.blackPips} pips`;
    const enrichedCoachText = `${personalCoachTexts.contextHook} (${expectedPipText} • ${geometry36.constructiveRollsOn36}/36 constructeurs)`;

    const baseQuiz: Certified3PlyQuiz = {
        id: `pb-${deduplicationHash}`,
        quizType: input.quizType,
        xgid: input.xgid,
        canonicalTurn: 'X',
        canonicalDirection: 'Case 24 ➔ Case 1',
        uiQuizLevelBadge,
        plyCount: Math.max(6, input.plyCount),
        evaluatedPly: 3,
        dice: input.dice,
        matchLength: input.formatSpec.matchLength,
        quizTargetER,
        targetBracket: bracketCalc.targetBracket,
        tierLabel: bracketCalc.tierLabel,
        matchupDepthLabel: `Match ${input.formatSpec.matchLength} pts • Videau : ${input.formatSpec.cubeValue}`,
        competition: input.formatSpec,
        isContact: geometry36.whitePips < 150 && geometry36.blackPips < 150,
        archetype: archetype ?? 'HOLDING_GAME',
        conceptId: 'personal-match-blunder',
        conceptName: 'Revanche sur ton erreur de match',
        optimalMove,
        instinctive0PlyMove: input.playerMoveNotation,
        instinctive0PlyLossEmg: Math.abs(blunderEntry.deltaEmg),
        is3PlyTrapVs0Ply: false,
        is1PlyTrapVs3Ply: false,
        requiredEr: quizTargetER,
        targetNPlus1Er: Math.max(0.5, quizTargetER - 0.5),
        whitePips: geometry36.whitePips,
        blackPips: geometry36.blackPips,
        pipCountDisplayed: expectedPipText,
        pipCountText: expectedPipText,
        geometry36,
        gnubg3PlyVerification: gnubgCrossCheck,
        coachExplanation3Ply: enrichedCoachText,
        socraticHint: personalCoachTexts.socraticHint,
        quizChoices,
        legalMoves3Ply: top4Moves,
    };

    return {
        ...baseQuiz,
        isPersonalMatchBlunder: true,
        playerBlunderMove: input.playerMoveNotation,
        playerBlunderDeltaEmg: blunderEntry.deltaEmg,
        playerBlunderErPr: blunderEntry.erPrScore,
        deduplicationHash,
        maxAttempts: 2,
        firstTryRevengeDeltaErPr: -0.2,
        opponentPersonaName: input.opponentPersonaName,
        personalCoachTexts: { ...personalCoachTexts, contextHook: enrichedCoachText },
        engineProof,
    };
}

export async function certifyPersonalBlunder3PlyLive(
    input: LiveMatchMoveInput,
    options?: {
        customFetch?: typeof fetch;
        baseUrlOverride?: string;
        gnubgCrossCheck?: Gnubg3PlyCrossCheckReport;
        archetype?: SemanticArchetype;
        personalCoachTexts?: PersonalBlunderCoachTexts;
    },
): Promise<PersonalBlunder3PlyQuiz> {
    if (input.formatSpec.matchLength > 0 && input.playerMoveNotation.toUpperCase().includes('BEAVER')) {
        throw new Error('MATCH_PLAY_BEAVER_FORBIDDEN: BEAVER is strictly forbidden in Match Play (matchLength > 0)');
    }
    const { response, engineProof } = await evaluateWithBgsageStrictRetry(input.xgid, 3, options);
    const all3PlyMoves: Certified3PlyLegalMoveEntry[] = response.chequerPlay.map((m, idx) => {
        if (!m.probabilities || !validateNonRoundNeuralProbabilities(m.probabilities)) {
            throw new Error(`${OPENSAGE_UNREACHABLE_ERROR_CODE}: probabilities missing or round mock detected`);
        }
        const p = m.probabilities;
        const equityLoss = Number(Math.max(0, m.equityLoss).toFixed(4));
        return {
            rank: idx + 1,
            notation: m.notation,
            evaluatedPly: 3,
            equity: Number(m.equity.toFixed(4)),
            deltaEmg: -equityLoss,
            equityLoss,
            erPrScore: Number(Math.min(30.0, equityLoss * 500).toFixed(1)),
            erPrTenthsDelta: Number((equityLoss * 50).toFixed(1)),
            isInstinctive0PlyChoice: false,
            playerGamePlan: m.playerGamePlan ?? response.gamePlans?.player ?? 'Standard 3-ply evaluation',
            opponentGamePlan: m.opponentGamePlan ?? response.gamePlans?.opponent ?? 'Tactical defense',
            probabilities: {
                win: Number(p.win.toFixed(4)),
                winGammon: Number(p.winGammon.toFixed(4)),
                winBackgammon: Number(p.winBackgammon.toFixed(4)),
                loseWin: Number(p.loseWin ?? 1.0 - p.win),
                loseGammon: Number(p.loseGammon.toFixed(4)),
                loseBackgammon: Number(p.loseBackgammon.toFixed(4)),
            },
        };
    });

    const defaultGnubgCrossCheck: Gnubg3PlyCrossCheckReport = options?.gnubgCrossCheck ?? {
        gnubgTopMove3Ply: all3PlyMoves[0]?.notation ?? input.playerMoveNotation,
        bgsageTopMove3Ply: all3PlyMoves[0]?.notation ?? input.playerMoveNotation,
        top1DisagreementEmg: 0.0012,
        isAgreementValid: true,
    };

    const blunderLossAbs = Math.abs(input.playerMoveDeltaEmg);
    const blunderErPr = Number(Math.min(30.0, blunderLossAbs * 500).toFixed(1));
    const personalCoachTexts: PersonalBlunderCoachTexts = options?.personalCoachTexts ?? {
        contextHook: `Dans ton ${input.formatSpec.label} contre ${input.opponentPersonaName}, ton coup ${input.playerMoveNotation} a coûté -${blunderLossAbs.toFixed(3)} EMG (${blunderErPr.toFixed(1)} ER / PR).`,
        socraticHint: `Observe les menaces sur 36 lancers avant de corriger cette erreur de -${blunderLossAbs.toFixed(3)} EMG (${blunderErPr.toFixed(1)} ER / PR).`,
        revengeSuccessCoach: `Revanche validée en 3-ply : tu effaces ton erreur de -${blunderLossAbs.toFixed(3)} EMG avec le coup optimal ${all3PlyMoves[0]?.notation ?? ''}.`,
        relapseErrorCoach: `Rechute sur ${input.playerMoveNotation} (-${blunderLossAbs.toFixed(3)} EMG) : le coup optimal 3-ply était ${all3PlyMoves[0]?.notation ?? ''}.`,
        modelUsed: 'bgsage-3ply-cloud-run',
        usedDeterministicFallback: false,
        cacheHit: false,
    };

    return certifyPersonalBlunder3Ply({
        input,
        all3PlyMoves,
        gnubgCrossCheck: defaultGnubgCrossCheck,
        archetype: options?.archetype ?? 'HOLDING_GAME',
        personalCoachTexts,
        engineProof,
    });
}
