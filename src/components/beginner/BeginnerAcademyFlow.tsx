'use client';

import React, { useState, useEffect } from 'react';
import { Award, ArrowRight, Sparkles, BookOpen, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { BeginnerVideoSeriesPlayer } from './BeginnerVideoSeriesPlayer';
import { AcademyVisualBoardLesson } from './AcademyVisualBoardLesson';
import { BEGINNER_10_INITIATION_QUIZZES, BeginnerInitiationQuiz } from '../../data/beginner10InitiationQuizzes';
import { useTranslation } from '../../i18n';
import { QuickAccountModal } from '../auth/QuickAccountModal';
interface BeginnerAcademyFlowProps {
  onBackToLobby?: () => void;
  onPlayDirect?: () => void;
  onRequestSaveAccount?: () => void;
}

export function BeginnerAcademyFlow({
  onBackToLobby, onPlayDirect, onRequestSaveAccount,
}: BeginnerAcademyFlowProps) {
  const { locale } = useTranslation();
  const lang = locale === 'en' ? 'en' : 'fr';
  const [viewState, setViewState] = useState<'VIDEO' | 'QUIZ' | 'DIPLOMA'>('VIDEO');
  const [activeQuizIndex, setActiveQuizIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [scorePoints, setScorePoints] = useState<number>(0);
  const [completedQuizIds, setCompletedQuizIds] = useState<number[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('step') === 'quiz' || params.get('tab') === 'quiz' || params.get('mode') === 'beginner-academy') {
          setViewState('QUIZ');
        }
        document.title = lang === 'fr'
          ? "Académie d'Initiation — Backgammon Tour"
          : 'Beginner Academy — Backgammon Tour';
      }
      const saved = localStorage.getItem('bgtour_beginner_academy_progress');
      if (saved) {
        const parsed = JSON.parse(saved) as { scorePoints?: number; completedQuizIds?: number[] };
        if (typeof parsed.scorePoints === 'number') setScorePoints(parsed.scorePoints);
        if (Array.isArray(parsed.completedQuizIds)) setCompletedQuizIds(parsed.completedQuizIds);
      }
    } catch {}
  }, [lang]);

  const saveProgress = (points: number, quizIds: number[]) => {
    try { localStorage.setItem('bgtour_beginner_academy_progress', JSON.stringify({ scorePoints: points, completedQuizIds: quizIds })); } catch {}
  };

  const currentQuiz: BeginnerInitiationQuiz = BEGINNER_10_INITIATION_QUIZZES[activeQuizIndex] || BEGINNER_10_INITIATION_QUIZZES[0];
  const selectedOpt = currentQuiz.options.find(o => o.id === selectedOptionId);
  const isSelectedCorrect = Boolean(selectedOpt?.isCorrect);

  const handleLaunchQuizzesForEpisode = (episodeId: number) => {
    const firstQuizForEp = BEGINNER_10_INITIATION_QUIZZES.findIndex(q => q.linkedEpisodeId === episodeId);
    if (firstQuizForEp >= 0) {
      setActiveQuizIndex(firstQuizForEp);
      setSelectedOptionId(null);
      setViewState('QUIZ');
    }
  };

  const handleSelectOption = (optionId: string) => {
    if (selectedOptionId) return;
    setSelectedOptionId(optionId);
    const opt = currentQuiz.options.find(o => o.id === optionId);
    if (opt?.isCorrect && !completedQuizIds.includes(currentQuiz.id)) {
      const nextPoints = scorePoints + currentQuiz.pointsReward;
      const nextQuizIds = [...completedQuizIds, currentQuiz.id];
      setScorePoints(nextPoints);
      setCompletedQuizIds(nextQuizIds);
      saveProgress(nextPoints, nextQuizIds);
    }
  };

  const handleNextQuiz = () => {
    setSelectedOptionId(null);
    if (activeQuizIndex < BEGINNER_10_INITIATION_QUIZZES.length - 1) {
      setActiveQuizIndex(prev => prev + 1);
    } else {
      const finalPoints = scorePoints + 2000;
      setScorePoints(finalPoints);
      saveProgress(finalPoints, completedQuizIds);
      setViewState('DIPLOMA');
    }
  };

  const handleBackToLobby = () => (onBackToLobby ? onBackToLobby() : typeof window !== 'undefined' ? window.location.assign('/') : undefined);
  const handlePlayDirect = () => (onPlayDirect ? onPlayDirect() : typeof window !== 'undefined' ? window.location.assign('/play?gate=beginner&start=guided') : undefined);

  return (
    <div className="w-full min-h-screen py-6 px-3 sm:px-6 flex flex-col items-center justify-start bg-gradient-to-b from-[#06080B] to-[#0D141C] text-white overflow-y-auto">
      {/* En-tête Académie */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 pb-3 border-b border-white/10 gap-2 flex-wrap">
        <button type="button" onClick={handleBackToLobby} data-testid="academy-back-btn" className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors">
          ← {lang === 'fr' ? 'Retour Accueil' : 'Back to Home'}
        </button>

        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10">
          <button
            type="button"
            data-testid="academy-tab-videos"
            onClick={() => setViewState('VIDEO')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${viewState === 'VIDEO' ? 'bg-white/[0.12] text-white border border-[#D4AF37]/50 shadow-sm' : 'text-neutral-400 hover:text-white'}`}
          >
            {lang === 'fr' ? '5 Vidéos' : '5 Videos'}
          </button>
          <button
            type="button"
            data-testid="academy-tab-quizzes"
            onClick={() => { setViewState('QUIZ'); setSelectedOptionId(null); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${viewState === 'QUIZ' || viewState === 'DIPLOMA' ? 'bg-white/[0.12] text-white border border-[#D4AF37]/50 shadow-sm' : 'text-neutral-400 hover:text-white'}`}
          >
            {lang === 'fr' ? '10 Leçons / Quiz' : '10 Lessons / Quizzes'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div data-testid="academy-score-badge" className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.03] border border-white/10 text-zinc-300 text-xs font-mono font-semibold">
            <span>{completedQuizIds.length} / 10 {lang === 'fr' ? 'validés' : 'passed'} • +{scorePoints.toLocaleString()} PTS</span>
          </div>
        </div>
      </div>

      {/* Vue 1 : Vidéos */}
      {viewState === 'VIDEO' && (
        <div className="w-full flex flex-col items-center">
          <BeginnerVideoSeriesPlayer onEpisodeCompleted={() => {}} onLaunchQuizzes={handleLaunchQuizzesForEpisode} />
        </div>
      )}

      {/* Vue 2 : Quiz d'initiation */}
      {viewState === 'QUIZ' && (
        <div data-testid="academy-quiz-container" className="w-full max-w-2xl bg-[#0B1015] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{lang === 'fr' ? currentQuiz.titleFr : currentQuiz.titleEn}</span>
            {selectedOptionId && <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">+{currentQuiz.pointsReward} PTS</span>}
          </div>

          <AcademyVisualBoardLesson quizId={currentQuiz.id} isEn={lang === 'en'} />

          <h3 className="text-base sm:text-lg font-bold text-white">{lang === 'fr' ? currentQuiz.questionFr : currentQuiz.questionEn}</h3>

          <div className="flex flex-col gap-2.5 my-2">
            {currentQuiz.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              const btnStyle = !selectedOptionId
                ? 'bg-white/[0.03] border-white/[0.08] text-zinc-200 hover:border-white/20 hover:bg-white/[0.06]'
                : opt.isCorrect
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                : isSelected
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 opacity-60';

              return (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`academy-option-${opt.id}`}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full text-left p-3.5 rounded-xl border font-medium text-sm transition-all flex items-start gap-3 ${btnStyle}`}
                >
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">{opt.id}</span>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{lang === 'fr' ? opt.labelFr : opt.labelEn}</span>
                      {selectedOptionId && opt.isCorrect && <span className="text-[#D4AF37] font-bold text-xs">➔ Flèche Dorée (94% gain)</span>}
                    </div>
                    {selectedOptionId && <span className="text-xs mt-1 text-neutral-200">{lang === 'fr' ? opt.explanationFr : opt.explanationEn}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedOptionId && (
            <div className={`rounded-xl p-3 text-xs sm:text-sm flex items-center gap-2 border ${
              isSelectedCorrect ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}>
              {isSelectedCorrect ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
              <span>{isSelectedCorrect
                ? (lang === 'fr' ? 'Coup optimal ! Vos pions sont en parfaite sécurité.' : 'Optimal play! Checkers safe.')
                : (lang === 'fr' ? 'Conseil du Professeur : Coup imprudent. Cliquez sur « Réessayer » sans stress !' : 'Tip: Risky move. Click "Retry"!')}</span>
            </div>
          )}

          {selectedOptionId && (
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button type="button" onClick={() => setViewState('VIDEO')} className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {lang === 'fr' ? 'Revoir la vidéo' : 'Rewatch video'}
              </button>
              <div className="flex items-center gap-2">
                {!isSelectedCorrect && (
                  <button
                    type="button"
                    data-testid="academy-quiz-retry-btn"
                    onClick={() => setSelectedOptionId(null)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{lang === 'fr' ? 'Réessayer' : 'Retry'}</span>
                  </button>
                )}
                <button
                  type="button"
                  data-testid="academy-quiz-next-btn"
                  onClick={handleNextQuiz}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-lg shadow-amber-400/20 transition-all active:scale-95"
                >
                  <span>{lang === 'fr' ? 'Quiz suivant' : 'Next quiz'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vue 3 : Diplôme d'Initié au Cercle */}
      {viewState === 'DIPLOMA' && (
        <div data-testid="academy-diploma-card" className="w-full max-w-xl bg-gradient-to-b from-[#141A22] to-[#0A0D12] border-2 border-amber-400/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20">
            <Award className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <span className="text-amber-400 text-sm font-bold uppercase tracking-widest">{lang === 'fr' ? 'Félicitations' : 'Congratulations'}</span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">{lang === 'fr' ? "Diplôme d'Initié au Cercle Backgammon" : 'Backgammon Circle Initiate Diploma'}</h2>
            <p className="text-sm text-neutral-300 mt-1 max-w-md">
              {lang === 'fr'
                ? 'Vous maîtrisez le but du jeu, la sécurité, la barre, le bear-off et le videau. Vous êtes fin prêt à jouer !'
                : 'You have mastered the game rules, points, bar safety, bear-off, and the doubling cube. You are ready!'}
            </p>
          </div>
          <div className="px-5 py-2 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 font-bold text-base">
            +{2000} PTS {lang === 'fr' ? 'Bonus Débloqués !' : 'Bonus Awarded!'}
          </div>
          <button
            type="button"
            data-testid="diploma-launch-guided-match-btn"
            onClick={handlePlayDirect}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#f5d98b] to-[#b88924] text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-105 active:scale-95 transition"
          >
            {lang === 'fr' ? 'Mettre en pratique contre le Bot Doux (Partie Guidée) →' : 'Practice Against Gentle Bot (Guided Match) →'}
          </button>
          <div className="w-full flex flex-col sm:flex-row gap-2 mt-1">
            <button
              type="button"
              onClick={() => onRequestSaveAccount ? onRequestSaveAccount() : setIsAccountModalOpen(true)}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/10 transition"
            >
              {lang === 'fr' ? 'Créer mon compte (Sauvegarder)' : 'Save account'}
            </button>
            <button
              type="button"
              onClick={handleBackToLobby}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 font-semibold text-xs sm:text-sm border border-white/10 transition"
            >
              {lang === 'fr' ? 'Retour Accueil' : 'Back to Home'}
            </button>
          </div>
        </div>
      )}

      <QuickAccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} />
    </div>
  );
}
