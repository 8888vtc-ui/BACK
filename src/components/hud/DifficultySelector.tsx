'use client';

import React from 'react';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';

export interface DifficultySelectorProps {
    difficulty: AIDifficulty;
    onChange: (difficulty: AIDifficulty) => void;
    disabled?: boolean;
}

const LEVELS: Array<{
    id: AIDifficulty;
    name: string;
    ply: string;
    badge: string;
    icon: string;
    tooltip: string;
    activeClass: string;
}> = [
        {
            id: 'beginner',
            name: 'Novice',
            ply: '0-ply',
            badge: 'Bruité',
            icon: '🟢',
            tooltip: '0-ply bruité : évaluation statique avec erreurs tactiques occasionnelles.',
            activeClass: 'border-emerald-500/80 bg-emerald-950/60 text-emerald-200 shadow-emerald-500/20',
        },
        {
            id: 'intermediate',
            name: 'Intermédiaire',
            ply: '1-ply',
            badge: 'Déterministe',
            icon: '🟡',
            tooltip: '1-ply déterministe : évaluation à un coup d\'avance, sans bruit.',
            activeClass: 'border-yellow-500/80 bg-yellow-950/60 text-yellow-200 shadow-yellow-500/20',
        },
        {
            id: 'expert',
            name: 'Maître',
            ply: '2-Ply',
            badge: 'Monte-Carlo',
            icon: '🔴',
            tooltip: 'Monte-Carlo 2-Ply : réseau neuronal calibré sur les ouvertures, primes et blitz.',
            activeClass: 'border-rose-500/80 bg-rose-950/60 text-rose-200 shadow-rose-500/20',
        },
        {
            id: 'grandmaster',
            name: 'Viktor Orlov',
            ply: '3-Ply Sélectif',
            badge: 'Monte-Carlo',
            icon: '🏆',
            tooltip: 'Viktor Orlov — L\'Oracle de Monte-Carlo. Moteur Monte-Carlo 3-ply sélectif : la profondeur ultime.',
            activeClass: 'border-amber-500/80 bg-amber-950/60 text-amber-200 shadow-amber-500/20',
        },
    ];

export default function DifficultySelector({
    difficulty,
    onChange,
    disabled = false,
}: DifficultySelectorProps) {
    return (
        <div
            role="radiogroup"
            aria-label="Niveau de difficulté de l’adversaire"
            className="flex items-center gap-1 rounded-xl border border-slate-700/60 bg-slate-900/80 p-1 backdrop-blur-sm"
        >
            <span className="hidden sm:inline-block px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                IA :
            </span>

            {LEVELS.map((level) => {
                const isActive = difficulty === level.id;
                return (
                    <button
                        key={level.id}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        disabled={disabled}
                        onClick={() => onChange(level.id)}
                        title={level.tooltip}
                        className={`group relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${isActive
                            ? `${level.activeClass} shadow-md ring-1 ring-white/10`
                            : 'border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-200'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                    >
                        <span className="text-xs">{level.icon}</span>
                        <span>{level.name}</span>
                        <span
                            className={`rounded px-1.5 py-0.2 text-[11px] font-extrabold uppercase tracking-tighter ${isActive ? 'bg-black/30' : 'bg-slate-800 text-slate-500'
                                }`}
                        >
                            {level.ply}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
