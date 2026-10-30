'use client';

/**
 * Bandeau Coach IA & Bot Persona Contextuel Non-Bloquant en Mode Portrait Mobile (`< md`).
 *
 * Implémente la Spécification Mobile Compétitive §4 (Niveau 2 — Contextuel Non-Bloquant, 64–72 px) :
 *   - Verdict d'équité du dernier coup (`Optimal`, `Imprécision`, `Blunder -0.XXX Eq`) ou réaction vivante du Bot.
 *   - Bouton 1-Tap « Toggle Coup Joué ↔ Meilleur Coup » affichant directement les flèches SVG sur le plateau
 *     sans pop-up ni masquage du tablier.
 *   - Bouton « ↩ Reprendre » en cas de Blunder et ouverture du Bottom Sheet (`CoachMobileDrawer`) au tap.
 *
 * Conforme à SCALABILITY.md (LOI 5 : Dumb UI pure, React.memo, < 160 lignes, 0 `any`).
 */

import React from 'react';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import type { CoachSidebarProps } from './CoachSidebar';
import { getBotPersona } from '../../features/personas/botPersonas';

export interface MobilePortraitCoachBannerProps {
    readonly coach: CoachSidebarProps['coach'];
    readonly isAnalyzing: boolean;
    readonly difficulty?: AIDifficulty;
    readonly isShowingBestMoveArrows: boolean;
    readonly onToggleBestMoveArrows: () => void;
    readonly onReplayMove?: () => void;
    readonly onOpenDrawer?: () => void;
}

const MobilePortraitCoachBannerComponent: React.FC<MobilePortraitCoachBannerProps> = ({
    coach,
    isAnalyzing,
    difficulty = 'expert',
    isShowingBestMoveArrows,
    onToggleBestMoveArrows,
    onReplayMove,
    onOpenDrawer,
}) => {
    const persona = getBotPersona(difficulty);
    const equityLoss = coach?.equityLoss !== undefined ? Math.abs(coach.equityLoss) : 0;
    const isBlunder = coach?.verdict === 'blunder' || equityLoss >= 0.08;
    const isInaccuracy = !isBlunder && (coach?.verdict === 'inaccuracy' || equityLoss >= 0.02);
    const hasComparison = Boolean(coach && coach.optimalMove && coach.playedMove && coach.optimalMove !== coach.playedMove);

    const badgeConfig = isBlunder
        ? {
              icon: '🔴',
              label: `Blunder (-${equityLoss.toFixed(3)})`,
              pillClass: 'border-rose-400/70 bg-rose-950/80 text-rose-200',
          }
        : isInaccuracy
          ? {
                icon: '🟡',
                label: `Imprécision (-${equityLoss.toFixed(3)})`,
                pillClass: 'border-amber-400/70 bg-amber-950/80 text-amber-200',
            }
          : coach
            ? {
                  icon: '🟢',
                  label: 'Coup Optimal',
                  pillClass: 'border-emerald-400/70 bg-emerald-950/80 text-emerald-200',
              }
            : null;

    const concreteMoveReason = isBlunder || isInaccuracy
        ? coach?.whyFailed || coach?.tacticalSummary || coach?.summary || persona.dialogues.playerBlunder.fun
        : coach?.whyOptimal || coach?.tacticalSummary || persona.dialogues.playerOptimal.fun;

    const quoteText = isAnalyzing
        ? 'Analyse neuronale Open Sage en cours…'
        : coach
          ? `${coach.playedMove ?? ''}${hasComparison ? ` → ${coach.optimalMove}` : ''} · ${concreteMoveReason}`
          : persona.dialogues.opening.fun;

    return (
        <section
            aria-label="Bandeau Coach IA et Toggle Meilleur Coup"
            data-testid="mobile-portrait-coach-banner"
            className="md:hidden [@media(max-height:500px)]:hidden w-full shrink-0 min-h-[58px] max-h-[72px] px-2 py-1 flex items-center justify-between gap-2 rounded-xl border border-[#d4af37]/35 bg-gradient-to-r from-[#140c06]/95 via-[#0e131f]/95 to-[#140c06]/95 shadow-[0_4px_16px_rgba(0,0,0,0.65)] select-none"
        >
            {/* Zone gauche cliquable -> Ouvre le Bottom Sheet (Top 5 coups + explication + chat) */}
            <button
                type="button"
                data-testid="mobile-banner-open-drawer-btn"
                onClick={onOpenDrawer}
                className="flex-1 min-w-0 flex items-center gap-2 text-left focus:outline-none active: opacity-90 touch-manipulation"
            >
                <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#f3c65f]/55 bg-[#26160a] text-base shadow-inner"
                >
                    {persona.avatar}
                </span>

                <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-serif text-[11px] font-bold text-[#f3c65f] truncate">
                            {persona.shortName}
                        </span>
                        {badgeConfig && (
                            <span
                                data-testid="mobile-banner-verdict-pill"
                                className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.2 font-mono text-[10px] font-extrabold leading-tight shrink-0 ${badgeConfig.pillClass}`}
                            >
                                <span aria-hidden="true">{badgeConfig.icon}</span>
                                <span>{badgeConfig.label}</span>
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-amber-50/90 truncate leading-snug">
                        {quoteText}
                    </p>
                </div>
            </button>

            {/* Zone droite : Toggle Mon Coup <-> Meilleur Coup (Flèches SVG sur plateau) + Reprendre */}
            <div className="flex items-center gap-1 shrink-0">
                {hasComparison && (
                    <button
                        type="button"
                        data-testid="mobile-banner-move-toggle-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleBestMoveArrows();
                        }}
                        className={`min-h-[36px] px-2.5 py-1 rounded-xl border text-[10px] font-extrabold uppercase tracking-wider transition active:scale-95 touch-manipulation ${
                            isShowingBestMoveArrows
                                ? 'border-cyan-300 bg-cyan-500/25 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
                                : 'border-[#d4af37]/50 bg-[#25170b] text-[#fce8b2]'
                        }`}
                    >
                        {isShowingBestMoveArrows ? '↩ Mon Coup' : '👁 Meilleur'}
                    </button>
                )}

                {isBlunder && onReplayMove && (
                    <button
                        type="button"
                        data-testid="mobile-banner-replay-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onReplayMove();
                        }}
                        className="min-h-[36px] px-2 py-1 rounded-xl border border-amber-400/70 bg-amber-500/20 text-[10px] font-extrabold text-amber-200 transition active:scale-95 touch-manipulation"
                        title="Reprendre et corriger ce coup"
                    >
                        ↩ Rejouer
                    </button>
                )}
            </div>
        </section>
    );
};

export const MobilePortraitCoachBanner = React.memo(MobilePortraitCoachBannerComponent);
export default MobilePortraitCoachBanner;
