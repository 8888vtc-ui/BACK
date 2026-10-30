'use client';

/**
 * Écran d'accueil — Design Pro Compétitif 2026 (Épuré, Zéro Sépia, Bento Compact).
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
import { getSyncAcademySnapshot, loadPlayerHubData, type AcademyProgressSnapshot, type RecentMatchEntry } from '../../features/progression/userProgressionService';
import { useTranslation } from '../../i18n';
import usePwaInstall from '../../hooks/usePwaInstall';

export type LobbyModuleId = 'multiplayer' | 'openings' | 'stats' | 'drills' | 'puzzles' | 'import_export';
type LobbyMode = 'ai' | 'multiplayer' | 'training';

export interface LobbySelection {
    matchLength: number;
    difficulty: AIDifficulty;
    coachEnabled: boolean;
    playerColor?: Player;
    clockPreset?: LobbyClockPreset;
}

export interface LobbyScreenProps {
    onStart: (selection: LobbySelection) => void;
    onOpenModule?: (moduleId: LobbyModuleId) => void;
    initialMatchLength?: number;
    initialDifficulty?: AIDifficulty;
    initialCoachEnabled?: boolean;
    initialClockPreset?: LobbyClockPreset;
}

const LobbyScreenComponent: React.FC<LobbyScreenProps> = ({
    onStart, onOpenModule, initialMatchLength = 7, initialDifficulty = 'expert', initialCoachEnabled = true, initialClockPreset = 'normal',
}) => {
    const { ui, dir } = useTranslation();
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

    const matchFormats = useMemo(() => [
        { value: 0, label: ui.lobby.moneyGame, hint: ui.lobby.formatMoneyHint }, { value: 3, label: '3 pts', hint: ui.lobby.formatShortHint },
        { value: 5, label: '5 pts', hint: ui.lobby.formatFastHint }, { value: 7, label: '7 pts', hint: ui.lobby.formatStandardHint }, { value: 11, label: '11 pts', hint: ui.lobby.formatLongHint },
    ], [ui.lobby]);

    const opponents = useMemo<Array<{ value: AIDifficulty; label: string; hint: string }>>(() => [
        { value: 'beginner', label: ui.lobby.opponentNovice, hint: 'Blitz agressif · 1-ply bruité' },
        { value: 'intermediate', label: ui.lobby.opponentIntermediate, hint: 'Holding & Pièges · 1-ply' },
        { value: 'expert', label: ui.lobby.opponentMaster, hint: 'Course & Videau · 2-ply' },
        { value: 'grandmaster', label: ui.lobby.opponentGrandmaster, hint: 'Open Sage 3-ply (PR 0.23)' },
    ], [ui.lobby]);

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
            className="h-dvh max-h-dvh w-full overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#070a12] text-slate-100 selection:bg-amber-500/30 flex flex-col relative"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(243,198,95,0.08),transparent_70%)]"
            />

            <AppNavbar
                activeTab="play" onOpenModule={onOpenModule}
                onSelectPlayTab={() => setSelectedMode('ai')}
                onOpenSettings={() => { setSelectedMode('ai'); setShowOptions(true); }}
                onUserResolved={handleUserResolved}
            />

            <div className="relative z-10 mx-auto flex flex-1 w-full max-w-4xl flex-col items-center justify-start gap-3 px-4 py-4 sm:px-6 sm:py-5">
                {/* En-tête épuré et moderne */}
                <header className="flex w-full flex-col sm:flex-row items-center justify-between gap-1 border-b border-white/[0.07] pb-2.5">
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                            BACKGAMMON
                        </h1>
                        <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-slate-300">
                            {ui.lobby.subtitle}
                        </span>
                    </div>
                    <span data-testid="lobby-auth-status" className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>{displayName ? `${ui.lobby.activeMemberPrefix} · ${displayName}` : ui.lobby.privateSalonSession}</span>
                    </span>
                </header>

                {/* Sélecteur des 3 modes principaux (Style Pro Glassmorphism) */}
                <section aria-label="Modes de jeu" className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {mainCards.map((card) => {
                        const active = selectedMode === card.id;
                        return (
                            <button
                                key={card.id} type="button" data-testid={`lobby-card-${card.id}`} aria-pressed={active} onClick={() => setSelectedMode(card.id)}
                                className={`group relative flex flex-col items-start justify-between gap-1 rounded-2xl border p-3.5 text-left transition-all duration-150 ${active ? 'border-[#f3c65f] bg-slate-900/90 shadow-[0_0_0_1px_rgba(243,198,95,0.25),0_8px_24px_rgba(0,0,0,0.45)]' : 'border-white/10 bg-slate-900/40 hover:border-white/20 hover:bg-slate-900/65'}`}
                            >
                                <div className="flex w-full items-center justify-between">
                                    <span className="text-base font-bold text-white">{card.title}</span>
                                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${active ? 'bg-[#f3c65f]/15 text-[#f3c65f]' : 'bg-white/5 text-slate-400'}`}>{card.badge}</span>
                                </div>
                                <span className="text-xs text-slate-400 line-clamp-1">{card.subtitle}</span>
                            </button>
                        );
                    })}
                </section>

                {/* Cockpit de lancement 1-Tap : Choix direct Match (Crawford) vs Money Game (Jacoby) + Outils + Jouer */}
                <div className="flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-slate-900/65 p-2.5">
                    {selectedMode === 'ai' && (
                        <div data-testid="lobby-direct-format-bar" className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <div className="inline-flex rounded-xl border border-white/10 bg-black/40 p-0.5">
                                    <button type="button" data-testid="lobby-pill-match-mode" aria-pressed={matchLength > 0} onClick={() => setMatchLength((prev) => (prev === 0 ? 7 : prev))} className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${matchLength > 0 ? 'bg-[#f3c65f] text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'}`}>🏆 Match</button>
                                    <button type="button" data-testid="lobby-pill-money-mode" aria-pressed={matchLength === 0} onClick={() => setMatchLength(0)} className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${matchLength === 0 ? 'bg-[#f3c65f] text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'}`}>💰 Money Game</button>
                                </div>
                                {matchLength > 0 ? (
                                    <div className="inline-flex items-center gap-1" role="group" aria-label="Points du match">
                                        {[3, 5, 7, 11].map((pts) => (
                                            <button key={pts} type="button" data-testid={`lobby-quick-pts-${pts}`} aria-pressed={matchLength === pts} onClick={() => setMatchLength(pts)} className={`rounded-lg border px-2 py-1 font-mono text-xs font-bold transition ${matchLength === pts ? 'border-[#f3c65f]/70 bg-[#f3c65f]/15 text-[#f3c65f]' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'}`}>{pts} pts</button>
                                        ))}
                                        <span className="hidden md:inline-block pl-1 text-[11px] text-slate-400">· Règle de Crawford</span>
                                    </div>
                                ) : (
                                    <span data-testid="lobby-money-rule-badge" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">Partie continue au point (∞) · Règle de Jacoby active</span>
                                )}
                            </div>
                            <button type="button" onClick={() => setShowOptions((v) => !v)} aria-expanded={showOptions} data-testid="lobby-options-toggle" className={`flex items-center gap-2 rounded-xl border px-2.5 py-1 text-xs font-medium text-slate-200 transition ${showOptions ? 'border-[#f3c65f] bg-slate-800' : 'border-white/10 bg-black/30 hover:border-white/20'}`}>
                                <span className="font-mono text-xs text-slate-200">IA {opponents.find((o) => o.value === difficulty)?.label ?? difficulty} · {clockPreset.toUpperCase()} · {playerColor === 'X' ? ui.lobby.ivory : ui.lobby.ebony}</span>
                                <span className="text-xs font-bold text-[#f3c65f]">{showOptions ? ui.lobby.collapse : `⚙️ ${ui.lobby.configure}`}</span>
                            </button>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-1.5" data-testid="lobby-tournament-quickbar">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <button type="button" data-testid="lobby-quick-scanner-btn" onClick={() => onOpenModule?.('import_export')} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] hover:text-white transition touch-manipulation">📷 Scanner / Position</button>
                            <button type="button" data-testid="lobby-quick-clock-btn" onClick={() => setIsTableClockOpen(true)} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] hover:text-white transition touch-manipulation">⏱️ Pendule WBF</button>
                        </div>
                        <button type="button" data-testid="lobby-start-btn" onClick={handlePlay} className="flex-1 sm:flex-initial rounded-xl border border-[#f3c65f] bg-[#f3c65f] px-5 py-2 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 shadow-md transition hover:bg-[#f7d37c] active:scale-[0.99]">
                            {selectedMode === 'multiplayer' ? ui.lobby.cardMultiTitle : selectedMode === 'training' ? ui.lobby.cardTrainingTitle : `${ui.lobby.playNow} · ${matchLength === 0 ? 'MONEY GAME' : `MATCH ${matchLength} PTS`}`}
                        </button>
                    </div>
                </div>

                {selectedMode === 'ai' && showOptions && (
                    <section className="w-full">
                        <LobbyOptionsPanel
                            matchLength={matchLength} setMatchLength={setMatchLength} difficulty={difficulty} setDifficulty={setDifficulty}
                            coachEnabled={coachEnabled} setCoachEnabled={setCoachEnabled}
                            playerColor={playerColor} onSelectPlayerColor={(c) => { setPlayerColor(c); storePlayerColor(c); }}
                            matchFormats={matchFormats} opponents={opponents} clockPreset={clockPreset} setClockPreset={setClockPreset}
                            onClose={() => setShowOptions(false)}
                        />
                    </section>
                )}

                {selectedMode === 'training' && (
                    <section data-testid="lobby-training-submenu" className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <button type="button" data-testid="lobby-training-puzzles-btn" onClick={() => onOpenModule?.('puzzles')} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 p-3.5 text-left transition hover:border-white/20">
                            <div><div className="text-sm font-bold text-white">{ui.lobby.dailyPuzzlesTitle}</div><div className="text-xs text-slate-400">{ui.lobby.dailyPuzzlesDesc}</div></div>
                            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#f3c65f]">{ui.lobby.openBtn}</span>
                        </button>
                        <button type="button" data-testid="lobby-training-drills-btn" onClick={() => onOpenModule?.('drills')} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 p-3.5 text-left transition hover:border-white/20">
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
                    <button type="button" onClick={() => void handleInstallClick()} data-testid="lobby-pwa-install-btn" aria-label={ui.pwa.installAppAria} className="flex sm:hidden items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200">
                        <span>{ui.pwa.installApp}</span>
                        <span className="rounded bg-[#f3c65f]/15 px-1.5 py-0.5 text-[11px] font-mono font-bold text-[#f3c65f]">PWA</span>
                    </button>
                )}

                <section aria-label="Espace joueur et progression" data-testid="lobby-secondary-section" className="flex w-full flex-col gap-2.5 pt-1 pb-6">
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
