// @vitest-environment jsdom
/**
 * Tests unitaires des composants de monétisation éthique & Soft Paywall :
 * - `SoftPaywallCard.tsx` (révélation gratuite du PR, teaser valorisant Open Sage "2 Coups Brillants (!!)", CTA Essai 7 jours)
 * - `SubscriptionModal.tsx` (bascule Mensuel/Annuel, badge "Économisez 33 % — 6,67 € / mois", 4 bénéfices exclusifs ⚜)
 * - `src/actions/coach.ts` (garde serveur bloquant l'appel LLM Gemini dès le 4e match gratuit)
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import SoftPaywallCard from './SoftPaywallCard';
import SubscriptionModal from './SubscriptionModal';
import { generateProtectedCoachSynthesisAction } from '../../actions/coach';
import type { MatchSummaryPayload } from '../summary/postMatchReportHelpers';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

const SAMPLE_SUMMARY: MatchSummaryPayload = {
    performanceRating: 4.85,
    prCategory: 'Maître',
    opponentPerformanceRating: 5.4,
    decisionsCount: 15,
    totalEquityLoss: 0.145,
    counters: { optimal: 11, good: 2, inaccuracy: 1, blunder: 1 },
    blunders: [],
    phaseBreakdown: { opening: 0, contact: 1, race: 0, bearoff: 0, unknown: 0 },
    winner: 'X',
    winType: 'single',
};

describe('SoftPaywallCard, SubscriptionModal & Action Serveur Coach', () => {
    it('affiche gratuitement le PR ("Performance Rating : 4.85 — Niveau Maître") et le teaser Open Sage sans message punitif', () => {
        render(<SoftPaywallCard analysis={null} locale="fr" />);

        expect(screen.getByTestId('soft-paywall-pr-reveal').textContent).toBe(
            'Performance Rating : 4.85 — Niveau Maître',
        );
        expect(screen.getByTestId('soft-paywall-teaser-text').textContent).toBe(
            'Vous avez joué 2 Coups Brillants (!!) et manqué 1 opportunité décisive de videau. Passez au Coach Illimité pour comprendre pourquoi.',
        );
        expect(screen.getByTestId('soft-paywall-unlock-btn').textContent).toBe(
            "Débloquer l'Analyse avec le Coach Illimité (Essai 7 jours)",
        );

        // Cliquer sur le bouton doré ouvre la modale d'abonnement
        fireEvent.click(screen.getByTestId('soft-paywall-unlock-btn'));
        expect(screen.getByTestId('subscription-modal')).toBeTruthy();
    });

    it('affiche la modale prestige avec bascule Mensuel/Annuel, badge -33 % et les 4 privilèges ⚜', () => {
        render(<SubscriptionModal isOpen={true} initialPlan="coach_yearly" />);

        expect(screen.getByTestId('subscription-discount-badge').textContent).toBe(
            'Économisez 33 % — 6,67 € / mois',
        );

        const benefitsList = screen.getByTestId('subscription-benefits-list').textContent ?? '';
        expect(benefitsList).toContain('⚜ Analyses et explications du Coach IA illimitées.');
        expect(benefitsList).toContain(
            '⚜ Bibliothèque de révision des gaffes avec répétition espacée.',
        );
        expect(benefitsList).toContain('⚜ Puzzles tactiques quotidiens illimités.');
        expect(benefitsList).toContain(
            '⚜ Zéro pub, Zéro distraction, Soutien à une plateforme 100 % indépendante.',
        );

        // Bascule sur le plan mensuel
        fireEvent.click(screen.getByTestId('toggle-plan-monthly'));
        expect(screen.getByTestId('stripe-checkout-submit-btn').textContent).toContain(
            '9,99 € TTC / mois',
        );
    });

    it('bloque l’appel LLM Gemini dans src/actions/coach.ts lorsque le quota de 3 analyses / 24h est atteint', async () => {
        const fetchSpy = vi.fn();
        globalThis.fetch = fetchSpy;
        process.env.GEMINI_API_KEY = 'test-gemini-key';

        const result = await generateProtectedCoachSynthesisAction({
            summary: SAMPLE_SUMMARY,
            tier: 'free',
            dailyAnalysesCount: 3,
            lastAnalysisResetAt: new Date().toISOString(),
            consume: true,
        });

        expect(result.allowed).toBe(false);
        expect(result.quotaReached).toBe(true);
        expect(result.source).toBe('quota-blocked');
        expect(result.synthesis).toBeNull();
        expect(result.teaser.prDisplayFr).toBe('Performance Rating : 4.85 — Niveau Maître');
        // Aucun appel réseau vers Gemini ne doit avoir été déclenché
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});
