/**
 * Analyseur de Style de Jeu Contextuel (Contextual Playstyle Profiler) — Parité Backgammon Galaxy / XG.
 *
 * Évalue les décisions d'une partie complète (`CompleteGameAnalysis`) pour déterminer :
 * - L'archétype de style de jeu du joueur (`PlaystyleArchetype`)
 * - L'indice d'agressivité / prise de risque (`aggressionIndex`, 0-100)
 * - La solidité positionnelle (`positionalSolidness`, 0-100)
 * - La précision en course pure et sortie (`racingAccuracy`, 0-100)
 * - La faiblesse tactique récurrente prioritaire (`primaryWeakness`)
 * - Les concepts recommandés pour le mode Blunder Training (`recommendedDrillFocus`)
 *
 * Supporte la matrice multilingue internationale (`en`, `fr`, `es`, `de`, `ja`).
 */

import type { CompleteGameAnalysis, EvaluatedTurn } from '../rating/types';

export type PlaystyleLocale = 'en' | 'fr' | 'es' | 'de' | 'ja';

export type PlaystyleArchetype =
    | 'aggressive_blitzer'
    | 'conservative_builder'
    | 'tactical_priming'
    | 'racing_specialist'
    | 'balanced_all_rounder';

export interface PlaystyleProfile {
    archetype: PlaystyleArchetype;
    archetypeLabel: string;
    aggressionIndex: number; // 0 (ultra-prudent) à 100 (ultra-agressif)
    positionalSolidness: number; // 0 à 100
    racingAccuracy: number; // 0 à 100
    primaryWeakness: string;
    playstyleSummary: string;
    recommendedDrillFocus: string[];
}

const ARCHETYPE_LABELS: Record<PlaystyleLocale, Record<PlaystyleArchetype, string>> = {
    en: {
        aggressive_blitzer: 'Aggressive Blitzer',
        conservative_builder: 'Conservative Builder',
        tactical_priming: 'Tactical Priming Architect',
        racing_specialist: 'Pure Race Specialist',
        balanced_all_rounder: 'Balanced All-Rounder',
    },
    fr: {
        aggressive_blitzer: 'Attaquant Blitz Agressif',
        conservative_builder: 'Bâtisseur Conservateur',
        tactical_priming: 'Architecte de Prime Tactique',
        racing_specialist: 'Spécialiste de la Course',
        balanced_all_rounder: 'Polyvalent Équilibré',
    },
    es: {
        aggressive_blitzer: 'Atacante Blitz Agresivo',
        conservative_builder: 'Constructor Conservador',
        tactical_priming: 'Arquitecto de Primes Táctico',
        racing_specialist: 'Especialista en Carrera',
        balanced_all_rounder: 'Polivalente Equilibrado',
    },
    de: {
        aggressive_blitzer: 'Aggressiver Blitz-Angreifer',
        conservative_builder: 'Konservativer Aufbauer',
        tactical_priming: 'Taktischer Prime-Architekt',
        racing_specialist: 'Renn-Spezialist',
        balanced_all_rounder: 'Ausgewogener Allrounder',
    },
    ja: {
        aggressive_blitzer: 'アグレッシブ・ブリッツァー',
        conservative_builder: '堅実なビルダー',
        tactical_priming: 'プライム構築の戦術家',
        racing_specialist: 'レーシング・スペシャリスト',
        balanced_all_rounder: 'バランス型オールラウンダー',
    },
};

const WEAKNESS_MESSAGES: Record<
    PlaystyleLocale,
    Record<'blot_exposure' | 'missed_key_points' | 'prime_handling' | 'racing_leaks' | 'none', string>
> = {
    en: {
        blot_exposure: 'Leaving vulnerable blots with high direct shot exposure when opponent holds a strong home board.',
        missed_key_points: 'Missing opportunities to secure key structural points (Golden 5-point and Bar 7-point).',
        prime_handling: 'Prematurely breaking or failing to extend consecutive primes against trapped rear checkers.',
        racing_leaks: 'Suboptimal contact-breaking and checker wastage during pure race and bear-off transitions.',
        none: 'No critical recurring weakness detected; maintain discipline on close cube and contact decisions.',
    },
    fr: {
        blot_exposure: 'Exposition excessive de blots aux tirs directs face à un jan intérieur adverse solide.',
        missed_key_points: 'Opportunités manquées de verrouiller les points clés (Golden Point 5 et Bar Point 7).',
        prime_handling: 'Rupture prématurée ou non-extension des primes face aux pions arrières adverses piégés.',
        racing_leaks: 'Rupture de contact tardive et gaspillage de pips lors de la course et du bear-off.',
        none: 'Aucune faiblesse récurrente majeure détectée ; maintenez votre rigueur sur les décisions serrées.',
    },
    es: {
        blot_exposure: 'Exposición excesiva de blots a tiros directos frente a un tablero interior rival fuerte.',
        missed_key_points: 'Oportunidades perdidas para asegurar puntos clave (Punto 5 Dorado y Punto 7 de Barra).',
        prime_handling: 'Ruptura prematura o falta de extensión de primes contra fichas rivales atrapadas.',
        racing_leaks: 'Ruptura de contacto subóptima y desperdicio de pips en la carrera y el bear-off.',
        none: 'Sin debilidades recurrentes críticas; mantén la precisión en decisiones ajustadas.',
    },
    de: {
        blot_exposure: 'Zu viele ungedeckte Steine (Blots) mit direkten Trefferchancen gegen ein starkes Heimfeld.',
        missed_key_points: 'Verpasste Gelegenheiten, Schlüsselpunkte (5er Golden Point und 7er Bar Point) zu sichern.',
        prime_handling: 'Vorzeitiges Auflösen oder Nichterweitern von Primes gegen eingeschlossene gegnerische Steine.',
        racing_leaks: 'Suboptimales Kontaktauflösen und Pip-Verlust im reinen Laufspiel und Bear-off.',
        none: 'Keine kritische wiederkehrende Schwäche erkannt; halte die Disziplin bei knappen Entscheidungen.',
    },
    ja: {
        blot_exposure: '相手のインナーボードが強力な状況で、直接ショットを許すブロットを晒しすぎています。',
        missed_key_points: '重要ポイント（5ポイント・ゴールデンポイントや7ポイント・バーポイント）の確保を逃しています。',
        prime_handling: '相手のバックマンを閉じ込めている際のプライム維持・伸長に課題があります。',
        racing_leaks: '純粋なレースおよびベアオフ移行時のコンタクト解消とピップ効率に改善の余地があります。',
        none: '重大な弱点は検出されませんでした。接戦での精密な判断を維持しましょう。',
    },
};

function isPositionalConcept(conceptId?: string): boolean {
    return (
        conceptId === 'golden-point' ||
        conceptId === 'bar-point' ||
        conceptId === 'prime-vs-prime' ||
        conceptId === 'advanced-anchor' ||
        conceptId === 'holding-game' ||
        conceptId === 'pure-play'
    );
}

function isSafetyOrBlotConcept(conceptId?: string): boolean {
    return conceptId === 'duplication' || conceptId === 'blitz-attack' || conceptId === 'tempo-hit';
}

function isRacingConcept(conceptId?: string): boolean {
    return conceptId === 'running-game' || conceptId === 'trice-epc';
}

/**
 * Calcule le profil de style de jeu complet d'un joueur à partir de son analyse de partie.
 */
export function analyzePlaystyle(
    analysis: CompleteGameAnalysis,
    locale: PlaystyleLocale = 'fr',
): PlaystyleProfile {
    const lang: PlaystyleLocale = ARCHETYPE_LABELS[locale] ? locale : 'en';
    const moves: EvaluatedTurn[] = analysis.evaluatedMoves || [];
    const unforced = moves.filter((m) => m.isUnforced);

    let blotMistakes = 0;
    let keyPointMistakes = 0;
    let primeMistakes = 0;
    let racingMistakes = 0;
    let positionalLoss = 0;
    let racingLoss = 0;
    let hitMovesCount = 0;

    for (const m of unforced) {
        if (m.playedNotation.includes('*')) {
            hitMovesCount += 1;
        }
        const isMistake = m.verdict === 'doubtful' || m.verdict === 'blunder' || m.verdict === 'howler';
        const loss = Math.abs(m.equityLoss);

        if (isMistake) {
            if (isSafetyOrBlotConcept(m.conceptId)) {
                blotMistakes += 1;
                positionalLoss += loss;
            } else if (m.conceptId === 'golden-point' || m.conceptId === 'bar-point') {
                keyPointMistakes += 1;
                positionalLoss += loss;
            } else if (m.conceptId === 'prime-vs-prime') {
                primeMistakes += 1;
                positionalLoss += loss;
            } else if (isRacingConcept(m.conceptId)) {
                racingMistakes += 1;
                racingLoss += loss;
            } else if (isPositionalConcept(m.conceptId)) {
                keyPointMistakes += 1;
                positionalLoss += loss;
            } else {
                positionalLoss += loss * 0.5;
            }
        }
    }

    const totalUnforced = Math.max(1, unforced.length);
    const hitRatio = hitMovesCount / totalUnforced;
    const blotRiskRatio = blotMistakes / totalUnforced;

    // Indice d'agressivité (0-100) : basé sur la fréquence de frappe et l'exposition aux tirs
    const rawAggression = 45 + hitRatio * 110 + blotRiskRatio * 90 - (keyPointMistakes / totalUnforced) * 20;
    const aggressionIndex = Math.round(Math.max(10, Math.min(98, rawAggression)));

    // Solidité positionnelle (0-100)
    const avgPositionalLoss = positionalLoss / totalUnforced;
    const positionalSolidness = Math.round(Math.max(15, Math.min(100, 100 - avgPositionalLoss * 750)));

    // Précision à la course (0-100)
    const avgRacingLoss = racingLoss / totalUnforced;
    const racingAccuracy = Math.round(Math.max(20, Math.min(100, 100 - avgRacingLoss * 900)));

    // Détermination de l'archétype dominant
    let archetype: PlaystyleArchetype = 'balanced_all_rounder';
    if (aggressionIndex >= 68 || blotMistakes >= 2) {
        archetype = 'aggressive_blitzer';
    } else if (aggressionIndex <= 38 && positionalSolidness >= 75) {
        archetype = 'conservative_builder';
    } else if (positionalSolidness >= 82 && racingAccuracy < positionalSolidness) {
        archetype = 'tactical_priming';
    } else if (racingAccuracy >= 88 && racingMistakes === 0 && totalUnforced >= 4) {
        archetype = 'racing_specialist';
    }

    // Détermination de la faiblesse principale
    let weaknessKey: 'blot_exposure' | 'missed_key_points' | 'prime_handling' | 'racing_leaks' | 'none' = 'none';
    const recommendedDrillFocus: string[] = [];

    if (blotMistakes > 0 && blotMistakes >= keyPointMistakes && blotMistakes >= racingMistakes) {
        weaknessKey = 'blot_exposure';
        recommendedDrillFocus.push('duplication', 'blitz-attack');
    } else if (primeMistakes > 0 && primeMistakes >= keyPointMistakes) {
        weaknessKey = 'prime_handling';
        recommendedDrillFocus.push('prime-vs-prime', 'holding-game');
    } else if (keyPointMistakes > 0 && keyPointMistakes >= racingMistakes) {
        weaknessKey = 'missed_key_points';
        recommendedDrillFocus.push('golden-point', 'bar-point');
    } else if (racingMistakes > 0) {
        weaknessKey = 'racing_leaks';
        recommendedDrillFocus.push('running-game', 'trice-epc');
    } else {
        recommendedDrillFocus.push('pure-play', 'kazaross-xg-met');
    }

    const archetypeLabel = ARCHETYPE_LABELS[lang][archetype];
    const primaryWeakness = WEAKNESS_MESSAGES[lang][weaknessKey];

    const playstyleSummary =
        lang === 'fr'
            ? `Style ${archetypeLabel} (Agressivité ${aggressionIndex}/100, Solidité positionnelle ${positionalSolidness}/100, Course ${racingAccuracy}/100).`
            : lang === 'es'
              ? `Estilo ${archetypeLabel} (Agresividad ${aggressionIndex}/100, Solidez posicional ${positionalSolidness}/100, Carrera ${racingAccuracy}/100).`
              : lang === 'de'
                ? `Spielstil ${archetypeLabel} (Aggressivität ${aggressionIndex}/100, Positionsstärke ${positionalSolidness}/100, Rennen ${racingAccuracy}/100).`
                : lang === 'ja'
                  ? `プレイスタイル: ${archetypeLabel} (攻撃性 ${aggressionIndex}/100, ポジション堅牢度 ${positionalSolidness}/100, レース精度 ${racingAccuracy}/100)。`
                  : `${archetypeLabel} style (Aggression ${aggressionIndex}/100, Positional Solidness ${positionalSolidness}/100, Racing ${racingAccuracy}/100).`;

    return {
        archetype,
        archetypeLabel,
        aggressionIndex,
        positionalSolidness,
        racingAccuracy,
        primaryWeakness,
        playstyleSummary,
        recommendedDrillFocus,
    };
}
