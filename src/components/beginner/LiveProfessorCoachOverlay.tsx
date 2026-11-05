'use client';

import React, { useState } from 'react';
import { RotateCcw, Lightbulb, GraduationCap, Sparkles, Volume2, BookOpen, ShieldAlert, Award, Compass } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { LastMoveFeedback } from '../../hooks/useCoachHelpers';
import { BeginnerInteractiveGuideModal } from './BeginnerInteractiveGuideModal';

export interface LiveProfessorCoachOverlayProps {
  dice?: [number, number] | null;
  canUndo?: boolean;
  onUndoMove?: () => void;
  onAskProfessorHint?: () => void;
  lastMoveFeedback?: LastMoveFeedback | null;
  pipDifference?: number;
  antiFrustrationNotice?: 'BAR_PRIORITY' | 'CLOSED_POINT' | null;
  isMasterMove?: boolean;
}

export function LiveProfessorCoachOverlay({
  dice,
  canUndo = true,
  onUndoMove,
  onAskProfessorHint,
  lastMoveFeedback,
  pipDifference = 10,
  antiFrustrationNotice,
  isMasterMove = true,
}: LiveProfessorCoachOverlayProps) {
  const { locale } = useTranslation();
  const lang = locale === 'en' ? 'en' : 'fr';
  const [hintRequested, setHintRequested] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [activeNotice, setActiveNotice] = useState<'BAR_PRIORITY' | 'CLOSED_POINT' | null>(
    antiFrustrationNotice ?? null
  );

  const isBlunderFeedback = Boolean(lastMoveFeedback && Math.abs(lastMoveFeedback.equityLoss) >= 0.045);

  const getProfessorPrompt = (): string => {
    if (isBlunderFeedback) {
      return lang === 'fr'
        ? "Attention : ce coup est un 'Blunder' (une gaffe qui gâche vos chances de victoire). Cliquez sur « Réessayer mon coup » pour trouver le meilleur coup statistique !"
        : "Careful: this move is a 'Blunder' (a mistake hurting winning chances). Click 'Retry move' to find the best play!";
    }
    if (hintRequested) {
      return lang === 'fr'
        ? 'Astuce du Professeur : Cherchez à faire une porte (idéalement sur la flèche 5) pour maîtriser les 36 combinaisons de dés et protéger vos pions !'
        : 'Professor Tip: Aim to build a gate (ideally on the 5-point) to command the 36 dice combinations and protect your checkers!';
    }
    if (dice) {
      return lang === 'fr'
        ? `🎲 Vous avez lancé ${dice[0]}-${dice[1]} : où déplacer vos pions pour mettre les statistiques de votre côté ?`
        : `🎲 You rolled ${dice[0]}-${dice[1]}: where should you move checkers to put odds on your side?`;
    }
    return lang === 'fr'
      ? "Le Professeur vous accompagne : le hasard lance les dés, mais c'est votre stratégie qui fait la différence. Demandez un conseil à tout moment !"
      : "The Professor guides you: dice bring luck, but strategy makes the difference. Ask for advice anytime!";
  };

  const getRaceCompassText = (): string => {
    if (pipDifference >= 8) {
      return lang === 'fr'
        ? `🏃 Course : Tu es en avance de ${pipDifference} cases ! Ramène tes dames en sécurité.`
        : `🏃 Race: You lead by ${pipDifference} steps! Bring your checkers home safely.`;
    }
    if (pipDifference <= -8) {
      const trail = Math.abs(pipDifference);
      return lang === 'fr'
        ? `🛡️ En embuscade (${trail} cases de retard) : Garde une porte chez l'adversaire et attends une occasion de frapper !`
        : `🛡️ Ambush (${trail} steps behind): Keep an anchor in opponent board and wait to strike!`;
    }
    return lang === 'fr'
      ? '⚖️ Course serrée : Construis tes portes et protège tes pions isolés.'
      : '⚖️ Tight race: Build gates and protect your single blots.';
  };

  const handleSpeakPrompt = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(getProfessorPrompt());
    utt.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    window.speechSynthesis.speak(utt);
  };

  const handleAskHint = () => {
    setHintRequested(true);
    onAskProfessorHint?.();
  };

  const currentNotice = activeNotice ?? antiFrustrationNotice;

  return (
    <>
      <div
        data-testid="live-professor-coach-overlay"
        className={`w-full max-w-5xl mx-auto px-3.5 py-2.5 flex flex-col gap-2 rounded-xl border backdrop-blur-md text-xs mb-1.5 shrink-0 transition-colors ${
          isBlunderFeedback
            ? 'bg-amber-950/60 border-amber-400/50 text-amber-100'
            : 'bg-[#0c141d]/90 border-[#D4AF37]/35 text-stone-100'
        }`}
      >
        {/* Ligne 1 : Question bienveillante & Boutons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#f3d27a]">
              <GraduationCap className="w-4 h-4" />
            </span>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black uppercase tracking-wider text-[10px] text-[#D4AF37]">
                  {lang === 'fr' ? 'Professeur Interactif' : 'Interactive Professor'}
                </span>
                {isMasterMove && (
                  <span
                    data-testid="master-move-badge"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-amber-600/30 border border-[#D4AF37]/60 text-[#f3d27a] font-bold text-[10px] shadow-sm animate-pulse"
                  >
                    <Award className="w-3 h-3 text-[#D4AF37]" />
                    <span>{lang === 'fr' ? '✨ Coup de Maître ! (+50 PTS)' : '✨ Master Move! (+50 PTS)'}</span>
                  </span>
                )}
              </div>
              <p data-testid="professor-dialogue-text" className="text-sm sm:text-base font-medium text-white leading-relaxed line-clamp-2">
                {getProfessorPrompt()}
              </p>
            </div>
          </div>

          {/* Boutons d'interaction */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
            <button
              type="button"
              data-testid="professor-voice-btn"
              onClick={handleSpeakPrompt}
              title={lang === 'fr' ? 'Écouter le Professeur' : 'Listen to Professor'}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              data-testid="professor-open-guide-btn"
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-stone-200 border border-white/10 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{lang === 'fr' ? 'Guide 6 Chapitres' : '6-Chapter Guide'}</span>
            </button>

            <button
              type="button"
              data-testid="professor-ask-hint-btn"
              onClick={handleAskHint}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#F3E5AB] border border-[#D4AF37]/50 font-bold transition"
            >
              <Lightbulb className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{lang === 'fr' ? 'Idée du Professeur' : 'Professor Hint'}</span>
            </button>

            {/* Bouton permanent : Rejouer mon dernier coup */}
            <button
              type="button"
              data-testid="professor-undo-move-btn"
              onClick={() => {
                setHintRequested(false);
                onUndoMove?.();
              }}
              disabled={!canUndo}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === 'fr' ? '↺ Rejouer mon dernier coup' : '↺ Undo / Retry move'}</span>
            </button>
          </div>
        </div>

        {/* Guidage Visuel du Sens de Marche (24 -> 1) */}
        <div
          data-testid="direction-horseshoe-indicator"
          className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-amber-200 text-xs sm:text-sm font-mono font-bold"
        >
          <span className="flex items-center gap-1.5">
            <Compass size={14} className="text-amber-400 shrink-0" />
            <span>{lang === 'fr' ? 'Sens de marche :' : 'Checker Direction:'}</span>
            <span className="text-[#f3d27a]">{lang === 'fr' ? 'Case 24 (Adverse)' : 'Point 24 (Opponent)'}</span>
            <span>➔</span>
            <span className="text-emerald-400">{lang === 'fr' ? 'Case 1 (Votre Maison)' : 'Point 1 (Home Board)'}</span>
          </span>
          <span className="text-stone-400 text-xs hidden md:inline">{lang === 'fr' ? 'Sortie des dames en Case 1' : 'Bear off at Point 1'}</span>
        </div>

        {/* Ligne 2 : Jauge de Course & Détecteur Anti-Frustration */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 pt-1.5 border-t border-white/10">
          <div
            data-testid="beginner-race-compass"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-[11px] font-semibold"
          >
            <span>{getRaceCompassText()}</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-stone-400">
            <button
              type="button"
              onClick={() => setActiveNotice(activeNotice === 'BAR_PRIORITY' ? 'CLOSED_POINT' : 'BAR_PRIORITY')}
              className="hover:text-amber-300 underline transition"
            >
              {lang === 'fr' ? 'Aide déplacements ?' : 'Movement rules?'}
            </button>
          </div>
        </div>

        {/* Bannière Anti-Frustration si pion sur barre ou porte fermée */}
        {currentNotice && (
          <div
            data-testid="anti-frustration-alert"
            className="w-full px-3 py-1.5 rounded-lg border border-amber-400/50 bg-amber-950/80 text-amber-200 text-xs flex items-center justify-between animate-in fade-in"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {currentNotice === 'BAR_PRIORITY'
                  ? lang === 'fr'
                    ? 'Priorité absolue : tu as un pion sur la Barre centrale ! Tu dois d’abord le faire rentrer dans la maison adverse avant de déplacer tes autres dames.'
                    : 'Absolute priority: you have a checker on the central Bar! You must enter it into the opponent’s home board first before moving any other checkers.'
                  : lang === 'fr'
                    ? 'Bouclier adverse : l’adversaire a 2 dames ou plus sur cette flèche, c’est une Porte fermée imprenable !'
                    : 'Opponent shield: opponent has 2 or more checkers on this point, it is a closed, impassable gate!'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveNotice(null)}
              className="text-stone-400 hover:text-white text-xs px-1 font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <BeginnerInteractiveGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </>
  );
}
