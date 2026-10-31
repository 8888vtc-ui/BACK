/**
 * Types & Contrats du module Multijoueur Temps Réel & Matchmaking Elo.
 */

import type { Player, Move } from '../../engine/backgammonEngine';

export type ClubChallengerDifficulty = 'beginner' | 'intermediate' | 'expert';

export interface PlayerEloProfile {
    id: string;
    username: string;
    displayName: string;
    rating: number;
    avatarUrl?: string | null;
    isGuest?: boolean;
    countryFlag?: string;
    countryName?: string;
    clubBotDifficulty?: ClubChallengerDifficulty;
}

export type MultiplayerRole = Player; // 'X' | 'O'

export type MatchmakingState =
    | 'idle'
    | 'searching'
    | 'matched'
    | 'connecting'
    | 'connected'
    | 'opponent_disconnected'
    | 'game_over'
    | 'error';

export interface MultiplayerMatchInfo {
    roomId: string;
    playerX: PlayerEloProfile;
    playerO: PlayerEloProfile;
    matchLength: number;
    startedAt: string;
    localRole: MultiplayerRole;
    isClubChallenger?: boolean;
}

export interface EloCalculationResult {
    playerXNewRating: number;
    playerONewRating: number;
    deltaX: number;
    deltaO: number;
    expectedScoreX: number;
    expectedScoreO: number;
}

export interface MatchmakingQueueTicket {
    id: string;
    userId: string;
    username: string;
    displayName: string;
    rating: number;
    matchLength: number;
    joinedAt: number;
    searchTolerance: number; // fenêtre d'Elo tolérée qui grandit avec le temps
}

export type RealtimeBroadcastAction =
    | {
          type: 'DICE_ROLLED';
          player: Player;
          dice: [number, number];
          timestamp: number;
      }
    | {
          type: 'CHECKER_MOVED';
          player: Player;
          move: Move;
          board: number[];
          usedDice: [boolean, boolean] | boolean[];
          timestamp: number;
      }
    | {
          type: 'TURN_FINISHED';
          player: Player;
          nextTurn: Player;
          timestamp: number;
      }
    | {
          type: 'DOUBLE_OFFERED';
          player: Player;
          cubeValue: number;
          timestamp: number;
      }
    | {
          type: 'DOUBLE_ACCEPTED';
          player: Player;
          cubeValue: number;
          timestamp: number;
      }
    | {
          type: 'DOUBLE_PASSED';
          player: Player;
          winner: Player;
          timestamp: number;
      }
    | {
          type: 'RESIGNED';
          player: Player;
          reason?: 'surrender' | 'timeout' | 'disconnect';
          timestamp: number;
      }
    | {
          type: 'SYNC_STATE';
          player: Player;
          board: number[];
          turn: Player;
          dice: [number, number] | null;
          usedDice: [boolean, boolean] | boolean[];
          cubeValue: number;
          cubeOwner: Player | null;
          scoreX: number;
          scoreO: number;
          timestamp: number;
      }
    | {
          type: 'QUICK_CHAT';
          player: Player;
          messageId: 'gg' | 'nice_move' | 'unlucky' | 'thinking' | 'thanks';
          timestamp: number;
      }
    | {
          type: 'HEARTBEAT';
          player: Player;
          timestamp: number;
      }
    | {
          type: 'CLOCK_SYNC';
          player: Player;
          bankXMs: number;
          bankOMs: number;
          delayRemainingMs: number;
          activePlayer: Player;
          turnStartedAt: number;
          isFlagFallen?: boolean;
          timestamp: number;
      };

export interface PresenceUserInfo {
    userId: string;
    username: string;
    role: MultiplayerRole;
    lastPing: number;
}
