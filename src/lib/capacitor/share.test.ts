import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    canShare,
    shareContent,
    shareGameResult,
    shareCoachExplanation,
} from './share';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

vi.mock('@capacitor/share', () => ({
    Share: {
        canShare: vi.fn(),
        share: vi.fn(),
    },
}));

describe('Capacitor Share Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('canShare vérifie la disponibilité du plugin Share', async () => {
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(true);
        vi.spyOn(Share, 'canShare').mockResolvedValue({ value: true });

        const available = await canShare();
        expect(available).toBe(true);
    });

    it('partage du contenu textuel avec Share.share quand le plugin est disponible', async () => {
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(true);
        const spyShare = vi.spyOn(Share, 'share').mockResolvedValue({ activityType: 'com.apple.share' });

        const res = await shareContent({
            title: 'Test Backgammon',
            text: 'Une super partie !',
            dialogTitle: 'Partager avec un ami',
        });

        expect(spyShare).toHaveBeenCalledWith({
            title: 'Test Backgammon',
            text: 'Une super partie !',
            url: undefined,
            dialogTitle: 'Partager avec un ami',
        });
        expect(res.activityType).toBe('com.apple.share');
    });

    it('bascule sur navigator.share sur le web si le plugin Capacitor n’est pas disponible', async () => {
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(false);
        const mockShare = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('navigator', { share: mockShare });

        const res = await shareContent({
            title: 'Partie Web',
            text: 'Score 7-3',
        });

        expect(mockShare).toHaveBeenCalledWith({
            title: 'Partie Web',
            text: 'Score 7-3',
            url: undefined,
        });
        expect(res.activityType).toBe('web-navigator-share');

        vi.unstubAllGlobals();
    });

    it('bascule sur clipboard.writeText si navigator.share n’est pas disponible', async () => {
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(false);
        const mockWriteText = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('navigator', { clipboard: { writeText: mockWriteText } });

        const res = await shareContent({
            title: 'Titre Presse-papier',
            text: 'Texte copié',
        });

        expect(mockWriteText).toHaveBeenCalled();
        expect(res.activityType).toBe('clipboard-copy');

        vi.unstubAllGlobals();
    });

    it('shareGameResult formate correctement le texte du résultat de partie', async () => {
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(true);
        const spyShare = vi.spyOn(Share, 'share').mockResolvedValue({ activityType: 'native' });

        await shareGameResult({
            winner: 'X',
            pointsWon: 2,
            winType: 'gammon',
            scoreX: 4,
            scoreO: 1,
            matchLength: 7,
        });

        expect(spyShare).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Victoire au Backgammon !',
                text: expect.stringContaining('Victoire du Joueur X (+2 pts, GAMMON)'),
            }),
        );
    });

    it('shareCoachExplanation formate l’explication du coach', async () => {
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(true);
        const spyShare = vi.spyOn(Share, 'share').mockResolvedValue({ activityType: 'native' });

        await shareCoachExplanation({
            verdict: 'blunder',
            playedMove: '24/18',
            optimalMove: '13/7',
            equityLoss: 0.154,
            explanation: 'Laisser un blot direct expose trop votre arrière-garde.',
        });

        expect(spyShare).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Conseil du Coach Backgammon',
                text: expect.stringContaining('BLUNDER'),
            }),
        );
    });
});
