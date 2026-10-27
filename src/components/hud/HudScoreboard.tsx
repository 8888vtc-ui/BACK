'use client';

/**
 * Cartes joueurs du HUD supérieur — Guichets Horlogers Encastrés dans la Boiserie (< 250 lignes, 0 any).
 */

import React, { useEffect, useState } from 'react';
import type { Player } from '../../engine/backgammonEngine';
import { getSavedPipCountVisibility, PIP_VISIBILITY_CHANGE_EVENT } from '../board/PipCountBadge';

export interface HudScoreboardProps {
    matchLength: number;
    scoreX: number;
    scoreO: number;
    turn: Player;
    crawford?: boolean;
    dice: [number, number] | null;
    usedDice: [boolean, boolean] | boolean[];
    onRollDice?: () => void;
    prX?: number | null;
    prO?: number | null;
    isAiThinking?: boolean;
    pipX?: number | null;
    pipO?: number | null;
    epcX?: number | null;
    epcO?: number | null;
    isPureRace?: boolean;
    opponentLabel?: string;
    playerColor?: Player;
    cubeValue?: number;
    cubeOwner?: Player | null;
}

/** Libellé pédagogique du palier de PR (selon standard international XG/Snowie). */
export function getPRCategoryLabel(pr: number | null | undefined): string {
    if (pr === null || pr === undefined) return 'Non classé';
    if (pr <= 3.5) return 'Superhuman / Grand-Maître';
    if (pr <= 6.0) return 'Maître / Expert';
    if (pr <= 9.0) return 'Avancé';
    if (pr <= 13.0) return 'Intermédiaire';
    if (pr <= 18.0) return 'Amateur';
    return 'Débutant (En apprentissage)';
}

function prBadgeClass(pr: number | null | undefined): string {
    if (pr === null || pr === undefined) {
        return 'border-[#d4af37]/30 bg-[#140b06]/80 text-amber-200/60';
    }
    if (pr <= 3) {
        return 'border-emerald-400/70 bg-emerald-500/15 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.35)]';
    }
    if (pr <= 7) {
        return 'border-amber-400/70 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.35)]';
    }
    return 'border-rose-400/70 bg-rose-500/15 text-rose-300 shadow-[0_0_10px_rgba(251,113,133,0.35)]';
}

interface PlayerCardProps {
    isWhite: boolean;
    name: string;
    colorLabel: string;
    score: number;
    isTurn: boolean;
    pr?: number | null;
    pip?: number | null;
    epc?: number | null;
    isPureRace?: boolean;
    pipVisible?: boolean;
    testId: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
    isWhite,
    name,
    colorLabel,
    score,
    isTurn,
    pr,
    pip,
    epc,
    isPureRace,
    pipVisible = true,
    testId,
}) => {
    const pipTitle = isPureRace && typeof epc === 'number'
        ? `Pip count : ${pip} pips | EPC: ${epc}`
        : `${pip} pips`;
    const prCategory = getPRCategoryLabel(pr);

    return (
        <div
            data-testid={testId}
            title={`${name} (${colorLabel}) — Score : ${score}${isTurn ? ' — Au tour' : ''}`}
            className={`flex items-center gap-1 sm:gap-1.5 shrink-0 rounded-xl border px-1.5 sm:px-2.5 py-0.5 sm:py-1 transition-all ${
                isTurn
                    ? 'border-[#f3c65f] bg-gradient-to-b from-[#26160a] to-[#110904] ring-1 ring-[#f3c65f]/70 shadow-[0_0_16px_rgba(243,198,95,0.32)]'
                    : 'border-white/10 bg-[#0c0603]/85 ring-1 ring-transparent opacity-85 shadow-inner'
            }`}
        >
            <span
                aria-hidden="true"
                className={`h-3 w-3 sm:h-4 sm:w-4 shrink-0 rounded-full ${
                    isWhite
                        ? 'bg-[radial-gradient(circle_at_32%_28%,#fffdf7_0%,#e8dec8_48%,#b8a47e_100%)] ring-1 ring-white/25 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.4)]'
                        : 'bg-[radial-gradient(circle_at_32%_28%,#4a2518_0%,#241009_48%,#0a0402_100%)] ring-1 ring-white/20 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.85)]'
                }`}
            />
            <div className="flex flex-col leading-none min-w-0">
                <span className="font-serif text-[11px] sm:text-xs font-bold text-[#fdf8eb] whitespace-nowrap truncate max-w-[54px] sm:max-w-none">
                    {name}
                </span>
                {pip !== null && pip !== undefined && (
                    <span
                        data-testid={`${testId}-pip`}
                        className="font-mono text-[10px] sm:text-[11px] tabular-nums text-[#d4af37]/85 whitespace-nowrap cursor-help"
                        title={pipTitle}
                    >
                        {pipVisible ? pip : '•••'} <span className="hidden sm:inline">pips</span><span className="sm:hidden">p</span>
                    </span>
                )}
            </div>
            <span className="ml-0.5 shrink-0 rounded border border-white/10 bg-black/70 px-1 sm:px-1.5 py-0.5 font-mono text-[11px] sm:text-sm font-black tabular-nums text-[#f3c65f] shadow-inner">
                {score}
            </span>
            <span
                data-testid={`${testId}-pr`}
                title={`Performance Rating (PR) : ${pr !== null && pr !== undefined ? pr.toFixed(1) : '--'} — Niveau : ${prCategory} (plus bas = meilleur)`}
                className={`hidden sm:inline-block ml-0.5 shrink-0 whitespace-nowrap rounded border px-1 py-0.5 font-mono text-[11px] font-bold tabular-nums transition-shadow duration-300 ${prBadgeClass(pr)}`}
            >
                PR {pr !== null && pr !== undefined ? pr.toFixed(1) : '--'}
            </span>
        </div>
    );
};

const HudScoreboardComponent: React.FC<HudScoreboardProps> = ({
    matchLength,
    scoreX,
    scoreO,
    turn,
    crawford = false,
    prX,
    prO,
    isAiThinking = false,
    pipX,
    pipO,
    epcX,
    epcO,
    isPureRace = false,
    opponentLabel = 'IA',
    playerColor = 'X',
    cubeValue = 1,
    cubeOwner = null,
}) => {
    const isXTurn = turn === 'X';
    const isOTurn = turn === 'O' || isAiThinking;
    const humanIsWhite = playerColor === 'X';
    const nameX = 'Vous';
    const normalizedOpponent = opponentLabel.startsWith('IA') ? opponentLabel : `IA ${opponentLabel}`;
    const nameO = opponentLabel === 'IA' ? 'IA' : normalizedOpponent;
    const colorLabelX = humanIsWhite ? 'Blanc' : 'Noir';
    const colorLabelO = humanIsWhite ? 'Noir' : 'Blanc';
    const effectiveCube = Math.max(1, cubeValue);
    const cubeStakeLabel = effectiveCube > 1
        ? `Enjeu : ${effectiveCube} pt${effectiveCube > 1 ? 's' : ''} (Gammon: ${effectiveCube * 2})`
        : 'Partie simple (1 pt)';
    const cubeOwnershipTitle = cubeOwner === 'X'
        ? 'Videau possédé par Vous (Double possible)'
        : cubeOwner === 'O'
            ? 'Videau possédé par l’IA (Double interdit)'
            : 'Videau centré (Accessible aux deux joueurs)';

    const [pipVisible, setPipVisible] = useState<boolean>(true);
    useEffect(() => {
        setPipVisible(getSavedPipCountVisibility(true));
        const onSync = (e: Event) => {
            const detail = (e as CustomEvent<boolean>).detail;
            if (typeof detail === 'boolean') setPipVisible(detail);
        };
        window.addEventListener(PIP_VISIBILITY_CHANGE_EVENT, onSync);
        return () => window.removeEventListener(PIP_VISIBILITY_CHANGE_EVENT, onSync);
    }, []);

    return (
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 shrink-0">
            <div className="hidden lg:flex flex-col shrink-0 rounded-lg border border-white/10 bg-[#0d0703]/85 px-2 py-0.5 text-[11px] leading-tight text-amber-100/80 shadow-inner">
                <div className="flex items-center gap-1 whitespace-nowrap">
                    <span data-testid="hud-match-format" className="font-serif font-bold text-[#f5d78e] tabular-nums">
                        {matchLength > 0 ? `Match ${matchLength} pts` : 'Money Game'}
                    </span>
                    {effectiveCube > 1 && !crawford && (
                        <span
                            data-testid="hud-cube-badge"
                            className="rounded bg-amber-500/20 border border-white/10 px-1 text-[11px] font-black text-[#f3c65f] tabular-nums"
                            title={cubeOwnershipTitle}
                        >
                            Cube {effectiveCube}×{cubeOwner === 'X' ? ' (Vous)' : cubeOwner === 'O' ? ' (IA)' : ''}
                        </span>
                    )}
                </div>
                {crawford ? (
                    <span
                        data-testid="hud-crawford-badge"
                        className="mt-0.5 w-max rounded bg-amber-500/20 px-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/40 tabular-nums"
                    >
                        Crawford
                    </span>
                ) : (
                    <span
                        className="text-[11px] text-amber-200/75 whitespace-nowrap font-medium tabular-nums cursor-help"
                        title={cubeOwnershipTitle}
                    >
                        {cubeStakeLabel}
                    </span>
                )}
            </div>

            <PlayerCard
                isWhite={humanIsWhite}
                name={nameX}
                colorLabel={colorLabelX}
                score={scoreX}
                isTurn={isXTurn}
                pr={prX}
                pip={pipX}
                epc={epcX}
                isPureRace={isPureRace}
                pipVisible={pipVisible}
                testId="hud-player-x"
            />

            <span className="font-serif text-[11px] font-black tracking-widest text-[#d4af37]/80">
                VS
            </span>

            <PlayerCard
                isWhite={!humanIsWhite}
                name={nameO}
                colorLabel={colorLabelO}
                score={scoreO}
                isTurn={isOTurn}
                pr={prO}
                pip={pipO}
                epc={epcO}
                isPureRace={isPureRace}
                pipVisible={pipVisible}
                testId="hud-player-o"
            />
        </div>
    );
};

export const HudScoreboard = React.memo(HudScoreboardComponent);
export default HudScoreboard;
