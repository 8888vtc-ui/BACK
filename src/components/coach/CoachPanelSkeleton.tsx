'use client';

import React from 'react';
import { useI18n } from '../../lib/i18n';

/**
 * Skeleton / État de chargement pour l'analyse du Coach.
 * Affiche des placeholders animés lors de l'évaluation du coup par le moteur d'équité.
 */
export default function CoachPanelSkeleton({ message }: { message?: string }) {
    const { t } = useI18n();
    const effectiveMessage = message ?? t('coach.explaining');

    return (
        <aside
            role="status"
            aria-live="polite"
            aria-label={effectiveMessage}
            className="w-full max-w-5xl animate-pulse rounded-lg border-2 border-blue-500/30 bg-slate-800/90 p-4 shadow-xl backdrop-blur-sm"
        >
            {/* Header avec radar / spinner discret */}
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
                    </span>
                    <h2 className="text-lg font-bold text-slate-200">{t('coach.title')}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span className="text-xs font-medium text-blue-300">{effectiveMessage}</span>
                </div>
            </div>

            {/* Verdict & équité placeholder */}
            <div className="mt-3 flex items-center gap-3">
                <div className="h-5 w-24 rounded bg-slate-700/70" />
                <div className="h-4 w-40 rounded bg-slate-700/50" />
            </div>

            {/* Coup joué vs coup optimal */}
            <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="rounded-md border border-slate-700/40 bg-slate-900/40 p-3">
                    <div className="h-3 w-20 rounded bg-slate-700/60" />
                    <div className="mt-2 h-5 w-28 rounded bg-red-950/40 ring-1 ring-red-500/20" />
                </div>
                <div className="rounded-md border border-slate-700/40 bg-slate-900/40 p-3">
                    <div className="h-3 w-24 rounded bg-slate-700/60" />
                    <div className="mt-2 h-5 w-28 rounded bg-emerald-950/40 ring-1 ring-emerald-500/20" />
                </div>
            </div>

            {/* Bouton explication placeholder */}
            <div className="mt-4 flex items-center gap-3">
                <div className="h-9 w-44 rounded-md bg-slate-700/70" />
                <div className="h-3 w-32 rounded bg-slate-700/40" />
            </div>
        </aside>
    );
}
