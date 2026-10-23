'use client';

/**
 * Grille Gamifiée de l'Académie & Bannière SEO Hub Gammon Academy (LearningModulesGrid).
 *
 * Rôle :
 *   Connecte les 4 modules (`Puzzles`, `Ouvertures`, `Drills`, `Stats & PR`) à la
 *   progression réelle de l'utilisateur (`AcademyProgressSnapshot`) et expose l'accès
 *   direct à l'encyclopédie stratégique `/academy` (Gammon Academy).
 *   Strictement 0 `any`, < 300 lignes.
 */

import React from 'react';
import Link from 'next/link';
import type { LobbyModuleId } from './LobbyScreen';
import type { AcademyProgressSnapshot } from '../../features/progression/userProgressionService';
import ModuleProgressCard from './ModuleProgressCard';
import { useTranslation } from '../../i18n';

export interface LearningModulesGridProps {
    snapshot: AcademyProgressSnapshot;
    onOpenModule?: (moduleId: LobbyModuleId) => void;
}

const LearningModulesGridComponent: React.FC<LearningModulesGridProps> = ({
    snapshot,
    onOpenModule,
}) => {
    const { ui } = useTranslation();

    const puzzlePct =
        snapshot.puzzlesTotal > 0
            ? Math.round((snapshot.puzzlesSolved / snapshot.puzzlesTotal) * 100)
            : 0;
    const openingPct =
        snapshot.openingsTotal > 0
            ? Math.round((snapshot.openingsMastered / snapshot.openingsTotal) * 100)
            : 0;
    const drillPct = snapshot.blunderMasteryPct;
    const statsPct = snapshot.averagePR !== null ? Math.max(15, Math.min(100, Math.round(100 - snapshot.averagePR * 4))) : 25;

    const handleSelect = (id: LobbyModuleId) => {
        onOpenModule?.(id);
    };

    return (
        <section
            aria-label="Académie et progression"
            data-testid="learning-modules-grid"
            className="w-full pt-1 space-y-3"
        >
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/90">
                        Académie &amp; Analyse Grand Maître
                    </span>
                    {snapshot.unlockedBadges.length > 0 && (
                        <div
                            data-testid="academy-unlocked-badges"
                            className="flex items-center gap-1"
                        >
                            {snapshot.unlockedBadges.map((b) => (
                                <span
                                    key={b.id}
                                    className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-200"
                                >
                                    {b.icon} {b.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <span className="text-[10px] text-slate-400">
                    Open Sage 3-Ply · Bear-Off Exact
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <ModuleProgressCard
                    id="puzzles"
                    testId="lobby-module-puzzles"
                    icon="🧩"
                    title={ui.subpages.puzzlesLink}
                    liveMetricLabel={`${snapshot.puzzlesSolved}/${snapshot.puzzlesTotal}${
                        snapshot.puzzleStreak > 0 ? ` · ${snapshot.puzzleStreak}j 🔥` : ''
                    }`}
                    progressPct={puzzlePct}
                    actionBadge={snapshot.puzzlesSolved > 0 ? 'Continuer' : "S'entraîner"}
                    highlightBadge={snapshot.puzzleStreak > 0 ? `🔥 ${snapshot.puzzleStreak}j` : 'Tactique'}
                    onSelect={handleSelect}
                />

                <ModuleProgressCard
                    id="openings"
                    testId="lobby-module-openings"
                    icon="📖"
                    title={ui.navbar.openings}
                    liveMetricLabel={`${snapshot.openingsMastered}/${snapshot.openingsTotal}`}
                    progressPct={openingPct}
                    actionBadge={snapshot.openingsMastered > 0 ? 'Continuer' : "S'entraîner"}
                    highlightBadge="Théorie XG"
                    onSelect={handleSelect}
                />

                <ModuleProgressCard
                    id="drills"
                    testId="lobby-module-drills"
                    icon="🎯"
                    title={ui.subpages.drillsLink}
                    liveMetricLabel={`${snapshot.blundersToReview} blunder${
                        snapshot.blundersToReview > 1 ? 's' : ''
                    }`}
                    progressPct={drillPct}
                    actionBadge="S'entraîner"
                    highlightBadge={`${snapshot.blundersMastered}/${snapshot.blundersTotal}`}
                    onSelect={handleSelect}
                />

                <ModuleProgressCard
                    id="stats"
                    testId="lobby-module-stats"
                    icon="📊"
                    title={ui.subpages.progressionLink}
                    liveMetricLabel={
                        snapshot.averagePR !== null
                            ? `PR : ${snapshot.averagePR.toFixed(2)}`
                            : `${snapshot.gamesPlayed} match${snapshot.gamesPlayed > 1 ? 's' : ''}`
                    }
                    progressPct={statsPct}
                    actionBadge="Analyser"
                    highlightBadge={`ELO ${snapshot.eloRating}`}
                    onSelect={handleSelect}
                />
            </div>

            {/* Bannière SEO & Encyclopédie Gammon Academy (/academy) */}
            <Link
                href="/academy"
                prefetch
                data-testid="lobby-academy-hub-link"
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-[#d4af37]/40 bg-gradient-to-r from-[#1d160b]/95 via-[#0f1422]/95 to-[#171209]/95 px-4 py-3.5 shadow-[0_10px_28px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,245,205,0.18)] transition hover:border-[#f3c65f] hover:shadow-[0_12px_32px_rgba(212,175,55,0.2)]"
            >
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="rounded-full border border-[#d4af37]/45 bg-black/50 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#f3c65f]">
                            🏛️ {ui.lobby.academyBannerBadge}
                        </span>
                    </div>
                    <h2 className="font-serif text-sm font-bold text-[#fdf8eb] group-hover:text-amber-200 transition">
                        {ui.lobby.academyBannerTitle}
                    </h2>
                    <p className="text-[11px] text-slate-300/90 leading-relaxed">
                        {ui.lobby.academyBannerDesc}
                    </p>
                </div>
                <span className="shrink-0 rounded-full border border-[#f3c65f]/65 bg-gradient-to-b from-[#3b2b12] to-[#1a1206] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-[#fff6d6] shadow-md group-hover:scale-105 transition">
                    {ui.lobby.academyBannerCta}
                </span>
            </Link>
        </section>
    );
};

export const LearningModulesGrid = React.memo(LearningModulesGridComponent);
export default LearningModulesGrid;
