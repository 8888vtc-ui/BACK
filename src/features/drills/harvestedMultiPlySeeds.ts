import type { HarvestedSeedInput } from './benchmarkBlunders';

export const HARVESTED_MULTIPLY_9CAT_SEEDS: HarvestedSeedInput[] = [
    {
        "id": "quiz_blitz_attack_0v1_1",
        "tier": 2,
        "xgid": "XGID=aDC-ca----a-bC----aBA-AaeA:0:0:1:53:2:1:0:7:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "bar/22 20/15",
        "optimalMove": "bar/20 13/10",
        "acceptableMoves": [],
        "quizChoices": [
            "bar/20 13/10",
            "bar/22 20/15",
            "bar/20 20/17",
            "bar/20 19/16"
        ],
        "equityLoss": 0.048,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "Le coup joué bar/22 20/15 concède de l'équité (-0.048 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (bar/20 13/10).",
        "explanation": "Le coup optimal certifié 2-ply (bar/20 13/10) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (bar/20...) qui optimise votre structure sur ce lancer 5-3.",
        "commentaryVariants": [
            "Le coup optimal certifié (bar/20 13/10) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne bar/20 13/10 domine mathématiquement en 2-ply face à bar/22 20/15 (-0.048 EMG).",
            "En jouant bar/20 13/10, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    },
    {
        "id": "quiz_blitz_attack_0v1_2",
        "tier": 2,
        "xgid": "XGID=a-EDb-aAaa---------CAaAec-:0:0:1:51:0:0:0:7:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "7/6 6/1",
        "optimalMove": "20/15 22/21",
        "acceptableMoves": [
            "22/21 20/15",
            "22/21 21/16",
            "22/21/16"
        ],
        "quizChoices": [
            "20/15 22/21",
            "7/6 6/1",
            "22/21 21/16",
            "19/14 22/21"
        ],
        "equityLoss": 0.155,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "Le coup joué 7/6 6/1 concède de l'équité (-0.155 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (20/15 22/21).",
        "explanation": "Le coup optimal certifié 2-ply (20/15 22/21) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (20/15...) qui optimise votre structure sur ce lancer 5-1.",
        "commentaryVariants": [
            "Le coup optimal certifié (20/15 22/21) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne 20/15 22/21 domine mathématiquement en 2-ply face à 7/6 6/1 (-0.155 EMG).",
            "En jouant 20/15 22/21, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    },
    {
        "id": "quiz_blitz_attack_0v1_3",
        "tier": 2,
        "xgid": "XGID=abE--b--B-a-eD-AAb-A-aAa--:0:0:1:36:3:4:0:7:8",
        "dice": [
            3,
            6
        ],
        "playedMove": "16/13 19/13",
        "optimalMove": "13/10 13/7",
        "acceptableMoves": [
            "13/10 16/10",
            "16/10 13/10",
            "13/10 19/13",
            "19/10",
            "13/10 15/9",
            "15/9 13/10"
        ],
        "quizChoices": [
            "13/10 13/7",
            "16/13 19/13",
            "13/10 16/10",
            "13/10 19/13"
        ],
        "equityLoss": 0.036,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "Le coup joué 16/13 19/13 concède de l'équité (-0.036 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (13/10 13/7).",
        "explanation": "Le coup optimal certifié 2-ply (13/10 13/7) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (13/10...) qui optimise votre structure sur ce lancer 3-6.",
        "commentaryVariants": [
            "Le coup optimal certifié (13/10 13/7) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne 13/10 13/7 domine mathématiquement en 2-ply face à 16/13 19/13 (-0.036 EMG).",
            "En jouant 13/10 13/7, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    },
    {
        "id": "quiz_backgame_0v1_1",
        "tier": 2,
        "xgid": "XGID=-CaA-B-AAB--c----a-aB-cfC-:0:0:1:43:4:2:0:7:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "7/3 24/21",
        "optimalMove": "7/3 20/17",
        "acceptableMoves": [
            "20/17 7/3"
        ],
        "quizChoices": [
            "7/3 20/17",
            "7/3 24/21",
            "24/20 20/17",
            "20/17 17/13"
        ],
        "equityLoss": 0.061,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "Le coup joué 7/3 24/21 concède de l'équité (-0.061 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (7/3 20/17).",
        "explanation": "Le coup optimal certifié 2-ply (7/3 20/17) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (7/3...) qui optimise votre structure sur ce lancer 4-3.",
        "commentaryVariants": [
            "Le coup optimal certifié (7/3 20/17) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne 7/3 20/17 domine mathématiquement en 2-ply face à 7/3 24/21 (-0.061 EMG).",
            "En jouant 7/3 20/17, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    },
    {
        "id": "quiz_backgame_0v1_2",
        "tier": 2,
        "xgid": "XGID=-HA-----a-----A----B-AB-n-:0:0:1:16:0:0:0:7:8",
        "dice": [
            1,
            6
        ],
        "playedMove": "21/20 20/14",
        "optimalMove": "2/1 14/8",
        "acceptableMoves": [
            "14/8 2/1"
        ],
        "quizChoices": [
            "2/1 14/8",
            "21/20 20/14",
            "14/13 19/13",
            "19/18 14/8"
        ],
        "equityLoss": 0.037,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "Le coup joué 21/20 20/14 concède de l'équité (-0.037 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (2/1 14/8).",
        "explanation": "Le coup optimal certifié 2-ply (2/1 14/8) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (2/1...) qui optimise votre structure sur ce lancer 1-6.",
        "commentaryVariants": [
            "Le coup optimal certifié (2/1 14/8) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne 2/1 14/8 domine mathématiquement en 2-ply face à 21/20 20/14 (-0.037 EMG).",
            "En jouant 2/1 14/8, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    },
    {
        "id": "quiz_backgame_0v1_3",
        "tier": 2,
        "xgid": "XGID=-F-a--C---AAa-----B--cBcg-:0:0:1:46:3:4:0:7:8",
        "dice": [
            4,
            6
        ],
        "playedMove": "6/2 18/12",
        "optimalMove": "18/14 18/12",
        "acceptableMoves": [],
        "quizChoices": [
            "18/14 18/12",
            "6/2 18/12",
            "22/18 18/12",
            "10/6 18/12"
        ],
        "equityLoss": 0.136,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "Le coup joué 6/2 18/12 concède de l'équité (-0.136 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (18/14 18/12).",
        "explanation": "Le coup optimal certifié 2-ply (18/14 18/12) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (18/14...) qui optimise votre structure sur ce lancer 4-6.",
        "commentaryVariants": [
            "Le coup optimal certifié (18/14 18/12) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne 18/14 18/12 domine mathématiquement en 2-ply face à 6/2 18/12 (-0.136 EMG).",
            "En jouant 18/14 18/12, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    },
    {
        "id": "quiz_bearoff_technique_0v1_1",
        "tier": 1,
        "xgid": "XGID=-DA--------A-----A-aaBaFl-:0:0:1:54:0:0:0:7:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "23/18 11/7",
        "optimalMove": "11/6 21/17",
        "acceptableMoves": [
            "21/17 11/6"
        ],
        "quizChoices": [
            "11/6 21/17",
            "23/18 11/7",
            "23/18 21/17",
            "21/16 21/17"
        ],
        "equityLoss": 0.241,
        "verdict": "howler",
        "conceptId": "bearoff_technique",
        "conceptName": "Sortie des Dames (Bearoff)",
        "whyFailed": "Le coup joué 23/18 11/7 concède de l'équité (-0.241 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (11/6 21/17).",
        "explanation": "Le coup optimal certifié 2-ply (11/6 21/17) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (11/6...) qui optimise votre structure sur ce lancer 5-4.",
        "commentaryVariants": [
            "Le coup optimal certifié (11/6 21/17) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne 11/6 21/17 domine mathématiquement en 2-ply face à 23/18 11/7 (-0.241 EMG).",
            "En jouant 11/6 21/17, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    },
    {
        "id": "quiz_bearoff_technique_0v1_2",
        "tier": 2,
        "xgid": "XGID=-GAA-A-A-A------------alC-:0:0:1:51:1:3:0:7:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "9/4 4/3",
        "optimalMove": "24/19 3/2",
        "acceptableMoves": [
            "24/19 7/6",
            "24/19 19/18",
            "24/18"
        ],
        "quizChoices": [
            "24/19 3/2",
            "9/4 4/3",
            "24/19 7/6",
            "24/19 19/18"
        ],
        "equityLoss": 0.059,
        "verdict": "doubtful",
        "conceptId": "bearoff_technique",
        "conceptName": "Sortie des Dames (Bearoff)",
        "whyFailed": "Le coup joué 9/4 4/3 concède de l'équité (-0.059 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (24/19 3/2).",
        "explanation": "Le coup optimal certifié 2-ply (24/19 3/2) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (24/19...) qui optimise votre structure sur ce lancer 5-1.",
        "commentaryVariants": [
            "Le coup optimal certifié (24/19 3/2) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne 24/19 3/2 domine mathématiquement en 2-ply face à 9/4 4/3 (-0.059 EMG).",
            "En jouant 24/19 3/2, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    },
    {
        "id": "quiz_bearoff_technique_0v1_3",
        "tier": 1,
        "xgid": "XGID=-CBAA--A------A----aa-cjEA:0:0:1:35:0:0:0:7:8",
        "dice": [
            3,
            5
        ],
        "playedMove": "bar/20 4/1",
        "optimalMove": "bar/20 7/4",
        "acceptableMoves": [],
        "quizChoices": [
            "bar/20 7/4",
            "bar/20 4/1",
            "bar/20 24/21",
            "bar/20 14/11"
        ],
        "equityLoss": 0.193,
        "verdict": "howler",
        "conceptId": "bearoff_technique",
        "conceptName": "Sortie des Dames (Bearoff)",
        "whyFailed": "Le coup joué bar/20 4/1 concède de l'équité (-0.193 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (bar/20 7/4).",
        "explanation": "Le coup optimal certifié 2-ply (bar/20 7/4) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (bar/20...) qui optimise votre structure sur ce lancer 3-5.",
        "commentaryVariants": [
            "Le coup optimal certifié (bar/20 7/4) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne bar/20 7/4 domine mathématiquement en 2-ply face à bar/20 4/1 (-0.193 EMG).",
            "En jouant bar/20 7/4, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    },
    {
        "id": "quiz_cube_decision_0v1_1",
        "tier": 1,
        "xgid": "XGID=-bD--ADC----aA---a-dB--be-:0:0:1:62:2:1:0:7:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "20/14 7/5",
        "optimalMove": "13/7 7/5",
        "acceptableMoves": [
            "13/5"
        ],
        "quizChoices": [
            "13/7 7/5",
            "20/14 7/5",
            "20/14 14/12",
            "13/7 5/3"
        ],
        "equityLoss": 0.405,
        "verdict": "howler",
        "conceptId": "cube_decision",
        "conceptName": "Maîtrise du Videau (Cube)",
        "whyFailed": "Le coup joué 20/14 7/5 concède de l'équité (-0.405 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (13/7 7/5).",
        "explanation": "Le coup optimal certifié 2-ply (13/7 7/5) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (13/7...) qui optimise votre structure sur ce lancer 6-2.",
        "commentaryVariants": [
            "Le coup optimal certifié (13/7 7/5) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne 13/7 7/5 domine mathématiquement en 2-ply face à 20/14 7/5 (-0.405 EMG).",
            "En jouant 13/7 7/5, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    },
    {
        "id": "quiz_cube_decision_0v1_2",
        "tier": 2,
        "xgid": "XGID=-D-Baba-C---cB-----AaA-gAA:0:0:1:51:4:2:0:7:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "bar/24 21/16",
        "optimalMove": "bar/20 20/19",
        "acceptableMoves": [
            "bar/20/19"
        ],
        "quizChoices": [
            "bar/20 20/19",
            "bar/24 21/16",
            "bar/20 21/20",
            "bar/20 19/18"
        ],
        "equityLoss": 0.099,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Maîtrise du Videau (Cube)",
        "whyFailed": "Le coup joué bar/24 21/16 concède de l'équité (-0.099 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (bar/20 20/19).",
        "explanation": "Le coup optimal certifié 2-ply (bar/20 20/19) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (bar/20...) qui optimise votre structure sur ce lancer 5-1.",
        "commentaryVariants": [
            "Le coup optimal certifié (bar/20 20/19) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne bar/20 20/19 domine mathématiquement en 2-ply face à bar/24 21/16 (-0.099 EMG).",
            "En jouant bar/20 20/19, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    },
    {
        "id": "quiz_cube_decision_0v1_3",
        "tier": 2,
        "xgid": "XGID=-ED-----A---A--aA---C-bci-:0:0:1:36:1:3:0:7:8",
        "dice": [
            3,
            6
        ],
        "playedMove": "8/5 12/6",
        "optimalMove": "16/13 20/14",
        "acceptableMoves": [
            "20/14 16/13",
            "16/13 12/6",
            "12/9 16/10",
            "16/10 12/9"
        ],
        "quizChoices": [
            "16/13 20/14",
            "8/5 12/6",
            "16/13 12/6",
            "12/9 16/10"
        ],
        "equityLoss": 0.035,
        "verdict": "doubtful",
        "conceptId": "cube_decision",
        "conceptName": "Maîtrise du Videau (Cube)",
        "whyFailed": "Le coup joué 8/5 12/6 concède de l'équité (-0.035 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (16/13 20/14).",
        "explanation": "Le coup optimal certifié 2-ply (16/13 20/14) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (16/13...) qui optimise votre structure sur ce lancer 3-6.",
        "commentaryVariants": [
            "Le coup optimal certifié (16/13 20/14) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne 16/13 20/14 domine mathématiquement en 2-ply face à 8/5 12/6 (-0.035 EMG).",
            "En jouant 16/13 20/14, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    },
    {
        "id": "quiz_opening_0v1_1",
        "tier": 1,
        "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:24:3:4:0:7:8",
        "dice": [
            2,
            4
        ],
        "playedMove": "13/11 13/9",
        "optimalMove": "6/4 8/4",
        "acceptableMoves": [
            "8/4 6/4"
        ],
        "quizChoices": [
            "6/4 8/4",
            "13/11 13/9",
            "24/22 13/9",
            "13/11 24/20"
        ],
        "equityLoss": 0.332,
        "verdict": "howler",
        "conceptId": "opening",
        "conceptName": "Ouvertures & Développement",
        "whyFailed": "Le coup joué 13/11 13/9 concède de l'équité (-0.332 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (6/4 8/4).",
        "explanation": "Le coup optimal certifié 2-ply (6/4 8/4) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (6/4...) qui optimise votre structure sur ce lancer 2-4.",
        "commentaryVariants": [
            "Le coup optimal certifié (6/4 8/4) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne 6/4 8/4 domine mathématiquement en 2-ply face à 13/11 13/9 (-0.332 EMG).",
            "En jouant 6/4 8/4, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    },
    {
        "id": "quiz_race_management_0v1_1",
        "tier": 2,
        "xgid": "XGID=-GEB-----------A-a----dai-:0:0:1:12:0:0:0:7:8",
        "dice": [
            1,
            2
        ],
        "playedMove": "2/1 15/13",
        "optimalMove": "15/14 14/12",
        "acceptableMoves": [
            "15/12",
            "2/1 15/13",
            "15/13 2/1",
            "3/2 15/13",
            "15/13 3/2",
            "15/14 3/1",
            "2/1 3/1",
            "3/1 2/1",
            "3/2 3/1"
        ],
        "quizChoices": [
            "15/14 14/12",
            "2/1 15/13",
            "3/2 15/13",
            "15/14 3/1"
        ],
        "equityLoss": 0.084,
        "verdict": "blunder",
        "conceptId": "race_management",
        "conceptName": "Course & Compte de Pips (Keith)",
        "whyFailed": "Le coup joué 2/1 15/13 concède de l'équité (-0.084 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (15/14 14/12).",
        "explanation": "Le coup optimal certifié 2-ply (15/14 14/12) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (15/14...) qui optimise votre structure sur ce lancer 1-2.",
        "commentaryVariants": [
            "Le coup optimal certifié (15/14 14/12) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne 15/14 14/12 domine mathématiquement en 2-ply face à 2/1 15/13 (-0.084 EMG).",
            "En jouant 15/14 14/12, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    },
    {
        "id": "quiz_race_management_0v1_2",
        "tier": 2,
        "xgid": "XGID=-JB-A-AAa-------------aal-:0:0:1:12:2:1:0:7:8",
        "dice": [
            1,
            2
        ],
        "playedMove": "6/5 4/2",
        "optimalMove": "7/5 1/off",
        "acceptableMoves": [],
        "quizChoices": [
            "7/5 1/off",
            "6/5 4/2",
            "7/6 2/off",
            "4/3 6/4"
        ],
        "equityLoss": 0.088,
        "verdict": "blunder",
        "conceptId": "race_management",
        "conceptName": "Course & Compte de Pips (Keith)",
        "whyFailed": "Le coup joué 6/5 4/2 concède de l'équité (-0.088 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (7/5 1/off).",
        "explanation": "Le coup optimal certifié 2-ply (7/5 1/off) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (7/5...) qui optimise votre structure sur ce lancer 1-2.",
        "commentaryVariants": [
            "Le coup optimal certifié (7/5 1/off) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne 7/5 1/off domine mathématiquement en 2-ply face à 6/5 4/2 (-0.088 EMG).",
            "En jouant 7/5 1/off, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    },
    {
        "id": "quiz_race_management_0v1_3",
        "tier": 2,
        "xgid": "XGID=-AJAAA-------A----a---aeh-:0:0:1:21:0:0:0:7:8",
        "dice": [
            2,
            1
        ],
        "playedMove": "3/1 13/12",
        "optimalMove": "13/11 2/1",
        "acceptableMoves": [
            "13/11 11/10",
            "13/10",
            "13/11 5/4",
            "13/11 4/3",
            "5/3 13/12",
            "13/12 5/3",
            "3/1 13/12",
            "13/12 3/1"
        ],
        "quizChoices": [
            "13/11 2/1",
            "3/1 13/12",
            "13/11 11/10",
            "13/11 5/4"
        ],
        "equityLoss": 0.057,
        "verdict": "doubtful",
        "conceptId": "race_management",
        "conceptName": "Course & Compte de Pips (Keith)",
        "whyFailed": "Le coup joué 3/1 13/12 concède de l'équité (-0.057 EMG) et dégrade votre structure face au coup certifié GNU Backgammon (13/11 2/1).",
        "explanation": "Le coup optimal certifié 2-ply (13/11 2/1) maximise votre équité cubeful et la coordination de vos pions sur les 36 lancers suivants.",
        "proverb": "Évaluez toujours la souplesse de votre structure et la distribution de vos pions avant de valider.",
        "hint": "Cherchez le coup maître certifié (13/11...) qui optimise votre structure sur ce lancer 2-1.",
        "commentaryVariants": [
            "Le coup optimal certifié (13/11 2/1) répartit idéalement vos bâtisseurs et maximise vos lancers constructifs sur 36.",
            "La ligne 13/11 2/1 domine mathématiquement en 2-ply face à 3/1 13/12 (-0.057 EMG).",
            "En jouant 13/11 2/1, vous appliquez la solution exacte de GNU Backgammon et d'Open Sage."
        ]
    }
];
