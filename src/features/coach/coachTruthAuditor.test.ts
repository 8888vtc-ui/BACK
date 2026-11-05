import { describe, it, expect } from 'vitest';
import { auditCoachTruth } from './coachTruthAuditor';
import { createInitialState, applyMove } from '../../engine/backgammonEngine';

describe('CoachTruthAuditor - Détecteur de mensonges et 7 Péchés Capitaux', () => {
    const initial = createInitialState().board;

    it('Péché #1 : Détecte un coup recommandé physiquement illégal (pion inexistant)', () => {
        const result = auditCoachTruth({
            player: 'X',
            boardBeforeMove: initial,
            boardAfterMove: initial,
            diceRolled: [3, 1],
            playedMoveNotation: '8/5 6/5',
            recommendedMoveNotation: '1/4 4/7', // X n'a aucun pion sur la flèche 1 au départ
            equityLossEmg: 0.15,
        });
        expect(result.isValid).toBe(false);
        expect(result.sin).toBe('ILLEGAL_RECOMMENDED_MOVE');
        expect(result.errorMessage).toContain('Case de départ 1 vide de pions X');
    });

    it('Péché #2 : Détecte un coup joué mal identifié (ne correspond pas à boardAfterMove)', () => {
        let boardAfter31 = applyMove(initial, { from: 8, to: 5 }, 'X');
        boardAfter31 = applyMove(boardAfter31, { from: 6, to: 5 }, 'X');

        const result = auditCoachTruth({
            player: 'X',
            boardBeforeMove: initial,
            boardAfterMove: initial, // boardAfter n'a pas bougé
            diceRolled: [3, 1],
            playedMoveNotation: '8/5 6/5',
            recommendedMoveNotation: '8/5 6/5',
            equityLossEmg: 0,
        });
        expect(result.isValid).toBe(false);
        expect(result.sin).toBe('MISMATCHED_PLAYED_MOVE');
    });

    it('Péché #3 : Détecte la confusion de tour ou l\'évaluation post-coup', () => {
        const resultOpponent = auditCoachTruth({
            player: 'X',
            boardBeforeMove: initial,
            boardAfterMove: initial,
            diceRolled: [3, 1],
            playedMoveNotation: '8/5 6/5',
            recommendedMoveNotation: '8/5 6/5',
            equityLossEmg: 0,
            isOpponentTurn: true,
        });
        expect(resultOpponent.isValid).toBe(false);
        expect(resultOpponent.sin).toBe('WRONG_TURN_OR_POST_MOVE_BOARD');

        const resultPostMove = auditCoachTruth({
            player: 'X',
            boardBeforeMove: initial,
            boardAfterMove: initial,
            diceRolled: [3, 1],
            playedMoveNotation: '8/5 6/5',
            recommendedMoveNotation: '8/5 6/5',
            equityLossEmg: 0,
            isPostMoveEvaluation: true,
        });
        expect(resultPostMove.isValid).toBe(false);
        expect(resultPostMove.sin).toBe('WRONG_TURN_OR_POST_MOVE_BOARD');
    });

    it('Péché #4 : Détecte l\'hallucination de pions isolés inexistants dans le texte', () => {
        let boardAfter31 = applyMove(initial, { from: 8, to: 5 }, 'X');
        boardAfter31 = applyMove(boardAfter31, { from: 6, to: 5 }, 'X');

        const result = auditCoachTruth({
            player: 'X',
            boardBeforeMove: initial,
            boardAfterMove: boardAfter31,
            diceRolled: [3, 1],
            playedMoveNotation: '8/5 6/5',
            recommendedMoveNotation: '8/5 6/5',
            equityLossEmg: 0,
            playerTier: 'INTERMEDIATE',
            coachExplanationText: 'Attention aux 36 lancers et à ton pion isolé sur la flèche 11 qui peut être frappé.',
        });
        expect(result.isValid).toBe(false);
        expect(result.sin).toBe('LLM_TEXT_HALLUCINATION');
        expect(result.errorMessage).toContain('flèche 11');
    });

    it('Péché #5 : Détecte le faux blâme sur un coup optimal (perte <= 0.020 EMG qualifiée de faute)', () => {
        let boardAfter31 = applyMove(initial, { from: 8, to: 5 }, 'X');
        boardAfter31 = applyMove(boardAfter31, { from: 6, to: 5 }, 'X');

        const result = auditCoachTruth({
            player: 'X',
            boardBeforeMove: initial,
            boardAfterMove: boardAfter31,
            diceRolled: [3, 1],
            playedMoveNotation: '8/5 6/5',
            recommendedMoveNotation: '8/5 6/5',
            equityLossEmg: 0.012,
            playerTier: 'EXPERT',
            coachExplanationText: 'C\'est une grave erreur qui te coûte 0.012 EMG.',
        });
        expect(result.isValid).toBe(false);
        expect(result.sin).toBe('FALSE_BLUNDER_ON_OPTIMAL');
    });

    it('Péché #6 : Détecte le jargon interdit en mode Débutant', () => {
        let boardAfter31 = applyMove(initial, { from: 8, to: 5 }, 'X');
        boardAfter31 = applyMove(boardAfter31, { from: 6, to: 5 }, 'X');

        const result = auditCoachTruth({
            player: 'X',
            boardBeforeMove: initial,
            boardAfterMove: boardAfter31,
            diceRolled: [3, 1],
            playedMoveNotation: '8/5 6/5',
            recommendedMoveNotation: '8/5 6/5',
            equityLossEmg: 0,
            playerTier: 'BEGINNER',
            coachExplanationText: 'Ce coup perd trop d\'équité EMG sur le rollout.',
        });
        expect(result.isValid).toBe(false);
        expect(result.sin).toBe('TIER_JARGON_VIOLATION');
    });

    it('Péché #7 : Détecte un coup absurdement mauvais d\'un bot censé jouer un niveau', () => {
        let boardAfter31 = applyMove(initial, { from: 8, to: 5 }, 'X');
        boardAfter31 = applyMove(boardAfter31, { from: 6, to: 5 }, 'X');

        const result = auditCoachTruth({
            player: 'X',
            boardBeforeMove: initial,
            boardAfterMove: boardAfter31,
            diceRolled: [3, 1],
            playedMoveNotation: '8/5 6/5',
            recommendedMoveNotation: '8/5 6/5',
            equityLossEmg: 0.250, // Perte énorme
            botDifficulty: 'expert', // Plafond expert = 0.025
        });
        expect(result.isValid).toBe(false);
        expect(result.sin).toBe('BOT_ABSURD_MOVE');
    });

    it('Valide avec succès une analyse parfaite sans péché', () => {
        let boardAfter31 = applyMove(initial, { from: 8, to: 5 }, 'X');
        boardAfter31 = applyMove(boardAfter31, { from: 6, to: 5 }, 'X');

        const result = auditCoachTruth({
            player: 'X',
            boardBeforeMove: initial,
            boardAfterMove: boardAfter31,
            diceRolled: [3, 1],
            playedMoveNotation: '8/5 6/5',
            recommendedMoveNotation: '8/5 6/5',
            equityLossEmg: 0,
            playerTier: 'EXPERT',
            coachExplanationText: 'Coup optimal fermant la porte 5 sans perte d\'équité (0.000 EMG). 100% propre.',
        });
        expect(result.isValid).toBe(true);
        expect(result.sin).toBeUndefined();
    });
});

