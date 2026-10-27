/**
 * Hook d'amorçage du match — tirage au sort (Roll-off) et actions distantes multijoueur.
 *
 * Rôle :
 *   Isole hors de `page.tsx` (LOI 5) :
 *     - le callback de succès du Roll-off (attribution du premier tour) ;
 *     - le routage des actions temps réel reçues de l'adversaire.
 *
 * Dépendances :
 *   `useRollOff`, `toast`, `soundEngine`.
 *
 * Retrait :
 *   Supprimer ce fichier et réintégrer la logique dans `page.tsx`.
 */

import { useCallback } from 'react';
import { toast } from '../components/toast/ToastContext';
import { soundEngine } from '../lib/sound/soundEngine';
import type { Player } from '../engine/backgammonEngine';
import type { GamePhase } from './useBackgammonGame';
import type { RealtimeBroadcastAction } from '../features/multiplayer/types';

export interface RemoteStatePatch {
    board: number[];
    dice?: [number, number] | null;
    turn?: Player;
    usedDice?: [boolean, boolean] | boolean[];
    phase?: GamePhase;
    cubeValue?: number;
    cubeOwner?: Player | null;
}

/** Sous-ensemble du jeu nécessaire à l'amorçage du match. */
export interface MatchBootstrapGame {
    state: { board: number[] };
    autoOpponent?: boolean;
    applyRemoteState: (patch: RemoteStatePatch) => void;
    rollDice: (dice?: [number, number]) => void;
    offerDouble: () => void;
    takeDouble: () => void;
    passDouble: () => void;
}

export interface UseMatchBootstrapResult {
    handleRemoteAction: (action: RealtimeBroadcastAction) => void;
}

export function useMatchBootstrap(game: MatchBootstrapGame): UseMatchBootstrapResult {
    // Écouteur des actions distantes multijoueur.
    const handleRemoteAction = useCallback(
        (action: RealtimeBroadcastAction) => {
            if (action.type === 'DICE_ROLLED') {
                game.rollDice(action.dice);
                toast.info(
                    `L'adversaire a lancé [${action.dice[0]}, ${action.dice[1]}].`,
                    'Dés adverses',
                );
            } else if (action.type === 'CHECKER_MOVED') {
                game.applyRemoteState({ board: action.board, usedDice: action.usedDice });
            } else if (action.type === 'TURN_FINISHED') {
                game.applyRemoteState({
                    board: game.state.board,
                    turn: action.nextTurn,
                    dice: null,
                    usedDice: [false, false],
                    phase: 'WAITING_FOR_ROLL',
                });
            } else if (action.type === 'DOUBLE_OFFERED') {
                game.offerDouble();
                toast.info(
                    `L'adversaire propose de doubler à ${action.cubeValue} !`,
                    'Proposition de double',
                );
            } else if (action.type === 'DOUBLE_ACCEPTED') {
                game.takeDouble();
                toast.success(
                    `L'adversaire a accepté le videau à ${action.cubeValue}.`,
                    'Double accepté',
                );
            } else if (action.type === 'DOUBLE_PASSED') {
                game.passDouble();
                toast.warning(
                    `L'adversaire abandonne le videau. Vous gagnez la manche !`,
                    'Videau passé',
                );
            }
        },
        [game],
    );

    return { handleRemoteAction };
}
