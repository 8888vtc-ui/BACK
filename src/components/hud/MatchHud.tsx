'use client';

/**
 * Barre supérieure encastrée du jeu — Plaque d'Ébénisterie en Noyer & Laiton Brossé.
 * Ultra-fine sur mobile (< 44px : h-9 / 36px) pour libérer > 85% de la hauteur au plateau.
 * Strictement < 280 lignes, 0 any.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ThemeName } from '../board/boardThemes';
import type { BoardState, Player } from '../../engine/backgammonEngine';
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
                className="relative z-40 w-full max-w-[1260px] mx-auto h-9 max-md:max-h-[42px] md:h-12 max-sm:rounded-none max-sm:border-x-0 rounded-2xl px-1.5 sm:px-3.5 transition-all duration-300 flex items-center justify-between gap-1 sm:gap-2 min-w-0 overflow-visible touch-manipulation"
                style={{
                    background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 6px), linear-gradient(180deg, #321a0d 0%, #1e0e06 52%, #120803 100%)',
                    border: '1.5px solid rgba(212, 175, 55, 0.55)',
                    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 240, 195, 0.28), inset 0 -2px 5px rgba(0, 0, 0, 0.85)',
                }}
            >
                <span aria-hidden="true" className="pointer-events-none hidden md:block h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-[#fff3c4] via-[#d4af37] to-[#6b480a] shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />

                <div className="flex items-center gap-1 sm:gap-2 min-w-0 shrink-0">
                    <button
                        type="button" onClick={handleLobbyClick} data-testid="hud-back-to-lobby-btn" title="Menu de Session / Retour au Salon"
                        className="flex items-center gap-1 rounded-xl border border-[#d4af37]/45 bg-gradient-to-b from-[#261409] to-[#120904] px-2 sm:px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#f7e5b7] shadow-[inset_0_1px_0_rgba(255,245,205,0.22),0_2px_6px_rgba(0,0,0,0.6)] transition hover:border-[#f3c65f] hover:text-white active:scale-95 shrink-0 touch-manipulation"
                    >
                        <span aria-hidden="true" className="text-[#f3c65f]">⚜</span>
                        <span className="hidden sm:inline font-serif">Lobby</span>
                    </button>
                    <div id="match-hud" className="flex items-center min-w-0">
                        <HudScoreboard
                            matchLength={matchLength} scoreX={scoreX} scoreO={scoreO} turn={turn}
                            crawford={crawford} dice={dice} usedDice={usedDice} prX={prX} prO={prO}
                            isAiThinking={isAiThinking ?? turn === 'O'} pipX={pipX} pipO={pipO}
                            opponentLabel={DIFFICULTY_LABEL[difficulty]} playerColor={playerColor}
                            cubeValue={cubeValue} cubeOwner={cubeOwner}
                        />
                    </div>
                </div>

                <div className="hidden lg:flex flex-1 min-w-0 items-center justify-center gap-1.5 overflow-hidden px-1">
                    {hasBarChecker && isHumanTurn && (
                        <span
                            data-testid="hud-bar-checker-alert"
                            className="flex items-center gap-1.5 shrink-0 rounded-lg border border-rose-400/75 bg-gradient-to-b from-[#450d12] to-[#240608] px-2.5 py-0.5 text-[11px] font-bold text-rose-100 animate-pulse shadow-[inset_0_1px_0_rgba(255,200,200,0.25)]"
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
                            className="whitespace-nowrap truncate rounded-lg border border-[#d4af37]/35 bg-[#0c0603]/90 px-2.5 py-0.5 font-mono text-[11px] font-bold tabular-nums text-[#f5d78e] shadow-[inset_0_2px_4px_rgba(0,0,0,0.85)]"
                            title={`Dernier coup adverse : ${lastMoveNotation}`}
                        >
                            <span className="hidden xl:inline font-serif font-normal text-[#d4af37]/75 mr-1">Dernier coup :</span>
                            {lastMoveNotation}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {(serverSeedHash || onOpenDiceAudit) && (
                        <button
                            type="button" onClick={onOpenDiceAudit} data-testid="hud-provably-fair-btn"
                            title={isGameActive && serverSeedHash ? `Empreinte SHA-256 : ${serverSeedHash} (cliquer pour auditer)` : 'Vérifier les Dés en 1 Clic (Provably Fair)'}
                            className={isGameActive
                                ? 'hidden xl:flex h-8 items-center gap-1 shrink-0 whitespace-nowrap rounded-xl border border-emerald-500/35 bg-[#0a1811]/90 px-2 font-mono text-[11px] font-semibold tabular-nums text-emerald-300/90 transition hover:border-emerald-400 hover:text-emerald-200 active:scale-95'
                                : 'flex h-8 items-center gap-1.5 shrink-0 whitespace-nowrap rounded-xl border border-emerald-400/65 bg-gradient-to-b from-[#0f3b28] to-[#081f15] px-2.5 text-[11px] font-bold text-emerald-200 shadow-[inset_0_1px_0_rgba(212,175,55,0.3)] transition hover:border-[#f3c65f] hover:text-white active:scale-95'}
                        >
                            <span aria-hidden="true">{isGameActive ? '🔒' : '🛡'}</span>
                            <span>{isGameActive && serverSeedHash ? `SHA-256 · ${serverSeedHash.slice(0, 4)}` : 'Vérifier les Dés'}</span>
                        </button>
                    )}

                    {onTriggerCoach && (
                        <button
                            type="button" onClick={onTriggerCoach} data-testid="hud-coach-btn"
                            title={coachQuotaBadge ? `Coach IA (${isVip ? 'VIP Illimité' : `${coachQuotaBadge} analyses aujourd'hui`})` : "Ouvrir l'analyse du Coach IA"}
                            className="hidden md:flex h-7 sm:h-8 items-center gap-1 sm:gap-1.5 rounded-xl border border-[#e5c158]/55 bg-gradient-to-b from-[#33230f] to-[#1a1106] px-1.5 sm:px-2.5 text-[11px] sm:text-xs font-bold text-[#fce8b2] shadow-[inset_0_1px_0_rgba(255,245,205,0.28),0_2px_6px_rgba(0,0,0,0.6)] transition hover:border-[#f3c65f] hover:text-white active:scale-95 touch-manipulation"
                        >
                            <span aria-hidden="true" className="[filter:sepia(0.9)_saturate(2.5)_hue-rotate(5deg)]">🎓</span>
                            <span className="hidden sm:inline font-serif tracking-wide">Coach</span>
                            {coachQuotaBadge && (
                                <span
                                    data-testid="hud-coach-quota-badge"
                                    className={`rounded-md px-1 sm:px-1.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-black tabular-nums tracking-tight ${
                                        isVip ? 'border border-amber-300/60 bg-gradient-to-r from-amber-400/25 to-yellow-500/35 text-amber-200' : 'border border-white/20 bg-black/60 text-[#f5d78e]'
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
                            className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl border text-xs sm:text-sm transition touch-manipulation ${isSettingsOpen ? 'border-[#f3c65f] bg-[#33230f] text-[#fce8b2]' : 'border-[#d4af37]/40 bg-[#180c06] text-amber-200/80 hover:border-[#e5c158] hover:text-white'}`}
                        >
                            <span aria-hidden="true" className="[filter:sepia(0.9)_saturate(2.5)_hue-rotate(5deg)]">⚙️</span>
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

                <span
                    aria-hidden="true"
                    className="pointer-events-none hidden md:block h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-[#fff3c4] via-[#d4af37] to-[#6b480a] shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                />
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
