'use client';

/**
 * Contrôles de jeu précieux au centre du quadrant droit du plateau (< 240 lignes, 0 `any`).
 */

import React, { useEffect } from 'react';
import type { GamePhase } from '../../actions/types';
import { impactLight, impactMedium } from '../../lib/capacitor/haptics';
import type { GameSpeed } from '../../lib/gameFeel/speedPresets';
import type { AutoConfirmMode } from '../../lib/settings/gameplaySettings';
import { AutoConfirmControl, AUTO_CONFIRM_MODE_LABELS, SPEED_LABELS } from './BoardActions';

export { AUTO_CONFIRM_MODE_LABELS };

export interface BoardCenterControlsProps {
    readonly gamePhase: GamePhase | 'REPLAY_VIEW';
    readonly onRoll: () => void;
    readonly onConfirm: () => void;
    readonly onUndo: () => void;
    readonly canUndo: boolean;
    readonly canConfirm: boolean;
    readonly hasDice: boolean;
    readonly canDouble?: boolean;
    readonly cubeValue?: number;
    readonly doublingOfferedBy?: 'X' | 'O' | null;
    readonly onOfferDouble?: () => void;
    readonly onTakeDouble?: () => void;
    readonly onPassDouble?: () => void;
    readonly autoConfirmEnabled?: boolean;
    readonly onToggleAutoConfirm?: () => void;
    readonly autoConfirmMode?: AutoConfirmMode;
    readonly onSelectAutoConfirmMode?: (mode: AutoConfirmMode) => void;
    readonly onCycleAutoConfirmMode?: () => void;
    readonly gameSpeed?: GameSpeed;
    readonly onCycleGameSpeed?: () => void;
}

const BoardCenterControlsComponent: React.FC<BoardCenterControlsProps> = ({
    gamePhase,
    onRoll,
    onConfirm,
    onUndo,
    canUndo,
    canConfirm,
    hasDice,
    canDouble = false,
    cubeValue = 1,
    doublingOfferedBy = null,
    onOfferDouble,
    onTakeDouble,
    onPassDouble,
    autoConfirmEnabled = false,
    onToggleAutoConfirm,
    autoConfirmMode,
    onSelectAutoConfirmMode,
    onCycleAutoConfirmMode,
    gameSpeed = 'tournament',
    onCycleGameSpeed,
}) => {
    const isWaitingRoll = gamePhase === 'HUMAN_WAITING_ROLL';
    const isMoving = gamePhase === 'HUMAN_MOVING';
    const isReadyToCommit = gamePhase === 'HUMAN_READY_TO_COMMIT';
    const isOpponentOfferingDouble = doublingOfferedBy === 'O';
    const nextCubeValue = cubeValue === 1 ? 2 : cubeValue * 2;

    const resolvedMode: AutoConfirmMode =
        autoConfirmMode ?? (autoConfirmEnabled ? 'always' : 'never');
    const isAutoActive =
        autoConfirmMode !== undefined
            ? autoConfirmMode === 'always' || autoConfirmMode === 'always_except_cube'
            : autoConfirmEnabled;
    const hasAutoControl = Boolean(onToggleAutoConfirm || onCycleAutoConfirmMode || onSelectAutoConfirmMode);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement | null;
            const hasClosest = Boolean(el && typeof el.closest === 'function');
            if (hasClosest && el!.closest('input, textarea, select, [contenteditable="true"]')) return;
            const keyLower = e.key.toLowerCase();
            if (
                ((e.ctrlKey || e.metaKey) && keyLower === 'z') ||
                (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'Backspace' || keyLower === 'u'))
            ) {
                if (hasDice && canUndo && !isWaitingRoll) {
                    e.preventDefault();
                    onUndo();
                    return;
                }
            }
            if (hasClosest && el!.closest('button, a, [role="button"]')) return;
            if (isOpponentOfferingDouble && !e.ctrlKey && !e.metaKey && !e.altKey) {
                if ((keyLower === 'y' || keyLower === 't') && onTakeDouble) {
                    e.preventDefault();
                    onTakeDouble();
                    return;
                }
                if ((keyLower === 'n' || keyLower === 'p') && onPassDouble) {
                    e.preventDefault();
                    onPassDouble();
                    return;
                }
            }
            if (isWaitingRoll && !isOpponentOfferingDouble && keyLower === 'd' && canDouble && onOfferDouble) {
                e.preventDefault();
                onOfferDouble();
                return;
            }
            if (e.code === 'Space' && isWaitingRoll) {
                e.preventDefault();
                onRoll();
            } else if (
                (e.code === 'Enter' || e.code === 'Space' || e.key === 'Enter' || e.key === ' ') &&
                isReadyToCommit &&
                canConfirm &&
                !isAutoActive
            ) {
                e.preventDefault();
                onConfirm();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [
        isWaitingRoll, isReadyToCommit, canConfirm, isAutoActive, hasDice, canUndo,
        isOpponentOfferingDouble, canDouble, onRoll, onConfirm, onUndo, onOfferDouble, onTakeDouble, onPassDouble,
    ]);

    if (!isWaitingRoll && !isMoving && !isReadyToCommit && !isOpponentOfferingDouble) return null;

    const showUndo = hasDice && canUndo && !isWaitingRoll;
    const showConfirm = isReadyToCommit && canConfirm && !isAutoActive;

    return (
        <div
            data-testid="board-center-controls"
            className={`absolute ${isOpponentOfferingDouble ? 'left-1/2 flex' : 'left-[68%] sm:left-[69%] lg:left-[71%] hidden md:flex'} top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex-col items-center gap-1 pointer-events-none min-h-[44px] max-w-[46%] sm:max-w-[42%] justify-center [@media(max-height:500px)]:scale-90`}
        >
            {isOpponentOfferingDouble && onTakeDouble && onPassDouble && (
                <div
                    data-testid="center-cube-decision"
                    className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-[#e5c158]/80 bg-gradient-to-b from-[#23140b]/95 via-[#140b06]/98 to-[#0a0503]/98 px-4 py-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.88),inset_0_1px_1px_rgba(255,244,210,0.3)] backdrop-blur-md"
                >
                    <span className="font-serif text-[11px] font-black uppercase tracking-[0.14em] text-[#f3c65f] whitespace-nowrap">
                        ⚜ Videau ×{nextCubeValue}
                    </span>
                    <button
                        type="button"
                        data-testid="center-take-double-button"
                        onClick={(e) => { e.stopPropagation(); onTakeDouble(); }}
                        className="hidden md:inline-flex [@media(max-height:500px)]:inline-flex rounded-full border border-emerald-300/60 bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-800 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-50 shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)] transition hover:brightness-110 active:scale-95 whitespace-nowrap touch-manipulation"
                    >
                        ✓ Prendre (×{nextCubeValue})
                    </button>
                    <button
                        type="button"
                        data-testid="center-pass-double-button"
                        onClick={(e) => { e.stopPropagation(); onPassDouble(); }}
                        className="hidden md:inline-flex [@media(max-height:500px)]:inline-flex rounded-full border border-[#b91c1c]/70 bg-gradient-to-b from-[#4c1115] to-[#280709] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-rose-100 shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,200,200,0.2)] transition hover:brightness-115 active:scale-95 whitespace-nowrap touch-manipulation"
                    >
                        ✕ Passer
                    </button>
                </div>
            )}

            {isWaitingRoll && !isOpponentOfferingDouble && (
                <div className="pointer-events-auto flex flex-col items-center gap-1.5">
                    <div className="flex flex-nowrap items-center justify-center gap-1 sm:gap-2">
                        <button
                            type="button"
                            data-testid="center-roll-button"
                            onClick={(e) => { e.stopPropagation(); onRoll(); }}
                            className="group relative inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#d4af37] px-3 sm:px-4 py-1.5 sm:py-2 font-serif text-xs font-black uppercase tracking-wider sm:tracking-[0.14em] text-[#241306] transition-all duration-200 hover:scale-[1.03] hover:brightness-105 active:scale-95 whitespace-nowrap touch-manipulation"
                            style={{
                                background: 'linear-gradient(180deg, #fffdf9 0%, #f7edd6 42%, #e4cfa3 82%, #c7ad78 100%)',
                                boxShadow: '0 10px 26px rgba(0, 0, 0, 0.82), 0 0 0 2px rgba(42, 24, 10, 0.85), 0 0 18px rgba(212, 175, 55, 0.32), inset 0 2px 2px rgba(255, 255, 255, 0.95), inset 0 -2px 4px rgba(130, 92, 34, 0.5)',
                            }}
                        >
                            <span aria-hidden="true" className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full border border-[#9c7323]/50 bg-gradient-to-b from-[#331b0b] to-[#170b04] text-xs text-[#f3c65f] shadow-inner">
                                <span className="[filter:sepia(0.9)_saturate(2.5)_hue-rotate(5deg)]">🎲</span>
                            </span>
                            <span className="font-extrabold drop-shadow-[0_1px_0_rgba(255,255,255,0.75)]">Lancer les dés</span>
                        </button>

                        {canDouble && onOfferDouble && (
                            <button
                                type="button"
                                data-testid="center-double-button"
                                onClick={(e) => { e.stopPropagation(); onOfferDouble(); }}
                                title={`Proposer le videau (×${nextCubeValue})`}
                                className="group inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-[#e5c158]/75 px-2 sm:px-3 py-1 sm:py-2 font-serif text-[10px] sm:text-[11px] font-black uppercase tracking-[0.12em] text-[#fce8b2] transition-all duration-150 hover:scale-[1.03] hover:border-[#fff3c4] hover:text-white active:scale-95 whitespace-nowrap touch-manipulation"
                                style={{
                                    background: 'linear-gradient(180deg, #471810 0%, #2a0c07 54%, #160503 100%)',
                                    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.82), 0 0 0 1.5px rgba(20, 8, 4, 0.9), inset 0 1px 1px rgba(255, 230, 180, 0.35), inset 0 -2px 4px rgba(0, 0, 0, 0.8)',
                                }}
                            >
                                <span className="rounded-full border border-[#f3c65f]/60 bg-gradient-to-b from-[#f5cf70] to-[#b88218] px-1.5 py-0.2 font-mono text-[10px] font-black text-[#1f1104] shadow-sm">
                                    ×{nextCubeValue}
                                </span>
                                <span className="hidden sm:inline font-bold">Doubler</span>
                            </button>
                        )}
                    </div>

                    {(hasAutoControl || onCycleGameSpeed) && (
                        <div className="flex items-center justify-center gap-1.5">
                            {hasAutoControl && (
                                <AutoConfirmControl
                                    resolvedMode={resolvedMode}
                                    isAutoActive={isAutoActive}
                                    autoConfirmMode={autoConfirmMode}
                                    compact
                                    onToggleAutoConfirm={onToggleAutoConfirm}
                                    onSelectAutoConfirmMode={onSelectAutoConfirmMode}
                                    onCycleAutoConfirmMode={onCycleAutoConfirmMode}
                                />
                            )}

                            {onCycleGameSpeed && (
                                <button
                                    type="button"
                                    data-testid="cycle-game-speed-btn"
                                    data-speed={gameSpeed}
                                    title={`${SPEED_LABELS[gameSpeed].title} (cliquer pour changer)`}
                                    aria-label={`Cadence du Bot : ${SPEED_LABELS[gameSpeed].label}`}
                                    onClick={(e) => { e.stopPropagation(); void impactLight(); onCycleGameSpeed(); }}
                                    className="rounded-full border border-[#d4af37]/35 bg-[#140b06]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-100/80 shadow-md backdrop-blur-sm transition whitespace-nowrap hover:border-[#f3c65f]/60 hover:text-amber-100 active:scale-95 touch-manipulation"
                                >
                                    <span aria-hidden="true">{SPEED_LABELS[gameSpeed].icon}</span>{' '}
                                    <span className="hidden sm:inline">{SPEED_LABELS[gameSpeed].label}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {!isWaitingRoll && !isOpponentOfferingDouble && (showUndo || showConfirm || hasAutoControl) && (
                <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#d4af37]/55 bg-gradient-to-b from-[#24140b]/95 to-[#110804]/98 px-2.5 py-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,240,200,0.22)] backdrop-blur-md">
                    {showUndo && (
                        <button
                            type="button"
                            data-testid="center-undo-button"
                            title="Annuler le dernier dé joué (Ctrl+Z)"
                            onClick={(e) => { e.stopPropagation(); void impactLight(); onUndo(); }}
                            className="rounded-full border border-[#d4af37]/40 bg-[#1a0f08] min-h-[38px] px-3.5 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-100/90 shadow-inner transition hover:border-[#f3c65f] hover:text-white active:scale-95 flex items-center justify-center touch-manipulation"
                        >
                            ↶ Annuler
                        </button>
                    )}
                    {showConfirm && (
                        <button
                            type="button"
                            data-testid="center-confirm-button"
                            title="Confirmer le tour (Espace / Entrée)"
                            onClick={(e) => { e.stopPropagation(); void impactMedium(); onConfirm(); }}
                            disabled={!canConfirm}
                            className="rounded-full border border-[#fef08a]/80 bg-gradient-to-b from-[#fff3c4] via-[#e5b84b] to-[#a87412] min-h-[38px] px-4 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#1f1104] shadow-[0_4px_14px_rgba(212,175,55,0.4),inset_0_1px_1px_rgba(255,255,255,0.8)] transition hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center touch-manipulation"
                        >
                            ✓ Valider
                        </button>
                    )}
                    {hasAutoControl && (
                        <AutoConfirmControl
                            resolvedMode={resolvedMode}
                            isAutoActive={isAutoActive}
                            autoConfirmMode={autoConfirmMode}
                            compact
                            onToggleAutoConfirm={onToggleAutoConfirm}
                            onSelectAutoConfirmMode={onSelectAutoConfirmMode}
                            onCycleAutoConfirmMode={onCycleAutoConfirmMode}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export const BoardCenterControls = React.memo(BoardCenterControlsComponent);
export default BoardCenterControls;
