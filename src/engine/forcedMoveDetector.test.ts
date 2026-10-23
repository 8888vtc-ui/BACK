// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
    detectForcedMove,
    FORCED_MOVE_AUTO_PLAY_DELAY_MS,
    getSavedForcedMoveAutoPlay,
    saveForcedMoveAutoPlay,
} from './forcedMoveDetector';

describe('forcedMoveDetector — Détection Mathématique des Coups Forcés (Audit 13 / 20)', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('détecte un coup forcé unique sur un lancer simple (ex: seul 24 -> 21 est légal)', () => {
        const result = detectForcedMove({
            leftDieTargets: new Map([[24, [21]]]),
            rightDieTargets: new Map(),
            dice: [3, 1],
        });

        expect(result.isForced).toBe(true);
        expect(result.forcedMove).toEqual({
            from: 24,
            to: 21,
            die: 0,
            dieValue: 3,
        });
        expect(result.highlightOrigin).toBe(24);
        expect(result.highlightDestination).toBe(21);
        expect(FORCED_MOVE_AUTO_PLAY_DELAY_MS).toBe(300);
    });

    it('déduplique mathématiquement les paires (from -> to) lors d’un double (ex: [4, 4] où seul 10 -> 6 est légal)', () => {
        const result = detectForcedMove({
            leftDieTargets: new Map([[10, [6]]]),
            rightDieTargets: new Map([[10, [6]]]),
            dice: [4, 4],
        });

        expect(result.isForced).toBe(true);
        expect(result.uniqueLegalMoves).toHaveLength(1);
        expect(result.forcedMove).toEqual({
            from: 10,
            to: 6,
            die: 0,
            dieValue: 4,
        });
    });

    it('retourne isForced = false lorsque 0 ou ≥ 2 sous-coups distincts sont possibles', () => {
        const noMoves = detectForcedMove({
            leftDieTargets: new Map(),
            rightDieTargets: new Map(),
            dice: [6, 5],
        });
        expect(noMoves.isForced).toBe(false);
        expect(noMoves.forcedMove).toBeNull();

        const twoMoves = detectForcedMove({
            leftDieTargets: new Map([[24, [21]]]),
            rightDieTargets: new Map([[13, [12]]]),
            dice: [3, 1],
        });
        expect(twoMoves.isForced).toBe(false);
        expect(twoMoves.uniqueLegalMoves).toHaveLength(2);
    });

    it('persiste la préférence utilisateur auto-play des coups forcés dans localStorage', () => {
        expect(getSavedForcedMoveAutoPlay(true)).toBe(true);
        saveForcedMoveAutoPlay(false);
        expect(getSavedForcedMoveAutoPlay(true)).toBe(false);
        saveForcedMoveAutoPlay(true);
        expect(getSavedForcedMoveAutoPlay(false)).toBe(true);
    });
});
