'use client';

/**
 * Barre supérieure encastrée du jeu — Plaque d'Ébénisterie en Noyer & Laiton Brossé.
 * S'intègre physiquement à la boiserie supérieure de la malle de voyage (LOI 5 — ≤ 300 lignes, 0 any).
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ThemeName } from '../board/boardThemes';
import type { BoardState, Player } from '../../engine/backgammonEngine';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
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
    /** Indique si une manche est en cours (`phase !== 'GAME_OVER'`) pour sécuriser la sortie vers le Lobby. */
    isGameActive?: boolean;
    /** État courant du plateau pour sauvegarde atomique en cas de sortie vers le Lobby. */
    boardState?: BoardState;
}

const DIFFICULTY_LABEL: Record<AIDifficulty, string> = {
    beginner: 'IA Débutant',
    intermediate: 'IA Intermédiaire',
    expert: 'IA Expert',
    grandmaster: 'IA Grand-Maître',
};

const MatchHudComponent: React.FC<MatchHudProps> = ({
    matchLength, scoreX, scoreO, turn, crawford = false, dice, usedDice,
    cubeValue, cubeOwner = null, theme, onThemeToggle,
    onResetGame, onResign, onOpenExportImport, onTriggerCoach,
    prX, prO, isAiThinking,
    difficulty = 'expert', pipX, pipO, lastMoveNotation,
    onBackToLobby, playerColor = 'X', isGameActive = false, boardState,
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const { isMuted, toggleMute } = useSoundManager();
    const { setTheme } = useBoardTheme(theme);
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const settingsToggleBtnRef = useRef<HTMLButtonElement>(null);

    const isHumanTurn = turn === playerColor;
    const barCount = boardState
        ? (turn === 'X' ? boardState.board[0] : Math.abs(boardState.board[25]))
        : 0;
    const hasBarChecker = barCount > 0;
    const entryTargetText = turn === 'X' ? 'flèches 19 à 24' : 'flèches 1 à 6';

    useEffect(() => {
        if (!isSettingsOpen) return;
        function handleClickOutside(event: MouseEvent) {
            if (
                settingsMenuRef.current &&
                !settingsMenuRef.current.contains(event.target as Node) &&
                !settingsToggleBtnRef.current?.contains(event.target as Node)
            ) {
                setIsSettingsOpen(false);
            }
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                setIsSettingsOpen(false);
                settingsToggleBtnRef.current?.focus();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isSettingsOpen]);

    useEffect(() => {
        const handleGlobalKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented) return;
            if (event.key === 'Escape' && isGameActive && !isSettingsOpen && !isLeaveModalOpen) {
                const targetTag = (event.target as HTMLElement)?.tagName?.toLowerCase();
                if (targetTag === 'input' || targetTag === 'textarea') return;
                event.preventDefault();
                setIsLeaveModalOpen(true);
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isGameActive, isSettingsOpen, isLeaveModalOpen]);

    const handleLobbyClick = () => {
        if (isGameActive) {
            setIsLeaveModalOpen(true);
            return;
        }
        onBackToLobby?.();
    };

    const hudClasses = getHudThemeClasses(theme);

    return (
        <>
            <header
                role="region"
                aria-label="Barre de match"
                className="relative z-40 w-full max-w-[1260px] mx-auto h-11 sm:h-12 rounded-2xl px-2 sm:px-3.5 transition-all duration-300 flex items-center justify-between gap-1 sm:gap-2 min-w-0 overflow-visible"
                style={{
                    background:
                        'repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 6px), linear-gradient(180deg, #321a0d 0%, #1e0e06 52%, #120803 100%)',
                    border: '1.5px solid rgba(212, 175, 55, 0.55)',
                    boxShadow:
                        '0 10px 28px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 240, 195, 0.28), inset 0 -2px 5px rgba(0, 0, 0, 0.85)',
                }}
            >
                {/* Rivets d'encastrement en laiton doré aux extrémités de la boiserie */}
                <span
                    aria-hidden="true"
                    className="pointer-events-none hidden md:block h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-[#fff3c4] via-[#d4af37] to-[#6b480a] shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                />

                {/* ZONE GAUCHE : Bouton Salon (Lobby) en laiton + Scoreboard Horloger */}
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 md:flex-none">
                    <button
                        type="button"
                        onClick={handleLobbyClick}
                        data-testid="hud-back-to-lobby-btn"
                        title="Menu de Session / Retour au Salon"
                        className="flex items-center gap-1 rounded-xl border border-[#d4af37]/45 bg-gradient-to-b from-[#261409] to-[#120904] px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#f7e5b7] shadow-[inset_0_1px_0_rgba(255,245,205,0.22),0_2px_6px_rgba(0,0,0,0.6)] transition hover:border-[#f3c65f] hover:text-white active:scale-95 shrink-0"
                    >
                        <span aria-hidden="true" className="text-[#f3c65f]">⚜</span>
                        <span className="hidden sm:inline font-serif">Lobby</span>
                    </button>
                    <div id="match-hud" className="flex items-center min-w-0 overflow-hidden">
                        <HudScoreboard
                            matchLength={matchLength}
                            scoreX={scoreX}
                            scoreO={scoreO}
                            turn={turn}
                            crawford={crawford}
                            dice={dice}
                            usedDice={usedDice}
                            prX={prX}
                            prO={prO}
                            isAiThinking={isAiThinking ?? turn === 'O'}
                            pipX={pipX}
                            pipO={pipO}
                            opponentLabel={DIFFICULTY_LABEL[difficulty]}
                            playerColor={playerColor}
                            cubeValue={cubeValue}
                            cubeOwner={cubeOwner}
                        />
                    </div>
                </div>

                {/* ZONE CENTRALE : Guichet de notation horloger ou Alerte de barre */}
                <div className="hidden md:flex flex-1 min-w-0 items-center justify-center gap-2">
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
                    {lastMoveNotation && (
                        <span
                            data-testid="hud-last-move"
                            className="truncate rounded-lg border border-[#d4af37]/35 bg-[#0c0603]/90 px-3 py-0.5 font-mono text-[11px] font-bold text-[#f5d78e] shadow-[inset_0_2px_4px_rgba(0,0,0,0.85)]"
                            title={`Dernier coup adverse : ${lastMoveNotation}`}
                        >
                            <span className="font-serif font-normal text-[#d4af37]/75 mr-1.5">Dernier coup :</span>
                            {lastMoveNotation}
                        </span>
                    )}
                </div>

                {/* ZONE DROITE : Médaillon Coach + Audio + Réglages encastrés */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {onTriggerCoach && (
                        <button
                            type="button"
                            onClick={onTriggerCoach}
                            data-testid="hud-coach-btn"
                            title="Ouvrir l'analyse du Coach IA"
                            className="flex h-8 items-center gap-1.5 rounded-xl border border-[#e5c158]/55 bg-gradient-to-b from-[#33230f] to-[#1a1106] px-2.5 text-[11px] font-bold text-[#fce8b2] shadow-[inset_0_1px_0_rgba(255,245,205,0.28),0_2px_6px_rgba(0,0,0,0.6)] transition hover:border-[#f3c65f] hover:text-white active:scale-95"
                        >
                            <span aria-hidden="true" className="[filter:sepia(0.9)_saturate(2.5)_hue-rotate(5deg)]">🎓</span>
                            <span className="hidden sm:inline font-serif tracking-wide">Coach</span>
                        </button>
                    )}

                    <HudMuteButton isMuted={isMuted} onToggle={toggleMute} />

                    <div className="relative" ref={settingsMenuRef}>
                        <button
                            ref={settingsToggleBtnRef}
                            type="button"
                            onClick={() => setIsSettingsOpen((prev) => !prev)}
                            aria-expanded={isSettingsOpen}
                            aria-haspopup="dialog"
                            aria-controls="hud-settings-menu"
                            data-testid="hud-settings-toggle-btn"
                            title="Paramètres : Son, Orientation, Thème"
                            className={`flex h-8 w-8 items-center justify-center rounded-xl border text-sm transition ${
                                isSettingsOpen
                                    ? 'border-[#f3c65f] bg-[#33230f] text-[#fce8b2]'
                                    : 'border-[#d4af37]/40 bg-[#180c06] text-amber-200/80 hover:border-[#e5c158] hover:text-white'
                            }`}
                        >
                            <span aria-hidden="true" className="[filter:sepia(0.9)_saturate(2.5)_hue-rotate(5deg)]">⚙️</span>
                        </button>

                        <HudSettingsMenu
                            isOpen={isSettingsOpen}
                            onClose={() => {
                                setIsSettingsOpen(false);
                                settingsToggleBtnRef.current?.focus();
                            }}
                            menuThemeClass={hudClasses.menu}
                            theme={theme}
                            onThemeToggle={onThemeToggle}
                            isSoundMuted={isMuted}
                            onToggleSound={toggleMute}
                            onOpenExportImport={onOpenExportImport}
                            onTriggerCoach={onTriggerCoach}
                            onResetGame={onResetGame}
                            onResign={onResign}
                            onBackToLobby={handleLobbyClick}
                        />
                    </div>
                </div>

                <span
                    aria-hidden="true"
                    className="pointer-events-none hidden md:block h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-[#fff3c4] via-[#d4af37] to-[#6b480a] shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                />
            </header>

            <InGameMenuModal
                isOpen={isLeaveModalOpen}
                onClose={() => setIsLeaveModalOpen(false)}
                boardState={boardState}
                cubeValue={cubeValue}
                theme={theme}
                onSelectTheme={(nextTheme) => {
                    setTheme(nextTheme);
                    onThemeToggle();
                }}
                isSoundMuted={isMuted}
                onToggleSound={toggleMute}
                onLeaveToLobby={() => onBackToLobby?.()}
                onResignGame={() => (onResign ? onResign(1) : onResetGame?.())}
                onTriggerCoach={onTriggerCoach}
                onOpenExportImport={onOpenExportImport}
            />
        </>
    );
};

export const MatchHud = React.memo(MatchHudComponent);
export default MatchHud;
