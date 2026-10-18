'use client';

/**
 * Menu Popover ⚙️ des paramètres du jeu (Partager, Thème, Son, Langue, IA & Back-End, Connexion, Reset).
 *
 * Rôle :
 *   Fournit les réglages globaux du match dans un panneau contextuel modal.
 *
 * Dépendances :
 *   `AuthButton`, `SyncIndicator`, `LanguageSelector`, `ThemeName`.
 *
 * Retrait :
 *   Supprimer ce fichier et son appel dans `MatchHud.tsx`.
 */

import React from 'react';
import type { ThemeName } from '../board/boardThemes';
import AuthButton from '../auth/AuthButton';
import SyncIndicator from './SyncIndicator';
import LanguageSelector from '../common/LanguageSelector';

export interface HudSettingsMenuProps {
    /** Indique si le popover est ouvert */
    isOpen: boolean;
    /** Ferme le menu popover */
    onClose: () => void;
    /** Classe CSS de style du thème pour le menu */
    menuThemeClass: string;
    /** Thème actif */
    theme: ThemeName;
    /** Bascule du thème */
    onThemeToggle: () => void;
    /** Statut du son (coupé ou actif) */
    isSoundMuted: boolean;
    /** Bascule du son */
    onToggleSound: () => void;
    /** Ouvre la modale d'export/import XGID */
    onOpenExportImport?: () => void;
    /** Ouvre la modale d'information sur le backend GNUBG */
    onOpenBackendModal: () => void;
    /** Action de réinitialisation de la manche */
    onResetGame?: () => void;
    /** Mode skeleton pour test de chargement */
    isLoadingBoard?: boolean;
    /** Bascule du mode skeleton */
    onToggleLoadingBoard?: () => void;
    /** Simulation d'erreur réseau pour test */
    onSimulateNetworkError?: () => void;
}

const HudSettingsMenuComponent: React.FC<HudSettingsMenuProps> = ({
    isOpen,
    onClose,
    menuThemeClass,
    theme,
    onThemeToggle,
    isSoundMuted,
    onToggleSound,
    onOpenExportImport,
    onOpenBackendModal,
    onResetGame,
    isLoadingBoard = false,
    onToggleLoadingBoard,
    onSimulateNetworkError,
}) => {
    return (
        <div
            id="hud-settings-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Paramètres et options du jeu"
            data-testid="hud-settings-menu"
            className={`absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl flex flex-col gap-3 transition-all ${menuThemeClass} ${
                isOpen ? 'block' : 'hidden'
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
                    type="button"
                    onClick={onClose}
                    className="h-6 w-6 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center text-xs transition"
                    aria-label="Fermer les paramètres"
                >
                    ✕
                </button>
            </div>

            {/* 1. Compte & Synchronisation */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2">
                    <AuthButton />
                </div>
                <div className="flex items-center gap-2">
                    <SyncIndicator />
                </div>
            </div>

            {/* 2. Préférences : Thème, Son, Langue */}
            <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Préférences Visuelles & Audio
                </span>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={onThemeToggle}
                        data-testid="hud-theme-toggle-btn"
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-850 px-2.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
                        title={`Thème actuel : ${theme}`}
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
                        ) : theme === 'midnight' ? (
                            <>
                                <span>🌙</span>
                                <span>Midnight</span>
                            </>
                        ) : (
                            <>
                                <span>🌌</span>
                                <span>Galaxy</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onToggleSound}
                        data-testid="audio-toggle-btn"
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-850 px-2.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
                        title={isSoundMuted ? 'Activer le son' : 'Couper le son'}
                        aria-label={isSoundMuted ? 'Activer le son' : 'Couper le son'}
                    >
                        <span>{isSoundMuted ? '🔇' : '🔊'}</span>
                        <span>{isSoundMuted ? 'Muet' : 'Son'}</span>
                    </button>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-700/80 bg-slate-850 px-2.5 py-1 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300">
                        <span>🌐</span>
                        <span>Langue</span>
                    </span>
                    <LanguageSelector />
                </div>
            </div>

            {/* 3. Outils Professionnels & IA */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Outils Pro & Analyse
                </span>

                {onOpenExportImport && (
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
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
                        onClose();
                        onOpenBackendModal();
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
                                onClose();
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
                            className={`rounded-lg px-2 py-1 text-xs font-medium transition ${
                                isLoadingBoard
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
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
    );
};

export const HudSettingsMenu = React.memo(HudSettingsMenuComponent);
export default HudSettingsMenu;
