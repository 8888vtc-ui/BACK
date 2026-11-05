'use client';

import React from 'react';
import MatchHeader from '../hud/MatchHeader';
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
    return (
        <>
            {/* Barre Raccourci Mode Échiquier Pur (Full Focus) */}
            <div className="w-full flex items-center justify-between px-2 py-0.5 z-30 shrink-0">
                <button
                    type="button"
                    data-testid="full-focus-board-btn"
                    onClick={onToggleFullFocusMode}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs sm:text-sm font-bold transition ${
                        isFullFocusMode
                            ? 'bg-[#D4AF37] text-slate-950 border-[#F3E5AB] font-black shadow-md'
                            : 'bg-black/60 text-stone-300 border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <span>{isFullFocusMode ? '🖥️ Quitter Plein Écran (Touche F)' : '🖥️ Mode Échiquier Pur (Full Focus · Touche F)'}</span>
                </button>
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

