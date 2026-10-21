'use client';

/**
 * Cartes joueurs du HUD supérieur (style table de tournoi XG / Extreme Gammon).
 *
 * Rôle :
 *   Affiche, pour chaque joueur, une carte dense et lisible :
 *   pion 3D + nom + score + badge PR en direct + pip count.
 *   Aucun calcul métier : les valeurs arrivent prêtes à afficher.
 *
 * Dépendances :
 *   `Player` (type).
 *
 * Retrait :
 *   Supprimer ce fichier et son appel dans `MatchHud.tsx`.
 */

import React from 'react';
import type { Player } from '../../engine/backgammonEngine';

export interface HudScoreboardProps {
    /** Longueur du match en points (0 = partie d'argent) */
    matchLength: number;
    /** Score du joueur X */
    scoreX: number;
    /** Score du joueur O */
    scoreO: number;
    /** Joueur au tour */
    turn: Player;
    /** Règle de Crawford active */
    crawford?: boolean;
    /** Dés du tour ou null */
    dice: [number, number] | null;
    /** État d'utilisation des dés */
    usedDice: [boolean, boolean] | boolean[];
    /** Handler pour relancer les dés */
    onRollDice?: () => void;
    /** Performance Rating (PR) Joueur X */
    prX?: number | null;
    /** Performance Rating (PR) Joueur O */
    prO?: number | null;
    /** Statut de réflexion ou tour de l'IA */
    isAiThinking?: boolean;
    /** Pip count du joueur X */
    pipX?: number | null;
    /** Pip count du joueur O */
    pipO?: number | null;
    /** Libellé de l'adversaire (ex. « IA Maître ») */
    opponentLabel?: string;
}

/**
 * Couleur du badge PR selon la qualité (plus bas = meilleur).
 * Rendu « Glow » : bordure colorée + halo externe subtil + fond teinté.
 */
function prBadgeClass(pr: number | null | undefined): string {
    if (pr === null || pr === undefined) {
        return 'border-slate-600/60 bg-slate-800/60 text-slate-400';
    }
    if (pr <= 3) {
        return 'border-emerald-400/70 bg-emerald-500/15 text-emerald-200 shadow-[0_0_10px_rgba(52,211,153,0.45)]';
    }
    if (pr <= 7) {
        return 'border-amber-400/70 bg-amber-500/15 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.45)]';
    }
    return 'border-rose-400/70 bg-rose-500/15 text-rose-200 shadow-[0_0_10px_rgba(251,113,133,0.45)]';
}

interface PlayerCardProps {
    isWhite: boolean;
    name: string;
    score: number;
    isTurn: boolean;
    pr?: number | null;
    pip?: number | null;
    testId: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
    isWhite,
    name,
    score,
    isTurn,
    pr,
    pip,
    testId,
}) => (
    <div
        data-testid={testId}
        title={`${name} — Score : ${score}${isTurn ? ' — Au tour' : ''}`}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 transition-all ${isTurn
            ? 'bg-slate-900/90 ring-1 ring-blue-400/80 shadow-[0_0_14px_rgba(96,165,250,0.35)]'
            : 'bg-slate-900/60 ring-1 ring-slate-700/60 opacity-85'
            }`}
    >
        {/* Pion 3D */}
        <span
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 rounded-full ${isWhite
                ? 'bg-[radial-gradient(circle_at_32%_28%,#ffffff_0%,#e2e8f0_45%,#94a3b8_100%)] ring-1 ring-slate-400 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.35)]'
                : 'bg-[radial-gradient(circle_at_32%_28%,#52525b_0%,#27272a_44%,#08080a_100%)] ring-1 ring-slate-600 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.8)]'
                }`}
        />
        <div className="hidden sm:flex flex-col leading-none min-w-0">
            <span className="text-[11px] font-bold text-slate-100 whitespace-nowrap">{name}</span>
            <span className="text-[9px] text-slate-400 whitespace-nowrap">
                {pip !== null && pip !== undefined ? `${pip} pips` : '— pips'}
            </span>
        </div>
        <span className="ml-0.5 text-sm font-black text-white">{score}</span>
        <span
            data-testid={`${testId}-pr`}
            title="Performance Rating en direct (plus bas = meilleur)"
            className={`hidden sm:inline ml-0.5 rounded border px-1 py-0.5 font-mono text-[9px] font-bold transition-shadow duration-300 ${prBadgeClass(pr)}`}
        >
            PR {pr !== null && pr !== undefined ? pr.toFixed(1) : '--'}
        </span>
    </div>
);

const HudScoreboardComponent: React.FC<HudScoreboardProps> = ({
    matchLength,
    scoreX,
    scoreO,
    turn,
    crawford = false,
    prX,
    prO,
    isAiThinking = false,
    pipX,
    pipO,
    opponentLabel = 'IA',
}) => {
    const isXTurn = turn === 'X';
    const isOTurn = turn === 'O' || isAiThinking;

    return (
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            {/* Format du match & Badge Crawford */}
            <div className="hidden sm:flex flex-col text-[10px] leading-tight text-slate-400">
                <span className="font-semibold text-slate-300 whitespace-nowrap">
                    {matchLength > 0 ? `Match ${matchLength} pts` : 'Money Game'}
                </span>
                {crawford && (
                    <span className="mt-0.5 w-max rounded bg-amber-500/20 px-1.5 text-[9px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/40">
                        Crawford
                    </span>
                )}
            </div>

            <PlayerCard
                isWhite
                name="X (Vous - Blanc)"
                score={scoreX}
                isTurn={isXTurn}
                pr={prX}
                pip={pipX}
                testId="hud-player-x"
            />

            <span className="text-[10px] font-extrabold text-slate-500">VS</span>

            <PlayerCard
                isWhite={false}
                name={`O (${opponentLabel} - Noir)`}
                score={scoreO}
                isTurn={isOTurn}
                pr={prO}
                pip={pipO}
                testId="hud-player-o"
            />
        </div>
    );
};

export const HudScoreboard = React.memo(HudScoreboardComponent);
export default HudScoreboard;
