// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LobbyInteractiveBoardPreview } from './LobbyInteractiveBoardPreview';

describe('LobbyInteractiveBoardPreview', () => {
    afterEach(() => {
        cleanup();
    });

    it('affiche le plateau réglementaire, le cube 64, les dés et le bandeau récapitulatif', () => {
        const onToggle = vi.fn();
        render(
            <LobbyInteractiveBoardPreview
                matchLength={7}
                difficulty="expert"
                coachEnabled={true}
                playerColor="X"
                onTogglePlayerColor={onToggle}
                clockPreset="normal"
            />
        );

        expect(screen.getByTestId('lobby-board-preview')).toBeDefined();
        expect(screen.getByTestId('lobby-preview-recap')).toBeDefined();
        expect(screen.getByTestId('lobby-preview-match-format').textContent).toContain('Match en 7 pts');
        expect(screen.getByTestId('lobby-preview-clock').textContent).toContain('Normal');
        expect(screen.getByTestId('lobby-preview-opponent').textContent).toContain('Marcus');
        expect(screen.getByTestId('lobby-preview-coach').textContent).toContain('Coach IA');

        const toggleBtn = screen.getByTestId('lobby-preview-toggle-color');
        fireEvent.click(toggleBtn);
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('affiche correctement le format Money Game et la couleur O inversée', () => {
        render(
            <LobbyInteractiveBoardPreview
                matchLength={0}
                difficulty="beginner"
                coachEnabled={false}
                playerColor="O"
                onTogglePlayerColor={vi.fn()}
                clockPreset="blitz"
            />
        );

        expect(screen.getByTestId('lobby-preview-match-format').textContent).toContain('Partie Simple (Money)');
        expect(screen.getByTestId('lobby-preview-coach').textContent).toContain('Sans aide');
        expect(screen.getByTestId('lobby-preview-opponent').textContent).toContain('Arthur');
    });
});
