'use client';

/**
 * @file src/components/tournaments/VenueDirectoryCard.tsx
 * @description Carte détaillée d'un Club / Salon pour l'annuaire mondial Où Jouer.
 * Strictement <= 150 lignes, 0 any.
 */

import React from 'react';
import Link from 'next/link';
import type { WorldBackgammonVenue } from '../../features/tournaments/worldBackgammonVenues';

export interface VenueDirectoryCardProps {
    readonly venue: WorldBackgammonVenue;
    readonly onSelectVenue?: (id: string) => void;
}

export const VenueDirectoryCard: React.FC<VenueDirectoryCardProps> = React.memo(({
    venue,
    onSelectVenue,
}) => {
    return (
        <div
            data-testid={`venue-card-${venue.slug}`}
            onClick={() => onSelectVenue?.(venue.id)}
            className="rounded-2xl border border-white/10 bg-[#0b101b] p-5 shadow-xl hover:border-emerald-500/50 transition cursor-pointer flex flex-col justify-between"
        >
            <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-block rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                        {venue.federation}
                    </span>
                    {(venue.officialUrl.startsWith('/tournaments/clubs/') || venue.officialUrl.includes('/clubs/')) && (
                        <span className="rounded-full border border-[#d4af37]/60 bg-gradient-to-r from-[#d4af37]/25 to-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-200 shadow-[0_0_12px_rgba(212,175,55,0.2)]">
                            🎁 Page Club Officielle hébergée et offerte
                        </span>
                    )}
                </div>

                <div className="mt-2.5">
                    <h3 className="font-serif text-lg font-bold text-white">{venue.name}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="rounded border border-white/15 bg-white/5 px-1 font-mono text-[10px] text-amber-300 font-bold">
                            {venue.countryCode}
                        </span>
                        <span className="font-medium text-slate-200">{venue.city}, {venue.countryName}</span>
                    </div>
                </div>

                <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs flex flex-col gap-1.5">
                    <div className="text-slate-300">
                        <span className="text-slate-400 font-semibold">📍 Adresse : </span>{venue.address}
                    </div>
                    <div className="text-amber-300">
                        <span className="text-slate-400 font-semibold">🕒 Horaires : </span>{venue.scheduleFr}
                    </div>
                    <div className="text-emerald-400">
                        <span className="text-slate-400 font-semibold">💳 Tarif : </span>{venue.entryCostLabel}
                    </div>
                </div>

                {venue.playerBenefitsFr && venue.playerBenefitsFr.length > 0 && (
                    <div className="mt-3">
                        <div className="text-[11px] uppercase font-bold text-[#d4af37] mb-1.5">
                            ✨ Pourquoi jouer ici — Avantages du lieu
                        </div>
                        <ul className="flex flex-col gap-1 text-xs text-slate-300">
                            {venue.playerBenefitsFr.map((benefit) => (
                                <li key={benefit} className="flex items-start gap-1.5">
                                    <span className="text-emerald-400 shrink-0">✓</span>
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {venue.atmosphereFr && (
                    <p className="mt-3 text-xs text-slate-400 italic leading-relaxed">
                        « {venue.atmosphereFr} »
                    </p>
                )}
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                <Link
                    href={`/tournaments/clubs/${venue.slug}`}
                    className="text-[#d4af37] font-semibold hover:underline"
                >
                    Fiche Club &amp; Horaires →
                </Link>
                <Link
                    href={`/?matchLength=7&tournament=${encodeURIComponent(venue.name)}`}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300 hover:text-white"
                >
                    🎲 S’entraîner
                </Link>
            </div>
        </div>
    );
});

VenueDirectoryCard.displayName = 'VenueDirectoryCard';
export default VenueDirectoryCard;

