'use client';

import React from 'react';
import { useSyncQueue } from '../../hooks/useSyncQueue';
import { toast } from '../toast/ToastContext';

export default function SyncIndicator() {
    const { status, pendingCount, syncNow } = useSyncQueue();

    // Mode local-only lorsque Supabase n'est pas configuré
    if (status === 'local-only') {
        return (
            <button
                type="button"
                onClick={() =>
                    toast.info(
                        'Mode local actif',
                        'Supabase n’est pas configuré. Vos parties et coups sont automatiquement sauvegardés localement dans votre navigateur (IndexedDB).',
                    )
                }
                data-testid="sync-status-indicator"
                className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 transition shadow-sm"
                title="Sync : Mode local (Supabase non configuré · Données stockées localement)"
            >
                <span className="text-slate-400">💾</span>
                <span className="font-semibold text-slate-300">Mode local</span>
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1.5">
            <button
                type="button"
                onClick={() => syncNow(false)}
                data-testid="sync-status-indicator"
                className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 transition shadow-sm"
                title={
                    pendingCount > 0
                        ? `${pendingCount} mutation(s) en attente dans la file IndexedDB. Cliquer pour synchroniser.`
                        : 'Données locales synchronisées avec Supabase.'
                }
            >
                {status === 'syncing' ? (
                    <>
                        <svg className="h-3.5 w-3.5 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        <span className="text-blue-300 font-semibold">Sync...</span>
                    </>
                ) : pendingCount > 0 ? (
                    <>
                        <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-amber-300 font-semibold">{pendingCount} en attente</span>
                    </>
                ) : (
                    <>
                        <span className="text-emerald-400">☁️</span>
                        <span className="text-slate-400">Sync</span>
                    </>
                )}
            </button>

            {/* Bouton 'Réessayer' lors d'erreurs ou d'éléments en attente */}
            {(status === 'error' || pendingCount > 0) && (
                <button
                    type="button"
                    onClick={() => syncNow(true)}
                    data-testid="sync-retry-btn"
                    title="Forcer immédiatement le vidage de la file de synchronisation"
                    className="flex items-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-500/30 active:scale-95 transition shadow-sm"
                >
                    <span>🔄</span>
                    <span>Réessayer</span>
                </button>
            )}
        </div>
    );
}
