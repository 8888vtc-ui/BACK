// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import BlunderDrillView from './BlunderDrillView';
import { clearBlunderBank, getBlunderBankStats } from '../../features/drills/blunderBank';
import { BENCHMARK_BLUNDERS } from '../../features/drills/benchmarkBlunders';
import {
    resetAdaptivePlayerProfile,
    recordLiveMatchDecisionOnAdaptiveProfile,
} from '../../features/drills/adaptiveQuizEngine';
import { seedDemoPersonalBlunders } from '../../lib/blunders/personalBlunderStore';

// Mock next/navigation for PersonalBlundersNotebookView
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
    }),
    usePathname: () => '/puzzles',
    useSearchParams: () => new URLSearchParams(),
}));

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

describe('BlunderDrillView Component (Parcours Adaptatif & Carnet de Blunders Personnels)', () => {
    let mockStore: Record<string, string> = {};
    const b0 = BENCHMARK_BLUNDERS[0]!;
    const b1 = BENCHMARK_BLUNDERS.find((b) => b.equityLoss >= 0.08 && (b.quizChoices?.length ?? 0) >= 4) ?? BENCHMARK_BLUNDERS[1] ?? b0;

    function authenticateMockMember() {
        mockStore['bgtour_local_auth_profile_v1'] = JSON.stringify({
            email: 'alexandre@backgammontour.com',
            displayName: 'Alexandre D.',
            countryCode: 'FR',
            avatarUrl: '/avatars/default.png',
            experienceLevel: 'intermediate',
        });
        mockStore['bgtour_player_tier_gate_v1'] = 'INTERMEDIATE';
    }

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

    it('permet de répondre en 1 clic via le Quiz Express QCM et affiche l’explication pédagogique', () => {
        render(<BlunderDrillView initialConceptId={b0.conceptId} />);

        const qcmBox = screen.getByTestId('quiz-qcm-choices');
        const buttons = qcmBox.querySelectorAll('button');
        expect(buttons.length).toBe(4);

        fireEvent.click(buttons[0]!);
        const banner = screen.getByTestId('drill-feedback-banner');
        expect(banner.textContent).toContain('Coach Pédagogique');
        expect(getBlunderBankStats().totalBlunders).toBe(BENCHMARK_BLUNDERS.length);
    });

    it('garantit l’unification ER / PR (0.0-30.0) pour un membre connecté, l’évolution dynamique du niveau et la ligne unique de contexte', () => {
        authenticateMockMember();
        const { unmount } = render(<BlunderDrillView initialConceptId={b0.conceptId} initialMode="pr_math" />);
        expect(screen.getByTestId('drill-mode-title').textContent).toContain('Quiz ER / PR');
        expect(screen.getByTestId('drill-mode-title').textContent).not.toContain('ERH');

        const initialErBadge = screen.getByTestId('quiz-live-rating-badge');
        expect(initialErBadge.textContent).toContain('Niveau ER : 1500');
        expect(screen.getByTestId('quiz-nplus1-target-badge').textContent).toContain('Calibrage Quiz : ER / PR');
        expect(screen.getByTestId('quiz-nplus1-target-badge').textContent).toContain('(Objectif N+1)');

        const contextLine = screen.getByTestId('drill-match-context-grid');
        expect(contextLine.textContent).toContain('Videau :');

        fireEvent.click(screen.getByTestId('quiz-choice-btn-A'));
        expect(screen.getByTestId('quiz-live-rating-badge').textContent).toMatch(/Niveau ER : 15(1|2)/);
        expect(screen.getByTestId('quiz-live-rating-delta').textContent).toContain('+');
        expect(screen.getByTestId('drill-next-btn').textContent).toContain('Question suivante →');
        expect(mockStore['bg_quiz_er_rating_v1']).toBeDefined();
        unmount();

        render(<BlunderDrillView initialConceptId={b0.conceptId} initialMode="adaptive" />);
        expect(screen.getByTestId('drill-mode-title').textContent).toContain('Quiz ER / PR');
        fireEvent.click(screen.getByTestId('quiz-choice-btn-C'));
        expect(screen.getByTestId('quiz-live-rating-delta').textContent).toContain('-');
    });

    it('bloque l’accès aux Blunders Personnels pour un Joueur Invité et affiche l’écran verrouillé avec CTA Plein Or', () => {
        render(<BlunderDrillView initialMode="personal_blunders" />);
        expect(screen.getByTestId('personal-blunders-guest-lock-view')).toBeDefined();
        expect(screen.getByTestId('unlock-personal-blunders-cta').textContent).toContain('SE CONNECTER');
        expect(screen.queryByTestId('quiz-qcm-choices')).toBeNull();
    });

    it('affiche la mémoire complète du match (Date, Adversaire, Score, Tour) et résout un Blunder Personnel pour un Compte Connecté', () => {
        authenticateMockMember();
        const initialBoard = b0.board;
        const liveOutcome = recordLiveMatchDecisionOnAdaptiveProfile({
            board: initialBoard,
            turnIndex: 1,
            equityLoss: 0.145,
            isCube: false,
        });
        expect(liveOutcome.categoryMeta).toBeDefined();

        const demoBlunders = seedDemoPersonalBlunders('Alexandre D.');
        expect(demoBlunders.length).toBe(3);

        render(<BlunderDrillView initialMode="personal_blunders" />);
        expect(screen.getByTestId('personal-blunders-notebook-view')).toBeDefined();
        expect(screen.getByTestId('blunder-match-opponent').textContent).toContain('Kosta_Ath');
        expect(screen.getByTestId('blunder-match-score-turn').textContent).toContain('Score : 2 - 3');
        expect(screen.getByTestId('blunder-match-score-turn').textContent).toContain('Tour #12');
        expect(screen.getByTestId('personal-blunders-tab-pending').textContent).toContain('À corriger (3)');
        expect(screen.getByTestId('personal-blunders-tab-resolved').textContent).toContain('Résolus (0)');

        // Clique sur le coup optimal A -> passe en Résolu et affiche le panneau comparatif
        fireEvent.click(screen.getByTestId('quiz-choice-btn-A'));
        expect(screen.getByTestId('personal-blunder-comparative-panel')).toBeDefined();
        expect(screen.getByTestId('comparative-played-move-card').textContent).toContain('Ton Coup en Match');
        expect(screen.getByTestId('comparative-optimal-move-card').textContent).toContain('La Solution 3-Ply');
        expect(screen.getByTestId('personal-blunders-tab-pending').textContent).toContain('À corriger (2)');
        expect(screen.getByTestId('personal-blunders-tab-resolved').textContent).toContain('Résolus (1)');
    });

    it('affiche la terminologie unifiée ER / PR (échelle 0.0-30.0 par dixièmes), Rating 1500, les 2 essais, l’indice socratique au 1er échec et la solution complète au 2e échec', () => {
        authenticateMockMember();
        const { unmount } = render(<BlunderDrillView initialConceptId={b1.conceptId} initialMode="pr_math" />);

        expect(screen.getByTestId('drill-mode-title').textContent).toContain('Quiz ER / PR');
        expect(screen.getByTestId('quiz-attempts-counter').textContent).toContain('Essais : 2/2');
        expect(screen.getByTestId('quiz-target-metric-badge').textContent).toContain('ER / PR : 6.3');
        expect(screen.getByTestId('quiz-nplus1-target-badge').textContent).toContain('Calibrage Quiz : ER / PR');
        expect(screen.getByTestId('quiz-elo-rating-badge').textContent).toContain('Rating : 1500');

        fireEvent.click(screen.getByTestId('quiz-choice-btn-A'));
        expect(screen.getByTestId('quiz-target-metric-badge').textContent).toContain('ER / PR : 6.2');
        expect(screen.getByTestId('quiz-live-rating-delta').textContent).toContain('▼ -0.1 (Progression)');
        expect(screen.queryByTestId('coach-block-1-error')).toBeNull();
        expect(screen.getByTestId('coach-block-2-optimal').textContent).toContain('Pourquoi ce coup est optimal :');
        expect(screen.getByTestId('coach-block-3-rule').textContent).toContain('Règle à retenir :');
        unmount();

        render(<BlunderDrillView initialConceptId={b1.conceptId} initialMode="pr_math" />);
        fireEvent.click(screen.getByTestId('quiz-choice-btn-C'));
        expect(screen.getByTestId('quiz-attempts-counter').textContent).toContain('Essais : 1/2');
        expect(screen.getByTestId('socratic-first-attempt-box').textContent).toContain('Indice Socratique');
        expect(screen.queryByTestId('coach-block-1-error')).toBeNull();

        fireEvent.click(screen.getByTestId('quiz-choice-btn-D'));
        expect(screen.getByTestId('quiz-attempts-counter').textContent).toContain('Essais : 0/2');
        expect(screen.getByTestId('coach-block-1-error').textContent).toContain('1. Pourquoi ton coup est une erreur :');
        expect(screen.getByTestId('coach-block-2-optimal').textContent).toContain('2. Pourquoi le coup optimal gagne :');
        expect(screen.getByTestId('coach-block-3-rule').textContent).toContain('Comment t\'améliorer :');
        expect(screen.getByTestId('fsrs-scheduled-badge').textContent).toContain('FSRS v5');
        expect(screen.getByTestId('drill-retry-btn').textContent).toContain('Réessayer');
        expect(screen.getByTestId('drill-next-btn').textContent).toContain('Suivant');
    });
});
