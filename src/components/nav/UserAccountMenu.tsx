'use client';

/**
 * Menu de compte utilisateur connecté & Avatar interactif (Audit 1 & 2 / 5).
 * Navigation 100% SPA via Next.js Link & useRouter (0 rechargement brutal).
 *
 * Conforme LOI 5 : strictement 0 any, < 280 lignes.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import AuthModal from '../auth/AuthModal';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import {
    getCurrentUser,
    getUserProfile,
    signOut as supabaseSignOut,
    onAuthStateChange,
} from '../../lib/supabase/auth';
import type { Profile } from '../../lib/supabase/types';

export type AuthStatus = 'loading' | 'offline' | 'anonymous' | 'authenticated';

export interface UserAccountMenuProps {
    user?: User | null;
    profile?: Profile | null;
    isLoading?: boolean;
    isOfflineMode?: boolean;
    onOpenAuthModal?: () => void;
    onSignOut?: () => Promise<void> | void;
    onNavigate?: (route: string) => void;
    onNavigateModule?: (moduleId: 'stats' | 'puzzles' | 'drills' | 'openings') => void;
    onOpenSettings?: () => void;
    onUserResolved?: (user: User | null, profile: Profile | null, status: AuthStatus) => void;
}

export function getCompetitiveRankTitle(elo: number): string {
    if (elo >= 1900) return 'Grand Maître';
    if (elo >= 1700) return 'Maître';
    if (elo >= 1550) return 'Expert';
    if (elo >= 1400) return 'Confirmé';
    return 'Novice';
}

const UserAccountMenuComponent: React.FC<UserAccountMenuProps> = ({
    user: propUser,
    profile: propProfile,
    isLoading: propLoading,
    isOfflineMode: propOffline,
    onOpenAuthModal,
    onSignOut,
    onNavigate,
    onNavigateModule,
    onOpenSettings,
    onUserResolved,
}) => {
    let router: ReturnType<typeof useRouter> | null = null;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        router = useRouter();
    } catch {
        router = null;
    }

    const isControlled = propUser !== undefined || propLoading !== undefined;
    const [internalStatus, setInternalStatus] = useState<AuthStatus>('loading');
    const [internalUser, setInternalUser] = useState<User | null>(null);
    const [internalProfile, setInternalProfile] = useState<Profile | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isControlled) {
            let mounted = true;
            if (!isSupabaseConfigured()) {
                setInternalStatus('offline');
                onUserResolved?.(null, null, 'offline');
                return () => { mounted = false; };
            }
            void (async () => {
                try {
                    const currentUser = await getCurrentUser();
                    if (!mounted) return;
                    if (currentUser) {
                        setInternalUser(currentUser);
                        setInternalStatus('authenticated');
                        const prof = await getUserProfile(currentUser.id);
                        if (mounted) {
                            setInternalProfile(prof);
                            onUserResolved?.(currentUser, prof, 'authenticated');
                        }
                    } else {
                        setInternalUser(null);
                        setInternalProfile(null);
                        setInternalStatus('anonymous');
                        onUserResolved?.(null, null, 'anonymous');
                    }
                } catch {
                    if (mounted) {
                        setInternalStatus('anonymous');
                        onUserResolved?.(null, null, 'anonymous');
                    }
                }
            })();
            const { unsubscribe } = onAuthStateChange(async (_event, session) => {
                if (!mounted) return;
                const nextUser = session?.user ?? null;
                setInternalUser(nextUser);
                if (nextUser) {
                    setInternalStatus('authenticated');
                    const prof = await getUserProfile(nextUser.id);
                    if (mounted) {
                        setInternalProfile(prof);
                        onUserResolved?.(nextUser, prof, 'authenticated');
                    }
                } else {
                    setInternalProfile(null);
                    setInternalStatus('anonymous');
                    onUserResolved?.(null, null, 'anonymous');
                }
            });
            return () => { mounted = false; unsubscribe(); };
        }
    }, [isControlled, onUserResolved]);

    useEffect(() => {
        if (!isDropdownOpen) return;
        const onDown = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsDropdownOpen(false); };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsDropdownOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [isDropdownOpen]);

    const user = isControlled ? propUser ?? null : internalUser;
    const profile = isControlled ? propProfile ?? null : internalProfile;
    const isLoading = isControlled ? Boolean(propLoading) : internalStatus === 'loading';
    const isOffline = isControlled ? Boolean(propOffline) : internalStatus === 'offline';

    const handleOpenAuth = () => {
        if (onOpenAuthModal) onOpenAuthModal();
        else setIsAuthModalOpen(true);
    };

    const handleLogout = async () => {
        setIsDropdownOpen(false);
        if (onSignOut) {
            await onSignOut();
        } else {
            await supabaseSignOut();
            setInternalUser(null);
            setInternalProfile(null);
            setInternalStatus(isSupabaseConfigured() ? 'anonymous' : 'offline');
        }
    };

    const handleRouteAction = useCallback((e: React.MouseEvent, route: string, mod?: 'stats' | 'puzzles' | 'drills') => {
        setIsDropdownOpen(false);
        if (mod && onNavigateModule) {
            e.preventDefault();
            onNavigateModule(mod);
            return;
        }
        if (onNavigate) {
            e.preventDefault();
            onNavigate(route);
            return;
        }
        if (router) {
            e.preventDefault();
            router.push(route);
        }
    }, [onNavigateModule, onNavigate, router]);

    useEffect(() => {
        if (!isLoading) return;
        const timer = setTimeout(() => {
            if (internalStatus === 'loading') setInternalStatus('anonymous');
        }, 500);
        return () => clearTimeout(timer);
    }, [isLoading, internalStatus]);

    if (isLoading) {
        return (
            <div
                data-testid="user-account-loading"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-b from-[#1a150b] to-[#0e0b06] px-3.5 py-1.5 text-xs text-amber-100"
            >
                <span className="h-2 w-2 rounded-full bg-[#f3c65f] animate-pulse" />
                <span className="font-serif font-bold text-[11px] tracking-wide text-[#f3c65f]">Salon Privé</span>
            </div>
        );
    }

    const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || null;
    const elo = profile?.rating ?? 1500;
    const rankTitle = getCompetitiveRankTitle(elo);

    return (
        <div className="relative flex items-center gap-2" ref={menuRef}>
            {user ? (
                <>
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="menu"
                        data-testid="user-profile-btn"
                        className="group flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 transition hover:border-white/25 hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    >
                        {profile?.avatar_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={profile.avatar_url} alt={displayName ?? 'Joueur'} className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20" />
                        ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-[11px] font-black text-slate-950 shadow-inner">
                                {(displayName ?? 'J').slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <span className="hidden sm:inline text-xs font-semibold text-slate-100 group-hover:text-amber-300">
                            {displayName ?? 'Joueur'}
                        </span>
                        <span data-testid="user-elo-badge" className="rounded-md border border-white/10 bg-amber-500/15 px-1.5 py-0.5 font-mono text-[11px] font-black text-amber-300">
                            {elo} ELO
                        </span>
                        <span aria-hidden="true" className={`text-[11px] text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>▾</span>
                    </button>

                    {isDropdownOpen && (
                        <div role="menu" data-testid="user-dropdown-menu" className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-black/50 text-xs">
                            <div className="border-b border-white/10 px-3 py-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-200 truncate">{displayName ?? 'Joueur'}</span>
                                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">{rankTitle}</span>
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-slate-400">{user.email}</p>
                                <div className="mt-2 flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-1.5 text-xs">
                                    <span className="text-slate-400">Classement ELO</span>
                                    <span className="font-extrabold text-amber-400">{elo} GR</span>
                                </div>
                            </div>

                            <div className="py-1 border-b border-white/10 flex flex-col gap-0.5">
                                <Link href="/progression" prefetch onClick={(e) => handleRouteAction(e, '/progression', 'stats')} data-testid="user-menu-progression-link" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-semibold text-slate-200 hover:bg-amber-500/15 hover:text-amber-200 transition">
                                    <span aria-hidden="true">📊</span>
                                    <span>Profil & Progression (PR)</span>
                                </Link>
                                <Link href="/puzzles" prefetch onClick={(e) => handleRouteAction(e, '/puzzles', 'puzzles')} data-testid="nav-menu-puzzles" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-medium text-slate-200 hover:bg-amber-500/15 hover:text-amber-200 transition">
                                    <span aria-hidden="true">🧩</span>
                                    <span>Puzzles Tactiques</span>
                                </Link>
                                <Link href="/drills" prefetch onClick={(e) => handleRouteAction(e, '/drills', 'drills')} data-testid="nav-menu-drills" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-medium text-slate-200 hover:bg-amber-500/15 hover:text-amber-200 transition">
                                    <span aria-hidden="true">🎯</span>
                                    <span>Entraînement / Drills</span>
                                </Link>
                                <Link href="/pricing" prefetch onClick={(e) => handleRouteAction(e, '/pricing')} data-testid="user-menu-pricing-link" className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-gradient-to-r from-[#2e1318]/60 to-[#180c07]/60 px-3 py-2 font-bold text-[#f3c65f] hover:border-white/25 hover:text-amber-100 transition">
                                    <span aria-hidden="true">⚜</span>
                                    <span>Coach Illimité VIP</span>
                                </Link>
                                {onOpenSettings && (
                                    <button type="button" onClick={() => { setIsDropdownOpen(false); onOpenSettings(); }} data-testid="user-menu-settings-btn" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition">
                                        <span aria-hidden="true">⚙️</span>
                                        <span>Paramètres</span>
                                    </button>
                                )}
                            </div>

                            <div className="pt-1">
                                <button type="button" onClick={handleLogout} data-testid="auth-logout-btn" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 font-semibold text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition">
                                    <span aria-hidden="true">🚪</span>
                                    <span>Déconnexion</span>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={handleOpenAuth}
                        data-testid="auth-login-trigger"
                        className="group flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-b from-[#2c200d] via-[#1c1408] to-[#110c05] px-3.5 py-1.5 text-xs font-bold tracking-wide text-[#fce8b2] shadow-md transition hover:border-white/25 hover:text-white active:scale-[0.98]"
                    >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-[#140e05] text-[11px] text-[#f3c65f]">{isOffline ? '⚜' : '👤'}</span>
                        <span>{isOffline ? 'Membre Local' : 'Connexion'}</span>
                    </button>
                    {!onOpenAuthModal && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}
                </>
            )}
        </div>
    );
};

export const UserAccountMenu = React.memo(UserAccountMenuComponent);
export default UserAccountMenu;
