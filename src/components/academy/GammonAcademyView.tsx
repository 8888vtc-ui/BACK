'use client';

/**
 * @file src/components/academy/GammonAcademyView.tsx
 * @description Vue principale du Hub "Gammon Academy" (`/academy`).
 * Connecté directement au sélecteur universel du Header (usePlayerTierGate).
 * Affiche exclusivement :
 * - DÉBUTANT : AcademyBeginnerView (100% visuel, 2 studios sur plateau)
 * - INTERMÉDIAIRE : AcademyIntermediateView (Ateliers Club Videau, Course 5s et Tirs sur 36)
 * - EXPERT : AcademyExpertView (Théorie Cap 6.0, MET Kazaross-XG2 et concepts filtrés)
 * Strictement <= 60 lignes, 0 `any`.
 */

import React from 'react';
import AppNavbar from '../nav/AppNavbar';
import { useTranslation, type PrimaryLocale } from '../../i18n';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';
import AcademyBeginnerView from './AcademyBeginnerView';
import AcademyIntermediateView from './AcademyIntermediateView';
import AcademyExpertView from './AcademyExpertView';

export const GammonAcademyView: React.FC = () => {
  const { locale, dir } = useTranslation();
  const { tierGate } = usePlayerTierGate();
  const safeLocale: PrimaryLocale =
    locale === 'fr' || locale === 'en' || locale === 'es' || locale === 'pt' || locale === 'de' || locale === 'ar'
      ? locale
      : 'en';
  const isEn = safeLocale === 'en';

  return (
    <div
      dir={dir}
      data-testid="gammon-academy-view"
      className="min-h-dvh w-full overflow-y-auto text-slate-100 selection:bg-amber-600/40 flex flex-col relative"
      style={{
        background: 'radial-gradient(ellipse 85% 50% at 50% -8%, rgba(212, 175, 55, 0.14) 0%, rgba(20, 28, 46, 0.92) 42%, #090d16 78%, #04060b 100%)',
      }}
    >
      <AppNavbar activeTab="academy" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {tierGate === 'BEGINNER' && <AcademyBeginnerView isEn={isEn} />}
        {tierGate === 'INTERMEDIATE' && <AcademyIntermediateView isEn={isEn} />}
        {tierGate === 'EXPERT' && <AcademyExpertView locale={safeLocale} />}
      </main>
    </div>
  );
};

export default GammonAcademyView;
