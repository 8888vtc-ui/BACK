import { describe, it, expect } from 'vitest';
import {
    createInitialState,
    generateLegalMoves,
    serializeXGID,
    type BoardState,
    type Player,
} from './backgammonEngine';
import {
    evaluateWin,
    type AIDifficulty,
} from './aiHeuristics';
import {
    evaluateWithBgsage,
    selectBotMoveWithBgsage,
    evaluateBotCubeWithBgsage,
    bgsageMoveBoardToProjectBoard,
    boardsMatchOnPoints,
    isBgsageAvailable,
    resolveBgsageBaseUrl,
} from '../lib/engine/bgsageClient';

function createSeededRandom(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0x100000000;
    };
}

function rollDeterministicDice(rng: () => number): [number, number] {
    const d1 = Math.floor(rng() * 6) + 1;
    const d2 = Math.floor(rng() * 6) + 1;
    return [d1, d2];
}

describe('Contrôle de Qualité & Benchmark PR — Moteur Unique Open Sage (bgsage-service sur Google Cloud Run)', () => {
    it('1. Vérifie la disponibilité et la précision d’Open Sage (Cloud Run) pour X et O au lancer 3-1', async () => {
        const available = await isBgsageAvailable(10000);
        expect(available).toBe(true);

        // Test pour X (Blanc) avec 3-1 en position initiale
        const stateX: BoardState = {
            ...createInitialState(7),
            turn: 'X',
            dice: [3, 1],
        };
        const legalX = generateLegalMoves(stateX, [3, 1]);
        const choiceX = await selectBotMoveWithBgsage(stateX, legalX, 'grandmaster', 10000);
        expect(choiceX).not.toBeNull();
        expect(choiceX!.sequence.board[5]).toBe(2);
        expect(choiceX!.sequence.board[6]).toBe(4);
        expect(choiceX!.sequence.board[8]).toBe(2);
        expect(choiceX!.cubeDecision?.optimalAction).toBe('No Double');

        // Test pour O (Noir / Bot IA) avec 3-1 en position initiale
        const stateO: BoardState = {
            ...createInitialState(7),
            turn: 'O',
            dice: [3, 1],
        };
        const legalO = generateLegalMoves(stateO, [3, 1]);
        const choiceO = await selectBotMoveWithBgsage(stateO, legalO, 'grandmaster', 10000);
        expect(choiceO).not.toBeNull();
        expect(choiceO!.sequence.board[20]).toBe(-2);
        expect(choiceO!.sequence.board[19]).toBe(-4);
        expect(choiceO!.sequence.board[17]).toBe(-2);
    }, 30000);

    it(
        '2. Mesure le vrai PR et Error Rate des 4 niveaux de Bots (Beginner, Intermediate, Expert, Grandmaster) branchés sur Open Sage',
        async () => {
            const rng = createSeededRandom(20261022);
            const corpus: Array<{ state: BoardState; dice: [number, number] }> = [];
            let state = createInitialState(7);

            // Génère 20 positions variées (X et O au trait, contact, course, frappes)
            for (let step = 0; step < 150 && corpus.length < 20; step++) {
                const player: Player = step % 2 === 0 ? 'X' : 'O';
                const dice = rollDeterministicDice(rng);
                const turnState: BoardState = { ...state, turn: player, dice };
                const legal = generateLegalMoves(turnState, dice);

                if (legal.length === 0) continue;

                if (legal.length >= 5) {
                    corpus.push({
                        state: { ...turnState, board: [...turnState.board] },
                        dice,
                    });
                }

                const chosen = legal[Math.floor(rng() * legal.length)];
                if (evaluateWin(chosen.board, 1)) {
                    state = createInitialState(7);
                } else {
                    state = { ...state, board: chosen.board };
                }
            }

            expect(corpus.length).toBe(20);

            const difficulties: AIDifficulty[] = ['grandmaster', 'expert', 'intermediate', 'beginner'];
            const stats: Record<
                AIDifficulty,
                {
                    decisions: number;
                    totalEquityLoss: number;
                    optimalCount: number;
                    goodCount: number;
                    inaccuracyCount: number;
                    blunderCount: number;
                }
            > = {
                grandmaster: { decisions: 0, totalEquityLoss: 0, optimalCount: 0, goodCount: 0, inaccuracyCount: 0, blunderCount: 0 },
                expert: { decisions: 0, totalEquityLoss: 0, optimalCount: 0, goodCount: 0, inaccuracyCount: 0, blunderCount: 0 },
                intermediate: { decisions: 0, totalEquityLoss: 0, optimalCount: 0, goodCount: 0, inaccuracyCount: 0, blunderCount: 0 },
                beginner: { decisions: 0, totalEquityLoss: 0, optimalCount: 0, goodCount: 0, inaccuracyCount: 0, blunderCount: 0 },
            };

            const botRng = createSeededRandom(777);

            for (const item of corpus) {
                const legal = generateLegalMoves(item.state, item.dice);
                const xgid = serializeXGID(item.state);

                // Interroge Open Sage sur Cloud Run aux 3 profondeurs (3-ply, 2-ply, 1-ply)
                const [eval3Ply, eval2Ply, eval1Ply] = await Promise.all([
                    evaluateWithBgsage(xgid, 3, 15000),
                    evaluateWithBgsage(xgid, 2, 15000),
                    evaluateWithBgsage(xgid, 1, 15000),
                ]);
                expect(eval3Ply).not.toBeNull();
                expect(eval2Ply).not.toBeNull();
                expect(eval1Ply).not.toBeNull();

                const bestOracleEq =
                    eval3Ply!.chequerPlay[0].cubelessEquity ?? eval3Ply!.chequerPlay[0].equity;

                const oracleCandidates = eval3Ply!.chequerPlay
                    .filter((m) => m.board && m.board.length === 26)
                    .map((m) => ({
                        projBoard: bgsageMoveBoardToProjectBoard(m.board!, item.state.turn),
                        loss: Math.max(0, bestOracleEq - (m.cubelessEquity ?? m.equity)),
                    }));

                const gmChoice = await selectBotMoveWithBgsage(item.state, legal, 'grandmaster', 10000, botRng, eval3Ply);
                const expChoice = await selectBotMoveWithBgsage(item.state, legal, 'expert', 10000, botRng, eval2Ply);
                const intChoice = await selectBotMoveWithBgsage(item.state, legal, 'intermediate', 10000, botRng, eval1Ply);
                const begChoice = await selectBotMoveWithBgsage(item.state, legal, 'beginner', 10000, botRng, eval1Ply);

                const choices: Record<AIDifficulty, typeof gmChoice> = {
                    grandmaster: gmChoice,
                    expert: expChoice,
                    intermediate: intChoice,
                    beginner: begChoice,
                };

                for (const diff of difficulties) {
                    const c = choices[diff];
                    expect(c).not.toBeNull();
                    const matchedOracle = oracleCandidates.find((oc) =>
                        boardsMatchOnPoints(c!.sequence.board, oc.projBoard),
                    );
                    const loss = matchedOracle ? matchedOracle.loss : 0;

                    stats[diff].decisions += 1;
                    stats[diff].totalEquityLoss += loss;
                    if (loss <= 0.001) stats[diff].optimalCount += 1;
                    else if (loss <= 0.02) stats[diff].goodCount += 1;
                    else if (loss <= 0.08) stats[diff].inaccuracyCount += 1;
                    else stats[diff].blunderCount += 1;
                }
            }

            const summary = difficulties.map((diff) => {
                const s = stats[diff];
                const avgErr = s.totalEquityLoss / s.decisions;
                const pr = avgErr * 500;
                return {
                    bot: diff,
                    engine:
                        diff === 'grandmaster'
                            ? 'Open Sage 3-ply'
                            : diff === 'expert'
                              ? 'Open Sage 2-ply'
                              : diff === 'intermediate'
                                ? 'Open Sage 1-ply'
                                : 'Open Sage 1-ply + Bruit (±0.06 Eq)',
                    decisions: s.decisions,
                    snowieErrorRate: Number(avgErr.toFixed(4)),
                    PR: Number(pr.toFixed(2)),
                    optimalPct: Number(((s.optimalCount / s.decisions) * 100).toFixed(1)),
                    goodCount: s.goodCount,
                    inaccuracyCount: s.inaccuracyCount,
                    blunderCount: s.blunderCount,
                };
            });

            // eslint-disable-next-line no-console
            console.log('=== RAPPORT DE BENCHMARK OFFICIEL — OPEN SAGE (GOOGLE CLOUD RUN) ===');
            // eslint-disable-next-line no-console
            console.log(JSON.stringify(summary, null, 2));

            expect(stats.grandmaster.totalEquityLoss).toBe(0);
            expect(stats.expert.totalEquityLoss).toBeLessThanOrEqual(stats.intermediate.totalEquityLoss);
            expect(stats.intermediate.totalEquityLoss).toBeLessThan(stats.beginner.totalEquityLoss);
        },
        120000,
    );

    it('3. Vérifie le mode Self-Play natif d’Open Sage sur Google Cloud Run (2-ply vs 1-ply)', async () => {
        const base = resolveBgsageBaseUrl();
        const resp = await fetch(`${base}/api/selfplay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player1_ply: 2,
                player2_ply: 1,
                games: 2,
                seed: 42,
            }),
        });
        expect(resp.ok).toBe(true);
        const data = await resp.json();
        expect(data.results.length).toBe(2);
        for (const r of data.results) {
            expect(r.error).toBeUndefined();
            expect([1, 2]).toContain(r.winner);
            expect(r.turns).toBeGreaterThan(5);
        }
    }, 60000);

    it('4. Vérifie la prise en charge du Videau (Cube: Double / Take / Pass / Crawford) par Open Sage sur Cloud Run', async () => {
        // Cas A : Position initiale (équité ~0.00) -> Pas de double, et Take évident si l'adversaire double par erreur
        const openingState: BoardState = {
            ...createInitialState(7),
            turn: 'O',
            dice: null,
        };
        const openingCube = await evaluateBotCubeWithBgsage(openingState, 'grandmaster', 10000);
        expect(openingCube).not.toBeNull();
        expect(openingCube!.shouldDouble).toBe(false);

        const openingTakeCheck = await evaluateBotCubeWithBgsage(
            { ...openingState, turn: 'X' },
            'grandmaster',
            10000,
        );
        expect(openingTakeCheck).not.toBeNull();
        expect(openingTakeCheck!.shouldTake).toBe(true);

        // Cas B : Position écrasante pour X (X a déjà sorti 13 pions, 2 pions sur le point 1 ; O est bloqué au fond)
        // Si X double O, O doit refuser (PASS_DOUBLE -> shouldTake === false car doubleTake > 1.0)
        const crushingBoard = new Array(26).fill(0);
        crushingBoard[1] = 2; // X a 2 pions sur l'as (13 déjà sortis)
        crushingBoard[24] = -15; // O a ses 15 pions encore sur le point 1
        const crushingStateForX: BoardState = {
            ...createInitialState(7),
            board: crushingBoard,
            turn: 'X',
            dice: null,
        };
        const crushingCube = await evaluateBotCubeWithBgsage(crushingStateForX, 'grandmaster', 10000);
        expect(crushingCube).not.toBeNull();
        expect(crushingCube!.doubleTake).toBeGreaterThan(1.0);
        expect(crushingCube!.shouldTake).toBe(false); // Le bot O passe (PASS_DOUBLE)

        // Cas C : Règle de Crawford active -> Interdiction stricte de doubler
        const crawfordState: BoardState = {
            ...openingState,
            crawford: true,
        };
        const crawfordCube = await evaluateBotCubeWithBgsage(crawfordState, 'grandmaster', 10000);
        expect(crawfordCube).not.toBeNull();
        expect(crawfordCube!.shouldDouble).toBe(false);
        expect(crawfordCube!.optimalAction).toBe('No Double (Crawford)');
    }, 30000);
});
