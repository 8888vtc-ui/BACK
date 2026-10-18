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
                onOpenBackendModal={vi.fn()}
            />,
        );
        expect(html).toContain('hidden');
    });

    it('affiche les options de thème, son, langue et IA lorsque isOpen est true', () => {
        const html = renderToStaticMarkup(
            <HudSettingsMenu
                isOpen={true}
                onClose={vi.fn()}
                menuThemeClass="bg-slate-900"
                theme="midnight"
                onThemeToggle={vi.fn()}
                isSoundMuted={false}
                onToggleSound={vi.fn()}
                onOpenBackendModal={vi.fn()}
                onOpenExportImport={vi.fn()}
                onResetGame={vi.fn()}
            />,
        );
        expect(html).toContain('block');
        expect(html).toContain('Thème');
        expect(html).toContain('Son');
        expect(html).toContain('Langue');
        expect(html).toContain('IA &amp; Back-End');
        expect(html).toContain('Partager / XGID');
        expect(html).toContain('Reset');
    });
});
