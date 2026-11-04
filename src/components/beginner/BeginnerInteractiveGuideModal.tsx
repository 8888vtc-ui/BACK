'use client';

import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, ArrowLeft, ArrowRight, Sparkles, BookOpen, Play } from 'lucide-react';
import { BEGINNER_MASTER_GUIDE_CHAPTERS } from '../../data/beginnerMasterGuideBilingual';
import { useTranslation } from '../../i18n';

export interface BeginnerInteractiveGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGuidedMatch?: () => void;
  onOpenQuizzes?: () => void;
}

const VICTORY_TYPES = {
  SIMPLE: {
    labelFr: 'Simple (1 pt)',
    labelEn: 'Single (1 pt)',
    descFr: 'L’adversaire a déjà sorti au moins 1 dame de son plateau.',
    descEn: 'The opponent has already borne off at least 1 checker.',
  },
  GAMMON: {
    labelFr: 'Gammon (×2)',
    labelEn: 'Gammon (×2)',
    descFr: 'Tu as sorti tes 15 dames alors que l’adversaire n’en a sorti aucune !',
    descEn: 'You bore off all 15 checkers while opponent bore off none!',
  },
  BACKGAMMON: {
    labelFr: 'Backgammon (×3)',
    labelEn: 'Backgammon (×3)',
    descFr: 'L’adversaire n’a sorti aucune dame ET il lui reste encore un pion sur la barre ou dans ta maison !',
    descEn: 'Opponent bore off none AND still has a checker on the bar or in your home!',
  },
} as const;

export function BeginnerInteractiveGuideModal({
  isOpen,
  onClose,
  onStartGuidedMatch,
  onOpenQuizzes,
}: BeginnerInteractiveGuideModalProps) {
  const { locale } = useTranslation();
  const lang = locale === 'en' ? 'en' : 'fr';
  const [chapterIndex, setChapterIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [victoryType, setVictoryType] = useState<'SIMPLE' | 'GAMMON' | 'BACKGAMMON'>('SIMPLE');

  const chapter = BEGINNER_MASTER_GUIDE_CHAPTERS[chapterIndex] || BEGINNER_MASTER_GUIDE_CHAPTERS[0];

  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen, chapterIndex]);

  if (!isOpen) return null;

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const title = lang === 'fr' ? chapter.titleFr : chapter.titleEn;
    const paragraphs = lang === 'fr' ? chapter.paragraphsFr : chapter.paragraphsEn;
    const takeaway = lang === 'fr' ? chapter.keyTakeawayFr : chapter.keyTakeawayEn;
    const fullText = `${title}. ${paragraphs.join(' ')} ${takeaway}`;

    const utt = new SpeechSynthesisUtterance(fullText);
    utt.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    utt.rate = 1.0;
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utt);
  };

  const handlePrev = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setChapterIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setChapterIndex((prev) => Math.min(BEGINNER_MASTER_GUIDE_CHAPTERS.length - 1, prev + 1));
  };

  return (
    <div
      data-testid="beginner-interactive-guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl max-h-[90dvh] flex flex-col justify-between rounded-2xl border border-[#D4AF37]/40 bg-[#0B1015] p-5 sm:p-7 text-white shadow-2xl overflow-hidden">
        {/* En-tête Modal */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3 py-0.5 text-[11px] font-bold text-[#F3E5AB]">
              <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{lang === 'fr' ? chapter.badgeFr : chapter.badgeEn}</span>
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              {chapterIndex + 1} / {BEGINNER_MASTER_GUIDE_CHAPTERS.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="guide-voice-btn"
              onClick={handleToggleSpeech}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                isSpeaking
                  ? 'bg-amber-400 text-black'
                  : 'border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>
                {isSpeaking
                  ? lang === 'fr'
                    ? 'Arrêter la voix'
                    : 'Stop voice'
                  : lang === 'fr'
                  ? 'Écouter le chapitre'
                  : 'Listen chapter'}
              </span>
            </button>

            <button
              type="button"
              data-testid="guide-close-btn"
              onClick={onClose}
              className="rounded-lg bg-white/5 p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Onglets rapides des 6 chapitres */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-b border-white/5 shrink-0">
          {BEGINNER_MASTER_GUIDE_CHAPTERS.map((ch, idx) => (
            <button
              key={ch.id}
              type="button"
              data-testid={`guide-tab-${idx + 1}`}
              onClick={() => setChapterIndex(idx)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                idx === chapterIndex
                  ? 'bg-[#D4AF37] text-black font-bold shadow'
                  : 'bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              #{idx + 1} {lang === 'fr' ? ch.badgeFr : ch.badgeEn}
            </button>
          ))}
        </div>

        {/* Contenu principal du chapitre */}
        <div className="my-4 overflow-y-auto pr-1 space-y-3.5 flex-1">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#fdf8eb]">
              {lang === 'fr' ? chapter.titleFr : chapter.titleEn}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-amber-300/90 mt-1">
              {lang === 'fr' ? chapter.summaryFr : chapter.summaryEn}
            </p>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm text-neutral-200 leading-relaxed">
            {(lang === 'fr' ? chapter.paragraphsFr : chapter.paragraphsEn).map((para, i) => (
              <p key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                {para}
              </p>
            ))}
          </div>

          {/* Repère visuel plateau */}
          {(chapter.highlightPoints || chapter.highlightCube) && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {chapter.highlightCube
                  ? lang === 'fr'
                    ? 'Zone clé sur le plateau : Le Videau (Cube 2, 4, 8, 16, 32, 64)'
                    : 'Key board zone: The Doubling Cube (2, 4, 8, 16, 32, 64)'
                  : lang === 'fr'
                  ? `Flèches stratégiques illuminées : Cases ${chapter.highlightPoints?.join(', ')}`
                  : `Strategic points highlighted: Points ${chapter.highlightPoints?.join(', ')}`}
              </span>
            </div>
          )}

          {/* Sélecteur Interactif de Victoires Simple / Gammon / Backgammon */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="text-[11px] font-bold text-stone-300 mb-1.5">
              {lang === 'fr' ? '🏆 Les 3 Niveaux de Victoire :' : '🏆 The 3 Victory Levels:'}
            </div>
            <div data-testid="guide-victory-types-selector" className="grid grid-cols-3 gap-1.5 mb-2">
              {(['SIMPLE', 'GAMMON', 'BACKGAMMON'] as const).map((vtKey) => {
                const vt = VICTORY_TYPES[vtKey];
                const isSel = victoryType === vtKey;
                return (
                  <button
                    key={vtKey}
                    type="button"
                    data-testid={`victory-type-${vtKey.toLowerCase()}`}
                    onClick={() => setVictoryType(vtKey)}
                    className={`py-1 px-1.5 rounded-lg border text-center text-xs font-bold transition ${
                      isSel
                        ? 'bg-[#D4AF37] border-[#F3E5AB] text-slate-950 font-black shadow'
                        : 'bg-white/[0.04] border-white/10 text-stone-300 hover:bg-white/10'
                    }`}
                  >
                    {lang === 'fr' ? vt.labelFr : vt.labelEn}
                  </button>
                );
              })}
            </div>
            <p data-testid="victory-type-description" className="text-xs text-amber-200/90 font-medium bg-black/40 p-2 rounded-lg border border-white/5">
              {lang === 'fr' ? VICTORY_TYPES[victoryType].descFr : VICTORY_TYPES[victoryType].descEn}
            </p>
          </div>

          {/* Explication ERA Adaptatif */}
          <div data-testid="guide-era-explanation" className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-2.5 text-xs text-sky-200">
            <div className="font-bold text-sky-300 mb-0.5">
              ⚡ {lang === 'fr' ? 'Error Rate Adaptatif (ERA) :' : 'Adaptive Error Rate (ERA):'}
            </div>
            <p>
              {lang === 'fr'
                ? "Contrairement à l'ER théorique qui suppose un robot parfait, l'ERA adapte les décisions de videau et le plan de jeu au niveau réel adverse pour étouffer le hasard."
                : "Unlike theoretical ER assuming a perfect bot, ERA adapts cube decisions and game plan to the opponent's true level to overcome variance."}
            </p>
          </div>

          {/* Règle d'Or à retenir */}
          <div className="rounded-xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#18130a] to-[#0d0b07] p-3 text-xs sm:text-sm font-bold text-[#F3E5AB]">
            💡 {lang === 'fr' ? chapter.keyTakeawayFr : chapter.keyTakeawayEn}
          </div>
        </div>

        {/* Barre inférieure de navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={chapterIndex === 0}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'fr' ? 'Précédent' : 'Previous'}</span>
            </button>

            <button
              type="button"
              data-testid="guide-next-btn"
              onClick={handleNext}
              disabled={chapterIndex === BEGINNER_MASTER_GUIDE_CHAPTERS.length - 1}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40 transition"
            >
              <span>{lang === 'fr' ? 'Chapitre suivant' : 'Next chapter'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenQuizzes && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenQuizzes();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                <span>{lang === 'fr' ? 'Vidéos & 10 Quiz' : 'Videos & 10 Quizzes'}</span>
              </button>
            )}

            {onStartGuidedMatch && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartGuidedMatch();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#f5d98b] to-[#b88924] px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg hover:brightness-105 transition"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>{lang === 'fr' ? 'Jouer avec le Professeur' : 'Play with Professor'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

