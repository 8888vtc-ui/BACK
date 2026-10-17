/**
 * Prompts et contrats d'instructions pour le Coach IA Backgammon.
 *
 * Définit :
 * - `BACKGAMMON_COACH_SYSTEM_PROMPT` : Rôle Grand-Maître pédagogue, règle anti-hallucination stricte,
 *   format JSON strict et prise en compte du contexte de match (DMP, Crawford, videau).
 * - `buildCoachUserPrompt` : Sérialiseur des métriques et concepts stratégiques en entrée du prompt.
 * - `generateRuleBasedExplanation` : Repli heuristique local sans LLM (mode offline / dev).
 */

import { Player } from '../../engine/backgammonEngine';
import { StrategicFeatures } from './featureExtractor';
import { buildMatchContext, MatchContext } from './matchContext';

export type { MatchContext };

export interface CoachPromptParams {
    verdict: string; // 'douteux' | 'blunder' | 'howler'
    equityLoss: number;
    playedMove: string;
    optimalMove: string;
    features: StrategicFeatures;
    matchContext?: MatchContext;
    playerLevel?: 'beginner' | 'intermediate' | 'expert';
    language?: 'fr' | 'en';
}

export interface CoachStructuredResponse {
    verdict: string;
    summary: string;
    explanation: string;
    keyConcept: string;
    advice: string;
    whyFailed?: string;
    whyOptimal?: string;
    conceptId?: string;
}

/**
 * Prompt système fondamental guidant le LLM dans son analyse pédagogique.
 */
export const BACKGAMMON_COACH_SYSTEM_PROMPT = `Tu es un Grand-Maître de Backgammon charismatique, direct et percutant. Ton but : faire progresser le joueur en une punchline mémorable.

### RÈGLES ANTI-HALLUCINATION STRICTES :
1. Ne JAMAIS inventer de pions, flèches ou caractéristiques absentes des données fournies.
2. T'appuyer STRICTEMENT sur les métriques fournies (equityLoss, pips, tirs/36, structure du plateau, contexte de match).
3. Si un fait n'est pas présent dans les données, NE PAS le supposer.

### CONTRAINTE DE LONGUEUR ABSOLUE :
- Maximum 2 phrases courtes (30 mots au total).
- Structure obligatoire : [1. L'erreur tactique immédiate en langage parlé] + [2. La règle d'or à retenir].
- Exemple : "Tu t'exposes à 29 tirs directs sur la flèche 21 alors que tu es derrière à la course ! Quand tu perds la course, verrouille tes portes au lieu de laisser des blots."

### FORMAT DE RÉPONSE OBLIGATOIRE (JSON STRICT) :
Ta réponse DOIT être un objet JSON valide, sans texte ou balise markdown avant ou après.
Schéma JSON :
{
  "verdict": "douteux" | "blunder" | "howler",
  "summary": "1 phrase d'accroche très courte (max 15 mots).",
  "whyFailed": "1 phrase percutante sur l'erreur immédiate (langage parlé).",
  "whyOptimal": "1 phrase percutante sur ce que le meilleur coup accomplit.",
  "conceptId": "golden-point" | "bar-point" | "advanced-anchor" | "duplication" | "pure-play" | "tempo-hit" | "running-game" | "holding-game" | "prime-vs-prime" | "blitz-attack" | "back-game" | "take-point" | "woolsey-law" | "market-loss" | "trice-epc" | "kazaross-8912" | "kazaross-xg-met" | "crawford-rule" | "dmp-strategy" | "opening-philosophy" | "mochy-golden-rules",
  "keyConcept": "Nom du concept en 3 à 5 mots.",
  "advice": "1 règle d'or mnémotechnique (1 phrase courte).",
  "explanation": "2 phrases courtes combinant whyFailed et whyOptimal (30 mots max)."
}`;

export const BACKGAMMON_COACH_SYSTEM_PROMPT_EN = `You are a charismatic, direct, punchy Backgammon Grandmaster coach. Your goal: make the player improve with one memorable punchline.

### STRICT ANTI-HALLUCINATION RULES:
1. NEVER invent checkers, points, or board features not present in the provided data.
2. Rely STRICTLY on the provided metrics (equity loss, pips, shots/36, board structure, match context).
3. If a fact is not present in the received data, DO NOT ASSUME IT.

### ABSOLUTE LENGTH CONSTRAINT:
- Maximum 2 short sentences (30 words total).
- Mandatory structure: [1. The immediate tactical mistake in spoken language] + [2. The golden rule to remember].
- Example: "You expose yourself to 29 direct shots on the 21-point while trailing in the race! When you lose the race, lock your points instead of leaving blots."

### MANDATORY RESPONSE FORMAT (STRICT JSON):
Your response MUST be a valid JSON object, without surrounding markdown.
JSON Schema:
{
  "verdict": "doubtful" | "blunder" | "howler",
  "summary": "1 punchy hook sentence (max 15 words).",
  "whyFailed": "1 punchy sentence on the immediate mistake (spoken language).",
  "whyOptimal": "1 punchy sentence on what the best move accomplishes.",
  "conceptId": "golden-point" | "bar-point" | "advanced-anchor" | "duplication" | "pure-play" | "tempo-hit" | "running-game" | "holding-game" | "prime-vs-prime" | "blitz-attack" | "back-game" | "take-point" | "woolsey-law" | "market-loss" | "trice-epc" | "kazaross-8912" | "kazaross-xg-met" | "crawford-rule" | "dmp-strategy" | "opening-philosophy" | "mochy-golden-rules",
  "keyConcept": "Concept name in 3 to 5 words.",
  "advice": "1 memorable rule of thumb (1 short sentence).",
  "explanation": "2 short sentences combining whyFailed and whyOptimal (30 words max)."
}`;

export function getCoachSystemPrompt(language: 'fr' | 'en' = 'fr'): string {
    return language === 'en' ? BACKGAMMON_COACH_SYSTEM_PROMPT_EN : BACKGAMMON_COACH_SYSTEM_PROMPT;
}

/**
 * Construit le prompt utilisateur structuré contenant toutes les métriques extraites.
 */
export function buildCoachUserPrompt(params: CoachPromptParams): string {
    const {
        verdict,
        equityLoss,
        playedMove,
        optimalMove,
        features,
        matchContext,
        playerLevel = 'intermediate',
        language = 'fr',
    } = params;

    const diff = features.pipCountDiff;
    const isEn = language === 'en';

    const raceLeaderStr = isEn
        ? diff.leader === 'tie'
            ? 'Race is tied'
            : `${diff.leader} leads the race with a ${Math.abs(diff.diff)} pip lead (Player: ${diff.player}, Opponent: ${diff.opponent})`
        : diff.leader === 'tie'
            ? 'Course à égalité parfaite'
            : `${diff.leader} mène la course avec un avantage de ${Math.abs(diff.diff)} pips (Joueur: ${diff.player}, Adversaire: ${diff.opponent})`;

    const userShots = features.blotsAndShots.user;
    const bestShots = features.blotsAndShots.best;

    const totalUserShots = userShots.reduce((acc, b) => acc + b.totalShots, 0);
    const totalBestShots = bestShots.reduce((acc, b) => acc + b.totalShots, 0);

    let matchInfo = isEn ? 'Casual game without specified match context.' : 'Partie amicale sans contexte de match renseigné.';
    if (matchContext) {
        const ctx = buildMatchContext(matchContext);
        if (ctx.matchLength === 0 || ctx.isMoneyPlay) {
            matchInfo = isEn
                ? `Money play — Cube: ${ctx.cubeValue} (${ctx.cubeOwner ? 'owned by ' + ctx.cubeOwner : 'centered'}). Gammon price: 0.50. Take point: 25.0%.`
                : `Partie d'argent (Money play) — Videau: ${ctx.cubeValue} (${ctx.cubeOwner ? 'détenu par ' + ctx.cubeOwner : 'centré'}). Prix du gammon: 0.50. Take point: 25.0%.`;
        } else {
            const regime = isEn
                ? ctx.isDMP
                    ? 'DMP (Double Match Point) — Gammons do not count, single win is decisive.'
                    : ctx.crawford
                        ? 'Crawford rule active — Cube is frozen.'
                        : ctx.postCrawford
                            ? 'Post-Crawford — Trailing player doubles immediately.'
                            : 'Regular match play.'
                : ctx.isDMP
                    ? 'DMP (Double Match Point) — Aucun gammon ne compte, gain simple décisif.'
                    : ctx.crawford
                        ? 'Règle de Crawford active — Videau gelé.'
                        : ctx.postCrawford
                            ? 'Post-Crawford — Le retardataire double immédiatement.'
                            : 'Match play régulier.';

            const ptsX = ctx.pointsToWin.X;
            const ptsO = ctx.pointsToWin.O;
            const gpX = (ctx.gammonPrice.X * 100).toFixed(0) + '%';
            const gpO = (ctx.gammonPrice.O * 100).toFixed(0) + '%';
            const tpX = (ctx.takePoint.X * 100).toFixed(1) + '%';
            const tpO = (ctx.takePoint.O * 100).toFixed(1) + '%';

            matchInfo = isEn
                ? [
                    `Match to ${ctx.matchLength} points. Score X: ${ctx.scoreX}, O: ${ctx.scoreO} (${ptsX}-away, ${ptsO}-away).`,
                    `Regime: ${regime}`,
                    `Doubling Cube: ${ctx.cubeValue} (${ctx.cubeOwner ? 'owned by ' + ctx.cubeOwner : 'centered'}).`,
                    `Gammon Price (MET Kazaross): Player X = ${gpX}, Player O = ${gpO}.`,
                    `Take Point: Player X = ${tpX}, Player O = ${tpO}.`,
                ].join('\n')
                : [
                    `Match en ${ctx.matchLength} points. Score X: ${ctx.scoreX}, O: ${ctx.scoreO} (${ptsX}-away, ${ptsO}-away).`,
                    `Régime : ${regime}`,
                    `Videau: ${ctx.cubeValue} (${ctx.cubeOwner ? 'détenu par ' + ctx.cubeOwner : 'centré'}).`,
                    `Prix du gammon (MET Kazaross) : Joueur X = ${gpX}, Joueur O = ${gpO}.`,
                    `Take point (Seuil de prise du videau) : Joueur X = ${tpX}, Joueur O = ${tpO}.`,
                ].join('\n');
        }
    }

    if (isEn) {
        return `Here is the verified data for the position and analyzed move:

## ENGINE DIAGNOSIS:
- Verdict: ${verdict.toUpperCase()} (Equity loss: ${equityLoss.toFixed(3)})
- Move played by player: "${playedMove}"
- Optimal move recommended by engine: "${optimalMove}"
- Declared player level: ${playerLevel}

## MATCH CONTEXT:
${matchInfo}

## STRATEGIC CONCEPTS EXTRACTED:
- Game situation: ${features.contactStatus === 'contact' ? 'Contact play' : 'Pure race without contact'}
- Pip count race: ${raceLeaderStr}
- Blot exposure after played move: ${userShots.length} blot(s) exposed, totaling ${totalUserShots} shots/36 for the opponent.
  Played blots detail: ${userShots.length > 0 ? userShots.map((b) => `Point ${b.point} (${b.totalShots} shots)`).join(', ') : 'None'}
- Blot exposure after optimal move: ${bestShots.length} blot(s), totaling ${totalBestShots} shots/36.
  Optimal blots detail: ${bestShots.length > 0 ? bestShots.map((b) => `Point ${b.point} (${b.totalShots} shots)`).join(', ') : 'None'}
- Home board structure: ${features.boardStructure.innerBoardPoints} closed home board point(s).
- Key points control:
  - Golden Point (Point 5): ${features.boardStructure.goldenPoint ? 'Controlled' : 'Not controlled'}
  - Bar Point (Point 7): ${features.boardStructure.barPoint ? 'Controlled' : 'Not controlled'}
  - Advanced anchor: ${features.boardStructure.advancedAnchor ? 'Yes' : 'No'}
  - Longest consecutive prime: ${features.boardStructure.longestPrime} points

Write your explanation in the requested strict JSON format.`;
    }

    return `Voici les données vérifiées de la position et du coup analysé :

## DIAGNOSTIC DU MOTEUR :
- Verdict : ${verdict.toUpperCase()} (Perte d'équité : ${equityLoss.toFixed(3)})
- Coup joué par le joueur : "${playedMove}"
- Coup optimal recommandé par le moteur : "${optimalMove}"
- Niveau déclaré du joueur : ${playerLevel}

## CONTEXTE DE MATCH :
${matchInfo}

## CONCEPTS STRATÉGIQUES EXTRAITS :
- Situation de jeu : ${features.contactStatus === 'contact' ? 'Jeu avec contact' : 'Course pure sans contact'}
- Course aux pips : ${raceLeaderStr}
- Exposition des blots après le coup joué : ${userShots.length} blot(s) exposé(s), totalisant ${totalUserShots} tirs/36 favorables à l'adversaire.
  Détail des blots joués : ${userShots.length > 0 ? userShots.map((b) => `Flèche ${b.point} (${b.totalShots} tirs)`).join(', ') : 'Aucun'}
- Exposition des blots après le coup optimal : ${bestShots.length} blot(s), totalisant ${totalBestShots} tirs/36.
  Détail des blots optimaux : ${bestShots.length > 0 ? bestShots.map((b) => `Flèche ${b.point} (${b.totalShots} tirs)`).join(', ') : 'Aucun'}
- Structure du jan intérieur : ${features.boardStructure.innerBoardPoints} porte(s) fermée(s) dans le jan intérieur.
- Contrôle des points clés :
  - Golden Point (Point 5) : ${features.boardStructure.goldenPoint ? 'Contrôlé' : 'Non contrôlé'}
  - Bar Point (Point 7) : ${features.boardStructure.barPoint ? 'Contrôlé' : 'Non contrôlé'}
  - Ancre avancée : ${features.boardStructure.advancedAnchor ? 'Oui' : 'Non'}
  - Plus longue prime consécutive : ${features.boardStructure.longestPrime} portes consécutives

Rédige ton explication au format JSON strict demandé.`;
}

/**
 * Générateur d'explication heuristique de repli sans appel LLM (offline / mode dégradé / secours).
 * Produit une explication pédagogique règle-basée directement depuis les concepts stratégiques extraits.
 */
export function generateRuleBasedExplanation(params: CoachPromptParams): CoachStructuredResponse {
    const {
        verdict = 'douteux',
        equityLoss = -0.05,
        playedMove = 'Coup joué',
        optimalMove = 'Coup optimal',
        features,
        matchContext,
        language = 'fr',
    } = params;

    const isEn = language === 'en';

    const diff = features?.pipCountDiff ?? {
        player: 150,
        opponent: 150,
        leader: 'tie',
        diff: 0,
    };
    const player = features?.player ?? 'X';
    const isLeadingRace = diff.leader === player;
    const userBlots = features?.blotsAndShots?.user ?? [];
    const bestBlots = features?.blotsAndShots?.best ?? [];

    const userShots = userBlots.reduce((acc, b) => acc + b.totalShots, 0);
    const bestShots = bestBlots.reduce((acc, b) => acc + b.totalShots, 0);

    const board = features?.boardStructure ?? {
        innerBoardPoints: 2,
        advancedAnchor: false,
        goldenPoint: false,
        barPoint: false,
        longestPrime: 2,
    };
    const contactStatus = features?.contactStatus ?? 'contact';

    let summary = isEn
        ? `Your move ${playedMove} is a ${verdict} (-${Math.abs(equityLoss).toFixed(3)} equity) compared to ${optimalMove}.`
        : `Votre coup ${playedMove} est ${verdict} (-${Math.abs(equityLoss).toFixed(3)} d'équité) par rapport à ${optimalMove}.`;
    let explanation = '';
    let keyConcept = isEn ? 'Safety & Racing' : 'Sécurité & Course';
    let advice = isEn
        ? 'Always assess the number of opponent shots conceded before dispersing your checkers.'
        : 'Évaluez toujours le nombre de tirs concédés avant de disperser vos pions.';
    let whyFailed = '';
    let whyOptimal = '';
    let conceptId = 'pure-play';

    if (userShots > bestShots && userBlots.length > 0) {
        summary = isEn
            ? `The move concedes ${userShots} direct shots compared to only ${bestShots} for the best move.`
            : `Le coup concède ${userShots} tirs directs contre seulement ${bestShots} pour le meilleur coup.`;
        whyFailed = isEn
            ? `By playing ${playedMove}, you leave a vulnerable blot giving the opponent ${userShots} rolls out of 36 to hit.`
            : `En jouant ${playedMove}, vous laissez un blot vulnérable offrant à l'adversaire ${userShots} chances sur 36 de frapper.`;
        whyOptimal = isEn
            ? `The optimal move ${optimalMove} reduces this exposure to ${bestShots} shots while securing structure.`
            : `Le coup optimal ${optimalMove} réduit cette exposition à ${bestShots} tirs tout en consolidant votre structure.`;
        explanation = `${whyFailed} ${whyOptimal}`;
        keyConcept = isEn ? 'Shot Minimization' : 'Minimisation des tirs';
        advice = isEn
            ? 'When your opponent has a strong home board, every blot left is a major gammon risk.'
            : 'Quand votre adversaire a un jan intérieur solide, chaque blot concédé est un risque majeur de gammon.';
        conceptId = 'duplication';
    } else if (isLeadingRace && contactStatus === 'contact' && Math.abs(diff.diff) >= 8) {
        summary = isEn
            ? `You lead the race by ${Math.abs(diff.diff)} pips: breaking contact safely is the absolute priority.`
            : `Vous menez la course de ${Math.abs(diff.diff)} pips : la priorité absolue est de rompre le contact sans risque.`;
        whyFailed = isEn
            ? `Playing ${playedMove} unnecessarily complicates the game while holding a ${Math.abs(diff.diff)} pip lead.`
            : `Jouer ${playedMove} complique inutilement le jeu alors que vous menez de ${Math.abs(diff.diff)} pips.`;
        whyOptimal = isEn
            ? `The move ${optimalMove} cleanly breaks contact to steer straight towards the bear-off race.`
            : `Le coup ${optimalMove} rompt proprement le contact pour filer droit vers la course de sortie.`;
        explanation = `${whyFailed} ${whyOptimal}`;
        keyConcept = isEn ? 'Racing Lead Rule' : 'Règle de course en avance';
        advice = isEn
            ? 'When ahead in the race, avoid contact and do not look for confrontation.'
            : 'En avance à la course, fuyez le contact et ne cherchez pas la confrontation.';
        conceptId = 'running-game';
    } else if (board.longestPrime >= 4) {
        summary = isEn
            ? `A prime of ${board.longestPrime} consecutive points offers a decisive strategic lock.`
            : `Une prime de ${board.longestPrime} portes consécutives offre un verrouillage stratégique décisif.`;
        whyFailed = isEn
            ? `Playing ${playedMove} weakens or dismantles your ${board.longestPrime}-point prime barricade.`
            : `Jouer ${playedMove} affaiblit ou disloque votre mur de prime de ${board.longestPrime} portes.`;
        whyOptimal = isEn
            ? `Playing ${optimalMove} preserves or extends the prime to completely paralyze opponent escape.`
            : `Le coup ${optimalMove} consolide ou prolonge la prime pour paralyser totalement l'évasion adverse.`;
        explanation = `${whyFailed} ${whyOptimal}`;
        keyConcept = isEn ? 'Prime Construction' : 'Construction de Prime';
        advice = isEn
            ? 'Against trapped opponent checkers, extending your prime always trumps racing.'
            : 'Face à des pions adverses piégés, étendre votre prime prime toujours sur la course.';
        conceptId = 'prime-vs-prime';
    } else if (board.goldenPoint) {
        summary = isEn
            ? `Control of the 5-point (Golden Point) is paramount.`
            : `Le contrôle du Point 5 (Golden Point) est capital.`;
        whyFailed = isEn
            ? `Playing ${playedMove} fails to capitalize on or secure the master 5-point.`
            : `Jouer ${playedMove} manque l'occasion de verrouiller ou d'exploiter le point 5 maître.`;
        whyOptimal = isEn
            ? `The move ${optimalMove} establishes firm dominance on the 5-point foundation.`
            : `Le coup ${optimalMove} verrouille la domination sur le point 5 clé de voûte.`;
        explanation = `${whyFailed} ${whyOptimal}`;
        keyConcept = isEn ? 'Golden Point Control' : 'Contrôle du Golden Point';
        advice = isEn
            ? 'The 5-point is the cornerstone of both offense and defense.'
            : 'Le Point 5 est la clé de voûte de toute attaque et de toute défense.';
        conceptId = 'golden-point';
    } else if (board.advancedAnchor) {
        summary = isEn
            ? `The advanced anchor guarantees safety and restricts your opponent.`
            : `L'ancre avancée assure votre sécurité et bride l'adversaire.`;
        whyFailed = isEn
            ? `Playing ${playedMove} gives up or neglects the advanced anchor without overwhelming compensation.`
            : `Jouer ${playedMove} délaisse l'ancre avancée sans compensation majeure immédiate.`;
        whyOptimal = isEn
            ? `Playing ${optimalMove} maintains strong anchor connectivity and outfield control.`
            : `Jouer ${optimalMove} maintient l'ancre avancée et le contrôle du jan adverse.`;
        explanation = `${whyFailed} ${whyOptimal}`;
        keyConcept = isEn ? 'Advanced Anchor' : 'Ancre avancée';
        advice = isEn
            ? 'Never dismantle an advanced anchor without overwhelming immediate compensation.'
            : 'Ne démontez jamais une ancre avancée sans une compensation immédiate écrasante.';
        conceptId = 'advanced-anchor';
    } else {
        whyFailed = isEn
            ? `The move ${playedMove} loses valuable mobility pips and structural harmony.`
            : `Le coup joué ${playedMove} cède de précieux pips de mobilité et déséquilibre votre structure.`;
        whyOptimal = isEn
            ? `The optimal move ${optimalMove} achieves superior checker connectivity.`
            : `Le coup optimal ${optimalMove} maximise la connectivité et l'efficacité des pions.`;
        explanation = `${whyFailed} ${whyOptimal}`;
        conceptId = 'pure-play';
    }

    // Complément contextuel selon la situation du match
    if (matchContext) {
        const ctx = buildMatchContext(matchContext);
        if (ctx.isDMP) {
            explanation += isEn
                ? `\n\n🎯 DMP Context: 1 point to win, gammons do not count.`
                : `\n\n🎯 Contexte DMP : À 1 point de la victoire, les gammons ne comptent pas.`;
        } else if (ctx.crawford) {
            explanation += isEn
                ? `\n\n🛡️ Crawford Rule: Doubling cube is frozen.`
                : `\n\n🛡️ Règle de Crawford : Videau gelé pour cette manche.`;
        } else if (ctx.gammonPrice && ctx.gammonPrice.X > 0.6) {
            explanation += isEn
                ? `\n\n⚠️ Match Context: High gammon price (${(ctx.gammonPrice.X * 100).toFixed(0)}%). Extreme safety required.`
                : `\n\n⚠️ Contexte de match : Prix du gammon très élevé (${(ctx.gammonPrice.X * 100).toFixed(0)}%). Prudence maximale.`;
        }
    }

    return {
        verdict,
        summary,
        explanation,
        keyConcept,
        advice,
        whyFailed,
        whyOptimal,
        conceptId,
    };
}
