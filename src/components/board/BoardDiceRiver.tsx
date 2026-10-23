'use client';

/**
 * Rivière centrale du plateau — dés du joueur (ivoire) + dés de l'adversaire (ébène).
 *
 * Rôle :
 *   Isole l'affichage et l'interaction des dés hors de `Board.tsx` (LOI 5).
 *   - En lancer simple (2 dés distincts) : clic/tap sur le conteneur ou sur le dé
 *     actif inverse l'ordre (`1→2` ⇄ `2→1`), clic sur l'autre dé disponible le sélectionne.
 *   - En lancer double (4 dés identiques) : affiche les 4 dés, met en évidence le
 *     prochain dé non consommé, et route tous les clics/double-clics de dé vers
 *     l'emplacement canonique `0` sans jamais tenter de swapper deux dés identiques.
 *   - Dés adverses (IA) : rendus avec de vrais dés graphiques `<Die variant="ebony" />`.
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
    /** Tour complet en validation manuelle : un clic sur les dés valide le tour (« ramasser les dés »). */
    canConfirm?: boolean;
    onConfirmTurn?: () => void;
}

const BoardDiceRiverComponent: React.FC<BoardDiceRiverProps> = ({
    dice,
    usedDice,
    selectedDie,
    opponentDice,
    onDiceClick,
    onSelectDie,
    canConfirm = false,
    onConfirmTurn,
}) => {
    if (!dice && !opponentDice) return null;

    const isDouble = dice !== null && dice[0] === dice[1];
    const visibleDice = dice ? (isDouble ? [dice[0], dice[0], dice[0], dice[0]] : dice) : [];
    const firstUnusedIdx = visibleDice.findIndex((_, idx) => !usedDice[idx]);
    const canSwapOrder = !isDouble && !usedDice[0] && !usedDice[1];
    const rollSignature = dice ? `${dice[0]}-${dice[1]}` : '';
    const confirmOnClick = canConfirm && Boolean(onConfirmTurn);

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (confirmOnClick) {
            onConfirmTurn?.();
            return;
        }
        if (isDouble) {
            if (firstUnusedIdx !== -1) onSelectDie?.(0);
            return;
        }
        onDiceClick?.();
    };

    const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (confirmOnClick) {
                onConfirmTurn?.();
            } else if (isDouble) {
                if (firstUnusedIdx !== -1) onSelectDie?.(0);
            } else {
                onDiceClick?.();
            }
        }
    };

    return (
        <div className="pointer-events-none absolute left-[24%] top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-2 sm:gap-4">
            {dice && (
                <div
                    data-testid="board-dice-pair"
                    role="button"
                    tabIndex={0}
                    aria-label={
                        confirmOnClick
                            ? 'Valider le tour'
                            : isDouble
                              ? `Double ${dice[0]} (${4 - visibleDice.filter((_, i) => usedDice[i]).length} restants)`
                              : "Inverser l'ordre des dés"
                    }
                    title={confirmOnClick ? 'Cliquer sur les dés pour valider le tour' : isDouble ? `Double ${dice[0]}` : "Cliquer pour inverser l'ordre des dés"}
                    onClick={handleContainerClick}
                    onKeyDown={handleContainerKeyDown}
                    className="pointer-events-auto flex items-center gap-2 sm:gap-3 rounded-xl px-1.5 sm:px-2.5 py-1 min-h-[40px] sm:min-h-[44px] cursor-pointer transition hover:bg-white/5 active:scale-95"
                >
                    {visibleDice.map((value, i) => {
                        const dieSlot: 0 | 1 = i === 0 ? 0 : 1;
                        const used = Boolean(usedDice[i]);
                        const active = isDouble ? i === firstUnusedIdx : !used && selectedDie === dieSlot;

                        return (
                            <Die
                                key={`${i}-${rollSignature}`}
                                value={value}
                                used={used}
                                active={active}
                                disabled={used && !confirmOnClick}
                                variant="ivory"
                                rollIndex={i}
                                animateRoll
                                label={
                                    isDouble
                                        ? `Dé ${i + 1} sur 4 (valeur ${value})`
                                        : `Dé ${i + 1} (valeur ${value}) — toucher pour inverser l'ordre`
                                }
                                dataTestId={`board-die-${i}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirmOnClick) {
                                        onConfirmTurn?.();
                                        return;
                                    }
                                    if (used) return;
                                    if (isDouble) {
                                        onSelectDie?.(0);
                                        return;
                                    }
                                    if (selectedDie === dieSlot && canSwapOrder && onDiceClick) {
                                        onDiceClick();
                                    } else if (onSelectDie) {
                                        onSelectDie(dieSlot);
                                    } else {
                                        onDiceClick?.();
                                    }
                                }}
                            />
                        );
                    })}
                    {!isDouble && (
                        <span
                            data-testid="dice-order-indicator"
                            aria-hidden="true"
                            className="ml-0.5 flex flex-col items-center justify-center rounded-lg bg-slate-950/75 border border-amber-400/35 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200/95 shadow-md backdrop-blur-sm"
                        >
                            <span className="text-[10px] leading-none text-sky-300">⇄</span>
                            <span className="leading-tight">{selectedDie === 1 ? '2→1' : '1→2'}</span>
                        </span>
                    )}
                </div>
            )}

            {opponentDice && (
                <div
                    data-testid="opponent-dice"
                    className="pointer-events-auto flex items-center gap-2 sm:gap-2.5 px-2.5 py-1.5 rounded-xl bg-slate-950/65 border border-amber-500/35 shadow-xl backdrop-blur-sm"
                    title="Dés lancés par l'adversaire"
                >
                    {opponentDice.map((value, i) => (
                        <Die
                            key={`opp-${i}-${opponentDice[0]}-${opponentDice[1]}`}
                            value={value}
                            variant="ebony"
                            rollIndex={i}
                            animateRoll
                            disabled
                            label={`Dé IA ${i + 1} : ${value}`}
                            dataTestId={`opponent-die-${i}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const BoardDiceRiver = React.memo(BoardDiceRiverComponent);
export default BoardDiceRiver;
