'use client';

/**
 * Sélecteur de couleur du joueur (Blanc / Noir).
 *
 * Rôle :
 *   Permet au joueur de choisir s'il joue les Blancs (X) ou les Noirs (O).
 *   Le choix est persisté dans `localStorage` et lu par la page de jeu.
 */

import React from 'react';
import type { Player } from '../../engine/backgammonEngine';

export const PLAYER_COLOR_KEY = 'backgammon_player_color';

const COLORS: Array<{
    value: Player;
    label: string;
    icon: string;
    desc: string;
}> = [
        { value: 'X', label: 'Blanc', icon: '⚪', desc: 'Jouer les Blancs (X) — vous commencez.' },
        { value: 'O', label: 'Noir', icon: '⚫', desc: 'Jouer les Noirs (O) — l\'IA commence.' },
    ];

export interface ColorSelectorProps {
    value: Player;
    onChange: (color: Player) => void;
    disabled?: boolean;
}

export function readStoredPlayerColor(): Player {
    if (typeof window === 'undefined') return 'X';
    const raw = localStorage.getItem(PLAYER_COLOR_KEY);
    return raw === 'O' ? 'O' : 'X';
}

export function storePlayerColor(color: Player): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PLAYER_COLOR_KEY, color);
}

export default function ColorSelector({
    value,
    onChange,
    disabled = false,
}: ColorSelectorProps) {
    return (
        <div
            role="radiogroup"
            aria-label="Couleur du joueur"
            className="flex items-center gap-1 rounded-xl border border-slate-700/60 bg-slate-900/80 p-1 backdrop-blur-sm"
        >
            <span className="hidden sm:inline-block px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Couleur :
            </span>

            {COLORS.map((color) => {
                const isActive = value === color.value;
                return (
                    <button
                        key={color.value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        disabled={disabled}
                        onClick={() => onChange(color.value)}
                        title={color.desc}
                        className={`group relative flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition-all duration-200 ${isActive
                            ? 'border-sky-500/80 bg-sky-950/60 text-sky-200 shadow-md ring-1 ring-white/10'
                            : 'border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-200'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                    >
                        <span className="text-xs">{color.icon}</span>
                        <span>{color.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
