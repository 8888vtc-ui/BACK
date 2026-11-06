/**
 * Banque de Quiz — UNIQUEMENT des positions validées par GNU Backgammon 3-ply cubeful.
 *
 * Purge `db_clean_v3` (2026-11-02) : toutes les anciennes banques non vérifiées ont été supprimées
 * (voir BOTS_AUDIT_POSTMORTEM.md). Palier = écart d'équité #1/#2 mesuré par GNUBG
 * (≥ 0.080 : Débutant · ≥ 0.045 : Intermédiaire · ≥ 0.020 : Club · < 0.020 : Grand-Maître).
 */

import type { PlayerBlunderRecord, DrillTier, BlunderVerdict } from './types';
import { parseXGID, X_BAR, O_BAR, X_OFF, O_OFF } from '../../engine/backgammonEngine';
import { validateBoardState, resolveSemanticArchetype } from './drillSubAgentsPipeline';
import { GNUBG_3PLY_CERTIFIED_POSITIONS } from '../../lib/engine/gnubg3PlyCertifiedPositions';
import { GNUBG_3PLY_QUIZ_BANK } from './gnubg3PlyQuizBank';
import { BGSAGE_3PLY_FACTORY_SEED } from './bgsage3PlyFactorySeed';

function boardFromXgid(xgid: string): number[] {
    const parsed = parseXGID(xgid);
    const b = new Array<number>(28).fill(0);
    for (let i = 0; i < parsed.board.length && i < 28; i++) {
        b[i] = parsed.board[i] ?? 0;
    }
    // Si l'XGID avait le trait à O (turn === 'O'), la notation des coups du seed (ex: 8/4 6/4)
    // est exprimée dans le référentiel relatif du joueur au trait (24 -> 1).
    // On oriente donc le plateau dans le référentiel du joueur X (24 -> 1) en respectant
    // strictement les constantes backgammonEngine (X_BAR = 0, O_BAR = 25, X_OFF = 26, O_OFF = 27) !
    if (parsed.turn === 'O') {
        const flipped = new Array<number>(28).fill(0);
        for (let pt = 1; pt <= 24; pt++) {
            flipped[25 - pt] = -(b[pt] ?? 0);
        }
        flipped[X_BAR] = Math.abs(b[O_BAR] ?? 0); // Barre de O (25) -> Barre de X (0)
        flipped[O_BAR] = -Math.abs(b[X_BAR] ?? 0); // Barre de X (0) -> Barre de O (25)
        flipped[X_OFF] = Math.abs(b[O_OFF] ?? 0); // Off de O (27) -> Off de X (26)
        flipped[O_OFF] = -Math.abs(b[X_OFF] ?? 0); // Off de X (26) -> Off de O (27)
        return validateBoardState(flipped, 'X').normalizedBoard;
    }
    return validateBoardState(b, 'X').normalizedBoard;
}

export interface HarvestedSeedInput {
    id: string;
    tier: DrillTier;
    xgid: string;
    dice: [number, number];
    playedMove: string;
    optimalMove: string;
    acceptableMoves?: string[];
    quizChoices: string[];
    equityLoss: number;
    verdict: BlunderVerdict;
    conceptId: string;
    conceptName: string;
    whyFailed: string;
    explanation: string;
    proverb: string;
    hint: string;
    commentaryVariants: string[];
    quizTargetER?: number;
    quizType?: 'CHECKER_PLAY' | 'CUBE_DECISION';
    candidateMoves3Ply?: ReadonlyArray<{
        readonly rank: number;
        readonly notation: string;
        readonly equityLoss: number;
        readonly win: number;
        readonly winGammon: number;
    }>;
    plyCount?: number;
}

function extractMatchContextFromXgid(xgid: string): NonNullable<PlayerBlunderRecord['matchContext']> {
    // Format XGID: XGID=board:cube_val_exp:cube_pos:turn:dice:score_bottom:score_top:crawford:match_length:max_cube
    const parts = xgid.split(':');
    const cubeExp = Number(parts[1] ?? 0);
    const cubeValue = cubeExp > 0 ? Math.pow(2, cubeExp) : 1;
    const cubePos = Number(parts[2] ?? 0);
    const turnRaw = Number(parts[3] ?? 1);
    const scoreBottom = Number(parts[5] ?? 0);
    const scoreTop = Number(parts[6] ?? 0);
    const crawford = Number(parts[7] ?? 0) === 1;
    const matchLength = Number(parts[8] ?? 7);

    // Comme le plateau est orienté dans le référentiel de X, on aligne le score et le possesseur du videau
    const scoreX = turnRaw === -1 ? scoreTop : scoreBottom;
    const scoreO = turnRaw === -1 ? scoreBottom : scoreTop;
    const cubeOwner =
        cubePos === 0
            ? null
            : (cubePos === 1 && turnRaw === 1) || (cubePos === -1 && turnRaw === -1)
                ? 'X'
                : 'O';

    return {
        scoreX: Number.isFinite(scoreX) ? scoreX : 0,
        scoreO: Number.isFinite(scoreO) ? scoreO : 0,
        matchLength: Number.isFinite(matchLength) ? matchLength : 7,
        cubeValue: Number.isFinite(cubeValue) ? cubeValue : 1,
        cubeOwner,
        crawford,
    };
}

function buildHarvestedBlunder(seed: HarvestedSeedInput, _idx: number): PlayerBlunderRecord {
    let cachedBoard: number[] | null = null;
    let cachedContext: NonNullable<PlayerBlunderRecord['matchContext']> | null = null;
    let cachedSemantic: ReturnType<typeof resolveSemanticArchetype> | null = null;
    const ensureBoard = (): number[] => {
        if (!cachedBoard) {
            cachedBoard = boardFromXgid(seed.xgid);
        }
        return cachedBoard;
    };
    const ensureSemantic = (): ReturnType<typeof resolveSemanticArchetype> => {
        if (!cachedSemantic) {
            cachedSemantic = resolveSemanticArchetype(ensureBoard(), {
                conceptId: seed.conceptId,
                conceptName: seed.conceptName,
                proverb: seed.proverb,
                optimalMove: seed.optimalMove,
            });
        }
        return cachedSemantic;
    };
    return {
        id: seed.id,
        createdAt: '2026-01-10T00:00:00.000Z',
        get board(): number[] {
            return ensureBoard();
        },
        set board(val: number[]) {
            cachedBoard = val;
            cachedSemantic = null;
        },
        get matchContext(): NonNullable<PlayerBlunderRecord['matchContext']> {
            if (!cachedContext) {
                cachedContext = extractMatchContextFromXgid(seed.xgid);
            }
            return cachedContext;
        },
        set matchContext(val: NonNullable<PlayerBlunderRecord['matchContext']>) {
            cachedContext = val;
        },
        dice: seed.dice,
        player: 'X',
        playedMove: seed.playedMove,
        optimalMove: seed.optimalMove,
        acceptableMoves: seed.acceptableMoves ?? [],
        quizChoices: seed.quizChoices,
        equityLoss: seed.equityLoss,
        verdict: seed.verdict,
        get conceptId(): string {
            return ensureSemantic().conceptId;
        },
        set conceptId(val: string) {
            seed.conceptId = val;
            cachedSemantic = null;
        },
        get conceptName(): string {
            return ensureSemantic().conceptName;
        },
        set conceptName(val: string) {
            seed.conceptName = val;
            cachedSemantic = null;
        },
        whyFailed: seed.whyFailed,
        explanation: seed.explanation,
        get proverb(): string {
            return ensureSemantic().proverb;
        },
        set proverb(val: string) {
            seed.proverb = val;
            cachedSemantic = null;
        },
        hint: seed.hint,
        commentaryVariants: seed.commentaryVariants && seed.commentaryVariants.length >= 3
            ? seed.commentaryVariants
            : [
                `GNU Backgammon 3-ply : ${seed.optimalMove} surclasse ${seed.playedMove}.`,
                `Analyse Open Sage / GNUBG : ${seed.explanation || seed.whyFailed}`,
                `Classement tactique 3-ply : ${seed.quizChoices.join(' > ')}`,
              ],
        tier: seed.tier,
        quizTargetER: seed.quizTargetER,
        quizType: seed.quizType,
        candidateMoves3Ply: seed.candidateMoves3Ply,
        plyCount: seed.plyCount ?? 3,
        timesReviewed: 0,
        timesSolved: 0,
        isMastered: false,
    };
}

// =====================================================================================
// BANQUE DE QUIZ — 100 % VALIDÉE PAR GNU BACKGAMMON 3-PLY CUBEFUL (purge db_clean_v3, 2026-11-02)
// Les anciennes banques non vérifiées (BT-Core 5000, BT-PR_ONLY, multi-ply 0/1/2-ply, positions
// « benchmark » écrites à la main) ont été supprimées. Seules 2 sources restent :
//   1. GNUBG_3PLY_CERTIFIED_POSITIONS (scripts/verify_3ply_with_gnubg.ts)
//   2. GNUBG_3PLY_QUIZ_BANK          (scripts/generate_50k_3ply_quizzes.ts → build_gnubg_quiz_bank.ts)
// =====================================================================================

const CONCEPT_NAMES: Readonly<Record<string, string>> = {
    opening: 'Ouvertures & Développement',
    blot_safety: 'Sécurité des Blots & Duplication',
    prime_building: 'Construction de Prime (Mur)',
    blitz_attack: 'Blitz & Attaque de Jan',
    advanced_anchor: 'Jeu de Retenue & Ancre Avancée',
    backgame: 'Backgame & Timing Défensif',
    cube_decision: 'Jeu de Pions sous Pression de Videau',
};

const CONCEPT_PRINCIPLES: Readonly<Record<string, string>> = {
    opening: 'En début de partie, développez vos bâtisseurs vers les points clés sans exposer de blots inutiles.',
    blot_safety: 'Comptez les tirs adverses (sur 36) avant de laisser un blot : chaque tir évité est de l’équité gagnée.',
    prime_building: 'Chaque point contigu ajouté à votre barrage réduit les chances d’évasion des pions arrières adverses.',
    blitz_attack: 'En attaque, frapper et couvrir vite dans votre jan intérieur prive l’adversaire de contre-jeu.',
    advanced_anchor: 'Une ancre avancée (points 20 ou 21) protège contre le gammon et garde du contact.',
    backgame: 'En défense profonde, le timing (pions encore disponibles) décide de la valeur de la position.',
    cube_decision: 'Sous pression de videau, privilégiez les coups qui conservent du jeu sans risque de gammon inutile.',
};

interface GnubgCandidate {
    readonly notation: string;
    readonly equityLoss: number;
    readonly win: number;
    readonly winGammon: number;
}

/** Palier par écart #1/#2 mesuré par GNUBG : gros écart = coup facile à trouver. */
function tierFromGap(gap: number): DrillTier {
    if (gap >= 0.08) return 1;
    if (gap >= 0.045) return 2;
    if (gap >= 0.02) return 3;
    return 4;
}

function seedFromGnubg(
    id: string,
    xgid: string,
    dice: readonly [number, number],
    conceptId: string,
    moves: readonly GnubgCandidate[],
): HarvestedSeedInput | null {
    if (moves.length < 4) return null;
    const best = moves[0]!;
    const second = moves[1]!;
    const gap = second.equityLoss;
    const conceptName = CONCEPT_NAMES[conceptId] ?? 'Position de contact';
    const winPct = (best.win * 100).toFixed(1);
    const gammonPct = (best.winGammon * 100).toFixed(1);
    return {
        id,
        tier: tierFromGap(gap),
        xgid,
        dice: [dice[0], dice[1]],
        playedMove: second.notation,
        optimalMove: best.notation,
        acceptableMoves: moves.slice(1).filter((m) => m.equityLoss <= 0.015).map((m) => m.notation),
        quizChoices: moves.slice(0, 4).map((m) => m.notation),
        equityLoss: gap,
        verdict: gap >= 0.08 ? 'blunder' : 'doubtful',
        conceptId,
        conceptName,
        whyFailed: `${second.notation} perd ${gap.toFixed(3)} EMG face à ${best.notation} (GNU Backgammon 3-ply cubeful).`,
        explanation: `GNU Backgammon 3-ply classe ${best.notation} en n°1 : ${winPct} % de gain, ${gammonPct} % de gammon.`,
        proverb: CONCEPT_PRINCIPLES[conceptId] ?? 'Comparez les coups candidats sur les 36 lancers adverses.',
        hint: 'Observez le compte de course et vos 36 lancers constructifs avant de valider votre coup.',
        commentaryVariants: [
            `GNU Backgammon 3-ply : ${best.notation} devance ${second.notation} de ${gap.toFixed(3)} EMG.`,
            `${best.notation} : ${winPct} % de victoires selon GNU Backgammon 3-ply.`,
            `Classement GNUBG 3-ply : ${moves.slice(0, 4).map((m) => m.notation).join(' > ')}.`,
        ],
    };
}

function buildGnubgOnlyBank(): PlayerBlunderRecord[] {
    const seenXgid = new Set<string>();
    const seeds: HarvestedSeedInput[] = [];
    const push = (s: HarvestedSeedInput | null): void => {
        if (!s || seenXgid.has(s.xgid)) return;
        seenXgid.add(s.xgid);
        seeds.push(s);
    };
    for (const s of BGSAGE_3PLY_FACTORY_SEED) {
        push(s);
    }
    for (const p of GNUBG_3PLY_CERTIFIED_POSITIONS) {
        push(seedFromGnubg(p.id, p.xgid, p.dice, p.conceptId, p.moves));
    }
    for (const q of GNUBG_3PLY_QUIZ_BANK) {
        push(seedFromGnubg(q.id, q.xgid, q.dice, q.conceptId, q.candidateMoves3Ply));
    }
    return seeds
        .map((s, idx) => buildHarvestedBlunder(s, idx))
        .filter((b) => {
            const v = validateBoardState(b.board, b.player);
            return v.whitePips < 145 && v.blackPips < 145;
        });
}

export const BENCHMARK_BLUNDERS: PlayerBlunderRecord[] = buildGnubgOnlyBank();

/** Ensemble des XGID validés par GNUBG (utilisé par le garde-fou « zéro ancien quiz »). */
export const GNUBG_VERIFIED_XGIDS: ReadonlySet<string> = new Set([
    ...BGSAGE_3PLY_FACTORY_SEED.map((s) => s.xgid),
    ...GNUBG_3PLY_CERTIFIED_POSITIONS.map((p) => p.xgid),
    ...GNUBG_3PLY_QUIZ_BANK.map((q) => q.xgid),
]);
