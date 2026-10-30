'use client';

/**
 * Vue Palmarès Mondial & Finales Historiques — Direction "Haute-Horlogerie Monte-Carlo".
 *
 * Rôle : Affiche les archives officielles des finales de championnats mondiaux et nationaux,
 * les Performance Ratings (PR) d'élite des champions et finalistes, ainsi qu'un accès direct
 * pour jouer le format réel de chaque finale historique.
 *
 * Dépendances : HistoricTournamentResult, getCountryFlagEmoji.
 * Retrait : Supprimer ce fichier et ses imports dans TournamentWorldHubView.
 * Strictement 0 `any`, React.memo, budget <= 240 lignes (SCALABILITY.md R1 & R2).
 */

import React from 'react';
import Link from 'next/link';
import type { HistoricTournamentResult } from '../../features/tournaments/worldTournamentsResults';
import type { TournamentTier } from '../../features/tournaments/tournamentTypes';
import { getCountryFlagEmoji } from '../../features/tournaments/tournamentEngine';

export interface TournamentResultsArchiveViewProps {
    readonly results: ReadonlyArray<HistoricTournamentResult>;
}

const TIER_BADGES: Readonly<Record<TournamentTier, { label: string; cls: string }>> = {
    mega: { label: '👑 MEGA MAJOR', cls: 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300' },
    grand: { label: '🏆 GRAND MASTER', cls: 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300' },
    moyen: { label: '🎖️ OPEN MOYEN', cls: 'border-amber-700/50 bg-amber-700/20 text-amber-200' },
};

function formatPrBadge(pr: number): { label: string; cls: string } {
    if (pr <= 2.5) return { label: `PR ${pr.toFixed(2)} (World Class)`, cls: 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300' };
    if (pr <= 3.5) return { label: `PR ${pr.toFixed(2)} (Master)`, cls: 'border-yellow-500/60 bg-yellow-500/20 text-yellow-300' };
    return { label: `PR ${pr.toFixed(2)} (Expert)`, cls: 'border-blue-500/60 bg-blue-500/20 text-blue-300' };
}

const TournamentResultsArchiveViewComponent: React.FC<TournamentResultsArchiveViewProps> = ({ results }) => {
    return (
        <div className="flex flex-col gap-6" data-testid="tournament-results-archive-view">
            {/* Header introductif */}
            <div className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-r from-[#0b101b] via-[#141b2d] to-[#0b101b] p-5 shadow-xl">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">🏆</span>
                    <div>
                        <h3 className="font-serif text-lg font-bold text-white">
                            Palmarès Mondial & Archives des Finales Historiques
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-300">
                            Performances réelles des Grands Maîtres certifiées par les fédérations officielles WBGF, USBGF & FFB. Analysez le Performance Rating (PR) des champions.
                        </p>
                    </div>
                </div>
            </div>

            {results.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#0b101b] p-12 text-center text-slate-400">
                    <p className="text-base">Aucune finale archivée ne correspond à vos filtres.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {results.map((item) => {
                        const tierInfo = TIER_BADGES[item.tier] ?? TIER_BADGES.moyen;
                        const champFlag = getCountryFlagEmoji(item.championCountry);
                        const finalFlag = getCountryFlagEmoji(item.finalistCountry);
                        const champPrInfo = formatPrBadge(item.championPr);
                        const finalistPrInfo = formatPrBadge(item.finalistPr);
                        const trainHref = `/?matchLength=${item.matchLength}&tournament=${encodeURIComponent(`${item.tournamentName} ${item.editionYear}`)}`;

                        return (
                            <article
                                key={item.id}
                                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0b101b] p-5 shadow-xl hover:border-[#d4af37]/40 transition"
                                data-testid={`result-card-${item.id}`}
                            >
                                <div>
                                    {/* En-tête : Année, Palier & Tournoi */}
                                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-serif text-base font-bold text-amber-300">{item.editionYear}</span>
                                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${tierInfo.cls}`}>
                                                {tierInfo.label}
                                            </span>
                                        </div>
                                        <div className="text-[11px] font-semibold text-slate-400">
                                            {item.playersCount} joueurs • {item.federation}
                                        </div>
                                    </div>

                                    <h4 className="mt-3 font-serif text-base font-bold text-white">
                                        {item.tournamentName}
                                    </h4>
                                    <div className="mt-0.5 text-xs text-slate-400">
                                        {getCountryFlagEmoji(item.countryCode)} {item.city}
                                    </div>

                                    {/* Duel Champion vs Finaliste */}
                                    <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 flex flex-col gap-2.5">
                                        {/* Champion */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-base" title={item.championCountry}>{champFlag}</span>
                                                <span className="text-xs font-bold text-emerald-400 truncate">
                                                    🥇 {item.championName}
                                                </span>
                                            </div>
                                            <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${champPrInfo.cls}`}>
                                                {champPrInfo.label}
                                            </span>
                                        </div>

                                        {/* Finaliste */}
                                        <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-base" title={item.finalistCountry}>{finalFlag}</span>
                                                <span className="text-xs font-medium text-slate-300 truncate">
                                                    🥈 {item.finalistName}
                                                </span>
                                            </div>
                                            <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${finalistPrInfo.cls}`}>
                                                {finalistPrInfo.label}
                                            </span>
                                        </div>

                                        {/* Score final */}
                                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2">
                                            <span>Score de la Finale</span>
                                            <span className="font-bold text-white">{item.finalScore}</span>
                                        </div>
                                    </div>

                                    {/* Résumé tactique de la finale */}
                                    <p className="mt-3 text-xs text-slate-300 leading-relaxed italic bg-black/20 rounded-lg p-2.5 border border-white/5">
                                        « {item.highlightSummaryFr} »
                                    </p>
                                </div>

                                {/* Action Bouton Rejouer */}
                                <div className="mt-4 pt-3 border-t border-white/5">
                                    <Link
                                        href={trainHref}
                                        data-testid={`replay-final-${item.id}`}
                                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-600/30 to-yellow-600/20 px-3.5 py-2 text-xs font-bold text-amber-200 transition hover:border-amber-400 hover:from-amber-600/40"
                                    >
                                        <span>🎯</span> Jouer le Format de cette Finale ({item.matchLength} pts)
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const TournamentResultsArchiveView = React.memo(TournamentResultsArchiveViewComponent);
export default TournamentResultsArchiveView;
