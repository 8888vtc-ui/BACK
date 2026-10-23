'use client';

import React, { useState } from 'react';
import { isValidRoomCode } from '../../features/multiplayer/realtimeSchema';

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
    const [inputCode, setInputCode] = useState<string>('');
    const [joinError, setJoinError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState<boolean>(false);
    const [copiedCode, setCopiedCode] = useState<boolean>(false);

    const handleCopyCode = async (codeToCopy: string) => {
        try {
            await navigator.clipboard.writeText(codeToCopy);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        } catch {
            // fallback
        }
    };

    const handleCreateRoom = async () => {
        try {
            await onCreatePrivateRoom(selectedLength);
        } catch {
            // ignore
        }
    };

    const handleJoinWithCode = async (e: React.FormEvent) => {
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

    return (
        <div className="space-y-5" data-testid="private-room-tab">
            {privateRoomCode ? (
                /* Code créé, en attente de l'ami */
                <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5 text-center space-y-4">
                    <div className="text-xs uppercase font-bold tracking-wider text-amber-400">
                        Votre Salon Privé est ouvert
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        <span className="font-mono text-3xl font-black tracking-widest text-white bg-slate-800/90 border border-slate-700 px-5 py-2.5 rounded-2xl shadow-inner">
                            {privateRoomCode}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleCopyCode(privateRoomCode)}
                            className="rounded-xl bg-amber-500/20 border border-amber-500/40 px-3 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all"
                        >
                            {copiedCode ? '✓ Copié !' : '📋 Copier'}
                        </button>
                    </div>

                    <p className="text-xs text-slate-400">
                        Partagez ce code à un ami pour qu'il rejoigne votre partie en direct.
                    </p>

                    <div className="flex items-center justify-center gap-2 text-xs text-amber-300/80 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span>En attente de connexion de l'adversaire...</span>
                    </div>

                    <button
                        type="button"
                        onClick={onCancelSearch}
                        className="text-xs text-slate-400 hover:text-white underline transition"
                    >
                        Fermer ce salon
                    </button>
                </div>
            ) : (
                /* Choix Créer ou Rejoindre */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Créer */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                            <span>➕</span>
                            <span>Créer un Salon</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Générez un code unique et invitez un adversaire pour un match personnalisé.
                        </p>
                        <button
                            type="button"
                            onClick={handleCreateRoom}
                            className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 text-xs font-bold text-white transition-all shadow-sm"
                        >
                            Générer un code
                        </button>
                    </div>

                    {/* Rejoindre */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                            <span>🚪</span>
                            <span>Rejoindre par Code</span>
                        </div>
                        <form onSubmit={handleJoinWithCode} className="space-y-2">
                            <input
                                type="text"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                placeholder="Ex: BG-8492"
                                maxLength={7}
                                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono font-bold text-white uppercase placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                            />
                            {joinError && (
                                <div className="text-[10px] text-rose-400">{joinError}</div>
                            )}
                            <button
                                type="submit"
                                disabled={isJoining || inputCode.length < 4}
                                className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-2 text-xs font-bold text-slate-950 transition-all disabled:opacity-50"
                            >
                                {isJoining ? 'Connexion...' : 'Rejoindre'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
