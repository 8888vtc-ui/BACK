'use client';

/**
 * Écran d'accueil — Design Aéré & Limpide (Sidebar Gauche Rétractable + Cockpit Central + Vitrine Droite + Chat Coach IA).
 * Conforme à SCALABILITY.md (LOI 5 : strictement 0 any, < 300 lignes).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../../lib/supabase/types';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import type { Player } from '../../engine/backgammonEngine';
import { readStoredMatchFormat } from '../hud/MatchFormatSelector';
import { readStoredPlayerColor, storePlayerColor } from '../hud/ColorSelector';
import { LobbyOptionsPanel, type LobbyClockPreset } from './LobbyOptionsPanel';
import { OpenMatchesTable, type OpenMatchChallenge } from './OpenMatchesTable';
import AppNavbar from '../nav/AppNavbar';
import PlayerProfileCard from './PlayerProfileCard';
import RecentMatchesSummary from './RecentMatchesSummary';
import LearningModulesGrid from './LearningModulesGrid';
import CoachPreMatchBriefingCard from './CoachPreMatchBriefingCard';
import TournamentTableClockModal from '../clock/TournamentTableClockModal';
import FloatingAiCoachWidget from '../coach/FloatingAiCoachWidget';
import { LobbyLeftSidebar, LobbyRightShowcaseColumn } from './LobbySidebarAndWidgets';
import { BotPortraitMedallion } from '../common/MonteCarloIcons';
import { getSyncAcademySnapshot, loadPlayerHubData, type AcademyProgressSnapshot, type RecentMatchEntry } from '../../features/progression/userProgressionService';
import { BOT_PERSONAS_BY_DIFFICULTY, getBotPersona } from '../../features/personas/botPersonas';
import { useTranslation } from '../../i18n';
import usePwaInstall from '../../hooks/usePwaInstall';

export type LobbyModuleId = 'multiplayer' | 'openings' | 'stats' | 'drills' | 'puzzles' | 'import_export' | 'tournaments';
type LobbyMode = 'ai' | 'multiplayer' | 'training';

export interface LobbySelection {
    matchLength: number; difficulty: AIDifficulty; coachEnabled: boolean; playerColor?: Player; clockPreset?: LobbyClockPreset;
}

export interface LobbyScreenProps {
    onStart: (selection: LobbySelection) => void; onOpenModule?: (moduleId: LobbyModuleId) => void;
    initialMatchLength?: number; initialDifficulty?: AIDifficulty; initialCoachEnabled?: boolean; initialClockPreset?: LobbyClockPreset;
}

const LobbyScreenComponent: React.FC<LobbyScreenProps> = ({
    onStart, onOpenModule, initialMatchLength = 7, initialDifficulty = 'expert', initialCoachEnabled = true, initialClockPreset = 'normal',
}) => {
    const { ui, dir, locale } = useTranslation();
    const { canInstall, isInstalled, handleInstallClick } = usePwaInstall();
    const [matchLength, setMatchLength] = useState<number>(initialMatchLength);
    const [difficulty, setDifficulty] = useState<AIDifficulty>(initialDifficulty);
    const [coachEnabled, setCoachEnabled] = useState<boolean>(initialCoachEnabled);
    const [clockPreset, setClockPreset] = useState<LobbyClockPreset>(initialClockPreset);
    const [playerColor, setPlayerColor] = useState<Player>('X');
    const [selectedMode, setSelectedMode] = useState<LobbyMode | null>('ai');
    const [showOptions, setShowOptions] = useState(false);
    const [isTableClockOpen, setIsTableClockOpen] = useState(false);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [snapshot, setSnapshot] = useState<AcademyProgressSnapshot>(() => getSyncAcademySnapshot());
    const [recentMatches, setRecentMatches] = useState<RecentMatchEntry[]>([]);
    const [isMittensActive, setIsMittensActive] = useState<boolean>(false);
    const [fairBag36Enabled, setFairBag36Enabled] = useState<boolean>(false);

    const matchFormats = useMemo(() => [
        { value: 0, label: ui.lobby.moneyGame, hint: ui.lobby.formatMoneyHint }, { value: 1, label: '1 pt (DMP)', hint: 'Manche sèche (3 min)' },
        { value: 3, label: '3 pts', hint: ui.lobby.formatShortHint }, { value: 5, label: '5 pts', hint: ui.lobby.formatFastHint },
        { value: 7, label: '7 pts', hint: ui.lobby.formatStandardHint }, { value: 11, label: '11 pts', hint: ui.lobby.formatLongHint },
    ], [ui.lobby]);

    const opponents = useMemo<Array<{ value: AIDifficulty; label: string; hint: string }>>(() => {
        const b = getBotPersona('beginner', locale);
        const i = getBotPersona('intermediate', locale);
        const e = getBotPersona('expert', locale);
        const g = getBotPersona('grandmaster', locale);
        return [
            { value: 'beginner', label: `${b.avatar} ${b.shortName}`, hint: b.lobbyHint },
            { value: 'intermediate', label: `${i.avatar} ${i.shortName}`, hint: i.lobbyHint },
            { value: 'expert', label: `${e.avatar} ${e.shortName}`, hint: e.lobbyHint },
            { value: 'grandmaster', label: `${g.avatar} ${g.shortName}`, hint: g.lobbyHint },
        ];
    }, [locale]);

    const mainCards = useMemo<ReadonlyArray<{ id: LobbyMode; icon: string; badge: string; title: string; subtitle: string }>>(() => [
        { id: 'ai', icon: '♟️', badge: ui.lobby.cardAiBadge, title: ui.lobby.cardAiTitle, subtitle: ui.lobby.cardAiSubtitle },
        { id: 'multiplayer', icon: '⚡', badge: ui.lobby.cardMultiBadge, title: ui.lobby.cardMultiTitle, subtitle: ui.lobby.cardMultiSubtitle },
        { id: 'training', icon: '🎯', badge: ui.lobby.cardTrainingBadge, title: ui.lobby.cardTrainingTitle, subtitle: ui.lobby.cardTrainingSubtitle },
    ], [ui.lobby]);

    useEffect(() => {
        setMatchLength(readStoredMatchFormat());
        setPlayerColor(readStoredPlayerColor());
        setSnapshot(getSyncAcademySnapshot());
        void loadPlayerHubData(null).then((res) => { setSnapshot(res.snapshot); setRecentMatches(res.recentMatches); });
    }, []);

    const handleUserResolved = useCallback((user: User | null, profile: Profile | null) => {
        setDisplayName(profile?.display_name || profile?.username || user?.email?.split('@')[0] || null);
        loadPlayerHubData(user?.id ?? null)
            .then((res) => {
                setSnapshot((prev) => ({ ...res.snapshot, eloRating: profile?.rating ?? res.snapshot.eloRating ?? prev.eloRating }));
                setRecentMatches(res.recentMatches);
            })
            .catch(() => {});
    }, []);

    const handlePlay = () => {
        const activeMode = selectedMode ?? 'ai';
        if (activeMode === 'ai') return onStart({ matchLength, difficulty, coachEnabled, playerColor, clockPreset });
        if (activeMode === 'multiplayer') return onOpenModule?.('multiplayer');
        if (activeMode === 'training') onOpenModule?.('drills');
    };

    const handleJoinOpenChallenge = (challenge: OpenMatchChallenge) => {
        setMatchLength(challenge.matchLength);
        setClockPreset(challenge.clockPreset);
        onOpenModule?.('multiplayer');
    };

    return (
        <main
            dir={dir} data-testid="lobby-main-scroll-container"
            className="h-dvh max-h-dvh w-full overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#090806] text-[#f7f3e8] selection:bg-[#d4af37]/30 flex flex-col relative"
        >
            <AppNavbar
                activeTab="play" onOpenModule={onOpenModule}
                onSelectPlayTab={() => setSelectedMode('ai')}
                onOpenSettings={() => { setSelectedMode('ai'); setShowOptions(true); }}
                onUserResolved={handleUserResolved}
            />

            <div className="relative z-10 flex flex-1 w-full">
                {/* 1. BARRE LATÉRALE GAUCHE RÉTRACTABLE (Cercle Monte-Carlo) */}
                <LobbyLeftSidebar
                    selectedMode={selectedMode}
                    matchLength={matchLength}
                    isSubmenuOpen={showOptions}
                    onQuickPlay={() => onStart({ matchLength, difficulty, coachEnabled, playerColor, clockPreset })}
                    onSelectMoneyGame={() => { setSelectedMode('ai'); setMatchLength(0); setShowOptions(true); }}
                    onSelectMatchGame={() => { setSelectedMode('ai'); setMatchLength((prev) => (prev === 0 ? 7 : prev)); setShowOptions(true); }}
                    onSelectAiMode={() => { setSelectedMode('ai'); setShowOptions(true); }}
                    onSelectMultiplayerMode={() => { setSelectedMode('multiplayer'); setShowOptions(false); }}
                    onOpenModule={onOpenModule}
                    onOpenTableClock={() => setIsTableClockOpen(true)}
                    onOpenSettings={() => { setSelectedMode('ai'); setShowOptions(true); }}
                />

                {/* 2. ESPACE CENTRAL AÉRÉ + VITRINE DROITE */}
                <div className="mx-auto flex flex-1 w-full max-w-6xl items-start justify-center gap-6 px-4 py-5 sm:px-8 sm:py-6">
                    <div className={`flex flex-1 min-w-0 ${showOptions ? 'max-w-5xl' : 'max-w-3xl'} flex-col gap-4`}>
                        <header className="flex w-full flex-col sm:flex-row items-center justify-between gap-1 border-b border-[#d4af37]/20 pb-3">
                            <div className="flex items-center gap-2.5">
                                <h1 className="font-display text-2xl sm:text-3xl italic font-bold tracking-wide text-[#f7f3e8]">BACKGAMMON</h1>
                                <span className="rounded border border-[#d4af37]/35 bg-[#d4af37]/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase text-[#f3d27a]">{ui.lobby.subtitle}</span>
                            </div>
                            <span data-testid="lobby-auth-status" className="inline-flex items-center gap-1.5 text-xs text-stone-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                <span>{displayName ? `${ui.lobby.activeMemberPrefix} · ${displayName}` : ui.lobby.privateSalonSession}</span>
                            </span>
                        </header>

                        {/* En mode Sous-Menu Jouer (showOptions === true), le configurateur Split-Screen + Grand Plateau occupe toute la scène */}
                        {selectedMode === 'ai' && showOptions && (
                            <section className="w-full">
                                <LobbyOptionsPanel
                                    matchLength={matchLength} setMatchLength={setMatchLength} difficulty={difficulty} setDifficulty={setDifficulty}
                                    coachEnabled={coachEnabled} setCoachEnabled={setCoachEnabled}
                                    playerColor={playerColor} onSelectPlayerColor={(c) => { setPlayerColor(c); storePlayerColor(c); }}
                                    matchFormats={matchFormats} opponents={opponents} clockPreset={clockPreset} setClockPreset={setClockPreset}
                                    onClose={() => setShowOptions(false)}
                                    onStartGame={handlePlay}
                                />
                            </section>
                        )}

                        <div className={showOptions ? 'sr-only' : 'flex flex-col gap-4 w-full'}>
                            <section aria-label="Modes de jeu" className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                                {mainCards.map((card) => {
                                    const active = selectedMode === card.id;
                                    return (
                                        <button key={card.id} type="button" data-testid={`lobby-card-${card.id}`} aria-pressed={active} onClick={() => setSelectedMode(card.id)} className={`group relative flex flex-col items-start justify-between gap-1 rounded-2xl border p-4 text-left transition-all duration-150 ${active ? 'border-[#f3c65f] bg-[#121629] shadow-[0_0_0_1px_rgba(243,198,95,0.25),0_8px_24px_rgba(0,0,0,0.45)]' : 'border-white/10 bg-[#121629]/60 hover:border-white/20 hover:bg-[#121629]'}`}>
                                            <div className="flex w-full items-center justify-between">
                                                <span className="text-base font-bold text-white">{card.title}</span>
                                                <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${active ? 'bg-[#f3c65f]/15 text-[#f3c65f]' : 'bg-white/5 text-slate-400'}`}>{card.badge}</span>
                                            </div>
                                            <span className="text-xs text-slate-400 line-clamp-1">{card.subtitle}</span>
                                        </button>
                                    );
                                })}
                            </section>

                            <div className="flex w-full flex-col gap-3.5 rounded-2xl border border-[#d4af37]/25 bg-[#120e0b] p-4 shadow-2xl">
                                {selectedMode === 'ai' && (
                                    <>
                                        <div data-testid="lobby-persona-quickbar" className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="group" aria-label="Adversaire Bot Personnifié">
                                            {(['beginner', 'intermediate', 'expert', 'grandmaster'] as const).map((lvl) => {
                                                const p = getBotPersona(lvl, locale) ?? BOT_PERSONAS_BY_DIFFICULTY[lvl];
                                                const active = !isMittensActive && difficulty === lvl;
                                                return (
                                                    <button key={lvl} type="button" data-testid={`lobby-persona-pill-${lvl}`} aria-pressed={active} onClick={() => { setIsMittensActive(false); setDifficulty(lvl); }} className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${active ? 'border-[#d4af37] bg-gradient-to-br from-[#d4af37]/20 to-[#1f160a] text-white shadow-[0_0_16px_rgba(212,175,55,0.25)]' : 'border-white/10 bg-white/[0.03] text-stone-300 hover:border-[#d4af37]/40 hover:text-white'}`}>
                                                        <BotPortraitMedallion character={lvl} size="sm" isActive={active} />
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate font-display text-sm italic font-bold text-[#f7f3e8]">{p.shortName}</span>
                                                            <span className="block truncate text-[11px] font-medium text-[#d4af37]">{p.styleBadge}</span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                            <button type="button" data-testid="lobby-persona-pill-mittens" aria-pressed={isMittensActive} onClick={() => { setIsMittensActive(true); setDifficulty('grandmaster'); }} className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${isMittensActive ? 'border-[#d4af37] bg-gradient-to-br from-rose-500/25 to-[#1f160a] text-white shadow-[0_0_16px_rgba(212,175,55,0.25)]' : 'border-white/10 bg-white/[0.03] text-stone-300 hover:border-[#d4af37]/40 hover:text-white'}`}>
                                                <BotPortraitMedallion character="mittens" size="sm" isActive={isMittensActive} />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate font-display text-sm italic font-bold text-[#f7f3e8]">Mittens</span>
                                                    <span className="block truncate text-[11px] font-medium text-rose-300">Elo ? · Énigme</span>
                                                </span>
                                            </button>
                                        </div>

                                        <div data-testid="lobby-direct-format-bar" className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <div className="inline-flex rounded-xl border border-white/10 bg-black/40 p-0.5">
                                                    <button type="button" data-testid="lobby-pill-match-mode" aria-pressed={matchLength > 0} onClick={() => setMatchLength((prev) => (prev === 0 ? 7 : prev))} className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${matchLength > 0 ? 'bg-[#f3c65f] text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'}`}>🏆 Match</button>
                                                    <button type="button" data-testid="lobby-pill-money-mode" aria-pressed={matchLength === 0} onClick={() => setMatchLength(0)} className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${matchLength === 0 ? 'bg-[#f3c65f] text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'}`}>💰 Money Game</button>
                                                </div>
                                                {matchLength > 0 ? (
                                                    <div className="inline-flex items-center gap-1" role="group" aria-label="Points du match">
                                                        {[1, 3, 5, 7, 11].map((pts) => (
                                                            <button key={pts} type="button" data-testid={`lobby-quick-pts-${pts}`} aria-pressed={matchLength === pts} onClick={() => setMatchLength(pts)} className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition ${matchLength === pts ? 'border-[#f3c65f] bg-[#f3c65f]/20 text-[#f3c65f]' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'}`}>{pts === 1 ? '1 pt' : `${pts} pts`}</button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span data-testid="lobby-money-rule-badge" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">Partie libre continue</span>
                                                )}
                                                <button
                                                    type="button" data-testid="lobby-fairbag36-toggle" aria-pressed={fairBag36Enabled}
                                                    onClick={() => setFairBag36Enabled((v) => !v)}
                                                    title="Mode Anti-Paranoïa Gammon36 : tirage sans remise des 36 combinaisons de dés (zéro série truquée)"
                                                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${fairBag36Enabled ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white'}`}
                                                >
                                                    🛡 {fairBag36Enabled ? 'Sac 36 Dés Actif' : 'Dés SHA-256'}
                                                </button>
                                            </div>
                                            <button type="button" onClick={() => setShowOptions((v) => !v)} aria-expanded={showOptions} data-testid="lobby-options-toggle" className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold text-slate-200 transition ${showOptions ? 'border-[#f3c65f] bg-slate-800' : 'border-white/10 bg-black/30 hover:border-white/20'}`}>
                                                <span>⚙️ {showOptions ? ui.lobby.collapse : ui.lobby.configure}</span>
                                            </button>
                                        </div>
                                    </>
                                )}

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1" data-testid="lobby-tournament-quickbar">
                                    <button type="button" data-testid="lobby-start-btn" onClick={handlePlay} className="flex-1 rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#f3c65f] via-[#f7d77e] to-[#e5b548] px-6 py-3 text-sm sm:text-base font-black uppercase tracking-wider text-slate-950 shadow-[0_4px_20px_rgba(243,198,95,0.35)] transition hover:brightness-105 active:scale-[0.99]">
                                        🎲 {selectedMode === 'multiplayer' ? ui.lobby.cardMultiTitle : selectedMode === 'training' ? ui.lobby.cardTrainingTitle : `${ui.lobby.playNow} · ${matchLength === 0 ? 'MONEY GAME' : `MATCH ${matchLength} PTS`}`}
                                    </button>
                                    <div className="flex items-center justify-end gap-1.5 shrink-0">
                                        <button type="button" data-testid="lobby-quick-scanner-btn" onClick={() => onOpenModule?.('import_export')} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] hover:text-white transition touch-manipulation">📷 Scanner</button>
                                        <button type="button" data-testid="lobby-quick-clock-btn" onClick={() => setIsTableClockOpen(true)} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] hover:text-white transition touch-manipulation">⏱️ Pendule</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedMode === 'training' && (
                            <section data-testid="lobby-training-submenu" className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
                                <button type="button" data-testid="lobby-training-puzzles-btn" onClick={() => onOpenModule?.('puzzles')} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#121629] p-3.5 text-left transition hover:border-white/20">
                                    <div><div className="text-sm font-bold text-white">{ui.lobby.dailyPuzzlesTitle}</div><div className="text-xs text-slate-400">{ui.lobby.dailyPuzzlesDesc}</div></div>
                                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#f3c65f]">{ui.lobby.openBtn}</span>
                                </button>
                                <button type="button" data-testid="lobby-training-drills-btn" onClick={() => onOpenModule?.('drills')} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#121629] p-3.5 text-left transition hover:border-white/20">
                                    <div><div className="text-sm font-bold text-white">{ui.lobby.blunderDrillsTitle}</div><div className="text-xs text-slate-400">{ui.lobby.blunderDrillsDesc}</div></div>
                                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#f3c65f]">{ui.lobby.openBtn}</span>
                                </button>
                            </section>
                        )}

                        {selectedMode === 'multiplayer' && (
                            <section className="w-full">
                                <OpenMatchesTable
                                    eloRating={snapshot.eloRating} averagePR={snapshot.averagePR} gamesPlayed={snapshot.gamesPlayed}
                                    onJoinChallenge={handleJoinOpenChallenge}
                                    onStartCalibrationMatch={() => onStart({ matchLength, difficulty, coachEnabled, playerColor, clockPreset })}
                                    onCreateChallenge={() => onOpenModule?.('multiplayer')}
                                />
                            </section>
                        )}

                        {!isInstalled && canInstall && (
                            <button type="button" onClick={() => void handleInstallClick()} data-testid="lobby-pwa-install-btn" aria-label={ui.pwa.installAppAria} className="flex sm:hidden items-center gap-2 rounded-xl border border-white/10 bg-[#121629] px-3.5 py-1.5 text-xs font-semibold text-slate-200">
                                <span>{ui.pwa.installApp}</span>
                                <span className="rounded bg-[#f3c65f]/15 px-1.5 py-0.5 text-[11px] font-mono font-bold text-[#f3c65f]">PWA</span>
                            </button>
                        )}

                        <section aria-label="Espace joueur et progression" data-testid="lobby-secondary-section" className={showOptions ? 'sr-only' : 'flex w-full flex-col gap-3 pt-1 pb-8'}>
                            <PlayerProfileCard
                                displayName={displayName} eloRating={snapshot.eloRating} averagePR={snapshot.averagePR}
                                gamesPlayed={snapshot.gamesPlayed} winsCount={snapshot.winsCount} puzzleStreak={snapshot.puzzleStreak}
                                onOpenReview={() => onOpenModule?.('stats')}
                            />
                            <CoachPreMatchBriefingCard onOpenDrills={() => onOpenModule?.('drills')} />
                            <LearningModulesGrid snapshot={snapshot} onOpenModule={onOpenModule} />
                            {recentMatches.length > 0 && (
                                <RecentMatchesSummary matches={recentMatches} onReviewMatch={() => onOpenModule?.('stats')} onOpenImportExport={() => onOpenModule?.('import_export')} />
                            )}
                        </section>
                    </div>

                    {/* 3. VITRINE DROITE (Table En Direct & Classement, masquée quand le grand plateau de configuration est ouvert) */}
                    {!showOptions && (
                        <LobbyRightShowcaseColumn
                            eloRating={snapshot.eloRating}
                            averagePR={snapshot.averagePR}
                            onQuickPlay={() => onStart({ matchLength, difficulty, coachEnabled, playerColor, clockPreset })}
                            onOpenStats={() => onOpenModule?.('stats')}
                        />
                    )}
                </div>
            </div>

            {/* 4. BOUTON FLOTTANT BAS-DROITE COACH IA */}
            <FloatingAiCoachWidget onOpenFullCoach={() => onOpenModule?.('drills')} />

            <TournamentTableClockModal
                isOpen={isTableClockOpen} onClose={() => setIsTableClockOpen(false)}
                onOpenPhotoScanner={() => { setIsTableClockOpen(false); onOpenModule?.('import_export'); }}
                initialMatchLength={matchLength || 7}
            />
        </main>
    );
};

export const LobbyScreen = React.memo(LobbyScreenComponent);
export default LobbyScreen;
