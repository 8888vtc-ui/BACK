'use client';

/**
 * @file src/components/lobby/LobbySidebarAndWidgets.tsx
 * @description Barre latérale gauche universelle rétractable regroupée en 3 blocs ("Tables", "Entraînement", "Circuit")
 * avec cadenas sur Mes Blunders en mode Invité et compteur réel de blunders À corriger en mode Connecté.
 * Strictement <= 265 lignes, 0 `any`.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Sparkles, Flame, BarChart2, GraduationCap, ChevronRight, ChevronLeft,
    Users, Share2, LayoutGrid, Dices, Headphones, Scale, Lock,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';
import { useAuthenticPlayerStats } from '../../hooks/useAuthenticPlayerStats';
import type { LobbyModuleId } from './LobbyScreen';
import { getAllBlunders } from '../../features/drills/blunderBank';
import { isPersonalMatchBlunder } from '../../features/drills/adaptiveQuizEngine';
import { getPendingPersonalBlundersCount, PERSONAL_BLUNDERS_UPDATED_EVENT } from '../../lib/blunders/personalBlunderStore';
import { IconLuxuryCrown, IconWorldTourLive, IconHorologyGear } from '../common/MonteCarloIcons';
import { BeginnerInteractiveGuideModal } from '../beginner/BeginnerInteractiveGuideModal';
import { BeginnerOpeningMovesExplorer } from '../beginner/BeginnerOpeningMovesExplorer';
import { openTermsAndPrPolicyModal } from '../legal/TermsAndPrPolicyModal';
import { openClubOnboardingModal } from '../navigation/PlayerTierGateSwitch';

export interface LobbyLeftSidebarProps {
    readonly selectedMode?: 'ai' | 'multiplayer' | 'training' | null;
    readonly matchLength?: number;
    readonly isSubmenuOpen?: boolean;
    readonly onQuickPlay?: () => void;
    readonly onFindOpponent?: () => void;
    readonly onOpenPassport?: () => void;
    readonly onSelectMoneyGame?: () => void;
    readonly onSelectMatchGame?: () => void;
    readonly onSelectAiMode?: () => void;
    readonly onSelectMultiplayerMode?: () => void;
    readonly onOpenModule?: (moduleId: LobbyModuleId) => void;
    readonly onOpenTableClock?: () => void;
    readonly onOpenSettings?: () => void;
}

export const LobbyLeftSidebar: React.FC<LobbyLeftSidebarProps> = ({
    selectedMode = null, onQuickPlay, onFindOpponent, onOpenPassport,
    onSelectMultiplayerMode, onOpenModule, onOpenSettings,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const { tierGate } = usePlayerTierGate();
    const isBeginner = tierGate === 'BEGINNER';
    const authenticStats = useAuthenticPlayerStats();
    const pathname = usePathname() || '/';

    const [collapsed, setCollapsed] = useState(false);
    const [blunderCount, setBlunderCount] = useState<number>(0);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isOpeningExplorerOpen, setIsOpeningExplorerOpen] = useState(false);

    useEffect(() => {
        const refreshCount = () => {
            try {
                const storePending = getPendingPersonalBlundersCount();
                const legacyPending = getAllBlunders().filter((b) => isPersonalMatchBlunder(b) && !b.isMastered).length;
                setBlunderCount(storePending > 0 ? storePending : legacyPending);
            } catch { /* safe fallback */ }
        };
        refreshCount();
        window.addEventListener(PERSONAL_BLUNDERS_UPDATED_EVENT, refreshCount);
        return () => window.removeEventListener(PERSONAL_BLUNDERS_UPDATED_EVENT, refreshCount);
    }, []);

    const activeRailCls = 'border-l-2 border-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/12 to-transparent text-[#F3E5AB] font-semibold';
    const itemCls = 'flex items-center justify-between w-full whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.04] hover:text-white transition-all duration-150';
    const sectionLabelCls = 'px-3 pb-1 text-xs uppercase tracking-[0.15em] text-zinc-400 font-semibold';

    const isHomeRoute = pathname === '/' || pathname === '/lobby';
    const isTournamentsRoute = pathname.startsWith('/tournaments');
    const isPuzzlesRoute = pathname.startsWith('/puzzles') || pathname.startsWith('/drills');
    const isStudioRoute = pathname.startsWith('/analysis');
    const isAcademyRoute = pathname.startsWith('/academy');

    const handleQuickPlayClick = () => {
        if (onQuickPlay && isHomeRoute) onQuickPlay();
        else if (typeof window !== 'undefined') window.location.assign('/');
    };
    const handleFindPlayerClick = () => {
        onSelectMultiplayerMode?.();
        if (onFindOpponent) onFindOpponent();
        else if (onOpenModule) onOpenModule('multiplayer');
        else if (typeof window !== 'undefined') window.location.assign('/?setup=matchmaking');
    };
    const handleInviteClick = () => {
        if (onOpenModule) onOpenModule('private_room');
        else if (typeof window !== 'undefined') window.location.assign('/?invite=1');
    };

    const renderBlundersTrailing = () => {
        if (collapsed) return null;
        if (!authenticStats.isAuthenticated) {
            return <Lock data-testid="sidebar-blunder-guest-lock" className="w-3.5 h-3.5 text-zinc-500 shrink-0" strokeWidth={1.5} />;
        }
        return (
            <span data-testid="sidebar-blunder-count-badge" className="inline-flex items-center justify-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30 font-mono">
                {blunderCount}
            </span>
        );
    };

    return (
        <>
            <aside
                aria-label="Menu latéral principal" data-testid="lobby-left-sidebar"
                className={`hidden lg:flex flex-col justify-between shrink-0 border-r border-white/[0.06] bg-[#0B0E14]/90 backdrop-blur-md py-4 transition-all duration-200 select-none overflow-y-auto ${collapsed ? 'w-16 px-2 items-center' : 'w-60 px-3'
                    }`}
            >
                <div className="flex flex-col gap-3.5 w-full">
                    {/* BLOC 1 : TABLES DE JEU & MATCHMAKING PERMANENT */}
                    <div className="flex flex-col gap-1">
                        {!collapsed && <span className={sectionLabelCls}>{isEn ? 'Tables' : 'Tables'}</span>}

                        <button
                            type="button" data-testid="sidebar-quick-play-btn" onClick={handleQuickPlayClick}
                            title={isEn ? 'Game Room' : 'Salon de Jeu'}
                            className={`h-10 flex items-center gap-2.5 w-full whitespace-nowrap rounded-r-lg px-3 text-sm transition-all duration-150 ${
                                isHomeRoute ? activeRailCls : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                            }`}
                        >
                            <LayoutGrid className="w-4 h-4 text-[#D4AF37] shrink-0" strokeWidth={1.5} />
                            {!collapsed && <span className="truncate">{isEn ? 'Game Room' : 'Salon de Jeu'}</span>}
                        </button>

                        {isBeginner && (
                            <button
                                type="button" data-testid="sidebar-guided-play-btn"
                                onClick={() => { if (typeof window !== 'undefined') window.location.assign('/play?gate=beginner&start=guided'); }}
                                title={isEn ? 'Start Guided Match with the Professor' : 'Lancer une partie guidée avec le Professeur'}
                                className="h-10 flex items-center justify-between w-full whitespace-nowrap rounded-lg px-3 text-sm font-medium text-zinc-200 hover:bg-white/[0.04] hover:text-white transition-all duration-150"
                            >
                                <span className="flex items-center gap-2.5 truncate">
                                    <GraduationCap className="w-4 h-4 text-[#D4AF37] shrink-0" strokeWidth={1.5} />
                                    {!collapsed && <span className="truncate">{isEn ? 'Guided Match (Prof.)' : 'Partie Guidée (Prof.)'}</span>}
                                </span>
                            </button>
                        )}

                        <button
                            type="button" data-testid="sidebar-find-player-btn" onClick={handleFindPlayerClick}
                            title={isEn ? 'Find a Player' : 'Trouver un joueur'}
                            className="h-9 flex items-center justify-between w-full whitespace-nowrap rounded-r-lg px-3 bg-transparent border-transparent text-zinc-100 hover:bg-white/[0.04] hover:text-white transition-all duration-150"
                        >
                            <span className="flex items-center gap-2.5 truncate">
                                <Users className="w-4 h-4 text-[#D4AF37] shrink-0" strokeWidth={1.5} />
                                {!collapsed && <span className="text-sm font-medium text-zinc-100 truncate">{isEn ? 'Find a Player' : 'Trouver un joueur'}</span>}
                            </span>
                            {!collapsed && <span data-testid="sidebar-find-player-status-dot" className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
                        </button>

                        <button
                            type="button" data-testid="sidebar-invite-friend-btn" onClick={handleInviteClick}
                            title={isEn ? 'Invite a Friend (1-Click)' : 'Inviter un ami (1-Clic)'}
                            className="flex items-center gap-2.5 w-full whitespace-nowrap rounded-r-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-all duration-150"
                        >
                            <Share2 className="w-4 h-4 text-[#D4AF37] shrink-0" strokeWidth={1.5} />
                            {!collapsed && <span className="truncate">{isEn ? 'Invite a Friend (1-Click)' : 'Inviter un ami (1-Clic)'}</span>}
                        </button>
                    </div>

                    {/* BLOC 2 : ENTRAÎNEMENT ADAPTATIF SELON LA PORTE */}
                    <div className="flex flex-col gap-1">
                        {!collapsed && <span className={sectionLabelCls}>{isEn ? 'Training & Analysis' : 'Entraînement'}</span>}

                        {isBeginner ? (
                            <>
                                <Link href="/puzzles?mode=beginner-academy" data-testid="sidebar-my-quizzes-link" className={`${itemCls} ${isPuzzlesRoute ? activeRailCls : ''}`}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <Sparkles size={16} strokeWidth={1.5} className="text-[#10B981] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? '10-Lesson Initiation' : 'Initiation (10 Leçons)'}</span>}
                                    </span>
                                </Link>
                                <button type="button" data-testid="sidebar-beginner-openings-btn" onClick={() => setIsOpeningExplorerOpen(true)} className={itemCls}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <Dices size={16} strokeWidth={1.5} className="text-[#D4AF37] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? '15 Opening Moves' : 'Les 15 Ouvertures'}</span>}
                                    </span>
                                </button>
                                <button type="button" data-testid="sidebar-beginner-audio-guide-btn" onClick={() => setIsGuideOpen(true)} className={itemCls}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <Headphones size={16} strokeWidth={1.5} className="text-[#38BDF8] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? 'Audio Guide & Rules' : 'Guide Audio & Règles'}</span>}
                                    </span>
                                </button>
                                <Link href="/puzzles?filter=personal-blunders" data-testid="sidebar-my-blunders-link" className={itemCls}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <Flame size={16} strokeWidth={1.5} className="text-[#F59E0B] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? 'My Mistakes' : 'Mes Erreurs'}</span>}
                                    </span>
                                    {renderBlundersTrailing()}
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/puzzles" data-testid="sidebar-my-quizzes-link" className={`${itemCls} ${isPuzzlesRoute ? activeRailCls : ''}`}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <Sparkles size={16} strokeWidth={1.5} className="text-[#10B981] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? 'My Quizzes' : 'Mes Quiz'}</span>}
                                    </span>
                                </Link>
                                <Link href="/puzzles?filter=personal-blunders" data-testid="sidebar-my-blunders-link" className={itemCls}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <Flame size={16} strokeWidth={1.5} className="text-[#F59E0B] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? 'My Blunders' : 'Mes Erreurs (Blunders)'}</span>}
                                    </span>
                                    {renderBlundersTrailing()}
                                </Link>
                                <Link href="/analysis" data-testid="sidebar-pillar-studio" className={`${itemCls} ${isStudioRoute ? activeRailCls : ''}`}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <BarChart2 size={16} strokeWidth={1.5} className="text-[#D4AF37] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? 'Analysis Studio' : 'Studio d’Analyse'}</span>}
                                    </span>
                                </Link>
                                <Link href="/academy" data-testid="sidebar-pillar-academy" className={`${itemCls} ${isAcademyRoute ? activeRailCls : ''}`}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <GraduationCap size={16} strokeWidth={1.5} className="text-[#38BDF8] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? 'Academy' : 'Académie'}</span>}
                                    </span>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* BLOC 3 : CIRCUIT MONDIAL */}
                    <div className="flex flex-col gap-1">
                        {!collapsed && <span className={sectionLabelCls}>{isEn ? 'Tour' : 'Circuit'}</span>}
                        <Link href="/tournaments" data-testid="sidebar-pillar-tournaments" className={`${itemCls} ${isTournamentsRoute ? activeRailCls : ''}`}>
                            <span className="flex items-center gap-2.5 truncate">
                                <IconWorldTourLive size={15} className="text-[#D4AF37] shrink-0" />
                                {!collapsed && <span className="truncate">{isEn ? 'Map: Tournaments & Clubs' : 'Carte : Tournois & Clubs'}</span>}
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Pied de barre latérale */}
                <div className="flex flex-col gap-0.5 w-full pt-2.5 border-t border-white/[0.06]">
                    <button type="button" data-testid="sidebar-passport-btn" onClick={() => (onOpenPassport ? onOpenPassport() : window.location.assign('/progression'))} className={itemCls}>
                        <span className="flex items-center gap-2.5"><IconLuxuryCrown size={15} className="text-[#D4AF37]" />{!collapsed && <span>{isEn ? 'My Profile' : 'Mon Profil'}</span>}</span>
                    </button>
                    <button type="button" data-testid="sidebar-settings-btn" onClick={() => openClubOnboardingModal('experience')} className={itemCls}>
                        <span className="flex items-center gap-2.5"><IconHorologyGear size={15} className="text-zinc-400" />{!collapsed && <span>{isEn ? 'Settings & Experience' : 'Réglages'}</span>}</span>
                    </button>
                    <button type="button" data-testid="sidebar-terms-pr-policy-btn" onClick={openTermsAndPrPolicyModal} className={itemCls}>
                        <span className="flex items-center gap-2.5"><Scale size={14} strokeWidth={1.5} className="text-[#D4AF37]" />{!collapsed && <span className="truncate">{isEn ? 'ToS & PR Policy' : 'CGU & Règlement PR'}</span>}</span>
                    </button>
                    <button type="button" data-testid="sidebar-collapse-toggle" onClick={() => setCollapsed((v) => !v)} className={itemCls}>
                        <span className="flex items-center gap-2.5">{collapsed ? <ChevronRight size={14} className="text-[#D4AF37]" /> : <ChevronLeft size={14} className="text-[#D4AF37]" />}{!collapsed && <span>{isEn ? 'Collapse' : 'Réduire'}</span>}</span>
                    </button>
                </div>
            </aside>

            {isGuideOpen && (
                <BeginnerInteractiveGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} onStartGuidedMatch={() => { if (typeof window !== 'undefined') window.location.assign('/play?gate=beginner&start=guided'); }} onOpenQuizzes={() => { if (typeof window !== 'undefined') window.location.assign('/puzzles?mode=beginner-academy'); }} />
            )}
            {isOpeningExplorerOpen && (
                <BeginnerOpeningMovesExplorer isOpen={isOpeningExplorerOpen} onClose={() => setIsOpeningExplorerOpen(false)} />
            )}
        </>
    );
};
