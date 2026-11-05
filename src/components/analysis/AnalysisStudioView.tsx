'use client';

/**
 * @file src/components/analysis/AnalysisStudioView.tsx
 * @description Studio d'Analyse Tactique & Scanner XGID 3-Ply (Open Sage & Gemini Flash).
 * Strictement <= 290 lignes, 0 any.
 */

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { parseXGID, type BoardState } from '../../engine/backgammonEngine';
import Board from '../board/Board';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import { evaluateWithBgsage, type BgsageMove, type BgsageEvaluateResponse } from '../../lib/engine/bgsageClient';
import { parseCoachNotationMoves } from '../../features/coach/coachMoveNotation';
import { BotPortraitMedallion } from '../common/MonteCarloIcons';

export const FAMOUS_PRESET_POSITIONS = [
  {
    name: 'Ouverture Classique (3-1)',
    xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:31:0:0:0:7:10',
    desc: 'Coup d\'or : faire le point 5 avec 8/5 6/5.',
  },
  {
    name: 'Point d\'Ancre Avancé (6-4)',
    xgid: 'XGID=-a-B-BD-B---dD---c-db---B-:0:0:1:64:0:0:0:7:10',
    desc: 'Course serrée : ancrage défensif vs attaque.',
  },
  {
    name: 'Décision de Videau Critique (DMP)',
    xgid: 'XGID=--BBBBBA----dC---b-e-bb-A-:0:0:1:00:4:4:0:5:10',
    desc: 'Blitz potentiel : doubler maintenant ou attendre ?',
  },
];

export function AnalysisStudioView() {
  const { theme } = useBoardTheme();
  const [xgidInput, setXgidInput] = useState(FAMOUS_PRESET_POSITIONS[0]?.xgid ?? '');
  const [analysisResult, setAnalysisResult] = useState<BgsageEvaluateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedMoveNotation, setSelectedMoveNotation] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const parsedXgid = React.useMemo(() => {
    try {
      return parseXGID(xgidInput);
    } catch {
      return null;
    }
  }, [xgidInput]);

  const boardState: BoardState = React.useMemo(() => {
    if (!parsedXgid) {
      return {
        board: new Array(28).fill(0),
        turn: 'X',
        cubeValue: 1,
        cubeOwner: null,
        dice: [3, 1],
        matchLength: 7,
        scoreX: 0,
        scoreO: 0,
        crawford: false,
        doubled: false,
        resigned: 0,
      };
    }
    const d0 = parsedXgid.dice ? parsedXgid.dice[0] : 3;
    const d1 = parsedXgid.dice ? parsedXgid.dice[1] : 1;
    const diceTuple: [number, number] = (d0 === 0 && d1 === 0 ? [3, 1] : [d0, d1]);
    return {
      board: parsedXgid.board,
      turn: parsedXgid.turn,
      cubeValue: parsedXgid.cubeValue || 1,
      cubeOwner: parsedXgid.cubeOwner,
      dice: diceTuple,
      matchLength: parsedXgid.matchLength || 7,
      scoreX: parsedXgid.scoreX || 0,
      scoreO: parsedXgid.scoreO || 0,
      crawford: parsedXgid.crawford || false,
      doubled: false,
      resigned: 0,
    };
  }, [parsedXgid]);

  const coachHighlight = React.useMemo(() => {
    if (!selectedMoveNotation || !parsedXgid) return null;
    const moves = parseCoachNotationMoves(selectedMoveNotation, parsedXgid.turn);
    return { played: [], optimal: moves };
  }, [selectedMoveNotation, parsedXgid]);

  const handleRunAnalysis = async () => {
    if (!xgidInput.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await evaluateWithBgsage(xgidInput.trim(), 3, 12000);
      if (!data || !data.chequerPlay) {
        setErrorMessage('Analyseur bgsage 3-ply momentanément indisponible.');
      } else {
        startTransition(() => {
          setAnalysisResult(data);
          if (data.chequerPlay && data.chequerPlay.length > 0) {
            setSelectedMoveNotation(data.chequerPlay[0]?.notation ?? null);
          }
        });
      }
    } catch {
      setErrorMessage('Erreur réseau lors de l\'évaluation 3-ply.');
    } finally {
      setLoading(false);
    }
  };

  const emptyTargets = React.useMemo(() => new Map<number, number[]>(), []);
  const noop = React.useCallback(() => {}, []);

  return (
    <div className="flex h-dvh max-h-dvh w-full max-w-[1920px] mx-auto flex-col p-2 text-[#fdf8eb] bg-[#050505] overflow-hidden" data-testid="analysis-studio-root">
      {/* Barre supérieure */}
      <header className="flex items-center justify-between border-b border-[#D4AF37]/30 pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" data-testid="studio-back-btn" className="inline-flex items-center gap-1 rounded-lg border border-[#D4AF37]/50 bg-[#12151C] px-2.5 py-1 text-xs font-bold text-[#D4AF37] hover:border-[#D4AF37] hover:text-white transition">
            ← Retour Salon
          </Link>
          <div className="flex items-center gap-2">
            <BotPortraitMedallion character="grandmaster" size="sm" isActive={true} />
            <h1 className="font-display text-base font-black tracking-wide text-white">
              Studio d&apos;Analyse 3-Ply &amp; Scanner XGID
            </h1>
          </div>
        </div>
        <span className="rounded-full border border-emerald-400/40 bg-emerald-950/70 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
          Open Sage • 3-Ply 24 Réseaux
        </span>
      </header>

      {/* Contenu principal */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        {/* Plateau de gauche */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-[#0B1015] border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden min-h-0">
          <div className="w-full flex-1 min-h-0 flex items-center justify-center">
            <Board
              state={boardState}
              gamePhase="REPLAY_VIEW"
              theme={theme}
              coachHighlight={coachHighlight}
              leftDieTargets={emptyTargets}
              rightDieTargets={emptyTargets}
              selectedPoint={null}
              selectedDie={null}
              usedDice={[false, false]}
              onCheckerClick={noop}
              onCheckerRightClick={noop}
              onDestinationClick={noop}
            />
          </div>
          {selectedMoveNotation && (
            <div className="mt-2 text-xs font-mono text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              Coup sélectionné : <strong>{selectedMoveNotation}</strong> (Flèches actives sur le plateau)
            </div>
          )}
        </div>

        {/* Panneau de droite : Entrée XGID et Résultats */}
        <div className="lg:col-span-5 flex flex-col gap-2.5 bg-[#12151C] border border-white/10 rounded-2xl p-3 shadow-2xl overflow-y-auto">
          {/* Sélection de positions de référence */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="analysis-preset-select" className="text-xs font-bold uppercase text-[#D4AF37] tracking-wider">
              Positions célèbres de tournoi :
            </label>
            <div id="analysis-preset-select" className="flex flex-wrap gap-1.5">
              {FAMOUS_PRESET_POSITIONS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setXgidInput(p.xgid);
                    setAnalysisResult(null);
                    setSelectedMoveNotation(null);
                  }}
                  className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-semibold text-stone-300 hover:border-[#D4AF37] hover:text-white transition"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Saisie XGID */}
          <div className="flex flex-col gap-1">
            <label htmlFor="xgid-input-field" className="text-xs font-bold text-stone-300">
              Chaîne XGID :
            </label>
            <input
              id="xgid-input-field"
              type="text"
              data-testid="xgid-input"
              value={xgidInput}
              onChange={(e) => setXgidInput(e.target.value)}
              placeholder="Collez une chaîne XGID officielle..."
              className="w-full rounded-xl border border-white/20 bg-black/50 px-3 py-1.5 font-mono text-xs text-amber-200 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <button
            type="button"
            data-testid="run-analysis-btn"
            disabled={loading}
            onClick={handleRunAnalysis}
            className="w-full rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#d4af37] via-[#f8d778] to-[#c69214] py-2 text-xs font-black uppercase tracking-wider text-[#1a0f08] shadow-md hover:brightness-105 disabled:opacity-50 transition"
          >
            {loading ? 'Calcul 3-ply en cours...' : '⚡ Analyser en 3-Ply (Open Sage)'}
          </button>

          {errorMessage && (
            <div data-testid="analysis-error-box" className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-950/60 text-xs text-rose-200">
              {errorMessage}
            </div>
          )}

          {/* Résultats d'analyse */}
          {analysisResult && analysisResult.chequerPlay && (
            <div data-testid="analysis-results-section" className="flex flex-col gap-2 mt-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 border-b border-emerald-500/30 pb-1">
                Top 5 des Coups Légaux (Équité 3-Ply) :
              </h2>
              <div className="flex flex-col gap-1.5">
                {analysisResult.chequerPlay.slice(0, 5).map((move: BgsageMove, idx: number) => {
                  const isSelected = selectedMoveNotation === move.notation;
                  return (
                    <button
                      key={move.notation}
                      type="button"
                      data-testid={`analysis-move-row-${idx}`}
                      onClick={() => setSelectedMoveNotation(move.notation)}
                      className={`flex flex-col p-2 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-[#D4AF37] bg-white/10 shadow-md'
                          : 'border-white/10 bg-black/40 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="font-extrabold text-[#fdf8eb]">
                          #{idx + 1} {move.notation}
                        </span>
                        <span className={`font-black ${idx === 0 ? 'text-emerald-400' : 'text-rose-300'}`}>
                          {idx === 0 ? 'Optimal' : `-${Math.abs(move.equityLoss).toFixed(3)} EMG`}
                        </span>
                      </div>
                      {move.probabilities && (
                        <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-stone-400">
                          <span>Gagne : {(move.probabilities.win * 100).toFixed(1)}%</span>
                          <span>·</span>
                          <span>Gammon : {(move.probabilities.winGammon * 100).toFixed(1)}%</span>
                          <span>·</span>
                          <span>Perd : {((move.probabilities.loseWin ?? (1 - move.probabilities.win)) * 100).toFixed(1)}%</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Décision de videau si présente */}
              {analysisResult.cubeDecision && analysisResult.cubeDecision.optimalAction && (
                <div data-testid="cube-decision-box" className="mt-2 p-2.5 rounded-xl border border-sky-400/30 bg-sky-950/40 text-xs">
                  <span className="font-bold text-sky-300 uppercase">Conseil Videau 3-Ply : </span>
                  <span className="font-mono text-white">{analysisResult.cubeDecision.optimalAction}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default AnalysisStudioView;
