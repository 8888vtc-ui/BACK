'use client';

/**
 * Feuille Modale Basse du Videau (« Cube Bottom Sheet ») pour Mobile.
 * Permet de proposer un double (×2, ×4, ×8...) ou de répondre à un double adverse
 * à une seule main dans la Thumb Zone.
 * Strictement 0 `any`, < 160 lignes (LOI 5).
 */

import React from 'react';
import { impactHeavy, impactLight } from '../../lib/capacitor/haptics';

export interface CubeBottomSheetProps {
    readonly isOpen: boolean;
    readonly cubeValue: number;
    readonly canDouble: boolean;
    readonly doublingOfferedBy: 'X' | 'O' | null;
    readonly scoreX: number;
    readonly scoreO: number;
    readonly matchLength: number;
    readonly crawford?: boolean;
    readonly onClose: () => void;
    readonly onOfferDouble: () => void;
    readonly onTakeDouble: () => void;
    readonly onPassDouble: () => void;
}

const CubeBottomSheetComponent: React.FC<CubeBottomSheetProps> = ({
    isOpen,
    cubeValue,
    canDouble,
    doublingOfferedBy,
    scoreX,
    scoreO,
    matchLength,
    crawford = false,
    onClose,
    onOfferDouble,
    onTakeDouble,
    onPassDouble,
}) => {
    if (!isOpen) return null;

    const nextCubeValue = cubeValue === 1 ? 2 : cubeValue * 2;
    const isIncomingOffer = doublingOfferedBy === 'O';

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Décision du Videau"
            data-testid="cube-bottom-sheet"
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm md:hidden"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
                className="w-full rounded-t-3xl border-t border-white/15 bg-slate-950 px-4 pt-3 shadow-[0_-16px_48px_rgba(0,0,0,0.95)]"
            >
                <div className="mx-auto mb-2.5 h-1.5 w-12 rounded-full bg-slate-700" />

                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 font-mono text-base font-black text-slate-950 shadow-md">
                            ×{nextCubeValue}
                        </span>
                        <div>
                            <h2 className="font-sans text-sm font-black uppercase tracking-wider text-white">
                                {isIncomingOffer
                                    ? `L'adversaire double à ×${nextCubeValue}`
                                    : `Proposer le Videau (×${cubeValue} → ×${nextCubeValue})`}
                            </h2>
                            <p className="font-mono text-[11px] text-slate-400">
                                Score : Vous {scoreX} – {scoreO} IA{' '}
                                {matchLength > 0 ? `(Match en ${matchLength} pts)` : '(Money Game)'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer la feuille du videau"
                        className="h-9 w-9 rounded-xl border border-white/10 bg-slate-900 text-sm font-bold text-slate-300 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {crawford ? (
                    <p className="mt-3 rounded-xl border border-amber-400/50 bg-amber-950/50 px-3 py-2 text-xs text-amber-200">
                        Règle de Crawford active : le videau est verrouillé pour cette manche.
                    </p>
                ) : (
                    <p
                        data-testid="cube-sheet-playful-tip"
                        className="mt-2.5 rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-[11px] leading-snug text-slate-200"
                    >
                        {isIncomingOffer
                            ? '💡 Astuce des pros : si vous avez au moins 1 chance sur 4 (25 %) de gagner, acceptez le défi !'
                            : '💡 Astuce des pros : doublez dès que vous êtes net favori, sans attendre que la victoire soit certaine.'}
                    </p>
                )}

                <div className="mt-3.5 flex items-center gap-3">
                    {isIncomingOffer ? (
                        <>
                            <button
                                type="button"
                                data-testid="cube-sheet-take-btn"
                                onClick={() => {
                                    void impactHeavy();
                                    onTakeDouble();
                                    onClose();
                                }}
                                className="flex-1 h-14 min-h-[56px] rounded-2xl border border-emerald-400/60 bg-emerald-600 font-sans text-xs font-black uppercase tracking-wider text-white shadow-lg active:scale-95"
                            >
                                ✓ Prendre (×{nextCubeValue})
                            </button>
                            <button
                                type="button"
                                data-testid="cube-sheet-pass-btn"
                                onClick={() => {
                                    void impactLight();
                                    onPassDouble();
                                    onClose();
                                }}
                                className="flex-1 h-14 min-h-[56px] rounded-2xl border border-rose-500/60 bg-rose-950 font-sans text-xs font-black uppercase tracking-wider text-rose-100 shadow-lg active:scale-95"
                            >
                                ✕ Passer (Abandon 1×)
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                data-testid="cube-sheet-cancel-btn"
                                onClick={() => {
                                    void impactLight();
                                    onClose();
                                }}
                                className="h-14 min-h-[56px] px-5 rounded-2xl border border-white/10 bg-slate-900 font-sans text-xs font-bold uppercase tracking-wider text-slate-300 active:scale-95"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                data-testid="cube-sheet-confirm-double-btn"
                                disabled={!canDouble || crawford}
                                onClick={() => {
                                    void impactHeavy();
                                    onOfferDouble();
                                    onClose();
                                }}
                                className="flex-1 h-14 min-h-[56px] rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-400 to-amber-500 font-sans text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg active:scale-95 disabled:opacity-40"
                            >
                                Doubler à ×{nextCubeValue}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export const CubeBottomSheet = React.memo(CubeBottomSheetComponent);
export default CubeBottomSheet;
