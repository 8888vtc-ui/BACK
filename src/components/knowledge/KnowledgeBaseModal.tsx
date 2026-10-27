'use client';

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
                {/* 1. Header du Modal */}
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

                {/* 2. Barre de Recherche et Sélecteur de Catégories */}
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

                {/* 3. Contenu Principal : Disposition Responsive (Empilée Mobile / Split Desktop) */}
                <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
                    {/* Colonne Gauche : Liste des Concepts */}
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

                    {/* Colonne Droite : Fiche Théorique Détaillée (accessible sur mobile & desktop) */}
                    <div
                        ref={detailContainerRef}
                        className="flex-1 sm:w-3/5 md:w-2/3 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950/50"
                    >
                        {activeConcept ? (
                            <div className="space-y-6 max-w-3xl">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300 border border-white/10">
                                            👤 {activeConcept.author}
                                        </span>
                                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${DIFFICULTY_MAP[activeConcept.difficulty].color}`}>
                                            {isEn ? DIFFICULTY_MAP[activeConcept.difficulty].labelEn : DIFFICULTY_MAP[activeConcept.difficulty].labelFr}
                                        </span>
                                    </div>

                                    <h1
                                        data-testid="kb-detail-title"
                                        className="text-xl sm:text-2xl font-black tracking-tight text-white"
                                    >
                                        {isEn ? activeConcept.title.en : activeConcept.title.fr}
                                    </h1>

                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {activeConcept.tags.map((tag) => (
                                            <span key={tag} className="text-xs font-semibold text-slate-300 bg-slate-900/80 px-2.5 py-0.5 rounded-md border border-white/10">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-gradient-to-br from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-white/10 p-4 space-y-2 shadow-inner">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                                        <span>💡</span> {isEn ? 'Key Takeaway' : 'À Retenir Absolument'}
                                    </h3>
                                    <p className="text-sm font-semibold text-white leading-relaxed">
                                        {isEn ? activeConcept.keyTakeaway.en : activeConcept.keyTakeaway.fr}
                                    </p>
                                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1 border-t border-white/10">
                                        {isEn ? activeConcept.summary.en : activeConcept.summary.fr}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                        <span>🧠</span> {isEn ? 'Theoretical Foundation' : 'Fondements Théoriques'}
                                    </h3>
                                    <div className="space-y-2 text-sm text-slate-200 leading-relaxed">
                                        {(isEn ? activeConcept.explanation.en : activeConcept.explanation.fr).map((paragraph, idx) => (
                                            <p key={idx}>{paragraph}</p>
                                        ))}
                                    </div>
                                </div>

                                {activeConcept.formulaOrRule && (
                                    <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-4 space-y-2 shadow-md">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <span>📐</span> {activeConcept.formulaOrRule.name}
                                            </h4>
                                        </div>
                                        {activeConcept.formulaOrRule.formula && (
                                            <div className="rounded-xl bg-slate-950 p-3 font-mono text-sm font-black text-amber-300 border border-white/10">
                                                {activeConcept.formulaOrRule.formula}
                                            </div>
                                        )}
                                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                            {isEn
                                                ? activeConcept.formulaOrRule.explanation.en
                                                : activeConcept.formulaOrRule.explanation.fr}
                                        </p>
                                    </div>
                                )}

                                {activeConcept.practicalExamples.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                            <span>🎯</span> {isEn ? 'Practical Examples & Key Positions' : 'Exemples Pratiques & Positions Types'}
                                        </h3>
                                        <div className="space-y-3">
                                            {activeConcept.practicalExamples.map((ex, idx) => (
                                                <div key={idx} className="rounded-2xl bg-slate-900/60 border border-white/10 p-3.5 space-y-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs sm:text-sm font-semibold text-slate-200">
                                                            {isEn ? ex.positionDesc.en : ex.positionDesc.fr}
                                                        </span>
                                                        <span className="font-mono text-xs font-black text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-white/10 shrink-0">
                                                            ✓ {ex.bestPlay}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                                        <strong className="text-slate-200">{isEn ? 'Reasoning:' : 'Raisonnement :'}</strong>{' '}
                                                        {isEn ? ex.reasoning.en : ex.reasoning.fr}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-2xl bg-amber-950/20 border border-white/10 p-4 space-y-1">
                                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <span>🏆</span> {isEn ? 'Grandmaster Golden Rule' : "Règle d'Or de Grand-Maître"}
                                    </h4>
                                    <p className="text-sm font-bold text-amber-200 italic leading-relaxed">
                                        « {isEn ? activeConcept.goldenRule.en : activeConcept.goldenRule.fr} »
                                    </p>
                                </div>

                                <div className="border-t border-white/10 pt-4 space-y-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <span>🌐</span> {isEn ? 'Authoritative Sources & Data References' : 'Sources Fiables & Références Documentaires'}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {activeConcept.sources.map((src, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-xl bg-slate-900/40 border border-white/10 p-3 text-xs flex flex-col justify-between"
                                            >
                                                <div>
                                                    <span className="text-xs uppercase font-bold text-blue-300 block">
                                                        [{src.type}] {src.author}
                                                    </span>
                                                    <strong className="text-white block mt-0.5 text-sm">{src.title}</strong>
                                                    {src.details && <p className="text-slate-300 text-xs mt-0.5">{src.details}</p>}
                                                </div>
                                                {src.url && (
                                                    <a
                                                        href={src.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-2 text-blue-300 hover:text-blue-200 inline-flex items-center gap-1 text-xs font-semibold"
                                                    >
                                                        <span>{isEn ? 'Read on Backgammon Galore' : 'Consulter sur Backgammon Galore'}</span>
                                                        <span>↗</span>
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KnowledgeBaseModal;
