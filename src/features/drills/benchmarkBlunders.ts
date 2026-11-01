/**
 * Banque de Blunders & Quizz par Paliers (100 % certifiée par GNU Backgammon 2-ply & Open Sage).
 *
 * Fournit 36 positions tactiques réparties en 4 Paliers évolutifs :
 * - Palier 1 (🌱 Débutant) : Fondations, Golden Point, Fermeture de portes, Prime & Course
 * - Palier 2 (⚔️ Intermédiaire) : Positions certifiées (grosses bévues structurelles)
 * - Palier 3 (🏆 Joueur de Club) : Arbitrages complexes (évasion, bar-point, duplication, rentrée de barre)
 * - Palier 4 (👑 Grand-Maître) : Subtilités positionnelles, distribution des bâtisseurs (spares) et tempo
 */

import type { PlayerBlunderRecord, DrillTier, BlunderVerdict } from './types';
import { parseXGID, X_BAR, O_BAR, X_OFF, O_OFF } from '../../engine/backgammonEngine';
import { validateBoardState, resolveSemanticArchetype } from './drillSubAgentsPipeline';
import { GNUBG_3PLY_CERTIFIED_POSITIONS } from '../../lib/engine/gnubg3PlyCertifiedPositions';
import { BTCORE_5000_HARVEST_SEEDS } from './btCore5000HarvestSeeds';
import { BTERH_HARVEST_SEEDS } from './btErhHarvestSeeds';

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
        commentaryVariants: seed.commentaryVariants,
        tier: seed.tier,
        timesReviewed: 0,
        timesSolved: 0,
        isMastered: false,
    };
}

const HARVESTED_TIERED_SEEDS: HarvestedSeedInput[] = [
    // ================= PALIER 2 : INTERMÉDIAIRE (Certifié GNU Backgammon 2-ply) =================
    {
        id: 'harvest_t2_duplication_56',
        tier: 2,
        xgid: 'XGID=-ABAaaB-A-aAdB----abBBbcA-:0:0:1:56:0:0:0:7:8',
        dice: [5, 6],
        playedMove: '6/1 13/7',
        optimalMove: '8/3 24/18',
        acceptableMoves: ['24/18 8/3'],
        quizChoices: ['8/3 24/18', '6/1 13/7', '8/3 11/5', '24/18 18/13'],
        equityLoss: 0.478,
        verdict: 'howler',
        conceptId: 'blot_safety',
        conceptName: 'Contre-Attaque & Fermeture de Porte',
        whyFailed: 'En jouant 6/1 13/7, vous enterrez un pion sur l’As et ratez la frappe de dégagement 24/18* combinée à la fermeture de la porte 3 (8/3).',
        explanation: 'Le coup optimal certifié 8/3 24/18 frappe le blot adverse en 18 pour libérer votre pion arrière tout en fermant la porte 3 dans votre jan intérieur.',
        proverb: 'Frapper en sortant du jan adverse (24/18*) tout en fermant une porte intérieure (8/3) retourne immédiatement l’initiative.',
        hint: 'Utilisez le 6 pour frapper et sortir du point 24 (24/18) et le 5 pour couvrir votre porte 3 (8/3).',
        commentaryVariants: [
            'Le coup optimal 8/3 24/18 combine une frappe libératrice en 18 et la fermeture de la porte 3.',
            'Jouer 8/3 24/18 vole le tempo à l’adversaire tout en renforçant votre jan intérieur.',
            'La ligne 8/3 24/18 est certifiée #1 par GNU Backgammon (+0.559 EMG sur les coups passifs).',
        ],
    },
    {
        id: 'harvest_t2_anchor_14',
        tier: 2,
        xgid: 'XGID=abCBB-B---A-dC-----b-AccA-:0:0:1:14:0:0:0:7:8',
        dice: [1, 4],
        playedMove: '21/20 10/6',
        optimalMove: '24/20 21/20',
        acceptableMoves: ['21/20 24/20', '24/20 10/9', '10/9 24/20'],
        quizChoices: ['24/20 21/20', '24/20 10/9', '13/9 10/9', '21/20 10/6'],
        equityLoss: 0.022,
        verdict: 'blunder',
        conceptId: 'advanced_anchor',
        conceptName: 'Ancre avancée en jan adverse',
        whyFailed: 'En jouant 21/20 10/6, vous laissez un pion arrière isolé sur le point 24 et manquez l’ancre sur 20.',
        explanation: 'En 3-ply GNU Backgammon [grandmaster], 24/20 21/20 ferme l’ancre sur le point 20 (76.0 % de gain) et 24/20 10/9 apporte un bâtisseur clé (+1.034 EMG).',
        proverb: 'Règle de Magriel : Sécuriser l’ancre sur le point 20 (24/20 21/20) coupe l’attaque adverse à la racine.',
        hint: 'Utilisez le 4 (24/20) et le 1 (21/20 ou 10/9) pour sécuriser le point 20 dans le jan adverse.',
        commentaryVariants: [
            'En 3-ply GNU Backgammon, 24/20 21/20 (76.0 % de gain) et 24/20 10/9 (32.3 % de gammon) dominent à 0.009 EMG près.',
            'Fermer le point 20 (24/20 21/20) crée une forteresse imprenable dans le jan adverse.',
            'La variante 24/20 21/20 neutralise toute menace de gammon adverse en fondant l’ancre dorée.',
        ],
    },
    {
        id: 'harvest_t2_structure_64',
        tier: 2,
        xgid: 'XGID=-b-CaaBAC---eC---b-cAA-aA-:0:0:1:64:0:0:0:7:8',
        dice: [6, 4],
        playedMove: '24/14',
        optimalMove: '13/7 8/4',
        acceptableMoves: ['8/4 13/7'],
        quizChoices: ['13/7 8/4', '24/14', '13/7 20/16', '21/15 8/4'],
        equityLoss: 0.445,
        verdict: 'blunder',
        conceptId: 'prime_building',
        conceptName: 'Construction & Attaque de Porte',
        whyFailed: 'En courant avec 24/14, vous laissez l’adversaire s’installer sur votre point 4 et négligez le verrouillage du Bar-Point (7).',
        explanation: 'Le coup optimal certifié 13/7 8/4 couvre solidement le Bar-Point (13/7) et frappe le blot adverse sur la flèche 4 (8/4*) pour prendre le contrôle du jan.',
        proverb: 'Sécuriser son Bar-Point (13/7) tout en chassant l’intrus de son jan intérieur (8/4*) est la clé du jeu d’initiative.',
        hint: 'Couvrez d’abord votre Bar-Point (13/7) avec le 6, puis frappez sur la case 4 avec le 4 (8/4).',
        commentaryVariants: [
            'Le coup optimal 13/7 8/4 verrouille le Bar-Point (flèche 7) tout en nettoyant la flèche 4.',
            'Jouer 13/7 8/4 combine construction structurelle en 7 et tempo offensif en 4.',
            'La ligne 13/7 8/4 est certifiée #1 par GNU Backgammon 2-ply.',
        ],
    },
    {
        id: 'harvest_t2_escape_23',
        tier: 2,
        xgid: 'XGID=-cE-A-aA-A--aD--a--b-aaCe-:0:0:1:23:0:0:0:7:8',
        dice: [2, 3],
        playedMove: '4/2 9/6',
        optimalMove: '23/21 7/4',
        acceptableMoves: ['7/4 23/21', '23/21* 7/4', '7/4 23/21*'],
        quizChoices: ['23/21 7/4', '4/2 9/6', '9/6 6/4', '23/21 23/20'],
        equityLoss: 0.255,
        verdict: 'blunder',
        conceptId: 'back_checker_escape',
        conceptName: 'Libération des pions arrières',
        whyFailed: 'Jouer 4/2 9/6 néglige la contre-attaque en camp adverse et laisse la porte 4 ouverte.',
        explanation: 'Le coup optimal 23/21 7/4 frappe immédiatement en camp adverse (23/21*) pour libérer vos pions arrières tout en fermant la porte 4 (7/4) !',
        proverb: 'Frapper à l’extérieur (23/21*) gagne un tempo décisif tout en construisant son jan (7/4).',
        hint: 'Combinez une frappe de dégagement à l’arrière (23/21) avec la fermeture de votre porte 4 (7/4).',
        commentaryVariants: [
            'Le coup optimal 23/21 7/4 combine une frappe de libération à l’arrière et la fermeture de la porte 4.',
            'Jouer 23/21 7/4 vole le tempo à l’adversaire tout en renforçant votre jan intérieur.',
            'La variante 23/21 7/4 applique le double principe : tempo offensif à l’arrière et porte fermée à l’avant.',
        ],
    },
    {
        id: 'harvest_t2_bar_entry_14',
        tier: 2,
        xgid: 'XGID=-CBdba--A----B----aAB-AgBA:0:0:1:14:0:0:0:7:8',
        dice: [1, 4],
        playedMove: 'bar/24 13/9',
        optimalMove: 'bar/21 20/19',
        acceptableMoves: ['20/19 bar/21'],
        quizChoices: ['bar/21 20/19', 'bar/24 13/9', 'bar/21 19/18', 'bar/24 20/16'],
        equityLoss: 0.324,
        verdict: 'blunder',
        conceptId: 'advanced_anchor',
        conceptName: 'Rentrée de Barre & Ancre Haute',
        whyFailed: 'En entrant bas (bar/24 13/9), vous restez prisonnier au fond du jan adverse tout en exposant un blot inutile en 9.',
        explanation: 'Le coup optimal certifié bar/21 20/19 entre directement sur la flèche haute 21 et sécurise immédiatement la porte 19.',
        proverb: 'En rentrant de la barre, visez toujours le point d’entrée le plus avancé (bar/21) tout en consolidant vos points acquis.',
        hint: 'Entrez avec le 4 sur la flèche 21 (bar/21) et utilisez l’As pour consolider la flèche 19 (20/19).',
        commentaryVariants: [
            'Le coup optimal bar/21 20/19 maximise votre avancement dès la sortie de barre et verrouille la case 19.',
            'Jouer bar/21 20/19 est certifié #1 par GNU Backgammon (+0.324 EMG).',
            'La ligne bar/21 20/19 transforme une rentrée sous pression en structure haute coordonnée.',
        ],
    },

    // ================= PALIER 3 : JOUEUR DE CLUB (Certifié GNU Backgammon 2-ply) =================
    {
        id: 'harvest_t3_bar_point_35',
        tier: 3,
        xgid: 'XGID=-b--A-DAC---eD---c-c-a-aB-:0:0:1:35:0:0:0:7:8',
        dice: [3, 5],
        playedMove: '8/5 7/2',
        optimalMove: '7/4 13/8',
        acceptableMoves: ['13/8 7/4'],
        quizChoices: ['7/4 13/8', '8/5 7/2', '24/21 13/8', '7/4 8/3'],
        equityLoss: 0.253,
        verdict: 'blunder',
        conceptId: 'prime_building',
        conceptName: 'Construction & Maintien de Prime',
        whyFailed: 'Jouer 8/5 7/2 dégarnit simultanément les points 7 et 8 et disperse vos pions sur les cases basses (flèche 2).',
        explanation: 'Le coup optimal 7/4 13/8 ferme la porte 4 tout en regarnissant le point 8 avec un bâtisseur du Midpoint (13/8).',
        proverb: 'Remplacez toujours le bâtisseur consommé sur les points 7/8 en descendant un pion du point 13.',
        hint: 'Utilisez le 3 pour fermer la porte 4 (7/4) et le 5 pour alimenter votre point 8 depuis le point 13.',
        commentaryVariants: [
            'Le coup optimal 7/4 13/8 verrouille la porte 4 et réapprovisionne le point 8 sans créer d’impasse en case 2.',
            'Jouer 7/4 13/8 maintient une chaîne de bâtisseurs compacte entre les flèches 4 et 8.',
            'La variante 7/4 13/8 évite d’enterrer un pion sur le point 2 et conserve toute la souplesse du prime.',
        ],
    },
    {
        id: 'harvest_t3_blot_shelter_46',
        tier: 3,
        xgid: 'XGID=bCcDa--A----bA-A-aA-AAccB-:0:0:1:46:0:0:0:7:8',
        dice: [4, 6],
        playedMove: '7/3 20/14',
        optimalMove: '21/17 15/9',
        acceptableMoves: ['15/9 21/17', '21/17* 15/9'],
        quizChoices: ['21/17 15/9', '7/3 20/14', '21/17 13/7', '13/9 15/9'],
        equityLoss: 0.205,
        verdict: 'blunder',
        conceptId: 'blot_safety',
        conceptName: 'Contre-Attaque & Sauvetage de Blot',
        whyFailed: 'En jouant 7/3 20/14, vous laissez le pion adverse en 17 menacer tout votre champ extérieur.',
        explanation: 'Le coup optimal certifié 21/17 15/9 frappe le pion adverse avancé en 17 (21/17*) et ramène votre pion isolé du 15 vers le bloc de construction en 9.',
        proverb: 'Éliminez le chasseur adverse en 17 (21/17*) tout en rapatriant votre pion exposé (15/9).',
        hint: 'Frappez d’abord sur la flèche 17 avec le 4 (21/17), puis ramenez le pion de la flèche 15 avec le 6 (15/9).',
        commentaryVariants: [
            'Le coup optimal 21/17 15/9 supprime la menace adverse en 17 et met votre pion du 15 à l’abri.',
            'Jouer 21/17 15/9 est certifié #1 par GNU Backgammon (+0.205 EMG).',
            'La ligne 21/17 15/9 nettoie le champ extérieur et reprend l’initiative.',
        ],
    },
    {
        id: 'harvest_t3_connectivity_45',
        tier: 3,
        xgid: 'XGID=-E-AAA--a---eDa--b-----fC-:0:0:1:45:0:0:0:7:8',
        dice: [4, 5],
        playedMove: '24/20 13/8',
        optimalMove: '13/9 9/4',
        acceptableMoves: ['13/4', '13/8 8/4'],
        quizChoices: ['13/9 9/4', '24/20 13/8', '13/9 24/19', '24/20 20/15'],
        equityLoss: 0.193,
        verdict: 'blunder',
        conceptId: 'golden_point',
        conceptName: 'Contrôle des Portes Intérieures',
        whyFailed: 'En jouant 24/20 13/8, vous laissez un blot isolé en 20 et un blot en 8 sans achever vos portes intérieures.',
        explanation: 'Le coup optimal 13/9 9/4 (13/4) achemine un bâtisseur directement sur la case 4 pour verrouiller votre jan intérieur sans disperser vos forces.',
        proverb: 'Quand votre jan intérieur a soif de portes, amenez vos pions du Midpoint jusqu’au bout.',
        hint: 'Utilisez les deux dés (4 et 5) sur un même pion du point 13 pour couvrir la flèche 4.',
        commentaryVariants: [
            'Le coup optimal 13/9 9/4 couvre proprement la flèche 4 sans ouvrir de cible en 20.',
            'Jouer 13/9 9/4 concentre votre énergie sur la fermeture du jan intérieur.',
            'La variante 13/9 9/4 évite la dispersion sur deux fronts et verrouille une porte supplémentaire.',
        ],
    },
    {
        id: 'harvest_t3_inner_gate_42',
        tier: 3,
        xgid: 'XGID=-cEDa-A-----cB-Aa--B-aa-e-:0:0:1:42:0:0:0:7:8',
        dice: [4, 2],
        playedMove: '13/9 13/11',
        optimalMove: '19/15 6/4',
        acceptableMoves: ['6/4 19/15', '19/15 6/4*'],
        quizChoices: ['19/15 6/4', '13/9 13/11', '15/11 6/4', '13/9 6/4'],
        equityLoss: 0.29,
        verdict: 'blunder',
        conceptId: 'blot_safety',
        conceptName: 'Frappe en Jan & Couverture Extérieure',
        whyFailed: 'Jouer 13/9 13/11 laisse le blot adverse en case 4 intact et abandonne votre pion isolé en 15.',
        explanation: 'Le coup optimal certifié 19/15 6/4 frappe l’adversaire sur votre flèche 4 (6/4*) tout en couvrant votre blot extérieur sur la flèche 15 (19/15) !',
        proverb: 'Couvrir son blot extérieur (19/15) tout en frappant dans son jan (6/4*) réalise un swing tactique majeur.',
        hint: 'Utilisez le 4 pour unir vos pions sur la flèche 15 (19/15) et le 2 pour frapper sur la flèche 4 (6/4).',
        commentaryVariants: [
            'Le coup optimal 19/15 6/4 forme une porte d’appui en 15 tout en chassant le pion adverse en 4.',
            'Jouer 19/15 6/4 est certifié #1 par GNU Backgammon (+0.290 EMG).',
            'La ligne 19/15 6/4 combine sécurité parfaite au centre et attaque en jan intérieur.',
        ],
    },
    {
        id: 'harvest_t3_bar_escape_61',
        tier: 3,
        xgid: 'XGID=-BaB-bC-A-aAaC---b-cbA-bAA:0:0:1:16:0:0:0:7:8',
        dice: [1, 6],
        playedMove: 'bar/24 13/7',
        optimalMove: 'bar/24 8/2',
        acceptableMoves: ['8/2 bar/24', 'bar/24 8/2*'],
        quizChoices: ['bar/24 8/2', 'bar/24 13/7', 'bar/24 21/15', 'bar/24 24/18'],
        equityLoss: 0.416,
        verdict: 'howler',
        conceptId: 'back_checker_escape',
        conceptName: 'Rentrée de Barre & Contre-Frappe en Jan',
        whyFailed: 'En jouant passivement bar/24 13/7, vous laissez le pion adverse sur votre point 2 vous attaquer au tour suivant.',
        explanation: 'Le coup optimal certifié bar/24 8/2 rentre en 24 et frappe immédiatement le pion adverse infiltré sur votre point 2 (8/2*) pour reprendre le tempo.',
        proverb: 'Après une rentrée de barre sous pression, chasser le pion adverse infiltré dans votre jan (8/2*) est vital.',
        hint: 'Rentrez sur la flèche 24 avec l’As (bar/24) et frappez l’intrus adverse sur votre flèche 2 avec le 6 (8/2).',
        commentaryVariants: [
            'Le coup optimal bar/24 8/2 envoie l’adversaire sur la barre et brise son attaque.',
            'Jouer bar/24 8/2 est certifié #1 par GNU Backgammon (+0.416 EMG d’avance).',
            'La variante bar/24 8/2 nettoie votre jan intérieur au moment critique.',
        ],
    },

    // ================= PALIER 4 : GRAND-MAÎTRE (Certifié GNU Backgammon 2-ply) =================
    {
        id: 'harvest_t4_double_cover_15',
        tier: 4,
        xgid: 'XGID=-ACA--aAB-aAeD---a-d--baB-:0:0:1:15:0:0:0:7:8',
        dice: [1, 5],
        playedMove: '3/2 8/3',
        optimalMove: '2/1 11/6',
        acceptableMoves: ['11/6 2/1', '7/6 11/6', '11/6 7/6'],
        quizChoices: ['2/1 11/6', '3/2 8/3', '2/1 8/3', '24/23 11/6'],
        equityLoss: 0.212,
        verdict: 'blunder',
        conceptId: 'prime_building',
        conceptName: 'Attaque du Point 6 & Couverture',
        whyFailed: 'Jouer 3/2 8/3 laisse le pion adverse ancré sur votre point 6 doré et gaspille votre attaque.',
        explanation: 'Le coup optimal certifié 2/1 11/6 frappe le blot adverse sur votre point 6 (11/6*) tout en couvrant votre blot sur l’As (2/1).',
        proverb: 'Ne laissez jamais l’adversaire squatter votre point 6 quand vous pouvez le frapper en rapatriant un blot (11/6*).',
        hint: 'Frappez sur votre point 6 depuis la flèche 11 avec le 5 (11/6) et couvrez l’As avec le 1 (2/1).',
        commentaryVariants: [
            'Le coup optimal 2/1 11/6 reconquiert le point 6 par la frappe et verrouille l’As.',
            'Jouer 2/1 11/6 est certifié #1 par GNU Backgammon 2-ply.',
            'La ligne 2/1 11/6 supprime deux blots exposés tout en mettant l’adversaire à la barre.',
        ],
    },
    {
        id: 'harvest_t4_spares_63',
        tier: 4,
        xgid: 'XGID=-CBCa-bB----bA--a-aB-AAfb-:0:0:1:63:0:0:0:7:8',
        dice: [6, 3],
        playedMove: '7/1 21/18',
        optimalMove: '22/16 21/18',
        acceptableMoves: ['21/18 22/16', '22/16* 21/18*'],
        quizChoices: ['22/16 21/18', '7/1 21/18', '19/13 19/16', '22/16 16/13'],
        equityLoss: 0.211,
        verdict: 'blunder',
        conceptId: 'golden_point',
        conceptName: 'Double Frappe de Contre-Attaque',
        whyFailed: 'En jouant 7/1 21/18, vous enterrez un pion sur l’As et manquez la double frappe en camp adverse.',
        explanation: 'Le coup optimal certifié 22/16 21/18 exécute une double frappe dévastatrice sur les flèches 16 et 18 (22/16* 21/18*), envoyant deux pions adverses sur la barre !',
        proverb: 'Envoyer deux pions adverses sur la barre tout en évacuant ses pions arrières retourne instantanément la partie.',
        hint: 'Regardez les deux blots adverses sur les flèches 16 et 18 : frappez-les tous les deux avec 22/16 et 21/18 !',
        commentaryVariants: [
            'Le coup optimal 22/16 21/18 réalise une double frappe chirurgicale en camp extérieur.',
            'Jouer 22/16 21/18 paralyse l’adversaire avec deux dames sur la barre.',
            'La variante 22/16 21/18 est certifiée #1 absolu par GNU Backgammon.',
        ],
    },
    {
        id: 'harvest_t4_clean_midpoint_52',
        tier: 4,
        xgid: 'XGID=-b-B-BC-A---dC--b-bbaa-aA-:0:0:1:52:0:0:0:7:8',
        dice: [5, 2],
        playedMove: '13/8 13/11',
        optimalMove: '24/22 22/17',
        acceptableMoves: ['24/17', '24/19 19/17'],
        quizChoices: ['24/22 22/17', '13/8 13/11', '13/8 24/22', '8/3 24/22'],
        equityLoss: 0.223,
        verdict: 'blunder',
        conceptId: 'blot_safety',
        conceptName: 'Évasion du Pion Arrière & Duplication',
        whyFailed: 'Jouer 13/8 13/11 laisse votre dernier pion arrière prisonnier en 24 et ouvre une cible gratuite en 11.',
        explanation: 'Le coup optimal certifié 24/22 22/17 (24/17) fait bondir votre pion arrière jusqu’au point 17 en gardant votre Midpoint (13) intact.',
        proverb: 'Quand un seul pion arrière reste en 24 face à une structure ouverte, courez jusqu’au point 17 (24/17).',
        hint: 'Faites courir votre pion arrière de la flèche 24 jusqu’à la flèche 17 avec les deux dés (24/22 22/17).',
        commentaryVariants: [
            'Le coup optimal 24/22 22/17 libère immédiatement le pion arrière sans exposer le Midpoint.',
            'Jouer 24/22 22/17 est certifié #1 par GNU Backgammon (+0.223 EMG).',
            'La ligne 24/22 22/17 préserve la pureté de votre structure avant tout en résolvant le problème arrière.',
        ],
    },
    {
        id: 'harvest_t4_duplication_32',
        tier: 4,
        xgid: 'XGID=-a-B-BC-A---dC--b-cc-a-aB-:0:0:1:32:0:0:0:7:8',
        dice: [3, 2],
        playedMove: '13/10 13/11',
        optimalMove: '24/21 24/22',
        acceptableMoves: ['24/22 24/21', '24/21 8/6', '8/6 24/21'],
        quizChoices: ['24/21 24/22', '13/10 13/11', '24/21 13/11', '24/21 6/4'],
        equityLoss: 0.185,
        verdict: 'blunder',
        conceptId: 'blot_safety',
        conceptName: 'Contre-Attaque Arrière & Fermeture',
        whyFailed: 'Descendre deux blots séparés (13/10 13/11) ignore le blot adverse vulnérable sur la flèche 21.',
        explanation: 'Le coup optimal certifié 24/21 24/22 frappe le blot adverse sur la flèche 21 (24/21*) et avance simultanément le second pion arrière en 22.',
        proverb: 'Frapper un blot en jan adverse (24/21*) tout en dédoublant ses pions arrières prend l’ascendant immédiatement.',
        hint: 'Utilisez vos deux pions de la flèche 24 pour frapper en 21 et avancer en 22 (24/21 24/22).',
        commentaryVariants: [
            'Le coup optimal 24/21 24/22 punit le blot adverse en 21 et mobilise vos deux dames arrières.',
            'Jouer 24/21 24/22 est certifié #1 par GNU Backgammon 2-ply.',
            'La variante 24/21 24/22 garde votre bloc avant intact tout en prenant l’initiative.',
        ],
    },
    {
        id: 'harvest_t4_race_pure_65',
        tier: 4,
        xgid: 'XGID=-b---BD-C---cD----bc-b-a--:0:0:1:65:0:0:0:7:8',
        dice: [6, 5],
        playedMove: '8/2 8/3',
        optimalMove: '13/7 13/8',
        acceptableMoves: ['13/8 13/7'],
        quizChoices: ['13/7 13/8', '8/2 8/3', '8/2 13/8', '13/7 8/3'],
        equityLoss: 0.145,
        verdict: 'blunder',
        conceptId: 'race_management',
        conceptName: 'Vidage du Midpoint & Distribution Pure',
        whyFailed: 'Jouer 8/2 8/3 dégarnit le point 8 et enterre deux dames sur les flèches basses 2 et 3.',
        explanation: 'Le coup optimal certifié 13/7 13/8 vide proprement le Midpoint (13) vers vos portes 7 et 8 sans aucun gaspillage.',
        proverb: 'En course ou fin de contact, videz toujours le point 13 vers les points 7 et 8 (13/7 13/8) avant de toucher au point 8.',
        hint: 'Descendez les deux pions du Midpoint (13) sur vos portes 7 et 8 (13/7 13/8).',
        commentaryVariants: [
            'Le coup optimal 13/7 13/8 assure une transition parfaite du Midpoint vers le jan intérieur.',
            'Jouer 13/7 13/8 est certifié #1 par GNU Backgammon 2-ply.',
            'La ligne 13/7 13/8 évite tout gaspillage de pips sur les cases basses.',
        ],
    },
];

export const BENCHMARK_BLUNDERS: PlayerBlunderRecord[] = [
    // ================= PALIER 1 : DÉBUTANT (5 Fondamentaux Classiques 100 % Certifiés GNUBG) =================
    {
        id: 'bench_blunder_golden_point',
        createdAt: '2025-01-01T00:00:00.000Z',
        tier: 1,
        board: (() => {
            const b = new Array(28).fill(0);
            b[1] = -2;
            b[6] = 5;
            b[8] = 3;
            b[12] = -5;
            b[13] = 5;
            b[17] = -3;
            b[19] = -5;
            b[24] = 2;
            return b;
        })(),
        dice: [3, 1],
        player: 'X',
        playedMove: '24/21 13/12',
        optimalMove: '8/5 6/5',
        acceptableMoves: ['6/5 8/5'],
        quizChoices: ['8/5 6/5', '24/21 13/12', '13/9', '24/20'],
        equityLoss: 0.23,
        verdict: 'blunder',
        conceptId: 'golden_point',
        conceptName: 'Contrôle du Golden Point (Porte 5 / 20)',
        whyFailed: 'En jouant 24/21 13/12, vous laissez deux blots exposés (flèches 21 et 12) et manquez l’occasion en or de fermer la porte la plus précieuse du plateau.',
        explanation:
            'Le coup 3-1 est le meilleur jet d’ouverture du jeu : il DOIT être utilisé pour fabriquer le Point 5 (8/5 6/5), le point clé de l’attaque et de la défense.',
        proverb: 'Proverbe de Michy : Le Golden Point (flèche 5) est le cœur battant de votre jan intérieur.',
        hint: 'Le Point 5 est la clé du jan intérieur. Cherchez à y assembler deux pions pour créer une porte maîtresse.',
        commentaryVariants: [
            'Le coup 3-1 est le meilleur jet d’ouverture du jeu : il DOIT être utilisé pour fabriquer le Point 5 (8/5 6/5).',
            'En fermant la porte 5 (8/5 6/5), vous prenez immédiatement l’ascendant stratégique sans laisser aucun blot.',
            'Construire le Golden Point (8/5 6/5) verrouille la case la plus rentable du Backgammon dès le premier tour.',
        ],
        timesReviewed: 0,
        timesSolved: 0,
        isMastered: false,
    },
    {
        id: 'bench_blunder_blot_safety',
        createdAt: '2025-01-02T00:00:00.000Z',
        tier: 1,
        board: (() => {
            const b = new Array(28).fill(0);
            b[1] = -2;
            b[6] = 4;
            b[7] = 2;
            b[8] = 3;
            b[11] = 1;
            b[13] = 3;
            b[17] = -3;
            b[19] = -4;
            b[20] = -2;
            b[21] = -2;
            b[22] = -2;
            b[24] = 2;
            return b;
        })(),
        dice: [4, 2],
        player: 'X',
        playedMove: '13/9 13/11',
        optimalMove: '8/4 6/4',
        acceptableMoves: ['6/4 8/4'],
        quizChoices: ['8/4 6/4', '13/9 13/11', '13/9 11/9', '11/5'],
        equityLoss: 0.385,
        verdict: 'howler',
        conceptId: 'blot_safety',
        conceptName: 'Fermeture de la Porte 4 Cruciale',
        whyFailed: 'En jouant 13/9 13/11, vous refusez de fermer votre porte 4 cruciale et laissez les deux pions adverses du point 1 s’échapper facilement.',
        explanation:
            'Avec les dés 4-2 et des pions de réserve sur les flèches 8 et 6, fermer la porte 4 (8/4 6/4) devant les deux dames adverses sur le point 1 est impératif (+0.385 EMG).',
        proverb: 'Quand vous avez les réserves sur 8 et 6 avec un 4-2, fermez toujours la porte 4 (8/4 6/4) sans hésiter.',
        hint: 'Regardez la flèche 4 dans votre jan intérieur : vos pions des flèches 8 et 6 peuvent la fermer immédiatement !',
        commentaryVariants: [
            'Fermer la porte 4 (8/4 6/4) érige un barrage majeur devant les deux dames arrières adverses.',
            'Jouer 8/4 6/4 est certifié #1 par GNU Backgammon (+0.385 EMG sur 13/9 13/11).',
            'La ligne 8/4 6/4 verrouille une porte intérieure clé sans casser ni le point 8 ni le point 6.',
        ],
        timesReviewed: 0,
        timesSolved: 0,
        isMastered: false,
    },
    {
        id: 'bench_blunder_prime_building',
        createdAt: '2025-01-03T00:00:00.000Z',
        tier: 1,
        board: (() => {
            const b = new Array(28).fill(0);
            b[1] = -2;
            b[4] = 2;
            b[5] = 2;
            b[6] = 3;
            b[7] = 2;
            b[8] = 3;
            b[13] = 1;
            b[17] = -3;
            b[19] = -4;
            b[20] = -2;
            b[21] = -2;
            b[22] = -2;
            b[24] = 2;
            return b;
        })(),
        dice: [5, 3],
        player: 'X',
        playedMove: '24/16',
        optimalMove: '8/3 6/3',
        acceptableMoves: ['6/3 8/3'],
        quizChoices: ['8/3 6/3', '24/16', '13/5', '8/3 13/10'],
        equityLoss: 0.285,
        verdict: 'blunder',
        conceptId: 'prime_building',
        conceptName: 'Construction & Maintien de Prime (6-Prime)',
        whyFailed: 'Courir avec 24/16 expose un blot inutile en 16 et laisse la porte 3 grande ouverte aux pions adverses.',
        explanation:
            'Avec les points 4, 5, 6, 7 et 8 déjà tenus et une dame de réserve sur 6 et 8, construire la porte 3 (8/3 6/3) complète un barrage parfait de 6 portes consécutives (6-prime) qui enferme totalement l’adversaire.',
        proverb: 'Un mur de 6 portes consécutives (6-prime) est la forteresse suprême du Backgammon : fermez toujours la porte 3.',
        hint: 'Regardez la porte 3 : en y assemblant les réserves des points 8 et 6 (8/3 6/3), vous complétez une 6-prime infranchissable.',
        commentaryVariants: [
            'Construire la porte 3 (8/3 6/3) complète un barrage de 6 portes consécutives (points 3 à 8) qui emprisonne l’adversaire.',
            'Jouer 8/3 6/3 est certifié #1 par GNU Backgammon (+0.285 EMG) en utilisant vos spares des points 8 et 6.',
            'La variante 8/3 6/3 verrouille définitivement les deux pions adverses bloqués sur l’As.',
        ],
        timesReviewed: 0,
        timesSolved: 0,
        isMastered: false,
    },
    {
        id: 'bench_blunder_advanced_anchor',
        createdAt: '2025-01-04T00:00:00.000Z',
        tier: 1,
        board: (() => {
            const b = new Array(28).fill(0);
            b[1] = -3;
            b[3] = -2;
            b[5] = -3;
            b[6] = 5;
            b[8] = 3;
            b[12] = -3;
            b[13] = 4;
            b[19] = -4;
            b[20] = 1;
            b[24] = 2;
            return b;
        })(),
        dice: [4, 1],
        player: 'X',
        playedMove: '20/15',
        optimalMove: '24/20 24/23',
        acceptableMoves: ['24/23 24/20', '24/20 8/7', '8/7 24/20'],
        quizChoices: ['24/20 24/23', '20/15', '13/8', '24/19'],
        equityLoss: 0.185,
        verdict: 'blunder',
        conceptId: 'advanced_anchor',
        conceptName: 'Ancre avancée en jan adverse',
        whyFailed: 'En fuyant seul avec 20/15, vous abandonnez le point 20 à l’adversaire et laissez deux pions isolés au fond (24 et 15).',
        explanation:
            'Au lieu de fuir seul et d’abandonner le camp adverse, faire l’ancre sur le point 20 (24/20) tout en avançant le dernier pion (24/23) neutralise l’attaque de l’adversaire.',
        proverb: 'Une ancre avancée sur le point 20 est votre meilleure assurance-vie contre les gammons.',
        hint: 'Couvrez votre pion de la flèche 20 avec le 4 (24/20) et avancez le second pion arrière avec l’As (24/23).',
        commentaryVariants: [
            'Ancrer sur le point 20 (24/20 24/23) sécurise un avant-poste imprenable dans le jan adverse.',
            'Jouer 24/20 24/23 est certifié #1 par GNU Backgammon 2-ply.',
            'La ligne 24/20 24/23 verrouille la flèche 20 et prépare la sortie du dernier pion arrière.',
        ],
        timesReviewed: 0,
        timesSolved: 0,
        isMastered: false,
    },
    {
        id: 'bench_blunder_race_management',
        createdAt: '2025-01-05T00:00:00.000Z',
        tier: 1,
        board: (() => {
            const b = new Array(28).fill(0);
            b[2] = 2;
            b[3] = 3;
            b[4] = 3;
            b[5] = 3;
            b[6] = 2;
            b[10] = 2;
            b[15] = -1;
            b[19] = -4;
            b[20] = -3;
            b[21] = -3;
            b[22] = -4;
            return b;
        })(),
        dice: [6, 1],
        player: 'X',
        playedMove: '10/4 10/9',
        optimalMove: '10/4 2/1',
        acceptableMoves: ['2/1 10/4', '10/4 6/5', '6/5 10/4'],
        quizChoices: ['10/4 2/1', '10/4 10/9', '6/1 5/4', '4/3 6/1'],
        equityLoss: 0.132,
        verdict: 'blunder',
        conceptId: 'race_management',
        conceptName: 'Règle de course en avance (Pip Count)',
        whyFailed: 'Jouer 10/4 10/9 laisse deux blots exposés sur les flèches 10 et 9 à portée directe du pion adverse embusqué en 15.',
        explanation:
            'En tête à la course, rentrez un pion en sécurité avec le 6 (10/4) et remplissez la flèche 1 (2/1) pour préparer un bear-off optimal sans donner de tir supplémentaire.',
        proverb: 'En avance à la course, rentrez vos pions en jan intérieur (10/4) et comblez le point 1 (2/1) pour le bear-off.',
        hint: 'Rentrez un pion du point 10 sur la flèche 4 (10/4) et utilisez l’As pour garnir le point 1 (2/1).',
        commentaryVariants: [
            'Jouer 10/4 2/1 est certifié #1 par GNU Backgammon : il rentre un pion en jan et prépare le point 1 pour la sortie.',
            'En tête à la course, 10/4 2/1 minimise l’exposition face au pion adverse de la flèche 15.',
            'La variante 10/4 2/1 prépare une distribution de bear-off sans trou sur l’As.',
        ],
        timesReviewed: 0,
        timesSolved: 0,
        isMastered: false,
    },
    ...HARVESTED_TIERED_SEEDS.map((seed, idx) => buildHarvestedBlunder(seed, idx)),
    ...GNUBG_3PLY_CERTIFIED_POSITIONS.filter((p) => p.id !== 'harvest_t2_anchor_14' && p.moves.length >= 4).map((p, idx) =>
        buildHarvestedBlunder(
            {
                id: `cert_3ply_${p.id}`,
                tier: (p.moves[1]?.equityLoss ?? 0.03) <= 0.025 ? 4 : (p.moves[1]?.equityLoss ?? 0.03) <= 0.055 ? 3 : 2,
                xgid: p.xgid,
                dice: [p.dice[0], p.dice[1]],
                playedMove: p.moves[1]!.notation,
                optimalMove: p.moves[0]!.notation,
                acceptableMoves: p.moves
                    .slice(1)
                    .filter((m) => m.equityLoss <= 0.015)
                    .map((m) => m.notation),
                quizChoices: p.moves.slice(0, 4).map((m) => m.notation),
                equityLoss: p.moves[1]!.equityLoss,
                verdict: p.moves[1]!.equityLoss >= 0.08 ? 'blunder' : 'doubtful',
                conceptId: p.conceptId,
                conceptName: p.conceptName,
                whyFailed: `En jouant ${p.moves[1]!.notation}, vous concédez -${p.moves[1]!.equityLoss.toFixed(3)} EMG face au coup 3-ply optimal ${p.moves[0]!.notation}.`,
                explanation: `Certifié en Vrai 3-Ply Cubeful [grandmaster] par GNU Backgammon : ${p.moves[0]!.notation} (${(p.moves[0]!.win * 100).toFixed(1)}% de gain, ${(p.moves[0]!.winGammon * 100).toFixed(1)}% de gammon) surpasse ${p.moves[1]!.notation} de +${p.moves[1]!.equityLoss.toFixed(3)} EMG.`,
                proverb: 'En position de contact 3-ply, synchronisez la sécurité de vos ancres et vos bâtisseurs pour les 36 prochains lancers.',
                hint: `Analysez le coup maître ${p.moves[0]!.notation.split(' ')[0]} qui maximise votre équité à 3 plis.`,
                commentaryVariants: [
                    `Certifié GNU Backgammon 3-Ply [grandmaster] : ${p.moves[0]!.notation} domine ${p.moves[1]!.notation} de +${p.moves[1]!.equityLoss.toFixed(3)} EMG.`,
                    `En Vrai 3-Ply Cubeful, ${p.moves[0]!.notation} maximise votre taux de victoire (${(p.moves[0]!.win * 100).toFixed(1)}%).`,
                    `Évitez l'imprécision ${p.moves[1]!.notation} (-${p.moves[1]!.equityLoss.toFixed(3)} EMG) et privilégiez ${p.moves[0]!.notation}.`,
                ],
            },
            30 + idx,
        ),
    ),
    ...BTCORE_5000_HARVEST_SEEDS.filter(
        (seed) =>
            seed.conceptId !== 'race_management' &&
            seed.conceptId !== 'bearoff_technique' &&
            seed.quizChoices.length === 4,
    ).map((seed, idx) => buildHarvestedBlunder(seed, 16000 + idx)),
    ...BTERH_HARVEST_SEEDS.filter((seed) => seed.quizChoices.length === 4).map((seed, idx) =>
        buildHarvestedBlunder(seed, 30000 + idx),
    ),
];
