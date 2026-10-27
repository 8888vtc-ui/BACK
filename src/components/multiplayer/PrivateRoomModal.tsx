'use client';

/**
 * Modale Salon Privé — Lien d'invitation directe 1-clic & Partage WhatsApp / Club (P3).
 *
 * Conforme à SCALABILITY.md (< 300 lignes, 0 any).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { isValidRoomCode } from '../../features/multiplayer/realtimeSchema';

export interface PrivateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    privateRoomCode: string | null;
    onCreatePrivateRoom: (matchLength: number) => Promise<string>;
    onJoinPrivateRoom: (code: string) => Promise<void>;
    onCancelSearch: () => void;
    initialRoomCode?: string | null;
    autoConnect?: boolean;
}

const MATCH_FORMATS: ReadonlyArray<{ pts: number; label: string; sub: string }> = [
    { pts: 1, label: '1 pt', sub: 'Blitz' },
    { pts: 3, label: '3 pts', sub: 'Rapide' },
    { pts: 5, label: '5 pts', sub: 'Standard' },
    { pts: 7, label: '7 pts', sub: 'Tournoi' },
];

export function buildPrivateRoomInviteUrl(roomCode: string): string {
    if (typeof window === 'undefined') return `https://backgammontour.com/?join=${roomCode}`;
    return `${window.location.origin}/?join=${encodeURIComponent(roomCode)}`;
}

export const PrivateRoomModal: React.FC<PrivateRoomModalProps> = ({
    isOpen,
    onClose,
    privateRoomCode,
    onCreatePrivateRoom,
    onJoinPrivateRoom,
    onCancelSearch,
    initialRoomCode = null,
    autoConnect = false,
}) => {
    const [selectedLength, setSelectedLength] = useState<number>(7);
    const [inputCode, setInputCode] = useState<string>(initialRoomCode ?? '');
    const [joinError, setJoinError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState<boolean>(false);
    const [copiedCode, setCopiedCode] = useState<boolean>(false);
    const [copiedLink, setCopiedLink] = useState<boolean>(false);

    useEffect(() => {
        if (initialRoomCode) {
            const normalized = initialRoomCode.trim().toUpperCase();
            setInputCode(normalized);
            if (autoConnect && isValidRoomCode(normalized) && !privateRoomCode) {
                void onJoinPrivateRoom(normalized).catch((err: unknown) => {
                    setJoinError(err instanceof Error ? err.message : 'Échec de connexion automatique.');
                });
            }
        }
    }, [initialRoomCode, autoConnect, privateRoomCode, onJoinPrivateRoom]);

    const handleCopyCode = useCallback(async (codeToCopy: string) => {
        try {
            await navigator.clipboard.writeText(codeToCopy);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        } catch { /* ignore */ }
    }, []);

    const handleCopyInviteLink = useCallback(async (code: string) => {
        try {
            await navigator.clipboard.writeText(buildPrivateRoomInviteUrl(code));
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch { /* ignore */ }
    }, []);

    const handleShareWhatsAppClub = useCallback(async (code: string) => {
        const url = buildPrivateRoomInviteUrl(code);
        const title = 'Duel Backgammon — Salon Privé';
        const text = `Rejoins mon salon privé de Backgammon (${code}) pour un duel en direct !`;
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
                await navigator.share({ title, text, url });
                return;
            } catch { /* Annulé */ }
        }
        await handleCopyInviteLink(code);
    }, [handleCopyInviteLink]);

    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = inputCode.trim().toUpperCase();
        if (!isValidRoomCode(code)) {
            setJoinError('Format de code invalide (ex: BG-8492)');
            return;
        }
        setJoinError(null);
        setIsJoining(true);
        try {
            await onJoinPrivateRoom(code);
        } catch (err: unknown) {
            setJoinError(err instanceof Error ? err.message : 'Impossible de rejoindre le salon.');
        } finally {
            setIsJoining(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" data-testid="private-room-modal">
            <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-gradient-to-b from-[#18110b]/98 via-[#0e121d]/98 to-[#070a10]/98 p-6 text-[#fdf8eb] shadow-[0_28px_80px_rgba(0,0,0,0.95)]">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white transition"
                    aria-label="Fermer le salon privé"
                >
                    ✕
                </button>

                <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
                    <span className="text-2xl">🔑</span>
                    <div>
                        <h2 className="text-base font-extrabold text-white">Salon Privé entre Amis &amp; Club</h2>
                        <p className="text-xs text-slate-400">Code d&apos;invitation exclusif &amp; lien direct en 1 clic</p>
                    </div>
                </div>

                {privateRoomCode ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center space-y-4">
                        <div className="text-xs uppercase font-bold tracking-wider text-amber-300">Votre Salon Privé est ouvert</div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <span data-testid="private-room-code-display" className="font-mono text-3xl font-black tracking-widest text-white bg-slate-900/90 border border-white/10 px-5 py-2.5 rounded-2xl shadow-inner">
                                {privateRoomCode}
                            </span>
                            <button
                                type="button"
                                data-testid="copy-room-code-btn"
                                onClick={() => handleCopyCode(privateRoomCode)}
                                className="rounded-xl bg-[#f3c65f]/15 border border-[#f3c65f] px-3.5 py-2.5 text-xs font-bold text-[#f3c65f] hover:bg-[#f3c65f]/25 transition"
                            >
                                {copiedCode ? '✓ Code Copié !' : '📋 Copier le code'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                            <button
                                type="button"
                                data-testid="copy-invite-link-btn"
                                onClick={() => handleCopyInviteLink(privateRoomCode)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-950/40 hover:bg-sky-900/50 py-2.5 px-3 text-xs font-bold text-sky-200 transition"
                            >
                                <span>🔗</span>
                                <span>{copiedLink ? '✓ Lien copié !' : 'Copier le lien direct'}</span>
                            </button>
                            <button
                                type="button"
                                data-testid="share-whatsapp-btn"
                                onClick={() => handleShareWhatsAppClub(privateRoomCode)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/50 py-2.5 px-3 text-xs font-bold text-emerald-200 transition"
                            >
                                <span>💬</span>
                                <span>Partager (WhatsApp / Club)</span>
                            </button>
                        </div>
                        <p className="text-xs text-slate-300">Votre ami ouvrira le jeu et rejoindra votre salle immédiatement en 1 clic sans rien installer.</p>
                        <div className="flex items-center justify-center gap-2 text-xs text-amber-300/90 animate-pulse pt-2">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            <span>En attente de connexion de l&apos;adversaire...</span>
                        </div>
                        <button type="button" onClick={onCancelSearch} className="text-xs text-slate-400 hover:text-white underline transition">
                            Fermer ce salon
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2">Format du match :</label>
                            <div className="grid grid-cols-4 gap-2">
                                {MATCH_FORMATS.map((format) => {
                                    const active = selectedLength === format.pts;
                                    return (
                                        <button
                                            key={format.pts}
                                            type="button"
                                            onClick={() => setSelectedLength(format.pts)}
                                            className={`flex flex-col items-center justify-center rounded-xl border p-2 transition-all ${
                                                active
                                                    ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white ring-1 ring-[#f3c65f]/40'
                                                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white'
                                            }`}
                                        >
                                            <span className="text-xs font-bold">{format.label}</span>
                                            <span className="text-[10px] text-slate-400">{format.sub}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                                        <span>➕</span>
                                        <span>Créer un Salon</span>
                                    </div>
                                    <p className="text-xs text-slate-300">Générez un code unique et partagez-le en 1 clic.</p>
                                </div>
                                <button
                                    type="button"
                                    data-testid="create-room-btn"
                                    onClick={() => onCreatePrivateRoom(selectedLength)}
                                    className="w-full rounded-xl border border-[#f3c65f] bg-gradient-to-b from-[#fff5cf] via-[#f0c75e] to-[#b87e14] py-2.5 text-xs font-black uppercase text-slate-950 transition hover:brightness-105"
                                >
                                    Générer un code
                                </button>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                                        <span>🚪</span>
                                        <span>Rejoindre par Code</span>
                                    </div>
                                    <p className="text-xs text-slate-300">Collez le code reçu (ex: BG-8492).</p>
                                </div>
                                <form onSubmit={handleJoinSubmit} className="space-y-2">
                                    <input
                                        id="private-room-input"
                                        aria-label="Code du salon privé (ex: BG-8492)"
                                        type="text"
                                        value={inputCode}
                                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                        placeholder="Ex: BG-8492"
                                        maxLength={7}
                                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs font-mono font-bold text-white uppercase placeholder-slate-500 focus:border-[#f3c65f] focus:outline-none"
                                    />
                                    {joinError && <div className="text-xs text-rose-400">{joinError}</div>}
                                    <button
                                        type="submit"
                                        data-testid="join-room-btn"
                                        disabled={isJoining || inputCode.length < 4}
                                        className="w-full rounded-xl border border-white/10 bg-amber-500 hover:bg-amber-400 py-2 text-xs font-bold text-slate-950 transition disabled:opacity-50"
                                    >
                                        {isJoining ? 'Connexion...' : 'Rejoindre en 1 clic'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(PrivateRoomModal);
