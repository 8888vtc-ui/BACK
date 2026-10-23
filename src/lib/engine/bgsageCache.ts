/**
 * Cache mémoire LRU des évaluations Open Sage (`bgsage-service`).
 *
 * Évite les appels réseau redondants lorsque le Bot IA et le Coach IA évaluent
 * la même position (même XGID sécurisé + même profondeur). Seules les réponses
 * valides sont mises en cache ; les échecs réseau (`null`) ne le sont jamais.
 *
 * Les entrées sont stockées et restituées sous forme de copies profondes afin
 * qu'aucun consommateur ne puisse muter l'évaluation partagée.
 */

import type { BgsageEvaluateResponse } from './bgsageClient';

/** Nombre maximal d'évaluations conservées en mémoire. */
export const BGSAGE_CACHE_MAX_ENTRIES = 200;

const cache = new Map<string, BgsageEvaluateResponse>();

/** Copie profonde d'une réponse (données JSON pures issues du réseau). */
function cloneResponse(resp: BgsageEvaluateResponse): BgsageEvaluateResponse {
    return JSON.parse(JSON.stringify(resp)) as BgsageEvaluateResponse;
}

/** Construit la clé de cache `${safeXgid}|${ply}`. */
export function bgsageCacheKey(safeXgid: string, ply: number): string {
    return `${safeXgid}|${ply}`;
}

/**
 * Lit une évaluation en cache. En cas de succès, l'entrée est promue en
 * position « la plus récente » (politique LRU) et une copie est renvoyée.
 */
export function getCachedBgsageEvaluation(key: string): BgsageEvaluateResponse | null {
    const hit = cache.get(key);
    if (!hit) return null;
    cache.delete(key);
    cache.set(key, hit);
    return cloneResponse(hit);
}

/**
 * Enregistre une évaluation. Si la capacité est dépassée, l'entrée la moins
 * récemment utilisée (première dans l'ordre d'insertion de la `Map`) est évincée.
 */
export function setCachedBgsageEvaluation(key: string, resp: BgsageEvaluateResponse): void {
    if (cache.has(key)) cache.delete(key);
    cache.set(key, cloneResponse(resp));
    while (cache.size > BGSAGE_CACHE_MAX_ENTRIES) {
        const oldest = cache.keys().next();
        if (oldest.done) break;
        cache.delete(oldest.value);
    }
}

/** Vide intégralement le cache (tests, changement d'URL backend, etc.). */
export function clearBgsageEvaluationCache(): void {
    cache.clear();
}

/** Nombre d'entrées actuellement en cache. */
export function bgsageEvaluationCacheSize(): number {
    return cache.size;
}
