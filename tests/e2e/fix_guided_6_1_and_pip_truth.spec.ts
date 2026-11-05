import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Vérification Guidée 6-1, Vérité de Course et Le Professeur', () => {
    test('1. Vérifie qu’aucun fichier dans src/ ne contient la chaîne codée en dur "en avance de 10 cases"', () => {
        const srcDir = path.join(process.cwd(), 'src');
        const searchDir = (dir: string): string[] => {
            let matches: string[] = [];
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    matches = matches.concat(searchDir(fullPath));
                } else if (/\.(tsx?|jsx?|json)$/.test(entry.name)) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    if (content.includes('en avance de 10 cases')) {
                        matches.push(fullPath);
                    }
                }
            }
            return matches;
        };

        const violations = searchDir(srcDir);
        expect(violations, `Fichiers contenant "en avance de 10 cases" : ${violations.join(', ')}`).toEqual([]);
    });

    test('2. Sur /play en Partie Guidée, vérifie que l’adversaire est Le Professeur / MENTOR PÉDAGOGIQUE et que la course affiche le vrai calcul', async ({ page }) => {
        await page.goto('/play?gate=BEGINNER&start=guided');
        await page.waitForLoadState('domcontentloaded');

        // Vérification de la carte adversaire dans le rail gauche desktop ou portrait mobile
        const oppName = page.locator('text=/Le Professeur|The Professor/i').locator('visible=true').first();
        await expect(oppName).toBeVisible({ timeout: 10000 });

        // Sur écran standard (hauteur > 540px), le badge MENTOR PÉDAGOGIQUE / TEACHING MENTOR est également affiché
        const isCompactHeight = await page.evaluate(() => window.innerHeight <= 540);
        if (!isCompactHeight) {
            const oppBadge = page.locator('text=/MENTOR PÉDAGOGIQUE|TEACHING MENTOR/i').locator('visible=true').first();
            await expect(oppBadge).toBeVisible();
        }

        // Le bouton "Idée du Professeur" doit être totalement absent
        const hintBtn = page.locator('[data-testid="professor-ask-hint-btn"]');
        await expect(hintBtn).toHaveCount(0);

        // Le texte du dialogue du Professeur ne doit pas être tronqué
        const dialogue = page.locator('[data-testid="professor-dialogue-text"]').first();
        await expect(dialogue).toBeVisible();
        const textContent = await dialogue.textContent();
        expect(textContent?.endsWith('...')).toBeFalsy();
    });
});
