// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InGameMenuModal, saveAtomicMatchSnapshot, EMERGENCY_MATCH_SNAPSHOT_KEY } from './InGameMenuModal';
import { createInitialState } from '../../engine/backgammonEngine';

const mockBoardState = createInitialState();

describe('InGameMenuModal (Audit 5/5)', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        cleanup();
    });

    it('sauvegarde un snapshot atomique du match avant de quitter vers le Lobby', () => {
        const onLeaveToLobby = vi.fn();
        const onClose = vi.fn();

        render(
            <InGameMenuModal
                isOpen={true}
                onClose={onClose}
                boardState={mockBoardState}
                cubeValue={4}
                theme="tournament"
                onSelectTheme={vi.fn()}
                isSoundMuted={false}
                onToggleSound={vi.fn()}
                onLeaveToLobby={onLeaveToLobby}
                onResignGame={vi.fn()}
            />
        );

        fireEvent.click(screen.getByTestId('confirm-leave-match-btn'));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onLeaveToLobby).toHaveBeenCalledTimes(1);
        const saved = localStorage.getItem(EMERGENCY_MATCH_SNAPSHOT_KEY);
        expect(saved).not.toBeNull();
    });

    it('exige une confirmation en 2 étapes avec calcul exact des points (cubeValue × multiplicateur) avant abandon', () => {
        const onResignGame = vi.fn();

        render(
            <InGameMenuModal
                isOpen={true}
                onClose={vi.fn()}
                boardState={mockBoardState}
                cubeValue={4}
                theme="tournament"
                onSelectTheme={vi.fn()}
                isSoundMuted={false}
                onToggleSound={vi.fn()}
                onLeaveToLobby={vi.fn()}
                onResignGame={onResignGame}
            />
        );

        // Étape 1 : cliquer sur Gammon (×2) avec cube = 4 -> 8 pts
        const gammonBtn = screen.getByTestId('ingame-resign-2x-btn');
        expect(gammonBtn.textContent).toContain('8 pts');
        fireEvent.click(gammonBtn);

        expect(screen.getByTestId('resign-confirmation-banner')).toBeDefined();
        const confirmBtn = screen.getByTestId('confirm-resign-btn');
        expect(confirmBtn.textContent).toContain('-8');

        // Étape 2 : confirmer l'abandon
        fireEvent.click(confirmBtn);
        expect(onResignGame).toHaveBeenCalledWith(2);
    });

    it('permet de changer de thème et de couper/activer le son directement dans le menu', () => {
        const onSelectTheme = vi.fn();
        const onToggleSound = vi.fn();

        render(
            <InGameMenuModal
                isOpen={true}
                onClose={vi.fn()}
                boardState={mockBoardState}
                cubeValue={2}
                theme="snowie_classic"
                onSelectTheme={onSelectTheme}
                isSoundMuted={false}
                onToggleSound={onToggleSound}
                onLeaveToLobby={vi.fn()}
            />
        );

        fireEvent.click(screen.getByTestId('ingame-theme-midnight'));
        expect(onSelectTheme).toHaveBeenCalledWith('midnight');

        fireEvent.click(screen.getByTestId('ingame-toggle-sound-btn'));
        expect(onToggleSound).toHaveBeenCalledTimes(1);
    });

    it('ferme la modale et déclenche le Coach IA ou la fenêtre XGID/Export', () => {
        const onClose = vi.fn();
        const onTriggerCoach = vi.fn();
        const onOpenExportImport = vi.fn();

        const { rerender } = render(
            <InGameMenuModal
                isOpen={true}
                onClose={onClose}
                boardState={mockBoardState}
                cubeValue={1}
                theme="tournament"
                onSelectTheme={vi.fn()}
                isSoundMuted={false}
                onToggleSound={vi.fn()}
                onLeaveToLobby={vi.fn()}
                onTriggerCoach={onTriggerCoach}
                onOpenExportImport={onOpenExportImport}
            />
        );

        fireEvent.click(screen.getByTestId('ingame-coach-btn'));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onTriggerCoach).toHaveBeenCalledTimes(1);

        rerender(
            <InGameMenuModal
                isOpen={true}
                onClose={onClose}
                boardState={mockBoardState}
                cubeValue={1}
                theme="tournament"
                onSelectTheme={vi.fn()}
                isSoundMuted={false}
                onToggleSound={vi.fn()}
                onLeaveToLobby={vi.fn()}
                onTriggerCoach={onTriggerCoach}
                onOpenExportImport={onOpenExportImport}
            />
        );

        fireEvent.click(screen.getByTestId('ingame-review-moves-btn'));
        expect(onClose).toHaveBeenCalledTimes(2);
        expect(onOpenExportImport).toHaveBeenCalledTimes(1);
    });

    it('ferme la modale avec la touche Escape et permet dannuler un abandon initié', () => {
        const onClose = vi.fn();

        render(
            <InGameMenuModal
                isOpen={true}
                onClose={onClose}
                boardState={mockBoardState}
                cubeValue={2}
                theme="tournament"
                onSelectTheme={vi.fn()}
                isSoundMuted={false}
                onToggleSound={vi.fn()}
                onLeaveToLobby={vi.fn()}
                onResignGame={vi.fn()}
            />
        );

        // Test Escape key
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);

        // Test Annuler concession
        fireEvent.click(screen.getByTestId('ingame-resign-1x-btn'));
        expect(screen.getByTestId('resign-confirmation-banner')).toBeDefined();
        fireEvent.click(screen.getByTestId('cancel-resign-btn'));
        expect(screen.queryByTestId('resign-confirmation-banner')).toBeNull();
    });

    it('saveAtomicMatchSnapshot gère les cas d’erreur ou d’état manquant', () => {
        const ok = saveAtomicMatchSnapshot(mockBoardState);
        expect(ok).toBe(true);
        expect(localStorage.getItem(EMERGENCY_MATCH_SNAPSHOT_KEY)).not.toBeNull();

        const fail = saveAtomicMatchSnapshot(undefined);
        expect(fail).toBe(false);
    });
});

