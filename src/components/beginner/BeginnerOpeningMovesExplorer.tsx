'use client';

/**
 * @file src/components/beginner/BeginnerOpeningMovesExplorer.tsx
 * @description Simulateur des 15 Coups d'Ouverture pour débutants.
 * 100 % visuel : zéro notation chiffrée (8/5, 13/7 bannis), vrai plateau SVG avec flèches dorées et conseils simples.
 * Strictement <= 300 lignes, 0 `any`.
 */

import React, { useState, useEffect } from 'react';
import { X, Volume2, Sparkles, Dices } from 'lucide-react';
import { OPENING_MOVES, OPENING_FAMILIES, type OpeningMove } from '../../data/beginnerOpeningMovesData';
import { OpeningVisualBoard } from './OpeningVisualBoard';
import { useTranslation } from '../../i18n';
import { soundEngine } from '../../lib/sound/soundEngine';

export interface BeginnerOpeningMovesExplorerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const BeginnerOpeningMovesExplorer: React.FC<BeginnerOpeningMovesExplorerProps> = React.memo(({
  isOpen,
  onClose,
}) => {
  const { locale } = useTranslation();
  const lang = locale === 'en' ? 'en' : 'fr';
  const isEn = lang === 'en';
  const [selectedId, setSelectedId] = useState<string>('3-1');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentMove: OpeningMove =
    OPENING_MOVES.find((m) => m.id === selectedId) ?? OPENING_MOVES[0];

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (soundEngine.isMute()) return;
    if (isSpeaking || window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const title = isEn ? currentMove.titleEn : currentMove.titleFr;
    const exp = isEn ? currentMove.explanationEn : currentMove.explanationFr;
    const text = `${title}. ${exp}`;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = isEn ? 'en-US' : 'fr-FR';
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utt);
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    setIsSpeaking(false);
    onClose();
  };

  return (
    <div
      data-testid="beginner-opening-explorer-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[94dvh] flex flex-col rounded-2xl border border-[#D4AF37]/50 bg-[#0c1017] p-3 sm:p-5 text-white shadow-2xl overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#f3d27a]">
              <Dices className="w-4 h-4 text-[#D4AF37]" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                {isEn ? '15 Opening Moves Simulator' : 'Simulateur des 15 Coups d’Ouverture'}
              </h2>
              <p className="text-[11px] text-amber-300/80 font-medium">
                {isEn ? 'What to play on roll 1? The 15 best visual answers.' : 'Que jouer au 1er lancer ? Les 15 réponses parfaites.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="opening-close-btn"
            onClick={handleClose}
            aria-label="Fermer le simulateur d'ouverture"
            className="rounded-lg bg-white/5 p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps : 2 Colonnes (Sélecteur de dés & Plateau Visuel) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 my-2.5 overflow-y-auto pr-1 flex-1">
          {/* Colonne gauche : 15 boutons avec dés + mot-clé d'intention (Zéro notation chiffrée) */}
          <div className="md:col-span-5 space-y-2.5">
            {(['GATES', 'RUNNING', 'BUILDING'] as const).map((famKey) => {
              const familyInfo = OPENING_FAMILIES[famKey];
              const familyMoves = OPENING_MOVES.filter((m) => m.family === famKey);
              return (
                <div key={famKey} className="rounded-xl border border-white/10 bg-white/[0.02] p-2">
                  <div className="text-xs font-extrabold text-stone-300 mb-1.5 flex items-center gap-1.5">
                    <span>{isEn ? familyInfo.labelEn : familyInfo.labelFr}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {familyMoves.map((m) => {
                      const isSel = m.id === selectedId;
                      const keyword = isEn ? m.keywordEn : m.keywordFr;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          data-testid={`opening-roll-${m.id}`}
                          onClick={() => setSelectedId(m.id)}
                          className={`flex flex-col items-start px-2.5 py-1.5 rounded-lg border transition active:scale-95 text-left ${
                            isSel
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#b88924] border-[#F3E5AB] text-slate-950 shadow-md font-black'
                              : 'bg-white/[0.04] border-white/10 text-stone-200 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-xs font-black flex items-center gap-1.5">
                            <Dices className={`w-3.5 h-3.5 shrink-0 ${isSel ? 'text-slate-950' : 'text-[#D4AF37]'}`} strokeWidth={1.5} />
                            <span>{m.roll[0]} - {m.roll[1]}</span>
                          </span>
                          <span className={`text-xs leading-tight font-bold ${isSel ? 'text-slate-900' : 'text-amber-300/90'}`}>
                            {keyword}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Colonne droite : Plateau Visuel + Flèches Dorées + Commentaire du Professeur */}
          <div className="md:col-span-7 flex flex-col justify-between gap-2.5 rounded-xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#14120f] to-[#0a0d13] p-3">
            <div>
              {/* Titre du coup sélectionné & Bouton d'écoute vocale */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#f3d27a] font-black text-xs">
                    <Dices className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
                    <span>{currentMove.roll[0]} - {currentMove.roll[1]}</span>
                  </span>
                  <span className="text-xs font-black text-amber-200">
                    {isEn ? currentMove.titleEn : currentMove.titleFr}
                  </span>
                </div>
                <button
                  type="button"
                  data-testid="opening-voice-btn"
                  onClick={handleSpeak}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Listen' : 'Écouter'}</span>
                </button>
              </div>

              {/* Vrai Plateau Visuel (Sans chiffre de case, avec flèches dorées et animation) */}
              <div data-testid="opening-board-display" className="mt-1">
                <OpeningVisualBoard
                  moveFromTo={currentMove.moveFromTo}
                  isGate={currentMove.family === 'GATES'}
                  isEn={isEn}
                />
              </div>

              {/* Commentaire Bienveillant du Professeur (Sans chiffre de case) */}
              <div className="mt-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#D4AF37] mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{isEn ? 'Professor’s Advice:' : 'Le Conseil du Professeur :'}</span>
                </div>
                <p
                  data-testid="opening-explanation-text"
                  className="text-xs sm:text-sm text-neutral-100 leading-relaxed font-medium"
                >
                  {isEn ? currentMove.explanationEn : currentMove.explanationFr}
                </p>
              </div>
            </div>

            {/* Règle Mémotechnique Dorée */}
            <div className="text-xs text-stone-300 bg-white/[0.02] p-2 rounded-lg border border-white/5 font-medium">
              {isEn
                ? 'On the first move, creating a two-checker shield is always the top priority!'
                : 'Au premier coup, créer un bouclier à deux pions est toujours la priorité absolue !'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

BeginnerOpeningMovesExplorer.displayName = 'BeginnerOpeningMovesExplorer';
