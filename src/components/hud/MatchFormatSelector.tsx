'use client';

/**
 * Sélecteur de format de match (Money Game, Match 3/5/7/9/11/21 points) & Horloge WBGF.
 */

import React from 'react';
import { SlidersHorizontal, Zap, Flame, Clock, Landmark, Infinity as InfinityIcon, X } from 'lucide-react';

export type MatchFormat = 0 | 3 | 5 | 7 | 9 | 11 | 21;
export type MatchClockPreset = 'blitz' | 'standard' | 'tournament' | 'unlimited';
export type OpponentTierChoice = 'auto' | 'beginner' | 'intermediate' | 'expert';

export const MATCH_FORMAT_KEY = 'backgammon_match_format';
export const MATCH_FORMATS_MULTI_KEY = 'backgammon_match_formats_multi';
export const CLOCK_PRESET_KEY = 'backgammon_clock_preset';
export const CLOCK_PRESETS_MULTI_KEY = 'backgammon_clock_presets_multi';
export const OPPONENT_TIER_KEY = 'backgammon_opponent_tier';

const AUTO_MATCH_POOL: readonly number[] = [3, 5, 7, 0];

export function readStoredMatchFormatsMulti(): number[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(MATCH_FORMATS_MULTI_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.map(Number).filter((n) => [0, 3, 5, 7, 11].includes(n));
        }
    } catch { /* ignore */ }
    return [];
}

export function storeMatchFormatsMulti(formats: number[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MATCH_FORMATS_MULTI_KEY, JSON.stringify(formats));
    const primary = formats.length > 0 ? formats[0] : 5;
    localStorage.setItem(MATCH_FORMAT_KEY, String(primary));
    window.dispatchEvent(new Event('bg-match-setup-changed'));
}

export function resolveEffectiveMatchLength(formats: number[]): number {
    if (formats.length === 1) return formats[0];
    const pool = formats.length > 0 ? formats : AUTO_MATCH_POOL;
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
        const buf = new Uint32Array(1);
        window.crypto.getRandomValues(buf);
        return pool[buf[0] % pool.length];
    }
    return pool[0];
}

export function readStoredClockPresetsMulti(): MatchClockPreset[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(CLOCK_PRESETS_MULTI_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.filter((c): c is MatchClockPreset =>
                c === 'blitz' || c === 'standard' || c === 'tournament' || c === 'unlimited'
            );
        }
    } catch { /* ignore */ }
    return [];
}

export function storeClockPresetsMulti(presets: MatchClockPreset[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CLOCK_PRESETS_MULTI_KEY, JSON.stringify(presets));
    const primary: MatchClockPreset = presets.length > 0 ? presets[0] : 'standard';
    localStorage.setItem(CLOCK_PRESET_KEY, primary);
    window.dispatchEvent(new Event('bg-match-setup-changed'));
}

export function resolveEffectiveClockPreset(presets: MatchClockPreset[]): MatchClockPreset {
    if (presets.length === 0) return 'standard';
    if (presets.length === 1) return presets[0];
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
        const buf = new Uint32Array(1);
        window.crypto.getRandomValues(buf);
        return presets[buf[0] % presets.length];
    }
    return presets[0];
}

export function formatClockPreferenceSummary(presets: MatchClockPreset[], isEn: boolean): string {
    if (presets.length === 0) {
        return isEn ? 'Auto (Standard Time Control)' : 'Auto (Cadence Standard)';
    }
    const shortMap: Record<MatchClockPreset, { fr: string; en: string }> = {
        blitz: { fr: 'Blitz 3m+8s', en: 'Blitz 3m+8s' },
        standard: { fr: 'Standard 10m+8s', en: 'Standard 10m+8s' },
        tournament: { fr: 'Master 14m+12s', en: 'Master 14m+12s' },
        unlimited: { fr: 'Sans Horloge', en: 'No Clock' },
    };
    const labels = presets.map((p) => (isEn ? shortMap[p].en : shortMap[p].fr)).join(', ');
    return isEn ? `Preference: ${labels}` : `Préférence : ${labels}`;
}

export interface ClockPreferencesModalProps {
    isOpen: boolean;
    selectedClocks: MatchClockPreset[];
    isEn: boolean;
    onToggleClock: (preset: MatchClockPreset) => void;
    onResetAuto: () => void;
    onConfirm: () => void;
}

export function ClockPreferencesModal({
    isOpen, selectedClocks, isEn, onToggleClock, onResetAuto, onConfirm,
}: ClockPreferencesModalProps) {
    if (!isOpen) return null;
    const isAuto = selectedClocks.length === 0;
    const items: Array<{ id: MatchClockPreset; labelFr: string; labelEn: string; icon: React.ReactNode }> = [
        { id: 'blitz', labelFr: 'Blitz (3 min + 8s / coup)', labelEn: 'Blitz (3 min + 8s / move)', icon: <Flame className="w-4 h-4 text-amber-400 shrink-0" /> },
        { id: 'standard', labelFr: 'Standard / Club (10 min + 8s / coup)', labelEn: 'Standard / Club (10 min + 8s / move)', icon: <Clock className="w-4 h-4 text-emerald-400 shrink-0" /> },
        { id: 'tournament', labelFr: 'Tournoi Master (14 min + 12s / coup)', labelEn: 'Master Tournament (14 min + 12s / move)', icon: <Landmark className="w-4 h-4 text-[#D4AF37] shrink-0" /> },
        { id: 'unlimited', labelFr: 'Sans Horloge (À votre rythme)', labelEn: 'No Clock (At your own pace)', icon: <InfinityIcon className="w-4 h-4 text-sky-400 shrink-0" /> },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fade-in" data-testid="clock-preferences-modal">
            <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#0A0E14] p-4 sm:p-5 text-slate-100 shadow-2xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
                        <h3 className="text-sm sm:text-base font-extrabold text-white">{isEn ? 'WBGF Clock & Time Control Preferences' : 'Préférences de Pendule & Cadence WBGF'}</h3>
                    </div>
                    <button type="button" onClick={onConfirm} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2">
                    <button type="button" data-testid="clock-pref-auto" onClick={onResetAuto} className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs sm:text-sm font-bold transition-all ${isAuto ? 'border-white/25 bg-white/[0.08] text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white'}`}>
                        <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#D4AF37] shrink-0" /><span>{isEn ? 'Automatic (Recommended — Standard 10m + 8s)' : 'Automatique (Recommandé — Standard 10m + 8s)'}</span></span>
                        {isAuto && <span className="text-[#D4AF37] font-extrabold text-sm ml-2">✓</span>}
                    </button>
                    {items.map((item) => {
                        const checked = selectedClocks.includes(item.id);
                        return (
                            <button key={item.id} type="button" data-testid={`clock-pref-${item.id}`} onClick={() => onToggleClock(item.id)} className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs sm:text-sm font-semibold transition-all ${checked ? 'border-white/25 bg-white/[0.08] text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white'}`}>
                                <span className="flex items-center gap-2">{item.icon}<span>{isEn ? item.labelEn : item.labelFr}</span></span>
                                {checked && <span className="text-[#D4AF37] font-extrabold text-sm ml-2">✓</span>}
                            </button>
                        );
                    })}
                </div>
                <button type="button" data-testid="confirm-clock-preferences-btn" onClick={onConfirm} className="w-full rounded-xl border border-white/20 bg-white/[0.10] hover:bg-white/[0.15] py-2.5 text-xs sm:text-sm font-bold text-white transition-all">
                    {isEn ? 'Confirm my preferences' : 'Valider mes préférences'}
                </button>
            </div>
        </div>
    );
}

const FORMATS: Array<{ value: MatchFormat; label: string; short: string; icon: string; desc: string }> = [
    { value: 0, label: 'Money Game', short: 'Money', icon: '💰', desc: "Partie d'argent — le videau reste actif en permanence." },
    { value: 3, label: 'Match 3 pts', short: '3', icon: '', desc: 'Match court — premier à 3 points.' },
    { value: 5, label: 'Match 5 pts', short: '5', icon: '', desc: 'Match rapide — premier à 5 points.' },
    { value: 7, label: 'Match 7 pts', short: '7', icon: '🏆', desc: 'Match standard — premier à 7 points.' },
    { value: 9, label: 'Match 9 pts', short: '9', icon: '👑', desc: 'Match long — premier à 9 points.' },
];

export interface MatchFormatSelectorProps { value: MatchFormat; onChange: (format: MatchFormat) => void; disabled?: boolean; }

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
    return (raw === 'auto' || raw === 'beginner' || raw === 'intermediate' || raw === 'expert') ? raw : 'auto';
}

export function storeOpponentTier(tier: OpponentTierChoice): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(OPPONENT_TIER_KEY, tier);
    window.dispatchEvent(new Event('bg-match-setup-changed'));
}

export function getClockConfigForPreset(preset: MatchClockPreset): {
    type: 'bronstein' | 'unlimited'; bankMs: number; delaySeconds: number; labelFr: string; labelEn: string; shortClock: string;
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

export default function MatchFormatSelector({ value, onChange, disabled = false }: MatchFormatSelectorProps) {
    return (
        <div role="radiogroup" aria-label="Format de match" className="flex items-center gap-1 rounded-xl border border-slate-700/60 bg-slate-900/80 p-1 backdrop-blur-sm">
            <span className="hidden sm:inline-block px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Format :</span>
            {FORMATS.map((format) => {
                const isActive = value === format.value;
                return (
                    <button key={format.value} type="button" role="radio" aria-checked={isActive} disabled={disabled} onClick={() => onChange(format.value)} title={format.desc} className={`group relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${isActive ? 'border-indigo-500/80 bg-indigo-950/60 text-indigo-200 shadow-md ring-1 ring-white/10' : 'border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}>
                        <span className="text-xs">{format.icon}</span><span>{format.short}</span>
                    </button>
                );
            })}
        </div>
    );
}
