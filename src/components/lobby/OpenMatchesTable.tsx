'use client';

/**
 * @file src/components/lobby/OpenMatchesTable.tsx
 * @description Panneau Central "Jouer en Ligne" (Zero-Friction & Liquidité) — Direction Artistique Cercle Monte-Carlo.
 *
 * Contient :
 * - A. Sélecteur rapide de format (`3 pts`, `5 pts`, `7 pts`, `11 pts` ou `Money Game / Chouette`)
 *      et Cadence officielle WBGF (`⚡ Blitz / Speed`, `⏱️ Tournoi Standard`, `☕ Détente`).
 * - B. Les 2 grands boutons d'action côte à côte :
 *      1) CTA Principal plein Or (#D4AF37) : "⚔️ TROUVER UN ADVERSAIRE · MATCH 7 PTS"
 *         (avec fallback 1-clic vers le Bot calibré au même Elo après 10s si aucun humain ne répond)
 *      2) CTA Secondaire Émeraude/Or : "🔗 INVITER UN AMI (LIEN 1-CLIC)"
 *         (génère instantanément une URL de salon privé partageable WhatsApp/SMS jouable sans compte)
 * - C. Aperçu du Salon en direct (Live Lobby) : tables actives + accès rapide en 1 seconde aux 5 Maîtres IA.
 *
 * Strictement 0 `any`, < 290 lignes (GOVERNANCE.md & SCALABILITY.md).
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
    readonly label: string;
    readonly detail: string;
}> = [
    { id: 'blitz', label: '⚡ Blitz / Speed', detail: '20s/pt + 10s Bronstein' },
    { id: 'normal', label: '⏱️ Tournoi Standard', detail: '2min/pt + 12s Bronstein' },
    { id: 'unlimited', label: '☕ Détente', detail: 'Sans pendule' },
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
    onSwitchToAiMasters,
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

    const formatBadgeText = matchLength === 0 ? 'MONEY GAME' : `MATCH ${matchLength} PTS`;

    return (
        <div
            data-testid="open-matches-table"
            className="w-full rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-b from-[#141720] to-[#0B0E14] p-4 shadow-2xl space-y-3.5"
        >
            {/* En-tête : Salon en Ligne & Garantie Anti-Paranoïa SHA-256 */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                        🌐 Salon en Ligne · Matchmaking &amp; Défi Ami 1-Clic
                    </h2>
                </div>
                <span
                    data-testid="private-salon-active-badge"
                    className="rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-semibold text-[#f3c65f]"
                >
                    ⏱️ Horloge WBGF Bronstein · 🛡️ Dés SHA-256
                </span>
            </div>

            {/* A. SÉLECTEUR RAPIDE DE FORMAT & CADENCE OFFICIELLE WBGF */}
            <div className="flex flex-col gap-2.5 rounded-xl border border-white/10 bg-[#050505]/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        1. Format du Match :
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Longueur du match en ligne">
                        {[3, 5, 7, 11].map((pts) => (
                            <button
                                key={pts}
                                type="button"
                                data-testid={`online-format-${pts}`}
                                onClick={() => onSelectMatchLength?.(pts)}
                                className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition ${
                                    matchLength === pts
                                        ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#f3c65f] shadow-sm'
                                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white'
                                }`}
                            >
                                {pts} pts
                            </button>
                        ))}
                        <button
                            type="button"
                            data-testid="online-format-money"
                            onClick={() => onSelectMatchLength?.(0)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                                matchLength === 0
                                    ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#f3c65f] shadow-sm'
                                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white'
                            }`}
                        >
                            💰 Money Game / Chouette
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        2. Cadence WBGF :
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 flex-1 max-w-2xl">
                        {WBGF_CADENCES.map((c) => {
                            const active = clockPreset === c.id;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    data-testid={`online-cadence-${c.id}`}
                                    onClick={() => onSelectClockPreset?.(c.id)}
                                    className={`flex flex-col items-start rounded-lg border px-2.5 py-1.5 text-left transition ${
                                        active
                                            ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white'
                                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white'
                                    }`}
                                >
                                    <span className="text-xs font-bold text-[#f3c65f]">{c.label}</span>
                                    <span className="text-[11px] text-slate-400">{c.detail}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* B. LES 2 GRANDS BOUTONS D'ACTION CÔTE À CÔTE */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Action 1 : CTA Principal Plein Or (#D4AF37) */}
                <div
                    data-testid="open-matches-quick-matchmaking"
                    className="rounded-xl border border-[#D4AF37]/40 bg-[#050505]/80 p-3 flex flex-col justify-between gap-2.5"
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white">⚔️ Adversaire Direct ({eloRating} Elo)</span>
                        <span className="rounded-md border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[11px] font-semibold text-[#f3c65f]">
                            Classé PR &amp; Elo
                        </span>
                    </div>
                    <button
                        type="button"
                        data-testid="quick-matchmaking-btn"
                        onClick={handleFindOpponentClick}
                        className="w-full rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#D4AF37] via-[#f7d77e] to-[#b88924] px-4 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-[#050505] shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:brightness-105 active:scale-[0.99] transition"
                    >
                        ⚔️ TROUVER UN ADVERSAIRE · {formatBadgeText}
                    </button>
                    {isSearchingHuman && searchSeconds >= 10 && onStartCalibrationMatch && (
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-200">
                            <span>Aucun joueur en {searchSeconds}s ?</span>
                            <button
                                type="button"
                                data-testid="online-fallback-bot-btn"
                                onClick={onStartCalibrationMatch}
                                className="rounded-md bg-[#D4AF37] px-2.5 py-1 text-xs font-black text-[#050505] hover:brightness-110"
                            >
                                Jouer contre Bot ({eloRating} Elo) →
                            </button>
                        </div>
                    )}
                </div>

                {/* Action 2 : CTA Secondaire Émeraude/Or (Lien 1-Clic) */}
                <div
                    data-testid="open-matches-private-code"
                    className="rounded-xl border border-emerald-500/35 bg-[#050505]/80 p-3 flex flex-col justify-between gap-2.5"
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white">🔗 Salon Ami sans création de compte</span>
                        <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                            WhatsApp / SMS
                        </span>
                    </div>
                    <button
                        type="button"
                        data-testid="create-open-match-btn"
                        onClick={handleGenerateFriendLink}
                        className="w-full rounded-xl border border-emerald-400/80 bg-gradient-to-r from-emerald-500/25 via-emerald-500/35 to-[#D4AF37]/25 px-4 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-500/40 active:scale-[0.99] transition"
                    >
                        🔗 INVITER UN AMI (LIEN 1-CLIC)
                    </button>
                    {inviteUrl && (
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-400/30 bg-emerald-950/50 px-2.5 py-1 text-[11px] text-emerald-200">
                            <span className="truncate font-mono">{inviteUrl}</span>
                            <span className="shrink-0 font-bold text-emerald-300">{copiedInvite ? '✓ Copié' : 'Prêt'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* C. APERÇU DU SALON EN DIRECT (LIVE LOBBY) & ACCÈS 1-SECONDE AUX 5 MAÎTRES IA */}
            <div
                data-testid="live-lobby-bar"
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#050505]/60 px-3 py-2"
            >
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        Salon Live actif
                    </span>
                    <span className="text-slate-600">•</span>
                    <span>Tables prêtes en {formatBadgeText}</span>
                </div>

                <button
                    type="button"
                    data-testid="live-lobby-ai-shortcut-btn"
                    onClick={() => (onSwitchToAiMasters ? onSwitchToAiMasters() : onStartCalibrationMatch?.())}
                    className="text-xs font-bold text-[#f3c65f] hover:text-white underline-offset-4 hover:underline transition"
                >
                    Entraînement instantané contre un Maître IA →
                </button>
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
