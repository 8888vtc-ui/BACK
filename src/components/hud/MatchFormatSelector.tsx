'use client';

/**
 * Sélecteur de format de match (Money Game, Match 3/5/7/9 points).
 *
 * Rôle :
 *   Permet au joueur de choisir le format de la partie avant de lancer :
 *   - Money Game (0 point) : partie d'argent, le videau est toujours actif.
 *   - Match en N points (3, 5, 7, 9) : premier à N points, règle de Crawford.
 *
 * Le choix est persisté dans `localStorage` et lu par la page de jeu.
 */

import React from 'react';

export type MatchFormat = 0 | 3 | 5 | 7 | 9;

export const MATCH_FORMAT_KEY = 'backgammon_match_format';

const FORMATS: Array<{
    value: MatchFormat;
    label: string;
    short: string;
    icon: string;
    desc: string;
}> = [
        { value: 0, label: 'Money Game', short: 'Money', icon: '💰', desc: "Partie d'argent — le videau reste actif en permanence." },
        { value: 3, label: 'Match 3 pts', short: '3', icon: '⚡', desc: 'Match court — premier à 3 points.' },
        { value: 5, label: 'Match 5 pts', short: '5', icon: '🎯', desc: 'Match rapide — premier à 5 points.' },
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
    return (parsed === 0 || parsed === 3 || parsed === 5 || parsed === 7 || parsed === 9) ? (parsed as MatchFormat) : 7;
}

export function storeMatchFormat(format: MatchFormat): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MATCH_FORMAT_KEY, String(format));
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
