'use client';

/**
 * Composant de tableau des scores et affichage des dés du tour (Joueur X, O, Tour, Dés, Lancer, Undo).
 *
 * Rôle :
 *   Affiche le statut de la manche en cours, les cartes des deux joueurs et les dés jouables.
 *
 * Dépendances :
 *   `Die`, `Player`.
 *
 * Retrait :
 *   Supprimer ce fichier et son appel dans `MatchHud.tsx`.
 */

import React from 'react';
import type { Player } from '../../engine/backgammonEngine';
import { Die } from '../board/Die';

export interface HudScoreboardProps {
    /** Longueur du match en points (0 = partie d'argent) */
    matchLength: number;
    /** Score du joueur X */
    scoreX: number;
    /** Score du joueur O */
    scoreO: number;
    /** Joueur au tour */
    turn: Player;
    /** Règle de Crawford active */
    crawford?: boolean;
    /** Dés du tour ou null */
    dice: [number, number] | null;
    /** État d'utilisation des dés */
    usedDice: [boolean, boolean] | boolean[];
    /** Handler pour relancer les dés */
    onRollDice?: () => void;
    /** Handler pour annuler le dernier sous-mouvement */
    onUndo?: () => void;
    /** Indique si l'action Undo est disponible */
    canUndo?: boolean;
    /** Performance Rating (PR) Joueur X */
    prX?: number | null;
    /** Performance Rating (PR) Joueur O */
    prO?: number | null;
}

function MiniDie({ value, used, label }: { value: number; used: boolean; label: string }) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <Die
                value={value}
                used={used}
                label={label}
                sizeClass="relative flex h-8 w-8 sm:h-9 sm:w-9"
            />
            <span className="text-[9px] font-medium tracking-tight text-slate-400 leading-none">
                {label}
            </span>
        </div>
    );
}

const HudScoreboardComponent: React.FC<HudScoreboardProps> = ({
    matchLength,
    scoreX,
    scoreO,
    turn,
    crawford = false,
    dice,
    usedDice,
    onRollDice,
    onUndo,
    canUndo = false,
    prX,
    prO,
}) => {
    const isXTurn = turn === 'X';
    const isOTurn = turn === 'O';

    return (
        <>
            {/* 1. Score du match, Joueurs & Tour */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                {/* Format du match & Badge Crawford */}
                <div className="flex flex-col text-[10px] leading-tight text-slate-400">
                    <span className="font-semibold text-slate-300">
                        {matchLength > 0 ? `Match en ${matchLength} pts` : 'Partie d’argent'}
                    </span>
                    {crawford && (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/40 w-max mt-0.5">
                            Crawford
                        </span>
                    )}
                </div>

                {/* Carte Joueur X */}
                <div
                    className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-all ${
                        isXTurn
                            ? 'bg-slate-800 ring-2 ring-blue-400 shadow-md shadow-blue-500/20'
                            : 'bg-slate-800/40 ring-1 ring-slate-700/60 opacity-85'
                    }`}
                    title={`Joueur X (Blanc) - Score : ${scoreX}${isXTurn ? ' - Au tour' : ''}${prX !== undefined && prX !== null ? ` - PR: ${prX.toFixed(1)}` : ''}`}
                >
                    <span className="h-3.5 w-3.5 rounded-full bg-slate-100 shadow-sm ring-1 ring-slate-400 shrink-0" />
                    <div className="flex flex-col leading-none">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-100">X (Blanc)</span>
                            {prX !== undefined && (
                                <span
                                    data-testid="hud-pr-x"
                                    title="Performance Rating (PR) Blanc — Taux d'erreur normalisé"
                                    className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-slate-900/90 border border-emerald-600/60 text-emerald-300"
                                >
                                    PR {prX !== null ? prX.toFixed(1) : '--'}
                                </span>
                            )}
                        </div>
                        {isXTurn && (
                            <span className="text-[9px] font-semibold text-blue-400">Au tour</span>
                        )}
                    </div>
                    <span className="text-sm sm:text-base font-black text-white ml-1">{scoreX}</span>
                </div>

                <span className="text-[10px] font-extrabold text-slate-500">VS</span>

                {/* Carte Joueur O */}
                <div
                    className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-all ${
                        isOTurn
                            ? 'bg-slate-800 ring-2 ring-blue-400 shadow-md shadow-blue-500/20'
                            : 'bg-slate-800/40 ring-1 ring-slate-700/60 opacity-85'
                    }`}
                    title={`Joueur O (Noir) - Score : ${scoreO}${isOTurn ? ' - Au tour' : ''}${prO !== undefined && prO !== null ? ` - PR: ${prO.toFixed(1)}` : ''}`}
                >
                    <span className="h-3.5 w-3.5 rounded-full bg-slate-900 ring-1 ring-slate-600 shadow-inner shrink-0" />
                    <div className="flex flex-col leading-none">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-200">O (Noir)</span>
                            {prO !== undefined && (
                                <span
                                    data-testid="hud-pr-o"
                                    title="Performance Rating (PR) IA Noire — Taux d'erreur normalisé"
                                    className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-slate-900/90 border border-indigo-600/60 text-indigo-300"
                                >
                                    PR {prO !== null ? prO.toFixed(1) : '--'}
                                </span>
                            )}
                        </div>
                        {isOTurn && (
                            <span className="text-[9px] font-semibold text-blue-400">Au tour</span>
                        )}
                    </div>
                    <span className="text-sm sm:text-base font-black text-white ml-1">{scoreO}</span>
                </div>
            </div>

            {/* 2. Dés du tour (Centre) */}
            <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-800/40 px-2.5 py-1 ring-1 ring-slate-700/50 shrink-0">
                {dice ? (
                    dice[0] === dice[1] ? (
                        <div className="flex items-center gap-1 sm:gap-1.5">
                            {[0, 1, 2, 3].map((idx) => (
                                <MiniDie
                                    key={idx}
                                    value={dice[0]}
                                    used={Boolean(usedDice[idx])}
                                    label={`Coup ${idx + 1}`}
                                />
                            ))}
                            <span className="hidden sm:inline-block text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-400/40 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                {Math.max(0, 4 - usedDice.filter(Boolean).length)}/4
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1.5">
                                <MiniDie value={dice[0]} used={Boolean(usedDice[0])} label="Dé 1 (G)" />
                                <MiniDie value={dice[1]} used={Boolean(usedDice[1])} label="Dé 2 (D)" />
                            </div>
                            <span className="hidden md:inline text-[9px] text-slate-400 leading-none mt-0.5">
                                Clic G : Dé gauche · Clic D : Dé droit
                            </span>
                        </div>
                    )
                ) : (
                    <div className="flex h-8 sm:h-9 items-center justify-center px-2 text-xs text-slate-400 font-medium">
                        En attente du lancer
                    </div>
                )}

                {onRollDice && (
                    <button
                        type="button"
                        onClick={onRollDice}
                        data-testid="hud-roll-dice-btn"
                        title="Lancer ou relancer les dés"
                        className="group flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-600 bg-slate-700/80 text-slate-200 shadow hover:border-blue-400 hover:bg-blue-600 hover:text-white transition active:scale-95 shrink-0"
                        aria-label="Lancer les dés"
                    >
                        <svg className="h-4 w-4 transition group-hover:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                )}

                {onUndo && (
                    <button
                        type="button"
                        onClick={onUndo}
                        disabled={!canUndo}
                        data-testid="hud-undo-btn"
                        title="Annuler le dernier sous-mouvement"
                        aria-label="Annuler le dernier coup"
                        className={`flex h-8 sm:h-9 items-center justify-center gap-1 rounded-xl border px-2 text-xs font-bold transition active:scale-95 shrink-0 ${
                            canUndo
                                ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                                : 'border-slate-700 bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-50'
                        }`}
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                        Annuler
                    </button>
                )}
            </div>
        </>
    );
};

export const HudScoreboard = React.memo(HudScoreboardComponent);
export default HudScoreboard;
