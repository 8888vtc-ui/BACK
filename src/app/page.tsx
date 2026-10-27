'use client';

/**
 * Page principale de jeu Backgammon — architecture à 3 vues EXCLUSIVES (LOBBY, GAME, SUMMARY).
 * Loi 5 de Scalabilité : strictement 0 any, < 300 lignes.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LobbyView, SummaryView, type LobbyModuleId } from '../components/lobby/AppScreenViews';
import type { LobbySelection } from '../components/lobby/LobbyScreen';
import GameScreenView from '../components/board/GameScreenView';
import GameModalsContainer from '../components/modals/GameModalsContainer';
import PageTransition, { useSpaNavigation } from '../components/nav/PageTransition';
import { useBoardTheme } from '../hooks/useBoardTheme';
import { useBackgammonGame } from '../hooks/useBackgammonGame';
import { useCoach } from '../hooks/useCoach';
import { useMultiplayerGame } from '../hooks/useMultiplayerGame';
import { useCheckerInteractions } from '../hooks/useCheckerInteractions';
import { usePlatformControlsRouter } from '../hooks/usePlatformControlsRouter';
import { useCandidateHighlight } from '../hooks/useCandidateHighlight';
import { useGamePersistence } from '../hooks/useGamePersistence';
import { useGameModals } from '../hooks/useGameModals';
import { useOpeningAssistant } from '../hooks/useOpeningAssistant';
import { useMatchBootstrap } from '../hooks/useMatchBootstrap';
import { toast } from '../components/toast/ToastContext';
import { notificationSuccess } from '../lib/capacitor/haptics';
import { soundEngine } from '../lib/sound/soundEngine';
import { useCheckerSoundFeedback } from '../hooks/useCheckerSoundFeedback';
import { useGameAnnouncements } from '../components/common/LiveAnnouncer';
import { useI18n } from '../lib/i18n';
import { readStoredPlayerColor } from '../components/hud/ColorSelector';
import type { Player } from '../engine/backgammonEngine';

/** Vues exclusives de l'application (une seule montée à la fois). */
type AppScreen = 'LOBBY' | 'GAME' | 'SUMMARY';

export default function Home() {
    const { t, locale } = useI18n();
    const { theme, toggleTheme } = useBoardTheme();
    const { navigateTo, isNavigating } = useSpaNavigation();
    const [isBoardLoading] = useState(false);
    const [playerColor, setPlayerColor] = useState<Player>('X');
    const modals = useGameModals();

    // État maître : aucune modale superposée au plateau au démarrage.
    const [appScreen, setAppScreen] = useState<AppScreen>('LOBBY');
    const userInitiatedMultiplayerRef = useRef<boolean>(false);

    // Anti-hydratation : lecture des préférences post-montage client
    useEffect(() => {
        setPlayerColor(readStoredPlayerColor());
    }, []);

    // Initialisation du moteur de jeu (autoConfirmTurn à false par défaut, persisté dans localStorage).
    const game = useBackgammonGame({
        matchLength: 7,
        playerColor: 'X',
        autoOpponent: true,
        locale,
        onGameOver: (result) => {
            const title =
                result.winType === 'backgammon' ? '👑 BACKGAMMON (3x) !'
                    : result.winType === 'gammon' ? '🎉 GAMMON (2x) !'
                        : result.winType === 'pass' ? '🏳️ Abandon de videau'
                            : '⚡ Victoire simple (1x) !';
            const ptsLabel = result.pointsWon > 1 ? `+${result.pointsWon} pts` : '+1 pt';
            const summaryText = result.winner === 'X'
                ? `Vous remportez la manche (${ptsLabel}) !`
                : `L'adversaire remporte la manche (${ptsLabel}).`;
            toast.success(summaryText, title);
            notificationSuccess();
            soundEngine.playVictory();

            if (isMultiplayerActive) {
                multiplayer.handleMatchOver(result.winner, result.winType, result.pointsWon);
            }
            handleGameOverAnalysis(result);
        },
    });

    // Routage des actions distantes multijoueur.
    const { handleRemoteAction } = useMatchBootstrap(game);

    const multiplayer = useMultiplayerGame(handleRemoteAction);
    const isMultiplayerActive = multiplayer.status === 'connected' || multiplayer.status === 'opponent_disconnected';

    // Persistance locale et analyse de fin de partie
    const {
        gameIdRef, turnsHistory, turnsHistoryRef, currentTurnMovesRef, turnBoardBeforeRef,
        currentTurnDiceRef, latestGameAnalysis, handleGameOverAnalysis, resetGameHistory,
    } = useGamePersistence({ game, isMultiplayerActive, t });

    // Coach IA en temps réel
    const {
        coach, coachHighlight, matchStats, matchStatsX, matchStatsO, lastMoveFeedback,
        coachHistory, selectedCoachHistoryIndex, selectCoachHistoryIndex,
        notificationLevel, setNotificationLevel,
        isAnalyzing, dismissCoach, replayMove: handleReplayMove, triggerCoach: handleTriggerCoach,
    } = useCoach({
        game, currentTurnMovesRef, currentTurnDiceRef, turnBoardBeforeRef,
        onCoachTriggered: modals.openMobileDrawer,
    });

    const prX = matchStatsX.decisionsCount > 0 ? (matchStatsX.totalEquityLoss / matchStatsX.decisionsCount) * 500 : null;
    const prO = matchStatsO.decisionsCount > 0 ? (matchStatsO.totalEquityLoss / matchStatsO.decisionsCount) * 500 : null;

    // Interaction pions et dés
    const {
        activeDie, preferredDie, handlePlayMove, handleSelectDie,
        handleCheckerClick, handleCheckerRightClick,
        handleDestinationClick, handleDeselect, handleSwapDice,
    } = useCheckerInteractions({ game, isMultiplayerActive, multiplayer, currentTurnMovesRef });

    // Feedback sonore des coups
    const handlePlayMoveWithSound = useCheckerSoundFeedback({
        board: game.state.board,
        turn: game.state.turn,
        onPlayMove: handlePlayMove,
    });

    // Contrôles spécifiques à la plateforme (tactile vs souris)
    const { routedCheckerClick, routedCheckerRightClick, routedDiceClick } = usePlatformControlsRouter({
        game,
        onPlayMoveWithSound: handlePlayMoveWithSound,
        handleSwapDice,
        preferredDie,
        activeDie,
    });

    // Assistant de coup d'ouverture certifié
    const {
        openingEntry, isOpeningHighlightActive, handleApplyOpeningMove,
        isLiveAdviceEnabled, toggleLiveAdvice,
    } = useOpeningAssistant({
        game, isMultiplayerActive, multiplayer, currentTurnMovesRef,
        historyLength: turnsHistoryRef.current.length,
    });

    // Synchronisation match multijoueur (uniquement sur action explicite de l'utilisateur)
    useEffect(() => {
        if (userInitiatedMultiplayerRef.current && multiplayer.status === 'matched' && multiplayer.matchInfo) {
            game.resetMatch();
            modals.closeMatchmaking();
            setAppScreen('GAME');
            toast.success(`Match contre ${multiplayer.opponentProfile?.displayName} en ${multiplayer.matchInfo.matchLength} pts.`, 'Partie Multijoueur');
        }
    }, [multiplayer.status, multiplayer.matchInfo, multiplayer.opponentProfile, modals, game]);

    /** Démarre le match depuis le lobby et bascule sur la vue GAME. */
    const handleLobbyStart = useCallback((selection: LobbySelection) => {
        userInitiatedMultiplayerRef.current = false;
        if (selection.playerColor) {
            setPlayerColor(selection.playerColor);
        }
        game.startNewMatch(selection.matchLength, selection.difficulty);
        resetGameHistory();
        if (selection.coachEnabled !== isLiveAdviceEnabled) {
            toggleLiveAdvice();
        }
        setAppScreen('GAME');
        const formatLabel = selection.matchLength === 0 ? 'Money Game' : `Match en ${selection.matchLength} pts`;
        toast.success(`${formatLabel} — ${selection.coachEnabled ? 'Mode Formation' : 'Mode Tournoi'}.`, 'Match lancé');
    }, [game, resetGameHistory, isLiveAdviceEnabled, toggleLiveAdvice]);

    /** Retour au lobby. */
    const handleBackToLobby = useCallback(() => {
        userInitiatedMultiplayerRef.current = false;
        setAppScreen('LOBBY');
    }, []);

    /** Routage SPA fluide des modules ouverts depuis le lobby (0 window.location.href). */
    const handleOpenLobbyModule = useCallback((moduleId: LobbyModuleId) => {
        switch (moduleId) {
            case 'multiplayer':
                userInitiatedMultiplayerRef.current = true;
                modals.openMatchmaking();
                break;
            case 'openings':
                modals.openOpeningBook();
                break;
            case 'stats':
                if (latestGameAnalysis) {
                    modals.openGameReview();
                } else {
                    navigateTo('/progression');
                }
                break;
            case 'drills':
                navigateTo('/drills');
                break;
            case 'puzzles':
                navigateTo('/puzzles');
                break;
            case 'import_export':
                modals.openExportImport();
                break;
        }
    }, [modals, navigateTo, latestGameAnalysis]);

    // Survol d'une ligne du tableau des candidats
    const [hoveredCandidate, setHoveredCandidate] = useState<string | null>(null);

    const activeCoachHighlight = useCandidateHighlight({
        openingEntry,
        isOpeningHighlightActive,
        coach,
        coachHighlight,
        hoveredCandidate,
    });

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

    if (appScreen === 'LOBBY') {
        return (
            <PageTransition isTransitioning={isNavigating}>
                <LobbyView onStart={handleLobbyStart} onOpenModule={handleOpenLobbyModule} initialMatchLength={7} initialCoachEnabled={isLiveAdviceEnabled} />
                <GameModalsContainer
                    theme={theme} modals={modals} game={game} multiplayer={multiplayer}
                    isMultiplayerActive={isMultiplayerActive} latestGameAnalysis={latestGameAnalysis}
                    turnsHistory={turnsHistory} openingEntry={openingEntry}
                    onApplyOpeningMove={openingEntry ? () => handleApplyOpeningMove(openingEntry.bestMoves) : () => { }}
                    onResetGameHistory={resetGameHistory}
                    locale={locale}
                />
            </PageTransition>
        );
    }

    if (appScreen === 'SUMMARY') {
        return (
            <SummaryView
                scoreX={game.state.scoreX} scoreO={game.state.scoreO} ambianceClass={mainAmbianceClass}
                onReviewBoard={() => setAppScreen('GAME')} onBackToLobby={handleBackToLobby}
            />
        );
    }

    return (
        <GameScreenView
            ambianceClass={mainAmbianceClass} t={t} locale={locale} theme={theme} onToggleTheme={toggleTheme}
            game={game} isMultiplayerActive={isMultiplayerActive} multiplayer={multiplayer} modals={modals}
            coach={coach} coachHighlight={activeCoachHighlight} isAnalyzing={isAnalyzing}
            matchStats={matchStats} matchStatsO={matchStatsO} prX={prX} prO={prO}
            hoveredCandidate={hoveredCandidate} onCandidateHover={setHoveredCandidate}
            onDismissCoach={dismissCoach} onReplayMove={handleReplayMove} onTriggerCoach={handleTriggerCoach}
            coachHistory={coachHistory} selectedCoachHistoryIndex={selectedCoachHistoryIndex}
            onSelectCoachHistoryIndex={selectCoachHistoryIndex} lastMoveFeedback={lastMoveFeedback}
            notificationLevel={notificationLevel} onChangeNotificationLevel={setNotificationLevel}
            activeDie={activeDie} isBoardLoading={isBoardLoading}
            onCheckerClick={routedCheckerClick} onCheckerRightClick={routedCheckerRightClick}
            onDestinationClick={handleDestinationClick} onPlayMove={handlePlayMoveWithSound}
            onSelectDie={handleSelectDie} onDiceClick={routedDiceClick} onDeselect={handleDeselect}
            turnsCount={turnsHistory.length} onBackToLobby={handleBackToLobby}
            latestGameAnalysis={latestGameAnalysis} turnsHistory={turnsHistory} openingEntry={openingEntry}
            onApplyOpeningMove={openingEntry ? () => handleApplyOpeningMove(openingEntry.bestMoves) : () => { }}
            onResetGameHistory={resetGameHistory} gameId={gameIdRef.current} playerColor={playerColor}
        />
    );
}
