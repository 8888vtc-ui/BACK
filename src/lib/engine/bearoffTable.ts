/**
 * Table exacte de bear-off (1-sided bear-off database).
 *
 * Énumère les 54 264 positions à un côté (jusqu'à 15 pions répartis sur les
 * 6 flèches du jan intérieur) et calcule pour chacune l'espérance exacte du
 * nombre de lancers nécessaires pour sortir tous les pions.
 *
 * Indexation parfaite par « stars and bars » (combinaisons avec répétition) :
 * une position est un 6-uplet (c1..c6) de compteurs >= 0 de somme n <= 15.
 * Son index est un entier unique dans [0, 54 263].
 *
 * Le calcul est une programmation dynamique exacte sur les 21 lancers
 * distincts (36 combinaisons de dés, dont 15 non-doubles comptés double et
 * 6 doubles comptés simple). En phase de bear-off pur, le meilleur coup est
 * donc mathématiquement parfait (PR 0.00).
 *
 * Stockage ultra-compact : `Uint16Array` de 54 264 entrées, chaque valeur
 * étant l'espérance de jets × 100 (précision 0.01). Soit ~108 Ko en mémoire.
 * La table est générée de façon DÉTERMINISTE au démarrage (lazy singleton),
 * sans aucun fichier externe ni dépendance réseau — conforme à la contrainte
 * « 100 % client-side, hors-ligne ».
 *
 * Conforme à la charte de gouvernance : module pur, zéro effet de bord,
 * zéro dépendance I/O.
 */

/** Nombre de flèches du jan intérieur. */
const HOME_POINTS = 6;

/** Nombre maximal de pions par joueur. */
const MAX_CHECKERS = 15;

/** Nombre total d'états = C(15+6, 6) = C(21, 6) = 54 264. */
export const BEAROFF_STATE_COUNT = 54264;

/** Facteur d'échelle pour stocker l'espérance en entier (précision 0.01). */
const SCALE = 100;

/**
 * Table binomiale C(n, k) précalculée pour l'indexation parfaite.
 * C(n, k) avec n <= 21, k <= 6.
 */
const BINOM: number[][] = (() => {
    const N = MAX_CHECKERS + HOME_POINTS + 1; // 22
    const table: number[][] = [];
    for (let n = 0; n <= N; n++) {
        table[n] = new Array<number>(HOME_POINTS + 1).fill(0);
        table[n][0] = 1;
        for (let k = 1; k <= HOME_POINTS; k++) {
            table[n][k] = table[n - 1]?.[k] ?? 0;
            if (n >= 1) table[n][k] += table[n - 1][k - 1];
        }
    }
    return table;
})();

/**
 * Index parfait d'une position de bear-off (6 compteurs, somme <= 15).
 *
 * Utilise la bijection « stars and bars » : le nombre de façons de répartir
 * `n` pions sur `k` flèches est C(n + k - 1, k - 1). L'index cumule, pour
 * chaque flèche, le nombre d'états « avant » celle-ci.
 *
 * @param counts Compteurs de pions sur les 6 flèches (index 0..5).
 * @returns Index entier unique dans [0, 54 263].
 */
export function bearoffIndex(counts: number[]): number {
    let index = 0;
    let remaining = MAX_CHECKERS;
    for (let i = 0; i < HOME_POINTS; i++) {
        const c = counts[i];
        // Nombre d'états possibles pour les flèches restantes (i..5) avec
        // `remaining` pions, en fixant la flèche i à une valeur < c.
        for (let v = 0; v < c; v++) {
            const slots = HOME_POINTS - i - 1; // flèches restantes après i
            const n = remaining - v;
            // C(n + slots, slots) façons de répartir n pions sur slots+1 flèches
            // (la flèche i incluse est déjà fixée à v, donc on répartit n pions
            // sur `slots` flèches restantes).
            index += BINOM[n + slots][slots];
        }
        remaining -= c;
    }
    return index;
}

/**
 * Décode un index en position de bear-off (inverse de `bearoffIndex`).
 *
 * @param index Index dans [0, 54 263].
 * @returns Compteurs de pions sur les 6 flèches.
 */
export function bearoffDecode(index: number): number[] {
    const counts = new Array<number>(HOME_POINTS).fill(0);
    let remaining = MAX_CHECKERS;
    for (let i = 0; i < HOME_POINTS; i++) {
        const slots = HOME_POINTS - i - 1;
        let c = 0;
        while (c < remaining) {
            const n = remaining - c;
            const block = BINOM[n + slots][slots];
            if (index < block) break;
            index -= block;
            c++;
        }
        counts[i] = c;
        remaining -= c;
    }
    return counts;
}

/**
 * Génère les 21 lancers distincts avec leur poids (nombre d'occurrences / 36).
 *
 * - 15 non-doubles (a, b) avec a < b : poids 2/36 chacun.
 * - 6 doubles (a, a) : poids 1/36 chacun.
 */
function generateRolls(): Array<{ dice: [number, number]; weight: number }> {
    const rolls: Array<{ dice: [number, number]; weight: number }> = [];
    for (let a = 1; a <= 6; a++) {
        for (let b = a; b <= 6; b++) {
            const weight = a === b ? 1 / 36 : 2 / 36;
            rolls.push({ dice: [a, b], weight });
        }
    }
    return rolls;
}

/**
 * Applique un lancer à une position de bear-off et retourne la meilleure
 * position résultante (celle qui minimise l'espérance restante).
 *
 * En bear-off pur, le joueur cherche à sortir le plus de pions possible en
 * utilisant les deux dés de façon optimale. On énumère les coups légaux
 * (sortie exacte ou depuis la flèche la plus haute si le dé dépasse).
 *
 * @param counts Position courante (6 compteurs).
 * @param dice Lancer [d1, d2].
 * @returns La position résultante optimale, ou `null` si aucun coup possible.
 */
function applyBearoffRoll(
    counts: number[],
    dice: [number, number],
): number[][] {
    const [d1, d2] = dice;
    const isDouble = d1 === d2;
    // Pour un non-double, les deux ordres de dés sont légaux : on explore les
    // deux. Pour un double, les 4 coups sont identiques.
    const orders: number[][] = isDouble
        ? [[d1, d1, d1, d1]]
        : [[d1, d2], [d2, d1]];

    // On explore récursivement TOUTES les façons d'utiliser les dés et on
    // collecte toutes les positions résultantes distinctes. Le choix optimal
    // (minimisant l'espérance) est fait par l'appelant, qui connaît la table.
    const results = new Map<string, number[]>();

    const recurse = (cur: number[], diceIdx: number, diceList: number[]) => {
        if (diceIdx >= diceList.length) {
            results.set(cur.join(','), cur.slice());
            return;
        }
        const die = diceList[diceIdx];
        let highest = -1;
        for (let p = HOME_POINTS - 1; p >= 0; p--) {
            if (cur[p] > 0) {
                highest = p;
                break;
            }
        }
        if (highest === -1) {
            // Tous les pions sont sortis
            results.set(cur.join(','), cur.slice());
            return;
        }

        let moved = false;

        if (die > highest + 1) {
            // Règle officielle : si le dé est supérieur à tout point occupé,
            // on sort un pion du point occupé le plus reculé (highest).
            const next = cur.slice();
            next[highest]--;
            recurse(next, diceIdx + 1, diceList);
            moved = true;
        } else {
            // Dé <= highest + 1 : on peut sortir exactement sur le point die-1,
            // ou déplacer un pion d'un point p >= die vers p - die.
            for (let p = 0; p < HOME_POINTS; p++) {
                if (cur[p] === 0) continue;
                const point = p + 1; // flèche 1..6
                if (point === die) {
                    // Sortie exacte
                    const next = cur.slice();
                    next[p]--;
                    recurse(next, diceIdx + 1, diceList);
                    moved = true;
                } else if (point > die) {
                    // Déplacement interne (flèche p -> p - die)
                    const dest = p - die;
                    const next = cur.slice();
                    next[p]--;
                    next[dest]++;
                    recurse(next, diceIdx + 1, diceList);
                    moved = true;
                }
            }
        }

        if (!moved) {
            // Aucun coup possible avec ce dé : on le « perd ».
            recurse(cur, diceIdx + 1, diceList);
        }
    };

    for (const diceList of orders) {
        recurse(counts.slice(), 0, diceList);
    }
    return Array.from(results.values());
}

/**
 * Table d'espérance de bear-off (singleton lazy, générée au premier accès).
 *
 * Chaque entrée `table[index]` = espérance de jets × 100 pour sortir tous les
 * pions depuis la position `index`.
 */
let table: Uint16Array | null = null;

/**
 * Construit la table complète par programmation dynamique.
 *
 * On itère par nombre croissant de pions restants : l'espérance d'une position
 * dépend uniquement de positions ayant strictement moins de pions (après un
 * lancer, on a sorti >= 1 pion, sauf si aucun coup n'est possible — cas
 * impossible en bear-off pur tant qu'il reste des pions et qu'un dé peut
 * sortir ou déplacer).
 */
function buildTable(): Uint16Array {
    const t = new Uint16Array(BEAROFF_STATE_COUNT);
    const rolls = generateRolls();

    // Position vide (0 pions) : espérance 0.
    t[0] = 0;

    // Précalcule le pip count de chaque état (déterministe, sans sort instable).
    const pip = new Uint16Array(BEAROFF_STATE_COUNT);
    for (let idx = 0; idx < BEAROFF_STATE_COUNT; idx++) {
        const c = bearoffDecode(idx);
        let p = 0;
        for (let i = 0; i < HOME_POINTS; i++) p += c[i] * (i + 1);
        pip[idx] = p;
    }

    // Regroupe les états par pip count croissant (ordre topologique strict :
    // un lancer réduit TOUJOURS le pip count, donc aucune dépendance entre
    // états de même pip count).
    const maxPip = MAX_CHECKERS * HOME_POINTS; // 90
    const buckets: number[][] = Array.from({ length: maxPip + 1 }, () => []);
    for (let idx = 0; idx < BEAROFF_STATE_COUNT; idx++) {
        buckets[pip[idx]].push(idx);
    }

    for (let p = 1; p <= maxPip; p++) {
        for (const idx of buckets[p]) {
            const counts = bearoffDecode(idx);

            // E[counts] = 1 + sum_over_rolls( weight * min_over_results(E[result]) )
            let expected = 0;
            for (const { dice, weight } of rolls) {
                const results = applyBearoffRoll(counts, dice);
                if (results.length === 0) {
                    // Aucun coup possible : on reste sur place (ne devrait pas
                    // arriver en bear-off pur, mais par sécurité on compte 1 jet).
                    expected += weight * (t[idx] / SCALE);
                    continue;
                }
                let bestE = Infinity;
                for (const result of results) {
                    const resultIdx = bearoffIndex(result);
                    const e = t[resultIdx] / SCALE;
                    if (e < bestE) bestE = e;
                }
                expected += weight * bestE;
            }
            const value = 1 + expected;
            t[idx] = Math.min(65535, Math.round(value * SCALE));
        }
    }

    return t;
}

import { BEAROFF_DATA_BASE64 } from './bearoffData';

function decodeBase64ToUint16(b64: string): Uint16Array {
    if (typeof Buffer !== 'undefined') {
        const buf = Buffer.from(b64, 'base64');
        return new Uint16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2);
    }
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Uint16Array(bytes.buffer);
}

/**
 * Retourne la table d'espérance de bear-off (chargée instantanément < 1 ms).
 */
export function getBearoffTable(): Uint16Array {
    if (table === null) {
        if (BEAROFF_DATA_BASE64 && BEAROFF_DATA_BASE64.length > 0) {
            table = decodeBase64ToUint16(BEAROFF_DATA_BASE64);
        } else {
            table = buildTable();
        }
    }
    return table;
}

/**
 * Espérance exacte du nombre de lancers pour sortir tous les pions d'une
 * position de bear-off à un côté.
 *
 * @param counts Compteurs de pions sur les 6 flèches (index 0..5, somme <= 15).
 * @returns Espérance en lancers (nombre réel, précision 0.01).
 */
export function bearoffExpectedRolls(counts: number[]): number {
    const idx = bearoffIndex(counts);
    return getBearoffTable()[idx] / SCALE;
}

/**
 * Réinitialise la table (utile pour les tests).
 */
export function resetBearoffTable(): void {
    table = null;
}
