import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CoachSidebar from './CoachSidebar';

describe('CoachSidebar Component', () => {
    it('affiche l’état « Coach prêt » quand aucun coach n\'est déclenché', () => {
        const html = renderToStaticMarkup(
            <CoachSidebar
                coach={null}
                isAnalyzing={false}
                onDismiss={vi.fn()}
                onTriggerCoach={vi.fn()}
                theme="midnight"
            />,
        );
        // `renderToStaticMarkup` échappe l'esperluette du titre en entité HTML.
        expect(html).toContain('Coach IA');
        expect(html).toContain('Analyse</h2>');
        expect(html).toContain('Coach prêt');
        expect(html).toContain('Demander conseil au Coach');
    });

    it('ne contient plus la veille stratégique ni la bannière prestige', () => {
        const html = renderToStaticMarkup(
            <CoachSidebar
                coach={null}
                isAnalyzing={false}
                onDismiss={vi.fn()}
                onTriggerCoach={vi.fn()}
                theme="snowie_classic"
            />,
        );
        expect(html).not.toContain('Veille Stratégique Active');
        expect(html).not.toContain('snowie-vintage-banner');
        expect(html).not.toContain('ÉDITION PRESTIGE');
    });

    it('masque le header dupliqué de CoachSidebar quand un verdict est affiché et ne duplique ni le bouton Rejouer ni le magnétoscope', () => {
        const html = renderToStaticMarkup(
            <CoachSidebar
                coach={{
                    verdict: 'blunder',
                    equityLoss: -0.142,
                    playedMove: '24/20 13/11',
                    optimalMove: '8/4 6/4',
                    explanation: null,
                }}
                isAnalyzing={false}
                onDismiss={vi.fn()}
                onReplayMove={vi.fn()}
                onTriggerCoach={vi.fn()}
                theme="midnight"
                coachHistory={[
                    {
                        turnIndex: 1,
                        coachState: {
                            verdict: 'blunder',
                            equityLoss: -0.142,
                            playedMove: '24/20 13/11',
                            optimalMove: '8/4 6/4',
                            explanation: null,
                        },
                        highlight: null,
                        boardBefore: new Array(26).fill(0),
                        boardAfter: new Array(26).fill(0),
                        dice: [4, 2],
                        timestamp: 1000,
                    },
                ]}
                onSelectCoachHistoryIndex={vi.fn()}
            />,
        );

        // Pas de header "Fermer ✕" dupliqué dans CoachSidebar quand un verdict est affiché
        expect(html).not.toContain('Fermer ✕');
        // Pas de barre d'historique dupliquée dans CoachSidebar
        expect(html).not.toContain('data-testid="coach-history-nav"');
        // Un seul bouton Rejouer (celui de CoachMoveComparisonCard, pas celui de CoachLiveAiRadar)
        expect(html).toContain('data-testid="coach-replay-move-btn"');
        expect(html).not.toContain('data-testid="coach-second-chance-replay-btn"');
    });

    it('ne duplique pas le header Coach IA & Analyse pendant le chargement (isAnalyzing = true)', () => {
        const html = renderToStaticMarkup(
            <CoachSidebar
                coach={{
                    verdict: 'blunder',
                    equityLoss: -0.142,
                    playedMove: '24/20 13/11',
                    optimalMove: '8/4 6/4',
                    explanation: null,
                }}
                isAnalyzing={true}
                onDismiss={vi.fn()}
                theme="midnight"
            />,
        );

        // Seul le header du skeleton doit être présent, pas celui de CoachSidebar ("Fermer ✕")
        expect(html).not.toContain('Fermer ✕');
    });
});
