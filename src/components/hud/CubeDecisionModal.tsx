'use client';

/**
 * Modale solennelle de décision sur le Videau (Audit 9 / 20 — CubeDecisionModal).
 *
 * Exigences :
 *   1. Affiche explicitement la transition de valeur du videau (`2 → 4`) et le score actuel du match.
 *   2. Espace franchement les boutons « Accepter (Take) » et « Passer (Drop) » (`gap >= 20 px`).
 *   3. Applique un délai de sécurité anti-misclick de `250 ms` (`CUBE_SAFETY_DELAY_MS`) à l'apparition
 *      pour empêcher tout clic accidentel.
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import React, { useEffect, useState } from 'react';
import type { Player } from '../../engine/backgammonEngine';
import {
    CUBE_BUTTON_MIN_GAP_PX,
    CUBE_SAFETY_DELAY_MS,
    computeNextCubeValue,
    formatCubeTransition,
} from '../../engine/cubeRules';
import { impactHeavy, impactMedium } from '../../lib/capacitor/haptics';

export interface CubeDecisionModalProps {
    /** La modale est-elle ouverte ? */
    isOpen: boolean;
    /** Valeur actuelle du videau avant doublage (ex: 1, 2, 4…). */
    currentCubeValue: number;
    /** Joueur ayant proposé le doublage ('X' ou 'O'). */
    offeredBy?: Player;
    /** Score actuel du joueur X. */
    scoreX: number;
    /** Score actuel du joueur O. */
    scoreO: number;
    /** Longueur du match (ex: 7 points). */
    matchLength: number;
    /** Délai de sécurité anti-misclick en ms (défaut : `250 ms`). */
    safetyDelayMs?: number;
    /** Callback déclenché lorsque le joueur accepte le videau (Take). */
    onTakeDouble: () => void;
    /** Callback déclenché lorsque le joueur refuse le videau et concède la manche (Drop/Pass). */
    onPassDouble: () => void;
}

const CubeDecisionModalComponent: React.FC<CubeDecisionModalProps> = ({
    isOpen,
    currentCubeValue,
    offeredBy = 'O',
    scoreX,
    scoreO,
    matchLength,
    safetyDelayMs = CUBE_SAFETY_DELAY_MS,
    onTakeDouble,
    onPassDouble,
}) => {
    const [isSafetyLocked, setIsSafetyLocked] = useState<boolean>(true);

    useEffect(() => {
        if (!isOpen) {
            setIsSafetyLocked(true);
            return;
        }
        if (safetyDelayMs <= 0) {
            setIsSafetyLocked(false);
            return;
        }
        setIsSafetyLocked(true);
        const timer = setTimeout(() => {
            setIsSafetyLocked(false);
        }, safetyDelayMs);

        return () => clearTimeout(timer);
    }, [isOpen, safetyDelayMs, currentCubeValue]);

    if (!isOpen) return null;

    const safeCurrent = Math.max(1, Math.trunc(currentCubeValue));
    const nextValue = computeNextCubeValue(safeCurrent);
    const transitionText = formatCubeTransition(safeCurrent);
    const offererLabel = offeredBy === 'O' ? "L'Adversaire" : 'Joueur X';

    const handleTake = () => {
        if (isSafetyLocked) return;
        void impactHeavy();
        onTakeDouble();
    };

    const handlePass = () => {
        if (isSafetyLocked) return;
        void impactMedium();
        onPassDouble();
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cube-decision-modal-title"
            data-testid="cube-decision-modal"
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm pointer-events-auto"
        >
            <div className="w-full max-w-md rounded-2xl border-2 border-amber-400/75 bg-slate-950/95 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(251,191,36,0.28)] text-slate-100 flex flex-col items-center gap-4">
                {/* En-tête & Score actuel du match */}
                <div className="w-full flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                        <span aria-hidden="true" className="text-lg">⚡</span>
                        <h2
                            id="cube-decision-modal-title"
                            className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-200"
                        >
                            Proposition de Videau ({offererLabel})
                        </h2>
                    </div>
                    <span
                        data-testid="cube-modal-score"
                        className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-xs font-black tabular-nums text-amber-200"
                    >
                        Score : {scoreX} – {scoreO}{matchLength > 0 ? ` / ${matchLength} pts` : ''}
                    </span>
                </div>

                {/* Transition explicite de la valeur du videau (ex: 2 -> 4) */}
                <div className="flex flex-col items-center gap-1.5 py-1">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Nouvel enjeu de la manche
                    </span>
                    <div
                        data-testid="cube-modal-transition"
                        className="flex items-center gap-3 rounded-2xl border border-amber-400/50 bg-gradient-to-b from-amber-500/20 to-amber-950/30 px-5 py-2.5 text-2xl sm:text-3xl font-black tabular-nums text-amber-200 shadow-inner"
                    >
                        <span>{transitionText}</span>
                    </div>
                    <p className="text-xs text-slate-300 text-center">
                        Refuser concède immédiatement{' '}
                        <strong className="text-rose-300">
                            {safeCurrent} point{safeCurrent > 1 ? 's' : ''}
                        </strong>
                        . Accepter porte l&apos;enjeu à{' '}
                        <strong className="text-emerald-300">{nextValue} points</strong>.
                    </p>
                </div>

                {/* Boutons Take / Drop espacés avec sécurité anti-misclick de 250ms */}
                <div
                    data-testid="cube-modal-actions"
                    className="w-full flex items-center justify-center pt-1"
                    style={{ gap: `${CUBE_BUTTON_MIN_GAP_PX}px` }}
                >
                    <button
                        type="button"
                        data-testid="cube-modal-take-btn"
                        disabled={isSafetyLocked}
                        aria-disabled={isSafetyLocked}
                        onClick={handleTake}
                        className="flex-1 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_6px_20px_rgba(16,185,129,0.35)] transition hover:from-emerald-300 hover:to-emerald-500 active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                        ✓ Accepter (Take ×{nextValue})
                    </button>

                    <button
                        type="button"
                        data-testid="cube-modal-pass-btn"
                        disabled={isSafetyLocked}
                        aria-disabled={isSafetyLocked}
                        onClick={handlePass}
                        className="flex-1 rounded-xl border border-rose-500/75 bg-rose-950/85 px-4 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-rose-100 shadow-[0_6px_20px_rgba(244,63,94,0.25)] transition hover:bg-rose-900 active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                        ✕ Passer (Drop -{safeCurrent})
                    </button>
                </div>
            </div>
        </div>
    );
};

export const CubeDecisionModal = React.memo(CubeDecisionModalComponent);
export default CubeDecisionModal;
