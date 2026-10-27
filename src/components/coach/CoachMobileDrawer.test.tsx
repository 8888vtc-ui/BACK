// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CoachMobileDrawer from './CoachMobileDrawer';

describe('CoachMobileDrawer Component', () => {
    it('est masqué hors de l\'écran quand isOpen est false', () => {
        const html = renderToStaticMarkup(
            <CoachMobileDrawer
                isOpen={false}
                onOpen={vi.fn()}
                onClose={vi.fn()}
                coach={null}
                isAnalyzing={false}
                onDismiss={vi.fn()}
            />,
        );
        expect(html).toContain('translate-y-full');
    });

    it('affiche la barre résumée (PR | verdict | Ouvrir) quand le tiroir est fermé', () => {
        const html = renderToStaticMarkup(
            <CoachMobileDrawer
                isOpen={false}
                onOpen={vi.fn()}
                onClose={vi.fn()}
                coach={{ verdict: 'blunder', equityLoss: -0.142 } as any}
                isAnalyzing={false}
                onDismiss={vi.fn()}
                pr={5.42}
            />,
        );
        expect(html).toContain('data-testid="coach-mobile-summary-bar"');
        expect(html).toContain('data-testid="coach-mobile-pr"');
        expect(html).toContain('5.42');
        expect(html).toContain('data-testid="coach-mobile-verdict"');
        expect(html).toContain('BLUNDER MAJEUR');
        expect(html).toContain('data-testid="coach-mobile-open-btn"');
        // `renderToStaticMarkup` échappe l'apostrophe en entité HTML.
        expect(html).toContain('Ouvrir l');
        expect(html).toContain('analyse</span>');
        // L'animation clignotante a été retirée pour rester sobre.
        expect(html).not.toContain('animate-bounce');
    });

    it('masque la barre résumée quand le Bottom Sheet est déplié', () => {
        const html = renderToStaticMarkup(
            <CoachMobileDrawer
                isOpen={true}
                onOpen={vi.fn()}
                onClose={vi.fn()}
                coach={{ verdict: 'doubtful', equityLoss: -0.045 } as any}
                isAnalyzing={false}
                onDismiss={vi.fn()}
                pr={5.42}
            />,
        );
        expect(html).not.toContain('data-testid="coach-mobile-summary-bar"');
    });

    it('affiche les contrôles de navigation temporelle des coups quand coachHistory est fourni', () => {
        const mockHistory = [
            {
                turnIndex: 1,
                coachState: { verdict: 'blunder', equityLoss: -0.142 } as any,
                highlight: null,
                boardBefore: new Array(26).fill(0),
                boardAfter: new Array(26).fill(0),
                dice: [3, 1] as [number, number],
                timestamp: 1000,
            },
            {
                turnIndex: 2,
                coachState: { verdict: 'optimal', equityLoss: 0 } as any,
                highlight: null,
                boardBefore: new Array(26).fill(0),
                boardAfter: new Array(26).fill(0),
                dice: [4, 2] as [number, number],
                timestamp: 2000,
            },
        ];

        const html = renderToStaticMarkup(
            <CoachMobileDrawer
                isOpen={true}
                onOpen={vi.fn()}
                onClose={vi.fn()}
                coach={mockHistory[1].coachState}
                isAnalyzing={false}
                onDismiss={vi.fn()}
                coachHistory={mockHistory}
                selectedCoachHistoryIndex={1}
                onSelectCoachHistoryIndex={vi.fn()}
            />,
        );

        expect(html).toContain('Coup #2 (2/2)');
        expect(html).toContain('Préc.');
        expect(html).toContain('Suiv.');
        expect(html).toContain('Direct');
    });

    it('s\'ouvre correctement (sans deadlock) même quand coach est null et affiche le Radar IA en direct', () => {
        const html = renderToStaticMarkup(
            <CoachMobileDrawer
                isOpen={true}
                onOpen={vi.fn()}
                onClose={vi.fn()}
                coach={null}
                isAnalyzing={false}
                onDismiss={vi.fn()}
            />,
        );

        expect(html).toContain('translate-y-0');
        expect(html).not.toContain('translate-y-full');
        expect(html).toContain('data-testid="coach-drawer-backdrop"');
        expect(html).toContain('data-testid="coach-live-ai-radar"');
        expect(html).toContain('46dvh');
        expect(html).toContain('data-snap-state="half"');
        expect(html).toContain('data-testid="coach-drawer-snap-toggle"');
    });

    it('Étape 5 : normalise les 3 crans (fermé 0px / demi-écran 46dvh / plein écran 90dvh)', async () => {
        const { render, fireEvent } = await import('@testing-library/react');
        const { getByTestId } = render(
            <CoachMobileDrawer
                isOpen={true}
                onOpen={vi.fn()}
                onClose={vi.fn()}
                coach={{ verdict: 'blunder', equityLoss: -0.12 } as any}
                isAnalyzing={false}
                onDismiss={vi.fn()}
            />,
        );

        const drawer = getByTestId('coach-drawer-mobile');
        expect(drawer.getAttribute('data-snap-state')).toBe('half');
        expect(drawer.innerHTML).toContain('46dvh');

        const toggleBtn = getByTestId('coach-drawer-snap-toggle');
        // Clic sur agrandir (passe à 90dvh)
        fireEvent.click(toggleBtn);
        expect(drawer.getAttribute('data-snap-state')).toBe('full');
        expect(drawer.innerHTML).toContain('90dvh');

        // Clic sur réduire (revient à 46dvh)
        fireEvent.click(toggleBtn);
        expect(drawer.getAttribute('data-snap-state')).toBe('half');
        expect(drawer.innerHTML).toContain('46dvh');
    });
});

