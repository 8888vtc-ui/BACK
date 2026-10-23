/**
 * Persistance des explications du Coach (cache L1 mémoire, cache L2 IndexedDB + Supabase partagé, banque de blunders).
 *
 * Rôle :
 *   - Résout le cache L2 (IndexedDB local + table globale partagée `coach_explanations` sur Supabase)
 *     et hydrate automatiquement le cache L1 (`globalExplanationCache`).
 *   - Enregistre un blunder dans la banque locale (`blunderBank`), dans IndexedDB (`recurrent_mistakes`
 *     pour le fallback invité) et dans l'agrégat Supabase (`upsertRecurringError`).
 *   - Persiste l'explication (cache L1 + IndexedDB + synchronisation Supabase `coach_explanations`).
 *
 * Module sans état React : réutilisable par tout composant du Coach.
 */

import { globalExplanationCache } from '../../features/coach';
import {
    persistCoachExplanation,
    persistRecurrentMistake,
    getLocalCoachExplanationByKey,
} from '../../lib/offline/persistenceService';
import { recordBlunder } from '../../features/drills/blunderBank';
import { STRATEGIC_CONCEPTS_CATALOG, categorizeExplanation } from '../../lib/stats/statsAggregator';
import { upsertRecurringError, getSharedCoachExplanation } from '../../lib/supabase/db';
import { getCurrentUser } from '../../lib/supabase/auth';
import type { CoachDisplayVerdict, ParsedExplanation } from './coachPanelHelpers';

function generateExplanationUuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Interroge le cache de niveau 2 (IndexedDB local puis table globale partagée `coach_explanations` Supabase).
 * En cas de succès, hydrate le cache L1 (`globalExplanationCache`) pour un accès 0 ms ultérieur.
 */
export async function resolveL2CachedExplanation(
    cacheKey: string,
    isOffline: boolean,
): Promise<ParsedExplanation | null> {
    if (!cacheKey) return null;

    // 1. Vérification IndexedDB locale
    try {
        const localHit = await getLocalCoachExplanationByKey(cacheKey);
        if (localHit && localHit.explanation) {
            const parsed: ParsedExplanation = {
                summary: localHit.summary || undefined,
                explanation: localHit.explanation,
                keyConcept: localHit.key_concept || undefined,
                advice: localHit.advice || undefined,
                rawText: localHit.explanation,
            };
            globalExplanationCache.set(cacheKey, { ...parsed, source: 'cache' });
            return parsed;
        }
    } catch {
        // Ignorer erreur IDB
    }

    // 2. Vérification Cache Global Partagé L2 Supabase (`coach_explanations`)
    if (isOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        return null;
    }

    try {
        const sharedHit = await getSharedCoachExplanation(cacheKey);
        if (sharedHit && sharedHit.explanation) {
            const parsed: ParsedExplanation = {
                summary: sharedHit.summary || undefined,
                explanation: sharedHit.explanation,
                keyConcept: sharedHit.key_concept || undefined,
                advice: sharedHit.advice || undefined,
                rawText: sharedHit.explanation,
            };
            globalExplanationCache.set(cacheKey, { ...parsed, source: 'cache' });
            return parsed;
        }
    } catch {
        // Ignorer erreur réseau L2
    }

    return null;
}

export interface BlunderRecordParams {
    isBlunder: boolean;
    equityLoss: number | null;
    playedMove: string | null;
    optimalMove: string | null;
    parsed: ParsedExplanation;
    positionKey?: string | null;
    board?: number[];
    dice?: [number, number] | null;
    gameId?: string | null;
}

/** Enregistre un blunder dans la banque locale, IndexedDB invité et l'agrégat Supabase. */
export function recordBlunderToBankIfApplicable(params: BlunderRecordParams): void {
    const { isBlunder, equityLoss, playedMove, optimalMove, parsed, positionKey, board, dice, gameId } = params;
    const loss = Math.abs(equityLoss ?? (isBlunder ? 0.08 : 0.02));
    if (!isBlunder && loss < 0.08) return;

    const conceptId =
        parsed.conceptId ||
        categorizeExplanation(
            parsed.keyConcept,
            `${parsed.summary || ''} ${parsed.explanation || ''}`,
        );
    const conceptDef = STRATEGIC_CONCEPTS_CATALOG.find((c) => c.id === conceptId);
    const roundedLoss = Number(loss.toFixed(3));

    // 1. Persistance locale systématique dans IndexedDB (`recurrent_mistakes`) pour invités et mode hors-ligne
    void persistRecurrentMistake({
        id: `mistake_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        game_id: gameId || undefined,
        category: conceptId,
        position_xgid: positionKey || (board ? board.join(',') : 'unknown_pos'),
        played_move: playedMove || 'Coup joué',
        optimal_move: optimalMove || 'Coup optimal',
        equity_loss: roundedLoss,
        created_at: new Date().toISOString(),
    }).catch(() => { });

    // 2. Enregistrement asynchrone dans l'agrégat Supabase (`recurring_errors`) si connecté
    void (async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return;
            await upsertRecurringError(
                user.id,
                conceptId,
                conceptDef?.name || parsed.keyConcept || conceptId,
                roundedLoss,
            );
        } catch (e) {
            console.warn('[CoachPanel] Échec enregistrement erreur récurrente :', e);
        }
    })();

    // 3. Enregistrement dans la banque locale de drills (`blunderBank`) si le plateau complet (28 entrées) est fourni
    let boardArr = board;
    if (!boardArr && positionKey) {
        const parts = positionKey.split(',').map(Number);
        if (parts.length === 28 && parts.every((n) => !Number.isNaN(n))) {
            boardArr = parts;
        }
    }

    if (!boardArr || boardArr.length !== 28) return;

    try {
        recordBlunder({
            board: boardArr,
            dice: dice || [3, 1],
            player: 'X',
            playedMove: playedMove || 'Coup joué',
            optimalMove: optimalMove || 'Coup optimal',
            equityLoss: roundedLoss,
            verdict: 'blunder',
            conceptId,
            conceptName: conceptDef?.name || parsed.keyConcept || 'Sécurité & Tactique',
            explanation: parsed.explanation || parsed.summary || 'Erreur tactique détectée par le coach.',
            hint: parsed.advice || conceptDef?.recommendation || undefined,
            gameId: gameId || undefined,
        });
    } catch (e) {
        console.warn('[CoachPanel] Échec enregistrement automatique blunder bank :', e);
    }
}

export interface PersistExplanationParams {
    cacheKey: string;
    parsed: ParsedExplanation;
    source: 'llm' | 'rule-based';
    gameId?: string | null;
    playedMove: string | null;
    optimalMove: string | null;
    verdict: CoachDisplayVerdict | null;
    equityLoss: number | null;
    positionKey?: string | null;
    board?: number[];
    dice?: [number, number] | null;
}

/** Persiste une explication (cache L1 + IndexedDB + Supabase L2) et alimente la banque de blunders. */
export function persistExplanation(params: PersistExplanationParams): void {
    const {
        cacheKey,
        parsed,
        source,
        gameId,
        playedMove,
        optimalMove,
        verdict,
        equityLoss,
        positionKey,
        board,
        dice,
    } = params;

    if (!cacheKey) return;

    globalExplanationCache.set(cacheKey, { ...parsed, source });

    persistCoachExplanation({
        id: generateExplanationUuid(),
        game_id: gameId,
        position_key: cacheKey,
        played_move: playedMove || '',
        optimal_move: optimalMove || '',
        verdict: verdict === 'blunder' ? 'blunder' : 'douteux',
        equity_loss: equityLoss ?? -0.05,
        summary: parsed.summary || '',
        explanation: parsed.explanation || '',
        key_concept: parsed.keyConcept || null,
        advice: parsed.advice || null,
        source,
        created_at: new Date().toISOString(),
    }).catch(() => { });

    recordBlunderToBankIfApplicable({
        isBlunder: verdict === 'blunder',
        equityLoss,
        playedMove,
        optimalMove,
        parsed,
        positionKey,
        board,
        dice,
        gameId,
    });
}
