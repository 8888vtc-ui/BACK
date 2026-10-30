import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import HudSettingsMenu from './HudSettingsMenu';

describe('HudSettingsMenu Component', () => {
    it('est masqué lorsque isOpen est false', () => {
        const html = renderToStaticMarkup(
            <HudSettingsMenu
                isOpen={false}
                onClose={vi.fn()}
                menuThemeClass="bg-slate-900"
                theme="midnight"
                onThemeToggle={vi.fn()}
                isSoundMuted={false}
                onToggleSound={vi.fn()}
            />,
        );
        expect(html).toContain('hidden');
    });

    it('affiche les options de thème, son, langue et outils lorsque isOpen est true', () => {
        const html = renderToStaticMarkup(
            <HudSettingsMenu
                isOpen={true}
                onClose={vi.fn()}
                menuThemeClass="bg-slate-900"
                theme="midnight"
                onThemeToggle={vi.fn()}
                isSoundMuted={false}
                onToggleSound={vi.fn()}
                onOpenExportImport={vi.fn()}
                onTriggerCoach={vi.fn()}
                onResetGame={vi.fn()}
            />,
        );
        expect(html).toContain('block');
        expect(html).toContain('Noyer Royal');
        expect(html).toContain('Tournament');
        expect(html).toContain('Midnight');
        expect(html).toContain('Obsidienne');
        expect(html).toContain('Acoustique');
        expect(html).toContain('AUTO (FR)');
        expect(html).toContain('Partager / XGID');
        expect(html).toContain('Analyser avec le Coach');
        expect(html).toContain('1× Simple');
        expect(html).toContain('2× Gammon');
        expect(html).toContain('3× BG');
        expect(html).toContain('Reset');
        expect(html).toContain('data-testid="hud-auto-confirm-btn"');
        expect(html).toContain('data-testid="hud-game-speed-btn"');
    });

    it('ne contient plus les outils de debug (Skeleton, Réseau, IA & Back-End)', () => {
        const html = renderToStaticMarkup(
            <HudSettingsMenu
                isOpen={true}
                onClose={vi.fn()}
                menuThemeClass="bg-slate-900"
                theme="midnight"
                onThemeToggle={vi.fn()}
                isSoundMuted={false}
                onToggleSound={vi.fn()}
                onResetGame={vi.fn()}
            />,
        );
        expect(html).not.toContain('Skeleton');
        expect(html).not.toContain('Réseau');
        expect(html).not.toContain('IA & Back-End');
    });
});
