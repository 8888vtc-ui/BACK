'use client';

/**
 * Modale de Bilan Complet & Estimation du PR (< 300 lignes, 0 any — LOI 5).
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import type { CompleteGameAnalysis } from '../../features/rating/types';
import { shareContent, shareGameResult } from '../../lib/capacitor/share';
import { impactLight } from '../../lib/capacitor/haptics';
import EquityCurveChart from './EquityCurveChart';
import ReviewBoardPreview from './ReviewBoardPreview';
import ConceptsErrorSummary from './ConceptsErrorSummary';
import GameReviewCourse from './GameReviewCourse';
import GameReviewOverviewCards from './GameReviewOverviewCards';
import GameReviewMovesTable from './GameReviewMovesTable';
import SoftPaywallCard from '../subscription/SoftPaywallCard';
import { FREE_DAILY_ANALYSES_LIMIT, formatQuotaBadgeFr, loadGuestQuota } from '../../lib/subscription/quotaService';
import { serializeToSGF, downloadFile } from '../../features/export';
import { useBoardTheme, getModalThemeClasses, type ThemeName } from '../../hooks/useBoardTheme';

export type ReviewTab = 'overview' | 'step_by_step' | 'concepts' | 'table' | 'course';

export interface GameReviewModalProps {
    analysis: CompleteGameAnalysis | null;
    isOpen: boolean;
    onClose: () => void;
    theme?: ThemeName;
    initialTab?: ReviewTab;
    isQuotaReached?: boolean;
    quotaUsedCount?: number;
    isVip?: boolean;
    userId?: string | null;
    locale?: 'fr' | 'en';
}

export default function GameReviewModal({
    analysis, isOpen, onClose, theme, initialTab = 'overview',
    isQuotaReached, quotaUsedCount, isVip = false, userId = null, locale = 'fr',
}: GameReviewModalProps) {
    const { theme: activeTheme } = useBoardTheme();
    const modalClasses = getModalThemeClasses(theme || activeTheme);
    const [activeTab, setActiveTab] = useState<ReviewTab>(initialTab);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [filterOnlyMistakes, setFilterOnlyMistakes] = useState<boolean>(false);
    const [drillModeActive, setDrillModeActive] = useState<boolean>(false);

    useEffect(() => {
        if (isOpen) setActiveTab(initialTab);
    }, [isOpen, initialTab]);

    useEffect(() => {
        setSelectedIndex(0);
        setDrillModeActive(false);
        setFilterOnlyMistakes(false);
    }, [analysis?.id]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    const evaluatedMoves = useMemo(() => analysis?.evaluatedMoves ?? [], [analysis]);
    const totalMoves = evaluatedMoves.length;
    const mistakeIndices = useMemo(() => {
        const out: number[] = [];
        evaluatedMoves.forEach((m, i) => {
            if (m.verdict === 'doubtful' || m.verdict === 'blunder' || m.verdict === 'howler') out.push(i);
        });
        return out;
    }, [evaluatedMoves]);

    const hasPrevMistake = mistakeIndices.some((idx) => idx < selectedIndex);
    const hasNextMistake = mistakeIndices.some((idx) => idx > selectedIndex);
    const handlePrevMistake = useCallback(() => {
        const earlier = mistakeIndices.filter((idx) => idx < selectedIndex);
        if (earlier.length > 0) setSelectedIndex(earlier[earlier.length - 1]);
    }, [mistakeIndices, selectedIndex]);
    const handleNextMistake = useCallback(() => {
        const later = mistakeIndices.filter((idx) => idx > selectedIndex);
        if (later.length > 0) setSelectedIndex(later[0]);
    }, [mistakeIndices, selectedIndex]);

    if (!isOpen || !analysis) return null;

    const guestQuota = loadGuestQuota();
    const resolvedUsedCount = quotaUsedCount ?? (guestQuota.dailyAnalysesCount > 0 ? guestQuota.dailyAnalysesCount : 1);
    const isGameAlreadyUnlocked = Boolean(analysis.gameId && (guestQuota.consumedGameIds ?? []).includes(analysis.gameId));
    const effectiveIsQuotaReached =
        !isVip &&
        (isQuotaReached !== undefined
            ? isQuotaReached
            : quotaUsedCount !== undefined
              ? quotaUsedCount > FREE_DAILY_ANALYSES_LIMIT
              : guestQuota.dailyAnalysesCount >= FREE_DAILY_ANALYSES_LIMIT && !isGameAlreadyUnlocked);

    const quotaBadgeLabel = formatQuotaBadgeFr(resolvedUsedCount, FREE_DAILY_ANALYSES_LIMIT, isVip);
    const currentTurn = evaluatedMoves[selectedIndex] || evaluatedMoves[0];
    const mistakesCount = analysis.breakdown.doubtful + analysis.breakdown.blunder + analysis.breakdown.howler;

    const handleExportSgf = () => {
        try {
            const rawTurns = evaluatedMoves.map((m) => ({
                turnNumber: m.moveNumber, player: m.player, dice: m.dice,
                boardBefore: m.boardBefore, boardAfter: m.boardAfter, moves: [], playedNotation: m.playedNotation,
            }));
            const sgf = serializeToSGF({
                gameId: analysis.gameId, matchLength: analysis.matchLength,
                scoreX: analysis.scoreX, scoreO: analysis.scoreO, winner: analysis.winner, turnsHistory: rawTurns,
            });
            downloadFile(sgf, `backgammon_${analysis.gameId}.sgf`, 'application/x-go-sgf');
        } catch (e) {
            console.warn('Erreur export SGF :', e);
        }
    };

    const tabBtnClass = (tab: ReviewTab) =>
        `flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
            activeTab === tab
                ? 'border border-[#f5d77f]/60 bg-gradient-to-r from-[#8b6914] via-[#d4af37] to-[#f3c65f] text-[#1a0f07] shadow-md'
                : 'border border-white/10 bg-[#1a0f08] text-[#e8dcc6]/80 hover:border-[#d4af37]/45 hover:text-white'
        }`;

    return (
        <div
            role="dialog" aria-modal="true" aria-labelledby="game-review-title" data-testid="game-review-modal"
            className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 animate-in fade-in duration-200 overflow-y-auto ${modalClasses.overlay}`}
        >
            <div className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl shadow-2xl my-auto transition-all ${modalClasses.container}`}>
                {/* 1. En-tête du Modal */}
                <div className={`flex items-center justify-between border-b p-4 sm:p-5 ${modalClasses.header}`}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d4af37]/50 bg-gradient-to-br from-[#33200f] to-[#1a0f07] text-xl text-[#f3c65f] shadow-lg">⚜</div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 id="game-review-title" className="font-serif text-lg sm:text-xl font-black tracking-tight text-[#fdf8eb]">
                                    Bilan &amp; Estimation du PR
                                </h2>
                                <span className="rounded-full border border-[#d4af37]/50 bg-[#2a1a0d] px-2.5 py-0.5 text-xs font-bold text-[#fce8b2]">{analysis.prCategory}</span>
                                <span data-testid="daily-quota-badge" className="rounded-full border border-white/15 bg-[#1a0f07] px-2.5 py-0.5 text-[11px] font-semibold text-[#f3c65f]">{quotaBadgeLabel}</span>
                            </div>
                            <p className="text-xs text-[#e8dcc6]/70 mt-0.5">Navigation coup par coup, courbe d&apos;équité et analyse conceptuelle.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button type="button" onClick={handleExportSgf} data-testid="export-sgf-review-btn" title="Télécharger l'enregistrement au format SGF" className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#221309] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#fce8b2] hover:border-[#f3c65f] transition">
                            <span>💾</span><span className="hidden sm:inline">Export</span><span>SGF</span>
                        </button>
                        <button
                            type="button" data-testid="share-review-btn" title="Partager mon PR et Elo"
                            onClick={() => {
                                impactLight();
                                shareContent({
                                    title: 'Mon bilan Backgammon Pro',
                                    text: `J'ai terminé mon match avec un PR de ${analysis.performanceRating} (${analysis.prCategory}) et un Elo estimé à ${analysis.estimatedRating} !`,
                                    dialogTitle: 'Partager mon bilan de partie',
                                }).catch(() => {});
                            }}
                            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#221309] px-3 py-1.5 text-xs font-semibold text-[#fce8b2] hover:border-[#f3c65f] transition"
                        >
                            <span>📤</span><span>Partager PR</span>
                        </button>
                        <button type="button" onClick={onClose} aria-label="Fermer le bilan" data-testid="close-review-modal-btn" className="rounded-xl border border-white/15 bg-[#1e120a] p-2 text-[#e8dcc6]/80 hover:text-white hover:border-[#f3c65f] transition">✕</button>
                    </div>
                </div>

                {/* 2. Onglets de Navigation Post-Partie (5 onglets distincts sans doublon) */}
                <div role="tablist" aria-label="Sections du bilan" className="flex items-center gap-1.5 border-b border-white/10 bg-[#0d0704]/80 px-4 sm:px-6 py-2.5 overflow-x-auto">
                    <button type="button" role="tab" aria-selected={activeTab === 'overview'} onClick={() => setActiveTab('overview')} className={tabBtnClass('overview')} data-testid="tab-overview">
                        <span>📈</span><span>Courbe &amp; Synthèse</span>
                    </button>
                    <button type="button" role="tab" aria-selected={activeTab === 'step_by_step'} onClick={() => { setDrillModeActive(false); setActiveTab('step_by_step'); }} className={tabBtnClass('step_by_step')} data-testid="tab-step-by-step">
                        <span>♟️</span><span>Coup par Coup</span>
                        <span className="rounded-full bg-[#120904] px-1.5 py-0.2 text-[10px] text-[#f3c65f]">#{selectedIndex + 1}</span>
                    </button>
                    <button type="button" role="tab" aria-selected={activeTab === 'concepts'} onClick={() => setActiveTab('concepts')} className={tabBtnClass('concepts')} data-testid="tab-concepts">
                        <span>🧠</span><span>Concepts en Erreur</span>
                        {mistakeIndices.length > 0 && <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 text-[10px]">{mistakeIndices.length}</span>}
                    </button>
                    <button type="button" role="tab" aria-selected={activeTab === 'table'} onClick={() => setActiveTab('table')} className={tabBtnClass('table')} data-testid="tab-table">
                        <span>📋</span><span>Table des Coups</span>
                    </button>
                    <button type="button" role="tab" aria-selected={activeTab === 'course'} onClick={() => setActiveTab('course')} className={tabBtnClass('course')} data-testid="tab-course">
                        <span>🎓</span><span>Cours IA</span>
                    </button>
                </div>

                {/* 3. Corps de l'onglet actif avec défilement */}
                <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-170px)]">
                    {effectiveIsQuotaReached ? (
                        <SoftPaywallCard analysis={analysis} userId={userId} locale={locale} />
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div className="space-y-5 animate-in fade-in">
                                    <GameReviewOverviewCards analysis={analysis} />
                                    <EquityCurveChart
                                        moves={evaluatedMoves} selectedIndex={selectedIndex}
                                        onSelectIndex={(idx) => { setSelectedIndex(idx); setDrillModeActive(false); setActiveTab('step_by_step'); }}
                                    />
                                </div>
                            )}

                            {activeTab === 'step_by_step' && currentTurn && (
                                <div className="space-y-4 animate-in fade-in">
                                    <ReviewBoardPreview
                                        turn={currentTurn} currentIndex={selectedIndex} totalTurns={totalMoves}
                                        onPrev={() => setSelectedIndex((i) => Math.max(0, i - 1))}
                                        onNext={() => setSelectedIndex((i) => Math.min(totalMoves - 1, i + 1))}
                                        onFirst={() => setSelectedIndex(0)} onLast={() => setSelectedIndex(totalMoves - 1)}
                                        onPrevMistake={handlePrevMistake} onNextMistake={handleNextMistake}
                                        hasPrevMistake={hasPrevMistake} hasNextMistake={hasNextMistake}
                                        onSelectIndex={(idx) => setSelectedIndex(idx)} initialDrillMode={drillModeActive}
                                    />
                                    <div className="pt-2">
                                        <EquityCurveChart moves={evaluatedMoves} selectedIndex={selectedIndex} onSelectIndex={(idx) => setSelectedIndex(idx)} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'concepts' && (
                                <div className="animate-in fade-in">
                                    <ConceptsErrorSummary
                                        moves={evaluatedMoves}
                                        onSelectMoveIndex={(idx) => { setSelectedIndex(idx); setDrillModeActive(false); setActiveTab('step_by_step'); }}
                                    />
                                </div>
                            )}

                            {(activeTab === 'table' || activeTab === 'overview') && (
                                <GameReviewMovesTable
                                    evaluatedMoves={evaluatedMoves} mistakesCount={mistakesCount}
                                    filterOnlyMistakes={filterOnlyMistakes} onSetFilterOnlyMistakes={setFilterOnlyMistakes}
                                    onInspectMove={(originalIndex, drill) => {
                                        setSelectedIndex(originalIndex);
                                        setDrillModeActive(drill);
                                        setActiveTab('step_by_step');
                                    }}
                                />
                            )}

                            {activeTab === 'course' && (
                                <div className="space-y-5 animate-in fade-in">
                                    <div className="rounded-2xl border border-white/10 bg-[#140b06]/90 p-4 sm:p-5">
                                        <GameReviewCourse analysis={analysis} language={locale} />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* 4. Barre d'action inférieure */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4 bg-[#0d0704]/90">
                    <Link
                        href="/drills"
                        className="rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition shadow-sm flex items-center gap-1.5"
                    >
                        <span>🎯</span>
                        <span>Rejouer mes erreurs en Drill</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                impactLight();
                                shareGameResult({
                                    winner: analysis.winner || 'X', pointsWon: analysis.pointsWon || 1,
                                    winType: analysis.winType || 'single', scoreX: analysis.scoreX,
                                    scoreO: analysis.scoreO, matchLength: analysis.matchLength,
                                }).catch(() => {});
                            }}
                            className="rounded-xl border border-blue-500/40 bg-blue-950/40 px-3.5 py-2 text-xs font-bold text-blue-300 hover:bg-blue-900/40 transition flex items-center gap-1.5"
                        >
                            <span>📤</span>
                            <span>Partager le score</span>
                        </button>
                        <button
                            type="button" onClick={onClose}
                            className="rounded-xl border border-white/15 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
