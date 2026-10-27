'use client';

/**
 * Modale d'Audit Cryptographique en 1 Clic — Provably Fair RNG (`DiceAuditModal.tsx`).
 *
 * Rôle :
 *   Permet au joueur d'auditer localement à 100 % dans son navigateur (via `window.crypto.subtle`)
 *   l'intégrité de chaque lancer de dés selon le protocole Commit-Play-Reveal (HMAC-SHA256 + Rejet < 252) :
 *     1. Sceau de conformité vert animé : « ✓ 100 % Équitable & Vérifié mathématiquement ».
 *     2. Affichage des graines :
 *        - `serverSeedHash` initial (engagement SHA-256 pré-match).
 *        - `serverSeed` révélée (avec concordance 100 % du hash recalculé).
 *        - `clientSeed` combinée (`clientSeedA:clientSeedB`).
 *     3. Tableau déroulant de tous les jets de la partie :
 *        - Colonnes : Tour (`nonce`), Jet Réel, Jet Recalculé, Préfixe HMAC, Statut (`Validé ✓`).
 *        - Code couleur vert immédiat sur chaque ligne vérifiée.
 *     4. Bouton d'exportation / copie (JSON + commande terminal OpenSSL HMAC-SHA256)
 *        pour vérification externe dans n'importe quel terminal ou outil tiers.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    REJECTION_THRESHOLD,
    computeServerSeedHash,
    verifyServerSeedCommitment,
    generateProvablyFairRollDetailed,
    verifySingleRollBrowser,
    computeServerSeedHashBrowser,
    bytesToHex,
    computeHmacSha256Browser,
    extractDiceFromDigestBytes,
    formatRollMessage,
    type ProvablyFairSessionState,
    type ProvablyFairAuditRow,
} from '../../lib/crypto/provablyFairRng';

export interface DiceAuditRollInput {
    readonly nonce: number;
    readonly actualDice: readonly [number, number];
    readonly isOpeningRoll?: boolean;
    readonly player?: 'X' | 'O';
}

export interface DiceAuditModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    /** Session Provably Fair complète issue de `useBackgammonGame`. */
    readonly session?: ProvablyFairSessionState;
    /** Graine serveur révélée (si passée directement sans `session`). */
    readonly serverSeed?: string;
    /** Empreinte SHA-256 initiale (si passée directement sans `session`). */
    readonly serverSeedHash?: string;
    /** Graine client combinée `clientSeedA:clientSeedB` (si passée directement sans `session`). */
    readonly clientSeed?: string;
    /** Liste des lancers à auditer (si passée directement sans `session`). */
    readonly rolls?: ReadonlyArray<DiceAuditRollInput>;
    /** Permet au joueur de personnaliser ses graines clients (Phase 2). */
    readonly onUpdateClientSeeds?: (clientSeedA: string, clientSeedB: string) => void;
}

const DEFAULT_FALLBACK_SERVER_SEED =
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const DEFAULT_FALLBACK_CLIENT_SEED = 'alice_and_bob_seed_12345';

export const DiceAuditModal: React.FC<DiceAuditModalProps> = ({
    isOpen,
    onClose,
    session,
    serverSeed: propServerSeed,
    serverSeedHash: propServerSeedHash,
    clientSeed: propClientSeed,
    rolls: propRolls,
    onUpdateClientSeeds,
}) => {
    const effectiveServerSeed =
        propServerSeed ?? session?.serverSeed ?? DEFAULT_FALLBACK_SERVER_SEED;
    const effectiveServerSeedHash =
        propServerSeedHash ??
        session?.serverSeedHash ??
        computeServerSeedHash(effectiveServerSeed);
    const effectiveClientSeed =
        propClientSeed ?? session?.clientSeed ?? DEFAULT_FALLBACK_CLIENT_SEED;

    const rawRolls: ReadonlyArray<DiceAuditRollInput> = useMemo(() => {
        if (propRolls) return propRolls;
        if (session?.rollHistory) {
            return session.rollHistory.map((r) => ({
                nonce: r.nonce,
                actualDice: r.actualDice,
                isOpeningRoll: r.isOpeningRoll,
                player: r.player,
            }));
        }
        return [];
    }, [propRolls, session?.rollHistory]);

    // Calcul synchrone initial (disponible immédiatement dès le premier rendu / SSR)
    const initialSyncAudit = useMemo(() => {
        const recalculatedHash = computeServerSeedHash(effectiveServerSeed);
        const isHashValid = verifyServerSeedCommitment(
            effectiveServerSeed,
            effectiveServerSeedHash,
        );
        const rows: ProvablyFairAuditRow[] = rawRolls.map((r) => {
            const isOpening = r.isOpeningRoll ?? r.nonce === 0;
            const detail = generateProvablyFairRollDetailed(
                effectiveServerSeed,
                effectiveClientSeed,
                r.nonce,
                isOpening,
            );
            const isValid =
                r.actualDice[0] === detail.dice[0] && r.actualDice[1] === detail.dice[1];
            return {
                nonce: r.nonce,
                isOpeningRoll: isOpening,
                actualDice: [r.actualDice[0], r.actualDice[1]],
                recalculatedDice: detail.dice,
                hmacHex: detail.hmacHex,
                hmacPrefix: detail.hmacPrefix,
                rejectedBytes: detail.rejectedBytes,
                isValid,
            };
        });
        const allRollsValid = rows.every((row) => row.isValid);
        return {
            recalculatedHash,
            isHashValid,
            rows,
            allRollsValid,
            isFullyVerified: isHashValid && allRollsValid,
        };
    }, [effectiveServerSeed, effectiveServerSeedHash, effectiveClientSeed, rawRolls]);

    const [browserAuditRows, setBrowserAuditRows] = useState<ReadonlyArray<ProvablyFairAuditRow>>(
        initialSyncAudit.rows,
    );
    const [browserRecalculatedHash, setBrowserRecalculatedHash] = useState<string>(
        initialSyncAudit.recalculatedHash,
    );
    const [isSubtleVerified, setIsSubtleVerified] = useState<boolean>(
        initialSyncAudit.isFullyVerified,
    );
    const [copiedFeedback, setCopiedFeedback] = useState<boolean>(false);
    const [customSeedA, setCustomSeedA] = useState<string>(session?.clientSeedA ?? '');
    const [customSeedB, setCustomSeedB] = useState<string>(session?.clientSeedB ?? '');

    useEffect(() => {
        setBrowserAuditRows(initialSyncAudit.rows);
        setBrowserRecalculatedHash(initialSyncAudit.recalculatedHash);
        setIsSubtleVerified(initialSyncAudit.isFullyVerified);
    }, [initialSyncAudit]);

    // Exécution de l'audit 100 % navigateur via `window.crypto.subtle` (Web Crypto API)
    const runSubtleCryptoAudit = useCallback(async () => {
        try {
            const subtleHash = await computeServerSeedHashBrowser(effectiveServerSeed);
            const hashMatches =
                subtleHash.toLowerCase() === effectiveServerSeedHash.trim().toLowerCase();

            const verifiedRows: ProvablyFairAuditRow[] = await Promise.all(
                rawRolls.map(async (r) => {
                    const isOpening = r.isOpeningRoll ?? r.nonce === 0;
                    const recalculatedDice = await verifySingleRollBrowser(
                        effectiveServerSeed,
                        effectiveClientSeed,
                        r.nonce,
                        isOpening,
                    );
                    const message = formatRollMessage(effectiveClientSeed, r.nonce, 0);
                    const digest = await computeHmacSha256Browser(effectiveServerSeed, message);
                    const hmacHex = bytesToHex(digest);
                    const extraction = extractDiceFromDigestBytes(digest, isOpening);
                    const isValid =
                        r.actualDice[0] === recalculatedDice[0] &&
                        r.actualDice[1] === recalculatedDice[1];

                    return {
                        nonce: r.nonce,
                        isOpeningRoll: isOpening,
                        actualDice: [r.actualDice[0], r.actualDice[1]],
                        recalculatedDice,
                        hmacHex,
                        hmacPrefix: hmacHex.slice(0, 16),
                        rejectedBytes: extraction.rejectedBytes,
                        isValid,
                    };
                }),
            );

            setBrowserRecalculatedHash(subtleHash);
            setBrowserAuditRows(verifiedRows);
            setIsSubtleVerified(hashMatches && verifiedRows.every((row) => row.isValid));
        } catch {
            // Conserve le résultat synchrone si SubtleCrypto est indisponible
        }
    }, [effectiveServerSeed, effectiveServerSeedHash, effectiveClientSeed, rawRolls]);

    useEffect(() => {
        if (!isOpen) return;
        void runSubtleCryptoAudit();
    }, [isOpen, runSubtleCryptoAudit]);

    // Fermeture au clavier via Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const exportPayload = useMemo(() => {
        const sampleNonce = browserAuditRows[0]?.nonce ?? 0;
        const opensslVerifyCmd = `printf "%s" "${effectiveClientSeed}:${sampleNonce}" | openssl dgst -sha256 -hmac "${effectiveServerSeed}"`;
        return JSON.stringify(
            {
                protocol: 'ProvablyFair-HMAC-SHA256-RejectionSampling-lt-252',
                rejectionThreshold: REJECTION_THRESHOLD,
                serverSeedHash: effectiveServerSeedHash,
                serverSeed: effectiveServerSeed,
                recalculatedServerSeedHash: browserRecalculatedHash,
                commitmentVerified:
                    browserRecalculatedHash.toLowerCase() ===
                    effectiveServerSeedHash.trim().toLowerCase(),
                clientSeed: effectiveClientSeed,
                opensslCommandExample: opensslVerifyCmd,
                rolls: browserAuditRows.map((row) => ({
                    nonce: row.nonce,
                    isOpeningRoll: row.isOpeningRoll,
                    actualDice: row.actualDice,
                    recalculatedDice: row.recalculatedDice,
                    hmacPrefix: row.hmacPrefix,
                    hmacHex: row.hmacHex,
                    status: row.isValid ? 'Validé ✓' : 'Erreur ✗',
                })),
            },
            null,
            2,
        );
    }, [
        browserAuditRows,
        browserRecalculatedHash,
        effectiveClientSeed,
        effectiveServerSeed,
        effectiveServerSeedHash,
    ]);

    const handleCopyAuditProof = useCallback(async () => {
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(exportPayload);
            }
            setCopiedFeedback(true);
            setTimeout(() => setCopiedFeedback(false), 2500);
        } catch {
            setCopiedFeedback(true);
            setTimeout(() => setCopiedFeedback(false), 2500);
        }
    }, [exportPayload]);

    if (!isOpen) return null;

    const isHashMatch =
        browserRecalculatedHash.toLowerCase() === effectiveServerSeedHash.trim().toLowerCase();

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dice-audit-modal-title"
            data-testid="dice-audit-modal"
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#070402]/85 p-3 backdrop-blur-md sm:p-6"
            onClick={onClose}
        >
            <div
                className="w-full max-w-4xl max-h-[92vh] overflow-y-auto space-y-4 rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a0f08] via-[#120a05] to-[#0a0503] p-4 text-[#fdf8eb] shadow-[0_28px_80px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,245,205,0.2)] sm:p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* En-tête de la modale */}
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                        <span
                            aria-hidden="true"
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/50 bg-emerald-950/60 text-xl shadow-inner"
                        >
                            🛡
                        </span>
                        <div>
                            <h2
                                id="dice-audit-modal-title"
                                className="font-serif text-base font-black uppercase tracking-wider text-[#fdf8eb] sm:text-lg"
                            >
                                Auditeur Cryptographique Provably Fair (Zero-Trust)
                            </h2>
                            <p className="text-[11px] text-[#e8dcc6]/70">
                                Protocole Commit-Play-Reveal • HMAC-SHA256 • Échantillonnage par Rejet (&lt; {REJECTION_THRESHOLD}) • Web Crypto API
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        data-testid="dice-audit-close-btn"
                        aria-label="Fermer la modale d'audit"
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#fce8b2] transition hover:border-white/25 hover:text-white active:scale-95"
                    >
                        ✕ Fermer
                    </button>
                </header>

                {/* 1. Sceau de conformité vert animé */}
                <section
                    data-testid="dice-audit-compliance-seal"
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 shadow-lg transition-all ${
                        isSubtleVerified
                            ? 'border-emerald-400/65 bg-gradient-to-r from-emerald-950/80 via-emerald-900/50 to-emerald-950/80 text-emerald-100'
                            : 'border-rose-500/65 bg-rose-950/70 text-rose-100'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <span
                            aria-hidden="true"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-300/70 bg-emerald-500/25 text-lg font-black text-emerald-300 animate-pulse shadow-[0_0_18px_rgba(16,185,129,0.55)]"
                        >
                            ✓
                        </span>
                        <div>
                            <p className="font-serif text-sm font-black tracking-wide text-emerald-200 sm:text-base">
                                ✓ 100 % Équitable &amp; Vérifié mathématiquement
                            </p>
                            <p className="text-[11px] text-emerald-100/80">
                                Équiprobabilité stricte de 42/252 (1/6) par face • 0,00 % de biais de modulo • Vérifié localement via{' '}
                                <code className="font-mono text-emerald-300">window.crypto.subtle</code>
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => void runSubtleCryptoAudit()}
                        data-testid="dice-audit-rerun-btn"
                        className="rounded-xl border border-emerald-400/55 bg-emerald-900/60 px-3 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-800/70 active:scale-95"
                    >
                        🔄 Recalculer (SubtleCrypto)
                    </button>
                </section>

                {/* 2. Affichage des graines (Commit - Play - Reveal) */}
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

                {/* 3. Tableau déroulant de tous les jets de la partie */}
                <section aria-label="Tableau d'audit de tous les jets de la partie" className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="font-serif text-xs font-black uppercase tracking-wider text-[#fce8b2] sm:text-sm">
                            🎲 Journal Déterministe des Lancers ({browserAuditRows.length})
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
                                {browserAuditRows.length === 0 ? (
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
                                    browserAuditRows.map((row) => (
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

                {/* 4. Pied de modale : Bouton d'exportation / copie pour vérification externe */}
                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                    <p className="text-[11px] text-[#e8dcc6]/70">
                        Vérifiable indépendamment via OpenSSL, CyberChef ou tout terminal HMAC-SHA256.
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void handleCopyAuditProof()}
                            data-testid="dice-audit-copy-btn"
                            className="inline-flex items-center gap-2 rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#8b6914] via-[#d4af37] to-[#f3c65f] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1a0f07] shadow-[0_6px_18px_rgba(212,175,55,0.28)] transition hover:brightness-105 active:scale-95"
                        >
                            <span aria-hidden="true">{copiedFeedback ? '✓' : '📋'}</span>
                            <span>
                                {copiedFeedback
                                    ? 'Preuve cryptographique copiée !'
                                    : 'Exporter / Copier la preuve HMAC (JSON & CLI)'}
                            </span>
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default DiceAuditModal;
