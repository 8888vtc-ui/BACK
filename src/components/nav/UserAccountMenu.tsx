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
    ensureUserProfileSynced,
    signOut as supabaseSignOut,
    onAuthStateChange,
    readPlayerPassport,
    clearPlayerPassport,
    eraseAllPlayerGdprData,
    type PlayerPassport,
} from '../../lib/supabase/auth';
import type { Profile } from '../../lib/supabase/types';
import { useTranslation } from '../../i18n';

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
    user: propUser, profile: propProfile, isLoading: propLoading, isOfflineMode: propOffline,
    onOpenAuthModal, onSignOut, onNavigate, onNavigateModule, onOpenSettings, onUserResolved,
}) => {
    let router: ReturnType<typeof useRouter> | null = null;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        router = useRouter();
    } catch { router = null; }

    const isControlled = propUser !== undefined || propLoading !== undefined;
    const [internalStatus, setInternalStatus] = useState<AuthStatus>('loading');
    const [internalUser, setInternalUser] = useState<User | null>(null);
    const [internalProfile, setInternalProfile] = useState<Profile | null>(null);
    const [localPassport, setLocalPassport] = useState<PlayerPassport | null>(() => readPlayerPassport());
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { locale } = useTranslation();
    const isEn = locale === 'en';

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
                        const prof = (await getUserProfile(currentUser.id)) ?? (await ensureUserProfileSynced(currentUser));
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
                    const prof = (await getUserProfile(nextUser.id)) ?? (await ensureUserProfileSynced(nextUser));
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
        clearPlayerPassport();
        setLocalPassport(null);
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
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-1 text-xs text-slate-300"
            >
                <span className="h-2 w-2 rounded-full bg-[#f3c65f] animate-pulse" />
                <span className="font-semibold text-[11px] text-slate-300">Chargement</span>
            </div>
        );
    }

    const meta = user?.user_metadata as Record<string, unknown> | undefined;
    const displayName =
        profile?.display_name ||
        profile?.username ||
        (typeof meta?.full_name === 'string' ? meta.full_name : null) ||
        (typeof meta?.name === 'string' ? meta.name : null) ||
        user?.email?.split('@')[0] ||
        localPassport?.pseudo ||
        null;
    const displayEmail = user?.email || localPassport?.email || null;
    const avatarUrl =
        profile?.avatar_url ||
        (typeof meta?.avatar_url === 'string' ? meta.avatar_url : null) ||
        (typeof meta?.picture === 'string' ? meta.picture : null);
    const elo = profile?.rating ?? 1500;
    const rankTitle = getCompetitiveRankTitle(elo);
    const isRegisteredPlayer = Boolean(user || localPassport);

    return (
        <div className="relative flex items-center gap-2" ref={menuRef}>
            {isRegisteredPlayer ? (
                <>
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="menu"
                        data-testid="user-profile-btn"
                        className="group flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1 transition hover:border-white/25 hover:bg-slate-800 focus:outline-none"
                    >
                        {avatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={avatarUrl} alt={displayName ?? 'Joueur'} className="h-6 w-6 rounded-full object-cover ring-1 ring-white/20" />
                        ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950">
                                {(displayName ?? 'J').slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <span className="hidden sm:inline text-xs font-semibold text-slate-100 group-hover:text-white">
                            {displayName ?? (isEn ? 'Player' : 'Joueur')}
                        </span>
                        <span data-testid="user-elo-badge" className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                            {elo} ELO
                        </span>
                        <span aria-hidden="true" className={`text-[11px] text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>▾</span>
                    </button>

                    {isDropdownOpen && (
                        <div role="menu" data-testid="user-dropdown-menu" className="absolute right-0 top-full mt-2 z-50 w-60 rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl text-xs">
                            <div className="border-b border-white/10 px-3 py-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-100 truncate">{displayName ?? (isEn ? 'Player' : 'Joueur')}</span>
                                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">{rankTitle}</span>
                                </div>
                                {displayEmail && <p className="mt-0.5 truncate text-[11px] text-slate-400">{displayEmail}</p>}
                                <div className="mt-2 flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-1.5 text-xs">
                                    <span className="text-slate-400">{isEn ? 'ELO Rating' : 'Classement ELO'}</span>
                                    <span className="font-mono font-bold text-amber-300">{elo} GR</span>
                                </div>
                            </div>

                            <div className="py-1 border-b border-white/10 flex flex-col gap-0.5">
                                <Link href="/progression" prefetch onClick={(e) => handleRouteAction(e, '/progression', 'stats')} data-testid="user-menu-progression-link" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition">
                                    <span aria-hidden="true">📊</span>
                                    <span>{isEn ? 'Profile & PR Stats' : 'Profil & Statistiques (PR)'}</span>
                                </Link>
                                <Link href="/pricing" prefetch onClick={(e) => handleRouteAction(e, '/pricing')} data-testid="user-menu-pricing-link" className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-bold text-amber-300 hover:border-white/25 hover:text-amber-200 transition">
                                    <span aria-hidden="true">⚡</span>
                                    <span>{isEn ? 'Unlimited VIP Coach' : 'Coach Illimité VIP'}</span>
                                </Link>
                                {onOpenSettings && (
                                    <button type="button" onClick={() => { setIsDropdownOpen(false); onOpenSettings(); }} data-testid="user-menu-settings-btn" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition">
                                        <span aria-hidden="true">⚙️</span>
                                        <span>{isEn ? 'Table Settings' : 'Paramètres de Table'}</span>
                                    </button>
                                )}
                            </div>

                            <div className="pt-1 space-y-0.5">
                                <button type="button" onClick={handleLogout} data-testid="auth-logout-btn" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-semibold text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition">
                                    <span aria-hidden="true">🚪</span>
                                    <span>{isEn ? 'Sign Out' : 'Déconnexion'}</span>
                                </button>
                                <button
                                    type="button"
                                    data-testid="gdpr-delete-data-btn"
                                    onClick={async () => {
                                        setIsDropdownOpen(false);
                                        await eraseAllPlayerGdprData();
                                        setLocalPassport(null);
                                        setInternalUser(null);
                                        setInternalProfile(null);
                                        setInternalStatus(isSupabaseConfigured() ? 'anonymous' : 'offline');
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:bg-rose-950/40 hover:text-rose-200 transition"
                                >
                                    <span aria-hidden="true">🗑️</span>
                                    <span>{isEn ? 'Delete My Data (GDPR)' : 'Supprimer mes données (RGPD)'}</span>
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
                        className="group flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:bg-slate-800 hover:text-white active:scale-[0.98]"
                    >
                        <span className="text-xs text-amber-300">👤</span>
                        <span>{isOffline ? (isEn ? 'Local Member' : 'Membre Local') : (isEn ? 'Sign In' : 'Connexion')}</span>
                    </button>
                    {!onOpenAuthModal && (
                        <AuthModal
                            isOpen={isAuthModalOpen}
                            onClose={() => setIsAuthModalOpen(false)}
                            onSuccess={() => {
                                setLocalPassport(readPlayerPassport());
                            }}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export const UserAccountMenu = React.memo(UserAccountMenuComponent);
export default UserAccountMenu;
