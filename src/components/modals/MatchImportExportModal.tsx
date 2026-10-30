'use client';

/**
 * Modale d'Import & Export Horloger Universel (.mat, .sgf, XGID) & Revue de Match.
 * Conforme à SCALABILITY.md (< 250 lignes, 0 any, Dumb UI & mémoïsation).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { BoardState, Player } from '../../engine/backgammonEngine';
import type { MatchLogEntry } from '../../actions/types';
import type { RawGameTurn } from '../../features/rating';
import { serializeXGID } from '../../lib/engine/xgid';
import {
    serializeToMAT,
    serializeToSGF,
    importMatchOrPosition,
    type ImportedMatchResult,
} from '../../features/export';
import { getImportExportTranslations } from '../../lib/i18n/uiTranslations';
import { toast } from '../toast/ToastContext';
import PositionPhotoScannerTab from './PositionPhotoScannerTab';

export interface MatchImportExportModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly currentState?: BoardState;
    readonly turnsHistory?: ReadonlyArray<MatchLogEntry> | RawGameTurn[];
    readonly playerX?: string;
    readonly playerO?: string;
    readonly matchLength?: number;
    readonly scoreX?: number;
    readonly scoreO?: number;
    readonly winner?: Player | null;
    readonly pointsWon?: number;
    readonly onImportState?: (state: BoardState) => void;
    readonly onImportMatch?: (match: ImportedMatchResult) => void;
    readonly initialTab?: 'import' | 'export' | 'scanner';
    readonly locale?: string;
}

function downloadTextFile(content: string, filename: string): void {
    if (typeof document === 'undefined') return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

const MatchImportExportModalComponent: React.FC<MatchImportExportModalProps> = ({
    isOpen,
    onClose,
    currentState,
    turnsHistory = [],
    playerX = 'Joueur X',
    playerO = 'Joueur O',
    matchLength = 7,
    scoreX = 0,
    scoreO = 0,
    winner,
    pointsWon,
    onImportState,
    onImportMatch,
    initialTab = 'import',
    locale = 'fr',
}) => {
    const [activeTab, setActiveTab] = useState<'import' | 'export' | 'scanner'>(initialTab);
    const [rawInput, setRawInput] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const t = useMemo(() => getImportExportTranslations(locale), [locale]);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setRawInput('');
            setErrorMessage(null);
            setCopiedKey(null);
        }
    }, [isOpen, initialTab]);

    const xgidString = useMemo(() => (currentState ? serializeXGID(currentState) : ''), [currentState]);

    const exportData = useMemo(() => {
        const turns: RawGameTurn[] = (turnsHistory as Array<MatchLogEntry | RawGameTurn>).map((trn, idx) => ({
            turnNumber: 'turnIndex' in trn ? trn.turnIndex : trn.turnNumber ?? idx + 1,
            player: trn.player,
            dice: [trn.dice[0], trn.dice[1]],
            boardBefore: 'boardBefore' in trn && trn.boardBefore ? [...trn.boardBefore] : [],
            boardAfter: 'boardAfter' in trn && trn.boardAfter ? [...trn.boardAfter] : [],
            moves: 'movePlayed' in trn ? [...trn.movePlayed] : [...(trn.moves ?? [])],
            
        }));
        return {
            gameId: `match_${Date.now()}`,
            playerX, playerO,
            matchLength: currentState?.matchLength ?? matchLength,
            scoreX: currentState?.scoreX ?? scoreX,
            scoreO: currentState?.scoreO ?? scoreO,
            winner, pointsWon, currentState, turnsHistory: turns,
        };
    }, [currentState, turnsHistory, playerX, playerO, matchLength, scoreX, scoreO, winner, pointsWon]);

    const handleCopy = useCallback(async (text: string, key: string) => {
        if (!text || typeof navigator === 'undefined' || !navigator.clipboard) return;
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success(t.copiedSuccess, 'Presse-papiers');
        setTimeout(() => setCopiedKey(null), 2000);
    }, [t]);

    const handleApplyImport = useCallback((content: string) => {
        setErrorMessage(null);
        try {
            const res = importMatchOrPosition(content);
            if (res.type === 'xgid') {
                if (onImportState) onImportState(res.state);
                toast.success(t.successXgid, 'Import XGID');
            } else {
                if (onImportMatch) onImportMatch(res);
                else if (onImportState && res.finalBoard) {
                    onImportState({ ...res.turns[res.turns.length - 1].boardAfter, board: res.finalBoard.slice() } as unknown as BoardState);
                }
                toast.success(t.successMat, 'Import Match');
            }
            onClose();
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : t.errorInvalid);
        }
    }, [onImportState, onImportMatch, onClose, t]);

    const handlePasteClipboard = useCallback(async () => {
        if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) return;
        try {
            const text = await navigator.clipboard.readText();
            setRawInput(text);
            handleApplyImport(text);
        } catch {
            setErrorMessage(t.errorInvalid);
        }
    }, [handleApplyImport, t]);

    const handleFile = useCallback((file?: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                setRawInput(text);
                handleApplyImport(text);
            }
        };
        reader.readAsText(file);
    }, [handleApplyImport]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in" data-testid="match-import-export-modal" role="dialog" aria-modal="true" aria-label={t.modalTitle}>
            <div className="relative flex w-full max-w-xl flex-col rounded-2xl border border-white/10 bg-slate-950/98 shadow-2xl overflow-hidden text-slate-100">
                <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                        <span className="text-lg">📷</span>
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">{t.modalTitle}</h2>
                            <p className="text-[11px] text-slate-400">{t.modalSubtitle}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} data-testid="close-import-export-modal-btn" className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white transition flex items-center justify-center text-xs">✕</button>
                </div>
                <div className="flex flex-wrap border-b border-white/10 bg-slate-950 px-4 py-2 gap-2">
                    <button type="button" onClick={() => setActiveTab('import')} data-testid="tab-import-btn" className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition ${activeTab === 'import' ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white' : 'border-white/10 text-slate-300 hover:border-white/25'}`}>📥 {t.tabImport}</button>
                    <button type="button" onClick={() => setActiveTab('scanner')} data-testid="tab-photo-scanner-btn" className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition ${activeTab === 'scanner' ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white' : 'border-white/10 text-slate-300 hover:border-white/25'}`}>📷 Photo / Éditeur</button>
                    <button type="button" onClick={() => setActiveTab('export')} data-testid="tab-export-btn" className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition ${activeTab === 'export' ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white' : 'border-white/10 text-slate-300 hover:border-white/25'}`}>📤 {t.tabExport}</button>
                </div>
                <div className="p-4 sm:p-5 space-y-4">
                    {activeTab === 'scanner' ? (
                        <PositionPhotoScannerTab
                            currentState={currentState}
                            onApplyState={(scannedState) => {
                                onImportState?.(scannedState);
                                toast.success(t.successXgid, 'Position chargée');
                                onClose();
                            }}
                        />
                    ) : activeTab === 'import' ? (
                        <div className="space-y-3">
                            <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files?.[0]); }} className={`border-2 border-dashed rounded-xl p-4 text-center text-xs cursor-pointer transition ${isDragging ? 'border-amber-400 bg-amber-500/10' : 'border-white/15 bg-white/[0.02]'}`}>
                                <label className="cursor-pointer block">
                                    <span className="text-xl block mb-1">📂</span>
                                    <span className="text-slate-300 font-medium">{t.importDropZone}</span>
                                    <input type="file" accept=".mat,.sgf,.txt" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                                </label>
                            </div>
                            <textarea value={rawInput} onChange={(e) => { setRawInput(e.target.value); setErrorMessage(null); }} placeholder={t.importPlaceholder} data-testid="import-textarea" rows={4} className="w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-xs font-mono text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none" />
                            {errorMessage && <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-2 text-xs text-rose-300">⚠️ {errorMessage}</div>}
                            <div className="flex gap-2">
                                <button type="button" onClick={() => handleApplyImport(rawInput)} data-testid="apply-import-btn" className="flex-1 rounded-xl border border-[#f3c65f] bg-[#f3c65f] py-2 text-xs font-black text-slate-950 hover:bg-[#f7d37c] transition shadow-sm">{t.importCta}</button>
                                <button type="button" onClick={handlePasteClipboard} data-testid="paste-clipboard-btn" className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold hover:bg-white/10 transition">📋 {t.pasteCta}</button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3.5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-200">Position Courante (XGID)</span>
                                    <button type="button" onClick={() => handleCopy(xgidString, 'xgid')} data-testid="copy-xgid-btn" className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:border-white/25 hover:text-white transition">{copiedKey === 'xgid' ? '✓ Copié' : '📋 Copier'}</button>
                                </div>
                                <div className="rounded-lg bg-slate-950 p-2 font-mono text-[11px] text-slate-300 break-all select-all">{xgidString || 'XGID=...'}</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <button type="button" onClick={() => downloadTextFile(serializeToMAT(exportData), 'match.mat')} data-testid="download-mat-btn" className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] p-3 text-xs font-bold text-amber-200 transition">💾 {t.downloadMatCta}</button>
                                <button type="button" onClick={() => downloadTextFile(serializeToSGF(exportData), 'match.sgf')} data-testid="download-sgf-btn" className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] p-3 text-xs font-bold text-slate-200 transition">📄 {t.downloadSgfCta}</button>
                            </div>
                            <p className="text-[11px] text-slate-400 text-center leading-relaxed">{t.exportNotice}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const MatchImportExportModal = React.memo(MatchImportExportModalComponent);
export default MatchImportExportModal;
