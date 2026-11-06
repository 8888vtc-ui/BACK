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
import { useAuthenticPlayerStats } from '../../hooks/useAuthenticPlayerStats';
import { BeginnerHomePortal } from '../home/BeginnerHomePortal';
import { IntermediateHomePortal } from '../home/IntermediateHomePortal';
import { ExpertHomePortal } from '../home/ExpertHomePortal';

export type LobbyModuleId = 'multiplayer' | 'openings' | 'stats' | 'drills' | 'puzzles' | 'import_export' | 'tournaments' | 'private_room';
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
    const authenticStats = useAuthenticPlayerStats();

    const matchFormats = useMemo(() => [
        { value: 0, label: ui.lobby.moneyGame, hint: ui.lobby.formatMoneyHint },
        { value: 3, label: '3 pts', hint: ui.lobby.formatShortHint },
        { value: 5, label: '5 pts', hint: ui.lobby.formatFastHint },
        { value: 7, label: '7 pts', hint: ui.lobby.formatStandardHint },
        { value: 9, label: '9 pts', hint: 'Format Championnat' },
        { value: 11, label: '11 pts', hint: ui.lobby.formatLongHint },
    ], [ui.lobby]);

    const opponents = useMemo<Array<{ value: AIDifficulty; label: string; hint: string }>>(() => [
        { value: 'beginner', label: 'Le Professeur', hint: 'PR 18–25 • 1200 Elo' },
        { value: 'intermediate', label: 'Joueur de Club', hint: 'PR 8–12 • 1550 Elo' },
        { value: 'expert', label: 'Compétiteur', hint: 'PR 4.5–7 • 1850 Elo' },
        { value: 'grandmaster', label: 'Grand-Maître 3-Ply', hint: 'PR < 2.5 • 2200 Elo' },
    ], []);

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

                        {showOptions ? (
                            <section className="w-full">
                                <LobbyOptionsPanel
                                    matchLength={matchLength} setMatchLength={setMatchLength} difficulty={difficulty} setDifficulty={setDifficulty}
                                    coachEnabled={coachEnabled} setCoachEnabled={setCoachEnabled}
                                    playerColor={playerColor} onSelectPlayerColor={(c) => { setPlayerColor(c); storePlayerColor(c); }}
                                    matchFormats={matchFormats} opponents={opponents} clockPreset={clockPreset} setClockPreset={setClockPreset}
                                    onClose={() => setShowOptions(false)} onStartGame={handlePlay}
                                />
                            </section>
                        ) : (
                            <>
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
                                        onFindOpponent={(len) => onStart({ matchLength: len ?? 5, difficulty: 'intermediate', coachEnabled: true, playerColor, clockPreset })}
                                        onInviteFriend={() => onOpenModule?.('private_room')}
                                        onOpenQuizzes={() => onOpenModule?.('puzzles')}
                                    />
                                )}
                                {tierGate === 'EXPERT' && (
                                    <ExpertHomePortal
                                        onStartExpertMatch={(len) => onStart({ matchLength: len, difficulty: 'expert', coachEnabled: false, playerColor, clockPreset })}
                                        onInviteFriend={() => onOpenModule?.('private_room')}
                                        onOpen3PlyQuizzes={() => onOpenModule?.('puzzles')}
                                        onOpenPlayerCard={() => setIsPassportGateOpen(true)}
                                    />
                                )}
                            </>
                        )}
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
