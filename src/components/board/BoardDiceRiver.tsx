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

    const dieSizeClass = isDouble
        ? 'w-5 h-5 sm:w-8 sm:h-8 md:w-9 md:h-9 [@media(max-height:540px)]:!w-5 [@media(max-height:540px)]:!h-5'
        : 'w-6 h-6 sm:w-9 sm:h-9 md:w-10 md:h-10 [@media(max-height:540px)]:!w-6 [@media(max-height:540px)]:!h-6';

    return (
        <>
            <div className="pointer-events-none absolute left-[25%] sm:left-[24%] top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-1 sm:gap-2.5 [@media(max-height:540px)]:!gap-1.5 max-w-[44%] sm:max-w-[42%]">
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
                                  : canSwapOrder
                                    ? "Inverser l'ordre des dés"
                                    : `Dés ${dice[0]} et ${dice[1]}`
                        }
                        title={
                            confirmOnClick
                                ? 'Cliquer sur les dés pour valider le tour'
                                : isDouble
                                  ? `Double ${dice[0]}`
                                  : canSwapOrder
                                    ? "Cliquer pour inverser l'ordre des dés"
                                    : `Dés ${dice[0]} et ${dice[1]}`
                        }
                        onClick={handleContainerClick}
                        onKeyDown={handleContainerKeyDown}
                        className={`pointer-events-auto flex items-center ${isDouble ? 'gap-0.5 sm:gap-1.5 [@media(max-height:540px)]:!gap-1' : 'gap-1 sm:gap-2 [@media(max-height:540px)]:!gap-1.5'} rounded-xl py-0.5 cursor-pointer transition active:scale-95 touch-manipulation drop-shadow-[0_6px_12px_rgba(0,0,0,0.75)]`}
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
                                    sizeClass={dieSizeClass}
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
                        {canSwapOrder && (
                            <span
                                data-testid="dice-order-indicator"
                                aria-hidden="true"
                                className="sr-only"
                            >
                                {selectedDie === 1 ? '2→1' : '1→2'}
                            </span>
                        )}
                    </div>
                )}

                {opponentDice && (
                    <div
                        data-testid="opponent-dice"
                        className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 [@media(max-height:540px)]:!gap-1.5 drop-shadow-[0_6px_12px_rgba(0,0,0,0.75)]"
                        title="Dés lancés par l'adversaire"
                    >
                        {opponentDice.map((value, i) => (
                            <Die
                                key={`opp-${i}-${opponentDice[0]}-${opponentDice[1]}`}
                                value={value}
                                variant="ebony"
                                sizeClass="w-6 h-6 sm:w-9 sm:h-9 md:w-10 md:h-10 [@media(max-height:540px)]:!w-6 [@media(max-height:540px)]:!h-6"
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

            {dice && (canSwapOrder || confirmOnClick) && (
                <div
                    data-testid="river-swap-zone"
                    role="button"
                    tabIndex={-1}
                    aria-label={confirmOnClick ? 'Valider le tour' : "Inverser l'ordre des dés (côté droit de la rivière)"}
                    onClick={handleContainerClick}
                    className="pointer-events-auto absolute left-[75%] sm:left-[74%] top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-[42%] h-9 rounded-xl cursor-pointer touch-manipulation"
                />
            )}
        </>
    );
};

export const BoardDiceRiver = React.memo(BoardDiceRiverComponent);
export default BoardDiceRiver;
