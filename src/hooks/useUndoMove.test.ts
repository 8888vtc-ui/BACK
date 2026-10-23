// @vitest-environment jsdom
import React from 'react';
import { render, renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useUndoMove } from './useUndoMove';
import { Die } from '../components/board/Die';

describe('useUndoMove & Die Reanimation (Audit 7/20)', () => {
    afterEach(() => {
        cleanup();
    });

    it('annule via Ctrl+Z, clic inverse sur le pion déplacé, et verrouille dès que le tour passe à l’adversaire', () => {
        const onUndo = vi.fn();

        const { result, rerender } = renderHook(
            ({ gamePhase, usedDice }: { gamePhase: string; usedDice: boolean[] }) =>
                useUndoMove({
                    canUndo: true,
                    gamePhase,
                    usedDice,
                    moveHistory: [
                        {
                            board: new Array<number>(26).fill(0),
                            usedDice: [false, false],
                            move: { from: 13, to: 8, dieIndex: 0 },
                        },
                    ],
                    onUndo,
                }),
            { initialProps: { gamePhase: 'HUMAN_MOVING', usedDice: [true, false] } },
        );

        expect(result.current.isUndoAvailable).toBe(true);
        expect(result.current.lastMovedToPoint).toBe(8);

        // 1. Raccourci clavier Ctrl+Z
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
        });
        expect(onUndo).toHaveBeenCalledTimes(1);

        // 2. Clic inverse sur le point 8 (destination du dernier pion déplacé)
        act(() => {
            const handled = result.current.handleReverseClick(8);
            expect(handled).toBe(true);
        });
        expect(onUndo).toHaveBeenCalledTimes(2);

        // 3. Réanimation du dé 0 ([true, false] -> [false, false])
        rerender({ gamePhase: 'HUMAN_MOVING', usedDice: [false, false] });
        expect(result.current.reanimatedDieIndex).toBe(0);

        // 4. Verrouillage définitif quand le tour passe à l'adversaire ('AI_TURN_ROLLING')
        rerender({ gamePhase: 'AI_TURN_ROLLING', usedDice: [false, false] });
        expect(result.current.isTurnLocked).toBe(true);
        expect(result.current.isUndoAvailable).toBe(false);

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
        });
        expect(onUndo).toHaveBeenCalledTimes(2); // Aucun appel supplémentaire
    });

    it('réanime le dé consommé dans l’interface sans scintillement (sans relancer .die-roll)', () => {
        const { getByTestId, rerender } = render(
            React.createElement(Die, { value: 5, used: false, animateRoll: true, dataTestId: 'test-die' }),
        );

        // Au lancer initial : la classe d'animation .die-roll est présente
        expect(getByTestId('test-die').className).toContain('die-roll');

        // Le dé est consommé (used = true)
        rerender(React.createElement(Die, { value: 5, used: true, animateRoll: true, dataTestId: 'test-die' }));
        expect(getByTestId('test-die').className).not.toContain('die-roll');

        // Le coup est annulé (used repasse à false) : réanimé SANS relancer .die-roll (0 scintillement)
        rerender(React.createElement(Die, { value: 5, used: false, animateRoll: true, dataTestId: 'test-die' }));
        const reanimatedDie = getByTestId('test-die');
        expect(reanimatedDie.getAttribute('data-reanimated')).toBe('true');
        expect(reanimatedDie.className).not.toContain('die-roll');
        expect(reanimatedDie.className).not.toContain('opacity-40');
    });
});
