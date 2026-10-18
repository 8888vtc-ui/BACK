import { describe, it, expect } from 'vitest';
import { rollDie, resolveRollOff, performRollOff } from './rollOff';

describe('rollDie', () => {
    it('retourne une valeur entre 1 et 6', () => {
        for (let i = 0; i < 100; i++) {
            const v = rollDie();
            expect(v).toBeGreaterThanOrEqual(1);
            expect(v).toBeLessThanOrEqual(6);
        }
    });

    it('respecte la fonction aléatoire injectée', () => {
        expect(rollDie(() => 0)).toBe(1);
        expect(rollDie(() => 0.999)).toBe(6);
    });
});

describe('resolveRollOff', () => {
    it('X gagne quand son dé est plus élevé', () => {
        expect(resolveRollOff(5, 3)).toBe('X');
    });

    it('O gagne quand son dé est plus élevé', () => {
        expect(resolveRollOff(2, 4)).toBe('O');
    });

    it('retourne null en cas d\'égalité', () => {
        expect(resolveRollOff(3, 3)).toBeNull();
    });
});

describe('performRollOff', () => {
    it('retourne un résultat cohérent', () => {
        const result = performRollOff(() => 0.5); // 4 pour les deux
        expect(result.xDie).toBe(4);
        expect(result.oDie).toBe(4);
        expect(result.winner).toBeNull();
    });

    it('détermine un gagnant quand les dés diffèrent', () => {
        let calls = 0;
        const random = () => {
            calls++;
            return calls === 1 ? 0.8 : 0.2; // X=5, O=2
        };
        const result = performRollOff(random);
        expect(result.winner).toBe('X');
    });
});
