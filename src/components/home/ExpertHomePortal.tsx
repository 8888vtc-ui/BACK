'use client';

/**
 * @file src/components/home/ExpertHomePortal.tsx
 * @description Portail d'Accueil Division Expert / Pro — 100 % Zéro-Scroll & Zéro Jargon Inventé.
 * 2 Cartes Uniquement : Cockpit Tournoi Officiel + Bilan de Performance Officiel (Pions vs Videau).
 * Strictement <= 300 lignes, 0 any, 0 métrique inventée.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Trophy, EyeOff, Eye, Swords, Share2, Activity, Microscope, Flame, Target } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useAuthenticPlayerStats } from '../../hooks/useAuthenticPlayerStats';

interface ExpertHomePortalProps {
  readonly onStartExpertMatch: (length: number) => void;
  readonly onInviteFriend?: () => void;
  readonly onOpen3PlyQuizzes: () => void;
  readonly onOpenPlayerCard?: () => void;
}

export const ExpertHomePortal: React.FC<ExpertHomePortalProps> = React.memo(({
  onStartExpertMatch,
  onInviteFriend,
  onOpen3PlyQuizzes,
  onOpenPlayerCard,
}) => {
  const { locale } = useTranslation();
  const isEn = locale === 'en';
  const stats = useAuthenticPlayerStats();

  const [matchLength, setMatchLength] = useState<number>(7);
  const [isPipsHidden, setIsPipsHidden] = useState<boolean>(false);

  const isGuest = !stats.isRegistered;
  const isCalibrating = stats.isRegistered && stats.gamesPlayed === 0;

  const globalVal = isGuest ? '—' : isCalibrating ? 'En calibrage' : (stats.globalPR?.toFixed(1) ?? '—');
  const checkerVal = isGuest ? '—' : isCalibrating ? 'En calibrage' : (stats.checkerPR?.toFixed(1) ?? '—');
  const cubeVal = isGuest ? '—' : isCalibrating ? 'En calibrage' : (stats.cubePR?.toFixed(1) ?? '—');

  const globalSub = isGuest ? (isEn ? 'Registered members only' : 'Réservé aux membres inscrits') : isCalibrating ? (isEn ? '1st match required' : '1re partie requise') : `${stats.gamesPlayed} ${stats.gamesPlayed > 1 ? (isEn ? 'parties analysées' : 'parties analysées') : (isEn ? 'partie analysée' : 'partie analysée')}`;
  const checkerSub = isGuest ? (isEn ? 'Registered members only' : 'Réservé aux membres inscrits') : isCalibrating ? (isEn ? '0 decision analyzed' : '0 décision analysée') : (stats.checkerPR! < 5.0 ? 'Niveau Master (< 5.0)' : 'Précision pions');
  const cubeSub = isGuest ? (isEn ? 'Registered members only' : 'Réservé aux membres inscrits') : isCalibrating ? (isEn ? '0 decision analyzed' : '0 décision analysée') : (stats.cubePR! > 7.0 ? 'Axe de travail prioritaire' : 'Précision videau');

  const handleLaunchMatch = () => {
    onStartExpertMatch(matchLength);
  };

  return (
    <div data-testid="expert-home-portal" className="flex flex-col gap-3.5 w-full max-w-5xl mx-auto py-1 sm:py-2">
      {/* En-tête Cockpit Pro avec Télémétrie Officielle */}
      <div className="rounded-2xl border border-[#d4af37]/40 bg-gradient-to-r from-[#140e08] via-[#1a120a] to-[#110d07] p-4 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#f3d27a]">
              {isEn ? '🏆 Expert / Pro Cockpit · Open Sage 3-Ply (PR 0.23)' : '🏆 Cockpit Expert / Pro · Moteur Open Sage 3-Ply (PR 0.23)'}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-[#f7f3e8]">{isEn ? 'World Championship Telemetry & Tournament Conditions' : 'Télémétrie de Championnat du Monde & Conditions Tournoi'}</h2>
          <p className="text-xs text-stone-300">{isEn ? 'Rigorous 3-ply neural lookahead, Crawford & DMP score rules, and instantaneous ΔEMG equity tracking.' : 'Évaluation neuronale 3-ply, règles Crawford & DMP, et télémétrie ΔEMG chirurgicale au millième.'}</p>
        </div>

        {/* Télémétrie Joueur Officielle : ER/PR & RATING */}
        {!stats.isRegistered ? (
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-3.5 py-2 rounded-xl shrink-0">
            <span className="text-xs font-mono text-stone-300">
              STATUT : <strong className="text-[#f3d27a]">Invité</strong> ({isEn ? 'Sign in to calculate your PR' : 'Inscrivez-vous pour calculer votre PR'})
            </span>
          </div>
        ) : stats.gamesPlayed === 0 ? (
          <div className="flex items-center gap-4 bg-black/50 border border-white/10 px-4 py-2 rounded-xl shrink-0 self-stretch sm:self-auto justify-around sm:justify-start">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-stone-400">ER / PR</span>
              <span data-testid="expert-er-pr" className="text-xs sm:text-sm font-bold font-mono text-amber-300">{isEn ? 'Calibrating (0/1 match)' : 'Calibrage (0/1 partie)'}</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-stone-400">RATING</span>
              <span data-testid="expert-rating" className="text-base font-black font-mono text-amber-300">{stats.eloRating ?? 1500}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 bg-black/50 border border-white/10 px-4 py-2 rounded-xl shrink-0 self-stretch sm:self-auto justify-around sm:justify-start">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-stone-400">ER / PR</span>
              <span data-testid="expert-er-pr" className="text-base font-black font-mono text-[#f3d27a]">{stats.globalPR?.toFixed(1)}</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-stone-400">RATING</span>
              <span data-testid="expert-rating" className="text-base font-black font-mono text-amber-300">{stats.eloRating}</span>
            </div>
          </div>
        )}
      </div>

      {/* CARTE 1 : COCKPIT DE MATCH DE TOURNOI OFFICIEL */}
      <div className="rounded-2xl border-2 border-[#D4AF37]/50 bg-gradient-to-b from-[#18120a] via-[#100d07] to-[#0a0d13] p-4 sm:p-5 shadow-2xl flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D4AF37]/20 text-[#f3d27a]">
                <Trophy size={16} />
              </span>
              <h3 className="text-sm sm:text-base font-black text-[#fdf8eb]">
                {isEn ? 'Official Tournament Match Cockpit' : 'Cockpit de Match de Tournoi Officiel'}
              </h3>
            </div>
            <p className="text-xs text-stone-300 mt-0.5">
              {isEn
                ? 'Official WBGF formats with Bronstein clocks, Crawford rule, and Jacoby Money Game.'
                : 'Formats officiels WBGF avec pendules Bronstein, règle Crawford et Money Game Jacoby.'}
            </p>
          </div>

          {/* Bouton Masquer Pips */}
          <button
            type="button"
            data-testid="expert-hide-pips-btn"
            onClick={() => setIsPipsHidden((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
              isPipsHidden
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10'
            }`}
          >
            {isPipsHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>
              {isEn
                ? isPipsHidden
                  ? 'Pip Count Hidden (Pro Tourney)'
                  : 'Hide Pip Count (Tournament)'
                : isPipsHidden
                ? 'Pip Count Masqué (Pro Tournoi)'
                : 'Conditions Tournoi (Masquer Pip Count)'}
            </span>
          </button>
        </div>

        {/* Formats de match complets : 3, 5, 7, 9, 11, 21 pts et Money Game */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { len: 3, label: '3 pts', testId: 'expert-format-3' },
            { len: 5, label: '5 pts', testId: 'expert-format-5' },
            { len: 7, label: '7 pts', testId: 'expert-format-7' },
            { len: 9, label: '9 pts', testId: 'expert-format-9' },
            { len: 11, label: '11 pts', testId: 'expert-format-11' },
            { len: 21, label: '21 pts', testId: 'expert-format-21' },
            { len: 0, label: isEn ? 'Money Game' : 'Money Game', testId: 'expert-format-money' },
          ].map((fmt) => {
            const isSelected = matchLength === fmt.len;
            return (
              <button
                key={fmt.len}
                type="button"
                data-testid={fmt.testId}
                onClick={() => setMatchLength(fmt.len)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition active:scale-95 ${
                  isSelected
                    ? 'bg-[#D4AF37] border-[#F3E5AB] text-slate-950 font-black shadow-md'
                    : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>

        {/* Boutons d'action : Lancer le match Or + Inviter un adversaire */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            data-testid="expert-play-btn"
            onClick={handleLaunchMatch}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#f5d98b] to-[#b88924] px-4 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg hover:brightness-105 active:scale-95 transition"
          >
            <Swords size={16} className="text-slate-950" />
            <span>
              {isEn
                ? `LAUNCH MATCH (OPEN SAGE 3-PLY) →`
                : `⚔️ LANCER LE MATCH (OPEN SAGE 3-PLY) →`}
            </span>
          </button>
          <button
            type="button"
            data-testid="expert-invite-btn"
            onClick={onInviteFriend ?? (() => {})}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-xs sm:text-sm font-bold text-stone-200 hover:bg-white/10 hover:text-white active:scale-95 transition"
          >
            <Share2 size={16} className="text-[#D4AF37]" />
            <span>
              {isEn ? '🔗 Invite Opponent (1-Click Link)' : '🔗 Inviter un Adversaire (Lien 1-Clic)'}
            </span>
          </button>
        </div>
      </div>

      {/* CARTE 2 : BILAN DE PERFORMANCE OFFICIEL (PIONS VS VIDEAU) & OUTILS PRO */}
      <div
        data-testid="decomposed-pr-panel"
        className="rounded-2xl border border-[#D4AF37]/35 bg-[#0a0c10]/95 p-4 sm:p-5 shadow-xl text-white flex flex-col gap-3"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D4AF37]/20 text-[#f3d27a]">
              <Activity className="w-4 h-4 text-[#D4AF37]" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#fdf8eb]">
                {isEn ? 'Official Performance Breakdown & Pro Tools' : 'Bilan de Performance Officiel (Pions vs Videau) & Outils Pro'}
              </h3>
              <p className="text-xs text-stone-300">
                {isEn ? 'Isolate Checker PR from Cube PR to focus your study time on actual leak areas.' : 'Isolez le PR Pions du PR Videau pour cibler précisément votre axe de travail.'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
            PR CIBLE &lt; 6.0
          </span>
        </div>

        {/* 3 indicateurs officiels selon le statut réel du joueur */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 sm:p-3 text-center flex flex-col items-center">
            <span className="text-[11px] font-mono text-stone-400">ER / PR GLOBAL</span>
            <span data-testid="pr-global-val" className={`font-mono font-black ${isCalibrating ? 'text-xs sm:text-sm text-amber-300' : isGuest ? 'text-base sm:text-xl text-stone-500' : 'text-base sm:text-xl text-[#f3d27a]'}`}>{globalVal}</span>
            <span className="text-[10px] sm:text-[11px] text-stone-300">{globalSub}</span>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5 sm:p-3 text-center flex flex-col items-center">
            <span className="text-[11px] font-mono text-stone-400">PR PIONS (CHECKER)</span>
            <span data-testid="pr-checker-val" className={`font-mono font-black ${isCalibrating ? 'text-xs sm:text-sm text-amber-300' : isGuest ? 'text-base sm:text-xl text-stone-500' : 'text-base sm:text-xl text-emerald-400'}`}>{checkerVal}</span>
            <span className="text-[10px] sm:text-[11px] text-emerald-300 font-bold">{checkerSub}</span>
          </div>
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-2.5 sm:p-3 text-center flex flex-col items-center">
            <span className="text-[11px] font-mono text-stone-400">PR VIDEAU (CUBE)</span>
            <span data-testid="pr-cube-val" className={`font-mono font-black ${isCalibrating ? 'text-xs sm:text-sm text-amber-300' : isGuest ? 'text-base sm:text-xl text-stone-500' : 'text-base sm:text-xl text-amber-300'}`}>{cubeVal}</span>
            <span className="text-[10px] sm:text-[11px] text-amber-400 font-bold">{cubeSub}</span>
          </div>
        </div>

        {isGuest && (
          <button
            type="button"
            data-testid="expert-create-card-cta"
            onClick={onOpenPlayerCard}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/50 bg-gradient-to-r from-[#D4AF37]/20 via-[#f5d98b]/20 to-[#b88924]/20 hover:bg-[#D4AF37]/30 px-4 py-2 text-xs sm:text-sm font-bold text-[#F3E5AB] transition active:scale-95"
          >
            <span>👤 {isEn ? 'Create my Player Card (5s) to activate my PR & Elo →' : 'Créer ma Carte de Joueur (5s) pour activer mon PR & Elo →'}</span>
          </button>
        )}
        {isCalibrating && (
          <button
            type="button"
            data-testid="expert-start-calibration-cta"
            onClick={handleLaunchMatch}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-4 py-2 text-xs sm:text-sm font-bold text-amber-200 transition active:scale-95"
          >
            <span>⚔️ {isEn ? 'Play my 1st calibration match →' : 'Lancer ma 1re partie de calibrage →'}</span>
          </button>
        )}

        {/* 3 boutons d'accès direct aux outils Pro */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <Link
            href="/analysis"
            data-testid="expert-open-studio-btn"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-stone-200 hover:border-[#D4AF37]/50 hover:text-white transition active:scale-95"
          >
            <Microscope size={14} className="text-[#D4AF37]" />
            <span>{isEn ? '3-Ply Analysis Studio →' : '🔬 Ouvrir le Studio d’Analyse 3-Ply →'}</span>
          </Link>
          <Link
            href="/puzzles?filter=personal-blunders"
            data-testid="expert-fix-blunders-btn"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-rose-300 hover:border-rose-400/50 hover:text-rose-200 transition active:scale-95"
          >
            <Flame size={14} className="text-rose-400" />
            <span>{isEn ? 'Fix Recent Blunders →' : '🔥 Corriger mes Blunders Récents →'}</span>
          </Link>
          <button
            type="button"
            data-testid="expert-competition-quizzes-btn"
            onClick={onOpen3PlyQuizzes}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 text-xs font-bold text-[#F3E5AB] hover:bg-[#D4AF37]/20 transition active:scale-95"
          >
            <Target size={14} className="text-[#D4AF37]" />
            <span>{isEn ? 'Competition Quizzes (N+1) →' : '🎯 Quiz Compétition (Objectif N+1) →'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

ExpertHomePortal.displayName = 'ExpertHomePortal';
