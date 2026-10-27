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
        if (gamePhase === 'HUMAN_WAITING_ROLL' && !hasDice) return 'ROLL';
        if (isBlockedTurn) return 'NO_MOVE';
        if (gamePhase === 'HUMAN_READY_TO_COMMIT' && canConfirm) return 'CONFIRM';
        return 'CONFIRM';
    }, [doublingOfferedBy, isHumanTurn, gamePhase, hasDice, isBlockedTurn, canConfirm]);

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
                    'linear-gradient(180deg, rgba(28, 16, 9, 0.98) 0%, rgba(18, 11, 6, 0.99) 55%, rgba(7, 10, 16, 1) 100%)',
                borderTop: '1.5px solid rgba(212, 175, 55, 0.55)',
                boxShadow:
                    '0 -12px 32px rgba(0, 0, 0, 0.88), inset 0 1px 0 rgba(255, 243, 196, 0.25)',
            }}
            className={`md:hidden [@media(max-height:500px)]:hidden relative z-40 w-full shrink-0 px-2.5 pt-1.5 flex items-center justify-between gap-2 select-none touch-manipulation ${
                isLeftHanded ? 'flex-row-reverse' : 'flex-row'
            }`}
        >
            {/* SATELLITES ERGONOMIQUES : Undo | Videau | Coach IA */}
            <div className="flex items-center gap-1.5 shrink-0">
                <button
                    type="button"
                    data-testid="thumb-dock-undo-btn"
                    disabled={!canUndo}
                    onClick={() => {
                        void impactLight();
                        onUndo();
                    }}
                    aria-label="Annuler le dernier déplacement"
                    className="relative flex flex-col items-center justify-center w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl border border-[#d4af37]/45 bg-gradient-to-b from-[#28160b] to-[#120904] text-[#fce8b2] shadow-[inset_0_1px_0_rgba(255,245,205,0.2),0_4px_10px_rgba(0,0,0,0.65)] transition-transform duration-100 active:scale-90 disabled:opacity-35 disabled:pointer-events-none touch-manipulation"
                >
                    <span aria-hidden="true" className="text-base leading-none font-bold text-[#f3c65f]">
                        ↶
                    </span>
                    <span className="mt-0.5 text-[11px] font-extrabold uppercase tracking-tighter text-amber-100/90">
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
                    className="relative flex flex-col items-center justify-center w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl border border-white/10 bg-gradient-to-b from-[#3d150e] to-[#1a0704] text-[#fce8b2] shadow-[inset_0_1px_0_rgba(255,230,180,0.25),0_4px_10px_rgba(0,0,0,0.65)] transition-transform duration-100 active:scale-90 disabled:opacity-35 touch-manipulation"
                >
                    <span className="rounded px-1 py-0.2 font-mono text-[11px] font-black leading-tight bg-gradient-to-b from-[#f3c65f] to-[#b88218] text-[#1a0e04] tabular-nums">
                        ×{nextCubeValue}
                    </span>
                    <span className="mt-0.5 text-[11px] font-extrabold uppercase tracking-tighter text-amber-100/90">
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
                    className={`relative flex flex-col items-center justify-center w-14 h-12 min-w-[54px] min-h-[48px] rounded-2xl border bg-gradient-to-b from-[#2f200d] to-[#150d05] text-[#fce8b2] shadow-[inset_0_1px_0_rgba(255,245,205,0.24),0_4px_10px_rgba(0,0,0,0.65)] transition-transform duration-100 active:scale-90 touch-manipulation ${
                        isTilted
                            ? 'border-rose-400/80 ring-1 ring-rose-500/60'
                            : 'border-white/10'
                    }`}
                >
                    <div className="flex items-center gap-0.5">
                        <span aria-hidden="true" className="text-xs leading-none">
                            {isTilted ? '🔥' : '🎓'}
                        </span>
                        <span
                            data-testid="thumb-dock-coach-badge"
                            className={`rounded px-1 py-0.2 font-mono text-[11px] font-black leading-none tabular-nums ${
                                isAnalyzingCoach
                                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/60 animate-pulse'
                                    : isVip
                                      ? 'bg-amber-400/25 text-[#f3c65f] border border-white/10'
                                      : 'bg-black/70 text-amber-200 border border-white/10'
                            }`}
                        >
                            {isAnalyzingCoach ? '…' : coachQuotaBadge}
                        </span>
                    </div>
                    <span className="mt-1 text-[11px] font-extrabold uppercase tracking-tighter text-amber-100/90">
                        Coach
                    </span>
                </button>
            </div>

            {/* BOUTON PRINCIPAL DYNAMIQUE (min 48x48px, hauteur 56px) */}
            <div className="flex-1 min-w-0 flex items-center justify-end">
                {primaryState === 'RESPOND_DOUBLE' && onTakeDouble && onPassDouble ? (
                    <div className="flex w-full items-center gap-1.5">
                        <button
                            type="button"
                            data-testid="thumb-dock-take-btn"
                            onClick={() => {
                                void impactHeavy();
                                onTakeDouble();
                            }}
                            className="flex-1 h-14 min-w-[48px] min-h-[52px] rounded-2xl border border-emerald-300/75 bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-800 px-2 font-serif text-xs font-black uppercase tracking-wider text-white shadow-lg active:scale-95 touch-manipulation tabular-nums"
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
                            className="h-14 min-w-[48px] min-h-[52px] rounded-2xl border border-rose-400/70 bg-gradient-to-b from-[#521217] to-[#280709] px-3 font-serif text-xs font-black uppercase tracking-wider text-rose-100 shadow-lg active:scale-95 touch-manipulation"
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
                        className={`w-full h-14 min-w-[48px] min-h-[56px] rounded-2xl px-4 flex items-center justify-center gap-2 font-serif text-xs sm:text-sm font-black uppercase tracking-[0.12em] transition-all duration-150 active:scale-95 touch-manipulation ${
                            primaryState === 'ROLL'
                                ? 'border-2 border-[#f3c65f] bg-gradient-to-b from-[#f7d774] via-[#d4af37] to-[#9a7418] text-[#1a0f05] shadow-[0_6px_22px_rgba(212,175,55,0.45),inset_0_2px_1px_rgba(255,255,255,0.65)]'
                                : primaryState === 'CONFIRM' && canConfirm
                                  ? 'border-2 border-emerald-300/85 bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-800 text-emerald-950 animate-pulse shadow-[0_6px_22px_rgba(16,185,129,0.5),inset_0_2px_1px_rgba(255,255,255,0.55)]'
                                  : primaryState === 'NO_MOVE'
                                    ? 'border border-slate-500/60 bg-slate-800/90 text-slate-200'
                                    : 'border border-[#d4af37]/25 bg-[#19110a] text-amber-200/40 cursor-not-allowed'
                        }`}
                    >
                        {primaryState === 'ROLL' && (
                            <>
                                <span aria-hidden="true" className="text-base animate-bounce">
                                    🎲
                                </span>
                                <span>Lancer</span>
                            </>
                        )}
                        {primaryState === 'CONFIRM' && (
                            <>
                                <span aria-hidden="true" className="text-base">
                                    ✓
                                </span>
                                <span>{canConfirm ? 'Valider' : 'Jouez vos dés'}</span>
                            </>
                        )}
                        {primaryState === 'NO_MOVE' && <span>Passer</span>}
                        {primaryState === 'WAITING_OPPONENT' && <span>Tour Adverse…</span>}
                    </button>
                )}
            </div>
        </nav>
    );
};

export const MobileThumbDock = React.memo(MobileThumbDockComponent);
export default MobileThumbDock;
