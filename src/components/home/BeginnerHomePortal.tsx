'use client';

import React, { useState } from 'react';
import { BookOpen, Play, Sparkles, Dices, GraduationCap } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { BeginnerInteractiveGuideModal } from '../beginner/BeginnerInteractiveGuideModal';
import { BeginnerOpeningMovesExplorer } from '../beginner/BeginnerOpeningMovesExplorer';

interface BeginnerHomePortalProps {
    readonly onStartGuidedGame: () => void;
    readonly onOpenAcademy?: () => void;
}

export const BeginnerHomePortal: React.FC<BeginnerHomePortalProps> = React.memo(({
    onStartGuidedGame,
    onOpenAcademy,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
    const [isOpeningExplorerOpen, setIsOpeningExplorerOpen] = useState<boolean>(false);

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
        <>
            <div data-testid="beginner-home-portal" className="flex flex-col gap-5 w-full max-w-5xl mx-auto py-3">
                {/* En-tête épuré sans boîte lourde */}
                <div className="flex flex-col gap-1 text-center sm:text-left px-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
                        <span>{isEn ? 'BEGINNER MODE • GUIDED DISCOVERY' : 'MODE DÉBUTANT • DÉCOUVERTE GUIDÉE'}</span>
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                        {isEn ? 'Learn the rules and play at your own pace' : 'Apprenez les règles et jouez à votre rythme'}
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
                        {isEn
                            ? 'The charm of dice combined with strategy, explained simply step by step.'
                            : 'Le charme des dés allié à la stratégie, expliqué simplement pas à pas.'}
                    </p>
                </div>

                {/* Grille 2 Cartes Clés : Académie 10 Quiz & Match Guidé */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* CARTE MAJEURE : Unique bouton Or de l'écran */}
                    <div className="flex flex-col justify-between gap-4 rounded-2xl border-2 border-[#D4AF37]/50 bg-gradient-to-b from-[#16120b] to-[#0c0a06] p-5 shadow-[0_8px_30px_rgba(212,175,55,0.12)]">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#f3d27a]">
                                    <BookOpen size={20} strokeWidth={1.8} />
                                </span>
                                <span className="rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2.5 py-0.5 text-xs font-mono font-bold text-[#f3d27a]">
                                    +2 000 PTS
                                </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-[#f7f3e8]">
                                {isEn ? 'Initiation Academy (3 min)' : "Académie d'Initiation (3 min)"}
                            </h3>
                            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                                {isEn
                                    ? '10 interactive mini-lessons on the board to earn your Initiate Diploma.'
                                    : "10 petites leçons interactives sur le plateau pour obtenir votre Diplôme d'Initié."}
                            </p>
                        </div>
                        <button
                            type="button"
                            data-testid="beginner-academy-btn"
                            onClick={handleOpenAcademy}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#f5d98b] to-[#b88924] px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg hover:brightness-105 active:scale-95 transition"
                        >
                            <span>{isEn ? 'DISCOVER RULES IN 3 MIN →' : 'DÉCOUVRIR LES RÈGLES EN 3 MIN →'}</span>
                        </button>
                    </div>

                    {/* CARTE SECONDAIRE : Match avec Coach */}
                    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#0e121a]/80 p-5 hover:border-white/20 transition">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-stone-200">
                                    <Play size={20} strokeWidth={1.8} />
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-mono font-semibold text-stone-300">
                                    <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
                                    <span>{isEn ? 'The Professor' : 'Le Professeur'}</span>
                                </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-white">
                                {isEn ? 'Play my first guided match' : 'Jouer ma première partie guidée'}
                            </h3>
                            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                                {isEn
                                    ? 'Play step by step with caring live guidance from the Professor.'
                                    : 'Jouez pas à pas avec les conseils bienveillants du Professeur en direct.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            data-testid="beginner-play-btn"
                            onClick={onStartGuidedGame}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition active:scale-95"
                        >
                            <span>{isEn ? 'START GUIDED MATCH' : 'LANCER UNE PARTIE GUIDÉE'}</span>
                        </button>
                    </div>
                </div>

                {/* Barre fine des 2 boutons-capsules secondaires */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <button
                        type="button"
                        data-testid="beginner-open-guide-btn"
                        onClick={() => setIsGuideOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs sm:text-sm font-bold text-zinc-200 hover:border-[#D4AF37]/50 hover:bg-white/[0.08] active:scale-95 transition"
                    >
                        <BookOpen className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                        <span>{isEn ? 'Audio Guide (6 chapters)' : 'Guide Audio (6 chapitres)'}</span>
                    </button>
                    <button
                        type="button"
                        data-testid="beginner-openings-btn"
                        onClick={() => setIsOpeningExplorerOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs sm:text-sm font-bold text-zinc-200 hover:border-[#D4AF37]/50 hover:bg-white/[0.08] active:scale-95 transition"
                    >
                        <Dices className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                        <span>{isEn ? '15 Opening Moves' : 'Les 15 Coups d’Ouverture'}</span>
                    </button>
                </div>
            </div>

            {/* Modales Interactives Bilingues */}
            <BeginnerInteractiveGuideModal
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                onStartGuidedMatch={onStartGuidedGame}
                onOpenQuizzes={handleOpenAcademy}
            />

            <BeginnerOpeningMovesExplorer
                isOpen={isOpeningExplorerOpen}
                onClose={() => setIsOpeningExplorerOpen(false)}
            />
        </>
    );
});

BeginnerHomePortal.displayName = 'BeginnerHomePortal';
