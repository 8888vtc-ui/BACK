/**
 * @file src/hooks/useMultiplayerProfile.ts
 * @description Profil local et synchronisation Supabase pour le multijoueur (< 200 lignes, 0 any).
 */
import { useState, useEffect } from 'react';
import type { PlayerEloProfile } from '../features/multiplayer/types';
import { DEFAULT_INITIAL_ELO } from '../features/multiplayer/elo';
import { getCurrentUser, getUserProfile } from '../lib/supabase/auth';

export function useMultiplayerProfile() {
    const [localProfile, setLocalProfile] = useState<PlayerEloProfile>(() => {
        const guestId = typeof window !== 'undefined'
            ? localStorage.getItem('bg_guest_id') || `guest_${Math.random().toString(36).slice(2, 8)}`
            : 'guest_local';
        if (typeof window !== 'undefined') localStorage.setItem('bg_guest_id', guestId);
        return { id: guestId, username: `Joueur_${guestId.slice(-4)}`, displayName: `Joueur #${guestId.slice(-4)}`, rating: DEFAULT_INITIAL_ELO, isGuest: true };
    });

    useEffect(() => {
        let mounted = true;
        getCurrentUser().then((user) => {
            if (user && mounted) {
                getUserProfile(user.id).then((prof) => {
                    if (mounted) {
                        setLocalProfile({
                            id: user.id,
                            username: prof?.username || user.email?.split('@')[0] || 'Joueur',
                            displayName: prof?.display_name || 'Champion',
                            rating: prof?.rating || DEFAULT_INITIAL_ELO,
                            avatarUrl: prof?.avatar_url,
                            isGuest: false,
                        });
                    }
                }).catch(() => {});
            }
        }).catch(() => {});
        return () => { mounted = false; };
    }, []);

    return { localProfile, setLocalProfile };
}
