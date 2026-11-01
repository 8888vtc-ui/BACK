'use client';

/**
 * @file src/components/lobby/OpenMatchesTable.tsx
 * @description Panneau Central "Jouer en Ligne" (Zero-Friction & Visibilité Immédiate < 2s)
 * — Direction Artistique Cercle Monte-Carlo (#050505, #12151C, Or #D4AF37).
 *
 * Contient :
 * - A. Sélecteur rapide ultra-lisible de format (`3 pts`, `5 pts`, `7 pts`, `11 pts`, `💰 Money Game`)
 *      et de cadence (`⚡ Blitz (20s + 10s)`, `⏱️ Standard (2m + 12s)`, `☕ Détente (Sans pendule)`).
 * - B. Les 2 grands boutons d'action côte à côte :
 *      1) CTA Principal plein Or (#D4AF37) : "⚔️ TROUVER UN ADVERSAIRE" (sous-titre dynamique)
 *      2) CTA Secondaire Émeraude/Or : "🔗 INVITER UN AMI (LIEN 1-CLIC)" ("Sans création de compte")
 *
 * Strictement 0 `any`, < 260 lignes (GOVERNANCE.md & SCALABILITY.md).
 */

import React, { useState, useEffect, useCallback } from 'react';
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
    /** Liste optionnelle de défis ouverts. */
    challenges?: ReadonlyArray<OpenMatchChallenge>;
    /** Callback déclenché lorsqu'un joueur clique sur "Rejoindre" un défi. */
    onJoinChallenge?: (challenge: OpenMatchChallenge) => void;
    /** Callback déclenché lorsqu'un joueur souhaite ouvrir le Salon Multijoueur (Matchmaking ou Code). */
    onCreateChallenge?: () => void;
    /** Callback optionnel pour lancer un match de calibrage / Bot IA au même Elo. */
    onStartCalibrationMatch?: () => void;
    /** Callback optionnel pour basculer sur l'onglet des 5 Bots Maîtres IA. */
    onSwitchToAiMasters?: () => void;
    /** Longueur du match sélectionnée. */
    matchLength?: number;
    /** Setter de longueur du match. */
    onSelectMatchLength?: (pts: number) => void;
    /** Cadence d'horloge sélectionnée. */
    clockPreset?: LobbyClockPreset;
    /** Setter de cadence d'horloge. */
    onSelectClockPreset?: (preset: LobbyClockPreset) => void;
    /** Elo actuel du joueur. */
    eloRating?: number;
    /** PR moyen actuel du joueur. */
    averagePR?: number | null;
    /** Nombre de matchs joués. */
    gamesPlayed?: number;
}

const WBGF_CADENCES: ReadonlyArray<{
    readonly id: LobbyClockPreset;
    readonly pillLabel: string;
    readonly shortName: string;
}> = [
    { id: 'blitz', pillLabel: '⚡ Blitz (20s + 10s)', shortName: 'Blitz' },
    { id: 'normal', pillLabel: '⏱️ Standard (2m + 12s)', shortName: 'Standard' },
    { id: 'unlimited', pillLabel: '☕ Détente (Sans pendule)', shortName: 'Détente' },
];

function generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const arr = new Uint8Array(4);
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
        window.crypto.getRandomValues(arr);
    } else {
        arr[0] = 7;
        arr[1] = 14;
        arr[2] = 21;
        arr[3] = 28;
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
        const timer = window.setInterval(() => {
            setSearchSeconds((s) => s + 1);
        }, 1000);
        return () => window.clearInterval(timer);
    }, [isSearchingHuman]);

    const handleFindOpponentClick = useCallback(() => {
        setIsSearchingHuman(true);
        if (onCreateChallenge) {
            onCreateChallenge();
        }
    }, [onCreateChallenge]);

    const handleGenerateFriendLink = useCallback(() => {
        const code = generateRoomCode();
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://backgammontour.com';
        const url = `${origin}/?join=${code}&matchLength=${matchLength}`;
        setInviteUrl(url);
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            void navigator.clipboard.writeText(url).then(() => {
                setCopiedInvite(true);
                window.setTimeout(() => setCopiedInvite(false), 3000);
            }).catch(() => {});
        }
        onCreateChallenge?.();
    }, [matchLength, onCreateChallenge]);

    const activeCadenceShort =
        WBGF_CADENCES.find((c) => c.id === clockPreset)?.shortName ?? 'Standard';
    const dynamicSubtitle =
        matchLength === 0
            ? `Money Game • ${activeCadenceShort}`
            : `Match ${matchLength} pts • ${activeCadenceShort}`;

    return (
        <div
            data-testid="open-matches-table"
            className="w-full space-y-4"
        >
            {/* A. SÉLECTEUR RAPIDE ULTRA-LISIBLE (FORMAT & CADENCE SANS NUMÉROTATION NI JARGON) */}
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#050505]/80 p-3.5 sm:p-4">
                {/* Ligne 1 : Format */}
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
                                className={`rounded-xl border px-3 py-2 font-mono text-xs sm:text-sm font-bold transition ${
                                    active
                                        ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#f3c65f] shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                                        : 'border-white/10 bg-[#12151C] text-slate-300 hover:border-white/25 hover:text-white'
                                }`}
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
                        className={`col-span-2 sm:col-span-1 rounded-xl border px-3 py-2 text-xs sm:text-sm font-bold transition ${
                            matchLength === 0
                                ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#f3c65f] shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                                : 'border-white/10 bg-[#12151C] text-slate-300 hover:border-white/25 hover:text-white'
                        }`}
                    >
                        💰 Money Game
                    </button>
                </div>

                {/* Ligne 2 : Cadence */}
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
                                className={`rounded-xl border px-3 py-2 text-center text-xs sm:text-sm font-bold transition ${
                                    active
                                        ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#f3c65f] shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                                        : 'border-white/10 bg-[#12151C] text-slate-300 hover:border-white/25 hover:text-white'
                                }`}
                            >
                                {c.pillLabel}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* B. LES 2 SEULS BOUTONS D'ACTION (CTAs GÉANTS & ÉVIDENTS CÔTE À CÔTE) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Action N°1 (Gauche — 100 % de l'attention visuelle) : Bouton Plein Or (#D4AF37) */}
                <div data-testid="open-matches-quick-matchmaking" className="flex flex-col gap-2">
                    <button
                        type="button"
                        data-testid="quick-matchmaking-btn"
                        onClick={handleFindOpponentClick}
                        className="w-full rounded-2xl border border-[#f3c65f] bg-gradient-to-r from-[#D4AF37] via-[#f7d77e] to-[#b88924] px-5 py-3.5 text-center shadow-[0_6px_24px_rgba(212,175,55,0.38)] hover:brightness-105 active:scale-[0.99] transition flex flex-col items-center justify-center gap-0.5"
                    >
                        <span className="text-sm sm:text-base font-black uppercase tracking-wider text-[#050505]">
                            ⚔️ TROUVER UN ADVERSAIRE
                        </span>
                        <span className="text-xs font-bold text-[#050505]/80">
                            {dynamicSubtitle}
                        </span>
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

                {/* Action N°2 (Droite — Viralité 1-Clic) : Grand bouton bordé Émeraude/Or */}
                <div data-testid="open-matches-private-code" className="flex flex-col gap-2">
                    <button
                        type="button"
                        data-testid="create-open-match-btn"
                        onClick={handleGenerateFriendLink}
                        className="w-full rounded-2xl border border-emerald-400/75 bg-gradient-to-r from-emerald-500/20 via-[#12151C] to-[#D4AF37]/20 px-5 py-3.5 text-center shadow-[0_6px_24px_rgba(16,185,129,0.2)] hover:border-[#D4AF37] hover:bg-emerald-500/30 active:scale-[0.99] transition flex flex-col items-center justify-center gap-0.5"
                    >
                        <span className="text-sm sm:text-base font-black uppercase tracking-wider text-emerald-100">
                            🔗 INVITER UN AMI (LIEN 1-CLIC)
                        </span>
                        <span className="text-xs font-semibold text-emerald-300/90">
                            Sans création de compte
                        </span>
                    </button>
                    {inviteUrl && (
                        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-400/30 bg-emerald-950/50 px-3 py-1.5 text-xs text-emerald-200">
                            <span className="truncate font-mono">{inviteUrl}</span>
                            <span className="shrink-0 font-bold text-emerald-300">{copiedInvite ? '✓ Copié' : 'Prêt'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Défis ouverts si fournis */}
            {challenges && challenges.length > 0 && (
                <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-slate-950/60">
                    {challenges.map((item) => (
                        <div
                            key={item.id}
                            data-testid={`open-match-row-${item.id}`}
                            className="flex flex-wrap items-center justify-between gap-3 p-3"
                        >
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
