'use client';

/**
 * Panneau latéral du Coach (≥ lg) — version épurée TMG / Snowie.
 *
 * Rôle :
 *   Affiche uniquement l'analyse du coup précédent (`CoachPanel`), qui contient
 *   la carte comparative « coup joué vs coup optimal » et le Top 3 des coups.
 *
 *   La « Veille Stratégique Active », la bannière Prestige et la feuille de
 *   match en direct ont été retirées : elles doublonnaient le HUD et le Coach.
 *
 * Dépendances :
 *   `CoachPanel`, `ErrorBoundary`.
 *
 * Retrait :
 *   Supprimer ce fichier et son usage dans `GameBoardArea.tsx`.
 */

import React from 'react';
import type { ThemeName } from '../board/boardThemes';
import CoachPanel, { type CoachPanelProps } from './CoachPanel';
import ErrorBoundary from '../common/ErrorBoundary';
import { useCoachVoice } from '../../hooks/useCoachVoice';
import type { CoachState, MatchStats } from '../../hooks/useCoach';
import type { MatchContext } from '../../features/coach/matchContext';

export interface CoachSidebarProps {
    /** Données d'analyse du coach ou null */
    coach: CoachState | null;
    /** Analyse en cours */
    isAnalyzing: boolean;
    /** Ferme le panneau */
    onDismiss: () => void;
    /** Rejoue le coup analysé */
    onReplayMove?: () => void;
    /** Ouvre une fiche théorique */
    onOpenKnowledgeConcept?: (conceptId: string) => void;
    /** Déclenche manuellement une analyse */
    onTriggerCoach?: () => void;
    /** Thème actif */
    theme: ThemeName;
    /** Statistiques du joueur */
    matchStats?: MatchStats | null;
    /** Statistiques de l'adversaire */
    matchStatsO?: MatchStats | null;
    /** Contexte de match (MET) */
    matchContext?: MatchContext | null;
    /** Clé de position */
    positionKey?: string;
    /** Identifiant de partie */
    gameId?: string;
    /** Dés courants */
    dice?: [number, number] | null;
    /** Plateau courant */
    board?: number[];
    /** Historique des tours */
    turnsHistory?: unknown[];
    /** Clic sur le compteur « Blunders » (filtre / revue des erreurs). */
    onBlunderClick?: () => void;
    /** Survol d'une ligne du tableau des candidats (dessine les flèches). */
    onCandidateHover?: (notation: string | null) => void;
}

const CoachSidebarComponent: React.FC<CoachSidebarProps> = ({
    coach,
    isAnalyzing,
    onDismiss,
    onReplayMove,
    onOpenKnowledgeConcept,
    onTriggerCoach,
    matchStats,
    matchContext,
    positionKey,
    gameId,
    dice,
    board,
    onBlunderClick,
    onCandidateHover,
    turnsHistory,
}) => {
    const { isVoiceEnabled, isSpeaking, toggleVoice, stop } = useCoachVoice();

    const handleDismiss = () => {
        stop();
        onDismiss();
    };

    return (
        <aside
            id="coach-panel"
            className="flex flex-col w-full h-full max-h-full min-w-0 shrink-0 overflow-hidden rounded-2xl border border-[#d4af37]/50 bg-gradient-to-b from-[#17110b]/98 via-[#0d111a]/98 to-[#07090f]/98 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,245,205,0.22)] transition-all"
        >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#d4af37]/25 bg-gradient-to-r from-[#24160b]/90 via-[#150e08]/90 to-[#1e1309]/90 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-[#f3c65f] shadow-[0_0_8px_rgba(243,198,95,0.9)] animate-pulse" />
                    <h2 className="font-serif text-sm font-bold text-[#fdf8eb] tracking-wide">Coach IA &amp; Analyse</h2>
                </div>
                <div className="flex items-center gap-1.5">
                    {!coach?.verdict && (
                        <button
                            type="button"
                            onClick={toggleVoice}
                            data-testid="coach-voice-toggle-btn"
                            aria-pressed={isVoiceEnabled}
                            aria-label={isVoiceEnabled ? 'Voix Coach' : 'Voix muette'}
                            title={isVoiceEnabled ? 'Désactiver la voix du Coach' : 'Activer la voix du Coach'}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold transition active:scale-95 ${
                                isVoiceEnabled
                                    ? 'border-[#f3c65f]/70 bg-[#2a1c0b]/90 text-[#fce8b2]'
                                    : 'border-[#d4af37]/30 bg-black/40 text-slate-400 hover:border-[#f3c65f]/50 hover:text-slate-200'
                            }`}
                        >
                            <span>{isVoiceEnabled ? '🔊 Voix Coach' : '🔇 Voix muette'}</span>
                            {isSpeaking && (
                                <span
                                    data-testid="coach-voice-wave"
                                    aria-hidden="true"
                                    className="inline-flex items-end gap-0.5 h-2.5 ml-0.5 animate-pulse"
                                >
                                    <span className="w-0.5 h-1.5 bg-[#f3c65f] rounded-full animate-pulse" />
                                    <span className="w-0.5 h-2.5 bg-[#f3c65f] rounded-full animate-pulse" />
                                    <span className="w-0.5 h-1 bg-[#f3c65f] rounded-full animate-pulse" />
                                </span>
                            )}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="rounded-lg border border-[#d4af37]/30 bg-black/40 px-2 py-0.5 text-[11px] font-bold text-amber-200/80 hover:border-[#f3c65f] hover:text-white transition"
                        title="Fermer l'analyse"
                    >
                        Fermer ✕
                    </button>
                </div>
            </div>

            <div className="p-2.5 overflow-y-auto flex-1 space-y-2.5">
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
                        tacticalSummary={coach?.tacticalSummary}
                        features={coach?.features}
                        matchStats={matchStats ?? undefined}
                        topMoves={coach?.candidateMoves}
                        boardBefore={coach?.boardBefore}
                        onReplayMove={onReplayMove}
                        onDismiss={onDismiss}
                        onOpenKnowledgeConcept={onOpenKnowledgeConcept}
                        isLoading={isAnalyzing}
                        matchContext={matchContext ?? undefined}
                        positionKey={positionKey}
                        gameId={gameId}
                        dice={dice}
                        board={board}
                        onBlunderClick={onBlunderClick}
                        onCandidateHover={onCandidateHover}
                        turnsHistory={turnsHistory as CoachPanelProps['turnsHistory']}
                    />
                </ErrorBoundary>

                {!coach && !isAnalyzing && (
                    <div className="flex flex-col gap-3 py-1 text-xs text-slate-300">
                        <div className="rounded-xl border border-[#d4af37]/30 bg-[#0b0f18]/90 p-3.5 space-y-2.5 shadow-inner">
                            <div className="flex items-center justify-between">
                                <span className="font-serif font-bold text-[#f3c65f]">Coach prêt</span>
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#24190b] border border-[#d4af37]/45 text-[#f3c65f] font-mono font-bold">
                                    Open Sage 3-Ply
                                </span>
                            </div>
                            {matchStats && matchStats.decisionsCount > 0 && (
                                <div
                                    data-testid="coach-idle-session-stats"
                                    className="flex items-center justify-between rounded-lg border border-[#d4af37]/25 bg-black/50 px-2.5 py-1.5 font-mono text-[11px]"
                                >
                                    <span className="text-[#fdf8eb] font-bold">
                                        PR {((matchStats.totalEquityLoss / matchStats.decisionsCount) * 500).toFixed(1)}
                                    </span>
                                    <span className="text-slate-400">
                                        {matchStats.decisionsCount} décision{matchStats.decisionsCount > 1 ? 's' : ''}
                                    </span>
                                    <span className="text-rose-300 font-bold">
                                        {matchStats.blundersCount} blunder{matchStats.blundersCount > 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                            <p className="text-slate-300/90 leading-relaxed text-[11px]">
                                Le Grand Maître Open Sage évalue chacun de vos coups et décisions de videau en temps réel.
                            </p>
                            {onTriggerCoach && (
                                <button
                                    type="button"
                                    onClick={onTriggerCoach}
                                    className="w-full mt-1.5 flex items-center justify-center gap-2 rounded-xl border border-[#fef08a]/75 bg-gradient-to-b from-[#fff5cf] via-[#f0c75e] to-[#b87e14] px-3 py-2 text-xs font-black uppercase tracking-wider text-[#1c1004] shadow-[0_6px_18px_rgba(212,175,55,0.35),inset_0_1px_0_rgba(255,255,255,0.8)] hover:brightness-105 transition active:scale-95"
                                >
                                    <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">🎓</span>
                                    <span>Demander conseil au Coach</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export const CoachSidebar = React.memo(CoachSidebarComponent);
export default CoachSidebar;
