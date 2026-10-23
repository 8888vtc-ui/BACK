'use client';

/**
 * Pied du panneau Coach — onglets repliables (< 140 lignes, 0 any).
 *
 * Rôle :
 *   Regroupe les outils secondaires du Coach dans deux onglets dépliables :
 *     - Feuille de Match (composant MatchScoreSheet)
 *     - Rollout Profond (composant DeepRolloutSection)
 */

import React, { useState } from 'react';
import MatchScoreSheet from './MatchScoreSheet';
import DeepRolloutSection from './DeepRolloutSection';
import type { RawGameTurn } from '../../features/rating';
import type { RolloutResult } from '../../lib/engine/rolloutClient';
import type { MatchStats } from './coachPanelHelpers';

type FooterTab = 'scoresheet' | 'rollout';

export interface CoachFooterTabsProps {
    turnsHistory?: RawGameTurn[] | unknown[];
    board?: number[];
    matchStats?: MatchStats;
    matchStatsO?: MatchStats;
    xgid?: string | null;
    playedMove?: string | null;
    optimalMove?: string | null;
    candidateMoves?: string[];
    onRolloutCompleted?: (result: RolloutResult) => void;
    locale?: string;
}

const CoachFooterTabsComponent: React.FC<CoachFooterTabsProps> = ({
    turnsHistory,
    board,
    matchStats,
    matchStatsO,
    xgid,
    playedMove,
    optimalMove,
    candidateMoves,
    onRolloutCompleted,
    locale = 'fr',
}) => {
    const isEn = locale === 'en';
    const [activeTab, setActiveTab] = useState<FooterTab | null>(null);

    const tabs: Array<{ id: FooterTab; icon: string; label: string }> = [
        { id: 'scoresheet', icon: '📜', label: isEn ? 'Match sheet' : 'Feuille de Match' },
        { id: 'rollout', icon: '🔬', label: isEn ? 'Deep rollout' : 'Rollout Profond' },
    ];

    const toggle = (tab: FooterTab) => setActiveTab((prev) => (prev === tab ? null : tab));

    return (
        <section
            data-testid="coach-footer-tabs"
            aria-label={isEn ? 'Coach tools' : 'Outils du Coach'}
            className="rounded-xl border border-slate-800/80 bg-slate-950/60"
        >
            <div role="tablist" className="flex items-center gap-1 p-1">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-expanded={isActive}
                            data-testid={`coach-footer-tab-${tab.id}`}
                            onClick={() => toggle(tab.id)}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition ${isActive
                                ? 'bg-indigo-600/30 text-indigo-200 ring-1 ring-inset ring-indigo-500/60'
                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                                }`}
                        >
                            <span aria-hidden="true">{tab.icon}</span>
                            <span>{tab.label}</span>
                            <span aria-hidden="true" className="text-[9px] opacity-70">
                                {isActive ? '▾' : '▸'}
                            </span>
                        </button>
                    );
                })}
            </div>

            {activeTab === 'scoresheet' && (
                <div className="border-t border-slate-800/80 p-2" data-testid="coach-footer-panel-scoresheet">
                    <MatchScoreSheet
                        turnsHistory={(turnsHistory ?? []) as RawGameTurn[]}
                        board={board}
                        matchStats={matchStats}
                        matchStatsO={matchStatsO}
                    />
                </div>
            )}

            {activeTab === 'rollout' && (
                <div className="border-t border-slate-800/80 p-2" data-testid="coach-footer-panel-rollout">
                    <DeepRolloutSection
                        xgid={xgid}
                        playedMove={playedMove}
                        optimalMove={optimalMove}
                        candidateMoves={candidateMoves}
                        onRolloutCompleted={onRolloutCompleted}
                    />
                </div>
            )}
        </section>
    );
};

export const CoachFooterTabs = React.memo(CoachFooterTabsComponent);
export default CoachFooterTabs;
