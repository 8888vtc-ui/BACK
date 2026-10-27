/**
 * @file src/lib/coach/zareTiltEngine.ts
 * @description Moteur mathématique de Douglas Zare :
 * 1. Dissociation formelle Luck vs Skill (ΔE_total = ΔE_luck + ΔE_skill).
 * 2. Détection quantitative du Tilt cognitif et émotionnel (impulsivité, bad-beat, série de gaffes).
 * Strictement typé (zéro `any`), pur et déterministe.
 */

export type TiltLevel = 'calm' | 'warming' | 'tilted';

export interface TiltDecisionSample {
  /** Perte d'équité du coup joué (positive : ex 0.085 pour une gaffe de -0.085 Eq) */
  equityLoss: number;
  /** Temps de réflexion en millisecondes avant validation du coup */
  reactionTimeMs?: number;
  /** Variation d'équité liée à la chance du lancer (négative = coup du sort / bad beat) */
  luckDelta?: number;
  /** Numéro du tour (optionnel) */
  turnIndex?: number;
}

export interface ZareLuckVsSkillBreakdown {
  /** Variation d'équité imputable à la décision du joueur (<= 0, ex: -0.095) */
  skillDeltaEquity: number;
  /** Variation d'équité imputable à la variance des dés (peut être positive ou négative) */
  luckDeltaEquity: number;
  /** Somme algébrique ΔE_luck + ΔE_skill */
  totalDeltaEquity: number;
  /** Verdict pédagogique en français (dissociation claire décision vs tirage) */
  summaryFr: string;
  /** Verdict pédagogique en anglais */
  summaryEn: string;
}

export interface ZareTiltEvaluation {
  /** Score de tilt normalisé entre 0 et 100 */
  tiltScore: number;
  /** Niveau qualitatif du tilt */
  tiltLevel: TiltLevel;
  /** Booléen indiquant un état de tilt avéré (score >= 60) */
  isTilted: boolean;
  /** Nombre de gaffes/erreurs consécutives en cours */
  consecutiveBlunders: number;
  /** Nombre de gaffes jouées de manière impulsive (< 3.5s) */
  fastPlayBlunders: number;
  /** Nombre de gaffes commises immédiatement après un mauvais tirage (bad beat) */
  postBadBeatBlunders: number;
  /** Perte d'équité moyenne sur la fenêtre glissante récente */
  recentAverageEquityLoss: number;
  /** Recommandation neuro-pédagogique en français */
  recommendationFr: string;
  /** Recommandation neuro-pédagogique en anglais */
  recommendationEn: string;
}

/** Seuil d'erreur significative (60 millièmes d'équité) */
export const ZARE_SIGNIFICANT_ERROR_THRESHOLD = 0.06;

/** Seuil de gaffe franche (blunder : 80 millièmes d'équité) */
export const ZARE_BLUNDER_THRESHOLD = 0.08;

/** Temps de réflexion considéré comme impulsif / réflexe sur un coup complexe (ms) */
export const ZARE_IMPULSIVE_REACTION_MS = 3500;

/** Seuil de malchance sur un jet (bad beat) déclenchant un risque de tilt */
export const ZARE_BAD_BEAT_LUCK_THRESHOLD = -0.10;

/**
 * Calcule la dissociation de Douglas Zare entre la qualité de la décision (Skill)
 * et la variance aléatoire du lancer de dés (Luck).
 */
export function computeZareLuckVsSkill(params: {
  equityLoss: number;
  dice?: [number, number] | null;
  luckDelta?: number;
  bestMoveNotation?: string;
}): ZareLuckVsSkillBreakdown {
  const normalizedLoss = Math.max(0, Number.isFinite(params.equityLoss) ? params.equityLoss : 0);
  const skillDeltaEquity = Number((-normalizedLoss).toFixed(3));
  const luckDeltaEquity = Number(
    (Number.isFinite(params.luckDelta) ? (params.luckDelta as number) : 0).toFixed(3)
  );
  const totalDeltaEquity = Number((skillDeltaEquity + luckDeltaEquity).toFixed(3));

  const diceLabelFr = params.dice ? `du tirage ${params.dice[0]}-${params.dice[1]}` : 'du tirage des dés';
  const diceLabelEn = params.dice ? `of roll ${params.dice[0]}-${params.dice[1]}` : 'of the dice roll';

  if (normalizedLoss < 0.015) {
    return {
      skillDeltaEquity,
      luckDeltaEquity,
      totalDeltaEquity,
      summaryFr:
        `Dissociation de Zare : votre décision est chirurgicale (ΔSkill ${skillDeltaEquity.toFixed(3)} Eq). ` +
        `L'issue dépend uniquement de la variance ${diceLabelFr}, pas de votre technique.`,
      summaryEn:
        `Zare dissociation: your decision is surgical (ΔSkill ${skillDeltaEquity.toFixed(3)} Eq). ` +
        `The outcome depends strictly on the variance ${diceLabelEn}, not on your play.`,
    };
  }

  const moveHintFr = params.bestMoveNotation ? ` au lieu de ${params.bestMoveNotation}` : '';
  const moveHintEn = params.bestMoveNotation ? ` instead of ${params.bestMoveNotation}` : '';

  if (luckDeltaEquity <= ZARE_BAD_BEAT_LUCK_THRESHOLD) {
    return {
      skillDeltaEquity,
      luckDeltaEquity,
      totalDeltaEquity,
      summaryFr:
        `Dissociation de Zare : malgré un tirage défavorable (${luckDeltaEquity.toFixed(3)} Eq de malchance), ` +
        `la décision choisie${moveHintFr} cède ${normalizedLoss.toFixed(3)} Eq supplémentaires (ΔSkill ${skillDeltaEquity.toFixed(3)}). ` +
        `Séparez l'injustice des dés de la rigueur du choix tactique.`,
      summaryEn:
        `Zare dissociation: despite an unlucky roll (${luckDeltaEquity.toFixed(3)} Eq luck), ` +
        `the chosen play${moveHintEn} surrenders an extra ${normalizedLoss.toFixed(3)} Eq (ΔSkill ${skillDeltaEquity.toFixed(3)}). ` +
        `Separate dice variance from tactical execution.`,
    };
  }

  return {
    skillDeltaEquity,
    luckDeltaEquity,
    totalDeltaEquity,
    summaryFr:
      `Dissociation de Zare : indépendamment ${diceLabelFr}, la perte de ${normalizedLoss.toFixed(3)} Eq ` +
      `(ΔSkill ${skillDeltaEquity.toFixed(3)}) provient exclusivement du choix de jeu${moveHintFr}.`,
    summaryEn:
      `Zare dissociation: regardless ${diceLabelEn}, the ${normalizedLoss.toFixed(3)} Eq loss ` +
      `(ΔSkill ${skillDeltaEquity.toFixed(3)}) stems exclusively from the move selection${moveHintEn}.`,
  };
}

/**
 * Évalue l'indice de Tilt selon la formule heuristique de Zare sur une fenêtre glissante
 * des décisions récentes du joueur.
 *
 * Formule :
 *   Score = clamp_0_100(
 *     35 * min(1, avgLoss / 0.10) +
 *     28 * min(1, consecutiveBlunders / 2) +
 *     22 * min(1, fastPlayBlunders / 2) +
 *     15 * min(1, postBadBeatBlunders / 1)
 *   )
 */
export function evaluateZareTiltScore(
  samples: readonly TiltDecisionSample[],
  windowSize = 6
): ZareTiltEvaluation {
  const recent = samples.slice(-Math.max(1, windowSize));

  if (recent.length === 0) {
    return {
      tiltScore: 0,
      tiltLevel: 'calm',
      isTilted: false,
      consecutiveBlunders: 0,
      fastPlayBlunders: 0,
      postBadBeatBlunders: 0,
      recentAverageEquityLoss: 0,
      recommendationFr: 'Lucidité optimale. Continuez à compter vos pips et vos coups directs.',
      recommendationEn: 'Optimal composure. Keep counting pips and direct shots.',
    };
  }

  let consecutiveBlunders = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    const loss = Math.max(0, recent[i]?.equityLoss ?? 0);
    if (loss >= ZARE_SIGNIFICANT_ERROR_THRESHOLD) {
      consecutiveBlunders += 1;
    } else {
      break;
    }
  }

  let fastPlayBlunders = 0;
  let postBadBeatBlunders = 0;
  let totalLoss = 0;

  for (let i = 0; i < recent.length; i++) {
    const sample = recent[i];
    if (!sample) continue;
    const loss = Math.max(0, sample.equityLoss);
    totalLoss += loss;

    const isSignificantError = loss >= ZARE_SIGNIFICANT_ERROR_THRESHOLD;
    if (
      isSignificantError &&
      typeof sample.reactionTimeMs === 'number' &&
      sample.reactionTimeMs > 0 &&
      sample.reactionTimeMs < ZARE_IMPULSIVE_REACTION_MS
    ) {
      fastPlayBlunders += 1;
    }

    const previousLuck = i > 0 ? (recent[i - 1]?.luckDelta ?? 0) : 0;
    const currentLuck = sample.luckDelta ?? 0;
    if (
      isSignificantError &&
      (currentLuck <= ZARE_BAD_BEAT_LUCK_THRESHOLD || previousLuck <= ZARE_BAD_BEAT_LUCK_THRESHOLD)
    ) {
      postBadBeatBlunders += 1;
    }
  }

  const recentAverageEquityLoss = Number((totalLoss / recent.length).toFixed(4));

  const lossComponent = 35 * Math.min(1, recentAverageEquityLoss / 0.10);
  const streakComponent = 28 * Math.min(1, consecutiveBlunders / 2);
  const speedComponent = 22 * Math.min(1, fastPlayBlunders / 2);
  const badBeatComponent = 15 * Math.min(1, postBadBeatBlunders / 1);

  const rawScore = Math.round(lossComponent + streakComponent + speedComponent + badBeatComponent);
  const tiltScore = Math.max(0, Math.min(100, rawScore));

  const tiltLevel: TiltLevel =
    tiltScore >= 60 ? 'tilted' : tiltScore >= 35 ? 'warming' : 'calm';
  const isTilted = tiltLevel === 'tilted';

  let recommendationFr = 'Lucidité stable. Maintenez votre discipline analytique.';
  let recommendationEn = 'Stable composure. Maintain your analytical discipline.';

  if (tiltLevel === 'tilted') {
    recommendationFr =
      'Alerte Tilt (Formule de Zare) : vous enchaînez des erreurs rapides. Prenez 5 secondes, ' +
      'dissociez la malchance des dés de votre stratégie et vérifiez le compte de pips.';
    recommendationEn =
      'Tilt Alert (Zare Formula): you are chaining fast errors. Pause for 5 seconds, ' +
      'separate dice variance from your strategy, and re-check the pip count.';
  } else if (tiltLevel === 'warming') {
    recommendationFr =
      'Vigilance cognitive : ralentissez légèrement la cadence pour comparer le coup pur (Magriel) au coup agressif.';
    recommendationEn =
      'Cognitive caution: slow down slightly to compare the pure play (Magriel) against the aggressive line.';
  }

  return {
    tiltScore,
    tiltLevel,
    isTilted,
    consecutiveBlunders,
    fastPlayBlunders,
    postBadBeatBlunders,
    recentAverageEquityLoss,
    recommendationFr,
    recommendationEn,
  };
}
