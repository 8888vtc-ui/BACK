'use client';

/**
 * Vue d'attente dynamique pendant la recherche d'un adversaire (`LobbySearchingWaitView.tsx`).
 *
 * Affiche :
 * 1. Le radar de recherche évolutif (connexion -> tables internationales -> appariement).
 * 2. Le VRAI Prochain Tournoi Officiel issu de notre base (`WORLD_TOURNAMENTS_CATALOG` — WBGF / WBA / FFB / USBGF).
 * 3. Le Médaillon Einstein / Cerveau 🧠 : « Faites des Quizz pour améliorer votre PR ! ».
 */

import React, { useMemo } from 'react';
import { WORLD_TOURNAMENTS_CATALOG } from '../../features/tournaments/worldTournamentsCatalog';
import type { TournamentRecord } from '../../features/tournaments/tournamentTypes';

export interface LobbySearchingWaitViewProps {
    readonly elapsedSeconds: number;
    readonly selectedLength: number;
    readonly playerRating: number;
    readonly playerAveragePr: number;
    readonly onCancelSearch: () => void;
}

const COUNTRY_FLAGS: Readonly<Record<string, string>> = {
    MC: '🇲🇨',
    CY: '🇨🇾',
    US: '🇺🇸',
    DK: '🇩🇰',
    TR: '🇹🇷',
    FR: '🇫🇷',
    GB: '🇬🇧',
    DE: '🇩🇪',
    IT: '🇮🇹',
    GR: '🇬🇷',
    JP: '🇯🇵',
    CH: '🇨🇭',
    AT: '🇦🇹',
    ES: '🇪🇸',
    SE: '🇸🇪',
};

function selectUpcomingFederationTournament(seedIndex: number): TournamentRecord {
    const todayIso = new Date().toISOString().slice(0, 10);
    const upcoming = [...WORLD_TOURNAMENTS_CATALOG]
        .filter((t) => t.endDate >= todayIso)
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
    const pool = upcoming.length > 0 ? upcoming : WORLD_TOURNAMENTS_CATALOG;
    return pool[seedIndex % pool.length] ?? WORLD_TOURNAMENTS_CATALOG[0]!;
}

export const LobbySearchingWaitView: React.FC<LobbySearchingWaitViewProps> = ({
    elapsedSeconds,
    selectedLength,
    playerRating,
    playerAveragePr,
    onCancelSearch,
}) => {
    const liveTournament = useMemo(
        () => selectUpcomingFederationTournament(Math.floor(elapsedSeconds / 3)),
        [elapsedSeconds],
    );
    const flag = COUNTRY_FLAGS[liveTournament.countryCode] ?? '🌍';

    const searchStepLabel =
        elapsedSeconds < 2
            ? `Connexion au salon international (${playerRating} Elo • Tolérance stricte ±100 Elo)...`
            : elapsedSeconds < 4
              ? `Vérification des tables disponibles (${selectedLength === 0 ? 'Money Game' : `${selectedLength} pts`})...`
              : 'Joueur détecté — préparation de la table...';

    return (
        <div className="py-3 text-center space-y-3.5 animate-fade-in" data-testid="matchmaking-searching">
            {/* 1. Radar de recherche dynamique */}
            <div className="flex flex-col items-center gap-2">
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-amber-400/35 animate-ping" />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-amber-500/15 text-xl text-amber-300">
                        📡
                    </div>
                </div>
                <div className="space-y-0.5">
                    <div className="text-sm sm:text-base font-extrabold text-white">
                        Recherche d&apos;un adversaire en cours...
                    </div>
                    <div className="text-xs text-amber-300/95 font-medium">
                        {searchStepLabel}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                        Temps écoulé : {elapsedSeconds}s • Format : {selectedLength === 0 ? 'Money Game' : `${selectedLength} pts`}
                    </div>
                </div>
            </div>

            {/* 2. VRAI PROCHAIN TOURNOI LIVE (issu de WORLD_TOURNAMENTS_CATALOG) */}
            <div
                data-testid="waiting-live-tournament-card"
                className="rounded-xl border border-[#f3c65f]/40 bg-gradient-to-r from-[#191308] via-[#121722] to-[#191308] p-3 text-left shadow-lg"
            >
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#f3c65f]">
                        <span>🏆</span>
                        <span>Prochain Tournoi Live ({liveTournament.federation})</span>
                    </span>
                    <span className="rounded-md border border-emerald-400/40 bg-emerald-950/70 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                        {liveTournament.startDate}
                    </span>
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-white truncate">
                    {flag} {liveTournament.name}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-300">
                    <span>📍 {liveTournament.city}, {liveTournament.countryName}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-amber-300 font-bold">
                        Dotation {(liveTournament.estimatedPrizePool ?? 0).toLocaleString('fr-FR')} {liveTournament.currency}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span>Match {liveTournament.matchLengthMain} pts</span>
                </div>
            </div>

            {/* 3. MÉDAILLON EINSTEIN / CERVEAU 🧠 : Faites des Quizz pour améliorer votre PR ! */}
            <div
                data-testid="waiting-einstein-quiz-banner"
                className="flex items-center gap-3 rounded-xl border border-emerald-400/40 bg-emerald-950/35 p-3 text-left shadow-md"
            >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[#f3c65f] bg-[#141a24] shadow-md flex items-center justify-center">
                    <img
                        src="/avatars/einstein-quiz-coach.jpg"
                        alt="Einstein Coach Quizz PR"
                        className="h-full w-full object-cover"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-slate-950 px-0.5 text-xs">
                        🧠
                    </span>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-black text-emerald-300 leading-tight">
                        🧠 Faites des Quizz pour améliorer votre PR !
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-200 leading-snug">
                        Chaque Quizz réussi au <span className="font-bold text-[#f3c65f]">1er essai</span> abaisse votre PR Moyen Public (actuel : <span className="font-mono font-bold text-white">{playerAveragePr.toFixed(2)}</span>) et débloque votre plafond Elo.
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={onCancelSearch}
                className="min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:border-white/25 hover:text-white transition-colors"
                data-testid="cancel-matchmaking-button"
            >
                Annuler la recherche
            </button>
        </div>
    );
};

export default LobbySearchingWaitView;
