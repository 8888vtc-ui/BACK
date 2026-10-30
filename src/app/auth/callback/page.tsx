'use client';

/**
 * Page de Callback OAuth Supabase (Google / Gmail & Apple) — `/auth/callback`.
 *
 * Rôle :
 *   - Réceptionne la redirection OAuth (`?code=...&next=...` ou session implicite).
 *   - Échange le code PKCE via `exchangeOAuthCodeForSession` et synchronise le profil
 *     joueur (`public.profiles` + `public.user_stats`) avec le nom et l'avatar Gmail.
 *   - Redirige vers la page d'origine (`next` sécurisé) ou affiche une erreur explicite.
 *
 * Dépendances : `src/lib/supabase/auth.ts`, `next/navigation`.
 * Retrait : Supprimer `src/app/auth/callback/page.tsx`.
 * Strictement 0 `any`, < 160 lignes (SCALABILITY.md R1 & R2).
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    exchangeOAuthCodeForSession,
    getSession,
    ensureUserProfileSynced,
    sanitizeAuthRedirectPath,
} from '../../../lib/supabase/auth';

export default function AuthCallbackPage() {
    const router = useRouter();
    const [statusMessage, setStatusMessage] = useState<string>(
        'Authentification Google en cours… Synchronisation de votre profil Backgammon Tour.',
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function processOAuthCallback() {
            const params = new URLSearchParams(window.location.search);
            const oauthError = params.get('error_description') ?? params.get('error');
            const code = params.get('code');
            const nextPath = sanitizeAuthRedirectPath(params.get('next'));

            if (oauthError) {
                if (!cancelled) {
                    setErrorMessage(`Échec de l'authentification Google : ${oauthError}`);
                }
                return;
            }

            if (code) {
                const { error } = await exchangeOAuthCodeForSession(code);
                if (error) {
                    if (!cancelled) {
                        setErrorMessage(`Impossible de valider la session Google : ${error.message}`);
                    }
                    return;
                }
                if (!cancelled) {
                    setStatusMessage('Connexion Gmail réussie ! Redirection vers le salon…');
                    router.replace(nextPath);
                }
                return;
            }

            // Repli pour le flux implicite (#access_token géré automatiquement par detectSessionInUrl)
            const session = await getSession();
            if (session?.user) {
                await ensureUserProfileSynced(session.user);
                if (!cancelled) {
                    setStatusMessage('Session active vérifiée ! Redirection…');
                    router.replace(nextPath);
                }
                return;
            }

            if (!cancelled) {
                setErrorMessage('Aucun code d’authentification détecté. Veuillez réessayer de vous connecter.');
            }
        }

        void processOAuthCallback();

        return () => {
            cancelled = true;
        };
    }, [router]);

    return (
        <main
            data-testid="auth-callback-page"
            className="min-h-screen bg-[#070b13] text-slate-100 flex items-center justify-center p-4"
        >
            <div className="w-full max-w-md rounded-3xl border border-[#d4af37]/40 bg-gradient-to-b from-[#12192b] via-[#0b101b] to-[#070a12] p-7 shadow-2xl text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f3c65f]/50 bg-[#1e160a] text-2xl shadow-lg">
                    🎲
                </div>
                <h1 className="font-serif text-xl font-bold tracking-wide text-[#fce8b2]">
                    BACKGAMMON TOUR · COMPTE JOUEUR
                </h1>

                {errorMessage ? (
                    <div className="mt-4 space-y-4">
                        <div
                            role="alert"
                            data-testid="auth-callback-error"
                            className="rounded-xl border border-rose-500/50 bg-rose-950/60 p-3.5 text-xs font-semibold text-rose-200"
                        >
                            ⚠️ {errorMessage}
                        </div>
                        <Link
                            href="/"
                            data-testid="auth-callback-home-link"
                            className="inline-flex items-center justify-center rounded-xl border border-[#d4af37] bg-gradient-to-r from-amber-500/25 to-yellow-500/25 px-5 py-2.5 text-xs font-bold text-amber-100 hover:brightness-110 transition"
                        >
                            ← Retour au Salon Principal
                        </Link>
                    </div>
                ) : (
                    <div className="mt-4 space-y-3">
                        <p data-testid="auth-callback-status" className="text-xs sm:text-sm text-slate-300">
                            {statusMessage}
                        </p>
                        <div className="mx-auto h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full w-1/2 animate-pulse rounded-full bg-[#d4af37]" />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

