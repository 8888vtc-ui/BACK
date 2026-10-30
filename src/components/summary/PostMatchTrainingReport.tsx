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
    const [isDetailedReviewOpen, setIsDetailedReviewOpen] = useState<boolean>(false);
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
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-md sm:p-5"
        >
            <div
                className={`w-full ${
                    isDetailedReviewOpen ? 'max-w-3xl max-h-[92vh] overflow-y-auto' : 'max-w-lg'
                } space-y-3 rounded-3xl border border-white/10 bg-[#121526] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.92)] sm:p-5 transition-all duration-200`}
            >
                {/* Titre discret + Statut de sauvegarde */}
                <header className="flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2">
                        <h1
                            id="post-match-report-title"
                            className="font-sans text-xs font-black uppercase tracking-wider text-slate-300"
                        >
                            {isEn ? 'Match Summary' : 'Bilan de la Partie'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
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
                        <button
                            type="button"
                            onClick={onBackToLobby}
                            data-testid="post-match-back-lobby-btn"
                            aria-label={isEn ? 'Back to lobby' : 'Retour au Lobby'}
                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
                        >
                            ✕ {isEn ? 'Lobby' : 'Salon'}
                        </button>
                    </div>
                </header>

                {/* Section 1 — Carte de Bilan "Tout d'une traite" (Duel 7-0, Taux d'erreur, Chance, Performance) */}
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

                {/* Section 2 — Barre des 3 actions principales sur 1 seule ligne (Partager | Revue | Revanche) */}
                <div className="grid grid-cols-3 gap-2.5 pt-0.5">
                    <button
                        type="button"
                        onClick={onOpenExportImport ?? onOpenDiceAudit ?? onBackToLobby}
                        data-testid="post-match-export-import-btn"
                        className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#1c223a] px-3 py-2.5 text-xs font-extrabold text-slate-100 transition hover:bg-[#252d4d] active:scale-95"
                    >
                        <span aria-hidden="true">📤</span>
                        <span>{isEn ? 'Share' : 'Partager'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsDetailedReviewOpen((prev) => !prev);
                            onOpenReview?.();
                        }}
                        data-testid="open-game-review-btn"
                        className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#1c223a] px-3 py-2.5 text-xs font-extrabold text-slate-100 transition hover:bg-[#252d4d] active:scale-95"
                    >
                        <span aria-hidden="true">🔍</span>
                        <span>{isEn ? 'Review' : 'Revue'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onNextGame}
                        data-testid="post-match-next-game-btn"
                        className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-3 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-[0_6px_20px_rgba(52,211,153,0.35)] transition hover:bg-emerald-300 active:scale-95"
                    >
                        <span aria-hidden="true">↻</span>
                        <span>{isMatchOver ? (isEn ? 'Rematch' : 'Revanche') : (isEn ? 'Next game' : 'Manche suivante')}</span>
                    </button>
                </div>

                {/* Actions secondaires (Drills / Audit Dés) accessibles si blunders ou en 1 clic discret */}
                {(onTrainBlunders || onOpenDiceAudit) && (
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                        {onTrainBlunders && (!analysis || blunders.length > 0) && (
                            <button
                                type="button" onClick={onTrainBlunders} data-testid="post-match-train-blunders-btn"
                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-300 transition hover:bg-amber-400/20"
                            >
                                <span aria-hidden="true">🎯</span>
                                <span>{isEn ? 'Train my blunders' : 'Corriger mes erreurs en Drill'}</span>
                            </button>
                        )}
                        {onOpenDiceAudit && (
                            <button
                                type="button" onClick={onOpenDiceAudit} data-testid="post-match-dice-audit-btn"
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 text-[11px] font-bold text-emerald-300 transition hover:border-emerald-400"
                            >
                                <span aria-hidden="true">🛡</span>
                                <span>{isEn ? 'Verify Dice' : 'Audit Dés SHA-256'}</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Section 3 — Détail Coup par Coup (masqué visuellement par défaut pour garder la carte 100% lisible d'une traite, déplié au clic sur Revue) */}
                <div className={isDetailedReviewOpen ? 'space-y-3 pt-2 border-t border-white/10' : 'sr-only'}>
                    <ChameleonPostMatchCard analysis={analysis} locale={locale} />
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
        </div>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const PostMatchTrainingReport = React.memo(PostMatchTrainingReportComponent);
export default PostMatchTrainingReport;
