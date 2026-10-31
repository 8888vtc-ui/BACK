'use client';

/**
 * Vue 2 — GAME : HUD Compact + Plateau Zero-Scroll + MobileThumbDock + Tiroir Coach + Modales.
 * Strictement < 280 lignes, 0 `any` (LOI 5).
 */

import React, { useEffect, useRef, useState } from 'react';
import MatchHeader from '../hud/MatchHeader';
import MobileThumbDock from './MobileThumbDock';
import GameBoardArea from './GameBoardArea';
import CoachMobileDrawer from '../coach/CoachMobileDrawer';
import GameModalsContainer from '../modals/GameModalsContainer';
import CubeBottomSheet from '../modals/CubeBottomSheet';
import { useCoachQuota } from '../../hooks/useCoachQuota';
import { useTiltDetector } from '../../hooks/useTiltDetector';
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
    ambianceClass: string;
    t: (key: string) => string;
    locale: string;
    theme: ThemeName;
    onToggleTheme: () => void;
    game: UseBackgammonGameReturn;
    isMultiplayerActive: boolean;
    multiplayer: ReturnType<typeof useMultiplayerGame>;
    modals: ReturnType<typeof useGameModals>;
    coach: CoachSidebarProps['coach'];
    coachHighlight: CoachHighlight | null;
    isAnalyzing: boolean;
    matchStats: CoachSidebarProps['matchStats'];
    matchStatsO: CoachSidebarProps['matchStatsO'];
    prX: number | null;
    prO: number | null;
    hoveredCandidate: string | null;
    onCandidateHover: (notation: string | null) => void;
    onDismissCoach: () => void;
    onReplayMove: () => void;
    onTriggerCoach: () => void;
    coachHistory?: ReadonlyArray<CoachAnalysisHistoryEntry>;
    selectedCoachHistoryIndex?: number | null;
    onSelectCoachHistoryIndex?: (index: number | null) => void;
    lastMoveFeedback?: LastMoveFeedback | null;
    notificationLevel?: CoachNotificationLevel;
    onChangeNotificationLevel?: (level: CoachNotificationLevel) => void;
    activeDie: 0 | 1;
    isBoardLoading: boolean;
    onCheckerClick: (point: number) => void;
    onCheckerRightClick: (point: number) => void;
    onDestinationClick: (point: number) => void;
    onPlayMove: (from: number, to: number, die?: 0 | 1) => void;
    onSelectDie: (die: 0 | 1) => void;
    onDiceClick: () => void;
    onDeselect: () => void;
    turnsCount: number;
    onBackToLobby: () => void;
    latestGameAnalysis: CompleteGameAnalysis | null;
    turnsHistory: RawGameTurn[];
    openingEntry: OpeningEntry | null;
    onApplyOpeningMove: () => void;
    onResetGameHistory: () => void;
    gameId: string;
    playerColor?: 'X' | 'O';
}

const GameScreenViewComponent: React.FC<GameScreenViewProps> = ({
    ambianceClass, t, locale, theme, onToggleTheme, game,
    isMultiplayerActive, multiplayer, modals, coach, coachHighlight,
    isAnalyzing, matchStats, matchStatsO, prX, prO,
    onCandidateHover, onDismissCoach, onReplayMove, onTriggerCoach,
    coachHistory, selectedCoachHistoryIndex, onSelectCoachHistoryIndex,
    lastMoveFeedback, notificationLevel, onChangeNotificationLevel,
    activeDie, isBoardLoading, onCheckerClick, onCheckerRightClick,
    onDestinationClick, onPlayMove, onSelectDie, onDiceClick, onDeselect,
    turnsCount, onBackToLobby, latestGameAnalysis, turnsHistory,
    openingEntry, onApplyOpeningMove, onResetGameHistory, gameId, playerColor,
}) => {
    const [isCubeSheetOpen, setIsCubeSheetOpen] = useState(false);
    const quota = useCoachQuota({ locale });
    const tilt = useTiltDetector({ windowSize: 6 });
    const lastRecordedFeedbackRef = useRef<LastMoveFeedback | null>(null);

    useEffect(() => {
        if (!lastMoveFeedback || lastMoveFeedback === lastRecordedFeedbackRef.current) return;
        lastRecordedFeedbackRef.current = lastMoveFeedback;
        tilt.recordDecision({
            equityLoss: Math.abs(lastMoveFeedback.equityLoss),
            turnIndex: turnsCount,
        });
    }, [lastMoveFeedback, turnsCount, tilt]);

    const quotaBadge = quota.isVip ? 'VIP ∞' : `${quota.remainingToday}/${quota.maxDaily}`;
    const isBlockedTurn =
        Boolean(game.dice) &&
        game.isHumanTurn &&
        !game.canUndo &&
        game.leftDieTargets.size === 0 &&
        game.rightDieTargets.size === 0 &&
        (game.gamePhase === 'HUMAN_READY_TO_COMMIT' || game.gamePhase === 'HUMAN_MOVING');

    const matchContext = {
        scoreX: game.state.scoreX,
        scoreO: game.state.scoreO,
        matchLength: game.state.matchLength,
        cubeValue: game.state.cubeValue,
        cubeOwner: game.state.cubeOwner,
        crawford: game.state.crawford,
    };

    return (
        <main
            data-testid="app-game-view"
            className={`mobile-game-viewport-lock landscape-full-bleed h-dvh max-h-dvh w-full max-w-[100vw] flex flex-col overflow-hidden p-0 sm:p-2 [@media(max-height:500px)]:!p-[2px] select-none transition-colors duration-500 ${ambianceClass}`}
        >
            {/* 1. HUD Compact Mobile (< 44px, masqué sur Desktop/Paysage où les colonnes latérales prennent le relais) */}
            <div className="md:hidden [@media(max-height:540px)]:!hidden shrink-0 w-full max-w-full min-w-0 overflow-hidden">
                <MatchHeader
                    t={t}
                    theme={theme}
                    onToggleTheme={onToggleTheme}
                    game={game}
                    isMultiplayerActive={isMultiplayerActive}
                    multiplayer={multiplayer}
                    onOpenExportImport={modals.openExportImport}
                    onTriggerCoach={() => {
                        onTriggerCoach();
                        modals.openMobileDrawer();
                    }}
                    turnsCount={turnsCount}
                    prX={prX}
                    prO={prO}
                    onBackToLobby={onBackToLobby}
                    playerColor={playerColor}
                    onOpenDiceAudit={modals.openDiceAudit}
                    lastMoveFeedback={lastMoveFeedback}
                    notificationLevel={notificationLevel}
                    onChangeNotificationLevel={onChangeNotificationLevel}
                    coachQuotaBadge={quotaBadge}
                    isVip={quota.isVip}
                />
            </div>

            {/* 2. Plateau 100% visible (Zero-Scroll, 3 Colonnes sur Desktop/Paysage) */}
            <GameBoardArea
                theme={theme}
                game={game}
                activeDie={activeDie}
                isBoardLoading={isBoardLoading}
                activeCoachHighlight={coachHighlight}
                onCheckerClick={onCheckerClick}
                onCheckerRightClick={onCheckerRightClick}
                onDestinationClick={onDestinationClick}
                onPlayMove={onPlayMove}
                onSelectDie={onSelectDie}
                onDiceClick={onDiceClick}
                onDeselect={onDeselect}
                coach={coach}
                isAnalyzing={isAnalyzing}
                onDismissCoach={onDismissCoach}
                onReplayMove={onReplayMove}
                onOpenKnowledgeConcept={modals.openKnowledgeBase}
                onBlunderClick={modals.openGameCourse}
                onCandidateHover={onCandidateHover}
                turnsHistory={turnsHistory}
                onTriggerCoach={onTriggerCoach}
                matchStats={matchStats}
                matchStatsO={matchStatsO}
                prX={prX}
                prO={prO}
                lastMoveFeedback={lastMoveFeedback}
                locale={locale}
                gameId={gameId}
                matchContext={matchContext}
                isMatchStarted
                playerColor={playerColor}
                coachHistory={coachHistory}
                selectedCoachHistoryIndex={selectedCoachHistoryIndex}
                onSelectCoachHistoryIndex={onSelectCoachHistoryIndex}
                onBackToLobby={onBackToLobby}
                onToggleTheme={onToggleTheme}
                challengerProfile={multiplayer.matchInfo?.isClubChallenger ? multiplayer.opponentProfile : null}
            />

            {/* 3. Thumb-Dock Flottant Inférieur (MobileThumbDock) */}
            <MobileThumbDock
                gamePhase={game.gamePhase}
                isHumanTurn={game.isHumanTurn}
                hasDice={Boolean(game.dice)}
                canUndo={game.canUndo}
                canConfirm={game.gamePhase === 'HUMAN_READY_TO_COMMIT' && game.canUndo}
                isBlockedTurn={isBlockedTurn}
                canDouble={game.canDouble}
                cubeValue={game.state.cubeValue}
                doublingOfferedBy={game.doublingOfferedBy}
                coachQuotaBadge={quotaBadge}
                isVip={quota.isVip}
                isAnalyzingCoach={isAnalyzing}
                isTilted={tilt.isTilted}
                onRoll={() => {
                    tilt.markRollTimestamp();
                    game.rollDice();
                }}
                onConfirm={() => game.commitHumanMove()}
                onUndo={game.undoMove}
                onOpenCubeSheet={() => setIsCubeSheetOpen(true)}
                onTakeDouble={() => {
                    if (isMultiplayerActive) {
                        void multiplayer.broadcastDoubleAccepted(game.state.cubeValue * 2);
                    }
                    game.takeDouble();
                }}
                onPassDouble={() => {
                    if (isMultiplayerActive) {
                        const offerer = game.doublingOfferedBy ?? (game.state.turn === 'X' ? 'O' : 'X');
                        void multiplayer.broadcastDoublePassed(offerer);
                    }
                    game.passDouble();
                }}
                onOpenCoachDrawer={() => {
                    onTriggerCoach();
                    modals.openMobileDrawer();
                }}
            />

            <CubeBottomSheet
                isOpen={isCubeSheetOpen}
                cubeValue={game.state.cubeValue}
                canDouble={game.canDouble}
                doublingOfferedBy={game.doublingOfferedBy}
                scoreX={game.state.scoreX}
                scoreO={game.state.scoreO}
                matchLength={game.state.matchLength}
                crawford={game.state.crawford}
                onClose={() => setIsCubeSheetOpen(false)}
                onOfferDouble={() => {
                    if (isMultiplayerActive) {
                        void multiplayer.broadcastDoubleOffered(game.state.cubeValue * 2);
                    }
                    game.offerDouble();
                }}
                onTakeDouble={() => {
                    if (isMultiplayerActive) {
                        void multiplayer.broadcastDoubleAccepted(game.state.cubeValue * 2);
                    }
                    game.takeDouble();
                }}
                onPassDouble={() => {
                    if (isMultiplayerActive) {
                        const offerer = game.doublingOfferedBy ?? (game.state.turn === 'X' ? 'O' : 'X');
                        void multiplayer.broadcastDoublePassed(offerer);
                    }
                    game.passDouble();
                }}
            />

            {/* 4. Tiroir mobile du Coach */}
            <CoachMobileDrawer
                isOpen={modals.isMobileDrawerOpen}
                onOpen={modals.openMobileDrawer}
                onClose={modals.closeMobileDrawer}
                coach={coach}
                isAnalyzing={isAnalyzing}
                matchStats={matchStats}
                matchStatsO={matchStatsO}
                onReplayMove={onReplayMove}
                onDismiss={onDismissCoach}
                onOpenKnowledgeConcept={modals.openKnowledgeBase}
                onBlunderClick={modals.openGameCourse}
                onCandidateHover={onCandidateHover}
                turnsHistory={turnsHistory}
                pr={prX}
                locale={locale}
                matchContext={matchContext}
                positionKey={game.state.board.join(',')}
                gameId={gameId}
                dice={game.dice}
                board={game.state.board}
                coachHistory={coachHistory}
                selectedCoachHistoryIndex={selectedCoachHistoryIndex}
                onSelectCoachHistoryIndex={onSelectCoachHistoryIndex}
            />

            {/* 5. Modales secondaires et overlay du jeu */}
            <GameModalsContainer
                theme={theme}
                modals={modals}
                game={game}
                multiplayer={multiplayer}
                isMultiplayerActive={isMultiplayerActive}
                latestGameAnalysis={latestGameAnalysis}
                turnsHistory={turnsHistory}
                openingEntry={openingEntry}
                onApplyOpeningMove={onApplyOpeningMove}
                onResetGameHistory={onResetGameHistory}
                onBackToLobby={onBackToLobby}
                prO={prO}
                locale={locale}
            />

            {/* 6. Bandeau actif Anti-Tilt de Zare + Quick Chat Adversaire */}
            {(tilt.showTiltAlert ||
                isMultiplayerActive ||
                Boolean(multiplayer.matchInfo?.isClubChallenger)) && (
                <div
                    data-testid="active-antitilt-swapdice-bar"
                    className="fixed bottom-[4.6rem] left-2 sm:left-auto sm:bottom-16 sm:right-3 z-40 flex flex-wrap items-center gap-2 rounded-2xl border border-[#d4af37]/40 bg-[#0d0a08]/95 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs text-[#f7f3e8] shadow-2xl backdrop-blur-md"
                >
                    {multiplayer.quickChatMessage && (
                        <div
                            data-testid="live-quick-chat-bubble"
                            className="flex items-center gap-1.5 rounded-xl border border-[#f3c65f]/50 bg-[#1a1208] px-2.5 py-1 text-[11px] font-bold text-[#fde68a] animate-fade-in"
                        >
                            <span>
                                {multiplayer.quickChatMessage.player === (multiplayer.matchInfo?.localRole ?? 'X')
                                    ? 'Vous :'
                                    : `${multiplayer.opponentProfile?.displayName ?? 'Adversaire'} :`}
                            </span>
                            <span>
                                {multiplayer.quickChatMessage.messageId === 'gg'
                                    ? '👋 Bonne partie !'
                                    : multiplayer.quickChatMessage.messageId === 'nice_move'
                                      ? '👏 Bien joué !'
                                      : multiplayer.quickChatMessage.messageId === 'unlucky'
                                        ? '😅 Pas de chance !'
                                        : multiplayer.quickChatMessage.messageId === 'thinking'
                                          ? '🤔 Je réfléchis...'
                                          : '🙏 Merci !'}
                            </span>
                        </div>
                    )}
                    {(isMultiplayerActive || Boolean(multiplayer.matchInfo?.isClubChallenger)) && (
                        <div className="flex items-center gap-1" role="group" aria-label="Messages rapides">
                            {(
                                [
                                    { id: 'gg' as const, label: '👋' },
                                    { id: 'nice_move' as const, label: '👏' },
                                    { id: 'unlucky' as const, label: '😅' },
                                    { id: 'thanks' as const, label: '🙏' },
                                ]
                            ).map((chat) => (
                                <button
                                    key={chat.id}
                                    type="button"
                                    data-testid={`quick-chat-btn-${chat.id}`}
                                    onClick={() => multiplayer.sendQuickChat(chat.id)}
                                    className="rounded-lg border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs hover:border-[#f3c65f]/50 hover:bg-white/10 transition active:scale-95"
                                >
                                    {chat.label}
                                </button>
                            ))}
                        </div>
                    )}
                    {tilt.showTiltAlert && (
                        <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                            <span>🧘 Pause Anti-Tilt : respirez 5s avant de jouer</span>
                            <button
                                type="button"
                                onClick={tilt.dismissTiltAlert}
                                className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white hover:bg-white/20"
                            >
                                OK
                            </button>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
};

export const GameScreenView = React.memo(GameScreenViewComponent);
export default GameScreenView;
