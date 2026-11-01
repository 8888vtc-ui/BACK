// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import BlunderDrillView from './BlunderDrillView';
import { clearBlunderBank, getBlunderBankStats, recordBlunder } from '../../features/drills/blunderBank';
import { BENCHMARK_BLUNDERS } from '../../features/drills/benchmarkBlunders';
import {
    resetAdaptivePlayerProfile,
    recordLiveMatchDecisionOnAdaptiveProfile,
} from '../../features/drills/adaptiveQuizEngine';

// Mock Capacitor Haptics
vi.mock('../../lib/capacitor/haptics', () => ({
    impactLight: vi.fn(),
    notificationSuccess: vi.fn(),
    notificationError: vi.fn(),
}));

// Mock ToastContext
vi.mock('../toast/ToastContext', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
    },
}));

describe('BlunderDrillView Component (Parcours Adaptatif Zéro Sous-Menu)', () => {
    let mockStore: Record<string, string> = {};

    beforeEach(() => {
        mockStore = {};
        const mockLocalStorage = {
            getItem: vi.fn((key: string) => mockStore[key] ?? null),
            setItem: vi.fn((key: string, val: string) => {
                mockStore[key] = String(val);
            }),
            removeItem: vi.fn((key: string) => {
                delete mockStore[key];
            }),
            clear: vi.fn(() => {
                mockStore = {};
            }),
        };

        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
        });

        clearBlunderBank();
        resetAdaptivePlayerProfile();
    });

    afterEach(() => {
        cleanup();
    });

    it('affiche l’en-tête adaptatif Zéro Sous-Menu, le radar des 9 compétences, le badge Premium Offert et le premier défi', () => {
        const html = renderToStaticMarkup(<BlunderDrillView />);

        expect(html).toContain('Parcours Adaptatif IA');
        expect(html).toContain('data-testid="premium-launch-badge"');
        expect(html).toContain('data-testid="adaptive-skill-radar"');
        expect(html).toContain('data-testid="mastered-count"');
        expect(html).toContain(`0 / ${BENCHMARK_BLUNDERS.length}`);

        expect(html).toContain('data-testid="drill-position-card"');
        expect(html).toContain('Jet à jouer');
        expect(html).toContain('Erreur piégeuse à éviter');
        expect(html).toContain('data-testid="quiz-qcm-choices"');
        expect(html).not.toContain('text-[8px]');
    });

    it('affiche les boutons de contrôle : Indice, Réinitialiser et les 4 choix QCM Express sans menu déroulant', () => {
        const html = renderToStaticMarkup(<BlunderDrillView />);

        expect(html).toContain('data-testid="drill-hint-toggle"');
        expect(html).toContain('Indice');
        expect(html).toContain('data-testid="drill-reset-btn"');
        expect(html).toContain('Réinitialiser');
        expect(html).not.toContain('data-testid="concept-filter"');
    });

    it('supporte le focus par concept initial (ex: depuis Gammon Academy)', () => {
        const html = renderToStaticMarkup(
            <BlunderDrillView initialConceptId="golden_point" />,
        );

        expect(html).toContain('Contrôle du Golden Point (Porte 5 / 20)');
        expect(html).toContain('24/21 13/12');
        expect(html).toContain('-0.230 ΔEq');
    });

    it('affiche le plateau SVG interactif de Backgammon et les dés', () => {
        const html = renderToStaticMarkup(<BlunderDrillView />);

        expect(html).toContain('svg');
        expect(html).toContain('data-testid="board-die-0"');
    });

    it('ouvre et masque le panneau d’indice au clic sur le bouton Indice', () => {
        render(<BlunderDrillView />);

        expect(screen.queryByTestId('drill-hint-box')).toBeNull();
        fireEvent.click(screen.getByTestId('drill-hint-toggle'));
        expect(screen.getByTestId('drill-hint-box')).toBeDefined();

        fireEvent.click(screen.getByTestId('drill-hint-toggle'));
        expect(screen.queryByTestId('drill-hint-box')).toBeNull();
    });

    it('permet de répondre en 1 clic via le Quiz Express QCM et affiche l’explication pédagogique 3.8 Flash', () => {
        render(<BlunderDrillView initialConceptId="golden_point" />);

        const qcmBox = screen.getByTestId('quiz-qcm-choices');
        const buttons = qcmBox.querySelectorAll('button');
        expect(buttons.length).toBe(4);

        // Clique sur le premier choix (8/5 6/5 = optimal)
        fireEvent.click(buttons[0]!);
        const banner = screen.getByTestId('drill-feedback-banner');
        expect(banner.textContent).toContain('Coach Pédagogique 3.8 Flash');
        expect(banner.textContent).toContain('Pourquoi l\'erreur');
        expect(getBlunderBankStats().totalBlunders).toBe(BENCHMARK_BLUNDERS.length);
    });

    it('garantit la séparation stricte ER vs ERH, l’évolution dynamique du niveau (+ vert / - rouge), la ligne unique de contexte et l’absence du bouton Valider / Lecture Mathématique', () => {
        // 1. Mode Quiz ER (/puzzles) : 100 % ER, 0 occurrence du mot ERH, évolution dynamique + en vert
        const { unmount } = render(<BlunderDrillView initialConceptId="golden_point" initialMode="pr_math" />);
        expect(screen.getByTestId('drill-mode-title').textContent).toContain('Quiz ER');
        expect(screen.getByTestId('drill-mode-title').textContent).not.toContain('ERH');
        expect(screen.queryByTestId('drill-mode-tabs')).toBeNull();
        expect(screen.queryByTestId('drill-validate-btn')).toBeNull();
        expect(screen.queryByTestId('drill-position-reading-card')).toBeNull();

        const initialErBadge = screen.getByTestId('quiz-live-rating-badge');
        expect(initialErBadge.textContent).toContain('Niveau ER : 1500');

        const contextLine = screen.getByTestId('drill-match-context-grid');
        expect(contextLine.textContent).toContain('Videau :');
        expect(contextLine.textContent).not.toContain('Blanc 96 pips vs Noir');

        // Validation en 1-Clic sur A (optimal) -> hausse immédiate du Niveau ER (+ vert) et bouton Question suivante →
        fireEvent.click(screen.getByTestId('quiz-choice-btn-A'));
        expect(screen.getByTestId('quiz-live-rating-badge').textContent).toContain('Niveau ER : 151');
        expect(screen.getByTestId('quiz-live-rating-delta').textContent).toContain('+');
        expect(screen.getByTestId('drill-next-btn').textContent).toContain('Question suivante →');
        expect(mockStore['bg_quiz_er_rating_v1']).toBeDefined();
        expect(mockStore['bg_quiz_erh_rating_v1']).toBeUndefined();
        unmount();

        // 2. Mode Quiz ERH (/drills) : 100 % ERH, évolution dynamique - en rouge sur erreur, stockage séparé
        render(<BlunderDrillView initialConceptId="golden_point" initialMode="adaptive" />);
        expect(screen.getByTestId('drill-mode-title').textContent).toContain('Quiz ERH');
        expect(screen.getByTestId('quiz-live-rating-badge').textContent).toContain('Niveau ERH : 1500');

        // Clic sur B (erreur) -> baisse immédiate du Niveau ERH (- rouge)
        fireEvent.click(screen.getByTestId('quiz-choice-btn-B'));
        expect(screen.getByTestId('quiz-live-rating-delta').textContent).toContain('-');
        expect(mockStore['bg_quiz_erh_rating_v1']).toBeDefined();
    });

    it('permet de basculer sur l’onglet Revoir Mes Blunders et calibre automatiquement le niveau lors d’un match contre un Bot ou un Humain', () => {
        const initialBoard = [0, -2, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, -5, 5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0, 0, 0];
        const liveOutcome = recordLiveMatchDecisionOnAdaptiveProfile({
            board: initialBoard,
            turnIndex: 1,
            equityLoss: 0.145,
            isCube: false,
        });
        expect(liveOutcome.categoryMeta.id).toBe('opening');
        expect(liveOutcome.categoryState.masteryScore).toBeLessThan(25);

        recordBlunder({
            id: 'user_blunder_match_1',
            board: initialBoard,
            dice: [3, 1],
            player: 'X',
            playedMove: '24/21 13/12',
            optimalMove: '8/5 6/5',
            equityLoss: 0.178,
            verdict: 'blunder',
            conceptId: 'opening',
            conceptName: 'Ouverture Personnelle Match',
            explanation: 'Construisez le Golden Point 5 avec 3-1.',
            quizChoices: ['8/5 6/5', '24/21 13/12', '13/9', '24/20'],
        });

        render(<BlunderDrillView />);
        const personalTab = screen.getByTestId('drill-mode-tab-personal');
        expect(personalTab.textContent).toContain('Revoir Mes Blunders');
        expect(personalTab.textContent).toContain('1');

        fireEvent.click(personalTab);
        expect(screen.getByText(/Vos Blunders de Match/i)).toBeDefined();
        expect(screen.getByText(/Ouverture Personnelle Match/i)).toBeDefined();
    });
});
