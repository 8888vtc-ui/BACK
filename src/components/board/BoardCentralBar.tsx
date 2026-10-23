'use client';

/**
 * Barre centrale du plateau — Boiserie d'ébène vernie avec filets de laiton brossé,
 * pions frappés en résine 3D et videau de tournoi (style Snowie 4 Pro).
 *
 * Rôle :
 *   Isole la colonne centrale hors de `Board.tsx` (LOI 5). Affiche les pions
 *   frappés (barre X en bas, barre O en haut) et le videau dans sa zone
 *   d'appartenance (haut / centre / bas).
 *
 * Dépendances :
 *   `Checker`, `DoublingCube`, `boardGeometry` (`MAX_VISIBLE`).
 *   Mémoïsé via React.memo.
 */

import React from 'react';
import type { Player } from '../../engine/backgammonEngine';
import { MAX_VISIBLE } from './boardGeometry';
import { Checker, type CheckerColor } from './Checker';
import { DoublingCube } from './DoublingCube';
import { getBoardThemeTokens } from './boardThemes';

export interface BoardCentralBarProps {
    /** Nombre de pions blancs (X) sur la barre. */
    barX: number;
    /** Nombre de pions noirs (O) sur la barre. */
    barO: number;
    /** Le joueur X est-il au trait (détermine la jouabilité du haut de pile) ? */
    isXTurn: boolean;
    cubeValue: number;
    cubeOwner: Player | null;
    canDouble: boolean;
    onBarClick: (barPoint: number) => void;
    onBarRightClick: (barPoint: number) => void;
    onCheckerPointerDown?: (pointNumber: number, color: CheckerColor, e: React.PointerEvent) => void;
    onOfferDouble?: () => void;
    /** Index absolu de la barre X (0) et de la barre O (25) côté moteur. */
    xBarPoint: number;
    oBarPoint: number;
    /** Thème actif (défaut : `snowie_classic`). */
    theme?: string;
    /** Inverse le rendu Blanc/Noir (l'humain a choisi les Noirs). */
    swapColors?: boolean;
    /** Vrai si le joueur sur la barre ne peut entrer sur aucune porte (Danse / Fanned — Audit 3/20). */
    isDanced?: boolean;
    /** Message explicite affiché en cas de danse sur la barre. */
    dancedMessage?: string | null;
}

/** Rend une pile de pions frappés pour une couleur donnée. */
const BarStack: React.FC<{
    color: CheckerColor;
    count: number;
    isPlayable: boolean;
    barPoint: number;
    onBarClick: (barPoint: number) => void;
    onBarRightClick: (barPoint: number) => void;
    onCheckerPointerDown?: (pointNumber: number, color: CheckerColor, e: React.PointerEvent) => void;
}> = ({ color, count, isPlayable, barPoint, onBarClick, onBarRightClick, onCheckerPointerDown }) => {
    const visible = Math.min(count, MAX_VISIBLE);
    return (
        <div
            data-testid={`bar-section-${barPoint}`}
            className="flex flex-col items-center justify-center py-2 cursor-pointer touch-none"
            onClick={(e) => {
                e.stopPropagation();
                onBarClick(barPoint);
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                onBarRightClick(barPoint);
            }}
        >
            {count > 0 &&
                Array.from({ length: visible }).map((_, idx) => {
                    const isTop = idx === visible - 1;
                    return (
                        <div
                            key={idx}
                            data-testid={isTop && isPlayable ? 'bar-checker-pulse' : `bar-checker-${barPoint}-${idx}`}
                            className={`rounded-full transition-transform duration-300 ${isTop && isPlayable
                                ? 'ring-4 ring-amber-400/95 shadow-[0_0_20px_rgba(251,191,36,0.75)] animate-pulse scale-105'
                                : 'ring-2 ring-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                                } ${idx > 0 ? '-mt-2 sm:-mt-2.5' : ''}`}
                        >
                            <Checker
                                color={color}
                                countBadge={count > MAX_VISIBLE && isTop ? count : undefined}
                                isPlayable={isPlayable}
                                isTopChecker={isTop}
                                onPointerDown={isTop && isPlayable ? (e) => onCheckerPointerDown?.(barPoint, color, e) : undefined}
                            />
                        </div>
                    );
                })}
        </div>
    );
};

const BoardCentralBarComponent: React.FC<BoardCentralBarProps> = ({
    barX,
    barO,
    isXTurn,
    cubeValue,
    cubeOwner,
    canDouble,
    onBarClick,
    onBarRightClick,
    onCheckerPointerDown,
    onOfferDouble,
    xBarPoint,
    oBarPoint,
    theme,
    swapColors = false,
    isDanced = false,
    dancedMessage = null,
}) => {
    const bar = getBoardThemeTokens(theme).bar;
    const colorO: CheckerColor = swapColors ? 'white' : 'black';
    const colorX: CheckerColor = swapColors ? 'black' : 'white';
    return (
    <div
        className="relative row-span-2 w-8 sm:w-14 md:w-20 flex flex-col justify-between items-center rounded-xl mx-0.5 sm:mx-1 py-1 sm:py-2 select-none"
        style={{
            background: bar.background,
            boxShadow: bar.boxShadow,
            borderLeft: `2px solid ${bar.borderColor}`,
            borderRight: `2px solid ${bar.borderColor}`,
        }}
        data-testid="central-bar-container"
    >
        {isDanced && (
            <div
                role="status"
                aria-live="assertive"
                data-testid="bar-danced-banner"
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 whitespace-nowrap rounded-xl border border-rose-500/80 bg-slate-950/95 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-rose-200 shadow-[0_10px_30px_rgba(244,63,94,0.45)] animate-pulse"
            >
                {dancedMessage ?? 'Aucun coup possible — Portes fermées (Danse)'}
            </div>
        )}
        {/* Reflet zénithal doux sur l'arête de la barre */}
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-16 rounded-t-xl"
            style={{
                background:
                    'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)',
            }}
        />

        {/* Zone Haut (Côté Joueur O / Noir) */}
        <div className="flex flex-col items-center gap-1.5 w-full min-h-[48px] z-10" data-testid="bar-zone-top">
            <BarStack
                color={colorO}
                count={barO}
                isPlayable={!isXTurn}
                barPoint={oBarPoint}
                onBarClick={onBarClick}
                onBarRightClick={onBarRightClick}
                onCheckerPointerDown={onCheckerPointerDown}
            />
            {cubeOwner === 'O' && (
                <DoublingCube cubeValue={cubeValue} cubeOwner={cubeOwner} canDouble={canDouble} onOfferDouble={onOfferDouble} />
            )}
        </div>

        {/* Zone Centre (Neutre au milieu : avant le premier double) */}
        <div className="flex items-center justify-center min-h-[48px] z-10" data-testid="bar-zone-middle">
            {cubeOwner === null && (
                <DoublingCube cubeValue={cubeValue} cubeOwner={cubeOwner} canDouble={canDouble} onOfferDouble={onOfferDouble} />
            )}
        </div>

        {/* Zone Bas (Côté Joueur X / Blanc) */}
        <div className="flex flex-col items-center gap-1.5 w-full min-h-[48px] z-10" data-testid="bar-zone-bottom">
            {cubeOwner === 'X' && (
                <DoublingCube cubeValue={cubeValue} cubeOwner={cubeOwner} canDouble={canDouble} onOfferDouble={onOfferDouble} />
            )}
            <BarStack
                color={colorX}
                count={barX}
                isPlayable={isXTurn}
                barPoint={xBarPoint}
                onBarClick={onBarClick}
                onBarRightClick={onBarRightClick}
                onCheckerPointerDown={onCheckerPointerDown}
            />
        </div>
    </div>
    );
};

export const BoardCentralBar = React.memo(BoardCentralBarComponent);

export default BoardCentralBar;
