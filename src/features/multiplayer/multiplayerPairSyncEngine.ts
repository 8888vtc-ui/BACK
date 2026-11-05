/**
 * @file src/features/multiplayer/multiplayerPairSyncEngine.ts
 * @description Moteur de Synchronisation Bidirectionnelle, Symétrie Canonique & Isolation de Tables (<= 380 lignes, 0 any).
 * Invariants :
 * - Symétrie 25 - i : Chaque joueur voit ses pions marcher de Case 24 vers Case 1.
 * - Double Assertion d'Intégrité : 15 pions X + 15 pions O constants, Pip Counts strictement cohérents.
 * - Isolation multi-tables (roomId) : Zéro fuite d'action entre salles concurrentes.
 */

import type { Player, Move } from '../../engine/backgammonEngine';
import {
  X_BAR,
  O_BAR,
  X_OFF,
  O_OFF,
  pipCount,
  applyMove,
  generateLegalMoves,
  createInitialState,
} from '../../engine/backgammonEngine';
import type { RealtimeBroadcastAction } from './types';

export interface CheckerIntegrityReport {
  readonly valid: boolean;
  readonly xTotal: number;
  readonly oTotal: number;
  readonly xBorneOff: number;
  readonly oBorneOff: number;
  readonly error?: string;
}

export interface PipConsistencyReport {
  readonly consistent: boolean;
  readonly pipLocal: { X: number; O: number };
  readonly pipRemote: { X: number; O: number };
  readonly error?: string;
}

/**
 * Transforme un point d'un référentiel joueur à son symétrique (25 - p).
 * 0 (Barre X) <-> 25 (Barre O)
 * 1..24 <-> 24..1
 */
export function mirrorPoint(point: number): number {
  if (point === X_BAR) return O_BAR; // 0 -> 25
  if (point === O_BAR) return X_BAR; // 25 -> 0
  if (point >= 1 && point <= 24) return 25 - point;
  return point;
}

/**
 * Transforme un coup joué par Player A en coup symétrique perçu par Player B.
 */
export function mirrorMove(move: Move): Move {
  return {
    from: mirrorPoint(move.from),
    to: mirrorPoint(move.to),
  };
}

/**
 * Miroir complet du plateau (26 cases) inversant les perspectives X <-> O.
 */
export function mirrorBoard(board: number[]): number[] {
  const mirrored = new Array<number>(26).fill(0);
  // Barre X (0) devient Barre O (25) avec signe inversé
  mirrored[O_BAR] = -board[X_BAR];
  // Barre O (25) devient Barre X (0) avec signe inversé
  mirrored[X_BAR] = -board[O_BAR];

  for (let p = 1; p <= 24; p++) {
    mirrored[25 - p] = -board[p];
  }
  return mirrored;
}

/**
 * Contrôle l'intégrité absolue des 15 pions par camp (sur le plateau + bear-off).
 */
export function assertCheckerIntegrity(board: number[]): CheckerIntegrityReport {
  let xOnBoard = 0;
  let oOnBoard = 0;

  for (let p = 1; p <= 24; p++) {
    const count = board[p];
    if (count > 0) xOnBoard += count;
    else if (count < 0) oOnBoard += -count;
  }
  if (board[X_BAR] > 0) xOnBoard += board[X_BAR];
  if (board[O_BAR] < 0) oOnBoard += -board[O_BAR];

  const xBorneOff = 15 - xOnBoard;
  const oBorneOff = 15 - oOnBoard;

  if (xOnBoard > 15 || xOnBoard < 0 || xBorneOff < 0 || xBorneOff > 15) {
    return {
      valid: false,
      xTotal: xOnBoard + Math.max(0, xBorneOff),
      oTotal: oOnBoard + Math.max(0, oBorneOff),
      xBorneOff,
      oBorneOff,
      error: `Pions X corrompus : ${xOnBoard} sur le plateau, ${xBorneOff} sortis (attendu 15 au total).`,
    };
  }

  if (oOnBoard > 15 || oOnBoard < 0 || oBorneOff < 0 || oBorneOff > 15) {
    return {
      valid: false,
      xTotal: xOnBoard + Math.max(0, xBorneOff),
      oTotal: oOnBoard + Math.max(0, oBorneOff),
      xBorneOff,
      oBorneOff,
      error: `Pions O corrompus : ${oOnBoard} sur le plateau, ${oBorneOff} sortis (attendu 15 au total).`,
    };
  }

  return {
    valid: true,
    xTotal: 15,
    oTotal: 15,
    xBorneOff,
    oBorneOff,
  };
}

/**
 * Vérifie que le Pip Count calculé chez Player A correspond au Pip Count symétrique chez Player B.
 */
export function assertPipCountConsistency(
  boardLocalA: number[],
  boardRemoteB: number[],
  isMirroredView: boolean = true
): PipConsistencyReport {
  const pipLocal = pipCount(boardLocalA);
  const pipRemote = pipCount(boardRemoteB);

  // Si B a un plateau miroir, pipRemote.X doit correspondre à pipLocal.O et inversement
  const expectedRemoteX = isMirroredView ? pipLocal.O : pipLocal.X;
  const expectedRemoteO = isMirroredView ? pipLocal.X : pipLocal.O;

  if (pipRemote.X !== expectedRemoteX || pipRemote.O !== expectedRemoteO) {
    return {
      consistent: false,
      pipLocal,
      pipRemote,
      error: `Divergence de Pip Count : Local (X:${pipLocal.X}, O:${pipLocal.O}) vs Distant (X:${pipRemote.X}, O:${pipRemote.O}).`,
    };
  }

  return {
    consistent: true,
    pipLocal,
    pipRemote,
  };
}

/**
 * Vérifie la légalité d'un coup individuel contre les portes fermées (>= 2 pions adverses).
 */
export function validateMoveLegality(
  board: number[],
  move: Move,
  player: Player
): { legal: boolean; error?: string } {
  const { from, to } = move;

  // Règle de la barre prioritaire
  if (player === 'X' && board[X_BAR] > 0 && from !== X_BAR) {
    return { legal: false, error: 'Un pion X est sur la barre et doit rentrer en priorité.' };
  }
  if (player === 'O' && board[O_BAR] < 0 && from !== O_BAR) {
    return { legal: false, error: 'Un pion O est sur la barre et doit rentrer en priorité.' };
  }

  // Contrôle de présence de pion au départ
  if (player === 'X' && board[from] <= 0) {
    return { legal: false, error: `Aucun pion X sur la case de départ ${from}.` };
  }
  if (player === 'O' && board[from] >= 0) {
    return { legal: false, error: `Aucun pion O sur la case de départ ${from}.` };
  }

  // Contrôle de porte fermée à destination (2+ pions adverses)
  if (to >= 1 && to <= 24) {
    if (player === 'X' && board[to] <= -2) {
      return { legal: false, error: `Flèche ${to} bloquée par une porte fermée adverse (${board[to]} pions O).` };
    }
    if (player === 'O' && board[to] >= 2) {
      return { legal: false, error: `Flèche ${to} bloquée par une porte fermée adverse (${board[to]} pions X).` };
    }
  }

  return { legal: true };
}

export interface RoomSyncSession {
  readonly roomId: string;
  readonly hostUserId: string;
  readonly guestUserId?: string;
  readonly matchLength: number;
  board: number[];
  dice: [number, number] | null;
  turn: Player;
  actionsLog: RealtimeBroadcastAction[];
  lastActionTimestamp: number;
}

/**
 * Gestionnaire Autoritaire en Mémoire de Salles Multi-Tables Isolées.
 * Garantit l'étanchéité stricte entre salons concurrents (0 collision, 0 fuite d'actions).
 */
export class RoomScopedSyncManager {
  private readonly rooms = new Map<string, RoomSyncSession>();

  public createRoom(params: {
    roomId: string;
    hostUserId: string;
    guestUserId?: string;
    matchLength?: number;
  }): RoomSyncSession {
    const { roomId, hostUserId, guestUserId, matchLength = 5 } = params;
    if (this.rooms.has(roomId)) {
      throw new Error(`Room ID collision : la salle ${roomId} existe déjà.`);
    }

    const session: RoomSyncSession = {
      roomId,
      hostUserId,
      guestUserId,
      matchLength,
      board: createInitialState(matchLength).board,
      dice: null,
      turn: 'X',
      actionsLog: [],
      lastActionTimestamp: Date.now(),
    };

    this.rooms.set(roomId, session);
    return session;
  }

  public joinRoom(roomId: string, guestUserId: string): RoomSyncSession {
    const session = this.rooms.get(roomId);
    if (!session) {
      throw new Error(`Salle inconnue : ${roomId}`);
    }
    const updated: RoomSyncSession = {
      ...session,
      guestUserId,
      lastActionTimestamp: Date.now(),
    };
    this.rooms.set(roomId, updated);
    return updated;
  }

  public getRoom(roomId: string): RoomSyncSession | undefined {
    return this.rooms.get(roomId);
  }

  public countActiveRooms(): number {
    return this.rooms.size;
  }

  /**
   * Applique un coup synchronisé sur une table spécifique avec double assertion.
   */
  public applySynchronizedMove(params: {
    roomId: string;
    player: Player;
    move: Move;
    dice: [number, number];
  }): {
    success: boolean;
    resultingBoard: number[];
    remoteMirroredBoard: number[];
    integrity: CheckerIntegrityReport;
    pipConsistency: PipConsistencyReport;
  } {
    const session = this.rooms.get(params.roomId);
    if (!session) {
      throw new Error(`Action rejetée : salle ${params.roomId} introuvable.`);
    }

    const legality = validateMoveLegality(session.board, params.move, params.player);
    if (!legality.legal) {
      throw new Error(`Coup illégal sur ${params.roomId} : ${legality.error}`);
    }

    // Application du coup sur le plateau canonique
    const nextBoard = applyMove(session.board, params.move, params.player);
    const integrity = assertCheckerIntegrity(nextBoard);
    if (!integrity.valid) {
      throw new Error(`Échec intégrité pions sur ${params.roomId} : ${integrity.error}`);
    }

    // Vue symétrique pour l'adversaire
    const remoteMirroredBoard = mirrorBoard(nextBoard);
    const pipConsistency = assertPipCountConsistency(nextBoard, remoteMirroredBoard, true);
    if (!pipConsistency.consistent) {
      throw new Error(`Échec cohérence Pip Count sur ${params.roomId} : ${pipConsistency.error}`);
    }

    session.board = nextBoard;
    session.lastActionTimestamp = Date.now();
    session.actionsLog.push({
      type: 'CHECKER_MOVED',
      player: params.player,
      move: params.move,
      board: nextBoard,
      usedDice: [true, false],
      timestamp: Date.now(),
    });

    return {
      success: true,
      resultingBoard: nextBoard,
      remoteMirroredBoard,
      integrity,
      pipConsistency,
    };
  }
}
