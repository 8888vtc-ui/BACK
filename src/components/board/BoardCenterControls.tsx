'use client';

/**
 * Contrôles flottants au centre du plateau (standard TMG / Snowie / XG).
 *
 * Rôle :
 *   Point d'entrée UNIQUE pour lancer les dés et valider le tour.
 *   - `HUMAN_WAITING_ROLL` : bouton central « 🎲 LANCER LES DÉS ».
 *   - `HUMAN_MOVING` / `HUMAN_READY_TO_COMMIT` : barre compacte
 *     « ↶ Annuler » + « ✓ Valider ».
 *   - Le bouton « Annuler » est totalement masqué tant qu'aucun
 *     sous-mouvement n'a été joué.
 *
 * Composant 100 % muet (LOI 5) : aucun calcul métier, uniquement des props
 * prêtes à afficher et des handlers déclenchés au clic.
 *
 * Retrait :
 *   Supprimer ce fichier et son usage dans `Board.tsx`.
 */

import React, { useEffect } from 'react';
import type { GamePhase } from '../../actions/types';

export interface BoardCenterControlsProps {
    /** Phase stricte du jeu (LOI 2). */
    readonly gamePhase: GamePhase;
    /** Lancer les dés (HUMAN_WAITING_ROLL). */
    readonly onRoll: () => void;
    /** Valider le coup (HUMAN_READY_TO_COMMIT). */
    readonly onConfirm: () => void;
    /** Annuler le dernier sous-coup. */
    readonly onUndo: () => void;
    /** Un coup peut-il être annulé ? */
    readonly canUndo: boolean;
    /** Le joueur peut-il valider ? */
    readonly canConfirm: boolean;
    /** Dés lancés (condition d'affichage de la barre compacte). */
    readonly hasDice: boolean;
}

const BoardCenterControlsComponent: React.FC<BoardCenterControlsProps> = ({
    gamePhase,
    onRoll,
    onConfirm,
    onUndo,
    canUndo,
    canConfirm,
    hasDice,
}) => {
    const isWaitingRoll = gamePhase === 'HUMAN_WAITING_ROLL';
    const isMoving = gamePhase === 'HUMAN_MOVING';
    const isReadyToCommit = gamePhase === 'HUMAN_READY_TO_COMMIT';

    // Raccourcis : Espace = lancer, Entrée = valider. Ignorés quand un contrôle
    // interactif a le focus (le navigateur gère déjà Espace/Entrée dessus).
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement | null;
            if (el?.closest('button, a, input, textarea, select, [role="button"], [contenteditable="true"]')) return;
            if (e.code === 'Space' && isWaitingRoll) {
                e.preventDefault();
                onRoll();
            } else if (e.code === 'Enter' && isReadyToCommit && canConfirm) {
                e.preventDefault();
                onConfirm();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isWaitingRoll, isReadyToCommit, canConfirm, onRoll, onConfirm]);

    if (!isWaitingRoll && !isMoving && !isReadyToCommit) return null;

    // Annuler n'a de sens qu'après le lancer ET au moins un sous-mouvement joué.
    const showUndo = hasDice && canUndo && !isWaitingRoll;

    return (
        <div
            data-testid="board-center-controls"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-none"
        >
            {/* Bouton principal unique : Lancer les dés */}
            {isWaitingRoll && (
                <button
                    type="button"
                    data-testid="center-roll-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRoll();
                    }}
                    className="pointer-events-auto inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl font-extrabold text-sm uppercase tracking-[0.12em] text-amber-100 bg-white/10 backdrop-blur-md border border-amber-300/40 shadow-[0_8px_32px_rgba(0,0,0,0.55)] hover:bg-white/15 hover:border-amber-300/70 active:scale-95 transition-all duration-200"
                >
                    <span aria-hidden="true" className="text-lg leading-none">🎲</span>
                    <span>Lancer les dés</span>
                </button>
            )}

            {/* Barre compacte : Annuler + Valider */}
            {!isWaitingRoll && (showUndo || isReadyToCommit) && (
                <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-slate-700/70 bg-slate-950/85 px-1.5 py-1 shadow-lg backdrop-blur-md">
                    {showUndo && (
                        <button
                            type="button"
                            data-testid="center-undo-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onUndo();
                            }}
                            className="rounded-lg border border-slate-600 bg-slate-800/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-200 transition hover:bg-slate-700 active:scale-95"
                        >
                            ↶ Annuler
                        </button>
                    )}
                    {isReadyToCommit && (
                        <button
                            type="button"
                            data-testid="center-confirm-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onConfirm();
                            }}
                            disabled={!canConfirm}
                            className="rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-900 shadow transition hover:from-emerald-300 hover:to-emerald-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            ✓ Valider
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const BoardCenterControls = React.memo(BoardCenterControlsComponent);
export default BoardCenterControls;
