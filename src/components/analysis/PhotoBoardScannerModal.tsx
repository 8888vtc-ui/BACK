'use client';

/**
 * @file src/components/analysis/PhotoBoardScannerModal.tsx
 * @description Modale d'Importation Photo 3-en-1 par Vision IA (Gemini Flash).
 * Zéro emoji, bilingue FR | EN, strictement <= 260 lignes, 0 any.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Image as ImageIcon, Sparkles, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { ScannedBoardVisionResult } from '../../lib/analysis/analysisStudioEngine';

export interface PhotoBoardScannerModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onScanComplete: (result: ScannedBoardVisionResult) => void;
}

export type HomeQuadrantPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export const PhotoBoardScannerModal: React.FC<PhotoBoardScannerModalProps> = ({
    isOpen,
    onClose,
    onScanComplete,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
    const [homePosition, setHomePosition] = useState<HomeQuadrantPosition>('bottom-right');
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [scanError, setScanError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleProcessImageFile = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            setScanError(isEn ? 'Please select a valid image file (.jpg, .png, .webp).' : 'Veuillez sélectionner un fichier image valide (.jpg, .png, .webp).');
            return;
        }
        setScanError(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
                setImagePreview(result);
            }
        };
        reader.readAsDataURL(file);
    }, [isEn]);

    useEffect(() => {
        if (!isOpen) return;

        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item && item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        e.preventDefault();
                        handleProcessImageFile(file);
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen, handleProcessImageFile]);

    if (!isOpen) return null;

    const handleRunVisionScan = async () => {
        if (!imagePreview) return;
        setIsScanning(true);
        setScanError(null);

        try {
            const res = await fetch('/api/vision-board-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageDataUrl: imagePreview,
                    playerColor,
                    homePosition,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.ok || !data.result) {
                throw new Error(data.error || 'Scan error');
            }

            onScanComplete(data.result as ScannedBoardVisionResult);
            onClose();
        } catch {
            setScanError(
                isEn
                    ? 'Unable to scan image right now. You can place checkers manually.'
                    : "Impossible de scanner l'image pour le moment. Vous pouvez ajuster les pions à la main.",
            );
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3">
            <div
                data-testid="photo-scanner-modal"
                className="relative w-full max-w-xl rounded-2xl border border-[#D4AF37]/40 bg-[#12151C] p-4 text-[#fdf8eb] shadow-2xl flex flex-col gap-3 max-h-[92dvh] overflow-y-auto"
            >
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                        <h2 className="text-sm font-black text-[#fdf8eb] uppercase tracking-wide">
                            {isEn ? 'Scan a Real Board (AI Vision)' : 'Scanner un Plateau Réel (Vision IA)'}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        data-testid="close-scanner-modal-btn"
                        className="rounded-lg border border-white/15 bg-white/5 p-1 text-xs text-stone-300 hover:text-white"
                    >
                        <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                </div>

                {!imagePreview ? (
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file) handleProcessImageFile(file);
                        }}
                        className="flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-[#D4AF37]/40 bg-[#070a10] p-6 text-center"
                    >
                        <div className="flex flex-wrap justify-center gap-2">
                            <button
                                type="button"
                                data-testid="scanner-open-camera-btn"
                                onClick={() => cameraInputRef.current?.click()}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/60 bg-[#D4AF37]/20 px-3 py-1.5 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/30 transition"
                            >
                                <Camera className="w-3.5 h-3.5" strokeWidth={1.5} />
                                <span>{isEn ? 'Take a Photo' : 'Prendre une photo'}</span>
                            </button>
                            <button
                                type="button"
                                data-testid="scanner-pick-file-btn"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-bold text-stone-200 hover:border-white/40 transition"
                            >
                                <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                                <span>{isEn ? 'Choose an Image' : 'Choisir une image'}</span>
                            </button>
                        </div>
                        <p className="text-[11px] text-stone-400">
                            {isEn ? 'or drag & drop a photo / Ctrl + V to paste a screenshot' : "ou glissez-déposez une photo / Ctrl + V pour coller une capture d'écran"}
                        </p>

                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleProcessImageFile(file);
                            }}
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleProcessImageFile(file);
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="relative max-h-48 w-full overflow-hidden rounded-xl border border-white/10 bg-black flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imagePreview} alt="Board preview" className="max-h-48 object-contain" />
                            <button
                                type="button"
                                onClick={() => setImagePreview(null)}
                                className="absolute top-1.5 right-1.5 rounded-lg bg-black/70 px-2 py-0.5 text-[10px] text-stone-300 hover:text-white"
                            >
                                {isEn ? 'Change photo' : 'Changer de photo'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-[#070a10] p-2">
                        <span className="font-bold text-[#D4AF37]">{isEn ? 'Your checkers:' : 'Vos pions :'}</span>
                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                onClick={() => setPlayerColor('white')}
                                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border py-1 font-semibold transition ${
                                    playerColor === 'white' ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-white' : 'border-white/10 text-stone-400'
                                }`}
                            >
                                <span className="inline-block h-2.5 w-2.5 rounded-full bg-white border border-stone-400" />
                                <span>{isEn ? 'Light / White' : 'Clairs / Blancs'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPlayerColor('black')}
                                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border py-1 font-semibold transition ${
                                    playerColor === 'black' ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-white' : 'border-white/10 text-stone-400'
                                }`}
                            >
                                <span className="inline-block h-2.5 w-2.5 rounded-full bg-stone-950 border border-white/40" />
                                <span>{isEn ? 'Dark / Black' : 'Foncés / Noirs'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-[#070a10] p-2">
                        <span className="font-bold text-[#D4AF37]">{isEn ? 'Your Home Board (Point 1):' : 'Votre Maison (Case 1) :'}</span>
                        <select
                            value={homePosition}
                            onChange={(e) => setHomePosition(e.target.value as HomeQuadrantPosition)}
                            className="w-full rounded-lg border border-white/15 bg-black/60 px-2 py-1 text-xs text-stone-200 focus:outline-none"
                        >
                            <option value="bottom-right">{isEn ? 'Bottom Right' : 'En bas à droite'}</option>
                            <option value="bottom-left">{isEn ? 'Bottom Left' : 'En bas à gauche'}</option>
                            <option value="top-right">{isEn ? 'Top Right' : 'En haut à droite'}</option>
                            <option value="top-left">{isEn ? 'Top Left' : 'En haut à gauche'}</option>
                        </select>
                    </div>
                </div>

                {scanError && (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-950/60 p-2 text-xs text-rose-200">
                        {scanError}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-1 border-t border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-stone-300 hover:text-white"
                    >
                        {isEn ? 'Cancel' : 'Annuler'}
                    </button>
                    <button
                        type="button"
                        data-testid="scanner-submit-btn"
                        disabled={!imagePreview || isScanning}
                        onClick={handleRunVisionScan}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/20 px-4 py-1.5 text-xs font-bold uppercase text-[#F3E5AB] hover:bg-[#D4AF37]/30 disabled:opacity-50 transition"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
                        <span>{isScanning ? (isEn ? 'AI Scanning...' : 'Reconnaissance IA...') : (isEn ? 'Reconstruct Board' : 'Reconstituer le plateau')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(PhotoBoardScannerModal);
