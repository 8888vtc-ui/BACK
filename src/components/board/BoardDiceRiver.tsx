'use client';

/**
 * Rivière centrale du plateau — dés du joueur + dés de l'adversaire.
 *
 * Rôle :
 *   Isole l'affichage des dés hors de `Board.tsx` (LOI 5). Clic/tap sur la
 *   paire de dés du joueur inverse leur ordre ; les dés adverses sont en
 *   lecture seule.
 *
 * Dépendances :
 *   `Die`.
 *
 * Retrait :
 *   Supprimer ce fichier et réinliner le JSX dans `Board.tsx`.
 */

import React from 'react';
import { Die } from './Die';

export interface BoardDiceRiverProps {
    dice: [number, number] | null;
    usedDice: [boolean, boolean] | boolean[];
    selectedDie: 0 | 1 | null;
    opponentDice?: [number, number] | null;
    onDiceClick?: () => void;
    onSelectDie?: (die: 0 | 1) => void;
    onDieDoubleClick?: (die: 0 | 1) => void;
}

export const BoardDiceRiver: React.FC<BoardDiceRiverProps> = ({
    dice,
    usedDice,
    selectedDie,
    opponentDice,
    onDiceClick,
    onSelectDie,
    onDieDoubleClick,
}) => (
    <div className="flex items-center justify-center gap-6 py-3 shrink-0">
        {dice && (
            <div
                data-testid="board-dice-pair"
                role="button"
                tabIndex={0}
                aria-label="Inverser l'ordre des dés"
                title="Cliquer pour inverser l'ordre des dés"
                onClick={(e) => {
                    e.stopPropagation();
                    onDiceClick?.();
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onDiceClick?.();
                    }
                }}
                className="flex items-center gap-3 rounded-xl px-2 py-1 min-h-[44px] cursor-pointer transition hover:bg-white/5 active:scale-95"
            >
                {dice.map((value, i) => {
                    const die = i as 0 | 1;
                    const used = Boolean(usedDice[i]);
                    const active = selectedDie === die;
                    return (
                        <Die
                            key={i}
                            value={value}
                            used={used}
                            active={active}
                            disabled={used}
                            label={`Dé ${i + 1} — toucher pour inverser l'ordre`}
                            dataTestId={`board-die-${i}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectDie?.(die);
                            }}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                onDieDoubleClick?.(die);
                            }}
                        />
                    );
                })}
                {/* Indicateur d'ordre des dés (retour visuel du dé actif). */}
                <span
                    data-testid="dice-order-indicator"
                    aria-hidden="true"
                    className="ml-1 flex flex-col items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200/80"
                >
                    <span>⇄</span>
                    <span>{selectedDie === 1 ? '2→1' : '1→2'}</span>
                </span>
            </div>
        )}

        {opponentDice && (
            <div
                data-testid="opponent-dice"
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/50 border border-amber-500/40"
                title="Dés lancés par l'adversaire"
            >
                <span className="text-xs font-bold text-amber-300">IA</span>
                {opponentDice.map((value, i) => (
                    <span
                        key={i}
                        className="w-9 h-9 rounded-md flex items-center justify-center text-lg font-extrabold bg-slate-700 text-amber-200 border border-slate-600"
                    >
                        {value}
                    </span>
                ))}
            </div>
        )}
    </div>
);

export default BoardDiceRiver;
