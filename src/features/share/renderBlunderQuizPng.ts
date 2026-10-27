/**
 * Moteur de rendu Canvas 2D client pour le générateur viral HD (1200x630).
 * Conforme à SCALABILITY.md (< 300 lignes, 0 any, rendu autonome pur sans dépendance).
 */

import type { BlunderQuizCardData } from './blunderShareCard';
import { getViralQuizHeadline, getViralQuizSubheadline, formatEquityLoss } from './blunderShareCard';
import { DIE_PIPS } from '../../components/board/miniBoardGeometry';

const W = 1200;
const H = 630;

function drawDie(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, value: number): void {
    ctx.save();
    ctx.fillStyle = '#FFFDF5';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 8);
    ctx.fill();
    ctx.stroke();

    const pips = DIE_PIPS[Math.min(6, Math.max(1, value))] || [];
    const r = size * 0.085;
    const center = size / 2;
    ctx.fillStyle = '#1A0F05';
    for (const [px, py] of pips) {
        ctx.beginPath();
        ctx.arc(x + center + px * (size * 0.65), y + center + py * (size * 0.65), r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawChecker(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, isX: boolean, countLabel?: number): void {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (isX) {
        const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(1, '#D9CEB4');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#8C733E';
    } else {
        const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
        grad.addColorStop(0, '#2C3440');
        grad.addColorStop(1, '#0B0F14');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#6B7280';
    }
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    if (countLabel && countLabel > 5) {
        ctx.fillStyle = isX ? '#1C130B' : '#FDF8EB';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(countLabel), cx, cy);
    }
    ctx.restore();
}

function drawBoardField(ctx: CanvasRenderingContext2D, data: BlunderQuizCardData): void {
    const fx = 35;
    const fy = 92;
    const fw = W - 70;
    const fh = 485;

    // Cadre extérieur luxueux
    ctx.fillStyle = '#140D08';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(fx, fy, fw, fh, 16);
    ctx.fill();
    ctx.stroke();

    // Feutre émeraude Monte-Carlo
    const pad = 12;
    const bx = fx + pad;
    const by = fy + pad;
    const bw = fw - pad * 2;
    const bh = fh - pad * 2;
    ctx.fillStyle = '#0B231A';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 10);
    ctx.fill();

    const trayW = 50;
    const barW = 44;
    const playAreaW = bw - trayW - barW;
    const quadW = playAreaW / 2;
    const ptW = quadW / 6;
    const ptH = 185;

    const leftX = bx;
    const barX = bx + quadW;
    const rightX = barX + barW;
    const trayX = bx + bw - trayW;

    // Barre centrale
    ctx.fillStyle = '#071610';
    ctx.fillRect(barX, by, barW, bh);

    // Plateau bear-off tray
    ctx.fillStyle = '#081912';
    ctx.fillRect(trayX, by, trayW, bh);

    const b = data.board;
    const r = Math.min(ptW * 0.42, 17);

    // 24 Flèches
    for (let i = 0; i < 12; i++) {
        const isLeft = i < 6;
        const colIdx = isLeft ? i : i - 6;
        const px = isLeft ? leftX + colIdx * ptW : rightX + colIdx * ptW;

        // Flèche Haut (13..18 à gauche, 19..24 à droite)
        const ptTopNum = isLeft ? 13 + colIdx : 19 + colIdx;
        const isAltTop = ptTopNum % 2 === 0;
        ctx.fillStyle = isAltTop ? '#0E2F23' : '#8C733E';
        ctx.beginPath();
        ctx.moveTo(px, by);
        ctx.lineTo(px + ptW, by);
        ctx.lineTo(px + ptW / 2, by + ptH);
        ctx.closePath();
        ctx.fill();

        // Flèche Bas (12..7 à gauche, 6..1 à droite)
        const ptBotNum = isLeft ? 12 - colIdx : 6 - colIdx;
        const isAltBot = ptBotNum % 2 === 0;
        ctx.fillStyle = isAltBot ? '#0E2F23' : '#8C733E';
        ctx.beginPath();
        ctx.moveTo(px, by + bh);
        ctx.lineTo(px + ptW, by + bh);
        ctx.lineTo(px + ptW / 2, by + bh - ptH);
        ctx.closePath();
        ctx.fill();

        // Numéros de flèches
        ctx.fillStyle = '#D4AF37';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(ptTopNum), px + ptW / 2, by + 12);
        ctx.fillText(String(ptBotNum), px + ptW / 2, by + bh - 4);

        // Pions flèche haut
        const topVal = b[ptTopNum] ?? 0;
        const topCount = Math.abs(topVal);
        const isTopX = topVal > 0;
        for (let s = 0; s < Math.min(topCount, 5); s++) {
            const cy = by + 26 + s * (r * 1.85);
            drawChecker(ctx, px + ptW / 2, cy, r, isTopX, s === 4 && topCount > 5 ? topCount : undefined);
        }

        // Pions flèche bas
        const botVal = b[ptBotNum] ?? 0;
        const botCount = Math.abs(botVal);
        const isBotX = botVal > 0;
        for (let s = 0; s < Math.min(botCount, 5); s++) {
            const cy = by + bh - 24 - s * (r * 1.85);
            drawChecker(ctx, px + ptW / 2, cy, r, isBotX, s === 4 && botCount > 5 ? botCount : undefined);
        }
    }

    // Pions sur la barre
    const barXCount = Math.max(0, b[0] ?? 0);
    const barOCount = Math.max(0, Math.abs(b[25] ?? 0));
    for (let s = 0; s < Math.min(barXCount, 4); s++) {
        drawChecker(ctx, barX + barW / 2, by + bh / 2 + 30 + s * 28, r, true, s === 3 && barXCount > 4 ? barXCount : undefined);
    }
    for (let s = 0; s < Math.min(barOCount, 4); s++) {
        drawChecker(ctx, barX + barW / 2, by + bh / 2 - 30 - s * 28, r, false, s === 3 && barOCount > 4 ? barOCount : undefined);
    }

    // Dés dans la rivière centrale
    const diceSize = 48;
    const riverY = by + bh / 2 - diceSize / 2;
    drawDie(ctx, barX - quadW / 2 - diceSize - 6, riverY, diceSize, data.dice[0]);
    drawDie(ctx, barX - quadW / 2 + 6, riverY, diceSize, data.dice[1]);
}

/**
 * Dessine la bannière supérieure, les titres et la signature sur le Canvas.
 */
function drawBannerAndFooter(ctx: CanvasRenderingContext2D, data: BlunderQuizCardData): void {
    // Fond général
    ctx.fillStyle = '#050806';
    ctx.fillRect(0, 0, W, H);

    // Bandeau supérieur
    ctx.fillStyle = '#0D131C';
    ctx.fillRect(0, 0, W, 86);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 86);
    ctx.lineTo(W, 86);
    ctx.stroke();

    // Titre viral
    ctx.fillStyle = '#FDF8EB';
    ctx.font = '900 22px serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⚜ ${getViralQuizHeadline(data)}`, 40, 36);

    // Sous-titre
    ctx.fillStyle = '#E2D9C8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(getViralQuizSubheadline(data), 40, 64);

    // Solution optionnelle
    if (data.includeSolution && data.bestMoveNotation) {
        const solText = `✓ BEST: ${data.bestMoveNotation}${data.equityLoss ? ` (${formatEquityLoss(data.equityLoss)})` : ''}`;
        ctx.fillStyle = '#F3C65F';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(solText, W - 40, 48);
    }

    // Pied de page luxueux
    ctx.fillStyle = '#8E794D';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('⚜ Cercle Monte-Carlo', 40, 606);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#D4AF37';
    ctx.fillText('Backgammon Tour • AI Grandmaster Coach', W - 40, 606);
}

/**
 * Génère en Canvas 2D pur une image PNG HD 1200x630.
 */
export async function renderBlunderQuizPng(data: BlunderQuizCardData): Promise<Blob> {
    if (typeof document === 'undefined') {
        throw new Error('Canvas 2D rendering requires browser environment.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Impossible d’initialiser le contexte Canvas 2D.');

    drawBannerAndFooter(ctx, data);
    drawBoardField(ctx, data);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Échec de la génération du Blob PNG'));
        }, 'image/png');
    });
}

/**
 * Télécharge un fichier Blob PNG en 1 clic.
 */
export function downloadBlunderQuizPng(blob: Blob, filename = 'backgammon-quiz.png'): void {
    if (typeof document === 'undefined') return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
