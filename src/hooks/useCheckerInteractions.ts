/**
 * Hook d'interaction avec les pions et dés du plateau de jeu.
 *
 * Rôle :
 *   Gère les clics sur pions (clic gauche, clic droit), le choix du dé actif,
 *   et la synchronisation multijoueur du déplacement. Le double-clic natif est banni :
 *   le coup combiné (d1+d2) se joue en un clic sur la destination (`useBoardPointInteractions`)
 *   ou par glisser-déposer (Game Feel Spec §1.1).
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
import { sensoryFeedbackController } from '../lib/sound/SensoryFeedbackController';
import { HIT_ATTACKER_BASE_MS } from '../lib/gameFeel/flightPhysics';
import {
    getBestCheckerForDie,
    findClickDestination,
} from '../engine/checkerMoveHelpers';
import { getSafestDestination } from '../engine/backgammonEngine';
import { swapDiceOrderAction } from '../actions/swapDiceOrderAction';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useForcedMoveAutoPlay } from './useForcedMoveAutoPlay';
import type { UseBackgammonGameReturn } from './useBackgammonGame';

export interface UseCheckerInteractionsOptions {
    game: UseBackgammonGameReturn;
    isMultiplayerActive: boolean;
    multiplayer: {
        broadcastMovePlayed: (move: { from: number; to: number }, board: number[], usedDice: [boolean, boolean]) => void;
        broadcastTurnFinished: (nextTurn: 'X' | 'O') => void;
        matchInfo?: { localRole?: 'X' | 'O' } | null;
    };
    currentTurnMovesRef: React.MutableRefObject<{ from: number; to: number }[]>;
}

export function getDefaultHigherDieIndex(dice: [number, number] | null): 0 | 1 {
    if (!dice) return 0;
    return dice[1] > dice[0] ? 1 : 0;
}

export function useCheckerInteractions({
    game,
    isMultiplayerActive,
    multiplayer,
    currentTurnMovesRef,
}: UseCheckerInteractionsOptions) {
    const [preferredDie, setPreferredDie] = useState<0 | 1>(() => getDefaultHigherDieIndex(game.dice));
    const [hasExplicitDiePreference, setHasExplicitDiePreference] = useState<boolean>(false);

    const {
        dice: gameDice,
        usedDice: gameUsedDice,
        phase: gamePhase,
        gamePhase: strictGamePhase,
        state: gameState,
        canDouble: gameCanDouble,
        canUndo: gameCanUndo,
        isHumanTurn: gameIsHumanTurn,
        autoConfirmTurn,
        moveHistory,
        rollDice,
        offerDouble,
        commitHumanMove,
        undoMove,
        selected: gameSelected,
        playMove,
        leftDieTargets,
        rightDieTargets,
        setSelectedDie,
        selectChecker,
        deselect,
        moveChecker,
    } = game;
    const { board: gameBoard, turn: gameTurn } = gameState;

    // Synchronise la référence des coups du tour en cas d'annulation (Undo)
    useEffect(() => {
        if (Array.isArray(moveHistory)) {
            const recordedMoves = moveHistory.flatMap((h) => (h.move ? [h.move] : []));
            if (currentTurnMovesRef.current.length > recordedMoves.length) {
                currentTurnMovesRef.current = [...recordedMoves];
            }
        }
    }, [moveHistory, currentTurnMovesRef]);

    // Réinitialise l'inversion manuelle et sélectionne le dé le plus élevé à chaque nouveau jet
    useEffect(() => {
        setHasExplicitDiePreference(false);
        setPreferredDie(getDefaultHigherDieIndex(gameDice));
    }, [gameDice]);

    // Synchronisation automatique quand un dé est joué (ou annulé via Undo)
    useEffect(() => {
        if (!gameDice) {
            setHasExplicitDiePreference(false);
            return;
        }
        if (gameDice[0] === gameDice[1]) {
            setPreferredDie(0);
        } else if (gameUsedDice[0] && !gameUsedDice[1]) {
            setPreferredDie(1);
        } else if (gameUsedDice[1] && !gameUsedDice[0]) {
            setPreferredDie(0);
        } else if (!gameUsedDice[0] && !gameUsedDice[1] && !hasExplicitDiePreference) {
            setPreferredDie(getDefaultHigherDieIndex(gameDice));
        }
    }, [gameUsedDice, gameDice, hasExplicitDiePreference]);

    const defaultHigherDie = getDefaultHigherDieIndex(gameDice);
    const resolvedPreferredDie: 0 | 1 =
        !gameDice || gameDice[0] === gameDice[1]
            ? 0
            : !gameUsedDice[0] && !gameUsedDice[1] && !hasExplicitDiePreference
              ? defaultHigherDie
              : preferredDie;

    const activeDie: 0 | 1 =
        gameSelected?.die ?? (gameUsedDice[resolvedPreferredDie] ? ((1 - resolvedPreferredDie) as 0 | 1) : resolvedPreferredDie);

    // Raccourcis clavier (Espace, Entrée, Tab, D)
    const canConfirmManualTurn =
        !autoConfirmTurn &&
        strictGamePhase === 'HUMAN_READY_TO_COMMIT' &&
        Boolean(gameCanUndo);

    useKeyboardShortcuts({
        phase: gamePhase,
        gamePhase: strictGamePhase,
        turn: gameTurn,
        dice: gameDice,
        canDouble: gameCanDouble,
        canConfirm: canConfirmManualTurn,
        onRollDice: () => {
            sensoryFeedbackController.triggerMechanicalClick();
            rollDice();
        },
        onSwapDice: () => {
            setHasExplicitDiePreference(true);
            setPreferredDie(((1 - activeDie) as 0 | 1));
        },
        onOfferDouble: offerDouble,
        onConfirmTurn: commitHumanMove
            ? () => {
                  sensoryFeedbackController.triggerMechanicalClick();
                  commitHumanMove();
              }
            : undefined,
    });

    const handlePlayMove = useCallback((from: number, to: number, die?: 0 | 1) => {
        const destVal = to >= 1 && to <= 24 ? gameBoard[to] : 0;
        const isHit = (gameTurn === 'X' && destVal === -1) || (gameTurn === 'O' && destVal === 1);
        if (isHit) {
            sensoryFeedbackController.triggerCheckerLift(0.8);
            sensoryFeedbackController.scheduleBlotHitAtFlightApex(HIT_ATTACKER_BASE_MS);
        } else {
            sensoryFeedbackController.triggerStandardCheckerMove();
        }
        impactMedium();
        const move = { from, to };
        currentTurnMovesRef.current.push(move);
        playMove(from, to, die);
        if (isMultiplayerActive) {
            setTimeout(() => {
                const safeUsedDice: [boolean, boolean] = [Boolean(gameUsedDice[0]), Boolean(gameUsedDice[1])];
                multiplayer.broadcastMovePlayed(move, gameBoard, safeUsedDice);
                if (gameTurn !== multiplayer.matchInfo?.localRole) {
                    multiplayer.broadcastTurnFinished(gameTurn);
                }
            }, 50);
        }
    }, [playMove, currentTurnMovesRef, isMultiplayerActive, gameUsedDice, multiplayer, gameBoard, gameTurn]);

    // Auto-play du coup forcé unique, de la rentrée forcée depuis la barre (ex: 2 pions sur la barre), de l'Auto-Bearoff sur l'As et du Greedy Bearoff
    const isPlayerOnBar = gameTurn === 'X' ? (gameBoard[0] ?? 0) > 0 : (gameBoard[25] ?? 0) < 0;
    useForcedMoveAutoPlay({
        phase: gamePhase,
        turn: gameTurn,
        isHumanTurn: gameIsHumanTurn,
        board: gameBoard,
        dice: gameDice,
        usedDice: gameUsedDice,
        leftDieTargets,
        rightDieTargets,
        onPlayMove: handlePlayMove,
        autoPlayEnabled: Boolean(autoConfirmTurn) || isPlayerOnBar,
    });

    const handleSelectDie = useCallback((die: 0 | 1) => {
        impactLight();
        setPreferredDie(die);
        setHasExplicitDiePreference(true);
        const targets = die === 0 ? leftDieTargets : rightDieTargets;
        if (targets.size === 0) return;

        if (gameSelected && targets.has(gameSelected.point)) {
            setSelectedDie(die);
            return;
        }

        const bestFrom = getBestCheckerForDie(targets, gameBoard, gameTurn);
        if (bestFrom !== null) {
            const dests = targets.get(bestFrom) ?? [];
            if (targets.size === 1 && dests.length === 1) handlePlayMove(bestFrom, dests[0], die);
            else selectChecker(bestFrom, die);
        }
    }, [gameSelected, leftDieTargets, rightDieTargets, gameBoard, gameTurn, selectChecker, setSelectedDie, handlePlayMove]);

    const handleCheckerClick = useCallback((point: number) => {
        impactLight();
        const leftDests = leftDieTargets.get(point) ?? [];
        const rightDests = rightDieTargets.get(point) ?? [];
        const allDests = Array.from(new Set([...leftDests, ...rightDests]));

        if (allDests.length === 0) {
            const wasMovedHere =
                Boolean(gameCanUndo) &&
                Array.isArray(moveHistory) &&
                moveHistory.some((h) => h.move?.to === point);
            if (wasMovedHere && undoMove) {
                undoMove();
                return;
            }
            if (gameSelected?.point === point) deselect();
            return;
        }

        const primaryDie: 0 | 1 = activeDie;
        const fallbackDie: 0 | 1 = (1 - primaryDie) as 0 | 1;
        const primaryDests = primaryDie === 0 ? leftDests : rightDests;
        const fallbackDests = primaryDie === 0 ? rightDests : leftDests;

        // 1. Priorité par défaut au dé actif (le dé le plus élevé, sauf inversion manuelle par le joueur)
        if (primaryDests.length > 0) {
            const dest = getSafestDestination(point, primaryDests, gameBoard, gameTurn);
            handlePlayMove(point, dest, primaryDie);
            return;
        }

        // 2. Repli automatique sur l'autre dé (le plus bas) si le dé le plus élevé est illégal/bloqué pour ce pion
        if (fallbackDests.length > 0) {
            const dest = getSafestDestination(point, fallbackDests, gameBoard, gameTurn);
            handlePlayMove(point, dest, fallbackDie);
            return;
        }
    }, [
        gameSelected?.point,
        activeDie,
        deselect,
        leftDieTargets,
        rightDieTargets,
        gameBoard,
        gameTurn,
        gameCanUndo,
        moveHistory,
        undoMove,
        handlePlayMove,
    ]);

    const handleCheckerRightClick = useCallback((point: number) => {
        impactLight();
        const secondaryDie: 0 | 1 = (1 - activeDie) as 0 | 1;
        const result = findClickDestination(
            point,
            leftDieTargets.get(point) ?? [],
            rightDieTargets.get(point) ?? [],
            gameBoard,
            gameTurn,
            secondaryDie === 1,
        );
        if (result) handlePlayMove(point, result.dest, result.die);
    }, [activeDie, rightDieTargets, leftDieTargets, gameBoard, gameTurn, handlePlayMove]);

    const handleDestinationClick = useCallback((destination: number) => {
        impactLight();
        const destVal = destination >= 1 && destination <= 24 ? gameBoard[destination] : 0;
        const isHit = (gameTurn === 'X' && destVal === -1) || (gameTurn === 'O' && destVal === 1);
        if (isHit) {
            soundEngine.playCheckerHit();
            sensoryFeedbackController.scheduleBlotHitAtFlightApex(HIT_ATTACKER_BASE_MS);
        } else {
            soundEngine.playCheckerSlide();
            sensoryFeedbackController.triggerStandardCheckerMove();
        }

        if (gameSelected) {
            const move = { from: gameSelected.point, to: destination };
            currentTurnMovesRef.current.push(move);
            if (isMultiplayerActive) {
                setTimeout(() => {
                    const safeUsedDice: [boolean, boolean] = [Boolean(gameUsedDice[0]), Boolean(gameUsedDice[1])];
                    multiplayer.broadcastMovePlayed(move, gameBoard, safeUsedDice);
                    if (gameTurn !== multiplayer.matchInfo?.localRole) multiplayer.broadcastTurnFinished(gameTurn);
                }, 50);
            }
        }
        moveChecker(destination);
    }, [gameTurn, gameBoard, gameSelected, gameUsedDice, moveChecker, isMultiplayerActive, multiplayer, currentTurnMovesRef]);

    const handleDeselect = useCallback(() => {
        if (gameSelected) deselect();
    }, [gameSelected, deselect]);

    /**
     * Inverse l'ordre des dés via `swapDiceOrderAction` (LOI 1).
     * Utilisé par le clic sur les dés (desktop) et le tap tactile (mobile).
     * Un double reste inchangé ; le dé préféré bascule sinon.
     */
    const handleSwapDice = useCallback(() => {
        impactLight();
        setHasExplicitDiePreference(true);
        const result = swapDiceOrderAction({ dice: gameDice, preferredDie: activeDie });
        setPreferredDie(result.preferredDie);
        return result.dice;
    }, [gameDice, activeDie]);

    return {
        preferredDie,
        activeDie,
        handlePlayMove,
        handleSelectDie,
        handleCheckerClick,
        handleCheckerRightClick,
        handleDestinationClick,
        handleDeselect,
        handleSwapDice,
    };
}
