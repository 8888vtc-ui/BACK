/**
 * Hook de contrôles Desktop (souris/clavier) — One-Click TMG.
 *
 * Rôle :
 *   Fournit le mode "One-Click" pour le plateau Desktop :
 *   - Clic gauche sur une flèche de départ = joue immédiatement le dé préféré
 *     disponible (`preferredDie`, défaut 0).
 *   - Clic droit sur une flèche de départ = joue immédiatement le second dé
 *     disponible (`1 - preferredDie`, défaut 1).
 *   - Clic sur les dés = inverse l'ordre (`swapDiceOrderAction`).
 *   - Si plusieurs destinations sont ambiguës, `runSmartClick` sélectionne le pion
 *     et le joueur clique ensuite la flèche d'arrivée illuminée.
 *
 * Ce hook est une COUCHE DE PRÉSENTATION : il consomme les actions pures de
 * `src/actions/` (LOI 1) et les handlers de `useCheckerInteractions`, sans
 * dupliquer le moteur.
 *
 * Retrait :
 *   Supprimer ce fichier et son usage dans `page.tsx`.
 */

import { useCallback } from 'react';
import { getSafestDestination } from '../engine/backgammonEngine';
import { findPortMove } from '../engine/checkerMoveHelpers';
import type { BoardState } from '../engine/backgammonEngine';
import { smartClickCheckerAction } from '../actions/smartClickCheckerAction';
import { swapDiceOrderAction } from '../actions/swapDiceOrderAction';

/** Sous-ensemble minimal des propriétés du jeu nécessaires au one-click. */
export interface DesktopGameView {
    leftDieTargets: Map<number, number[]>;
    rightDieTargets: Map<number, number[]>;
    state: BoardState;
    dice: [number, number] | null;
}

export interface UseDesktopControlsOptions {
    game: DesktopGameView;
    /** Joue un coup (from, to, die). */
    onPlayMove: (from: number, to: number, die?: 0 | 1) => void;
    /** Sélectionne un pion (quand plusieurs destinations sont ambiguës). */
    onSelectChecker?: (point: number, die?: 0 | 1) => void;
    /** Applique un nouvel ordre de dés (issu de `swapDiceOrderAction`). */
    onSwapDice?: (dice: readonly [number, number] | null, preferredDie: 0 | 1) => void;
    /** Dé actuellement préféré (0 ou 1). */
    preferredDie?: 0 | 1;
}

export interface UseDesktopControlsResult {
    /**
     * One-click gauche : joue le dé préféré (destination la plus sûre) directement.
     * Repli sur l'autre dé si le dé préféré n'a pas de destination.
     */
    handleOneClick: (point: number) => void;
    /**
     * One-click droit : joue le second dé (`1 - preferredDie`) directement.
     */
    handleOneRightClick: (point: number) => void;
    /**
     * Smart-click porte : clic sur une flèche vide/blot = joue les 2 pions
     * pour faire la porte (2 pions sur la même flèche).
     */
    handlePortClick: (dest: number) => void;
    /**
     * Clic sur la paire de dés : inverse l'ordre via `swapDiceOrderAction`.
     * Retourne le nouvel ordre (ou null si aucun dé).
     */
    handleDiceClick: () => readonly [number, number] | null;
    /**
     * Smart-click générique : joue immédiatement si non ambigu, sinon sélectionne.
     * @param point Flèche cliquée.
     * @param die   Dé préféré (0 = clic gauche, 1 = clic droit).
     */
    runSmartClick: (point: number, die: 0 | 1) => void;
}

export function useDesktopControls({
    game,
    onPlayMove,
    onSelectChecker,
    onSwapDice,
    preferredDie = 0,
}: UseDesktopControlsOptions): UseDesktopControlsResult {
    /**
     * Exécute le résultat de `smartClickCheckerAction` :
     * coup immédiat si non ambigu, sinon sélection du pion.
     */
    const runSmartClick = useCallback(
        (point: number, die: 0 | 1) => {
            const result = smartClickCheckerAction({
                point,
                leftDieTargets: game.leftDieTargets,
                rightDieTargets: game.rightDieTargets,
                preferredDie: die,
                player: game.state.turn,
            });

            if (result.move) {
                onPlayMove(result.move.from, result.move.to, result.move.die);
                return;
            }
            if (result.shouldSelect) {
                onSelectChecker?.(point, die);
            }
        },
        [game.leftDieTargets, game.rightDieTargets, game.state.turn, onPlayMove, onSelectChecker],
    );

    const handleOneClick = useCallback(
        (point: number) => {
            const primaryDie: 0 | 1 = preferredDie;
            const secondaryDie: 0 | 1 = (1 - preferredDie) as 0 | 1;
            const primaryDests = (primaryDie === 0 ? game.leftDieTargets : game.rightDieTargets).get(point) ?? [];
            const secondaryDests = (secondaryDie === 0 ? game.leftDieTargets : game.rightDieTargets).get(point) ?? [];

            // Priorité au dé préféré (clic gauche).
            if (primaryDests.length > 0) {
                const dest = getSafestDestination(point, primaryDests, game.state.board, game.state.turn);
                onPlayMove(point, dest, primaryDie);
                return;
            }
            // Repli sur le second dé si le dé préféré n'a pas de destination.
            if (secondaryDests.length > 0) {
                const dest = getSafestDestination(point, secondaryDests, game.state.board, game.state.turn);
                onPlayMove(point, dest, secondaryDie);
            }
        },
        [preferredDie, game.leftDieTargets, game.rightDieTargets, game.state.board, game.state.turn, onPlayMove],
    );

    const handleOneRightClick = useCallback(
        (point: number) => {
            const secondaryDie: 0 | 1 = (1 - preferredDie) as 0 | 1;
            const primaryDie: 0 | 1 = preferredDie;
            const secondaryDests = (secondaryDie === 0 ? game.leftDieTargets : game.rightDieTargets).get(point) ?? [];
            const primaryDests = (primaryDie === 0 ? game.leftDieTargets : game.rightDieTargets).get(point) ?? [];

            // Priorité au second dé (clic droit).
            if (secondaryDests.length > 0) {
                const dest = getSafestDestination(point, secondaryDests, game.state.board, game.state.turn);
                onPlayMove(point, dest, secondaryDie);
                return;
            }
            // Repli sur le dé préféré si le second dé n'a pas de destination.
            if (primaryDests.length > 0) {
                const dest = getSafestDestination(point, primaryDests, game.state.board, game.state.turn);
                onPlayMove(point, dest, primaryDie);
            }
        },
        [preferredDie, game.leftDieTargets, game.rightDieTargets, game.state.board, game.state.turn, onPlayMove],
    );

    const handlePortClick = useCallback(
        (dest: number) => {
            const port = findPortMove(
                dest,
                game.dice,
                game.state.board,
                game.state.turn,
                game.leftDieTargets,
                game.rightDieTargets,
            );
            if (!port) return;

            // Joue les deux pions pour faire la porte.
            onPlayMove(port.from1, dest, port.die1);
            onPlayMove(port.from2, dest, port.die2);
        },
        [game.dice, game.state.board, game.state.turn, game.leftDieTargets, game.rightDieTargets, onPlayMove],
    );

    const handleDiceClick = useCallback(() => {
        const result = swapDiceOrderAction({ dice: game.dice, preferredDie });
        onSwapDice?.(result.dice, result.preferredDie);
        return result.dice;
    }, [game.dice, preferredDie, onSwapDice]);

    return { handleOneClick, handleOneRightClick, handlePortClick, handleDiceClick, runSmartClick };
}
