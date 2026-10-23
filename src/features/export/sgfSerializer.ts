/**
 * Sérialiseur et parseur SGF (Smart Game Format) pour le Backgammon (GM[6]).
 *
 * Conforme aux spécifications SGF FF[4] Game 6 (Backgammon) :
 * - B = Joueur X, W = Joueur O
 * - Nœuds de coup : ;B[31]8/5 6/5 ou ;W[65]24/13
 */

import type { MatchExportData, ParsedSGFData, ParsedSGFMove } from './types';
import { formatMoveSequenceNotation } from '../../lib/engine/evaluator';

export function serializeToSGF(data: MatchExportData): string {
    const lines: string[] = [];
    lines.push('(;FF[4]GM[6]CA[UTF-8]AP[BackgammonTournament:1.0]');
    lines.push('SZ[24]');
    lines.push(`PB[${data.playerX || 'Joueur X'}]`);
    lines.push(`PW[${data.playerO || 'Joueur O'}]`);
    lines.push(`MI[length:${data.matchLength}][bs:${data.scoreX}][ws:${data.scoreO}]`);

    if (data.winner) {
        lines.push(`RE[${data.winner}+${data.pointsWon || 1}]`);
    }

    // Sérialisation des coups enregistrés
    if (data.turnsHistory) {
        for (const turn of data.turnsHistory) {
            const pTag = turn.player === 'X' ? 'B' : 'W';
            const diceStr = `${turn.dice[0]}${turn.dice[1]}`;
            const notation =
                turn.moves && turn.moves.length > 0
                    ? formatMoveSequenceNotation(turn.moves, turn.player)
                    : (turn as unknown as { playedNotation?: string }).playedNotation || '';
            lines.push(`;${pTag}[${diceStr}]${notation}`);
        }
    }

    lines.push(')');
    return lines.join('\n');
}

export function parseSGF(sgfContent: string): ParsedSGFData {
    if (!sgfContent || !sgfContent.includes('GM[6]')) {
        // Accepte également sans GM[6] si c'est un SGF bien formé
        if (!sgfContent || !sgfContent.trim().startsWith('(')) {
            throw new Error('Contenu SGF invalide : format non reconnu.');
        }
    }

    const pbMatch = sgfContent.match(/PB\[([^\]]*)\]/);
    const pwMatch = sgfContent.match(/PW\[([^\]]*)\]/);
    const reMatch = sgfContent.match(/RE\[([^\]]*)\]/);
    const miMatch = sgfContent.match(/MI\[[^\]]*length:(\d+)[^\]]*\]/);
    const bsMatch = sgfContent.match(/\[bs:(\d+)\]/);
    const wsMatch = sgfContent.match(/\[ws:(\d+)\]/);

    const playerX = pbMatch ? pbMatch[1] : 'Joueur X';
    const playerO = pwMatch ? pwMatch[1] : 'Joueur O';
    const result = reMatch ? reMatch[1] : undefined;
    const matchLength = miMatch ? parseInt(miMatch[1], 10) : 7;
    const scoreX = bsMatch ? parseInt(bsMatch[1], 10) : 0;
    const scoreO = wsMatch ? parseInt(wsMatch[1], 10) : 0;

    let winner: 'X' | 'O' | null = null;
    let pointsWon: number | undefined;
    if (result) {
        const resParts = result.match(/^([XOBW])(?:\+(\d+))?/i);
        if (resParts) {
            const wChar = resParts[1].toUpperCase();
            winner = wChar === 'X' || wChar === 'B' ? 'X' : 'O';
            pointsWon = resParts[2] ? parseInt(resParts[2], 10) : 1;
        }
    }

    // Extraction des nœuds de coups (;B[31]8/5 6/5 ou ;W[65]24/13)
    const moveRegex = /;([BW])\[(\d{2})\]([^;\)]*)/g;
    const moves: ParsedSGFMove[] = [];
    let match: RegExpExecArray | null;

    while ((match = moveRegex.exec(sgfContent)) !== null) {
        const player = match[1] === 'B' ? 'X' : 'O';
        const d1 = parseInt(match[2][0], 10);
        const d2 = parseInt(match[2][1], 10);
        const notation = match[3].trim();

        moves.push({
            player,
            dice: [d1, d2],
            notation,
        });
    }

    return {
        playerX,
        playerO,
        matchLength,
        scoreX,
        scoreO,
        winner,
        pointsWon,
        result,
        moves,
    };
}
