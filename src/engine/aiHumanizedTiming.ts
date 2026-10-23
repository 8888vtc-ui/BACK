/**
 * Cadencement Humanisé & Non-Bloquant de l'Adversaire IA (Audit 19 / 20).
 *
 * Exigences :
 *   1. Réflexion modulée selon la complexité :
 *      - 150ms pour un coup forcé (≤ 1 séquence légale ou danse).
 *      - 600ms à 1100ms pour une décision complexe (interpolé selon le nombre de séquences légales).
 *   2. Espacement séquentiel de 180ms (`AI_SUB_MOVE_SPACING_MS = 180`) entre chaque sous-coup
 *      pour permettre à l'œil humain de suivre le déplacement pion par pion.
 *   3. Exécution non-bloquante pour l'UI (cession de trame au thread principal avant calcul).
 *
 * Strictement 0 `any`, module pur < 300 lignes.
 */

export const AI_FORCED_MOVE_THINK_MS = 150;
export const AI_COMPLEX_THINK_MIN_MS = 600;
export const AI_COMPLEX_THINK_MAX_MS = 1100;
export const AI_SUB_MOVE_SPACING_MS = 180;

/** Seuil de séquences légales à partir duquel la réflexion atteint le plafond de 1100ms. */
const MAX_COMPLEXITY_SEQUENCES = 25;

export interface HumanizedAiTimingParams {
    /** Nombre total de séquences de coups légales à évaluer. */
    readonly legalSequenceCount: number;
    /** Nombre de sous-coups (dés) dans la séquence retenue (0..4). */
    readonly subMoveCount: number;
    /** Espacement personnalisé entre sous-coups (défaut : 180ms). */
    readonly subMoveSpacingMs?: number;
}

export interface HumanizedAiTimingPlan {
    readonly isForcedOrTrivial: boolean;
    readonly thinkDurationMs: number;
    readonly subMoveSpacingMs: number;
    readonly subMoveOffsetsMs: readonly number[];
    readonly totalSequenceDurationMs: number;
}

/**
 * Calcule le plan temporel humanisé du tour de l'IA :
 * - 150ms si `legalSequenceCount <= 1` (coup forcé ou aucun coup légal).
 * - Entre 600ms et 1100ms si `legalSequenceCount >= 2` (proportionnel à la richesse tactique).
 * - Espacement de 180ms entre chaque sous-coup consécutif.
 */
export function computeHumanizedAiTiming({
    legalSequenceCount,
    subMoveCount,
    subMoveSpacingMs = AI_SUB_MOVE_SPACING_MS,
}: HumanizedAiTimingParams): HumanizedAiTimingPlan {
    const safeSeqCount = Math.max(0, Math.floor(legalSequenceCount));
    const safeSubMoves = Math.max(0, Math.floor(subMoveCount));
    const safeSpacing = Math.max(0, Math.floor(subMoveSpacingMs));

    const isForcedOrTrivial = safeSeqCount <= 1;

    let thinkDurationMs: number;
    if (isForcedOrTrivial) {
        thinkDurationMs = AI_FORCED_MOVE_THINK_MS;
    } else {
        const complexityRatio = Math.min(
            1,
            Math.max(0, (safeSeqCount - 2) / (MAX_COMPLEXITY_SEQUENCES - 2)),
        );
        thinkDurationMs = Math.round(
            AI_COMPLEX_THINK_MIN_MS +
                complexityRatio * (AI_COMPLEX_THINK_MAX_MS - AI_COMPLEX_THINK_MIN_MS),
        );
    }

    const subMoveOffsetsMs: number[] = [];
    for (let i = 0; i < safeSubMoves; i++) {
        subMoveOffsetsMs.push(i * safeSpacing);
    }

    const totalSubMovesDuration =
        safeSubMoves > 1 ? (safeSubMoves - 1) * safeSpacing : 0;

    return {
        isForcedOrTrivial,
        thinkDurationMs,
        subMoveSpacingMs: safeSpacing,
        subMoveOffsetsMs,
        totalSequenceDurationMs: thinkDurationMs + totalSubMovesDuration,
    };
}

/**
 * Cède la main au thread principal du navigateur (`setTimeout(..., 0)`) avant un calcul
 * d'évaluation IA afin de garantir 0 blocage du rendu UI (60 FPS).
 */
export function yieldToMainThread(): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}
