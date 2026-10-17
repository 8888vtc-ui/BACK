import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('PWA Static Assets & Configuration', () => {
    it('valide la présence et la structure du Web App Manifest (manifest.json)', () => {
        const manifestPath = path.resolve('public/manifest.json');
        expect(fs.existsSync(manifestPath)).toBe(true);

        const manifestRaw = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestRaw);

        // Champs obligatoires PWA
        expect(manifest.name).toBe('Backgammon Tournament & Grand-Maître Coach');
        expect(manifest.short_name).toBe('Backgammon');
        expect(manifest.start_url).toBe('/');
        expect(manifest.display).toBe('standalone');
        expect(manifest.background_color).toBe('#0b1220');
        expect(manifest.theme_color).toBe('#0f172a');

        // Icônes obligatoires (192 et 512 + maskable)
        expect(manifest.icons).toBeInstanceOf(Array);
        expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

        const sizes = manifest.icons.map((ic: any) => ic.sizes);
        expect(sizes).toContain('192x192');
        expect(sizes).toContain('512x512');

        const maskable = manifest.icons.some((ic: any) => ic.purpose && ic.purpose.includes('maskable'));
        expect(maskable).toBe(true);
    });

    it('valide la présence et la syntaxe du Service Worker (sw.js)', () => {
        const swPath = path.resolve('public/sw.js');
        expect(fs.existsSync(swPath)).toBe(true);

        const swContent = fs.readFileSync(swPath, 'utf-8');

        // Événements clés du Service Worker
        expect(swContent).toContain("addEventListener('install'");
        expect(swContent).toContain("addEventListener('activate'");
        expect(swContent).toContain("addEventListener('fetch'");

        // Pré-cache des routes critiques hors-ligne
        expect(swContent).toContain("'/offline.html'");
        expect(swContent).toContain("'/manifest.json'");
        expect(swContent).toContain("'/icons/icon-192.svg'");
        expect(swContent).toContain("'/icons/icon-512.svg'");
    });

    it('valide la présence de la page de secours hors-ligne (offline.html)', () => {
        const offlinePath = path.resolve('public/offline.html');
        expect(fs.existsSync(offlinePath)).toBe(true);

        const offlineContent = fs.readFileSync(offlinePath, 'utf-8');
        expect(offlineContent).toContain('Mode Hors-Ligne Actif');
        expect(offlineContent).toContain('Vous êtes hors-ligne');
        expect(offlineContent).toContain('Jouer au Backgammon');
    });

    it('valide la présence des fichiers d’icônes vectoriels SVG', () => {
        expect(fs.existsSync(path.resolve('public/icons/icon-192.svg'))).toBe(true);
        expect(fs.existsSync(path.resolve('public/icons/icon-512.svg'))).toBe(true);
    });
});
