'use client';

/**
 * Modale de Référencement / Soumission de Tournoi.
 *
 * Rôle : Permet aux directeurs de tournois, clubs et organisateurs de proposer un nouveau
 * tournoi (Mega, Grand, Moyen) avec validation stricte avant ajout au calendrier officiel.
 *
 * Dépendances : TournamentSubmissionInput, validateTournamentSubmission.
 * Retrait : Supprimer ce fichier et ses imports dans TournamentWorldHubView.
 * Strictement 0 `any`, React.memo, budget <= 270 lignes (SCALABILITY.md R1 & R2).
 */

import React, { useState, useCallback } from 'react';
import type {
    TournamentSubmissionInput,
    TournamentTier,
    TournamentRegion,
    TournamentFederation,
    TournamentCurrency,
} from '../../features/tournaments/tournamentTypes';
import { validateTournamentSubmission } from '../../features/tournaments/tournamentEngine';

export interface SubmitTournamentModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onSubmitTournament: (input: TournamentSubmissionInput) => Promise<void>;
}

const INITIAL_FORM: TournamentSubmissionInput = {
    name: '', tier: 'moyen', startDate: '', endDate: '', countryCode: 'FR',
    countryName: 'France', city: '', venueName: '', region: 'europe',
    federation: 'FFB', entryFeeMain: 100, currency: 'EUR', estimatedPrizePool: null,
    matchLengthMain: 11, clockRules: 'Fischer 12s/move + 2min/pt',
    officialUrl: '', organizerName: '', descriptionFr: '',
};

const inputCls = 'w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-white focus:border-[#d4af37] focus:outline-none text-xs';
const selectCls = 'w-full rounded-lg border border-white/15 bg-[#141b2d] px-2.5 py-1.5 text-white focus:border-[#d4af37] focus:outline-none text-xs';

const SubmitTournamentModalComponent: React.FC<SubmitTournamentModalProps> = ({ isOpen, onClose, onSubmitTournament }) => {
    const [form, setForm] = useState<TournamentSubmissionInput>(INITIAL_FORM);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const setField = useCallback((k: keyof TournamentSubmissionInput, v: string | number | null) => {
        setForm((prev) => ({ ...prev, [k]: v }));
        setErrorMsg(null);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validateTournamentSubmission(form);
        if (!validation.valid) {
            setErrorMsg(validation.errors[0] ?? 'Formulaire invalide.');
            return;
        }
        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            await onSubmitTournament(form);
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setForm(INITIAL_FORM);
                onClose();
            }, 1800);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la soumission.');
        } finally {
            setIsSubmitting(false);
        }
    }, [form, onSubmitTournament, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto" data-testid="submit-tournament-modal" role="dialog" aria-modal="true">
            <div className="relative w-full max-w-xl rounded-2xl border border-[#d4af37]/40 bg-[#0b101b] p-5 shadow-2xl text-slate-200">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                        <span>🏆</span> Proposer un Tournoi Officiel
                    </h3>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition" aria-label="Fermer">✕</button>
                </div>

                {isSuccess ? (
                    <div className="py-10 text-center" data-testid="submit-success-banner">
                        <div className="text-3xl">✅</div>
                        <h4 className="mt-2 text-base font-bold text-emerald-400">Tournoi Référencé avec Succès !</h4>
                        <p className="mt-1 text-xs text-slate-300">Votre tournoi est désormais visible et prêt pour le calendrier mondial.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2.5 text-xs">
                        {errorMsg && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-red-300" data-testid="submit-error-banner">{errorMsg}</div>}

                        <div>
                            <label className="block font-semibold text-slate-300 mb-0.5">Nom du Tournoi</label>
                            <input type="text" required value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="ex: Open International de Paris" className={inputCls} />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block font-semibold text-slate-300 mb-0.5">Palier</label>
                                <select value={form.tier} onChange={(e) => setField('tier', e.target.value as TournamentTier)} className={selectCls}>
                                    <option value="moyen">🎖️ MOYEN (Régional & Clubs)</option>
                                    <option value="grand">🏆 GRAND (Masters & Nationaux)</option>
                                    <option value="mega">👑 MEGA (Majors & Mondiaux)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-300 mb-0.5">Fédération</label>
                                <select value={form.federation} onChange={(e) => setField('federation', e.target.value as TournamentFederation)} className={selectCls}>
                                    <option value="FFB">FFB</option><option value="WBGF">WBGF</option><option value="USBGF">USBGF</option>
                                    <option value="UKBGF">UKBGF</option><option value="EUBGF">EUBGF</option><option value="WBA">WBA</option><option value="Independent">Indépendant</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block font-semibold text-slate-300 mb-0.5">Début</label>
                                <input type="date" required value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-300 mb-0.5">Fin</label>
                                <input type="date" required value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} className={inputCls} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block font-semibold text-slate-300 mb-0.5">Ville</label>
                                <input type="text" required value={form.city} onChange={(e) => setField('city', e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-300 mb-0.5">Pays (Code 2L)</label>
                                <input type="text" maxLength={2} required value={form.countryCode} onChange={(e) => setField('countryCode', e.target.value.toUpperCase())} className={inputCls} />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-300 mb-0.5">Nom Pays</label>
                                <input type="text" required value={form.countryName} onChange={(e) => setField('countryName', e.target.value)} className={inputCls} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block font-semibold text-slate-300 mb-0.5">Lieu / Hôtel</label>
                                <input type="text" required value={form.venueName} onChange={(e) => setField('venueName', e.target.value)} placeholder="ex: Grand Hôtel" className={inputCls} />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-300 mb-0.5">Région</label>
                                <select value={form.region} onChange={(e) => setField('region', e.target.value as TournamentRegion)} className={selectCls}>
                                    <option value="europe">Europe</option><option value="north_america">Amérique du Nord</option>
                                    <option value="middle_east">Moyen-Orient</option><option value="asia_pacific">Asie-Pacifique</option><option value="latin_america">Amérique Latine</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block font-semibold text-slate-300 mb-0.5">Inscription</label>
                                <input type="number" min={0} required value={form.entryFeeMain} onChange={(e) => setField('entryFeeMain', parseFloat(e.target.value) || 0)} className={inputCls} />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-300 mb-0.5">Devise</label>
                                <select value={form.currency} onChange={(e) => setField('currency', e.target.value as TournamentCurrency)} className={selectCls}>
                                    <option value="EUR">EUR (€)</option><option value="USD">USD ($)</option><option value="GBP">GBP (£)</option><option value="CHF">CHF</option><option value="JPY">JPY (¥)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-300 mb-0.5">Prize Pool</label>
                                <input type="number" min={0} value={form.estimatedPrizePool ?? ''} onChange={(e) => setField('estimatedPrizePool', e.target.value ? parseFloat(e.target.value) : null)} placeholder="Optionnel" className={inputCls} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block font-semibold text-slate-300 mb-0.5">Longueur Match (pts)</label>
                                <input type="number" min={1} max={25} required value={form.matchLengthMain} onChange={(e) => setField('matchLengthMain', parseInt(e.target.value, 10) || 11)} className={inputCls} />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-300 mb-0.5">Organisateur</label>
                                <input type="text" required value={form.organizerName} onChange={(e) => setField('organizerName', e.target.value)} placeholder="Club / Fédération" className={inputCls} />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-300 mb-0.5">URL Officielle</label>
                            <input type="url" required value={form.officialUrl} onChange={(e) => setField('officialUrl', e.target.value)} placeholder="https://..." className={inputCls} />
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-300 mb-0.5">Description (min. 10 car.)</label>
                            <textarea required rows={2} value={form.descriptionFr} onChange={(e) => setField('descriptionFr', e.target.value)} placeholder="Programme, contact..." className={`${inputCls} resize-none`} />
                        </div>

                        <div className="mt-1 flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-xl border border-white/15 px-3 py-1.5 font-semibold text-slate-300 hover:bg-white/5 transition">Annuler</button>
                            <button type="submit" disabled={isSubmitting} className="rounded-xl border border-[#d4af37] bg-gradient-to-r from-amber-600/50 to-yellow-600/40 px-4 py-1.5 font-bold text-[#d4af37] hover:brightness-110 transition shadow-lg">
                                {isSubmitting ? 'Publication...' : 'Publier le Tournoi'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export const SubmitTournamentModal = React.memo(SubmitTournamentModalComponent);
export default SubmitTournamentModal;
