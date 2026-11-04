'use client';

import React, { useState } from 'react';
import { RotateCcw, Lightbulb, GraduationCap, Sparkles, Volume2, BookOpen } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { LastMoveFeedback } from '../../hooks/useCoachHelpers';
import { BeginnerInteractiveGuideModal } from './BeginnerInteractiveGuideModal';

export interface LiveProfessorCoachOverlayProps {
  dice?: [number, number] | null;
  canUndo?: boolean;
  onUndoMove?: () => void;
  onAskProfessorHint?: () => void;
  lastMoveFeedback?: LastMoveFeedback | null;
}

export function LiveProfessorCoachOverlay({
  dice,
  canUndo,
  onUndoMove,
  onAskProfessorHint,
  lastMoveFeedback,
}: LiveProfessorCoachOverlayProps) {
  const { locale } = useTranslation();
  const lang = locale === 'en' ? 'en' : 'fr';
  const [hintRequested, setHintRequested] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const isBlunderFeedback = Boolean(lastMoveFeedback && Math.abs(lastMoveFeedback.equityLoss) >= 0.045);

  const getProfessorPrompt = (): string => {
    if (isBlunderFeedback) {
      return lang === 'fr'
        ? "Attention : ce coup est un 'Blunder' (une gaffe qui gâche vos chances de victoire). Cliquez sur « Réessayer le coup » pour trouver le meilleur coup statistique !"
        : "Careful: this move is a 'Blunder' (a mistake that hurts your winning chances). Click 'Retry Move' to find the best statistical play!";
    }
    if (hintRequested) {
      return lang === 'fr'
        ? 'Astuce du Professeur : Cherchez à faire une porte (idéalement sur la flèche 5) pour maîtriser les 36 combinaisons de dés et protéger vos pions !'
        : 'Professor Tip: Aim to build a gate (ideally on the 5-point) to command the 36 dice combinations and protect your checkers!';
    }
    if (dice) {
      return lang === 'fr'
        ? `🎲 Vous avez lancé ${dice[0]}-${dice[1]} : selon vous, où devez-vous déplacer vos pions pour mettre les statistiques de votre côté ?`
        : `🎲 You rolled ${dice[0]}-${dice[1]}: where do you think you should move your checkers to put the odds on your side?`;
    }
    return lang === 'fr'
      ? "Le Professeur vous accompagne : le hasard lance les dés, mais c'est votre stratégie qui fait la différence. Demandez un conseil à tout moment !"
      : "The Professor guides you: dice bring the luck, but your strategy makes the difference. Ask for advice anytime!";
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

  return (
    <>
      <div
        data-testid="live-professor-coach-overlay"
        className={`w-full max-w-5xl mx-auto px-3.5 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-xl border backdrop-blur-md text-xs mb-1.5 shrink-0 transition-colors ${
          isBlunderFeedback
            ? 'bg-amber-950/60 border-amber-400/50 text-amber-100'
            : 'bg-[#0c141d]/90 border-[#D4AF37]/35 text-stone-100'
        }`}
      >
        {/* Question bienveillante du Professeur */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#f3d27a]">
            <GraduationCap className="w-4 h-4" />
          </span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black uppercase tracking-wider text-[10px] text-[#D4AF37]">
                {lang === 'fr' ? 'Professeur Interactif' : 'Interactive Professor'}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">
                • {lang === 'fr' ? ' Vert = Porte sûre · Or = Coup idéal' : ' Green = Safe Gate · Gold = Best Move'}
              </span>
            </div>
            <p data-testid="professor-dialogue-text" className="text-xs font-medium text-white leading-snug line-clamp-2">
              {getProfessorPrompt()}
            </p>
          </div>
        </div>

        {/* Boutons d'interaction sans brusquer */}
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

          {onUndoMove && (
            <button
              type="button"
              data-testid="professor-retry-btn"
              onClick={() => {
                setHintRequested(false);
                onUndoMove();
              }}
              disabled={!canUndo}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'fr' ? 'Réessayer mon coup' : 'Retry move'}</span>
            </button>
          )}
        </div>
      </div>

      <BeginnerInteractiveGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </>
  );
}

