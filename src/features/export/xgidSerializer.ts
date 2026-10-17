/**
 * Sérialiseur et parseur XGID (eXtreme Gammon / GNU Backgammon standard).
 */

import {
    serializeXGID as engineSerializeXGID,
    parseXGID as engineParseXGID,
    BoardState,
} from '../../engine/backgammonEngine';

export function serializeToXGID(state: BoardState): string {
    return engineSerializeXGID(state);
}

export function parseFromXGID(xgidString: string): BoardState {
    const trimmed = xgidString.trim();
    if (!trimmed.startsWith('XGID=')) {
        // Tente d'ajouter le préfixe si absent
        return engineParseXGID(`XGID=${trimmed}`);
    }
    return engineParseXGID(trimmed);
}

export function isValidXGID(xgidString: string): boolean {
    try {
        parseFromXGID(xgidString);
        return true;
    } catch {
        return false;
    }
}
