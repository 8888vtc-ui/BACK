'use client';

/**
 * @file src/components/beginner/BeginnerAcademyAnimatedPlayer.tsx
 * @description Lecteur vidéo cinématique pour l'Académie Débutant avec plateau SVG animé
 * 60 FPS, sous-titres clairs et effets sonores psychoacoustiques Web Audio (zéro voix robot).
 * Strictement <= 300 lignes, 0 `any`.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle, ArrowRight } from 'lucide-react';
import { BEGINNER_5_VIDEOS_PLAYLIST } from '../../data/beginner5VideosPlaylist';
import { useTranslation } from '../../i18n';
import { AcademyBoardStageSvg } from './AcademyBoardStageSvg';

export interface BeginnerAcademyAnimatedPlayerProps {
  readonly onEpisodeCompleted?: (episodeId: number) => void;
  readonly onLaunchQuizzes?: (episodeId: number) => void;
}

let audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

function playDiceRollSound() {
  const ctx = getAudioCtx(); if (!ctx) return;
  for (let i = 0; i < 4; i++) {
    const d = i * 0.04; const osc = ctx.createOscillator(); const f = ctx.createBiquadFilter(); const g = ctx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(900 + i * 150, ctx.currentTime + d);
    f.type = 'bandpass'; f.frequency.setValueAtTime(1400, ctx.currentTime + d); f.Q.setValueAtTime(2.5, ctx.currentTime + d);
    g.gain.setValueAtTime(0.08, ctx.currentTime + d); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d + 0.045);
    osc.connect(f).connect(g).connect(ctx.destination);
    osc.start(ctx.currentTime + d); osc.stop(ctx.currentTime + d + 0.05);
  }
}

function playCheckerWoodTap() {
  const ctx = getAudioCtx(); if (!ctx) return;
  const osc = ctx.createOscillator(); const f = ctx.createBiquadFilter(); const g = ctx.createGain();
  osc.type = 'triangle'; osc.frequency.setValueAtTime(140, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.065);
  f.type = 'lowpass'; f.frequency.setValueAtTime(800, ctx.currentTime);
  g.gain.setValueAtTime(0.12, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.065);
  osc.connect(f).connect(g).connect(ctx.destination);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.07);
}

function playHitImpactSound() {
  const ctx = getAudioCtx(); if (!ctx) return;
  const osc = ctx.createOscillator(); const g = ctx.createGain();
  osc.type = 'sawtooth'; osc.frequency.setValueAtTime(260, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.08);
  g.gain.setValueAtTime(0.14, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
  osc.connect(g).connect(ctx.destination);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.095);
}

function playShieldChime() {
  const ctx = getAudioCtx(); if (!ctx) return;
  [528, 660].forEach((freq) => {
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(0.05, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(g).connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.36);
  });
}

export function BeginnerAcademyAnimatedPlayer({
  onEpisodeCompleted, onLaunchQuizzes,
}: BeginnerAcademyAnimatedPlayerProps) {
  const { locale } = useTranslation();
  const isEn = locale === 'en';

  const [activeEpisodeId, setActiveEpisodeId] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedEpisodes, setCompletedEpisodes] = useState<number[]>([]);

  const episode = BEGINNER_5_VIDEOS_PLAYLIST.find(e => e.id === activeEpisodeId) ?? BEGINNER_5_VIDEOS_PLAYLIST[0];
  const totalDuration = episode.cues.reduce((sum, c) => sum + c.durationSec, 0) || 25;
  const progress = Math.min(1, Math.max(0, currentTime / totalDuration));

  let accumulated = 0;
  let activeCue = episode.cues[0];
  for (const c of episode.cues) {
    if (currentTime >= accumulated && currentTime < accumulated + c.durationSec) { activeCue = c; break; }
    accumulated += c.durationSec;
  }
  if (currentTime >= totalDuration) activeCue = episode.cues[episode.cues.length - 1];

  const lastCueIdRef = useRef<string | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Coupe-circuit définitif contre tout résidu de synthèse vocale
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
  }, []);

  // Déclenchement des effets sonores psychoacoustiques synchronisés
  useEffect(() => {
    if (!soundEnabled || !isPlaying || !activeCue || activeCue.id === lastCueIdRef.current) return;
    lastCueIdRef.current = activeCue.id;
    if (activeCue.boardAction === 'INTRO') playDiceRollSound();
    else if (activeCue.boardAction === 'HIT') playHitImpactSound();
    else if (activeCue.boardAction === 'ANCHOR' || activeCue.boardAction === 'PRIME') playShieldChime();
    else playCheckerWoodTap();
  }, [activeCue, soundEnabled, isPlaying]);

  // Boucle de rendu fluide 60fps (requestAnimationFrame) avec boucle continue
  useEffect(() => {
    if (!isPlaying) { lastTimestampRef.current = null; return; }

    const step = (timestamp: number) => {
      if (lastTimestampRef.current === null) lastTimestampRef.current = timestamp;
      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      setCurrentTime(prev => {
        const next = prev + delta;
        if (next >= totalDuration) {
          setCompletedEpisodes(done => (done.includes(episode.id) ? done : [...done, episode.id]));
          onEpisodeCompleted?.(episode.id);
          lastCueIdRef.current = null;
          return 0; // Boucle continue 60 FPS
        }
        return next;
      });
      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isPlaying, totalDuration, episode.id, onEpisodeCompleted]);

  const handlePlayToggle = () => {
    if (currentTime >= totalDuration) { setCurrentTime(0); lastCueIdRef.current = null; }
    setIsPlaying(prev => !prev);
  };
  const handleReset = () => { setIsPlaying(false); setCurrentTime(0); lastCueIdRef.current = null; };
  const handleSelectEpisode = (id: number) => { handleReset(); setActiveEpisodeId(id); setIsPlaying(true); };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => { setCurrentTime(parseFloat(e.target.value)); lastCueIdRef.current = null; };
  const formatTime = (sec: number) => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${Math.floor(sec % 60).toString().padStart(2, '0')}`;

  return (
    <div data-testid="academy-video-player" className="flex flex-col gap-2.5 sm:gap-3 w-full max-w-4xl mx-auto p-3 sm:p-4 bg-[#0B1015]/95 border border-amber-400/20 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
      {/* 1. Onglets propres des 5 épisodes sans doublon */}
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white/[0.08] text-white border border-[#D4AF37]/60 shadow-sm ring-1 ring-[#D4AF37]/30'
                  : isDone
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {isDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isEn ? `Ep. ${ep.id}` : `Ép. ${ep.id}`} ({ep.durationLabel})</span>
            </button>
          );
        })}
      </div>

      {/* 2. Titre & Commutateur Effets Sonores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
            {isEn ? 'Beginner Video Mini-Series' : 'Mini-Série Vidéo Débutant'} • {episode.durationLabel}
          </span>
          <h2 className="text-lg md:text-xl font-bold text-white mt-0.5">{isEn ? episode.titleEn : episode.titleFr}</h2>
          <p className="text-xs text-neutral-400 mt-0.5">{isEn ? episode.descriptionEn : episode.descriptionFr}</p>
        </div>

        <button
          type="button"
          data-testid="academy-sound-toggle-btn"
          onClick={() => setSoundEnabled(v => !v)}
          className={`self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            soundEnabled ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30' : 'bg-white/5 text-neutral-400 border border-white/10'
          }`}
          title={soundEnabled ? (isEn ? 'Sound effects enabled' : 'Effets sonores actifs') : (isEn ? 'Sound effects muted' : 'Effets sonores désactivés')}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{soundEnabled
            ? (isEn ? '🔊 Sound Effects: ON' : '🔊 Effets Sonores : ON')
            : (isEn ? '🔇 Sound Effects: OFF' : '🔇 Effets Sonores : OFF')}</span>
        </button>
      </div>

      {/* 3. Plateau SVG cinématique 60 FPS */}
      <div className="relative w-full rounded-xl overflow-hidden border border-amber-400/25 bg-[#080c10] shadow-inner">
        <AcademyBoardStageSvg episodeId={activeEpisodeId} progress={progress} isEn={isEn} />
      </div>

      {/* 4. Sous-titre cinématique synchronisé */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-black/80 via-[#121921]/90 to-black/80 border border-amber-400/20 text-center">
        <p className="text-xs sm:text-sm font-semibold text-neutral-100 leading-relaxed tracking-wide">
          {isEn ? activeCue.enText : activeCue.frText}
        </p>
      </div>

      {/* 5. Barre de lecture interactive (Seekable) & Temps */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono text-neutral-400 tabular-nums">{formatTime(currentTime)}</span>
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
        <span className="text-[11px] font-mono text-neutral-400 tabular-nums">{formatTime(totalDuration)}</span>
      </div>

      {/* 6. Barre de contrôle (1 seul bouton Or) */}
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
