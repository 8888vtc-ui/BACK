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
        s0.boardState.board[1] = 1; // Partie en cours
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

    it('rejette le double à Double Match Point (DMP : 6-6 dans un match en 7)', () => {
        const sDmp = createInitialGameState(7, 6, 6);
        sDmp.boardState.board[1] = 1;
        const res = backgammonGameReducer(sDmp, { type: 'OFFER_DOUBLE' });
        expect(res.phase).toBe('WAITING_FOR_ROLL');
        expect(res.doublingOfferedBy).toBeNull();
    });

    it('rejette le double sous la règle du Dead Cube pour un joueur à 1-away', () => {
        // X est à 1 point de la victoire (score 6-4 dans un match en 7)
        const sOneAway = createInitialGameState(7, 6, 4);
        sOneAway.boardState.board[1] = 1;
        const res = backgammonGameReducer(sOneAway, { type: 'OFFER_DOUBLE' });
        expect(res.phase).toBe('WAITING_FOR_ROLL');
        expect(res.doublingOfferedBy).toBeNull();
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

    it('selectBestOpponentSequence supporte débutant (bruité), intermédiaire (1-ply), expert (2-ply) et grandmaster', () => {
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

        // 1-ply intermédiaire déterministe
        const moveIntermediate = selectBestOpponentSequence(legalSeqs, 'O', 'intermediate');
        expect(moveIntermediate).not.toBeNull();

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

    it('joue le coup du livre d’ouverture certifié pour O sur [3, 2] (1/4 12/14)', () => {
        const { result } = renderHook(() =>
            useBackgammonGame({
                autoOpponent: false,
                initialDifficulty: 'expert',
            })
        );

        // Déclenche le tour de l'ordinateur en position initiale avec [3, 2]
        act(() => {
            result.current.playOpponentTurn([3, 2]);
        });

        // Les pions déplacés doivent correspondre au livre d'or (split 1/4 et descente 12/14)
        const board = result.current.state.board;
        expect(board[1]).toBe(-1); // 1 pion reste sur 1 (l'autre a été au point 4)
        expect(board[4]).toBe(-1); // 1 pion sur 4
        expect(board[12]).toBe(-4); // 4 pions sur 12 (un a été au point 14)
        expect(board[14]).toBe(-1); // 1 pion constructeur sur 14

        // Vérifie qu'il n'a PAS fait l'erreur 12/14 14/17
        expect(board[17]).toBe(-3); // Le point 17 ne doit pas avoir reçu le pion de 14
    });

    it('affiche les dés et "Bloqué — aucun coup possible" pendant 1200ms en cas de jet bloqué (Fanned) avant de passer la main', () => {
        vi.useFakeTimers();

        try {
            const { result } = renderHook(() =>
                useBackgammonGame({
                    initialTurn: 'X',
                    autoOpponent: true,
                    initialDifficulty: 'beginner',
                }),
            );

            // Plateau où X est sur la barre et les portes 19..24 sont fermées par O
            const blockedBoard = new Array<number>(26).fill(0);
            blockedBoard[X_BAR] = 1;
            blockedBoard[6] = 14;
            for (let p = 19; p <= 24; p++) {
                blockedBoard[p] = -2;
            }
            blockedBoard[12] = -3;

            act(() => {
                result.current.applyRemoteState({
                    board: blockedBoard,
                    turn: 'X',
                    phase: 'WAITING_FOR_ROLL',
                    dice: null,
                    usedDice: [false, false],
                });
            });

            act(() => {
                result.current.rollDice([4, 2]);
            });

            // Immédiatement : les dés [4, 2] restent affichés avec le message de blocage
            expect(result.current.dice).toEqual([4, 2]);
            expect(result.current.state.turn).toBe('X');
            expect(result.current.phase).toBe('PLAYING_MOVES');
            expect(result.current.opponentStatusMessage).toBe('Bloqué — aucun coup possible');

            // À 1100ms (< 1200ms), toujours affiché
            act(() => {
                vi.advanceTimersByTime(1100);
            });
            expect(result.current.dice).toEqual([4, 2]);
            expect(result.current.state.turn).toBe('X');

            // À 1200ms, transition vers OPPONENT_THINKING
            act(() => {
                vi.advanceTimersByTime(100);
            });
            expect(result.current.state.turn).toBe('O');
            expect(result.current.phase).toBe('OPPONENT_THINKING');
        } finally {
            vi.useRealTimers();
        }
    });

    it('maintient HUMAN_READY_TO_COMMIT à la fin du tour humain pour permettre Annuler (Undo) avant l’auto-commit de 250ms quand autoConfirmTurn=true', () => {
        vi.useFakeTimers();

        try {
            const { result } = renderHook(() =>
                useBackgammonGame({
                    initialTurn: 'X',
                    autoOpponent: true,
                    initialDifficulty: 'beginner',
                    autoConfirmTurn: true,
                }),
            );

            expect(result.current.autoConfirmTurn).toBe(true);

            act(() => {
                result.current.rollDice([3, 1]);
            });

            // Joue les deux dés (8/5 et 6/5)
            act(() => {
                result.current.playMove(8, 5, 0);
                result.current.playMove(6, 5, 1);
            });

            // Le joueur est en HUMAN_READY_TO_COMMIT : il peut encore annuler avant les 250ms !
            expect(result.current.state.turn).toBe('X');
            expect(result.current.phase).toBe('PLAYING_MOVES');
            expect(result.current.gamePhase).toBe('HUMAN_READY_TO_COMMIT');
            expect(result.current.canUndo).toBe(true);
            expect(result.current.dice).toEqual([3, 1]);

            // 1. Test de l'annulation avant les 250ms
            act(() => {
                vi.advanceTimersByTime(150);
                result.current.undoMove();
            });

            expect(result.current.state.turn).toBe('X');
            expect(result.current.gamePhase).toBe('HUMAN_MOVING');
            expect(result.current.usedDice).toEqual([true, false]);

            // Même après 1000ms supplémentaires, le timer d'auto-commit annulé ne s'est pas déclenché
            act(() => {
                vi.advanceTimersByTime(1000);
            });
            expect(result.current.state.turn).toBe('X');
            expect(result.current.gamePhase).toBe('HUMAN_MOVING');

            // 2. Rejoue le second dé -> retour en HUMAN_READY_TO_COMMIT puis auto-commit à 250ms
            act(() => {
                result.current.playMove(6, 5, 1);
            });
            expect(result.current.gamePhase).toBe('HUMAN_READY_TO_COMMIT');

            act(() => {
                vi.advanceTimersByTime(250);
            });
            expect(result.current.state.turn).toBe('O');
            expect(result.current.phase).toBe('OPPONENT_THINKING');
            expect(result.current.matchLog).toHaveLength(1);
        } finally {
            vi.useRealTimers();
        }
    });

    it('par défaut (autoConfirmTurn=false), le tour reste indéfiniment en HUMAN_READY_TO_COMMIT, attend le clic sur Valider, et persiste toggleAutoConfirmTurn dans localStorage', () => {
        vi.useFakeTimers();
        window.localStorage.clear();

        try {
            const { result } = renderHook(() =>
                useBackgammonGame({
                    initialTurn: 'X',
                    autoOpponent: true,
                    initialDifficulty: 'beginner',
                }),
            );

            expect(result.current.autoConfirmTurn).toBe(false);

            act(() => {
                result.current.rollDice([3, 1]);
            });

            act(() => {
                result.current.playMove(8, 5, 0);
                result.current.playMove(6, 5, 1);
            });

            // En HUMAN_READY_TO_COMMIT ("En attente de confirmation")
            expect(result.current.gamePhase).toBe('HUMAN_READY_TO_COMMIT');
            expect(result.current.isAwaitingConfirmation).toBe(true);
            expect(result.current.state.turn).toBe('X');
            expect(result.current.matchLog).toHaveLength(0);

            // Même après 5 secondes, AUCUNE auto-validation ni évaluation de tour ne se produit
            act(() => {
                vi.advanceTimersByTime(5000);
            });
            expect(result.current.gamePhase).toBe('HUMAN_READY_TO_COMMIT');
            expect(result.current.state.turn).toBe('X');
            expect(result.current.matchLog).toHaveLength(0);

            // Le joueur valide MANUELLEMENT via le bouton Valider (commitHumanMove)
            act(() => {
                result.current.commitHumanMove();
            });

            expect(result.current.state.turn).toBe('O');
            expect(result.current.phase).toBe('OPPONENT_THINKING');
            expect(result.current.matchLog).toHaveLength(1);

            // Bascule de l'option Validation auto et persistance dans localStorage
            act(() => {
                result.current.toggleAutoConfirmTurn();
            });
            expect(result.current.autoConfirmTurn).toBe(true);
            expect(window.localStorage.getItem('bg_auto_confirm_turn')).toBe('true');
        } finally {
            window.localStorage.clear();
            vi.useRealTimers();
        }
    });

    it('règle officielle d’obligation du plus grand dé : impose le dé le plus élevé en cas de coup mutuellement exclusif et autorise le petit dé en premier uniquement si les deux dés restent jouables', () => {
        // 1. Cas mutuellement exclusif (1 seul dé jouable sur [2, 5]) :
        // X a un seul pion mobile en 24 ; 22 (dé 2) et 19 (dé 5) sont libres, mais 17 (24 - 2 - 5) est bloqué par O (-2)
        // et tous les autres pions X sont bloqués en 6 (avec 4 et 1 bloqués par O).
        const sMutuallyExclusive = createInitialGameState(7, 0, 0, 'X', false);
        const boardEx = new Array<number>(26).fill(0);
        boardEx[24] = 1;
        boardEx[6] = 14;
        boardEx[17] = -2; // Bloque 22 -> 17 et 19 -> 17
        boardEx[4] = -2;  // Bloque 6 -> 4 (dé 2)
        boardEx[1] = -2;  // Bloque 6 -> 1 (dé 5)
        boardEx[12] = -9;
        sMutuallyExclusive.boardState.board = boardEx;

        const sRolledEx = backgammonGameReducer(sMutuallyExclusive, { type: 'ROLL_DICE', dice: [2, 5] });
        // Tenter de jouer le petit dé (2 : 24 -> 22) doit être refusé
        const sAfterIllegalSmall = backgammonGameReducer(sRolledEx, {
            type: 'PLAY_MOVE',
            from: 24,
            to: 22,
        });
        expect(sAfterIllegalSmall.boardState.board[24]).toBe(1);
        expect(sAfterIllegalSmall.usedDice).toEqual([false, false]);

        // Jouer le grand dé (5 : 24 -> 19) est légal et obligatoire
        const sAfterLegalHigh = backgammonGameReducer(sRolledEx, {
            type: 'PLAY_MOVE',
            from: 24,
            to: 19,
        });
        expect(sAfterLegalHigh.boardState.board[19]).toBe(1);

        // 2. Cas où les deux dés sont jouables : le joueur peut glisser-déposer le petit dé en premier (24 -> 22)
        const sBothPlayable = createInitialGameState(7, 0, 0, 'X', false);
        const sRolledBoth = backgammonGameReducer(sBothPlayable, { type: 'ROLL_DICE', dice: [5, 2] });
        const sPlayedSmallFirst = backgammonGameReducer(sRolledBoth, {
            type: 'PLAY_MOVE',
            from: 24,
            to: 22,
        });
        expect(sPlayedSmallFirst.boardState.board[22]).toBe(1);
        expect(sPlayedSmallFirst.usedDice).toEqual([false, true]);
    });

    it('Chantier 3 : maintient opponentHighlight après le tour de l’IA (avec isHit sur frappe) et l’efface sur ROLL_DICE ou OFFER_DOUBLE', () => {
        const s0 = createInitialGameState(7, 0, 0, 'O', true);
        s0.boardState.board[4] = 1; // Blot joueur X sur la flèche 4
        const sAfterBot = backgammonGameReducer(s0, {
            type: 'OPPONENT_FINISH_TURN',
            finalBoard: s0.boardState.board,
            dice: [3, 1],
            moves: [
                { from: 1, to: 4, isHit: true },
                { from: 12, to: 13 },
            ],
        });

        // Les flèches persistent pendant la réflexion du joueur (WAITING_FOR_ROLL)
        expect(sAfterBot.phase).toBe('WAITING_FOR_ROLL');
        expect(sAfterBot.opponentHighlight).toEqual([
            { from: 1, to: 4, isHit: true },
            { from: 12, to: 13 },
        ]);

        // 1. Disparaît immédiatement quand le joueur clique sur Proposer le videau (OFFER_DOUBLE)
        const sAfterDouble = backgammonGameReducer(sAfterBot, { type: 'OFFER_DOUBLE' });
        expect(sAfterDouble.opponentHighlight).toBeNull();

        // 2. Disparaît immédiatement quand le joueur clique sur Lancer les dés (ROLL_DICE)
        const sAfterRoll = backgammonGameReducer(sAfterBot, { type: 'ROLL_DICE', dice: [5, 2] });
        expect(sAfterRoll.opponentHighlight).toBeNull();
    });
});


