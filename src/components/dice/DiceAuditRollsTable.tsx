'use client';

import React from 'react';
import { REJECTION_THRESHOLD, type ProvablyFairAuditRow } from '../../lib/crypto/provablyFairRng';

export interface DiceAuditRollsTableProps {
    rows: ReadonlyArray<ProvablyFairAuditRow>;
}

export const DiceAuditRollsTable: React.FC<DiceAuditRollsTableProps> = ({ rows }) => {
    return (
        <section aria-label="Tableau d'audit de tous les jets de la partie" className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="font-serif text-xs font-black uppercase tracking-wider text-[#fce8b2] sm:text-sm">
                    🎲 Journal Déterministe des Lancers ({rows.length})
                </h3>
                <span className="font-mono text-[11px] text-emerald-300">
                    Rejet strict : tout octet ≥ {REJECTION_THRESHOLD} écarté
                </span>
            </div>

            <div
                data-testid="dice-audit-rolls-table-container"
                className="max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0603]/95"
            >
                <table
                    data-testid="dice-audit-rolls-table"
                    className="w-full border-collapse text-left font-mono text-xs"
                >
                    <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#1e1109] text-[11px] font-bold uppercase tracking-wider text-[#f3c65f]">
                        <tr>
                            <th className="px-3 py-2">Tour (nonce)</th>
                            <th className="px-3 py-2">Jet Réel</th>
                            <th className="px-3 py-2">Jet Recalculé</th>
                            <th className="px-3 py-2">Préfixe HMAC</th>
                            <th className="px-3 py-2 text-right">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-500/20">
                        {rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    data-testid="dice-audit-empty-row"
                                    className="px-4 py-6 text-center font-sans text-xs text-[#e8dcc6]/65"
                                >
                                    Aucun lancer enregistré pour le moment. L&apos;empreinte SHA-256 est engagée et prête.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => (
                                <tr
                                    key={`audit-row-${row.nonce}`}
                                    data-testid={`dice-audit-row-${row.nonce}`}
                                    className={
                                        row.isValid
                                            ? 'bg-emerald-950/30 text-emerald-100 hover:bg-emerald-900/40 transition-colors'
                                            : 'bg-rose-950/40 text-rose-100'
                                    }
                                >
                                    <td className="px-3 py-2 font-bold text-emerald-300">
                                        #{row.nonce}
                                        {row.isOpeningRoll && (
                                            <span className="ml-1.5 rounded bg-emerald-900/70 px-1.5 py-0.5 font-sans text-[11px] font-semibold uppercase text-emerald-200">
                                                Ouverture
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 font-black">
                                        [{row.actualDice[0]}, {row.actualDice[1]}]
                                    </td>
                                    <td className="px-3 py-2 font-black text-emerald-300">
                                        [{row.recalculatedDice[0]}, {row.recalculatedDice[1]}]
                                    </td>
                                    <td
                                        className="px-3 py-2 text-[11px] text-emerald-200/85"
                                        title={row.hmacHex}
                                    >
                                        {row.hmacPrefix}…
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold">
                                        {row.isValid ? (
                                            <span
                                                data-testid={`dice-audit-status-${row.nonce}`}
                                                className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-black text-emerald-300"
                                            >
                                                Validé ✓
                                            </span>
                                        ) : (
                                            <span
                                                data-testid={`dice-audit-status-${row.nonce}`}
                                                className="inline-flex items-center gap-1 rounded-full border border-rose-400/50 bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-black text-rose-300"
                                            >
                                                Invalide ✗
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default React.memo(DiceAuditRollsTable);
