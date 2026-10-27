import type { GameState, GameAction } from '../gameStateReducer';
import { handleHumanMoveAction, type HumanMoveAction } from './humanMoveActions';
import { handleOpponentMoveAction, type OpponentMoveAction } from './opponentMoveActions';

export type MoveAction = HumanMoveAction | OpponentMoveAction;

export function isMoveAction(action: GameAction): action is MoveAction {
    switch (action.type) {
        case 'SELECT_CHECKER':
        case 'DESELECT':
        case 'SET_SELECTED_DIE':
        case 'MOVE_CHECKER':
        case 'PLAY_MOVE':
        case 'COMMIT_HUMAN_TURN':
        case 'UNDO_MOVE':
        case 'REWIND_TO_LOG_TURN':
        case 'PLAY_OPPONENT':
        case 'OPPONENT_PREPARE_ROLL':
        case 'OPPONENT_START_TURN':
        case 'OPPONENT_SHOW_ARROWS':
        case 'OPPONENT_APPLY_STEP':
        case 'OPPONENT_FINISH_TURN':
            return true;
        default:
            return false;
    }
}

export function handleMoveAction(state: GameState, action: MoveAction): GameState {
    switch (action.type) {
        case 'SELECT_CHECKER':
        case 'DESELECT':
        case 'SET_SELECTED_DIE':
        case 'MOVE_CHECKER':
        case 'PLAY_MOVE':
        case 'COMMIT_HUMAN_TURN':
        case 'UNDO_MOVE':
        case 'REWIND_TO_LOG_TURN':
            return handleHumanMoveAction(state, action);

        case 'PLAY_OPPONENT':
        case 'OPPONENT_PREPARE_ROLL':
        case 'OPPONENT_START_TURN':
        case 'OPPONENT_SHOW_ARROWS':
        case 'OPPONENT_APPLY_STEP':
        case 'OPPONENT_FINISH_TURN':
            return handleOpponentMoveAction(state, action);
    }
}
