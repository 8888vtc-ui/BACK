'use client';

/**
 * Rapport de Formation Post-Match — remplace l'overlay minimal de fin de partie.
 *
 * Rôle :
 *   Assemble les sections du bilan Grandmaster Match Review & Blunder Report :
 *     1. `PostMatchHeader` — résultat + comparatif PR + bilan des paliers ;
 *     2. Barre d'actions principale — immédiatement accessible sans scroller ;
 *     3. `MatchBlunderReport` — bannière PR/Accuracy %, carrousel/accordéon de `MiniBoardDiagram` avec flèches comparatives,
 *        voix du Coach, mode puzzle « Rejouer ce coup », et rapport Gemini en 3 volets (🎯 Diagnostic, 💡 Concept Clé, 🚀 Plan) ;
 *     4. Persistance IndexedDB + Supabase (déclenchée une seule fois au montage).
 *
 *   Propose les actions : Manche Suivante / Rejouer, Bilan & Courbe PR, Entraîner mes Blunders, Retour au Lobby.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import PostMatchHeader from './PostMatchHeader';
import ChameleonPostMatchCard from './ChameleonPostMatchCard';
import MatchBlunderReport from './MatchBlunderReport';
import {
    buildMatchSummaryPayload,
    extractMajorBlunders,
    summarizeDecisionCounters,
} from './postMatchReportHelpers';
import { persistPostMatchReport, resolveCurrentUserId } from './postMatchPersistence';
import type { CompleteGameAnalysis } from '../../features/rating/types';

export interface PostMatchTrainingReportProps {
    /** Analyse complète de la manche (null si indisponible). */
    analysis: CompleteGameAnalysis | null;
    winner: 'X' | 'O' | null;
    winType: 'single' | 'gammon' | 'backgammon' | 'pass' | null;
    pointsWon: number;
    scoreX: number;
    scoreO: number;
    matchLength: number;
    isMatchOver: boolean;
    gameId: string;
    /** PR du bot (optionnel). */
    botPr?: number | null;
    /** Catégorie du bot (optionnel). */
    botCategory?: string | null;
    /** Mode hors-ligne forcé. */
    isOffline?: boolean;
    /** Endpoint de l'API Coach. */
    apiUrl?: string;
    /** Manche suivante / rejouer. */
    onNextGame: () => void;
    /** Ouvre le bilan complet & courbe PR (`GameReviewModal`). */
    onOpenReview?: () => void;
    /** Retour au lobby. */
    onBackToLobby: () => void;
    /** Ouvre les Drills sur les blunders. */
    onTrainBlunders?: () => void;
    /** Ouvre l'auditeur cryptographique Provably Fair des dés en 1 clic. */
    onOpenDiceAudit?: () => void;
    /** Ouvre la modale d'import/export horloger. */
    onOpenExportImport?: () => void;
    /** Langue d'affichage. */
    locale?: string;
}

const PostMatchTrainingReportComponent: React.FC<PostMatchTrainingReportProps> = ({
    analysis,
    winner,
    winType,
    pointsWon,
    scoreX,
    scoreO,
    matchLength,
    isMatchOver,
    gameId,
    botPr = null,
    botCategory = null,
    isOffline = false,
    apiUrl = '/api/coach',
    onNextGame,
    onOpenReview,
    onBackToLobby,
    onTrainBlunders,
    onOpenDiceAudit,
    onOpenExportImport,
    locale = 'fr',
}) => {
    const isEn = Boolean(locale && locale !== 'fr');
    const [persistStatus, setPersistStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const persistedKeyRef = useRef<string | null>(null);

    // Erreurs majeures extraites des coups évalués.
    const blunders = useMemo(
        () => extractMajorBlunders(analysis?.evaluatedMoves, 'X'),
        [analysis],
    );

    // Compteurs des 4 paliers.
    const counters = useMemo(() => summarizeDecisionCounters(analysis), [analysis]);

    // Résumé structuré transmis à l'IA.
    const summaryPayload = useMemo(
        () => buildMatchSummaryPayload({ analysis, blunders, opponentPerformanceRating: botPr }),
        [analysis, blunders, botPr],
    );

    // Persistance IndexedDB + Supabase (se relance si `analysis` arrive après le premier rendu).
    useEffect(() => {
        const persistKey = `${gameId}:${analysis?.id ?? 'no_analysis'}`;
        if (persistedKeyRef.current === persistKey) return;
        persistedKeyRef.current = persistKey;

        void (async () => {
            try {
                const userId = await resolveCurrentUserId();
                const result = await persistPostMatchReport({
                    analysis,
                    summary: summaryPayload,
                    blunders,
                    gameId,
                    userId,
                });
                setPersistStatus(result.localSaved ? 'saved' : 'error');
            } catch (e) {
                console.warn('[PostMatchTrainingReport] Échec persistance :', e);
                setPersistStatus('error');
            }
        })();
    }, [analysis, summaryPayload, blunders, gameId]);

    const playerPr = analysis?.performanceRating ?? 0;
    const playerCategory = analysis?.prCategory ?? 'Intermédiaire';

    // Raccourcis clavier : Échap (retour Lobby), Entrée (manche suivante / nouveau match)
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLButtonElement) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                onBackToLobby();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                onNextGame();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onBackToLobby, onNextGame]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-match-report-title"
            data-testid="post-match-training-report"
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-slate-950/85 p-3 backdrop-blur-md sm:p-6"
        >
            <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto space-y-3 rounded-3xl border border-white/15 bg-slate-950/95 p-3 shadow-[0_28px_80px_rgba(0,0,0,0.92)] sm:p-5">
                {/* Titre du rapport */}
                <header className="flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2">
                        <span aria-hidden="true" className="text-lg text-amber-400">
                            🏆
                        </span>
                        <h1
                            id="post-match-report-title"
                            className="font-sans text-sm font-black uppercase tracking-wider text-white sm:text-base"
                        >
                            {isEn ? 'Post-match training report' : 'Rapport de Formation Post-Match'}
                        </h1>
                    </div>
                    <span
                        data-testid="post-match-persist-status"
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            persistStatus === 'saved'
                                ? 'border-emerald-600/60 bg-emerald-950/60 text-emerald-300'
                                : persistStatus === 'error'
                                  ? 'border-rose-700/60 bg-rose-950/60 text-rose-300'
                                  : 'border-white/10 bg-slate-900 text-slate-400'
                        }`}
                    >
                        {persistStatus === 'saved'
                            ? (isEn ? '💾 Saved' : '💾 Enregistré')
                            : persistStatus === 'error'
                              ? (isEn ? '⚠️ Local only' : '⚠️ Local seul')
                              : (isEn ? '⏳ Saving…' : '⏳ Enregistrement…')}
                    </span>
                </header>

                {/* Section 1 — En-tête & comparatif PR */}
                <PostMatchHeader
                    winner={winner} winType={winType} pointsWon={pointsWon}
                    scoreX={scoreX} scoreO={scoreO} matchLength={matchLength}
                    playerPr={playerPr} playerCategory={playerCategory}
                    botPr={botPr} botCategory={botCategory}
                    counters={counters} totalEquityLoss={analysis?.totalEquityLoss ?? 0}
                    accuracyPercent={summaryPayload.accuracyPercent}
                    checkerPr={analysis?.checkerPR} cubePr={analysis?.cubePR}
                    locale={locale}
                />

                {/* Section 2 — Barre d'actions principale (immédiatement visible sans scroller) */}
                <div className="flex flex-col gap-2 pt-0.5 sm:flex-row sm:flex-wrap">
                    <button
                        type="button" onClick={onNextGame} data-testid="post-match-next-game-btn"
                        className="flex-1 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_8px_24px_rgba(245,158,11,0.3)] transition hover:brightness-105 active:scale-[0.98]"
                    >
                        <span aria-hidden="true">▶</span>
                        <span>{isMatchOver ? (isEn ? 'New match' : 'Nouveau match') : (isEn ? 'Next game' : 'Manche suivante')}</span>
                    </button>

                    {(onOpenReview || analysis) && (
                        <button
                            type="button" onClick={onOpenReview ?? onBackToLobby} data-testid="open-game-review-btn"
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-100 transition hover:border-amber-400/50 hover:text-white active:scale-95"
                        >
                            <span aria-hidden="true">📊</span>
                            <span>{isEn ? 'Full PR Review' : 'Bilan & Courbe PR'}</span>
                        </button>
                    )}

                    {onTrainBlunders && (!analysis || blunders.length > 0) && (
                        <button
                            type="button" onClick={onTrainBlunders} data-testid="post-match-train-blunders-btn"
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-400/20 active:scale-95"
                        >
                            <span aria-hidden="true">🎯</span>
                            <span>{isEn ? 'Train my blunders' : 'Entraîner mes Blunders'}</span>
                        </button>
                    )}

                    {onOpenExportImport && (
                        <button
                            type="button" onClick={onOpenExportImport} data-testid="post-match-export-import-btn"
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-200 transition hover:border-amber-400/50 hover:text-white active:scale-95"
                        >
                            <span aria-hidden="true">⏱️</span>
                            <span>{isEn ? 'Export / Import' : 'Exporter / Importer'}</span>
                        </button>
                    )}

                    {onOpenDiceAudit && (
                        <button
                            type="button" onClick={onOpenDiceAudit} data-testid="post-match-dice-audit-btn"
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-2.5 text-xs font-bold text-emerald-300 transition hover:border-emerald-400 hover:text-white active:scale-95"
                        >
                            <span aria-hidden="true">🛡</span>
                            <span>{isEn ? 'Verify Dice' : 'Vérifier les Dés'}</span>
                        </button>
                    )}

                    <button
                        type="button" onClick={onBackToLobby} data-testid="post-match-back-lobby-btn"
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-white/25 hover:text-white active:scale-95"
                    >
                        <span aria-hidden="true" className="text-amber-400">←</span>
                        <span>{isEn ? 'Back to lobby' : 'Retour au Lobby'}</span>
                    </button>
                </div>

                {/* Section 2b — Synthèse Caméléon à divulgation progressive (Couche 0 / 1 / 2) */}
                <ChameleonPostMatchCard analysis={analysis} locale={locale} />

                {/* Section 3 — Revue unifiée des erreurs et synthèse du Coach */}
                <MatchBlunderReport
                    analysis={analysis}
                    opponentPr={botPr}
                    isOffline={isOffline}
                    apiUrl={apiUrl}
                    locale={locale}
                    onTrainBlunders={onTrainBlunders}
                    hideSummaryBanner={true}
                />
            </div>
        </div>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const PostMatchTrainingReport = React.memo(PostMatchTrainingReportComponent);
export default PostMatchTrainingReport;
