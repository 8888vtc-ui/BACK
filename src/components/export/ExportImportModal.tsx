'use client';

/**
 * @file src/components/export/ExportImportModal.tsx
 * @description Modale d'Export/Import/Partage modernisée (< 230 lignes, 0 `any`).
 * Intègre le partage natif OS (`navigator.share` iOS/Android) et le collage intelligent 1-Tap (`navigator.clipboard.readText`).
 */

import React, { useState, useMemo } from 'react';
import type { BoardState } from '../../engine/backgammonEngine';
import type { RawGameTurn } from '../../features/rating/types';
import {
    serializeToXGID,
    parseFromXGID,
    serializeToSGF,
    parseSGF,
    generateShareUrl,
    copyToClipboard,
} from '../../features/export';
import { toast } from '../toast/ToastContext';
import { impactLight, impactMedium } from '../../lib/capacitor/haptics';
import type { ThemeName } from '../../hooks/useBoardTheme';
import { ExportTabView, ImportTabView, ShareTabView } from './ExportImportSubViews';

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
}: ExportImportModalProps) {
    const [activeTab, setActiveTab] = useState<ModalTab>('export');
    const [exportFormat, setExportFormat] = useState<'xgid' | 'sgf'>('xgid');
    const [importInput, setImportInput] = useState('');
    const [importError, setImportError] = useState<string | null>(null);

    const xgidString = useMemo(() => {
        try {
            return serializeToXGID(currentState);
        } catch {
            return '';
        }
    }, [currentState]);

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

    const shareUrl = useMemo(() => {
        try {
            return generateShareUrl(currentState);
        } catch {
            return '';
        }
    }, [currentState]);

    if (!isOpen) return null;

    const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    function applyRawImportString(rawText: string) {
        setImportError(null);
        const trimmed = rawText.trim();
        if (!trimmed) {
            setImportError('Veuillez coller un XGID ou un fichier SGF.');
            return;
        }

        try {
            if (trimmed.startsWith('(') || trimmed.includes('GM[6]')) {
                const parsed = parseSGF(trimmed);
                void impactMedium();
                toast.success(`Fichier SGF chargé (${parsed.moves.length} coups) !`, 'Import SGF');
                onClose();
                return;
            }

            const state = parseFromXGID(trimmed);
            void impactMedium();
            onImportState(state);
            toast.success('Position XGID chargée avec succès sur le plateau !', 'Import XGID');
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Format non reconnu.';
            setImportError(`Erreur d'importation : ${msg}`);
        }
    }

    async function handleSmartPasteFromClipboard() {
        void impactLight();
        if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
            setImportError('Lecture directe du presse-papiers non autorisée par le navigateur.');
            return;
        }
        try {
            const text = await navigator.clipboard.readText();
            setImportInput(text);
            applyRawImportString(text);
        } catch {
            setImportError('Autorisez l’accès au presse-papiers ou collez manuellement.');
        }
    }

    async function handleNativeShare() {
        void impactMedium();
        if (!canNativeShare) return;
        try {
            await navigator.share({
                title: 'Backgammon Pro — Position XGID',
                text: `Position Backgammon (${xgidString})`,
                url: shareUrl || undefined,
            });
        } catch {
            // Annulation utilisateur ignorée
        }
    }

    async function handleCopy(text: string, label: string) {
        void impactLight();
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
            const content = event.target?.result;
            if (typeof content === 'string' && content) {
                setImportInput(content);
                applyRawImportString(content);
            }
        };
        reader.readAsText(file);
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fade-in"
            data-testid="export-import-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Export, Import & Partage"
        >
            <div className="relative flex w-full max-w-2xl flex-col rounded-3xl border border-[#d4af37]/55 bg-gradient-to-b from-[#17110b]/98 via-[#0d121d]/98 to-[#070a10]/98 shadow-[0_28px_80px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,245,205,0.25)] overflow-hidden backdrop-blur-2xl transition-all">
                <div className="flex items-center justify-between border-b border-[#d4af37]/30 bg-gradient-to-r from-[#24160b]/95 via-[#140d07]/95 to-[#1f1309]/95 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#f3c65f]/60 bg-gradient-to-b from-[#33230f] to-[#140d05] text-xl shadow-inner">
                            <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">💾</span>
                        </div>
                        <div>
                            <h2 className="font-serif text-lg font-black tracking-wide text-[#fdf8eb]">
                                Export, Import &amp; Partage
                            </h2>
                            <p className="text-xs text-amber-200/75">
                                Partage natif OS 1-Tap, Collage intelligent XGID &amp; SGF
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d4af37]/35 bg-black/50 text-amber-200/80 hover:border-[#f3c65f] hover:text-white transition"
                        title="Fermer"
                        data-testid="close-export-modal-btn"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex items-center gap-1.5 border-b border-[#d4af37]/20 bg-[#090d16]/90 px-5 py-2.5">
                    {([
                        { id: 'export' as const, icon: '📤', label: 'Exporter', testId: 'tab-export' },
                        { id: 'import' as const, icon: '📥', label: 'Importer', testId: 'tab-import' },
                        { id: 'share' as const, icon: '🔗', label: 'Lien de Partage', testId: 'tab-share' },
                    ]).map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            data-testid={tab.testId}
                            className={`flex items-center gap-2 rounded-xl border px-4 py-1.5 text-xs font-bold transition ${
                                activeTab === tab.id
                                    ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#d4af37]/45 hover:text-white'
                            }`}
                        >
                            <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="p-5 space-y-4">
                    {activeTab === 'export' && (
                        <ExportTabView
                            exportFormat={exportFormat}
                            onChangeFormat={setExportFormat}
                            xgidString={xgidString}
                            sgfString={sgfString}
                            turnsCount={turnsHistory.length}
                            canNativeShare={canNativeShare}
                            onCopy={handleCopy}
                            onNativeShare={handleNativeShare}
                        />
                    )}
                    {activeTab === 'import' && (
                        <ImportTabView
                            importInput={importInput}
                            importError={importError}
                            onChangeInput={(val) => {
                                setImportInput(val);
                                setImportError(null);
                            }}
                            onSmartPasteFromClipboard={handleSmartPasteFromClipboard}
                            onFileUpload={handleFileUpload}
                            onApplyImport={() => applyRawImportString(importInput)}
                        />
                    )}
                    {activeTab === 'share' && (
                        <ShareTabView
                            shareUrl={shareUrl}
                            canNativeShare={canNativeShare}
                            onCopy={handleCopy}
                            onNativeShare={handleNativeShare}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
