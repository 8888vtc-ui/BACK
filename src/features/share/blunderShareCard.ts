/**
 * Modèle et utilitaires de formattage pour les quiz viraux de gaffes (HD 1200x630).
 * Conforme à SCALABILITY.md (< 400 lignes, 0 any, fonctions pures).
 */

import { calculatePlayerPips } from '../../engine/pipCalculator';

export interface BlunderQuizCardData {
    readonly board: ReadonlyArray<number>;
    readonly dice: [number, number];
    readonly turn?: 'X' | 'O';
    readonly matchLength?: number;
    readonly scoreX?: number;
    readonly scoreO?: number;
    readonly cubeValue?: number;
    readonly cubeOwner?: 'X' | 'O' | null;
    readonly playerPips?: number;
    readonly opponentPips?: number;
    readonly bestMoveNotation: string;
    readonly playedMoveNotation?: string;
    readonly equityLoss?: number;
    readonly keyConcept?: string;
    readonly locale?: string;
    readonly includeSolution?: boolean;
}

/**
 * Formate la perte d'équité en chaîne lisible (-0.XXX Eq).
 */
export function formatEquityLoss(equityLoss?: number | null): string {
    if (equityLoss === undefined || equityLoss === null || Number.isNaN(equityLoss)) {
        return '';
    }
    const absEq = Math.abs(equityLoss);
    return `-${absEq.toFixed(3)} Eq`;
}

/**
 * Génère le titre viral pour les réseaux sociaux / bannière supérieure.
 */
export function getViralQuizHeadline(data: BlunderQuizCardData): string {
    const isEn = Boolean(data.locale && data.locale !== 'fr');
    const matchLen = data.matchLength && data.matchLength > 0 ? `${data.matchLength} pts` : 'Money Game';
    const roll = `${data.dice[0]}-${data.dice[1]}`;

    if (isEn) {
        return `WHAT'S THE PLAY? — Match to ${matchLen} • Roll: ${roll}`;
    }
    return `QUEL EST LE MEILLEUR COUP ? — Match en ${matchLen} • Dés: ${roll}`;
}

/**
 * Génère le sous-titre de contexte (Scores, Pip count, Cube).
 */
export function getViralQuizSubheadline(data: BlunderQuizCardData): string {
    const isEn = Boolean(data.locale && data.locale !== 'fr');
    const scoreX = data.scoreX ?? 0;
    const scoreO = data.scoreO ?? 0;
    const pipsX = data.playerPips ?? (data.board.length >= 26 ? calculatePlayerPips(data.board, 'X') : 0);
    const pipsO = data.opponentPips ?? (data.board.length >= 26 ? calculatePlayerPips(data.board, 'O') : 0);
    const cube = data.cubeValue ?? 1;

    if (isEn) {
        return `Score: X ${scoreX} - ${scoreO} O • Pip: X ${pipsX} | O ${pipsO} • Cube: ${cube}`;
    }
    return `Score : X ${scoreX} - ${scoreO} O • Pips : X ${pipsX} | O ${pipsO} • Videau : ${cube}`;
}

/**
 * Prépare le message textuel d'accompagnement pour les partages (Twitter, Reddit, Facebook, WhatsApp).
 */
export function generateSocialShareText(data: BlunderQuizCardData): string {
    const isEn = Boolean(data.locale && data.locale !== 'fr');
    const headline = getViralQuizHeadline(data);
    const sub = getViralQuizSubheadline(data);
    const eq = formatEquityLoss(data.equityLoss);

    if (isEn) {
        return [
            `🎲 ${headline}`,
            `📊 ${sub}`,
            data.includeSolution && data.bestMoveNotation
                ? `💡 Solution: ${data.bestMoveNotation}${eq ? ` (Blunder: ${eq})` : ''}`
                : '🤔 How would you play this roll? Share your move in comments!',
            '#Backgammon #GrandmasterCoach #WhatsThePlay',
        ].join('\n\n');
    }

    return [
        `🎲 ${headline}`,
        `📊 ${sub}`,
        data.includeSolution && data.bestMoveNotation
            ? `💡 Solution : ${data.bestMoveNotation}${eq ? ` (Erreur : ${eq})` : ''}`
            : '🤔 Quel coup joueriez-vous ici ? Donnez votre avis en commentaire !',
        '#Backgammon #GrandmasterCoach #WhatsThePlay',
    ].join('\n\n');
}
