'use client';

/**
 * @file src/components/lobby/LobbyInteractiveBoardPreview.tsx
 * @description Grand Plateau de Tournoi Cercle Monte-Carlo (Haute-Horlogerie & Tactile).
 * Affiche la malle d'ébénisterie en position de départ réglementaire (15 dames ivoire / 15 dames ébène),
 * le videau en laiton [1], les dés aux arêtes biseautées et les feutrines d'orfèvrerie.
 *
 * Contraintes : <= 300 lignes, 0 any, zéro micro-texte < 11px.
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
    beginner: { name: '🎓 Le Professeur', elo: 1200, style: 'Initiation Guidée (PR 18–25)' },
    intermediate: { name: '🎲 Joueur de Club', elo: 1550, style: 'Niveau Intermédiaire (PR 8–12)' },
    expert: { name: '♟️ Compétiteur', elo: 1850, style: 'Niveau Tournoi (PR 4.5–7)' },
    grandmaster: { name: '👑 Grand-Maître 3-Ply', elo: 2200, style: 'Open Sage Pur (PR < 2.5)' },
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
        const maxVisual = Math.min(point.count, 5);
        const r = 13.5;
        const dia = r * 2 - 2;

        return Array.from({ length: maxVisual }).map((_, idx) => {
            const yc = isTop ? 18 + r + idx * dia : 362 - r - idx * dia;
            return (
                <g key={`${point.pointNumber}-${idx}`}>
                    <circle cx={xc} cy={yc} r={r} fill={fill} stroke={stroke} strokeWidth="1.8" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.45))" />
                    <circle cx={xc} cy={yc} r={r - 4} fill="none" stroke={stroke} strokeWidth="0.8" opacity="0.6" />
                    {idx === 4 && point.count > 5 && (
                        <text x={xc} y={yc + 4} textAnchor="middle" fill={isWhite ? '#0f172a' : '#f8fafc'} fontSize="11" fontWeight="900" fontFamily="sans-serif">
                            {point.count}
                        </text>
                    )}
                </g>
            );
        });
    };

    return (
        <div data-testid="lobby-interactive-board-preview" className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#080d19]/90 p-4 shadow-xl">
            {/* 1. Sélecteur de Palettes Cercle Monte-Carlo */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-amber-300">◆ Habillage Monte-Carlo :</span>
                    <span className="text-xs font-extrabold text-white">{palette.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {MONTE_CARLO_PALETTES.map((pal) => (
                        <button
                            key={pal.id}
                            type="button"
                            data-testid={`lobby-theme-btn-${pal.id}`}
                            aria-label={pal.name}
                            onClick={() => setSelectedPalette(pal.id)}
                            className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-bold transition ${selectedPalette === pal.id ? 'border-[#f3c65f] bg-[#f3c65f]/20 text-amber-200' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}
                        >
                            <span className={`h-2.5 w-2.5 rounded-full ${pal.swatch}`} />
                            <span className="hidden sm:inline">{pal.name.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Plateau SVG Haute Fidélité */}
            <div data-testid="lobby-board-preview" className="relative aspect-[600/380] w-full overflow-hidden rounded-xl border-2 border-[#3d2716] shadow-2xl bg-[#1b130e]">
                <svg viewBox="0 0 600 380" className="h-full w-full select-none" role="img" aria-label="Plateau de backgammon">
                    <rect x="0" y="0" width="600" height="380" fill="#24170e" />
                    <rect x="10" y="6" width="580" height="368" rx="8" fill="#120c07" stroke="#4a321d" strokeWidth="2" />
                    <rect x="14" y="10" width="264" height="360" rx="6" fill={palette.feltBg} />
                    <rect x="322" y="10" width="264" height="360" rx="6" fill={palette.feltBg} />
                    <rect x="278" y="10" width="44" height="360" fill="#1d130a" stroke="#3d2716" strokeWidth="1.5" />

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

                    {/* Pips Opposant (167) / Videau [1] / Pips Joueur (167) */}
                    <text x="300" y="102" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold" fontFamily="monospace">167</text>
                    <rect x="284" y="174" width="32" height="32" rx="6" fill={palette.cubeBg} stroke="#f3c65f" strokeWidth="1.5" />
                    <text x="300" y="195" textAnchor="middle" fill={palette.cubeText} fontSize="13" fontWeight="900" fontFamily="sans-serif">1</text>
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
