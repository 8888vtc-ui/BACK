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
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300/90">
                        Académie &amp; Analyse Grand Maître
                    </span>
                    {snapshot.unlockedBadges.length > 0 && (
                        <div
                            data-testid="academy-unlocked-badges"
                            className="flex items-center gap-1.5"
                        >
                            {snapshot.unlockedBadges.map((b) => (
                                <span
                                    key={b.id}
                                    className="rounded-full border border-white/10 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-200"
                                >
                                    {b.icon} {b.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
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
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0c111d]/85 px-4 py-3 shadow-md transition hover:border-white/25 hover:bg-[#121828]/90"
            >
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#f3c65f]">
                            🏛️ {ui.lobby.academyBannerBadge}
                        </span>
                        <span className="text-slate-500">·</span>
                        <h2 className="font-serif text-sm font-bold text-[#fdf8eb] group-hover:text-amber-200 transition">
                            {ui.lobby.academyBannerTitle}
                        </h2>
                    </div>
                    <p className="text-xs text-slate-300/90 leading-relaxed">
                        {ui.lobby.academyBannerDesc}
                    </p>
                </div>
                <span className="shrink-0 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-bold text-amber-100 group-hover:border-white/25 group-hover:text-white transition">
                    {ui.lobby.academyBannerCta}
                </span>
            </Link>
        </section>
    );
};

export const LearningModulesGrid = React.memo(LearningModulesGridComponent);
export default LearningModulesGrid;
