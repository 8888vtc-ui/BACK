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
} from '../coach/coachVariedMessagesBank';
import { analyzeCompleteGame } from './gameAnalyzer';
import type { RawGameTurn } from './types';

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
        expect(analysis.performanceRating).toBeLessThan(40);
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
});
