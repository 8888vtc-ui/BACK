/**
 * Messages et descriptions du moteur GNUBG et du jeu en versions FR/EN.
 */

import { Locale } from './types';
import { getTranslation } from './I18nContext';

/**
 * Traduit une décision de videau brute GNUBG (No double, Double take, Double pass, Too good)
 */
/**
 * Traduit une décision de videau brute GNUBG (No double, Double take, Double pass, Too good)
 */
export function getCubeDecisionLabel(decision: string, locale: Locale = 'fr'): string {
    const norm = decision.toLowerCase().replace(/_/g, ' ').trim();
    if (norm.includes('no double') || norm.includes('pas de double')) {
        return getTranslation(locale, 'engine.noDouble');
    }
    if (norm.includes('double take') || norm.includes('doubler accepter')) {
        return getTranslation(locale, 'engine.doubleTake');
    }
    if (norm.includes('take') || norm.includes('accepter')) {
        return getTranslation(locale, 'engine.doubleTake');
    }
    if (norm.includes('double pass') || norm.includes('double drop') || norm.includes('doubler passer')) {
        return getTranslation(locale, 'engine.doublePass');
    }
    if (norm.includes('pass') || norm.includes('drop') || norm.includes('passer')) {
        return getTranslation(locale, 'engine.doublePass');
    }
    if (norm.includes('too good') || norm.includes('trop beau')) {
        return getTranslation(locale, 'engine.tooGood');
    }
    return decision;
}

/**
 * Traduit un verdict de classification de coup (blunder, doubtful, howler, best, very_good)
 */
export function getMoveVerdictLabel(verdict: string, locale: Locale = 'fr'): string {
    const norm = verdict.toLowerCase().replace(/_/g, ' ').trim();
    if (norm === 'blunder') {
        return getTranslation(locale, 'coach.blunder');
    }
    if (norm === 'doubtful' || norm === 'douteux') {
        return getTranslation(locale, 'coach.doubtful');
    }
    if (norm === 'howler') {
        return getTranslation(locale, 'coach.howler');
    }
    if (norm === 'best' || norm === 'optimal') {
        return getTranslation(locale, 'engine.bestMove');
    }
    if (norm === 'very good' || norm === 'tres bon') {
        return getTranslation(locale, 'engine.veryGoodMove');
    }
    return verdict.toUpperCase();
}

/**
 * Formate l'annonce de lancer de dés pour les lecteurs d'écran (LiveAnnouncer)
 */
export function formatDiceRollAnnouncement(
    player: string,
    d1OrDice: number | [number, number],
    d2OrLocale?: number | Locale,
    maybeLocale: Locale = 'fr'
): string {
    let d1: number;
    let d2: number;
    let locale: Locale;

    if (Array.isArray(d1OrDice)) {
        d1 = d1OrDice[0];
        d2 = d1OrDice[1];
        locale = (d2OrLocale as Locale) || 'fr';
    } else {
        d1 = d1OrDice;
        d2 = typeof d2OrLocale === 'number' ? d2OrLocale : 0;
        locale = maybeLocale;
    }
    return getTranslation(locale, 'engine.diceRolled', { player, d1, d2 });
}

/**
 * Formate l'annonce d'un coup joué
 */
export function formatMoveAnnouncement(
    player: string,
    move: string,
    locale: Locale = 'fr'
): string {
    return getTranslation(locale, 'engine.movePlayed', { player, move });
}

/**
 * Formate l'annonce d'une proposition de videau
 */
export function formatDoubleOfferAnnouncement(
    player: string,
    value: number,
    locale: Locale = 'fr'
): string {
    return getTranslation(locale, 'engine.doubleOffered', { player, value });
}

/**
 * Formate l'annonce de la réponse au videau (take ou drop)
 */
export function formatDoubleResponseAnnouncement(
    player: string,
    accepted: boolean,
    locale: Locale = 'fr'
): string {
    return accepted
        ? getTranslation(locale, 'engine.doubleAccepted', { player })
        : getTranslation(locale, 'engine.doubleDropped', { player });
}

/**
 * Formate l'annonce de fin de manche (simple, gammon, backgammon)
 */
export function formatGameWonAnnouncement(
    player: string,
    winType: 'single' | 'gammon' | 'backgammon' = 'single',
    locale: Locale = 'fr'
): string {
    if (winType === 'gammon') {
        return getTranslation(locale, 'engine.gammonWon', { player });
    }
    if (winType === 'backgammon') {
        return getTranslation(locale, 'engine.backgammonWon', { player });
    }
    return getTranslation(locale, 'engine.gameWon', { player });
}

/**
 * Formate la comparaison de la course au pip count
 */
export function formatRaceComparison(
    leaderOrPipX: 'X' | 'O' | 'tie' | number,
    diffOrPipO: number,
    locale: Locale = 'fr'
): string {
    let leader: 'X' | 'O' | 'tie';
    let diff: number;

    if (typeof leaderOrPipX === 'number') {
        const pipX = leaderOrPipX;
        const pipO = diffOrPipO;
        if (pipX === pipO) {
            leader = 'tie';
            diff = 0;
        } else if (pipX < pipO) {
            leader = 'X';
            diff = pipO - pipX;
        } else {
            leader = 'O';
            diff = pipX - pipO;
        }
    } else {
        leader = leaderOrPipX;
        diff = diffOrPipO;
    }

    if (leader === 'tie' || diff === 0) {
        return getTranslation(locale, 'engine.raceTie');
    }
    const leaderName = leader === 'X' ? (locale === 'en' ? 'White' : 'Blanc') : (locale === 'en' ? 'Black' : 'Noir');
    return getTranslation(locale, 'engine.raceLeading', { leader: leaderName, diff: Math.abs(diff) });
}

/**
 * Formate le message de statut du lancer de dés de l'adversaire (standard ou double)
 */
export function formatOpponentDiceRollStatus(
    d1: number,
    d2: number,
    locale: Locale = 'fr',
    playerLabel?: string,
): string {
    const player = playerLabel ?? getTranslation(locale, 'game.blackAI');
    if (d1 === d2) {
        return getTranslation(locale, 'game.opponentDoubleRolled', { player, d1, d2 });
    }
    return getTranslation(locale, 'game.opponentDiceRolled', { player, d1, d2 });
}

/**
 * Formate le message de statut pour chaque déplacement séquentiel de pion
 */
export function formatOpponentMoveStepStatus(
    step: number,
    total: number,
    from: string | number,
    to: string | number,
    locale: Locale = 'fr',
    playerLabel?: string,
): string {
    const player = playerLabel ?? (locale === 'en' ? 'Black' : 'Noir');
    return getTranslation(locale, 'game.opponentMoveStep', {
        step,
        total,
        player,
        from: String(from),
        to: String(to),
    });
}

/**
 * Formate le message de statut quand l'adversaire est bloqué (fanned / aucun coup possible)
 */
export function formatOpponentBlockedStatus(
    locale: Locale = 'fr',
    playerLabel?: string,
): string {
    const player = playerLabel ?? getTranslation(locale, 'game.blackAI');
    return getTranslation(locale, 'game.opponentBlocked', { player });
}

/**
 * Retourne le libellé localisé d'une flèche, de la barre ou de la sortie
 */
export function getBoardPointLabel(
    point: number,
    isBar: boolean,
    isOff: boolean,
    locale: Locale = 'fr',
): string {
    if (isBar) return getTranslation(locale, 'game.bar');
    if (isOff) return getTranslation(locale, 'game.off');
    return String(point);
}

