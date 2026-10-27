'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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

export interface UseDiceAuditSubtleParams {
    readonly isOpen: boolean;
    readonly session?: ProvablyFairSessionState;
    readonly serverSeed?: string;
    readonly serverSeedHash?: string;
    readonly clientSeed?: string;
    readonly rolls?: ReadonlyArray<DiceAuditRollInput>;
}

const DEFAULT_SERVER_SEED = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const DEFAULT_CLIENT_SEED = 'alice_and_bob_seed_12345';

export function useDiceAuditSubtle({
    isOpen,
    session,
    serverSeed: propServerSeed,
    serverSeedHash: propServerSeedHash,
    clientSeed: propClientSeed,
    rolls: propRolls,
}: UseDiceAuditSubtleParams) {
    const effectiveServerSeed = propServerSeed ?? session?.serverSeed ?? DEFAULT_SERVER_SEED;
    const effectiveServerSeedHash = propServerSeedHash ?? session?.serverSeedHash ?? computeServerSeedHash(effectiveServerSeed);
    const effectiveClientSeed = propClientSeed ?? session?.clientSeed ?? DEFAULT_CLIENT_SEED;

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

    const initialSyncAudit = useMemo(() => {
        const recalculatedHash = computeServerSeedHash(effectiveServerSeed);
        const isHashValid = verifyServerSeedCommitment(effectiveServerSeed, effectiveServerSeedHash);
        const rows: ProvablyFairAuditRow[] = rawRolls.map((r) => {
            const isOpening = r.isOpeningRoll ?? r.nonce === 0;
            const detail = generateProvablyFairRollDetailed(effectiveServerSeed, effectiveClientSeed, r.nonce, isOpening);
            const isValid = r.actualDice[0] === detail.dice[0] && r.actualDice[1] === detail.dice[1];
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
        return { recalculatedHash, isHashValid, rows, isFullyVerified: isHashValid && rows.every((r) => r.isValid) };
    }, [effectiveServerSeed, effectiveServerSeedHash, effectiveClientSeed, rawRolls]);

    const [browserAuditRows, setBrowserAuditRows] = useState<ReadonlyArray<ProvablyFairAuditRow>>(initialSyncAudit.rows);
    const [browserRecalculatedHash, setBrowserRecalculatedHash] = useState<string>(initialSyncAudit.recalculatedHash);
    const [isSubtleVerified, setIsSubtleVerified] = useState<boolean>(initialSyncAudit.isFullyVerified);
    const [copiedFeedback, setCopiedFeedback] = useState<boolean>(false);

    useEffect(() => {
        setBrowserAuditRows(initialSyncAudit.rows);
        setBrowserRecalculatedHash(initialSyncAudit.recalculatedHash);
        setIsSubtleVerified(initialSyncAudit.isFullyVerified);
    }, [initialSyncAudit]);

    const runSubtleCryptoAudit = useCallback(async () => {
        try {
            const subtleHash = await computeServerSeedHashBrowser(effectiveServerSeed);
            const hashMatches = subtleHash.toLowerCase() === effectiveServerSeedHash.trim().toLowerCase();

            const verifiedRows: ProvablyFairAuditRow[] = await Promise.all(
                rawRolls.map(async (r) => {
                    const isOpening = r.isOpeningRoll ?? r.nonce === 0;
                    const recalculatedDice = await verifySingleRollBrowser(effectiveServerSeed, effectiveClientSeed, r.nonce, isOpening);
                    const message = formatRollMessage(effectiveClientSeed, r.nonce, 0);
                    const digest = await computeHmacSha256Browser(effectiveServerSeed, message);
                    const hmacHex = bytesToHex(digest);
                    const extraction = extractDiceFromDigestBytes(digest, isOpening);
                    const isValid = r.actualDice[0] === recalculatedDice[0] && r.actualDice[1] === recalculatedDice[1];

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
            // Repli sur calcul synchrone
        }
    }, [effectiveServerSeed, effectiveServerSeedHash, effectiveClientSeed, rawRolls]);

    useEffect(() => {
        if (!isOpen) return;
        void runSubtleCryptoAudit();
    }, [isOpen, runSubtleCryptoAudit]);

    const exportPayload = useMemo(() => {
        const sampleNonce = browserAuditRows[0]?.nonce ?? 0;
        const opensslCmd = `printf "%s" "${effectiveClientSeed}:${sampleNonce}" | openssl dgst -sha256 -hmac "${effectiveServerSeed}"`;
        return JSON.stringify({
            protocol: 'ProvablyFair-HMAC-SHA256-RejectionSampling-lt-252',
            rejectionThreshold: REJECTION_THRESHOLD,
            serverSeedHash: effectiveServerSeedHash,
            serverSeed: effectiveServerSeed,
            recalculatedServerSeedHash: browserRecalculatedHash,
            commitmentVerified: browserRecalculatedHash.toLowerCase() === effectiveServerSeedHash.trim().toLowerCase(),
            clientSeed: effectiveClientSeed,
            opensslCommandExample: opensslCmd,
            rolls: browserAuditRows.map((row) => ({
                nonce: row.nonce,
                isOpeningRoll: row.isOpeningRoll,
                actualDice: row.actualDice,
                recalculatedDice: row.recalculatedDice,
                hmacPrefix: row.hmacPrefix,
                hmacHex: row.hmacHex,
                status: row.isValid ? 'Validé ✓' : 'Erreur ✗',
            })),
        }, null, 2);
    }, [browserAuditRows, browserRecalculatedHash, effectiveClientSeed, effectiveServerSeed, effectiveServerSeedHash]);

    const handleCopyAuditProof = useCallback(async () => {
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(exportPayload);
            }
        } finally {
            setCopiedFeedback(true);
            setTimeout(() => setCopiedFeedback(false), 2500);
        }
    }, [exportPayload]);

    const isHashMatch = browserRecalculatedHash.toLowerCase() === effectiveServerSeedHash.trim().toLowerCase();

    return {
        effectiveServerSeed,
        effectiveServerSeedHash,
        effectiveClientSeed,
        browserAuditRows,
        browserRecalculatedHash,
        isSubtleVerified,
        isHashMatch,
        copiedFeedback,
        runSubtleCryptoAudit,
        handleCopyAuditProof,
    };
}
