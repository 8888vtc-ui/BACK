/**
 * Exporteur officiel de match au format SGF (Smart Game Format FF[4] GM[6]).
 * Conforme à SCALABILITY.md (< 400 lignes, 0 any).
 */

export { serializeToSGF, parseSGF } from './sgfSerializer';
export { serializeToSGF as exportToSGF } from './sgfSerializer';
export type { MatchExportData, ParsedSGFData, ParsedSGFMove } from './types';
