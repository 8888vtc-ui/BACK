/**
 * @file src/lib/coach/socraticQuestionBuilder.ts
 * @description Générateur déterministe de Question Socratique (Méthode Michy / Magriel / Woolsey).
 * À partir des métriques exactes du moteur (`gamePhase`, `playerPips`, `opponentPips`, `pipDiff`,
 * `equityLoss`, `bestMoveNotation`, `concepts` de `positionClassifier.ts`), génère :
 *   a) Une question socratique ciblée (FR/EN selon `locale`) orientant l'œil vers l'indice décisif.
 *   b) 3 choix de Plan de Jeu interactifs adaptés à la position avec identification du choix optimal,
 *      explication immédiate en 1 phrase et analyse en 3 Piliers Grands-Maîtres.
 *
 * Strictement 0 `any`, < 280 lignes, 100 % pur et déterministe.
 */

import { classifyPosition, resolvePlayerPipLead } from './positionClassifier';
import { selectMichyOrMagrielProverb } from './michyProverbs';

export const SOCRATIC_EQUITY_LOSS_THRESHOLD = 0.02;

export type SocraticGamePlanId = 'race' | 'blitz' | 'prime';

export interface SocraticPlanOption {
    readonly id: SocraticGamePlanId;
    readonly label: string;
    readonly isOptimal: boolean;
    readonly feedback: string;
}

export interface GrandmasterThreePillars {
    readonly connectivity: string;
    readonly timingAndRace: string;
    readonly duplicationAndPurity: string;
}

export interface SocraticQuestionInput {
    readonly gamePhase?: string;
    readonly playerPips?: number;
    readonly opponentPips?: number;
    readonly pipDiff?: number;
    readonly equityLoss: number;
    readonly bestMoveNotation?: string;
    readonly playedMoveNotation?: string;
    readonly concepts?: ReadonlyArray<string>;
    readonly directShotsConceded?: number;
    readonly primeLength?: number;
    readonly homeBoardPointsMade?: number;
    readonly locale?: string;
}

export interface SocraticChallenge {
    readonly shouldTrigger: boolean;
    readonly question: string;
    readonly choices: readonly [string, string, string];
    readonly options: readonly [SocraticPlanOption, SocraticPlanOption, SocraticPlanOption];
    readonly optimalChoiceIndex: 0 | 1 | 2;
    readonly optimalChoice: string;
    readonly optimalPlanId: SocraticGamePlanId;
    readonly explanation: string;
    readonly threePillars: GrandmasterThreePillars;
    readonly proverb: string;
}

function hasAnyConcept(concepts: ReadonlySet<string>, candidates: ReadonlyArray<string>): boolean {
    for (const c of candidates) {
        if (concepts.has(c)) return true;
    }
    return false;
}

function resolveOptimalPlanId(
    input: SocraticQuestionInput,
    pipLead: number,
    conceptsSet: ReadonlySet<string>,
): SocraticGamePlanId {
    const bestMove = (input.bestMoveNotation ?? '').trim();
    const rawPhase = (input.gamePhase ?? '').toLowerCase();

    const isExplicitHit =
        bestMove.includes('*') ||
        rawPhase === 'blitz' ||
        hasAnyConcept(conceptsSet, ['blitz', 'blitz-attack', 'tempo-hit', 'attack', 'attaque', 'double-tiger']);
    if (isExplicitHit) {
        return 'blitz';
    }

    const isExplicitPrime =
        rawPhase === 'prime' ||
        rawPhase === 'holding' ||
        hasAnyConcept(conceptsSet, [
            'golden-point',
            'bar-point',
            'prime',
            'prime-vs-prime',
            'holding-game',
            'advanced-anchor',
            'construction',
            'point clé',
        ]) ||
        /\b(?:\d+|bar)\/(?:5|7|4|20|18)(?!\*)\(\d+\)/i.test(bestMove) ||
        /\b\d+\/(5|4|7)\s+\d+\/\1\b/.test(bestMove);

    const isExplicitRace =
        rawPhase === 'race' ||
        rawPhase === 'purerace' ||
        rawPhase === 'bearoff' ||
        /\boff\b/i.test(bestMove) ||
        /\b(?:24|23|22)\/1[345678]\b/.test(bestMove) ||
        hasAnyConcept(conceptsSet, [
            'race',
            'running-game',
            'keith-count',
            'trice-epc',
            'course',
            'évasion',
            'back-checker-escape',
        ]);

    if (rawPhase === 'race' || rawPhase === 'purerace' || rawPhase === 'bearoff' || /\boff\b/i.test(bestMove)) {
        return 'race';
    }
    if (isExplicitPrime && pipLead < 14) {
        return 'prime';
    }
    if (isExplicitRace || pipLead >= 12) {
        return 'race';
    }
    return 'prime';
}

function formatPipLeadClue(pipLead: number, playerPips: number, opponentPips: number, isEn: boolean): string {
    if (pipLead > 0) {
        return isEn
            ? `You have a +${pipLead} pip lead (${playerPips} vs ${opponentPips} pips)`
            : `Tu as +${pipLead} pips d'avance (${playerPips} vs ${opponentPips} pips)`;
    }
    if (pipLead < 0) {
        return isEn
            ? `You trail by ${Math.abs(pipLead)} pips (${playerPips} vs ${opponentPips} pips)`
            : `Tu as ${pipLead} pips de retard (${playerPips} vs ${opponentPips} pips)`;
    }
    return isEn
        ? `At an even ${playerPips} vs ${opponentPips} pip race`
        : `À égalité de course (${playerPips} vs ${opponentPips} pips)`;
}

function buildTargetedClue(
    optimalPlan: SocraticGamePlanId,
    bestMove: string,
    conceptsSet: ReadonlySet<string>,
    isEn: boolean,
): string {
    if (optimalPlan === 'blitz') {
        const hitsGolden = /\b(?:\d+|bar)\/(?:5|20)\*/i.test(bestMove) || conceptsSet.has('golden-point');
        if (hitsGolden) {
            return isEn
                ? 'the opponent 5-point blot is exposed to an immediate tempo hit'
                : 'le point 5 adverse est ouvert à une frappe d’initiative';
        }
        return isEn
            ? 'an exposed opponent blot invites a direct inner-board attack'
            : 'un blot adverse vulnérable offre une cible de frappe directe';
    }

    if (optimalPlan === 'race') {
        if (/\b(?:24|23|22)\/1[345678]\b/.test(bestMove) || conceptsSet.has('back-checker-escape')) {
            return isEn
                ? 'your back checker on point 24 can leap cleanly to the outfield'
                : 'ton pion arrière peut s’évader proprement hors du barrage adverse';
        }
        return isEn
            ? 'breaking contact safely locks in your racing equity without conceding shots'
            : 'rompre le contact sans laisser de tir verrouille ton avance à la course';
    }

    if (/\b(?:\d+|bar)\/(?:5|20)\b/i.test(bestMove) || conceptsSet.has('golden-point')) {
        return isEn
            ? 'the Golden Point (5-point) is open to be locked down by your builders'
            : 'le Golden Point (point 5) est ouvert et constructible avec tes bâtisseurs';
    }
    if (/\b(?:\d+|bar)\/(?:7|18)\b/i.test(bestMove) || conceptsSet.has('bar-point')) {
        return isEn
            ? 'the Bar Point (7-point) is open to form a prime barricade'
            : 'le Bar Point (point 7) est ouvert pour verrouiller ta muraille de prime';
    }
    return isEn
        ? 'consolidating your key points and minimizing direct shots is critical'
        : 'consolider tes portes maîtresses sans concéder de tir direct est décisif';
}

/**
 * Construit la Question Socratique interactive, les 3 choix de Plan de Jeu et les 3 Piliers Grands-Maîtres.
 */
export function buildSocraticQuestion(input: SocraticQuestionInput): SocraticChallenge {
    const isEn = (input.locale ?? 'fr').toLowerCase().startsWith('en');
    const absLoss = Math.abs(Number.isFinite(input.equityLoss) ? input.equityLoss : 0);
    const shouldTrigger = absLoss > SOCRATIC_EQUITY_LOSS_THRESHOLD;

    const playerPips = input.playerPips ?? 140;
    const opponentPips = input.opponentPips ?? 140;
    const pipLead = resolvePlayerPipLead({
        playerPips: input.playerPips,
        opponentPips: input.opponentPips,
        pipDiff: input.pipDiff,
    });

    const classification = classifyPosition({
        gamePhase: input.gamePhase,
        playerPips,
        opponentPips,
        pipDiff: pipLead,
        bestMoveNotation: input.bestMoveNotation,
        playedMoveNotation: input.playedMoveNotation,
        directShotsConceded: input.directShotsConceded,
        primeLength: input.primeLength,
        homeBoardPointsMade: input.homeBoardPointsMade,
        concepts: input.concepts,
    });

    const conceptsLower = new Set(classification.concepts.map((c) => c.toLowerCase()));
    const bestMove = (input.bestMoveNotation ?? '').trim() || (isEn ? 'the engine #1 move' : 'le coup n°1 du moteur');
    const optimalPlanId = resolveOptimalPlanId(input, pipLead, conceptsLower);

    const leadPrefix = formatPipLeadClue(pipLead, playerPips, opponentPips, isEn);
    const boardClue = buildTargetedClue(optimalPlanId, bestMove, conceptsLower, isEn);

    const question = isEn
        ? `${leadPrefix} and ${boardClue}: what is your priority game plan here?`
        : `${leadPrefix} et ${boardClue} : quel est ton plan de jeu prioritaire ici ?`;

    const choices: readonly [string, string, string] = isEn
        ? ['Pure Race (Race)', 'Attack / Blitz', 'Prime / Containment']
        : ['Course pure (Race)', 'Attaque / Blitz', 'Prime / Contention'];

    const optimalChoiceIndex: 0 | 1 | 2 = optimalPlanId === 'race' ? 0 : optimalPlanId === 'blitz' ? 1 : 2;

    const proverbEntry = selectMichyOrMagrielProverb({
        theme: classification.dominantTheme,
        bestMoveNotation: bestMove,
        directShotsAfter: input.directShotsConceded,
        primeLength: input.primeLength,
        playerPipCount: playerPips,
        opponentPipCount: opponentPips,
    });

    const explanation =
        optimalPlanId === 'race'
            ? isEn
                ? `Magriel's Safe vs Bold Rule: with ${bestMove}, prioritize pure racing efficiency and break contact cleanly (saves ${absLoss.toFixed(3)} Eq).`
                : `Règle Safe vs Bold de Magriel : avec ${bestMove}, privilégie la course pure et romps le contact sans offrir de tir (+${absLoss.toFixed(3)} Eq).`
            : optimalPlanId === 'blitz'
              ? isEn
                  ? `Michy's Blitz Principle: playing ${bestMove} seizes tempo by hitting the vulnerable blot and suffocating opponent reentry (saves ${absLoss.toFixed(3)} Eq).`
                  : `Principe de Blitz de Michy : jouer ${bestMove} saisit l’initiative en frappant le blot adverse pour écraser son tempo (+${absLoss.toFixed(3)} Eq).`
              : isEn
                ? `Michy & Woolsey Structure Rule: playing ${bestMove} locks down your prime/anchor structure and maximizes checker connectivity (saves ${absLoss.toFixed(3)} Eq).`
                : `Règle de Structure Michy & Woolsey : jouer ${bestMove} verrouille ta prime/porte clé et maximise la connectivité de tes pions (+${absLoss.toFixed(3)} Eq).`;

    const options: readonly [SocraticPlanOption, SocraticPlanOption, SocraticPlanOption] = [
        {
            id: 'race',
            label: choices[0],
            isOptimal: optimalPlanId === 'race',
            feedback:
                optimalPlanId === 'race'
                    ? explanation
                    : isEn
                      ? `Incorrect ❌: Racing blindly ignores tactical board control — ${bestMove} prioritizes ${choices[optimalChoiceIndex]}.`
                      : `Incorrect ❌ : Courir aveuglément néglige la géométrie du plateau — ${bestMove} impose le plan ${choices[optimalChoiceIndex]}.`,
        },
        {
            id: 'blitz',
            label: choices[1],
            isOptimal: optimalPlanId === 'blitz',
            feedback:
                optimalPlanId === 'blitz'
                    ? explanation
                    : isEn
                      ? `Incorrect ❌: Over-attacking scatters your structure and concedes return shots — ${bestMove} favors ${choices[optimalChoiceIndex]}.`
                      : `Incorrect ❌ : Chercher l’attaque disperse tes pions et concède des contre-tirs — ${bestMove} privilégie ${choices[optimalChoiceIndex]}.`,
        },
        {
            id: 'prime',
            label: choices[2],
            isOptimal: optimalPlanId === 'prime',
            feedback:
                optimalPlanId === 'prime'
                    ? explanation
                    : isEn
                      ? `Incorrect ❌: Passive priming misses the urgent tempo — ${bestMove} executes ${choices[optimalChoiceIndex]}.`
                      : `Incorrect ❌ : Un jeu lent de contention manque l’urgence tactique — ${bestMove} exécute le plan ${choices[optimalChoiceIndex]}.`,
        },
    ];

    const shots = input.directShotsConceded ?? 0;
    const threePillars: GrandmasterThreePillars = isEn
        ? {
              connectivity: `Connectivity (Michy / Magriel): ${bestMove} keeps checkers within 6-pip mutual support and secures key structural points (${proverbEntry.name}).`,
              timingAndRace: `Timing & Race (Trice / Magriel): At ${playerPips} vs ${opponentPips} pips (${pipLead >= 0 ? `+${pipLead}` : pipLead} pips), ${pipLead >= 8 ? 'Magriel dictates safe contact-breaking' : 'maintain timing to outlast the opponent structure'}.`,
              duplicationAndPurity: `Duplication & Purity (Mochy / Woolsey): Pure ${choices[optimalChoiceIndex]} execution (${shots}/36 direct shots) avoids impure hybrid plays (-${absLoss.toFixed(3)} Eq).`,
          }
        : {
              connectivity: `Connectivité (Michy / Magriel) : ${bestMove} maintient tes pions à portée mutuelle (< 6 cases) et verrouille les portes maîtresses (${proverbEntry.name}).`,
              timingAndRace: `Timing & Course (Trice / Magriel) : À ${playerPips} contre ${opponentPips} pips (${pipLead >= 0 ? `+${pipLead}` : pipLead} pips), ${pipLead >= 8 ? 'la règle de Magriel impose la sécurité et la fuite' : 'préserve ton timing pour étouffer la structure adverse'}.`,
              duplicationAndPurity: `Duplication & Pureté (Mochy / Woolsey) : La pureté du plan « ${choices[optimalChoiceIndex]} » (${shots}/36 tirs directs) élimine toute perte d’équité hybride (-${absLoss.toFixed(3)} Eq).`,
          };

    return {
        shouldTrigger,
        question,
        choices,
        options,
        optimalChoiceIndex,
        optimalChoice: choices[optimalChoiceIndex],
        optimalPlanId,
        explanation,
        threePillars,
        proverb: isEn ? proverbEntry.proverbEn : proverbEntry.proverbFr,
    };
}

export const generateSocraticQuestion = buildSocraticQuestion;
export default buildSocraticQuestion;
