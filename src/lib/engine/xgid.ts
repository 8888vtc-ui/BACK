/**
 * Module d'import et export au format XGID (eXtreme Gammon / GNU Backgammon standard).
 * Respecte strictement SCALABILITY.md (< 400 lignes, 0 any).
 */

import {
    serializeXGID as engineSerializeXGID,
    serializeCanonicalXGID as engineSerializeCanonicalXGID,
    parseXGID as engineParseXGID,
    type BoardState,
} from '../../engine/backgammonEngine';

/**
 * Sérialise un état de plateau en chaîne XGID standard.
 */
export function serializeXGID(state: BoardState): string {
    return engineSerializeXGID(state);
}

/**
 * Sérialise un état de plateau en chaîne XGID canonique eXtreme Gammon (10 champs).
 */
export function serializeCanonicalXGID(state: BoardState): string {
    return engineSerializeCanonicalXGID(state);
}

/**
 * Parse une chaîne XGID (avec ou sans préfixe 'XGID=') en BoardState valide.
 * Lève une erreur explicite si le format est corrompu ou incomplet.
 */
export function parseXGID(xgidString: string): BoardState {
    const trimmed = xgidString.trim();
    if (!trimmed) {
        throw new Error('Chaîne XGID vide.');
    }
    const normalized = trimmed.startsWith('XGID=') ? trimmed : `XGID=${trimmed}`;
    return engineParseXGID(normalized);
}

/**
 * Vérifie si une chaîne donnée représente un XGID syntaxiquement valide.
 */
export function isValidXGID(xgidString: string): boolean {
    if (!xgidString || typeof xgidString !== 'string') return false;
    try {
        parseXGID(xgidString);
        return true;
    } catch {
        return false;
    }
}

export const serializeToXGID = serializeXGID;
