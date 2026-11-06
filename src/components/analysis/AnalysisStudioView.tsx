'use client';

/**
 * @file src/components/analysis/AnalysisStudioView.tsx
 * @description Orchestrateur du Studio d'Analyse — Parcours guidé en 3 étapes avec AppNavbar + LobbyLeftSidebar.
 * Strictement <= 265 lignes, 0 any, 0 emoji, Zéro-Scroll Desktop 1440x900.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { serializeCanonicalXGID, parseXGID, type BoardState } from '../../engine/backgammonEngine';
import Board from '../board/Board';
import AppNavbar from '../nav/AppNavbar';
import { LobbyLeftSidebar } from '../lobby/LobbySidebarAndWidgets';
import { useTranslation } from '../../i18n';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import { evaluateWithBgsage, type BgsageEvaluateResponse } from '../../lib/engine/bgsageClient';
import { parseCoachNotationMoves } from '../../features/coach/coachMoveNotation';
import {
    clearBoardToTrays, getInitialStartingBoard, countCheckers, autoCompleteRemainingToOff,
    visionResultToBoard26, computeLegalCandidateMovesTop5, computeVerifiedBoardFacts,
    applyBrushToPoint,
    type TrayCount, type ScannedBoardVisionResult, type CandidateMoveAnalysisRow,
} from '../../lib/analysis/analysisStudioEngine';
import ManualBoardSetupStage, { type BrushTool } from './ManualBoardSetupStage';
import PhotoBoardScannerModal from './PhotoBoardScannerModal';
import AnalysisControlPanel from './AnalysisControlPanel';

export function AnalysisStudioView() {
    const router = useRouter();
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const { theme } = useBoardTheme();

    const [board, setBoard] = useState<number[]>(() => getInitialStartingBoard().board);
    const [tray, setTray] = useState<TrayCount>(() => getInitialStartingBoard().tray);
    const [activeBrush, setActiveBrush] = useState<BrushTool>('white');
    const [dice, setDice] = useState<[number, number]>([3, 1]);
    const [matchLength, setMatchLength] = useState<number>(7);
    const [isCrawford, setIsCrawford] = useState<boolean>(false);
    const [selectedMoveNotation, setSelectedMoveNotation] = useState<string | null>('8/5 6/5');
    const [bgsageData, setBgsageData] = useState<BgsageEvaluateResponse | null>(null);
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
            return serializeCanonicalXGID({ ...boardState, dice, board: autoCompleteRemainingToOff(board) });
        } catch {
            return '';
        }
    }, [boardState, dice, board]);

    const candidates = useMemo<CandidateMoveAnalysisRow[]>(() => {
        return computeLegalCandidateMovesTop5(boardState, dice, bgsageData);
    }, [boardState, dice, bgsageData]);

    const coachExplanation = useMemo(() => {
        if (!candidates[0]) return undefined;
        return computeVerifiedBoardFacts(candidates[0].notation, board, board, candidates[0].winPct, isEn);
    }, [candidates, board, isEn]);

    const coachHighlight = useMemo(() => {
        if (!selectedMoveNotation) return null;
        try {
            const isOptimalSelected = !candidates[0] || selectedMoveNotation === candidates[0].notation;
            return {
                played: [],
                optimal: parseCoachNotationMoves(selectedMoveNotation, 'X'),
                optimalTone: isOptimalSelected ? ('gold' as const) : ('sky' as const),
            };
        } catch {
            return null;
        }
    }, [selectedMoveNotation, candidates]);

    const handleCheckerClick = useCallback((point: number) => {
        const next = applyBrushToPoint(board, tray, point, activeBrush);
        setBoard(next.board);
        setTray(next.tray);
        setBgsageData(null);
    }, [board, tray, activeBrush]);

    const handleCheckerRightClick = useCallback((point: number) => {
        const next = applyBrushToPoint(board, tray, point, 'remove');
        setBoard(next.board);
        setTray(next.tray);
        setBgsageData(null);
    }, [board, tray]);

    const handleClearBoard = () => {
        const c = clearBoardToTrays();
        setBoard(c.board); setTray(c.tray); setActiveBrush('white'); setBgsageData(null); setSelectedMoveNotation(null);
    };

    const handleResetStartingBoard = () => {
        const init = getInitialStartingBoard();
        setBoard(init.board); setTray(init.tray); setActiveBrush('white'); setBgsageData(null); setSelectedMoveNotation('8/5 6/5');
    };

    const handleCompleteRemainingToOff = () => {
        setBoard((prev) => autoCompleteRemainingToOff(prev)); setTray({ white: 0, black: 0 });
    };

    const handleInvertColors = () => {
        setBoard((prev) => prev.map((v) => -v)); setTray((t) => ({ white: t.black, black: t.white })); setBgsageData(null);
    };

    const handleScanComplete = (result: ScannedBoardVisionResult) => {
        const newBoard = visionResultToBoard26(result);
        setBoard(newBoard);
        setTray({ white: 0, black: 0 });
        setDice(result.dice);
        setBgsageData(null);
        const top5 = computeLegalCandidateMovesTop5({ ...boardState, board: newBoard, dice: result.dice }, result.dice);
        if (top5[0]) setSelectedMoveNotation(top5[0].notation);
    };

    const handleRunAnalysis = async () => {
        handleCompleteRemainingToOff();
        setLoading(true);
        setErrorMessage(null);
        try {
            const data = await evaluateWithBgsage(xgidString, 3, 10000);
            setBgsageData(data);
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
            window.sessionStorage.setItem('bgtour_custom_analysis_position', JSON.stringify({ board: validBoard, dice, matchLength, turn: 'X' }));
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
            setErrorMessage(isEn ? 'Invalid XGID string.' : 'Code XGID invalide.');
        }
    };

    const handleSelectPreset = (xgid: string, presetDice: [number, number], defaultMove?: string) => {
        handleImportXgid(xgid);
        setDice(presetDice);
        if (defaultMove) setSelectedMoveNotation(defaultMove);
    };

    const emptyTargets = useMemo(() => new Map<number, number[]>(), []);
    const noop = useCallback(() => {}, []);

    return (
        <div className="flex h-dvh max-h-dvh w-full flex-col text-[#fdf8eb] bg-[#050505] overflow-hidden" data-testid="analysis-studio-root">
            <AppNavbar activeTab="play" />
            <div className="flex flex-1 min-h-0 overflow-hidden w-full">
                <LobbyLeftSidebar />
                <div className="flex-1 min-w-0 flex flex-col p-2 overflow-hidden max-w-[1600px] mx-auto w-full">
                    {/* Corps Principal en 2 colonnes : Étape 1 + Plateau à gauche | Étape 2 + Étape 3 à droite */}
                    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 overflow-hidden">
                        <div className="lg:col-span-7 flex flex-col justify-between bg-[#0B1015] border border-white/[0.08] rounded-2xl p-2 shadow-2xl overflow-hidden min-h-0">
                            <ManualBoardSetupStage
                                stats={stats}
                                activeBrush={activeBrush}
                                onSelectBrush={setActiveBrush}
                                onClearBoard={handleClearBoard}
                                onResetStartingBoard={handleResetStartingBoard}
                                onCompleteRemainingToOff={handleCompleteRemainingToOff}
                                onInvertColors={handleInvertColors}
                                onOpenScanner={() => setIsScannerOpen(true)}
                                onSelectPreset={handleSelectPreset}
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
                                <div className="flex items-center justify-center shrink-0 pt-0.5">
                                    <span
                                        data-testid="selected-move-board-badge"
                                        className="inline-flex items-center gap-1.5 text-xs text-zinc-200 bg-white/[0.06] px-3 py-0.5 rounded-full border border-white/15"
                                    >
                                        <span>{isEn ? 'Selected move:' : 'Coup sélectionné :'}</span>
                                        <strong className="font-mono text-[#D4AF37]">{selectedMoveNotation}</strong>
                                        <span className="text-zinc-400">({isEn ? 'Active arrows on board' : 'Flèches actives sur le plateau'})</span>
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-5 bg-[#12151C] border border-white/[0.08] rounded-2xl p-2.5 shadow-2xl overflow-hidden flex flex-col min-h-0">
                            <AnalysisControlPanel
                                dice={dice}
                                onChangeDice={(d) => {
                                    setDice(d);
                                    setBgsageData(null);
                                    const nextState = { ...boardState, dice: d, board: autoCompleteRemainingToOff(board) };
                                    const top = computeLegalCandidateMovesTop5(nextState, d, null);
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
                                coachExplanation={coachExplanation}
                            />
                        </div>
                    </div>

                    <PhotoBoardScannerModal
                        isOpen={isScannerOpen}
                        onClose={() => setIsScannerOpen(false)}
                        onScanComplete={handleScanComplete}
                    />
                </div>
            </div>
        </div>
    );
}

export default AnalysisStudioView;
