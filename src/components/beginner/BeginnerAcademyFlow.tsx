'use client';

import React, { useState, useEffect } from 'react';
import { Award, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { BeginnerVideoSeriesPlayer } from './BeginnerVideoSeriesPlayer';
import { BEGINNER_10_INITIATION_QUIZZES, BeginnerInitiationQuiz } from '../../data/beginner10InitiationQuizzes';
import { useTranslation } from '../../i18n';
import { QuickAccountModal } from '../auth/QuickAccountModal';

interface BeginnerAcademyFlowProps {
  onBackToLobby?: () => void;
  onPlayDirect?: () => void;
  onRequestSaveAccount?: () => void;
}

export function BeginnerAcademyFlow({
  onBackToLobby,
  onPlayDirect,
  onRequestSaveAccount,
}: BeginnerAcademyFlowProps) {
  const { locale } = useTranslation();
  const lang = locale === 'en' ? 'en' : 'fr';
  const [viewState, setViewState] = useState<'VIDEO' | 'QUIZ' | 'DIPLOMA'>('VIDEO');
  const [activeQuizIndex, setActiveQuizIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [scorePoints, setScorePoints] = useState<number>(0);
  const [completedQuizIds, setCompletedQuizIds] = useState<number[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);

  // Chargement / Sauvegarde locale
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bgtour_beginner_academy_progress');
      if (saved) {
        const parsed = JSON.parse(saved) as { scorePoints?: number; completedQuizIds?: number[] };
        if (typeof parsed.scorePoints === 'number') setScorePoints(parsed.scorePoints);
        if (Array.isArray(parsed.completedQuizIds)) setCompletedQuizIds(parsed.completedQuizIds);
      }
    } catch {}
  }, []);

  const saveProgress = (points: number, quizIds: number[]) => {
    try {
      localStorage.setItem(
        'bgtour_beginner_academy_progress',
        JSON.stringify({ scorePoints: points, completedQuizIds: quizIds })
      );
    } catch {}
  };

  const currentQuiz: BeginnerInitiationQuiz = BEGINNER_10_INITIATION_QUIZZES[activeQuizIndex] || BEGINNER_10_INITIATION_QUIZZES[0];

  const handleLaunchQuizzesForEpisode = (episodeId: number) => {
    const firstQuizForEp = BEGINNER_10_INITIATION_QUIZZES.findIndex(q => q.linkedEpisodeId === episodeId);
    if (firstQuizForEp >= 0) {
      setActiveQuizIndex(firstQuizForEp);
      setSelectedOptionId(null);
      setViewState('QUIZ');
    }
  };

  const handleSelectOption = (optionId: string) => {
    if (selectedOptionId) return; // Verrouillage après réponse
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
      // Déblocage du diplôme avec bonus +2 000 PTS
      const finalPoints = scorePoints + 2000;
      setScorePoints(finalPoints);
      saveProgress(finalPoints, completedQuizIds);
      setViewState('DIPLOMA');
    }
  };

  const handleBackToLobby = () => {
    if (onBackToLobby) {
      onBackToLobby();
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.assign('/');
    }
  };

  const handlePlayDirect = () => {
    if (onPlayDirect) {
      onPlayDirect();
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.assign('/');
    }
  };

  return (
    <div className="w-full min-h-screen py-6 px-3 sm:px-6 flex flex-col items-center justify-start bg-gradient-to-b from-[#06080B] to-[#0D141C] text-white overflow-y-auto">
      {/* En-tête Académie */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <button
          type="button"
          onClick={handleBackToLobby}
          className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          ← {lang === 'fr' ? 'Retour Accueil' : 'Back to Home'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{scorePoints.toLocaleString()} PTS</span>
          </div>

          <div className="text-xs text-neutral-400">
            {completedQuizIds.length} / 10 {lang === 'fr' ? 'Quiz réussis' : 'Quizzes passed'}
          </div>
        </div>
      </div>

      {/* Vue 1 : Vidéos */}
      {viewState === 'VIDEO' && (
        <div className="w-full flex flex-col items-center">
          <BeginnerVideoSeriesPlayer
            onEpisodeCompleted={() => {
              /* auto-progress */
            }}
            onLaunchQuizzes={handleLaunchQuizzesForEpisode}
          />
        </div>
      )}

      {/* Vue 2 : Quiz d'initiation */}
      {viewState === 'QUIZ' && (
        <div className="w-full max-w-2xl bg-[#0B1015] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {lang === 'fr' ? currentQuiz.titleFr : currentQuiz.titleEn}
            </span>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              +{currentQuiz.pointsReward} PTS
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white">
            {lang === 'fr' ? currentQuiz.questionFr : currentQuiz.questionEn}
          </h3>

          {/* Grille des choix */}
          <div className="flex flex-col gap-2.5 my-2">
            {currentQuiz.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              let btnStyle = 'bg-white/5 border-white/10 text-neutral-200 hover:bg-white/10';
              if (selectedOptionId) {
                if (opt.isCorrect) {
                  btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full text-left p-3.5 rounded-xl border font-medium text-xs sm:text-sm transition-all flex items-start gap-3 ${btnStyle}`}
                >
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {opt.id}
                  </span>
                  <div className="flex flex-col">
                    <span>{lang === 'fr' ? opt.labelFr : opt.labelEn}</span>
                    {selectedOptionId && (
                      <span className="text-[11px] mt-1 text-neutral-300 opacity-90">
                        {lang === 'fr' ? opt.explanationFr : opt.explanationEn}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Boutons d'action après réponse */}
          {selectedOptionId && (
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setViewState('VIDEO')}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                {lang === 'fr' ? 'Revoir la vidéo' : 'Rewatch video'}
              </button>

              <button
                type="button"
                onClick={handleNextQuiz}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-lg shadow-amber-400/20 transition-all"
              >
                <span>{lang === 'fr' ? 'Quiz suivant' : 'Next quiz'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Vue 3 : Diplôme d'Initié au Cercle */}
      {viewState === 'DIPLOMA' && (
        <div className="w-full max-w-lg bg-gradient-to-b from-[#141A22] to-[#0A0D12] border-2 border-amber-400/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20">
            <Award className="w-8 h-8 text-amber-400" />
          </div>

          <div>
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">
              {lang === 'fr' ? 'Félicitations' : 'Congratulations'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              {lang === 'fr' ? "Diplôme d'Initié au Cercle Backgammon" : 'Backgammon Circle Initiate Diploma'}
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              {lang === 'fr'
                ? 'Vous maîtrisez le but du jeu, la sécurité, la barre, le bear-off et le videau. Vous êtes fin prêt à jouer !'
                : 'You have mastered the game rules, points, bar safety, bear-off, and the doubling cube. You are ready!'}
            </p>
          </div>

          <div className="px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 font-bold text-sm">
            +{2000} PTS {lang === 'fr' ? 'Bonus Débloqués !' : 'Bonus Awarded!'}
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-2 mt-2">
            <button
              type="button"
              onClick={handlePlayDirect}
              className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 transition-all"
            >
              {lang === 'fr' ? 'Jouer ma 1ère partie' : 'Play first game'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (onRequestSaveAccount) {
                  onRequestSaveAccount();
                } else {
                  setIsAccountModalOpen(true);
                }
              }}
              className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition-all"
            >
              {lang === 'fr' ? 'Créer mon compte (Sauvegarder)' : 'Save account'}
            </button>
          </div>
        </div>
      )}

      <QuickAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </div>
  );
}
