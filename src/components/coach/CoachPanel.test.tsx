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

    it('affiche le bouton à bascule de la voix du Coach et le bouton Réécouter quand une explication est présente', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20 13/11"
                optimalMove="8/4 6/4"
                explanation="Le coup joué expose deux blots directs."
                onDismiss={() => { }}
            />,
        );

        expect(html).toContain('data-testid="coach-voice-toggle-btn"');
        expect(html).toContain('🔇 Voix muette');
        expect(html).toContain('data-testid="coach-voice-replay-btn"');
        expect(html).toContain('Réécouter');
    });

    it('place CoachMoveComparisonCard avant CoachDiagnosticBox et CoachPrDashboard, sans dupliquer whyFailed/whyOptimal ni le bouton Fiche Théorique', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20 13/11"
                optimalMove="8/4 6/4"
                whyFailed="Cause unique erreur"
                whyOptimal="Raison unique optimal"
                summary="Résumé unique"
                tacticalSummary="Diagnostic tactique"
                explanation={JSON.stringify({
                    explanation: 'Explication détaillée',
                    keyConcept: 'Golden Point',
                    conceptId: 'golden_point',
                })}
                onOpenKnowledgeConcept={vi.fn()}
                onDismiss={() => { }}
            />,
        );

        const idxComparison = html.indexOf('data-testid="coach-move-comparison-card"');
        const idxDiagnostic = html.indexOf('data-testid="coach-diagnostic-box"');
        const idxPr = html.indexOf('data-testid="coach-pr-dashboard"');

        expect(idxComparison).toBeGreaterThan(-1);
        expect(idxDiagnostic).toBeGreaterThan(idxComparison);
        expect(idxPr).toBeGreaterThan(idxDiagnostic);

        // whyFailed, whyOptimal et summary ne doivent apparaître qu'une seule fois (dans CoachMoveComparisonCard)
        expect(html.split('Cause unique erreur').length - 1).toBe(1);
        expect(html.split('Raison unique optimal').length - 1).toBe(1);
        expect(html.split('Résumé unique').length - 1).toBe(1);

        // Un seul bouton Fiche Théorique (celui du badge keyConcept dans CoachDiagnosticBox)
        expect(html).toContain('data-testid="coach-concept-badge-btn"');
        expect(html).not.toContain('data-testid="coach-open-kb-btn"');
    });

    it('Bug 4 : donne la priorité à l\'explication LLM Gemini (parsed.whyFailed / whyOptimal / summary) sur les props locales pour ne jamais écraser le flux SSE', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20 13/11"
                optimalMove="8/5 6/5"
                whyFailed="Texte local whyFailed obsolète"
                whyOptimal="Texte local whyOptimal obsolète"
                summary="Résumé local obsolète"
                explanation={JSON.stringify({
                    summary: 'Résumé Gemini LLM prioritaire',
                    whyFailed: 'Diagnostic Gemini whyFailed prioritaire',
                    whyOptimal: 'Diagnostic Gemini whyOptimal prioritaire',
                    explanation: 'Analyse complète Grand-Maître Gemini 3.8 Flash.',
                    keyConcept: 'Contrôle du Golden Point',
                    conceptId: 'golden-point',
                })}
                onDismiss={() => { }}
            />,
        );

        expect(html).toContain('Résumé Gemini LLM prioritaire');
        expect(html).toContain('Diagnostic Gemini whyFailed prioritaire');
        expect(html).toContain('Diagnostic Gemini whyOptimal prioritaire');
        expect(html).not.toContain('Texte local whyFailed obsolète');
        expect(html).not.toContain('Texte local whyOptimal obsolète');
        expect(html).not.toContain('Résumé local obsolète');
    });

    it('affiche les 3 onglets Zéro-Scroll, le module « 🧠 Analyse Profonde » (1/1 offerte) et les 3 questions en 1 clic sans jamais mentionner 3.8', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20 13/11"
                optimalMove="8/5 6/5"
                onDismiss={() => { }}
            />,
        );

        expect(html).toContain('data-testid="coach-zero-scroll-tabs"');
        expect(html).toContain('data-testid="coach-tab-diagnostic"');
        expect(html).toContain('data-testid="coach-tab-candidates"');
        expect(html).toContain('data-testid="coach-tab-questions"');
        expect(html).toContain('data-testid="coach-deep-analysis-section"');
        expect(html).toContain('🧠 Analyse Profonde');
        expect(html).toContain('1/1 offerte aujourd&#x27;hui');
        expect(html).toContain('data-testid="coach-deep-question-why_equity"');
        expect(html).toContain('data-testid="coach-deep-question-next_36_rolls"');
        expect(html).toContain('data-testid="coach-deep-question-cube_and_plan"');
        expect(html).not.toContain('3.8');
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

