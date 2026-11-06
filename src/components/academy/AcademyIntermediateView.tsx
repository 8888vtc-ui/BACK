'use client';

/**
 * @file src/components/academy/AcademyIntermediateView.tsx
 * @description Vue Club/Intermédiaire : 3 ateliers pratiques sur plateau interactif
 * (Videau en Club, Défi de course sans Pip Count, et Calcul des Tirs sur 36).
 * Strictement <= 280 lignes, 0 `any`.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Target, ArrowRight, Eye, ShieldAlert, Award } from 'lucide-react';

interface AcademyIntermediateViewProps {
  readonly isEn: boolean;
}

export const AcademyIntermediateView: React.FC<AcademyIntermediateViewProps> = React.memo(({ isEn }) => {
  // Atelier 1 : Videau Club
  const [cubePosition, setCubePosition] = useState<'A' | 'B' | 'C'>('A');

  // Atelier 2 : Défi Course
  const [raceRevealed, setRaceRevealed] = useState<boolean>(false);
  const [raceChoice, setRaceChoice] = useState<'RUN' | 'HOLD' | null>(null);

  // Atelier 3 : Tirs sur 36
  const [shotType, setShotType] = useState<1 | 2 | 7>(1);

  return (
    <div data-testid="academy-intermediate-view" className="space-y-6 w-full max-w-6xl mx-auto">
      {/* En-tête Club */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f3c65f]/15 border border-[#f3c65f]/40 text-[#f3c65f] text-xs font-bold">
          <Target className="w-3.5 h-3.5" />
          <span>{isEn ? 'Club Portal • 3 Tactical Workshops' : 'Portail Club • 3 Ateliers Tactiques sur Plateau'}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight">
          {isEn ? 'Tournament & Club Tactical Masterclass' : 'Maîtrise Tactique de Club & Tournoi'}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl mx-auto">
          {isEn
            ? 'Where 70% of club matches are decided: doubling cube decisions, rapid mental pip counting, and hit math on 36 rolls.'
            : 'Là où se gagnent 70 % des parties de club : gestion du videau, estimation de course sans compteur, et probabilités de frappe sur 36.'}
        </p>
      </div>

      {/* ================= ATELIER 1 : LE VIDEAU EN CLUB ================= */}
      <section
        data-testid="intermediate-cube-workshop"
        className="rounded-2xl border border-white/10 bg-[#0B1015]/95 p-5 shadow-2xl space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
              {isEn ? 'Workshop 1 • The Doubling Cube' : 'Atelier 1 • Maîtriser le Videau en Club'}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {isEn ? 'The 3 Standard Club Positions (70% of Match Results)' : 'Les 3 Positions Types de Club (70 % des Décisions)'}
            </h3>
          </div>
          <div className="flex gap-1.5">
            <button type="button" data-testid="cube-pos-btn-A" onClick={() => setCubePosition('A')} className={`px-3 py-1 rounded-lg border text-xs font-bold transition ${cubePosition === 'A' ? 'bg-white/10 text-[#D4AF37] border-[#D4AF37]/50' : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'}`}>Position A (Double)</button>
            <button type="button" data-testid="cube-pos-btn-B" onClick={() => setCubePosition('B')} className={`px-3 py-1 rounded-lg border text-xs font-bold transition ${cubePosition === 'B' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'}`}>Position B (Take)</button>
            <button type="button" data-testid="cube-pos-btn-C" onClick={() => setCubePosition('C')} className={`px-3 py-1 rounded-lg border text-xs font-bold transition ${cubePosition === 'C' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'}`}>Position C (Pass)</button>
          </div>
        </div>

        {/* Plateau interactif SVG illustrant la position de videau */}
        <div className="relative w-full aspect-[600/200] rounded-xl border border-white/10 bg-[#07130e] overflow-hidden">
          <svg viewBox="0 0 600 200" className="w-full h-full select-none">
            <rect x="0" y="0" width="600" height="200" fill="#091813" />
            <rect x="286" y="0" width="28" height="200" fill="#040b08" stroke="#D4AF37" strokeOpacity="0.3" />
            {/* Dé videau animé */}
            <g transform="translate(60, 100)">
              <rect x="-24" y="-24" width="48" height="48" rx="8" fill="#18181b" stroke="#D4AF37" strokeWidth="2.5" />
              <text x="0" y="8" fill="#F3E5AB" fontSize="22" fontWeight="black" textAnchor="middle">
                {cubePosition === 'A' ? '2' : cubePosition === 'B' ? '2' : '4'}
              </text>
            </g>
            {/* Texte et géométrie de la position */}
            <text x="140" y="70" fill="#ffffff" fontSize="13" fontWeight="bold">
              {cubePosition === 'A'
                ? (isEn ? 'Market Window Open (~68-72% equity)' : 'Fenêtre de Double Ouverte (~68–72 % de gain)')
                : cubePosition === 'B'
                ? (isEn ? 'Clear Take Zone (23-26% winning chances)' : 'Zone de Take Claire (23–26 % de chances de retour)')
                : (isEn ? 'Drop/Pass Zone (<21.5% take point threshold)' : 'Zone de Pass Obligatoire (< 21,5 % de chances)')}
            </text>
            <text x="140" y="105" fill="#a3a3a3" fontSize="11">
              {cubePosition === 'A'
                ? (isEn ? 'Double NOW before your market is lost on your next good roll.' : 'Doublez MAINTENANT avant que votre coup fort ne fasse perdre le marché.')
                : cubePosition === 'B'
                ? (isEn ? 'In money or normal match score, taking pays off if you win >= 25%.' : 'Acceptez : perdre 1 pt en refusant est pire que tenter les 25 % de retour.')
                : (isEn ? 'Save your match equity: conceding 1 point preserves victory.' : 'Refusez sans regret : concéder 1 pt protège vos chances de gagner le match.')}
            </text>
          </svg>
        </div>

        <div className="flex justify-end">
          <Link
            href="/puzzles?gate=intermediate&focus=cube"
            data-testid="intermediate-cube-quizzes-btn"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-b from-[#E5C158] via-[#D4AF37] to-[#B5902B] text-black font-bold text-xs shadow-md hover:brightness-105 transition"
          >
            <span>{isEn ? 'Practice Club Cube Quizzes →' : 'S\'entraîner sur les Quiz Videau de Club →'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ================= ATELIER 2 : ESTIMATION DE COURSE SANS PIPS ================= */}
      <section
        data-testid="intermediate-race-workshop"
        className="rounded-2xl border border-white/10 bg-[#0B1015]/95 p-5 shadow-2xl space-y-4"
      >
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
            {isEn ? 'Workshop 2 • Race Calculation' : 'Atelier 2 • Défi Course sans Compteur'}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white">
            {isEn ? 'Count the Pip Difference in 5 Seconds (Without Pip Counter)' : 'Compter la Course en 5s SANS le Compteur de Pips'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs text-neutral-300">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <strong className="text-amber-300">{isEn ? '1. Visual Symmetry:' : '1. Symétrie visuelle :'}</strong>{' '}
            {isEn ? 'Mentally cancel out white and black checkers sitting on opposite matching points.' : 'Annulez mentalement les pions blancs et noirs situés sur les mêmes pointes opposées.'}
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <strong className="text-amber-300">{isEn ? '2. Clusters of 10:' : '2. Paquets de 10 :'}</strong>{' '}
            {isEn ? 'Points 7/8 equal ~15 pips per pair; midpoint 13 equals 13 pips.' : 'Les pointes 7/8 valent ~15 pips par paire, le point 13 vaut 13 pips.'}
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <strong className="text-amber-300">{isEn ? '3. Golden Rule:' : '3. La Règle d’Or :'}</strong>{' '}
            {isEn ? 'Ahead by 10+ pips = Run! Trailing = Hold your anchor.' : 'Plus de 10 pips d\'avance = Courez ! En retard = Gardez votre ancre.'}
          </div>
        </div>

        {/* Plateau de défi de course avec Pips masqués */}
        <div className="relative w-full aspect-[600/180] rounded-xl border border-white/10 bg-[#07130e] overflow-hidden flex items-center justify-center">
          <svg viewBox="0 0 600 180" className="w-full h-full select-none">
            <rect x="0" y="0" width="600" height="180" fill="#091813" />
            <rect x="286" y="0" width="28" height="180" fill="#040b08" stroke="#D4AF37" strokeOpacity="0.3" />
            {/* Pions blancs et noirs positionnés */}
            <circle cx="120" cy="140" r="10" fill="#ffffff" stroke="#D4AF37" /><circle cx="120" cy="120" r="10" fill="#ffffff" stroke="#D4AF37" />
            <circle cx="160" cy="140" r="10" fill="#ffffff" stroke="#D4AF37" /><circle cx="480" cy="140" r="10" fill="#ffffff" stroke="#D4AF37" />
            <circle cx="120" cy="40" r="10" fill="#18181b" stroke="#ef4444" /><circle cx="200" cy="40" r="10" fill="#18181b" stroke="#ef4444" />
            {/* Masquage du Pip Count */}
            <rect x="230" y="70" width="140" height="40" rx="8" fill="#18181b" stroke="#D4AF37" strokeDasharray="3 3" />
            <text x="300" y="95" fill="#facc15" fontSize="12" fontWeight="black" textAnchor="middle">
              {raceRevealed ? (isEn ? 'White 108 · Black 122' : 'Blancs 108 · Noirs 122') : (isEn ? 'Pips Hidden' : 'Pips Masqués')}
            </text>
          </svg>
        </div>

        {/* Choix interactif du joueur */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="race-run-btn"
              onClick={() => { setRaceChoice('RUN'); setRaceRevealed(true); }}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition ${
                raceChoice === 'RUN' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/5 border-white/10 text-neutral-200 hover:bg-white/10'
              }`}
            >
              {isEn ? 'I am ahead: I RUN' : 'Je suis en avance : Je cours'}
            </button>
            <button
              type="button"
              data-testid="race-hold-btn"
              onClick={() => { setRaceChoice('HOLD'); setRaceRevealed(true); }}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition ${
                raceChoice === 'HOLD' ? 'bg-white/10 text-[#D4AF37] border-[#D4AF37]/50' : 'bg-white/5 border-white/10 text-neutral-200 hover:bg-white/10'
              }`}
            >
              {isEn ? 'I am behind: I HOLD ANCHOR' : 'Je suis en retard : Je garde mon ancre'}
            </button>
          </div>

          {raceRevealed && (
            <div className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>{isEn ? 'Exact! White has +14 pips lead: racing plan is optimal.' : 'Exact ! Blancs ont +14 pips d\'avance : la course pure est le bon plan.'}</span>
            </div>
          )}
        </div>
      </section>

      {/* ================= ATELIER 3 : LES PIONS ISOLÉS & TIRS SUR 36 ================= */}
      <section
        data-testid="intermediate-shots-workshop"
        className="rounded-2xl border border-white/10 bg-[#0B1015]/95 p-5 shadow-2xl space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
              {isEn ? 'Workshop 3 • Blot Probabilities' : 'Atelier 3 • Compter les Tirs sur 36'}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {isEn ? 'The 3 Numbers Every Club Player Must Know' : 'Les 3 Chiffres Magiques du Joueur de Club'}
            </h3>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              data-testid="shot-pill-1"
              onClick={() => setShotType(1)}
              className={`px-3 py-1 rounded-lg border text-xs font-bold transition ${
                shotType === 1 ? 'bg-white/10 text-[#D4AF37] border-[#D4AF37]/50' : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
              }`}
            >
              {isEn ? '1 Direct Shot (11/36)' : '1 Tir Direct (11/36)'}
            </button>
            <button
              type="button"
              data-testid="shot-pill-2"
              onClick={() => setShotType(2)}
              className={`px-3 py-1 rounded-lg border text-xs font-bold transition ${
                shotType === 2 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
              }`}
            >
              {isEn ? '2 Direct Shots (20/36)' : '2 Tirs Directs (20/36)'}
            </button>
            <button
              type="button"
              data-testid="shot-pill-7"
              onClick={() => setShotType(7)}
              className={`px-3 py-1 rounded-lg border text-xs font-bold transition ${
                shotType === 7 ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
              }`}
            >
              {isEn ? 'Indirect 7 (6/36)' : 'Tir Indirect 7 (6/36)'}
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/20 via-black to-slate-950 border border-amber-400/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span className="text-sm sm:text-base font-black text-white">
                {shotType === 1 && (isEn ? '1 Direct Shot (1 to 6 pips distance) = 11 rolls (31%)' : '1 Tir Direct (distance 1 à 6 cases) = 11 lancers (31 %)')}
                {shotType === 2 && (isEn ? '2 Direct Shots = 20 rolls (56% danger zone)' : '2 Tirs Directs (2 pointes adverses) = 20 lancers (56 % danger)')}
                {shotType === 7 && (isEn ? '1 Indirect Shot at 7 pips = 6 rolls (17% safe blot)' : '1 Tir Indirect à 7 cases = 6 lancers (17 % blot sécurisé)')}
              </span>
            </div>
            <p className="text-xs text-neutral-300">
              {shotType === 1 && (isEn ? 'A single die number hits. You will be hit about 1 out of 3 times.' : 'Un seul dé suffit à frapper. Vous serez frappé environ 1 fois sur 3.')}
              {shotType === 2 && (isEn ? 'More than half of all rolls hit! Never leave two direct shots without strong compensation.' : 'Plus d\'un lancer sur deux vous frappe ! Évitez à tout prix les doubles tirs.')}
              {shotType === 7 && (isEn ? 'Requires combination (6-1, 5-2, 4-3). Distance 7 is the safest place to slot outside.' : 'Nécessite deux dés combinés. La distance 7 est la plus sûre du jeu pour poser un pion.')}
            </p>
          </div>

          <div className="px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono text-base font-black shrink-0">
            {shotType === 1 ? '30.6 %' : shotType === 2 ? '55.6 %' : '16.7 %'}
          </div>
        </div>
      </section>
    </div>
  );
});

AcademyIntermediateView.displayName = 'AcademyIntermediateView';
export default AcademyIntermediateView;
