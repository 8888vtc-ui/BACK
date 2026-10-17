/**
 * Module IndexedDB offline-first pour Backgammon.
 *
 * Gère le stockage persistant local de :
 * - 'games' : parties locales et historiques
 * - 'moves' : coups joués et diagnostics
 * - 'coach_explanations' : analyses générées par le Coach IA
 * - 'sync_queue' : file d'attente des mutations à synchroniser vers Supabase
 *
 * Inclut un fallback mémoire transparent pour les environnements SSR / tests / mode privé.
 */

export const DB_NAME = 'backgammon_offline_db';
export const DB_VERSION = 1;

export type StoreName = 'games' | 'moves' | 'coach_explanations' | 'sync_queue';

// Mémoire tampon pour fallback (Node.js / Vitest / SSR / IDB désactivé)
const memoryStore = new Map<StoreName, Map<string, any>>([
    ['games', new Map()],
    ['moves', new Map()],
    ['coach_explanations', new Map()],
    ['sync_queue', new Map()],
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

/**
 * Ouvre ou met à jour la base IndexedDB locale.
 */
export function openBackgammonDB(): Promise<IDBDatabase | null> {
    if (!checkIdbSupport()) {
        return Promise.resolve(null);
    }

    return new Promise((resolve) => {
        try {
            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains('games')) {
                    db.createObjectStore('games', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('moves')) {
                    const store = db.createObjectStore('moves', { keyPath: 'id' });
                    store.createIndex('game_id', 'game_id', { unique: false });
                }
                if (!db.objectStoreNames.contains('coach_explanations')) {
                    const store = db.createObjectStore('coach_explanations', { keyPath: 'id' });
                    store.createIndex('game_id', 'game_id', { unique: false });
                }
                if (!db.objectStoreNames.contains('sync_queue')) {
                    const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.warn('[IndexedDB] Erreur d\'ouverture, utilisation du fallback mémoire');
                resolve(null);
            };
        } catch {
            resolve(null);
        }
    });
}

/**
 * Enregistre ou met à jour un élément dans un store.
 */
export async function putRecord<T extends { id: string }>(storeName: StoreName, value: T): Promise<void> {
    const db = await openBackgammonDB();

    if (!db) {
        memoryStore.get(storeName)?.set(value.id, value);
        return;
    }

    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.put(value);

            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        } catch (err) {
            // Repli mémoire immédiat en cas d'erreur de transaction IDB
            memoryStore.get(storeName)?.set(value.id, value);
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
        return item ? (item as T) : null;
    }

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.get(id);

            req.onsuccess = () => resolve(req.result ? (req.result as T) : null);
            req.onerror = () => resolve(null);
        } catch {
            const item = memoryStore.get(storeName)?.get(id);
            resolve(item ? (item as T) : null);
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
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();

            req.onsuccess = () => resolve((req.result as T[]) || []);
            req.onerror = () => resolve([]);
        } catch {
            resolve(Array.from(memoryStore.get(storeName)?.values() || []) as T[]);
        }
    });
}

/**
 * Supprime un enregistrement par son identifiant.
 */
export async function deleteRecord(storeName: StoreName, id: string): Promise<void> {
    const db = await openBackgammonDB();

    if (!db) {
        memoryStore.get(storeName)?.delete(id);
        return;
    }

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.delete(id);

            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
        } catch {
            memoryStore.get(storeName)?.delete(id);
            resolve();
        }
    });
}

/**
 * Vide complètement un store (utile pour les tests et le reset).
 */
export async function clearStore(storeName: StoreName): Promise<void> {
    memoryStore.get(storeName)?.clear();

    const db = await openBackgammonDB();
    if (!db) return;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.clear();

            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
        } catch {
            resolve();
        }
    });
}
