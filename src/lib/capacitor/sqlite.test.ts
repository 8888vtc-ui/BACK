import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    isSqliteAvailable,
    initSqliteDatabase,
    executeSql,
    querySql,
    closeSqliteDatabase,
    setSqliteConnectionForTests,
    BACKGAMMON_SQLITE_SCHEMA,
} from './sqlite';
import { Capacitor } from '@capacitor/core';
import type { SQLiteConnection } from '@capacitor-community/sqlite';

describe('Capacitor SQLite Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setSqliteConnectionForTests(null);
    });

    it('vérifie le schéma SQL embarqué contenant les tables locales', () => {
        expect(BACKGAMMON_SQLITE_SCHEMA).toContain('CREATE TABLE IF NOT EXISTS local_games');
        expect(BACKGAMMON_SQLITE_SCHEMA).toContain('CREATE TABLE IF NOT EXISTS local_moves');
        expect(BACKGAMMON_SQLITE_SCHEMA).toContain('CREATE TABLE IF NOT EXISTS local_coach_explanations');
    });

    it('isSqliteAvailable retourne false dans un environnement navigateur classique', () => {
        vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(false);

        expect(isSqliteAvailable()).toBe(false);
    });

    it('isSqliteAvailable retourne true sur plateforme native iOS ou Android', () => {
        vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);

        expect(isSqliteAvailable()).toBe(true);
    });

    it('initSqliteDatabase retourne null si SQLite natif n’est pas disponible (Web/PWA)', async () => {
        vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(false);

        const db = await initSqliteDatabase();
        expect(db).toBeNull();
    });

    it('executeSql et querySql gèrent gracieusement l’absence de SQLite en Web/PWA sans latence', async () => {
        vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(false);

        const execRes = await executeSql('INSERT INTO test VALUES (?)', [1]);
        expect(execRes).toBeNull();

        const queryRes = await querySql('SELECT * FROM test');
        expect(queryRes).toEqual([]);
    });

    it('exécute les requêtes via le plugin SQLite sur plateforme mobile native (iOS / Android)', async () => {
        vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);

        const mockDbConnection = {
            open: vi.fn().mockResolvedValue(undefined),
            execute: vi.fn().mockResolvedValue({ changes: { changes: 0 } }),
            run: vi.fn().mockResolvedValue({ changes: { changes: 1 } }),
            query: vi.fn().mockResolvedValue({ values: [{ id: 'g-native-1', score_x: 3 }] }),
            close: vi.fn().mockResolvedValue(undefined),
        };

        const mockSqlite = {
            checkConnectionsConsistency: vi.fn().mockResolvedValue({ result: false }),
            isConnection: vi.fn().mockResolvedValue({ result: false }),
            createConnection: vi.fn().mockResolvedValue(mockDbConnection),
            retrieveConnection: vi.fn().mockResolvedValue(mockDbConnection),
            closeConnection: vi.fn().mockResolvedValue(undefined),
        } as unknown as SQLiteConnection;

        setSqliteConnectionForTests(mockSqlite);

        const execRes = await executeSql('INSERT INTO local_games (id) VALUES (?)', ['g-native-1']);
        expect(execRes).toEqual({ changes: 1 });
        expect(mockDbConnection.open).toHaveBeenCalledTimes(1);
        expect(mockDbConnection.execute).toHaveBeenCalledWith(BACKGAMMON_SQLITE_SCHEMA);

        const rows = await querySql<{ id: string; score_x: number }>('SELECT * FROM local_games');
        expect(rows).toEqual([{ id: 'g-native-1', score_x: 3 }]);

        await closeSqliteDatabase();
        expect(mockDbConnection.close).toHaveBeenCalledTimes(1);
    });

    it('closeSqliteDatabase se termine sans erreur même si aucune base n’est ouverte', async () => {
        await expect(closeSqliteDatabase()).resolves.toBeUndefined();
    });
});
