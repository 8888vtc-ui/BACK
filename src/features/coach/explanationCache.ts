/**
 * Cache d'explications du Coach IA (hash position + coup).
 *
 * Permet d'éviter les appels API redondants lors des retours en arrière,
 * ré-analyses de positions identiques, ou consultations multiples d'un même coup.
 */

export interface CachedExplanation {
    summary?: string;
    explanation?: string;
    keyConcept?: string;
    advice?: string;
    rawText: string;
    source: 'llm' | 'rule-based' | 'cache';
    timestamp: number;
}

export interface CacheKeyParams {
    positionKey?: string | null;
    playedMove: string;
    optimalMove?: string | null;
    verdict?: string | null;
    matchLength?: number;
    scoreX?: number;
    scoreO?: number;
}

/**
 * Calcule une clé de cache déterministe pour une position et un coup donné.
 */
export function computeExplanationCacheKey(params: CacheKeyParams): string {
    const pos = (params.positionKey || 'default_pos').trim();
    const played = params.playedMove.trim();
    const opt = (params.optimalMove || '').trim();
    const verdict = (params.verdict || '').trim().toLowerCase();
    const score = `${params.matchLength ?? 0}_${params.scoreX ?? 0}_${params.scoreO ?? 0}`;

    return `coach::pos[${pos}]::mv[${played}]::opt[${opt}]::v[${verdict}]::score[${score}]`;
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
            const entries = JSON.parse(raw);
            if (Array.isArray(entries)) {
                for (const [key, value] of entries) {
                    if (key && value && typeof value === 'object') {
                        this.memoryMap.set(key, value);
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
        if (this.memoryMap.size >= this.maxEntries) {
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

// Instance singleton partagée
export const globalExplanationCache = new ExplanationCache();
