'use client';

import React from 'react';
import PlayerProfileCard from './PlayerProfileCard';
import LearningModulesGrid from './LearningModulesGrid';
import RecentMatchesSummary from './RecentMatchesSummary';
import type { AcademyProgressSnapshot, RecentMatchEntry } from '../../features/progression/userProgressionService';
import type { LobbyModuleId } from './LobbyScreen';

export interface LobbyPlayerHubSectionProps {
    readonly showOptions: boolean;
    readonly displayName: string | null;
    readonly snapshot: AcademyProgressSnapshot;
    readonly recentMatches: RecentMatchEntry[];
    readonly onOpenModule?: (moduleId: LobbyModuleId) => void;
    readonly onStartQuickMatch: () => void;
}

export const LobbyPlayerHubSection: React.FC<LobbyPlayerHubSectionProps> = ({
    showOptions,
    displayName,
    snapshot,
    recentMatches,
    onOpenModule,
    onStartQuickMatch,
}) => {
    return (
        <section
            aria-label="Espace joueur et progression"
            data-testid="lobby-secondary-section"
            className={showOptions ? 'sr-only' : 'flex w-full flex-col gap-3 pb-2'}
        >
            <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#0B0E14]/90 p-4 backdrop-blur-md shadow-xl">
                <PlayerProfileCard
                    displayName={displayName}
                    eloRating={snapshot.eloRating}
                    averagePR={snapshot.averagePR}
                    gamesPlayed={snapshot.gamesPlayed}
                    winsCount={snapshot.winsCount}
                    puzzleStreak={snapshot.puzzleStreak}
                    onOpenReview={() => onOpenModule?.('stats')}
                />
                <LearningModulesGrid
                    snapshot={snapshot}
                    onOpenModule={onOpenModule}
                    onStartQuickMatch={onStartQuickMatch}
                />
            </div>
            {recentMatches.length > 0 && (
                <RecentMatchesSummary
                    matches={recentMatches}
                    onReviewMatch={() => onOpenModule?.('stats')}
                    onOpenImportExport={() => onOpenModule?.('import_export')}
                />
            )}
        </section>
    );
};

