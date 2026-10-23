'use client';

/**
 * Écran d'accueil — SALON PRIVÉ DE PRESTIGE (Direction Artistique Monte-Carlo / XG).
 * Loi 5 de Scalabilité : strictement 0 any, < 300 lignes.
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
import {
    getSyncAcademySnapshot,
    loadPlayerHubData,
    type AcademyProgressSnapshot,
    type RecentMatchEntry,
} from '../../features/progression/userProgressionService';
import { useTranslation } from '../../i18n';
import usePwaInstall from '../../hooks/usePwaInstall';
import IosInstallModal from '../pwa/IosInstallModal';

export type LobbyModuleId = 'multiplayer' | 'openings' | 'stats' | 'drills' | 'puzzles';
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
    const { canInstall, isInstalled, showIosModal, setShowIosModal, handleInstallClick } = usePwaInstall();
    const [matchLength, setMatchLength] = useState<number>(initialMatchLength);
    const [difficulty, setDifficulty] = useState<AIDifficulty>(initialDifficulty);
    const [coachEnabled, setCoachEnabled] = useState<boolean>(initialCoachEnabled);
    const [clockPreset, setClockPreset] = useState<LobbyClockPreset>(initialClockPreset);
    const [playerColor, setPlayerColor] = useState<Player>('X');
    const [selectedMode, setSelectedMode] = useState<LobbyMode | null>('ai');
    const [showOptions, setShowOptions] = useState(false);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [snapshot, setSnapshot] = useState<AcademyProgressSnapshot>(() => getSyncAcademySnapshot());
    const [recentMatches, setRecentMatches] = useState<RecentMatchEntry[]>([]);

    const matchFormats = useMemo(
        () => [
            { value: 0, label: ui.lobby.moneyGame, hint: ui.lobby.formatMoneyHint },
            { value: 3, label: '3 pts', hint: ui.lobby.formatShortHint },
            { value: 5, label: '5 pts', hint: ui.lobby.formatFastHint },
            { value: 7, label: '7 pts', hint: ui.lobby.formatStandardHint },
            { value: 11, label: '11 pts', hint: ui.lobby.formatLongHint },
        ],
        [ui.lobby],
    );

    const opponents = useMemo<Array<{ value: AIDifficulty; label: string; hint: string }>>(
        () => [
            { value: 'beginner', label: ui.lobby.opponentNovice, hint: '1-ply + bruit' },
            { value: 'intermediate', label: ui.lobby.opponentIntermediate, hint: 'Open Sage 1-ply' },
            { value: 'expert', label: ui.lobby.opponentMaster, hint: 'Open Sage 2-ply' },
            { value: 'grandmaster', label: ui.lobby.opponentGrandmaster, hint: 'Open Sage 3-ply' },
        ],
        [ui.lobby],
    );

    const mainCards = useMemo<ReadonlyArray<{ id: LobbyMode; icon: string; badge: string; title: string; subtitle: string }>>(
        () => [
            { id: 'ai', icon: '🎲', badge: ui.lobby.cardAiBadge, title: ui.lobby.cardAiTitle, subtitle: ui.lobby.cardAiSubtitle },
            { id: 'multiplayer', icon: '🌐', badge: ui.lobby.cardMultiBadge, title: ui.lobby.cardMultiTitle, subtitle: ui.lobby.cardMultiSubtitle },
            { id: 'training', icon: '🎯', badge: ui.lobby.cardTrainingBadge, title: ui.lobby.cardTrainingTitle, subtitle: ui.lobby.cardTrainingSubtitle },
        ],
        [ui.lobby],
    );

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
            dir={dir}
            className="min-h-dvh w-full overflow-y-auto text-slate-100 selection:bg-amber-600/40 flex flex-col relative"
            style={{
                background: 'radial-gradient(ellipse 85% 50% at 50% -8%, rgba(212, 175, 55, 0.16) 0%, rgba(20, 28, 46, 0.92) 42%, #090d16 78%, #04060b 100%)',
            }}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 opacity-25"
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 22%, rgba(243, 198, 95, 0.09) 0%, transparent 60%), repeating-linear-gradient(90deg, rgba(212, 175, 55, 0.025) 0px, rgba(212, 175, 55, 0.025) 1px, transparent 1px, transparent 64px)',
                }}
            />

            <AppNavbar
                activeTab="play"
                onOpenModule={onOpenModule}
                onSelectPlayTab={() => setSelectedMode('ai')}
                onOpenSettings={() => { setSelectedMode('ai'); setShowOptions(true); }}
                onUserResolved={handleUserResolved}
            />

            <div className="relative z-10 mx-auto flex flex-1 w-full max-w-4xl flex-col items-center justify-center gap-5 px-4 py-6 sm:px-6">
                <header className="flex w-full flex-col items-center gap-2 text-center">
                    <div
                        data-testid="lobby-auth-status"
                        className="flex items-center gap-2 rounded-full border border-[#d4af37]/35 bg-[#0b101b]/90 px-3.5 py-1 text-[10px] font-bold tracking-wider text-amber-100/90 shadow-[0_4px_14px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,245,205,0.2)]"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                        <span>{displayName ? `${ui.lobby.activeMemberPrefix} · ${displayName}` : ui.lobby.privateSalonSession}</span>
                    </div>

                    <h1
                        className="font-serif bg-gradient-to-b from-[#fff9e6] via-[#f0cb69] to-[#9c6f16] bg-clip-text text-4xl font-black tracking-[0.14em] text-transparent sm:text-6xl"
                        style={{ filter: 'drop-shadow(0 2px 0 rgba(62, 39, 4, 0.95)) drop-shadow(0 10px 28px rgba(212, 175, 55, 0.28))' }}
                    >
                        BACKGAMMON
                    </h1>

                    <div className="flex items-center gap-3">
                        <span aria-hidden="true" className="h-[1px] w-10 sm:w-16 bg-gradient-to-r from-transparent to-[#d4af37]/70" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.36em] text-[#e5c158] drop-shadow">{ui.lobby.subtitle}</p>
                        <span aria-hidden="true" className="h-[1px] w-10 sm:w-16 bg-gradient-to-l from-transparent to-[#d4af37]/70" />
                    </div>
                </header>

                <PlayerProfileCard
                    displayName={displayName}
                    eloRating={snapshot.eloRating}
                    averagePR={snapshot.averagePR}
                    gamesPlayed={snapshot.gamesPlayed}
                    winsCount={snapshot.winsCount}
                    puzzleStreak={snapshot.puzzleStreak}
                    onOpenReview={() => onOpenModule?.('stats')}
                />

                <CoachPreMatchBriefingCard onOpenDrills={() => onOpenModule?.('drills')} />

                <section aria-label="Modes de jeu" className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-3">
                    {mainCards.map((card) => {
                        const active = selectedMode === card.id;
                        return (
                            <button
                                key={card.id}
                                type="button"
                                data-testid={`lobby-card-${card.id}`}
                                aria-pressed={active}
                                onClick={() => {
                                    setSelectedMode(card.id);
                                    if (card.id === 'ai') setShowOptions(true);
                                }}
                                className={`group relative flex h-32 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border px-4 text-center transition-all duration-200 hover:-translate-y-0.5 ${
                                    active
                                        ? 'border-[#f3c65f]/80 bg-gradient-to-b from-[#261d0f]/95 via-[#16120b]/95 to-[#0c0a07]/95 ring-1 ring-[#f3c65f]/45 shadow-[0_14px_34px_rgba(0,0,0,0.75),0_0_28px_rgba(212,175,55,0.22),inset_0_1px_0_rgba(255,245,205,0.35)]'
                                        : 'border-[#d4af37]/25 bg-gradient-to-b from-[#131926]/90 to-[#0a0e17]/95 hover:border-[#e5c158]/60 hover:shadow-[0_12px_28px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,245,205,0.22)]'
                                }`}
                            >
                                <span className="rounded-full border border-[#d4af37]/35 bg-black/40 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.2em] text-[#e5c158]">
                                    {card.badge}
                                </span>
                                <span
                                    aria-hidden="true"
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4af37]/45 bg-gradient-to-b from-[#231b0e] to-[#0f0b06] text-2xl leading-none shadow-inner transition-transform duration-200 group-hover:scale-110"
                                >
                                    <span className="[filter:sepia(0.9)_saturate(2.5)_hue-rotate(5deg)]">{card.icon}</span>
                                </span>
                                <span className="font-serif text-sm font-bold tracking-wide text-[#fdf8eb]">{card.title}</span>
                                <span className="text-[10px] font-medium text-slate-400">{card.subtitle}</span>
                            </button>
                        );
                    })}
                </section>

                {selectedMode === 'ai' && (
                    <section className="w-full">
                        <button
                            type="button"
                            onClick={() => setShowOptions((v) => !v)}
                            aria-expanded={showOptions}
                            data-testid="lobby-options-toggle"
                            className="mx-auto flex flex-wrap items-center justify-center gap-2.5 rounded-full border border-[#d4af37]/45 bg-[#0e1422]/95 px-4 py-1.5 text-[11px] font-bold tracking-wide text-amber-100 shadow-[0_6px_18px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,245,205,0.2)] transition hover:border-[#f3c65f] hover:bg-[#161f33]"
                        >
                            <span aria-hidden="true" className="[filter:sepia(0.9)_saturate(2.5)_hue-rotate(5deg)]">⚙️</span>
                            <span className="font-serif tracking-wider text-[#fdf8eb]">{ui.lobby.tableAndClock}</span>
                            <span className="rounded-full border border-[#d4af37]/35 bg-black/50 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#f3c65f]">
                                {matchLength === 0 ? ui.lobby.moneyGame : `${matchLength} pts`} · {opponents.find((o) => o.value === difficulty)?.label ?? difficulty} · {clockPreset.toUpperCase()} · {playerColor === 'X' ? ui.lobby.ivory : ui.lobby.ebony}
                            </span>
                            <span aria-hidden="true" className="text-[10px] text-[#f3c65f]">{showOptions ? ui.lobby.collapse : ui.lobby.configure}</span>
                        </button>
                        {showOptions && (
                            <LobbyOptionsPanel
                                matchLength={matchLength} setMatchLength={setMatchLength}
                                difficulty={difficulty} setDifficulty={setDifficulty}
                                coachEnabled={coachEnabled} setCoachEnabled={setCoachEnabled}
                                playerColor={playerColor}
                                onSelectPlayerColor={(c) => { setPlayerColor(c); storePlayerColor(c); }}
                                matchFormats={matchFormats} opponents={opponents}
                                clockPreset={clockPreset} setClockPreset={setClockPreset}
                                onClose={() => setShowOptions(false)}
                            />
                        )}
                    </section>
                )}

                {selectedMode === 'training' && (
                    <section data-testid="lobby-training-submenu" className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            data-testid="lobby-training-puzzles-btn"
                            onClick={() => onOpenModule?.('puzzles')}
                            className="flex items-center justify-between rounded-2xl border border-[#d4af37]/45 bg-gradient-to-b from-[#1a2234]/95 to-[#0d121d]/95 p-4 text-left shadow-lg transition hover:border-[#f3c65f]"
                        >
                            <div>
                                <div className="font-serif text-sm font-bold text-[#fdf8eb]">{ui.lobby.dailyPuzzlesTitle}</div>
                                <div className="text-[11px] text-slate-400">{ui.lobby.dailyPuzzlesDesc}</div>
                            </div>
                            <span className="rounded-full border border-[#d4af37]/40 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase text-[#f3c65f]">{ui.lobby.openBtn}</span>
                        </button>
                        <button
                            type="button"
                            data-testid="lobby-training-drills-btn"
                            onClick={() => onOpenModule?.('drills')}
                            className="flex items-center justify-between rounded-2xl border border-[#d4af37]/45 bg-gradient-to-b from-[#23190f]/95 to-[#120d08]/95 p-4 text-left shadow-lg transition hover:border-[#f3c65f]"
                        >
                            <div>
                                <div className="font-serif text-sm font-bold text-[#fdf8eb]">{ui.lobby.blunderDrillsTitle}</div>
                                <div className="text-[11px] text-slate-400">{ui.lobby.blunderDrillsDesc}</div>
                            </div>
                            <span className="rounded-full border border-[#d4af37]/40 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase text-[#f3c65f]">{ui.lobby.openBtn}</span>
                        </button>
                    </section>
                )}

                {selectedMode === 'multiplayer' && (
                    <section className="w-full">
                        <OpenMatchesTable onJoinChallenge={handleJoinOpenChallenge} onCreateChallenge={() => onOpenModule?.('multiplayer')} />
                    </section>
                )}

                <button
                    type="button"
                    data-testid="lobby-start-btn"
                    onClick={handlePlay}
                    className="group relative w-full max-w-md overflow-hidden rounded-2xl border border-[#fef08a]/80 px-7 py-4 text-base font-black uppercase tracking-[0.24em] text-[#1c1004] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                        background: 'linear-gradient(180deg, #fff6d1 0%, #f5cf70 28%, #d99f26 74%, #9e6b0b 100%)',
                        boxShadow: '0 14px 42px rgba(217, 119, 6, 0.48), 0 4px 14px rgba(0, 0, 0, 0.8), inset 0 2px 2px rgba(255, 255, 255, 0.85), inset 0 -3px 6px rgba(92, 52, 6, 0.7)',
                    }}
                >
                    <span className="relative z-10 flex items-center justify-center gap-3 drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]">
                        <span>✦</span>
                        <span>{ui.lobby.playNow}</span>
                        <span>✦</span>
                    </span>
                </button>

                {!isInstalled && canInstall && (
                    <button
                        type="button"
                        onClick={() => void handleInstallClick()}
                        data-testid="lobby-pwa-install-btn"
                        aria-label={ui.pwa.installAppAria}
                        className="group flex items-center gap-2 rounded-full border border-[#d4af37]/45 bg-[#0e1422]/90 px-4 py-1.5 text-xs font-bold text-amber-200 shadow-[0_4px_14px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,245,205,0.2)] transition hover:border-[#f3c65f] hover:bg-[#161f33] hover:text-[#fff4d0] active:scale-95"
                    >
                        <span>{ui.pwa.installApp}</span>
                        <span className="rounded-full bg-[#f3c65f]/15 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#f3c65f]">PWA</span>
                    </button>
                )}

                <RecentMatchesSummary matches={recentMatches} onReviewMatch={() => onOpenModule?.('stats')} />
                <LearningModulesGrid snapshot={snapshot} onOpenModule={onOpenModule} />
            </div>
            <IosInstallModal isOpen={showIosModal} onClose={() => setShowIosModal(false)} />
        </main>
    );
};

export const LobbyScreen = React.memo(LobbyScreenComponent);
export default LobbyScreen;
