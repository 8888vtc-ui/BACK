'use client';

import React, { useState, useEffect } from 'react';
import AuthModal from './AuthModal';
import {
    getCurrentUser,
    getUserProfile,
    signOut,
    onAuthStateChange,
} from '../../lib/supabase/auth';
import type { Profile } from '../../lib/supabase/types';
import type { User } from '@supabase/supabase-js';

export default function AuthButton() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function loadUser() {
            try {
                const currentUser = await getCurrentUser();
                if (!mounted) return;
                setUser(currentUser);
                if (currentUser) {
                    const prof = await getUserProfile(currentUser.id);
                    if (mounted) setProfile(prof);
                }
            } catch {
                // Supabase en attente de configuration ou hors-ligne
            }
        }

        loadUser();

        const { unsubscribe } = onAuthStateChange(async (event, session) => {
            if (!mounted) return;
            const nextUser = session?.user ?? null;
            setUser(nextUser);
            if (nextUser) {
                const prof = await getUserProfile(nextUser.id);
                if (mounted) setProfile(prof);
            } else {
                setProfile(null);
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    async function handleLogout() {
        await signOut();
        setUser(null);
        setProfile(null);
        setIsDropdownOpen(false);
    }

    if (!user) {
        return (
            <>
                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    data-testid="auth-login-trigger"
                    className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-750 hover:text-white transition shadow-sm"
                >
                    <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Connexion</span>
                </button>

                <AuthModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </>
        );
    }

    const displayName = profile?.display_name || user.email?.split('@')[0] || 'Joueur';
    const rating = profile?.rating ?? 1500;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                data-testid="user-profile-btn"
                className="flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-950/40 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-blue-900/40 transition shadow-sm"
            >
                <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    {displayName.charAt(0)}
                </div>
                <span className="font-medium text-white">{displayName}</span>
                <span className="rounded bg-blue-900/80 px-1.5 py-0.2 text-[10px] font-mono text-blue-300">
                    {rating} ELO
                </span>
            </button>

            {isDropdownOpen && (
                <div
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-700 bg-slate-900/95 p-1.5 shadow-xl text-xs z-50 animate-in fade-in zoom-in-95"
                    data-testid="user-dropdown-menu"
                >
                    <div className="px-2.5 py-1.5 border-b border-slate-800 text-slate-400">
                        <p className="font-semibold text-white truncate">{displayName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    <div className="py-1 border-b border-slate-800/80">
                        <a
                            href="/progression"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-200 hover:bg-slate-800 hover:text-white transition"
                        >
                            <span>📊</span>
                            <span>Ma Progression (PR)</span>
                        </a>
                    </div>

                    <div className="py-1">
                        <button
                            type="button"
                            onClick={handleLogout}
                            data-testid="auth-logout-btn"
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Se déconnecter</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
