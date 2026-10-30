'use client';

/**
 * @file src/components/lobby/LobbyInteractiveBoardPreview.tsx
 * @description Grand Plateau de Tournoi Cercle Monte-Carlo (Haute-Horlogerie & Tactile).
 * Affiche la malle d'ébénisterie en position de départ réglementaire (15 dames ivoire / 15 dames ébène),
 * le videau en laiton [64], les dés aux arêtes biseautées et les 3 feutrines d'orfèvrerie.
 *
 * Contraintes : < 240 lignes, 0 `any`, zéro micro-texte < 11px.
 */

import React, { useState } from 'react';
import type { Player } from '../../engine/backgammonEngine';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import type { LobbyClockPreset } from './LobbyOptionsPanel';
import type { ThemeName } from '../board/boardThemes';

export interface LobbyInteractiveBoardPreviewProps {
    readonly matchLength: number;
    readonly difficulty: AIDifficulty;
    readonly coachEnabled: boolean;
    readonly playerColor: Player;
    readonly onTogglePlayerColor: () => void;
    readonly clockPreset?: LobbyClockPreset;
}

interface PointData {
    readonly pointNumber: number;
    readonly count: number;
    readonly isGroupA: boolean;
}

interface BoardPaletteConfig {
    readonly id: ThemeName;
    readonly name: string;
    readonly subtitle: string;
    readonly swatch: string;
    readonly feltBg: string;
    readonly triLight: string;
    readonly triDark: string;
    readonly checkerDark: string;
    readonly checkerDarkRing: string;
    readonly cubeBg: string;
    readonly cubeText: string;
}

const MONTE_CARLO_PALETTES: ReadonlyArray<BoardPaletteConfig> = [
    {
        id: 'tournament',
        name: 'Malachite & Cuir Havane',
        subtitle: 'Tapis Officiel des Championnats de Monte-Carlo',
        swatch: 'bg-emerald-600',
        feltBg: '#0b3d1f',
        triLight: '#d4af37',
        triDark: '#5c1d06',
        checkerDark: '#121316',
        checkerDarkRing: '#f3c65f',
        cubeBg: '#b45309',
        cubeText: '#fef3c7',
    },
    {
        id: 'snowie_classic',
        name: 'Saphir Riviera & Ivoire',
        subtitle: 'Édition Yacht Club Méditerranée',
        swatch: 'bg-sky-600',
        feltBg: '#1e2954',
        triLight: '#93c5fd',
        triDark: '#1e3a8a',
        checkerDark: '#0f172a',
        checkerDarkRing: '#38bdf8',
        cubeBg: '#1d4ed8',
        cubeText: '#ffffff',
    },
    {
        id: 'galaxy_void',
        name: 'Nocturne Obsidienne & Or 24k',
        subtitle: 'Luxe Minimaliste Contemporain',
        swatch: 'bg-amber-500',
        feltBg: '#0f1422',
        triLight: '#e2b342',
        triDark: '#292524',
        checkerDark: '#18181b',
        checkerDarkRing: '#fbbf24',
        cubeBg: '#78350f',
        cubeText: '#fef3c7',
    },
    {
        id: 'midnight',
        name: 'Ardoise Alpine & Glacier',
        subtitle: 'Précision Froide et Contraste Épuré',
        swatch: 'bg-slate-500',
        feltBg: '#172033',
        triLight: '#cbd5e1',
        triDark: '#0f172a',
        checkerDark: '#0284c7',
        checkerDarkRing: '#bae6fd',
        cubeBg: '#0369a1',
        cubeText: '#ffffff',
    },
];

const TOP_POINTS: ReadonlyArray<PointData> = [
    { pointNumber: 13, count: 5, isGroupA: true },
    { pointNumber: 14, count: 0, isGroupA: true },
    { pointNumber: 15, count: 0, isGroupA: true },
    { pointNumber: 16, count: 0, isGroupA: true },
    { pointNumber: 17, count: 3, isGroupA: false },
    { pointNumber: 18, count: 0, isGroupA: true },
    { pointNumber: 19, count: 5, isGroupA: false },
    { pointNumber: 20, count: 0, isGroupA: true },
    { pointNumber: 21, count: 0, isGroupA: true },
    { pointNumber: 22, count: 0, isGroupA: true },
    { pointNumber: 23, count: 0, isGroupA: true },
    { pointNumber: 24, count: 2, isGroupA: true },
];

const BOTTOM_POINTS: ReadonlyArray<PointData> = [
    { pointNumber: 12, count: 5, isGroupA: false },
    { pointNumber: 11, count: 0, isGroupA: true },
    { pointNumber: 10, count: 0, isGroupA: true },
    { pointNumber: 9, count: 0, isGroupA: true },
    { pointNumber: 8, count: 3, isGroupA: true },
    { pointNumber: 7, count: 0, isGroupA: true },
    { pointNumber: 6, count: 5, isGroupA: true },
    { pointNumber: 5, count: 0, isGroupA: true },
    { pointNumber: 4, count: 0, isGroupA: true },
    { pointNumber: 3, count: 0, isGroupA: true },
    { pointNumber: 2, count: 0, isGroupA: true },
    { pointNumber: 1, count: 2, isGroupA: false },
];

const BOT_TITLES: Record<AIDifficulty, { name: string; elo: number; style: string }> = {
    beginner: { name: 'Arthur', elo: 1420, style: 'Initié · Blitz spontané' },
    intermediate: { name: 'Elena', elo: 1680, style: 'Stratège · Holding Game' },
    expert: { name: 'Marcus', elo: 1950, style: 'Maître · Videau agressif' },
    grandmaster: { name: 'Spinoza', elo: 2150, style: 'Grand-Maître · Open Sage 3-Ply' },
};

const CLOCK_TITLES: Record<LobbyClockPreset, { title: string; detail: string }> = {
    unlimited: { title: 'Partie Libre', detail: 'Sans pendule' },
    normal: { title: 'Tournoi WBF (Normal)', detail: '2 min/pt + 12s Bronstein' },
    speed: { title: 'Speedgammon', detail: '1 min/pt + 8s Bronstein' },
    blitz: { title: 'Blitz Cup', detail: '30s/pt + 5s Bronstein' },
};

export const LobbyInteractiveBoardPreview: React.FC<LobbyInteractiveBoardPreviewProps> = React.memo(({
    matchLength,
    difficulty,
    coachEnabled,
    playerColor,
    onTogglePlayerColor,
    clockPreset = 'normal',
}) => {
    const [selectedPalette, setSelectedPalette] = useState<ThemeName>('tournament');
    const palette = MONTE_CARLO_PALETTES.find((p) => p.id === selectedPalette) ?? MONTE_CARLO_PALETTES[0];
    const isMoney = matchLength === 0;
    const bot = BOT_TITLES[difficulty];
    const clock = CLOCK_TITLES[clockPreset];

    const renderCheckers = (point: PointData, xc: number, isTop: boolean) => {
        if (point.count === 0) return null;
        const isWhite = (playerColor === 'X' && point.isGroupA) || (playerColor === 'O' && !point.isGroupA);
        const fill = isWhite ? '#fdfcf7' : palette.checkerDark;
        const stroke = isWhite ? '#d4af37' : palette.checkerDarkRing;

        return Array.from({ length: point.count }).map((_, c) => {
            const cy = isTop ? 12 + 13 + c * 23 : 368 - 13 - c * 23;
            return (
                <g key={`chk-${point.pointNumber}-${c}`}>
                    <circle cx={xc} cy={cy} r="12" fill={fill} stroke={stroke} strokeWidth="1.6" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.5))" />
                    <circle cx={xc} cy={cy} r="6.5" fill="none" stroke={stroke} strokeWidth="0.8" opacity="0.45" />
                </g>
            );
        });
    };

    return (
        <div data-testid="lobby-board-preview" className="flex flex-col gap-3 w-full">
            {/* 1. Sélecteur de Feutrine & Cuir d'Ébénisterie */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0e1322] px-3.5 py-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold text-xs">◆</span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">
                        Habillage Monte-Carlo : <span className="text-[#f3c65f]">{palette.name}</span>
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    {MONTE_CARLO_PALETTES.map((p) => {
                        const active = p.id === palette.id;
                        return (
                            <button
                                key={p.id}
                                type="button"
                                data-testid={`preview-theme-${p.id}`}
                                onClick={() => setSelectedPalette(p.id)}
                                title={p.subtitle}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                                    active
                                        ? 'border-[#f3c65f] bg-[#f3c65f]/20 text-[#fdf8eb] shadow-sm'
                                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white'
                                }`}
                            >
                                <span className={`h-2.5 w-2.5 rounded-full ${p.swatch} ring-1 ring-white/30`} />
                                <span>{p.name.split(' ')[0]}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Plateau Grand Format SVG Haute Fidélité */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#3d271d] bg-[#080b14] p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
                <svg viewBox="0 0 600 380" className="w-full h-auto select-none" role="img" aria-label="Aperçu du plateau de jeu">
                    {/* Cadre en Noyer & Chanfrein Or */}
                    <rect x="0" y="0" width="600" height="380" rx="14" fill="#140d09" stroke="#b45309" strokeWidth="1.5" />
                    <rect x="2" y="2" width="596" height="376" rx="12" fill="none" stroke="rgba(243,198,95,0.3)" strokeWidth="1" />

                    {/* Jan Intérieur & Extérieur */}
                    <rect x="14" y="10" width="264" height="360" rx="6" fill={palette.feltBg} />
                    <rect x="322" y="10" width="264" height="360" rx="6" fill={palette.feltBg} />

                    {/* Barre Centrale en Palissandre & Laiton */}
                    <rect x="280" y="10" width="40" height="360" rx="2" fill="#0d0906" stroke="#3d271d" strokeWidth="1" />

                    {/* Flèches Hautes */}
                    {TOP_POINTS.map((pt, i) => {
                        const x0 = i < 6 ? 18 + i * 43.5 : 326 + (i - 6) * 43.5;
                        const xc = x0 + 21.75;
                        const x1 = x0 + 43.5;
                        const triFill = i % 2 === 0 ? palette.triLight : palette.triDark;
                        return (
                            <g key={`top-${pt.pointNumber}`}>
                                <polygon points={`${x0},10 ${x1},10 ${xc},158`} fill={triFill} opacity="0.95" />
                                {renderCheckers(pt, xc, true)}
                            </g>
                        );
                    })}

                    {/* Flèches Basses */}
                    {BOTTOM_POINTS.map((pt, i) => {
                        const x0 = i < 6 ? 18 + i * 43.5 : 326 + (i - 6) * 43.5;
                        const xc = x0 + 21.75;
                        const x1 = x0 + 43.5;
                        const triFill = i % 2 === 0 ? palette.triDark : palette.triLight;
                        return (
                            <g key={`bot-${pt.pointNumber}`}>
                                <polygon points={`${x0},370 ${x1},370 ${xc},222`} fill={triFill} opacity="0.95" />
                                {renderCheckers(pt, xc, false)}
                            </g>
                        );
                    })}

                    {/* Pips Opposant (167) / Videau [64] / Pips Joueur (167) */}
                    <text x="300" y="102" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold" fontFamily="monospace">167</text>
                    <rect x="284" y="174" width="32" height="32" rx="6" fill={palette.cubeBg} stroke="#f3c65f" strokeWidth="1.5" />
                    <text x="300" y="195" textAnchor="middle" fill={palette.cubeText} fontSize="13" fontWeight="900" fontFamily="sans-serif">64</text>
                    <text x="300" y="288" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="monospace">167</text>

                    {/* Dés d'Ivoire à gauche */}
                    <rect x="114" y="176" width="28" height="28" rx="6" fill="#fdfcf7" stroke="#d4af37" strokeWidth="1.2" />
                    <circle cx="121" cy="183" r="2.2" fill="#0f172a" /><circle cx="135" cy="183" r="2.2" fill="#0f172a" />
                    <circle cx="121" cy="197" r="2.2" fill="#0f172a" /><circle cx="135" cy="197" r="2.2" fill="#0f172a" />
                    <rect x="148" y="176" width="28" height="28" rx="6" fill="#fdfcf7" stroke="#d4af37" strokeWidth="1.2" />
                    <circle cx="155" cy="183" r="2.2" fill="#0f172a" /><circle cx="169" cy="197" r="2.2" fill="#0f172a" />

                    {/* Dés d'Ébène à droite */}
                    <rect x="424" y="176" width="28" height="28" rx="6" fill="#14171f" stroke="#f3c65f" strokeWidth="1.2" />
                    <circle cx="431" cy="183" r="2.2" fill="#fdfcf7" /><circle cx="445" cy="183" r="2.2" fill="#fdfcf7" />
                    <circle cx="431" cy="197" r="2.2" fill="#fdfcf7" /><circle cx="445" cy="197" r="2.2" fill="#fdfcf7" />
                    <rect x="458" y="176" width="28" height="28" rx="6" fill="#14171f" stroke="#f3c65f" strokeWidth="1.2" />
                    <circle cx="465" cy="183" r="2.2" fill="#fdfcf7" /><circle cx="479" cy="197" r="2.2" fill="#fdfcf7" />
                </svg>
            </div>

            {/* 3. Bandeau Récapitulatif Précis de la Table Configurée */}
            <div data-testid="lobby-preview-recap" className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-white/10 bg-[#0e1322] px-3.5 py-2.5 shadow-lg">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span data-testid="lobby-preview-match-format" className="rounded-lg border border-[#f3c65f]/50 bg-[#f3c65f]/15 px-2.5 py-1 font-black text-amber-200">
                        {isMoney ? 'Partie Simple (Money)' : `Match en ${matchLength} pts`}
                    </span>
                    <span data-testid="lobby-preview-clock" className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-slate-200">
                        ⏱️ {clock.title} ({clock.detail})
                    </span>
                    <span data-testid="lobby-preview-opponent" className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-semibold text-slate-200">
                        ⚔️ {bot.name} ({bot.elo} Elo)
                    </span>
                    <span data-testid="lobby-preview-coach" className={`rounded-lg border px-2.5 py-1 font-semibold ${coachEnabled ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                        {coachEnabled ? '🎓 Coach IA · 3s' : '🏆 Sans aide'}
                    </span>
                </div>

                <button
                    type="button"
                    data-testid="lobby-preview-toggle-color"
                    onClick={onTogglePlayerColor}
                    className="flex items-center gap-1.5 rounded-lg border border-[#f3c65f]/40 bg-[#f3c65f]/15 px-3 py-1 text-[11px] font-extrabold text-amber-200 transition hover:bg-[#f3c65f]/25 active:scale-95"
                    title="Inverser les Dames (Ivoire vs Ébène)"
                >
                    <span>🔄 Inverser couleur</span>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full border border-amber-300 shadow-sm ${playerColor === 'X' ? 'bg-[#fdfcf7]' : 'bg-[#18181b]'}`} />
                    <span>({playerColor === 'X' ? 'Blancs' : 'Noirs'})</span>
                </button>
            </div>
        </div>
    );
});

LobbyInteractiveBoardPreview.displayName = 'LobbyInteractiveBoardPreview';
export default LobbyInteractiveBoardPreview;
