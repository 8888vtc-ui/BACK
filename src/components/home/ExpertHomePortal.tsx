'use client';

import React from 'react';
import { Trophy, BrainCircuit } from 'lucide-react';

interface ExpertHomePortalProps {
    readonly onStartExpertMatch: (length: number) => void;
    readonly onOpen3PlyQuizzes: () => void;
}

export const ExpertHomePortal: React.FC<ExpertHomePortalProps> = React.memo(({
    onStartExpertMatch,
    onOpen3PlyQuizzes,
}) => {
    return (
        <div data-testid="expert-home-portal" className="flex flex-col gap-4 w-full max-w-4xl mx-auto py-2">
            <div className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-r from-[#120d08] via-[#16100a] to-[#120d08] p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#f3d27a]">
                        🏆 Cockpit Pro · Moteur Open Sage 3-Ply (PR 0.23)
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-[#f7f3e8]">
                        Haute précision de tournoi &amp; Télémétrie complète
                    </h2>
                    <p className="text-xs text-stone-300">
                        Normes eXtreme Gammon (XG) : suivi d&apos;équité ΔEMG, horloges Bronstein officielles et formats 5 à 21 points.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* MATCH DE TOURNOI EXPERT */}
                <div className="flex flex-col justify-between gap-3 rounded-2xl border-2 border-[#D4AF37]/50 bg-gradient-to-b from-[#18120a] to-[#0b0805] p-5 shadow-lg">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#f3d27a]">
                                <Trophy size={20} />
                            </span>
                            <span className="rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-0.5 font-mono text-[10px] font-black text-[#f3d27a]">
                                WBGF STANDARDS
                            </span>
                        </div>
                        <h3 className="text-base font-black text-[#f7f3e8]">Match Officiel de Tournoi</h3>
                        <p className="text-xs text-stone-300">
                            Affrontez l&apos;IA Grand-Maître 3-ply ou un champion de ligue sous chronomètre Bronstein officiel.
                        </p>
                        <div className="grid grid-cols-4 gap-1.5 mt-2">
                            {[5, 7, 9, 11].map((pts) => (
                                <button
                                    key={pts}
                                    type="button"
                                    onClick={() => onStartExpertMatch(pts)}
                                    className="rounded-lg border border-white/10 bg-white/[0.04] py-1 text-center font-mono text-xs font-bold text-stone-200 hover:border-[#D4AF37] hover:text-[#f3d27a] transition active:scale-95"
                                >
                                    {pts} pts
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        type="button"
                        data-testid="expert-play-7pts-btn"
                        onClick={() => onStartExpertMatch(7)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#f5d98b] to-[#b88924] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow hover:brightness-105 active:scale-95 transition"
                    >
                        LANCER UN MATCH 7 PTS (STANDARD) →
                    </button>
                </div>

                {/* BANQUE DE 50 000 QUIZ 3-PLY */}
                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e121a]/80 p-5 hover:border-white/20 transition">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-stone-200">
                                <BrainCircuit size={20} />
                            </span>
                            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                                6 300+ CERTIFIÉS
                            </span>
                        </div>
                        <h3 className="text-base font-black text-white">Banque de Quiz Certifiés 3-Ply</h3>
                        <p className="text-xs text-stone-300">
                            Entraînement chirurgical sur positions réelles sans aucune course pure (80 % Dames, 20 % Décisions de Videau).
                        </p>
                    </div>
                    <button
                        type="button"
                        data-testid="expert-quizzes-btn"
                        onClick={onOpen3PlyQuizzes}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition active:scale-95"
                    >
                        ACCÉDER AUX QUIZ 3-PLY
                    </button>
                </div>
            </div>
        </div>
    );
});
ExpertHomePortal.displayName = 'ExpertHomePortal';

