'use client';

import React from 'react';
import { Swords, Target, Share2 } from 'lucide-react';

interface IntermediateHomePortalProps {
    readonly onFindOpponent: () => void;
    readonly onInviteFriend: () => void;
    readonly onOpenQuizzes: () => void;
}

export const IntermediateHomePortal: React.FC<IntermediateHomePortalProps> = React.memo(({
    onFindOpponent,
    onInviteFriend,
    onOpenQuizzes,
}) => {
    return (
        <div data-testid="intermediate-home-portal" className="flex flex-col gap-4 w-full max-w-4xl mx-auto py-2">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0b0e14]/90 p-5 backdrop-blur-xl shadow-xl flex flex-col gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#f3c65f]">
                    ♟️ Mode Club · Précision &amp; Entraînement
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                    Progressez avec l&apos;analyse d&apos;un moteur de niveau mondial
                </h2>
                <p className="text-xs sm:text-sm text-stone-300">
                    Chaque décision est analysée en direct pour mesurer votre indice de précision (PR) et éliminer vos erreurs récurrentes.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. TROUVER UN ADVERSAIRE (Bouton Or) */}
                <div className="flex flex-col justify-between gap-3 rounded-2xl border-2 border-[#D4AF37]/50 bg-gradient-to-b from-[#18130b] to-[#0d0a06] p-4 shadow-[0_6px_24px_rgba(212,175,55,0.12)]">
                    <div className="flex flex-col gap-1.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4AF37]/20 text-[#f3d27a]">
                            <Swords size={18} />
                        </span>
                        <h3 className="text-sm font-black text-[#f7f3e8]">Match Compétitif Club</h3>
                        <p className="text-[11px] text-stone-300">Parties en 3, 5 ou 7 points avec pendule et analyse de fin de match.</p>
                    </div>
                    <button
                        type="button"
                        data-testid="intermediate-play-btn"
                        onClick={onFindOpponent}
                        className="w-full rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b88924] px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow hover:brightness-105 active:scale-95 transition"
                    >
                        TROUVER UN ADVERSAIRE →
                    </button>
                </div>

                {/* 2. INVITER UN AMI */}
                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e121a]/80 p-4 hover:border-white/20 transition">
                    <div className="flex flex-col gap-1.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-stone-200">
                            <Share2 size={18} />
                        </span>
                        <h3 className="text-sm font-black text-white">Inviter un Ami</h3>
                        <p className="text-[11px] text-stone-300">Lien direct 1-clic pour jouer ensemble en moins de 3 secondes sans inscription.</p>
                    </div>
                    <button
                        type="button"
                        data-testid="intermediate-invite-btn"
                        onClick={onInviteFriend}
                        className="w-full rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition active:scale-95"
                    >
                        CRÉER UN SALON PRIVÉ
                    </button>
                </div>

                {/* 3. QUIZ ADAPTÉS N+1 */}
                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e121a]/80 p-4 hover:border-white/20 transition">
                    <div className="flex flex-col gap-1.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-stone-200">
                            <Target size={18} />
                        </span>
                        <h3 className="text-sm font-black text-white">Quiz Adaptés (N+1)</h3>
                        <p className="text-[11px] text-stone-300">Problèmes tactiques ciblés pile au-dessus de votre niveau pour accélérer votre progression.</p>
                    </div>
                    <button
                        type="button"
                        data-testid="intermediate-quizzes-btn"
                        onClick={onOpenQuizzes}
                        className="w-full rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition active:scale-95"
                    >
                        S&apos;ENTRAÎNER MAINTENANT
                    </button>
                </div>
            </div>
        </div>
    );
});
IntermediateHomePortal.displayName = 'IntermediateHomePortal';

