'use client';

/**
 * En-tête principal du match — barre supérieure UNIQUE (style XG / TMG).
 *
 * Rôle :
 *   Regroupe uniquement les éléments indispensables du haut de plateau :
 *   - Liens d'évitement WCAG
 *   - Barre unique `h-14` (`MatchHud`) : Lobby, joueurs, dernier coup, dés, videau, ⚙️
 *   - Contrôles du videau (`MatchTurnBar`), affichés UNIQUEMENT quand un double
 *     est proposé (Prendre / Passer).
 *
 * Aucun bandeau parasite n'est rendu sous la barre supérieure.
 *
 * Dépendances :
 *   `MatchHud`, `MatchTurnBar`.
 *
 * Retrait :
 *   Supprimer ce fichier et son import dans `page.tsx`.
 */

import React, { useCallback, useMemo } from 'react';
import type { ThemeName } from '../board/boardThemes';
import type { UseBackgammonGameReturn } from '../../hooks/useBackgammonGame';
import { pipCount } from '../../engine/backgammonEngine';
import MatchHud from './MatchHud';
import MatchTurnBar from './MatchTurnBar';
import { soundEngine } from '../../lib/sound/soundEngine';
import { impactHeavy, impactMedium } from '../../lib/capacitor/haptics';
import { toast } from '../toast/ToastContext';
import { analyzeCubeDecision } from '../../features/coach/cubeCoach';
import { formatStandardMoveSequence } from '../../features/coach/coachMoveNotation';

export interface MatchHeaderProps {
    t: (key: string) => string;
    theme: ThemeName;
    onToggleTheme: () => void;
    game: UseBackgammonGameReturn;
    isMultiplayerActive: boolean;
    multiplayer: any;
    onOpenExportImport: () => void;
    onTriggerCoach: () => void;
    /** Nombre de tours de jeu déjà terminés */
    turnsCount?: number;
    /** Performance Rating (PR) Joueur Blanc */
    prX?: number | null;
    /** Performance Rating (PR) IA Noire */
    prO?: number | null;
    /** Retour au lobby */
    onBackToLobby?: () => void;
}

const MatchHeaderComponent: React.FC<MatchHeaderProps> = ({
    t,
    theme,
    onToggleTheme,
    game,
    isMultiplayerActive,
    multiplayer,
    onOpenExportImport,
    onTriggerCoach,
    turnsCount,
    prX,
    prO,
    onBackToLobby,
}) => {
    const canDoubleAllowed =
        (turnsCount === undefined || turnsCount > 0) &&
        game.canDouble;

    // Pip counts des deux joueurs (calcul pur, aucune mutation d'état).
    const pips = useMemo(() => pipCount(game.state.board), [game.state.board]);

    const handleDouble = useCallback(() => {
        if (!canDoubleAllowed) {
            if (game.state.crawford) toast.warning('Le videau est interdit pendant la manche de Crawford.');
            else toast.warning('Vous ne possédez pas le videau ou ce n’est pas le moment de doubler.');
            return;
        }
        impactHeavy();
        soundEngine.playCubeOffer();
        game.offerDouble();
        if (isMultiplayerActive) multiplayer.broadcastDoubleOffered(game.state.cubeValue * 2);

        // Feedback pédagogique du videau (Coach).
        const cube = analyzeCubeDecision(game.state, 'double');
        if (cube.verdict === 'optimal') {
            toast.success(cube.explanation, 'Videau : Optimal');
        } else if (cube.verdict === 'blunder') {
            toast.warning(`${cube.explanation} ${cube.advice}`, 'Videau : Blunder');
        } else {
            toast.info(`${cube.explanation} ${cube.advice}`, 'Videau');
        }
    }, [canDoubleAllowed, game, isMultiplayerActive, multiplayer]);

    const handleRoll = useCallback(() => {
        impactMedium();
        soundEngine.playDiceRoll();
        if (isMultiplayerActive) {
            const d: [number, number] = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
            game.rollDice(d);
            multiplayer.broadcastDiceRolled(d);
        } else {
            game.rollDice();
        }
    }, [game, isMultiplayerActive, multiplayer]);

    // Dernier coup adverse en notation standard (24 → 1 du point de vue du joueur).
    const lastOpponentEntry =
        game.matchLog && game.matchLog.length > 0
            ? game.matchLog[game.matchLog.length - 1]
            : null;
    const lastMoveNotation =
        lastOpponentEntry && lastOpponentEntry.player === 'O' && lastOpponentEntry.movePlayed.length > 0
            ? formatStandardMoveSequence(
                [...lastOpponentEntry.movePlayed],
                'O',
                lastOpponentEntry.boardBefore,
            )
            : null;

    return (
        <>
            {/* Liens d'évitement (Skip links) pour accessibilité clavier */}
            <nav aria-label={t('board.skipToBoard')} className="fixed top-0 left-0 z-50 pointer-events-none">
                <a href="#backgammon-board" className="sr-only focus:not-sr-only focus:pointer-events-auto focus:inline-block focus:m-4 rounded-lg bg-sky-600 px-4 py-2 font-bold text-white shadow-xl outline-none ring-2 ring-white hover:bg-sky-500">
                    {t('board.skipToBoard')}
                </a>
                <a href="#match-hud" className="sr-only focus:not-sr-only focus:pointer-events-auto focus:inline-block focus:m-4 rounded-lg bg-sky-600 px-4 py-2 font-bold text-white shadow-xl outline-none ring-2 ring-white hover:bg-sky-500">
                    {t('board.skipToHud')}
                </a>
                <a href="#coach-panel" className="sr-only focus:not-sr-only focus:pointer-events-auto focus:inline-block focus:m-4 rounded-lg bg-sky-600 px-4 py-2 font-bold text-white shadow-xl outline-none ring-2 ring-white hover:bg-sky-500">
                    {t('board.skipToCoach')}
                </a>
            </nav>

            <header className="w-full max-w-7xl mx-auto shrink-0 z-30 flex flex-col gap-1 px-1 pt-0.5 pb-1 min-w-0 overflow-hidden">
                {/* Barre supérieure UNIQUE (h-14) */}
                <MatchHud
                    matchLength={game.state.matchLength}
                    scoreX={game.state.scoreX}
                    scoreO={game.state.scoreO}
                    turn={game.state.turn}
                    crawford={game.state.crawford}
                    dice={game.dice}
                    usedDice={game.usedDice}
                    cubeValue={game.state.cubeValue}
                    cubeOwner={game.state.cubeOwner}
                    theme={theme}
                    onThemeToggle={onToggleTheme}
                    onDoubleCube={handleDouble}
                    onRollDice={handleRoll}
                    onResetGame={game.resetMatch}
                    onOpenExportImport={onOpenExportImport}
                    onTriggerCoach={onTriggerCoach}
                    canDouble={canDoubleAllowed}
                    prX={prX}
                    prO={prO}
                    isAiThinking={game.phase === 'OPPONENT_THINKING' || game.state.turn === 'O'}
                    difficulty={game.difficulty}
                    pipX={pips.X}
                    pipO={pips.O}
                    lastMoveNotation={lastMoveNotation}
                    onBackToLobby={onBackToLobby}
                />

                {/* Contrôles du videau : uniquement quand un double est proposé */}
                <MatchTurnBar
                    phase={game.phase}
                    cubeValue={game.state.cubeValue}
                    cubeOwner={game.state.cubeOwner}
                    crawford={game.state.crawford}
                    doublingOfferedBy={game.doublingOfferedBy}
                    currentTurn={game.state.turn}
                    canDouble={canDoubleAllowed}
                    onOfferDouble={handleDouble}
                    onTakeDouble={() => {
                        soundEngine.playCubeOffer();
                        game.takeDouble();
                        if (isMultiplayerActive) multiplayer.broadcastDoubleAccepted(game.state.cubeValue);

                        const cube = analyzeCubeDecision(game.state, 'take');
                        if (cube.verdict === 'optimal') {
                            toast.success(cube.explanation, 'Videau : Optimal');
                        } else if (cube.verdict === 'blunder') {
                            toast.warning(`${cube.explanation} ${cube.advice}`, 'Videau : Blunder');
                        } else {
                            toast.info(`${cube.explanation} ${cube.advice}`, 'Videau');
                        }
                    }}
                    onPassDouble={() => {
                        soundEngine.playCubeOffer();
                        game.passDouble();
                        if (isMultiplayerActive && multiplayer.matchInfo) {
                            const winner = multiplayer.matchInfo.localRole === 'X' ? 'O' : 'X';
                            multiplayer.broadcastDoublePassed(winner);
                        }

                        const cube = analyzeCubeDecision(game.state, 'pass');
                        if (cube.verdict === 'optimal') {
                            toast.success(cube.explanation, 'Videau : Optimal');
                        } else if (cube.verdict === 'blunder') {
                            toast.warning(`${cube.explanation} ${cube.advice}`, 'Videau : Blunder');
                        } else {
                            toast.info(`${cube.explanation} ${cube.advice}`, 'Videau');
                        }
                    }}
                />
            </header>
        </>
    );
};

export const MatchHeader = React.memo(MatchHeaderComponent);
export default MatchHeader;
