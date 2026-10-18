import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import HudActivitiesBar from './HudActivitiesBar';

describe('HudActivitiesBar Component', () => {
    it('est caché lorsque isExpanded est false', () => {
        const html = renderToStaticMarkup(
            <HudActivitiesBar isExpanded={false} onClose={vi.fn()} />,
        );
        expect(html).toContain('hidden');
    });

    it('affiche les liens vers Drills, Puzzles et Progression lorsque isExpanded est true', () => {
        const html = renderToStaticMarkup(
            <HudActivitiesBar
                isExpanded={true}
                onClose={vi.fn()}
                onOpenMultiplayer={vi.fn()}
                onTriggerCoach={vi.fn()}
                onOpenOpeningBook={vi.fn()}
                onOpenKnowledgeBase={vi.fn()}
            />,
        );
        expect(html).toContain('flex');
        expect(html).toContain('Drills');
        expect(html).toContain('Puzzles');
        expect(html).toContain('Progression');
        expect(html).toContain('Coach');
        expect(html).toContain('Ouvertures');
        expect(html).toContain('Théorie');
        expect(html).toContain('Multijoueur');
    });

    it('affiche l\'indicateur En Direct quand une partie multijoueur est active', () => {
        const html = renderToStaticMarkup(
            <HudActivitiesBar
                isExpanded={true}
                onClose={vi.fn()}
                onOpenMultiplayer={vi.fn()}
                isMultiplayerActive={true}
            />,
        );
        expect(html).toContain('En Direct');
        expect(html).toContain('animate-pulse');
    });
});
