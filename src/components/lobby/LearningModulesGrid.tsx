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
            <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
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
                                    className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-amber-200"
                                >
                                    {b.icon} {b.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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

            {/* Accès direct Parcours Débutant Interactif (0 connaissance requise : 5 Leçons + Quiz + Bravos) */}
            <Link
                href="/academy#learn-rules"
                prefetch
                data-testid="lobby-beginner-rules-link"
                className="group flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-emerald-950/30 px-3.5 py-2.5 transition hover:border-emerald-400/40 hover:bg-emerald-950/50"
            >
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                        🌱 Débutant · Jamais joué ?
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs font-bold text-slate-100 group-hover:text-white transition truncate">
                        Apprendre les Règles en 5 Étapes Ludiques (Diagrammes, Quiz &amp; Bravos 🎉)
                    </span>
                </div>
                <span className="shrink-0 rounded-lg border border-white/10 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-200 group-hover:border-emerald-400/50 group-hover:text-white transition">
                    Commencer (5 min) →
                </span>
            </Link>

            {/* Barre compacte SEO & Encyclopédie Gammon Academy (/academy) */}
            <Link
                href="/academy"
                prefetch
                data-testid="lobby-academy-hub-link"
                className="group flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-900/40 px-3.5 py-2.5 transition hover:border-white/25 hover:bg-slate-800/60"
            >
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        🏛️ {ui.lobby.academyBannerBadge}
                    </span>
                    <span className="text-slate-600">·</span>
                    <h2 className="text-xs font-bold text-slate-100 group-hover:text-white transition truncate">
                        {ui.lobby.academyBannerTitle}
                    </h2>
                    <span className="hidden md:inline text-xs text-slate-400 truncate">
                        — {ui.lobby.academyBannerDesc}
                    </span>
                </div>
                <span className="shrink-0 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-bold text-slate-200 group-hover:border-white/25 group-hover:text-white transition">
                    {ui.lobby.academyBannerCta}
                </span>
            </Link>
        </section>
    );
};

export const LearningModulesGrid = React.memo(LearningModulesGridComponent);
export default LearningModulesGrid;
