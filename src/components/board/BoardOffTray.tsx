'use client';

/**
 * Sabot de sortie (bear-off tray) — Cuvette d'ébénisterie sculptée avec empilement 3D biseauté
 * sur la tranche et sortie ultra-rapide 1-tap / clic droit / swipe (Audit 4 / 20).
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import React, { useRef } from 'react';
import type { Player } from '../../engine/backgammonEngine';
import {
    MAX_CHECKERS_PER_PLAYER,
    formatBearOffCounter,
    isQuickBearOffSwipe,
} from '../../engine/bearOffRules';
import { getTrayAriaLabel } from './boardAria';

export interface BoardOffTrayProps {
    /** Index absolu du sabot (0 = sortie X, 25 = sortie O). */
    offPoint: number;
    /** Nombre de pions déjà sortis dans ce sabot (0..15). */
    count: number;
    /** Plateau complet (pour le calcul du libellé ARIA). */
    board: number[];
    /** Joueur au trait. */
    player: Player;
    /** Ce sabot est-il une destination légale du pion sélectionné ou d'un dé actif ? */
    isTarget: boolean;
    /** Le dernier coup adverse sort-il un pion dans ce sabot ? */
    isOpponentToOff: boolean;
    /** Identifiant de zone pour l'accessibilité clavier. */
    trayZoneId: string;
    /** Sortie 1-tap (dé principal). */
    onClick: (offPoint: number) => void;
    /** Sortie directe au clic droit (second dé). */
    onRightClick?: (offPoint: number) => void;
    /** Inverse le rendu Blanc/Noir (l'humain a choisi les Noirs). */
    swapColors?: boolean;
    /** Indique si le sabot a le focus clavier actif. */
    isFocused?: boolean;
}

const BoardOffTrayComponent: React.FC<BoardOffTrayProps> = ({
    offPoint,
    count,
    board,
    player,
    isTarget,
    isOpponentToOff,
    trayZoneId,
    onClick,
    onRightClick,
    swapColors = false,
    isFocused = false,
}) => {
    const isWhiteTray = (offPoint === 0) !== swapColors;
    const clampedCount = Math.max(0, Math.min(MAX_CHECKERS_PER_PLAYER, count));
    const visibleSlices = clampedCount;
    const trayKey = offPoint === 0 ? 'x' : 'o';
    const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
    const swipeTriggeredRef = useRef(false);

    return (
        <div
            data-testid={trayZoneId}
            data-point={offPoint}
            data-off-tray={offPoint}
            role="button"
            tabIndex={0}
            aria-label={getTrayAriaLabel(board, player, isTarget)}
            className={`relative flex-1 w-full min-w-0 sm:min-w-[44px] min-h-0 overflow-hidden flex flex-col items-center justify-between rounded-xl px-0.5 sm:px-1.5 py-1 sm:py-2 transition-all duration-150 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] select-none touch-manipulation ${
                isTarget
                    ? 'border-2 border-emerald-400 bg-emerald-950/60 shadow-[0_0_20px_rgba(52,211,153,0.6)] cursor-pointer hover:scale-[1.02]'
                    : isOpponentToOff
                        ? 'border-2 border-indigo-400 bg-indigo-950/50 ring-2 ring-indigo-400/80 shadow-[0_0_16px_rgba(99,102,241,0.5)]'
                        : 'border border-amber-600/35 bg-gradient-to-b from-[#1f1008] via-[#140904] to-[#0c0502] hover:border-amber-500/55 cursor-pointer'
            }`}
            style={{
                boxShadow:
                    'inset 0 4px 12px rgba(0, 0, 0, 0.9), inset 0 0 18px rgba(0, 0, 0, 0.75), 0 1px 2px rgba(255, 235, 180, 0.1)',
            }}
            onPointerDown={(e) => {
                swipeTriggeredRef.current = false;
                swipeStartRef.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
                if (!swipeStartRef.current) return;
                const dx = e.clientX - swipeStartRef.current.x;
                const dy = e.clientY - swipeStartRef.current.y;
                swipeStartRef.current = null;
                if (isQuickBearOffSwipe(dx, dy)) {
                    swipeTriggeredRef.current = true;
                    e.stopPropagation();
                    onClick(offPoint);
                }
            }}
            onClick={(e) => {
                e.stopPropagation();
                if (swipeTriggeredRef.current) {
                    swipeTriggeredRef.current = false;
                    return;
                }
                onClick(offPoint);
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onRightClick) {
                    onRightClick(offPoint);
                } else {
                    onClick(offPoint);
                }
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onClick(offPoint);
                }
            }}
        >
            {isFocused && (
                <div
                    data-testid={`keyboard-focus-indicator-tray-${trayKey}`}
                    className="absolute inset-0 z-30 rounded-xl ring-2 ring-amber-400/90 pointer-events-none"
                />
            )}
            <span className="hidden sm:inline [@media(max-height:540px)]:!hidden text-[10px] font-bold uppercase tracking-normal sm:tracking-widest text-amber-200/75 drop-shadow">
                Sortie
            </span>
            {isTarget && (
                <span className="sm:hidden px-0.5 py-0.5 rounded bg-emerald-400 text-slate-950 text-[10px] font-black tracking-tighter leading-none">
                    OFF
                </span>
            )}

            {/* Empilement 3D biseauté des pions sortis posés sur la tranche (groupés par blocs de 5 : 5+5+5) */}
            <div
                data-testid={`tray-stack-${trayKey}`}
                data-grouped-by-five="true"
                className="flex flex-col items-center justify-center gap-[2px] my-1 w-full px-1 flex-1"
            >
                {visibleSlices > 0 ? (
                    Array.from({ length: visibleSlices }).map((_, i) => {
                        const isFifthGroupEnd = (i + 1) % 5 === 0 && i < visibleSlices - 1;
                        return (
                            <span
                                key={i}
                                data-testid={`borne-off-slice-${offPoint}-${i}`}
                                data-beveled-slice="true"
                                data-group-end={isFifthGroupEnd ? 'true' : undefined}
                                className={`relative w-full max-w-[36px] h-[6px] rounded-[3px] border transition-transform duration-150 ${
                                    isWhiteTray
                                        ? 'border-amber-900/60'
                                        : 'border-white/25'
                                } ${isFifthGroupEnd ? 'mb-1.5 after:content-[""] after:absolute after:-bottom-[5px] after:inset-x-1 after:h-[1px] after:bg-amber-400/45' : ''}`}
                                style={{
                                    background: isWhiteTray
                                        ? 'linear-gradient(90deg, #b89f72 0%, #eadbc0 22%, #fffdf8 50%, #e4d2b2 78%, #9e8458 100%)'
                                        : 'linear-gradient(90deg, #09090b 0%, #27272a 24%, #71717a 50%, #27272a 76%, #09090b 100%)',
                                    boxShadow: isWhiteTray
                                        ? 'inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(120,85,40,0.65), 0 1px 2px rgba(0,0,0,0.75)'
                                        : 'inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.85)',
                                }}
                            />
                        );
                    })
                ) : (
                    <div className="w-5 h-5 rounded-full border border-amber-900/40 bg-black/40 flex items-center justify-center shadow-inner">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/20" />
                    </div>
                )}
            </div>

            {/* Compteur exact count/15 */}
            <span
                data-testid={`tray-counter-${trayKey}`}
                className="text-[10px] sm:text-xs [@media(max-height:540px)]:!text-[10px] font-black tabular-nums whitespace-nowrap text-amber-200/95 leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
            >
                {formatBearOffCounter(clampedCount)}
            </span>
        </div>
    );
};

export const BoardOffTray = React.memo(BoardOffTrayComponent);
export default BoardOffTray;
