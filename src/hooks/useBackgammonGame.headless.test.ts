// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
    useBackgammonGame,
    evaluateWin,
    GameResult,
} from './useBackgammonGame';
import { borneOffCount, X_BAR, O_BAR } from '../engine/backgammonEngine';

describe('useBackgammonGame - Headless Full Game Loop & End-of-Game Flow', () => {
    it('joue une partie complète (Player X + IA O) de bout en bout jusqu’à GAME_OVER sans blocage', () => {
        const gameOverResults: GameResult[] = [];

        // Position de fin de partie (bear-off) : 4 pions chacun dans leur jan intérieur
        // X sort de 1..6 vers 0 ; O sort de 19..24 vers 25
        const initialBearOffBoard = new Array<number>(26).fill(0);
        initialBearOffBoard[1] = 2;
        initialBearOffBoard[2] = 2; // 4 pions X restants (11 déjà sortis)
        initialBearOffBoard[23] = -2;
        initialBearOffBoard[24] = -2; // 4 pions O restants (11 déjà sortis)

        const { result } = renderHook(() =>
            useBackgammonGame({
                matchLength: 5,
                autoOpponent: true,
                opponentDelayMs: 0, // Mode immédiat headless
                initialDifficulty: 'expert',
                onGameOver: (res) => {
                    gameOverResults.push(res);
                },
            }),
        );

        // Applique l'état de course finale
        act(() => {
            result.current.applyRemoteState({
                board: initialBearOffBoard,
                phase: 'WAITING_FOR_ROLL',
                turn: 'X',
                dice: null,
                usedDice: [false, false],
            });
        });

        expect(borneOffCount(result.current.state.board, 'X')).toBe(11);
        expect(borneOffCount(result.current.state.board, 'O')).toBe(11);

        let turnSafetyGuard = 0;
        const maxTurns = 50;

        // Boucle de jeu headless
        while (result.current.phase !== 'GAME_OVER' && turnSafetyGuard < maxTurns) {
            turnSafetyGuard++;

            if (result.current.phase === 'WAITING_FOR_ROLL' && result.current.state.turn === 'X') {
                act(() => {
                    result.current.rollDice();
                });
            }

            // Exécution des coups du joueur humain X tant qu'il reste des coups
            let moveGuard = 0;
            while (result.current.phase === 'PLAYING_MOVES' && moveGuard < 8) {
                moveGuard++;
                const leftTargets = result.current.leftDieTargets;
                const rightTargets = result.current.rightDieTargets;

                let moveApplied = false;

                // Tente d'utiliser le dé gauche (0)
                for (const [from, dests] of leftTargets.entries()) {
                    if (dests.length > 0) {
                        act(() => {
                            result.current.selectChecker(from, 0);
                            result.current.moveChecker(dests[0]);
                        });
                        moveApplied = true;
                        break;
                    }
                }

                // Sinon tente d'utiliser le dé droit (1)
                if (!moveApplied) {
                    for (const [from, dests] of rightTargets.entries()) {
                        if (dests.length > 0) {
                            act(() => {
                                result.current.selectChecker(from, 1);
                                result.current.moveChecker(dests[0]);
                            });
                            moveApplied = true;
                            break;
                        }
                    }
                }

                if (!moveApplied) {
                    break;
                }
            }
        }

        // 1. La partie doit avoir atteint GAME_OVER
        expect(turnSafetyGuard).toBeLessThan(maxTurns);
        expect(result.current.phase).toBe('GAME_OVER');
        expect(result.current.gameResult).not.toBeNull();

        const winResult = result.current.gameResult!;
        expect(['X', 'O']).toContain(winResult.winner);
        expect(['X', 'O']).toContain(winResult.loser);
        expect(winResult.winner).not.toBe(winResult.loser);
        expect(winResult.pointsWon).toBeGreaterThanOrEqual(1);

        // 2. Le callback onGameOver a été invoqué exactement une fois avec le bon résultat
        expect(gameOverResults).toHaveLength(1);
        expect(gameOverResults[0]).toEqual(winResult);

        // 3. Le score du match a été mis à jour correctement
        if (winResult.winner === 'X') {
            expect(result.current.state.scoreX).toBe(winResult.pointsWon);
            expect(result.current.state.scoreO).toBe(0);
        } else {
            expect(result.current.state.scoreO).toBe(winResult.pointsWon);
            expect(result.current.state.scoreX).toBe(0);
        }
    });

    it('gère correctement le flux de Crawford : détection, gel du videau puis transition post-Crawford', () => {
        const { result } = renderHook(() =>
            useBackgammonGame({
                matchLength: 5,
                autoOpponent: false,
                initialScoreX: 3,
                initialScoreO: 0,
            }),
        );

        // Score 3-0 en 5 pts : pas encore Crawford
        expect(result.current.isCrawfordNext).toBe(false);
        expect(result.current.state.crawford).toBe(false);
        expect(result.current.canDouble).toBe(true);

        // X gagne 1 point supplémentaire -> score 4-0 (1 pt du match)
        act(() => {
            // Plateau où X a tout sorti et O a sorti 1 pion (victoire simple = 1 pt)
            const winBoard = new Array<number>(26).fill(0);
            winBoard[20] = -14;
            result.current.applyRemoteState({
                board: winBoard,
            });
        });

        expect(result.current.state.scoreX).toBe(4);
        expect(result.current.state.scoreO).toBe(0);
        expect(result.current.isMatchOver).toBe(false);

        // Crawford doit être annoncé pour la prochaine manche
        expect(result.current.isCrawfordNext).toBe(true);

        // Lancement de la manche suivante via startNewGame
        act(() => {
            result.current.startNewGame();
        });

        // 1. La nouvelle manche est sous la règle de Crawford
        expect(result.current.state.scoreX).toBe(4);
        expect(result.current.state.scoreO).toBe(0);
        expect(result.current.state.crawford).toBe(true);
        expect(result.current.crawfordAlreadyPlayed).toBe(true);
        expect(result.current.canDouble).toBe(false); // Le videau est strictement interdit
        expect(result.current.phase).toBe('WAITING_FOR_ROLL');

        // Tentative de doubler : doit être rejetée pendant Crawford
        act(() => {
            result.current.offerDouble();
        });
        expect(result.current.phase).toBe('WAITING_FOR_ROLL');
        expect(result.current.doublingOfferedBy).toBeNull();

        // O remporte la manche de Crawford avec 1 point -> score 4-1
        act(() => {
            const winBoardO = new Array<number>(26).fill(0);
            winBoardO[1] = 14; // O a tout sorti, X a sorti 1 pion
            result.current.applyRemoteState({
                board: winBoardO,
            });
        });

        expect(result.current.state.scoreX).toBe(4);
        expect(result.current.state.scoreO).toBe(1);
        expect(result.current.isMatchOver).toBe(false);

        // Crawford a déjà été joué : isCrawfordNext doit être false pour la suite (Post-Crawford)
        expect(result.current.isCrawfordNext).toBe(false);

        // Lancement de la manche suivante (Post-Crawford)
        act(() => {
            result.current.startNewGame();
        });

        // 2. Post-Crawford : le videau est de nouveau utilisable
        expect(result.current.state.crawford).toBe(false);
        expect(result.current.canDouble).toBe(true);
        expect(result.current.state.scoreX).toBe(4);
        expect(result.current.state.scoreO).toBe(1);
    });

    it('resetMatch réinitialise intégralement le match, les scores et l’historique Crawford', () => {
        const { result } = renderHook(() =>
            useBackgammonGame({
                matchLength: 5,
                initialScoreX: 4,
                initialScoreO: 2,
            }),
        );

        expect(result.current.state.scoreX).toBe(4);
        expect(result.current.state.scoreO).toBe(2);

        act(() => {
            result.current.resetMatch();
        });

        expect(result.current.state.scoreX).toBe(0);
        expect(result.current.state.scoreO).toBe(0);
        expect(result.current.state.crawford).toBe(false);
        expect(result.current.crawfordAlreadyPlayed).toBe(false);
        expect(result.current.isCrawfordNext).toBe(false);
        expect(result.current.isMatchOver).toBe(false);
        expect(result.current.matchWinner).toBeNull();
        expect(result.current.gameResult).toBeNull();
        expect(result.current.lastOpponentDice).toBeNull();
        expect(result.current.lastOpponentMoves).toBeNull();
        expect(result.current.opponentHighlight).toBeNull();
        expect(result.current.opponentStatusMessage).toBeNull();
        expect(result.current.phase).toBe('WAITING_FOR_ROLL');
    });

    it('startNewGame annule tous les timers résiduels de l’IA et empêche la corruption de la nouvelle manche', () => {
        vi.useFakeTimers();

        try {
            const { result } = renderHook(() =>
                useBackgammonGame({
                    matchLength: 7,
                    initialTurn: 'O',
                    autoOpponent: true,
                    opponentDelayMs: 600,
                    stepDelayMs: 500,
                    forcedOpponentDice: [2, 1],
                }),
            );

            expect(result.current.state.turn).toBe('O');
            expect(result.current.phase).toBe('OPPONENT_THINKING');

            // Avance juste au milieu du tour de l'IA (après opponentDelayMs mais avant tFinish)
            act(() => {
                vi.advanceTimersByTime(650);
            });

            // Une action startNewGame est déclenchée (ex. abandon ou reset)
            act(() => {
                result.current.startNewGame();
            });

            expect(result.current.state.turn).toBe('X');
            expect(result.current.phase).toBe('WAITING_FOR_ROLL');
            expect(result.current.opponentHighlight).toBeNull();
            expect(result.current.opponentStatusMessage).toBeNull();

            // Avance le temps au-delà du tFinish prévu de l'ancien coup IA
            act(() => {
                vi.advanceTimersByTime(3000);
            });

            // La nouvelle partie ne doit PAS avoir été corrompue par l'ancien timer
            expect(result.current.state.turn).toBe('X');
            expect(result.current.phase).toBe('WAITING_FOR_ROLL');
            expect(result.current.opponentHighlight).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });

    it('calcule correctement evaluateWin pour toutes les configurations de videau et de jan', () => {
        const board = new Array<number>(26).fill(0);
        // X a 15 pions sortis
        board[O_BAR] = -1; // O sur la barre
        board[20] = -14;

        // Sans cubeValue spécifié (défaut = 1)
        const resDef = evaluateWin(board);
        expect(resDef?.winType).toBe('backgammon');
        expect(resDef?.multiplier).toBe(3);
        expect(resDef?.pointsWon).toBe(3);

        // Avec cubeValue = 4 -> 3 * 4 = 12 points
        const resCube = evaluateWin(board, 4);
        expect(resCube?.pointsWon).toBe(12);

        // Sécurité si cubeValue passé est 0 ou négatif
        const resZero = evaluateWin(board, 0);
        expect(resZero?.pointsWon).toBe(3);
    });
});
