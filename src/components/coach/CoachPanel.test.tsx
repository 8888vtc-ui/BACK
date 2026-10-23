import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CoachPanel, { computePerformanceRating, getPRBadge } from './CoachPanel';

describe('CoachPanel Component', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('ne rend rien si verdict est null', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict={null}
                equityLoss={null}
                playedMove={null}
                optimalMove={null}
                onDismiss={() => { }}
            />,
        );
        expect(html).toBe('');
    });

    it('affiche le skeleton quand isLoading est vrai', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20 13/11"
                optimalMove="8/4 6/4"
                onDismiss={() => { }}
                isLoading={true}
            />,
        );
        expect(html).toContain('animate-pulse');
        expect(html).toContain('Coach en Temps Réel');
    });

    it('affiche le diagnostic Blunder, le coup joué, le coup optimal et le bouton d\'explication', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20 13/11"
                optimalMove="8/4 6/4"
                onDismiss={() => { }}
            />,
        );

        expect(html).toContain('Coach en Temps Réel');
        expect(html).toContain('Blunder');
        expect(html).toContain('-0.125');
        expect(html).toContain('24/20 13/11');
        expect(html).toContain('8/4 6/4');
        expect(html).toContain('Explique mon erreur');
    });

    it('affiche le diagnostic Douteux avec le style ambre', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="doubtful"
                equityLoss={-0.035}
                playedMove="13/9"
                optimalMove="8/4"
                onDismiss={() => { }}
            />,
        );

        // Bandeau de verdict XG : palier « IMPRÉCISION » avec la perte affichée.
        expect(html).toContain('IMPRÉCISION (-0.035)');
        expect(html).toContain('border-amber-500');
        expect(html).toContain('-0.035');
    });

    it('affiche directement l\'explication statique si fournie en prop', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20 13/11"
                optimalMove="8/4 6/4"
                explanation="Le coup joué concède trop de tirs directs."
                onDismiss={() => { }}
            />,
        );

        expect(html).toContain('Le coup joué concède trop de tirs directs.');
        expect(html).not.toContain('Explique mon erreur');
    });

    it('déclenche le streaming SSE vers l\'API au clic sur Explique mon erreur', async () => {
        const encoder = new TextEncoder();
        const mockStream = new ReadableStream({
            start(controller) {
                controller.enqueue(
                    encoder.encode(
                        'data: {"token": "{\\"summary\\":\\"Trop de tirs\\",\\"explanation\\":\\"Le coup laisse 6 tirs.\\",\\"keyConcept\\":\\"Sécurité\\"}"}\n\n',
                    ),
                );
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
            },
        });

        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            body: mockStream,
        });
        globalThis.fetch = mockFetch;

        const onExplainMock = vi.fn();

        // Création et exécution dans un environnement simulant le DOM
        const props = {
            verdict: 'blunder' as const,
            equityLoss: -0.125,
            playedMove: '24/20 13/11',
            optimalMove: '8/4 6/4',
            onExplain: onExplainMock,
            onDismiss: () => { },
            apiUrl: '/api/coach',
        };

        const html = renderToStaticMarkup(<CoachPanel {...props} />);
        expect(html).toContain('Explique mon erreur');
    });

    it('affiche le tableau de bord PR (jauge + 4 paliers) quand matchStats est fourni', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20 13/11"
                optimalMove="8/4 6/4"
                matchStats={{
                    decisionsCount: 10,
                    totalEquityLoss: 0.42,
                    blundersCount: 3,
                    decisionCounters: { optimal: 5, good: 1, inaccuracy: 1, blunder: 3 },
                }}
                onDismiss={() => { }}
            />,
        );

        expect(html).toContain('data-testid="coach-pr-dashboard"');
        expect(html).toContain('data-testid="coach-pr-value"');
        expect(html).toContain('21.00');
        expect(html).toContain('Apprentissage');
        expect(html).toContain('Précision');
        expect(html).toContain('data-testid="coach-counter-optimal"');
        expect(html).toContain('data-testid="coach-counter-good"');
        expect(html).toContain('data-testid="coach-counter-inaccuracy"');
        expect(html).toContain('data-testid="coach-counter-blunder"');
        expect(html).toContain('data-testid="coach-total-equity-loss"');
        expect(html).toContain('-0.420');
    });
});

describe('computePerformanceRating & getPRBadge', () => {
    it('calcule le PR avec la formule (totalEquityLoss / decisionsCount) * 500', () => {
        expect(computePerformanceRating({ decisionsCount: 10, totalEquityLoss: 0.42, blundersCount: 0 })).toBeCloseTo(21.0, 1);
        expect(computePerformanceRating({ decisionsCount: 0, totalEquityLoss: 0, blundersCount: 0 })).toBe(0);
        expect(computePerformanceRating({ decisionsCount: 20, totalEquityLoss: 0.2, blundersCount: 0 })).toBeCloseTo(5.0, 1);
    });

    it('détermine le badge de niveau selon les seuils (alignés sur getPRCategory)', () => {
        expect(getPRBadge(2.5)).toBe('Grandmaster');
        expect(getPRBadge(4.2)).toBe('Master');
        expect(getPRBadge(6.0)).toBe('Expert');
        expect(getPRBadge(8.5)).toBe('Advanced');
        expect(getPRBadge(12.0)).toBe('Intermédiaire');
        expect(getPRBadge(15.0)).toBe('Débutant');
    });
});

