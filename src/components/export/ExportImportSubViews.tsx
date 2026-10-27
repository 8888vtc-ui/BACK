'use client';

/**
 * @file src/components/export/ExportImportSubViews.tsx
 * @description Sous-vues modulaires d'Export, Import Intelligent (Presse-papiers 1-Tap & Drag-Drop)
 * et Partage Natif OS (`navigator.share` AirDrop / WhatsApp / iMessage).
 * Strictement < 300 lignes, 0 `any`.
 */

import React from 'react';
import { downloadFile } from '../../features/export';
import { toast } from '../toast/ToastContext';

export interface ExportTabViewProps {
    readonly exportFormat: 'xgid' | 'sgf';
    readonly onChangeFormat: (fmt: 'xgid' | 'sgf') => void;
    readonly xgidString: string;
    readonly sgfString: string;
    readonly turnsCount: number;
    readonly canNativeShare: boolean;
    readonly onCopy: (text: string, label: string) => void;
    readonly onNativeShare: () => void;
}

export const ExportTabView: React.FC<ExportTabViewProps> = ({
    exportFormat,
    onChangeFormat,
    xgidString,
    sgfString,
    turnsCount,
    canNativeShare,
    onCopy,
    onNativeShare,
}) => {
    const activePayload = exportFormat === 'xgid' ? xgidString : sgfString;

    return (
        <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                    Format d&apos;exportation :
                </span>
                <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-[#d4af37]/30 text-xs">
                    <button
                        type="button"
                        onClick={() => onChangeFormat('xgid')}
                        className={`px-3 py-1 rounded-lg font-bold transition ${
                            exportFormat === 'xgid'
                                ? 'border border-[#f3c65f]/70 bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        XGID (Position)
                    </button>
                    <button
                        type="button"
                        onClick={() => onChangeFormat('sgf')}
                        className={`px-3 py-1 rounded-lg font-bold transition ${
                            exportFormat === 'sgf'
                                ? 'border border-[#f3c65f]/70 bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        SGF (Partie complète)
                    </button>
                </div>
            </div>

            <div className="relative">
                <textarea
                    readOnly
                    value={activePayload}
                    rows={exportFormat === 'xgid' ? 3 : 6}
                    className="w-full rounded-2xl border border-[#d4af37]/35 bg-[#060911] p-3 font-mono text-xs text-[#f3c65f] focus:outline-none select-all shadow-inner"
                    data-testid="export-output-textarea"
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-[11px] text-slate-400">
                    {exportFormat === 'xgid'
                        ? 'Standard universel eXtreme Gammon (XGID)'
                        : `Format SGF GM[6] (${turnsCount} coups sérialisés)`}
                </div>

                <div className="flex items-center gap-2">
                    {canNativeShare && (
                        <button
                            type="button"
                            onClick={onNativeShare}
                            data-testid="native-share-btn"
                            className="rounded-xl border border-emerald-400/60 bg-gradient-to-b from-emerald-500/25 to-emerald-900/40 hover:border-emerald-300 px-3.5 py-2 text-xs font-bold text-emerald-100 transition flex items-center gap-1.5 shadow"
                        >
                            <span>📲</span>
                            <span>Partager (OS)</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => onCopy(activePayload, exportFormat.toUpperCase())}
                        className="rounded-xl border border-[#d4af37]/40 bg-[#151c2c] hover:border-[#f3c65f] px-3.5 py-2 text-xs font-bold text-[#fdf8eb] transition flex items-center gap-1.5 shadow"
                        data-testid="copy-export-btn"
                    >
                        <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">📋</span>
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
                        className="rounded-xl border border-[#fef08a]/80 bg-gradient-to-b from-[#fff5cf] via-[#f0c75e] to-[#b87e14] hover:brightness-105 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-[#1c1004] transition flex items-center gap-1.5 shadow"
                        data-testid="download-export-btn"
                    >
                        <span>💾</span>
                        <span>Télécharger .{exportFormat}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export interface ImportTabViewProps {
    readonly importInput: string;
    readonly importError: string | null;
    readonly onChangeInput: (val: string) => void;
    readonly onSmartPasteFromClipboard: () => void;
    readonly onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    readonly onApplyImport: () => void;
}

export const ImportTabView: React.FC<ImportTabViewProps> = ({
    importInput,
    importError,
    onChangeInput,
    onSmartPasteFromClipboard,
    onFileUpload,
    onApplyImport,
}) => (
    <div className="space-y-4 animate-in fade-in">
        <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-300">
                Chaîne XGID ou contenu SGF :
            </label>
            <button
                type="button"
                onClick={onSmartPasteFromClipboard}
                data-testid="smart-paste-import-btn"
                className="rounded-xl border border-[#f3c65f]/65 bg-gradient-to-b from-[#33240f] to-[#181006] px-3 py-1.5 text-[11px] font-bold text-[#fce8b2] hover:border-[#fff3c4] transition flex items-center gap-1.5 shadow-sm"
            >
                <span>📋</span>
                <span>Coller &amp; Charger en 1-Tap</span>
            </button>
        </div>

        <textarea
            value={importInput}
            onChange={(e) => onChangeInput(e.target.value)}
            placeholder="Ex: XGID=-b----E-C---eE---c-e----B-:0:0:1:00:0:0:0:0:7 ou fichier (;FF[4]GM[6]...)"
            rows={4}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-white focus:border-amber-400 focus:outline-none"
            data-testid="import-input-textarea"
        />

        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-300/90 hover:text-amber-200">
                <span>📁</span>
                <span>Charger un fichier (.xgid, .sgf)</span>
                <input
                    type="file"
                    accept=".xgid,.sgf,.txt"
                    onChange={onFileUpload}
                    className="hidden"
                />
            </label>

            <button
                type="button"
                onClick={onApplyImport}
                className="rounded-xl border border-[#fef08a]/80 bg-gradient-to-b from-[#fff5cf] via-[#f0c75e] to-[#b87e14] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1c1004] transition shadow-md flex items-center gap-1.5"
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
);

export interface ShareTabViewProps {
    readonly shareUrl: string;
    readonly canNativeShare: boolean;
    readonly onCopy: (text: string, label: string) => void;
    readonly onNativeShare: () => void;
}

export const ShareTabView: React.FC<ShareTabViewProps> = ({
    shareUrl,
    canNativeShare,
    onCopy,
    onNativeShare,
}) => (
    <div className="space-y-4 animate-in fade-in">
        <div className="rounded-2xl border border-[#d4af37]/30 bg-slate-950/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#f3c65f] font-bold text-xs">
                    <span>🔗</span>
                    <span>Partage Direct Instantané</span>
                </div>
                {canNativeShare && (
                    <button
                        type="button"
                        onClick={onNativeShare}
                        data-testid="share-tab-native-btn"
                        className="rounded-xl border border-emerald-400/60 bg-emerald-600/30 hover:bg-emerald-600/45 px-3 py-1 text-xs font-bold text-emerald-100 transition"
                    >
                        📲 AirDrop / WhatsApp / OS
                    </button>
                )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
                Ouvre directement cette position exacte prête à être jouée ou auditée par le Coach IA.
            </p>

            <div className="flex items-center gap-2">
                <input
                    readOnly
                    value={shareUrl}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-amber-200 focus:outline-none select-all"
                    data-testid="share-url-input"
                />
                <button
                    type="button"
                    onClick={() => onCopy(shareUrl, 'Lien de partage')}
                    className="rounded-xl border border-[#f3c65f]/70 bg-[#2d1e0b] hover:bg-[#3d2910] px-4 py-2 text-xs font-bold text-[#fff8e1] transition shadow shrink-0"
                    data-testid="copy-share-url-btn"
                >
                    Copier
                </button>
            </div>
        </div>
    </div>
);
