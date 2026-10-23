'use client';

import React, { useState, useEffect, useRef, useId, useMemo } from 'react';
import { useI18n } from '../../lib/i18n';
import {
    submitRollout,
    subscribeRolloutProgress,
    cancelRollout,
    getPoolStats,
    RolloutProgress,
    RolloutResult,
    PoolStats,
} from '../../lib/engine/rolloutClient';
import RolloutResultsTable from './RolloutResultsTable';
import RolloutProgressPanel from './RolloutProgressPanel';
import RolloutHeader from './RolloutHeader';

export interface DeepRolloutSectionProps {
    xgid?: string | null;
    playedMove?: string | null;
    optimalMove?: string | null;
    candidateMoves?: string[];
    defaultTrials?: number;
    apiBase?: string;
    onRolloutCompleted?: (result: RolloutResult) => void;
    className?: string;
}

export const TRIAL_OPTIONS = [
    { value: 324, label: '324 parties', speed: 'Rapide (~1s)' },
    { value: 1296, label: '1296 parties', speed: 'Standard GNUBG (~4s)' },
    { value: 2592, label: '2592 parties', speed: 'Haute précision (~8s)' },
];

export default function DeepRolloutSection({
    xgid,
    playedMove,
    optimalMove,
    candidateMoves: customCandidateMoves,
    defaultTrials = 1296,
    apiBase = '',
    onRolloutCompleted,
    className = '',
}: DeepRolloutSectionProps) {
    const { t, locale } = useI18n();
    const [trials, setTrials] = useState<number>(defaultTrials);

    const trialOptions = useMemo(() => [
        { value: 324, label: t('rollout.trials324'), speed: t('rollout.speedFast') },
        { value: 1296, label: t('rollout.trials1296'), speed: t('rollout.speedStandard') },
        { value: 2592, label: t('rollout.trials2592'), speed: t('rollout.speedHigh') },
    ], [t]);
    const [status, setStatus] = useState<'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'>('idle');
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState<RolloutProgress | null>(null);
    const [result, setResult] = useState<RolloutResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    const unsubscribeRef = useRef<(() => void) | null>(null);
    const progressAriaId = useId();

    // Détermination de la liste des coups à comparer
    const candidateMoves = React.useMemo(() => {
        if (customCandidateMoves && customCandidateMoves.length > 0) {
            return customCandidateMoves;
        }
        const moves: string[] = [];
        if (optimalMove && optimalMove.trim()) moves.push(optimalMove.trim());
        if (playedMove && playedMove.trim() && !moves.includes(playedMove.trim())) {
            moves.push(playedMove.trim());
        }
        if (moves.length === 0) {
            return ['8/5 6/5', '24/20 13/10'];
        }
        return moves;
    }, [customCandidateMoves, optimalMove, playedMove]);

    // Position XGID par défaut si non fournie
    const activeXgid = xgid || 'XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10';

    // Chargement périodique des stats du pool de workers
    useEffect(() => {
        let mounted = true;
        const fetchStats = async () => {
            try {
                const stats = await getPoolStats(apiBase);
                if (mounted) setPoolStats(stats);
            } catch {
                // Silencieux
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 6000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [apiBase]);

    // Nettoyage de l'abonnement SSE lors du démontage
    useEffect(() => {
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, []);

    const handleStartRollout = async () => {
        if (status === 'running' || status === 'queued') return;

        setErrorMessage(null);
        setResult(null);
        setStatus('queued');
        setProgress({
            jobId: '',
            status: 'queued',
            progress: 0,
            trialsDone: 0,
            totalTrials: trials,
            currentMove: candidateMoves[0],
            etaSeconds: 4.0,
        });

        try {
            const { jobId } = await submitRollout(
                {
                    xgid: activeXgid,
                    trials,
                    ply: 2,
                    candidateMoves,
                },
                apiBase
            );

            setCurrentJobId(jobId);
            setStatus('running');

            // Abonnement au flux SSE temps réel
            unsubscribeRef.current = subscribeRolloutProgress(
                jobId,
                {
                    onProgress: (prog) => {
                        setProgress(prog);
                        if (prog.status === 'running') {
                            setStatus('running');
                        }
                    },
                    onComplete: (rolloutResult) => {
                        setStatus('completed');
                        setResult(rolloutResult);
                        onRolloutCompleted?.(rolloutResult);
                    },
                    onError: (err) => {
                        if (status !== 'cancelled') {
                            setStatus('failed');
                            setErrorMessage(err.message || 'Une erreur est survenue pendant le rollout.');
                        }
                    },
                },
                apiBase
            );
        } catch (err: any) {
            setStatus('failed');
            setErrorMessage(err?.message || 'Impossible de contacter le pool de workers.');
        }
    };

    const handleCancelRollout = async () => {
        if (!currentJobId || isCancelling) return;
        setIsCancelling(true);
        try {
            await cancelRollout(currentJobId, apiBase);
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
            setStatus('cancelled');
            setErrorMessage('Rollout annulé par l’utilisateur.');
        } catch {
            // Silencieux
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <section
            aria-label={t('rollout.title')}
            data-testid="deep-rollout-section"
            className={`rounded-xl border border-slate-700/80 bg-slate-900/95 p-4 text-slate-100 shadow-xl backdrop-blur-md ${className}`}
        >
            {/* Entête avec badge du pool de workers */}
            <RolloutHeader poolStats={poolStats} status={status} t={t} />

            {/* Coups comparés */}
            <div className="mt-3 rounded-lg bg-slate-800/40 p-2.5 border border-slate-800">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                    {t('rollout.candidateMoves')}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                    {candidateMoves.map((m, idx) => (
                        <div
                            key={m}
                            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-medium ${idx === 0
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                                : 'bg-slate-800 text-slate-200 border border-slate-700'
                                }`}
                        >
                            <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                            <span>{m}</span>
                            {idx === 0 && (
                                <span className="rounded bg-emerald-800/80 px-1 text-[9px] font-semibold text-emerald-200">
                                    optimal
                                </span>
                            )}
                            {idx === 1 && playedMove && m === playedMove && (
                                <span className="rounded bg-amber-800/80 px-1 text-[9px] font-semibold text-amber-200">
                                    joué
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Sélecteur de trials (lorsqu'aucun calcul n'est en cours) */}
            {status !== 'running' && status !== 'queued' && (
                <div className="mt-3">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                        {t('rollout.precisionLabel')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {trialOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                data-testid={`trial-opt-${opt.value}`}
                                onClick={() => setTrials(opt.value)}
                                className={`flex flex-col items-center justify-center rounded-lg p-2 text-center transition-all ${trials === opt.value
                                    ? 'bg-blue-600/30 border-2 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                                    : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                    }`}
                            >
                                <span className="text-xs font-bold">{opt.label}</span>
                                <span className="text-[10px] text-slate-400 mt-0.5">{opt.speed}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Barre de progression temps réel SSE */}
            {(status === 'running' || status === 'queued' || status === 'completed') && progress && (
                <RolloutProgressPanel
                    status={status}
                    progress={progress}
                    progressAriaId={progressAriaId}
                    isCancelling={isCancelling}
                    onCancel={handleCancelRollout}
                    t={t}
                    locale={locale}
                />
            )}

            {/* Message d'erreur ou d'annulation */}
            {errorMessage && (status === 'failed' || status === 'cancelled') && (
                <div
                    data-testid="rollout-error-msg"
                    className="mt-3 rounded-lg bg-red-950/60 border border-red-800/80 p-2.5 text-xs text-red-200 flex items-center justify-between"
                >
                    <span>{errorMessage}</span>
                    <button
                        type="button"
                        onClick={handleStartRollout}
                        className="rounded bg-red-900/80 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-red-800 transition"
                    >
                        {t('common.retry')}
                    </button>
                </div>
            )}

            {/* Résultats du rollout terminé */}
            {status === 'completed' && result && (
                <RolloutResultsTable
                    result={result}
                    optimalMove={optimalMove}
                    fallbackMove={candidateMoves[0]}
                    onRerun={handleStartRollout}
                    t={t}
                />
            )}

            {/* Bouton de déclenchement (CTA) */}
            {status !== 'running' && status !== 'queued' && (
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={handleStartRollout}
                        data-testid="start-rollout-btn"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/50 transition hover:from-blue-500 hover:to-cyan-400 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                            />
                        </svg>
                        {t('rollout.launchBtn', { trials })}
                    </button>
                </div>
            )}
        </section>
    );
}
