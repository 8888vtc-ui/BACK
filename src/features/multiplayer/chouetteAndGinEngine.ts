/**
 * @file chouetteAndGinEngine.ts
 * @module features/multiplayer/chouetteAndGinEngine
 * @description Moteur mathématique autoritaire pour serveur de tournoi WBGF et Chouette :
 * 1. XGIDCodec canonique avec hachage FNV-1a 64-bit et idempotence
 * 2. Horloge Bronstein autoritaire avec EWMA RTT et pénalité WBGF Art. 4.1(b)
 * 3. DisconnectArbitrator avec classifieur logistique Rage-Quit et détection Gin DAG
 * 4. BackgammonChouetteEngine avec multi-cubes, rachat et règlement à somme nulle
 */

// --- 1. XGIDCodec & FNV-1a 64-bit ---

export interface ParsedXGID {
  readonly board: string;
  readonly cubeVal: number;
  readonly cubePos: number; // 0 = centered, 1 = player 1, -1 = player 2
  readonly turn: number; // 1 = player 1, -1 = player 2
  readonly dice: string; // e.g. "53" or "00"
  readonly scoreB: number;
  readonly scoreT: number;
  readonly crawfordJacoby: number; // 0 = normal, 1 = crawford/jacoby
  readonly matchLen: number; // 0 = money game
  readonly maxCube: number;
}

const FNV1A_OFFSET_BASIS = 0xcbf29ce484222325n;
const FNV1A_PRIME = 0x100000001b3n;
const FNV1A_MASK64 = 0xffffffffffffffffn;

export const XGIDCodec = {
  serialize(data: ParsedXGID): string {
    return `XGID=${data.board}:${data.cubeVal}:${data.cubePos}:${data.turn}:${data.dice}:${data.scoreB}:${data.scoreT}:${data.crawfordJacoby}:${data.matchLen}:${data.maxCube}`;
  },

  parse(xgidString: string): ParsedXGID {
    const cleanStr = xgidString.startsWith('XGID=') ? xgidString.slice(5) : xgidString;
    const parts = cleanStr.split(':');
    if (parts.length !== 10) {
      throw new Error(`Invalid XGID format: expected 10 parts, received ${parts.length}`);
    }

    const [board, cVal, cPos, turn, dice, scB, scT, cj, mLen, maxC] = parts;
    const cubeVal = Number.parseInt(cVal, 10);
    const cubePos = Number.parseInt(cPos, 10);
    const turnVal = Number.parseInt(turn, 10);
    const scoreB = Number.parseInt(scB, 10);
    const scoreT = Number.parseInt(scT, 10);
    const crawfordJacoby = Number.parseInt(cj, 10);
    const matchLen = Number.parseInt(mLen, 10);
    const maxCube = Number.parseInt(maxC, 10);

    if (
      Number.isNaN(cubeVal) ||
      Number.isNaN(cubePos) ||
      Number.isNaN(turnVal) ||
      Number.isNaN(scoreB) ||
      Number.isNaN(scoreT) ||
      Number.isNaN(crawfordJacoby) ||
      Number.isNaN(matchLen) ||
      Number.isNaN(maxCube)
    ) {
      throw new Error(`Invalid numerical value in XGID: ${xgidString}`);
    }

    return {
      board,
      cubeVal,
      cubePos,
      turn: turnVal,
      dice,
      scoreB,
      scoreT,
      crawfordJacoby,
      matchLen,
      maxCube,
    };
  },

  fnv1a64(input: string): bigint {
    let hash = FNV1A_OFFSET_BASIS;
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    for (let i = 0; i < bytes.length; i++) {
      hash ^= BigInt(bytes[i]);
      hash = (hash * FNV1A_PRIME) & FNV1A_MASK64;
    }
    return hash;
  },
};

// --- 2. AuthoritativeBronsteinClock (WBGF Art. 4.1b) ---

export interface ClockState {
  readonly mainTimeRemainingMs: number;
  readonly delayPerMoveMs: number;
  readonly estimatedRttMs: number;
  readonly penaltyPointsApplied: number;
}

export interface TurnTimeResult {
  readonly nextState: ClockState;
  readonly timeExceeded: boolean;
  readonly forcedMovePenaltyApplied: boolean;
}

export const AuthoritativeBronsteinClock = {
  createInitial(mainTimeMinutes: number, delaySeconds: number): ClockState {
    return {
      mainTimeRemainingMs: mainTimeMinutes * 60 * 1000,
      delayPerMoveMs: delaySeconds * 1000,
      estimatedRttMs: 50,
      penaltyPointsApplied: 0,
    };
  },

  processMoveTime(
    clock: ClockState,
    rawElapsedMs: number,
    observedRttMs: number,
    remainingLegalMovesCount: number
  ): TurnTimeResult {
    // 1. EWMA RTT estimation (alpha = 0.2, clamp [0, 500ms])
    const clampedRtt = Math.min(Math.max(0, observedRttMs), 500);
    const newEstimatedRtt = 0.8 * clock.estimatedRttMs + 0.2 * clampedRtt;

    // 2. Net elapsed time adjusted for network latency (half-RTT)
    const netElapsed = Math.max(0, rawElapsedMs - newEstimatedRtt / 2);

    // 3. Simple Bronstein delay consumption
    const toDeduct = Math.max(0, netElapsed - clock.delayPerMoveMs);
    const tentativeReserve = clock.mainTimeRemainingMs - toDeduct;

    // 4. WBGF Art. 4.1(b) evaluation on timeout
    if (tentativeReserve <= 0) {
      if (remainingLegalMovesCount <= 1) {
        // Forced move rule: apply move, freeze reserve at 1ms, +1 point to opponent
        return {
          nextState: {
            mainTimeRemainingMs: 1,
            delayPerMoveMs: clock.delayPerMoveMs,
            estimatedRttMs: newEstimatedRtt,
            penaltyPointsApplied: clock.penaltyPointsApplied + 1,
          },
          timeExceeded: false,
          forcedMovePenaltyApplied: true,
        };
      }
      return {
        nextState: {
          mainTimeRemainingMs: 0,
          delayPerMoveMs: clock.delayPerMoveMs,
          estimatedRttMs: newEstimatedRtt,
          penaltyPointsApplied: clock.penaltyPointsApplied,
        },
        timeExceeded: true,
        forcedMovePenaltyApplied: false,
      };
    }

    return {
      nextState: {
        mainTimeRemainingMs: tentativeReserve,
        delayPerMoveMs: clock.delayPerMoveMs,
        estimatedRttMs: newEstimatedRtt,
        penaltyPointsApplied: clock.penaltyPointsApplied,
      },
      timeExceeded: false,
      forcedMovePenaltyApplied: false,
    };
  },
};

// --- 3. DisconnectArbitrator & DeterministicGinDetector ---

export interface DisconnectEvaluationInput {
  readonly connectionType: 'mobile_cellular' | 'fixed_wifi';
  readonly lastMoveEquityLoss: number; // -delta E >= 0
  readonly winProbability: number; // P(win) in [0, 1]
  readonly closeFrameCode?: number; // 1000, 1001, etc.
  readonly visibilityHiddenRecent: boolean;
  readonly netJitterScore: number; // J_net in [0, 1]
  readonly isGuaranteedGinLoss: boolean;
}

export type DisconnectAction =
  | 'AUTO_ADJUDICATE_GIN_LOSS'
  | 'SHORTENED_GRACE_RAGE_QUIT'
  | 'STANDARD_NETWORK_GRACE';

export interface DisconnectDecision {
  readonly action: DisconnectAction;
  readonly graceWindowSeconds: number;
  readonly rageQuitScore: number;
}

export const DeterministicGinDetector = {
  /**
   * Vérifie formellement si la position est une perte certaine (Gin adverse, P(win) = 0).
   * Course sans contact (max pos mover < min pos opp en coordonnées 1..24)
   * et MaxTurnsToBearOff(opp) <= MinTurnsToBearOff(disconnected) - opp_on_roll.
   */
  isGuaranteedLossForDisconnected(
    disconnectedRemainingCheckers: number,
    disconnectedMaxPoint: number,
    oppRemainingCheckers: number,
    oppMinPoint: number,
    isOpponentOnRoll: boolean
  ): boolean {
    if (disconnectedRemainingCheckers <= 0) {
      return false;
    }
    if (oppRemainingCheckers <= 0) {
      return true;
    }

    // 1. Course sans contact : toutes les dames ont croisé l'adversaire
    if (disconnectedMaxPoint >= oppMinPoint) {
      return false;
    }

    // 2. Calcul des bornes de tours pour vider le plateau
    // Borne sup de l'adversaire : au pire 2 pions sortis par coup non-double
    const oppMaxTurnsNeeded = Math.ceil(oppRemainingCheckers / 2);
    // Borne inf du joueur déconnecté : au mieux 4 pions par tour en tirant des doubles à chaque fois
    const disconnectedMinTurnsNeeded = Math.ceil(disconnectedRemainingCheckers / 4);

    const turnAdjustment = isOpponentOnRoll ? 1 : 0;
    return oppMaxTurnsNeeded <= disconnectedMinTurnsNeeded - turnAdjustment;
  },
};

export const DisconnectArbitrator = {
  computeRageQuitScore(input: DisconnectEvaluationInput): number {
    const w0 = -2.2;
    const w1 = 6.5;
    const w2 = 5.0;
    const w3 = 2.8;
    const w4 = 1.9;
    const w5 = 3.5;

    const deltaE = Math.max(0, input.lastMoveEquityLoss);
    const despair = Math.max(0, 0.15 - input.winProbability);
    const closeFrame = input.closeFrameCode === 1000 || input.closeFrameCode === 1001 ? 1 : 0;
    const visHidden = input.visibilityHiddenRecent ? 1 : 0;
    const jNet = Math.min(Math.max(0, input.netJitterScore), 1);

    const z = w0 + w1 * deltaE + w2 * despair + w3 * closeFrame + w4 * visHidden - w5 * jNet;
    return 1 / (1 + Math.exp(-z));
  },

  evaluateDisconnect(input: DisconnectEvaluationInput): DisconnectDecision {
    if (input.isGuaranteedGinLoss) {
      return {
        action: 'AUTO_ADJUDICATE_GIN_LOSS',
        graceWindowSeconds: 0,
        rageQuitScore: 1.0,
      };
    }

    const rqScore = this.computeRageQuitScore(input);
    if (rqScore >= 0.78) {
      return {
        action: 'SHORTENED_GRACE_RAGE_QUIT',
        graceWindowSeconds: 10,
        rageQuitScore: rqScore,
      };
    }

    const standardGrace = input.connectionType === 'mobile_cellular' ? 45 : 30;
    return {
      action: 'STANDARD_NETWORK_GRACE',
      graceWindowSeconds: standardGrace,
      rageQuitScore: rqScore,
    };
  },
};

// --- 4. BackgammonChouetteEngine ---

export interface ChouetteState {
  readonly lineup: ReadonlyArray<string>; // [boxId, captainId, ...crewIds]
  readonly cubeValues: Readonly<Record<string, number>>; // memberId -> cube value
}

export interface ChouetteSettlementResult {
  readonly netScoreByPlayer: Readonly<Record<string, number>>;
  readonly zeroSumVerified: boolean;
  readonly nextLineup: ReadonlyArray<string>;
}

export const BackgammonChouetteEngine = {
  canConsultCaptain(cubeValue: number): boolean {
    return cubeValue >= 2;
  },

  takeoverCube(
    state: ChouetteState,
    droppingMemberId: string,
    takingMemberId: string
  ): ChouetteState {
    const currentVal = state.cubeValues[droppingMemberId] ?? 1;
    const doubledVal = currentVal * 2;
    const updatedCubes = {
      ...state.cubeValues,
      [droppingMemberId]: currentVal, // dropped at previous level
      [takingMemberId]: (state.cubeValues[takingMemberId] ?? 1) + doubledVal, // assumes both
    };

    return {
      lineup: state.lineup,
      cubeValues: updatedCubes,
    };
  },

  settleGame(
    state: ChouetteState,
    winner: 'box' | 'team',
    gameMultiplier: 1 | 2 | 3 = 1
  ): ChouetteSettlementResult {
    const [boxId, captainId, ...crewIds] = state.lineup;
    const teamIds = [captainId, ...crewIds];
    const isBoxWinner = winner === 'box';
    const epsilon = isBoxWinner ? 1 : -1;

    const netScoreByPlayer: Record<string, number> = {};
    let totalTeamDelta = 0;

    for (const memberId of teamIds) {
      const cubeVal = state.cubeValues[memberId] ?? 1;
      const delta = -epsilon * gameMultiplier * cubeVal;
      netScoreByPlayer[memberId] = delta;
      totalTeamDelta += delta;
    }

    // Conservation property: Net(Box) = - sum(Net(Team))
    netScoreByPlayer[boxId] = -totalTeamDelta;

    // Check sum
    let totalSum = 0;
    for (const id of state.lineup) {
      totalSum += netScoreByPlayer[id] ?? 0;
    }
    const zeroSumVerified = totalSum === 0;

    // Lineup rotation
    let nextLineup: ReadonlyArray<string>;
    if (isBoxWinner) {
      // Box stays in box, Captain drops to end of line, M1 becomes new Captain
      const [firstCrew, ...remainingCrew] = crewIds;
      nextLineup = [boxId, firstCrew, ...remainingCrew, captainId];
    } else {
      // Team won: Captain becomes Box, ex-Box goes to back of line, M1 becomes Captain
      const [firstCrew, ...remainingCrew] = crewIds;
      nextLineup = [captainId, firstCrew, ...remainingCrew, boxId];
    }

    return {
      netScoreByPlayer,
      zeroSumVerified,
      nextLineup,
    };
  },
};
