'use client';

/**
 * Cartes joueurs du HUD supérieur — Guichets Horlogers Encastrés dans la Boiserie (< 250 lignes, 0 any).
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { Player } from '../../engine/backgammonEngine';
import { getSavedPipCountVisibility, PIP_VISIBILITY_CHANGE_EVENT, setSavedPipCountVisibility } from '../board/PipCountBadge';
import { formatChameleonPipDisplay, formatNAwayScore, type ChameleonLayer } from '../../features/chameleon/chameleonProfile';
import { useAuthenticPlayerStats } from '../../hooks/useAuthenticPlayerStats';
import { useTranslation } from '../../i18n';

export interface HudScoreboardProps {
    matchLength: number; scoreX: number; scoreO: number; turn: Player; crawford?: boolean;
    dice: [number, number] | null; usedDice: [boolean, boolean] | boolean[]; onRollDice?: () => void;
    prX?: number | null; prO?: number | null; isAiThinking?: boolean; pipX?: number | null; pipO?: number | null;
    borneOffX?: number; borneOffO?: number; epcX?: number | null; epcO?: number | null; isPureRace?: boolean;
    opponentLabel?: string; playerColor?: Player; cubeValue?: number; cubeOwner?: Player | null;
    /** Strate Caméléon optionnelle (0: Débutant sans pips, 1: Différentiel Course ±, 2: Pro exact + n-away). */
    chameleonLayer?: ChameleonLayer; isGuest?: boolean;
}

/** Libellé pédagogique du palier de PR (selon standard international XG/Snowie). */
export function getPRCategoryLabel(pr: number | null | undefined, isEn: boolean = false): string {
    if (pr === null || pr === undefined) return isEn ? 'Unranked' : 'Non classé';
    if (pr <= 3.5) return isEn ? 'Superhuman / Grandmaster' : 'Superhuman / Grand-Maître';
    if (pr <= 6.0) return isEn ? 'Master / Expert' : 'Maître / Expert';
    if (pr <= 9.0) return isEn ? 'Advanced' : 'Avancé';
    if (pr <= 13.0) return isEn ? 'Intermediate' : 'Intermédiaire';
    if (pr <= 18.0) return isEn ? 'Casual' : 'Amateur';
    return isEn ? 'Beginner (Learning)' : 'Débutant (En apprentissage)';
}

function prBadgeClass(pr: number | null | undefined): string {
    if (pr === null || pr === undefined) return 'border-white/10 bg-slate-900/80 text-slate-400';
    if (pr <= 3) return 'border-emerald-400/70 bg-emerald-500/15 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.35)]';
    if (pr <= 7) return 'border-amber-400/70 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.35)]';
    return 'border-rose-400/70 bg-rose-500/15 text-rose-300 shadow-[0_0_10px_rgba(251,113,133,0.35)]';
}

interface PlayerCardProps {
    isWhite: boolean; name: string; mobileName?: string; colorLabel: string; score: number; isTurn: boolean;
    pr?: number | null; pip?: number | null; borneOff?: number; opponentPip?: number | null; epc?: number | null;
    isPureRace?: boolean; pipVisible?: boolean; onTogglePipVisible?: () => void;
    awayScoreLabel?: string | null; onToggleAwayMode?: () => void; chameleonLayer?: ChameleonLayer; testId: string;
    isGuestLocked?: boolean; isEn?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
    isWhite, name, mobileName, colorLabel, score, isTurn,
    pr, pip, borneOff = 0, opponentPip, epc, isPureRace, pipVisible = true, onTogglePipVisible, awayScoreLabel = null, onToggleAwayMode, chameleonLayer, testId, isGuestLocked = false, isEn = false,
}) => {
    const [forceRevealPip, setForceRevealPip] = useState(false);
    const rawPipTitle = isPureRace && typeof epc === 'number'
        ? `Pip count : ${pip} pips | EPC: ${epc}`
        : `${pip} pips`;
    const pipTitle = pipVisible ? rawPipTitle : (isEn ? 'Live Tournament Mode: Pip count hidden (click to show)' : 'Mode Tournoi Live : Pip count masqué (cliquer pour afficher)');
    const prCategory = getPRCategoryLabel(pr, isEn);
    const chameleonPipText =
        chameleonLayer !== undefined
            ? formatChameleonPipDisplay(pip, opponentPip, chameleonLayer, forceRevealPip)
            : null;
    const showPipLine = pip !== null && pip !== undefined && (chameleonLayer === undefined || chameleonPipText !== null);
    const handlePipClick = () => {
        if (chameleonLayer === 0) setForceRevealPip((v) => !v);
        onTogglePipVisible?.();
    };

    return (
        <div
            data-testid={testId}
            title={`${name} (${colorLabel}) — Score : ${score}${isTurn ? ' — Au tour' : ''}`}
            className={`flex items-center gap-1 sm:gap-1.5 min-w-0 shrink rounded-xl border px-1 sm:px-2.5 py-0.5 sm:py-1 transition-all ${
                isTurn
                    ? 'border-[#f3c65f] bg-slate-900 ring-1 ring-[#f3c65f]/70 shadow-[0_0_14px_rgba(243,198,95,0.22)]'
                    : 'border-white/10 bg-slate-950/85 ring-1 ring-transparent opacity-85 shadow-inner'
            }`}
        >
            <button
                type="button"
                data-testid={`${testId}-avatar-pip-toggle`}
                onClick={handlePipClick}
                aria-label={`Afficher ou masquer la course de ${name}`}
                className={`h-3 w-3 sm:h-4 sm:w-4 shrink-0 rounded-full focus:outline-none ${
                    isWhite
                        ? 'bg-[radial-gradient(circle_at_32%_28%,#fffdf7_0%,#e8dec8_48%,#b8a47e_100%)] ring-1 ring-white/25 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.4)]'
                        : 'bg-[radial-gradient(circle_at_32%_28%,#334155_0%,#0f172a_55%,#020617_100%)] ring-1 ring-white/25 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.85)]'
                }`}
            />
            <div className="flex flex-col leading-none min-w-0">
                <span className="font-sans text-[11px] sm:text-xs font-bold text-white whitespace-nowrap">
                    {mobileName ? (
                        <>
                            <span className="sm:hidden">{mobileName}</span>
                            <span className="hidden sm:inline">{name}</span>
                        </>
                    ) : (
                        name
                    )}
                </span>
                {showPipLine && (
                    <span
                        data-testid={`${testId}-pip`}
                        role="button"
                        tabIndex={0}
                        onClick={handlePipClick}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePipClick(); } }}
                        className="font-mono text-[10px] sm:text-[11px] tabular-nums text-slate-300 whitespace-nowrap cursor-pointer hover:text-amber-300 transition-colors"
                        title={pipTitle}
                    >
                        {!pipVisible ? (
                            <>••• <span className="hidden sm:inline">pips</span><span className="sm:hidden">p</span></>
                        ) : chameleonPipText !== null ? (
                            chameleonPipText
                        ) : (
                            <>
                                {pip} <span className="hidden sm:inline">pips</span><span className="sm:hidden">p</span>
                            </>
                        )}
                        {borneOff > 0 && (
                            <span
                                data-testid={`${testId}-borne-off`}
                                title={`Pions sortis : ${borneOff}/15`}
                                className="ml-1 text-emerald-300 font-bold"
                            >
                                · {borneOff}/15
                            </span>
                        )}
                    </span>
                )}
            </div>
            <span
                data-testid={`${testId}-score`}
                role={onToggleAwayMode ? 'button' : undefined}
                tabIndex={onToggleAwayMode ? 0 : undefined}
                title={onToggleAwayMode ? 'Cliquer ou clic droit pour basculer entre Score classique et X-away (XG2)' : undefined}
                onClick={onToggleAwayMode}
                onContextMenu={onToggleAwayMode ? (e) => { e.preventDefault(); onToggleAwayMode(); } : undefined}
                className="ml-0.5 shrink-0 rounded border border-white/10 bg-black/70 px-1 sm:px-1.5 py-0.5 font-mono text-[11px] sm:text-sm font-black tabular-nums text-[#f3c65f] shadow-inner cursor-pointer hover:border-amber-400/50 transition"
            >
                {awayScoreLabel ?? score}
            </span>
            {chameleonLayer !== 0 && !isGuestLocked && pr !== null && pr !== undefined && (
                <span data-testid={`${testId}-pr`} title={`Performance Rating (PR) : ${pr.toFixed(2)} — Niveau : ${prCategory} (plus bas = meilleur)`} className={`hidden sm:inline-flex ml-1 shrink-0 whitespace-nowrap rounded border px-1.5 py-0.5 font-mono text-[11px] font-black tabular-nums transition-shadow duration-300 ${prBadgeClass(pr)}`}>
                    PR {pr.toFixed(2)}
                </span>
            )}
        </div>
    );
};

const HudScoreboardComponent: React.FC<HudScoreboardProps> = ({
    matchLength, scoreX, scoreO, turn, crawford = false, prX, prO, isAiThinking = false,
    pipX, pipO, borneOffX = 0, borneOffO = 0, epcX, epcO, isPureRace = false, opponentLabel = 'IA',
    playerColor = 'X', cubeValue = 1, cubeOwner = null, chameleonLayer, isGuest: propIsGuest,
}) => {
    const stats = useAuthenticPlayerStats();
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const isGuest = propIsGuest ?? (!stats.canHavePR && prX === null);
    const isXTurn = turn === 'X';
    const isOTurn = turn === 'O' || isAiThinking;
    const humanIsWhite = playerColor === 'X';
    const nameX = isEn ? 'You' : 'Vous';
    const nameO = opponentLabel || (isEn ? 'AI' : 'IA');
    const colorLabelX = humanIsWhite ? (isEn ? 'White' : 'Blanc') : (isEn ? 'Black' : 'Noir');
    const colorLabelO = humanIsWhite ? (isEn ? 'Black' : 'Noir') : (isEn ? 'White' : 'Blanc');
    const isDMP = matchLength > 0 && scoreX === matchLength - 1 && scoreO === matchLength - 1;
    const effectiveCube = Math.max(1, cubeValue);
    const cubeStakeLabel = effectiveCube > 1
        ? (isEn ? `Stake: ${effectiveCube} pt${effectiveCube > 1 ? 's' : ''} (Gammon: ${effectiveCube * 2})` : `Enjeu : ${effectiveCube} pt${effectiveCube > 1 ? 's' : ''} (Gammon: ${effectiveCube * 2})`)
        : (isEn ? 'Single game (1 pt)' : 'Partie simple (1 pt)');
    const cubeOwnershipTitle = cubeOwner === 'X'
        ? (isEn ? 'Cube owned by You (Double allowed)' : 'Videau possédé par Vous (Double possible)')
        : cubeOwner === 'O'
            ? (isEn ? 'Cube owned by AI (Double forbidden)' : 'Videau possédé par l’IA (Double interdit)')
            : (isEn ? 'Centered cube (Available to both)' : 'Videau centré (Accessible aux deux joueurs)');

    const [pipVisible, setPipVisible] = useState<boolean>(true);
    const [awayMode, setAwayMode] = useState<boolean>(false);
    const showAway = (chameleonLayer === 2 || awayMode) && matchLength > 0;
    const handleToggleAwayMode = useCallback(() => {
        if (matchLength > 0) setAwayMode((v) => !v);
    }, [matchLength]);
    useEffect(() => {
        setPipVisible(getSavedPipCountVisibility(true));
        const onSync = (e: Event) => {
            const detail = (e as CustomEvent<boolean>).detail;
            if (typeof detail === 'boolean') setPipVisible(detail);
        };
        window.addEventListener(PIP_VISIBILITY_CHANGE_EVENT, onSync);
        return () => window.removeEventListener(PIP_VISIBILITY_CHANGE_EVENT, onSync);
    }, []);

    const handleTogglePipVisible = useCallback(() => {
        setPipVisible((prev) => {
            const next = !prev;
            setSavedPipCountVisibility(next);
            return next;
        });
    }, []);

    return (
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 shrink overflow-hidden">
            <div className="flex flex-col shrink-0 rounded-lg border border-white/10 bg-slate-900/90 px-2 py-0.5 text-[11px] leading-tight text-slate-300 shadow-inner">
                <div className="flex items-center gap-1 whitespace-nowrap">
                    <span
                        data-testid="hud-match-format"
                        role={matchLength > 0 ? 'button' : undefined}
                        tabIndex={matchLength > 0 ? 0 : undefined}
                        title={matchLength > 0 ? (isEn ? 'Click or right-click to toggle Away Score (XG2)' : 'Cliquer ou clic droit pour basculer le format Away Score (XG2)') : undefined}
                        onClick={handleToggleAwayMode}
                        onContextMenu={(e) => { if (matchLength > 0) { e.preventDefault(); handleToggleAwayMode(); } }}
                        className="font-sans font-bold text-amber-300 tabular-nums cursor-pointer hover:text-amber-200 transition"
                    >
                        {showAway
                            ? formatNAwayScore(scoreX, scoreO, matchLength, crawford)
                            : matchLength > 0
                              ? `Match ${matchLength} pts`
                              : 'Money Game'}
                    </span>
                    {effectiveCube > 1 && !crawford && (
                        <span
                            data-testid="hud-cube-badge"
                            className="rounded bg-amber-500/20 border border-white/10 px-1 text-[11px] font-black text-amber-300 tabular-nums"
                            title={cubeOwnershipTitle}
                        >
                            Cube {effectiveCube}×{cubeOwner === 'X' ? (isEn ? ' (You)' : ' (Vous)') : cubeOwner === 'O' ? (isEn ? ' (AI)' : ' (IA)') : ''}
                        </span>
                    )}
                    {crawford && (
                        <span
                            data-testid="hud-crawford-badge"
                            className="rounded bg-amber-500/20 border border-amber-500/40 px-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 tabular-nums"
                        >
                            Crawford
                        </span>
                    )}
                    {isDMP && (
                        <span
                            data-testid="hud-dmp-badge"
                            className="rounded bg-amber-500/20 border border-amber-500/40 px-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 tabular-nums"
                        >
                            DMP
                        </span>
                    )}
                </div>
                <span
                    className="text-[11px] text-slate-400 whitespace-nowrap font-medium tabular-nums cursor-help"
                    title={cubeOwnershipTitle}
                >
                    {crawford ? (isEn ? 'Crawford Rule' : 'Règle Crawford') : isDMP ? 'Double Match Point' : cubeStakeLabel}
                </span>
            </div>

            <PlayerCard
                isWhite={humanIsWhite} name={nameX} colorLabel={colorLabelX} score={scoreX}
                isTurn={isXTurn} pr={isGuest ? null : prX} pip={pipX} borneOff={borneOffX} opponentPip={pipO} epc={epcX}
                isPureRace={isPureRace} pipVisible={pipVisible} onTogglePipVisible={handleTogglePipVisible}
                awayScoreLabel={awayMode && matchLength > 0 ? `${Math.max(0, matchLength - scoreX)}a` : null}
                onToggleAwayMode={matchLength > 0 ? handleToggleAwayMode : undefined}
                chameleonLayer={chameleonLayer} testId="hud-player-x" isGuestLocked={isGuest} isEn={isEn}
            />

            <span className="font-mono text-[11px] font-black tracking-widest text-slate-400">
                {effectiveCube > 1 && !crawford ? `${effectiveCube}×` : 'VS'}
            </span>

            <PlayerCard
                isWhite={!humanIsWhite} name={nameO} mobileName={isEn ? 'AI' : 'IA'} colorLabel={colorLabelO} score={scoreO}
                isTurn={isOTurn} pr={isGuest ? null : prO} pip={pipO} borneOff={borneOffO} opponentPip={pipX} epc={epcO}
                isPureRace={isPureRace} pipVisible={pipVisible} onTogglePipVisible={handleTogglePipVisible}
                awayScoreLabel={awayMode && matchLength > 0 ? `${Math.max(0, matchLength - scoreO)}a` : null}
                onToggleAwayMode={matchLength > 0 ? handleToggleAwayMode : undefined}
                chameleonLayer={chameleonLayer} testId="hud-player-o" isGuestLocked={isGuest} isEn={isEn}
            />
        </div>
    );
};

export const HudScoreboard = React.memo(HudScoreboardComponent);
export default HudScoreboard;
