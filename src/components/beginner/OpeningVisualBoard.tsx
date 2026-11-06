'use client';

/**
 * @file src/components/beginner/OpeningVisualBoard.tsx
 * @description Plateau visuel interactif sans chiffre de case pour l'apprentissage des 15 coups d'ouverture.
 * Strictement <= 200 lignes, 0 `any`.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Play, RotateCcw, Swords, Home, Shield } from 'lucide-react';

interface MoveStep {
  readonly from: number;
  readonly to: number;
}

export interface OpeningVisualBoardProps {
  readonly moveFromTo: ReadonlyArray<MoveStep>;
  readonly isGate: boolean;
  readonly isEn: boolean;
}

export function getOpeningPointCoord(pt: number): { x: number; isTop: boolean } {
  if (pt >= 13 && pt <= 18) return { x: 22 + (pt - 13) * 34 + 17, isTop: true };
  if (pt >= 19 && pt <= 24) return { x: 250 + (pt - 19) * 34 + 17, isTop: true };
  if (pt >= 7 && pt <= 12) return { x: 22 + (12 - pt) * 34 + 17, isTop: false };
  return { x: 250 + (6 - pt) * 34 + 17, isTop: false };
}

const BASE_SETUP: Readonly<Record<number, number>> = {
  1: -2, 6: 5, 8: 3, 12: -5, 13: 5, 17: -3, 19: -5, 24: 2,
};

export const OpeningVisualBoard: React.FC<OpeningVisualBoardProps> = React.memo(({
  moveFromTo, isGate, isEn,
}) => {
  const [isMoved, setIsMoved] = useState(false);
  useEffect(() => { setIsMoved(false); }, [moveFromTo]);

  const currentBoard = useMemo(() => {
    const b: Record<number, number> = { ...BASE_SETUP };
    if (isMoved) {
      moveFromTo.forEach(({ from, to }) => {
        b[from] = (b[from] ?? 0) - 1;
        b[to] = (b[to] ?? 0) + 1;
      });
    }
    return b;
  }, [isMoved, moveFromTo]);

  const activePoints = useMemo(() => {
    const pts = new Set<number>();
    moveFromTo.forEach(({ from, to }) => { pts.add(from); pts.add(to); });
    return pts;
  }, [moveFromTo]);

  const targetGates = useMemo(() => {
    if (!isGate || !isMoved) return new Set<number>();
    const g = new Set<number>();
    moveFromTo.forEach(({ to }) => {
      if ((currentBoard[to] ?? 0) >= 2) g.add(to);
    });
    return g;
  }, [isGate, isMoved, moveFromTo, currentBoard]);

  return (
    <div data-testid="opening-visual-board" className="flex flex-col items-center w-full">
      <div className="flex items-center justify-between w-full px-3 py-1 text-[11px] font-bold text-amber-300/90 tracking-wide">
        <span className="flex items-center gap-1.5 opacity-75">
          <span>←</span><span>{isEn ? 'Middle Table' : 'Milieu du Plateau'}</span>
        </span>
        <span className="flex items-center gap-1 text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-500/20">
          <Swords className="w-3.5 h-3.5" /><span>{isEn ? 'Opponent Camp' : 'Camp Adverse'}</span>
        </span>
      </div>

      <div className="relative w-full aspect-[500/270] max-h-[290px] rounded-xl border border-[#D4AF37]/40 bg-[#0a1410] shadow-2xl overflow-hidden">
        <svg viewBox="0 0 500 270" className="w-full h-full select-none">
          <defs>
            <marker id="gold-arrow-head" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#D4AF37" />
            </marker>
            <radialGradient id="whiteCheckerGrad" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#ffffff" /><stop offset="70%" stopColor="#e5e5e5" /><stop offset="100%" stopColor="#c4c4c4" />
            </radialGradient>
            <radialGradient id="blackCheckerGrad" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#3f3f46" /><stop offset="70%" stopColor="#18181b" /><stop offset="100%" stopColor="#09090b" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width="500" height="270" fill="#081511" />
          <rect x="226" y="0" width="24" height="270" fill="#040b08" stroke="#D4AF37" strokeOpacity="0.2" />

          {Array.from({ length: 24 }, (_, i) => i + 1).map((pt) => {
            const { x, isTop } = getOpeningPointCoord(pt);
            const isDark = pt % 2 === 1;
            return (
              <polygon
                key={pt}
                points={`${x - 16},${isTop ? 0 : 270} ${x + 16},${isTop ? 0 : 270} ${x},${isTop ? 108 : 162}`}
                fill={isDark ? '#4a2511' : '#b88b4a'}
                opacity={activePoints.has(pt) ? '0.95' : '0.4'}
              />
            );
          })}

          {!isMoved && moveFromTo.map(({ from, to }, idx) => {
            const c1 = getOpeningPointCoord(from);
            const c2 = getOpeningPointCoord(to);
            const fromCount = Math.abs(BASE_SETUP[from] ?? 0);
            const y1 = c1.isTop ? 14 + fromCount * 15 : 256 - fromCount * 15;
            const y2 = c2.isTop ? 45 : 225;
            const cx = (c1.x + c2.x) / 2;
            const cy = c1.isTop === c2.isTop ? (c1.isTop ? 126 : 144) : 135;
            return (
              <path
                key={idx}
                data-testid="opening-move-arrow"
                d={`M ${c1.x} ${y1} Q ${cx} ${cy} ${c2.x} ${y2}`}
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="6 3"
                markerEnd="url(#gold-arrow-head)"
                className="animate-pulse"
                filter="drop-shadow(0 0 6px rgba(212,175,55,0.8))"
              />
            );
          })}

          {Array.from({ length: 24 }, (_, i) => i + 1).map((pt) => {
            const count = currentBoard[pt] ?? 0;
            if (count === 0) return null;
            const isWhite = count > 0;
            const total = Math.abs(count);
            const { x, isTop } = getOpeningPointCoord(pt);
            const isHighlighted = activePoints.has(pt);

            return (
              <g key={pt}>
                {Array.from({ length: Math.min(5, total) }).map((_, cIdx) => {
                  const cy = isTop ? 16 + cIdx * 16 : 254 - cIdx * 16;
                  return (
                    <circle
                      key={cIdx} cx={x} cy={cy} r="10"
                      fill={isWhite ? 'url(#whiteCheckerGrad)' : 'url(#blackCheckerGrad)'}
                      stroke={isHighlighted && isWhite ? '#F3E5AB' : isWhite ? '#a3a3a3' : '#71717a'}
                      strokeWidth={isHighlighted && isWhite ? '2' : '1'}
                      filter={isHighlighted && isWhite ? 'drop-shadow(0 0 4px #D4AF37)' : undefined}
                    />
                  );
                })}
              </g>
            );
          })}

          {Array.from(targetGates).map((pt) => {
            const { x, isTop } = getOpeningPointCoord(pt);
            const y = isTop ? 115 : 155;
            return (
              <g key={`gate-${pt}`} className="animate-bounce">
                <circle cx={x} cy={y} r="10" fill="#18181b" stroke="#D4AF37" strokeWidth="1.5" />
                <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fill="#D4AF37" fontWeight="bold">✦</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between w-full px-3 py-1.5 mt-1">
        <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
          <Home className="w-3.5 h-3.5" /><span>{isEn ? 'Your Home (Exit)' : 'Votre Maison (Sortie)'}</span>
        </span>

        <button
          type="button"
          data-testid="opening-animate-btn"
          onClick={() => setIsMoved((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-md ${
            isMoved
              ? 'bg-stone-800 text-stone-200 hover:bg-stone-700 border border-white/20'
              : 'bg-gradient-to-r from-[#D4AF37] via-[#f7d77e] to-[#b88924] text-slate-950 hover:brightness-110 border border-[#F3E5AB]'
          }`}
        >
          {isMoved ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isMoved ? (isEn ? 'Reset position' : 'Position Initiale') : (isEn ? 'Animate move' : 'Animer le déplacement')}</span>
        </button>
      </div>
    </div>
  );
});

OpeningVisualBoard.displayName = 'OpeningVisualBoard';
