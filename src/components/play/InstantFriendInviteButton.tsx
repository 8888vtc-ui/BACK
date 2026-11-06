'use client';

/**
 * @file src/components/play/InstantFriendInviteButton.tsx
 * @description Bouton & Modal de Partage de Jeu 1-Clic (< 3 secondes, sans inscription bloquante).
 * Génère le lien instantané /play?inviteRoom=bg_xxxx&match=X et gère l'attente active (< 260 lignes, 0 any).
 */

import React, { useState, useCallback } from 'react';
import { Share2, Copy, Check, Users, ShieldCheck, X } from 'lucide-react';
import { generateRoomCode } from '../../features/multiplayer/realtimeSchema';
import { useTranslation } from '../../i18n';

export interface InstantFriendInviteButtonProps {
  readonly matchLength?: number;
  readonly onCreateRoom?: (matchLength: number) => Promise<string>;
  readonly onInviteCreated?: (roomId: string, inviteUrl: string) => void;
  readonly isWaitingOpponent?: boolean;
  readonly onCancelInvite?: () => void;
  readonly className?: string;
}

export function buildInstantInviteUrl(roomCode: string, matchLength: number = 5): string {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://backgammontour.com';
  return `${origin}/play?room=${encodeURIComponent(roomCode.trim().toUpperCase())}&match=${matchLength}`;
}

export const InstantFriendInviteButton: React.FC<InstantFriendInviteButtonProps> = ({
  matchLength = 5,
  onCreateRoom,
  onInviteCreated,
  isWaitingOpponent = false,
  onCancelInvite,
  className = '',
}) => {
  const { locale } = useTranslation();
  const isEn = locale === 'en';
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [selectedLength, setSelectedLength] = useState<number>(matchLength);

  const handleOpenModal = useCallback(async () => {
    let code = currentCode;
    if (!code) {
      if (onCreateRoom) {
        try {
          code = await onCreateRoom(selectedLength);
        } catch {
          code = generateRoomCode();
        }
      } else {
        code = generateRoomCode();
      }
      setCurrentCode(code);
    }
    setCopied(false);
    setIsOpen(true);
    const url = buildInstantInviteUrl(code, selectedLength);
    onInviteCreated?.(code, url);
  }, [currentCode, selectedLength, onCreateRoom, onInviteCreated]);

  const handleSelectLength = useCallback(async (len: number) => {
    setSelectedLength(len);
    if (onCreateRoom) {
      try {
        const code = await onCreateRoom(len);
        setCurrentCode(code);
        const url = buildInstantInviteUrl(code, len);
        onInviteCreated?.(code, url);
      } catch { /* fallback */ }
    }
  }, [onCreateRoom, onInviteCreated]);

  const handleCopyLink = useCallback(async () => {
    const url = buildInstantInviteUrl(currentCode, selectedLength);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  }, [currentCode, selectedLength]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleCancelRoom = () => {
    onCancelInvite?.();
    setCurrentCode('');
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        data-testid="instant-friend-invite-btn"
        onClick={handleOpenModal}
        title={isEn ? 'Invite a Friend (1-Click)' : 'Inviter un ami (1 Clic)'}
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[#d4af37]/60 bg-gradient-to-r from-[#1c140c] via-[#281c10] to-[#1c140c] px-3.5 py-2 text-xs sm:text-sm font-bold text-[#f3d27a] shadow-lg transition-all duration-200 hover:border-[#f3d27a] hover:brightness-110 active:scale-95 ${className}`}
      >
        <Share2 className="w-4 h-4 text-[#d4af37]" />
        <span>{isEn ? 'Invite a Friend' : 'Inviter un ami'}</span>
      </button>

      {isOpen && (
        <div
          data-testid="instant-invite-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-[#d4af37]/50 bg-[#0d0a08] p-5 text-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#d4af37]" />
                <h3 className="font-display text-base font-bold text-[#f7f3e8]">
                  {isEn ? 'Invite a Friend in 1 Click' : 'Inviter un ami en 1 Clic'}
                </h3>
              </div>
              <button
                type="button"
                data-testid="invite-modal-close-btn"
                onClick={handleClose}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Format selection */}
            <div className="mt-4 flex flex-col gap-2">
              <label className="text-xs font-semibold text-stone-300">
                {isEn ? 'Match Format :' : 'Format de match :'}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[3, 5, 7, 0].map((len) => (
                  <button
                    key={len}
                    type="button"
                    data-testid={`invite-length-btn-${len}`}
                    onClick={() => handleSelectLength(len)}
                    className={`rounded-lg py-1.5 text-xs font-mono font-bold transition border ${
                      selectedLength === len
                        ? 'border-[#f3d27a] bg-[#d4af37]/20 text-white'
                        : 'border-white/10 bg-white/5 text-stone-300 hover:border-white/30'
                    }`}
                  >
                    {len === 0 ? (isEn ? 'Money' : 'Libre') : `${len} pts`}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Link Box */}
            <div className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs text-stone-300 font-medium">
                {isEn ? 'Shareable Game Link (< 3 seconds) :' : 'Lien direct à envoyer à ton ami :'}
              </span>
              <div className="flex items-center gap-1.5 rounded-xl border border-[#d4af37]/40 bg-black/60 p-2 font-mono text-xs text-[#f3d27a]">
                <input
                  type="text"
                  readOnly
                  data-testid="invite-link-input"
                  value={buildInstantInviteUrl(currentCode, selectedLength)}
                  className="w-full bg-transparent outline-none truncate text-stone-200 text-xs"
                />
                <button
                  type="button"
                  data-testid="invite-copy-link-btn"
                  onClick={handleCopyLink}
                  className={`inline-flex items-center gap-1 shrink-0 rounded-lg px-3 py-1 text-xs font-bold transition ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#d4af37] text-slate-950 hover:bg-[#f3d27a]'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (isEn ? 'Copied!' : 'Copié !') : (isEn ? 'Copy' : 'Copier')}</span>
                </button>
              </div>
            </div>

            {/* Guarantee Badge */}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-2.5 text-xs text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {isEn
                  ? 'Zero signup required. Your friend opens the link and plays instantly.'
                  : 'Zéro inscription requise. Ton ami clique sur le lien et la partie commence immédiatement.'}
              </span>
            </div>

            {/* Active Waiting state */}
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-stone-300">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span>{isEn ? 'Waiting for opponent...' : 'En attente de ton adversaire...'}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-testid="invite-cancel-room-btn"
                  onClick={handleCancelRoom}
                  className="text-xs text-rose-400 hover:text-rose-300 underline"
                >
                  {isEn ? 'Cancel' : 'Annuler'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs text-stone-400 hover:text-white underline"
                >
                  {isEn ? 'Close' : 'Fermer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

InstantFriendInviteButton.displayName = 'InstantFriendInviteButton';
