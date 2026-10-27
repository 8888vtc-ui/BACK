/**
 * Reducer pur et types d'état de la machine à états Backgammon (`src/hooks/gameStateReducer.ts`).
 *
 * Extrait selon la doctrine atomique et budgets R1 (SCALABILITY.md).
 * Strictement pur, déterministe et testable isolément (<= 200 lignes).
 */

import type { BackgammonGameState, GameAction } from './gameStateTypes';
import { handleRollAction, isRollAction } from './reducers/rollActions';
import { handleCubeAction, isCubeAction } from './reducers/cubeActions';
import { handleMoveAction, isMoveAction } from './reducers/moveActions';
import { handleMatchAction, isMatchAction } from './reducers/matchActions';

export * from './gameStateTypes';

export function backgammonGameReducer(
    state: BackgammonGameState,
    action: GameAction,
): BackgammonGameState {
    if (isRollAction(action)) {
        return handleRollAction(state, action);
    }
    if (isCubeAction(action)) {
        return handleCubeAction(state, action);
    }
    if (isMoveAction(action)) {
        return handleMoveAction(state, action);
    }
    if (isMatchAction(action)) {
        return handleMatchAction(state, action);
    }
    return state;
}

/**
 * Alias conventionnel conforme à SCALABILITY.md.
 */
export const gameReducer = backgammonGameReducer;
