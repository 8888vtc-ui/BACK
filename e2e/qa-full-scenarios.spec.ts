import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/LAPTOP/.gemini/antigravity/brain/b82bf86d-b732-443c-a065-798c8f06de27';

test.use({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    hasTouch: false,
});

test.describe('QA Lead — Validation Autonome des 4 Scénarios Officiels (10/10)', () => {
    test('Scénarios 1 à 4 : Match Play (Crawford), Money Game (1x/2x/3x), Videau (2x/4x/Take/Pass) & Ergonomie (Dé haut, Validation Manuelle/Auto, Bilan PR)', async ({ page }) => {
        const consoleErrors: string[] = [];
        const pageErrors: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                const text = msg.text();
                if (!text.includes('favicon') && !text.includes('net::ERR_') && !text.includes('Failed to load resource')) {
                    consoleErrors.push(text);
                }
            }
        });
        page.on('pageerror', (err) => {
            pageErrors.push(err.message);
        });

        await page.goto('/');
        await expect(page.getByTestId('lobby-start-btn')).toBeVisible({ timeout: 15000 });

        // =========================================================================
        // SCÉNARIO 1 : MATCH PLAY (Match en 3 points + Règle de Crawford)
        // =========================================================================
        await page.getByTestId('lobby-options-toggle').click();
        await page.getByTestId('lobby-format-3').click();
        await page.getByTestId('lobby-start-btn').click();

        await expect(page.getByTestId('app-game-view')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('hud-match-format')).toContainText('Match 3 pts');

        // Configure une position de sortie finale pour X avec Cube à 2 (X gagne 2 pts -> score 2-0 sur 3)
        await page.evaluate(() => {
            const qa = (window as unknown as { __BG_QA__: any }).__BG_QA__;
            const board = new Array(28).fill(0);
            board[1] = 1;      // Dernier pion de X sur la flèche 1
            board[26] = 14;    // 14 pions X déjà sortis (X_OFF = 26)
            board[24] = -10;   // 10 pions O
            board[27] = -5;    // 5 pions O déjà sortis (O_OFF = 27 -> pas de gammon)
            qa.applyRemoteState({
                board,
                turn: 'X',
                dice: [3, 1],
                usedDice: [false, false],
                phase: 'PLAYING_MOVES',
                cubeValue: 2,
                cubeOwner: 'X',
                scoreX: 0,
                scoreO: 0,
                crawford: false,
            });
        });
        await page.waitForTimeout(460);

        // Clique sur la flèche 1 pour sortir le 15e pion de X
        await page.getByTestId('point-triangle-1').click();

        // Vérifie l'ouverture du Rapport Post-Match avec score 2 - 0 / 3 (+2 pts)
        const reportModal = page.getByTestId('post-match-training-report');
        await expect(reportModal).toBeVisible({ timeout: 8000 });
        await expect(page.getByTestId('post-match-header')).toContainText('2 – 0');
        await expect(page.getByTestId('post-match-points-won')).toContainText('+2 pts');

        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'qa_scen1_match_play_2_0.png'),
        });

        // Passe à la manche suivante : à 2-0 dans un match en 3 pts, la règle de CRAWFORD doit s'activer !
        await page.getByTestId('post-match-next-game-btn').click();
        await expect(reportModal).toBeHidden();

        // Vérifie que le badge Crawford est affiché dans le HUD et que le bouton Doubler est verrouillé
        await expect(page.getByTestId('hud-crawford-badge')).toBeVisible();
        await expect(page.getByTestId('hud-crawford-badge')).toContainText('Crawford');
        await expect(page.getByTestId('center-double-button')).toHaveCount(0);

        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'qa_scen1_crawford_game.png'),
        });

        // Retour au Salon pour lancer le Scénario 2 (Money Game)
        await page.getByTestId('hud-back-to-lobby-btn').click();
        const leaveLobbyBtn = page.getByTestId('confirm-leave-match-btn');
        if (await leaveLobbyBtn.isVisible()) {
            await leaveLobbyBtn.click();
        }
        await expect(page.getByTestId('lobby-start-btn')).toBeVisible();

        // =========================================================================
        // SCÉNARIO 2 : MONEY GAME (Session libre — Simple 1x, Gammon 2x, Backgammon 3x)
        // =========================================================================
        await page.getByTestId('lobby-options-toggle').click();
        await page.getByTestId('lobby-format-0').click();
        await page.getByTestId('lobby-start-btn').click();

        await expect(page.getByTestId('app-game-view')).toBeVisible();
        await expect(page.getByTestId('hud-match-format')).toContainText('Money Game');

        // 2A. Victoire Simple (1x) : O a déjà sorti au moins 1 pion (board[27] = -5)
        await page.evaluate(() => {
            const qa = (window as unknown as { __BG_QA__: any }).__BG_QA__;
            const board = new Array(28).fill(0);
            board[1] = 1;
            board[26] = 14;
            board[24] = -10;
            board[27] = -5;
            qa.applyRemoteState({
                board,
                turn: 'X',
                dice: [2, 1],
                usedDice: [false, false],
                phase: 'PLAYING_MOVES',
                cubeValue: 1,
                cubeOwner: null,
                scoreX: 0,
                scoreO: 0,
            });
        });
        await page.waitForTimeout(460);
        await page.getByTestId('point-triangle-1').click();
        await expect(reportModal).toBeVisible();
        await expect(page.getByTestId('post-match-win-type')).toContainText('Victoire simple');
        await expect(page.getByTestId('post-match-points-won')).toContainText('+1 pt');
        await expect(page.getByTestId('post-match-header')).toContainText('1 – 0');

        // Enchaîne la manche suivante en Money Game
        await page.getByTestId('post-match-next-game-btn').click();
        await expect(reportModal).toBeHidden();

        // 2B. Victoire par GAMMON (2x) : O a 0 pion sorti (board[27] = 0) et aucun pion dans le jan intérieur de X
        await page.evaluate(() => {
            const qa = (window as unknown as { __BG_QA__: any }).__BG_QA__;
            const board = new Array(28).fill(0);
            board[1] = 1;
            board[26] = 14;
            board[24] = -15;
            board[27] = 0;
            qa.applyRemoteState({
                board,
                turn: 'X',
                dice: [4, 1],
                usedDice: [false, false],
                phase: 'PLAYING_MOVES',
                cubeValue: 1,
                cubeOwner: null,
            });
        });
        await page.waitForTimeout(460);
        await page.getByTestId('point-triangle-1').click();
        await expect(reportModal).toBeVisible();
        await expect(page.getByTestId('post-match-win-type')).toContainText('Gammon (2x)');
        await expect(page.getByTestId('post-match-points-won')).toContainText('+2 pts');
        await expect(page.getByTestId('post-match-header')).toContainText('3 – 0');

        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'qa_scen2_money_gammon_2x.png'),
        });

        await page.getByTestId('post-match-next-game-btn').click();
        await expect(reportModal).toBeHidden();

        // 2C. Victoire par BACKGAMMON (3x) avec Videau à 2 (= +6 pts, score cumulé 9 – 0)
        // O a 0 pion sorti ET a encore des pions dans le jan intérieur de X (flèche 2)
        await page.evaluate(() => {
            const qa = (window as unknown as { __BG_QA__: any }).__BG_QA__;
            const board = new Array(28).fill(0);
            board[1] = 1;
            board[26] = 14;
            board[2] = -2;     // Pions O dans le jan intérieur de X (1..6) !
            board[24] = -13;
            board[27] = 0;
            qa.applyRemoteState({
                board,
                turn: 'X',
                dice: [5, 1],
                usedDice: [false, false],
                phase: 'PLAYING_MOVES',
                cubeValue: 2,
                cubeOwner: 'X',
            });
        });
        await page.waitForTimeout(460);
        await page.getByTestId('point-triangle-1').click();
        await expect(reportModal).toBeVisible();
        await expect(page.getByTestId('post-match-win-type')).toContainText('Backgammon (3x)');
        await expect(page.getByTestId('post-match-points-won')).toContainText('+6 pts');
        await expect(page.getByTestId('post-match-header')).toContainText('9 – 0');

        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'qa_scen2_money_backgammon_3x.png'),
        });

        // Passe à la manche suivante pour tester le Scénario 3 (Videau / Doubling Cube)
        await page.getByTestId('post-match-next-game-btn').click();
        await expect(reportModal).toBeHidden();

        // =========================================================================
        // SCÉNARIO 3 : VIDEAU / DOUBLING CUBE (Double à 2, Redouble à 4, Take & Pass)
        // =========================================================================
        // 3A. Le joueur X clique sur "Doubler" (propose le cube à 2) et l'IA accepte ("Take")
        await expect(page.getByTestId('center-double-button')).toBeVisible();
        await page.getByTestId('center-double-button').click();

        // Sur la position initiale équilibrée, l'IA accepte le videau (cubeValue = 2, cubeOwner = 'O')
        await expect(page.getByTestId('hud-cube-badge')).toContainText('Cube 2× (IA)', { timeout: 6000 });
        await expect(page.getByTestId('doubling-cube')).toContainText('2');
        await expect(page.getByTestId('doubling-cube')).toHaveAttribute('data-cube-zone', 'top');

        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'qa_scen3_cube_2x_ai_owned.png'),
        });

        // 3B. L'IA (propriétaire du cube à 2) propose un Redouble à 4 -> le joueur X voit Prendre (×4) / Passer
        await page.evaluate(() => {
            const qa = (window as unknown as { __BG_QA__: any }).__BG_QA__;
            qa.applyRemoteState({
                board: qa.getState().boardState.board,
                turn: 'O',
                dice: null,
                phase: 'DOUBLING_OFFERED',
                cubeValue: 2,
                cubeOwner: 'O',
                doublingOfferedBy: 'O',
            });
        });

        await expect(page.getByTestId('center-cube-decision')).toBeVisible();
        await expect(page.getByTestId('center-take-double-button')).toContainText('Prendre (×4)');
        await expect(page.getByTestId('center-pass-double-button')).toContainText('Passer');

        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'qa_scen3_cube_4x_offered.png'),
        });

        // Le joueur X clique sur "Prendre (×4)" -> le cube passe à 4 et appartient à X ("bottom" / "Vous")
        await page.getByTestId('center-take-double-button').click();
        await expect(page.getByTestId('hud-cube-badge')).toContainText('Cube 4× (Vous)');
        await expect(page.getByTestId('doubling-cube')).toContainText('4');
        await expect(page.getByTestId('doubling-cube')).toHaveAttribute('data-cube-zone', 'bottom');

        // 3C. Test du refus de videau ("Pass / Drop") : si un double est refusé, fin de manche immédiate ('pass')
        await page.evaluate(() => {
            const qa = (window as unknown as { __BG_QA__: any }).__BG_QA__;
            qa.applyRemoteState({
                board: qa.getState().boardState.board,
                turn: 'O',
                dice: null,
                phase: 'DOUBLING_OFFERED',
                cubeValue: 4,
                cubeOwner: 'O',
                doublingOfferedBy: 'O',
            });
        });
        await page.getByTestId('center-pass-double-button').click();
        await expect(reportModal).toBeVisible();
        await expect(page.getByTestId('post-match-win-type')).toContainText('Abandon du videau');
        await expect(page.getByTestId('post-match-points-won')).toContainText('+4 pts');

        await page.getByTestId('post-match-next-game-btn').click();
        await expect(reportModal).toBeHidden();

        // =========================================================================
        // SCÉNARIO 4 : ERGONOMIE & JOUABILITÉ PURE (Priorité Dé Haut, Repli Dé Bas,
        //              Inversion, Validation Manuelle vs Auto, et Bilan PR Complet)
        // =========================================================================
        // Vérifie que `autoConfirmTurn` est à false par défaut
        const autoToggle = page.getByTestId('toggle-auto-confirm-btn');
        await expect(autoToggle).toHaveAttribute('aria-pressed', 'false');

        // 4A. Priorité au dé le plus élevé sur clic simple : tirage [2, 5] (le plus petit dé est en index 0 !)
        await page.evaluate(() => {
            const qa = (window as unknown as { __BG_QA__: any }).__BG_QA__;
            qa.startNewGame();
            qa.rollDice([2, 5]);
        });
        await page.waitForTimeout(460);
        await expect(page.getByTestId('backgammon-board')).toHaveAttribute('data-dice-rolling', 'false');

        // Sur la position initiale, X a 5 pions sur la flèche 13 (`point-triangle-13`).
        // Un clic sur `point-triangle-13` DOIT jouer le 5 en premier (13 -> 8) et non le 2 (13 -> 11).
        await page.getByTestId('point-triangle-13').click();
        const afterFirstClickBoard = await page.evaluate(() => {
            return (window as unknown as { __BG_QA__: any }).__BG_QA__.getState().boardState.board;
        });
        expect(afterFirstClickBoard[8]).toBe(4);  // 3 pions initiaux sur 8 + 1 pion venu de 13 (dé 5 joué !)
        expect(afterFirstClickBoard[11]).toBe(0); // Flèche 11 inchangée (dé 2 non joué)

        // 4B. Annulation (`↶ Annuler`) + Inversion manuelle (clic droit joue le plus petit dé 2 en premier : 13 -> 11)
        await page.getByTestId('center-undo-button').click();
        await page.getByTestId('point-triangle-13').click({ button: 'right' });
        const afterRightClickBoard = await page.evaluate(() => {
            return (window as unknown as { __BG_QA__: any }).__BG_QA__.getState().boardState.board;
        });
        expect(afterRightClickBoard[11]).toBe(1); // Flèche 11 a reçu le pion (dé 2 joué via clic droit !)

        // 4C. Joue le second dé (5 : de 13 vers 8) -> les 2 dés sont consommés.
        // En mode manuel (`autoConfirmTurn === false`), le tour NE DOIT PAS passer automatiquement !
        await page.getByTestId('point-triangle-13').click();
        await expect(page.getByTestId('center-confirm-button')).toBeVisible();
        await expect(page.getByTestId('center-undo-button')).toBeVisible();

        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'qa_scen4_manual_confirm_bar.png'),
        });

        // 4D. Repli automatique sur le dé le plus bas si le dé le plus haut est bloqué :
        // Annule un coup, bloque la flèche 8 avec 2 pions adverses, et vérifie qu'un clic sur 13 joue le 2 !
        await page.evaluate(() => {
            const qa = (window as unknown as { __BG_QA__: any }).__BG_QA__;
            const board = new Array(28).fill(0);
            board[13] = 2;
            board[8] = -2; // Point 8 bloqué par O (dé 5 illégal depuis 13)
            board[6] = 13;
            board[24] = -13;
            qa.applyRemoteState({
                board,
                turn: 'X',
                dice: [2, 5],
                usedDice: [false, false],
                phase: 'PLAYING_MOVES',
            });
        });
        await page.waitForTimeout(460);
        await expect(page.getByTestId('backgammon-board')).toHaveAttribute('data-dice-rolling', 'false');
        await page.getByTestId('point-triangle-13').click();
        const afterFallbackBoard = await page.evaluate(() => {
            return (window as unknown as { __BG_QA__: any }).__BG_QA__.getState().boardState.board;
        });
        expect(afterFallbackBoard[11]).toBe(1); // Le dé 2 a été joué automatiquement car le 5 (13->8) était bloqué !
        // Joue ensuite le 5 depuis 6 vers 1
        await page.getByTestId('point-triangle-6').click();
        await expect(page.getByTestId('center-confirm-button')).toBeVisible();

        // Clique sur "✓ Valider" pour confirmer manuellement le tour
        await page.getByTestId('center-confirm-button').click();
        await expect(page.getByTestId('center-confirm-button')).toHaveCount(0);

        // 4E. Active le mode "⚡ Auto" (`autoConfirmTurn === true`) et vérifie le passage automatique après 250ms
        await page.evaluate(() => {
            const qa = (window as unknown as { __BG_QA__: any }).__BG_QA__;
            const board = new Array(28).fill(0);
            board[6] = 15;
            board[24] = -15;
            qa.applyRemoteState({
                board,
                turn: 'X',
                dice: [3, 1],
                usedDice: [false, false],
                phase: 'PLAYING_MOVES',
                doublingOfferedBy: null,
            });
        });
        await page.waitForTimeout(460);
        await expect(page.getByTestId('backgammon-board')).toHaveAttribute('data-dice-rolling', 'false');

        await autoToggle.click();
        await expect(autoToggle).toHaveAttribute('aria-pressed', 'true');
        const storedPref = await page.evaluate(() => window.localStorage.getItem('bg_auto_confirm_turn'));
        expect(storedPref).toBe('true');

        // Premier clic joue le 3 (6 -> 3), second clic joue le 1 (6 -> 5)
        await page.getByTestId('point-triangle-6').click();
        await page.getByTestId('point-triangle-6').click();
        // Le bouton "Valider" ne doit jamais s'afficher en mode Auto et le tour passe à O après ~250ms
        await expect(page.getByTestId('center-confirm-button')).toHaveCount(0);
        await page.waitForTimeout(400);
        const turnAfterAuto = await page.evaluate(() => {
            return (window as unknown as { __BG_QA__: any }).__BG_QA__.getState().boardState.turn;
        });
        expect(turnAfterAuto).toBe('O');

        // Remet `autoConfirmTurn` à false (défaut officiel) avant la dernière position
        await page.evaluate(() => {
            const qa = (window as unknown as { __BG_QA__: any }).__BG_QA__;
            qa.setAutoConfirmTurn(false);
        });

        // 4F. Fin de manche et ouverture du Bilan Complet (`GameReviewModal`) avec courbe PR et onglets
        await page.evaluate(() => {
            const qa = (window as unknown as { __BG_QA__: any }).__BG_QA__;
            const board = new Array(28).fill(0);
            board[1] = 1;
            board[26] = 14;
            board[24] = -10;
            board[27] = -5;
            qa.applyRemoteState({
                board,
                turn: 'X',
                dice: [2, 1],
                usedDice: [false, false],
                phase: 'PLAYING_MOVES',
                cubeValue: 1,
                doublingOfferedBy: null,
            });
        });
        await page.waitForTimeout(460);
        await expect(page.getByTestId('backgammon-board')).toHaveAttribute('data-dice-rolling', 'false');
        await expect(autoToggle).toHaveAttribute('aria-pressed', 'false');
        await page.getByTestId('point-triangle-1').click();
        await expect(reportModal).toBeVisible();

        // Ouvre le modal complet Bilan & Courbe PR
        await page.getByTestId('open-game-review-btn').click();
        const reviewModal = page.getByTestId('game-review-modal');
        await expect(reviewModal).toBeVisible();
        await expect(page.getByTestId('review-pr-value')).toBeVisible();

        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'qa_scen4_game_review_modal.png'),
        });

        // Navigation entre les onglets du GameReviewModal
        await page.getByTestId('tab-step-by-step').click();
        await page.getByTestId('tab-concepts').click();
        await page.getByTestId('tab-table').click();
        await page.getByTestId('tab-course').click();
        await page.getByTestId('tab-overview').click();

        // Ferme le modal de revue
        await page.getByTestId('close-review-modal-btn').click();
        await expect(reviewModal).toBeHidden();

        // Zéro erreur console ou exception runtime tolérée
        expect(consoleErrors).toEqual([]);
        expect(pageErrors).toEqual([]);
    });
});
