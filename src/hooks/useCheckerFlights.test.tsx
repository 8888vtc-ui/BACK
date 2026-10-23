// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, renderHook, act, cleanup } from '@testing-library/react';
import { createInitialState, O_BAR, X_OFF } from '../engine/backgammonEngine';
import {
    BEAR_OFF_DURATION_MS,
    BEAR_OFF_EASING,
    BEAR_OFF_END_SCALE_Y,
    COMBINED_FIRST_HOP_FACTOR,
    CONVERGENCE_STAGGER_MS,
    HIT_ATTACKER_EASING,
    HIT_ATTACKER_SCALE,
    HIT_EJECT_DELAY_RATIO,
    HIT_TO_BAR_DURATION_MS,
    HIT_TO_BAR_EASING,
    INTERMEDIATE_TOUCH_PAUSE_MS,
    NORMAL_APEX_DROP_SHADOW,
    NORMAL_APEX_OFFSET,
    NORMAL_APEX_SCALE,
    NORMAL_FLIGHT_EASING,
    PORT_STAGGER_MS,
    buildFlipElementKeyframes,
    computeContractedFirstHopMs,
    computeFlipInvertVector,
    computeHitAttackerDurationPx,
    computeHitEjectDelayMs,
    computeNormalFlightDurationPx,
} from '../lib/gameFeel/flightPhysics';
import {
    HIDDEN_O_BAR_KEY,
    detectBoardMoveDeltas,
    useCheckerFlights,
} from './useCheckerFlights';
import { FlyingCheckerOverlay } from '../components/board/FlyingCheckerOverlay';

describe('useCheckerFlights & FlyingCheckerOverlay (Brick 1 — FLIP Flight Physics)', () => {
    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('détecte un coup simple et ignore une réinitialisation complète du plateau', () => {
        const prev = createInitialState(7).board;
        const next = [...prev];
        next[24] -= 1;
        next[18] += 1;

        const deltas = detectBoardMoveDeltas(prev, next, [6, 1]);
        expect(deltas).toHaveLength(1);
        expect(deltas[0]).toEqual({
            player: 'X',
            waypoints: [24, 18],
            isBearOff: false,
            delayMs: 0,
            hitOpponentAt: undefined,
        });

        // Plateau complètement différent (> 4 pions modifiés) => ignoré (0 vol parasite)
        const emptyBoard = new Array<number>(26).fill(0);
        expect(detectBoardMoveDeltas(prev, emptyBoard)).toEqual([]);
    });

    it('reconstruit le waypoint intermédiaire d’un coup combiné (d1 + d2)', () => {
        const prev = createInitialState(7).board;
        const next = [...prev];
        // X déplace 1 pion de 24 vers 15 avec les dés [5, 4] via la case 19 (ou 20)
        // En position initiale, 19 est occupé par -5 (O), donc le chemin légal passe par 20 !
        next[24] -= 1;
        next[15] += 1;

        const deltas = detectBoardMoveDeltas(prev, next, [5, 4]);
        expect(deltas).toHaveLength(1);
        expect(deltas[0].waypoints).toEqual([24, 20, 15]);
    });

    it('échelonne un coup de Port (Make a Point : 8/5 6/5) avec PORT_STAGGER_MS = 60ms', () => {
        const prev = createInitialState(7).board;
        const next = [...prev];
        next[8] -= 1;
        next[6] -= 1;
        next[5] += 2;

        const deltas = detectBoardMoveDeltas(prev, next, [3, 1]);
        expect(deltas).toHaveLength(2);
        expect(deltas[0].waypoints).toEqual([8, 5]);
        expect(deltas[0].delayMs).toBe(0);
        expect(deltas[1].waypoints).toEqual([6, 5]);
        expect(deltas[1].delayMs).toBe(PORT_STAGGER_MS);
    });

    it('détecte une frappe de blot adverse et génère le vol d’éjection vers la barre avec délai 82 %', () => {
        vi.useFakeTimers();
        const prev = createInitialState(7).board;
        prev[10] = -1; // Blot adverse O sur la flèche 10
        const next = [...prev];
        next[13] -= 1;
        next[10] = 1; // X frappe sur 10
        next[O_BAR] -= 1; // O est envoyé sur sa barre (25)

        const { result, rerender } = renderHook(
            ({ board }) => useCheckerFlights({ board, dice: [3, 2], gameSpeed: 'tournament' }),
            { initialProps: { board: prev } },
        );

        expect(result.current.flights).toHaveLength(0);

        act(() => {
            rerender({ board: next });
        });

        // 2 vols générés : l'attaquant (13 -> 10) et la victime expulsée (10 -> O_BAR)
        expect(result.current.flights).toHaveLength(2);
        const [attacker, victim] = result.current.flights;
        expect(attacker.color).toBe('white');
        expect(attacker.arrivalPoint).toBe(10);
        expect(victim.color).toBe('black');
        expect(victim.arrivalPoint).toBe(HIDDEN_O_BAR_KEY);
        expect(victim.delayMs).toBeGreaterThan(0);

        // Pendant le vol, 1 pion est masqué sur la flèche 10 et 1 sur la barre O
        expect(result.current.hiddenAt.get(10)).toBe(1);
        expect(result.current.hiddenAt.get(HIDDEN_O_BAR_KEY)).toBe(1);

        // Après achèvement des vols, hiddenAt est intégralement libéré
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(result.current.flights).toHaveLength(0);
        expect(result.current.hiddenAt.size).toBe(0);
    });

    it('gère la sortie (Bear-off) avec écrasement final endScaleY et rend FlyingCheckerOverlay', () => {
        vi.useFakeTimers();
        const prev = new Array<number>(26).fill(0);
        prev[6] = 2;
        prev[1] = -2;
        const next = [...prev];
        next[6] = 1; // 1 pion X est sorti (borneOff passe de 13 à 14)

        const { result, rerender } = renderHook(
            ({ board }) => useCheckerFlights({ board, dice: [6, 2], gameSpeed: 'blitz' }),
            { initialProps: { board: prev } },
        );

        act(() => {
            rerender({ board: next });
        });

        expect(result.current.flights).toHaveLength(1);
        const bearOffFlight = result.current.flights[0];
        expect(bearOffFlight.arrivalPoint).toBe(X_OFF);
        expect(bearOffFlight.endScaleY).toBe(BEAR_OFF_END_SCALE_Y);
        expect(result.current.hiddenAt.get(X_OFF)).toBe(1);

        const { getByTestId } = render(
            <FlyingCheckerOverlay
                flights={result.current.flights}
                onFlightComplete={result.current.completeFlight}
            />,
        );
        expect(getByTestId('flying-checker-overlay')).toBeTruthy();
        expect(getByTestId(`flying-checker-${bearOffFlight.id}`)).toBeTruthy();

        act(() => {
            vi.advanceTimersByTime(500);
        });
        expect(result.current.flights).toHaveLength(0);
    });

    it('calibre exactement les constantes FLIP Chantier 1 (Normal, Hit, Bear-off, Saut combiné, Convergence)', () => {
        // INVERT : Δx, Δy, D_px
        const inv = computeFlipInvertVector({ left: 100, top: 200 }, { left: 400, top: 600 });
        expect(inv.dx).toBe(-300);
        expect(inv.dy).toBe(-400);
        expect(inv.distPx).toBe(500);

        // Coup normal : clamp(125 + 0.22 * distPx, 140, 290) ms
        expect(computeNormalFlightDurationPx(10)).toBe(140);
        expect(computeNormalFlightDurationPx(300)).toBe(191);
        expect(computeNormalFlightDurationPx(1000)).toBe(290);
        expect(NORMAL_FLIGHT_EASING).toBe('cubic-bezier(0.22, 1.0, 0.36, 1.0)');
        expect(NORMAL_APEX_OFFSET).toBe(0.45);
        expect(NORMAL_APEX_SCALE).toBe(1.08);
        expect(NORMAL_APEX_DROP_SHADOW).toBe('drop-shadow(0 12px 18px rgba(0,0,0,0.36))');

        // Frappe d'un Blot ("Hit") : clamp(115 + 0.20 * distPx, 130, 265) ms, delay 75%, barre 260ms
        expect(computeHitAttackerDurationPx(10)).toBe(130);
        expect(computeHitAttackerDurationPx(300)).toBe(175);
        expect(computeHitAttackerDurationPx(1000)).toBe(265);
        expect(HIT_ATTACKER_EASING).toBe('cubic-bezier(0.16, 1.0, 0.30, 1.0)');
        expect(HIT_ATTACKER_SCALE).toBe(1.12);
        expect(HIT_EJECT_DELAY_RATIO).toBe(0.75);
        expect(computeHitEjectDelayMs(200)).toBe(150);
        expect(HIT_TO_BAR_DURATION_MS).toBe(260);
        expect(HIT_TO_BAR_EASING).toBe('cubic-bezier(0.34, 1.45, 0.64, 1.0)');

        // Bear-off : 195 ms, cubic-bezier(0.25, 0.90, 0.35, 1.0)
        expect(BEAR_OFF_DURATION_MS).toBe(195);
        expect(BEAR_OFF_EASING).toBe('cubic-bezier(0.25, 0.90, 0.35, 1.0)');

        // Saut combiné (d1+d2) : 1er saut contracté de 15 % (0.85) + pause 55 ms
        expect(COMBINED_FIRST_HOP_FACTOR).toBe(0.85);
        expect(computeContractedFirstHopMs(200)).toBe(170);
        expect(INTERMEDIATE_TOUCH_PAUSE_MS).toBe(55);

        // Convergence à 2 pions : 45 ms
        expect(CONVERGENCE_STAGGER_MS).toBe(45);

        // Keyframes WAAPI FLIP
        const frames = buildFlipElementKeyframes({ dx: -120, dy: -80, isHit: true });
        expect(frames).toHaveLength(3);
        expect(frames[0].offset).toBe(0);
        expect(frames[1].offset).toBe(0.45);
        expect(frames[1].transform).toContain('scale(1.12)');
        expect(frames[1].filter).toBe(NORMAL_APEX_DROP_SHADOW);
        expect(frames[2].offset).toBe(1);
    });

    it('exécute le cycle FLIP complet (prepareFlipForStep FIRST -> LAST -> INVERT -> PLAY element.animate)', () => {
        vi.useFakeTimers();
        const container = document.createElement('div');
        container.id = 'backgammon-board';
        vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 960,
            height: 640,
            right: 960,
            bottom: 640,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });

        const pt24 = document.createElement('div');
        pt24.setAttribute('data-point', '24');
        vi.spyOn(pt24, 'getBoundingClientRect').mockReturnValue({
            left: 880,
            top: 20,
            width: 48,
            height: 240,
            right: 928,
            bottom: 260,
            x: 880,
            y: 20,
            toJSON: () => ({}),
        });

        const pt15 = document.createElement('div');
        pt15.setAttribute('data-point', '15');
        const animateSpy = vi.fn().mockReturnValue({ cancel: vi.fn() });
        Object.defineProperty(pt15, 'animate', { value: animateSpy, configurable: true });
        vi.spyOn(pt15, 'getBoundingClientRect').mockReturnValue({
            left: 200,
            top: 20,
            width: 48,
            height: 240,
            right: 248,
            bottom: 260,
            x: 200,
            y: 20,
            toJSON: () => ({}),
        });

        container.appendChild(pt24);
        container.appendChild(pt15);
        document.body.appendChild(container);

        const prev = createInitialState(7).board;
        const next = [...prev];
        next[24] -= 1;
        next[15] += 1;

        const containerRef = { current: container };
        const { result, rerender } = renderHook(
            ({ board }) => useCheckerFlights({ board, dice: [5, 4], gameSpeed: 'tournament', containerRef }),
            { initialProps: { board: prev } },
        );

        act(() => {
            result.current.prepareFlipForStep(24);
            rerender({ board: next });
        });

        expect(result.current.flights).toHaveLength(1);
        const comboFlight = result.current.flights[0];
        expect(comboFlight.touchdownMs).toBe(INTERMEDIATE_TOUCH_PAUSE_MS);
        expect(comboFlight.segmentDurationsMs).toHaveLength(2);
        expect(animateSpy).toHaveBeenCalledTimes(1);

        document.body.removeChild(container);
    });
});
