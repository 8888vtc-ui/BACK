// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
    extractRoomCodeFromUrl,
    cleanUrlRoomParams,
    usePrivateRoomInvite,
} from './usePrivateRoomInvite';

describe('usePrivateRoomInvite', () => {
    const originalLocation = window.location;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        window.history.replaceState({}, '', '/');
    });

    describe('extractRoomCodeFromUrl', () => {
        it('extrait et normalise un code valide depuis ?join=BG-XXXX', () => {
            expect(extractRoomCodeFromUrl('https://example.com/?join=BG-4A92')).toBe('BG-4A92');
            expect(extractRoomCodeFromUrl('https://example.com/?join=bg-7xkz')).toBe('BG-7XKZ');
        });

        it('extrait et normalise un code valide depuis ?room=BG-XXXX', () => {
            expect(extractRoomCodeFromUrl('https://example.com/?room=BG-9999')).toBe('BG-9999');
        });

        it('gère les codes sans le préfixe BG-', () => {
            expect(extractRoomCodeFromUrl('https://example.com/?join=4a92')).toBe('BG-4A92');
        });

        it('renvoie null pour un paramètre manquant ou invalide', () => {
            expect(extractRoomCodeFromUrl('https://example.com/')).toBeNull();
            expect(extractRoomCodeFromUrl('https://example.com/?foo=bar')).toBeNull();
            expect(extractRoomCodeFromUrl('https://example.com/?join=INVALID-LONG-CODE')).toBeNull();
            expect(extractRoomCodeFromUrl('https://example.com/?join=123')).toBeNull();
        });
    });

    describe('cleanUrlRoomParams', () => {
        it('retire les paramètres join et room de l\'URL via replaceState', () => {
            window.history.replaceState({}, '', '/?join=BG-4A92&theme=dark');
            const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

            cleanUrlRoomParams();

            expect(replaceStateSpy).toHaveBeenCalledTimes(1);
            expect(window.location.search).toBe('?theme=dark');
        });

        it('ne fait rien si aucun paramètre join ou room n\'est présent', () => {
            window.history.replaceState({}, '', '/?theme=dark');
            const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

            cleanUrlRoomParams();

            expect(replaceStateSpy).not.toHaveBeenCalled();
        });
    });

    describe('usePrivateRoomInvite hook', () => {
        it('détecte ?join=BG-4A92, appelle onAutoJoinRoom et nettoie l\'URL', () => {
            window.history.replaceState({}, '', '/?join=BG-4A92');
            const onAutoJoinRoom = vi.fn();

            const { result } = renderHook(() =>
                usePrivateRoomInvite({ onAutoJoinRoom }),
            );

            expect(result.current.detectedCode).toBe('BG-4A92');
            expect(result.current.hasHandledInvite).toBe(true);
            expect(onAutoJoinRoom).toHaveBeenCalledWith('BG-4A92');
            expect(window.location.search).toBe('');
        });

        it('ne déclenche rien si l\'URL ne contient pas de paramètre salon', () => {
            window.history.replaceState({}, '', '/');
            const onAutoJoinRoom = vi.fn();

            const { result } = renderHook(() =>
                usePrivateRoomInvite({ onAutoJoinRoom }),
            );

            expect(result.current.detectedCode).toBeNull();
            expect(result.current.hasHandledInvite).toBe(false);
            expect(onAutoJoinRoom).not.toHaveBeenCalled();
        });
    });
});
