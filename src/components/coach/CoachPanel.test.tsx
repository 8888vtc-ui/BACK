import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CoachPanel from './CoachPanel';

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
                onDismiss={() => {}}
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
                onDismiss={() => {}}
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
                onDismiss={() => {}}
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
                onDismiss={() => {}}
            />,
        );

        expect(html).toContain('Douteux');
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
                onDismiss={() => {}}
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
            onDismiss: () => {},
            apiUrl: '/api/coach',
        };

        const html = renderToStaticMarkup(<CoachPanel {...props} />);
        expect(html).toContain('Explique mon erreur');
    });

    it('affiche le contexte de match complet (MET, pointsToWin, Crawford, gammon price, take point)', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20"
                optimalMove="8/4"
                onDismiss={() => {}}
                matchContext={{
                    matchLength: 7,
                    scoreX: 6,
                    scoreO: 3,
                    crawford: true,
                    cubeValue: 1,
                    cubeOwner: null,
                }}
            />,
        );

        expect(html).toContain('Match en 7 pts');
        expect(html).toContain('X 6');
        expect(html).toContain('1 to win');
        expect(html).toContain('O 3');
        expect(html).toContain('4 to win');
        expect(html).toContain('Crawford');
        expect(html).toContain('Prix du gammon (MET)');
        expect(html).toContain('Take point');
    });

    it('affiche le badge DMP quand les deux joueurs sont à 1 point de la victoire', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20"
                optimalMove="8/4"
                onDismiss={() => {}}
                matchContext={{
                    matchLength: 7,
                    scoreX: 6,
                    scoreO: 6,
                }}
            />,
        );

        expect(html).toContain('DMP');
        expect(html).toContain('1 to win');
    });

    it('affiche les sélecteurs de modes (Automatique vs À la demande et Hors-ligne)', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20"
                optimalMove="8/4"
                onDismiss={() => {}}
                triggerMode="manual"
            />,
        );

        expect(html).toContain('Mode coach :');
        expect(html).toContain('Automatique');
        expect(html).toContain('À la demande');
        expect(html).toContain('En ligne');
    });

    it('affiche le sélecteur de seuil lorsque le mode automatique est sélectionné', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20"
                optimalMove="8/4"
                onDismiss={() => {}}
                triggerMode="auto"
                autoThreshold="blunder"
            />,
        );

        expect(html).toContain('Seuil :');
        expect(html).toContain('Blunders seuls');
    });

    it('affiche le mode dégradé offline lorsque isOffline est activé', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20"
                optimalMove="8/4"
                onDismiss={() => {}}
                isOffline={true}
            />,
        );

        expect(html).toContain('Mode dégradé offline');
    });

    it('bascule sur l\'explication règle-basée issue de featureExtractor si l\'API ou le streaming timeout (8s)', () => {
        const features = {
            player: 'X' as const,
            pipCountDiff: { player: 150, opponent: 160, leader: 'X' as const, diff: -10 },
            blotsAndShots: { user: [], best: [] },
            boardStructure: { anchors: [20], primes: { length: 3, points: [6, 7, 8] }, homeBoardPoints: [6], escapedCheckers: 2 },
            contactStatus: 'contact' as const,
        };

        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20 13/11"
                optimalMove="8/4 6/4"
                features={features}
                onDismiss={() => {}}
                isOffline={true}
            />,
        );

        expect(html).toContain('Coach en Temps Réel');
        expect(html).toContain('Mode dégradé offline');
    });
});

