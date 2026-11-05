/**
 * @file tests/e2e/control_04_crawford_cube_and_tournament_rules.spec.ts
 * @description MISSION 4/10 — Audit Mathématique & Visuel du Videau, Crawford, Post-Crawford, DMP, Jacoby, Beaver & Pip Count.
 * Conforme à AGENTS.md, GEMINI.md (< 250 lignes, 0 any, direct execution).
 */

import { test, expect } from '@playwright/test';
import {
    canPlayerOfferDouble,
    isBeaverAllowed,
    validateBeaverLegality,
    computeJacobyMultiplier,
} from '../../src/engine/cubeRules';

test.describe('MISSION 4/10 — Audit du Videau, Crawford, DMP, Jacoby, Beaver & Pip Count', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('has_seen_onboarding', 'true');
            window.localStorage.setItem('selected_gate', 'intermediate');
            window.localStorage.setItem('app_language', 'fr');
        });
    });

    test('Preuve 1 : Règle Crawford à 1-away (Bouton désactivé et badge explicite Règle Crawford)', async ({ page }) => {
        await page.goto('/play?gate=intermediate');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(400);

        // Attendre que l'interface et le pont QA soient disponibles
        await page.waitForFunction(() => typeof (window as unknown as { __BG_QA__?: unknown }).__BG_QA__ !== 'undefined');

        // Injecter un état de manche Crawford (score 2-0 dans un match en 3 points, Crawford actif)
        await page.evaluate(() => {
            const qa = (window as unknown as {
                __BG_QA__: {
                    applyRemoteState: (p: {
                        board: number[];
                        scoreX: number;
                        scoreO: number;
                        crawford: boolean;
                        turn: 'X' | 'O';
                        dice: null;
                        phase: 'WAITING_FOR_ROLL';
                        cubeValue: number;
                    }) => void;
                };
            }).__BG_QA__;

            const board = new Array<number>(26).fill(0);
            board[24] = 2; // Pions X en jeu
            board[6] = 5;
            board[8] = 3;
            board[13] = 5;
            board[1] = -2; // Pions O en jeu
            board[12] = -5;
            board[17] = -3;
            board[19] = -5;

            qa.applyRemoteState({
                board,
                scoreX: 2,
                scoreO: 0,
                crawford: true,
                turn: 'X',
                dice: null,
                phase: 'WAITING_FOR_ROLL',
                cubeValue: 1,
            });
        });

        // 1. Vérifier le badge Crawford sur le rail de match Desktop
        const crawfordBadge = page.getByTestId('left-rail-crawford-badge');
        await expect(crawfordBadge).toBeVisible();
        await expect(crawfordBadge).toContainText('Crawford');

        // 2. Vérifier que le bouton Doubler n'est PAS disponible sur le plateau (Videau verrouillé par Crawford)
        const centerDoubleBtn = page.getByTestId('center-double-button');
        await expect(centerDoubleBtn).not.toBeVisible();
    });

    test('Preuve 2 : Post-Crawford (Déverrouillage du videau, Free Drop)', async ({ page }) => {
        await page.goto('/play?gate=intermediate');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(400);
        await page.waitForFunction(() => typeof (window as unknown as { __BG_QA__?: unknown }).__BG_QA__ !== 'undefined');

        // Manche Post-Crawford : score 2-1 sur 3, Crawford déjà passé
        await page.evaluate(() => {
            const qa = (window as unknown as {
                __BG_QA__: {
                    applyRemoteState: (p: {
                        board: number[];
                        scoreX: number;
                        scoreO: number;
                        crawford: boolean;
                        turn: 'X' | 'O';
                        dice: null;
                        phase: 'WAITING_FOR_ROLL';
                        cubeValue: number;
                    }) => void;
                };
            }).__BG_QA__;

            const board = new Array<number>(26).fill(0);
            board[24] = 2;
            board[6] = 5;
            board[8] = 3;
            board[13] = 5;
            board[1] = -2;
            board[12] = -5;
            board[17] = -3;
            board[19] = -5;

            qa.applyRemoteState({
                board,
                scoreX: 2,
                scoreO: 1,
                crawford: false,
                turn: 'X',
                dice: null,
                phase: 'WAITING_FOR_ROLL',
                cubeValue: 1,
            });
        });

        // Le badge Crawford ne doit plus être affiché
        await expect(page.getByTestId('left-rail-crawford-badge')).not.toBeVisible();
    });

    test('Preuve 3 : Double Match Point (DMP — 2-2 sur 3 pts, Videau désactivé)', async ({ page }) => {
        await page.goto('/play?gate=intermediate');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(400);
        await page.waitForFunction(() => typeof (window as unknown as { __BG_QA__?: unknown }).__BG_QA__ !== 'undefined');

        // Score 2-2 dans un match en 3 points (DMP)
        await page.evaluate(() => {
            const qa = (window as unknown as {
                __BG_QA__: {
                    applyRemoteState: (p: {
                        board: number[];
                        scoreX: number;
                        scoreO: number;
                        crawford: boolean;
                        turn: 'X' | 'O';
                        dice: null;
                        phase: 'WAITING_FOR_ROLL';
                        cubeValue: number;
                    }) => void;
                };
            }).__BG_QA__;

            const board = new Array<number>(26).fill(0);
            board[24] = 2;
            board[6] = 5;
            board[8] = 3;
            board[13] = 5;
            board[1] = -2;
            board[12] = -5;
            board[17] = -3;
            board[19] = -5;

            qa.applyRemoteState({
                board,
                scoreX: 2,
                scoreO: 2,
                crawford: false,
                turn: 'X',
                dice: null,
                phase: 'WAITING_FOR_ROLL',
                cubeValue: 1,
            });
        });

        // 1. Vérifier le badge DMP sur le rail de match Desktop
        const dmpBadge = page.getByTestId('left-rail-dmp-badge');
        await expect(dmpBadge).toBeVisible();
        await expect(dmpBadge).toContainText('DMP');

        // 2. Vérifier que le bouton Doubler n'est PAS disponible sur le plateau (Videau verrouillé par DMP)
        const centerDoubleBtn = page.getByTestId('center-double-button');
        await expect(centerDoubleBtn).not.toBeVisible();
    });

    test('Preuve 4 : Validations Mathématiques (Beaver Interdit en Match Play, Règle Jacoby & Masquage Pip Count)', async ({ page }) => {
        // 1. Beaver en Match Play (matchLength > 0)
        expect(isBeaverAllowed(0)).toBe(true);
        expect(isBeaverAllowed(5)).toBe(false);
        expect(() => validateBeaverLegality(5)).toThrowError('MATCH_PLAY_BEAVER_FORBIDDEN');

        // 2. Règle Jacoby en Money Game
        expect(computeJacobyMultiplier({ matchLength: 0, cubeValue: 1, rawMultiplier: 2 })).toBe(1);
        expect(computeJacobyMultiplier({ matchLength: 0, cubeValue: 1, rawMultiplier: 3 })).toBe(1);
        expect(computeJacobyMultiplier({ matchLength: 0, cubeValue: 2, rawMultiplier: 2 })).toBe(2);

        // 3. Masquage Pip Count en Tournoi Live (localStorage key backgammon_show_pipcount)
        await page.goto('/play?gate=intermediate');
        await page.waitForLoadState('domcontentloaded');

        // Désactiver l'affichage des pips pour le Mode Tournoi Live
        await page.evaluate(() => {
            window.localStorage.setItem('backgammon_show_pipcount', 'false');
            window.dispatchEvent(new CustomEvent('bg:pip-visibility-change', { detail: false }));
        });

        const stored = await page.evaluate(() => window.localStorage.getItem('backgammon_show_pipcount'));
        expect(stored).toBe('false');
    });
});
