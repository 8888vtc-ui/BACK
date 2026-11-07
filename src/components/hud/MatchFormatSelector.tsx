'use client';

/**
 * Sélecteur de format de match (Money Game, Match 3/5/7/9/11/21 points) & Horloge WBGF.
 */

import React from 'react';

export type MatchFormat = 0 | 3 | 5 | 7 | 9 | 11 | 21;
export type MatchClockPreset = 'blitz' | 'standard' | 'tournament' | 'unlimited';
export type OpponentTierChoice = 'auto' | 'beginner' | 'intermediate' | 'expert';

export const MATCH_FORMAT_KEY = 'backgammon_match_format';
export const CLOCK_PRESET_KEY = 'backgammon_clock_preset';
export const OPPONENT_TIER_KEY = 'backgammon_opponent_tier';

const FORMATS: Array<{
    value: MatchFormat;
    label: string;
    short: string;
    icon: string;
    desc: string;
}> = [
    { value: 0, label: 'Money Game', short: 'Money', icon: '💰', desc: "Partie d'argent — le videau reste actif en permanence." },
    { value: 3, label: 'Match 3 pts', short: '3', icon: '', desc: 'Match court — premier à 3 points.' },
    { value: 5, label: 'Match 5 pts', short: '5', icon: '', desc: 'Match rapide — premier à 5 points.' },
    { value: 7, label: 'Match 7 pts', short: '7', icon: '🏆', desc: 'Match standard — premier à 7 points.' },
    { value: 9, label: 'Match 9 pts', short: '9', icon: '👑', desc: 'Match long — premier à 9 points.' },
];

export interface MatchFormatSelectorProps {
    value: MatchFormat;
    onChange: (format: MatchFormat) => void;
    disabled?: boolean;
}

export function readStoredMatchFormat(): MatchFormat {
    if (typeof window === 'undefined') return 7;
    const raw = localStorage.getItem(MATCH_FORMAT_KEY);
    if (raw === null) return 7;
    const parsed = Number(raw);
    return (parsed === 0 || parsed === 3 || parsed === 5 || parsed === 7 || parsed === 9 || parsed === 11 || parsed === 21) ? (parsed as MatchFormat) : 7;
}

export function storeMatchFormat(format: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MATCH_FORMAT_KEY, String(format));
    window.dispatchEvent(new Event('bg-match-setup-changed'));
}

export function readStoredClockPreset(): MatchClockPreset {
    if (typeof window === 'undefined') return 'standard';
    const raw = localStorage.getItem(CLOCK_PRESET_KEY);
    if (raw === 'blitz' || raw === 'standard' || raw === 'tournament' || raw === 'unlimited') return raw;
    if (raw === 'speed') return 'standard';
    if (raw === 'normal') return 'tournament';
    return 'standard';
}

export function storeClockPreset(preset: MatchClockPreset): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CLOCK_PRESET_KEY, preset);
    window.dispatchEvent(new Event('bg-match-setup-changed'));
}

export function readStoredOpponentTier(): OpponentTierChoice {
    if (typeof window === 'undefined') return 'auto';
    const raw = localStorage.getItem(OPPONENT_TIER_KEY);
    if (raw === 'auto' || raw === 'beginner' || raw === 'intermediate' || raw === 'expert') return raw;
    return 'auto';
}

export function storeOpponentTier(tier: OpponentTierChoice): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(OPPONENT_TIER_KEY, tier);
    window.dispatchEvent(new Event('bg-match-setup-changed'));
}

export function getClockConfigForPreset(preset: MatchClockPreset): {
    type: 'bronstein' | 'unlimited';
    bankMs: number;
    delaySeconds: number;
    labelFr: string;
    labelEn: string;
    shortClock: string;
} {
    switch (preset) {
        case 'blitz':
            return { type: 'bronstein', bankMs: 3 * 60 * 1000, delaySeconds: 8, labelFr: 'Horloge Blitz (03:00 +8s)', labelEn: 'Blitz Clock (03:00 +8s)', shortClock: '03:00 (+8s)' };
        case 'tournament':
            return { type: 'bronstein', bankMs: 14 * 60 * 1000, delaySeconds: 12, labelFr: 'Horloge Tournoi Master (14:00 +12s)', labelEn: 'Master Tournament Clock (14:00 +12s)', shortClock: '14:00 (+12s)' };
        case 'unlimited':
            return { type: 'unlimited', bankMs: 999999999, delaySeconds: 0, labelFr: 'Sans Horloge (À votre rythme)', labelEn: 'No Clock (Your own pace)', shortClock: '∞ À votre rythme' };
        case 'standard':
        default:
            return { type: 'bronstein', bankMs: 10 * 60 * 1000, delaySeconds: 8, labelFr: 'Horloge Standard (10:00 +8s)', labelEn: 'Standard Clock (10:00 +8s)', shortClock: '10:00 (+8s)' };
    }
}

export function syncMatchSetupUrl(matchLength: number, clockPreset: MatchClockPreset): void {
    if (typeof window === 'undefined') return;
    try {
        const url = new URL(window.location.href);
        url.searchParams.set('mode', 'matchmaking');
        url.searchParams.set('match', String(matchLength));
        url.searchParams.set('clock', clockPreset);
        window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
    } catch { /* ignore in test env */ }
}

export default function MatchFormatSelector({
    value,
    onChange,
    disabled = false,
}: MatchFormatSelectorProps) {
    return (
        <div
            role="radiogroup"
            aria-label="Format de match"
            className="flex items-center gap-1 rounded-xl border border-slate-700/60 bg-slate-900/80 p-1 backdrop-blur-sm"
        >
            <span className="hidden sm:inline-block px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Format :
            </span>

            {FORMATS.map((format) => {
                const isActive = value === format.value;
                return (
                    <button
                        key={format.value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        disabled={disabled}
                        onClick={() => onChange(format.value)}
                        title={format.desc}
                        className={`group relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${isActive
                            ? 'border-indigo-500/80 bg-indigo-950/60 text-indigo-200 shadow-md ring-1 ring-white/10'
                            : 'border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-200'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                    >
                        <span className="text-xs">{format.icon}</span>
                        <span>{format.short}</span>
                    </button>
                );
            })}
        </div>
    );
}
