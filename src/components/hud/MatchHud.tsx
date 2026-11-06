'use client';

/**
 * Barre supérieure encastrée du jeu — Plaque d'Ébénisterie en Noyer & Laiton Brossé.
 * Conforme aux Lois 3, 5 et 6 : 0 emoji dans getHudVerdictConfig, multilingue FR/EN, <= 250 lignes, 0 any.
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
import { getBotPersona } from '../../features/personas/botPersonas';
import { useTranslation } from '../../i18n';
import { readStoredChameleonLayer, writeStoredChameleonLayer, CHAMELEON_LAYER_CHANGE_EVENT, type ChameleonLayer } from '../../features/chameleon/chameleonProfile';
import { useAuthenticPlayerStats } from '../../hooks/useAuthenticPlayerStats';

export interface MatchHudProps {
    matchLength: number; scoreX: number; scoreO: number; turn: Player; crawford?: boolean;
    dice: [number, number] | null; usedDice: [boolean, boolean] | boolean[];
    cubeValue: number; cubeOwner: Player | null; theme: ThemeName; onThemeToggle: () => void;
    onDoubleCube?: () => void; onRollDice?: () => void; onResetGame?: () => void;
    onResign?: (multiplier: 1 | 2 | 3) => void; onOpenExportImport?: () => void;
    onTriggerCoach?: () => void; canDouble?: boolean; prX?: number | null; prO?: number | null;
    isAiThinking?: boolean; difficulty?: AIDifficulty; pipX?: number | null; pipO?: number | null;
    lastMoveNotation?: string | null; onBackToLobby?: () => void; playerColor?: Player;
    isGameActive?: boolean; boardState?: BoardState; serverSeedHash?: string;
    onOpenDiceAudit?: () => void; lastMoveFeedback?: LastMoveFeedback | null;
    notificationLevel?: CoachNotificationLevel; onChangeNotificationLevel?: (level: CoachNotificationLevel) => void;
    coachQuotaBadge?: string; isVip?: boolean; autoConfirmMode?: AutoConfirmMode;
    onSelectAutoConfirmMode?: (mode: AutoConfirmMode) => void; gameSpeed?: GameSpeed;
    onSelectGameSpeed?: (speed: GameSpeed) => void; customOpponentLabel?: string | null;
}

const FR_BOT_DISPLAY_NAMES: Record<AIDifficulty, string> = { beginner: 'Maxime', intermediate: 'Sofia', expert: 'Victor', grandmaster: 'Viktor' };

function getHudVerdictConfig(fb: LastMoveFeedback, layer: ChameleonLayer = 1, isEn = false): { dotClass: string; label: string; badgeClass: string } {
    const absLoss = Math.abs(fb.equityLoss);
    const mwcPct = Math.max(1, Math.round(absLoss * 50));
    const lossStr = layer === 0 ? `(-${mwcPct}% chances)` : `(-${absLoss.toFixed(3)}) · -${mwcPct}%`;
    if (absLoss <= 0.020 || fb.verdict === 'optimal' || fb.verdict === 'good') {
        return { dotClass: 'bg-emerald-400', label: isEn ? 'OPTIMAL MOVE' : 'COUP OPTIMAL', badgeClass: 'border-emerald-400/70 bg-emerald-950/90 text-emerald-100' };
    }
    if (absLoss < 0.080 || fb.verdict === 'inaccuracy') {
        return { dotClass: 'bg-amber-400', label: `${isEn ? 'INACCURACY' : 'IMPRÉCISION'} ${lossStr}`, badgeClass: 'border-amber-400/75 bg-amber-950/90 text-amber-100' };
    }
    return { dotClass: 'bg-rose-400', label: `${isEn ? 'BLUNDER' : 'BLUNDER MAJEUR'} ${lossStr}`, badgeClass: 'border-rose-400/80 bg-rose-950/90 text-rose-100' };
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
    customOpponentLabel,
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [chameleonLayer, setChameleonLayer] = useState<ChameleonLayer>(1);
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const { isMuted, toggleMute } = useSoundManager();
    const { setTheme } = useBoardTheme(theme);
    const authenticStats = useAuthenticPlayerStats();
    const effectivePrX = authenticStats.canHavePR ? prX : null;
    const effectivePrO = authenticStats.canHavePR ? prO : null;
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const settingsToggleBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const stored = readStoredChameleonLayer();
        if (stored !== null) setChameleonLayer(stored);
        const onSync = (e: Event) => setChameleonLayer((e as CustomEvent<ChameleonLayer | null>).detail ?? 1);
        window.addEventListener(CHAMELEON_LAYER_CHANGE_EVENT, onSync);
        return () => window.removeEventListener(CHAMELEON_LAYER_CHANGE_EVENT, onSync);
    }, []);

    const handleCycleChameleon = () => {
        const next: ChameleonLayer = chameleonLayer === 0 ? 1 : chameleonLayer === 1 ? 2 : 0;
        setChameleonLayer(next);
        writeStoredChameleonLayer(next);
    };
    const activePersona = getBotPersona(difficulty, locale);
    const botFirstName = locale === 'fr' ? FR_BOT_DISPLAY_NAMES[difficulty] : activePersona.shortName;
    const opponentDisplayLabel = customOpponentLabel || `${activePersona.avatar} ${botFirstName}`;
    const isHumanTurn = turn === playerColor;
    const barCount = boardState ? (turn === 'X' ? boardState.board[0] : Math.abs(boardState.board[25])) : 0;
    const hasBarChecker = barCount > 0;
    const entryTargetText = turn === 'X' ? (isEn ? 'points 19 to 24' : 'flèches 19 à 24') : (isEn ? 'points 1 to 6' : 'flèches 1 à 6');

    useEffect(() => {
        if (!isSettingsOpen) return;
        const onOutside = (e: MouseEvent) => {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node) && !settingsToggleBtnRef.current?.contains(e.target as Node)) setIsSettingsOpen(false);
        };
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setIsSettingsOpen(false); settingsToggleBtnRef.current?.focus(); }
        };
        document.addEventListener('mousedown', onOutside);
        document.addEventListener('keydown', onEsc);
        return () => { document.removeEventListener('mousedown', onOutside); document.removeEventListener('keydown', onEsc); };
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

    const handleLobbyClick = () => { if (isGameActive) { setIsLeaveModalOpen(true); return; } onBackToLobby?.(); };
    const hudClasses = getHudThemeClasses(theme);
    const chameleonLabel = chameleonLayer === 0 ? (isEn ? 'Essential' : 'Essentiel') : chameleonLayer === 1 ? 'Club' : 'Pro';

    return (
        <>
            <header role="region" aria-label={isEn ? 'Match HUD' : 'Barre de match'} className="relative z-40 w-full max-w-[1260px] mx-auto h-9 max-md:max-h-[40px] md:h-11 max-sm:rounded-none max-sm:border-x-0 rounded-xl border border-white/10 bg-slate-950/95 px-1.5 sm:px-3 shadow-lg backdrop-blur-xl transition-all duration-200 flex items-center justify-between gap-1 sm:gap-2 min-w-0 max-w-full overflow-hidden sm:overflow-visible touch-manipulation">
                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1 overflow-hidden">
                    <button type="button" onClick={handleLobbyClick} data-testid="hud-back-to-lobby-btn" title={isEn ? 'Session Menu / Back to Lobby' : 'Menu de Session / Retour au Salon'} className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-900 px-1.5 sm:px-2.5 py-1 text-[11px] font-bold text-slate-200 transition hover:border-white/25 hover:bg-slate-800 hover:text-white active:scale-95 shrink-0 touch-manipulation">
                        <span aria-hidden="true" className="text-amber-300">←</span>
                        <span className="hidden sm:inline">Lobby</span>
                    </button>
                    <div id="match-hud" className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1 overflow-hidden">
                        <HudScoreboard
                            matchLength={matchLength} scoreX={scoreX} scoreO={scoreO} turn={turn}
                            crawford={crawford} dice={dice} usedDice={usedDice} prX={effectivePrX} prO={effectivePrO}
                            isAiThinking={isAiThinking ?? turn === 'O'} pipX={pipX} pipO={pipO}
                            borneOffX={boardState ? borneOffCount(boardState.board, 'X') : 0}
                            borneOffO={boardState ? borneOffCount(boardState.board, 'O') : 0}
                            opponentLabel={opponentDisplayLabel} playerColor={playerColor}
                            cubeValue={cubeValue} cubeOwner={cubeOwner}
                            chameleonLayer={chameleonLayer} isGuest={!authenticStats.canHavePR}
                        />
                        <span
                            data-testid="hud-bot-persona-badge"
                            title={`${activePersona.name} — ${activePersona.styleBadge} (${activePersona.skillTaught})`}
                            className="hidden xl:inline-flex items-center gap-1 shrink-0 rounded-lg border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-200"
                        >
                            <span>{activePersona.shortName}</span>
                        </span>
                    </div>
                </div>

                <div className="hidden lg:flex flex-1 min-w-0 items-center justify-center gap-1.5 overflow-hidden px-1">
                    {hasBarChecker && isHumanTurn && (
                        <span
                            data-testid="hud-bar-checker-alert"
                            className="flex items-center gap-1.5 shrink-0 rounded-lg border border-rose-500/60 bg-rose-950/80 px-2.5 py-0.5 text-[11px] font-bold text-rose-100 animate-pulse"
                        >
                            <span className="h-2 w-2 rounded-full bg-rose-400" aria-hidden="true" />
                            <span>{barCount} {isEn ? `on the bar: mandatory entry (${entryTargetText})` : `sur la barre : rentrée obligatoire (${entryTargetText})`}</span>
                        </span>
                    )}
                    {lastMoveFeedback && (() => {
                        const v = getHudVerdictConfig(lastMoveFeedback, chameleonLayer, isEn);
                        return (
                            <button
                                type="button" onClick={onTriggerCoach} data-testid="hud-verdict-badge"
                                className={`${hasBarChecker && isHumanTurn ? 'hidden 2xl:flex' : 'flex'} items-center gap-1.5 shrink-0 whitespace-nowrap rounded-lg border px-2 py-0.5 font-mono text-[11px] font-extrabold tracking-wide tabular-nums transition hover:brightness-110 ${v.badgeClass}`}
                            >
                                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${v.dotClass}`} />
                                <span>{v.label}</span>
                            </button>
                        );
                    })()}
                    {lastMoveNotation && (
                        <span
                            data-testid="hud-last-move"
                            className="whitespace-nowrap truncate rounded-lg border border-white/10 bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] font-bold tabular-nums text-amber-200"
                        >
                            <span className="hidden xl:inline font-sans font-normal text-slate-400 mr-1">{isEn ? 'Last move:' : 'Dernier coup :'}</span>
                            {lastMoveNotation}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <button
                        type="button" onClick={handleCycleChameleon} data-testid="hud-chameleon-layer-btn"
                        className="hidden sm:inline-flex h-7 items-center gap-1 shrink-0 rounded-lg border border-white/10 bg-slate-900 px-2 text-[11px] font-bold text-amber-200 transition hover:border-[#f3c65f]/50 hover:text-white active:scale-95"
                    >
                        <span>{chameleonLabel}</span>
                    </button>

                    {(serverSeedHash || onOpenDiceAudit) && (
                        <button
                            type="button" onClick={onOpenDiceAudit} data-testid="hud-provably-fair-btn"
                            className="flex h-7 items-center gap-1 shrink-0 whitespace-nowrap rounded-lg border border-emerald-500/45 bg-emerald-950/60 px-2 text-[11px] font-bold text-emerald-200 transition hover:border-emerald-400 hover:text-white active:scale-95"
                        >
                            <span className="hidden lg:inline">{isEn ? 'Fair Dice' : 'Dés Certifiés'}</span>
                        </button>
                    )}

                    {onTriggerCoach && (
                        <button
                            type="button" onClick={onTriggerCoach} data-testid="hud-coach-btn"
                            className="hidden md:flex h-7 items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-2 text-[11px] font-bold text-slate-100 transition hover:border-white/25 hover:bg-slate-800 hover:text-white active:scale-95 touch-manipulation"
                        >
                            <span className="hidden sm:inline">Coach</span>
                            {coachQuotaBadge && (
                                <span
                                    data-testid="hud-coach-quota-badge"
                                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-black tabular-nums ${isVip ? 'bg-amber-400/20 text-amber-300' : 'bg-white/10 text-amber-200'}`}
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
                            data-testid="hud-settings-toggle-btn" title={isEn ? 'Settings' : 'Paramètres'}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition touch-manipulation ${isSettingsOpen ? 'border-[#f3c65f] bg-slate-800 text-white' : 'border-white/10 bg-slate-900 text-slate-300 hover:border-white/25 hover:text-white'}`}
                        >
                            <span aria-hidden="true">⚙</span>
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
