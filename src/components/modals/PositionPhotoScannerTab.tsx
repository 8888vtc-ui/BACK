'use client';

/**
 * Onglet « Photo Tournoi & Éditeur Tactile Rapide (Tap-to-Adjust) » de `MatchImportExportModal`.
 *
 * Rôle :
 *   1. Prendre en photo ou importer un tablier de tournoi pour reconnaissance via `POST /api/scan-position`.
 *   2. Ajuster les pions en 1 tap (`+Blanc`, `+Noir`, `Gomme`), inverser les côtés (`⇄`),
 *      obtenir le Verdict Instantané (Videau + Meilleur Coup) ou charger la position dans la partie.
 *
 * Dépendances : `positionPhotoParser.ts`, `backgammonEngine.ts`.
 * Comment retirer : Supprimer ce fichier et retirer l'onglet `scanner` de `MatchImportExportModal.tsx`.
 * Conforme SCALABILITY.md R1 (< 260 lignes, `React.memo`, 0 `any`).
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
    O_BAR,
    X_BAR,
    createInitialState,
    serializeXGID,
    type BoardState,
    type Player,
} from '../../engine/backgammonEngine';
import {
    applyPointEditorTap,
    countBoardCheckers,
    createEmptyEditorBoard,
    createInitialEditorBoard,
    evaluateScannedPositionInstant,
    invertEditorBoardSides,
    type HomeQuadrantOrientation,
    type InstantPositionVerdict,
    type PositionEditorTool,
    type ScannedPositionResult,
} from '../../features/export/positionPhotoParser';

export interface PositionPhotoScannerTabProps {
    readonly currentState?: BoardState;
    readonly onApplyState: (state: BoardState) => void;
}

const TOP_POINTS = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24] as const;
const BOTTOM_POINTS = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const;
const CUBE_VALUES = [1, 2, 4, 8, 16] as const;

const PositionPhotoScannerTabComponent: React.FC<PositionPhotoScannerTabProps> = ({
    currentState,
    onApplyState,
}) => {
    const initial = useMemo(() => currentState ?? createInitialState(7), [currentState]);
    const [board, setBoard] = useState<number[]>(() => [...initial.board]);
    const [turn, setTurn] = useState<Player>(initial.turn);
    const [cubeValue, setCubeValue] = useState<number>(initial.cubeValue || 1);
    const [cubeOwner] = useState<Player | null>(initial.cubeOwner);
    const [die1, setDie1] = useState<number>(initial.dice?.[0] ?? 3);
    const [die2, setDie2] = useState<number>(initial.dice?.[1] ?? 1);
    const [hasDice, setHasDice] = useState<boolean>(Boolean(initial.dice ?? true));
    const [tool, setTool] = useState<PositionEditorTool>('add-x');
    const [orientation, setOrientation] = useState<HomeQuadrantOrientation>('bottom-right');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scanWarnings, setScanWarnings] = useState<readonly string[]>([]);
    const [verdict, setVerdict] = useState<InstantPositionVerdict | null>(null);

    const { totalX, totalO } = useMemo(() => countBoardCheckers(board), [board]);

    const builtState: BoardState = useMemo(
        () => ({
            board,
            turn,
            cubeValue,
            cubeOwner,
            dice: hasDice ? [die1, die2] : null,
            matchLength: initial.matchLength ?? 7,
            scoreX: initial.scoreX ?? 0,
            scoreO: initial.scoreO ?? 0,
            crawford: initial.crawford ?? false,
            doubled: false,
            resigned: 0,
        }),
        [board, turn, cubeValue, cubeOwner, hasDice, die1, die2, initial],
    );

    const liveXgid = useMemo(() => serializeXGID(builtState), [builtState]);

    const handlePointTap = useCallback(
        (point: number) => {
            setBoard((prev) => applyPointEditorTap(prev, point, tool));
            setVerdict(null);
        },
        [tool],
    );

    const handlePhotoSelected = useCallback((file?: File) => {
        if (!file) return;
        setScanError(null);
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (typeof ev.target?.result === 'string') setImagePreview(ev.target.result);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleRunVisionScan = useCallback(async () => {
        if (!imagePreview) return;
        setIsScanning(true);
        setScanError(null);
        setScanWarnings([]);
        try {
            const res = await fetch('/api/scan-position', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageDataUrl: imagePreview,
                    orientation,
                    matchLength: initial.matchLength ?? 7,
                    scoreX: initial.scoreX ?? 0,
                    scoreO: initial.scoreO ?? 0,
                    crawford: initial.crawford ?? false,
                }),
            });
            const data = (await res.json()) as { ok: boolean; message?: string; result?: ScannedPositionResult };
            if (!res.ok || !data.ok || !data.result) {
                setScanError(data.message ?? 'Reconnaissance indisponible : ajustez les pions au toucher ci-dessous.');
                return;
            }
            const scanned = data.result.state;
            setBoard([...scanned.board]);
            setTurn(scanned.turn);
            setCubeValue(scanned.cubeValue || 1);
            if (scanned.dice) {
                setHasDice(true);
                setDie1(scanned.dice[0]);
                setDie2(scanned.dice[1]);
            }
            setScanWarnings(data.result.warnings);
            setVerdict(evaluateScannedPositionInstant(scanned));
        } catch (err: unknown) {
            setScanError(err instanceof Error ? err.message : 'Erreur réseau lors du scan photo.');
        } finally {
            setIsScanning(false);
        }
    }, [imagePreview, orientation, initial]);

    const renderPointCell = (pt: number) => {
        const val = board[pt] ?? 0;
        const abs = Math.abs(val);
        const isWhite = val > 0;
        return (
            <button
                key={pt}
                type="button"
                data-testid={`editor-point-${pt}`}
                onClick={() => handlePointTap(pt)}
                className={`flex flex-col items-center justify-between rounded-lg border py-1 px-0.5 min-h-[40px] text-[10px] font-mono transition active:scale-95 touch-manipulation ${
                    abs > 0
                        ? isWhite
                            ? 'border-amber-300/70 bg-amber-100/15 text-amber-100'
                            : 'border-sky-400/60 bg-slate-900/90 text-sky-200'
                        : 'border-white/10 bg-black/40 text-slate-400 hover:border-white/25'
                }`}
            >
                <span className="text-[10px] text-amber-300/75 font-bold">{pt}</span>
                <span className="font-black text-xs">{abs === 0 ? '·' : `${isWhite ? '⚪' : '⚫'}${abs}`}</span>
            </button>
        );
    };

    return (
        <div className="space-y-2 max-h-[72dvh] overflow-y-auto pr-0.5" data-testid="position-photo-scanner-tab">
            <div className="rounded-2xl border border-[#d4af37]/35 bg-black/40 p-2.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-amber-400/60 bg-[#28190b] px-2.5 py-1.5 text-xs font-bold text-amber-100 hover:border-amber-300 transition">
                        <span>📷 Photo du tablier</span>
                        <input
                            type="file" accept="image/*" capture="environment"
                            data-testid="photo-scanner-file-input" className="hidden"
                            onChange={(e) => handlePhotoSelected(e.target.files?.[0])}
                        />
                    </label>
                    <select
                        aria-label="Orientation du jan intérieur Blanc" data-testid="photo-orientation-select"
                        value={orientation} onChange={(e) => setOrientation(e.target.value as HomeQuadrantOrientation)}
                        className="rounded-xl border border-white/15 bg-black/70 px-2 py-1.5 text-xs text-amber-100"
                    >
                        <option value="bottom-right">Jan Blanc (1-6) : Bas-Droite ↘</option>
                        <option value="bottom-left">Jan Blanc (1-6) : Bas-Gauche ↙</option>
                        <option value="top-right">Jan Blanc (1-6) : Haut-Droite ↗</option>
                        <option value="top-left">Jan Blanc (1-6) : Haut-Gauche ↖</option>
                    </select>
                    {imagePreview && (
                        <button
                            type="button" data-testid="run-vision-scan-btn" disabled={isScanning}
                            onClick={() => void handleRunVisionScan()}
                            className="rounded-xl border border-emerald-400/80 bg-emerald-600/30 px-2.5 py-1.5 text-xs font-extrabold text-emerald-100"
                        >
                            {isScanning ? '⏳ Analyse IA…' : '✨ Scanner'}
                        </button>
                    )}
                </div>
                {scanError && <div data-testid="photo-scan-error" className="rounded-xl border border-rose-500/45 bg-rose-950/50 px-2.5 py-1 text-xs text-rose-200">⚠️ {scanError}</div>}
                {scanWarnings.map((w, i) => <div key={i} className="rounded-xl border border-amber-400/45 bg-amber-950/40 px-2.5 py-1 text-xs text-amber-200">💡 {w}</div>)}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1 rounded-2xl border border-white/10 bg-[#0d121c] px-2 py-1.5 text-xs">
                <div className="flex items-center gap-1">
                    <button type="button" data-testid="editor-tool-add-x" onClick={() => setTool('add-x')} className={`rounded-lg border px-2 py-1 font-bold ${tool === 'add-x' ? 'border-amber-300 bg-amber-500/25 text-amber-100' : 'border-white/10 text-slate-300'}`}>⚪ +Blanc ({totalX}/15)</button>
                    <button type="button" data-testid="editor-tool-add-o" onClick={() => setTool('add-o')} className={`rounded-lg border px-2 py-1 font-bold ${tool === 'add-o' ? 'border-sky-400 bg-sky-500/25 text-sky-100' : 'border-white/10 text-slate-300'}`}>⚫ +Noir ({totalO}/15)</button>
                    <button type="button" data-testid="editor-tool-remove" onClick={() => setTool('remove')} className={`rounded-lg border px-2 py-1 font-bold ${tool === 'remove' ? 'border-rose-400 bg-rose-500/25 text-rose-100' : 'border-white/10 text-slate-300'}`}>🧹 -1</button>
                </div>
                <div className="flex items-center gap-1">
                    <button type="button" data-testid="editor-invert-sides-btn" onClick={() => { setBoard((b) => invertEditorBoardSides(b)); setVerdict(null); }} className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-amber-200 hover:text-white" title="Inverser les couleurs Blanc et Noir">⇄ Inverser</button>
                    <button type="button" data-testid="editor-clear-board-btn" onClick={() => { setBoard(createEmptyEditorBoard()); setVerdict(null); }} className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-slate-300">🗑 Vider</button>
                    <button type="button" data-testid="editor-reset-initial-btn" onClick={() => { setBoard(createInitialEditorBoard()); setVerdict(null); }} className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-slate-300">🔄 Départ</button>
                </div>
            </div>

            <div className="rounded-2xl border border-[#d4af37]/30 bg-[#080b12] p-2 space-y-1.5">
                <div className="grid grid-cols-12 gap-1">{TOP_POINTS.map(renderPointCell)}</div>
                <div className="flex flex-wrap items-center justify-between gap-1.5 py-1 px-2 rounded-xl bg-black/50 border border-white/10 text-xs">
                    <button type="button" data-testid="editor-bar-x" onClick={() => handlePointTap(X_BAR)} className="rounded-lg border border-white/10 px-2 py-0.5 font-mono text-amber-200">Barre ⚪ : {board[X_BAR] ?? 0}</button>
                    <div className="flex flex-wrap items-center gap-1">
                        <button type="button" data-testid="editor-toggle-turn-btn" onClick={() => setTurn((t) => (t === 'X' ? 'O' : 'X'))} className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 font-bold text-amber-100">Trait : {turn === 'X' ? '⚪ X' : '⚫ O'}</button>
                        <button type="button" onClick={() => setCubeValue(CUBE_VALUES[(CUBE_VALUES.indexOf(cubeValue as (typeof CUBE_VALUES)[number]) + 1) % CUBE_VALUES.length])} className="rounded-lg border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-amber-200">Cube {cubeValue}×</button>
                        <button type="button" onClick={() => setHasDice((v) => !v)} className="rounded-lg border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-slate-200">{hasDice ? `🎲 ${die1}-${die2}` : '🎲 Sans dés'}</button>
                        {hasDice && (
                            <>
                                <select aria-label="Dé 1" value={die1} onChange={(e) => setDie1(Number(e.target.value))} className="rounded bg-black border border-white/20 px-1 py-0.5 font-mono text-xs">{[1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{d}</option>)}</select>
                                <select aria-label="Dé 2" value={die2} onChange={(e) => setDie2(Number(e.target.value))} className="rounded bg-black border border-white/20 px-1 py-0.5 font-mono text-xs">{[1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{d}</option>)}</select>
                            </>
                        )}
                    </div>
                    <button type="button" data-testid="editor-bar-o" onClick={() => handlePointTap(O_BAR)} className="rounded-lg border border-white/10 px-2 py-0.5 font-mono text-sky-200">Barre ⚫ : {Math.abs(board[O_BAR] ?? 0)}</button>
                </div>
                <div className="grid grid-cols-12 gap-1">{BOTTOM_POINTS.map(renderPointCell)}</div>
            </div>

            {verdict && (
                <div data-testid="editor-instant-verdict-box" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-400/50 bg-emerald-950/35 px-3 py-1.5 text-xs text-emerald-100">
                    <span><strong>Videau :</strong> {verdict.cubeAction} (ND {verdict.noDoubleEq >= 0 ? '+' : ''}{verdict.noDoubleEq.toFixed(3)})</span>
                    {verdict.bestMoveNotation && (
                        <span><strong>Meilleur coup ({die1}-{die2}) :</strong> <code className="font-mono font-black text-amber-200">{verdict.bestMoveNotation}</code> ({verdict.bestMoveEquity !== null && verdict.bestMoveEquity >= 0 ? '+' : ''}{verdict.bestMoveEquity?.toFixed(3)})</span>
                    )}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <code data-testid="editor-live-xgid" className="flex-1 min-w-[140px] truncate rounded-xl border border-white/10 bg-black/60 px-2.5 py-1.5 font-mono text-[11px] text-amber-200/90">{liveXgid}</code>
                <button type="button" data-testid="editor-instant-eval-btn" onClick={() => setVerdict(evaluateScannedPositionInstant(builtState))} className="rounded-xl border border-emerald-400/70 bg-emerald-500/20 px-3 py-2 text-xs font-extrabold text-emerald-200 hover:bg-emerald-500/30 transition">⚡ Verdict Instantané</button>
                <button type="button" data-testid="apply-scanned-position-btn" onClick={() => onApplyState(builtState)} className="rounded-xl border border-amber-400 bg-gradient-to-r from-amber-500 to-yellow-500 px-3.5 py-2 text-xs font-black text-black shadow-lg hover:brightness-110 transition">🎓 Jouer cette position</button>
            </div>
        </div>
    );
};

export const PositionPhotoScannerTab = React.memo(PositionPhotoScannerTabComponent);
export default PositionPhotoScannerTab;
