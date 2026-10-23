// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import LearningModulesGrid from './LearningModulesGrid';
import type { AcademyProgressSnapshot } from '../../features/progression/userProgressionService';

describe('LearningModulesGrid', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    const mockSnapshot: AcademyProgressSnapshot = {
        puzzlesSolved: 7,
        puzzlesTotal: 10,
        puzzleStreak: 4,
        openingsMastered: 8,
        openingsTotal: 21,
        blundersToReview: 2,
        blundersMastered: 6,
        blundersTotal: 8,
        blunderMasteryPct: 75,
        gamesPlayed: 15,
        winsCount: 10,
        averagePR: 3.5,
        eloRating: 1720,
        unlockedBadges: [
            { id: 'streak', icon: '🔥', label: 'Série 4j' },
            { id: 'theorist', icon: '📖', label: 'Maître des Ouvertures' },
        ],
    };

    it('affiche la section, les badges débloqués et les 4 cartes gamifiées', () => {
        const onOpenModule = vi.fn();
        render(<LearningModulesGrid snapshot={mockSnapshot} onOpenModule={onOpenModule} />);

        expect(screen.getByTestId('learning-modules-grid')).toBeDefined();
        expect(screen.getByText('Académie & Analyse Grand Maître')).toBeDefined();

        // Trophées et badges
        expect(screen.getByTestId('academy-unlocked-badges')).toBeDefined();
        expect(screen.getByText('🔥 Série 4j')).toBeDefined();
        expect(screen.getByText('📖 Maître des Ouvertures')).toBeDefined();

        // 4 modules
        expect(screen.getByTestId('lobby-module-puzzles')).toBeDefined();
        expect(screen.getByTestId('lobby-module-openings')).toBeDefined();
        expect(screen.getByTestId('lobby-module-drills')).toBeDefined();
        expect(screen.getByTestId('lobby-module-stats')).toBeDefined();

        // Clic sur drills
        fireEvent.click(screen.getByTestId('lobby-module-drills'));
        expect(onOpenModule).toHaveBeenCalledWith('drills');
    });

    it('fonctionne correctement sans badges débloqués', () => {
        const emptySnapshot: AcademyProgressSnapshot = {
            ...mockSnapshot,
            unlockedBadges: [],
        };

        render(<LearningModulesGrid snapshot={emptySnapshot} />);
        expect(screen.queryByTestId('academy-unlocked-badges')).toBeNull();
    });
});
