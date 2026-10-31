'use client';

/**
 * @file src/components/lobby/LobbyOptionsPanel.tsx
 * @description Pupitre de Configuration de Table Privée & Tournoi (Cercle Monte-Carlo).
 * Architecture Split-Screen :
 * - Colonne Gauche : Configurateur Vertical épuré (Longueur, Horloge Bronstein WBGF, Bot Personnifié, Dames, Assistance) + CTA Or 24k
 * - Colonne Droite : LobbyInteractiveBoardPreview (Malle Monte-Carlo personnalisable)
 *
 * Contraintes : < 260 lignes, 0 `any`, zéro micro-texte < 11px.
 */

import React from 'react';
import type { Player } from '../../engine/backgammonEngine';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import { setSavedPipCountVisibility } from '../board/PipCountBadge';
import { LobbyInteractiveBoardPreview } from './LobbyInteractiveBoardPreview';
import { BotPortraitMedallion } from '../common/MonteCarloIcons';
import { getBotPersona } from '../../features/personas/botPersonas';
import { useTranslation } from '../../i18n';

export type LobbyClockPreset = 'blitz' | 'speed' | 'normal' | 'unlimited';

export interface ClockPresetOption {
    readonly value: LobbyClockPreset;
    readonly label: string;
    readonly hint: string;
    readonly icon: string;
}

export const DEFAULT_CLOCK_PRESETS: ReadonlyArray<ClockPresetOption> = [
    { value: 'blitz', label: 'Blitz Monte-Carlo', hint: '30s/pt + 5s', icon: '⚡' },
    { value: 'speed', label: 'Speedgammon', hint: '1m/pt + 8s', icon: '🔥' },
    { value: 'normal', label: 'Cadence WBF Tournoi', hint: '2m/pt + 12s', icon: '⏱️' },
    { value: 'unlimited', label: 'Partie Libre', hint: 'Sans pendule', icon: '∞' },
];

const CLOCK_MONTE_CARLO_ROWS: ReadonlyArray<{
    readonly value: LobbyClockPreset;
    readonly icon: string;
    readonly label: string;
    readonly cadence: string;
    readonly note: string;
}> = [
    {
        value: 'unlimited',
        icon: '☕',
        label: 'Partie Libre (Détente)',
        cadence: 'Sans pendule',
        note: 'Cadence libre : temps illimité, parfait pour analyser chaque coup avec le Coach IA.',
    },
    {
        value: 'normal',
        icon: '⏱️',
        label: 'Cadence WBF Officielle',
        cadence: '2m/pt + 12s Bronstein',
        note: 'Règlementation WBGF Art. 4.1b : réserve principale + délai Bronstein sans cumul de temps.',
    },
    {
        value: 'speed',
        icon: '⚡',
        label: 'Speedgammon de Club',
        cadence: '1m/pt + 8s Bronstein',
        note: 'Cadence dynamique des championnats de club pour travailler son jeu d’instinct.',
    },
    {
        value: 'blitz',
        icon: '🔥',
        label: 'Blitz Cup Monte-Carlo',
        cadence: '30s/pt + 5s Bronstein',
        note: 'Haute intensité : décisions en moins de 5 secondes, sorties et confirmations accélérées.',
    },
];

const ELO_MAP: Record<AIDifficulty, { elo: number; title: string }> = {
    beginner: { elo: 1420, title: 'Initié · Arthur' },
    intermediate: { elo: 1680, title: 'Stratège · Elena' },
    expert: { elo: 1950, title: 'Maître · Marcus' },
    grandmaster: { elo: 2150, title: 'Grand-Maître · Spinoza' },
};

export interface LobbyOptionsPanelProps {
    readonly matchLength: number;
    readonly setMatchLength: (val: number) => void;
    readonly difficulty: AIDifficulty;
    readonly setDifficulty: (val: AIDifficulty) => void;
    readonly coachEnabled: boolean;
    readonly setCoachEnabled: (val: boolean) => void;
    readonly playerColor: Player;
    readonly onSelectPlayerColor: (color: Player) => void;
    readonly matchFormats: Array<{ value: number; label: string; hint: string }>;
    readonly opponents: Array<{ value: AIDifficulty; label: string; hint: string }>;
    readonly clockPreset?: LobbyClockPreset;
    readonly setClockPreset?: (preset: LobbyClockPreset) => void;
    readonly clockPresets?: ReadonlyArray<ClockPresetOption>;
    readonly onClose?: () => void;
    readonly onStartGame?: () => void;
}

const ACTIVE_GOLD = 'border-2 border-[#f3c65f] bg-[#f3c65f]/20 text-[#fdf8eb] shadow-[0_0_18px_rgba(243,198,95,0.25)]';
const INACTIVE_CARD = 'border border-white/10 bg-[#0d1222] text-slate-300 hover:border-white/25 hover:text-white';

export const LobbyOptionsPanel: React.FC<LobbyOptionsPanelProps> = React.memo(({
    matchLength,
    setMatchLength,
    difficulty,
    setDifficulty,
    coachEnabled,
    setCoachEnabled,
    playerColor,
    onSelectPlayerColor,
    opponents,
    clockPreset = 'normal',
    setClockPreset,
    onClose,
    onStartGame,
}) => {
    const { locale } = useTranslation();
    const isMoneyGame = matchLength === 0;
    const lengthValues = [1, 3, 5, 7, 11];
    const currentClock = CLOCK_MONTE_CARLO_ROWS.find((c) => c.value === clockPreset) ?? CLOCK_MONTE_CARLO_ROWS[1];
    const currentBotBase = ELO_MAP[difficulty] ?? ELO_MAP.expert;
    const localizedPersona = getBotPersona(difficulty, locale);
    const currentBot = { elo: currentBotBase.elo, title: `${localizedPersona.shortName} · ${localizedPersona.styleBadge}` };

    return (
        <div data-testid="lobby-options-panel" className="mt-2 rounded-3xl border border-white/10 bg-[#070b16]/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
            {/* Barre de Titre Haute Horlogerie */}
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400 text-slate-950 font-black text-xs shadow">
                        ◆
                    </span>
                    <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                        Salon Privé &amp; Configuration de la Table
                    </h2>
                </div>
                {onClose && (
                    <button type="button" onClick={onClose} aria-label="Replier les paramètres de table" className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white">
                        Fermer ▴
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-start">
                {/* COLONNE GAUCHE : Configurateur vertical aéré */}
                <div className="flex flex-col gap-3.5 rounded-2xl border border-white/10 bg-[#0c1120] p-4 shadow-xl">
                    {/* 1. Longueur & Formule de Match */}
                    <fieldset>
                        <legend className="mb-2 flex w-full items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                            <span>Formule de la Partie</span>
                            <button
                                type="button"
                                data-testid="lobby-format-type-match"
                                aria-pressed={!isMoneyGame}
                                onClick={() => setMatchLength(isMoneyGame ? 7 : matchLength)}
                                className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold transition ${!isMoneyGame ? 'border border-[#f3c65f]/60 bg-[#f3c65f]/15 text-amber-200' : 'text-slate-400 hover:text-white'}`}
                            >
                                {!isMoneyGame ? `🏆 Règle de Crawford (${matchLength} pts)` : 'Basculer en Match'}
                            </button>
                        </legend>
                        <div className="grid grid-cols-6 gap-1.5">
                            {lengthValues.map((val) => (
                                <button key={val} type="button" data-testid={`lobby-format-${val}`} aria-pressed={matchLength === val} onClick={() => setMatchLength(val)} className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition active:scale-95 ${matchLength === val ? ACTIVE_GOLD : INACTIVE_CARD}`}>
                                    <span className="font-mono text-sm font-black">{val}</span>
                                    <span className="text-[11px] font-medium opacity-80">pts</span>
                                </button>
                            ))}
                            <button type="button" data-testid="lobby-format-0" aria-pressed={isMoneyGame} onClick={() => setMatchLength(0)} className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition active:scale-95 ${isMoneyGame ? ACTIVE_GOLD : INACTIVE_CARD}`}>
                                <span className="font-mono text-sm font-black">💰</span>
                                <span className="text-[11px] font-bold opacity-90">Libre</span>
                            </button>
                        </div>
                    </fieldset>

                    {/* 2. Horloge & Décompte Bronstein */}
                    <fieldset>
                        <legend className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                            Horloge de Jeu (Délai Bronstein WBGF)
                        </legend>
                        <div className="flex flex-col gap-1.5">
                            {CLOCK_MONTE_CARLO_ROWS.map((row) => {
                                const active = clockPreset === row.value;
                                return (
                                    <button key={row.value} type="button" data-testid={`lobby-clock-${row.value}`} aria-pressed={active} onClick={() => setClockPreset?.(row.value)} className={`flex items-center justify-between rounded-xl px-3.5 py-2 text-left transition active:scale-[0.99] ${active ? ACTIVE_GOLD : INACTIVE_CARD}`}>
                                        <div className="flex items-center gap-2.5">
                                            <span className={`flex h-4 w-4 items-center justify-center rounded border text-[11px] font-bold ${active ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-600 bg-slate-800'}`}>{active ? '✓' : ''}</span>
                                            <span className="text-xs sm:text-sm font-bold">{row.icon} {row.label}</span>
                                        </div>
                                        <span className="font-mono text-[11px] text-slate-400 font-semibold">{row.cadence}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-200 leading-snug">
                            {currentClock.note}
                        </div>
                    </fieldset>

                    {/* 3. Adversaire Open Sage */}
                    <fieldset>
                        <legend className="mb-2 flex w-full items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                            <span>Adversaire Virtuel</span>
                            <span className="font-mono text-amber-300 font-bold">{currentBot.title} ({currentBot.elo} Elo)</span>
                        </legend>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {opponents.map((opt) => {
                                const active = difficulty === opt.value;
                                return (
                                    <button key={opt.value} type="button" data-testid={`lobby-opponent-${opt.value}`} aria-pressed={active} onClick={() => setDifficulty(opt.value)} className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-center transition active:scale-95 ${active ? ACTIVE_GOLD : INACTIVE_CARD}`}>
                                        <BotPortraitMedallion character={opt.value} size="sm" isActive={active} />
                                        <span className="text-xs font-bold truncate w-full">{opt.label}</span>
                                        <span className="text-[11px] text-slate-400 truncate w-full">{opt.hint}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* 4. Vos Dames & Assistance Coach IA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <fieldset>
                            <legend className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-300">Vos Dames</legend>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button type="button" data-testid="lobby-color-x" aria-pressed={playerColor === 'X'} onClick={() => onSelectPlayerColor('X')} className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition active:scale-95 ${playerColor === 'X' ? ACTIVE_GOLD : INACTIVE_CARD}`}>
                                    <span className="h-3 w-3 rounded-full bg-[#fdfcf7] border border-amber-300 shadow-sm" />
                                    <span>Blancs (X)</span>
                                </button>
                                <button type="button" data-testid="lobby-color-o" aria-pressed={playerColor === 'O'} onClick={() => onSelectPlayerColor('O')} className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition active:scale-95 ${playerColor === 'O' ? ACTIVE_GOLD : INACTIVE_CARD}`}>
                                    <span className="h-3 w-3 rounded-full bg-[#18181b] border border-amber-300 shadow-sm" />
                                    <span>Noirs (O)</span>
                                </button>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-300">Assistance Coach</legend>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button type="button" data-testid="lobby-mode-training" aria-pressed={coachEnabled} onClick={() => { setCoachEnabled(true); setSavedPipCountVisibility(true); }} className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition active:scale-95 ${coachEnabled ? ACTIVE_GOLD : INACTIVE_CARD}`}>
                                    <span>🎓</span><span>Coach IA</span>
                                </button>
                                <button type="button" data-testid="lobby-mode-tournament" aria-pressed={!coachEnabled} onClick={() => { setCoachEnabled(false); setSavedPipCountVisibility(false); }} className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition active:scale-95 ${!coachEnabled ? ACTIVE_GOLD : INACTIVE_CARD}`}>
                                    <span>🏆</span><span>Sans aide</span>
                                </button>
                            </div>
                        </fieldset>
                    </div>

                    {/* 5. Bouton Principal Signature Or 24k */}
                    <button
                        type="button"
                        data-testid="lobby-options-start-btn"
                        onClick={onStartGame}
                        className="mt-2 w-full rounded-2xl bg-gradient-to-r from-[#f3c65f] via-[#f7d77e] to-[#e5b548] py-3.5 px-4 text-center font-sans text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_4px_24px_rgba(243,198,95,0.4)] transition hover:brightness-105 active:scale-[0.99]"
                    >
                        🎲 Lancer la Table ({isMoneyGame ? 'Partie Libre' : `Match ${matchLength} pts`})
                    </button>
                </div>

                {/* COLONNE DROITE : Grand Plateau Monte-Carlo en direct */}
                <div className="w-full">
                    <LobbyInteractiveBoardPreview
                        matchLength={matchLength}
                        difficulty={difficulty}
                        coachEnabled={coachEnabled}
                        playerColor={playerColor}
                        onTogglePlayerColor={() => onSelectPlayerColor(playerColor === 'X' ? 'O' : 'X')}
                        clockPreset={clockPreset}
                    />
                </div>
            </div>
        </div>
    );
});

LobbyOptionsPanel.displayName = 'LobbyOptionsPanel';
export default LobbyOptionsPanel;
