'use client';

import React from 'react';
import type { Player } from '../../engine/backgammonEngine';
import type { GamePhase } from '../../hooks/useBackgammonGame';

export interface DoublingControlsProps {
    phase: GamePhase;
    cubeValue: number;
    cubeOwner: Player | null;
    canDouble: boolean;
    crawford: boolean;
    isDMP?: boolean;
    doublingOfferedBy: Player | null;
    currentTurn: Player;
    onOfferDouble: () => void;
    onTakeDouble: () => void;
    onPassDouble: () => void;
}

export default function DoublingControls({
    phase,
    cubeValue,
    cubeOwner,
    canDouble,
    crawford,
    isDMP = false,
    doublingOfferedBy,
    currentTurn,
    onOfferDouble,
    onTakeDouble,
    onPassDouble,
    standalone = true,
}: DoublingControlsProps & { standalone?: boolean }) {
    const nextCubeValue = cubeValue === 1 ? 2 : cubeValue * 2;
    const isDoublePending = phase === 'DOUBLING_OFFERED';

    if (!standalone && !isDoublePending) {
        return null;
    }

    return (
        <section
            aria-label="Contrôles du videau"
            className="w-full max-w-6xl"
        >
            {/* Modal / Bannière interactive quand un double est proposé (Prendre / Passer) */}
            {isDoublePending && (
                <div
                    role="alertdialog"
                    aria-labelledby="doubling-prompt-title"
                    className="relative flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border-2 border-amber-500/60 bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-amber-950/80 p-4 sm:p-5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 font-black text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 text-xl">
                            {nextCubeValue}
                        </div>
                        <div>
                            <h3 id="doubling-prompt-title" className="text-base font-bold text-amber-200">
                                Proposition de videau : doubler à {nextCubeValue} !
                            </h3>
                            <p className="text-xs text-amber-300/80">
                                Proposé par le <strong>Joueur {doublingOfferedBy}</strong>. Acceptez pour continuer à jouer avec la nouvelle valeur, ou passez pour concéder la manche.
                            </p>
                        </div>
                    </div>

                    <div className="flex w-full sm:w-auto items-center gap-3">
                        {/* Bouton PRENDRE (Take) */}
                        <button
                            type="button"
                            onClick={onTakeDouble}
                            data-testid="take-double-btn"
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition active:scale-95"
                            aria-label={`Prendre le videau à ${nextCubeValue}`}
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Prendre (Take)</span>
                        </button>

                        {/* Bouton PASSER (Drop / Pass) */}
                        <button
                            type="button"
                            onClick={onPassDouble}
                            data-testid="pass-double-btn"
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-red-700 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-red-600 transition active:scale-95"
                            aria-label="Passer et concéder la manche"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Passer (Drop)</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Barre de contrôle du videau (Bouton DOUBLER) quand ce n'est pas en attente de réponse */}
            {!isDoublePending && phase === 'WAITING_FOR_ROLL' && currentTurn === 'X' && (
                <div className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2.5">
                        <span className="font-bold text-slate-200">Videau actuel :</span>
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300 ring-1 ring-amber-500/40">
                            {cubeValue === 1 ? '64 (neutre)' : cubeValue}
                        </span>
                        <span className="text-slate-400">
                            {cubeOwner === null ? '· Centré' : `· Détenu par ${cubeOwner}`}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={onOfferDouble}
                        disabled={!canDouble}
                        data-testid="offer-double-btn"
                        title={
                            crawford
                                ? 'Règle de Crawford : le videau est suspendu pour cette manche'
                                : isDMP
                                ? 'Double Match Point (DMP) : le videau est désactivé'
                                : !canDouble
                                ? 'Vous ne possédez pas le videau pour doubler ou le videau est indisponible'
                                : `Proposer de doubler le videau à ${nextCubeValue}`
                        }
                        className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-bold transition shadow ${
                            canDouble
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 active:scale-95'
                                : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
                        }`}
                    >
                        <span>🎲</span>
                        <span>Doubler ({nextCubeValue})</span>
                    </button>
                </div>
            )}
        </section>
    );
}
