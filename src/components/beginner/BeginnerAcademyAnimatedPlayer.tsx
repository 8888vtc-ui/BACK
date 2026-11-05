'use client';

/**
 * @file src/components/beginner/BeginnerAcademyAnimatedPlayer.tsx
 * @description Lecteur vidéo cinématique pour l'Académie Débutant avec plateau SVG animé
 * en temps réel, sous-titres synchronisés, synthèse vocale et barre de progression interactive.
 * Strictement <= 280 lignes, 0 `any`.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle, ArrowRight } from 'lucide-react';
import { BEGINNER_5_VIDEOS_PLAYLIST } from '../../data/beginner5VideosPlaylist';
import { useTranslation } from '../../i18n';
import { AcademyBoardStageSvg } from './AcademyBoardStageSvg';

export interface BeginnerAcademyAnimatedPlayerProps {
  readonly onEpisodeCompleted?: (episodeId: number) => void;
  readonly onLaunchQuizzes?: (episodeId: number) => void;
}

export function BeginnerAcademyAnimatedPlayer({
  onEpisodeCompleted,
  onLaunchQuizzes,
}: BeginnerAcademyAnimatedPlayerProps) {
  const { locale } = useTranslation();
  const isEn = locale === 'en';

  const [activeEpisodeId, setActiveEpisodeId] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [completedEpisodes, setCompletedEpisodes] = useState<number[]>([]);

  const episode = BEGINNER_5_VIDEOS_PLAYLIST.find(e => e.id === activeEpisodeId) ?? BEGINNER_5_VIDEOS_PLAYLIST[0];
  const totalDuration = episode.cues.reduce((sum, c) => sum + c.durationSec, 0) || 25;
  const progress = Math.min(1, Math.max(0, currentTime / totalDuration));

  // Trouver le cue actif selon currentTime
  let accumulated = 0;
  let activeCue = episode.cues[0];
  for (const c of episode.cues) {
    if (currentTime >= accumulated && currentTime < accumulated + c.durationSec) {
      activeCue = c;
      break;
    }
    accumulated += c.durationSec;
  }
  if (currentTime >= totalDuration) {
    activeCue = episode.cues[episode.cues.length - 1];
  }

  const lastSpokenCueIdRef = useRef<string | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Synthèse vocale Web Speech API
  const speakCurrentCue = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = isEn ? 'en-US' : 'fr-FR';
    utt.rate = 1.0;
    utt.pitch = 1.05;
    window.speechSynthesis.speak(utt);
  }, [voiceEnabled, isEn]);

  // Boucle de rendu fluide 60fps (requestAnimationFrame)
  useEffect(() => {
    if (!isPlaying) {
      lastTimestampRef.current = null;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      return;
    }

    const step = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }
      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      setCurrentTime(prev => {
        const next = prev + delta;
        if (next >= totalDuration) {
          setIsPlaying(false);
          setCompletedEpisodes(done => (done.includes(episode.id) ? done : [...done, episode.id]));
          onEpisodeCompleted?.(episode.id);
          return totalDuration;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, totalDuration, episode.id, onEpisodeCompleted]);

  // Déclencheur vocal lors d'un nouveau segment (cue)
  useEffect(() => {
    if (isPlaying && activeCue && activeCue.id !== lastSpokenCueIdRef.current) {
      lastSpokenCueIdRef.current = activeCue.id;
      const textToSpeak = isEn ? activeCue.enText : activeCue.frText;
      speakCurrentCue(textToSpeak);
    }
  }, [isPlaying, activeCue, isEn, speakCurrentCue]);

  const handlePlayToggle = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
      lastSpokenCueIdRef.current = null;
    }
    setIsPlaying(prev => !prev);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    lastSpokenCueIdRef.current = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const handleSelectEpisode = (id: number) => {
    handleReset();
    setActiveEpisodeId(id);
    setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    lastSpokenCueIdRef.current = null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      data-testid="academy-video-player"
      className="flex flex-col gap-4 w-full max-w-4xl mx-auto p-4 md:p-6 bg-[#0B1015]/95 border border-amber-400/20 rounded-2xl shadow-2xl backdrop-blur-md"
    >
      {/* 1. Sélecteur des 5 épisodes */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-white/5">
        {BEGINNER_5_VIDEOS_PLAYLIST.map(ep => {
          const isDone = completedEpisodes.includes(ep.id);
          const isActive = ep.id === activeEpisodeId;
          return (
            <button
              key={ep.id}
              type="button"
              data-testid={`academy-episode-tab-${ep.id}`}
              onClick={() => handleSelectEpisode(ep.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20 ring-1 ring-amber-300'
                  : isDone
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {isDone ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <span>#{ep.id}</span>}
              <span>{isEn ? `Ep. ${ep.id}` : `Ép. ${ep.id}`}</span>
              <span className="text-[10px] opacity-70">({ep.durationLabel})</span>
            </button>
          );
        })}
      </div>

      {/* 2. Titre & Description & Toggle Voix */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
            {isEn ? 'Beginner Video Mini-Series' : 'Mini-Série Vidéo Débutant'} • {episode.durationLabel}
          </span>
          <h2 className="text-lg md:text-xl font-bold text-white mt-0.5">
            {isEn ? episode.titleEn : episode.titleFr}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {isEn ? episode.descriptionEn : episode.descriptionFr}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setVoiceEnabled(v => !v)}
          className={`self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            voiceEnabled ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30' : 'bg-white/5 text-neutral-400 border border-white/10'
          }`}
          title={voiceEnabled ? 'Voix activée' : 'Voix coupée'}
        >
          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{voiceEnabled ? 'Voix FR/EN On' : 'Muet'}</span>
        </button>
      </div>

      {/* 3. VRAI PLATEAU ANIMÉ CINÉMATIQUE SVG (16:9) */}
      <div className="relative w-full rounded-xl overflow-hidden border border-amber-400/25 bg-[#080c10] shadow-inner">
        <AcademyBoardStageSvg
          episodeId={activeEpisodeId}
          progress={progress}
          isEn={isEn}
        />
      </div>

      {/* 4. Sous-titre cinématique synchronisé (ZÉRO texte fake 'Flèches ciblées') */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-black/80 via-[#121921]/90 to-black/80 border border-amber-400/20 text-center">
        <p className="text-xs sm:text-sm font-semibold text-neutral-100 leading-relaxed tracking-wide">
          {isEn ? activeCue.enText : activeCue.frText}
        </p>
      </div>

      {/* 5. Barre de lecture interactive (Seekable) & Temps */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          data-testid="academy-video-progress"
          min="0"
          max={totalDuration}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
        />
        <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
          {formatTime(totalDuration)}
        </span>
      </div>

      {/* 6. Barre de contrôle (Play / Pause / Reset / Quiz) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="video-play-toggle-btn"
            onClick={handlePlayToggle}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-lg shadow-amber-400/20 transition-transform active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
            <span>{isPlaying ? (isEn ? 'Pause' : 'Pause') : (isEn ? 'Lancer la vidéo' : 'Lancer la vidéo')}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            title={isEn ? 'Restart video' : "Recommencer l'épisode"}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          data-testid="video-launch-quizzes-btn"
          onClick={() => onLaunchQuizzes?.(episode.id)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-xs transition-all hover:translate-x-0.5"
        >
          <span>{isEn ? 'Test with 2 mini-quizzes (+400 PTS)' : 'Tester avec 2 mini-quiz (+400 PTS)'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
export default BeginnerAcademyAnimatedPlayer;
