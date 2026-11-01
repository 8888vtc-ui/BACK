/**
 * @file src/lib/engine/gnubg3PlyCertifiedPositions.ts
 * @description Table officielle de 50 positions de contact complexes certifiées en VRAI 3-PLY Cubeful [grandmaster]
 * par GNU Backgammon CLI (`gnubg-cli.exe -t -q`, plies=3, cubeful=on, movefilter 3).
 * Généré automatiquement par `scripts/verify_3ply_with_gnubg.ts`. Zéro donnée factice.
 */

export interface CertifiedGnubg3PlyMove {
    readonly rank: number;
    readonly notation: string;
    readonly equity: number;
    readonly equityLoss: number;
    readonly win: number;
    readonly winGammon: number;
    readonly winBackgammon: number;
    readonly loseWin: number;
    readonly loseGammon: number;
    readonly loseBackgammon: number;
}

export interface CertifiedGnubg3PlyPosition {
    readonly id: string;
    readonly xgid: string;
    readonly conceptId: string;
    readonly conceptName: string;
    readonly dice: readonly [number, number];
    readonly gnubgTimeMs: number;
    readonly moves: readonly CertifiedGnubg3PlyMove[];
}

export const GNUBG_3PLY_CERTIFIED_POSITIONS: ReadonlyArray<CertifiedGnubg3PlyPosition> = [
    {
        "id": "cert_3ply_01_opening_41",
        "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:41:0:0:0:7:10",
        "conceptId": "opening",
        "conceptName": "Ouvertures & Développement (Split vs Slot)",
        "dice": [
            4,
            1
        ],
        "gnubgTimeMs": 927,
        "moves": [
            {
                "rank": 1,
                "notation": "24/23 13/9",
                "equity": 0.001,
                "equityLoss": 0,
                "win": 0.497,
                "winGammon": 0.143,
                "winBackgammon": 0.006,
                "loseWin": 0.503,
                "loseGammon": 0.136,
                "loseBackgammon": 0.005
            },
            {
                "rank": 2,
                "notation": "13/9 6/5",
                "equity": -0.02,
                "equityLoss": 0.021,
                "win": 0.496,
                "winGammon": 0.14,
                "winBackgammon": 0.006,
                "loseWin": 0.504,
                "loseGammon": 0.146,
                "loseBackgammon": 0.009
            },
            {
                "rank": 3,
                "notation": "24/23 24/20",
                "equity": -0.036,
                "equityLoss": 0.036,
                "win": 0.492,
                "winGammon": 0.124,
                "winBackgammon": 0.006,
                "loseWin": 0.508,
                "loseGammon": 0.135,
                "loseBackgammon": 0.005
            },
            {
                "rank": 4,
                "notation": "13/8",
                "equity": -0.037,
                "equityLoss": 0.038,
                "win": 0.489,
                "winGammon": 0.135,
                "winBackgammon": 0.005,
                "loseWin": 0.511,
                "loseGammon": 0.141,
                "loseBackgammon": 0.006
            },
            {
                "rank": 5,
                "notation": "24/20 6/5",
                "equity": -0.056,
                "equityLoss": 0.057,
                "win": 0.488,
                "winGammon": 0.124,
                "winBackgammon": 0.006,
                "loseWin": 0.512,
                "loseGammon": 0.142,
                "loseBackgammon": 0.007
            }
        ]
    },
    {
        "id": "harvest_t2_anchor_14",
        "xgid": "XGID=abCBB-B---A-dC-----b-AccA-:0:0:1:14:0:0:0:7:8",
        "conceptId": "advanced_anchor",
        "conceptName": "Ancre avancée en jan adverse (Point 20)",
        "dice": [
            1,
            4
        ],
        "gnubgTimeMs": 927,
        "moves": [
            {
                "rank": 1,
                "notation": "24/20 10/9",
                "equity": 1.034,
                "equityLoss": 0,
                "win": 0.756,
                "winGammon": 0.323,
                "winBackgammon": 0.031,
                "loseWin": 0.244,
                "loseGammon": 0.048,
                "loseBackgammon": 0.001
            },
            {
                "rank": 2,
                "notation": "24/20 21/20",
                "equity": 1.025,
                "equityLoss": 0.009,
                "win": 0.76,
                "winGammon": 0.313,
                "winBackgammon": 0.028,
                "loseWin": 0.24,
                "loseGammon": 0.043,
                "loseBackgammon": 0.001
            },
            {
                "rank": 3,
                "notation": "13/9 10/9",
                "equity": 1.02,
                "equityLoss": 0.014,
                "win": 0.746,
                "winGammon": 0.313,
                "winBackgammon": 0.029,
                "loseWin": 0.254,
                "loseGammon": 0.052,
                "loseBackgammon": 0.001
            },
            {
                "rank": 4,
                "notation": "21/20 10/6",
                "equity": 1.012,
                "equityLoss": 0.022,
                "win": 0.738,
                "winGammon": 0.316,
                "winBackgammon": 0.027,
                "loseWin": 0.262,
                "loseGammon": 0.053,
                "loseBackgammon": 0.001
            },
            {
                "rank": 5,
                "notation": "21/20 13/9",
                "equity": 0.978,
                "equityLoss": 0.056,
                "win": 0.733,
                "winGammon": 0.325,
                "winBackgammon": 0.031,
                "loseWin": 0.267,
                "loseGammon": 0.062,
                "loseBackgammon": 0.002
            }
        ]
    },
    {
        "id": "btcore5k_3ply_1_54",
        "xgid": "XGID=-b-B--D-B---eE---b-d-b--B-:0:0:1:54:0:0:0:0:8",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "dice": [
            5,
            4
        ],
        "gnubgTimeMs": 927,
        "moves": [
            {
                "rank": 1,
                "notation": "24/20 13/8",
                "equity": 0,
                "equityLoss": 0,
                "win": 0.497,
                "winGammon": 0.154,
                "winBackgammon": 0.01,
                "loseWin": 0.503,
                "loseGammon": 0.15,
                "loseBackgammon": 0.006
            },
            {
                "rank": 2,
                "notation": "13/9 13/8",
                "equity": -0.069,
                "equityLoss": 0.069,
                "win": 0.477,
                "winGammon": 0.157,
                "winBackgammon": 0.009,
                "loseWin": 0.523,
                "loseGammon": 0.159,
                "loseBackgammon": 0.009
            },
            {
                "rank": 3,
                "notation": "24/15",
                "equity": -0.079,
                "equityLoss": 0.079,
                "win": 0.486,
                "winGammon": 0.131,
                "winBackgammon": 0.006,
                "loseWin": 0.514,
                "loseGammon": 0.162,
                "loseBackgammon": 0.006
            },
            {
                "rank": 4,
                "notation": "13/4",
                "equity": -0.218,
                "equityLoss": 0.218,
                "win": 0.442,
                "winGammon": 0.138,
                "winBackgammon": 0.009,
                "loseWin": 0.558,
                "loseGammon": 0.178,
                "loseBackgammon": 0.011
            },
            {
                "rank": 5,
                "notation": "13/8 6/2",
                "equity": -0.278,
                "equityLoss": 0.278,
                "win": 0.43,
                "winGammon": 0.127,
                "winBackgammon": 0.007,
                "loseWin": 0.57,
                "loseGammon": 0.185,
                "loseBackgammon": 0.01
            }
        ]
    },
    {
        "id": "btcore5k_3ply_3_33",
        "xgid": "XGID=---B-BCbBA--bC---bbd-c--B-:0:0:1:33:0:0:0:0:8",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "dice": [
            3,
            3
        ],
        "gnubgTimeMs": 927,
        "moves": [
            {
                "rank": 1,
                "notation": "8/2(2)",
                "equity": -0.722,
                "equityLoss": 0,
                "win": 0.318,
                "winGammon": 0.086,
                "winBackgammon": 0.002,
                "loseWin": 0.682,
                "loseGammon": 0.183,
                "loseBackgammon": 0.01
            },
            {
                "rank": 2,
                "notation": "9/6 8/2 8/5",
                "equity": -0.795,
                "equityLoss": 0.074,
                "win": 0.306,
                "winGammon": 0.079,
                "winBackgammon": 0.001,
                "loseWin": 0.694,
                "loseGammon": 0.184,
                "loseBackgammon": 0.009
            },
            {
                "rank": 3,
                "notation": "13/10(3) 9/6",
                "equity": -0.847,
                "equityLoss": 0.125,
                "win": 0.281,
                "winGammon": 0.059,
                "winBackgammon": 0.001,
                "loseWin": 0.719,
                "loseGammon": 0.135,
                "loseBackgammon": 0.005
            },
            {
                "rank": 4,
                "notation": "9/3 8/5(2)",
                "equity": -0.837,
                "equityLoss": 0.115,
                "win": 0.296,
                "winGammon": 0.071,
                "winBackgammon": 0.001,
                "loseWin": 0.704,
                "loseGammon": 0.174,
                "loseBackgammon": 0.008
            },
            {
                "rank": 5,
                "notation": "13/10 9/6 8/5(2)",
                "equity": -0.873,
                "equityLoss": 0.151,
                "win": 0.291,
                "winGammon": 0.073,
                "winBackgammon": 0.001,
                "loseWin": 0.709,
                "loseGammon": 0.179,
                "loseBackgammon": 0.012
            }
        ]
    },
    {
        "id": "btcore5k_3ply_4_45",
        "xgid": "XGID=---B-BDbB-C-b----abd-bb-B-:0:0:1:45:0:0:0:0:8",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "dice": [
            4,
            5
        ],
        "gnubgTimeMs": 927,
        "moves": [
            {
                "rank": 1,
                "notation": "24/20 10/5",
                "equity": -0.811,
                "equityLoss": 0,
                "win": 0.315,
                "winGammon": 0.081,
                "winBackgammon": 0.002,
                "loseWin": 0.685,
                "loseGammon": 0.22,
                "loseBackgammon": 0.007
            },
            {
                "rank": 2,
                "notation": "24/15",
                "equity": -0.849,
                "equityLoss": 0.037,
                "win": 0.306,
                "winGammon": 0.066,
                "winBackgammon": 0.002,
                "loseWin": 0.694,
                "loseGammon": 0.204,
                "loseBackgammon": 0.006
            },
            {
                "rank": 3,
                "notation": "24/20 6/1",
                "equity": -1,
                "equityLoss": 0.189,
                "win": 0.295,
                "winGammon": 0.091,
                "winBackgammon": 0.003,
                "loseWin": 0.705,
                "loseGammon": 0.275,
                "loseBackgammon": 0.012
            },
            {
                "rank": 4,
                "notation": "10/5 8/4",
                "equity": -1,
                "equityLoss": 0.189,
                "win": 0.253,
                "winGammon": 0.061,
                "winBackgammon": 0.001,
                "loseWin": 0.747,
                "loseGammon": 0.172,
                "loseBackgammon": 0.009
            },
            {
                "rank": 5,
                "notation": "10/5 6/2",
                "equity": -1,
                "equityLoss": 0.189,
                "win": 0.246,
                "winGammon": 0.057,
                "winBackgammon": 0.001,
                "loseWin": 0.754,
                "loseGammon": 0.159,
                "loseBackgammon": 0.006
            }
        ]
    },
    {
        "id": "btcore5k_3ply_6_26",
        "xgid": "XGID=-A-BBBDb--B------bcbBdb---:0:0:1:26:0:0:0:0:8",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "dice": [
            2,
            6
        ],
        "gnubgTimeMs": 927,
        "moves": [
            {
                "rank": 1,
                "notation": "20/14 6/4",
                "equity": -0.174,
                "equityLoss": 0,
                "win": 0.447,
                "winGammon": 0.063,
                "winBackgammon": 0.001,
                "loseWin": 0.553,
                "loseGammon": 0.089,
                "loseBackgammon": 0.003
            },
            {
                "rank": 2,
                "notation": "20/14 3/1",
                "equity": -0.226,
                "equityLoss": 0.052,
                "win": 0.432,
                "winGammon": 0.064,
                "winBackgammon": 0.001,
                "loseWin": 0.568,
                "loseGammon": 0.1,
                "loseBackgammon": 0.003
            },
            {
                "rank": 3,
                "notation": "10/8 10/4",
                "equity": -0.291,
                "equityLoss": 0.118,
                "win": 0.409,
                "winGammon": 0.048,
                "winBackgammon": 0,
                "loseWin": 0.591,
                "loseGammon": 0.052,
                "loseBackgammon": 0.001
            },
            {
                "rank": 4,
                "notation": "10/2",
                "equity": -0.355,
                "equityLoss": 0.181,
                "win": 0.392,
                "winGammon": 0.046,
                "winBackgammon": 0,
                "loseWin": 0.608,
                "loseGammon": 0.056,
                "loseBackgammon": 0.002
            },
            {
                "rank": 5,
                "notation": "10/4 6/4",
                "equity": -0.363,
                "equityLoss": 0.189,
                "win": 0.39,
                "winGammon": 0.045,
                "winBackgammon": 0,
                "loseWin": 0.61,
                "loseGammon": 0.055,
                "loseBackgammon": 0.001
            }
        ]
    },
    {
        "id": "btcore5k_3ply_8_15",
        "xgid": "XGID=aBBCBBC----------ccb-db-A-:0:0:1:15:0:0:0:0:8",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "dice": [
            1,
            5
        ],
        "gnubgTimeMs": 927,
        "moves": [
            {
                "rank": 1,
                "notation": "24/23 6/1",
                "equity": 0.655,
                "equityLoss": 0,
                "win": 0.677,
                "winGammon": 0.104,
                "winBackgammon": 0,
                "loseWin": 0.323,
                "loseGammon": 0.021,
                "loseBackgammon": 0
            },
            {
                "rank": 2,
                "notation": "6/1 3/2",
                "equity": 0.62,
                "equityLoss": 0.035,
                "win": 0.671,
                "winGammon": 0.103,
                "winBackgammon": 0,
                "loseWin": 0.329,
                "loseGammon": 0.025,
                "loseBackgammon": 0.001
            },
            {
                "rank": 3,
                "notation": "6/5 6/1",
                "equity": 0.035,
                "equityLoss": 0.62,
                "win": 0.506,
                "winGammon": 0.08,
                "winBackgammon": 0,
                "loseWin": 0.494,
                "loseGammon": 0.064,
                "loseBackgammon": 0.003
            },
            {
                "rank": 4,
                "notation": "6/1 5/4",
                "equity": -0.074,
                "equityLoss": 0.728,
                "win": 0.473,
                "winGammon": 0.076,
                "winBackgammon": 0.001,
                "loseWin": 0.527,
                "loseGammon": 0.07,
                "loseBackgammon": 0.003
            },
            {
                "rank": 5,
                "notation": "6/1 2/1",
                "equity": -0.116,
                "equityLoss": 0.77,
                "win": 0.462,
                "winGammon": 0.086,
                "winBackgammon": 0.001,
                "loseWin": 0.538,
                "loseGammon": 0.088,
                "loseBackgammon": 0.003
            }
        ]
    },
    {
        "id": "btcore5k_3ply_9_22",
        "xgid": "XGID=aCCBBBB----------ccb-db-A-:0:0:1:22:0:0:0:0:8",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "dice": [
            2,
            2
        ],
        "gnubgTimeMs": 927,
        "moves": [
            {
                "rank": 1,
                "notation": "6/2(2)",
                "equity": 0.092,
                "equityLoss": 0,
                "win": 0.536,
                "winGammon": 0.043,
                "winBackgammon": 0,
                "loseWin": 0.464,
                "loseGammon": 0.031,
                "loseBackgammon": 0.001
            },
            {
                "rank": 2,
                "notation": "6/4(2) 5/3(2)",
                "equity": 0.048,
                "equityLoss": 0.043,
                "win": 0.515,
                "winGammon": 0.035,
                "winBackgammon": 0,
                "loseWin": 0.485,
                "loseGammon": 0.015,
                "loseBackgammon": 0
            },
            {
                "rank": 3,
                "notation": "5/1(2)",
                "equity": 0.039,
                "equityLoss": 0.053,
                "win": 0.519,
                "winGammon": 0.038,
                "winBackgammon": 0,
                "loseWin": 0.481,
                "loseGammon": 0.035,
                "loseBackgammon": 0.001
            },
            {
                "rank": 4,
                "notation": "6/4(2) 3/1(2)",
                "equity": -0.217,
                "equityLoss": 0.309,
                "win": 0.429,
                "winGammon": 0.033,
                "winBackgammon": 0,
                "loseWin": 0.571,
                "loseGammon": 0.041,
                "loseBackgammon": 0.001
            },
            {
                "rank": 5,
                "notation": "5/3(2) 4/2(2)",
                "equity": -0.343,
                "equityLoss": 0.435,
                "win": 0.39,
                "winGammon": 0.032,
                "winBackgammon": 0,
                "loseWin": 0.61,
                "loseGammon": 0.05,
                "loseBackgammon": 0.001
            }
        ]
    },
    {
        "id": "btcore5k_3ply_10_63",
        "xgid": "XGID=-b--B-D-B---cE--ac-d--b-B-:0:0:1:63:0:0:0:0:8",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "dice": [
            6,
            3
        ],
        "gnubgTimeMs": 927,
        "moves": [
            {
                "rank": 1,
                "notation": "24/15",
                "equity": -0.117,
                "equityLoss": 0,
                "win": 0.485,
                "winGammon": 0.129,
                "winBackgammon": 0.006,
                "loseWin": 0.515,
                "loseGammon": 0.187,
                "loseBackgammon": 0.008
            },
            {
                "rank": 2,
                "notation": "13/4",
                "equity": -0.14,
                "equityLoss": 0.024,
                "win": 0.466,
                "winGammon": 0.148,
                "winBackgammon": 0.007,
                "loseWin": 0.534,
                "loseGammon": 0.178,
                "loseBackgammon": 0.01
            },
            {
                "rank": 3,
                "notation": "13/10 13/7",
                "equity": -0.146,
                "equityLoss": 0.029,
                "win": 0.473,
                "winGammon": 0.145,
                "winBackgammon": 0.007,
                "loseWin": 0.527,
                "loseGammon": 0.187,
                "loseBackgammon": 0.016
            },
            {
                "rank": 4,
                "notation": "24/18 13/10",
                "equity": -0.155,
                "equityLoss": 0.038,
                "win": 0.478,
                "winGammon": 0.139,
                "winBackgammon": 0.008,
                "loseWin": 0.522,
                "loseGammon": 0.207,
                "loseBackgammon": 0.01
            },
            {
                "rank": 5,
                "notation": "24/21 13/7",
                "equity": -0.284,
                "equityLoss": 0.168,
                "win": 0.449,
                "winGammon": 0.127,
                "winBackgammon": 0.007,
                "loseWin": 0.551,
                "loseGammon": 0.219,
                "loseBackgammon": 0.012
            }
        ]
    },
    {
        "id": "btcore5k_3ply_12_51",
        "xgid": "XGID=-b--C-DBB----B-c-bBdb-b---:0:0:1:51:0:0:0:0:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            5,
            1
        ],
        "gnubgTimeMs": 927,
        "moves": [
            {
                "rank": 1,
                "notation": "8/3 4/3",
                "equity": 0.788,
                "equityLoss": 0,
                "win": 0.692,
                "winGammon": 0.179,
                "winBackgammon": 0.006,
                "loseWin": 0.308,
                "loseGammon": 0.077,
                "loseBackgammon": 0.002
            },
            {
                "rank": 2,
                "notation": "13/7",
                "equity": 0.746,
                "equityLoss": 0.042,
                "win": 0.688,
                "winGammon": 0.15,
                "winBackgammon": 0.005,
                "loseWin": 0.312,
                "loseGammon": 0.062,
                "loseBackgammon": 0.001
            },
            {
                "rank": 3,
                "notation": "13/12 13/8",
                "equity": 0.688,
                "equityLoss": 0.1,
                "win": 0.678,
                "winGammon": 0.141,
                "winBackgammon": 0.005,
                "loseWin": 0.322,
                "loseGammon": 0.06,
                "loseBackgammon": 0.001
            },
            {
                "rank": 4,
                "notation": "13/8 6/5",
                "equity": 0.384,
                "equityLoss": 0.404,
                "win": 0.623,
                "winGammon": 0.149,
                "winBackgammon": 0.008,
                "loseWin": 0.377,
                "loseGammon": 0.132,
                "loseBackgammon": 0.004
            },
            {
                "rank": 5,
                "notation": "13/8 4/3",
                "equity": 0.346,
                "equityLoss": 0.442,
                "win": 0.61,
                "winGammon": 0.143,
                "winBackgammon": 0.008,
                "loseWin": 0.39,
                "loseGammon": 0.126,
                "loseBackgammon": 0.004
            }
        ]
    },
    {
        "id": "btcore5k_3ply_13_52",
        "xgid": "XGID=-b-BB-DBA----B-b-bBdb-b-a-:0:0:1:52:0:0:0:0:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            5,
            2
        ],
        "gnubgTimeMs": 789,
        "moves": [
            {
                "rank": 1,
                "notation": "13/8 6/4",
                "equity": 0.958,
                "equityLoss": 0,
                "win": 0.768,
                "winGammon": 0.154,
                "winBackgammon": 0.006,
                "loseWin": 0.232,
                "loseGammon": 0.041,
                "loseBackgammon": 0.001
            },
            {
                "rank": 2,
                "notation": "13/11 13/8",
                "equity": 0.922,
                "equityLoss": 0.035,
                "win": 0.772,
                "winGammon": 0.161,
                "winBackgammon": 0.007,
                "loseWin": 0.228,
                "loseGammon": 0.047,
                "loseBackgammon": 0.001
            },
            {
                "rank": 3,
                "notation": "13/11 8/3",
                "equity": 0.724,
                "equityLoss": 0.234,
                "win": 0.708,
                "winGammon": 0.165,
                "winBackgammon": 0.007,
                "loseWin": 0.292,
                "loseGammon": 0.074,
                "loseBackgammon": 0.001
            },
            {
                "rank": 4,
                "notation": "13/6",
                "equity": 0.689,
                "equityLoss": 0.269,
                "win": 0.698,
                "winGammon": 0.166,
                "winBackgammon": 0.007,
                "loseWin": 0.302,
                "loseGammon": 0.08,
                "loseBackgammon": 0.001
            },
            {
                "rank": 5,
                "notation": "18/16 18/13",
                "equity": 0.658,
                "equityLoss": 0.3,
                "win": 0.703,
                "winGammon": 0.139,
                "winBackgammon": 0.007,
                "loseWin": 0.297,
                "loseGammon": 0.088,
                "loseBackgammon": 0.001
            }
        ]
    },
    {
        "id": "btcore5k_3ply_14_62",
        "xgid": "XGID=---BCbCBB----A-b--Bdbbb-a-:0:0:1:62:0:0:0:0:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            6,
            2
        ],
        "gnubgTimeMs": 789,
        "moves": [
            {
                "rank": 1,
                "notation": "13/7 4/2",
                "equity": 0.047,
                "equityLoss": 0,
                "win": 0.515,
                "winGammon": 0.048,
                "winBackgammon": 0.001,
                "loseWin": 0.485,
                "loseGammon": 0.046,
                "loseBackgammon": 0.001
            },
            {
                "rank": 2,
                "notation": "13/7 6/4",
                "equity": 0.024,
                "equityLoss": 0.023,
                "win": 0.508,
                "winGammon": 0.044,
                "winBackgammon": 0.001,
                "loseWin": 0.492,
                "loseGammon": 0.047,
                "loseBackgammon": 0
            },
            {
                "rank": 3,
                "notation": "13/7 3/1",
                "equity": -0.015,
                "equityLoss": 0.063,
                "win": 0.494,
                "winGammon": 0.045,
                "winBackgammon": 0,
                "loseWin": 0.506,
                "loseGammon": 0.044,
                "loseBackgammon": 0
            },
            {
                "rank": 4,
                "notation": "8/6 8/2",
                "equity": -0.119,
                "equityLoss": 0.166,
                "win": 0.474,
                "winGammon": 0.052,
                "winBackgammon": 0.001,
                "loseWin": 0.526,
                "loseGammon": 0.091,
                "loseBackgammon": 0.001
            },
            {
                "rank": 5,
                "notation": "13/7 8/6",
                "equity": -0.192,
                "equityLoss": 0.24,
                "win": 0.457,
                "winGammon": 0.057,
                "winBackgammon": 0.001,
                "loseWin": 0.543,
                "loseGammon": 0.113,
                "loseBackgammon": 0
            }
        ]
    },
    {
        "id": "btcore5k_3ply_16_45",
        "xgid": "XGID=-b----E-D---dD---c-fA---A-:0:0:1:45:1:1:0:3:8",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "dice": [
            4,
            5
        ],
        "gnubgTimeMs": 789,
        "moves": [
            {
                "rank": 1,
                "notation": "24/20 13/8",
                "equity": 0.373,
                "equityLoss": 0,
                "win": 0.566,
                "winGammon": 0.146,
                "winBackgammon": 0.005,
                "loseWin": 0.434,
                "loseGammon": 0.071,
                "loseBackgammon": 0.002
            },
            {
                "rank": 2,
                "notation": "20/11",
                "equity": 0.316,
                "equityLoss": 0.057,
                "win": 0.556,
                "winGammon": 0.146,
                "winBackgammon": 0.007,
                "loseWin": 0.444,
                "loseGammon": 0.119,
                "loseBackgammon": 0.004
            },
            {
                "rank": 3,
                "notation": "24/20 8/3",
                "equity": 0.253,
                "equityLoss": 0.12,
                "win": 0.545,
                "winGammon": 0.147,
                "winBackgammon": 0.005,
                "loseWin": 0.455,
                "loseGammon": 0.082,
                "loseBackgammon": 0.002
            },
            {
                "rank": 4,
                "notation": "20/16 13/8",
                "equity": 0.06,
                "equityLoss": 0.313,
                "win": 0.529,
                "winGammon": 0.139,
                "winBackgammon": 0.007,
                "loseWin": 0.471,
                "loseGammon": 0.138,
                "loseBackgammon": 0.004
            },
            {
                "rank": 5,
                "notation": "20/15 13/9",
                "equity": 0.05,
                "equityLoss": 0.323,
                "win": 0.526,
                "winGammon": 0.144,
                "winBackgammon": 0.008,
                "loseWin": 0.474,
                "loseGammon": 0.145,
                "loseBackgammon": 0.007
            }
        ]
    },
    {
        "id": "btcore5k_3ply_17_45",
        "xgid": "XGID=-b----E-E---dC---c-dBaa---:0:0:1:45:1:1:0:3:8",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "dice": [
            4,
            5
        ],
        "gnubgTimeMs": 789,
        "moves": [
            {
                "rank": 1,
                "notation": "20/11",
                "equity": 0.211,
                "equityLoss": 0,
                "win": 0.537,
                "winGammon": 0.143,
                "winBackgammon": 0.009,
                "loseWin": 0.463,
                "loseGammon": 0.14,
                "loseBackgammon": 0.005
            },
            {
                "rank": 2,
                "notation": "13/9 8/3",
                "equity": 0.162,
                "equityLoss": 0.049,
                "win": 0.529,
                "winGammon": 0.16,
                "winBackgammon": 0.007,
                "loseWin": 0.471,
                "loseGammon": 0.1,
                "loseBackgammon": 0.003
            },
            {
                "rank": 3,
                "notation": "13/4",
                "equity": 0.152,
                "equityLoss": 0.059,
                "win": 0.527,
                "winGammon": 0.149,
                "winBackgammon": 0.007,
                "loseWin": 0.473,
                "loseGammon": 0.092,
                "loseBackgammon": 0.003
            },
            {
                "rank": 4,
                "notation": "8/4 8/3",
                "equity": 0.081,
                "equityLoss": 0.13,
                "win": 0.514,
                "winGammon": 0.148,
                "winBackgammon": 0.007,
                "loseWin": 0.486,
                "loseGammon": 0.107,
                "loseBackgammon": 0.004
            },
            {
                "rank": 5,
                "notation": "20/16 20/15",
                "equity": 0.074,
                "equityLoss": 0.137,
                "win": 0.513,
                "winGammon": 0.118,
                "winBackgammon": 0.006,
                "loseWin": 0.487,
                "loseGammon": 0.158,
                "loseBackgammon": 0.005
            }
        ]
    },
    {
        "id": "btcore5k_3ply_18_65",
        "xgid": "XGID=-b--A-E-E---cB---d-cBab---:0:0:1:65:1:1:0:3:8",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "dice": [
            6,
            5
        ],
        "gnubgTimeMs": 789,
        "moves": [
            {
                "rank": 1,
                "notation": "20/15 20/14",
                "equity": -0.193,
                "equityLoss": 0,
                "win": 0.466,
                "winGammon": 0.103,
                "winBackgammon": 0.005,
                "loseWin": 0.534,
                "loseGammon": 0.207,
                "loseBackgammon": 0.008
            },
            {
                "rank": 2,
                "notation": "20/9",
                "equity": -0.238,
                "equityLoss": 0.045,
                "win": 0.458,
                "winGammon": 0.119,
                "winBackgammon": 0.006,
                "loseWin": 0.542,
                "loseGammon": 0.19,
                "loseBackgammon": 0.008
            },
            {
                "rank": 3,
                "notation": "8/3 8/2",
                "equity": -0.363,
                "equityLoss": 0.17,
                "win": 0.436,
                "winGammon": 0.112,
                "winBackgammon": 0.006,
                "loseWin": 0.564,
                "loseGammon": 0.15,
                "loseBackgammon": 0.007
            },
            {
                "rank": 4,
                "notation": "13/2",
                "equity": -0.465,
                "equityLoss": 0.272,
                "win": 0.418,
                "winGammon": 0.102,
                "winBackgammon": 0.005,
                "loseWin": 0.582,
                "loseGammon": 0.136,
                "loseBackgammon": 0.006
            },
            {
                "rank": 5,
                "notation": "13/8 13/7",
                "equity": -0.466,
                "equityLoss": 0.273,
                "win": 0.417,
                "winGammon": 0.096,
                "winBackgammon": 0.004,
                "loseWin": 0.583,
                "loseGammon": 0.118,
                "loseBackgammon": 0.004
            }
        ]
    },
    {
        "id": "btcore5k_3ply_19_42",
        "xgid": "XGID=-b--A-EAF---b----d-cBaba--:0:0:1:42:1:1:0:3:8",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "dice": [
            4,
            2
        ],
        "gnubgTimeMs": 789,
        "moves": [
            {
                "rank": 1,
                "notation": "8/4 7/5",
                "equity": 0.347,
                "equityLoss": 0,
                "win": 0.561,
                "winGammon": 0.17,
                "winBackgammon": 0.008,
                "loseWin": 0.439,
                "loseGammon": 0.077,
                "loseBackgammon": 0.002
            },
            {
                "rank": 2,
                "notation": "8/4 6/4",
                "equity": 0.329,
                "equityLoss": 0.017,
                "win": 0.558,
                "winGammon": 0.166,
                "winBackgammon": 0.008,
                "loseWin": 0.442,
                "loseGammon": 0.076,
                "loseBackgammon": 0.002
            },
            {
                "rank": 3,
                "notation": "7/3 6/4",
                "equity": 0.274,
                "equityLoss": 0.072,
                "win": 0.549,
                "winGammon": 0.151,
                "winBackgammon": 0.007,
                "loseWin": 0.451,
                "loseGammon": 0.079,
                "loseBackgammon": 0.002
            },
            {
                "rank": 4,
                "notation": "8/6 8/4",
                "equity": 0.248,
                "equityLoss": 0.099,
                "win": 0.544,
                "winGammon": 0.16,
                "winBackgammon": 0.008,
                "loseWin": 0.456,
                "loseGammon": 0.08,
                "loseBackgammon": 0.002
            },
            {
                "rank": 5,
                "notation": "6/4 6/2",
                "equity": 0.073,
                "equityLoss": 0.274,
                "win": 0.513,
                "winGammon": 0.141,
                "winBackgammon": 0.006,
                "loseWin": 0.487,
                "loseGammon": 0.104,
                "loseBackgammon": 0.003
            }
        ]
    },
    {
        "id": "btcore5k_3ply_23_33",
        "xgid": "XGID=--C-DBBbCA-----------ddcb-:0:0:1:33:1:1:0:3:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            3,
            3
        ],
        "gnubgTimeMs": 789,
        "moves": [
            {
                "rank": 1,
                "notation": "9/6 8/5(3)",
                "equity": 0.88,
                "equityLoss": 0,
                "win": 0.726,
                "winGammon": 0,
                "winBackgammon": 0,
                "loseWin": 0.274,
                "loseGammon": 0,
                "loseBackgammon": 0
            },
            {
                "rank": 2,
                "notation": "9/3 8/5 4/1",
                "equity": 0.854,
                "equityLoss": 0.026,
                "win": 0.717,
                "winGammon": 0.004,
                "winBackgammon": 0,
                "loseWin": 0.283,
                "loseGammon": 0.001,
                "loseBackgammon": 0
            },
            {
                "rank": 3,
                "notation": "9/3 8/5 6/3",
                "equity": 0.845,
                "equityLoss": 0.035,
                "win": 0.708,
                "winGammon": 0.002,
                "winBackgammon": 0,
                "loseWin": 0.292,
                "loseGammon": 0,
                "loseBackgammon": 0
            },
            {
                "rank": 4,
                "notation": "9/3 8/2",
                "equity": 0.83,
                "equityLoss": 0.049,
                "win": 0.698,
                "winGammon": 0.003,
                "winBackgammon": 0,
                "loseWin": 0.302,
                "loseGammon": 0.001,
                "loseBackgammon": 0
            },
            {
                "rank": 5,
                "notation": "9/6 8/5 4/1(2)",
                "equity": 0.827,
                "equityLoss": 0.053,
                "win": 0.702,
                "winGammon": 0.003,
                "winBackgammon": 0,
                "loseWin": 0.298,
                "loseGammon": 0,
                "loseBackgammon": 0
            }
        ]
    },
    {
        "id": "btcore5k_3ply_28_23",
        "xgid": "XGID=-b----E-D---cD---c-e-bA-A-:0:0:1:23:1:1:0:3:8",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "dice": [
            2,
            3
        ],
        "gnubgTimeMs": 789,
        "moves": [
            {
                "rank": 1,
                "notation": "24/22 13/10",
                "equity": -0.249,
                "equityLoss": 0,
                "win": 0.456,
                "winGammon": 0.114,
                "winBackgammon": 0.004,
                "loseWin": 0.544,
                "loseGammon": 0.136,
                "loseBackgammon": 0.004
            },
            {
                "rank": 2,
                "notation": "24/22 8/5",
                "equity": -0.344,
                "equityLoss": 0.095,
                "win": 0.439,
                "winGammon": 0.108,
                "winBackgammon": 0.003,
                "loseWin": 0.561,
                "loseGammon": 0.151,
                "loseBackgammon": 0.005
            },
            {
                "rank": 3,
                "notation": "24/22 6/3",
                "equity": -0.376,
                "equityLoss": 0.127,
                "win": 0.433,
                "winGammon": 0.1,
                "winBackgammon": 0.003,
                "loseWin": 0.567,
                "loseGammon": 0.153,
                "loseBackgammon": 0.005
            },
            {
                "rank": 4,
                "notation": "13/11 13/10",
                "equity": -0.484,
                "equityLoss": 0.235,
                "win": 0.414,
                "winGammon": 0.113,
                "winBackgammon": 0.006,
                "loseWin": 0.586,
                "loseGammon": 0.247,
                "loseBackgammon": 0.018
            },
            {
                "rank": 5,
                "notation": "13/8",
                "equity": -0.491,
                "equityLoss": 0.242,
                "win": 0.413,
                "winGammon": 0.106,
                "winBackgammon": 0.005,
                "loseWin": 0.587,
                "loseGammon": 0.226,
                "loseBackgammon": 0.008
            }
        ]
    },
    {
        "id": "btcore5k_3ply_30_56",
        "xgid": "XGID=-a----E-E---cB---c-e-cC---:0:0:1:56:1:1:0:3:8",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "dice": [
            5,
            6
        ],
        "gnubgTimeMs": 789,
        "moves": [
            {
                "rank": 1,
                "notation": "22/11",
                "equity": -0.764,
                "equityLoss": 0,
                "win": 0.365,
                "winGammon": 0.066,
                "winBackgammon": 0.002,
                "loseWin": 0.635,
                "loseGammon": 0.131,
                "loseBackgammon": 0.004
            },
            {
                "rank": 2,
                "notation": "22/16 8/3",
                "equity": -0.868,
                "equityLoss": 0.104,
                "win": 0.346,
                "winGammon": 0.065,
                "winBackgammon": 0.002,
                "loseWin": 0.654,
                "loseGammon": 0.209,
                "loseBackgammon": 0.009
            },
            {
                "rank": 3,
                "notation": "22/16 6/1*",
                "equity": -0.879,
                "equityLoss": 0.116,
                "win": 0.344,
                "winGammon": 0.067,
                "winBackgammon": 0.002,
                "loseWin": 0.656,
                "loseGammon": 0.202,
                "loseBackgammon": 0.008
            },
            {
                "rank": 4,
                "notation": "8/3 8/2",
                "equity": -1,
                "equityLoss": 0.236,
                "win": 0.323,
                "winGammon": 0.06,
                "winBackgammon": 0.002,
                "loseWin": 0.677,
                "loseGammon": 0.2,
                "loseBackgammon": 0.009
            },
            {
                "rank": 5,
                "notation": "8/2 6/1*",
                "equity": -1,
                "equityLoss": 0.236,
                "win": 0.319,
                "winGammon": 0.057,
                "winBackgammon": 0.001,
                "loseWin": 0.681,
                "loseGammon": 0.196,
                "loseBackgammon": 0.008
            }
        ]
    },
    {
        "id": "btcore5k_3ply_31_64",
        "xgid": "XGID=-----aE-E--AcB---c-e-bBa--:0:0:1:64:1:1:0:3:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            6,
            4
        ],
        "gnubgTimeMs": 789,
        "moves": [
            {
                "rank": 1,
                "notation": "11/5* 8/4",
                "equity": -0.681,
                "equityLoss": 0,
                "win": 0.379,
                "winGammon": 0.084,
                "winBackgammon": 0.002,
                "loseWin": 0.621,
                "loseGammon": 0.186,
                "loseBackgammon": 0.007
            },
            {
                "rank": 2,
                "notation": "11/5* 6/2",
                "equity": -0.774,
                "equityLoss": 0.093,
                "win": 0.363,
                "winGammon": 0.074,
                "winBackgammon": 0.002,
                "loseWin": 0.637,
                "loseGammon": 0.182,
                "loseBackgammon": 0.007
            },
            {
                "rank": 3,
                "notation": "13/9 11/5*",
                "equity": -0.801,
                "equityLoss": 0.12,
                "win": 0.358,
                "winGammon": 0.078,
                "winBackgammon": 0.002,
                "loseWin": 0.642,
                "loseGammon": 0.197,
                "loseBackgammon": 0.009
            },
            {
                "rank": 4,
                "notation": "11/5*/1",
                "equity": -0.843,
                "equityLoss": 0.162,
                "win": 0.35,
                "winGammon": 0.067,
                "winBackgammon": 0.002,
                "loseWin": 0.65,
                "loseGammon": 0.132,
                "loseBackgammon": 0.004
            },
            {
                "rank": 5,
                "notation": "8/2 6/2",
                "equity": -0.862,
                "equityLoss": 0.181,
                "win": 0.347,
                "winGammon": 0.066,
                "winBackgammon": 0.002,
                "loseWin": 0.653,
                "loseGammon": 0.112,
                "loseBackgammon": 0.003
            }
        ]
    },
    {
        "id": "btcore5k_3ply_32_44",
        "xgid": "XGID=-B-C--D-B--a-B--bd-d-bBb--:0:0:1:44:1:1:0:3:8",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "dice": [
            4,
            4
        ],
        "gnubgTimeMs": 1343,
        "moves": [
            {
                "rank": 1,
                "notation": "22/14(2)",
                "equity": -0.968,
                "equityLoss": 0,
                "win": 0.328,
                "winGammon": 0.005,
                "winBackgammon": 0,
                "loseWin": 0.672,
                "loseGammon": 0.006,
                "loseBackgammon": 0
            },
            {
                "rank": 2,
                "notation": "22/18(2) 8/4(2)",
                "equity": -0.973,
                "equityLoss": 0.005,
                "win": 0.327,
                "winGammon": 0.008,
                "winBackgammon": 0,
                "loseWin": 0.673,
                "loseGammon": 0.01,
                "loseBackgammon": 0
            },
            {
                "rank": 3,
                "notation": "22/18(2) 13/9(2)",
                "equity": -1,
                "equityLoss": 0.032,
                "win": 0.311,
                "winGammon": 0.004,
                "winBackgammon": 0,
                "loseWin": 0.689,
                "loseGammon": 0.008,
                "loseBackgammon": 0
            },
            {
                "rank": 4,
                "notation": "22/18(2) 6/2(2)",
                "equity": -1,
                "equityLoss": 0.032,
                "win": 0.304,
                "winGammon": 0.007,
                "winBackgammon": 0,
                "loseWin": 0.696,
                "loseGammon": 0.012,
                "loseBackgammon": 0
            },
            {
                "rank": 5,
                "notation": "22/18(2) 8/4 6/2",
                "equity": -1,
                "equityLoss": 0.032,
                "win": 0.307,
                "winGammon": 0.008,
                "winBackgammon": 0,
                "loseWin": 0.693,
                "loseGammon": 0.019,
                "loseBackgammon": 0.001
            }
        ]
    },
    {
        "id": "btcore5k_3ply_35_62",
        "xgid": "XGID=-b--B-D-B---dE-a-c-e----B-:0:0:1:62:2:2:0:5:8",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "dice": [
            6,
            2
        ],
        "gnubgTimeMs": 1343,
        "moves": [
            {
                "rank": 1,
                "notation": "24/18 13/11",
                "equity": 0.275,
                "equityLoss": 0,
                "win": 0.56,
                "winGammon": 0.17,
                "winBackgammon": 0.01,
                "loseWin": 0.44,
                "loseGammon": 0.12,
                "loseBackgammon": 0.005
            },
            {
                "rank": 2,
                "notation": "24/16",
                "equity": 0.196,
                "equityLoss": 0.079,
                "win": 0.543,
                "winGammon": 0.158,
                "winBackgammon": 0.009,
                "loseWin": 0.457,
                "loseGammon": 0.127,
                "loseBackgammon": 0.005
            },
            {
                "rank": 3,
                "notation": "24/22 24/18",
                "equity": 0.193,
                "equityLoss": 0.082,
                "win": 0.544,
                "winGammon": 0.158,
                "winBackgammon": 0.01,
                "loseWin": 0.456,
                "loseGammon": 0.132,
                "loseBackgammon": 0.005
            },
            {
                "rank": 4,
                "notation": "24/18 6/4",
                "equity": 0.191,
                "equityLoss": 0.084,
                "win": 0.542,
                "winGammon": 0.156,
                "winBackgammon": 0.009,
                "loseWin": 0.458,
                "loseGammon": 0.125,
                "loseBackgammon": 0.005
            },
            {
                "rank": 5,
                "notation": "13/11 13/7",
                "equity": 0.186,
                "equityLoss": 0.089,
                "win": 0.534,
                "winGammon": 0.182,
                "winBackgammon": 0.01,
                "loseWin": 0.466,
                "loseGammon": 0.134,
                "loseBackgammon": 0.008
            }
        ]
    },
    {
        "id": "btcore5k_3ply_36_63",
        "xgid": "XGID=-b--B-D-B---dE--Abbe----A-:0:0:1:63:2:2:0:5:8",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "dice": [
            6,
            3
        ],
        "gnubgTimeMs": 1343,
        "moves": [
            {
                "rank": 1,
                "notation": "16/10 13/10",
                "equity": 0.446,
                "equityLoss": 0,
                "win": 0.597,
                "winGammon": 0.168,
                "winBackgammon": 0.009,
                "loseWin": 0.403,
                "loseGammon": 0.099,
                "loseBackgammon": 0.003
            },
            {
                "rank": 2,
                "notation": "24/21 16/10",
                "equity": 0.324,
                "equityLoss": 0.122,
                "win": 0.575,
                "winGammon": 0.144,
                "winBackgammon": 0.007,
                "loseWin": 0.425,
                "loseGammon": 0.109,
                "loseBackgammon": 0.003
            },
            {
                "rank": 3,
                "notation": "24/15",
                "equity": 0.223,
                "equityLoss": 0.222,
                "win": 0.56,
                "winGammon": 0.131,
                "winBackgammon": 0.006,
                "loseWin": 0.44,
                "loseGammon": 0.115,
                "loseBackgammon": 0.003
            },
            {
                "rank": 4,
                "notation": "13/4",
                "equity": 0.165,
                "equityLoss": 0.281,
                "win": 0.536,
                "winGammon": 0.158,
                "winBackgammon": 0.009,
                "loseWin": 0.464,
                "loseGammon": 0.127,
                "loseBackgammon": 0.004
            },
            {
                "rank": 5,
                "notation": "16/7",
                "equity": 0.159,
                "equityLoss": 0.286,
                "win": 0.534,
                "winGammon": 0.154,
                "winBackgammon": 0.008,
                "loseWin": 0.466,
                "loseGammon": 0.122,
                "loseBackgammon": 0.004
            }
        ]
    },
    {
        "id": "btcore5k_3ply_38_54",
        "xgid": "XGID=-b--BBC-B-A-bD---bbg----A-:0:0:1:54:2:2:0:5:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            5,
            4
        ],
        "gnubgTimeMs": 1343,
        "moves": [
            {
                "rank": 1,
                "notation": "24/15",
                "equity": 0.959,
                "equityLoss": 0,
                "win": 0.777,
                "winGammon": 0.129,
                "winBackgammon": 0.006,
                "loseWin": 0.223,
                "loseGammon": 0.033,
                "loseBackgammon": 0.001
            },
            {
                "rank": 2,
                "notation": "13/9 13/8",
                "equity": 0.952,
                "equityLoss": 0.007,
                "win": 0.733,
                "winGammon": 0.223,
                "winBackgammon": 0.016,
                "loseWin": 0.267,
                "loseGammon": 0.058,
                "loseBackgammon": 0.002
            },
            {
                "rank": 3,
                "notation": "13/9 10/5",
                "equity": 0.94,
                "equityLoss": 0.019,
                "win": 0.729,
                "winGammon": 0.217,
                "winBackgammon": 0.015,
                "loseWin": 0.271,
                "loseGammon": 0.055,
                "loseBackgammon": 0.001
            },
            {
                "rank": 4,
                "notation": "13/8 10/6",
                "equity": 0.935,
                "equityLoss": 0.024,
                "win": 0.72,
                "winGammon": 0.204,
                "winBackgammon": 0.016,
                "loseWin": 0.28,
                "loseGammon": 0.055,
                "loseBackgammon": 0.001
            },
            {
                "rank": 5,
                "notation": "13/4",
                "equity": 0.922,
                "equityLoss": 0.037,
                "win": 0.715,
                "winGammon": 0.217,
                "winBackgammon": 0.017,
                "loseWin": 0.285,
                "loseGammon": 0.061,
                "loseBackgammon": 0.002
            }
        ]
    },
    {
        "id": "btcore5k_3ply_39_51",
        "xgid": "XGID=-b--BBD-C----Ca--cbg----A-:0:0:1:51:2:2:0:5:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            5,
            1
        ],
        "gnubgTimeMs": 1343,
        "moves": [
            {
                "rank": 1,
                "notation": "13/7",
                "equity": 0.92,
                "equityLoss": 0,
                "win": 0.713,
                "winGammon": 0.218,
                "winBackgammon": 0.014,
                "loseWin": 0.287,
                "loseGammon": 0.065,
                "loseBackgammon": 0.002
            },
            {
                "rank": 2,
                "notation": "13/8 6/5",
                "equity": 0.916,
                "equityLoss": 0.003,
                "win": 0.719,
                "winGammon": 0.194,
                "winBackgammon": 0.015,
                "loseWin": 0.281,
                "loseGammon": 0.054,
                "loseBackgammon": 0.001
            },
            {
                "rank": 3,
                "notation": "8/3 6/5",
                "equity": 0.89,
                "equityLoss": 0.03,
                "win": 0.697,
                "winGammon": 0.214,
                "winBackgammon": 0.015,
                "loseWin": 0.303,
                "loseGammon": 0.079,
                "loseBackgammon": 0.003
            },
            {
                "rank": 4,
                "notation": "24/23 13/8",
                "equity": 0.883,
                "equityLoss": 0.037,
                "win": 0.707,
                "winGammon": 0.189,
                "winBackgammon": 0.014,
                "loseWin": 0.293,
                "loseGammon": 0.059,
                "loseBackgammon": 0.001
            },
            {
                "rank": 5,
                "notation": "13/12 13/8",
                "equity": 0.838,
                "equityLoss": 0.082,
                "win": 0.697,
                "winGammon": 0.189,
                "winBackgammon": 0.014,
                "loseWin": 0.303,
                "loseGammon": 0.059,
                "loseBackgammon": 0.002
            }
        ]
    },
    {
        "id": "btcore5k_3ply_40_51",
        "xgid": "XGID=-bB-CBB-C----B-A-abd-aabb-:0:0:1:51:2:2:0:5:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            5,
            1
        ],
        "gnubgTimeMs": 1343,
        "moves": [
            {
                "rank": 1,
                "notation": "8/3 4/3",
                "equity": 1.065,
                "equityLoss": 0,
                "win": 0.868,
                "winGammon": 0.153,
                "winBackgammon": 0.004,
                "loseWin": 0.132,
                "loseGammon": 0.008,
                "loseBackgammon": 0
            },
            {
                "rank": 2,
                "notation": "15/9",
                "equity": 0.988,
                "equityLoss": 0.077,
                "win": 0.819,
                "winGammon": 0.123,
                "winBackgammon": 0.005,
                "loseWin": 0.181,
                "loseGammon": 0.012,
                "loseBackgammon": 0
            },
            {
                "rank": 3,
                "notation": "15/10 13/12",
                "equity": 0.978,
                "equityLoss": 0.088,
                "win": 0.805,
                "winGammon": 0.139,
                "winBackgammon": 0.01,
                "loseWin": 0.195,
                "loseGammon": 0.025,
                "loseBackgammon": 0.001
            },
            {
                "rank": 4,
                "notation": "15/14 13/8",
                "equity": 0.974,
                "equityLoss": 0.092,
                "win": 0.804,
                "winGammon": 0.11,
                "winBackgammon": 0.004,
                "loseWin": 0.196,
                "loseGammon": 0.012,
                "loseBackgammon": 0
            },
            {
                "rank": 5,
                "notation": "8/2",
                "equity": 0.973,
                "equityLoss": 0.092,
                "win": 0.801,
                "winGammon": 0.114,
                "winBackgammon": 0.004,
                "loseWin": 0.199,
                "loseGammon": 0.015,
                "loseBackgammon": 0
            }
        ]
    },
    {
        "id": "btcore5k_3ply_41_44",
        "xgid": "XGID=-bBBBBB-B----B-A-aac-bbbb-:0:0:1:44:2:2:0:5:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            4,
            4
        ],
        "gnubgTimeMs": 1343,
        "moves": [
            {
                "rank": 1,
                "notation": "13/5(2)",
                "equity": 1.036,
                "equityLoss": 0,
                "win": 0.872,
                "winGammon": 0.13,
                "winBackgammon": 0.004,
                "loseWin": 0.128,
                "loseGammon": 0.005,
                "loseBackgammon": 0
            },
            {
                "rank": 2,
                "notation": "13/9(2) 8/4(2)",
                "equity": 1.027,
                "equityLoss": 0.009,
                "win": 0.865,
                "winGammon": 0.133,
                "winBackgammon": 0.004,
                "loseWin": 0.135,
                "loseGammon": 0.007,
                "loseBackgammon": 0
            },
            {
                "rank": 3,
                "notation": "13/5 8/4(2)",
                "equity": 1.005,
                "equityLoss": 0.03,
                "win": 0.858,
                "winGammon": 0.138,
                "winBackgammon": 0.004,
                "loseWin": 0.142,
                "loseGammon": 0.01,
                "loseBackgammon": 0
            },
            {
                "rank": 4,
                "notation": "15/3 8/4",
                "equity": 0.963,
                "equityLoss": 0.073,
                "win": 0.841,
                "winGammon": 0.135,
                "winBackgammon": 0.005,
                "loseWin": 0.159,
                "loseGammon": 0.016,
                "loseBackgammon": 0
            },
            {
                "rank": 5,
                "notation": "15/3 13/9",
                "equity": 0.894,
                "equityLoss": 0.142,
                "win": 0.828,
                "winGammon": 0.128,
                "winBackgammon": 0.004,
                "loseWin": 0.172,
                "loseGammon": 0.028,
                "loseBackgammon": 0
            }
        ]
    },
    {
        "id": "btcore5k_3ply_42_63",
        "xgid": "XGID=-bBBBDB-B------A--bb-bbbc-:0:0:1:63:2:2:0:5:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            6,
            3
        ],
        "gnubgTimeMs": 1343,
        "moves": [
            {
                "rank": 1,
                "notation": "15/6",
                "equity": 1.077,
                "equityLoss": 0,
                "win": 0.903,
                "winGammon": 0.118,
                "winBackgammon": 0.003,
                "loseWin": 0.097,
                "loseGammon": 0.002,
                "loseBackgammon": 0
            },
            {
                "rank": 2,
                "notation": "8/5 8/2",
                "equity": 1.066,
                "equityLoss": 0.01,
                "win": 0.896,
                "winGammon": 0.128,
                "winBackgammon": 0.004,
                "loseWin": 0.104,
                "loseGammon": 0.002,
                "loseBackgammon": 0
            },
            {
                "rank": 3,
                "notation": "15/9 5/2",
                "equity": 1.004,
                "equityLoss": 0.073,
                "win": 0.873,
                "winGammon": 0.11,
                "winBackgammon": 0.003,
                "loseWin": 0.127,
                "loseGammon": 0.004,
                "loseBackgammon": 0
            },
            {
                "rank": 4,
                "notation": "8/2 5/2",
                "equity": 0.968,
                "equityLoss": 0.109,
                "win": 0.858,
                "winGammon": 0.114,
                "winBackgammon": 0.004,
                "loseWin": 0.142,
                "loseGammon": 0.009,
                "loseBackgammon": 0
            },
            {
                "rank": 5,
                "notation": "15/12 8/2",
                "equity": 0.941,
                "equityLoss": 0.136,
                "win": 0.854,
                "winGammon": 0.122,
                "winBackgammon": 0.004,
                "loseWin": 0.146,
                "loseGammon": 0.012,
                "loseBackgammon": 0
            }
        ]
    },
    {
        "id": "btcore5k_3ply_43_42",
        "xgid": "XGID=-bBBBDC-B-----------bdbbc-:0:0:1:42:2:2:0:5:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            4,
            2
        ],
        "gnubgTimeMs": 1343,
        "moves": [
            {
                "rank": 1,
                "notation": "8/6 8/4",
                "equity": 1.119,
                "equityLoss": 0,
                "win": 0.93,
                "winGammon": 0.128,
                "winBackgammon": 0.005,
                "loseWin": 0.07,
                "loseGammon": 0,
                "loseBackgammon": 0
            },
            {
                "rank": 2,
                "notation": "8/4 5/3",
                "equity": 1.067,
                "equityLoss": 0.052,
                "win": 0.908,
                "winGammon": 0.126,
                "winBackgammon": 0.004,
                "loseWin": 0.092,
                "loseGammon": 0.003,
                "loseBackgammon": 0
            },
            {
                "rank": 3,
                "notation": "6/2 5/3",
                "equity": 1.066,
                "equityLoss": 0.054,
                "win": 0.911,
                "winGammon": 0.104,
                "winBackgammon": 0.003,
                "loseWin": 0.089,
                "loseGammon": 0.002,
                "loseBackgammon": 0
            },
            {
                "rank": 4,
                "notation": "8/2",
                "equity": 1.05,
                "equityLoss": 0.069,
                "win": 0.905,
                "winGammon": 0.112,
                "winBackgammon": 0.004,
                "loseWin": 0.095,
                "loseGammon": 0.001,
                "loseBackgammon": 0
            },
            {
                "rank": 5,
                "notation": "8/4 6/4",
                "equity": 1.048,
                "equityLoss": 0.071,
                "win": 0.901,
                "winGammon": 0.111,
                "winBackgammon": 0.004,
                "loseWin": 0.099,
                "loseGammon": 0.001,
                "loseBackgammon": 0
            }
        ]
    },
    {
        "id": "btcore5k_3ply_46_43",
        "xgid": "XGID=-a----E-D---dD-b-b-d-b-B--:0:0:1:43:2:2:0:5:8",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "dice": [
            4,
            3
        ],
        "gnubgTimeMs": 1343,
        "moves": [
            {
                "rank": 1,
                "notation": "13/10 13/9",
                "equity": -0.727,
                "equityLoss": 0,
                "win": 0.334,
                "winGammon": 0.076,
                "winBackgammon": 0.002,
                "loseWin": 0.666,
                "loseGammon": 0.149,
                "loseBackgammon": 0.006
            },
            {
                "rank": 2,
                "notation": "13/10 8/4",
                "equity": -0.796,
                "equityLoss": 0.069,
                "win": 0.331,
                "winGammon": 0.075,
                "winBackgammon": 0.002,
                "loseWin": 0.669,
                "loseGammon": 0.172,
                "loseBackgammon": 0.009
            },
            {
                "rank": 3,
                "notation": "13/9 8/5",
                "equity": -0.797,
                "equityLoss": 0.071,
                "win": 0.33,
                "winGammon": 0.074,
                "winBackgammon": 0.002,
                "loseWin": 0.67,
                "loseGammon": 0.169,
                "loseBackgammon": 0.008
            },
            {
                "rank": 4,
                "notation": "13/6",
                "equity": -0.82,
                "equityLoss": 0.093,
                "win": 0.319,
                "winGammon": 0.068,
                "winBackgammon": 0.002,
                "loseWin": 0.681,
                "loseGammon": 0.146,
                "loseBackgammon": 0.005
            },
            {
                "rank": 5,
                "notation": "8/1*",
                "equity": -0.862,
                "equityLoss": 0.135,
                "win": 0.317,
                "winGammon": 0.069,
                "winBackgammon": 0.001,
                "loseWin": 0.683,
                "loseGammon": 0.159,
                "loseBackgammon": 0.007
            }
        ]
    },
    {
        "id": "btcore5k_3ply_47_25",
        "xgid": "XGID=-a----G-D---cB---c-dbb-B--:0:0:1:25:2:2:0:5:8",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "dice": [
            2,
            5
        ],
        "gnubgTimeMs": 917,
        "moves": [
            {
                "rank": 1,
                "notation": "13/11 13/8",
                "equity": -1,
                "equityLoss": 0,
                "win": 0.222,
                "winGammon": 0.035,
                "winBackgammon": 0.001,
                "loseWin": 0.778,
                "loseGammon": 0.166,
                "loseBackgammon": 0.007
            },
            {
                "rank": 2,
                "notation": "8/1*",
                "equity": -1.022,
                "equityLoss": 0.022,
                "win": 0.225,
                "winGammon": 0.038,
                "winBackgammon": 0.001,
                "loseWin": 0.775,
                "loseGammon": 0.199,
                "loseBackgammon": 0.011
            },
            {
                "rank": 3,
                "notation": "13/11 6/1*",
                "equity": -1.061,
                "equityLoss": 0.061,
                "win": 0.211,
                "winGammon": 0.033,
                "winBackgammon": 0.001,
                "loseWin": 0.789,
                "loseGammon": 0.203,
                "loseBackgammon": 0.012
            },
            {
                "rank": 4,
                "notation": "8/6 8/3",
                "equity": -1.063,
                "equityLoss": 0.063,
                "win": 0.213,
                "winGammon": 0.038,
                "winBackgammon": 0.001,
                "loseWin": 0.787,
                "loseGammon": 0.227,
                "loseBackgammon": 0.013
            },
            {
                "rank": 5,
                "notation": "6/4 6/1*",
                "equity": -1.064,
                "equityLoss": 0.064,
                "win": 0.232,
                "winGammon": 0.038,
                "winBackgammon": 0.001,
                "loseWin": 0.768,
                "loseGammon": 0.236,
                "loseBackgammon": 0.015
            }
        ]
    },
    {
        "id": "btcore5k_3ply_50_11",
        "xgid": "XGID=-b----E-C--AdD---d-e---AA-:0:0:1:11:3:3:0:7:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            1,
            1
        ],
        "gnubgTimeMs": 917,
        "moves": [
            {
                "rank": 1,
                "notation": "8/7(2) 6/5(2)",
                "equity": 0.448,
                "equityLoss": 0,
                "win": 0.588,
                "winGammon": 0.187,
                "winBackgammon": 0.009,
                "loseWin": 0.412,
                "loseGammon": 0.117,
                "loseBackgammon": 0.005
            },
            {
                "rank": 2,
                "notation": "23/22 11/10 6/5(2)",
                "equity": 0.388,
                "equityLoss": 0.06,
                "win": 0.577,
                "winGammon": 0.178,
                "winBackgammon": 0.009,
                "loseWin": 0.423,
                "loseGammon": 0.114,
                "loseBackgammon": 0.004
            },
            {
                "rank": 3,
                "notation": "23/21 6/5(2)",
                "equity": 0.368,
                "equityLoss": 0.081,
                "win": 0.574,
                "winGammon": 0.169,
                "winBackgammon": 0.008,
                "loseWin": 0.426,
                "loseGammon": 0.108,
                "loseBackgammon": 0.004
            },
            {
                "rank": 4,
                "notation": "24/23 11/10 6/5(2)",
                "equity": 0.349,
                "equityLoss": 0.099,
                "win": 0.565,
                "winGammon": 0.177,
                "winBackgammon": 0.007,
                "loseWin": 0.435,
                "loseGammon": 0.108,
                "loseBackgammon": 0.004
            },
            {
                "rank": 5,
                "notation": "11/9 6/5(2)",
                "equity": 0.346,
                "equityLoss": 0.102,
                "win": 0.568,
                "winGammon": 0.177,
                "winBackgammon": 0.008,
                "loseWin": 0.432,
                "loseGammon": 0.117,
                "loseBackgammon": 0.005
            }
        ]
    },
    {
        "id": "btcore5k_3ply_51_34",
        "xgid": "XGID=-a---CB-C-aAdD---d-e---B--:0:0:1:34:3:3:0:7:8",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "dice": [
            3,
            4
        ],
        "gnubgTimeMs": 917,
        "moves": [
            {
                "rank": 1,
                "notation": "13/10* 13/9",
                "equity": 0.645,
                "equityLoss": 0,
                "win": 0.612,
                "winGammon": 0.208,
                "winBackgammon": 0.009,
                "loseWin": 0.388,
                "loseGammon": 0.096,
                "loseBackgammon": 0.004
            },
            {
                "rank": 2,
                "notation": "13/10*/6",
                "equity": 0.601,
                "equityLoss": 0.044,
                "win": 0.607,
                "winGammon": 0.212,
                "winBackgammon": 0.008,
                "loseWin": 0.393,
                "loseGammon": 0.094,
                "loseBackgammon": 0.003
            },
            {
                "rank": 3,
                "notation": "13/10* 11/7",
                "equity": 0.541,
                "equityLoss": 0.105,
                "win": 0.598,
                "winGammon": 0.192,
                "winBackgammon": 0.008,
                "loseWin": 0.402,
                "loseGammon": 0.099,
                "loseBackgammon": 0.004
            },
            {
                "rank": 4,
                "notation": "13/10* 8/4",
                "equity": 0.356,
                "equityLoss": 0.289,
                "win": 0.57,
                "winGammon": 0.194,
                "winBackgammon": 0.012,
                "loseWin": 0.43,
                "loseGammon": 0.115,
                "loseBackgammon": 0.006
            },
            {
                "rank": 5,
                "notation": "13/10* 5/1*",
                "equity": 0.349,
                "equityLoss": 0.296,
                "win": 0.559,
                "winGammon": 0.206,
                "winBackgammon": 0.008,
                "loseWin": 0.441,
                "loseGammon": 0.104,
                "loseBackgammon": 0.005
            }
        ]
    },
    {
        "id": "btcore5k_3ply_53_55",
        "xgid": "XGID=-a---CC-C-B-eB---c-f---B--:0:0:1:55:3:3:0:7:8",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "dice": [
            5,
            5
        ],
        "gnubgTimeMs": 917,
        "moves": [
            {
                "rank": 1,
                "notation": "23/13(2)",
                "equity": 0.979,
                "equityLoss": 0,
                "win": 0.763,
                "winGammon": 0.132,
                "winBackgammon": 0.002,
                "loseWin": 0.237,
                "loseGammon": 0.025,
                "loseBackgammon": 0.001
            },
            {
                "rank": 2,
                "notation": "23/18(2) 8/3(2)",
                "equity": 0.914,
                "equityLoss": 0.065,
                "win": 0.683,
                "winGammon": 0.242,
                "winBackgammon": 0.004,
                "loseWin": 0.317,
                "loseGammon": 0.051,
                "loseBackgammon": 0.001
            },
            {
                "rank": 3,
                "notation": "23/13 8/3(2)",
                "equity": 0.867,
                "equityLoss": 0.111,
                "win": 0.675,
                "winGammon": 0.258,
                "winBackgammon": 0.005,
                "loseWin": 0.325,
                "loseGammon": 0.062,
                "loseBackgammon": 0.002
            },
            {
                "rank": 4,
                "notation": "13/3(2)",
                "equity": 0.723,
                "equityLoss": 0.256,
                "win": 0.627,
                "winGammon": 0.272,
                "winBackgammon": 0.008,
                "loseWin": 0.373,
                "loseGammon": 0.071,
                "loseBackgammon": 0.002
            },
            {
                "rank": 5,
                "notation": "13/3 8/3 6/1*",
                "equity": 0.719,
                "equityLoss": 0.259,
                "win": 0.616,
                "winGammon": 0.299,
                "winBackgammon": 0.007,
                "loseWin": 0.384,
                "loseGammon": 0.079,
                "loseBackgammon": 0.003
            }
        ]
    },
    {
        "id": "btcore5k_3ply_54_45",
        "xgid": "XGID=--aB-CC-A-B-eB---cBe----a-:0:0:1:45:3:3:0:7:8",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "dice": [
            4,
            5
        ],
        "gnubgTimeMs": 917,
        "moves": [
            {
                "rank": 1,
                "notation": "13/8 6/2*",
                "equity": 1.094,
                "equityLoss": 0,
                "win": 0.732,
                "winGammon": 0.383,
                "winBackgammon": 0.009,
                "loseWin": 0.268,
                "loseGammon": 0.058,
                "loseBackgammon": 0.001
            },
            {
                "rank": 2,
                "notation": "13/9 13/8",
                "equity": 1.086,
                "equityLoss": 0.008,
                "win": 0.743,
                "winGammon": 0.34,
                "winBackgammon": 0.005,
                "loseWin": 0.257,
                "loseGammon": 0.041,
                "loseBackgammon": 0.001
            },
            {
                "rank": 3,
                "notation": "13/8 10/6",
                "equity": 1.02,
                "equityLoss": 0.074,
                "win": 0.704,
                "winGammon": 0.316,
                "winBackgammon": 0.007,
                "loseWin": 0.296,
                "loseGammon": 0.052,
                "loseBackgammon": 0.001
            },
            {
                "rank": 4,
                "notation": "8/3 6/2*",
                "equity": 1.008,
                "equityLoss": 0.086,
                "win": 0.703,
                "winGammon": 0.337,
                "winBackgammon": 0.007,
                "loseWin": 0.297,
                "loseGammon": 0.062,
                "loseBackgammon": 0.001
            },
            {
                "rank": 5,
                "notation": "13/8 5/1",
                "equity": 0.959,
                "equityLoss": 0.135,
                "win": 0.688,
                "winGammon": 0.307,
                "winBackgammon": 0.005,
                "loseWin": 0.312,
                "loseGammon": 0.061,
                "loseBackgammon": 0.001
            }
        ]
    },
    {
        "id": "btcore5k_3ply_55_55",
        "xgid": "XGID=-AaC-BC---B-eB---bBd--b-a-:0:0:1:55:3:3:0:7:8",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "dice": [
            5,
            5
        ],
        "gnubgTimeMs": 917,
        "moves": [
            {
                "rank": 1,
                "notation": "18/8(2)",
                "equity": 1.158,
                "equityLoss": 0,
                "win": 0.81,
                "winGammon": 0.319,
                "winBackgammon": 0.004,
                "loseWin": 0.19,
                "loseGammon": 0.036,
                "loseBackgammon": 0.001
            },
            {
                "rank": 2,
                "notation": "13/8(2) 10/5 6/1",
                "equity": 1.096,
                "equityLoss": 0.062,
                "win": 0.737,
                "winGammon": 0.363,
                "winBackgammon": 0.004,
                "loseWin": 0.263,
                "loseGammon": 0.055,
                "loseBackgammon": 0.002
            },
            {
                "rank": 3,
                "notation": "18/13(2) 10/5 6/1",
                "equity": 1.065,
                "equityLoss": 0.093,
                "win": 0.778,
                "winGammon": 0.271,
                "winBackgammon": 0.003,
                "loseWin": 0.222,
                "loseGammon": 0.04,
                "loseBackgammon": 0.001
            },
            {
                "rank": 4,
                "notation": "18/13(2) 10/5(2)",
                "equity": 1.033,
                "equityLoss": 0.125,
                "win": 0.76,
                "winGammon": 0.267,
                "winBackgammon": 0.003,
                "loseWin": 0.24,
                "loseGammon": 0.043,
                "loseBackgammon": 0.001
            },
            {
                "rank": 5,
                "notation": "18/8 13/8(2)",
                "equity": 1.014,
                "equityLoss": 0.144,
                "win": 0.734,
                "winGammon": 0.305,
                "winBackgammon": 0.007,
                "loseWin": 0.266,
                "loseGammon": 0.056,
                "loseBackgammon": 0.002
            }
        ]
    },
    {
        "id": "btcore5k_3ply_56_33",
        "xgid": "XGID=-AaC-BC-B-B-dB-a-b-c--b-b-:0:0:1:33:3:3:0:7:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            3,
            3
        ],
        "gnubgTimeMs": 917,
        "moves": [
            {
                "rank": 1,
                "notation": "10/4(2)",
                "equity": 1.261,
                "equityLoss": 0,
                "win": 0.858,
                "winGammon": 0.359,
                "winBackgammon": 0.003,
                "loseWin": 0.142,
                "loseGammon": 0.027,
                "loseBackgammon": 0.001
            },
            {
                "rank": 2,
                "notation": "8/2*(2)",
                "equity": 1.189,
                "equityLoss": 0.072,
                "win": 0.782,
                "winGammon": 0.401,
                "winBackgammon": 0.003,
                "loseWin": 0.218,
                "loseGammon": 0.05,
                "loseBackgammon": 0.001
            },
            {
                "rank": 3,
                "notation": "13/7(2)",
                "equity": 1.174,
                "equityLoss": 0.088,
                "win": 0.867,
                "winGammon": 0.269,
                "winBackgammon": 0.002,
                "loseWin": 0.133,
                "loseGammon": 0.016,
                "loseBackgammon": 0
            },
            {
                "rank": 4,
                "notation": "13/1",
                "equity": 1.064,
                "equityLoss": 0.197,
                "win": 0.775,
                "winGammon": 0.28,
                "winBackgammon": 0.004,
                "loseWin": 0.225,
                "loseGammon": 0.034,
                "loseBackgammon": 0.001
            },
            {
                "rank": 5,
                "notation": "13/7 10/7(2)",
                "equity": 1.041,
                "equityLoss": 0.221,
                "win": 0.783,
                "winGammon": 0.246,
                "winBackgammon": 0.004,
                "loseWin": 0.217,
                "loseGammon": 0.034,
                "loseBackgammon": 0.001
            }
        ]
    },
    {
        "id": "btcore5k_3ply_60_52",
        "xgid": "XGID=-b-B--D-C---cD---d-db--AA-:0:0:1:52:3:3:0:7:8",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "dice": [
            5,
            2
        ],
        "gnubgTimeMs": 917,
        "moves": [
            {
                "rank": 1,
                "notation": "23/16",
                "equity": -0.22,
                "equityLoss": 0,
                "win": 0.463,
                "winGammon": 0.125,
                "winBackgammon": 0.006,
                "loseWin": 0.537,
                "loseGammon": 0.182,
                "loseBackgammon": 0.007
            },
            {
                "rank": 2,
                "notation": "13/11 13/8",
                "equity": -0.302,
                "equityLoss": 0.082,
                "win": 0.442,
                "winGammon": 0.136,
                "winBackgammon": 0.008,
                "loseWin": 0.558,
                "loseGammon": 0.197,
                "loseBackgammon": 0.009
            },
            {
                "rank": 3,
                "notation": "23/21 13/8",
                "equity": -0.304,
                "equityLoss": 0.084,
                "win": 0.442,
                "winGammon": 0.131,
                "winBackgammon": 0.007,
                "loseWin": 0.558,
                "loseGammon": 0.186,
                "loseBackgammon": 0.008
            },
            {
                "rank": 4,
                "notation": "23/18 13/11",
                "equity": -0.318,
                "equityLoss": 0.098,
                "win": 0.447,
                "winGammon": 0.128,
                "winBackgammon": 0.007,
                "loseWin": 0.553,
                "loseGammon": 0.208,
                "loseBackgammon": 0.01
            },
            {
                "rank": 5,
                "notation": "13/6",
                "equity": -0.324,
                "equityLoss": 0.104,
                "win": 0.436,
                "winGammon": 0.132,
                "winBackgammon": 0.006,
                "loseWin": 0.564,
                "loseGammon": 0.193,
                "loseBackgammon": 0.008
            }
        ]
    },
    {
        "id": "btcore5k_3ply_61_55",
        "xgid": "XGID=-b-B--D-C----D----Ab-bdcbA:0:0:1:55:3:3:0:7:8",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "dice": [
            5,
            5
        ],
        "gnubgTimeMs": 917,
        "moves": [
            {
                "rank": 1,
                "notation": "bar/15 13/3",
                "equity": -0.07,
                "equityLoss": 0,
                "win": 0.493,
                "winGammon": 0.084,
                "winBackgammon": 0.003,
                "loseWin": 0.507,
                "loseGammon": 0.129,
                "loseBackgammon": 0.001
            },
            {
                "rank": 2,
                "notation": "bar/15 13/8(2)",
                "equity": -0.091,
                "equityLoss": 0.021,
                "win": 0.49,
                "winGammon": 0.084,
                "winBackgammon": 0.002,
                "loseWin": 0.51,
                "loseGammon": 0.134,
                "loseBackgammon": 0.001
            },
            {
                "rank": 3,
                "notation": "bar/15 18/8",
                "equity": -0.119,
                "equityLoss": 0.049,
                "win": 0.485,
                "winGammon": 0.084,
                "winBackgammon": 0.003,
                "loseWin": 0.515,
                "loseGammon": 0.137,
                "loseBackgammon": 0.002
            },
            {
                "rank": 4,
                "notation": "bar/20 18/8 13/8",
                "equity": -0.164,
                "equityLoss": 0.095,
                "win": 0.473,
                "winGammon": 0.085,
                "winBackgammon": 0.003,
                "loseWin": 0.527,
                "loseGammon": 0.142,
                "loseBackgammon": 0.001
            },
            {
                "rank": 5,
                "notation": "bar/10 18/13",
                "equity": -0.168,
                "equityLoss": 0.099,
                "win": 0.471,
                "winGammon": 0.083,
                "winBackgammon": 0.003,
                "loseWin": 0.529,
                "loseGammon": 0.168,
                "loseBackgammon": 0.002
            }
        ]
    },
    {
        "id": "btcore5k_3ply_62_33",
        "xgid": "XGID=-b-B--D-E----B-A--A--bdcd-:0:0:1:33:3:3:0:7:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            3,
            3
        ],
        "gnubgTimeMs": 917,
        "moves": [
            {
                "rank": 1,
                "notation": "18/15 8/5(3)",
                "equity": 0.97,
                "equityLoss": 0,
                "win": 0.758,
                "winGammon": 0.203,
                "winBackgammon": 0.007,
                "loseWin": 0.242,
                "loseGammon": 0.046,
                "loseBackgammon": 0
            },
            {
                "rank": 2,
                "notation": "8/5(3) 6/3",
                "equity": 0.967,
                "equityLoss": 0.003,
                "win": 0.755,
                "winGammon": 0.204,
                "winBackgammon": 0.007,
                "loseWin": 0.245,
                "loseGammon": 0.054,
                "loseBackgammon": 0
            },
            {
                "rank": 3,
                "notation": "13/10(2) 8/5(2)",
                "equity": 0.937,
                "equityLoss": 0.033,
                "win": 0.752,
                "winGammon": 0.205,
                "winBackgammon": 0.007,
                "loseWin": 0.248,
                "loseGammon": 0.044,
                "loseBackgammon": 0
            },
            {
                "rank": 4,
                "notation": "15/12 8/5(3)",
                "equity": 0.915,
                "equityLoss": 0.055,
                "win": 0.753,
                "winGammon": 0.198,
                "winBackgammon": 0.007,
                "loseWin": 0.247,
                "loseGammon": 0.054,
                "loseBackgammon": 0
            },
            {
                "rank": 5,
                "notation": "18/12 8/5(2)",
                "equity": 0.913,
                "equityLoss": 0.057,
                "win": 0.757,
                "winGammon": 0.19,
                "winBackgammon": 0.007,
                "loseWin": 0.243,
                "loseGammon": 0.047,
                "loseBackgammon": 0
            }
        ]
    },
    {
        "id": "btcore5k_3ply_63_12",
        "xgid": "XGID=-a-B-CD-B---aB-B-----bdcd-:0:0:1:12:3:3:0:7:8",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "dice": [
            1,
            2
        ],
        "gnubgTimeMs": 1354,
        "moves": [
            {
                "rank": 1,
                "notation": "15/12*",
                "equity": 1.005,
                "equityLoss": 0,
                "win": 0.783,
                "winGammon": 0.217,
                "winBackgammon": 0.006,
                "loseWin": 0.217,
                "loseGammon": 0.044,
                "loseBackgammon": 0
            },
            {
                "rank": 2,
                "notation": "13/12* 13/11",
                "equity": 0.999,
                "equityLoss": 0.006,
                "win": 0.764,
                "winGammon": 0.214,
                "winBackgammon": 0.007,
                "loseWin": 0.236,
                "loseGammon": 0.045,
                "loseBackgammon": 0
            },
            {
                "rank": 3,
                "notation": "13/12* 5/3",
                "equity": 0.985,
                "equityLoss": 0.02,
                "win": 0.749,
                "winGammon": 0.198,
                "winBackgammon": 0.006,
                "loseWin": 0.251,
                "loseGammon": 0.047,
                "loseBackgammon": 0
            },
            {
                "rank": 4,
                "notation": "13/12*/10",
                "equity": 0.98,
                "equityLoss": 0.025,
                "win": 0.781,
                "winGammon": 0.226,
                "winBackgammon": 0.007,
                "loseWin": 0.219,
                "loseGammon": 0.046,
                "loseBackgammon": 0
            },
            {
                "rank": 5,
                "notation": "6/4 5/4",
                "equity": 0.832,
                "equityLoss": 0.173,
                "win": 0.738,
                "winGammon": 0.072,
                "winBackgammon": 0.002,
                "loseWin": 0.262,
                "loseGammon": 0.052,
                "loseBackgammon": 0
            }
        ]
    },
    {
        "id": "btcore5k_3ply_69_54",
        "xgid": "XGID=-b----E-CA--cD--ad-e---AA-:0:0:1:54:4:4:0:9:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            5,
            4
        ],
        "gnubgTimeMs": 1354,
        "moves": [
            {
                "rank": 1,
                "notation": "9/4 8/4",
                "equity": 0.057,
                "equityLoss": 0,
                "win": 0.514,
                "winGammon": 0.159,
                "winBackgammon": 0.008,
                "loseWin": 0.486,
                "loseGammon": 0.15,
                "loseBackgammon": 0.006
            },
            {
                "rank": 2,
                "notation": "23/18 13/9",
                "equity": 0.032,
                "equityLoss": 0.025,
                "win": 0.515,
                "winGammon": 0.138,
                "winBackgammon": 0.007,
                "loseWin": 0.485,
                "loseGammon": 0.148,
                "loseBackgammon": 0.006
            },
            {
                "rank": 3,
                "notation": "13/9 13/8",
                "equity": 0.014,
                "equityLoss": 0.044,
                "win": 0.508,
                "winGammon": 0.148,
                "winBackgammon": 0.008,
                "loseWin": 0.492,
                "loseGammon": 0.157,
                "loseBackgammon": 0.006
            },
            {
                "rank": 4,
                "notation": "23/14",
                "equity": -0.069,
                "equityLoss": 0.126,
                "win": 0.491,
                "winGammon": 0.127,
                "winBackgammon": 0.006,
                "loseWin": 0.509,
                "loseGammon": 0.163,
                "loseBackgammon": 0.007
            },
            {
                "rank": 5,
                "notation": "13/9 8/3",
                "equity": -0.086,
                "equityLoss": 0.144,
                "win": 0.483,
                "winGammon": 0.14,
                "winBackgammon": 0.01,
                "loseWin": 0.517,
                "loseGammon": 0.172,
                "loseBackgammon": 0.01
            }
        ]
    },
    {
        "id": "btcore5k_3ply_75_61",
        "xgid": "XGID=-ADBD-B----------bcbcB-bc-:0:0:1:61:4:4:0:9:8",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "dice": [
            6,
            1
        ],
        "gnubgTimeMs": 1354,
        "moves": [
            {
                "rank": 1,
                "notation": "21/15 2/1",
                "equity": -0.888,
                "equityLoss": 0,
                "win": 0.232,
                "winGammon": 0.003,
                "winBackgammon": 0,
                "loseWin": 0.768,
                "loseGammon": 0.022,
                "loseBackgammon": 0
            },
            {
                "rank": 2,
                "notation": "21/14",
                "equity": -0.944,
                "equityLoss": 0.056,
                "win": 0.221,
                "winGammon": 0.002,
                "winBackgammon": 0,
                "loseWin": 0.779,
                "loseGammon": 0.024,
                "loseBackgammon": 0
            },
            {
                "rank": 3,
                "notation": "21/15 4/3",
                "equity": -0.963,
                "equityLoss": 0.075,
                "win": 0.218,
                "winGammon": 0.002,
                "winBackgammon": 0,
                "loseWin": 0.782,
                "loseGammon": 0.027,
                "loseBackgammon": 0
            },
            {
                "rank": 4,
                "notation": "21/15 6/5",
                "equity": -1,
                "equityLoss": 0.112,
                "win": 0.193,
                "winGammon": 0.008,
                "winBackgammon": 0,
                "loseWin": 0.807,
                "loseGammon": 0.074,
                "loseBackgammon": 0.001
            },
            {
                "rank": 5,
                "notation": "21/15 3/2",
                "equity": -1,
                "equityLoss": 0.112,
                "win": 0.185,
                "winGammon": 0.006,
                "winBackgammon": 0,
                "loseWin": 0.815,
                "loseGammon": 0.065,
                "loseBackgammon": 0.001
            }
        ]
    },
    {
        "id": "btcore5k_3ply_80_26",
        "xgid": "XGID=-b----E-D---bD--ae-eA---A-:0:0:1:26:4:4:0:9:8",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "dice": [
            2,
            6
        ],
        "gnubgTimeMs": 1354,
        "moves": [
            {
                "rank": 1,
                "notation": "24/16*",
                "equity": 0.257,
                "equityLoss": 0,
                "win": 0.57,
                "winGammon": 0.147,
                "winBackgammon": 0.009,
                "loseWin": 0.43,
                "loseGammon": 0.115,
                "loseBackgammon": 0.004
            },
            {
                "rank": 2,
                "notation": "24/18 20/18",
                "equity": 0.148,
                "equityLoss": 0.109,
                "win": 0.54,
                "winGammon": 0.12,
                "winBackgammon": 0.004,
                "loseWin": 0.46,
                "loseGammon": 0.101,
                "loseBackgammon": 0.002
            },
            {
                "rank": 3,
                "notation": "20/14 13/11",
                "equity": 0,
                "equityLoss": 0.257,
                "win": 0.51,
                "winGammon": 0.132,
                "winBackgammon": 0.007,
                "loseWin": 0.49,
                "loseGammon": 0.158,
                "loseBackgammon": 0.007
            },
            {
                "rank": 4,
                "notation": "20/14 8/6",
                "equity": -0.089,
                "equityLoss": 0.346,
                "win": 0.485,
                "winGammon": 0.12,
                "winBackgammon": 0.006,
                "loseWin": 0.515,
                "loseGammon": 0.158,
                "loseBackgammon": 0.006
            },
            {
                "rank": 5,
                "notation": "24/22 20/14",
                "equity": -0.095,
                "equityLoss": 0.352,
                "win": 0.488,
                "winGammon": 0.118,
                "winBackgammon": 0.006,
                "loseWin": 0.512,
                "loseGammon": 0.17,
                "loseBackgammon": 0.006
            }
        ]
    },
    {
        "id": "btcore5k_3ply_81_41",
        "xgid": "XGID=-b----E-D---bD---eBe--a---:0:0:1:41:4:4:0:9:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            4,
            1
        ],
        "gnubgTimeMs": 1354,
        "moves": [
            {
                "rank": 1,
                "notation": "13/9 6/5",
                "equity": 0.144,
                "equityLoss": 0,
                "win": 0.539,
                "winGammon": 0.138,
                "winBackgammon": 0.005,
                "loseWin": 0.461,
                "loseGammon": 0.125,
                "loseBackgammon": 0.003
            },
            {
                "rank": 2,
                "notation": "13/9 8/7",
                "equity": 0.097,
                "equityLoss": 0.046,
                "win": 0.528,
                "winGammon": 0.134,
                "winBackgammon": 0.005,
                "loseWin": 0.472,
                "loseGammon": 0.128,
                "loseBackgammon": 0.004
            },
            {
                "rank": 3,
                "notation": "13/8",
                "equity": 0.095,
                "equityLoss": 0.049,
                "win": 0.525,
                "winGammon": 0.114,
                "winBackgammon": 0.004,
                "loseWin": 0.475,
                "loseGammon": 0.103,
                "loseBackgammon": 0.002
            },
            {
                "rank": 4,
                "notation": "8/3",
                "equity": 0.021,
                "equityLoss": 0.123,
                "win": 0.506,
                "winGammon": 0.12,
                "winBackgammon": 0.004,
                "loseWin": 0.494,
                "loseGammon": 0.121,
                "loseBackgammon": 0.003
            },
            {
                "rank": 5,
                "notation": "8/4 6/5",
                "equity": -0.027,
                "equityLoss": 0.17,
                "win": 0.495,
                "winGammon": 0.132,
                "winBackgammon": 0.006,
                "loseWin": 0.505,
                "loseGammon": 0.143,
                "loseBackgammon": 0.005
            }
        ]
    },
    {
        "id": "btcore5k_3ply_82_63",
        "xgid": "XGID=-b----E-E---bC---cBe--ba--:0:0:1:63:4:4:0:9:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            6,
            3
        ],
        "gnubgTimeMs": 1354,
        "moves": [
            {
                "rank": 1,
                "notation": "13/4",
                "equity": -0.105,
                "equityLoss": 0,
                "win": 0.482,
                "winGammon": 0.113,
                "winBackgammon": 0.004,
                "loseWin": 0.518,
                "loseGammon": 0.152,
                "loseBackgammon": 0.003
            },
            {
                "rank": 2,
                "notation": "13/7 8/5",
                "equity": -0.152,
                "equityLoss": 0.047,
                "win": 0.476,
                "winGammon": 0.125,
                "winBackgammon": 0.005,
                "loseWin": 0.524,
                "loseGammon": 0.188,
                "loseBackgammon": 0.005
            },
            {
                "rank": 3,
                "notation": "13/10 8/2",
                "equity": -0.177,
                "equityLoss": 0.071,
                "win": 0.466,
                "winGammon": 0.115,
                "winBackgammon": 0.004,
                "loseWin": 0.534,
                "loseGammon": 0.172,
                "loseBackgammon": 0.004
            },
            {
                "rank": 4,
                "notation": "13/7 6/3",
                "equity": -0.225,
                "equityLoss": 0.119,
                "win": 0.461,
                "winGammon": 0.11,
                "winBackgammon": 0.004,
                "loseWin": 0.539,
                "loseGammon": 0.189,
                "loseBackgammon": 0.005
            },
            {
                "rank": 5,
                "notation": "8/5 8/2",
                "equity": -0.23,
                "equityLoss": 0.125,
                "win": 0.457,
                "winGammon": 0.113,
                "winBackgammon": 0.004,
                "loseWin": 0.543,
                "loseGammon": 0.19,
                "loseBackgammon": 0.005
            }
        ]
    },
    {
        "id": "btcore5k_3ply_83_25",
        "xgid": "XGID=-b--A-E-E---bB---bBd--bc--:0:0:1:25:4:4:0:9:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            2,
            5
        ],
        "gnubgTimeMs": 1354,
        "moves": [
            {
                "rank": 1,
                "notation": "8/3 6/4",
                "equity": 0.2,
                "equityLoss": 0,
                "win": 0.554,
                "winGammon": 0.153,
                "winBackgammon": 0.006,
                "loseWin": 0.446,
                "loseGammon": 0.129,
                "loseBackgammon": 0.002
            },
            {
                "rank": 2,
                "notation": "13/8 6/4",
                "equity": 0.045,
                "equityLoss": 0.155,
                "win": 0.515,
                "winGammon": 0.121,
                "winBackgammon": 0.005,
                "loseWin": 0.485,
                "loseGammon": 0.121,
                "loseBackgammon": 0.002
            },
            {
                "rank": 3,
                "notation": "18/13 6/4",
                "equity": 0.029,
                "equityLoss": 0.17,
                "win": 0.521,
                "winGammon": 0.118,
                "winBackgammon": 0.006,
                "loseWin": 0.479,
                "loseGammon": 0.15,
                "loseBackgammon": 0.001
            },
            {
                "rank": 4,
                "notation": "13/8 4/2",
                "equity": -0.348,
                "equityLoss": 0.548,
                "win": 0.42,
                "winGammon": 0.099,
                "winBackgammon": 0.005,
                "loseWin": 0.58,
                "loseGammon": 0.195,
                "loseBackgammon": 0.003
            },
            {
                "rank": 5,
                "notation": "13/11 13/8",
                "equity": -0.351,
                "equityLoss": 0.55,
                "win": 0.42,
                "winGammon": 0.102,
                "winBackgammon": 0.005,
                "loseWin": 0.58,
                "loseGammon": 0.2,
                "loseBackgammon": 0.004
            }
        ]
    },
    {
        "id": "btcore5k_3ply_84_65",
        "xgid": "XGID=----BbD-E---bC-----d-Acd--:0:0:1:65:4:4:0:9:8",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "dice": [
            6,
            5
        ],
        "gnubgTimeMs": 1354,
        "moves": [
            {
                "rank": 1,
                "notation": "8/3 8/2",
                "equity": 0.09,
                "equityLoss": 0,
                "win": 0.523,
                "winGammon": 0.124,
                "winBackgammon": 0.004,
                "loseWin": 0.477,
                "loseGammon": 0.102,
                "loseBackgammon": 0.001
            },
            {
                "rank": 2,
                "notation": "13/2",
                "equity": -0.004,
                "equityLoss": 0.094,
                "win": 0.497,
                "winGammon": 0.107,
                "winBackgammon": 0.004,
                "loseWin": 0.503,
                "loseGammon": 0.102,
                "loseBackgammon": 0.001
            },
            {
                "rank": 3,
                "notation": "13/7 8/3",
                "equity": -0.005,
                "equityLoss": 0.095,
                "win": 0.503,
                "winGammon": 0.112,
                "winBackgammon": 0.004,
                "loseWin": 0.497,
                "loseGammon": 0.125,
                "loseBackgammon": 0.002
            },
            {
                "rank": 4,
                "notation": "8/2 6/1",
                "equity": -0.039,
                "equityLoss": 0.129,
                "win": 0.488,
                "winGammon": 0.118,
                "winBackgammon": 0.003,
                "loseWin": 0.512,
                "loseGammon": 0.117,
                "loseBackgammon": 0.002
            },
            {
                "rank": 5,
                "notation": "21/15 8/3",
                "equity": -0.12,
                "equityLoss": 0.21,
                "win": 0.469,
                "winGammon": 0.072,
                "winBackgammon": 0.001,
                "loseWin": 0.531,
                "loseGammon": 0.096,
                "loseBackgammon": 0.001
            }
        ]
    },
    {
        "id": "btcore5k_3ply_93_32",
        "xgid": "XGID=-b----E-D---eD---b-d-b-AA-:0:0:1:32:5:5:0:11:8",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "dice": [
            3,
            2
        ],
        "gnubgTimeMs": 1354,
        "moves": [
            {
                "rank": 1,
                "notation": "13/8",
                "equity": -0.244,
                "equityLoss": 0,
                "win": 0.447,
                "winGammon": 0.119,
                "winBackgammon": 0.005,
                "loseWin": 0.553,
                "loseGammon": 0.172,
                "loseBackgammon": 0.007
            },
            {
                "rank": 2,
                "notation": "24/22 23/20",
                "equity": -0.256,
                "equityLoss": 0.012,
                "win": 0.449,
                "winGammon": 0.108,
                "winBackgammon": 0.005,
                "loseWin": 0.551,
                "loseGammon": 0.176,
                "loseBackgammon": 0.006
            },
            {
                "rank": 3,
                "notation": "23/20 13/11",
                "equity": -0.259,
                "equityLoss": 0.015,
                "win": 0.447,
                "winGammon": 0.121,
                "winBackgammon": 0.007,
                "loseWin": 0.553,
                "loseGammon": 0.179,
                "loseBackgammon": 0.009
            },
            {
                "rank": 4,
                "notation": "24/22 13/10",
                "equity": -0.267,
                "equityLoss": 0.023,
                "win": 0.443,
                "winGammon": 0.118,
                "winBackgammon": 0.006,
                "loseWin": 0.557,
                "loseGammon": 0.178,
                "loseBackgammon": 0.007
            },
            {
                "rank": 5,
                "notation": "23/18",
                "equity": -0.281,
                "equityLoss": 0.037,
                "win": 0.446,
                "winGammon": 0.108,
                "winBackgammon": 0.005,
                "loseWin": 0.554,
                "loseGammon": 0.19,
                "loseBackgammon": 0.007
            }
        ]
    },
    {
        "id": "btcore5k_3ply_95_24",
        "xgid": "XGID=-a--B-D-D---eC---c-d-b-AA-:0:0:1:24:5:5:0:11:8",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "dice": [
            2,
            4
        ],
        "gnubgTimeMs": 1354,
        "moves": [
            {
                "rank": 1,
                "notation": "13/11 8/4",
                "equity": -0.215,
                "equityLoss": 0,
                "win": 0.44,
                "winGammon": 0.137,
                "winBackgammon": 0.004,
                "loseWin": 0.56,
                "loseGammon": 0.151,
                "loseBackgammon": 0.006
            },
            {
                "rank": 2,
                "notation": "24/20 13/11",
                "equity": -0.24,
                "equityLoss": 0.025,
                "win": 0.44,
                "winGammon": 0.124,
                "winBackgammon": 0.005,
                "loseWin": 0.56,
                "loseGammon": 0.161,
                "loseBackgammon": 0.005
            },
            {
                "rank": 3,
                "notation": "24/22 8/4",
                "equity": -0.259,
                "equityLoss": 0.044,
                "win": 0.432,
                "winGammon": 0.117,
                "winBackgammon": 0.003,
                "loseWin": 0.568,
                "loseGammon": 0.15,
                "loseBackgammon": 0.004
            },
            {
                "rank": 4,
                "notation": "24/20 8/6",
                "equity": -0.27,
                "equityLoss": 0.055,
                "win": 0.431,
                "winGammon": 0.115,
                "winBackgammon": 0.004,
                "loseWin": 0.569,
                "loseGammon": 0.15,
                "loseBackgammon": 0.004
            },
            {
                "rank": 5,
                "notation": "24/20 6/4",
                "equity": -0.272,
                "equityLoss": 0.057,
                "win": 0.432,
                "winGammon": 0.113,
                "winBackgammon": 0.004,
                "loseWin": 0.568,
                "loseGammon": 0.152,
                "loseBackgammon": 0.004
            }
        ]
    }
];

export const GNUBG_3PLY_BY_XGID = new Map<string, CertifiedGnubg3PlyPosition>(
    GNUBG_3PLY_CERTIFIED_POSITIONS.map((p) => [p.xgid, p]),
);
