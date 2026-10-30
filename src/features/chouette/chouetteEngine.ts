/**
 * Moteur de « Chouette de Club » (3 à 5 Joueurs) & Livre de Comptes à Somme Nulle (`chouetteEngine.ts`).
 *
 * Rôle :
 *   Implémente la machine à états finis déterministe et le moteur comptable d'une Chouette
 *   de club conforme aux règlements internationaux (ABA, UKBGF, Cambridge, Brighton, Gold Coast) :
 *   1. Désignation initiale aux dés (Box = Rang 1, Capitaine = Rang 2, Partenaires = Rangs 3..N).
 *   2. Gestion asymétrique des videaux (Single Cube vs Multiple Cubes), quotas de prise du Box,
 *      maintien du Capitaine sur le plus haut videau (règle de Cambridge), et consultation `PAY_TO_PLAY`.
 *   3. Rotation dynamique de la file de succession, passation de capitanat et rachat par « Extras ».
 *   4. Résolution granulaire par videau du Livre de Comptes (`resolveChouetteLedgerRow`) avec
 *      règle de Jacoby individuelle et invariant strict à somme nulle (∑ ΔS_i = 0).
 *
 * Strictement 0 `any`, ≤ 400 lignes.
 */

export type Role = 'BOX' | 'CAPTAIN' | 'PARTNER';
export type CubeState = 'CENTERED' | 'IN_PLAY' | 'DROPPED_BY_TEAM' | 'DROPPED_BY_BOX';

export interface ChouetteConfig {
    readonly maxPlayers: 3 | 4 | 5;
    readonly cubeMode: 'SINGLE' | 'MULTIPLE';
    readonly consultationPolicy: 'PAY_TO_PLAY' | 'FULL_FROM_START' | 'NONE';
    readonly jacobyRule: boolean;
    readonly allowAutomatics: boolean;
    readonly allowBeavers: boolean;
    readonly initialBoxTakeQuota: 'ALL_OR_NOTHING' | 'AT_LEAST_HALF' | 'FREE_IF_SPLIT';
    readonly keepCaptainOnHighestCube: boolean;
    readonly loneHoldoutPolicy: 'ALLOW_FREE' | 'FORCED_DROP' | 'MUST_ACCEPT_EXTRAS';
    readonly boxDropsCaptainSuccession: 'CAPTAIN_BECOMES_BOX' | 'FINISHING_CAPTAIN_DECIDES';
}

export const DEFAULT_CLUB_CHOUETTE_CONFIG: ChouetteConfig = Object.freeze({
    maxPlayers: 5,
    cubeMode: 'MULTIPLE',
    consultationPolicy: 'PAY_TO_PLAY',
    jacobyRule: true,
    allowAutomatics: false,
    allowBeavers: false,
    initialBoxTakeQuota: 'AT_LEAST_HALF',
    keepCaptainOnHighestCube: true,
    loneHoldoutPolicy: 'MUST_ACCEPT_EXTRAS',
    boxDropsCaptainSuccession: 'CAPTAIN_BECOMES_BOX',
});

export interface DoublingCube {
    readonly cubeId: string;
    readonly initialOwnerId: string;
    readonly currentOwnerId: string;
    readonly baseStake: number;
    readonly value: number;
    readonly isTurned: boolean;
    readonly ownerSide: 'CENTER' | 'BOX' | 'TEAM';
    readonly state: CubeState;
}

export interface PlayerNode {
    readonly playerId: string;
    readonly name: string;
    readonly role: Role;
    readonly queueIndex: number;
    readonly cumulativeScore: number;
    readonly isProxyActive: boolean;
    readonly proxyTargetId?: string;
}

export interface InitialDieRollEntry {
    readonly playerId: string;
    readonly name: string;
    readonly die: number;
}

export interface InitialHierarchyResolution {
    readonly resolved: boolean;
    readonly tiedGroups: readonly (readonly string[])[];
    readonly players: readonly PlayerNode[];
}

export interface ExtraTransaction {
    readonly cubeId: string;
    readonly fromPlayerId: string;
    readonly toPlayerId: string;
    readonly compensationPaid: number;
}

export interface GameOutcomeInput {
    readonly boxPlayerId: string;
    readonly activeCaptainId: string;
    readonly winnerSide: 'BOX' | 'TEAM';
    readonly boardMultiplier: 1 | 2 | 3;
    readonly jacobyEnabled: boolean;
    readonly cubes: readonly DoublingCube[];
    readonly extraTransactions: readonly ExtraTransaction[];
}

export interface LedgerRowResult {
    readonly deltas: Record<string, number>;
    readonly updatedCumulativeScores: Record<string, number>;
    readonly zeroSumVerified: boolean;
    readonly nextBoxPlayerId: string;
}

/** 1.1. Résout le tirage aux dés initial pour 3 à 5 joueurs et isole les ex-æquo. */
export function resolveInitialDiceHierarchy(entries: readonly InitialDieRollEntry[]): InitialHierarchyResolution {
    if (entries.length < 3 || entries.length > 5) {
        throw new Error(`Une Chouette de club requiert entre 3 et 5 joueurs (reçu : ${entries.length}).`);
    }
    const sorted = [...entries].sort((a, b) => b.die - a.die);
    const byDie = new Map<number, string[]>();
    for (const entry of sorted) {
        const group = byDie.get(entry.die) ?? [];
        group.push(entry.playerId);
        byDie.set(entry.die, group);
    }
    const tiedGroups: string[][] = [];
    byDie.forEach((group) => { if (group.length > 1) tiedGroups.push(group); });
    const players: PlayerNode[] = sorted.map((entry, idx) => ({
        playerId: entry.playerId,
        name: entry.name,
        role: idx === 0 ? 'BOX' : idx === 1 ? 'CAPTAIN' : 'PARTNER',
        queueIndex: idx,
        cumulativeScore: 0,
        isProxyActive: false,
    }));
    return { resolved: tiedGroups.length === 0, tiedGroups, players };
}

/** Crée 1 videau central (`SINGLE`) ou N - 1 videaux (`MULTIPLE`) en début de manche. */
export function createInitialChouetteCubes(
    players: readonly PlayerNode[],
    config: ChouetteConfig,
    baseStake: number = 1,
): DoublingCube[] {
    if (baseStake <= 0 || !Number.isInteger(baseStake)) {
        throw new Error(`La mise unitaire baseStake doit être un entier positif (reçu : ${baseStake}).`);
    }
    const team = players.filter((p) => p.role !== 'BOX').sort((a, b) => a.queueIndex - b.queueIndex);
    if (config.cubeMode === 'SINGLE') {
        const cap = team[0];
        if (!cap) throw new Error('Aucun Capitaine trouvé pour initialiser le videau unique.');
        return [{
            cubeId: `cube-team-${cap.playerId}`, initialOwnerId: cap.playerId, currentOwnerId: cap.playerId,
            baseStake, value: 1, isTurned: false, ownerSide: 'CENTER', state: 'CENTERED',
        }];
    }
    return team.map((m) => ({
        cubeId: `cube-${m.playerId}`, initialOwnerId: m.playerId, currentOwnerId: m.playerId,
        baseStake, value: 1, isTurned: false, ownerSide: 'CENTER', state: 'CENTERED',
    }));
}

/** Applique la règle optionnelle des Automatics sur un doublé au jet d'ouverture. */
export function applyOpeningAutomaticDouble(
    cubes: readonly DoublingCube[],
    config: ChouetteConfig,
    isOpeningDouble: boolean,
    targetCubeIds?: readonly string[],
): DoublingCube[] {
    if (!config.allowAutomatics || !isOpeningDouble) return [...cubes];
    const targetSet = targetCubeIds ? new Set(targetCubeIds) : null;
    return cubes.map((c) =>
        c.state === 'CENTERED' && (!targetSet || targetSet.has(c.cubeId)) ? { ...c, value: 2 } : c,
    );
}

/** 1.2. Vérifie si un joueur a le droit de consulter sur le jeu des dames (`PAY_TO_PLAY`). */
export function canPlayerConsultOnCheckerPlay(
    playerId: string,
    players: readonly PlayerNode[],
    cubes: readonly DoublingCube[],
    config: ChouetteConfig,
): boolean {
    const player = players.find((p) => p.playerId === playerId);
    if (!player || player.role === 'BOX') return false;
    const owned = config.cubeMode === 'SINGLE' ? cubes : cubes.filter((c) => c.currentOwnerId === playerId);
    if (!owned.some((c) => c.state === 'CENTERED' || c.state === 'IN_PLAY')) return false;
    if (config.consultationPolicy === 'NONE') return false;
    if (config.consultationPolicy === 'FULL_FROM_START') return true;
    return owned.some((c) => c.state === 'IN_PLAY' && c.isTurned && c.value >= 2);
}

/** La consultation sur une décision de videau est strictement interdite (ABA 3.1 / UKBGF). */
export function canPlayerConsultOnCubeAction(): false {
    return false;
}

/** Valide les quotas de prise du Box et la règle de Cambridge (`keepCaptainOnHighestCube`). */
export function validateBoxTakeOnTeamInitialDoubles(
    offeredCubeIds: readonly string[],
    acceptedCubeIds: readonly string[],
    cubes: readonly DoublingCube[],
    players: readonly PlayerNode[],
    config: ChouetteConfig,
): { readonly valid: boolean; readonly reason?: string } {
    if (offeredCubeIds.length === 0) return { valid: true };
    const offeredSet = new Set(offeredCubeIds);
    const acceptedSet = new Set(acceptedCubeIds.filter((id) => offeredSet.has(id)));
    const centered = cubes.filter((c) => c.state === 'CENTERED');
    const allSimultaneous = centered.length > 0 && centered.every((c) => offeredSet.has(c.cubeId));

    if (acceptedSet.size > 0 && acceptedSet.size < offeredSet.size && allSimultaneous) {
        if (config.initialBoxTakeQuota === 'ALL_OR_NOTHING') {
            return { valid: false, reason: 'Règle ALL_OR_NOTHING : le Box doit tout accepter ou tout refuser.' };
        }
        if (config.initialBoxTakeQuota === 'AT_LEAST_HALF' && acceptedSet.size * 2 < offeredSet.size) {
            return { valid: false, reason: 'Règle AT_LEAST_HALF : le Box doit accepter au moins 50 % des videaux.' };
        }
    }

    if (config.keepCaptainOnHighestCube && acceptedSet.size > 0) {
        const cap = players.find((p) => p.role === 'CAPTAIN');
        const capCube = cap ? cubes.find((c) => c.currentOwnerId === cap.playerId && offeredSet.has(c.cubeId)) : undefined;
        const partnerTaken = cap && cubes.some(
            (c) => c.currentOwnerId !== cap.playerId && acceptedSet.has(c.cubeId) && (!capCube || c.value >= capCube.value),
        );
        if (capCube && !acceptedSet.has(capCube.cubeId) && partnerTaken) {
            return { valid: false, reason: 'Règle de Cambridge : à valeur égale, le Box doit maintenir le Capitaine en jeu.' };
        }
    }
    return { valid: true };
}

/** 1.3a. Passation de Capitanat en cours de manche lorsque le Capitaine actif sort de la manche. */
export function handleCaptainDropMidGame(
    players: readonly PlayerNode[],
    cubes: readonly DoublingCube[],
    droppingCaptainId: string,
): PlayerNode[] {
    const activeIds = new Set(
        cubes.filter((c) => c.state === 'CENTERED' || c.state === 'IN_PLAY').map((c) => c.currentOwnerId),
    );
    activeIds.delete(droppingCaptainId);

    const sorted = [...players].sort((a, b) => a.queueIndex - b.queueIndex);
    const box = sorted.find((p) => p.role === 'BOX');
    const droppingCap = sorted.find((p) => p.playerId === droppingCaptainId);
    if (!box || !droppingCap) return [...players];

    const otherTeam = sorted.filter((p) => p.role !== 'BOX' && p.playerId !== droppingCaptainId);
    const nextCap = otherTeam.find((p) => activeIds.has(p.playerId));
    if (!nextCap) return [...players];

    return [
        { ...box, role: 'BOX', queueIndex: 0 },
        ...[...otherTeam, droppingCap].map((member, idx) => ({
            ...member,
            role: (member.playerId === nextCap.playerId ? 'CAPTAIN' : 'PARTNER') as Role,
            queueIndex: idx + 1,
        })),
    ];
}

/** 1.3b. Résout le doublement initial du Box (1 -> 2) face à l'Équipe (`FORCED_DROP`, `MUST_ACCEPT_EXTRAS`, `ALLOW_FREE`). */
export function resolveBoxInitialDoubleTeamResponses(
    cubes: readonly DoublingCube[],
    decisions: Readonly<Record<string, { readonly action: 'TAKE' | 'DROP'; readonly offerExtraIfLoneHoldout?: boolean }>>,
    config: ChouetteConfig,
): { readonly updatedCubes: DoublingCube[]; readonly extraTransactions: ExtraTransaction[] } {
    const takers = cubes.filter((c) => decisions[c.currentOwnerId]?.action === 'TAKE');
    const isLoneHoldout = cubes.length >= 3 && takers.length === 1;

    if (isLoneHoldout && config.loneHoldoutPolicy === 'FORCED_DROP') {
        return { updatedCubes: cubes.map((c) => ({ ...c, state: 'DROPPED_BY_TEAM' })), extraTransactions: [] };
    }

    if (isLoneHoldout && config.loneHoldoutPolicy === 'MUST_ACCEPT_EXTRAS') {
        const holdoutId = takers[0].currentOwnerId;
        const extraTransactions: ExtraTransaction[] = [];
        const updatedCubes = cubes.map((c) => {
            if (c.currentOwnerId === holdoutId) {
                return { ...c, value: c.value * 2, isTurned: true, ownerSide: 'TEAM' as const, state: 'IN_PLAY' as const };
            }
            if (decisions[c.currentOwnerId]?.offerExtraIfLoneHoldout ?? true) {
                extraTransactions.push({
                    cubeId: c.cubeId, fromPlayerId: c.currentOwnerId, toPlayerId: holdoutId, compensationPaid: c.baseStake,
                });
                return {
                    ...c, currentOwnerId: holdoutId, value: c.value * 2,
                    isTurned: true, ownerSide: 'TEAM' as const, state: 'IN_PLAY' as const,
                };
            }
            return { ...c, state: 'DROPPED_BY_TEAM' as const };
        });
        return { updatedCubes, extraTransactions };
    }

    return {
        updatedCubes: cubes.map((c) =>
            decisions[c.currentOwnerId]?.action === 'TAKE'
                ? { ...c, value: c.value * 2, isTurned: true, ownerSide: 'TEAM' as const, state: 'IN_PLAY' as const }
                : { ...c, state: 'DROPPED_BY_TEAM' as const },
        ),
        extraTransactions: [],
    };
}

/** 1.3c. Rotation déterministe de la file d'attente Q = [q_0, q_1, ..., q_{N-1}] en fin de manche. */
export function rotateChouetteQueueAfterGame(
    players: readonly PlayerNode[],
    activeCaptainId: string,
    winnerSide: 'BOX' | 'TEAM',
): PlayerNode[] {
    const sorted = [...players].sort((a, b) => a.queueIndex - b.queueIndex);
    const box = sorted[0];
    const activeCaptain = sorted.find((p) => p.playerId === activeCaptainId) ?? sorted[1];
    if (!box || !activeCaptain) return [...players];

    const partners = sorted.filter((p) => p.playerId !== box.playerId && p.playerId !== activeCaptain.playerId);
    const nextOrder = winnerSide === 'BOX' ? [box, ...partners, activeCaptain] : [activeCaptain, ...partners, box];
    return nextOrder.map((p, idx) => ({
        ...p,
        role: idx === 0 ? 'BOX' : idx === 1 ? 'CAPTAIN' : 'PARTNER',
        queueIndex: idx,
    }));
}

/** 1.5. Résolution mathématique d'une ligne du Livre de Comptes à Somme Nulle (∑ ΔS_i = 0). */
export function resolveChouetteLedgerRow(
    players: readonly PlayerNode[],
    outcome: GameOutcomeInput,
): LedgerRowResult {
    const deltas: Record<string, number> = {};
    for (const p of players) deltas[p.playerId] = 0;

    for (const tx of outcome.extraTransactions) {
        deltas[tx.fromPlayerId] = (deltas[tx.fromPlayerId] ?? 0) - tx.compensationPaid;
        deltas[tx.toPlayerId] = (deltas[tx.toPlayerId] ?? 0) + tx.compensationPaid;
    }

    for (const cube of outcome.cubes) {
        let boxWinAmount = 0;
        if (cube.state === 'DROPPED_BY_TEAM') boxWinAmount = cube.value * cube.baseStake;
        else if (cube.state === 'DROPPED_BY_BOX') boxWinAmount = -(cube.value * cube.baseStake);
        else {
            const mult = !outcome.jacobyEnabled || cube.isTurned ? outcome.boardMultiplier : 1;
            const stakeValue = cube.value * cube.baseStake * mult;
            boxWinAmount = outcome.winnerSide === 'BOX' ? stakeValue : -stakeValue;
        }
        deltas[outcome.boxPlayerId] = (deltas[outcome.boxPlayerId] ?? 0) + boxWinAmount;
        deltas[cube.currentOwnerId] = (deltas[cube.currentOwnerId] ?? 0) - boxWinAmount;
    }

    const totalSum = Object.values(deltas).reduce((acc, val) => acc + val, 0);
    if (totalSum !== 0) {
        throw new Error(`Violation critique d'arbitrage Chouette : Somme de la ligne = ${totalSum} (attendu: 0).`);
    }

    const updatedCumulativeScores: Record<string, number> = {};
    for (const p of players) updatedCumulativeScores[p.playerId] = p.cumulativeScore + (deltas[p.playerId] ?? 0);

    return {
        deltas,
        updatedCumulativeScores,
        zeroSumVerified: true,
        nextBoxPlayerId: outcome.winnerSide === 'BOX' ? outcome.boxPlayerId : outcome.activeCaptainId,
    };
}
