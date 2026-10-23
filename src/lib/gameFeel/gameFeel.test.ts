import { describe, expect, it } from 'vitest';
import {
    BEAR_OFF_END_SCALE_Y,
    FLIGHT_MAX_MS,
    FLIGHT_MIN_MS,
    buildFlightKeyframes,
    computeArcHeight,
    computeFlightDurationMs,
    getFlightTotalMs,
    getLandingOffsetsMs,
    type FlightSpec,
} from './flightPhysics';
import {
    DOUBLES_CADENCE_FACTOR,
    SPEED_PRESETS,
    getBetweenMovesPauseMs,
    getSpeedPreset,
} from './speedPresets';
import {
    IDLE_GESTURE,
    computeSnapRadiusPx,
    gestureReducer,
    getDragThresholdPx,
    type GestureState,
} from './pointerGestureMachine';

const D = 40;

describe('flightPhysics', () => {
    it('applique plancher, formule et plafond', () => {
        expect(computeFlightDurationMs({ x: 0, y: 0 }, { x: D, y: 0 }, D)).toBe(FLIGHT_MIN_MS);
        expect(computeFlightDurationMs({ x: 0, y: 0 }, { x: 6 * D, y: 0 }, D)).toBe(252);
        expect(computeFlightDurationMs({ x: 0, y: 0 }, { x: 40 * D, y: 0 }, D)).toBe(FLIGHT_MAX_MS);
        expect(computeFlightDurationMs({ x: 0, y: 0 }, { x: 6 * D, y: 0 }, D, 0.6)).toBe(151);
    });

    it('borne la hauteur d\'arc à 0,45 diamètre', () => {
        expect(computeArcHeight(100, D)).toBeCloseTo(6);
        expect(computeArcHeight(10_000, D)).toBeCloseTo(0.45 * D);
    });

    const combo: FlightSpec = {
        id: 'f1',
        color: 'white',
        waypoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }],
        segmentDurationsMs: [200, 200],
        touchdownMs: 70,
        delayMs: 0,
        easing: 'linear',
        arcHeight: 10,
        arrivalPoint: 13,
    };

    it('durée totale et instants d\'atterrissage d\'un combiné', () => {
        expect(getFlightTotalMs(combo)).toBe(470);
        expect(getLandingOffsetsMs(combo)).toEqual([200, 470]);
    });

    it('keyframes à offsets croissants dans [0, 1] avec palier intermédiaire', () => {
        const { pathFrames, liftFrames, totalMs } = buildFlightKeyframes(combo);
        expect(totalMs).toBe(470);
        for (const frames of [pathFrames, liftFrames]) {
            const offsets = frames.map((f) => f.offset as number);
            offsets.forEach((o, i) => {
                expect(o).toBeGreaterThanOrEqual(0);
                expect(o).toBeLessThanOrEqual(1);
                if (i > 0) expect(o).toBeGreaterThanOrEqual(offsets[i - 1]);
            });
            expect(offsets[offsets.length - 1]).toBe(1);
        }
        // Le pion reste posé sur la case intermédiaire pendant le palier.
        expect(pathFrames[1].transform).toBe('translate(100px, 0px)');
        expect(pathFrames[2].transform).toBe('translate(100px, 0px)');
        expect(pathFrames[2].offset).toBeCloseTo(270 / 470);
    });

    it('bear-off : écrasement final', () => {
        const { liftFrames } = buildFlightKeyframes({ ...combo, segmentDurationsMs: [200], waypoints: combo.waypoints.slice(0, 2), endScaleY: BEAR_OFF_END_SCALE_Y });
        expect(liftFrames[liftFrames.length - 1].transform).toBe(`translateY(0px) scale(1, ${BEAR_OFF_END_SCALE_Y})`);
    });
});

describe('speedPresets', () => {
    it('Blitz < Tournament < Coach sur chaque palier temporel', () => {
        const keys = ['T0_TURN_HANDOFF_MS', 'T1_DICE_ROLL_ANIMATION_MS', 'T2_DICE_READ_PAUSE_MS', 'T5_BETWEEN_MOVES_PAUSE_MS'] as const;
        for (const k of keys) {
            expect(SPEED_PRESETS.blitz[k]).toBeLessThan(SPEED_PRESETS.tournament[k]);
            expect(SPEED_PRESETS.tournament[k]).toBeLessThan(SPEED_PRESETS.coach[k]);
        }
        expect(SPEED_PRESETS.blitz.T3_ARROW_PREVIEW_MS).toBe(0);
    });

    it('accélère la cadence de 25 % en double', () => {
        const p = SPEED_PRESETS.tournament;
        expect(getBetweenMovesPauseMs(p, false)).toBe(140);
        expect(getBetweenMovesPauseMs(p, true)).toBe(Math.round(140 * DOUBLES_CADENCE_FACTOR));
    });

    it('valeur inconnue → profil Tournament', () => {
        expect(getSpeedPreset(undefined)).toBe(SPEED_PRESETS.tournament);
        expect(getSpeedPreset('warp' as never)).toBe(SPEED_PRESETS.tournament);
    });
});

describe('pointerGestureMachine', () => {
    const down = (kind: 'mouse' | 'touch', button = 0, target: number | null = 13) =>
        ({ type: 'down', pointerId: 1, kind, button, ctrlKey: false, isMac: false, target, x: 0, y: 0, t: 0 }) as const;

    it('seuils de drag par type de pointeur', () => {
        expect(getDragThresholdPx('mouse')).toBe(4);
        expect(getDragThresholdPx('pen')).toBe(6);
        expect(getDragThresholdPx('touch')).toBe(10);
        expect(getDragThresholdPx(undefined)).toBe(4);
    });

    it('rayon magnétique proportionnel, borné à [28, 72]', () => {
        expect(computeSnapRadiusPx(10)).toBe(28);
        expect(computeSnapRadiusPx(60)).toBe(51);
        expect(computeSnapRadiusPx(200)).toBe(72);
    });

    it('clic souris sans mouvement → tap primaire', () => {
        let s: GestureState = gestureReducer(IDLE_GESTURE, down('mouse')).state;
        s = gestureReducer(s, { type: 'move', pointerId: 1, x: 3, y: 0 }).state;
        const r = gestureReducer(s, { type: 'up', pointerId: 1, t: 2000, snappedTarget: null });
        expect(r.intent).toEqual({ type: 'tap', target: 13, secondary: false });
        expect(r.state.tag).toBe('idle');
    });

    it('clic droit → tap secondaire, jamais de drag', () => {
        let s = gestureReducer(IDLE_GESTURE, down('mouse', 2)).state;
        s = gestureReducer(s, { type: 'move', pointerId: 1, x: 50, y: 0 }).state;
        expect(s.tag).toBe('pressed');
        expect(gestureReducer(s, { type: 'up', pointerId: 1, t: 100, snappedTarget: null }).intent).toEqual({ type: 'tap', target: 13, secondary: true });
    });

    it('tactile : 8 px reste un tap, 11 px démarre un drag puis drop', () => {
        let s = gestureReducer(IDLE_GESTURE, down('touch')).state;
        s = gestureReducer(s, { type: 'move', pointerId: 1, x: 8, y: 0 }).state;
        expect(s.tag).toBe('pressed');
        const start = gestureReducer(s, { type: 'move', pointerId: 1, x: 11, y: 0 });
        expect(start.intent).toEqual({ type: 'dragStart', target: 13 });
        const moved = gestureReducer(start.state, { type: 'move', pointerId: 1, x: 40, y: 5 });
        expect(moved.intent).toEqual({ type: 'dragMove', x: 40, y: 5 });
        expect(gestureReducer(moved.state, { type: 'up', pointerId: 1, t: 300, snappedTarget: 9 }).intent).toEqual({ type: 'drop', from: 13, to: 9 });
    });

    it('drag lâché hors cible ou annulé → retour élastique', () => {
        let s = gestureReducer(IDLE_GESTURE, down('mouse')).state;
        s = gestureReducer(s, { type: 'move', pointerId: 1, x: 20, y: 0 }).state;
        expect(gestureReducer(s, { type: 'up', pointerId: 1, t: 300, snappedTarget: null }).intent).toEqual({ type: 'dragCancel', from: 13 });
        expect(gestureReducer(s, { type: 'cancel', pointerId: 1 }).intent).toEqual({ type: 'dragCancel', from: 13 });
    });

    it('appui long tactile → retour haptique puis tap secondaire', () => {
        let r = gestureReducer(gestureReducer(IDLE_GESTURE, down('touch')).state, { type: 'longPressTimer', pointerId: 1 });
        expect(r.intent).toEqual({ type: 'longPressFeedback', target: 13 });
        r = gestureReducer(r.state, { type: 'up', pointerId: 1, t: 900, snappedTarget: null });
        expect(r.intent).toEqual({ type: 'tap', target: 13, secondary: true });
    });

    it('appui long souris : ignoré ; tap tactile trop long : aucun effet', () => {
        const mouse = gestureReducer(gestureReducer(IDLE_GESTURE, down('mouse')).state, { type: 'longPressTimer', pointerId: 1 });
        expect(mouse.state.tag).toBe('pressed');
        const touch = gestureReducer(IDLE_GESTURE, down('touch')).state;
        expect(gestureReducer(touch, { type: 'up', pointerId: 1, t: 500, snappedTarget: null }).intent.type).toBe('none');
    });

    it('ignore un second pointeur et un pointerdown hors cible', () => {
        const s = gestureReducer(IDLE_GESTURE, down('touch')).state;
        expect(gestureReducer(s, { ...down('touch'), pointerId: 2 }).state).toBe(s);
        expect(gestureReducer(IDLE_GESTURE, down('mouse', 0, null)).state).toBe(IDLE_GESTURE);
    });
});
