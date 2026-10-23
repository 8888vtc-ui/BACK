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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                data-testid="leave-match-confirm-modal"
                className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#d4af37]/60 bg-gradient-to-b from-[#131824]/98 via-[#0b0e16]/98 to-[#06080d]/98 p-5 text-slate-100 flex flex-col gap-4 shadow-[0_28px_80px_rgba(0,0,0,0.92),0_0_0_1px_rgba(255,244,210,0.14),inset_0_1px_1px_rgba(255,245,205,0.25)]"
            >
                {/* Filet supérieur spéculaire en laiton poli */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-10 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f3c65f] to-transparent"
                />

                {/* En-tête gravé : Tableau de Session Privé */}
                <div className="flex items-center justify-between border-b border-[#d4af37]/25 pb-3">
                    <div className="flex items-center gap-2.5">
                        <span
                            aria-hidden="true"
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#e5c158]/55 bg-gradient-to-b from-[#2b1f0d] to-[#120c05] text-sm text-[#f3c65f] shadow-inner"
                        >
                            ⚜
                        </span>
                        <div className="flex flex-col">
                            <h2
                                id="in-game-menu-title"
                                className="font-serif text-base font-black tracking-wide text-[#fdf8eb]"
                            >
                                Tableau de Session Privé
                            </h2>
                            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#d4af37]/80">
                                Cercle Monte-Carlo · Pause & Arbitrage
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        data-testid="close-in-game-menu-btn"
                        aria-label="Reprendre la partie"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#d4af37]/30 bg-white/[0.04] text-xs text-amber-100/80 transition hover:border-[#f3c65f] hover:bg-white/10 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Écrin unifié : Score Officiel, Videau & Sauvegarde Atomique */}
                <div className="rounded-xl border border-[#d4af37]/35 bg-gradient-to-b from-[#17120a]/90 to-[#0c0a07]/95 p-3.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)]">
                    {boardState && (
                        <div className="mb-3 flex items-center justify-between border-b border-[#d4af37]/20 pb-2.5">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#d4af37]">
                                    {boardState.matchLength > 0 ? `Match Officiel · ${boardState.matchLength} Points` : 'Money Game · Table Libre'}
                                </span>
                                <span className="mt-0.5 font-serif text-base font-black tracking-wide text-[#fdf8eb]">
                                    Vous <span className="font-mono text-[#f3c65f]">{boardState.scoreX}</span>
                                    <span className="mx-1.5 text-xs text-[#d4af37]/60">—</span>
                                    <span className="font-mono text-[#f3c65f]">{boardState.scoreO}</span> IA
                                </span>
                            </div>
                            <div className="flex flex-col items-end text-right">
                                <span className="rounded-md border border-[#f3c65f]/55 bg-gradient-to-b from-[#33240f] to-[#1a1106] px-2 py-0.5 font-mono text-[11px] font-black text-[#f3c65f] shadow-sm">
                                    Videau {effectiveCube}×
                                </span>
                                <span className="mt-0.5 text-[9px] font-medium text-slate-400">
                                    Enjeu : {effectiveCube} pt{effectiveCube > 1 ? 's' : ''} (Gammon {effectiveCube * 2})
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-amber-100/90">
                            Coffre de session · Position & dés préservés
                        </span>
                        <span className="font-mono text-[10px] font-bold text-[#f3c65f]">
                            ● Synchronisé
                        </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2.5">
                        <button
                            type="button"
                            data-testid="cancel-leave-match-btn"
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-[#fef08a]/80 px-3 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#1c1004] transition hover:brightness-105 active:scale-[0.98]"
                            style={{
                                background: 'linear-gradient(180deg, #fff6d1 0%, #f3c65f 35%, #c88e1b 100%)',
                                boxShadow: '0 6px 20px rgba(212,175,55,0.35), inset 0 1px 1px rgba(255,255,255,0.8)',
                            }}
                        >
                            Rester en jeu
                        </button>
                        <button
                            type="button"
                            data-testid="confirm-leave-match-btn"
                            onClick={handleSaveAndLeave}
                            className="flex-1 rounded-xl border border-[#d4af37]/35 bg-[#141924] px-3 py-2.5 text-xs font-bold tracking-wide text-amber-100/90 shadow-inner transition hover:border-[#f3c65f] hover:bg-[#1c2333] hover:text-white active:scale-[0.98]"
                        >
                            Quitter vers le Lobby
                        </button>
                    </div>
                </div>

                {/* Section 2 : Ébénisterie & Outils de Salon */}
                <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#d4af37]/85">
                        Essence du Plateau & Outils d’Analyse
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {THEME_CHOICES.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => onSelectTheme(t.id)}
                                data-testid={`ingame-theme-${t.id}`}
                                className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 text-[11px] font-bold transition ${
                                    theme === t.id
                                        ? 'border-[#f3c65f] bg-gradient-to-b from-[#2e210e] to-[#171006] text-[#fdf8eb] shadow-[0_0_12px_rgba(212,175,55,0.25)]'
                                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#d4af37]/40 hover:bg-white/[0.06]'
                                }`}
                            >
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-full border bg-gradient-to-br ${t.swatch}`} />
                                <span className="truncate">{t.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-0.5">
                        <button
                            type="button"
                            onClick={onToggleSound}
                            data-testid="ingame-toggle-sound-btn"
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#d4af37]/25 bg-[#101520] px-2.5 py-2 text-xs font-semibold text-amber-100/90 transition hover:border-[#f3c65f]/60 hover:text-white"
                        >
                            <span className="[filter:sepia(0.9)_saturate(2.5)_hue-rotate(5deg)]">{isSoundMuted ? '🔇' : '🔊'}</span>
                            <span>{isSoundMuted ? 'Muet' : 'Audio On'}</span>
                        </button>
                        {onTriggerCoach && (
                            <button
                                type="button"
                                onClick={() => { onClose(); onTriggerCoach(); }}
                                data-testid="ingame-coach-btn"
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#d4af37]/35 bg-gradient-to-b from-[#261b0b] to-[#140e05] px-2.5 py-2 text-xs font-bold text-[#fce8b2] transition hover:border-[#f3c65f] hover:text-white"
                            >
                                <span className="[filter:sepia(0.9)_saturate(2.5)_hue-rotate(5deg)]">🎓</span>
                                <span>Coach IA</span>
                            </button>
                        )}
                        {onOpenExportImport && (
                            <button
                                type="button"
                                onClick={() => { onClose(); onOpenExportImport(); }}
                                data-testid="ingame-review-moves-btn"
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#d4af37]/25 bg-[#101520] px-2.5 py-2 text-xs font-bold text-amber-100/90 transition hover:border-[#f3c65f]/60 hover:text-white"
                            >
                                <span className="[filter:sepia(0.9)_saturate(2.5)_hue-rotate(5deg)]">📜</span>
                                <span>Coups / XGID</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Section 3 : Protocole de Concession Hiérarchisé (Simple / Gammon / Backgammon) */}
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
