'use client';

/**
 * En-tête du Rollout Profond — titre, badge et métriques du pool de workers.
 *
 * Rôle :
 *   Affiche le titre du module, le badge de précision et l'état du pool
 *   (workers libres / occupés) avec un indicateur coloré.
 *
 * Composant 100 % muet (LOI 5).
 *
 * Dépendances :
 *   `rolloutClient` (types uniquement).
 *
 * Retrait :
 *   Supprimer ce fichier et réintégrer le bloc dans `DeepRolloutSection.tsx`.
 */

import React from 'react';
import type { PoolStats } from '../../lib/engine/rolloutClient';

export interface RolloutHeaderProps {
    /** Statistiques du pool de workers. */
    poolStats: PoolStats | null;
    /** Statut courant du job. */
    status: 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    /** Traducteur i18n. */
    t: (key: string, vars?: Record<string, any>) => string;
}

const RolloutHeaderComponent: React.FC<RolloutHeaderProps> = ({ poolStats, status, t }) => {
    const idleWorkers = poolStats?.idleWorkers ?? 4;
    const poolSize = poolStats?.poolSize ?? 4;

    return (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 text-sm font-bold shadow-inner">
                    🔬
                </span>
                <div>
                    <h3 className="text-sm font-bold tracking-wide text-white flex items-center gap-2">
                        {t('rollout.title')}
                        <span className="rounded bg-indigo-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-700/50">
                            {t('rollout.badge')}
                        </span>
                    </h3>
                    <p className="text-xs text-slate-400">{t('rollout.subtitle')}</p>
                </div>
            </div>

            {/* Métriques du pool de workers */}
            <div
                data-testid="worker-pool-stats"
                className="flex items-center gap-1.5 rounded-full bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-slate-700"
                title={`Workers: ${idleWorkers} libres / ${poolSize} totaux`}
            >
                <span
                    className={`h-2 w-2 rounded-full ${status === 'running'
                        ? 'bg-amber-400 animate-pulse'
                        : idleWorkers > 0
                            ? 'bg-emerald-400'
                            : 'bg-amber-400'
                        }`}
                    aria-hidden="true"
                />
                <span>
                    {poolStats
                        ? t('rollout.poolStats', { idle: poolStats.idleWorkers, total: poolStats.poolSize })
                        : t('rollout.workersReady', { count: 4 })}
                </span>
                {poolStats && poolStats.busyWorkers > 0 && (
                    <span className="text-amber-400 font-semibold">
                        {t('rollout.workersActive', { count: poolStats.busyWorkers })}
                    </span>
                )}
            </div>
        </header>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const RolloutHeader = React.memo(RolloutHeaderComponent);
export default RolloutHeader;
