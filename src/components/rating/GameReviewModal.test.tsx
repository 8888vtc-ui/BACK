import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GameReviewModal from './GameReviewModal';
import GameReviewOverviewCards from './GameReviewOverviewCards';
import GameReviewMovesTable from './GameReviewMovesTable';
import type { CompleteGameAnalysis } from '../../features/rating/types';

describe('GameReviewModal Component', () => {
    const mockAnalysis: CompleteGameAnalysis = {
        id: 'analysis_test_modal',
        gameId: 'game_test_modal',
        date: '2026-10-16T12:00:00.000Z',
        player: 'X',
        opponentType: 'ai',
        opponentDifficulty: 'intermediate',
        winner: 'X',
        winType: 'single',
        pointsWon: 1,
        scoreX: 5,
        scoreO: 3,
        matchLength: 7,
        totalMovesCount: 12,
        decisionsCount: 12,
        unforcedDecisionsCount: 10,
        totalEquityLoss: 0.12,
        errorRate: 0.012,
        performanceRating: 6.0,
        estimatedRating: 1838,
        prCategory: 'Expert',
        breakdown: {
            optimal: 7,
            acceptable: 2,
            doubtful: 1,
            blunder: 0,
            howler: 0,
        },
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
                moveNumber: 2,
                player: 'X',
                dice: [5, 2],
                boardBefore: new Array(28).fill(0),
                boardAfter: new Array(28).fill(0),
                playedNotation: '13/8 13/11',
                optimalNotation: '13/8 13/11',
                equityLoss: -0.015,
                verdict: 'acceptable',
                isUnforced: true,
                candidateCount: 8,
            },
            {
                moveNumber: 3,
                player: 'X',
                dice: [6, 2],
                boardBefore: new Array(28).fill(0),
                boardAfter: new Array(28).fill(0),
                playedNotation: '24/18 13/11',
                optimalNotation: '13/7 13/11',
                equityLoss: -0.045,
                verdict: 'doubtful',
                isUnforced: true,
                candidateCount: 9,
            },
        ],
    };

    it('ne rend rien si isOpen est false', () => {
        const html = renderToStaticMarkup(
            <GameReviewModal
                analysis={mockAnalysis}
                isOpen={false}
                onClose={() => {}}
            />,
        );
        expect(html).toBe('');
    });

    it('affiche le PR, l’Elo estimé et le résultat de manche quand ouvert', () => {
        const html = renderToStaticMarkup(
            <GameReviewModal
                analysis={mockAnalysis}
                isOpen={true}
                onClose={() => {}}
            />,
        );

        expect(html).toContain('Bilan &amp; Estimation du PR');
        expect(html).toContain('data-testid="review-pr-value"');
        expect(html).toContain('6');
        expect(html).toContain('data-testid="review-elo-value"');
        expect(html).toContain('1838');
        expect(html).toContain('Expert');
        expect(html).toContain('🎉 Victoire Joueur X');
    });

    it('affiche la table des coups évalués avec la perte d’équité et les verdicts', () => {
        const html = renderToStaticMarkup(
            <GameReviewModal
                analysis={mockAnalysis}
                isOpen={true}
                onClose={() => {}}
            />,
        );

        expect(html).toContain('8/5 6/5');
        expect(html).toContain('Optimal');
        expect(html).toContain('Acceptable');
        expect(html).toContain('Douteux');
        expect(html).toContain('-0.045');
    });

    it('propose les onglets de navigation post-partie et intègre la courbe d’équité', () => {
        const html = renderToStaticMarkup(
            <GameReviewModal
                analysis={mockAnalysis}
                isOpen={true}
                onClose={() => {}}
            />,
        );

        // Onglets (5 onglets distincts, sans tab-blunder-report redondant)
        expect(html).toContain('data-testid="tab-overview"');
        expect(html).toContain('data-testid="tab-step-by-step"');
        expect(html).toContain('data-testid="tab-concepts"');
        expect(html).toContain('data-testid="tab-table"');
        expect(html).toContain('data-testid="tab-course"');
        expect(html).not.toContain('data-testid="tab-blunder-report"');

        // Courbe d'équité présente sur la vue d'ensemble
        expect(html).toContain('data-testid="equity-curve-container"');
        expect(html).toContain('data-testid="equity-curve-svg"');
        expect(html).toContain('Courbe d&#x27;Équité Cumulée');

        // Boutons d'inspection directe et d'export / partage
        expect(html).toContain('Inspecter ➔');
        expect(html).toContain('data-testid="close-review-modal-btn"');
        expect(html).toContain('data-testid="export-sgf-review-btn"');
        expect(html).toContain('data-testid="share-review-btn"');
        expect(html).toContain('role="tablist"');
    });

    it('affiche dynamiquement le joueur O et le PR Ajusté Chance dans GameReviewOverviewCards', () => {
        const html = renderToStaticMarkup(
            <GameReviewOverviewCards
                analysis={{
                    ...mockAnalysis,
                    player: 'O',
                    winner: 'X',
                    luckAdjustedPR: 5.4,
                    totalLuck: -0.125,
                }}
            />,
        );

        expect(html).toContain('Défaite Joueur O');
        expect(html).toContain('data-testid="review-luck-adjusted-pr"');
        expect(html).toContain('5.4');
        expect(html).toContain('-0.125 EMG');
    });

    it('filtre uniquement les erreurs dans GameReviewMovesTable quand filterOnlyMistakes est actif', () => {
        const html = renderToStaticMarkup(
            <GameReviewMovesTable
                evaluatedMoves={mockAnalysis.evaluatedMoves}
                mistakesCount={1}
                filterOnlyMistakes={true}
                onSetFilterOnlyMistakes={() => {}}
                onInspectMove={() => {}}
            />,
        );

        expect(html).toContain('Inspection Coup par Coup (1)');
        expect(html).toContain('24/18 13/11');
        expect(html).toContain('data-testid="drill-row-btn-3"');
        expect(html).not.toContain('8/5 6/5');
    });
});

