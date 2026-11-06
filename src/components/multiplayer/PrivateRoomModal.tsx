'use client';

/**
 * Modale Salon Privé — Lien d'invitation directe 1-clic & Partage WhatsApp / Club (P3).
 * Conforme à SCALABILITY.md (< 270 lignes, 0 any, 0 emoji, 1 seul bouton plein Or).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyRound, Plus, DoorOpen, Copy, Link2, Share2, Check, X } from 'lucide-react';
import { isValidRoomCode } from '../../features/multiplayer/realtimeSchema';
import { useTranslation } from '../../i18n';

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
    { pts: 0, label: 'Money Game', sub: 'Jacoby' },
    { pts: 3, label: '3 pts', sub: 'Rapide' },
    { pts: 5, label: '5 pts', sub: 'Standard' },
    { pts: 7, label: '7 pts', sub: 'Tournoi' },
    { pts: 9, label: '9 pts', sub: 'Championship' },
    { pts: 11, label: '11 pts', sub: 'Master' },
];

export function buildPrivateRoomInviteUrl(roomCode: string, matchLength: number = 7): string {
    const origin = typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://backgammontour.com';
    const matchParam = matchLength && matchLength > 0 ? `&match=${matchLength}` : '';
    return `${origin}/play?room=${encodeURIComponent(roomCode.trim().toUpperCase())}${matchParam}`;
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
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const [selectedLength, setSelectedLength] = useState<number>(7);
    const [inputCode, setInputCode] = useState<string>(initialRoomCode ?? '');
    const [joinError, setJoinError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState<boolean>(false);
    const [copiedCode, setCopiedCode] = useState<boolean>(false);
    const [copiedLink, setCopiedLink] = useState<boolean>(false);
    const hasAutoAttemptedRef = useRef<string | null>(null);

    useEffect(() => {
        if (initialRoomCode) {
            const normalized = initialRoomCode.trim().toUpperCase();
            setInputCode(normalized);
            if (
                autoConnect &&
                isValidRoomCode(normalized) &&
                !privateRoomCode &&
                hasAutoAttemptedRef.current !== normalized
            ) {
                hasAutoAttemptedRef.current = normalized;
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
        const title = isEn ? 'Backgammon Duel — Private Room' : 'Duel Backgammon — Salon Privé';
        const text = isEn
            ? `Join my private Backgammon room (${code}) for a live match!`
            : `Rejoins mon salon privé de Backgammon (${code}) pour un duel en direct !`;
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
                await navigator.share({ title, text, url });
                return;
            } catch { /* Annulé */ }
        }
        await handleCopyInviteLink(code);
    }, [handleCopyInviteLink, isEn]);

    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = inputCode.trim().toUpperCase();
        if (!isValidRoomCode(code)) {
            setJoinError(isEn ? 'Invalid code format (e.g. BG-8492)' : 'Format de code invalide (ex: BG-8492)');
            return;
        }
        setJoinError(null);
        setIsJoining(true);
        try {
            await onJoinPrivateRoom(code);
        } catch (err: unknown) {
            setJoinError(err instanceof Error ? err.message : (isEn ? 'Unable to join room.' : 'Impossible de rejoindre le salon.'));
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
                    aria-label={isEn ? 'Close private room' : 'Fermer le salon privé'}
                >
                    <X className="w-4 h-4" strokeWidth={1.5} />
                </button>

                <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]">
                        <KeyRound className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <div>
                        <h2 className="text-base font-extrabold text-white">
                            {isEn ? 'Private Room for Friends & Club' : 'Salon Privé entre Amis & Club'}
                        </h2>
                        <p className="text-xs text-slate-400">
                            {isEn ? 'Exclusive invite code & 1-click direct link' : 'Code d’invitation exclusif & lien direct en 1 clic'}
                        </p>
                    </div>
                </div>

                {privateRoomCode ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center space-y-4">
                        <div className="text-xs uppercase font-bold tracking-wider text-amber-300">
                            {isEn ? 'Your Private Room is Open' : 'Votre Salon Privé est ouvert'}
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <span data-testid="private-room-code-display" className="font-mono text-3xl font-black tracking-widest text-white bg-slate-900/90 border border-white/10 px-5 py-2.5 rounded-2xl shadow-inner">
                                {privateRoomCode}
                            </span>
                            <button
                                type="button"
                                data-testid="copy-room-code-btn"
                                onClick={() => handleCopyCode(privateRoomCode)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37] px-3.5 py-2.5 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/25 transition"
                            >
                                {copiedCode ? <Check className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
                                <span>{copiedCode ? (isEn ? 'Code Copied!' : 'Code Copié !') : (isEn ? 'Copy code' : 'Copier le code')}</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                            <button
                                type="button"
                                data-testid="copy-invite-link-btn"
                                onClick={() => handleCopyInviteLink(privateRoomCode)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-950/40 hover:bg-sky-900/50 py-2.5 px-3 text-xs font-bold text-sky-200 transition"
                            >
                                <Link2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                <span>{copiedLink ? (isEn ? 'Link copied!' : 'Lien copié !') : (isEn ? 'Copy direct link' : 'Copier le lien direct')}</span>
                            </button>
                            <button
                                type="button"
                                data-testid="share-whatsapp-btn"
                                onClick={() => handleShareWhatsAppClub(privateRoomCode)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/50 py-2.5 px-3 text-xs font-bold text-emerald-200 transition"
                            >
                                <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                <span>{isEn ? 'Share (WhatsApp / Club)' : 'Partager (WhatsApp / Club)'}</span>
                            </button>
                        </div>
                        <p className="text-xs text-slate-300">
                            {isEn
                                ? 'Your friend will open the game and join your room immediately in 1 click.'
                                : 'Votre ami ouvrira le jeu et rejoindra votre salle immédiatement en 1 clic sans rien installer.'}
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-amber-300/90 animate-pulse pt-2">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            <span>{isEn ? 'Waiting for opponent to connect...' : 'En attente de connexion de l’adversaire...'}</span>
                        </div>
                        <button type="button" onClick={onCancelSearch} className="text-xs text-slate-400 hover:text-white underline transition">
                            {isEn ? 'Close this room' : 'Fermer ce salon'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2">
                                {isEn ? 'Match format:' : 'Format du match :'}
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {MATCH_FORMATS.map((format) => {
                                    const active = selectedLength === format.pts;
                                    return (
                                        <button
                                            key={format.pts}
                                            type="button"
                                            onClick={() => setSelectedLength(format.pts)}
                                            className={`flex flex-col items-center justify-center rounded-xl border p-2 transition-all ${
                                                active
                                                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white ring-1 ring-[#D4AF37]/40'
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
                                        <Plus className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                                        <span>{isEn ? 'Create a Room' : 'Créer un Salon'}</span>
                                    </div>
                                    <p className="text-xs text-slate-300">
                                        {isEn ? 'Generate a unique code and share it in 1 click.' : 'Générez un code unique et partagez-le en 1 clic.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    data-testid="create-room-btn"
                                    onClick={() => onCreatePrivateRoom(selectedLength)}
                                    className="w-full rounded-xl bg-gradient-to-b from-[#E5C158] via-[#D4AF37] to-[#B5902B] py-2.5 text-xs font-bold uppercase text-black transition hover:brightness-105"
                                >
                                    {isEn ? 'Generate code' : 'Générer un code'}
                                </button>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                                        <DoorOpen className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                                        <span>{isEn ? 'Join by Code' : 'Rejoindre par Code'}</span>
                                    </div>
                                    <p className="text-xs text-slate-300">
                                        {isEn ? 'Paste the received code (e.g. BG-8492).' : 'Collez le code reçu (ex: BG-8492).'}
                                    </p>
                                </div>
                                <form onSubmit={handleJoinSubmit} className="space-y-2">
                                    <input
                                        id="private-room-input"
                                        aria-label={isEn ? 'Private room code (e.g. BG-8492)' : 'Code du salon privé (ex: BG-8492)'}
                                        type="text"
                                        value={inputCode}
                                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                        placeholder="Ex: BG-8492"
                                        maxLength={7}
                                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs font-mono font-bold text-white uppercase placeholder-slate-500 focus:border-[#D4AF37] focus:outline-none"
                                    />
                                    {joinError && <div className="text-xs text-rose-400">{joinError}</div>}
                                    <button
                                        type="submit"
                                        data-testid="join-room-btn"
                                        disabled={isJoining || inputCode.length < 4}
                                        className="w-full rounded-xl bg-white/10 hover:bg-white/15 text-white border border-[#D4AF37]/40 py-2 text-xs font-bold transition disabled:opacity-50"
                                    >
                                        {isJoining ? (isEn ? 'Connecting...' : 'Connexion...') : (isEn ? 'Join in 1 click' : 'Rejoindre en 1 clic')}
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
