'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Sparkles, Zap, Brain, GraduationCap, CheckCircle2, Wrench } from 'lucide-react';
import PlayerProfileCard from './PlayerProfileCard';
import LearningModulesGrid from './LearningModulesGrid';
import RecentMatchesSummary from './RecentMatchesSummary';
import { VelvetSeoEncyclopediaFooter } from './LobbyTrainingSubmenu';
import type { AcademyProgressSnapshot, RecentMatchEntry } from '../../features/progression/userProgressionService';
import type { LobbyModuleId } from './LobbyScreen';

export function checkIsLocalDevEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    return (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.search.includes('founder=secret777')
    );
}

export interface LobbyPlayerHubSectionProps {
    readonly showOptions: boolean;
    readonly displayName: string | null;
    readonly snapshot: AcademyProgressSnapshot;
    readonly recentMatches: RecentMatchEntry[];
    readonly onOpenModule?: (moduleId: LobbyModuleId) => void;
    readonly onStartQuickMatch: () => void;
}

export const LobbyPlayerHubSection: React.FC<LobbyPlayerHubSectionProps> = ({
    showOptions, displayName, snapshot, recentMatches, onOpenModule, onStartQuickMatch,
}) => {
    return (
        <section aria-label="Espace joueur et progression" data-testid="lobby-secondary-section" className={showOptions ? 'sr-only' : 'flex w-full flex-col gap-3 pb-2'}>
            <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#0B0E14]/90 p-4 backdrop-blur-md shadow-xl">
                <PlayerProfileCard displayName={displayName} eloRating={snapshot.eloRating} averagePR={snapshot.averagePR} gamesPlayed={snapshot.gamesPlayed} winsCount={snapshot.winsCount} puzzleStreak={snapshot.puzzleStreak} onOpenReview={() => onOpenModule?.('stats')} />
                <LearningModulesGrid snapshot={snapshot} onOpenModule={onOpenModule} onStartQuickMatch={onStartQuickMatch} />
            </div>
            {recentMatches.length > 0 && (
                <RecentMatchesSummary matches={recentMatches} onReviewMatch={() => onOpenModule?.('stats')} onOpenImportExport={() => onOpenModule?.('import_export')} />
            )}
        </section>
    );
};

export interface VelvetCurtainTeaserViewProps {
    readonly isLocalDev: boolean;
    readonly onUnlockLocalLab?: () => void;
}

export const VelvetCurtainTeaserView: React.FC<VelvetCurtainTeaserViewProps> = ({
    isLocalDev,
    onUnlockLocalLab,
}) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmitWaitlist = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !email.includes('@')) return;
        try {
            const existingRaw = localStorage.getItem('bgtour_vip_waitlist_emails');
            const list: string[] = existingRaw ? JSON.parse(existingRaw) : [];
            if (!list.includes(email.trim())) list.push(email.trim());
            localStorage.setItem('bgtour_vip_waitlist_emails', JSON.stringify(list));
        } catch { /* ignore */ }
        setSubmitted(true);
    };

    return (
        <div
            data-testid="velvet-curtain-teaser-view"
            className="min-h-dvh w-full overflow-y-auto overflow-x-hidden bg-[#050505] bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,#1a1408_0%,#090a0f_55%,#040406_100%)] text-[#f7f3e8] px-4 sm:px-8 py-6"
        >
            {/* Barre supérieure minimaliste Cercle Monte-Carlo */}
            <header className="max-w-5xl mx-auto flex items-center justify-between gap-3 pb-6 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-slate-950 shadow-md">
                        <svg aria-hidden="true" viewBox="0 0 32 32" className="h-5 w-5" fill="none">
                            <polygon points="10,2 22,2 30,10 30,22 22,30 10,30 2,22 2,10" fill="#0f172a" stroke="#f3c65f" strokeWidth="1.6" />
                            <circle cx="12.2" cy="16" r="4" fill="#0f172a" stroke="#f3c65f" strokeWidth="1.3" />
                            <circle cx="19.8" cy="16" r="4" fill="#f3c65f" />
                        </svg>
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-black tracking-wider text-white">BACKGAMMON</span>
                        <span className="rounded border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-0.5 text-xs font-mono font-bold uppercase tracking-wider text-[#f3c65f]">
                            TOUR
                        </span>
                    </div>
                </div>

                {isLocalDev && onUnlockLocalLab && (
                    <button
                        type="button"
                        data-testid="unlock-local-lab-btn"
                        onClick={onUnlockLocalLab}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-950/80 hover:bg-emerald-900 px-3.5 py-2 text-xs font-bold text-emerald-200 shadow-lg transition"
                    >
                        <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                        <span>🔧 Mode Laboratoire Hors-Ligne (Ouvrir le Jeu)</span>
                    </button>
                )}
            </header>

            {/* Section Hero Mystère Monte-Carlo */}
            <section className="max-w-4xl mx-auto text-center pt-10 sm:pt-14 pb-10 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/12 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-widest text-[#f3d27a] shadow-[0_0_25px_rgba(212,175,55,0.2)] animate-pulse">
                    <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>🔒 CERCLE PRIVÉ EN PRÉPARATION • OUVERTURE PROCHAINE</span>
                </div>

                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                    5 000 ans d’histoire.{' '}
                    <span className="bg-gradient-to-r from-[#f7e4a3] via-[#D4AF37] to-[#b88924] bg-clip-text text-transparent">
                        Une nouvelle ère s’apprête à commencer.
                    </span>
                </h1>

                <p className="text-sm sm:text-base md:text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed">
                    Quelque chose d’inédit se prépare dans l’univers du Backgammon. Pour ceux qui n’ont jamais osé apprendre comme pour les maîtres de tournoi : découvrez bientôt une expérience où l’Intelligence Artificielle 3-Ply rencontre l’élégance de Monte-Carlo.
                </p>

                {/* Capture VIP : Soyez parmi les 500 premiers invités */}
                <div className="max-w-xl mx-auto rounded-3xl border border-[#D4AF37]/35 bg-gradient-to-b from-[#141109]/95 to-[#090b10]/95 p-5 sm:p-6 shadow-[0_16px_50px_rgba(0,0,0,0.85)] space-y-3">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#f3d27a]">
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        <span>SOYEZ PARMI LES 500 PREMIERS INVITÉS</span>
                    </div>

                    {submitted ? (
                        <div
                            data-testid="vip-waitlist-confirmation"
                            className="flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/50 p-4 text-xs sm:text-sm font-bold text-emerald-200"
                        >
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            <span>Votre demande est enregistrée. Vous serez averti en avant-première dès l’ouverture des portes.</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitWaitlist} className="flex flex-col sm:flex-row gap-2.5">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Votre adresse email privée..."
                                aria-label="Votre adresse email pour l'invitation prioritaire"
                                data-testid="vip-waitlist-email-input"
                                className="flex-1 rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-xs sm:text-sm text-white placeholder-stone-500 focus:border-[#D4AF37] focus:outline-none"
                            />
                            <button
                                type="submit"
                                data-testid="vip-waitlist-submit-btn"
                                className="rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#f5d98b] to-[#b88924] px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg hover:brightness-105 active:scale-95 transition whitespace-nowrap"
                            >
                                ✨ DEMANDER MON INVITATION PRIORITAIRE (+ STATUT FONDATEUR)
                            </button>
                        </form>
                    )}
                </div>
            </section>

            {/* Les 3 Teasers « Ce qui vous attend derrière les portes » */}
            <section className="max-w-5xl mx-auto py-4 space-y-4">
                <h2 className="text-center text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-stone-400">
                    CE QUI VOUS ATTEND DERRIÈRE LES PORTES
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-[#0B0E14]/90 p-5 space-y-2.5 shadow-xl">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#f3d27a] border border-[#D4AF37]/30">
                            <GraduationCap className="w-5 h-5" />
                        </span>
                        <h3 className="text-base font-black text-white">🎭 Le Mentor Invisible</h3>
                        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                            Apprenez en 3 minutes ce que d’autres mettent 3 ans à comprendre. Un Professeur interactif vous murmure les secrets du plateau en temps réel.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0B0E14]/90 p-5 space-y-2.5 shadow-xl">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Zap className="w-5 h-5" />
                        </span>
                        <h3 className="text-base font-black text-white">⚡ Le Sanctuaire du Jeu Pur</h3>
                        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                            Zéro friction, zéro attente. Des duels instantanés calibrés à votre niveau exact et des invitations entre amis en un éclair.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0B0E14]/90 p-5 space-y-2.5 shadow-xl">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <Brain className="w-5 h-5" />
                        </span>
                        <h3 className="text-base font-black text-white">🧠 L’Oracle 3-Ply</h3>
                        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                            Plus de 50 000 situations certifiées et un studio capable de transformer chacune de vos erreurs en leçon sur mesure.
                        </p>
                    </div>
                </div>
            </section>

            {/* Grand Pied de Page Encyclopédique SEO (40+ Guides, Règles, Videau & 15 Ouvertures) */}
            <VelvetSeoEncyclopediaFooter />
        </div>
    );
};

export const ProductionVelvetRouteGuard: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => {
    const [status, setStatus] = useState<'checking' | 'allowed' | 'locked'>('checking');

    useEffect(() => {
        if (checkIsLocalDevEnvironment()) {
            setStatus('allowed');
        } else {
            setStatus('locked');
            try {
                window.location.replace('/');
            } catch { /* ignore */ }
        }
    }, []);

    if (status === 'locked') {
        return <VelvetCurtainTeaserView isLocalDev={false} />;
    }
    return <>{children}</>;
};


