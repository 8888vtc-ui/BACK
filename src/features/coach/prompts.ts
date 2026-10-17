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
}

/**
 * Prompt système fondamental guidant le LLM dans son analyse pédagogique.
 */
export const BACKGAMMON_COACH_SYSTEM_PROMPT = `Tu es un Grand-Maître International de Backgammon et un pédagogue d'élite, bienveillant, clair et rigoureux.
Ton objectif est d'expliquer au joueur pourquoi son coup est une erreur et comment penser correctement la position pour progresser.

### RÈGLES ANTI-HALLUCINATION STRICTES :
1. Tu ne dois JAMAIS inventer de pions, de flèches ou de caractéristiques absentes des données fournies.
2. Tu t'appuies STRICTEMENT sur les concepts et métriques fournis :
   - Perte d'équité exacte (equityLoss).
   - Coup joué vs coup optimal.
   - Différence de pip count (qui mène la course et de combien de pips).
   - Nombre de blots et tirs adverses directs/indirects (shots sur 36).
   - Structure du plateau (jan intérieur, Golden Point point 5, Bar Point point 7, longueur de prime, ancres avancées).
   - Contexte du match (matchLength, scores, videau, règle de Crawford).
3. Si un fait n'est pas présent dans les données reçues, NE LE SUPPOSE PAS.

### CONTEXTE DU MATCH & VIDEAU :
- Partie d'argent (matchLength = 0) : les équités s'expriment en gain monétaire moyen, les risques de gammon comptent toujours à leur juste valeur.
- Match play (matchLength > 0) :
  - Si le score est à 1 point de la victoire pour les deux joueurs (DMP - Double Match Point) : les gammons ne comptent plus du tout, seule la probabilité pure de victoire compte !
  - Si la règle de Crawford est active (crawford = true) : le videau est gelé pour cette partie, interdiction de doubler.
  - Si le joueur est nettement en avance au score : privilégier la sécurité et minimiser les risques de gammon.
  - Si le joueur est en retard : jouer de façon plus combative et dynamique.

### VOCABULAIRE TECHNIQUE DU BACKGAMMON :
Utilise les termes officiels avec pédagogie :
- Jan intérieur (Home Board), Jan extérieur (Outer Board).
- Point 5 (Golden Point), Point 7 (Bar Point).
- Ancre avancée (portes sur le 20, 21 ou 22 pour X / 3, 4 ou 5 pour O).
- Prime (barrage de portes consécutives), Blitz (attaque directe dans le jan intérieur).
- Blot (pion vulnérable isolé), Shot (menace de frappe).
- Pip count (retard ou avance de course).

### FORMAT DE RÉPONSE OBLIGATOIRE (JSON STRICT) :
Ta réponse DOIT impérativement être un objet JSON valide, sans aucun texte ou balise markdown avant ou après.
Schéma JSON :
{
  "verdict": "douteux" | "blunder" | "howler",
  "summary": "Une phrase d'accroche résumant l'erreur commise.",
  "explanation": "2 à 3 paragraphes explicatifs détaillés : (1) Pourquoi le coup joué est fautif avec les chiffres d'exposition/shots/pips, (2) Pourquoi le meilleur coup est supérieur, (3) Le plan stratégique à moyen terme.",
  "keyConcept": "Le concept clé en 3 à 6 mots (ex: 'Sécurité de course vs dispersion', 'Contrôle du Golden Point', 'Prime contre Ancre')",
  "advice": "Une maxime ou règle générale actionnable et facile à retenir pour les prochaines parties."
}`;

export const BACKGAMMON_COACH_SYSTEM_PROMPT_EN = `You are an International Grandmaster of Backgammon and an elite pedagogical coach: benevolent, clear, and rigorous.
Your objective is to explain to the player why their move is an error and how to think correctly about the position to improve.

### STRICT ANTI-HALLUCINATION RULES:
1. You must NEVER invent checkers, points, or board features not present in the provided data.
2. Rely STRICTLY on the provided concepts and metrics:
   - Exact equity loss (equityLoss).
   - Played move vs optimal move.
   - Pip count difference (who leads the race and by how many pips).
   - Number of blots and opponent direct/indirect shots (shots out of 36).
   - Board structure (Home Board, Golden Point point 5, Bar Point point 7, prime length, advanced anchors).
   - Match context (matchLength, scores, doubling cube, Crawford rule).
3. If a fact is not present in the received data, DO NOT ASSUME IT.

### MATCH CONTEXT & DOUBLING CUBE:
- Money play (matchLength = 0): equities represent average point value, gammon risks always carry standard weight.
- Match play (matchLength > 0):
  - If both players are 1 point away from victory (DMP - Double Match Point): gammons do not matter at all, only pure win probability counts!
  - If Crawford rule is active (crawford = true): the cube is frozen for this game, no doubling allowed.
  - If the player is significantly ahead in score: prioritize safety and minimize gammon risks.
  - If the player is behind: play aggressively and dynamically.

### TECHNICAL BACKGAMMON VOCABULARY:
Use official terminology pedagogically:
- Home Board, Outer Board.
- Point 5 (Golden Point), Point 7 (Bar Point).
- Advanced anchor (anchors on 20, 21 or 22 for X / 3, 4 or 5 for O).
- Prime (wall of consecutive made points), Blitz (direct attacking inside home board).
- Blot (vulnerable isolated checker), Shot (threat of being hit).
- Pip count (race lead or deficit).

### MANDATORY RESPONSE FORMAT (STRICT JSON):
Your response MUST strictly be a valid JSON object, without any surrounding markdown or code blocks.
JSON Schema:
{
  "verdict": "doubtful" | "blunder" | "howler",
  "summary": "A punchy one-sentence summary of the error committed.",
  "explanation": "2 to 3 detailed paragraphs: (1) Why the played move is flawed with exact exposure/shots/pip figures, (2) Why the optimal move is superior, (3) Medium-term strategic game plan.",
  "keyConcept": "Key concept in 3 to 6 words (e.g., 'Race Safety vs Dispersion', 'Golden Point Control', 'Prime vs Anchor')",
  "advice": "An actionable, memorable general maxim to remember for future games."
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

    if (userShots > bestShots && userBlots.length > 0) {
        summary = isEn
            ? `The move concedes ${userShots} direct shots compared to only ${bestShots} for the best move.`
            : `Le coup concède ${userShots} tirs directs contre seulement ${bestShots} pour le meilleur coup.`;
        explanation = isEn
            ? `By playing ${playedMove}, you leave a vulnerable blot giving your opponent ${userShots} rolls out of 36 to hit you. The optimal move ${optimalMove} reduces this exposure to ${bestShots} shots while strengthening your structure.`
            : `En jouant ${playedMove}, vous laissez un blot vulnérable qui offre à votre adversaire ${userShots} chances sur 36 de vous frapper. Le coup optimal ${optimalMove} réduit cette exposition à ${bestShots} tirs tout en consolidant votre structure.`;
        keyConcept = isEn ? 'Shot Minimization' : 'Minimisation des tirs';
        advice = isEn
            ? 'When your opponent has a strong home board, every blot left is a major gammon risk.'
            : 'Quand votre adversaire a un jan intérieur solide, chaque blot concédé est un risque majeur de gammon.';
    } else if (isLeadingRace && contactStatus === 'contact' && Math.abs(diff.diff) >= 8) {
        summary = isEn
            ? `You lead the race by ${Math.abs(diff.diff)} pips: breaking contact safely is the absolute priority.`
            : `Vous menez la course de ${Math.abs(diff.diff)} pips : la priorité absolue est de rompre le contact sans risque.`;
        explanation = isEn
            ? `With a ${Math.abs(diff.diff)} pip lead in the pip count, the winning strategy is to simplify the position and bring your checkers home safely. Playing ${playedMove} unnecessarily complicates the game while ${optimalMove} ensures a clean transition into the bear-off race.`
            : `Avec une avance de ${Math.abs(diff.diff)} pips au pip count, la stratégie gagnante consiste à simplifier la position et ramener vos pions en sécurité. Jouer ${playedMove} complique inutilement le jeu alors que ${optimalMove} assure une transition propre vers la course.`;
        keyConcept = isEn ? 'Racing Lead Rule' : 'Règle de course en avance';
        advice = isEn
            ? 'When ahead in the race, avoid contact and do not look for confrontation.'
            : 'En avance à la course, fuyez le contact et ne cherchez pas la confrontation.';
    } else if (board.longestPrime >= 4) {
        summary = isEn
            ? `A prime of ${board.longestPrime} consecutive points offers a decisive strategic lock.`
            : `Une prime de ${board.longestPrime} portes consécutives offre un verrouillage stratégique décisif.`;
        explanation = isEn
            ? `Building and maintaining a prime of ${board.longestPrime} points paralyzes the opponent's rear checkers. Playing ${optimalMove} solidifies this wall, while ${playedMove} weakens your containment.`
            : `La construction et le maintien d'une prime de ${board.longestPrime} portes consécutives paralyse les pions arrière de l'adversaire. Le coup ${optimalMove} consolide ce barrage, tandis que ${playedMove} affaiblit votre mur défensif.`;
        keyConcept = isEn ? 'Prime Construction' : 'Construction de Prime';
        advice = isEn
            ? 'Against trapped opponent checkers, extending your prime always trumps racing.'
            : 'Face à des pions adverses piégés, étendre votre prime prime toujours sur la course.';
    } else if (board.goldenPoint) {
        summary = isEn
            ? `Control of the 5-point (Golden Point) is paramount.`
            : `Le contrôle du Point 5 (Golden Point) est capital.`;
        explanation = isEn
            ? `The 5-point is the master key of the board. The move ${optimalMove} leverages this stronghold to block opponent escapes and secure your home board.`
            : `Le Point 5 est la porte maîtresse du plateau. Le coup ${optimalMove} capitalise sur ce point fort pour verrouiller l'échappée adverse et sécuriser votre jan intérieur.`;
        keyConcept = isEn ? 'Golden Point Control' : 'Contrôle du Golden Point';
        advice = isEn
            ? 'The 5-point is the cornerstone of both offense and defense.'
            : 'Le Point 5 est la clé de voûte de toute attaque et de toute défense.';
    } else if (board.advancedAnchor) {
        summary = isEn
            ? `The advanced anchor guarantees safety and restricts your opponent.`
            : `L'ancre avancée assure votre sécurité et bride l'adversaire.`;
        explanation = isEn
            ? `Holding an advanced anchor provides a safe landing spot and prevents your opponent from closing out their board. Playing ${optimalMove} preserves this crucial strategic connectivity.`
            : `Disposer d'une ancre avancée garantit un point d'atterrissage sûr et empêche l'adversaire de fermer son jan. Jouer ${optimalMove} maintient cette connectivité stratégique.`;
        keyConcept = isEn ? 'Advanced Anchor' : 'Ancre avancée';
        advice = isEn
            ? 'Never dismantle an advanced anchor without overwhelming immediate compensation.'
            : 'Ne démontez jamais une ancre avancée sans une compensation immédiate écrasante.';
    } else {
        explanation = isEn
            ? `The played move ${playedMove} loses valuable mobility pips compared to ${optimalMove}. In this position, the balance between checker connectivity and safety clearly favors the engine recommendation.`
            : `Le coup joué ${playedMove} cède de précieux pips de mobilité par rapport à ${optimalMove}. Dans cette position, l'équilibre entre connectivité des pions et sécurité penche nettement en faveur du coup recommandé par le moteur.`;
    }

    // Complément contextuel selon la situation du match
    if (matchContext) {
        const ctx = buildMatchContext(matchContext);
        if (ctx.isDMP) {
            explanation += isEn
                ? `\n\n🎯 DMP Context: You are 1 point away from victory. Gammons do not count (gammon price = 0.00). Only pure game victory decides the match.`
                : `\n\n🎯 Contexte DMP : Vous êtes à 1 point de la victoire. Les gammons ne comptent pas (prix du gammon = 0.00). Seule la victoire pure de la manche décide du match.`;
        } else if (ctx.crawford) {
            explanation += isEn
                ? `\n\n🛡️ Crawford Rule: The doubling cube is frozen for this game. Play without fear of an opponent redouble.`
                : `\n\n🛡️ Règle de Crawford : Le videau est gelé pour cette partie. Jouez sans craindre une relance de videau adverse.`;
        } else if (ctx.gammonPrice && ctx.gammonPrice.X > 0.6) {
            explanation += isEn
                ? `\n\n⚠️ Match Context: Gammon price is very high (${(ctx.gammonPrice.X * 100).toFixed(0)}%). Extreme caution against being gammoned is required.`
                : `\n\n⚠️ Contexte de match : Le prix du gammon est très élevé (${(ctx.gammonPrice.X * 100).toFixed(0)}%). La prudence absolue contre le gammon est requise.`;
        }
    }

    return {
        verdict,
        summary,
        explanation,
        keyConcept,
        advice,
    };
}
