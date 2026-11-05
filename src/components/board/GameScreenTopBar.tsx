'use client';

import React from 'react';
import MatchHeader from '../hud/MatchHeader';
import { InstantFriendInviteButton } from '../play/InstantFriendInviteButton';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';
import { NavbarPointsAndBadges } from '../nav/NavbarPointsAndBadges';
import type { ThemeName } from './boardThemes';
import type { UseBackgammonGameReturn } from '../../hooks/useBackgammonGame';
import type { useMultiplayerGame } from '../../hooks/useMultiplayerGame';
import type { useGameModals } from '../../hooks/useGameModals';
import type { CoachSidebarProps } from '../coach/CoachSidebar';
import type { LastMoveFeedback } from '../../hooks/useCoachHelpers';
import type { CoachNotificationLevel } from '../../features/coach/coachNotificationSettings';

export interface GameScreenTopBarProps {
    readonly isFullFocusMode: boolean;
    readonly onToggleFullFocusMode: () => void;
    readonly t: (key: string) => string;
    readonly theme: ThemeName;
    readonly onToggleTheme: () => void;
    readonly game: UseBackgammonGameReturn;
    readonly isMultiplayerActive: boolean;
    readonly multiplayer: ReturnType<typeof useMultiplayerGame>;
    readonly modals: ReturnType<typeof useGameModals>;
    readonly onTriggerCoach: () => void;
    readonly turnsCount: number;
    readonly prX: number | null;
    readonly prO: number | null;
    readonly onBackToLobby: () => void;
    readonly playerColor?: 'X' | 'O';
    readonly lastMoveFeedback?: LastMoveFeedback | null;
    readonly notificationLevel?: CoachNotificationLevel;
    readonly onChangeNotificationLevel?: (level: CoachNotificationLevel) => void;
    readonly quotaBadge: string;
    readonly isVip: boolean;
}

export const GameScreenTopBar: React.FC<GameScreenTopBarProps> = ({
    isFullFocusMode,
    onToggleFullFocusMode,
    t,
    theme,
    onToggleTheme,
    game,
    isMultiplayerActive,
    multiplayer,
    modals,
    onTriggerCoach,
    turnsCount,
    prX,
    prO,
    onBackToLobby,
    playerColor,
    lastMoveFeedback,
    notificationLevel,
    onChangeNotificationLevel,
    quotaBadge,
    isVip,
}) => {
    const { tierGate } = usePlayerTierGate();

    return (
        <>
            {/* Barre Raccourci Mode Échiquier Pur & Invitation 1-Clic */}
            <div className="w-full flex items-center justify-between px-2 py-0.5 z-30 shrink-0 gap-2">
                <div className="flex items-center gap-2">
                    <span
                        data-testid="app-version-badge"
                        className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${
                            tierGate === 'BEGINNER'
                                ? 'border-[#D4AF37]/45 bg-[#D4AF37]/15 text-[#f3d27a]'
                                : 'border-[#10B981]/35 bg-gradient-to-r from-[#0F2922]/90 via-[#0B0E14] to-[#D4AF37]/15 text-[#34D399]'
                        }`}
                    >
                        {tierGate === 'BEGINNER' ? '🎓 Mode Débutant • Partie Guidée' : 'v3.1 • 3-Ply • Open Sage'}
                    </span>
                    <NavbarPointsAndBadges tierGate={tierGate} />
                    <button
                        type="button"
                        data-testid="full-focus-board-btn"
                        onClick={onToggleFullFocusMode}
                        className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs sm:text-sm font-bold transition ${
                            isFullFocusMode
                                ? 'bg-[#D4AF37] text-slate-950 border-[#F3E5AB] font-black shadow-md'
                                : 'bg-black/60 text-stone-300 border-white/10 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <span>{isFullFocusMode ? '🖥️ Quitter Plein Écran (Touche F)' : '🖥️ Mode Échiquier Pur (Full Focus · Touche F)'}</span>
                    </button>
                </div>
                <InstantFriendInviteButton
                    matchLength={game.state.matchLength}
                />
            </div>

            {/* 1. HUD Compact Mobile */}
            <div className="md:hidden [@media(max-height:540px)]:!hidden shrink-0 w-full max-w-full min-w-0 overflow-hidden">
                <MatchHeader
                    t={t}
                    theme={theme}
                    onToggleTheme={onToggleTheme}
                    game={game}
                    isMultiplayerActive={isMultiplayerActive}
                    multiplayer={multiplayer}
                    onOpenExportImport={modals.openExportImport}
                    onTriggerCoach={() => {
                        onTriggerCoach();
                        modals.openMobileDrawer();
                    }}
                    turnsCount={turnsCount}
                    prX={prX}
                    prO={prO}
                    onBackToLobby={onBackToLobby}
                    playerColor={playerColor}
                    onOpenDiceAudit={modals.openDiceAudit}
                    lastMoveFeedback={lastMoveFeedback}
                    notificationLevel={notificationLevel}
                    onChangeNotificationLevel={onChangeNotificationLevel}
                    coachQuotaBadge={quotaBadge}
                    isVip={isVip}
                />
            </div>
        </>
    );
};

