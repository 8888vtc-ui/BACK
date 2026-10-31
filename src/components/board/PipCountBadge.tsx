'use client';

/**
 * Badge de Pip Count de Tournoi — Plaque en laiton incrustée avec miniatures
 * de pions 3D dynamiques (Vous / IA) et pastille de différentiel (±Δ) explicite.
 *
 * Mémoïsé via React.memo (LOI 5 — ≤ 300 lignes, zéro any).
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { Player } from '../../engine/backgammonEngine';
import {
    PIP_COUNT_STORAGE_KEY,
    computePipDiff,
    isLeading,
} from '../../engine/pipCalculator';
import { toast } from '../toast/ToastContext';

export { PIP_COUNT_STORAGE_KEY, computePipDiff, isLeading };
export const PIP_VISIBILITY_CHANGE_EVENT = 'bg:pip-visibility-change';
export const PIP_COUNT_DISABLED_BRAVO_MESSAGE =
    '🎩 Bravo ! En tournoi Live ou en Cash Game, personne ne compte les pips à ta place… Il est temps de faire chauffer les neurones comme un vrai Pro !';

/**
 * Recommandation stratégique contextuelle selon l'écart de course (théorie Magriel / Robertie).
 */
export function getRaceStrategicAdvice(diff: number, turn: Player): string {
    const abs = Math.abs(diff);
    if (abs <= 3) return 'Course serrée : conservez votre flexibilité et surveillez les ancres adverses.';
    const lead = isLeading(diff, turn);
    if (lead) {
        return abs >= 12
            ? 'Avance nette : simplifiez le jeu, rompez le contact en sécurité et courez vers la sortie (When ahead in the race, RACE).'
            : 'Léger avantage de course : cherchez à vous dégager tout en évitant les blots isolés.';
    }
    return abs >= 12
        ? 'Retard significatif : maintenez le contact, bâtissez un barrage et tentez de frapper un blot adverse.'
        : 'Léger retard de course : temporisez et cherchez des opportunités de frappe ou de double ancre.';
}

/**
 * Lit la préférence d'affichage du pip count depuis localStorage (SSR-safe).
 */
export function getSavedPipCountVisibility(defaultValue = true): boolean {
    if (typeof localStorage === 'undefined') return defaultValue;
    try {
        const saved = localStorage.getItem(PIP_COUNT_STORAGE_KEY);
        if (saved === 'false') return false;
        if (saved === 'true') return true;
    } catch {
        // localStorage indisponible
    }
    return defaultValue;
}

/**
 * Enregistre la préférence d'affichage du pip count (Mode Tournoi Live = `false`)
 * et notifie tous les composants abonnés via `PIP_VISIBILITY_CHANGE_EVENT`.
 */
export function setSavedPipCountVisibility(visible: boolean): void {
    try {
        const wasVisible = getSavedPipCountVisibility(true);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(PIP_COUNT_STORAGE_KEY, String(visible));
        }
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent<boolean>(PIP_VISIBILITY_CHANGE_EVENT, { detail: visible }));
        }
        if (!visible && wasVisible) {
            toast.success('🎩 Mode Tournoi Live & Cash Game', PIP_COUNT_DISABLED_BRAVO_MESSAGE, { duration: 5500 });
        }
    } catch {
        // ignore
    }
}

/**
 * Bascule en 1 clic la visibilité du pip count et retourne le nouvel état.
 */
export function toggleSavedPipCountVisibility(currentVisible?: boolean): boolean {
    const base = typeof currentVisible === 'boolean' ? currentVisible : getSavedPipCountVisibility(true);
    const next = !base;
    setSavedPipCountVisibility(next);
    return next;
}

export interface PipCountBadgeProps {
    /** Pip count du joueur X (Humain côté moteur). */
    pipX: number;
    /** Pip count du joueur O (Adversaire / IA côté moteur). */
    pipO: number;
    /** Joueur au trait (détermine le sens de la pastille). */
    turn: Player;
    /** Couleur visuelle choisie par le joueur ('X' = Blanc, 'O' = Noir). */
    playerColor?: Player;
    /** Inverse les couleurs Blanc/Noir lorsque le joueur a choisi Noir. */
    swapColors?: boolean;
    /** Effective Pip Count optionnel pour X (Course pure / Bear-off). */
    epcX?: number | null;
    /** Effective Pip Count optionnel pour O (Course pure / Bear-off). */
    epcO?: number | null;
    /** Pips gaspillés optionnels (Wastage) pour X. */
    wastageX?: number | null;
    /** Pips gaspillés optionnels (Wastage) pour O. */
    wastageO?: number | null;
    /** Indique si la position est une course pure sans contact. */
    isPureRace?: boolean;
}

/** Miniature réaliste de pion 3D (Blanc ivoire ou Noir ébène). */
const MiniCheckerDisc: React.FC<{ isWhite: boolean }> = React.memo(({ isWhite }) => (
    <span
        aria-hidden="true"
        className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${isWhite
            ? 'bg-[radial-gradient(circle_at_32%_28%,#ffffff_0%,#f5ebd6_55%,#b89f72_100%)] ring-1 ring-amber-300/90 shadow-[0_1px_2px_rgba(0,0,0,0.6)]'
            : 'bg-[radial-gradient(circle_at_32%_28%,#63636e_0%,#27272a_50%,#09090b_100%)] ring-1 ring-slate-400/70 shadow-[0_1px_2px_rgba(0,0,0,0.85)]'
            }`}
    />
));
MiniCheckerDisc.displayName = 'MiniCheckerDisc';

const PipCountBadgeComponent: React.FC<PipCountBadgeProps> = ({
    pipX,
    pipO,
    turn,
    playerColor = 'X',
    swapColors = false,
    epcX,
    epcO,
    wastageX,
    wastageO,
    isPureRace = false,
}) => {
    const [visible, setVisible] = useState<boolean>(true);

    useEffect(() => {
        const saved = getSavedPipCountVisibility(true);
        if (saved !== true) setVisible(saved);
        const onSync = (e: Event) => {
            const detail = (e as CustomEvent<boolean>).detail;
            if (typeof detail === 'boolean') setVisible(detail);
        };
        window.addEventListener(PIP_VISIBILITY_CHANGE_EVENT, onSync);
        return () => window.removeEventListener(PIP_VISIBILITY_CHANGE_EVENT, onSync);
    }, []);

    const humanIsBlack = swapColors || playerColor === 'O';
    const humanCheckerIsWhite = !humanIsBlack;
    const aiCheckerIsWhite = humanIsBlack;

    const diff = computePipDiff(pipX, pipO);
    const leading = isLeading(diff, turn);
    const absDiff = Math.abs(diff);
    const isTied = absDiff === 0;
    const displaySign = isTied ? '±' : leading ? '+' : '-';
    const statusLabel = isTied ? 'Égalité' : leading ? 'En avance' : 'En retard';

    const hasEpc = isPureRace && typeof epcX === 'number' && typeof epcO === 'number';
    const epcDiff = hasEpc ? Number((epcX - epcO).toFixed(1)) : null;

    const toggleVisibility = useCallback(() => {
        setVisible((prev) => {
            const next = !prev;
            setSavedPipCountVisibility(next);
            return next;
        });
    }, []);

    const titleX = hasEpc && typeof wastageX === 'number'
        ? `Pip count Vous (${humanCheckerIsWhite ? 'Blanc' : 'Noir'}) : ${pipX} pips | EPC: ${epcX} (Gaspillage: +${wastageX})`
        : `Pip count Vous (${humanCheckerIsWhite ? 'Blanc' : 'Noir'})`;

    const titleO = hasEpc && typeof wastageO === 'number'
        ? `Pip count IA (${aiCheckerIsWhite ? 'Blanc' : 'Noir'}) : ${pipO} pips | EPC: ${epcO} (Gaspillage: +${wastageO})`
        : `Pip count IA (${aiCheckerIsWhite ? 'Blanc' : 'Noir'})`;

    return (
        <div
            data-testid="pip-count-bar"
            data-live-board-mode={!visible ? 'true' : 'false'}
            className="hidden md:flex items-center justify-between gap-2 px-2 pt-0.5 text-[11px] font-semibold select-none shrink-0"
        >
            {/* Plaque en laiton incrustée avec scores tabulaires */}
            <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg shadow-md border"
                style={{
                    background:
                        'linear-gradient(180deg, rgba(38, 24, 12, 0.92) 0%, rgba(20, 12, 6, 0.96) 100%)',
                    border: '1px solid rgba(212, 175, 55, 0.42)',
                    boxShadow:
                        'inset 0 1px 1px rgba(255, 235, 170, 0.2), inset 0 -1px 2px rgba(0, 0, 0, 0.6), 0 3px 6px rgba(0, 0, 0, 0.45)',
                }}
            >
                {/* Camp Joueur (Vous) */}
                <span
                    data-testid="pip-badge-x"
                    className="flex items-center gap-1 rounded-md border border-amber-950/80 bg-black/60 px-2 py-0.5 font-mono tabular-nums text-amber-100 shadow-inner"
                    title={titleX}
                >
                    <MiniCheckerDisc isWhite={humanCheckerIsWhite} />
                    <span className="font-sans font-bold text-amber-100">Vous</span>
                    <span data-testid="pip-value-x">{visible ? pipX : '•••'}</span>
                </span>

                {/* Camp IA */}
                <span
                    data-testid="pip-badge-o"
                    className="flex items-center gap-1 rounded-md border border-amber-950/80 bg-black/60 px-2 py-0.5 font-mono tabular-nums text-amber-200/90 shadow-inner"
                    title={titleO}
                >
                    <MiniCheckerDisc isWhite={aiCheckerIsWhite} />
                    <span className="font-sans font-bold text-amber-300/80">IA</span>
                    <span data-testid="pip-value-o">{visible ? pipO : '•••'}</span>
                </span>

                {/* Pastille de différentiel (±Δ) explicite en coup d'œil */}
                {visible && (
                    <span
                        data-testid="pip-diff-badge"
                        className={`rounded-full border px-2 sm:px-2.5 py-0.5 font-mono font-bold tabular-nums flex items-center gap-1 transition-all ${isTied
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                            : leading
                                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                                : 'border-rose-500/50 bg-rose-500/15 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.35)]'
                            }`}
                        title={`Écart de course (${turn === 'X' ? 'Vous' : 'IA'} au trait) — ${statusLabel} (${absDiff} pips) | Conseil : ${getRaceStrategicAdvice(diff, turn)}${hasEpc ? ` | Écart EPC: ${epcDiff !== null && epcDiff > 0 ? `+${epcDiff}` : epcDiff}` : ''}`}
                    >
                        <span>
                            {displaySign}
                            {absDiff}
                        </span>
                        <span className="hidden sm:inline font-sans text-[11px] font-semibold opacity-90">
                            ({statusLabel})
                        </span>
                        {hasEpc && (
                            <span
                                data-testid="pip-epc-badge"
                                className="hidden md:inline-block ml-0.5 text-[11px] uppercase tracking-wider text-amber-300/90 bg-amber-950/50 px-1 py-0.2 rounded border border-white/10"
                                title="Effective Pip Count actif (sans contact)"
                            >
                                EPC
                            </span>
                        )}
                    </span>
                )}
            </div>

            {/* Bouton de bascule de visibilité styled plaque laiton */}
            <button
                type="button"
                onClick={toggleVisibility}
                aria-label={visible ? 'Masquer le pip count' : 'Afficher le pip count'}
                aria-pressed={visible}
                title={visible ? 'Masquer le pip count' : 'Afficher le pip count'}
                data-testid="pip-count-toggle"
                className="rounded-xl border border-amber-800/40 bg-black/50 px-2.5 py-1 text-amber-200/80 transition-all hover:bg-amber-950/40 hover:text-amber-100 hover:border-amber-600/60 shadow-sm"
                style={{
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.4)',
                }}
            >
                {visible ? '👁' : '👁‍🗨'}
            </button>
        </div>
    );
};

export const PipCountBadge = React.memo(PipCountBadgeComponent);

export default PipCountBadge;
