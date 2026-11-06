'use client';

/**
 * @file src/components/drills/PersonalBlundersNotebookHeader.tsx
 * @description Bannière d'identité du match d'origine (Date, Adversaire, Score, Tour, Dés, Statut)
 * et état vide connecté du Carnet de Blunders Personnels (<= 175 lignes, 0 any, 0 emoji).
 */

import React from 'react';
import Link from 'next/link';
import {
    Calendar, Swords, CheckCircle2, AlertTriangle, Flame,
    Play, Compass, Sparkles,
} from 'lucide-react';
import type { PersonalBlunderRecord } from '../../lib/blunders/personalBlunderStore';
import { formatMatchDateTime } from './PersonalBlundersGuestLockView';

export interface PersonalBlundersEmptyConnectedProps {
    readonly isEn: boolean;
    readonly onSeedDemo: () => void;
}

export const PersonalBlundersEmptyConnected: React.FC<PersonalBlundersEmptyConnectedProps> = ({
    isEn,
    onSeedDemo,
}) => (
    <div
        data-testid="personal-blunders-empty-connected"
        className="flex-1 min-h-0 w-full flex items-center justify-center p-4 bg-[#050505] text-[#fdf8eb]"
    >
        <div className="w-full max-w-xl rounded-2xl border border-[#D4AF37]/30 bg-[#12151C] p-6 text-center space-y-4 shadow-2xl">
            <div className="mx-auto w-10 h-10 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h1 className="text-lg font-black text-white">
                {isEn ? 'Your Personal Match Blunders Notebook is Empty' : 'Votre Carnet de Blunders Personnels est vide'}
            </h1>
            <p className="text-xs text-zinc-300 leading-relaxed">
                {isEn
                    ? 'Every mistake (≥ 0.050 EMG) committed during your matches is automatically recorded here with the exact date, opponent, score, turn number, and 3-ply solution.'
                    : 'Chaque erreur (≥ 0.050 EMG) commise pendant vos matchs est automatiquement enregistrée ici avec la date exacte, le nom de l’adversaire, le score, le tour et l’explication 3-ply.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <button
                    type="button"
                    data-testid="seed-demo-personal-blunders-btn"
                    onClick={onSeedDemo}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E5C158] via-[#D4AF37] to-[#B5902B] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-lg hover:brightness-105 transition"
                >
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>
                        {isEn
                            ? 'Load 3 Match Blunder Examples (Connected Demo)'
                            : 'Charger 3 exemples de Blunders de Matchs (Démo Compte Connecté)'}
                    </span>
                </button>
                <Link
                    href="/"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-zinc-200 hover:border-white/30 hover:text-white transition"
                >
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isEn ? 'Play a Match Live' : 'Lancer un match en direct'}</span>
                </Link>
            </div>
        </div>
    </div>
);

export interface PersonalBlundersNotebookHeaderProps {
    readonly isEn: boolean;
    readonly blunders: ReadonlyArray<PersonalBlunderRecord>;
    readonly pendingCount: number;
    readonly resolvedCount: number;
    readonly statusFilter: 'PENDING' | 'RESOLVED';
    readonly activeBlunder: PersonalBlunderRecord | null;
    readonly onChangeStatusFilter: (status: 'PENDING' | 'RESOLVED') => void;
    readonly onSelectBlunderId: (id: string) => void;
    readonly onSwitchToGeneralQuizzes?: () => void;
}

export const PersonalBlundersNotebookHeader: React.FC<PersonalBlundersNotebookHeaderProps> = ({
    isEn,
    blunders,
    pendingCount,
    resolvedCount,
    statusFilter,
    activeBlunder,
    onChangeStatusFilter,
    onSelectBlunderId,
    onSwitchToGeneralQuizzes,
}) => (
    <header
        data-testid="personal-blunder-match-banner"
        className="shrink-0 rounded-xl border border-[#D4AF37]/35 bg-[#12151C] px-3 py-2 shadow-md flex flex-col gap-1.5"
    >
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1 rounded-lg border border-[#D4AF37]/40 bg-[#050505] px-2 py-1 text-[11px] font-bold text-[#D4AF37] hover:border-[#D4AF37] transition"
                >
                    <span>{isEn ? '← Back' : '← Retour'}</span>
                </Link>
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-white">
                    <Flame className="w-4 h-4 text-[#D4AF37]" />
                    <span>{isEn ? 'My Match Blunders' : 'Mes Blunders de Match'}</span>
                </span>

                <div className="inline-flex items-center rounded-lg border border-white/10 bg-[#050505] p-0.5 text-[11px] font-bold">
                    <button
                        type="button"
                        data-testid="personal-blunders-tab-pending"
                        onClick={() => onChangeStatusFilter('PENDING')}
                        className={`rounded-md px-2.5 py-0.5 transition ${
                            statusFilter === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50' : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        {isEn ? `Pending (${pendingCount})` : `À corriger (${pendingCount})`}
                    </button>
                    <button
                        type="button"
                        data-testid="personal-blunders-tab-resolved"
                        onClick={() => onChangeStatusFilter('RESOLVED')}
                        className={`rounded-md px-2.5 py-0.5 transition ${
                            statusFilter === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50' : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        {isEn ? `Resolved (${resolvedCount})` : `Résolus (${resolvedCount})`}
                    </button>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto">
                    {blunders.map((b, idx) => (
                        <button
                            key={b.id}
                            type="button"
                            data-testid={`personal-blunder-select-${idx}`}
                            onClick={() => onSelectBlunderId(b.id)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap transition ${
                                activeBlunder?.id === b.id
                                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]'
                                    : 'border-white/10 bg-[#050505] text-zinc-400 hover:text-white'
                            }`}
                        >
                            <span>#{idx + 1} {b.opponentName} (T#{b.turnNumber})</span>
                            {b.status === 'RESOLVED' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        </button>
                    ))}
                </div>
            </div>

            {onSwitchToGeneralQuizzes && (
                <button
                    type="button"
                    onClick={onSwitchToGeneralQuizzes}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-[#050505] px-2.5 py-1 text-[11px] font-bold text-zinc-300 hover:border-[#D4AF37]/50 hover:text-white transition"
                >
                    <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{isEn ? 'General 3-Ply Quizzes' : 'Quiz 3-Ply Généraux'}</span>
                </button>
            )}
        </div>

        {activeBlunder && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-1.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <span data-testid="blunder-match-date" className="inline-flex items-center gap-1 text-zinc-300 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{formatMatchDateTime(activeBlunder.createdAtIso, isEn)}</span>
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span data-testid="blunder-match-opponent" className="inline-flex items-center gap-1 font-extrabold text-white">
                        <Swords className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                            {isEn ? `vs ${activeBlunder.opponentName}` : `Contre ${activeBlunder.opponentName}`}
                            {activeBlunder.opponentElo ? ` (${activeBlunder.opponentElo} Elo)` : ''}
                        </span>
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span data-testid="blunder-match-score-turn" className="font-mono text-[11px] font-semibold text-[#D4AF37]">
                        {activeBlunder.matchFormatLabel} (Score : {activeBlunder.scoreBeforeMove.player} - {activeBlunder.scoreBeforeMove.opponent}) • {isEn ? `Turn #${activeBlunder.turnNumber}` : `Tour #${activeBlunder.turnNumber}`} • {isEn ? `Dice:` : `Dés tirés :`} {activeBlunder.dice[0]}-{activeBlunder.dice[1]}
                    </span>
                </div>

                <span
                    data-testid="blunder-status-badge"
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-black uppercase ${
                        activeBlunder.status === 'RESOLVED'
                            ? 'border-emerald-400/50 bg-emerald-950/70 text-emerald-300'
                            : 'border-amber-400/50 bg-amber-950/70 text-amber-300'
                    }`}
                >
                    {activeBlunder.status === 'RESOLVED' ? (
                        <><CheckCircle2 className="w-3 h-3 text-emerald-400" /><span>{isEn ? '✓ Resolved' : '✓ Résolu'}</span></>
                    ) : (
                        <><AlertTriangle className="w-3 h-3 text-amber-400" /><span>{isEn ? 'Pending Fix' : 'À corriger'}</span></>
                    )}
                </span>
            </div>
        )}
    </header>
);

