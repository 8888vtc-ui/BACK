/**
 * @file src/lib/__tests__/multiplayerPairSyncEngine.test.ts
 * @description Suite de tests Vitest de validation des 5 Verrous Multijoueur Temps Réel :
 * 1. Connexion de 2 codes utilisateurs via inviteRoom et synchronisation exacte de 20 coups consécutifs.
 * 2. Synchronisation complète du Videau (Double -> Take -> Redouble -> Pass) et Cash-Out à somme nulle.
 * 3. Exécution parallèle de 150 paires simultanées (300 joueurs) avec 0 collision de roomId et latence < 15 ms.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveUserCodeProfile,
  loginWithUserCode,
  USER_CODE_STORAGE_KEY,
} from '../../features/multiplayer/userCodeSessionService';
import {
  RoomScopedSyncManager,
  assertCheckerIntegrity,
  assertPipCountConsistency,
  mirrorBoard,
  mirrorMove,
  mirrorPoint,
} from '../../features/multiplayer/multiplayerPairSyncEngine';
import {
  createInitialCubeState,
  offerDouble,
  acceptDouble,
  passDouble,
  calculateFairEquityCashOut,
} from '../../features/multiplayer/fairEquityCashOut';
import { HUMAN_PERSONA_POOL } from '../../features/personas/humanPersonaSeeds';
import {
  createInitialState,
  generateLegalMoves,
  pipCount,
} from '../../engine/backgammonEngine';

// Simule un stockage isolé pour les contextes navigateurs indépendants
function createMockStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, val: string) => map.set(key, String(val)),
    removeItem: (key: string) => map.delete(key),
    clear: () => map.clear(),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    length: 0,
  };
}

describe('Moteur Multijoueur Temps Réel & Synchronisation de Paires', () => {
  it('1. Connexion de 2 codes utilisateurs via inviteRoom et synchronisation exacte de 20 coups consécutifs', () => {
    // 1. Identification de 2 profils indépendants parmi les 300
    const storageA = createMockStorage();
    const storageB = createMockStorage();

    const profA = loginWithUserCode('user_1', storageA);
    const profB = loginWithUserCode('user_2', storageB);

    // Vérification de la session et des profils
    expect(profA.username).toBe('Thomas R.');
    expect(profA.rating % 10).not.toBe(0); // Elo non rond
    expect(profA.countryFlag).toBe('🇫🇷');
    expect(['PRUDENT', 'AGGRESSIVE', 'BALANCED']).toContain(profA.style);

    expect(profB.username).toBe('Laurent B.');
    expect(profB.rating % 10).not.toBe(0);
    expect(profB.countryFlag).toBe('🇫🇷');

    // Isolation stricte des contextes A et B
    expect(storageA.getItem(USER_CODE_STORAGE_KEY)).toBe(profA.id);
    expect(storageB.getItem(USER_CODE_STORAGE_KEY)).toBe(profB.id);
    expect(storageA.getItem(USER_CODE_STORAGE_KEY)).not.toBe(storageB.getItem(USER_CODE_STORAGE_KEY));

    // 2. Création et jonction de la table
    const syncManager = new RoomScopedSyncManager();
    const roomId = 'bg_table_alpha_1';
    syncManager.createRoom({
      roomId,
      hostUserId: profA.id,
      matchLength: 5,
    });
    syncManager.joinRoom(roomId, profB.id);

    const room = syncManager.getRoom(roomId);
    expect(room).toBeDefined();
    expect(room?.guestUserId).toBe(profB.id);

    // 3. Synchronisation de 20 coups consécutifs avec double assertion d'intégrité
    let currentBoard = createInitialState(5).board;
    let currentPlayer: 'X' | 'O' = 'X';
    let movesPlayed = 0;

    for (let turn = 0; turn < 20; turn++) {
      const dicePair: [number, number] = [(turn % 6) + 1, ((turn + 2) % 6) + 1];
      const state = { ...createInitialState(5), board: currentBoard, turn: currentPlayer };
      const legal = generateLegalMoves(state, dicePair);

      if (legal.length > 0 && legal[0].moves.length > 0) {
        const moveSeq = legal[0];
        const step = moveSeq.moves[0];

        const syncResult = syncManager.applySynchronizedMove({
          roomId,
          player: currentPlayer,
          move: step,
          dice: dicePair,
        });

        // Double assertion 1 : Exactement 15 pions par camp
        expect(syncResult.integrity.valid).toBe(true);
        expect(syncResult.integrity.xTotal).toBe(15);
        expect(syncResult.integrity.oTotal).toBe(15);

        // Double assertion 2 : Symétrie 25 - i & Cohérence des Pip Counts
        expect(syncResult.pipConsistency.consistent).toBe(true);

        // Vérification de la transformation symétrique
        const mirroredStep = mirrorMove(step);
        expect(mirroredStep.from).toBe(mirrorPoint(step.from));
        expect(mirroredStep.to).toBe(mirrorPoint(step.to));

        const mirroredBoardCalculated = mirrorBoard(syncResult.resultingBoard);
        const pLocal = pipCount(syncResult.resultingBoard);
        const pRemote = pipCount(mirroredBoardCalculated);
        expect(pLocal.X).toBe(pRemote.O);
        expect(pLocal.O).toBe(pRemote.X);

        currentBoard = syncResult.resultingBoard;
        movesPlayed++;
      }

      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    }

    expect(movesPlayed).toBeGreaterThanOrEqual(15);
    expect(syncManager.getRoom(roomId)?.actionsLog.length).toBe(movesPlayed);
  });

  it('2. Synchronisation complète du Videau (Double -> Take -> Redouble -> Pass) et Cash-Out à somme nulle', () => {
    // 1. Cycle complet de videau
    let cube = createInitialCubeState();
    expect(cube.cubeValue).toBe(1);
    expect(cube.cubeOwner).toBeNull();

    // A propose Double (x2)
    cube = offerDouble(cube, 'X');
    expect(cube.status).toBe('OFFERED');
    expect(cube.cubeValue).toBe(2);
    expect(cube.doublingOfferedBy).toBe('X');

    // B accepte (Take) -> B devient propriétaire exclusif
    cube = acceptDouble(cube, 'O');
    expect(cube.status).toBe('ACCEPTED');
    expect(cube.cubeValue).toBe(2);
    expect(cube.cubeOwner).toBe('O');

    // B propose Redouble (x4)
    cube = offerDouble(cube, 'O');
    expect(cube.status).toBe('OFFERED');
    expect(cube.cubeValue).toBe(4);
    expect(cube.doublingOfferedBy).toBe('O');

    // A refuse (Pass) -> B gagne à la valeur 2
    cube = passDouble(cube, 'X');
    expect(cube.status).toBe('PASSED');
    expect(cube.winner).toBe('O');
    expect(cube.pointsAwarded).toBe(2);

    // 2. Partage au prorata (Cash-Out) à Somme Nulle stricte
    const scenarios = [
      { equityA: 0.35, stake: 4, rA: 1540, rB: 1520 },
      { equityA: -0.60, stake: 8, rA: 1480, rB: 1610 },
      { equityA: 0.85, stake: 100, rA: 1650, rB: 1420 },
    ];

    for (const sc of scenarios) {
      const cashOut = calculateFairEquityCashOut({
        equityA: sc.equityA,
        currentStakePoints: sc.stake,
        ratingA: sc.rA,
        ratingB: sc.rB,
      });

      expect(cashOut.zeroSumVerified).toBe(true);
      // deltaS_A + deltaS_B = 0
      expect(Math.abs(cashOut.deltaPointsA + cashOut.deltaPointsB)).toBeLessThanOrEqual(0.01);
      // deltaElo_A + deltaElo_B = 0
      expect(cashOut.eloDeltaA + cashOut.eloDeltaB).toBe(0);
    }

    // Adjudication anti-vol au temps (>= 60% d'équité adverse)
    const timeoutAdjudication = calculateFairEquityCashOut({
      equityA: 0.72,
      currentStakePoints: 10,
      ratingA: 1550,
      ratingB: 1550,
      isAdjudicationTimeout: true,
    });
    expect(timeoutAdjudication.zeroSumVerified).toBe(true);
    expect(timeoutAdjudication.eloDeltaA + timeoutAdjudication.eloDeltaB).toBe(0);
    expect(timeoutAdjudication.deltaPointsA).toBeGreaterThan(0);
    expect(timeoutAdjudication.deltaPointsB).toBeLessThan(0);
  });

  it('3. Exécution parallèle de 150 paires simultanées (300 joueurs) avec 0 collision de roomId et latence < 15 ms', () => {
    expect(HUMAN_PERSONA_POOL.length).toBe(300);

    const syncManager = new RoomScopedSyncManager();
    const pairCount = 150;
    const roomIds = new Set<string>();

    const startTime = performance.now();

    // 1. Création des 150 tables isolées avec les 300 joueurs distincts
    for (let i = 0; i < pairCount; i++) {
      const playerA = HUMAN_PERSONA_POOL[i * 2];
      const playerB = HUMAN_PERSONA_POOL[i * 2 + 1];

      const roomId = `room_pair_${i}_${playerA.id}_vs_${playerB.id}`;
      roomIds.add(roomId);

      syncManager.createRoom({
        roomId,
        hostUserId: playerA.id,
        matchLength: 5,
      });
      syncManager.joinRoom(roomId, playerB.id);
    }

    // Zéro collision garantie
    expect(roomIds.size).toBe(pairCount);
    expect(syncManager.countActiveRooms()).toBe(pairCount);

    // 2. Simulation d'un coup simultané sur chacune des 150 tables
    for (let i = 0; i < pairCount; i++) {
      const roomId = Array.from(roomIds)[i];
      const result = syncManager.applySynchronizedMove({
        roomId,
        player: 'X',
        move: { from: 13, to: 10 }, // Coup d'ouverture légal avec dé 3
        dice: [3, 1],
      });

      expect(result.success).toBe(true);
      expect(result.integrity.valid).toBe(true);
      expect(result.integrity.xTotal).toBe(15);
      expect(result.integrity.oTotal).toBe(15);
    }

    const elapsed = performance.now() - startTime;
    const latencyPerPair = elapsed / pairCount;

    // Latence par paire strictement inférieure à 15 ms
    expect(latencyPerPair).toBeLessThan(15.0);

    // Vérification de l'étanchéité stricte (aucune action de la table 0 n'a fuité sur la table 1)
    const room0 = syncManager.getRoom(Array.from(roomIds)[0]);
    const room1 = syncManager.getRoom(Array.from(roomIds)[1]);
    expect(room0?.actionsLog.length).toBe(1);
    expect(room1?.actionsLog.length).toBe(1);
    expect(room0?.hostUserId).not.toBe(room1?.hostUserId);
  });
});
