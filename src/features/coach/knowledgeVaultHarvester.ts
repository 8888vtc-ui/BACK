/**
 * @file src/features/coach/knowledgeVaultHarvester.ts
 * @description Moteur d'auto-approvisionnement (« Self-Feeding Knowledge Vault ») et
 * générateur de Base de Données Neuro-Symbolique valorisable / licenciable.
 *
 * Fonctionnalités :
 * 1. Génère 10 commentaires Grand-Maître distincts (`0..9`) par coup/position canonique
 *    afin qu'un même coup joué plusieurs fois (ou par plusieurs joueurs) reçoive toujours
 *    une formulation naturelle variée à 0 ms et 0 € de coût API.
 * 2. Rotation déterministe / incrémentale des 10 variantes par session joueur.
 * 3. Collecte automatique (Crowd-Harvesting) pour chaque utilisateur vers Supabase
 *    (`coach_explanations`) et le coffre local (`bg_knowledge_vault_v1`).
 */

import {
    generateTenDistinctCommentariesForMove,
    type CoachPromptParams,
    type CoachStructuredResponse,
} from './prompts';
import {
    computeExplanationCacheKey,
    encodeGnubgPositionId,
} from './explanationCache';
import {
    buildDeepSocraticQuestions,
    type DeepSocraticQuestionItem,
} from './deepAnalysisQuota';
import type { BgsageStrategicInsights } from './featureExtractor';
import type { SymbolicAudit } from '../../lib/coach/symbolicAudit';
import { saveCoachExplanationRecord } from '../../lib/supabase/db';

export const KNOWLEDGE_VAULT_STORAGE_KEY = 'bg_knowledge_vault_v1';
export const VARIANT_ROTATION_STORAGE_KEY = 'bg_coach_variant_rotation_v1';
const MAX_LOCAL_VAULT_ENTRIES = 250;

export interface CoachCommentaryVariantItem {
    readonly variantIndex: number;
    readonly summary: string;
    readonly whyFailed: string;
    readonly whyOptimal: string;
    readonly advice: string;
    readonly explanation: string;
}

export interface ResellableCoachDatasetEntry {
    readonly canonicalKey: string;
    readonly xgid?: string;
    readonly gnubgId: string;
    readonly dice: readonly [number, number];
    readonly playedMove: string;
    readonly optimalMove: string;
    readonly verdict: string;
    readonly equityLoss: number;
    readonly conceptId: string;
    readonly keyConcept: string;
    readonly occurrenceCount: number;
    readonly symbolicAudit?: SymbolicAudit;
    readonly openSageTelemetry?: BgsageStrategicInsights;
    readonly tenDistinctCommentaries: ReadonlyArray<CoachCommentaryVariantItem>;
    readonly socraticQA: ReadonlyArray<DeepSocraticQuestionItem>;
    readonly updatedAt: string;
}

const memoryRotationCounters = new Map<string, number>();
const memoryVault = new Map<string, ResellableCoachDatasetEntry>();

/**
 * Retourne le prochain index de variante (0..9) pour une clé de position donnée
 * et l'incrémente pour que deux consultations successives du même coup affichent
 * deux textes différents parmi les 10 variantes Grand-Maître.
 */
export function nextRotatedVariantIndex(canonicalKey: string): number {
    const current = memoryRotationCounters.get(canonicalKey) ?? 0;
    const next = (current + 1) % 10;
    memoryRotationCounters.set(canonicalKey, next);

    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            const raw = window.localStorage.getItem(VARIANT_ROTATION_STORAGE_KEY);
            const mapObj: Record<string, number> = raw ? (JSON.parse(raw) as Record<string, number>) : {};
            const storedIdx = typeof mapObj[canonicalKey] === 'number' ? mapObj[canonicalKey] : current;
            mapObj[canonicalKey] = (storedIdx + 1) % 10;
            window.localStorage.setItem(VARIANT_ROTATION_STORAGE_KEY, JSON.stringify(mapObj));
            return storedIdx % 10;
        } catch {
            // Ignorer en cas de mode privé
        }
    }
    return current % 10;
}

/**
 * Construit une entrée complète de la base de connaissances avec ses 10 commentaires
 * distincts (0..9), son audit symbolique et ses 3 questions socratiques.
 */
export function buildKnowledgeVaultEntry(params: {
    promptParams: CoachPromptParams;
    board?: ReadonlyArray<number> | null;
    xgid?: string | null;
    dice?: readonly [number, number] | [number, number] | null;
    occurrenceCount?: number;
}): {
    entry: ResellableCoachDatasetEntry;
    fullResponses: ReadonlyArray<CoachStructuredResponse>;
    selectedVariant: CoachStructuredResponse;
    selectedVariantIndex: number;
} {
    const { promptParams, board, xgid, dice, occurrenceCount = 1 } = params;
    const effectiveDice: [number, number] = dice ? [dice[0], dice[1]] : [3, 1];
    const gnubgId =
        board && board.length >= 26
            ? encodeGnubgPositionId(board, promptParams.features?.player ?? 'X')
            : 'standard';

    const canonicalKey = computeExplanationCacheKey({
        xgid,
        board,
        dice: effectiveDice,
        playedMove: promptParams.playedMove,
        optimalMove: promptParams.optimalMove,
        verdict: promptParams.verdict,
        matchLength: promptParams.matchContext?.matchLength,
        scoreX: promptParams.matchContext?.scoreX,
        scoreO: promptParams.matchContext?.scoreO,
        cubeValue: promptParams.matchContext?.cubeValue,
        crawford: promptParams.matchContext?.crawford,
    });

    const fullResponses = generateTenDistinctCommentariesForMove(promptParams);
    const selectedVariantIndex = nextRotatedVariantIndex(canonicalKey);
    const selectedVariant = fullResponses[selectedVariantIndex] ?? fullResponses[0];

    const tenDistinctCommentaries: CoachCommentaryVariantItem[] = fullResponses.map((r, idx) => ({
        variantIndex: idx,
        summary: r.summary,
        whyFailed: r.whyFailed ?? '',
        whyOptimal: r.whyOptimal ?? '',
        advice: r.advice,
        explanation: r.explanation,
    }));

    const socraticQA = buildDeepSocraticQuestions({
        playedMove: promptParams.playedMove,
        optimalMove: promptParams.optimalMove,
        equityLoss: promptParams.equityLoss,
        features: promptParams.features,
        symbolicAudit: selectedVariant.symbolic_audit ?? null,
        pedagogicalExplanation: selectedVariant.pedagogical_explanation ?? null,
        whyFailed: selectedVariant.whyFailed,
        whyOptimal: selectedVariant.whyOptimal,
        locale: promptParams.language ?? 'fr',
    });

    const existing = memoryVault.get(canonicalKey);
    const mergedCount = (existing?.occurrenceCount ?? 0) + occurrenceCount;

    const entry: ResellableCoachDatasetEntry = {
        canonicalKey,
        xgid: xgid ?? undefined,
        gnubgId,
        dice: effectiveDice,
        playedMove: promptParams.playedMove,
        optimalMove: promptParams.optimalMove,
        verdict: promptParams.verdict,
        equityLoss: Number(promptParams.equityLoss.toFixed(4)),
        conceptId: selectedVariant.conceptId ?? 'pure-play',
        keyConcept: selectedVariant.keyConcept,
        occurrenceCount: mergedCount,
        symbolicAudit: selectedVariant.symbolic_audit,
        openSageTelemetry: promptParams.features?.bgsage,
        tenDistinctCommentaries,
        socraticQA,
        updatedAt: new Date().toISOString(),
    };

    memoryVault.set(canonicalKey, entry);
    if (memoryVault.size > MAX_LOCAL_VAULT_ENTRIES) {
        const oldestKey = memoryVault.keys().next().value;
        if (oldestKey) memoryVault.delete(oldestKey);
    }

    return {
        entry,
        fullResponses,
        selectedVariant,
        selectedVariantIndex,
    };
}

/**
 * Approvisionne automatiquement la base de données partagée (`coach_explanations`)
 * et le coffre local à chaque coup analysé par un utilisateur (0 blocage UI).
 */
export async function autoHarvestUserMoveToDatabase(params: {
    promptParams: CoachPromptParams;
    board?: ReadonlyArray<number> | null;
    xgid?: string | null;
    dice?: readonly [number, number] | [number, number] | null;
    persistAllTenToSupabase?: boolean;
}): Promise<{
    entry: ResellableCoachDatasetEntry;
    selectedVariant: CoachStructuredResponse;
    selectedVariantIndex: number;
}> {
    const built = buildKnowledgeVaultEntry(params);
    const { entry, selectedVariant, selectedVariantIndex } = built;

    // Sauvegarde asynchrone non-bloquante dans Supabase pour enrichir la base globale
    const absLoss = Math.abs(entry.equityLoss);
    if (absLoss >= 0.015) {
        const variantsToPersist = params.persistAllTenToSupabase
            ? entry.tenDistinctCommentaries.slice(0, 10)
            : [entry.tenDistinctCommentaries[selectedVariantIndex] ?? entry.tenDistinctCommentaries[0]];

        void Promise.allSettled(
            variantsToPersist.map((v) =>
                saveCoachExplanationRecord({
                    position_key: entry.canonicalKey,
                    played_move: entry.playedMove,
                    optimal_move: entry.optimalMove,
                    equity_loss: entry.equityLoss,
                    verdict: entry.verdict,
                    summary: v.summary,
                    explanation: v.explanation,
                    key_concept: entry.keyConcept,
                    advice: v.advice,
                    source: 'rule-based',
                }),
            ),
        );
    }

    return {
        entry,
        selectedVariant,
        selectedVariantIndex,
    };
}

export function getHarvestedMemoryVaultEntries(): ReadonlyArray<ResellableCoachDatasetEntry> {
    return Array.from(memoryVault.values());
}

