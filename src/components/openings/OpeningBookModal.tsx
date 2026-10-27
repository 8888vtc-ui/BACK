'use client';

import React, { useState, useMemo } from 'react';
import { getAllOpenings } from '../../features/openings/openingDatabase';
import type { OpeningEntry, OpeningCategory } from '../../features/openings/types';
import type { Move } from '../../engine/backgammonEngine';
import type { ThemeName } from '../../hooks/useBoardTheme';

export interface OpeningBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialOpeningId?: string;
    onApplyMove?: (moves: Move[]) => void;
    isOpeningTurnActive?: boolean;
    theme?: ThemeName;
}

const CATEGORIES: Array<OpeningCategory | 'Toutes'> = [
    'Toutes',
    'Faire une porte',
    'Échappée & Course',
    'Split & Slot',
    'Développement',
];

export function OpeningBookModal({
    isOpen,
    onClose,
    initialOpeningId,
    onApplyMove,
    isOpeningTurnActive = false,
}: OpeningBookModalProps) {
    const allOpenings = useMemo(() => getAllOpenings(), []);
    const [selectedId, setSelectedId] = useState<string>(initialOpeningId || allOpenings[0].id);
    const [selectedCategory, setSelectedCategory] = useState<OpeningCategory | 'Toutes'>('Toutes');
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => {
        if (initialOpeningId) {
            setSelectedId(initialOpeningId);
        }
    }, [initialOpeningId]);

    React.useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const filteredOpenings = useMemo(() => {
        return allOpenings.filter((op) => {
            const matchesCat = selectedCategory === 'Toutes' || op.category === selectedCategory;
            const query = searchQuery.trim().toLowerCase();
            if (!query) return matchesCat;

            const diceStr = `${op.dice[0]}-${op.dice[1]}`;
            const diceRev = `${op.dice[1]}-${op.dice[0]}`;
            const matchesSearch =
                op.name.toLowerCase().includes(query) ||
                op.bestMoveNotation.toLowerCase().includes(query) ||
                diceStr.includes(query) ||
                diceRev.includes(query) ||
                op.category.toLowerCase().includes(query);

            return matchesCat && matchesSearch;
        });
    }, [allOpenings, selectedCategory, searchQuery]);

    const selectedOpening: OpeningEntry = useMemo(() => {
        return allOpenings.find((o) => o.id === selectedId) || allOpenings[0];
    }, [allOpenings, selectedId]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
            data-testid="opening-book-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Bibliothèque d'Ouvertures de Backgammon"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative flex h-[90vh] w-full max-w-5xl flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-[#17110b]/98 via-[#0d121d]/98 to-[#070a10]/98 shadow-[0_28px_80px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,245,205,0.2)] overflow-hidden backdrop-blur-2xl transition-all">
                {/* 1. Header du Modal */}
                <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#24160b]/95 via-[#140d07]/95 to-[#1f1309]/95 px-5 py-4">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-[#33230f] to-[#140d05] text-xl shadow-inner">
                            <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">📖</span>
                        </div>
                        <div>
                            <h2 className="font-serif text-lg sm:text-xl font-black tracking-wide text-[#fdf8eb] flex flex-wrap items-center gap-2.5">
                                <span>Bibliothèque d’Ouvertures</span>
                                <span className="rounded-full bg-[#2b1e0c] px-2.5 py-0.5 font-mono text-xs font-bold text-[#f3c65f] border border-white/10">
                                    15 Jets Officiels
                                </span>
                            </h2>
                            <p className="text-xs sm:text-sm text-amber-200/80">
                                Théorie moderne certifiée par rollouts Monte-Carlo 3-Ply (sans doubles)
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        data-testid="close-opening-book-btn"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/50 text-sm text-amber-200/80 hover:border-[#f3c65f] hover:text-white transition"
                        title="Fermer la bibliothèque"
                    >
                        ✕
                    </button>
                </div>

                {/* 2. Barre de filtres & recherche */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/10 bg-[#090d16]/90 px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                        {CATEGORIES.map((cat) => {
                            const count =
                                cat === 'Toutes'
                                    ? allOpenings.length
                                    : allOpenings.filter((o) => o.category === cat).length;
                            const isActive = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`rounded-xl border px-3.5 py-1.5 text-xs sm:text-sm font-bold transition ${
                                        isActive
                                            ? 'border-[#f3c65f] bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'
                                    }`}
                                >
                                    {cat} ({count})
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative min-w-[220px]">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher (ex: 3-1, 6-5, Porte)..."
                            className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-1.5 text-xs sm:text-sm text-[#fdf8eb] placeholder-slate-400 focus:border-[#f3c65f] focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1.5 text-xs sm:text-sm text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. Contenu principal (Grille des lancers à gauche + Fiche détaillée à droite) */}
                <div className="grid flex-1 grid-cols-1 md:grid-cols-12 overflow-hidden">
                    {/* Colonne gauche : Grille lisible des lancers d'ouverture */}
                    <div className="md:col-span-5 border-r border-white/10 overflow-y-auto p-3.5 sm:p-4 max-h-[42vh] md:max-h-full bg-[#080c14]/70">
                        {filteredOpenings.length === 0 ? (
                            <div className="p-8 text-center text-sm text-slate-400">
                                Aucun jet ne correspond à votre recherche.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2.5">
                                {filteredOpenings.map((op) => {
                                    const isSelected = op.id === selectedOpening.id;
                                    return (
                                        <button
                                            key={op.id}
                                            type="button"
                                            data-testid={`opening-card-${op.dice[0]}-${op.dice[1]}`}
                                            onClick={() => setSelectedId(op.id)}
                                            className={`w-full text-left rounded-2xl p-3 border transition-all duration-200 flex items-center justify-between gap-3 ${
                                                isSelected
                                                    ? 'border-[#f3c65f] bg-gradient-to-r from-[#2c200d]/90 to-[#141009]/95 shadow-[0_8px_22px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,245,205,0.25)] ring-1 ring-[#f3c65f]/40'
                                                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/25'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono font-black text-sm border shadow-sm ${
                                                        isSelected
                                                            ? 'border-[#fef08a] bg-gradient-to-b from-[#fff5cf] via-[#f0c75e] to-[#b87e14] text-[#1c1004]'
                                                            : 'border-white/10 bg-[#121724] text-[#f3c65f]'
                                                    }`}
                                                >
                                                    {op.dice[0]}-{op.dice[1]}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="font-serif text-sm font-bold text-[#fdf8eb] line-clamp-1">
                                                        {op.name}
                                                    </div>
                                                    <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5 truncate">
                                                        <span className="font-mono text-[#f3c65f] font-bold">
                                                            {op.bestMoveNotation}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="truncate">{op.category}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div
                                                    className={`font-mono text-sm font-bold ${
                                                        op.equity >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                    }`}
                                                >
                                                    {op.equity >= 0 ? `+${op.equity.toFixed(3)}` : op.equity.toFixed(3)}
                                                </div>
                                                <div className="text-xs text-slate-300 font-mono">
                                                    {op.winPercentage}% vic.
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Colonne droite : Fiche détaillée de l'ouverture sélectionnée */}
                    <div className="md:col-span-7 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#0b101b]/80">
                        {/* En-tête de la fiche */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-lg bg-[#281c0b] px-2.5 py-0.5 font-mono text-xs sm:text-sm font-bold text-[#f3c65f] border border-white/10">
                                        Jet [{selectedOpening.dice[0]}-{selectedOpening.dice[1]}]
                                    </span>
                                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs sm:text-sm font-semibold text-slate-300">
                                        {selectedOpening.category}
                                    </span>
                                </div>
                                <h3 className="font-serif mt-1.5 text-xl sm:text-2xl font-black text-[#fdf8eb]">
                                    {selectedOpening.name}
                                </h3>
                            </div>

                            {isOpeningTurnActive && onApplyMove && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onApplyMove(selectedOpening.bestMoves);
                                        onClose();
                                    }}
                                    className="rounded-xl border border-[#fef08a]/80 bg-gradient-to-b from-[#fff5cf] via-[#f0c75e] to-[#b87e14] px-4 py-2 text-xs sm:text-sm font-black uppercase tracking-wider text-[#1c1004] shadow-md hover:brightness-105 transition"
                                >
                                    ✦ Appliquer en partie
                                </button>
                            )}
                        </div>

                        {/* Coup optimal recommandé */}
                        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#24190a]/90 to-[#0e131f]/90 p-4 shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3c65f]">
                                    Coup Optimal Certifié (Rollout 4-Ply)
                                </div>
                                <div className="text-2xl sm:text-3xl font-black tracking-wide text-[#fdf8eb] mt-0.5 font-mono">
                                    {selectedOpening.bestMoveNotation}
                                </div>
                                <div className="text-xs text-slate-300 mt-1.5 flex flex-wrap gap-2">
                                    {selectedOpening.bestMoves.map((m, idx) => (
                                        <span
                                            key={idx}
                                            className="rounded-md border border-white/10 bg-black/40 px-2.5 py-0.5 text-xs text-amber-100 font-mono"
                                        >
                                            Flèche {m.from} ➔ Flèche {m.to}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-xs uppercase tracking-wider text-slate-300">Équité nette</div>
                                <div className="font-mono text-xl font-black text-emerald-400">
                                    {selectedOpening.equity >= 0 ? `+${selectedOpening.equity.toFixed(3)}` : selectedOpening.equity.toFixed(3)}
                                </div>
                            </div>
                        </div>

                        {/* Barres statistiques Rollout */}
                        <div className="grid grid-cols-3 gap-2.5">
                            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3.5 text-center">
                                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Victoire Totale
                                </div>
                                <div className="text-lg sm:text-xl font-black text-amber-400 mt-0.5">
                                    {selectedOpening.winPercentage}%
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-amber-400 rounded-full"
                                        style={{ width: `${selectedOpening.winPercentage}%` }}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3.5 text-center">
                                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Gammon Gagné
                                </div>
                                <div className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">
                                    {selectedOpening.gammonPercentage}%
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${selectedOpening.gammonPercentage * 2.5}%` }}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3.5 text-center">
                                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Gammon Concédé
                                </div>
                                <div className="text-lg sm:text-xl font-black text-rose-400 mt-0.5">
                                    {selectedOpening.loseGammonPercentage}%
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-rose-500 rounded-full"
                                        style={{ width: `${selectedOpening.loseGammonPercentage * 2.5}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Explication & Règle Pédagogique */}
                        <div className="space-y-2">
                            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#f3c65f] flex items-center gap-1.5">
                                <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">🧠</span>
                                <span>Explication Tactique</span>
                            </h4>
                            <p className="text-sm leading-relaxed text-[#e2d2b5] bg-[#090b10]/90 p-4 rounded-xl border border-white/10">
                                {selectedOpening.explanation}
                            </p>
                        </div>

                        {/* Boîte Principe Clé */}
                        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#24160b]/90 to-[#0e131f]/80 p-4 flex items-start gap-3">
                            <span className="text-xl [filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">💡</span>
                            <div>
                                <div className="text-xs sm:text-sm font-extrabold text-[#f3c65f] uppercase tracking-wide">
                                    Principe Fondamental
                                </div>
                                <div className="text-sm font-medium text-[#fdf8eb] mt-0.5 leading-relaxed">
                                    {selectedOpening.keyRule}
                                </div>
                            </div>
                        </div>

                        {/* Encart Proverbe du Maître & Livre Recommandé */}
                        {selectedOpening.masterQuote && (
                            <div
                                className="rounded-xl border border-white/10 bg-gradient-to-r from-[#1c1008]/95 via-[#0e121b] to-[#180c06]/90 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner"
                                data-testid="opening-master-quote"
                            >
                                <div className="space-y-1">
                                    <div className="text-xs font-black uppercase tracking-wider text-[#f3c65f] flex items-center gap-1.5">
                                        <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">📚</span>
                                        <span>Enseignement du Maître — {selectedOpening.masterQuote.author}</span>
                                    </div>
                                    <div className="text-sm font-semibold text-[#fdf8eb] italic leading-relaxed">
                                        {selectedOpening.masterQuote.proverb}
                                    </div>
                                    <div className="text-xs text-[#a5b0c4]">
                                        Extrait de : <strong className="text-[#e2d2b5]">{selectedOpening.masterQuote.book}</strong>
                                    </div>
                                </div>
                                <a
                                    href={selectedOpening.masterQuote.buyUrl}
                                    className="shrink-0 rounded-xl border border-[#fef08a]/70 bg-gradient-to-b from-[#fff5cf] via-[#f0c75e] to-[#b87e14] px-3.5 py-2 text-xs font-black uppercase tracking-wider text-[#1c1004] transition shadow hover:brightness-105 active:scale-95 flex items-center gap-1"
                                >
                                    <span>Ouvrir la fiche Académie</span>
                                    <span>↗</span>
                                </a>
                            </div>
                        )}

                        {/* Tableau comparatif des alternatives & blunders */}
                        <div className="space-y-2">
                            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                                <span>⚖️</span>
                                <span>Alternatives &amp; Pertes d’Équité (ΔEq)</span>
                            </h4>

                            <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-950/50">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead className="bg-slate-900/90 text-slate-300 border-b border-white/10">
                                        <tr>
                                            <th className="py-2.5 px-3.5">Coup</th>
                                            <th className="py-2.5 px-3.5">Style</th>
                                            <th className="py-2.5 px-3.5 text-right">Perte ΔEq</th>
                                            <th className="py-2.5 px-3.5">Analyse</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        <tr className="bg-emerald-950/20">
                                            <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-300">
                                                {selectedOpening.bestMoveNotation} (Optimal)
                                            </td>
                                            <td className="py-2.5 px-3.5 text-emerald-400">Optimal</td>
                                            <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-400">
                                                0.000
                                            </td>
                                            <td className="py-2.5 px-3.5 text-slate-300 text-xs sm:text-sm">
                                                Coup de référence standard
                                            </td>
                                        </tr>
                                        {selectedOpening.alternatives.map((alt, index) => (
                                            <tr key={index} className="hover:bg-slate-900/40">
                                                <td className="py-2.5 px-3.5 font-mono font-semibold text-white">
                                                    {alt.notation}
                                                </td>
                                                <td className="py-2.5 px-3.5 text-slate-300 text-xs sm:text-sm">
                                                    {alt.style}
                                                </td>
                                                <td className="py-2.5 px-3.5 text-right font-mono font-bold text-rose-400">
                                                    {alt.equityLoss.toFixed(3)}
                                                </td>
                                                <td className="py-2.5 px-3.5 text-slate-300 text-xs sm:text-sm">
                                                    {alt.description}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
