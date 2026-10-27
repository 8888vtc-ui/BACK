/**
 * Sous-reducer pour les actions du videau (OFFER_DOUBLE, TAKE_DOUBLE, PASS_DOUBLE).
 * Conforme à SCALABILITY.md (< 120 lignes, 0 any).
 */

import type { BackgammonGameState, GameAction } from '../gameStateReducer';
import type { Player } from '../../engine/backgammonEngine';
import type { GameResult } from '../../engine/aiHeuristics';
import { revealSessionServerSeed, createProvablyFairSession } from '../../lib/crypto/provablyFairRng';

export type CubeAction = Extract<GameAction, { type: 'OFFER_DOUBLE' | 'TAKE_DOUBLE' | 'PASS_DOUBLE' }>;

export function isCubeAction(action: GameAction): action is CubeAction {
    return action.type === 'OFFER_DOUBLE' || action.type === 'TAKE_DOUBLE' || action.type === 'PASS_DOUBLE';
}

export function handleCubeAction(
    state: BackgammonGameState,
    action: CubeAction,
): BackgammonGameState {
    const currentPf = state.provablyFair ?? createProvablyFairSession();

    switch (action.type) {
        case 'OFFER_DOUBLE': {
            const isBotPreRollOffer =
                state.phase === 'OPPONENT_THINKING' && state.boardState.turn === 'O' && !state.boardState.dice;
            if (state.phase !== 'WAITING_FOR_ROLL' && !isBotPreRollOffer) return state;
            if (state.boardState.crawford) return state;

            const isDmp =
                state.matchLength > 0 &&
                state.boardState.scoreX === state.matchLength - 1 &&
                state.boardState.scoreO === state.matchLength - 1;
            if (isDmp) return state;

            if (state.boardState.cubeOwner !== null && state.boardState.cubeOwner !== state.boardState.turn) {
                return state;
            }
            if (
                state.matchLength > 0 &&
                (state.boardState.scoreX >= state.matchLength || state.boardState.scoreO >= state.matchLength)
            ) {
                return state;
            }

            return {
                ...state,
                phase: 'DOUBLING_OFFERED',
                doublingOfferedBy: state.boardState.turn,
                opponentHighlight: null,
            };
        }

        case 'TAKE_DOUBLE': {
            if (state.phase !== 'DOUBLING_OFFERED' || !state.doublingOfferedBy) return state;

            const acceptingPlayer: Player = state.doublingOfferedBy === 'X' ? 'O' : 'X';
            const nextCubeValue = state.boardState.cubeValue === 1 ? 2 : state.boardState.cubeValue * 2;

            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    cubeValue: nextCubeValue,
                    cubeOwner: acceptingPlayer,
                },
                phase: state.boardState.turn === 'O' && state.autoOpponent ? 'OPPONENT_THINKING' : 'WAITING_FOR_ROLL',
                doublingOfferedBy: null,
            };
        }

        case 'PASS_DOUBLE': {
            if (state.phase !== 'DOUBLING_OFFERED' || !state.doublingOfferedBy) return state;

            const winner = state.doublingOfferedBy;
            const loser: Player = winner === 'X' ? 'O' : 'X';
            const pointsWon = state.boardState.cubeValue;

            const nextScoreX = winner === 'X' ? state.boardState.scoreX + pointsWon : state.boardState.scoreX;
            const nextScoreO = winner === 'O' ? state.boardState.scoreO + pointsWon : state.boardState.scoreO;

            const result: GameResult = {
                winner,
                loser,
                winType: 'pass',
                multiplier: 1,
                pointsWon,
            };

            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    scoreX: nextScoreX,
                    scoreO: nextScoreO,
                },
                phase: 'GAME_OVER',
                doublingOfferedBy: null,
                gameResult: result,
                provablyFair: revealSessionServerSeed(currentPf),
            };
        }
    }
}
