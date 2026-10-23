/**
 * Sérialiseur et parseur JellyFish / Backgammon Galaxy (.mat).
 *
 * Format standard `.mat` reconnu par eXtreme Gammon (XG2), GNU Backgammon,
 * Snowie 4 et Backgammon Galaxy :
 *
 * Exemple :
 *  7 point match
 *
 *  Game 1
 *  Alice : 3                   Bob : 2
 *   1) 31: 8/5 6/5             65: 24/13
 *   2) 42: 8/4 6/4
 *       Wins 2 points
 */

import type { MatchExportData, ParsedSGFData, ParsedSGFMove } from './types';
import { formatMoveSequenceNotation } from '../../lib/engine/evaluator';

/**
 * Sérialise les données d'un match au format texte standard JellyFish / Galaxy (`.mat`).
 */
export function serializeToMAT(data: MatchExportData): string {
    const playerX = (data.playerX || 'PlayerX').trim();
    const playerO = (data.playerO || 'PlayerO').trim();
    const matchLength = Math.max(0, data.matchLength ?? 7);
    const scoreX = Math.max(0, data.scoreX ?? 0);
    const scoreO = Math.max(0, data.scoreO ?? 0);

    const lines: string[] = [];
    lines.push(` ${matchLength} point match`);
    lines.push('');
    lines.push(' Game 1');

    const leftHeader = ` ${playerX} : ${scoreX}`;
    const rightHeader = `${playerO} : ${scoreO}`;
    lines.push(`${leftHeader.padEnd(32, ' ')}${rightHeader}`);

    const turns = data.turnsHistory ?? [];
    let rowNumber = 1;
    let i = 0;

    while (i < turns.length) {
        const current = turns[i];
        const rowPrefix = `${String(rowNumber).padStart(3, ' ')}) `;

        if (current.player === 'X') {
            const xNotation =
                current.moves && current.moves.length > 0
                    ? formatMoveSequenceNotation(current.moves, 'X')
                    : (current as unknown as { playedNotation?: string }).playedNotation || 'Cannot Move';
            const xToken = `${current.dice[0]}${current.dice[1]}: ${xNotation}`;

            const next = turns[i + 1];
            if (next && next.player === 'O') {
                const oNotation =
                    next.moves && next.moves.length > 0
                        ? formatMoveSequenceNotation(next.moves, 'O')
                        : (next as unknown as { playedNotation?: string }).playedNotation || 'Cannot Move';
                const oToken = `${next.dice[0]}${next.dice[1]}: ${oNotation}`;
                lines.push(`${rowPrefix}${xToken.padEnd(27, ' ')}${oToken}`);
                i += 2;
            } else {
                lines.push(`${rowPrefix}${xToken}`);
                i += 1;
            }
        } else {
            const oNotation =
                current.moves && current.moves.length > 0
                    ? formatMoveSequenceNotation(current.moves, 'O')
                    : (current as unknown as { playedNotation?: string }).playedNotation || 'Cannot Move';
            const oToken = `${current.dice[0]}${current.dice[1]}: ${oNotation}`;
            lines.push(`${rowPrefix}${' '.repeat(27)}${oToken}`);
            i += 1;
        }

        rowNumber += 1;
    }

    if (data.winner) {
        const pts = data.pointsWon ?? 1;
        const winText = `Wins ${pts} point${pts > 1 ? 's' : ''}`;
        if (data.winner === 'X') {
            lines.push(`      ${winText}`);
        } else {
            lines.push(`${' '.repeat(32)}${winText}`);
        }
    }

    return lines.join('\n');
}

/**
 * Parse un fichier `.mat` (JellyFish / Backgammon Galaxy) et restitue les métadonnées et les coups.
 */
export function parseMAT(matContent: string): ParsedSGFData {
    if (!matContent || !matContent.trim()) {
        throw new Error('Contenu MAT invalide : fichier vide.');
    }

    const lines = matContent.split(/\r?\n/);

    let matchLength = 7;
    let playerX = 'Joueur X';
    let playerO = 'Joueur O';
    let scoreX = 0;
    let scoreO = 0;
    let winner: 'X' | 'O' | null = null;
    let pointsWon: number | undefined;
    let foundHeaderOrMoves = false;

    const moves: ParsedSGFMove[] = [];

    for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        if (!line.trim()) continue;

        // 1. Longueur du match : " 7 point match"
        const matchLenMatch = line.match(/^\s*(\d+)\s+point\s+match/i);
        if (matchLenMatch) {
            matchLength = parseInt(matchLenMatch[1], 10);
            foundHeaderOrMoves = true;
            continue;
        }

        // 2. En-tête des joueurs et scores : " Alice : 3     Bob : 2"
        const scoreMatch = line.match(/^\s*([^:]+?)\s*:\s*(\d+)\s+([^:]+?)\s*:\s*(\d+)\s*$/);
        if (scoreMatch && !/^\s*\d+\)/.test(line)) {
            playerX = scoreMatch[1].trim();
            scoreX = parseInt(scoreMatch[2], 10);
            playerO = scoreMatch[3].trim();
            scoreO = parseInt(scoreMatch[4], 10);
            foundHeaderOrMoves = true;
            continue;
        }

        // 3. Ligne de victoire : "Wins X point(s)"
        const winMatch = line.match(/Wins\s+(\d+)\s+point/i);
        if (winMatch) {
            pointsWon = parseInt(winMatch[1], 10);
            const leadingSpaces = rawLine.match(/^(\s*)/)?.[1].length ?? 0;
            winner = leadingSpaces >= 20 ? 'O' : 'X';
            foundHeaderOrMoves = true;
            continue;
        }

        // 4. Ligne de coup numérotée : "  1) 31: 8/5 6/5             65: 24/13"
        const turnLineMatch = line.match(/^\s*\d+\)\s*(.*)$/);
        if (turnLineMatch) {
            foundHeaderOrMoves = true;
            const body = turnLineMatch[1];
            const leadingBodySpaces = line.replace(/^\s*\d+\)/, '').match(/^(\s*)/)?.[1].length ?? 0;

            // Extraction de toutes les séquences "<d1><d2>: <notation>" présentes sur la ligne
            const moveTokens = Array.from(
                body.matchAll(/([1-6])([1-6]):\s*([^\s]+(?:\s+(?![1-6][1-6]:)[^\s]+)*)/g),
            );

            if (moveTokens.length === 2) {
                const m1 = moveTokens[0];
                const m2 = moveTokens[1];
                moves.push({
                    player: 'X',
                    dice: [parseInt(m1[1], 10), parseInt(m1[2], 10)],
                    notation: m1[3].trim(),
                });
                moves.push({
                    player: 'O',
                    dice: [parseInt(m2[1], 10), parseInt(m2[2], 10)],
                    notation: m2[3].trim(),
                });
            } else if (moveTokens.length === 1) {
                const m1 = moveTokens[0];
                const player: 'X' | 'O' = leadingBodySpaces >= 15 ? 'O' : 'X';
                moves.push({
                    player,
                    dice: [parseInt(m1[1], 10), parseInt(m1[2], 10)],
                    notation: m1[3].trim(),
                });
            }
        }
    }

    if (!foundHeaderOrMoves) {
        throw new Error('Contenu MAT invalide : aucune structure de match reconnue.');
    }

    return {
        playerX,
        playerO,
        matchLength,
        scoreX,
        scoreO,
        winner,
        pointsWon,
        result: winner ? `${winner}+${pointsWon ?? 1}` : undefined,
        moves,
    };
}
