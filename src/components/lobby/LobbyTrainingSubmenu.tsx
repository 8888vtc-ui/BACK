'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Flame, Puzzle, ChevronDown, Sparkles, Dices, Scale, Trophy, Compass, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { LobbyModuleId } from './LobbyScreen';
import { OPENING_ROLLS_15 } from '../../features/academy/academyData';

export interface LobbyTrainingSubmenuProps {
    readonly onOpenModule?: (moduleId: LobbyModuleId) => void;
}

export const LobbyTrainingSubmenu: React.FC<LobbyTrainingSubmenuProps> = ({ onOpenModule }) => {
    const { ui } = useTranslation();
    return (
        <section data-testid="lobby-training-submenu" className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Link href="/drills?mode=personal_blunders" data-testid="lobby-training-personal-blunders-btn" className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0B0E14]/90 p-3.5 text-left transition-all duration-150 hover:border-[#D4AF37]/40">
                <div className="flex items-center gap-2.5">
                    <Flame size={17} strokeWidth={1.5} className="text-[#D4AF37] shrink-0" />
                    <div>
                        <div className="text-sm font-bold text-white">Revoir mes Blunders</div>
                        <div className="text-xs text-zinc-400">Corrigez vos erreurs issues de vos parties</div>
                    </div>
                </div>
                <span className="rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-semibold text-[#F3E5AB]">{ui.lobby.openBtn}</span>
            </Link>
            <button type="button" data-testid="lobby-training-drills-btn" onClick={() => onOpenModule?.('drills')} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0B0E14]/90 p-3.5 text-left transition-all duration-150 hover:border-white/15">
                <div className="flex items-center gap-2.5">
                    <Flame size={17} strokeWidth={1.5} className="text-[#D4AF37] shrink-0" />
                    <div>
                        <div className="text-sm font-bold text-white">{ui.lobby.blunderDrillsTitle}</div>
                        <div className="text-xs text-zinc-400">{ui.lobby.blunderDrillsDesc}</div>
                    </div>
                </div>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#F3E5AB]">{ui.lobby.openBtn}</span>
            </button>
            <button type="button" data-testid="lobby-training-puzzles-btn" onClick={() => onOpenModule?.('puzzles')} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0B0E14]/90 p-3.5 text-left transition-all duration-150 hover:border-white/15">
                <div className="flex items-center gap-2.5">
                    <Puzzle size={17} strokeWidth={1.5} className="text-[#10B981] shrink-0" />
                    <div>
                        <div className="text-sm font-bold text-white">{ui.lobby.dailyPuzzlesTitle}</div>
                        <div className="text-xs text-zinc-400">{ui.lobby.dailyPuzzlesDesc}</div>
                    </div>
                </div>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#F3E5AB]">{ui.lobby.openBtn}</span>
            </button>
            <button type="button" data-testid="lobby-training-openings-btn" onClick={() => onOpenModule?.('openings')} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0B0E14]/90 p-3.5 text-left transition-all duration-150 hover:border-white/15">
                <div className="flex items-center gap-2.5">
                    <BookOpen size={17} strokeWidth={1.5} className="text-[#D4AF37] shrink-0" />
                    <div>
                        <div className="text-sm font-bold text-white">Les 15 Ouvertures</div>
                        <div className="text-xs text-zinc-400">Encyclopédie interactive des 15 lancers initiaux</div>
                    </div>
                </div>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#F3E5AB]">{ui.lobby.openBtn}</span>
            </button>
        </section>
    );
};

interface SeoGuideArticle {
    readonly id: string;
    readonly category: string;
    readonly title: string;
    readonly summary: string;
    readonly body: string;
}

const SEO_ENCYCLOPEDIA_ARTICLES: ReadonlyArray<SeoGuideArticle> = [
    {
        id: 'regles-backgammon-debutant',
        category: 'Règles Officielles & Initiation',
        title: 'Comment jouer au Backgammon : Les Règles Complètes en 5 Minutes',
        summary: 'Disposition des 15 pions, sens de marche du point 24 vers le point 1, frappe d’un blot sur la barre et sortie (Bear-off).',
        body: 'Au Backgammon, chaque joueur possède 15 dames (2 sur le point 24, 5 sur le point 13, 3 sur le point 8 et 5 sur le point 6). Les pions avancent vers le jan intérieur (cases 1 à 6). Deux pions ou plus sur une même flèche forment une porte imprenable. Un pion isolé (blot) peut être frappé et envoyé sur la Barre centrale : il devra obligatoirement rentrer dans le jan adverse avant tout autre mouvement. Dès que vos 15 pions sont rassemblés dans votre Maison (cases 1 à 6), vous pouvez les sortir du plateau. Un Gammon vaut 2 points et un Backgammon vaut 3 points.',
    },
    {
        id: 'videau-doubling-cube-crawford-jacoby',
        category: 'Videau & Stratégie de Match',
        title: 'Le Videau au Backgammon (Doubling Cube) : Take Point 21,5 %, Règle de Crawford & Jacoby',
        summary: 'Quand doubler, accepter (Take) ou refuser (Pass) le videau en tournoi WBGF et en Money Game.',
        body: 'Le dé doubleur (Videau : 2, 4, 8, 16, 32, 64) transforme le Backgammon en un jeu de décision probabiliste. En course pure sans gammons, le seuil mathématique d’acceptation (Take Point) est de 21,5 % de chances de gain (et environ 25 % en pratique avec le recube vig). Vous devez proposer le double dès 66 % à 70 % de chances de victoire (Market Window). En Match Play, la Règle de Crawford interdit le videau pendant une manche unique lorsqu’un joueur atteint 1-away. En Money Game, la Règle de Jacoby exige que le videau ait été tourné au moins à 2 pour valider un Gammon (2x) ou Backgammon (3x).',
    },
    {
        id: 'probabilites-36-des-backgammon',
        category: 'Mathématiques & Probabilités',
        title: 'Table des 36 Combinaisons de Dés : Règle de 11/36 (30,5 %) et Tirs Indirects',
        summary: 'Maîtrisez les probabilités exactes de frappe directe (1 à 6 cases) et indirecte (7 à 12 cases).',
        body: 'Avec deux dés à 6 faces, il existe exactement 36 lancers équiprobables (6 doublets et 15 paires non-doubles comptant chacune pour 2 combinaisons). Un numéro précis (par exemple un 6 pour frapper à 6 cases ou entrer depuis la barre contre un prime de 5 portes) sort sur 11 lancers sur 36, soit 30,56 %. Deux numéros distincts sortent sur 20 lancers sur 36 (55,56 %). À 7 cases de distance, 6 combinaisons frappent (16,67 %) ; à 8 cases, 6 combinaisons (16,67 %) ; à 9 cases, 5 combinaisons (13,89 %).',
    },
    {
        id: 'course-pip-count-keith-isight',
        category: 'Formules de Course (Pip Count)',
        title: 'Pip Count, Keith Count, Méthode Isight & Effective Pip Count (EPC)',
        summary: 'Évaluez instantanément vos courses sans contact à la table comme un Grand-Maître.',
        body: 'La position initiale compte exactement 167 pips par joueur. Dans une course sans contact, le Keith Count ajoute des pénalités de gaspillage (+1 par pion au-delà de 3 sur les cases 1-3, +1 par flèche vide sur les cases 4-6, +1 par pion hors du jan). Vous doublez à partir de Keith(Adversaire) >= floor(Keith(Vous) * 8/7) - 7, et l’adversaire prend jusqu’à floor(Keith(Vous) * 8/7) - 3.',
    },
    {
        id: 'plans-de-jeu-prime-blitz-backgame',
        category: 'Plans de Jeu & Structures',
        title: 'Les 4 Grands Plans Stratégiques : Course, Holding Game, Prime (Mur de 6 Portes) & Blitz',
        summary: 'Reconnaissez la géométrie du plateau pour choisir entre attaque au jan intérieur, blocus ou ancre haute.',
        body: 'Selon Paul Magriel et Michihito Kageyama (Michy), toute position de contact s’analyse selon 4 plans : 1. La Course (fuir avec les pions arrière quand vous êtes en avance aux pips) ; 2. Le Holding Game (tenir une ancre haute sur le point 20 ou 18 et attendre un blot adverse) ; 3. Le Prime (construire 5 ou 6 portes consécutives pour emprisonner les pions adverses) ; 4. Le Blitz (attaquer férocement dans son jan intérieur pour fermer les 6 portes avec un pion adverse sur la barre). Le backgame utilise 2 ancres profondes (ex: points 23 et 22) en dernier recours.',
    },
    {
        id: 'performance-rating-pr-3ply-monte-carlo',
        category: 'Indice ER / PR & Championnats du Monde',
        title: 'Qu’est-ce que le Performance Rating (PR) et l’Analyse 3-Ply à Monte-Carlo ?',
        summary: 'Calcul officiel PR = ΔEMG × 500, paliers Grand-Maître (< 3.0) et histoire des Championnats du Monde de Monte-Carlo.',
        body: 'Organisés chaque été à Monaco depuis 1976 sous l’égide de la WBGF, les Championnats du Monde de Backgammon de Monte-Carlo couronnent l’élite mondiale. La force réelle d’un joueur est mesurée indépendamment de la chance des dés par le Performance Rating (PR) : perte moyenne d’équité normalisée (ΔEMG) par décision non forcée multipliée par 500. Un PR inférieur à 3.0 caractérise un Grand-Maître Mondial ; entre 3.0 et 5.5 un Maître de Tournoi ; entre 5.5 et 9.0 un joueur de Club Confirmé.',
    },
];

export const VelvetSeoEncyclopediaFooter: React.FC = () => {
    const [openArticleId, setOpenArticleId] = useState<string | null>('regles-backgammon-debutant');
    const [showAllOpenings, setShowAllOpenings] = useState<boolean>(false);

    const visibleOpenings = showAllOpenings ? OPENING_ROLLS_15 : OPENING_ROLLS_15.slice(0, 6);

    return (
        <footer
            data-testid="velvet-seo-encyclopedia-footer"
            aria-label="Encyclopédie Officielle du Backgammon — Règles, 15 Ouvertures, Videau & Stratégie 3-Ply"
            className="w-full max-w-5xl mx-auto mt-10 pt-8 border-t border-white/10 text-left space-y-8 pb-16"
        >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                        <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>ENCYCLOPÉDIE OFFICIELLE &amp; ARCHIVES STRATÉGIQUES</span>
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                        Guides du Backgammon, Règles WBGF, Videau &amp; Les 15 Coups d’Ouverture 3-Ply
                    </h2>
                </div>
                <span className="text-xs text-stone-400 font-mono">
                    Index Certifié Open Sage 3-Ply • Cercle Monte-Carlo
                </span>
            </div>

            {/* Grille Accordion des Guides Stratégiques & Règles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SEO_ENCYCLOPEDIA_ARTICLES.map((art) => {
                    const isOpen = openArticleId === art.id;
                    return (
                        <article
                            key={art.id}
                            className="rounded-2xl border border-white/10 bg-[#0B0E14]/90 p-4 transition hover:border-[#D4AF37]/35"
                        >
                            <button
                                type="button"
                                onClick={() => setOpenArticleId(isOpen ? null : art.id)}
                                aria-expanded={isOpen}
                                className="w-full flex items-start justify-between gap-3 text-left"
                            >
                                <div className="space-y-1">
                                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
                                        {art.category}
                                    </span>
                                    <h3 className="text-xs sm:text-sm font-bold text-white leading-snug">
                                        {art.title}
                                    </h3>
                                    <p className="text-xs text-stone-400 leading-relaxed">
                                        {art.summary}
                                    </p>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-[#D4AF37] shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpen && (
                                <p className="mt-3 pt-3 border-t border-white/10 text-xs text-stone-300 leading-relaxed">
                                    {art.body}
                                </p>
                            )}
                        </article>
                    );
                })}
            </div>

            {/* Table Complète Indexable des 15 Coups d'Ouverture au Backgammon */}
            <section className="rounded-2xl border border-white/10 bg-[#0B0E14]/90 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                            <Dices className="w-3.5 h-3.5 text-emerald-400" />
                            <span>RÉFÉRENTIEL MATHÉMATIQUE 3-PLY</span>
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                            Table Officielle des 15 Coups d’Ouverture au Backgammon (Du 3-1 au 6-5)
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAllOpenings((v) => !v)}
                        className="self-start sm:self-auto rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold text-[#F3E5AB] hover:bg-[#D4AF37]/20 transition"
                    >
                        {showAllOpenings ? 'Réduire la table des 15 ouvertures ▴' : 'Déplier les 15 ouvertures complètes ▾'}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {visibleOpenings.map((op) => (
                        <div key={op.roll} className="rounded-xl border border-white/10 bg-black/50 p-3 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-black text-[#D4AF37]">🎲 Lancer {op.roll}</span>
                                <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                                    {op.optimalMove} ({op.equity3Ply})
                                </span>
                            </div>
                            <div className="text-xs font-bold text-white">{op.nickname.fr}</div>
                            <p className="text-[11px] text-stone-400 leading-snug">{op.strategicNote.fr}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Mots-clés & Indexation Globale */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 text-xs text-stone-400">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    <span>© 2026 Backgammon Tour — Cercle Monte-Carlo • Gammon Academy • Architecture 3-Ply Certifiée</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-400">
                    <span className="inline-flex items-center gap-1"><Trophy className="w-3 h-3 text-[#D4AF37]" /> Règles WBGF</span>
                    <span className="inline-flex items-center gap-1"><Scale className="w-3 h-3 text-[#D4AF37]" /> Videau &amp; Crawford</span>
                    <span className="inline-flex items-center gap-1"><Compass className="w-3 h-3 text-[#D4AF37]" /> 15 Ouvertures</span>
                    <span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#D4AF37]" /> Indice ER / PR</span>
                </div>
            </div>
        </footer>
    );
};


