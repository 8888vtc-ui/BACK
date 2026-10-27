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
            className="mt-2.5 rounded-2xl border border-white/10 bg-[#0b101b]/95 p-4 shadow-2xl backdrop-blur-xl"
        >
            {/* Barre de titre du pupitre */}
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-xs text-[#f3c65f]">⚜</span>
                    <span className="font-serif text-xs font-bold uppercase tracking-[0.18em] text-[#fdf8eb]">
                        Configuration de la Partie
                    </span>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Replier les paramètres de table"
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-amber-200 transition hover:border-white/25 hover:text-white"
                    >
                        Fermer ▴
                    </button>
                )}
            </div>

            {/* Grille 2 colonnes aérée */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* COLONNE GAUCHE : Format du Match + Cadence Pendule */}
                <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#070a12]/80 p-3">
                    {/* 1. Format du Match */}
                    <fieldset>
                        <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#e5c158]">
                            Format du Match
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
                                        className={`rounded-lg border px-2 py-2 text-xs font-bold transition ${
                                            active
                                                ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* 2. Cadence (Pendule Fischer / Bronstein) */}
                    <fieldset>
                        <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#e5c158]">
                            Cadence (Pendule)
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
                                        className={`flex flex-col items-start rounded-lg border px-2.5 py-2 text-left transition ${
                                            active
                                                ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'
                                        }`}
                                    >
                                        <span className="flex items-center gap-1 text-xs font-bold">
                                            <span aria-hidden="true" className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">
                                                {preset.icon}
                                            </span>
                                            <span>{preset.label}</span>
                                        </span>
                                        <span className="font-mono text-[11px] text-slate-400">{preset.hint}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>
                </div>

                {/* COLONNE DROITE : Adversaire Open Sage + Coach & Couleur Pions */}
                <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#070a12]/80 p-3">
                    {/* 3. Niveau de l'Adversaire IA */}
                    <fieldset>
                        <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#e5c158]">
                            Niveau de l’IA
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
                                        className={`flex flex-col items-start rounded-lg border px-2.5 py-2 text-left transition ${
                                            active
                                                ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'
                                        }`}
                                    >
                                        <span className="text-xs font-bold truncate w-full">{opt.label}</span>
                                        <span className="text-[11px] text-slate-400 truncate w-full">{opt.hint}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* 4. Accompagnement Coach & Couleur des Pions côte à côte */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Mode Coach */}
                        <fieldset>
                            <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#e5c158]">
                                Mode d’Arbitrage
                            </legend>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    type="button"
                                    data-testid="lobby-mode-training"
                                    aria-pressed={coachEnabled}
                                    onClick={() => setCoachEnabled(true)}
                                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-bold transition ${
                                        coachEnabled
                                            ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
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
                                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-bold transition ${
                                        !coachEnabled
                                            ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
                                    }`}
                                >
                                    <span aria-hidden="true" className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">🏆</span>
                                    <span>Tournoi</span>
                                </button>
                            </div>
                        </fieldset>

                        {/* Couleur des pions avec vrais médaillons 3D Ivoire / Ébène */}
                        <fieldset>
                            <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#e5c158]">
                                Vos Pions
                            </legend>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    type="button"
                                    data-testid="lobby-color-x"
                                    aria-pressed={playerColor === 'X'}
                                    onClick={() => onSelectPlayerColor('X')}
                                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-bold transition ${
                                        playerColor === 'X'
                                            ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20 bg-gradient-to-br from-[#fffdf7] via-[#f3e6c8] to-[#b89b67] shadow-sm"
                                    />
                                    <span>Blancs (X)</span>
                                </button>
                                <button
                                    type="button"
                                    data-testid="lobby-color-o"
                                    aria-pressed={playerColor === 'O'}
                                    onClick={() => onSelectPlayerColor('O')}
                                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-bold transition ${
                                        playerColor === 'O'
                                            ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20 bg-gradient-to-br from-[#3a3f4d] via-[#181b24] to-[#06070a] shadow-sm"
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
