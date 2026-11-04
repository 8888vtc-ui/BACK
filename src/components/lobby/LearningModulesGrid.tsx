'use client';

/**
 * @file src/components/lobby/LearningModulesGrid.tsx
 * @description Grille d'engagement active de l'Académie & Analyse Grand Maître.
 * Transforme les compteurs à 0 en invitations dynamiques (zéro "0%" triste).
 * Strictement 0 `any`, < 180 lignes.
 */

import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import type { LobbyModuleId } from './LobbyScreen';
import type { AcademyProgressSnapshot } from '../../features/progression/userProgressionService';
import ModuleProgressCard from './ModuleProgressCard';
import { useTranslation } from '../../i18n';

export interface LearningModulesGridProps {
    snapshot: AcademyProgressSnapshot;
    onOpenModule?: (moduleId: LobbyModuleId) => void;
    onStartQuickMatch?: () => void;
}

const LearningModulesGridComponent: React.FC<LearningModulesGridProps> = ({
    snapshot,
    onOpenModule,
    onStartQuickMatch,
}) => {
    const { ui } = useTranslation();

    const puzzlePct =
        snapshot.puzzlesTotal > 0 ? Math.round((snapshot.puzzlesSolved / snapshot.puzzlesTotal) * 100) : 0;
    const openingPct =
        snapshot.openingsTotal > 0 ? Math.round((snapshot.openingsMastered / snapshot.openingsTotal) * 100) : 0;
    const drillPct = snapshot.blunderMasteryPct;
    const statsPct =
        snapshot.averagePR !== null ? Math.max(15, Math.min(100, Math.round(100 - snapshot.averagePR * 4))) : 25;

    const handleSelect = (id: LobbyModuleId) => {
        if (id === 'drills' && snapshot.gamesPlayed === 0 && onStartQuickMatch && !onOpenModule) {
            onStartQuickMatch();
            return;
        }
        onOpenModule?.(id);
    };

    return (
        <section aria-label="Académie et progression" data-testid="learning-modules-grid" className="w-full space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                        Académie &amp; Analyse Grand Maître
                    </span>
                    {snapshot.unlockedBadges.length > 0 && (
                        <div data-testid="academy-unlocked-badges" className="flex items-center gap-1.5">
                            {snapshot.unlockedBadges.map((b) => (
                                <span
                                    key={b.id}
                                    className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-bold text-[#F3E5AB]"
                                >
                                    {b.icon} {b.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <ModuleProgressCard
                    id="puzzles"
                    testId="lobby-module-puzzles"
                    icon="puzzle"
                    title={ui.subpages.puzzlesLink}
                    tooltip="Performance Rating (PR) : mesure la précision mathématique de vos coups, plus il est bas, meilleur vous êtes."
                    liveMetricLabel={
                        snapshot.puzzlesSolved === 0
                            ? 'Sélection adaptative N+1 certifiée 3-Ply'
                            : `${snapshot.puzzlesSolved}/${snapshot.puzzlesTotal}${
                                  snapshot.puzzleStreak > 0 ? ` · Série ${snapshot.puzzleStreak}j` : ''
                              }`
                    }
                    progressPct={puzzlePct}
                    primedGaugePct={12}
                    zeroStateLabel="Prêt"
                    actionBadge={snapshot.puzzlesSolved === 0 ? 'Calibrer mon PR →' : 'Résoudre →'}
                    highlightBadge={snapshot.puzzleStreak > 0 ? `Série ${snapshot.puzzleStreak}j` : 'Précision PR'}
                    onSelect={handleSelect}
                />

                <ModuleProgressCard
                    id="drills"
                    testId="lobby-module-drills"
                    icon="flame"
                    title={ui.subpages.drillsLink}
                    tooltip="Error Rate / Performance Rating (ER / PR) : mesure la précision tactique et corrige vos erreurs récurrentes."
                    liveMetricLabel={
                        snapshot.gamesPlayed === 0
                            ? 'Capturés automatiquement en match (3-Ply)'
                            : `${snapshot.blundersToReview} blunder${snapshot.blundersToReview > 1 ? 's' : ''} à revoir`
                    }
                    progressPct={drillPct}
                    primedGaugePct={10}
                    zeroStateLabel="Actif en match"
                    actionBadge={snapshot.gamesPlayed === 0 ? 'Lancer un match →' : 'Corriger →'}
                    highlightBadge={
                        snapshot.gamesPlayed === 0
                            ? 'Catalogue Pro 3-Ply'
                            : `ER / PR · ${snapshot.blundersMastered}/${snapshot.blundersTotal}`
                    }
                    onSelect={handleSelect}
                />

                <ModuleProgressCard
                    id="openings"
                    testId="lobby-module-openings"
                    icon="book"
                    title={ui.navbar.openings}
                    tooltip="Encyclopédie interactive des 15 lancers d'ouverture et théorie 3-Ply."
                    liveMetricLabel={
                        snapshot.openingsMastered === 0
                            ? '15 lancers de départ certifiés Open Sage 3-Ply'
                            : `${snapshot.openingsMastered}/${snapshot.openingsTotal} maîtrisées`
                    }
                    progressPct={openingPct}
                    primedGaugePct={15}
                    zeroStateLabel="15 lancers"
                    actionBadge="Étudier →"
                    highlightBadge="Théorie 3-Ply"
                    onSelect={handleSelect}
                />
            </div>

            <div className="sr-only">
                <ModuleProgressCard
                    id="stats"
                    testId="lobby-module-stats"
                    icon="stats"
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

            <Link
                href="/academy#learn-rules"
                prefetch
                data-testid="lobby-beginner-rules-link"
                className="group flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#10B981]/25 bg-[#0F2922]/40 px-3.5 py-2 transition-all duration-200 hover:border-[#10B981]/50 hover:bg-[#0F2922]/60"
            >
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <Sparkles size={15} strokeWidth={1.5} aria-hidden="true" className="text-[#10B981] shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#34D399]">
                        Nouveau au Backgammon ?
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-xs font-medium text-zinc-200 group-hover:text-white transition truncate">
                        Apprendre les règles en 5 étapes interactives (3 min)
                    </span>
                </div>
                <span className="shrink-0 rounded-lg border border-[#10B981]/30 bg-[#10B981]/15 px-3 py-0.5 text-xs font-semibold text-[#34D399] group-hover:border-[#10B981]/60 group-hover:text-white transition">
                    Découvrir →
                </span>
            </Link>
        </section>
    );
};

export const LearningModulesGrid = React.memo(LearningModulesGridComponent);
export default LearningModulesGrid;
