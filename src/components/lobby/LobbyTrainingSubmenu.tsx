'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Flame, Puzzle } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { LobbyModuleId } from './LobbyScreen';

export interface LobbyTrainingSubmenuProps {
    readonly onOpenModule?: (moduleId: LobbyModuleId) => void;
}

export const LobbyTrainingSubmenu: React.FC<LobbyTrainingSubmenuProps> = ({ onOpenModule }) => {
    const { ui } = useTranslation();
    return (
        <section data-testid="lobby-training-submenu" className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Link
                href="/drills?mode=personal_blunders"
                data-testid="lobby-training-personal-blunders-btn"
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0B0E14]/90 p-3.5 text-left transition-all duration-150 hover:border-[#D4AF37]/40"
            >
                <div className="flex items-center gap-2.5">
                    <Flame size={17} strokeWidth={1.5} className="text-[#D4AF37] shrink-0" />
                    <div>
                        <div className="text-sm font-bold text-white">Revoir mes Blunders</div>
                        <div className="text-xs text-zinc-400">Corrigez vos erreurs issues de vos parties</div>
                    </div>
                </div>
                <span className="rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-semibold text-[#F3E5AB]">
                    {ui.lobby.openBtn}
                </span>
            </Link>
            <button
                type="button"
                data-testid="lobby-training-drills-btn"
                onClick={() => onOpenModule?.('drills')}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0B0E14]/90 p-3.5 text-left transition-all duration-150 hover:border-white/15"
            >
                <div className="flex items-center gap-2.5">
                    <Flame size={17} strokeWidth={1.5} className="text-[#D4AF37] shrink-0" />
                    <div>
                        <div className="text-sm font-bold text-white">{ui.lobby.blunderDrillsTitle}</div>
                        <div className="text-xs text-zinc-400">{ui.lobby.blunderDrillsDesc}</div>
                    </div>
                </div>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#F3E5AB]">
                    {ui.lobby.openBtn}
                </span>
            </button>
            <button
                type="button"
                data-testid="lobby-training-puzzles-btn"
                onClick={() => onOpenModule?.('puzzles')}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0B0E14]/90 p-3.5 text-left transition-all duration-150 hover:border-white/15"
            >
                <div className="flex items-center gap-2.5">
                    <Puzzle size={17} strokeWidth={1.5} className="text-[#10B981] shrink-0" />
                    <div>
                        <div className="text-sm font-bold text-white">{ui.lobby.dailyPuzzlesTitle}</div>
                        <div className="text-xs text-zinc-400">{ui.lobby.dailyPuzzlesDesc}</div>
                    </div>
                </div>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#F3E5AB]">
                    {ui.lobby.openBtn}
                </span>
            </button>
            <button
                type="button"
                data-testid="lobby-training-openings-btn"
                onClick={() => onOpenModule?.('openings')}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0B0E14]/90 p-3.5 text-left transition-all duration-150 hover:border-white/15"
            >
                <div className="flex items-center gap-2.5">
                    <BookOpen size={17} strokeWidth={1.5} className="text-[#D4AF37] shrink-0" />
                    <div>
                        <div className="text-sm font-bold text-white">Les 15 Ouvertures</div>
                        <div className="text-xs text-zinc-400">Encyclopédie interactive des 15 lancers initiaux</div>
                    </div>
                </div>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#F3E5AB]">
                    {ui.lobby.openBtn}
                </span>
            </button>
        </section>
    );
};

