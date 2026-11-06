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
import { usePrivateRoomInvite } from '../hooks/usePrivateRoomInvite';
import { toast } from '../components/toast/ToastContext';
import { notificationSuccess } from '../lib/capacitor/haptics';
import { soundEngine } from '../lib/sound/soundEngine';
import { useCheckerSoundFeedback } from '../hooks/useCheckerSoundFeedback';
import { useGameAnnouncements } from '../components/common/LiveAnnouncer';
import { useI18n } from '../lib/i18n';
import { readStoredPlayerColor } from '../components/hud/ColorSelector';
import { getBotRealPr, resetBotRealPr } from '../features/personas/botRealPr';
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

    const [appScreen, setAppScreen] = useState<AppScreen>('LOBBY');
    const userInitiatedMultiplayerRef = useRef<boolean>(false);
    const hasAutoStartedRef = useRef<boolean>(false);
    const livePrRef = useRef<{ prX: number; prO: number | null }>({ prX: 0, prO: null });

    useEffect(() => {
        setPlayerColor(readStoredPlayerColor());
    }, []);

    const game = useBackgammonGame({
        matchLength: 7,
        playerColor: 'X',
        autoOpponent: true,
        locale,
        onGameOver: (result) => {
            const title = result.winType === 'backgammon' ? '👑 BACKGAMMON (3x) !' : result.winType === 'gammon' ? '🎉 GAMMON (2x) !' : result.winType === 'pass' ? '🏳️ Abandon de videau' : '⚡ Victoire simple (1x) !';
            const ptsLabel = result.pointsWon > 1 ? `+${result.pointsWon} pts` : '+1 pt';
            const summaryText = result.winner === 'X' ? `Vous remportez la manche (${ptsLabel}) !` : `L'adversaire remporte la manche (${ptsLabel}).`;
            toast.success(summaryText, title);
            notificationSuccess();
            soundEngine.playVictory();

            const completedAnalysis = handleGameOverAnalysis(result);
            if (isMultiplayerActive || multiplayer.matchInfo?.isClubChallenger) {
                multiplayer.handleMatchOver(result.winner, result.winType, result.pointsWon, {
                    prX: completedAnalysis ? completedAnalysis.performanceRating : livePrRef.current.prX,
                    prO: livePrRef.current.prO,
                    decisionsCount: Math.max(6, turnsHistoryRef.current.length),
                    isPrivateRoom: Boolean(multiplayer.privateRoomCode),
                });
            }
        },
    });

    const { handleRemoteAction } = useMatchBootstrap(game);
    const multiplayer = useMultiplayerGame(handleRemoteAction);
    const isMultiplayerActive = multiplayer.status === 'connected' || multiplayer.status === 'opponent_disconnected';
    const isLiveMatch =
        isMultiplayerActive ||
        Boolean(multiplayer.matchInfo?.isClubChallenger) ||
        Boolean(multiplayer.opponentProfile) ||
        Boolean(multiplayer.privateRoomCode);
    const handledMatchRoomIdRef = useRef<string | null>(null);

    const {
        gameIdRef, turnsHistory, turnsHistoryRef, currentTurnMovesRef, turnBoardBeforeRef,
        currentTurnDiceRef, latestGameAnalysis, handleGameOverAnalysis, resetGameHistory,
    } = useGamePersistence({ game, isMultiplayerActive, t });

    const {
        coach, coachHighlight, matchStats, matchStatsX, matchStatsO, lastMoveFeedback,
        coachHistory, selectedCoachHistoryIndex, selectCoachHistoryIndex,
        notificationLevel, setNotificationLevel,
        isAnalyzing, dismissCoach, replayMove: handleReplayMove, triggerCoach: rawTriggerCoach,
    } = useCoach({
        game: isLiveMatch ? { ...game, matchLog: [], moveHistory: [] } : game,
        currentTurnMovesRef, currentTurnDiceRef, turnBoardBeforeRef,
    });

    const handleTriggerCoach = useCallback(() => {
        if (isLiveMatch) {
            toast.info(
                locale === 'en' ? 'Live Match Mode (Zero Live AI)' : 'Mode Match Live (Zéro IA en direct)',
                locale === 'en'
                    ? 'For fairness, AI analysis is performed in the Post-Match Report and Personal Blunders.'
                    : 'Pour garantir la fluidité et l’équité, l’analyse IA s’effectue au Compte-Rendu de fin de match et dans vos derniers Blunders.',
            );
            return;
        }
        void rawTriggerCoach();
    }, [isLiveMatch, locale, rawTriggerCoach]);

    const MIN_DECISIONS_FOR_PR = 2;
    const prX = matchStatsX.decisionsCount >= MIN_DECISIONS_FOR_PR ? Number(Math.max(0, (matchStatsX.totalEquityLoss / matchStatsX.decisionsCount) * 500).toFixed(1)) : null;
    const botMatchLogLength = game.matchLog.length;
    useEffect(() => { if (botMatchLogLength === 0) resetBotRealPr(); }, [botMatchLogLength]);
    const botRealSnapshot = getBotRealPr();
    const measuredBotPr = botRealSnapshot.decisions >= MIN_DECISIONS_FOR_PR ? botRealSnapshot.pr : null;
    const rawBotPr = matchStatsO.decisionsCount >= MIN_DECISIONS_FOR_PR ? (matchStatsO.totalEquityLoss / matchStatsO.decisionsCount) * 500 : measuredBotPr;
    const prO = typeof rawBotPr === 'number' && Number.isFinite(rawBotPr) ? Number(Math.max(0, rawBotPr).toFixed(1)) : null;
    livePrRef.current = { prX: prX ?? 0, prO };

    const { activeDie, preferredDie, handlePlayMove, handleSelectDie, handleCheckerClick, handleCheckerRightClick, handleDestinationClick, handleDeselect, handleSwapDice } = useCheckerInteractions({ game, isMultiplayerActive, multiplayer, currentTurnMovesRef });
    const handlePlayMoveWithSound = useCheckerSoundFeedback({ board: game.state.board, turn: game.state.turn, onPlayMove: handlePlayMove });
    const { routedCheckerClick, routedCheckerRightClick, routedDiceClick } = usePlatformControlsRouter({ game, onPlayMoveWithSound: handlePlayMoveWithSound, handleSwapDice, preferredDie, activeDie });
    const { openingEntry, isOpeningHighlightActive, handleApplyOpeningMove, isLiveAdviceEnabled, toggleLiveAdvice } = useOpeningAssistant({ game, isMultiplayerActive, multiplayer, currentTurnMovesRef, historyLength: turnsHistoryRef.current.length, isLiveAdviceEnabled: isLiveMatch ? false : undefined });

    useEffect(() => {
        if (multiplayer.status === 'matched' && multiplayer.matchInfo && handledMatchRoomIdRef.current !== multiplayer.matchInfo.roomId) {
            handledMatchRoomIdRef.current = multiplayer.matchInfo.roomId;
            userInitiatedMultiplayerRef.current = false;
            const matchLen = multiplayer.matchInfo.matchLength;
            if (multiplayer.matchInfo.localRole) setPlayerColor(multiplayer.matchInfo.localRole);
            const opp = multiplayer.opponentProfile;
            const isEn = locale === 'en';
            const isGuestLocal = Boolean(multiplayer.localProfile.isGuest);
            const matchMetaLabel = isGuestLocal
                ? (isEn ? 'Online · Casual Match' : 'En ligne · Match Amical')
                : `${opp?.rating ?? 1500} Elo`;
            const lenText = matchLen === 0 ? 'Money Game' : `${matchLen} pts`;
            if (multiplayer.matchInfo.isClubChallenger && opp) {
                const challengerDiff = opp.clubBotDifficulty && opp.clubBotDifficulty !== 'beginner' ? opp.clubBotDifficulty : 'intermediate';
                window.setTimeout(() => {
                    game.startNewMatch(matchLen, challengerDiff);
                    resetGameHistory(); modals.closeMatchmaking(); modals.closePrivateRoomModal();
                    setAppScreen('GAME');
                    window.setTimeout(() => { game.rollDice(); }, 180);
                    toast.success(isEn ? `Match vs ${opp.displayName} (${matchMetaLabel}) — ${lenText}.` : `Match contre ${opp.displayName} (${matchMetaLabel}) en ${lenText}.`, isEn ? 'Opponent Found' : 'Adversaire Trouvé');
                }, 1350);
                return;
            }
            game.resetMatch(); modals.closeMatchmaking(); modals.closePrivateRoomModal(); setAppScreen('GAME');
            toast.success(isEn ? `Match vs ${opp?.displayName} (${matchMetaLabel}) — ${lenText}.` : `Match contre ${opp?.displayName} (${matchMetaLabel}) en ${lenText}.`, isEn ? 'Online Match' : 'Partie Multijoueur');
        }
    }, [multiplayer.status, multiplayer.matchInfo, multiplayer.opponentProfile, multiplayer.localProfile.isGuest, locale, modals, game, resetGameHistory]);

    const lastBroadcastDiceRef = useRef<string | null>(null);
    useEffect(() => {
        if (!isMultiplayerActive || !game.dice || game.state.turn !== playerColor) return;
        const diceKey = `${game.state.turn}:${game.dice[0]}-${game.dice[1]}:${game.matchLog.length}`;
        if (lastBroadcastDiceRef.current !== diceKey) {
            lastBroadcastDiceRef.current = diceKey;
            multiplayer.broadcastDiceRolled(game.dice);
        }
    }, [isMultiplayerActive, game.dice, game.state.turn, playerColor, game.matchLog.length, multiplayer]);

    usePrivateRoomInvite({
        onAutoJoinRoom: useCallback((code: string) => { userInitiatedMultiplayerRef.current = true; modals.openPrivateRoomModal(code); }, [modals]),
        onAutoStartTournamentMatch: useCallback((len: number, tourneyName: string | null) => {
            userInitiatedMultiplayerRef.current = false; multiplayer.leaveMatch();
            game.startNewMatch(len, 'expert'); resetGameHistory(); setAppScreen('GAME');
            window.setTimeout(() => { game.rollDice(); }, 160);
            toast.success(tourneyName ? `${tourneyName} (${len} pts)` : `Match de tournoi en ${len} pts`, 'Entraînement Tournoi');
        }, [game, multiplayer, resetGameHistory]),
    });

    const handleLobbyStart = useCallback((selection: LobbySelection) => {
        userInitiatedMultiplayerRef.current = false;
        multiplayer.leaveMatch();
        if (selection.playerColor) setPlayerColor(selection.playerColor);
        game.startNewMatch(selection.matchLength, selection.difficulty);
        resetGameHistory();
        if (selection.coachEnabled !== isLiveAdviceEnabled) toggleLiveAdvice();
        setAppScreen('GAME');
        window.setTimeout(() => { game.rollDice(); }, 160);
        const isEn = locale === 'en';
        const formatLabel = selection.matchLength === 0 ? 'Money Game' : (isEn ? `${selection.matchLength} pts Match` : `Match en ${selection.matchLength} pts`);
        const modeLabel = selection.coachEnabled ? (isEn ? 'Training Mode' : 'Mode Formation') : (isEn ? 'Tournament Mode' : 'Mode Tournoi');
        toast.success(`${formatLabel} — ${modeLabel}.`, isEn ? 'Match Started' : 'Match lancé');
    }, [game, multiplayer, locale, resetGameHistory, isLiveAdviceEnabled, toggleLiveAdvice]);

    useEffect(() => {
        if (typeof window !== 'undefined' && !hasAutoStartedRef.current) {
            const params = new URLSearchParams(window.location.search);
            const modeParam = params.get('mode');
            if (modeParam === 'matchmaking' || modeParam === 'online' || params.get('invite') === '1') {
                hasAutoStartedRef.current = true;
                userInitiatedMultiplayerRef.current = true;
                modals.openMatchmaking();
            } else if (params.get('start') === 'guided' || window.location.pathname.startsWith('/play')) {
                hasAutoStartedRef.current = true;
                handleLobbyStart({ matchLength: 3, difficulty: 'beginner', coachEnabled: true, playerColor: 'X', clockPreset: 'normal' });
            }
        }
    }, [handleLobbyStart, modals]);

    const handleBackToLobby = useCallback(() => {
        userInitiatedMultiplayerRef.current = false;
        setAppScreen('LOBBY');
    }, []);

    const handleOpenLobbyModule = useCallback((moduleId: LobbyModuleId) => {
        switch (moduleId) {
            case 'multiplayer': userInitiatedMultiplayerRef.current = true; modals.openMatchmaking(); break;
            case 'private_room': userInitiatedMultiplayerRef.current = true; modals.openPrivateRoomModal(); break;
            case 'openings': modals.openOpeningBook(); break;
            case 'stats': if (latestGameAnalysis) modals.openGameReview(); else navigateTo('/progression'); break;
            case 'drills': navigateTo('/drills'); break;
            case 'puzzles': navigateTo('/puzzles'); break;
            case 'import_export': modals.openExportImport(); break;
            case 'tournaments': navigateTo('/tournaments'); break;
        }
    }, [modals, navigateTo, latestGameAnalysis]);

    const [hoveredCandidate, setHoveredCandidate] = useState<string | null>(null);
    const activeCoachHighlight = useCandidateHighlight({
        openingEntry, isOpeningHighlightActive, coach, coachHighlight, hoveredCandidate,
    });

    useGameAnnouncements({
        state: game.state, phase: game.phase, selectedPoint: game.selected?.point ?? null, activeDie,
        leftTargetsCount: game.leftDieTargets.size, rightTargetsCount: game.rightDieTargets.size,
        canDouble: game.canDouble, doublingOfferedBy: game.doublingOfferedBy, opponentStatusMessage: game.opponentStatusMessage,
    });

    const mainAmbianceClass = theme === 'snowie_classic'
        ? 'bg-[#06110b] bg-[radial-gradient(ellipse_95%_70%_at_50%_15%,#0e2e1d_0%,#081b11_50%,#030805_100%)] text-slate-100 selection:bg-amber-500'
        : theme === 'tournament'
            ? 'bg-[#16070a] bg-[radial-gradient(ellipse_95%_70%_at_50%_15%,#38121a_0%,#1f090e_50%,#090304_100%)] text-slate-100 selection:bg-amber-600'
            : 'bg-slate-950 bg-[radial-gradient(ellipse_95%_70%_at_50%_15%,#162a4a_0%,#0b1528_50%,#020617_100%)] text-slate-100 selection:bg-amber-500';

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
