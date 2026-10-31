/**
 * Banque de Blunders & Quizz par Paliers (Positions d'entraînement initiales & Récolte 10 000 parties).
 *
 * Fournit 20 positions tactiques réparties en 4 Paliers évolutifs :
 * - Palier 1 (🌱 Débutant) : Fondations, Golden Point, Sécurité des blots, Prime & Course
 * - Palier 2 (⚔️ Intermédiaire) : Positions issues de la récolte de 10 000 parties (grosses bévues structurelles)
 * - Palier 3 (🏆 Joueur de Club) : Arbitrages complexes (évasion, bar-point, duplication, rentrée de barre)
 * - Palier 4 (👑 Grand-Maître) : Subtilités positionnelles, distribution des bâtisseurs (spares) et tempo
 */

import type { PlayerBlunderRecord, DrillTier, BlunderVerdict } from './types';
import { parseXGID } from '../../engine/backgammonEngine';
import { HARVESTED_MULTIPLY_9CAT_SEEDS } from './harvestedMultiPlySeeds';

function boardFromXgid(xgid: string): number[] {
    const parsed = parseXGID(xgid);
    const b = new Array<number>(28).fill(0);
    for (let i = 0; i < parsed.board.length && i < 28; i++) {
        b[i] = parsed.board[i] ?? 0;
    }
    return b;
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

function buildHarvestedBlunder(seed: HarvestedSeedInput, idx: number): PlayerBlunderRecord {
    return {
        id: seed.id,
        createdAt: new Date(Date.UTC(2026, 0, 10 + idx)).toISOString(),
        board: boardFromXgid(seed.xgid),
        dice: seed.dice,
        player: 'X',
        playedMove: seed.playedMove,
        optimalMove: seed.optimalMove,
        acceptableMoves: seed.acceptableMoves ?? [],
        quizChoices: seed.quizChoices,
        equityLoss: seed.equityLoss,
        verdict: seed.verdict,
        conceptId: seed.conceptId,
        conceptName: seed.conceptName,
        whyFailed: seed.whyFailed,
        explanation: seed.explanation,
        proverb: seed.proverb,
        hint: seed.hint,
        commentaryVariants: seed.commentaryVariants,
        tier: seed.tier,
        timesReviewed: 0,
        timesSolved: 0,
        isMastered: false,
    };
}

const HARVESTED_TIERED_SEEDS: HarvestedSeedInput[] = [
    // ================= PALIER 2 : INTERMÉDIAIRE (Récolte 10 000 parties) =================
    {
        id: 'harvest_t2_duplication_56',
        tier: 2,
        xgid: 'XGID=-ABAaaB-A-aAdB----abBBbcA-:0:0:1:56:0:0:0:7:8',
        dice: [5, 6],
        playedMove: '6/1 13/7',
        optimalMove: '11/6 8/2',
        acceptableMoves: ['8/2 11/6'],
        quizChoices: ['11/6 8/2', '6/1 13/7', '13/2', '24/13'],
        equityLoss: 0.478,
        verdict: 'howler',
        conceptId: 'blot_safety',
        conceptName: 'Minimisation des tirs & Sécurité des blots',
        whyFailed: 'En jouant 6/1 13/7, vous éparpillez vos bâtisseurs et laissez 4 pions isolés sur les flèches 3, 6, 7 et 8 sous le feu direct (36/36 tirs).',
        explanation: 'Le coup optimal 11/6 8/2 met à l’abri le blot exposé sur le point 11 et consolide le point 6 [réduit vos pions isolés de 7 à 3].',
        proverb: 'Quand le jan adverse est menaçant, réduisez vos blots isolés avant de développer.',
        hint: 'Cherchez le pion isolé au milieu du terrain (flèche 11) et ramenez-le couvrir votre point 6.',
        commentaryVariants: [
            'Le coup optimal 11/6 8/2 met à l’abri le blot du point 11 et consolide la porte 6 [réduit vos pions isolés de 7 à 3].',
            'Jouer 11/6 8/2 resserre immédiatement vos blocs et supprime les cibles faciles au centre du tablier.',
            'La ligne 11/6 8/2 nettoie le champ extérieur sans casser le point 6.',
        ],
    },
    {
        id: 'harvest_t2_anchor_14',
        tier: 2,
        xgid: 'XGID=abCBB-B---A-dC-----b-AccA-:0:0:1:14:0:0:0:7:8',
        dice: [1, 4],
        playedMove: '4/3 6/2',
        optimalMove: '21/20 24/20',
        acceptableMoves: ['24/20 21/20'],
        quizChoices: ['21/20 24/20', '4/3 6/2', '13/8', '6/1'],
        equityLoss: 0.457,
        verdict: 'howler',
        conceptId: 'advanced_anchor',
        conceptName: 'Ancre avancée en jan adverse',
        whyFailed: 'En jouant 4/3 6/2, vous dégradez votre propre jan intérieur et laissez 5 pions isolés offrant 36 chances sur 36 de frappe à l’adversaire.',
        explanation: 'Le coup optimal 21/20 24/20 verrouille l’ancre avancée sur le point 20 (Golden Point adverse) et fait chuter vos tirs concédés de 36/36 à seulement 4/36 !',
        proverb: 'Règle de Magriel : Sécuriser l’ancre sur le point 20 coupe l’attaque adverse à la racine.',
        hint: 'Regardez vos pions arrières en camp adverse (flèches 21 et 24) : ils peuvent s’unir sur la case 20 !',
        commentaryVariants: [
            'Le coup optimal 21/20 24/20 verrouille l’ancre avancée sur la flèche 20 et abaisse le danger de 36/36 à 4/36 tirs.',
            'Assembler vos deux pions arrières sur le point 20 (21/20 24/20) crée une forteresse imprenable et réduit vos blots de 5 à 1.',
            'La variante 21/20 24/20 neutralise toute menace de gammon adverse en fondant l’ancre dorée.',
        ],
    },
    {
        id: 'harvest_t2_structure_64',
        tier: 2,
        xgid: 'XGID=-b-CaaBAC---eC---b-cAA-aA-:0:0:1:64:0:0:0:7:8',
        dice: [6, 4],
        playedMove: '8/2 8/4*',
        optimalMove: '13/7 24/20',
        acceptableMoves: ['24/20 13/7'],
        quizChoices: ['13/7 24/20', '8/2 8/4*', '24/14', '13/3'],
        equityLoss: 0.445,
        verdict: 'blunder',
        conceptId: 'prime_building',
        conceptName: 'Construction & Maintien de Prime',
        whyFailed: 'En jouant 8/2 8/4*, vous abandonnez la flèche 8 et créez deux blots lâches dans votre jan intérieur (flèches 2 et 4) sous tir direct.',
        explanation: 'Le coup optimal 13/7 24/20 conserve un barrage de 3 portes consécutives et réduit vos pions isolés de 7 à 1.',
        proverb: 'Proverbe de Michy (Break the Mountain) : Ne brisez jamais votre point 8 pour frapper à faux temps en laissant des blots.',
        hint: 'Ne cassez pas votre point 8 : utilisez plutôt le point 13 pour couvrir le Bar-Point (7) et avancez du point 24.',
        commentaryVariants: [
            'Le coup optimal 13/7 24/20 conserve un mur de 3 portes consécutives et réduit vos pions isolés de 7 à 1.',
            'Jouer 13/7 24/20 solidifie le Bar-Point (flèche 7) tout en préparant une ancre avancée en 20.',
            'La ligne 13/7 24/20 préserve l’intégrité de votre bloc central au lieu d’exposer vos dames en jan.',
        ],
    },
    {
        id: 'harvest_t2_escape_23',
        tier: 2,
        xgid: 'XGID=-cE-A-aA-A--aD--a--b-aaCe-:0:0:1:23:0:0:0:7:8',
        dice: [2, 3],
        playedMove: '4/2 9/6*',
        optimalMove: '23/21* 7/4',
        acceptableMoves: ['7/4 23/21*'],
        quizChoices: ['23/21* 7/4', '4/2 9/6*', '23/18', '9/4'],
        equityLoss: 0.255,
        verdict: 'blunder',
        conceptId: 'back_checker_escape',
        conceptName: 'Libération des pions arrières',
        whyFailed: 'Jouer 4/2 9/6* néglige la contre-attaque en camp adverse et laisse vos pions arrières bloqués derrière le rideau adverse.',
        explanation: 'Le coup optimal 23/21* 7/4 frappe immédiatement en camp adverse pour libérer vos pions arrières tout en fermant la porte 4 !',
        proverb: 'Frapper à l’extérieur (23/21*) gagne un tempo décisif tout en construisant son jan (7/4).',
        hint: 'Combinez une frappe de dégagement à l’arrière (depuis la case 23) avec la fermeture de votre porte 4.',
        commentaryVariants: [
            'Le coup optimal 23/21* 7/4 combine une frappe de libération à l’arrière et la fermeture de la porte 4.',
            'Jouer 23/21* 7/4 vole le tempo à l’adversaire tout en renforçant votre jan intérieur.',
            'La variante 23/21* 7/4 applique le double principe : tempo offensif à l’arrière et porte fermée à l’avant.',
        ],
    },
    {
        id: 'harvest_t2_bar_entry_14',
        tier: 2,
        xgid: 'XGID=-CBdba--A----B----aAB-AgBA:0:0:1:14:0:0:0:7:8',
        dice: [1, 4],
        playedMove: 'bar/24 13/9',
        optimalMove: 'bar/21 22/21',
        acceptableMoves: [],
        quizChoices: ['bar/21 22/21', 'bar/24 13/9', 'bar/24 22/18', 'bar/21 13/12'],
        equityLoss: 0.254,
        verdict: 'blunder',
        conceptId: 'advanced_anchor',
        conceptName: 'Ancre avancée en jan adverse',
        whyFailed: 'En entrant bar/24 13/9, vous laissez 3 blots dispersés (flèches 9, 22 et 24) sous le tir direct de l’adversaire.',
        explanation: 'Entrer sur la flèche 21 et la couvrir immédiatement (bar/21 22/21) crée une ancre haute solide et supprime deux blots d’un seul coup.',
        proverb: 'En rentrant de la barre, former une ancre haute immédiate prime toujours sur un développement dispersé.',
        hint: 'Depuis la barre, regardez le pion isolé sur la flèche 22 : vous pouvez le rejoindre sur la flèche 21 !',
        commentaryVariants: [
            'Le coup optimal bar/21 22/21 forme instantanément l’ancre sur le point 21 et protège votre pion isolé du 22.',
            'Jouer bar/21 22/21 élimine deux cibles vulnérables en jan adverse et stabilise toute votre défense.',
            'La ligne bar/21 22/21 transforme une rentrée sous pression en point d’appui inattaquable.',
        ],
    },

    // ================= PALIER 3 : JOUEUR DE CLUB (Récolte 10 000 parties) =================
    {
        id: 'harvest_t3_bar_point_35',
        tier: 3,
        xgid: 'XGID=-b--A-DAC---eD---c-c-a-aB-:0:0:1:35:0:0:0:7:8',
        dice: [3, 5],
        playedMove: '8/5 7/2',
        optimalMove: '7/4 13/8',
        acceptableMoves: ['13/8 7/4'],
        quizChoices: ['7/4 13/8', '8/5 7/2', '13/5', '24/16'],
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
        optimalMove: '24/20 13/7',
        acceptableMoves: ['13/7 24/20'],
        quizChoices: ['24/20 13/7', '7/3 20/14', '24/14', '13/3'],
        equityLoss: 0.194,
        verdict: 'blunder',
        conceptId: 'blot_safety',
        conceptName: 'Minimisation des tirs & Sécurité des blots',
        whyFailed: 'En jouant 7/3 20/14, vous brisez votre ancre potentielle en 20 et ouvrez le Bar-Point (7), laissant 4 blots à découvert.',
        explanation: 'Le coup optimal 24/20 13/7 ferme simultanément l’ancre 20 et le Bar-Point 7 (deux portes clés en un seul tour !).',
        proverb: 'Fermer deux points stratégiques (Ancre 20 + Bar-Point 7) en un seul jet écrase toute autre considération.',
        hint: 'Deux blots vous attendent sur les flèches 20 et 7 : couvrez-les tous les deux avec 24/20 et 13/7 !',
        commentaryVariants: [
            'Le coup optimal 24/20 13/7 réalise le doublé parfait : fermeture de l’ancre 20 et du Bar-Point 7.',
            'Jouer 24/20 13/7 transforme deux pions vulnérables en deux portes maîtresses.',
            'La ligne 24/20 13/7 élimine vos faiblesses aux deux extrémités du tablier.',
        ],
    },
    {
        id: 'harvest_t3_connectivity_45',
        tier: 3,
        xgid: 'XGID=-E-AAA--a---eDa--b-----fC-:0:0:1:45:0:0:0:7:8',
        dice: [4, 5],
        playedMove: '24/20 13/8*',
        optimalMove: '13/9 9/4',
        acceptableMoves: ['13/8* 8/4'],
        quizChoices: ['13/9 9/4', '24/20 13/8*', '24/15', '13/4'],
        equityLoss: 0.193,
        verdict: 'blunder',
        conceptId: 'golden_point',
        conceptName: 'Contrôle des Portes Intérieures',
        whyFailed: 'En jouant 24/20 13/8*, vous laissez un blot isolé en 20 et un blot en 8 sans achever vos portes intérieures.',
        explanation: 'Le coup optimal 13/9 9/4 achemine un bâtisseur directement sur la case 4 pour verrouiller votre jan intérieur sans disperser vos forces.',
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
        optimalMove: '6/2 15/13',
        acceptableMoves: ['15/13 6/2'],
        quizChoices: ['6/2 15/13', '13/9 13/11', '8/4 6/4', '15/9'],
        equityLoss: 0.193,
        verdict: 'blunder',
        conceptId: 'blot_safety',
        conceptName: 'Minimisation des tirs & Sécurité des blots',
        whyFailed: 'Jouer 13/9 13/11 abandonne le pion isolé de la flèche 15 en plein champ adverse et crée deux nouveaux blots en 9 et 11.',
        explanation: 'Le coup optimal 6/2 15/13 rapatrie le blot exposé du point 15 sur la sécurité du Midpoint (13) et couvre le point 2.',
        proverb: 'Un pion isolé dans le champ extérieur adverse doit rentrer au bercail (15/13) dès que possible.',
        hint: 'Mettez d’abord à l’abri le pion isolé de la flèche 15 vers le point 13, puis couvrez la case 2.',
        commentaryVariants: [
            'Le coup optimal 6/2 15/13 sauve le pion isolé du 15 et consolide votre jan intérieur en case 2.',
            'Jouer 6/2 15/13 supprime la cible directe en 15 au lieu d’éparpiller le point 13.',
            'La ligne 6/2 15/13 combine sécurité immédiate au centre et fermeture en jan.',
        ],
    },
    {
        id: 'harvest_t3_bar_escape_61',
        tier: 3,
        xgid: 'XGID=aBaB-bC-A-aAcC---b-cbA-bA-:0:0:1:16:0:0:0:7:8',
        dice: [1, 6],
        playedMove: 'bar/24 8/2',
        optimalMove: 'bar/24 24/18',
        acceptableMoves: [],
        quizChoices: ['bar/24 24/18', 'bar/24 8/2', 'bar/19 8/7', 'bar/24 13/7'],
        equityLoss: 0.214,
        verdict: 'blunder',
        conceptId: 'back_checker_escape',
        conceptName: 'Libération des pions arrières',
        whyFailed: 'En jouant bar/24 8/2, vous restez coincé au fond du jan adverse sur la case 24 tout en exposant la flèche 8 (35/36 tirs).',
        explanation: 'Le coup optimal bar/24 24/18 bondit immédiatement hors du jan adverse jusqu’au point 18 et abaisse vos tirs concédés de 35/36 à 19/36 !',
        proverb: 'Proverbe de Michy (Lover’s Leap) : Dès que le 6 permet de sauter hors du jan adverse (24/18), bondissez !',
        hint: 'Après être rentré en 24 avec l’As, utilisez le 6 sur ce même pion pour bondir en sécurité en 18.',
        commentaryVariants: [
            'Le coup optimal bar/24 24/18 réalise l’évasion complète hors du jan adverse et réduit les tirs de 35/36 à 19/36.',
            'Jouer bar/24 24/18 évite de casser le point 8 et libère votre pion arrière d’un seul trait.',
            'La variante bar/24 24/18 garde votre structure intacte à l’avant tout en fuyant le piège adverse.',
        ],
    },

    // ================= PALIER 4 : GRAND-MAÎTRE (Récolte 10 000 parties) =================
    {
        id: 'harvest_t4_double_cover_15',
        tier: 4,
        xgid: 'XGID=-ACA--aAB-aAeD---a-d--baB-:0:0:1:15:0:0:0:7:8',
        dice: [1, 5],
        playedMove: '3/2 8/3',
        optimalMove: '8/7 8/3',
        acceptableMoves: ['8/3 8/7'],
        quizChoices: ['8/7 8/3', '3/2 8/3', '13/7', '24/18'],
        equityLoss: 0.212,
        verdict: 'blunder',
        conceptId: 'prime_building',
        conceptName: 'Construction & Maintien de Prime',
        whyFailed: 'Jouer 3/2 8/3 rate la couverture de la flèche 7 et laisse 5 pions isolés (flèches 1, 3, 7, 8) sous 27/36 tirs.',
        explanation: 'Le coup optimal 8/7 8/3 utilise la réserve du point 8 pour couvrir simultanément le Bar-Point (7) et la porte 3 [réduit vos blots de 5 à 2].',
        proverb: 'Un point 8 riche en pions de réserve sert à verrouiller à la fois le point 7 et les portes basses.',
        hint: 'Vous avez deux blots sur les flèches 7 et 3 : utilisez deux pions du point 8 pour couvrir les deux !',
        commentaryVariants: [
            'Le coup optimal 8/7 8/3 couvre simultanément les flèches 7 et 3 en réduisant vos pions isolés de 5 à 2.',
            'Jouer 8/7 8/3 exploite la richesse du point 8 pour fermer deux portes clés d’un seul coup.',
            'La ligne 8/7 8/3 abaisse les tirs adverses de 27/36 à 22/36 tout en doublant vos portes fermées.',
        ],
    },
    {
        id: 'harvest_t4_spares_63',
        tier: 4,
        xgid: 'XGID=-CBCa-bB----bA--a-aB-AAfb-:0:0:1:63:0:0:0:7:8',
        dice: [6, 3],
        playedMove: '7/1 21/18*',
        optimalMove: '13/7 7/4*',
        acceptableMoves: ['7/4* 13/7'],
        quizChoices: ['13/7 7/4*', '7/1 21/18*', '13/4*', '21/12'],
        equityLoss: 0.211,
        verdict: 'blunder',
        conceptId: 'golden_point',
        conceptName: 'Flexibilité des Bâtisseurs & Attaque',
        whyFailed: 'En jouant 7/1 21/18*, vous enterrez un pion sur l’As (7/1) et cassez votre présence en 21 au lieu d’attaquer en jan intérieur.',
        explanation: 'Le coup optimal 13/7 7/4* frappe sur la porte 4 tout en relayant immédiatement un pion du 13 sur le point 7 pour garder votre structure intacte.',
        proverb: 'Attaquez dans votre jan intérieur (7/4*) tout en relayant depuis le Midpoint (13/7) pour ne jamais perdre l’équilibre.',
        hint: 'Frappez le blot adverse en case 4 depuis le point 7, et remplacez votre pion en 7 depuis le 13.',
        commentaryVariants: [
            'Le coup optimal 13/7 7/4* frappe sur la case 4 tout en maintenant un relais fluide depuis le point 13.',
            'Jouer 13/7 7/4* évite d’enterrer une dame sur l’As et maximise vos lancers constructifs au tour suivant.',
            'La variante 13/7 7/4* combine attaque directe en jan intérieur et conservation des spares.',
        ],
    },
    {
        id: 'harvest_t4_clean_midpoint_52',
        tier: 4,
        xgid: 'XGID=-b-B-BC-A---dC--b-bbaa-aA-:0:0:1:52:0:0:0:7:8',
        dice: [5, 2],
        playedMove: '13/8 13/11',
        optimalMove: '13/8 8/6',
        acceptableMoves: ['13/6'],
        quizChoices: ['13/8 8/6', '13/8 13/11', '24/17', '6/1 6/4'],
        equityLoss: 0.142,
        verdict: 'blunder',
        conceptId: 'blot_safety',
        conceptName: 'Minimisation des tirs & Sécurité des blots',
        whyFailed: 'Jouer 13/8 13/11 laisse un blot gratuit sur la flèche 11 en plein axe des lancers adverses sans gain constructif.',
        explanation: 'Le coup optimal 13/8 8/6 (ou 13/6) achemine le pion en sécurité totale sur le point 6 sans concéder le moindre tir.',
        proverb: 'En milieu de partie tendu, ne laissez jamais un blot sur le point 11 quand le relais 13/6 est pur.',
        hint: 'Faites voyager un seul pion du point 13 jusqu’à la sécurité de votre point 6.',
        commentaryVariants: [
            'Le coup optimal 13/8 8/6 ramène un pion du Midpoint en sécurité absolue sur le point 6.',
            'Jouer 13/8 8/6 évite d’offrir une cible directe sur la flèche 11.',
            'La ligne 13/8 8/6 privilégie la pureté structurelle et zéro tir concédé.',
        ],
    },
    {
        id: 'harvest_t4_duplication_32',
        tier: 4,
        xgid: 'XGID=-a-B-BC-A---dC--b-ec-a-a--:0:0:1:32:0:0:0:7:8',
        dice: [3, 2],
        playedMove: '13/10 13/11',
        optimalMove: '13/8',
        acceptableMoves: ['13/10 10/8', '13/11 11/8'],
        quizChoices: ['13/8', '13/10 13/11', '6/3 6/4', '8/3'],
        equityLoss: 0.118,
        verdict: 'blunder',
        conceptId: 'blot_safety',
        conceptName: 'Minimisation des tirs & Sécurité des blots',
        whyFailed: 'Descendre deux blots séparés (13/10 13/11) double les numéros de frappe adverses sans couvrir de porte.',
        explanation: 'Le coup optimal 13/8 pose le pion directement sur le bloc existant de la flèche 8 avec zéro exposition.',
        proverb: 'Quand le champ adverse est armé, préférez l’atterrissage groupé sur le point 8 (13/8) au double blot.',
        hint: 'Additionnez vos deux dés (3 et 2) pour rejoindre directement le bloc du point 8 depuis le 13.',
        commentaryVariants: [
            'Le coup optimal 13/8 rejoint la sécurité du point 8 sans laisser de cible sur les flèches 10 et 11.',
            'Jouer 13/8 empile un bâtisseur utile sur le point 8 avec 0 tir direct.',
            'La variante 13/8 respecte le principe d’économie des blots face à un jan adverse formé.',
        ],
    },
    {
        id: 'harvest_t4_race_pure_65',
        tier: 4,
        xgid: 'XGID=-b---BD-C---cD----bc-b-a--:0:0:1:65:0:0:0:7:8',
        dice: [6, 5],
        playedMove: '13/7 13/8',
        optimalMove: '18/7',
        acceptableMoves: ['18/12 12/7', '18/13 13/7'],
        quizChoices: ['18/7', '13/7 13/8', '8/2 8/3', '13/2'],
        equityLoss: 0.095,
        verdict: 'doubtful',
        conceptId: 'race_management',
        conceptName: 'Règle de course en avance (Pip Count)',
        whyFailed: 'Jouer 13/7 13/8 oublie le dernier pion traînard sur la flèche 18 et laisse une cible inutile en 7.',
        explanation: 'Le coup optimal 18/7 ramène le dernier pion arrière d’un seul trait sur le Bar-Point sécurisé et verrouille la course pure.',
        proverb: 'En transition vers la course pure, ramenez toujours votre dernier pion arrière (18/7) en sécurité.',
        hint: 'Regardez votre pion le plus éloigné sur la flèche 18 : 6 et 5 l’amènent pile sur votre point 7 !',
        commentaryVariants: [
            'Le coup optimal 18/7 rapatrie le dernier traînard directement sur le point 7 sécurisé.',
            'Jouer 18/7 coupe tout contact résiduel et transforme votre avance de pips en victoire pure.',
            'La ligne 18/7 élimine le dernier risque de frappe adverse en un seul bond de 11 pips.',
        ],
    },
];

export const BENCHMARK_BLUNDERS: PlayerBlunderRecord[] = [
    // ================= PALIER 1 : DÉBUTANT (5 Fondamentaux Classiques) =================
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
        equityLoss: 0.178,
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
        optimalMove: '11/5',
        acceptableMoves: ['11/7 7/5', '11/9 9/5'],
        quizChoices: ['11/5', '13/9 13/11', '8/4 6/4', '24/18'],
        equityLoss: 0.215,
        verdict: 'howler',
        conceptId: 'blot_safety',
        conceptName: 'Minimisation des tirs & Sécurité des blots',
        whyFailed: 'En jouant 13/9 13/11, vous ignorez le danger du jan adverse (4 portes fermées !) et laissez un blot en 9 à portée directe.',
        explanation:
            'Face à un jan adverse solide, laisser traîner un pion isolé à portée directe (6 pips) est un suicide tactique. Le rapatrier en sécurité (11/5) était impératif.',
        proverb: 'Règle de Magriel (Safe vs Bold) : Quand le jan intérieur adverse est fermé, la sécurité des blots est absolue.',
        hint: 'Un blot en plein milieu du champ est sous le tir direct de l’adversaire. Mettez-le à l’abri dans votre jan intérieur.',
        commentaryVariants: [
            'Face à un jan adverse solide, rapatrier le blot isolé en sécurité (11/5) est impératif.',
            'Jouer 11/5 soustrait votre pion vulnérable au feu direct de la flèche 17 adverse.',
            'La ligne 11/5 élimine tout risque d’être envoyé à la barre face à un jan adverse à 4 portes.',
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
            b[6] = 2;
            b[7] = 2;
            b[8] = 3;
            b[13] = 2;
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
        quizChoices: ['8/3 6/3', '24/16', '13/8 13/10', '8/3 13/10'],
        equityLoss: 0.192,
        verdict: 'blunder',
        conceptId: 'prime_building',
        conceptName: 'Construction & Maintien de Prime',
        whyFailed: 'Courir avec 24/16 expose un blot inutile en 16 et laisse la porte 3 grande ouverte aux pions adverses.',
        explanation:
            'Avec les points 4, 5, 6 et 7 déjà tenus, construire la porte 3 (8/3 6/3) crée un barrage infranchissable de 5 portes consécutives (5-prime) qui paralyse les pions adverses.',
        proverb: 'Un mur de 5 portes consécutives (5-prime) vaut de l’or : fermez toujours la porte suivante.',
        hint: 'Regardez la porte 3 : en y assemblant deux pions, vous allongez votre mur à 5 portes consécutives.',
        commentaryVariants: [
            'Construire la porte 3 (8/3 6/3) complète un barrage de 5 portes consécutives (points 3 à 7) qui emprisonne l’adversaire.',
            'Jouer 8/3 6/3 étend votre prime à 5 flèches consécutives sans laisser de cible.',
            'La variante 8/3 6/3 transforme votre bloc de 4 portes en muraille quasi infranchissable de 5 portes.',
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
        optimalMove: '24/20 13/12',
        acceptableMoves: ['24/20 8/7', '24/20 6/5'],
        quizChoices: ['24/20 13/12', '20/15', '13/8', '24/19'],
        equityLoss: 0.145,
        verdict: 'blunder',
        conceptId: 'advanced_anchor',
        conceptName: 'Ancre avancée en jan adverse',
        whyFailed: 'En fuyant seul avec 20/15, vous abandonnez le point 20 à l’adversaire et laissez deux pions isolés au fond (24 et 15).',
        explanation:
            'Au lieu de fuir seul et d’abandonner le camp adverse, faire l’ancre sur le point 20 (24/20) neutralise l’attaque de l’adversaire et vous garantit un point d’appui imprenable.',
        proverb: 'Une ancre avancée sur le point 20 est votre meilleure assurance-vie contre les gammons.',
        hint: 'Ne laissez pas l’adversaire dominer son jan intérieur. Créez une ancre défensive solide sur la flèche 20.',
        commentaryVariants: [
            'Ancrer sur le point 20 (24/20 13/12) sécurise un avant-poste imprenable dans le jan adverse.',
            'Jouer 24/20 13/12 transforme votre blot exposé du point 20 en ancre d’or défensive.',
            'La ligne 24/20 13/12 verrouille la flèche 20 et brise le potentiel d’attaque adverse.',
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
        optimalMove: '10/4 6/5',
        acceptableMoves: ['10/3', '10/4 5/4'],
        quizChoices: ['10/4 6/5', '10/4 10/9', '6/1 5/4', '4/3 6/1'],
        equityLoss: 0.088,
        verdict: 'doubtful',
        conceptId: 'race_management',
        conceptName: 'Règle de course en avance (Pip Count)',
        whyFailed: 'Jouer 10/4 10/9 laisse un blot isolé sur la flèche 9 à portée directe du pion adverse embusqué en 15 (jet de 6 !).',
        explanation:
            'En tête à la course, chaque pion doit rentrer dans le jan intérieur le plus vite possible sans laisser de traîneau. Jouer 10/4 6/5 permet de sécuriser la rentrée sans dispersion.',
        proverb: 'En avance à la course, ne donnez jamais de coup de dés miraculeux à un adversaire embusqué.',
        hint: 'Vous menez largement à la course : rentrez vos pions en jan sans créer de blot inutile.',
        commentaryVariants: [
            'Jouer 10/4 6/5 rentre un pion en jan tout en gardant le point 10 ou en glissant sans laisser de blot en 9.',
            'En tête à la course (+25 pips), 10/4 6/5 évite d’offrir un tir de 6 au pion adverse de la flèche 15.',
            'La variante 10/4 6/5 prépare un bear-off fluide sans exposition inutile.',
        ],
        timesReviewed: 0,
        timesSolved: 0,
        isMastered: false,
    },
    ...HARVESTED_TIERED_SEEDS.map((seed, idx) => buildHarvestedBlunder(seed, idx)),
    ...HARVESTED_MULTIPLY_9CAT_SEEDS.map((seed, idx) => buildHarvestedBlunder(seed, 30 + idx)),
];
