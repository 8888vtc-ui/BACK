'use client';

/**
 * Barre d'action contextuelle de tour de jeu et sélecteur de difficulté IA.
 *
 * Rôle :
 *   Affiche les alertes contextuelles de tour (à vous de jouer, roll-off de début de partie,
 *   statut de réflexion de l'ordinateur, récapitulatif du dernier coup joué par l'adversaire),
 *   les boutons d'action (Lancer les dés, Doubler) et le sélecteur de niveau IA.
 *
 * Dépendances :
 *   `RollOffDice`, `DifficultySelector`, `formatMoveSequenceNotationAbsolute`, `Move`, `AIDifficulty`.
 *
 * Retrait :
 *   Supprimer ce fichier et son import dans `page.tsx`.
 */

import React from 'react';
import { RollOffDice } from '../board/RollOffDice';
import DifficultySelector from './DifficultySelector';
import type { AIDifficulty } from '../../engine/aiHeuristics';
import type { Move } from '../../engine/backgammonEngine';
import { formatMoveSequenceNotationAbsolute } from '../../lib/engine/evaluator';

export interface MatchTurnBarProps {
    /** Indique si une partie multijoueur en ligne est en cours */
    isMultiplayerActive: boolean;
    /** Indique si le tirage au sort initial (roll-off) est terminé */
    rollOffDone: boolean;
    /** Valeurs du tirage au sort initial */
    rollOff: {
        xDie: number | null;
        oDie: number | null;
        winner: 'X' | 'O' | null;
    };
    /** Déclencheur du lancer de dé de démarrage */
    onRollOff: () => void;
    /** Phase actuelle du jeu */
    phase: string;
    /** Indique si c'est au joueur local de lancer les dés */
    isMyTurnToRoll: boolean;
    /** Indique si le joueur a le droit de proposer le videau */
    canDouble: boolean;
    /** Valeur actuelle du dé doubleur */
    cubeValue: number;
    /** Action de proposition du videau */
    onOfferDouble: () => void;
    /** Action de lancer des dés */
    onRollDice: () => void;
    /** Message d'état de l'adversaire IA */
    opponentStatusMessage?: string | null;
    /** Derniers dés lancés par l'adversaire */
    lastOpponentDice?: [number, number] | null;
    /** Derniers mouvements joués par l'adversaire */
    lastOpponentMoves?: Move[] | null;
    /** Niveau de difficulté IA actif */
    difficulty: AIDifficulty;
    /** Changement de niveau de difficulté IA */
    onChangeDifficulty: (difficulty: AIDifficulty) => void;
}

const MatchTurnBarComponent: React.FC<MatchTurnBarProps> = ({
    isMultiplayerActive,
    rollOffDone,
    rollOff,
    onRollOff,
    phase,
    isMyTurnToRoll,
    canDouble,
    cubeValue,
    onOfferDouble,
    onRollDice,
    opponentStatusMessage,
    lastOpponentDice,
    lastOpponentMoves,
    difficulty,
    onChangeDifficulty,
}) => {
    return (
        <div className="flex w-full flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex-1 w-full sm:w-auto">
                {/* Roll-off (dé de démarrage) : affiché au début du match, avant le premier lancer */}
                {!rollOffDone && !isMultiplayerActive && phase === 'WAITING_FOR_ROLL' && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-gradient-to-r from-stone-900/95 via-slate-900/95 to-amber-950/40 px-3.5 py-1.5 shadow-md backdrop-blur-md animate-in fade-in">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
                            <span className="text-xs font-semibold text-amber-200">
                                Tirage au sort d'ouverture — Déterminer qui commence la partie
                            </span>
                        </div>
                        <RollOffDice
                            xDie={rollOff.xDie}
                            oDie={rollOff.oDie}
                            onRollOff={onRollOff}
                        />
                    </div>
                )}

                {/* Tour du joueur local : bouton Lancer les dés et Doubler */}
                {isMyTurnToRoll && (
                    <div className="flex items-center justify-between rounded-xl border border-blue-500/40 bg-blue-950/60 px-3.5 py-1.5 shadow-md backdrop-blur-sm animate-in fade-in">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2.5 w-2.5 rounded-full bg-blue-400 animate-ping" />
                            <span className="text-xs font-semibold text-blue-200">
                                À vous de jouer — Lancez les dés pour jouer votre tour
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {canDouble && (
                                <button
                                    type="button"
                                    data-testid="doubler-btn"
                                    onClick={onOfferDouble}
                                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow hover:from-amber-400 hover:to-amber-500 transition active:scale-95"
                                >
                                    <span>🎲</span>
                                    <span>Doubler (x{cubeValue === 1 ? 2 : cubeValue * 2})</span>
                                </button>
                            )}
                            <button
                                type="button"
                                data-testid="roll-dice-btn"
                                onClick={onRollDice}
                                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow hover:from-blue-500 hover:to-indigo-500 transition active:scale-95"
                            >
                                <span>🎲</span>
                                <span>Lancer les dés</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* En cours de jeu : déplacement des pions */}
                {rollOffDone && !isMultiplayerActive && phase === 'PLAYING_MOVES' && (
                    <div className="hidden sm:flex items-center justify-between rounded-xl border border-blue-500/30 bg-slate-900/70 px-3 py-1.5 shadow-sm text-xs">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                            <span className="text-slate-200 font-medium">À vous de jouer — Cliquez ou glissez vos pions pour jouer vos dés.</span>
                        </div>
                    </div>
                )}


                {/* Statut IA en cours de réflexion */}
                {!isMultiplayerActive && phase === 'OPPONENT_THINKING' && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl border border-amber-600/70 bg-stone-900/90 px-3 py-1.5 shadow-md backdrop-blur-sm ring-1 ring-amber-500/30">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
                            <span className="text-xs font-bold text-amber-200">
                                {opponentStatusMessage || "Tour de l’ordinateur (Noir) · Analyse en cours..."}
                            </span>
                        </div>
                        {lastOpponentDice && (
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black/60 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                                <span>🎲🎲</span>
                                <span>Dés IA : {lastOpponentDice[0]} - {lastOpponentDice[1]}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Affichage du dernier coup de l'IA */}
                {!isMultiplayerActive && lastOpponentMoves && lastOpponentMoves.length > 0 && phase !== 'OPPONENT_THINKING' && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-stone-900/80 border border-amber-800/40 text-xs text-stone-300">
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                            <span>📜</span>
                            <span>Dernier coup Noir :</span>
                        </span>
                        <span className="font-mono text-amber-200 font-bold">
                            {lastOpponentDice ? `[${lastOpponentDice[0]}-${lastOpponentDice[1]}] ` : ''}
                            {formatMoveSequenceNotationAbsolute(lastOpponentMoves, 'O')}
                        </span>
                    </div>
                )}
            </div>

            {/* Sélecteur de niveau d'IA ou Badge Multijoueur */}
            <div className="flex items-center justify-end shrink-0">
                {!isMultiplayerActive ? (
                    <DifficultySelector
                        difficulty={difficulty}
                        onChange={onChangeDifficulty}
                    />
                ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Match Multijoueur Classé</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export const MatchTurnBar = React.memo(MatchTurnBarComponent);
export default MatchTurnBar;
