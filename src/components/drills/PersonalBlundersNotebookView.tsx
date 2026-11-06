'use client';

/**
 * @file src/components/drills/PersonalBlundersNotebookView.tsx
 * @description Carnet de Blunders Personnels (Compte Connecté) : Plateau interactif et résolution en 2 phases (<= 275 lignes, 0 any, 0 emoji).
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Dices, ArrowRight, RotateCcw, Play } from 'lucide-react';
import Board from '../board/Board';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import { useTranslation } from '../../i18n';
import type { BoardState } from '../../engine/backgammonEngine';
import { parseCoachNotationMoves } from '../../features/coach/coachMoveNotation';
import { validateBoardState } from '../../features/drills/drillSubAgentsPipeline';
import {
    getPersonalBlunders, markPersonalBlunderAttempt, seedDemoPersonalBlunders,
    PERSONAL_BLUNDERS_UPDATED_EVENT, type PersonalBlunderRecord,
} from '../../lib/blunders/personalBlunderStore';
import {
    PersonalBlundersEmptyConnected, PersonalBlundersNotebookHeader,
} from './PersonalBlundersNotebookHeader';

export interface PersonalBlundersNotebookViewProps {
    readonly userId?: string;
    readonly onSwitchToGeneralQuizzes?: () => void;
}

function expandTokens(notation: string): string {
    return notation.replace(/\*/g, '').trim().split(/\s+/).flatMap((tok) => {
        const rep = tok.match(/^(.+)\((\d)\)$/);
        const base = rep ? rep[1]! : tok;
        const count = rep ? Number(rep[2]) : 1;
        const parts = base.split('/');
        const steps = parts.length > 2 ? parts.slice(0, -1).map((p, k) => `${p}/${parts[k + 1]}`) : [base];
        return Array.from({ length: count }, () => steps).flat();
    }).join(' ');
}

export const PersonalBlundersNotebookView: React.FC<PersonalBlundersNotebookViewProps> = ({
    userId = 'connected_member',
    onSwitchToGeneralQuizzes,
}) => {
    const router = useRouter();
    const { theme } = useBoardTheme();
    const { locale } = useTranslation();
    const isEn = locale === 'en';

    const [blunders, setBlunders] = useState<PersonalBlunderRecord[]>(() => getPersonalBlunders());
    const [statusFilter, setStatusFilter] = useState<'PENDING' | 'RESOLVED'>('PENDING');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [clickedNotation, setClickedNotation] = useState<string | null>(null);
    const [hoveredNotation, setHoveredNotation] = useState<string | null>(null);

    useEffect(() => {
        const sync = () => setBlunders(getPersonalBlunders());
        window.addEventListener(PERSONAL_BLUNDERS_UPDATED_EVENT, sync);
        return () => window.removeEventListener(PERSONAL_BLUNDERS_UPDATED_EVENT, sync);
    }, []);

    const pendingList = useMemo(() => blunders.filter((b) => b.status === 'PENDING'), [blunders]);
    const resolvedList = useMemo(() => blunders.filter((b) => b.status === 'RESOLVED'), [blunders]);
    const filteredList = statusFilter === 'PENDING' ? pendingList : resolvedList;

    const activeBlunder = useMemo(() => {
        if (selectedId) {
            const found = blunders.find((b) => b.id === selectedId);
            if (found) return found;
        }
        return filteredList[0] ?? blunders[0] ?? null;
    }, [blunders, filteredList, selectedId]);

    useEffect(() => {
        if (activeBlunder && activeBlunder.id !== selectedId) setSelectedId(activeBlunder.id);
        setClickedNotation(null); setHoveredNotation(null);
    }, [activeBlunder?.id]);

    const normalizedBoard = useMemo(
        () => (activeBlunder ? validateBoardState(activeBlunder.board, activeBlunder.player).normalizedBoard : new Array<number>(28).fill(0)),
        [activeBlunder],
    );

    const boardState: BoardState = useMemo(() => ({
        board: normalizedBoard,
        turn: activeBlunder?.player ?? 'X',
        cubeValue: activeBlunder?.cubeValue ?? 1,
        cubeOwner: activeBlunder?.cubeOwner ?? null,
        dice: activeBlunder ? [activeBlunder.dice[0], activeBlunder.dice[1]] : [5, 4],
        matchLength: activeBlunder?.matchLength ?? 5,
        scoreX: activeBlunder?.scoreBeforeMove.player ?? 0,
        scoreO: activeBlunder?.scoreBeforeMove.opponent ?? 0,
        crawford: activeBlunder?.isCrawford ?? false,
        doubled: false, resigned: 0,
    }), [normalizedBoard, activeBlunder]);

    const isSolvedNow = Boolean(activeBlunder && clickedNotation && clickedNotation.trim() === activeBlunder.optimalMove.trim());
    const isWrongNow = Boolean(activeBlunder && clickedNotation && !isSolvedNow);

    const coachHighlight = useMemo(() => {
        if (!activeBlunder) return null;
        if (hoveredNotation) return { played: [], optimal: parseCoachNotationMoves(expandTokens(hoveredNotation), activeBlunder.player) };
        if (clickedNotation) {
            const optMoves = parseCoachNotationMoves(expandTokens(activeBlunder.optimalMove), activeBlunder.player);
            const wrongMoves = isSolvedNow ? [] : parseCoachNotationMoves(expandTokens(clickedNotation), activeBlunder.player);
            return { played: wrongMoves, optimal: optMoves };
        }
        return null;
    }, [activeBlunder, hoveredNotation, clickedNotation, isSolvedNow]);

    const handleSelectChoice = useCallback((notation: string) => {
        if (!activeBlunder) return;
        setClickedNotation(notation); setHoveredNotation(null);
        markPersonalBlunderAttempt(activeBlunder.id, notation.trim() === activeBlunder.optimalMove.trim());
        setBlunders(getPersonalBlunders());
    }, [activeBlunder]);

    const handleNextPendingBlunder = useCallback(() => {
        const fresh = getPersonalBlunders();
        setBlunders(fresh);
        const nextPending = fresh.find((b) => b.status === 'PENDING' && b.id !== activeBlunder?.id) ?? fresh.find((b) => b.status === 'PENDING');
        if (nextPending) {
            setStatusFilter('PENDING'); setSelectedId(nextPending.id);
        } else {
            setStatusFilter('RESOLVED'); setSelectedId(fresh[0]?.id ?? null);
        }
        setClickedNotation(null); setHoveredNotation(null);
    }, [activeBlunder?.id]);

    const handleSeedDemo = useCallback(() => {
        const seeded = seedDemoPersonalBlunders(userId);
        setBlunders(seeded); setStatusFilter('PENDING'); setSelectedId(seeded[0]?.id ?? null); setClickedNotation(null);
    }, [userId]);

    if (blunders.length === 0) {
        return <PersonalBlundersEmptyConnected isEn={isEn} onSeedDemo={handleSeedDemo} />;
    }

    return (
        <div data-testid="personal-blunders-notebook-view" className="flex-1 min-h-0 h-full w-full flex flex-col gap-1.5 p-1.5 sm:p-2 bg-[#050505] text-[#fdf8eb] overflow-hidden">
            <PersonalBlundersNotebookHeader
                isEn={isEn} blunders={blunders} pendingCount={pendingList.length} resolvedCount={resolvedList.length}
                statusFilter={statusFilter} activeBlunder={activeBlunder}
                onChangeStatusFilter={(st) => {
                    setStatusFilter(st);
                    const target = st === 'PENDING' ? pendingList[0] : resolvedList[0];
                    setSelectedId(target?.id ?? activeBlunder?.id ?? null);
                }}
                onSelectBlunderId={setSelectedId} onSwitchToGeneralQuizzes={onSwitchToGeneralQuizzes}
            />

            {activeBlunder && (
                <div className="flex-1 min-h-0 w-full grid grid-cols-1 lg:grid-cols-12 gap-1.5 overflow-hidden">
                    <div className="lg:col-span-8 min-h-0 h-full flex items-center justify-center rounded-xl border border-white/10 bg-[#050505] p-0.5 overflow-hidden">
                        <Board
                            state={boardState} gamePhase="HUMAN_MOVING" leftDieTargets={new Map()} rightDieTargets={new Map()}
                            selectedPoint={null} selectedDie={null} usedDice={[false, false]}
                            onCheckerClick={() => {}} onCheckerRightClick={() => {}} onDestinationClick={() => {}}
                            onPlayMove={() => {}} onSelectDie={() => {}} onDiceClick={() => {}} onDeselect={() => {}}
                            onConfirm={() => {}} onUndo={() => setClickedNotation(null)} canConfirm={false}
                            canUndo={Boolean(clickedNotation)} coachHighlight={coachHighlight} theme={theme}
                        />
                    </div>

                    <div className="lg:col-span-4 min-h-0 h-full flex flex-col justify-between rounded-xl border border-white/10 bg-[#12151C] p-3 gap-2 overflow-y-auto">
                        <div className="space-y-2">
                            <div data-testid="personal-blunder-recall-prompt" className="rounded-xl border border-[#D4AF37]/30 bg-[#090B10] p-2.5 text-xs leading-relaxed text-zinc-200">
                                <div className="font-bold text-[#D4AF37] mb-1">
                                    {isEn ? `Memory from your match vs ${activeBlunder.opponentName} (Turn #${activeBlunder.turnNumber}):` : `Souvenir de ton match contre ${activeBlunder.opponentName} (Tour #${activeBlunder.turnNumber}) :`}
                                </div>
                                <p>
                                    {isEn
                                        ? `In this position, you made a mistake that cost you -${activeBlunder.winProbLossPct.toFixed(1)}% winning chances (${activeBlunder.deltaEmg.toFixed(3)} EMG). Can you find the best move today?`
                                        : `Dans cette position, tu as commis une erreur qui t'a coûté -${activeBlunder.winProbLossPct.toFixed(1)}% de chances de victoire (${activeBlunder.deltaEmg.toFixed(3)} EMG). Sauras-tu trouver le meilleur coup aujourd'hui ?`}
                                </p>
                            </div>

                            <div className="flex items-center justify-between text-xs font-bold text-zinc-300 px-0.5">
                                <span>{isEn ? 'Select the optimal 3-ply move:' : 'Cliquez sur le meilleur coup 3-ply :'}</span>
                                <span className="inline-flex items-center gap-1 font-mono text-xs text-[#D4AF37]">
                                    <Dices className="w-3.5 h-3.5 text-[#D4AF37]" />
                                    <span>{activeBlunder.dice[0]}-{activeBlunder.dice[1]} (Case 24 ➔ 1)</span>
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5" data-testid="personal-blunder-choices-grid">
                                {activeBlunder.candidatesTop4.map((cand, idx) => {
                                    const letter = String.fromCharCode(65 + idx);
                                    const isClicked = clickedNotation === cand.notation;
                                    const showOptimalStyle = clickedNotation !== null && cand.isOptimalMove;
                                    const showWrongStyle = isClicked && !cand.isOptimalMove;
                                    return (
                                        <button
                                            key={cand.notation} type="button" data-testid={`quiz-choice-btn-${letter}`}
                                            onMouseEnter={() => setHoveredNotation(cand.notation)} onMouseLeave={() => setHoveredNotation(null)}
                                            onClick={() => handleSelectChoice(cand.notation)}
                                            className={`flex items-center justify-between gap-1.5 rounded-xl border px-2.5 py-2 font-mono text-xs font-extrabold transition ${
                                                showOptimalStyle
                                                    ? 'border-emerald-400 bg-emerald-950/80 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                                                    : showWrongStyle ? 'border-rose-400 bg-rose-950/80 text-rose-200' : 'border-white/15 bg-[#090B10] text-white hover:border-[#D4AF37] hover:text-[#D4AF37]'
                                            }`}
                                        >
                                            <span className="rounded bg-[#D4AF37]/20 px-1.5 py-0.5 text-xs font-black text-[#D4AF37]">{letter}</span>
                                            <span className="truncate">{cand.notation}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {clickedNotation && (
                            <div className="space-y-2 pt-1 border-t border-white/10" data-testid="personal-blunder-comparative-panel">
                                {isWrongNow && (
                                    <div data-testid="personal-blunder-wrong-alert" className="rounded-xl border border-amber-400/50 bg-amber-950/70 p-2 text-xs text-amber-100">
                                        <span className="font-bold text-amber-300">
                                            {clickedNotation.trim() === activeBlunder.playerPlayedMove.trim()
                                                ? isEn
                                                    ? `Watch out: ${activeBlunder.playerPlayedMove} is the exact mistake you played in your match against ${activeBlunder.opponentName}! `
                                                    : `Attention, c'est exactement l'erreur (${activeBlunder.playerPlayedMove}) que tu avais commise pendant ton match contre ${activeBlunder.opponentName} ! `
                                                : isEn
                                                ? `Not quite: ${clickedNotation} is still suboptimal. Click the Gold optimal move (${activeBlunder.optimalMove}) to validate! `
                                                : `Ce coup (${clickedNotation}) reste sous-optimal. Clique sur le coup optimal (${activeBlunder.optimalMove}) pour valider ta correction ! `}
                                        </span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div data-testid="comparative-played-move-card" className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-2.5 text-xs space-y-1">
                                        <div className="flex items-center justify-between font-mono text-xs font-black text-rose-300">
                                            <span>{isEn ? `❌ Your Match Move: ${activeBlunder.playerPlayedMove}` : `❌ Ton Coup en Match : ${activeBlunder.playerPlayedMove}`}</span>
                                            <span>{activeBlunder.playerWinProbPct.toFixed(1)}% {isEn ? 'win' : 'victoire'} ({activeBlunder.deltaEmg.toFixed(3)} EMG)</span>
                                        </div>
                                        <p className="text-rose-100 leading-snug">
                                            <strong className="text-rose-300">{isEn ? 'Why it was a mistake: ' : 'Pourquoi c’était une erreur : '}</strong>
                                            {isEn ? activeBlunder.mistakeExplanationEn : activeBlunder.mistakeExplanationFr}
                                        </p>
                                    </div>

                                    <div data-testid="comparative-optimal-move-card" className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-2.5 text-xs space-y-1">
                                        <div className="flex items-center justify-between font-mono text-xs font-black text-emerald-300">
                                            <span>{isEn ? `✅ 3-Ply Solution: ${activeBlunder.optimalMove}` : `✅ La Solution 3-Ply : ${activeBlunder.optimalMove}`}</span>
                                            <span>{activeBlunder.optimalWinProbPct.toFixed(1)}% {isEn ? 'win' : 'victoire'} (0.000 EMG)</span>
                                        </div>
                                        <p className="text-emerald-100 leading-snug">
                                            <strong className="text-emerald-300">{isEn ? 'Why this move wins: ' : 'Pourquoi ce coup gagne : '}</strong>
                                            {isEn ? activeBlunder.solutionExplanationEn : activeBlunder.solutionExplanationFr}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 pt-1">
                                    <button
                                        type="button" data-testid="next-personal-blunder-btn" onClick={handleNextPendingBlunder}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E5C158] via-[#D4AF37] to-[#B5902B] px-3 py-2 text-xs font-black uppercase tracking-wider text-black shadow-md hover:brightness-105 transition"
                                    >
                                        <span>{isEn ? 'NEXT PENDING BLUNDER TO FIX' : 'PASSER AU BLUNDER SUIVANT À CORRIGER'}</span>
                                        <ArrowRight className="w-4 h-4 text-black" />
                                    </button>
                                    <div className="flex items-center gap-1.5">
                                        <button type="button" onClick={() => setClickedNotation(null)} className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-[#090B10] px-2.5 py-1.5 text-xs font-bold text-zinc-300 hover:text-white transition">
                                            <RotateCcw className="w-3 h-3" /><span>{isEn ? 'Replay Quiz' : 'Rejouer le Quiz'}</span>
                                        </button>
                                        <button type="button" onClick={() => router.push(`/?xgid=${encodeURIComponent(activeBlunder.xgid)}`)} className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-[#090B10] px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:border-emerald-400/50 transition">
                                            <Play className="w-3 h-3" /><span>{isEn ? 'Play vs Coach' : 'Jouer contre le Coach'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonalBlundersNotebookView;
