/**
 * Constructeurs pédagogiques et synthèse règle-basée pour le Rapport Post-Match.
 * Module 100 % pur (< 300 lignes, 0 any).
 */

import type { CompleteGameAnalysis } from '../../features/rating/types';
import {
    PHASE_LABELS,
    PHASE_LABELS_EN,
    REPORT_EQUITY_THRESHOLDS,
    type AiSynthesis,
    type GamePhaseLabel,
    type MajorBlunder,
    type MatchSummaryPayload,
    type ReportMoveCategory,
} from './postMatchReportTypes';

/** Classifie un coup selon sa perte d'équité (Open Sage / bgsage) et son éventuelle erreur de videau. */
export function classifyMoveByEquityLoss(
    equityLoss: number,
    cubeEquityLoss?: number,
): ReportMoveCategory {
    if (cubeEquityLoss !== undefined && Math.abs(cubeEquityLoss) >= REPORT_EQUITY_THRESHOLDS.CUBE_BLUNDER_MIN) {
        return 'cube_blunder';
    }
    const loss = Math.abs(equityLoss);
    if (loss < REPORT_EQUITY_THRESHOLDS.BEST_MAX) return 'best';
    if (loss < REPORT_EQUITY_THRESHOLDS.INACCURACY_MAX) return 'inaccuracy';
    if (loss <= REPORT_EQUITY_THRESHOLDS.MISTAKE_MAX) return 'mistake';
    return 'blunder';
}

/** Produit le Diagnostic (🎯) et le Concept Clé (💡) propres à un coup en erreur. */
export function buildBlunderPedagogicalNote(
    params: {
        phase: GamePhaseLabel;
        category: ReportMoveCategory;
        playedNotation: string;
        optimalNotation: string;
        equityLoss: number;
        conceptId?: string;
        explanation?: string;
    },
    locale: string = 'fr',
): { diagnostic: string; keyConcept: string } {
    const isEn = locale === 'en';
    const lossStr = params.equityLoss.toFixed(3);

    if (params.category === 'cube_blunder') {
        return {
            diagnostic: isEn
                ? `Cube handling mistake (-${lossStr} Eq): misjudging the doubling window or take point cost significant match equity.`
                : `Erreur de maîtrise du videau (-${lossStr} Eq) : mauvais timing sur le Double/Take qui ampute votre équité de match.`,
            keyConcept: isEn
                ? 'Woolsey’s Law & 25% Take Point: When in doubt on a double, ask whether your opponent has a clear market loser.'
                : 'Loi de Woolsey & Seuil de Take (25 %) : doublez dès que vous menacez de perdre votre marché au prochain tour.',
        };
    }

    switch (params.phase) {
        case 'opening':
            return {
                diagnostic:
                    params.explanation ||
                    (isEn
                        ? `Playing ${params.playedNotation} instead of ${params.optimalNotation} (-${lossStr} Eq) yields key structural points early and leaves uncoordinated builders.`
                        : `Jouer ${params.playedNotation} au lieu de ${params.optimalNotation} (-${lossStr} Eq) cède l’initiative d’ouverture et disperse vos constructeurs (builders).`),
                keyConcept: isEn
                    ? 'Golden Point & Bar Point Priority: Secure the 5-point, 7-point, or advanced anchor before moving passive checkers.'
                    : 'Priorité Point d’Or (5) & Point de Barre (7) : sécurisez les cases clés ou l’ancre avancée dès l’ouverture.',
            };
        case 'race':
            return {
                diagnostic:
                    params.explanation ||
                    (isEn
                        ? `In a pure race, ${params.playedNotation} wastes crossover efficiency compared to ${params.optimalNotation} (-${lossStr} Eq).`
                        : `En course pure, ${params.playedNotation} gaspille des crossovers précieux face à ${params.optimalNotation} (-${lossStr} Eq) par sécurité excessive.`),
                keyConcept: isEn
                    ? 'Crossover Efficiency: Minimize crossovers and bring rear checkers home smoothly to prepare bear-off.'
                    : 'Efficacité des Crossovers : réduisez le nombre de quadrants à traverser et lissez votre distribution avant le bear-off.',
            };
        case 'bearoff':
            return {
                diagnostic:
                    params.explanation ||
                    (isEn
                        ? `${params.playedNotation} (-${lossStr} Eq) creates a ragged bear-off structure or leaves unnecessary direct shots compared to ${params.optimalNotation}.`
                        : `${params.playedNotation} (-${lossStr} Eq) dégrade la souplesse de sortie ou expose un blot inutile par rapport à ${params.optimalNotation}.`),
                keyConcept: isEn
                    ? 'Rule of 6 in Bear-Off: Take off checkers when safe, fill gaps to avoid future forced blots.'
                    : 'La Règle du 6 en sortie : sortez le maximum de pions sans laisser de trou critique sur les flèches hautes (5 et 6).',
            };
        default:
            return {
                diagnostic:
                    params.explanation ||
                    (isEn
                        ? `Playing ${params.playedNotation} (-${lossStr} Eq) breaks prime cohesion or exposes a blot to direct return shots instead of ${params.optimalNotation}.`
                        : `Jouer ${params.playedNotation} (-${lossStr} Eq) affaiblit votre prime, lâche une ancre ou expose un blot direct au lieu de ${params.optimalNotation}.`),
                keyConcept: isEn
                    ? 'Prime Cohesion & Anchor Discipline: Never break an anchor or prime without a decisive racing or attacking compensation.'
                    : 'Conserver son ancre & sa prime : ne brisez jamais une structure défensive sans compensation tactique majeure.',
            };
    }
}

/** Répartition des erreurs par phase de jeu. */
export function countBlundersByPhase(
    blunders: ReadonlyArray<MajorBlunder>,
): Record<GamePhaseLabel, number> {
    const counts: Record<GamePhaseLabel, number> = {
        opening: 0,
        contact: 0,
        race: 0,
        bearoff: 0,
        unknown: 0,
    };
    for (const b of blunders) counts[b.phase] += 1;
    return counts;
}

/** Identifie les thèmes stratégiques récurrents à partir des erreurs de la partie. */
export function identifyRecurringThemes(
    blunders: ReadonlyArray<MajorBlunder>,
    analysis?: CompleteGameAnalysis | null,
    locale: string = 'fr',
): string[] {
    const isEn = locale === 'en';
    const themes: string[] = [];
    const phases = countBlundersByPhase(blunders);

    if (phases.race > 0 || phases.bearoff > 0) {
        themes.push(isEn ? 'Overly cautious play in race / bear-off' : 'Sécurité excessive en course');
    }
    if (phases.opening > 0) {
        themes.push(isEn ? 'Overly aggressive or uncoordinated opening' : 'Ouverture trop agressive');
    }
    if (
        blunders.some((b) => b.category === 'cube_blunder') ||
        (analysis?.cubeEquityLoss !== undefined && Math.abs(analysis.cubeEquityLoss) >= 0.02)
    ) {
        themes.push(isEn ? 'Late or inaccurate cube handling' : 'Gestion du videau tardive');
    }
    if (phases.contact > 0) {
        themes.push(
            isEn ? 'Blot exposure & prime breaking in contact' : 'Exposition de blots & gestion des primes en contact',
        );
    }
    if (themes.length === 0) {
        themes.push(isEn ? 'High positional discipline' : 'Discipline positionnelle solide');
    }
    return themes;
}

/** Repli local règle-basé : génère un diagnostic déterministe complet (incluant les 3 volets 🎯/💡/🚀). */
export function buildRuleBasedSynthesis(payload: MatchSummaryPayload, locale: string = 'fr'): AiSynthesis {
    const isEn = locale === 'en';
    const { counters, blunders, phaseBreakdown, performanceRating } = payload;
    const total = counters.optimal + counters.good + counters.inaccuracy + counters.blunder;

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const trainingPlan: string[] = [];

    if (total > 0 && counters.optimal / total >= 0.5) {
        strengths.push(
            isEn
                ? `More than half of your decisions were optimal (${counters.optimal}/${total}).`
                : `Plus de la moitié de vos décisions sont optimales (${counters.optimal}/${total}).`,
        );
    }
    if (performanceRating > 0 && performanceRating <= 5) {
        strengths.push(
            isEn
                ? `Your PR of ${performanceRating.toFixed(2)} places you at Master level.`
                : `Votre PR de ${performanceRating.toFixed(2)} vous place au niveau Maître.`,
        );
    }
    if (blunders.length === 0) {
        strengths.push(
            isEn
                ? 'No major blunder (ΔEq > 0.020) detected in this game.'
                : 'Aucune erreur majeure (ΔEq > 0.020) détectée sur cette partie.',
        );
    }
    if (strengths.length === 0) {
        strengths.push(
            isEn
                ? 'You completed the game with determination: every match fuels your progress.'
                : 'Vous avez mené la partie jusqu’au bout : chaque manche est une progression.',
        );
    }

    if (counters.blunder > 0) {
        weaknesses.push(
            isEn
                ? `${counters.blunder} major blunder${counters.blunder > 1 ? 's' : ''} cost ${payload.totalEquityLoss.toFixed(3)} equity.`
                : `${counters.blunder} blunder${counters.blunder > 1 ? 's' : ''} majeur${counters.blunder > 1 ? 's' : ''} ${counters.blunder > 1 ? 'ont' : 'a'} coûté ${payload.totalEquityLoss.toFixed(3)} d’équité.`,
        );
    }
    if (counters.inaccuracy > 0) {
        weaknesses.push(
            isEn
                ? `${counters.inaccuracy} inaccurac${counters.inaccuracy > 1 ? 'ies' : 'y'}: playable but suboptimal moves.`
                : `${counters.inaccuracy} imprécision${counters.inaccuracy > 1 ? 's' : ''} : des coups jouables mais sous-optimaux.`,
        );
    }
    const worstPhase = (Object.entries(phaseBreakdown) as Array<[GamePhaseLabel, number]>)
        .filter(([phase]) => phase !== 'unknown')
        .sort((a, b) => b[1] - a[1])[0];
    if (worstPhase && worstPhase[1] > 0) {
        weaknesses.push(
            isEn
                ? `The "${PHASE_LABELS_EN[worstPhase[0]]}" phase concentrated ${worstPhase[1]} error${worstPhase[1] > 1 ? 's' : ''}.`
                : `La phase « ${PHASE_LABELS[worstPhase[0]]} » concentre ${worstPhase[1]} erreur${worstPhase[1] > 1 ? 's' : ''}.`,
        );
    }
    if (weaknesses.length === 0) {
        weaknesses.push(
            isEn
                ? 'No recurring weakness stood out: keep varying your positions.'
                : 'Aucune faiblesse récurrente marquante : continuez à varier vos positions.',
        );
    }

    if (counters.blunder > 0) {
        trainingPlan.push(
            isEn
                ? 'Practice the "Blunders" Drills to lock in blot safety and prime discipline.'
                : 'Travaillez les Drills « Blunders » pour ancrer les réflexes de sécurité.',
        );
    }
    if (worstPhase && worstPhase[1] > 0) {
        trainingPlan.push(
            isEn
                ? `Focus on the "${PHASE_LABELS_EN[worstPhase[0]]}" phase with targeted exercises.`
                : `Concentrez-vous sur la phase « ${PHASE_LABELS[worstPhase[0]]} » avec des exercices ciblés.`,
        );
    }
    if (counters.inaccuracy > 0 && trainingPlan.length < 2) {
        trainingPlan.push(
            isEn
                ? 'Compare your candidate move against the Coach Top 3 before confirming.'
                : 'Comparez systématiquement votre coup au Top 3 du Coach avant de valider.',
        );
    }
    if (trainingPlan.length === 0) {
        trainingPlan.push(
            isEn
                ? 'Keep your pace: 10 minutes of daily tactical puzzles will sharpen your precision.'
                : 'Maintenez votre rythme : 10 minutes de puzzles par jour suffisent.',
        );
    }

    const topBlunder = blunders[0];
    let diagnostic: string;
    let keyConcept: { title: string; explanation: string };

    if (topBlunder) {
        const note = buildBlunderPedagogicalNote(
            {
                phase: topBlunder.phase,
                category: topBlunder.category ?? classifyMoveByEquityLoss(topBlunder.equityLoss),
                playedNotation: topBlunder.playedNotation,
                optimalNotation: topBlunder.optimalNotation,
                equityLoss: topBlunder.equityLoss,
            },
            locale,
        );
        diagnostic = note.diagnostic;
        const [conceptTitle, ...rest] = note.keyConcept.split(':');
        keyConcept = {
            title: conceptTitle.trim(),
            explanation: rest.join(':').trim() || note.keyConcept,
        };
    } else {
        diagnostic = isEn
            ? 'Your checker play remained disciplined with no severe equity loss or exposed blot.'
            : 'Votre jeu de pions est resté rigoureux sans perte d’équité sévère ni exposition de blot critique.';
        keyConcept = {
            title: isEn ? 'Maintaining the Initiative' : 'Conservation de l’initiative',
            explanation: isEn
                ? 'Combine solid inner-board points with timely doubling cube pressure.'
                : 'Combinez la construction de flèches intérieures avec une pression constante au videau.',
        };
    }

    return {
        title: isEn ? 'Grandmaster Match Review' : 'Diagnostic du Grand-Maître',
        summary: `PR ${performanceRating.toFixed(2)} — ${payload.prCategory}.`,
        diagnostic,
        keyConcept,
        strengths,
        weaknesses,
        trainingPlan,
        recurringThemes: payload.recurringThemes ?? [],
    };
}
