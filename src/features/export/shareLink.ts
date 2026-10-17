/**
 * Gestionnaire de liens de partage et téléchargement de fichiers (XGID / SGF).
 */

import { BoardState } from '../../engine/backgammonEngine';
import { serializeToXGID } from './xgidSerializer';

export function generateShareUrl(state: BoardState, customOrigin?: string): string {
    const xgid = serializeToXGID(state);
    const origin =
        customOrigin ||
        (typeof window !== 'undefined' && window.location ? window.location.origin : 'https://backgammon.app');
    return `${origin}/?xgid=${encodeURIComponent(xgid)}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

export function downloadFile(content: string, filename: string, mimeType = 'text/plain'): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
