'use client';

/**
 * Barre supérieure UNIQUE du jeu (style Extreme Gammon / TMG) — `h-14`.
 *
 * Rôle :
 *   Une seule rangée dense et ultra-lisible, sans bandeau parasite :
 *   - Gauche  : bouton « ← Lobby » + format + badge Crawford.
 *   - Joueurs : cartes X / O (pion 3D, score, PR en direct, pip count).
 *   - Centre  : dernier coup joué (notation standard) + dés actifs.
 *   - Droite  : videau + bouton Doubler + menu ⚙️ (Son, Orientation, Thème).
 *
 * Dépendances :
 *   `HudScoreboard`, `HudSettingsMenu`, `Die`, `formatStandardMoveSequence`.
 *
 * Retrait :
 *   Supprimer ce fichier et son import dans `MatchHeader.tsx`.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ThemeName } from '../board/boardThemes';
import type { Player } from '../../engine/backgammonEngine';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import HudSettingsMenu from './HudSettingsMenu';
import HudScoreboard from './HudScoreboard';
import { Die } from '../board/Die';
import HudMuteButton from './HudMuteButton';
import { useSoundManager } from '../../hooks/useSoundManager';
import { getHudThemeClasses } from '../../hooks/useBoardTheme';

export interface MatchHudProps {
    /** Longueur du match en points (0 = argent) */
    matchLength: number;
    /** Score actuel du joueur X */
    scoreX: number;
    /** Score actuel du joueur O */
    scoreO: number;
    /** Joueur dont c'est le tour */
    turn: Player;
    /** Règle de Crawford active */
    crawford?: boolean;
    /** Dés courants [d1, d2] ou null */
    dice: [number, number] | null;
    /** Statut de consommation des dés */
    usedDice: [boolean, boolean] | boolean[];
    /** Valeur courante du videau */
    cubeValue: number;
    /** Possesseur du videau (null = centré) */
    cubeOwner: Player | null;
    /** Thème actif */
    theme: ThemeName;
    /** Bascule du thème */
    onThemeToggle: () => void;
    /** Action de proposition du videau */
    onDoubleCube?: () => void;
    /** Action de relancer les dés */
    onRollDice?: () => void;
    /** Action de réinitialisation de la partie */
    onResetGame?: () => void;
    /** Ouverture de la modale d'exportation/importation/partage */
    onOpenExportImport?: () => void;
    /** Déclenchement manuel de l'analyse du Coach */
    onTriggerCoach?: () => void;
    /** Indique si l'action de doubler est autorisée */
    canDouble?: boolean;
    /** PR Joueur Blanc */
    prX?: number | null;
    /** PR IA Noire */
    prO?: number | null;
    /** Statut de réflexion IA */
    isAiThinking?: boolean;
    /** Niveau d'IA courant */
    difficulty?: AIDifficulty;
    /** Pip count du joueur X */
    pipX?: number | null;
    /** Pip count du joueur O */
    pipO?: number | null;
    /** Dernier coup adverse (notation standard) */
    lastMoveNotation?: string | null;
    /** Retour au lobby */
    onBackToLobby?: () => void;
}

const DIFFICULTY_LABEL: Record<AIDifficulty, string> = {
    beginner: 'IA Novice',
    intermediate: 'IA Intermédiaire',
    expert: 'IA Maître',
    grandmaster: 'IA Grand Maître',
};

export default function MatchHud({
    matchLength, scoreX, scoreO, turn, crawford = false, dice, usedDice,
    cubeValue, cubeOwner, theme, onThemeToggle, onDoubleCube, onRollDice,
    onResetGame, onOpenExportImport, onTriggerCoach,
    canDouble: propCanDouble, prX, prO, isAiThinking,
    difficulty = 'expert', pipX, pipO, lastMoveNotation,
    onBackToLobby,
}: MatchHudProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { isMuted, toggleMute } = useSoundManager(); // partagé avec le menu ⚙️
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const settingsToggleBtnRef = useRef<HTMLButtonElement>(null);

    const cubeOwnerLabel =
        cubeOwner === null
            ? 'Centré'
            : cubeOwner === 'X'
                ? 'Vous'
                : 'IA';

    const canDouble = propCanDouble !== undefined
        ? propCanDouble
        : !crawford && (cubeOwner === null || cubeOwner === turn);

    // Fermeture du menu ⚙️ sur clic extérieur ou Escape
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

    const hudClasses = getHudThemeClasses(theme);
    const isDouble = dice !== null && dice[0] === dice[1];
    const visibleDice = dice ? (isDouble ? [dice[0], dice[0], dice[0], dice[0]] : dice) : [];

    return (
        <header
            role="region"
            aria-label="Barre de match"
            className="relative z-40 w-full max-w-7xl mx-auto h-12 rounded-xl px-2 sm:px-3 transition-all duration-300 bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-[0_8px_32px_rgba(0,0,0,0.45)] flex items-center justify-between gap-1 sm:gap-2 min-w-0 overflow-hidden"
        >
            {/* ZONE GAUCHE : Lobby + format + Crawford */}
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1 md:flex-none">
                <button
                    type="button"
                    onClick={onBackToLobby}
                    data-testid="hud-back-to-lobby-btn"
                    title="Retour au lobby"
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1 text-[11px] font-bold text-slate-200 transition hover:border-amber-600/60 hover:text-amber-200 active:scale-95"
                >
                    <span aria-hidden="true">←</span>
                    <span className="hidden sm:inline">Lobby</span>
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
                        opponentLabel={DIFFICULTY_LABEL[difficulty].replace('IA ', '')}
                    />
                </div>
            </div>

            {/* ZONE CENTRALE : dernier coup + dés actifs */}
            <div className="hidden md:flex flex-1 min-w-0 items-center justify-center gap-3">
                {lastMoveNotation && (
                    <span
                        data-testid="hud-last-move"
                        className="truncate rounded-md border border-amber-800/30 bg-stone-900/70 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-200/90"
                        title={`Dernier coup : ${lastMoveNotation}`}
                    >
                        {lastMoveNotation}
                    </span>
                )}
                {visibleDice.length > 0 && (
                    <div data-testid="hud-dice" className="flex items-center gap-1">
                        {visibleDice.map((value, idx) => (
                            <Die
                                key={idx}
                                value={value}
                                used={Boolean(usedDice[idx])}
                                label={`Dé ${idx + 1}`}
                                sizeClass="relative flex h-7 w-7"
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ZONE DROITE : videau + doubler + ⚙️ */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <div className="hidden sm:flex items-center gap-1 rounded-lg bg-slate-800/50 px-1.5 py-1 ring-1 ring-slate-700/50">
                    <div
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-[11px] font-black text-slate-950 ring-1 ring-amber-300"
                        title={`Videau à ${cubeValue} (${cubeOwnerLabel})`}
                    >
                        {cubeValue === 1 ? '64' : cubeValue}
                    </div>
                    <span className="hidden lg:inline text-[9px] font-semibold text-slate-400">
                        {cubeOwnerLabel}
                    </span>
                    {onDoubleCube && (
                        <button
                            type="button"
                            onClick={onDoubleCube}
                            disabled={!canDouble}
                            data-testid="hud-double-btn"
                            title={
                                crawford
                                    ? 'Règle de Crawford : le videau est interdit'
                                    : !canDouble
                                        ? 'Vous ne possédez pas le videau'
                                        : `Doubler à ${cubeValue * 2}`
                            }
                            className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold transition ${canDouble
                                ? 'border border-amber-500/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 active:scale-95'
                                : 'border border-slate-700 bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-60'
                                }`}
                        >
                            x2
                        </button>
                    )}
                </div>

                {onRollDice && (
                    <button
                        type="button"
                        onClick={onRollDice}
                        data-testid="hud-roll-dice-btn"
                        aria-label="Lancer les dés"
                        title="Lancer les dés"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-600 bg-slate-700/80 text-slate-200 transition hover:border-blue-400 hover:bg-blue-600 hover:text-white active:scale-95"
                    >
                        <span aria-hidden="true">🎲</span>
                    </button>
                )}

                {/* Bouton Mute / Unmute — feedback audio du jeu */}
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
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition ${isSettingsOpen
                            ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                            : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:text-white'
                            }`}
                    >
                        <span aria-hidden="true">⚙️</span>
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
                    />
                </div>
            </div>
        </header>
    );
}
