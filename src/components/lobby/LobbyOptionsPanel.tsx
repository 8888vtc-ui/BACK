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
import { setSavedPipCountVisibility } from '../board/PipCountBadge';

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
    const isMoneyGame = matchLength === 0;
    const pointFormats = matchFormats.filter((opt) => opt.value > 0);

    return (
        <div
            data-testid="lobby-options-panel"
            className="mt-2 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl"
        >
            {/* Barre de titre du pupitre */}
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        ⚙️ Configuration Détaillée de la Partie
                    </span>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Replier les paramètres de table"
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:border-white/25 hover:text-white"
                    >
                        Fermer ▴
                    </button>
                )}
            </div>

            {/* Grille 2 colonnes aérée */}
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                {/* COLONNE GAUCHE : Format du Match (Match vs Money Game) + Cadence Pendule */}
                <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-3">
                    {/* 1. Distinction claire : Match à Points (Crawford) vs Money Game (Jacoby) */}
                    <fieldset>
                        <legend className="mb-2 flex items-center justify-between w-full text-[11px] font-bold uppercase tracking-wider text-slate-300">
                            <span>Formule de Jeu</span>
                            <span className="font-mono text-[11px] font-normal text-amber-300">
                                {isMoneyGame ? 'Règle de Jacoby · Score infini' : `1er à ${matchLength} pts · Règle de Crawford`}
                            </span>
                        </legend>
                        <div className="mb-2 grid grid-cols-2 gap-1.5">
                            <button
                                type="button" data-testid="lobby-format-type-match" aria-pressed={!isMoneyGame}
                                onClick={() => setMatchLength(isMoneyGame ? 7 : matchLength)}
                                className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition ${!isMoneyGame ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'}`}
                            >
                                <span className="text-xs font-bold">🏆 Match (Tournoi)</span>
                                <span className="text-[11px] text-slate-400">Course aux points · Crawford</span>
                            </button>
                            <button
                                type="button" data-testid="lobby-format-0" aria-pressed={isMoneyGame}
                                onClick={() => setMatchLength(0)}
                                className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition ${isMoneyGame ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'}`}
                            >
                                <span className="text-xs font-bold">💰 Money Game</span>
                                <span className="text-[11px] text-slate-400">Partie au point · Jacoby actif</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                            {pointFormats.map((opt) => {
                                const active = matchLength === opt.value;
                                return (
                                    <button
                                        key={opt.value} type="button" data-testid={`lobby-format-${opt.value}`} aria-pressed={active} title={opt.hint}
                                        onClick={() => setMatchLength(opt.value)}
                                        className={`rounded-lg border px-2 py-1.5 text-xs font-bold transition ${active ? 'border-[#f3c65f] bg-[#f3c65f]/20 text-amber-200' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'}`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* 2. Cadence (Pendule Fischer / Bronstein) */}
                    <fieldset>
                        <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                            Cadence (Pendule WBF)
                        </legend>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {clockPresets.map((preset) => {
                                const active = clockPreset === preset.value;
                                return (
                                    <button
                                        key={preset.value} type="button" data-testid={`lobby-clock-${preset.value}`} aria-pressed={active} title={preset.hint}
                                        onClick={() => setClockPreset?.(preset.value)}
                                        className={`flex flex-col items-start rounded-lg border px-2.5 py-2 text-left transition ${active ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'}`}
                                    >
                                        <span className="flex items-center gap-1 text-xs font-bold">
                                            <span aria-hidden="true">{preset.icon}</span>
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
                <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-3">
                    {/* 3. Niveau de l'Adversaire IA */}
                    <fieldset>
                        <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                            Niveau de l’IA (Moteur Open Sage)
                        </legend>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {opponents.map((opt) => {
                                const active = difficulty === opt.value;
                                return (
                                    <button
                                        key={opt.value} type="button" data-testid={`lobby-opponent-${opt.value}`} aria-pressed={active} title={opt.hint}
                                        onClick={() => setDifficulty(opt.value)}
                                        className={`flex flex-col items-start rounded-lg border px-2.5 py-2 text-left transition ${active ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'}`}
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
                        <fieldset>
                            <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-300">Assistance en Partie</legend>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    type="button" data-testid="lobby-mode-training" aria-pressed={coachEnabled}
                                    onClick={() => { setCoachEnabled(true); setSavedPipCountVisibility(true); }}
                                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-bold transition ${coachEnabled ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'}`}
                                >
                                    <span aria-hidden="true">🎓</span><span>Coach IA</span>
                                </button>
                                <button
                                    type="button" data-testid="lobby-mode-tournament" aria-pressed={!coachEnabled}
                                    onClick={() => { setCoachEnabled(false); setSavedPipCountVisibility(false); }}
                                    title="Mode Tournoi Live : sans Coach et sans Pip Count"
                                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-bold transition ${!coachEnabled ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'}`}
                                >
                                    <span aria-hidden="true">🏆</span><span>Sans aide</span>
                                </button>
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-300">Vos Pions</legend>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    type="button" data-testid="lobby-color-x" aria-pressed={playerColor === 'X'} onClick={() => onSelectPlayerColor('X')}
                                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-bold transition ${playerColor === 'X' ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'}`}
                                >
                                    <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20 bg-gradient-to-br from-[#fffdf7] via-[#f3e6c8] to-[#b89b67] shadow-sm" />
                                    <span>Blancs (X)</span>
                                </button>
                                <button
                                    type="button" data-testid="lobby-color-o" aria-pressed={playerColor === 'O'} onClick={() => onSelectPlayerColor('O')}
                                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-bold transition ${playerColor === 'O' ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'}`}
                                >
                                    <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20 bg-gradient-to-br from-[#3a3f4d] via-[#181b24] to-[#06070a] shadow-sm" />
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
