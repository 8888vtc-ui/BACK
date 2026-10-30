'use client';

/**
 * @file src/components/board/MobileThumbDock.tsx
 * @description Thumb-Dock Flottant Inférieur Mobile-First (« Monte-Carlo Thumb Dock »).
 * Regroupe toutes les commandes primaires sous le pouce (< 768px) avec zéro scroll :
 * - Bouton principal haptique : Lancer les dés / Terminer le tour (min 48x48px, hauteur 56px).
 * - Actions secondaires : Videau / Doubler, Annuler coup (Undo), Bouton Coach IA (badge d'état animé + Tilt).
 * - Strictement < 300 lignes, 0 `any`.
 */

import React, { useMemo, useRef, useState } from 'react';
import type { GamePhase } from '../../actions/types';
import type { MobileHandedness } from '../../hooks/useMobileTouchControls';
import { getThumbZoneGestureProtectionStyle } from '../../hooks/useMobileTouchControls';
import { impactLight, impactMedium, impactHeavy } from '../../lib/capacitor/haptics';

export type PrimaryDockActionState =
    | 'ROLL'
    | 'CONFIRM'
    | 'NO_MOVE'
    | 'RESPOND_DOUBLE'
    | 'WAITING_OPPONENT';

export interface MobileThumbDockProps {
    readonly gamePhase: GamePhase | 'REPLAY_VIEW';
    readonly isHumanTurn: boolean;
    readonly hasDice: boolean;
    readonly canUndo: boolean;
    readonly canConfirm: boolean;
    readonly isBlockedTurn?: boolean;
    readonly canDouble: boolean;
    readonly cubeValue: number;
    readonly doublingOfferedBy: 'X' | 'O' | null;
    readonly coachQuotaBadge: string;
    readonly isVip: boolean;
    readonly isAnalyzingCoach?: boolean;
    readonly isTilted?: boolean;
    readonly handedness?: MobileHandedness;
    readonly onRoll: () => void;
    readonly onConfirm: () => void;
    readonly onUndo: () => void;
    readonly onOpenCubeSheet: () => void;
    readonly onTakeDouble?: () => void;
    readonly onPassDouble?: () => void;
    readonly onOpenCoachDrawer: () => void;
}

const GESTURE_SHIELD_STYLE = getThumbZoneGestureProtectionStyle(true);

const MobileThumbDockComponent: React.FC<MobileThumbDockProps> = ({
    gamePhase,
    isHumanTurn,
    hasDice,
    canUndo,
    canConfirm,
    isBlockedTurn = false,
    canDouble,
    cubeValue,
    doublingOfferedBy,
    coachQuotaBadge,
    isVip,
    isAnalyzingCoach = false,
    isTilted = false,
    handedness,
    onRoll,
    onConfirm,
    onUndo,
    onOpenCubeSheet,
    onTakeDouble,
    onPassDouble,
    onOpenCoachDrawer,
}) => {
    const [swipedHandedness, setSwipedHandedness] = useState<MobileHandedness | null>(null);
    const touchStartXRef = useRef<number | null>(null);
    const effectiveHandedness: MobileHandedness = handedness ?? swipedHandedness ?? 'right';

    const primaryState = useMemo<PrimaryDockActionState>(() => {
        if (doublingOfferedBy === 'O') return 'RESPOND_DOUBLE';
        if (!isHumanTurn || gamePhase === 'AI_TURN_ROLLING' || gamePhase === 'AI_TURN_SHOWING_ARROWS') {
            return 'WAITING_OPPONENT';
        }
        if (gamePhase === 'HUMAN_WAITING_ROLL') return 'ROLL';
        if (isBlockedTurn && !canConfirm) return 'NO_MOVE';
        if (gamePhase === 'HUMAN_READY_TO_COMMIT' && canConfirm) return 'CONFIRM';
        return 'CONFIRM';
    }, [doublingOfferedBy, isHumanTurn, gamePhase, isBlockedTurn, canConfirm]);

    const nextCubeValue = cubeValue === 1 ? 2 : cubeValue * 2;
    const isLeftHanded = effectiveHandedness === 'left';

    const handlePrimaryPress = () => {
        if (primaryState === 'ROLL') {
            void impactMedium();
            onRoll();
            return;
        }
        if (primaryState === 'CONFIRM' && canConfirm) {
            void impactMedium();
            onConfirm();
            return;
        }
        if (primaryState === 'NO_MOVE') {
            void impactLight();
            onConfirm();
        }
    };

    return (
        <nav
            aria-label="Barre d'actions tactiles rapides"
            data-testid="monte-carlo-thumb-dock"
            data-handedness={effectiveHandedness}
            onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
                const startX = touchStartXRef.current;
                const endX = e.changedTouches[0]?.clientX ?? null;
                touchStartXRef.current = null;
                if (startX !== null && endX !== null && Math.abs(endX - startX) > 64) {
                    void impactLight();
                    setSwipedHandedness(endX < startX ? 'left' : 'right');
                }
            }}
            style={{
                ...GESTURE_SHIELD_STYLE,
                touchAction: 'manipulation',
                paddingBottom: 'max(0.45rem, env(safe-area-inset-bottom, 0px))',
                background:
                    'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(2, 6, 23, 0.99) 100%)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow:
                    '0 -12px 32px rgba(0, 0, 0, 0.85)',
            }}
            className={`md:hidden [@media(max-height:500px)]:hidden relative z-40 w-full max-w-full min-w-0 overflow-hidden shrink-0 px-2 pt-1.5 flex items-center justify-between gap-1.5 select-none touch-manipulation ${
                isLeftHanded ? 'flex-row-reverse' : 'flex-row'
            }`}
        >
            {/* SATELLITES ERGONOMIQUES : Undo | Videau | Coach IA */}
            <div className="flex items-center gap-1 shrink-0">
                <button
                    type="button"
                    data-testid="thumb-dock-undo-btn"
                    disabled={!canUndo}
                    onClick={() => {
                        void impactLight();
                        onUndo();
                    }}
                    aria-label="Annuler le dernier déplacement"
                    className="relative flex flex-col items-center justify-center w-11 sm:w-12 h-11 sm:h-12 min-w-[44px] min-h-[44px] rounded-xl border border-white/10 bg-slate-900 text-slate-200 shadow-md transition-transform duration-100 active:scale-90 disabled:opacity-35 disabled:pointer-events-none touch-manipulation"
                >
                    <span aria-hidden="true" className="text-sm leading-none font-bold text-amber-300">
                        ↶
                    </span>
                    <span className="mt-0.5 text-[10px] font-extrabold uppercase tracking-tighter text-slate-300">
                        Undo
                    </span>
                </button>

                <button
                    type="button"
                    data-testid="thumb-dock-cube-btn"
                    disabled={!canDouble && doublingOfferedBy !== 'O'}
                    onClick={() => {
                        void impactHeavy();
                        onOpenCubeSheet();
                    }}
                    aria-label={`Videau x${nextCubeValue}`}
                    className="relative flex flex-col items-center justify-center w-11 sm:w-12 h-11 sm:h-12 min-w-[44px] min-h-[44px] rounded-xl border border-white/10 bg-slate-900 text-slate-200 shadow-md transition-transform duration-100 active:scale-90 disabled:opacity-35 touch-manipulation"
                >
                    <span className="rounded px-1 py-0.2 font-mono text-[10px] font-black leading-tight bg-amber-400 text-slate-950 tabular-nums">
                        ×{nextCubeValue}
                    </span>
                    <span className="mt-0.5 text-[10px] font-extrabold uppercase tracking-tighter text-slate-300">
                        Videau
                    </span>
                </button>

                <button
                    type="button"
                    data-testid="thumb-dock-coach-btn"
                    onClick={() => {
                        void impactLight();
                        onOpenCoachDrawer();
                    }}
                    aria-label={`Ouvrir le Coach IA (${coachQuotaBadge})`}
                    className={`relative flex flex-col items-center justify-center w-12 sm:w-14 h-11 sm:h-12 min-w-[48px] min-h-[44px] rounded-xl border bg-slate-900 text-slate-200 shadow-md transition-transform duration-100 active:scale-90 touch-manipulation ${
                        isTilted
                            ? 'border-rose-400/80 ring-1 ring-rose-500/60'
                            : 'border-white/10'
                    }`}
                >
                    <div className="flex items-center gap-0.5">
                        <span aria-hidden="true" className="text-[11px] leading-none">
                            {isTilted ? '🔥' : '🎓'}
                        </span>
                        <span
                            data-testid="thumb-dock-coach-badge"
                            className={`rounded px-1 py-0.2 font-mono text-[10px] font-black leading-none tabular-nums ${
                                isAnalyzingCoach
                                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/60 animate-pulse'
                                    : isVip
                                      ? 'bg-amber-400/20 text-amber-300 border border-white/10'
                                      : 'bg-slate-950 text-amber-300 border border-white/10'
                            }`}
                        >
                            {isAnalyzingCoach ? '…' : coachQuotaBadge}
                        </span>
                    </div>
                    <span className="mt-0.5 text-[10px] font-extrabold uppercase tracking-tighter text-slate-300">
                        Coach
                    </span>
                </button>
            </div>

            {/* BOUTON PRINCIPAL DYNAMIQUE (min 48x48px, hauteur 48-52px, zéro débordement) */}
            <div className="flex-1 min-w-0 flex items-center justify-end">
                {primaryState === 'RESPOND_DOUBLE' && onTakeDouble && onPassDouble ? (
                    <div className="flex w-full min-w-0 items-center gap-1">
                        <button
                            type="button"
                            data-testid="thumb-dock-take-btn"
                            onClick={() => {
                                void impactHeavy();
                                onTakeDouble();
                            }}
                            className="flex-1 min-w-0 h-11 sm:h-12 rounded-xl border border-emerald-400/60 bg-emerald-600 px-2 font-sans text-[11px] sm:text-xs font-black uppercase tracking-wider text-white shadow-lg active:scale-95 touch-manipulation tabular-nums truncate"
                        >
                            ✓ Prendre ×{nextCubeValue}
                        </button>
                        <button
                            type="button"
                            data-testid="thumb-dock-pass-btn"
                            onClick={() => {
                                void impactLight();
                                onPassDouble();
                            }}
                            className="h-11 sm:h-12 shrink-0 rounded-xl border border-rose-400/60 bg-rose-950 px-2.5 font-sans text-[11px] sm:text-xs font-black uppercase tracking-wider text-rose-100 shadow-lg active:scale-95 touch-manipulation"
                        >
                            ✕ Passer
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        data-testid="thumb-dock-primary-btn"
                        data-primary-state={primaryState}
                        disabled={
                            primaryState === 'WAITING_OPPONENT' ||
                            (primaryState === 'CONFIRM' && !canConfirm)
                        }
                        onClick={handlePrimaryPress}
                        className={`w-full min-w-0 h-11 sm:h-12 rounded-xl px-2.5 sm:px-4 flex items-center justify-center gap-1.5 font-sans text-xs sm:text-sm font-black uppercase tracking-wide transition-all duration-150 active:scale-95 touch-manipulation overflow-hidden ${
                            primaryState === 'ROLL'
                                ? 'border border-amber-300 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-[0_6px_20px_rgba(245,158,11,0.35)]'
                                : primaryState === 'CONFIRM' && canConfirm
                                  ? 'border border-emerald-300/85 bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-950 animate-pulse shadow-[0_6px_20px_rgba(16,185,129,0.4)]'
                                  : primaryState === 'NO_MOVE'
                                    ? 'border border-slate-500/60 bg-slate-800/90 text-slate-200'
                                    : 'border border-white/10 bg-slate-900 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {primaryState === 'ROLL' && (
                            <>
                                <span aria-hidden="true" className="text-sm shrink-0 animate-bounce">
                                    🎲
                                </span>
                                <span className="truncate">Lancer</span>
                            </>
                        )}
                        {primaryState === 'CONFIRM' && (
                            <>
                                <span aria-hidden="true" className="text-sm shrink-0">
                                    ✓
                                </span>
                                <span className="truncate">{canConfirm ? 'Valider' : 'Jouez vos dés'}</span>
                            </>
                        )}
                        {primaryState === 'NO_MOVE' && <span className="truncate">Passer</span>}
                        {primaryState === 'WAITING_OPPONENT' && <span className="truncate">Tour Adverse…</span>}
                    </button>
                )}
            </div>
        </nav>
    );
};

export const MobileThumbDock = React.memo(MobileThumbDockComponent);
export default MobileThumbDock;
