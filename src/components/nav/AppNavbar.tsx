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
import type { LobbyModuleId } from '../lobby/LobbyScreen';
import { useTranslation } from '../../i18n';
import usePwaInstall from '../../hooks/usePwaInstall';
import IosInstallModal from '../pwa/IosInstallModal';
import { PlayerTierGateSwitch } from '../navigation/PlayerTierGateSwitch';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';
import { NavbarPointsAndBadges } from './NavbarPointsAndBadges';

export type NavTabId = 'play' | 'tournaments' | 'puzzles' | 'drills' | 'openings' | 'progression' | 'academy';

export interface AppNavbarProps {
    activeTab?: NavTabId;
    onOpenModule?: (moduleId: LobbyModuleId) => void;
    onSelectPlayTab?: () => void;
    onOpenSettings?: () => void;
    onUserResolved?: (user: User | null, profile: Profile | null, status: AuthStatus) => void;
    statusBadge?: React.ReactNode;
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
    statusBadge,
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { t, ui, locale, setLocale } = useTranslation();
    const { canInstall, isInstalled, showIosModal, setShowIosModal, handleInstallClick } = usePwaInstall();
    const { tierGate, setTierGate } = usePlayerTierGate();

    const navItems = useMemo<ReadonlyArray<NavItem>>(
        () => [
            { id: 'play', label: ui.navbar.play, icon: '🎲', href: '/', testId: 'nav-tab-play' },
            { id: 'tournaments', label: ui.navbar.tournaments, icon: '🌍', href: '/tournaments', testId: 'nav-tab-tournaments' },
            { id: 'puzzles', label: ui.navbar.puzzles, icon: '🧩', href: '/puzzles', moduleId: 'puzzles', testId: 'nav-tab-puzzles' },
            { id: 'drills', label: ui.navbar.drills, icon: '🎯', href: '/puzzles', moduleId: 'drills', testId: 'nav-tab-drills' },
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
            className="sticky top-0 z-40 w-full border-b border-[#d4af37]/15 bg-gradient-to-b from-[#0b0d12]/95 to-[#050505]/90 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.03),0_8px_24px_-12px_rgba(0,0,0,0.8)]"
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

            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 sm:gap-3 px-3 sm:px-8 overflow-hidden">
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
                            <span className="rounded border border-[#f3c65f]/40 bg-[#f3c65f]/15 px-1.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#f3c65f]">
                                TOUR
                            </span>
                        </div>
                    </Link>
                    <span data-testid="app-version-badge" className="rounded-full border border-[#10B981]/35 bg-gradient-to-r from-[#0F2922]/90 via-[#0B0E14] to-[#D4AF37]/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-tight text-[#34D399] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        v3.1 • 3-Ply • Open Sage
                    </span>
                </div>

                {/* Centre : Sélecteur 3 Portes visible + Liens sr-only */}
                <div className="hidden md:flex items-center">
                    <PlayerTierGateSwitch currentGate={tierGate} onSelectGate={setTierGate} compact />
                </div>
                <div className="sr-only">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                prefetch
                                data-testid={item.testId}
                                onClick={(e) => handleItemClick(item, e)}
                                className={isActive ? 'font-bold' : ''}
                            >
                                <span aria-hidden="true">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Droite : Pont d'acquisition Time-to-Fun < 3s + Statut Joueur/Invité + Elo + Bouton Installer l'App + Bouton Connexion */}
                <div className="flex items-center gap-2 shrink-0">
                    {activeTab !== 'play' && (
                        <Link
                            href="/?matchLength=7&tournament=Coach%20IA"
                            data-testid="navbar-play-coach-cta"
                            className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#D4AF37] via-[#f7d77e] to-[#b88924] px-3 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#050505] shadow-[0_2px_14px_rgba(212,175,55,0.38)] transition hover:brightness-105 active:scale-95"
                        >
                            <span>🎲 JOUER CONTRE LE COACH IA</span>
                        </Link>
                    )}
                    {statusBadge}
                    {/* Capital 10 000 PTS & Badges adaptatifs de niveau */}
                    <NavbarPointsAndBadges tierGate={tierGate} />

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
                    {/* Bouton Rapide Toggle FR / EN */}
                    <button
                        type="button"
                        onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
                        data-testid="navbar-locale-toggle-btn"
                        title={locale === 'fr' ? 'Switch to English' : 'Passer en Français'}
                        aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en Français'}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/90 px-2.5 py-1 font-mono text-xs sm:text-sm font-bold tracking-wider text-stone-200 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37] active:scale-95"
                    >
                        <span className={locale === 'fr' ? 'text-[#D4AF37] font-black' : 'text-stone-400'}>FR</span>
                        <span className="text-stone-600">|</span>
                        <span className={locale === 'en' ? 'text-[#D4AF37] font-black' : 'text-stone-400'}>EN</span>
                    </button>

                    <UserAccountMenu
                        tierGate={tierGate}
                        onNavigateModule={onOpenModule}
                        onOpenSettings={onOpenSettings}
                        onUserResolved={onUserResolved}
                    />
                </div>
            </div>

            {/* Sur Mobile (< md) : Sélecteur 3 Portes directement accessible dans le Header supérieur */}
            <div className="flex md:hidden w-full items-center justify-center py-1 px-2 border-t border-white/[0.06] bg-slate-950/90">
                <PlayerTierGateSwitch currentGate={tierGate} onSelectGate={setTierGate} compact />
            </div>

            {/* Tiroir de navigation Mobile */}
            {isMobileMenuOpen && (
                <div
                    data-testid="navbar-mobile-drawer"
                    className="border-t border-white/10 bg-slate-950/98 px-4 py-3 shadow-2xl lg:hidden"
                >
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
