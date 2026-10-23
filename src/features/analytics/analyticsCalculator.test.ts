import { describe, it, expect } from 'vitest';
import {
    classifyMoveType,
    classifyGamePhase,
    classifyTacticalTheme,
    calculateTacticalBlunderHeatmap,
    calculateMoveTypeMetrics,
    generateConceptsHeatmap,
    calculateProgressionTimeline,
    computeAnalyticsSummary,
} from './analyticsCalculator';
import type { EvaluatedTurn, CompleteGameAnalysis } from '../rating/types';

describe('Analytics Calculator', () => {
    describe('classifyMoveType', () => {
        it('classifie les ouvertures au premier coup', () => {
            const turn: EvaluatedTurn = {
                moveNumber: 1,
                player: 'X',
                dice: [3, 1],
                boardBefore: new Array(28).fill(0),
                boardAfter: new Array(28).fill(0),
                playedNotation: '8/5 6/5',
                optimalNotation: '8/5 6/5',
                equityLoss: 0,
                verdict: 'optimal',
                isUnforced: true,
                candidateCount: 6,
            };
            expect(classifyMoveType(turn)).toBe('opening');
        });

        it('identifie les coups de sortie de pions (bear-off)', () => {
            const turn: EvaluatedTurn = {
                moveNumber: 15,
                player: 'X',
                dice: [4, 2],
                boardBefore: new Array(28).fill(0),
                boardAfter: new Array(28).fill(0),
                playedNotation: '4/off 2/off',
                optimalNotation: '4/off 2/off',
                equityLoss: 0,
                verdict: 'optimal',
                isUnforced: true,
                candidateCount: 4,
            };
            expect(classifyMoveType(turn)).toBe('bear_off');
        });

        it('identifie les frappes et attaques avec astérisque ou barre', () => {
            const turn: EvaluatedTurn = {
                moveNumber: 4,
                player: 'X',
                dice: [5, 3],
                boardBefore: new Array(28).fill(0),
                boardAfter: new Array(28).fill(0),
                playedNotation: '13/8 8/5*',
                optimalNotation: '13/8 8/5*',
                equityLoss: 0,
                verdict: 'optimal',
                isUnforced: true,
                candidateCount: 10,
            };
            expect(classifyMoveType(turn)).toBe('hit_attack');
        });

        it('identifie l’ancrage défensif et les mouvements arrière', () => {
            const turn: EvaluatedTurn = {
                moveNumber: 5,
                player: 'X',
                dice: [4, 3],
                boardBefore: new Array(28).fill(0),
                boardAfter: new Array(28).fill(0),
                playedNotation: '24/20 13/10',
                optimalNotation: '24/20 13/10',
                equityLoss: 0,
                verdict: 'optimal',
                isUnforced: true,
                candidateCount: 8,
            };
            expect(classifyMoveType(turn)).toBe('anchor_defense');
        });

        it('identifie la fabrication de porte (point making)', () => {
            const turn: EvaluatedTurn = {
                moveNumber: 3,
                player: 'X',
                dice: [4, 2],
                boardBefore: new Array(28).fill(0),
                boardAfter: new Array(28).fill(0),
                playedNotation: '8/4 6/4',
                optimalNotation: '8/4 6/4',
                equityLoss: 0,
                verdict: 'optimal',
                isUnforced: true,
                candidateCount: 8,
            };
            expect(classifyMoveType(turn)).toBe('point_making');
        });
    });

    describe('calculateMoveTypeMetrics', () => {
        it('calcule les métriques pour l’ensemble des 6 types de coup', () => {
            const mockAnalysis: CompleteGameAnalysis = {
                id: 'analysis_1',
                gameId: 'game_1',
                date: '2026-10-16T12:00:00Z',
                player: 'X',
                opponentType: 'ai',
                winner: 'X',
                scoreX: 5,
                scoreO: 2,
                matchLength: 7,
                totalMovesCount: 4,
                decisionsCount: 4,
                unforcedDecisionsCount: 4,
                totalEquityLoss: 0.15,
                errorRate: 0.037,
                performanceRating: 5.5,
                estimatedRating: 1860,
                prCategory: 'Expert',
                breakdown: { optimal: 2, acceptable: 1, doubtful: 1, blunder: 0, howler: 0 },
                evaluatedMoves: [
                    {
                        moveNumber: 1,
                        player: 'X',
                        dice: [3, 1],
                        boardBefore: new Array(28).fill(0),
                        boardAfter: new Array(28).fill(0),
                        playedNotation: '8/5 6/5',
                        optimalNotation: '8/5 6/5',
                        equityLoss: 0,
                        verdict: 'optimal',
                        isUnforced: true,
                        candidateCount: 6,
                    },
                    {
                        moveNumber: 4,
                        player: 'X',
                        dice: [6, 2],
                        boardBefore: new Array(28).fill(0),
                        boardAfter: new Array(28).fill(0),
                        playedNotation: '24/18 13/11',
                        optimalNotation: '13/7 13/11',
                        equityLoss: -0.045,
                        verdict: 'doubtful',
                        isUnforced: true,
                        candidateCount: 8,
                    },
                ],
            };

            const metrics = calculateMoveTypeMetrics([mockAnalysis]);
            expect(metrics).toHaveLength(6);

            const opening = metrics.find((m) => m.type === 'opening')!;
            expect(opening.decisionsCount).toBe(1);
            expect(opening.errorRate).toBe(0);
            expect(opening.masteryPercentage).toBe(100);

            const anchor = metrics.find((m) => m.type === 'anchor_defense')!;
            expect(anchor.decisionsCount).toBe(1);
            expect(anchor.errorCount).toBe(1);
            expect(anchor.totalEquityLoss).toBe(0.045);
        });
    });

    describe('generateConceptsHeatmap', () => {
        it('génère les cellules 2D avec intensité normalisée', () => {
            const mockAnalysis: CompleteGameAnalysis = {
                id: 'analysis_2',
                gameId: 'game_2',
                date: '2026-10-16T12:00:00Z',
                player: 'X',
                opponentType: 'ai',
                scoreX: 5,
                scoreO: 2,
                matchLength: 7,
                totalMovesCount: 2,
                decisionsCount: 2,
                unforcedDecisionsCount: 2,
                totalEquityLoss: 0.12,
                errorRate: 0.06,
                performanceRating: 6.0,
                estimatedRating: 1838,
                prCategory: 'Expert',
                breakdown: { optimal: 1, acceptable: 0, doubtful: 0, blunder: 1, howler: 0 },
                evaluatedMoves: [
                    {
                        moveNumber: 5,
                        player: 'X',
                        dice: [5, 4],
                        boardBefore: new Array(28).fill(0),
                        boardAfter: new Array(28).fill(0),
                        playedNotation: '13/9 13/8',
                        optimalNotation: '24/20 13/8',
                        equityLoss: -0.12,
                        verdict: 'blunder',
                        isUnforced: true,
                        candidateCount: 8,
                        conceptId: 'blot_safety',
                    },
                ],
            };

            const heatmap = generateConceptsHeatmap([mockAnalysis]);
            expect(heatmap.length).toBeGreaterThan(0);

            const blotSafetyMiddle = heatmap.find(
                (c) => c.conceptId === 'blot_safety' && c.phase === 'middle_game',
            );
            expect(blotSafetyMiddle).toBeDefined();
            expect(blotSafetyMiddle?.blunderCount).toBe(1);
            expect(blotSafetyMiddle?.totalEquityLoss).toBe(0.12);
            expect(blotSafetyMiddle?.intensity).toBe(1);
        });
    });

    describe('calculateTacticalBlunderHeatmap (3 Phases × 5 Tactical Themes)', () => {
        it('catégorise les bévues dans la matrice 15 cellules (Opening/Midgame/Bearing off × Slotting/Priming/Blitz/Holding/Racing)', () => {
            const mockAnalysis: CompleteGameAnalysis = {
                id: 'analysis_tactical',
                gameId: 'game_tactical',
                date: '2026-10-22T12:00:00Z',
                player: 'X',
                opponentType: 'ai',
                scoreX: 3,
                scoreO: 1,
                matchLength: 7,
                totalMovesCount: 3,
                decisionsCount: 3,
                unforcedDecisionsCount: 3,
                totalEquityLoss: 0.25,
                errorRate: 0.083,
                performanceRating: 8.5,
                estimatedRating: 1700,
                prCategory: 'Avancé',
                breakdown: { optimal: 0, acceptable: 0, doubtful: 1, blunder: 2, howler: 0 },
                evaluatedMoves: [
                    {
                        moveNumber: 1,
                        player: 'X',
                        dice: [2, 1],
                        boardBefore: new Array(28).fill(0),
                        boardAfter: new Array(28).fill(0),
                        playedNotation: '13/11 6/5',
                        optimalNotation: '24/23 13/11',
                        equityLoss: -0.05,
                        verdict: 'doubtful',
                        isUnforced: true,
                        candidateCount: 8,
                        explanation: 'Slotting du point 5 risqué.',
                    },
                    {
                        moveNumber: 6,
                        player: 'X',
                        dice: [5, 3],
                        boardBefore: new Array(28).fill(0),
                        boardAfter: new Array(28).fill(0),
                        playedNotation: '13/8 8/5*',
                        optimalNotation: '8/3 6/3',
                        equityLoss: -0.14,
                        verdict: 'blunder',
                        isUnforced: true,
                        candidateCount: 10,
                        explanation: 'Blitz prématuré au lieu de construire un prime.',
                    },
                    {
                        moveNumber: 16,
                        player: 'X',
                        dice: [6, 5],
                        boardBefore: new Array(28).fill(0),
                        boardAfter: new Array(28).fill(0),
                        playedNotation: '6/off 5/off',
                        optimalNotation: '6/off 5/off',
                        equityLoss: -0.09,
                        verdict: 'blunder',
                        isUnforced: true,
                        candidateCount: 3,
                    },
                ],
            };

            expect(classifyTacticalTheme(mockAnalysis.evaluatedMoves[0])).toBe('slotting');
            expect(classifyTacticalTheme(mockAnalysis.evaluatedMoves[1])).toBe('blitz');
            expect(classifyTacticalTheme(mockAnalysis.evaluatedMoves[2])).toBe('racing');

            const cells = calculateTacticalBlunderHeatmap([mockAnalysis]);
            expect(cells).toHaveLength(15); // 5 thèmes × 3 phases

            const slottingOpening = cells.find(
                (c) => c.theme === 'slotting' && c.phase === 'opening',
            );
            expect(slottingOpening?.errorCount).toBe(1);

            const blitzMid = cells.find(
                (c) => c.theme === 'blitz' && c.phase === 'middle_game',
            );
            expect(blitzMid?.blunderCount).toBe(1);
            expect(blitzMid?.intensity).toBe(1);

            const racingEnd = cells.find(
                (c) => c.theme === 'racing' && c.phase === 'endgame',
            );
            expect(racingEnd?.blunderCount).toBe(1);
        });
    });

    describe('calculateProgressionTimeline', () => {
        it('calcule la moyenne mobile du PR sur plusieurs parties', () => {
            const createAnalysis = (date: string, pr: number): CompleteGameAnalysis => ({
                id: `id_${pr}`,
                gameId: `game_${pr}`,
                date,
                player: 'X',
                opponentType: 'ai',
                winner: 'X',
                scoreX: 5,
                scoreO: 2,
                matchLength: 7,
                totalMovesCount: 10,
                decisionsCount: 10,
                unforcedDecisionsCount: 10,
                totalEquityLoss: 0.1,
                errorRate: 0.01,
                performanceRating: pr,
                estimatedRating: 2150 - pr * 52,
                prCategory: 'Expert',
                breakdown: { optimal: 10, acceptable: 0, doubtful: 0, blunder: 0, howler: 0 },
                evaluatedMoves: [],
            });

            const analyses = [
                createAnalysis('2026-10-14T10:00:00Z', 10),
                createAnalysis('2026-10-15T10:00:00Z', 6),
                createAnalysis('2026-10-16T10:00:00Z', 5),
            ];

            const timeline = calculateProgressionTimeline(analyses);
            expect(timeline).toHaveLength(3);
            expect(timeline[0].movingAveragePR).toBe(10);
            expect(timeline[1].movingAveragePR).toBe(8);
            expect(timeline[2].movingAveragePR).toBe(7);
        });
    });

    describe('computeAnalyticsSummary', () => {
        it('produit une synthèse complète avec score global de maîtrise et tacticalHeatmapCells', () => {
            const summary = computeAnalyticsSummary([]);
            expect(summary.totalGames).toBe(0);
            expect(summary.moveTypeMetrics).toHaveLength(6);
            expect(summary.tacticalHeatmapCells).toHaveLength(15);
            expect(summary.overallMastery).toBeGreaterThanOrEqual(0);
        });
    });
});
