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
});
