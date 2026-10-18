/**
 * Hook d'assistance au coup d'ouverture (Opening Book certifié).
 *
 * Rôle :
 *   Détecte automatiquement si la position actuelle correspond à une situation d'ouverture,
 *   gère l'état d'affichage / surbrillance du bandeau et applique le coup Book recommandé.
 *
 * Dépendances :
 *   `openings` (`getOpening`, `isOpeningSituation`, `OpeningEntry`), `backgammonEngine` (`applyMove`, `Move`).
 *
 * Retrait :
 *   Supprimer ce fichier et son appel dans `page.tsx`.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getOpening, isOpeningSituation, type OpeningEntry } from '../features/openings';
import { applyMove, type Move } from '../engine/backgammonEngine';
import { impactHeavy } from '../lib/capacitor/haptics';
import { toast } from '../components/toast/ToastContext';
import type { UseBackgammonGameReturn } from './useBackgammonGame';

export interface UseOpeningAssistantOptions {
    game: UseBackgammonGameReturn;
    isMultiplayerActive: boolean;
    multiplayer: {
        broadcastMovePlayed: (move: Move, board: number[], usedDice: [boolean, boolean]) => void;
        broadcastTurnFinished: (nextTurn: 'X' | 'O') => void;
    };
    currentTurnMovesRef: React.MutableRefObject<{ from: number; to: number }[]>;
    historyLength: number;
}

export function useOpeningAssistant({
    game,
    isMultiplayerActive,
    multiplayer,
    currentTurnMovesRef,
    historyLength,
}: UseOpeningAssistantOptions) {
    const [isOpeningDismissed, setIsOpeningDismissed] = useState(false);
    const [isOpeningHighlightActive, setIsOpeningHighlightActive] = useState(true);

    const openingEntry = useMemo<OpeningEntry | null>(() => {
        if (isOpeningDismissed || !game.dice || game.state.turn !== 'X' || game.phase !== 'PLAYING_MOVES') return null;
        if (game.usedDice[0] || game.usedDice[1]) return null;
        if (isOpeningSituation(game.state.board, game.dice, historyLength)) {
            return getOpening(game.dice[0], game.dice[1]);
        }
        return null;
    }, [game.dice, game.state.turn, game.phase, game.usedDice, game.state.board, isOpeningDismissed, historyLength]);

    useEffect(() => {
        if (game.phase === 'WAITING_FOR_ROLL' && !game.dice) {
            setIsOpeningDismissed(false);
        }
    }, [game.phase, game.dice]);

    const handleApplyOpeningMove = useCallback((moves: Move[]) => {
        if (!game.dice) return;
        impactHeavy();
        let currentBoard = [...game.state.board];
        for (const m of moves) {
            currentBoard = applyMove(currentBoard, m, 'X');
            currentTurnMovesRef.current.push(m);
        }
        if (isMultiplayerActive) {
            for (const m of moves) multiplayer.broadcastMovePlayed(m, currentBoard, [true, true]);
            multiplayer.broadcastTurnFinished('O');
        }
        game.applyRemoteState({
            board: currentBoard,
            usedDice: [true, true],
            turn: 'O',
            phase: !isMultiplayerActive ? 'OPPONENT_THINKING' : 'WAITING_FOR_ROLL',
        });
        toast.success(`Coup Book « ${openingEntry?.bestMoveNotation ?? 'Optimal'} » appliqué !`, 'Opening Book');
    }, [game, openingEntry, isMultiplayerActive, multiplayer, currentTurnMovesRef]);

    const dismissOpening = useCallback(() => setIsOpeningDismissed(true), []);
    const toggleOpeningHighlight = useCallback(() => setIsOpeningHighlightActive((prev) => !prev), []);

    return {
        openingEntry,
        isOpeningDismissed,
        dismissOpening,
        isOpeningHighlightActive,
        toggleOpeningHighlight,
        handleApplyOpeningMove,
    };
}
