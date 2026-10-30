// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import {
    KARMA_CLIP_FPS,
    KARMA_CLIP_HEIGHT,
    KARMA_CLIP_SAFE_ZONES,
    KARMA_CLIP_TOTAL_FRAMES,
    KARMA_CLIP_WIDTH,
    KarmaClipEngine,
    computeKarmaClipFrameState,
    type KarmaClipPayload,
} from './karmaClipGenerator';

describe('karmaClipGenerator — Générateur Client-Side de Clip Karma Swap Dice (9:16, 15s, 450 frames)', () => {
    const samplePayload: KarmaClipPayload = {
        matchSeed: 'KRM-8842',
        botName: 'Goliath',
        botTrashTalk: 'Un doublé 6-6 au meilleur moment, merci pour les points !',
        originalBotRoll: [6, 6],
        swappedPlayerRoll: [2, 1],
        cubeValue: 8,
        winProbBefore: 3.6,
        winProbAfter: 97.8,
        equitySwing: 2.48,
    };

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('respecte la géométrie 9:16 (720×1280, 30 FPS, 450 frames) et le découpage des 3 Actes', () => {
        expect(KARMA_CLIP_WIDTH).toBe(720);
        expect(KARMA_CLIP_HEIGHT).toBe(1280);
        expect(KARMA_CLIP_FPS).toBe(30);
        expect(KARMA_CLIP_TOTAL_FRAMES).toBe(450);
        expect(KARMA_CLIP_SAFE_ZONES.topForbiddenMaxY).toBe(140);
        expect(KARMA_CLIP_SAFE_ZONES.bottomForbiddenMinY).toBe(1020);
        expect(KARMA_CLIP_SAFE_ZONES.rightForbiddenMinX).toBe(600);

        // Acte I — Segment 1 (Frame 0)
        const f0 = computeKarmaClipFrameState(0, samplePayload);
        expect(f0.act).toBe(1);
        expect(f0.segment).toBe(1);
        expect(f0.cameraScale).toBe(1.0);
        expect(f0.activeBotRoll).toEqual([6, 6]);

        // Acte I — Segment 2 (Frame 58 : impact Blot Hit)
        const f58 = computeKarmaClipFrameState(58, samplePayload);
        expect(f58.act).toBe(1);
        expect(f58.segment).toBe(2);
        expect(f58.isBlotHitImpactFrame).toBe(true);

        // Acte I — Segment 3 (Frame 100 : machine à écrire Trash-Talk à 1,4 car./frame depuis frame 82)
        const f100 = computeKarmaClipFrameState(100, samplePayload);
        expect(f100.act).toBe(1);
        expect(f100.segment).toBe(3);
        expect(f100.visibleTrashTalk.length).toBe(Math.floor((100 - 82) * 1.4));

        // Acte II — Segment 1 (Frame 151 : flash négatif, Frame 160 : décalage RVB ±8 px)
        const f151 = computeKarmaClipFrameState(151, samplePayload);
        expect(f151.act).toBe(2);
        expect(f151.isNegativeFlash).toBe(true);
        const f160 = computeKarmaClipFrameState(160, samplePayload);
        expect(f160.rgbShiftPx).toBe(8);

        // Acte II — Segment 2 (Frame 202 : croisement orbital & permutation des dés)
        const f202 = computeKarmaClipFrameState(202, samplePayload);
        expect(f202.act).toBe(2);
        expect(f202.segment).toBe(2);
        expect(f202.isLightningCrossoverFrame).toBe(true);
        expect(f202.activeBotRoll).toEqual([2, 1]);
        expect(f202.activePlayerRoll).toEqual([6, 6]);

        // Acte II — Segment 3 (Frame 270 : panique du Bot)
        const f270 = computeKarmaClipFrameState(270, samplePayload);
        expect(f270.act).toBe(2);
        expect(f270.segment).toBe(3);
        expect(f270.isBotPanicking).toBe(true);

        // Acte III — Segment 1 & 2 (Frame 345 : fin du ticker + tampon BRAQUAGE, Frame 449 : fondu boucle)
        const f345 = computeKarmaClipFrameState(345, samplePayload);
        expect(f345.act).toBe(3);
        expect(f345.displayedWinProbPct).toBe(97.8);
        expect(f345.displayedEquitySwing).toBe(2.48);
        expect(f345.showHeistStamp).toBe(true);

        const f449 = computeKarmaClipFrameState(449, samplePayload);
        expect(f449.showCtaBanner).toBe(true);
        expect(f449.loopFadeAlpha).toBe(1);
    });

    it('partage immédiatement via navigator.share({ files }) si userActivation.isActive est vrai, ou demande un 2e tap s’il a expiré', async () => {
        const engine = new KarmaClipEngine();
        const dummyFile = new File([new Uint8Array([1, 2, 3])], 'karma-swap-KRM-8842.mp4', {
            type: 'video/mp4',
        });
        engine.setPreRenderedFileForTest(dummyFile);

        const shareSpy = vi.fn().mockResolvedValue(undefined);
        const onSecondTapSpy = vi.fn();

        // Cas 1 : userActivation.isActive === true -> appel direct à navigator.share()
        vi.stubGlobal('navigator', {
            canShare: vi.fn().mockReturnValue(true),
            share: shareSpy,
            userActivation: { isActive: true },
        });

        const res1 = await engine.shareClipNatively(samplePayload, onSecondTapSpy);
        expect(res1).toBe('shared');
        expect(shareSpy).toHaveBeenCalledTimes(1);
        expect(onSecondTapSpy).not.toHaveBeenCalled();

        // Cas 2 : userActivation.isActive === false -> déclenche onGestureExpiredRequireSecondTap(readyFile)
        shareSpy.mockClear();
        vi.stubGlobal('navigator', {
            canShare: vi.fn().mockReturnValue(true),
            share: shareSpy,
            userActivation: { isActive: false },
        });

        const res2 = await engine.shareClipNatively(samplePayload, onSecondTapSpy);
        expect(res2).toBe('second_tap_required');
        expect(shareSpy).not.toHaveBeenCalled();
        expect(onSecondTapSpy).toHaveBeenCalledWith(dummyFile);
    });
});
