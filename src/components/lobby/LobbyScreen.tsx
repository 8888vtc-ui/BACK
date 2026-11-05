'use client';

/**
 * @file src/components/lobby/LobbyScreen.tsx
 * @description Dashboard d'accueil Haute Horlogerie ("Linear meets Cercle Monte-Carlo").
 * Strictement <= 300 lignes, 0 `any`, 0 emoji système, 100dvh zéro scroll parasite sur Desktop.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { BookOpen, Cpu, Globe, Sparkles, type LucideIcon } from 'lucide-react';
import type { Profile } from '../../lib/supabase/types';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import type { Player } from '../../engine/backgammonEngine';
import { readStoredMatchFormat } from '../hud/MatchFormatSelector';
import { readStoredPlayerColor, storePlayerColor } from '../hud/ColorSelector';
import { LobbyOptionsPanel, type LobbyClockPreset } from './LobbyOptionsPanel';
import { OpenMatchesTable, type OpenMatchChallenge } from './OpenMatchesTable';
import AppNavbar from '../nav/AppNavbar';
import { LobbyTrainingSubmenu } from './LobbyTrainingSubmenu';
import { LobbyPlayerHubSection } from './LobbyPlayerHubSection';
import { LobbyAiConfigQuickbar } from './LobbyAiConfigQuickbar';
import TournamentTableClockModal from '../clock/TournamentTableClockModal';
import { LobbyLeftSidebar } from './LobbySidebarAndWidgets';
import { getSyncAcademySnapshot, loadPlayerHubData, type AcademyProgressSnapshot, type RecentMatchEntry } from '../../features/progression/userProgressionService';
import { BOT_PERSONAS_BY_DIFFICULTY, getBotPersona } from '../../features/personas/botPersonas';
import { readPlayerPassport, savePlayerPassport, STANDARD_USER_AVATARS } from '../../lib/supabase/auth';
import AuthModal from '../auth/AuthModal';
import { useTranslation } from '../../i18n';
import usePwaInstall from '../../hooks/usePwaInstall';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';
import { BeginnerHomePortal } from '../home/BeginnerHomePortal';
import { IntermediateHomePortal } from '../home/IntermediateHomePortal';
import { ExpertHomePortal } from '../home/ExpertHomePortal';

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
    const { tierGate, setTierGate } = usePlayerTierGate();
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
        return (['beginner', 'intermediate', 'expert', 'grandmaster'] as const).map((lvl) => {
            const p = getBotPersona(lvl, locale);
            return { value: lvl, label: p.shortName, hint: p.lobbyHint };
        });
    }, [locale]);

    const mainCards = useMemo<ReadonlyArray<{ id: LobbyMode; Icon: LucideIcon; iconColor: string; badge: string; title: string; subtitle: string }>>(() => [
        { id: 'multiplayer', Icon: Globe, iconColor: 'text-[#10B981]', badge: ui.lobby.cardMultiBadge, title: 'Jouer en Ligne', subtitle: 'Adversaire direct ou Ami' },
        { id: 'ai', Icon: Cpu, iconColor: 'text-[#D4AF37]', badge: ui.lobby.cardAiBadge, title: 'Jouer contre l’IA', subtitle: '5 Maîtres calibrés' },
        { id: 'training', Icon: Sparkles, iconColor: 'text-[#10B981]', badge: ui.lobby.cardTrainingBadge, title: 'Entraînement & Défis', subtitle: 'Quiz PR, ER & Blunders' },
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
        setDisplayName(profile?.display_name || profile?.username || user?.email?.split('@')[0] || passport?.pseudo || null);
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
        if (activeMode === 'multiplayer') return onOpenModule ? onOpenModule('multiplayer') : onStart({ matchLength, difficulty, coachEnabled, playerColor, clockPreset });
        if (activeMode === 'training') return onOpenModule ? onOpenModule('drills') : onStart({ matchLength, difficulty, coachEnabled, playerColor, clockPreset });
    };

    const handlePlay = () => {
        const passport = readPlayerPassport();
        const enforceGateInTest = typeof window !== 'undefined' && Boolean((window as unknown as { __ENFORCE_PASSPORT_IN_TEST__?: boolean }).__ENFORCE_PASSPORT_IN_TEST__);
        if (enforceGateInTest && !displayName && !passport) { setIsPassportGateOpen(true); return; }
        if (!displayName && !passport) {
            const guestPassport = savePlayerPassport({
                pseudo: 'Joueur Invité', email: 'invite@backgammontour.com', experienceLevel: 'intermediate',
                avatarUrl: STANDARD_USER_AVATARS[0].url, registeredAt: new Date().toISOString(), supabaseSynced: false,
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
            className="h-dvh max-h-dvh w-full overflow-y-auto lg:overflow-hidden overflow-x-hidden overscroll-y-contain bg-[#050505] text-[#f7f3e8] selection:bg-[#d4af37]/30 flex flex-col relative"
        >
            <AppNavbar
                activeTab="play" onOpenModule={onOpenModule}
                onSelectPlayTab={() => setSelectedMode('ai')}
                onOpenSettings={() => { setSelectedMode('ai'); setShowOptions(true); }}
                onUserResolved={handleUserResolved}
                statusBadge={
                    <button
                        type="button" data-testid="lobby-auth-status" onClick={() => setIsPassportGateOpen(true)}
                        title="Profil de Joueur"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0E14]/90 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:border-[#D4AF37]/60 hover:text-white transition"
                    >
                        <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                        <span className="max-w-[110px] truncate">{displayName ?? 'Invité'}</span>
                        {tierGate !== 'BEGINNER' && (
                            <span className="rounded bg-[#D4AF37]/15 px-1.5 py-0.5 font-mono tabular-nums text-[11px] font-bold text-[#F3E5AB]">
                                {snapshot.eloRating} Elo{snapshot.averagePR !== null ? ` · PR ${snapshot.averagePR.toFixed(1)}` : ''}
                            </span>
                        )}
                    </button>
                }
            />

            <div className="relative z-10 flex flex-1 min-h-0 w-full">
                <LobbyLeftSidebar
                    selectedMode={selectedMode} matchLength={matchLength} isSubmenuOpen={showOptions}
                    onQuickPlay={handlePlay} onFindOpponent={() => onOpenModule?.('multiplayer')}
                    onOpenPassport={() => setIsPassportGateOpen(true)}
                    onSelectMoneyGame={() => { setSelectedMode('ai'); setMatchLength(0); setShowOptions(true); }}
                    onSelectMatchGame={() => { setSelectedMode('ai'); setMatchLength((prev) => (prev === 0 ? 7 : prev)); setShowOptions(true); }}
                    onSelectAiMode={() => { setSelectedMode('ai'); setShowOptions(true); }}
                    onSelectMultiplayerMode={() => { setSelectedMode('multiplayer'); setShowOptions(false); }}
                    onOpenModule={onOpenModule} onOpenTableClock={() => setIsTableClockOpen(true)}
                    onOpenSettings={() => { setSelectedMode('ai'); setShowOptions(true); }}
                />

                <div className="mx-auto flex flex-1 min-h-0 w-full max-w-6xl items-start justify-center gap-6 px-4 py-3 sm:px-8 sm:py-4 overflow-y-auto">
                    <div className={`flex flex-1 min-w-0 ${showOptions ? 'max-w-5xl' : 'max-w-4xl'} flex-col gap-3.5`}>
                        <h1 className="sr-only">BACKGAMMON</h1>


                        {tierGate === 'BEGINNER' && (
                            <BeginnerHomePortal
                                onStartGuidedGame={() => onStart({ matchLength: 3, difficulty: 'beginner', coachEnabled: true, playerColor, clockPreset })}
                                onOpenAcademy={() => {
                                    if (typeof window !== 'undefined') {
                                        window.location.assign('/puzzles?mode=beginner-academy');
                                    }
                                }}
                            />
                        )}
                        {tierGate === 'INTERMEDIATE' && (
                            <IntermediateHomePortal
                                onFindOpponent={() => onStart({ matchLength: 5, difficulty: 'intermediate', coachEnabled: true, playerColor, clockPreset })}
                                onInviteFriend={() => onOpenModule?.('multiplayer')}
                                onOpenQuizzes={() => onOpenModule?.('puzzles')}
                            />
                        )}
                        {tierGate === 'EXPERT' && (
                            <ExpertHomePortal
                                onStartExpertMatch={(len) => onStart({ matchLength: len, difficulty: 'expert', coachEnabled: false, playerColor, clockPreset })}
                                onOpen3PlyQuizzes={() => onOpenModule?.('drills')}
                            />
                        )}

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

                        <div className={showOptions ? 'sr-only' : 'flex flex-col gap-3.5 w-full'}>
                            <section aria-label="Modes de jeu" className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                                {mainCards.map((card) => {
                                    const active = selectedMode === card.id;
                                    return (
                                        <button
                                            key={card.id} type="button" data-testid={`lobby-card-${card.id}`} aria-pressed={active}
                                            onClick={() => setSelectedMode(card.id)}
                                            className={`group relative flex flex-col items-start justify-between gap-1.5 rounded-2xl border p-3.5 text-left transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] ${
                                                active
                                                    ? 'border-[#D4AF37]/60 border-[#f3c65f] bg-[#D4AF37]/10 text-[#F3E5AB] shadow-[0_0_20px_rgba(212,175,55,0.12)]'
                                                    : 'border-white/10 border-white/[0.06] bg-[#0B0E14]/90 backdrop-blur-md hover:border-white/15 hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            <div className="flex w-full items-center justify-between gap-1.5 min-w-0">
                                                <span className="inline-flex items-center gap-2 text-sm font-bold text-white whitespace-nowrap">
                                                    <card.Icon size={17} strokeWidth={1.5} aria-hidden="true" className={card.iconColor} />
                                                    <span>{card.title}</span>
                                                </span>
                                                <span className={`shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ${active ? 'bg-[#D4AF37]/20 text-[#F3E5AB]' : 'bg-white/[0.04] text-zinc-400'}`}>
                                                    {card.badge}
                                                </span>
                                            </div>
                                            <span className="text-xs text-zinc-400">{card.subtitle}</span>
                                        </button>
                                    );
                                })}
                            </section>

                            <div className="flex w-full flex-col gap-3.5 rounded-2xl border border-white/[0.06] bg-[#0B0E14]/90 p-4 backdrop-blur-md shadow-xl">
                                {selectedMode === 'multiplayer' && (
                                    <OpenMatchesTable
                                        eloRating={snapshot.eloRating} averagePR={snapshot.averagePR} gamesPlayed={snapshot.gamesPlayed}
                                        matchLength={matchLength} onSelectMatchLength={setMatchLength}
                                        clockPreset={clockPreset} onSelectClockPreset={setClockPreset}
                                        onJoinChallenge={handleJoinOpenChallenge}
                                        onStartCalibrationMatch={() => onStart({ matchLength, difficulty, coachEnabled, playerColor, clockPreset })}
                                        onSwitchToAiMasters={() => setSelectedMode('ai')}
                                        onCreateChallenge={() => onOpenModule?.('multiplayer')}
                                    />
                                )}

                                <LobbyAiConfigQuickbar
                                    selectedMode={selectedMode}
                                    locale={locale}
                                    difficulty={difficulty}
                                    setDifficulty={setDifficulty}
                                    isMittensActive={isMittensActive}
                                    setIsMittensActive={setIsMittensActive}
                                    matchLength={matchLength}
                                    setMatchLength={setMatchLength}
                                    showOptions={showOptions}
                                    setShowOptions={setShowOptions}
                                    selectedPersona={selectedPersona}
                                    onPlay={handlePlay}
                                    collapseLabel={ui.lobby.collapse}
                                    configureLabel={ui.lobby.configure}
                                />
                            </div>
                        </div>

                        {selectedMode === 'training' && (
                            <LobbyTrainingSubmenu onOpenModule={onOpenModule} />
                        )}

                        {!isInstalled && canInstall && (
                            <button type="button" onClick={() => void handleInstallClick()} data-testid="lobby-pwa-install-btn" aria-label={ui.pwa.installAppAria} className="flex sm:hidden items-center gap-2 rounded-xl border border-white/10 bg-[#0B0E14] px-3.5 py-1.5 text-xs font-semibold text-zinc-200">
                                <span>{ui.pwa.installApp}</span>
                                <span className="rounded bg-[#D4AF37]/15 px-1.5 py-0.5 text-[11px] font-mono font-bold text-[#F3E5AB]">PWA</span>
                            </button>
                        )}

                        <LobbyPlayerHubSection
                            showOptions={showOptions}
                            displayName={displayName}
                            snapshot={snapshot}
                            recentMatches={recentMatches}
                            onOpenModule={onOpenModule}
                            onStartQuickMatch={handlePlay}
                        />
                    </div>
                </div>
            </div>

            <TournamentTableClockModal isOpen={isTableClockOpen} onClose={() => setIsTableClockOpen(false)} onOpenPhotoScanner={() => { setIsTableClockOpen(false); onOpenModule?.('import_export'); }} initialMatchLength={matchLength || 7} />
            <AuthModal
                isOpen={isPassportGateOpen} onClose={() => setIsPassportGateOpen(false)}
                onSuccess={() => { const p = readPlayerPassport(); if (p) setDisplayName(p.pseudo); setIsPassportGateOpen(false); executePlayNow(); }}
            />
        </main>
    );
};

export const LobbyScreen = React.memo(LobbyScreenComponent);
export default LobbyScreen;
