import { describe, it, expect } from 'vitest';
import {
    REJECTION_THRESHOLD,
    SERVER_SEED_BYTE_LENGTH,
    generateServerSeed,
    generateClientSeed,
    combineClientSeeds,
    computeServerSeedHash,
    computeServerSeedHashBrowser,
    verifyServerSeedCommitment,
    verifyServerSeedCommitmentBrowser,
    isAcceptedRollByte,
    byteToDieFace,
    extractDiceFromDigestBytes,
    generateProvablyFairRoll,
    generateProvablyFairRollDetailed,
    verifySingleRollBrowser,
    verifySingleRollDetailedBrowser,
    createProvablyFairSession,
    recordSessionRoll,
    updateSessionClientSeeds,
    revealSessionServerSeed,
    auditMatchSessionBrowser,
    formatTruncatedHash,
} from './provablyFairRng';

const REFERENCE_SERVER_SEED =
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const REFERENCE_CLIENT_SEED = 'alice_and_bob_seed_12345';

describe('provablyFairRng — Moteur Cryptographique Provably Fair (Zero-Biais Modulo)', () => {
    describe('1. Vecteurs de test de référence (Validation croisée HMAC-SHA256)', () => {
        it('valide exactement les 5 vecteurs de référence via le générateur synchrone', () => {
            // nonce = 0 (Ouverture, sans double) -> [4, 3] (après rejet d'octets identiques)
            const roll0Detail = generateProvablyFairRollDetailed(
                REFERENCE_SERVER_SEED,
                REFERENCE_CLIENT_SEED,
                0,
                true,
            );
            expect(roll0Detail.dice).toEqual([4, 3]);
            expect(
                roll0Detail.rejectedBytes.some((r) => r.reason === 'opening_double'),
            ).toBe(true);

            // nonce = 1 (Standard) -> [3, 5]
            expect(
                generateProvablyFairRoll(REFERENCE_SERVER_SEED, REFERENCE_CLIENT_SEED, 1, false),
            ).toEqual([3, 5]);

            // nonce = 2 (Standard) -> [5, 5]
            expect(
                generateProvablyFairRoll(REFERENCE_SERVER_SEED, REFERENCE_CLIENT_SEED, 2, false),
            ).toEqual([5, 5]);

            // nonce = 3 (Standard) -> [2, 5]
            expect(
                generateProvablyFairRoll(REFERENCE_SERVER_SEED, REFERENCE_CLIENT_SEED, 3, false),
            ).toEqual([2, 5]);

            // nonce = 4 (Standard) -> [2, 1]
            expect(
                generateProvablyFairRoll(REFERENCE_SERVER_SEED, REFERENCE_CLIENT_SEED, 4, false),
            ).toEqual([2, 1]);
        });

        it('valide exactement les 5 vecteurs de référence via SubtleCrypto (verifySingleRollBrowser)', async () => {
            await expect(
                verifySingleRollBrowser(REFERENCE_SERVER_SEED, REFERENCE_CLIENT_SEED, 0, true),
            ).resolves.toEqual([4, 3]);

            await expect(
                verifySingleRollBrowser(REFERENCE_SERVER_SEED, REFERENCE_CLIENT_SEED, 1, false),
            ).resolves.toEqual([3, 5]);

            await expect(
                verifySingleRollBrowser(REFERENCE_SERVER_SEED, REFERENCE_CLIENT_SEED, 2, false),
            ).resolves.toEqual([5, 5]);

            await expect(
                verifySingleRollBrowser(REFERENCE_SERVER_SEED, REFERENCE_CLIENT_SEED, 3, false),
            ).resolves.toEqual([2, 5]);

            await expect(
                verifySingleRollBrowser(REFERENCE_SERVER_SEED, REFERENCE_CLIENT_SEED, 4, false),
            ).resolves.toEqual([2, 1]);
        });
    });

    describe('2. Élimination du biais de modulo par échantillonnage par rejet (< 252)', () => {
        it('rejette impérativement les valeurs >= 252 (252, 253, 254, 255)', () => {
            expect(REJECTION_THRESHOLD).toBe(252);

            for (let b = 0; b < 252; b++) {
                expect(isAcceptedRollByte(b)).toBe(true);
            }
            for (const rejected of [252, 253, 254, 255]) {
                expect(isAcceptedRollByte(rejected)).toBe(false);
                expect(() => byteToDieFace(rejected)).toThrow(RangeError);
            }

            // Condensat synthétique débutant par les 4 octets biaisés [252, 253, 254, 255] suivis de [0, 5]
            const syntheticDigest = new Uint8Array([252, 253, 254, 255, 0, 5]);
            const result = extractDiceFromDigestBytes(syntheticDigest, false);

            expect(result.dice).toEqual([1, 6]);
            expect(result.consumedByteIndices).toEqual([4, 5]);
            expect(result.rejectedBytes).toEqual([
                { index: 0, byte: 252, reason: 'modulo_bias_ge_252' },
                { index: 1, byte: 253, reason: 'modulo_bias_ge_252' },
                { index: 2, byte: 254, reason: 'modulo_bias_ge_252' },
                { index: 3, byte: 255, reason: 'modulo_bias_ge_252' },
            ]);
        });

        it('garantit une équiprobabilité mathématique stricte de 42/252 (1/6) sur les octets 0..251', () => {
            const counts = new Map<number, number>([
                [1, 0],
                [2, 0],
                [3, 0],
                [4, 0],
                [5, 0],
                [6, 0],
            ]);

            for (let byte = 0; byte < REJECTION_THRESHOLD; byte++) {
                const face = byteToDieFace(byte);
                counts.set(face, (counts.get(face) ?? 0) + 1);
            }

            for (let face = 1; face <= 6; face++) {
                expect(counts.get(face)).toBe(42);
            }
        });

        it('vérifie empiriquement la distribution uniforme sur 3 000 lancers (6 000 dés, test du Chi-2)', () => {
            const sampleRolls = 3000;
            const totalDice = sampleRolls * 2;
            const faceCounts = [0, 0, 0, 0, 0, 0];

            for (let nonce = 1; nonce <= sampleRolls; nonce++) {
                const [d1, d2] = generateProvablyFairRoll(
                    REFERENCE_SERVER_SEED,
                    REFERENCE_CLIENT_SEED,
                    nonce,
                    false,
                );
                faceCounts[d1 - 1]! += 1;
                faceCounts[d2 - 1]! += 1;
            }

            const expectedPerFace = totalDice / 6; // 1000
            let chiSquared = 0;
            for (const count of faceCounts) {
                const diff = count - expectedPerFace;
                chiSquared += (diff * diff) / expectedPerFace;
            }

            // Pour ddl = 5, le seuil critique à p = 0.001 est 20.52
            expect(chiSquared).toBeLessThan(20.52);
        });

        it('interdit formellement les doubles au jet d’ouverture (nonce === 0 / isOpeningRoll === true)', () => {
            for (let i = 0; i < 200; i++) {
                const [d1, d2] = generateProvablyFairRoll(
                    REFERENCE_SERVER_SEED,
                    `${REFERENCE_CLIENT_SEED}_${i}`,
                    0,
                    true,
                );
                expect(d1).not.toBe(d2);
                expect(d1).toBeGreaterThanOrEqual(1);
                expect(d1).toBeLessThanOrEqual(6);
                expect(d2).toBeGreaterThanOrEqual(1);
                expect(d2).toBeLessThanOrEqual(6);
            }
        });
    });

    describe('3. Protocole Commit-Play-Reveal à 3 phases & Audit de session', () => {
        it('génère une serverSeed de 256 bits (64 caractères hex) et vérifie son engagement SHA-256', async () => {
            const serverSeed = generateServerSeed();
            expect(serverSeed).toHaveLength(SERVER_SEED_BYTE_LENGTH * 2);
            expect(serverSeed).toMatch(/^[0-9a-f]{64}$/);

            const hashSync = computeServerSeedHash(serverSeed);
            const hashBrowser = await computeServerSeedHashBrowser(serverSeed);
            expect(hashSync).toBe(hashBrowser);
            expect(hashSync).toMatch(/^[0-9a-f]{64}$/);

            expect(verifyServerSeedCommitment(serverSeed, hashSync)).toBe(true);
            await expect(verifyServerSeedCommitmentBrowser(serverSeed, hashSync)).resolves.toBe(true);

            // Toute altération de la serverSeed invalide l'engagement
            const tamperedSeed =
                (serverSeed[0] === 'a' ? 'b' : 'a') + serverSeed.slice(1);
            expect(verifyServerSeedCommitment(tamperedSeed, hashSync)).toBe(false);
            await expect(verifyServerSeedCommitmentBrowser(tamperedSeed, hashSync)).resolves.toBe(false);
        });

        it('combine les graines multipartites clientSeedA:clientSeedB et audite une session complète', async () => {
            const seedA = generateClientSeed(8);
            const seedB = generateClientSeed(8);
            expect(combineClientSeeds(seedA, seedB)).toBe(`${seedA}:${seedB}`);

            let session = createProvablyFairSession({
                serverSeed: REFERENCE_SERVER_SEED,
                clientSeedA: 'alice',
                clientSeedB: 'bob',
            });
            session = updateSessionClientSeeds(session, 'alice_custom', 'bob_custom');
            expect(session.clientSeed).toBe('alice_custom:bob_custom');

            const r0 = recordSessionRoll(session, 'X');
            session = r0.nextSession;
            expect(r0.dice[0]).not.toBe(r0.dice[1]); // nonce 0 -> sans double

            const r1 = recordSessionRoll(session, 'O');
            session = r1.nextSession;
            expect(session.nonce).toBe(2);
            expect(session.rollHistory).toHaveLength(2);

            session = revealSessionServerSeed(session);
            expect(session.isRevealed).toBe(true);

            const report = await auditMatchSessionBrowser(session);
            expect(report.isCommitmentValid).toBe(true);
            expect(report.allRollsValid).toBe(true);
            expect(report.isFullyVerified).toBe(true);
            expect(report.rows).toHaveLength(2);

            const singleRow = await verifySingleRollDetailedBrowser(
                session.serverSeed,
                session.clientSeed,
                0,
                r0.dice,
                true,
            );
            expect(singleRow.isValid).toBe(true);
            expect(formatTruncatedHash(session.serverSeedHash)).toContain('...');
        });
    });
});
