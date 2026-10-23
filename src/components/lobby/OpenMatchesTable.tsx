'use client';

/**
 * Grille des Défis Ouverts en Direct — Salon Officiel Monte-Carlo (Live Matchmaking Table).
 *
 * Rôle :
 *   Affiche la liste en temps réel des salons créés (via Supabase Realtime Presence
 *   ou liste fournie en prop) avec blason, Galaxy Rating (GR), badge étoilé,
 *   format (Money / 3 / 5 / 7 / 11 pts), cadence (Blitz / Speed / Normal) et bouton « Rejoindre ».
 */

import React, { useEffect, useState, useMemo } from 'react';
import { getGalaxyStarTier } from '../../features/multiplayer/galaxyRating';
import { isSupabaseConfigured, getSupabaseClient } from '../../lib/supabase/client';
import type { LobbyClockPreset } from './LobbyOptionsPanel';

export interface OpenMatchChallenge {
    id: string;
    hostName: string;
    hostAvatar?: string;
    galaxyRating: number;
    averagePR: number;
    matchLength: number;
    clockPreset: LobbyClockPreset;
    createdAt: string;
}

export interface OpenMatchesTableProps {
    /** Liste optionnelle de défis ouverts (prioritaire sur la découverte temps réel). */
    challenges?: ReadonlyArray<OpenMatchChallenge>;
    /** Callback déclenché lorsqu'un joueur clique sur "Rejoindre" un défi. */
    onJoinChallenge?: (challenge: OpenMatchChallenge) => void;
    /** Callback déclenché lorsqu'un joueur souhaite créer son propre défi public. */
    onCreateChallenge?: () => void;
}

const DEFAULT_LIVE_CHALLENGES: ReadonlyArray<OpenMatchChallenge> = [
    {
        id: 'chal-gm-1',
        hostName: 'Mochy_Tokyo',
        hostAvatar: 'JP',
        galaxyRating: 2340,
        averagePR: 2.15,
        matchLength: 7,
        clockPreset: 'normal',
        createdAt: '2026-10-22T21:20:00Z',
    },
    {
        id: 'chal-m-2',
        hostName: 'Sander_Cph',
        hostAvatar: 'DK',
        galaxyRating: 2045,
        averagePR: 3.42,
        matchLength: 5,
        clockPreset: 'speed',
        createdAt: '2026-10-22T21:22:00Z',
    },
    {
        id: 'chal-ex-3',
        hostName: 'Elena_BG',
        hostAvatar: 'FR',
        galaxyRating: 1810,
        averagePR: 4.85,
        matchLength: 3,
        clockPreset: 'blitz',
        createdAt: '2026-10-22T21:24:00Z',
    },
    {
        id: 'chal-ct-4',
        hostName: 'Marcus_NY',
        hostAvatar: 'US',
        galaxyRating: 1620,
        averagePR: 6.1,
        matchLength: 5,
        clockPreset: 'speed',
        createdAt: '2026-10-22T21:25:00Z',
    },
];

const CLOCK_LABELS: Record<LobbyClockPreset, { label: string; detail: string; badgeClass: string }> = {
    blitz: {
        label: '⚡ Blitz',
        detail: '30s + 5s',
        badgeClass: 'border-[#d4af37]/40 bg-[#2b1d0b]/80 text-[#f3c65f]',
    },
    speed: {
        label: '🔥 Speed',
        detail: '1m + 8s',
        badgeClass: 'border-[#d4af37]/40 bg-[#241a0d]/80 text-amber-200',
    },
    normal: {
        label: '⏱️ Normal',
        detail: '2m + 12s',
        badgeClass: 'border-[#d4af37]/30 bg-[#121826]/90 text-slate-200',
    },
    unlimited: {
        label: '∞ Libre',
        detail: 'Sans pendule',
        badgeClass: 'border-white/15 bg-white/5 text-slate-300',
    },
};

const OpenMatchesTableComponent: React.FC<OpenMatchesTableProps> = ({
    challenges,
    onJoinChallenge,
    onCreateChallenge,
}) => {
    const [realtimeChallenges, setRealtimeChallenges] = useState<ReadonlyArray<OpenMatchChallenge>>(
        DEFAULT_LIVE_CHALLENGES,
    );
    const [selectedClockFilter, setSelectedClockFilter] = useState<LobbyClockPreset | 'all'>('all');

    useEffect(() => {
        if (challenges || !isSupabaseConfigured()) return;

        const supabase = getSupabaseClient();
        if (!supabase) return;

        const channel = supabase.channel('galaxy_open_lobby');

        channel
            .on('presence', { event: 'sync' }, () => {
                try {
                    const state = channel.presenceState<OpenMatchChallenge>();
                    const synced: OpenMatchChallenge[] = [];
                    for (const key of Object.keys(state)) {
                        const presences = state[key];
                        if (Array.isArray(presences)) {
                            for (const item of presences) {
                                if (item && item.id && item.hostName) {
                                    synced.push(item);
                                }
                            }
                        }
                    }
                    if (synced.length > 0) {
                        setRealtimeChallenges(synced);
                    }
                } catch {
                    // Repli silencieux sur les salons par défaut
                }
            })
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [challenges]);

    const activeList = challenges ?? realtimeChallenges;

    const filteredChallenges = useMemo(() => {
        if (selectedClockFilter === 'all') return activeList;
        return activeList.filter((c) => c.clockPreset === selectedClockFilter);
    }, [activeList, selectedClockFilter]);

    return (
        <div
            data-testid="open-matches-table"
            className="mt-2.5 w-full rounded-2xl border border-[#d4af37]/45 bg-gradient-to-b from-[#131926]/95 via-[#0d121d]/95 to-[#070a10]/98 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,245,205,0.22)] backdrop-blur-xl space-y-3"
        >
            {/* En-tête + filtres de cadence */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d4af37]/25 pb-2.5">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
                    <h2 className="font-serif text-xs font-extrabold uppercase tracking-[0.18em] text-[#fdf8eb]">
                        Tables Ouvertes · Salon Monte-Carlo ({filteredChallenges.length})
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {(['all', 'blitz', 'speed', 'normal'] as const).map((filter) => {
                        const active = selectedClockFilter === filter;
                        const label =
                            filter === 'all'
                                ? 'Tous'
                                : filter === 'blitz'
                                    ? '⚡ Blitz'
                                    : filter === 'speed'
                                        ? '🔥 Speed'
                                        : '⏱️ Normal';
                        return (
                            <button
                                key={filter}
                                type="button"
                                data-testid={`open-matches-filter-${filter}`}
                                onClick={() => setSelectedClockFilter(filter)}
                                className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ${
                                    active
                                        ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                        : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-[#d4af37]/40 hover:text-white'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}

                    {onCreateChallenge && (
                        <button
                            type="button"
                            data-testid="create-open-match-btn"
                            onClick={onCreateChallenge}
                            className="ml-1 rounded-lg border border-[#f3c65f]/70 bg-gradient-to-b from-[#3a2a10] to-[#1e1507] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#f3c65f] hover:border-[#fff3c4] hover:text-white transition"
                        >
                            + Ouvrir une Table
                        </button>
                    )}
                </div>
            </div>

            {/* Liste des défis ouverts */}
            {filteredChallenges.length === 0 ? (
                <div
                    data-testid="open-matches-empty"
                    className="py-6 text-center text-xs text-slate-400"
                >
                    Aucune table ouverte pour cette cadence. Ouvrez une table pour lancer l&apos;invitation !
                </div>
            ) : (
                <div className="divide-y divide-[#d4af37]/15">
                    {filteredChallenges.map((item) => {
                        const tier = getGalaxyStarTier(item.galaxyRating);
                        const clock = CLOCK_LABELS[item.clockPreset] || CLOCK_LABELS.normal;
                        const formatLabel = item.matchLength === 0 ? 'Money' : `${item.matchLength} pts`;

                        return (
                            <div
                                key={item.id}
                                data-testid={`open-match-row-${item.id}`}
                                className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-2.5 hover:bg-[#182032]/60 rounded-xl transition"
                            >
                                {/* Joueur + Rating GR */}
                                <div className="flex items-center gap-2.5 min-w-[175px]">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d4af37]/50 bg-gradient-to-b from-[#261c0e] to-[#0e0a05] font-serif text-[10px] font-black tracking-wider text-[#f3c65f] shadow-inner">
                                        {item.hostAvatar || 'MC'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-serif text-xs font-bold text-[#fdf8eb]">
                                                {item.hostName}
                                            </span>
                                            <span
                                                title={tier.title}
                                                className="rounded border border-[#d4af37]/30 bg-black/40 px-1.5 py-0.5 font-mono text-[9px] font-extrabold text-[#f3c65f]"
                                            >
                                                ★ {item.galaxyRating} ELO
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                            PR moy. <span className="text-amber-200/90 font-semibold">{item.averagePR.toFixed(2)}</span> · {tier.title}
                                        </div>
                                    </div>
                                </div>

                                {/* Format + Cadence */}
                                <div className="flex items-center gap-2">
                                    <span className="rounded-lg border border-[#d4af37]/45 bg-[#241a0d]/80 px-2.5 py-0.5 font-mono text-[10px] font-extrabold text-[#f3c65f]">
                                        {formatLabel}
                                    </span>
                                    <span
                                        className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-bold ${clock.badgeClass}`}
                                        title={clock.detail}
                                    >
                                        {clock.label} ({clock.detail})
                                    </span>
                                </div>

                                {/* Action Rejoindre en Or Brossé */}
                                <button
                                    type="button"
                                    data-testid={`join-open-match-${item.id}`}
                                    onClick={() => onJoinChallenge?.(item)}
                                    className="rounded-xl border border-[#fef08a]/75 bg-gradient-to-b from-[#fff5cf] via-[#f0c75e] to-[#b87e14] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#1c1004] shadow-[0_4px_12px_rgba(212,175,55,0.35),inset_0_1px_0_rgba(255,255,255,0.8)] hover:brightness-105 active:scale-95 transition"
                                >
                                    Rejoindre
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const OpenMatchesTable = React.memo(OpenMatchesTableComponent);
export default OpenMatchesTable;
