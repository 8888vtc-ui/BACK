'use client';

/**
 * Page principale de jeu Backgammon.
 *
 * Rôle :
 *   Orchestre l'initialisation du moteur de jeu, du multijoueur temps réel, du coach IA,
 *   de la persistance locale et des modales. Rendu délégatif modulaire (HUD, Plateau, Coach, Modales).
 *
 * Dépendances :
 *   `useBackgammonGame`, `useCoach`, `useMultiplayerGame`, `useCheckerInteractions`,
 *   `useGamePersistence`, `useGameModals`, `useOpeningAssistant`, `useRollOff`,
 *   `MatchHeader`, `GameBoardArea`, `CoachMobileDrawer`, `GameModalsContainer`.
 *
 * Retrait :
 *   Point d'entrée de l'application Next.js.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MatchHeader from '../components/hud/MatchHeader';
import GameBoardArea from '../components/board/GameBoardArea';
import CoachMobileDrawer from '../components/coach/CoachMobileDrawer';
import GameModalsContainer from '../components/modals/GameModalsContainer';
import { useBoardTheme } from '../hooks/useBoardTheme';
import { useBackgammonGame, type AIDifficulty } from '../hooks/useBackgammonGame';
import { useCoach } from '../hooks/useCoach';
import { useMultiplayerGame } from '../hooks/useMultiplayerGame';
import { useCheckerInteractions } from '../hooks/useCheckerInteractions';
import { useGamePersistence } from '../hooks/useGamePersistence';
import { useGameModals } from '../hooks/useGameModals';
import { useOpeningAssistant } from '../hooks/useOpeningAssistant';
import { useRollOff } from '../hooks/useRollOff';
import type { Player } from '../engine/backgammonEngine';
import type { RealtimeBroadcastAction } from '../features/multiplayer/types';
import { toast } from '../components/toast/ToastContext';
import { notificationSuccess } from '../lib/capacitor/haptics';
import { soundEngine } from '../lib/sound/soundEngine';
import { useGameAnnouncements } from '../components/common/LiveAnnouncer';
import { useI18n } from '../lib/i18n';

export default function Home() {
    const { t, locale } = useI18n();
    const { theme, toggleTheme } = useBoardTheme();
    const [isBoardLoading] = useState(false);
    const modals = useGameModals();

    // Initialisation du moteur de jeu
    const game = useBackgammonGame({
        matchLength: 7,
        autoOpponent: true,
        opponentDelayMs: 600,
        stepDelayMs: 900,
        locale,
        onGameOver: (result) => {
            const title =
                result.winType === 'backgammon' ? '👑 BACKGAMMON (3x) !'
                : result.winType === 'gammon' ? '🎉 GAMMON (2x) !'
                : result.winType === 'pass' ? '🏳️ Abandon de videau'
                : '⚡ Victoire simple (1x) !';
            toast.success(`Le Joueur ${result.winner} remporte la manche (+${result.pointsWon} pts) contre ${result.loser}.`, title);
            notificationSuccess();
            soundEngine.playVictory();

            if (isMultiplayerActive) {
                multiplayer.handleMatchOver(result.winner, result.winType, result.pointsWon);
            }
            handleGameOverAnalysis(result);
        },
    });

    // Tirage au sort initial (Roll-off) connecté au moteur de jeu
    const handleRollOffSuccess = useCallback((winner: Player, dice: [number, number]) => {
        if (winner === 'X') {
            game.applyRemoteState({
                board: game.state.board,
                dice,
                turn: 'X',
                usedDice: [false, false],
                phase: 'PLAYING_MOVES',
            });
            toast.success(`Vous commencez la manche avec les dés [${dice[0]}, ${dice[1]}] !`, 'Tirage au sort');
            soundEngine.playDiceRoll();
        } else {
            game.applyRemoteState({
                board: game.state.board,
                dice,
                turn: 'O',
                usedDice: [false, false],
                phase: game.autoOpponent ? 'OPPONENT_THINKING' : 'PLAYING_MOVES',
            });
            toast.info(`L'ordinateur commence la manche avec les dés [${dice[1]}, ${dice[0]}].`, 'Tirage au sort');
            soundEngine.playDiceRoll();
        }
    }, [game]);

    const { rollOff, rollOffDone, handleRollOff } = useRollOff({ onSuccess: handleRollOffSuccess });

    // Écouteur des actions distantes multijoueur
    const handleRemoteAction = useCallback((action: RealtimeBroadcastAction) => {
        if (action.type === 'DICE_ROLLED') {
            game.rollDice(action.dice);
            toast.info(`L'adversaire a lancé [${action.dice[0]}, ${action.dice[1]}].`, 'Dés adverses');
        } else if (action.type === 'CHECKER_MOVED') {
            game.applyRemoteState({ board: action.board, usedDice: action.usedDice });
        } else if (action.type === 'TURN_FINISHED') {
            game.applyRemoteState({ board: game.state.board, turn: action.nextTurn, dice: null, usedDice: [false, false], phase: 'WAITING_FOR_ROLL' });
        } else if (action.type === 'DOUBLE_OFFERED') {
            game.offerDouble();
            toast.info(`L'adversaire propose de doubler à ${action.cubeValue} !`, 'Proposition de double');
        } else if (action.type === 'DOUBLE_ACCEPTED') {
            game.takeDouble();
            toast.success(`L'adversaire a accepté le videau à ${action.cubeValue}.`, 'Double accepté');
        } else if (action.type === 'DOUBLE_PASSED') {
            game.passDouble();
            toast.warning(`L'adversaire abandonne le videau. Vous gagnez la manche !`, 'Videau passé');
        }
    }, [game]);

    const multiplayer = useMultiplayerGame(handleRemoteAction);
    const isMultiplayerActive = multiplayer.status === 'connected' || multiplayer.status === 'opponent_disconnected';

    // Persistance locale et analyse de fin de partie
    const {
        gameIdRef, turnsHistoryRef, currentTurnMovesRef, turnBoardBeforeRef,
        currentTurnDiceRef, latestGameAnalysis, handleGameOverAnalysis, resetGameHistory,
    } = useGamePersistence({ game, isMultiplayerActive, t });

    // Coach IA en temps réel
    const {
        coach, coachHighlight, matchStats, matchStatsX, matchStatsO, optimalStreak, brilliantMove,
        isAnalyzing, dismissCoach, replayMove: handleReplayMove, triggerCoach: handleTriggerCoach,
    } = useCoach({
        game, currentTurnMovesRef, currentTurnDiceRef, turnBoardBeforeRef,
        onCoachTriggered: modals.openMobileDrawer,
    });

    const prX = matchStatsX.decisionsCount > 0 ? (matchStatsX.totalEquityLoss / matchStatsX.decisionsCount) * 500 : null;
    const prO = matchStatsO.decisionsCount > 0 ? (matchStatsO.totalEquityLoss / matchStatsO.decisionsCount) * 500 : null;

    // Interaction pions et dés
    const {
        activeDie, handlePlayMove, handleSelectDie, handleDieDoubleClick,
        handleCheckerClick, handleCheckerDoubleClick, handleCheckerRightClick,
        handleDestinationClick, handleDeselect,
    } = useCheckerInteractions({ game, isMultiplayerActive, multiplayer, currentTurnMovesRef });

    // Assistant de coup d'ouverture certifié
    const {
        openingEntry, isOpeningDismissed, dismissOpening,
        isOpeningHighlightActive, toggleOpeningHighlight, handleApplyOpeningMove,
        isLiveAdviceEnabled, toggleLiveAdvice,
    } = useOpeningAssistant({
        game, isMultiplayerActive, multiplayer, currentTurnMovesRef,
        historyLength: turnsHistoryRef.current.length,
    });

    // Synchronisation match multijoueur
    useEffect(() => {
        if (multiplayer.status === 'matched' && multiplayer.matchInfo) {
            game.resetMatch();
            modals.closeMatchmaking();
            toast.success(`Match contre ${multiplayer.opponentProfile?.displayName} en ${multiplayer.matchInfo.matchLength} pts.`, 'Partie Multijoueur');
        }
    }, [multiplayer.status, multiplayer.matchInfo, multiplayer.opponentProfile, modals, game]);


    const activeCoachHighlight = useMemo(() => {
        if (openingEntry && isOpeningHighlightActive) return { optimal: openingEntry.bestMoves, played: [] };
        if (coach) return coachHighlight;
        return null;
    }, [openingEntry, isOpeningHighlightActive, coach, coachHighlight]);

    // Accessibilité WCAG
    useGameAnnouncements({
        state: game.state,
        phase: game.phase,
        selectedPoint: game.selected?.point ?? null,
        activeDie,
        leftTargetsCount: game.leftDieTargets.size,
        rightTargetsCount: game.rightDieTargets.size,
        canDouble: game.canDouble,
        doublingOfferedBy: game.doublingOfferedBy,
        opponentStatusMessage: game.opponentStatusMessage,
    });

    const mainAmbianceClass =
        theme === 'snowie_classic'
            ? 'bg-[#120703] bg-[radial-gradient(ellipse_95%_70%_at_50%_15%,#3a1d10_0%,#1a0c06_45%,#080302_100%)] text-amber-50 selection:bg-amber-600'
            : theme === 'tournament'
                ? 'bg-[#0a180f] bg-[radial-gradient(ellipse_95%_70%_at_50%_15%,#183a24_0%,#0c1f14_50%,#040a06_100%)] text-slate-100 selection:bg-emerald-600'
                : 'bg-slate-950 text-slate-100 selection:bg-amber-500';

    return (
        <main className={`h-dvh max-h-dvh w-full grid grid-rows-[minmax(0,auto)_minmax(0,1fr)] overflow-hidden p-1 sm:p-2 select-none transition-colors duration-500 ${mainAmbianceClass}`}>
            {/* 1. HUD & Actions de jeu */}
            <MatchHeader
                t={t}
                theme={theme}
                onToggleTheme={toggleTheme}
                optimalStreak={optimalStreak}
                brilliantMove={brilliantMove}
                game={game}
                isBoardLoading={isBoardLoading}
                isMultiplayerActive={isMultiplayerActive}
                multiplayer={multiplayer}
                onOpenMultiplayer={modals.openMatchmaking}
                onOpenOpeningBook={modals.openOpeningBook}
                onOpenExportImport={modals.openExportImport}
                onOpenKnowledgeBase={modals.openKnowledgeBase}
                onTriggerCoach={handleTriggerCoach}
                rollOffDone={rollOffDone}
                rollOff={rollOff}
                onRollOff={handleRollOff}
                openingEntry={openingEntry}
                onApplyOpeningMove={handleApplyOpeningMove}
                onDismissOpening={dismissOpening}
                isOpeningHighlightActive={isOpeningHighlightActive}
                onToggleOpeningHighlight={toggleOpeningHighlight}
                isLiveAdviceEnabled={isLiveAdviceEnabled}
                onToggleLiveAdvice={() => {
                    toggleLiveAdvice();
                    const next = !isLiveAdviceEnabled;
                    if (next) {
                        toast.info("Conseils IA en direct ACTIVÉS — L'IA affiche les coups Book recommandés.", 'IA en direct');
                    } else {
                        toast.info('Conseils IA en direct DÉSACTIVÉS — Jouez en toute autonomie sans spoiler.', 'IA en direct');
                    }
                }}
                onChangeDifficulty={(diff) => {
                    game.setDifficulty(diff);
                    const names: Record<AIDifficulty, string> = { beginner: 'Novice (0-ply)', expert: 'Maître (2-ply)', grandmaster: 'Tardieu (3-ply)' };
                    toast.info(`Niveau de l’adversaire : ${names[diff]}`, 'Difficulté IA');
                }}
                turnsCount={turnsHistoryRef.current.length}
                prX={prX}
                prO={prO}
            />

            {/* 2. Plateau et Panneau Coach latéral */}
            <GameBoardArea
                theme={theme}
                game={game}
                activeDie={activeDie}
                isBoardLoading={isBoardLoading}
                activeCoachHighlight={activeCoachHighlight}
                onCheckerClick={handleCheckerClick}
                onCheckerDoubleClick={handleCheckerDoubleClick}
                onCheckerRightClick={handleCheckerRightClick}
                onDestinationClick={handleDestinationClick}
                onPlayMove={handlePlayMove}
                onSelectDie={handleSelectDie}
                onDieDoubleClick={handleDieDoubleClick}
                onDeselect={handleDeselect}
                coach={coach}
                isAnalyzing={isAnalyzing}
                onDismissCoach={dismissCoach}
                onReplayMove={handleReplayMove}
                onOpenKnowledgeConcept={modals.openKnowledgeBase}
                onTriggerCoach={handleTriggerCoach}
                matchStats={matchStats}
                matchStatsO={matchStatsO}
                gameId={gameIdRef.current}
                turnsHistory={turnsHistoryRef.current}
            />


            {/* 3. Tiroir mobile du Coach */}
            <CoachMobileDrawer
                isOpen={modals.isMobileDrawerOpen}
                onOpen={modals.openMobileDrawer}
                onClose={modals.closeMobileDrawer}
                coach={coach}
                isAnalyzing={isAnalyzing}
                matchStats={matchStats}
                matchStatsO={matchStatsO}
                onReplayMove={handleReplayMove}
                onDismiss={dismissCoach}
                onOpenKnowledgeConcept={modals.openKnowledgeBase}
                matchContext={{
                    scoreX: game.state.scoreX,
                    scoreO: game.state.scoreO,
                    matchLength: game.state.matchLength,
                    cubeValue: game.state.cubeValue,
                    cubeOwner: game.state.cubeOwner,
                    crawford: game.state.crawford,
                }}
                positionKey={game.state.board.join(',')}
                gameId={gameIdRef.current}
                dice={game.dice}
                board={game.state.board}
            />

            {/* 4. Modales secondaires et overlay du jeu */}
            <GameModalsContainer
                theme={theme}
                modals={modals}
                game={game}
                multiplayer={multiplayer}
                isMultiplayerActive={isMultiplayerActive}
                latestGameAnalysis={latestGameAnalysis}
                turnsHistory={turnsHistoryRef.current}
                openingEntry={openingEntry}
                onApplyOpeningMove={openingEntry ? () => handleApplyOpeningMove(openingEntry.bestMoves) : undefined}
                onResetGameHistory={resetGameHistory}
            />
        </main>
    );
}