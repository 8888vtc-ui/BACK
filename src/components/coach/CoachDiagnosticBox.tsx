'use client';

/**
 * Diagnostic pédagogique du Grand-Maître — encadré explicatif du Coach.
 *
 * Rôle :
 *   Présente en français l'explication stratégique du coup :
 *     - le diagnostic tactique automatique (`tacticalExplainer.ts`) ;
 *     - l'explication enrichie par le LLM (`/api/coach`) lorsqu'elle est disponible ;
 *     - les concepts détectés (Golden Point, prime, blitz, duplication, blots, course).
 *
 * Composant 100 % muet (LOI 5) : aucun calcul, aucun appel réseau.
 *
 * Dépendances :
 *   Aucune (présentation pure).
 *
 * Retrait :
 *   Supprimer ce fichier et son usage dans `CoachPanel.tsx`.
 */

import React from 'react';

export interface CoachDiagnosticBoxProps {
    /** Diagnostic tactique automatique (tacticalExplainer). */
    tacticalSummary?: string | null;
    /** Explication LLM / règle-basée (corps pédagogique). */
    explanation?: string | null;
    /** Résumé d'accroche. */
    summary?: string | null;
    /** Ce qui ne va pas dans le coup joué. */
    whyFailed?: string | null;
    /** Pourquoi le coup optimal est supérieur. */
    whyOptimal?: string | null;
    /** Conseil actionnable. */
    advice?: string | null;
    /** Concept clé détecté. */
    keyConcept?: string | null;
    /** Identifiant normalisé du concept théorique. */
    conceptId?: string | null;
    /** Callback pour ouvrir la fiche théorique du concept. */
    onOpenKnowledgeConcept?: (conceptId: string) => void;
    /** Indique qu'un flux LLM est en cours. */
    isStreaming?: boolean;
    /** Langue d'affichage. */
    locale?: string;
}

const CoachDiagnosticBoxComponent: React.FC<CoachDiagnosticBoxProps> = ({
    tacticalSummary,
    explanation,
    summary,
    whyFailed,
    whyOptimal,
    advice,
    keyConcept,
    conceptId,
    onOpenKnowledgeConcept,
    isStreaming = false,
    locale = 'fr',
}) => {
    const isEn = locale === 'en';
    const hasContent = Boolean(
        tacticalSummary || explanation || summary || whyFailed || whyOptimal || advice,
    );

    if (!hasContent && !isStreaming) return null;

    return (
        <section
            data-testid="coach-diagnostic-box"
            aria-label={isEn ? 'Grandmaster diagnostic' : 'Diagnostic du Grand-Maître'}
            className="rounded-xl border border-indigo-800/60 bg-gradient-to-b from-indigo-950/40 to-slate-950/80 p-3 space-y-2"
        >
            <header className="flex items-center gap-2 border-b border-indigo-900/50 pb-1.5">
                <span aria-hidden="true" className="text-sm">
                    🧠
                </span>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-indigo-300">
                    {isEn ? 'Grandmaster diagnostic' : 'Diagnostic du Grand-Maître'}
                </h3>
                {keyConcept && (
                    onOpenKnowledgeConcept ? (
                        <button
                            type="button"
                            onClick={() => onOpenKnowledgeConcept(conceptId || keyConcept)}
                            data-testid="coach-concept-badge-btn"
                            title={isEn ? `Open theory guide: ${keyConcept}` : `Ouvrir la fiche théorique : ${keyConcept}`}
                            className="ml-auto flex items-center gap-1 rounded-full border border-indigo-500/70 bg-indigo-900/70 px-2 py-0.5 text-[9px] font-bold text-indigo-200 hover:bg-indigo-700/80 hover:text-white transition active:scale-95 cursor-pointer shadow-sm"
                        >
                            <span aria-hidden="true">📖</span>
                            <span>{keyConcept}</span>
                        </button>
                    ) : (
                        <span className="ml-auto rounded-full border border-indigo-700/60 bg-indigo-900/60 px-2 py-0.5 text-[9px] font-bold text-indigo-200">
                            {keyConcept}
                        </span>
                    )
                )}
            </header>


            {/* Diagnostic tactique automatique (toujours en français). */}
            {tacticalSummary && (
                <p
                    data-testid="coach-tactical-summary"
                    className="text-xs leading-relaxed text-slate-200"
                >
                    {tacticalSummary}
                </p>
            )}

            {/* Résumé d'accroche du LLM. */}
            {summary && summary !== tacticalSummary && (
                <p className="text-xs font-semibold leading-snug text-white">{summary}</p>
            )}

            {/* Pourquoi le coup joué échoue / pourquoi l'optimal gagne. */}
            {(whyFailed || whyOptimal) && (
                <div className="space-y-1.5">
                    {whyFailed && (
                        <div className="flex items-start gap-1.5 rounded-lg border border-rose-900/40 bg-rose-950/30 p-2">
                            <span aria-hidden="true" className="mt-0.5 shrink-0 text-[10px] text-rose-400">
                                ❌
                            </span>
                            <span className="text-[11px] leading-relaxed text-rose-200">{whyFailed}</span>
                        </div>
                    )}
                    {whyOptimal && (
                        <div className="flex items-start gap-1.5 rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-2">
                            <span aria-hidden="true" className="mt-0.5 shrink-0 text-[10px] text-emerald-400">
                                ✅
                            </span>
                            <span className="text-[11px] leading-relaxed text-emerald-200">{whyOptimal}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Corps de l'explication (LLM ou règle-basée). */}
            {explanation && (
                <div className="whitespace-pre-line text-[11px] leading-relaxed text-slate-300">
                    {explanation}
                    {isStreaming && (
                        <span className="ml-1 inline-block animate-pulse font-mono font-bold text-indigo-400">
                            ▋
                        </span>
                    )}
                </div>
            )}

            {/* Conseil actionnable. */}
            {advice && (
                <div className="rounded-md border border-amber-500/30 bg-amber-950/20 p-2 text-[11px] leading-relaxed text-amber-200">
                    💡 <span className="font-semibold text-amber-100">{isEn ? 'Advice' : 'Conseil'} :</span>{' '}
                    {advice}
                </div>
            )}
        </section>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const CoachDiagnosticBox = React.memo(CoachDiagnosticBoxComponent);
export default CoachDiagnosticBox;
