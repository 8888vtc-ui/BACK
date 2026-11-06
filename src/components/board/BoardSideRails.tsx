'use client';

/**
 * @file src/components/board/BoardSideRails.tsx
 * @description Rail latéral gauche Joueur/Adversaire Haute-Horlogerie Monte-Carlo (< 260 lignes, 0 `any`).
 */

import React, { useEffect, useState } from 'react';
import { readPlayerPassport, STANDARD_USER_AVATARS } from '../../lib/supabase/auth';
import { getAllGameAnalyses } from '../../features/rating/gameAnalysisStorage';
import { toggleOrientation, getSavedOrientation, saveOrientation } from './boardOrientation';
import { BotPortraitMedallion, IconHorologyGear } from '../common/MonteCarloIcons';
import { CountryFlagSvg } from '../common/CountryFlagSvg';
import {
    BoardPortraitTopHud, BoardPortraitBottomHud, BoardRightActionRail,
    BOARD_SWATCH_OPTIONS, resolvePersonaMeta, resolvePrBadgeClasses,
    type BoardLeftPlayerRailProps, type BoardRightActionRailProps,
} from './BoardPortraitAndActionRails';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';

export {
    BoardPortraitTopHud, BoardPortraitBottomHud, BoardRightActionRail,
    resolvePersonaMeta, type BoardLeftPlayerRailProps, type BoardRightActionRailProps,
};

export const BoardLeftPlayerRail: React.FC<BoardLeftPlayerRailProps> = React.memo(({
    difficulty = 'expert', locale = 'fr', isXTurn, scoreX, scoreO, cubeValue, matchLength, turn,
    opponentClock = '02:36', playerClock = '02:14', delaySeconds = 12, prX, prO, challengerProfile,
    opponentDice = null, onSendQuickChat, crawford = false, isDMP = false, isGuidedMode = false,
    isBrowserFullscreen = false, isFocusFullBoard = true, onToggleFullscreen, onToggleCoach,
    onBackToLobby, canUndo = false, onUndo, autoConfirmEnabled = false, onToggleAutoConfirm,
    autoRollEnabled = false, onToggleAutoRoll,
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
    const { theme: activeTheme, setTheme } = useBoardTheme();
    const { tierGate } = usePlayerTierGate();
    const isBeginner = tierGate === 'BEGINNER';
    const isEn = locale === 'en';
    const isGuided = Boolean(isGuidedMode || isBeginner || difficulty === 'beginner');
    const [playerMeta, setPlayerMeta] = useState<{ pseudo: string; avatarUrl: string; countryName: string; isGuest: boolean; careerPr: number | null }>({
        pseudo: isEn ? 'Guest Player' : 'Joueur Invité', avatarUrl: STANDARD_USER_AVATARS[4]?.url ?? '/avatars/user-avatar-5.jpg', countryName: 'France', isGuest: true, careerPr: null,
    });
    useEffect(() => {
        const passport = readPlayerPassport();
        const rawPseudo = (passport?.pseudo ?? '').trim();
        const isGuest = !passport || passport.email === 'invite@backgammontour.com' || /^invit[eé]|^joueur invit[eé]/i.test(rawPseudo);
        let careerPr: number | null = null;
        if (!isGuest) {
            const analyses = getAllGameAnalyses();
            let totalLoss = 0, totalDec = 0;
            for (const a of analyses) {
                const dec = a.unforcedDecisionsCount || a.decisionsCount || 0;
                if (dec > 0) { totalLoss += a.totalEquityLoss; totalDec += dec; }
            }
            if (totalDec >= 3) careerPr = Number(Math.max(0, (totalLoss / totalDec) * 500).toFixed(1));
        }
        setPlayerMeta({ pseudo: isGuest ? (isEn ? 'Guest Player' : 'Joueur Invité') : (rawPseudo || (isEn ? 'You' : 'Vous')), avatarUrl: passport?.avatarUrl || (STANDARD_USER_AVATARS[4]?.url ?? '/avatars/user-avatar-5.jpg'), countryName: passport?.countryName || 'France', isGuest, careerPr });
    }, [isEn]);
    const {
        botElo, playerPrNum, playerPrLabel, opponentPrNum, opponentPrValue,
        opponentDisplayName, opponentBadge, opponentPhotoUrl,
    } = resolvePersonaMeta(difficulty, locale, prX, prO, challengerProfile, isGuided);

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
                            character={isGuided ? 'beginner' : difficulty}
                            size="lg"
                            isActive={!isXTurn}
                            customPhotoUrl={isGuided ? '/avatars/einstein-quiz-coach.jpg' : (challengerProfile ? opponentPhotoUrl : null)}
                        />
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold tabular-nums whitespace-nowrap">
                            {!isGuided && (
                                <span className="font-mono text-stone-200 font-bold">
                                    {challengerProfile ? `${botElo} Elo` : (isEn ? 'Opponent' : 'Adversaire')}
                                </span>
                            )}
                            {!isGuided && challengerProfile && (
                                <span className={`inline-flex items-center justify-center rounded-lg border px-2 py-0.5 font-mono text-[11px] font-black tracking-tight shadow-sm whitespace-nowrap ${resolvePrBadgeClasses(opponentPrNum)}`}>
                                    {isEn ? 'Match PR:' : 'PR Match :'} {opponentPrValue}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="hidden [@media(max-height:540px)]:flex w-full flex-col items-center leading-none">
                        <span data-testid="left-rail-mobile-opp-name" title={opponentDisplayName} className="w-full truncate text-center text-[9.5px] font-bold text-[#f7f3e8] leading-tight">{opponentDisplayName}</span>
                        {!isGuided && (
                            <span data-testid="left-rail-mobile-opp-elo" className="font-mono text-[8.5px] font-bold text-[#f3c65f] tabular-nums whitespace-nowrap">
                                {challengerProfile ? `${botElo} Elo` : ''}
                            </span>
                        )}
                    </div>

                    <div className="relative z-10 flex items-center justify-between w-full [@media(min-height:541px)]:w-auto gap-1">
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

                    <div className={`hidden [@media(max-height:540px)]:flex w-full items-center justify-center rounded py-0.5 px-1 font-mono text-[10px] font-extrabold tabular-nums whitespace-nowrap leading-none ${turn === 'O' ? 'bg-[#b45309] text-[#fef3c7] ring-1 ring-[#f5dfa0]' : 'bg-[#080605] text-stone-300 border border-white/10'}`}>
                        {isGuided ? '∞ À votre rythme' : opponentClock}
                    </div>

                    {!isBeginner && challengerProfile && (
                        <span title={`Performance Rating : ${opponentPrValue}`} className="hidden [@media(max-height:540px)]:inline-block w-full text-center rounded border border-[#d4af37]/50 bg-[#d4af37]/15 px-1 py-0.5 font-mono text-[9px] font-black text-[#f3d27a] whitespace-nowrap leading-none">PR {opponentPrValue}</span>
                    )}
                </div>
                {challengerProfile ? (
                    <div data-testid="left-rail-online-status" className="[@media(max-height:540px)]:hidden flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-950/30 px-2 py-1 text-[10px] font-medium text-emerald-300/90">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{isEn ? 'Online · Ranked Match' : 'Connecté · Match classé'}</span>
                    </div>
                ) : (
                    <div data-testid="left-rail-bot-engine-badge" className="[@media(max-height:540px)]:hidden flex items-center justify-center gap-1.5 rounded-lg border border-[#d4af37]/25 bg-black/45 px-2 py-1 text-[10px] font-semibold text-[#f3d27a]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37]" />
                        <span>{isGuided ? (isEn ? '• Guided Play' : '• Partie Guidée') : (isEn ? 'Club Opponent' : 'Adversaire du Cercle')}</span>
                    </div>
                )}
            </div>

            {/* 2. CENTRE : Plaque de Match + Horloge */}
            <div className="[@media(max-height:540px)]:hidden flex w-full items-center justify-between gap-1 my-auto py-0.5 shrink-0">
                <div className="flex-1 rounded-xl border border-[#d4af37]/20 bg-[#14100c] px-1.5 py-1.5 text-center shadow-inner min-w-0">
                    <div className="text-[9px] uppercase tracking-wider text-stone-400">
                        {isEn ? 'Cube' : 'Videau'} <span className="font-mono font-bold text-[#f3d27a]">×{cubeValue}</span>
                    </div>
                    <div className="mt-0.5 font-display text-xs italic font-bold text-[#f7f3e8] leading-tight whitespace-nowrap">
                        Match <span className="font-mono not-italic font-extrabold text-[#d4af37]">{matchLength > 0 ? `${matchLength} pts` : (isEn ? 'Money' : 'Libre')}</span>
                    </div>
                    {crawford && <div data-testid="left-rail-crawford-badge" className="mt-1 inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/40 px-1 py-0.5 text-[9px] font-bold text-amber-300 uppercase tracking-wider">Crawford</div>}
                    {isDMP && <div data-testid="left-rail-dmp-badge" className="mt-1 inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/40 px-1 py-0.5 text-[9px] font-bold text-amber-300 uppercase tracking-wider">DMP</div>}
                </div>

                {isGuided ? (
                    <div data-testid="left-rail-guided-pace-badge" className="flex flex-col items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-950/40 p-1.5 shadow-inner gap-0.5 shrink-0 w-14 text-center select-none">
                        <span className="text-sm font-black text-emerald-300 leading-none">∞</span>
                        <span className="font-extrabold text-[8px] uppercase tracking-wider text-emerald-300 leading-tight">{isEn ? 'Your pace' : 'À votre rythme'}</span>
                    </div>
                ) : (
                    <div data-testid="left-rail-clock-block" className="flex flex-col items-center justify-between rounded-xl border border-[#d4af37]/40 bg-[#080605] p-1 shadow-inner gap-0.5 shrink-0 w-13">
                        <div data-testid="left-rail-clock-opp" className={`w-full rounded-md py-0.5 px-1 text-center font-mono text-[10px] font-bold tabular-nums transition-all ${turn === 'O' ? 'bg-[#b45309] text-[#fef3c7] ring-1 ring-[#f5dfa0]' : 'bg-[#16120e] text-stone-400'}`}>{opponentClock}</div>
                        <div data-testid="left-rail-bronstein-delay" className="flex h-4 w-8 items-center justify-center rounded border border-[#d4af37]/50 bg-[#14100c] font-mono text-[9px] font-bold tabular-nums text-[#f3d27a]">+{delaySeconds}s</div>
                        <div data-testid="left-rail-clock-player" className={`w-full rounded-md py-0.5 px-1 text-center font-mono text-[10px] font-bold tabular-nums transition-all ${turn === 'X' ? 'bg-[#065f46] text-emerald-50 ring-1 ring-emerald-400/70' : 'bg-[#16120e] text-stone-400'}`}>{playerClock}</div>
                    </div>
                )}
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
                        {onToggleAutoRoll && (
                            <button type="button" data-testid="left-rail-auto-roll-toggle" onClick={onToggleAutoRoll} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-left text-[11px] font-semibold hover:border-[#d4af37]/50 transition">
                                <span>🎲 Lancer auto des dés</span>
                                <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-black ${autoRollEnabled ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50' : 'bg-white/10 text-stone-300'}`}>{autoRollEnabled ? 'ON' : 'OFF'}</span>
                            </button>
                        )}
                        <div className="grid grid-cols-3 gap-1">
                            {BOARD_SWATCH_OPTIONS.map((sw) => (
                                <button key={sw.id} type="button" onClick={() => setTheme(sw.id)} className={`flex flex-col items-center gap-0.5 rounded-lg border py-1 text-[9.5px] font-bold ${activeTheme === sw.id ? 'border-[#f3c65f] bg-[#d4af37]/20 text-white' : 'border-white/10 bg-black/40 text-stone-300'}`}>
                                    <span className={`h-3 w-5 rounded border ${sw.ringClass}`} style={{ backgroundColor: sw.bgHex }} />
                                    <span>{sw.label}</span>
                                </button>
                            ))}
                        </div>
                        <button type="button" onClick={() => { handleFlipDirection(); setIsMobileMenuOpen(false); }} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[10px] font-semibold text-center hover:border-[#d4af37]/50 transition">⇄ Sens 1..24</button>
                        {onBackToLobby && (
                            <button type="button" onClick={() => { setIsMobileMenuOpen(false); onBackToLobby(); }} className="flex items-center justify-between rounded-xl border border-rose-500/35 bg-rose-950/40 px-2.5 py-1.5 text-[11px] font-bold text-rose-200 hover:bg-rose-950/70 transition">
                                <span>🚪 Quitter la table</span><span className="text-[10px]">Salon →</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 3. CARTE BAS (Joueur Humain : Invité vs Inscrit) */}
            <div className="relative flex w-full flex-col items-center gap-1 [@media(max-height:540px)]:!gap-0.5 border-t border-[#d4af37]/20 pt-1.5 [@media(max-height:540px)]:!pt-0.5 [@media(max-height:540px)]:rounded-lg [@media(max-height:540px)]:border [@media(max-height:540px)]:border-[#d4af37]/30 [@media(max-height:540px)]:bg-[#14100c]/90 [@media(max-height:540px)]:p-1 shrink-0">
                <div className="[@media(max-height:540px)]:hidden flex w-full flex-col items-center gap-1 min-w-0">
                    {isGuided ? (
                        <span data-testid="left-rail-guided-player-badge" className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/70 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-emerald-300 whitespace-nowrap">
                            {locale === 'en' ? 'PLAYER • GUIDED PLAY' : 'JOUEUR • PARTIE GUIDÉE'}
                        </span>
                    ) : playerMeta.isGuest ? (
                        <span data-testid="left-rail-guest-badge" className="inline-flex items-center gap-1 rounded-full border border-stone-500/40 bg-stone-900/70 px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-stone-300 whitespace-nowrap">
                            {locale === 'en' ? 'Guest · Free Play' : 'Invité · Salon Libre'}
                        </span>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold tabular-nums whitespace-nowrap">
                            <CountryFlagSvg countryName={playerMeta.countryName} />
                            <span className="font-mono text-stone-200 font-bold">1500 Elo</span>
                            {playerMeta.careerPr !== null && (
                                <span data-testid="left-rail-career-pr" className="font-mono text-[10px] font-bold text-[#f3d27a]">
                                    · PR Moy. {playerMeta.careerPr.toFixed(1)}
                                </span>
                            )}
                        </div>
                    )}
                    <div className="flex w-full items-center justify-center gap-2">
                        <BotPortraitMedallion character="player" size="lg" isActive={isXTurn} customPhotoUrl={playerMeta.avatarUrl} />
                        <div className="flex flex-col items-center gap-1">
                            <div data-testid="left-rail-score-x" className="flex h-11 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#d4af37] bg-gradient-to-b from-[#f7f3e8] to-[#dfd3b8] font-display text-xl font-black tabular-nums text-[#0b0907] shadow-[0_4px_14px_rgba(212,175,55,0.28)]">{scoreX}</div>
                            <button type="button" data-testid="left-rail-quick-chat-toggle" onClick={() => setIsQuickChatOpen((v) => !v)} title="Réactions rapides" aria-label="Ouvrir les réactions rapides" aria-expanded={isQuickChatOpen} className="flex h-6 w-10 items-center justify-center rounded-md border border-[#d4af37]/40 bg-[#1a140e] text-[10px] font-bold text-[#f3d27a] hover:border-[#d4af37] active:scale-95 transition shrink-0">Chat</button>
                        </div>
                    </div>
                    <span data-testid="left-rail-player-name" className="w-full text-center font-display text-sm md:text-base italic font-black text-[#f7f3e8] leading-tight whitespace-nowrap">
                        {playerMeta.pseudo}
                    </span>
                </div>

                <div className="hidden [@media(max-height:540px)]:flex w-full flex-col items-center leading-none gap-0.5">
                    <span data-testid="left-rail-mobile-player-name" title={playerMeta.pseudo} className="w-full truncate text-center text-[9.5px] font-bold text-[#f7f3e8] leading-tight">
                        {isGuided ? (locale === 'en' ? 'You (Student)' : 'Vous (Élève)') : playerMeta.pseudo}
                    </span>
                    {!isGuided && (
                        <span data-testid="left-rail-mobile-player-elo" className="font-mono text-[8.5px] font-bold text-emerald-300/90 tabular-nums whitespace-nowrap">
                            {playerMeta.isGuest ? 'Invité' : '1500 Elo'}
                        </span>
                    )}
                    <div className="flex w-full items-center justify-between gap-1">
                        <div className="relative inline-flex shrink-0">
                            <img src={playerMeta.avatarUrl} alt={playerMeta.pseudo} className="h-5 w-5 rounded-full object-cover border border-[#f7f3e8] ring-1 ring-[#d4af37] shadow" />
                            <span title="Pions Blancs (X)" className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#f7f3e8] border border-[#3b2307]" />
                        </div>
                        <div className="flex h-6 w-7 shrink-0 items-center justify-center rounded-md border-2 border-[#d4af37] bg-gradient-to-b from-[#f7f3e8] to-[#dfd3b8] font-display text-sm font-black tabular-nums text-[#0b0907]">{scoreX}</div>
                    </div>
                </div>

                {isQuickChatOpen && (
                    <div data-testid="left-rail-quick-chat-popover" role="group" aria-label="Messages rapides" className="absolute left-full ml-1.5 bottom-1 z-50 flex items-center gap-1 rounded-xl border border-[#d4af37]/55 bg-[#120e0a]/98 px-2 py-1 shadow-[0_12px_28px_rgba(0,0,0,0.95)] backdrop-blur-md">
                        {([{ id: 'gg' as const, label: 'GG' }, { id: 'nice_move' as const, label: 'Bien joué' }, { id: 'unlucky' as const, label: 'Pas de chance' }, { id: 'thanks' as const, label: 'Merci' }]).map((chat) => (
                            <button key={chat.id} type="button" data-testid={`quick-chat-btn-${chat.id}`} onClick={() => { onSendQuickChat?.(chat.id); setIsQuickChatOpen(false); }} className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-[#f7f3e8] hover:border-[#f3c65f]/50 hover:bg-white/10 transition active:scale-95 whitespace-nowrap">{chat.label}</button>
                        ))}
                    </div>
                )}

                <div className={`hidden [@media(max-height:540px)]:flex w-full items-center justify-center rounded py-0.5 px-1 font-mono text-[10px] font-extrabold tabular-nums whitespace-nowrap leading-none ${turn === 'X' ? 'bg-[#065f46] text-emerald-50 ring-1 ring-emerald-400/70' : 'bg-[#080605] text-stone-300 border border-white/10'}`}>{playerClock}</div>

                {!isBeginner && !playerMeta.isGuest && (
                    <span data-testid="left-rail-player-pr" className={`w-full inline-flex items-center justify-center rounded-lg border px-2 py-0.5 font-mono text-[11px] font-black tracking-tight shadow-sm whitespace-nowrap leading-none ${resolvePrBadgeClasses(playerPrNum)}`}>
                        PR Match : {playerPrLabel}
                    </span>
                )}
            </div>
        </aside>
    );
});
BoardLeftPlayerRail.displayName = 'BoardLeftPlayerRail';
