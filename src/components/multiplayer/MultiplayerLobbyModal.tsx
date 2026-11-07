'use client';

/**
 * Modale Multijoueur & Sélecteur de Configuration de Partie — Cercle Monte-Carlo (< 265 lignes, 0 any).
 */

import React, { useState, useEffect } from 'react';
import { Zap, KeyRound, Trophy, Coins, Lock, ShieldCheck, X, Clock, Users } from 'lucide-react';
import type { PlayerEloProfile, MatchmakingState, MultiplayerMatchInfo } from '../../features/multiplayer/types';
import { type ThemeName } from '../../hooks/useBoardTheme';
import { useAuthenticPlayerStats } from '../../hooks/useAuthenticPlayerStats';
import {
    readStoredMatchFormat, storeMatchFormat,
    readStoredClockPreset, storeClockPreset, type MatchClockPreset,
    readStoredOpponentTier, storeOpponentTier, type OpponentTierChoice,
    syncMatchSetupUrl,
} from '../hud/MatchFormatSelector';
import { useTranslation } from '../../i18n';
import AuthModal from '../auth/AuthModal';
import { openTermsAndPrPolicyModal } from '../legal/TermsAndPrPolicyModal';
import { LobbyMatchedVersus } from './LobbyMatchedVersus';
import { LobbyPrivateRoomTab } from './LobbyPrivateRoomTab';
import { LobbySearchingWaitView } from './LobbySearchingWaitView';

export interface MultiplayerLobbyModalProps {
    isOpen: boolean; status: MatchmakingState; localProfile: PlayerEloProfile;
    opponentProfile: PlayerEloProfile | null; matchInfo: MultiplayerMatchInfo | null;
    privateRoomCode: string | null; onStartSearch?: (matchLength: number) => void;
    onCreatePrivateRoom: (matchLength: number) => Promise<string>;
    onJoinPrivateRoom: (code: string) => Promise<void>;
    onCancelSearch: () => void; onClose: () => void; theme?: ThemeName;
}

const MATCH_FORMATS: ReadonlyArray<{ pts: number; label: string; subFr: string; subEn: string }> = [
    { pts: 3, label: '3 pts', subFr: 'Rapide', subEn: 'Fast' },
    { pts: 5, label: '5 pts', subFr: 'Classique Club', subEn: 'Classic Club' },
    { pts: 7, label: '7 pts', subFr: 'Tournoi', subEn: 'Tournament' },
    { pts: 11, label: '11 pts', subFr: 'Championnat', subEn: 'Championship' },
    { pts: 0, label: 'Money Game', subFr: '1 pt · Jacoby', subEn: '1 pt · Jacoby' },
];

const CLOCK_PRESETS: ReadonlyArray<{ id: MatchClockPreset; labelFr: string; labelEn: string; subFr: string; subEn: string }> = [
    { id: 'blitz', labelFr: 'Blitz', labelEn: 'Blitz', subFr: '3 min + 8s / coup', subEn: '3 min + 8s / move' },
    { id: 'standard', labelFr: 'Standard / Club', labelEn: 'Standard / Club', subFr: '10 min + 8s / coup', subEn: '10 min + 8s / move' },
    { id: 'tournament', labelFr: 'Tournoi Master', labelEn: 'Master Tournament', subFr: '14 min + 12s / coup', subEn: '14 min + 12s / move' },
    { id: 'unlimited', labelFr: 'Sans Horloge', labelEn: 'No Clock', subFr: 'À votre rythme', subEn: 'At your own pace' },
];

const OPPONENT_TIERS: ReadonlyArray<{ id: OpponentTierChoice; labelFr: string; labelEn: string }> = [
    { id: 'auto', labelFr: 'Auto (Mon niveau)', labelEn: 'Auto (My level)' },
    { id: 'beginner', labelFr: 'Club / Débutant', labelEn: 'Club / Beginner' },
    { id: 'intermediate', labelFr: 'Confirmé / Tournoi', labelEn: 'Confirmed / Tourney' },
    { id: 'expert', labelFr: 'Expert / Master', labelEn: 'Expert / Master' },
];

export default function MultiplayerLobbyModal({
    isOpen, status, localProfile, opponentProfile, matchInfo, privateRoomCode,
    onStartSearch, onCreatePrivateRoom, onJoinPrivateRoom, onCancelSearch, onClose,
}: MultiplayerLobbyModalProps) {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const stats = useAuthenticPlayerStats();
    const [selectedLength, setSelectedLength] = useState<number>(() => {
        if (typeof window === 'undefined') return 5;
        return localStorage.getItem('backgammon_match_format') !== null ? readStoredMatchFormat() : 5;
    });
    const [selectedClock, setSelectedClock] = useState<MatchClockPreset>(() => readStoredClockPreset());
    const [selectedTier, setSelectedTier] = useState<OpponentTierChoice>(() => readStoredOpponentTier());
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

    useEffect(() => {
        if (!isOpen) return;
        if (typeof window !== 'undefined' && localStorage.getItem('backgammon_match_format') !== null) {
            setSelectedLength(readStoredMatchFormat());
        }
        setSelectedClock(readStoredClockPreset());
        setSelectedTier(readStoredOpponentTier());
    }, [isOpen]);

    useEffect(() => {
        if (status !== 'searching' || privateRoomCode) { setElapsedSeconds(0); return; }
        setElapsedSeconds(0);
        const timer = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [status, privateRoomCode]);

    if (!isOpen) return null;

    const isGuest = localProfile.isGuest !== undefined ? localProfile.isGuest : !stats.canHavePR;
    const displayName = isGuest ? (isEn ? 'Guest Player' : 'Joueur Invité') : (localProfile.displayName || stats.pseudo || (isEn ? 'Player' : 'Joueur'));
    const isMatched = (status === 'matched' || (status === 'connecting' && opponentProfile)) && Boolean(opponentProfile && matchInfo);
    const isSearchingPublic = status === 'searching' && !privateRoomCode;

    const handleLaunchSearch = () => {
        storeMatchFormat(selectedLength); storeClockPreset(selectedClock); storeOpponentTier(selectedTier);
        syncMatchSetupUrl(selectedLength, selectedClock); onStartSearch?.(selectedLength);
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in" data-testid="multiplayer-lobby-modal">
                <div className="relative w-full max-w-2xl max-h-[94dvh] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/98 p-3.5 sm:p-5 text-slate-100 shadow-2xl transition-all">
                    <button type="button" data-testid="close-lobby-button" onClick={onClose} className="absolute top-3.5 right-3.5 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white transition-colors" aria-label={isEn ? 'Close multiplayer lobby' : 'Fermer le salon multijoueur'}>
                        <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>

                    <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5 pr-9 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D4AF37]/40 bg-amber-500 text-sm font-black text-slate-950 shadow-sm">
                                {localProfile.avatarUrl ? <img src={localProfile.avatarUrl} alt={displayName} className="h-full w-full object-cover" /> : displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-2 min-w-0">
                                    <h2 className="text-sm sm:text-base font-extrabold text-white truncate">{displayName}</h2>
                                    {isGuest && <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-300">{isEn ? 'Guest' : 'Invité'}</span>}
                                </div>
                                {isGuest ? (
                                    <div className="flex flex-wrap items-center gap-1.5 text-xs" data-testid="lobby-guest-pr-locked-badge">
                                        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-stone-300">
                                            <Lock className="w-3 h-3 text-[#D4AF37]" strokeWidth={1.5} />
                                            <span>{isEn ? 'Guest Mode • Friendly Online Match (Account required to activate PR & Elo Rating)' : 'Mode Invité • Match Amical en Ligne (Compte requis pour activer PR & Classement Elo)'}</span>
                                        </span>
                                        <button type="button" data-testid="lobby-guest-sign-in-cta" onClick={() => setIsAuthModalOpen(true)} className="text-[11px] font-bold text-[#D4AF37] hover:underline whitespace-nowrap">{isEn ? '[Sign in to activate my PR →]' : '[Se connecter pour activer mon PR →]'}</button>
                                        <button type="button" data-testid="lobby-open-terms-clause-btn" onClick={openTermsAndPrPolicyModal} className="text-[11px] font-medium text-stone-400 hover:text-white underline whitespace-nowrap">{isEn ? 'ToS §4' : 'Clause CGU §4'}</button>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs" data-testid="lobby-authenticated-stats-row">
                                        <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
                                        <span className="font-semibold text-[#D4AF37]">{isEn ? 'Verified Account' : 'Compte Certifié'}</span>
                                        <span className="text-slate-600">•</span>
                                        <span className="font-mono font-bold text-amber-300">{stats.eloRating ?? localProfile.rating} Elo</span>
                                        <span className="text-slate-600">•</span>
                                        <span className="rounded border border-emerald-400/40 bg-emerald-950/60 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                                            {stats.hasRealPR && stats.globalPR !== null ? `PR ${stats.globalPR.toFixed(1)}` : (isEn ? 'PR: Calibrating' : 'PR : En calibrage')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-200 shrink-0">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" /><span>{isEn ? 'Online' : 'En ligne'}</span>
                        </div>
                    </div>

                    {isMatched && opponentProfile && matchInfo ? (
                        <LobbyMatchedVersus localProfile={localProfile} opponentProfile={opponentProfile} matchInfo={matchInfo} />
                    ) : isSearchingPublic ? (
                        <LobbySearchingWaitView elapsedSeconds={elapsedSeconds} selectedLength={selectedLength} selectedClock={selectedClock} playerRating={isGuest ? null : (stats.eloRating ?? localProfile.rating)} playerAveragePr={isGuest ? null : stats.globalPR} onCancelSearch={onCancelSearch} />
                    ) : (
                        <div className="space-y-3">
                            {!privateRoomCode && (
                                <>
                                    <div data-testid="modal-match-format-selector">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">{isEn ? '1. Match Format:' : '1. Type de Match :'}</label>
                                            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-amber-300">
                                                {selectedLength === 0 ? <><Coins className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} /><span>{isEn ? 'Money Game · Jacoby Rule' : 'Money Game · Règle de Jacoby'}</span></> : <><Trophy className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} /><span>{isEn ? `Match ${selectedLength} pts · Crawford Rule` : `Match ${selectedLength} pts · Règle de Crawford`}</span></>}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {MATCH_FORMATS.map((f) => (
                                                <button key={f.pts} type="button" data-testid={`modal-format-${f.pts}`} onClick={() => { setSelectedLength(f.pts); storeMatchFormat(f.pts); }} className={`flex flex-col items-center justify-center rounded-xl border py-1.5 px-1 transition-all ${selectedLength === f.pts ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white shadow-sm' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white'}`}>
                                                    <span className="text-xs font-bold">{f.label}</span>
                                                    <span className="text-[11px] text-slate-400">{isEn ? f.subEn : f.subFr}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div data-testid="modal-clock-preset-selector">
                                        <label className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                                            <Clock className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} /><span>{isEn ? '2. Time Control / Clock (WBGF):' : '2. Horloge / Cadence WBGF :'}</span>
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                            {CLOCK_PRESETS.map((c) => (
                                                <button key={c.id} type="button" data-testid={`modal-clock-${c.id}`} onClick={() => { setSelectedClock(c.id); storeClockPreset(c.id); }} className={`flex flex-col items-center justify-center rounded-xl border py-1.5 px-2 transition-all ${selectedClock === c.id ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white shadow-sm' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white'}`}>
                                                    <span className="text-xs font-bold">{isEn ? c.labelEn : c.labelFr}</span>
                                                    <span className="text-[11px] text-slate-400 font-mono">{isEn ? c.subEn : c.subFr}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div data-testid="modal-opponent-tier-selector">
                                        <label className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                                            <Users className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} /><span>{isEn ? '3. Opponent Caliber:' : '3. Calibre de l’Adversaire :'}</span>
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                            {OPPONENT_TIERS.map((t) => (
                                                <button key={t.id} type="button" data-testid={`modal-tier-${t.id}`} onClick={() => { setSelectedTier(t.id); storeOpponentTier(t.id); }} className={`flex items-center justify-center rounded-xl border py-1.5 px-2 text-xs font-bold transition-all ${selectedTier === t.id ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white shadow-sm' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white'}`}>
                                                    <span>{isEn ? t.labelEn : t.labelFr}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <section data-testid="lobby-action-matchmaking" className="rounded-xl border border-white/10 bg-slate-900/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-0.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                                                    <Zap className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} /><span>{isEn ? 'Quick Matchmaking' : 'Matchmaking Rapide'}</span>
                                                </span>
                                                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-amber-300 whitespace-nowrap shrink-0">
                                                    {isGuest ? (isEn ? 'Friendly Online Match' : 'Match Amical en Ligne') : (isEn ? 'Ranked Elo' : 'Classé Elo')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-snug">
                                                {isGuest ? (isEn ? 'Find an online opponent immediately.' : 'Trouvez immédiatement un adversaire en ligne.') : (isEn ? `Find an online opponent immediately (${stats.eloRating ?? localProfile.rating} Elo).` : `Trouvez immédiatement un adversaire en ligne (${stats.eloRating ?? localProfile.rating} Elo).`)}
                                            </p>
                                        </div>
                                        <button type="button" onClick={handleLaunchSearch} data-testid="start-matchmaking-button" className="shrink-0 inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-[#E5C158] via-[#D4AF37] to-[#B5902B] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black shadow-sm hover:brightness-105 transition-all">
                                            <span>{isEn ? 'START SEARCH' : 'LANCER LA RECHERCHE'}</span>
                                        </button>
                                    </section>
                                </>
                            )}

                            <section data-testid="lobby-action-private-room" className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-200">
                                        <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} /><span>{isEn ? 'Private Room by Code' : 'Salon Privé par Code'}</span>
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-400">{isEn ? 'Friend & Club · Code BG-XXXX' : 'Ami & Club · Code BG-XXXX'}</span>
                                </div>
                                <LobbyPrivateRoomTab privateRoomCode={privateRoomCode} selectedLength={selectedLength} onCreatePrivateRoom={onCreatePrivateRoom} onJoinPrivateRoom={onJoinPrivateRoom} onCancelSearch={onCancelSearch} />
                            </section>
                        </div>
                    )}
                </div>
            </div>
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => { setIsAuthModalOpen(false); stats.refreshStats(); }} />
        </>
    );
}
