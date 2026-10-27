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

/**
 * Canonise algébriquement une chaîne XGID pour maximiser les hits de cache :
 * a) Symétrie des dés : ordonne d1 >= d2 (ex. "13" -> "31")
 * b) Invariance linéaire du videau en Money Game (matchLength === 0) : normalise cube >= 2 à 2
 * c) Scores en distance away en Match Play (matchLength > 0) : normalise (scoreX, scoreO, matchLength) en (awayX, awayO)
 */
export function canonicalizeXgidForCache(safeXgid: string): string {
    const raw = safeXgid.startsWith('XGID=') ? safeXgid.slice(5) : safeXgid;
    const parts = raw.split(':');
    if (parts.length !== 10 && parts.length !== 11) {
        return safeXgid;
    }

    if (parts.length === 10) {
        // Format canonique XG (10 champs) :
        // [0] body, [1] cubeExp, [2] cubeOwner, [3] turnDir, [4] dice, [5] scoreX, [6] scoreO, [7] crawford, [8] matchLength, [9] maxCube
        let dice = parts[4];
        if (dice && dice.length === 2 && /^[1-6]{2}$/.test(dice)) {
            const d1 = Number(dice[0]);
            const d2 = Number(dice[1]);
            parts[4] = d1 < d2 ? `${d2}${d1}` : `${d1}${d2}`;
        }

        const matchLength = Number(parts[8]) || 0;
        const cubeExp = Number(parts[1]) || 0;

        if (matchLength === 0) {
            // Money game : si cube >= 2 (cubeExp >= 1), normalise à cube=2 (cubeExp=1)
            if (cubeExp >= 1) {
                parts[1] = '1';
            }
        } else {
            // Match play : normalise scores en away
            const scoreX = Number(parts[5]) || 0;
            const scoreO = Number(parts[6]) || 0;
            const awayX = Math.max(1, matchLength - scoreX);
            const awayO = Math.max(1, matchLength - scoreO);
            parts[5] = String(awayX);
            parts[6] = String(awayO);
            parts[8] = 'away';
        }
        return `XGID=${parts.join(':')}`;
    }

    if (parts.length === 11) {
        // Format frontend (11 champs) :
        // [0] body, [1] matchplay, [2] scoreX, [3] scoreO, [4] dice, [5] playerOnRoll, [6] cube, [7] cubeOwner, [8] crawford, [9] doubled, [10] matchLength
        let dice = parts[4];
        if (dice && dice.length === 2 && /^[1-6]{2}$/.test(dice)) {
            const d1 = Number(dice[0]);
            const d2 = Number(dice[1]);
            parts[4] = d1 < d2 ? `${d2}${d1}` : `${d1}${d2}`;
        }

        const matchLength = Number(parts[10]) || 0;
        const cube = Number(parts[6]) || 1;

        if (matchLength === 0) {
            // Money game : si cube >= 2, normalise à cube = 2
            if (cube >= 2) {
                parts[6] = '2';
            }
        } else {
            // Match play : normalise scores en away
            const scoreX = Number(parts[2]) || 0;
            const scoreO = Number(parts[3]) || 0;
            const awayX = Math.max(1, matchLength - scoreX);
            const awayO = Math.max(1, matchLength - scoreO);
            parts[2] = String(awayX);
            parts[3] = String(awayO);
            parts[10] = 'away';
        }
        return `XGID=${parts.join(':')}`;
    }

    return safeXgid;
}

/** Construit la clé de cache canonisée `${canonicalXgid}|${ply}`. */
export function bgsageCacheKey(safeXgid: string, ply: number): string {
    const canonical = canonicalizeXgidForCache(safeXgid);
    return `${canonical}|${ply}`;
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
