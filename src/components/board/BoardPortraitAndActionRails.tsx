'use client';

/**
 * @file src/components/board/BoardPortraitAndActionRails.tsx
 * @description HUD Portrait (Haut/Bas), Rail d'Actions Droit et résolution de métadonnées Joueur/Adversaire (< 270 lignes, 0 `any`).
 */

import React, { useEffect, useRef, useState } from 'react';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import type { PlayerEloProfile } from '../../features/multiplayer/types';
import { getBotPersona } from '../../features/personas/botPersonas';
import { resolveNaturalChallengerAvatarUrl } from '../../features/personas/humanPersonaSeeds';
import { useBoardTheme, type ThemeName } from '../../hooks/useBoardTheme';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';
import { toggleOrientation, getSavedOrientation, saveOrientation } from './boardOrientation';
import {
    BotPortraitMedallion,
    IconAstrolabeCoach,
    IconHorologyGear,
    PERSONA_PHOTO_BY_ID,
} from '../common/MonteCarloIcons';
import { CountryFlagSvg } from '../common/CountryFlagSvg';

export interface BoardLeftPlayerRailProps {
    readonly difficulty?: AIDifficulty; readonly locale?: string; readonly isXTurn: boolean;
    readonly scoreX: number; readonly scoreO: number; readonly cubeValue: number;
    readonly matchLength: number; readonly turn: 'X' | 'O'; readonly opponentClock?: string;
    readonly playerClock?: string; readonly delaySeconds?: number; readonly prX?: number | null;
    readonly prO?: number | null; readonly challengerProfile?: PlayerEloProfile | null;
    readonly opponentDice?: [number, number] | null;
    readonly crawford?: boolean; readonly isDMP?: boolean; readonly isGuidedMode?: boolean;
    readonly onSendQuickChat?: (id: 'gg' | 'nice_move' | 'unlucky' | 'thanks' | 'thinking') => void;
    readonly isBrowserFullscreen?: boolean; readonly isFocusFullBoard?: boolean;
    readonly onToggleFullscreen?: () => void; readonly onToggleCoach?: () => void;
    readonly onToggleTheme?: () => void; readonly onBackToLobby?: () => void;
    readonly canUndo?: boolean; readonly onUndo?: () => void;
    readonly autoConfirmEnabled?: boolean; readonly onToggleAutoConfirm?: () => void;
    readonly autoRollEnabled?: boolean; readonly onToggleAutoRoll?: () => void;
}

export const BOARD_SWATCH_OPTIONS: ReadonlyArray<{ readonly id: ThemeName; readonly label: string; readonly bgHex: string; readonly ringClass: string }> = [
    { id: 'snowie_classic', label: 'Émeraude', bgHex: '#0d462d', ringClass: 'border-[#d4af37]' },
    { id: 'midnight', label: 'Bleu Nuit', bgHex: '#102b52', ringClass: 'border-sky-400' },
    { id: 'tournament', label: 'Havane', bgHex: '#4a1521', ringClass: 'border-amber-500' },
];

const LEGACY_JARGON_NAME_MAP: Readonly<Record<string, string>> = {
    SvenBG: 'Sven L.', Murat_34: 'Murat K.', thomas_69: 'Thomas R.', laurent75: 'Laurent B.',
    mehdi_92: 'Mehdi S.', david_bg64: 'David L.', david_64: 'David L.', Kosta_Ath: 'Kosta P.',
    Giorgio_Mi: 'Giorgio M.', Hans_HH: 'Hans W.', Taro_Tokyo: 'Taro S.', Alex_Lon: 'Alex C.',
    Nikos_Tavli: 'Nikos K.', HitAndCover: 'Benjamin C.', BarPoint7: 'Leon W.', PipMaster: 'Arthur D.',
};

function sanitizeChallengerName(raw: string): string {
    const stripped = raw.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '').replace(/^[A-Z]{2}\s+(?=[A-Za-zÀ-ÿ])/u, '').trim();
    if (LEGACY_JARGON_NAME_MAP[stripped]) return LEGACY_JARGON_NAME_MAP[stripped];
    if (/^[a-zA-ZÀ-ÿ]+_[a-zA-Z0-9]+$/.test(stripped)) {
        const [first, second] = stripped.split('_');
        const cap = first.charAt(0).toUpperCase() + first.slice(1);
        const initial = /^[A-Za-z]/.test(second ?? '') ? second!.charAt(0).toUpperCase() : 'K';
        return `${cap} ${initial}.`;
    }
    return stripped.replace(/BG$/i, ' L.');
}

export function resolvePrBadgeClasses(pr: number | null): string {
    if (pr === null || !Number.isFinite(pr)) return 'border-white/10 bg-white/[0.03] text-zinc-400 font-normal';
    if (pr <= 4.5) return 'border-emerald-400/50 bg-emerald-950/70 text-emerald-300';
    if (pr <= 8.5) return 'border-[#d4af37]/50 bg-[#d4af37]/15 text-[#f3d27a]';
    return 'border-amber-500/40 bg-amber-950/60 text-amber-300';
}

export function resolvePersonaMeta(
    difficulty: AIDifficulty,
    locale: string,
    prX?: number | null,
    prO?: number | null,
    challengerProfile?: PlayerEloProfile | null,
    isBeginner: boolean = false,
) {
    const isEn = locale === 'en';
    const isGuided = Boolean(isBeginner || difficulty === 'beginner');
    const activePersona = getBotPersona(difficulty, locale as 'fr' | 'en' | 'es' | 'pt' | 'de' | 'ar' | 'ja');
    const botElo = challengerProfile ? String(challengerProfile.rating) : '—';
    const playerPrNum = typeof prX === 'number' && Number.isFinite(prX) ? Math.max(0, prX) : null;
    const playerPrValue = playerPrNum ?? 0;
    const playerPrLabel = playerPrNum !== null ? playerPrNum.toFixed(1) : '—';
    const opponentPrNum = typeof prO === 'number' && Number.isFinite(prO) ? Math.max(0, prO) : null;
    const opponentPrValue = opponentPrNum !== null ? opponentPrNum.toFixed(1) : '—';
    const opponentDisplayName = isGuided ? (isEn ? 'The Professor' : 'Le Professeur') : challengerProfile ? sanitizeChallengerName(challengerProfile.username || challengerProfile.displayName) : activePersona.shortName;
    const opponentBadge = isGuided ? (isEn ? 'TEACHING MENTOR' : 'MENTOR PÉDAGOGIQUE') : challengerProfile ? 'En Ligne · Classé' : activePersona.styleBadge;
    const opponentPhotoUrl = isGuided ? '/avatars/einstein-quiz-coach.jpg' : challengerProfile ? resolveNaturalChallengerAvatarUrl(opponentDisplayName, challengerProfile.rating) : (PERSONA_PHOTO_BY_ID[difficulty] ?? '/avatars/persona-homme-affaires.jpg');
    return {
        activePersona, botElo, playerPrNum, playerPrValue, playerPrLabel,
        opponentPrNum, opponentPrValue, opponentDisplayName, opponentBadge, opponentPhotoUrl,
    };
}

export const BoardPortraitTopHud: React.FC<BoardLeftPlayerRailProps> = React.memo(({
    difficulty = 'expert', locale = 'fr', isXTurn, scoreO, cubeValue, matchLength, turn, opponentClock = '02:36', delaySeconds = 12, prX, prO, challengerProfile, isGuidedMode = false,
}) => {
    const { tierGate } = usePlayerTierGate();
    const isBeginner = tierGate === 'BEGINNER';
    const isGuided = Boolean(isGuidedMode || isBeginner || difficulty === 'beginner');
    const { activePersona, botElo, playerPrNum, playerPrLabel, opponentPrNum, opponentPrValue, opponentDisplayName, opponentBadge, opponentPhotoUrl } = resolvePersonaMeta(
        difficulty, locale, prX, prO, challengerProfile, isGuided,
    );
    return (
        <div data-testid="board-portrait-top-hud" className="md:hidden [@media(max-height:500px)]:hidden w-full shrink-0 flex flex-col gap-1 px-1.5 pt-0.5 pb-1 select-none">
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#d4af37]/35 bg-gradient-to-r from-[#0d0a08] via-[#15100b] to-[#0d0a08] px-2.5 py-2 shadow-lg">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <BotPortraitMedallion character="player" size="md" isActive={isXTurn} />
                    <div className="min-w-0 flex flex-col">
                        <span className="truncate font-display text-sm italic font-bold text-[#f7f3e8] leading-tight">Vous</span>
                        <span className="truncate text-[10px] font-semibold text-emerald-300/90">Grand Cercle</span>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-mono tabular-nums">
                            {!isBeginner && <span className="text-stone-300">1500</span>}
                            {!isBeginner && <span className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-black ${resolvePrBadgeClasses(playerPrNum)}`}>PR {playerPrLabel}</span>}
                        </div>
                    </div>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center rounded-xl border border-[#d4af37]/35 bg-[#16110c] px-2 py-1 text-center shadow-inner">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#f3d27a]">{matchLength > 0 ? `${matchLength} pts` : 'Libre'} · ×{cubeValue}</span>
                    <span className="text-[10px] font-black tracking-widest text-amber-400">⚔ VS</span>
                </div>

                <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
                    <div className="min-w-0 flex flex-col items-end">
                        <span className="truncate max-w-[115px] font-display text-sm italic font-bold text-[#f7f3e8] leading-tight">{opponentDisplayName}</span>
                        <span className="inline-flex items-center gap-1 truncate max-w-[125px] text-[10px] font-bold text-[#f3c65f]">
                            {challengerProfile?.countryName && <CountryFlagSvg countryName={challengerProfile.countryName} className="h-2.5 w-3.5" />}
                            <span className="truncate">{opponentBadge}</span>
                        </span>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-mono tabular-nums">
                            {!isGuided && challengerProfile && <span className="text-stone-300">{botElo}</span>}
                            {!isGuided && challengerProfile && (
                                <span className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-black ${resolvePrBadgeClasses(opponentPrNum)}`}>PR {opponentPrValue}</span>
                            )}
                        </div>
                    </div>
                    <BotPortraitMedallion character={isGuided ? 'beginner' : difficulty} size="md" isActive={!isXTurn} customPhotoUrl={isGuided ? '/avatars/einstein-quiz-coach.jpg' : (challengerProfile ? opponentPhotoUrl : null)} />
                </div>
            </div>

            <div className="flex items-center justify-between px-1">
                <div className="flex h-7 min-w-[34px] items-center justify-center rounded-lg border border-[#d4af37]/60 bg-[#14100c] px-2 font-display text-base font-bold tabular-nums text-[#f7f3e8] shadow">{scoreO}</div>
                <div className="flex items-center overflow-hidden rounded-lg border border-[#d4af37]/40 bg-[#080605] font-mono text-[11px] font-bold tabular-nums shadow">
                    {isGuided ? (
                        <span className="px-2 py-0.5 text-emerald-300 font-extrabold text-[10px]">∞ À votre rythme</span>
                    ) : (
                        <>
                            <span className="bg-[#14100c] px-1.5 py-0.5 text-[#f3d27a] border-r border-[#d4af37]/30">+{delaySeconds}s</span>
                            <span className={`px-2 py-0.5 ${turn === 'O' ? 'bg-[#b45309] text-[#fef3c7]' : 'text-stone-400'}`}>{opponentClock}</span>
                        </>
                    )}
                </div>
                <div className="h-6 rounded-md border border-[#d4af37]/25 bg-[#0d0a08]/90 px-2 flex items-center justify-center text-[10px] font-semibold text-[#f3d27a] truncate max-w-[140px]">
                    {challengerProfile ? '● Connecté' : `« ${activePersona.skillTaught} »`}
                </div>
            </div>
        </div>
    );
});
BoardPortraitTopHud.displayName = 'BoardPortraitTopHud';

export const BoardPortraitBottomHud: React.FC<Pick<BoardLeftPlayerRailProps, 'scoreX' | 'turn' | 'playerClock' | 'delaySeconds' | 'isGuidedMode'>> = React.memo(({
    scoreX, turn, playerClock = '02:14', delaySeconds = 12, isGuidedMode = false,
}) => {
    const { tierGate } = usePlayerTierGate();
    const isGuided = isGuidedMode || tierGate === 'BEGINNER';
    return (
        <div data-testid="board-portrait-bottom-hud" className="md:hidden [@media(max-height:500px)]:hidden w-full shrink-0 flex items-center justify-between px-2.5 py-1 select-none">
            <div className="flex h-7 min-w-[34px] items-center justify-center rounded-lg border-2 border-[#d4af37] bg-gradient-to-b from-[#f7f3e8] to-[#dfd3b8] px-2 font-display text-base font-bold tabular-nums text-[#0b0907] shadow">{scoreX}</div>
            <div className="flex items-center overflow-hidden rounded-lg border border-[#d4af37]/40 bg-[#080605] font-mono text-[11px] font-bold tabular-nums shadow">
                {isGuided ? (
                    <span className="px-2 py-0.5 text-emerald-300 font-extrabold text-[10px]">∞ À votre rythme</span>
                ) : (
                    <>
                        <span className="bg-[#14100c] px-1.5 py-0.5 text-[#f3d27a] border-r border-[#d4af37]/30">+{delaySeconds}s</span>
                        <span className={`px-2 py-0.5 ${turn === 'X' ? 'bg-[#065f46] text-emerald-50' : 'text-stone-400'}`}>{playerClock}</span>
                    </>
                )}
            </div>
            <div className="h-6 w-12 rounded-md border border-[#d4af37]/20 bg-[#0d0a08]/80 flex items-center justify-center text-[10px] font-mono text-[#f3d27a]">Vous</div>
        </div>
    );
});
BoardPortraitBottomHud.displayName = 'BoardPortraitBottomHud';

export interface BoardRightActionRailProps {
    readonly isBrowserFullscreen: boolean;
    readonly isFocusFullBoard: boolean;
    readonly onToggleFullscreen: () => void;
    readonly onToggleCoach: () => void;
    readonly onToggleTheme?: () => void;
    readonly onBackToLobby?: () => void;
    readonly canUndo?: boolean;
    readonly onUndo?: () => void;
    readonly autoConfirmEnabled?: boolean;
    readonly onToggleAutoConfirm?: () => void;
    readonly autoRollEnabled?: boolean;
    readonly onToggleAutoRoll?: () => void;
}

export const BoardRightActionRail: React.FC<BoardRightActionRailProps> = React.memo(({
    isBrowserFullscreen, isFocusFullBoard, onToggleFullscreen, onToggleCoach, onBackToLobby,
    canUndo = false, onUndo, autoConfirmEnabled = false, onToggleAutoConfirm,
    autoRollEnabled = false, onToggleAutoRoll,
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement | null>(null);
    const { theme: activeTheme, setTheme } = useBoardTheme();

    useEffect(() => {
        if (!isSettingsOpen) return;
        const onPointerDown = (e: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setIsSettingsOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsSettingsOpen(false); };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [isSettingsOpen]);

    const handleFlipDirection = () => {
        const next = toggleOrientation(getSavedOrientation());
        saveOrientation(next);
    };
    const btnBase = 'flex h-11 w-11 items-center justify-center rounded-xl border border-[#d4af37]/35 bg-[#120e0a] text-[#f3d27a] shadow-lg transition hover:border-[#d4af37] hover:bg-[#1c1610] active:scale-95';

    return (
        <aside aria-label="Actions rapides de table" data-testid="board-right-action-rail" className="relative hidden md:flex [@media(max-height:540px)]:!hidden flex-col items-center justify-center gap-2.5 w-12 shrink-0 py-2 select-none">
            {canUndo && onUndo && (
                <button type="button" data-testid="right-rail-undo-btn" onClick={onUndo} title="Annuler le dé joué (Ctrl+Z)" aria-label="Annuler le coup" className="flex h-11 w-11 [@media(max-height:540px)]:!h-8 [@media(max-height:540px)]:!w-8 items-center justify-center rounded-xl border border-amber-400/60 bg-amber-500/20 text-amber-200 font-bold text-sm shadow-lg transition hover:border-amber-300 hover:bg-amber-500/30 active:scale-95">↶</button>
            )}
            <button type="button" data-testid="board-fullscreen-toggle-btn" onClick={onToggleFullscreen} title={isBrowserFullscreen ? 'Quitter le plein écran' : 'Plein écran intégral'} aria-label="Basculer le plein écran" className={btnBase}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
            </button>
            <button type="button" data-testid="board-focus-toggle-btn" onClick={onToggleCoach} title="Ouvrir ou masquer le Maître-Coach IA" aria-label="Ouvrir ou masquer le Coach IA" className={`flex h-11 w-11 [@media(max-height:540px)]:!h-8 [@media(max-height:540px)]:!w-8 items-center justify-center rounded-xl border transition active:scale-95 shadow-lg ${!isFocusFullBoard ? 'border-[#f5dfa0] bg-gradient-to-br from-[#d4af37] to-[#9a6f18] text-[#090806]' : 'border-[#d4af37]/35 bg-[#120e0a] text-[#f3d27a] hover:border-[#d4af37]'}`}>
                <IconAstrolabeCoach className={!isFocusFullBoard ? 'text-[#090806]' : 'text-[#f3d27a]'} size={18} />
            </button>
            <div ref={settingsRef} className="relative">
                <button type="button" data-testid="right-rail-settings-btn" onClick={() => setIsSettingsOpen((v) => !v)} title="Paramètres de table" aria-label="Paramètres de table" aria-expanded={isSettingsOpen} className={btnBase}>
                    <IconHorologyGear className="text-[#f3d27a]" size={17} />
                </button>
                {isSettingsOpen && (
                    <div data-testid="right-rail-settings-popover" className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-50 w-64 rounded-2xl border border-[#d4af37]/50 bg-[#0d0a08]/95 p-3 text-xs text-[#f7f3e8] shadow-[0_20px_50px_rgba(0,0,0,0.92)] backdrop-blur-md flex flex-col gap-2">
                        <div className="flex items-center justify-between pb-1 border-b border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#f3c65f]">⚙️ Paramètres de Table</span>
                            <button type="button" data-testid="right-rail-settings-close-btn" onClick={() => setIsSettingsOpen(false)} className="text-[11px] text-stone-400 hover:text-white px-1">✕</button>
                        </div>
                        {onToggleAutoConfirm && (
                            <button type="button" data-testid="right-rail-auto-confirm-toggle" onClick={onToggleAutoConfirm} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-left text-[11px] font-semibold hover:border-[#d4af37]/50 transition">
                                <span>Validation auto des coups</span>
                                <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-black ${autoConfirmEnabled ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50' : 'bg-white/10 text-stone-300'}`}>{autoConfirmEnabled ? 'ON' : 'OFF'}</span>
                            </button>
                        )}
                        {onToggleAutoRoll && (
                            <button type="button" data-testid="right-rail-auto-roll-toggle" onClick={onToggleAutoRoll} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-left text-[11px] font-semibold hover:border-[#d4af37]/50 transition">
                                <span>🎲 Lancer auto des dés</span>
                                <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-black ${autoRollEnabled ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50' : 'bg-white/10 text-stone-300'}`}>{autoRollEnabled ? 'ON' : 'OFF'}</span>
                            </button>
                        )}
                        <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-300">🎨 Tapis de Jeu (3 Couleurs)</span>
                            <div className="grid grid-cols-3 gap-1.5">
                                {BOARD_SWATCH_OPTIONS.map((sw) => {
                                    const isSelected = activeTheme === sw.id;
                                    return (
                                        <button key={sw.id} type="button" data-testid={`board-theme-swatch-${sw.id}`} onClick={() => setTheme(sw.id)} className={`flex flex-col items-center gap-1 rounded-lg border px-1.5 py-1.5 text-[10px] font-bold transition ${isSelected ? 'border-[#f3c65f] bg-[#d4af37]/20 text-white shadow' : 'border-white/10 bg-black/40 text-stone-300 hover:border-white/30'}`}>
                                            <span className={`h-4 w-7 rounded border ${sw.ringClass} shadow-inner`} style={{ backgroundColor: sw.bgHex }} />
                                            <span className="truncate max-w-full">{sw.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <button type="button" onClick={() => { handleFlipDirection(); setIsSettingsOpen(false); }} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold hover:border-[#d4af37]/50 transition">
                            <span>⇄ Sens du plateau (1..24)</span><span className="text-[10px] text-[#f3d27a]">Inverser</span>
                        </button>
                    </div>
                )}
            </div>
            {onBackToLobby && (
                <button type="button" data-testid="right-rail-leave-btn" onClick={onBackToLobby} title="Quitter la table / Retour au Salon" aria-label="Retour au Salon" className="flex h-11 w-11 [@media(max-height:540px)]:!h-8 [@media(max-height:540px)]:!w-8 items-center justify-center rounded-xl border border-rose-500/35 bg-[#160b0b] text-rose-300 shadow-lg transition hover:border-rose-400 hover:bg-rose-950/60 active:scale-95">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                </button>
            )}
        </aside>
    );
});
BoardRightActionRail.displayName = 'BoardRightActionRail';
