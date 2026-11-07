'use client';

import React from 'react';
import MatchHeader from '../hud/MatchHeader';
import { InstantFriendInviteButton } from '../play/InstantFriendInviteButton';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';
import { useTranslation } from '../../i18n';
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
    readonly isOnlinePvpMatch?: boolean;
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
    isOnlinePvpMatch = false,
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
    const { locale } = useTranslation();
    const isEn = locale === 'en';

    return (
        <>
            {/* Barre Raccourci Mode Échiquier Pur & Invitation 1-Clic */}
            <div className="w-full flex items-center justify-between px-2 py-0.5 z-30 shrink-0 gap-2 whitespace-nowrap overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                    {tierGate === 'BEGINNER' && (
                        <span
                            data-testid="app-version-badge"
                            className="shrink-0 whitespace-nowrap rounded-full border border-[#D4AF37]/45 bg-[#D4AF37]/15 px-2.5 py-0.5 font-mono text-xs font-semibold tracking-tight text-[#f3d27a] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        >
                            {isOnlinePvpMatch
                                ? (isEn ? 'Monte-Carlo Circle' : 'Cercle Monte-Carlo')
                                : (isEn ? 'Guidance • Guided Play' : 'Accompagnement • Partie Guidée')}
                        </span>
                    )}
                    <div className="shrink-0 whitespace-nowrap">
                        <NavbarPointsAndBadges tierGate={tierGate} />
                    </div>
                    <button
                        type="button"
                        data-testid="full-focus-board-btn"
                        onClick={onToggleFullFocusMode}
                        className={`hidden sm:inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 px-3 py-1 rounded-lg border text-xs sm:text-sm font-bold transition ${
                            isFullFocusMode
                                ? 'bg-[#D4AF37] text-slate-950 border-[#F3E5AB] font-black shadow-md'
                                : 'bg-black/60 text-stone-300 border-white/10 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <span className="shrink-0 whitespace-nowrap">{isFullFocusMode ? (isEn ? 'Exit Pure Board' : 'Quitter Mode Échiquier') : (isEn ? 'Pure Board Mode' : 'Mode Échiquier Pur')}</span>
                    </button>
                </div>
                <div className="shrink-0 whitespace-nowrap">
                    <InstantFriendInviteButton
                        matchLength={game.state.matchLength}
                        onCreateRoom={(len) => multiplayer.createPrivateRoom(len)}
                        onCancelInvite={multiplayer.cancelMatchmaking}
                        isWaitingOpponent={Boolean(multiplayer.privateRoomCode && multiplayer.status === 'searching')}
                        className="shrink-0 whitespace-nowrap"
                    />
                </div>
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

