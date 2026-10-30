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
            className={`absolute ${isOpponentOfferingDouble ? 'left-1/2 flex' : 'left-[68%] sm:left-[69%] lg:left-[71%] hidden md:flex [@media(max-height:500px)]:flex'} top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex-col items-center gap-1 pointer-events-none min-h-[44px] max-w-[46%] sm:max-w-[42%] justify-center [@media(max-height:500px)]:scale-90`}
        >
            {isOpponentOfferingDouble && onTakeDouble && onPassDouble && (
                <div
                    data-testid="center-cube-decision"
                    className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/15 bg-slate-950/95 px-4 py-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.85)] backdrop-blur-md"
                >
                    <span className="font-sans text-[11px] font-black uppercase tracking-wider text-amber-300 whitespace-nowrap">
                        Videau ×{nextCubeValue}
                    </span>
                    <button
                        type="button"
                        data-testid="center-take-double-button"
                        onClick={(e) => { e.stopPropagation(); onTakeDouble(); }}
                        className="hidden md:inline-flex [@media(max-height:500px)]:inline-flex rounded-full border border-emerald-400/60 bg-emerald-600 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-md transition hover:bg-emerald-500 active:scale-95 whitespace-nowrap touch-manipulation"
                    >
                        ✓ Prendre (×{nextCubeValue})
                    </button>
                    <button
                        type="button"
                        data-testid="center-pass-double-button"
                        onClick={(e) => { e.stopPropagation(); onPassDouble(); }}
                        className="hidden md:inline-flex [@media(max-height:500px)]:inline-flex rounded-full border border-rose-500/60 bg-rose-950 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-rose-100 shadow-md transition hover:bg-rose-900 active:scale-95 whitespace-nowrap touch-manipulation"
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
                            className="group relative inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-amber-300 bg-gradient-to-r from-amber-400 to-amber-500 px-3 sm:px-4 py-1.5 sm:py-2 font-sans text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_8px_24px_rgba(245,158,11,0.35)] transition-all duration-200 hover:scale-[1.03] hover:brightness-105 active:scale-95 whitespace-nowrap touch-manipulation"
                        >
                            <span aria-hidden="true" className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-slate-950 text-xs text-amber-300 shadow-inner">
                                🎲
                            </span>
                            <span className="font-extrabold">Lancer les dés</span>
                        </button>

                        {canDouble && onOfferDouble && (
                            <button
                                type="button"
                                data-testid="center-double-button"
                                onClick={(e) => { e.stopPropagation(); onOfferDouble(); }}
                                title={`Proposer le videau (×${nextCubeValue})`}
                                className="group inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-white/15 bg-slate-900 px-2 sm:px-3 py-1 sm:py-2 font-sans text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-100 shadow-lg transition-all duration-150 hover:scale-[1.03] hover:border-amber-400/50 hover:text-white active:scale-95 whitespace-nowrap touch-manipulation"
                            >
                                <span className="rounded-full bg-amber-400 px-1.5 py-0.2 font-mono text-[10px] font-black text-slate-950 shadow-sm">
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
                                    className="rounded-full border border-white/10 bg-slate-950/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200 shadow-md backdrop-blur-sm transition whitespace-nowrap hover:border-amber-400/50 hover:text-white active:scale-95 touch-manipulation"
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
                <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/95 px-2.5 py-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.85)] backdrop-blur-md">
                    {showUndo && (
                        <button
                            type="button"
                            data-testid="center-undo-button"
                            title="Annuler le dernier dé joué (Ctrl+Z)"
                            onClick={(e) => { e.stopPropagation(); void impactLight(); onUndo(); }}
                            className="rounded-full border border-white/10 bg-slate-900 min-h-[38px] px-3.5 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-200 shadow-inner transition hover:border-amber-400/50 hover:text-white active:scale-95 flex items-center justify-center touch-manipulation"
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
                            className="rounded-full border border-amber-300 bg-gradient-to-r from-amber-400 to-amber-500 min-h-[38px] px-4 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_4px_14px_rgba(245,158,11,0.35)] transition hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center touch-manipulation"
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
