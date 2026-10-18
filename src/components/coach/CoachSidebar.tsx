'use client';

/**
 * Panneau latéral de bureau (>= lg) du Coach IA & Analyse.
 *
 * Rôle :
 *   Affiche le panneau d'analyse temps réel, la veille stratégique active et la bannière
 *   vintage pour les grands écrans.
 *
 * Dépendances :
 *   `CoachPanel`, `ErrorBoundary`.
 *
 * Retrait :
 *   Supprimer ce fichier et son appel dans `page.tsx`.
 */

import React from 'react';
import type { ThemeName } from '../board/boardThemes';
import CoachPanel from './CoachPanel';
import MatchScoreSheet from './MatchScoreSheet';
import ErrorBoundary from '../common/ErrorBoundary';
import type { RawGameTurn } from '../../features/rating';

export interface CoachSidebarProps {
    /** Données d'analyse du coach ou null */
    coach: any;
    /** Analyse en cours */
    isAnalyzing: boolean;
    /** Handler de fermeture de l'analyse */
    onDismiss: () => void;
    /** Handler pour rejouer l'erreur */
    onReplayMove?: () => void;
    /** Handler pour ouvrir un concept dans la base théorique */
    onOpenKnowledgeConcept?: (conceptId: string) => void;
    /** Handler pour demander manuellement conseil */
    onTriggerCoach: () => void;
    /** Thème visuel actif */
    theme: ThemeName;
    /** Statistiques de match cumulées (PR Joueur X) */
    matchStats?: any;
    /** Statistiques de match cumulées (PR Adversaire O) */
    matchStatsO?: any;
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
    /** Historique des tours de jeu joués */
    turnsHistory?: RawGameTurn[];
}

const CoachSidebarComponent: React.FC<CoachSidebarProps> = ({
    coach,
    isAnalyzing,
    onDismiss,
    onReplayMove,
    onOpenKnowledgeConcept,
    onTriggerCoach,
    theme,
    matchStats,
    matchStatsO,
    matchContext,
    positionKey,
    gameId,
    dice,
    board,
    turnsHistory = [],
}) => {

    return (
        <aside
            id="coach-panel"
            className="hidden lg:flex flex-col w-[350px] xl:w-[400px] h-full max-h-full shrink-0 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/85 backdrop-blur-xl shadow-2xl transition-all"
        >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-400 animate-pulse" />
                    <h2 className="text-sm font-bold text-white tracking-wide">Coach IA & Analyse</h2>
                </div>
                {coach && (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="rounded-lg px-2 py-0.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Fermer l'analyse"
                    >
                        Fermer ✕
                    </button>
                )}
            </div>

            <div className="p-2 overflow-y-auto flex-1 space-y-2">
                <ErrorBoundary name="Analyse du Coach">
                    <CoachPanel
                        verdict={coach?.verdict ?? null}
                        equityLoss={coach?.equityLoss ?? null}
                        playedMove={coach?.playedMove ?? null}
                        optimalMove={coach?.optimalMove ?? null}
                        explanation={coach?.explanation ?? null}
                        whyFailed={coach?.whyFailed}
                        whyOptimal={coach?.whyOptimal}
                        summary={coach?.summary}
                        features={coach?.features}
                        matchStats={matchStats}
                        topMoves={coach?.candidateMoves}
                        boardBefore={coach?.boardBefore}
                        onReplayMove={onReplayMove}
                        onDismiss={onDismiss}
                        onOpenKnowledgeConcept={onOpenKnowledgeConcept}
                        isLoading={isAnalyzing}
                        matchContext={matchContext}
                        positionKey={positionKey}
                        gameId={gameId}
                        dice={dice}
                        board={board}
                    />
                </ErrorBoundary>

                {!coach && !isAnalyzing && (
                    <div className="flex flex-col gap-3 py-1 text-xs text-slate-300">
                        {/* Feuille de match officielle en direct */}
                        <MatchScoreSheet
                            turnsHistory={turnsHistory}
                            board={board}
                            matchStats={matchStats}
                            matchStatsO={matchStatsO}
                        />

                        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 space-y-2">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="font-semibold text-indigo-300">Veille Stratégique Active</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-mono">
                                    Tri-Phase 2-ply
                                </span>
                            </div>
                            <p className="text-slate-400 leading-relaxed text-[11px]">
                                Le Coach analyse chacun de vos coups en continu. En cas d’imprécision ou d’erreur tactique, l’évaluation et l’explication détaillée apparaîtront ici.
                            </p>
                            <button
                                type="button"
                                onClick={onTriggerCoach}
                                className="w-full mt-1.5 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:from-indigo-500 hover:to-blue-500 transition active:scale-95"
                            >
                                <span>🎓</span>
                                <span>Demander conseil au Coach</span>
                            </button>
                        </div>


                        {theme === 'snowie_classic' && (
                            <div
                                data-testid="snowie-vintage-banner"
                                className="rounded-xl border border-amber-600/60 bg-gradient-to-b from-[#241208] via-[#3a1a0c] to-[#241208] p-3 shadow-lg ring-1 ring-amber-500/20 text-amber-100 space-y-1"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-400 font-serif text-sm">✦</span>
                                    <span className="font-serif font-black uppercase tracking-wider text-[11px] text-amber-200">
                                        MOTEUR D'ANALYSE PRO • ÉDITION PRESTIGE
                                    </span>
                                </div>
                                <p className="text-[10px] text-amber-300/80 leading-snug">
                                    Ambiance Casino Privé • Feutrine Émeraude & Acajou Massif
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
};

export const CoachSidebar = React.memo(CoachSidebarComponent);
export default CoachSidebar;
