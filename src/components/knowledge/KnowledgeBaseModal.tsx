'use client';

/**
 * Modale de la Base de Connaissances Backgammon Grand-Maître.
 *
 * Conforme à SCALABILITY.md (< 300 lignes, 0 any, Dumb UI pure).
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    KNOWLEDGE_BASE_CONCEPTS,
    TheoryConcept,
    TheoryCategory,
    TheoryDifficulty,
    getTheoryConceptById,
} from '../../features/knowledge';
import { useBoardTheme, getModalThemeClasses, type ThemeName } from '../../hooks/useBoardTheme';
import { useI18n } from '../../lib/i18n';
import KnowledgeConceptDetail from './KnowledgeConceptDetail';

export interface KnowledgeBaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialConceptId?: string;
    theme?: ThemeName;
}

const CATEGORIES: { id: TheoryCategory | 'all'; labelFr: string; labelEn: string; icon: string }[] = [
    { id: 'all', labelFr: 'Tout explorer', labelEn: 'All Topics', icon: '🌐' },
    { id: 'fundamentals', labelFr: 'Fondamentaux (Magriel)', labelEn: 'Fundamentals (Magriel)', icon: '🏛️' },
    { id: 'game-plans', labelFr: '5 Plans de Jeu', labelEn: '5 Game Plans', icon: '🗺️' },
    { id: 'cube-theory', labelFr: 'Théorie du Videau', labelEn: 'Cube Theory', icon: '🎲' },
    { id: 'race-bearoff', labelFr: 'Course & EPC (Trice)', labelEn: 'Race & EPC (Trice)', icon: '⚡' },
    { id: 'match-play', labelFr: 'Match Play & MET', labelEn: 'Match Play & MET', icon: '📊' },
    { id: 'openings', labelFr: 'Ouvertures', labelEn: 'Openings', icon: '📖' },
    { id: 'rules-of-thumb', labelFr: "Règles d'or GM (Mochy)", labelEn: 'GM Rules of Thumb', icon: '🏆' },
];

const DIFFICULTY_MAP: Record<TheoryDifficulty, { labelFr: string; labelEn: string; color: string }> = {
    beginner: { labelFr: 'Débutant', labelEn: 'Beginner', color: 'bg-emerald-500/20 text-emerald-300 border-white/10' },
    intermediate: { labelFr: 'Intermédiaire', labelEn: 'Intermediate', color: 'bg-blue-500/20 text-blue-300 border-white/10' },
    advanced: { labelFr: 'Avancé', labelEn: 'Advanced', color: 'bg-purple-500/20 text-purple-300 border-white/10' },
    master: { labelFr: 'Grand-Maître', labelEn: 'Grandmaster', color: 'bg-amber-500/20 text-amber-300 border-white/10' },
};

export function KnowledgeBaseModal({
    isOpen,
    onClose,
    initialConceptId,
    theme,
}: KnowledgeBaseModalProps) {
    const { theme: activeTheme } = useBoardTheme();
    const currentTheme = theme || activeTheme;
    const modalClasses = getModalThemeClasses(currentTheme);
    const { locale } = useI18n();
    const isEn = locale === 'en';

    const [selectedId, setSelectedId] = useState<string>(initialConceptId || KNOWLEDGE_BASE_CONCEPTS[0]?.id || 'golden-point');
    const [selectedCategory, setSelectedCategory] = useState<TheoryCategory | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const detailContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialConceptId) {
            setSelectedId(initialConceptId);
            const found = getTheoryConceptById(initialConceptId);
            if (found && selectedCategory !== 'all' && found.category !== selectedCategory) {
                setSelectedCategory('all');
            }
        }
    }, [initialConceptId, selectedCategory]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const filteredConcepts = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return KNOWLEDGE_BASE_CONCEPTS.filter((c) => {
            const matchesCat = selectedCategory === 'all' || c.category === selectedCategory;
            if (!matchesCat) return false;
            if (!query) return true;

            const title = (isEn ? c.title.en : c.title.fr).toLowerCase();
            const summary = (isEn ? c.summary.en : c.summary.fr).toLowerCase();
            const author = c.author.toLowerCase();
            const tags = c.tags.map((t) => t.toLowerCase()).join(' ');

            return (
                title.includes(query) ||
                summary.includes(query) ||
                author.includes(query) ||
                tags.includes(query) ||
                c.id.includes(query)
            );
        });
    }, [selectedCategory, searchQuery, isEn]);

    const activeConcept: TheoryConcept = useMemo(() => {
        return (
            KNOWLEDGE_BASE_CONCEPTS.find((c) => c.id === selectedId) ||
            filteredConcepts[0] ||
            KNOWLEDGE_BASE_CONCEPTS[0]
        );
    }, [selectedId, filteredConcepts]);

    const handleSelectConcept = (id: string) => {
        setSelectedId(id);
        if (detailContainerRef.current) {
            detailContainerRef.current.scrollTop = 0;
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-md animate-fade-in ${modalClasses.overlay}`}
            data-testid="knowledge-base-modal"
            role="dialog"
            aria-modal="true"
            aria-label={isEn ? 'Backgammon Grandmaster Knowledge Base' : 'Base de Connaissances Backgammon Grand-Maître'}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={`relative flex h-[94vh] w-full max-w-6xl flex-col rounded-3xl shadow-2xl overflow-hidden border border-white/10 backdrop-blur-2xl transition-all ${modalClasses.container}`}
            >
                {/* Header */}
                <div className={`flex items-center justify-between border-b border-white/10 px-5 py-4 ${modalClasses.header}`}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-2xl shadow-lg shadow-indigo-950">
                            📚
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex flex-wrap items-center gap-2">
                                <span>{isEn ? 'Theory & Knowledge Base' : 'Encyclopédie & Théorie'}</span>
                                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-300 border border-white/10">
                                    {KNOWLEDGE_BASE_CONCEPTS.length} {isEn ? 'Master Chapters' : 'Fiches Grand-Maître'}
                                </span>
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-300">
                                {isEn
                                    ? 'Authoritative theory: Magriel, Woolsey, Trice, Robertie, Kazaross, Olsen & Mochy'
                                    : 'Théorie de référence : Magriel, Woolsey, Trice, Robertie, Kazaross, Olsen & Mochy'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        data-testid="kb-close-btn"
                        className="rounded-2xl border border-white/10 p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
                        aria-label={isEn ? 'Close modal' : 'Fermer la boîte de dialogue'}
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Recherche & Catégories */}
                <div className="border-b border-white/10 bg-slate-950/60 px-5 py-3 space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={isEn ? 'Search concept, author, formula (e.g. Magriel, EPC, 25%)...' : 'Rechercher un concept, auteur, formule (ex: Magriel, EPC, 25%)...'}
                                data-testid="kb-search-input"
                                className="w-full rounded-xl bg-slate-900/90 border border-white/10 px-4 py-2 pl-10 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <div className="text-xs sm:text-sm text-slate-300 self-center">
                            <span className="font-bold text-blue-400">{filteredConcepts.length}</span> / {KNOWLEDGE_BASE_CONCEPTS.length} {isEn ? 'topics' : 'notions'}
                        </div>
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
                        {CATEGORIES.map((cat) => {
                            const isSelected = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    data-testid={`kb-category-${cat.id}`}
                                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition border ${
                                        isSelected
                                            ? 'border-blue-400/50 bg-blue-600 text-white shadow-md shadow-blue-950'
                                            : 'border-white/10 bg-slate-900/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{isEn ? cat.labelEn : cat.labelFr}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Contenu : Liste gauche + Fiche droite */}
                <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
                    <div className="w-full sm:w-2/5 md:w-1/3 max-h-[36vh] sm:max-h-full border-b sm:border-b-0 sm:border-r border-white/10 overflow-y-auto bg-slate-950/30 p-3 space-y-2">
                        {filteredConcepts.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                🔍 {isEn ? 'No concept matching your query.' : 'Aucun concept ne correspond à votre recherche.'}
                            </div>
                        ) : (
                            filteredConcepts.map((concept) => {
                                const isSelected = concept.id === activeConcept?.id;
                                const diff = DIFFICULTY_MAP[concept.difficulty];
                                return (
                                    <button
                                        key={concept.id}
                                        onClick={() => handleSelectConcept(concept.id)}
                                        data-testid={`kb-concept-item-${concept.id}`}
                                        className={`w-full text-left rounded-2xl p-3.5 transition border ${
                                            isSelected
                                                ? 'bg-blue-900/40 border-blue-400/70 shadow-lg shadow-blue-950/50'
                                                : 'bg-slate-900/50 border-white/10 hover:bg-slate-900 hover:border-white/25'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                            <span className="text-xs font-bold text-slate-300">
                                                {concept.author}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${diff.color}`}>
                                                {isEn ? diff.labelEn : diff.labelFr}
                                            </span>
                                        </div>

                                        <h3 className={`text-sm font-bold line-clamp-1 ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                                            {isEn ? concept.title.en : concept.title.fr}
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                                            {isEn ? concept.summary.en : concept.summary.fr}
                                        </p>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <KnowledgeConceptDetail
                        concept={activeConcept}
                        isEn={isEn}
                        containerRef={detailContainerRef}
                    />
                </div>
            </div>
        </div>
    );
}

export default KnowledgeBaseModal;
