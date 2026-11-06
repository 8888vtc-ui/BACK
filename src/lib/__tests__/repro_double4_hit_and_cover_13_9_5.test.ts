import { describe, it, expect } from 'vitest';
import { applyMove, generateLegalMoves, type BoardState, type Move } from '../../engine/backgammonEngine';
import {
    applyBgsageNotationToBoard,
    formatCoachMoveSequence,
    parseCoachNotationMoves,
} from '../../features/coach/coachMoveNotation';
import {
    computeVerifiedBoardFacts,
    verifyCheckersPhysicallyExistOnBoard,
} from '../../features/coach/turnSnapshot';
import { buildHumanMoveAnalysisFromBgsageResult } from '../../features/coach/logAnalyzerBgsageBuilder';
import { generateRuleBasedExplanation, extractStrategicFeatures } from '../../features/coach';
import { detectClassicalBlunderPattern } from '../../features/personas/botEcosystemEngine';
import { countShotsExact } from '../engine/shotCounter';
import type { MatchLogEntry } from '../../actions/types';
import type { BgsageEvaluateResponse } from '../engine/bgsageClient';

describe('Autopsie & Réparation : Double 4 (4-4) — 13/9* 13/9 9/5 9/5 vs 6/2(4) (image_025568.jpg)', () => {
    /**
     * Plateau exact avant le coup :
     * - Blanc (X) : 2 sur 24, 5 sur 13, 3 sur 8, 5 sur 6 (total = 15 pions)
     * - Noir (O)  : 1 blot sur 9 (-1), 5 sur 12 (-5), 1 sur 3 (-1), 8 sur 19 (-8) (total = 15 pions)
     */
    function createBoardBeforeDouble4(): number[] {
        const board = new Array(26).fill(0);
        board[24] = 2;
        board[13] = 5;
        board[8] = 3;
        board[6] = 5;

        board[19] = -8;
        board[12] = -5;
        board[9] = -1;
        board[3] = -1;
        return board;
    }

    const playedSubMoves: Move[] = [
        { from: 13, to: 9 },
        { from: 13, to: 9 },
        { from: 9, to: 5 },
        { from: 9, to: 5 },
    ];

    it('1. Applique physiquement 13/9* 13/9 9/5 9/5 : boardAfter[13]=3, boardAfter[9]=0, boardAfter[5]=2, O_BAR=-1 et 0 blot', () => {
        const boardBefore = createBoardBeforeDouble4();
        let boardAfter = [...boardBefore];
        for (const m of playedSubMoves) {
            boardAfter = applyMove(boardAfter, m, 'X');
        }

        expect(boardAfter[13]).toBe(3);
        expect(boardAfter[9]).toBe(0);
        expect(boardAfter[5]).toBe(2);
        expect(boardAfter[25]).toBe(-1); // 1 pion noir envoyé sur la barre (O_BAR = 25)

        const realBlotsAfterPlayed: number[] = [];
        for (let p = 1; p <= 24; p++) {
            if (boardAfter[p] === 1) realBlotsAfterPlayed.push(p);
        }
        expect(realBlotsAfterPlayed).toEqual([]);

        const notation = formatCoachMoveSequence(playedSubMoves, 'X', boardBefore);
        expect(notation).toBe('13/9* 13/9 9/5 9/5');
    });

    it('2. Décode et simule à l’identique 13/9*/5(2), 13/5*(2) et 13/9* 13/9 9/5 9/5 avec frappe intermédiaire sur 9', () => {
        const boardBefore = createBoardBeforeDouble4();
        const dice: [number, number] = [4, 4];

        const simChained = applyBgsageNotationToBoard(boardBefore, '13/9*/5(2)', dice, 'X');
        const simCompound = applyBgsageNotationToBoard(boardBefore, '13/5*(2)', dice, 'X');
        const simExpanded = applyBgsageNotationToBoard(boardBefore, '13/9* 13/9 9/5 9/5', dice, 'X');

        expect(simChained).not.toBeNull();
        expect(simCompound).not.toBeNull();
        expect(simExpanded).not.toBeNull();

        for (const sim of [simChained!, simCompound!, simExpanded!]) {
            expect(sim[13]).toBe(3);
            expect(sim[9]).toBe(0);
            expect(sim[5]).toBe(2);
            expect(sim[25]).toBe(-1);
        }

        expect(parseCoachNotationMoves('13/9*/5(2)', 'X', dice)).toHaveLength(4);
        expect(verifyCheckersPhysicallyExistOnBoard('13/9* 13/9 9/5 9/5', boardBefore, 'X', dice)).toBe(true);
        expect(verifyCheckersPhysicallyExistOnBoard('13/9*/5(2)', boardBefore, 'X', dice)).toBe(true);
    });

    it('3. Ne retombe JAMAIS sur legalSeqs[0] (6/2 6/2 6/2 6/2) et classe 13/9* 13/9 9/5 9/5 comme Optimal (0.000 EMG)', () => {
        const boardBefore = createBoardBeforeDouble4();
        let boardAfter = [...boardBefore];
        for (const m of playedSubMoves) {
            boardAfter = applyMove(boardAfter, m, 'X');
        }

        const evalState: BoardState = {
            board: boardBefore,
            turn: 'X',
            dice: [4, 4],
            cubeValue: 1,
            cubeOwner: null,
            matchLength: 7,
            scoreX: 0,
            scoreO: 0,
            crawford: false,
            doubled: false,
            resigned: 0,
        };
        const legalSeqs = generateLegalMoves(evalState, [4, 4]);
        // Vérifie que legalSeqs[0] est bien 6/2(4) (la cause historique du bug de fallback)
        expect(formatCoachMoveSequence(legalSeqs[0].moves, 'X', boardBefore)).toBe('6/2 6/2 6/2 6/2');

        const logEntry: MatchLogEntry = {
            turnIndex: 4,
            player: 'X',
            dice: [4, 4],
            boardBefore,
            boardAfter,
            movePlayed: playedSubMoves,
            notation: '13/9* 13/9 9/5 9/5',
        };

        const bgsageResponse: BgsageEvaluateResponse = {
            isRace: false,
            source: 'bgsage-stage11',
            gamePlans: { player: 'priming', opponent: 'contact' },
            cubeDecision: {
                noDouble: 0.642,
                doubleTake: 0.511,
                doublePass: 1.0,
                optimalAction: 'no_double',
            },
            chequerPlay: [
                {
                    rank: 1,
                    notation: '13/9*/5(2)',
                    equity: 0.642,
                    cubelessEquity: 0.584,
                    equityLoss: 0,
                    evalLevel: '3-ply',
                    probabilities: {
                        win: 0.718,
                        winGammon: 0.284,
                        winBackgammon: 0.012,
                        loseWin: 0.282,
                        loseGammon: 0.041,
                        loseBackgammon: 0.001,
                    },
                },
                {
                    rank: 2,
                    notation: '13/9* 13/5 8/4(2)',
                    equity: 0.511,
                    cubelessEquity: 0.472,
                    equityLoss: 0.131,
                    evalLevel: '3-ply',
                    probabilities: {
                        win: 0.664,
                        winGammon: 0.231,
                        winBackgammon: 0.009,
                        loseWin: 0.336,
                        loseGammon: 0.052,
                        loseBackgammon: 0.002,
                    },
                },
            ],
        };

        const analysis = buildHumanMoveAnalysisFromBgsageResult({
            bgsageResult: bgsageResponse,
            logEntry,
            evalState,
            legalSeqs,
            boardBefore,
            effectiveBoardAfter: boardAfter,
            targetPly: 3,
        });

        expect(analysis).not.toBeNull();
        expect(analysis!.verdict).toBe('optimal');
        expect(analysis!.equityLoss).toBe(0);
        expect(analysis!.optimalNotation).not.toContain('6/2 6/2 6/2 6/2');
        expect(analysis!.optimalNotation).toBe('13/9* 13/9 9/5 9/5');
    });

    it('4. computeVerifiedBoardFacts & generateRuleBasedExplanation ne mentionnent JAMAIS "pion(s) isolé(s) sur flèche 13" ni "11 lancers sur 36"', () => {
        const boardBefore = createBoardBeforeDouble4();
        let boardAfter = [...boardBefore];
        for (const m of playedSubMoves) {
            boardAfter = applyMove(boardAfter, m, 'X');
        }

        const facts = computeVerifiedBoardFacts(boardBefore, boardAfter, boardAfter);
        expect(facts.realBlotsAfterPlayed).toEqual([]);
        expect(facts.directShotsOnPlayerAfterPlayed).toBe(0);
        expect(facts.summaryText).not.toContain('flèche 13');

        const stateBefore: BoardState = {
            board: boardBefore,
            turn: 'X',
            dice: [4, 4],
            cubeValue: 1,
            cubeOwner: null,
            matchLength: 7,
            scoreX: 0,
            scoreO: 0,
            crawford: false,
            doubled: false,
            resigned: 0,
        };
        const stateAfter: BoardState = { ...stateBefore, board: boardAfter };
        const features = extractStrategicFeatures(stateBefore, stateAfter, stateAfter);
        expect(features.blotsAndShots.user).toEqual([]);
        expect(features.shotExposure?.user.totalRolls).toBe(0);

        const explanation = generateRuleBasedExplanation({
            verdict: 'optimal',
            equityLoss: 0,
            playedMove: '13/9* 13/9 9/5 9/5',
            optimalMove: '13/9* 13/9 9/5 9/5',
            features,
            language: 'fr',
        });
        expect(explanation.explanation).not.toContain('pion(s) isolé(s) sur flèche 13');
        expect(explanation.whyFailed).toBe('');

        const pattern = detectClassicalBlunderPattern({ boardBefore, boardAfter });
        expect(pattern).not.toBe('RECKLESS_HIT_EXPOSURE');
    });

    it('5. shotCounter respecte l’obligation de réentrée depuis la barre adverse avant de compter les tirs depuis la flèche 12', () => {
        const boardWithBlotOn13AndOppOnBar = createBoardBeforeDouble4();
        // Simule le cas où il ne restait qu'un seul pion sur 13 après avoir fermé la porte 5 et envoyé O à la barre
        boardWithBlotOn13AndOppOnBar[13] = 1;
        boardWithBlotOn13AndOppOnBar[7] = 2;
        boardWithBlotOn13AndOppOnBar[5] = 2;
        boardWithBlotOn13AndOppOnBar[9] = 0;
        boardWithBlotOn13AndOppOnBar[25] = -1; // O est sur la barre ! Cases 5 et 6 fermées par X.

        const shots = countShotsExact(boardWithBlotOn13AndOppOnBar, 13, 'O');
        // Les lancers 1-5, 5-1, 1-6, 6-1 ne peuvent PAS frapper en 13 depuis 12 car le 5 et le 6 sont bloqués par les portes 5 et 6 de X,
        // obligeant O à utiliser son as pour rentrer en case 1 (Bar/1) ! Le total de tirs est donc 7 (1-1, 1-2, 2-1, 1-3, 3-1, 1-4, 4-1), jamais 11.
        expect(shots.total).toBe(7);
        expect(shots.total).not.toBe(11);
    });
});
