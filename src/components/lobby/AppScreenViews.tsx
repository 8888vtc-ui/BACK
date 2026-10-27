'use client';

/**
 * Vues exclusives LOBBY et SUMMARY de l'application (LOI 5 : ≤ 300 lignes, zéro any).
 */

import React from 'react';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import type { LobbyClockPreset } from './LobbyOptionsPanel';
import LobbyScreen, { type LobbySelection, type LobbyModuleId } from './LobbyScreen';

export type { LobbyModuleId };

export interface LobbyViewProps {
    onStart: (selection: LobbySelection) => void;
    onOpenModule: (moduleId: LobbyModuleId) => void;
    initialMatchLength: number;
    initialCoachEnabled: boolean;
    initialDifficulty?: AIDifficulty;
    initialClockPreset?: LobbyClockPreset;
}

/** Vue 1 — LOBBY. */
const LobbyViewComponent: React.FC<LobbyViewProps> = ({
    onStart,
    onOpenModule,
    initialMatchLength,
    initialCoachEnabled,
    initialDifficulty,
    initialClockPreset,
}) => (
    <LobbyScreen
        onStart={onStart}
        onOpenModule={onOpenModule}
        initialMatchLength={initialMatchLength}
        initialCoachEnabled={initialCoachEnabled}
        initialDifficulty={initialDifficulty}
        initialClockPreset={initialClockPreset}
    />
);

export const LobbyView = React.memo(LobbyViewComponent);

export interface SummaryViewProps {
    scoreX: number;
    scoreO: number;
    ambianceClass: string;
    onReviewBoard: () => void;
    onBackToLobby: () => void;
}

/** Vue 3 — SUMMARY. */
const SummaryViewComponent: React.FC<SummaryViewProps> = ({
    scoreX,
    scoreO,
    ambianceClass,
    onReviewBoard,
    onBackToLobby,
}) => (
    <main
        data-testid="app-summary-view"
        className={`h-dvh max-h-dvh w-full flex flex-col items-center justify-center gap-4 p-6 ${ambianceClass}`}
    >
        <h1 className="font-serif text-2xl font-black text-[#fdf8eb]">Match terminé</h1>
        <p className="text-sm text-slate-300">
            Score final — X : {scoreX} · O : {scoreO}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
                type="button"
                onClick={onReviewBoard}
                className="rounded-xl border border-white/10 bg-[#0d121d]/85 px-4 py-2 text-xs font-bold text-slate-200 transition hover:border-white/25 hover:bg-[#131928]"
            >
                Revoir le plateau
            </button>
            <button
                type="button"
                onClick={onBackToLobby}
                className="rounded-xl border border-[#f3c65f] bg-gradient-to-b from-[#fff5cf] via-[#f0c75e] to-[#b87e14] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1c1004] shadow-md transition hover:brightness-105"
            >
                Retour au lobby
            </button>
        </div>
    </main>
);

export const SummaryView = React.memo(SummaryViewComponent);

export default LobbyView;
