// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
    useBackgammonGame,
    evaluateWin,
    scoreBoardForOpponent,
    selectBestOpponentSequence,
    createInitialGameState,
    backgammonGameReducer,
    BackgammonGameState,
} from './useBackgammonGame';
import {
    createInitialState,
    generateLegalMoves,
    X_BAR,
    O_BAR,
} from '../engine/backgammonEngine';

describe('useBackgammonGame - Moteur d’évaluation et fin de partie', () => {
    it('détecte une victoire simple (single win, 1x) quand le perdant a sorti au moins 1 pion', () => {
        const board = new Array<number>(26).fill(0);
        // X a sorti ses 15 pions (donc 0 pion sur le plateau)
        // O a 14 pions sur le plateau (donc 1 sorti)
        board[20] = -14;

        const res = evaluateWin(board, 2);
        expect(res).not.toBeNull();
        expect(res?.winner).toBe('X');
        expect(res?.loser).toBe('O');
        expect(res?.winType).toBe('single');
        expect(res?.multiplier).toBe(1);
        expect(res?.pointsWon).toBe(2); // 1 * cubeValue(2)
    });

    it('détecte un Gammon (2x) quand le perdant n’a sorti aucun pion et a quitté le jan adverse', () => {
        const board = new Array<number>(26).fill(0);
        // X a tout sorti
        // O a 15 pions sur le plateau, tous sur les flèches 7 à 24 (aucun dans 1-6, aucun sur la barre)
        board[10] = -5;
        board[12] = -5;
        board[20] = -5;

        const res = evaluateWin(board, 1);
        expect(res).not.toBeNull();
        expect(res?.winner).toBe('X');
        expect(res?.winType).toBe('gammon');
        expect(res?.multiplier).toBe(2);
        expect(res?.pointsWon).toBe(2); // 2 * cubeValue(1)
    });

    it('détecte un Backgammon (3x) quand le perdant a encore un pion sur la barre', () => {
        const board = new Array<number>(26).fill(0);
        // X a tout sorti
        board[O_BAR] = -1; // O sur la barre
        board[20] = -14;

        const res = evaluateWin(board, 1);
        expect(res).not.toBeNull();
        expect(res?.winner).toBe('X');
        expect(res?.winType).toBe('backgammon');
        expect(res?.multiplier).toBe(3);
        expect(res?.pointsWon).toBe(3); // 3 * cubeValue(1)
    });

    it('détecte un Backgammon (3x) quand le perdant a encore un pion dans le jan intérieur adverse (1..6)', () => {
        const board = new Array<number>(26).fill(0);
        // X a tout sorti
        board[3] = -1; // O sur la flèche 3 (jan intérieur de X)
        board[20] = -14;

        const res = evaluateWin(board, 4);
        expect(res).not.toBeNull();
        expect(res?.winner).toBe('X');
        expect(res?.winType).toBe('backgammon');
        expect(res?.multiplier).toBe(3);
        expect(res?.pointsWon).toBe(12); // 3 * cubeValue(4)
    });

    it('détecte un Gammon et Backgammon pour le joueur O', () => {
        const boardGammon = new Array<number>(26).fill(0);
        // O a tout sorti (15 sortis)
        // X a 15 pions sur les flèches 1 à 18 (aucun dans 19-24, aucun sur la barre)
        boardGammon[5] = 10;
        boardGammon[8] = 5;

        const resGammon = evaluateWin(boardGammon, 2);
        expect(resGammon?.winner).toBe('O');
        expect(resGammon?.winType).toBe('gammon');
        expect(resGammon?.pointsWon).toBe(4);

        // Backgammon pour O : X est sur la barre ou dans 19-24
        const boardBackgammon = new Array<number>(26).fill(0);
        boardBackgammon[X_BAR] = 1;
        boardBackgammon[5] = 14;

        const resBG = evaluateWin(boardBackgammon, 1);
        expect(resBG?.winner).toBe('O');
        expect(resBG?.winType).toBe('backgammon');
        expect(resBG?.pointsWon).toBe(3);
    });

    it('renvoie null si la partie n’est pas terminée', () => {
        const initial = createInitialState(7).board;
        expect(evaluateWin(initial, 1)).toBeNull();
    });
});

describe('useBackgammonGame - Heuristique IA et coup adverse', () => {
    it('selectBestOpponentSequence choisit une séquence gagnante si disponible', () => {
        const state = createInitialState(7);
        state.turn = 'O';
        // X a encore des pions sur le plateau (n'a pas gagné)
        const board = new Array<number>(26).fill(0);
        board[1] = 5;
        board[2] = 5;
        board[3] = 5; // 15 pions X
        // 2 pions O sur la flèche 23, les 13 autres sont déjà sortis
        board[23] = -2;
        state.board = board;

        const legalSeqs = generateLegalMoves(state, [2, 2]);
        expect(legalSeqs.length).toBeGreaterThan(0);

        const best = selectBestOpponentSequence(legalSeqs, 'O');
        expect(best).not.toBeNull();
        // Le meilleur coup doit sortir les 2 pions (victoire de O)
        expect(evaluateWin(best!.board, 1)?.winner).toBe('O');
    });

    it('scoreBoardForOpponent valorise le fait de frapper un blot adverse', () => {
        const boardWithoutHit = new Array<number>(26).fill(0);
        boardWithoutHit[20] = -2;

        const boardWithHit = new Array<number>(26).fill(0);
        boardWithHit[20] = -2;
        boardWithHit[X_BAR] = 1; // Un pion X frappé sur la barre

        expect(scoreBoardForOpponent(boardWithHit, 'O')).toBeGreaterThan(
            scoreBoardForOpponent(boardWithoutHit, 'O'),
        );
    });
});

describe('useBackgammonGame - Machine à états (Reducer)', () => {
    it('initialise correctement l’état de jeu', () => {
        const s = createInitialGameState(7, 2, 1, 'X');
        expect(s.phase).toBe('WAITING_FOR_ROLL');
        expect(s.boardState.turn).toBe('X');
        expect(s.boardState.scoreX).toBe(2);
        expect(s.boardState.scoreO).toBe(1);
        expect(s.boardState.cubeValue).toBe(1);
        expect(s.boardState.cubeOwner).toBeNull();
        expect(s.boardState.crawford).toBe(false);
    });

    it('ROLL_DICE configure les dés et passe en phase PLAYING_MOVES', () => {
        const initial = createInitialGameState(7);
        const s = backgammonGameReducer(initial, { type: 'ROLL_DICE', dice: [4, 2] });

        expect(s.phase).toBe('PLAYING_MOVES');
        expect(s.boardState.dice).toEqual([4, 2]);
        expect(s.usedDice).toEqual([false, false]);
        expect(s.selected).toBeNull();
    });

    it('gère la règle du max-de-dés : refuse un coup vers une destination illégale', () => {
        const initial = createInitialGameState(7);
        const rolled = backgammonGameReducer(initial, { type: 'ROLL_DICE', dice: [4, 2] });

        // Sélectionne le pion en 24 avec le dé 0 (4)
        const selected = backgammonGameReducer(rolled, { type: 'SELECT_CHECKER', point: 24, die: 0 });
        expect(selected.selected).toEqual({ point: 24, die: 0 });

        // Tente un déplacement illégal (ex. vers 15 alors que 24 - 4 = 20)
        const invalidMove = backgammonGameReducer(selected, { type: 'MOVE_CHECKER', destination: 15 });
        expect(invalidMove.boardState.board).toEqual(selected.boardState.board);
        expect(invalidMove.usedDice[0]).toBe(false);

        // Déplacement légal vers 20
        const validMove = backgammonGameReducer(selected, { type: 'MOVE_CHECKER', destination: 20 });
        expect(validMove.boardState.board[24]).toBe(1); // 2 - 1 = 1
        expect(validMove.boardState.board[20]).toBe(1); // Pion atterri en 20
        expect(validMove.usedDice[0]).toBe(true);
    });

    it('change de tour après avoir consommé tous les dés du joueur', () => {
        const initial = createInitialGameState(7, 0, 0, 'X', false);
        const rolled = backgammonGameReducer(initial, { type: 'ROLL_DICE', dice: [4, 2] });

        // Coup 1 : 24 vers 20 (dé gauche = 4)
        const s1 = backgammonGameReducer(rolled, { type: 'SELECT_CHECKER', point: 24, die: 0 });
        const s2 = backgammonGameReducer(s1, { type: 'MOVE_CHECKER', destination: 20 });
        expect(s2.usedDice[0]).toBe(true);
        expect(s2.boardState.turn).toBe('X'); // Tour pas encore fini

        // Coup 2 : 13 vers 11 (dé droit = 2)
        const s3 = backgammonGameReducer(s2, { type: 'SELECT_CHECKER', point: 13, die: 1 });
        const s4 = backgammonGameReducer(s3, { type: 'MOVE_CHECKER', destination: 11 });

        // Les deux dés sont joués : le tour passe à O
        expect(s4.boardState.turn).toBe('O');
        expect(s4.boardState.dice).toBeNull();
        expect(s4.phase).toBe('WAITING_FOR_ROLL');
    });

    it('gère les actions de videau : OFFER_DOUBLE, TAKE_DOUBLE', () => {
        const s0 = createInitialGameState(7);
        expect(s0.phase).toBe('WAITING_FOR_ROLL');

        // X propose de doubler
        const s1 = backgammonGameReducer(s0, { type: 'OFFER_DOUBLE' });
        expect(s1.phase).toBe('DOUBLING_OFFERED');
        expect(s1.doublingOfferedBy).toBe('X');

        // O accepte (TAKE)
        const s2 = backgammonGameReducer(s1, { type: 'TAKE_DOUBLE' });
        expect(s2.phase).toBe('WAITING_FOR_ROLL');
        expect(s2.boardState.cubeValue).toBe(2);
        expect(s2.boardState.cubeOwner).toBe('O'); // Le videau appartient désormais à O
        expect(s2.doublingOfferedBy).toBeNull();
    });

    it('gère l’abandon de videau (PASS_DOUBLE) avec victoire immédiate', () => {
        const s0 = createInitialGameState(7, 2, 1);
        const s1 = backgammonGameReducer(s0, { type: 'OFFER_DOUBLE' });

        // O refuse (PASS)
        const s2 = backgammonGameReducer(s1, { type: 'PASS_DOUBLE' });
        expect(s2.phase).toBe('GAME_OVER');
        expect(s2.gameResult).not.toBeNull();
        expect(s2.gameResult?.winner).toBe('X');
        expect(s2.gameResult?.loser).toBe('O');
        expect(s2.gameResult?.winType).toBe('pass');
        expect(s2.gameResult?.pointsWon).toBe(1); // Valeur du videau avant le double
        expect(s2.boardState.scoreX).toBe(3); // 2 + 1 = 3
    });

    it('applique la règle de Crawford : interdiction de doubler pendant la manche Crawford', () => {
        const sCrawford = createInitialGameState(7);
        sCrawford.boardState.crawford = true;

        // Tenter de doubler sous Crawford doit être rejeté
        const sNext = backgammonGameReducer(sCrawford, { type: 'OFFER_DOUBLE' });
        expect(sNext.phase).toBe('WAITING_FOR_ROLL'); // Pas passé en DOUBLING_OFFERED
        expect(sNext.doublingOfferedBy).toBeNull();
    });

    it('active automatiquement la manche de Crawford quand un joueur atteint matchLength - 1', () => {
        // Match en 5 points, X gagne 2 points pour atteindre 4 (5 - 1 = 4)
        const s0 = createInitialGameState(5, 2, 1);
        s0.phase = 'GAME_OVER';
        s0.boardState.scoreX = 4; // Seuil Crawford atteint

        const s1 = backgammonGameReducer(s0, { type: 'START_NEW_GAME' });
        expect(s1.boardState.crawford).toBe(true);
        expect(s1.crawfordAlreadyPlayed).toBe(true);

        // Manche suivante (post-Crawford) : crawford redevient false
        s1.phase = 'GAME_OVER';
        const s2 = backgammonGameReducer(s1, { type: 'START_NEW_GAME' });
        expect(s2.boardState.crawford).toBe(false);
    });

    it('PLAY_OPPONENT applique le coup automatique de l’adversaire et rend la main à X', () => {
        const s0 = createInitialGameState(7, 0, 0, 'O');
        const s1 = backgammonGameReducer(s0, { type: 'PLAY_OPPONENT', dice: [3, 1] });

        // O a joué son coup et redonné la main à X
        expect(s1.boardState.turn).toBe('X');
        expect(s1.boardState.dice).toBeNull();
        expect(s1.phase).toBe('WAITING_FOR_ROLL');
        // Le plateau doit avoir été modifié par le coup d'ouverture de O
        expect(s1.boardState.board).not.toEqual(s0.boardState.board);
    });

    it('SET_DIFFICULTY met à jour le niveau d’adversaire (débutant, expert, grandmaster)', () => {
        const s0 = createInitialGameState(7, 0, 0, 'X', true, 'grandmaster');
        expect(s0.difficulty).toBe('grandmaster');

        const sBeginner = backgammonGameReducer(s0, { type: 'SET_DIFFICULTY', difficulty: 'beginner' });
        expect(sBeginner.difficulty).toBe('beginner');

        const sExpert = backgammonGameReducer(sBeginner, { type: 'SET_DIFFICULTY', difficulty: 'expert' });
        expect(sExpert.difficulty).toBe('expert');
    });

    it('selectBestOpponentSequence supporte débutant (bruité), expert (2-ply) et grandmaster', () => {
        const state = createInitialState(7);
        state.turn = 'O';
        const legalSeqs = generateLegalMoves(state, [3, 1]);
        expect(legalSeqs.length).toBeGreaterThan(0);

        // grandmaster
        const moveGM = selectBestOpponentSequence(legalSeqs, 'O', 'grandmaster');
        expect(moveGM).not.toBeNull();

        // 2-ply expert expectimax déterministe
        const move2Ply = selectBestOpponentSequence(legalSeqs, 'O', 'expert');
        expect(move2Ply).not.toBeNull();

        // 0-ply débutant bruité avec fonction aléatoire contrôlée
        const moveBeginner = selectBestOpponentSequence(legalSeqs, 'O', 'beginner', () => 0.9);
        expect(moveBeginner).not.toBeNull();
    });

    it('gère l’action DESELECT pour réinitialiser le pion sélectionné (tap-to-deselect)', () => {
        const s0 = createInitialGameState(7);
        const sRolled = backgammonGameReducer(s0, { type: 'ROLL_DICE', dice: [4, 2] });
        const sSelected = backgammonGameReducer(sRolled, { type: 'SELECT_CHECKER', point: 24, die: 0 });
        expect(sSelected.selected).toEqual({ point: 24, die: 0 });

        const sDeselected = backgammonGameReducer(sSelected, { type: 'DESELECT' });
        expect(sDeselected.selected).toBeNull();
    });

    it('gère l’action SET_SELECTED_DIE pour basculer le dé actif d’un pion sélectionné', () => {
        const s0 = createInitialGameState(7);
        const sRolled = backgammonGameReducer(s0, { type: 'ROLL_DICE', dice: [4, 2] });
        // Pion 24 peut jouer 4 (vers 20) ou 2 (vers 22)
        const sSelected0 = backgammonGameReducer(sRolled, { type: 'SELECT_CHECKER', point: 24, die: 0 });
        expect(sSelected0.selected).toEqual({ point: 24, die: 0 });

        // Bascule vers le dé 1 (2)
        const sSelected1 = backgammonGameReducer(sSelected0, { type: 'SET_SELECTED_DIE', die: 1 });
        expect(sSelected1.selected).toEqual({ point: 24, die: 1 });
    });

    it('règles officielles du double : permet 4 coups consécutifs au lieu de 2', () => {
        const s0 = createInitialGameState(7, 0, 0, 'X', false);
        // X lance un double 3 (3-3)
        const sRolled = backgammonGameReducer(s0, { type: 'ROLL_DICE', dice: [3, 3] });
        expect(sRolled.usedDice).toEqual([false, false, false, false]);
        expect(sRolled.phase).toBe('PLAYING_MOVES');
        expect(sRolled.boardState.turn).toBe('X');

        // Coup 1 : 24 vers 21
        const s1_sel = backgammonGameReducer(sRolled, { type: 'SELECT_CHECKER', point: 24, die: 0 });
        const s1 = backgammonGameReducer(s1_sel, { type: 'MOVE_CHECKER', destination: 21 });
        expect(s1.usedDice).toEqual([true, false, false, false]);
        expect(s1.boardState.turn).toBe('X');
        expect(s1.phase).toBe('PLAYING_MOVES');

        // Coup 2 : 24 vers 21 (LE DOUBLE DOIT CONTINUER ! Ne s’arrête PAS à 2 coups)
        const s2_sel = backgammonGameReducer(s1, { type: 'SELECT_CHECKER', point: 24, die: 0 });
        const s2 = backgammonGameReducer(s2_sel, { type: 'MOVE_CHECKER', destination: 21 });
        expect(s2.usedDice).toEqual([true, true, false, false]);
        expect(s2.boardState.turn).toBe('X');
        expect(s2.phase).toBe('PLAYING_MOVES');

        // Coup 3 : 13 vers 10
        const s3_sel = backgammonGameReducer(s2, { type: 'SELECT_CHECKER', point: 13, die: 0 });
        const s3 = backgammonGameReducer(s3_sel, { type: 'MOVE_CHECKER', destination: 10 });
        expect(s3.usedDice).toEqual([true, true, true, false]);
        expect(s3.boardState.turn).toBe('X');
        expect(s3.phase).toBe('PLAYING_MOVES');

        // Coup 4 : 13 vers 10 (Dernier coup du double)
        const s4_sel = backgammonGameReducer(s3, { type: 'SELECT_CHECKER', point: 13, die: 0 });
        const s4 = backgammonGameReducer(s4_sel, { type: 'MOVE_CHECKER', destination: 10 });

        // Tour terminé après 4 coups complets : passe au joueur O, usedDice réinitialisé
        expect(s4.boardState.turn).toBe('O');
        expect(s4.boardState.dice).toBeNull();
        expect(s4.phase).toBe('WAITING_FOR_ROLL');
        expect(s4.usedDice).toEqual([false, false]);
    });

    it('gère l’animation séquentielle du tour de l’adversaire (OPPONENT_START_TURN, OPPONENT_APPLY_STEP, OPPONENT_FINISH_TURN)', () => {
        const s0 = createInitialGameState(7, 0, 0, 'O', true);
        s0.phase = 'OPPONENT_THINKING';

        // 1. Début du tour de l'IA avec dés visibles
        const s1 = backgammonGameReducer(s0, {
            type: 'OPPONENT_START_TURN',
            dice: [4, 2],
            statusMessage: 'Noir (IA) a lancé les dés 🎲🎲 [4-2]',
        });
        expect(s1.boardState.dice).toEqual([4, 2]);
        expect(s1.boardState.turn).toBe('O');
        expect(s1.opponentStatusMessage).toBe('Noir (IA) a lancé les dés 🎲🎲 [4-2]');
        expect(s1.usedDice).toEqual([false, false]);

        // 2. Étape 1 : déplacement du pion 1 vers 5 avec surbrillance
        const s2 = backgammonGameReducer(s1, {
            type: 'OPPONENT_APPLY_STEP',
            board: s1.boardState.board,
            move: { from: 1, to: 5 },
            usedDiceIndex: 0,
            statusMessage: 'Coup 1/2 : Noir déplace 1 → 5',
        });
        expect(s2.usedDice[0]).toBe(true);
        expect(s2.opponentHighlight).toEqual([{ from: 1, to: 5 }]);
        expect(s2.opponentStatusMessage).toBe('Coup 1/2 : Noir déplace 1 → 5');

        // 3. Fin du tour de l'IA : passe la main au joueur X et nettoie la surbrillance
        const s3 = backgammonGameReducer(s2, {
            type: 'OPPONENT_FINISH_TURN',
            finalBoard: s2.boardState.board,
            dice: [4, 2],
            moves: [{ from: 1, to: 5 }, { from: 1, to: 3 }],
        });
        expect(s3.boardState.turn).toBe('X');
        expect(s3.boardState.dice).toBeNull();
        expect(s3.phase).toBe('WAITING_FOR_ROLL');
        // L'historique visuel du dernier coup est conservé jusqu'au prochain lancer du joueur
        expect(s3.opponentHighlight).not.toBeNull();
        expect(s3.opponentStatusMessage).toBeNull();
        expect(s3.lastOpponentDice).toEqual([4, 2]);
        expect(s3.lastOpponentMoves).toHaveLength(2);
    });

    it('joue tous les coups de l’IA étape par étape avec fake timers puis rend la main au joueur X', () => {
        vi.useFakeTimers();

        try {
            const { result } = renderHook(() =>
                useBackgammonGame({
                    initialTurn: 'O',
                    autoOpponent: true,
                    opponentDelayMs: 600,
                    initialDifficulty: 'beginner',
                })
            );

            // Immédiatement au montage, l'IA a lancé les dés et est en train de réfléchir
            expect(result.current.state.turn).toBe('O');
            expect(result.current.phase).toBe('OPPONENT_THINKING');
            expect(result.current.dice).not.toBeNull();
            expect(result.current.opponentStatusMessage).toContain('Noir (IA) a lancé');

            // On avance le premier step (600ms)
            act(() => {
                vi.advanceTimersByTime(600);
            });

            // Au moins un coup a été initié et surligné
            expect(result.current.state.turn).toBe('O');
            expect(result.current.phase).toBe('OPPONENT_THINKING');

            // On avance le temps pour couvrir tous les steps séquentiels et la finalisation (max 5000ms)
            act(() => {
                vi.advanceTimersByTime(5000);
            });

            // L'IA doit avoir complété tous ses coups et rendu la main au joueur X
            expect(result.current.state.turn).toBe('X');
            expect(result.current.phase).toBe('WAITING_FOR_ROLL');
            expect(result.current.dice).toBeNull();
            expect(result.current.isHumanTurn).toBe(true);
            expect(result.current.lastOpponentMoves).not.toBeNull();
            expect(result.current.lastOpponentMoves!.length).toBeGreaterThan(0);
            // L'historique visuel du dernier coup est conservé jusqu'au prochain lancer
            expect(result.current.opponentHighlight).not.toBeNull();
            expect(result.current.opponentStatusMessage).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });

    it('anime chaque coup séquentiellement pour un double avec N steps visibles et met à jour le plateau rendu à chaque étape', () => {
        vi.useFakeTimers();

        try {
            const { result } = renderHook(() =>
                useBackgammonGame({
                    initialTurn: 'O',
                    autoOpponent: true,
                    opponentDelayMs: 400,
                    stepDelayMs: 500,
                    forcedOpponentDice: [3, 3],
                    initialDifficulty: 'beginner',
                }),
            );

            // Phase initiale : dés lancés en double [3-3] avec 4 dés disponibles
            expect(result.current.state.turn).toBe('O');
            expect(result.current.phase).toBe('OPPONENT_THINKING');
            expect(result.current.dice).toEqual([3, 3]);
            expect(result.current.usedDice).toEqual([false, false, false, false]);
            expect(result.current.opponentStatusMessage).toContain('double 🎲🎲 [3-3] (4 coups)');

            const boardInitial = [...result.current.state.board];

            // Étape 1 : à t = 400ms (opponentDelayMs), premier pion déplacé
            act(() => {
                vi.advanceTimersByTime(400);
            });
            expect(result.current.usedDice[0]).toBe(true);
            expect(result.current.usedDice[1]).toBe(false);
            expect(result.current.opponentHighlight).not.toBeNull();
            expect(result.current.opponentStatusMessage).toContain('Coup 1/4');
            const boardStep1 = [...result.current.state.board];
            expect(boardStep1).not.toEqual(boardInitial);

            // Étape 2 : à t = 400 + 500ms, deuxième pion déplacé
            act(() => {
                vi.advanceTimersByTime(500);
            });
            expect(result.current.usedDice[0]).toBe(true);
            expect(result.current.usedDice[1]).toBe(true);
            expect(result.current.usedDice[2]).toBe(false);
            expect(result.current.opponentHighlight).not.toBeNull();
            expect(result.current.opponentStatusMessage).toContain('Coup 2/4');
            const boardStep2 = [...result.current.state.board];
            expect(boardStep2).not.toEqual(boardStep1);

            // Étape 3 : à t = 400 + 1000ms, troisième pion déplacé
            act(() => {
                vi.advanceTimersByTime(500);
            });
            expect(result.current.usedDice[2]).toBe(true);
            expect(result.current.usedDice[3]).toBe(false);
            expect(result.current.opponentHighlight).not.toBeNull();
            expect(result.current.opponentStatusMessage).toContain('Coup 3/4');
            const boardStep3 = [...result.current.state.board];
            expect(boardStep3).not.toEqual(boardStep2);

            // Étape 4 : à t = 400 + 1500ms, quatrième pion déplacé (tous dés consommés)
            act(() => {
                vi.advanceTimersByTime(500);
            });
            expect(result.current.usedDice).toEqual([true, true, true, true]);
            expect(result.current.opponentHighlight).not.toBeNull();
            expect(result.current.opponentStatusMessage).toContain('Coup 4/4');
            const boardStep4 = [...result.current.state.board];
            expect(boardStep4).not.toEqual(boardStep3);

            // Étape 5 : Fin de tour et passage au joueur X
            act(() => {
                vi.advanceTimersByTime(1000);
            });
            expect(result.current.state.turn).toBe('X');
            expect(result.current.phase).toBe('WAITING_FOR_ROLL');
            expect(result.current.isHumanTurn).toBe(true);
            expect(result.current.lastOpponentMoves).toHaveLength(4);
            expect(result.current.lastOpponentDice).toEqual([3, 3]);
            // L'historique visuel du dernier coup est conservé jusqu'au prochain lancer
            expect(result.current.opponentHighlight).not.toBeNull();
            expect(result.current.opponentStatusMessage).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });
});


