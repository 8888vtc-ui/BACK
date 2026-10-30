'use client';

/**
 * Tableau de Session Privé & Menu de Pause (Refonte Prestige Monte-Carlo — InGameMenuModal).
 *
 * Direction artistique :
 *   - Verre fumé dépoli haute densité (#090c12), cadre en laiton doré biseauté (#d4af37)
 *     et cuir noir impérial / grenat profond.
 *   - Palette monochrome noble (Or Champagne, Ivoire, Obsidienne, Grenat) sans dispersion criarde.
 *   - Hiérarchie dramatique des 3 niveaux de concession :
 *     1× Simple (Bronze sobre) · 2× Gammon (Cuivre ambré) · 3× Backgammon (Grenat impérial & Or).
 *   - Strictement 0 `any`, < 300 lignes.
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ThemeName } from '../board/boardThemes';
import type { BoardState } from '../../engine/backgammonEngine';

export const EMERGENCY_MATCH_SNAPSHOT_KEY = 'bg_emergency_match_snapshot';

export interface InGameMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    boardState?: BoardState;
    cubeValue: number;
    theme: ThemeName;
    onSelectTheme: (theme: ThemeName) => void;
    isSoundMuted: boolean;
    onToggleSound: () => void;
    onLeaveToLobby: () => void;
    onResignGame?: (multiplier: 1 | 2 | 3) => void;
    onTriggerCoach?: () => void;
    onOpenExportImport?: () => void;
}

const THEME_CHOICES: ReadonlyArray<{ id: ThemeName; label: string; swatch: string }> = [
    { id: 'snowie_classic', label: 'Noyer', swatch: 'from-[#8a2c1a] to-[#165b3c] border-[#d4af37]' },
    { id: 'tournament', label: 'Tournoi', swatch: 'from-[#4d2613] to-[#1b6d3b] border-[#c37d3c]' },
    { id: 'midnight', label: 'Minuit', swatch: 'from-[#24407a] to-[#0b1d3a] border-slate-400' },
    { id: 'galaxy_void', label: 'Impérial', swatch: 'from-[#6d28d9] to-[#0d0a1c] border-amber-300' },
];

import { InGameResignSection } from './InGameResignSection';

export function saveAtomicMatchSnapshot(state?: BoardState): boolean {
    if (!state || typeof window === 'undefined' || !window.localStorage) return false;
    try {
        window.localStorage.setItem(
            EMERGENCY_MATCH_SNAPSHOT_KEY,
            JSON.stringify({ savedAt: new Date().toISOString(), state }),
        );
        return true;
    } catch {
        return false;
    }
}

const InGameMenuModalComponent: React.FC<InGameMenuModalProps> = ({
    isOpen, onClose, boardState, cubeValue, theme, onSelectTheme,
    isSoundMuted, onToggleSound, onLeaveToLobby, onResignGame, onTriggerCoach, onOpenExportImport,
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); onClose(); }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const effectiveCube = Math.max(1, cubeValue);

    const handleSaveAndLeave = () => {
        saveAtomicMatchSnapshot(boardState);
        onClose();
        onLeaveToLobby();
    };

    const modalContent = (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="in-game-menu-title"
            data-testid="in-game-menu-modal"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                data-testid="leave-match-confirm-modal"
                className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-950/98 p-5 text-slate-100 flex flex-col gap-4 shadow-2xl"
            >
                {/* En-tête épuré : Menu de Pause & Sortie (zéro doublon avec ⚙️) */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex flex-col">
                        <h2
                            id="in-game-menu-title"
                            className="text-base font-bold tracking-wide text-white"
                        >
                            Pause &amp; Arbitrage de Partie
                        </h2>
                        <span className="text-[11px] font-medium text-slate-400">
                            Position et dés sauvegardés automatiquement
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        data-testid="close-in-game-menu-btn"
                        aria-label="Reprendre la partie"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs text-slate-300 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Écrin unifié : Score Officiel, Videau & Sauvegarde Atomique */}
                <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3.5">
                    {boardState && (
                        <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                                    {boardState.matchLength > 0 ? `Match en ${boardState.matchLength} Points` : 'Money Game (Jacoby)'}
                                </span>
                                <span className="mt-0.5 text-base font-black tracking-wide text-white">
                                    Vous <span className="font-mono text-amber-300">{boardState.scoreX}</span>
                                    <span className="mx-1.5 text-xs text-slate-500">—</span>
                                    <span className="font-mono text-amber-300">{boardState.scoreO}</span> IA
                                </span>
                            </div>
                            <div className="flex flex-col items-end text-right">
                                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-xs font-black text-amber-300">
                                    Videau {effectiveCube}×
                                </span>
                                <span className="mt-0.5 text-[11px] font-medium text-slate-400">
                                    Enjeu : {effectiveCube} pt{effectiveCube > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            data-testid="cancel-leave-match-btn"
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-[#f3c65f] bg-[#f3c65f] px-3 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-sm transition hover:bg-[#f7d37c] active:scale-[0.98]"
                        >
                            Reprendre la partie
                        </button>
                        <button
                            type="button"
                            data-testid="confirm-leave-match-btn"
                            onClick={handleSaveAndLeave}
                            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-bold text-slate-200 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
                        >
                            Quitter vers le Lobby
                        </button>
                    </div>
                </div>

                {/* Barre d'accès rapide compacte (Thème, Audio, Coach, XGID) */}
                <div className="flex flex-col gap-1.5">
                    <div className="grid grid-cols-4 gap-1.5">
                        {THEME_CHOICES.map((t) => (
                            <button
                                key={t.id} type="button" onClick={() => onSelectTheme(t.id)} data-testid={`ingame-theme-${t.id}`}
                                className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                                    theme === t.id ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
                                }`}
                            >
                                <span className={`h-2 w-2 shrink-0 rounded-full border bg-gradient-to-br ${t.swatch}`} />
                                <span className="truncate">{t.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        <button
                            type="button" onClick={onToggleSound} data-testid="ingame-toggle-sound-btn"
                            className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:text-white"
                        >
                            <span>{isSoundMuted ? '🔇' : '🔊'}</span>
                            <span>{isSoundMuted ? 'Muet' : 'Audio On'}</span>
                        </button>
                        {onTriggerCoach && (
                            <button
                                type="button" onClick={() => { onClose(); onTriggerCoach(); }} data-testid="ingame-coach-btn"
                                className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs font-semibold text-amber-200 transition hover:border-white/25 hover:text-white"
                            >
                                <span>🎓</span><span>Coach IA</span>
                            </button>
                        )}
                        {onOpenExportImport && (
                            <button
                                type="button" onClick={() => { onClose(); onOpenExportImport(); }} data-testid="ingame-review-moves-btn"
                                className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:text-white"
                            >
                                <span>📜</span><span>Coups / XGID</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Protocole de Concession Hiérarchisé (Simple / Gammon / Backgammon) */}
                {onResignGame && (
                    <InGameResignSection
                        effectiveCube={effectiveCube}
                        onResignGame={onResignGame}
                        onClose={onClose}
                    />
                )}
            </div>
        </div>
    );

    return mounted && typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export const InGameMenuModal = React.memo(InGameMenuModalComponent);
export default InGameMenuModal;
