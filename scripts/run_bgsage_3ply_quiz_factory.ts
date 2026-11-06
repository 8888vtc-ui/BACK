/**
 * @file scripts/run_bgsage_3ply_quiz_factory.ts
 * @description Usine de génération en tâche de fond des Quiz `ER / PR` (`TARGET_MAX_QUIZZES = 50000` :
 * 40 000 `CHECKER_PLAY` + 10 000 `CUBE_DECISION`) certifiés 100 % `3-ply` (`gnubg-cli 3-ply` + `bgsage 3-ply`)
 * au score exact du match, zéro formule inventée, notation exacte avec astérisques, mode Resume `${quizType}:${xgid}`
 * et support `--batch=N`. Strictement <= 400 lignes, 0 `any` (GOVERNANCE.md & SCALABILITY.md).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
    createInitialState,
    parseXGID,
    generateLegalMoves,
    applyMove,
    X_BAR,
    O_BAR,
    type MoveSequence,
    type Player,
} from '../src/engine/backgammonEngine';
import { resolveSemanticArchetype, validateBoardState } from '../src/features/drills/drillSubAgentsPipeline';
import {
    ALL_COMPETITION_FORMATS,
    TARGET_MAX_QUIZZES,
    TARGET_CHECKER_QUIZZES,
    TARGET_CUBE_QUIZZES,
    computeBoardSignatureAfterMove,
    extractGeometric36Rolls,
    buildDynamicCoachAndHint3Ply,
    computeQuizTargetERAndBracket,
    computeErPrForMove,
    formatUiQuizLevelBadge,
    validateSingleQuizStrict,
    buildCanonicalXgid,
    type CompetitionFormatSpec,
    type Certified3PlyLegalMoveEntry,
    type Certified3PlyQuiz,
} from '../src/features/drills/bgsage3PlyQuizFactoryCore';
import {
    callBgsageEvaluate,
    queryGnubgTopMovesAtPly,
    queryGnubgCube3Ply,
    verifyWithGnubg3Ply,
    normalizeNotationForCompare,
    type Gnubg3PlyMoveResult,
} from './bgsage_gnubg_3ply_bridge';

export { TARGET_MAX_QUIZZES, TARGET_CHECKER_QUIZZES, TARGET_CUBE_QUIZZES };

const FACTORY_JSONL_PATH = path.join(process.cwd(), 'data', 'quizzes', 'bgsage_3ply_er_factory.jsonl');
const FACTORY_SEED_PATH = path.join(process.cwd(), 'src', 'features', 'drills', 'bgsage3PlyFactorySeed.ts');

function extractBoardDiceKey(quizType: string, xgid: string): string {
    const parts = xgid.replace(/^XGID=/, '').split(':');
    return `${quizType}:${parts[0] ?? ''}:${parts[4] ?? '00'}`;
}

function syncFactorySeedFromJsonl(): void {
    if (!fs.existsSync(FACTORY_JSONL_PATH)) return;
    const lines = fs.readFileSync(FACTORY_JSONL_PATH, 'utf8').split(/\r?\n/).filter(Boolean).slice(0, 150);
    const seedSlice = lines.map((line) => {
        const q = JSON.parse(line) as Certified3PlyQuiz;
        const m2 = q.legalMoves3Ply[1]!;
        const loss = Number(Math.abs(m2.equityLoss).toFixed(4));
        const tier = q.targetBracket === 'DEBUTANT' ? 1 : q.targetBracket === 'CLUB' ? 2 : q.targetBracket === 'INTERMEDIAIRE' ? 3 : 4;
        return {
            id: q.id,
            tier,
            xgid: q.xgid,
            dice: q.dice,
            playedMove: q.instinctive0PlyMove,
            optimalMove: q.optimalMove,
            acceptableMoves: loss <= 0.02 ? [m2.notation] : [],
            quizChoices: q.quizChoices,
            equityLoss: loss,
            verdict: loss >= 0.08 ? 'blunder' : 'doubtful',
            conceptId: q.conceptId,
            conceptName: q.conceptName.replace(/[()]/g, ''),
            whyFailed: `${q.instinctive0PlyMove} concède ${loss.toFixed(3)} EMG en 3-ply (${q.pipCountText}).`,
            explanation: q.coachExplanation3Ply,
            proverb: 'Vérifiez toujours le compte de course et les 36 réponses adverses en 3-ply.',
            hint: q.socraticHint,
            commentaryVariants: [q.coachExplanation3Ply],
            quizTargetER: q.quizTargetER,
            quizType: q.quizType,
            plyCount: q.plyCount,
            candidateMoves3Ply: q.legalMoves3Ply.slice(0, 4).map((m) => ({
                rank: m.rank,
                notation: m.notation,
                equityLoss: m.equityLoss,
                win: m.probabilities.win,
                winGammon: m.probabilities.winGammon,
            })),
        };
    });
    const content = [
        '/**',
        ' * @file src/features/drills/bgsage3PlyFactorySeed.ts',
        ' * @description Seed généré depuis data/quizzes/bgsage_3ply_er_factory.jsonl (quiz 3-ply certifiés bgsage + gnubg).',
        ' * Strictement <= 400 lignes, 0 any, 0 PR invente, 0 ouverture (pips < 145, plyCount >= 6).',
        ' */',
        '',
        "import type { HarvestedSeedInput } from './benchmarkBlunders';",
        '',
        'export const BGSAGE_3PLY_FACTORY_SEED: readonly HarvestedSeedInput[] = [',
        ...seedSlice.map((s) => `    ${JSON.stringify(s)},`),
        '];',
        '',
    ].join('\n');
    fs.writeFileSync(FACTORY_SEED_PATH, content, 'utf8');
}

function toBgsageBoard26ForX(engineBoard: ReadonlyArray<number>, activeTurn: Player): number[] {
    const canonical = activeTurn === 'X' ? engineBoard : invertEngineBoard(engineBoard);
    const b26 = new Array<number>(26).fill(0);
    b26[0] = canonical[O_BAR] ?? 0;
    for (let p = 1; p <= 24; p++) {
        b26[p] = canonical[p] ?? 0;
    }
    b26[25] = canonical[X_BAR] ?? 0;
    return b26;
}

function invertEngineBoard(board: ReadonlyArray<number>): number[] {
    const inv = new Array<number>(26).fill(0);
    inv[X_BAR] = Math.abs(board[O_BAR] ?? 0);
    inv[O_BAR] = -Math.abs(board[X_BAR] ?? 0);
    for (let p = 1; p <= 24; p++) {
        inv[25 - p] = -(board[p] ?? 0);
    }
    return inv;
}

function scoreSimulatedMove(
    boardBefore: ReadonlyArray<number>,
    seq: MoveSequence,
    player: Player,
    styleMode: number,
): number {
    let next = [...boardBefore];
    let hits = 0;
    for (const step of seq.moves) {
        const destVal = next[step.to] ?? 0;
        if (step.to >= 1 && step.to <= 24 && ((player === 'X' && destVal === -1) || (player === 'O' && destVal === 1))) {
            hits++;
        }
        next = applyMove(next, step, player);
    }
    let madePoints = 0;
    let primeRun = 0;
    let maxPrime = 0;
    let blots = 0;
    let anchorScore = 0;
    for (let p = 1; p <= 24; p++) {
        const v = next[p] ?? 0;
        const ownCount = player === 'X' ? v : -v;
        if (ownCount >= 2) {
            madePoints++;
            primeRun++;
            if (primeRun > maxPrime) maxPrime = primeRun;
            if ((player === 'X' && p >= 18 && p <= 22) || (player === 'O' && p >= 3 && p <= 7)) {
                anchorScore += 2;
            }
        } else {
            primeRun = 0;
            if (ownCount === 1) blots++;
        }
    }
    switch (styleMode % 5) {
        case 0:
            return hits * 9 + madePoints * 2 - blots;
        case 1:
            return maxPrime * 6 + madePoints * 3 - blots * 2;
        case 2:
            return anchorScore * 5 + madePoints * 2 - blots * 3;
        case 3:
            return hits * 4 + maxPrime * 3 + blots * 2;
        default:
            return madePoints * 3 + maxPrime * 2 + hits * 3 - blots;
    }
}

function inferContactConceptMeta(board: ReadonlyArray<number>, playerGamePlan: string): { conceptId: string; conceptName: string } {
    const plan = playerGamePlan.toLowerCase();
    let hasAdvancedAnchor = false;
    let primeRun = 0;
    let maxPrime = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p] ?? 0;
        if (v >= 2) {
            primeRun++;
            if (primeRun > maxPrime) maxPrime = primeRun;
            if (p >= 18 && p <= 22) hasAdvancedAnchor = true;
        } else {
            primeRun = 0;
        }
    }
    if (plan.includes('anchor') || plan.includes('hold') || plan.includes('back') || (hasAdvancedAnchor && maxPrime < 4)) {
        return { conceptId: 'holding_anchor', conceptName: 'Jeu de Retenue & Ancre Avancée (Holding Game)' };
    }
    if (plan.includes('attack') || plan.includes('blitz')) {
        return { conceptId: 'blitz_attack', conceptName: 'Blitz & Attaque de Jan' };
    }
    return { conceptId: 'prime_building', conceptName: 'Construction de Prime (Mur)' };
}

function deterministicRoll(seed: number): [number, number] {
    const h1 = Math.abs(Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b));
    const h2 = Math.abs(Math.imul(h1 ^ 0xc2b2ae35, 0x27d4eb2f));
    return [(h1 % 6) + 1, (h2 % 6) + 1];
}

export async function generateAndValidateCheckerQuiz(params: {
    readonly index: number;
    readonly plyCount: number;
    readonly dice: readonly [number, number];
    readonly comp: CompetitionFormatSpec;
    readonly xgid: string;
}): Promise<Certified3PlyQuiz | null> {
    const parsedState = parseXGID(params.xgid);
    const boardVal = validateBoardState(parsedState.board, 'X');
    if (!boardVal.isValid15Checkers || !boardVal.isContact) return null;
    if (boardVal.whitePips >= 145 || boardVal.blackPips >= 145) return null;

    const gnubgMoves3Ply = queryGnubgTopMovesAtPly(params.xgid, 3);
    const seenBoardSigs = new Set<string>();
    const uniqueMoves3Ply: Gnubg3PlyMoveResult[] = [];
    for (const m of gnubgMoves3Ply) {
        if (m.ply !== 3) continue;
        const sig = computeBoardSignatureAfterMove(boardVal.normalizedBoard, m.notation);
        if (!seenBoardSigs.has(sig)) {
            seenBoardSigs.add(sig);
            uniqueMoves3Ply.push(m);
        }
    }
    if (uniqueMoves3Ply.length < 4) return null;

    const top3Ply = uniqueMoves3Ply[0]!;
    const second3Ply = uniqueMoves3Ply[1]!;
    const gap12 = Number(Math.abs(second3Ply.loss).toFixed(4));
    if (gap12 < 0.008 || gap12 > 0.140) return null;

    const evalBgsage3Ply = await callBgsageEvaluate(params.xgid, 3);
    const bgsageTopNotation = evalBgsage3Ply.chequerPlay[0]?.notation ?? top3Ply.notation;
    const gnubgCheck = verifyWithGnubg3Ply(params.xgid, bgsageTopNotation, evalBgsage3Ply.chequerPlay);
    if (!gnubgCheck.isAgreementValid) return null;

    const gnubg0Ply = queryGnubgTopMovesAtPly(params.xgid, 0);
    const gnubg1Ply = queryGnubgTopMovesAtPly(params.xgid, 1);
    const top0Norm = normalizeNotationForCompare(gnubg0Ply[0]?.notation ?? top3Ply.notation);
    const top1Norm = normalizeNotationForCompare(gnubg1Ply[0]?.notation ?? top3Ply.notation);
    const top3Norm = normalizeNotationForCompare(top3Ply.notation);
    const is3PlyTrapVs0Ply = top0Norm !== top3Norm;
    const is1PlyTrapVs3Ply = top1Norm !== top3Norm;

    const match0In3Ply = uniqueMoves3Ply.find((m) => normalizeNotationForCompare(m.notation) === top0Norm);
    const instinctiveEntry = is3PlyTrapVs0Ply && match0In3Ply ? match0In3Ply : second3Ply;
    const instinctiveMove = instinctiveEntry.notation;
    const instinctiveLossEmg = instinctiveEntry.loss;

    const legalMoves3Ply: Certified3PlyLegalMoveEntry[] = uniqueMoves3Ply.slice(0, 6).map((m, idx) => {
        const lossVal = idx === 0 ? 0 : m.loss;
        const erMetrics = computeErPrForMove({ rank: idx + 1, equityLoss: lossVal });
        const bgsageMatch = evalBgsage3Ply.chequerPlay.find(
            (bm) => normalizeNotationForCompare(bm.notation) === normalizeNotationForCompare(m.notation),
        );
        return {
            rank: idx + 1,
            notation: m.notation,
            evaluatedPly: 3,
            equity: m.equity,
            deltaEmg: erMetrics.deltaEmg,
            equityLoss: erMetrics.equityLoss,
            erPrScore: erMetrics.erPrScore,
            erPrTenthsDelta: erMetrics.erPrTenthsDelta,
            isInstinctive0PlyChoice: m.notation === instinctiveMove && idx > 0,
            playerGamePlan: bgsageMatch?.playerGamePlan ?? evalBgsage3Ply.gamePlans?.player ?? 'anchoring',
            opponentGamePlan: bgsageMatch?.opponentGamePlan ?? evalBgsage3Ply.gamePlans?.opponent ?? 'anchoring',
            finalBoardSignature: computeBoardSignatureAfterMove(boardVal.normalizedBoard, m.notation),
            probabilities: m.probabilities,
        };
    });

    const geometry36 = extractGeometric36Rolls(boardVal.normalizedBoard, top3Ply.notation);
    const pipCountText = `${geometry36.whitePips} vs ${geometry36.blackPips} pips`;
    const conceptMeta = inferContactConceptMeta(boardVal.normalizedBoard, legalMoves3Ply[0]!.playerGamePlan);
    const semantic = resolveSemanticArchetype(boardVal.normalizedBoard, {
        conceptId: conceptMeta.conceptId,
        conceptName: conceptMeta.conceptName,
        optimalMove: top3Ply.notation,
    });
    const ratingInfo = computeQuizTargetERAndBracket({ gap12Emg: gap12, is3PlyTrapVs0Ply, is1PlyTrapVs3Ply });
    const { coachExplanation3Ply, socraticHint } = buildDynamicCoachAndHint3Ply({
        quizType: 'CHECKER_PLAY',
        pipCountText,
        compLabel: params.comp.label,
        optimalMove: top3Ply.notation,
        secondMove: second3Ply.notation,
        bestEquity: top3Ply.equity,
        gap12,
        geometry36,
    });

    const quiz: Certified3PlyQuiz = {
        id: `bgsage3p_v4_${params.comp.id}_${params.index}_${params.dice[0]}${params.dice[1]}`,
        quizType: 'CHECKER_PLAY',
        xgid: params.xgid,
        canonicalTurn: 'X',
        canonicalDirection: 'Case 24 ➔ Case 1',
        uiQuizLevelBadge: formatUiQuizLevelBadge(ratingInfo.quizTargetER),
        plyCount: params.plyCount,
        evaluatedPly: 3,
        dice: [params.dice[0], params.dice[1]],
        matchLength: params.comp.matchLength,
        quizTargetER: ratingInfo.quizTargetER,
        targetBracket: ratingInfo.targetBracket,
        tierLabel: ratingInfo.tierLabel,
        matchupDepthLabel: 'gnubg-cli 3-ply Cubeful + bgsage 3-ply (Accord <= 0.025 EMG au score exact)',
        competition: params.comp,
        isContact: semantic.isContact,
        archetype: semantic.archetype,
        conceptId: semantic.conceptId,
        conceptName: semantic.conceptName,
        optimalMove: top3Ply.notation,
        instinctive0PlyMove: instinctiveMove,
        instinctive0PlyLossEmg: Number(instinctiveLossEmg.toFixed(4)),
        is3PlyTrapVs0Ply,
        is1PlyTrapVs3Ply,
        requiredEr: Number((ratingInfo.quizTargetER + 0.5).toFixed(1)),
        targetNPlus1Er: ratingInfo.quizTargetER,
        whitePips: geometry36.whitePips,
        blackPips: geometry36.blackPips,
        pipCountDisplayed: pipCountText,
        pipCountText,
        geometry36,
        gnubg3PlyVerification: gnubgCheck,
        coachExplanation3Ply,
        socraticHint,
        quizChoices: [
            legalMoves3Ply[0]!.notation,
            legalMoves3Ply[1]!.notation,
            legalMoves3Ply[2]!.notation,
            legalMoves3Ply[3]!.notation,
        ],
        legalMoves3Ply,
    };

    validateSingleQuizStrict(quiz);
    return quiz;
}

export async function generateAndValidateCubeQuiz(params: {
    readonly index: number;
    readonly plyCount: number;
    readonly comp: CompetitionFormatSpec;
    readonly xgid: string;
}): Promise<Certified3PlyQuiz | null> {
    const parsedState = parseXGID(params.xgid);
    const boardVal = validateBoardState(parsedState.board, 'X');
    if (!boardVal.isValid15Checkers || !boardVal.isContact || boardVal.whitePips >= 145 || boardVal.blackPips >= 145) return null;

    const gnubgCube = queryGnubgCube3Ply(params.xgid);
    const eval3Ply = await callBgsageEvaluate(params.xgid, 3);
    if (!gnubgCube || !eval3Ply.cubeDecision) return null;

    const rawBgsageAction = eval3Ply.cubeDecision.optimalAction;
    const bgsageAction =
        /^No\s*Double/i.test(rawBgsageAction) || /Too\s*Good/i.test(rawBgsageAction)
            ? 'No Double / Take'
            : rawBgsageAction.replace('/', ' / ');
    if (bgsageAction !== gnubgCube.optimalAction) return null;

    const ndEq = gnubgCube.noDoubleEq;
    const dtEq = gnubgCube.doubleTakeEq;
    const dpEq = gnubgCube.doublePassEq;

    // Classement 100 % mathématique sur les 3 vraies équités Cubeful de gnubg-cli (zéro formule inventée)
    const rawChoices =
        dtEq < dpEq
            ? [
                  ndEq >= dtEq
                      ? { notation: 'No Double / Take', eq: ndEq, loss: 0 }
                      : { notation: 'Double / Take', eq: dtEq, loss: 0 },
                  ndEq >= dtEq
                      ? { notation: 'Double / Take', eq: dtEq, loss: Number(Math.abs(ndEq - dtEq).toFixed(3)) }
                      : { notation: 'No Double / Take', eq: ndEq, loss: Number(Math.abs(dtEq - ndEq).toFixed(3)) },
                  { notation: 'Double / Pass', eq: dpEq, loss: Number(Math.abs(dpEq - dtEq).toFixed(3)) },
              ]
            : [
                  dpEq >= ndEq
                      ? { notation: 'Double / Pass', eq: dpEq, loss: 0 }
                      : { notation: 'No Double / Take', eq: ndEq, loss: 0 },
                  dpEq >= ndEq
                      ? { notation: 'No Double / Take', eq: ndEq, loss: Number(Math.abs(dpEq - ndEq).toFixed(3)) }
                      : { notation: 'Double / Pass', eq: dpEq, loss: Number(Math.abs(ndEq - dpEq).toFixed(3)) },
                  { notation: 'Double / Take', eq: dtEq, loss: Number(Math.abs(dtEq - dpEq).toFixed(3)) },
              ];

    const gap12 = rawChoices[1]!.loss;
    const gap13 = rawChoices[2]!.loss;
    if (gap12 < 0.008 || gap12 > 0.140 || gap13 <= gap12) return null;

    const legalMoves3Ply: Certified3PlyLegalMoveEntry[] = rawChoices.map((c, idx) => {
        const erMetrics = computeErPrForMove({ rank: idx + 1, equityLoss: c.loss });
        return {
            rank: idx + 1,
            notation: c.notation,
            evaluatedPly: 3,
            equity: c.eq,
            deltaEmg: erMetrics.deltaEmg,
            equityLoss: erMetrics.equityLoss,
            erPrScore: erMetrics.erPrScore,
            erPrTenthsDelta: erMetrics.erPrTenthsDelta,
            isInstinctive0PlyChoice: idx === 1,
            playerGamePlan: eval3Ply.gamePlans?.player ?? 'attacking',
            opponentGamePlan: eval3Ply.gamePlans?.opponent ?? 'anchoring',
            probabilities: gnubgCube.probabilities,
        };
    });

    const geometry36 = extractGeometric36Rolls(boardVal.normalizedBoard, '');
    const pipCountText = `${geometry36.whitePips} vs ${geometry36.blackPips} pips`;
    const cubeConceptMeta = inferContactConceptMeta(boardVal.normalizedBoard, legalMoves3Ply[0]!.playerGamePlan);
    const cubeSemantic = resolveSemanticArchetype(boardVal.normalizedBoard, {
        conceptId: cubeConceptMeta.conceptId,
        conceptName: 'Décision de Videau 3-Ply Cubeful (Double / Take / Pass)',
    });
    const ratingInfo = computeQuizTargetERAndBracket({ gap12Emg: gap12, is3PlyTrapVs0Ply: true, is1PlyTrapVs3Ply: false });
    const bestEq = rawChoices[0]!.eq;
    const { coachExplanation3Ply, socraticHint } = buildDynamicCoachAndHint3Ply({
        quizType: 'CUBE_DECISION',
        pipCountText,
        compLabel: params.comp.label,
        optimalMove: legalMoves3Ply[0]!.notation,
        secondMove: legalMoves3Ply[1]!.notation,
        bestEquity: bestEq,
        gap12,
        geometry36,
    });
    const quiz: Certified3PlyQuiz = {
        id: `bgsage3p_v4_cube_${params.comp.id}_${params.index}`,
        quizType: 'CUBE_DECISION',
        xgid: params.xgid,
        canonicalTurn: 'X',
        canonicalDirection: 'Case 24 ➔ Case 1',
        uiQuizLevelBadge: formatUiQuizLevelBadge(ratingInfo.quizTargetER),
        plyCount: params.plyCount,
        evaluatedPly: 3,
        dice: [0, 0],
        matchLength: params.comp.matchLength,
        quizTargetER: ratingInfo.quizTargetER,
        targetBracket: ratingInfo.targetBracket,
        tierLabel: ratingInfo.tierLabel,
        matchupDepthLabel: 'Cube 3-ply Cubeful : gnubg-cli 3-ply + bgsage 3-ply (Zéro équité synthétique)',
        competition: params.comp,
        isContact: true,
        archetype: cubeSemantic.archetype,
        conceptId: 'cube_decision',
        conceptName: 'Décision de Videau 3-Ply Cubeful (Double / Take / Pass)',
        optimalMove: legalMoves3Ply[0]!.notation,
        instinctive0PlyMove: legalMoves3Ply[1]!.notation,
        instinctive0PlyLossEmg: gap12,
        is3PlyTrapVs0Ply: true,
        is1PlyTrapVs3Ply: false,
        requiredEr: Number((ratingInfo.quizTargetER + 0.5).toFixed(1)),
        targetNPlus1Er: ratingInfo.quizTargetER,
        whitePips: geometry36.whitePips,
        blackPips: geometry36.blackPips,
        pipCountDisplayed: pipCountText,
        pipCountText,
        geometry36,
        gnubg3PlyVerification: {
            gnubgTopMove3Ply: gnubgCube.optimalAction,
            bgsageTopMove3Ply: bgsageAction,
            top1DisagreementEmg: 0.0,
            isAgreementValid: true,
        },
        coachExplanation3Ply,
        socraticHint,
        quizChoices: [
            legalMoves3Ply[0]!.notation,
            legalMoves3Ply[1]!.notation,
            legalMoves3Ply[2]!.notation,
        ],
        legalMoves3Ply,
    };

    validateSingleQuizStrict(quiz);
    return quiz;
}

async function runFactoryLoop(): Promise<void> {
    const batchArg = process.argv.find((a) => a.startsWith('--batch='));
    const maxArg = process.argv.find((a) => a.startsWith('--max-quizzes='));
    const batchLimit = batchArg ? Number(batchArg.split('=')[1]) : Infinity;
    const maxTotalQuizzes = maxArg ? Number(maxArg.split('=')[1]) : TARGET_MAX_QUIZZES;

    fs.mkdirSync(path.dirname(FACTORY_JSONL_PATH), { recursive: true });
    const seenKeys = new Set<string>();
    let generatedCount = 0;
    let checkerCount = 0;
    let cubeCount = 0;

    if (fs.existsSync(FACTORY_JSONL_PATH)) {
        const lines = fs.readFileSync(FACTORY_JSONL_PATH, 'utf8').split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
            try {
                const parsed = JSON.parse(line) as Certified3PlyQuiz;
                seenKeys.add(extractBoardDiceKey(parsed.quizType, parsed.xgid));
                generatedCount++;
                if (parsed.quizType === 'CUBE_DECISION') cubeCount++;
                else checkerCount++;
            } catch {
                // ignore malformed line
            }
        }
    }

    let sessionAdded = 0;
    let simGameIdx = generatedCount * 17 + 1;

    while (generatedCount < maxTotalQuizzes && sessionAdded < batchLimit) {
        let state = createInitialState(0);
        const styleX = simGameIdx % 5;
        const styleO = (simGameIdx * 3 + 1) % 5;

        for (let ply = 1; ply <= 45 && generatedCount < maxTotalQuizzes && sessionAdded < batchLimit; ply++) {
            const roll = deterministicRoll(simGameIdx * 97 + ply * 31);
            const legalSeqs = generateLegalMoves(state, roll);
            if (legalSeqs.length === 0) {
                state = { ...state, turn: state.turn === 'X' ? 'O' : 'X' };
                continue;
            }

            if (ply >= 6 && legalSeqs.length >= 4) {
                const board26 = toBgsageBoard26ForX(state.board, state.turn);
                const compIdx = Math.abs(Math.imul(simGameIdx ^ (ply * 13), 0x45d9f3b)) % ALL_COMPETITION_FORMATS.length;
                const comp = ALL_COMPETITION_FORMATS[compIdx]!;
                const isCubeEligible = !comp.crawford && comp.regime !== 'MATCH_DMP' && comp.cubeOwner !== 'O';
                const wantCube = isCubeEligible && (cubeCount === 0 || cubeCount * 4 < checkerCount);
                const quizType = wantCube ? 'CUBE_DECISION' : 'CHECKER_PLAY';
                const xgid = buildCanonicalXgid(board26, wantCube ? null : roll, comp);
                const parsedForFilter = parseXGID(xgid);
                const boardVal = validateBoardState(parsedForFilter.board, 'X');
                const canonicalLegal = generateLegalMoves(parsedForFilter, roll);

                if (boardVal.isValid15Checkers && boardVal.isContact && boardVal.whitePips < 145 && boardVal.blackPips < 145 && canonicalLegal.length >= 4) {
                    const dedupeKey = extractBoardDiceKey(quizType, xgid);
                    if (!seenKeys.has(dedupeKey)) {
                        try {
                            const quiz = wantCube
                                ? await generateAndValidateCubeQuiz({ index: generatedCount + 1, plyCount: ply, comp, xgid })
                                : await generateAndValidateCheckerQuiz({ index: generatedCount + 1, plyCount: ply, dice: roll, comp, xgid });
                            if (quiz) {
                                seenKeys.add(dedupeKey);
                                fs.appendFileSync(FACTORY_JSONL_PATH, JSON.stringify(quiz) + '\n', 'utf8');
                                generatedCount++;
                                sessionAdded++;
                                if (quiz.quizType === 'CUBE_DECISION') cubeCount++;
                                else checkerCount++;
                                if (generatedCount % 100 === 0 || sessionAdded === batchLimit) {
                                    syncFactorySeedFromJsonl();
                                }
                                console.log(`[PASS #${generatedCount} | +${sessionAdded}] ${quiz.quizType} | ${quiz.id} | ${quiz.xgid}`);
                            }
                        } catch {
                            // position rejected by 3-ply or validator
                        }
                    }
                }
            }

            const activeStyle = state.turn === 'X' ? styleX : styleO;
            const scored = [...legalSeqs].sort(
                (a, b) => scoreSimulatedMove(state.board, b, state.turn, activeStyle) - scoreSimulatedMove(state.board, a, state.turn, activeStyle),
            );
            const pickIdx = (simGameIdx + ply) % Math.min(3, scored.length);
            const chosen = scored[pickIdx]!;
            state = {
                ...state,
                board: chosen.board,
                turn: state.turn === 'X' ? 'O' : 'X',
            };
        }
        simGameIdx++;
    }
}

runFactoryLoop().catch((err: unknown) => {
    console.error('[FACTORY FATAL]', err);
    process.exit(1);
});
