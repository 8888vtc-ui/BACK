// @vitest-environment jsdom
import React from 'react';
import { render, renderHook, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    AUTO_CONFIRM_FORCED_DELAY_MS,
    areAllLegalDicePlayed,
    useTurnConfirmation,
} from './useTurnConfirmation';
import { BoardCenterControls } from '../components/board/BoardCenterControls';

describe('useTurnConfirmation & TurnActionBar (Audit 8/20)', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        cleanup();
    });

    it('affiche le bouton Valider/Done uniquement quand tous les dés légaux ont été joués', () => {
        expect(AUTO_CONFIRM_FORCED_DELAY_MS).toBe(400);

        // 1 dé joué sur 2, et il reste des cibles sur le second dé -> false
        const remainingMap = new Map<number, number[]>([[13, [8]]]);
        expect(areAllLegalDicePlayed([true, false], new Map(), remainingMap, 'HUMAN_MOVING')).toBe(false);

        // Les 2 dés sont joués -> true
        expect(areAllLegalDicePlayed([true, true], new Map(), new Map(), 'HUMAN_MOVING')).toBe(true);

        // 1 seul dé joué mais aucune cible restante sur le second dé (blocage partiel) -> true
        expect(areAllLegalDicePlayed([true, false], new Map(), new Map(), 'HUMAN_MOVING')).toBe(true);

        // Vérification dans BoardCenterControls : masqué en HUMAN_MOVING, proéminent en HUMAN_READY_TO_COMMIT
        const { queryByTestId, rerender } = render(
            React.createElement(BoardCenterControls, {
                gamePhase: 'HUMAN_MOVING',
                onRoll: vi.fn(),
                onConfirm: vi.fn(),
                onUndo: vi.fn(),
                canUndo: true,
                canConfirm: false,
                hasDice: true,
            }),
        );
        expect(queryByTestId('center-undo-button')).not.toBeNull();
        expect(queryByTestId('center-confirm-button')).toBeNull();

        rerender(
            React.createElement(BoardCenterControls, {
                gamePhase: 'HUMAN_READY_TO_COMMIT',
                onRoll: vi.fn(),
                onConfirm: vi.fn(),
                onUndo: vi.fn(),
                canUndo: true,
                canConfirm: true,
                hasDice: true,
            }),
        );
        expect(queryByTestId('center-confirm-button')).not.toBeNull();
    });

    it('valide automatiquement après 400ms si Auto-fin de tour ou coup forcé unique, avec feedback visuel/haptique', () => {
        vi.useFakeTimers();
        try {
            const onConfirm = vi.fn();
            const onTurnFeedback = vi.fn();

            const { result } = renderHook(() =>
                useTurnConfirmation({
                    usedDice: [true, true],
                    gamePhase: 'HUMAN_READY_TO_COMMIT',
                    canConfirm: true,
                    isForcedSingleChoice: true,
                    onConfirm,
                    onTurnFeedback,
                }),
            );

            expect(result.current.isDoneButtonVisible).toBe(true);

            // À 399ms (< 400ms), pas encore auto-validé
            act(() => {
                vi.advanceTimersByTime(399);
            });
            expect(onConfirm).not.toHaveBeenCalled();

            // À 400ms exactement, auto-validation + feedback visuel/haptique
            act(() => {
                vi.advanceTimersByTime(1);
            });
            expect(onConfirm).toHaveBeenCalledTimes(1);
            expect(onTurnFeedback).toHaveBeenCalledTimes(1);
            expect(result.current.turnTransitionPulse).toBe(true);
        } finally {
            vi.useRealTimers();
        }
    });

    it('permet de basculer et persister l’option Auto-fin de tour et masque le bouton Valider quand autoConfirmEnabled=true', () => {
        const onToggle = vi.fn();
        const { getByTestId, queryByTestId } = render(
            React.createElement(BoardCenterControls, {
                gamePhase: 'HUMAN_READY_TO_COMMIT',
                onRoll: vi.fn(),
                onConfirm: vi.fn(),
                onUndo: vi.fn(),
                canUndo: true,
                canConfirm: true,
                hasDice: true,
                autoConfirmEnabled: true,
                onToggleAutoConfirm: onToggle,
            }),
        );

        // En mode Validation auto (autoConfirmEnabled=true), le bouton Valider est masqué
        expect(queryByTestId('center-confirm-button')).toBeNull();

        const autoBtn = getByTestId('toggle-auto-confirm-btn');
        expect(autoBtn.getAttribute('aria-pressed')).toBe('true');
        fireEvent.click(autoBtn);
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('confirme le tour avec la barre Espace ou Entrée uniquement en mode manuel (autoConfirmEnabled=false)', () => {
        const onConfirm = vi.fn();
        render(
            React.createElement(BoardCenterControls, {
                gamePhase: 'HUMAN_READY_TO_COMMIT',
                onRoll: vi.fn(),
                onConfirm,
                onUndo: vi.fn(),
                canUndo: true,
                canConfirm: true,
                hasDice: true,
                autoConfirmEnabled: false,
            }),
        );

        fireEvent.keyDown(window, { code: 'Space', key: ' ' });
        expect(onConfirm).toHaveBeenCalledTimes(1);

        fireEvent.keyDown(window, { code: 'Enter', key: 'Enter' });
        expect(onConfirm).toHaveBeenCalledTimes(2);
    });
});
