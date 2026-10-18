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

    it('affiche le bouton flottant quand coach est actif mais tiroir fermé', () => {
        const html = renderToStaticMarkup(
            <CoachMobileDrawer
                isOpen={false}
                onOpen={vi.fn()}
                onClose={vi.fn()}
                coach={{ verdict: 'blunder' } as any}
                isAnalyzing={false}
                onDismiss={vi.fn()}
            />,
        );
        expect(html).toContain('Analyse (Blunder)');
        expect(html).toContain('animate-bounce');
    });
});
