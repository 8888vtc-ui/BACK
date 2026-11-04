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
    const b0 = BENCHMARK_BLUNDERS[0]!;
    const b1 = BENCHMARK_BLUNDERS.find((b) => b.equityLoss >= 0.08 && (b.quizChoices?.length ?? 0) >= 4) ?? BENCHMARK_BLUNDERS[1] ?? b0;

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
        expect(html).not.toContain('Erreur piégeuse à éviter');
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
        render(<BlunderDrillView initialConceptId={b0.conceptId} />);
        fireEvent.click(screen.getByTestId('drill-hint-toggle'));
        expect(screen.getByTestId('drill-theme-badge').textContent).toContain(b0.conceptName);
        expect(screen.getByTestId('drill-hint-box')).toBeDefined();
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
        render(<BlunderDrillView initialConceptId={b0.conceptId} />);

        const qcmBox = screen.getByTestId('quiz-qcm-choices');
        const buttons = qcmBox.querySelectorAll('button');
        expect(buttons.length).toBe(4);

        // Clique sur le premier choix
        fireEvent.click(buttons[0]!);
        const banner = screen.getByTestId('drill-feedback-banner');
        expect(banner.textContent).toContain('Coach Pédagogique');
        expect(getBlunderBankStats().totalBlunders).toBe(BENCHMARK_BLUNDERS.length);
    });

    it('garantit l’unification ER / PR (0.0-30.0), l’évolution dynamique du niveau (+ vert / - rouge), la ligne unique de contexte et le badge Calibrage Quiz N+1', () => {
        // 1. Mode Quiz ER (/puzzles) : 100 % ER / PR, 0 occurrence du mot ERH, évolution dynamique + en vert
        const { unmount } = render(<BlunderDrillView initialConceptId={b0.conceptId} initialMode="pr_math" />);
        expect(screen.getByTestId('drill-mode-title').textContent).toContain('Quiz ER / PR');
        expect(screen.getByTestId('drill-mode-title').textContent).not.toContain('ERH');
        expect(screen.queryByTestId('drill-mode-tabs')).toBeNull();
        expect(screen.queryByTestId('drill-validate-btn')).toBeNull();
        expect(screen.queryByTestId('drill-position-reading-card')).toBeNull();

        const initialErBadge = screen.getByTestId('quiz-live-rating-badge');
        expect(initialErBadge.textContent).toContain('Niveau ER : 1500');
        expect(screen.getByTestId('quiz-nplus1-target-badge').textContent).toContain('Calibrage Quiz : ER / PR');
        expect(screen.getByTestId('quiz-nplus1-target-badge').textContent).toContain('(Objectif N+1)');

        const contextLine = screen.getByTestId('drill-match-context-grid');
        expect(contextLine.textContent).toContain('Videau :');

        // Validation en 1-Clic sur A (optimal) -> hausse immédiate du Niveau ER (+ vert) et bouton Question suivante →
        fireEvent.click(screen.getByTestId('quiz-choice-btn-A'));
        expect(screen.getByTestId('quiz-live-rating-badge').textContent).toMatch(/Niveau ER : 15(1|2)/);
        expect(screen.getByTestId('quiz-live-rating-delta').textContent).toContain('+');
        expect(screen.getByTestId('drill-next-btn').textContent).toContain('Question suivante →');
        expect(mockStore['bg_quiz_er_rating_v1']).toBeDefined();
        unmount();

        // 2. Mode Quiz adaptatif (/drills) : également Quiz ER / PR, calibrage N+1, évolution dynamique - en rouge sur erreur
        render(<BlunderDrillView initialConceptId={b0.conceptId} initialMode="adaptive" />);
        expect(screen.getByTestId('drill-mode-title').textContent).toContain('Quiz ER / PR');
        expect(screen.getByTestId('drill-mode-title').textContent).not.toContain('ERH');
        expect(screen.getByTestId('quiz-nplus1-target-badge').textContent).toContain('Calibrage Quiz : ER / PR');
        expect(screen.getByTestId('quiz-nplus1-target-badge').textContent).toContain('(Objectif N+1)');

        fireEvent.click(screen.getByTestId('quiz-choice-btn-C'));
        expect(screen.getByTestId('quiz-live-rating-delta').textContent).toContain('-');
        expect(mockStore['bg_quiz_er_rating_v1']).toBeDefined();
    });

    it('permet de basculer sur l’onglet Revoir Mes Blunders et calibre automatiquement le niveau lors d’un match contre un Bot ou un Humain', () => {
        const initialBoard = b0.board;
        const liveOutcome = recordLiveMatchDecisionOnAdaptiveProfile({
            board: initialBoard,
            turnIndex: 1,
            equityLoss: 0.145,
            isCube: false,
        });
        expect(liveOutcome.categoryMeta).toBeDefined();

        recordBlunder({
            id: 'user_blunder_match_1',
            board: initialBoard,
            dice: b0.dice,
            player: 'X',
            playedMove: b0.playedMove,
            optimalMove: b0.optimalMove,
            equityLoss: 0.178,
            verdict: 'blunder',
            conceptId: b0.conceptId,
            conceptName: b0.conceptName,
            explanation: b0.explanation,
            quizChoices: b0.quizChoices,
        });

        render(<BlunderDrillView />);
        const personalTab = screen.getByTestId('drill-mode-tab-personal');
        expect(personalTab.textContent).toContain('Revoir Mes Blunders');
        expect(personalTab.textContent).toContain('1');

        fireEvent.click(personalTab);
        expect(screen.getByText(/Vos Blunders de Match/i)).toBeDefined();
        fireEvent.click(screen.getByTestId('drill-hint-toggle'));
        expect(screen.getByText(new RegExp(b0.conceptName, 'i'))).toBeDefined();
    });

    it('affiche la terminologie unifiée ER / PR (échelle 0.0-30.0 par dixièmes), Rating 1500, Calibrage Quiz N+1, les 2 essais (❤️❤️), l’indice socratique au 1er échec et la solution complète au 2e échec', () => {
        const { unmount } = render(<BlunderDrillView initialConceptId={b1.conceptId} initialMode="pr_math" />);

        // 1. En-tête : Essais : 2/2 ❤️❤️ | ER / PR : 6.3 | Calibrage Quiz : ER / PR 6.0 (Objectif N+1) | Rating : 1500
        expect(screen.getByTestId('drill-mode-title').textContent).toContain('Quiz ER / PR');
        expect(screen.getByTestId('quiz-attempts-counter').textContent).toContain('Essais : 2/2');
        expect(screen.getByTestId('quiz-target-metric-badge').textContent).toContain('ER / PR : 6.3');
        expect(screen.getByTestId('quiz-nplus1-target-badge').textContent).toContain('Calibrage Quiz : ER / PR');
        expect(screen.getByTestId('quiz-nplus1-target-badge').textContent).toContain('(Objectif N+1)');
        expect(screen.getByTestId('quiz-elo-rating-badge').textContent).toContain('Rating : 1500');

        // 2. Clic sur le COUP OPTIMAL (buttons[0]) -> ER / PR baisse de -0.1 (6.2), AUCUN bloc "1. Pourquoi ton coup est une erreur"
        fireEvent.click(screen.getByTestId('quiz-choice-btn-A'));
        expect(screen.getByTestId('quiz-target-metric-badge').textContent).toContain('ER / PR : 6.2');
        expect(screen.getByTestId('quiz-live-rating-delta').textContent).toContain('▼ -0.1 (Progression)');
        expect(screen.queryByTestId('coach-block-1-error')).toBeNull();
        expect(screen.getByTestId('coach-block-2-optimal').textContent).toContain('Pourquoi ce coup est optimal :');
        expect(screen.getByTestId('coach-block-3-rule').textContent).toContain('💡 Règle à retenir :');
        unmount();

        // 3. 1er clic sur une ERREUR (quiz-choice-btn-C) -> Essais passe à 1/2 ❤️🖤, pénalité +0.2, Indice Socratique sans dévoiler la solution
        render(<BlunderDrillView initialConceptId={b1.conceptId} initialMode="pr_math" />);
        fireEvent.click(screen.getByTestId('quiz-choice-btn-C'));
        expect(screen.getByTestId('quiz-attempts-counter').textContent).toContain('Essais : 1/2');
        expect(screen.getByTestId('socratic-first-attempt-box').textContent).toContain('Indice Socratique');
        expect(screen.queryByTestId('coach-block-1-error')).toBeNull();

        // 4. 2e clic sur une AUTRE ERREUR (quiz-choice-btn-D) -> Essais passe à 0/2 🖤🖤, 3 blocs complets + carte FSRS v5 + Suivant
        fireEvent.click(screen.getByTestId('quiz-choice-btn-D'));
        expect(screen.getByTestId('quiz-attempts-counter').textContent).toContain('Essais : 0/2');
        expect(screen.getByTestId('coach-block-1-error').textContent).toContain('1. Pourquoi ton coup est une erreur :');
        expect(screen.getByTestId('coach-block-2-optimal').textContent).toContain('2. Pourquoi le coup optimal gagne :');
        expect(screen.getByTestId('coach-block-3-rule').textContent).toContain('💡 Comment t\'améliorer :');
        expect(screen.getByTestId('fsrs-scheduled-badge').textContent).toContain('FSRS v5');
        expect(screen.getByTestId('drill-retry-btn').textContent).toContain('Réessayer');
        expect(screen.getByTestId('drill-next-btn').textContent).toContain('Suivant');
    });

    it('applique la récompense Revanche -0.2 au 1er essai sur blunder personnel et affiche le badge issu du match', () => {
        const initialBoard = b0.board;
        recordBlunder({
            id: 'user_blunder_revenge_test',
            board: initialBoard,
            dice: b0.dice,
            player: 'X',
            playedMove: b0.playedMove,
            optimalMove: b0.optimalMove,
            equityLoss: 0.178,
            verdict: 'blunder',
            conceptId: b0.conceptId,
            conceptName: b0.conceptName,
            explanation: b0.explanation,
            quizChoices: b0.quizChoices,
            gameId: 'match_123',
            quizTargetER: 6.5,
        });

        render(<BlunderDrillView initialMode="personal_blunders" />);
        // Contrôle #14 : badge exact
        const badge = screen.getByTestId('quiz-nplus1-target-badge');
        expect(badge.textContent).toContain('🔥 Issu de ton match • Niveau Quiz : ER / PR');

        // Bouton filtre et bouton revanche présents
        expect(screen.getByTestId('drill-mode-tab-personal')).toBeDefined();
        expect(screen.getByTestId('post-match-revenge-blunders-btn')).toBeDefined();

        // Contrôle #12 : Succès 1er coup -> Récompense Revanche -0.2 (6.3 -> 6.1)
        fireEvent.click(screen.getByTestId('quiz-choice-btn-A'));
        expect(screen.getByTestId('quiz-target-metric-badge').textContent).toContain('ER / PR : 6.1');
        expect(screen.getByTestId('quiz-live-rating-delta').textContent).toContain('▼ -0.2 (Progression)');
    });
});
