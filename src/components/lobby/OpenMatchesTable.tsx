'use client';

/**
 * Panneau Multijoueur du Salon — Direction Artistique Cercle Monte-Carlo.
 *
 * Rôle :
 *   Clarifie les 2 actions principales du mode Multijoueur :
 *   1. Matchmaking Rapide (appariement automatique selon l'Elo)
 *   2. Salon Privé par Code (BG-XXXX, création ou connexion directe entre amis / club)
 *
 * Loi 5 de Scalabilité : strictement 0 any, < 300 lignes, rendu SSR déterministe.
 */

import React from 'react';
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
    /** Callback optionnel pour lancer un match de calibrage. */
    onStartCalibrationMatch?: () => void;
    /** Elo actuel du joueur. */
    eloRating?: number;
    /** PR moyen actuel du joueur. */
    averagePR?: number | null;
    /** Nombre de matchs joués. */
    gamesPlayed?: number;
}

const OpenMatchesTableComponent: React.FC<OpenMatchesTableProps> = ({
    challenges,
    onJoinChallenge,
    onCreateChallenge,
    onStartCalibrationMatch,
    eloRating = 1500,
}) => {
    const handleQuickMatchmaking = () => {
        if (onCreateChallenge) {
            onCreateChallenge();
        } else {
            onStartCalibrationMatch?.();
        }
    };

    return (
        <div
            data-testid="open-matches-table"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl backdrop-blur-xl space-y-3.5"
        >
            {/* En-tête épuré */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                        Duel en Ligne · Match &amp; Money Game
                    </h2>
                </div>

                <span
                    data-testid="private-salon-active-badge"
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-amber-300"
                >
                    ⏱️ Pendule WBF · 🛡️ Dés SHA-256
                </span>
            </div>

            {/* Les 2 Actions Principales clairement distinguées */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Action 1 : Matchmaking Rapide */}
                <div
                    data-testid="open-matches-quick-matchmaking"
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5 flex flex-col justify-between gap-3"
                >
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-white">
                                ⚡ Matchmaking Rapide
                            </span>
                            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                                Classé Elo
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Appariement instantané contre un adversaire de niveau proche ({eloRating} Elo) en Match (1, 3, 5, 7, 11 pts) ou Money Game.
                        </p>
                    </div>

                    <button
                        type="button"
                        data-testid="quick-matchmaking-btn"
                        onClick={handleQuickMatchmaking}
                        className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:border-white/25 hover:bg-white/15 transition"
                    >
                        ⚡ Matchmaking Rapide
                    </button>
                </div>

                {/* Action 2 : Salon Privé par Code */}
                <div
                    data-testid="open-matches-private-code"
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5 flex flex-col justify-between gap-3"
                >
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-white">
                                🔑 Salon Privé par Code
                            </span>
                            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                                BG-XXXX · Ami &amp; Club
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Créez une table privée (Match Crawford ou Money Game Jacoby) et partagez le code à 4 chiffres avec un ami.
                        </p>
                    </div>

                    {onCreateChallenge && (
                        <button
                            type="button"
                            data-testid="create-open-match-btn"
                            onClick={onCreateChallenge}
                            className="w-full rounded-xl border border-[#f3c65f] bg-[#f3c65f] px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-sm hover:bg-[#f7d37c] active:scale-[0.99] transition"
                        >
                            🔑 Salon Privé par Code
                        </button>
                    )}
                </div>
            </div>

            {/* Liste optionnelle de défis ouverts si fournie */}
            {challenges && challenges.length > 0 && (
                <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-slate-950/60">
                    {challenges.map((item) => {
                        const formatLabel = item.matchLength === 0 ? 'Money Game' : `${item.matchLength} pts`;
                        return (
                            <div
                                key={item.id}
                                data-testid={`open-match-row-${item.id}`}
                                className="flex flex-wrap items-center justify-between gap-3 p-3"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xs font-bold text-white">
                                        {item.hostName}
                                    </span>
                                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300">
                                        {item.galaxyRating} Elo
                                    </span>
                                    <span className="font-mono text-xs text-slate-300">
                                        {formatLabel}
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
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const OpenMatchesTable = React.memo(OpenMatchesTableComponent);
export default OpenMatchesTable;
