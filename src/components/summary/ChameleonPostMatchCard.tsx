'use client';

/**
 * Carte Post-Match « Caméléon » à 3 Strates de Divulgation Progressive (Algorithme d'Elon Musk §3.2 & §5).
 *
 * Rôle :
 *   Adapte automatiquement la densité analytique post-match au profil du joueur (avec bascule 1-clic) :
 *     - Couche 0 (Débutant — 0 % de jargon) : 1 décision clé expliquée en langage naturel selon les
 *       4 fondamentaux positionnels (Course, Structure, Flexibilité, Sécurité).
 *     - Couche 1 (Joueur de Club) : Échelle PR globale (Maître < 5, Expert 5–10, Fort 10–15, En progression > 15)
 *       et Jauge Visuelle de Videau à 3 repères (Seuil d'Acceptation 25 %, Fenêtre 75 %, Recube Vig, Loi de Woolsey).
 *     - Couche 2 (Grand-Maître / Pro) : Split PR-Positional / PR-Cube, tri primaire par perte de MWC (%)
 *       via la table Kazaross-XG2 (éliminant la distorsion EMG) et formule exacte Take Point = Risque / (Risque + Gain).
 *
 * Conforme à SCALABILITY.md (LOI 5 : React.memo, < 240 lignes, 0 `any`, aucun micro-texte < 10px).
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { CompleteGameAnalysis } from '../../features/rating/types';
import {
    CHAMELEON_CONFIGS,
    buildFourFactorsNaturalAdvice,
    buildProgressiveMasteryGoal,
    calculateExactTakePoint,
    evaluateCubeVisualGauge,
    formatNAwayScore,
    getClubPrScaleLabel,
    readStoredChameleonLayer,
    resolveAutoChameleonLayer,
    sortEvaluatedMovesByMwcLoss,
    writeStoredChameleonLayer,
    type ChameleonLayer,
} from '../../features/chameleon/chameleonProfile';

export interface ChameleonPostMatchCardProps {
    readonly analysis: CompleteGameAnalysis | null;
    readonly locale?: string;
}

const FOUR_FACTORS_PILLS = ['Course', 'Structure', 'Flexibilité', 'Sécurité'] as const;

const ChameleonPostMatchCardComponent: React.FC<ChameleonPostMatchCardProps> = ({
    analysis,
    locale = 'fr',
}) => {
    const autoLayer = useMemo<ChameleonLayer>(
        () => resolveAutoChameleonLayer(analysis ? [analysis] : []),
        [analysis],
    );
    const [activeLayer, setActiveLayer] = useState<ChameleonLayer>(autoLayer);

    useEffect(() => {
        const stored = readStoredChameleonLayer();
        setActiveLayer(stored !== null ? stored : autoLayer);
    }, [autoLayer]);

    const handleSelectLayer = (layer: ChameleonLayer) => {
        setActiveLayer(layer);
        writeStoredChameleonLayer(layer);
    };

    const sortedByMwc = useMemo(
        () => sortEvaluatedMovesByMwcLoss(analysis?.evaluatedMoves ?? []),
        [analysis?.evaluatedMoves],
    );

    const worstTurn = useMemo(
        () => sortedByMwc.find((m) => m.verdict === 'blunder' || m.verdict === 'howler' || m.verdict === 'doubtful') ?? sortedByMwc[0] ?? null,
        [sortedByMwc],
    );

    const fourFactorsAdvice = useMemo(
        () => buildFourFactorsNaturalAdvice(worstTurn),
        [worstTurn],
    );

    const playerPr = analysis?.performanceRating ?? 12.0;
    const clubScale = useMemo(() => getClubPrScaleLabel(playerPr, locale), [playerPr, locale]);
    const cubeGauge = useMemo(() => evaluateCubeVisualGauge(70, 'race'), []);
    const exactTakePoint = useMemo(() => calculateExactTakePoint(1, 3), []);
    const progressiveGoal = useMemo(
        () =>
            buildProgressiveMasteryGoal({
                blundersCount: analysis?.breakdown.blunder ?? 0,
                inaccuraciesCount: analysis?.breakdown.doubtful ?? 0,
                missedCubesCount: (analysis?.cubePR ?? 0) > 3 ? 1 : 0,
            }),
        [analysis?.breakdown.blunder, analysis?.breakdown.doubtful, analysis?.cubePR],
    );

    const worstMwcLoss =
        worstTurn && typeof worstTurn.mwcBefore === 'number' && typeof worstTurn.mwcAfter === 'number'
            ? Math.abs(worstTurn.mwcBefore - worstTurn.mwcAfter)
            : 0;

    return (
        <section
            data-testid="chameleon-post-match-card"
            aria-label="Synthèse Caméléon à divulgation progressive"
            className="rounded-2xl border border-white/10 bg-[#110a06]/90 p-3.5 space-y-3 text-[#fdf8eb]"
        >
            {/* Barre de sélection des 3 strates Caméléon (Bascule auto + 1-Tap Override) */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-sm">🦎</span>
                    <span className="font-serif text-xs font-black uppercase tracking-wider text-[#f3c65f]">
                        Synthèse Caméléon
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-bold text-[#e8dcc6]/80">
                        {CHAMELEON_CONFIGS[activeLayer].badgeFr}
                    </span>
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#090503] p-0.5 text-[10px] font-bold">
                    {([0, 1, 2] as const).map((layer) => (
                        <button
                            key={layer}
                            type="button"
                            data-testid={`chameleon-layer-btn-${layer}`}
                            onClick={() => handleSelectLayer(layer)}
                            className={`rounded-lg px-2.5 py-1 transition ${
                                activeLayer === layer
                                    ? 'bg-[#d4af37] text-[#1a0f07] font-black'
                                    : 'text-[#e8dcc6]/75 hover:text-white'
                            }`}
                        >
                            {layer === 0 ? 'Essentiel' : layer === 1 ? 'Club' : 'Pro'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Objectif progressif personnalisé (Blunders / Micro-Blunders / Cubes oubliés) */}
            <div
                data-testid="chameleon-progressive-goal-banner"
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/30 bg-[#1c1108]/90 px-3 py-2 text-xs"
            >
                <span className="font-bold text-[#f3c65f]">{progressiveGoal.badgeLabelFr}</span>
                <span className="text-[#e8dcc6]/90">{progressiveGoal.goalDescriptionFr}</span>
            </div>

            {/* COUCHE 0 : Mode Pureté & Plaisir (0 % jargon — 4 Fondamentaux Positionnels) */}
            {activeLayer === 0 && (
                <div data-testid="chameleon-layer0-four-factors" className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {FOUR_FACTORS_PILLS.map((factor) => {
                            const isHighlighted =
                                factor === fourFactorsAdvice.primaryFactor ||
                                factor === fourFactorsAdvice.secondaryFactor;
                            return (
                                <span
                                    key={factor}
                                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                                        isHighlighted
                                            ? 'border-[#f3c65f] bg-[#2a1a0c] text-[#fff3c4]'
                                            : 'border-white/10 bg-black/30 text-slate-400'
                                    }`}
                                >
                                    {factor}
                                </span>
                            );
                        })}
                    </div>
                    <p className="font-serif text-xs font-bold text-[#fce8b2]">
                        {fourFactorsAdvice.headlineFr}
                    </p>
                    <p className="text-xs leading-relaxed text-[#e8dcc6]/90">
                        {fourFactorsAdvice.narrativeFr}
                    </p>
                </div>
            )}

            {/* COUCHE 1 : Mode Club (Échelle PR + Jauge Visuelle du Videau à 3 repères) */}
            {activeLayer === 1 && (
                <div data-testid="chameleon-layer1-cube-gauge" className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${clubScale.colorClass}`}>
                            Palier Club : {clubScale.tier} (PR {clubScale.range})
                        </span>
                        <span className="text-[11px] text-[#e8dcc6]/80">
                            Seuil Prise : <strong>{cubeGauge.baseTakePointPercent}%</strong> (Effectif {cubeGauge.effectiveTakePointPercent}% avec Recube Vig -{cubeGauge.recubeVigPercent}%)
                        </span>
                    </div>

                    {/* Barre visuelle 0% -> 25% Take Point -> 75% Double Window -> 100% */}
                    <div className="relative h-6 w-full overflow-hidden rounded-xl border border-white/10 bg-[#090503] p-0.5">
                        <div className="grid h-full w-full grid-cols-4 text-[10px] font-bold">
                            <div className="flex items-center justify-center bg-rose-950/70 text-rose-200 border-r border-white/10">
                                Pass (&lt;25%)
                            </div>
                            <div className="col-span-2 flex items-center justify-center bg-emerald-950/50 text-emerald-200 border-r border-white/10">
                                Zone de Jeu · Loi de Woolsey (68–75%)
                            </div>
                            <div className="flex items-center justify-center bg-amber-950/70 text-amber-200">
                                Double (≥75%)
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-[#fce8b2]">
                        💡 <strong>Loi de Woolsey :</strong> « En cas de doute, doublez » — {cubeGauge.clubRecommendationFr}
                    </p>
                </div>
            )}

            {/* COUCHE 2 : Mode Grand-Maître / Pro (Split PR, Tri MWC % & Take Point exact) */}
            {activeLayer === 2 && (
                <div data-testid="chameleon-layer2-pro-metrics" className="space-y-2.5">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div className="rounded-xl border border-white/10 bg-[#1a0f08] p-2.5">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#f3c65f]">
                                Split PR (Dames vs Videau)
                            </span>
                            <div className="mt-1 font-mono text-xs font-extrabold text-white">
                                PR-Positional : {(analysis?.checkerPR ?? playerPr).toFixed(2)} · PR-Cube : {(analysis?.cubePR ?? 0).toFixed(2)}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-[#1a0f08] p-2.5">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                                Métrique Primaire Match (MWC %)
                            </span>
                            <div className="mt-1 font-mono text-xs font-extrabold text-white">
                                {worstTurn ? `Pire écart : -${worstMwcLoss.toFixed(2)}% MWC (${worstTurn.equityLoss.toFixed(3)} EMG)` : '0.00% MWC'}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-[#1a0f08] p-2.5">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-sky-300">
                                Take Point &amp; Score n-away
                            </span>
                            <div className="mt-1 font-mono text-xs font-extrabold text-white">
                                TP = {(exactTakePoint * 100).toFixed(1)}% · {formatNAwayScore(analysis?.scoreX ?? 0, analysis?.scoreO ?? 0, analysis?.matchLength ?? 7)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export const ChameleonPostMatchCard = React.memo(ChameleonPostMatchCardComponent);
export default ChameleonPostMatchCard;
