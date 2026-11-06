/**
 * @file src/features/multiplayer/__tests__/pvp_cube_crawford_and_scoring.test.tsx
 * @description Tests PvP : cycle videau, règle de Crawford, multiplicateurs & garde Invité (< 300 lignes).
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { canPlayerOfferDouble, computeNextCubeValue } from '../../../engine/cubeRules';
import { handleCubeAction } from '../../../hooks/reducers/cubeActions';
import { handleMatchAction } from '../../../hooks/reducers/matchActions';
import { evaluateWin } from '../../../engine/aiHeuristics';
import type { BackgammonGameState } from '../../../hooks/gameStateReducer';
import MultiplayerResultModal from '../../../components/multiplayer/MultiplayerResultModal';
import type { PlayerEloProfile, MultiplayerMatchInfo, EloCalculationResult } from '../types';

function createMockState(overrides?: Partial<BackgammonGameState>): BackgammonGameState {
    return {
        boardState: {
            board: Array(26).fill(0),
            turn: 'X',
            dice: null,
            cubeValue: 1,
            cubeOwner: null,
            scoreX: 0,
            scoreO: 0,
            crawford: false,
            matchLength: 5,
            doubled: false,
            resigned: 0,
            ...(overrides?.boardState ?? {}),
        },
        phase: 'WAITING_FOR_ROLL',
        usedDice: [false, false],
        selected: null,
        doublingOfferedBy: null,
        gameResult: null,
        crawfordAlreadyPlayed: false,
        matchLength: 5,
        difficulty: 'intermediate',
        lastOpponentDice: null,
        lastOpponentMoves: null,
        opponentHighlight: null,
        opponentStatusMessage: null,
        moveHistory: [],
        matchLog: [],
        autoOpponent: false,
        ...overrides,
    };
}

describe('PvP Doubling Cube, Crawford Rule & Scoring Multipliers', () => {
    describe('1. Doubling Eligibility (canPlayerOfferDouble)', () => {
        it('autorise le double au début du tour avant le lancer quand le videau est centré', () => {
            expect(canPlayerOfferDouble({
                turn: 'X', cubeValue: 1, cubeOwner: null, hasRolledDice: false,
                isCrawford: false, scoreX: 1, scoreO: 1, matchLength: 5, board: Array(26).fill(0),
            })).toBe(true);
        });

        it('interdit le double si les dés ont déjà été lancés', () => {
            expect(canPlayerOfferDouble({
                turn: 'X', cubeValue: 1, cubeOwner: null, hasRolledDice: true,
                isCrawford: false, scoreX: 1, scoreO: 1, matchLength: 5,
            })).toBe(false);
        });

        it('interdit le double si le videau appartient à l\'adversaire', () => {
            expect(canPlayerOfferDouble({
                turn: 'X', cubeValue: 2, cubeOwner: 'O', hasRolledDice: false,
                isCrawford: false, scoreX: 1, scoreO: 1, matchLength: 5,
            })).toBe(false);
        });

        it('autorise le double si le joueur au trait possède déjà le videau', () => {
            expect(canPlayerOfferDouble({
                turn: 'X', cubeValue: 2, cubeOwner: 'X', hasRolledDice: false,
                isCrawford: false, scoreX: 0, scoreO: 0, matchLength: 5,
            })).toBe(true);
        });

        it('interdit le double lors d\'une manche Crawford', () => {
            expect(canPlayerOfferDouble({
                turn: 'X', cubeValue: 1, cubeOwner: null, hasRolledDice: false,
                isCrawford: true, scoreX: 4, scoreO: 2, matchLength: 5,
            })).toBe(false);
        });

        it('interdit le double en Double Match Point (DMP)', () => {
            expect(canPlayerOfferDouble({
                turn: 'X', cubeValue: 1, cubeOwner: null, hasRolledDice: false,
                isCrawford: false, scoreX: 4, scoreO: 4, matchLength: 5,
            })).toBe(false);
        });

        it('applique la règle du Dead Cube (le joueur mène et a déjà assez pour clore le match)', () => {
            expect(canPlayerOfferDouble({
                turn: 'X', cubeValue: 2, cubeOwner: 'X', hasRolledDice: false,
                isCrawford: false, scoreX: 3, scoreO: 1, matchLength: 5,
            })).toBe(false); // 3 + 2 = 5 >= 5
        });
    });

    describe('2. Doubling Cycle: OFFER_DOUBLE -> TAKE_DOUBLE', () => {
        it('traite OFFER_DOUBLE par Joueur X et bascule la phase vers DOUBLING_OFFERED', () => {
            const s0 = createMockState();
            const s1 = handleCubeAction(s0, { type: 'OFFER_DOUBLE' });

            expect(s1.phase).toBe('DOUBLING_OFFERED');
            expect(s1.doublingOfferedBy).toBe('X');
            expect(computeNextCubeValue(s1.boardState.cubeValue)).toBe(2);
        });

        it('traite TAKE_DOUBLE par Joueur O : le videau passe à 2, appartient à O, et X peut lancer', () => {
            const s0 = createMockState();
            const s1 = handleCubeAction(s0, { type: 'OFFER_DOUBLE' });
            const s2 = handleCubeAction(s1, { type: 'TAKE_DOUBLE' });

            expect(s2.phase).toBe('WAITING_FOR_ROLL');
            expect(s2.doublingOfferedBy).toBeNull();
            expect(s2.boardState.cubeValue).toBe(2);
            expect(s2.boardState.cubeOwner).toBe('O');
            expect(s2.boardState.turn).toBe('X');
        });
    });

    describe('3. Doubling Cycle: OFFER_DOUBLE -> PASS_DOUBLE', () => {
        it('traite PASS_DOUBLE : termine la manche immédiatement et attribue le videau au vainqueur', () => {
            const s0 = createMockState({
                boardState: {
                    board: Array(26).fill(0), turn: 'X', dice: null, cubeValue: 1,
                    cubeOwner: null, scoreX: 1, scoreO: 2, crawford: false, matchLength: 5,
                    doubled: false, resigned: 0,
                },
            });
            const s1 = handleCubeAction(s0, { type: 'OFFER_DOUBLE' });
            const s2 = handleCubeAction(s1, { type: 'PASS_DOUBLE' });

            expect(s2.phase).toBe('GAME_OVER');
            expect(s2.gameResult).not.toBeNull();
            expect(s2.gameResult?.winner).toBe('X');
            expect(s2.gameResult?.loser).toBe('O');
            expect(s2.gameResult?.winType).toBe('pass');
            expect(s2.gameResult?.pointsWon).toBe(1);
            expect(s2.boardState.scoreX).toBe(2);
            expect(s2.boardState.scoreO).toBe(2);
        });
    });

    describe('4. Crawford Rule Activation in Match Play', () => {
        it('active Crawford dès qu\'un joueur atteint matchLength - 1', () => {
            const sOver = createMockState({
                boardState: {
                    board: Array(26).fill(0), turn: 'X', dice: null, cubeValue: 1,
                    cubeOwner: null, scoreX: 4, scoreO: 2, crawford: false, matchLength: 5,
                    doubled: false, resigned: 0,
                },
                phase: 'GAME_OVER',
                crawfordAlreadyPlayed: false,
            });
            const nextGame = handleMatchAction(sOver, { type: 'START_NEW_GAME' });

            expect(nextGame.boardState.crawford).toBe(true);
            expect(nextGame.crawfordAlreadyPlayed).toBe(true);

            expect(canPlayerOfferDouble({
                turn: 'X', cubeValue: 1, cubeOwner: null, hasRolledDice: false,
                isCrawford: nextGame.boardState.crawford, scoreX: 4, scoreO: 2, matchLength: 5,
            })).toBe(false);
        });

        it('désactive Crawford pour les manches suivantes (post-Crawford)', () => {
            const sPost = createMockState({
                boardState: {
                    board: Array(26).fill(0), turn: 'X', dice: null, cubeValue: 1,
                    cubeOwner: null, scoreX: 4, scoreO: 3, crawford: false, matchLength: 5,
                    doubled: false, resigned: 0,
                },
                phase: 'GAME_OVER',
                crawfordAlreadyPlayed: true,
            });
            const nextGame = handleMatchAction(sPost, { type: 'START_NEW_GAME' });

            expect(nextGame.boardState.crawford).toBe(false);
            expect(nextGame.crawfordAlreadyPlayed).toBe(true);
        });
    });

    describe('5. Scoring Multipliers (Single, Gammon, Backgammon)', () => {
        it('calcule une victoire simple (1x) si le perdant a sorti au moins 1 pion', () => {
            const board = Array(26).fill(0);
            board[1] = 0;
            board[20] = -14; // O a sorti 1 pion

            const res = evaluateWin(board, 2);
            expect(res?.winner).toBe('X');
            expect(res?.winType).toBe('single');
            expect(res?.multiplier).toBe(1);
            expect(res?.pointsWon).toBe(2); // 1x * cube(2) = 2
        });

        it('calcule un Gammon (2x) si le perdant n\'a sorti aucun pion', () => {
            const board = Array(26).fill(0);
            board[18] = -5;
            board[19] = -10;

            const res = evaluateWin(board, 1);
            expect(res?.winner).toBe('X');
            expect(res?.winType).toBe('gammon');
            expect(res?.multiplier).toBe(2);
            expect(res?.pointsWon).toBe(2); // 2x * cube(1) = 2
        });

        it('calcule un Backgammon (3x) si le perdant est dans le jan intérieur adverse', () => {
            const board = Array(26).fill(0);
            board[5] = -1; // dans le jan intérieur de X (1..6)
            board[20] = -14;

            const res = evaluateWin(board, 2);
            expect(res?.winner).toBe('X');
            expect(res?.winType).toBe('backgammon');
            expect(res?.multiplier).toBe(3);
            expect(res?.pointsWon).toBe(6); // 3x * cube(2) = 6
        });
    });

    describe('6. Post-Match Guest Guard on MultiplayerResultModal', () => {
        const guestProfile: PlayerEloProfile = {
            id: 'guest-1', username: 'guest_1', displayName: 'Joueur Invité', rating: 1500, isGuest: true,
        };
        const authProfile: PlayerEloProfile = {
            id: 'auth-user', username: 'capitaine', displayName: 'Capitaine', rating: 1500, isGuest: false,
        };
        const baseOpponentProfile: PlayerEloProfile = {
            id: 'opp-1', username: 'kosta', displayName: 'Kosta_Ath', rating: 1650, isGuest: false,
        };
        const baseMatchInfo: MultiplayerMatchInfo = {
            roomId: 'BG-TEST-ROOM',
            playerX: authProfile,
            playerO: baseOpponentProfile,
            startedAt: new Date().toISOString(),
            localRole: 'X',
            matchLength: 5,
        };
        const baseEloResult: EloCalculationResult = {
            playerXNewRating: 1515,
            playerONewRating: 1635,
            deltaX: 15,
            deltaO: -15,
            expectedScoreX: 0.4,
            expectedScoreO: 0.6,
        };

        it('masque les gains Elo / PR pour un Joueur Invité et affiche le badge PR Verrouillé', () => {
            const html = renderToStaticMarkup(
                <MultiplayerResultModal
                    isOpen={true}
                    matchInfo={baseMatchInfo}
                    localProfile={guestProfile}
                    opponentProfile={baseOpponentProfile}
                    eloResult={baseEloResult}
                    onRematch={vi.fn()}
                    onClose={vi.fn()}
                />
            );

            expect(html).toContain('PR Verrouillé');
            expect(html).toContain('Les sessions Invité sont réservées à la découverte');
            expect(html).not.toContain('Évolution Classement Elo');
            expect(html).toContain('multiplayer-result-guest-activate-pr-btn');
        });

        it('affiche l\'évolution Elo pour un joueur authentifié', () => {
            const html = renderToStaticMarkup(
                <MultiplayerResultModal
                    isOpen={true}
                    matchInfo={baseMatchInfo}
                    localProfile={authProfile}
                    opponentProfile={baseOpponentProfile}
                    eloResult={baseEloResult}
                    onRematch={vi.fn()}
                    onClose={vi.fn()}
                />
            );

            expect(html).toContain('Évolution Classement Elo');
            expect(html).not.toContain('PR Verrouillé');
            expect(html).toContain('+15 Elo');
        });
    });
});
