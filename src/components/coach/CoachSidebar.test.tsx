import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CoachSidebar from './CoachSidebar';

describe('CoachSidebar Component', () => {
    it('affiche la veille stratégique active quand aucun coach n\'est déclenché', () => {
        const html = renderToStaticMarkup(
            <CoachSidebar
                coach={null}
                isAnalyzing={false}
                onDismiss={vi.fn()}
                onTriggerCoach={vi.fn()}
                theme="midnight"
            />,
        );
        expect(html).toContain('Coach IA &amp; Analyse');
        expect(html).toContain('Veille Stratégique Active');
        expect(html).toContain('Demander conseil au Coach');
    });

    it('affiche la bannière prestige sous le thème snowie_classic', () => {
        const html = renderToStaticMarkup(
            <CoachSidebar
                coach={null}
                isAnalyzing={false}
                onDismiss={vi.fn()}
                onTriggerCoach={vi.fn()}
                theme="snowie_classic"
            />,
        );
        expect(html).toContain('data-testid="snowie-vintage-banner"');
        expect(html).toContain('ÉDITION PRESTIGE');
    });
});
