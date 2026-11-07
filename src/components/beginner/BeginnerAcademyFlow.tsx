'use client';

import React, { useState, useEffect } from 'react';
import { Award, ArrowRight, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { BeginnerVideoSeriesPlayer } from './BeginnerVideoSeriesPlayer';
import { AcademyVisualBoardLesson } from './AcademyVisualBoardLesson';
import { BEGINNER_10_INITIATION_QUIZZES, BeginnerInitiationQuiz } from '../../data/beginner10InitiationQuizzes';
import { useTranslation } from '../../i18n';

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

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const p = new URLSearchParams(window.location.search);
        if (p.get('tab') === 'quiz' || p.get('step') === 'quiz' || p.get('mode') === 'beginner-academy') setViewState('QUIZ');
      }
      let loaded: number[] = [];
      const v1 = localStorage.getItem('bgtour_beginner_completed_quizzes_v1');
      if (v1) { try { const parsed = JSON.parse(v1); if (Array.isArray(parsed)) loaded = parsed.map(Number).filter(n => !isNaN(n)); } catch {} }
      const saved = localStorage.getItem('bgtour_beginner_academy_progress');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { scorePoints?: number; completedQuizIds?: number[] };
          if (typeof parsed.scorePoints === 'number') setScorePoints(parsed.scorePoints);
          if (loaded.length === 0 && Array.isArray(parsed.completedQuizIds)) loaded = parsed.completedQuizIds.map(Number).filter(n => !isNaN(n));
        } catch {}
      }
      if (loaded.length > 0) setCompletedQuizIds(loaded);
      if (loaded.length >= BEGINNER_10_INITIATION_QUIZZES.length) { setViewState('DIPLOMA'); return; }

      const firstUncompleted = BEGINNER_10_INITIATION_QUIZZES.findIndex(q => !loaded.includes(q.id));
      if (firstUncompleted >= 0) {
        setActiveQuizIndex(firstUncompleted);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = lang === 'fr'
        ? "Académie d'Initiation — Backgammon Tour"
        : 'Beginner Academy — Backgammon Tour';
    }
  }, [lang, viewState, activeQuizIndex]);

  const saveProgress = (points: number, quizIds: number[]) => {
    try {
      localStorage.setItem('bgtour_beginner_completed_quizzes_v1', JSON.stringify(quizIds));
      localStorage.setItem('bgtour_beginner_academy_progress', JSON.stringify({ scorePoints: points, completedQuizIds: quizIds }));
    } catch {}
  };

  const currentQuiz: BeginnerInitiationQuiz = BEGINNER_10_INITIATION_QUIZZES[activeQuizIndex] || BEGINNER_10_INITIATION_QUIZZES[0];
  const selectedOpt = currentQuiz.options.find(o => o.id === selectedOptionId);
  const isSelectedCorrect = Boolean(selectedOpt?.isCorrect);

  const handleSelectQuizIndex = (idx: number) => {
    setActiveQuizIndex(idx); setSelectedOptionId(null);
    try { localStorage.setItem('bgtour_beginner_academy_quiz_idx', String(idx)); } catch {}
  };

  const handleLaunchQuizzesForEpisode = (episodeId: number) => {
    const firstQuizForEp = BEGINNER_10_INITIATION_QUIZZES.findIndex(q => q.linkedEpisodeId === episodeId);
    if (firstQuizForEp >= 0) { handleSelectQuizIndex(firstQuizForEp); setViewState('QUIZ'); }
  };

  const handleSelectOption = (optionId: string) => {
    if (selectedOptionId) return;
    setSelectedOptionId(optionId);
    const opt = currentQuiz.options.find(o => o.id === optionId);
    if (opt?.isCorrect && !completedQuizIds.includes(currentQuiz.id)) {
      const nextPoints = scorePoints + currentQuiz.pointsReward;
      const nextQuizIds = [...completedQuizIds, currentQuiz.id];
      setScorePoints(nextPoints); setCompletedQuizIds(nextQuizIds); saveProgress(nextPoints, nextQuizIds);
    }
  };

  const awardDiplomaBonusOnce = (currentPts: number, quizIds: number[]) => {
    try {
      const alreadyCredited = localStorage.getItem('bgtour_beginner_diploma_bonus_credited') === 'true';
      if (!alreadyCredited) {
        localStorage.setItem('bgtour_beginner_diploma_bonus_credited', 'true');
        const finalPoints = currentPts + 2000;
        setScorePoints(finalPoints);
        saveProgress(finalPoints, quizIds);
        return;
      }
    } catch {}
    saveProgress(currentPts, quizIds);
  };

  const handleNextQuiz = () => {
    setSelectedOptionId(null);
    if (completedQuizIds.length >= BEGINNER_10_INITIATION_QUIZZES.length) {
      awardDiplomaBonusOnce(scorePoints, completedQuizIds);
      setViewState('DIPLOMA');
      return;
    }
    const nextUncompletedAfter = BEGINNER_10_INITIATION_QUIZZES.findIndex(
      (q, idx) => idx > activeQuizIndex && !completedQuizIds.includes(q.id)
    );
    if (nextUncompletedAfter >= 0) {
      handleSelectQuizIndex(nextUncompletedAfter);
      return;
    }
    const anyUncompleted = BEGINNER_10_INITIATION_QUIZZES.findIndex(q => !completedQuizIds.includes(q.id));
    if (anyUncompleted >= 0) {
      handleSelectQuizIndex(anyUncompleted);
      return;
    }
    awardDiplomaBonusOnce(scorePoints, completedQuizIds);
    setViewState('DIPLOMA');
  };

  const handleBackToLobby = () => (onBackToLobby ? onBackToLobby() : typeof window !== 'undefined' ? window.location.assign('/') : undefined);
  const handlePlayDirect = () => (onPlayDirect ? onPlayDirect() : typeof window !== 'undefined' ? window.location.assign('/play?gate=beginner&start=guided') : undefined);

  return (
    <div className="w-full h-full max-h-full py-1.5 px-3 sm:px-6 flex flex-col items-center justify-between bg-gradient-to-b from-[#06080B] to-[#0D141C] text-white overflow-hidden select-none">
      {/* En-tête Académie ultra-compact */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-1 pb-1 border-b border-white/10 gap-2 shrink-0">
        <button type="button" onClick={handleBackToLobby} data-testid="academy-back-btn" className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors">
          ← {lang === 'fr' ? 'Retour Accueil' : 'Back to Home'}
        </button>

        <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-xl border border-white/10">
          <button type="button" data-testid="academy-tab-videos" onClick={() => setViewState('VIDEO')} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${viewState === 'VIDEO' ? 'bg-white/[0.12] text-white border border-[#D4AF37]/50 shadow-sm' : 'text-neutral-400 hover:text-white'}`}>
            {lang === 'fr' ? '5 Vidéos' : '5 Videos'}
          </button>
          <button type="button" data-testid="academy-tab-quizzes" onClick={() => { setViewState('QUIZ'); setSelectedOptionId(null); }} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${viewState === 'QUIZ' || viewState === 'DIPLOMA' ? 'bg-white/[0.12] text-white border border-[#D4AF37]/50 shadow-sm' : 'text-neutral-400 hover:text-white'}`}>
            {lang === 'fr' ? '10 Leçons / Quiz' : '10 Lessons / Quizzes'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div data-testid="academy-score-badge" className="flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-white/[0.03] border border-white/10 text-zinc-300 text-xs font-mono font-semibold">
            <span>{completedQuizIds.length} / 10 {lang === 'fr' ? 'validés' : 'passed'} • +{scorePoints.toLocaleString()} PTS</span>
          </div>
        </div>
      </div>

      {/* Vue 1 : Vidéos */}
      {viewState === 'VIDEO' && (
        <div className="w-full flex-1 flex flex-col items-center justify-center overflow-y-auto">
          <BeginnerVideoSeriesPlayer onEpisodeCompleted={() => {}} onLaunchQuizzes={handleLaunchQuizzesForEpisode} />
        </div>
      )}

      {/* Vue 2 : Quiz d'initiation — 100% sans scroll */}
      {viewState === 'QUIZ' && (
        <div data-testid="academy-quiz-container" className="w-full max-w-2xl bg-[#0B1015] border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-col justify-between flex-1 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between shrink-0 gap-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider truncate">
              {lang === 'fr' ? currentQuiz.titleFr : currentQuiz.titleEn}
            </span>
            <div className="ml-auto flex items-center gap-1 shrink-0">
              {BEGINNER_10_INITIATION_QUIZZES.map((q, idx) => {
                const isCur = idx === activeQuizIndex;
                const isPass = completedQuizIds.includes(q.id);
                return (
                  <button
                    key={q.id}
                    type="button"
                    data-testid={`academy-quiz-step-btn-${q.id}`}
                    onClick={() => handleSelectQuizIndex(idx)}
                    title={`Quiz ${q.id}/10`}
                    className={`w-6 h-6 rounded-md text-[11px] font-mono font-bold flex items-center justify-center transition-all ${
                      isCur
                        ? 'bg-[#D4AF37] text-black font-extrabold shadow-sm ring-1 ring-amber-300'
                        : isPass
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-white/[0.04] text-zinc-400 border border-white/10 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {q.id}
                  </button>
                );
              })}
              <button
                type="button"
                data-testid="academy-nav-diploma-btn"
                onClick={() => setViewState('DIPLOMA')}
                title={lang === 'fr' ? "Voir le Diplôme d'Initié" : 'View Initiate Diploma'}
                className={`ml-1 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-0.5 transition-all ${
                  completedQuizIds.length >= 10
                    ? 'bg-amber-400 text-black font-extrabold shadow-sm hover:bg-amber-300'
                    : 'bg-amber-400/10 border border-amber-400/30 text-amber-300 hover:bg-amber-400/20'
                }`}
              >
                🎓 {lang === 'fr' ? 'Diplôme' : 'Diploma'}
              </button>
            </div>
          </div>

          <div className="w-full flex items-center justify-center shrink-0">
            <AcademyVisualBoardLesson quizId={currentQuiz.id} isEn={lang === 'en'} />
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-white leading-tight shrink-0 my-0.5">{lang === 'fr' ? currentQuiz.questionFr : currentQuiz.questionEn}</h3>

          <div className="flex flex-col gap-1.5 my-0.5 shrink-0">
            {currentQuiz.options.map((opt) => {
              const isSel = selectedOptionId === opt.id;
              const btnStyle = !selectedOptionId ? 'bg-white/[0.03] border-white/[0.08] text-zinc-200 hover:border-white/20 hover:bg-white/[0.06]' : opt.isCorrect ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10' : isSel ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 opacity-60';

              return (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`academy-option-${opt.id}`}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full text-left p-2 sm:p-2.5 rounded-xl border font-medium text-xs sm:text-sm transition-all flex items-start gap-2 ${btnStyle}`}
                >
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">{opt.id}</span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white leading-tight truncate">{lang === 'fr' ? opt.labelFr : opt.labelEn}</span>
                      {selectedOptionId && opt.isCorrect && <span className="text-[#D4AF37] font-bold text-[11px] shrink-0 ml-2">➔ Flèche Dorée</span>}
                    </div>
                    {(isSel || (selectedOptionId && opt.isCorrect)) && <span className="text-[11px] mt-0.5 text-neutral-200 leading-tight">{lang === 'fr' ? opt.explanationFr : opt.explanationEn}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="h-9 shrink-0 flex items-center">
            {selectedOptionId && (
              <div className={`w-full rounded-xl px-2.5 py-1.5 text-xs flex items-center justify-between gap-2 border ${
                isSelectedCorrect ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}>
                <div className="flex items-center gap-1.5 truncate">
                  {isSelectedCorrect ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  <span className="text-[11px] truncate">{isSelectedCorrect
                    ? (lang === 'fr' ? 'Coup optimal ! Vos pions sont en parfaite sécurité.' : 'Optimal play! Checkers safe.')
                    : (lang === 'fr' ? 'Coup imprudent. Cliquez sur « Réessayer » sans stress !' : 'Tip: Risky move. Click "Retry"!')}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!isSelectedCorrect && (
                    <button type="button" data-testid="academy-quiz-retry-btn" onClick={() => setSelectedOptionId(null)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition-all active:scale-95">
                      <RotateCcw className="w-3 h-3" /><span>{lang === 'fr' ? 'Réessayer' : 'Retry'}</span>
                    </button>
                  )}
                  <button type="button" data-testid="academy-quiz-next-btn" onClick={handleNextQuiz} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#B5902B] text-black font-black text-[11px] uppercase tracking-wider shadow hover:brightness-105 transition-all active:scale-95">
                    <span>{lang === 'fr' ? 'Question suivante →' : 'Next question →'}</span><ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vue 3 : Diplôme d'Initié au Cercle */}
      {viewState === 'DIPLOMA' && (
        <div data-testid="academy-diploma-card" className="w-full max-w-xl bg-gradient-to-b from-[#141A22] to-[#0A0D12] border-2 border-amber-400/50 rounded-3xl p-5 sm:p-6 text-center shadow-2xl flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20">
            <Award className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">{lang === 'fr' ? 'Félicitations' : 'Congratulations'}</span>
            <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">{lang === 'fr' ? "Diplôme d'Initié au Cercle Backgammon" : 'Backgammon Circle Initiate Diploma'}</h2>
            <p className="text-xs text-neutral-300 mt-0.5 max-w-md">
              {lang === 'fr' ? 'Vous maîtrisez le but du jeu, la sécurité, la barre, le bear-off et le videau. Vous êtes fin prêt à jouer !' : 'You have mastered rules, points, bar safety, bear-off, and the cube. Ready to play!'}
            </p>
          </div>
          <div className="px-4 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 font-bold text-sm">+2 000 PTS {lang === 'fr' ? 'Bonus Débloqués !' : 'Bonus Awarded!'}</div>
          <button type="button" data-testid="diploma-launch-guided-match-btn" onClick={handlePlayDirect} className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#f5d98b] to-[#b88924] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-105 active:scale-95 transition">
            {lang === 'fr' ? 'LANCER MA PREMIÈRE PARTIE GUIDÉE →' : 'START MY FIRST GUIDED MATCH →'}
          </button>
          <div className="w-full flex flex-col sm:flex-row gap-2 mt-0.5">
            <button type="button" data-testid="diploma-review-lessons-btn" onClick={() => { setViewState('QUIZ'); setActiveQuizIndex(0); setSelectedOptionId(null); }} className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition">
              {lang === 'fr' ? 'Revoir les 10 leçons' : 'Review the 10 lessons'}
            </button>
            <button type="button" onClick={handleBackToLobby} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 font-semibold text-xs border border-white/10 transition">
              {lang === 'fr' ? 'Retour Accueil' : 'Back to Home'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
