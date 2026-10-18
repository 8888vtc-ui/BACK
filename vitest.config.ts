import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,tsx}'],
        // La simulation PR (10+ matchs complets) est trop lourde pour la CI
        // régulière (~40s). Elle est exclue du run par défaut et exécutée
        // manuellement via `npm run test:simulation`.
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            'scripts/simulatePR.test.ts',
        ],
    },
});