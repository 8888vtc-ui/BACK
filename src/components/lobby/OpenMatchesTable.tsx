'use client';

/**
 * @file src/components/lobby/OpenMatchesTable.tsx
 * @description Panneau Central "Jouer en Ligne" — Direction Artistique Cercle Monte-Carlo & Linear.
 * Strictement 0 `any`, <= 260 lignes (GOVERNANCE.md & SCALABILITY.md).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Coffee, Coins, Link2, Swords, Zap, type LucideIcon } from 'lucide-react';
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
    challenges?: ReadonlyArray<OpenMatchChallenge>;
    onJoinChallenge?: (challenge: OpenMatchChallenge) => void;
    onCreateChallenge?: () => void;
    onStartCalibrationMatch?: () => void;
    onSwitchToAiMasters?: () => void;
    matchLength?: number;
    onSelectMatchLength?: (pts: number) => void;
    clockPreset?: LobbyClockPreset;
    onSelectClockPreset?: (preset: LobbyClockPreset) => void;
    eloRating?: number;
    averagePR?: number | null;
    gamesPlayed?: number;
}

const ACTIVE_CLS =
    'border-[#D4AF37]/60 bg-[#D4AF37]/10 text-[#F3E5AB] shadow-[0_0_20px_rgba(212,175,55,0.12)]';
const IDLE_CLS =
    'border-white/[0.05] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200';

const WBGF_CADENCES: ReadonlyArray<{
    readonly id: LobbyClockPreset;
    readonly pillLabel: string;
    readonly shortName: string;
    readonly Icon: LucideIcon;
}> = [
    { id: 'blitz', pillLabel: 'Blitz (20s + 10s)', shortName: 'Blitz', Icon: Zap },
    { id: 'normal', pillLabel: 'Standard (2m + 12s)', shortName: 'Standard', Icon: Clock },
    { id: 'unlimited', pillLabel: 'Détente (Sans pendule)', shortName: 'Détente', Icon: Coffee },
];

function generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const arr = new Uint8Array(4);
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
        window.crypto.getRandomValues(arr);
    } else {
        arr.set([7, 14, 21, 28]);
    }
    return `BG-${Array.from(arr, (b) => chars[b % chars.length]).join('')}`;
}

const OpenMatchesTableComponent: React.FC<OpenMatchesTableProps> = ({
    challenges,
    onJoinChallenge,
    onCreateChallenge,
    onStartCalibrationMatch,
    matchLength = 7,
    onSelectMatchLength,
    clockPreset = 'normal',
    onSelectClockPreset,
    eloRating = 1500,
}) => {
    const [isSearchingHuman, setIsSearchingHuman] = useState(false);
    const [searchSeconds, setSearchSeconds] = useState(0);
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [copiedInvite, setCopiedInvite] = useState(false);

    useEffect(() => {
        if (!isSearchingHuman) {
            setSearchSeconds(0);
            return;
        }
        const timer = window.setInterval(() => setSearchSeconds((s) => s + 1), 1000);
        return () => window.clearInterval(timer);
    }, [isSearchingHuman]);

    const handleFindOpponentClick = useCallback(() => {
        setIsSearchingHuman(true);
        onCreateChallenge?.();
    }, [onCreateChallenge]);

    const handleGenerateFriendLink = useCallback(() => {
        const code = generateRoomCode();
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://backgammontour.com';
        const url = `${origin}/?join=${code}&matchLength=${matchLength}`;
        setInviteUrl(url);
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            void navigator.clipboard
                .writeText(url)
                .then(() => {
                    setCopiedInvite(true);
                    window.setTimeout(() => setCopiedInvite(false), 3000);
                })
                .catch(() => {});
        }
        onCreateChallenge?.();
    }, [matchLength, onCreateChallenge]);

    const activeCadenceShort = WBGF_CADENCES.find((c) => c.id === clockPreset)?.shortName ?? 'Standard';
    const dynamicSubtitle =
        matchLength === 0 ? `Money Game • ${activeCadenceShort}` : `Match ${matchLength} pts • ${activeCadenceShort}`;

    return (
        <div data-testid="open-matches-table" className="w-full space-y-3">
            {/* A. Sélecteur rapide Format & Cadence (Isolation chromatique Linear) */}
            <div className="flex flex-col gap-2.5 rounded-2xl border border-white/[0.06] bg-[#0B0E14]/90 p-3.5 backdrop-blur-md">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="group" aria-label="Format de la partie">
                    {[3, 5, 7, 11].map((pts) => {
                        const active = matchLength === pts;
                        return (
                            <button
                                key={pts}
                                type="button"
                                data-testid={`online-format-${pts}`}
                                aria-pressed={active}
                                onClick={() => onSelectMatchLength?.(pts)}
                                className={`rounded-xl border px-3 py-2 font-mono text-xs sm:text-sm font-bold transition-all duration-150 ${active ? ACTIVE_CLS : IDLE_CLS}`}
                            >
                                {pts} pts
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        data-testid="online-format-money"
                        aria-pressed={matchLength === 0}
                        onClick={() => onSelectMatchLength?.(0)}
                        className={`col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm font-bold transition-all duration-150 ${matchLength === 0 ? ACTIVE_CLS : IDLE_CLS}`}
                    >
                        <Coins size={16} strokeWidth={1.5} aria-hidden="true" className={matchLength === 0 ? 'text-[#D4AF37]' : 'text-zinc-500'} />
                        Money Game
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="group" aria-label="Cadence de jeu">
                    {WBGF_CADENCES.map((c) => {
                        const active = clockPreset === c.id;
                        return (
                            <button
                                key={c.id}
                                type="button"
                                data-testid={`online-cadence-${c.id}`}
                                aria-pressed={active}
                                onClick={() => onSelectClockPreset?.(c.id)}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-center text-xs sm:text-sm font-bold transition-all duration-150 ${active ? ACTIVE_CLS : IDLE_CLS}`}
                            >
                                <c.Icon size={16} strokeWidth={1.5} aria-hidden="true" className={active ? 'text-[#D4AF37]' : 'text-zinc-500'} />
                                {c.pillLabel}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* B. Les 2 boutons d'action principaux (Or Horloger & Malachite) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div data-testid="open-matches-quick-matchmaking" className="flex flex-col gap-2">
                    <button
                        type="button"
                        data-testid="quick-matchmaking-btn"
                        onClick={handleFindOpponentClick}
                        className="w-full rounded-2xl border border-[#E6C665]/50 bg-gradient-to-b from-[#E6C665] via-[#D4AF37] to-[#B89225] px-5 py-3 text-center text-[#050505] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_25px_-4px_rgba(212,175,55,0.35)] hover:brightness-105 active:scale-[0.99] transition-all duration-200 flex flex-col items-center justify-center gap-0.5"
                    >
                        <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#050505]">
                            <Swords size={18} strokeWidth={1.5} aria-hidden="true" />
                            TROUVER UN ADVERSAIRE
                        </span>
                        <span className="text-xs font-medium text-[#050505]/75">{dynamicSubtitle}</span>
                    </button>
                    {isSearchingHuman && searchSeconds >= 10 && onStartCalibrationMatch && (
                        <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                            <span>Aucun joueur en {searchSeconds}s ?</span>
                            <button
                                type="button"
                                data-testid="online-fallback-bot-btn"
                                onClick={onStartCalibrationMatch}
                                className="rounded-lg bg-[#D4AF37] px-2.5 py-1 text-xs font-black text-[#050505] hover:brightness-110"
                            >
                                Jouer contre Bot ({eloRating} Elo) →
                            </button>
                        </div>
                    )}
                </div>

                <div data-testid="open-matches-private-code" className="flex flex-col gap-2">
                    <button
                        type="button"
                        data-testid="create-open-match-btn"
                        onClick={handleGenerateFriendLink}
                        className="w-full rounded-2xl border border-[#10B981]/30 bg-gradient-to-b from-[#0F2922] to-[#091915] px-5 py-3 text-center text-white hover:border-[#10B981]/60 active:scale-[0.99] transition-all duration-200 flex flex-col items-center justify-center gap-0.5"
                    >
                        <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
                            <Link2 size={18} strokeWidth={1.5} aria-hidden="true" className="text-[#34D399]" />
                            INVITER UN AMI — LIEN 1-CLIC
                        </span>
                        <span className="text-xs text-[#34D399]">{'Sans création de compte • Accès < 3s'}</span>
                    </button>
                    {inviteUrl && (
                        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-400/30 bg-emerald-950/50 px-3 py-1.5 text-xs text-emerald-200">
                            <span className="truncate font-mono">{inviteUrl}</span>
                            <span className="shrink-0 font-bold text-emerald-300">{copiedInvite ? '✓ Copié' : 'Prêt'}</span>
                        </div>
                    )}
                </div>
            </div>

            {challenges && challenges.length > 0 && (
                <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-[#0B0E14]/90">
                    {challenges.map((item) => (
                        <div key={item.id} data-testid={`open-match-row-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 p-3">
                            <div className="flex items-center gap-2.5">
                                <span className="text-xs font-bold text-white">{item.hostName}</span>
                                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300">
                                    {item.galaxyRating} Elo
                                </span>
                                <span className="font-mono text-xs text-slate-300">
                                    {item.matchLength === 0 ? 'Money Game' : `${item.matchLength} pts`}
                                </span>
                            </div>
                            <button
                                type="button"
                                data-testid={`join-open-match-${item.id}`}
                                onClick={() => onJoinChallenge?.(item)}
                                className="rounded-xl border border-white/10 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white hover:border-white/25 hover:bg-white/15 transition"
                            >
                                Rejoindre
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const OpenMatchesTable = React.memo(OpenMatchesTableComponent);
export default OpenMatchesTable;
