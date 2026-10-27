/**
 * Système des Rivaux IA Incarnés (Boss Ladder) & Réactions Dynamiques (< 170 lignes, 0 any).
 *
 * Donne une identité charismatique, un archétype tactique, un PR cible et des
 * réactions contextuelles temps réel à chaque niveau d'IA pour maximiser
 * l'engagement émotionnel et l'addiction saine du joueur.
 */

import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import type { CoachAnalysisHistoryEntry } from '../../hooks/useCoachHelpers';

export interface AiRivalPersona {
    readonly id: AIDifficulty;
    readonly name: string;
    readonly titleFr: string;
    readonly titleEn: string;
    readonly avatar: string;
    readonly targetPr: number;
    readonly archetypeFr: string;
    readonly archetypeEn: string;
    readonly quotesFr: {
        readonly greeting: string;
        readonly onPlayerBrilliant: string;
        readonly onPlayerStreak: string;
        readonly onPlayerBlunder: string;
        readonly onHighStakesCube: string;
    };
    readonly quotesEn: {
        readonly greeting: string;
        readonly onPlayerBrilliant: string;
        readonly onPlayerStreak: string;
        readonly onPlayerBlunder: string;
        readonly onHighStakesCube: string;
    };
}

export const AI_RIVALS_BY_DIFFICULTY: Readonly<Record<AIDifficulty, AiRivalPersona>> = {
    beginner: {
        id: 'beginner',
        name: 'Léo',
        titleFr: 'Le Joueur de Café',
        titleEn: 'The Café Hustler',
        avatar: '☕',
        targetPr: 14.5,
        archetypeFr: 'Chasseur de blots impulsif',
        archetypeEn: 'Impulsive blot hunter',
        quotesFr: {
            greeting: 'Un café et une partie rapide ? Je frappe tout ce qui bouge !',
            onPlayerBrilliant: "Oulah !! Ce coup de génie, je ne l'avais pas vu venir !",
            onPlayerStreak: 'Hé ! Tu enchaînes les coups parfaits, laisse-moi respirer !',
            onPlayerBlunder: 'Haha ! Une ouverture pareille, je ne vais pas la rater !',
            onHighStakesCube: "Quoi, on monte les enchères ?! Allez, j'adore le risque !",
        },
        quotesEn: {
            greeting: 'Quick coffee and a fast match? I hit every blot I see!',
            onPlayerBrilliant: 'Whoa!! I never saw that brilliant move coming!',
            onPlayerStreak: 'Hey! You are chaining perfect moves, give me a break!',
            onPlayerBlunder: 'Aha! Leaving an opening like that is a gift!',
            onHighStakesCube: 'Raising the stakes already?! Let us roll!',
        },
    },
    intermediate: {
        id: 'intermediate',
        name: 'Sofia',
        titleFr: 'La Reine du Videau',
        titleEn: 'Queen of the Cube',
        avatar: '🎯',
        targetPr: 7.5,
        archetypeFr: 'Spécialiste Fenêtre de Marché (Janowski)',
        archetypeEn: 'Market Window Specialist (Janowski)',
        quotesFr: {
            greeting: 'Gare à ta fenêtre de marché : si tu hésites à doubler, je prends les commandes.',
            onPlayerBrilliant: 'Superbe lecture d’équité (!!). Même Janowski applaudirait.',
            onPlayerStreak: 'Ta série optimale réduit ma fenêtre de tir à néant…',
            onPlayerBlunder: 'Cette imprécision m’offre exactement le Take Point que j’attendais.',
            onHighStakesCube: 'La volatilité explose ! Voyons si tu connais ton seuil de prise.',
        },
        quotesEn: {
            greeting: 'Watch your market window: hesitate on the cube and I take over.',
            onPlayerBrilliant: 'Superb equity read (!!). Even Janowski would applaud.',
            onPlayerStreak: 'Your optimal streak is shrinking my market window to zero…',
            onPlayerBlunder: 'That inaccuracy gives me the exact Take Point I needed.',
            onHighStakesCube: 'Volatility is spiking! Let us test your Take Point.',
        },
    },
    expert: {
        id: 'expert',
        name: 'Maître Kenji Sato',
        titleFr: "L'Architecte de Primes",
        titleEn: 'The Prime Architect',
        avatar: '🏯',
        targetPr: 3.5,
        archetypeFr: 'Maître des Primes & Géométrie Pure',
        archetypeEn: 'Prime & Pure Geometry Master',
        quotesFr: {
            greeting: 'Qui contrôle le Point d’Or (5) contrôle la destinée du match.',
            onPlayerBrilliant: 'Coup Brillant (!!) ! Tu as trouvé la seule géométrie pure sur le plateau.',
            onPlayerStreak: 'Ta discipline structurelle est digne d’une finale Championship.',
            onPlayerBlunder: 'Tu as affaibli ta structure sans couverture… Ma prime se referme.',
            onHighStakesCube: 'Le videau monte : chaque pip de gaspillage (EPC) comptera double.',
        },
        quotesEn: {
            greeting: 'Who controls the Golden Point (5) controls the fate of the match.',
            onPlayerBrilliant: 'Brilliant Move (!!)! You found the only pure geometry on the board.',
            onPlayerStreak: 'Your structural discipline is worthy of a Championship final.',
            onPlayerBlunder: 'You weakened your structure without cover… My prime is closing in.',
            onHighStakesCube: 'Stakes are rising: every wasted EPC pip now costs double.',
        },
    },
    grandmaster: {
        id: 'grandmaster',
        name: 'Viktor Orlov',
        titleFr: "L'Oracle de Monte-Carlo",
        titleEn: 'The Monte-Carlo Oracle',
        avatar: '👑',
        targetPr: 1.2,
        archetypeFr: 'Équité Cubeful Pure (PR < 1.5)',
        archetypeEn: 'Pure Cubeful Equity (PR < 1.5)',
        quotesFr: {
            greeting: 'Équité initialisée. Seule la perfection mathématique survivra à cette table.',
            onPlayerBrilliant: 'Exceptionnel (!!). La seule ligne qui préservait 100% de ton équité cubeful.',
            onPlayerStreak: 'Série Grand-Maître détectée (ΔE = 0.000). Tu joues au niveau mondial.',
            onPlayerBlunder: 'Perte d’équité critique détectée. Mon avantage cubeful bascule.',
            onHighStakesCube: 'Haute tension cubeful : le prix du gammon dicte toute la géométrie.',
        },
        quotesEn: {
            greeting: 'Equity initialized. Only mathematical perfection survives at this table.',
            onPlayerBrilliant: 'Exceptional (!!). The only line preserving 100% of your cubeful equity.',
            onPlayerStreak: 'Grandmaster streak detected (ΔE = 0.000). World-class play.',
            onPlayerBlunder: 'Critical equity loss detected. Cubeful advantage shifting.',
            onHighStakesCube: 'High cubeful tension: gammon price now dictates the geometry.',
        },
    },
};

export interface DopamineMetricsSummary {
    readonly optimalStreak: number;
    readonly isBrilliantMove: boolean;
    readonly brilliantMarginEq: number;
    readonly lastVerdict: 'optimal' | 'good' | 'inaccuracy' | 'blunder' | null;
    readonly worstBlunderEntry: CoachAnalysisHistoryEntry | null;
}

/**
 * Extrait en temps réel le combo de coups optimaux, la détection de « Coup Brillant !! »
 * (seul coup optimal où le 2e candidat perd >= 0.060 Eq) et la pire gaffe (pour le Défi Ghost).
 */
export function computeDopamineMetricsFromHistory(
    coachHistory: ReadonlyArray<CoachAnalysisHistoryEntry>,
): DopamineMetricsSummary {
    if (coachHistory.length === 0) {
        return {
            optimalStreak: 0,
            isBrilliantMove: false,
            brilliantMarginEq: 0,
            lastVerdict: null,
            worstBlunderEntry: null,
        };
    }

    let optimalStreak = 0;
    for (let i = coachHistory.length - 1; i >= 0; i--) {
        if (coachHistory[i].coachState.verdict === 'optimal') {
            optimalStreak++;
        } else {
            break;
        }
    }

    const latest = coachHistory[coachHistory.length - 1].coachState;
    const movesList = latest.candidates ?? latest.candidateMoves;
    const secondCandidate = movesList && movesList.length > 1 ? movesList[1] : undefined;
    const secondLoss = secondCandidate ? Math.abs(secondCandidate.equityLoss) : 0;
    const isBrilliantMove =
        latest.verdict === 'optimal' && Math.abs(latest.equityLoss) < 0.001 && secondLoss >= 0.06;

    let worstBlunderEntry: CoachAnalysisHistoryEntry | null = null;
    let maxLoss = 0;
    for (const entry of coachHistory) {
        const loss = Math.abs(entry.coachState.equityLoss);
        if (entry.coachState.verdict === 'blunder' && loss > maxLoss) {
            maxLoss = loss;
            worstBlunderEntry = entry;
        }
    }

    return {
        optimalStreak,
        isBrilliantMove,
        brilliantMarginEq: isBrilliantMove ? secondLoss : 0,
        lastVerdict: latest.verdict,
        worstBlunderEntry,
    };
}

export function resolveAiRivalQuote(params: {
    rival: AiRivalPersona;
    metrics: DopamineMetricsSummary;
    cubeValue: number;
    doublingOffered: boolean;
    locale?: string;
}): string {
    const { rival, metrics, cubeValue, doublingOffered, locale = 'fr' } = params;
    const q = locale === 'en' ? rival.quotesEn : rival.quotesFr;

    if (doublingOffered || cubeValue >= 4) return q.onHighStakesCube;
    if (metrics.isBrilliantMove) return q.onPlayerBrilliant;
    if (metrics.optimalStreak >= 2) return q.onPlayerStreak;
    if (metrics.lastVerdict === 'blunder') return q.onPlayerBlunder;
    if (cubeValue >= 2) return q.onHighStakesCube;
    return q.greeting;
}
