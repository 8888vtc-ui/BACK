'use client';

import React, { useState } from 'react';
import { BookOpen, Play, Sparkles, Dices } from 'lucide-react';
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
                <div className="flex flex-col gap-1.5 text-center sm:text-left px-1 py-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                        {isEn ? '🌱 Beginner Mode · The Alliance of Luck & Strategy' : "🌱 Mode Débutant · L'Alliance du Hasard et de la Stratégie"}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {isEn ? 'The thrill of dice, the power of strategy' : 'Le suspense des dés, la puissance de la stratégie'}
                    </h2>
                    <p className="text-sm text-stone-300 max-w-3xl leading-relaxed">
                        {isEn
                            ? 'On a single roll, anyone can get lucky. But over 36 combinations, mastering the doubling cube and avoiding blunders makes you win consistently.'
                            : "Sur une manche, n'importe qui peut avoir de la chance. Mais sur les 36 combinaisons, maîtriser le videau et éviter les blunders vous fait triompher sur la durée."}
                    </p>
                </div>

                {/* Grille 2 Cartes Clés : Académie 10 Quiz & Match Guidé */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* CARTE MAJEURE : Unique bouton Or de l'écran */}
                    <div className="flex flex-col justify-between gap-4 rounded-2xl border-2 border-[#D4AF37]/50 bg-gradient-to-b from-[#16120b] to-[#0c0a06] p-6 shadow-[0_8px_30px_rgba(212,175,55,0.12)]">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#f3d27a]">
                                    <BookOpen size={22} strokeWidth={1.8} />
                                </span>
                                <span className="rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2.5 py-0.5 text-xs font-mono font-bold text-[#f3d27a]">
                                    +2 000 PTS
                                </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-[#f7f3e8]">
                                {isEn ? 'Initiation Academy & Rules (3 min)' : "Académie d'Initiation & Règles (3 min)"}
                            </h3>
                            <p className="text-sm text-stone-200 leading-relaxed">
                                {isEn
                                    ? 'The fundamentals explained simply with 10 interactive mini-quizzes to earn your Initiate Diploma.'
                                    : "Les bases du jeu expliquées simplement avec 10 petits quiz interactifs pour obtenir votre Diplôme d'Initié."}
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
                    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#0e121a]/80 p-6 hover:border-white/20 transition">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-stone-200">
                                    <Play size={22} strokeWidth={1.8} />
                                </span>
                                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-mono font-semibold text-stone-300">
                                    {isEn ? 'Gentle Bot' : 'Bot Doux'}
                                </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-white">
                                {isEn ? 'Play my first guided match' : 'Jouer ma première partie guidée'}
                            </h3>
                            <p className="text-sm text-stone-200 leading-relaxed">
                                {isEn
                                    ? 'Play against a gentle bot matching your pace, with suggestions in plain language so you never get lost.'
                                    : 'Affrontez un adversaire doux qui joue à votre niveau, avec des suggestions en français pour ne jamais être perdu.'}
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

                {/* BANDEAU MAÎTRE : 6 Chapitres Audio Interactifs */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#0d131f]/90 via-[#0b0e14]/90 to-[#14120e]/90 p-5 shadow-md">
                    <div className="flex items-center gap-3.5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                            <BookOpen size={20} strokeWidth={1.5} className="text-[#D4AF37]" />
                        </span>
                        <div className="flex flex-col">
                            <h4 className="text-sm sm:text-base font-bold text-white">
                                {isEn
                                    ? 'Master Guide: Luck & Strategy, Monte Carlo, Cube & Blunders'
                                    : 'Guide Officiel : Hasard & Stratégie, Monte-Carlo, Videau & Blunders'}
                            </h4>
                            <p className="text-xs sm:text-sm text-stone-300">
                                {isEn
                                    ? '6 illustrated audio chapters explaining why luck thrills and 36-roll statistics crown champions.'
                                    : '6 chapitres audio expliquant pourquoi le hasard émerveille et comment les 36 lancers sacrent les champions.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            data-testid="beginner-openings-btn"
                            onClick={() => setIsOpeningExplorerOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-100 hover:border-[#D4AF37]/50 hover:bg-white/[0.08] active:scale-95 transition"
                        >
                            <Dices size={16} className="text-[#D4AF37]" />
                            <span>{isEn ? '15 OPENINGS SIMULATOR' : '15 COUPS D’OUVERTURE'}</span>
                        </button>
                        <button
                            type="button"
                            data-testid="beginner-open-guide-btn"
                            onClick={() => setIsGuideOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-100 hover:border-[#D4AF37]/50 hover:bg-white/[0.08] active:scale-95 transition"
                        >
                            <span>{isEn ? 'LISTEN TO THE 6 CHAPTERS' : 'LIRE & ÉCOUTER LES 6 CHAPITRES'}</span>
                        </button>
                    </div>
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
