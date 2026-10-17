'use client';

import React, { useState, useMemo } from 'react';
import { getAllOpenings } from '../../features/openings/openingDatabase';
import type { OpeningEntry, OpeningCategory } from '../../features/openings/types';
import type { Move } from '../../engine/backgammonEngine';
import { useBoardTheme, getModalThemeClasses, type ThemeName } from '../../hooks/useBoardTheme';

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
    theme,
}: OpeningBookModalProps) {
    const { theme: activeTheme } = useBoardTheme();
    const currentTheme = theme || activeTheme;
    const modalClasses = getModalThemeClasses(currentTheme);

    const allOpenings = useMemo(() => getAllOpenings(), []);
    const [selectedId, setSelectedId] = useState<string>(initialOpeningId || allOpenings[0].id);
    const [selectedCategory, setSelectedCategory] = useState<OpeningCategory | 'Toutes'>('Toutes');
    const [searchQuery, setSearchQuery] = useState('');

    // Met à jour la sélection si initialOpeningId change
    React.useEffect(() => {
        if (initialOpeningId) {
            setSelectedId(initialOpeningId);
        }
    }, [initialOpeningId]);

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
            className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in ${modalClasses.overlay}`}
            data-testid="opening-book-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Bibliothèque d'Ouvertures de Backgammon"
        >
            <div className={`relative flex h-[92vh] w-full max-w-5xl flex-col rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl transition-all ${modalClasses.container}`}>
                {/* 1. Header du Modal */}
                <div className={`flex items-center justify-between border-b px-5 py-4 ${modalClasses.header}`}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl shadow-lg shadow-emerald-950">
                            📖
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                                <span>Bibliothèque d’Ouvertures</span>
                                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                                    15 Jets Officiels
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400">
                                Théorie moderne certifiée par rollouts XG++ & GNUBG 4-ply (sans doubles)
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        data-testid="close-opening-book-btn"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white transition"
                        title="Fermer la bibliothèque"
                    >
                        ✕
                    </button>
                </div>

                {/* 2. Barre de filtres & recherche */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/60 px-5 py-3">
                    <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
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
                                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                        isActive
                                            ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                                            : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                    {cat} ({count})
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative min-w-[200px]">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher (ex: 3-1, 6-5, Porte)..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. Contenu principal (Grille des 15 dés à gauche + Fiche détaillée à droite) */}
                <div className="grid flex-1 grid-cols-1 md:grid-cols-12 overflow-hidden">
                    {/* Colonne gauche : Liste des 15 jets */}
                    <div className="md:col-span-5 border-r border-slate-800/80 overflow-y-auto p-3 space-y-2 max-h-[40vh] md:max-h-full">
                        {filteredOpenings.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-500">
                                Aucun jet ne correspond à votre recherche.
                            </div>
                        ) : (
                            filteredOpenings.map((op) => {
                                const isSelected = op.id === selectedOpening.id;
                                return (
                                    <button
                                        key={op.id}
                                        type="button"
                                        data-testid={`opening-card-${op.dice[0]}-${op.dice[1]}`}
                                        onClick={() => setSelectedId(op.id)}
                                        className={`w-full text-left rounded-2xl p-3 border transition-all duration-200 flex items-center justify-between gap-3 ${
                                            isSelected
                                                ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-950 ring-1 ring-emerald-500/50'
                                                : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Badge dés */}
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black text-sm border shadow-sm ${
                                                    isSelected
                                                        ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                                                        : 'border-slate-700 bg-slate-950 text-emerald-400'
                                                }`}
                                            >
                                                {op.dice[0]}-{op.dice[1]}
                                            </div>

                                            <div>
                                                <div className="text-xs font-bold text-white line-clamp-1">
                                                    {op.name}
                                                </div>
                                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                    <span className="font-mono text-emerald-300 font-bold">
                                                        {op.bestMoveNotation}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{op.category}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <div
                                                className={`text-xs font-bold ${
                                                    op.equity >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                }`}
                                            >
                                                {op.equity >= 0 ? `+${op.equity.toFixed(3)}` : op.equity.toFixed(3)}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                {op.winPercentage}% vic.
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Colonne droite : Fiche détaillée de l'ouverture sélectionnée */}
                    <div className="md:col-span-7 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-900/40">
                        {/* En-tête de la fiche */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-lg bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                                        Jet [{selectedOpening.dice[0]}-{selectedOpening.dice[1]}]
                                    </span>
                                    <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
                                        {selectedOpening.category}
                                    </span>
                                </div>
                                <h3 className="mt-1 text-xl font-black text-white">
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
                                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-black text-slate-950 shadow-md hover:from-emerald-400 hover:to-teal-400 transition"
                                >
                                    ⚡ Appliquer en partie
                                </button>
                            )}
                        </div>

                        {/* Coup optimal recommandé */}
                        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 to-slate-900 p-4 shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                                    Coup Optimal Certifié (Rollout 4-Ply)
                                </div>
                                <div className="text-2xl font-black tracking-wide text-white mt-0.5 font-mono">
                                    {selectedOpening.bestMoveNotation}
                                </div>
                                <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-2">
                                    {selectedOpening.bestMoves.map((m, idx) => (
                                        <span key={idx} className="rounded bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300 font-mono">
                                            Flèche {m.from} ➔ Flèche {m.to}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-xs text-slate-400">Équité nette</div>
                                <div className="text-lg font-black text-emerald-400">
                                    {selectedOpening.equity >= 0 ? `+${selectedOpening.equity.toFixed(3)}` : selectedOpening.equity.toFixed(3)}
                                </div>
                            </div>
                        </div>

                        {/* Barres statistiques Rollout */}
                        <div className="grid grid-cols-3 gap-2.5">
                            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-center">
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Victoire Totale
                                </div>
                                <div className="text-lg font-black text-amber-400 mt-0.5">
                                    {selectedOpening.winPercentage}%
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-amber-400 rounded-full"
                                        style={{ width: `${selectedOpening.winPercentage}%` }}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-center">
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Gammon Gagné
                                </div>
                                <div className="text-lg font-black text-emerald-400 mt-0.5">
                                    {selectedOpening.gammonPercentage}%
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${selectedOpening.gammonPercentage * 2.5}%` }}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-center">
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Gammon Concédé
                                </div>
                                <div className="text-lg font-black text-rose-400 mt-0.5">
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
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                <span>🧠</span>
                                <span>Explication Tactique</span>
                            </h4>
                            <p className="text-xs leading-relaxed text-slate-300 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
                                {selectedOpening.explanation}
                            </p>
                        </div>

                        {/* Boîte Principe Clé */}
                        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-transparent p-3.5 flex items-start gap-3">
                            <span className="text-xl">💡</span>
                            <div>
                                <div className="text-xs font-extrabold text-amber-300 uppercase tracking-wide">
                                    Principe Fondamental
                                </div>
                                <div className="text-xs font-medium text-amber-100 mt-0.5 leading-snug">
                                    {selectedOpening.keyRule}
                                </div>
                            </div>
                        </div>

                        {/* Encart Proverbe du Maître & Livre Recommandé */}
                        {selectedOpening.masterQuote && (
                            <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/50 via-slate-900 to-purple-950/30 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner" data-testid="opening-master-quote">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                                        <span>📚</span>
                                        <span>Enseignement du Maître — {selectedOpening.masterQuote.author}</span>
                                    </div>
                                    <div className="text-xs font-semibold text-indigo-100 italic leading-snug">
                                        {selectedOpening.masterQuote.proverb}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                        Extrait de : <strong className="text-slate-200">{selectedOpening.masterQuote.book}</strong>
                                    </div>
                                </div>
                                <a
                                    href={selectedOpening.masterQuote.buyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition shadow active:scale-95 flex items-center gap-1"
                                >
                                    <span>Découvrir le livre</span>
                                    <span>↗</span>
                                </a>
                            </div>
                        )}

                        {/* Tableau comparatif des alternatives & blunders */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                <span>⚖️</span>
                                <span>Alternatives & Pertes d’Équité (ΔEq)</span>
                            </h4>

                            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/50">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                                        <tr>
                                            <th className="py-2 px-3">Coup</th>
                                            <th className="py-2 px-3">Style</th>
                                            <th className="py-2 px-3 text-right">Perte ΔEq</th>
                                            <th className="py-2 px-3">Analyse</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        <tr className="bg-emerald-950/20">
                                            <td className="py-2 px-3 font-mono font-bold text-emerald-300">
                                                {selectedOpening.bestMoveNotation} (Optimal)
                                            </td>
                                            <td className="py-2 px-3 text-emerald-400">Optimal</td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                                                0.000
                                            </td>
                                            <td className="py-2 px-3 text-slate-300 text-[11px]">
                                                Coup de référence standard
                                            </td>
                                        </tr>
                                        {selectedOpening.alternatives.map((alt, index) => (
                                            <tr key={index} className="hover:bg-slate-900/40">
                                                <td className="py-2 px-3 font-mono font-semibold text-white">
                                                    {alt.notation}
                                                </td>
                                                <td className="py-2 px-3 text-slate-400 text-[11px]">
                                                    {alt.style}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-bold text-rose-400">
                                                    {alt.equityLoss.toFixed(3)}
                                                </td>
                                                <td className="py-2 px-3 text-slate-400 text-[11px]">
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
