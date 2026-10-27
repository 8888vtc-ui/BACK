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
import CancelFlowModal from './CancelFlowModal';
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

    it('affiche l’économie en % ET en valeur absolue (39,89 € / an), la frise d’essai Adapty, le 3e palier Club et la garantie 30 jours', () => {
        render(<SubscriptionModal isOpen={true} initialPlan="coach_yearly" />);

        expect(screen.getByTestId('annual-absolute-savings-label').textContent).toBe(
            'Économisez 33 % — soit 39,89 € / an',
        );
        expect(screen.getByTestId('subscription-trial-timeline').textContent).toContain(
            'Aujourd’hui (Jour 0)',
        );
        expect(screen.getByTestId('stripe-security-guarantee').textContent).toContain(
            '30 jours sans condition',
        );

        // Sélection du 3e palier Pack Club & Chouette
        fireEvent.click(screen.getByTestId('plan-card-club'));
        expect(screen.getByTestId('stripe-checkout-submit-btn').textContent).toContain(
            '149,99 € / an',
        );
    });

    it('exécute le tunnel de rétention CancelFlowModal en 3 étapes (Enquête motif -> Pause 1-3 mois -> Confirmation)', () => {
        const onAcceptSaveOffer = vi.fn();
        render(<CancelFlowModal isOpen={true} onClose={vi.fn()} onAcceptSaveOffer={onAcceptSaveOffer} />);

        // Étape 1 -> Étape 2
        fireEvent.click(screen.getByTestId('cancel-flow-next-step-btn'));
        expect(screen.getByTestId('cancel-save-offer-title').textContent).toContain(
            'Mettre mon abonnement en pause',
        );

        // Choix d'une pause de 3 mois et validation
        fireEvent.click(screen.getByTestId('pause-duration-3m'));
        fireEvent.click(screen.getByTestId('cancel-accept-save-offer-btn'));

        expect(onAcceptSaveOffer).toHaveBeenCalledWith({
            reason: 'low_usage',
            offerType: 'pause_1_to_3_months',
            pauseMonths: 3,
        });
        expect(screen.getByTestId('cancel-flow-resolution-msg').textContent).toContain('3 mois');
    });
});
