/**
 * Moteur Cryptographique "Zero-Trust" Provably Fair RNG (HMAC-SHA256 & Rejection Sampling < 252).
 *
 * Implémente le standard cryptographique Commit-Play-Reveal à 3 phases :
 *   1. Phase 1 (Commit pré-match) :
 *      - Génération d'une `serverSeed` CSPRNG de 256 bits (64 caractères hexadécimaux).
 *      - Engagement immuable `serverSeedHash = SHA-256(serverSeed)` transmis avant tout lancer.
 *   2. Phase 2 (Play - Contribution multipartite) :
 *      - Graines joueurs `clientSeedA` et `clientSeedB` combinées : `clientSeed = clientSeedA + ":" + clientSeedB`.
 *      - Compteur séquentiel strictement croissant `nonce` (0, 1, 2, ...).
 *   3. Phase 3 (Reveal post-match) :
 *      - Révélation de `serverSeed` en clair à la fin de la partie.
 *      - Audit local 100 % navigateur via `window.crypto.subtle` (SubtleCrypto).
 *
 * Élimination du biais de modulo :
 *   - 256 mod 6 = 4 -> un simple `byte % 6 + 1` favoriserait les faces 1..4 (43/256 vs 42/256, +0.39%).
 *   - Échantillonnage par rejet strict : tout octet b_i >= 252 est impérativement écarté.
 *   - Pour b_i < 252 : face = (b_i % 6) + 1, garantissant 42/252 = 1/6 exactement par face.
 *   - Jet d'ouverture (`nonce === 0` / `isOpeningRoll === true`) : rejet des doubles (d2 === d1).
 */

/** Seuil strict d'échantillonnage par rejet : 42 * 6 = 252. Tout octet >= 252 est rejeté. */
export const REJECTION_THRESHOLD = 252;

/** Taille de la graine serveur en octets (256 bits = 32 octets = 64 caractères hexadécimaux). */
export const SERVER_SEED_BYTE_LENGTH = 32;

/** Taille par défaut d'une graine client individuelle en octets (128 bits = 16 octets = 32 hex). */
export const DEFAULT_CLIENT_SEED_BYTE_LENGTH = 16;

export type ByteRejectionReason = 'modulo_bias_ge_252' | 'opening_double';

export interface RejectedByteRecord {
    readonly index: number;
    readonly byte: number;
    readonly reason: ByteRejectionReason;
}

export interface DigestExtractionResult {
    readonly dice: [number, number] | null;
    readonly rejectedBytes: ReadonlyArray<RejectedByteRecord>;
    readonly consumedByteIndices: readonly [number, number] | null;
}

export interface ProvablyFairRollDetail {
    readonly nonce: number;
    readonly isOpeningRoll: boolean;
    readonly dice: [number, number];
    readonly hmacHex: string;
    readonly hmacPrefix: string;
    readonly message: string;
    readonly rejectedBytes: ReadonlyArray<RejectedByteRecord>;
    readonly consumedByteIndices: readonly [number, number];
}

export interface ProvablyFairRecordedRoll {
    readonly nonce: number;
    readonly player: 'X' | 'O';
    readonly isOpeningRoll: boolean;
    readonly actualDice: readonly [number, number];
    readonly recalculatedDice: readonly [number, number];
    readonly hmacHex: string;
    readonly hmacPrefix: string;
    readonly timestamp: number;
}

export interface ProvablyFairSessionState {
    readonly serverSeed: string;
    readonly serverSeedHash: string;
    readonly clientSeedA: string;
    readonly clientSeedB: string;
    readonly clientSeed: string;
    readonly nonce: number;
    readonly isRevealed: boolean;
    readonly rollHistory: ReadonlyArray<ProvablyFairRecordedRoll>;
}

export interface ProvablyFairAuditRow {
    readonly nonce: number;
    readonly isOpeningRoll: boolean;
    readonly actualDice: readonly [number, number];
    readonly recalculatedDice: readonly [number, number];
    readonly hmacHex: string;
    readonly hmacPrefix: string;
    readonly rejectedBytes: ReadonlyArray<RejectedByteRecord>;
    readonly isValid: boolean;
}

export interface ProvablyFairMatchAuditReport {
    readonly serverSeed: string;
    readonly expectedServerSeedHash: string;
    readonly recalculatedServerSeedHash: string;
    readonly isCommitmentValid: boolean;
    readonly clientSeedA: string;
    readonly clientSeedB: string;
    readonly clientSeed: string;
    readonly rows: ReadonlyArray<ProvablyFairAuditRow>;
    readonly allRollsValid: boolean;
    readonly isFullyVerified: boolean;
}

// ---------------------------------------------------------------------------
// Utilitaires d'encodage UTF-8 & Hexadécimal
// ---------------------------------------------------------------------------

const textEncoder = new TextEncoder();

/** Convertit une chaîne UTF-8 en `Uint8Array`. */
export function utf8ToBytes(input: string): Uint8Array {
    return textEncoder.encode(input);
}

/** Convertit un `Uint8Array` en chaîne hexadécimale minuscule. */
export function bytesToHex(bytes: Uint8Array): string {
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i]!.toString(16).padStart(2, '0');
    }
    return hex;
}

/** Tronque une empreinte SHA-256 pour l'affichage compact dans le HUD (ex: `a8f3...b21c`). */
export function formatTruncatedHash(hash: string, prefixLen = 4, suffixLen = 4): string {
    const clean = hash.trim();
    if (clean.length <= prefixLen + suffixLen + 3) return clean;
    return `${clean.slice(0, prefixLen)}...${clean.slice(-suffixLen)}`;
}

// ---------------------------------------------------------------------------
// Implémentation pure TypeScript FIPS 180-4 SHA-256 & RFC 2104 HMAC-SHA256
// (Exécution synchrone déterministe pour le reducer et validation croisée)
// ---------------------------------------------------------------------------

const SHA256_K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(value: number, shift: number): number {
    return (value >>> shift) | (value << (32 - shift));
}

/** Calcule le condensat SHA-256 (32 octets) d'un tableau d'octets selon FIPS 180-4. */
export function sha256Bytes(message: Uint8Array): Uint8Array {
    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;

    const msgLen = message.length;
    const bitLenHi = Math.floor((msgLen * 8) / 0x100000000);
    const bitLenLo = (msgLen * 8) >>> 0;

    const paddedLen = Math.ceil((msgLen + 9) / 64) * 64;
    const padded = new Uint8Array(paddedLen);
    padded.set(message);
    padded[msgLen] = 0x80;

    const view = new DataView(padded.buffer);
    view.setUint32(paddedLen - 8, bitLenHi, false);
    view.setUint32(paddedLen - 4, bitLenLo, false);

    const w = new Uint32Array(64);

    for (let offset = 0; offset < paddedLen; offset += 64) {
        for (let i = 0; i < 16; i++) {
            w[i] = view.getUint32(offset + i * 4, false);
        }
        for (let i = 16; i < 64; i++) {
            const s0 = rotr(w[i - 15]!, 7) ^ rotr(w[i - 15]!, 18) ^ (w[i - 15]! >>> 3);
            const s1 = rotr(w[i - 2]!, 17) ^ rotr(w[i - 2]!, 19) ^ (w[i - 2]! >>> 10);
            w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) >>> 0;
        }

        let a = h0;
        let b = h1;
        let c = h2;
        let d = h3;
        let e = h4;
        let f = h5;
        let g = h6;
        let h = h7;

        for (let i = 0; i < 64; i++) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (h + S1 + ch + SHA256_K[i]! + w[i]!) >>> 0;
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) >>> 0;

            h = g;
            g = f;
            f = e;
            e = (d + temp1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) >>> 0;
        }

        h0 = (h0 + a) >>> 0;
        h1 = (h1 + b) >>> 0;
        h2 = (h2 + c) >>> 0;
        h3 = (h3 + d) >>> 0;
        h4 = (h4 + e) >>> 0;
        h5 = (h5 + f) >>> 0;
        h6 = (h6 + g) >>> 0;
        h7 = (h7 + h) >>> 0;
    }

    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    outView.setUint32(0, h0, false);
    outView.setUint32(4, h1, false);
    outView.setUint32(8, h2, false);
    outView.setUint32(12, h3, false);
    outView.setUint32(16, h4, false);
    outView.setUint32(20, h5, false);
    outView.setUint32(24, h6, false);
    outView.setUint32(28, h7, false);
    return out;
}

/** Calcule le hash SHA-256 hexadécimal d'une chaîne ou d'un `Uint8Array`. */
export function sha256Hex(input: string | Uint8Array): string {
    const bytes = typeof input === 'string' ? utf8ToBytes(input) : input;
    return bytesToHex(sha256Bytes(bytes));
}

/** Calcule le condensat HMAC-SHA256 (32 octets) selon RFC 2104. */
export function hmacSha256Bytes(key: string | Uint8Array, message: string | Uint8Array): Uint8Array {
    const blockSize = 64;
    let keyBytes = typeof key === 'string' ? utf8ToBytes(key) : key;
    const msgBytes = typeof message === 'string' ? utf8ToBytes(message) : message;

    if (keyBytes.length > blockSize) {
        keyBytes = sha256Bytes(keyBytes);
    }

    const paddedKey = new Uint8Array(blockSize);
    paddedKey.set(keyBytes);

    const oKeyPad = new Uint8Array(blockSize);
    const iKeyPad = new Uint8Array(blockSize);
    for (let i = 0; i < blockSize; i++) {
        oKeyPad[i] = paddedKey[i]! ^ 0x5c;
        iKeyPad[i] = paddedKey[i]! ^ 0x36;
    }

    const innerInput = new Uint8Array(blockSize + msgBytes.length);
    innerInput.set(iKeyPad, 0);
    innerInput.set(msgBytes, blockSize);
    const innerHash = sha256Bytes(innerInput);

    const outerInput = new Uint8Array(blockSize + innerHash.length);
    outerInput.set(oKeyPad, 0);
    outerInput.set(innerHash, blockSize);
    return sha256Bytes(outerInput);
}

/** Calcule le HMAC-SHA256 hexadécimal d'un message avec la clé fournie. */
export function hmacSha256Hex(key: string | Uint8Array, message: string | Uint8Array): string {
    return bytesToHex(hmacSha256Bytes(key, message));
}

// ---------------------------------------------------------------------------
// Phase 1, 2, 3 : Protocole Commit-Play-Reveal
// ---------------------------------------------------------------------------

/** Génère des octets aléatoires cryptographiquement sûrs via Web Crypto CSPRNG. */
function getSecureRandomBytes(byteLength: number): Uint8Array {
    const buffer = new Uint8Array(byteLength);
    const cryptoObj =
        typeof window !== 'undefined' && window.crypto
            ? window.crypto
            : typeof globalThis !== 'undefined'
              ? globalThis.crypto
              : undefined;

    if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
        cryptoObj.getRandomValues(buffer);
        return buffer;
    }

    // Repli déterministe de dernier recours uniquement si l'environnement est dépourvu de CSPRNG
    for (let i = 0; i < byteLength; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
}

/**
 * Phase 1 (Commit) : Génère une `serverSeed` aléatoire de 256 bits (64 caractères hexadécimaux).
 */
export function generateServerSeed(): string {
    return bytesToHex(getSecureRandomBytes(SERVER_SEED_BYTE_LENGTH));
}

/**
 * Phase 1 (Commit) : Calcule l'engagement immuable `serverSeedHash = SHA-256(serverSeed)`.
 */
export function computeServerSeedHash(serverSeed: string): string {
    return sha256Hex(serverSeed);
}

/**
 * Phase 2 (Play) : Génère une graine client locale aléatoire (par défaut 16 octets = 32 caractères hex).
 */
export function generateClientSeed(byteLength: number = DEFAULT_CLIENT_SEED_BYTE_LENGTH): string {
    return bytesToHex(getSecureRandomBytes(byteLength));
}

/**
 * Phase 2 (Play) : Formate la graine combinée canonique `clientSeed = clientSeedA + ":" + clientSeedB`.
 */
export function combineClientSeeds(clientSeedA: string, clientSeedB: string): string {
    return `${clientSeedA}:${clientSeedB}`;
}

/**
 * Formate le message canonique signé par HMAC : `clientSeed + ":" + nonce`
 * (ou avec suffixe de sous-tour si tous les 32 octets d'un bloc étaient épuisés).
 */
export function formatRollMessage(clientSeed: string, nonce: number, subRound = 0): string {
    if (!Number.isInteger(nonce) || nonce < 0) {
        throw new RangeError(`Le nonce doit être un entier positif ou nul (reçu : ${nonce}).`);
    }
    return subRound > 0 ? `${clientSeed}:${nonce}:${subRound}` : `${clientSeed}:${nonce}`;
}

/**
 * Phase 3 (Reveal) : Vérifie que `SHA-256(serverSeed) === serverSeedHash`.
 */
export function verifyServerSeedCommitment(serverSeed: string, expectedServerSeedHash: string): boolean {
    const computed = computeServerSeedHash(serverSeed).toLowerCase();
    const expected = expectedServerSeedHash.trim().toLowerCase();
    if (computed.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < computed.length; i++) {
        diff |= computed.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return diff === 0;
}

// ---------------------------------------------------------------------------
// Échantillonnage par Rejet (< 252) — Zéro Biais de Modulo
// ---------------------------------------------------------------------------

/**
 * Indique si un octet `b_i` est accepté par l'échantillonnage par rejet (`0 <= b_i < 252`).
 * Les valeurs 252, 253, 254 et 255 sont impérativement rejetées.
 */
export function isAcceptedRollByte(byte: number): boolean {
    return Number.isInteger(byte) && byte >= 0 && byte < REJECTION_THRESHOLD;
}

/**
 * Convertit un octet valide (`0 <= byte < 252`) en face de dé équiprobable `1..6`.
 */
export function byteToDieFace(byte: number): number {
    if (!isAcceptedRollByte(byte)) {
        throw new RangeError(`Octet hors plage d'acceptation (< ${REJECTION_THRESHOLD}) : ${byte}`);
    }
    return (byte % 6) + 1;
}

/**
 * Parcourt séquentiellement les octets d'un condensat HMAC-SHA256 pour en extraire `[d1, d2]` :
 *   - Écarte tout octet `b_i >= 252` (biais de modulo).
 *   - Si `isOpeningRoll === true` (ex: `nonce === 0`), écarte tout octet donnant `d2 === d1`.
 */
export function extractDiceFromDigestBytes(
    digest: Uint8Array | ReadonlyArray<number>,
    isOpeningRoll = false,
): DigestExtractionResult {
    const rejectedBytes: RejectedByteRecord[] = [];
    let d1: number | null = null;
    let idx1 = -1;

    for (let i = 0; i < digest.length; i++) {
        const byte = digest[i]!;
        if (byte >= REJECTION_THRESHOLD) {
            rejectedBytes.push({
                index: i,
                byte,
                reason: 'modulo_bias_ge_252',
            });
            continue;
        }

        const face = (byte % 6) + 1;

        if (d1 === null) {
            d1 = face;
            idx1 = i;
            continue;
        }

        if (isOpeningRoll && face === d1) {
            rejectedBytes.push({
                index: i,
                byte,
                reason: 'opening_double',
            });
            continue;
        }

        return {
            dice: [d1, face],
            rejectedBytes,
            consumedByteIndices: [idx1, i],
        };
    }

    return {
        dice: null,
        rejectedBytes,
        consumedByteIndices: null,
    };
}

/**
 * Génère un jet Provably Fair détaillé (avec préfixe HMAC et octets rejetés).
 * Par défaut, `isOpeningRoll` est vrai pour `nonce === 0` (interdiction des doubles à l'ouverture).
 */
export function generateProvablyFairRollDetailed(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    isOpeningRoll: boolean = nonce === 0,
): ProvablyFairRollDetail {
    const aggregatedRejected: RejectedByteRecord[] = [];
    let primaryHmacHex = '';
    let primaryMessage = '';

    for (let subRound = 0; subRound < 16; subRound++) {
        const message = formatRollMessage(clientSeed, nonce, subRound);
        const digest = hmacSha256Bytes(serverSeed, message);
        const hmacHex = bytesToHex(digest);
        if (subRound === 0) {
            primaryHmacHex = hmacHex;
            primaryMessage = message;
        }

        const extraction = extractDiceFromDigestBytes(digest, isOpeningRoll);
        for (const rej of extraction.rejectedBytes) {
            aggregatedRejected.push({
                index: subRound * 32 + rej.index,
                byte: rej.byte,
                reason: rej.reason,
            });
        }

        if (extraction.dice && extraction.consumedByteIndices) {
            return {
                nonce,
                isOpeningRoll,
                dice: extraction.dice,
                hmacHex: primaryHmacHex,
                hmacPrefix: primaryHmacHex.slice(0, 16),
                message: primaryMessage,
                rejectedBytes: aggregatedRejected,
                consumedByteIndices: [
                    subRound * 32 + extraction.consumedByteIndices[0],
                    subRound * 32 + extraction.consumedByteIndices[1],
                ],
            };
        }
    }

    // Repli mathématiquement inatteignable (probabilité < 10^-300)
    return {
        nonce,
        isOpeningRoll,
        dice: isOpeningRoll ? [1, 2] : [1, 1],
        hmacHex: primaryHmacHex,
        hmacPrefix: primaryHmacHex.slice(0, 16),
        message: primaryMessage,
        rejectedBytes: aggregatedRejected,
        consumedByteIndices: [0, 1],
    };
}

/**
 * Génère le couple de dés `[d1, d2]` selon le protocole HMAC-SHA256 avec rejet `< 252`.
 * Pour `nonce === 0` (ou si `isOpeningRoll === true`), les doubles sont formellement exclus.
 */
export function generateProvablyFairRoll(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    isOpeningRoll: boolean = nonce === 0,
): [number, number] {
    return generateProvablyFairRollDetailed(serverSeed, clientSeed, nonce, isOpeningRoll).dice;
}

// ---------------------------------------------------------------------------
// Vérificateur Client 100 % Navigateur via Web Crypto API (`window.crypto.subtle`)
// ---------------------------------------------------------------------------

/** Récupère l'instance `SubtleCrypto` du navigateur (`window.crypto.subtle` ou `globalThis.crypto.subtle`). */
function getSubtleCrypto(): SubtleCrypto {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        return window.crypto.subtle;
    }
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
        return globalThis.crypto.subtle;
    }
    throw new Error('Web Crypto API (SubtleCrypto) non disponible dans cet environnement.');
}

/**
 * Calcule `SHA-256(serverSeed)` dans le navigateur via `window.crypto.subtle.digest`.
 */
export async function computeServerSeedHashBrowser(serverSeed: string): Promise<string> {
    const subtle = getSubtleCrypto();
    const data = utf8ToBytes(serverSeed);
    const hashBuffer = await subtle.digest('SHA-256', data as BufferSource);
    return bytesToHex(new Uint8Array(hashBuffer));
}

/**
 * Vérifie dans le navigateur que `SHA-256(serverSeed) === expectedServerSeedHash` via `SubtleCrypto`.
 */
export async function verifyServerSeedCommitmentBrowser(
    serverSeed: string,
    expectedServerSeedHash: string,
): Promise<boolean> {
    const calculatedHash = await computeServerSeedHashBrowser(serverSeed);
    return calculatedHash.toLowerCase() === expectedServerSeedHash.trim().toLowerCase();
}

/**
 * Calcule le condensat `HMAC-SHA256(key=serverSeed, msg=message)` via `window.crypto.subtle`.
 */
export async function computeHmacSha256Browser(
    serverSeed: string,
    message: string,
): Promise<Uint8Array> {
    const subtle = getSubtleCrypto();
    const keyBytes = utf8ToBytes(serverSeed);
    const msgBytes = utf8ToBytes(message);

    const cryptoKey = await subtle.importKey(
        'raw',
        keyBytes as BufferSource,
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        false,
        ['sign'],
    );

    const signatureBuffer = await subtle.sign('HMAC', cryptoKey, msgBytes as BufferSource);
    return new Uint8Array(signatureBuffer);
}

/**
 * Vérificateur Client Web Crypto (`window.crypto.subtle`) :
 * Recalcule un jet unique `[d1, d2]` à 100 % dans le navigateur du client sans aucun appel réseau.
 *
 * @param serverSeed Graine serveur révélée (64 caractères hexadécimaux).
 * @param clientSeed Graine client combinée (`clientSeedA:clientSeedB` ou graine canonique).
 * @param nonce Compteur séquentiel du jet (0, 1, 2, ...).
 * @param isOpeningRoll Indique s'il s'agit du jet d'ouverture sans double (défaut : `nonce === 0`).
 * @returns Le couple de dés `[d1, d2]` recalculé par `SubtleCrypto`.
 */
export async function verifySingleRollBrowser(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    isOpeningRoll: boolean = nonce === 0,
): Promise<[number, number]> {
    for (let subRound = 0; subRound < 16; subRound++) {
        const message = formatRollMessage(clientSeed, nonce, subRound);
        const digest = await computeHmacSha256Browser(serverSeed, message);
        const extraction = extractDiceFromDigestBytes(digest, isOpeningRoll);
        if (extraction.dice) {
            return extraction.dice;
        }
    }
    return isOpeningRoll ? [1, 2] : [1, 1];
}

/**
 * Vérifie et détaille un jet unique dans le navigateur via `window.crypto.subtle`
 * pour l'affichage dans le tableau d'audit post-match (`DiceAuditModal`).
 */
export async function verifySingleRollDetailedBrowser(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    actualDice: readonly [number, number],
    isOpeningRoll: boolean = nonce === 0,
): Promise<ProvablyFairAuditRow> {
    const message = formatRollMessage(clientSeed, nonce, 0);
    const digest = await computeHmacSha256Browser(serverSeed, message);
    const hmacHex = bytesToHex(digest);
    const extraction = extractDiceFromDigestBytes(digest, isOpeningRoll);
    const recalculatedDice: [number, number] =
        extraction.dice ?? (await verifySingleRollBrowser(serverSeed, clientSeed, nonce, isOpeningRoll));

    const isValid =
        actualDice[0] === recalculatedDice[0] && actualDice[1] === recalculatedDice[1];

    return {
        nonce,
        isOpeningRoll,
        actualDice: [actualDice[0], actualDice[1]],
        recalculatedDice,
        hmacHex,
        hmacPrefix: hmacHex.slice(0, 16),
        rejectedBytes: extraction.rejectedBytes,
        isValid,
    };
}

// ---------------------------------------------------------------------------
// Gestionnaire d'état de session Provably Fair (cycle de vie d'un match)
// ---------------------------------------------------------------------------

/**
 * Initialise une nouvelle session Provably Fair (Phase 1 Commit + Phase 2 graines initiales).
 */
export function createProvablyFairSession(options?: {
    serverSeed?: string;
    clientSeedA?: string;
    clientSeedB?: string;
    combinedClientSeed?: string;
}): ProvablyFairSessionState {
    const serverSeed = options?.serverSeed ?? generateServerSeed();
    const serverSeedHash = computeServerSeedHash(serverSeed);
    const clientSeedA = options?.clientSeedA ?? generateClientSeed(8);
    const clientSeedB = options?.clientSeedB ?? generateClientSeed(8);
    const clientSeed =
        options?.combinedClientSeed ?? combineClientSeeds(clientSeedA, clientSeedB);

    return {
        serverSeed,
        serverSeedHash,
        clientSeedA,
        clientSeedB,
        clientSeed,
        nonce: 0,
        isRevealed: false,
        rollHistory: [],
    };
}

/**
 * Enregistre un jet dans l'historique de la session et incrémente strictement le `nonce`.
 */
export function recordSessionRoll(
    session: ProvablyFairSessionState,
    player: 'X' | 'O',
    forcedDice?: readonly [number, number],
    timestamp: number = Date.now(),
): { nextSession: ProvablyFairSessionState; dice: [number, number] } {
    const currentNonce = session.nonce;
    const isOpeningRoll = currentNonce === 0;
    const detail = generateProvablyFairRollDetailed(
        session.serverSeed,
        session.clientSeed,
        currentNonce,
        isOpeningRoll,
    );
    const actualDice: [number, number] = forcedDice
        ? [forcedDice[0], forcedDice[1]]
        : detail.dice;

    const record: ProvablyFairRecordedRoll = Object.freeze({
        nonce: currentNonce,
        player,
        isOpeningRoll,
        actualDice: Object.freeze([actualDice[0], actualDice[1]]) as readonly [number, number],
        recalculatedDice: Object.freeze([detail.dice[0], detail.dice[1]]) as readonly [number, number],
        hmacHex: detail.hmacHex,
        hmacPrefix: detail.hmacPrefix,
        timestamp,
    });

    const nextSession: ProvablyFairSessionState = {
        ...session,
        nonce: currentNonce + 1,
        rollHistory: Object.freeze([...session.rollHistory, record]),
    };

    return { nextSession, dice: actualDice };
}

/**
 * Met à jour les graines clients (Phase 2) avant le début des lancers ou réinitialise l'engagement.
 */
export function updateSessionClientSeeds(
    session: ProvablyFairSessionState,
    clientSeedA: string,
    clientSeedB?: string,
): ProvablyFairSessionState {
    const nextA = clientSeedA.trim() || session.clientSeedA;
    const nextB = (clientSeedB ?? session.clientSeedB).trim() || session.clientSeedB;
    return {
        ...session,
        clientSeedA: nextA,
        clientSeedB: nextB,
        clientSeed: combineClientSeeds(nextA, nextB),
    };
}

/**
 * Révèle la `serverSeed` à la fin de la partie (Phase 3 : Reveal).
 */
export function revealSessionServerSeed(
    session: ProvablyFairSessionState,
): ProvablyFairSessionState {
    if (session.isRevealed) return session;
    return {
        ...session,
        isRevealed: true,
    };
}

/**
 * Exécute l'audit complet d'une session dans le navigateur via `window.crypto.subtle`.
 */
export async function auditMatchSessionBrowser(
    session: ProvablyFairSessionState,
): Promise<ProvablyFairMatchAuditReport> {
    const recalculatedServerSeedHash = await computeServerSeedHashBrowser(session.serverSeed);
    const isCommitmentValid =
        recalculatedServerSeedHash.toLowerCase() === session.serverSeedHash.trim().toLowerCase();

    const rows = await Promise.all(
        session.rollHistory.map((entry) =>
            verifySingleRollDetailedBrowser(
                session.serverSeed,
                session.clientSeed,
                entry.nonce,
                entry.actualDice,
                entry.isOpeningRoll,
            ),
        ),
    );

    const allRollsValid = rows.every((r) => r.isValid);

    return {
        serverSeed: session.serverSeed,
        expectedServerSeedHash: session.serverSeedHash,
        recalculatedServerSeedHash,
        isCommitmentValid,
        clientSeedA: session.clientSeedA,
        clientSeedB: session.clientSeedB,
        clientSeed: session.clientSeed,
        rows,
        allRollsValid,
        isFullyVerified: isCommitmentValid && allRollsValid,
    };
}
