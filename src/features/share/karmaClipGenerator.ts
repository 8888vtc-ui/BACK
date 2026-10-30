/**
 * Générateur Client-Side de « Clip Karma Swap Dice » 9:16, 15s, 450 frames à 30 FPS (`karmaClipGenerator.ts`).
 *
 * Rôle :
 *   Implémente l'architecture multimédia hybride à coût serveur nul (Zero-Server-Cost) :
 *   1. Découpage déterministe image par image des 3 Actes (450 frames à 30 FPS en 720×1280)
 *      respectant les Safe Zones TikTok / Instagram Reels / WhatsApp Status.
 *   2. Double pipeline d'encodage :
 *      - Voie Rapide hors-temps-réel via `OffscreenCanvas` + `VideoEncoder` (WebCodecs, timestamps `f * 33333 µs`).
 *      - Voie de Repli via `<canvas>` hors-écran + `MediaRecorder` en Shadow Pre-Recording (`prewarmClipGeneration`).
 *   3. Partage natif Web Share API Level 2 (`navigator.share({ files })`) avec diagnostic de
 *      `navigator.userActivation.isActive` et repli téléchargement local `.mp4`.
 *
 * Strictement 0 `any`, ≤ 400 lignes.
 */

export interface KarmaClipPayload {
    readonly matchSeed: string;
    readonly botName: string;
    readonly botTrashTalk: string;
    readonly originalBotRoll: readonly [number, number];
    readonly swappedPlayerRoll: readonly [number, number];
    readonly cubeValue: number;
    readonly winProbBefore: number;
    readonly winProbAfter: number;
    readonly equitySwing: number;
}

export const KARMA_CLIP_WIDTH = 720;
export const KARMA_CLIP_HEIGHT = 1280;
export const KARMA_CLIP_FPS = 30;
export const KARMA_CLIP_TOTAL_FRAMES = 450;
export const KARMA_CLIP_BITRATE_BPS = 2_500_000;

export const KARMA_CLIP_SAFE_ZONES = Object.freeze({
    topForbiddenMaxY: 140,
    bottomForbiddenMinY: 1020,
    rightForbiddenMinX: 600,
    boardMinY: 260,
    boardMaxY: 920,
    ctaMinY: 760,
    ctaMaxY: 940,
});

export interface KarmaClipFrameState {
    readonly frame: number;
    readonly timeSec: number;
    readonly act: 1 | 2 | 3;
    readonly segment: 1 | 2 | 3;
    readonly cameraScale: number;
    readonly isBlotHitImpactFrame: boolean;
    readonly visibleTrashTalk: string;
    readonly isNegativeFlash: boolean;
    readonly rgbShiftPx: number;
    readonly swapProgress: number;
    readonly isLightningCrossoverFrame: boolean;
    readonly activeBotRoll: readonly [number, number];
    readonly activePlayerRoll: readonly [number, number];
    readonly isBotPanicking: boolean;
    readonly displayedWinProbPct: number;
    readonly displayedEquitySwing: number;
    readonly showHeistStamp: boolean;
    readonly showCtaBanner: boolean;
    readonly loopFadeAlpha: number;
}

function easeOutQuad(x: number): number {
    const u = Math.max(0, Math.min(1, x));
    return 1 - (1 - u) * (1 - u);
}

/** Calcule l'état géométrique et textuel déterministe de la frame `frame` (`0..449`). */
export function computeKarmaClipFrameState(frame: number, payload: KarmaClipPayload): KarmaClipFrameState {
    const f = Math.max(0, Math.min(KARMA_CLIP_TOTAL_FRAMES - 1, Math.floor(frame)));
    const timeSec = Number((f / KARMA_CLIP_FPS).toFixed(4));
    const act: 1 | 2 | 3 = f < 150 ? 1 : f < 300 ? 2 : 3;
    const segment: 1 | 2 | 3 =
        act === 1 ? (f <= 29 ? 1 : f <= 69 ? 2 : 3) : act === 2 ? (f <= 174 ? 1 : f <= 229 ? 2 : 3) : f <= 359 ? 1 : 2;

    const cameraScale = f <= 29 ? Number((1.0 + 0.06 * easeOutQuad(f / 29)).toFixed(4)) : 1.06;
    const visibleChars = f >= 82 ? Math.min(payload.botTrashTalk.length, Math.floor((f - 82) * 1.4)) : 0;
    const swapProgress = f >= 185 && f <= 220 ? Number(((f - 185) / 35).toFixed(4)) : f > 220 ? 1 : 0;
    const isSwapped = f >= 202;
    const tickerProgress = f >= 300 ? Math.min(1, (f - 300) / 35) : 0;
    const displayedWinProbPct =
        f < 300
            ? payload.winProbBefore
            : Number((payload.winProbBefore + (payload.winProbAfter - payload.winProbBefore) * tickerProgress).toFixed(1));
    const displayedEquitySwing = f < 300 ? 0 : Number((payload.equitySwing * tickerProgress).toFixed(3));
    const loopFadeAlpha = f >= 436 ? Number(((f - 436 + 1) / 14).toFixed(4)) : 0;

    return {
        frame: f, timeSec, act, segment, cameraScale,
        isBlotHitImpactFrame: f === 58,
        visibleTrashTalk: payload.botTrashTalk.slice(0, visibleChars),
        isNegativeFlash: f >= 150 && f <= 152,
        rgbShiftPx: f >= 153 && f <= 174 ? 8 : 0,
        swapProgress,
        isLightningCrossoverFrame: f === 202,
        activeBotRoll: isSwapped ? payload.swappedPlayerRoll : payload.originalBotRoll,
        activePlayerRoll: isSwapped ? payload.originalBotRoll : payload.swappedPlayerRoll,
        isBotPanicking: f >= 265 && f < 300,
        displayedWinProbPct,
        displayedEquitySwing,
        showHeistStamp: f >= 345,
        showCtaBanner: f >= 360,
        loopFadeAlpha,
    };
}

interface WebCodecsVideoFrameLike { close(): void; }
interface WebCodecsEncodedChunkLike { readonly byteLength: number; copyTo(destination: BufferSource): void; }
interface WebCodecsVideoEncoderLike {
    readonly encodeQueueSize: number;
    configure(config: { codec: string; width: number; height: number; bitrate: number; framerate: number; hardwareAcceleration?: string }): void;
    encode(frame: WebCodecsVideoFrameLike, options?: { keyFrame?: boolean }): void;
    flush(): Promise<void>;
    close(): void;
}
type Canvas2DContextLike = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

export class KarmaClipEngine {
    private readonly WIDTH = KARMA_CLIP_WIDTH;
    private readonly HEIGHT = KARMA_CLIP_HEIGHT;
    private readonly FPS = KARMA_CLIP_FPS;
    private readonly TOTAL_FRAMES = KARMA_CLIP_TOTAL_FRAMES;

    private preRenderedFile: File | null = null;
    private renderingPromise: Promise<File> | null = null;

    public prewarmClipGeneration(payload: KarmaClipPayload): Promise<File> {
        if (!this.renderingPromise) {
            this.renderingPromise = this.generateClipFile(payload).then((file) => {
                this.preRenderedFile = file;
                return file;
            });
        }
        return this.renderingPromise;
    }

    public setPreRenderedFileForTest(file: File | null): void {
        this.preRenderedFile = file;
    }

    private async generateClipFile(payload: KarmaClipPayload): Promise<File> {
        const supportsWebCodecs =
            typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoFrame' in window && typeof OffscreenCanvas !== 'undefined';
        if (supportsWebCodecs) {
            try { return await this.encodeFastWithWebCodecs(payload); } catch { /* Repli MediaRecorder */ }
        }
        return await this.encodeWithMediaRecorder(payload);
    }

    private async encodeFastWithWebCodecs(payload: KarmaClipPayload): Promise<File> {
        const canvas = new OffscreenCanvas(this.WIDTH, this.HEIGHT);
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Impossible d’initialiser le contexte 2D OffscreenCanvas.');

        const win = window as unknown as {
            VideoEncoder: new (init: { output: (chunk: WebCodecsEncodedChunkLike) => void; error: (err: Error) => void }) => WebCodecsVideoEncoderLike;
            VideoFrame: new (source: OffscreenCanvas, init: { timestamp: number; duration: number }) => WebCodecsVideoFrameLike;
        };

        const encodedChunks: WebCodecsEncodedChunkLike[] = [];
        const encoder = new win.VideoEncoder({
            output: (chunk) => encodedChunks.push(chunk),
            error: (e) => { throw e; },
        });

        encoder.configure({
            codec: 'avc1.42001f', width: this.WIDTH, height: this.HEIGHT,
            bitrate: KARMA_CLIP_BITRATE_BPS, framerate: this.FPS, hardwareAcceleration: 'prefer-hardware',
        });

        const frameDurationMicros = Math.round(1_000_000 / this.FPS);
        for (let frameIndex = 0; frameIndex < this.TOTAL_FRAMES; frameIndex++) {
            if (encoder.encodeQueueSize > 15) {
                await new Promise<void>((resolve) => {
                    const checkQueue = () => (encoder.encodeQueueSize <= 5 ? resolve() : requestAnimationFrame(checkQueue));
                    checkQueue();
                });
            }
            this.renderFrameDeterministic(ctx, frameIndex, payload);
            const videoFrame = new win.VideoFrame(canvas, { timestamp: frameIndex * frameDurationMicros, duration: frameDurationMicros });
            encoder.encode(videoFrame, { keyFrame: frameIndex % 60 === 0 });
            videoFrame.close();
        }

        await encoder.flush();
        encoder.close();

        const mp4Buffer = this.muxChunksToMp4Buffer(encodedChunks);
        return new File([mp4Buffer], `karma-swap-${payload.matchSeed}.mp4`, { type: 'video/mp4', lastModified: Date.now() });
    }

    private async encodeWithMediaRecorder(payload: KarmaClipPayload): Promise<File> {
        if (typeof document === 'undefined' || typeof MediaRecorder === 'undefined') {
            throw new Error('MediaRecorder est indisponible dans cet environnement.');
        }
        const canvas = document.createElement('canvas');
        canvas.width = this.WIDTH;
        canvas.height = this.HEIGHT;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Impossible d’initialiser le contexte 2D du canvas.');

        const stream = canvas.captureStream(this.FPS);
        const mimeType = typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: KARMA_CLIP_BITRATE_BPS });
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };

        return new Promise<File>((resolve, reject) => {
            recorder.onerror = (err) => reject(err);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                resolve(new File([blob], `karma-swap-${payload.matchSeed}.${extension}`, { type: mimeType, lastModified: Date.now() }));
            };
            recorder.start(250);
            let currentFrame = 0;
            const step = () => {
                if (currentFrame >= this.TOTAL_FRAMES) {
                    recorder.stop();
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                this.renderFrameDeterministic(ctx, currentFrame, payload);
                currentFrame++;
                setTimeout(step, 1000 / this.FPS);
            };
            step();
        });
    }

    public renderFrameDeterministic(ctx: Canvas2DContextLike, frame: number, payload: KarmaClipPayload): KarmaClipFrameState {
        const state = computeKarmaClipFrameState(frame, payload);
        ctx.fillStyle = state.isNegativeFlash ? '#F4F1EA' : '#0F141C';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        if (state.act === 1) this.drawActOne(ctx, state, payload);
        else if (state.act === 2) this.drawActTwo(ctx, state);
        else this.drawActThree(ctx, state, payload);
        return state;
    }

    private drawActOne(ctx: Canvas2DContextLike, state: KarmaClipFrameState, payload: KarmaClipPayload): void {
        ctx.fillStyle = '#D93025';
        ctx.fillRect(40, 150, 540, 64);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
            state.segment === 1
                ? 'IL NE LUI FAUT PAS 6-6 (1 CHANCE SUR 36)...'
                : `VIDEAU À ${payload.cubeValue} • LE BOT LANCE ${payload.originalBotRoll[0]}-${payload.originalBotRoll[1]} !`,
            310, 190,
        );
        if (state.frame >= 70) {
            ctx.fillStyle = '#1E2634';
            ctx.fillRect(60, 880, 520, 110);
            ctx.fillStyle = '#FCC934';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${payload.botName} (96.4% WIN) :`, 85, 920);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px sans-serif';
            ctx.fillText(`"${state.visibleTrashTalk}"`, 85, 958);
        }
    }

    private drawActTwo(ctx: Canvas2DContextLike, state: KarmaClipFrameState): void {
        const angle = state.swapProgress * Math.PI;
        const radius = 160;
        const die1X = 360 + Math.cos(angle) * radius;
        const die1Y = 580 + Math.sin(angle) * (radius * 0.6);
        const die2X = 360 - Math.cos(angle) * radius;
        const die2Y = 580 - Math.sin(angle) * (radius * 0.6);

        ctx.fillStyle = '#F538A0';
        ctx.font = 'bold 34px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ KARMA SWAP ACTIVÉ ⚡', 320, 210);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(die1X - 45 + state.rgbShiftPx, die1Y - 45, 90, 90);
        ctx.fillRect(die2X - 45 - state.rgbShiftPx, die2Y - 45, 90, 90);

        if (state.isBotPanicking) {
            const shakeX = Math.sin(state.frame * 1.7) * 4;
            ctx.fillStyle = '#1E2634';
            ctx.fillRect(60 + shakeX, 880, 520, 90);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText("ATTENDS... C'EST ILLÉGAL ÇA ?!", 320 + shakeX, 935);
        }
    }

    private drawActThree(ctx: Canvas2DContextLike, state: KarmaClipFrameState, payload: KarmaClipPayload): void {
        ctx.fillStyle = '#16202E';
        ctx.fillRect(60, 280, 520, 380);
        ctx.fillStyle = '#81C995';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`WIN : ${state.displayedWinProbPct.toFixed(1)}%`, 320, 410);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px monospace';
        ctx.fillText(`SWING ÉQUITÉ : +${state.displayedEquitySwing.toFixed(3)} PTS`, 320, 490);

        if (state.showHeistStamp) {
            ctx.fillStyle = '#FCC934';
            ctx.font = 'bold 26px sans-serif';
            ctx.fillText('BRAQUAGE 35 CONTRE 1', 320, 580);
        }
        if (state.showCtaBanner) {
            ctx.fillStyle = '#1A73E8';
            ctx.fillRect(60, 780, 520, 120);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText(`DÉFIE CE COUP • SEED #${payload.matchSeed}`, 320, 850);
        }
    }

    public async shareClipNatively(
        payload: KarmaClipPayload,
        onGestureExpiredRequireSecondTap: (readyFile: File) => void,
    ): Promise<'shared' | 'second_tap_required' | 'downloaded'> {
        const file = this.preRenderedFile ?? (await this.prewarmClipGeneration(payload));
        const shareData: ShareData = {
            files: [file],
            title: 'Karma Swap Dice — Retournement Monumental !',
            text: `J'ai retourné un coup à ${payload.winProbBefore}% contre ${payload.botName} (+${payload.equitySwing} pts d'équité) ! Rejoue la seed #${payload.matchSeed}`,
        };

        if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
            const navWithActivation = navigator as Navigator & { userActivation?: { readonly isActive: boolean } };
            const isGestureActive = navWithActivation.userActivation ? navWithActivation.userActivation.isActive : true;
            if (!isGestureActive) {
                onGestureExpiredRequireSecondTap(file);
                return 'second_tap_required';
            }
            await navigator.share(shareData);
            return 'shared';
        }

        if (typeof document !== 'undefined' && typeof URL !== 'undefined') {
            const blobUrl = URL.createObjectURL(file);
            const anchor = document.createElement('a');
            anchor.href = blobUrl;
            anchor.download = file.name;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
        }
        return 'downloaded';
    }

    private muxChunksToMp4Buffer(chunks: readonly WebCodecsEncodedChunkLike[]): ArrayBuffer {
        const totalByteLength = chunks.reduce((acc, c) => acc + c.byteLength, 0);
        const buffer = new ArrayBuffer(totalByteLength);
        const view = new Uint8Array(buffer);
        let offset = 0;
        for (const chunk of chunks) {
            chunk.copyTo(view.subarray(offset, offset + chunk.byteLength));
            offset += chunk.byteLength;
        }
        return buffer;
    }
}
