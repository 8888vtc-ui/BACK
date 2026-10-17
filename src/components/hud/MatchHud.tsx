'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { ThemeName } from '../board/BackgammonBoard';
import type { Player } from '../../engine/backgammonEngine';
import AuthButton from '../auth/AuthButton';
import SyncIndicator from './SyncIndicator';
import LanguageSelector from '../common/LanguageSelector';
import BackendEngineModal from './BackendEngineModal';
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
 * Mini composant dé avec pips vectoriels réalistes (1 à 6).
 */
function MiniDie({ value, used, label }: { value: number; used: boolean; label: string }) {
    const pips: Record<number, Array<[number, number]>> = {
        1: [[50, 50]],
        2: [[28, 28], [72, 72]],
        3: [[28, 28], [50, 50], [72, 72]],
        4: [[28, 28], [72, 28], [28, 72], [72, 72]],
        5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
        6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
    };

    const currentPips = pips[value] || [[50, 50]];

    return (
        <div className="flex flex-col items-center gap-0.5">
            <div
                className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border transition-all duration-200 ${used
                    ? 'border-slate-700 bg-slate-800/60 opacity-40 shadow-inner'
                    : 'border-slate-300/40 bg-gradient-to-br from-white via-slate-100 to-slate-300 text-slate-900 shadow-md shadow-black/40 ring-1 ring-white/30'
                    }`}
                title={`${label} : ${value} ${used ? '(déjà utilisé)' : '(disponible)'}`}
            >
                <svg viewBox="0 0 100 100" className="h-5 w-5 sm:h-6 sm:w-6">
                    {currentPips.map(([cx, cy], i) => (
                        <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={10}
                            fill={used ? '#64748b' : '#0f172a'}
                        />
                    ))}
                </svg>

                {used && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
            </div>
            <span className="text-[9px] font-medium tracking-tight text-slate-400 leading-none">
                {label}
            </span>
        </div>
    );
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
    const closeSettingsBtnRef = useRef<HTMLButtonElement>(null);

    const isXTurn = turn === 'X';
    const isOTurn = turn === 'O';

    const cubeOwnerLabel =
        cubeOwner === null
            ? `Centré (x${cubeValue})`
            : cubeOwner === 'X'
                ? `Joueur X (x${cubeValue})`
                : `Joueur O (x${cubeValue})`;

    const canDouble = !crawford && (cubeOwner === null || cubeOwner === turn);

    // Focus clavier et fermeture du menu réglages ⚙️
    useEffect(() => {
        if (!isSettingsOpen) return;

        // Met le focus sur le bouton de fermeture ou le premier bouton interactif dès l'ouverture
        const timer = setTimeout(() => {
            if (closeSettingsBtnRef.current) {
                closeSettingsBtnRef.current.focus();
            } else if (settingsMenuRef.current) {
                const focusable = settingsMenuRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
                );
                focusable[0]?.focus();
            }
        }, 30);

        function handleClickOutside(event: MouseEvent) {
            if (
                settingsMenuRef.current &&
                !settingsMenuRef.current.contains(event.target as Node) &&
                !settingsToggleBtnRef.current?.contains(event.target as Node)
            ) {
                setIsSettingsOpen(false);
                settingsToggleBtnRef.current?.focus();
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                event.preventDefault();
                setIsSettingsOpen(false);
                settingsToggleBtnRef.current?.focus();
                return;
            }

            // Gestion du cycle de focus (Focus Trap) dans le menu ouvert
            if (event.key === 'Tab' && settingsMenuRef.current) {
                const focusableElements = Array.from(
                    settingsMenuRef.current.querySelectorAll<HTMLElement>(
                        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
                    ),
                ).filter((el) => el.offsetParent !== null);

                if (focusableElements.length === 0) return;

                const firstEl = focusableElements[0];
                const lastEl = focusableElements[focusableElements.length - 1];

                if (event.shiftKey) {
                    if (document.activeElement === firstEl) {
                        event.preventDefault();
                        lastEl.focus();
                    }
                } else {
                    if (document.activeElement === lastEl) {
                        event.preventDefault();
                        firstEl.focus();
                    }
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            clearTimeout(timer);
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
                {/* 1. Score du match, Joueurs & Tour */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                    {/* Format du match & Badge Crawford */}
                    <div className="flex flex-col text-[10px] leading-tight text-slate-400">
                        <span className="font-semibold text-slate-300">
                            {matchLength > 0 ? `Match en ${matchLength} pts` : 'Partie d’argent'}
                        </span>
                        {crawford && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/40 w-max mt-0.5">
                                Crawford
                            </span>
                        )}
                    </div>

                    {/* Carte Joueur X */}
                    <div
                        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-all ${isXTurn
                            ? 'bg-slate-800 ring-2 ring-blue-400 shadow-md shadow-blue-500/20'
                            : 'bg-slate-800/40 ring-1 ring-slate-700/60 opacity-85'
                            }`}
                        title={`Joueur X (Blanc) - Score : ${scoreX}${isXTurn ? ' - Au tour' : ''}`}
                    >
                        <span className="h-3.5 w-3.5 rounded-full bg-slate-100 shadow-sm ring-1 ring-slate-400 shrink-0" />
                        <div className="flex flex-col leading-none">
                            <span className="text-xs font-bold text-slate-100">X (Blanc)</span>
                            {isXTurn && (
                                <span className="text-[9px] font-semibold text-blue-400">Au tour</span>
                            )}
                        </div>
                        <span className="text-sm sm:text-base font-black text-white ml-1">{scoreX}</span>
                    </div>

                    <span className="text-[10px] font-extrabold text-slate-500">VS</span>

                    {/* Carte Joueur O */}
                    <div
                        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-all ${isOTurn
                            ? 'bg-slate-800 ring-2 ring-blue-400 shadow-md shadow-blue-500/20'
                            : 'bg-slate-800/40 ring-1 ring-slate-700/60 opacity-85'
                            }`}
                        title={`Joueur O (Noir) - Score : ${scoreO}${isOTurn ? ' - Au tour' : ''}`}
                    >
                        <span className="h-3.5 w-3.5 rounded-full bg-slate-900 ring-1 ring-slate-600 shadow-inner shrink-0" />
                        <div className="flex flex-col leading-none">
                            <span className="text-xs font-bold text-slate-200">O (Noir)</span>
                            {isOTurn && (
                                <span className="text-[9px] font-semibold text-blue-400">Au tour</span>
                            )}
                        </div>
                        <span className="text-sm sm:text-base font-black text-white ml-1">{scoreO}</span>
                    </div>
                </div>

                {/* 2. Dés du tour (Centre) */}
                <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-800/40 px-2.5 py-1 ring-1 ring-slate-700/50 shrink-0">
                    {dice ? (
                        dice[0] === dice[1] ? (
                            <div className="flex items-center gap-1 sm:gap-1.5">
                                {[0, 1, 2, 3].map((idx) => (
                                    <MiniDie
                                        key={idx}
                                        value={dice[0]}
                                        used={Boolean(usedDice[idx])}
                                        label={`Coup ${idx + 1}`}
                                    />
                                ))}
                                <span className="hidden sm:inline-block text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-400/40 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                    {Math.max(0, 4 - usedDice.filter(Boolean).length)}/4
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1.5">
                                    <MiniDie value={dice[0]} used={Boolean(usedDice[0])} label="Dé 1 (G)" />
                                    <MiniDie value={dice[1]} used={Boolean(usedDice[1])} label="Dé 2 (D)" />
                                </div>
                                <span className="hidden md:inline text-[9px] text-slate-400 leading-none mt-0.5">
                                    Clic G : Dé gauche · Clic D : Dé droit
                                </span>
                            </div>
                        )
                    ) : (
                        <div className="flex h-8 sm:h-9 items-center justify-center px-2 text-xs text-slate-400 font-medium">
                            En attente du lancer
                        </div>
                    )}

                    {onRollDice && (
                        <button
                            type="button"
                            onClick={onRollDice}
                            data-testid="hud-roll-dice-btn"
                            title="Lancer ou relancer les dés"
                            className="group flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-600 bg-slate-700/80 text-slate-200 shadow hover:border-blue-400 hover:bg-blue-600 hover:text-white transition active:scale-95 shrink-0"
                            aria-label="Lancer les dés"
                        >
                            <svg className="h-4 w-4 transition group-hover:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    )}

                    {onUndo && (
                        <button
                            type="button"
                            onClick={onUndo}
                            disabled={!canUndo}
                            data-testid="hud-undo-btn"
                            title="Annuler le dernier sous-mouvement"
                            aria-label="Annuler le dernier coup"
                            className={`flex h-8 sm:h-9 items-center justify-center gap-1 rounded-xl border px-2 text-xs font-bold transition active:scale-95 shrink-0 ${canUndo
                                ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                                : 'border-slate-700 bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-50'
                                }`}
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                            Annuler
                        </button>
                    )}
                </div>

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

                        {/* Menu Popover Paramètres ⚙️ */}
                        <div
                            id="hud-settings-menu"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Paramètres et options du jeu"
                            data-testid="hud-settings-menu"
                            className={`absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl flex flex-col gap-3 transition-all ${hudClasses.menu} ${isSettingsOpen ? 'block' : 'hidden'
                                }`}
                        >
                            {/* En-tête de la boîte à outils */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">⚙️</span>
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                                        Paramètres & Outils
                                    </span>
                                </div>
                                <button
                                    ref={closeSettingsBtnRef}
                                    type="button"
                                    onClick={() => {
                                        setIsSettingsOpen(false);
                                        settingsToggleBtnRef.current?.focus();
                                    }}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition text-xs"
                                    title="Fermer le menu"
                                    aria-label="Fermer le menu des paramètres"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* 1. Connexion & Sync */}
                            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                <AuthButton />
                                <SyncIndicator />
                            </div>

                            {/* 2. Thème & Son */}
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Style & Audio
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                    {/* Toggle Thème */}
                                    <button
                                        type="button"
                                        onClick={onThemeToggle}
                                        aria-label={`Thème actuel : ${theme}. Cliquer pour changer de style visuel.`}
                                        title={`Thème actuel : ${theme === 'snowie_classic'
                                            ? 'Édition Prestige (Émeraude & Acajou)'
                                            : theme === 'tournament'
                                                ? 'Tournament (Bois & Vert)'
                                                : 'Midnight (Nuit & Bleu)'
                                            } - Cliquer pour changer.`}
                                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all shadow-sm ${theme === 'snowie_classic'
                                            ? 'border-amber-600/70 bg-gradient-to-r from-stone-900 via-amber-950/60 to-emerald-950/70 text-amber-200'
                                            : theme === 'tournament'
                                                ? 'border-amber-700/60 bg-gradient-to-r from-amber-950/70 to-emerald-950/70 text-amber-200'
                                                : 'border-blue-700/60 bg-gradient-to-r from-slate-900 to-blue-950/70 text-blue-200'
                                            }`}
                                    >
                                        {theme === 'snowie_classic' ? (
                                            <>
                                                <span>🎲</span>
                                                <span>Snowie</span>
                                            </>
                                        ) : theme === 'tournament' ? (
                                            <>
                                                <span>🏆</span>
                                                <span>Tournament</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>🌙</span>
                                                <span>Midnight</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Contrôle Audio */}
                                    <button
                                        type="button"
                                        onClick={() => setIsMuted(soundEngine.toggleMute())}
                                        aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                                        title={isMuted ? 'Activer les sons de jeu' : 'Couper les sons de jeu'}
                                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition shadow-sm ${isMuted
                                            ? 'border-stone-700/60 bg-stone-900/60 text-stone-400 hover:text-white'
                                            : 'border-amber-700/60 bg-gradient-to-r from-amber-950/60 to-emerald-950/60 text-amber-200 hover:border-amber-400'
                                            }`}
                                        data-testid="audio-toggle-btn"
                                    >
                                        <span>{isMuted ? '🔇' : '🔊'}</span>
                                        <span>{isMuted ? 'Muet' : 'Son'}</span>
                                    </button>
                                </div>

                                {/* Sélecteur de Langue */}
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs text-slate-300 font-medium">Langue</span>
                                    <LanguageSelector />
                                </div>
                            </div>

                            {/* 3. Partager / XGID & IA & Back-End */}
                            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Partage & Moteur IA
                                </span>

                                {onOpenExportImport && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSettingsOpen(false);
                                            onOpenExportImport();
                                        }}
                                        title="Exporter, importer ou partager la position (XGID) ou le match (SGF)"
                                        className="flex items-center justify-between w-full rounded-xl border border-indigo-700/60 bg-indigo-950/40 px-3 py-2 text-xs font-semibold text-indigo-200 hover:bg-indigo-900/60 transition shadow-sm"
                                        data-testid="export-import-hud-btn"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>💾</span>
                                            <span>Partager / XGID</span>
                                        </div>
                                        <span className="text-[10px] text-indigo-400 font-mono">XG / SGF</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSettingsOpen(false);
                                        setIsBackendModalOpen(true);
                                    }}
                                    aria-label="Informations sur l'architecture de l'IA et le Back-End GNUBG"
                                    title="Ouvrir le panneau d'architecture IA (Moteur Local / Backend GNUBG)"
                                    className="flex items-center justify-between w-full rounded-xl border border-emerald-600/60 bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-200 hover:border-emerald-400 transition shadow-sm"
                                    data-testid="backend-info-btn"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span>IA & Back-End</span>
                                    </div>
                                    <span className="text-[10px] text-emerald-400">GNUBG</span>
                                </button>
                            </div>

                            {/* 4. Actions & Débogage */}
                            {(onResetGame || onToggleLoadingBoard || onSimulateNetworkError) && (
                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                                    {onResetGame && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsSettingsOpen(false);
                                                onResetGame();
                                            }}
                                            className="flex-1 rounded-xl border border-rose-900/60 bg-rose-950/30 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-900/50 hover:text-white transition"
                                            title="Réinitialiser la manche"
                                        >
                                            Reset
                                        </button>
                                    )}
                                    {onToggleLoadingBoard && (
                                        <button
                                            type="button"
                                            onClick={onToggleLoadingBoard}
                                            className={`rounded-lg px-2 py-1 text-xs font-medium transition ${isLoadingBoard ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            Skeleton
                                        </button>
                                    )}
                                    {onSimulateNetworkError && (
                                        <button
                                            type="button"
                                            onClick={onSimulateNetworkError}
                                            className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-2 py-1 text-xs font-medium text-rose-300 hover:text-white"
                                        >
                                            Réseau
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* BARRE SECONDAIRE REPLIABLE (Multijoueur, Drills, Puzzles, Progression, Coach, Ouvertures) */}
            <div
                data-testid="hud-secondary-nav"
                className={`transition-all duration-200 ${isNavExpanded ? 'flex' : 'hidden'
                    } flex-wrap items-center justify-between gap-1.5 sm:gap-2 pt-2 border-t border-slate-800/80`}
            >
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {onOpenMultiplayer && (
                        <button
                            type="button"
                            onClick={onOpenMultiplayer}
                            data-testid="multiplayer-hud-trigger"
                            title="Lancer le Matchmaking Multijoueur Elo en ligne"
                            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-sm ${isMultiplayerActive
                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40 animate-pulse'
                                : 'border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 hover:border-amber-400 hover:bg-amber-500/30'
                                }`}
                        >
                            <span>⚡</span>
                            <span>{isMultiplayerActive ? 'En Direct' : 'Multijoueur'}</span>
                        </button>
                    )}

                    <a
                        href="/drills"
                        title="Rejouer vos erreurs passées jusqu'à trouver le coup optimal certifié"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm"
                        data-testid="drills-hud-link"
                    >
                        <span>🎯</span>
                        <span>Drills</span>
                    </a>

                    <a
                        href="/puzzles"
                        title="Résoudre le puzzle tactique du jour certifié GNUBG et cultiver votre série"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm"
                        data-testid="puzzles-hud-link"
                    >
                        <span>🧩</span>
                        <span>Puzzles</span>
                    </a>

                    <a
                        href="/progression"
                        title="Consulter le Performance Rating (PR) et les concepts stratégiques à travailler"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm"
                    >
                        <span>📊</span>
                        <span>Progression</span>
                    </a>

                    {onTriggerCoach && (
                        <button
                            type="button"
                            onClick={onTriggerCoach}
                            data-testid="coach-hud-trigger"
                            title="Demander conseil au Coach en temps réel"
                            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/60 bg-indigo-950/40 px-2.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/60 hover:text-white transition shadow-sm"
                        >
                            <span>🎓</span>
                            <span>Coach</span>
                        </button>
                    )}

                    {onOpenOpeningBook && (
                        <button
                            type="button"
                            onClick={onOpenOpeningBook}
                            title="Consulter la Bibliothèque d'Ouvertures (Opening Book certifié XG++)"
                            className="flex items-center gap-1.5 rounded-xl border border-emerald-700/60 bg-emerald-950/40 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60 hover:text-white transition shadow-sm"
                            data-testid="opening-book-hud-btn"
                        >
                            <span>📖</span>
                            <span>Ouvertures</span>
                        </button>
                    )}

                    {onOpenKnowledgeBase && (
                        <button
                            type="button"
                            onClick={onOpenKnowledgeBase}
                            title="Consulter l'Encyclopédie & Base de Connaissances Théorique"
                            className="flex items-center gap-1.5 rounded-xl border border-blue-600/60 bg-blue-950/40 px-2.5 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-900/60 hover:text-white transition shadow-sm"
                            data-testid="knowledge-base-hud-btn"
                        >
                            <span>📚</span>
                            <span>Théorie</span>
                        </button>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setIsNavExpanded(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 transition flex items-center gap-1"
                    title="Replier la barre secondaire d'activités"
                >
                    <span>▲</span>
                    <span>Replier</span>
                </button>
            </div>

            {/* Modale d'architecture de l'IA et Back-End */}
            <BackendEngineModal
                isOpen={isBackendModalOpen}
                onClose={() => setIsBackendModalOpen(false)}
                theme={theme}
            />
        </header>
    );
}
