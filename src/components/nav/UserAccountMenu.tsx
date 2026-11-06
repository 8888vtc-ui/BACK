'use client';

/**
 * @file src/components/nav/UserAccountMenu.tsx
 * @description Menu de compte utilisateur connecté, Avatar interactif & Sélecteur parmi les 300 Profils.
 * Strictement 0 any, <= 300 lignes.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import AuthModal from '../auth/AuthModal';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import {
    getCurrentUser, getUserProfile, ensureUserProfileSynced, signOut as supabaseSignOut,
    onAuthStateChange, readPlayerPassport, clearPlayerPassport, eraseAllPlayerGdprData, type PlayerPassport,
} from '../../lib/supabase/auth';
import type { Profile } from '../../lib/supabase/types';
import { useTranslation } from '../../i18n';
import type { PlayerTierGate } from '../../hooks/usePlayerTierGate';
import { useAuthenticPlayerStats } from '../../hooks/useAuthenticPlayerStats';
import { loginWithUserCode, getActiveUserProfile } from '../../features/multiplayer/userCodeSessionService';

export type AuthStatus = 'loading' | 'offline' | 'anonymous' | 'authenticated';

export interface UserAccountMenuProps {
    user?: User | null;
    profile?: Profile | null;
    isLoading?: boolean;
    isOfflineMode?: boolean;
    tierGate?: PlayerTierGate;
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
    tierGate, onOpenAuthModal, onSignOut, onNavigate, onNavigateModule, onOpenSettings, onUserResolved,
}) => {
    const authenticStats = useAuthenticPlayerStats();
    let router: ReturnType<typeof useRouter> | null = null;
    try { router = useRouter(); } catch { router = null; }

    const isControlled = propUser !== undefined || propLoading !== undefined;
    const [internalStatus, setInternalStatus] = useState<AuthStatus>('loading');
    const [internalUser, setInternalUser] = useState<User | null>(null);
    const [internalProfile, setInternalProfile] = useState<Profile | null>(null);
    const [localPassport, setLocalPassport] = useState<PlayerPassport | null>(() => readPlayerPassport());
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [inputCode, setInputCode] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);
    const { locale } = useTranslation();
    const isEn = locale === 'en';

    useEffect(() => {
        if (isControlled) return;
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
                    if (mounted) { setInternalProfile(prof); onUserResolved?.(currentUser, prof, 'authenticated'); }
                } else {
                    setInternalUser(null); setInternalProfile(null); setInternalStatus('anonymous');
                    onUserResolved?.(null, null, 'anonymous');
                }
            } catch {
                if (mounted) { setInternalStatus('anonymous'); onUserResolved?.(null, null, 'anonymous'); }
            }
        })();
        const { unsubscribe } = onAuthStateChange(async (_event, session) => {
            if (!mounted) return;
            const nextUser = session?.user ?? null;
            setInternalUser(nextUser);
            if (nextUser) {
                setInternalStatus('authenticated');
                const prof = (await getUserProfile(nextUser.id)) ?? (await ensureUserProfileSynced(nextUser));
                if (mounted) { setInternalProfile(prof); onUserResolved?.(nextUser, prof, 'authenticated'); }
            } else {
                setInternalProfile(null); setInternalStatus('anonymous'); onUserResolved?.(null, null, 'anonymous');
            }
        });
        return () => { mounted = false; unsubscribe(); };
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

    const handleOpenAuth = () => { if (onOpenAuthModal) onOpenAuthModal(); else setIsAuthModalOpen(true); };

    const handleLogout = async () => {
        setIsDropdownOpen(false); clearPlayerPassport(); setLocalPassport(null);
        if (onSignOut) { await onSignOut(); } else {
            await supabaseSignOut(); setInternalUser(null); setInternalProfile(null);
            setInternalStatus(isSupabaseConfigured() ? 'anonymous' : 'offline');
        }
    };

    const handleApplyUserCode = () => {
        if (!inputCode.trim()) return;
        try {
            loginWithUserCode(inputCode.trim());
            setLocalPassport(readPlayerPassport());
            setInputCode(''); setIsDropdownOpen(false);
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('storage'));
        } catch { /* invalid code */ }
    };

    const handleRouteAction = useCallback((e: React.MouseEvent, route: string, mod?: 'stats' | 'puzzles' | 'drills') => {
        setIsDropdownOpen(false);
        if (mod && onNavigateModule) { e.preventDefault(); onNavigateModule(mod); return; }
        if (onNavigate) { e.preventDefault(); onNavigate(route); return; }
        if (router) { e.preventDefault(); router.push(route); }
    }, [onNavigateModule, onNavigate, router]);

    if (isLoading) {
        return (
            <div data-testid="user-account-loading" className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-1 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-[#f3c65f] animate-pulse" />
                <span className="font-semibold text-[11px] text-slate-300">Chargement</span>
            </div>
        );
    }

    const fallbackActiveProfile = !user && !localPassport ? getActiveUserProfile() : null;
    const meta = user?.user_metadata as Record<string, unknown> | undefined;
    const isRegisteredPlayer = Boolean(user || (localPassport && !/^invit[eé]|^joueur invit[eé]/i.test(localPassport.pseudo)) || (fallbackActiveProfile && !fallbackActiveProfile.isGuest));
    const displayName = !isRegisteredPlayer
        ? (isEn ? 'Guest Player' : 'Joueur Invité')
        : (profile?.display_name || profile?.username || authenticStats.pseudo || (typeof meta?.full_name === 'string' ? meta.full_name : null) || localPassport?.pseudo || 'Joueur');
    const displayEmail = user?.email || localPassport?.email || (fallbackActiveProfile?.isGuest ? null : `${fallbackActiveProfile?.userCode}@backgammontour.com`);
    const avatarUrl = profile?.avatar_url || (typeof meta?.avatar_url === 'string' ? meta.avatar_url : null) || (localPassport?.avatarUrl && localPassport.avatarUrl !== '/avatars/user-avatar-5.jpg' ? localPassport.avatarUrl : null) || fallbackActiveProfile?.avatarUrl;
    const elo = profile?.rating ?? authenticStats.eloRating ?? (fallbackActiveProfile?.rating || 1500);
    const rankTitle = getCompetitiveRankTitle(elo);

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
                        className="group flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1 transition hover:border-white/25 hover:bg-slate-800 focus:outline-none shrink-0"
                    >
                        {avatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={avatarUrl} alt={displayName} className="h-6 w-6 rounded-full object-cover ring-1 ring-white/20" />
                        ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950">
                                {displayName.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <span data-testid="lobby-auth-status" className="hidden sm:inline text-xs font-semibold text-slate-100 group-hover:text-white">
                            {displayName}
                        </span>
                        {tierGate !== 'BEGINNER' && (
                            <span data-testid="user-elo-badge" className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                                {elo} ELO
                            </span>
                        )}
                        <span aria-hidden="true" className={`text-[11px] text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>▾</span>
                    </button>

                    {isDropdownOpen && (
                        <div role="menu" data-testid="user-dropdown-menu" className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-white/10 bg-slate-950/98 p-2 shadow-2xl backdrop-blur-xl text-xs">
                            <div className="border-b border-white/10 px-3 py-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-100 truncate">{displayName}</span>
                                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">{rankTitle}</span>
                                </div>
                                {displayEmail && <p className="mt-0.5 truncate text-[11px] text-slate-400">{displayEmail}</p>}
                                {tierGate !== 'BEGINNER' && (
                                    <div className="mt-1.5 flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-1 text-xs">
                                        <span className="text-slate-400">{isEn ? 'Rating' : 'Classement'}</span>
                                        <span className="font-mono font-bold text-amber-300">{elo} Elo</span>
                                    </div>
                                )}
                            </div>

                            {/* Sélecteur instantané parmi les 300 Profils / Codes Utilisateurs */}
                            <div className="py-2 border-b border-white/10 px-2.5">
                                <label htmlFor="header-user-code-input" className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                                    {isEn ? 'Switch Profile (300 Codes)' : 'Changer Profil (300 Codes)'}
                                </label>
                                <div className="flex gap-1.5">
                                    <input
                                        id="header-user-code-input"
                                        data-testid="header-user-code-input"
                                        type="text"
                                        placeholder="user_42 ou 42"
                                        value={inputCode}
                                        onChange={(e) => setInputCode(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleApplyUserCode(); }}
                                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none font-mono"
                                    />
                                    <button
                                        type="button"
                                        data-testid="header-user-code-apply-btn"
                                        onClick={handleApplyUserCode}
                                        className="rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-bold text-slate-950 hover:bg-amber-300 transition shrink-0"
                                    >
                                        OK
                                    </button>
                                </div>
                            </div>

                            <div className="py-1 border-b border-white/10 flex flex-col gap-0.5">
                                <Link href="/progression" prefetch onClick={(e) => handleRouteAction(e, '/progression', 'stats')} data-testid="user-menu-progression-link" className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition">
                                    <span aria-hidden="true">📊</span><span>{isEn ? 'Profile & PR Stats' : 'Profil & Statistiques (PR)'}</span>
                                </Link>
                                <Link href="/pricing" prefetch onClick={(e) => handleRouteAction(e, '/pricing')} data-testid="user-menu-pricing-link" className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 font-bold text-amber-300 hover:border-white/25 hover:text-amber-200 transition">
                                    <span aria-hidden="true">⚡</span><span>{isEn ? 'Unlimited VIP Coach' : 'Coach Illimité VIP'}</span>
                                </Link>
                                {onOpenSettings && (
                                    <button type="button" onClick={() => { setIsDropdownOpen(false); onOpenSettings(); }} data-testid="user-menu-settings-btn" className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition">
                                        <span aria-hidden="true">⚙️</span><span>{isEn ? 'Table Settings' : 'Paramètres de Table'}</span>
                                    </button>
                                )}
                            </div>

                            <div className="pt-1 space-y-0.5">
                                <button type="button" onClick={handleLogout} data-testid="auth-logout-btn" className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 font-semibold text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition">
                                    <span aria-hidden="true">🚪</span><span>{isEn ? 'Sign Out' : 'Déconnexion'}</span>
                                </button>
                                <button
                                    type="button" data-testid="gdpr-delete-data-btn"
                                    onClick={async () => {
                                        setIsDropdownOpen(false); await eraseAllPlayerGdprData(); setLocalPassport(null); setInternalUser(null); setInternalProfile(null);
                                        setInternalStatus(isSupabaseConfigured() ? 'anonymous' : 'offline');
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-1 text-[10px] font-medium text-slate-400 hover:bg-rose-950/40 hover:text-rose-200 transition"
                                >
                                    <span aria-hidden="true">🗑️</span><span>{isEn ? 'Delete My Data' : 'Supprimer mes données'}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <button
                    type="button" onClick={handleOpenAuth} data-testid="auth-login-trigger"
                    className="group flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-200 transition hover:border-[#D4AF37]/50 hover:bg-slate-800 hover:text-white shrink-0"
                >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-white/10 text-[10px] font-bold text-amber-300">
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 text-amber-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                    <span data-testid="lobby-auth-status" className="hidden sm:inline text-xs font-semibold text-slate-200 whitespace-nowrap">{isEn ? 'Guest Player' : 'Joueur Invité'}</span>
                    <span aria-hidden="true" className="text-slate-500">•</span>
                    <span className="text-[11px] text-amber-400 font-semibold whitespace-nowrap">{isEn ? 'Sign In' : 'Connexion'}</span>
                    <span aria-hidden="true" className="text-[11px] text-slate-400">▾</span>
                </button>
            )}
            {!onOpenAuthModal && (
                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setLocalPassport(readPlayerPassport())} />
            )}
        </div>
    );
};

export const UserAccountMenu = React.memo(UserAccountMenuComponent);
export default UserAccountMenu;
