'use client';

/**
 * @file src/components/auth/PassportCardPreview.tsx
 * @description Aperçu en temps réel de la Carte de Membre du Grand Cercle Backgammon (< 140 lignes, 0 `any`).
 */

import React from 'react';
import { Award, ShieldCheck, Sparkles } from 'lucide-react';
import type { PlayerExperienceTier } from '../../lib/supabase/auth';
import { BotPortraitMedallion } from '../common/MonteCarloIcons';
import { CountryFlagSvg } from '../common/CountryFlagSvg';

export interface PassportCardPreviewProps {
    readonly displayName: string;
    readonly countryName: string;
    readonly countryCode: string;
    readonly avatarUrl: string;
    readonly experienceLevel: PlayerExperienceTier;
    readonly isEn?: boolean;
}

const LEVEL_BADGE_MAP: Readonly<Record<PlayerExperienceTier, { readonly fr: string; readonly en: string }>> = {
    beginner: {
        fr: 'Niveau : Débutant (Accompagnement Pas-à-Pas)',
        en: 'Level: Beginner (Step-by-Step Guided Play)',
    },
    intermediate: {
        fr: 'Division Club • Objectif Videau & Tactique',
        en: 'Club Division • Doubling Cube & Tactics',
    },
    expert: {
        fr: 'Division Expert / Pro • Analyse 3-Ply & Précision Tournoi',
        en: 'Expert / Pro Division • 3-Ply Analysis & Tournament Accuracy',
    },
};

export const PassportCardPreview: React.FC<PassportCardPreviewProps> = React.memo(({
    displayName,
    countryName,
    countryCode,
    avatarUrl,
    experienceLevel,
    isEn = false,
}) => {
    const cleanName = displayName.trim() || 'Alexandre D.';
    const levelLabel = isEn ? LEVEL_BADGE_MAP[experienceLevel].en : LEVEL_BADGE_MAP[experienceLevel].fr;
    const serialSuffix = countryCode.toUpperCase().slice(0, 2) || 'FR';

    return (
        <aside
            data-testid="passport-card-live-preview"
            aria-label={isEn ? 'Live Member Card Preview' : 'Aperçu en direct de votre Carte de Membre'}
            className="hidden md:flex flex-col justify-between rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-b from-[#13100B] via-[#0B0E14] to-[#080A0F] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_20px_50px_rgba(0,0,0,0.85)] relative overflow-hidden select-none"
        >
            {/* Filigrane lumineux subtil */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#D4AF37]/10 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[#10B981]/10 blur-3xl"
            />

            {/* En-tête Grand Cercle */}
            <div className="relative z-10 flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
                <div className="flex items-center gap-2">
                    <Sparkles size={15} strokeWidth={1.5} className="text-[#D4AF37]" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#F3E5AB]">
                        GRAND CERCLE BACKGAMMON
                    </span>
                </div>
                <span className="rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-2.5 py-0.5 font-mono text-[9px] font-extrabold uppercase tracking-wider text-[#F3E5AB]">
                    {isEn ? 'MEMBER CARD' : 'CARTE MEMBRE'}
                </span>
            </div>

            {/* Cœur de la Carte : Médaillon Octogonal Or + Identité + Drapeau SVG */}
            <div className="relative z-10 my-auto flex flex-col items-center text-center py-4">
                <BotPortraitMedallion
                    character="player"
                    size="xl"
                    isActive
                    customPhotoUrl={avatarUrl}
                />

                <h3
                    data-testid="passport-preview-name"
                    className="mt-3.5 font-display text-xl italic font-black tracking-wide text-[#FDF8EB] truncate max-w-[230px]"
                >
                    {cleanName}
                </h3>

                <div
                    data-testid="passport-preview-country"
                    className="mt-1.5 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-3 py-1 text-xs font-bold text-[#F3E5AB] shadow-sm"
                >
                    <CountryFlagSvg countryName={countryName} className="h-3.5 w-5" />
                    <span>{countryName}</span>
                </div>

                <span
                    data-testid="passport-preview-division"
                    className="mt-2.5 text-[11px] font-bold text-amber-100/90"
                >
                    {levelLabel}
                </span>

                {/* Métriques initiales */}
                <div className="mt-4 w-full grid grid-cols-2 gap-2 rounded-xl border border-white/[0.08] bg-black/45 p-2.5">
                    <div className="flex flex-col items-center border-r border-white/[0.08] pr-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                            {isEn ? 'Initial Rating' : 'Classement Initial'}
                        </span>
                        <span className="mt-0.5 font-mono text-sm font-black tabular-nums text-[#F3E5AB]">
                            1500 ELO
                        </span>
                    </div>
                    <div className="flex flex-col items-center pl-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                            {experienceLevel === 'beginner'
                                ? (isEn ? 'Progression' : 'Progression')
                                : (isEn ? 'ER / PR Index' : 'Indice ER / PR')}
                        </span>
                        <span className="mt-0.5 font-mono text-xs font-bold text-[#34D399]">
                            {experienceLevel === 'beginner'
                                ? (isEn ? 'Step-by-Step' : 'Pas-à-Pas')
                                : (isEn ? 'Calibrating' : 'En calibrage')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Pied de carte : Matricule Grand Cercle & Statut Moteur */}
            <div className="relative z-10 flex items-center justify-between border-t border-[#D4AF37]/20 pt-3 text-[10px] text-zinc-400">
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#D4AF37]/90">
                    <Award size={12} strokeWidth={1.5} className="text-[#D4AF37]" />
                    GC-2026-{serialSuffix}
                </span>
                <span className="inline-flex items-center gap-1 text-zinc-300">
                    <ShieldCheck size={12} strokeWidth={1.5} className="text-[#10B981]" />
                    {experienceLevel === 'beginner'
                        ? (isEn ? 'Guided Play' : 'Mode Guidé')
                        : (isEn ? '3-Ply AI Engine' : 'Moteur IA 3-Ply')}
                </span>
            </div>
        </aside>
    );
});
PassportCardPreview.displayName = 'PassportCardPreview';
export default PassportCardPreview;
