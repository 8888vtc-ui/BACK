/**
 * Quizz Tactiques Certifiés 3-Ply issus de la Campagne 5 000 Parties (BT-Core v2.0 vs GNU Backgammon 3-Ply [world class]).
 * Zéro donnée perdue — Généré automatiquement et vérifié sur les 6 formats de match (Money Game, 3, 5, 7, 9, 11 pts).
 */
import type { HarvestedSeedInput } from './benchmarkBlunders';

export const BTCORE_5000_HARVEST_SEEDS: HarvestedSeedInput[] = [
    {
        "id": "btcore5k_3ply_1_54",
        "tier": 3,
        "xgid": "XGID=-b-B--D-B---eE---b-d-b--B-:0:0:1:54:0:0:0:0:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/9 13/8",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "24/20 13/8",
            "13/9 13/8",
            "24/15",
            "13/4"
        ],
        "equityLoss": 0.069,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/9 13/8 (Money Game), vous concédez -0.069 EMG face à la ligne 3-ply 24/20 13/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-4 en Money Game : 24/20 13/8 surpasse 13/9 13/8 de +0.069 EMG (49.4 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 24/20 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/20 13/8 domine 13/9 13/8 de +0.069 EMG.",
            "En Money Game, 24/20 13/8 maximise votre équité cubeful (-0.015 EMG).",
            "Évitez le piège 13/9 13/8 (-0.069 EMG) ; préférez la ligne maîtresse 24/20 13/8."
        ]
    },
    {
        "id": "btcore5k_3ply_2_31",
        "tier": 2,
        "xgid": "XGID=-b-B--D-CA--dC---b-d-c--B-:0:0:1:31:0:0:0:0:8",
        "dice": [
            3,
            1
        ],
        "playedMove": "13/9",
        "optimalMove": "8/5 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5 6/5",
            "13/9",
            "24/20",
            "24/23 9/6"
        ],
        "equityLoss": 0.312,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/9 (Money Game), vous concédez -0.312 EMG face à la ligne 3-ply 8/5 6/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-1 en Money Game : 8/5 6/5 surpasse 13/9 de +0.312 EMG (56.8 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/5 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/5 6/5 domine 13/9 de +0.312 EMG.",
            "En Money Game, 8/5 6/5 maximise votre équité cubeful (+0.293 EMG).",
            "Évitez le piège 13/9 (-0.312 EMG) ; préférez la ligne maîtresse 8/5 6/5."
        ]
    },
    {
        "id": "btcore5k_3ply_3_33",
        "tier": 3,
        "xgid": "XGID=---B-BCbBA--bC---bbd-c--B-:0:0:1:33:0:0:0:0:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "9/6 8/2 8/5",
        "optimalMove": "8/2(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "8/2(2)",
            "9/6 8/2 8/5",
            "13/10(3) 9/6",
            "9/3 8/5(2)"
        ],
        "equityLoss": 0.1,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 9/6 8/2 8/5 (Money Game), vous concédez -0.100 EMG face à la ligne 3-ply 8/2(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-3 en Money Game : 8/2(2) surpasse 9/6 8/2 8/5 de +0.100 EMG (32.6 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 8/2(2) pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/2(2) domine 9/6 8/2 8/5 de +0.100 EMG.",
            "En Money Game, 8/2(2) maximise votre équité cubeful (-0.670 EMG).",
            "Évitez le piège 9/6 8/2 8/5 (-0.100 EMG) ; préférez la ligne maîtresse 8/2(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_4_45",
        "tier": 4,
        "xgid": "XGID=---B-BDbB-C-b----abd-bb-B-:0:0:1:45:0:0:0:0:8",
        "dice": [
            4,
            5
        ],
        "playedMove": "24/15",
        "optimalMove": "24/20 10/5",
        "acceptableMoves": [],
        "quizChoices": [
            "24/20 10/5",
            "24/15",
            "24/20 6/1",
            "10/5 6/2"
        ],
        "equityLoss": 0.038,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 24/15 (Money Game), vous concédez -0.038 EMG face à la ligne 3-ply 24/20 10/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-5 en Money Game : 24/20 10/5 surpasse 24/15 de +0.038 EMG (31.7 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 24/20 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/20 10/5 domine 24/15 de +0.038 EMG.",
            "En Money Game, 24/20 10/5 maximise votre équité cubeful (-0.807 EMG).",
            "Évitez le piège 24/15 (-0.038 EMG) ; préférez la ligne maîtresse 24/20 10/5."
        ]
    },
    {
        "id": "btcore5k_3ply_5_44",
        "tier": 2,
        "xgid": "XGID=-A-B-BDbB-B-a----bbc-cb-B-:0:0:1:44:0:0:0:0:8",
        "dice": [
            4,
            4
        ],
        "playedMove": "24/20(2) 6/2(2)",
        "optimalMove": "24/16(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "24/16(2)",
            "24/20(2) 6/2(2)",
            "24/20(2) 8/4(2)",
            "24/20(2) 6/2 5/1"
        ],
        "equityLoss": 0.182,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/20(2) 6/2(2) (Money Game), vous concédez -0.182 EMG face à la ligne 3-ply 24/16(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-4 en Money Game : 24/16(2) surpasse 24/20(2) 6/2(2) de +0.182 EMG (55.0 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 24/16(2) pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/16(2) domine 24/20(2) 6/2(2) de +0.182 EMG.",
            "En Money Game, 24/16(2) maximise votre équité cubeful (+0.152 EMG).",
            "Évitez le piège 24/20(2) 6/2(2) (-0.182 EMG) ; préférez la ligne maîtresse 24/16(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_6_26",
        "tier": 4,
        "xgid": "XGID=-A-BBBDb--B------bcbBdb---:0:0:1:26:0:0:0:0:8",
        "dice": [
            2,
            6
        ],
        "playedMove": "20/14 3/1",
        "optimalMove": "20/14 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "20/14 6/4",
            "20/14 3/1",
            "10/8 10/4",
            "10/2"
        ],
        "equityLoss": 0.059,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 20/14 3/1 (Money Game), vous concédez -0.059 EMG face à la ligne 3-ply 20/14 6/4.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-6 en Money Game : 20/14 6/4 surpasse 20/14 3/1 de +0.059 EMG (44.1 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 20/14 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 20/14 6/4 domine 20/14 3/1 de +0.059 EMG.",
            "En Money Game, 20/14 6/4 maximise votre équité cubeful (-0.189 EMG).",
            "Évitez le piège 20/14 3/1 (-0.059 EMG) ; préférez la ligne maîtresse 20/14 6/4."
        ]
    },
    {
        "id": "btcore5k_3ply_7_22",
        "tier": 2,
        "xgid": "XGID=aB-BBBD-B--------ccb-db-A-:0:0:1:22:0:0:0:0:8",
        "dice": [
            2,
            2
        ],
        "playedMove": "8/2 6/4",
        "optimalMove": "6/2(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "6/2(2)",
            "8/2 6/4",
            "8/4(2)",
            "8/4 6/4(2)"
        ],
        "equityLoss": 0.465,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 8/2 6/4 (Money Game), vous concédez -0.465 EMG face à la ligne 3-ply 6/2(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-2 en Money Game : 6/2(2) surpasse 8/2 6/4 de +0.465 EMG (78.8 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 6/2(2) pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 6/2(2) domine 8/2 6/4 de +0.465 EMG.",
            "En Money Game, 6/2(2) maximise votre équité cubeful (+0.955 EMG).",
            "Évitez le piège 8/2 6/4 (-0.465 EMG) ; préférez la ligne maîtresse 6/2(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_8_15",
        "tier": 3,
        "xgid": "XGID=aBBCBBC----------ccb-db-A-:0:0:1:15:0:0:0:0:8",
        "dice": [
            1,
            5
        ],
        "playedMove": "6/1 3/2",
        "optimalMove": "24/23 6/1",
        "acceptableMoves": [],
        "quizChoices": [
            "24/23 6/1",
            "6/1 3/2",
            "6/5 6/1",
            "6/1 5/4"
        ],
        "equityLoss": 0.103,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 6/1 3/2 (Money Game), vous concédez -0.103 EMG face à la ligne 3-ply 24/23 6/1.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-5 en Money Game : 24/23 6/1 surpasse 6/1 3/2 de +0.103 EMG (67.6 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 24/23 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/23 6/1 domine 6/1 3/2 de +0.103 EMG.",
            "En Money Game, 24/23 6/1 maximise votre équité cubeful (+0.657 EMG).",
            "Évitez le piège 6/1 3/2 (-0.103 EMG) ; préférez la ligne maîtresse 24/23 6/1."
        ]
    },
    {
        "id": "btcore5k_3ply_9_22",
        "tier": 4,
        "xgid": "XGID=aCCBBBB----------ccb-db-A-:0:0:1:22:0:0:0:0:8",
        "dice": [
            2,
            2
        ],
        "playedMove": "5/1(2)",
        "optimalMove": "6/4(2) 5/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "6/4(2) 5/3(2)",
            "5/1(2)",
            "6/2(2)",
            "6/4(2) 3/1(2)"
        ],
        "equityLoss": 0.052,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 5/1(2) (Money Game), vous concédez -0.052 EMG face à la ligne 3-ply 6/4(2) 5/3(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-2 en Money Game : 6/4(2) 5/3(2) surpasse 5/1(2) de +0.052 EMG (51.2 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 6/4(2) pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 6/4(2) 5/3(2) domine 5/1(2) de +0.052 EMG.",
            "En Money Game, 6/4(2) 5/3(2) maximise votre équité cubeful (+0.036 EMG).",
            "Évitez le piège 5/1(2) (-0.052 EMG) ; préférez la ligne maîtresse 6/4(2) 5/3(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_10_63",
        "tier": 4,
        "xgid": "XGID=-b--B-D-B---cE--ac-d--b-B-:0:0:1:63:0:0:0:0:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/18 13/10",
        "optimalMove": "24/15",
        "acceptableMoves": [],
        "quizChoices": [
            "24/15",
            "24/18 13/10",
            "13/4",
            "13/10 13/7"
        ],
        "equityLoss": 0.033,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/18 13/10 (Money Game), vous concédez -0.033 EMG face à la ligne 3-ply 24/15.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-3 en Money Game : 24/15 surpasse 24/18 13/10 de +0.033 EMG (48.7 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 24/15 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/15 domine 24/18 13/10 de +0.033 EMG.",
            "En Money Game, 24/15 maximise votre équité cubeful (-0.114 EMG).",
            "Évitez le piège 24/18 13/10 (-0.033 EMG) ; préférez la ligne maîtresse 24/15."
        ]
    },
    {
        "id": "btcore5k_3ply_11_66",
        "tier": 2,
        "xgid": "XGID=-b--C-D-B---cD--ab-cb-b-B-:0:0:1:66:0:0:0:0:8",
        "dice": [
            6,
            6
        ],
        "playedMove": "24/18(2) 8/2(2)",
        "optimalMove": "24/18(2) 13/7(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "24/18(2) 13/7(2)",
            "24/18(2) 8/2(2)",
            "13/7(4)",
            "13/7(2) 8/2(2)"
        ],
        "equityLoss": 0.332,
        "verdict": "howler",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 24/18(2) 8/2(2) (Money Game), vous concédez -0.332 EMG face à la ligne 3-ply 24/18(2) 13/7(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-6 en Money Game : 24/18(2) 13/7(2) surpasse 24/18(2) 8/2(2) de +0.332 EMG (65.1 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 24/18(2) pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/18(2) 13/7(2) domine 24/18(2) 8/2(2) de +0.332 EMG.",
            "En Money Game, 24/18(2) 13/7(2) maximise votre équité cubeful (+0.542 EMG).",
            "Évitez le piège 24/18(2) 8/2(2) (-0.332 EMG) ; préférez la ligne maîtresse 24/18(2) 13/7(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_12_51",
        "tier": 4,
        "xgid": "XGID=-b--C-DBB----B-c-bBdb-b---:0:0:1:51:0:0:0:0:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "8/3 4/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 4/3",
            "13/7",
            "13/12 13/8",
            "13/8 6/5"
        ],
        "equityLoss": 0.044,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/7 (Money Game), vous concédez -0.044 EMG face à la ligne 3-ply 8/3 4/3.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-1 en Money Game : 8/3 4/3 surpasse 13/7 de +0.044 EMG (69.0 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/3 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/3 4/3 domine 13/7 de +0.044 EMG.",
            "En Money Game, 8/3 4/3 maximise votre équité cubeful (+0.781 EMG).",
            "Évitez le piège 13/7 (-0.044 EMG) ; préférez la ligne maîtresse 8/3 4/3."
        ]
    },
    {
        "id": "btcore5k_3ply_13_52",
        "tier": 4,
        "xgid": "XGID=-b-BB-DBA----B-b-bBdb-b-a-:0:0:1:52:0:0:0:0:8",
        "dice": [
            5,
            2
        ],
        "playedMove": "13/11 13/8",
        "optimalMove": "13/8 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "13/8 6/4",
            "13/11 13/8",
            "13/11 8/3",
            "13/6"
        ],
        "equityLoss": 0.034,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/11 13/8 (Money Game), vous concédez -0.034 EMG face à la ligne 3-ply 13/8 6/4.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-2 en Money Game : 13/8 6/4 surpasse 13/11 13/8 de +0.034 EMG (76.3 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/8 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/8 6/4 domine 13/11 13/8 de +0.034 EMG.",
            "En Money Game, 13/8 6/4 maximise votre équité cubeful (+0.958 EMG).",
            "Évitez le piège 13/11 13/8 (-0.034 EMG) ; préférez la ligne maîtresse 13/8 6/4."
        ]
    },
    {
        "id": "btcore5k_3ply_14_62",
        "tier": 4,
        "xgid": "XGID=---BCbCBB----A-b--Bdbbb-a-:0:0:1:62:0:0:0:0:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "13/7 3/1",
        "optimalMove": "13/7 4/2",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7 4/2",
            "13/7 3/1",
            "13/7 6/4",
            "8/6 8/2"
        ],
        "equityLoss": 0.059,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/7 3/1 (Money Game), vous concédez -0.059 EMG face à la ligne 3-ply 13/7 4/2.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-2 en Money Game : 13/7 4/2 surpasse 13/7 3/1 de +0.059 EMG (52.2 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/7 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/7 4/2 domine 13/7 3/1 de +0.059 EMG.",
            "En Money Game, 13/7 4/2 maximise votre équité cubeful (+0.052 EMG).",
            "Évitez le piège 13/7 3/1 (-0.059 EMG) ; préférez la ligne maîtresse 13/7 4/2."
        ]
    },
    {
        "id": "btcore5k_3ply_15_53",
        "tier": 2,
        "xgid": "XGID=-a-BDbBCB-------AA-dbbb-b-:0:0:1:53:0:0:0:0:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "17/12 16/13",
        "optimalMove": "16/8",
        "acceptableMoves": [],
        "quizChoices": [
            "16/8",
            "17/12 16/13",
            "17/12 7/4",
            "17/9"
        ],
        "equityLoss": 0.306,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 17/12 16/13 (Money Game), vous concédez -0.306 EMG face à la ligne 3-ply 16/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-3 en Money Game : 16/8 surpasse 17/12 16/13 de +0.306 EMG (69.2 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 16/8 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 16/8 domine 17/12 16/13 de +0.306 EMG.",
            "En Money Game, 16/8 maximise votre équité cubeful (+0.611 EMG).",
            "Évitez le piège 17/12 16/13 (-0.306 EMG) ; préférez la ligne maîtresse 16/8."
        ]
    },
    {
        "id": "btcore5k_3ply_16_45",
        "tier": 3,
        "xgid": "XGID=-b----E-D---dD---c-fA---A-:0:0:1:45:1:1:0:3:8",
        "dice": [
            4,
            5
        ],
        "playedMove": "20/11",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "24/20 13/8",
            "20/11",
            "24/20 8/3",
            "20/16 13/8"
        ],
        "equityLoss": 0.071,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 20/11 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.071 EMG face à la ligne 3-ply 24/20 13/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-5 en Match en 3 pts (1-1, Videau à 1) : 24/20 13/8 surpasse 20/11 de +0.071 EMG (56.4 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 24/20 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/20 13/8 domine 20/11 de +0.071 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 24/20 13/8 maximise votre équité cubeful (+0.362 EMG).",
            "Évitez le piège 20/11 (-0.071 EMG) ; préférez la ligne maîtresse 24/20 13/8."
        ]
    },
    {
        "id": "btcore5k_3ply_17_45",
        "tier": 4,
        "xgid": "XGID=-b----E-E---dC---c-dBaa---:0:0:1:45:1:1:0:3:8",
        "dice": [
            4,
            5
        ],
        "playedMove": "13/9 8/3",
        "optimalMove": "20/11",
        "acceptableMoves": [],
        "quizChoices": [
            "20/11",
            "13/9 8/3",
            "13/4",
            "20/16 20/15"
        ],
        "equityLoss": 0.052,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/9 8/3 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.052 EMG face à la ligne 3-ply 20/11.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-5 en Match en 3 pts (1-1, Videau à 1) : 20/11 surpasse 13/9 8/3 de +0.052 EMG (53.7 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 20/11 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 20/11 domine 13/9 8/3 de +0.052 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 20/11 maximise votre équité cubeful (+0.206 EMG).",
            "Évitez le piège 13/9 8/3 (-0.052 EMG) ; préférez la ligne maîtresse 20/11."
        ]
    },
    {
        "id": "btcore5k_3ply_18_65",
        "tier": 4,
        "xgid": "XGID=-b--A-E-E---cB---d-cBab---:0:0:1:65:1:1:0:3:8",
        "dice": [
            6,
            5
        ],
        "playedMove": "20/9",
        "optimalMove": "20/15 20/14",
        "acceptableMoves": [],
        "quizChoices": [
            "20/15 20/14",
            "20/9",
            "8/3 8/2",
            "13/8 13/7"
        ],
        "equityLoss": 0.059,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 20/9 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.059 EMG face à la ligne 3-ply 20/15 20/14.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-5 en Match en 3 pts (1-1, Videau à 1) : 20/15 20/14 surpasse 20/9 de +0.059 EMG (46.7 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 20/15 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 20/15 20/14 domine 20/9 de +0.059 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 20/15 20/14 maximise votre équité cubeful (-0.186 EMG).",
            "Évitez le piège 20/9 (-0.059 EMG) ; préférez la ligne maîtresse 20/15 20/14."
        ]
    },
    {
        "id": "btcore5k_3ply_19_42",
        "tier": 4,
        "xgid": "XGID=-b--A-EAF---b----d-cBaba--:0:0:1:42:1:1:0:3:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "8/4 6/4",
        "optimalMove": "8/4 7/5",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 7/5",
            "8/4 6/4",
            "7/3 6/4",
            "8/6 8/4"
        ],
        "equityLoss": 0.036,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 8/4 6/4 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.036 EMG face à la ligne 3-ply 8/4 7/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-2 en Match en 3 pts (1-1, Videau à 1) : 8/4 7/5 surpasse 8/4 6/4 de +0.036 EMG (56.6 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 8/4 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/4 7/5 domine 8/4 6/4 de +0.036 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 8/4 7/5 maximise votre équité cubeful (+0.374 EMG).",
            "Évitez le piège 8/4 6/4 (-0.036 EMG) ; préférez la ligne maîtresse 8/4 7/5."
        ]
    },
    {
        "id": "btcore5k_3ply_20_44",
        "tier": 2,
        "xgid": "XGID=-b--BAE-E---b----b-cBbbb--:0:0:1:44:1:1:0:3:8",
        "dice": [
            4,
            4
        ],
        "playedMove": "8/4(2) 6/2(2)",
        "optimalMove": "20/16(2) 6/2(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "20/16(2) 6/2(2)",
            "8/4(2) 6/2(2)",
            "8/4 6/2(3)",
            "20/16(2) 8/4(2)"
        ],
        "equityLoss": 0.252,
        "verdict": "howler",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 8/4(2) 6/2(2) (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.252 EMG face à la ligne 3-ply 20/16(2) 6/2(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-4 en Match en 3 pts (1-1, Videau à 1) : 20/16(2) 6/2(2) surpasse 8/4(2) 6/2(2) de +0.252 EMG (56.3 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 20/16(2) pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 20/16(2) 6/2(2) domine 8/4(2) 6/2(2) de +0.252 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 20/16(2) 6/2(2) maximise votre équité cubeful (+0.346 EMG).",
            "Évitez le piège 8/4(2) 6/2(2) (-0.252 EMG) ; préférez la ligne maîtresse 20/16(2) 6/2(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_21_16",
        "tier": 2,
        "xgid": "XGID=-bB-DAC-C--------b-cBbdb--:0:0:1:16:1:1:0:3:8",
        "dice": [
            1,
            6
        ],
        "playedMove": "20/14 6/5",
        "optimalMove": "8/2 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "8/2 6/5",
            "20/14 6/5",
            "8/2 5/4",
            "20/14 5/4"
        ],
        "equityLoss": 0.168,
        "verdict": "howler",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 20/14 6/5 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.168 EMG face à la ligne 3-ply 8/2 6/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-6 en Match en 3 pts (1-1, Videau à 1) : 8/2 6/5 surpasse 20/14 6/5 de +0.168 EMG (69.7 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 8/2 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/2 6/5 domine 20/14 6/5 de +0.168 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 8/2 6/5 maximise votre équité cubeful (+0.872 EMG).",
            "Évitez le piège 20/14 6/5 (-0.168 EMG) ; préférez la ligne maîtresse 8/2 6/5."
        ]
    },
    {
        "id": "btcore5k_3ply_22_44",
        "tier": 2,
        "xgid": "XGID=-aC-DBBaB----A------Addda-:0:0:1:44:1:1:0:3:8",
        "dice": [
            4,
            4
        ],
        "playedMove": "20/12 5/1*(2)",
        "optimalMove": "20/16 13/1*",
        "acceptableMoves": [],
        "quizChoices": [
            "20/16 13/1*",
            "20/12 5/1*(2)",
            "20/16 13/9 5/1*(2)",
            "13/1* 8/4"
        ],
        "equityLoss": 0.139,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 20/12 5/1*(2) (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.139 EMG face à la ligne 3-ply 20/16 13/1*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-4 en Match en 3 pts (1-1, Videau à 1) : 20/16 13/1* surpasse 20/12 5/1*(2) de +0.139 EMG (76.9 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 20/16 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 20/16 13/1* domine 20/12 5/1*(2) de +0.139 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 20/16 13/1* maximise votre équité cubeful (+0.981 EMG).",
            "Évitez le piège 20/12 5/1*(2) (-0.139 EMG) ; préférez la ligne maîtresse 20/16 13/1*."
        ]
    },
    {
        "id": "btcore5k_3ply_23_33",
        "tier": 4,
        "xgid": "XGID=--C-DBBbCA-----------ddcb-:0:0:1:33:1:1:0:3:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "9/3 8/5 6/3",
        "optimalMove": "9/6 8/5(3)",
        "acceptableMoves": [],
        "quizChoices": [
            "9/6 8/5(3)",
            "9/3 8/5 6/3",
            "9/3 8/5 4/1",
            "9/3 8/2"
        ],
        "equityLoss": 0.033,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 9/3 8/5 6/3 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.033 EMG face à la ligne 3-ply 9/6 8/5(3).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-3 en Match en 3 pts (1-1, Videau à 1) : 9/6 8/5(3) surpasse 9/3 8/5 6/3 de +0.033 EMG (72.1 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 9/6 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 9/6 8/5(3) domine 9/3 8/5 6/3 de +0.033 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 9/6 8/5(3) maximise votre équité cubeful (+0.877 EMG).",
            "Évitez le piège 9/3 8/5 6/3 (-0.033 EMG) ; préférez la ligne maîtresse 9/6 8/5(3)."
        ]
    },
    {
        "id": "btcore5k_3ply_24_23",
        "tier": 4,
        "xgid": "XGID=--CACEB-----a-a------ddcb-:0:0:1:23:1:1:0:3:8",
        "dice": [
            2,
            3
        ],
        "playedMove": "5/3 5/2",
        "optimalMove": "3/off 2/off",
        "acceptableMoves": [
            "4/1 2/off",
            "5/off"
        ],
        "quizChoices": [
            "3/off 2/off",
            "5/3 5/2",
            "4/1 2/off",
            "5/off"
        ],
        "equityLoss": 0.041,
        "verdict": "doubtful",
        "conceptId": "bearoff_technique",
        "conceptName": "Technique de Sortie (Bear-off)",
        "whyFailed": "En jouant 5/3 5/2 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.041 EMG face à la ligne 3-ply 3/off 2/off.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-3 en Match en 3 pts (1-1, Videau à 1) : 3/off 2/off surpasse 5/3 5/2 de +0.041 EMG (75.7 % de gain).",
        "proverb": "En sortie de dames, minimisez le gaspillage de pips et évitez les trous sur les flèches hautes.",
        "hint": "Analysez le coup commençant par 3/off pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 3/off 2/off domine 5/3 5/2 de +0.041 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 3/off 2/off maximise votre équité cubeful (+0.917 EMG).",
            "Évitez le piège 5/3 5/2 (-0.041 EMG) ; préférez la ligne maîtresse 3/off 2/off."
        ]
    },
    {
        "id": "btcore5k_3ply_25_41",
        "tier": 4,
        "xgid": "XGID=--B-CEB-------a----a-ddcb-:0:0:1:41:1:1:0:3:8",
        "dice": [
            4,
            1
        ],
        "playedMove": "5/4 5/1",
        "optimalMove": "5/off",
        "acceptableMoves": [
            "4/off 2/1",
            "4/3 4/off"
        ],
        "quizChoices": [
            "5/off",
            "5/4 5/1",
            "4/off 2/1",
            "4/3 4/off"
        ],
        "equityLoss": 0.044,
        "verdict": "doubtful",
        "conceptId": "bearoff_technique",
        "conceptName": "Technique de Sortie (Bear-off)",
        "whyFailed": "En jouant 5/4 5/1 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.044 EMG face à la ligne 3-ply 5/off.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-1 en Match en 3 pts (1-1, Videau à 1) : 5/off surpasse 5/4 5/1 de +0.044 EMG (71.3 % de gain).",
        "proverb": "En sortie de dames, minimisez le gaspillage de pips et évitez les trous sur les flèches hautes.",
        "hint": "Analysez le coup commençant par 5/off pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 5/off domine 5/4 5/1 de +0.044 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 5/off maximise votre équité cubeful (+0.860 EMG).",
            "Évitez le piège 5/4 5/1 (-0.044 EMG) ; préférez la ligne maîtresse 5/off."
        ]
    },
    {
        "id": "btcore5k_3ply_26_15",
        "tier": 4,
        "xgid": "XGID=--B-CDB-----------a--decb-:0:0:1:15:1:1:0:3:8",
        "dice": [
            1,
            5
        ],
        "playedMove": "6/1 4/3",
        "optimalMove": "5/off 4/3",
        "acceptableMoves": [
            "5/off 2/1",
            "5/4 5/off"
        ],
        "quizChoices": [
            "5/off 4/3",
            "6/1 4/3",
            "5/off 2/1",
            "5/4 5/off"
        ],
        "equityLoss": 0.032,
        "verdict": "doubtful",
        "conceptId": "race_management",
        "conceptName": "Course & Compte de Pips (Keith)",
        "whyFailed": "En jouant 6/1 4/3 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.032 EMG face à la ligne 3-ply 5/off 4/3.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-5 en Match en 3 pts (1-1, Videau à 1) : 5/off 4/3 surpasse 6/1 4/3 de +0.032 EMG (76.7 % de gain).",
        "proverb": "En course sans contact, franchissez les quadrants (crossovers) en priorité avec vos pions arrières.",
        "hint": "Analysez le coup commençant par 5/off pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 5/off 4/3 domine 6/1 4/3 de +0.032 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 5/off 4/3 maximise votre équité cubeful (+0.904 EMG).",
            "Évitez le piège 6/1 4/3 (-0.032 EMG) ; préférez la ligne maîtresse 5/off 4/3."
        ]
    },
    {
        "id": "btcore5k_3ply_27_62",
        "tier": 2,
        "xgid": "XGID=--BABCB--------------afcb-:0:0:1:62:1:1:0:3:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "6/off 5/3",
        "optimalMove": "6/off 2/off",
        "acceptableMoves": [],
        "quizChoices": [
            "6/off 2/off",
            "6/off 5/3",
            "6/4 6/off",
            "6/off 3/1"
        ],
        "equityLoss": 0.21,
        "verdict": "howler",
        "conceptId": "race_management",
        "conceptName": "Course & Compte de Pips (Keith)",
        "whyFailed": "En jouant 6/off 5/3 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.210 EMG face à la ligne 3-ply 6/off 2/off.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-2 en Match en 3 pts (1-1, Videau à 1) : 6/off 2/off surpasse 6/off 5/3 de +0.210 EMG (54.0 % de gain).",
        "proverb": "En course sans contact, franchissez les quadrants (crossovers) en priorité avec vos pions arrières.",
        "hint": "Analysez le coup commençant par 6/off pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 6/off 2/off domine 6/off 5/3 de +0.210 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 6/off 2/off maximise votre équité cubeful (+0.223 EMG).",
            "Évitez le piège 6/off 5/3 (-0.210 EMG) ; préférez la ligne maîtresse 6/off 2/off."
        ]
    },
    {
        "id": "btcore5k_3ply_28_23",
        "tier": 3,
        "xgid": "XGID=-b----E-D---cD---c-e-bA-A-:0:0:1:23:1:1:0:3:8",
        "dice": [
            2,
            3
        ],
        "playedMove": "24/22 8/5",
        "optimalMove": "24/22 13/10",
        "acceptableMoves": [],
        "quizChoices": [
            "24/22 13/10",
            "24/22 8/5",
            "24/22 6/3",
            "13/11 13/10"
        ],
        "equityLoss": 0.086,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 24/22 8/5 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.086 EMG face à la ligne 3-ply 24/22 13/10.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-3 en Match en 3 pts (1-1, Videau à 1) : 24/22 13/10 surpasse 24/22 8/5 de +0.086 EMG (45.5 % de gain).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Analysez le coup commençant par 24/22 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/22 13/10 domine 24/22 8/5 de +0.086 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 24/22 13/10 maximise votre équité cubeful (-0.256 EMG).",
            "Évitez le piège 24/22 8/5 (-0.086 EMG) ; préférez la ligne maîtresse 24/22 13/10."
        ]
    },
    {
        "id": "btcore5k_3ply_29_35",
        "tier": 2,
        "xgid": "XGID=-a----E-D-a-cC---c-e-bB--A:0:0:1:35:1:1:0:3:8",
        "dice": [
            3,
            5
        ],
        "playedMove": "bar/20 8/5",
        "optimalMove": "bar/20 13/10*",
        "acceptableMoves": [],
        "quizChoices": [
            "bar/20 13/10*",
            "bar/20 8/5",
            "bar/20 6/3",
            "bar/22 8/3"
        ],
        "equityLoss": 0.315,
        "verdict": "howler",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant bar/20 8/5 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.315 EMG face à la ligne 3-ply bar/20 13/10*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-5 en Match en 3 pts (1-1, Videau à 1) : bar/20 13/10* surpasse bar/20 8/5 de +0.315 EMG (42.0 % de gain).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Analysez le coup commençant par bar/20 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : bar/20 13/10* domine bar/20 8/5 de +0.315 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), bar/20 13/10* maximise votre équité cubeful (-0.453 EMG).",
            "Évitez le piège bar/20 8/5 (-0.315 EMG) ; préférez la ligne maîtresse bar/20 13/10*."
        ]
    },
    {
        "id": "btcore5k_3ply_30_56",
        "tier": 3,
        "xgid": "XGID=-a----E-E---cB---c-e-cC---:0:0:1:56:1:1:0:3:8",
        "dice": [
            5,
            6
        ],
        "playedMove": "22/16 8/3",
        "optimalMove": "22/11",
        "acceptableMoves": [],
        "quizChoices": [
            "22/11",
            "22/16 8/3",
            "22/16 6/1*",
            "8/3 8/2"
        ],
        "equityLoss": 0.085,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 22/16 8/3 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.085 EMG face à la ligne 3-ply 22/11.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-6 en Match en 3 pts (1-1, Videau à 1) : 22/11 surpasse 22/16 8/3 de +0.085 EMG (36.4 % de gain).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Analysez le coup commençant par 22/11 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 22/11 domine 22/16 8/3 de +0.085 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 22/11 maximise votre équité cubeful (-0.766 EMG).",
            "Évitez le piège 22/16 8/3 (-0.085 EMG) ; préférez la ligne maîtresse 22/11."
        ]
    },
    {
        "id": "btcore5k_3ply_31_64",
        "tier": 3,
        "xgid": "XGID=-----aE-E--AcB---c-e-bBa--:0:0:1:64:1:1:0:3:8",
        "dice": [
            6,
            4
        ],
        "playedMove": "13/9 11/5*",
        "optimalMove": "11/5* 8/4",
        "acceptableMoves": [],
        "quizChoices": [
            "11/5* 8/4",
            "13/9 11/5*",
            "11/5* 6/2",
            "11/5*/1"
        ],
        "equityLoss": 0.078,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/9 11/5* (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.078 EMG face à la ligne 3-ply 11/5* 8/4.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-4 en Match en 3 pts (1-1, Videau à 1) : 11/5* 8/4 surpasse 13/9 11/5* de +0.078 EMG (38.6 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 11/5* pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 11/5* 8/4 domine 13/9 11/5* de +0.078 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 11/5* 8/4 maximise votre équité cubeful (-0.642 EMG).",
            "Évitez le piège 13/9 11/5* (-0.078 EMG) ; préférez la ligne maîtresse 11/5* 8/4."
        ]
    },
    {
        "id": "btcore5k_3ply_32_44",
        "tier": 4,
        "xgid": "XGID=-B-C--D-B--a-B--bd-d-bBb--:0:0:1:44:1:1:0:3:8",
        "dice": [
            4,
            4
        ],
        "playedMove": "22/18(2) 13/9(2)",
        "optimalMove": "22/14(2)",
        "acceptableMoves": [
            "22/18(2) 8/4(2)"
        ],
        "quizChoices": [
            "22/14(2)",
            "22/18(2) 13/9(2)",
            "22/18(2) 8/4(2)",
            "22/18(2) 6/2(2)"
        ],
        "equityLoss": 0.048,
        "verdict": "doubtful",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 22/18(2) 13/9(2) (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.048 EMG face à la ligne 3-ply 22/14(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-4 en Match en 3 pts (1-1, Videau à 1) : 22/14(2) surpasse 22/18(2) 13/9(2) de +0.048 EMG (33.1 % de gain).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Analysez le coup commençant par 22/14(2) pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 22/14(2) domine 22/18(2) 13/9(2) de +0.048 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 22/14(2) maximise votre équité cubeful (-0.952 EMG).",
            "Évitez le piège 22/18(2) 13/9(2) (-0.048 EMG) ; préférez la ligne maîtresse 22/14(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_33_43",
        "tier": 4,
        "xgid": "XGID=-CCCB-B------------ddbBbb-:0:0:1:43:1:1:0:3:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "6/2 4/1",
        "optimalMove": "22/15",
        "acceptableMoves": [],
        "quizChoices": [
            "22/15",
            "6/2 4/1",
            "6/3 6/2",
            "22/18 4/1"
        ],
        "equityLoss": 0.041,
        "verdict": "doubtful",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 6/2 4/1 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.041 EMG face à la ligne 3-ply 22/15.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-3 en Match en 3 pts (1-1, Videau à 1) : 22/15 surpasse 6/2 4/1 de +0.041 EMG (5.3 % de gain).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Analysez le coup commençant par 22/15 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 22/15 domine 6/2 4/1 de +0.041 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 22/15 maximise votre équité cubeful (-1.030 EMG).",
            "Évitez le piège 6/2 4/1 (-0.041 EMG) ; préférez la ligne maîtresse 22/15."
        ]
    },
    {
        "id": "btcore5k_3ply_34_43",
        "tier": 4,
        "xgid": "XGID=-CDDB----------A---dbbAbb-:0:0:1:43:1:1:0:3:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "15/11 4/1",
        "optimalMove": "15/8",
        "acceptableMoves": [
            "22/18 15/12",
            "22/15",
            "22/18 4/1"
        ],
        "quizChoices": [
            "15/8",
            "15/11 4/1",
            "22/18 15/12",
            "22/15"
        ],
        "equityLoss": 0.033,
        "verdict": "doubtful",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 15/11 4/1 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.033 EMG face à la ligne 3-ply 15/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-3 en Match en 3 pts (1-1, Videau à 1) : 15/8 surpasse 15/11 4/1 de +0.033 EMG (4.2 % de gain).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Analysez le coup commençant par 15/8 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 15/8 domine 15/11 4/1 de +0.033 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 15/8 maximise votre équité cubeful (-1.002 EMG).",
            "Évitez le piège 15/11 4/1 (-0.033 EMG) ; préférez la ligne maîtresse 15/8."
        ]
    },
    {
        "id": "btcore5k_3ply_35_62",
        "tier": 3,
        "xgid": "XGID=-b--B-D-B---dE-a-c-e----B-:0:0:1:62:2:2:0:5:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "24/16",
        "optimalMove": "24/18 13/11",
        "acceptableMoves": [],
        "quizChoices": [
            "24/18 13/11",
            "24/16",
            "13/11 13/7",
            "24/22 24/18"
        ],
        "equityLoss": 0.088,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 24/16 (Match en 5 pts (2-2, Videau à 1)), vous concédez -0.088 EMG face à la ligne 3-ply 24/18 13/11.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-2 en Match en 5 pts (2-2, Videau à 1) : 24/18 13/11 surpasse 24/16 de +0.088 EMG (56.1 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 24/18 pour optimiser votre structure en Match en 5 pts (2-2, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/18 13/11 domine 24/16 de +0.088 EMG.",
            "En Match en 5 pts (2-2, Videau à 1), 24/18 13/11 maximise votre équité cubeful (+0.270 EMG).",
            "Évitez le piège 24/16 (-0.088 EMG) ; préférez la ligne maîtresse 24/18 13/11."
        ]
    },
    {
        "id": "btcore5k_3ply_36_63",
        "tier": 3,
        "xgid": "XGID=-b--B-D-B---dE--Abbe----A-:0:0:1:63:2:2:0:5:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 16/10",
        "optimalMove": "16/10 13/10",
        "acceptableMoves": [],
        "quizChoices": [
            "16/10 13/10",
            "24/21 16/10",
            "24/15",
            "13/4"
        ],
        "equityLoss": 0.102,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/21 16/10 (Match en 5 pts (2-2, Videau à 1)), vous concédez -0.102 EMG face à la ligne 3-ply 16/10 13/10.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-3 en Match en 5 pts (2-2, Videau à 1) : 16/10 13/10 surpasse 24/21 16/10 de +0.102 EMG (59.5 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 16/10 pour optimiser votre structure en Match en 5 pts (2-2, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 16/10 13/10 domine 24/21 16/10 de +0.102 EMG.",
            "En Match en 5 pts (2-2, Videau à 1), 16/10 13/10 maximise votre équité cubeful (+0.408 EMG).",
            "Évitez le piège 24/21 16/10 (-0.102 EMG) ; préférez la ligne maîtresse 16/10 13/10."
        ]
    },
    {
        "id": "btcore5k_3ply_37_51",
        "tier": 2,
        "xgid": "XGID=-b--B-D-B-B-cD---bbf----A-:0:0:1:51:2:2:0:5:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "24/23 13/8",
        "optimalMove": "10/5 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "10/5 6/5",
            "24/23 13/8",
            "13/8 6/5",
            "13/8 10/9"
        ],
        "equityLoss": 0.322,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/23 13/8 (Match en 5 pts (2-2, Videau à 1)), vous concédez -0.322 EMG face à la ligne 3-ply 10/5 6/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-1 en Match en 5 pts (2-2, Videau à 1) : 10/5 6/5 surpasse 24/23 13/8 de +0.322 EMG (68.0 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 10/5 pour optimiser votre structure en Match en 5 pts (2-2, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 10/5 6/5 domine 24/23 13/8 de +0.322 EMG.",
            "En Match en 5 pts (2-2, Videau à 1), 10/5 6/5 maximise votre équité cubeful (+0.793 EMG).",
            "Évitez le piège 24/23 13/8 (-0.322 EMG) ; préférez la ligne maîtresse 10/5 6/5."
        ]
    },
    {
        "id": "btcore5k_3ply_38_54",
        "tier": 4,
        "xgid": "XGID=-b--BBC-B-A-bD---bbg----A-:0:0:1:54:2:2:0:5:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/8 10/6",
        "optimalMove": "24/15",
        "acceptableMoves": [],
        "quizChoices": [
            "24/15",
            "13/8 10/6",
            "13/9 13/8",
            "13/9 10/5"
        ],
        "equityLoss": 0.033,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/8 10/6 (Match en 5 pts (2-2, Videau à 1)), vous concédez -0.033 EMG face à la ligne 3-ply 24/15.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-4 en Match en 5 pts (2-2, Videau à 1) : 24/15 surpasse 13/8 10/6 de +0.033 EMG (77.0 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 24/15 pour optimiser votre structure en Match en 5 pts (2-2, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/15 domine 13/8 10/6 de +0.033 EMG.",
            "En Match en 5 pts (2-2, Videau à 1), 24/15 maximise votre équité cubeful (+0.960 EMG).",
            "Évitez le piège 13/8 10/6 (-0.033 EMG) ; préférez la ligne maîtresse 24/15."
        ]
    },
    {
        "id": "btcore5k_3ply_39_51",
        "tier": 4,
        "xgid": "XGID=-b--BBD-C----Ca--cbg----A-:0:0:1:51:2:2:0:5:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "8/3 6/5",
        "optimalMove": "13/8 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "13/8 6/5",
            "8/3 6/5",
            "13/7",
            "24/23 13/8"
        ],
        "equityLoss": 0.045,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 8/3 6/5 (Match en 5 pts (2-2, Videau à 1)), vous concédez -0.045 EMG face à la ligne 3-ply 13/8 6/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-1 en Match en 5 pts (2-2, Videau à 1) : 13/8 6/5 surpasse 8/3 6/5 de +0.045 EMG (71.3 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/8 pour optimiser votre structure en Match en 5 pts (2-2, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/8 6/5 domine 8/3 6/5 de +0.045 EMG.",
            "En Match en 5 pts (2-2, Videau à 1), 13/8 6/5 maximise votre équité cubeful (+0.908 EMG).",
            "Évitez le piège 8/3 6/5 (-0.045 EMG) ; préférez la ligne maîtresse 13/8 6/5."
        ]
    },
    {
        "id": "btcore5k_3ply_40_51",
        "tier": 3,
        "xgid": "XGID=-bB-CBB-C----B-A-abd-aabb-:0:0:1:51:2:2:0:5:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "15/9",
        "optimalMove": "8/3 4/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 4/3",
            "15/9",
            "15/10 13/12",
            "15/14 13/8"
        ],
        "equityLoss": 0.076,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 15/9 (Match en 5 pts (2-2, Videau à 1)), vous concédez -0.076 EMG face à la ligne 3-ply 8/3 4/3.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-1 en Match en 5 pts (2-2, Videau à 1) : 8/3 4/3 surpasse 15/9 de +0.076 EMG (86.2 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/3 pour optimiser votre structure en Match en 5 pts (2-2, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/3 4/3 domine 15/9 de +0.076 EMG.",
            "En Match en 5 pts (2-2, Videau à 1), 8/3 4/3 maximise votre équité cubeful (+1.071 EMG).",
            "Évitez le piège 15/9 (-0.076 EMG) ; préférez la ligne maîtresse 8/3 4/3."
        ]
    },
    {
        "id": "btcore5k_3ply_41_44",
        "tier": 3,
        "xgid": "XGID=-bBBBBB-B----B-A-aac-bbbb-:0:0:1:44:2:2:0:5:8",
        "dice": [
            4,
            4
        ],
        "playedMove": "15/3 8/4",
        "optimalMove": "13/5(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/5(2)",
            "15/3 8/4",
            "13/9(2) 8/4(2)",
            "13/5 8/4(2)"
        ],
        "equityLoss": 0.067,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 15/3 8/4 (Match en 5 pts (2-2, Videau à 1)), vous concédez -0.067 EMG face à la ligne 3-ply 13/5(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-4 en Match en 5 pts (2-2, Videau à 1) : 13/5(2) surpasse 15/3 8/4 de +0.067 EMG (87.9 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/5(2) pour optimiser votre structure en Match en 5 pts (2-2, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/5(2) domine 15/3 8/4 de +0.067 EMG.",
            "En Match en 5 pts (2-2, Videau à 1), 13/5(2) maximise votre équité cubeful (+1.065 EMG).",
            "Évitez le piège 15/3 8/4 (-0.067 EMG) ; préférez la ligne maîtresse 13/5(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_42_63",
        "tier": 3,
        "xgid": "XGID=-bBBBDB-B------A--bb-bbbc-:0:0:1:63:2:2:0:5:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "15/9 5/2",
        "optimalMove": "15/6",
        "acceptableMoves": [
            "8/5 8/2"
        ],
        "quizChoices": [
            "15/6",
            "15/9 5/2",
            "8/5 8/2",
            "8/2 5/2"
        ],
        "equityLoss": 0.08,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 15/9 5/2 (Match en 5 pts (2-2, Videau à 1)), vous concédez -0.080 EMG face à la ligne 3-ply 15/6.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-3 en Match en 5 pts (2-2, Videau à 1) : 15/6 surpasse 15/9 5/2 de +0.080 EMG (90.3 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 15/6 pour optimiser votre structure en Match en 5 pts (2-2, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 15/6 domine 15/9 5/2 de +0.080 EMG.",
            "En Match en 5 pts (2-2, Videau à 1), 15/6 maximise votre équité cubeful (+1.089 EMG).",
            "Évitez le piège 15/9 5/2 (-0.080 EMG) ; préférez la ligne maîtresse 15/6."
        ]
    },
    {
        "id": "btcore5k_3ply_43_42",
        "tier": 4,
        "xgid": "XGID=-bBBBDC-B-----------bdbbc-:0:0:1:42:2:2:0:5:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "8/4 5/3",
        "optimalMove": "8/6 8/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/6 8/4",
            "8/4 5/3",
            "6/2 5/3",
            "8/2"
        ],
        "equityLoss": 0.048,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 8/4 5/3 (Match en 5 pts (2-2, Videau à 1)), vous concédez -0.048 EMG face à la ligne 3-ply 8/6 8/4.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-2 en Match en 5 pts (2-2, Videau à 1) : 8/6 8/4 surpasse 8/4 5/3 de +0.048 EMG (92.9 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/6 pour optimiser votre structure en Match en 5 pts (2-2, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/6 8/4 domine 8/4 5/3 de +0.048 EMG.",
            "En Match en 5 pts (2-2, Videau à 1), 8/6 8/4 maximise votre équité cubeful (+1.120 EMG).",
            "Évitez le piège 8/4 5/3 (-0.048 EMG) ; préférez la ligne maîtresse 8/6 8/4."
        ]
    },
    {
        "id": "btcore5k_3ply_44_41",
        "tier": 3,
        "xgid": "XGID=-bCEBBB--------------bcdd-:0:0:1:41:2:2:0:5:8",
        "dice": [
            4,
            1
        ],
        "playedMove": "5/off",
        "optimalMove": "6/5 6/2",
        "acceptableMoves": [],
        "quizChoices": [
            "6/5 6/2",
            "5/off",
            "4/3 4/off",
            "4/off 3/2"
        ],
        "equityLoss": 0.115,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 5/off (Match en 5 pts (2-2, Videau à 1)), vous concédez -0.115 EMG face à la ligne 3-ply 6/5 6/2.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-1 en Match en 5 pts (2-2, Videau à 1) : 6/5 6/2 surpasse 5/off de +0.115 EMG (95.0 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 6/5 pour optimiser votre structure en Match en 5 pts (2-2, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 6/5 6/2 domine 5/off de +0.115 EMG.",
            "En Match en 5 pts (2-2, Videau à 1), 6/5 6/2 maximise votre équité cubeful (+1.116 EMG).",
            "Évitez le piège 5/off (-0.115 EMG) ; préférez la ligne maîtresse 6/5 6/2."
        ]
    },
    {
        "id": "btcore5k_3ply_45_13",
        "tier": 2,
        "xgid": "XGID=-a----E-Ca-AeD---b-d-b-AA-:0:0:1:13:2:2:0:5:8",
        "dice": [
            1,
            3
        ],
        "playedMove": "13/10 11/10",
        "optimalMove": "13/9*",
        "acceptableMoves": [],
        "quizChoices": [
            "13/9*",
            "13/10 11/10",
            "8/5 6/5",
            "24/23 11/8"
        ],
        "equityLoss": 0.153,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/10 11/10 (Match en 5 pts (2-2, Videau à 1)), vous concédez -0.153 EMG face à la ligne 3-ply 13/9*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-3 en Match en 5 pts (2-2, Videau à 1) : 13/9* surpasse 13/10 11/10 de +0.153 EMG (45.6 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/9* pour optimiser votre structure en Match en 5 pts (2-2, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/9* domine 13/10 11/10 de +0.153 EMG.",
            "En Match en 5 pts (2-2, Videau à 1), 13/9* maximise votre équité cubeful (-0.215 EMG).",
            "Évitez le piège 13/10 11/10 (-0.153 EMG) ; préférez la ligne maîtresse 13/9*."
        ]
    },
    {
        "id": "btcore5k_3ply_46_43",
        "tier": 4,
        "xgid": "XGID=-a----E-D---dD-b-b-d-b-B--:0:0:1:43:2:2:0:5:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/9 8/5",
        "optimalMove": "13/10 13/9",
        "acceptableMoves": [],
        "quizChoices": [
            "13/10 13/9",
            "13/9 8/5",
            "13/10 8/4",
            "13/6"
        ],
        "equityLoss": 0.058,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/9 8/5 (Match en 5 pts (2-2, Videau à 1)), vous concédez -0.058 EMG face à la ligne 3-ply 13/10 13/9.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-3 en Match en 5 pts (2-2, Videau à 1) : 13/10 13/9 surpasse 13/9 8/5 de +0.058 EMG (33.7 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/10 pour optimiser votre structure en Match en 5 pts (2-2, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/10 13/9 domine 13/9 8/5 de +0.058 EMG.",
            "En Match en 5 pts (2-2, Videau à 1), 13/10 13/9 maximise votre équité cubeful (-0.704 EMG).",
            "Évitez le piège 13/9 8/5 (-0.058 EMG) ; préférez la ligne maîtresse 13/10 13/9."
        ]
    },
    {
        "id": "btcore5k_3ply_47_25",
        "tier": 3,
        "xgid": "XGID=-a----G-D---cB---c-dbb-B--:0:0:1:25:2:2:0:5:8",
        "dice": [
            2,
            5
        ],
        "playedMove": "13/11 6/1*",
        "optimalMove": "13/11 13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11 13/8",
            "13/11 6/1*",
            "8/1*",
            "6/4 6/1*"
        ],
        "equityLoss": 0.062,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/11 6/1* (Match en 5 pts (2-2, Videau à 1)), vous concédez -0.062 EMG face à la ligne 3-ply 13/11 13/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-5 en Match en 5 pts (2-2, Videau à 1) : 13/11 13/8 surpasse 13/11 6/1* de +0.062 EMG (20.9 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/11 pour optimiser votre structure en Match en 5 pts (2-2, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/11 13/8 domine 13/11 6/1* de +0.062 EMG.",
            "En Match en 5 pts (2-2, Videau à 1), 13/11 13/8 maximise votre équité cubeful (-1.000 EMG).",
            "Évitez le piège 13/11 6/1* (-0.062 EMG) ; préférez la ligne maîtresse 13/11 13/8."
        ]
    },
    {
        "id": "btcore5k_3ply_48_56",
        "tier": 2,
        "xgid": "XGID=------GaE--Ac----c-dbb-B--:0:0:1:56:2:2:0:5:8",
        "dice": [
            5,
            6
        ],
        "playedMove": "23/18 11/5",
        "optimalMove": "11/5 8/3",
        "acceptableMoves": [
            "11/5 6/1",
            "11/6 8/2"
        ],
        "quizChoices": [
            "11/5 8/3",
            "23/18 11/5",
            "11/5 6/1",
            "11/6 8/2"
        ],
        "equityLoss": 0.207,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 23/18 11/5 (Match en 5 pts (2-2, Videau à 1)), vous concédez -0.207 EMG face à la ligne 3-ply 11/5 8/3.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-6 en Match en 5 pts (2-2, Videau à 1) : 11/5 8/3 surpasse 23/18 11/5 de +0.207 EMG (19.0 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 11/5 pour optimiser votre structure en Match en 5 pts (2-2, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 11/5 8/3 domine 23/18 11/5 de +0.207 EMG.",
            "En Match en 5 pts (2-2, Videau à 1), 11/5 8/3 maximise votre équité cubeful (-1.000 EMG).",
            "Évitez le piège 23/18 11/5 (-0.207 EMG) ; préférez la ligne maîtresse 11/5 8/3."
        ]
    },
    {
        "id": "btcore5k_3ply_49_43",
        "tier": 3,
        "xgid": "XGID=-BBDCB------------AcbdcAc-:0:0:1:43:2:2:0:5:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "5/1 4/1",
        "optimalMove": "18/11",
        "acceptableMoves": [
            "18/14 4/1",
            "18/14 5/2",
            "18/15 5/1"
        ],
        "quizChoices": [
            "18/11",
            "5/1 4/1",
            "18/14 4/1",
            "18/14 5/2"
        ],
        "equityLoss": 0.065,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 5/1 4/1 (Match en 5 pts (2-2, Videau à 1)), vous concédez -0.065 EMG face à la ligne 3-ply 18/11.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-3 en Match en 5 pts (2-2, Videau à 1) : 18/11 surpasse 5/1 4/1 de +0.065 EMG (8.3 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 18/11 pour optimiser votre structure en Match en 5 pts (2-2, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 18/11 domine 5/1 4/1 de +0.065 EMG.",
            "En Match en 5 pts (2-2, Videau à 1), 18/11 maximise votre équité cubeful (-1.000 EMG).",
            "Évitez le piège 5/1 4/1 (-0.065 EMG) ; préférez la ligne maîtresse 18/11."
        ]
    },
    {
        "id": "btcore5k_3ply_50_11",
        "tier": 3,
        "xgid": "XGID=-b----E-C--AdD---d-e---AA-:0:0:1:11:3:3:0:7:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "23/22 11/10 6/5(2)",
        "optimalMove": "8/7(2) 6/5(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "8/7(2) 6/5(2)",
            "23/22 11/10 6/5(2)",
            "23/21 6/5(2)",
            "11/9 6/5(2)"
        ],
        "equityLoss": 0.076,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 23/22 11/10 6/5(2) (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.076 EMG face à la ligne 3-ply 8/7(2) 6/5(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-1 en Match en 7 pts (3-3, Videau à 1) : 8/7(2) 6/5(2) surpasse 23/22 11/10 6/5(2) de +0.076 EMG (59.1 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/7(2) pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/7(2) 6/5(2) domine 23/22 11/10 6/5(2) de +0.076 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 8/7(2) 6/5(2) maximise votre équité cubeful (+0.445 EMG).",
            "Évitez le piège 23/22 11/10 6/5(2) (-0.076 EMG) ; préférez la ligne maîtresse 8/7(2) 6/5(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_51_34",
        "tier": 4,
        "xgid": "XGID=-a---CB-C-aAdD---d-e---B--:0:0:1:34:3:3:0:7:8",
        "dice": [
            3,
            4
        ],
        "playedMove": "13/10*/6",
        "optimalMove": "13/10* 13/9",
        "acceptableMoves": [],
        "quizChoices": [
            "13/10* 13/9",
            "13/10*/6",
            "13/10* 11/7",
            "13/10* 8/4"
        ],
        "equityLoss": 0.037,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/10*/6 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.037 EMG face à la ligne 3-ply 13/10* 13/9.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-4 en Match en 7 pts (3-3, Videau à 1) : 13/10* 13/9 surpasse 13/10*/6 de +0.037 EMG (61.2 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/10* pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/10* 13/9 domine 13/10*/6 de +0.037 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 13/10* 13/9 maximise votre équité cubeful (+0.644 EMG).",
            "Évitez le piège 13/10*/6 (-0.037 EMG) ; préférez la ligne maîtresse 13/10* 13/9."
        ]
    },
    {
        "id": "btcore5k_3ply_52_13",
        "tier": 3,
        "xgid": "XGID=-a---CCaC--AdC---d-e---B--:0:0:1:13:3:3:0:7:8",
        "dice": [
            1,
            3
        ],
        "playedMove": "8/7*/4",
        "optimalMove": "13/10 8/7*",
        "acceptableMoves": [
            "23/20 8/7*"
        ],
        "quizChoices": [
            "13/10 8/7*",
            "8/7*/4",
            "23/20 8/7*",
            "11/7*"
        ],
        "equityLoss": 0.118,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 8/7*/4 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.118 EMG face à la ligne 3-ply 13/10 8/7*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-3 en Match en 7 pts (3-3, Videau à 1) : 13/10 8/7* surpasse 8/7*/4 de +0.118 EMG (60.9 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/10 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/10 8/7* domine 8/7*/4 de +0.118 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 13/10 8/7* maximise votre équité cubeful (+0.621 EMG).",
            "Évitez le piège 8/7*/4 (-0.118 EMG) ; préférez la ligne maîtresse 13/10 8/7*."
        ]
    },
    {
        "id": "btcore5k_3ply_53_55",
        "tier": 3,
        "xgid": "XGID=-a---CC-C-B-eB---c-f---B--:0:0:1:55:3:3:0:7:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "23/18(2) 8/3(2)",
        "optimalMove": "23/13(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "23/13(2)",
            "23/18(2) 8/3(2)",
            "23/13 8/3(2)",
            "13/3(2)"
        ],
        "equityLoss": 0.066,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 23/18(2) 8/3(2) (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.066 EMG face à la ligne 3-ply 23/13(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-5 en Match en 7 pts (3-3, Videau à 1) : 23/13(2) surpasse 23/18(2) 8/3(2) de +0.066 EMG (76.3 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 23/13(2) pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 23/13(2) domine 23/18(2) 8/3(2) de +0.066 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 23/13(2) maximise votre équité cubeful (+0.979 EMG).",
            "Évitez le piège 23/18(2) 8/3(2) (-0.066 EMG) ; préférez la ligne maîtresse 23/13(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_54_45",
        "tier": 3,
        "xgid": "XGID=--aB-CC-A-B-eB---cBe----a-:0:0:1:45:3:3:0:7:8",
        "dice": [
            4,
            5
        ],
        "playedMove": "13/8 10/6",
        "optimalMove": "13/8 6/2*",
        "acceptableMoves": [],
        "quizChoices": [
            "13/8 6/2*",
            "13/8 10/6",
            "13/9 13/8",
            "8/3 6/2*"
        ],
        "equityLoss": 0.067,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 13/8 10/6 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.067 EMG face à la ligne 3-ply 13/8 6/2*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-5 en Match en 7 pts (3-3, Videau à 1) : 13/8 6/2* surpasse 13/8 10/6 de +0.067 EMG (73.2 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 13/8 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/8 6/2* domine 13/8 10/6 de +0.067 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 13/8 6/2* maximise votre équité cubeful (+1.079 EMG).",
            "Évitez le piège 13/8 10/6 (-0.067 EMG) ; préférez la ligne maîtresse 13/8 6/2*."
        ]
    },
    {
        "id": "btcore5k_3ply_55_55",
        "tier": 3,
        "xgid": "XGID=-AaC-BC---B-eB---bBd--b-a-:0:0:1:55:3:3:0:7:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "13/8(2) 10/5 6/1",
        "optimalMove": "18/8(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "18/8(2)",
            "13/8(2) 10/5 6/1",
            "18/13(2) 10/5 6/1",
            "18/13(2) 10/5(2)"
        ],
        "equityLoss": 0.065,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/8(2) 10/5 6/1 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.065 EMG face à la ligne 3-ply 18/8(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-5 en Match en 7 pts (3-3, Videau à 1) : 18/8(2) surpasse 13/8(2) 10/5 6/1 de +0.065 EMG (81.2 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 18/8(2) pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 18/8(2) domine 13/8(2) 10/5 6/1 de +0.065 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 18/8(2) maximise votre équité cubeful (+1.166 EMG).",
            "Évitez le piège 13/8(2) 10/5 6/1 (-0.065 EMG) ; préférez la ligne maîtresse 18/8(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_56_33",
        "tier": 4,
        "xgid": "XGID=-AaC-BC-B-B-dB-a-b-c--b-b-:0:0:1:33:3:3:0:7:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "8/2*(2)",
        "optimalMove": "10/4(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "10/4(2)",
            "8/2*(2)",
            "13/7(2)",
            "13/1"
        ],
        "equityLoss": 0.059,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 8/2*(2) (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.059 EMG face à la ligne 3-ply 10/4(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-3 en Match en 7 pts (3-3, Videau à 1) : 10/4(2) surpasse 8/2*(2) de +0.059 EMG (85.5 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 10/4(2) pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 10/4(2) domine 8/2*(2) de +0.059 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 10/4(2) maximise votre équité cubeful (+1.273 EMG).",
            "Évitez le piège 8/2*(2) (-0.059 EMG) ; préférez la ligne maîtresse 10/4(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_57_55",
        "tier": 2,
        "xgid": "XGID=-A-CBBC-B---cB-a-d-c--b-b-:0:0:1:55:3:3:0:7:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "13/3 8/3 6/1",
        "optimalMove": "13/3(2)",
        "acceptableMoves": [
            "13/3 13/8 6/1",
            "13/8(2) 6/1(2)",
            "8/3(2) 6/1(2)",
            "8/3 6/1(3)"
        ],
        "quizChoices": [
            "13/3(2)",
            "13/3 8/3 6/1",
            "13/3 13/8 6/1",
            "13/8(2) 6/1(2)"
        ],
        "equityLoss": 0.227,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/3 8/3 6/1 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.227 EMG face à la ligne 3-ply 13/3(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-5 en Match en 7 pts (3-3, Videau à 1) : 13/3(2) surpasse 13/3 8/3 6/1 de +0.227 EMG (98.0 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/3(2) pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/3(2) domine 13/3 8/3 6/1 de +0.227 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 13/3(2) maximise votre équité cubeful (+1.000 EMG).",
            "Évitez le piège 13/3 8/3 6/1 (-0.227 EMG) ; préférez la ligne maîtresse 13/3(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_58_11",
        "tier": 4,
        "xgid": "XGID=-HABAB--A--------aacdabab-:0:0:1:11:3:3:0:7:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "8/6 4/3 1/off",
        "optimalMove": "8/6 1/off(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "8/6 1/off(2)",
            "8/6 4/3 1/off",
            "8/6 5/4 1/off",
            "8/6 3/2 1/off"
        ],
        "equityLoss": 0.033,
        "verdict": "doubtful",
        "conceptId": "bearoff_technique",
        "conceptName": "Technique de Sortie (Bear-off)",
        "whyFailed": "En jouant 8/6 4/3 1/off (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.033 EMG face à la ligne 3-ply 8/6 1/off(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-1 en Match en 7 pts (3-3, Videau à 1) : 8/6 1/off(2) surpasse 8/6 4/3 1/off de +0.033 EMG (94.9 % de gain).",
        "proverb": "En sortie de dames, minimisez le gaspillage de pips et évitez les trous sur les flèches hautes.",
        "hint": "Analysez le coup commençant par 8/6 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/6 1/off(2) domine 8/6 4/3 1/off de +0.033 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 8/6 1/off(2) maximise votre équité cubeful (+0.998 EMG).",
            "Évitez le piège 8/6 4/3 1/off (-0.033 EMG) ; préférez la ligne maîtresse 8/6 1/off(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_59_36",
        "tier": 2,
        "xgid": "XGID=-b----E-CA--dD---d-cb--AA-:0:0:1:36:3:3:0:7:8",
        "dice": [
            3,
            6
        ],
        "playedMove": "24/15",
        "optimalMove": "9/3 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "9/3 6/3",
            "24/15",
            "24/18 9/6",
            "24/18 13/10"
        ],
        "equityLoss": 0.216,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/15 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.216 EMG face à la ligne 3-ply 9/3 6/3.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-6 en Match en 7 pts (3-3, Videau à 1) : 9/3 6/3 surpasse 24/15 de +0.216 EMG (44.7 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 9/3 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 9/3 6/3 domine 24/15 de +0.216 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 9/3 6/3 maximise votre équité cubeful (-0.245 EMG).",
            "Évitez le piège 24/15 (-0.216 EMG) ; préférez la ligne maîtresse 9/3 6/3."
        ]
    },
    {
        "id": "btcore5k_3ply_60_52",
        "tier": 3,
        "xgid": "XGID=-b-B--D-C---cD---d-db--AA-:0:0:1:52:3:3:0:7:8",
        "dice": [
            5,
            2
        ],
        "playedMove": "23/21 13/8",
        "optimalMove": "23/16",
        "acceptableMoves": [],
        "quizChoices": [
            "23/16",
            "23/21 13/8",
            "23/18 13/11",
            "13/11 13/8"
        ],
        "equityLoss": 0.07,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 23/21 13/8 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.070 EMG face à la ligne 3-ply 23/16.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-2 en Match en 7 pts (3-3, Videau à 1) : 23/16 surpasse 23/21 13/8 de +0.070 EMG (45.9 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 23/16 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 23/16 domine 23/21 13/8 de +0.070 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 23/16 maximise votre équité cubeful (-0.239 EMG).",
            "Évitez le piège 23/21 13/8 (-0.070 EMG) ; préférez la ligne maîtresse 23/16."
        ]
    },
    {
        "id": "btcore5k_3ply_61_55",
        "tier": 4,
        "xgid": "XGID=-b-B--D-C----D----Ab-bdcbA:0:0:1:55:3:3:0:7:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "bar/20 18/8 13/8",
        "optimalMove": "bar/15 13/8(2)",
        "acceptableMoves": [
            "bar/15 18/8",
            "bar/15 13/3"
        ],
        "quizChoices": [
            "bar/15 13/8(2)",
            "bar/20 18/8 13/8",
            "bar/15 18/8",
            "bar/15 13/3"
        ],
        "equityLoss": 0.048,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant bar/20 18/8 13/8 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.048 EMG face à la ligne 3-ply bar/15 13/8(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-5 en Match en 7 pts (3-3, Videau à 1) : bar/15 13/8(2) surpasse bar/20 18/8 13/8 de +0.048 EMG (50.3 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par bar/15 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : bar/15 13/8(2) domine bar/20 18/8 13/8 de +0.048 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), bar/15 13/8(2) maximise votre équité cubeful (-0.079 EMG).",
            "Évitez le piège bar/20 18/8 13/8 (-0.048 EMG) ; préférez la ligne maîtresse bar/15 13/8(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_62_33",
        "tier": 4,
        "xgid": "XGID=-b-B--D-E----B-A--A--bdcd-:0:0:1:33:3:3:0:7:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "13/10(2) 8/5(2)",
        "optimalMove": "18/15 8/5(3)",
        "acceptableMoves": [
            "8/5(3) 6/3"
        ],
        "quizChoices": [
            "18/15 8/5(3)",
            "13/10(2) 8/5(2)",
            "8/5(3) 6/3",
            "15/12 8/5(3)"
        ],
        "equityLoss": 0.033,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/10(2) 8/5(2) (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.033 EMG face à la ligne 3-ply 18/15 8/5(3).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-3 en Match en 7 pts (3-3, Videau à 1) : 18/15 8/5(3) surpasse 13/10(2) 8/5(2) de +0.033 EMG (77.2 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 18/15 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 18/15 8/5(3) domine 13/10(2) 8/5(2) de +0.033 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 18/15 8/5(3) maximise votre équité cubeful (+0.985 EMG).",
            "Évitez le piège 13/10(2) 8/5(2) (-0.033 EMG) ; préférez la ligne maîtresse 18/15 8/5(3)."
        ]
    },
    {
        "id": "btcore5k_3ply_63_12",
        "tier": 4,
        "xgid": "XGID=-a-B-CD-B---aB-B-----bdcd-:0:0:1:12:3:3:0:7:8",
        "dice": [
            1,
            2
        ],
        "playedMove": "13/12* 5/3",
        "optimalMove": "15/12*",
        "acceptableMoves": [],
        "quizChoices": [
            "15/12*",
            "13/12* 5/3",
            "13/12* 13/11",
            "13/12*/10"
        ],
        "equityLoss": 0.032,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 13/12* 5/3 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.032 EMG face à la ligne 3-ply 15/12*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-2 en Match en 7 pts (3-3, Videau à 1) : 15/12* surpasse 13/12* 5/3 de +0.032 EMG (79.2 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 15/12* pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 15/12* domine 13/12* 5/3 de +0.032 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 15/12* maximise votre équité cubeful (+1.017 EMG).",
            "Évitez le piège 13/12* 5/3 (-0.032 EMG) ; préférez la ligne maîtresse 15/12*."
        ]
    },
    {
        "id": "btcore5k_3ply_64_21",
        "tier": 4,
        "xgid": "XGID=-a-BBBC-B----B-B---a-bdcd-:0:0:1:21:3:3:0:7:8",
        "dice": [
            2,
            1
        ],
        "playedMove": "15/14 6/4",
        "optimalMove": "15/12",
        "acceptableMoves": [],
        "quizChoices": [
            "15/12",
            "15/14 6/4",
            "15/14 13/11",
            "13/12 6/4"
        ],
        "equityLoss": 0.05,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 15/14 6/4 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.050 EMG face à la ligne 3-ply 15/12.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-1 en Match en 7 pts (3-3, Videau à 1) : 15/12 surpasse 15/14 6/4 de +0.050 EMG (75.9 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 15/12 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 15/12 domine 15/14 6/4 de +0.050 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 15/12 maximise votre équité cubeful (+0.908 EMG).",
            "Évitez le piège 15/14 6/4 (-0.050 EMG) ; préférez la ligne maîtresse 15/12."
        ]
    },
    {
        "id": "btcore5k_3ply_65_33",
        "tier": 4,
        "xgid": "XGID=---BBBC-B-a--CA----a-bdcd-:0:0:1:33:3:3:0:7:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "14/5 13/10*",
        "optimalMove": "13/10*/7(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/10*/7(2)",
            "14/5 13/10*",
            "13/10*/4 13/10",
            "14/11 13/10*/4"
        ],
        "equityLoss": 0.036,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 14/5 13/10* (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.036 EMG face à la ligne 3-ply 13/10*/7(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-3 en Match en 7 pts (3-3, Videau à 1) : 13/10*/7(2) surpasse 14/5 13/10* de +0.036 EMG (94.5 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 13/10*/7(2) pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/10*/7(2) domine 14/5 13/10* de +0.036 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 13/10*/7(2) maximise votre équité cubeful (+1.036 EMG).",
            "Évitez le piège 14/5 13/10* (-0.036 EMG) ; préférez la ligne maîtresse 13/10*/7(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_66_63",
        "tier": 2,
        "xgid": "XGID=-aBBBBBBA-B----------bcde-:0:0:1:63:3:3:0:7:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "7/4 7/1*",
        "optimalMove": "10/1*",
        "acceptableMoves": [],
        "quizChoices": [
            "10/1*",
            "7/4 7/1*",
            "10/7 10/4",
            "10/4 8/5"
        ],
        "equityLoss": 0.193,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 7/4 7/1* (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.193 EMG face à la ligne 3-ply 10/1*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-3 en Match en 7 pts (3-3, Videau à 1) : 10/1* surpasse 7/4 7/1* de +0.193 EMG (94.2 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 10/1* pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 10/1* domine 7/4 7/1* de +0.193 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 10/1* maximise votre équité cubeful (+1.030 EMG).",
            "Évitez le piège 7/4 7/1* (-0.193 EMG) ; préférez la ligne maîtresse 10/1*."
        ]
    },
    {
        "id": "btcore5k_3ply_67_54",
        "tier": 2,
        "xgid": "XGID=-aBBCCBB--A----------bbdf-:0:0:1:54:3:3:0:7:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "7/2 5/1*",
        "optimalMove": "10/1*",
        "acceptableMoves": [],
        "quizChoices": [
            "10/1*",
            "7/2 5/1*",
            "7/3 7/2",
            "10/6 7/2"
        ],
        "equityLoss": 0.192,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 7/2 5/1* (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.192 EMG face à la ligne 3-ply 10/1*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-4 en Match en 7 pts (3-3, Videau à 1) : 10/1* surpasse 7/2 5/1* de +0.192 EMG (95.2 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 10/1* pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 10/1* domine 7/2 5/1* de +0.192 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 10/1* maximise votre équité cubeful (+1.037 EMG).",
            "Évitez le piège 7/2 5/1* (-0.192 EMG) ; préférez la ligne maîtresse 10/1*."
        ]
    },
    {
        "id": "btcore5k_3ply_68_14",
        "tier": 3,
        "xgid": "XGID=aABBCCBB-------------bbdf-:0:0:1:14:3:3:0:7:8",
        "dice": [
            1,
            4
        ],
        "playedMove": "7/6 7/3",
        "optimalMove": "7/6 5/1",
        "acceptableMoves": [],
        "quizChoices": [
            "7/6 5/1",
            "7/6 7/3",
            "5/1 4/3",
            "7/2"
        ],
        "equityLoss": 0.091,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 7/6 7/3 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.091 EMG face à la ligne 3-ply 7/6 5/1.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-4 en Match en 7 pts (3-3, Videau à 1) : 7/6 5/1 surpasse 7/6 7/3 de +0.091 EMG (96.4 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 7/6 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 7/6 5/1 domine 7/6 7/3 de +0.091 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 7/6 5/1 maximise votre équité cubeful (+1.015 EMG).",
            "Évitez le piège 7/6 7/3 (-0.091 EMG) ; préférez la ligne maîtresse 7/6 5/1."
        ]
    },
    {
        "id": "btcore5k_3ply_69_54",
        "tier": 4,
        "xgid": "XGID=-b----E-CA--cD--ad-e---AA-:0:0:1:54:4:4:0:9:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/9 13/8",
        "optimalMove": "9/4 8/4",
        "acceptableMoves": [],
        "quizChoices": [
            "9/4 8/4",
            "13/9 13/8",
            "23/18 13/9",
            "23/14"
        ],
        "equityLoss": 0.045,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/9 13/8 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.045 EMG face à la ligne 3-ply 9/4 8/4.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-4 en Match en 9 pts (4-4, Videau à 1) : 9/4 8/4 surpasse 13/9 13/8 de +0.045 EMG (51.3 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 9/4 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 9/4 8/4 domine 13/9 13/8 de +0.045 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 9/4 8/4 maximise votre équité cubeful (+0.047 EMG).",
            "Évitez le piège 13/9 13/8 (-0.045 EMG) ; préférez la ligne maîtresse 9/4 8/4."
        ]
    },
    {
        "id": "btcore5k_3ply_70_21",
        "tier": 2,
        "xgid": "XGID=-b--C-D-BA--bC---c-cbA--cA:0:0:1:21:4:4:0:9:8",
        "dice": [
            2,
            1
        ],
        "playedMove": "bar/22",
        "optimalMove": "bar/23 9/8",
        "acceptableMoves": [],
        "quizChoices": [
            "bar/23 9/8",
            "bar/22",
            "bar/23 4/3",
            "bar/23 6/5"
        ],
        "equityLoss": 0.161,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant bar/22 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.161 EMG face à la ligne 3-ply bar/23 9/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-1 en Match en 9 pts (4-4, Videau à 1) : bar/23 9/8 surpasse bar/22 de +0.161 EMG (49.5 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par bar/23 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : bar/23 9/8 domine bar/22 de +0.161 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), bar/23 9/8 maximise votre équité cubeful (-0.067 EMG).",
            "Évitez le piège bar/22 (-0.161 EMG) ; préférez la ligne maîtresse bar/23 9/8."
        ]
    },
    {
        "id": "btcore5k_3ply_71_44",
        "tier": 2,
        "xgid": "XGID=-b--C-D-C---bC---b-bdA-Ac-:0:0:1:44:4:4:0:9:8",
        "dice": [
            4,
            4
        ],
        "playedMove": "13/9(2) 6/2(2)",
        "optimalMove": "13/5(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/5(2)",
            "13/9(2) 6/2(2)",
            "13/9(3) 8/4",
            "13/9 8/4 6/2(2)"
        ],
        "equityLoss": 0.338,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/9(2) 6/2(2) (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.338 EMG face à la ligne 3-ply 13/5(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-4 en Match en 9 pts (4-4, Videau à 1) : 13/5(2) surpasse 13/9(2) 6/2(2) de +0.338 EMG (59.1 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/5(2) pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/5(2) domine 13/9(2) 6/2(2) de +0.338 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 13/5(2) maximise votre équité cubeful (+0.345 EMG).",
            "Évitez le piège 13/9(2) 6/2(2) (-0.338 EMG) ; préférez la ligne maîtresse 13/5(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_72_23",
        "tier": 2,
        "xgid": "XGID=-a--D-D-BC--c----b-bdA-Ac-:0:0:1:23:4:4:0:9:8",
        "dice": [
            2,
            3
        ],
        "playedMove": "23/21 6/3",
        "optimalMove": "23/21 4/1*",
        "acceptableMoves": [],
        "quizChoices": [
            "23/21 4/1*",
            "23/21 6/3",
            "23/21 9/6",
            "6/1*"
        ],
        "equityLoss": 0.169,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 23/21 6/3 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.169 EMG face à la ligne 3-ply 23/21 4/1*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-3 en Match en 9 pts (4-4, Videau à 1) : 23/21 4/1* surpasse 23/21 6/3 de +0.169 EMG (47.0 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 23/21 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 23/21 4/1* domine 23/21 6/3 de +0.169 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 23/21 4/1* maximise votre équité cubeful (-0.054 EMG).",
            "Évitez le piège 23/21 6/3 (-0.169 EMG) ; préférez la ligne maîtresse 23/21 4/1*."
        ]
    },
    {
        "id": "btcore5k_3ply_73_64",
        "tier": 2,
        "xgid": "XGID=-a--D-E-BB--a----bbbdB--c-:0:0:1:64:4:4:0:9:8",
        "dice": [
            6,
            4
        ],
        "playedMove": "21/11",
        "optimalMove": "8/2 6/2",
        "acceptableMoves": [],
        "quizChoices": [
            "8/2 6/2",
            "21/11",
            "8/4 8/2",
            "9/5 9/3"
        ],
        "equityLoss": 0.215,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 21/11 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.215 EMG face à la ligne 3-ply 8/2 6/2.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-4 en Match en 9 pts (4-4, Videau à 1) : 8/2 6/2 surpasse 21/11 de +0.215 EMG (38.9 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 8/2 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/2 6/2 domine 21/11 de +0.215 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 8/2 6/2 maximise votre équité cubeful (-0.339 EMG).",
            "Évitez le piège 21/11 (-0.215 EMG) ; préférez la ligne maîtresse 8/2 6/2."
        ]
    },
    {
        "id": "btcore5k_3ply_74_65",
        "tier": 2,
        "xgid": "XGID=-aB-D-D-AB-------bcbcB-ac-:0:0:1:65:4:4:0:9:8",
        "dice": [
            6,
            5
        ],
        "playedMove": "9/3 8/3",
        "optimalMove": "21/16 21/15",
        "acceptableMoves": [],
        "quizChoices": [
            "21/16 21/15",
            "9/3 8/3",
            "8/2 6/1*",
            "21/15 6/1*"
        ],
        "equityLoss": 0.166,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 9/3 8/3 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.166 EMG face à la ligne 3-ply 21/16 21/15.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-5 en Match en 9 pts (4-4, Videau à 1) : 21/16 21/15 surpasse 9/3 8/3 de +0.166 EMG (49.1 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 21/16 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 21/16 21/15 domine 9/3 8/3 de +0.166 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 21/16 21/15 maximise votre équité cubeful (-0.066 EMG).",
            "Évitez le piège 9/3 8/3 (-0.166 EMG) ; préférez la ligne maîtresse 21/16 21/15."
        ]
    },
    {
        "id": "btcore5k_3ply_75_61",
        "tier": 4,
        "xgid": "XGID=-ADBD-B----------bcbcB-bc-:0:0:1:61:4:4:0:9:8",
        "dice": [
            6,
            1
        ],
        "playedMove": "21/14",
        "optimalMove": "21/15 2/1",
        "acceptableMoves": [],
        "quizChoices": [
            "21/15 2/1",
            "21/14",
            "21/15 4/3",
            "21/15 3/2"
        ],
        "equityLoss": 0.052,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 21/14 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.052 EMG face à la ligne 3-ply 21/15 2/1.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-1 en Match en 9 pts (4-4, Videau à 1) : 21/15 2/1 surpasse 21/14 de +0.052 EMG (22.9 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 21/15 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 21/15 2/1 domine 21/14 de +0.052 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 21/15 2/1 maximise votre équité cubeful (-0.913 EMG).",
            "Évitez le piège 21/14 (-0.052 EMG) ; préférez la ligne maîtresse 21/15 2/1."
        ]
    },
    {
        "id": "btcore5k_3ply_76_63",
        "tier": 3,
        "xgid": "XGID=-BCBD-B--------A-bbbbA-dc-:0:0:1:63:4:4:0:9:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "15/9 4/1",
        "optimalMove": "15/6",
        "acceptableMoves": [
            "21/12"
        ],
        "quizChoices": [
            "15/6",
            "15/9 4/1",
            "21/12",
            "21/15 6/3"
        ],
        "equityLoss": 0.078,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 15/9 4/1 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.078 EMG face à la ligne 3-ply 15/6.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-3 en Match en 9 pts (4-4, Videau à 1) : 15/6 surpasse 15/9 4/1 de +0.078 EMG (30.0 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 15/6 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 15/6 domine 15/9 4/1 de +0.078 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 15/6 maximise votre équité cubeful (-0.550 EMG).",
            "Évitez le piège 15/9 4/1 (-0.078 EMG) ; préférez la ligne maîtresse 15/6."
        ]
    },
    {
        "id": "btcore5k_3ply_77_54",
        "tier": 3,
        "xgid": "XGID=-BCBD-B-----A--A-aacba-dc-:0:0:1:54:4:4:0:9:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "12/3",
        "optimalMove": "15/10 12/8",
        "acceptableMoves": [],
        "quizChoices": [
            "15/10 12/8",
            "12/3",
            "15/11 12/7",
            "15/6"
        ],
        "equityLoss": 0.081,
        "verdict": "blunder",
        "conceptId": "bearoff_technique",
        "conceptName": "Technique de Sortie (Bear-off)",
        "whyFailed": "En jouant 12/3 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.081 EMG face à la ligne 3-ply 15/10 12/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-4 en Match en 9 pts (4-4, Videau à 1) : 15/10 12/8 surpasse 12/3 de +0.081 EMG (37.2 % de gain).",
        "proverb": "En sortie de dames, minimisez le gaspillage de pips et évitez les trous sur les flèches hautes.",
        "hint": "Analysez le coup commençant par 15/10 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 15/10 12/8 domine 12/3 de +0.081 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 15/10 12/8 maximise votre équité cubeful (-0.358 EMG).",
            "Évitez le piège 12/3 (-0.081 EMG) ; préférez la ligne maîtresse 15/10 12/8."
        ]
    },
    {
        "id": "btcore5k_3ply_78_32",
        "tier": 2,
        "xgid": "XGID=-CCBD-C------------ababec-:0:0:1:32:4:4:0:9:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "6/3 2/off",
        "optimalMove": "3/off 2/off",
        "acceptableMoves": [],
        "quizChoices": [
            "3/off 2/off",
            "6/3 2/off",
            "6/4 3/off",
            "4/1 2/off"
        ],
        "equityLoss": 0.136,
        "verdict": "blunder",
        "conceptId": "bearoff_technique",
        "conceptName": "Technique de Sortie (Bear-off)",
        "whyFailed": "En jouant 6/3 2/off (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.136 EMG face à la ligne 3-ply 3/off 2/off.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-2 en Match en 9 pts (4-4, Videau à 1) : 3/off 2/off surpasse 6/3 2/off de +0.136 EMG (27.3 % de gain).",
        "proverb": "En sortie de dames, minimisez le gaspillage de pips et évitez les trous sur les flèches hautes.",
        "hint": "Analysez le coup commençant par 3/off pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 3/off 2/off domine 6/3 2/off de +0.136 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 3/off 2/off maximise votre équité cubeful (-0.678 EMG).",
            "Évitez le piège 6/3 2/off (-0.136 EMG) ; préférez la ligne maîtresse 3/off 2/off."
        ]
    },
    {
        "id": "btcore5k_3ply_79_24",
        "tier": 2,
        "xgid": "XGID=-CBAD-C------------ab-aec-:0:0:1:24:4:4:0:9:8",
        "dice": [
            2,
            4
        ],
        "playedMove": "6/off",
        "optimalMove": "4/off 2/off",
        "acceptableMoves": [],
        "quizChoices": [
            "4/off 2/off",
            "6/off",
            "4/2 4/off",
            "6/4 6/2"
        ],
        "equityLoss": 0.189,
        "verdict": "howler",
        "conceptId": "bearoff_technique",
        "conceptName": "Technique de Sortie (Bear-off)",
        "whyFailed": "En jouant 6/off (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.189 EMG face à la ligne 3-ply 4/off 2/off.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-4 en Match en 9 pts (4-4, Videau à 1) : 4/off 2/off surpasse 6/off de +0.189 EMG (30.3 % de gain).",
        "proverb": "En sortie de dames, minimisez le gaspillage de pips et évitez les trous sur les flèches hautes.",
        "hint": "Analysez le coup commençant par 4/off pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 4/off 2/off domine 6/off de +0.189 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 4/off 2/off maximise votre équité cubeful (-0.536 EMG).",
            "Évitez le piège 6/off (-0.189 EMG) ; préférez la ligne maîtresse 4/off 2/off."
        ]
    },
    {
        "id": "btcore5k_3ply_80_26",
        "tier": 3,
        "xgid": "XGID=-b----E-D---bD--ae-eA---A-:0:0:1:26:4:4:0:9:8",
        "dice": [
            2,
            6
        ],
        "playedMove": "24/18 20/18",
        "optimalMove": "24/16*",
        "acceptableMoves": [],
        "quizChoices": [
            "24/16*",
            "24/18 20/18",
            "20/14 13/11",
            "20/14 8/6"
        ],
        "equityLoss": 0.109,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/18 20/18 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.109 EMG face à la ligne 3-ply 24/16*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-6 en Match en 9 pts (4-4, Videau à 1) : 24/16* surpasse 24/18 20/18 de +0.109 EMG (57.4 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 24/16* pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/16* domine 24/18 20/18 de +0.109 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 24/16* maximise votre équité cubeful (+0.266 EMG).",
            "Évitez le piège 24/18 20/18 (-0.109 EMG) ; préférez la ligne maîtresse 24/16*."
        ]
    },
    {
        "id": "btcore5k_3ply_81_41",
        "tier": 4,
        "xgid": "XGID=-b----E-D---bD---eBe--a---:0:0:1:41:4:4:0:9:8",
        "dice": [
            4,
            1
        ],
        "playedMove": "13/8",
        "optimalMove": "13/9 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "13/9 6/5",
            "13/8",
            "13/9 8/7",
            "8/3"
        ],
        "equityLoss": 0.036,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/8 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.036 EMG face à la ligne 3-ply 13/9 6/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-1 en Match en 9 pts (4-4, Videau à 1) : 13/9 6/5 surpasse 13/8 de +0.036 EMG (54.1 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/9 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/9 6/5 domine 13/8 de +0.036 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 13/9 6/5 maximise votre équité cubeful (+0.136 EMG).",
            "Évitez le piège 13/8 (-0.036 EMG) ; préférez la ligne maîtresse 13/9 6/5."
        ]
    },
    {
        "id": "btcore5k_3ply_82_63",
        "tier": 3,
        "xgid": "XGID=-b----E-E---bC---cBe--ba--:0:0:1:63:4:4:0:9:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "13/7 8/5",
        "optimalMove": "13/4",
        "acceptableMoves": [],
        "quizChoices": [
            "13/4",
            "13/7 8/5",
            "13/10 8/2",
            "13/7 6/3"
        ],
        "equityLoss": 0.07,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/7 8/5 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.070 EMG face à la ligne 3-ply 13/4.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-3 en Match en 9 pts (4-4, Videau à 1) : 13/4 surpasse 13/7 8/5 de +0.070 EMG (48.8 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/4 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/4 domine 13/7 8/5 de +0.070 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 13/4 maximise votre équité cubeful (-0.084 EMG).",
            "Évitez le piège 13/7 8/5 (-0.070 EMG) ; préférez la ligne maîtresse 13/4."
        ]
    },
    {
        "id": "btcore5k_3ply_83_25",
        "tier": 3,
        "xgid": "XGID=-b--A-E-E---bB---bBd--bc--:0:0:1:25:4:4:0:9:8",
        "dice": [
            2,
            5
        ],
        "playedMove": "13/8 6/4",
        "optimalMove": "8/3 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/4",
            "13/8 6/4",
            "18/13 6/4",
            "13/8 4/2"
        ],
        "equityLoss": 0.106,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/8 6/4 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.106 EMG face à la ligne 3-ply 8/3 6/4.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-5 en Match en 9 pts (4-4, Videau à 1) : 8/3 6/4 surpasse 13/8 6/4 de +0.106 EMG (55.0 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/3 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/3 6/4 domine 13/8 6/4 de +0.106 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 8/3 6/4 maximise votre équité cubeful (+0.175 EMG).",
            "Évitez le piège 13/8 6/4 (-0.106 EMG) ; préférez la ligne maîtresse 8/3 6/4."
        ]
    },
    {
        "id": "btcore5k_3ply_84_65",
        "tier": 3,
        "xgid": "XGID=----BbD-E---bC-----d-Acd--:0:0:1:65:4:4:0:9:8",
        "dice": [
            6,
            5
        ],
        "playedMove": "13/2",
        "optimalMove": "8/3 8/2",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 8/2",
            "13/2",
            "13/7 8/3",
            "8/2 6/1"
        ],
        "equityLoss": 0.068,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/2 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.068 EMG face à la ligne 3-ply 8/3 8/2.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-5 en Match en 9 pts (4-4, Videau à 1) : 8/3 8/2 surpasse 13/2 de +0.068 EMG (51.7 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 8/3 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/3 8/2 domine 13/2 de +0.068 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 8/3 8/2 maximise votre équité cubeful (+0.067 EMG).",
            "Évitez le piège 13/2 (-0.068 EMG) ; préférez la ligne maîtresse 8/3 8/2."
        ]
    },
    {
        "id": "btcore5k_3ply_85_33",
        "tier": 2,
        "xgid": "XGID=--A-BbD-E---bB-----c-Acda-:0:0:1:33:4:4:0:9:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "13/7(2)",
        "optimalMove": "13/10(2) 6/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/10(2) 6/3(2)",
            "13/7(2)",
            "13/10(2) 4/1(2)",
            "21/18 13/10(2) 6/3"
        ],
        "equityLoss": 0.162,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/7(2) (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.162 EMG face à la ligne 3-ply 13/10(2) 6/3(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-3 en Match en 9 pts (4-4, Videau à 1) : 13/10(2) 6/3(2) surpasse 13/7(2) de +0.162 EMG (57.6 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/10(2) pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/10(2) 6/3(2) domine 13/7(2) de +0.162 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 13/10(2) 6/3(2) maximise votre équité cubeful (+0.284 EMG).",
            "Évitez le piège 13/7(2) (-0.162 EMG) ; préférez la ligne maîtresse 13/10(2) 6/3(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_86_63",
        "tier": 2,
        "xgid": "XGID=--A-BbDBE---a------c-Adda-:0:0:1:63:4:4:0:9:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "8/2 6/3",
        "optimalMove": "21/12*",
        "acceptableMoves": [],
        "quizChoices": [
            "21/12*",
            "8/2 6/3",
            "21/18 8/2",
            "8/2 7/4"
        ],
        "equityLoss": 0.318,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 8/2 6/3 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.318 EMG face à la ligne 3-ply 21/12*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-3 en Match en 9 pts (4-4, Videau à 1) : 21/12* surpasse 8/2 6/3 de +0.318 EMG (68.4 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 21/12* pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 21/12* domine 8/2 6/3 de +0.318 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 21/12* maximise votre équité cubeful (+0.597 EMG).",
            "Évitez le piège 8/2 6/3 (-0.318 EMG) ; préférez la ligne maîtresse 21/12*."
        ]
    },
    {
        "id": "btcore5k_3ply_87_65",
        "tier": 2,
        "xgid": "XGID=--C-B-DBCa---a-----bA-edb-:0:0:1:65:4:4:0:9:8",
        "dice": [
            6,
            5
        ],
        "playedMove": "7/1 6/1",
        "optimalMove": "20/9*",
        "acceptableMoves": [],
        "quizChoices": [
            "20/9*",
            "7/1 6/1",
            "8/3 7/1",
            "8/2 6/1"
        ],
        "equityLoss": 0.778,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 7/1 6/1 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.778 EMG face à la ligne 3-ply 20/9*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-5 en Match en 9 pts (4-4, Videau à 1) : 20/9* surpasse 7/1 6/1 de +0.778 EMG (58.8 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 20/9* pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 20/9* domine 7/1 6/1 de +0.778 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 20/9* maximise votre équité cubeful (+0.261 EMG).",
            "Évitez le piège 7/1 6/1 (-0.778 EMG) ; préférez la ligne maîtresse 20/9*."
        ]
    },
    {
        "id": "btcore5k_3ply_88_53",
        "tier": 2,
        "xgid": "XGID=-aC-B-DBCA---------c--edb-:0:0:1:53:4:4:0:9:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "9/4 8/5",
        "optimalMove": "8/3 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/3",
            "9/4 8/5",
            "9/4 6/3",
            "9/1*"
        ],
        "equityLoss": 0.411,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 9/4 8/5 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.411 EMG face à la ligne 3-ply 8/3 6/3.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-3 en Match en 9 pts (4-4, Videau à 1) : 8/3 6/3 surpasse 9/4 8/5 de +0.411 EMG (68.4 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/3 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/3 6/3 domine 9/4 8/5 de +0.411 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 8/3 6/3 maximise votre équité cubeful (+0.525 EMG).",
            "Évitez le piège 9/4 8/5 (-0.411 EMG) ; préférez la ligne maîtresse 8/3 6/3."
        ]
    },
    {
        "id": "btcore5k_3ply_89_14",
        "tier": 2,
        "xgid": "XGID=-aCBB-CBBA---------b--fdb-:0:0:1:14:4:4:0:9:8",
        "dice": [
            1,
            4
        ],
        "playedMove": "8/7 8/4",
        "optimalMove": "9/5 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "9/5 6/5",
            "8/7 8/4",
            "9/4",
            "8/3"
        ],
        "equityLoss": 0.365,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 8/7 8/4 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.365 EMG face à la ligne 3-ply 9/5 6/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-4 en Match en 9 pts (4-4, Videau à 1) : 9/5 6/5 surpasse 8/7 8/4 de +0.365 EMG (94.4 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 9/5 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 9/5 6/5 domine 8/7 8/4 de +0.365 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 9/5 6/5 maximise votre équité cubeful (+0.996 EMG).",
            "Évitez le piège 8/7 8/4 (-0.365 EMG) ; préférez la ligne maîtresse 9/5 6/5."
        ]
    },
    {
        "id": "btcore5k_3ply_90_63",
        "tier": 2,
        "xgid": "XGID=-aCBBBBBB-------------fec-:0:0:1:63:4:4:0:9:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "7/4 7/1*",
        "optimalMove": "8/5 8/2",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5 8/2",
            "7/4 7/1*",
            "8/5 7/1*",
            "7/1* 4/1"
        ],
        "equityLoss": 0.142,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 7/4 7/1* (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.142 EMG face à la ligne 3-ply 8/5 8/2.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-3 en Match en 9 pts (4-4, Videau à 1) : 8/5 8/2 surpasse 7/4 7/1* de +0.142 EMG (87.4 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/5 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/5 8/2 domine 7/4 7/1* de +0.142 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 8/5 8/2 maximise votre équité cubeful (+1.000 EMG).",
            "Évitez le piège 7/4 7/1* (-0.142 EMG) ; préférez la ligne maîtresse 8/5 8/2."
        ]
    },
    {
        "id": "btcore5k_3ply_91_43",
        "tier": 3,
        "xgid": "XGID=aBDBBBBA--------------fec-:0:0:1:43:4:4:0:9:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "6/3 6/2",
        "optimalMove": "7/off",
        "acceptableMoves": [],
        "quizChoices": [
            "7/off",
            "6/3 6/2",
            "5/2 5/1",
            "7/4 6/2"
        ],
        "equityLoss": 0.103,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 6/3 6/2 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.103 EMG face à la ligne 3-ply 7/off.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-3 en Match en 9 pts (4-4, Videau à 1) : 7/off surpasse 6/3 6/2 de +0.103 EMG (96.4 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 7/off pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 7/off domine 6/3 6/2 de +0.103 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 7/off maximise votre équité cubeful (+1.000 EMG).",
            "Évitez le piège 6/3 6/2 (-0.103 EMG) ; préférez la ligne maîtresse 7/off."
        ]
    },
    {
        "id": "btcore5k_3ply_92_51",
        "tier": 2,
        "xgid": "XGID=aBDBBBB---------------fec-:0:0:1:51:4:4:0:9:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "5/off 2/1",
        "optimalMove": "5/4 5/off",
        "acceptableMoves": [
            "6/5 6/1"
        ],
        "quizChoices": [
            "5/4 5/off",
            "5/off 2/1",
            "6/5 6/1",
            "6/off"
        ],
        "equityLoss": 0.305,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 5/off 2/1 (Match en 9 pts (4-4, Videau à 1)), vous concédez -0.305 EMG face à la ligne 3-ply 5/4 5/off.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-1 en Match en 9 pts (4-4, Videau à 1) : 5/4 5/off surpasse 5/off 2/1 de +0.305 EMG (95.6 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 5/4 pour optimiser votre structure en Match en 9 pts (4-4, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 5/4 5/off domine 5/off 2/1 de +0.305 EMG.",
            "En Match en 9 pts (4-4, Videau à 1), 5/4 5/off maximise votre équité cubeful (+0.999 EMG).",
            "Évitez le piège 5/off 2/1 (-0.305 EMG) ; préférez la ligne maîtresse 5/4 5/off."
        ]
    },
    {
        "id": "btcore5k_3ply_93_32",
        "tier": 4,
        "xgid": "XGID=-b----E-D---eD---b-d-b-AA-:0:0:1:32:5:5:0:11:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "13/11 13/10",
        "optimalMove": "13/8",
        "acceptableMoves": [
            "24/22 23/20"
        ],
        "quizChoices": [
            "13/8",
            "13/11 13/10",
            "24/22 23/20",
            "23/20 13/11"
        ],
        "equityLoss": 0.042,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/11 13/10 (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.042 EMG face à la ligne 3-ply 13/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-2 en Match en 11 pts (5-5, Videau à 1) : 13/8 surpasse 13/11 13/10 de +0.042 EMG (44.7 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/8 pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/8 domine 13/11 13/10 de +0.042 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 13/8 maximise votre équité cubeful (-0.247 EMG).",
            "Évitez le piège 13/11 13/10 (-0.042 EMG) ; préférez la ligne maîtresse 13/8."
        ]
    },
    {
        "id": "btcore5k_3ply_94_24",
        "tier": 2,
        "xgid": "XGID=-a----E-E---fC---b-d-b-AA-:0:0:1:24:5:5:0:11:8",
        "dice": [
            2,
            4
        ],
        "playedMove": "24/20 13/11",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/20 13/11",
            "24/18",
            "24/20 8/6"
        ],
        "equityLoss": 0.249,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/20 13/11 (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.249 EMG face à la ligne 3-ply 8/4 6/4.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-4 en Match en 11 pts (5-5, Videau à 1) : 8/4 6/4 surpasse 24/20 13/11 de +0.249 EMG (44.9 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/4 pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/4 6/4 domine 24/20 13/11 de +0.249 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 8/4 6/4 maximise votre équité cubeful (-0.174 EMG).",
            "Évitez le piège 24/20 13/11 (-0.249 EMG) ; préférez la ligne maîtresse 8/4 6/4."
        ]
    },
    {
        "id": "btcore5k_3ply_95_24",
        "tier": 4,
        "xgid": "XGID=-a--B-D-D---eC---c-d-b-AA-:0:0:1:24:5:5:0:11:8",
        "dice": [
            2,
            4
        ],
        "playedMove": "24/22 8/4",
        "optimalMove": "13/11 8/4",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11 8/4",
            "24/22 8/4",
            "24/20 13/11",
            "24/20 8/6"
        ],
        "equityLoss": 0.045,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/22 8/4 (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.045 EMG face à la ligne 3-ply 13/11 8/4.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-4 en Match en 11 pts (5-5, Videau à 1) : 13/11 8/4 surpasse 24/22 8/4 de +0.045 EMG (43.7 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/11 pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/11 8/4 domine 24/22 8/4 de +0.045 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 13/11 8/4 maximise votre équité cubeful (-0.230 EMG).",
            "Évitez le piège 24/22 8/4 (-0.045 EMG) ; préférez la ligne maîtresse 13/11 8/4."
        ]
    },
    {
        "id": "btcore5k_3ply_96_26",
        "tier": 4,
        "xgid": "XGID=-a--C-E-B---dCA--abc-b-bA-:0:0:1:26:5:5:0:11:8",
        "dice": [
            2,
            6
        ],
        "playedMove": "14/8 13/11",
        "optimalMove": "24/22 14/8",
        "acceptableMoves": [],
        "quizChoices": [
            "24/22 14/8",
            "14/8 13/11",
            "14/8 6/4",
            "14/6"
        ],
        "equityLoss": 0.047,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 14/8 13/11 (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.047 EMG face à la ligne 3-ply 24/22 14/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-6 en Match en 11 pts (5-5, Videau à 1) : 24/22 14/8 surpasse 14/8 13/11 de +0.047 EMG (43.0 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 24/22 pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/22 14/8 domine 14/8 13/11 de +0.047 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 24/22 14/8 maximise votre équité cubeful (-0.327 EMG).",
            "Évitez le piège 14/8 13/11 (-0.047 EMG) ; préférez la ligne maîtresse 24/22 14/8."
        ]
    },
    {
        "id": "btcore5k_3ply_97_55",
        "tier": 3,
        "xgid": "XGID=-a--C-E-C---dC----cb-cAb--:0:0:1:55:5:5:0:11:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "8/3(2) 6/1*(2)",
        "optimalMove": "22/17 13/8 6/1*(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "22/17 13/8 6/1*(2)",
            "8/3(2) 6/1*(2)",
            "22/17 13/3 8/3",
            "13/3 8/3 6/1*"
        ],
        "equityLoss": 0.099,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 8/3(2) 6/1*(2) (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.099 EMG face à la ligne 3-ply 22/17 13/8 6/1*(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-5 en Match en 11 pts (5-5, Videau à 1) : 22/17 13/8 6/1*(2) surpasse 8/3(2) 6/1*(2) de +0.099 EMG (68.1 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 22/17 pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 22/17 13/8 6/1*(2) domine 8/3(2) 6/1*(2) de +0.099 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 22/17 13/8 6/1*(2) maximise votre équité cubeful (+0.724 EMG).",
            "Évitez le piège 8/3(2) 6/1*(2) (-0.099 EMG) ; préférez la ligne maîtresse 22/17 13/8 6/1*(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_98_65",
        "tier": 4,
        "xgid": "XGID=-b--B-D-B---dE---c-e---aB-:0:0:1:65:5:5:0:11:8",
        "dice": [
            6,
            5
        ],
        "playedMove": "24/13",
        "optimalMove": "13/8 13/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/8 13/7",
            "24/13",
            "24/18 13/8",
            "13/2"
        ],
        "equityLoss": 0.045,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/13 (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.045 EMG face à la ligne 3-ply 13/8 13/7.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-5 en Match en 11 pts (5-5, Videau à 1) : 13/8 13/7 surpasse 24/13 de +0.045 EMG (57.3 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/8 pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/8 13/7 domine 24/13 de +0.045 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 13/8 13/7 maximise votre équité cubeful (+0.351 EMG).",
            "Évitez le piège 24/13 (-0.045 EMG) ; préférez la ligne maîtresse 13/8 13/7."
        ]
    },
    {
        "id": "btcore5k_3ply_99_23",
        "tier": 4,
        "xgid": "XGID=-b--B-D-B---dF---b-e---bA-:0:0:1:23:5:5:0:11:8",
        "dice": [
            2,
            3
        ],
        "playedMove": "13/8",
        "optimalMove": "13/11 13/10",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11 13/10",
            "13/8",
            "24/21 13/11",
            "13/10 6/4"
        ],
        "equityLoss": 0.041,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/8 (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.041 EMG face à la ligne 3-ply 13/11 13/10.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-3 en Match en 11 pts (5-5, Videau à 1) : 13/11 13/10 surpasse 13/8 de +0.041 EMG (58.4 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/11 pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/11 13/10 domine 13/8 de +0.041 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 13/11 13/10 maximise votre équité cubeful (+0.333 EMG).",
            "Évitez le piège 13/8 (-0.041 EMG) ; préférez la ligne maîtresse 13/11 13/10."
        ]
    },
    {
        "id": "btcore5k_3ply_100_46",
        "tier": 2,
        "xgid": "XGID=-b--B-D-C---dE---a-d-b-bA-:0:0:1:46:5:5:0:11:8",
        "dice": [
            4,
            6
        ],
        "playedMove": "24/18 13/9",
        "optimalMove": "8/2 6/2",
        "acceptableMoves": [
            "24/14"
        ],
        "quizChoices": [
            "8/2 6/2",
            "24/18 13/9",
            "24/14",
            "24/18 8/4"
        ],
        "equityLoss": 0.179,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/18 13/9 (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.179 EMG face à la ligne 3-ply 8/2 6/2.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-6 en Match en 11 pts (5-5, Videau à 1) : 8/2 6/2 surpasse 24/18 13/9 de +0.179 EMG (56.1 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 8/2 pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/2 6/2 domine 24/18 13/9 de +0.179 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 8/2 6/2 maximise votre équité cubeful (+0.215 EMG).",
            "Évitez le piège 24/18 13/9 (-0.179 EMG) ; préférez la ligne maîtresse 8/2 6/2."
        ]
    },
    {
        "id": "btcore5k_3ply_101_61",
        "tier": 2,
        "xgid": "XGID=-bB-B-C-B---cE---a-d-b-cA-:0:0:1:61:5:5:0:11:8",
        "dice": [
            6,
            1
        ],
        "playedMove": "13/7 8/7",
        "optimalMove": "24/17*",
        "acceptableMoves": [],
        "quizChoices": [
            "24/17*",
            "13/7 8/7",
            "13/6",
            "24/18 6/5"
        ],
        "equityLoss": 0.279,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 13/7 8/7 (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.279 EMG face à la ligne 3-ply 24/17*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-1 en Match en 11 pts (5-5, Videau à 1) : 24/17* surpasse 13/7 8/7 de +0.279 EMG (68.6 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 24/17* pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/17* domine 13/7 8/7 de +0.279 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 24/17* maximise votre équité cubeful (+0.728 EMG).",
            "Évitez le piège 13/7 8/7 (-0.279 EMG) ; préférez la ligne maîtresse 24/17*."
        ]
    },
    {
        "id": "btcore5k_3ply_102_21",
        "tier": 3,
        "xgid": "XGID=abB-B-C-B---cE---A-d-b-c--:0:0:1:21:5:5:0:11:8",
        "dice": [
            2,
            1
        ],
        "playedMove": "17/16 6/4",
        "optimalMove": "13/10",
        "acceptableMoves": [
            "17/14",
            "17/16 13/11"
        ],
        "quizChoices": [
            "13/10",
            "17/16 6/4",
            "17/14",
            "17/16 13/11"
        ],
        "equityLoss": 0.111,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 17/16 6/4 (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.111 EMG face à la ligne 3-ply 13/10.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-1 en Match en 11 pts (5-5, Videau à 1) : 13/10 surpasse 17/16 6/4 de +0.111 EMG (71.3 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 13/10 pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/10 domine 17/16 6/4 de +0.111 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 13/10 maximise votre équité cubeful (+0.885 EMG).",
            "Évitez le piège 17/16 6/4 (-0.111 EMG) ; préférez la ligne maîtresse 13/10."
        ]
    },
    {
        "id": "btcore5k_3ply_103_35",
        "tier": 3,
        "xgid": "XGID=-bB-B-C-B---bEAa-a-d-b-c--:0:0:1:35:5:5:0:11:8",
        "dice": [
            3,
            5
        ],
        "playedMove": "14/6",
        "optimalMove": "14/11 13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "14/11 13/8",
            "14/6",
            "14/9 13/10",
            "13/10 13/8"
        ],
        "equityLoss": 0.095,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 14/6 (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.095 EMG face à la ligne 3-ply 14/11 13/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-5 en Match en 11 pts (5-5, Videau à 1) : 14/11 13/8 surpasse 14/6 de +0.095 EMG (71.1 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 14/11 pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 14/11 13/8 domine 14/6 de +0.095 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 14/11 13/8 maximise votre équité cubeful (+0.849 EMG).",
            "Évitez le piège 14/6 (-0.095 EMG) ; préférez la ligne maîtresse 14/11 13/8."
        ]
    },
    {
        "id": "btcore5k_3ply_104_53",
        "tier": 3,
        "xgid": "XGID=-bBBB-D-B---bC-----c-c-da-:0:0:1:53:5:5:0:11:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "13/5",
        "optimalMove": "13/8 6/3",
        "acceptableMoves": [
            "13/10 8/3",
            "8/3 6/3"
        ],
        "quizChoices": [
            "13/8 6/3",
            "13/5",
            "13/10 8/3",
            "8/3 6/3"
        ],
        "equityLoss": 0.06,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/5 (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.060 EMG face à la ligne 3-ply 13/8 6/3.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-3 en Match en 11 pts (5-5, Videau à 1) : 13/8 6/3 surpasse 13/5 de +0.060 EMG (82.0 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/8 pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/8 6/3 domine 13/5 de +0.060 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 13/8 6/3 maximise votre équité cubeful (+0.974 EMG).",
            "Évitez le piège 13/5 (-0.060 EMG) ; préférez la ligne maîtresse 13/8 6/3."
        ]
    },
    {
        "id": "btcore5k_3ply_105_16",
        "tier": 4,
        "xgid": "XGID=-bBCB-C-C----Ba---ac-c-da-:0:0:1:16:5:5:0:11:8",
        "dice": [
            1,
            6
        ],
        "playedMove": "13/6",
        "optimalMove": "13/7 8/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7 8/7",
            "13/6",
            "8/2 3/2",
            "13/12 8/2"
        ],
        "equityLoss": 0.052,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/6 (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.052 EMG face à la ligne 3-ply 13/7 8/7.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-6 en Match en 11 pts (5-5, Videau à 1) : 13/7 8/7 surpasse 13/6 de +0.052 EMG (87.1 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/7 pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/7 8/7 domine 13/6 de +0.052 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 13/7 8/7 maximise votre équité cubeful (+0.999 EMG).",
            "Évitez le piège 13/6 (-0.052 EMG) ; préférez la ligne maîtresse 13/7 8/7."
        ]
    },
    {
        "id": "btcore5k_3ply_106_13",
        "tier": 4,
        "xgid": "XGID=-bCCBBB-B----A-----a-bbec-:0:0:1:13:5:5:0:11:8",
        "dice": [
            1,
            3
        ],
        "playedMove": "13/9",
        "optimalMove": "13/12 8/5",
        "acceptableMoves": [],
        "quizChoices": [
            "13/12 8/5",
            "13/9",
            "8/4",
            "8/5 3/2"
        ],
        "equityLoss": 0.035,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/9 (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.035 EMG face à la ligne 3-ply 13/12 8/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-3 en Match en 11 pts (5-5, Videau à 1) : 13/12 8/5 surpasse 13/9 de +0.035 EMG (90.0 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/12 pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/12 8/5 domine 13/9 de +0.035 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 13/12 8/5 maximise votre équité cubeful (+1.077 EMG).",
            "Évitez le piège 13/9 (-0.035 EMG) ; préférez la ligne maîtresse 13/12 8/5."
        ]
    },
    {
        "id": "btcore5k_3ply_107_15",
        "tier": 4,
        "xgid": "XGID=-bCCBBB-BA-----------baee-:0:0:1:15:5:5:0:11:8",
        "dice": [
            1,
            5
        ],
        "playedMove": "9/3",
        "optimalMove": "9/4 8/7",
        "acceptableMoves": [],
        "quizChoices": [
            "9/4 8/7",
            "9/3",
            "8/7 8/3",
            "8/2"
        ],
        "equityLoss": 0.036,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 9/3 (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.036 EMG face à la ligne 3-ply 9/4 8/7.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-5 en Match en 11 pts (5-5, Videau à 1) : 9/4 8/7 surpasse 9/3 de +0.036 EMG (91.2 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 9/4 pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 9/4 8/7 domine 9/3 de +0.036 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 9/4 8/7 maximise votre équité cubeful (+1.100 EMG).",
            "Évitez le piège 9/3 (-0.036 EMG) ; préférez la ligne maîtresse 9/4 8/7."
        ]
    },
    {
        "id": "btcore5k_3ply_108_16",
        "tier": 4,
        "xgid": "XGID=-bCDBBB-B-------------bef-:0:0:1:16:5:5:0:11:8",
        "dice": [
            1,
            6
        ],
        "playedMove": "8/7 8/2",
        "optimalMove": "8/2 3/2",
        "acceptableMoves": [],
        "quizChoices": [
            "8/2 3/2",
            "8/7 8/2",
            "8/2 4/3",
            "8/2 6/5"
        ],
        "equityLoss": 0.033,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 8/7 8/2 (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.033 EMG face à la ligne 3-ply 8/2 3/2.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-6 en Match en 11 pts (5-5, Videau à 1) : 8/2 3/2 surpasse 8/7 8/2 de +0.033 EMG (91.0 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/2 pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/2 3/2 domine 8/7 8/2 de +0.033 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 8/2 3/2 maximise votre équité cubeful (+1.052 EMG).",
            "Évitez le piège 8/7 8/2 (-0.033 EMG) ; préférez la ligne maîtresse 8/2 3/2."
        ]
    },
    {
        "id": "btcore5k_3ply_109_33",
        "tier": 4,
        "xgid": "XGID=-aEDB-B--a------------aeg-:0:0:1:33:5:5:0:11:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "3/off(4)",
        "optimalMove": "4/1*(2) 3/off(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "4/1*(2) 3/off(2)",
            "3/off(4)",
            "6/off 3/off(2)",
            "6/off 4/1*(2)"
        ],
        "equityLoss": 0.037,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 3/off(4) (Match en 11 pts (5-5, Videau à 1)), vous concédez -0.037 EMG face à la ligne 3-ply 4/1*(2) 3/off(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-3 en Match en 11 pts (5-5, Videau à 1) : 4/1*(2) 3/off(2) surpasse 3/off(4) de +0.037 EMG (99.1 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 4/1*(2) pour optimiser votre structure en Match en 11 pts (5-5, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 4/1*(2) 3/off(2) domine 3/off(4) de +0.037 EMG.",
            "En Match en 11 pts (5-5, Videau à 1), 4/1*(2) 3/off(2) maximise votre équité cubeful (+1.181 EMG).",
            "Évitez le piège 3/off(4) (-0.037 EMG) ; préférez la ligne maîtresse 4/1*(2) 3/off(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_110_14",
        "tier": 2,
        "xgid": "XGID=-a----E-D---fD---c-eA---A-:0:0:1:14:0:0:0:0:8",
        "dice": [
            1,
            4
        ],
        "playedMove": "24/23 13/9",
        "optimalMove": "24/20 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "24/20 6/5",
            "24/23 13/9",
            "24/20 8/7",
            "13/8"
        ],
        "equityLoss": 0.158,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 24/23 13/9 (Money Game), vous concédez -0.158 EMG face à la ligne 3-ply 24/20 6/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-4 en Money Game : 24/20 6/5 surpasse 24/23 13/9 de +0.158 EMG (49.7 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 24/20 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/20 6/5 domine 24/23 13/9 de +0.158 EMG.",
            "En Money Game, 24/20 6/5 maximise votre équité cubeful (+0.049 EMG).",
            "Évitez le piège 24/23 13/9 (-0.158 EMG) ; préférez la ligne maîtresse 24/20 6/5."
        ]
    },
    {
        "id": "btcore5k_3ply_111_45",
        "tier": 2,
        "xgid": "XGID=-a---AD-D---eD---d-eB-----:0:0:1:45:0:0:0:0:8",
        "dice": [
            4,
            5
        ],
        "playedMove": "13/8 5/1*",
        "optimalMove": "6/1* 5/1",
        "acceptableMoves": [],
        "quizChoices": [
            "6/1* 5/1",
            "13/8 5/1*",
            "13/9 13/8",
            "13/4"
        ],
        "equityLoss": 0.194,
        "verdict": "howler",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/8 5/1* (Money Game), vous concédez -0.194 EMG face à la ligne 3-ply 6/1* 5/1.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-5 en Money Game : 6/1* 5/1 surpasse 13/8 5/1* de +0.194 EMG (54.5 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 6/1* pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 6/1* 5/1 domine 13/8 5/1* de +0.194 EMG.",
            "En Money Game, 6/1* 5/1 maximise votre équité cubeful (+0.233 EMG).",
            "Évitez le piège 13/8 5/1* (-0.194 EMG) ; préférez la ligne maîtresse 6/1* 5/1."
        ]
    },
    {
        "id": "btcore5k_3ply_112_11",
        "tier": 2,
        "xgid": "XGID=aB----C-D---eD---d-eB-----:0:0:1:11:0:0:0:0:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "8/6(2)",
        "optimalMove": "8/5 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5 6/5",
            "8/6(2)",
            "8/6 8/7(2)",
            "8/7(4)"
        ],
        "equityLoss": 0.275,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 8/6(2) (Money Game), vous concédez -0.275 EMG face à la ligne 3-ply 8/5 6/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-1 en Money Game : 8/5 6/5 surpasse 8/6(2) de +0.275 EMG (61.5 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 8/5 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/5 6/5 domine 8/6(2) de +0.275 EMG.",
            "En Money Game, 8/5 6/5 maximise votre équité cubeful (+0.537 EMG).",
            "Évitez le piège 8/6(2) (-0.275 EMG) ; préférez la ligne maîtresse 8/5 6/5."
        ]
    },
    {
        "id": "btcore5k_3ply_113_63",
        "tier": 2,
        "xgid": "XGID=-B--aBB-C---eD---d-eB-----:0:0:1:63:0:0:0:0:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "13/7 8/5",
        "optimalMove": "13/4*",
        "acceptableMoves": [],
        "quizChoices": [
            "13/4*",
            "13/7 8/5",
            "20/11",
            "13/10 8/2"
        ],
        "equityLoss": 0.161,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 13/7 8/5 (Money Game), vous concédez -0.161 EMG face à la ligne 3-ply 13/4*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-3 en Money Game : 13/4* surpasse 13/7 8/5 de +0.161 EMG (62.0 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 13/4* pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/4* domine 13/7 8/5 de +0.161 EMG.",
            "En Money Game, 13/4* maximise votre équité cubeful (+0.594 EMG).",
            "Évitez le piège 13/7 8/5 (-0.161 EMG) ; préférez la ligne maîtresse 13/4*."
        ]
    },
    {
        "id": "btcore5k_3ply_114_64",
        "tier": 2,
        "xgid": "XGID=-BA-aBB-B---eC---c-eB-A-a-:0:0:1:64:0:0:0:0:8",
        "dice": [
            6,
            4
        ],
        "playedMove": "22/16 20/16",
        "optimalMove": "8/4* 8/2",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4* 8/2",
            "22/16 20/16",
            "13/3",
            "22/16 8/4*"
        ],
        "equityLoss": 0.275,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 22/16 20/16 (Money Game), vous concédez -0.275 EMG face à la ligne 3-ply 8/4* 8/2.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-4 en Money Game : 8/4* 8/2 surpasse 22/16 20/16 de +0.275 EMG (60.8 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 8/4* pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/4* 8/2 domine 22/16 20/16 de +0.275 EMG.",
            "En Money Game, 8/4* 8/2 maximise votre équité cubeful (+0.593 EMG).",
            "Évitez le piège 22/16 20/16 (-0.275 EMG) ; préférez la ligne maîtresse 8/4* 8/2."
        ]
    },
    {
        "id": "btcore5k_3ply_115_34",
        "tier": 3,
        "xgid": "XGID=-BAA-BB-B-a-eB---c-dB-A-b-:0:0:1:34:0:0:0:0:8",
        "dice": [
            3,
            4
        ],
        "playedMove": "13/10* 13/9",
        "optimalMove": "13/10*/6",
        "acceptableMoves": [],
        "quizChoices": [
            "13/10*/6",
            "13/10* 13/9",
            "22/18 13/10*",
            "6/3 6/2"
        ],
        "equityLoss": 0.064,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 13/10* 13/9 (Money Game), vous concédez -0.064 EMG face à la ligne 3-ply 13/10*/6.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-4 en Money Game : 13/10*/6 surpasse 13/10* 13/9 de +0.064 EMG (51.1 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 13/10*/6 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/10*/6 domine 13/10* 13/9 de +0.064 EMG.",
            "En Money Game, 13/10*/6 maximise votre équité cubeful (+0.144 EMG).",
            "Évitez le piège 13/10* 13/9 (-0.064 EMG) ; préférez la ligne maîtresse 13/10*/6."
        ]
    },
    {
        "id": "btcore5k_3ply_116_26",
        "tier": 3,
        "xgid": "XGID=-BBB-B--B---dB--bc-dB-A-b-:0:0:1:26:0:0:0:0:8",
        "dice": [
            2,
            6
        ],
        "playedMove": "22/20 8/2",
        "optimalMove": "22/14",
        "acceptableMoves": [],
        "quizChoices": [
            "22/14",
            "22/20 8/2",
            "13/11 13/7",
            "22/20 13/7"
        ],
        "equityLoss": 0.091,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 22/20 8/2 (Money Game), vous concédez -0.091 EMG face à la ligne 3-ply 22/14.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-6 en Money Game : 22/14 surpasse 22/20 8/2 de +0.091 EMG (38.5 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 22/14 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 22/14 domine 22/20 8/2 de +0.091 EMG.",
            "En Money Game, 22/14 maximise votre équité cubeful (-0.354 EMG).",
            "Évitez le piège 22/20 8/2 (-0.091 EMG) ; préférez la ligne maîtresse 22/14."
        ]
    },
    {
        "id": "btcore5k_3ply_117_54",
        "tier": 3,
        "xgid": "XGID=-BCB-B--A---bB--bc-dC-b-b-:0:0:1:54:0:0:0:0:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/9 13/8",
        "optimalMove": "20/11",
        "acceptableMoves": [],
        "quizChoices": [
            "20/11",
            "13/9 13/8",
            "20/15 8/4",
            "13/4"
        ],
        "equityLoss": 0.08,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/9 13/8 (Money Game), vous concédez -0.080 EMG face à la ligne 3-ply 20/11.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-4 en Money Game : 20/11 surpasse 13/9 13/8 de +0.080 EMG (29.7 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 20/11 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 20/11 domine 13/9 13/8 de +0.080 EMG.",
            "En Money Game, 20/11 maximise votre équité cubeful (-0.642 EMG).",
            "Évitez le piège 13/9 13/8 (-0.080 EMG) ; préférez la ligne maîtresse 20/11."
        ]
    },
    {
        "id": "btcore5k_3ply_118_21",
        "tier": 4,
        "xgid": "XGID=-BCB-B--A--AbB--b--cBcbab-:0:0:1:21:0:0:0:0:8",
        "dice": [
            2,
            1
        ],
        "playedMove": "11/8",
        "optimalMove": "11/10 8/6",
        "acceptableMoves": [],
        "quizChoices": [
            "11/10 8/6",
            "11/8",
            "8/6 2/1",
            "11/9 2/1"
        ],
        "equityLoss": 0.033,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 11/8 (Money Game), vous concédez -0.033 EMG face à la ligne 3-ply 11/10 8/6.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-1 en Money Game : 11/10 8/6 surpasse 11/8 de +0.033 EMG (26.4 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 11/10 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 11/10 8/6 domine 11/8 de +0.033 EMG.",
            "En Money Game, 11/10 8/6 maximise votre équité cubeful (-0.847 EMG).",
            "Évitez le piège 11/8 (-0.033 EMG) ; préférez la ligne maîtresse 11/10 8/6."
        ]
    },
    {
        "id": "btcore5k_3ply_119_43",
        "tier": 3,
        "xgid": "XGID=-BCB-B--B---bB--b--bBbbbc-:0:0:1:43:0:0:0:0:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "8/1",
        "optimalMove": "13/10 13/9",
        "acceptableMoves": [],
        "quizChoices": [
            "13/10 13/9",
            "8/1",
            "8/5 8/4",
            "13/10 8/4"
        ],
        "equityLoss": 0.072,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 8/1 (Money Game), vous concédez -0.072 EMG face à la ligne 3-ply 13/10 13/9.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-3 en Money Game : 13/10 13/9 surpasse 8/1 de +0.072 EMG (25.6 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 13/10 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/10 13/9 domine 8/1 de +0.072 EMG.",
            "En Money Game, 13/10 13/9 maximise votre équité cubeful (-0.855 EMG).",
            "Évitez le piège 8/1 (-0.072 EMG) ; préférez la ligne maîtresse 13/10 13/9."
        ]
    },
    {
        "id": "btcore5k_3ply_120_41",
        "tier": 3,
        "xgid": "XGID=-BCBAC------bB----abBbcbc-:0:0:1:41:0:0:0:0:8",
        "dice": [
            4,
            1
        ],
        "playedMove": "5/4 5/1",
        "optimalMove": "13/9 5/4",
        "acceptableMoves": [],
        "quizChoices": [
            "13/9 5/4",
            "5/4 5/1",
            "5/1 4/3",
            "5/1 2/1"
        ],
        "equityLoss": 0.077,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 5/4 5/1 (Money Game), vous concédez -0.077 EMG face à la ligne 3-ply 13/9 5/4.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-1 en Money Game : 13/9 5/4 surpasse 5/4 5/1 de +0.077 EMG (26.2 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 13/9 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/9 5/4 domine 5/4 5/1 de +0.077 EMG.",
            "En Money Game, 13/9 5/4 maximise votre équité cubeful (-0.916 EMG).",
            "Évitez le piège 5/4 5/1 (-0.077 EMG) ; préférez la ligne maîtresse 13/9 5/4."
        ]
    },
    {
        "id": "btcore5k_3ply_121_44",
        "tier": 2,
        "xgid": "XGID=-BCBBB---A--bA-----bBbdbc-:0:0:1:44:0:0:0:0:8",
        "dice": [
            4,
            4
        ],
        "playedMove": "13/1 5/1",
        "optimalMove": "20/16(2) 13/5",
        "acceptableMoves": [],
        "quizChoices": [
            "20/16(2) 13/5",
            "13/1 5/1",
            "13/1 9/5",
            "20/16(2) 9/1"
        ],
        "equityLoss": 0.204,
        "verdict": "howler",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/1 5/1 (Money Game), vous concédez -0.204 EMG face à la ligne 3-ply 20/16(2) 13/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-4 en Money Game : 20/16(2) 13/5 surpasse 13/1 5/1 de +0.204 EMG (31.7 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 20/16(2) pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 20/16(2) 13/5 domine 13/1 5/1 de +0.204 EMG.",
            "En Money Game, 20/16(2) 13/5 maximise votre équité cubeful (-0.521 EMG).",
            "Évitez le piège 13/1 5/1 (-0.204 EMG) ; préférez la ligne maîtresse 20/16(2) 13/5."
        ]
    },
    {
        "id": "btcore5k_3ply_122_15",
        "tier": 4,
        "xgid": "XGID=-CCBBC------b-------Bbebd-:0:0:1:15:0:0:0:0:8",
        "dice": [
            1,
            5
        ],
        "playedMove": "20/15 2/1",
        "optimalMove": "20/14",
        "acceptableMoves": [
            "20/15 5/4"
        ],
        "quizChoices": [
            "20/14",
            "20/15 2/1",
            "20/15 5/4",
            "20/19 20/15"
        ],
        "equityLoss": 0.041,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 20/15 2/1 (Money Game), vous concédez -0.041 EMG face à la ligne 3-ply 20/14.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-5 en Money Game : 20/14 surpasse 20/15 2/1 de +0.041 EMG (36.7 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 20/14 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 20/14 domine 20/15 2/1 de +0.041 EMG.",
            "En Money Game, 20/14 maximise votre équité cubeful (-0.359 EMG).",
            "Évitez le piège 20/15 2/1 (-0.041 EMG) ; préférez la ligne maîtresse 20/14."
        ]
    },
    {
        "id": "btcore5k_3ply_123_33",
        "tier": 4,
        "xgid": "XGID=aCCBBC---A---------aAbebd-:0:0:1:33:0:0:0:0:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "20/8",
        "optimalMove": "20/11 5/2",
        "acceptableMoves": [],
        "quizChoices": [
            "20/11 5/2",
            "20/8",
            "20/14 9/3",
            "20/17 9/3 5/2"
        ],
        "equityLoss": 0.048,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 20/8 (Money Game), vous concédez -0.048 EMG face à la ligne 3-ply 20/11 5/2.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-3 en Money Game : 20/11 5/2 surpasse 20/8 de +0.048 EMG (81.3 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 20/11 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 20/11 5/2 domine 20/8 de +0.048 EMG.",
            "En Money Game, 20/11 5/2 maximise votre équité cubeful (+0.810 EMG).",
            "Évitez le piège 20/8 (-0.048 EMG) ; préférez la ligne maîtresse 20/11 5/2."
        ]
    },
    {
        "id": "btcore5k_3ply_124_41",
        "tier": 3,
        "xgid": "XGID=-b----E-C---cF---d-db---A-:0:0:1:41:0:0:0:0:8",
        "dice": [
            4,
            1
        ],
        "playedMove": "24/23 13/9",
        "optimalMove": "13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "13/8",
            "24/23 13/9",
            "13/9 6/5",
            "13/9 8/7"
        ],
        "equityLoss": 0.07,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/23 13/9 (Money Game), vous concédez -0.070 EMG face à la ligne 3-ply 13/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-1 en Money Game : 13/8 surpasse 24/23 13/9 de +0.070 EMG (43.6 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/8 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/8 domine 24/23 13/9 de +0.070 EMG.",
            "En Money Game, 13/8 maximise votre équité cubeful (-0.311 EMG).",
            "Évitez le piège 24/23 13/9 (-0.070 EMG) ; préférez la ligne maîtresse 13/8."
        ]
    },
    {
        "id": "btcore5k_3ply_125_13",
        "tier": 3,
        "xgid": "XGID=-c----E-D---bE--abbbc----A:0:0:1:13:0:0:0:0:8",
        "dice": [
            1,
            3
        ],
        "playedMove": "bar/22 6/5",
        "optimalMove": "bar/24 13/10",
        "acceptableMoves": [],
        "quizChoices": [
            "bar/24 13/10",
            "bar/22 6/5",
            "bar/21",
            "bar/24 8/5"
        ],
        "equityLoss": 0.076,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant bar/22 6/5 (Money Game), vous concédez -0.076 EMG face à la ligne 3-ply bar/24 13/10.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-3 en Money Game : bar/24 13/10 surpasse bar/22 6/5 de +0.076 EMG (42.3 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par bar/24 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : bar/24 13/10 domine bar/22 6/5 de +0.076 EMG.",
            "En Money Game, bar/24 13/10 maximise votre équité cubeful (-0.326 EMG).",
            "Évitez le piège bar/22 6/5 (-0.076 EMG) ; préférez la ligne maîtresse bar/24 13/10."
        ]
    },
    {
        "id": "btcore5k_3ply_126_31",
        "tier": 2,
        "xgid": "XGID=-c----E-D---bE---bbbbAaa--:0:0:1:31:0:0:0:0:8",
        "dice": [
            3,
            1
        ],
        "playedMove": "13/9",
        "optimalMove": "8/5 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5 6/5",
            "13/9",
            "13/10 6/5",
            "8/4"
        ],
        "equityLoss": 0.418,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/9 (Money Game), vous concédez -0.418 EMG face à la ligne 3-ply 8/5 6/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-1 en Money Game : 8/5 6/5 surpasse 13/9 de +0.418 EMG (60.0 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/5 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/5 6/5 domine 13/9 de +0.418 EMG.",
            "En Money Game, 8/5 6/5 maximise votre équité cubeful (+0.376 EMG).",
            "Évitez le piège 13/9 (-0.418 EMG) ; préférez la ligne maîtresse 8/5 6/5."
        ]
    },
    {
        "id": "btcore5k_3ply_127_43",
        "tier": 2,
        "xgid": "XGID=-c---BD-C---bE----bbcAab--:0:0:1:43:0:0:0:0:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "21/17 13/10",
        "optimalMove": "21/14",
        "acceptableMoves": [],
        "quizChoices": [
            "21/14",
            "21/17 13/10",
            "21/17 8/5",
            "13/6"
        ],
        "equityLoss": 0.121,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 21/17 13/10 (Money Game), vous concédez -0.121 EMG face à la ligne 3-ply 21/14.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-3 en Money Game : 21/14 surpasse 21/17 13/10 de +0.121 EMG (62.4 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 21/14 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 21/14 domine 21/17 13/10 de +0.121 EMG.",
            "En Money Game, 21/14 maximise votre équité cubeful (+0.414 EMG).",
            "Évitez le piège 21/17 13/10 (-0.121 EMG) ; préférez la ligne maîtresse 21/14."
        ]
    },
    {
        "id": "btcore5k_3ply_128_56",
        "tier": 2,
        "xgid": "XGID=-c---BD-C---bEA----bc-bba-:0:0:1:56:0:0:0:0:8",
        "dice": [
            5,
            6
        ],
        "playedMove": "14/3",
        "optimalMove": "14/8 13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "14/8 13/8",
            "14/3",
            "14/9 13/7",
            "14/9 8/2"
        ],
        "equityLoss": 0.23,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 14/3 (Money Game), vous concédez -0.230 EMG face à la ligne 3-ply 14/8 13/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-6 en Money Game : 14/8 13/8 surpasse 14/3 de +0.230 EMG (65.2 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 14/8 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 14/8 13/8 domine 14/3 de +0.230 EMG.",
            "En Money Game, 14/8 13/8 maximise votre équité cubeful (+0.515 EMG).",
            "Évitez le piège 14/3 (-0.230 EMG) ; préférez la ligne maîtresse 14/8 13/8."
        ]
    },
    {
        "id": "btcore5k_3ply_129_64",
        "tier": 2,
        "xgid": "XGID=-c---BD-E----D-aa--bc-bba-:0:0:1:64:0:0:0:0:8",
        "dice": [
            6,
            4
        ],
        "playedMove": "13/3",
        "optimalMove": "8/2 6/2",
        "acceptableMoves": [],
        "quizChoices": [
            "8/2 6/2",
            "13/3",
            "13/9 8/2",
            "13/9 13/7"
        ],
        "equityLoss": 0.34,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/3 (Money Game), vous concédez -0.340 EMG face à la ligne 3-ply 8/2 6/2.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-4 en Money Game : 8/2 6/2 surpasse 13/3 de +0.340 EMG (69.7 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 8/2 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/2 6/2 domine 13/3 de +0.340 EMG.",
            "En Money Game, 8/2 6/2 maximise votre équité cubeful (+0.676 EMG).",
            "Évitez le piège 13/3 (-0.340 EMG) ; préférez la ligne maîtresse 8/2 6/2."
        ]
    },
    {
        "id": "btcore5k_3ply_130_55",
        "tier": 3,
        "xgid": "XGID=-cB--BC-D----D--a--acbbba-:0:0:1:55:0:0:0:0:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "8/3(4)",
        "optimalMove": "13/3(2)",
        "acceptableMoves": [
            "13/3 8/3(2)"
        ],
        "quizChoices": [
            "13/3(2)",
            "8/3(4)",
            "13/3 8/3(2)",
            "13/8(4)"
        ],
        "equityLoss": 0.079,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 8/3(4) (Money Game), vous concédez -0.079 EMG face à la ligne 3-ply 13/3(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-5 en Money Game : 13/3(2) surpasse 8/3(4) de +0.079 EMG (81.2 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/3(2) pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/3(2) domine 8/3(4) de +0.079 EMG.",
            "En Money Game, 13/3(2) maximise votre équité cubeful (+0.985 EMG).",
            "Évitez le piège 8/3(4) (-0.079 EMG) ; préférez la ligne maîtresse 13/3(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_131_44",
        "tier": 4,
        "xgid": "XGID=-cBB-BC-D----B------dbbbb-:0:0:1:44:0:0:0:0:8",
        "dice": [
            4,
            4
        ],
        "playedMove": "13/5 8/4(2)",
        "optimalMove": "13/9(2) 8/4(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/9(2) 8/4(2)",
            "13/5 8/4(2)",
            "8/4(4)",
            "8/4(3) 6/2"
        ],
        "equityLoss": 0.033,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/5 8/4(2) (Money Game), vous concédez -0.033 EMG face à la ligne 3-ply 13/9(2) 8/4(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-4 en Money Game : 13/9(2) 8/4(2) surpasse 13/5 8/4(2) de +0.033 EMG (91.8 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/9(2) pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/9(2) 8/4(2) domine 13/5 8/4(2) de +0.033 EMG.",
            "En Money Game, 13/9(2) 8/4(2) maximise votre équité cubeful (+1.161 EMG).",
            "Évitez le piège 13/5 8/4(2) (-0.033 EMG) ; préférez la ligne maîtresse 13/9(2) 8/4(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_132_25",
        "tier": 4,
        "xgid": "XGID=-cBBBBC-BB----------cbbcb-:0:0:1:25:0:0:0:0:8",
        "dice": [
            2,
            5
        ],
        "playedMove": "9/4 8/6",
        "optimalMove": "8/6 8/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/6 8/3",
            "9/4 8/6",
            "8/3 6/4",
            "9/2"
        ],
        "equityLoss": 0.033,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 9/4 8/6 (Money Game), vous concédez -0.033 EMG face à la ligne 3-ply 8/6 8/3.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-5 en Money Game : 8/6 8/3 surpasse 9/4 8/6 de +0.033 EMG (93.0 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/6 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/6 8/3 domine 9/4 8/6 de +0.033 EMG.",
            "En Money Game, 8/6 8/3 maximise votre équité cubeful (+1.194 EMG).",
            "Évitez le piège 9/4 8/6 (-0.033 EMG) ; préférez la ligne maîtresse 8/6 8/3."
        ]
    },
    {
        "id": "btcore5k_3ply_133_13",
        "tier": 4,
        "xgid": "XGID=-cBDCBC--A-----------bbce-:0:0:1:13:0:0:0:0:8",
        "dice": [
            1,
            3
        ],
        "playedMove": "6/2",
        "optimalMove": "9/5",
        "acceptableMoves": [],
        "quizChoices": [
            "9/5",
            "6/2",
            "9/6 3/2",
            "9/6 4/3"
        ],
        "equityLoss": 0.05,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 6/2 (Money Game), vous concédez -0.050 EMG face à la ligne 3-ply 9/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-3 en Money Game : 9/5 surpasse 6/2 de +0.050 EMG (97.2 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 9/5 pour optimiser votre structure en Money Game.",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 9/5 domine 6/2 de +0.050 EMG.",
            "En Money Game, 9/5 maximise votre équité cubeful (+1.327 EMG).",
            "Évitez le piège 6/2 (-0.050 EMG) ; préférez la ligne maîtresse 9/5."
        ]
    },
    {
        "id": "btcore5k_3ply_134_32",
        "tier": 2,
        "xgid": "XGID=-a----E-Da--eD---c-e---AA-:0:0:1:32:1:1:0:3:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "24/22 23/20",
        "optimalMove": "24/21 23/21",
        "acceptableMoves": [],
        "quizChoices": [
            "24/21 23/21",
            "24/22 23/20",
            "23/18",
            "24/21 13/11"
        ],
        "equityLoss": 0.157,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 24/22 23/20 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.157 EMG face à la ligne 3-ply 24/21 23/21.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-2 en Match en 3 pts (1-1, Videau à 1) : 24/21 23/21 surpasse 24/22 23/20 de +0.157 EMG (50.1 % de gain).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Analysez le coup commençant par 24/21 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/21 23/21 domine 24/22 23/20 de +0.157 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 24/21 23/21 maximise votre équité cubeful (+0.003 EMG).",
            "Évitez le piège 24/22 23/20 (-0.157 EMG) ; préférez la ligne maîtresse 24/21 23/21."
        ]
    },
    {
        "id": "btcore5k_3ply_135_54",
        "tier": 3,
        "xgid": "XGID=-a----E-D---fD---c-d-B-a--:0:0:1:54:1:1:0:3:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "21/16 13/9",
        "optimalMove": "13/9 13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "13/9 13/8",
            "21/16 13/9",
            "13/9 6/1*",
            "13/4"
        ],
        "equityLoss": 0.08,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 21/16 13/9 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.080 EMG face à la ligne 3-ply 13/9 13/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-4 en Match en 3 pts (1-1, Videau à 1) : 13/9 13/8 surpasse 21/16 13/9 de +0.080 EMG (51.5 % de gain).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Analysez le coup commençant par 13/9 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/9 13/8 domine 21/16 13/9 de +0.080 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 13/9 13/8 maximise votre équité cubeful (+0.085 EMG).",
            "Évitez le piège 21/16 13/9 (-0.080 EMG) ; préférez la ligne maîtresse 13/9 13/8."
        ]
    },
    {
        "id": "btcore5k_3ply_136_52",
        "tier": 2,
        "xgid": "XGID=-a----E-EA--eB---c-d-B-b--:0:0:1:52:1:1:0:3:8",
        "dice": [
            5,
            2
        ],
        "playedMove": "9/7 6/1*",
        "optimalMove": "9/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "9/4 6/4",
            "9/7 6/1*",
            "13/11 13/8",
            "8/1*"
        ],
        "equityLoss": 0.407,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 9/7 6/1* (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.407 EMG face à la ligne 3-ply 9/4 6/4.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-2 en Match en 3 pts (1-1, Videau à 1) : 9/4 6/4 surpasse 9/7 6/1* de +0.407 EMG (51.7 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 9/4 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 9/4 6/4 domine 9/7 6/1* de +0.407 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 9/4 6/4 maximise votre équité cubeful (+0.093 EMG).",
            "Évitez le piège 9/7 6/1* (-0.407 EMG) ; préférez la ligne maîtresse 9/4 6/4."
        ]
    },
    {
        "id": "btcore5k_3ply_137_32",
        "tier": 4,
        "xgid": "XGID=-a--B-D-E---eB---b-cbB-b--:0:0:1:32:1:1:0:3:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "6/1*",
        "optimalMove": "13/11 13/10",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11 13/10",
            "6/1*",
            "8/5 6/4",
            "8/3"
        ],
        "equityLoss": 0.058,
        "verdict": "doubtful",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 6/1* (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.058 EMG face à la ligne 3-ply 13/11 13/10.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-2 en Match en 3 pts (1-1, Videau à 1) : 13/11 13/10 surpasse 6/1* de +0.058 EMG (45.0 % de gain).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Analysez le coup commençant par 13/11 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/11 13/10 domine 6/1* de +0.058 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 13/11 13/10 maximise votre équité cubeful (-0.283 EMG).",
            "Évitez le piège 6/1* (-0.058 EMG) ; préférez la ligne maîtresse 13/11 13/10."
        ]
    },
    {
        "id": "btcore5k_3ply_138_61",
        "tier": 2,
        "xgid": "XGID=----BaD-E-AAe----b-bcB-b--:0:0:1:61:1:1:0:3:8",
        "dice": [
            6,
            1
        ],
        "playedMove": "11/5*/4",
        "optimalMove": "11/5* 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "11/5* 6/5",
            "11/5*/4",
            "11/10 8/2",
            "10/4 6/5*"
        ],
        "equityLoss": 0.481,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 11/5*/4 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.481 EMG face à la ligne 3-ply 11/5* 6/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-1 en Match en 3 pts (1-1, Videau à 1) : 11/5* 6/5 surpasse 11/5*/4 de +0.481 EMG (61.9 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 11/5* pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 11/5* 6/5 domine 11/5*/4 de +0.481 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 11/5* 6/5 maximise votre équité cubeful (+0.523 EMG).",
            "Évitez le piège 11/5*/4 (-0.481 EMG) ; préférez la ligne maîtresse 11/5* 6/5."
        ]
    },
    {
        "id": "btcore5k_3ply_139_21",
        "tier": 2,
        "xgid": "XGID=---aBBC-E-A-b--c-b-bcB-b--:0:0:1:21:1:1:0:3:8",
        "dice": [
            2,
            1
        ],
        "playedMove": "8/5",
        "optimalMove": "6/3*",
        "acceptableMoves": [],
        "quizChoices": [
            "6/3*",
            "8/5",
            "8/7 8/6",
            "8/7 6/4"
        ],
        "equityLoss": 0.187,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 8/5 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.187 EMG face à la ligne 3-ply 6/3*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-1 en Match en 3 pts (1-1, Videau à 1) : 6/3* surpasse 8/5 de +0.187 EMG (48.4 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 6/3* pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 6/3* domine 8/5 de +0.187 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 6/3* maximise votre équité cubeful (-0.090 EMG).",
            "Évitez le piège 8/5 (-0.187 EMG) ; préférez la ligne maîtresse 6/3*."
        ]
    },
    {
        "id": "btcore5k_3ply_140_34",
        "tier": 4,
        "xgid": "XGID=----BCB-Fa--b--c-b-bbB-c--:0:0:1:34:1:1:0:3:8",
        "dice": [
            3,
            4
        ],
        "playedMove": "8/1",
        "optimalMove": "8/5 8/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5 8/4",
            "8/1",
            "8/4 5/2",
            "5/1 4/1"
        ],
        "equityLoss": 0.038,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 8/1 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.038 EMG face à la ligne 3-ply 8/5 8/4.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-4 en Match en 3 pts (1-1, Videau à 1) : 8/5 8/4 surpasse 8/1 de +0.038 EMG (37.0 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/5 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/5 8/4 domine 8/1 de +0.038 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 8/5 8/4 maximise votre équité cubeful (-0.731 EMG).",
            "Évitez le piège 8/1 (-0.038 EMG) ; préférez la ligne maîtresse 8/5 8/4."
        ]
    },
    {
        "id": "btcore5k_3ply_141_36",
        "tier": 3,
        "xgid": "XGID=----CDB-D---b--c-c-bbB-c--:0:0:1:36:1:1:0:3:8",
        "dice": [
            3,
            6
        ],
        "playedMove": "8/2 6/3",
        "optimalMove": "8/5 8/2",
        "acceptableMoves": [
            "8/2 5/2"
        ],
        "quizChoices": [
            "8/5 8/2",
            "8/2 6/3",
            "8/2 5/2",
            "8/2 4/1"
        ],
        "equityLoss": 0.092,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 8/2 6/3 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.092 EMG face à la ligne 3-ply 8/5 8/2.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-6 en Match en 3 pts (1-1, Videau à 1) : 8/5 8/2 surpasse 8/2 6/3 de +0.092 EMG (37.2 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/5 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/5 8/2 domine 8/2 6/3 de +0.092 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 8/5 8/2 maximise votre équité cubeful (-0.723 EMG).",
            "Évitez le piège 8/2 6/3 (-0.092 EMG) ; préférez la ligne maîtresse 8/5 8/2."
        ]
    },
    {
        "id": "btcore5k_3ply_142_12",
        "tier": 2,
        "xgid": "XGID=-CDBBBa----------B-db-aeb-:0:0:1:12:1:1:0:3:8",
        "dice": [
            1,
            2
        ],
        "playedMove": "17/16 5/3",
        "optimalMove": "17/16 17/15",
        "acceptableMoves": [
            "17/14"
        ],
        "quizChoices": [
            "17/16 17/15",
            "17/16 5/3",
            "17/14",
            "17/15 2/1"
        ],
        "equityLoss": 0.247,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 17/16 5/3 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.247 EMG face à la ligne 3-ply 17/16 17/15.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-2 en Match en 3 pts (1-1, Videau à 1) : 17/16 17/15 surpasse 17/16 5/3 de +0.247 EMG (48.3 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 17/16 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 17/16 17/15 domine 17/16 5/3 de +0.247 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 17/16 17/15 maximise votre équité cubeful (-0.097 EMG).",
            "Évitez le piège 17/16 5/3 (-0.247 EMG) ; préférez la ligne maîtresse 17/16 17/15."
        ]
    },
    {
        "id": "btcore5k_3ply_143_41",
        "tier": 2,
        "xgid": "XGID=-CDBBB----a----AA--cb-aec-:0:0:1:41:1:1:0:3:8",
        "dice": [
            4,
            1
        ],
        "playedMove": "16/15 5/1",
        "optimalMove": "15/10*",
        "acceptableMoves": [],
        "quizChoices": [
            "15/10*",
            "16/15 5/1",
            "16/11",
            "15/11 2/1"
        ],
        "equityLoss": 1.579,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 16/15 5/1 (Match en 3 pts (1-1, Videau à 1)), vous concédez -1.579 EMG face à la ligne 3-ply 15/10*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-1 en Match en 3 pts (1-1, Videau à 1) : 15/10* surpasse 16/15 5/1 de +1.579 EMG (78.3 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 15/10* pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 15/10* domine 16/15 5/1 de +1.579 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 15/10* maximise votre équité cubeful (+0.579 EMG).",
            "Évitez le piège 16/15 5/1 (-1.579 EMG) ; préférez la ligne maîtresse 15/10*."
        ]
    },
    {
        "id": "btcore5k_3ply_144_23",
        "tier": 4,
        "xgid": "XGID=aCDBBB----A-----A--cb-aec-:0:0:1:23:1:1:0:3:8",
        "dice": [
            2,
            3
        ],
        "playedMove": "16/13 10/8",
        "optimalMove": "10/5",
        "acceptableMoves": [],
        "quizChoices": [
            "10/5",
            "16/13 10/8",
            "16/14 10/7",
            "16/11"
        ],
        "equityLoss": 0.047,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 16/13 10/8 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.047 EMG face à la ligne 3-ply 10/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-3 en Match en 3 pts (1-1, Videau à 1) : 10/5 surpasse 16/13 10/8 de +0.047 EMG (83.0 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 10/5 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 10/5 domine 16/13 10/8 de +0.047 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 10/5 maximise votre équité cubeful (+0.937 EMG).",
            "Évitez le piège 16/13 10/8 (-0.047 EMG) ; préférez la ligne maîtresse 10/5."
        ]
    },
    {
        "id": "btcore5k_3ply_145_34",
        "tier": 2,
        "xgid": "XGID=-b----E-C--AdD---cAe---aA-:0:0:1:34:1:1:0:3:8",
        "dice": [
            3,
            4
        ],
        "playedMove": "18/15 13/9",
        "optimalMove": "18/11",
        "acceptableMoves": [],
        "quizChoices": [
            "18/11",
            "18/15 13/9",
            "18/14 13/10",
            "24/20 18/15"
        ],
        "equityLoss": 0.179,
        "verdict": "howler",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 18/15 13/9 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.179 EMG face à la ligne 3-ply 18/11.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-4 en Match en 3 pts (1-1, Videau à 1) : 18/11 surpasse 18/15 13/9 de +0.179 EMG (55.6 % de gain).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Analysez le coup commençant par 18/11 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 18/11 domine 18/15 13/9 de +0.179 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 18/11 maximise votre équité cubeful (+0.314 EMG).",
            "Évitez le piège 18/15 13/9 (-0.179 EMG) ; préférez la ligne maîtresse 18/11."
        ]
    },
    {
        "id": "btcore5k_3ply_146_56",
        "tier": 2,
        "xgid": "XGID=-b----E-C--BcD---d-d---bA-:0:0:1:56:1:1:0:3:8",
        "dice": [
            5,
            6
        ],
        "playedMove": "24/18 13/8",
        "optimalMove": "24/13",
        "acceptableMoves": [],
        "quizChoices": [
            "24/13",
            "24/18 13/8",
            "13/8 13/7",
            "13/2"
        ],
        "equityLoss": 0.162,
        "verdict": "howler",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 24/18 13/8 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.162 EMG face à la ligne 3-ply 24/13.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-6 en Match en 3 pts (1-1, Videau à 1) : 24/13 surpasse 24/18 13/8 de +0.162 EMG (58.3 % de gain).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Analysez le coup commençant par 24/13 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/13 domine 24/18 13/8 de +0.162 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 24/13 maximise votre équité cubeful (+0.134 EMG).",
            "Évitez le piège 24/18 13/8 (-0.162 EMG) ; préférez la ligne maîtresse 24/13."
        ]
    },
    {
        "id": "btcore5k_3ply_147_13",
        "tier": 2,
        "xgid": "XGID=-b----E-C--BcE---b-e--ab--:0:0:1:13:1:1:0:3:8",
        "dice": [
            1,
            3
        ],
        "playedMove": "13/10 11/10",
        "optimalMove": "8/5 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5 6/5",
            "13/10 11/10",
            "13/9",
            "11/10 11/8"
        ],
        "equityLoss": 0.248,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/10 11/10 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.248 EMG face à la ligne 3-ply 8/5 6/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-3 en Match en 3 pts (1-1, Videau à 1) : 8/5 6/5 surpasse 13/10 11/10 de +0.248 EMG (66.1 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/5 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/5 6/5 domine 13/10 11/10 de +0.248 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 8/5 6/5 maximise votre équité cubeful (+0.875 EMG).",
            "Évitez le piège 13/10 11/10 (-0.248 EMG) ; préférez la ligne maîtresse 8/5 6/5."
        ]
    },
    {
        "id": "btcore5k_3ply_148_14",
        "tier": 3,
        "xgid": "XGID=-b---BD-B--BbEa--b-d--bb--:0:0:1:14:1:1:0:3:8",
        "dice": [
            1,
            4
        ],
        "playedMove": "13/9 6/5",
        "optimalMove": "13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "13/8",
            "13/9 6/5",
            "11/7 8/7",
            "11/6"
        ],
        "equityLoss": 0.105,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/9 6/5 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.105 EMG face à la ligne 3-ply 13/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-4 en Match en 3 pts (1-1, Videau à 1) : 13/8 surpasse 13/9 6/5 de +0.105 EMG (66.8 % de gain).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Analysez le coup commençant par 13/8 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/8 domine 13/9 6/5 de +0.105 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 13/8 maximise votre équité cubeful (+0.901 EMG).",
            "Évitez le piège 13/9 6/5 (-0.105 EMG) ; préférez la ligne maîtresse 13/8."
        ]
    },
    {
        "id": "btcore5k_3ply_149_33",
        "tier": 4,
        "xgid": "XGID=-b---BD-C--BbD---b-cb-bb--:0:0:1:33:1:1:0:3:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "13/10(2) 6/3(2)",
        "optimalMove": "13/7(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7(2)",
            "13/10(2) 6/3(2)",
            "13/10(4)",
            "13/10 8/5 6/3(2)"
        ],
        "equityLoss": 0.046,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/10(2) 6/3(2) (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.046 EMG face à la ligne 3-ply 13/7(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-3 en Match en 3 pts (1-1, Videau à 1) : 13/7(2) surpasse 13/10(2) 6/3(2) de +0.046 EMG (76.4 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/7(2) pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/7(2) domine 13/10(2) 6/3(2) de +0.046 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 13/7(2) maximise votre équité cubeful (+0.994 EMG).",
            "Évitez le piège 13/10(2) 6/3(2) (-0.046 EMG) ; préférez la ligne maîtresse 13/7(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_150_36",
        "tier": 3,
        "xgid": "XGID=-b---BDBC--BbB---b-bb-cb--:0:0:1:36:1:1:0:3:8",
        "dice": [
            3,
            6
        ],
        "playedMove": "13/10 13/7",
        "optimalMove": "11/8 11/5",
        "acceptableMoves": [
            "11/5 8/5"
        ],
        "quizChoices": [
            "11/8 11/5",
            "13/10 13/7",
            "11/5 8/5",
            "13/7 8/5"
        ],
        "equityLoss": 0.067,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/10 13/7 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.067 EMG face à la ligne 3-ply 11/8 11/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-6 en Match en 3 pts (1-1, Videau à 1) : 11/8 11/5 surpasse 13/10 13/7 de +0.067 EMG (80.0 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 11/8 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 11/8 11/5 domine 13/10 13/7 de +0.067 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 11/8 11/5 maximise votre équité cubeful (+1.000 EMG).",
            "Évitez le piège 13/10 13/7 (-0.067 EMG) ; préférez la ligne maîtresse 11/8 11/5."
        ]
    },
    {
        "id": "btcore5k_3ply_151_26",
        "tier": 2,
        "xgid": "XGID=-b---DDBB--AbB-----bcacb--:0:0:1:26:1:1:0:3:8",
        "dice": [
            2,
            6
        ],
        "playedMove": "11/3",
        "optimalMove": "13/11 13/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11 13/7",
            "11/3",
            "13/5",
            "13/7 11/9"
        ],
        "equityLoss": 0.22,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 11/3 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.220 EMG face à la ligne 3-ply 13/11 13/7.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-6 en Match en 3 pts (1-1, Videau à 1) : 13/11 13/7 surpasse 11/3 de +0.220 EMG (79.1 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/11 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/11 13/7 domine 11/3 de +0.220 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 13/11 13/7 maximise votre équité cubeful (+0.720 EMG).",
            "Évitez le piège 11/3 (-0.220 EMG) ; préférez la ligne maîtresse 13/11 13/7."
        ]
    },
    {
        "id": "btcore5k_3ply_152_23",
        "tier": 2,
        "xgid": "XGID=-bD--EDB-----------bbbbcb-:0:0:1:23:1:1:0:3:8",
        "dice": [
            2,
            3
        ],
        "playedMove": "7/4 6/4",
        "optimalMove": "6/3 5/3",
        "acceptableMoves": [],
        "quizChoices": [
            "6/3 5/3",
            "7/4 6/4",
            "5/3 5/2",
            "7/5 7/4"
        ],
        "equityLoss": 0.493,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 7/4 6/4 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.493 EMG face à la ligne 3-ply 6/3 5/3.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-3 en Match en 3 pts (1-1, Videau à 1) : 6/3 5/3 surpasse 7/4 6/4 de +0.493 EMG (83.3 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 6/3 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 6/3 5/3 domine 7/4 6/4 de +0.493 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 6/3 5/3 maximise votre équité cubeful (+0.767 EMG).",
            "Évitez le piège 7/4 6/4 (-0.493 EMG) ; préférez la ligne maîtresse 6/3 5/3."
        ]
    },
    {
        "id": "btcore5k_3ply_153_34",
        "tier": 2,
        "xgid": "XGID=-ADCbDC--------------cdcc-:0:0:1:34:1:1:0:3:8",
        "dice": [
            3,
            4
        ],
        "playedMove": "6/3 6/2",
        "optimalMove": "5/1 3/off",
        "acceptableMoves": [
            "6/2 3/off",
            "6/3 5/1",
            "6/2 5/2",
            "5/2 5/1"
        ],
        "quizChoices": [
            "5/1 3/off",
            "6/3 6/2",
            "6/2 3/off",
            "6/3 5/1"
        ],
        "equityLoss": 0.344,
        "verdict": "howler",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 6/3 6/2 (Match en 3 pts (1-1, Videau à 1)), vous concédez -0.344 EMG face à la ligne 3-ply 5/1 3/off.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-4 en Match en 3 pts (1-1, Videau à 1) : 5/1 3/off surpasse 6/3 6/2 de +0.344 EMG (95.6 % de gain).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Analysez le coup commençant par 5/1 pour optimiser votre structure en Match en 3 pts (1-1, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 5/1 3/off domine 6/3 6/2 de +0.344 EMG.",
            "En Match en 3 pts (1-1, Videau à 1), 5/1 3/off maximise votre équité cubeful (+1.008 EMG).",
            "Évitez le piège 6/3 6/2 (-0.344 EMG) ; préférez la ligne maîtresse 5/1 3/off."
        ]
    },
    {
        "id": "btcore5k_3ply_154_12",
        "tier": 3,
        "xgid": "XGID=-b----E-C---cEA-ad-e----A-:0:0:1:12:0:0:0:5:8",
        "dice": [
            1,
            2
        ],
        "playedMove": "13/11 6/5",
        "optimalMove": "14/11",
        "acceptableMoves": [],
        "quizChoices": [
            "14/11",
            "13/11 6/5",
            "13/10",
            "24/23 13/11"
        ],
        "equityLoss": 0.07,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/11 6/5 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.070 EMG face à la ligne 3-ply 14/11.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-2 en Match en 5 pts (0-0, Videau à 1) : 14/11 surpasse 13/11 6/5 de +0.070 EMG (50.3 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 14/11 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 14/11 domine 13/11 6/5 de +0.070 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 14/11 maximise votre équité cubeful (-0.030 EMG).",
            "Évitez le piège 13/11 6/5 (-0.070 EMG) ; préférez la ligne maîtresse 14/11."
        ]
    },
    {
        "id": "btcore5k_3ply_155_65",
        "tier": 2,
        "xgid": "XGID=-b----E-C---bF---dbe--A---:0:0:1:65:0:0:0:5:8",
        "dice": [
            6,
            5
        ],
        "playedMove": "22/16 13/8",
        "optimalMove": "22/11",
        "acceptableMoves": [],
        "quizChoices": [
            "22/11",
            "22/16 13/8",
            "13/8 13/7",
            "22/16 8/3"
        ],
        "equityLoss": 0.212,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 22/16 13/8 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.212 EMG face à la ligne 3-ply 22/11.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-5 en Match en 5 pts (0-0, Videau à 1) : 22/11 surpasse 22/16 13/8 de +0.212 EMG (58.4 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 22/11 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 22/11 domine 22/16 13/8 de +0.212 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 22/11 maximise votre équité cubeful (+0.245 EMG).",
            "Évitez le piège 22/16 13/8 (-0.212 EMG) ; préférez la ligne maîtresse 22/11."
        ]
    },
    {
        "id": "btcore5k_3ply_156_62",
        "tier": 2,
        "xgid": "XGID=-b----E-C--AbF---bbc--b-b-:0:0:1:62:0:0:0:5:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "13/5",
        "optimalMove": "13/11 13/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11 13/7",
            "13/5",
            "13/11 8/2",
            "11/3"
        ],
        "equityLoss": 0.176,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/5 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.176 EMG face à la ligne 3-ply 13/11 13/7.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-2 en Match en 5 pts (0-0, Videau à 1) : 13/11 13/7 surpasse 13/5 de +0.176 EMG (46.5 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/11 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/11 13/7 domine 13/5 de +0.176 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 13/11 13/7 maximise votre équité cubeful (-0.220 EMG).",
            "Évitez le piège 13/5 (-0.176 EMG) ; préférez la ligne maîtresse 13/11 13/7."
        ]
    },
    {
        "id": "btcore5k_3ply_157_13",
        "tier": 2,
        "xgid": "XGID=-bA---E-B--B-Ea--cbc--b-b-:0:0:1:13:0:0:0:5:8",
        "dice": [
            1,
            3
        ],
        "playedMove": "8/5 6/5",
        "optimalMove": "6/2",
        "acceptableMoves": [],
        "quizChoices": [
            "6/2",
            "8/5 6/5",
            "13/10 11/10",
            "13/9"
        ],
        "equityLoss": 0.298,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 8/5 6/5 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.298 EMG face à la ligne 3-ply 6/2.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-3 en Match en 5 pts (0-0, Videau à 1) : 6/2 surpasse 8/5 6/5 de +0.298 EMG (51.9 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 6/2 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 6/2 domine 8/5 6/5 de +0.298 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 6/2 maximise votre équité cubeful (+0.018 EMG).",
            "Évitez le piège 8/5 6/5 (-0.298 EMG) ; préférez la ligne maîtresse 6/2."
        ]
    },
    {
        "id": "btcore5k_3ply_158_14",
        "tier": 4,
        "xgid": "XGID=-bB---D-B--B-E---bbd-ab-b-:0:0:1:14:0:0:0:5:8",
        "dice": [
            1,
            4
        ],
        "playedMove": "11/7 8/7",
        "optimalMove": "13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "13/8",
            "11/7 8/7",
            "13/12 13/9",
            "13/12 6/2"
        ],
        "equityLoss": 0.039,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 11/7 8/7 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.039 EMG face à la ligne 3-ply 13/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-4 en Match en 5 pts (0-0, Videau à 1) : 13/8 surpasse 11/7 8/7 de +0.039 EMG (53.5 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/8 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/8 domine 11/7 8/7 de +0.039 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 13/8 maximise votre équité cubeful (+0.090 EMG).",
            "Évitez le piège 11/7 8/7 (-0.039 EMG) ; préférez la ligne maîtresse 13/8."
        ]
    },
    {
        "id": "btcore5k_3ply_159_25",
        "tier": 4,
        "xgid": "XGID=-bB---D-C--B-D---bbb-bb-c-:0:0:1:25:0:0:0:5:8",
        "dice": [
            2,
            5
        ],
        "playedMove": "13/6",
        "optimalMove": "13/11 13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11 13/8",
            "13/6",
            "11/9 11/6",
            "11/6 8/6"
        ],
        "equityLoss": 0.059,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/6 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.059 EMG face à la ligne 3-ply 13/11 13/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-5 en Match en 5 pts (0-0, Videau à 1) : 13/11 13/8 surpasse 13/6 de +0.059 EMG (55.2 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/11 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/11 13/8 domine 13/6 de +0.059 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 13/11 13/8 maximise votre équité cubeful (+0.165 EMG).",
            "Évitez le piège 13/6 (-0.059 EMG) ; préférez la ligne maîtresse 13/11 13/8."
        ]
    },
    {
        "id": "btcore5k_3ply_160_34",
        "tier": 3,
        "xgid": "XGID=-bB---E-C--B-C----bc-bbac-:0:0:1:34:0:0:0:5:8",
        "dice": [
            3,
            4
        ],
        "playedMove": "11/8 6/2",
        "optimalMove": "13/6",
        "acceptableMoves": [],
        "quizChoices": [
            "13/6",
            "11/8 6/2",
            "13/10 6/2",
            "13/9 11/8"
        ],
        "equityLoss": 0.095,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 11/8 6/2 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.095 EMG face à la ligne 3-ply 13/6.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-4 en Match en 5 pts (0-0, Videau à 1) : 13/6 surpasse 11/8 6/2 de +0.095 EMG (51.7 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/6 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/6 domine 11/8 6/2 de +0.095 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 13/6 maximise votre équité cubeful (+0.041 EMG).",
            "Évitez le piège 11/8 6/2 (-0.095 EMG) ; préférez la ligne maîtresse 13/6."
        ]
    },
    {
        "id": "btcore5k_3ply_161_41",
        "tier": 2,
        "xgid": "XGID=-bB---F-C--B-B----bb-bbbc-:0:0:1:41:0:0:0:5:8",
        "dice": [
            4,
            1
        ],
        "playedMove": "13/8",
        "optimalMove": "11/7 8/7",
        "acceptableMoves": [],
        "quizChoices": [
            "11/7 8/7",
            "13/8",
            "11/6",
            "13/12 6/2"
        ],
        "equityLoss": 0.193,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/8 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.193 EMG face à la ligne 3-ply 11/7 8/7.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-1 en Match en 5 pts (0-0, Videau à 1) : 11/7 8/7 surpasse 13/8 de +0.193 EMG (53.9 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 11/7 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 11/7 8/7 domine 13/8 de +0.193 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 11/7 8/7 maximise votre équité cubeful (+0.105 EMG).",
            "Évitez le piège 13/8 (-0.193 EMG) ; préférez la ligne maîtresse 11/7 8/7."
        ]
    },
    {
        "id": "btcore5k_3ply_162_64",
        "tier": 4,
        "xgid": "XGID=-bB---FBB--A-B----b--ccbc-:0:0:1:64:0:0:0:5:8",
        "dice": [
            6,
            4
        ],
        "playedMove": "13/9 13/7",
        "optimalMove": "13/7 11/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7 11/7",
            "13/9 13/7",
            "13/7 6/2",
            "11/7 8/2"
        ],
        "equityLoss": 0.046,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/9 13/7 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.046 EMG face à la ligne 3-ply 13/7 11/7.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-4 en Match en 5 pts (0-0, Videau à 1) : 13/7 11/7 surpasse 13/9 13/7 de +0.046 EMG (61.8 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/7 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/7 11/7 domine 13/9 13/7 de +0.046 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 13/7 11/7 maximise votre équité cubeful (+0.379 EMG).",
            "Évitez le piège 13/9 13/7 (-0.046 EMG) ; préférez la ligne maîtresse 13/7 11/7."
        ]
    },
    {
        "id": "btcore5k_3ply_163_44",
        "tier": 2,
        "xgid": "XGID=--C-aaECB--A-A----b--ccbc-:0:0:1:44:0:0:0:5:8",
        "dice": [
            4,
            4
        ],
        "playedMove": "8/4*(2) 7/3(2)",
        "optimalMove": "13/5* 8/4*(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/5* 8/4*(2)",
            "8/4*(2) 7/3(2)",
            "11/7 8/4*(2) 6/2",
            "13/9 11/7 8/4*(2)"
        ],
        "equityLoss": 0.149,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 8/4*(2) 7/3(2) (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.149 EMG face à la ligne 3-ply 13/5* 8/4*(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-4 en Match en 5 pts (0-0, Videau à 1) : 13/5* 8/4*(2) surpasse 8/4*(2) 7/3(2) de +0.149 EMG (76.5 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/5* pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/5* 8/4*(2) domine 8/4*(2) 7/3(2) de +0.149 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 13/5* 8/4*(2) maximise votre équité cubeful (+0.772 EMG).",
            "Évitez le piège 8/4*(2) 7/3(2) (-0.149 EMG) ; préférez la ligne maîtresse 13/5* 8/4*(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_164_23",
        "tier": 3,
        "xgid": "XGID=--DaB-DD-a---A----b--ccbc-:0:0:1:23:0:0:0:5:8",
        "dice": [
            2,
            3
        ],
        "playedMove": "6/4 6/3*",
        "optimalMove": "6/3*/1",
        "acceptableMoves": [],
        "quizChoices": [
            "6/3*/1",
            "6/4 6/3*",
            "13/11 6/3*",
            "13/10 6/4"
        ],
        "equityLoss": 0.083,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 6/4 6/3* (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.083 EMG face à la ligne 3-ply 6/3*/1.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-3 en Match en 5 pts (0-0, Videau à 1) : 6/3*/1 surpasse 6/4 6/3* de +0.083 EMG (54.8 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 6/3*/1 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 6/3*/1 domine 6/4 6/3* de +0.083 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 6/3*/1 maximise votre équité cubeful (+0.127 EMG).",
            "Évitez le piège 6/4 6/3* (-0.083 EMG) ; préférez la ligne maîtresse 6/3*/1."
        ]
    },
    {
        "id": "btcore5k_3ply_165_24",
        "tier": 2,
        "xgid": "XGID=--D-D-CC-b---A----b--bdbc-:0:0:1:24:0:0:0:5:8",
        "dice": [
            2,
            4
        ],
        "playedMove": "13/11 7/3",
        "optimalMove": "13/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7",
            "13/11 7/3",
            "7/5 7/3",
            "7/1"
        ],
        "equityLoss": 0.315,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/11 7/3 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.315 EMG face à la ligne 3-ply 13/7.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-4 en Match en 5 pts (0-0, Videau à 1) : 13/7 surpasse 13/11 7/3 de +0.315 EMG (53.7 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 13/7 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/7 domine 13/11 7/3 de +0.315 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 13/7 maximise votre équité cubeful (+0.102 EMG).",
            "Évitez le piège 13/11 7/3 (-0.315 EMG) ; préférez la ligne maîtresse 13/7."
        ]
    },
    {
        "id": "btcore5k_3ply_166_62",
        "tier": 2,
        "xgid": "XGID=-b----E-D---dD-a-b-dA--bA-:0:0:1:62:0:0:0:5:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "20/14 13/11",
        "optimalMove": "24/18 20/18",
        "acceptableMoves": [],
        "quizChoices": [
            "24/18 20/18",
            "20/14 13/11",
            "24/22 20/14",
            "20/14 8/6"
        ],
        "equityLoss": 0.228,
        "verdict": "howler",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 20/14 13/11 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.228 EMG face à la ligne 3-ply 24/18 20/18.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-2 en Match en 5 pts (0-0, Videau à 1) : 24/18 20/18 surpasse 20/14 13/11 de +0.228 EMG (53.6 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 24/18 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/18 20/18 domine 20/14 13/11 de +0.228 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 24/18 20/18 maximise votre équité cubeful (+0.106 EMG).",
            "Évitez le piège 20/14 13/11 (-0.228 EMG) ; préférez la ligne maîtresse 24/18 20/18."
        ]
    },
    {
        "id": "btcore5k_3ply_167_55",
        "tier": 3,
        "xgid": "XGID=-b----E-D---cD---cBd-a-b--:0:0:1:55:0:0:0:5:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "18/8(2)",
        "optimalMove": "13/3(2)",
        "acceptableMoves": [
            "18/13(2) 8/3(2)"
        ],
        "quizChoices": [
            "13/3(2)",
            "18/8(2)",
            "18/13(2) 8/3(2)",
            "13/3 8/3(2)"
        ],
        "equityLoss": 0.06,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 18/8(2) (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.060 EMG face à la ligne 3-ply 13/3(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-5 en Match en 5 pts (0-0, Videau à 1) : 13/3(2) surpasse 18/8(2) de +0.060 EMG (57.9 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/3(2) pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/3(2) domine 18/8(2) de +0.060 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 13/3(2) maximise votre équité cubeful (+0.287 EMG).",
            "Évitez le piège 18/8(2) (-0.060 EMG) ; préférez la ligne maîtresse 13/3(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_168_25",
        "tier": 3,
        "xgid": "XGID=-b-B--E-D---cB---bBc-b-c--:0:0:1:25:0:0:0:5:8",
        "dice": [
            2,
            5
        ],
        "playedMove": "18/16 18/13",
        "optimalMove": "13/11 13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11 13/8",
            "18/16 18/13",
            "8/6 8/3",
            "8/3 6/4"
        ],
        "equityLoss": 0.073,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 18/16 18/13 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.073 EMG face à la ligne 3-ply 13/11 13/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-5 en Match en 5 pts (0-0, Videau à 1) : 13/11 13/8 surpasse 18/16 18/13 de +0.073 EMG (56.8 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/11 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/11 13/8 domine 18/16 18/13 de +0.073 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 13/11 13/8 maximise votre équité cubeful (+0.259 EMG).",
            "Évitez le piège 18/16 18/13 (-0.073 EMG) ; préférez la ligne maîtresse 13/11 13/8."
        ]
    },
    {
        "id": "btcore5k_3ply_169_45",
        "tier": 2,
        "xgid": "XGID=-b-C--F-B---cB---bBb-abc--:0:0:1:45:0:0:0:5:8",
        "dice": [
            4,
            5
        ],
        "playedMove": "13/8 6/2",
        "optimalMove": "13/9 13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "13/9 13/8",
            "13/8 6/2",
            "18/14 18/13",
            "18/9"
        ],
        "equityLoss": 0.174,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/8 6/2 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.174 EMG face à la ligne 3-ply 13/9 13/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-5 en Match en 5 pts (0-0, Videau à 1) : 13/9 13/8 surpasse 13/8 6/2 de +0.174 EMG (57.4 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/9 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/9 13/8 domine 13/8 6/2 de +0.174 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 13/9 13/8 maximise votre équité cubeful (+0.280 EMG).",
            "Évitez le piège 13/8 6/2 (-0.174 EMG) ; préférez la ligne maîtresse 13/9 13/8."
        ]
    },
    {
        "id": "btcore5k_3ply_170_52",
        "tier": 2,
        "xgid": "XGID=-b-C--F-CA--b----cBb-abc--:0:0:1:52:0:0:0:5:8",
        "dice": [
            5,
            2
        ],
        "playedMove": "9/2",
        "optimalMove": "9/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "9/4 6/4",
            "9/2",
            "9/7 8/3",
            "9/4 8/6"
        ],
        "equityLoss": 0.462,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 9/2 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.462 EMG face à la ligne 3-ply 9/4 6/4.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-2 en Match en 5 pts (0-0, Videau à 1) : 9/4 6/4 surpasse 9/2 de +0.462 EMG (67.0 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 9/4 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 9/4 6/4 domine 9/2 de +0.462 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 9/4 6/4 maximise votre équité cubeful (+0.649 EMG).",
            "Évitez le piège 9/2 (-0.462 EMG) ; préférez la ligne maîtresse 9/4 6/4."
        ]
    },
    {
        "id": "btcore5k_3ply_171_62",
        "tier": 2,
        "xgid": "XGID=-b-CB-E-C---b----bBa-bcc--:0:0:1:62:0:0:0:5:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "18/10",
        "optimalMove": "8/2 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/2 6/4",
            "18/10",
            "8/2 4/2",
            "8/6 8/2"
        ],
        "equityLoss": 0.202,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 18/10 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.202 EMG face à la ligne 3-ply 8/2 6/4.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-2 en Match en 5 pts (0-0, Videau à 1) : 8/2 6/4 surpasse 18/10 de +0.202 EMG (67.2 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/2 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/2 6/4 domine 18/10 de +0.202 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 8/2 6/4 maximise votre équité cubeful (+0.682 EMG).",
            "Évitez le piège 18/10 (-0.202 EMG) ; préférez la ligne maîtresse 8/2 6/4."
        ]
    },
    {
        "id": "btcore5k_3ply_172_13",
        "tier": 3,
        "xgid": "XGID=-bACC-D-B---b-----Baaccc--:0:0:1:13:0:0:0:5:8",
        "dice": [
            1,
            3
        ],
        "playedMove": "6/2",
        "optimalMove": "8/5 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5 6/5",
            "6/2",
            "8/5 3/2",
            "18/15 3/2"
        ],
        "equityLoss": 0.085,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 6/2 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.085 EMG face à la ligne 3-ply 8/5 6/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-3 en Match en 5 pts (0-0, Videau à 1) : 8/5 6/5 surpasse 6/2 de +0.085 EMG (81.2 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/5 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/5 6/5 domine 6/2 de +0.085 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 8/5 6/5 maximise votre équité cubeful (+1.005 EMG).",
            "Évitez le piège 6/2 (-0.085 EMG) ; préférez la ligne maîtresse 8/5 6/5."
        ]
    },
    {
        "id": "btcore5k_3ply_173_23",
        "tier": 4,
        "xgid": "XGID=-bBCC-C-B---b-----Ba-ccbb-:0:0:1:23:0:0:0:5:8",
        "dice": [
            2,
            3
        ],
        "playedMove": "6/3 4/2",
        "optimalMove": "8/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3",
            "6/3 4/2",
            "8/6 8/5",
            "8/5 4/2"
        ],
        "equityLoss": 0.043,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 6/3 4/2 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.043 EMG face à la ligne 3-ply 8/3.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-3 en Match en 5 pts (0-0, Videau à 1) : 8/3 surpasse 6/3 4/2 de +0.043 EMG (70.4 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 8/3 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/3 domine 6/3 4/2 de +0.043 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 8/3 maximise votre équité cubeful (+0.874 EMG).",
            "Évitez le piège 6/3 4/2 (-0.043 EMG) ; préférez la ligne maîtresse 8/3."
        ]
    },
    {
        "id": "btcore5k_3ply_174_34",
        "tier": 2,
        "xgid": "XGID=-aCDB-B-B--ab-----Ba-ccbb-:0:0:1:34:0:0:0:5:8",
        "dice": [
            3,
            4
        ],
        "playedMove": "8/1*",
        "optimalMove": "18/11*",
        "acceptableMoves": [],
        "quizChoices": [
            "18/11*",
            "8/1*",
            "8/5 8/4",
            "18/15 18/14"
        ],
        "equityLoss": 0.523,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 8/1* (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.523 EMG face à la ligne 3-ply 18/11*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-4 en Match en 5 pts (0-0, Videau à 1) : 18/11* surpasse 8/1* de +0.523 EMG (78.3 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 18/11* pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 18/11* domine 8/1* de +0.523 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 18/11* maximise votre équité cubeful (+0.998 EMG).",
            "Évitez le piège 8/1* (-0.523 EMG) ; préférez la ligne maîtresse 18/11*."
        ]
    },
    {
        "id": "btcore5k_3ply_175_34",
        "tier": 4,
        "xgid": "XGID=aaCDB-B-B--Ab-----Aa-ccbb-:0:0:1:34:0:0:0:5:8",
        "dice": [
            3,
            4
        ],
        "playedMove": "11/4",
        "optimalMove": "8/1*",
        "acceptableMoves": [
            "18/11"
        ],
        "quizChoices": [
            "8/1*",
            "11/4",
            "18/11",
            "18/14 11/8"
        ],
        "equityLoss": 0.045,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 11/4 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.045 EMG face à la ligne 3-ply 8/1*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-4 en Match en 5 pts (0-0, Videau à 1) : 8/1* surpasse 11/4 de +0.045 EMG (82.0 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 8/1* pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/1* domine 11/4 de +0.045 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 8/1* maximise votre équité cubeful (+1.159 EMG).",
            "Évitez le piège 11/4 (-0.045 EMG) ; préférez la ligne maîtresse 8/1*."
        ]
    },
    {
        "id": "btcore5k_3ply_176_61",
        "tier": 3,
        "xgid": "XGID=aaCDB-B-B--Bb------a-ccbb-:0:0:1:61:0:0:0:5:8",
        "dice": [
            6,
            1
        ],
        "playedMove": "11/4",
        "optimalMove": "8/1*",
        "acceptableMoves": [],
        "quizChoices": [
            "8/1*",
            "11/4",
            "11/5 2/1*",
            "11/10 8/2"
        ],
        "equityLoss": 0.105,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 11/4 (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.105 EMG face à la ligne 3-ply 8/1*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 6-1 en Match en 5 pts (0-0, Videau à 1) : 8/1* surpasse 11/4 de +0.105 EMG (86.0 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 8/1* pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/1* domine 11/4 de +0.105 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 8/1* maximise votre équité cubeful (+1.280 EMG).",
            "Évitez le piège 11/4 (-0.105 EMG) ; préférez la ligne maîtresse 8/1*."
        ]
    },
    {
        "id": "btcore5k_3ply_177_12",
        "tier": 2,
        "xgid": "XGID=aaCDC-B-B--Ab------a-ccbb-:0:0:1:12:0:0:0:5:8",
        "dice": [
            1,
            2
        ],
        "playedMove": "8/7 3/1*",
        "optimalMove": "3/1* 2/1",
        "acceptableMoves": [],
        "quizChoices": [
            "3/1* 2/1",
            "8/7 3/1*",
            "8/6 2/1*",
            "11/10 3/1*"
        ],
        "equityLoss": 0.183,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 8/7 3/1* (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.183 EMG face à la ligne 3-ply 3/1* 2/1.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-2 en Match en 5 pts (0-0, Videau à 1) : 3/1* 2/1 surpasse 8/7 3/1* de +0.183 EMG (95.5 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 3/1* pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 3/1* 2/1 domine 8/7 3/1* de +0.183 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 3/1* 2/1 maximise votre équité cubeful (+1.533 EMG).",
            "Évitez le piège 8/7 3/1* (-0.183 EMG) ; préférez la ligne maîtresse 3/1* 2/1."
        ]
    },
    {
        "id": "btcore5k_3ply_178_33",
        "tier": 3,
        "xgid": "XGID=aaCDC-B-C---b------a-ccbb-:0:0:1:33:0:0:0:5:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "8/5(3) 3/off",
        "optimalMove": "8/5(3) 4/1*",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5(3) 4/1*",
            "8/5(3) 3/off",
            "8/5(2) 4/1*(2)",
            "8/2 8/5(2)"
        ],
        "equityLoss": 0.107,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 8/5(3) 3/off (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.107 EMG face à la ligne 3-ply 8/5(3) 4/1*.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-3 en Match en 5 pts (0-0, Videau à 1) : 8/5(3) 4/1* surpasse 8/5(3) 3/off de +0.107 EMG (93.9 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 8/5(3) pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/5(3) 4/1* domine 8/5(3) 3/off de +0.107 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 8/5(3) 4/1* maximise votre équité cubeful (+1.558 EMG).",
            "Évitez le piège 8/5(3) 3/off (-0.107 EMG) ; préférez la ligne maîtresse 8/5(3) 4/1*."
        ]
    },
    {
        "id": "btcore5k_3ply_179_11",
        "tier": 4,
        "xgid": "XGID=aaDDCBB-----b------a-ccbb-:0:0:1:11:0:0:0:5:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "6/5(2) 2/1*(2)",
        "optimalMove": "3/1* 2/1(2)",
        "acceptableMoves": [
            "4/1* 2/1"
        ],
        "quizChoices": [
            "3/1* 2/1(2)",
            "6/5(2) 2/1*(2)",
            "4/1* 2/1",
            "3/1*(2)"
        ],
        "equityLoss": 0.056,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 6/5(2) 2/1*(2) (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.056 EMG face à la ligne 3-ply 3/1* 2/1(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-1 en Match en 5 pts (0-0, Videau à 1) : 3/1* 2/1(2) surpasse 6/5(2) 2/1*(2) de +0.056 EMG (97.7 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 3/1* pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 3/1* 2/1(2) domine 6/5(2) 2/1*(2) de +0.056 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 3/1* 2/1(2) maximise votre équité cubeful (+1.672 EMG).",
            "Évitez le piège 6/5(2) 2/1*(2) (-0.056 EMG) ; préférez la ligne maîtresse 3/1* 2/1(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_180_31",
        "tier": 3,
        "xgid": "XGID=aaDDEB------b------a-ccbb-:0:0:1:31:0:0:0:5:8",
        "dice": [
            3,
            1
        ],
        "playedMove": "4/1*/off",
        "optimalMove": "4/1* 2/1",
        "acceptableMoves": [],
        "quizChoices": [
            "4/1* 2/1",
            "4/1*/off",
            "3/off 2/1*",
            "4/3 4/1*"
        ],
        "equityLoss": 0.1,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 4/1*/off (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.100 EMG face à la ligne 3-ply 4/1* 2/1.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-1 en Match en 5 pts (0-0, Videau à 1) : 4/1* 2/1 surpasse 4/1*/off de +0.100 EMG (98.2 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 4/1* pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 4/1* 2/1 domine 4/1*/off de +0.100 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 4/1* 2/1 maximise votre équité cubeful (+1.615 EMG).",
            "Évitez le piège 4/1*/off (-0.100 EMG) ; préférez la ligne maîtresse 4/1* 2/1."
        ]
    },
    {
        "id": "btcore5k_3ply_181_33",
        "tier": 2,
        "xgid": "XGID=bADECB------b------a-ccbb-:0:0:1:33:0:0:0:5:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "5/2(2) 4/1 3/off",
        "optimalMove": "4/1 3/off(3)",
        "acceptableMoves": [],
        "quizChoices": [
            "4/1 3/off(3)",
            "5/2(2) 4/1 3/off",
            "4/1(3) 3/off",
            "5/2 4/1 3/off(2)"
        ],
        "equityLoss": 0.127,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 5/2(2) 4/1 3/off (Match en 5 pts (0-0, Videau à 1)), vous concédez -0.127 EMG face à la ligne 3-ply 4/1 3/off(3).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-3 en Match en 5 pts (0-0, Videau à 1) : 4/1 3/off(3) surpasse 5/2(2) 4/1 3/off de +0.127 EMG (98.6 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 4/1 pour optimiser votre structure en Match en 5 pts (0-0, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 4/1 3/off(3) domine 5/2(2) 4/1 3/off de +0.127 EMG.",
            "En Match en 5 pts (0-0, Videau à 1), 4/1 3/off(3) maximise votre équité cubeful (+1.763 EMG).",
            "Évitez le piège 5/2(2) 4/1 3/off (-0.127 EMG) ; préférez la ligne maîtresse 4/1 3/off(3)."
        ]
    },
    {
        "id": "btcore5k_3ply_182_15",
        "tier": 4,
        "xgid": "XGID=-b--B-D-B---dE---c-f----B-:0:0:1:15:3:3:0:7:8",
        "dice": [
            1,
            5
        ],
        "playedMove": "24/18",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "13/8 6/5"
        ],
        "quizChoices": [
            "24/23 13/8",
            "24/18",
            "13/8 6/5",
            "13/7"
        ],
        "equityLoss": 0.046,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/18 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.046 EMG face à la ligne 3-ply 24/23 13/8.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-5 en Match en 7 pts (3-3, Videau à 1) : 24/23 13/8 surpasse 24/18 de +0.046 EMG (56.1 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 24/23 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/23 13/8 domine 24/18 de +0.046 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 24/23 13/8 maximise votre équité cubeful (+0.294 EMG).",
            "Évitez le piège 24/18 (-0.046 EMG) ; préférez la ligne maîtresse 24/23 13/8."
        ]
    },
    {
        "id": "btcore5k_3ply_183_31",
        "tier": 2,
        "xgid": "XGID=-b--B-D-C---bDb--c-d-b-AA-:0:0:1:31:3:3:0:7:8",
        "dice": [
            3,
            1
        ],
        "playedMove": "24/23 13/10",
        "optimalMove": "8/5 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5 6/5",
            "24/23 13/10",
            "23/22 13/10",
            "13/9"
        ],
        "equityLoss": 0.442,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/23 13/10 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.442 EMG face à la ligne 3-ply 8/5 6/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-1 en Match en 7 pts (3-3, Videau à 1) : 8/5 6/5 surpasse 24/23 13/10 de +0.442 EMG (55.6 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/5 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/5 6/5 domine 24/23 13/10 de +0.442 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 8/5 6/5 maximise votre équité cubeful (+0.256 EMG).",
            "Évitez le piège 24/23 13/10 (-0.442 EMG) ; préférez la ligne maîtresse 8/5 6/5."
        ]
    },
    {
        "id": "btcore5k_3ply_184_46",
        "tier": 4,
        "xgid": "XGID=----BbD-C-A-bCb--c-d-b-B--:0:0:1:46:3:3:0:7:8",
        "dice": [
            4,
            6
        ],
        "playedMove": "8/2 6/2",
        "optimalMove": "10/4 6/2",
        "acceptableMoves": [],
        "quizChoices": [
            "10/4 6/2",
            "8/2 6/2",
            "10/6 8/2",
            "10/4 8/4"
        ],
        "equityLoss": 0.037,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 8/2 6/2 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.037 EMG face à la ligne 3-ply 10/4 6/2.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-6 en Match en 7 pts (3-3, Videau à 1) : 10/4 6/2 surpasse 8/2 6/2 de +0.037 EMG (34.9 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 10/4 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 10/4 6/2 domine 8/2 6/2 de +0.037 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 10/4 6/2 maximise votre équité cubeful (-0.673 EMG).",
            "Évitez le piège 8/2 6/2 (-0.037 EMG) ; préférez la ligne maîtresse 10/4 6/2."
        ]
    },
    {
        "id": "btcore5k_3ply_185_56",
        "tier": 4,
        "xgid": "XGID=----DbD-B---bCa--c-cbb-B--:0:0:1:56:3:3:0:7:8",
        "dice": [
            5,
            6
        ],
        "playedMove": "13/7 8/3",
        "optimalMove": "13/2",
        "acceptableMoves": [
            "8/3 8/2",
            "13/7 6/1"
        ],
        "quizChoices": [
            "13/2",
            "13/7 8/3",
            "8/3 8/2",
            "13/7 6/1"
        ],
        "equityLoss": 0.041,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/7 8/3 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.041 EMG face à la ligne 3-ply 13/2.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 5-6 en Match en 7 pts (3-3, Videau à 1) : 13/2 surpasse 13/7 8/3 de +0.041 EMG (25.4 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 13/2 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 13/2 domine 13/7 8/3 de +0.041 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 13/2 maximise votre équité cubeful (-1.000 EMG).",
            "Évitez le piège 13/7 8/3 (-0.041 EMG) ; préférez la ligne maîtresse 13/2."
        ]
    },
    {
        "id": "btcore5k_3ply_186_12",
        "tier": 2,
        "xgid": "XGID=--A-DbD-B---bB---b-dbc-B--:0:0:1:12:3:3:0:7:8",
        "dice": [
            1,
            2
        ],
        "playedMove": "4/1",
        "optimalMove": "4/3 4/2",
        "acceptableMoves": [],
        "quizChoices": [
            "4/3 4/2",
            "4/1",
            "6/3",
            "6/4 2/1"
        ],
        "equityLoss": 0.133,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 4/1 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.133 EMG face à la ligne 3-ply 4/3 4/2.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-2 en Match en 7 pts (3-3, Videau à 1) : 4/3 4/2 surpasse 4/1 de +0.133 EMG (31.5 % de gain).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Analysez le coup commençant par 4/3 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 4/3 4/2 domine 4/1 de +0.133 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 4/3 4/2 maximise votre équité cubeful (-0.867 EMG).",
            "Évitez le piège 4/1 (-0.133 EMG) ; préférez la ligne maîtresse 4/3 4/2."
        ]
    },
    {
        "id": "btcore5k_3ply_187_15",
        "tier": 3,
        "xgid": "XGID=--BABbD-B---bB---b-cbb-Bb-:0:0:1:15:3:3:0:7:8",
        "dice": [
            1,
            5
        ],
        "playedMove": "6/1 2/1",
        "optimalMove": "8/7 8/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/7 8/3",
            "6/1 2/1",
            "6/1 4/3",
            "6/1 3/2"
        ],
        "equityLoss": 0.112,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 6/1 2/1 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.112 EMG face à la ligne 3-ply 8/7 8/3.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-5 en Match en 7 pts (3-3, Videau à 1) : 8/7 8/3 surpasse 6/1 2/1 de +0.112 EMG (32.3 % de gain).",
        "proverb": "Chaque flèche contiguë ajoutée à votre prime divise par deux les chances d’évasion des pions arrières adverses.",
        "hint": "Analysez le coup commençant par 8/7 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/7 8/3 domine 6/1 2/1 de +0.112 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 8/7 8/3 maximise votre équité cubeful (-0.855 EMG).",
            "Évitez le piège 6/1 2/1 (-0.112 EMG) ; préférez la ligne maîtresse 8/7 8/3."
        ]
    },
    {
        "id": "btcore5k_3ply_188_22",
        "tier": 2,
        "xgid": "XGID=-a----EaC-A-eD---b-dAb--A-:0:0:1:22:3:3:0:7:8",
        "dice": [
            2,
            2
        ],
        "playedMove": "24/20 13/11(2)",
        "optimalMove": "24/20 6/4(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "24/20 6/4(2)",
            "24/20 13/11(2)",
            "24/20 10/6",
            "24/20 13/11 10/8"
        ],
        "equityLoss": 0.123,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 24/20 13/11(2) (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.123 EMG face à la ligne 3-ply 24/20 6/4(2).",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-2 en Match en 7 pts (3-3, Videau à 1) : 24/20 6/4(2) surpasse 24/20 13/11(2) de +0.123 EMG (50.8 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 24/20 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 24/20 6/4(2) domine 24/20 13/11(2) de +0.123 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 24/20 6/4(2) maximise votre équité cubeful (+0.083 EMG).",
            "Évitez le piège 24/20 13/11(2) (-0.123 EMG) ; préférez la ligne maîtresse 24/20 6/4(2)."
        ]
    },
    {
        "id": "btcore5k_3ply_189_22",
        "tier": 4,
        "xgid": "XGID=-a--B-C-C--aeD---b-dBb---A:0:0:1:22:3:3:0:7:8",
        "dice": [
            2,
            2
        ],
        "playedMove": "bar/23 20/18(2) 13/11*",
        "optimalMove": "bar/23 13/11*/9 13/11",
        "acceptableMoves": [],
        "quizChoices": [
            "bar/23 13/11*/9 13/11",
            "bar/23 20/18(2) 13/11*",
            "bar/23 13/11*(2) 8/6",
            "bar/23 13/11*(2) 6/4"
        ],
        "equityLoss": 0.046,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant bar/23 20/18(2) 13/11* (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.046 EMG face à la ligne 3-ply bar/23 13/11*/9 13/11.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 2-2 en Match en 7 pts (3-3, Videau à 1) : bar/23 13/11*/9 13/11 surpasse bar/23 20/18(2) 13/11* de +0.046 EMG (57.0 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par bar/23 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : bar/23 13/11*/9 13/11 domine bar/23 20/18(2) 13/11* de +0.046 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), bar/23 13/11*/9 13/11 maximise votre équité cubeful (+0.380 EMG).",
            "Évitez le piège bar/23 20/18(2) 13/11* (-0.046 EMG) ; préférez la ligne maîtresse bar/23 13/11*/9 13/11."
        ]
    },
    {
        "id": "btcore5k_3ply_190_16",
        "tier": 2,
        "xgid": "XGID=aa--B-D-B--BeB---b-dBb-A--:0:0:1:16:3:3:0:7:8",
        "dice": [
            1,
            6
        ],
        "playedMove": "23/16",
        "optimalMove": "11/5 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "11/5 6/5",
            "23/16",
            "13/7 8/7",
            "11/4"
        ],
        "equityLoss": 0.377,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 23/16 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.377 EMG face à la ligne 3-ply 11/5 6/5.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 1-6 en Match en 7 pts (3-3, Videau à 1) : 11/5 6/5 surpasse 23/16 de +0.377 EMG (66.9 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 11/5 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 11/5 6/5 domine 23/16 de +0.377 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 11/5 6/5 maximise votre équité cubeful (+0.851 EMG).",
            "Évitez le piège 23/16 (-0.377 EMG) ; préférez la ligne maîtresse 11/5 6/5."
        ]
    },
    {
        "id": "btcore5k_3ply_191_45",
        "tier": 4,
        "xgid": "XGID=aa--BBC-B--AeB---b-dBb-A--:0:0:1:45:3:3:0:7:8",
        "dice": [
            4,
            5
        ],
        "playedMove": "13/9 13/8",
        "optimalMove": "23/14",
        "acceptableMoves": [],
        "quizChoices": [
            "23/14",
            "13/9 13/8",
            "20/11",
            "11/7 6/1*"
        ],
        "equityLoss": 0.035,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 13/9 13/8 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.035 EMG face à la ligne 3-ply 23/14.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 4-5 en Match en 7 pts (3-3, Videau à 1) : 23/14 surpasse 13/9 13/8 de +0.035 EMG (70.4 % de gain).",
        "proverb": "Quand l’adversaire est sur la barre, fermez vos portes intérieures ou frappez un second blot pour étouffer sa rentrée.",
        "hint": "Analysez le coup commençant par 23/14 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 23/14 domine 13/9 13/8 de +0.035 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 23/14 maximise votre équité cubeful (+0.978 EMG).",
            "Évitez le piège 13/9 13/8 (-0.035 EMG) ; préférez la ligne maîtresse 23/14."
        ]
    },
    {
        "id": "btcore5k_3ply_192_35",
        "tier": 4,
        "xgid": "XGID=-b--BBC-B--AeBA--b-cBc----:0:0:1:35:3:3:0:7:8",
        "dice": [
            3,
            5
        ],
        "playedMove": "14/9 11/8",
        "optimalMove": "8/3 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/3",
            "14/9 11/8",
            "14/11 13/8",
            "14/6"
        ],
        "equityLoss": 0.048,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 14/9 11/8 (Match en 7 pts (3-3, Videau à 1)), vous concédez -0.048 EMG face à la ligne 3-ply 8/3 6/3.",
        "explanation": "Certifié en 3-ply (GNU Backgammon 2-ply world-class & BT-Core v2.0) avec le jet 3-5 en Match en 7 pts (3-3, Videau à 1) : 8/3 6/3 surpasse 14/9 11/8 de +0.048 EMG (72.1 % de gain).",
        "proverb": "Sécuriser une ancre avancée (flèches 20 ou 18) neutralise les menaces de gammon et prépare la contre-attaque.",
        "hint": "Analysez le coup commençant par 8/3 pour optimiser votre structure en Match en 7 pts (3-3, Videau à 1).",
        "commentaryVariants": [
            "Certifié 3-ply [world class] : 8/3 6/3 domine 14/9 11/8 de +0.048 EMG.",
            "En Match en 7 pts (3-3, Videau à 1), 8/3 6/3 maximise votre équité cubeful (+0.981 EMG).",
            "Évitez le piège 14/9 11/8 (-0.048 EMG) ; préférez la ligne maîtresse 8/3 6/3."
        ]
    }
];
