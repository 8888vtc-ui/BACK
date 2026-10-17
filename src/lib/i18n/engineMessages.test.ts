import { describe, it, expect } from 'vitest';
import {
    getCubeDecisionLabel,
    getMoveVerdictLabel,
    formatDiceRollAnnouncement,
    formatMoveAnnouncement,
    formatDoubleOfferAnnouncement,
    formatGameWonAnnouncement,
    formatRaceComparison,
    formatOpponentDiceRollStatus,
    formatOpponentMoveStepStatus,
    formatOpponentBlockedStatus,
    getBoardPointLabel,
} from './engineMessages';

describe('Engine Messages i18n Helpers', () => {
    describe('getCubeDecisionLabel', () => {
        it('traduit les décisions du videau en français', () => {
            expect(getCubeDecisionLabel('no_double', 'fr')).toBe('Pas de videau');
            expect(getCubeDecisionLabel('double_take', 'fr')).toBe('Doubler, accepter');
            expect(getCubeDecisionLabel('double_pass', 'fr')).toBe('Doubler, passer');
            expect(getCubeDecisionLabel('too_good', 'fr')).toBe('Trop beau pour doubler');
        });

        it('traduit les décisions du videau en anglais', () => {
            expect(getCubeDecisionLabel('no_double', 'en')).toBe('No double');
            expect(getCubeDecisionLabel('double_take', 'en')).toBe('Double, take');
            expect(getCubeDecisionLabel('double_pass', 'en')).toBe('Double, pass');
            expect(getCubeDecisionLabel('too_good', 'en')).toBe('Too good to double');
        });
    });

    describe('getMoveVerdictLabel', () => {
        it('traduit les verdicts de coups en français et anglais', () => {
            expect(getMoveVerdictLabel('blunder', 'fr')).toBe('Blunder');
            expect(getMoveVerdictLabel('doubtful', 'fr')).toBe('Douteux');
            expect(getMoveVerdictLabel('best', 'fr')).toBe('Meilleur coup');
            expect(getMoveVerdictLabel('very_good', 'fr')).toBe('Très bon coup');

            expect(getMoveVerdictLabel('blunder', 'en')).toBe('Blunder');
            expect(getMoveVerdictLabel('doubtful', 'en')).toBe('Doubtful');
            expect(getMoveVerdictLabel('best', 'en')).toBe('Best move');
            expect(getMoveVerdictLabel('very_good', 'en')).toBe('Very good move');
        });
    });

    describe('Screen Reader Announcements', () => {
        it('formate l’annonce des dés', () => {
            expect(formatDiceRollAnnouncement('Blanc', [3, 1], 'fr')).toBe('Blanc a lancé 3 et 1');
            expect(formatDiceRollAnnouncement('White', [3, 1], 'en')).toBe('White rolled 3 and 1');
            expect(formatDiceRollAnnouncement('Blanc', 6, 2, 'fr')).toBe('Blanc a lancé 6 et 2');
        });

        it('formate l’annonce d’un coup joué', () => {
            expect(formatMoveAnnouncement('Noir', '24/20 13/11', 'fr')).toBe('Noir a joué 24/20 13/11');
            expect(formatMoveAnnouncement('Black', '24/20 13/11', 'en')).toBe('Black played 24/20 13/11');
        });

        it('formate l’annonce d’une proposition de videau', () => {
            expect(formatDoubleOfferAnnouncement('Blanc', 2, 'fr')).toBe('Blanc propose le videau à 2');
            expect(formatDoubleOfferAnnouncement('White', 2, 'en')).toBe('White offers the double to 2');
        });

        it('formate l’annonce d’une victoire simple, gammon ou backgammon', () => {
            expect(formatGameWonAnnouncement('Blanc', 'single', 'fr')).toBe('Blanc remporte la partie simple (1 pt)');
            expect(formatGameWonAnnouncement('White', 'single', 'en')).toBe('White wins a single game (1 pt)');

            expect(formatGameWonAnnouncement('Noir', 'gammon', 'fr')).toBe('Noir remporte un Gammon (2 pts)');
            expect(formatGameWonAnnouncement('Black', 'gammon', 'en')).toBe('Black wins a Gammon (2 pts)');

            expect(formatGameWonAnnouncement('Blanc', 'backgammon', 'fr')).toBe('Blanc remporte un Backgammon (3 pts)');
            expect(formatGameWonAnnouncement('White', 'backgammon', 'en')).toBe('White wins a Backgammon (3 pts)');
        });

        it('formate la comparaison de course (pip count)', () => {
            expect(formatRaceComparison(120, 120, 'fr')).toBe('Course à égalité parfaite');
            expect(formatRaceComparison(120, 120, 'en')).toBe('Race tied');

            expect(formatRaceComparison(110, 125, 'fr')).toBe('Blanc mène la course de 15 pips');
            expect(formatRaceComparison(110, 125, 'en')).toBe('White leads the race by 15 pips');

            expect(formatRaceComparison(130, 115, 'fr')).toBe('Noir mène la course de 15 pips');
            expect(formatRaceComparison(130, 115, 'en')).toBe('Black leads the race by 15 pips');
        });
    });

    describe('Opponent Status Messages (i18n hook helpers)', () => {
        it('formate le statut des lancers de dés (normal et double) en FR et EN', () => {
            // Français
            expect(formatOpponentDiceRollStatus(5, 2, 'fr')).toBe('Noir (IA) a lancé les dés 🎲🎲 [5-2]');
            expect(formatOpponentDiceRollStatus(3, 3, 'fr')).toBe('Noir (IA) a lancé un double 🎲🎲 [3-3] (4 coups) !');

            // Anglais
            expect(formatOpponentDiceRollStatus(5, 2, 'en')).toBe('Black (AI) rolled the dice 🎲🎲 [5-2]');
            expect(formatOpponentDiceRollStatus(3, 3, 'en')).toBe('Black (AI) rolled a double 🎲🎲 [3-3] (4 moves)!');
        });

        it('formate le statut des coups déplacés en FR et EN', () => {
            // Français
            expect(formatOpponentMoveStepStatus(1, 2, '13', '8', 'fr')).toBe('Coup 1/2 : Noir déplace 13 → 8');
            expect(formatOpponentMoveStepStatus(1, 4, 'Barre', '20', 'fr')).toBe('Coup 1/4 : Noir déplace Barre → 20');
            expect(formatOpponentMoveStepStatus(4, 4, '3', 'Sortie', 'fr')).toBe('Coup 4/4 : Noir déplace 3 → Sortie');

            // Anglais
            expect(formatOpponentMoveStepStatus(1, 2, '13', '8', 'en')).toBe('Move 1/2: Black moves 13 → 8');
            expect(formatOpponentMoveStepStatus(1, 4, 'Bar', '20', 'en')).toBe('Move 1/4: Black moves Bar → 20');
            expect(formatOpponentMoveStepStatus(4, 4, '3', 'Off', 'en')).toBe('Move 4/4: Black moves 3 → Off');
        });

        it('formate le statut quand l’adversaire est bloqué en FR et EN', () => {
            expect(formatOpponentBlockedStatus('fr')).toBe('Noir (IA) est bloqué (aucun coup possible)');
            expect(formatOpponentBlockedStatus('en')).toBe('Black (AI) is blocked (no legal moves)');
        });

        it('retourne les libellés des flèches, de la barre et de la sortie en FR et EN', () => {
            expect(getBoardPointLabel(13, false, false, 'fr')).toBe('13');
            expect(getBoardPointLabel(13, false, false, 'en')).toBe('13');

            expect(getBoardPointLabel(25, true, false, 'fr')).toBe('Barre');
            expect(getBoardPointLabel(25, true, false, 'en')).toBe('Bar');

            expect(getBoardPointLabel(25, false, true, 'fr')).toBe('Sortie');
            expect(getBoardPointLabel(25, false, true, 'en')).toBe('Off');
        });
    });
});

