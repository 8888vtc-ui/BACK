/**
 * @file src/hooks/useMultiplayerGameTypes.ts
 * @description Types et signatures d'exportation pour le hook useMultiplayerGame (< 200 lignes, 0 any).
 */
import type { Player, Move } from '../engine/backgammonEngine';
import type {
    PlayerEloProfile,
    MultiplayerMatchInfo,
    MatchmakingState,
    EloCalculationResult,
    RealtimeBroadcastAction,
} from '../features/multiplayer/types';
import type { MatchClockState } from '../features/multiplayer/clockManager';
import type { ActiveGameSession } from '../features/multiplayer/sessionRecovery';

export interface UseMultiplayerGameReturn {
    status: MatchmakingState;
    matchInfo: MultiplayerMatchInfo | null;
    localProfile: PlayerEloProfile;
    opponentProfile: PlayerEloProfile | null;
    turnTimeRemaining: number;
    disconnectCountdown: number | null;
    eloResult: EloCalculationResult | null;
    quickChatMessage: { player: Player; messageId: string } | null;
    isMyTurn: boolean;
    privateRoomCode: string | null;
    clockState: MatchClockState | null;
    isReconnecting: boolean;
    recoverableSession: ActiveGameSession | null;
    startMatchmaking: (preferredMatchLength?: number) => Promise<void>;
    createPrivateRoom: (matchLength?: number) => Promise<string>;
    joinPrivateRoom: (code: string) => Promise<void>;
    cancelMatchmaking: () => void;
    reconnectActiveSession: () => Promise<void>;
    dismissRecoverableSession: () => void;
    broadcastDiceRolled: (dice: [number, number]) => void;
    broadcastMovePlayed: (move: Move, newBoard: number[], usedDice: [boolean, boolean] | boolean[]) => void;
    broadcastTurnFinished: (nextTurn: Player) => void;
    broadcastDoubleOffered: (cubeValue: number) => void;
    broadcastDoubleAccepted: (cubeValue: number) => void;
    broadcastDoublePassed: (winner: Player) => void;
    broadcastResign: (reason?: 'surrender' | 'timeout' | 'disconnect') => void;
    sendQuickChat: (messageId: 'gg' | 'nice_move' | 'unlucky' | 'thinking' | 'thanks') => void;
    handleMatchOver: (winner: Player, winType: string, pointsWon: number) => void;
    leaveMatch: () => void;
    onRemoteAction?: (action: RealtimeBroadcastAction) => void;
}
