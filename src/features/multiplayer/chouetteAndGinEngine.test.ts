/**
 * @file chouetteAndGinEngine.test.ts
 * @module features/multiplayer/chouetteAndGinEngine.test
 * @description Tests unitaires de validation mathématique et réglementaire :
 * 1. XGIDCodec et condensat FNV-1a 64 bits
 * 2. Horloge Bronstein autoritaire avec règle WBGF Art. 4.1(b) sur coup forcé
 * 3. DisconnectArbitrator, classifieur Rage-Quit et détection Gin DAG
 * 4. BackgammonChouetteEngine, consultation, rachat et exemple Alice/Bob/Chloé/David
 */

import { describe, expect, it } from 'vitest';
import {
  AuthoritativeBronsteinClock,
  BackgammonChouetteEngine,
  DeterministicGinDetector,
  DisconnectArbitrator,
  type DisconnectEvaluationInput,
  type ParsedXGID,
  XGIDCodec,
} from './chouetteAndGinEngine';

describe('XGIDCodec & FNV-1a 64-bit', () => {
  const sampleXgidData: ParsedXGID = {
    board: '-b----E-C---eE---c-e----B-',
    cubeVal: 1,
    cubePos: 0,
    turn: 1,
    dice: '53',
    scoreB: 0,
    scoreT: 0,
    crawfordJacoby: 0,
    matchLen: 7,
    maxCube: 64,
  };

  it('sérialise et désérialise un XGID canonique de manière bijective', () => {
    const serialized = XGIDCodec.serialize(sampleXgidData);
    expect(serialized).toBe('XGID=-b----E-C---eE---c-e----B-:1:0:1:53:0:0:0:7:64');

    const parsed = XGIDCodec.parse(serialized);
    expect(parsed).toEqual(sampleXgidData);
  });

  it('lève une exception explicite si le XGID est corrompu (Règle 2 : zéro donnée factice)', () => {
    expect(() => XGIDCodec.parse('XGID=invalid:1:2')).toThrow(/Invalid XGID format/);
    expect(() => XGIDCodec.parse('a:b:c:d:e:f:g:h:i:j')).toThrow(/Invalid numerical value/);
  });

  it('calcule un condensat FNV-1a 64 bits déterministe et sensible à chaque octet', () => {
    const raw = 'XGID=-b----E-C---eE---c-e----B-:1:0:1:53:0:0:0:7:64';
    const hash1 = XGIDCodec.fnv1a64(raw);
    const hash2 = XGIDCodec.fnv1a64(raw);
    expect(hash1).toBe(hash2);
    expect(typeof hash1).toBe('bigint');

    const altered = 'XGID=-b----E-C---eE---c-e----B-:1:0:1:54:0:0:0:7:64';
    const hashAltered = XGIDCodec.fnv1a64(altered);
    expect(hash1).not.toBe(hashAltered);
  });
});

describe('AuthoritativeBronsteinClock & Règle WBGF Art. 4.1(b)', () => {
  it('consomme le délai simple avant de puiser dans la réserve principale', () => {
    const clock = AuthoritativeBronsteinClock.createInitial(2, 12); // 2 min + 12s délai
    expect(clock.mainTimeRemainingMs).toBe(120000);
    expect(clock.delayPerMoveMs).toBe(12000);

    // Coup joué en 8 secondes (inférieur au délai de 12s)
    const resultFast = AuthoritativeBronsteinClock.processMoveTime(clock, 8000, 40, 5);
    expect(resultFast.timeExceeded).toBe(false);
    expect(resultFast.forcedMovePenaltyApplied).toBe(false);
    expect(resultFast.nextState.mainTimeRemainingMs).toBe(120000); // réserve intacte

    // Coup joué en 16 secondes (4s au-delà du délai, moins demi-RTT de ~24ms)
    const resultSlow = AuthoritativeBronsteinClock.processMoveTime(clock, 16000, 40, 5);
    expect(resultSlow.timeExceeded).toBe(false);
    expect(resultSlow.nextState.mainTimeRemainingMs).toBeLessThan(120000);
    expect(resultSlow.nextState.mainTimeRemainingMs).toBeGreaterThan(115000);
  });

  it('applique la règle WBGF 4.1(b) : coup forcé validé, réserve figée à 1ms, +1 pt de pénalité', () => {
    const clock = {
      mainTimeRemainingMs: 1000, // seulement 1s restante
      delayPerMoveMs: 5000,
      estimatedRttMs: 50,
      penaltyPointsApplied: 0,
    };

    // Coup long qui dépasse la réserve, mais où il n'y a qu'1 seul coup légal (coup forcé)
    const result = AuthoritativeBronsteinClock.processMoveTime(clock, 15000, 50, 1);
    expect(result.timeExceeded).toBe(false);
    expect(result.forcedMovePenaltyApplied).toBe(true);
    expect(result.nextState.mainTimeRemainingMs).toBe(1); // 1 ms conservé
    expect(result.nextState.penaltyPointsApplied).toBe(1);
  });

  it('prononce la défaite au temps si la réserve expire sur un coup non forcé', () => {
    const clock = {
      mainTimeRemainingMs: 500,
      delayPerMoveMs: 2000,
      estimatedRttMs: 50,
      penaltyPointsApplied: 0,
    };

    // Coup long qui dépasse la réserve avec choix multiples (3 coups légaux)
    const result = AuthoritativeBronsteinClock.processMoveTime(clock, 10000, 50, 3);
    expect(result.timeExceeded).toBe(true);
    expect(result.forcedMovePenaltyApplied).toBe(false);
    expect(result.nextState.mainTimeRemainingMs).toBe(0);
  });
});

describe('DisconnectArbitrator & DeterministicGinDetector', () => {
  it('détecte mathématiquement une position de Gin (perte certaine de déconnexion)', () => {
    // Joueur déconnecté a 10 pions au loin (min 3 tours pour sortir),
    // Adversaire a seulement 2 pions sur le point 24 (max 1 tour)
    const isGin = DeterministicGinDetector.isGuaranteedLossForDisconnected(
      10,
      6, // disconnected: max point 6
      2,
      24, // opp: min point 24
      true // opp a le trait
    );
    expect(isGin).toBe(true);
  });

  it('rejette le statut Gin en cas de chevauchement / contact possible', () => {
    const isGin = DeterministicGinDetector.isGuaranteedLossForDisconnected(5, 12, 5, 8, false);
    expect(isGin).toBe(false);
  });

  it('adjudique immédiatement la défaite sans pénalité si le joueur adverse est Gin', () => {
    const input: DisconnectEvaluationInput = {
      connectionType: 'fixed_wifi',
      lastMoveEquityLoss: 0,
      winProbability: 0,
      visibilityHiddenRecent: false,
      netJitterScore: 0.1,
      isGuaranteedGinLoss: true,
    };

    const decision = DisconnectArbitrator.evaluateDisconnect(input);
    expect(decision.action).toBe('AUTO_ADJUDICATE_GIN_LOSS');
    expect(decision.graceWindowSeconds).toBe(0);
  });

  it('identifie un Rage-Quit avéré et écourte la fenêtre de grâce à 10s', () => {
    const input: DisconnectEvaluationInput = {
      connectionType: 'mobile_cellular',
      lastMoveEquityLoss: 0.45, // énorme gaffe
      winProbability: 0.05, // position désespérée
      closeFrameCode: 1001, // fermeture volontaire onglet
      visibilityHiddenRecent: true,
      netJitterScore: 0.05, // réseau stable avant coupure
      isGuaranteedGinLoss: false,
    };

    const decision = DisconnectArbitrator.evaluateDisconnect(input);
    expect(decision.action).toBe('SHORTENED_GRACE_RAGE_QUIT');
    expect(decision.graceWindowSeconds).toBe(10);
    expect(decision.rageQuitScore).toBeGreaterThanOrEqual(0.78);
  });

  it('accorde la grâce réseau normale (45s mobile / 30s Wi-Fi) en cas de déconnexion technique', () => {
    const inputMobile: DisconnectEvaluationInput = {
      connectionType: 'mobile_cellular',
      lastMoveEquityLoss: 0.01,
      winProbability: 0.52,
      visibilityHiddenRecent: false,
      netJitterScore: 0.85, // réseau très instable
      isGuaranteedGinLoss: false,
    };
    const decisionMobile = DisconnectArbitrator.evaluateDisconnect(inputMobile);
    expect(decisionMobile.action).toBe('STANDARD_NETWORK_GRACE');
    expect(decisionMobile.graceWindowSeconds).toBe(45);

    const inputWifi: DisconnectEvaluationInput = {
      ...inputMobile,
      connectionType: 'fixed_wifi',
    };
    const decisionWifi = DisconnectArbitrator.evaluateDisconnect(inputWifi);
    expect(decisionWifi.action).toBe('STANDARD_NETWORK_GRACE');
    expect(decisionWifi.graceWindowSeconds).toBe(30);
  });
});

describe('BackgammonChouetteEngine', () => {
  it('autorise la consultation du Capitaine uniquement lorsque le videau est >= 2', () => {
    expect(BackgammonChouetteEngine.canConsultCaptain(1)).toBe(false);
    expect(BackgammonChouetteEngine.canConsultCaptain(2)).toBe(true);
    expect(BackgammonChouetteEngine.canConsultCaptain(4)).toBe(true);
  });

  it('règle fidèlement l’exemple canonique à somme nulle Alice/Bob/Chloé/David : -13 + 1 + 8 + 4 = 0', () => {
    const state = {
      lineup: ['alice', 'bob', 'chloe', 'david'], // Alice Box, Bob Capt, Chloe M1, David M2
      cubeValues: {
        bob: 1,
        chloe: 8,
        david: 4,
      },
    };

    // L'équipe gagne une partie simple (m=1)
    const result = BackgammonChouetteEngine.settleGame(state, 'team', 1);

    expect(result.zeroSumVerified).toBe(true);
    expect(result.netScoreByPlayer.bob).toBe(1);
    expect(result.netScoreByPlayer.chloe).toBe(8);
    expect(result.netScoreByPlayer.david).toBe(4);
    expect(result.netScoreByPlayer.alice).toBe(-13);

    // Vérification de la somme nulle
    const sum =
      result.netScoreByPlayer.alice +
      result.netScoreByPlayer.bob +
      result.netScoreByPlayer.chloe +
      result.netScoreByPlayer.david;
    expect(sum).toBe(0);

    // Victoire de l'équipe : Bob (Capitaine) devient la nouvelle Box,
    // Chloé devient Capitaine, David reste M1, Alice va en queue de file
    expect(result.nextLineup).toEqual(['bob', 'chloe', 'david', 'alice']);
  });

  it('conserve la Box et fait passer le Capitaine en queue lors d’une victoire de la Box', () => {
    const state = {
      lineup: ['alice', 'bob', 'chloe', 'david'],
      cubeValues: {
        bob: 2,
        chloe: 2,
        david: 2,
      },
    };

    const result = BackgammonChouetteEngine.settleGame(state, 'box', 1);
    expect(result.zeroSumVerified).toBe(true);
    expect(result.netScoreByPlayer.alice).toBe(6);
    expect(result.netScoreByPlayer.bob).toBe(-2);
    expect(result.netScoreByPlayer.chloe).toBe(-2);
    expect(result.netScoreByPlayer.david).toBe(-2);

    // Box reste en tête, Chloé devient Capitaine, David reste M1, Bob passe en queue
    expect(result.nextLineup).toEqual(['alice', 'chloe', 'david', 'bob']);
  });

  it('supporte le rachat de videau (takeover) par un coéquipier', () => {
    const state = {
      lineup: ['alice', 'bob', 'chloe', 'david'],
      cubeValues: {
        bob: 1,
        chloe: 2,
        david: 2,
      },
    };

    // David veut abandonner un double, Chloé rachète son cube (valeur doublée 4)
    const afterTakeover = BackgammonChouetteEngine.takeoverCube(state, 'david', 'chloe');
    expect(afterTakeover.cubeValues.david).toBe(2); // payé au niveau 2
    expect(afterTakeover.cubeValues.chloe).toBe(6); // 2 existant + 4 repris
  });
});
