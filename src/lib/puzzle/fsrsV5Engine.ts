/**
 * Planificateur FSRS v5 (19 paramètres DSR : Difficulté, Stabilité, Récupérabilité)
 * & Horloge de Tournoi à Délai Bronstein — Standards AnkiGammon 2026.
 *
 * Implémente intégralement les équations mathématiques exactes de FSRS v5 :
 *   - DECAY = -0.5, FACTOR = 19 / 81
 *   - Initialisation S_0(G) = w_{G-1} et D_0(G) = clamp(w_4 - exp(w_5*(G-1)) + 1, 1, 10)
 *   - Courbe d'oubli R(t, S) = (1 + FACTOR * t / S)^DECAY
 *   - Intervalle optimal I(r, S) = (S / FACTOR) * (r^(1/DECAY) - 1)
 *   - Retour à la moyenne D'' = clamp(w_7 * D_0(4) + (1 - w_7) * D', 1, 10)
 *   - Stabilité après rappel S'_r(D, S, R, G), après oubli S'_f(D, S, R), et intra-journalière S'(S, G).
 *
 * Module 100 % pur, zéro `any`, < 300 lignes.
 */

export type FsrsRating = 1 | 2 | 3 | 4; // 1 = Again, 2 = Hard, 3 = Good, 4 = Easy

export type FsrsWeights19 = readonly [
    number, number, number, number, number,
    number, number, number, number, number,
    number, number, number, number, number,
    number, number, number, number,
];

/** Paramètres par défaut officiels de FSRS v5 (w_0 à w_18). */
export const DEFAULT_FSRS_V5_WEIGHTS: FsrsWeights19 = [
    0.40255, // w_0 : S_0(Again)
    1.18385, // w_1 : S_0(Hard)
    3.17300, // w_2 : S_0(Good)
    15.69105, // w_3 : S_0(Easy)
    7.19490, // w_4 : D_0 base
    0.53450, // w_5 : D_0 exp factor
    1.46040, // w_6 : delta D linear factor
    0.00460, // w_7 : mean reversion weight toward D_0(4)
    1.54575, // w_8 : recall stability exp
    0.11920, // w_9 : recall stability power S^-w_9
    1.01925, // w_10 : recall retrievability exp
    1.93950, // w_11 : forget stability base
    0.11000, // w_12 : forget difficulty power D^-w_12
    0.29605, // w_13 : forget stability power (S+1)^w_13
    2.26980, // w_14 : forget retrievability exp
    0.23150, // w_15 : Hard penalty multiplier (G=2)
    2.98980, // w_16 : Easy bonus multiplier (G=4)
    0.51655, // w_17 : Short-term / same-day stability factor
    0.66210, // w_18 : Short-term rating offset
] as const;

export const FSRS_V5_DECAY = -0.5;
export const FSRS_V5_FACTOR = 19 / 81;
export const DEFAULT_REQUEST_RETENTION = 0.9;

export interface FsrsV5CardState {
    readonly xgidKey: string;
    readonly stability: number;
    readonly difficulty: number;
    readonly retrievability: number;
    readonly intervalDays: number;
    readonly reps: number;
    readonly lapses: number;
    readonly lastReviewIso: string;
    readonly nextReviewIso: string;
}

function clampDifficulty(d: number): number {
    return Math.max(1, Math.min(10, d));
}

/**
 * Stabilité initiale S_0(G) = w_{G-1} pour la première révision d'une carte.
 */
export function computeInitialStability(
    rating: FsrsRating,
    w: FsrsWeights19 = DEFAULT_FSRS_V5_WEIGHTS,
): number {
    return Math.max(0.01, w[rating - 1]);
}

/**
 * Difficulté initiale D_0(G) = clamp(w_4 - e^{w_5(G - 1)} + 1, 1, 10).
 */
export function computeInitialDifficulty(
    rating: FsrsRating,
    w: FsrsWeights19 = DEFAULT_FSRS_V5_WEIGHTS,
): number {
    const raw = w[4] - Math.exp(w[5] * (rating - 1)) + 1;
    return Number(clampDifficulty(raw).toFixed(4));
}

/**
 * Courbe d'oubli (Récupérabilité R) après `elapsedDays` jours :
 * R(t, S) = (1 + FACTOR * t / S)^DECAY
 */
export function computeRetrievability(elapsedDays: number, stability: number): number {
    const s = Math.max(0.01, stability);
    const t = Math.max(0, elapsedDays);
    const r = Math.pow(1 + (FSRS_V5_FACTOR * t) / s, FSRS_V5_DECAY);
    return Number(Math.max(0, Math.min(1, r)).toFixed(6));
}

/**
 * Intervalle optimal en jours I(r, S) pour une rétention cible `requestRetention` (ex. 0.90) :
 * I(r, S) = (S / FACTOR) * (r^(1 / DECAY) - 1)
 */
export function computeOptimalIntervalDays(
    stability: number,
    requestRetention: number = DEFAULT_REQUEST_RETENTION,
): number {
    const r = Math.max(0.7, Math.min(0.99, requestRetention));
    const s = Math.max(0.01, stability);
    const rawInterval = (s / FSRS_V5_FACTOR) * (Math.pow(r, 1 / FSRS_V5_DECAY) - 1);
    return Math.max(1, Math.round(rawInterval));
}

/**
 * Mise à jour de la Difficulté D'' avec amortissement linéaire et retour à la moyenne vers D_0(4) :
 *   deltaD(G) = -w_6 * (G - 3)
 *   D' = D + deltaD * ((10 - D) / 9)
 *   D'' = clamp(w_7 * D_0(4) + (1 - w_7) * D', 1, 10)
 */
export function computeNextDifficulty(
    currentD: number,
    rating: FsrsRating,
    w: FsrsWeights19 = DEFAULT_FSRS_V5_WEIGHTS,
): number {
    const deltaD = -w[6] * (rating - 3);
    const dPrime = currentD + deltaD * ((10 - currentD) / 9);
    const d0Easy = computeInitialDifficulty(4, w);
    const dDoublePrime = w[7] * d0Easy + (1 - w[7]) * dPrime;
    return Number(clampDifficulty(dDoublePrime).toFixed(4));
}

/**
 * Nouvelle Stabilité après un rappel réussi S'_r(D, S, R, G) pour G in {2, 3, 4}.
 */
export function computeRecallStability(
    d: number,
    s: number,
    r: number,
    rating: 2 | 3 | 4,
    w: FsrsWeights19 = DEFAULT_FSRS_V5_WEIGHTS,
): number {
    const hardPenalty = rating === 2 ? w[15] : 1;
    const easyBonus = rating === 4 ? w[16] : 1;
    const factor =
        Math.exp(w[8]) *
        (11 - d) *
        Math.pow(Math.max(0.01, s), -w[9]) *
        (Math.exp(w[10] * (1 - r)) - 1) *
        hardPenalty *
        easyBonus;
    return Number(Math.max(0.01, s * (factor + 1)).toFixed(4));
}

/**
 * Nouvelle Stabilité après un oubli S'_f(D, S, R) pour G = 1 (Again).
 */
export function computeForgetStability(
    d: number,
    s: number,
    r: number,
    w: FsrsWeights19 = DEFAULT_FSRS_V5_WEIGHTS,
): number {
    const sf =
        w[11] *
        Math.pow(clampDifficulty(d), -w[12]) *
        (Math.pow(Math.max(0.01, s) + 1, w[13]) - 1) *
        Math.exp(w[14] * (1 - r));
    return Number(Math.max(0.01, Math.min(s, sf)).toFixed(4));
}

/**
 * Stabilité court terme (révision intra-journalière, elapsedDays < 1) :
 * S'(S, G) = S * e^{w_17 * (G - 3 + w_18)}
 */
export function computeShortTermStability(
    s: number,
    rating: FsrsRating,
    w: FsrsWeights19 = DEFAULT_FSRS_V5_WEIGHTS,
): number {
    const nextS = s * Math.exp(w[17] * (rating - 3 + w[18]));
    return Number(Math.max(0.01, nextS).toFixed(4));
}

/**
 * Planifie une carte indexée par `xgidKey` selon le modèle complet FSRS v5.
 */
export function scheduleFsrsV5Card(params: {
    readonly xgidKey: string;
    readonly rating: FsrsRating;
    readonly previousState?: Pick<
        FsrsV5CardState,
        'stability' | 'difficulty' | 'reps' | 'lapses' | 'lastReviewIso'
    > | null;
    readonly now?: Date;
    readonly requestRetention?: number;
    readonly weights?: FsrsWeights19;
}): FsrsV5CardState {
    const now = params.now ?? new Date();
    const w = params.weights ?? DEFAULT_FSRS_V5_WEIGHTS;
    const retention = params.requestRetention ?? DEFAULT_REQUEST_RETENTION;
    const prev = params.previousState;

    if (!prev || prev.reps <= 0) {
        const s0 = computeInitialStability(params.rating, w);
        const d0 = computeInitialDifficulty(params.rating, w);
        const intervalDays = computeOptimalIntervalDays(s0, retention);
        const nextDate = new Date(now.getTime() + intervalDays * 86_400_000);
        return {
            xgidKey: params.xgidKey,
            stability: Number(s0.toFixed(4)),
            difficulty: d0,
            retrievability: 1,
            intervalDays,
            reps: 1,
            lapses: params.rating === 1 ? 1 : 0,
            lastReviewIso: now.toISOString(),
            nextReviewIso: nextDate.toISOString(),
        };
    }

    const lastMs = Date.parse(prev.lastReviewIso);
    const elapsedDays = Number.isNaN(lastMs)
        ? 1
        : Math.max(0, (now.getTime() - lastMs) / 86_400_000);
    const r = computeRetrievability(elapsedDays, prev.stability);
    const nextD = computeNextDifficulty(prev.difficulty, params.rating, w);

    let nextS: number;
    if (elapsedDays < 1) {
        nextS = computeShortTermStability(prev.stability, params.rating, w);
    } else if (params.rating === 1) {
        nextS = computeForgetStability(prev.difficulty, prev.stability, r, w);
    } else {
        nextS = computeRecallStability(prev.difficulty, prev.stability, r, params.rating, w);
    }

    const intervalDays = computeOptimalIntervalDays(nextS, retention);
    const nextDate = new Date(now.getTime() + intervalDays * 86_400_000);

    return {
        xgidKey: params.xgidKey,
        stability: nextS,
        difficulty: nextD,
        retrievability: r,
        intervalDays,
        reps: prev.reps + 1,
        lapses: prev.lapses + (params.rating === 1 ? 1 : 0),
        lastReviewIso: now.toISOString(),
        nextReviewIso: nextDate.toISOString(),
    };
}

/**
 * Calcule le décompte d'horloge de tournoi avec Délai Simple (Bronstein Delay) :
 * Le délai par tour (ex. 12s) s'écoule avant d'entamer la réserve principale, sans jamais l'augmenter.
 */
export function applyBronsteinClockTurn(params: {
    readonly reserveMs: number;
    readonly delayPerTurnMs: number;
    readonly turnElapsedMs: number;
}): { readonly remainingReserveMs: number; readonly delayConsumedMs: number; readonly isFlagged: boolean } {
    const reserve = Math.max(0, params.reserveMs);
    const delay = Math.max(0, params.delayPerTurnMs);
    const elapsed = Math.max(0, params.turnElapsedMs);
    const delayConsumedMs = Math.min(delay, elapsed);
    const reserveDrain = Math.max(0, elapsed - delay);
    const remainingReserveMs = Math.max(0, reserve - reserveDrain);
    return {
        remainingReserveMs,
        delayConsumedMs,
        isFlagged: reserveDrain > reserve,
    };
}

