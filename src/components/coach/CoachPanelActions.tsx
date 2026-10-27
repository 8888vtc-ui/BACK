'use client';

/**
 * Barre d'actions du panneau Coach (source d'explication, erreurs, CTA).
 *
 * Rôle :
 *   - Affiche la provenance de l'explication (cache / règle-basée / LLM).
 *   - Affiche l'erreur de flux avec bouton « Réessayer ».
 *   - Propose « Explique mon erreur » (si aucune explication) et
 *     « Consulter la Fiche Théorique ».
 *
 * Composant 100 % muet (LOI 5).
 */

import React from 'react';
import type { ExplanationSource } from './useCoachExplanation';

export interface CoachPanelActionsProps {
    explanationSource: ExplanationSource;
    streamError: string | null;
    hasContent: boolean;
    isStreaming: boolean;
    onExplainClick: () => void;
    onOpenKnowledgeConcept?: (conceptId: string) => void;
    conceptId?: string;
    locale?: string;
    labels: {
        sourceCache: string;
        sourceRuleBased: string;
        sourceLlm: string;
        retry: string;
        explainError: string;
    };
}

const CoachPanelActionsComponent: React.FC<CoachPanelActionsProps> = ({
    explanationSource,
    streamError,
    hasContent,
    isStreaming,
    onExplainClick,
    onOpenKnowledgeConcept,
    conceptId,
    locale = 'fr',
    labels,
}) => {
    const isEn = locale === 'en';
    const showActionButtons = !hasContent || Boolean(onOpenKnowledgeConcept);

    if (!explanationSource && !streamError && !showActionButtons) {
        return null;
    }

    return (
        <div className="mt-2 space-y-2">
            {explanationSource && (
                <div className="flex items-center justify-between px-1 text-[10px] font-semibold">
                    {explanationSource === 'cache' && (
                        <span className="inline-flex items-center gap-1 text-emerald-400" data-testid="coach-source-cache">
                            <span aria-hidden="true">⚡</span> {labels.sourceCache}
                        </span>
                    )}
                    {explanationSource === 'rule-based' && (
                        <span className="inline-flex items-center gap-1 text-amber-400" data-testid="coach-source-rule-based">
                            <span aria-hidden="true">📴</span> {labels.sourceRuleBased}
                        </span>
                    )}
                    {explanationSource === 'llm' && (
                        <span className="inline-flex items-center gap-1 text-blue-400" data-testid="coach-source-llm">
                            <span aria-hidden="true">🤖</span> {labels.sourceLlm}
                        </span>
                    )}
                </div>
            )}

            {streamError && (
                <div className="flex items-center justify-between rounded-lg border border-red-800/40 bg-red-950/40 p-2.5 text-xs text-red-300">
                    <span>⚠️ {streamError}</span>
                    <button
                        onClick={onExplainClick}
                        className="rounded bg-red-800/80 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-red-700"
                    >
                        {labels.retry}
                    </button>
                </div>
            )}

            {showActionButtons && (
                <div className="flex flex-wrap items-center gap-2">
                    {!hasContent && (
                        <button
                            onClick={onExplainClick}
                            disabled={isStreaming}
                            data-testid="coach-explain-btn"
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-900/30 transition hover:bg-blue-500 active:scale-95 disabled:opacity-50"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                            </svg>
                            {labels.explainError}
                        </button>
                    )}
                    {onOpenKnowledgeConcept && (
                        <button
                            type="button"
                            onClick={() => onOpenKnowledgeConcept(conceptId || 'fundamentals')}
                            data-testid="coach-open-kb-btn"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/50 bg-indigo-600/30 px-3 py-2 text-xs font-bold text-indigo-300 shadow-sm transition hover:bg-indigo-600/60 hover:text-white active:scale-95"
                        >
                            <span aria-hidden="true">📖</span>
                            <span>{isEn ? 'Read Theory Sheet' : 'Consulter la Fiche Théorique'}</span>
                            <span aria-hidden="true">↗</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const CoachPanelActions = React.memo(CoachPanelActionsComponent);
export default CoachPanelActions;
