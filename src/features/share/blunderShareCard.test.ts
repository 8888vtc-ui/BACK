import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../engine/backgammonEngine';
import {
    formatEquityLoss,
    getViralQuizHeadline,
    getViralQuizSubheadline,
    generateSocialShareText,
    type BlunderQuizCardData,
} from './blunderShareCard';

const SAMPLE_CARD: BlunderQuizCardData = {
    board: createInitialState().board,
    dice: [6, 5],
    turn: 'X',
    matchLength: 7,
    scoreX: 3,
    scoreO: 2,
    cubeValue: 2,
    cubeOwner: 'X',
    bestMoveNotation: '24/13',
    playedMoveNotation: '13/7 13/8',
    equityLoss: -0.142,
    keyConcept: 'Back Checker Escape',
    locale: 'fr',
    includeSolution: false,
};

describe('blunderShareCard', () => {
    describe('formatEquityLoss', () => {
        it('formate la perte d\'équité négative ou positive en chaîne -0.XXX Eq', () => {
            expect(formatEquityLoss(-0.142)).toBe('-0.142 Eq');
            expect(formatEquityLoss(0.085)).toBe('-0.085 Eq');
            expect(formatEquityLoss(0)).toBe('-0.000 Eq');
        });

        it('retourne une chaîne vide pour undefined, null ou NaN', () => {
            expect(formatEquityLoss(undefined)).toBe('');
            expect(formatEquityLoss(null)).toBe('');
            expect(formatEquityLoss(Number.NaN)).toBe('');
        });
    });

    describe('getViralQuizHeadline', () => {
        it('génère le titre viral en français et en anglais pour un match ou une partie d\'argent', () => {
            expect(getViralQuizHeadline(SAMPLE_CARD)).toBe(
                'QUEL EST LE MEILLEUR COUP ? — Match en 7 pts • Dés: 6-5',
            );
            expect(
                getViralQuizHeadline({
                    ...SAMPLE_CARD,
                    matchLength: 0,
                    locale: 'en',
                }),
            ).toBe("WHAT'S THE PLAY? — Match to Money Game • Roll: 6-5");
        });
    });

    describe('getViralQuizSubheadline', () => {
        it('calcule automatiquement les pips depuis le plateau 26 cases et formate le score et le videau', () => {
            expect(getViralQuizSubheadline(SAMPLE_CARD)).toBe(
                'Score : X 3 - 2 O • Pips : X 167 | O 167 • Videau : 2',
            );
            expect(
                getViralQuizSubheadline({
                    ...SAMPLE_CARD,
                    playerPips: 142,
                    opponentPips: 155,
                    locale: 'en',
                }),
            ).toBe('Score: X 3 - 2 O • Pip: X 142 | O 155 • Cube: 2');
        });
    });

    describe('generateSocialShareText', () => {
        it('génère un appel à l\'action sans spoiler quand includeSolution est false', () => {
            const textFr = generateSocialShareText(SAMPLE_CARD);
            expect(textFr).toContain('QUEL EST LE MEILLEUR COUP ?');
            expect(textFr).toContain('Quel coup joueriez-vous ici ?');
            expect(textFr).not.toContain('24/13');
            expect(textFr).toContain('#Backgammon #GrandmasterCoach #WhatsThePlay');

            const textEn = generateSocialShareText({ ...SAMPLE_CARD, locale: 'en' });
            expect(textEn).toContain("WHAT'S THE PLAY?");
            expect(textEn).toContain('How would you play this roll?');
            expect(textEn).not.toContain('24/13');
        });

        it('inclut la solution et la perte d\'équité quand includeSolution est true', () => {
            const textFr = generateSocialShareText({ ...SAMPLE_CARD, includeSolution: true });
            expect(textFr).toContain('💡 Solution : 24/13 (Erreur : -0.142 Eq)');

            const textEn = generateSocialShareText({
                ...SAMPLE_CARD,
                locale: 'en',
                includeSolution: true,
            });
            expect(textEn).toContain('💡 Solution: 24/13 (Blunder: -0.142 Eq)');
        });
    });
});
