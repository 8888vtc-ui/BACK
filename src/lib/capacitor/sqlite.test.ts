import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    isSqliteAvailable,
    initSqliteDatabase,
    executeSql,
    querySql,
    closeSqliteDatabase,
    BACKGAMMON_SQLITE_SCHEMA,
    getSqliteConnection,
} from './sqlite';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite } from '@capacitor-community/sqlite';

describe('Capacitor SQLite Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

    it('initSqliteDatabase retourne null si SQLite natif n’est pas disponible', async () => {
        vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(false);

        const db = await initSqliteDatabase();
        expect(db).toBeNull();
    });

    it('executeSql et querySql gèrent gracieusement l’absence de SQLite', async () => {
        vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(false);

        const execRes = await executeSql('INSERT INTO test VALUES (?)', [1]);
        expect(execRes).toBeNull();

        const queryRes = await querySql('SELECT * FROM test');
        expect(queryRes).toEqual([]);
    });

    it('closeSqliteDatabase se termine sans erreur même si aucune base n’est ouverte', async () => {
        await expect(closeSqliteDatabase()).resolves.toBeUndefined();
    });
});
