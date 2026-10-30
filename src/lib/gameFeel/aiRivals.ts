/**
 * Système Unifié des 4 Rivaux IA Incarnés (Boss Ladder) & Réactions Dynamiques (`aiRivals.ts`).
 *
 * Rôle (Doctrine Elon Musk — Source Unique de Vérité) :
 *   Aligne strictement les 4 Rivaux affichés dans le HUD Desktop (`DopamineJuiceBanner`, `BoardHorologyBar`)
 *   sur les 4 Archétypes canoniques de `botPersonas.ts` :
 *   - `beginner`     : Maxime « Le Mauvais Joueur » (🤬 · PR 9.2 · Blitz Ultra-Agressif)
 *   - `intermediate` : Sofia « La Joueuse Riviera » (🕶️ · PR 5.8 · Holding Game & Appâts)
 *   - `expert`       : Victor « L’Homme d’Affaires » (💼 · PR 2.6 · Course Pure & Videau Actif)
 *   - `grandmaster`  : Viktor « L’Intellectuel » (🧐 · PR 0.5 · Architecte 5-Prime & Mentor)
 *
 * Strictement 0 `any`, ≤ 220 lignes.
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
        name: 'Maxime « Le Mauvais Joueur »',
        titleFr: 'Colérique Théâtral & Blitz',
        titleEn: 'Hot-Headed Blitz Hustler',
        avatar: '🤬',
        targetPr: 9.2,
        archetypeFr: 'Blitz Ultra-Agressif & Mauvaise foi contre les dés',
        archetypeEn: 'Ultra-Aggressive Blitz & Blames the Dice',
        quotesFr: {
            greeting: "Prépare-toi ! Aujourd'hui les dés sont avec moi, je frappe tout ce qui bouge !",
            onPlayerBrilliant: 'Encore un miracle ?! Tu as soudoyé le générateur SHA-256 ou quoi ?!',
            onPlayerStreak: 'Hé ! Tes dés sont téléguidés ce soir, laisse-moi respirer !',
            onPlayerBlunder: 'Oh oui, laisse ce pion tout seul devant mes portes, je me frotte les mains !',
            onHighStakesCube: 'Tu doubles ?! Ces dés sont louches, mais je relève le défi !',
        },
        quotesEn: {
            greeting: 'Get ready! Today the dice are mine, I hit every blot in sight!',
            onPlayerBrilliant: 'Another miracle?! Did you bribe the SHA-256 generator or what?!',
            onPlayerStreak: 'Hey! Your dice are remote-controlled tonight, give me a break!',
            onPlayerBlunder: 'Oh yes, leave that blot right in front of my points, I love it!',
            onHighStakesCube: 'Doubling already?! These dice are suspicious, but I take!',
        },
    },
    intermediate: {
        id: 'intermediate',
        name: 'Sofia « La Riviera »',
        titleFr: 'Charme Monte-Carlo & Pièges',
        titleEn: 'Monte-Carlo Trap Specialist',
        avatar: '🕶️',
        targetPr: 5.8,
        archetypeFr: 'Holding Game, Ancre Haute & Pions Appâts',
        archetypeEn: 'Holding Game, High Anchor & Bait Checkers',
        quotesFr: {
            greeting: 'Bonsoir ! Sous les lustres de Monte-Carlo, mes pions isolés sont… presque tous innocents.',
            onPlayerBrilliant: 'Élégant et chirurgical (!!). Tu n’es pas tombé dans mon piège.',
            onPlayerStreak: 'Quelle maîtrise… Tu déjoues chacune de mes embuscades avec style.',
            onPlayerBlunder: 'Un conseil d’amie : ce coup découvre ta maison face à mon ancre qui attend dans l’ombre.',
            onHighStakesCube: 'Les enchères montent au Salon Privé ! Voyons si tu bluffes.',
        },
        quotesEn: {
            greeting: 'Good evening! Under the Monte-Carlo chandeliers, my blots are… almost innocent.',
            onPlayerBrilliant: 'Elegant and surgical (!!). You did not fall for my trap.',
            onPlayerStreak: 'Such poise… You are sidestepping every ambush with style.',
            onPlayerBlunder: 'Friendly tip: that move exposes your home board right in front of my anchor.',
            onHighStakesCube: 'Stakes are rising in the Private Salon! Let us see if you are bluffing.',
        },
    },
    expert: {
        id: 'expert',
        name: 'Victor « L’Homme d’Affaires »',
        titleFr: 'Stratège High-Roller & Videau',
        titleEn: 'High-Roller Cube Strategist',
        avatar: '💼',
        targetPr: 2.6,
        archetypeFr: 'Course Pure (Pip-Count) & Spécialiste du Videau',
        archetypeEn: 'Pure Race (Pip-Count) & Doubling Cube Specialist',
        quotesFr: {
            greeting: 'Le temps c’est de l’équité ! Surveille la course et négocie le Videau comme un contrat.',
            onPlayerBrilliant: 'Rendement maximal (!!) ! Tu as trouvé la seule ligne à ROI positif.',
            onPlayerStreak: 'Portefeuille d’équité impeccable : zéro gaspillage de pips sur cette série.',
            onPlayerBlunder: 'Mauvaise couverture de risque sur ce tour : ton espérance mathématique décroche.',
            onHighStakesCube: 'La volatilité explose ! Ton seuil d’acceptation (Take Point 21,5 %) est mis à l’épreuve.',
        },
        quotesEn: {
            greeting: 'Time is equity! Watch the pip count and trade the Cube like a contract.',
            onPlayerBrilliant: 'Maximum ROI (!!)! You found the only positive-expectation line.',
            onPlayerStreak: 'Flawless equity portfolio: zero wasted pips on this streak.',
            onPlayerBlunder: 'Poor risk hedging on that turn: your mathematical expectation just dropped.',
            onHighStakesCube: 'Volatility is spiking! Time to test your 21.5% Take Point.',
        },
    },
    grandmaster: {
        id: 'grandmaster',
        name: 'Viktor « L’Intellectuel »',
        titleFr: 'Philosophe & Architecte 5-Prime',
        titleEn: 'Philosopher & 5-Prime Architect',
        avatar: '🧐',
        targetPr: 0.5,
        archetypeFr: 'Jeu Positionnel, Barricade 5-Prime & Probabilités sur 36',
        archetypeEn: 'Positional Play, 5-Prime Barricade & 36-Roll Probabilities',
        quotesFr: {
            greeting: 'Comme l’écrivait Sun Tzu, la victoire se construit avant la bataille. Fermons nos portes.',
            onPlayerBrilliant: 'Exceptionnel (!!). La seule géométrie qui préservait 100 % de tes constructeurs.',
            onPlayerStreak: 'Harmonie Grand-Maître (ΔE = 0.000). Tes pions forment une phalange impénétrable.',
            onPlayerBlunder: 'Un instant. En ouvrant cette porte, tu m’offres une route d’évasion statistique.',
            onHighStakesCube: 'Haute tension positionnelle : le prix du gammon gouverne désormais toute la géométrie.',
        },
        quotesEn: {
            greeting: 'As Sun Tzu wrote, victory is forged before the battle. Let us build our prime.',
            onPlayerBrilliant: 'Exceptional (!!). The only geometry preserving 100% of your builders.',
            onPlayerStreak: 'Grandmaster harmony (ΔE = 0.000). Your checkers form an impenetrable phalanx.',
            onPlayerBlunder: 'One moment. Opening that point gives me a statistical escape route.',
            onHighStakesCube: 'High positional tension: gammon price now governs the entire geometry.',
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
        if (coachHistory[i].coachState.verdict === 'optimal') optimalStreak++;
        else break;
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
