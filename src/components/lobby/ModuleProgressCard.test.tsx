// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ModuleProgressCard from './ModuleProgressCard';

describe('ModuleProgressCard', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('affiche l\'icône, le titre, la métrique en direct et la jauge de progression', () => {
        const onSelect = vi.fn();
        render(
            <ModuleProgressCard
                id="puzzles"
                testId="lobby-module-puzzles"
                icon="🧩"
                title="Puzzles quotidiens"
                liveMetricLabel="4/10 résolus · Série 3j 🔥"
                progressPct={40}
                actionBadge="Continuer"
                highlightBadge="🔥 3j"
                onSelect={onSelect}
            />,
        );

        expect(screen.getByTestId('lobby-module-puzzles')).toBeDefined();
        expect(screen.getByText('Puzzles quotidiens')).toBeDefined();
        expect(screen.getByText('4/10 résolus · Série 3j 🔥')).toBeDefined();
        expect(screen.getByText('Continuer')).toBeDefined();
        expect(screen.getByText('🔥 3j')).toBeDefined();
        expect(screen.getByText('40%')).toBeDefined();

        const progressBar = screen.getByTestId('lobby-module-puzzles-progress-bar');
        expect(progressBar.style.width).toBe('40%');

        fireEvent.click(screen.getByTestId('lobby-module-puzzles'));
        expect(onSelect).toHaveBeenCalledWith('puzzles');
    });

    it('borne le pourcentage de progression entre 0% et 100%', () => {
        render(
            <ModuleProgressCard
                id="openings"
                testId="lobby-module-openings"
                icon="📖"
                title="Ouvertures"
                liveMetricLabel="Ouvertures"
                progressPct={120}
                actionBadge="Analyser"
                onSelect={vi.fn()}
            />,
        );

        const progressBar = screen.getByTestId('lobby-module-openings-progress-bar');
        expect(progressBar.style.width).toBe('100%');
        expect(screen.getByText('100%')).toBeDefined();
    });
});
