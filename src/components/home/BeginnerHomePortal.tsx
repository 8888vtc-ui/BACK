'use client';

import React from 'react';
import { BookOpen, Play } from 'lucide-react';

interface BeginnerHomePortalProps {
    readonly onStartGuidedGame: () => void;
    readonly onOpenAcademy?: () => void;
}

export const BeginnerHomePortal: React.FC<BeginnerHomePortalProps> = React.memo(({
    onStartGuidedGame,
    onOpenAcademy,
}) => {
    const handleOpenAcademy = () => {
        if (onOpenAcademy) {
            onOpenAcademy();
            return;
        }
        if (typeof window !== 'undefined') {
            window.location.assign('/puzzles?mode=beginner-academy');
        }
    };
    return (
        <div data-testid="beginner-home-portal" className="flex flex-col gap-4 w-full max-w-4xl mx-auto py-2">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0b0e14]/90 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1 text-center sm:text-left">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                        🌱 Mode Débutant · Progression Guidée
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white">
                        Apprenez et jouez sans stress, à votre rythme
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
                        Règles simplifiées, explications claires en français courant et conseils bienveillants coup après coup.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* CARTE MAJEURE : Unique bouton Or de l'écran */}
                <div className="flex flex-col justify-between gap-3 rounded-2xl border-2 border-[#D4AF37]/50 bg-gradient-to-b from-[#16120b] to-[#0c0a06] p-5 shadow-[0_8px_30px_rgba(212,175,55,0.12)]">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#f3d27a]">
                                <BookOpen size={20} strokeWidth={1.8} />
                            </span>
                            <span className="rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-mono font-bold text-[#f3d27a]">
                                +2 000 PTS
                            </span>
                        </div>
                        <h3 className="text-base font-black text-[#f7f3e8]">
                            Académie d&apos;Initiation &amp; Règles (3 min)
                        </h3>
                        <p className="text-xs text-stone-300 leading-relaxed">
                            Les bases du jeu expliquées simplement avec 10 petits quiz interactifs pour obtenir votre Diplôme d&apos;Initié.
                        </p>
                    </div>
                    <button
                        type="button"
                        data-testid="beginner-academy-btn"
                        onClick={handleOpenAcademy}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#f5d98b] to-[#b88924] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg hover:brightness-105 active:scale-95 transition"
                    >
                        <span>DÉCOUVRIR LES RÈGLES EN 3 MIN →</span>
                    </button>
                </div>

                {/* CARTE SECONDAIRE */}
                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e121a]/80 p-5 hover:border-white/20 transition">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-stone-200">
                                <Play size={20} strokeWidth={1.8} />
                            </span>
                            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono font-semibold text-stone-300">
                                Bot Doux
                            </span>
                        </div>
                        <h3 className="text-base font-black text-white">
                            Jouer ma première partie guidée
                        </h3>
                        <p className="text-xs text-stone-300 leading-relaxed">
                            Affrontez un adversaire doux qui joue à votre niveau, avec des suggestions en français pour ne jamais être perdu.
                        </p>
                    </div>
                    <button
                        type="button"
                        data-testid="beginner-play-btn"
                        onClick={onStartGuidedGame}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition active:scale-95"
                    >
                        <span>LANCER UNE PARTIE GUIDÉE</span>
                    </button>
                </div>
            </div>
        </div>
    );
});
BeginnerHomePortal.displayName = 'BeginnerHomePortal';

