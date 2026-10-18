/**
 * Hook d'interaction avec les pions et dés du plateau de jeu.
 *
 * Rôle :
 *   Gère les clics sur pions (clic gauche, double-clic, clic droit), le choix du dé actif,
 *   et la synchronisation multijoueur du déplacement.
 *
 * Dépendances :
 *   `checkerMoveHelpers`, `haptics`, `soundEngine`, `useKeyboardShortcuts`, `useForcedMoveAutoPlay`.
 *
 * Retrait :
 *   Supprimer ce fichier et réintégrer la gestion des clics dans `page.tsx`.
 */

import { useState, useEffect, useCallback } from 'react';
import { impactLight, impactMedium } from '../lib/capacitor/haptics';
import { soundEngine } from '../lib/sound/soundEngine';
import {
    getBestCheckerForDie,
    findSafestMoveForDie,
    evaluateSumOfDiceMove,
    findClickDestination,
} from '../engine/checkerMoveHelpers';
import { getSafestDestination } from '../engine/backgammonEngine';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useForcedMoveAutoPlay } from './useForcedMoveAutoPlay';
import type { UseBackgammonGameReturn } from './useBackgammonGame';

export interface UseCheckerInteractionsOptions {
    game: UseBackgammonGameReturn;
    isMultiplayerActive: boolean;
    multiplayer: {
        broadcastMovePlayed: (move: { from: number; to: number }, board: number[], usedDice: [boolean, boolean]) => void;
        broadcastTurnFinished: (nextTurn: 'X' | 'O') => void;
        matchInfo?: any;
    };
    currentTurnMovesRef: React.MutableRefObject<{ from: number; to: number }[]>;
}

export function useCheckerInteractions({
    game,
    isMultiplayerActive,
    multiplayer,
    currentTurnMovesRef,
}: UseCheckerInteractionsOptions) {
    const [preferredDie, setPreferredDie] = useState<0 | 1>(0);

    // Synchronisation automatique quand un dé est joué
    useEffect(() => {
        if (game.dice && game.dice[0] === game.dice[1]) {
            setPreferredDie(0);
        } else if (game.usedDice[0] && !game.usedDice[1]) {
            setPreferredDie(1);
        } else if (game.usedDice[1] && !game.usedDice[0]) {
            setPreferredDie(0);
        }
    }, [game.usedDice, game.dice]);

    // Raccourcis clavier (Espace, Tab, D)
    useKeyboardShortcuts({
        phase: game.phase,
        turn: game.state.turn,
        dice: game.dice,
        canDouble: game.canDouble,
        onRollDice: game.rollDice,
        onSwapDice: () => setPreferredDie((prev) => ((1 - prev) as 0 | 1)),
        onOfferDouble: game.offerDouble,
    });

    const activeDie: 0 | 1 =
        game.selected?.die ?? (game.usedDice[preferredDie] ? ((1 - preferredDie) as 0 | 1) : preferredDie);

    const handlePlayMove = useCallback((from: number, to: number, die?: 0 | 1) => {
        impactMedium();
        currentTurnMovesRef.current.push({ from, to });
        game.playMove(from, to, die);
    }, [game.playMove, currentTurnMovesRef]);

    // Auto-play du coup forcé unique
    useForcedMoveAutoPlay({
        phase: game.phase,
        turn: game.state.turn,
        dice: game.dice,
        leftDieTargets: game.leftDieTargets,
        rightDieTargets: game.rightDieTargets,
        onPlayMove: handlePlayMove,
    });

    const handleSelectDie = useCallback((die: 0 | 1) => {
        impactLight();
        setPreferredDie(die);
        const targets = die === 0 ? game.leftDieTargets : game.rightDieTargets;
        if (targets.size === 0) return;

        if (game.selected && targets.has(game.selected.point)) {
            game.setSelectedDie(die);
            return;
        }

        const bestFrom = getBestCheckerForDie(targets, game.state.board, game.state.turn);
        if (bestFrom !== null) {
            const dests = targets.get(bestFrom) ?? [];
            if (targets.size === 1 && dests.length === 1) handlePlayMove(bestFrom, dests[0], die);
            else game.selectChecker(bestFrom, die);
        }
    }, [game.selected, game.leftDieTargets, game.rightDieTargets, game.state.board, game.state.turn, game.selectChecker, game.setSelectedDie, handlePlayMove]);

    const handleDieDoubleClick = useCallback((die: 0 | 1) => {
        impactMedium();
        const targets = die === 0 ? game.leftDieTargets : game.rightDieTargets;
        const safest = findSafestMoveForDie(targets, game.state.board, game.state.turn, game.selected?.point);
        if (safest) handlePlayMove(safest.from, safest.to, die);
    }, [game.selected, game.leftDieTargets, game.rightDieTargets, game.state.board, game.state.turn, handlePlayMove]);

    const handleCheckerClick = useCallback((point: number) => {
        impactLight();
        if (game.selected?.point === point) {
            game.deselect();
            return;
        }
        const result = findClickDestination(point, game.leftDieTargets.get(point) ?? [], game.rightDieTargets.get(point) ?? [], game.state.board, game.state.turn, false);
        if (result) handlePlayMove(point, result.dest, result.die);
    }, [game.selected?.point, game.deselect, game.leftDieTargets, game.rightDieTargets, game.state.board, game.state.turn, handlePlayMove]);

    const handleCheckerDoubleClick = useCallback((point: number) => {
        impactMedium();
        const leftDests = game.leftDieTargets.get(point) ?? [];
        const rightDests = game.rightDieTargets.get(point) ?? [];
        const sumResult = evaluateSumOfDiceMove(point, game.dice, game.state.board, game.state.turn, leftDests, rightDests);

        if (sumResult.isPossible && sumResult.midDest !== undefined && sumResult.sumDest !== undefined) {
            handlePlayMove(point, sumResult.midDest, 0);
            window.setTimeout(() => handlePlayMove(sumResult.midDest!, sumResult.sumDest!, 1), 200);
            return;
        }
        const allDests = Array.from(new Set([...leftDests, ...rightDests]));
        if (allDests.length > 0) {
            const safest = getSafestDestination(point, allDests, game.state.board, game.state.turn);
            handlePlayMove(point, safest, leftDests.includes(safest) ? 0 : 1);
        }
    }, [game.leftDieTargets, game.rightDieTargets, game.state.board, game.state.turn, game.dice, handlePlayMove]);

    const handleCheckerRightClick = useCallback((point: number) => {
        impactLight();
        const result = findClickDestination(point, game.leftDieTargets.get(point) ?? [], game.rightDieTargets.get(point) ?? [], game.state.board, game.state.turn, true);
        if (result) handlePlayMove(point, result.dest, result.die);
    }, [game.rightDieTargets, game.leftDieTargets, game.state.board, game.state.turn, handlePlayMove]);

    const handleDestinationClick = useCallback((destination: number) => {
        impactLight();
        const destVal = destination >= 1 && destination <= 24 ? game.state.board[destination] : 0;
        const isHit = (game.state.turn === 'X' && destVal === -1) || (game.state.turn === 'O' && destVal === 1);
        if (isHit) soundEngine.playCheckerHit();
        else soundEngine.playCheckerSlide();

        if (game.selected) {
            const move = { from: game.selected.point, to: destination };
            currentTurnMovesRef.current.push(move);
            if (isMultiplayerActive) {
                setTimeout(() => {
                    const safeUsedDice: [boolean, boolean] = [Boolean(game.usedDice[0]), Boolean(game.usedDice[1])];
                    multiplayer.broadcastMovePlayed(move, game.state.board, safeUsedDice);
                    if (game.state.turn !== multiplayer.matchInfo?.localRole) multiplayer.broadcastTurnFinished(game.state.turn);
                }, 50);
            }
        }
        game.moveChecker(destination);
    }, [game.state.turn, game.state.board, game.selected, game.usedDice, game.moveChecker, isMultiplayerActive, multiplayer, currentTurnMovesRef]);

    const handleDeselect = useCallback(() => {
        if (game.selected) game.deselect();
    }, [game.selected, game.deselect]);

    return {
        preferredDie,
        activeDie,
        handlePlayMove,
        handleSelectDie,
        handleDieDoubleClick,
        handleCheckerClick,
        handleCheckerDoubleClick,
        handleCheckerRightClick,
        handleDestinationClick,
        handleDeselect,
    };
}
