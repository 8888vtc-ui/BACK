// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TournamentTableClockModal from './TournamentTableClockModal';

afterEach(() => {
    cleanup();
});

describe('TournamentTableClockModal — Pendule WBF Tête-Bêche & Arbitre Photo 1-Tap', () => {
    it('affiche les deux zones joueurs, déclenche Crawford à matchLength-1 et ouvre le Scanner Photo en 1 tap', () => {
        const onClose = vi.fn();
        const onOpenScanner = vi.fn();

        render(
            <TournamentTableClockModal
                isOpen={true}
                onClose={onClose}
                onOpenPhotoScanner={onOpenScanner}
                initialMatchLength={3}
            />,
        );

        expect(screen.getByTestId('tournament-table-clock-modal')).toBeDefined();
        expect(screen.getByTestId('clock-reserve-p1').textContent).toBe('06:00');
        expect(screen.getByTestId('clock-reserve-p2').textContent).toBe('06:00');

        // Tap sur la pendule J1 active le tour de J2
        fireEvent.click(screen.getByTestId('clock-zone-p1'));

        // Ajouter 2 points à J1 dans un match en 3 points -> active automatiquement CRAWFORD (2/3 = 1-away)
        fireEvent.click(screen.getByTestId('clock-score-p1-plus'));
        fireEvent.click(screen.getByTestId('clock-score-p1-plus'));
        expect(screen.getByTestId('clock-cube-cycle-btn').textContent).toBe('CRAWFORD');

        // Clic sur "Scanner le tablier" met la pendule en pause et déclenche l'ouverture du scanner photo
        fireEvent.click(screen.getByTestId('table-clock-scan-board-btn'));
        expect(onOpenScanner).toHaveBeenCalledTimes(1);
    });
});
