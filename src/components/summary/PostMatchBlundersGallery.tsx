'use client';

/**
 * Section 2 du Rapport de Formation — Galerie interactive des erreurs majeures.
 *
 * Rôle :
 *   Affiche les Top 3 à 5 plus grosses erreurs du joueur (ΔEq > 0.020) :
 *     - Tour #, tirage de dés, coup joué (rouge) vs coup optimal (vert), ΔEq ;
 *     - explication tactique et phase de jeu ;
 *     - bouton « Revoir la position » qui révèle le plateau `boardBefore`.
 *
 * Composant 100 % muet (LOI 5) : l'état de révélation est local.
 *
 * Dépendances :
 *   `postMatchReportHelpers` (types + libellés).
 *
 * Retrait :
 *   Supprimer ce fichier et son usage dans `PostMatchTrainingReport.tsx`.
 */

import React, { useState } from 'react';
import { PHASE_LABELS, type MajorBlunder } from './postMatchReportHelpers';

export interface PostMatchBlundersGalleryProps {
    /** Erreurs majeures triées par gravité décroissante. */
    blunders: ReadonlyArray<MajorBlunder>;
    /** Langue d'affichage. */
    locale?: string;
}

/** Rendu compact d'un plateau (28 entiers) en grille de 24 flèches. */
function BoardPreview({ board }: { board: ReadonlyArray<number> }) {
    return (
        <div
            data-testid="blunder-board-preview"
            className="mt-2 grid grid-cols-12 gap-0.5 rounded-lg border border-slate-700/60 bg-slate-900/80 p-1.5"
        >
            {Array.from({ length: 24 }, (_, i) => i + 1).map((point) => {
                const value = board[point] ?? 0;
                const count = Math.abs(value);
                const isX = value > 0;
                return (
                    <div
                        key={point}
                        title={`Point ${point} : ${count} pion(s) ${isX ? 'X' : 'O'}`}
                        className={`flex h-5 flex-col items-center justify-center rounded text-[7px] font-mono leading-none ${count === 0
                            ? 'bg-slate-800/40 text-slate-600'
                            : isX
                                ? 'bg-slate-100 text-slate-900'
                                : 'bg-slate-700 text-slate-100'
                            }`}
                    >
                        <span className="opacity-60">{point}</span>
                        {count > 0 && <span className="font-bold">{count}</span>}
                    </div>
                );
            })}
        </div>
    );
}

const PostMatchBlundersGalleryComponent: React.FC<PostMatchBlundersGalleryProps> = ({
    blunders,
    locale = 'fr',
}) => {
    const isEn = locale === 'en';
    const [revealed, setRevealed] = useState<number | null>(null);

    return (
        <section
            data-testid="post-match-blunders-gallery"
            aria-label={isEn ? 'Major blunders gallery' : 'Galerie des erreurs majeures'}
            className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 space-y-2.5"
        >
            <header className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-300">
                    <span aria-hidden="true">🎯</span>
                    <span>{isEn ? 'Your blunders to fix' : 'Vos blunders à corriger'}</span>
                </h3>
                <span className="font-mono text-[10px] text-slate-500">
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
                <ul className="space-y-2">
                    {blunders.map((b, index) => {
                        const isRevealed = revealed === index;
                        return (
                            <li
                                key={`${b.turnNumber}-${b.playedNotation}`}
                                data-testid={`post-match-blunder-${index}`}
                                className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-2.5 space-y-1.5"
                            >
                                {/* En-tête : tour, dés, phase, ΔEq */}
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-300">
                                            {isEn ? 'Turn' : 'Tour'} #{b.turnNumber}
                                        </span>
                                        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-200">
                                            [{b.dice[0]}-{b.dice[1]}]
                                        </span>
                                        <span className="rounded bg-slate-800/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                                            {PHASE_LABELS[b.phase]}
                                        </span>
                                    </div>
                                    <span className="rounded-full border border-rose-700/60 bg-rose-950/60 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                                        ΔEq -{b.equityLoss.toFixed(3)}
                                    </span>
                                </div>

                                {/* Coup joué vs coup optimal */}
                                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                    <div className="rounded-lg border border-rose-800/60 bg-rose-950/30 px-2 py-1">
                                        <span className="block text-[8px] font-bold uppercase tracking-wider text-rose-400">
                                            {isEn ? 'Played' : 'Coup joué'}
                                        </span>
                                        <span className="block break-words font-mono text-[11px] font-bold text-rose-100">
                                            {b.playedNotation}
                                        </span>
                                    </div>
                                    <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-2 py-1">
                                        <span className="block text-[8px] font-bold uppercase tracking-wider text-emerald-400">
                                            {isEn ? 'Optimal' : 'Coup optimal'}
                                        </span>
                                        <span className="block break-words font-mono text-[11px] font-bold text-emerald-100">
                                            {b.optimalNotation}
                                        </span>
                                    </div>
                                </div>

                                {/* Explication tactique */}
                                {b.explanation && (
                                    <p className="text-[10px] leading-relaxed text-slate-300">
                                        {b.explanation}
                                    </p>
                                )}

                                {/* Bouton de revue de position */}
                                <button
                                    type="button"
                                    onClick={() => setRevealed(isRevealed ? null : index)}
                                    data-testid={`post-match-review-position-${index}`}
                                    aria-expanded={isRevealed}
                                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-indigo-500/50 bg-indigo-600/25 px-2.5 py-1 text-[10px] font-bold text-indigo-200 transition hover:bg-indigo-600/50 active:scale-95"
                                >
                                    <span aria-hidden="true">👁️</span>
                                    <span>
                                        {isRevealed
                                            ? isEn ? 'Hide position' : 'Masquer la position'
                                            : isEn ? 'Review position' : 'Revoir la position'}
                                    </span>
                                </button>

                                {isRevealed && <BoardPreview board={b.boardBefore} />}
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
