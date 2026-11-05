'use client';

/**
 * @file src/components/tournaments/SubmitClubInlineModal.tsx
 * @description Modale d'enregistrement rapide d'un Club ou Salon avec offre de page hébergée gratuite.
 * Strictement <= 200 lignes, 0 any.
 */

import React, { useState } from 'react';
import type { WorldBackgammonVenue, VenueCategory } from '../../features/tournaments/worldBackgammonVenues';
import type { TournamentRegion } from '../../features/tournaments/tournamentTypes';
import { submitNewClub, type ClubSubmissionInput } from '../../lib/supabase/tournamentService';

export interface SubmitClubInlineModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onClubCreated?: (club: WorldBackgammonVenue) => void;
}

const inputCls = 'w-full rounded-xl border border-white/15 bg-[#070b13] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#d4af37] focus:outline-none';

export const SubmitClubInlineModal: React.FC<SubmitClubInlineModalProps> = ({
    isOpen,
    onClose,
    onClubCreated,
}) => {
    const [clubName, setClubName] = useState('');
    const [clubCity, setClubCity] = useState('');
    const [clubCountry, setClubCountry] = useState('France');
    const [clubCountryCode, setClubCountryCode] = useState('FR');
    const [clubRegion, setClubRegion] = useState<TournamentRegion>('europe');
    const [clubCategory, setClubCategory] = useState<VenueCategory>('federation_club');
    const [clubFederation, setClubFederation] = useState('FFB / Club Local');
    const [clubAddress, setClubAddress] = useState('');
    const [clubSchedule, setClubSchedule] = useState('Jeudi 19h30 - 23h30');
    const [clubCost, setClubCost] = useState('Entrée libre / Consommation');
    const [clubUrl, setClubUrl] = useState('');
    const [createFreePage, setCreateFreePage] = useState(true);
    const [clubAtmosphere, setClubAtmosphere] = useState('Ambiance conviviale, chouettes et tournoi hebdomadaire sur pendule.');
    const [submitError, setSubmitError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        try {
            const input: ClubSubmissionInput = {
                name: clubName, city: clubCity, countryName: clubCountry, countryCode: clubCountryCode,
                region: clubRegion, category: clubCategory, federation: clubFederation,
                address: clubAddress, scheduleFr: clubSchedule, entryCostLabel: clubCost,
                officialUrl: clubUrl, atmosphereFr: clubAtmosphere,
                createFreeHostedPage: createFreePage,
            };
            const created = await submitNewClub(input);
            onClubCreated?.(created);
            setClubName('');
            setClubCity('');
            setClubAddress('');
            setClubUrl('');
            onClose();
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement.');
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} data-testid="submit-club-modal" className="rounded-2xl border border-emerald-400/50 bg-[#0b1320] p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 mb-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div>
                    <h4 className="font-serif text-base font-bold text-white">🏛️ Référencer un Club ou Salon de Backgammon</h4>
                    <p className="text-xs text-slate-400">Ajout immédiat sur la carte du monde et dans l’annuaire des joueurs.</p>
                </div>
                <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-400 hover:text-white">✕ Fermer</button>
            </div>
            {submitError && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{submitError}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input type="text" required placeholder="Nom du Club (ex: Club Backgammon Lyon) *" value={clubName} onChange={(e) => setClubName(e.target.value)} data-testid="club-input-name" className={inputCls} />
                <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                    <input type="text" required placeholder="Ville (ex: Lyon, Antibes) *" value={clubCity} onChange={(e) => setClubCity(e.target.value)} data-testid="club-input-city" className={inputCls} />
                    <div className="flex gap-1.5">
                        <input type="text" required placeholder="Pays *" value={clubCountry} onChange={(e) => setClubCountry(e.target.value)} data-testid="club-input-country" className={inputCls} />
                        <input type="text" maxLength={2} placeholder="FR" value={clubCountryCode} onChange={(e) => setClubCountryCode(e.target.value.toUpperCase())} className="w-12 rounded-xl border border-white/15 bg-[#070b13] px-1.5 py-2 text-center text-xs text-white uppercase" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <select value={clubRegion} onChange={(e) => setClubRegion(e.target.value as TournamentRegion)} className={inputCls}>
                    <option value="europe">Europe</option><option value="north_america">Amérique du Nord</option>
                    <option value="middle_east">Moyen-Orient</option><option value="asia_pacific">Asie-Pacifique</option><option value="latin_america">Amérique Latine</option>
                </select>
                <select value={clubCategory} onChange={(e) => setClubCategory(e.target.value as VenueCategory)} className={inputCls}>
                    <option value="federation_club">🏆 Club Fédéral / Asso</option><option value="social_lounge">🍸 Lounge &amp; Soirée</option>
                    <option value="traditional_cafe">☕ Café Traditionnel</option><option value="prestige_palace">🏛️ Cercle &amp; Palace</option>
                </select>
                <input type="text" placeholder="Fédération (FFB, WBGF, Libre)" value={clubFederation} onChange={(e) => setClubFederation(e.target.value)} className={`${inputCls} col-span-2 sm:col-span-1`} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input type="text" placeholder="Adresse ou Lieu de RDV (ex: Brasserie Le Central)" value={clubAddress} onChange={(e) => setClubAddress(e.target.value)} data-testid="club-input-address" className={inputCls} />
                <input type="text" placeholder="Horaires (ex: Tous les jeudis dès 19h30)" value={clubSchedule} onChange={(e) => setClubSchedule(e.target.value)} data-testid="club-input-schedule" className={inputCls} />
                <input type="text" placeholder="Site web, page Facebook, Instagram (optionnel)" value={clubUrl} onChange={(e) => setClubUrl(e.target.value)} data-testid="club-input-url" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
                <input type="text" placeholder="Tarif / Adhésion (ex: Entrée libre)" value={clubCost} onChange={(e) => setClubCost(e.target.value)} className={inputCls} />
                <input type="text" placeholder="Ambiance &amp; niveaux acceptés" value={clubAtmosphere} onChange={(e) => setClubAtmosphere(e.target.value)} className={inputCls} />
            </div>
            <label data-testid="club-free-page-offer" className="flex items-start gap-2.5 rounded-xl border border-[#d4af37]/70 bg-gradient-to-r from-[#d4af37]/20 via-amber-500/10 to-[#d4af37]/20 p-3 shadow-[0_0_18px_rgba(212,175,55,0.2)] cursor-pointer select-none">
                <input type="checkbox" checked={createFreePage} onChange={(e) => setCreateFreePage(e.target.checked)} data-testid="club-free-page-checkbox" className="mt-0.5 accent-[#d4af37] rounded" />
                <div className="text-xs">
                    <span className="font-bold text-amber-200">🎁 Page Club Officielle Offerte : </span>
                    <span className="text-slate-200">Pas de site internet ? Nous créons et hébergeons gratuitement une page dédiée pour votre club sur Backgammon Tour.</span>
                </div>
            </label>
            <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-300">Annuler</button>
                <button type="submit" data-testid="submit-club-confirm-btn" className="rounded-xl border border-emerald-400 bg-emerald-500/25 px-5 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/35">✓ Publier mon Club sur la Carte</button>
            </div>
        </form>
    );
};

export default SubmitClubInlineModal;

