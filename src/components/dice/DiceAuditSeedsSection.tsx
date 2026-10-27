'use client';

import React from 'react';

export interface DiceAuditSeedsSectionProps {
    effectiveServerSeedHash: string;
    effectiveServerSeed: string;
    effectiveClientSeed: string;
    isHashMatch: boolean;
    customSeedA: string;
    customSeedB: string;
    setCustomSeedA: (val: string) => void;
    setCustomSeedB: (val: string) => void;
    onUpdateClientSeeds?: (seedA: string, seedB: string) => void;
}

export const DiceAuditSeedsSection: React.FC<DiceAuditSeedsSectionProps> = ({
    effectiveServerSeedHash,
    effectiveServerSeed,
    effectiveClientSeed,
    isHashMatch,
    customSeedA,
    customSeedB,
    setCustomSeedA,
    setCustomSeedB,
    onUpdateClientSeeds,
}) => {
    return (
        <section
            aria-label="Graines cryptographiques du match"
            className="grid grid-cols-1 gap-2.5 rounded-2xl border border-white/10 bg-[#120904]/90 p-3.5"
        >
            {/* serverSeedHash initial */}
            <div className="rounded-xl border border-white/10 bg-[#0c0603] p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#f3c65f]">
                        🔒 Phase 1 (Commit pré-match) — serverSeedHash initial (SHA-256)
                    </span>
                    <span className="rounded-full border border-emerald-500/45 bg-emerald-950/60 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                        Engagement scellé avant le 1er jet
                    </span>
                </div>
                <p
                    data-testid="dice-audit-server-seed-hash"
                    className="mt-1 break-all font-mono text-xs text-[#fdf8eb]"
                >
                    {effectiveServerSeedHash}
                </p>
            </div>

            {/* serverSeed révélée */}
            <div className="rounded-xl border border-white/10 bg-[#0c0603] p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#f3c65f]">
                        🔑 Phase 3 (Reveal) — serverSeed révélée (256 bits)
                    </span>
                    <span
                        data-testid="dice-audit-hash-match-badge"
                        className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                            isHashMatch
                                ? 'border-emerald-500/50 bg-emerald-950/70 text-emerald-300'
                                : 'border-rose-500/50 bg-rose-950/70 text-rose-300'
                        }`}
                    >
                        {isHashMatch
                            ? 'SHA-256(serverSeed) === serverSeedHash (100 % ✓)'
                            : 'Discordance SHA-256 ✗'}
                    </span>
                </div>
                <p
                    data-testid="dice-audit-server-seed"
                    className="mt-1 break-all font-mono text-xs text-emerald-200"
                >
                    {effectiveServerSeed}
                </p>
            </div>

            {/* clientSeed combinée */}
            <div className="rounded-xl border border-white/10 bg-[#0c0603] p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#f3c65f]">
                        🤝 Phase 2 (Play multipartite) — clientSeed combinée (clientSeedA:clientSeedB)
                    </span>
                    <span className="font-mono text-[11px] text-[#e8dcc6]/70">
                        Message HMAC : <code className="text-[#f3c65f]">{effectiveClientSeed}:nonce</code>
                    </span>
                </div>
                <p
                    data-testid="dice-audit-client-seed"
                    className="mt-1 break-all font-mono text-xs text-[#fce8b2]"
                >
                    {effectiveClientSeed}
                </p>

                {onUpdateClientSeeds && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/10 pt-2">
                        <input
                            type="text"
                            value={customSeedA}
                            onChange={(e) => setCustomSeedA(e.target.value)}
                            placeholder="Graine Joueur A (clientSeedA)"
                            aria-label="Graine Joueur A"
                            data-testid="dice-audit-input-seed-a"
                            className="flex-1 min-w-[140px] rounded-lg border border-white/10 bg-[#180d07] px-2.5 py-1 font-mono text-xs text-[#fdf8eb]"
                        />
                        <input
                            type="text"
                            value={customSeedB}
                            onChange={(e) => setCustomSeedB(e.target.value)}
                            placeholder="Graine Joueur B (clientSeedB)"
                            aria-label="Graine Joueur B"
                            data-testid="dice-audit-input-seed-b"
                            className="flex-1 min-w-[140px] rounded-lg border border-white/10 bg-[#180d07] px-2.5 py-1 font-mono text-xs text-[#fdf8eb]"
                        />
                        <button
                            type="button"
                            onClick={() => onUpdateClientSeeds(customSeedA, customSeedB)}
                            data-testid="dice-audit-apply-seeds-btn"
                            className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-[#fce8b2] hover:border-white/25"
                        >
                            Mettre à jour
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default React.memo(DiceAuditSeedsSection);
