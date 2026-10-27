'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    aggregateUserStats,
    PlayerProgressionStats,
    ConceptMetric,
    STRATEGIC_CONCEPTS_CATALOG,
} from '../../lib/stats/statsAggregator';
import PRHistoryChart from '../rating/PRHistoryChart';
import GameReviewModal from '../rating/GameReviewModal';
import {
    getAllGameAnalyses,
    getRatingHistory,
    CompleteGameAnalysis,
    RatingHistoryPoint,
} from '../../features/rating';
import { computeAnalyticsSummary } from '../../features/analytics';
import MoveTypeStatsCard from '../analytics/MoveTypeStatsCard';
import ConceptsHeatmap from '../analytics/ConceptsHeatmap';
import ProgressionCurve from '../analytics/ProgressionCurve';
import RecurringErrorsCard from './RecurringErrorsCard';

export interface ProgressionDashboardProps {
    onBackToGame?: () => void;
}

const DEFAULT_CONCEPTS: ConceptMetric[] = STRATEGIC_CONCEPTS_CATALOG.map((base) => ({
    ...base,
    errorCount: 0,
    blunderCount: 0,
    totalEquityLoss: 0,
    masteryScore: 100,
    priority: 'low',
}));

const INITIAL_PROGRESSION_STATS: PlayerProgressionStats = {
    totalGamesPlayed: 0,
    totalGamesWon: 0,
    winRate: 50,
    totalGammonsWon: 0,
    totalBackgammonsWon: 0,
    totalMovesEvaluated: 1,
    totalBlunders: 0,
    totalDoubtful: 0,
    totalEquityLoss: 0,
    averageErrorRate: 0,
    performanceRating: 6.5,
    prCategory: 'Expert',
    concepts: DEFAULT_CONCEPTS,
    weakestConcepts: [DEFAULT_CONCEPTS[0], DEFAULT_CONCEPTS[1]],
    recentExplanations: [],
};

export default function ProgressionDashboard({ onBackToGame }: ProgressionDashboardProps) {
    const [stats, setStats] = useState<PlayerProgressionStats>(INITIAL_PROGRESSION_STATS);
    const [selectedAnalysis, setSelectedAnalysis] = useState<CompleteGameAnalysis | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [allAnalyses, setAllAnalyses] = useState<CompleteGameAnalysis[]>([]);
    const [ratingHistory, setRatingHistory] = useState<RatingHistoryPoint[]>([]);

    useEffect(() => {
        let mounted = true;

        async function load() {
            try {
                const res = await aggregateUserStats();
                const analyses = getAllGameAnalyses();
                const history = getRatingHistory();
                if (mounted) {
                    if (res.totalGamesPlayed === 0 && analyses.length > 0) {
                        const won = analyses.filter((a) => a.winner === a.player).length;
                        const avgErr = Number(
                            (analyses.reduce((s, a) => s + a.errorRate, 0) / analyses.length).toFixed(4),
                        );
                        const avgPr = Number(
                            (analyses.reduce((s, a) => s + a.performanceRating, 0) / analyses.length).toFixed(1),
                        );
                        const blunders = analyses.reduce(
                            (s, a) => s + a.breakdown.blunder + a.breakdown.howler,
                            0,
                        );
                        const doubtful = analyses.reduce((s, a) => s + a.breakdown.doubtful, 0);
                        const conceptLossMap = new Map<string, { err: number; bln: number; loss: number }>();
                        for (const a of analyses) {
                            for (const m of a.evaluatedMoves) {
                                if (m.player !== a.player) continue;
                                const loss = Math.abs(m.equityLoss || 0);
                                if (loss < 0.02 && m.verdict !== 'blunder' && m.verdict !== 'doubtful') continue;
                                const cid = m.conceptId || 'blot_safety';
                                const cur = conceptLossMap.get(cid) ?? { err: 0, bln: 0, loss: 0 };
                                cur.err += 1;
                                if (m.verdict === 'blunder' || m.verdict === 'howler' || loss >= 0.08) cur.bln += 1;
                                cur.loss += loss;
                                conceptLossMap.set(cid, cur);
                            }
                        }
                        const mergedConcepts: ConceptMetric[] = res.concepts.map((c) => {
                            const extra = conceptLossMap.get(c.id);
                            if (!extra || c.errorCount > 0) return c;
                            const loss = Number(extra.loss.toFixed(3));
                            const masteryScore = Math.max(10, Math.min(100, Math.round(100 - (extra.err * 15 + loss * 50))));
                            const priority: 'high' | 'medium' | 'low' =
                                extra.err >= 3 || loss >= 0.25 || masteryScore < 60
                                    ? 'high'
                                    : extra.err >= 1 || loss >= 0.08 || masteryScore < 80
                                      ? 'medium'
                                      : 'low';
                            return {
                                ...c,
                                errorCount: extra.err,
                                blunderCount: extra.bln,
                                totalEquityLoss: loss,
                                masteryScore,
                                priority,
                            };
                        });
                        const weak = [...mergedConcepts]
                            .filter((c) => c.errorCount > 0)
                            .sort((a, b) => b.totalEquityLoss - a.totalEquityLoss)
                            .slice(0, 3);
                        setStats({
                            ...res,
                            totalGamesPlayed: analyses.length,
                            totalGamesWon: won,
                            winRate: Number(((won / analyses.length) * 100).toFixed(1)),
                            averageErrorRate: res.totalEquityLoss > 0 ? res.averageErrorRate : avgErr,
                            performanceRating: res.totalEquityLoss > 0 ? res.performanceRating : avgPr,
                            totalBlunders: Math.max(res.totalBlunders, blunders),
                            totalDoubtful: Math.max(res.totalDoubtful, doubtful),
                            concepts: mergedConcepts,
                            weakestConcepts: weak.length > 0 ? weak : res.weakestConcepts,
                        });
                    } else {
                        setStats(res);
                    }
                    setAllAnalyses(analyses);
                    setRatingHistory(history);
                }
            } catch (err) {
                console.warn('[ProgressionDashboard] Erreur chargement stats :', err);
            }
        }

        load();

        return () => {
            mounted = false;
        };
    }, []);

    const analyticsSummary = useMemo(() => {
        return computeAnalyticsSummary(allAnalyses);
    }, [allAnalyses]);

    const {
        performanceRating,
        prCategory,
        averageErrorRate,
        totalGamesPlayed,
        totalGamesWon,
        winRate,
        totalBlunders,
        totalDoubtful,
        weakestConcepts,
        concepts,
        recentExplanations,
    } = stats;

    // Couleurs selon le niveau PR
    const prBadgeColors: Record<string, string> = {
        'Grand-Maître': 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-emerald-950/40',
        'Maître': 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-cyan-950/40',
        'Expert': 'bg-blue-950/80 border-blue-500 text-blue-300 shadow-blue-950/40',
        'Avancé': 'bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-indigo-950/40',
        'Intermédiaire': 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-amber-950/40',
        'Débutant': 'bg-slate-800/80 border-slate-600 text-slate-300 shadow-slate-950/40',
    };

    return (
        <div className="w-full max-w-6xl space-y-6 text-[#fdf8eb]">
            {/* Barre de navigation / Retour */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-[#180c06] via-[#0e121b] to-[#080a0f] p-5 sm:p-6 shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(243,198,95,0.18)]">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#fdf8eb] flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#2a170c] to-[#120904] text-lg shadow-inner">
                            <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">📊</span>
                        </span>
                        <span>Tableau de Progression &amp; Analyse Stratégique</span>
                    </h1>
                    <p className="text-xs text-[#a5b0c4] mt-1">
                        Diagnostic en continu de vos décisions, calcul du Performance Rating (PR) et identification de vos axes de progrès.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/drills"
                        className="rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#d4af37] via-[#f8d778] to-[#c69214] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1a0f08] hover:brightness-105 transition shadow-md flex items-center gap-1.5"
                    >
                        <span>🎯</span>
                        <span>Drills de Blunders</span>
                    </Link>

                    {onBackToGame ? (
                        <button
                            type="button"
                            onClick={onBackToGame}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition shadow-sm flex items-center gap-2"
                        >
                            <span>←</span>
                            <span>Retour au plateau</span>
                        </button>
                    ) : (
                        <Link
                            href="/"
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition shadow-sm flex items-center gap-2"
                        >
                            <span>←</span>
                            <span>Retour au plateau</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* 1. HERO : Performance Rating (PR) & Taux d'Erreur Global */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Carte PR */}
                <div className="md:col-span-1 rounded-2xl border border-white/10 bg-gradient-to-br from-[#180c06] via-[#0e121b] to-[#080a0f] p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-[#d4af37]/15 blur-2xl pointer-events-none" />
                    <p className="text-xs font-bold text-[#f3c65f] uppercase tracking-wider">
                        Performance Rating (PR)
                    </p>
                    <div className="mt-3 flex items-baseline gap-3">
                        <span className="text-4xl font-extrabold font-mono text-[#fdf8eb] tracking-tight" data-testid="stats-pr-value">
                            {performanceRating}
                        </span>
                        <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-bold shadow-md ${prBadgeColors[prCategory] || prBadgeColors['Intermédiaire']
                                }`}
                            data-testid="stats-pr-category"
                        >
                            {prCategory}
                        </span>
                    </div>
                    <p className="mt-3 text-xs text-[#a5b0c4] leading-relaxed">
                        Échelle de référence du Backgammon de compétition. Plus le score est proche de 0, plus votre jeu approche la perfection mathématique.
                    </p>
                </div>

                {/* Carte Taux d'erreur moyen */}
                <div className="rounded-2xl border border-white/10 bg-[#0e121b]/95 p-5 shadow-xl">
                    <p className="text-xs font-bold text-[#e2d2b5] uppercase tracking-wider">
                        Taux d&apos;Erreur Moyen (Error Rate)
                    </p>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold font-mono text-[#f3c65f]" data-testid="stats-error-rate">
                            {averageErrorRate.toFixed(3)}
                        </span>
                        <span className="text-xs text-[#a5b0c4]">équité / coup</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs border-t border-white/10 pt-3">
                        <span className="text-[#a5b0c4]">Blunders :</span>
                        <strong className="font-mono text-red-400">{totalBlunders}</strong>
                        <span className="text-slate-600">·</span>
                        <span className="text-[#a5b0c4]">Doutes :</span>
                        <strong className="font-mono text-[#f3c65f]">{totalDoubtful}</strong>
                    </div>
                </div>

                {/* Carte Bilan des Parties */}
                <div className="rounded-2xl border border-white/10 bg-[#0e121b]/95 p-5 shadow-xl">
                    <p className="text-xs font-bold text-[#e2d2b5] uppercase tracking-wider">
                        Bilan des Parties
                    </p>
                    <div className="mt-3 flex items-baseline gap-3">
                        <span className="text-3xl font-extrabold font-mono text-emerald-400">
                            {winRate}%
                        </span>
                        <span className="text-xs text-[#a5b0c4]">de victoires</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs border-t border-white/10 pt-3">
                        <span className="text-[#a5b0c4]">Jouées :</span>
                        <strong className="font-mono text-[#fdf8eb]">{totalGamesPlayed}</strong>
                        <span className="text-slate-600">·</span>
                        <span className="text-[#a5b0c4]">Gagnées :</span>
                        <strong className="font-mono text-[#fdf8eb]">{totalGamesWon}</strong>
                    </div>
                </div>
            </div>

            {/* 1b. ÉVOLUTION DU PERFORMANCE RATING (PR) & HISTORIQUE DES PARTIES */}
            <section className="space-y-4" data-testid="pr-history-section">
                <PRHistoryChart
                    history={ratingHistory}
                    onSelectGame={(gameId) => {
                        const target = allAnalyses.find(
                            (a) => a.gameId === gameId || a.id === gameId,
                        );
                        if (target) {
                            setSelectedAnalysis(target);
                            setIsReviewOpen(true);
                        }
                    }}
                />

                {/* 1c. COURBE DE PROGRESSION MULTI-MÉTRIQUES & MOYENNE MOBILE */}
                <ProgressionCurve
                    data={analyticsSummary.progressionPoints}
                    onSelectGame={(gameId) => {
                        const target = allAnalyses.find(
                            (a) => a.gameId === gameId || a.id === gameId,
                        );
                        if (target) {
                            setSelectedAnalysis(target);
                            setIsReviewOpen(true);
                        }
                    }}
                />

                {/* 1d. ANALYTICS : TAUX D'ERREUR PAR TYPE DE COUP & HEATMAP DES CONCEPTS FAIBLES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MoveTypeStatsCard metrics={analyticsSummary.moveTypeMetrics} />
                    <ConceptsHeatmap
                        cells={analyticsSummary.heatmapCells}
                        tacticalCells={analyticsSummary.tacticalHeatmapCells}
                    />
                </div>

                {/* Liste des parties analysées avec détail coup par coup */}
                {allAnalyses.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-[#0d121d]/90 p-5 shadow-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <span>📜</span>
                                    <span>Historique des Matchs &amp; Évaluation du Moteur ({allAnalyses.length})</span>
                                </h3>
                                <p className="text-xs text-slate-300 mt-0.5">
                                    Consultez le diagnostic détaillé coup par coup et la note PR de chacune de vos parties.
                                </p>
                            </div>
                        </div>

                        <div className="divide-y divide-white/10" data-testid="game-analyses-list">
                            {allAnalyses.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 hover:bg-white/[0.03] px-2 rounded-xl transition cursor-pointer"
                                    onClick={() => {
                                        setSelectedAnalysis(item);
                                        setIsReviewOpen(true);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">
                                            {item.winner === item.player ? '🏆' : '🏳️'}
                                        </span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-white">
                                                    Match {item.matchLength} pts ({item.scoreX} - {item.scoreO})
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${item.winner === item.player
                                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                                                        : 'border border-white/10 bg-white/5 text-slate-300'
                                                        }`}
                                                >
                                                    {item.winner === item.player ? 'Victoire' : 'Défaite'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-300 mt-0.5">
                                                {new Date(item.date).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                })}{' '}
                                                · {item.totalMovesCount} coups · Erreur moy. : -{item.errorRate.toFixed(3)} ΔEq
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right">
                                            <div className="flex items-baseline gap-1.5 justify-end">
                                                <span className="text-[11px] uppercase font-bold text-slate-400">
                                                    PR :
                                                </span>
                                                <span className="font-mono text-base font-black text-amber-300">
                                                    {item.performanceRating}
                                                </span>
                                            </div>
                                            <span className="text-xs font-mono text-blue-300 font-bold">
                                                ~{item.estimatedRating} Elo ({item.prCategory})
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedAnalysis(item);
                                                setIsReviewOpen(true);
                                            }}
                                            className="rounded-xl border border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-200 transition shadow-sm"
                                            data-testid={`review-game-btn-${item.id}`}
                                        >
                                            🔍 Détails
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* 2. SECTION MAJEURE : Concepts Stratégiques à Travailler */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#fdf8eb] flex items-center gap-2">
                            <span>🎯</span>
                            <span>Concepts Stratégiques à Travailler en Priorité</span>
                        </h2>
                        <p className="text-xs text-[#a5b0c4]">
                            Les failles tactiques ayant causé le plus de perte d&apos;équité lors de vos dernières parties.
                        </p>
                    </div>
                    <span className="rounded-full bg-rose-950/80 border border-rose-600/60 px-3 py-1 text-xs font-bold text-rose-300">
                        {weakestConcepts.length} axe(s) critique(s)
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="weakest-concepts-grid">
                    {weakestConcepts.map((concept, idx) => (
                        <div
                            key={concept.id}
                            className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#150c07]/95 via-[#0e121b] to-[#080a0f] p-5 shadow-xl flex flex-col justify-between relative overflow-hidden"
                        >
                            <div className="absolute top-3 right-3">
                                <span className="rounded bg-rose-950/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-200 border border-rose-700/60">
                                    Priorité {idx + 1}
                                </span>
                            </div>

                            <div>
                                <span className="text-[11px] font-bold text-[#f3c65f] uppercase tracking-wider">
                                    {concept.category}
                                </span>
                                <h3 className="mt-1 text-sm font-bold text-[#fdf8eb] leading-snug">
                                    {concept.name}
                                </h3>
                                <p className="mt-2 text-xs text-[#e2d2b5] leading-relaxed">
                                    {concept.description}
                                </p>

                                {/* Métriques de perte */}
                                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#090b10]/90 p-2.5 text-xs border border-white/10">
                                    <div>
                                        <p className="text-[11px] text-[#a5b0c4]">Fautes commises</p>
                                        <p className="font-mono font-bold text-[#fdf8eb] mt-0.5">
                                            {concept.errorCount} {concept.blunderCount > 0 ? `(${concept.blunderCount} blunders)` : ''}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-[#a5b0c4]">Équité perdue</p>
                                        <p className="font-mono font-bold text-rose-400 mt-0.5">
                                            -{concept.totalEquityLoss.toFixed(3)}
                                        </p>
                                    </div>
                                </div>

                                {/* Jauge de maîtrise */}
                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-[#a5b0c4] font-medium">Niveau de maîtrise</span>
                                        <span className="font-mono font-bold text-[#f3c65f]">
                                            {concept.masteryScore}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-[#090b10] border border-white/10 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-rose-500 to-[#d4af37] transition-all duration-500"
                                            style={{ width: `${concept.masteryScore}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Conseil pédagogique du Coach */}
                            <div className="mt-5 rounded-xl border border-white/10 bg-[#180c06]/80 p-3 text-xs text-[#e2d2b5] leading-relaxed">
                                💡 <span className="font-bold text-[#f3c65f]">Conseil du Coach :</span> {concept.recommendation}
                            </div>

                            {/* Action de Drill direct pour ce concept */}
                            <div className="mt-3">
                                <Link
                                    href="/drills"
                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-[#f3c65f] hover:border-white/25 hover:text-[#fdf8eb] transition shadow-sm"
                                    data-testid={`drill-concept-btn-${concept.id}`}
                                >
                                    <span>🎯</span>
                                    <span>Rejouer les blunders en Drill</span>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 2b. ERREURS RÉCURRENTES (agrégation Supabase par concept) */}
            <RecurringErrorsCard />

            {/* 3. MATRICE COMPLÈTE : Tous les Concepts Stratégiques */}
            <section className="rounded-3xl border border-white/10 bg-[#0e121b]/95 p-5 shadow-xl space-y-4">
                <div className="border-b border-white/10 pb-3">
                    <h2 className="text-base font-bold text-[#fdf8eb] flex items-center gap-2">
                        <span>🧩</span>
                        <span>Matrice Globale de Maîtrise des Concepts de Backgammon</span>
                    </h2>
                    <p className="text-xs text-[#a5b0c4] mt-0.5">
                        Vue d&apos;ensemble de votre solidité tactique sur les 6 piliers fondamentaux.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="all-concepts-matrix">
                    {concepts.map((concept) => (
                        <div
                            key={concept.id}
                            className="rounded-2xl border border-white/10 bg-[#090b10]/90 p-4 space-y-3 hover:border-white/20 transition"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#f3c65f] uppercase tracking-wider">
                                    {concept.category}
                                </span>
                                <span
                                    className={`rounded px-1.5 py-0.5 text-[11px] font-bold uppercase ${concept.priority === 'high'
                                        ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                                        : concept.priority === 'medium'
                                            ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                                            : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                        }`}
                                >
                                    {concept.priority === 'high' ? 'À travailler' : concept.priority === 'medium' ? 'Perfectible' : 'Maîtrisé'}
                                </span>
                            </div>

                            <h3 className="text-xs font-bold text-[#fdf8eb] leading-tight">
                                {concept.name}
                            </h3>

                            <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-[11px] text-[#a5b0c4]">Maîtrise</span>
                                    <span className="font-mono text-xs font-semibold text-[#fdf8eb]">
                                        {concept.masteryScore}%
                                    </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className={`h-full ${concept.masteryScore >= 75
                                            ? 'bg-emerald-500'
                                            : concept.masteryScore >= 50
                                                ? 'bg-[#d4af37]'
                                                : 'bg-rose-500'
                                            }`}
                                        style={{ width: `${concept.masteryScore}%` }}
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-[#a5b0c4] italic">
                                {concept.recommendation}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. HISTORIQUE RÉCENT DES ANALYSES DU COACH */}
            {recentExplanations.length > 0 && (
                <section className="rounded-2xl border border-white/10 bg-[#0d121d]/90 p-5 shadow-xl space-y-4">
                    <div className="border-b border-white/10 pb-3">
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <span>🔍</span>
                            <span>Dernières Erreurs Clés Analysées par le Coach</span>
                        </h2>
                        <p className="text-xs text-slate-300 mt-0.5">
                            Rappel de vos situations de jeu récentes et des leçons associées.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {recentExplanations.map((exp) => (
                            <div
                                key={exp.id}
                                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2 text-xs"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold uppercase tracking-wider text-rose-400">
                                            {exp.verdict}
                                        </span>
                                        <span className="text-slate-500">·</span>
                                        <span className="font-mono text-slate-300">
                                            {exp.equity_loss ? `-${Math.abs(exp.equity_loss).toFixed(3)} équité` : ''}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-slate-400">
                                        {new Date(exp.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs font-mono py-1">
                                    <span className="text-rose-400">Joué : {exp.played_move}</span>
                                    <span className="text-emerald-400">Optimal : {exp.optimal_move}</span>
                                </div>

                                <p className="text-slate-200 font-semibold">{exp.summary}</p>
                                <p className="text-slate-300 leading-relaxed">{exp.explanation}</p>

                                {exp.advice && (
                                    <div className="rounded-md bg-amber-950/30 border border-white/10 p-2 text-amber-200 text-xs">
                                        💡 {exp.advice}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Modal de Bilan Complet & Inspection Move-by-Move */}
            <GameReviewModal
                analysis={selectedAnalysis}
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
            />
        </div>
    );
}
