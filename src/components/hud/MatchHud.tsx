'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { ThemeName } from '../board/boardThemes';
import type { Player } from '../../engine/backgammonEngine';
import BackendEngineModal from './BackendEngineModal';
import HudSettingsMenu from './HudSettingsMenu';
import HudActivitiesBar from './HudActivitiesBar';
import HudScoreboard from './HudScoreboard';
import { soundEngine } from '../../lib/sound/soundEngine';
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
    /** Statut de consommation des dés [utilisé1, utilisé2, ...] */
    usedDice: [boolean, boolean] | boolean[];
    /** Valeur courante du videau (1, 2, 4, 8...) */
    cubeValue: number;
    /** Possesseur du videau (null = centré) */
    cubeOwner: Player | null;
    /** Thème actif */
    theme: ThemeName;
    /** Bascule du thème */
    onThemeToggle: () => void;
    /** Action de proposition/acceptation du videau */
    onDoubleCube?: () => void;
    /** Action de relancer les dés */
    onRollDice?: () => void;
    /** Action de réinitialisation de la partie */
    onResetGame?: () => void;
    /** État de chargement du plateau (mode test skeleton) */
    isLoadingBoard?: boolean;
    /** Bascule de l'état de chargement du plateau */
    onToggleLoadingBoard?: () => void;
    /** Déclenchement de test toast réseau */
    onSimulateNetworkError?: () => void;
    /** Ouverture du salon multijoueur */
    onOpenMultiplayer?: () => void;
    /** Indique si un match multijoueur est actif */
    isMultiplayerActive?: boolean;
    /** Ouverture de la bibliothèque d'ouvertures (Opening Book) */
    onOpenOpeningBook?: () => void;
    /** Ouverture de la modale d'exportation/importation/partage (XGID, SGF) */
    onOpenExportImport?: () => void;
    /** Ouverture de l'Encyclopédie & Base de Connaissances */
    onOpenKnowledgeBase?: () => void;
    /** Déclenchement manuel de l'analyse ou conseil du Coach */
    onTriggerCoach?: () => void;
    /** Annule le dernier sous-mouvement du tour courant */
    onUndo?: () => void;
    /** Indique si un sous-mouvement peut être annulé */
    canUndo?: boolean;
}

/**
 * HUD compact « Tournament Pro » :
 * - Rangée unique responsive toujours visible : Score X & O, Tour, Dés, Videau,
 *   bouton Déplier activités et bouton ⚙️ Paramètres.
 * - Menu Popover ⚙️ : Partager/XGID, Thème, Son, Langue, IA&Back-End, Connexion, Sync, Reset.
 * - Barre secondaire repliable : Multijoueur, Drills, Puzzles, Progression, Coach, Ouvertures.
 */
export default function MatchHud({
    matchLength,
    scoreX,
    scoreO,
    turn,
    crawford = false,
    dice,
    usedDice,
    cubeValue,
    cubeOwner,
    theme,
    onThemeToggle,
    onDoubleCube,
    onRollDice,
    onResetGame,
    isLoadingBoard,
    onToggleLoadingBoard,
    onSimulateNetworkError,
    onOpenMultiplayer,
    isMultiplayerActive = false,
    onOpenOpeningBook,
    onOpenExportImport,
    onOpenKnowledgeBase,
    onTriggerCoach,
    onUndo,
    canUndo = false,
}: MatchHudProps) {
    const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(() => soundEngine.isMute());
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNavExpanded, setIsNavExpanded] = useState(false);
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const settingsToggleBtnRef = useRef<HTMLButtonElement>(null);

    const cubeOwnerLabel =
        cubeOwner === null
            ? `Centré (x${cubeValue})`
            : cubeOwner === 'X'
                ? `Joueur X (x${cubeValue})`
                : `Joueur O (x${cubeValue})`;

    const canDouble = !crawford && (cubeOwner === null || cubeOwner === turn);

    // Fermeture du menu réglages ⚙️ sur clic extérieur ou Escape
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

    return (
        <header
            role="region"
            aria-label="Tableau de bord du match et contrôles de jeu"
            className={`relative z-40 w-full max-w-7xl mx-auto rounded-2xl p-2 sm:px-3 sm:py-2 transition-all duration-300 backdrop-blur-md flex flex-col gap-2 ${hudClasses.container}`}
        >
            {/* RANGÉE UNIQUE RESPONSIVE DU HUD (Score, Dés, Videau & Contrôles) */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap lg:flex-nowrap w-full">
                <HudScoreboard
                    matchLength={matchLength}
                    scoreX={scoreX}
                    scoreO={scoreO}
                    turn={turn}
                    crawford={crawford}
                    dice={dice}
                    usedDice={usedDice}
                    onRollDice={onRollDice}
                    onUndo={onUndo}
                    canUndo={canUndo}
                />

                {/* 3. Videau, Dépliage Navigation & Menu Paramètres ⚙️ */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Videau (Doubling Cube) */}
                    <div className="flex items-center gap-1.5 rounded-xl bg-slate-800/50 px-2 py-1 ring-1 ring-slate-700/50">
                        <div
                            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 font-black text-slate-950 shadow-sm shadow-amber-500/20 ring-1 ring-amber-300"
                            title={`Videau à ${cubeValue}`}
                        >
                            <span className="text-xs sm:text-sm font-black">
                                {cubeValue === 1 ? '64' : cubeValue}
                            </span>
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[10px] font-bold text-slate-200">Videau</span>
                            <span className="text-[9px] text-slate-400">{cubeOwnerLabel}</span>
                        </div>

                        {onDoubleCube && (
                            <button
                                type="button"
                                onClick={onDoubleCube}
                                disabled={!canDouble}
                                data-testid="hud-double-btn"
                                title={
                                    crawford
                                        ? 'Règle de Crawford : le videau est interdit pour cette manche'
                                        : !canDouble
                                            ? 'Vous ne possédez pas le videau'
                                            : `Doubler à ${cubeValue * 2}`
                                }
                                className={`rounded-lg px-2 py-1 text-xs font-bold transition ml-1 ${canDouble
                                    ? 'border border-amber-500/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 active:scale-95'
                                    : 'border border-slate-700 bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-60'
                                    }`}
                            >
                                x2
                            </button>
                        )}
                    </div>

                    <div className="h-6 w-px bg-slate-800/80 mx-0.5" />

                    {/* Déclencheur Barre secondaire repliable (Multijoueur, Drills, Puzzles...) */}
                    <button
                        type="button"
                        onClick={() => setIsNavExpanded((prev) => !prev)}
                        aria-expanded={isNavExpanded}
                        data-testid="hud-modes-toggle-btn"
                        title={isNavExpanded ? 'Replier la barre de navigation' : 'Déplier Multijoueur, Drills, Puzzles, Progression, Coach, Ouvertures'}
                        className={`flex items-center gap-1 rounded-xl border px-2 sm:px-2.5 py-1.5 text-xs font-semibold transition shadow-sm ${isNavExpanded
                            ? 'border-indigo-500/80 bg-indigo-950/60 text-indigo-200 ring-1 ring-indigo-500/40'
                            : 'border-slate-700/80 bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:text-white'
                            }`}
                    >
                        <span>🧭</span>
                        <span className="hidden sm:inline">Activités</span>
                        {isMultiplayerActive && (
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                        <svg
                            className={`h-3 w-3 transition-transform duration-200 ${isNavExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Bouton & Menu Popover ⚙️ (Partager, Thème, Son, Langue, IA&Back-End, Connexion) */}
                    <div className="relative" ref={settingsMenuRef}>
                        <button
                            ref={settingsToggleBtnRef}
                            type="button"
                            onClick={() => setIsSettingsOpen((prev) => !prev)}
                            aria-expanded={isSettingsOpen}
                            aria-haspopup="dialog"
                            aria-controls="hud-settings-menu"
                            data-testid="hud-settings-toggle-btn"
                            title="Paramètres : Partager, Thème, Son, Langue, IA & Back-End, Connexion"
                            className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border text-sm transition shadow-sm ${isSettingsOpen
                                ? 'border-amber-500 bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40'
                                : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:bg-slate-700/80 hover:text-white'
                                }`}
                        >
                            <span className="text-base leading-none">⚙️</span>
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
                            onToggleSound={() => setIsMuted(soundEngine.toggleMute())}
                            onOpenExportImport={onOpenExportImport}
                            onOpenBackendModal={() => setIsBackendModalOpen(true)}
                            onResetGame={onResetGame}
                            isLoadingBoard={isLoadingBoard}
                            onToggleLoadingBoard={onToggleLoadingBoard}
                            onSimulateNetworkError={onSimulateNetworkError}
                        />
                    </div>
                </div>
            </div>

            <HudActivitiesBar
                isExpanded={isNavExpanded}
                onClose={() => setIsNavExpanded(false)}
                onOpenMultiplayer={onOpenMultiplayer}
                isMultiplayerActive={isMultiplayerActive}
                onTriggerCoach={onTriggerCoach}
                onOpenOpeningBook={onOpenOpeningBook}
                onOpenKnowledgeBase={onOpenKnowledgeBase}
            />

            {/* Modale d'architecture de l'IA et Back-End */}
            <BackendEngineModal
                isOpen={isBackendModalOpen}
                onClose={() => setIsBackendModalOpen(false)}
                theme={theme}
            />
        </header>
    );
}
