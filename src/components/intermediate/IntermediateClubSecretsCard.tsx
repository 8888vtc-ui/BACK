'use client';

import React, { useState } from 'react';
import { Volume2, Sparkles, Shield, Dices, EyeOff, Eye, Compass, Trophy } from 'lucide-react';
import { useTranslation } from '../../i18n';

export interface IntermediateClubSecretsCardProps {
  onToggleHidePips?: () => void;
  isPipsHidden?: boolean;
}

export function IntermediateClubSecretsCard({
  onToggleHidePips,
  isPipsHidden = false,
}: IntermediateClubSecretsCardProps) {
  const { locale } = useTranslation();
  const lang = locale === 'en' ? 'en' : 'fr';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  const handleSpeak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    window.speechSynthesis.speak(utt);
  };

  const tabsContent = {
    1: {
      titleFr: 'Clé #1 — La Maîtrise du Videau (Là où se gagne le match !)',
      titleEn: 'Key #1 — Mastering the Doubling Cube (Where Matches Are Won!)',
      summaryFr: 'Les intermédiaires savent déplacer les pions mais perdent leurs matchs sur le Videau.',
      summaryEn: 'Intermediates know how to move checkers but lose matches on Doubling Cube decisions.',
      pointsFr: [
        'Doubler trop tard : Attendre que la position soit gagnée à 100 % permet à l’adversaire de refuser (Pass) et de vous priver du 2e point.',
        'Prendre trop tard : Accepter un videau avec moins de 22 % à 25 % de chances est un suicide mathématique.',
        'Astuce ERA (Error Rate Adaptatif) : Face à un joueur timoré, envoyez le videau un coup plus tôt. Face à un joueur qui prend tout, ne doublez que pour le punir !',
      ],
      pointsEn: [
        'Doubling too late: Waiting until you are 100% winning allows the opponent to drop (Pass), denying your 2nd point.',
        'Taking too late: Accepting a cube with under 22% to 25% winning chances is statistical suicide.',
        'ERA Tip (Adaptive Error Rate): Against a timid opponent, double one roll earlier. Against a reckless taker, double strictly to punish them!',
      ],
      audioFr: 'La maîtrise du videau : Ne doublez pas trop tard quand l’adversaire va refuser. Ne prenez pas en dessous de vingt-deux pour cent. Adaptez votre videau au profil adverse.',
      audioEn: 'Mastering the cube: Do not double too late when opponent will drop. Do not take below 22 percent. Adapt your cube to opponent profile.',
    },
    2: {
      titleFr: 'Clé #2 — Compter la Course sans Pips en Tournoi (Le Calcul Mental)',
      titleEn: 'Key #2 — Counting Race Without Pips in Tournaments (Fast Mental Math)',
      summaryFr: 'Sur un vrai plateau en bois en tournoi, aucun écran n’affiche les Pips.',
      summaryEn: 'On real wooden tournament boards, no screen displays the pip count.',
      pointsFr: [
        'Méthode des Paquets de 10 & Symétrie : Annulez mentalement les pions sur les mêmes flèches que l’adversaire.',
        'Repères clés : La position initiale vaut 167 pips. Une porte pleine de 2 pions sur la case 6 vaut 12 pips.',
        'L’écart de flèches : Comptez seulement la différence de flèches pour savoir en 5 secondes si vous devez Courir ou Garder l’embuscade !',
      ],
      pointsEn: [
        'Cluster Counting & Symmetry: Mentally cancel out checkers sitting on the exact same points as opponent.',
        'Key Benchmarks: The starting position is 167 pips. A solid 2-checker gate on point 6 equals 12 pips.',
        'Point Differential: Count only the difference in steps to know in 5 seconds whether to Run or Hold the anchor!',
      ],
      audioFr: 'Compter sans pips en tournoi : Utilisez la symétrie pour annuler les pions identiques et comptez la différence de flèches.',
      audioEn: 'Count without pips in tournaments: Use symmetry to cancel matching checkers and calculate the point spread.',
    },
    3: {
      titleFr: 'Clé #3 — La Discipline sur les Pions Isolés (Calcul sur 36)',
      titleEn: 'Key #3 — Discipline on Blots (Calculating Chances on 36 Rolls)',
      summaryFr: 'Ne laissez jamais un pion isolé au hasard : calculez les tirs exacts de l’adversaire.',
      summaryEn: 'Never leave a blot to chance: calculate opponent direct hitting rolls out of 36.',
      pointsFr: [
        '1 tir direct (ex: un 4) = 11 lancers sur 36 (~30 % de danger).',
        '2 tirs directs (ex: un 4 ou un 2) = 20 lancers sur 36 (> 55 % de danger, intenable !).',
        'Tir indirect à 7 cases = 6 lancers sur 36 (16,7 %). Au-delà de 6 cases, le danger s’effondre !',
      ],
      pointsEn: [
        '1 direct hit (e.g. a 4) = 11 rolls out of 36 (~30% danger).',
        '2 direct hits (e.g. 4 or 2) = 20 rolls out of 36 (> 55% danger, lethal!).',
        'Indirect hit at 7 points = 6 rolls out of 36 (16.7%). Beyond 6 pips, danger drops sharply!',
      ],
      audioFr: 'Discipline sur les pions isolés : 1 tir direct représente 11 lancers sur 36. Deux tirs directs dépassent cinquante-cinq pour cent de danger.',
      audioEn: 'Discipline on blots: One direct hit is 11 rolls out of 36. Two direct hits exceed 55 percent danger.',
    },
    4: {
      titleFr: 'Clé #4 — Choisir le Bon Plan de Jeu & S’Adapter au Niveau Réel',
      titleEn: 'Key #4 — Choosing the Right Game Plan & Adapting to Real Skill',
      summaryFr: 'Maîtriser les 4 grands plans de bataille et adapter sa stratégie.',
      summaryEn: 'Master the 4 fundamental battle plans and adapt your strategy.',
      pointsFr: [
        'La Course (Race) : Si vous êtes en avance de plus de 8 pips, rompez le contact et courez.',
        'Le Mur (Prime) : 4 à 6 portes d’affilée pour étouffer les dames adverses.',
        'L’Attaque (Blitz) : Fermer les portes dans son jan intérieur pour piéger l’adversaire sur la barre.',
        'Le Backgame & Solidification : En retard ou face à un novice, solidifiez le jeu pour éliminer la variance des dés.',
      ],
      pointsEn: [
        'The Race: When ahead by 8+ pips, break contact and run home.',
        'The Prime: 4 to 6 consecutive points to trap enemy back checkers.',
        'The Blitz: Close points in your home board to trap enemy checkers on the bar.',
        'Backgame & Consolidation: When trailing or facing a novice, solidify to crush luck and maximize skill.',
      ],
      audioFr: 'Choisir le bon plan de jeu : Course si en avance, Mur pour emprisonner, Blitz pour attaquer, ou Solidification pour étouffer le hasard.',
      audioEn: 'Choose the right game plan: Race when ahead, Prime to trap, Blitz to attack, or Solidify to overcome luck.',
    },
  };

  const current = tabsContent[activeTab];

  return (
    <div
      data-testid="intermediate-club-secrets-card"
      className="w-full rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-b from-[#141009] to-[#0a0d13] p-4 sm:p-5 shadow-xl text-white"
    >
      {/* Header avec switcher vocal */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#f3d27a]">
            <Trophy className="w-4 h-4 text-[#D4AF37]" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#fdf8eb]">
              {lang === 'fr'
                ? 'Pourquoi reste-t-on bloqué en Intermédiaire ? (Les 4 Clés de Club)'
                : 'Why Do Players Get Stuck in Intermediate? (The 4 Club Keys)'}
            </h3>
            <p className="text-[11px] text-stone-300">
              {lang === 'fr'
                ? 'Les secrets concrets pour passer de joueur amateur à joueur de tournoi redoutable.'
                : 'Concrete secrets to transition from casual amateur to formidable tournament player.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {onToggleHidePips && (
            <button
              type="button"
              data-testid="hide-pips-toggle-btn"
              onClick={onToggleHidePips}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                isPipsHidden
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10'
              }`}
            >
              {isPipsHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>
                {lang === 'fr'
                  ? isPipsHidden
                    ? 'Pips masqués (Mode Tournoi ON)'
                    : 'Masquer les Pips (Entraînement Tournoi)'
                  : isPipsHidden
                  ? 'Pips hidden (Tournament ON)'
                  : 'Hide Pips (Tournament Training)'}
              </span>
            </button>
          )}

          <button
            type="button"
            data-testid="club-secrets-voice-btn"
            onClick={() => handleSpeak(lang === 'fr' ? current.audioFr : current.audioEn)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{lang === 'fr' ? 'Écouter' : 'Listen'}</span>
          </button>
        </div>
      </div>

      {/* 4 Onglets Clairs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 my-3">
        {(
          [
            { id: 1, labelFr: '1. Le Videau', labelEn: '1. Doubling Cube', icon: Sparkles },
            { id: 2, labelFr: '2. Compter sans Pips', labelEn: '2. Count No Pips', icon: EyeOff },
            { id: 3, labelFr: '3. Pions Isolés /36', labelEn: '3. Blots on 36', icon: Dices },
            { id: 4, labelFr: '4. Plans de Jeu', labelEn: '4. Game Plans', icon: Compass },
          ] as const
        ).map((t) => {
          const isSel = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              data-testid={`club-key-tab-${t.id}`}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition active:scale-95 ${
                isSel
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#b88924] border-[#F3E5AB] text-slate-950 font-black shadow-md'
                  : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <t.icon className={`w-3.5 h-3.5 ${isSel ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="truncate">{lang === 'fr' ? t.labelFr : t.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Contenu de la Clé sélectionnée */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-2.5">
        <div>
          <h4 className="text-xs sm:text-sm font-black text-amber-200">
            {lang === 'fr' ? current.titleFr : current.titleEn}
          </h4>
          <p className="text-[11px] text-stone-400 mt-0.5">
            {lang === 'fr' ? current.summaryFr : current.summaryEn}
          </p>
        </div>

        <ul className="space-y-1.5">
          {(lang === 'fr' ? current.pointsFr : current.pointsEn).map((pt, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-xs text-stone-200 bg-white/[0.02] border border-white/5 p-2 rounded-lg"
            >
              <span className="text-[#D4AF37] font-bold shrink-0">•</span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

