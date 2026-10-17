/**
 * Service de partage natif unifié pour Backgammon.
 *
 * Utilise @capacitor/share sur iOS et Android, avec repli gracieux
 * sur navigator.share ou navigator.clipboard sur le Web.
 */

import { Capacitor } from '@capacitor/core';
import { Share, ShareOptions, ShareResult } from '@capacitor/share';

export interface BackgammonShareOptions {
    title?: string;
    text: string;
    url?: string;
    dialogTitle?: string;
}

/**
 * Vérifie si le partage natif ou web est supporté.
 */
export async function canShare(): Promise<boolean> {
    if (Capacitor.isPluginAvailable('Share')) {
        const res = await Share.canShare();
        return res.value;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        return true;
    }
    return typeof navigator !== 'undefined' && !!navigator.clipboard;
}

/**
 * Partage du contenu textuel ou URL via la feuille de partage du système.
 */
export async function shareContent(options: BackgammonShareOptions): Promise<ShareResult | { activityType?: string }> {
    const { title = 'Backgammon Tournament & Coach', text, url, dialogTitle = 'Partager' } = options;

    if (Capacitor.isPluginAvailable('Share')) {
        const shareOpts: ShareOptions = {
            title,
            text,
            url,
            dialogTitle,
        };
        return await Share.share(shareOpts);
    }

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title, text, url });
        return { activityType: 'web-navigator-share' };
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const fullContent = [title, text, url].filter(Boolean).join('\n\n');
        await navigator.clipboard.writeText(fullContent);
        return { activityType: 'clipboard-copy' };
    }

    throw new Error('Le partage n’est pas disponible sur cet appareil.');
}

/**
 * Raccourci pour partager le résultat d'une partie.
 */
export async function shareGameResult(params: {
    winner: string;
    pointsWon: number;
    winType: string;
    scoreX: number;
    scoreO: number;
    matchLength: number;
}): Promise<ShareResult | { activityType?: string }> {
    const text = `🏆 Résultat Backgammon :\nVictoire du Joueur ${params.winner} (+${params.pointsWon} pts, ${params.winType.toUpperCase()}) !\nScore du match : X (${params.scoreX}) - O (${params.scoreO}) / ${params.matchLength} pts.`;
    return await shareContent({
        title: 'Victoire au Backgammon !',
        text,
        dialogTitle: 'Partager le score du match',
    });
}

/**
 * Raccourci pour partager une explication du Coach.
 */
export async function shareCoachExplanation(params: {
    verdict: string;
    playedMove: string;
    optimalMove: string;
    equityLoss: number;
    explanation: string;
}): Promise<ShareResult | { activityType?: string }> {
    const text = `🧠 Analyse Coach Backgammon :\nVerdict : ${params.verdict.toUpperCase()} (Perte d'équité : -${params.equityLoss.toFixed(3)})\nCoup joué : ${params.playedMove} ➔ Recommandé : ${params.optimalMove}\n\nExplication :\n${params.explanation}`;
    return await shareContent({
        title: 'Conseil du Coach Backgammon',
        text,
        dialogTitle: 'Partager l’analyse stratégique',
    });
}
