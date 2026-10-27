/**
 * Exporteur officiel de match au format JellyFish / Backgammon Galaxy (.mat).
 * Conforme à SCALABILITY.md (< 400 lignes, 0 any).
 */

export { serializeToMAT, parseMAT } from './matSerializer';
export { serializeToMAT as exportToMAT } from './matSerializer';
export type { MatchExportData, ParsedSGFData, ParsedSGFMove } from './types';
