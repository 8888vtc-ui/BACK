/**
 * Prompts et contrats pour le « Cours explicatif & Rapport Grandmaster » de fin de partie (Gemini).
 *
 * Rôle :
 *   Génère un cours pédagogique et un rapport de match structuré en 3 volets :
 *     - 🎯 Le Diagnostic (`diagnostic`) : pourquoi les erreurs clés ont coûté cher
 *     - 💡 Le Concept Clé (`keyConcept`) : la règle stratégique à retenir
 *     - 🚀 Plan d'entraînement personnalisé (`trainingPlan`) : 1 ou 2 axes prioritaires
 *   à partir du score final, de la durée du match, du PR joueur/adversaire,
 *   des 2 ou 3 pires Blunders (XGID, dés, coup joué, meilleur coup, ΔEq) et des thèmes récurrents.
 */

import type { CompleteGameAnalysis, EvaluatedTurn } from '../rating/types';
import { analyzePlaystyle, type PlaystyleProfile, type PlaystyleLocale } from './playstyleProfiler';
import {
    buildMatchSummaryPayload,
    buildRuleBasedSynthesis,
    extractMajorBlunders,
    identifyRecurringThemes,
    type MatchSummaryPayload,
} from '../../components/summary/postMatchReportHelpers';

export interface GameReviewCourseParams {
    /** Résumé de la partie analysée */
    analysis: CompleteGameAnalysis;
    /** PR de l'adversaire (optionnel) */
    opponentPr?: number | null;
    /** Durée du match en secondes (optionnel) */
    matchDurationSeconds?: number;
    /** Langue de sortie */
    language?: PlaystyleLocale;
}

export interface GameReviewCourseData {
    title: string;
    summary: string;
    /** 🎯 Le Diagnostic : pourquoi les erreurs clés ont coûté cher (perte de gammon, bris de prime, blot). */
    diagnostic?: string;
    /** 💡 Le Concept Clé : la règle stratégique à retenir. */
    keyConcept?: {
        title: string;
        explanation: string;
    };
    /** 🚀 Plan d'entraînement personnalisé : 1 ou 2 axes prioritaires pour la prochaine partie. */
    trainingPlan?: string[];
    /** Thèmes récurrents identifiés sur la partie. */
    recurringThemes?: string[];
    strengths: string[];
    weaknesses: string[];
    lessons: { concept: string; advice: string }[];
    nextSteps: string[];
    playstyleProfile?: PlaystyleProfile;
}

/**
 * Prompt système guidant Gemini dans la rédaction du rapport global de fin de match.
 */
export const GAME_REVIEW_SYSTEM_PROMPT = `Tu es un Grand-Maître de Backgammon pédagogue et bienveillant. Ta mission : transformer le bilan d'une partie complète en un rapport d'analyse post-partie structuré en 3 volets (Diagnostic, Concept Clé, Plan d'entraînement) clair, motivant et actionnable.

### RÈGLES ANTI-HALLUCINATION STRICTES :
1. Ne JAMAIS inventer de coups, de positions XGID, de scores ou de concepts absents des données fournies.
2. T'appuyer STRICTEMENT sur les métriques fournies (score, durée, PR joueur et adversaire, Top Blunders avec XGID/dés/ΔEq, thèmes récurrents).
3. Si une donnée est absente, NE PAS la supposer.

### TON DU RAPPORT :
- Encourageant mais rigoureux : célèbre les forces, explique chirurgicalement pourquoi les pires gaffes ont coûté cher (perte de gammon, bris de prime, exposition d'un blot).
- Concret : énonce une règle stratégique mémorable (ex: "La règle du 6 en sortie", "Conserver son ancre", "Loi de Woolsey").

### FORMAT DE RÉPONSE OBLIGATOIRE (JSON STRICT) :
Ta réponse DOIT être un objet JSON valide, sans texte ou balise markdown avant ou après.
Schéma JSON :
{
  "title": "Titre accrocheur du rapport (max 8 mots).",
  "summary": "Bilan global en 2 phrases (max 40 mots).",
  "diagnostic": "🎯 Le Diagnostic : explication précise de pourquoi les 2-3 pires blunders ont coûté cher (2 phrases).",
  "keyConcept": {
    "title": "💡 Nom du Concept Clé (ex: Conserver son ancre / La règle du 6 en sortie)",
    "explanation": "La règle stratégique concrète à retenir et appliquer (1 à 2 phrases)."
  },
  "trainingPlan": [
    "🚀 Axe prioritaire 1 pour la prochaine partie.",
    "🚀 Axe prioritaire 2 pour la prochaine partie."
  ],
  "strengths": ["2 à 3 points forts observés dans la partie."],
  "weaknesses": ["2 à 3 axes de progression identifiés."],
  "lessons": [
    { "concept": "Nom du concept stratégique (3-5 mots).", "advice": "Règle d'or actionnable (1 phrase)." }
  ],
  "nextSteps": ["2 à 3 exercices ou habitudes concrets à travailler."]
}`;

export const GAME_REVIEW_SYSTEM_PROMPT_EN = `You are a pedagogical, encouraging Backgammon Grandmaster. Your mission: turn a full game summary into a structured 3-part post-match review report (Diagnostic, Key Concept, Training Plan).

### STRICT ANTI-HALLUCINATION RULES:
1. NEVER invent moves, XGIDs, scores, or concepts absent from the provided data.
2. Rely STRICTLY on the provided metrics (final score, match duration, player & opponent PR, Top Blunders with XGID/dice/ΔEq, recurring themes).
3. If a fact is absent, DO NOT ASSUME IT.

### MANDATORY RESPONSE FORMAT (STRICT JSON):
Your response MUST be a valid JSON object, without surrounding markdown.
JSON Schema:
{
  "title": "Catchy lesson title (max 8 words).",
  "summary": "Overall assessment in 2 sentences (max 40 words).",
  "diagnostic": "🎯 The Diagnostic: why the top blunders were costly (gammon loss, broken prime, exposed blot).",
  "keyConcept": {
    "title": "💡 Key Concept Name (e.g. Holding the Anchor / Rule of 6 in Bear-Off)",
    "explanation": "The strategic rule to remember and apply (1-2 sentences)."
  },
  "trainingPlan": [
    "🚀 Priority training focus 1 for the next match.",
    "🚀 Priority training focus 2 for the next match."
  ],
  "strengths": ["2 to 3 observed strengths."],
  "weaknesses": ["2 to 3 identified improvement areas."],
  "lessons": [
    { "concept": "Strategic concept name (3-5 words).", "advice": "Actionable golden rule (1 sentence)." }
  ],
  "nextSteps": ["2 to 3 concrete drills or habits to work on."]
}`;

export function getGameReviewSystemPrompt(language: PlaystyleLocale = 'fr'): string {
    return language === 'fr' ? GAME_REVIEW_SYSTEM_PROMPT : GAME_REVIEW_SYSTEM_PROMPT_EN;
}

/**
 * Agrège les concepts dominants d'une partie à partir des coups évalués.
 */
function collectDominantConcepts(evaluatedMoves: EvaluatedTurn[]): string[] {
    const counts = new Map<string, number>();
    for (const m of evaluatedMoves) {
        if (!m.conceptId) continue;
        counts.set(m.conceptId, (counts.get(m.conceptId) ?? 0) + 1);
    }
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([concept, count]) => `${concept} (x${count})`);
}

/**
 * Formate une durée en secondes sous forme lisible (ex: "6m 30s").
 */
export function formatMatchDuration(seconds: number): string {
    const safeSec = Math.max(10, Math.round(seconds));
    const mins = Math.floor(safeSec / 60);
    const rem = safeSec % 60;
    return mins > 0 ? `${mins}m ${rem}s` : `${rem}s`;
}

/**
 * Construit le prompt utilisateur Gemini à partir du résumé de partie complet :
 *   - Score final et durée du match
 *   - Performance Rating (PR) globale du joueur et de l'adversaire
 *   - Liste des 2 ou 3 pires Blunders (position XGID, dés, coup joué, meilleur coup, perte d'équité)
 *   - Thèmes récurrents identifiés
 */
export function buildGameReviewUserPrompt(params: GameReviewCourseParams): string {
    const { analysis, opponentPr = null, matchDurationSeconds, language = 'fr' } = params;
    const isEn = language === 'en';

    const breakdown = analysis.breakdown;
    const concepts = collectDominantConcepts(analysis.evaluatedMoves);
    const topBlunders = extractMajorBlunders(analysis.evaluatedMoves, analysis.player, 3);
    const recurringThemes = identifyRecurringThemes(topBlunders, analysis, language);
    const estimatedDuration = formatMatchDuration(
        matchDurationSeconds ?? Math.max(60, (analysis.totalMovesCount || 20) * 18),
    );

    const lines: string[] = [];

    lines.push(
        isEn
            ? 'Here is the summary of a completed backgammon match. Write a pedagogical 3-part Grandmaster review based strictly on these data.'
            : "Voici le bilan d'une partie de backgammon terminée. Rédige un cours et diagnostic pédagogique en 3 volets basé strictement sur ces données.",
    );
    lines.push('');

    lines.push(isEn ? '### GAME SUMMARY' : '### BILAN DE LA PARTIE');
    lines.push(
        isEn
            ? `- Final score: ${analysis.scoreX} - ${analysis.scoreO} (Match length: ${analysis.matchLength || 'Money Game'}) | Duration: ${estimatedDuration}`
            : `- Score final : ${analysis.scoreX} - ${analysis.scoreO} (Match en ${analysis.matchLength || 'Money Game'}) | Durée : ${estimatedDuration}`,
    );
    lines.push(
        isEn
            ? `- Player Performance Rating (PR): ${analysis.performanceRating.toFixed(2)} (category: ${analysis.prCategory})`
            : `- Performance Rating (PR) Joueur : ${analysis.performanceRating.toFixed(2)} (catégorie : ${analysis.prCategory})`,
    );
    if (opponentPr !== null && opponentPr !== undefined) {
        lines.push(
            isEn
                ? `- Opponent Performance Rating (PR): ${opponentPr.toFixed(2)}`
                : `- Performance Rating (PR) Adversaire : ${opponentPr.toFixed(2)}`,
        );
    }
    lines.push(
        isEn
            ? `- Error rate: ${analysis.errorRate.toFixed(3)} per unforced decision`
            : `- Taux d'erreur : ${analysis.errorRate.toFixed(3)} par décision non forcée`,
    );
    lines.push(
        isEn
            ? `- Total equity loss: ${analysis.totalEquityLoss.toFixed(3)}`
            : `- Perte d'équité totale : ${analysis.totalEquityLoss.toFixed(3)}`,
    );
    lines.push(
        isEn
            ? `- Decisions: ${analysis.decisionsCount} (${analysis.unforcedDecisionsCount} unforced)`
            : `- Décisions : ${analysis.decisionsCount} (${analysis.unforcedDecisionsCount} non forcées)`,
    );
    lines.push(
        isEn
            ? `- Winner: ${analysis.winner ?? 'unknown'} (${analysis.winType ?? 'n/a'})`
            : `- Vainqueur : ${analysis.winner ?? 'inconnu'} (${analysis.winType ?? 'n/a'})`,
    );
    lines.push('');

    lines.push(isEn ? '### MOVE BREAKDOWN' : '### VENTILATION DES COUPS');
    lines.push(
        isEn
            ? `- Optimal: ${breakdown.optimal} | Acceptable: ${breakdown.acceptable} | Doubtful: ${breakdown.doubtful} | Blunder: ${breakdown.blunder} | Howler: ${breakdown.howler}`
            : `- Optimal : ${breakdown.optimal} | Acceptable : ${breakdown.acceptable} | Douteux : ${breakdown.doubtful} | Blunder : ${breakdown.blunder} | Howler : ${breakdown.howler}`,
    );
    lines.push('');

    if (topBlunders.length > 0) {
        lines.push(
            isEn
                ? '### TOP 3 WORST BLUNDERS (XGID, DICE, PLAYED, OPTIMAL, EQUITY LOSS)'
                : '### TOP 3 PIRES BLUNDERS (XGID, DÉS, COUP JOUÉ, MEILLEUR COUP, PERTE D’ÉQUITÉ)',
        );
        topBlunders.forEach((b, idx) => {
            lines.push(
                `${idx + 1}. Turn #${b.turnNumber} | XGID=${b.xgid} | Dice [${b.dice[0]}-${b.dice[1]}] | Played: ${b.playedNotation} | Best: ${b.optimalNotation} | Loss: -${b.equityLoss.toFixed(3)} Eq (${b.phase})`,
            );
        });
        lines.push('');
    }

    if (recurringThemes.length > 0) {
        lines.push(isEn ? '### RECURRING THEMES' : '### THÈMES RÉCURRENTS IDENTIFIÉS');
        lines.push(recurringThemes.map((t) => `- ${t}`).join('\n'));
        lines.push('');
    }

    if (concepts.length > 0) {
        lines.push(isEn ? '### DOMINANT CONCEPTS' : '### CONCEPTS DOMINANTS');
        lines.push(concepts.join(', '));
        lines.push('');
    }

    const playstyle = analyzePlaystyle(analysis, language);
    lines.push(isEn ? '### PLAYSTYLE PROFILE' : '### PROFIL DE STYLE DE JEU');
    lines.push(`- ${playstyle.playstyleSummary}`);
    lines.push(
        isEn
            ? `- Primary weakness: ${playstyle.primaryWeakness}`
            : `- Faiblesse prioritaire : ${playstyle.primaryWeakness}`,
    );
    lines.push('');

    lines.push(
        isEn
            ? 'Write the lesson in the strict JSON format specified in the system prompt.'
            : 'Rédige le cours au format JSON strict spécifié dans le prompt système.',
    );

    return lines.join('\n');
}

/**
 * Construit le prompt utilisateur Gemini directement depuis un `MatchSummaryPayload`.
 */
export function buildPostMatchSummaryUserPrompt(
    payload: MatchSummaryPayload,
    language: PlaystyleLocale = 'fr',
): string {
    const isEn = language === 'en';
    const durationStr = formatMatchDuration(payload.matchDurationSeconds ?? 180);
    const topBlunders = (payload.blunders ?? []).slice(0, 3);
    const themes = payload.recurringThemes ?? [];

    const lines: string[] = [
        isEn
            ? 'Analyze this completed Backgammon match and return the 3-pillar Grandmaster JSON report.'
            : 'Analyse ce match de Backgammon terminé et retourne le rapport JSON Grand-Maître en 3 volets.',
        '',
        isEn
            ? `- Final Score: ${payload.scoreX ?? 0} - ${payload.scoreO ?? 0} / ${payload.matchLength || 'Money'} | Duration: ${durationStr}`
            : `- Score final : ${payload.scoreX ?? 0} - ${payload.scoreO ?? 0} / ${payload.matchLength || 'Money'} | Durée : ${durationStr}`,
        isEn
            ? `- Player PR: ${payload.performanceRating.toFixed(2)} (${payload.prCategory}) | Opponent PR: ${payload.opponentPerformanceRating !== null ? payload.opponentPerformanceRating.toFixed(2) : 'N/A'}`
            : `- PR Joueur : ${payload.performanceRating.toFixed(2)} (${payload.prCategory}) | PR Adversaire : ${payload.opponentPerformanceRating !== null ? payload.opponentPerformanceRating.toFixed(2) : 'N/A'}`,
        isEn
            ? `- Total Equity Loss: -${payload.totalEquityLoss.toFixed(3)} Eq across ${payload.decisionsCount} decisions`
            : `- Perte d'équité totale : -${payload.totalEquityLoss.toFixed(3)} Eq sur ${payload.decisionsCount} décisions`,
    ];

    if (topBlunders.length > 0) {
        lines.push('');
        lines.push(isEn ? '### WORST BLUNDERS:' : '### PIRES BLUNDERS :');
        topBlunders.forEach((b, i) => {
            lines.push(
                `${i + 1}. Turn #${b.turnNumber} | ${b.xgid ?? 'XGID=N/A'} | Dice [${b.dice[0]}-${b.dice[1]}] | Played: ${b.playedNotation} | Best: ${b.optimalNotation} | -${b.equityLoss.toFixed(3)} Eq (${b.phase})`,
            );
        });
    }

    if (themes.length > 0) {
        lines.push('');
        lines.push(isEn ? '### RECURRING THEMES:' : '### THÈMES RÉCURRENTS :');
        themes.forEach((t) => lines.push(`- ${t}`));
    }

    return lines.join('\n');
}

/**
 * Repli local sans LLM : génère un cours déterministe complet (incluant 🎯 Diagnostic, 💡 Concept Clé, 🚀 Plan)
 * à partir des métriques.
 */
export function generateRuleBasedGameReview(params: GameReviewCourseParams): GameReviewCourseData {
    const { analysis, opponentPr = null, matchDurationSeconds, language = 'fr' } = params;
    const isEn = language === 'en';
    const { breakdown } = analysis;

    const topBlunders = extractMajorBlunders(analysis.evaluatedMoves, analysis.player, 3);
    const summaryPayload = buildMatchSummaryPayload({
        analysis,
        blunders: topBlunders,
        opponentPerformanceRating: opponentPr,
        matchDurationSeconds,
    });
    const ruleSynthesis = buildRuleBasedSynthesis(summaryPayload, language);

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const lessons: { concept: string; advice: string }[] = [];

    if (breakdown.optimal + breakdown.acceptable >= breakdown.doubtful + breakdown.blunder + breakdown.howler) {
        strengths.push(
            isEn
                ? 'Solid majority of optimal or acceptable moves.'
                : 'Majorité solide de coups optimaux ou acceptables.',
        );
    } else {
        weaknesses.push(
            isEn
                ? 'Too many doubtful or blunder moves compared to optimal ones.'
                : 'Trop de coups douteux ou de blunders par rapport aux coups optimaux.',
        );
    }

    if (breakdown.blunder + breakdown.howler > 0) {
        weaknesses.push(
            isEn
                ? `${breakdown.blunder + breakdown.howler} blunder(s)/howler(s) to eliminate.`
                : `${breakdown.blunder + breakdown.howler} blunder(s)/howler(s) à éliminer.`,
        );
        lessons.push({
            concept: isEn ? 'Blunder reduction' : 'Réduction des blunders',
            advice: isEn
                ? 'Before playing, check for direct shots and exposed blots.'
                : 'Avant de jouer, vérifie les tirs directs et les blots exposés.',
        });
    }

    if (analysis.performanceRating < 5) {
        strengths.push(
            isEn
                ? `Excellent PR of ${analysis.performanceRating.toFixed(2)} (${analysis.prCategory}).`
                : `Excellent PR de ${analysis.performanceRating.toFixed(2)} (${analysis.prCategory}).`,
        );
    } else if (analysis.performanceRating > 15) {
        weaknesses.push(
            isEn
                ? `PR of ${analysis.performanceRating.toFixed(2)} leaves room for improvement.`
                : `Un PR de ${analysis.performanceRating.toFixed(2)} laisse une marge de progression.`,
        );
    }

    if (strengths.length === 0) {
        strengths.push(
            isEn
                ? 'You completed the game and gathered valuable data to improve.'
                : 'Tu as terminé la partie et récolté des données précieuses pour progresser.',
        );
    }

    if (lessons.length === 0) {
        lessons.push({
            concept: isEn ? 'Consistency' : 'Régularité',
            advice: isEn
                ? 'Keep playing optimal moves and review your doubtful decisions.'
                : 'Continue à jouer les coups optimaux et révise tes décisions douteuses.',
        });
    }

    const playstyleProfile = analyzePlaystyle(analysis, language);

    return {
        title: isEn ? 'Your game review' : 'Bilan de ta partie',
        summary: isEn
            ? `PR ${analysis.performanceRating.toFixed(2)} (${analysis.prCategory}) with ${breakdown.blunder + breakdown.howler} blunder(s)/howler(s).`
            : `PR ${analysis.performanceRating.toFixed(2)} (${analysis.prCategory}) avec ${breakdown.blunder + breakdown.howler} blunder(s)/howler(s).`,
        diagnostic: ruleSynthesis.diagnostic,
        keyConcept: ruleSynthesis.keyConcept,
        trainingPlan: ruleSynthesis.trainingPlan,
        recurringThemes: ruleSynthesis.recurringThemes,
        strengths,
        weaknesses,
        lessons,
        nextSteps: [
            isEn ? 'Review your blunders in the step-by-step tab.' : "Revois tes blunders dans l'onglet pas-à-pas.",
            isEn ? 'Practice the dominant concepts in Drills.' : 'Entraîne les concepts dominants dans les Drills.',
        ],
        playstyleProfile,
    };
}
