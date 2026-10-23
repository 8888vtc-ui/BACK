// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BoardOffTray } from './BoardOffTray';
import { X_OFF } from '../../engine/backgammonEngine';

describe('BoardOffTray / BearOffTray (Audit 4/20)', () => {
    afterEach(() => {
        cleanup();
    });

    it('affiche les tranches 3D biseautées et le compteur exact count/15', () => {
        const board = new Array<number>(26).fill(0);
        render(
            <BoardOffTray
                offPoint={X_OFF}
                count={6}
                board={board}
                player="X"
                isTarget={true}
                isOpponentToOff={false}
                trayZoneId="tray-zone-x"
                onClick={vi.fn()}
            />,
        );

        expect(screen.getByTestId('tray-counter-x').textContent).toBe('6/15');
        for (let i = 0; i < 6; i++) {
            const slice = screen.getByTestId(`borne-off-slice-0-${i}`);
            expect(slice.getAttribute('data-beveled-slice')).toBe('true');
        }
    });

    it('permet la sortie en 1-tap (clic gauche), clic droit (second dé) et swipe rapide vers le sabot', () => {
        const board = new Array<number>(26).fill(0);
        const onClick = vi.fn();
        const onRightClick = vi.fn();

        render(
            <BoardOffTray
                offPoint={X_OFF}
                count={0}
                board={board}
                player="X"
                isTarget={true}
                isOpponentToOff={false}
                trayZoneId="tray-zone-x"
                onClick={onClick}
                onRightClick={onRightClick}
            />,
        );

        const tray = screen.getByTestId('tray-zone-x');
        expect(screen.getByTestId('tray-counter-x').textContent).toBe('0/15');

        // 1. 1-tap / clic gauche
        fireEvent.click(tray);
        expect(onClick).toHaveBeenCalledWith(X_OFF);

        // 2. Clic droit -> onRightClick
        fireEvent.contextMenu(tray);
        expect(onRightClick).toHaveBeenCalledWith(X_OFF);

        // 3. Swipe horizontal rapide (dx = 45px, dy = 4px)
        onClick.mockClear();
        fireEvent.pointerDown(tray, { clientX: 100, clientY: 120 });
        fireEvent.pointerUp(tray, { clientX: 145, clientY: 124 });
        expect(onClick).toHaveBeenCalledWith(X_OFF);
    });
});
