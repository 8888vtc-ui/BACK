'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import ProgressionHeroStats from './ProgressionHeroStats';
import ProgressionMatchesHistory from './ProgressionMatchesHistory';
import ProgressionConceptsSection from './ProgressionConceptsSection';
import {
    ADAPTIVE_QUIZ_CATEGORIES,
    getAdaptivePlayerProfile,
    type AdaptivePlayerProfile,
} from '../../features/drills/adaptiveQuizEngine';

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
    const [adaptiveProfile, setAdaptiveProfile] = useState<AdaptivePlayerProfile>(() => getAdaptivePlayerProfile());

    useEffect(() => {
        setAdaptiveProfile(getAdaptivePlayerProfile());
    }, []);

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

    const handleSelectGameById = (gameId: string) => {
        const target = allAnalyses.find((a) => a.gameId === gameId || a.id === gameId);
        if (target) {
            setSelectedAnalysis(target);
            setIsReviewOpen(true);
        }
    };

    return (
        <div className="w-full max-w-6xl space-y-6 text-[#fdf8eb]">
            <ProgressionHeroStats
                performanceRating={stats.performanceRating}
                prCategory={stats.prCategory}
                averageErrorRate={stats.averageErrorRate}
                totalBlunders={stats.totalBlunders}
                totalDoubtful={stats.totalDoubtful}
                totalGamesPlayed={stats.totalGamesPlayed}
                totalGamesWon={stats.totalGamesWon}
                winRate={stats.winRate}
                onBackToGame={onBackToGame}
            />

            {/* RADAR DES 9 COMPÉTENCES DU PARCOURS ADAPTATIF IA */}
            <section className="rounded-2xl border border-white/10 bg-[#0e121b]/95 p-4 sm:p-5 shadow-xl space-y-3" data-testid="progression-9-skills-radar">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="text-sm sm:text-base font-black text-[#fdf8eb]">
                            🎯 Niveau &amp; Maîtrise sur les 9 Techniques (Quizz Adaptatif Multi-Ply)
                        </h2>
                        <p className="text-xs text-[#a5b0c4]">
                            Niveau Global : <strong className="text-[#f3c65f]">{adaptiveProfile.overallLevel.toFixed(1)} / 4.0</strong> · Maîtrise Moyenne : <strong className="text-emerald-300">{adaptiveProfile.overallMastery}%</strong> · Quizz uniques résolus : <strong className="text-white">{adaptiveProfile.seenQuizIds.length}</strong>
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                    {ADAPTIVE_QUIZ_CATEGORIES.map((cat) => {
                        const st = adaptiveProfile.categories[cat.id];
                        const lvl = st?.level ?? 1;
                        const m = st?.masteryScore ?? 25;
                        return (
                            <div key={cat.id} className="rounded-xl border border-white/10 bg-black/40 p-2.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-xs font-bold text-[#fdf8eb]">
                                    <span className="truncate">{cat.icon} {cat.shortLabel}</span>
                                    <span className="font-mono text-[11px] text-[#f3c65f]">N{lvl}</span>
                                </div>
                                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className={`h-full rounded-full ${m >= 75 ? 'bg-emerald-400' : m >= 45 ? 'bg-[#f3c65f]' : 'bg-rose-400'}`}
                                        style={{ width: `${Math.max(8, Math.min(100, m))}%` }}
                                    />
                                </div>
                                <span className="mt-1 font-mono text-[11px] text-[#a5b0c4]">{m}%</span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ÉVOLUTION DU PERFORMANCE RATING (PR) & HISTORIQUE DES PARTIES */}
            <section className="space-y-4" data-testid="pr-history-section">
                <PRHistoryChart history={ratingHistory} onSelectGame={handleSelectGameById} />
                <ProgressionCurve data={analyticsSummary.progressionPoints} onSelectGame={handleSelectGameById} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MoveTypeStatsCard metrics={analyticsSummary.moveTypeMetrics} />
                    <ConceptsHeatmap
                        cells={analyticsSummary.heatmapCells}
                        tacticalCells={analyticsSummary.tacticalHeatmapCells}
                    />
                </div>

                <ProgressionMatchesHistory
                    analyses={allAnalyses}
                    onSelectAnalysis={(item) => {
                        setSelectedAnalysis(item);
                        setIsReviewOpen(true);
                    }}
                />
            </section>

            <ProgressionConceptsSection
                weakestConcepts={stats.weakestConcepts}
                concepts={stats.concepts}
                recentExplanations={stats.recentExplanations}
            />

            <RecurringErrorsCard />

            <GameReviewModal
                analysis={selectedAnalysis}
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
            />
        </div>
    );
}
