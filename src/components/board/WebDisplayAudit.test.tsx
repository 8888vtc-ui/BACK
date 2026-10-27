// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BoardFrame } from './BoardFrame';
import { MoveTimelineBar } from './MoveTimelineBar';
import { DopamineJuiceBanner } from '../hud/DopamineJuiceBanner';
import { CoachMobileSummaryBar } from '../coach/CoachMobileSummaryBar';
import { PageTransition } from '../nav/PageTransition';
import HudSettingsMenu from '../hud/HudSettingsMenu';
import { getSavedOrientation } from './boardOrientation';

afterEach(() => {
    cleanup();
});

describe('Audit Affichage Web — Zéro Blocage Scroll, Zéro Collision, Ratio 11/8 & Barres 1-Ligne', () => {
    it('PageTransition borne la hauteur à h-dvh max-h-dvh pour permettre le scroll interne du Lobby', () => {
        const { container } = render(
            <PageTransition>
                <main data-testid="inner-scroll" className="h-dvh max-h-dvh overflow-y-auto">
                    Contenu
                </main>
            </PageTransition>,
        );

        const wrapper = container.firstElementChild as HTMLElement;
        expect(wrapper.className).toContain('h-dvh');
        expect(wrapper.className).toContain('max-h-dvh');
        expect(screen.getByTestId('inner-scroll').className).toContain('overflow-y-auto');
    });

    it('CoachMobileSummaryBar ne se positionne jamais en bottom-0 (zéro collision avec MobileThumbDock / MoveTimelineBar)', () => {
        render(
            <CoachMobileSummaryBar
                pr={4.25}
                verdict="blunder"
                equityLoss={-0.115}
                onOpen={vi.fn()}
            />,
        );

        const bar = screen.getByTestId('coach-mobile-summary-bar');
        expect(bar.className).not.toContain('bottom-0');
        expect(bar.className).toContain('top-14');
        expect(bar.className).toContain('md:flex');
        expect(bar.className).toContain('lg:hidden');
    });

    it('BoardFrame préserve le ratio géométrique 11/8 sur Web sans rétrécissement Flexbox', () => {
        const { container } = render(
            <BoardFrame theme="snowie_classic">
                <div>Plateau</div>
            </BoardFrame>,
        );

        const shell = container.querySelector('.board-adaptive-shell') as HTMLElement;
        expect(shell).not.toBeNull();
        expect(shell.className).toContain('w-full');
        expect(shell.className).toContain('h-full');
        expect(shell.className).toContain('md:max-w-[min(100%,calc((100dvh-130px)*1.375))]');
        expect(shell.className).toContain('md:aspect-[11/8]');
    });

    it('DopamineJuiceBanner et MoveTimelineBar restent strictement sur une seule ligne (flex-nowrap whitespace-nowrap)', () => {
        render(
            <>
                <DopamineJuiceBanner difficulty="expert" cubeValue={2} />
                <MoveTimelineBar
                    totalTurns={4}
                    replayIndex={null}
                    isLive={true}
                    selectedTurn={null}
                    officialNotation={null}
                    viewPhase="before"
                    canStepPrev={true}
                    canStepNext={false}
                    onStepFirst={vi.fn()}
                    onStepPrev={vi.fn()}
                    onStepNext={vi.fn()}
                    onReturnToLive={vi.fn()}
                    onToggleViewPhase={vi.fn()}
                />
            </>,
        );

        const banner = screen.getByTestId('dopamine-juice-banner');
        const timeline = screen.getByTestId('board-move-timeline');

        expect(banner.className).toContain('flex-nowrap');
        expect(banner.className).toContain('whitespace-nowrap');
        expect(timeline.className).toContain('flex-nowrap');
        expect(timeline.className).toContain('whitespace-nowrap');
    });

    it('HudSettingsMenu est scrollable sur les écrans Laptop (max-h + overflow-y-auto) et synchronise l’orientation du plateau', () => {
        render(
            <HudSettingsMenu
                isOpen={true}
                onClose={vi.fn()}
                menuThemeClass="bg-slate-900"
                theme="snowie_classic"
                onThemeToggle={vi.fn()}
                isSoundMuted={false}
                onToggleSound={vi.fn()}
            />,
        );

        const menu = screen.getByTestId('hud-settings-menu');
        expect(menu.className).toContain('max-h-[calc(100dvh-64px)]');
        expect(menu.className).toContain('overflow-y-auto');

        const toggleBtn = screen.getByTestId('orientation-toggle-btn');
        toggleBtn.click();
        expect(getSavedOrientation()).toBe('inverted');
    });
});
