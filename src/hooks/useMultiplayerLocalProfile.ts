'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Player } from '../engine/backgammonEngine';
import type {
    PlayerEloProfile,
    MultiplayerMatchInfo,
    MatchmakingState,
    EloCalculationResult,
} from '../features/multiplayer/types';
import {
    calculateMatchElo,
    DEFAULT_INITIAL_ELO,
    readPublicAveragePr,
    recordMatchIntoPublicAveragePr,
    type MatchEloPrOptions,
} from '../features/multiplayer/elo';
import { clearActiveSession, type ActiveGameSession } from '../features/multiplayer/sessionRecovery';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { getCurrentUser, getUserProfile } from '../lib/supabase/auth';

export interface UseMultiplayerLocalProfileParams {
    matchInfo: MultiplayerMatchInfo | null;
    setStatus: React.Dispatch<React.SetStateAction<MatchmakingState>>;
    setRecoverableSession: React.Dispatch<React.SetStateAction<ActiveGameSession | null>>;
}

export function useMultiplayerLocalProfile({
    matchInfo,
    setStatus,
    setRecoverableSession,
}: UseMultiplayerLocalProfileParams) {
    const [eloResult, setEloResult] = useState<EloCalculationResult | null>(null);
    const [localProfile, setLocalProfile] = useState<PlayerEloProfile>(() => {
        const guestId =
            typeof window !== 'undefined'
                ? localStorage.getItem('bg_guest_id') || `guest_${Math.random().toString(36).slice(2, 8)}`
                : 'guest_local';
        if (typeof window !== 'undefined') localStorage.setItem('bg_guest_id', guestId);

        return {
            id: guestId,
            username: `Joueur_${guestId.slice(-4)}`,
            displayName: `Joueur #${guestId.slice(-4)}`,
            rating: DEFAULT_INITIAL_ELO,
            averagePr: readPublicAveragePr(),
            isGuest: true,
        };
    });

    useEffect(() => {
        let mounted = true;
        async function loadProfile() {
            try {
                const user = await getCurrentUser();
                if (user && mounted) {
                    const prof = await getUserProfile(user.id);
                    setLocalProfile({
                        id: user.id,
                        username: prof?.username || user.email?.split('@')[0] || 'Joueur',
                        displayName: prof?.display_name || 'Champion',
                        rating: prof?.rating || DEFAULT_INITIAL_ELO,
                        averagePr: readPublicAveragePr(),
                        avatarUrl: prof?.avatar_url,
                        isGuest: false,
                    });
                }
            } catch {
                // Invité local
            }
        }
        loadProfile();
        return () => {
            mounted = false;
        };
    }, []);

    const handleMatchOver = useCallback(
        (winner: Player, _winType: string, _pointsWon: number, prOptions?: MatchEloPrOptions) => {
            if (!matchInfo) return;
            setStatus('game_over');
            clearActiveSession();
            setRecoverableSession(null);

            const ratingX = matchInfo.playerX.rating;
            const ratingO = matchInfo.playerO.rating;
            const elo = calculateMatchElo(ratingX, ratingO, winner, undefined, prOptions);
            setEloResult(elo);

            const newLocalRating =
                matchInfo.localRole === 'X' ? elo.playerXNewRating : elo.playerONewRating;
            const localMatchPr =
                matchInfo.localRole === 'X' ? prOptions?.prX : prOptions?.prO;
            const updatedAveragePr =
                typeof localMatchPr === 'number' && Number.isFinite(localMatchPr)
                    ? recordMatchIntoPublicAveragePr(localMatchPr)
                    : readPublicAveragePr();

            setLocalProfile((prev) => ({
                ...prev,
                rating: newLocalRating,
                averagePr: updatedAveragePr,
            }));

            if (isSupabaseConfigured() && !localProfile.isGuest) {
                supabase
                    .from('profiles')
                    .update({
                        rating: newLocalRating,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', localProfile.id)
                    .then(() => {}, () => {});
            }
        },
        [matchInfo, localProfile, setStatus, setRecoverableSession],
    );

    return {
        localProfile,
        eloResult,
        setEloResult,
        handleMatchOver,
    };
}
