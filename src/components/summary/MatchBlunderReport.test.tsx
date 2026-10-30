// @vitest-environment jsdom
/**
 * Tests unitaires du composant MatchBlunderReport ("Grandmaster Match Review & Blunder Report").
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MatchBlunderReport } from './MatchBlunderReport';
import { PostMatchTrainingReport } from './PostMatchTrainingReport';
import { createInitialState } from '../../engine/backgammonEngine';
import type { CompleteGameAnalysis } from '../../features/rating/types';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

function buildSampleAnalysis(): CompleteGameAnalysis {
    const initial = createInitialState(7);
    return {
        id: 'analysis-gm-1',
        gameId: 'game-gm-1',
        date: '2026-10-23T18:00:00.000Z',
        player: 'X',
        opponentType: 'ai',
        opponentDifficulty: 'expert',
        winner: 'X',
        winType: 'single',
        pointsWon: 2,
        scoreX: 5,
        scoreO: 3,
        matchLength: 7,
        totalMovesCount: 28,
        decisionsCount: 14,
        unforcedDecisionsCount: 12,
        totalEquityLoss: 0.246,
        errorRate: 0.0205,
        performanceRating: 4.85,
        estimatedRating: 1898,
        prCategory: 'Maître',
        breakdown: {
            optimal: 8,
            acceptable: 1,
            doubtful: 2,
            blunder: 1,
            howler: 0,
        },
        evaluatedMoves: [
            {
                moveNumber: 1,
                player: 'X',
                dice: [3, 1],
                boardBefore: [...initial.board],
                boardAfter: [...initial.board],
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
                boardBefore: [...initial.board],
                boardAfter: [...initial.board],
                playedNotation: '24/18 13/11',
                optimalNotation: '24/16',
                equityLoss: -0.034,
                verdict: 'doubtful',
                isUnforced: true,
                candidateCount: 8,
            },
            {
                moveNumber: 7,
                player: 'X',
                dice: [5, 4],
                boardBefore: [...initial.board],
                boardAfter: [...initial.board],
                playedNotation: '13/8 13/9',
                optimalNotation: '24/15',
                equityLoss: -0.070,
                verdict: 'doubtful',
                isUnforced: true,
                candidateCount: 7,
            },
            {
                moveNumber: 11,
                player: 'X',
                dice: [6, 1],
                boardBefore: [...initial.board],
                boardAfter: [...initial.board],
                playedNotation: '24/18 24/23',
                optimalNotation: '13/7 8/7',
                equityLoss: -0.142,
                verdict: 'blunder',
                isUnforced: true,
                candidateCount: 9,
                conceptId: 'bar-point',
            },
        ],
    };
}

describe('MatchBlunderReport Component', () => {
    it('affiche la bannière PR, le taux de précision (Accuracy %) et les 5 catégories de coups', () => {
        const analysis = buildSampleAnalysis();

        render(
            <MatchBlunderReport
                analysis={analysis}
                opponentPr={5.2}
                isOffline={true}
                locale="fr"
            />,
        );

        expect(screen.getByTestId('match-blunder-report')).toBeTruthy();
        expect(screen.getByTestId('match-report-level-badge').textContent).toContain('Niveau Maître');
        expect(screen.getByTestId('match-report-pr-badge').textContent).toContain('PR: 4.85');
        expect(screen.getByTestId('match-report-accuracy').textContent).toContain('%');

        // 5 catégories : Best (1), Inaccuracy (1), Mistake (1), Blunder (1), Cube Blunder (0)
        expect(screen.getByTestId('report-cat-best').textContent).toContain('1');
        expect(screen.getByTestId('report-cat-inaccuracy').textContent).toContain('1');
        expect(screen.getByTestId('report-cat-mistake').textContent).toContain('1');
        expect(screen.getByTestId('report-cat-blunder').textContent).toContain('1');
        expect(screen.getByTestId('report-cat-cube_blunder').textContent).toContain('0');
    });

    it('affiche le MiniBoardDiagram de la pire gaffe avec ses dés, son XGID et ses flèches comparatives', () => {
        const analysis = buildSampleAnalysis();

        render(<MatchBlunderReport analysis={analysis} isOffline={true} locale="fr" />);

        // Le carrousel trie par gravité décroissante : Tour #11 (-0.142 Eq) est en index 0
        expect(screen.getByTestId('blunder-severity-badge-0').textContent).toContain('-0.142 Eq');
        expect(screen.getByTestId('blunder-dice-badge-0').textContent).toContain('6');
        expect(screen.getByTestId('blunder-dice-badge-0').textContent).toContain('1');
        expect(screen.getByTestId('blunder-xgid-0').textContent).toContain('XGID=');

        expect(screen.getByTestId('mini-board-diagram')).toBeTruthy();
        expect(screen.getAllByTestId('mini-board-arrow-played').length).toBeGreaterThan(0);
        expect(screen.getAllByTestId('mini-board-arrow-optimal').length).toBeGreaterThan(0);
    });

    it('permet de rejouer un coup en mode interactif (masque puis révèle la flèche optimale)', () => {
        const analysis = buildSampleAnalysis();

        render(<MatchBlunderReport analysis={analysis} isOffline={true} locale="fr" />);

        // Cliquer sur "Rejouer ce coup"
        fireEvent.click(screen.getByTestId('replay-blunder-move-btn-0'));

        expect(screen.getByTestId('blunder-replay-puzzle-0')).toBeTruthy();
        // La flèche optimale doit être masquée tant que le joueur n'a pas trouvé la solution
        expect(screen.queryAllByTestId('mini-board-arrow-optimal')).toHaveLength(0);

        // Sélectionner le coup optimal (13/7 8/7)
        fireEvent.click(screen.getByTestId('replay-choice-0-13/7 8/7'));

        expect(screen.getByTestId('replay-feedback-0').textContent).toContain('Exact');
        // La flèche optimale est à nouveau révélée sur le MiniBoardDiagram
        expect(screen.getAllByTestId('mini-board-arrow-optimal').length).toBeGreaterThan(0);
    });

    it('bascule entre le mode Carrousel et la Liste Accordéon et affiche les 3 volets Gemini', () => {
        const analysis = buildSampleAnalysis();

        render(<MatchBlunderReport analysis={analysis} isOffline={true} locale="fr" />);

        // Bascule en mode Accordéon
        fireEvent.click(screen.getByTestId('layout-accordion-btn'));
        expect(screen.getByTestId('blunder-accordion-list')).toBeTruthy();
        expect(screen.getByTestId('blunder-accordion-header-1')).toBeTruthy();

        // Vérifie la présence des 3 volets pédagogiques du Coach IA
        expect(screen.getByTestId('gemini-coach-three-pillars')).toBeTruthy();
        expect(screen.getByTestId('coach-pillar-diagnostic').textContent).toBeTruthy();
        expect(screen.getByTestId('coach-pillar-key-concept').textContent).toBeTruthy();
        expect(screen.getByTestId('coach-pillar-training-plan').textContent).toBeTruthy();
    });

    it('positionne la barre d’actions sous PostMatchHeader sans empiler PostMatchBlundersGallery ni PostMatchAiSynthesis', () => {
        const analysis = buildSampleAnalysis();
        const onNextGame = vi.fn();
        const onOpenReview = vi.fn();
        const onTrainBlunders = vi.fn();
        const onOpenDiceAudit = vi.fn();
        const onBackToLobby = vi.fn();

        render(
            <PostMatchTrainingReport
                analysis={analysis}
                winner="X"
                winType="single"
                pointsWon={1}
                scoreX={5}
                scoreO={3}
                matchLength={7}
                isMatchOver={false}
                gameId="game-gm-1"
                botPr={5.2}
                botCategory="Maître"
                isOffline={true}
                onNextGame={onNextGame}
                onOpenReview={onOpenReview}
                onTrainBlunders={onTrainBlunders}
                onOpenDiceAudit={onOpenDiceAudit}
                onBackToLobby={onBackToLobby}
                locale="fr"
            />,
        );

        const header = screen.getByTestId('post-match-header');
        const nextBtn = screen.getByTestId('post-match-next-game-btn');
        const reviewBtn = screen.getByTestId('open-game-review-btn');
        const trainBtn = screen.getByTestId('post-match-train-blunders-btn');
        const diceBtn = screen.getByTestId('post-match-dice-audit-btn');
        const lobbyBtn = screen.getByTestId('post-match-back-lobby-btn');
        const report = screen.getByTestId('match-blunder-report');

        // La barre d'actions est immédiatement après PostMatchHeader et avant MatchBlunderReport
        expect(header.compareDocumentPosition(nextBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(nextBtn.compareDocumentPosition(report) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(reviewBtn).toBeTruthy();
        expect(trainBtn).toBeTruthy();
        expect(diceBtn).toBeTruthy();
        expect(lobbyBtn).toBeTruthy();

        // Aucun empilement redondant (ni galerie/synthèse dupliquée, ni double bannière PR)
        expect(screen.queryByTestId('post-match-blunders-gallery')).toBeNull();
        expect(screen.queryByTestId('post-match-ai-synthesis')).toBeNull();
        expect(screen.queryByTestId('match-blunder-banner')).toBeNull();
        expect(screen.getByTestId('post-match-accuracy').textContent).toContain('%');

        // Bordures apaisées border-white/10 et aucun texte 8px/9px
        expect(header.className).toContain('border-white/10');
        expect(screen.getByTestId('post-match-pr-player').className).toContain('border-white/10');
        expect(screen.getByTestId('post-match-pr-bot').className).toContain('border-white/10');
        expect(header.innerHTML).not.toContain('text-[8px]');
        expect(header.innerHTML).not.toContain('text-[9px]');
        expect(report.innerHTML).not.toContain('text-[8px]');
        expect(report.innerHTML).not.toContain('text-[9px]');

        // Raccourci clavier Échap -> retour au lobby
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onBackToLobby).toHaveBeenCalledTimes(1);
    });

    it('affiche la carte Caméléon 3 Strates (Débutant / Club / Pro) et la ventilation PR-Positional vs PR-Cube au tap', () => {
        const analysis = buildSampleAnalysis();
        analysis.checkerPR = 4.1;
        analysis.cubePR = 6.3;

        render(
            <PostMatchTrainingReport
                analysis={analysis}
                winner="X"
                winType="single"
                pointsWon={1}
                scoreX={5}
                scoreO={3}
                matchLength={7}
                isMatchOver={false}
                gameId="game-gm-1"
                botPr={5.2}
                botCategory="Maître"
                isOffline={true}
                onNextGame={vi.fn()}
                onBackToLobby={vi.fn()}
                locale="fr"
            />,
        );

        // PR = 4.85 (< 5.0) => Couche 2 (Pro) sélectionnée automatiquement (Étape 5)
        expect(screen.getByTestId('chameleon-post-match-card')).toBeTruthy();
        expect(screen.getByTestId('chameleon-layer2-pro-metrics')).toBeTruthy();

        // Bascule en Couche 1 (Club : Jauge de Videau 25% / 75% / Loi de Woolsey)
        fireEvent.click(screen.getByTestId('chameleon-layer-btn-1'));
        expect(screen.getByTestId('chameleon-layer1-cube-gauge').textContent).toContain('Loi de Woolsey');

        // Bascule en Couche 0 (Débutant : 4 Fondamentaux sans jargon)
        fireEvent.click(screen.getByTestId('chameleon-layer-btn-0'));
        expect(screen.getByTestId('chameleon-layer0-four-factors').textContent).toContain('Structure');

        // Tap sur le badge PR joueur -> révèle le Split PR-Positional (Dames) vs PR-Cube (Videau)
        fireEvent.click(screen.getByTestId('post-match-pr-player'));
        expect(screen.getByTestId('post-match-pr-split').textContent).toContain('4.10');
        expect(screen.getByTestId('post-match-pr-split').textContent).toContain('6.30');
    });
});
