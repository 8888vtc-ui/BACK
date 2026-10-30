/**
 * Cache d'explications du Coach IA (clé canonique XGID complète : plateau + dés + videau + Crawford + score + coup).
 *
 * Permet d'éviter les appels API redondants tout en garantissant zéro collision
 * entre deux positions ressemblantes ayant un contexte de videau, de dés ou de Crawford différent.
 */

export interface CachedExplanation {
    summary?: string;
    explanation?: string;
    keyConcept?: string;
    advice?: string;
    whyFailed?: string;
    whyOptimal?: string;
    conceptId?: string;
    rawText: string;
    source: 'llm' | 'rule-based' | 'cache';
    timestamp: number;
}

export interface CacheKeyParams {
    positionKey?: string | null;
    xgid?: string | null;
    board?: ReadonlyArray<number> | null;
    dice?: readonly [number, number] | [number, number] | null;
    cubeValue?: number | null;
    cubeOwner?: 'X' | 'O' | null;
    crawford?: boolean | null;
    playedMove: string;
    optimalMove?: string | null;
    verdict?: string | null;
    matchLength?: number;
    scoreX?: number;
    scoreO?: number;
}

import {
    encodeGnubgPositionId,
    classifyStrategicScoreRegime,
    buildCanonicalGnubgCacheKey,
} from './gnubgCanonicalCache';

export { encodeGnubgPositionId, classifyStrategicScoreRegime, buildCanonicalGnubgCacheKey };

/**
 * Calcule une clé de cache canonique complète (GNUBG Position ID 14 chars / XGID, régime de score, dés, videau, Crawford, coup joué/optimal).
 */
export function computeExplanationCacheKey(params: CacheKeyParams): string {
    const rawPos =
        params.xgid ||
        params.positionKey ||
        (params.board && params.board.length >= 26 ? encodeGnubgPositionId(params.board, 'X') : params.board ? params.board.join(',') : 'default_pos');
    const pos = rawPos.trim();
    const played = params.playedMove.trim();
    const opt = (params.optimalMove || '').trim();
    const verdict = (params.verdict || '').trim().toLowerCase();
    const regime = classifyStrategicScoreRegime({
        board: params.board,
        matchLength: params.matchLength,
        scorePlayer: params.scoreX,
        scoreOpponent: params.scoreO,
        cubeValue: params.cubeValue ?? 1,
        crawford: Boolean(params.crawford),
    });
    const score = `${regime}_${params.matchLength ?? 0}_${params.scoreX ?? 0}_${params.scoreO ?? 0}`;
    const diceStr = params.dice ? `${params.dice[0]}-${params.dice[1]}` : 'no_dice';
    const cubeStr = `${params.cubeValue ?? 1}_${params.cubeOwner ?? 'center'}_${params.crawford ? '1' : '0'}`;

    return `coach::pos[${pos}]::dice[${diceStr}]::cube[${cubeStr}]::mv[${played}]::opt[${opt}]::v[${verdict}]::score[${score}]`;
}

export class ExplanationCache {
    private memoryMap = new Map<string, CachedExplanation>();
    private maxEntries: number;
    private storageKey: string;

    constructor(maxEntries = 100, storageKey = 'bg_coach_explanation_cache') {
        this.maxEntries = maxEntries;
        this.storageKey = storageKey;
        this.loadFromStorage();
    }

    private loadFromStorage(): void {
        if (typeof window === 'undefined' || !window.sessionStorage) return;
        try {
            const raw = window.sessionStorage.getItem(this.storageKey);
            if (!raw) return;
            const entries: unknown = JSON.parse(raw);
            if (Array.isArray(entries)) {
                for (const entry of entries) {
                    if (Array.isArray(entry) && typeof entry[0] === 'string' && entry[1] && typeof entry[1] === 'object') {
                        this.memoryMap.set(entry[0], entry[1] as CachedExplanation);
                    }
                }
            }
        } catch {
            // Ignorer les erreurs d'accès au stockage (ex: mode privé strict)
        }
    }

    private persistToStorage(): void {
        if (typeof window === 'undefined' || !window.sessionStorage) return;
        try {
            const entries = Array.from(this.memoryMap.entries()).slice(-this.maxEntries);
            window.sessionStorage.setItem(this.storageKey, JSON.stringify(entries));
        } catch {
            // Ignorer si quota dépassé
        }
    }

    public get(key: string): CachedExplanation | null {
        const item = this.memoryMap.get(key);
        if (!item) return null;

        // Rafraîchir pour stratégie LRU en réinsérant
        this.memoryMap.delete(key);
        this.memoryMap.set(key, item);
        return item;
    }

    public set(key: string, explanation: Omit<CachedExplanation, 'timestamp'>): void {
        if (this.memoryMap.has(key)) {
            this.memoryMap.delete(key);
        } else if (this.memoryMap.size >= this.maxEntries) {
            const oldestKey = this.memoryMap.keys().next().value;
            if (oldestKey) {
                this.memoryMap.delete(oldestKey);
            }
        }

        const entry: CachedExplanation = {
            ...explanation,
            timestamp: Date.now(),
        };

        this.memoryMap.set(key, entry);
        this.persistToStorage();
    }

    public has(key: string): boolean {
        return this.memoryMap.has(key);
    }

    public clear(): void {
        this.memoryMap.clear();
        if (typeof window !== 'undefined' && window.sessionStorage) {
            try {
                window.sessionStorage.removeItem(this.storageKey);
            } catch {
                // Ignore
            }
        }
    }

    public size(): number {
        return this.memoryMap.size;
    }
}

export const globalExplanationCache = new ExplanationCache();
