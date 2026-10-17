import { describe, it, expect } from 'vitest';
import {
    EvaluateRequestSchema,
    RolloutRequestSchema,
    CoachRequestSchema,
    ActionValidationContextSchema,
    validateJsonBody,
} from './schemas';

describe('Zod Schemas Validation', () => {
    describe('EvaluateRequestSchema', () => {
        it('valide un XGID correct avec ply optionnel', () => {
            const valid = {
                xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10',
                ply: 2,
            };
            const result = EvaluateRequestSchema.safeParse(valid);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.ply).toBe(2);
            }
        });

        it('applique le ply par défaut si omis', () => {
            const valid = {
                xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10',
            };
            const result = EvaluateRequestSchema.safeParse(valid);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.ply).toBe(2);
            }
        });

        it('rejette un format XGID vide ou trop court (< 5 caractères)', () => {
            const invalid = { xgid: 'bad' };
            const result = EvaluateRequestSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('rejette un ply supérieur à 4 ou négatif', () => {
            expect(
                EvaluateRequestSchema.safeParse({
                    xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10',
                    ply: 5,
                }).success,
            ).toBe(false);

            expect(
                EvaluateRequestSchema.safeParse({
                    xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10',
                    ply: -1,
                }).success,
            ).toBe(false);
        });
    });

    describe('RolloutRequestSchema', () => {
        it('valide une soumission de rollout standard', () => {
            const valid = {
                xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10',
                trials: 1296,
                candidateMoves: ['24/20 13/10', '8/5 6/5'],
            };
            const result = RolloutRequestSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        it('rejette un nombre de trials en dehors des bornes [18, 10000]', () => {
            expect(
                RolloutRequestSchema.safeParse({
                    xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10',
                    trials: 5,
                }).success,
            ).toBe(false);

            expect(
                RolloutRequestSchema.safeParse({
                    xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10',
                    trials: 20000,
                }).success,
            ).toBe(false);
        });
    });

    describe('CoachRequestSchema', () => {
        it('valide un payload coach avec tous ses champs', () => {
            const valid = {
                verdict: 'blunder',
                equityLoss: -0.15,
                playedMove: '24/20 13/10',
                optimalMove: '8/5 6/5',
                language: 'fr',
                playerLevel: 'expert',
            };
            const result = CoachRequestSchema.safeParse(valid);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.language).toBe('fr');
                expect(result.data.playerLevel).toBe('expert');
            }
        });

        it('rejette si playedMove ou optimalMove est manquant', () => {
            const invalid = { verdict: 'blunder' };
            const result = CoachRequestSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    describe('validateJsonBody helper', () => {
        it('retourne les données typées pour un JSON valide', async () => {
            const req = new Request('http://localhost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10',
                    ply: 2,
                }),
            });

            const res = await validateJsonBody(req, EvaluateRequestSchema);
            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.data.ply).toBe(2);
            }
        });

        it('retourne une réponse 400 pour un JSON syntaxiquement invalide', async () => {
            const req = new Request('http://localhost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{ malformed json, ',
            });

            const res = await validateJsonBody(req, EvaluateRequestSchema);
            expect(res.success).toBe(false);
            if (!res.success) {
                expect(res.response.status).toBe(400);
            }
        });

        it('retourne une réponse 400 détaillée pour un payload ne respectant pas le schéma', async () => {
            const req = new Request('http://localhost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xgid: 'bad', ply: 99 }),
            });

            const res = await validateJsonBody(req, EvaluateRequestSchema);
            expect(res.success).toBe(false);
            if (!res.success) {
                expect(res.response.status).toBe(400);
            }
        });
    });
});
