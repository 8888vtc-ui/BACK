'use client';

import React, { useState, useMemo } from 'react';
import type { BoardState } from '../../engine/backgammonEngine';
import type { RawGameTurn } from '../../features/rating/types';
import {
    serializeToXGID,
    parseFromXGID,
    isValidXGID,
    serializeToSGF,
    parseSGF,
    generateShareUrl,
    copyToClipboard,
    downloadFile,
} from '../../features/export';
import { toast } from '../toast/ToastContext';
import { impactLight, impactMedium } from '../../lib/capacitor/haptics';
import { useBoardTheme, getModalThemeClasses, type ThemeName } from '../../hooks/useBoardTheme';

export interface ExportImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentState: BoardState;
    turnsHistory: RawGameTurn[];
    onImportState: (state: BoardState) => void;
    theme?: ThemeName;
}

export type ModalTab = 'export' | 'import' | 'share';

export default function ExportImportModal({
    isOpen,
    onClose,
    currentState,
    turnsHistory,
    onImportState,
    theme,
}: ExportImportModalProps) {
    const { theme: activeTheme } = useBoardTheme();
    const currentTheme = theme || activeTheme;
    const modalClasses = getModalThemeClasses(currentTheme);
    const [activeTab, setActiveTab] = useState<ModalTab>('export');
    const [exportFormat, setExportFormat] = useState<'xgid' | 'sgf'>('xgid');
    const [importInput, setImportInput] = useState('');
    const [importError, setImportError] = useState<string | null>(null);

    // XGID calculé
    const xgidString = useMemo(() => {
        try {
            return serializeToXGID(currentState);
        } catch {
            return '';
        }
    }, [currentState]);

    // SGF calculé
    const sgfString = useMemo(() => {
        try {
            return serializeToSGF({
                gameId: `game_${Date.now()}`,
                matchLength: currentState.matchLength || 7,
                scoreX: currentState.scoreX || 0,
                scoreO: currentState.scoreO || 0,
                currentState,
                turnsHistory,
            });
        } catch {
            return '';
        }
    }, [currentState, turnsHistory]);

    // URL de partage
    const shareUrl = useMemo(() => {
        try {
            return generateShareUrl(currentState);
        } catch {
            return '';
        }
    }, [currentState]);

    if (!isOpen) return null;

    // Gestion de l'import
    function handleApplyImport() {
        setImportError(null);
        const trimmed = importInput.trim();
        if (!trimmed) {
            setImportError('Veuillez coller un XGID ou un fichier SGF.');
            return;
        }

        try {
            if (trimmed.startsWith('XGID=') || trimmed.includes(':')) {
                const state = parseFromXGID(trimmed);
                impactMedium();
                onImportState(state);
                toast.success('Position XGID chargée avec succès sur le plateau !', 'Import XGID');
                onClose();
                return;
            }

            if (trimmed.startsWith('(') || trimmed.includes('GM[6]')) {
                const parsed = parseSGF(trimmed);
                impactMedium();
                toast.success(
                    `Fichier SGF chargé (${parsed.moves.length} coups) !`,
                    'Import SGF',
                );
                onClose();
                return;
            }

            // Tentative XGID par défaut
            const state = parseFromXGID(trimmed);
            impactMedium();
            onImportState(state);
            toast.success('Position importée avec succès !', 'Import XGID');
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Format non reconnu.';
            setImportError(`Erreur d'importation : ${msg}`);
        }
    }

    async function handleCopy(text: string, label: string) {
        impactLight();
        const ok = await copyToClipboard(text);
        if (ok) {
            toast.success(`${label} copié dans le presse-papiers !`, 'Presse-papiers');
        } else {
            toast.info(text, 'Copie manuelle requise');
        }
    }

    function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                setImportInput(content);
                setImportError(null);
            }
        };
        reader.readAsText(file);
    }

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-fade-in ${modalClasses.overlay}`}
            data-testid="export-import-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Export, Import & Partage"
        >
            <div className={`relative flex w-full max-w-2xl flex-col rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl transition-all ${modalClasses.container}`}>
                {/* Header */}
                <div className={`flex items-center justify-between border-b px-5 py-4 ${modalClasses.header}`}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl shadow-lg shadow-indigo-950">
                            💾
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                                <span>Export, Import &amp; Partage</span>
                            </h2>
                            <p className="text-xs text-slate-400">
                                Formats professionnels XGID &amp; SGF, et liens de partage instantanés
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white transition"
                        title="Fermer"
                        data-testid="close-export-modal-btn"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1.5 border-b border-slate-800 bg-slate-950/30 px-5 py-2.5">
                    <button
                        type="button"
                        onClick={() => setActiveTab('export')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                            activeTab === 'export'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                        data-testid="tab-export"
                    >
                        <span>📤</span>
                        <span>Exporter</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('import')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                            activeTab === 'import'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                        data-testid="tab-import"
                    >
                        <span>📥</span>
                        <span>Importer</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('share')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                            activeTab === 'share'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                        data-testid="tab-share"
                    >
                        <span>🔗</span>
                        <span>Lien de Partage</span>
                    </button>
                </div>

                {/* Contenu de l'onglet actif */}
                <div className="p-5 space-y-4">
                    {/* ONGLET 1 : EXPORT */}
                    {activeTab === 'export' && (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-400">
                                    Choisissez le format d'exportation :
                                </span>
                                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setExportFormat('xgid')}
                                        className={`px-3 py-1 rounded-lg font-bold transition ${
                                            exportFormat === 'xgid'
                                                ? 'bg-indigo-600 text-white shadow'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        XGID (Position)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExportFormat('sgf')}
                                        className={`px-3 py-1 rounded-lg font-bold transition ${
                                            exportFormat === 'sgf'
                                                ? 'bg-indigo-600 text-white shadow'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        SGF (Partie complète)
                                    </button>
                                </div>
                            </div>

                            {/* Zone texte du format sélectionné */}
                            <div className="relative">
                                <textarea
                                    readOnly
                                    value={exportFormat === 'xgid' ? xgidString : sgfString}
                                    rows={exportFormat === 'xgid' ? 3 : 6}
                                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-indigo-300 focus:outline-none select-all"
                                    data-testid="export-output-textarea"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <div className="text-[11px] text-slate-400">
                                    {exportFormat === 'xgid'
                                        ? 'Standard universel eXtreme Gammon / GNU Backgammon'
                                        : `Format SGF GM[6] (${turnsHistory.length} coups sérialisés)`}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleCopy(
                                                exportFormat === 'xgid' ? xgidString : sgfString,
                                                exportFormat.toUpperCase(),
                                            )
                                        }
                                        className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-bold text-white transition flex items-center gap-1.5 shadow"
                                        data-testid="copy-export-btn"
                                    >
                                        <span>📋</span>
                                        <span>Copier</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (exportFormat === 'xgid') {
                                                downloadFile(xgidString, 'position.xgid', 'text/plain');
                                            } else {
                                                downloadFile(sgfString, 'partie.sgf', 'application/x-go-sgf');
                                            }
                                            toast.success('Fichier téléchargé avec succès !', 'Export');
                                        }}
                                        className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 px-3.5 py-2 text-xs font-bold text-white transition flex items-center gap-1.5 shadow"
                                        data-testid="download-export-btn"
                                    >
                                        <span>💾</span>
                                        <span>Télécharger .{exportFormat}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ONGLET 2 : IMPORT */}
                    {activeTab === 'import' && (
                        <div className="space-y-4 animate-in fade-in">
                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">
                                    Collez une chaîne XGID ou un contenu SGF :
                                </label>
                                <textarea
                                    value={importInput}
                                    onChange={(e) => {
                                        setImportInput(e.target.value);
                                        setImportError(null);
                                    }}
                                    placeholder="Ex: XGID=-b----E-C---eE---c-e----B-:0:0:1:00:0:0:0:0:7 ou fichier (;FF[4]GM[6]...)"
                                    rows={5}
                                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-white focus:border-indigo-500 focus:outline-none"
                                    data-testid="import-input-textarea"
                                />
                            </div>

                            {/* Upload fichier */}
                            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                                    <span>📁</span>
                                    <span>Charger depuis un fichier (.xgid, .sgf, .txt)</span>
                                    <input
                                        type="file"
                                        accept=".xgid,.sgf,.txt"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>

                                <button
                                    type="button"
                                    onClick={handleApplyImport}
                                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 px-4 py-2 text-xs font-bold text-white transition shadow-md flex items-center gap-1.5"
                                    data-testid="apply-import-btn"
                                >
                                    <span>⚡</span>
                                    <span>Charger sur le plateau</span>
                                </button>
                            </div>

                            {importError && (
                                <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300 font-medium">
                                    {importError}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ONGLET 3 : LIEN DE PARTAGE */}
                    {activeTab === 'share' && (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
                                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                                    <span>🔗</span>
                                    <span>Lien de Partage Dynamique</span>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Toute personne qui ouvrira ce lien verra instantanément cette position exacte prête à être jouée ou analysée par le coach.
                                </p>

                                <div className="flex items-center gap-2">
                                    <input
                                        readOnly
                                        value={shareUrl}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-indigo-300 focus:outline-none select-all"
                                        data-testid="share-url-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(shareUrl, 'Lien de partage')}
                                        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition shadow shrink-0"
                                        data-testid="copy-share-url-btn"
                                    >
                                        Copier
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
