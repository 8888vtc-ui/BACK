'use client';

/**
 * En-tête principal du match (HUD, Badges, Bannières d'état, Videau & Actions de tour).
 *
 * Rôle :
 *   Regroupe tous les éléments de navigation, de statut et d'action situés en haut du plateau :
 *   - Liens d'évitement WCAG
 *   - Badges de dopamine (streak parfait, coup de maître)
 *   - Scoreboard et menu d'options (`MatchHud`)
 *   - Bannières multijoueur et reprise de session
 *   - Contrôles du videau (`DoublingControls`)
 *   - Barre d'action contextuelle (`MatchTurnBar`)
 *   - Assistant d'ouverture certifié (`OpeningAssistantBanner`)
 *
 * Dépendances :
 *   `MatchHud`, `MultiplayerBanner`, `DoublingControls`, `MatchTurnBar`, `OpeningAssistantBanner`.
 *
 * Retrait :
 *   Supprimer ce fichier et son import dans `page.tsx`.
 */

import React, { useCallback } from 'react';
import type { ThemeName } from '../board/boardThemes';
import type { UseBackgammonGameReturn } from '../../hooks/useBackgammonGame';
import type { OpeningEntry } from '../../features/openings';
import type { Move, Player } from '../../engine/backgammonEngine';
import type { AIDifficulty } from '../../engine/aiHeuristics';
import MatchHud from './MatchHud';
import MultiplayerBanner from '../multiplayer/MultiplayerBanner';
import DoublingControls from '../board/DoublingControls';
import MatchTurnBar from './MatchTurnBar';
import { OpeningAssistantBanner } from '../openings/OpeningAssistantBanner';
import { soundEngine } from '../../lib/sound/soundEngine';
import { impactHeavy, impactMedium } from '../../lib/capacitor/haptics';
import { toast } from '../toast/ToastContext';

export interface MatchHeaderProps {
    t: (key: string) => string;
    theme: ThemeName;
    onToggleTheme: () => void;
    optimalStreak: number;
    brilliantMove: boolean;
    game: UseBackgammonGameReturn;
    isBoardLoading: boolean;
    isMultiplayerActive: boolean;
    multiplayer: any;
    onOpenMultiplayer: () => void;
    onOpenOpeningBook: (id?: string) => void;
    onOpenExportImport: () => void;
    onOpenKnowledgeBase: () => void;
    onTriggerCoach: () => void;
    rollOffDone: boolean;
    rollOff: {
        xDie: number | null;
        oDie: number | null;
        winner: Player | null;
    };
    onRollOff: () => void;
    openingEntry: OpeningEntry | null;
    onApplyOpeningMove: (moves: Move[]) => void;
    onDismissOpening: () => void;
    isOpeningHighlightActive: boolean;
    onToggleOpeningHighlight: () => void;
    onChangeDifficulty: (difficulty: AIDifficulty) => void;
}

const MatchHeaderComponent: React.FC<MatchHeaderProps> = ({
    t,
    theme,
    onToggleTheme,
    optimalStreak,
    brilliantMove,
    game,
    isBoardLoading,
    isMultiplayerActive,
    multiplayer,
    onOpenMultiplayer,
    onOpenOpeningBook,
    onOpenExportImport,
    onOpenKnowledgeBase,
    onTriggerCoach,
    rollOffDone,
    rollOff,
    onRollOff,
    openingEntry,
    onApplyOpeningMove,
    onDismissOpening,
    isOpeningHighlightActive,
    onToggleOpeningHighlight,
    onChangeDifficulty,
}) => {
    const handleDouble = useCallback(() => {
        if (!game.canDouble) {
            if (game.state.crawford) toast.warning('Le videau est interdit pendant la manche de Crawford.');
            else toast.warning('Vous ne possédez pas le videau ou ce n’est pas le moment de doubler.');
            return;
        }
        impactHeavy();
        soundEngine.playCubeOffer();
        game.offerDouble();
        if (isMultiplayerActive) multiplayer.broadcastDoubleOffered(game.state.cubeValue * 2);
    }, [game, isMultiplayerActive, multiplayer]);

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

            <header className="w-full max-w-7xl mx-auto shrink-0 z-30 flex flex-col gap-1.5 px-1 pt-0.5 pb-1">
                {/* Bandeau Dopamine : Streak & Coup de Maître */}
                {(optimalStreak > 0 || brilliantMove) && (
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        {optimalStreak > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40" data-testid="optimal-streak-badge">
                                🔥 {optimalStreak} coup{optimalStreak > 1 ? 's' : ''} parfait{optimalStreak > 1 ? 's' : ''} d'affilée
                            </span>
                        )}
                        {brilliantMove && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-400 to-amber-400 px-3 py-1 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/40 animate-pulse" data-testid="brilliant-move-badge">
                                ✨ COUP DE MAÎTRE !
                            </span>
                        )}
                    </div>
                )}

                {/* Scoreboard HUD fixe */}
                <div id="match-hud" className="w-full">
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
                        isLoadingBoard={isBoardLoading}
                        onOpenMultiplayer={onOpenMultiplayer}
                        isMultiplayerActive={isMultiplayerActive}
                        onOpenOpeningBook={() => onOpenOpeningBook(openingEntry?.id)}
                        onOpenExportImport={onOpenExportImport}
                        onOpenKnowledgeBase={onOpenKnowledgeBase}
                        onTriggerCoach={onTriggerCoach}
                        onUndo={game.undoMove}
                        canUndo={game.canUndo}
                    />
                </div>

                {/* Bannière de reprise de session */}
                {!isMultiplayerActive && multiplayer.recoverableSession && (
                    <div className="w-full rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-950/20 px-3 py-2 shadow-lg backdrop-blur-md flex items-center justify-between gap-3 animate-fade-in" data-testid="session-recovery-banner">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-lg text-amber-400">🔄</span>
                            <div>
                                <div className="text-xs font-extrabold text-white">Partie interrompue ({multiplayer.recoverableSession.code})</div>
                                <div className="text-[11px] text-slate-300">{multiplayer.recoverableSession.matchLength} pts vs <span className="font-bold text-amber-400">{multiplayer.recoverableSession.opponentProfile.displayName}</span></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => multiplayer.reconnectActiveSession()} className="rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow hover:scale-[1.02] transition-transform">⚡ Reprendre</button>
                            <button type="button" onClick={() => multiplayer.dismissRecoverableSession()} className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white">Ignorer</button>
                        </div>
                    </div>
                )}

                {/* Bannière Multijoueur en ligne */}
                {isMultiplayerActive && multiplayer.matchInfo && multiplayer.opponentProfile && (
                    <div className="w-full">
                        <MultiplayerBanner
                            status={multiplayer.status}
                            matchInfo={multiplayer.matchInfo}
                            opponentProfile={multiplayer.opponentProfile}
                            localProfile={multiplayer.localProfile}
                            turn={game.state.turn}
                            turnTimeRemaining={multiplayer.turnTimeRemaining}
                            disconnectCountdown={multiplayer.disconnectCountdown}
                            quickChatMessage={multiplayer.quickChatMessage}
                            clockState={multiplayer.clockState}
                            isReconnecting={multiplayer.isReconnecting}
                            onSendQuickChat={multiplayer.sendQuickChat}
                            onResign={() => multiplayer.broadcastResign('surrender')}
                        />
                    </div>
                )}

                {/* Contrôles du videau */}
                <div className="w-full">
                    <DoublingControls
                        standalone={false}
                        phase={game.phase}
                        cubeValue={game.state.cubeValue}
                        cubeOwner={game.state.cubeOwner}
                        canDouble={game.canDouble}
                        crawford={game.state.crawford}
                        doublingOfferedBy={game.doublingOfferedBy}
                        currentTurn={game.state.turn}
                        onOfferDouble={handleDouble}
                        onTakeDouble={() => {
                            soundEngine.playCubeOffer();
                            game.takeDouble();
                            if (isMultiplayerActive) multiplayer.broadcastDoubleAccepted(game.state.cubeValue);
                        }}
                        onPassDouble={() => {
                            soundEngine.playCubeOffer();
                            game.passDouble();
                            if (isMultiplayerActive && multiplayer.matchInfo) {
                                const winner = multiplayer.matchInfo.localRole === 'X' ? 'O' : 'X';
                                multiplayer.broadcastDoublePassed(winner);
                            }
                        }}
                    />
                </div>

                {/* Barre d'action contextuelle de tour & Difficulté IA */}
                <MatchTurnBar
                    isMultiplayerActive={isMultiplayerActive}
                    rollOffDone={rollOffDone}
                    rollOff={rollOff}
                    onRollOff={onRollOff}
                    phase={game.phase}
                    isMyTurnToRoll={game.phase === 'WAITING_FOR_ROLL' && (!isMultiplayerActive ? game.isHumanTurn : multiplayer.isMyTurn) && !game.dice}
                    canDouble={game.canDouble}
                    cubeValue={game.state.cubeValue}
                    onOfferDouble={handleDouble}
                    onRollDice={handleRoll}
                    opponentStatusMessage={game.opponentStatusMessage}
                    lastOpponentDice={game.lastOpponentDice}
                    lastOpponentMoves={game.lastOpponentMoves}
                    difficulty={game.difficulty}
                    onChangeDifficulty={onChangeDifficulty}
                />

                {/* Bannière Opening Book */}
                {openingEntry && (
                    <OpeningAssistantBanner
                        opening={openingEntry}
                        onApplyMove={onApplyOpeningMove}
                        onExploreBook={onOpenOpeningBook}
                        onDismiss={onDismissOpening}
                        isHighlighted={isOpeningHighlightActive}
                        onToggleHighlight={onToggleOpeningHighlight}
                    />
                )}
            </header>
        </>
    );
};

export const MatchHeader = React.memo(MatchHeaderComponent);
export default MatchHeader;
