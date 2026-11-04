'use client';

import React, { useState } from 'react';
import { X, Volume2, Sparkles, ArrowRight, Dices } from 'lucide-react';
import { OPENING_MOVES, OPENING_FAMILIES, type OpeningMove } from '../../data/beginnerOpeningMovesData';
import { useTranslation } from '../../i18n';

export interface BeginnerOpeningMovesExplorerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BeginnerOpeningMovesExplorer({ isOpen, onClose }: BeginnerOpeningMovesExplorerProps) {
  const { locale } = useTranslation();
  const lang = locale === 'en' ? 'en' : 'fr';
  const [selectedId, setSelectedId] = useState<string>('3-1');

  if (!isOpen) return null;

  const currentMove: OpeningMove =
    OPENING_MOVES.find((m) => m.id === selectedId) || OPENING_MOVES[0];

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const title = lang === 'fr' ? currentMove.titleFr : currentMove.titleEn;
    const exp = lang === 'fr' ? currentMove.explanationFr : currentMove.explanationEn;
    const text = `${title}. Notation : ${currentMove.notation}. ${exp}`;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    window.speechSynthesis.speak(utt);
  };

  return (
    <div
      data-testid="beginner-opening-explorer-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[92dvh] flex flex-col rounded-2xl border border-[#D4AF37]/50 bg-[#0c1017] p-4 sm:p-6 text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#f3d27a]">
              <Dices className="w-4 h-4 text-[#D4AF37]" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                {lang === 'fr' ? 'Simulateur des 15 Coups d’Ouverture' : '15 Opening Moves Simulator'}
              </h2>
              <p className="text-[11px] text-amber-300/80">
                {lang === 'fr' ? 'Que jouer au 1er lancer ? Les 15 réponses parfaites.' : 'What to play on roll 1? The 15 best answers.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="opening-close-btn"
            onClick={onClose}
            className="rounded-lg bg-white/5 p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps avec deux colonnes : Sélecteur de dés & Rendu Visuel */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-3 overflow-y-auto pr-1 flex-1">
          {/* Colonne gauche : Grille des 15 lancers par famille */}
          <div className="md:col-span-5 space-y-3">
            {(['GATES', 'RUNNING', 'BUILDING'] as const).map((famKey) => {
              const familyInfo = OPENING_FAMILIES[famKey];
              const familyMoves = OPENING_MOVES.filter((m) => m.family === famKey);
              return (
                <div key={famKey} className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                  <div className="text-[11px] font-bold text-stone-300 mb-2">
                    {lang === 'fr' ? familyInfo.labelFr : familyInfo.labelEn}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {familyMoves.map((m) => {
                      const isSel = m.id === selectedId;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          data-testid={`opening-roll-${m.id}`}
                          onClick={() => setSelectedId(m.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-bold transition active:scale-95 ${
                            isSel
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#b88924] border-[#F3E5AB] text-slate-950 shadow-md font-black'
                              : 'bg-white/[0.04] border-white/10 text-stone-200 hover:bg-white/10'
                          }`}
                        >
                          <span>🎲 {m.id}</span>
                          <span className="text-[10px] opacity-80">{m.notation.split(',')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Colonne droite : Détail du coup, plateau interactif & Professeur */}
          <div className="md:col-span-7 flex flex-col justify-between gap-3 rounded-xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#14120f] to-[#0a0d13] p-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#f3d27a] font-mono font-bold text-xs">
                    🎲 {currentMove.roll[0]}-{currentMove.roll[1]}
                  </span>
                  <span className="text-xs font-black text-amber-200">
                    {lang === 'fr' ? currentMove.titleFr : currentMove.titleEn}
                  </span>
                </div>
                <button
                  type="button"
                  data-testid="opening-voice-btn"
                  onClick={handleSpeak}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold hover:bg-amber-500/30 transition"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{lang === 'fr' ? 'Écouter' : 'Listen'}</span>
                </button>
              </div>

              {/* Rendu schématique du plateau avec flèches or */}
              <div
                data-testid="opening-board-display"
                className="mt-3 relative rounded-xl border border-white/10 bg-[#05070a] p-3 shadow-inner"
              >
                <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono mb-2">
                  <span>← Maison adverse (24)</span>
                  <span className="text-[#D4AF37] font-bold">Plateau 24 flèches</span>
                  <span>Maison blanche (1) →</span>
                </div>
                {/* Déplacements en flèches dorées animées */}
                <div className="flex flex-wrap items-center gap-2 my-2">
                  {currentMove.moveFromTo.map((step, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#f9e9be] text-xs font-mono font-black shadow"
                    >
                      <span>Case {step.from}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="text-emerald-400">Case {step.to}</span>
                    </div>
                  ))}
                  <span className="text-xs font-semibold text-stone-300">
                    (Notation officielle : <strong className="text-white">{currentMove.notation}</strong>)
                  </span>
                </div>
              </div>

              {/* Explication Professeur */}
              <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lang === 'fr' ? 'Le Conseil du Professeur :' : 'Professor’s Advice:'}</span>
                </div>
                <p
                  data-testid="opening-explanation-text"
                  className="text-xs sm:text-sm text-neutral-100 leading-relaxed font-medium"
                >
                  {lang === 'fr' ? currentMove.explanationFr : currentMove.explanationEn}
                </p>
              </div>
            </div>

            {/* Règle mémotechnique */}
            <div className="text-[11px] text-stone-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
              💡 {lang === 'fr'
                ? "Au premier coup, faire une porte (5, 4, 7) est toujours prioritaire sur une fuite ou un pion isolé."
                : 'On move 1, making a gate (5, 4, 7) always takes priority over escaping or running solo.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

