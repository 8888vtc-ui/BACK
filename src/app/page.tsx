'use client';

/**
 * Page principale de jeu Backgammon — architecture à 3 vues EXCLUSIVES.
 *
 * Rôle :
 *   Orchestre l'initialisation du moteur de jeu, du multijoueur temps réel, du coach IA,
 *   de la persistance locale et des modales. Le rendu est gouverné par un état maître
 *   `appScreen` :
 *     - `'LOBBY'`   : seul `LobbyScreen` est monté (ni plateau, ni HUD dans le DOM).
 *     - `'GAME'`    : HUD + plateau + coach + modales.
 *     - `'SUMMARY'` : résumé de fin de match (retour au lobby possible).
 *
 * Dépendances :
 *   `useBackgammonGame`, `useCoach`, `useMultiplayerGame`, `useCheckerInteractions`,
 *   `useGamePersistence`, `useGameModals`, `useOpeningAssistant`, `useRollOff`,
 *   `LobbyScreen`, `MatchHeader`, `GameBoardArea`, `CoachMobileDrawer`, `GameModalsContainer`.
 *
 * Retrait :
 *   Point d'entrée de l'application Next.js.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LobbyView, SummaryView, type LobbyModuleId } from '../components/lobby/AppScreenViews';
import type { LobbySelection } from '../components/lobby/LobbyScreen';
import GameScreenView from '../components/board/GameScreenView';
import { useBoardTheme } from '../hooks/useBoardTheme';
import { useBackgammonGame } from '../hooks/useBackgammonGame';
import { useCoach } from '../hooks/useCoach';
import { useMultiplayerGame } from '../hooks/useMultiplayerGame';
import { useCheckerInteractions } from '../hooks/useCheckerInteractions';
import { useDesktopControls } from '../hooks/useDesktopControls';
import { useMobileTouchControls } from '../hooks/useMobileTouchControls';
import { useIsTouchDevice } from '../hooks/useIsTouchDevice';
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

/** Vues exclusives de l'application (une seule montée à la fois). */
type AppScreen = 'LOBBY' | 'GAME' | 'SUMMARY';

export default function Home() {
    const { t, locale } = useI18n();
    const { theme, toggleTheme } = useBoardTheme();
    const [isBoardLoading] = useState(false);
    const modals = useGameModals();

    // État maître : aucune modale superposée au plateau au démarrage.
    const [appScreen, setAppScreen] = useState<AppScreen>('LOBBY');

    // Initialisation du moteur de jeu.
    //
    // IMPORTANT (anti-hydratation) : les valeurs initiales DOIVENT être des
    // constantes strictes, identiques côté serveur et côté client. Toute lecture
    // de `localStorage` ici produirait un HTML différent entre SSR et CSR et
    // déclencherait un `Hydration failed`. Les préférences persistées sont
    // appliquées uniquement au clic sur « DÉMARRER LE MATCH » (startNewMatch).
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
            toast.success(`Le Joueur ${result.winner} remporte la manche (+${result.pointsWon} pts) contre ${result.loser}.`, title);
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
        coach, coachHighlight, matchStats, matchStatsX, matchStatsO,
        isAnalyzing, dismissCoach, replayMove: handleReplayMove, triggerCoach: handleTriggerCoach,
    } = useCoach({
        game, currentTurnMovesRef, currentTurnDiceRef, turnBoardBeforeRef,
        onCoachTriggered: modals.openMobileDrawer,
    });

    const prX = matchStatsX.decisionsCount > 0 ? (matchStatsX.totalEquityLoss / matchStatsX.decisionsCount) * 500 : null;
    const prO = matchStatsO.decisionsCount > 0 ? (matchStatsO.totalEquityLoss / matchStatsO.decisionsCount) * 500 : null;

    // Interaction pions et dés
    const {
        activeDie, preferredDie, handlePlayMove, handleSelectDie, handleDieDoubleClick,
        handleCheckerClick, handleCheckerDoubleClick, handleCheckerRightClick,
        handleDestinationClick, handleDeselect, handleSwapDice,
    } = useCheckerInteractions({ game, isMultiplayerActive, multiplayer, currentTurnMovesRef });

    // Feedback sonore des coups (clac de pose / frappe sèche sur blot).
    const handlePlayMoveWithSound = useCheckerSoundFeedback({
        board: game.state.board,
        turn: game.state.turn,
        onPlayMove: handlePlayMove,
    });

    // Détection de plateforme : tactile (mobile) vs souris (desktop).
    const isTouchDevice = useIsTouchDevice();

    // Contrôles spécifiques à la plateforme (couches de présentation).
    // Desktop : One-Click TMG (smartClickCheckerAction + swapDiceOrderAction).
    const desktopControls = useDesktopControls({
        game,
        onPlayMove: handlePlayMoveWithSound,
        onSelectChecker: (point, die) => game.selectChecker(point, die),
        onSwapDice: () => handleSwapDice(),
        preferredDie,
    });
    // Mobile : tap-to-move + tap sur les dés = inversion de l'ordre.
    const mobileControls = useMobileTouchControls({
        game,
        onPlayMove: handlePlayMoveWithSound,
        activeDie,
        onSwapDice: handleSwapDice,
    });

    // Routage des handlers selon la plateforme :
    // - Desktop : one-click (clic gauche = dé 1, clic droit = dé 2).
    // - Mobile : tap-to-move (tap = dé actif le plus sûr).
    const routedCheckerClick = isTouchDevice ? mobileControls.handleTapPoint : desktopControls.handleOneClick;
    const routedCheckerRightClick = isTouchDevice ? mobileControls.handleTapPoint : desktopControls.handleOneRightClick;
    // Clic / tap sur la paire de dés : inverse l'ordre (swapDiceOrderAction).
    const routedDiceClick = isTouchDevice ? mobileControls.handleTapDice : desktopControls.handleDiceClick;

    // Assistant de coup d'ouverture certifié
    const {
        openingEntry, isOpeningHighlightActive, handleApplyOpeningMove,
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
            setAppScreen('GAME');
            toast.success(`Match contre ${multiplayer.opponentProfile?.displayName} en ${multiplayer.matchInfo.matchLength} pts.`, 'Partie Multijoueur');
        }
    }, [multiplayer.status, multiplayer.matchInfo, multiplayer.opponentProfile, modals, game]);

    /** Démarre le match depuis le lobby et bascule sur la vue GAME. */
    const handleLobbyStart = useCallback((selection: LobbySelection) => {
        game.startNewMatch(selection.matchLength, selection.difficulty);
        resetGameHistory();
        if (selection.coachEnabled !== isLiveAdviceEnabled) {
            toggleLiveAdvice();
        }
        setAppScreen('GAME');
        const formatLabel = selection.matchLength === 0 ? 'Money Game' : `Match en ${selection.matchLength} pts`;
        toast.success(`${formatLabel} — ${selection.coachEnabled ? 'Mode Formation' : 'Mode Tournoi'}.`, 'Match lancé');
    }, [game, resetGameHistory, isLiveAdviceEnabled, toggleLiveAdvice]);

    /** Retour au lobby (abandon de la vue courante). */
    const handleBackToLobby = useCallback(() => {
        setAppScreen('LOBBY');
    }, []);

    /** Routage des modules ouverts depuis le lobby. */
    const handleOpenLobbyModule = useCallback((moduleId: LobbyModuleId) => {
        switch (moduleId) {
            case 'multiplayer':
                modals.openMatchmaking();
                break;
            case 'openings':
                modals.openOpeningBook();
                break;
            case 'stats':
                modals.openGameReview();
                break;
            case 'drills':
                window.location.href = '/drills';
                break;
            case 'puzzles':
                window.location.href = '/puzzles';
                break;
        }
    }, [modals]);

    // Survol d'une ligne du tableau des candidats : notation du coup prévisualisé.
    const [hoveredCandidate, setHoveredCandidate] = useState<string | null>(null);

    const activeCoachHighlight = useMemo(() => {
        if (openingEntry && isOpeningHighlightActive) return { optimal: openingEntry.bestMoves, played: [] };
        if (!coach) return null;
        // Prévisualisation d'un candidat : on ne dessine que ses flèches.
        if (hoveredCandidate) {
            const candidate = coach.candidateMoves?.find((m) => m.notation === hoveredCandidate);
            if (candidate) {
                return { optimal: [], played: [] };
            }
        }
        return coachHighlight;
    }, [openingEntry, isOpeningHighlightActive, coach, coachHighlight, hoveredCandidate]);

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

    // ---------------------------------------------------------------------
    // VUE 1 — LOBBY : ni plateau, ni HUD dans le DOM.
    // ---------------------------------------------------------------------
    if (appScreen === 'LOBBY') {
        return (
            <LobbyView
                onStart={handleLobbyStart}
                onOpenModule={handleOpenLobbyModule}
                initialMatchLength={7}
                initialCoachEnabled={isLiveAdviceEnabled}
            />
        );
    }

    // ---------------------------------------------------------------------
    // VUE 3 — SUMMARY : résumé de fin de match.
    // ---------------------------------------------------------------------
    if (appScreen === 'SUMMARY') {
        return (
            <SummaryView
                scoreX={game.state.scoreX}
                scoreO={game.state.scoreO}
                ambianceClass={mainAmbianceClass}
                onReviewBoard={() => setAppScreen('GAME')}
                onBackToLobby={handleBackToLobby}
            />
        );
    }

    // ---------------------------------------------------------------------
    // VUE 2 — GAME : HUD + plateau + coach + modales.
    // ---------------------------------------------------------------------
    return (
        <GameScreenView
            ambianceClass={mainAmbianceClass}
            t={t}
            locale={locale}
            theme={theme}
            onToggleTheme={toggleTheme}
            game={game}
            isMultiplayerActive={isMultiplayerActive}
            multiplayer={multiplayer}
            modals={modals}
            coach={coach}
            coachHighlight={activeCoachHighlight}
            isAnalyzing={isAnalyzing}
            matchStats={matchStats}
            matchStatsO={matchStatsO}
            prX={prX}
            prO={prO}
            hoveredCandidate={hoveredCandidate}
            onCandidateHover={setHoveredCandidate}
            onDismissCoach={dismissCoach}
            onReplayMove={handleReplayMove}
            onTriggerCoach={handleTriggerCoach}
            activeDie={activeDie}
            isBoardLoading={isBoardLoading}
            onCheckerClick={routedCheckerClick}
            onCheckerDoubleClick={handleCheckerDoubleClick}
            onCheckerRightClick={routedCheckerRightClick}
            onDestinationClick={handleDestinationClick}
            onPlayMove={handlePlayMoveWithSound}
            onSelectDie={handleSelectDie}
            onDieDoubleClick={handleDieDoubleClick}
            onDiceClick={routedDiceClick}
            onDeselect={handleDeselect}
            turnsCount={turnsHistory.length}
            onBackToLobby={handleBackToLobby}
            latestGameAnalysis={latestGameAnalysis}
            turnsHistory={turnsHistory}
            openingEntry={openingEntry}
            onApplyOpeningMove={openingEntry ? () => handleApplyOpeningMove(openingEntry.bestMoves) : () => { }}
            onResetGameHistory={resetGameHistory}
            gameId={gameIdRef.current}
        />
    );
}
