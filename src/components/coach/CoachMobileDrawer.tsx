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
import ErrorBoundary from '../common/ErrorBoundary';

export interface CoachMobileDrawerProps {
    /** Indique si le tiroir mobile est ouvert */
    isOpen: boolean;
    /** Ouvre le tiroir mobile */
    onOpen: () => void;
    /** Ferme le tiroir mobile */
    onClose: () => void;
    /** Données d'analyse du coach ou null */
    coach: any;
    /** Analyse en cours */
    isAnalyzing: boolean;
    /** Statistiques de match cumulées (PR) */
    matchStats?: any;
    /** Handler pour rejouer l'erreur */
    onReplayMove?: () => void;
    /** Handler pour fermer l'analyse */
    onDismiss: () => void;
    /** Handler pour ouvrir un concept dans la base théorique */
    onOpenKnowledgeConcept?: (conceptId: string) => void;
    /** Contexte de match pour calcul MET */
    matchContext?: any;
    /** Clé déterministe de position */
    positionKey?: string;
    /** ID de session de jeu */
    gameId?: string;
    /** Dés actifs */
    dice?: [number, number] | null;
    /** Plateau actuel */
    board?: number[];
}

const CoachMobileDrawerComponent: React.FC<CoachMobileDrawerProps> = ({
    isOpen,
    onOpen,
    onClose,
    coach,
    isAnalyzing,
    matchStats,
    onReplayMove,
    onDismiss,
    onOpenKnowledgeConcept,
    matchContext,
    positionKey,
    gameId,
    dice,
    board,
}) => {
    return (
        <>
            {/* Version Tiroir Bas du Coach (< lg) */}
            <div
                id="coach-drawer-mobile"
                className={`lg:hidden fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out transform ${
                    isOpen && (coach || isAnalyzing) ? 'translate-y-0' : 'translate-y-full pointer-events-none'
                }`}
            >
                <div className="relative max-h-[72vh] flex flex-col rounded-t-2xl border-t-2 border-indigo-500/60 bg-slate-950/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/80 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="h-1 w-8 rounded-full bg-slate-600" />
                            <span className="text-xs font-bold text-indigo-300">🎓 Coach IA & Analyse</span>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1 text-slate-400 hover:text-white"
                            aria-label="Fermer le tiroir du coach"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="p-3 overflow-y-auto flex-1">
                        <ErrorBoundary name="Analyse du Coach Mobile">
                            <CoachPanel
                                verdict={coach?.verdict ?? null}
                                equityLoss={coach?.equityLoss ?? null}
                                playedMove={coach?.playedMove ?? null}
                                optimalMove={coach?.optimalMove ?? null}
                                explanation={coach?.explanation ?? null}
                                features={coach?.features}
                                matchStats={matchStats}
                                topMoves={coach?.candidateMoves}
                                boardBefore={coach?.boardBefore}
                                onReplayMove={onReplayMove}
                                onDismiss={() => {
                                    onDismiss();
                                    onClose();
                                }}
                                onOpenKnowledgeConcept={onOpenKnowledgeConcept}
                                isLoading={isAnalyzing}
                                matchContext={matchContext}
                                positionKey={positionKey}
                                gameId={gameId}
                                dice={dice}
                                board={board}
                            />
                        </ErrorBoundary>
                    </div>
                </div>
            </div>

            {/* Bouton flottant mobile pour rouvrir l'analyse si minimisée */}
            {coach && !isOpen && (
                <button
                    type="button"
                    onClick={onOpen}
                    className="lg:hidden fixed bottom-3 right-3 z-40 flex items-center gap-2 rounded-full border border-indigo-500 bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xl animate-bounce"
                >
                    <span>🎓</span>
                    <span>Analyse ({coach.verdict === 'blunder' ? 'Blunder' : 'Douteux'})</span>
                </button>
            )}
        </>
    );
};

export const CoachMobileDrawer = React.memo(CoachMobileDrawerComponent);
export default CoachMobileDrawer;
