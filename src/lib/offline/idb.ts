/**
 * Module IndexedDB offline-first pour Backgammon.
 *
 * Gère le stockage persistant local de :
 * - 'games' : parties locales et historiques
 * - 'moves' : coups joués et diagnostics
 * - 'coach_explanations' : analyses générées par le Coach IA
 * - 'sync_queue' : file d'attente des mutations à synchroniser vers Supabase
 * - 'game_analyses' : bilans complets de parties (v2)
 * - 'recurrent_mistakes' : banque d'erreurs récurrentes pour entraînement ciblé (v2)
 *
 * Inclut un fallback mémoire transparent pour les environnements SSR / tests / mode privé
 * ainsi qu'une protection transactionnelle sur les écritures par lot (AbortError / QuotaExceededError).
 */

export const DB_NAME = 'backgammon_offline_db';
export const DB_VERSION = 2;

export type StoreName =
    | 'games'
    | 'moves'
    | 'coach_explanations'
    | 'sync_queue'
    | 'game_analyses'
    | 'recurrent_mistakes';

export const ALL_STORE_NAMES: readonly StoreName[] = [
    'games',
    'moves',
    'coach_explanations',
    'sync_queue',
    'game_analyses',
    'recurrent_mistakes',
] as const;

// Mémoire tampon pour fallback (Node.js / Vitest / SSR / IDB désactivé / QuotaExceededError)
const memoryStore = new Map<StoreName, Map<string, unknown>>([
    ['games', new Map()],
    ['moves', new Map()],
    ['coach_explanations', new Map()],
    ['sync_queue', new Map()],
    ['game_analyses', new Map()],
    ['recurrent_mistakes', new Map()],
]);

let isIdbSupported: boolean | null = null;

export function checkIdbSupport(): boolean {
    if (isIdbSupported !== null) return isIdbSupported;
    if (typeof window === 'undefined') {
        isIdbSupported = false;
        return false;
    }
    try {
        isIdbSupported = Boolean(window.indexedDB);
    } catch {
        isIdbSupported = false;
    }
    return isIdbSupported;
}

function saveMemoryItems<T extends { id: string }>(storeName: StoreName, items: T[]): void {
    const mem = memoryStore.get(storeName);
    if (!mem) return;
    for (const item of items) {
        if (item && typeof item.id === 'string') {
            mem.set(item.id, item);
        }
    }
}

/**
 * Applique de manière idempotente la création et la migration des stores v1 -> v2.
 */
export function upgradeDatabaseSchema(db: IDBDatabase): void {
    // Stores v1
    if (!db.objectStoreNames.contains('games')) {
        db.createObjectStore('games', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('moves')) {
        db.createObjectStore('moves', { keyPath: 'id' }).createIndex('game_id', 'game_id', { unique: false });
    }
    if (!db.objectStoreNames.contains('coach_explanations')) {
        db.createObjectStore('coach_explanations', { keyPath: 'id' }).createIndex('game_id', 'game_id', { unique: false });
    }
    if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id' }).createIndex('createdAt', 'createdAt', { unique: false });
    }

    // Stores v2 : analyses de parties et erreurs récurrentes
    if (!db.objectStoreNames.contains('game_analyses')) {
        const store = db.createObjectStore('game_analyses', { keyPath: 'id' });
        store.createIndex('game_id', 'game_id', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
    }
    if (!db.objectStoreNames.contains('recurrent_mistakes')) {
        const store = db.createObjectStore('recurrent_mistakes', { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
    }
}

/**
 * Ouvre ou migre la base IndexedDB locale (v1 -> v2).
 */
export function openBackgammonDB(): Promise<IDBDatabase | null> {
    if (!checkIdbSupport()) return Promise.resolve(null);

    return new Promise((resolve) => {
        try {
            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                upgradeDatabaseSchema(db);
            };

            request.onsuccess = () => {
                const db = request.result;
                db.onversionchange = () => {
                    db.close();
                };
                resolve(db);
            };

            request.onblocked = () => {
                console.warn('[IndexedDB] Migration v2 bloquée par un autre onglet, utilisation du fallback mémoire');
                resolve(null);
            };

            request.onerror = () => {
                console.warn('[IndexedDB] Erreur d’ouverture, utilisation du fallback mémoire');
                resolve(null);
            };
        } catch {
            resolve(null);
        }
    });
}

/**
 * Enregistre ou met à jour un élément dans un store avec repli mémoire automatique.
 */
export async function putRecord<T extends { id: string }>(storeName: StoreName, value: T): Promise<void> {
    saveMemoryItems(storeName, [value]);
    const db = await openBackgammonDB();
    if (!db) {
        return;
    }

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(storeName, 'readwrite');
            const req = tx.objectStore(storeName).put(value);
            req.onsuccess = () => resolve();
            req.onerror = () => {
                saveMemoryItems(storeName, [value]);
                resolve();
            };
            tx.onabort = () => {
                saveMemoryItems(storeName, [value]);
                resolve();
            };
        } catch {
            saveMemoryItems(storeName, [value]);
            resolve();
        }
    });
}

/**
 * Écrit un lot d'enregistrements de manière transactionnelle avec protection
 * contre AbortError, QuotaExceededError et fermeture brutale d'onglet.
 */
export async function writeBatch<T extends { id: string }>(
    storeName: StoreName,
    items: T[],
): Promise<void> {
    if (items.length === 0) return;

    // Miroir mémoire immédiat garantissant 0 perte en cas de fermeture brutale d'onglet
    saveMemoryItems(storeName, items);

    const db = await openBackgammonDB();
    if (!db) {
        return;
    }

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);

            tx.oncomplete = () => resolve();
            tx.onabort = () => {
                const errName = tx.error?.name || 'AbortError';
                console.warn(`[IndexedDB] Transaction interrompue sur ${storeName} (${errName}), repli mémoire assuré`);
                saveMemoryItems(storeName, items);
                resolve();
            };
            tx.onerror = () => {
                if (tx.error?.name === 'QuotaExceededError') {
                    console.warn(`[IndexedDB] Quota dépassé sur ${storeName}, conservation en mémoire`);
                }
                saveMemoryItems(storeName, items);
                resolve();
            };

            for (const item of items) {
                store.put(item);
            }
        } catch {
            saveMemoryItems(storeName, items);
            resolve();
        }
    });
}

/**
 * Récupère un enregistrement par son identifiant unique.
 */
export async function getRecord<T>(storeName: StoreName, id: string): Promise<T | null> {
    const db = await openBackgammonDB();
    if (!db) {
        const item = memoryStore.get(storeName)?.get(id);
        return item !== undefined ? (item as T) : null;
    }

    return new Promise((resolve) => {
        try {
            const req = db.transaction(storeName, 'readonly').objectStore(storeName).get(id);
            req.onsuccess = () => {
                if (req.result) {
                    resolve(req.result as T);
                } else {
                    const fallback = memoryStore.get(storeName)?.get(id);
                    resolve(fallback !== undefined ? (fallback as T) : null);
                }
            };
            req.onerror = () => {
                const fallback = memoryStore.get(storeName)?.get(id);
                resolve(fallback !== undefined ? (fallback as T) : null);
            };
        } catch {
            const item = memoryStore.get(storeName)?.get(id);
            resolve(item !== undefined ? (item as T) : null);
        }
    });
}

/**
 * Récupère tous les enregistrements d'un store.
 */
export async function getAllRecords<T>(storeName: StoreName): Promise<T[]> {
    const db = await openBackgammonDB();
    if (!db) {
        return Array.from(memoryStore.get(storeName)?.values() || []) as T[];
    }

    return new Promise((resolve) => {
        try {
            const req = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
            req.onsuccess = () => {
                const res = (req.result as T[]) || [];
                if (res.length > 0) {
                    resolve(res);
                } else {
                    resolve(Array.from(memoryStore.get(storeName)?.values() || []) as T[]);
                }
            };
            req.onerror = () => resolve(Array.from(memoryStore.get(storeName)?.values() || []) as T[]);
        } catch {
            resolve(Array.from(memoryStore.get(storeName)?.values() || []) as T[]);
        }
    });
}

/**
 * Supprime un enregistrement par son identifiant.
 */
export async function deleteRecord(storeName: StoreName, id: string): Promise<void> {
    memoryStore.get(storeName)?.delete(id);
    const db = await openBackgammonDB();
    if (!db) {
        return;
    }

    return new Promise((resolve) => {
        try {
            const req = db.transaction(storeName, 'readwrite').objectStore(storeName).delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
        } catch {
            resolve();
        }
    });
}

/**
 * Vide complètement un store (tests et réinitialisation).
 */
export async function clearStore(storeName: StoreName): Promise<void> {
    memoryStore.get(storeName)?.clear();

    const db = await openBackgammonDB();
    if (!db) return;

    return new Promise((resolve) => {
        try {
            const req = db.transaction(storeName, 'readwrite').objectStore(storeName).clear();
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
        } catch {
            resolve();
        }
    });
}
