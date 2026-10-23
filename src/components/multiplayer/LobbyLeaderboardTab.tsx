'use client';

import React from 'react';

export interface LeaderboardEntry {
    rank: number;
    displayName: string;
    rating: number;
    winRate: number;
    tierBadge: string;
    tierTitle: string;
    isLocalUser?: boolean;
}

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, displayName: 'Elena Rostova', rating: 2284, winRate: 78, tierBadge: '👑', tierTitle: 'Légende' },
    { rank: 2, displayName: 'Alexandre_Paris', rating: 2190, winRate: 74, tierBadge: '👑', tierTitle: 'Légende' },
    { rank: 3, displayName: 'Julien B. (Master)', rating: 2045, winRate: 70, tierBadge: '💎', tierTitle: 'Grand-Maître' },
    { rank: 4, displayName: 'Nadia M.', rating: 1980, winRate: 67, tierBadge: '💎', tierTitle: 'Grand-Maître' },
    { rank: 5, displayName: 'Marc_Backgammon', rating: 1870, winRate: 64, tierBadge: '⚔️', tierTitle: 'Maître' },
    { rank: 6, displayName: 'Sophie_L', rating: 1795, winRate: 62, tierBadge: '⚔️', tierTitle: 'Maître' },
    { rank: 7, displayName: 'Karim_T', rating: 1720, winRate: 59, tierBadge: '⚔️', tierTitle: 'Maître' },
    { rank: 8, displayName: 'Luc_Tournament', rating: 1650, winRate: 55, tierBadge: '🎯', tierTitle: 'Compétiteur' },
];

export const LobbyLeaderboardTab: React.FC = () => {
    return (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1" data-testid="leaderboard-tab">
            {MOCK_LEADERBOARD.map((player) => (
                <div
                    key={player.rank}
                    className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-800/30 px-3.5 py-2 text-xs"
                >
                    <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-slate-400 w-5">
                            #{player.rank}
                        </span>
                        <div>
                            <div className="font-bold text-white">
                                {player.displayName}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <span>{player.tierBadge}</span>
                                <span>{player.tierTitle}</span>
                                <span>•</span>
                                <span>{player.winRate}% victoires</span>
                            </div>
                        </div>
                    </div>

                    <div className="font-mono font-bold text-amber-400">
                        {player.rating} Elo
                    </div>
                </div>
            ))}
        </div>
    );
};
