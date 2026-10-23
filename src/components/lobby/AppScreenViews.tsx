'use client';

/**
 * Vues exclusives LOBBY et SUMMARY de l'application (LOI 5 : ≤ 300 lignes, zéro any).
 */

import React from 'react';
import LobbyScreen, { type LobbySelection, type LobbyModuleId } from './LobbyScreen';

export type { LobbyModuleId };

export interface LobbyViewProps {
    onStart: (selection: LobbySelection) => void;
    onOpenModule: (moduleId: LobbyModuleId) => void;
    initialMatchLength: number;
    initialCoachEnabled: boolean;
}

/** Vue 1 — LOBBY. */
const LobbyViewComponent: React.FC<LobbyViewProps> = ({
    onStart,
    onOpenModule,
    initialMatchLength,
    initialCoachEnabled,
}) => (
    <LobbyScreen
        onStart={onStart}
        onOpenModule={onOpenModule}
        initialMatchLength={initialMatchLength}
        initialCoachEnabled={initialCoachEnabled}
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
        <h1 className="text-2xl font-black text-amber-200">Match terminé</h1>
        <p className="text-sm text-slate-300">
            Score final — X : {scoreX} · O : {scoreO}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
            <button
                type="button"
                onClick={onReviewBoard}
                className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
            >
                Revoir le plateau
            </button>
            <button
                type="button"
                onClick={onBackToLobby}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:from-amber-400 hover:to-amber-500"
            >
                Retour au lobby
            </button>
        </div>
    </main>
);

export const SummaryView = React.memo(SummaryViewComponent);

export default LobbyView;
