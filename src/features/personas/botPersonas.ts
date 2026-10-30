/**
 * Écosystème des 4 Bots Personnifiés & Mode Adaptatif (« UI Caméléon » : S'amuser vs Pro).
 * Conforme à SCALABILITY.md (≤ 400 lignes, 0 any, fonctions pures).
 */

import type { AIDifficulty } from '../../engine/aiHeuristics';

export type ExperienceMode = 'fun' | 'pro';

/** Plafond d'affichage temps réel de l'Error Rate (PR) des Bots (max 10.0). */
export const MAX_BOT_DISPLAY_PR = 10.0;

/** Plafond strict de perte d'équité par coup (Blunder Cap ΔE_max en EMG) par niveau. */
export const BLUNDER_CAP_EMG_BY_DIFFICULTY: Record<AIDifficulty, number> = {
    beginner: 0.16,
    intermediate: 0.085,
    expert: 0.035,
    grandmaster: 0.0,
};

export interface BotPersonaTurnLike {
    readonly player: 'X' | 'O';
    readonly dice: readonly [number, number] | ReadonlyArray<number>;
    readonly boardBefore: ReadonlyArray<number>;
    readonly boardAfter: ReadonlyArray<number>;
}

export interface BotPersonaSpec {
    readonly id: AIDifficulty;
    readonly name: string;
    readonly shortName: string;
    readonly archetypeTitle: string;
    readonly avatar: string;
    readonly lobbyHint: string;
    readonly styleBadge: string;
    readonly skillTaught: string;
    /** Error Rate (PR) nominal du Bot (plafonné à 10.0). */
    readonly targetErrorRate: number;
    readonly weights: {
        readonly hitBonus: number;
        readonly ownBlotPenalty: number;
        readonly primeBonus: number;
        readonly anchorBonus: number;
        readonly raceBonus: number;
    };
    readonly dialogues: {
        readonly opening: Record<ExperienceMode, string>;
        readonly playerDoubleRoll: Record<ExperienceMode, string>;
        readonly playerBlunder: Record<ExperienceMode, string>;
        readonly playerOptimal: Record<ExperienceMode, string>;
        readonly botHitPlayer: Record<ExperienceMode, string>;
    };
}

const EXPERIENCE_MODE_STORAGE_KEY = 'bg_experience_mode_v1';

export const BOT_PERSONAS_BY_DIFFICULTY: Record<AIDifficulty, BotPersonaSpec> = {
    beginner: {
        id: 'beginner',
        name: 'Maxime « Le Mauvais Joueur »',
        shortName: 'Le Mauvais Joueur',
        archetypeTitle: 'Colérique Théâtral & Blitz Agressif',
        avatar: '🤬',
        lobbyHint: 'Maxime · Blitz & Mauvaise foi',
        styleBadge: 'Blitz Ultra-Agressif',
        skillTaught: 'Punir la sur-agressivité & gérer la barre',
        targetErrorRate: 7.8,
        weights: { hitBonus: 0.22, ownBlotPenalty: -0.01, primeBonus: 0.01, anchorBonus: 0.0, raceBonus: -0.02 },
        dialogues: {
            opening: {
                fun: "Prépare-toi ! Aujourd'hui les dés sont avec moi, je vais chasser chacun de tes pions isolés !",
                pro: 'Mode Blitz engagé. Voyons si ta défense du jan intérieur résiste à une pression maximale sur le tempo.',
            },
            playerDoubleRoll: {
                fun: 'Encore un double ?! C’est statistiquement absurde, tu as soudoyé le serveur SHA-256 ou quoi ?!',
                pro: 'Un Huge Joker pile sur ce tempo ?! Même le générateur Provably Fair complote contre mon Blitz !',
            },
            playerBlunder: {
                fun: 'Oh oui, laisse ce pion exposé devant mes portes, je me frotte déjà les mains ! (Clique sur Reprendre si tu veux te protéger !)',
                pro: 'Attention, cette ligne lâche de l’équité EMG en m’offrant des tirs directs gratuits au prochain jet.',
            },
            playerOptimal: {
                fun: 'Pfff, tu fermes pile la porte que je visais... Tu as de la chance que mes dés dorment !',
                pro: 'Coup optimal (0 perte EMG). Tu verrouilles mes tirs directs et conserves l’initiative.',
            },
            botHitPlayer: {
                fun: 'BAM ! Direction la barre ! Tu croyais vraiment que j’allais laisser ce pion tout seul tranquille ?',
                pro: 'Frappe directe sur le tempo : tu perds 22 pips à la course et l’initiative sur le jan.',
            },
        },
    },
    intermediate: {
        id: 'intermediate',
        name: 'Sofia « La Joueuse Riviera »',
        shortName: 'Sofia « La Riviera »',
        archetypeTitle: 'Charme Monte-Carlo & Jeu de Pièges',
        avatar: '🕶️',
        lobbyHint: 'Sofia · Pièges & Holding Monte-Carlo',
        styleBadge: 'Holding Game & Appâts',
        skillTaught: 'Déjouer les pions appâts & gérer une ancre',
        targetErrorRate: 4.2,
        weights: { hitBonus: 0.06, ownBlotPenalty: -0.02, primeBonus: 0.04, anchorBonus: 0.16, raceBonus: 0.0 },
        dialogues: {
            opening: {
                fun: 'Bonsoir ! Une partie sous les lustres de Monte-Carlo ? Promis, mes pions isolés sont... presque tous innocents.',
                pro: 'Voyons comment tu gères ton timing face à une ancre haute et des pions appâts calculés.',
            },
            playerDoubleRoll: {
                fun: 'Oh, quel lancer audacieux ! Les dés ont visiblement un faible pour toi ce soir.',
                pro: 'Un double à haute équité qui résout élégamment ta sortie d’arrière-garde.',
            },
            playerBlunder: {
                fun: 'Un conseil d’amie : ce coup découvre ta maison alors que mon ancre attend dans l’ombre. Tu veux le rejouer ?',
                pro: 'Piège tactique : ce coup dégrade ton équité EMG en exposant ta structure à une contre-attaque depuis mon ancre.',
            },
            playerOptimal: {
                fun: 'Élégant et prudent ! Tu n’es pas tombé dans mon petit piège sur ce tour.',
                pro: 'Lecture chirurgicale : tu refuses l’appât et préserves la pureté de ta structure.',
            },
            botHitPlayer: {
                fun: 'Tu as mordu à l’appât ! Ce pion semblait vulnérable, mais mon ancre attendait ton ouverture.',
                pro: 'Contre-attaque depuis le point d’ancrage : ton timing recule pendant que ma structure tient.',
            },
        },
    },
    expert: {
        id: 'expert',
        name: 'Victor « L’Homme d’Affaires »',
        shortName: 'L’Homme d’Affaires',
        archetypeTitle: 'Stratège High-Roller, Course & Videau',
        avatar: '💼',
        lobbyHint: 'Victor · Videau & Course High-Roller',
        styleBadge: 'Course Pure & Videau Actif',
        skillTaught: 'Maîtrise du Videau (Take/Pass 25%) & Course',
        targetErrorRate: 1.8,
        weights: { hitBonus: 0.03, ownBlotPenalty: -0.12, primeBonus: 0.04, anchorBonus: 0.02, raceBonus: 0.18 },
        dialogues: {
            opening: {
                fun: 'Le temps c’est de l’équité ! Surveille la course et prépare-toi à négocier le Videau comme un contrat.',
                pro: 'Marché ouvert. On joue l’espérance mathématique pure : chaque pip et chaque fenêtre de Cube comptent.',
            },
            playerDoubleRoll: {
                fun: 'Sacré dividende sur ce lancer ! Ton portefeuille de pips vient de bondir d’un coup.',
                pro: 'Volatilité maximale : ce double déplace brusquement la fenêtre de Cube en ta faveur.',
            },
            playerBlunder: {
                fun: 'Halte là, mauvais investissement ! Tu exposes ton capital sans couverture. Reprends ce coup tant qu’il est temps !',
                pro: 'Erreur d’allocation EMG : mauvaise gestion du ratio risque/rendement par rapport à la ligne optimale.',
            },
            playerOptimal: {
                fun: 'Investissement rentable ! Tu sécurises tes pions avec un retour sur investissement impeccable.',
                pro: 'Exécution optimale : tu maximises l’équité sans gammon et consolides ton différentiel de course.',
            },
            botHitPlayer: {
                fun: 'Liquidation immédiate de ton pion isolé ! Ça te coûte 20 pips de pénalité au bilan.',
                pro: 'Opération à ROI positif : gain net au différentiel de course et neutralisation de ton tempo.',
            },
        },
    },
    grandmaster: {
        id: 'grandmaster',
        name: 'Viktor « L’Intellectuel »',
        shortName: 'Viktor « L’Intellectuel »',
        archetypeTitle: 'Philosophe Grand-Maître & Architecte 5-Prime',
        avatar: '🧐',
        lobbyHint: 'Viktor · Barricade 3-ply & Mentor',
        styleBadge: 'Jeu Positionnel & Barricade (Prime)',
        skillTaught: 'Probabilités sur 36, constructeurs & 5-Prime',
        targetErrorRate: 0.3,
        weights: { hitBonus: 0.07, ownBlotPenalty: -0.08, primeBonus: 0.20, anchorBonus: 0.06, raceBonus: 0.05 },
        dialogues: {
            opening: {
                fun: 'Comme l’écrivait Sun Tzu, la victoire se construit avant la bataille. Construisons nos portes avec harmonie.',
                pro: 'Concentrons-nous sur la pureté structurelle : duplication des dés, constructeurs et contrôle du point 5.',
            },
            playerDoubleRoll: {
                fun: 'Le hasard sourit aux esprits préparés ! Ce double ne représentait que 1 chance sur 36, savoure-le.',
                pro: 'Événement à haute équité qui résout ta duplication. La variance fait toute la poésie du Backgammon.',
            },
            playerBlunder: {
                fun: 'Un instant ! Si tu joues ainsi, tu affaiblis ta barricade et m’offres une route d’évasion. Veux-tu reconsidérer ?',
                pro: 'Perte d’équité significative : la ligne optimale préservait tes constructeurs et maximisait la couverture sur 36.',
            },
            playerOptimal: {
                fun: 'Belle harmonie géométrique ! Tes pions se protègent mutuellement comme une vraie phalange.',
                pro: 'Précision Grand-Maître : couverture optimale des constructeurs et duplication parfaite des tirs adverses.',
            },
            botHitPlayer: {
                fun: 'En laissant ce pion à portée directe, tu m’offrais plus de 11 combinaisons sur 36 de te frapper.',
                pro: 'Frappe positionnelle permettant de verrouiller le tempo tout en préparant la fermeture du Prime.',
            },
        },
    },
};

export function getBotPersona(difficulty: AIDifficulty = 'expert'): BotPersonaSpec {
    return BOT_PERSONAS_BY_DIFFICULTY[difficulty] ?? BOT_PERSONAS_BY_DIFFICULTY.expert;
}

export function readStoredExperienceMode(): ExperienceMode {
    if (typeof window === 'undefined') return 'fun';
    try {
        return window.localStorage.getItem(EXPERIENCE_MODE_STORAGE_KEY) === 'pro' ? 'pro' : 'fun';
    } catch {
        return 'fun';
    }
}

export function storeExperienceMode(mode: ExperienceMode): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(EXPERIENCE_MODE_STORAGE_KEY, mode);
    } catch { /* ignore quota */ }
}

/**
 * Verrou d'évidence visuelle (« First-Principles Obvious Move Lock ») :
 * Impose le coup optimal (#1) même aux bots Débutant/Intermédiaire s'il ferme le Point d'Or (5/20)
 * ou le Point de Barre (7/18) sans créer de blot supplémentaire, ou frappe dans le jan intérieur en sécurité.
 */
export function isVisuallyObviousBestMove(
    boardBefore: ReadonlyArray<number>,
    bestBoardAfter: ReadonlyArray<number>,
    player: 'X' | 'O' = 'O',
): boolean {
    const goldenPt = player === 'X' ? 5 : 20;
    const barPt = player === 'X' ? 7 : 18;
    const isMade = (b: ReadonlyArray<number>, pt: number) => (player === 'X' ? (b[pt] ?? 0) >= 2 : (b[pt] ?? 0) <= -2);
    const countOwnBlots = (b: ReadonlyArray<number>) => {
        let blots = 0;
        for (let p = 1; p <= 24; p++) if (b[p] === (player === 'X' ? 1 : -1)) blots++;
        return blots;
    };
    const blotsDidNotIncrease = countOwnBlots(bestBoardAfter) <= countOwnBlots(boardBefore);
    if (blotsDidNotIncrease && ((!isMade(boardBefore, goldenPt) && isMade(bestBoardAfter, goldenPt)) || (!isMade(boardBefore, barPt) && isMade(bestBoardAfter, barPt)))) {
        return true;
    }
    const oppBarIdx = player === 'X' ? 25 : 0;
    const hitOpponent = Math.abs(bestBoardAfter[oppBarIdx] ?? 0) > Math.abs(boardBefore[oppBarIdx] ?? 0);
    return hitOpponent && blotsDidNotIncrease;
}

/**
 * Calcule le bonus/malus tactique déterministe propre à la personnalité du Bot (`O` = négatif dans `board[1..24]`).
 */
export function computePersonaBiasDelta(
    boardBefore: ReadonlyArray<number>,
    boardAfter: ReadonlyArray<number>,
    difficulty: AIDifficulty,
): number {
    const w = getBotPersona(difficulty).weights;
    const hitsMade = Math.max(0, (boardAfter[0] ?? 0) - (boardBefore[0] ?? 0));
    let botBlots = 0;
    let botAnchorsInPlayerHome = 0;
    let maxBotPrime = 0;
    let currentPrime = 0;
    let candlesticks = 0;

    for (let pt = 1; pt <= 24; pt++) {
        const val = boardAfter[pt] ?? 0;
        if (val === -1) botBlots++;
        if (val <= -6) candlesticks++;
        if (val <= -2) {
            currentPrime++;
            if (currentPrime > maxBotPrime) maxBotPrime = currentPrime;
            if (pt <= 6) botAnchorsInPlayerHome++;
        } else {
            currentPrime = 0;
        }
    }

    const candlestickBias = difficulty === 'beginner' ? candlesticks * 0.015 : candlesticks * -0.02;
    return (
        hitsMade * w.hitBonus +
        botBlots * w.ownBlotPenalty +
        Math.max(0, maxBotPrime - 2) * w.primeBonus +
        botAnchorsInPlayerHome * w.anchorBonus +
        candlestickBias
    );
}

/**
 * Calcule en temps réel l'Error Rate (PR) du Bot à partir des coups joués dans `matchLog`,
 * reflétant le caractère tactique de chaque persona tout en plafonnant strictement à `MAX_BOT_DISPLAY_PR` (10.0).
 */
export function computeRealtimeBotErrorRate(
    matchLog: ReadonlyArray<BotPersonaTurnLike> | undefined | null,
    difficulty: AIDifficulty = 'expert',
): number {
    const persona = getBotPersona(difficulty);
    const basePr = Math.min(MAX_BOT_DISPLAY_PR, persona.targetErrorRate);
    const botTurns = (matchLog ?? []).filter((t) => t.player === 'O');
    if (botTurns.length === 0) return basePr;

    let cumulativePr = 0;
    for (let i = 0; i < botTurns.length; i++) {
        const turn = botTurns[i];
        const biasDelta = computePersonaBiasDelta(turn.boardBefore, turn.boardAfter, difficulty);
        const blotsLeft = turn.boardAfter.slice(1, 25).filter((v) => v === -1).length;
        const turnPr = basePr + (blotsLeft - 1.5) * 0.25 - biasDelta * 1.8;
        cumulativePr += Math.max(0.1, Math.min(MAX_BOT_DISPLAY_PR, turnPr));
    }
    const livePr = (basePr + cumulativePr) / (botTurns.length + 1);
    return Number(Math.max(0.1, Math.min(MAX_BOT_DISPLAY_PR, livePr)).toFixed(1));
}

const APPSTORE_GUARDRAIL_REGEX = /\b(sex|nude|nsfw|idiot|stupide|con|merde|insulte|téléphone|rendez-vous)\b/i;

/** Génère une réponse interactive du Bot dans le chat avec filtrage strict App Store Section 1.2 */
export function generateBotChatReply(
    userMessage: string,
    difficulty: AIDifficulty,
    mode: ExperienceMode,
    prX?: number | null,
): { readonly text: string; readonly filteredByGuardrail: boolean } {
    const persona = getBotPersona(difficulty);
    const clean = userMessage.trim();
    if (APPSTORE_GUARDRAIL_REGEX.test(clean)) {
        return {
            filteredByGuardrail: true,
            text: difficulty === 'intermediate'
                ? 'Restons élégants, nous sommes au salon privé de Monte-Carlo ! Concentrons-nous plutôt sur tes portes et ton prochain lancer.'
                : 'Gardons l’esprit sportif autour du plateau ! Concentrons-nous sur la stratégie de ce tour.',
        };
    }
    const lower = clean.toLowerCase();
    if (lower.includes('dé') || lower.includes('triche') || lower.includes('truqué') || lower.includes('chance')) {
        return {
            filteredByGuardrail: false,
            text: difficulty === 'beginner'
                ? 'Ah, toi aussi tu trouves que ces dés sont louches ?! Ouvre « 🛡️ Audit Dés » en haut et teste l’inversion des dés, tu verras que c’est moi la victime !'
                : 'Zéro triche ici : chaque lancer est scellé par HMAC-SHA256 avant la partie. Clique sur « 🛡️ Audit Dés » pour comparer ou inverser nos tirages !',
        };
    }
    if (lower.includes('videau') || lower.includes('double') || lower.includes('cube')) {
        return {
            filteredByGuardrail: false,
            text: mode === 'pro'
                ? 'Règle du Videau : en Money Game, le seuil d’acceptation (Take Point) est à 21,5 % – 25 % de chances de gain nettes de gammons. Double dès que tu dépasses 65 % avec volatilité.'
                : 'Le Videau permet de doubler la mise quand tu as un bon avantage ! Si l’adversaire a peur et refuse, tu gagnes tout de suite.',
        };
    }
    if (lower.includes('conseil') || lower.includes('aide') || lower.includes('jouer') || lower.includes('avis')) {
        const prInfo = typeof prX === 'number' ? ` (ton PR actuel est de ${prX.toFixed(1)})` : '';
        return {
            filteredByGuardrail: false,
            text: mode === 'pro'
                ? `${persona.shortName}${prInfo} : surveille mon biais « ${persona.styleBadge} ». Évite de me laisser des tirs directs à moins de 6 cases et verrouille ton point 5.`
                : `Astuce de ${persona.shortName} : essaie toujours de poser 2 pions sur la même flèche pour créer une porte infranchissable !`,
        };
    }
    return {
        filteredByGuardrail: false,
        text: mode === 'pro'
            ? `${persona.shortName} (${persona.styleBadge}) : j’analyse chaque écart d’équité EMG. Joue ton coup et voyons si tu tiens la cadence !`
            : `${persona.shortName} : ${persona.dialogues.opening.fun}`,
    };
}

export interface SwapDiceComparisonSummary {
    readonly playerRollsCount: number;
    readonly botRollsCount: number;
    readonly playerTotalPips: number;
    readonly botTotalPips: number;
    readonly playerDoubles: number;
    readonly botDoubles: number;
    readonly verdictText: string;
}

/** Calcule le bilan comparatif et l'effet d'inversion des dés (Swap Dice) entre le Joueur (tours pairs) et le Bot (tours impairs) */
export function computeSwapDiceComparison(
    rolls: ReadonlyArray<{ readonly die1: number; readonly die2: number }>,
): SwapDiceComparisonSummary {
    let playerRollsCount = 0, botRollsCount = 0, playerTotalPips = 0, botTotalPips = 0, playerDoubles = 0, botDoubles = 0;
    rolls.forEach((r, idx) => {
        const isDouble = r.die1 === r.die2;
        const pips = isDouble ? (r.die1 + r.die2) * 2 : r.die1 + r.die2;
        if (idx % 2 === 0) {
            playerRollsCount++;
            playerTotalPips += pips;
            if (isDouble) playerDoubles++;
        } else {
            botRollsCount++;
            botTotalPips += pips;
            if (isDouble) botDoubles++;
        }
    });
    const diff = playerTotalPips - botTotalPips;
    const verdictText = diff >= 0
        ? `En inversant les dés avec le Bot, vous auriez reçu ${botTotalPips} pips (${botDoubles} double(s)) contre vos ${playerTotalPips} pips (${playerDoubles} double(s)) : les dés ne vous ont pas désavantagé !`
        : `En inversant les dés avec le Bot, vous auriez reçu +${Math.abs(diff)} pips de course supplémentaires (${botTotalPips} pips contre ${playerTotalPips}), mais rappelez-vous que c’est le placement des portes qui convertit les dés en victoire !`;
    return { playerRollsCount, botRollsCount, playerTotalPips, botTotalPips, playerDoubles, botDoubles, verdictText };
}
