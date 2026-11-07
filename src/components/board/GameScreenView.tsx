'use client';

/**
 * Vue 2 — GAME : HUD Compact + Plateau Zero-Scroll + MobileThumbDock + Tiroir Coach + Modales.
 * Strictement <= 260 lignes, 0 `any` (LOI 5).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameBoardArea from './GameBoardArea';
import CoachMobileDrawer from '../coach/CoachMobileDrawer';
import GameModalsContainer from '../modals/GameModalsContainer';
import { GameScreenTopBar } from './GameScreenTopBar';
import { GameScreenMobileControls } from './GameScreenMobileControls';
import { GameScreenAntiTiltBanner } from './GameScreenAntiTiltBanner';
import { PrivateRoomWaitingBar } from './PrivateRoomWaitingBar';
import { LiveProfessorCoachOverlay } from '../beginner/LiveProfessorCoachOverlay';
import { evaluateInstantHumanLogEntry } from '../beginner/professorAdviceHelper';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';
import { useCoachQuota } from '../../hooks/useCoachQuota';
import { useTiltDetector } from '../../hooks/useTiltDetector';
import { pipCount } from '../../engine/backgammonEngine';
import type { ThemeName, CoachHighlight } from './boardThemes';
import type { UseBackgammonGameReturn } from '../../hooks/useBackgammonGame';
import type { useGameModals } from '../../hooks/useGameModals';
import type { useMultiplayerGame } from '../../hooks/useMultiplayerGame';
import type { CompleteGameAnalysis, RawGameTurn } from '../../features/rating';
import type { OpeningEntry } from '../../features/openings';
import type { CoachSidebarProps } from '../coach/CoachSidebar';
import type { CoachAnalysisHistoryEntry, LastMoveFeedback } from '../../hooks/useCoachHelpers';
import type { CoachNotificationLevel } from '../../features/coach/coachNotificationSettings';

export interface GameScreenViewProps {
    ambianceClass: string; t: (key: string) => string; locale: string; theme: ThemeName;
    onToggleTheme: () => void; game: UseBackgammonGameReturn; isMultiplayerActive: boolean;
    multiplayer: ReturnType<typeof useMultiplayerGame>; modals: ReturnType<typeof useGameModals>;
    coach: CoachSidebarProps['coach']; coachHighlight: CoachHighlight | null; isAnalyzing: boolean;
    matchStats: CoachSidebarProps['matchStats']; matchStatsO: CoachSidebarProps['matchStatsO'];
    prX: number | null; prO: number | null; hoveredCandidate: string | null;
    onCandidateHover: (notation: string | null) => void; onDismissCoach: () => void;
    onReplayMove: () => void; onTriggerCoach: () => void;
    coachHistory?: ReadonlyArray<CoachAnalysisHistoryEntry>;
    selectedCoachHistoryIndex?: number | null; onSelectCoachHistoryIndex?: (index: number | null) => void;
    lastMoveFeedback?: LastMoveFeedback | null; notificationLevel?: CoachNotificationLevel;
    onChangeNotificationLevel?: (level: CoachNotificationLevel) => void; activeDie: 0 | 1;
    isBoardLoading: boolean; onCheckerClick: (point: number) => void; onCheckerRightClick: (point: number) => void;
    onDestinationClick: (point: number) => void; onPlayMove: (from: number, to: number, die?: 0 | 1) => void;
    onSelectDie: (die: 0 | 1) => void; onDiceClick: () => void; onDeselect: () => void;
    turnsCount: number; onBackToLobby: () => void; latestGameAnalysis: CompleteGameAnalysis | null;
    turnsHistory: RawGameTurn[]; openingEntry: OpeningEntry | null; onApplyOpeningMove: () => void;
    onResetGameHistory: () => void; gameId: string; playerColor?: 'X' | 'O'; isOnlineMatch?: boolean;
}

const GameScreenViewComponent: React.FC<GameScreenViewProps> = ({
    ambianceClass, t, locale, theme, onToggleTheme, game,
    isMultiplayerActive, multiplayer, modals, coach, coachHighlight,
    isAnalyzing, matchStats, matchStatsO, prX, prO,
    hoveredCandidate, onCandidateHover, onDismissCoach, onReplayMove, onTriggerCoach,
    coachHistory, selectedCoachHistoryIndex, onSelectCoachHistoryIndex,
    lastMoveFeedback, notificationLevel, onChangeNotificationLevel,
    activeDie, isBoardLoading, onCheckerClick, onCheckerRightClick,
    onDestinationClick, onPlayMove, onSelectDie, onDiceClick, onDeselect,
    turnsCount, onBackToLobby, latestGameAnalysis, turnsHistory,
    openingEntry, onApplyOpeningMove, onResetGameHistory, gameId, playerColor,
    isOnlineMatch: propIsOnlineMatch = false,
}) => {
    const [isCubeSheetOpen, setIsCubeSheetOpen] = useState(false);
    const [isFullFocusMode, setIsFullFocusMode] = useState(false);
    const [prematureDoubleWarning, setPrematureDoubleWarning] = useState(false);
    const [showGuidedArrows, setShowGuidedArrows] = useState(true);
    const [isCoachEnabled, setIsCoachEnabled] = useState(true);
    const [pendingErrorFeedback, setPendingErrorFeedback] = useState<LastMoveFeedback | null>(null);
    const { tierGate } = usePlayerTierGate();
    const quota = useCoachQuota({ locale });
    const tilt = useTiltDetector({ windowSize: 6 });
    const lastRecordedFeedbackRef = useRef<LastMoveFeedback | null>(null);

    const handleToggleFullFocusMode = useCallback(() => {
        setIsFullFocusMode((prev) => {
            const next = !prev;
            if (typeof document !== 'undefined') {
                if (next && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
                else if (!next && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
            }
            return next;
        });
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const onFsChange = () => setIsFullFocusMode(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    useEffect(() => {
        setShowGuidedArrows(true);
        setPendingErrorFeedback(null);
    }, [game.dice?.[0], game.dice?.[1], game.state.turn]);

    useEffect(() => {
        if (game.moveHistory.length === 0) setPendingErrorFeedback(null);
    }, [game.moveHistory.length]);

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isUrlOnline = urlParams?.get('mode') === 'matchmaking' || urlParams?.get('mode') === 'online' || Boolean(urlParams?.get('room')) || Boolean(urlParams?.get('inviteRoom'));
    const isOnlinePvpMatch = Boolean(propIsOnlineMatch) || isUrlOnline || isMultiplayerActive || multiplayer.status === 'searching' || multiplayer.status === 'matched' || Boolean(multiplayer.matchInfo) || Boolean(multiplayer.opponentProfile) || Boolean(multiplayer.privateRoomCode);
    const isGuidedProfessorMode = isCoachEnabled || tierGate === 'BEGINNER' || game.difficulty === 'beginner';

    const handleConfirmWithCoachCheck = useCallback(() => {
        if (isGuidedProfessorMode && !pendingErrorFeedback && game.moveHistory.length > 0 && game.dice) {
            const boardBefore = game.moveHistory[0]?.board ?? game.state.board;
            const moves = game.moveHistory.flatMap((h) => (h.move ? [h.move] : []));
            const fb = evaluateInstantHumanLogEntry(
                {
                    turnIndex: (game.matchLog.length ?? 0) + 1,
                    player: 'X',
                    dice: [game.dice[0], game.dice[1]],
                    boardBefore,
                    movePlayed: moves,
                    boardAfter: game.state.board,
                    notation: '',
                    timestamp: Date.now(),
                },
                game.state,
            );
            if (fb.verdict !== 'optimal' && Math.abs(fb.equityLoss) > 0.020) {
                setPendingErrorFeedback(fb);
                return;
            }
        }
        setPendingErrorFeedback(null);
        game.commitHumanMove();
    }, [isGuidedProfessorMode, pendingErrorFeedback, game]);

    const handleReplayOrResetCurrentTurn = useCallback(() => {
        setPendingErrorFeedback(null);
        if (game.moveHistory.length > 0 && game.rewindToLogTurn) {
            game.rewindToLogTurn();
            return;
        }
        onReplayMove();
    }, [game, onReplayMove]);

    const pips = useMemo(() => pipCount(game.state.board), [game.state.board]);
    const isPrematureDouble = isGuidedProfessorMode && (pips.X >= pips.O - 10);

    const handleOfferDouble = useCallback(() => {
        if (isPrematureDouble) {
            setPrematureDoubleWarning(true);
            setTimeout(() => setPrematureDoubleWarning(false), 6000);
            return;
        }
        const nextCube = game.state.cubeValue === 1 ? 2 : game.state.cubeValue * 2;
        game.offerDouble();
        if (isMultiplayerActive) multiplayer.broadcastDoubleOffered(nextCube);
    }, [isPrematureDouble, game, isMultiplayerActive, multiplayer]);

    const handleTakeDouble = useCallback(() => {
        const nextCube = game.state.cubeValue === 1 ? 2 : game.state.cubeValue * 2;
        game.takeDouble();
        if (isMultiplayerActive) multiplayer.broadcastDoubleAccepted(nextCube);
    }, [game, isMultiplayerActive, multiplayer]);

    const handlePassDouble = useCallback(() => {
        const winner = game.doublingOfferedBy ?? (playerColor === 'X' ? 'O' : 'X');
        game.passDouble();
        if (isMultiplayerActive) multiplayer.broadcastDoublePassed(winner);
    }, [game, isMultiplayerActive, multiplayer, playerColor]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable || (typeof target.closest === 'function' && target.closest('input, textarea, select, [contenteditable="true"]')))) return;
            if (e.key === 'f' || e.key === 'F') setIsFullFocusMode((prev) => !prev);
            else if (e.key === 'Escape') setIsFullFocusMode(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (!lastMoveFeedback || lastMoveFeedback === lastRecordedFeedbackRef.current) return;
        lastRecordedFeedbackRef.current = lastMoveFeedback;
        tilt.recordDecision({ equityLoss: Math.abs(lastMoveFeedback.equityLoss), turnIndex: turnsCount });
    }, [lastMoveFeedback, turnsCount, tilt]);

    const quotaBadge = quota.isVip ? 'VIP ∞' : `${quota.remainingToday}/${quota.maxDaily}`;
    const isBlockedTurn = Boolean(game.dice) && game.isHumanTurn && !game.canUndo && game.leftDieTargets.size === 0 && game.rightDieTargets.size === 0 && (game.gamePhase === 'HUMAN_READY_TO_COMMIT' || game.gamePhase === 'HUMAN_MOVING');
    const matchContext = { scoreX: game.state.scoreX, scoreO: game.state.scoreO, matchLength: game.state.matchLength, cubeValue: game.state.cubeValue, cubeOwner: game.state.cubeOwner, crawford: game.state.crawford };

    return (
        <main data-testid="app-game-view" className={`mobile-game-viewport-lock landscape-full-bleed h-dvh max-h-dvh w-full max-w-[100vw] flex flex-col overflow-hidden p-0 sm:p-2 [@media(max-height:500px)]:!p-[2px] select-none transition-colors duration-500 ${ambianceClass}`}>
            {!isFullFocusMode && (
                <GameScreenTopBar
                    isFullFocusMode={isFullFocusMode} onToggleFullFocusMode={handleToggleFullFocusMode}
                    t={t} theme={theme} onToggleTheme={onToggleTheme} game={game}
                    isMultiplayerActive={isMultiplayerActive} isOnlinePvpMatch={isOnlinePvpMatch}
                    multiplayer={multiplayer} modals={modals} onTriggerCoach={onTriggerCoach}
                    turnsCount={turnsCount} prX={prX} prO={prO} onBackToLobby={onBackToLobby}
                    playerColor={playerColor} lastMoveFeedback={lastMoveFeedback}
                    notificationLevel={notificationLevel} onChangeNotificationLevel={onChangeNotificationLevel}
                    quotaBadge={quotaBadge} isVip={quota.isVip}
                />
            )}

            {isFullFocusMode && (
                <button type="button" data-testid="exit-pure-board-floating-btn" onClick={handleToggleFullFocusMode} className="fixed top-2 left-2 z-50 rounded-lg border border-[#D4AF37]/50 bg-black/85 px-3 py-1.5 text-xs font-bold text-[#F3E5AB] backdrop-blur-md shadow-2xl hover:bg-black active:scale-95 transition">
                    ✕ Quitter Plein Écran
                </button>
            )}

            {Boolean(multiplayer.privateRoomCode && !multiplayer.opponentProfile && multiplayer.status === 'searching') && (
                <div className="w-full px-2 pt-1">
                    <PrivateRoomWaitingBar roomCode={multiplayer.privateRoomCode!} matchLength={game.state.matchLength} onCancel={multiplayer.cancelMatchmaking} />
                </div>
            )}

            {isGuidedProfessorMode && (
                <LiveProfessorCoachOverlay
                    locale={locale} dice={game.dice} canUndo={game.canUndo} onUndoMove={game.undoMove}
                    onAskProfessorHint={() => { onTriggerCoach(); modals.openMobileDrawer(); }}
                    lastMoveFeedback={lastMoveFeedback} pendingErrorFeedback={pendingErrorFeedback}
                    onContinueAfterError={() => { setPendingErrorFeedback(null); game.commitHumanMove(); }}
                    boardState={game.state} turnStartBoard={game.moveHistory.length > 0 ? game.moveHistory[0]?.board : game.state.board}
                    matchLog={game.matchLog} optimalMove={coach?.optimalMove} whyOptimal={coach?.whyOptimal}
                    activeTurn={game.state.turn} prematureDoubleWarning={prematureDoubleWarning}
                    lastBotNotation={game.matchLog.length > 0 && game.matchLog[game.matchLog.length - 1].player === 'O' ? game.matchLog[game.matchLog.length - 1].notation : null}
                    lastBotDice={game.matchLog.length > 0 && game.matchLog[game.matchLog.length - 1].player === 'O' ? game.matchLog[game.matchLog.length - 1].dice : game.lastOpponentDice}
                    onToggleRecommendArrow={() => setShowGuidedArrows((prev) => !prev)}
                    isShowingRecommendArrow={showGuidedArrows}
                    onHoverNotation={showGuidedArrows ? onCandidateHover : undefined}
                    onReplayMove={handleReplayOrResetCurrentTurn}
                />
            )}

            <GameBoardArea
                theme={theme} game={game} activeDie={activeDie} isBoardLoading={isBoardLoading}
                activeCoachHighlight={isGuidedProfessorMode && showGuidedArrows ? coachHighlight : null} onCheckerClick={onCheckerClick}
                onCheckerRightClick={onCheckerRightClick} onDestinationClick={onDestinationClick}
                onOfferDouble={handleOfferDouble} onTakeDouble={handleTakeDouble} onPassDouble={handlePassDouble} isPrematureDouble={isPrematureDouble}
                onPlayMove={onPlayMove} onSelectDie={onSelectDie} onDiceClick={onDiceClick}
                onDeselect={onDeselect} coach={coach} isAnalyzing={isAnalyzing}
                onDismissCoach={onDismissCoach} onReplayMove={handleReplayOrResetCurrentTurn}
                onConfirmTurn={handleConfirmWithCoachCheck}
                onOpenKnowledgeConcept={modals.openKnowledgeBase} onBlunderClick={modals.openGameCourse}
                onCandidateHover={onCandidateHover} turnsHistory={turnsHistory}
                onTriggerCoach={() => { setIsCoachEnabled((prev) => !prev); onTriggerCoach(); }} matchStats={matchStats} matchStatsO={matchStatsO}
                prX={prX} prO={prO} lastMoveFeedback={lastMoveFeedback} locale={locale}
                gameId={gameId} matchContext={matchContext} isMatchStarted playerColor={playerColor}
                coachHistory={coachHistory} selectedCoachHistoryIndex={selectedCoachHistoryIndex}
                onSelectCoachHistoryIndex={onSelectCoachHistoryIndex} onBackToLobby={onBackToLobby}
                onToggleTheme={onToggleTheme}
                challengerProfile={isOnlinePvpMatch ? multiplayer.opponentProfile : null}
                onSendQuickChat={isOnlinePvpMatch ? multiplayer.sendQuickChat : undefined}
                isOnlinePvpMatch={isOnlinePvpMatch}
                isFullFocusMode={isFullFocusMode}
                onToggleFullFocusMode={handleToggleFullFocusMode}
            />

            <GameScreenMobileControls
                game={game} isMultiplayerActive={isMultiplayerActive} multiplayer={multiplayer}
                tilt={tilt} quotaBadge={quotaBadge} isVip={quota.isVip} isAnalyzingCoach={isAnalyzing}
                isBlockedTurn={isBlockedTurn} isCubeSheetOpen={isCubeSheetOpen}
                onSetCubeSheetOpen={setIsCubeSheetOpen}
                onOpenCoachDrawer={() => { onTriggerCoach(); modals.openMobileDrawer(); }}
            />

            <CoachMobileDrawer
                isOpen={modals.isMobileDrawerOpen} onOpen={modals.openMobileDrawer}
                onClose={modals.closeMobileDrawer} coach={coach} isAnalyzing={isAnalyzing}
                matchStats={matchStats} matchStatsO={matchStatsO} onReplayMove={handleReplayOrResetCurrentTurn}
                onDismiss={onDismissCoach} onOpenKnowledgeConcept={modals.openKnowledgeBase}
                onBlunderClick={modals.openGameCourse} onCandidateHover={onCandidateHover}
                turnsHistory={turnsHistory} pr={prX} locale={locale} matchContext={matchContext}
                positionKey={game.state.board.join(',')} gameId={gameId} dice={game.dice}
                board={game.state.board} coachHistory={coachHistory}
                selectedCoachHistoryIndex={selectedCoachHistoryIndex}
                onSelectCoachHistoryIndex={onSelectCoachHistoryIndex}
            />

            <GameModalsContainer
                theme={theme} modals={modals} game={game} multiplayer={multiplayer}
                isMultiplayerActive={isMultiplayerActive} latestGameAnalysis={latestGameAnalysis}
                turnsHistory={turnsHistory} openingEntry={openingEntry}
                onApplyOpeningMove={onApplyOpeningMove} onResetGameHistory={onResetGameHistory}
                onBackToLobby={onBackToLobby} prO={prO} locale={locale}
            />

            <GameScreenAntiTiltBanner tilt={tilt} multiplayer={multiplayer} />
        </main>
    );
};

export const GameScreenView = React.memo(GameScreenViewComponent);
export default GameScreenView;
