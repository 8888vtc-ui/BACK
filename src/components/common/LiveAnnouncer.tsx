'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { BoardState, Player } from '../../engine/backgammonEngine';
import { borneOffCount } from '../../engine/backgammonEngine';

export interface AnnouncerContextValue {
    announce: (message: string, priority?: 'polite' | 'assertive') => void;
    announcement: string;
    priority: 'polite' | 'assertive';
}

const AnnouncerContext = createContext<AnnouncerContextValue>({
    announce: () => {},
    announcement: '',
    priority: 'polite',
});

export function useAnnouncer() {
    return useContext(AnnouncerContext);
}

export function AnnouncerProvider({ children }: { children: React.ReactNode }) {
    const [announcement, setAnnouncement] = useState('');
    const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const announce = useCallback((message: string, prio: 'polite' | 'assertive' = 'polite') => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setPriority(prio);
        // Efface brièvement pour s'assurer que le lecteur d'écran détecte la modification même si le message est similaire
        setAnnouncement('');
        timerRef.current = setTimeout(() => {
            setAnnouncement(message);
        }, 50);
    }, []);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <AnnouncerContext.Provider value={{ announce, announcement, priority }}>
            {children}
            {/* Région live pour lecteur d'écran */}
            <div
                role="status"
                aria-live={priority}
                aria-atomic="true"
                data-testid="live-announcer"
                className="sr-only"
            >
                {announcement}
            </div>
        </AnnouncerContext.Provider>
    );
}

/**
 * Hook spécialisé pour écouter les changements d'état du Backgammon
 * et générer les annonces audio pour lecteurs d'écran (NVDA, VoiceOver, JAWS).
 */
export function useGameAnnouncements(options: {
    state: BoardState;
    phase: string;
    selectedPoint: number | null;
    activeDie: 0 | 1 | null;
    leftTargetsCount: number;
    rightTargetsCount: number;
    canDouble: boolean;
    doublingOfferedBy: Player | null;
    opponentStatusMessage?: string | null;
}) {
    const { announce } = useAnnouncer();
    const prevTurnRef = useRef<Player>(options.state.turn);
    const prevDiceRef = useRef<[number, number] | null>(options.state.dice);
    const prevSelectedRef = useRef<number | null>(options.selectedPoint);
    const prevPhaseRef = useRef<string>(options.phase);
    const prevBoardRef = useRef<number[]>([...options.state.board]);
    const prevOffXRef = useRef<number>(borneOffCount(options.state.board, 'X'));
    const prevOffORef = useRef<number>(borneOffCount(options.state.board, 'O'));
    const prevOpponentMsgRef = useRef<string | null>(null);

    // 0. Annonce aria-live des coups et actions de l'IA
    useEffect(() => {
        const msg = options.opponentStatusMessage;
        if (msg && msg !== prevOpponentMsgRef.current) {
            announce(msg, 'polite');
            prevOpponentMsgRef.current = msg;
        } else if (!msg) {
            prevOpponentMsgRef.current = null;
        }
    }, [options.opponentStatusMessage, announce]);

    // 1. Annonce des dés lancés
    useEffect(() => {
        const prevDice = prevDiceRef.current;
        const currentDice = options.state.dice;
        if (currentDice && (!prevDice || prevDice[0] !== currentDice[0] || prevDice[1] !== currentDice[1])) {
            const isDoubles = currentDice[0] === currentDice[1];
            const msg = isDoubles
                ? `Double lancé : 4 fois ${currentDice[0]}. Au tour du Joueur ${options.state.turn === 'X' ? 'X (Blanc)' : 'O (Noir)'}.`
                : `Dés lancés : ${currentDice[0]} et ${currentDice[1]}. Au tour du Joueur ${options.state.turn === 'X' ? 'X (Blanc)' : 'O (Noir)'}.`;
            announce(msg, 'assertive');
        }
        prevDiceRef.current = currentDice ? [...currentDice] : null;
    }, [options.state.dice, options.state.turn, announce]);

    // 2. Annonce du changement de tour
    useEffect(() => {
        if (options.state.turn !== prevTurnRef.current) {
            const playerLabel = options.state.turn === 'X' ? 'Joueur X (Blanc)' : 'Joueur O (Noir)';
            announce(`Changement de tour. C'est au tour du ${playerLabel}.`, 'polite');
            prevTurnRef.current = options.state.turn;
        }
    }, [options.state.turn, announce]);

    // 3. Annonce de la sélection de pion
    useEffect(() => {
        if (options.selectedPoint !== prevSelectedRef.current) {
            if (options.selectedPoint !== null) {
                const pointName =
                    options.selectedPoint === 25
                        ? 'Barre X'
                        : options.selectedPoint === 0
                        ? 'Barre O'
                        : `Flèche ${options.selectedPoint}`;
                const totalTargets = options.leftTargetsCount + options.rightTargetsCount;
                const targetsMsg = totalTargets > 0
                    ? `${totalTargets} destination${totalTargets > 1 ? 's' : ''} légale${totalTargets > 1 ? 's' : ''} disponible${totalTargets > 1 ? 's' : ''}.`
                    : 'Aucun coup légal disponible pour ce pion.';
                announce(`${pointName} sélectionnée. ${targetsMsg}`, 'polite');
            } else if (prevSelectedRef.current !== null) {
                announce('Sélection désactivée.', 'polite');
            }
            prevSelectedRef.current = options.selectedPoint;
        }
    }, [options.selectedPoint, options.leftTargetsCount, options.rightTargetsCount, announce]);

    // 4. Annonce des sorties de pions (Bear-off)
    useEffect(() => {
        const offX = borneOffCount(options.state.board, 'X');
        const offO = borneOffCount(options.state.board, 'O');
        if (offX > prevOffXRef.current) {
            announce(`Pion Blanc sorti du plateau ! Total sortis : ${offX} sur 15.`, 'assertive');
            prevOffXRef.current = offX;
        }
        if (offO > prevOffORef.current) {
            announce(`Pion Noir sorti du plateau ! Total sortis : ${offO} sur 15.`, 'assertive');
            prevOffORef.current = offO;
        }
    }, [options.state.board, announce]);

    // 5. Annonce de la proposition de videau
    useEffect(() => {
        if (options.phase === 'DOUBLING_OFFERED' && prevPhaseRef.current !== 'DOUBLING_OFFERED') {
            const proposer = options.doublingOfferedBy === 'X' ? 'Joueur X (Blanc)' : 'Joueur O (Noir)';
            const newCube = options.state.cubeValue * 2;
            announce(`Proposition de videau ! Le ${proposer} propose de doubler la valeur à ${newCube}. Acceptez ou refusez.`, 'assertive');
        }
        prevPhaseRef.current = options.phase;
    }, [options.phase, options.doublingOfferedBy, options.state.cubeValue, announce]);

    // 6. Sauvegarde de l'état du plateau pour détecter les frappes
    useEffect(() => {
        prevBoardRef.current = [...options.state.board];
    }, [options.state.board]);
}
