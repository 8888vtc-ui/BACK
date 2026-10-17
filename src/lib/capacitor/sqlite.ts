/**
 * Service de base de données SQLite native unifié pour Backgammon.
 *
 * Utilise @capacitor-community/sqlite sur iOS et Android, avec repli
 * transparent sur IndexedDB ou mémoire lorsque le plugin natif n'est pas actif.
 */

import { Capacitor } from '@capacitor/core';
import {
    CapacitorSQLite,
    SQLiteConnection,
    SQLiteDBConnection,
} from '@capacitor-community/sqlite';

const DB_NAME = 'backgammon_local.db';

let sqliteInstance: SQLiteConnection | null = null;
let dbInstance: SQLiteDBConnection | null = null;

export const BACKGAMMON_SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS local_games (
    id TEXT PRIMARY KEY,
    opponent_type TEXT NOT NULL,
    opponent_difficulty TEXT NOT NULL,
    match_length INTEGER NOT NULL,
    score_x INTEGER NOT NULL,
    score_o INTEGER NOT NULL,
    cube_value INTEGER NOT NULL,
    cube_owner TEXT,
    is_crawford INTEGER NOT NULL,
    status TEXT NOT NULL,
    winner TEXT,
    win_type TEXT,
    points_won INTEGER,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_moves (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    move_number INTEGER NOT NULL,
    player TEXT NOT NULL,
    dice TEXT NOT NULL,
    move_notation TEXT NOT NULL,
    equity_loss REAL,
    played_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_coach_explanations (
    id TEXT PRIMARY KEY,
    position_hash TEXT NOT NULL,
    move_played TEXT NOT NULL,
    optimal_move TEXT NOT NULL,
    equity_loss REAL NOT NULL,
    verdict TEXT NOT NULL,
    explanation TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL
);
`;

/**
 * Détermine si le plugin natif SQLite est disponible dans l'environnement d'exécution.
 */
export function isSqliteAvailable(): boolean {
    return Capacitor.isNativePlatform() || Capacitor.isPluginAvailable('CapacitorSQLite');
}

/**
 * Obtient ou initialise l'instance SQLiteConnection de Capacitor.
 */
export function getSqliteConnection(): SQLiteConnection {
    if (!sqliteInstance) {
        sqliteInstance = new SQLiteConnection(CapacitorSQLite);
    }
    return sqliteInstance;
}

/**
 * Ouvre ou crée la base SQLite locale et initialise le schéma de tables.
 */
export async function initSqliteDatabase(): Promise<SQLiteDBConnection | null> {
    if (!isSqliteAvailable()) {
        return null;
    }

    if (dbInstance) {
        return dbInstance;
    }

    try {
        const sqlite = getSqliteConnection();
        const retCC = await sqlite.checkConnectionsConsistency();
        const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

        if (retCC.result && isConn) {
            dbInstance = await sqlite.retrieveConnection(DB_NAME, false);
        } else {
            dbInstance = await sqlite.createConnection(
                DB_NAME,
                false,
                'no-encryption',
                1,
                false,
            );
        }

        await dbInstance.open();
        await dbInstance.execute(BACKGAMMON_SQLITE_SCHEMA);

        return dbInstance;
    } catch (err) {
        console.warn('[SQLite] Impossible d’initialiser la base native SQLite:', err);
        return null;
    }
}

/**
 * Exécute une requête SQL avec paramètres sur la base locale.
 */
export async function executeSql(
    statement: string,
    values: any[] = [],
): Promise<{ changes?: number } | null> {
    const db = await initSqliteDatabase();
    if (!db) return null;

    try {
        const res = await db.run(statement, values);
        return { changes: res.changes?.changes };
    } catch (err) {
        console.error('[SQLite] Erreur d’exécution SQL:', err);
        throw err;
    }
}

/**
 * Interroge la base locale SQLite et retourne un tableau de lignes typées.
 */
export async function querySql<T = Record<string, any>>(
    statement: string,
    values: any[] = [],
): Promise<T[]> {
    const db = await initSqliteDatabase();
    if (!db) return [];

    try {
        const res = await db.query(statement, values);
        return (res.values ?? []) as T[];
    } catch (err) {
        console.error('[SQLite] Erreur de requête SQL:', err);
        throw err;
    }
}

/**
 * Ferme proprement la connexion SQLite (utilisé lors des tests ou du teardown).
 */
export async function closeSqliteDatabase(): Promise<void> {
    if (dbInstance) {
        try {
            await dbInstance.close();
            const sqlite = getSqliteConnection();
            await sqlite.closeConnection(DB_NAME, false);
        } catch {
            // Ignorer les erreurs de fermeture
        }
        dbInstance = null;
    }
}
