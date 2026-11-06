'use client';

/**
 * @file src/components/board/PrivateRoomWaitingBar.tsx
 * @description Bandeau d'attente d'adversaire pour Salon Privé sur le plateau (< 100 lignes, 0 any).
 */

import React, { useState, useCallback } from 'react';
import { Copy, Check, X, Clock, Link2 } from 'lucide-react';
import { buildPrivateRoomInviteUrl } from '../multiplayer/PrivateRoomModal';
import { useTranslation } from '../../i18n';

export interface PrivateRoomWaitingBarProps {
    readonly roomCode: string;
    readonly matchLength?: number;
    readonly onCancel: () => void;
}

export const PrivateRoomWaitingBar: React.FC<PrivateRoomWaitingBarProps> = ({
    roomCode,
    matchLength = 7,
    onCancel,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            const url = buildPrivateRoomInviteUrl(roomCode, matchLength);
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Ignore
        }
    }, [roomCode, matchLength]);

    return (
        <div
            data-testid="private-room-waiting-bar"
            className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/70 via-stone-900/80 to-amber-950/70 text-amber-200 text-xs shadow-md animate-fade-in z-20"
        >
            <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                <span>
                    {isEn ? 'Waiting for opponent...' : 'En attente de votre adversaire...'}
                </span>
                <span className="font-mono font-black text-white bg-black/60 px-2 py-0.5 rounded border border-amber-400/40 tracking-wider">
                    {roomCode}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    data-testid="copy-waiting-link-btn"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-400/40 transition"
                >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Link2 className="w-3 h-3" />}
                    <span>{copied ? (isEn ? 'Copied!' : 'Copié !') : (isEn ? 'Copy invite link' : 'Copier le lien')}</span>
                </button>
                <button
                    type="button"
                    data-testid="cancel-waiting-room-btn"
                    onClick={onCancel}
                    title={isEn ? 'Cancel private room' : 'Fermer le salon privé'}
                    className="inline-flex items-center justify-center p-1 rounded-lg bg-white/5 hover:bg-rose-950/50 hover:text-rose-300 text-stone-400 transition"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export default React.memo(PrivateRoomWaitingBar);
