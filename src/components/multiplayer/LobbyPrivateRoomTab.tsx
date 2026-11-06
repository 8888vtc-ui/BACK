'use client';

import React, { useState } from 'react';
import { Plus, DoorOpen, Copy, Link2, Share2, Check } from 'lucide-react';
import { isValidRoomCode } from '../../features/multiplayer/realtimeSchema';
import { useTranslation } from '../../i18n';

export interface LobbyPrivateRoomTabProps {
    privateRoomCode: string | null;
    selectedLength: number;
    onCreatePrivateRoom: (matchLength: number) => Promise<string>;
    onJoinPrivateRoom: (code: string) => Promise<void>;
    onCancelSearch: () => void;
}

export const LobbyPrivateRoomTab: React.FC<LobbyPrivateRoomTabProps> = ({
    privateRoomCode,
    selectedLength,
    onCreatePrivateRoom,
    onJoinPrivateRoom,
    onCancelSearch,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const [inputCode, setInputCode] = useState<string>('');
    const [joinError, setJoinError] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState<boolean>(false);
    const [copiedCode, setCopiedCode] = useState<boolean>(false);
    const [copiedLink, setCopiedLink] = useState<boolean>(false);

    const handleCopyCode = async (codeToCopy: string) => {
        try {
            await navigator.clipboard.writeText(codeToCopy);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        } catch {
            // fallback
        }
    };

    const handleCopyInviteLink = async (code: string) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://backgammontour.com';
        const url = `${origin}/?join=${encodeURIComponent(code)}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch {
            // fallback
        }
    };

    const handleShareWhatsAppClub = async (code: string) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://backgammontour.com';
        const url = `${origin}/?join=${encodeURIComponent(code)}`;
        const title = isEn ? 'Backgammon Duel — Private Room' : 'Duel Backgammon — Salon Privé';
        const text = isEn
            ? `Join my private Backgammon room (${code}) for a live match!`
            : `Rejoins mon salon privé de Backgammon (${code}) pour un duel en direct !`;

        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
                await navigator.share({ title, text, url });
                return;
            } catch {
                // Annulé
            }
        }
        await handleCopyInviteLink(code);
    };

    const handleCreateRoom = async () => {
        setCreateError(null);
        try {
            await onCreatePrivateRoom(selectedLength);
        } catch (err: unknown) {
            setCreateError(
                err instanceof Error ? err.message : (isEn ? 'Unable to create room.' : 'Impossible de créer le salon.'),
            );
        }
    };

    const handleJoinWithCode = async (e: React.FormEvent) => {
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

    return (
        <div className="space-y-4" data-testid="private-room-tab">
            {privateRoomCode ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center space-y-4">
                    <div className="text-xs uppercase font-bold tracking-wider text-amber-300">
                        {isEn ? 'Your Private Room is Open' : 'Votre Salon Privé est ouvert'}
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        <span className="font-mono text-3xl font-black tracking-widest text-white bg-slate-900/90 border border-white/10 px-5 py-2.5 rounded-2xl shadow-inner">
                            {privateRoomCode}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleCopyCode(privateRoomCode)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37] px-3.5 py-2.5 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/25 transition-all"
                        >
                            {copiedCode ? <Check className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
                            <span>{copiedCode ? (isEn ? 'Copied!' : 'Copié !') : (isEn ? 'Copy' : 'Copier')}</span>
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => handleCopyInviteLink(privateRoomCode)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-950/40 hover:bg-sky-900/50 py-2 px-3 text-xs font-bold text-sky-200 transition"
                        >
                            <Link2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span>{copiedLink ? (isEn ? 'Link copied!' : 'Lien copié !') : (isEn ? 'Copy direct link' : 'Copier le lien direct')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleShareWhatsAppClub(privateRoomCode)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/50 py-2 px-3 text-xs font-bold text-emerald-200 transition"
                        >
                            <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span>{isEn ? 'Share (WhatsApp / Club)' : 'Partager (WhatsApp / Club)'}</span>
                        </button>
                    </div>

                    <p className="text-xs text-slate-300">
                        {isEn
                            ? 'Share this code or link with a friend so they can join your live game in 1 click.'
                            : 'Partagez ce code ou lien à un ami pour qu’il rejoigne votre partie en direct en 1 clic.'}
                    </p>

                    <div className="flex items-center justify-center gap-2 text-xs text-amber-300/90 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span>{isEn ? 'Waiting for opponent to connect...' : 'En attente de connexion de l’adversaire...'}</span>
                    </div>

                    <button
                        type="button"
                        onClick={onCancelSearch}
                        className="text-xs text-slate-400 hover:text-white underline transition"
                    >
                        {isEn ? 'Close this room' : 'Fermer ce salon'}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Créer */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between gap-3">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm font-bold text-white">
                                <Plus className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                                <span>{isEn ? 'Create a Room' : 'Créer un Salon'}</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {isEn
                                    ? 'Generate a unique code and invite a friend for a custom duel.'
                                    : 'Générez un code unique et invitez un ami pour un duel sur mesure.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleCreateRoom}
                            className="w-full rounded-xl border border-white/10 bg-white/10 hover:border-white/25 hover:bg-white/15 py-2.5 text-xs font-bold text-white transition-all"
                        >
                            {isEn ? 'Generate code' : 'Générer un code'}
                        </button>
                        {createError && (
                            <div className="text-xs text-rose-400">{createError}</div>
                        )}
                    </div>

                    {/* Rejoindre (style secondaire sobre — Règle d'Un Seul Bouton Plein Or) */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                            <DoorOpen className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                            <span>{isEn ? 'Join by Code' : 'Rejoindre par Code'}</span>
                        </div>
                        <form onSubmit={handleJoinWithCode} className="space-y-2.5">
                            <input
                                id="private-room-code-input"
                                name="privateRoomCode"
                                aria-label={isEn ? 'Private room code (e.g. BG-8492)' : 'Code du salon privé (ex: BG-8492)'}
                                type="text"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                placeholder={isEn ? 'E.G.: BG-8492' : 'EX: BG-8492'}
                                maxLength={7}
                                className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs font-mono font-bold text-white uppercase placeholder-slate-500 focus:border-[#D4AF37] focus:outline-none"
                            />
                            {joinError && (
                                <div className="text-xs text-rose-400">{joinError}</div>
                            )}
                            <button
                                type="submit"
                                disabled={isJoining || inputCode.length < 4}
                                className="w-full rounded-xl bg-white/10 hover:bg-white/15 text-white border border-[#D4AF37]/40 py-2 text-xs font-bold transition-all disabled:opacity-50"
                            >
                                {isJoining ? (isEn ? 'Connecting...' : 'Connexion...') : (isEn ? 'Join' : 'Rejoindre')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
