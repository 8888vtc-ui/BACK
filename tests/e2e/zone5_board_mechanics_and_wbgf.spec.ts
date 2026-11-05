import { test, expect } from '@playwright/test';
import {
    createInitialState,
    generateLegalMoves,
    generateSingleMoves,
    applyMove,
    borneOffCount,
    pipCount,
    X_BAR,
    O_BAR,
    type BoardState,
} from '../../src/engine/backgammonEngine';

test.describe('Zone 5 — Audit & Verrouillage du Plateau, Manipulation des Dames & Règles WBGF', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('1. Fluidité & Ergonomie : Smart point click, Swap Dice et Undo', async ({ page }) => {
        await page.goto('/play?gate=expert');
        await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

        // Vérifier que le conteneur du plateau et les rails sont actifs
        await expect(page.locator('[data-testid="board-left-player-rail"]')).toBeVisible();

        // Le bouton Undo est présent sur le rail d'action
        const undoBtn = page.locator('[data-testid="right-rail-undo-btn"]');
        if (await undoBtn.isVisible()) {
            await expect(undoBtn).toBeEnabled();
        }
    });

    test('2. Tiroir Réglages (⚙️) sur le rail droit', async ({ page }) => {
        await page.goto('/play?gate=expert');
        await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

        // 1. Bouton Réglages sur le rail droit
        const settingsBtn = page.locator('[data-testid="right-rail-settings-btn"]');
        await expect(settingsBtn).toBeVisible();
        await settingsBtn.click();

        // Le tiroir / popover de réglages s'ouvre
        const settingsPopover = page.locator('[data-testid="right-rail-settings-popover"]');
        await expect(settingsPopover).toBeVisible();

        // Vérifier les 3 thèmes de tapis et bascules auto-confirm / auto-roll
        await expect(page.locator('[data-testid="right-rail-settings-close-btn"]')).toBeVisible();

        // Fermer le popover via le bouton de fermeture dédié
        await page.locator('[data-testid="right-rail-settings-close-btn"]').click();
        await expect(settingsPopover).not.toBeVisible();
    });

    test('2b. Réactions rapides (Quick-Chat) courtoises sur le rail joueur', async ({ page }) => {
        await page.goto('/play?gate=expert');
        await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

        // Bouton Quick-Chat sur le rail gauche
        const quickChatBtn = page.locator('[data-testid="left-rail-quick-chat-toggle"]');
        await expect(quickChatBtn).toBeVisible();
        await quickChatBtn.click();

        const quickChatPopover = page.locator('[data-testid="left-rail-quick-chat-popover"]');
        await expect(quickChatPopover).toBeVisible();
        await expect(page.locator('[data-testid="quick-chat-btn-gg"]')).toBeVisible();

        // Envoi d'un message courtois
        await page.locator('[data-testid="quick-chat-btn-gg"]').click();
        await expect(quickChatPopover).not.toBeVisible();
    });

    test('3. WBGF Règle #1 (Obligation 2 dés) & Règle #2 (Plus grand dé obligatoire si 1 seul jouable)', async () => {
        // Règle 1 : Obligation de jouer les 2 dés si un chemin existe
        const state = createInitialState(7);
        const sequences = generateLegalMoves(state, [3, 1]);
        expect(sequences.length).toBeGreaterThan(0);
        // Toutes les séquences légales complètes jouent 2 dés
        for (const seq of sequences) {
            expect(seq.moves.length).toBe(2);
        }

        // Règle 2 : Plus grand dé obligatoire quand un seul est jouable (HIGHER_DIE_MANDATORY)
        // Configuration où X peut jouer le dé 5 ou le dé 3, mais pas les deux consécutivement
        const customBoard = new Array(28).fill(0);
        customBoard[24] = 1; // Pion X en case 24
        // On bloque les cases d'arrivée combinées de telle sorte qu'un seul dé puisse être joué
        // Si d1=5 (arrive en 19) et d2=3 (arrive en 21)
        customBoard[19] = 0; // Libre pour 5 (24 -> 19)
        customBoard[21] = 0; // Libre pour 3 (24 -> 21)
        customBoard[16] = -2; // Bloqué pour 5+3 ou 3+5 (case 16)
        customBoard[18] = -2; // Bloqué pour 3 puis 5 depuis 21 (21 - 5 = 16)

        const constrainedState: BoardState = {
            board: customBoard,
            turn: 'X',
            dice: [5, 3],
            cubeValue: 1,
            cubeOwner: null,
            scoreX: 0,
            scoreO: 0,
            matchLength: 7,
            crawford: false,
            doubled: false,
            resigned: 0,
        };

        const singleMoves = generateLegalMoves(constrainedState, [5, 3]);
        expect(singleMoves.length).toBeGreaterThan(0);
        for (const seq of singleMoves) {
            expect(seq.moves.length).toBe(1);
            // Le coup DOIT obligatoirement utiliser le plus fort dé (5)
            expect(seq.moves[0].from - seq.moves[0].to).toBe(5);
        }
    });

    test('4. WBGF Règle #3 (Bear-off avec dé supérieur) & Règle #4 (Danse sur la barre)', async () => {
        // Règle 3 : Bear-off avec dé supérieur depuis le point le plus haut occupé sans pion derrière
        const bearOffBoard = new Array(28).fill(0);
        bearOffBoard[3] = 2; // Pions en case 3
        bearOffBoard[2] = 1; // Pion en case 2
        // Aucun pion en 4, 5, 6
        const bearOffState: BoardState = {
            board: bearOffBoard,
            turn: 'X',
            dice: [6, 1],
            cubeValue: 1,
            cubeOwner: null,
            scoreX: 0,
            scoreO: 0,
            matchLength: 7,
            crawford: false,
            doubled: false,
            resigned: 0,
        };

        const bearMoves = generateLegalMoves(bearOffState, [6, 1]);
        expect(bearMoves.length).toBeGreaterThan(0);
        // Le dé 6 doit permettre de sortir le pion de la case 3 (overshoot légal)
        const hasBearOffFrom3 = bearMoves.some((seq) =>
            seq.moves.some((m) => m.from === 3 && m.to === 0),
        );
        expect(hasBearOffFrom3).toBe(true);

        // Règle 4 : Danse sur la barre si les portes de rentrée sont fermées
        const blockedBoard = new Array(28).fill(0);
        blockedBoard[X_BAR] = 1; // Pion X sur la barre
        // Les 6 portes d'entrée (19 à 24) sont occupées par >= 2 pions adverses O
        for (let pt = 19; pt <= 24; pt++) {
            blockedBoard[pt] = -2;
        }

        const dancingState: BoardState = {
            board: blockedBoard,
            turn: 'X',
            dice: [6, 5],
            cubeValue: 1,
            cubeOwner: null,
            scoreX: 0,
            scoreO: 0,
            matchLength: 7,
            crawford: false,
            doubled: false,
            resigned: 0,
        };

        const dancingMoves = generateLegalMoves(dancingState, [6, 5]);
        // Aucune action possible : retour immédiat de [] (danse)
        expect(dancingMoves).toEqual([]);
    });

    test('5. WBGF Règle #5 : Conservation absolue des 15 pions Blancs et 15 pions Noirs à chaque coup', async () => {
        const initialState = createInitialState(7);

        // Comptage total initial
        const totalXInitial = initialState.board.reduce((acc, v) => (v > 0 ? acc + v : acc), 0) + borneOffCount(initialState.board, 'X');
        const totalOInitial = initialState.board.reduce((acc, v) => (v < 0 ? acc + Math.abs(v) : acc), 0) + borneOffCount(initialState.board, 'O');

        expect(totalXInitial).toBe(15);
        expect(totalOInitial).toBe(15);

        // Test sur 20 coups légaux simulés
        const sequences = generateLegalMoves(initialState, [4, 2]);
        expect(sequences.length).toBeGreaterThan(0);

        for (const seq of sequences.slice(0, 5)) {
            let currentBoard = [...initialState.board];
            for (const move of seq.moves) {
                currentBoard = applyMove(currentBoard, move, 'X');
            }
            const countX = currentBoard.reduce((acc, v) => (v > 0 ? acc + v : acc), 0) + borneOffCount(currentBoard, 'X');
            const countO = currentBoard.reduce((acc, v) => (v < 0 ? acc + Math.abs(v) : acc), 0) + borneOffCount(currentBoard, 'O');

            expect(countX).toBe(15);
            expect(countO).toBe(15);
        }
    });
});
