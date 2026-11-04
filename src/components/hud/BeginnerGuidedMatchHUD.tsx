'use client';

import React from 'react';
import { RotateCcw, Lightbulb, ShieldCheck } from 'lucide-react';

export interface BeginnerGuidedMatchHUDProps {
  onUndoMove?: () => void;
  onAskTip?: () => void;
  canUndo?: boolean;
}

export function BeginnerGuidedMatchHUD({ onUndoMove, onAskTip, canUndo }: BeginnerGuidedMatchHUDProps) {
  return (
    <div
      data-testid="beginner-guided-match-hud"
      className="w-full max-w-4xl mx-auto px-4 py-1.5 flex items-center justify-between rounded-xl bg-emerald-950/40 border border-emerald-500/20 backdrop-blur-md text-white text-xs mb-1.5 shrink-0"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold text-emerald-200">Mode Guidé Débutant · Jouez sans stress</span>
      </div>

      <div className="flex items-center gap-2">
        {onAskTip && (
          <button
            type="button"
            onClick={onAskTip}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-400/20 transition"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Indice</span>
          </button>
        )}

        {onUndoMove && (
          <button
            type="button"
            onClick={onUndoMove}
            disabled={!canUndo}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réessayer le coup</span>
          </button>
        )}
      </div>
    </div>
  );
}

