import { describe, it, expect, beforeEach } from 'vitest';
import {
    createInitialState,
    generateLegalMoves,
    serializeCanonicalXGID,
    X_BAR,
    type BoardState,
} from '../../engine/backgammonEngine';
import { analyzeBoardMoves, formatMoveSequenceNotation } from '../../lib/engine/evaluator';
import {
    bgsageCacheKey,
    clearBgsageEvaluationCache,
    setCachedBgsageEvaluation,
} from '../../lib/engine/bgsageCache';
import { analyzeHumanMoveFromLog } from '../coach/logAnalyzer';
import { buildCoachStateFromLogResult } from '../../hooks/coach/coachStateBuilders';
import {
    pickVariedCheckerErrorCopy,
    pickVariedCubeErrorCopy,
    type VariedCheckerCategory,
    type VariedCubeCategory,
} from '../coach/coachVariedMessagesBank';
import { generateRuleBasedExplanation, type CoachPromptParams } from '../coach/prompts';
import { buildMatchContext } from '../coach/matchContext';
import {
    explainTacticalDifference,
    buildBiLevelCoachMicroCopy,
} from '../coach/tacticalExplainer';
import { generateRuleBasedGameReview } from '../coach/gameReviewPrompts';
import { analyzeCompleteGame } from './gameAnalyzer';
import type { RawGameTurn, CompleteGameAnalysis } from './types';

describe('Audit en boucle (20 parties simulées) — Bilan PR & Comptes Rendus Coach IA', () => {
    beforeEach(() => {
        clearBgsageEvaluationCache();
    });

    it('1. Reproduit exactement le cas [3-4]: bar/21 21/18* (sortie de barre + frappe) sans faux Howler (-0.574 ΔEq)', () => {
        const state = createInitialState(7);
        const board = [...state.board];
        // X a un pion sur la barre (bar = indice 0), O a un blot isolé sur la flèche 18
        board[24] = 1;
        board[X_BAR] = 1;
        board[18] = -1;
        board[17] = -2;

        const evalState: BoardState = {
            ...state,
            board,
            turn: 'X',
            dice: [3, 4],
        };
        const legal = generateLegalMoves(evalState, [3, 4]);
        const hitSeq = legal.find((s) =>
            s.moves.some((m) => m.from === X_BAR && m.to === 21) &&
            s.moves.some((m) => m.from === 21 && m.to === 18),
        );
        expect(hitSeq).toBeDefined();

        const turn: RawGameTurn = {
            turnNumber: 9,
            player: 'X',
            dice: [3, 4],
            boardBefore: board,
            boardAfter: hitSeq!.board,
            moves: hitSeq!.moves,
        };

        const analysis = analyzeCompleteGame([turn], {
            targetPlayer: 'X',
            matchLength: 7,
            scoreX: 0,
            scoreO: 0,
        });

        expect(analysis.evaluatedMoves).toHaveLength(1);
        const moveEval = analysis.evaluatedMoves[0];
        // Ne doit JAMAIS produire le faux Howler à -0.574 ΔEq ni un PR à 158
        expect(Math.abs(moveEval.equityLoss)).toBeLessThan(0.12);
        expect(analysis.performanceRating).toBeLessThan(55);
    });

    it('2. Garantit 100 % de parité entre le cache Open Sage (bgsage 3-ply) et le Bilan de fin de partie (analyzeCompleteGame)', () => {
        const initial = createInitialState(7);
        const midBoard = [...initial.board];
        // Position de milieu de partie (hors Opening Book) : X a avancé 24->20 et 13->8
        midBoard[24] = 1;
        midBoard[20] = 1;
        midBoard[13] = 4;
        midBoard[8] = 4;
        const dice: [number, number] = [6, 2];
        const evalState: BoardState = {
            ...initial,
            board: midBoard,
            turn: 'X',
            dice,
        };
        const xgid = serializeCanonicalXGID(evalState);
        const legal = generateLegalMoves(evalState, dice);
        const bestSeq = legal[0];
        const secondSeq = legal[1] ?? legal[0];

        setCachedBgsageEvaluation(bgsageCacheKey(xgid, 3), {
            source: 'bgsage-cloud-run',
            isRace: false,
            gamePlans: { player: 'contact', opponent: 'contact' },
            cubeDecision: { optimalAction: 'No double, take', noDouble: 0.12, doubleTake: -0.25, doublePass: 1.0 },
            chequerPlay: [
                {
                    rank: 1,
                    notation: formatMoveSequenceNotation(bestSeq.moves, 'X'),
                    equity: 0.145,
                    equityLoss: 0,
                    board: bestSeq.board,
                    moves: bestSeq.moves,
                    probabilities: {
                        win: 0.54,
                        winGammon: 0.14,
                        winBackgammon: 0.01,
                        loseWin: 0.46,
                        loseGammon: 0.11,
                        loseBackgammon: 0.005,
                    },
                },
                {
                    rank: 2,
                    notation: formatMoveSequenceNotation(secondSeq.moves, 'X'),
                    equity: 0.113,
                    equityLoss: -0.032,
                    board: secondSeq.board,
                    moves: secondSeq.moves,
                    probabilities: {
                        win: 0.525,
                        winGammon: 0.13,
                        winBackgammon: 0.01,
                        loseWin: 0.475,
                        loseGammon: 0.115,
                        loseBackgammon: 0.005,
                    },
                },
            ],
        });

        const turns: RawGameTurn[] = [
            {
                turnNumber: 3,
                player: 'X',
                dice,
                boardBefore: midBoard,
                boardAfter: secondSeq.board,
                moves: secondSeq.moves,
            },
        ];

        const postMatch = analyzeCompleteGame(turns, {
            targetPlayer: 'X',
            matchLength: 7,
            scoreX: 0,
            scoreO: 0,
        });

        expect(postMatch.evaluatedMoves[0].equityLoss).toBeCloseTo(-0.032, 3);
        expect(postMatch.performanceRating).toBeCloseTo(0.032 * 500, 1);
    });

    it('3. Exécute 20 parties simulées en boucle (Top-2 vs coups variés) et audite le PR + les comptes rendus Coach IA', () => {
        const DICE_POOL: Array<[number, number]> = [
            [3, 1], [4, 2], [6, 1], [5, 3], [6, 5],
            [4, 3], [5, 2], [6, 4], [3, 2], [5, 4],
        ];

        const prResults: number[] = [];
        const coachSamples: string[] = [];

        for (let gameIdx = 0; gameIdx < 20; gameIdx++) {
            let board = [...createInitialState(7).board];
            const turns: RawGameTurn[] = [];

            for (let step = 0; step < 6; step++) {
                const player = step % 2 === 0 ? 'X' : 'O';
                const dice = DICE_POOL[(gameIdx * 3 + step) % DICE_POOL.length];
                const state: BoardState = {
                    ...createInitialState(7),
                    board: [...board],
                    turn: player,
                    dice,
                };
                const legal = generateLegalMoves(state, dice);
                if (legal.length === 0) continue;

                // Évalue en 0-ply rapide pour choisir un coup réaliste (optimal ou léger écart)
                const ranked = analyzeBoardMoves(state, dice, { ply: 0, maxMoves: 16 });
                const pickIdx =
                    player === 'X'
                        ? gameIdx % 4 === 3 && ranked.moves.length > 2
                            ? 2 // Légère imprécision volontaire sur 1 partie sur 4
                            : 0 // Coup optimal sinon
                        : 0;
                const chosen = ranked.moves[pickIdx] ?? ranked.moves[0];
                const chosenBoard = chosen?.board ?? legal[0].board;
                const chosenMoves = chosen?.moves ?? legal[0].moves;

                turns.push({
                    turnNumber: step + 1,
                    player,
                    dice,
                    boardBefore: [...board],
                    boardAfter: [...chosenBoard],
                    moves: [...chosenMoves],
                });

                if (player === 'X') {
                    const logAnalysis = analyzeHumanMoveFromLog({
                        logEntry: {
                            turnIndex: step + 1,
                            player: 'X',
                            dice,
                            boardBefore: [...board],
                            movePlayed: chosenMoves,
                            boardAfter: [...chosenBoard],
                            timestamp: step,
                        },
                        localPlayer: 'X',
                        ply: 0,
                    });
                    expect(logAnalysis).not.toBeNull();
                    if (logAnalysis) {
                        const { coachState } = buildCoachStateFromLogResult({
                            lastEntry: {
                                turnIndex: step + 1,
                                player: 'X',
                                dice,
                                boardBefore: [...board],
                                movePlayed: chosenMoves,
                                boardAfter: [...chosenBoard],
                                timestamp: step,
                            },
                            result: { ...logAnalysis, source: 'local' },
                            playedMoves: chosenMoves,
                            playedNotation: logAnalysis.playedNotation,
                            gameState: state,
                        });
                        const reportText =
                            coachState.explanation || coachState.tacticalSummary || coachState.summary || '';
                        expect(reportText.length).toBeGreaterThan(15);
                        if (logAnalysis.equityLoss >= 0.02) {
                            expect(reportText).not.toMatch(/Erreur de Videau|Take Point/i);
                            coachSamples.push(
                                `[Partie #${gameIdx + 1} T${step + 1} ${dice[0]}-${dice[1]}] ${logAnalysis.playedNotation} vs ${logAnalysis.optimalNotation} (-${logAnalysis.equityLoss.toFixed(3)} EMG) -> ${coachState.whyFailed ?? reportText}`,
                            );
                        }
                    }
                }

                board = [...chosenBoard];
            }

            const summary = analyzeCompleteGame(turns, {
                targetPlayer: 'X',
                gameId: `loop_game_${gameIdx + 1}`,
                matchLength: 7,
                scoreX: 1,
                scoreO: 0,
                ply: 0,
            });

            prResults.push(summary.performanceRating);
            // Aucune des 20 parties ne doit produire un PR aberrant (> 45 PR)
            expect(summary.performanceRating).toBeGreaterThanOrEqual(0);
            expect(summary.performanceRating).toBeLessThan(45);
        }

        // Vérifie aussi la banque de 10 messages variés Pions & Videau
        const checkerVariants = new Set<string>();
        const cubeVariants = new Set<string>();
        for (let i = 0; i < 10; i++) {
            const ch = pickVariedCheckerErrorCopy('SHOT_EXPOSURE', {
                playedMove: 'bar/21 21/18*',
                optimalMove: 'bar/21 13/10',
                equityLoss: -0.065,
                seedExtra: `variant-test-${i}`,
            });
            const cb = pickVariedCubeErrorCopy('PREMATURE_DOUBLE', {
                playedMove: 'Videau : Doubler (×2)',
                optimalMove: 'No double, take',
                equityLoss: -0.14,
                seedExtra: `cube-test-${i}`,
            });
            checkerVariants.add(ch.advice);
            cubeVariants.add(cb.advice);
            expect(ch.summary).not.toMatch(/Videau oublié|Double prématuré/i);
            expect(cb.summary).toMatch(/Double prématuré|Videau/i);
        }
        expect(checkerVariants.size).toBeGreaterThanOrEqual(5);
        expect(cubeVariants.size).toBeGreaterThanOrEqual(5);
        expect(prResults).toHaveLength(20);
    });

    it(
        '4. Stress-Test Beta 20 000 parties (100 000 décisions : Grand-Maître, Club, Amateur, Débutant, Joueur O, Crawford, Videau & 170 variantes Coach)',
        () => {
            const ALL_21_ROLLS: Array<[number, number]> = [
                [1, 1], [2, 1], [2, 2], [3, 1], [3, 2], [3, 3],
                [4, 1], [4, 2], [4, 3], [4, 4], [5, 1], [5, 2],
                [5, 3], [5, 4], [5, 5], [6, 1], [6, 2], [6, 3],
                [6, 4], [6, 5], [6, 6],
            ];

            interface PreparedTurnPool {
                boardBefore: number[];
                dice: [number, number];
                player: 'X' | 'O';
                candidates: Array<{
                    moves: BoardState['dice'] extends never
                        ? never
                        : import('../../engine/backgammonEngine').Move[];
                    board: number[];
                    notation: string;
                    equity: number;
                    equityLoss: number;
                }>;
            }

            const pool: PreparedTurnPool[] = [];
            let simBoard = [...createInitialState(7).board];

            for (let idx = 0; idx < 42; idx++) {
                const player: 'X' | 'O' = idx % 2 === 0 ? 'X' : 'O';
                const dice = ALL_21_ROLLS[idx % ALL_21_ROLLS.length];
                const state: BoardState = {
                    ...createInitialState(7),
                    board: [...simBoard],
                    turn: player,
                    dice,
                };
                const legal = generateLegalMoves(state, dice);
                if (legal.length === 0) {
                    simBoard = [...createInitialState(7).board];
                    continue;
                }
                const ranked = analyzeBoardMoves(state, dice, { ply: 0, maxMoves: 12 });
                if (ranked.moves.length === 0) continue;

                const bestEq = ranked.moves[0].equity;
                const candidates = ranked.moves.map((m, rankIdx) => {
                    const mvList = m.moves ?? [];
                    const brdAfter = m.board ?? simBoard;
                    const notation = formatMoveSequenceNotation(mvList, player);
                    const rawDiff = Math.max(0, bestEq - m.equity);
                    const calibratedLoss =
                        rankIdx === 0
                            ? 0
                            : Number(Math.min(0.18, rawDiff * 0.25 + rankIdx * 0.018).toFixed(4));
                    return {
                        moves: mvList,
                        board: brdAfter,
                        notation,
                        equity: Number((bestEq - calibratedLoss).toFixed(4)),
                        equityLoss: calibratedLoss,
                    };
                });

                // Peuple 100% du pool dans bgsageCache 3-ply (pour simuler 20 000 parties haute vitesse)
                // tout en gardant un test dédié aux replis locaux hors-cache
                const xgid = serializeCanonicalXGID(state);
                setCachedBgsageEvaluation(bgsageCacheKey(xgid, 3), {
                    source: 'bgsage-cloud-run',
                    isRace: false,
                    gamePlans: { player: 'contact', opponent: 'contact' },
                    cubeDecision: {
                        optimalAction: 'No double, take',
                        noDouble: bestEq,
                        doubleTake: bestEq - 0.12,
                        doublePass: 1.0,
                    },
                    chequerPlay: candidates.map((c, cIdx) => ({
                        rank: cIdx + 1,
                        notation: c.notation,
                        equity: c.equity,
                        equityLoss: -c.equityLoss,
                        board: c.board,
                        moves: c.moves,
                        probabilities: {
                            win: 0.54 - c.equityLoss * 0.4,
                            winGammon: 0.14,
                            winBackgammon: 0.01,
                            loseWin: 0.46 + c.equityLoss * 0.4,
                            loseGammon: 0.11,
                            loseBackgammon: 0.005,
                        },
                    })),
                });

                pool.push({
                    boardBefore: [...simBoard],
                    dice,
                    player,
                    candidates,
                });

                simBoard = [...candidates[0].board];
            }

            const TOTAL_GAMES = 20000;
            let totalDecisionsAudited = 0;
            let nanOrInfinityCount = 0;
            let cubeCheckerConfusionCount = 0;
            let crawfordGamesAudited = 0;
            let liveCoachChecks = 0;
            const statsByArchetype = {
                gm: [] as number[],
                club: [] as number[],
                amateur: [] as number[],
                chaos: [] as number[],
            };

            for (let g = 0; g < TOTAL_GAMES; g++) {
                const archetype =
                    g < 6000 ? 'gm' : g < 12000 ? 'club' : g < 16000 ? 'amateur' : 'chaos';
                const targetPlayer: 'X' | 'O' = g % 8 === 7 ? 'O' : 'X';
                const playerPool = pool.filter((p) => p.player === targetPlayer);
                const isCrawfordGame = g % 20 === 0;
                if (isCrawfordGame) crawfordGamesAudited += 1;

                const turns: RawGameTurn[] = [];

                for (let t = 0; t < 5; t++) {
                    const item = playerPool[(g * 5 + t) % playerPool.length];
                    const maxIdx = item.candidates.length - 1;
                    let pickIdx = 0;
                    if (archetype === 'gm') {
                        pickIdx = 0;
                    } else if (archetype === 'club') {
                        pickIdx = t % 3 === 2 ? Math.min(1, maxIdx) : 0;
                    } else if (archetype === 'amateur') {
                        pickIdx = t % 2 === 1 ? Math.min(2, maxIdx) : Math.min(1, maxIdx);
                    } else {
                        pickIdx = Math.min(3 + (t % 3), maxIdx);
                    }

                    const chosen = item.candidates[pickIdx] ?? item.candidates[0];
                    const hasOpponentOwnedCube = g % 40 === 0 && t === 2;

                    turns.push({
                        turnNumber: t + 1,
                        player: targetPlayer,
                        dice: item.dice,
                        boardBefore: item.boardBefore,
                        boardAfter: chosen.board,
                        moves: chosen.moves,
                        cubeValue: isCrawfordGame ? 1 : g % 3 === 0 ? 2 : 1,
                        cubeOwner: hasOpponentOwnedCube ? (targetPlayer === 'X' ? 'O' : 'X') : null,
                        crawford: isCrawfordGame,
                        cubeDecision:
                            hasOpponentOwnedCube || isCrawfordGame
                                ? { action: 'no_double', cubeEquityLoss: 0.45, isCloseDecision: true }
                                : undefined,
                    });
                }

                const analysis = analyzeCompleteGame(turns, {
                    targetPlayer,
                    gameId: `beta_20000_${g}`,
                    matchLength: g % 5 === 0 ? 0 : 7,
                    scoreX: isCrawfordGame ? 6 : g % 4,
                    scoreO: isCrawfordGame ? 4 : g % 3,
                    crawford: isCrawfordGame,
                    ply: 0,
                });

                totalDecisionsAudited += analysis.evaluatedMoves.length;
                statsByArchetype[archetype].push(analysis.performanceRating);

                if (
                    !Number.isFinite(analysis.performanceRating) ||
                    !Number.isFinite(analysis.luckAdjustedPR) ||
                    !Number.isFinite(analysis.totalLuck) ||
                    analysis.performanceRating < 0
                ) {
                    nanOrInfinityCount += 1;
                }

                // En manche de Crawford ou lorsque le videau appartient à l'adversaire, aucune décision de videau ne doit être comptée
                if ((hasOpponentOwnedCubeInGame(g) || isCrawfordGame) && analysis.closeCubeDecisionsCount !== 0) {
                    cubeCheckerConfusionCount += 1;
                }

                // Échantillonne le constructeur complet du Coach en direct tous les 40 matchs (500 vérifications profondes)
                if (g % 40 === 0 && analysis.evaluatedMoves.length > 0) {
                    liveCoachChecks += 1;
                    const sampleTurn = turns[0];
                    const logRes = analyzeHumanMoveFromLog({
                        logEntry: {
                            turnIndex: 1,
                            player: targetPlayer,
                            dice: sampleTurn.dice,
                            boardBefore: sampleTurn.boardBefore,
                            movePlayed: sampleTurn.moves,
                            boardAfter: sampleTurn.boardAfter,
                            timestamp: g,
                        },
                        localPlayer: targetPlayer,
                        ply: 0,
                    });
                    if (logRes) {
                        const { coachState } = buildCoachStateFromLogResult({
                            lastEntry: {
                                turnIndex: 1,
                                player: targetPlayer,
                                dice: sampleTurn.dice,
                                boardBefore: sampleTurn.boardBefore,
                                movePlayed: sampleTurn.moves,
                                boardAfter: sampleTurn.boardAfter,
                                timestamp: g,
                            },
                            result: { ...logRes, source: 'bgsage' },
                            playedMoves: sampleTurn.moves,
                            playedNotation: logRes.playedNotation,
                            gameState: {
                                ...createInitialState(7),
                                board: sampleTurn.boardBefore,
                                turn: targetPlayer,
                                dice: sampleTurn.dice,
                            },
                        });
                        if (!coachState.explanation || coachState.explanation.includes('undefined')) {
                            cubeCheckerConfusionCount += 1;
                        }
                        expect(coachState.features?.player).toBe(targetPlayer);
                    }
                }
            }

            function hasOpponentOwnedCubeInGame(gameIndex: number): boolean {
                return gameIndex % 40 === 0;
            }

        // Audit exhaustif des 170 messages de la banque Coach (13 catégories Pions × 10 + 4 catégories Videau × 10)
        const ALL_CHECKER_CATS: VariedCheckerCategory[] = [
            'SHOT_EXPOSURE', 'GOLDEN_POINT', 'BAR_POINT', 'PRIME_EXTEND',
            'TEMPO_HIT', 'REAR_ESCAPE', 'ENDGAME_CONTACT_BREAK', 'PURE_RACE',
            'HOME_GATE', 'ADVANCED_ANCHOR', 'BACK_SPLIT', 'MIDPOINT_UNSTACK',
            'POSITIONAL_FLEXIBILITY',
        ];
        const ALL_CUBE_CATS: VariedCubeCategory[] = [
            'PREMATURE_DOUBLE', 'OPTIMISTIC_TAKE', 'TIMID_PASS', 'MISSED_DOUBLE',
        ];

        for (const cat of ALL_CHECKER_CATS) {
            for (let v = 0; v < 10; v++) {
                const msg = pickVariedCheckerErrorCopy(cat, {
                    playedMove: '13/9 8/6',
                    optimalMove: '8/4 6/4',
                    equityLoss: -0.055,
                    seedExtra: `audit-${cat}-${v}`,
                });
                expect(msg.summary.length).toBeGreaterThan(15);
                expect(msg.whyFailed.length).toBeGreaterThan(15);
                expect(msg.whyOptimal.length).toBeGreaterThan(15);
                expect(msg.advice.length).toBeGreaterThan(15);
                expect(msg.summary).not.toContain('undefined');
                expect(msg.summary).not.toContain('NaN');
            }
        }

        for (const cat of ALL_CUBE_CATS) {
            for (let v = 0; v < 10; v++) {
                const msg = pickVariedCubeErrorCopy(cat, {
                    playedMove: 'Videau ×2',
                    optimalMove: 'Garder le videau',
                    equityLoss: -0.112,
                    seedExtra: `audit-cube-${cat}-${v}`,
                });
                expect(msg.summary.length).toBeGreaterThan(15);
                expect(msg.whyFailed.length).toBeGreaterThan(15);
                expect(msg.whyOptimal.length).toBeGreaterThan(15);
                expect(msg.advice.length).toBeGreaterThan(15);
                expect(msg.summary).not.toContain('undefined');
                expect(msg.summary).not.toContain('NaN');
            }
        }

        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
        const max = (arr: number[]) => Math.max(...arr);

        const gmAvg = avg(statsByArchetype.gm);
        const clubAvg = avg(statsByArchetype.club);
        const amateurAvg = avg(statsByArchetype.amateur);
        const chaosAvg = avg(statsByArchetype.chaos);
        const chaosMax = max(statsByArchetype.chaos);

        expect(totalDecisionsAudited).toBe(100000);
        expect(crawfordGamesAudited).toBe(1000);
        expect(liveCoachChecks).toBe(500);
        expect(nanOrInfinityCount).toBe(0);
        expect(cubeCheckerConfusionCount).toBe(0);

        // Hiérarchie stricte des PR : Grand-Maître < Club < Amateur < Chaos, et plafond < 55 même en Chaos
        expect(gmAvg).toBeLessThan(1.5);
        expect(clubAvg).toBeGreaterThan(gmAvg);
        expect(clubAvg).toBeLessThan(12);
        expect(amateurAvg).toBeGreaterThan(clubAvg);
        expect(amateurAvg).toBeLessThan(25);
        expect(chaosAvg).toBeGreaterThan(amateurAvg);
        expect(chaosMax).toBeLessThan(55);
    },
    120000,
    );

    it(
        '5. Audit Qualité du Contenu du Coach IA sur 50 000 textes générés (pertinence, grammaire, non-contradiction, 6 langues, Neuro-Symbolique & Bilan Post-Match)',
        () => {
            let totalAuditedTexts = 0;
            let badTokensCount = 0;
            let contradictionCount = 0;
            let grammarDefectCount = 0;
            let cubeCheckerConfusionCount = 0;
            let missingMoveReferenceCount = 0;
            let swellerHeadlineViolations = 0;

            const VERDICTS: Array<CoachPromptParams['verdict']> = [
                'optimal',
                'good',
                'doubtful',
                'blunder',
                'howler',
            ];
            const LOCALES: Array<NonNullable<CoachPromptParams['language']>> = [
                'fr',
                'en',
                'es',
                'pt',
                'de',
                'ar',
            ];
            const CHECKER_SCENARIOS: Array<{
                playedMove: string;
                optimalMove: string;
                userShots: number;
                bestShots: number;
                contactStatus: 'contact' | 'pureRace';
                tacticalDiff: NonNullable<NonNullable<CoachPromptParams['features']>['tacticalDiff']>;
            }> = [
                {
                    playedMove: '13/7',
                    optimalMove: '8/5 6/5',
                    userShots: 6,
                    bestShots: 0,
                    contactStatus: 'contact',
                    tacticalDiff: {
                        goldenPointCreatedByBest: true,
                        barPointCreatedByBest: false,
                        homeGateCreatedByBest: true,
                        primeExtendedByBest: false,
                        hitMadeByBest: false,
                        anchorCreatedOrKeptByBest: false,
                        rearCheckerEscapedByBest: false,
                        contactBrokenByBest: false,
                    },
                },
                {
                    playedMove: '24/21 13/9',
                    optimalMove: '8/5 6/5',
                    userShots: 0,
                    bestShots: 0,
                    contactStatus: 'contact',
                    tacticalDiff: {
                        goldenPointCreatedByBest: true,
                        barPointCreatedByBest: false,
                        homeGateCreatedByBest: true,
                        primeExtendedByBest: false,
                        hitMadeByBest: false,
                        anchorCreatedOrKeptByBest: false,
                        rearCheckerEscapedByBest: false,
                        contactBrokenByBest: false,
                    },
                },
                {
                    playedMove: '13/8 6/5',
                    optimalMove: '13/7 8/7',
                    userShots: 0,
                    bestShots: 0,
                    contactStatus: 'contact',
                    tacticalDiff: {
                        goldenPointCreatedByBest: false,
                        barPointCreatedByBest: true,
                        homeGateCreatedByBest: false,
                        primeExtendedByBest: false,
                        hitMadeByBest: false,
                        anchorCreatedOrKeptByBest: false,
                        rearCheckerEscapedByBest: false,
                        contactBrokenByBest: false,
                    },
                },
                {
                    playedMove: '13/9 13/8',
                    optimalMove: '9/4 6/4',
                    userShots: 0,
                    bestShots: 0,
                    contactStatus: 'contact',
                    tacticalDiff: {
                        goldenPointCreatedByBest: false,
                        barPointCreatedByBest: false,
                        homeGateCreatedByBest: true,
                        primeExtendedByBest: true,
                        hitMadeByBest: false,
                        anchorCreatedOrKeptByBest: false,
                        rearCheckerEscapedByBest: false,
                        contactBrokenByBest: false,
                    },
                },
                {
                    playedMove: '13/9 8/6',
                    optimalMove: '13/9* 9/7',
                    userShots: 1,
                    bestShots: 2,
                    contactStatus: 'contact',
                    tacticalDiff: {
                        goldenPointCreatedByBest: false,
                        barPointCreatedByBest: false,
                        homeGateCreatedByBest: false,
                        primeExtendedByBest: false,
                        hitMadeByBest: true,
                        anchorCreatedOrKeptByBest: false,
                        rearCheckerEscapedByBest: false,
                        contactBrokenByBest: false,
                    },
                },
                {
                    playedMove: '13/8 13/7',
                    optimalMove: '24/13',
                    userShots: 2,
                    bestShots: 2,
                    contactStatus: 'contact',
                    tacticalDiff: {
                        goldenPointCreatedByBest: false,
                        barPointCreatedByBest: false,
                        homeGateCreatedByBest: false,
                        primeExtendedByBest: false,
                        hitMadeByBest: false,
                        anchorCreatedOrKeptByBest: false,
                        rearCheckerEscapedByBest: true,
                        contactBrokenByBest: false,
                    },
                },
                {
                    playedMove: '6/2 5/3',
                    optimalMove: '10/4',
                    userShots: 0,
                    bestShots: 0,
                    contactStatus: 'contact',
                    tacticalDiff: {
                        goldenPointCreatedByBest: false,
                        barPointCreatedByBest: false,
                        homeGateCreatedByBest: false,
                        primeExtendedByBest: false,
                        hitMadeByBest: false,
                        anchorCreatedOrKeptByBest: false,
                        rearCheckerEscapedByBest: false,
                        contactBrokenByBest: true,
                    },
                },
                {
                    playedMove: '6/1 5/2',
                    optimalMove: '6/off 3/off',
                    userShots: 0,
                    bestShots: 0,
                    contactStatus: 'pureRace',
                    tacticalDiff: {
                        goldenPointCreatedByBest: false,
                        barPointCreatedByBest: false,
                        homeGateCreatedByBest: false,
                        primeExtendedByBest: false,
                        hitMadeByBest: false,
                        anchorCreatedOrKeptByBest: false,
                        rearCheckerEscapedByBest: false,
                        contactBrokenByBest: false,
                    },
                },
                {
                    playedMove: '20/15 20/16',
                    optimalMove: '13/8 13/9',
                    userShots: 0,
                    bestShots: 0,
                    contactStatus: 'contact',
                    tacticalDiff: {
                        goldenPointCreatedByBest: false,
                        barPointCreatedByBest: false,
                        homeGateCreatedByBest: false,
                        primeExtendedByBest: false,
                        hitMadeByBest: false,
                        anchorCreatedOrKeptByBest: true,
                        rearCheckerEscapedByBest: false,
                        contactBrokenByBest: false,
                    },
                },
                {
                    playedMove: '13/9 13/8',
                    optimalMove: '24/20 13/8',
                    userShots: 0,
                    bestShots: 1,
                    contactStatus: 'contact',
                    tacticalDiff: {
                        goldenPointCreatedByBest: false,
                        barPointCreatedByBest: false,
                        homeGateCreatedByBest: false,
                        primeExtendedByBest: false,
                        hitMadeByBest: false,
                        anchorCreatedOrKeptByBest: false,
                        rearCheckerEscapedByBest: false,
                        contactBrokenByBest: false,
                    },
                },
                {
                    playedMove: '8/4 6/4*',
                    optimalMove: '13/9 13/8',
                    userShots: 0,
                    bestShots: 0,
                    contactStatus: 'contact',
                    tacticalDiff: {
                        goldenPointCreatedByBest: false,
                        barPointCreatedByBest: false,
                        homeGateCreatedByBest: false,
                        primeExtendedByBest: false,
                        hitMadeByBest: false,
                        anchorCreatedOrKeptByBest: false,
                        rearCheckerEscapedByBest: false,
                        contactBrokenByBest: false,
                    },
                },
            ];

            const CUBE_SCENARIOS: Array<{ playedMove: string; optimalMove: string }> = [
                { playedMove: 'Videau : Doubler (×2)', optimalMove: 'No double, take' },
                { playedMove: 'Videau : Prendre (Take)', optimalMove: 'Double, pass' },
                { playedMove: 'Videau : Passer (Pass)', optimalMove: 'Double, take' },
                { playedMove: 'Videau non doublé (missed)', optimalMove: 'Double, take' },
            ];

            let firstBadSample = '';
            const checkTextIntegrity = (text: string | undefined, label = '') => {
                if (!text || text.trim().length === 0) {
                    if (!firstBadSample) firstBadSample = `EMPTY[${label}]`;
                    badTokensCount += 1;
                    return;
                }
                if (
                    text.includes('undefined') ||
                    text.includes('null') ||
                    text.includes('NaN') ||
                    text.includes('[object Object]') ||
                    text.includes('--0.') ||
                    text.includes('-0.000')
                ) {
                    if (!firstBadSample) firstBadSample = `BAD_TOKEN[${label}]: ${text}`;
                    badTokensCount += 1;
                }
                if (
                    text.includes('meilleur car votre coup sécurise davantage') ||
                    text.includes('1 blunder majeur ont coûté')
                ) {
                    contradictionCount += 1;
                }
                if (/, et [^.]*, et /.test(text)) {
                    grammarDefectCount += 1;
                }
            };

            // VOLET A : 35 000 explications complètes generateRuleBasedExplanation (Pions + Videau, 6 langues, contextes variés)
            for (let i = 0; i < 35000; i++) {
                const isCube = i % 7 === 6;
                const verdict = VERDICTS[i % VERDICTS.length];
                const language = LOCALES[i % LOCALES.length];
                const player: 'X' | 'O' = i % 2 === 0 ? 'X' : 'O';
                const rawLoss =
                    verdict === 'optimal'
                        ? 0
                        : verdict === 'good'
                          ? -0.012
                          : verdict === 'doubtful'
                            ? -0.045
                            : verdict === 'blunder'
                              ? -0.115
                              : -0.265;

                if (isCube) {
                    const cScen = CUBE_SCENARIOS[i % CUBE_SCENARIOS.length];
                    const playedMove = verdict === 'optimal' ? cScen.optimalMove : cScen.playedMove;
                    const res = generateRuleBasedExplanation({
                        verdict,
                        equityLoss: rawLoss,
                        playedMove,
                        optimalMove: cScen.optimalMove,
                        language,
                        features: {
                            player,
                            pipCountDiff: {
                                player: 110 + (i % 45),
                                opponent: 120 + (i % 40),
                                leader: 'X',
                                diff: -10,
                            },
                            blotsAndShots: { user: [], best: [] },
                            boardStructure: {
                                innerBoardPoints: 3,
                                advancedAnchor: true,
                                goldenPoint: true,
                                barPoint: false,
                                longestPrime: 3,
                            },
                            contactStatus: i % 3 === 0 ? 'pureRace' : 'contact',
                        },
                    });

                    totalAuditedTexts += 1;
                    checkTextIntegrity(res.summary);
                    checkTextIntegrity(res.explanation);
                    checkTextIntegrity(res.advice);
                    checkTextIntegrity(res.whyOptimal);
                    if (verdict !== 'optimal' && (language === 'fr' || language === 'en')) {
                        checkTextIntegrity(res.whyFailed);
                    }
                    if (res.pedagogical_explanation) {
                        const words = res.pedagogical_explanation.headline.trim().split(/\s+/).length;
                        if (words > 15) swellerHeadlineViolations += 1;
                    }
                } else {
                    const scen = CHECKER_SCENARIOS[i % CHECKER_SCENARIOS.length];
                    const playedMove = verdict === 'optimal' ? scen.optimalMove : scen.playedMove;
                    const res = generateRuleBasedExplanation({
                        verdict,
                        equityLoss: rawLoss,
                        playedMove,
                        optimalMove: scen.optimalMove,
                        language,
                        features: {
                            player,
                            pipCountDiff: {
                                player: 85 + (i % 75),
                                opponent: 95 + (i % 70),
                                leader: 'X',
                                diff: -10,
                            },
                            blotsAndShots: {
                                user:
                                    scen.userShots > 0
                                        ? [{ point: 7, directShots: scen.userShots, indirectShots: 0, totalShots: scen.userShots }]
                                        : [],
                                best:
                                    scen.bestShots > 0
                                        ? [{ point: 9, directShots: scen.bestShots, indirectShots: 0, totalShots: scen.bestShots }]
                                        : [],
                            },
                            shotExposure: {
                                user: {
                                    totalRolls: verdict === 'optimal' ? scen.bestShots : scen.userShots,
                                    directRolls: verdict === 'optimal' ? scen.bestShots : scen.userShots,
                                    indirectRolls: 0,
                                    hittingNumbers: [],
                                    duplicatedNumbers: [],
                                },
                                best: {
                                    totalRolls: scen.bestShots,
                                    directRolls: scen.bestShots,
                                    indirectRolls: 0,
                                    hittingNumbers: [],
                                    duplicatedNumbers: [],
                                },
                            },
                            boardStructure: {
                                innerBoardPoints: 2 + (i % 4),
                                advancedAnchor: i % 3 === 0,
                                goldenPoint: scen.tacticalDiff.goldenPointCreatedByBest,
                                barPoint: scen.tacticalDiff.barPointCreatedByBest,
                                longestPrime: 3 + (i % 3),
                            },
                            tacticalDiff: scen.tacticalDiff,
                            contactStatus: scen.contactStatus,
                            marketWindow:
                                i % 10 === 0
                                    ? {
                                          doublePoint: 0.66,
                                          cashPoint: 0.76,
                                          inMarketWindow: true,
                                          volatility: 'high',
                                          estimatedMarketLosers: 11,
                                      }
                                    : undefined,
                        },
                        matchContext:
                            i % 5 === 0
                                ? buildMatchContext({
                                      scoreX: 6,
                                      scoreO: 6,
                                      matchLength: 7,
                                      cubeValue: 1,
                                      cubeOwner: null,
                                      crawford: false,
                                  })
                                : i % 5 === 1
                                  ? buildMatchContext({
                                        scoreX: 6,
                                        scoreO: 4,
                                        matchLength: 7,
                                        cubeValue: 1,
                                        cubeOwner: null,
                                        crawford: true,
                                    })
                                  : undefined,
                    });

                    totalAuditedTexts += 1;
                    checkTextIntegrity(res.summary);
                    checkTextIntegrity(res.explanation);
                    checkTextIntegrity(res.advice);
                    checkTextIntegrity(res.whyOptimal);

                    // Un coup de pions ne doit JAMAIS déclencher un résumé d'erreur de Videau
                    if (
                        /Double prématuré|Take trop optimiste|Pass trop frileux|Videau oublié/i.test(
                            res.summary,
                        )
                    ) {
                        cubeCheckerConfusionCount += 1;
                    }

                    // Un coup non-optimal avec écart réel ne doit JAMAIS afficher "Coup optimal ✅"
                    if (verdict !== 'optimal' && playedMove !== scen.optimalMove && Math.abs(rawLoss) >= 0.005) {
                        if (res.summary.includes('Coup optimal ✅') || res.summary.includes('Optimal play ✅')) {
                            contradictionCount += 1;
                        }
                        if (!res.explanation.includes(playedMove) || !res.explanation.includes(scen.optimalMove)) {
                            missingMoveReferenceCount += 1;
                        }
                    }

                    if (res.pedagogical_explanation) {
                        const words = res.pedagogical_explanation.headline.trim().split(/\s+/).length;
                        if (words > 15) swellerHeadlineViolations += 1;
                    }
                }
            }

            // VOLET B : 10 000 diagnostics tactiques explainTacticalDifference + Micro-copie Bi-Niveau
            for (let i = 0; i < 10000; i++) {
                const player: 'X' | 'O' = i % 2 === 0 ? 'X' : 'O';
                const sign = player === 'X' ? 1 : -1;
                const before = new Array<number>(26).fill(0);
                const optimal = new Array<number>(26).fill(0);
                const played = new Array<number>(26).fill(0);

                // Configure des combinaisons variées de 1 à 5 motifs simultanés (incluant blotsPlayed < blotsOptimal)
                before[player === 'X' ? 13 : 12] = 5 * sign;
                before[player === 'X' ? 24 : 1] = 2 * sign;
                before[player === 'X' ? 8 : 17] = 3 * sign;
                before[player === 'X' ? 6 : 19] = 5 * sign;

                optimal[player === 'X' ? 13 : 12] = (i % 3 === 0 ? 3 : 4) * sign;
                optimal[player === 'X' ? 24 : 1] = (i % 2 === 0 ? 1 : 2) * sign;
                optimal[player === 'X' ? 20 : 5] = (i % 2 === 0 ? 1 : 0) * sign;
                optimal[player === 'X' ? 5 : 20] = (i % 4 === 0 ? 2 : 1) * sign;
                optimal[player === 'X' ? 4 : 21] = (i % 5 === 0 ? 2 : 0) * sign;
                optimal[player === 'X' ? 7 : 18] = (i % 6 === 0 ? 2 : 0) * sign;

                played[player === 'X' ? 13 : 12] = 5 * sign;
                played[player === 'X' ? 24 : 1] = 2 * sign;
                played[player === 'X' ? 6 : 19] = (5 + (i % 3)) * sign;
                if (i % 4 === 1) {
                    played[player === 'X' ? 10 : 15] = 1 * sign;
                    played[player === 'X' ? 11 : 14] = 1 * sign;
                }

                const tac = explainTacticalDifference({
                    boardBefore: before,
                    boardOptimal: optimal,
                    boardPlayed: played,
                    player,
                    equityLoss: -0.02 * ((i % 8) + 1),
                });

                totalAuditedTexts += 1;
                checkTextIntegrity(tac.summary);

                // Aucun doublon dans la liste des concepts
                const uniqueConcepts = new Set(tac.concepts);
                if (uniqueConcepts.size !== tac.concepts.length) {
                    grammarDefectCount += 1;
                }

                // Vérifie aussi la micro-copie Niveau 1 / Niveau 2 (18–28 mots max)
                const biCopy = buildBiLevelCoachMicroCopy({
                    equityLossEmg: 0.015 * ((i % 10) + 1),
                    directShotsConceded: i % 15,
                    dominantTheme: (['BLITZ', 'PRIME', 'RACE', 'HOLDING', 'BEAROFF'] as const)[i % 5],
                    recurringErrorCount: (i % 5) + 1,
                    locale: i % 2 === 0 ? 'fr' : 'en',
                });
                checkTextIntegrity(biCopy.bulletDiagnostic);
                checkTextIntegrity(biCopy.bulletAction);
                checkTextIntegrity(biCopy.proTelemetryLine);
                if (biCopy.wordCountLevel1 > 28) {
                    grammarDefectCount += 1;
                }
            }

            // VOLET C : 5 000 cours et bilans de fin de partie generateRuleBasedGameReview (FR & EN, 0 à 4 blunders)
            for (let i = 0; i < 5000; i++) {
                const blunderCount = i % 5;
                const doubtfulCount = i % 3;
                const optimalCount = 12 + (i % 8);
                const pr = Number((blunderCount * 3.8 + doubtfulCount * 1.1 + (i % 10) * 0.15).toFixed(2));
                const analysis: CompleteGameAnalysis = {
                    id: `audit-review-${i}`,
                    gameId: `game-${i}`,
                    date: '2026-10-30T12:00:00.000Z',
                    player: i % 2 === 0 ? 'X' : 'O',
                    opponentType: 'ai',
                    opponentDifficulty: 'expert',
                    winner: i % 3 === 0 ? 'O' : 'X',
                    winType: 'single',
                    pointsWon: 1,
                    scoreX: 5,
                    scoreO: 3,
                    matchLength: i % 4 === 0 ? 0 : 7,
                    totalMovesCount: 30,
                    decisionsCount: optimalCount + doubtfulCount + blunderCount,
                    unforcedDecisionsCount: optimalCount + doubtfulCount + blunderCount,
                    totalEquityLoss: Number((blunderCount * 0.095 + doubtfulCount * 0.035).toFixed(3)),
                    errorRate: 0.02,
                    performanceRating: pr,
                    estimatedRating: 1650,
                    prCategory: pr < 5 ? 'Grand-Maître' : pr < 10 ? 'Avancé' : 'Intermédiaire',
                    breakdown: {
                        optimal: optimalCount,
                        acceptable: 2,
                        doubtful: doubtfulCount,
                        blunder: blunderCount,
                        howler: 0,
                    },
                    evaluatedMoves:
                        blunderCount > 0
                            ? [
                                  {
                                      moveNumber: 4,
                                      player: i % 2 === 0 ? 'X' : 'O',
                                      dice: [5, 3],
                                      boardBefore: createInitialState(7).board,
                                      boardAfter: createInitialState(7).board,
                                      playedNotation: '13/8 13/10',
                                      optimalNotation: '8/3 6/3',
                                      equityLoss: -0.095,
                                      verdict: 'blunder',
                                      isUnforced: true,
                                      candidateCount: 8,
                                      conceptId: 'golden-point',
                                  },
                              ]
                            : [],
                };

                const review = generateRuleBasedGameReview({
                    analysis,
                    opponentPr: 3.4,
                    matchDurationSeconds: 240 + (i % 300),
                    language: i % 2 === 0 ? 'fr' : 'en',
                });

                totalAuditedTexts += 1;
                checkTextIntegrity(review.title);
                checkTextIntegrity(review.summary);
                checkTextIntegrity(review.diagnostic);
                checkTextIntegrity(review.keyConcept?.title);
                checkTextIntegrity(review.keyConcept?.explanation);
                for (const w of review.weaknesses) checkTextIntegrity(w);
                for (const s of review.strengths) checkTextIntegrity(s);
            }

            expect(totalAuditedTexts).toBe(50000);
            expect(firstBadSample).toBe('');
            expect(badTokensCount).toBe(0);
            expect(contradictionCount).toBe(0);
            expect(grammarDefectCount).toBe(0);
            expect(cubeCheckerConfusionCount).toBe(0);
            expect(missingMoveReferenceCount).toBe(0);
            expect(swellerHeadlineViolations).toBe(0);
        },
        120000,
    );
});
