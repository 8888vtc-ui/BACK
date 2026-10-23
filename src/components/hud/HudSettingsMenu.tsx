'use client';

/**
 * Menu Popover ⚙️ des paramètres en partie — Coffret d'Horlogerie & Ébénisterie (Noyer, Obsidienne & Laiton Brossé).
 * Structuré en 4 sections claires (LOI 5 — ≤ 300 lignes, 0 any).
 */

import React, { useState } from 'react';
import type { ThemeName } from '../board/boardThemes';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import { soundEngine } from '../../lib/sound/soundEngine';
import AuthButton from '../auth/AuthButton';
import LanguageSelector from '../common/LanguageSelector';

export interface HudSettingsMenuProps {
    isOpen: boolean;
    onClose: () => void;
    menuThemeClass: string;
    theme: ThemeName;
    onThemeToggle: () => void;
    onSelectTheme?: (theme: ThemeName) => void;
    isSoundMuted: boolean;
    onToggleSound: () => void;
    onOpenExportImport?: () => void;
    onTriggerCoach?: () => void;
    onResetGame?: () => void;
    onResign?: (multiplier: 1 | 2 | 3) => void;
    onToggleOrientation?: () => void;
    onBackToLobby?: () => void;
}

const THEME_OPTIONS: ReadonlyArray<{ id: ThemeName; label: string; title: string; swatchClass: string }> = [
    { id: 'snowie_classic', label: 'Noyer Royal', title: 'Snowie Classic', swatchClass: 'bg-gradient-to-br from-amber-500 to-amber-800 ring-[#f3c65f]' },
    { id: 'tournament', label: 'Velours Club', title: 'Tournament', swatchClass: 'bg-gradient-to-br from-emerald-500 to-emerald-900 ring-emerald-300' },
    { id: 'midnight', label: 'Ardoise Minuit', title: 'Midnight', swatchClass: 'bg-gradient-to-br from-slate-500 to-slate-900 ring-[#d4af37]' },
    { id: 'galaxy_void', label: 'Obsidienne', title: 'Galaxy Void', swatchClass: 'bg-gradient-to-br from-indigo-500 to-slate-950 ring-amber-200' },
];

const HudSettingsMenuComponent: React.FC<HudSettingsMenuProps> = ({
    isOpen, onClose, theme, onThemeToggle, onSelectTheme, isSoundMuted, onToggleSound,
    onOpenExportImport, onTriggerCoach, onResetGame, onResign, onToggleOrientation, onBackToLobby,
}) => {
    const { setTheme } = useBoardTheme(theme);
    const [volumePct, setVolumePct] = useState<number>(80);
    const [relativeNumbers, setRelativeNumbers] = useState<boolean>(false);

    const handleThemeSelect = (targetTheme: ThemeName) => {
        if (onSelectTheme) onSelectTheme(targetTheme);
        else { setTheme(targetTheme); onThemeToggle(); }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = Number(e.target.value);
        setVolumePct(next);
        if (typeof soundEngine.setVolume === 'function') soundEngine.setVolume(next / 100);
        if (next === 0 && !isSoundMuted) onToggleSound();
        if (next > 0 && isSoundMuted) onToggleSound();
    };

    const handleResignClick = (multiplier: 1 | 2 | 3) => {
        onClose();
        if (onResign) onResign(multiplier);
        else onResetGame?.();
    };

    return (
        <div
            id="hud-settings-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Paramètres et outils de la table"
            data-testid="hud-settings-menu"
            className={`absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl border border-[#d4af37]/60 bg-gradient-to-b from-[#18110a] via-[#0d111b] to-[#06080e] p-3.5 text-[#fdf8eb] shadow-[0_28px_70px_rgba(0,0,0,0.96),0_0_24px_rgba(212,175,55,0.16),inset_0_1px_0_rgba(255,245,205,0.3)] flex flex-col gap-3 transition-all ${
                isOpen ? 'block' : 'hidden'
            }`}
        >
            {/* En-tête en Laiton Ciselé */}
            <div className="flex items-center justify-between pb-2 border-b border-[#d4af37]/25">
                <div className="flex items-center gap-2">
                    <span className="text-sm [filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]" aria-hidden="true">
                        ⚙️
                    </span>
                    <span className="font-serif text-xs font-extrabold uppercase tracking-[0.18em] text-[#fdf8eb]">
                        Réglages de Table
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="h-6 w-6 rounded-lg border border-[#d4af37]/30 bg-black/40 text-amber-200/80 hover:text-white hover:border-[#f3c65f] flex items-center justify-center text-xs transition"
                    aria-label="Fermer les paramètres"
                >
                    ✕
                </button>
            </div>

            {/* SECTION 1 : ÉBÉNISTERIE & PLATEAU */}
            <div className="flex flex-col gap-2">
                <span className="text-[9px] font-extrabold text-[#e5c158] uppercase tracking-[0.22em]">
                    1. Ébénisterie & Feutre
                </span>

                {/* Sélecteur visuel des 4 thèmes avec pastilles */}
                <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Thèmes du plateau">
                    {THEME_OPTIONS.map((opt) => {
                        const active = theme === opt.id;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleThemeSelect(opt.id)}
                                title={opt.title}
                                data-testid={active ? 'hud-theme-toggle-btn' : `hud-theme-${opt.id}`}
                                aria-pressed={active}
                                className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition ${
                                    active
                                        ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1d1407] text-[#fff8e1] shadow-[0_0_12px_rgba(212,175,55,0.28),inset_0_1px_0_rgba(255,245,205,0.35)]'
                                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#d4af37]/45 hover:text-white'
                                }`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`h-3 w-3 rounded-full ring-1 shrink-0 ${opt.swatchClass}`}
                                />
                                <span className="truncate">{opt.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Toggle orientation & numérotation 1..24 */}
                <div className="flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setRelativeNumbers((prev) => !prev);
                            onToggleOrientation?.();
                        }}
                        data-testid="orientation-toggle-btn"
                        className="flex-1 flex items-center justify-between rounded-xl border border-[#d4af37]/25 bg-black/35 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-[#f3c65f]/60 transition"
                        title="Inverser l'orientation et la numérotation 1..24"
                    >
                        <span>⇄ Numérotation 1..24</span>
                        <span className="rounded border border-[#d4af37]/35 bg-[#23190c] px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#f3c65f]">
                            {relativeNumbers ? 'Relative' : 'Standard'}
                        </span>
                    </button>
                </div>
            </div>

            {/* SECTION 2 : ACOUSTIQUE & LANGUE */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#d4af37]/20">
                <span className="text-[9px] font-extrabold text-[#e5c158] uppercase tracking-[0.22em]">
                    2. Son &amp; Langue
                </span>

                <div className="flex items-center gap-2.5 rounded-xl border border-[#d4af37]/25 bg-black/35 px-2.5 py-1.5">
                    <button
                        type="button"
                        onClick={onToggleSound}
                        data-testid="audio-toggle-btn"
                        className="flex items-center gap-1.5 text-[11px] font-bold text-[#fdf8eb] hover:text-[#f3c65f] transition shrink-0"
                        title={isSoundMuted ? 'Activer le son' : 'Couper le son'}
                        aria-label={isSoundMuted ? 'Activer le son' : 'Couper le son'}
                    >
                        <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">
                            {isSoundMuted ? '🔇' : '🔊'}
                        </span>
                        <span>{isSoundMuted ? 'Muet' : `${volumePct}%`}</span>
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={10}
                        value={isSoundMuted ? 0 : volumePct}
                        onChange={handleVolumeChange}
                        aria-label="Volume sonore"
                        data-testid="audio-volume-slider"
                        className="w-full accent-[#f3c65f] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#d4af37]/25 bg-black/35 px-2.5 py-1 text-[11px]">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                        <span aria-hidden="true" className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">🌐</span>
                        <span>Langue du Salon</span>
                    </span>
                    <LanguageSelector />
                </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#d4af37]/20">
                <span className="text-[9px] font-extrabold text-[#e5c158] uppercase tracking-[0.22em]">
                    3. Expertise &amp; Salon
                </span>

                {onBackToLobby && (
                    <button
                        type="button"
                        onClick={() => { onClose(); onBackToLobby(); }}
                        data-testid="hud-settings-lobby-btn"
                        className="flex items-center justify-between w-full rounded-xl border border-[#d4af37]/45 bg-gradient-to-r from-[#26160a] to-[#120904] px-3 py-1.5 text-[11px] font-bold text-[#f7e5b7] hover:border-[#f3c65f] hover:text-white transition"
                    >
                        <span>🏠 Menu Principal / Lobby</span>
                        <span className="font-mono text-[9px] text-[#f3c65f]">SALON</span>
                    </button>
                )}

                {onTriggerCoach && (
                    <button
                        type="button"
                        onClick={() => { onClose(); onTriggerCoach(); }}
                        title="Demander une analyse Open Sage 3-Ply sur la position courante"
                        className="flex items-center justify-between w-full rounded-xl border border-[#f3c65f]/55 bg-gradient-to-r from-[#2c200d] to-[#181208] px-3 py-1.5 text-[11px] font-bold text-[#fdf8eb] hover:border-[#fff3c4] transition shadow-sm"
                        data-testid="coach-hud-trigger"
                    >
                        <span>🎓 Analyser avec le Coach IA</span>
                        <span className="font-mono text-[9px] font-extrabold text-[#f3c65f]">3-PLY</span>
                    </button>
                )}

                {onOpenExportImport && (
                    <button
                        type="button"
                        onClick={() => { onClose(); onOpenExportImport(); }}
                        title="Exporter, importer ou partager la position (XGID) ou le match (SGF)"
                        className="flex items-center justify-between w-full rounded-xl border border-[#d4af37]/30 bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-[#f3c65f]/60 hover:text-white transition"
                        data-testid="export-import-hud-btn"
                    >
                        <span>💾 Partager / XGID</span>
                        <span className="text-[9px] text-[#e5c158] font-mono">XG / SGF</span>
                    </button>
                )}

                <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-black/35 border border-[#d4af37]/20">
                    <AuthButton />
                </div>
            </div>

            {/* SECTION 4 : ARBITRAGE & ABANDON RAPIDE */}
            {(onResetGame || onResign) && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-[#d4af37]/20">
                    <span className="text-[9px] font-extrabold text-[#e5c158] uppercase tracking-[0.22em]">
                        4. Arbitrage de Manche
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                        <button
                            type="button"
                            data-testid="resign-simple-btn"
                            onClick={() => handleResignClick(1)}
                            className="whitespace-nowrap rounded-lg border border-[#d4af37]/35 bg-[#1e170d] px-1 py-1.5 text-[9.5px] font-bold text-amber-100 hover:border-[#f3c65f] transition"
                            title="Concéder la manche (Simple — 1x)"
                        >
                            1× Simple
                        </button>
                        <button
                            type="button"
                            data-testid="resign-gammon-btn"
                            onClick={() => handleResignClick(2)}
                            className="whitespace-nowrap rounded-lg border border-amber-500/45 bg-[#26160a] px-1 py-1.5 text-[9.5px] font-bold text-amber-200 hover:border-amber-400 transition"
                            title="Concéder la manche (Gammon — 2x)"
                        >
                            2× Gammon
                        </button>
                        <button
                            type="button"
                            data-testid="resign-bg-btn"
                            onClick={() => handleResignClick(3)}
                            className="whitespace-nowrap rounded-lg border border-rose-500/50 bg-[#2a0e12] px-1 py-1.5 text-[9.5px] font-bold text-rose-200 hover:border-rose-400 transition"
                            title="Concéder la manche (Backgammon — 3x)"
                        >
                            3× BG
                        </button>
                        {onResetGame && (
                            <button
                                type="button"
                                data-testid="reset-game-btn"
                                onClick={() => {
                                    onClose();
                                    onResetGame();
                                }}
                                className="whitespace-nowrap rounded-lg border border-white/15 bg-[#141824] px-1 py-1.5 text-[9.5px] font-bold text-slate-300 hover:border-white/40 hover:text-white transition"
                                title="Réinitialiser la manche"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const HudSettingsMenu = React.memo(HudSettingsMenuComponent);
export default HudSettingsMenu;
