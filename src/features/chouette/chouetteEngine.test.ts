import { describe, expect, it } from 'vitest';
import {
    DEFAULT_CLUB_CHOUETTE_CONFIG,
    applyOpeningAutomaticDouble,
    canPlayerConsultOnCheckerPlay,
    canPlayerConsultOnCubeAction,
    createInitialChouetteCubes,
    handleCaptainDropMidGame,
    resolveBoxInitialDoubleTeamResponses,
    resolveChouetteLedgerRow,
    resolveInitialDiceHierarchy,
    rotateChouetteQueueAfterGame,
    validateBoxTakeOnTeamInitialDoubles,
    type ChouetteConfig,
} from './chouetteEngine';

describe('chouetteEngine — Moteur de Chouette de Club (3 à 5 joueurs) & Livre de Comptes', () => {
    const sampleRolls4 = [
        { playerId: 'p1', name: 'Alice', die: 6 },
        { playerId: 'p2', name: 'Bob', die: 5 },
        { playerId: 'p3', name: 'Claire', die: 3 },
        { playerId: 'p4', name: 'David', die: 1 },
    ] as const;

    it('1.1. attribue Box (Rang 1), Capitaine (Rang 2) et Partenaires (Rangs 3..N) et détecte les ex-æquo', () => {
        const res = resolveInitialDiceHierarchy(sampleRolls4);
        expect(res.resolved).toBe(true);
        expect(res.tiedGroups).toHaveLength(0);
        expect(res.players.map((p) => ({ id: p.playerId, role: p.role, q: p.queueIndex }))).toEqual([
            { id: 'p1', role: 'BOX', q: 0 },
            { id: 'p2', role: 'CAPTAIN', q: 1 },
            { id: 'p3', role: 'PARTNER', q: 2 },
            { id: 'p4', role: 'PARTNER', q: 3 },
        ]);

        // Test d'égalité entre 2 joueurs
        const tied = resolveInitialDiceHierarchy([
            { playerId: 'p1', name: 'Alice', die: 6 },
            { playerId: 'p2', name: 'Bob', die: 4 },
            { playerId: 'p3', name: 'Claire', die: 4 },
        ]);
        expect(tied.resolved).toBe(false);
        expect(tied.tiedGroups).toEqual([['p2', 'p3']]);
    });

    it('1.2. isole strictement le droit de consultation (Pay to Play sur les dames, interdiction totale sur le videau)', () => {
        const { players } = resolveInitialDiceHierarchy(sampleRolls4);
        const cubes = createInitialChouetteCubes(players, DEFAULT_CLUB_CHOUETTE_CONFIG);
        expect(cubes).toHaveLength(3); // N - 1 videaux

        // Interdiction absolue sur le videau
        expect(canPlayerConsultOnCubeAction()).toBe(false);

        // Au départ (videaux centrés à 1), personne ne peut consulter en mode PAY_TO_PLAY
        expect(canPlayerConsultOnCheckerPlay('p1', players, cubes, DEFAULT_CLUB_CHOUETTE_CONFIG)).toBe(false); // Box
        expect(canPlayerConsultOnCheckerPlay('p2', players, cubes, DEFAULT_CLUB_CHOUETTE_CONFIG)).toBe(false);
        expect(canPlayerConsultOnCheckerPlay('p3', players, cubes, DEFAULT_CLUB_CHOUETTE_CONFIG)).toBe(false);

        // Dès que le videau de Claire (p3) est tourné et accepté (IN_PLAY, value=2, isTurned=true), Claire peut consulter
        const turnedCubes = cubes.map((c) =>
            c.currentOwnerId === 'p3'
                ? { ...c, value: 2, isTurned: true, ownerSide: 'BOX' as const, state: 'IN_PLAY' as const }
                : c,
        );
        expect(canPlayerConsultOnCheckerPlay('p3', players, turnedCubes, DEFAULT_CLUB_CHOUETTE_CONFIG)).toBe(true);
        expect(canPlayerConsultOnCheckerPlay('p4', players, turnedCubes, DEFAULT_CLUB_CHOUETTE_CONFIG)).toBe(false);

        // Si un joueur a abandonné (DROPPED_BY_TEAM), il perd tout droit de parole même en FULL_FROM_START
        const fullConsultConfig: ChouetteConfig = {
            ...DEFAULT_CLUB_CHOUETTE_CONFIG,
            consultationPolicy: 'FULL_FROM_START',
        };
        const droppedCubes = cubes.map((c) =>
            c.currentOwnerId === 'p4' ? { ...c, state: 'DROPPED_BY_TEAM' as const } : c,
        );
        expect(canPlayerConsultOnCheckerPlay('p4', players, droppedCubes, fullConsultConfig)).toBe(false);
        expect(canPlayerConsultOnCheckerPlay('p2', players, droppedCubes, fullConsultConfig)).toBe(true);
    });

    it('1.2b. applique les quotas de prise du Box (AT_LEAST_HALF) et la règle de Cambridge (maintien du Capitaine)', () => {
        const { players } = resolveInitialDiceHierarchy(sampleRolls4);
        const cubes = createInitialChouetteCubes(players, DEFAULT_CLUB_CHOUETTE_CONFIG);
        const allOffered = cubes.map((c) => c.cubeId);

        // 1 seul videau accepté sur 3 (< 50 %) -> refusé par AT_LEAST_HALF
        const tooFew = validateBoxTakeOnTeamInitialDoubles(
            allOffered,
            ['cube-p2'],
            cubes,
            players,
            DEFAULT_CLUB_CHOUETTE_CONFIG,
        );
        expect(tooFew.valid).toBe(false);

        // 2 videaux acceptés sur 3 (>= 50 %), mais le Box refuse le Capitaine (p2) pour prendre p3 et p4 -> refusé par Cambridge
        const droppedCaptain = validateBoxTakeOnTeamInitialDoubles(
            allOffered,
            ['cube-p3', 'cube-p4'],
            cubes,
            players,
            DEFAULT_CLUB_CHOUETTE_CONFIG,
        );
        expect(droppedCaptain.valid).toBe(false);
        expect(droppedCaptain.reason).toContain('Cambridge');

        // 2 videaux acceptés incluant le Capitaine (p2 et p3) -> valide
        const validTake = validateBoxTakeOnTeamInitialDoubles(
            allOffered,
            ['cube-p2', 'cube-p3'],
            cubes,
            players,
            DEFAULT_CLUB_CHOUETTE_CONFIG,
        );
        expect(validTake.valid).toBe(true);
    });

    it('1.3. gère la passation de capitanat en cours de manche, le rachat par Extras et la rotation de file', () => {
        const { players } = resolveInitialDiceHierarchy(sampleRolls4);
        const cubes = createInitialChouetteCubes(players, DEFAULT_CLUB_CHOUETTE_CONFIG);

        // Le Box double à 2 : p2 (Capitaine) et p3 refusent, seul p4 (David) accepte ("Lone Holdout")
        const holdoutRes = resolveBoxInitialDoubleTeamResponses(
            cubes,
            {
                p2: { action: 'DROP', offerExtraIfLoneHoldout: true },
                p3: { action: 'DROP', offerExtraIfLoneHoldout: true },
                p4: { action: 'TAKE' },
            },
            DEFAULT_CLUB_CHOUETTE_CONFIG,
        );

        // David (p4) reçoit 2 points d'Extras immédiats (1 de p2, 1 de p3) et détient désormais les 3 videaux à 2
        expect(holdoutRes.extraTransactions).toHaveLength(2);
        expect(holdoutRes.updatedCubes.every((c) => c.currentOwnerId === 'p4' && c.value === 2 && c.isTurned)).toBe(true);

        // Passation de capitanat en cours de manche : p2 ayant lâché, p4 devient le Capitaine actif
        const midGamePlayers = handleCaptainDropMidGame(players, holdoutRes.updatedCubes, 'p2');
        const newCaptain = midGamePlayers.find((p) => p.role === 'CAPTAIN');
        expect(newCaptain?.playerId).toBe('p4');
        expect(midGamePlayers[midGamePlayers.length - 1].playerId).toBe('p2');

        // Rotation en fin de manche si le Capitaine actif (p4) bat le Box (p1) :
        // p4 devient le nouveau Box (q=0), p1 va en queue de file (q=3)
        const rotatedAfterCaptainWin = rotateChouetteQueueAfterGame(midGamePlayers, 'p4', 'TEAM');
        expect(rotatedAfterCaptainWin[0]).toMatchObject({ playerId: 'p4', role: 'BOX', queueIndex: 0 });
        expect(rotatedAfterCaptainWin[3]).toMatchObject({ playerId: 'p1', role: 'PARTNER', queueIndex: 3 });

        // Rotation si le Box (p1) bat le Capitaine initial (p2) :
        // p1 reste Box (q=0), p3 monte Capitaine (q=1), p2 va en queue (q=3)
        const rotatedAfterBoxWin = rotateChouetteQueueAfterGame(players, 'p2', 'BOX');
        expect(rotatedAfterBoxWin[0]).toMatchObject({ playerId: 'p1', role: 'BOX', queueIndex: 0 });
        expect(rotatedAfterBoxWin[1]).toMatchObject({ playerId: 'p3', role: 'CAPTAIN', queueIndex: 1 });
        expect(rotatedAfterBoxWin[3]).toMatchObject({ playerId: 'p2', role: 'PARTNER', queueIndex: 3 });
    });

    it('1.5. garantit l’invariance à somme nulle (∑ ΔS_i = 0) du Livre de Comptes avec Jacoby par videau et Extras', () => {
        const { players } = resolveInitialDiceHierarchy(sampleRolls4);
        const cubes = applyOpeningAutomaticDouble(
            createInitialChouetteCubes(players, { ...DEFAULT_CLUB_CHOUETTE_CONFIG, allowAutomatics: true }),
            { ...DEFAULT_CLUB_CHOUETTE_CONFIG, allowAutomatics: true },
            false,
        );

        // Scénario complexe :
        // - p2 (Capitaine) a son videau tourné à 2 (IN_PLAY, isTurned = true)
        // - p3 (Partenaire) a refusé un doublement à 2 en cours de manche (DROPPED_BY_TEAM, value = 2)
        // - p4 (Partenaire) a gardé son videau centré à 1 (CENTERED, isTurned = false)
        // - L'Équipe gagne par Gammon (boardMultiplier = 2) avec Jacoby actif :
        //   * p2 gagne 2 * 2 = +4 contre le Box
        //   * p3 a déjà perdu -2 en abandonnant face au Box (+2 pour le Box)
        //   * p4 ne gagne que +1 (et non +2) car son videau n'a pas été tourné (règle de Jacoby individuelle)
        //   * Bilan Box (p1) : -4 + 2 - 1 = -3
        const scenarioCubes = [
            { ...cubes[0], value: 2, isTurned: true, ownerSide: 'TEAM' as const, state: 'IN_PLAY' as const },
            { ...cubes[1], value: 2, isTurned: true, ownerSide: 'BOX' as const, state: 'DROPPED_BY_TEAM' as const },
            { ...cubes[2], value: 1, isTurned: false, ownerSide: 'CENTER' as const, state: 'CENTERED' as const },
        ];

        const ledgerRow = resolveChouetteLedgerRow(players, {
            boxPlayerId: 'p1',
            activeCaptainId: 'p2',
            winnerSide: 'TEAM',
            boardMultiplier: 2, // Gammon sur le tablier
            jacobyEnabled: true,
            cubes: scenarioCubes,
            extraTransactions: [],
        });

        expect(ledgerRow.zeroSumVerified).toBe(true);
        expect(ledgerRow.deltas).toEqual({
            p1: -3,
            p2: 4,
            p3: -2,
            p4: 1,
        });
        const sum = Object.values(ledgerRow.deltas).reduce((a, b) => a + b, 0);
        expect(sum).toBe(0);
        expect(ledgerRow.nextBoxPlayerId).toBe('p2');
    });
});
