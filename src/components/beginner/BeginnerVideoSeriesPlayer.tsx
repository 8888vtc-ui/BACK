'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { BEGINNER_5_VIDEOS_PLAYLIST } from '../../data/beginner5VideosPlaylist';
import { useTranslation } from '../../i18n';

interface BeginnerVideoSeriesPlayerProps {
  onEpisodeCompleted?: (episodeId: number) => void;
  onLaunchQuizzes?: (episodeId: number) => void;
}

export function BeginnerVideoSeriesPlayer({
  onEpisodeCompleted,
  onLaunchQuizzes,
}: BeginnerVideoSeriesPlayerProps) {
  const { locale } = useTranslation();
  const lang = locale === 'en' ? 'en' : 'fr';
  const [activeEpisodeId, setActiveEpisodeId] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentCueIndex, setCurrentCueIndex] = useState<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [completedEpisodes, setCompletedEpisodes] = useState<number[]>([]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const episode = BEGINNER_5_VIDEOS_PLAYLIST.find(e => e.id === activeEpisodeId) || BEGINNER_5_VIDEOS_PLAYLIST[0];
  const activeCue = episode.cues[currentCueIndex] || episode.cues[0];

  // Lecture voix off via Web Speech API
  const speakCue = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    utt.rate = 1.0;
    utt.pitch = 1.05;
    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
  };

  // Progression de la vidéo
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      return;
    }

    const textToSpeak = lang === 'fr' ? activeCue.frText : activeCue.enText;
    speakCue(textToSpeak);

    timerRef.current = setTimeout(() => {
      if (currentCueIndex < episode.cues.length - 1) {
        setCurrentCueIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
        if (!completedEpisodes.includes(episode.id)) {
          const next = [...completedEpisodes, episode.id];
          setCompletedEpisodes(next);
          onEpisodeCompleted?.(episode.id);
        }
      }
    }, activeCue.durationSec * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentCueIndex, activeEpisodeId, lang]);

  const handlePlayToggle = () => {
    setIsPlaying(prev => !prev);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentCueIndex(0);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const handleSelectEpisode = (id: number) => {
    handleReset();
    setActiveEpisodeId(id);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto p-4 md:p-6 bg-[#0B1015]/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md">
      {/* Barre de sélection des 5 épisodes */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-white/5">
        {BEGINNER_5_VIDEOS_PLAYLIST.map((ep) => {
          const isDone = completedEpisodes.includes(ep.id);
          const isActive = ep.id === activeEpisodeId;
          return (
            <button
              key={ep.id}
              type="button"
              onClick={() => handleSelectEpisode(ep.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                  : isDone
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {isDone ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <span>#{ep.id}</span>}
              <span>{lang === 'fr' ? `Ép. ${ep.id}` : `Ep. ${ep.id}`}</span>
              <span className="text-[10px] opacity-70">({ep.durationLabel})</span>
            </button>
          );
        })}
      </div>

      {/* Titre & Description de l'épisode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
            {lang === 'fr' ? 'Mini-Série Vidéo Débutant' : 'Beginner Video Mini-Series'} • {episode.durationLabel}
          </span>
          <h2 className="text-lg md:text-xl font-bold text-white mt-0.5">
            {lang === 'fr' ? episode.titleFr : episode.titleEn}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {lang === 'fr' ? episode.descriptionFr : episode.descriptionEn}
          </p>
        </div>

        {/* Contrôle Voix On/Off */}
        <button
          type="button"
          onClick={() => setVoiceEnabled(v => !v)}
          className={`self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors ${
            voiceEnabled ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20' : 'bg-white/5 text-neutral-400'
          }`}
          title={voiceEnabled ? 'Voix off activée' : 'Voix off coupée'}
        >
          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{voiceEnabled ? 'Voix FR/EN On' : 'Muet'}</span>
        </button>
      </div>

      {/* Écran d'animation & Sous-titres dynamiques */}
      <div className="relative min-h-[140px] md:min-h-[160px] p-5 rounded-xl bg-gradient-to-br from-black/80 to-[#121921]/80 border border-amber-400/20 flex flex-col justify-between overflow-hidden">
        {/* Badge d'illumination tactique */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
            <Sparkles className="w-3 h-3 text-amber-400" />
            {lang === 'fr' ? 'Plateau Animé' : 'Animated Board'}
          </span>
          {activeCue.highlightPoints && (
            <span className="text-[10px] text-neutral-400">
              {lang === 'fr' ? `Flèches ciblées : ${activeCue.highlightPoints.join(', ')}` : `Target points: ${activeCue.highlightPoints.join(', ')}`}
            </span>
          )}
          {activeCue.highlightBar && (
            <span className="text-[10px] text-rose-400 font-semibold">
              {lang === 'fr' ? 'Barre centrale illuminée' : 'Center bar highlighted'}
            </span>
          )}
          {activeCue.highlightCube && (
            <span className="text-[10px] text-amber-300 font-semibold">
              {lang === 'fr' ? 'Videau (Cube 64) actif' : 'Doubling cube active'}
            </span>
          )}
        </div>

        {/* Sous-titre animé central en haute lisibilité */}
        <div className="my-3 text-center sm:text-left">
          <p className="text-sm md:text-base font-semibold text-white leading-relaxed tracking-wide drop-shadow-sm">
            {lang === 'fr' ? activeCue.frText : activeCue.enText}
          </p>
        </div>

        {/* Barre de progression de l'épisode */}
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-400 h-full transition-all duration-300 ease-out"
            style={{ width: `${((currentCueIndex + (isPlaying ? 0.7 : 0)) / episode.cues.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Barre de contrôle du lecteur */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="video-play-toggle-btn"
            onClick={handlePlayToggle}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-lg shadow-amber-400/20 transition-transform active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
            <span>{isPlaying ? (lang === 'fr' ? 'Pause' : 'Pause') : (lang === 'fr' ? 'Lancer la vidéo' : 'Play video')}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            title="Recommencer l'épisode"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Enchaînement vers les 2 quiz d'initiation */}
        <button
          type="button"
          data-testid="video-launch-quizzes-btn"
          onClick={() => onLaunchQuizzes?.(episode.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-xs transition-all hover:translate-x-0.5"
        >
          <span>{lang === 'fr' ? 'Tester avec 2 mini-quiz (+400 PTS)' : 'Test with 2 mini-quizzes (+400 PTS)'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

