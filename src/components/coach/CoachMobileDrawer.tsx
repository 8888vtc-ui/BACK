'use client';

/**
 * Tiroir coulissant mobile (< lg) et bouton flottant du Coach IA.
 *
 * Rôle :
 *   Affiche le panneau d'analyse du coach sous forme de tiroir tactile sur smartphone
 *   sans empiéter sur le plateau de jeu.
 *
 * Dépendances :
 *   `CoachPanel`, `ErrorBoundary`.
 *
 * Retrait :
 *   Supprimer ce fichier et son appel dans `page.tsx`.
 */

import React from 'react';
import CoachPanel from './CoachPanel';
import CoachLiveAiRadar from './CoachLiveAiRadar';
import CoachMobileSummaryBar from './CoachMobileSummaryBar';
import ErrorBoundary from '../common/ErrorBoundary';
import type { CoachAnalysisHistoryEntry, CoachState, MatchStats } from '../../hooks/useCoach';
import type { MatchContext, BuildMatchContextParams } from '../../features/coach/matchContext';

export interface CoachMobileDrawerProps {
    /** Indique si le tiroir mobile est ouvert */
    isOpen: boolean;
    /** Ouvre le tiroir mobile */
    onOpen: () => void;
    /** Ferme le tiroir mobile */
    onClose: () => void;
    /** Données d'analyse du coach ou null */
    coach: CoachState | null;
    /** Analyse en cours */
    isAnalyzing: boolean;
    /** Statistiques de match cumulées (PR Joueur X) */
    matchStats?: MatchStats | null;
    /** Statistiques de match cumulées (PR Adversaire O) */
    matchStatsO?: MatchStats | null;
    /** Handler pour rejouer l'erreur */
    onReplayMove?: () => void;
    /** Handler pour fermer l'analyse */
    onDismiss: () => void;
    /** Handler pour ouvrir un concept dans la base théorique */
    onOpenKnowledgeConcept?: (conceptId: string) => void;
    /** Contexte de match pour calcul MET */
    matchContext?: MatchContext | Partial<BuildMatchContextParams> | null;
    /** Clé déterministe de position */
    positionKey?: string;
    /** ID de session de jeu */
    gameId?: string;
    /** Dés actifs */
    dice?: [number, number] | null;
    /** Plateau actuel */
    board?: number[];
    /** Clic sur le compteur « Blunders » (filtre / revue des erreurs). */
    onBlunderClick?: () => void;
    /** Survol d'une ligne du tableau des candidats (dessine les flèches). */
    onCandidateHover?: (notation: string | null) => void;
    /** Historique des tours (onglet Feuille de Match). */
    turnsHistory?: unknown[];
    /** Performance Rating courant (barre résumée mobile). */
    pr?: number | null;
    /** Langue d'affichage. */
    locale?: string;
    /** Historique des analyses de la manche */
    coachHistory?: ReadonlyArray<CoachAnalysisHistoryEntry>;
    /** Index du coup analysé inspecté */
    selectedCoachHistoryIndex?: number | null;
    /** Sélection d'un coup dans l'historique */
    onSelectCoachHistoryIndex?: (index: number | null) => void;
}

const CoachMobileDrawerComponent: React.FC<CoachMobileDrawerProps> = ({
    isOpen,
    onOpen,
    onClose,
    coach,
    isAnalyzing,
    matchStats,
    matchStatsO,
    onReplayMove,
    onDismiss,
    onOpenKnowledgeConcept,
    matchContext,
    positionKey,
    gameId,
    dice,
    board,
    onBlunderClick,
    onCandidateHover,
    turnsHistory,
    pr = null,
    locale = 'fr',
    coachHistory = [],
    selectedCoachHistoryIndex = null,
    onSelectCoachHistoryIndex,
}) => {
    const totalHistory = coachHistory.length;
    const activeHistIdx = selectedCoachHistoryIndex ?? (totalHistory > 0 ? totalHistory - 1 : 0);
    const activeCoach =
        selectedCoachHistoryIndex !== null && coachHistory[selectedCoachHistoryIndex]
            ? coachHistory[selectedCoachHistoryIndex].coachState
            : coach;
    const touchStartYRef = React.useRef<number | null>(null);
    const isDrawerVisible = isOpen;

    return (
        <>
            {isDrawerVisible && (
                <div
                    aria-hidden="true"
                    data-testid="coach-drawer-backdrop"
                    onClick={onClose}
                    className="lg:hidden fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]"
                />
            )}

            {/* Version Tiroir Bas du Coach (< lg) : Half-Sheet 46dvh avec Safe Area Bottom */}
            <div
                id="coach-drawer-mobile"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                className={`lg:hidden fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out transform ${
                    isDrawerVisible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
                }`}
            >
                <div className="relative max-h-[50dvh] sm:max-h-[75vh] flex flex-col rounded-t-3xl border-t-2 border-[#d4af37]/60 bg-gradient-to-b from-[#180f08]/98 via-[#0e121b]/98 to-[#07090e]/98 text-slate-100 backdrop-blur-2xl shadow-[0_-12px_40px_rgba(0,0,0,0.9)] overflow-hidden">
                    {/* Poignée et en-tête (supporte le glissement vers le bas pour fermer) */}
                    <div
                        onTouchStart={(e) => {
                            touchStartYRef.current = e.touches[0]?.clientY ?? null;
                        }}
                        onTouchEnd={(e) => {
                            const startY = touchStartYRef.current;
                            const endY = e.changedTouches[0]?.clientY ?? null;
                            touchStartYRef.current = null;
                            if (startY !== null && endY !== null && endY - startY > 45) {
                                onClose();
                            }
                        }}
                        className="flex flex-col border-b border-[#d4af37]/25 bg-gradient-to-r from-[#24160b]/95 via-[#150e08]/95 to-[#1e1309]/95 shrink-0 px-4 py-2.5"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="h-1.5 w-10 rounded-full bg-[#d4af37]/40" />
                                {!activeCoach?.verdict && !isAnalyzing && (
                                    <span className="font-serif text-xs font-bold text-[#fce8b2] tracking-wide">
                                        🎓 Coach IA &amp; Analyse
                                    </span>
                                )}
                            </div>
                            {(!activeCoach?.verdict || isAnalyzing) && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-lg p-1 text-[#f3c65f] hover:text-white transition"
                                    aria-label="Fermer le tiroir du coach"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Navigation temporelle des coups pour mobile */}
                        {totalHistory > 0 && onSelectCoachHistoryIndex && (
                            <div className="mt-2 flex items-center justify-between gap-1 text-[11px] pt-1.5 border-t border-[#d4af37]/20">
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={activeHistIdx <= 0}
                                        onClick={() => onSelectCoachHistoryIndex(0)}
                                        className="rounded border border-[#d4af37]/30 bg-black/50 px-1.5 py-0.5 font-bold text-amber-200 hover:border-[#f3c65f] disabled:opacity-35"
                                        title="Premier coup analysé"
                                    >
                                        ⏮
                                    </button>
                                    <button
                                        type="button"
                                        disabled={activeHistIdx <= 0}
                                        onClick={() => onSelectCoachHistoryIndex(Math.max(0, activeHistIdx - 1))}
                                        className="rounded border border-[#d4af37]/30 bg-black/50 px-2 py-0.5 font-bold text-amber-200 hover:border-[#f3c65f] disabled:opacity-35"
                                        title="Coup précédent"
                                    >
                                        ◀ Préc.
                                    </button>
                                </div>
                                <span className="font-mono font-bold text-[#f3c65f] truncate">
                                    Coup #{coachHistory[activeHistIdx]?.turnIndex ?? activeHistIdx + 1} ({activeHistIdx + 1}/{totalHistory})
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={activeHistIdx >= totalHistory - 1 && selectedCoachHistoryIndex === null}
                                        onClick={() => {
                                            if (activeHistIdx + 1 >= totalHistory - 1) {
                                                onSelectCoachHistoryIndex(null);
                                            } else {
                                                onSelectCoachHistoryIndex(activeHistIdx + 1);
                                            }
                                        }}
                                        className="rounded border border-[#d4af37]/30 bg-black/50 px-2 py-0.5 font-bold text-amber-200 hover:border-[#f3c65f] disabled:opacity-35"
                                        title="Coup suivant"
                                    >
                                        Suiv. ▶
                                    </button>
                                    <button
                                        type="button"
                                        disabled={selectedCoachHistoryIndex === null}
                                        onClick={() => onSelectCoachHistoryIndex(null)}
                                        className="rounded border border-emerald-500/40 bg-emerald-950/60 px-1.5 py-0.5 font-bold text-emerald-300 hover:border-emerald-400 disabled:opacity-35"
                                        title="Retour au jeu direct"
                                    >
                                        Direct
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    {isDrawerVisible && (
                        <div className="p-3 overflow-y-auto flex-1 space-y-2.5">
                            <ErrorBoundary name="Analyse du Coach Mobile">
                                <CoachPanel
                                    verdict={activeCoach?.verdict ?? null}
                                    equityLoss={activeCoach?.equityLoss ?? null}
                                    playedMove={activeCoach?.playedMove ?? null}
                                    optimalMove={activeCoach?.optimalMove ?? null}
                                    explanation={activeCoach?.explanation ?? null}
                                    whyFailed={activeCoach?.whyFailed}
                                    whyOptimal={activeCoach?.whyOptimal}
                                    summary={activeCoach?.summary}
                                    tacticalSummary={activeCoach?.tacticalSummary}
                                    features={activeCoach?.features}
                                    matchStats={matchStats ?? undefined}
                                    matchStatsO={matchStatsO ?? undefined}
                                    topMoves={activeCoach?.candidateMoves}
                                    boardBefore={activeCoach?.boardBefore}
                                    onReplayMove={
                                        onReplayMove
                                            ? () => {
                                                  onReplayMove();
                                                  onClose();
                                              }
                                            : undefined
                                    }
                                    onDismiss={() => {
                                        onDismiss();
                                        onClose();
                                    }}
                                    onOpenKnowledgeConcept={onOpenKnowledgeConcept}
                                    isLoading={isAnalyzing}
                                    matchContext={matchContext ?? undefined}
                                    positionKey={positionKey}
                                    gameId={gameId}
                                    dice={dice}
                                    board={board}
                                    onBlunderClick={onBlunderClick}
                                    onCandidateHover={onCandidateHover}
                                    turnsHistory={turnsHistory}
                                />
                            </ErrorBoundary>
                            {!activeCoach?.verdict && !isAnalyzing && (
                                <CoachLiveAiRadar
                                    board={board}
                                    matchContext={matchContext as MatchContext | undefined}
                                    verdict={activeCoach?.verdict ?? null}
                                    equityLoss={activeCoach?.equityLoss ?? null}
                                    locale={locale}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Barre résumée mobile : PR | Dernier verdict | [Ouvrir l'analyse].
                Masquée quand le Bottom Sheet est déplié. */}
            {!isOpen && (
                <CoachMobileSummaryBar
                    pr={pr}
                    verdict={coach?.verdict ?? null}
                    equityLoss={coach?.equityLoss ?? null}
                    isAnalyzing={isAnalyzing}
                    onOpen={onOpen}
                    locale={locale}
                />
            )}
        </>
    );
};

export const CoachMobileDrawer = React.memo(CoachMobileDrawerComponent);
export default CoachMobileDrawer;
