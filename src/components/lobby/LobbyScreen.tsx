'use client';

/**
 * Écran d'accueil — Design Aéré & Limpide (Sidebar Gauche Rétractable + Cockpit Central + Vitrine Droite + Chat Coach IA).
 * Conforme à SCALABILITY.md (LOI 5 : strictement 0 any, < 300 lignes).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
import TournamentTableClockModal from '../clock/TournamentTableClockModal';
import { LobbyLeftSidebar } from './LobbySidebarAndWidgets';
import { BotPortraitMedallion } from '../common/MonteCarloIcons';
import { getSyncAcademySnapshot, loadPlayerHubData, type AcademyProgressSnapshot, type RecentMatchEntry } from '../../features/progression/userProgressionService';
import { BOT_PERSONAS_BY_DIFFICULTY, getBotPersona } from '../../features/personas/botPersonas';
import { readPlayerPassport, savePlayerPassport, STANDARD_USER_AVATARS } from '../../lib/supabase/auth';
import AuthModal from '../auth/AuthModal';
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

const BOT_ELO_BY_DIFF: Record<AIDifficulty, string> = {
    beginner: '1420 Elo',
    intermediate: '1680 Elo',
    expert: '1950 Elo',
    grandmaster: '2150 Elo',
};

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
    const [selectedMode, setSelectedMode] = useState<LobbyMode | null>('multiplayer');
    const [showOptions, setShowOptions] = useState(false);
    const [isTableClockOpen, setIsTableClockOpen] = useState(false);
    const [isPassportGateOpen, setIsPassportGateOpen] = useState(false);
    const [displayName, setDisplayName] = useState<string | null>(() => readPlayerPassport()?.pseudo ?? null);
    const [snapshot, setSnapshot] = useState<AcademyProgressSnapshot>(() => getSyncAcademySnapshot());
    const [recentMatches, setRecentMatches] = useState<RecentMatchEntry[]>([]);
    const [isMittensActive, setIsMittensActive] = useState<boolean>(false);

    const matchFormats = useMemo(() => [
        { value: 0, label: ui.lobby.moneyGame, hint: ui.lobby.formatMoneyHint },
        { value: 3, label: '3 pts', hint: ui.lobby.formatShortHint },
        { value: 5, label: '5 pts', hint: ui.lobby.formatFastHint },
        { value: 7, label: '7 pts', hint: ui.lobby.formatStandardHint },
        { value: 9, label: '9 pts', hint: 'Format Championnat' },
        { value: 11, label: '11 pts', hint: ui.lobby.formatLongHint },
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
        { id: 'multiplayer', icon: '🌐', badge: ui.lobby.cardMultiBadge, title: '🌐 Jouer en Ligne', subtitle: 'Adversaire direct ou Ami' },
        { id: 'ai', icon: '🤖', badge: ui.lobby.cardAiBadge, title: '🤖 Jouer contre l’IA', subtitle: '5 Maîtres calibrés' },
        { id: 'training', icon: '🧩', badge: ui.lobby.cardTrainingBadge, title: '🧩 Entraînement & Défis', subtitle: 'Quizz PR, ERH & Blunders' },
    ], [ui.lobby]);

    const selectedPersona = useMemo(() => getBotPersona(difficulty, locale) ?? BOT_PERSONAS_BY_DIFFICULTY[difficulty], [difficulty, locale]);

    useEffect(() => {
        setMatchLength(readStoredMatchFormat());
        setPlayerColor(readStoredPlayerColor());
        setSnapshot(getSyncAcademySnapshot());
        void loadPlayerHubData(null).then((res) => { setSnapshot(res.snapshot); setRecentMatches(res.recentMatches); });
    }, []);

    const handleUserResolved = useCallback((user: User | null, profile: Profile | null) => {
        const passport = readPlayerPassport();
        setDisplayName(
            profile?.display_name ||
                profile?.username ||
                user?.email?.split('@')[0] ||
                passport?.pseudo ||
                null,
        );
        loadPlayerHubData(user?.id ?? null)
            .then((res) => {
                setSnapshot((prev) => ({ ...res.snapshot, eloRating: profile?.rating ?? res.snapshot.eloRating ?? prev.eloRating }));
                setRecentMatches(res.recentMatches);
            })
            .catch(() => {});
    }, []);

    const executePlayNow = () => {
        const activeMode = selectedMode ?? 'multiplayer';
        if (activeMode === 'ai') return onStart({ matchLength, difficulty, coachEnabled, playerColor, clockPreset });
        if (activeMode === 'multiplayer') {
            if (onOpenModule) return onOpenModule('multiplayer');
            return onStart({ matchLength, difficulty, coachEnabled, playerColor, clockPreset });
        }
        if (activeMode === 'training') {
            if (onOpenModule) return onOpenModule('drills');
            return onStart({ matchLength, difficulty, coachEnabled, playerColor, clockPreset });
        }
    };

    const handlePlay = () => {
        const passport = readPlayerPassport();
        const enforceGateInTest =
            typeof window !== 'undefined' &&
            Boolean((window as unknown as { __ENFORCE_PASSPORT_IN_TEST__?: boolean }).__ENFORCE_PASSPORT_IN_TEST__);
        if (enforceGateInTest && !displayName && !passport) {
            setIsPassportGateOpen(true);
            return;
        }
        if (!displayName && !passport) {
            const guestPassport = savePlayerPassport({
                pseudo: 'Invité Monte-Carlo',
                email: 'invite@backgammontour.com',
                experienceLevel: 'intermediate',
                avatarUrl: STANDARD_USER_AVATARS[0].url,
                registeredAt: new Date().toISOString(),
                supabaseSynced: false,
            });
            setDisplayName(guestPassport.pseudo);
        }
        executePlayNow();
    };

    const handleJoinOpenChallenge = (challenge: OpenMatchChallenge) => {
        setMatchLength(challenge.matchLength);
        setClockPreset(challenge.clockPreset);
        onOpenModule?.('multiplayer');
    };

        return (
        <main
            dir={dir} data-testid="lobby-main-scroll-container"
            className="h-dvh max-h-dvh w-full overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#050505] text-[#f7f3e8] selection:bg-[#d4af37]/30 flex flex-col relative"
        >
            <AppNavbar
                activeTab="play" onOpenModule={onOpenModule}
                onSelectPlayTab={() => setSelectedMode('ai')}
                onOpenSettings={() => { setSelectedMode('ai'); setShowOptions(true); }}
                onUserResolved={handleUserResolved}
                statusBadge={
                    <button
                        type="button"
                        data-testid="lobby-auth-status"
                        onClick={() => setIsPassportGateOpen(true)}
                        title="Performance Rating (PR) : mesure la précision de vos coups, plus il est bas, meilleur vous êtes"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#12151C] px-2.5 py-1 text-xs font-semibold text-stone-200 hover:border-[#d4af37] hover:text-white transition"
                    >
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="max-w-[110px] truncate">{displayName ?? 'Invité'}</span>
                        <span className="rounded bg-[#d4af37]/15 px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#f3c65f]">
                            {snapshot.eloRating} Elo{snapshot.averagePR !== null ? ` · PR ${snapshot.averagePR.toFixed(1)}` : ''}
                        </span>
                    </button>
                }
            />

            <div className="relative z-10 flex flex-1 w-full">
                <LobbyLeftSidebar
                    selectedMode={selectedMode} matchLength={matchLength} isSubmenuOpen={showOptions}
                    onQuickPlay={handlePlay}
                    onFindOpponent={() => onOpenModule?.('multiplayer')}
                    onOpenPassport={() => setIsPassportGateOpen(true)}
                    onSelectMoneyGame={() => { setSelectedMode('ai'); setMatchLength(0); setShowOptions(true); }}
                    onSelectMatchGame={() => { setSelectedMode('ai'); setMatchLength((prev) => (prev === 0 ? 7 : prev)); setShowOptions(true); }}
                    onSelectAiMode={() => { setSelectedMode('ai'); setShowOptions(true); }}
                    onSelectMultiplayerMode={() => { setSelectedMode('multiplayer'); setShowOptions(false); }}
                    onOpenModule={onOpenModule} onOpenTableClock={() => setIsTableClockOpen(true)}
                    onOpenSettings={() => { setSelectedMode('ai'); setShowOptions(true); }}
                />

                <div className="mx-auto flex flex-1 w-full max-w-6xl items-start justify-center gap-6 px-4 py-4 sm:px-8 sm:py-5">
                    <div className={`flex flex-1 min-w-0 ${showOptions ? 'max-w-5xl' : 'max-w-3xl'} flex-col gap-3.5`}>
                        <h1 className="sr-only">BACKGAMMON</h1>

                        {selectedMode === 'ai' && showOptions && (
                            <section className="w-full">
                                <LobbyOptionsPanel
                                    matchLength={matchLength} setMatchLength={setMatchLength} difficulty={difficulty} setDifficulty={setDifficulty}
                                    coachEnabled={coachEnabled} setCoachEnabled={setCoachEnabled}
                                    playerColor={playerColor} onSelectPlayerColor={(c) => { setPlayerColor(c); storePlayerColor(c); }}
                                    matchFormats={matchFormats} opponents={opponents} clockPreset={clockPreset} setClockPreset={setClockPreset}
                                    onClose={() => setShowOptions(false)} onStartGame={handlePlay}
                                />
                            </section>
                        )}

                        <div className={showOptions ? 'sr-only' : 'flex flex-col gap-4 w-full'}>
                            <section aria-label="Modes de jeu" className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                                {mainCards.map((card) => {
                                    const active = selectedMode === card.id;
                                    const cardTooltip =
                                        card.id === 'training'
                                            ? 'PR (Performance Rating) : précision mathématique · ERH (Équité Réelle Humaine) : psychologie et pièges adverses'
                                            : undefined;
                                    return (
                                        <button key={card.id} type="button" data-testid={`lobby-card-${card.id}`} title={cardTooltip} aria-pressed={active} onClick={() => setSelectedMode(card.id)} className={`group relative flex flex-col items-start justify-between gap-1 rounded-2xl border p-3 sm:p-3.5 text-left transition-all duration-150 ${active ? 'border-[#f3c65f] bg-[#12151C] shadow-[0_0_0_1px_rgba(243,198,95,0.25),0_8px_24px_rgba(0,0,0,0.45)]' : 'border-white/10 bg-[#12151C]/60 hover:border-white/20 hover:bg-[#12151C]'}`}>
                                            <div className="flex w-full items-center justify-between gap-1.5 min-w-0">
                                                <span className="text-sm sm:text-base font-bold text-white whitespace-nowrap">{card.title}</span>
                                                <span className={`shrink-0 whitespace-nowrap rounded-md px-1.5 sm:px-2 py-0.5 text-[11px] font-semibold ${active ? 'bg-[#f3c65f]/15 text-[#f3c65f]' : 'bg-white/5 text-slate-400'}`}>{card.badge}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">{card.subtitle}</span>
                                        </button>
                                    );
                                })}
                            </section>

                            <div className="flex w-full flex-col gap-3.5 rounded-2xl border border-[#d4af37]/30 bg-gradient-to-b from-[#17110b] to-[#0e0b08] p-4 shadow-2xl">
                                {selectedMode === 'multiplayer' && (
                                    <OpenMatchesTable
                                        eloRating={snapshot.eloRating}
                                        averagePR={snapshot.averagePR}
                                        gamesPlayed={snapshot.gamesPlayed}
                                        matchLength={matchLength}
                                        onSelectMatchLength={setMatchLength}
                                        clockPreset={clockPreset}
                                        onSelectClockPreset={setClockPreset}
                                        onJoinChallenge={handleJoinOpenChallenge}
                                        onStartCalibrationMatch={() => onStart({ matchLength, difficulty, coachEnabled, playerColor, clockPreset })}
                                        onSwitchToAiMasters={() => setSelectedMode('ai')}
                                        onCreateChallenge={() => onOpenModule?.('multiplayer')}
                                    />
                                )}

                                {/* Galerie de Portraits Haute-Couture des 5 Adversaires du Cercle Monte-Carlo */}
                                <div className={selectedMode === 'ai' ? 'flex flex-col gap-3.5' : 'hidden'}>
                                    <div data-testid="lobby-persona-quickbar" className="flex overflow-x-auto pb-1 sm:pb-0 sm:grid sm:grid-cols-5 gap-2 sm:gap-2.5 snap-x" role="group" aria-label="Adversaire Bot Personnifié">
                                        {(['beginner', 'intermediate', 'expert', 'grandmaster'] as const).map((lvl) => {
                                            const p = getBotPersona(lvl, locale) ?? BOT_PERSONAS_BY_DIFFICULTY[lvl];
                                            const active = !isMittensActive && difficulty === lvl;
                                            return (
                                                <button
                                                    key={lvl}
                                                    type="button"
                                                    data-testid={`lobby-persona-pill-${lvl}`}
                                                    aria-pressed={active}
                                                    onClick={() => { setIsMittensActive(false); setDifficulty(lvl); }}
                                                    className={`min-w-[128px] sm:min-w-0 shrink-0 snap-start flex flex-col items-center gap-1 sm:gap-1.5 rounded-2xl border p-2 sm:p-2.5 text-center transition-all duration-200 ${
                                                        active
                                                            ? 'border-2 border-[#f3c65f] bg-gradient-to-b from-[#d4af37]/25 via-[#241a0d] to-[#120d07] text-white shadow-[0_0_24px_rgba(243,198,95,0.35)] -translate-y-0.5'
                                                            : 'border-white/10 bg-black/45 text-stone-300 hover:border-[#d4af37]/50 hover:bg-[#1a130b] hover:text-white'
                                                    }`}
                                                >
                                                    <BotPortraitMedallion character={lvl} size="md" isActive={active} />
                                                    <span className="w-full truncate font-display text-xs sm:text-sm italic font-black text-[#f7f3e8] leading-tight">
                                                        {p.shortName}
                                                    </span>
                                                    <span className="w-full truncate text-[10px] font-bold uppercase tracking-normal text-[#f3c65f]">
                                                        {p.styleBadge}
                                                    </span>
                                                    <span
                                                        title="Performance Rating : mesure la précision de vos coups, plus il est bas, meilleur vous êtes"
                                                        className="whitespace-nowrap rounded-md border border-[#d4af37]/35 bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-200 tracking-tight cursor-help"
                                                    >
                                                        {BOT_ELO_BY_DIFF[lvl]} · PR {p.targetErrorRate}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            data-testid="lobby-persona-pill-mittens"
                                            aria-pressed={isMittensActive}
                                            onClick={() => { setIsMittensActive(true); setDifficulty('grandmaster'); }}
                                            className={`min-w-[128px] sm:min-w-0 shrink-0 snap-start flex flex-col items-center gap-1 sm:gap-1.5 rounded-2xl border p-2 sm:p-2.5 text-center transition-all duration-200 ${
                                                isMittensActive
                                                    ? 'border-2 border-rose-400 bg-gradient-to-b from-rose-500/30 via-[#241016] to-[#12080b] text-white shadow-[0_0_24px_rgba(244,63,94,0.4)] -translate-y-0.5'
                                                    : 'border-white/10 bg-black/45 text-stone-300 hover:border-rose-400/50 hover:bg-[#1a0d12] hover:text-white'
                                            }`}
                                        >
                                            <BotPortraitMedallion character="mittens" size="md" isActive={isMittensActive} />
                                            <span className="w-full truncate font-display text-xs sm:text-sm italic font-black text-[#f7f3e8] leading-tight">
                                                Lord Mittens
                                            </span>
                                            <span className="w-full truncate text-[10px] font-bold uppercase tracking-normal text-rose-300">
                                                Boss Secret
                                            </span>
                                            <span
                                                title="Performance Rating : mesure la précision de vos coups, plus il est bas, meilleur vous êtes"
                                                className="whitespace-nowrap rounded-md border border-rose-400/40 bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-200 tracking-tight cursor-help"
                                            >
                                                Elo ??? · PR 0.1
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div data-testid="lobby-direct-format-bar" className={selectedMode === 'ai' ? 'flex flex-wrap items-center justify-between gap-2 pt-1' : 'sr-only'}>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <div className="inline-flex rounded-xl border border-white/10 bg-black/40 p-0.5 gap-0.5">
                                            <button type="button" data-testid="lobby-pill-match-mode" aria-pressed={matchLength > 0} onClick={() => setMatchLength((prev) => (prev === 0 ? 7 : prev))} className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${matchLength > 0 ? 'border-[#d4af37] bg-[#d4af37]/15 text-[#f3c65f] shadow-sm' : 'border-transparent text-slate-300 hover:text-white'}`}>🏆 Match</button>
                                            <button type="button" data-testid="lobby-pill-money-mode" aria-pressed={matchLength === 0} onClick={() => setMatchLength(0)} className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${matchLength === 0 ? 'border-[#d4af37] bg-[#d4af37]/15 text-[#f3c65f] shadow-sm' : 'border-transparent text-slate-300 hover:text-white'}`}>💰 Money Game</button>
                                        </div>
                                        {matchLength > 0 ? (
                                            <div className="inline-flex items-center gap-1" role="group" aria-label="Points du match">
                                                {[3, 5, 7, 9, 11].map((pts) => (
                                                    <button key={pts} type="button" data-testid={`lobby-quick-pts-${pts}`} aria-pressed={matchLength === pts} onClick={() => setMatchLength(pts)} className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition ${matchLength === pts ? 'border-[#f3c65f] bg-[#f3c65f]/20 text-[#f3c65f]' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'}`}>{`${pts} pts`}</button>
                                                ))}
                                            </div>
                                        ) : (
                                            <span data-testid="lobby-money-rule-badge" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">Partie libre continue</span>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setShowOptions((v) => !v)} aria-expanded={showOptions} data-testid="lobby-options-toggle" className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold text-slate-200 transition ${showOptions ? 'border-[#f3c65f] bg-slate-800' : 'border-white/10 bg-black/30 hover:border-white/20'}`}>
                                        <span>⚙️ {showOptions ? ui.lobby.collapse : ui.lobby.configure}</span>
                                    </button>
                                </div>

                                {/* BOUTON PLEIN OR (#D4AF37) RÉSERVÉ AU MODE IA (PAS DE DOUBLON EN MODE EN LIGNE) */}
                                <div className={selectedMode === 'ai' ? 'max-sm:sticky max-sm:bottom-2 max-sm:z-30 max-sm:rounded-2xl max-sm:bg-[#0e0b08]/95 max-sm:p-2 max-sm:shadow-2xl max-sm:backdrop-blur-md flex items-center justify-between gap-2 pt-1' : 'sr-only'} data-testid="lobby-tournament-quickbar">
                                    <button type="button" data-testid="lobby-start-btn" onClick={handlePlay} className="w-full rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#d4af37] via-[#f7d77e] to-[#b88924] px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-[#050505] shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition hover:brightness-105 active:scale-[0.99]">
                                        {`🎲 ${isMittensActive ? 'Lord Mittens' : selectedPersona.shortName} · ${matchLength === 0 ? 'MONEY GAME' : `MATCH ${matchLength} PTS`}`}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {selectedMode === 'training' && (
                            <section data-testid="lobby-training-submenu" className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
                                <Link href="/drills?mode=personal_blunders" data-testid="lobby-training-personal-blunders-btn" className="flex items-center justify-between rounded-xl border border-rose-400/35 bg-[#1a1016] p-3.5 text-left transition hover:border-rose-400/60">
                                    <div>
                                        <div className="text-sm font-bold text-rose-100">🔥 Revoir mes Blunders</div>
                                        <div className="text-xs text-rose-200/80">Corrigez vos erreurs issues de vos parties</div>
                                    </div>
                                    <span className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-200">{ui.lobby.openBtn}</span>
                                </Link>
                                <button type="button" data-testid="lobby-training-drills-btn" onClick={() => onOpenModule?.('drills')} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#121629] p-3.5 text-left transition hover:border-white/20">
                                    <div><div className="text-sm font-bold text-white">{ui.lobby.blunderDrillsTitle}</div><div className="text-xs text-slate-400">{ui.lobby.blunderDrillsDesc}</div></div>
                                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#f3c65f]">{ui.lobby.openBtn}</span>
                                </button>
                                <button type="button" data-testid="lobby-training-puzzles-btn" onClick={() => onOpenModule?.('puzzles')} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#121629] p-3.5 text-left transition hover:border-white/20">
                                    <div><div className="text-sm font-bold text-white">{ui.lobby.dailyPuzzlesTitle}</div><div className="text-xs text-slate-400">{ui.lobby.dailyPuzzlesDesc}</div></div>
                                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#f3c65f]">{ui.lobby.openBtn}</span>
                                </button>
                                <button type="button" data-testid="lobby-training-openings-btn" onClick={() => onOpenModule?.('openings')} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#121629] p-3.5 text-left transition hover:border-white/20">
                                    <div>
                                        <div className="text-sm font-bold text-white">📖 Les 15 Ouvertures</div>
                                        <div className="text-xs text-slate-400">Encyclopédie interactive des 15 lancers initiaux</div>
                                    </div>
                                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#f3c65f]">{ui.lobby.openBtn}</span>
                                </button>
                            </section>
                        )}

                        {!isInstalled && canInstall && (
                            <button type="button" onClick={() => void handleInstallClick()} data-testid="lobby-pwa-install-btn" aria-label={ui.pwa.installAppAria} className="flex sm:hidden items-center gap-2 rounded-xl border border-white/10 bg-[#121629] px-3.5 py-1.5 text-xs font-semibold text-slate-200">
                                <span>{ui.pwa.installApp}</span>
                                <span className="rounded bg-[#f3c65f]/15 px-1.5 py-0.5 text-[11px] font-mono font-bold text-[#f3c65f]">PWA</span>
                            </button>
                        )}

                        <section aria-label="Espace joueur et progression" data-testid="lobby-secondary-section" className={showOptions ? 'sr-only' : 'flex w-full flex-col gap-3 pt-1 pb-6'}>
                            <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-[#12151C]/70 p-3.5 shadow-xl">
                                <PlayerProfileCard
                                    displayName={displayName} eloRating={snapshot.eloRating} averagePR={snapshot.averagePR}
                                    gamesPlayed={snapshot.gamesPlayed} winsCount={snapshot.winsCount} puzzleStreak={snapshot.puzzleStreak}
                                    onOpenReview={() => onOpenModule?.('stats')}
                                />
                                <LearningModulesGrid snapshot={snapshot} onOpenModule={onOpenModule} />
                            </div>
                            {recentMatches.length > 0 && (
                                <RecentMatchesSummary matches={recentMatches} onReviewMatch={() => onOpenModule?.('stats')} onOpenImportExport={() => onOpenModule?.('import_export')} />
                            )}
                        </section>
                    </div>
                </div>
            </div>

            <TournamentTableClockModal
                isOpen={isTableClockOpen} onClose={() => setIsTableClockOpen(false)}
                onOpenPhotoScanner={() => { setIsTableClockOpen(false); onOpenModule?.('import_export'); }}
                initialMatchLength={matchLength || 7}
            />

            <AuthModal
                isOpen={isPassportGateOpen}
                onClose={() => setIsPassportGateOpen(false)}
                onSuccess={() => {
                    const p = readPlayerPassport();
                    if (p) setDisplayName(p.pseudo);
                    setIsPassportGateOpen(false);
                    executePlayNow();
                }}
            />
        </main>
    );
};

export const LobbyScreen = React.memo(LobbyScreenComponent);
export default LobbyScreen;
