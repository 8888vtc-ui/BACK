'use client';

/**
 * MatchBlunderReport — Rapport Complet de Fin de Match ("Grandmaster Match Review & Blunder Report") (< 300 lignes, 0 any).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { parseDiagramMoveNotation } from '../board/MiniBoardDiagram';
import { useCoachVoice } from '../../hooks/useCoachVoice';
import type { CompleteGameAnalysis } from '../../features/rating/types';
import SoftPaywallCard from '../subscription/SoftPaywallCard';
import {
    FREE_DAILY_ANALYSES_LIMIT,
    formatQuotaBadgeEn,
    formatQuotaBadgeFr,
    loadGuestQuota,
} from '../../lib/subscription/quotaService';
import {
    buildMatchSummaryPayload,
    classifyAllMatchMoves,
    classifyMoveByEquityLoss,
    computeMatchAccuracy,
    extractMajorBlunders,
    identifyRecurringThemes,
    REPORT_CATEGORY_META,
    type MajorBlunder,
} from './postMatchReportHelpers';
import { usePostMatchAiStream } from './usePostMatchAiStream';
import { BlunderReviewCard } from './BlunderReviewCard';
import { CoachThreePillarsSection } from './CoachThreePillarsSection';
import { MatchBlunderBanner } from './MatchBlunderBanner';

export interface MatchBlunderReportProps {
    analysis: CompleteGameAnalysis | null;
    opponentPr?: number | null;
    matchDurationSeconds?: number;
    isOffline?: boolean;
    apiUrl?: string;
    locale?: string;
    onTrainBlunders?: () => void;
    isQuotaReached?: boolean;
    quotaUsedCount?: number;
    isVip?: boolean;
    userId?: string | null;
    hideSummaryBanner?: boolean;
}

const MatchBlunderReportComponent: React.FC<MatchBlunderReportProps> = ({
    analysis, opponentPr = null, matchDurationSeconds, isOffline = false, apiUrl = '/api/coach',
    locale = 'fr', onTrainBlunders, isQuotaReached, quotaUsedCount, isVip = false, userId = null, hideSummaryBanner = false,
}) => {
    const isEn = Boolean(locale && locale !== 'fr');
    const player = analysis?.player ?? 'X';

    const guestQuota = loadGuestQuota();
    const resolvedUsedCount = quotaUsedCount ?? (guestQuota.dailyAnalysesCount > 0 ? guestQuota.dailyAnalysesCount : 1);
    const isGameAlreadyUnlocked = Boolean(analysis?.gameId && (guestQuota.consumedGameIds ?? []).includes(analysis.gameId));
    const effectiveIsQuotaReached =
        !isVip &&
        (isQuotaReached !== undefined
            ? isQuotaReached
            : quotaUsedCount !== undefined
              ? quotaUsedCount > FREE_DAILY_ANALYSES_LIMIT
              : guestQuota.dailyAnalysesCount >= FREE_DAILY_ANALYSES_LIMIT && !isGameAlreadyUnlocked);

    const quotaBadgeLabel = isEn
        ? formatQuotaBadgeEn(resolvedUsedCount, FREE_DAILY_ANALYSES_LIMIT, isVip)
        : formatQuotaBadgeFr(resolvedUsedCount, FREE_DAILY_ANALYSES_LIMIT, isVip);

    const { isVoiceActive, toggleVoiceCoach, speakExplanation, stopVoice } = useCoachVoice();
    const [viewLayout, setViewLayout] = useState<'carousel' | 'accordion'>('carousel');
    const [activeBlunderIdx, setActiveBlunderIdx] = useState<number>(0);
    const [replayIndex, setReplayIndex] = useState<number | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const [clickedPoints, setClickedPoints] = useState<number[]>([]);

    const blunders = useMemo(() => extractMajorBlunders(analysis?.evaluatedMoves, player, 8), [analysis?.evaluatedMoves, player]);
    const reportBreakdown = useMemo(() => classifyAllMatchMoves(analysis?.evaluatedMoves, player), [analysis?.evaluatedMoves, player]);
    const accuracyPct = useMemo(() => computeMatchAccuracy(analysis, player), [analysis, player]);
    const recurringThemes = useMemo(() => identifyRecurringThemes(blunders, analysis, locale), [blunders, analysis, locale]);
    const summaryPayload = useMemo(
        () => buildMatchSummaryPayload({ analysis, blunders: blunders.slice(0, 3), opponentPerformanceRating: opponentPr, matchDurationSeconds }),
        [analysis, blunders, opponentPr, matchDurationSeconds],
    );

    const { aiSynthesis, synthesisSource } = usePostMatchAiStream({
        summaryPayload, apiUrl, isOffline, effectiveIsQuotaReached, locale,
    });

    useEffect(() => {
        if (!isVoiceActive) return;
        const current = blunders[activeBlunderIdx];
        if (current && current.diagnostic) {
            speakExplanation(`${current.diagnostic} ${current.keyConcept ?? ''}`, locale, false);
        }
    }, [activeBlunderIdx, blunders, isVoiceActive, locale, speakExplanation]);

    useEffect(() => {
        if (viewLayout !== 'carousel' || blunders.length <= 1) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'ArrowLeft') {
                setActiveBlunderIdx((i) => Math.max(0, i - 1));
                setReplayIndex(null);
            } else if (e.key === 'ArrowRight') {
                setActiveBlunderIdx((i) => Math.min(blunders.length - 1, i + 1));
                setReplayIndex(null);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [blunders.length, viewLayout]);

    const handleStartReplay = useCallback((idx: number) => {
        setReplayIndex((prev) => (prev === idx ? null : idx));
        setSelectedCandidate(null);
        setClickedPoints([]);
    }, []);

    const handlePointClickInPuzzle = useCallback((point: number, blunder: MajorBlunder) => {
        setClickedPoints((prev) => {
            const next = prev.includes(point) ? prev : [...prev, point];
            const optimalArrows = parseDiagramMoveNotation(blunder.optimalNotation, blunder.player ?? 'X');
            if (optimalArrows.some((a) => next.includes(a.from) && next.includes(a.to))) {
                setSelectedCandidate(blunder.optimalNotation);
            }
            return next;
        });
    }, []);

    const playerPr = analysis?.performanceRating ?? 0;
    const playerCategory = analysis?.prCategory ?? (isEn ? 'Intermediate' : 'Intermédiaire');

    const renderCard = (b: MajorBlunder, idx: number) => (
        <BlunderReviewCard
            key={`blunder-card-${b.turnNumber}-${idx}`}
            blunder={b} idx={idx} player={player}
            isReplaying={replayIndex === idx} selectedCandidate={selectedCandidate}
            clickedPoints={clickedPoints} isVoiceActive={isVoiceActive} locale={locale}
            onStartReplay={handleStartReplay} onSelectCandidate={setSelectedCandidate}
            onPointClick={handlePointClickInPuzzle}
            onSpeak={(text) => speakExplanation(text, locale, true)}
            onToggleAutoVoice={() => { if (!toggleVoiceCoach()) stopVoice(); }}
        />
    );

    return (
        <div data-testid="match-blunder-report" className="space-y-4 text-[#fdf8eb]">
            {!hideSummaryBanner && (
                <MatchBlunderBanner
                    playerCategory={playerCategory} playerPr={playerPr} quotaBadgeLabel={quotaBadgeLabel}
                    opponentPr={opponentPr} accuracyPct={accuracyPct} reportBreakdown={reportBreakdown} locale={locale}
                />
            )}

            {effectiveIsQuotaReached ? (
                <SoftPaywallCard analysis={analysis} userId={userId} locale={locale} />
            ) : (
                <>
                    <section
                        data-testid="match-blunders-key-moments"
                        aria-label={isEn ? 'Key Moments and Blunders' : 'Moments Clés et Gaffes'}
                        className="rounded-2xl border border-white/10 bg-[#140b06]/90 p-4 space-y-3"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                                <span aria-hidden="true" className="text-base">🔍</span>
                                <h3 className="font-serif text-xs font-black uppercase tracking-wider text-[#fce8b2] sm:text-sm">
                                    {isEn ? `Key Moments & Blunders (${blunders.length})` : `Moments Clés & Gaffes (${blunders.length})`}
                                </h3>
                            </div>

                            {blunders.length > 0 && (
                                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#0d0704] p-0.5 text-[10px] font-bold">
                                    <button
                                        type="button" onClick={() => setViewLayout('carousel')} data-testid="layout-carousel-btn"
                                        className={`rounded-lg px-2.5 py-1 transition ${viewLayout === 'carousel' ? 'bg-[#d4af37] text-[#1a0f07]' : 'text-[#e8dcc6]/75 hover:text-white'}`}
                                    >
                                        {isEn ? 'Carousel' : 'Carrousel'}
                                    </button>
                                    <button
                                        type="button" onClick={() => setViewLayout('accordion')} data-testid="layout-accordion-btn"
                                        className={`rounded-lg px-2.5 py-1 transition ${viewLayout === 'accordion' ? 'bg-[#d4af37] text-[#1a0f07]' : 'text-[#e8dcc6]/75 hover:text-white'}`}
                                    >
                                        {isEn ? 'Accordion List' : 'Liste Accordéon'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {blunders.length === 0 ? (
                            <div
                                data-testid="match-report-zero-blunders"
                                className="rounded-xl border border-emerald-600/40 bg-emerald-950/30 p-4 text-center text-xs text-emerald-200"
                            >
                                🟢 {isEn
                                    ? 'Zero inaccuracies or blunders (ΔEq < 0.020 on every turn). Grandmaster precision!'
                                    : 'Aucune imprécision ni gaffe majeure (ΔEq < 0.020 sur chaque tour). Précision de Grand-Maître !'}
                            </div>
                        ) : viewLayout === 'carousel' ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        type="button" disabled={activeBlunderIdx === 0}
                                        onClick={() => { setActiveBlunderIdx((i) => Math.max(0, i - 1)); setReplayIndex(null); }}
                                        data-testid="blunder-carousel-prev"
                                        className="rounded-xl border border-white/10 bg-[#1e120a] px-3 py-1.5 text-xs font-bold text-[#fce8b2] transition hover:border-[#f3c65f] disabled:opacity-35"
                                    >
                                        ← {isEn ? 'Prev' : 'Préc.'}
                                    </button>

                                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                                        {blunders.map((b, idx) => (
                                            <button
                                                key={`dot-${b.turnNumber}-${idx}`} type="button"
                                                onClick={() => { setActiveBlunderIdx(idx); setReplayIndex(null); }}
                                                data-testid={`blunder-carousel-dot-${idx}`}
                                                className={`rounded-lg border px-2 py-0.5 font-mono text-[10px] font-bold transition ${
                                                    idx === activeBlunderIdx ? 'border-[#f3c65f] bg-[#d4af37] text-[#1a0f07]' : 'border-white/10 bg-[#1c1008] text-[#e8dcc6]/75 hover:border-[#d4af37]'
                                                }`}
                                            >
                                                #{b.turnNumber} (-{b.equityLoss.toFixed(2)})
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        type="button" disabled={activeBlunderIdx >= blunders.length - 1}
                                        onClick={() => { setActiveBlunderIdx((i) => Math.min(blunders.length - 1, i + 1)); setReplayIndex(null); }}
                                        data-testid="blunder-carousel-next"
                                        className="rounded-xl border border-white/10 bg-[#1e120a] px-3 py-1.5 text-xs font-bold text-[#fce8b2] transition hover:border-[#f3c65f] disabled:opacity-35"
                                    >
                                        {isEn ? 'Next' : 'Suiv.'} →
                                    </button>
                                </div>

                                {renderCard(blunders[activeBlunderIdx] ?? blunders[0], activeBlunderIdx)}
                            </div>
                        ) : (
                            <div className="space-y-2.5" data-testid="blunder-accordion-list">
                                {blunders.map((b, idx) => {
                                    const isOpen = activeBlunderIdx === idx;
                                    const cat = b.category ?? classifyMoveByEquityLoss(b.equityLoss, b.cubeEquityLoss);
                                    const meta = REPORT_CATEGORY_META[cat];
                                    return (
                                        <div key={`acc-${b.turnNumber}-${idx}`} className="rounded-2xl border border-white/10 bg-[#180e08] overflow-hidden">
                                            <button
                                                type="button" onClick={() => setActiveBlunderIdx(idx)}
                                                data-testid={`blunder-accordion-header-${idx}`} aria-expanded={isOpen}
                                                className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-xs font-bold hover:bg-[#22140b] transition"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span>{meta.icon}</span>
                                                    <span className="font-mono text-[#f3c65f]">
                                                        {isEn ? 'Turn' : 'Tour'} #{b.turnNumber} [{b.dice[0]}-{b.dice[1]}]
                                                    </span>
                                                    <span className="font-mono text-rose-300">{b.playedNotation}</span>
                                                    <span className="text-[#e8dcc6]/50">➔</span>
                                                    <span className="font-mono text-emerald-300">{b.optimalNotation}</span>
                                                </span>
                                                <span className="font-mono text-xs font-black text-rose-300">
                                                    -{b.equityLoss.toFixed(3)} Eq {isOpen ? '▲' : '▼'}
                                                </span>
                                            </button>
                                            {isOpen && <div className="p-2.5 pt-0">{renderCard(b, idx)}</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <CoachThreePillarsSection
                        aiSynthesis={aiSynthesis}
                        synthesisSource={synthesisSource}
                        recurringThemes={recurringThemes}
                        locale={locale}
                        onTrainBlunders={onTrainBlunders}
                    />
                </>
            )}
        </div>
    );
};

export const MatchBlunderReport = React.memo(MatchBlunderReportComponent);
export default MatchBlunderReport;
