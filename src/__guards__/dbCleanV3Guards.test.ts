/**
 * Garde-fous bloquants de la purge `quiz_and_accounts_v3_clean` / `db_clean_v3` (2026-11-02)
 * — voir BOTS_AUDIT_POSTMORTEM.md.
 *
 * Test strict #1 (Zéro Ancien Quiz)    : `assert(quizCount === 0)` (zéro quiz hors GNUBG 3-ply + zéro fichier seed legacy).
 * Test strict #2 (Zéro Ancien Compte)  : `assert(oldBotAccountsCount === 0)` (zéro cohorte/compte bot factice en DB ou code).
 * Test strict #3 (Anti-Fake Bot)       : Scan AST/Regex qui lève `FAKE_ENGINE_DETECTED` si une heuristique maison
 *                                        ou un `Math.random()` sur les équités subsiste.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { BENCHMARK_BLUNDERS, GNUBG_VERIFIED_XGIDS } from '../features/drills/benchmarkBlunders';
import { DAILY_PUZZLES_CATALOG } from '../lib/puzzle/puzzleService';
import { PUZZLE_DATABASE } from '../features/puzzles/puzzleDatabase';
import { GNUBG_3PLY_CERTIFIED_POSITIONS } from '../lib/engine/gnubg3PlyCertifiedPositions';
import { GNUBG_3PLY_QUIZ_BANK } from '../features/drills/gnubg3PlyQuizBank';
import { BGSAGE_3PLY_FACTORY_SEED } from '../features/drills/bgsage3PlyFactorySeed';
import { APP_VERSION_STAMP, DB_CLEAN_VERSION, runDbCleanMigration } from '../lib/storage/dbCleanMigration';

const SRC = path.resolve(__dirname, '..');
const ROOT = path.resolve(SRC, '..');

/** Fichiers supprimés : leur réapparition = régression. */
const DELETED_LEGACY_FILES = [
    'features/drills/harvestedMultiPlySeeds.ts',
    'features/drills/btCore5000HarvestSeeds.ts',
    'features/drills/btErhHarvestSeeds.ts',
    'lib/engine/btErhEngine.ts',
    'lib/engine/humanBotCohort100.ts',
    'lib/engine/btDuplicateArena.ts',
    'lib/engine/opponentErhTracker.ts',
];

/** Chemins qui doivent n'utiliser que bgsage / les données GNUBG. */
const PROTECTED_FILES = [
    'hooks/orchestrators/opponentMoveCalculator.ts',
    'hooks/orchestrators/opponentTurnExecution.ts',
    'actions/runAiTurnAction.ts',
    'features/drills/benchmarkBlunders.ts',
    'components/drills/DrillPositionContextAndReading.tsx',
    'features/puzzles/puzzleDatabase.ts',
    'features/puzzles/gnubgPuzzleAdapter.ts',
    'lib/puzzle/puzzleService.ts',
];

/** Fonctions de choix de coup / d'évaluation heuristiques maison interdites dans ces chemins. */
const FAKE_ENGINE_PATTERN =
    /\b(selectBestOpponentSequence|pickLocalMove|findBestBtCoreMove|analyzeBtCoreMoves|evaluateBtCoreBoard|computeBtCoreResidualCorrection|evaluateBtNeuralBoard|findBestBtErhMove|analyzeBoardMoves|findBestBoardMove|evaluatePositionExpectiminimax2Ply|computeRealtimeBotErrorRate|selectHumanCalibratedMove)\b/;

/** Ids des positions GNUBG (les records de la banque ne stockent pas l'XGID brut). */
const BENCHMARK_XGID_BY_ID = new Set<string>([
    ...GNUBG_3PLY_CERTIFIED_POSITIONS.map((p) => p.id),
    ...GNUBG_3PLY_QUIZ_BANK.map((q) => q.id),
    ...BGSAGE_3PLY_FACTORY_SEED.map((s) => s.id),
]);

describe('Garde-fous quiz_and_accounts_v3_clean — Boucle FlashLite-Loop-Inspector', () => {
    it('Test strict #1 (Zéro Ancien Quiz) : assert(quizCount === 0) & purge localStorage active', () => {
        expect(GNUBG_3PLY_CERTIFIED_POSITIONS.length).toBeGreaterThan(0);
        expect(GNUBG_3PLY_QUIZ_BANK.length).toBeGreaterThan(0);
        const legacyQuizzes = BENCHMARK_BLUNDERS.filter((b) => {
            const xgid = (b as { xgid?: string }).xgid;
            return !BENCHMARK_XGID_BY_ID.has(b.id) && (xgid === undefined || !GNUBG_VERIFIED_XGIDS.has(xgid));
        });
        const quizCount = legacyQuizzes.length;
        expect(quizCount).toBe(0);

        const legacyPuzzles = [
            ...DAILY_PUZZLES_CATALOG.filter((p) => !p.id.startsWith('gnubg_daily_')),
            ...PUZZLE_DATABASE.filter((p) => !p.id.startsWith('gnubg_')),
        ];
        expect(legacyPuzzles.map((p) => p.id)).toEqual([]);

        // Vérifie la clé de purge navigateur `APP_VERSION_STAMP`
        expect(DB_CLEAN_VERSION).toBe(APP_VERSION_STAMP);
        const mem = new Map<string, string>([
            ['bg_blunder_bank', '[{"id":"legacy_1"}]'],
            ['bg_bot_cohort_profiles', '[{"id":"bot_fake"}]'],
        ]);
        const removed = runDbCleanMigration({
            getItem: (k) => mem.get(k) ?? null,
            setItem: (k, v) => {
                mem.set(k, v);
            },
            removeItem: (k) => {
                mem.delete(k);
            },
        });
        expect(removed).toBe(2);
        expect(mem.get('bg_db_clean_version')).toBe(APP_VERSION_STAMP);
    });

    it('Test strict #2 (Zéro Ancien Compte) : assert(oldBotAccountsCount === 0) en DB et dans le code', () => {
        const resurrected = DELETED_LEGACY_FILES.filter((f) => fs.existsSync(path.join(SRC, f)));
        const oldBotAccountsCount = resurrected.length;
        expect(oldBotAccountsCount, `FAKE_ENGINE_DETECTED : ${resurrected.join(', ')}`).toBe(0);

        const sqlMigrationPath = path.join(
            ROOT,
            'supabase/migrations/20261102000000_purge_legacy_quizzes_and_bot_accounts.sql',
        );
        expect(fs.existsSync(sqlMigrationPath)).toBe(true);
        const sqlContent = fs.readFileSync(sqlMigrationPath, 'utf8');
        expect(sqlContent).toContain('TRUNCATE TABLE');
        expect(sqlContent).toContain('DELETE FROM public.rooms');
    });

    it('Test strict #3 (Anti-Fake Bot) : FAKE_ENGINE_DETECTED = 0 moteur heuristique local et 0 Math.random() sur les équités', () => {
        const offenders: string[] = [];
        for (const rel of PROTECTED_FILES) {
            const code = fs.readFileSync(path.join(SRC, rel), 'utf8');
            const match = code.match(FAKE_ENGINE_PATTERN);
            if (match) offenders.push(`${rel} → ${match[0]}`);
        }
        const bgsageCode = fs.readFileSync(path.join(SRC, 'lib/engine/bgsageClient.ts'), 'utf8');
        if (/Math\.random/.test(bgsageCode)) {
            offenders.push('lib/engine/bgsageClient.ts → Math.random');
        }
        expect(offenders, `FAKE_ENGINE_DETECTED : ${offenders.join(' | ')}`).toEqual([]);
    });
});
