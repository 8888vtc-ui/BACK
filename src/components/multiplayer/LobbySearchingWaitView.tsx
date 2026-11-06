'use client';

/**
 * Vue d'attente dynamique pendant la recherche d'un adversaire (`LobbySearchingWaitView.tsx`).
 * Respecte la Clause CGU §4 : zéro PR / Elo attribué si le joueur est Invité (`playerRating === null`).
 * Strictement < 160 lignes, 0 emoji, 0 any.
 */

import React, { useMemo } from 'react';
import { Radio, Trophy, MapPin, Sparkles } from 'lucide-react';
import { WORLD_TOURNAMENTS_CATALOG } from '../../features/tournaments/worldTournamentsCatalog';
import type { TournamentRecord } from '../../features/tournaments/tournamentTypes';
import { useTranslation } from '../../i18n';

export interface LobbySearchingWaitViewProps {
    readonly elapsedSeconds: number;
    readonly selectedLength: number;
    readonly playerRating: number | null;
    readonly playerAveragePr: number | null;
    readonly onCancelSearch: () => void;
}

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
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const liveTournament = useMemo(
        () => selectUpcomingFederationTournament(Math.floor(elapsedSeconds / 3)),
        [elapsedSeconds],
    );

    const searchStepLabel =
        elapsedSeconds < 2
            ? (isEn
                ? `Connecting to club queue (Match ${selectedLength === 0 ? 'Money Game' : `${selectedLength} pts`})...`
                : 'Vérification des tables disponibles • Cadence 10 min + 8s')
            : elapsedSeconds < 4
              ? (isEn
                  ? 'Scanning active players • Time control 10 min + 8s...'
                  : 'Balayage de la file d’attente • Cadence 10 min + 8s...')
              : (isEn ? 'Opponent detected — setting up table...' : 'Joueur détecté — préparation de la table...');

    return (
        <div className="py-3 text-center space-y-3.5 animate-fade-in" data-testid="matchmaking-searching">
            {/* 1. Radar de recherche dynamique */}
            <div className="flex flex-col items-center gap-2">
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-[#D4AF37]/40 animate-ping" />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/15 text-[#f3d27a]">
                        <Radio className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                </div>
                <div className="space-y-0.5">
                    <div className="text-sm sm:text-base font-extrabold text-white">
                        {isEn
                            ? 'Searching for an available player in the Club...'
                            : 'Recherche d\'un joueur disponible dans le Salon...'}
                    </div>
                    <div className="text-xs text-amber-300/95 font-medium">
                        {searchStepLabel}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                        {isEn ? 'Elapsed:' : 'Temps écoulé :'} {elapsedSeconds}s • {isEn ? 'Format:' : 'Format :'} {selectedLength === 0 ? 'Money Game' : `${selectedLength} pts`}
                    </div>
                </div>
            </div>

            {/* 2. VRAI PROCHAIN TOURNOI LIVE */}
            <div
                data-testid="waiting-live-tournament-card"
                className="rounded-xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#191308] via-[#121722] to-[#191308] p-3 text-left shadow-lg"
            >
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#D4AF37]">
                        <Trophy className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{isEn ? `Upcoming Live Tournament (${liveTournament.federation})` : `Prochain Tournoi Live (${liveTournament.federation})`}</span>
                    </span>
                    <span className="rounded-md border border-emerald-400/40 bg-emerald-950/70 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                        {liveTournament.startDate}
                    </span>
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-white truncate">
                    {liveTournament.name}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-300">
                    <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#D4AF37]" strokeWidth={1.5} />
                        <span>{liveTournament.city}, {liveTournament.countryName}</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-amber-300 font-bold">
                        {isEn ? 'Prize Pool' : 'Dotation'} {(liveTournament.estimatedPrizePool ?? 0).toLocaleString('fr-FR')} {liveTournament.currency}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span>Match {liveTournament.matchLengthMain} pts</span>
                </div>
            </div>

            {/* 3. BANNIÈRE ENTRAÎNEMENT */}
            <div
                data-testid="waiting-einstein-quiz-banner"
                className="flex items-center gap-3 rounded-xl border border-emerald-400/40 bg-emerald-950/35 p-3 text-left shadow-md"
            >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[#D4AF37] bg-[#141a24] shadow-md flex items-center justify-center">
                    <img
                        src="/avatars/einstein-quiz-coach.jpg"
                        alt="Coach Quiz"
                        className="h-full w-full object-cover"
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-emerald-300 leading-tight">
                        <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{isEn ? 'Train on 3-Ply Quizzes between matches!' : 'Entraînez-vous sur les Quiz 3-Ply entre deux matchs !'}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-200 leading-snug">
                        {playerAveragePr !== null
                            ? (isEn
                                ? `Your current Account PR is ${playerAveragePr.toFixed(1)}. Solving quizzes sharpens your cube and checker decisions.`
                                : `Votre PR de compte actuel est de ${playerAveragePr.toFixed(1)}. Les quiz affûtent vos décisions de pions et de videau.`)
                            : (isEn
                                ? 'Sign in to a personal account (ToS Clause §4) to unlock official PR tracking and Elo progression.'
                                : 'Connectez-vous à un compte personnel (Clause CGU §4) pour activer le suivi officiel de votre PR et de votre Elo.')}
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={onCancelSearch}
                className="min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:border-white/25 hover:text-white transition-colors"
                data-testid="cancel-matchmaking-button"
            >
                {isEn ? 'Cancel search' : 'Annuler la recherche'}
            </button>
        </div>
    );
};

export default LobbySearchingWaitView;
