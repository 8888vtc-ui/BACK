'use client';

/**
 * Menu Popover ⚙️ des paramètres en partie — Coffret d'Horlogerie & Ébénisterie (Noyer, Obsidienne & Laiton Brossé).
 * Structuré en 4 sections claires (LOI 5 — ≤ 300 lignes, 0 any).
 */

import React, { useEffect, useState } from 'react';
import type { ThemeName } from '../board/boardThemes';
import type { CoachNotificationLevel } from '../../features/coach/coachNotificationSettings';
import { getSavedOrientation, saveOrientation, toggleOrientation, ORIENTATION_CHANGE_EVENT, type BoardOrientation } from '../board/boardOrientation';
import { getSavedPipCountVisibility, setSavedPipCountVisibility, PIP_VISIBILITY_CHANGE_EVENT } from '../board/PipCountBadge';
import { getNextAutoConfirmMode, getSavedAutoConfirmMode, getSavedGameSpeed, saveAutoConfirmMode, saveGameSpeed, type AutoConfirmMode } from '../../lib/settings/gameplaySettings';
import { GAME_SPEED_ORDER, type GameSpeed } from '../../lib/gameFeel/speedPresets';
import { AUTO_CONFIRM_MODE_LABELS, SPEED_LABELS } from '../board/BoardActions';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import { soundEngine } from '../../lib/sound/soundEngine';
import { useI18n } from '../../i18n';

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
    notificationLevel?: CoachNotificationLevel;
    onChangeNotificationLevel?: (level: CoachNotificationLevel) => void;
    autoConfirmMode?: AutoConfirmMode;
    onSelectAutoConfirmMode?: (mode: AutoConfirmMode) => void;
    gameSpeed?: GameSpeed;
    onSelectGameSpeed?: (speed: GameSpeed) => void;
}

const THEME_OPTIONS: ReadonlyArray<{ id: ThemeName; label: string; title: string; swatchClass: string }> = [
    { id: 'snowie_classic', label: 'Noyer Royal', title: 'Noyer Royal', swatchClass: 'bg-gradient-to-br from-amber-500 to-amber-800 ring-[#f3c65f]' },
    { id: 'tournament', label: 'Velours Club', title: 'Tournament', swatchClass: 'bg-gradient-to-br from-emerald-500 to-emerald-900 ring-emerald-300' },
    { id: 'midnight', label: 'Ardoise Minuit', title: 'Midnight', swatchClass: 'bg-gradient-to-br from-slate-500 to-slate-900 ring-[#d4af37]' },
    { id: 'galaxy_void', label: 'Obsidienne', title: 'Obsidienne Royale', swatchClass: 'bg-gradient-to-br from-indigo-500 to-slate-950 ring-amber-200' },
];

const HudSettingsMenuComponent: React.FC<HudSettingsMenuProps> = ({
    isOpen, onClose, theme, onThemeToggle, onSelectTheme, isSoundMuted, onToggleSound,
    onOpenExportImport, onTriggerCoach, onResetGame, onResign, onToggleOrientation,
    notificationLevel = 'all', onChangeNotificationLevel,
    autoConfirmMode, onSelectAutoConfirmMode, gameSpeed, onSelectGameSpeed,
}) => {
    const { setTheme } = useBoardTheme(theme);
    const { locale } = useI18n();
    const [volumePct, setVolumePct] = useState<number>(80);
    const [boardOrientation, setBoardOrientation] = useState<BoardOrientation>('normal');
    const [pipVisible, setPipVisible] = useState<boolean>(true);
    const [localAutoMode, setLocalAutoMode] = useState<AutoConfirmMode>('forced_only');
    const [localSpeed, setLocalSpeed] = useState<GameSpeed>('tournament');

    useEffect(() => {
        setBoardOrientation(getSavedOrientation('normal'));
        setPipVisible(getSavedPipCountVisibility(true));
        setLocalAutoMode(getSavedAutoConfirmMode());
        setLocalSpeed(getSavedGameSpeed());
        const onSync = (e: Event) => {
            const detail = (e as CustomEvent<BoardOrientation>).detail;
            if (detail === 'normal' || detail === 'inverted') setBoardOrientation(detail);
        };
        const onPipSync = (e: Event) => {
            const detail = (e as CustomEvent<boolean>).detail;
            if (typeof detail === 'boolean') setPipVisible(detail);
        };
        window.addEventListener(ORIENTATION_CHANGE_EVENT, onSync);
        window.addEventListener(PIP_VISIBILITY_CHANGE_EVENT, onPipSync);
        return () => {
            window.removeEventListener(ORIENTATION_CHANGE_EVENT, onSync);
            window.removeEventListener(PIP_VISIBILITY_CHANGE_EVENT, onPipSync);
        };
    }, []);

    const effectiveAutoMode = autoConfirmMode ?? localAutoMode;
    const effectiveSpeed = gameSpeed ?? localSpeed;

    const handleCycleAutoMode = () => {
        const next = getNextAutoConfirmMode(effectiveAutoMode);
        setLocalAutoMode(next);
        saveAutoConfirmMode(next);
        onSelectAutoConfirmMode?.(next);
    };

    const handleCycleSpeed = () => {
        const idx = GAME_SPEED_ORDER.indexOf(effectiveSpeed);
        const next = GAME_SPEED_ORDER[(idx + 1) % GAME_SPEED_ORDER.length];
        setLocalSpeed(next);
        saveGameSpeed(next);
        onSelectGameSpeed?.(next);
    };

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
            id="hud-settings-menu" role="dialog" aria-modal={isOpen} aria-hidden={!isOpen}
            aria-label="Paramètres et outils de la table" data-testid="hud-settings-menu" data-translucent="60"
            className={`absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 max-h-[calc(100dvh-64px)] overflow-y-auto overscroll-y-contain rounded-2xl border border-white/15 bg-slate-950/65 p-4 text-slate-100 shadow-2xl backdrop-blur-md space-y-3.5 transition-all ${isOpen ? 'block' : 'hidden'}`}
        >
            {/* En-tête épuré */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <span className="text-sm" aria-hidden="true">⚙️</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Réglages de Table</span>
                </div>
                <button type="button" onClick={onClose} aria-label="Fermer les paramètres" className="h-7 w-7 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white hover:border-white/25 flex items-center justify-center text-xs transition">✕</button>
            </div>

            {/* SECTION 1 : THÈME & PLATEAU */}
            <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thème &amp; Plateau</span>
                <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Thèmes du plateau">
                    {THEME_OPTIONS.map((opt) => {
                        const active = theme === opt.id;
                        return (
                            <button
                                key={opt.id} type="button" onClick={() => handleThemeSelect(opt.id)} title={opt.title}
                                data-testid={active ? 'hud-theme-toggle-btn' : `hud-theme-${opt.id}`} aria-pressed={active}
                                className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-bold transition ${
                                    active ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white shadow-sm' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'
                                }`}
                            >
                                <span aria-hidden="true" className={`h-3 w-3 rounded-full ring-1 shrink-0 ${opt.swatchClass}`} />
                                <span className="truncate">{opt.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                    <button
                        type="button" data-testid="orientation-toggle-btn" title="Inverser l'orientation et la numérotation 1..24"
                        onClick={() => { const next = toggleOrientation(boardOrientation); setBoardOrientation(next); saveOrientation(next); onToggleOrientation?.(); }}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs font-semibold text-slate-200 hover:border-white/25 transition"
                    >
                        <span>⇄ Sens</span>
                        <span className="font-mono text-[11px] font-bold text-amber-300">{boardOrientation === 'inverted' ? 'Miroir' : 'Std'}</span>
                    </button>
                    <button
                        type="button" data-testid="hud-pip-visibility-btn" title="Masquer ou afficher le Pip Count pour l'entraînement sur table (OTB)"
                        onClick={() => { const next = !pipVisible; setPipVisible(next); setSavedPipCountVisibility(next); }}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs font-semibold text-slate-200 hover:border-white/25 transition"
                    >
                        <span>👁 Pips</span>
                        <span className="font-mono text-[11px] font-bold text-amber-300">{pipVisible ? 'Visible' : 'OTB'}</span>
                    </button>
                </div>

                <button
                    type="button"
                    data-testid="hud-auto-validate-toggle"
                    onClick={() => {
                        const isCurrentlyAuto = effectiveAutoMode === 'always' || effectiveAutoMode === 'always_except_cube';
                        const next: AutoConfirmMode = isCurrentlyAuto ? 'never' : 'always';
                        setLocalAutoMode(next);
                        saveAutoConfirmMode(next);
                        onSelectAutoConfirmMode?.(next);
                    }}
                    className="flex items-center justify-between w-full rounded-xl border border-[#f3c65f]/40 bg-[#f3c65f]/10 px-3 py-2 text-xs font-bold text-white hover:border-[#f3c65f] transition"
                >
                    <span>⚡ Validation automatique des coups</span>
                    <span className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-black ${
                        effectiveAutoMode === 'always' || effectiveAutoMode === 'always_except_cube'
                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50'
                            : 'bg-white/10 text-slate-300'
                    }`}>
                        {effectiveAutoMode === 'always' || effectiveAutoMode === 'always_except_cube' ? 'ON' : 'OFF'}
                    </span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                    <button
                        type="button" onClick={handleCycleAutoMode} data-testid="hud-auto-confirm-btn"
                        title={AUTO_CONFIRM_MODE_LABELS[effectiveAutoMode].description}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs font-semibold text-slate-200 hover:border-white/25 transition"
                    >
                        <span>⚡ Mode</span>
                        <span className="font-mono text-[11px] font-bold text-amber-300">{AUTO_CONFIRM_MODE_LABELS[effectiveAutoMode].badge}</span>
                    </button>
                    <button
                        type="button" onClick={handleCycleSpeed} data-testid="hud-game-speed-btn"
                        title={SPEED_LABELS[effectiveSpeed].title}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs font-semibold text-slate-200 hover:border-white/25 transition"
                    >
                        <span>{SPEED_LABELS[effectiveSpeed].icon} Cadence</span>
                        <span className="font-mono text-[11px] font-bold text-amber-300">{SPEED_LABELS[effectiveSpeed].label}</span>
                    </button>
                </div>
            </div>

            {/* SECTION 2 : SON & AUDIO (Langue auto-détectée par le navigateur) */}
            <div className="flex flex-col gap-2 pt-2.5 border-t border-white/10">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Audio &amp; Acoustique</span>
                    <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] font-bold text-slate-400">
                        AUTO ({locale.toUpperCase()})
                    </span>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <button
                        type="button" onClick={onToggleSound} data-testid="audio-toggle-btn"
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-100 hover:text-amber-300 transition shrink-0"
                        title={isSoundMuted ? 'Activer le son' : 'Couper le son'} aria-label={isSoundMuted ? 'Activer le son' : 'Couper le son'}
                    >
                        <span>{isSoundMuted ? '🔇' : '🔊'}</span>
                        <span>{isSoundMuted ? 'Muet' : `${volumePct}%`}</span>
                    </button>
                    <input
                        id="audio-volume-slider" name="audioVolume" type="range" min={0} max={100} step={10} value={isSoundMuted ? 0 : volumePct} onChange={handleVolumeChange}
                        aria-label="Volume sonore" data-testid="audio-volume-slider"
                        className="w-full accent-[#f3c65f] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                </div>
            </div>

            {/* SECTION 3 : ALERTES COACH & OUTILS */}
            <div className="flex flex-col gap-2 pt-2.5 border-t border-white/10">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alertes Coach &amp; Outils</span>
                <div className="grid grid-cols-4 gap-1" role="group" aria-label="Seuil d'alerte du Coach">
                    {([
                        { id: 'all' as const, label: '🟢 Tous', title: 'Coach continu sur tous les coups (PR 1–5)' },
                        { id: 'error' as const, label: '🟡 Impréc.', title: 'Alerter dès une imprécision (> 0.020)' },
                        { id: 'blunder' as const, label: '🔴 Blunder', title: 'Alerter uniquement sur un blunder (> 0.080)' },
                        { id: 'silent' as const, label: '🔇 Muet', title: 'Mode silencieux (aucune alerte automatique)' },
                    ]).map((lvl) => (
                        <button
                            key={lvl.id} type="button" title={lvl.title} data-testid={`coach-threshold-${lvl.id}`} aria-pressed={notificationLevel === lvl.id}
                            onClick={() => onChangeNotificationLevel?.(lvl.id)}
                            className={`rounded-lg border px-1.5 py-1.5 text-[11px] font-bold transition ${
                                notificationLevel === lvl.id ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'
                            }`}
                        >
                            {lvl.label}
                        </button>
                    ))}
                </div>

                {onTriggerCoach && (
                    <button
                        type="button" onClick={() => { onClose(); onTriggerCoach(); }} data-testid="coach-hud-trigger"
                        title="Demander une analyse Coach Monte-Carlo 3-Ply sur la position courante"
                        className="flex items-center justify-between w-full rounded-xl border border-[#f3c65f]/50 bg-[#f3c65f]/10 px-3 py-2 text-xs font-bold text-white hover:border-[#f3c65f] transition"
                    >
                        <span>🎓 Analyser avec le Coach IA</span><span className="font-mono text-[11px] font-extrabold text-amber-300">3-PLY</span>
                    </button>
                )}
                {onOpenExportImport && (
                    <button
                        type="button" onClick={() => { onClose(); onOpenExportImport(); }} data-testid="export-import-hud-btn"
                        title="Exporter, importer ou partager la position (XGID) ou le match (SGF)"
                        className="flex items-center justify-between w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-white/25 hover:text-white transition"
                    >
                        <span>💾 Partager / XGID</span><span className="text-[11px] text-amber-300 font-mono">XG / SGF</span>
                    </button>
                )}
            </div>

            {/* SECTION 4 : ARBITRAGE DE MANCHE */}
            {(onResetGame || onResign) && (
                <div className="flex flex-col gap-1.5 pt-2.5 border-t border-white/10">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Concéder la manche</span>
                        {onResetGame && <button type="button" onClick={() => { onClose(); onResetGame(); }} className="text-[11px] font-semibold text-slate-400 hover:text-amber-200 transition" title="Réinitialiser le match">↺ Reset</button>}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        <button type="button" data-testid="resign-simple-btn" onClick={() => handleResignClick(1)} className="whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[11px] font-bold text-slate-200 hover:border-[#f3c65f] transition" title="Concéder la manche (Simple — 1x)">1× Simple</button>
                        <button type="button" data-testid="resign-gammon-btn" onClick={() => handleResignClick(2)} className="whitespace-nowrap rounded-lg border border-amber-500/40 bg-amber-950/30 px-2 py-1.5 text-[11px] font-bold text-amber-200 hover:border-amber-400 transition" title="Concéder la manche (Gammon — 2x)">2× Gammon</button>
                        <button type="button" data-testid="resign-bg-btn" onClick={() => handleResignClick(3)} className="whitespace-nowrap rounded-lg border border-rose-500/45 bg-rose-950/35 px-2 py-1.5 text-[11px] font-bold text-rose-200 hover:border-rose-400 transition" title="Concéder la manche (Backgammon — 3x)">3× BG</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const HudSettingsMenu = React.memo(HudSettingsMenuComponent);
export default HudSettingsMenu;
