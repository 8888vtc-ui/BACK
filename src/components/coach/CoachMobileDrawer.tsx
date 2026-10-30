'use client';

/**
 * Tiroir coulissant mobile (< lg) et bouton flottant du Coach IA à 3 crans (Étape 5).
 *
 * Crans d'ancrage normalisés :
 *   - Fermé : 0px (`translate-y-full`)
 *   - Demi-Écran : 46dvh (`h-[46dvh]`, plateau 24 flèches visible au-dessus pour comparer coups)
 *   - Plein Écran : 90dvh (`h-[90dvh]`, historique complet, PR, matrices de videau)
 *
 * Conforme à SCALABILITY.md (< 280 lignes).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import CoachPanel from './CoachPanel';
import CoachLiveAiRadar from './CoachLiveAiRadar';
import BotPersonaChatCard from './BotPersonaChatCard';
import CoachMobileSummaryBar from './CoachMobileSummaryBar';
import CoachMobileHistoryNav from './CoachMobileHistoryNav';
import ErrorBoundary from '../common/ErrorBoundary';
import type { CoachAnalysisHistoryEntry, CoachState, MatchStats } from '../../hooks/useCoach';
import type { MatchContext, BuildMatchContextParams } from '../../features/coach/matchContext';

export type CoachDrawerSnap = 'half' | 'full';

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
    // Normalisation des 3 crans : fermé (0px) / demi-écran (46dvh) / plein-écran (90dvh)
    const [snapState, setSnapState] = useState<CoachDrawerSnap>('half');
    const touchStartYRef = useRef<number | null>(null);

    // À l'ouverture, repositionne toujours par défaut sur le cran demi-écran (46dvh)
    useEffect(() => {
        if (isOpen) {
            setSnapState('half');
        }
    }, [isOpen]);

    const totalHistory = coachHistory.length;
    const activeHistIdx = selectedCoachHistoryIndex ?? (totalHistory > 0 ? totalHistory - 1 : 0);
    const activeCoach =
        selectedCoachHistoryIndex !== null && coachHistory[selectedCoachHistoryIndex]
            ? coachHistory[selectedCoachHistoryIndex].coachState
            : coach;

    const toggleSnapState = useCallback(() => {
        setSnapState((prev) => (prev === 'half' ? 'full' : 'half'));
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartYRef.current = e.touches[0]?.clientY ?? null;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const startY = touchStartYRef.current;
        const endY = e.changedTouches[0]?.clientY ?? null;
        touchStartYRef.current = null;
        if (startY === null || endY === null) return;

        const deltaY = endY - startY;
        // Glissement vers le bas franc (> 50px)
        if (deltaY > 50) {
            if (snapState === 'full') {
                setSnapState('half');
            } else {
                onClose();
            }
        } else if (deltaY < -50 && snapState === 'half') {
            // Glissement vers le haut franc (> 50px)
            setSnapState('full');
        }
    };

    const drawerHeightClass = snapState === 'full' ? 'h-[90dvh] max-h-[90dvh]' : 'h-[46dvh] max-h-[46dvh]';

    return (
        <>
            {isOpen && (
                <div
                    aria-hidden="true"
                    data-testid="coach-drawer-backdrop"
                    onClick={onClose}
                    className="lg:hidden fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]"
                />
            )}

            {/* Bottom Sheet Coach IA à 3 crans : 0px / 46dvh / 90dvh */}
            <div
                id="coach-drawer-mobile"
                data-testid="coach-drawer-mobile"
                data-snap-state={isOpen ? snapState : 'closed'}
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                className={`lg:hidden fixed inset-x-0 bottom-0 z-50 transition-all duration-300 ease-out transform ${
                    isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
                }`}
            >
                <div
                    className={`relative ${drawerHeightClass} flex flex-col rounded-t-3xl border-t border-white/15 bg-slate-950/98 text-slate-100 backdrop-blur-2xl shadow-[0_-12px_40px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-300`}
                >
                    {/* Poignée d'ancrage et en-tête */}
                    <div
                        data-testid="coach-drawer-handle"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        className="flex flex-col border-b border-white/10 bg-slate-900/95 shrink-0 px-4 py-2 cursor-grab active:cursor-grabbing select-none"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2" onClick={toggleSnapState}>
                                <span className="h-1.5 w-10 rounded-full bg-slate-600 hover:bg-amber-400 transition" />
                                <span className="font-sans text-xs font-bold text-white tracking-tight">
                                    🎓 Coach IA {snapState === 'full' ? '(90%)' : '(46%)'}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    data-testid="coach-drawer-snap-toggle"
                                    onClick={toggleSnapState}
                                    className="rounded-lg p-1 text-amber-300 hover:text-white transition text-xs font-bold"
                                    title={snapState === 'full' ? 'Réduire à 46% (demi-écran)' : 'Agrandir à 90% (plein écran)'}
                                    aria-label="Ajuster la hauteur du tiroir"
                                >
                                    {snapState === 'full' ? '⤡ 46%' : '⤢ 90%'}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-lg p-1 text-slate-300 hover:text-white transition"
                                    aria-label="Fermer le tiroir du coach"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Navigation temporelle des coups */}
                        <CoachMobileHistoryNav
                            totalHistory={totalHistory}
                            activeHistIdx={activeHistIdx}
                            selectedCoachHistoryIndex={selectedCoachHistoryIndex}
                            coachHistory={coachHistory}
                            onSelectCoachHistoryIndex={onSelectCoachHistoryIndex ?? (() => {})}
                        />
                    </div>

                    {isOpen && (
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
                                    onReplayMove={onReplayMove ? () => { onReplayMove(); onClose(); } : undefined}
                                    onDismiss={() => { onDismiss(); onClose(); }}
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
                                <>
                                    <CoachLiveAiRadar
                                        board={board}
                                        matchContext={matchContext as MatchContext | undefined}
                                        verdict={activeCoach?.verdict ?? null}
                                        equityLoss={activeCoach?.equityLoss ?? null}
                                        locale={locale}
                                    />
                                    <BotPersonaChatCard
                                        verdict={activeCoach?.verdict ?? null}
                                        equityLoss={activeCoach?.equityLoss ?? null}
                                        dice={dice ?? null}
                                        matchStats={matchStats}
                                        onReplayMove={onReplayMove}
                                    />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Barre résumée mobile : masquée quand le Bottom Sheet est ouvert */}
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
