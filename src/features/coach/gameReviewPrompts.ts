/**
 * Prompts et contrats pour le « Cours explicatif » de fin de partie.
 *
 * Rôle :
 *   Génère un cours pédagogique structuré à partir du résumé d'une partie complète
 *   (PR, ventilation des coups, concepts dominants, verdicts), destiné à être affiché
 *   dans la modale de revue de partie (`GameReviewModal`).
 *
 * Contrat de réponse (JSON strict) :
 *   {
 *     "title": string,
 *     "summary": string,
 *     "strengths": string[],
 *     "weaknesses": string[],
 *     "lessons": { concept: string; advice: string }[],
 *     "nextSteps": string[]
 *   }
 */

import type { CompleteGameAnalysis, EvaluatedTurn } from '../rating/types';
import { analyzePlaystyle, type PlaystyleProfile, type PlaystyleLocale } from './playstyleProfiler';

export interface GameReviewCourseParams {
    /** Résumé de la partie analysée */
    analysis: CompleteGameAnalysis;
    /** Langue de sortie */
    language?: PlaystyleLocale;
}

export interface GameReviewCourseData {
    title: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    lessons: { concept: string; advice: string }[];
    nextSteps: string[];
    playstyleProfile?: PlaystyleProfile;
}

/**
 * Prompt système guidant le LLM dans la rédaction d'un cours de fin de partie.
 */
export const GAME_REVIEW_SYSTEM_PROMPT = `Tu es un Grand-Maître de Backgammon pédagogue et bienveillant. Ta mission : transformer le bilan d'une partie complète en un cours explicatif clair, motivant et actionnable.

### RÈGLES ANTI-HALLUCINATION STRICTES :
1. Ne JAMAIS inventer de coups, de scores ou de concepts absents des données fournies.
2. T'appuyer STRICTEMENT sur les métriques fournies (PR, error rate, ventilation des coups, concepts dominants).
3. Si une donnée est absente, NE PAS la supposer.

### TON DU COURS :
- Encourageant mais honnête : célèbre les forces, pointe les faiblesses sans accabler.
- Concret : chaque leçon doit être actionnable immédiatement.
- Progressif : adapte le vocabulaire au niveau du joueur.

### FORMAT DE RÉPONSE OBLIGATOIRE (JSON STRICT) :
Ta réponse DOIT être un objet JSON valide, sans texte ou balise markdown avant ou après.
Schéma JSON :
{
  "title": "Titre accrocheur du cours (max 8 mots).",
  "summary": "Bilan global en 2 phrases (max 40 mots).",
  "strengths": ["2 à 3 points forts observés dans la partie."],
  "weaknesses": ["2 à 3 axes de progression identifiés."],
  "lessons": [
    { "concept": "Nom du concept stratégique (3-5 mots).", "advice": "Règle d'or actionnable (1 phrase)." }
  ],
  "nextSteps": ["2 à 3 exercices ou habitudes concrets à travailler."]
}`;

export const GAME_REVIEW_SYSTEM_PROMPT_EN = `You are a pedagogical, encouraging Backgammon Grandmaster. Your mission: turn a full game summary into a clear, motivating, actionable lesson.

### STRICT ANTI-HALLUCINATION RULES:
1. NEVER invent moves, scores, or concepts absent from the provided data.
2. Rely STRICTLY on the provided metrics (PR, error rate, move breakdown, dominant concepts).
3. If a fact is absent, DO NOT ASSUME IT.

### TONE:
- Encouraging but honest: celebrate strengths, point out weaknesses without discouraging.
- Concrete: every lesson must be immediately actionable.
- Progressive: adapt vocabulary to the player's level.

### MANDATORY RESPONSE FORMAT (STRICT JSON):
Your response MUST be a valid JSON object, without surrounding markdown.
JSON Schema:
{
  "title": "Catchy lesson title (max 8 words).",
  "summary": "Overall assessment in 2 sentences (max 40 words).",
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
 * Construit le prompt utilisateur à partir du résumé de partie.
 */
export function buildGameReviewUserPrompt(params: GameReviewCourseParams): string {
    const { analysis, language = 'fr' } = params;
    const isEn = language === 'en';

    const breakdown = analysis.breakdown;
    const concepts = collectDominantConcepts(analysis.evaluatedMoves);

    const lines: string[] = [];

    lines.push(
        isEn
            ? 'Here is the summary of a completed backgammon game. Write a pedagogical lesson based strictly on these data.'
            : 'Voici le bilan d\'une partie de backgammon terminée. Rédige un cours pédagogique basé strictement sur ces données.',
    );
    lines.push('');

    lines.push(isEn ? '### GAME SUMMARY' : '### BILAN DE LA PARTIE');
    lines.push(
        isEn
            ? `- Performance Rating (PR): ${analysis.performanceRating.toFixed(2)} (category: ${analysis.prCategory})`
            : `- Performance Rating (PR) : ${analysis.performanceRating.toFixed(2)} (catégorie : ${analysis.prCategory})`,
    );
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
 * Repli local sans LLM : génère un cours déterministe à partir des métriques.
 */
export function generateRuleBasedGameReview(params: GameReviewCourseParams): GameReviewCourseData {
    const { analysis, language = 'fr' } = params;
    const isEn = language === 'en';
    const { breakdown } = analysis;

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
        strengths,
        weaknesses,
        lessons,
        nextSteps: [
            isEn ? 'Review your blunders in the step-by-step tab.' : 'Revois tes blunders dans l\'onglet pas-à-pas.',
            isEn ? 'Practice the dominant concepts in Drills.' : 'Entraîne les concepts dominants dans les Drills.',
        ],
        playstyleProfile,
    };
}
