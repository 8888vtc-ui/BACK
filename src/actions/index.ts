/**
 * Point d'entrée de l'architecture atomique "1 Bouton = 1 Micro-Programme"
 */

export * from './types';
export * from './smartClickCheckerAction';
export * from './swapDiceOrderAction';
export * from './commitHumanMoveAction';
export * from './runAiTurnAction';
export * from './replayFromLogAction';
export * from './retryLastHumanTurnAction';
export * from '../features/coach/analyzeHumanLogAction';
export * from './coach';
