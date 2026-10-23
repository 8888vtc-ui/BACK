'use client';

/**
 * Barre de Navigation Universelle Fixe — Direction Artistique "Salon Privé Monte-Carlo".
 *
 * Caractéristiques :
 *   - Ébène / Ardoise de minuit & filet d'or brossé (#d4af37)
 *   - Blason horloger cliquable + typographie Serif anglaise
 *   - Onglets d'accès direct multilingues : Jouer, Puzzles, Entraînement (Drills), Ouvertures, Progression, Académie
 *   - Sélecteur de langue 6 marchés (FR, EN, ES, PT, DE, AR) + liens d'évitement WCAG
 *   - Strictement 0 `any`, < 300 lignes.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../../lib/supabase/types';
import UserAccountMenu, { type AuthStatus } from './UserAccountMenu';
import LanguageSelector from './LanguageSelector';
import type { LobbyModuleId } from '../lobby/LobbyScreen';
import { useTranslation } from '../../i18n';
import usePwaInstall from '../../hooks/usePwaInstall';
import IosInstallModal from '../pwa/IosInstallModal';

export type NavTabId = 'play' | 'puzzles' | 'drills' | 'openings' | 'progression' | 'academy';

export interface AppNavbarProps {
    activeTab?: NavTabId;
    onOpenModule?: (moduleId: LobbyModuleId) => void;
    onSelectPlayTab?: () => void;
    onOpenSettings?: () => void;
    onUserResolved?: (user: User | null, profile: Profile | null, status: AuthStatus) => void;
}

interface NavItem {
    id: NavTabId;
    label: string;
    icon: string;
    href: string;
    moduleId?: LobbyModuleId;
    testId: string;
}

const AppNavbarComponent: React.FC<AppNavbarProps> = ({
    activeTab = 'play',
    onOpenModule,
    onSelectPlayTab,
    onOpenSettings,
    onUserResolved,
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { t, ui } = useTranslation();
    const { canInstall, isInstalled, showIosModal, setShowIosModal, handleInstallClick } = usePwaInstall();

    const navItems = useMemo<ReadonlyArray<NavItem>>(
        () => [
            { id: 'play', label: ui.navbar.play, icon: '🎲', href: '/', testId: 'nav-tab-play' },
            { id: 'puzzles', label: ui.navbar.puzzles, icon: '🧩', href: '/puzzles', moduleId: 'puzzles', testId: 'nav-tab-puzzles' },
            { id: 'drills', label: ui.navbar.drills, icon: '🎯', href: '/drills', moduleId: 'drills', testId: 'nav-tab-drills' },
            { id: 'openings', label: ui.navbar.openings, icon: '📖', href: '/', moduleId: 'openings', testId: 'nav-tab-openings' },
            { id: 'progression', label: ui.navbar.progression, icon: '📊', href: '/progression', moduleId: 'stats', testId: 'nav-tab-progression' },
            { id: 'academy', label: ui.navbar.academy, icon: '🏛️', href: '/academy', testId: 'nav-tab-academy' },
        ],
        [ui.navbar],
    );

    const handleItemClick = (item: NavItem, e: React.MouseEvent) => {
        setIsMobileMenuOpen(false);
        if (item.id === 'play' && onSelectPlayTab) {
            e.preventDefault();
            onSelectPlayTab();
            return;
        }
        if (item.id === 'openings' && onOpenModule) {
            e.preventDefault();
            onOpenModule('openings');
            return;
        }
        if (item.moduleId && onOpenModule && (item.id === 'puzzles' || item.id === 'drills')) {
            e.preventDefault();
            onOpenModule(item.moduleId);
        }
    };

    return (
        <nav
            aria-label="Navigation principale"
            data-testid="app-navbar"
            className="sticky top-0 z-40 w-full border-b border-[#d4af37]/30 bg-gradient-to-b from-[#0e131f]/95 via-[#090d16]/95 to-[#06090f]/95 backdrop-blur-xl shadow-[0_10px_32px_rgba(0,0,0,0.75),inset_0_-1px_0_rgba(255,235,180,0.12)]"
        >
            {/* Liens d'évitement accessibles WCAG 2.1 AA (traduits dynamiquement) */}
            <div className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:left-2 focus-within:top-2 focus-within:z-50 focus-within:flex focus-within:gap-2">
                <a href="#match-hud" className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg">
                    {t('board.skipToHud')}
                </a>
                <a href="#backgammon-board" className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg">
                    {t('board.skipToBoard')}
                </a>
                <a href="#coach-panel" className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg">
                    {t('board.skipToCoach')}
                </a>
            </div>

            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
                {/* Gauche : Burger mobile + Blason Or Ciselé */}
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                        aria-expanded={isMobileMenuOpen}
                        aria-label={ui.navbar.mobileMenuAria}
                        data-testid="navbar-mobile-burger"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d4af37]/35 bg-[#121826]/90 text-amber-100 shadow-inner transition hover:border-[#f3c65f] hover:text-amber-200 lg:hidden"
                    >
                        <span aria-hidden="true" className="text-base leading-none">
                            {isMobileMenuOpen ? '✕' : '☰'}
                        </span>
                    </button>

                    <Link
                        href="/"
                        prefetch
                        onClick={(e) => {
                            if (onSelectPlayTab) {
                                e.preventDefault();
                                onSelectPlayTab();
                            }
                        }}
                        data-testid="navbar-brand-logo"
                        className="group flex items-center gap-2.5"
                    >
                        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5c158]/70 bg-gradient-to-b from-[#2a1f0d] via-[#141008] to-[#080603] text-base shadow-[0_4px_14px_rgba(0,0,0,0.75),inset_0_1px_1px_rgba(255,245,200,0.4)] transition-transform duration-200 group-hover:scale-105">
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 32 32"
                                className="h-6 w-6 drop-shadow-[0_1px_4px_rgba(245,158,11,0.5)]"
                                fill="none"
                            >
                                <polygon points="10,2 22,2 30,10 30,22 22,30 10,30 2,22 2,10" fill="#0b101b" stroke="#f3c65f" strokeWidth="1.6" />
                                <path d="M9.5 10.5L12 6.8L14.5 9.8L16 5.5L17.5 9.8L20 6.8L22.5 10.5H9.5Z" fill="#f3c65f" />
                                <polygon points="9,27 13,27 11,16" fill="#d4af37" opacity="0.45" />
                                <polygon points="19,27 23,27 21,16" fill="#d4af37" opacity="0.45" />
                                <circle cx="12.2" cy="19.5" r="4.2" fill="#0f172a" stroke="#f3c65f" strokeWidth="1.3" />
                                <circle cx="19.8" cy="19.5" r="4.2" fill="#fde68a" stroke="#9c6f16" strokeWidth="1.3" />
                            </svg>
                        </span>
                        <div className="hidden sm:flex flex-col leading-none">
                            <span className="font-serif bg-gradient-to-b from-[#fff6d6] via-[#e5c158] to-[#b38428] bg-clip-text text-sm font-black tracking-[0.16em] text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                BACKGAMMON TOUR
                            </span>
                            <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.24em] text-[#d4af37]/85">
                                {ui.navbar.brandSubtitle}
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Centre : Onglets d'accès direct Desktop */}
                <div className="hidden lg:flex items-center gap-0.5 rounded-full border border-[#d4af37]/25 bg-[#070a10]/90 p-1 shadow-[inset_0_2px_6px_rgba(0,0,0,0.85),0_1px_0_rgba(255,240,195,0.08)]">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                prefetch
                                data-testid={item.testId}
                                onClick={(e) => handleItemClick(item, e)}
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide transition-all duration-150 ${
                                    isActive
                                        ? 'border border-[#e5c158]/60 bg-gradient-to-b from-[#332510] via-[#221809] to-[#160f05] text-[#fff3d1] shadow-[0_2px_10px_rgba(212,175,55,0.22),inset_0_1px_0_rgba(255,245,200,0.3)]'
                                        : 'text-slate-300/90 hover:bg-white/[0.04] hover:text-amber-100'
                                }`}
                            >
                                <span aria-hidden="true" className="text-xs [filter:sepia(0.9)_saturate(2.4)_hue-rotate(5deg)]">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Droite : Bouton PWA + Sélecteur de langue 6 marchés + Menu Compte Utilisateur */}
                <div className="flex items-center gap-2">
                    {!isInstalled && canInstall && (
                        <button
                            type="button"
                            onClick={() => void handleInstallClick()}
                            data-testid="navbar-pwa-install-btn"
                            aria-label={ui.pwa.installAppAria}
                            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/45 bg-[#0f1422]/90 px-3 py-1 text-xs font-bold text-amber-200 shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,245,205,0.2)] transition hover:border-[#f3c65f] hover:bg-[#182035] hover:text-[#fff4d0] active:scale-95"
                        >
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5 text-[#f3c65f]"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>{ui.pwa.installApp}</span>
                        </button>
                    )}
                    <LanguageSelector />
                    <UserAccountMenu
                        onNavigateModule={onOpenModule}
                        onOpenSettings={onOpenSettings}
                        onUserResolved={onUserResolved}
                    />
                </div>
            </div>

            {/* Tiroir de navigation Mobile */}
            {isMobileMenuOpen && (
                <div
                    data-testid="navbar-mobile-drawer"
                    className="border-t border-[#d4af37]/25 bg-[#080b12]/98 px-4 py-3 shadow-2xl lg:hidden"
                >
                    <div className="grid grid-cols-2 gap-2">
                        {navItems.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    prefetch
                                    data-testid={`mobile-${item.testId}`}
                                    onClick={(e) => handleItemClick(item, e)}
                                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                                        isActive
                                            ? 'border-[#e5c158]/60 bg-gradient-to-b from-[#2e210d] to-[#181106] text-amber-100 shadow-sm'
                                            : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-[#d4af37]/40 hover:bg-white/[0.06]'
                                    }`}
                                >
                                    <span aria-hidden="true" className="text-base">{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                    {!isInstalled && canInstall && (
                        <div className="mt-3 pt-2.5 border-t border-[#d4af37]/25">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    void handleInstallClick();
                                }}
                                data-testid="mobile-navbar-pwa-install-btn"
                                aria-label={ui.pwa.installAppAria}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d4af37]/50 bg-gradient-to-r from-[#20180d] via-[#141008] to-[#0d0f17] px-3 py-2.5 text-xs font-bold text-amber-200 shadow-md transition hover:border-[#f3c65f] hover:text-[#fff4d0]"
                            >
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4 text-[#f3c65f]"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <span>{ui.pwa.installApp}</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
            <IosInstallModal isOpen={showIosModal} onClose={() => setShowIosModal(false)} />
        </nav>
    );
};

export const AppNavbar = React.memo(AppNavbarComponent);
export default AppNavbar;
