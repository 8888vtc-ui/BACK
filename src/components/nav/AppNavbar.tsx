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

export type NavTabId = 'play' | 'tournaments' | 'puzzles' | 'drills' | 'openings' | 'progression' | 'academy';

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
            { id: 'tournaments', label: ui.navbar.tournaments, icon: '🏆', href: '/tournaments', testId: 'nav-tab-tournaments' },
            { id: 'puzzles', label: ui.navbar.puzzles, icon: '🧩', href: '/puzzles', moduleId: 'puzzles', testId: 'nav-tab-puzzles' },
            { id: 'drills', label: ui.navbar.drills, icon: '🎯', href: '/drills', moduleId: 'drills', testId: 'nav-tab-drills' },
            { id: 'openings', label: ui.navbar.openings, icon: '📖', href: '/academy', moduleId: 'openings', testId: 'nav-tab-openings' },
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
            className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-slate-950/90 backdrop-blur-xl"
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

            <div className="mx-auto flex h-13 max-w-7xl items-center justify-between gap-1.5 sm:gap-2 px-2 sm:px-6 overflow-hidden">
                {/* Gauche : Burger mobile + Marque épurée 2026 */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                        aria-expanded={isMobileMenuOpen}
                        aria-label={ui.navbar.mobileMenuAria}
                        data-testid="navbar-mobile-burger"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900/90 text-slate-200 transition hover:border-white/25 hover:text-white lg:hidden"
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
                        className="group flex items-center gap-2 shrink-0"
                    >
                        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-900 text-sm transition-transform duration-150 group-hover:scale-105">
                            <svg aria-hidden="true" viewBox="0 0 32 32" className="h-5 w-5" fill="none">
                                <polygon points="10,2 22,2 30,10 30,22 22,30 10,30 2,22 2,10" fill="#0f172a" stroke="#f3c65f" strokeWidth="1.6" />
                                <circle cx="12.2" cy="16" r="4" fill="#0f172a" stroke="#f3c65f" strokeWidth="1.3" />
                                <circle cx="19.8" cy="16" r="4" fill="#f3c65f" />
                            </svg>
                        </span>
                        <div className="hidden sm:flex items-center gap-2 whitespace-nowrap">
                            <span className="text-xs sm:text-sm font-black tracking-wider text-white">
                                BACKGAMMON
                            </span>
                            <span className="rounded border border-[#f3c65f]/40 bg-[#f3c65f]/15 px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#f3c65f]">
                                TOUR
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Centre : Onglets d'accès direct Desktop (Style Segmented Pill Pro) */}
                <div className="hidden lg:flex items-center gap-0.5 rounded-xl border border-white/10 bg-slate-900/80 p-1">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                prefetch
                                data-testid={item.testId}
                                onClick={(e) => handleItemClick(item, e)}
                                className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                                    isActive
                                        ? 'bg-white/10 text-white shadow-sm'
                                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                                }`}
                            >
                                <span aria-hidden="true" className="text-xs">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Droite : Bouton PWA + Sélecteur de langue 6 marchés + Menu Compte Utilisateur */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="hidden md:block">
                        <LanguageSelector />
                    </div>
                    {!isInstalled && canInstall && (
                        <button
                            type="button"
                            onClick={() => void handleInstallClick()}
                            data-testid="navbar-pwa-install-btn"
                            aria-label={ui.pwa.installAppAria}
                            className="hidden sm:inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:text-white active:scale-95"
                        >
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#f3c65f]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span className="whitespace-nowrap">{ui.pwa.installApp}</span>
                        </button>
                    )}
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
                    className="border-t border-white/10 bg-slate-950/98 px-4 py-3 shadow-2xl lg:hidden"
                >
                    <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 md:hidden">
                        <span className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            🌐 {ui.navbar.languageSelectorAria}
                        </span>
                        <LanguageSelector />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        {navItems.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    prefetch
                                    data-testid={`mobile-${item.testId}`}
                                    onClick={(e) => handleItemClick(item, e)}
                                    className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                                        isActive
                                            ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white'
                                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'
                                    }`}
                                >
                                    <span aria-hidden="true" className="shrink-0 text-sm">{item.icon}</span>
                                    <span className="truncate">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                    {!isInstalled && canInstall && (
                        <div className="mt-2.5 pt-2.5 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    void handleInstallClick();
                                }}
                                data-testid="mobile-navbar-pwa-install-btn"
                                aria-label={ui.pwa.installAppAria}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:text-white"
                            >
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
