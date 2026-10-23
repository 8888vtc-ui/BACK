'use client';

/**
 * Section 2 du Rapport de Formation — Galerie interactive des erreurs majeures avec MiniBoardDiagram.
 *
 * Rôle :
 *   Affiche les Top 3 à 5 plus grosses erreurs du joueur (ΔEq > 0.020) :
 *     - Tour #, tirage de dés en grand, coup joué (rouge) vs coup optimal (vert), ΔEq & badge de sévérité ;
 *     - explication tactique du Coach (🎯 Diagnostic + 💡 Concept Clé) avec lecture vocale (`useCoachVoice`) ;
 *     - bouton « Revoir la position » qui révèle le `MiniBoardDiagram` avec flèches comparatives ;
 *     - bouton « Rejouer ce coup » (mode puzzle interactif où le joueur retrouve le meilleur coup).
 *
 * Dépendances :
 *   `postMatchReportHelpers`, `MiniBoardDiagram`, `useCoachVoice`.
 */

import React, { useState } from 'react';
import MiniBoardDiagram from '../board/MiniBoardDiagram';
import { useCoachVoice } from '../../hooks/useCoachVoice';
import {
    classifyMoveByEquityLoss,
    PHASE_LABELS,
    PHASE_LABELS_EN,
    REPORT_CATEGORY_META,
    type MajorBlunder,
} from './postMatchReportHelpers';

export interface PostMatchBlundersGalleryProps {
    /** Erreurs majeures triées par gravité décroissante. */
    blunders: ReadonlyArray<MajorBlunder>;
    /** Langue d'affichage. */
    locale?: string;
}

const PostMatchBlundersGalleryComponent: React.FC<PostMatchBlundersGalleryProps> = ({
    blunders,
    locale = 'fr',
}) => {
    const isEn = locale === 'en';
    const [revealed, setRevealed] = useState<number | null>(0);
    const [replayingIdx, setReplayingIdx] = useState<number | null>(null);
    const [selectedGuess, setSelectedGuess] = useState<string | null>(null);
    const { speakExplanation } = useCoachVoice();

    return (
        <section
            data-testid="post-match-blunders-gallery"
            aria-label={isEn ? 'Major blunders gallery' : 'Galerie des erreurs majeures'}
            className="rounded-2xl border border-[#d4af37]/35 bg-[#120a05]/90 p-4 space-y-2.5"
        >
            <header className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2">
                <h3 className="flex items-center gap-1.5 font-serif text-xs font-black uppercase tracking-wider text-[#f3c65f]">
                    <span aria-hidden="true">🎯</span>
                    <span>
                        {isEn ? 'Key Moments & Blunders to Fix' : 'Moments Clés & Gaffes à corriger'}
                    </span>
                </h3>
                <span className="font-mono text-[10px] text-[#e8dcc6]/65">
                    {blunders.length} {isEn ? 'found' : 'détecté(s)'}
                </span>
            </header>

            {blunders.length === 0 ? (
                <p
                    data-testid="post-match-no-blunders"
                    className="rounded-lg border border-emerald-800/50 bg-emerald-950/25 p-3 text-[11px] leading-relaxed text-emerald-200"
                >
                    {isEn
                        ? 'No major blunder (ΔEq > 0.020) in this game. Excellent discipline!'
                        : 'Aucune erreur majeure (ΔEq > 0.020) sur cette partie. Excellente discipline !'}
                </p>
            ) : (
                <ul className="space-y-2.5">
                    {blunders.map((b, index) => {
                        const isRevealed = revealed === index;
                        const isReplaying = replayingIdx === index;
                        const isSolved = selectedGuess === b.optimalNotation;
                        const cat = b.category ?? classifyMoveByEquityLoss(b.equityLoss, b.cubeEquityLoss);
                        const meta = REPORT_CATEGORY_META[cat];
                        const phaseLabel = isEn ? PHASE_LABELS_EN[b.phase] : PHASE_LABELS[b.phase];
                        const choices =
                            index % 2 === 0
                                ? [b.optimalNotation, b.playedNotation]
                                : [b.playedNotation, b.optimalNotation];

                        return (
                            <li
                                key={`${b.turnNumber}-${b.playedNotation}-${index}`}
                                data-testid={`post-match-blunder-${index}`}
                                className="rounded-xl border border-[#d4af37]/30 bg-[#1a0f08]/90 p-3 space-y-2"
                            >
                                {/* En-tête : tour, dés en grand, phase, badge de sévérité ΔEq */}
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-lg border border-[#d4af37]/40 bg-[#28170b] px-2 py-0.5 font-mono text-[11px] font-black text-[#fdf8eb]">
                                            {isEn ? 'Turn' : 'Tour'} #{b.turnNumber}
                                        </span>
                                        <span
                                            className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37] bg-[#fdf8eb] px-2 py-0.5 font-mono text-xs font-black text-[#1a0f07] shadow-sm"
                                            title={isEn ? 'Dice roll' : 'Jet de dés'}
                                        >
                                            🎲 [{b.dice[0]}-{b.dice[1]}]
                                        </span>
                                        <span className="rounded bg-[#120904] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#f3c65f]/85">
                                            {phaseLabel}
                                        </span>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold ${meta.badgeClass}`}
                                    >
                                        <span aria-hidden="true">{meta.icon}</span>
                                        <span>ΔEq -{b.equityLoss.toFixed(3)}</span>
                                        <span className="font-sans text-[9px] opacity-90">
                                            ({isEn ? meta.shortEn : meta.shortFr})
                                        </span>
                                    </span>
                                </div>

                                {/* Coup joué vs coup optimal */}
                                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                    <div className="rounded-lg border border-rose-800/60 bg-rose-950/30 px-2.5 py-1.5">
                                        <span className="block text-[8px] font-bold uppercase tracking-wider text-rose-400">
                                            🔴 {isEn ? 'Played (dashed red)' : 'Coup joué (rouge pointillé)'}
                                        </span>
                                        <span className="block break-words font-mono text-[11px] font-bold text-rose-100">
                                            {b.playedNotation}
                                        </span>
                                    </div>
                                    <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-2.5 py-1.5">
                                        <span className="block text-[8px] font-bold uppercase tracking-wider text-emerald-400">
                                            🟢 {isEn ? 'Optimal (solid green/gold)' : 'Coup optimal (vert/or plein)'}
                                        </span>
                                        <span className="block break-words font-mono text-[11px] font-bold text-emerald-100">
                                            {isReplaying && !isSolved ? '???' : b.optimalNotation}
                                        </span>
                                    </div>
                                </div>

                                {/* Explication tactique du Coach */}
                                {(b.diagnostic || b.explanation) && (
                                    <div className="space-y-1 rounded-lg border border-[#d4af37]/20 bg-[#120a05] p-2 text-[10px] leading-relaxed text-[#e8dcc6]">
                                        <p>
                                            <strong className="text-[#f3c65f]">🎯 Diagnostic : </strong>
                                            {b.diagnostic ?? b.explanation}
                                        </p>
                                        {b.keyConcept && (
                                            <p className="text-emerald-200/90">
                                                <strong className="text-emerald-300">💡 Concept Clé : </strong>
                                                {b.keyConcept}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Barre d'actions : Revoir la position, Rejouer ce coup, Écouter */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRevealed(isRevealed ? null : index)}
                                        data-testid={`post-match-review-position-${index}`}
                                        aria-expanded={isRevealed}
                                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[#d4af37]/50 bg-[#26160c] px-2.5 py-1 text-[10px] font-bold text-[#fce8b2] transition hover:border-[#f3c65f] active:scale-95"
                                    >
                                        <span aria-hidden="true">👁️</span>
                                        <span>
                                            {isRevealed
                                                ? isEn
                                                    ? 'Hide diagram'
                                                    : 'Masquer le diagramme'
                                                : isEn
                                                  ? 'Review position'
                                                  : 'Revoir la position'}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRevealed(index);
                                            setReplayingIdx(isReplaying ? null : index);
                                            setSelectedGuess(null);
                                        }}
                                        data-testid={`post-match-replay-move-${index}`}
                                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-950/40 px-2.5 py-1 text-[10px] font-bold text-amber-200 transition hover:bg-amber-900/50 active:scale-95"
                                    >
                                        <span aria-hidden="true">🎯</span>
                                        <span>
                                            {isReplaying
                                                ? isEn
                                                    ? 'Close puzzle'
                                                    : 'Fermer le puzzle'
                                                : isEn
                                                  ? 'Replay this move'
                                                  : 'Rejouer ce coup'}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            speakExplanation(
                                                `${b.diagnostic ?? b.explanation ?? ''} ${b.keyConcept ?? ''}`,
                                                locale,
                                                true,
                                            )
                                        }
                                        data-testid={`post-match-speak-blunder-${index}`}
                                        className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[#d4af37]/30 bg-[#140b06] px-2.5 py-1 text-[10px] font-semibold text-[#e8dcc6] transition hover:border-[#f3c65f]"
                                    >
                                        <span aria-hidden="true">🔊</span>
                                        <span>{isEn ? 'Coach Voice' : 'Voix Coach'}</span>
                                    </button>
                                </div>

                                {/* Mode interactif "Rejouer ce coup" */}
                                {isReplaying && (
                                    <div
                                        data-testid={`post-match-puzzle-box-${index}`}
                                        className="rounded-lg border border-amber-500/45 bg-amber-950/25 p-2.5 space-y-2"
                                    >
                                        <p className="text-[10px] font-bold text-amber-200">
                                            🎯{' '}
                                            {isEn
                                                ? `Find the optimal move for [${b.dice[0]}-${b.dice[1]}]:`
                                                : `Trouvez le meilleur coup avec [${b.dice[0]}-${b.dice[1]}] :`}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {choices.map((choice) => (
                                                <button
                                                    key={choice}
                                                    type="button"
                                                    onClick={() => setSelectedGuess(choice)}
                                                    className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold transition ${
                                                        selectedGuess === choice
                                                            ? choice === b.optimalNotation
                                                                ? 'border-emerald-400 bg-emerald-600 text-white'
                                                                : 'border-rose-400 bg-rose-600 text-white'
                                                            : 'border-[#d4af37]/40 bg-[#180e08] text-[#fdf8eb] hover:border-[#f3c65f]'
                                                    }`}
                                                >
                                                    {choice}
                                                </button>
                                            ))}
                                        </div>
                                        {selectedGuess && (
                                            <p
                                                className={`text-[10px] font-bold ${
                                                    isSolved ? 'text-emerald-300' : 'text-rose-300'
                                                }`}
                                            >
                                                {isSolved
                                                    ? isEn
                                                        ? `✅ Correct! ${b.optimalNotation} is the optimal engine move.`
                                                        : `✅ Bravo ! ${b.optimalNotation} est le coup optimal certifié.`
                                                    : isEn
                                                      ? `❌ Not quite: ${b.optimalNotation} was optimal.`
                                                      : `❌ Ce coup perd -${b.equityLoss.toFixed(3)} Eq. Le coup optimal est ${b.optimalNotation}.`}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Diagramme Mini-Board avec flèches comparatives */}
                                {isRevealed && (
                                    <div data-testid="blunder-board-preview" className="pt-1">
                                        <MiniBoardDiagram
                                            board={b.boardBefore}
                                            dice={b.dice}
                                            turn={b.player ?? 'X'}
                                            playedMove={b.playedNotation}
                                            optimalMove={b.optimalNotation}
                                            hideOptimalArrow={isReplaying && !isSolved}
                                            locale={locale}
                                        />
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const PostMatchBlundersGallery = React.memo(PostMatchBlundersGalleryComponent);
export default PostMatchBlundersGallery;
