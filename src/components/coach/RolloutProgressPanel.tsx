'use client';

/**
 * Panneau de progression d'un Rollout Profond (SSE temps réel).
 *
 * Rôle :
 *   Affiche l'état `queued` / `running` / `completed` :
 *     - libellé d'état et pourcentage ;
 *     - barre de progression accessible (`role="progressbar"`) ;
 *     - compteurs de parties et ETA ;
 *     - bouton d'annulation.
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
import type { RolloutProgress } from '../../lib/engine/rolloutClient';

export interface RolloutProgressPanelProps {
    /** Statut courant du job. */
    status: 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    /** Progression reçue via SSE. */
    progress: RolloutProgress;
    /** Identifiant ARIA de la barre. */
    progressAriaId: string;
    /** Annulation en cours. */
    isCancelling: boolean;
    /** Annule le rollout. */
    onCancel: () => void;
    /** Traducteur i18n. */
    t: (key: string, vars?: Record<string, string | number>) => string;
    /** Locale active. */
    locale: string;
}

const RolloutProgressPanelComponent: React.FC<RolloutProgressPanelProps> = ({
    status,
    progress,
    progressAriaId,
    isCancelling,
    onCancel,
    t,
    locale,
}) => (
    <div
        data-testid="rollout-progress-container"
        className="mt-4 rounded-lg bg-slate-950/80 p-3 border border-slate-800 shadow-inner"
    >
        <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-semibold text-cyan-300">
                    {status === 'queued'
                        ? t('rollout.queued')
                        : t('rollout.running', { move: progress.currentMove || '...' })}
                </span>
            </div>
            <span className="font-mono font-bold text-white">{progress.progress.toFixed(1)}%</span>
        </div>

        {/* Barre de progression accessible */}
        <div
            id={progressAriaId}
            role="progressbar"
            aria-valuenow={progress.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('rollout.progressBarLabel')}
            className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800"
        >
            <div
                data-testid="rollout-progress-bar"
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 transition-all duration-150 ease-out shadow-sm shadow-cyan-500/50"
                style={{ width: `${Math.max(2, Math.min(100, progress.progress))}%` }}
            />
        </div>

        {/* Statistiques de progression */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>
                {t('rollout.gamesLabel')} :{' '}
                <strong className="text-slate-200 font-mono">{progress.trialsDone}</strong> /{' '}
                {progress.totalTrials}
            </span>
            <span>
                {t('rollout.etaLabel')} :{' '}
                <strong className="text-slate-200 font-mono">
                    {progress.etaSeconds > 0
                        ? `~${progress.etaSeconds.toFixed(1)}s`
                        : t('rollout.finalCalculating')}
                </strong>
            </span>
        </div>

        {/* Bouton d'annulation */}
        <div className="mt-3 flex justify-end">
            <button
                type="button"
                onClick={onCancel}
                disabled={isCancelling}
                data-testid="rollout-cancel-btn"
                className="inline-flex items-center gap-1.5 rounded-md bg-red-950/70 border border-red-800/80 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-900 transition disabled:opacity-50"
            >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {isCancelling
                    ? locale === 'en'
                        ? 'Cancelling…'
                        : 'Annulation…'
                    : t('rollout.cancelBtn')}
            </button>
        </div>
    </div>
);

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const RolloutProgressPanel = React.memo(RolloutProgressPanelComponent);
export default RolloutProgressPanel;
