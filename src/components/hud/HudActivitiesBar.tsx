'use client';

/**
 * Barre secondaire repliable d'activités (Multijoueur, Drills, Puzzles, Progression, Coach, Ouvertures).
 *
 * Rôle :
 *   Fournit des accès rapides aux modes d'entraînement et d'apprentissage sans surcharger
 *   le HUD principal.
 *
 * Dépendances :
 *   Ne dépend que de ses props, aucune logique métier embarquée.
 *
 * Retrait :
 *   Supprimer ce fichier et son appel dans `MatchHud.tsx`.
 */

import React from 'react';

export interface HudActivitiesBarProps {
    /** Indique si la barre d'activités est dépliée */
    isExpanded: boolean;
    /** Ferme ou replie la barre d'activités */
    onClose: () => void;
    /** Ouvre la modale de matchmaking multijoueur */
    onOpenMultiplayer?: () => void;
    /** Indique si une partie multijoueur est active */
    isMultiplayerActive?: boolean;
    /** Déclenche une demande d'analyse ou conseil au coach */
    onTriggerCoach?: () => void;
    /** Ouvre la bibliothèque d'ouvertures (Opening Book) */
    onOpenOpeningBook?: () => void;
    /** Ouvre l'encyclopédie théorique du backgammon */
    onOpenKnowledgeBase?: () => void;
}

const HudActivitiesBarComponent: React.FC<HudActivitiesBarProps> = ({
    isExpanded,
    onClose,
    onOpenMultiplayer,
    isMultiplayerActive = false,
    onTriggerCoach,
    onOpenOpeningBook,
    onOpenKnowledgeBase,
}) => {
    return (
        <div
            data-testid="hud-secondary-nav"
            className={`transition-all duration-200 ${
                isExpanded ? 'flex' : 'hidden'
            } flex-wrap items-center justify-between gap-1.5 sm:gap-2 pt-2 border-t border-slate-800/80`}
        >
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {onOpenMultiplayer && (
                    <button
                        type="button"
                        onClick={onOpenMultiplayer}
                        data-testid="multiplayer-hud-trigger"
                        title="Lancer le Matchmaking Multijoueur Elo en ligne"
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                            isMultiplayerActive
                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40 animate-pulse'
                                : 'border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 hover:border-amber-400 hover:bg-amber-500/30'
                        }`}
                    >
                        <span>⚡</span>
                        <span>{isMultiplayerActive ? 'En Direct' : 'Multijoueur'}</span>
                    </button>
                )}

                <a
                    href="/drills"
                    title="Rejouer vos erreurs passées jusqu'à trouver le coup optimal certifié"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm"
                    data-testid="drills-hud-link"
                >
                    <span>🎯</span>
                    <span>Drills</span>
                </a>

                <a
                    href="/puzzles"
                    title="Résoudre le puzzle tactique du jour certifié GNUBG et cultiver votre série"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm"
                    data-testid="puzzles-hud-link"
                >
                    <span>🧩</span>
                    <span>Puzzles</span>
                </a>

                <a
                    href="/progression"
                    title="Consulter le Performance Rating (PR) et les concepts stratégiques à travailler"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm"
                >
                    <span>📊</span>
                    <span>Progression</span>
                </a>

                {onTriggerCoach && (
                    <button
                        type="button"
                        onClick={onTriggerCoach}
                        data-testid="coach-hud-trigger"
                        title="Demander conseil au Coach en temps réel"
                        className="flex items-center gap-1.5 rounded-xl border border-indigo-500/60 bg-indigo-950/40 px-2.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/60 hover:text-white transition shadow-sm"
                    >
                        <span>🎓</span>
                        <span>Coach</span>
                    </button>
                )}

                {onOpenOpeningBook && (
                    <button
                        type="button"
                        onClick={onOpenOpeningBook}
                        title="Consulter la Bibliothèque d'Ouvertures (Opening Book certifié XG++)"
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-700/60 bg-emerald-950/40 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60 hover:text-white transition shadow-sm"
                        data-testid="opening-book-hud-btn"
                    >
                        <span>📖</span>
                        <span>Ouvertures</span>
                    </button>
                )}

                {onOpenKnowledgeBase && (
                    <button
                        type="button"
                        onClick={onOpenKnowledgeBase}
                        title="Consulter l'Encyclopédie & Base de Connaissances Théorique"
                        className="flex items-center gap-1.5 rounded-xl border border-blue-600/60 bg-blue-950/40 px-2.5 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-900/60 hover:text-white transition shadow-sm"
                        data-testid="knowledge-base-hud-btn"
                    >
                        <span>📚</span>
                        <span>Théorie</span>
                    </button>
                )}
            </div>

            <button
                type="button"
                onClick={onClose}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 transition flex items-center gap-1"
                title="Replier la barre secondaire d'activités"
            >
                <span>▲</span>
                <span>Replier</span>
            </button>
        </div>
    );
};

export const HudActivitiesBar = React.memo(HudActivitiesBarComponent);
export default HudActivitiesBar;
