'use client';

/**
 * Barre supérieure encastrée du jeu — Plaque d'Ébénisterie en Noyer & Laiton Brossé.
 * Ultra-fine sur mobile (< 44px : h-9 / 36px) pour libérer > 85% de la hauteur au plateau.
 * Strictement < 280 lignes, 0 any.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ThemeName } from '../board/boardThemes';
import { borneOffCount, type BoardState, type Player } from '../../engine/backgammonEngine';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import type { LastMoveFeedback } from '../../hooks/useCoachHelpers';
import type { CoachNotificationLevel } from '../../features/coach/coachNotificationSettings';
import type { AutoConfirmMode } from '../../lib/settings/gameplaySettings';
import type { GameSpeed } from '../../lib/gameFeel/speedPresets';
import HudSettingsMenu from './HudSettingsMenu';
import HudScoreboard from './HudScoreboard';
import HudMuteButton from './HudMuteButton';
import InGameMenuModal from './InGameMenuModal';
import { useSoundManager } from '../../hooks/useSoundManager';
import { getHudThemeClasses, useBoardTheme } from '../../hooks/useBoardTheme';

export interface MatchHudProps {
    matchLength: number;
    scoreX: number;
    scoreO: number;
    turn: Player;
    crawford?: boolean;
    dice: [number, number] | null;
    usedDice: [boolean, boolean] | boolean[];
    cubeValue: number;
    cubeOwner: Player | null;
    theme: ThemeName;
    onThemeToggle: () => void;
    onDoubleCube?: () => void;
    onRollDice?: () => void;
    onResetGame?: () => void;
    onResign?: (multiplier: 1 | 2 | 3) => void;
    onOpenExportImport?: () => void;
    onTriggerCoach?: () => void;
    canDouble?: boolean;
    prX?: number | null;
    prO?: number | null;
    isAiThinking?: boolean;
    difficulty?: AIDifficulty;
    pipX?: number | null;
    pipO?: number | null;
    lastMoveNotation?: string | null;
    onBackToLobby?: () => void;
    playerColor?: Player;
    isGameActive?: boolean;
    boardState?: BoardState;
    serverSeedHash?: string;
    onOpenDiceAudit?: () => void;
    lastMoveFeedback?: LastMoveFeedback | null;
    notificationLevel?: CoachNotificationLevel;
    onChangeNotificationLevel?: (level: CoachNotificationLevel) => void;
    coachQuotaBadge?: string;
    isVip?: boolean;
    autoConfirmMode?: AutoConfirmMode;
    onSelectAutoConfirmMode?: (mode: AutoConfirmMode) => void;
    gameSpeed?: GameSpeed;
    onSelectGameSpeed?: (speed: GameSpeed) => void;
}

const DIFFICULTY_LABEL: Record<AIDifficulty, string> = {
    beginner: 'IA Débutant',
    intermediate: 'IA Intermédiaire',
    expert: 'IA Expert',
    grandmaster: 'IA Grand-Maître',
};

function getHudVerdictConfig(fb: LastMoveFeedback): { icon: string; label: string; badgeClass: string } {
    const lossStr = `(-${Math.abs(fb.equityLoss).toFixed(3)})`;
    if (fb.verdict === 'optimal') return { icon: '🟢', label: 'COUP OPTIMAL', badgeClass: 'border-emerald-400/70 bg-emerald-950/90 text-emerald-100' };
    if (fb.verdict === 'good') return { icon: '👍', label: 'BON COUP', badgeClass: 'border-emerald-500/55 bg-emerald-950/75 text-emerald-200' };
    if (fb.verdict === 'inaccuracy') return { icon: '🟡', label: `IMPRÉCISION ${lossStr}`, badgeClass: 'border-amber-400/75 bg-amber-950/90 text-amber-100' };
    return { icon: '🔴', label: `BLUNDER MAJEUR ${lossStr}`, badgeClass: 'border-rose-400/80 bg-rose-950/90 text-rose-100' };
}

const MatchHudComponent: React.FC<MatchHudProps> = ({
    matchLength, scoreX, scoreO, turn, crawford = false, dice, usedDice,
    cubeValue, cubeOwner = null, theme, onThemeToggle,
    onResetGame, onResign, onOpenExportImport, onTriggerCoach,
    prX, prO, isAiThinking,
    difficulty = 'expert', pipX, pipO, lastMoveNotation,
    onBackToLobby, playerColor = 'X', isGameActive = false, boardState,
    serverSeedHash, onOpenDiceAudit,
    lastMoveFeedback, notificationLevel, onChangeNotificationLevel,
    coachQuotaBadge, isVip, autoConfirmMode, onSelectAutoConfirmMode, gameSpeed, onSelectGameSpeed,
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const { isMuted, toggleMute } = useSoundManager();
    const { setTheme } = useBoardTheme(theme);
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const settingsToggleBtnRef = useRef<HTMLButtonElement>(null);

    const isHumanTurn = turn === playerColor;
    const barCount = boardState ? (turn === 'X' ? boardState.board[0] : Math.abs(boardState.board[25])) : 0;
    const hasBarChecker = barCount > 0;
    const entryTargetText = turn === 'X' ? 'flèches 19 à 24' : 'flèches 1 à 6';

    useEffect(() => {
        if (!isSettingsOpen) return;
        const onOutside = (e: MouseEvent) => {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node) && !settingsToggleBtnRef.current?.contains(e.target as Node)) {
                setIsSettingsOpen(false);
            }
        };
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault(); e.stopPropagation();
                setIsSettingsOpen(false); settingsToggleBtnRef.current?.focus();
            }
        };
        document.addEventListener('mousedown', onOutside);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onOutside);
            document.removeEventListener('keydown', onEsc);
        };
    }, [isSettingsOpen]);

    useEffect(() => {
        const onGlobalKey = (e: KeyboardEvent) => {
            if (e.defaultPrevented || e.key !== 'Escape' || !isGameActive || isSettingsOpen || isLeaveModalOpen) return;
            const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea') return;
            e.preventDefault();
            setIsLeaveModalOpen(true);
        };
        window.addEventListener('keydown', onGlobalKey);
        return () => window.removeEventListener('keydown', onGlobalKey);
    }, [isGameActive, isSettingsOpen, isLeaveModalOpen]);

    const handleLobbyClick = () => {
        if (isGameActive) { setIsLeaveModalOpen(true); return; }
        onBackToLobby?.();
    };

    const hudClasses = getHudThemeClasses(theme);

    return (
        <>
            <header
                role="region" aria-label="Barre de match"
                className="relative z-40 w-full max-w-[1260px] mx-auto h-9 max-md:max-h-[42px] md:h-11 max-sm:rounded-none max-sm:border-x-0 rounded-xl border border-white/10 bg-slate-950/95 px-1.5 sm:px-3 shadow-lg backdrop-blur-xl transition-all duration-200 flex items-center justify-between gap-1 sm:gap-2 min-w-0 overflow-visible touch-manipulation"
            >
                <div className="flex items-center gap-1 sm:gap-2 min-w-0 shrink-0">
                    <button
                        type="button" onClick={handleLobbyClick} data-testid="hud-back-to-lobby-btn" title="Menu de Session / Retour au Salon"
                        className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-900 px-2 sm:px-2.5 py-1 text-[11px] font-bold text-slate-200 transition hover:border-white/25 hover:bg-slate-800 hover:text-white active:scale-95 shrink-0 touch-manipulation"
                    >
                        <span aria-hidden="true" className="text-amber-300">←</span>
                        <span className="hidden sm:inline">Lobby</span>
                    </button>
                    <div id="match-hud" className="flex items-center min-w-0">
                        <HudScoreboard
                            matchLength={matchLength} scoreX={scoreX} scoreO={scoreO} turn={turn}
                            crawford={crawford} dice={dice} usedDice={usedDice} prX={prX} prO={prO}
                            isAiThinking={isAiThinking ?? turn === 'O'} pipX={pipX} pipO={pipO}
                            borneOffX={boardState ? borneOffCount(boardState.board, 'X') : 0}
                            borneOffO={boardState ? borneOffCount(boardState.board, 'O') : 0}
                            opponentLabel={DIFFICULTY_LABEL[difficulty]} playerColor={playerColor}
                            cubeValue={cubeValue} cubeOwner={cubeOwner}
                        />
                    </div>
                </div>

                <div className="hidden lg:flex flex-1 min-w-0 items-center justify-center gap-1.5 overflow-hidden px-1">
                    {hasBarChecker && isHumanTurn && (
                        <span
                            data-testid="hud-bar-checker-alert"
                            className="flex items-center gap-1.5 shrink-0 rounded-lg border border-rose-500/60 bg-rose-950/80 px-2.5 py-0.5 text-[11px] font-bold text-rose-100 animate-pulse"
                            title={`Vous avez ${barCount} pion${barCount > 1 ? 's' : ''} sur la barre : rentrée obligatoire dans le camp adverse (${entryTargetText})`}
                        >
                            <span aria-hidden="true">⚠️</span>
                            <span>{barCount} sur la barre : rentrée obligatoire ({entryTargetText})</span>
                        </span>
                    )}
                    {lastMoveFeedback && (() => {
                        const v = getHudVerdictConfig(lastMoveFeedback);
                        return (
                            <button
                                type="button" onClick={onTriggerCoach} data-testid="hud-verdict-badge"
                                title={`Dernier verdict XG : ${v.label} (cliquer pour ouvrir le Coach)`}
                                className={`${hasBarChecker && isHumanTurn ? 'hidden 2xl:flex' : 'flex'} items-center gap-1 shrink-0 whitespace-nowrap rounded-lg border px-2 py-0.5 font-mono text-[11px] font-extrabold tracking-wide tabular-nums transition hover:brightness-110 ${v.badgeClass}`}
                            >
                                <span aria-hidden="true">{v.icon}</span>
                                <span>{v.label}</span>
                            </button>
                        );
                    })()}
                    {lastMoveNotation && (
                        <span
                            data-testid="hud-last-move"
                            className="whitespace-nowrap truncate rounded-lg border border-white/10 bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] font-bold tabular-nums text-amber-200"
                            title={`Dernier coup adverse : ${lastMoveNotation}`}
                        >
                            <span className="hidden xl:inline font-sans font-normal text-slate-400 mr-1">Dernier coup :</span>
                            {lastMoveNotation}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {!isGameActive && (serverSeedHash || onOpenDiceAudit) && (
                        <button
                            type="button" onClick={onOpenDiceAudit} data-testid="hud-provably-fair-btn"
                            title="Vérifier les Dés en 1 Clic (Provably Fair)"
                            className="flex h-7 items-center gap-1.5 shrink-0 whitespace-nowrap rounded-lg border border-emerald-500/50 bg-emerald-950/60 px-2.5 text-[11px] font-bold text-emerald-200 transition hover:border-emerald-400 hover:text-white active:scale-95"
                        >
                            <span aria-hidden="true">🛡</span>
                            <span>Vérifier les Dés</span>
                        </button>
                    )}

                    {onTriggerCoach && (
                        <button
                            type="button" onClick={onTriggerCoach} data-testid="hud-coach-btn"
                            title={coachQuotaBadge ? `Coach IA (${isVip ? 'VIP Illimité' : `${coachQuotaBadge} analyses aujourd'hui`})` : "Ouvrir l'analyse du Coach IA"}
                            className="hidden md:flex h-7 items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-2 text-[11px] font-bold text-slate-100 transition hover:border-white/25 hover:bg-slate-800 hover:text-white active:scale-95 touch-manipulation"
                        >
                            <span aria-hidden="true">🎓</span>
                            <span className="hidden sm:inline">Coach</span>
                            {coachQuotaBadge && (
                                <span
                                    data-testid="hud-coach-quota-badge"
                                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-black tabular-nums ${
                                        isVip ? 'bg-amber-400/20 text-amber-300' : 'bg-white/10 text-amber-200'
                                    }`}
                                >
                                    {coachQuotaBadge}
                                </span>
                            )}
                        </button>
                    )}

                    <HudMuteButton isMuted={isMuted} onToggle={toggleMute} />

                    <div className="relative" ref={settingsMenuRef}>
                        <button
                            ref={settingsToggleBtnRef} type="button" onClick={() => setIsSettingsOpen((prev) => !prev)}
                            aria-expanded={isSettingsOpen} aria-haspopup="dialog" aria-controls="hud-settings-menu"
                            data-testid="hud-settings-toggle-btn" title="Paramètres : Son, Orientation, Thème"
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition touch-manipulation ${isSettingsOpen ? 'border-[#f3c65f] bg-slate-800 text-white' : 'border-white/10 bg-slate-900 text-slate-300 hover:border-white/25 hover:text-white'}`}
                        >
                            <span aria-hidden="true">⚙️</span>
                        </button>

                        <HudSettingsMenu
                            isOpen={isSettingsOpen}
                            onClose={() => { setIsSettingsOpen(false); settingsToggleBtnRef.current?.focus(); }}
                            menuThemeClass={hudClasses.menu} theme={theme} onThemeToggle={onThemeToggle}
                            isSoundMuted={isMuted} onToggleSound={toggleMute}
                            onOpenExportImport={onOpenExportImport} onTriggerCoach={onTriggerCoach}
                            onResetGame={onResetGame} onResign={onResign} onBackToLobby={handleLobbyClick}
                            notificationLevel={notificationLevel} onChangeNotificationLevel={onChangeNotificationLevel}
                            autoConfirmMode={autoConfirmMode} onSelectAutoConfirmMode={onSelectAutoConfirmMode}
                            gameSpeed={gameSpeed} onSelectGameSpeed={onSelectGameSpeed}
                        />
                    </div>
                </div>
            </header>

            <InGameMenuModal
                isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)}
                boardState={boardState} cubeValue={cubeValue} theme={theme}
                onSelectTheme={(nextTheme) => { setTheme(nextTheme); onThemeToggle(); }}
                isSoundMuted={isMuted} onToggleSound={toggleMute}
                onLeaveToLobby={() => onBackToLobby?.()}
                onResignGame={(mult) => (onResign ? onResign(mult) : onResetGame?.())}
                onTriggerCoach={onTriggerCoach} onOpenExportImport={onOpenExportImport}
            />
        </>
    );
};

export const MatchHud = React.memo(MatchHudComponent);
export default MatchHud;
