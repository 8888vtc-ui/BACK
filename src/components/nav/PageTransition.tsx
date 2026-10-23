'use client';

/**
 * Transition SPA fluide, Top Loading Bar (< 50ms) et Bouton Universel "Retour au Lobby" (Audit 2 / 5).
 *
 * Rôle :
 *   - Élimine tout rechargement brutal (`window.location.href`) au profit de la navigation
 *     SPA Next.js (`useRouter`, `<Link prefetch>`).
 *   - Fournit `BackToLobbyButton` pour tous les sous-modules (`/drills`, `/puzzles`, `/progression`).
 *   - Strictement 0 `any`, < 300 lignes.
 */

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface PageTransitionProps {
    children: React.ReactNode;
    isTransitioning?: boolean;
}

/**
 * Hook de navigation SPA sécurisé (compatible App Router Next.js + environnement de test isolé).
 */
export function useSpaNavigation() {
    const [isNavigating, setIsNavigating] = useState(false);

    let router: ReturnType<typeof useRouter> | null = null;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        router = useRouter();
    } catch {
        router = null;
    }

    const navigateTo = useCallback(
        (href: string) => {
            setIsNavigating(true);
            if (router) {
                router.push(href);
            } else if (typeof window !== 'undefined' && window.history) {
                window.history.pushState({}, '', href);
                window.dispatchEvent(new PopStateEvent('popstate'));
            }
            setTimeout(() => setIsNavigating(false), 180);
        },
        [router],
    );

    return { navigateTo, isNavigating };
}

export const PageTransition: React.FC<PageTransitionProps> = ({
    children,
    isTransitioning = false,
}) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isTransitioning) {
            setProgress(0);
            return;
        }
        setProgress(70);
        const timer = setTimeout(() => setProgress(100), 45);
        return () => clearTimeout(timer);
    }, [isTransitioning]);

    return (
        <div className="relative w-full h-full">
            {progress > 0 && (
                <div
                    data-testid="spa-top-loading-bar"
                    className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-emerald-300 transition-all duration-150"
                    style={{ width: `${progress}%` }}
                />
            )}
            {children}
        </div>
    );
};

export interface BackToLobbyButtonProps {
    label?: string;
    onClick?: () => void;
    href?: string;
}

/**
 * Bouton universel "Retour au Lobby" avec préchargement SPA Next.js.
 */
export const BackToLobbyButton: React.FC<BackToLobbyButtonProps> = ({
    label = 'Retour au Lobby',
    onClick,
    href = '/',
}) => {
    const luxuryBtnClass =
        'flex items-center gap-2 rounded-xl border border-[#d4af37]/55 bg-gradient-to-b from-[#261a0c] to-[#120b05] px-4 py-2 text-xs font-bold tracking-wide text-[#fdf8eb] shadow-[0_6px_18px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,245,205,0.25)] transition hover:border-[#f3c65f] hover:text-white active:scale-95';

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                data-testid="universal-back-to-lobby-btn"
                className={luxuryBtnClass}
            >
                <span aria-hidden="true" className="text-[#f3c65f]">⚜</span>
                <span className="font-serif">{label}</span>
            </button>
        );
    }

    return (
        <Link
            href={href}
            prefetch
            data-testid="universal-back-to-lobby-btn"
            className={luxuryBtnClass}
        >
            <span aria-hidden="true" className="text-[#f3c65f]">⚜</span>
            <span className="font-serif">{label}</span>
        </Link>
    );
};

export default PageTransition;
