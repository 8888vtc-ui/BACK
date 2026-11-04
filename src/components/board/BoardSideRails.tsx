'use client';

/**
 * @file src/components/board/BoardSideRails.tsx
 * @description Rail latéral gauche Joueur/Adversaire Haute-Horlogerie Monte-Carlo (< 260 lignes, 0 `any`).
 */

import React, { useEffect, useState } from 'react';
import { readPlayerPassport, STANDARD_USER_AVATARS } from '../../lib/supabase/auth';
import { toggleOrientation, getSavedOrientation, saveOrientation } from './boardOrientation';
import { BotPortraitMedallion, IconHorologyGear } from '../common/MonteCarloIcons';
import { CountryFlagSvg } from '../common/CountryFlagSvg';
import {
    BoardPortraitTopHud,
    BoardPortraitBottomHud,
    BoardRightActionRail,
    resolvePersonaMeta,
    type BoardLeftPlayerRailProps,
    type BoardRightActionRailProps,
} from './BoardPortraitAndActionRails';

export {
    BoardPortraitTopHud,
    BoardPortraitBottomHud,
    BoardRightActionRail,
    resolvePersonaMeta,
    type BoardLeftPlayerRailProps,
    type BoardRightActionRailProps,
};

export const BoardLeftPlayerRail: React.FC<BoardLeftPlayerRailProps> = React.memo(({
    difficulty = 'expert', locale = 'fr', isXTurn, scoreX, scoreO, cubeValue, matchLength, turn,
    opponentClock = '02:36', playerClock = '02:14', delaySeconds = 12, prX, prO, challengerProfile,
    opponentDice = null, onSendQuickChat,
    isBrowserFullscreen = false, isFocusFullBoard = true, onToggleFullscreen, onToggleCoach,
    onToggleTheme, onBackToLobby, canUndo = false, onUndo, autoConfirmEnabled = false, onToggleAutoConfirm,
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
    const [playerMeta, setPlayerMeta] = useState<{ pseudo: string; avatarUrl: string }>({
        pseudo: 'Vous',
        avatarUrl: STANDARD_USER_AVATARS[4]?.url ?? '/avatars/user-avatar-5.jpg',
    });
    useEffect(() => {
        const passport = readPlayerPassport();
        if (passport) {
            setPlayerMeta({
                pseudo: passport.pseudo || 'Vous',
                avatarUrl: passport.avatarUrl || (STANDARD_USER_AVATARS[4]?.url ?? '/avatars/user-avatar-5.jpg'),
            });
        }
    }, []);
    const {
        activePersona,
        botElo,
        playerPrValue,
        opponentPrValue,
        opponentDisplayName,
        opponentBadge,
        opponentPhotoUrl,
    } = resolvePersonaMeta(difficulty, locale, prX, prO, challengerProfile);

    const handleFlipDirection = () => {
        const next = toggleOrientation(getSavedOrientation());
        saveOrientation(next);
    };

    return (
        <aside
            aria-label="Joueurs et score du match"
            data-testid="board-left-player-rail"
            className="hidden md:flex [@media(max-height:500px)]:!flex relative flex-col items-center justify-between w-44 md:w-52 xl:w-60 [@media(max-height:540px)]:!w-[86px] [@media(max-height:540px)]:!max-w-[88px] shrink-0 h-full min-h-0 overflow-visible py-2 [@media(max-height:540px)]:!py-0.5 px-2 [@media(max-height:540px)]:!px-0.5 select-none rounded-2xl [@media(max-height:540px)]:!rounded-xl border border-[#d4af37]/25 bg-gradient-to-b from-[#130e09]/95 via-[#0d0a08]/95 to-[#130e09]/95 shadow-[0_16px_40px_rgba(0,0,0,0.85)] z-30"
        >
            {/* 1. CARTE HAUT (IA / Adversaire) */}
            <div className="flex w-full flex-col gap-1 [@media(max-height:540px)]:!gap-0.5 border-b border-[#d4af37]/20 pb-1.5 [@media(max-height:540px)]:!pb-0.5 [@media(max-height:540px)]:rounded-lg [@media(max-height:540px)]:border [@media(max-height:540px)]:border-[#d4af37]/30 [@media(max-height:540px)]:bg-[#14100c]/90 [@media(max-height:540px)]:p-1 shrink-0">
                <div className="flex w-full items-center justify-between gap-1.5 [@media(max-height:540px)]:flex-col [@media(max-height:540px)]:!gap-0.5">
                    <div className="[@media(max-height:540px)]:hidden flex flex-col items-center gap-0.5 min-w-0 flex-1">
                        <span className="truncate max-w-full font-display text-sm md:text-base italic font-black text-[#f7f3e8] leading-tight">
                            {opponentDisplayName}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#f3c65f]">
                            {challengerProfile?.countryName && <CountryFlagSvg countryName={challengerProfile.countryName} />}
                            <span>{opponentBadge}</span>
                        </span>
                        <BotPortraitMedallion
                            character={difficulty}
                            size="lg"
                            isActive={!isXTurn}
                            customPhotoUrl={challengerProfile ? opponentPhotoUrl : null}
                        />
                        <div className="flex items-center gap-1 text-[11px] font-semibold tabular-nums whitespace-nowrap">
                            <span className="font-mono text-stone-200 font-bold">{botElo} Elo</span>
                            {opponentPrValue !== '—' && (
                                <span className="rounded border border-[#d4af37]/50 bg-[#d4af37]/20 px-1 py-0.2 font-mono text-[9px] font-black text-[#f3d27a] whitespace-nowrap">
                                    PR {opponentPrValue}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="hidden [@media(max-height:540px)]:flex w-full flex-col items-center leading-none">
                        <span data-testid="left-rail-mobile-opp-name" title={opponentDisplayName} className="w-full truncate text-center text-[9.5px] font-bold text-[#f7f3e8] leading-tight">{opponentDisplayName}</span>
                        <span data-testid="left-rail-mobile-opp-elo" className="font-mono text-[8.5px] font-bold text-[#f3c65f] tabular-nums whitespace-nowrap">{botElo} Elo</span>
                    </div>

                    <div className="flex items-center justify-between w-full [@media(min-height:541px)]:w-auto gap-1">
                        <div className="hidden [@media(max-height:540px)]:relative [@media(max-height:540px)]:inline-flex shrink-0">
                            <img src={opponentPhotoUrl} alt={opponentDisplayName} className="h-5 w-5 rounded-full object-cover border border-[#18130f] ring-1 ring-[#d4af37] shadow" />
                            <span title="Pions Noirs (O)" className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#1A1D24] border border-[#d4af37]" />
                        </div>
                        {opponentDice && (
                            <span data-testid="left-rail-opp-mini-dice" title={`Dernier jet adverse : ${opponentDice[0]}-${opponentDice[1]}`} className="hidden [@media(max-height:540px)]:inline-flex items-center justify-center h-4 px-1 rounded bg-[#1A1D24] border border-[#d4af37]/60 font-mono text-[8.5px] font-black text-[#f3d27a] tabular-nums whitespace-nowrap">
                                {opponentDice[0]}-{opponentDice[1]}
                            </span>
                        )}
                        <div data-testid="left-rail-score-o" title="Points de l'adversaire" className="flex h-11 w-10 [@media(max-height:540px)]:!h-6 [@media(max-height:540px)]:!w-7 shrink-0 items-center justify-center rounded-xl [@media(max-height:540px)]:!rounded-md border-2 border-[#d4af37]/65 bg-gradient-to-b from-[#1a1510] to-[#090705] font-display text-xl [@media(max-height:540px)]:!text-sm font-black tabular-nums text-[#f7f3e8] shadow-inner">{scoreO}</div>
                    </div>

                    <div className={`hidden [@media(max-height:540px)]:flex w-full items-center justify-center rounded py-0.5 px-1 font-mono text-[10px] font-extrabold tabular-nums whitespace-nowrap leading-none ${turn === 'O' ? 'bg-[#b45309] text-[#fef3c7] ring-1 ring-[#f5dfa0]' : 'bg-[#080605] text-stone-300 border border-white/10'}`}>{opponentClock}</div>

                    <span title={`Performance Rating : ${opponentPrValue}`} className="hidden [@media(max-height:540px)]:inline-block w-full text-center rounded border border-[#d4af37]/50 bg-[#d4af37]/15 px-1 py-0.5 font-mono text-[9px] font-black text-[#f3d27a] whitespace-nowrap leading-none">PR {opponentPrValue}</span>
                </div>
                {challengerProfile ? (
                    <div data-testid="left-rail-online-status" className="[@media(max-height:540px)]:hidden flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-950/30 px-2 py-1 text-[10px] font-medium text-emerald-300/90">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Connecté · Match classé</span>
                    </div>
                ) : (
                    <p data-testid="left-rail-persona-quote" className="[@media(max-height:540px)]:hidden rounded-lg border border-[#d4af37]/25 bg-black/45 px-2 py-1 text-[10px] italic text-amber-100/90 leading-snug line-clamp-2 text-center">
                        « {activePersona.dialogues.opening.fun} »
                    </p>
                )}
            </div>

            {/* 2. CENTRE : Plaque de Match + Horloge */}
            <div className="[@media(max-height:540px)]:hidden flex w-full items-center justify-between gap-1 my-auto py-0.5 shrink-0">
                <div className="flex-1 rounded-xl border border-[#d4af37]/20 bg-[#14100c] px-1.5 py-1.5 text-center shadow-inner min-w-0">
                    <div className="text-[9px] uppercase tracking-wider text-stone-400">
                        Videau <span className="font-mono font-bold text-[#f3d27a]">×{cubeValue}</span>
                    </div>
                    <div className="mt-0.5 font-display text-xs italic font-bold text-[#f7f3e8] leading-tight truncate">
                        Match <span className="font-mono not-italic font-extrabold text-[#d4af37]">{matchLength > 0 ? `${matchLength} pts` : 'Libre'}</span>
                    </div>
                </div>

                <div data-testid="left-rail-clock-block" className="flex flex-col items-center justify-between rounded-xl border border-[#d4af37]/40 bg-[#080605] p-1 shadow-inner gap-0.5 shrink-0 w-13">
                    <div data-testid="left-rail-clock-opp" className={`w-full rounded-md py-0.5 px-1 text-center font-mono text-[10px] font-bold tabular-nums transition-all ${turn === 'O' ? 'bg-[#b45309] text-[#fef3c7] ring-1 ring-[#f5dfa0]' : 'bg-[#16120e] text-stone-400'}`}>{opponentClock}</div>
                    <div data-testid="left-rail-bronstein-delay" className="flex h-4 w-8 items-center justify-center rounded border border-[#d4af37]/50 bg-[#14100c] font-mono text-[9px] font-bold tabular-nums text-[#f3d27a]">+{delaySeconds}s</div>
                    <div data-testid="left-rail-clock-player" className={`w-full rounded-md py-0.5 px-1 text-center font-mono text-[10px] font-bold tabular-nums transition-all ${turn === 'X' ? 'bg-[#065f46] text-emerald-50 ring-1 ring-emerald-400/70' : 'bg-[#16120e] text-stone-400'}`}>{playerClock}</div>
                </div>
            </div>

            {/* Barre Centrale Mobile Paysage */}
            <div className="hidden [@media(max-height:540px)]:flex w-full items-center justify-center gap-1 my-auto py-0.5 relative">
                {canUndo && onUndo && (
                    <button type="button" data-testid="left-rail-mobile-undo-btn" onClick={onUndo} title="Annuler le dé joué" aria-label="Annuler le coup" className="flex h-7 w-8 items-center justify-center rounded-lg border border-amber-400/60 bg-amber-500/20 text-amber-200 font-bold text-xs shadow transition active:scale-95">↶</button>
                )}
                <button type="button" data-testid="left-rail-menu-btn" onClick={() => setIsMobileMenuOpen((v) => !v)} title="Menu & Paramètres de table" aria-label="Ouvrir le menu de table" aria-expanded={isMobileMenuOpen} className="flex flex-1 h-7 items-center justify-center gap-1 rounded-lg border border-[#d4af37]/45 bg-[#16110c] px-2 text-[10px] font-black uppercase tracking-wider text-[#f3d27a] shadow transition hover:border-[#d4af37] active:scale-95 whitespace-nowrap">
                    <IconHorologyGear className="text-[#f3d27a]" size={13} />
                    <span>Menu</span>
                </button>

                {isMobileMenuOpen && (
                    <div data-testid="left-rail-menu-popover" className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 z-50 w-56 rounded-2xl border border-[#d4af37]/50 bg-[#120e0a]/98 p-2 text-xs text-[#f7f3e8] shadow-[0_16px_40px_rgba(0,0,0,0.95)] backdrop-blur-md flex flex-col gap-1">
                        <div className="flex items-center justify-between pb-1 border-b border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#f3c65f]">⚙️ Menu de Table</span>
                            <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="text-[11px] text-stone-400 hover:text-white px-1">✕</button>
                        </div>
                        {onToggleAutoConfirm && (
                            <button type="button" data-testid="left-rail-auto-confirm-toggle" onClick={onToggleAutoConfirm} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-left text-[11px] font-semibold hover:border-[#d4af37]/50 transition">
                                <span>Validation auto des coups</span>
                                <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-black ${autoConfirmEnabled ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50' : 'bg-white/10 text-stone-300'}`}>{autoConfirmEnabled ? 'ON' : 'OFF'}</span>
                            </button>
                        )}
                        {onToggleFullscreen && (
                            <button type="button" onClick={() => { onToggleFullscreen(); setIsMobileMenuOpen(false); }} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold hover:border-[#d4af37]/50 transition">
                                <span>⛶ Plein écran</span><span className="text-[10px] text-[#f3d27a]">{isBrowserFullscreen ? 'Quitter' : 'Activer'}</span>
                            </button>
                        )}
                        {onToggleCoach && (
                            <button type="button" onClick={() => { onToggleCoach(); setIsMobileMenuOpen(false); }} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold hover:border-[#d4af37]/50 transition">
                                <span>🧭 Maître-Coach IA</span><span className="text-[10px] text-[#f3d27a]">{!isFocusFullBoard ? 'Masquer' : 'Ouvrir'}</span>
                            </button>
                        )}
                        <div className="grid grid-cols-2 gap-1">
                            {onToggleTheme && (
                                <button type="button" onClick={() => { onToggleTheme(); setIsMobileMenuOpen(false); }} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[10px] font-semibold text-center hover:border-[#d4af37]/50 transition">🎨 Tapis</button>
                            )}
                            <button type="button" onClick={() => { handleFlipDirection(); setIsMobileMenuOpen(false); }} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[10px] font-semibold text-center hover:border-[#d4af37]/50 transition">⇄ Sens 1..24</button>
                        </div>
                        {onBackToLobby && (
                            <button type="button" onClick={() => { setIsMobileMenuOpen(false); onBackToLobby(); }} className="flex items-center justify-between rounded-xl border border-rose-500/35 bg-rose-950/40 px-2.5 py-1.5 text-[11px] font-bold text-rose-200 hover:bg-rose-950/70 transition">
                                <span>🚪 Quitter la table</span><span className="text-[10px]">Salon →</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 3. CARTE BAS (Joueur Humain) */}
            <div className="relative flex w-full items-center justify-between gap-1.5 [@media(max-height:540px)]:flex-col [@media(max-height:540px)]:!gap-0.5 border-t border-[#d4af37]/20 pt-1.5 [@media(max-height:540px)]:!pt-0.5 [@media(max-height:540px)]:rounded-lg [@media(max-height:540px)]:border [@media(max-height:540px)]:border-[#d4af37]/30 [@media(max-height:540px)]:bg-[#14100c]/90 [@media(max-height:540px)]:p-1 shrink-0">
                <div className="[@media(max-height:540px)]:hidden flex flex-col items-center gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[11px] font-semibold tabular-nums whitespace-nowrap">
                        <span className="font-mono text-stone-200 font-bold">1500 Elo</span>
                    </div>
                    <BotPortraitMedallion character="player" size="lg" isActive={isXTurn} customPhotoUrl={playerMeta.avatarUrl} />
                    <span className="truncate max-w-full font-display text-sm md:text-base italic font-black text-[#f7f3e8] leading-tight">
                        {playerMeta.pseudo}
                    </span>
                </div>

                <div className="hidden [@media(max-height:540px)]:flex w-full flex-col items-center leading-none">
                    <span data-testid="left-rail-mobile-player-name" title={playerMeta.pseudo} className="w-full truncate text-center text-[9.5px] font-bold text-[#f7f3e8] leading-tight">{playerMeta.pseudo}</span>
                    <span data-testid="left-rail-mobile-player-elo" className="font-mono text-[8.5px] font-bold text-emerald-300/90 tabular-nums whitespace-nowrap">1500 Elo</span>
                </div>

                <div className="flex items-center justify-between w-full [@media(min-height:541px)]:w-auto gap-1">
                    <div className="hidden [@media(max-height:540px)]:relative [@media(max-height:540px)]:inline-flex shrink-0">
                        <img src={playerMeta.avatarUrl} alt={playerMeta.pseudo} className="h-5 w-5 rounded-full object-cover border border-[#f7f3e8] ring-1 ring-[#d4af37] shadow" />
                        <span title="Pions Blancs (X)" className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#f7f3e8] border border-[#3b2307]" />
                    </div>
                    <button type="button" data-testid="left-rail-quick-chat-toggle" onClick={() => setIsQuickChatOpen((v) => !v)} title="Réactions rapides" aria-label="Ouvrir les émojis rapides" aria-expanded={isQuickChatOpen} className="flex h-6 w-6 items-center justify-center rounded-md border border-[#d4af37]/40 bg-[#1a140e] text-[11px] hover:border-[#d4af37] active:scale-95 transition shrink-0">💬</button>
                    <div data-testid="left-rail-score-x" className="flex h-11 w-10 [@media(max-height:540px)]:!h-6 [@media(max-height:540px)]:!w-7 shrink-0 items-center justify-center rounded-xl [@media(max-height:540px)]:!rounded-md border-2 border-[#d4af37] bg-gradient-to-b from-[#f7f3e8] to-[#dfd3b8] font-display text-xl [@media(max-height:540px)]:!text-sm font-black tabular-nums text-[#0b0907] shadow-[0_4px_14px_rgba(212,175,55,0.28)]">{scoreX}</div>
                </div>

                {isQuickChatOpen && (
                    <div data-testid="left-rail-quick-chat-popover" role="group" aria-label="Messages rapides" className="absolute left-full ml-1.5 bottom-1 z-50 flex items-center gap-1 rounded-xl border border-[#d4af37]/55 bg-[#120e0a]/98 px-2 py-1 shadow-[0_12px_28px_rgba(0,0,0,0.95)] backdrop-blur-md">
                        {([{ id: 'gg' as const, label: '👋' }, { id: 'nice_move' as const, label: '👏' }, { id: 'unlucky' as const, label: '😅' }, { id: 'thanks' as const, label: '🙏' }]).map((chat) => (
                            <button key={chat.id} type="button" data-testid={`quick-chat-btn-${chat.id}`} onClick={() => { onSendQuickChat?.(chat.id); setIsQuickChatOpen(false); }} className="rounded-lg border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs hover:border-[#f3c65f]/50 hover:bg-white/10 transition active:scale-95">{chat.label}</button>
                        ))}
                    </div>
                )}

                <div className={`hidden [@media(max-height:540px)]:flex w-full items-center justify-center rounded py-0.5 px-1 font-mono text-[10px] font-extrabold tabular-nums whitespace-nowrap leading-none ${turn === 'X' ? 'bg-[#065f46] text-emerald-50 ring-1 ring-emerald-400/70' : 'bg-[#080605] text-stone-300 border border-white/10'}`}>{playerClock}</div>

                <span
                    data-testid="left-rail-player-pr"
                    className={`w-full [@media(min-height:541px)]:w-auto text-center rounded border px-1 py-0.5 font-mono text-[9px] font-black whitespace-nowrap leading-none ${
                        playerPrValue <= 4 ? 'border-emerald-400/50 bg-emerald-950/80 text-emerald-300' : playerPrValue <= 8 ? 'border-amber-400/50 bg-amber-950/80 text-amber-300' : 'border-rose-400/50 bg-rose-950/80 text-rose-300'
                    }`}
                >
                    PR {playerPrValue.toFixed(2)}
                </span>
            </div>
        </aside>
    );
});
BoardLeftPlayerRail.displayName = 'BoardLeftPlayerRail';
