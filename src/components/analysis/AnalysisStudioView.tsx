'use client';

/**
 * @file src/components/analysis/AnalysisStudioView.tsx
 * @description Orchestrateur du Studio d'Analyse — Laboratoire Interactif du Joueur.
 * Strictement <= 285 lignes, 0 any.
 */

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { serializeCanonicalXGID, parseXGID, type BoardState } from '../../engine/backgammonEngine';
import Board from '../board/Board';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import { evaluateWithBgsage } from '../../lib/engine/bgsageClient';
import { parseCoachNotationMoves } from '../../features/coach/coachMoveNotation';
import { BotPortraitMedallion } from '../common/MonteCarloIcons';
import {
    clearBoardToTrays,
    getInitialStartingBoard,
    countCheckers,
    autoCompleteRemainingToOff,
    visionResultToBoard26,
    computeLegalCandidateMovesTop5,
    applyBrushToPoint,
    FAMOUS_PRESET_POSITIONS,
    type TrayCount,
    type ScannedBoardVisionResult,
    type CandidateMoveAnalysisRow,
} from '../../lib/analysis/analysisStudioEngine';
import ManualBoardSetupStage, { type BrushTool } from './ManualBoardSetupStage';
import PhotoBoardScannerModal from './PhotoBoardScannerModal';
import AnalysisControlPanel from './AnalysisControlPanel';

export function AnalysisStudioView() {
    const router = useRouter();
    const { theme } = useBoardTheme();

    const [board, setBoard] = useState<number[]>(() => getInitialStartingBoard().board);
    const [tray, setTray] = useState<TrayCount>(() => getInitialStartingBoard().tray);
    const [activeBrush, setActiveBrush] = useState<BrushTool>('white');
    const [dice, setDice] = useState<[number, number]>([3, 1]);
    const [matchLength, setMatchLength] = useState<number>(7);
    const [isCrawford, setIsCrawford] = useState<boolean>(false);
    const [selectedMoveNotation, setSelectedMoveNotation] = useState<string | null>('8/5 6/5');
    const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const stats = useMemo(() => countCheckers(board, tray), [board, tray]);

    const boardState: BoardState = useMemo(() => ({
        board,
        turn: 'X',
        cubeValue: 1,
        cubeOwner: null,
        dice,
        matchLength,
        scoreX: 0,
        scoreO: 0,
        crawford: isCrawford,
        doubled: false,
        resigned: 0,
    }), [board, dice, matchLength, isCrawford]);

    const xgidString = useMemo(() => {
        try {
            return serializeCanonicalXGID({ ...boardState, board: autoCompleteRemainingToOff(board) });
        } catch {
            return '';
        }
    }, [boardState, board]);

    const candidates = useMemo<CandidateMoveAnalysisRow[]>(() => {
        return computeLegalCandidateMovesTop5(boardState, dice);
    }, [boardState, dice]);

    const coachHighlight = useMemo(() => {
        if (!selectedMoveNotation) return null;
        try {
            return { played: [], optimal: parseCoachNotationMoves(selectedMoveNotation, 'X') };
        } catch {
            return null;
        }
    }, [selectedMoveNotation]);

    const handleCheckerClick = useCallback((point: number) => {
        const next = applyBrushToPoint(board, tray, point, activeBrush);
        setBoard(next.board);
        setTray(next.tray);
    }, [board, tray, activeBrush]);

    const handleCheckerRightClick = useCallback((point: number) => {
        const next = applyBrushToPoint(board, tray, point, 'remove');
        setBoard(next.board);
        setTray(next.tray);
    }, [board, tray]);

    const handleClearBoard = () => {
        const cleared = clearBoardToTrays();
        setBoard(cleared.board);
        setTray(cleared.tray);
        setSelectedMoveNotation(null);
    };

    const handleResetStartingBoard = () => {
        const initial = getInitialStartingBoard();
        setBoard(initial.board);
        setTray(initial.tray);
        setSelectedMoveNotation('8/5 6/5');
    };

    const handleCompleteRemainingToOff = () => {
        setBoard((prev) => autoCompleteRemainingToOff(prev));
        setTray({ white: 0, black: 0 });
    };

    const handleInvertColors = () => {
        setBoard((prev) => prev.map((v) => -v));
        setTray((t) => ({ white: t.black, black: t.white }));
    };

    const handleScanComplete = (result: ScannedBoardVisionResult) => {
        const newBoard = visionResultToBoard26(result);
        setBoard(newBoard);
        setTray({ white: 0, black: 0 });
        setDice(result.dice);
        const top5 = computeLegalCandidateMovesTop5({ ...boardState, board: newBoard, dice: result.dice }, result.dice);
        if (top5[0]) setSelectedMoveNotation(top5[0].notation);
    };

    const handleRunAnalysis = async () => {
        handleCompleteRemainingToOff();
        setLoading(true);
        setErrorMessage(null);
        try {
            const data = await evaluateWithBgsage(xgidString, 3, 10000);
            const bgsageBest = data?.chequerPlay?.[0]?.notation;
            if (bgsageBest) setSelectedMoveNotation(bgsageBest);
            else if (candidates[0]) setSelectedMoveNotation(candidates[0].notation);
        } catch {
            if (candidates[0]) setSelectedMoveNotation(candidates[0].notation);
        } finally {
            setLoading(false);
        }
    };

    const handlePlayPositionFromHere = () => {
        const validBoard = autoCompleteRemainingToOff(board);
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('bgtour_custom_analysis_position', JSON.stringify({
                board: validBoard,
                dice,
                matchLength,
                turn: 'X',
            }));
            router.push('/play?from=analysis');
        }
    };

    const handleImportXgid = (xgid: string) => {
        try {
            const parsed = parseXGID(xgid.trim());
            setBoard(parsed.board);
            setTray({ white: 0, black: 0 });
            if (parsed.dice && parsed.dice[0] > 0 && parsed.dice[1] > 0) setDice([parsed.dice[0], parsed.dice[1]]);
            if (parsed.matchLength) setMatchLength(parsed.matchLength);
        } catch {
            setErrorMessage('Code XGID invalide.');
        }
    };

    const emptyTargets = useMemo(() => new Map<number, number[]>(), []);
    const noop = useCallback(() => {}, []);

    return (
        <div className="flex h-dvh max-h-dvh w-full max-w-[1920px] mx-auto flex-col p-1.5 sm:p-2 text-[#fdf8eb] bg-[#050505] overflow-hidden" data-testid="analysis-studio-root">
            {/* Barre Supérieure */}
            <header className="flex flex-wrap items-center justify-between border-b border-[#D4AF37]/30 pb-1.5 mb-1.5 shrink-0 gap-2">
                <div className="flex items-center gap-2.5">
                    <Link href="/" data-testid="studio-back-btn" className="inline-flex items-center gap-1 rounded-lg border border-[#D4AF37]/50 bg-[#12151C] px-2 py-0.5 text-xs font-bold text-[#D4AF37] hover:border-[#D4AF37] hover:text-white transition">
                        ← Retour Salon
                    </Link>
                    <div className="flex items-center gap-2">
                        <BotPortraitMedallion character="grandmaster" size="sm" isActive={true} />
                        <h1 className="font-display text-xs sm:text-sm font-black tracking-wide text-white">
                            Studio d&apos;Analyse 3-Ply &amp; Scanner Vision IA
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-stone-400 font-semibold hidden md:inline">Classiques :</span>
                    {FAMOUS_PRESET_POSITIONS.map((p) => (
                        <button
                            key={p.name}
                            type="button"
                            onClick={() => {
                                handleImportXgid(p.xgid);
                                setDice(p.dice);
                                if (p.name.includes('3-1')) setSelectedMoveNotation('8/5 6/5');
                            }}
                            className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-stone-300 hover:border-[#D4AF37] hover:text-white transition"
                        >
                            {p.name.split(' (')[0]}
                        </button>
                    ))}
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-950/70 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                        Open Sage • 3-Ply
                    </span>
                </div>
            </header>

            {/* Corps Principal */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2 overflow-hidden">
                <div className="lg:col-span-7 flex flex-col justify-between bg-[#0B1015] border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden min-h-0">
                    <ManualBoardSetupStage
                        tray={tray}
                        stats={stats}
                        activeBrush={activeBrush}
                        onSelectBrush={setActiveBrush}
                        onClearBoard={handleClearBoard}
                        onResetStartingBoard={handleResetStartingBoard}
                        onCompleteRemainingToOff={handleCompleteRemainingToOff}
                        onInvertColors={handleInvertColors}
                        onOpenScannerModal={() => setIsScannerOpen(true)}
                    />

                    <div className="w-full flex-1 min-h-0 flex items-center justify-center py-1">
                        <Board
                            state={boardState}
                            gamePhase="REPLAY_VIEW"
                            theme={theme}
                            coachHighlight={coachHighlight}
                            leftDieTargets={emptyTargets}
                            rightDieTargets={emptyTargets}
                            selectedPoint={null}
                            selectedDie={null}
                            usedDice={[false, false]}
                            onCheckerClick={handleCheckerClick}
                            onCheckerRightClick={handleCheckerRightClick}
                            onDestinationClick={noop}
                        />
                    </div>

                    {selectedMoveNotation && (
                        <div className="text-center text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 shrink-0">
                            Coup sélectionné : <strong>{selectedMoveNotation}</strong> (Flèches actives sur le plateau)
                        </div>
                    )}
                </div>

                <div className="lg:col-span-5 bg-[#12151C] border border-white/10 rounded-2xl p-2.5 shadow-2xl overflow-hidden flex flex-col min-h-0">
                    <AnalysisControlPanel
                        dice={dice}
                        onChangeDice={(d) => {
                            setDice(d);
                            const top = computeLegalCandidateMovesTop5(boardState, d);
                            if (top[0]) setSelectedMoveNotation(top[0].notation);
                        }}
                        matchLength={matchLength}
                        onChangeMatchLength={setMatchLength}
                        isCrawford={isCrawford}
                        onChangeCrawford={setIsCrawford}
                        onRunAnalysis={handleRunAnalysis}
                        loading={loading}
                        errorMessage={errorMessage}
                        candidates={candidates}
                        selectedNotation={selectedMoveNotation}
                        onSelectMoveNotation={setSelectedMoveNotation}
                        xgidString={xgidString}
                        onImportXgid={handleImportXgid}
                        onPlayPositionFromHere={handlePlayPositionFromHere}
                        cubeRecommendation={boardState.cubeValue > 1 ? 'Double / Take' : 'No Double'}
                    />
                </div>
            </div>

            <PhotoBoardScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanComplete={handleScanComplete}
            />
        </div>
    );
}

export default AnalysisStudioView;
