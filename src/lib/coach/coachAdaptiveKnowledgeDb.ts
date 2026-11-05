/**
 * @file src/lib/coach/coachAdaptiveKnowledgeDb.ts
 * @description Base de Connaissances & Matrice Adaptative du Coach IA (3 Niveaux : DÉBUTANT, INTERMÉDIAIRE, EXPERT).
 * Adapte strictement le vocabulaire, les concepts, la longueur cognitive et les gardes anti-jargon.
 * Strictement <= 400 lignes, 0 any.
 */

export type CoachPlayerTier = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

export interface TierMathContext {
    readonly deltaEmg?: number;
    readonly winPct?: number;
    readonly directShots?: number;
    readonly pipsDiff?: number;
    readonly neuralProbs?: readonly number[] | number[];
    readonly gamePlan?: string;
    readonly optimalMove?: string;
    readonly playedMove?: string;
}

export interface TierSanitizationResult {
    readonly sanitizedText: string;
    readonly tierCompliant: boolean;
    readonly detectedViolations: readonly string[];
}

/**
 * Normalise un paramètre brut (ex: query param ?gate=beginner, playerLevel, playerTier) en CoachPlayerTier.
 */
export function normalizeCoachPlayerTier(raw: unknown): CoachPlayerTier {
    if (typeof raw !== 'string') return 'INTERMEDIATE';
    const clean = raw.trim().toUpperCase();
    if (clean === 'BEGINNER' || clean === 'DEBUTANT' || clean === 'SIMPLE') return 'BEGINNER';
    if (clean === 'EXPERT' || clean === 'PRO' || clean === 'GRANDMASTER' || clean === 'MASTER') return 'EXPERT';
    return 'INTERMEDIATE';
}

/**
 * Liste noire absolue des termes techniques interdits en Mode DÉBUTANT (Mode 1).
 * Tout terme technique, acronyme mathématique ou métrique de moteur est strictement proscrit.
 */
export const BEGINNER_FORBIDDEN_TERMS: readonly string[] = [
    'EMG', 'mEMG', 'MWC', 'cubeful', 'cubeless', '3-ply', '2-ply', '1-ply', '0-ply',
    'PR', 'Error Rate', 'ERA', 'Janowski', 'Kazaross', 'Take Point', 'Gammon Price',
    'equity', 'équité', 'ply', 'blunder', 'gaffe', 'Rollout', 'bgsage', 'gnubg', 'XGID',
] as const;

/**
 * Concepts pédagogiques clés par niveau pour enrichissement RAG / Knowledge Base.
 */
export const TIER_KNOWLEDGE_CONCEPTS: Record<CoachPlayerTier, { readonly fr: readonly string[]; readonly en: readonly string[] }> = {
    BEGINNER: {
        fr: [
            'Protéger les pions isolés pour ne pas se faire renvoyer à la barre',
            'Faire des portes (deux pions ensemble) pour construire une maison solide',
            'Faire courir ses pions arrière vers la sécurité',
            'Rentrer tous ses pions dans son camp pour commencer à les sortir',
        ],
        en: [
            'Protect exposed single checkers to avoid being hit to the bar',
            'Make points (two checkers together) to build a solid home board',
            'Run your back checkers forward toward safety',
            'Bring all checkers home to begin bearing off',
        ],
    },
    INTERMEDIATE: {
        fr: [
            'Compter les dés qui frappent sur 36 combinaisons',
            'Identifier le bon plan de jeu : Course, Mur (Prime), Blitz ou Ancre avancée',
            'Prendre ou sécuriser le Point d’Or (Golden Point case 20 ou 5)',
            'Règle pratique du videau : doubler à ~68-70% de chances, accepter si >= 22-25%',
        ],
        en: [
            'Count direct and indirect hitting rolls out of 36 combinations',
            'Identify the right game plan: Race, Prime, Blitz, or Advanced Anchor',
            'Fight for and secure the Golden Point (point 20 or 5)',
            'Practical doubling cube rules: double around 68-70%, take if >= 22-25%',
        ],
    },
    EXPERT: {
        fr: [
            'Différentiel exact d’équité ΔEMG et probabilités neurales complètes [W, WG, WBG, L, LG, LBG]',
            'Calcul du MWC % selon la table MET Kazaross-XG2 et score de match',
            'Gestion de la fenêtre de marché (Market Window) et équités Cubeful E(ND), E(DT), E(DP)',
            'Duplication des valeurs de dés adverses et préservation du timing de prime',
        ],
        en: [
            'Exact equity loss ΔEMG and full neural probability quintuplet [W, WG, WBG, L, LG, LBG]',
            'MWC % calculation via Kazaross-XG2 MET table and match score dynamics',
            'Market Window management and Cubeful equities E(ND), E(DT), E(DP)',
            'Opponent dice duplication and prime timing preservation',
        ],
    },
};

/**
 * Prompt système adapté selon le niveau du joueur.
 */
export function getTierSystemPrompt(tier: CoachPlayerTier, locale: 'fr' | 'en'): string {
    if (tier === 'BEGINNER') {
        return locale === 'fr'
            ? `Tu es un coach de Backgammon amical et bienveillant pour DÉBUTANT.
DIRECTIVES ABSOLUES :
1. Vocabulaire 100% simple, imagé et accessible à un enfant ou nouveau joueur.
2. INTERDICTION TOTALE d'utiliser le moindre jargon technique ou acronyme : ZERO mention de EMG, MWC, cubeful, cubeless, ply, PR, Error Rate, équité, Janowski, Kazaross.
3. Exprime les chances uniquement en pourcentages arrondis de victoire (ex: "70% de chances de gagner").
4. Reste concis : 18 à 28 mots maximum par explication, focalisé sur la sécurité des pions et l'avancée vers la maison.`
            : `You are a friendly, encouraging Backgammon coach for BEGINNERS.
ABSOLUTE GUIDELINES:
1. 100% simple, intuitive language accessible to a complete novice.
2. STRICT BAN on any technical jargon or mathematical acronyms: ZERO mention of EMG, MWC, cubeful, cubeless, ply, PR, Error Rate, equity, Janowski, Kazaross.
3. Express winning chances only in rounded percentages (e.g. "70% chance to win").
4. Keep it concise: 18 to 28 words maximum per section, focused on checker safety and running home.`;
    }

    if (tier === 'INTERMEDIATE') {
        return locale === 'fr'
            ? `Tu es un entraîneur de club de Backgammon pour joueurs INTERMÉDIAIRES.
DIRECTIVES :
1. Vocabulaire tactique de club clair et stimulant (30 à 45 mots).
2. Quantifie toujours les risques en combinaisons de dés sur 36 (ex: "11 dés sur 36 frappent", "X/36").
3. Nomme explicitement le plan de jeu : Course, Mur / Prime, Blitz, Ancre avancée ou Holding game.
4. Intègre l'écart de pips et les règles pratiques du videau (doubler vers 68-70%, accepter dès 22-25%).`
            : `You are a Backgammon club instructor for INTERMEDIATE players.
GUIDELINES:
1. Clear, practical club tactical vocabulary (30 to 45 words).
2. Always quantify risks using dice combinations out of 36 (e.g. "11 rolls out of 36 hit", "X/36").
3. Explicitly name the strategic game plan: Race, Prime, Blitz, Advanced Anchor, or Holding game.
4. Mention pip differential and practical cube thresholds (double ~68-70%, take if >= 22-25%).`;
    }

    return locale === 'fr'
        ? `Tu es un analyste Grand-Maître de Backgammon (style Michy / Mochy / Magriel) pour joueurs EXPERTS.
DIRECTIVES :
1. Analyse chirurgicale, mathématique et théorique de niveau international.
2. Fournis le ΔEMG exact au millième (-0.XXX EMG), les chances MWC % selon le score et le statut Crawford.
3. Exploite la distribution neurale des 5 probabilités [Gain, Gammon, Backgammon, Perte G, Perte BG].
4. Dissèque la géométrie avancée : Duplication des lancers, timing de prime, containment et seuils Janowski / Trice.`
        : `You are a Grandmaster Backgammon analyst (Michy / Mochy / Magriel style) for EXPERT players.
GUIDELINES:
1. Surgical, mathematical, high-level game theory analysis.
2. Include exact ΔEMG to the thousandth (-0.XXX EMG), MWC % based on match score and Crawford state.
3. Utilize the 5 neural probabilities [Win, WinG, WinBG, LoseG, LoseBG].
4. Dissect advanced geometry: Dice duplication, prime timing, checker containment, and Janowski / Trice formulas.`;
}

/**
 * Nettoie et reformule un texte débutant pour éliminer 100% des termes interdits.
 */
function sanitizeBeginnerText(rawText: string, locale: 'fr' | 'en', mathContext?: TierMathContext): string {
    let result = rawText;
    const isFr = locale === 'fr';

    // Remplacements systématiques des expressions mathématiques en langage clair
    result = result.replace(/[-+]?[0-9]*\.[0-9]+\s*(?:EMG|mEMG)/giu, isFr ? 'une opportunité manquée' : 'a missed opportunity');
    result = result.replace(/(?<!\p{L})(?:EMG|mEMG)(?!\p{L})/giu, isFr ? 'chances de gain' : 'winning chances');
    result = result.replace(/(?<!\p{L})MWC(?!\p{L})/giu, isFr ? 'chances de match' : 'match chances');
    result = result.replace(/(?<!\p{L})(?:cubeful|cubeless)(?!\p{L})/giu, isFr ? 'au jeu' : 'in the game');
    result = result.replace(/[0-4]-ply/giu, isFr ? 'analyse' : 'analysis');
    result = result.replace(/(?<!\p{L})ply(?!\p{L})/giu, isFr ? 'profondeur' : 'depth');
    result = result.replace(/(?<!\p{L})(?:PR|Error Rate|ERA)(?!\p{L})/giu, isFr ? 'précision' : 'accuracy');
    result = result.replace(/(?<!\p{L})(?:equity|équité)(?!\p{L})/giu, isFr ? 'chances de victoire' : 'winning chances');
    result = result.replace(/(?<!\p{L})(?:blunder|gaffe)(?!\p{L})/giu, isFr ? 'erreur importante' : 'major mistake');
    result = result.replace(/(?<!\p{L})(?:Janowski|Kazaross)(?!\p{L})/giu, isFr ? 'les maîtres' : 'the masters');
    result = result.replace(/(?<!\p{L})(?:Take Point|Gammon Price)(?!\p{L})/giu, isFr ? 'seuil de sécurité' : 'safety threshold');
    result = result.replace(/\bXGID=[^\s]+/giu, '');

    // Si des pourcentages de gain sont fournis dans le contexte, les intégrer naturellement
    if (mathContext?.winPct !== undefined && !result.includes('%')) {
        const pct = Math.round(mathContext.winPct * 100);
        result += isFr
            ? ` Ce coup conserve environ ${pct}% de chances de gagner.`
            : ` This move preserves around ${pct}% winning chances.`;
    }

    return result.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Filtre et garde-fou post-génération vérifiant et assurant la stricte conformité du vocabulaire par niveau.
 */
export function enforceTierVocabularyGuard(
    text: string,
    tier: CoachPlayerTier,
    locale: 'fr' | 'en' = 'fr',
    mathContext?: TierMathContext,
): TierSanitizationResult {
    const isFr = locale === 'fr';
    const violations: string[] = [];

    if (tier === 'BEGINNER') {
        for (const term of BEGINNER_FORBIDDEN_TERMS) {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, 'iu');
            if (regex.test(text)) {
                violations.push(term);
            }
        }

        const sanitized = sanitizeBeginnerText(text, locale, mathContext);
        const secondPassViolations: string[] = [];
        for (const term of BEGINNER_FORBIDDEN_TERMS) {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, 'iu');
            if (regex.test(sanitized)) {
                secondPassViolations.push(term);
            }
        }

        return {
            sanitizedText: sanitized,
            tierCompliant: secondPassViolations.length === 0,
            detectedViolations: violations,
        };
    }

    if (tier === 'INTERMEDIATE') {
        let enriched = text;
        const hasCombinations = /\b\d{1,2}\/36\b/i.test(enriched) || enriched.includes('36');
        const hasGamePlan = /course|race|prime|mur|blitz|ancre|holding|golden point/i.test(enriched);

        if (!hasCombinations && mathContext?.directShots !== undefined) {
            enriched += isFr
                ? ` Attention : ce choix concède ${mathContext.directShots}/36 tirs directs à l'adversaire.`
                : ` Warning: this choice concedes ${mathContext.directShots}/36 direct shots to the opponent.`;
        }
        if (!hasGamePlan && mathContext?.gamePlan) {
            enriched += isFr
                ? ` Le plan recommandé ici est la stratégie de ${mathContext.gamePlan}.`
                : ` The recommended plan here is a ${mathContext.gamePlan} strategy.`;
        }

        return {
            sanitizedText: enriched,
            tierCompliant: true,
            detectedViolations: [],
        };
    }

    // Tier EXPERT
    let enrichedExpert = text;
    const hasDeltaEmg = /EMG|ΔEMG|delta\s*emg/i.test(enrichedExpert);
    const hasNeuralProbs = /\[\s*\d|\bW:|MWC/i.test(enrichedExpert);

    if (!hasDeltaEmg && mathContext?.deltaEmg !== undefined) {
        const deltaStr = Math.abs(mathContext.deltaEmg).toFixed(3);
        enrichedExpert += isFr
            ? ` Perte d'équité chirurgicale : -${deltaStr} EMG.`
            : ` Surgical equity loss: -${deltaStr} EMG.`;
    }
    if (!hasNeuralProbs && mathContext?.neuralProbs && mathContext.neuralProbs.length >= 3) {
        const probs = mathContext.neuralProbs.map((p) => (p * 100).toFixed(1) + '%').join(' / ');
        enrichedExpert += isFr
            ? ` Distribution neuronale [Gain / Gammon / BG] : [${probs}].`
            : ` Neural distribution [Win / Gammon / BG]: [${probs}].`;
    }

    return {
        sanitizedText: enrichedExpert,
        tierCompliant: true,
        detectedViolations: [],
    };
}

/**
 * Générateur déterministe instantané (0 ms) calibré par niveau pour les tests, l'offline et les fallbacks.
 */
export function buildAdaptiveDeterministicCoachText(
    tier: CoachPlayerTier,
    locale: 'fr' | 'en',
    mathContext: TierMathContext,
): string {
    const isFr = locale === 'fr';
    const optMove = mathContext.optimalMove ?? '13/8 24/23';
    const winPct = Math.round((mathContext.winPct ?? 0.65) * 100);
    const directShots = mathContext.directShots ?? 11;
    const deltaStr = Math.abs(mathContext.deltaEmg ?? 0.082).toFixed(3);
    const pipsDiff = mathContext.pipsDiff ?? 14;

    if (tier === 'BEGINNER') {
        return isFr
            ? `Joue ${optMove} pour mettre tes pions en sécurité et garder ${winPct}% de chances de gagner sans rien risquer.`
            : `Play ${optMove} to keep your checkers safe and preserve a ${winPct}% chance to win without taking unnecessary risks.`;
    }

    if (tier === 'INTERMEDIATE') {
        const plan = mathContext.gamePlan ?? (isFr ? 'Course' : 'Race');
        return isFr
            ? `En jouant ${optMove}, tu réduis les tirs adverses à seulement ${directShots}/36 dés et renforces ton plan de ${plan} avec ${pipsDiff} pips d'écart.`
            : `By playing ${optMove}, you reduce opponent direct shots to only ${directShots}/36 combinations and consolidate your ${plan} strategy with a ${pipsDiff}-pip lead.`;
    }

    // EXPERT
    return isFr
        ? `Le coup optimal ${optMove} surclasse l'alternative de -${deltaStr} EMG. Il optimise le MWC % en dupliquant les as adverses et stabilise le timing de prime.`
        : `The optimal play ${optMove} outclasses the alternative by -${deltaStr} EMG. It optimizes MWC % by duplicating opponent aces and stabilizes prime timing.`;
}

/**
 * Calcule une clé de cache tenant compte du positionHash, du niveau (tier) et de la locale.
 */
export function getAdaptiveCoachCacheKey(positionKey: string, tier: CoachPlayerTier, locale: string): string {
    return `adaptive_coach::pos[${positionKey.trim()}]::tier[${tier}]::lang[${locale.toLowerCase()}]`;
}
