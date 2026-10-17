import { describe, it, expect, vi } from 'vitest';
import { logger } from './logger';

describe('StructuredLogger', () => {
    it('produit une entrée structurée valide pour le niveau info', () => {
        const entry = logger.info('Message test d information', { userId: 'usr-123' });
        expect(entry.level).toBe('info');
        expect(entry.message).toBe('Message test d information');
        expect(entry.context).toEqual({ userId: 'usr-123' });
        expect(entry.timestamp).toBeDefined();
        expect(entry.service).toBe('backgammon-app');
    });

    it('gère et formate correctement les erreurs', () => {
        const err = new Error('Panne de réseau simulée');
        const entry = logger.error('Échec appel API', err, { endpoint: '/api/coach' });

        expect(entry.level).toBe('error');
        expect(entry.error).toBeDefined();
        expect(entry.error?.name).toBe('Error');
        expect(entry.error?.message).toBe('Panne de réseau simulée');
        expect(entry.error?.stack).toBeDefined();
        expect(entry.context).toEqual({ endpoint: '/api/coach' });
    });

    it('hérite du contexte enrichi via child logger', () => {
        const childLogger = logger.child({ correlationId: 'req-corr-999', module: 'coach' });
        const entry = childLogger.info('Demande explication coach');

        expect(entry.correlationId).toBe('req-corr-999');
        expect(entry.context).toMatchObject({
            correlationId: 'req-corr-999',
            module: 'coach',
        });
    });

    it('mesure avec précision la durée d’exécution asynchrone', async () => {
        const mockFn = vi.fn().mockImplementation(async () => {
            await new Promise((resolve) => setTimeout(resolve, 20));
            return 42;
        });

        const res = await logger.measure('test-timing', mockFn, { sample: true });
        expect(res).toBe(42);
        expect(mockFn).toHaveBeenCalledTimes(1);
    });
});
