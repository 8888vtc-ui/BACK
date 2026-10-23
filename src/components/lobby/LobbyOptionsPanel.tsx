'use client';

/**
 * Pupitre de Configuration de Table Privée (Direction Artistique Salon Monte-Carlo / XG).
 *
 * Ergonomie User-Friendly Max :
 * - Architecture compacte en grille 2 colonnes pour garder le bouton « JOUER MAINTENANT » visible sans défilement
 * - Médaillons de pions 3D en Ivoire & Ébène (zéro emoji générique)
 * - Icônes filtrées Or 24k & cadre en laiton brossé (LOI 5 — ≤ 300 lignes, 0 any).
 */

import React from 'react';
import type { Player } from '../../engine/backgammonEngine';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';

export type LobbyClockPreset = 'blitz' | 'speed' | 'normal' | 'unlimited';

export interface ClockPresetOption {
    value: LobbyClockPreset;
    label: string;
    hint: string;
    icon: string;
}

export const DEFAULT_CLOCK_PRESETS: ReadonlyArray<ClockPresetOption> = [
    { value: 'blitz', label: 'Blitz', hint: '30s/pt + 5s', icon: '⚡' },
    { value: 'speed', label: 'Speed', hint: '1m/pt + 8s', icon: '🔥' },
    { value: 'normal', label: 'Normal', hint: '2m/pt + 12s', icon: '⏱️' },
    { value: 'unlimited', label: 'Illimité', hint: 'Sans pendule', icon: '∞' },
];

export interface LobbyOptionsPanelProps {
    matchLength: number;
    setMatchLength: (val: number) => void;
    difficulty: AIDifficulty;
    setDifficulty: (val: AIDifficulty) => void;
    coachEnabled: boolean;
    setCoachEnabled: (val: boolean) => void;
    playerColor: Player;
    onSelectPlayerColor: (color: Player) => void;
    matchFormats: Array<{ value: number; label: string; hint: string }>;
    opponents: Array<{ value: AIDifficulty; label: string; hint: string }>;
    clockPreset?: LobbyClockPreset;
    setClockPreset?: (preset: LobbyClockPreset) => void;
    clockPresets?: ReadonlyArray<ClockPresetOption>;
    onClose?: () => void;
}

export const LobbyOptionsPanel: React.FC<LobbyOptionsPanelProps> = React.memo(({
    matchLength,
    setMatchLength,
    difficulty,
    setDifficulty,
    coachEnabled,
    setCoachEnabled,
    playerColor,
    onSelectPlayerColor,
    matchFormats,
    opponents,
    clockPreset = 'normal',
    setClockPreset,
    clockPresets = DEFAULT_CLOCK_PRESETS,
    onClose,
}) => {
    return (
        <div
            data-testid="lobby-options-panel"
            className="mt-2.5 rounded-2xl border border-[#d4af37]/45 bg-gradient-to-b from-[#131926]/95 via-[#0d121d]/95 to-[#070a10]/98 p-3.5 shadow-[0_18px_44px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,245,205,0.22)] backdrop-blur-xl"
        >
            {/* Barre de titre du pupitre */}
            <div className="mb-2.5 flex items-center justify-between border-b border-[#d4af37]/20 pb-2">
                <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-xs text-[#f3c65f]">⚜</span>
                    <span className="font-serif text-[11px] font-bold uppercase tracking-[0.22em] text-[#fdf8eb]">
                        Pupitre de Configuration · Table Privée
                    </span>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Replier les paramètres de table"
                        className="rounded-lg border border-[#d4af37]/30 bg-black/40 px-2 py-0.5 text-[10px] font-bold text-[#e5c158] transition hover:border-[#f3c65f] hover:text-white"
                    >
                        Valider & Replier ▴
                    </button>
                )}
            </div>

            {/* Grille compacte 2 colonnes pour maximiser la lisibilité sans scroller */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* COLONNE GAUCHE : Format du Match + Cadence Pendule */}
                <div className="flex flex-col gap-2.5 rounded-xl border border-[#d4af37]/20 bg-[#080c14]/80 p-2.5">
                    {/* 1. Format du Match */}
                    <fieldset>
                        <legend className="mb-1.5 flex items-center justify-between w-full text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#e5c158]">
                            <span>1. Format du Match</span>
                            <span className="font-mono text-[9px] font-normal text-slate-400">Règle de Crawford incluse</span>
                        </legend>
                        <div className="grid grid-cols-5 gap-1.5">
                            {matchFormats.map((opt) => {
                                const active = matchLength === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        data-testid={`lobby-format-${opt.value}`}
                                        aria-pressed={active}
                                        title={opt.hint}
                                        onClick={() => setMatchLength(opt.value)}
                                        className={`rounded-lg border px-1.5 py-1.5 text-[11px] font-extrabold transition ${
                                            active
                                                ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-[0_0_12px_rgba(212,175,55,0.3),inset_0_1px_0_rgba(255,245,205,0.35)]'
                                                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#d4af37]/45 hover:text-white'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* 2. Cadence (Pendule Bronstein / Fischer) */}
                    <fieldset>
                        <legend className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#e5c158]">
                            2. Cadence (Pendule Fischer / Bronstein)
                        </legend>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {clockPresets.map((preset) => {
                                const active = clockPreset === preset.value;
                                return (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        data-testid={`lobby-clock-${preset.value}`}
                                        aria-pressed={active}
                                        title={preset.hint}
                                        onClick={() => setClockPreset?.(preset.value)}
                                        className={`flex flex-col items-start rounded-lg border px-2 py-1.5 text-left transition ${
                                            active
                                                ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-[0_0_12px_rgba(212,175,55,0.25),inset_0_1px_0_rgba(255,245,205,0.35)]'
                                                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#d4af37]/45 hover:text-white'
                                        }`}
                                    >
                                        <span className="flex items-center gap-1 text-[10px] font-bold">
                                            <span aria-hidden="true" className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">
                                                {preset.icon}
                                            </span>
                                            <span>{preset.label}</span>
                                        </span>
                                        <span className="font-mono text-[8px] text-amber-200/70">{preset.hint}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>
                </div>

                {/* COLONNE DROITE : Adversaire Open Sage + Coach & Couleur Pions */}
                <div className="flex flex-col gap-2.5 rounded-xl border border-[#d4af37]/20 bg-[#080c14]/80 p-2.5">
                    {/* 3. Niveau de l'Adversaire IA */}
                    <fieldset>
                        <legend className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#e5c158]">
                            3. Calibre de l’Adversaire (Moteur Open Sage)
                        </legend>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {opponents.map((opt) => {
                                const active = difficulty === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        data-testid={`lobby-opponent-${opt.value}`}
                                        aria-pressed={active}
                                        title={opt.hint}
                                        onClick={() => setDifficulty(opt.value)}
                                        className={`flex flex-col items-start rounded-lg border px-2 py-1.5 text-left transition ${
                                            active
                                                ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-[0_0_12px_rgba(212,175,55,0.25),inset_0_1px_0_rgba(255,245,205,0.35)]'
                                                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#d4af37]/45 hover:text-white'
                                        }`}
                                    >
                                        <span className="text-[10px] font-bold truncate w-full">{opt.label}</span>
                                        <span className="text-[8px] text-amber-200/70 truncate w-full">{opt.hint}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* 4. Accompagnement Coach & Couleur des Pions côte à côte */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Mode Coach */}
                        <fieldset>
                            <legend className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#e5c158]">
                                4. Arbitrage & Coach
                            </legend>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    type="button"
                                    data-testid="lobby-mode-training"
                                    aria-pressed={coachEnabled}
                                    onClick={() => setCoachEnabled(true)}
                                    className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-bold transition ${
                                        coachEnabled
                                            ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#d4af37]/40'
                                    }`}
                                >
                                    <span aria-hidden="true" className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">🎓</span>
                                    <span>Coach</span>
                                </button>
                                <button
                                    type="button"
                                    data-testid="lobby-mode-tournament"
                                    aria-pressed={!coachEnabled}
                                    onClick={() => setCoachEnabled(false)}
                                    className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-bold transition ${
                                        !coachEnabled
                                            ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#d4af37]/40'
                                    }`}
                                >
                                    <span aria-hidden="true" className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">🏆</span>
                                    <span>Tournoi</span>
                                </button>
                            </div>
                        </fieldset>

                        {/* Couleur des pions avec vrais médaillons 3D Ivoire / Ébène */}
                        <fieldset>
                            <legend className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#e5c158]">
                                5. Vos Pions (Trait Humain)
                            </legend>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    type="button"
                                    data-testid="lobby-color-x"
                                    aria-pressed={playerColor === 'X'}
                                    onClick={() => onSelectPlayerColor('X')}
                                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-bold transition ${
                                        playerColor === 'X'
                                            ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#d4af37]/40'
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-[#c4a265] bg-gradient-to-br from-[#fffdf7] via-[#f3e6c8] to-[#b89b67] shadow-[0_1px_3px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                                    />
                                    <span>Blancs (X)</span>
                                </button>
                                <button
                                    type="button"
                                    data-testid="lobby-color-o"
                                    aria-pressed={playerColor === 'O'}
                                    onClick={() => onSelectPlayerColor('O')}
                                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-bold transition ${
                                        playerColor === 'O'
                                            ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#d4af37]/40'
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-[#d4af37]/70 bg-gradient-to-br from-[#3a3f4d] via-[#181b24] to-[#06070a] shadow-[0_1px_3px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.25)]"
                                    />
                                    <span>Noirs (O)</span>
                                </button>
                            </div>
                        </fieldset>
                    </div>
                </div>
            </div>
        </div>
    );
});

LobbyOptionsPanel.displayName = 'LobbyOptionsPanel';
