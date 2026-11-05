'use client';

/**
 * @file src/components/academy/AcademyExpertView.tsx
 * @description Vue EXPERT / PRO : Théorie Grand-Maître épurée, Loi du Cap 6.0 (Snowie/XG),
 * Calculateur Kazaross-XG2 / Keith Count et Bibliothèque des concepts filtrée (max 6 visibles).
 * Strictement <= 290 lignes, 0 `any`.
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Award, Calculator, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import MatchEquityCalculator from './MatchEquityCalculator';
import { KNOWLEDGE_BASE_CONCEPTS } from '../../features/knowledge/knowledgeBaseData';
import type { PrimaryLocale } from '../../i18n';

interface AcademyExpertViewProps {
  readonly locale: PrimaryLocale;
}

type ConceptTheme = 'all' | 'cube-match' | 'prime-blitz' | 'race-bearoff';

const DIFFICULTY_MAP: Record<string, { labelFr: string; labelEn: string; color: string }> = {
  beginner: { labelFr: 'Base', labelEn: 'Base', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  intermediate: { labelFr: 'Club', labelEn: 'Club', color: 'text-amber-300 border-amber-400/30 bg-amber-400/10' },
  advanced: { labelFr: 'Avancé', labelEn: 'Advanced', color: 'text-sky-300 border-sky-400/30 bg-sky-400/10' },
  master: { labelFr: 'Maître', labelEn: 'Master', color: 'text-purple-300 border-purple-400/30 bg-purple-400/10' },
};

export const AcademyExpertView: React.FC<AcademyExpertViewProps> = React.memo(({ locale }) => {
  const isEn = locale === 'en';
  const langKey = isEn ? 'en' : 'fr';

  const [activeTheme, setActiveTheme] = useState<ConceptTheme>('all');
  const [currentPage, setCurrentPage] = useState<number>(0);

  // Filtrage thématique des concepts
  const filteredConcepts = useMemo(() => {
    return KNOWLEDGE_BASE_CONCEPTS.filter(c => {
      if (activeTheme === 'all') return true;
      if (activeTheme === 'cube-match') return c.category === 'cube-theory' || c.category === 'match-play';
      if (activeTheme === 'prime-blitz') return c.category === 'game-plans' || c.category === 'fundamentals' || c.category === 'rules-of-thumb';
      if (activeTheme === 'race-bearoff') return c.category === 'race-bearoff';
      return true;
    });
  }, [activeTheme]);

  const pageSize = 6;
  const totalPages = Math.ceil(filteredConcepts.length / pageSize);
  const currentConcepts = filteredConcepts.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleSelectTheme = (theme: ConceptTheme) => {
    setActiveTheme(theme);
    setCurrentPage(0);
  };

  return (
    <div data-testid="academy-expert-view" className="space-y-8 w-full max-w-6xl mx-auto">
      {/* En-tête Pro */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 text-xs font-bold">
          <Award className="w-3.5 h-3.5" />
          <span>{isEn ? 'Expert & Pro Portal • Grandmaster Analytics' : 'Portail Expert & Pro • Théorie & Mathématique Grand-Maître'}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-serif">
          {isEn ? 'Grandmaster Strategy & Mathematical Precision' : 'Stratégie Grand-Maître & Modélisation Mathématique'}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl mx-auto">
          {isEn
            ? 'The Cap 6.0 Law (Snowie/XG), Adaptive Error Rate (ERA), Kazaross-XG2 Match Equity, and Keith Count.'
            : 'La Loi du Cap 6.0 (Norme Snowie/XG), l’Error Rate Adaptatif (ERA), l’Équité MET Kazaross-XG2 et la Course de Keith.'}
        </p>
      </div>

      {/* 1. SYNTHÈSE SCIENTIFIQUE : LA LOI DU CAP 6.0 & L'ERA */}
      <section
        data-testid="expert-cap6-era-card"
        className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-[#121924] via-[#090D14] to-[#14120A] p-5 sm:p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <Award className="w-4 h-4" />
          <span>{isEn ? 'Benchmark Standard • Snowie / eXtreme Gammon' : 'Standard Officiel • Norme Snowie / eXtreme Gammon'}</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-white font-serif">
          {isEn
            ? 'The Cap 6.0 Law & Adaptive Error Rate (ERA)'
            : 'La Loi du Cap 6.0 & L\'Error Rate Adaptatif (ERA)'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-neutral-200">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <h4 className="font-bold text-amber-300">
              {isEn ? '1. The Cap 6.0 Boundary (Variance vs Math)' : '1. Le Seuil du Cap 6.0 (Variance vs Math)'}
            </h4>
            <p className="text-xs leading-relaxed text-neutral-300">
              {isEn
                ? 'Under 6.0 ER, pure mathematical differences become smaller than the dice standard deviation in short matches. Playing GTO alone leaves the outcome to roll variance.'
                : 'En dessous de 6.0 ER, l\'écart mathématique pur devient inférieur à l\'écart-type des dés sur match court. Jouer GTO théorique seul abandonne l\'issue à la variance.'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <h4 className="font-bold text-amber-300">
              {isEn ? '2. Adaptive Exploitation (ERA)' : '2. L\'Exploitation Adaptative (ERA)'}
            </h4>
            <p className="text-xs leading-relaxed text-neutral-300">
              {isEn
                ? 'Against an opponent with a known tendency (over-dropping or loose takes), adjust cube thresholds dynamically to convert human mistakes into decisive equity gains.'
                : 'Face à un profil typé (passif ou joueur de retour), ajustez le videau et conservez des structures complexes pour punir les erreurs adverses et dompter les dés.'}
            </p>
          </div>
        </div>
      </section>

      {/* 2. OUTIL INTERACTIF : CALCULATEUR MET KAZAROSS-XG2 & KEITH COUNT */}
      <section data-testid="expert-kazaross-section" className="space-y-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-400" />
          <h3 className="text-base sm:text-lg font-bold text-white font-serif">
            {isEn ? 'Interactive Tools: Kazaross-XG2 MET & Keith Count' : 'Outil Interactif : MET Kazaross-XG2 & Course de Keith'}
          </h3>
        </div>
        <MatchEquityCalculator locale={locale} />
      </section>

      {/* 3. CONCEPTS GRAND-MAÎTRE FILTRÉS (MAX 6 VISIBLES SANS MUR DE TEXTE) */}
      <section data-testid="expert-concepts-section" className="rounded-2xl border border-white/10 bg-[#0B1015]/95 p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-bold text-white font-serif">
              {isEn ? 'Grandmaster Concept Compendium (6 per view)' : 'Encyclopédie des Concepts Grand-Maître (6 par vue)'}
            </h3>
          </div>

          {/* Filtres thématiques */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              data-testid="filter-theme-all"
              onClick={() => handleSelectTheme('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeTheme === 'all' ? 'bg-amber-400 text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              {isEn ? 'All' : 'Tous'}
            </button>
            <button
              type="button"
              data-testid="filter-theme-cube"
              onClick={() => handleSelectTheme('cube-match')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeTheme === 'cube-match' ? 'bg-amber-400 text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              {isEn ? 'Cube & Match' : 'Videau & Match'}
            </button>
            <button
              type="button"
              data-testid="filter-theme-prime"
              onClick={() => handleSelectTheme('prime-blitz')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeTheme === 'prime-blitz' ? 'bg-amber-400 text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              {isEn ? 'Prime & Blitz' : 'Prime & Blitz'}
            </button>
            <button
              type="button"
              data-testid="filter-theme-race"
              onClick={() => handleSelectTheme('race-bearoff')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeTheme === 'race-bearoff' ? 'bg-amber-400 text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              {isEn ? 'Race & Bear-off' : 'Course & Bear-off'}
            </button>
          </div>
        </div>

        {/* Grille des 6 concepts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {currentConcepts.map(concept => {
            const diff = DIFFICULTY_MAP[concept.difficulty] ?? DIFFICULTY_MAP.beginner;
            return (
              <Link
                key={concept.slug}
                href={`/academy/concepts/${concept.slug}`}
                data-testid={`expert-concept-${concept.slug}`}
                className="group rounded-xl border border-white/10 bg-[#080c14] p-4 hover:border-amber-400/50 transition flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-amber-400">{concept.author}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${diff.color}`}>
                      {isEn ? diff.labelEn : diff.labelFr}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                    {concept.title[langKey]} ↗
                  </h4>
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {concept.summary[langKey]}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pagination propre (6 par page) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-xs text-neutral-400">
              Page {currentPage + 1} / {totalPages} ({filteredConcepts.length} concepts)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                className="p-1.5 rounded-lg border border-white/10 text-neutral-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                className="p-1.5 rounded-lg border border-white/10 text-neutral-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
});

AcademyExpertView.displayName = 'AcademyExpertView';
export default AcademyExpertView;

