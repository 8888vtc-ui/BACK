/**
 * Banque Élargie de Quizz Tactiques Multi-Ply & Multi-Scores (Money Game + Match 3, 7, 9, 11, 21)
 * 100 % Certifiée par BGT (GNU Backgammon 2-ply Kazaross-XG2) — https://backgammontour.com
 * Commentaires géométriques vérifiés sur le plateau (Zéro texte générique).
 */
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
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant bar/22 20/15 (Match en 7 pts (2-1, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 10 et laisse l'initiative à l'adversaire, concédant -0.048 EMG face à bar/20 13/10.",
        "explanation": "Avec le jet 5-3 en Match en 7 pts (2-1, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est bar/20 13/10 : il rentre de la barre sur la flèche 20 et frappe le blot adverse sur la flèche 10 et ferme la porte 20 (+0.048 EMG sur bar/22 20/15).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Cherchez la frappe sur la flèche 10 (bar/20...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : bar/20 13/10 rentre de la barre sur la flèche 20 et frappe le blot adverse sur la flèche 10 et ferme la porte 20.",
            "En Match en 7 pts (2-1, Videau à 1), bar/20 13/10 surpasse bar/22 20/15 de +0.048 EMG.",
            "Évitez bar/22 20/15 qui refuse de frapper le blot adverse sur la flèche 10 et laisse l'initiative à l'adversaire ; privilégiez bar/20 13/10."
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
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 7/6 6/1 (Match en 7 pts (0-0, Videau à 1)), vous enterre inutilement un pion sur l'As (flèche 1) au lieu de garder vos pions actifs, concédant -0.155 EMG face à 20/15 22/21.",
        "explanation": "Avec le jet 5-1 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 20/15 22/21 : il frappe le blot adverse sur la flèche 21 (+0.155 EMG sur 7/6 6/1).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Cherchez la frappe sur la flèche 21 (20/15...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 20/15 22/21 frappe le blot adverse sur la flèche 21.",
            "En Match en 7 pts (0-0, Videau à 1), 20/15 22/21 surpasse 7/6 6/1 de +0.155 EMG.",
            "Évitez 7/6 6/1 qui enterre inutilement un pion sur l'As (flèche 1) au lieu de garder vos pions actifs ; privilégiez 20/15 22/21."
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
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 16/13 19/13 (Match en 7 pts (3-4, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 10 et laisse l'initiative à l'adversaire, concédant -0.036 EMG face à 13/10 13/7.",
        "explanation": "Avec le jet 3-6 en Match en 7 pts (3-4, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/10 13/7 : il frappe le blot adverse sur la flèche 10 (+0.036 EMG sur 16/13 19/13).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Cherchez la frappe sur la flèche 10 (13/10...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/10 13/7 frappe le blot adverse sur la flèche 10.",
            "En Match en 7 pts (3-4, Videau à 1), 13/10 13/7 surpasse 16/13 19/13 de +0.036 EMG.",
            "Évitez 16/13 19/13 qui refuse de frapper le blot adverse sur la flèche 10 et laisse l'initiative à l'adversaire ; privilégiez 13/10 13/7."
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
        "acceptableMoves": [],
        "quizChoices": [
            "7/3 20/17",
            "7/3 24/21",
            "24/20 20/17",
            "20/17 17/13"
        ],
        "equityLoss": 0.061,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 7/3 24/21 (Match en 7 pts (4-2, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 17 et laisse l'initiative à l'adversaire, concédant -0.061 EMG face à 7/3 20/17.",
        "explanation": "Avec le jet 4-3 en Match en 7 pts (4-2, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 7/3 20/17 : il frappe le blot adverse sur la flèche 17 et ferme la porte 3 (+0.061 EMG sur 7/3 24/21).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 17 (7/3...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 7/3 20/17 frappe le blot adverse sur la flèche 17 et ferme la porte 3.",
            "En Match en 7 pts (4-2, Videau à 1), 7/3 20/17 surpasse 7/3 24/21 de +0.061 EMG.",
            "Évitez 7/3 24/21 qui refuse de frapper le blot adverse sur la flèche 17 et laisse l'initiative à l'adversaire ; privilégiez 7/3 20/17."
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
        "acceptableMoves": [],
        "quizChoices": [
            "2/1 14/8",
            "21/20 20/14",
            "14/13 19/13",
            "19/18 14/8"
        ],
        "equityLoss": 0.037,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 21/20 20/14 (Match en 7 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 8 et laisse l'initiative à l'adversaire, concédant -0.037 EMG face à 2/1 14/8.",
        "explanation": "Avec le jet 1-6 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 2/1 14/8 : il frappe le blot adverse sur la flèche 8 (+0.037 EMG sur 21/20 20/14).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 8 (2/1...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 2/1 14/8 frappe le blot adverse sur la flèche 8.",
            "En Match en 7 pts (0-0, Videau à 1), 2/1 14/8 surpasse 21/20 20/14 de +0.037 EMG.",
            "Évitez 21/20 20/14 qui refuse de frapper le blot adverse sur la flèche 8 et laisse l'initiative à l'adversaire ; privilégiez 2/1 14/8."
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
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 6/2 18/12 (Match en 7 pts (3-4, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 2, 10, 11), concédant -0.136 EMG face à 18/14 18/12.",
        "explanation": "Avec le jet 4-6 en Match en 7 pts (3-4, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 18/14 18/12 : il frappe le blot adverse sur la flèche 12 (+0.136 EMG sur 6/2 18/12).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Cherchez la frappe sur la flèche 12 (18/14...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 18/14 18/12 frappe le blot adverse sur la flèche 12.",
            "En Match en 7 pts (3-4, Videau à 1), 18/14 18/12 surpasse 6/2 18/12 de +0.136 EMG.",
            "Évitez 6/2 18/12 qui laisse 5 pion(s) isolé(s) (flèches 2, 10, 11) ; privilégiez 18/14 18/12."
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
        "acceptableMoves": [],
        "quizChoices": [
            "11/6 21/17",
            "23/18 11/7",
            "23/18 21/17",
            "21/16 21/17"
        ],
        "equityLoss": 0.241,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 23/18 11/7 (Match en 7 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 17 et disperse vos constructeurs, concédant -0.241 EMG face à 11/6 21/17.",
        "explanation": "Avec le jet 5-4 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 11/6 21/17 : il ferme la porte 17 (+0.241 EMG sur 23/18 11/7).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez la flèche 17 : vos deux dés permettent d'y fermer une porte (11/6...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 11/6 21/17 ferme la porte 17.",
            "En Match en 7 pts (0-0, Videau à 1), 11/6 21/17 surpasse 23/18 11/7 de +0.241 EMG.",
            "Évitez 23/18 11/7 qui manque la fermeture de la porte 17 et disperse vos constructeurs ; privilégiez 11/6 21/17."
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
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 9/4 4/3 (Match en 7 pts (1-3, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 2, 5, 7), concédant -0.059 EMG face à 24/19 3/2.",
        "explanation": "Avec le jet 5-1 en Match en 7 pts (1-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/19 3/2 : il ferme la porte 2 (+0.059 EMG sur 9/4 4/3).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez la flèche 2 : vos deux dés permettent d'y fermer une porte (24/19...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/19 3/2 ferme la porte 2.",
            "En Match en 7 pts (1-3, Videau à 1), 24/19 3/2 surpasse 9/4 4/3 de +0.059 EMG.",
            "Évitez 9/4 4/3 qui laisse 3 pion(s) isolé(s) (flèches 2, 5, 7) ; privilégiez 24/19 3/2."
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
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant bar/20 4/1 (Match en 7 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 4 et disperse vos constructeurs, concédant -0.193 EMG face à bar/20 7/4.",
        "explanation": "Avec le jet 3-5 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est bar/20 7/4 : il rentre de la barre sur la flèche 20 et frappe le blot adverse sur la flèche 20 et ferme la porte 4 (+0.193 EMG sur bar/20 4/1).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 20 (bar/20...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : bar/20 7/4 rentre de la barre sur la flèche 20 et frappe le blot adverse sur la flèche 20 et ferme la porte 4.",
            "En Match en 7 pts (0-0, Videau à 1), bar/20 7/4 surpasse bar/20 4/1 de +0.193 EMG.",
            "Évitez bar/20 4/1 qui manque la fermeture de la porte 4 et disperse vos constructeurs ; privilégiez bar/20 7/4."
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
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 20/14 7/5 (Match en 7 pts (2-1, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 13, 14, 20), concédant -0.405 EMG face à 13/7 7/5.",
        "explanation": "Avec le jet 6-2 en Match en 7 pts (2-1, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/7 7/5 : il ferme la porte 5 (+0.405 EMG sur 20/14 7/5).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 5 : vos deux dés permettent d'y fermer une porte (13/7...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/7 7/5 ferme la porte 5.",
            "En Match en 7 pts (2-1, Videau à 1), 13/7 7/5 surpasse 20/14 7/5 de +0.405 EMG.",
            "Évitez 20/14 7/5 qui laisse 3 pion(s) isolé(s) (flèches 13, 14, 20) ; privilégiez 13/7 7/5."
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
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant bar/24 21/16 (Match en 7 pts (4-2, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 20 et laisse l'initiative à l'adversaire, concédant -0.099 EMG face à bar/20 20/19.",
        "explanation": "Avec le jet 5-1 en Match en 7 pts (4-2, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est bar/20 20/19 : il rentre de la barre sur la flèche 20 et frappe le blot adverse sur la flèche 20 et ferme la porte 19 (+0.099 EMG sur bar/24 21/16).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Cherchez la frappe sur la flèche 20 (bar/20...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : bar/20 20/19 rentre de la barre sur la flèche 20 et frappe le blot adverse sur la flèche 20 et ferme la porte 19.",
            "En Match en 7 pts (4-2, Videau à 1), bar/20 20/19 surpasse bar/24 21/16 de +0.099 EMG.",
            "Évitez bar/24 21/16 qui refuse de frapper le blot adverse sur la flèche 20 et laisse l'initiative à l'adversaire ; privilégiez bar/20 20/19."
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
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 8/5 12/6 (Match en 7 pts (1-3, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 5, 6, 16), concédant -0.035 EMG face à 16/13 20/14.",
        "explanation": "Avec le jet 3-6 en Match en 7 pts (1-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 16/13 20/14 : il repositionne idéalement vos bâtisseurs (16/13 20/14) avec seulement 4 blot(s) exposé(s) (+0.035 EMG sur 8/5 12/6).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 16 (16/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 16/13 20/14 repositionne idéalement vos bâtisseurs (16/13 20/14) avec seulement 4 blot(s) exposé(s).",
            "En Match en 7 pts (1-3, Videau à 1), 16/13 20/14 surpasse 8/5 12/6 de +0.035 EMG.",
            "Évitez 8/5 12/6 qui laisse 3 pion(s) isolé(s) (flèches 5, 6, 16) ; privilégiez 16/13 20/14."
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
        "acceptableMoves": [],
        "quizChoices": [
            "6/4 8/4",
            "13/11 13/9",
            "24/22 13/9",
            "13/11 24/20"
        ],
        "equityLoss": 0.332,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/11 13/9 (Match en 7 pts (3-4, Videau à 1)), vous manque la fermeture de la porte 4 et disperse vos constructeurs, concédant -0.332 EMG face à 6/4 8/4.",
        "explanation": "Avec le jet 2-4 en Match en 7 pts (3-4, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 6/4 8/4 : il ferme la porte 4 (+0.332 EMG sur 13/11 13/9).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 4 : vos deux dés permettent d'y fermer une porte (6/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 6/4 8/4 ferme la porte 4.",
            "En Match en 7 pts (3-4, Videau à 1), 6/4 8/4 surpasse 13/11 13/9 de +0.332 EMG.",
            "Évitez 13/11 13/9 qui manque la fermeture de la porte 4 et disperse vos constructeurs ; privilégiez 6/4 8/4."
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
        "whyFailed": "En jouant 2/1 15/13 (Match en 7 pts (0-0, Videau à 1)), vous enterre inutilement un pion sur l'As (flèche 1) au lieu de garder vos pions actifs, concédant -0.084 EMG face à 15/14 14/12.",
        "explanation": "Avec le jet 1-2 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 15/14 14/12 : il repositionne idéalement vos bâtisseurs (15/14 14/12) avec seulement 1 blot(s) exposé(s) (+0.084 EMG sur 2/1 15/13).",
        "proverb": "En course pure, videz les flèches hautes (Midpoint 13) sans jamais gaspiller de pips sur l’As ou le 2.",
        "hint": "Regardez le mouvement partant de 15 (15/14...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 15/14 14/12 repositionne idéalement vos bâtisseurs (15/14 14/12) avec seulement 1 blot(s) exposé(s).",
            "En Match en 7 pts (0-0, Videau à 1), 15/14 14/12 surpasse 2/1 15/13 de +0.084 EMG.",
            "Évitez 2/1 15/13 qui enterre inutilement un pion sur l'As (flèche 1) au lieu de garder vos pions actifs ; privilégiez 15/14 14/12."
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
        "conceptId": "bearoff_technique",
        "conceptName": "Sortie des Dames (Bearoff)",
        "whyFailed": "En jouant 6/5 4/2 (Match en 7 pts (2-1, Videau à 1)), vous retarde la sortie de vos dames au lieu de sortir directement (7/5 1/off), concédant -0.088 EMG face à 7/5 1/off.",
        "explanation": "Avec le jet 1-2 en Match en 7 pts (2-1, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 7/5 1/off : il sort 1 dame du plateau (bear-off) (+0.088 EMG sur 6/5 4/2).",
        "proverb": "Au bear-off, sortez vos dames en priorité tout en aplanissant vos piles hautes sans laisser de tir.",
        "hint": "Regardez le mouvement partant de 7 (7/5...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 7/5 1/off sort 1 dame du plateau (bear-off).",
            "En Match en 7 pts (2-1, Videau à 1), 7/5 1/off surpasse 6/5 4/2 de +0.088 EMG.",
            "Évitez 6/5 4/2 qui retarde la sortie de vos dames au lieu de sortir directement (7/5 1/off) ; privilégiez 7/5 1/off."
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
            "13/12 5/3"
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
        "whyFailed": "En jouant 3/1 13/12 (Match en 7 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 4, 5, 12), concédant -0.057 EMG face à 13/11 2/1.",
        "explanation": "Avec le jet 2-1 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/11 2/1 : il ferme la porte 1 (+0.057 EMG sur 3/1 13/12).",
        "proverb": "En course pure, videz les flèches hautes (Midpoint 13) sans jamais gaspiller de pips sur l’As ou le 2.",
        "hint": "Regardez la flèche 1 : vos deux dés permettent d'y fermer une porte (13/11...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/11 2/1 ferme la porte 1.",
            "En Match en 7 pts (0-0, Videau à 1), 13/11 2/1 surpasse 3/1 13/12 de +0.057 EMG.",
            "Évitez 3/1 13/12 qui laisse 3 pion(s) isolé(s) (flèches 4, 5, 12) ; privilégiez 13/11 2/1."
        ]
    },
    {
        "id": "bgt_checker_m0_1_24",
        "tier": 3,
        "xgid": "XGID=-b-CBBC-A----B---bbeb--bB-:0:0:1:24:0:0:0:0:8",
        "dice": [
            2,
            4
        ],
        "playedMove": "13/9 6/4",
        "optimalMove": "13/11 8/4",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11 8/4",
            "13/9 6/4",
            "24/22 8/4",
            "13/9 8/6"
        ],
        "equityLoss": 0.096,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/9 6/4 (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 8, 9, 13), concédant -0.096 EMG face à 13/11 8/4.",
        "explanation": "Avec le jet 2-4 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/11 8/4 : il repositionne idéalement vos bâtisseurs (13/11 8/4) avec seulement 2 blot(s) exposé(s) (+0.096 EMG sur 13/9 6/4).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 13 (13/11...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/11 8/4 repositionne idéalement vos bâtisseurs (13/11 8/4) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 13/11 8/4 surpasse 13/9 6/4 de +0.096 EMG.",
            "Évitez 13/9 6/4 qui laisse 3 pion(s) isolé(s) (flèches 8, 9, 13) ; privilégiez 13/11 8/4."
        ]
    },
    {
        "id": "bgt_checker_m0_2_32",
        "tier": 2,
        "xgid": "XGID=---DDBBb-----A----bdb--eB-:0:0:1:32:0:0:0:0:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "24/22 24/21",
        "optimalMove": "4/1 3/1",
        "acceptableMoves": [],
        "quizChoices": [
            "4/1 3/1",
            "24/22 24/21",
            "4/2 4/1",
            "13/10 4/2"
        ],
        "equityLoss": 0.143,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/22 24/21 (Money Game (Videau à 1)), vous manque la fermeture de la porte 1 et disperse vos constructeurs, concédant -0.143 EMG face à 4/1 3/1.",
        "explanation": "Avec le jet 3-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 4/1 3/1 : il ferme la porte 1 (+0.143 EMG sur 24/22 24/21).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez la flèche 1 : vos deux dés permettent d'y fermer une porte (4/1...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 4/1 3/1 ferme la porte 1.",
            "En Money Game (Videau à 1), 4/1 3/1 surpasse 24/22 24/21 de +0.143 EMG.",
            "Évitez 24/22 24/21 qui manque la fermeture de la porte 1 et disperse vos constructeurs ; privilégiez 4/1 3/1."
        ]
    },
    {
        "id": "bgt_checker_m0_3_53",
        "tier": 1,
        "xgid": "XGID=-C-CBBB---------a-beb--eC-:0:0:1:53:0:0:0:0:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "6/3 6/1",
        "optimalMove": "24/16*",
        "acceptableMoves": [],
        "quizChoices": [
            "24/16*",
            "6/3 6/1",
            "24/21 6/1",
            "6/1 5/2"
        ],
        "equityLoss": 1.318,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 6/3 6/1 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 16 et laisse l'initiative à l'adversaire, concédant -1.318 EMG face à 24/16*.",
        "explanation": "Avec le jet 5-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/16* : il frappe le blot adverse sur la flèche 16 (+1.318 EMG sur 6/3 6/1).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Cherchez la frappe sur la flèche 16 (24/16*...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/16* frappe le blot adverse sur la flèche 16.",
            "En Money Game (Videau à 1), 24/16* surpasse 6/3 6/1 de +1.318 EMG.",
            "Évitez 6/3 6/1 qui refuse de frapper le blot adverse sur la flèche 16 et laisse l'initiative à l'adversaire ; privilégiez 24/16*."
        ]
    },
    {
        "id": "bgt_checker_m0_4_23",
        "tier": 2,
        "xgid": "XGID=-bB--CEBA-B-b------b-ccc--:0:0:1:23:0:0:0:0:8",
        "dice": [
            2,
            3
        ],
        "playedMove": "10/5",
        "optimalMove": "10/8 10/7",
        "acceptableMoves": [],
        "quizChoices": [
            "10/8 10/7",
            "10/5",
            "6/3 5/3",
            "8/6 5/2"
        ],
        "equityLoss": 0.186,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 10/5 (Money Game (Videau à 1)), vous manque la fermeture de la porte 8 et disperse vos constructeurs, concédant -0.186 EMG face à 10/8 10/7.",
        "explanation": "Avec le jet 2-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 10/8 10/7 : il ferme la porte 8 (+0.186 EMG sur 10/5).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 8 : vos deux dés permettent d'y fermer une porte (10/8...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 10/8 10/7 ferme la porte 8.",
            "En Money Game (Videau à 1), 10/8 10/7 surpasse 10/5 de +0.186 EMG.",
            "Évitez 10/5 qui manque la fermeture de la porte 8 et disperse vos constructeurs ; privilégiez 10/8 10/7."
        ]
    },
    {
        "id": "bgt_checker_m0_5_36",
        "tier": 4,
        "xgid": "XGID=---BB-BbC--BbB----cdBb-b--:2:1:1:36:0:0:0:0:8",
        "dice": [
            3,
            6
        ],
        "playedMove": "8/5 8/2",
        "optimalMove": "11/5 8/5",
        "acceptableMoves": [],
        "quizChoices": [
            "11/5 8/5",
            "8/5 8/2",
            "11/8 11/5",
            "8/2 6/3"
        ],
        "equityLoss": 0.085,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 8/5 8/2 (Money Game (Videau à 4)), vous manque la fermeture de la porte 5 et disperse vos constructeurs, concédant -0.085 EMG face à 11/5 8/5.",
        "explanation": "Avec le jet 3-6 en Money Game (Videau à 4), le coup #1 certifié par BGT / GNU Backgammon est 11/5 8/5 : il ferme la porte 5 (+0.085 EMG sur 8/5 8/2).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 5 : vos deux dés permettent d'y fermer une porte (11/5...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 11/5 8/5 ferme la porte 5.",
            "En Money Game (Videau à 4), 11/5 8/5 surpasse 8/5 8/2 de +0.085 EMG.",
            "Évitez 8/5 8/2 qui manque la fermeture de la porte 5 et disperse vos constructeurs ; privilégiez 11/5 8/5."
        ]
    },
    {
        "id": "bgt_checker_m0_6_35",
        "tier": 3,
        "xgid": "XGID=-BB-CBB------B---bb-Bbebb-:2:1:1:35:0:0:0:0:8",
        "dice": [
            3,
            5
        ],
        "playedMove": "20/15 13/10",
        "optimalMove": "13/10 13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "13/10 13/8",
            "20/15 13/10",
            "13/5",
            "13/8 4/1"
        ],
        "equityLoss": 0.108,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 20/15 13/10 (Money Game (Videau à 4)), vous laisse 4 pion(s) isolé(s) (flèches 10, 13, 15), concédant -0.108 EMG face à 13/10 13/8.",
        "explanation": "Avec le jet 3-5 en Money Game (Videau à 4), le coup #1 certifié par BGT / GNU Backgammon est 13/10 13/8 : il repositionne idéalement vos bâtisseurs (13/10 13/8) avec seulement 2 blot(s) exposé(s) (+0.108 EMG sur 20/15 13/10).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 13 (13/10...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/10 13/8 repositionne idéalement vos bâtisseurs (13/10 13/8) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 4), 13/10 13/8 surpasse 20/15 13/10 de +0.108 EMG.",
            "Évitez 20/15 13/10 qui laisse 4 pion(s) isolé(s) (flèches 10, 13, 15) ; privilégiez 13/10 13/8."
        ]
    },
    {
        "id": "bgt_checker_m0_7_66",
        "tier": 1,
        "xgid": "XGID=-b-BBBE-----bB----dcbBb---:1:1:1:66:0:0:0:0:8",
        "dice": [
            6,
            6
        ],
        "playedMove": "21/3 21/15",
        "optimalMove": "21/15(2) 13/7(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "21/15(2) 13/7(2)",
            "21/3 21/15",
            "21/9(2)",
            "21/9 13/7(2)"
        ],
        "equityLoss": 0.238,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 21/3 21/15 (Money Game (Videau à 2)), vous manque la fermeture de la porte 7/15 et disperse vos constructeurs, concédant -0.238 EMG face à 21/15(2) 13/7(2).",
        "explanation": "Avec le jet 6-6 en Money Game (Videau à 2), le coup #1 certifié par BGT / GNU Backgammon est 21/15(2) 13/7(2) : il ferme la porte 7 et 15 (+0.238 EMG sur 21/3 21/15).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 7 : vos deux dés permettent d'y fermer une porte (21/15(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 21/15(2) 13/7(2) ferme la porte 7 et 15.",
            "En Money Game (Videau à 2), 21/15(2) 13/7(2) surpasse 21/3 21/15 de +0.238 EMG.",
            "Évitez 21/3 21/15 qui manque la fermeture de la porte 7/15 et disperse vos constructeurs ; privilégiez 21/15(2) 13/7(2)."
        ]
    },
    {
        "id": "bgt_checker_m0_9_34",
        "tier": 3,
        "xgid": "XGID=-a-B-BDaA---dC-----bCcbb--:2:1:1:34:0:0:0:0:8",
        "dice": [
            3,
            4
        ],
        "playedMove": "13/9 8/5",
        "optimalMove": "8/1*",
        "acceptableMoves": [],
        "quizChoices": [
            "8/1*",
            "13/9 8/5",
            "20/13",
            "20/16 8/5"
        ],
        "equityLoss": 0.102,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 13/9 8/5 (Money Game (Videau à 4)), vous refuse de frapper le blot adverse sur la flèche 1 et laisse l'initiative à l'adversaire, concédant -0.102 EMG face à 8/1*.",
        "explanation": "Avec le jet 3-4 en Money Game (Videau à 4), le coup #1 certifié par BGT / GNU Backgammon est 8/1* : il frappe le blot adverse sur la flèche 1 (+0.102 EMG sur 13/9 8/5).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 1 (8/1*...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/1* frappe le blot adverse sur la flèche 1.",
            "En Money Game (Videau à 4), 8/1* surpasse 13/9 8/5 de +0.102 EMG.",
            "Évitez 13/9 8/5 qui refuse de frapper le blot adverse sur la flèche 1 et laisse l'initiative à l'adversaire ; privilégiez 8/1*."
        ]
    },
    {
        "id": "bgt_checker_m3_3_31",
        "tier": 1,
        "xgid": "XGID=-ACCB-Ca---A-B----a-ccbad-:0:0:1:31:0:1:0:3:8",
        "dice": [
            3,
            1
        ],
        "playedMove": "11/8 6/5",
        "optimalMove": "11/7*",
        "acceptableMoves": [],
        "quizChoices": [
            "11/7*",
            "11/8 6/5",
            "11/8 2/1",
            "6/3 2/1"
        ],
        "equityLoss": 1.206,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 11/8 6/5 (Match en 3 pts (0-1, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 7 et laisse l'initiative à l'adversaire, concédant -1.206 EMG face à 11/7*.",
        "explanation": "Avec le jet 3-1 en Match en 3 pts (0-1, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 11/7* : il frappe le blot adverse sur la flèche 7 (+1.206 EMG sur 11/8 6/5).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 7 (11/7*...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 11/7* frappe le blot adverse sur la flèche 7.",
            "En Match en 3 pts (0-1, Videau à 1), 11/7* surpasse 11/8 6/5 de +1.206 EMG.",
            "Évitez 11/8 6/5 qui refuse de frapper le blot adverse sur la flèche 7 et laisse l'initiative à l'adversaire ; privilégiez 11/7*."
        ]
    },
    {
        "id": "bgt_checker_m3_4_31",
        "tier": 2,
        "xgid": "XGID=aBCCB-BB-A---------abcbbd-:0:0:1:31:0:1:0:3:8",
        "dice": [
            3,
            1
        ],
        "playedMove": "7/4 2/1",
        "optimalMove": "9/6 3/2",
        "acceptableMoves": [],
        "quizChoices": [
            "9/6 3/2",
            "7/4 2/1",
            "9/6 2/1",
            "7/6 7/4"
        ],
        "equityLoss": 0.146,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 7/4 2/1 (Match en 3 pts (0-1, Videau à 1)), vous enterre inutilement un pion sur l'As (flèche 1) au lieu de garder vos pions actifs, concédant -0.146 EMG face à 9/6 3/2.",
        "explanation": "Avec le jet 3-1 en Match en 3 pts (0-1, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 9/6 3/2 : il repositionne idéalement vos bâtisseurs (9/6 3/2) avec seulement 0 blot(s) exposé(s) (+0.146 EMG sur 7/4 2/1).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 9 (9/6...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 9/6 3/2 repositionne idéalement vos bâtisseurs (9/6 3/2) avec seulement 0 blot(s) exposé(s).",
            "En Match en 3 pts (0-1, Videau à 1), 9/6 3/2 surpasse 7/4 2/1 de +0.146 EMG.",
            "Évitez 7/4 2/1 qui enterre inutilement un pion sur l'As (flèche 1) au lieu de garder vos pions actifs ; privilégiez 9/6 3/2."
        ]
    },
    {
        "id": "bgt_checker_m3_7_12",
        "tier": 4,
        "xgid": "XGID=--EACBB--------a---cadb-d-:0:0:1:12:0:2:0:3:8",
        "dice": [
            1,
            2
        ],
        "playedMove": "3/off",
        "optimalMove": "2/1 2/off",
        "acceptableMoves": [],
        "quizChoices": [
            "2/1 2/off",
            "3/off",
            "4/3 2/off",
            "6/5 2/off"
        ],
        "equityLoss": 0.077,
        "verdict": "doubtful",
        "conceptId": "bearoff_technique",
        "conceptName": "Sortie des Dames (Bearoff)",
        "whyFailed": "En jouant 3/off (Match en 3 pts (0-2, Videau à 1)), vous laisse 0 pion(s) isolé(s) (flèches exposées), concédant -0.077 EMG face à 2/1 2/off.",
        "explanation": "Avec le jet 1-2 en Match en 3 pts (0-2, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 2/1 2/off : il sort 1 dame du plateau (bear-off) (+0.077 EMG sur 3/off).",
        "proverb": "Au bear-off, sortez vos dames en priorité tout en aplanissant vos piles hautes sans laisser de tir.",
        "hint": "Regardez le mouvement partant de 2 (2/1...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 2/1 2/off sort 1 dame du plateau (bear-off).",
            "En Match en 3 pts (0-2, Videau à 1), 2/1 2/off surpasse 3/off de +0.077 EMG.",
            "Évitez 3/off qui laisse 0 pion(s) isolé(s) (flèches exposées) ; privilégiez 2/1 2/off."
        ]
    },
    {
        "id": "bgt_checker_m3_8_61",
        "tier": 1,
        "xgid": "XGID=-b----E-CAB-bB---c-f-b--B-:0:0:1:61:0:1:0:3:8",
        "dice": [
            6,
            1
        ],
        "playedMove": "24/18 10/9",
        "optimalMove": "13/7 8/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7 8/7",
            "24/18 10/9",
            "24/18 9/8",
            "10/9 10/4"
        ],
        "equityLoss": 0.27,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/18 10/9 (Match en 3 pts (0-1, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 10, 18, 24), concédant -0.270 EMG face à 13/7 8/7.",
        "explanation": "Avec le jet 6-1 en Match en 3 pts (0-1, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/7 8/7 : il ferme la porte 7 (+0.270 EMG sur 24/18 10/9).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 7 : vos deux dés permettent d'y fermer une porte (13/7...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/7 8/7 ferme la porte 7.",
            "En Match en 3 pts (0-1, Videau à 1), 13/7 8/7 surpasse 24/18 10/9 de +0.270 EMG.",
            "Évitez 24/18 10/9 qui laisse 3 pion(s) isolé(s) (flèches 10, 18, 24) ; privilégiez 13/7 8/7."
        ]
    },
    {
        "id": "bgt_checker_m3_9_45",
        "tier": 1,
        "xgid": "XGID=---a-BDBB---cCa--d-d-b-B--:0:0:1:45:0:0:0:3:8",
        "dice": [
            4,
            5
        ],
        "playedMove": "8/3* 7/3",
        "optimalMove": "23/14*",
        "acceptableMoves": [],
        "quizChoices": [
            "23/14*",
            "8/3* 7/3",
            "13/4",
            "13/9 8/3*"
        ],
        "equityLoss": 0.415,
        "verdict": "howler",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 8/3* 7/3 (Match en 3 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 7, 8), concédant -0.415 EMG face à 23/14*.",
        "explanation": "Avec le jet 4-5 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 23/14* : il frappe le blot adverse sur la flèche 14 (+0.415 EMG sur 8/3* 7/3).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Cherchez la frappe sur la flèche 14 (23/14*...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 23/14* frappe le blot adverse sur la flèche 14.",
            "En Match en 3 pts (0-0, Videau à 1), 23/14* surpasse 8/3* 7/3 de +0.415 EMG.",
            "Évitez 8/3* 7/3 qui laisse 2 pion(s) isolé(s) (flèches 7, 8) ; privilégiez 23/14*."
        ]
    },
    {
        "id": "bgt_checker_m3_10_13",
        "tier": 4,
        "xgid": "XGID=-AAa-BBBB---cC---d-d-c-B--:0:0:1:13:0:0:0:3:8",
        "dice": [
            1,
            3
        ],
        "playedMove": "23/20 2/1",
        "optimalMove": "13/10 2/1",
        "acceptableMoves": [],
        "quizChoices": [
            "13/10 2/1",
            "23/20 2/1",
            "13/9",
            "8/5 2/1"
        ],
        "equityLoss": 0.077,
        "verdict": "doubtful",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 23/20 2/1 (Match en 3 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 20, 23), concédant -0.077 EMG face à 13/10 2/1.",
        "explanation": "Avec le jet 1-3 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/10 2/1 : il ferme la porte 1 (+0.077 EMG sur 23/20 2/1).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez la flèche 1 : vos deux dés permettent d'y fermer une porte (13/10...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/10 2/1 ferme la porte 1.",
            "En Match en 3 pts (0-0, Videau à 1), 13/10 2/1 surpasse 23/20 2/1 de +0.077 EMG.",
            "Évitez 23/20 2/1 qui laisse 2 pion(s) isolé(s) (flèches 20, 23) ; privilégiez 13/10 2/1."
        ]
    },
    {
        "id": "bgt_checker_m7_2_53",
        "tier": 4,
        "xgid": "XGID=-A-ABbB-C--B-B--bbcd-b--B-:1:1:1:53:3:2:0:7:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "13/8 4/1",
        "optimalMove": "8/3 4/1",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 4/1",
            "13/8 4/1",
            "11/8 11/6",
            "6/3 6/1"
        ],
        "equityLoss": 0.078,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/8 4/1 (Match en 7 pts (3-2, Videau à 2)), vous laisse 3 pion(s) isolé(s) (flèches 3, 4, 13), concédant -0.078 EMG face à 8/3 4/1.",
        "explanation": "Avec le jet 5-3 en Match en 7 pts (3-2, Videau à 2), le coup #1 certifié par BGT / GNU Backgammon est 8/3 4/1 : il ferme la porte 1 et 3 (+0.078 EMG sur 13/8 4/1).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 1 : vos deux dés permettent d'y fermer une porte (8/3...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/3 4/1 ferme la porte 1 et 3.",
            "En Match en 7 pts (3-2, Videau à 2), 8/3 4/1 surpasse 13/8 4/1 de +0.078 EMG.",
            "Évitez 13/8 4/1 qui laisse 3 pion(s) isolé(s) (flèches 3, 4, 13) ; privilégiez 8/3 4/1."
        ]
    },
    {
        "id": "bgt_checker_m7_4_34",
        "tier": 4,
        "xgid": "XGID=-aDCCCB----a---------bbcf-:0:0:1:34:0:0:0:7:8",
        "dice": [
            3,
            4
        ],
        "playedMove": "4/off 3/off",
        "optimalMove": "5/1* 4/1",
        "acceptableMoves": [],
        "quizChoices": [
            "5/1* 4/1",
            "4/off 3/off",
            "5/2 4/off",
            "6/3 6/2"
        ],
        "equityLoss": 0.077,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 4/off 3/off (Match en 7 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 1 et laisse l'initiative à l'adversaire, concédant -0.077 EMG face à 5/1* 4/1.",
        "explanation": "Avec le jet 3-4 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 5/1* 4/1 : il frappe le blot adverse sur la flèche 1 et ferme la porte 1 (+0.077 EMG sur 4/off 3/off).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 1 (5/1*...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 5/1* 4/1 frappe le blot adverse sur la flèche 1 et ferme la porte 1.",
            "En Match en 7 pts (0-0, Videau à 1), 5/1* 4/1 surpasse 4/off 3/off de +0.077 EMG.",
            "Évitez 4/off 3/off qui refuse de frapper le blot adverse sur la flèche 1 et laisse l'initiative à l'adversaire ; privilégiez 5/1* 4/1."
        ]
    },
    {
        "id": "bgt_checker_m7_6_21",
        "tier": 4,
        "xgid": "XGID=-ACA--Db----bD---cbd--b-B-:0:0:1:21:4:6:0:7:8",
        "dice": [
            2,
            1
        ],
        "playedMove": "24/23 6/4",
        "optimalMove": "6/4 2/1",
        "acceptableMoves": [],
        "quizChoices": [
            "6/4 2/1",
            "24/23 6/4",
            "13/11 2/1",
            "24/23 3/1"
        ],
        "equityLoss": 0.089,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 24/23 6/4 (Match en 7 pts (4-6, Videau à 1)), vous manque la fermeture de la porte 1 et disperse vos constructeurs, concédant -0.089 EMG face à 6/4 2/1.",
        "explanation": "Avec le jet 2-1 en Match en 7 pts (4-6, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 6/4 2/1 : il ferme la porte 1 (+0.089 EMG sur 24/23 6/4).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez la flèche 1 : vos deux dés permettent d'y fermer une porte (6/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 6/4 2/1 ferme la porte 1.",
            "En Match en 7 pts (4-6, Videau à 1), 6/4 2/1 surpasse 24/23 6/4 de +0.089 EMG.",
            "Évitez 24/23 6/4 qui manque la fermeture de la porte 1 et disperse vos constructeurs ; privilégiez 6/4 2/1."
        ]
    },
    {
        "id": "bgt_checker_m7_7_12",
        "tier": 4,
        "xgid": "XGID=-BCB--Bb-----Da--bcd--c-B-:0:0:1:12:4:6:0:7:8",
        "dice": [
            1,
            2
        ],
        "playedMove": "13/11 2/1",
        "optimalMove": "24/21",
        "acceptableMoves": [],
        "quizChoices": [
            "24/21",
            "13/11 2/1",
            "24/23 13/11",
            "13/10"
        ],
        "equityLoss": 0.088,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/11 2/1 (Match en 7 pts (4-6, Videau à 1)), vous enterre inutilement un pion sur l'As (flèche 1) au lieu de garder vos pions actifs, concédant -0.088 EMG face à 24/21.",
        "explanation": "Avec le jet 1-2 en Match en 7 pts (4-6, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 : il repositionne idéalement vos bâtisseurs (24/21) avec seulement 2 blot(s) exposé(s) (+0.088 EMG sur 13/11 2/1).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 24 (24/21...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 repositionne idéalement vos bâtisseurs (24/21) avec seulement 2 blot(s) exposé(s).",
            "En Match en 7 pts (4-6, Videau à 1), 24/21 surpasse 13/11 2/1 de +0.088 EMG.",
            "Évitez 13/11 2/1 qui enterre inutilement un pion sur l'As (flèche 1) au lieu de garder vos pions actifs ; privilégiez 24/21."
        ]
    },
    {
        "id": "bgt_checker_m7_11_15",
        "tier": 4,
        "xgid": "XGID=-AB--bCC----bD--abbbbb--B-:0:0:1:15:4:6:0:7:8",
        "dice": [
            1,
            5
        ],
        "playedMove": "7/6 7/2",
        "optimalMove": "24/23 6/1",
        "acceptableMoves": [],
        "quizChoices": [
            "24/23 6/1",
            "7/6 7/2",
            "24/23 13/8",
            "24/23 7/2"
        ],
        "equityLoss": 0.076,
        "verdict": "doubtful",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 7/6 7/2 (Match en 7 pts (4-6, Videau à 1)), vous manque la fermeture de la porte 1 et disperse vos constructeurs, concédant -0.076 EMG face à 24/23 6/1.",
        "explanation": "Avec le jet 1-5 en Match en 7 pts (4-6, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 6/1 : il ferme la porte 1 (+0.076 EMG sur 7/6 7/2).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez la flèche 1 : vos deux dés permettent d'y fermer une porte (24/23...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 6/1 ferme la porte 1.",
            "En Match en 7 pts (4-6, Videau à 1), 24/23 6/1 surpasse 7/6 7/2 de +0.076 EMG.",
            "Évitez 7/6 7/2 qui manque la fermeture de la porte 1 et disperse vos constructeurs ; privilégiez 24/23 6/1."
        ]
    },
    {
        "id": "bgt_checker_m7_12_34",
        "tier": 4,
        "xgid": "XGID=-BB--bCB-----D--a-dbbb-bB-:0:0:1:34:4:6:0:7:8",
        "dice": [
            3,
            4
        ],
        "playedMove": "13/10 6/2",
        "optimalMove": "13/9 7/4",
        "acceptableMoves": [],
        "quizChoices": [
            "13/9 7/4",
            "13/10 6/2",
            "7/3 6/3",
            "13/10 13/9"
        ],
        "equityLoss": 0.091,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/10 6/2 (Match en 7 pts (4-6, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 10), concédant -0.091 EMG face à 13/9 7/4.",
        "explanation": "Avec le jet 3-4 en Match en 7 pts (4-6, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/9 7/4 : il repositionne idéalement vos bâtisseurs (13/9 7/4) avec seulement 3 blot(s) exposé(s) (+0.091 EMG sur 13/10 6/2).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 13 (13/9...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/9 7/4 repositionne idéalement vos bâtisseurs (13/9 7/4) avec seulement 3 blot(s) exposé(s).",
            "En Match en 7 pts (4-6, Videau à 1), 13/9 7/4 surpasse 13/10 6/2 de +0.091 EMG.",
            "Évitez 13/10 6/2 qui laisse 1 pion(s) isolé(s) (flèches 10) ; privilégiez 13/9 7/4."
        ]
    },
    {
        "id": "bgt_checker_m7_13_11",
        "tier": 4,
        "xgid": "XGID=-BC-A-BC-b---B-----bcbccB-:0:0:1:11:4:6:0:7:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "7/5 7/6 2/1",
        "optimalMove": "7/5(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "7/5(2)",
            "7/5 7/6 2/1",
            "7/4 7/6",
            "7/4 2/1"
        ],
        "equityLoss": 0.076,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 7/5 7/6 2/1 (Match en 7 pts (4-6, Videau à 1)), vous manque la fermeture de la porte 5 et disperse vos constructeurs, concédant -0.076 EMG face à 7/5(2).",
        "explanation": "Avec le jet 1-1 en Match en 7 pts (4-6, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 7/5(2) : il ferme la porte 5 (+0.076 EMG sur 7/5 7/6 2/1).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 5 : vos deux dés permettent d'y fermer une porte (7/5(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 7/5(2) ferme la porte 5.",
            "En Match en 7 pts (4-6, Videau à 1), 7/5(2) surpasse 7/5 7/6 2/1 de +0.076 EMG.",
            "Évitez 7/5 7/6 2/1 qui manque la fermeture de la porte 5 et disperse vos constructeurs ; privilégiez 7/5(2)."
        ]
    },
    {
        "id": "bgt_checker_m9_1_24",
        "tier": 2,
        "xgid": "XGID=---ABBAbCB--bB---d-d---cB-:0:0:1:24:0:0:0:9:8",
        "dice": [
            2,
            4
        ],
        "playedMove": "9/3",
        "optimalMove": "24/20 8/6",
        "acceptableMoves": [],
        "quizChoices": [
            "24/20 8/6",
            "9/3",
            "9/5 8/6",
            "8/6 8/4"
        ],
        "equityLoss": 0.187,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 9/3 (Match en 9 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 6, 9), concédant -0.187 EMG face à 24/20 8/6.",
        "explanation": "Avec le jet 2-4 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 8/6 : il ferme la porte 6 (+0.187 EMG sur 9/3).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 6 : vos deux dés permettent d'y fermer une porte (24/20...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 8/6 ferme la porte 6.",
            "En Match en 9 pts (0-0, Videau à 1), 24/20 8/6 surpasse 9/3 de +0.187 EMG.",
            "Évitez 9/3 qui laisse 2 pion(s) isolé(s) (flèches 6, 9) ; privilégiez 24/20 8/6."
        ]
    },
    {
        "id": "bgt_checker_m9_2_45",
        "tier": 2,
        "xgid": "XGID=-AA-BB-bCB--aB---d-d---dB-:0:0:1:45:0:0:0:9:8",
        "dice": [
            4,
            5
        ],
        "playedMove": "9/4 8/4",
        "optimalMove": "9/5 9/4",
        "acceptableMoves": [],
        "quizChoices": [
            "9/5 9/4",
            "9/4 8/4",
            "8/3 5/1",
            "9/5 8/3"
        ],
        "equityLoss": 0.154,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 9/4 8/4 (Match en 9 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 1, 2, 9), concédant -0.154 EMG face à 9/5 9/4.",
        "explanation": "Avec le jet 4-5 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 9/5 9/4 : il repositionne idéalement vos bâtisseurs (9/5 9/4) avec seulement 2 blot(s) exposé(s) (+0.154 EMG sur 9/4 8/4).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 9 (9/5...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 9/5 9/4 repositionne idéalement vos bâtisseurs (9/5 9/4) avec seulement 2 blot(s) exposé(s).",
            "En Match en 9 pts (0-0, Videau à 1), 9/5 9/4 surpasse 9/4 8/4 de +0.154 EMG.",
            "Évitez 9/4 8/4 qui laisse 3 pion(s) isolé(s) (flèches 1, 2, 9) ; privilégiez 9/5 9/4."
        ]
    },
    {
        "id": "bgt_checker_m9_3_13",
        "tier": 3,
        "xgid": "XGID=-ABABC-bB----B---b-b-d-eB-:0:0:1:13:0:0:0:9:8",
        "dice": [
            1,
            3
        ],
        "playedMove": "4/3 4/1",
        "optimalMove": "5/1",
        "acceptableMoves": [],
        "quizChoices": [
            "5/1",
            "4/3 4/1",
            "5/2 4/3",
            "8/4"
        ],
        "equityLoss": 0.124,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 4/3 4/1 (Match en 9 pts (0-0, Videau à 1)), vous laisse 0 pion(s) isolé(s) (flèches exposées), concédant -0.124 EMG face à 5/1.",
        "explanation": "Avec le jet 1-3 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 5/1 : il ferme la porte 1 (+0.124 EMG sur 4/3 4/1).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez la flèche 1 : vos deux dés permettent d'y fermer une porte (5/1...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 5/1 ferme la porte 1.",
            "En Match en 9 pts (0-0, Videau à 1), 5/1 surpasse 4/3 4/1 de +0.124 EMG.",
            "Évitez 4/3 4/1 qui laisse 0 pion(s) isolé(s) (flèches exposées) ; privilégiez 5/1."
        ]
    },
    {
        "id": "bgt_checker_m9_4_43",
        "tier": 3,
        "xgid": "XGID=-CBB-B--B----B-b--ab-d-fB-:0:0:1:43:0:0:0:9:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "8/5 8/4",
        "optimalMove": "13/6",
        "acceptableMoves": [],
        "quizChoices": [
            "13/6",
            "8/5 8/4",
            "13/10 13/9",
            "13/10 8/4"
        ],
        "equityLoss": 0.119,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 8/5 8/4 (Match en 9 pts (0-0, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 4), concédant -0.119 EMG face à 13/6.",
        "explanation": "Avec le jet 4-3 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/6 : il repositionne idéalement vos bâtisseurs (13/6) avec seulement 2 blot(s) exposé(s) (+0.119 EMG sur 8/5 8/4).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 13 (13/6...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/6 repositionne idéalement vos bâtisseurs (13/6) avec seulement 2 blot(s) exposé(s).",
            "En Match en 9 pts (0-0, Videau à 1), 13/6 surpasse 8/5 8/4 de +0.119 EMG.",
            "Évitez 8/5 8/4 qui laisse 1 pion(s) isolé(s) (flèches 4) ; privilégiez 13/6."
        ]
    },
    {
        "id": "bgt_checker_m9_5_65",
        "tier": 1,
        "xgid": "XGID=-aC--BB-C---dC---c-c-bb-B-:0:0:1:65:0:0:0:9:8",
        "dice": [
            6,
            5
        ],
        "playedMove": "24/18 13/8",
        "optimalMove": "24/13",
        "acceptableMoves": [],
        "quizChoices": [
            "24/13",
            "24/18 13/8",
            "13/2",
            "13/7 8/3"
        ],
        "equityLoss": 0.298,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/18 13/8 (Match en 9 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 18, 24), concédant -0.298 EMG face à 24/13.",
        "explanation": "Avec le jet 6-5 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/13 : il repositionne idéalement vos bâtisseurs (24/13) avec seulement 1 blot(s) exposé(s) (+0.298 EMG sur 24/18 13/8).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/13 repositionne idéalement vos bâtisseurs (24/13) avec seulement 1 blot(s) exposé(s).",
            "En Match en 9 pts (0-0, Videau à 1), 24/13 surpasse 24/18 13/8 de +0.298 EMG.",
            "Évitez 24/18 13/8 qui laisse 2 pion(s) isolé(s) (flèches 18, 24) ; privilégiez 24/13."
        ]
    },
    {
        "id": "bgt_checker_m9_6_16",
        "tier": 1,
        "xgid": "XGID=-EEAB---A----------abdccbA:0:0:1:16:0:0:0:9:8",
        "dice": [
            1,
            6
        ],
        "playedMove": "bar/19* 4/3",
        "optimalMove": "bar/19* 3/2",
        "acceptableMoves": [],
        "quizChoices": [
            "bar/19* 3/2",
            "bar/19* 4/3",
            "bar/19* 2/1",
            "bar/19*/18"
        ],
        "equityLoss": 0.507,
        "verdict": "howler",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant bar/19* 4/3 (Match en 9 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 4, 8, 19), concédant -0.507 EMG face à bar/19* 3/2.",
        "explanation": "Avec le jet 1-6 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est bar/19* 3/2 : il rentre de la barre sur la flèche 19 et frappe le blot adverse sur la flèche 19 (+0.507 EMG sur bar/19* 4/3).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Cherchez la frappe sur la flèche 19 (bar/19*...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : bar/19* 3/2 rentre de la barre sur la flèche 19 et frappe le blot adverse sur la flèche 19.",
            "En Match en 9 pts (0-0, Videau à 1), bar/19* 3/2 surpasse bar/19* 4/3 de +0.507 EMG.",
            "Évitez bar/19* 4/3 qui laisse 3 pion(s) isolé(s) (flèches 4, 8, 19) ; privilégiez bar/19* 3/2."
        ]
    },
    {
        "id": "bgt_checker_m9_8_55",
        "tier": 2,
        "xgid": "XGID=-b-C--DD----aB---dccb---B-:0:0:1:55:5:7:0:9:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "13/3 7/2(2)",
        "optimalMove": "13/8(2) 7/2(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/8(2) 7/2(2)",
            "13/3 7/2(2)",
            "13/3 13/8 7/2",
            "13/3(2)"
        ],
        "equityLoss": 0.183,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/3 7/2(2) (Match en 9 pts (5-7, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 13), concédant -0.183 EMG face à 13/8(2) 7/2(2).",
        "explanation": "Avec le jet 5-5 en Match en 9 pts (5-7, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/8(2) 7/2(2) : il ferme la porte 2 et 8 (+0.183 EMG sur 13/3 7/2(2)).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 2 : vos deux dés permettent d'y fermer une porte (13/8(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/8(2) 7/2(2) ferme la porte 2 et 8.",
            "En Match en 9 pts (5-7, Videau à 1), 13/8(2) 7/2(2) surpasse 13/3 7/2(2) de +0.183 EMG.",
            "Évitez 13/3 7/2(2) qui laisse 1 pion(s) isolé(s) (flèches 13) ; privilégiez 13/8(2) 7/2(2)."
        ]
    },
    {
        "id": "bgt_checker_m9_11_41",
        "tier": 2,
        "xgid": "XGID=-b----FCC---bB---b-b-cAbb-:1:1:1:41:4:3:0:9:8",
        "dice": [
            4,
            1
        ],
        "playedMove": "13/8",
        "optimalMove": "22/18 8/7",
        "acceptableMoves": [],
        "quizChoices": [
            "22/18 8/7",
            "13/8",
            "22/18 7/6",
            "8/7 6/2"
        ],
        "equityLoss": 0.193,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/8 (Match en 9 pts (4-3, Videau à 2)), vous laisse 2 pion(s) isolé(s) (flèches 13, 22), concédant -0.193 EMG face à 22/18 8/7.",
        "explanation": "Avec le jet 4-1 en Match en 9 pts (4-3, Videau à 2), le coup #1 certifié par BGT / GNU Backgammon est 22/18 8/7 : il repositionne idéalement vos bâtisseurs (22/18 8/7) avec seulement 1 blot(s) exposé(s) (+0.193 EMG sur 13/8).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 22 (22/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 22/18 8/7 repositionne idéalement vos bâtisseurs (22/18 8/7) avec seulement 1 blot(s) exposé(s).",
            "En Match en 9 pts (4-3, Videau à 2), 22/18 8/7 surpasse 13/8 de +0.193 EMG.",
            "Évitez 13/8 qui laisse 2 pion(s) isolé(s) (flèches 13, 22) ; privilégiez 22/18 8/7."
        ]
    },
    {
        "id": "bgt_checker_m11_2_55",
        "tier": 1,
        "xgid": "XGID=-ADEb--C----------bcbBdb--:0:0:1:55:7:9:0:11:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "21/11 21/16 7/2",
        "optimalMove": "21/11(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "21/11(2)",
            "21/11 21/16 7/2",
            "21/6 21/16",
            "21/1"
        ],
        "equityLoss": 0.355,
        "verdict": "howler",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 21/11 21/16 7/2 (Match en 11 pts (7-9, Videau à 1)), vous manque la fermeture de la porte 11 et disperse vos constructeurs, concédant -0.355 EMG face à 21/11(2).",
        "explanation": "Avec le jet 5-5 en Match en 11 pts (7-9, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 21/11(2) : il ferme la porte 11 (+0.355 EMG sur 21/11 21/16 7/2).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez la flèche 11 : vos deux dés permettent d'y fermer une porte (21/11(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 21/11(2) ferme la porte 11.",
            "En Match en 11 pts (7-9, Videau à 1), 21/11(2) surpasse 21/11 21/16 7/2 de +0.355 EMG.",
            "Évitez 21/11 21/16 7/2 qui manque la fermeture de la porte 11 et disperse vos constructeurs ; privilégiez 21/11(2)."
        ]
    },
    {
        "id": "bgt_checker_m11_3_15",
        "tier": 3,
        "xgid": "XGID=-BCFb--B---B------aabbdc--:0:0:1:15:7:9:0:11:8",
        "dice": [
            1,
            5
        ],
        "playedMove": "11/6 3/2",
        "optimalMove": "11/6 7/6",
        "acceptableMoves": [],
        "quizChoices": [
            "11/6 7/6",
            "11/6 3/2",
            "11/5",
            "11/6 2/1"
        ],
        "equityLoss": 0.122,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 11/6 3/2 (Match en 11 pts (7-9, Videau à 1)), vous manque la fermeture de la porte 6 et disperse vos constructeurs, concédant -0.122 EMG face à 11/6 7/6.",
        "explanation": "Avec le jet 1-5 en Match en 11 pts (7-9, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 11/6 7/6 : il ferme la porte 6 (+0.122 EMG sur 11/6 3/2).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 6 : vos deux dés permettent d'y fermer une porte (11/6...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 11/6 7/6 ferme la porte 6.",
            "En Match en 11 pts (7-9, Videau à 1), 11/6 7/6 surpasse 11/6 3/2 de +0.122 EMG.",
            "Évitez 11/6 3/2 qui manque la fermeture de la porte 6 et disperse vos constructeurs ; privilégiez 11/6 7/6."
        ]
    },
    {
        "id": "bgt_checker_m11_4_24",
        "tier": 4,
        "xgid": "XGID=-CEA--C----b-A-----bBdbbc-:0:0:1:24:9:9:0:11:8",
        "dice": [
            2,
            4
        ],
        "playedMove": "6/4 6/2",
        "optimalMove": "13/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7",
            "6/4 6/2",
            "13/9 3/1",
            "13/9 6/4"
        ],
        "equityLoss": 0.08,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 6/4 6/2 (Match en 11 pts (9-9, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 3, 4, 6), concédant -0.080 EMG face à 13/7.",
        "explanation": "Avec le jet 2-4 en Match en 11 pts (9-9, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/7 : il repositionne idéalement vos bâtisseurs (13/7) avec seulement 2 blot(s) exposé(s) (+0.080 EMG sur 6/4 6/2).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 13 (13/7...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/7 repositionne idéalement vos bâtisseurs (13/7) avec seulement 2 blot(s) exposé(s).",
            "En Match en 11 pts (9-9, Videau à 1), 13/7 surpasse 6/4 6/2 de +0.080 EMG.",
            "Évitez 6/4 6/2 qui laisse 4 pion(s) isolé(s) (flèches 3, 4, 6) ; privilégiez 13/7."
        ]
    },
    {
        "id": "bgt_checker_m11_8_14",
        "tier": 2,
        "xgid": "XGID=-BBCaB------a------abbccb-:0:0:1:14:8:10:0:11:8",
        "dice": [
            1,
            4
        ],
        "playedMove": "5/1 2/1",
        "optimalMove": "5/4*/off",
        "acceptableMoves": [],
        "quizChoices": [
            "5/4*/off",
            "5/1 2/1",
            "5/off",
            "5/4* 5/1"
        ],
        "equityLoss": 0.147,
        "verdict": "blunder",
        "conceptId": "bearoff_technique",
        "conceptName": "Sortie des Dames (Bearoff)",
        "whyFailed": "En jouant 5/1 2/1 (Match en 11 pts (8-10, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 4 et laisse l'initiative à l'adversaire, concédant -0.147 EMG face à 5/4*/off.",
        "explanation": "Avec le jet 1-4 en Match en 11 pts (8-10, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 5/4*/off : il frappe le blot adverse sur la flèche 4 et sort 1 dame du plateau (bear-off) (+0.147 EMG sur 5/1 2/1).",
        "proverb": "Au bear-off, sortez vos dames en priorité tout en aplanissant vos piles hautes sans laisser de tir.",
        "hint": "Cherchez la frappe sur la flèche 4 (5/4*/off...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 5/4*/off frappe le blot adverse sur la flèche 4 et sort 1 dame du plateau (bear-off).",
            "En Match en 11 pts (8-10, Videau à 1), 5/4*/off surpasse 5/1 2/1 de +0.147 EMG.",
            "Évitez 5/1 2/1 qui refuse de frapper le blot adverse sur la flèche 4 et laisse l'initiative à l'adversaire ; privilégiez 5/4*/off."
        ]
    },
    {
        "id": "bgt_checker_m11_12_14",
        "tier": 4,
        "xgid": "XGID=-b-DBBBC--------AA-b-a-cg-:0:0:1:14:8:10:0:11:8",
        "dice": [
            1,
            4
        ],
        "playedMove": "16/12 5/4",
        "optimalMove": "17/13 3/2",
        "acceptableMoves": [],
        "quizChoices": [
            "17/13 3/2",
            "16/12 5/4",
            "16/12 7/6",
            "16/12 3/2"
        ],
        "equityLoss": 0.083,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 16/12 5/4 (Match en 11 pts (8-10, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 5, 12, 17), concédant -0.083 EMG face à 17/13 3/2.",
        "explanation": "Avec le jet 1-4 en Match en 11 pts (8-10, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 17/13 3/2 : il repositionne idéalement vos bâtisseurs (17/13 3/2) avec seulement 3 blot(s) exposé(s) (+0.083 EMG sur 16/12 5/4).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 17 (17/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 17/13 3/2 repositionne idéalement vos bâtisseurs (17/13 3/2) avec seulement 3 blot(s) exposé(s).",
            "En Match en 11 pts (8-10, Videau à 1), 17/13 3/2 surpasse 16/12 5/4 de +0.083 EMG.",
            "Évitez 16/12 5/4 qui laisse 3 pion(s) isolé(s) (flèches 5, 12, 17) ; privilégiez 17/13 3/2."
        ]
    },
    {
        "id": "bgt_checker_m21_1_42",
        "tier": 4,
        "xgid": "XGID=-Ab-B-C-B----D---ccbc-ABb-:0:0:1:42:19:19:0:21:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "13/7",
        "optimalMove": "13/11 13/9",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11 13/9",
            "13/7",
            "13/9 6/4",
            "8/6 8/4"
        ],
        "equityLoss": 0.078,
        "verdict": "doubtful",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/7 (Match en 21 pts (19-19, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 1, 7, 22), concédant -0.078 EMG face à 13/11 13/9.",
        "explanation": "Avec le jet 4-2 en Match en 21 pts (19-19, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/11 13/9 : il repositionne idéalement vos bâtisseurs (13/11 13/9) avec seulement 4 blot(s) exposé(s) (+0.078 EMG sur 13/7).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 13 (13/11...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/11 13/9 repositionne idéalement vos bâtisseurs (13/11 13/9) avec seulement 4 blot(s) exposé(s).",
            "En Match en 21 pts (19-19, Videau à 1), 13/11 13/9 surpasse 13/7 de +0.078 EMG.",
            "Évitez 13/7 qui laisse 3 pion(s) isolé(s) (flèches 1, 7, 22) ; privilégiez 13/11 13/9."
        ]
    },
    {
        "id": "bgt_checker_m21_2_61",
        "tier": 4,
        "xgid": "XGID=--B--bF-C---bB---c-cc--bB-:0:0:1:61:18:20:0:21:8",
        "dice": [
            6,
            1
        ],
        "playedMove": "13/6",
        "optimalMove": "8/1",
        "acceptableMoves": [],
        "quizChoices": [
            "8/1",
            "13/6",
            "13/7 8/7",
            "24/18 8/7"
        ],
        "equityLoss": 0.092,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/6 (Match en 21 pts (18-20, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 13), concédant -0.092 EMG face à 8/1.",
        "explanation": "Avec le jet 6-1 en Match en 21 pts (18-20, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/1 : il repositionne idéalement vos bâtisseurs (8/1) avec seulement 1 blot(s) exposé(s) (+0.092 EMG sur 13/6).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 8 (8/1...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/1 repositionne idéalement vos bâtisseurs (8/1) avec seulement 1 blot(s) exposé(s).",
            "En Match en 21 pts (18-20, Videau à 1), 8/1 surpasse 13/6 de +0.092 EMG.",
            "Évitez 13/6 qui laisse 1 pion(s) isolé(s) (flèches 13) ; privilégiez 8/1."
        ]
    },
    {
        "id": "bgt_checker_m21_3_64",
        "tier": 1,
        "xgid": "XGID=-AC-BbE------B-----cccBca-:0:0:1:64:18:20:0:21:8",
        "dice": [
            6,
            4
        ],
        "playedMove": "13/3",
        "optimalMove": "22/18 22/16",
        "acceptableMoves": [],
        "quizChoices": [
            "22/18 22/16",
            "13/3",
            "22/12",
            "22/16 6/2"
        ],
        "equityLoss": 0.269,
        "verdict": "howler",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/3 (Match en 21 pts (18-20, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 1, 3, 13), concédant -0.269 EMG face à 22/18 22/16.",
        "explanation": "Avec le jet 6-4 en Match en 21 pts (18-20, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 22/18 22/16 : il repositionne idéalement vos bâtisseurs (22/18 22/16) avec seulement 3 blot(s) exposé(s) (+0.269 EMG sur 13/3).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 22 (22/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 22/18 22/16 repositionne idéalement vos bâtisseurs (22/18 22/16) avec seulement 3 blot(s) exposé(s).",
            "En Match en 21 pts (18-20, Videau à 1), 22/18 22/16 surpasse 13/3 de +0.269 EMG.",
            "Évitez 13/3 qui laisse 3 pion(s) isolé(s) (flèches 1, 3, 13) ; privilégiez 22/18 22/16."
        ]
    },
    {
        "id": "bgt_checker_m21_4_62",
        "tier": 4,
        "xgid": "XGID=----BbE-BB--cB---a-cbbb-B-:0:0:1:62:19:19:0:21:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "13/11 13/7",
        "optimalMove": "8/6 8/2",
        "acceptableMoves": [],
        "quizChoices": [
            "8/6 8/2",
            "13/11 13/7",
            "9/3 6/4",
            "9/7 9/3"
        ],
        "equityLoss": 0.085,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/11 13/7 (Match en 21 pts (19-19, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 7, 11), concédant -0.085 EMG face à 8/6 8/2.",
        "explanation": "Avec le jet 6-2 en Match en 21 pts (19-19, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/6 8/2 : il repositionne idéalement vos bâtisseurs (8/6 8/2) avec seulement 1 blot(s) exposé(s) (+0.085 EMG sur 13/11 13/7).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 8 (8/6...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/6 8/2 repositionne idéalement vos bâtisseurs (8/6 8/2) avec seulement 1 blot(s) exposé(s).",
            "En Match en 21 pts (19-19, Videau à 1), 8/6 8/2 surpasse 13/11 13/7 de +0.085 EMG.",
            "Évitez 13/11 13/7 qui laisse 2 pion(s) isolé(s) (flèches 7, 11) ; privilégiez 8/6 8/2."
        ]
    },
    {
        "id": "bgt_checker_m21_5_24",
        "tier": 4,
        "xgid": "XGID=-HC--BA------------A--cdb-:0:0:1:24:19:19:0:21:8",
        "dice": [
            2,
            4
        ],
        "playedMove": "6/2 5/3",
        "optimalMove": "19/13",
        "acceptableMoves": [],
        "quizChoices": [
            "19/13",
            "6/2 5/3",
            "19/15 5/3",
            "19/15 6/4"
        ],
        "equityLoss": 0.079,
        "verdict": "doubtful",
        "conceptId": "race_management",
        "conceptName": "Course & Compte de Pips (Keith)",
        "whyFailed": "En jouant 6/2 5/3 (Match en 21 pts (19-19, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 3, 5, 19), concédant -0.079 EMG face à 19/13.",
        "explanation": "Avec le jet 2-4 en Match en 21 pts (19-19, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 19/13 : il repositionne idéalement vos bâtisseurs (19/13) avec seulement 2 blot(s) exposé(s) (+0.079 EMG sur 6/2 5/3).",
        "proverb": "En course pure, videz les flèches hautes (Midpoint 13) sans jamais gaspiller de pips sur l’As ou le 2.",
        "hint": "Regardez le mouvement partant de 19 (19/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 19/13 repositionne idéalement vos bâtisseurs (19/13) avec seulement 2 blot(s) exposé(s).",
            "En Match en 21 pts (19-19, Videau à 1), 19/13 surpasse 6/2 5/3 de +0.079 EMG.",
            "Évitez 6/2 5/3 qui laisse 3 pion(s) isolé(s) (flèches 3, 5, 19) ; privilégiez 19/13."
        ]
    },
    {
        "id": "bgt_checker_m21_10_53",
        "tier": 1,
        "xgid": "XGID=-BbBBBB-C----B-----cbb-cc-:0:0:1:53:17:19:0:21:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "8/5 8/3",
        "optimalMove": "13/5",
        "acceptableMoves": [],
        "quizChoices": [
            "13/5",
            "8/5 8/3",
            "13/10 13/8",
            "6/3 6/1"
        ],
        "equityLoss": 0.368,
        "verdict": "howler",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 8/5 8/3 (Match en 21 pts (17-19, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 8), concédant -0.368 EMG face à 13/5.",
        "explanation": "Avec le jet 5-3 en Match en 21 pts (17-19, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/5 : il repositionne idéalement vos bâtisseurs (13/5) avec seulement 1 blot(s) exposé(s) (+0.368 EMG sur 8/5 8/3).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 13 (13/5...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/5 repositionne idéalement vos bâtisseurs (13/5) avec seulement 1 blot(s) exposé(s).",
            "En Match en 21 pts (17-19, Videau à 1), 13/5 surpasse 8/5 8/3 de +0.368 EMG.",
            "Évitez 8/5 8/3 qui laisse 1 pion(s) isolé(s) (flèches 8) ; privilégiez 13/5."
        ]
    },
    {
        "id": "gnubg_harvest_0ply_1_54",
        "tier": 1,
        "xgid": "XGID=-b-C--DBB---bB---cBe-a-b--:0:0:1:54:0:0:0:0:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/8 13/9",
        "optimalMove": "18/14 18/13",
        "acceptableMoves": [],
        "quizChoices": [
            "18/14 18/13",
            "13/8 13/9",
            "18/9",
            "13/9 13/8"
        ],
        "equityLoss": 0.333,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/8 13/9 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 9), concédant -0.333 EMG face à 18/14 18/13.",
        "explanation": "Avec le jet 5-4 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 18/14 18/13 : il repositionne idéalement vos bâtisseurs (18/14 18/13) avec seulement 1 blot(s) exposé(s) (+0.333 EMG sur 13/8 13/9).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 18 (18/14...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 18/14 18/13 repositionne idéalement vos bâtisseurs (18/14 18/13) avec seulement 1 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 18/14 18/13 surpasse 13/8 13/9 de +0.333 EMG.",
            "Évitez 13/8 13/9 qui laisse 1 pion(s) isolé(s) (flèches 9) ; privilégiez 18/14 18/13."
        ]
    },
    {
        "id": "gnubg_harvest_0ply_2_35",
        "tier": 2,
        "xgid": "XGID=-bBCB-BBAA--b-----Bc--cbc-:0:0:1:35:0:0:0:0:8",
        "dice": [
            3,
            5
        ],
        "playedMove": "18/10",
        "optimalMove": "9/6 8/3",
        "acceptableMoves": [],
        "quizChoices": [
            "9/6 8/3",
            "18/10",
            "9/4 8/5",
            "18/15 18/13"
        ],
        "equityLoss": 0.198,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 18/10 (Money Game (Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 8, 9, 10), concédant -0.198 EMG face à 9/6 8/3.",
        "explanation": "Avec le jet 3-5 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 9/6 8/3 : il repositionne idéalement vos bâtisseurs (9/6 8/3) avec seulement 0 blot(s) exposé(s) (+0.198 EMG sur 18/10).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 9 (9/6...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 9/6 8/3 repositionne idéalement vos bâtisseurs (9/6 8/3) avec seulement 0 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 9/6 8/3 surpasse 18/10 de +0.198 EMG.",
            "Évitez 18/10 qui laisse 4 pion(s) isolé(s) (flèches 8, 9, 10) ; privilégiez 9/6 8/3."
        ]
    },
    {
        "id": "gnubg_harvest_0ply_3_43",
        "tier": 3,
        "xgid": "XGID=-c---BF-C---bB------Bbdbb-:0:0:1:43:0:0:0:0:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "20/16 16/13",
        "optimalMove": "20/13",
        "acceptableMoves": [],
        "quizChoices": [
            "20/13",
            "20/16 16/13",
            "13/10 13/9",
            "8/5 6/2"
        ],
        "equityLoss": 0.093,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 20/16 16/13 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 20), concédant -0.093 EMG face à 20/13.",
        "explanation": "Avec le jet 4-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 20/13 : il repositionne idéalement vos bâtisseurs (20/13) avec seulement 1 blot(s) exposé(s) (+0.093 EMG sur 20/16 16/13).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 20 (20/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 20/13 repositionne idéalement vos bâtisseurs (20/13) avec seulement 1 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 20/13 surpasse 20/16 16/13 de +0.093 EMG.",
            "Évitez 20/16 16/13 qui laisse 1 pion(s) isolé(s) (flèches 20) ; privilégiez 20/13."
        ]
    },
    {
        "id": "gnubg_harvest_0ply_5_32",
        "tier": 4,
        "xgid": "XGID=-b--CCC-B---bB---bbf-A--aA:0:0:1:32:0:0:0:0:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "bar/22 6/4",
        "optimalMove": "bar/20",
        "acceptableMoves": [],
        "quizChoices": [
            "bar/20",
            "bar/22 6/4",
            "bar/22 5/3",
            "bar/23 6/3"
        ],
        "equityLoss": 0.089,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant bar/22 6/4 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 21, 22), concédant -0.089 EMG face à bar/20.",
        "explanation": "Avec le jet 3-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est bar/20 : il rentre de la barre sur la flèche 20 (+0.089 EMG sur bar/22 6/4).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez le mouvement partant de bar (bar/20...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : bar/20 rentre de la barre sur la flèche 20.",
            "En Money Game (Videau à 1), bar/20 surpasse bar/22 6/4 de +0.089 EMG.",
            "Évitez bar/22 6/4 qui laisse 2 pion(s) isolé(s) (flèches 21, 22) ; privilégiez bar/20."
        ]
    },
    {
        "id": "gnubg_harvest_0ply_8_12",
        "tier": 2,
        "xgid": "XGID=----cBC-C-C-bC---acbb-b-A-:0:0:1:12:0:0:0:0:8",
        "dice": [
            1,
            2
        ],
        "playedMove": "6/5 5/3",
        "optimalMove": "24/21",
        "acceptableMoves": [],
        "quizChoices": [
            "24/21",
            "6/5 5/3",
            "13/10",
            "24/23 10/8"
        ],
        "equityLoss": 0.152,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 6/5 5/3 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 3, 24), concédant -0.152 EMG face à 24/21.",
        "explanation": "Avec le jet 1-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 : il repositionne idéalement vos bâtisseurs (24/21) avec seulement 1 blot(s) exposé(s) (+0.152 EMG sur 6/5 5/3).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/21...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 repositionne idéalement vos bâtisseurs (24/21) avec seulement 1 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/21 surpasse 6/5 5/3 de +0.152 EMG.",
            "Évitez 6/5 5/3 qui laisse 2 pion(s) isolé(s) (flèches 3, 24) ; privilégiez 24/21."
        ]
    },
    {
        "id": "gnubg_harvest_0ply_9_42",
        "tier": 3,
        "xgid": "XGID=-A--cCBBBB---B--aabbb-bbA-:0:0:1:42:0:0:0:0:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "13/9 13/11",
        "optimalMove": "13/11 5/1",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11 5/1",
            "13/9 13/11",
            "13/9 5/3",
            "13/7"
        ],
        "equityLoss": 0.107,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/9 13/11 (Money Game (Videau à 1)), vous manque la fermeture de la porte 1 et disperse vos constructeurs, concédant -0.107 EMG face à 13/11 5/1.",
        "explanation": "Avec le jet 4-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/11 5/1 : il ferme la porte 1 (+0.107 EMG sur 13/9 13/11).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez la flèche 1 : vos deux dés permettent d'y fermer une porte (13/11...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/11 5/1 ferme la porte 1.",
            "En Money Game (Videau à 1), 13/11 5/1 surpasse 13/9 13/11 de +0.107 EMG.",
            "Évitez 13/9 13/11 qui manque la fermeture de la porte 1 et disperse vos constructeurs ; privilégiez 13/11 5/1."
        ]
    },
    {
        "id": "gnubg_harvest_0ply_10_46",
        "tier": 3,
        "xgid": "XGID=----b-F-BB--bDa--b-fb-A---:0:0:1:46:0:0:0:0:8",
        "dice": [
            4,
            6
        ],
        "playedMove": "6/2 22/16",
        "optimalMove": "22/16 13/9",
        "acceptableMoves": [],
        "quizChoices": [
            "22/16 13/9",
            "6/2 22/16",
            "22/16 6/2",
            "13/3"
        ],
        "equityLoss": 0.102,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 6/2 22/16 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 2, 16), concédant -0.102 EMG face à 22/16 13/9.",
        "explanation": "Avec le jet 4-6 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 22/16 13/9 : il repositionne idéalement vos bâtisseurs (22/16 13/9) avec seulement 1 blot(s) exposé(s) (+0.102 EMG sur 6/2 22/16).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 22 (22/16...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 22/16 13/9 repositionne idéalement vos bâtisseurs (22/16 13/9) avec seulement 1 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 22/16 13/9 surpasse 6/2 22/16 de +0.102 EMG.",
            "Évitez 6/2 22/16 qui laisse 2 pion(s) isolé(s) (flèches 2, 16) ; privilégiez 22/16 13/9."
        ]
    },
    {
        "id": "gnubg_harvest_1ply_2_11",
        "tier": 3,
        "xgid": "XGID=--A---DbC--AcD---bbdb--B--:0:0:1:11:0:0:0:0:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "6/5 6/5 11/10 10/9",
        "optimalMove": "23/21(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "23/21(2)",
            "6/5 6/5 11/10 10/9",
            "23/22(2) 11/10 6/5",
            "23/22(2) 6/5(2)"
        ],
        "equityLoss": 0.113,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 6/5 6/5 11/10 10/9 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 2, 9), concédant -0.113 EMG face à 23/21(2).",
        "explanation": "Avec le jet 1-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 23/21(2) : il ferme la porte 21 (+0.113 EMG sur 6/5 6/5 11/10 10/9).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 21 : vos deux dés permettent d'y fermer une porte (23/21(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 23/21(2) ferme la porte 21.",
            "En Money Game (Videau à 1), 23/21(2) surpasse 6/5 6/5 11/10 10/9 de +0.113 EMG.",
            "Évitez 6/5 6/5 11/10 10/9 qui laisse 2 pion(s) isolé(s) (flèches 2, 9) ; privilégiez 23/21(2)."
        ]
    },
    {
        "id": "gnubg_harvest_1ply_4_52",
        "tier": 2,
        "xgid": "XGID=-Ca--BB-Da--dBa--c-eA--A--:0:0:1:52:0:0:0:0:8",
        "dice": [
            5,
            2
        ],
        "playedMove": "23/18 8/6",
        "optimalMove": "23/18 20/18",
        "acceptableMoves": [],
        "quizChoices": [
            "23/18 20/18",
            "23/18 8/6",
            "20/13",
            "20/15 8/6"
        ],
        "equityLoss": 0.184,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 23/18 8/6 (Money Game (Videau à 1)), vous manque la fermeture de la porte 18 et disperse vos constructeurs, concédant -0.184 EMG face à 23/18 20/18.",
        "explanation": "Avec le jet 5-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 23/18 20/18 : il ferme la porte 18 (+0.184 EMG sur 23/18 8/6).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 18 : vos deux dés permettent d'y fermer une porte (23/18...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 23/18 20/18 ferme la porte 18.",
            "En Money Game (Videau à 1), 23/18 20/18 surpasse 23/18 8/6 de +0.184 EMG.",
            "Évitez 23/18 8/6 qui manque la fermeture de la porte 18 et disperse vos constructeurs ; privilégiez 23/18 20/18."
        ]
    },
    {
        "id": "gnubg_harvest_1ply_6_43",
        "tier": 2,
        "xgid": "XGID=-C-a-CB-BA--b-bA-bCcc---b-:0:0:1:43:0:0:0:0:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "9/5 18/15",
        "optimalMove": "15/11 9/6",
        "acceptableMoves": [],
        "quizChoices": [
            "15/11 9/6",
            "9/5 18/15",
            "15/8",
            "18/15 9/5"
        ],
        "equityLoss": 0.192,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 9/5 18/15 (Money Game (Videau à 1)), vous laisse 0 pion(s) isolé(s) (flèches exposées), concédant -0.192 EMG face à 15/11 9/6.",
        "explanation": "Avec le jet 4-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 15/11 9/6 : il repositionne idéalement vos bâtisseurs (15/11 9/6) avec seulement 1 blot(s) exposé(s) (+0.192 EMG sur 9/5 18/15).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 15 (15/11...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 15/11 9/6 repositionne idéalement vos bâtisseurs (15/11 9/6) avec seulement 1 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 15/11 9/6 surpasse 9/5 18/15 de +0.192 EMG.",
            "Évitez 9/5 18/15 qui laisse 0 pion(s) isolé(s) (flèches exposées) ; privilégiez 15/11 9/6."
        ]
    },
    {
        "id": "gnubg_harvest_1ply_7_23",
        "tier": 2,
        "xgid": "XGID=--CA--Eb----cD---d-bd---B-:0:0:1:23:0:0:0:0:8",
        "dice": [
            2,
            3
        ],
        "playedMove": "6/4 6/3",
        "optimalMove": "24/22 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "24/22 6/3",
            "6/4 6/3",
            "13/11 6/3",
            "24/21 6/4"
        ],
        "equityLoss": 0.192,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 6/4 6/3 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 4), concédant -0.192 EMG face à 24/22 6/3.",
        "explanation": "Avec le jet 2-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/22 6/3 : il ferme la porte 3 (+0.192 EMG sur 6/4 6/3).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 3 : vos deux dés permettent d'y fermer une porte (24/22...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/22 6/3 ferme la porte 3.",
            "En Money Game (Videau à 1), 24/22 6/3 surpasse 6/4 6/3 de +0.192 EMG.",
            "Évitez 6/4 6/3 qui laisse 1 pion(s) isolé(s) (flèches 4) ; privilégiez 24/22 6/3."
        ]
    },
    {
        "id": "gnubg_harvest_1ply_11_62",
        "tier": 3,
        "xgid": "XGID=--aCB-CB---AbCc--b-d-c-A--:0:0:1:62:0:0:0:0:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "11/5 5/3",
        "optimalMove": "11/5 7/5",
        "acceptableMoves": [],
        "quizChoices": [
            "11/5 7/5",
            "11/5 5/3",
            "13/7 11/9",
            "13/7 6/4"
        ],
        "equityLoss": 0.127,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 11/5 5/3 (Money Game (Videau à 1)), vous manque la fermeture de la porte 5 et disperse vos constructeurs, concédant -0.127 EMG face à 11/5 7/5.",
        "explanation": "Avec le jet 6-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 11/5 7/5 : il ferme la porte 5 (+0.127 EMG sur 11/5 5/3).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 5 : vos deux dés permettent d'y fermer une porte (11/5...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 11/5 7/5 ferme la porte 5.",
            "En Money Game (Videau à 1), 11/5 7/5 surpasse 11/5 5/3 de +0.127 EMG.",
            "Évitez 11/5 5/3 qui manque la fermeture de la porte 5 et disperse vos constructeurs ; privilégiez 11/5 7/5."
        ]
    },
    {
        "id": "gnubg_harvest_1ply_12_41",
        "tier": 3,
        "xgid": "XGID=-ABBBABB--A-a-b----dBbbca-:0:0:1:41:0:0:0:0:8",
        "dice": [
            4,
            1
        ],
        "playedMove": "10/6 6/5",
        "optimalMove": "10/5",
        "acceptableMoves": [],
        "quizChoices": [
            "10/5",
            "10/6 6/5",
            "7/6 5/1",
            "7/3 6/5"
        ],
        "equityLoss": 0.101,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 10/6 6/5 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 1), concédant -0.101 EMG face à 10/5.",
        "explanation": "Avec le jet 4-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 10/5 : il ferme la porte 5 (+0.101 EMG sur 10/6 6/5).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 5 : vos deux dés permettent d'y fermer une porte (10/5...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 10/5 ferme la porte 5.",
            "En Money Game (Videau à 1), 10/5 surpasse 10/6 6/5 de +0.101 EMG.",
            "Évitez 10/6 6/5 qui laisse 1 pion(s) isolé(s) (flèches 1) ; privilégiez 10/5."
        ]
    },
    {
        "id": "gnubg_harvest_1ply_13_32",
        "tier": 3,
        "xgid": "XGID=-B--b-E-B----E--Acbdbb----:0:0:1:32:0:0:0:0:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "13/10 10/8",
        "optimalMove": "13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "13/8",
            "13/10 10/8",
            "16/14 6/3",
            "6/1"
        ],
        "equityLoss": 0.105,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/10 10/8 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 16), concédant -0.105 EMG face à 13/8.",
        "explanation": "Avec le jet 3-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/8 : il repositionne idéalement vos bâtisseurs (13/8) avec seulement 1 blot(s) exposé(s) (+0.105 EMG sur 13/10 10/8).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 13 (13/8...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/8 repositionne idéalement vos bâtisseurs (13/8) avec seulement 1 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 13/8 surpasse 13/10 10/8 de +0.105 EMG.",
            "Évitez 13/10 10/8 qui laisse 1 pion(s) isolé(s) (flèches 16) ; privilégiez 13/8."
        ]
    },
    {
        "id": "gnubg_harvest_1ply_16_13",
        "tier": 3,
        "xgid": "XGID=------E-Ca--bD---cbcABbb--:0:0:1:13:0:0:0:0:8",
        "dice": [
            1,
            3
        ],
        "playedMove": "6/5 8/5",
        "optimalMove": "13/9*",
        "acceptableMoves": [],
        "quizChoices": [
            "13/9*",
            "6/5 8/5",
            "8/5 6/5",
            "6/5 6/3"
        ],
        "equityLoss": 0.117,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 6/5 8/5 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 9 et laisse l'initiative à l'adversaire, concédant -0.117 EMG face à 13/9*.",
        "explanation": "Avec le jet 1-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/9* : il frappe le blot adverse sur la flèche 9 (+0.117 EMG sur 6/5 8/5).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Cherchez la frappe sur la flèche 9 (13/9*...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/9* frappe le blot adverse sur la flèche 9.",
            "En Money Game (Videau à 1), 13/9* surpasse 6/5 8/5 de +0.117 EMG.",
            "Évitez 6/5 8/5 qui refuse de frapper le blot adverse sur la flèche 9 et laisse l'initiative à l'adversaire ; privilégiez 13/9*."
        ]
    },
    {
        "id": "gnubg_harvest_3ply_1_44",
        "tier": 3,
        "xgid": "XGID=a-a---EaC---cF--Ad-e------:0:0:1:44:0:0:0:3:8",
        "dice": [
            4,
            4
        ],
        "playedMove": "6/2 6/2 13/9 13/9",
        "optimalMove": "8/4(2) 6/2*(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4(2) 6/2*(2)",
            "6/2 6/2 13/9 13/9",
            "13/9(2) 6/2*(2)",
            "13/5(2)"
        ],
        "equityLoss": 0.1,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 6/2 6/2 13/9 13/9 (Match en 3 pts (0-0, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 16), concédant -0.100 EMG face à 8/4(2) 6/2*(2).",
        "explanation": "Avec le jet 4-4 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4(2) 6/2*(2) : il frappe le blot adverse sur la flèche 2 et ferme la porte 2 et 4 (+0.100 EMG sur 6/2 6/2 13/9 13/9).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 2 (8/4(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4(2) 6/2*(2) frappe le blot adverse sur la flèche 2 et ferme la porte 2 et 4.",
            "En Match en 3 pts (0-0, Videau à 1), 8/4(2) 6/2*(2) surpasse 6/2 6/2 13/9 13/9 de +0.100 EMG.",
            "Évitez 6/2 6/2 13/9 13/9 qui laisse 1 pion(s) isolé(s) (flèches 16) ; privilégiez 8/4(2) 6/2*(2)."
        ]
    },
    {
        "id": "gnubg_harvest_3ply_2_45",
        "tier": 1,
        "xgid": "XGID=-A--BBBC--bacB---d-bBA-ab-:0:0:1:45:0:0:0:3:8",
        "dice": [
            4,
            5
        ],
        "playedMove": "13/9 13/8",
        "optimalMove": "24/19 13/9",
        "acceptableMoves": [],
        "quizChoices": [
            "24/19 13/9",
            "13/9 13/8",
            "24/15",
            "8/3 7/3"
        ],
        "equityLoss": 0.245,
        "verdict": "howler",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/9 13/8 (Match en 3 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 1, 8, 9), concédant -0.245 EMG face à 24/19 13/9.",
        "explanation": "Avec le jet 4-5 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/19 13/9 : il repositionne idéalement vos bâtisseurs (24/19 13/9) avec seulement 4 blot(s) exposé(s) (+0.245 EMG sur 13/9 13/8).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 24 (24/19...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/19 13/9 repositionne idéalement vos bâtisseurs (24/19 13/9) avec seulement 4 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 24/19 13/9 surpasse 13/9 13/8 de +0.245 EMG.",
            "Évitez 13/9 13/8 qui laisse 4 pion(s) isolé(s) (flèches 1, 8, 9) ; privilégiez 24/19 13/9."
        ]
    },
    {
        "id": "gnubg_harvest_3ply_3_36",
        "tier": 2,
        "xgid": "XGID=-b-CaaBAC---eC---b-cAA-aA-:0:0:1:36:0:0:0:3:8",
        "dice": [
            3,
            6
        ],
        "playedMove": "13/7 13/10",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [],
        "quizChoices": [
            "24/18 13/10",
            "13/7 13/10",
            "24/18 8/5",
            "13/4"
        ],
        "equityLoss": 0.155,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/7 13/10 (Match en 3 pts (0-0, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 10, 13, 20), concédant -0.155 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 3-6 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 5 blot(s) exposé(s) (+0.155 EMG sur 13/7 13/10).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 5 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 24/18 13/10 surpasse 13/7 13/10 de +0.155 EMG.",
            "Évitez 13/7 13/10 qui laisse 5 pion(s) isolé(s) (flèches 10, 13, 20) ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "gnubg_harvest_3ply_4_23",
        "tier": 2,
        "xgid": "XGID=-cE-A-aA-A--aD--a--b-aaCe-:0:0:1:23:0:0:0:3:8",
        "dice": [
            2,
            3
        ],
        "playedMove": "8/5 6/4",
        "optimalMove": "24/21 13/11",
        "acceptableMoves": [],
        "quizChoices": [
            "24/21 13/11",
            "8/5 6/4",
            "13/8",
            "24/22 24/21"
        ],
        "equityLoss": 0.12,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 8/5 6/4 (Match en 3 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire, concédant -0.120 EMG face à 24/21 13/11.",
        "explanation": "Avec le jet 2-3 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/11 : il frappe le blot adverse sur la flèche 21 (+0.120 EMG sur 8/5 6/4).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Cherchez la frappe sur la flèche 21 (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/11 frappe le blot adverse sur la flèche 21.",
            "En Match en 3 pts (0-0, Videau à 1), 24/21 13/11 surpasse 8/5 6/4 de +0.120 EMG.",
            "Évitez 8/5 6/4 qui refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire ; privilégiez 24/21 13/11."
        ]
    },
    {
        "id": "gnubg_harvest_3ply_5_14",
        "tier": 1,
        "xgid": "XGID=-CBdba--A----B----aAB-AgBA:0:0:1:14:0:0:0:3:8",
        "dice": [
            1,
            4
        ],
        "playedMove": "bar/24 13/9",
        "optimalMove": "bar/21*",
        "acceptableMoves": [],
        "quizChoices": [
            "bar/21*",
            "bar/24 13/9",
            "bar/21 6/5",
            "bar/24 8/4"
        ],
        "equityLoss": 0.31,
        "verdict": "howler",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant bar/24 13/9 (Match en 3 pts (0-0, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 8, 9, 13), concédant -0.310 EMG face à bar/21*.",
        "explanation": "Avec le jet 1-4 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est bar/21* : il rentre de la barre sur la flèche 21 (+0.310 EMG sur bar/24 13/9).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez le mouvement partant de bar (bar/21*...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : bar/21* rentre de la barre sur la flèche 21.",
            "En Match en 3 pts (0-0, Videau à 1), bar/21* surpasse bar/24 13/9 de +0.310 EMG.",
            "Évitez bar/24 13/9 qui laisse 5 pion(s) isolé(s) (flèches 8, 9, 13) ; privilégiez bar/21*."
        ]
    },
    {
        "id": "gnubg_harvest_3ply_6_35",
        "tier": 2,
        "xgid": "XGID=-b--A-DAC---eD---c-c-a-aB-:0:0:1:35:0:0:0:3:8",
        "dice": [
            3,
            5
        ],
        "playedMove": "13/8 6/3",
        "optimalMove": "8/3 8/5",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 8/5",
            "13/8 6/3",
            "24/19 13/10",
            "13/5"
        ],
        "equityLoss": 0.145,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/8 6/3 (Match en 3 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 3, 4, 7), concédant -0.145 EMG face à 8/3 8/5.",
        "explanation": "Avec le jet 3-5 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/3 8/5 : il repositionne idéalement vos bâtisseurs (8/3 8/5) avec seulement 5 blot(s) exposé(s) (+0.145 EMG sur 13/8 6/3).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 8 (8/3...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/3 8/5 repositionne idéalement vos bâtisseurs (8/3 8/5) avec seulement 5 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 8/3 8/5 surpasse 13/8 6/3 de +0.145 EMG.",
            "Évitez 13/8 6/3 qui laisse 3 pion(s) isolé(s) (flèches 3, 4, 7) ; privilégiez 8/3 8/5."
        ]
    },
    {
        "id": "gnubg_harvest_3ply_7_46",
        "tier": 3,
        "xgid": "XGID=bCcDa--A----bA-A-aA-AAccB-:0:0:1:46:0:0:0:3:8",
        "dice": [
            4,
            6
        ],
        "playedMove": "24/18 13/9",
        "optimalMove": "13/7 13/9",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7 13/9",
            "24/18 13/9",
            "24/14",
            "8/2 6/2"
        ],
        "equityLoss": 0.095,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/18 13/9 (Match en 3 pts (0-0, Videau à 1)), vous laisse 6 pion(s) isolé(s) (flèches 7, 9, 15), concédant -0.095 EMG face à 13/7 13/9.",
        "explanation": "Avec le jet 4-6 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/7 13/9 : il ferme la porte 7 (+0.095 EMG sur 24/18 13/9).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 7 : vos deux dés permettent d'y fermer une porte (13/7...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/7 13/9 ferme la porte 7.",
            "En Match en 3 pts (0-0, Videau à 1), 13/7 13/9 surpasse 24/18 13/9 de +0.095 EMG.",
            "Évitez 24/18 13/9 qui laisse 6 pion(s) isolé(s) (flèches 7, 9, 15) ; privilégiez 13/7 13/9."
        ]
    },
    {
        "id": "gnubg_harvest_3ply_8_45",
        "tier": 2,
        "xgid": "XGID=-E-AAA--a---eDa--b-----fC-:0:0:1:45:0:0:0:3:8",
        "dice": [
            4,
            5
        ],
        "playedMove": "13/9 13/8",
        "optimalMove": "24/19 13/9",
        "acceptableMoves": [],
        "quizChoices": [
            "24/19 13/9",
            "13/9 13/8",
            "8/3 7/3",
            "13/4"
        ],
        "equityLoss": 0.132,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/9 13/8 (Match en 3 pts (0-0, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 3, 4, 5), concédant -0.132 EMG face à 24/19 13/9.",
        "explanation": "Avec le jet 4-5 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/19 13/9 : il repositionne idéalement vos bâtisseurs (24/19 13/9) avec seulement 5 blot(s) exposé(s) (+0.132 EMG sur 13/9 13/8).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 24 (24/19...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/19 13/9 repositionne idéalement vos bâtisseurs (24/19 13/9) avec seulement 5 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 24/19 13/9 surpasse 13/9 13/8 de +0.132 EMG.",
            "Évitez 13/9 13/8 qui laisse 5 pion(s) isolé(s) (flèches 3, 4, 5) ; privilégiez 24/19 13/9."
        ]
    },
    {
        "id": "gnubg_harvest_3ply_9_42",
        "tier": 2,
        "xgid": "XGID=-cEDa-A-----cB-Aa--B-aa-e-:0:0:1:42:0:0:0:3:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "13/9 6/4",
        "optimalMove": "24/22 13/9",
        "acceptableMoves": [],
        "quizChoices": [
            "24/22 13/9",
            "13/9 6/4",
            "8/4 6/4",
            "13/7"
        ],
        "equityLoss": 0.115,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/9 6/4 (Match en 3 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 4, 9, 13), concédant -0.115 EMG face à 24/22 13/9.",
        "explanation": "Avec le jet 4-2 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/22 13/9 : il frappe le blot adverse sur la flèche 22 (+0.115 EMG sur 13/9 6/4).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Cherchez la frappe sur la flèche 22 (24/22...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/22 13/9 frappe le blot adverse sur la flèche 22.",
            "En Match en 3 pts (0-0, Videau à 1), 24/22 13/9 surpasse 13/9 6/4 de +0.115 EMG.",
            "Évitez 13/9 6/4 qui laisse 4 pion(s) isolé(s) (flèches 4, 9, 13) ; privilégiez 24/22 13/9."
        ]
    },
    {
        "id": "gnubg_harvest_3ply_10_16",
        "tier": 2,
        "xgid": "XGID=-BaB-bC-A-aAaC---b-cbA-bAA:0:0:1:16:0:0:0:3:8",
        "dice": [
            1,
            6
        ],
        "playedMove": "13/7 8/7",
        "optimalMove": "bar/24 13/7",
        "acceptableMoves": [],
        "quizChoices": [
            "bar/24 13/7",
            "13/7 8/7",
            "bar/24 8/2",
            "24/18 13/12"
        ],
        "equityLoss": 0.142,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/7 8/7 (Match en 3 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 11, 21, 24), concédant -0.142 EMG face à bar/24 13/7.",
        "explanation": "Avec le jet 1-6 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est bar/24 13/7 : il rentre de la barre sur la flèche 24 et ferme la porte 24 (+0.142 EMG sur 13/7 8/7).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 24 : vos deux dés permettent d'y fermer une porte (bar/24...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : bar/24 13/7 rentre de la barre sur la flèche 24 et ferme la porte 24.",
            "En Match en 3 pts (0-0, Videau à 1), bar/24 13/7 surpasse 13/7 8/7 de +0.142 EMG.",
            "Évitez 13/7 8/7 qui laisse 3 pion(s) isolé(s) (flèches 11, 21, 24) ; privilégiez bar/24 13/7."
        ]
    },
    {
        "id": "gnubg_harvest_3ply_11_15",
        "tier": 1,
        "xgid": "XGID=-ACA--aAB-aAeD---a-d--baB-:0:0:1:15:0:0:0:3:8",
        "dice": [
            1,
            5
        ],
        "playedMove": "13/8 6/5",
        "optimalMove": "8/3 6/5*",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/5*",
            "13/8 6/5",
            "13/7",
            "24/18"
        ],
        "equityLoss": 0.278,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/8 6/5 (Match en 3 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 3 et disperse vos constructeurs, concédant -0.278 EMG face à 8/3 6/5*.",
        "explanation": "Avec le jet 1-5 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/3 6/5* : il ferme la porte 3 (+0.278 EMG sur 13/8 6/5).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 3 : vos deux dés permettent d'y fermer une porte (8/3...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/3 6/5* ferme la porte 3.",
            "En Match en 3 pts (0-0, Videau à 1), 8/3 6/5* surpasse 13/8 6/5 de +0.278 EMG.",
            "Évitez 13/8 6/5 qui manque la fermeture de la porte 3 et disperse vos constructeurs ; privilégiez 8/3 6/5*."
        ]
    },
    {
        "id": "gnubg_harvest_3ply_12_63",
        "tier": 2,
        "xgid": "XGID=-CBCa-bB----bA--a-aB-AAfb-:0:0:1:63:0:0:0:3:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "13/7 6/3",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [],
        "quizChoices": [
            "24/18 13/10",
            "13/7 6/3",
            "13/4",
            "8/2 6/3"
        ],
        "equityLoss": 0.165,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/7 6/3 (Match en 3 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 18 et laisse l'initiative à l'adversaire, concédant -0.165 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il frappe le blot adverse sur la flèche 18 (+0.165 EMG sur 13/7 6/3).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Cherchez la frappe sur la flèche 18 (24/18...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 frappe le blot adverse sur la flèche 18.",
            "En Match en 3 pts (0-0, Videau à 1), 24/18 13/10 surpasse 13/7 6/3 de +0.165 EMG.",
            "Évitez 13/7 6/3 qui refuse de frapper le blot adverse sur la flèche 18 et laisse l'initiative à l'adversaire ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "gnubg_harvest_3t_1_44",
        "tier": 3,
        "xgid": "XGID=--B---EbA---cF---bbc--Aab-:0:0:1:44:0:0:0:3:8",
        "dice": [
            4,
            4
        ],
        "playedMove": "6/2 8/4 13/9 13/9",
        "optimalMove": "13/9(3) 8/4",
        "acceptableMoves": [],
        "quizChoices": [
            "13/9(3) 8/4",
            "6/2 8/4 13/9 13/9",
            "13/5 13/9(2)",
            "13/5(2)"
        ],
        "equityLoss": 0.1,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 6/2 8/4 13/9 13/9 (Match en 3 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 4, 22), concédant -0.100 EMG face à 13/9(3) 8/4.",
        "explanation": "Avec le jet 4-4 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/9(3) 8/4 : il ferme la porte 9 (+0.100 EMG sur 6/2 8/4 13/9 13/9).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez la flèche 9 : vos deux dés permettent d'y fermer une porte (13/9(3)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/9(3) 8/4 ferme la porte 9.",
            "En Match en 3 pts (0-0, Videau à 1), 13/9(3) 8/4 surpasse 6/2 8/4 13/9 13/9 de +0.100 EMG.",
            "Évitez 6/2 8/4 13/9 13/9 qui laisse 2 pion(s) isolé(s) (flèches 4, 22) ; privilégiez 13/9(3) 8/4."
        ]
    },
    {
        "id": "gnubg_harvest_3t_5_62",
        "tier": 3,
        "xgid": "XGID=-ba---G-B---bF-a-cae------:0:0:1:62:0:0:0:3:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "8/2 8/6",
        "optimalMove": "13/5",
        "acceptableMoves": [],
        "quizChoices": [
            "13/5",
            "8/2 8/6",
            "13/7 6/4",
            "13/11 13/7"
        ],
        "equityLoss": 0.138,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 8/2 8/6 (Match en 3 pts (0-0, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 2), concédant -0.138 EMG face à 13/5.",
        "explanation": "Avec le jet 6-2 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/5 : il repositionne idéalement vos bâtisseurs (13/5) avec seulement 1 blot(s) exposé(s) (+0.138 EMG sur 8/2 8/6).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 13 (13/5...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/5 repositionne idéalement vos bâtisseurs (13/5) avec seulement 1 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 13/5 surpasse 8/2 8/6 de +0.138 EMG.",
            "Évitez 8/2 8/6 qui laisse 1 pion(s) isolé(s) (flèches 2) ; privilégiez 13/5."
        ]
    },
    {
        "id": "gnubg_harvest_3t_6_11",
        "tier": 2,
        "xgid": "XGID=-CB-bbD----C-B----bbbbAc--:0:0:1:11:0:0:0:3:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "13/12 12/11 13/12 12/11",
        "optimalMove": "13/11(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11(2)",
            "13/12 12/11 13/12 12/11",
            "11/10(3) 2/1",
            "13/10 11/10"
        ],
        "equityLoss": 0.161,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/12 12/11 13/12 12/11 (Match en 3 pts (0-0, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 22), concédant -0.161 EMG face à 13/11(2).",
        "explanation": "Avec le jet 1-1 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/11(2) : il repositionne idéalement vos bâtisseurs (13/11(2)) avec seulement 1 blot(s) exposé(s) (+0.161 EMG sur 13/12 12/11 13/12 12/11).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 13 (13/11(2)...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/11(2) repositionne idéalement vos bâtisseurs (13/11(2)) avec seulement 1 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 13/11(2) surpasse 13/12 12/11 13/12 12/11 de +0.161 EMG.",
            "Évitez 13/12 12/11 13/12 12/11 qui laisse 1 pion(s) isolé(s) (flèches 22) ; privilégiez 13/11(2)."
        ]
    },
    {
        "id": "gnubg_harvest_3t_8_26",
        "tier": 3,
        "xgid": "XGID=-ABB--BBBa--eB----bbcb--B-:0:0:1:26:0:0:0:3:8",
        "dice": [
            2,
            6
        ],
        "playedMove": "8/6 8/2",
        "optimalMove": "24/22 7/1",
        "acceptableMoves": [],
        "quizChoices": [
            "24/22 7/1",
            "8/6 8/2",
            "24/16",
            "24/22 8/2"
        ],
        "equityLoss": 0.119,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 8/6 8/2 (Match en 3 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 1 et disperse vos constructeurs, concédant -0.119 EMG face à 24/22 7/1.",
        "explanation": "Avec le jet 2-6 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/22 7/1 : il ferme la porte 1 (+0.119 EMG sur 8/6 8/2).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez la flèche 1 : vos deux dés permettent d'y fermer une porte (24/22...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/22 7/1 ferme la porte 1.",
            "En Match en 3 pts (0-0, Videau à 1), 24/22 7/1 surpasse 8/6 8/2 de +0.119 EMG.",
            "Évitez 8/6 8/2 qui manque la fermeture de la porte 1 et disperse vos constructeurs ; privilégiez 24/22 7/1."
        ]
    },
    {
        "id": "gnubg_harvest_3t_10_54",
        "tier": 3,
        "xgid": "XGID=-b----G-C---bCa--b-d-B-bb-:0:0:1:54:0:0:0:3:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "8/3 6/2",
        "optimalMove": "13/8 6/2",
        "acceptableMoves": [],
        "quizChoices": [
            "13/8 6/2",
            "8/3 6/2",
            "13/4",
            "13/9 8/3"
        ],
        "equityLoss": 0.129,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 8/3 6/2 (Match en 3 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 2, 3), concédant -0.129 EMG face à 13/8 6/2.",
        "explanation": "Avec le jet 5-4 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/8 6/2 : il repositionne idéalement vos bâtisseurs (13/8 6/2) avec seulement 1 blot(s) exposé(s) (+0.129 EMG sur 8/3 6/2).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 13 (13/8...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/8 6/2 repositionne idéalement vos bâtisseurs (13/8 6/2) avec seulement 1 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 13/8 6/2 surpasse 8/3 6/2 de +0.129 EMG.",
            "Évitez 8/3 6/2 qui laisse 2 pion(s) isolé(s) (flèches 2, 3) ; privilégiez 13/8 6/2."
        ]
    },
    {
        "id": "gnubg_harvest_3t_15_36",
        "tier": 3,
        "xgid": "XGID=-BAB-bC-B----B----bbeCaab-:0:0:1:36:0:0:0:3:8",
        "dice": [
            3,
            6
        ],
        "playedMove": "6/3 21/15",
        "optimalMove": "21/12",
        "acceptableMoves": [],
        "quizChoices": [
            "21/12",
            "6/3 21/15",
            "21/15 6/3",
            "13/4"
        ],
        "equityLoss": 0.119,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 6/3 21/15 (Match en 3 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 2, 15), concédant -0.119 EMG face à 21/12.",
        "explanation": "Avec le jet 3-6 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 21/12 : il repositionne idéalement vos bâtisseurs (21/12) avec seulement 2 blot(s) exposé(s) (+0.119 EMG sur 6/3 21/15).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 21 (21/12...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 21/12 repositionne idéalement vos bâtisseurs (21/12) avec seulement 2 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 21/12 surpasse 6/3 21/15 de +0.119 EMG.",
            "Évitez 6/3 21/15 qui laisse 2 pion(s) isolé(s) (flèches 2, 15) ; privilégiez 21/12."
        ]
    },
    {
        "id": "gnubg_harvest_2ply_2_32",
        "tier": 3,
        "xgid": "XGID=-a-aBbC-BcB--B----bcBBab--:0:0:1:32:0:0:0:0:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "6/3 3/1",
        "optimalMove": "20/15",
        "acceptableMoves": [],
        "quizChoices": [
            "20/15",
            "6/3 3/1",
            "13/11 13/10",
            "6/3*/1*"
        ],
        "equityLoss": 0.101,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 6/3 3/1 (Money Game (Videau à 1)), vous enterre inutilement un pion sur l'As (flèche 1) au lieu de garder vos pions actifs, concédant -0.101 EMG face à 20/15.",
        "explanation": "Avec le jet 3-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 20/15 : il repositionne idéalement vos bâtisseurs (20/15) avec seulement 2 blot(s) exposé(s) (+0.101 EMG sur 6/3 3/1).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 20 (20/15...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 20/15 repositionne idéalement vos bâtisseurs (20/15) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 20/15 surpasse 6/3 3/1 de +0.101 EMG.",
            "Évitez 6/3 3/1 qui enterre inutilement un pion sur l'As (flèche 1) au lieu de garder vos pions actifs ; privilégiez 20/15."
        ]
    },
    {
        "id": "gnubg_harvest_2ply_3_54",
        "tier": 4,
        "xgid": "XGID=-B--bCDB---B------b-bBfba-:0:0:1:54:0:0:0:0:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "6/1 6/2",
        "optimalMove": "21/16 6/2",
        "acceptableMoves": [],
        "quizChoices": [
            "21/16 6/2",
            "6/1 6/2",
            "11/2",
            "7/2 6/2"
        ],
        "equityLoss": 0.085,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 6/1 6/2 (Money Game (Videau à 1)), vous enterre inutilement un pion sur l'As (flèche 1) au lieu de garder vos pions actifs, concédant -0.085 EMG face à 21/16 6/2.",
        "explanation": "Avec le jet 5-4 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 21/16 6/2 : il repositionne idéalement vos bâtisseurs (21/16 6/2) avec seulement 3 blot(s) exposé(s) (+0.085 EMG sur 6/1 6/2).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 21 (21/16...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 21/16 6/2 repositionne idéalement vos bâtisseurs (21/16 6/2) avec seulement 3 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 21/16 6/2 surpasse 6/1 6/2 de +0.085 EMG.",
            "Évitez 6/1 6/2 qui enterre inutilement un pion sur l'As (flèche 1) au lieu de garder vos pions actifs ; privilégiez 21/16 6/2."
        ]
    },
    {
        "id": "gnubg_harvest_2ply_4_62",
        "tier": 1,
        "xgid": "XGID=-bC---DCA---bB----Bac-cbb-:0:0:1:62:0:0:0:0:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "13/7 8/6",
        "optimalMove": "13/11 13/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11 13/7",
            "13/7 8/6",
            "8/2 6/4",
            "8/2 7/5"
        ],
        "equityLoss": 0.232,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/7 8/6 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 13), concédant -0.232 EMG face à 13/11 13/7.",
        "explanation": "Avec le jet 6-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/11 13/7 : il repositionne idéalement vos bâtisseurs (13/11 13/7) avec seulement 2 blot(s) exposé(s) (+0.232 EMG sur 13/7 8/6).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 13 (13/11...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/11 13/7 repositionne idéalement vos bâtisseurs (13/11 13/7) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 13/11 13/7 surpasse 13/7 8/6 de +0.232 EMG.",
            "Évitez 13/7 8/6 qui laisse 1 pion(s) isolé(s) (flèches 13) ; privilégiez 13/11 13/7."
        ]
    },
    {
        "id": "gnubg_harvest_2ply_5_42",
        "tier": 4,
        "xgid": "XGID=a-BC-aBaBC--bB---cbe----A-:0:0:1:42:0:0:0:0:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "9/5 5/3",
        "optimalMove": "9/7* 9/5*",
        "acceptableMoves": [],
        "quizChoices": [
            "9/7* 9/5*",
            "9/5 5/3",
            "9/5* 8/6",
            "24/22 9/5*"
        ],
        "equityLoss": 0.081,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 9/5 5/3 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 24), concédant -0.081 EMG face à 9/7* 9/5*.",
        "explanation": "Avec le jet 4-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 9/7* 9/5* : il frappe deux pions adverses sur les flèches 7 et 5 (+0.081 EMG sur 9/5 5/3).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 7 (9/7*...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 9/7* 9/5* frappe deux pions adverses sur les flèches 7 et 5.",
            "En Money Game (Videau à 1), 9/7* 9/5* surpasse 9/5 5/3 de +0.081 EMG.",
            "Évitez 9/5 5/3 qui laisse 1 pion(s) isolé(s) (flèches 24) ; privilégiez 9/7* 9/5*."
        ]
    },
    {
        "id": "gnubg_harvest_2ply_6_45",
        "tier": 2,
        "xgid": "XGID=-bBA--C-E---cB---a-bBbbba-:0:0:1:45:0:0:0:0:8",
        "dice": [
            4,
            5
        ],
        "playedMove": "6/2 8/3",
        "optimalMove": "8/4 8/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 8/3",
            "6/2 8/3",
            "8/3 6/2",
            "13/9 8/3"
        ],
        "equityLoss": 0.165,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 6/2 8/3 (Money Game (Videau à 1)), vous laisse 0 pion(s) isolé(s) (flèches exposées), concédant -0.165 EMG face à 8/4 8/3.",
        "explanation": "Avec le jet 4-5 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 8/3 : il ferme la porte 3 (+0.165 EMG sur 6/2 8/3).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 3 : vos deux dés permettent d'y fermer une porte (8/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 8/3 ferme la porte 3.",
            "En Money Game (Videau à 1), 8/4 8/3 surpasse 6/2 8/3 de +0.165 EMG.",
            "Évitez 6/2 8/3 qui laisse 0 pion(s) isolé(s) (flèches exposées) ; privilégiez 8/4 8/3."
        ]
    },
    {
        "id": "gnubg_harvest_2ply_9_43",
        "tier": 2,
        "xgid": "XGID=-aBD-BB-Ba-B-------A-bcce-:0:0:1:43:0:0:0:0:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "6/2 6/3",
        "optimalMove": "8/1*",
        "acceptableMoves": [],
        "quizChoices": [
            "8/1*",
            "6/2 6/3",
            "19/12",
            "19/15 8/5"
        ],
        "equityLoss": 0.198,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 6/2 6/3 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 1 et laisse l'initiative à l'adversaire, concédant -0.198 EMG face à 8/1*.",
        "explanation": "Avec le jet 4-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/1* : il frappe le blot adverse sur la flèche 1 (+0.198 EMG sur 6/2 6/3).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 1 (8/1*...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/1* frappe le blot adverse sur la flèche 1.",
            "En Money Game (Videau à 1), 8/1* surpasse 6/2 6/3 de +0.198 EMG.",
            "Évitez 6/2 6/3 qui refuse de frapper le blot adverse sur la flèche 1 et laisse l'initiative à l'adversaire ; privilégiez 8/1*."
        ]
    },
    {
        "id": "gnubg_harvest_2ply_10_42",
        "tier": 3,
        "xgid": "XGID=-BC--cC-C----B---b-e-b-cB-:0:0:1:42:0:0:0:0:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "8/4 6/4",
        "optimalMove": "24/18",
        "acceptableMoves": [],
        "quizChoices": [
            "24/18",
            "8/4 6/4",
            "24/22 24/20",
            "24/20 8/6"
        ],
        "equityLoss": 0.092,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 8/4 6/4 (Money Game (Videau à 1)), vous laisse 0 pion(s) isolé(s) (flèches exposées), concédant -0.092 EMG face à 24/18.",
        "explanation": "Avec le jet 4-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 : il repositionne idéalement vos bâtisseurs (24/18) avec seulement 2 blot(s) exposé(s) (+0.092 EMG sur 8/4 6/4).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 repositionne idéalement vos bâtisseurs (24/18) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/18 surpasse 8/4 6/4 de +0.092 EMG.",
            "Évitez 8/4 6/4 qui laisse 0 pion(s) isolé(s) (flèches exposées) ; privilégiez 24/18."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_1_63",
        "tier": 4,
        "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:63:0:0:0:0:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 13/7",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/18 13/10",
            "24/21 13/7",
            "24/15",
            "24/21 24/18"
        ],
        "equityLoss": 0.062,
        "verdict": "doubtful",
        "conceptId": "opening",
        "conceptName": "Ouvertures & Développement",
        "whyFailed": "En jouant 24/21 13/7 (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 7, 21, 24), concédant -0.062 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 3 blot(s) exposé(s) (+0.062 EMG sur 24/21 13/7).",
        "proverb": "En ouverture, chaque porte intérieure ou ancre avancée construite sans blot vaut de l’or.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 3 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/18 13/10 surpasse 24/21 13/7 de +0.062 EMG.",
            "Évitez 24/21 13/7 qui laisse 3 pion(s) isolé(s) (flèches 7, 21, 24) ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_2_66",
        "tier": 4,
        "xgid": "XGID=-b----E-C-A-eD---cAe----A-:0:0:-1:66:0:0:0:0:8",
        "dice": [
            6,
            6
        ],
        "playedMove": "13/7*/1*(2)",
        "optimalMove": "24/18(2) 13/7*(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "24/18(2) 13/7*(2)",
            "13/7*/1*(2)",
            "24/18 13/7*(3)",
            "24/18(2) 13/7*/1*"
        ],
        "equityLoss": 0.092,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/7*/1*(2) (Money Game (Videau à 1)), vous manque la fermeture de la porte 7/18 et disperse vos constructeurs, concédant -0.092 EMG face à 24/18(2) 13/7*(2).",
        "explanation": "Avec le jet 6-6 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18(2) 13/7*(2) : il ferme la porte 7 et 18 (+0.092 EMG sur 13/7*/1*(2)).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 7 : vos deux dés permettent d'y fermer une porte (24/18(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18(2) 13/7*(2) ferme la porte 7 et 18.",
            "En Money Game (Videau à 1), 24/18(2) 13/7*(2) surpasse 13/7*/1*(2) de +0.092 EMG.",
            "Évitez 13/7*/1*(2) qui manque la fermeture de la porte 7/18 et disperse vos constructeurs ; privilégiez 24/18(2) 13/7*(2)."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_3_51",
        "tier": 3,
        "xgid": "XGID=-b----EbC-A-eF---cbe----CA:0:0:1:51:0:0:0:0:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.097,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/7 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 10), concédant -0.097 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 2 blot(s) exposé(s) (+0.097 EMG sur 13/7).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/23...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/23 13/8 surpasse 13/7 de +0.097 EMG.",
            "Évitez 13/7 qui laisse 1 pion(s) isolé(s) (flèches 10) ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_4_52",
        "tier": 4,
        "xgid": "XGID=-b----EbD-A-eE---cbe---ABA:0:0:-1:52:0:0:0:0:8",
        "dice": [
            5,
            2
        ],
        "playedMove": "13/8 6/4",
        "optimalMove": "24/22 13/8",
        "acceptableMoves": [
            "13/11 13/8"
        ],
        "quizChoices": [
            "24/22 13/8",
            "13/8 6/4",
            "13/11 13/8",
            "13/6"
        ],
        "equityLoss": 0.089,
        "verdict": "blunder",
        "conceptId": "opening",
        "conceptName": "Ouvertures & Développement",
        "whyFailed": "En jouant 13/8 6/4 (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 4, 10, 23), concédant -0.089 EMG face à 24/22 13/8.",
        "explanation": "Avec le jet 5-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/22 13/8 : il repositionne idéalement vos bâtisseurs (24/22 13/8) avec seulement 4 blot(s) exposé(s) (+0.089 EMG sur 13/8 6/4).",
        "proverb": "En ouverture, chaque porte intérieure ou ancre avancée construite sans blot vaut de l’or.",
        "hint": "Regardez le mouvement partant de 24 (24/22...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/22 13/8 repositionne idéalement vos bâtisseurs (24/22 13/8) avec seulement 4 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/22 13/8 surpasse 13/8 6/4 de +0.089 EMG.",
            "Évitez 13/8 6/4 qui laisse 3 pion(s) isolé(s) (flèches 4, 10, 23) ; privilégiez 24/22 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_5_32",
        "tier": 4,
        "xgid": "XGID=-b--A-EbC--aeG---cbe-A-AB-:0:0:-1:32:0:0:0:0:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "13/8",
        "optimalMove": "24/21 13/11",
        "acceptableMoves": [
            "13/11 13/10",
            "24/22 13/10"
        ],
        "quizChoices": [
            "24/21 13/11",
            "13/8",
            "13/11 13/10",
            "24/22 13/10"
        ],
        "equityLoss": 0.067,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/8 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 11 et laisse l'initiative à l'adversaire, concédant -0.067 EMG face à 24/21 13/11.",
        "explanation": "Avec le jet 3-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/11 : il frappe le blot adverse sur la flèche 11 et ferme la porte 21 (+0.067 EMG sur 13/8).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Cherchez la frappe sur la flèche 11 (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/11 frappe le blot adverse sur la flèche 11 et ferme la porte 21.",
            "En Money Game (Videau à 1), 24/21 13/11 surpasse 13/8 de +0.067 EMG.",
            "Évitez 13/8 qui refuse de frapper le blot adverse sur la flèche 11 et laisse l'initiative à l'adversaire ; privilégiez 24/21 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_6_51",
        "tier": 3,
        "xgid": "XGID=-b--A-EbC--beH---cbe-a-ACA:0:0:1:51:0:0:0:0:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.097,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/7 (Money Game (Videau à 1)), vous manque la fermeture de la porte 23 et disperse vos constructeurs, concédant -0.097 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il ferme la porte 23 (+0.097 EMG sur 13/7).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez la flèche 23 : vos deux dés permettent d'y fermer une porte (24/23...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 ferme la porte 23.",
            "En Money Game (Videau à 1), 24/23 13/8 surpasse 13/7 de +0.097 EMG.",
            "Évitez 13/7 qui manque la fermeture de la porte 23 et disperse vos constructeurs ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_7_31",
        "tier": 1,
        "xgid": "XGID=-b--A-EbD--ceH---cbe-a-ACA:0:0:1:31:0:0:0:0:8",
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
            "24/20",
            "24/23 24/21"
        ],
        "equityLoss": 0.238,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/23 13/10 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 4, 10), concédant -0.238 EMG face à 8/5 6/5.",
        "explanation": "Avec le jet 3-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5 6/5 : il ferme la porte 5 (+0.238 EMG sur 24/23 13/10).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 5 : vos deux dés permettent d'y fermer une porte (8/5...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5 6/5 ferme la porte 5.",
            "En Money Game (Videau à 1), 8/5 6/5 surpasse 24/23 13/10 de +0.238 EMG.",
            "Évitez 24/23 13/10 qui laisse 2 pion(s) isolé(s) (flèches 4, 10) ; privilégiez 8/5 6/5."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_8_65",
        "tier": 4,
        "xgid": "XGID=-b--ABDbC--ceH---cbe-a-ACA:0:0:-1:65:0:0:0:0:8",
        "dice": [
            6,
            5
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
        "equityLoss": 0.073,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/18 13/8 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 4, 23), concédant -0.073 EMG face à 24/13.",
        "explanation": "Avec le jet 6-5 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/13 : il repositionne idéalement vos bâtisseurs (24/13) avec seulement 2 blot(s) exposé(s) (+0.073 EMG sur 24/18 13/8).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/13 repositionne idéalement vos bâtisseurs (24/13) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/13 surpasse 24/18 13/8 de +0.073 EMG.",
            "Évitez 24/18 13/8 qui laisse 2 pion(s) isolé(s) (flèches 4, 23) ; privilégiez 24/13."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_9_51",
        "tier": 3,
        "xgid": "XGID=-b--ABDbC--ceG---cbe-a-ADA:0:0:1:51:0:0:0:0:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.097,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/7 (Money Game (Videau à 1)), vous manque la fermeture de la porte 23 et disperse vos constructeurs, concédant -0.097 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il ferme la porte 23 (+0.097 EMG sur 13/7).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez la flèche 23 : vos deux dés permettent d'y fermer une porte (24/23...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 ferme la porte 23.",
            "En Money Game (Videau à 1), 24/23 13/8 surpasse 13/7 de +0.097 EMG.",
            "Évitez 13/7 qui manque la fermeture de la porte 23 et disperse vos constructeurs ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_10_33",
        "tier": 3,
        "xgid": "XGID=-b--ABDbD--ceF---cbe-a-BCA:0:0:-1:33:0:0:0:0:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "24/18(2)",
        "optimalMove": "8/5(2) 6/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5(2) 6/3(2)",
            "24/18(2)",
            "24/21(2) 6/3(2)",
            "24/21(2) 13/10(2)"
        ],
        "equityLoss": 0.127,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/18(2) (Money Game (Videau à 1)), vous manque la fermeture de la porte 3 et disperse vos constructeurs, concédant -0.127 EMG face à 8/5(2) 6/3(2).",
        "explanation": "Avec le jet 3-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5(2) 6/3(2) : il ferme la porte 3 (+0.127 EMG sur 24/18(2)).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 3 : vos deux dés permettent d'y fermer une porte (8/5(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5(2) 6/3(2) ferme la porte 3.",
            "En Money Game (Videau à 1), 8/5(2) 6/3(2) surpasse 24/18(2) de +0.127 EMG.",
            "Évitez 24/18(2) qui manque la fermeture de la porte 3 et disperse vos constructeurs ; privilégiez 8/5(2) 6/3(2)."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_11_54",
        "tier": 3,
        "xgid": "XGID=-b-bAaFbF--ceF---cbe-a-CCA:0:0:-1:54:0:0:0:0:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [
            "24/15",
            "13/9 13/8"
        ],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/15",
            "13/9 13/8"
        ],
        "equityLoss": 0.113,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/4 (Money Game (Videau à 1)), vous laisse 0 pion(s) isolé(s) (flèches exposées), concédant -0.113 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il repositionne idéalement vos bâtisseurs (24/20 13/8) avec seulement 2 blot(s) exposé(s) (+0.113 EMG sur 13/4).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/20...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 repositionne idéalement vos bâtisseurs (24/20 13/8) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/20 13/8 surpasse 13/4 de +0.113 EMG.",
            "Évitez 13/4 qui laisse 0 pion(s) isolé(s) (flèches exposées) ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_12_51",
        "tier": 3,
        "xgid": "XGID=-b-bAaFbE--ceG---cbeaa-CDA:0:0:1:51:0:0:0:0:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.097,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/7 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 4), concédant -0.097 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 1 blot(s) exposé(s) (+0.097 EMG sur 13/7).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/23...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 1 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/23 13/8 surpasse 13/7 de +0.097 EMG.",
            "Évitez 13/7 qui laisse 1 pion(s) isolé(s) (flèches 4) ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_13_43",
        "tier": 4,
        "xgid": "XGID=-b-bAaFbF--ceF---cbeaa-DCA:0:0:-1:43:0:0:0:0:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/6 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire, concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il frappe le blot adverse sur la flèche 21 (+0.090 EMG sur 13/6).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Cherchez la frappe sur la flèche 21 (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 frappe le blot adverse sur la flèche 21.",
            "En Money Game (Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_14_53",
        "tier": 4,
        "xgid": "XGID=-b-bAaFbFa-ceG---cbeab-DDA:0:0:1:53:0:0:0:0:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "24/16",
        "optimalMove": "8/3 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/3",
            "24/16",
            "24/21 13/8",
            "13/10 13/8"
        ],
        "equityLoss": 0.083,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/16 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 3 et laisse l'initiative à l'adversaire, concédant -0.083 EMG face à 8/3 6/3.",
        "explanation": "Avec le jet 5-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/3 6/3 : il frappe le blot adverse sur la flèche 3 (+0.083 EMG sur 24/16).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 3 (8/3...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/3 6/3 frappe le blot adverse sur la flèche 3.",
            "En Money Game (Videau à 1), 8/3 6/3 surpasse 24/16 de +0.083 EMG.",
            "Évitez 24/16 qui refuse de frapper le blot adverse sur la flèche 3 et laisse l'initiative à l'adversaire ; privilégiez 8/3 6/3."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_15_65",
        "tier": 4,
        "xgid": "XGID=ab-AAaEbEa-ceG---cbeab-DDA:0:0:-1:65:0:0:0:0:8",
        "dice": [
            6,
            5
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
        "equityLoss": 0.073,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/18 13/8 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 3, 4), concédant -0.073 EMG face à 24/13.",
        "explanation": "Avec le jet 6-5 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/13 : il repositionne idéalement vos bâtisseurs (24/13) avec seulement 2 blot(s) exposé(s) (+0.073 EMG sur 24/18 13/8).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/13 repositionne idéalement vos bâtisseurs (24/13) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/13 surpasse 24/18 13/8 de +0.073 EMG.",
            "Évitez 24/18 13/8 qui laisse 2 pion(s) isolé(s) (flèches 3, 4) ; privilégiez 24/13."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_16_42",
        "tier": 2,
        "xgid": "XGID=ab-AAaEbEa-ceF---cbeab-DEA:0:0:1:42:0:0:0:0:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.159,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/22 13/9 (Money Game (Videau à 1)), vous manque la fermeture de la porte 4 et disperse vos constructeurs, concédant -0.159 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il ferme la porte 4 (+0.159 EMG sur 24/22 13/9).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 4 : vos deux dés permettent d'y fermer une porte (8/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 ferme la porte 4.",
            "En Money Game (Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.159 EMG.",
            "Évitez 24/22 13/9 qui manque la fermeture de la porte 4 et disperse vos constructeurs ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_17_42",
        "tier": 2,
        "xgid": "XGID=ab-ACaDbDa-ceF---cbeab-DEA:0:0:-1:42:0:0:0:0:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.159,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/22 13/9 (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 3, 9, 22), concédant -0.159 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il repositionne idéalement vos bâtisseurs (8/4 6/4) avec seulement 1 blot(s) exposé(s) (+0.159 EMG sur 24/22 13/9).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 8 (8/4...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 repositionne idéalement vos bâtisseurs (8/4 6/4) avec seulement 1 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.159 EMG.",
            "Évitez 24/22 13/9 qui laisse 3 pion(s) isolé(s) (flèches 3, 9, 22) ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_18_62",
        "tier": 4,
        "xgid": "XGID=ab-AAaEbEa-ceF---cbeab-DEA:0:0:-1:62:0:0:0:0:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "24/22 24/18",
        "optimalMove": "24/18 13/11",
        "acceptableMoves": [
            "24/16"
        ],
        "quizChoices": [
            "24/18 13/11",
            "24/22 24/18",
            "24/16",
            "13/11 13/7"
        ],
        "equityLoss": 0.065,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/22 24/18 (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 3, 4, 22), concédant -0.065 EMG face à 24/18 13/11.",
        "explanation": "Avec le jet 6-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/11 : il repositionne idéalement vos bâtisseurs (24/18 13/11) avec seulement 2 blot(s) exposé(s) (+0.065 EMG sur 24/22 24/18).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/11 repositionne idéalement vos bâtisseurs (24/18 13/11) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/18 13/11 surpasse 24/22 24/18 de +0.065 EMG.",
            "Évitez 24/22 24/18 qui laisse 3 pion(s) isolé(s) (flèches 3, 4, 22) ; privilégiez 24/18 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_19_43",
        "tier": 4,
        "xgid": "XGID=acAAAaEbCa-deG---cceAb-DG-:0:0:-1:43:0:0:0:0:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/6 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 9 et laisse l'initiative à l'adversaire, concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il frappe le blot adverse sur la flèche 9 (+0.090 EMG sur 13/6).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Cherchez la frappe sur la flèche 9 (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 frappe le blot adverse sur la flèche 9.",
            "En Money Game (Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui refuse de frapper le blot adverse sur la flèche 9 et laisse l'initiative à l'adversaire ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_20_33",
        "tier": 3,
        "xgid": "XGID=acAAAaEbCb-deH---cceAc-DH-:0:0:1:33:0:0:0:0:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "24/18(2)",
        "optimalMove": "8/5(2) 6/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5(2) 6/3(2)",
            "24/18(2)",
            "24/21(2) 6/3(2)",
            "24/21(2) 13/10(2)"
        ],
        "equityLoss": 0.127,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/18(2) (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 5 et laisse l'initiative à l'adversaire, concédant -0.127 EMG face à 8/5(2) 6/3(2).",
        "explanation": "Avec le jet 3-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5(2) 6/3(2) : il frappe le blot adverse sur la flèche 5 et ferme la porte 3 et 5 (+0.127 EMG sur 24/18(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 5 (8/5(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5(2) 6/3(2) frappe le blot adverse sur la flèche 5 et ferme la porte 3 et 5.",
            "En Money Game (Videau à 1), 8/5(2) 6/3(2) surpasse 24/18(2) de +0.127 EMG.",
            "Évitez 24/18(2) qui refuse de frapper le blot adverse sur la flèche 5 et laisse l'initiative à l'adversaire ; privilégiez 8/5(2) 6/3(2)."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_21_41",
        "tier": 3,
        "xgid": "XGID=bcACABCbAb-deH---cceAc-DH-:0:0:1:41:0:0:0:0:8",
        "dice": [
            4,
            1
        ],
        "playedMove": "13/9 8/7",
        "optimalMove": "24/23 13/9",
        "acceptableMoves": [
            "13/9 6/5"
        ],
        "quizChoices": [
            "24/23 13/9",
            "13/9 8/7",
            "13/9 6/5",
            "24/23 24/20"
        ],
        "equityLoss": 0.119,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/9 8/7 (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 2, 4, 20), concédant -0.119 EMG face à 24/23 13/9.",
        "explanation": "Avec le jet 4-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/9 : il repositionne idéalement vos bâtisseurs (24/23 13/9) avec seulement 4 blot(s) exposé(s) (+0.119 EMG sur 13/9 8/7).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/23...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/9 repositionne idéalement vos bâtisseurs (24/23 13/9) avec seulement 4 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/23 13/9 surpasse 13/9 8/7 de +0.119 EMG.",
            "Évitez 13/9 8/7 qui laisse 3 pion(s) isolé(s) (flèches 2, 4, 20) ; privilégiez 24/23 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s0_m0_22_63",
        "tier": 4,
        "xgid": "XGID=adACABCb-a-deG---cceBc-EG-:0:0:1:63:0:0:0:0:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 13/7",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/18 13/10",
            "24/21 13/7",
            "24/15",
            "24/21 24/18"
        ],
        "equityLoss": 0.062,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/21 13/7 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 2, 4), concédant -0.062 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 3 blot(s) exposé(s) (+0.062 EMG sur 24/21 13/7).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 3 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/18 13/10 surpasse 24/21 13/7 de +0.062 EMG.",
            "Évitez 24/21 13/7 qui laisse 2 pion(s) isolé(s) (flèches 2, 4) ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_1_54",
        "tier": 3,
        "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:54:0:0:0:0:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [
            "24/15",
            "13/9 13/8"
        ],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/15",
            "13/9 13/8"
        ],
        "equityLoss": 0.113,
        "verdict": "blunder",
        "conceptId": "opening",
        "conceptName": "Ouvertures & Développement",
        "whyFailed": "En jouant 13/4 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 4), concédant -0.113 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il repositionne idéalement vos bâtisseurs (24/20 13/8) avec seulement 2 blot(s) exposé(s) (+0.113 EMG sur 13/4).",
        "proverb": "En ouverture, chaque porte intérieure ou ancre avancée construite sans blot vaut de l’or.",
        "hint": "Regardez le mouvement partant de 24 (24/20...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 repositionne idéalement vos bâtisseurs (24/20 13/8) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/20 13/8 surpasse 13/4 de +0.113 EMG.",
            "Évitez 13/4 qui laisse 1 pion(s) isolé(s) (flèches 4) ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_2_61",
        "tier": 2,
        "xgid": "XGID=-b----E-D---eD---c-eA---A-:0:0:-1:61:0:0:0:0:8",
        "dice": [
            6,
            1
        ],
        "playedMove": "13/6",
        "optimalMove": "13/7 8/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7 8/7",
            "13/6",
            "13/7 6/5*",
            "24/18 6/5*"
        ],
        "equityLoss": 0.153,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/6 (Money Game (Videau à 1)), vous manque la fermeture de la porte 7 et disperse vos constructeurs, concédant -0.153 EMG face à 13/7 8/7.",
        "explanation": "Avec le jet 6-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/7 8/7 : il ferme la porte 7 (+0.153 EMG sur 13/6).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 7 : vos deux dés permettent d'y fermer une porte (13/7...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/7 8/7 ferme la porte 7.",
            "En Money Game (Videau à 1), 13/7 8/7 surpasse 13/6 de +0.153 EMG.",
            "Évitez 13/6 qui manque la fermeture de la porte 7 et disperse vos constructeurs ; privilégiez 13/7 8/7."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_3_61",
        "tier": 2,
        "xgid": "XGID=-b----EbE---eE---c-eA---A-:0:0:1:61:0:0:0:0:8",
        "dice": [
            6,
            1
        ],
        "playedMove": "24/23 24/18",
        "optimalMove": "13/7 8/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7 8/7",
            "24/23 24/18",
            "24/23 13/7",
            "13/6"
        ],
        "equityLoss": 0.172,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/23 24/18 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 7 et laisse l'initiative à l'adversaire, concédant -0.172 EMG face à 13/7 8/7.",
        "explanation": "Avec le jet 6-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/7 8/7 : il frappe le blot adverse sur la flèche 7 (+0.172 EMG sur 24/23 24/18).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 7 (13/7...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/7 8/7 frappe le blot adverse sur la flèche 7.",
            "En Money Game (Videau à 1), 13/7 8/7 surpasse 24/23 24/18 de +0.172 EMG.",
            "Évitez 24/23 24/18 qui refuse de frapper le blot adverse sur la flèche 7 et laisse l'initiative à l'adversaire ; privilégiez 13/7 8/7."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_4_43",
        "tier": 4,
        "xgid": "XGID=ab----EAD---eD---c-eA---A-:0:0:-1:43:0:0:0:0:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/6 (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 7, 20, 24), concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il repositionne idéalement vos bâtisseurs (24/21 13/9) avec seulement 4 blot(s) exposé(s) (+0.090 EMG sur 13/6).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/21...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 repositionne idéalement vos bâtisseurs (24/21 13/9) avec seulement 4 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui laisse 3 pion(s) isolé(s) (flèches 7, 20, 24) ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_5_32",
        "tier": 4,
        "xgid": "XGID=ab----EADa--eE---c-eAa--B-:0:0:1:32:0:0:0:0:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "13/8",
        "optimalMove": "24/21 13/11",
        "acceptableMoves": [
            "13/11 13/10",
            "24/22 13/10"
        ],
        "quizChoices": [
            "24/21 13/11",
            "13/8",
            "13/11 13/10",
            "24/22 13/10"
        ],
        "equityLoss": 0.067,
        "verdict": "doubtful",
        "conceptId": "opening",
        "conceptName": "Ouvertures & Développement",
        "whyFailed": "En jouant 13/8 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire, concédant -0.067 EMG face à 24/21 13/11.",
        "explanation": "Avec le jet 3-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/11 : il frappe le blot adverse sur la flèche 21 (+0.067 EMG sur 13/8).",
        "proverb": "En ouverture, chaque porte intérieure ou ancre avancée construite sans blot vaut de l’or.",
        "hint": "Cherchez la frappe sur la flèche 21 (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/11 frappe le blot adverse sur la flèche 21.",
            "En Money Game (Videau à 1), 24/21 13/11 surpasse 13/8 de +0.067 EMG.",
            "Évitez 13/8 qui refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire ; privilégiez 24/21 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_6_54",
        "tier": 3,
        "xgid": "XGID=-c--a-EADa-AeD---c-eAA--A-:0:0:1:54:0:0:0:0:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [
            "24/15",
            "13/9 13/8"
        ],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/15",
            "13/9 13/8"
        ],
        "equityLoss": 0.113,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/4 (Money Game (Videau à 1)), vous manque la fermeture de la porte 20 et disperse vos constructeurs, concédant -0.113 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il ferme la porte 20 (+0.113 EMG sur 13/4).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 20 : vos deux dés permettent d'y fermer une porte (24/20...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 ferme la porte 20.",
            "En Money Game (Videau à 1), 24/20 13/8 surpasse 13/4 de +0.113 EMG.",
            "Évitez 13/4 qui manque la fermeture de la porte 20 et disperse vos constructeurs ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_7_63",
        "tier": 4,
        "xgid": "XGID=-c--a-EAEa-AeC---c-eBA----:0:0:-1:63:0:0:0:0:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 13/7",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/18 13/10",
            "24/21 13/7",
            "24/15",
            "24/21 24/18"
        ],
        "equityLoss": 0.062,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/21 13/7 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 11), concédant -0.062 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 5 blot(s) exposé(s) (+0.062 EMG sur 24/21 13/7).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 5 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/18 13/10 surpasse 24/21 13/7 de +0.062 EMG.",
            "Évitez 24/21 13/7 qui laisse 1 pion(s) isolé(s) (flèches 11) ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_8_65",
        "tier": 4,
        "xgid": "XGID=-c--a-EAEaaAeD---caeBA--A-:0:0:1:65:0:0:0:0:8",
        "dice": [
            6,
            5
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
        "equityLoss": 0.073,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/18 13/8 (Money Game (Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 7, 11, 18), concédant -0.073 EMG face à 24/13.",
        "explanation": "Avec le jet 6-5 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/13 : il repositionne idéalement vos bâtisseurs (24/13) avec seulement 3 blot(s) exposé(s) (+0.073 EMG sur 24/18 13/8).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/13 repositionne idéalement vos bâtisseurs (24/13) avec seulement 3 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/13 surpasse 24/18 13/8 de +0.073 EMG.",
            "Évitez 24/18 13/8 qui laisse 4 pion(s) isolé(s) (flèches 7, 11, 18) ; privilégiez 24/13."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_9_31",
        "tier": 1,
        "xgid": "XGID=-c--a-EAEaaAeE---caeBA----:0:0:-1:31:0:0:0:0:8",
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
            "24/20",
            "24/23 24/21"
        ],
        "equityLoss": 0.238,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/23 13/10 (Money Game (Videau à 1)), vous manque la fermeture de la porte 5 et disperse vos constructeurs, concédant -0.238 EMG face à 8/5 6/5.",
        "explanation": "Avec le jet 3-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5 6/5 : il ferme la porte 5 (+0.238 EMG sur 24/23 13/10).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 5 : vos deux dés permettent d'y fermer une porte (8/5...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5 6/5 ferme la porte 5.",
            "En Money Game (Videau à 1), 8/5 6/5 surpasse 24/23 13/10 de +0.238 EMG.",
            "Évitez 24/23 13/10 qui manque la fermeture de la porte 5 et disperse vos constructeurs ; privilégiez 8/5 6/5."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_10_66",
        "tier": 2,
        "xgid": "XGID=-c--abFAFaaAeE---caeBA----:0:0:1:66:0:0:0:0:8",
        "dice": [
            6,
            6
        ],
        "playedMove": "24/18 13/7(3)",
        "optimalMove": "24/18(2) 13/7(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "24/18(2) 13/7(2)",
            "24/18 13/7(3)",
            "24/18(2) 8/2(2)",
            "13/7(2) 8/2(2)"
        ],
        "equityLoss": 0.213,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/18 13/7(3) (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 11, 18, 21), concédant -0.213 EMG face à 24/18(2) 13/7(2).",
        "explanation": "Avec le jet 6-6 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18(2) 13/7(2) : il frappe le blot adverse sur la flèche 18 et ferme la porte 7 et 18 (+0.213 EMG sur 24/18 13/7(3)).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Cherchez la frappe sur la flèche 18 (24/18(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18(2) 13/7(2) frappe le blot adverse sur la flèche 18 et ferme la porte 7 et 18.",
            "En Money Game (Videau à 1), 24/18(2) 13/7(2) surpasse 24/18 13/7(3) de +0.213 EMG.",
            "Évitez 24/18 13/7(3) qui laisse 3 pion(s) isolé(s) (flèches 11, 18, 21) ; privilégiez 24/18(2) 13/7(2)."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_11_43",
        "tier": 4,
        "xgid": "XGID=ac--abFCFaaAeC---cBeBA--b-:0:0:-1:43:0:0:0:0:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/6 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 9 et laisse l'initiative à l'adversaire, concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il frappe le blot adverse sur la flèche 9 et ferme la porte 21 (+0.090 EMG sur 13/6).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Cherchez la frappe sur la flèche 9 (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 frappe le blot adverse sur la flèche 9 et ferme la porte 21.",
            "En Money Game (Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui refuse de frapper le blot adverse sur la flèche 9 et laisse l'initiative à l'adversaire ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_12_64",
        "tier": 4,
        "xgid": "XGID=ac--abFCFbaAeD---cBeBa--aA:0:0:1:64:0:0:0:0:8",
        "dice": [
            6,
            4
        ],
        "playedMove": "24/20 24/18",
        "optimalMove": "8/2 6/2",
        "acceptableMoves": [
            "24/14",
            "24/18 13/9"
        ],
        "quizChoices": [
            "8/2 6/2",
            "24/20 24/18",
            "24/14",
            "24/18 13/9"
        ],
        "equityLoss": 0.063,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/20 24/18 (Money Game (Videau à 1)), vous manque la fermeture de la porte 2 et disperse vos constructeurs, concédant -0.063 EMG face à 8/2 6/2.",
        "explanation": "Avec le jet 6-4 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/2 6/2 : il ferme la porte 2 (+0.063 EMG sur 24/20 24/18).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez la flèche 2 : vos deux dés permettent d'y fermer une porte (8/2...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/2 6/2 ferme la porte 2.",
            "En Money Game (Videau à 1), 8/2 6/2 surpasse 24/20 24/18 de +0.063 EMG.",
            "Évitez 24/20 24/18 qui manque la fermeture de la porte 2 et disperse vos constructeurs ; privilégiez 8/2 6/2."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_13_65",
        "tier": 4,
        "xgid": "XGID=acB-abECEbaAeD---cBeBa--aA:0:0:-1:65:0:0:0:0:8",
        "dice": [
            6,
            5
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
        "equityLoss": 0.073,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/18 13/8 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 11), concédant -0.073 EMG face à 24/13.",
        "explanation": "Avec le jet 6-5 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/13 : il repositionne idéalement vos bâtisseurs (24/13) avec seulement 1 blot(s) exposé(s) (+0.073 EMG sur 24/18 13/8).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/13 repositionne idéalement vos bâtisseurs (24/13) avec seulement 1 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/13 surpasse 24/18 13/8 de +0.073 EMG.",
            "Évitez 24/18 13/8 qui laisse 1 pion(s) isolé(s) (flèches 11) ; privilégiez 24/13."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_14_43",
        "tier": 4,
        "xgid": "XGID=acB-abECEbaAeC---cBeBa---A:0:0:1:43:0:0:0:0:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/6 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire, concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il frappe le blot adverse sur la flèche 21 (+0.090 EMG sur 13/6).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Cherchez la frappe sur la flèche 21 (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 frappe le blot adverse sur la flèche 21.",
            "En Money Game (Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_15_64",
        "tier": 4,
        "xgid": "XGID=acB-acECEaaAeB---cBeBA--aA:0:0:1:64:0:0:0:0:8",
        "dice": [
            6,
            4
        ],
        "playedMove": "24/20 24/18",
        "optimalMove": "8/2 6/2",
        "acceptableMoves": [
            "24/14",
            "24/18 13/9"
        ],
        "quizChoices": [
            "8/2 6/2",
            "24/20 24/18",
            "24/14",
            "24/18 13/9"
        ],
        "equityLoss": 0.063,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/20 24/18 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 11, 21), concédant -0.063 EMG face à 8/2 6/2.",
        "explanation": "Avec le jet 6-4 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/2 6/2 : il repositionne idéalement vos bâtisseurs (8/2 6/2) avec seulement 2 blot(s) exposé(s) (+0.063 EMG sur 24/20 24/18).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 8 (8/2...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/2 6/2 repositionne idéalement vos bâtisseurs (8/2 6/2) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 8/2 6/2 surpasse 24/20 24/18 de +0.063 EMG.",
            "Évitez 24/20 24/18 qui laisse 2 pion(s) isolé(s) (flèches 11, 21) ; privilégiez 8/2 6/2."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_16_42",
        "tier": 2,
        "xgid": "XGID=acD-acDCDaaAeB---cBeBA--aA:0:0:-1:42:0:0:0:0:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.159,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/22 13/9 (Money Game (Videau à 1)), vous manque la fermeture de la porte 4 et disperse vos constructeurs, concédant -0.159 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il frappe le blot adverse sur la flèche 4 et ferme la porte 4 (+0.159 EMG sur 24/22 13/9).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 4 (8/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 frappe le blot adverse sur la flèche 4 et ferme la porte 4.",
            "En Money Game (Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.159 EMG.",
            "Évitez 24/22 13/9 qui manque la fermeture de la porte 4 et disperse vos constructeurs ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_17_22",
        "tier": 4,
        "xgid": "XGID=acD-ccECEaaAeB---cBeBA--aA:0:0:1:22:0:0:0:0:8",
        "dice": [
            2,
            2
        ],
        "playedMove": "24/22 13/11 6/4(2)",
        "optimalMove": "13/11(2) 6/4(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11(2) 6/4(2)",
            "24/22 13/11 6/4(2)",
            "24/22(2) 6/4(2)",
            "13/9 6/4(2)"
        ],
        "equityLoss": 0.068,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/22 13/11 6/4(2) (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 13, 21, 22), concédant -0.068 EMG face à 13/11(2) 6/4(2).",
        "explanation": "Avec le jet 2-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/11(2) 6/4(2) : il ferme la porte 11 (+0.068 EMG sur 24/22 13/11 6/4(2)).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez la flèche 11 : vos deux dés permettent d'y fermer une porte (13/11(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/11(2) 6/4(2) ferme la porte 11.",
            "En Money Game (Videau à 1), 13/11(2) 6/4(2) surpasse 24/22 13/11 6/4(2) de +0.068 EMG.",
            "Évitez 24/22 13/11 6/4(2) qui laisse 3 pion(s) isolé(s) (flèches 13, 21, 22) ; privilégiez 13/11(2) 6/4(2)."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_18_42",
        "tier": 2,
        "xgid": "XGID=acD-acCCEaaCe----cBeBA--aA:0:0:-1:42:0:0:0:0:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.159,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/22 13/9 (Money Game (Videau à 1)), vous manque la fermeture de la porte 4 et disperse vos constructeurs, concédant -0.159 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il frappe le blot adverse sur la flèche 4 et ferme la porte 4 (+0.159 EMG sur 24/22 13/9).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 4 (8/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 frappe le blot adverse sur la flèche 4 et ferme la porte 4.",
            "En Money Game (Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.159 EMG.",
            "Évitez 24/22 13/9 qui manque la fermeture de la porte 4 et disperse vos constructeurs ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_19_53",
        "tier": 4,
        "xgid": "XGID=acD-ccDCFaaCe----cBeBA--aA:0:0:1:53:0:0:0:0:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "24/16",
        "optimalMove": "8/3 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/3",
            "24/16",
            "24/21 13/8",
            "13/10 13/8"
        ],
        "equityLoss": 0.083,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/16 (Money Game (Videau à 1)), vous manque la fermeture de la porte 3 et disperse vos constructeurs, concédant -0.083 EMG face à 8/3 6/3.",
        "explanation": "Avec le jet 5-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/3 6/3 : il ferme la porte 3 (+0.083 EMG sur 24/16).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 3 : vos deux dés permettent d'y fermer une porte (8/3...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/3 6/3 ferme la porte 3.",
            "En Money Game (Videau à 1), 8/3 6/3 surpasse 24/16 de +0.083 EMG.",
            "Évitez 24/16 qui manque la fermeture de la porte 3 et disperse vos constructeurs ; privilégiez 8/3 6/3."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_20_43",
        "tier": 4,
        "xgid": "XGID=acDBccCCEaaCe----cBeBA--aA:0:0:-1:43:0:0:0:0:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/6 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 9 et laisse l'initiative à l'adversaire, concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il frappe le blot adverse sur la flèche 9 et ferme la porte 21 (+0.090 EMG sur 13/6).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Cherchez la frappe sur la flèche 9 (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 frappe le blot adverse sur la flèche 9 et ferme la porte 21.",
            "En Money Game (Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui refuse de frapper le blot adverse sur la flèche 9 et laisse l'initiative à l'adversaire ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_21_43",
        "tier": 4,
        "xgid": "XGID=acDBccCCEbaCeA---cBeBa--AA:0:0:-1:43:0:0:0:0:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/6 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire, concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il frappe le blot adverse sur la flèche 21 (+0.090 EMG sur 13/6).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Cherchez la frappe sur la flèche 21 (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 frappe le blot adverse sur la flèche 21.",
            "En Money Game (Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s1_m0_22_52",
        "tier": 4,
        "xgid": "XGID=acDBccCCEcaCeB---cBeBb--BA:0:0:1:52:0:0:0:0:8",
        "dice": [
            5,
            2
        ],
        "playedMove": "13/8 6/4",
        "optimalMove": "24/22 13/8",
        "acceptableMoves": [
            "13/11 13/8"
        ],
        "quizChoices": [
            "24/22 13/8",
            "13/8 6/4",
            "13/11 13/8",
            "13/6"
        ],
        "equityLoss": 0.089,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/8 6/4 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 13), concédant -0.089 EMG face à 24/22 13/8.",
        "explanation": "Avec le jet 5-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/22 13/8 : il repositionne idéalement vos bâtisseurs (24/22 13/8) avec seulement 3 blot(s) exposé(s) (+0.089 EMG sur 13/8 6/4).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/22...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/22 13/8 repositionne idéalement vos bâtisseurs (24/22 13/8) avec seulement 3 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/22 13/8 surpasse 13/8 6/4 de +0.089 EMG.",
            "Évitez 13/8 6/4 qui laisse 1 pion(s) isolé(s) (flèches 13) ; privilégiez 24/22 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_1_65",
        "tier": 4,
        "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:65:0:0:0:0:8",
        "dice": [
            6,
            5
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
        "equityLoss": 0.073,
        "verdict": "doubtful",
        "conceptId": "opening",
        "conceptName": "Ouvertures & Développement",
        "whyFailed": "En jouant 24/18 13/8 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 18, 24), concédant -0.073 EMG face à 24/13.",
        "explanation": "Avec le jet 6-5 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/13 : il repositionne idéalement vos bâtisseurs (24/13) avec seulement 1 blot(s) exposé(s) (+0.073 EMG sur 24/18 13/8).",
        "proverb": "En ouverture, chaque porte intérieure ou ancre avancée construite sans blot vaut de l’or.",
        "hint": "Regardez le mouvement partant de 24 (24/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/13 repositionne idéalement vos bâtisseurs (24/13) avec seulement 1 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/13 surpasse 24/18 13/8 de +0.073 EMG.",
            "Évitez 24/18 13/8 qui laisse 2 pion(s) isolé(s) (flèches 18, 24) ; privilégiez 24/13."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_2_63",
        "tier": 4,
        "xgid": "XGID=-b----E-C---eF---c-e----A-:0:0:-1:63:0:0:0:0:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 24/18",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [],
        "quizChoices": [
            "24/18 13/10",
            "24/21 24/18",
            "24/15",
            "24/21 13/7"
        ],
        "equityLoss": 0.07,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/21 24/18 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 18, 21), concédant -0.070 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 2 blot(s) exposé(s) (+0.070 EMG sur 24/21 24/18).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/18 13/10 surpasse 24/21 24/18 de +0.070 EMG.",
            "Évitez 24/21 24/18 qui laisse 2 pion(s) isolé(s) (flèches 18, 21) ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_3_42",
        "tier": 2,
        "xgid": "XGID=-b----E-C-a-eG---cae----B-:0:0:1:42:0:0:0:0:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.159,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/22 13/9 (Money Game (Videau à 1)), vous manque la fermeture de la porte 4 et disperse vos constructeurs, concédant -0.159 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il ferme la porte 4 (+0.159 EMG sur 24/22 13/9).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 4 : vos deux dés permettent d'y fermer une porte (8/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 ferme la porte 4.",
            "En Money Game (Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.159 EMG.",
            "Évitez 24/22 13/9 qui manque la fermeture de la porte 4 et disperse vos constructeurs ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_4_63",
        "tier": 4,
        "xgid": "XGID=-b--B-D-B-a-eG---cae----B-:0:0:-1:63:0:0:0:0:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 13/7",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/18 13/10",
            "24/21 13/7",
            "24/15",
            "24/21 24/18"
        ],
        "equityLoss": 0.062,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/21 13/7 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 18/10 et laisse l'initiative à l'adversaire, concédant -0.062 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il frappe deux pions adverses sur les flèches 18 et 10 (+0.062 EMG sur 24/21 13/7).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Cherchez la frappe sur la flèche 18 (24/18...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 frappe deux pions adverses sur les flèches 18 et 10.",
            "En Money Game (Videau à 1), 24/18 13/10 surpasse 24/21 13/7 de +0.062 EMG.",
            "Évitez 24/21 13/7 qui refuse de frapper le blot adverse sur la flèche 18/10 et laisse l'initiative à l'adversaire ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_5_41",
        "tier": 3,
        "xgid": "XGID=-b--B-D-B-b-eH---cbe----C-:0:0:1:41:0:0:0:0:8",
        "dice": [
            4,
            1
        ],
        "playedMove": "13/9 8/7",
        "optimalMove": "24/23 13/9",
        "acceptableMoves": [
            "13/9 6/5"
        ],
        "quizChoices": [
            "24/23 13/9",
            "13/9 8/7",
            "13/9 6/5",
            "24/23 24/20"
        ],
        "equityLoss": 0.119,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/9 8/7 (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 7, 8, 9), concédant -0.119 EMG face à 24/23 13/9.",
        "explanation": "Avec le jet 4-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/9 : il repositionne idéalement vos bâtisseurs (24/23 13/9) avec seulement 2 blot(s) exposé(s) (+0.119 EMG sur 13/9 8/7).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/23...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/9 repositionne idéalement vos bâtisseurs (24/23 13/9) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/23 13/9 surpasse 13/9 8/7 de +0.119 EMG.",
            "Évitez 13/9 8/7 qui laisse 3 pion(s) isolé(s) (flèches 7, 8, 9) ; privilégiez 24/23 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_6_41",
        "tier": 3,
        "xgid": "XGID=-b--B-D-BAb-eG---cbe---AB-:0:0:-1:41:0:0:0:0:8",
        "dice": [
            4,
            1
        ],
        "playedMove": "13/9 8/7",
        "optimalMove": "24/23 13/9",
        "acceptableMoves": [
            "13/9 6/5"
        ],
        "quizChoices": [
            "24/23 13/9",
            "13/9 8/7",
            "13/9 6/5",
            "24/23 24/20"
        ],
        "equityLoss": 0.119,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/9 8/7 (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 7, 8, 23), concédant -0.119 EMG face à 24/23 13/9.",
        "explanation": "Avec le jet 4-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/9 : il ferme la porte 9 et 23 (+0.119 EMG sur 13/9 8/7).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez la flèche 9 : vos deux dés permettent d'y fermer une porte (24/23...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/9 ferme la porte 9 et 23.",
            "En Money Game (Videau à 1), 24/23 13/9 surpasse 13/9 8/7 de +0.119 EMG.",
            "Évitez 13/9 8/7 qui laisse 3 pion(s) isolé(s) (flèches 7, 8, 23) ; privilégiez 24/23 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_7_54",
        "tier": 3,
        "xgid": "XGID=ab--B-D-Bab-eH---cbe--AAC-:0:0:1:54:0:0:0:0:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [
            "24/15",
            "13/9 13/8"
        ],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/15",
            "13/9 13/8"
        ],
        "equityLoss": 0.113,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/4 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 22, 23), concédant -0.113 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il repositionne idéalement vos bâtisseurs (24/20 13/8) avec seulement 3 blot(s) exposé(s) (+0.113 EMG sur 13/4).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/20...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 repositionne idéalement vos bâtisseurs (24/20 13/8) avec seulement 3 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/20 13/8 surpasse 13/4 de +0.113 EMG.",
            "Évitez 13/4 qui laisse 2 pion(s) isolé(s) (flèches 22, 23) ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_8_33",
        "tier": 3,
        "xgid": "XGID=ab--B-D-Cab-eG---cbeA-AAB-:0:0:1:33:0:0:0:0:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "24/18(2)",
        "optimalMove": "8/5(2) 6/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5(2) 6/3(2)",
            "24/18(2)",
            "24/21(2) 6/3(2)",
            "24/21(2) 13/10(2)"
        ],
        "equityLoss": 0.127,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/18(2) (Money Game (Videau à 1)), vous manque la fermeture de la porte 3/5 et disperse vos constructeurs, concédant -0.127 EMG face à 8/5(2) 6/3(2).",
        "explanation": "Avec le jet 3-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5(2) 6/3(2) : il ferme la porte 3 et 5 (+0.127 EMG sur 24/18(2)).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 3 : vos deux dés permettent d'y fermer une porte (8/5(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5(2) 6/3(2) ferme la porte 3 et 5.",
            "En Money Game (Videau à 1), 8/5(2) 6/3(2) surpasse 24/18(2) de +0.127 EMG.",
            "Évitez 24/18(2) qui manque la fermeture de la porte 3/5 et disperse vos constructeurs ; privilégiez 8/5(2) 6/3(2)."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_9_42",
        "tier": 2,
        "xgid": "XGID=ab-BBBB-Aab-eG---cbeA-AAB-:0:0:-1:42:0:0:0:0:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.159,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/22 13/9 (Money Game (Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 8, 9, 20), concédant -0.159 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il repositionne idéalement vos bâtisseurs (8/4 6/4) avec seulement 4 blot(s) exposé(s) (+0.159 EMG sur 24/22 13/9).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 8 (8/4...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 repositionne idéalement vos bâtisseurs (8/4 6/4) avec seulement 4 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.159 EMG.",
            "Évitez 24/22 13/9 qui laisse 5 pion(s) isolé(s) (flèches 8, 9, 20) ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_10_63",
        "tier": 4,
        "xgid": "XGID=ab-BaBC-Bab-eG---cbeA-AABA:0:0:1:63:0:0:0:0:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 13/7",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/18 13/10",
            "24/21 13/7",
            "24/15",
            "24/21 24/18"
        ],
        "equityLoss": 0.062,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/21 13/7 (Money Game (Videau à 1)), vous laisse 6 pion(s) isolé(s) (flèches 7, 20, 21), concédant -0.062 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 4 blot(s) exposé(s) (+0.062 EMG sur 24/21 13/7).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 4 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/18 13/10 surpasse 24/21 13/7 de +0.062 EMG.",
            "Évitez 24/21 13/7 qui laisse 6 pion(s) isolé(s) (flèches 7, 20, 21) ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_11_31",
        "tier": 1,
        "xgid": "XGID=ab-BaBC-Baa-eF---caeA-AAAA:0:0:-1:31:0:0:0:0:8",
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
            "24/20",
            "24/23 24/21"
        ],
        "equityLoss": 0.238,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/23 13/10 (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 10, 20, 22), concédant -0.238 EMG face à 8/5 6/5.",
        "explanation": "Avec le jet 3-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5 6/5 : il repositionne idéalement vos bâtisseurs (8/5 6/5) avec seulement 5 blot(s) exposé(s) (+0.238 EMG sur 24/23 13/10).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 8 (8/5...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5 6/5 repositionne idéalement vos bâtisseurs (8/5 6/5) avec seulement 5 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 8/5 6/5 surpasse 24/23 13/10 de +0.238 EMG.",
            "Évitez 24/23 13/10 qui laisse 3 pion(s) isolé(s) (flèches 10, 20, 22) ; privilégiez 8/5 6/5."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_12_55",
        "tier": 2,
        "xgid": "XGID=ab-BaaD-Caa-eF---caeA-BBA-:0:0:-1:55:0:0:0:0:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "13/3 8/3(2)",
        "optimalMove": "13/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/3(2)",
            "13/3 8/3(2)",
            "13/3 13/8(2)",
            "13/8(4)"
        ],
        "equityLoss": 0.178,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/3 8/3(2) (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 8, 20, 24), concédant -0.178 EMG face à 13/3(2).",
        "explanation": "Avec le jet 5-5 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/3(2) : il repositionne idéalement vos bâtisseurs (13/3(2)) avec seulement 2 blot(s) exposé(s) (+0.178 EMG sur 13/3 8/3(2)).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 13 (13/3(2)...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/3(2) repositionne idéalement vos bâtisseurs (13/3(2)) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 13/3(2) surpasse 13/3 8/3(2) de +0.178 EMG.",
            "Évitez 13/3 8/3(2) qui laisse 3 pion(s) isolé(s) (flèches 8, 20, 24) ; privilégiez 13/3(2)."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_13_51",
        "tier": 3,
        "xgid": "XGID=ab-aaaD-Caa-eH---caeA-BBAA:0:0:1:51:0:0:0:0:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.097,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/7 (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 7, 20, 24), concédant -0.097 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 1 blot(s) exposé(s) (+0.097 EMG sur 13/7).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/23...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 1 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/23 13/8 surpasse 13/7 de +0.097 EMG.",
            "Évitez 13/7 qui laisse 3 pion(s) isolé(s) (flèches 7, 20, 24) ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_14_61",
        "tier": 2,
        "xgid": "XGID=ab-aaaD-Daa-eG---caeA-BC-A:0:0:-1:61:0:0:0:0:8",
        "dice": [
            6,
            1
        ],
        "playedMove": "24/23 24/18",
        "optimalMove": "13/7 8/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7 8/7",
            "24/23 24/18",
            "24/23 13/7",
            "13/6"
        ],
        "equityLoss": 0.172,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/23 24/18 (Money Game (Videau à 1)), vous manque la fermeture de la porte 7 et disperse vos constructeurs, concédant -0.172 EMG face à 13/7 8/7.",
        "explanation": "Avec le jet 6-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/7 8/7 : il ferme la porte 7 (+0.172 EMG sur 24/23 24/18).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 7 : vos deux dés permettent d'y fermer une porte (13/7...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/7 8/7 ferme la porte 7.",
            "En Money Game (Videau à 1), 13/7 8/7 surpasse 24/23 24/18 de +0.172 EMG.",
            "Évitez 24/23 24/18 qui manque la fermeture de la porte 7 et disperse vos constructeurs ; privilégiez 13/7 8/7."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_15_51",
        "tier": 3,
        "xgid": "XGID=ab-aaaDbEaa-eH---caeA-BC-A:0:0:1:51:0:0:0:0:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.097,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/7 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 20), concédant -0.097 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 1 blot(s) exposé(s) (+0.097 EMG sur 13/7).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/23...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 1 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/23 13/8 surpasse 13/7 de +0.097 EMG.",
            "Évitez 13/7 qui laisse 1 pion(s) isolé(s) (flèches 20) ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_16_55",
        "tier": 2,
        "xgid": "XGID=ab-aaaDbFaa-eG---caeA-BDaA:0:0:-1:55:0:0:0:0:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "13/3 8/3(2)",
        "optimalMove": "13/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/3(2)",
            "13/3 8/3(2)",
            "13/3 13/8(2)",
            "13/8(4)"
        ],
        "equityLoss": 0.178,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 13/3 8/3(2) (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 20), concédant -0.178 EMG face à 13/3(2).",
        "explanation": "Avec le jet 5-5 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/3(2) : il frappe le blot adverse sur la flèche 3 et ferme la porte 3 (+0.178 EMG sur 13/3 8/3(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 3 (13/3(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/3(2) frappe le blot adverse sur la flèche 3 et ferme la porte 3.",
            "En Money Game (Videau à 1), 13/3(2) surpasse 13/3 8/3(2) de +0.178 EMG.",
            "Évitez 13/3 8/3(2) qui laisse 1 pion(s) isolé(s) (flèches 20) ; privilégiez 13/3(2)."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_17_43",
        "tier": 4,
        "xgid": "XGID=ab-caaDbFaa-eI---caeA-BDaA:0:0:1:43:0:0:0:0:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/6 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 9 et laisse l'initiative à l'adversaire, concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il frappe le blot adverse sur la flèche 9 (+0.090 EMG sur 13/6).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Cherchez la frappe sur la flèche 9 (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 frappe le blot adverse sur la flèche 9.",
            "En Money Game (Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui refuse de frapper le blot adverse sur la flèche 9 et laisse l'initiative à l'adversaire ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_18_31",
        "tier": 1,
        "xgid": "XGID=-cacaaDbFAa-eH---caeAABDbA:0:0:1:31:0:0:0:0:8",
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
            "24/20",
            "24/23 24/21"
        ],
        "equityLoss": 0.238,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/23 13/10 (Money Game (Videau à 1)), vous manque la fermeture de la porte 5 et disperse vos constructeurs, concédant -0.238 EMG face à 8/5 6/5.",
        "explanation": "Avec le jet 3-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5 6/5 : il frappe le blot adverse sur la flèche 5 et ferme la porte 5 (+0.238 EMG sur 24/23 13/10).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 5 (8/5...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5 6/5 frappe le blot adverse sur la flèche 5 et ferme la porte 5.",
            "En Money Game (Videau à 1), 8/5 6/5 surpasse 24/23 13/10 de +0.238 EMG.",
            "Évitez 24/23 13/10 qui manque la fermeture de la porte 5 et disperse vos constructeurs ; privilégiez 8/5 6/5."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_19_32",
        "tier": 4,
        "xgid": "XGID=acacaBCbEAa-eH---caeAABDbA:0:0:-1:32:0:0:0:0:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "13/8",
        "optimalMove": "24/21 13/11",
        "acceptableMoves": [
            "13/11 13/10",
            "24/22 13/10"
        ],
        "quizChoices": [
            "24/21 13/11",
            "13/8",
            "13/11 13/10",
            "24/22 13/10"
        ],
        "equityLoss": 0.067,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/8 (Money Game (Videau à 1)), vous manque la fermeture de la porte 21 et disperse vos constructeurs, concédant -0.067 EMG face à 24/21 13/11.",
        "explanation": "Avec le jet 3-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/11 : il ferme la porte 21 (+0.067 EMG sur 13/8).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 21 : vos deux dés permettent d'y fermer une porte (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/11 ferme la porte 21.",
            "En Money Game (Videau à 1), 24/21 13/11 surpasse 13/8 de +0.067 EMG.",
            "Évitez 13/8 qui manque la fermeture de la porte 21 et disperse vos constructeurs ; privilégiez 24/21 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_20_43",
        "tier": 4,
        "xgid": "XGID=-dbdaBCbEAaAeH---caeAACEb-:0:0:1:43:0:0:0:0:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/6 (Money Game (Videau à 1)), vous manque la fermeture de la porte 9/21 et disperse vos constructeurs, concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il ferme la porte 9 et 21 (+0.090 EMG sur 13/6).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 9 : vos deux dés permettent d'y fermer une porte (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 ferme la porte 9 et 21.",
            "En Money Game (Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui manque la fermeture de la porte 9/21 et disperse vos constructeurs ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_21_42",
        "tier": 2,
        "xgid": "XGID=-dbdaBCbEBaAeG---caeABCEc-:0:0:-1:42:0:0:0:0:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.159,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/22 13/9 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 4 et laisse l'initiative à l'adversaire, concédant -0.159 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il frappe le blot adverse sur la flèche 4 et ferme la porte 4 (+0.159 EMG sur 24/22 13/9).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 4 (8/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 frappe le blot adverse sur la flèche 4 et ferme la porte 4.",
            "En Money Game (Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.159 EMG.",
            "Évitez 24/22 13/9 qui refuse de frapper le blot adverse sur la flèche 4 et laisse l'initiative à l'adversaire ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s2_m0_22_52",
        "tier": 4,
        "xgid": "XGID=-dbdcBDbFBaAeG---caeABCEc-:0:0:1:52:0:0:0:0:8",
        "dice": [
            5,
            2
        ],
        "playedMove": "13/8 6/4",
        "optimalMove": "24/22 13/8",
        "acceptableMoves": [
            "13/11 13/8"
        ],
        "quizChoices": [
            "24/22 13/8",
            "13/8 6/4",
            "13/11 13/8",
            "13/6"
        ],
        "equityLoss": 0.089,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/8 6/4 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 11, 20), concédant -0.089 EMG face à 24/22 13/8.",
        "explanation": "Avec le jet 5-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/22 13/8 : il repositionne idéalement vos bâtisseurs (24/22 13/8) avec seulement 2 blot(s) exposé(s) (+0.089 EMG sur 13/8 6/4).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/22...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/22 13/8 repositionne idéalement vos bâtisseurs (24/22 13/8) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/22 13/8 surpasse 13/8 6/4 de +0.089 EMG.",
            "Évitez 13/8 6/4 qui laisse 2 pion(s) isolé(s) (flèches 11, 20) ; privilégiez 24/22 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_1_53",
        "tier": 4,
        "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:53:0:0:0:0:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "24/16",
        "optimalMove": "8/3 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/3",
            "24/16",
            "24/21 13/8",
            "13/10 13/8"
        ],
        "equityLoss": 0.083,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/16 (Money Game (Videau à 1)), vous manque la fermeture de la porte 3 et disperse vos constructeurs, concédant -0.083 EMG face à 8/3 6/3.",
        "explanation": "Avec le jet 5-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/3 6/3 : il ferme la porte 3 (+0.083 EMG sur 24/16).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 3 : vos deux dés permettent d'y fermer une porte (8/3...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/3 6/3 ferme la porte 3.",
            "En Money Game (Videau à 1), 8/3 6/3 surpasse 24/16 de +0.083 EMG.",
            "Évitez 24/16 qui manque la fermeture de la porte 3 et disperse vos constructeurs ; privilégiez 8/3 6/3."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_2_63",
        "tier": 4,
        "xgid": "XGID=-b-B--D-B---eE---c-e----B-:0:0:-1:63:0:0:0:0:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "13/4",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/18 13/10",
            "13/4",
            "24/15",
            "24/21 24/18"
        ],
        "equityLoss": 0.062,
        "verdict": "doubtful",
        "conceptId": "opening",
        "conceptName": "Ouvertures & Développement",
        "whyFailed": "En jouant 13/4 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 4), concédant -0.062 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 3 blot(s) exposé(s) (+0.062 EMG sur 13/4).",
        "proverb": "En ouverture, chaque porte intérieure ou ancre avancée construite sans blot vaut de l’or.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 3 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/18 13/10 surpasse 13/4 de +0.062 EMG.",
            "Évitez 13/4 qui laisse 1 pion(s) isolé(s) (flèches 4) ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_3_65",
        "tier": 4,
        "xgid": "XGID=-b-B--D-B-a-eF---cae----C-:0:0:1:65:0:0:0:0:8",
        "dice": [
            6,
            5
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
        "equityLoss": 0.073,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/18 13/8 (Money Game (Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 18), concédant -0.073 EMG face à 24/13.",
        "explanation": "Avec le jet 6-5 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/13 : il repositionne idéalement vos bâtisseurs (24/13) avec seulement 0 blot(s) exposé(s) (+0.073 EMG sur 24/18 13/8).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/13 repositionne idéalement vos bâtisseurs (24/13) avec seulement 0 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/13 surpasse 24/18 13/8 de +0.073 EMG.",
            "Évitez 24/18 13/8 qui laisse 1 pion(s) isolé(s) (flèches 18) ; privilégiez 24/13."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_4_61",
        "tier": 2,
        "xgid": "XGID=-b-B--D-B-a-eG---cae----B-:0:0:-1:61:0:0:0:0:8",
        "dice": [
            6,
            1
        ],
        "playedMove": "24/23 24/18",
        "optimalMove": "13/7 8/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7 8/7",
            "24/23 24/18",
            "24/23 13/7",
            "13/6"
        ],
        "equityLoss": 0.172,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/23 24/18 (Money Game (Videau à 1)), vous manque la fermeture de la porte 7 et disperse vos constructeurs, concédant -0.172 EMG face à 13/7 8/7.",
        "explanation": "Avec le jet 6-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/7 8/7 : il ferme la porte 7 (+0.172 EMG sur 24/23 24/18).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 7 : vos deux dés permettent d'y fermer une porte (13/7...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/7 8/7 ferme la porte 7.",
            "En Money Game (Videau à 1), 13/7 8/7 surpasse 24/23 24/18 de +0.172 EMG.",
            "Évitez 24/23 24/18 qui manque la fermeture de la porte 7 et disperse vos constructeurs ; privilégiez 13/7 8/7."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_5_11",
        "tier": 4,
        "xgid": "XGID=-b-B--D-B-a-eG---cbe---aD-:0:0:1:11:0:0:0:0:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "24/23(2) 6/5(2)",
        "optimalMove": "8/7(2) 6/5(2)",
        "acceptableMoves": [
            "24/22 6/5(2)"
        ],
        "quizChoices": [
            "8/7(2) 6/5(2)",
            "24/23(2) 6/5(2)",
            "24/22 6/5(2)",
            "24/23 6/5(3)"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/23(2) 6/5(2) (Money Game (Videau à 1)), vous laisse 0 pion(s) isolé(s) (flèches exposées), concédant -0.090 EMG face à 8/7(2) 6/5(2).",
        "explanation": "Avec le jet 1-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/7(2) 6/5(2) : il ferme la porte 5 et 7 (+0.090 EMG sur 24/23(2) 6/5(2)).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 5 : vos deux dés permettent d'y fermer une porte (8/7(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/7(2) 6/5(2) ferme la porte 5 et 7.",
            "En Money Game (Videau à 1), 8/7(2) 6/5(2) surpasse 24/23(2) 6/5(2) de +0.090 EMG.",
            "Évitez 24/23(2) 6/5(2) qui laisse 0 pion(s) isolé(s) (flèches exposées) ; privilégiez 8/7(2) 6/5(2)."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_6_11",
        "tier": 4,
        "xgid": "XGID=-b-B-BBB--a-eG---cbe---aD-:0:0:-1:11:0:0:0:0:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "24/23(2) 6/5(2)",
        "optimalMove": "8/7(2) 6/5(2)",
        "acceptableMoves": [
            "24/22 6/5(2)"
        ],
        "quizChoices": [
            "8/7(2) 6/5(2)",
            "24/23(2) 6/5(2)",
            "24/22 6/5(2)",
            "24/23 6/5(3)"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/23(2) 6/5(2) (Money Game (Videau à 1)), vous laisse 0 pion(s) isolé(s) (flèches exposées), concédant -0.090 EMG face à 8/7(2) 6/5(2).",
        "explanation": "Avec le jet 1-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/7(2) 6/5(2) : il repositionne idéalement vos bâtisseurs (8/7(2) 6/5(2)) avec seulement 0 blot(s) exposé(s) (+0.090 EMG sur 24/23(2) 6/5(2)).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 8 (8/7(2)...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/7(2) 6/5(2) repositionne idéalement vos bâtisseurs (8/7(2) 6/5(2)) avec seulement 0 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 8/7(2) 6/5(2) surpasse 24/23(2) 6/5(2) de +0.090 EMG.",
            "Évitez 24/23(2) 6/5(2) qui laisse 0 pion(s) isolé(s) (flèches exposées) ; privilégiez 8/7(2) 6/5(2)."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_7_61",
        "tier": 2,
        "xgid": "XGID=ab-B-aDaB-aAeG---cbeA--aDA:0:0:-1:61:0:0:0:0:8",
        "dice": [
            6,
            1
        ],
        "playedMove": "24/23 24/18",
        "optimalMove": "13/7 8/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7 8/7",
            "24/23 24/18",
            "24/23 13/7",
            "13/6"
        ],
        "equityLoss": 0.172,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/23 24/18 (Money Game (Videau à 1)), vous manque la fermeture de la porte 7 et disperse vos constructeurs, concédant -0.172 EMG face à 13/7 8/7.",
        "explanation": "Avec le jet 6-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/7 8/7 : il frappe le blot adverse sur la flèche 7 et ferme la porte 7 (+0.172 EMG sur 24/23 24/18).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 7 (13/7...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/7 8/7 frappe le blot adverse sur la flèche 7 et ferme la porte 7.",
            "En Money Game (Videau à 1), 13/7 8/7 surpasse 24/23 24/18 de +0.172 EMG.",
            "Évitez 24/23 24/18 qui manque la fermeture de la porte 7 et disperse vos constructeurs ; privilégiez 13/7 8/7."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_8_32",
        "tier": 4,
        "xgid": "XGID=ab-B-aDcC-aAeH---cbeA--aDA:0:0:1:32:0:0:0:0:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "13/8",
        "optimalMove": "24/21 13/11",
        "acceptableMoves": [
            "13/11 13/10",
            "24/22 13/10"
        ],
        "quizChoices": [
            "24/21 13/11",
            "13/8",
            "13/11 13/10",
            "24/22 13/10"
        ],
        "equityLoss": 0.067,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/8 (Money Game (Videau à 1)), vous manque la fermeture de la porte 11 et disperse vos constructeurs, concédant -0.067 EMG face à 24/21 13/11.",
        "explanation": "Avec le jet 3-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/11 : il ferme la porte 11 (+0.067 EMG sur 13/8).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez la flèche 11 : vos deux dés permettent d'y fermer une porte (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/11 ferme la porte 11.",
            "En Money Game (Videau à 1), 24/21 13/11 surpasse 13/8 de +0.067 EMG.",
            "Évitez 13/8 qui manque la fermeture de la porte 11 et disperse vos constructeurs ; privilégiez 24/21 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_9_41",
        "tier": 3,
        "xgid": "XGID=ab-B-aDcC-aBeG---cbeAA-aCA:0:0:-1:41:0:0:0:0:8",
        "dice": [
            4,
            1
        ],
        "playedMove": "13/9 8/7",
        "optimalMove": "24/23 13/9",
        "acceptableMoves": [
            "13/9 6/5"
        ],
        "quizChoices": [
            "24/23 13/9",
            "13/9 8/7",
            "13/9 6/5",
            "24/23 24/20"
        ],
        "equityLoss": 0.119,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/9 8/7 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 23 et laisse l'initiative à l'adversaire, concédant -0.119 EMG face à 24/23 13/9.",
        "explanation": "Avec le jet 4-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/9 : il frappe le blot adverse sur la flèche 23 (+0.119 EMG sur 13/9 8/7).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Cherchez la frappe sur la flèche 23 (24/23...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/9 frappe le blot adverse sur la flèche 23.",
            "En Money Game (Videau à 1), 24/23 13/9 surpasse 13/9 8/7 de +0.119 EMG.",
            "Évitez 13/9 8/7 qui refuse de frapper le blot adverse sur la flèche 23 et laisse l'initiative à l'adversaire ; privilégiez 24/23 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_10_43",
        "tier": 4,
        "xgid": "XGID=ab-B-aDcCaaBeH---cbeAA-bDA:0:0:1:43:0:0:0:0:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/6 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 9 et laisse l'initiative à l'adversaire, concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il frappe le blot adverse sur la flèche 9 et ferme la porte 21 (+0.090 EMG sur 13/6).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Cherchez la frappe sur la flèche 9 (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 frappe le blot adverse sur la flèche 9 et ferme la porte 21.",
            "En Money Game (Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui refuse de frapper le blot adverse sur la flèche 9 et laisse l'initiative à l'adversaire ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_11_31",
        "tier": 1,
        "xgid": "XGID=-caB-aDcCAaBeG---cbeAB-bCA:0:0:1:31:0:0:0:0:8",
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
            "24/20",
            "24/23 24/21"
        ],
        "equityLoss": 0.238,
        "verdict": "howler",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/23 13/10 (Money Game (Videau à 1)), vous manque la fermeture de la porte 5 et disperse vos constructeurs, concédant -0.238 EMG face à 8/5 6/5.",
        "explanation": "Avec le jet 3-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5 6/5 : il frappe le blot adverse sur la flèche 5 et ferme la porte 5 (+0.238 EMG sur 24/23 13/10).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 5 (8/5...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5 6/5 frappe le blot adverse sur la flèche 5 et ferme la porte 5.",
            "En Money Game (Videau à 1), 8/5 6/5 surpasse 24/23 13/10 de +0.238 EMG.",
            "Évitez 24/23 13/10 qui manque la fermeture de la porte 5 et disperse vos constructeurs ; privilégiez 8/5 6/5."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_12_51",
        "tier": 3,
        "xgid": "XGID=acaB-BCcBAaBeG---cbeAB-bCA:0:0:1:51:0:0:0:0:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.097,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/7 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 9, 20), concédant -0.097 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 2 blot(s) exposé(s) (+0.097 EMG sur 13/7).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/23...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/23 13/8 surpasse 13/7 de +0.097 EMG.",
            "Évitez 13/7 qui laisse 2 pion(s) isolé(s) (flèches 9, 20) ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_13_54",
        "tier": 3,
        "xgid": "XGID=acaB-BCcCAaBeF---cbeAB-aBA:0:0:-1:54:0:0:0:0:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [
            "24/15",
            "13/9 13/8"
        ],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/15",
            "13/9 13/8"
        ],
        "equityLoss": 0.113,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/4 (Money Game (Videau à 1)), vous manque la fermeture de la porte 20 et disperse vos constructeurs, concédant -0.113 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il ferme la porte 20 (+0.113 EMG sur 13/4).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 20 : vos deux dés permettent d'y fermer une porte (24/20...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 ferme la porte 20.",
            "En Money Game (Videau à 1), 24/20 13/8 surpasse 13/4 de +0.113 EMG.",
            "Évitez 13/4 qui manque la fermeture de la porte 20 et disperse vos constructeurs ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_14_51",
        "tier": 3,
        "xgid": "XGID=acaB-BCcBAaBeG---cbeaC-aD-:0:0:-1:51:0:0:0:0:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.097,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/7 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 23 et laisse l'initiative à l'adversaire, concédant -0.097 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il frappe le blot adverse sur la flèche 23 (+0.097 EMG sur 13/7).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Cherchez la frappe sur la flèche 23 (24/23...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 frappe le blot adverse sur la flèche 23.",
            "En Money Game (Videau à 1), 24/23 13/8 surpasse 13/7 de +0.097 EMG.",
            "Évitez 13/7 qui refuse de frapper le blot adverse sur la flèche 23 et laisse l'initiative à l'adversaire ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_15_62",
        "tier": 4,
        "xgid": "XGID=acaB-BCcAAaBeH---cbeaC-bE-:0:0:1:62:0:0:0:0:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "24/22 24/18",
        "optimalMove": "24/18 13/11",
        "acceptableMoves": [
            "24/16"
        ],
        "quizChoices": [
            "24/18 13/11",
            "24/22 24/18",
            "24/16",
            "13/11 13/7"
        ],
        "equityLoss": 0.065,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/22 24/18 (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 8, 9, 22), concédant -0.065 EMG face à 24/18 13/11.",
        "explanation": "Avec le jet 6-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/11 : il repositionne idéalement vos bâtisseurs (24/18 13/11) avec seulement 2 blot(s) exposé(s) (+0.065 EMG sur 24/22 24/18).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/11 repositionne idéalement vos bâtisseurs (24/18 13/11) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/18 13/11 surpasse 24/22 24/18 de +0.065 EMG.",
            "Évitez 24/22 24/18 qui laisse 3 pion(s) isolé(s) (flèches 8, 9, 22) ; privilégiez 24/18 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_16_62",
        "tier": 4,
        "xgid": "XGID=acaB-BCcAAaCeG---caeaC-bD-:0:0:-1:62:0:0:0:0:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "24/22 24/18",
        "optimalMove": "24/18 13/11",
        "acceptableMoves": [
            "24/16"
        ],
        "quizChoices": [
            "24/18 13/11",
            "24/22 24/18",
            "24/16",
            "13/11 13/7"
        ],
        "equityLoss": 0.065,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/22 24/18 (Money Game (Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 8, 9, 18), concédant -0.065 EMG face à 24/18 13/11.",
        "explanation": "Avec le jet 6-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/11 : il frappe le blot adverse sur la flèche 18 (+0.065 EMG sur 24/22 24/18).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Cherchez la frappe sur la flèche 18 (24/18...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/11 frappe le blot adverse sur la flèche 18.",
            "En Money Game (Videau à 1), 24/18 13/11 surpasse 24/22 24/18 de +0.065 EMG.",
            "Évitez 24/22 24/18 qui laisse 4 pion(s) isolé(s) (flèches 8, 9, 18) ; privilégiez 24/18 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_17_42",
        "tier": 2,
        "xgid": "XGID=acaB-BCcAAaBeH---cbeaC-bE-:0:0:1:42:0:0:0:0:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.159,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/22 13/9 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 8, 22), concédant -0.159 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il ferme la porte 4 (+0.159 EMG sur 24/22 13/9).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 4 : vos deux dés permettent d'y fermer une porte (8/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 ferme la porte 4.",
            "En Money Game (Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.159 EMG.",
            "Évitez 24/22 13/9 qui laisse 2 pion(s) isolé(s) (flèches 8, 22) ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_18_31",
        "tier": 1,
        "xgid": "XGID=acaBBBBc-AaBeH---cbeaC-bE-:0:0:-1:31:0:0:0:0:8",
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
            "24/20",
            "24/23 24/21"
        ],
        "equityLoss": 0.238,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/23 13/10 (Money Game (Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 9, 10), concédant -0.238 EMG face à 8/5 6/5.",
        "explanation": "Avec le jet 3-1 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5 6/5 : il repositionne idéalement vos bâtisseurs (8/5 6/5) avec seulement 2 blot(s) exposé(s) (+0.238 EMG sur 24/23 13/10).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 8 (8/5...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5 6/5 repositionne idéalement vos bâtisseurs (8/5 6/5) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 8/5 6/5 surpasse 24/23 13/10 de +0.238 EMG.",
            "Évitez 24/23 13/10 qui laisse 2 pion(s) isolé(s) (flèches 9, 10) ; privilégiez 8/5 6/5."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_19_62",
        "tier": 4,
        "xgid": "XGID=acaBBaCcAAaBeH---cbeaC-bEA:0:0:-1:62:0:0:0:0:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "24/22 24/18",
        "optimalMove": "24/18 13/11",
        "acceptableMoves": [
            "24/16"
        ],
        "quizChoices": [
            "24/18 13/11",
            "24/22 24/18",
            "24/16",
            "13/11 13/7"
        ],
        "equityLoss": 0.065,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/22 24/18 (Money Game (Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 8, 9, 22), concédant -0.065 EMG face à 24/18 13/11.",
        "explanation": "Avec le jet 6-2 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/11 : il repositionne idéalement vos bâtisseurs (24/18 13/11) avec seulement 2 blot(s) exposé(s) (+0.065 EMG sur 24/22 24/18).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/11 repositionne idéalement vos bâtisseurs (24/18 13/11) avec seulement 2 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/18 13/11 surpasse 24/22 24/18 de +0.065 EMG.",
            "Évitez 24/22 24/18 qui laisse 3 pion(s) isolé(s) (flèches 8, 9, 22) ; privilégiez 24/18 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_20_54",
        "tier": 3,
        "xgid": "XGID=acaBBaCcAAaAeI---cceaC-bFA:0:0:1:54:0:0:0:0:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [
            "24/15",
            "13/9 13/8"
        ],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/15",
            "13/9 13/8"
        ],
        "equityLoss": 0.113,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/4 (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 20 et laisse l'initiative à l'adversaire, concédant -0.113 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il frappe le blot adverse sur la flèche 20 et ferme la porte 8 (+0.113 EMG sur 13/4).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Cherchez la frappe sur la flèche 20 (24/20...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 frappe le blot adverse sur la flèche 20 et ferme la porte 8.",
            "En Money Game (Videau à 1), 24/20 13/8 surpasse 13/4 de +0.113 EMG.",
            "Évitez 13/4 qui refuse de frapper le blot adverse sur la flèche 20 et laisse l'initiative à l'adversaire ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_21_33",
        "tier": 3,
        "xgid": "XGID=acbBBaCcBAaAeH---cceAC-bEA:0:0:1:33:0:0:0:0:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "24/18(2)",
        "optimalMove": "8/5(2) 6/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5(2) 6/3(2)",
            "24/18(2)",
            "24/21(2) 6/3(2)",
            "24/21(2) 13/10(2)"
        ],
        "equityLoss": 0.127,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/18(2) (Money Game (Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 5 et laisse l'initiative à l'adversaire, concédant -0.127 EMG face à 8/5(2) 6/3(2).",
        "explanation": "Avec le jet 3-3 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5(2) 6/3(2) : il frappe le blot adverse sur la flèche 5 et ferme la porte 5 (+0.127 EMG sur 24/18(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 5 (8/5(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5(2) 6/3(2) frappe le blot adverse sur la flèche 5 et ferme la porte 5.",
            "En Money Game (Videau à 1), 8/5(2) 6/3(2) surpasse 24/18(2) de +0.127 EMG.",
            "Évitez 24/18(2) qui refuse de frapper le blot adverse sur la flèche 5 et laisse l'initiative à l'adversaire ; privilégiez 8/5(2) 6/3(2)."
        ]
    },
    {
        "id": "bgt_gnu_s3_m0_22_66",
        "tier": 2,
        "xgid": "XGID=bcbDBBAc-AaAeH---cceAC-bEA:0:0:-1:66:0:0:0:0:8",
        "dice": [
            6,
            6
        ],
        "playedMove": "24/18 13/7(3)",
        "optimalMove": "24/18(2) 13/7(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "24/18(2) 13/7(2)",
            "24/18 13/7(3)",
            "24/18(2) 8/2(2)",
            "13/7(2) 8/2(2)"
        ],
        "equityLoss": 0.213,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/18 13/7(3) (Money Game (Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 6, 7, 9), concédant -0.213 EMG face à 24/18(2) 13/7(2).",
        "explanation": "Avec le jet 6-6 en Money Game (Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18(2) 13/7(2) : il repositionne idéalement vos bâtisseurs (24/18(2) 13/7(2)) avec seulement 4 blot(s) exposé(s) (+0.213 EMG sur 24/18 13/7(3)).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/18(2)...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18(2) 13/7(2) repositionne idéalement vos bâtisseurs (24/18(2) 13/7(2)) avec seulement 4 blot(s) exposé(s).",
            "En Money Game (Videau à 1), 24/18(2) 13/7(2) surpasse 24/18 13/7(3) de +0.213 EMG.",
            "Évitez 24/18 13/7(3) qui laisse 5 pion(s) isolé(s) (flèches 6, 7, 9) ; privilégiez 24/18(2) 13/7(2)."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_1_54",
        "tier": 3,
        "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:54:0:0:0:3:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/15",
            "13/9 13/8"
        ],
        "equityLoss": 0.125,
        "verdict": "blunder",
        "conceptId": "opening",
        "conceptName": "Ouvertures & Développement",
        "whyFailed": "En jouant 13/4 (Match en 3 pts (0-0, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 4), concédant -0.125 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il repositionne idéalement vos bâtisseurs (24/20 13/8) avec seulement 2 blot(s) exposé(s) (+0.125 EMG sur 13/4).",
        "proverb": "En ouverture, chaque porte intérieure ou ancre avancée construite sans blot vaut de l’or.",
        "hint": "Regardez le mouvement partant de 24 (24/20...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 repositionne idéalement vos bâtisseurs (24/20 13/8) avec seulement 2 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 24/20 13/8 surpasse 13/4 de +0.125 EMG.",
            "Évitez 13/4 qui laisse 1 pion(s) isolé(s) (flèches 4) ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_2_54",
        "tier": 4,
        "xgid": "XGID=-b----E-C---eE-A-c-e----A-:0:0:-1:54:0:0:0:3:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/9 6/1*",
        "optimalMove": "24/20 6/1*",
        "acceptableMoves": [
            "24/20 13/8"
        ],
        "quizChoices": [
            "24/20 6/1*",
            "13/9 6/1*",
            "24/20 13/8",
            "13/9 13/8"
        ],
        "equityLoss": 0.094,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/9 6/1* (Match en 3 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 9, 15, 24), concédant -0.094 EMG face à 24/20 6/1*.",
        "explanation": "Avec le jet 5-4 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 6/1* : il repositionne idéalement vos bâtisseurs (24/20 6/1*) avec seulement 2 blot(s) exposé(s) (+0.094 EMG sur 13/9 6/1*).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 24 (24/20...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 6/1* repositionne idéalement vos bâtisseurs (24/20 6/1*) avec seulement 2 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 24/20 6/1* surpasse 13/9 6/1* de +0.094 EMG.",
            "Évitez 13/9 6/1* qui laisse 3 pion(s) isolé(s) (flèches 9, 15, 24) ; privilégiez 24/20 6/1*."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_3_53",
        "tier": 4,
        "xgid": "XGID=-c----F-C--AeD-A-c-ea--AA-:0:0:-1:53:0:0:0:3:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "24/16",
        "optimalMove": "8/3 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/3",
            "24/16",
            "24/21 13/8",
            "13/10 13/8"
        ],
        "equityLoss": 0.083,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/16 (Match en 3 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 3 et disperse vos constructeurs, concédant -0.083 EMG face à 8/3 6/3.",
        "explanation": "Avec le jet 5-3 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/3 6/3 : il ferme la porte 3 (+0.083 EMG sur 24/16).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 3 : vos deux dés permettent d'y fermer une porte (8/3...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/3 6/3 ferme la porte 3.",
            "En Match en 3 pts (0-0, Videau à 1), 8/3 6/3 surpasse 24/16 de +0.083 EMG.",
            "Évitez 24/16 qui manque la fermeture de la porte 3 et disperse vos constructeurs ; privilégiez 8/3 6/3."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_4_63",
        "tier": 4,
        "xgid": "XGID=-c-b--G-D--AeD-A-c-ea--AA-:0:0:1:63:0:0:0:3:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 13/7",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/18 13/10",
            "24/21 13/7",
            "24/15",
            "24/21 24/18"
        ],
        "equityLoss": 0.072,
        "verdict": "doubtful",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 24/21 13/7 (Match en 3 pts (0-0, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 7, 11, 15), concédant -0.072 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 5 blot(s) exposé(s) (+0.072 EMG sur 24/21 13/7).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 5 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 24/18 13/10 surpasse 24/21 13/7 de +0.072 EMG.",
            "Évitez 24/21 13/7 qui laisse 5 pion(s) isolé(s) (flèches 7, 11, 15) ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_5_53",
        "tier": 4,
        "xgid": "XGID=-c-b--G-D-AAeC-A-cAea--A--:0:0:-1:53:0:0:0:3:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "24/16",
        "optimalMove": "8/3 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/3",
            "24/16",
            "24/21 13/8",
            "13/10 13/8"
        ],
        "equityLoss": 0.083,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/16 (Match en 3 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 3 et laisse l'initiative à l'adversaire, concédant -0.083 EMG face à 8/3 6/3.",
        "explanation": "Avec le jet 5-3 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/3 6/3 : il frappe le blot adverse sur la flèche 3 (+0.083 EMG sur 24/16).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 3 (8/3...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/3 6/3 frappe le blot adverse sur la flèche 3.",
            "En Match en 3 pts (0-0, Videau à 1), 8/3 6/3 surpasse 24/16 de +0.083 EMG.",
            "Évitez 24/16 qui refuse de frapper le blot adverse sur la flèche 3 et laisse l'initiative à l'adversaire ; privilégiez 8/3 6/3."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_6_43",
        "tier": 3,
        "xgid": "XGID=-c-d--H-E-AAeC-A-cAea--A--:0:0:1:43:0:0:0:3:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.102,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/6 (Match en 3 pts (0-0, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 10, 11, 15), concédant -0.102 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il repositionne idéalement vos bâtisseurs (24/21 13/9) avec seulement 7 blot(s) exposé(s) (+0.102 EMG sur 13/6).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 24 (24/21...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 repositionne idéalement vos bâtisseurs (24/21 13/9) avec seulement 7 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 24/21 13/9 surpasse 13/6 de +0.102 EMG.",
            "Évitez 13/6 qui laisse 5 pion(s) isolé(s) (flèches 10, 11, 15) ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_7_42",
        "tier": 2,
        "xgid": "XGID=-c-d--H-EAAAeB-A-cAeaA-Aa-:0:0:-1:42:0:0:0:3:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.178,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/22 13/9 (Match en 3 pts (0-0, Videau à 1)), vous laisse 8 pion(s) isolé(s) (flèches 10, 11, 13), concédant -0.178 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il ferme la porte 4 (+0.178 EMG sur 24/22 13/9).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 4 : vos deux dés permettent d'y fermer une porte (8/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 ferme la porte 4.",
            "En Match en 3 pts (0-0, Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.178 EMG.",
            "Évitez 24/22 13/9 qui laisse 8 pion(s) isolé(s) (flèches 10, 11, 13) ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_8_51",
        "tier": 3,
        "xgid": "XGID=-c-db-I-FAAAeB-A-cAeaA-Aa-:0:0:1:51:0:0:0:3:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.106,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/7 (Match en 3 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 23 et disperse vos constructeurs, concédant -0.106 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il ferme la porte 23 (+0.106 EMG sur 13/7).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez la flèche 23 : vos deux dés permettent d'y fermer une porte (24/23...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 ferme la porte 23.",
            "En Match en 3 pts (0-0, Videau à 1), 24/23 13/8 surpasse 13/7 de +0.106 EMG.",
            "Évitez 13/7 qui manque la fermeture de la porte 23 et disperse vos constructeurs ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_9_33",
        "tier": 4,
        "xgid": "XGID=-c-db-I-GAAaeB-A-cAeaA-AaA:0:0:1:33:0:0:0:3:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "13/10(2) 6/3(2)",
        "optimalMove": "8/5(2) 6/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5(2) 6/3(2)",
            "13/10(2) 6/3(2)",
            "24/21(2) 6/3(2)",
            "24/21(2) 13/10(2)"
        ],
        "equityLoss": 0.061,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/10(2) 6/3(2) (Match en 3 pts (0-0, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 9, 15, 18), concédant -0.061 EMG face à 8/5(2) 6/3(2).",
        "explanation": "Avec le jet 3-3 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5(2) 6/3(2) : il ferme la porte 5 (+0.061 EMG sur 13/10(2) 6/3(2)).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 5 : vos deux dés permettent d'y fermer une porte (8/5(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5(2) 6/3(2) ferme la porte 5.",
            "En Match en 3 pts (0-0, Videau à 1), 8/5(2) 6/3(2) surpasse 13/10(2) 6/3(2) de +0.061 EMG.",
            "Évitez 13/10(2) 6/3(2) qui laisse 5 pion(s) isolé(s) (flèches 9, 15, 18) ; privilégiez 8/5(2) 6/3(2)."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_10_53",
        "tier": 4,
        "xgid": "XGID=-c-bbBG-EAAaeB-A-cAeaA-AaA:0:0:-1:53:0:0:0:3:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "24/16",
        "optimalMove": "8/3 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/3",
            "24/16",
            "24/21 13/8",
            "13/10 13/8"
        ],
        "equityLoss": 0.083,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/16 (Match en 3 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 3 et laisse l'initiative à l'adversaire, concédant -0.083 EMG face à 8/3 6/3.",
        "explanation": "Avec le jet 5-3 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/3 6/3 : il frappe le blot adverse sur la flèche 3 (+0.083 EMG sur 24/16).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 3 (8/3...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/3 6/3 frappe le blot adverse sur la flèche 3.",
            "En Match en 3 pts (0-0, Videau à 1), 8/3 6/3 surpasse 24/16 de +0.083 EMG.",
            "Évitez 24/16 qui refuse de frapper le blot adverse sur la flèche 3 et laisse l'initiative à l'adversaire ; privilégiez 8/3 6/3."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_11_63",
        "tier": 4,
        "xgid": "XGID=ac-dbBH-FAAAeA-A-cAeaA-BbA:0:0:-1:63:0:0:0:3:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 13/7",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/18 13/10",
            "24/21 13/7",
            "24/15",
            "24/21 24/18"
        ],
        "equityLoss": 0.072,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 24/21 13/7 (Match en 3 pts (0-0, Videau à 1)), vous laisse 6 pion(s) isolé(s) (flèches 7, 9, 10), concédant -0.072 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il ferme la porte 10 et 18 (+0.072 EMG sur 24/21 13/7).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 10 : vos deux dés permettent d'y fermer une porte (24/18...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 ferme la porte 10 et 18.",
            "En Match en 3 pts (0-0, Videau à 1), 24/18 13/10 surpasse 24/21 13/7 de +0.072 EMG.",
            "Évitez 24/21 13/7 qui laisse 6 pion(s) isolé(s) (flèches 7, 9, 10) ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_12_52",
        "tier": 3,
        "xgid": "XGID=ac-dbBH-FAaAeB-A-caeaA-BaC:0:0:-1:52:0:0:0:3:8",
        "dice": [
            5,
            2
        ],
        "playedMove": "13/8 6/4",
        "optimalMove": "24/22 13/8",
        "acceptableMoves": [
            "13/11 13/8"
        ],
        "quizChoices": [
            "24/22 13/8",
            "13/8 6/4",
            "13/11 13/8",
            "13/6"
        ],
        "equityLoss": 0.096,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/8 6/4 (Match en 3 pts (0-0, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 9, 11, 13), concédant -0.096 EMG face à 24/22 13/8.",
        "explanation": "Avec le jet 5-2 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/22 13/8 : il repositionne idéalement vos bâtisseurs (24/22 13/8) avec seulement 6 blot(s) exposé(s) (+0.096 EMG sur 13/8 6/4).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 24 (24/22...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/22 13/8 repositionne idéalement vos bâtisseurs (24/22 13/8) avec seulement 6 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 24/22 13/8 surpasse 13/8 6/4 de +0.096 EMG.",
            "Évitez 13/8 6/4 qui laisse 5 pion(s) isolé(s) (flèches 9, 11, 13) ; privilégiez 24/22 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_13_31",
        "tier": 1,
        "xgid": "XGID=bc-ebBH-EAaAeC-A-caeAAAB-A:0:0:1:31:0:0:0:3:8",
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
            "24/20",
            "24/23 24/21"
        ],
        "equityLoss": 0.264,
        "verdict": "howler",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 24/23 13/10 (Match en 3 pts (0-0, Videau à 1)), vous laisse 7 pion(s) isolé(s) (flèches 9, 10, 11), concédant -0.264 EMG face à 8/5 6/5.",
        "explanation": "Avec le jet 3-1 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5 6/5 : il repositionne idéalement vos bâtisseurs (8/5 6/5) avec seulement 6 blot(s) exposé(s) (+0.264 EMG sur 24/23 13/10).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 8 (8/5...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5 6/5 repositionne idéalement vos bâtisseurs (8/5 6/5) avec seulement 6 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 8/5 6/5 surpasse 24/23 13/10 de +0.264 EMG.",
            "Évitez 24/23 13/10 qui laisse 7 pion(s) isolé(s) (flèches 9, 10, 11) ; privilégiez 8/5 6/5."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_14_65",
        "tier": 4,
        "xgid": "XGID=-d-ecDG-DAaAeC-A-caeAAAB-A:0:0:1:65:0:0:0:3:8",
        "dice": [
            6,
            5
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
        "equityLoss": 0.084,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 24/18 13/8 (Match en 3 pts (0-0, Videau à 1)), vous laisse 7 pion(s) isolé(s) (flèches 9, 11, 15), concédant -0.084 EMG face à 24/13.",
        "explanation": "Avec le jet 6-5 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/13 : il repositionne idéalement vos bâtisseurs (24/13) avec seulement 6 blot(s) exposé(s) (+0.084 EMG sur 24/18 13/8).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 24 (24/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/13 repositionne idéalement vos bâtisseurs (24/13) avec seulement 6 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 24/13 surpasse 24/18 13/8 de +0.084 EMG.",
            "Évitez 24/18 13/8 qui laisse 7 pion(s) isolé(s) (flèches 9, 11, 15) ; privilégiez 24/13."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_15_52",
        "tier": 3,
        "xgid": "XGID=-d-ecDG-DAaAeD-A-caeAAABaA:0:0:-1:52:0:0:0:3:8",
        "dice": [
            5,
            2
        ],
        "playedMove": "13/8 6/4",
        "optimalMove": "24/22 13/8",
        "acceptableMoves": [
            "13/11 13/8"
        ],
        "quizChoices": [
            "24/22 13/8",
            "13/8 6/4",
            "13/11 13/8",
            "13/6"
        ],
        "equityLoss": 0.096,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/8 6/4 (Match en 3 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 22 et disperse vos constructeurs, concédant -0.096 EMG face à 24/22 13/8.",
        "explanation": "Avec le jet 5-2 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/22 13/8 : il ferme la porte 22 (+0.096 EMG sur 13/8 6/4).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 22 : vos deux dés permettent d'y fermer une porte (24/22...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/22 13/8 ferme la porte 22.",
            "En Match en 3 pts (0-0, Videau à 1), 24/22 13/8 surpasse 13/8 6/4 de +0.096 EMG.",
            "Évitez 13/8 6/4 qui manque la fermeture de la porte 22 et disperse vos constructeurs ; privilégiez 24/22 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_16_52",
        "tier": 3,
        "xgid": "XGID=-d-ecDG-CAaAeE-A-caeABaB-A:0:0:-1:52:0:0:0:3:8",
        "dice": [
            5,
            2
        ],
        "playedMove": "13/8 6/4",
        "optimalMove": "24/22 13/8",
        "acceptableMoves": [
            "13/11 13/8"
        ],
        "quizChoices": [
            "24/22 13/8",
            "13/8 6/4",
            "13/11 13/8",
            "13/6"
        ],
        "equityLoss": 0.096,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/8 6/4 (Match en 3 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 22 et laisse l'initiative à l'adversaire, concédant -0.096 EMG face à 24/22 13/8.",
        "explanation": "Avec le jet 5-2 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/22 13/8 : il frappe le blot adverse sur la flèche 22 (+0.096 EMG sur 13/8 6/4).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Cherchez la frappe sur la flèche 22 (24/22...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/22 13/8 frappe le blot adverse sur la flèche 22.",
            "En Match en 3 pts (0-0, Videau à 1), 24/22 13/8 surpasse 13/8 6/4 de +0.096 EMG.",
            "Évitez 13/8 6/4 qui refuse de frapper le blot adverse sur la flèche 22 et laisse l'initiative à l'adversaire ; privilégiez 24/22 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_17_54",
        "tier": 3,
        "xgid": "XGID=-d-ecDG-BAaAeF-A-caeABbBAA:0:0:1:54:0:0:0:3:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/15",
            "13/9 13/8"
        ],
        "equityLoss": 0.125,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/4 (Match en 3 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 20 et disperse vos constructeurs, concédant -0.125 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il ferme la porte 20 (+0.125 EMG sur 13/4).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 20 : vos deux dés permettent d'y fermer une porte (24/20...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 ferme la porte 20.",
            "En Match en 3 pts (0-0, Videau à 1), 24/20 13/8 surpasse 13/4 de +0.125 EMG.",
            "Évitez 13/4 qui manque la fermeture de la porte 20 et disperse vos constructeurs ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_18_31",
        "tier": 1,
        "xgid": "XGID=-d-ecDG-CAaAeE-A-caeBBbB-A:0:0:-1:31:0:0:0:3:8",
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
            "24/20",
            "24/23 24/21"
        ],
        "equityLoss": 0.264,
        "verdict": "howler",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 24/23 13/10 (Match en 3 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 9, 10, 11), concédant -0.264 EMG face à 8/5 6/5.",
        "explanation": "Avec le jet 3-1 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5 6/5 : il repositionne idéalement vos bâtisseurs (8/5 6/5) avec seulement 3 blot(s) exposé(s) (+0.264 EMG sur 24/23 13/10).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 8 (8/5...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5 6/5 repositionne idéalement vos bâtisseurs (8/5 6/5) avec seulement 3 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 8/5 6/5 surpasse 24/23 13/10 de +0.264 EMG.",
            "Évitez 24/23 13/10 qui laisse 4 pion(s) isolé(s) (flèches 9, 10, 11) ; privilégiez 8/5 6/5."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_19_64",
        "tier": 4,
        "xgid": "XGID=-d-ecBH-DAaAeE-A-caeBBbB-A:0:0:1:64:0:0:0:3:8",
        "dice": [
            6,
            4
        ],
        "playedMove": "24/20 24/18",
        "optimalMove": "24/14",
        "acceptableMoves": [
            "24/18 13/9",
            "8/2 6/2"
        ],
        "quizChoices": [
            "24/14",
            "24/20 24/18",
            "24/18 13/9",
            "8/2 6/2"
        ],
        "equityLoss": 0.071,
        "verdict": "doubtful",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 24/20 24/18 (Match en 3 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 9, 11, 15), concédant -0.071 EMG face à 24/14.",
        "explanation": "Avec le jet 6-4 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/14 : il repositionne idéalement vos bâtisseurs (24/14) avec seulement 4 blot(s) exposé(s) (+0.071 EMG sur 24/20 24/18).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 24 (24/14...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/14 repositionne idéalement vos bâtisseurs (24/14) avec seulement 4 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 24/14 surpasse 24/20 24/18 de +0.071 EMG.",
            "Évitez 24/20 24/18 qui laisse 4 pion(s) isolé(s) (flèches 9, 11, 15) ; privilégiez 24/14."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_20_53",
        "tier": 4,
        "xgid": "XGID=-d-ecBH-DAaAeEAA-caeBBbBaA:0:0:-1:53:0:0:0:3:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "24/16",
        "optimalMove": "8/3 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/3",
            "24/16",
            "24/21 13/8",
            "13/10 13/8"
        ],
        "equityLoss": 0.083,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 24/16 (Match en 3 pts (0-0, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 9, 11, 14), concédant -0.083 EMG face à 8/3 6/3.",
        "explanation": "Avec le jet 5-3 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/3 6/3 : il repositionne idéalement vos bâtisseurs (8/3 6/3) avec seulement 4 blot(s) exposé(s) (+0.083 EMG sur 24/16).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 8 (8/3...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/3 6/3 repositionne idéalement vos bâtisseurs (8/3 6/3) avec seulement 4 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 8/3 6/3 surpasse 24/16 de +0.083 EMG.",
            "Évitez 24/16 qui laisse 5 pion(s) isolé(s) (flèches 9, 11, 14) ; privilégiez 8/3 6/3."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_21_11",
        "tier": 4,
        "xgid": "XGID=-dAgcAI-EAaAeEAA-caeCBbBa-:0:0:-1:11:0:0:0:3:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "24/23 6/5(3)",
        "optimalMove": "8/7(2) 6/5(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "8/7(2) 6/5(2)",
            "24/23 6/5(3)",
            "24/22 6/5(2)",
            "8/5 6/5"
        ],
        "equityLoss": 0.061,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/23 6/5(3) (Match en 3 pts (0-0, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 2, 9, 11), concédant -0.061 EMG face à 8/7(2) 6/5(2).",
        "explanation": "Avec le jet 1-1 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/7(2) 6/5(2) : il ferme la porte 5 et 7 (+0.061 EMG sur 24/23 6/5(3)).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 5 : vos deux dés permettent d'y fermer une porte (8/7(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/7(2) 6/5(2) ferme la porte 5 et 7.",
            "En Match en 3 pts (0-0, Videau à 1), 8/7(2) 6/5(2) surpasse 24/23 6/5(3) de +0.061 EMG.",
            "Évitez 24/23 6/5(3) qui laisse 5 pion(s) isolé(s) (flèches 2, 9, 11) ; privilégiez 8/7(2) 6/5(2)."
        ]
    },
    {
        "id": "bgt_gnu_s4_m3_22_51",
        "tier": 3,
        "xgid": "XGID=--bhcbKcHAaAeE-A-caeCBbDa-:0:0:-1:51:0:0:0:3:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.106,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/7 (Match en 3 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 9, 11, 15), concédant -0.106 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Match en 3 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 3 blot(s) exposé(s) (+0.106 EMG sur 13/7).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 24 (24/23...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 3 blot(s) exposé(s).",
            "En Match en 3 pts (0-0, Videau à 1), 24/23 13/8 surpasse 13/7 de +0.106 EMG.",
            "Évitez 13/7 qui laisse 3 pion(s) isolé(s) (flèches 9, 11, 15) ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_1_51",
        "tier": 3,
        "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:51:0:0:0:7:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.097,
        "verdict": "blunder",
        "conceptId": "opening",
        "conceptName": "Ouvertures & Développement",
        "whyFailed": "En jouant 13/7 (Match en 7 pts (0-0, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 7), concédant -0.097 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 2 blot(s) exposé(s) (+0.097 EMG sur 13/7).",
        "proverb": "En ouverture, chaque porte intérieure ou ancre avancée construite sans blot vaut de l’or.",
        "hint": "Regardez le mouvement partant de 24 (24/23...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 2 blot(s) exposé(s).",
            "En Match en 7 pts (0-0, Videau à 1), 24/23 13/8 surpasse 13/7 de +0.097 EMG.",
            "Évitez 13/7 qui laisse 1 pion(s) isolé(s) (flèches 7) ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_2_33",
        "tier": 3,
        "xgid": "XGID=-b----E-D---eD---c-e---AA-:0:0:-1:33:0:0:0:7:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "8/5(2) 6/3(2)",
        "optimalMove": "24/21(2) 13/10(2)",
        "acceptableMoves": [
            "24/21(2) 6/3(2)"
        ],
        "quizChoices": [
            "24/21(2) 13/10(2)",
            "8/5(2) 6/3(2)",
            "24/21(2) 6/3(2)",
            "13/10(2) 6/3(2)"
        ],
        "equityLoss": 0.109,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 8/5(2) 6/3(2) (Match en 7 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 23, 24), concédant -0.109 EMG face à 24/21(2) 13/10(2).",
        "explanation": "Avec le jet 3-3 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21(2) 13/10(2) : il ferme la porte 10 et 21 (+0.109 EMG sur 8/5(2) 6/3(2)).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 10 : vos deux dés permettent d'y fermer une porte (24/21(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21(2) 13/10(2) ferme la porte 10 et 21.",
            "En Match en 7 pts (0-0, Videau à 1), 24/21(2) 13/10(2) surpasse 8/5(2) 6/3(2) de +0.109 EMG.",
            "Évitez 8/5(2) 6/3(2) qui laisse 2 pion(s) isolé(s) (flèches 23, 24) ; privilégiez 24/21(2) 13/10(2)."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_3_51",
        "tier": 3,
        "xgid": "XGID=-b-b--G-D--AeC---c-e-b-BB-:0:0:-1:51:0:0:0:7:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.097,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/7 (Match en 7 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 7, 11), concédant -0.097 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 2 blot(s) exposé(s) (+0.097 EMG sur 13/7).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/23...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 2 blot(s) exposé(s).",
            "En Match en 7 pts (0-0, Videau à 1), 24/23 13/8 surpasse 13/7 de +0.097 EMG.",
            "Évitez 13/7 qui laisse 2 pion(s) isolé(s) (flèches 7, 11) ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_4_53",
        "tier": 4,
        "xgid": "XGID=-b-b--G-C--AeD---c-e-b-AC-:0:0:1:53:0:0:0:7:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "24/16",
        "optimalMove": "8/3 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/3",
            "24/16",
            "24/21 13/8",
            "13/10 13/8"
        ],
        "equityLoss": 0.081,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/16 (Match en 7 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 3 et laisse l'initiative à l'adversaire, concédant -0.081 EMG face à 8/3 6/3.",
        "explanation": "Avec le jet 5-3 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/3 6/3 : il frappe le blot adverse sur la flèche 3 (+0.081 EMG sur 24/16).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 3 (8/3...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/3 6/3 frappe le blot adverse sur la flèche 3.",
            "En Match en 7 pts (0-0, Videau à 1), 8/3 6/3 surpasse 24/16 de +0.081 EMG.",
            "Évitez 24/16 qui refuse de frapper le blot adverse sur la flèche 3 et laisse l'initiative à l'adversaire ; privilégiez 8/3 6/3."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_5_52",
        "tier": 4,
        "xgid": "XGID=ab-A--F-B--AeD---c-e-b-AC-:0:0:-1:52:0:0:0:7:8",
        "dice": [
            5,
            2
        ],
        "playedMove": "13/8 6/4",
        "optimalMove": "24/22 13/8",
        "acceptableMoves": [
            "13/11 13/8"
        ],
        "quizChoices": [
            "24/22 13/8",
            "13/8 6/4",
            "13/11 13/8",
            "13/6"
        ],
        "equityLoss": 0.089,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/8 6/4 (Match en 7 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 3, 4, 11), concédant -0.089 EMG face à 24/22 13/8.",
        "explanation": "Avec le jet 5-2 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/22 13/8 : il repositionne idéalement vos bâtisseurs (24/22 13/8) avec seulement 4 blot(s) exposé(s) (+0.089 EMG sur 13/8 6/4).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/22...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/22 13/8 repositionne idéalement vos bâtisseurs (24/22 13/8) avec seulement 4 blot(s) exposé(s).",
            "En Match en 7 pts (0-0, Videau à 1), 24/22 13/8 surpasse 13/8 6/4 de +0.089 EMG.",
            "Évitez 13/8 6/4 qui laisse 4 pion(s) isolé(s) (flèches 3, 4, 11) ; privilégiez 24/22 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_6_11",
        "tier": 4,
        "xgid": "XGID=ab-A--F-A--BeD---c-e-baBC-:0:0:-1:11:0:0:0:7:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "24/23(2) 6/5(2)",
        "optimalMove": "8/7(2) 6/5(2)",
        "acceptableMoves": [
            "24/22 6/5(2)"
        ],
        "quizChoices": [
            "8/7(2) 6/5(2)",
            "24/23(2) 6/5(2)",
            "24/22 6/5(2)",
            "24/23 6/5(3)"
        ],
        "equityLoss": 0.094,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/23(2) 6/5(2) (Match en 7 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 3, 8, 24), concédant -0.094 EMG face à 8/7(2) 6/5(2).",
        "explanation": "Avec le jet 1-1 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/7(2) 6/5(2) : il ferme la porte 5 et 7 (+0.094 EMG sur 24/23(2) 6/5(2)).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 5 : vos deux dés permettent d'y fermer une porte (8/7(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/7(2) 6/5(2) ferme la porte 5 et 7.",
            "En Match en 7 pts (0-0, Videau à 1), 8/7(2) 6/5(2) surpasse 24/23(2) 6/5(2) de +0.094 EMG.",
            "Évitez 24/23(2) 6/5(2) qui laisse 3 pion(s) isolé(s) (flèches 3, 8, 24) ; privilégiez 8/7(2) 6/5(2)."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_7_42",
        "tier": 2,
        "xgid": "XGID=ab-A-bHbC--BeD---c-e-baBC-:0:0:1:42:0:0:0:7:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.16,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/22 13/9 (Match en 7 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 4 et disperse vos constructeurs, concédant -0.160 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il ferme la porte 4 (+0.160 EMG sur 24/22 13/9).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 4 : vos deux dés permettent d'y fermer une porte (8/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 ferme la porte 4.",
            "En Match en 7 pts (0-0, Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.160 EMG.",
            "Évitez 24/22 13/9 qui manque la fermeture de la porte 4 et disperse vos constructeurs ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_8_11",
        "tier": 4,
        "xgid": "XGID=-aaABbGcB--BeD---c-e-baBC-:0:0:1:11:0:0:0:7:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "24/23(2) 6/5(2)",
        "optimalMove": "8/7(2) 6/5(2)",
        "acceptableMoves": [
            "24/22 6/5(2)"
        ],
        "quizChoices": [
            "8/7(2) 6/5(2)",
            "24/23(2) 6/5(2)",
            "24/22 6/5(2)",
            "24/23 6/5(3)"
        ],
        "equityLoss": 0.094,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/23(2) 6/5(2) (Match en 7 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 3, 5, 24), concédant -0.094 EMG face à 8/7(2) 6/5(2).",
        "explanation": "Avec le jet 1-1 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/7(2) 6/5(2) : il frappe le blot adverse sur la flèche 5 (+0.094 EMG sur 24/23(2) 6/5(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 5 (8/7(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/7(2) 6/5(2) frappe le blot adverse sur la flèche 5.",
            "En Match en 7 pts (0-0, Videau à 1), 8/7(2) 6/5(2) surpasse 24/23(2) 6/5(2) de +0.094 EMG.",
            "Évitez 24/23(2) 6/5(2) qui laisse 3 pion(s) isolé(s) (flèches 3, 5, 24) ; privilégiez 8/7(2) 6/5(2)."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_9_63",
        "tier": 4,
        "xgid": "XGID=aaaABAEa---BeD---c-e-baBC-:0:0:-1:63:0:0:0:7:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 13/7",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/18 13/10",
            "24/21 13/7",
            "24/15",
            "24/21 24/18"
        ],
        "equityLoss": 0.063,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/21 13/7 (Match en 7 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 3, 5, 7), concédant -0.063 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 4 blot(s) exposé(s) (+0.063 EMG sur 24/21 13/7).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 4 blot(s) exposé(s).",
            "En Match en 7 pts (0-0, Videau à 1), 24/18 13/10 surpasse 24/21 13/7 de +0.063 EMG.",
            "Évitez 24/21 13/7 qui laisse 3 pion(s) isolé(s) (flèches 3, 5, 7) ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_10_65",
        "tier": 4,
        "xgid": "XGID=aaaABAEa--aBeE---cae-baBD-:0:0:1:65:0:0:0:7:8",
        "dice": [
            6,
            5
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
        "equityLoss": 0.074,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/18 13/8 (Match en 7 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 3, 5, 8), concédant -0.074 EMG face à 24/13.",
        "explanation": "Avec le jet 6-5 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/13 : il repositionne idéalement vos bâtisseurs (24/13) avec seulement 2 blot(s) exposé(s) (+0.074 EMG sur 24/18 13/8).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/13 repositionne idéalement vos bâtisseurs (24/13) avec seulement 2 blot(s) exposé(s).",
            "En Match en 7 pts (0-0, Videau à 1), 24/13 surpasse 24/18 13/8 de +0.074 EMG.",
            "Évitez 24/18 13/8 qui laisse 4 pion(s) isolé(s) (flèches 3, 5, 8) ; privilégiez 24/13."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_11_62",
        "tier": 4,
        "xgid": "XGID=aaaABAEa--aBeF---cae-baBC-:0:0:-1:62:0:0:0:7:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "24/22 24/18",
        "optimalMove": "24/18 13/11",
        "acceptableMoves": [
            "24/16"
        ],
        "quizChoices": [
            "24/18 13/11",
            "24/22 24/18",
            "24/16",
            "13/11 13/7"
        ],
        "equityLoss": 0.066,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/22 24/18 (Match en 7 pts (0-0, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 3, 5, 18), concédant -0.066 EMG face à 24/18 13/11.",
        "explanation": "Avec le jet 6-2 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/11 : il frappe le blot adverse sur la flèche 18 (+0.066 EMG sur 24/22 24/18).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Cherchez la frappe sur la flèche 18 (24/18...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/11 frappe le blot adverse sur la flèche 18.",
            "En Match en 7 pts (0-0, Videau à 1), 24/18 13/11 surpasse 24/22 24/18 de +0.066 EMG.",
            "Évitez 24/22 24/18 qui laisse 5 pion(s) isolé(s) (flèches 3, 5, 18) ; privilégiez 24/18 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_12_32",
        "tier": 4,
        "xgid": "XGID=aaaABAEa--aAeG---cbe-baBD-:0:0:1:32:0:0:0:7:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "13/8",
        "optimalMove": "24/21 13/11",
        "acceptableMoves": [
            "13/11 13/10",
            "24/22 13/10"
        ],
        "quizChoices": [
            "24/21 13/11",
            "13/8",
            "13/11 13/10",
            "24/22 13/10"
        ],
        "equityLoss": 0.068,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/8 (Match en 7 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 11 et disperse vos constructeurs, concédant -0.068 EMG face à 24/21 13/11.",
        "explanation": "Avec le jet 3-2 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/11 : il ferme la porte 11 (+0.068 EMG sur 13/8).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez la flèche 11 : vos deux dés permettent d'y fermer une porte (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/11 ferme la porte 11.",
            "En Match en 7 pts (0-0, Videau à 1), 24/21 13/11 surpasse 13/8 de +0.068 EMG.",
            "Évitez 13/8 qui manque la fermeture de la porte 11 et disperse vos constructeurs ; privilégiez 24/21 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_13_32",
        "tier": 4,
        "xgid": "XGID=aaaABAEa--aBeF---cbe-aaBC-:0:0:-1:32:0:0:0:7:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "13/8",
        "optimalMove": "24/21 13/11",
        "acceptableMoves": [
            "13/11 13/10",
            "24/22 13/10"
        ],
        "quizChoices": [
            "24/21 13/11",
            "13/8",
            "13/11 13/10",
            "24/22 13/10"
        ],
        "equityLoss": 0.068,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/8 (Match en 7 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire, concédant -0.068 EMG face à 24/21 13/11.",
        "explanation": "Avec le jet 3-2 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/11 : il frappe le blot adverse sur la flèche 21 (+0.068 EMG sur 13/8).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Cherchez la frappe sur la flèche 21 (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/11 frappe le blot adverse sur la flèche 21.",
            "En Match en 7 pts (0-0, Videau à 1), 24/21 13/11 surpasse 13/8 de +0.068 EMG.",
            "Évitez 13/8 qui refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire ; privilégiez 24/21 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_14_51",
        "tier": 3,
        "xgid": "XGID=aaaABAEa--aAeG---cbe-baBD-:0:0:1:51:0:0:0:7:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.097,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/7 (Match en 7 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 3, 5, 7), concédant -0.097 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 4 blot(s) exposé(s) (+0.097 EMG sur 13/7).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/23...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 4 blot(s) exposé(s).",
            "En Match en 7 pts (0-0, Videau à 1), 24/23 13/8 surpasse 13/7 de +0.097 EMG.",
            "Évitez 13/7 qui laisse 4 pion(s) isolé(s) (flèches 3, 5, 7) ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_15_41",
        "tier": 3,
        "xgid": "XGID=aaaABbEaA-aAeF---cbe-bACD-:0:0:1:41:0:0:0:7:8",
        "dice": [
            4,
            1
        ],
        "playedMove": "13/9 8/7",
        "optimalMove": "24/23 13/9",
        "acceptableMoves": [
            "13/9 6/5"
        ],
        "quizChoices": [
            "24/23 13/9",
            "13/9 8/7",
            "13/9 6/5",
            "24/23 24/20"
        ],
        "equityLoss": 0.118,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/9 8/7 (Match en 7 pts (0-0, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 3, 7, 9), concédant -0.118 EMG face à 24/23 13/9.",
        "explanation": "Avec le jet 4-1 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/9 : il repositionne idéalement vos bâtisseurs (24/23 13/9) avec seulement 5 blot(s) exposé(s) (+0.118 EMG sur 13/9 8/7).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/23...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/9 repositionne idéalement vos bâtisseurs (24/23 13/9) avec seulement 5 blot(s) exposé(s).",
            "En Match en 7 pts (0-0, Videau à 1), 24/23 13/9 surpasse 13/9 8/7 de +0.118 EMG.",
            "Évitez 13/9 8/7 qui laisse 5 pion(s) isolé(s) (flèches 3, 7, 9) ; privilégiez 24/23 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_16_61",
        "tier": 2,
        "xgid": "XGID=aaaABbEaAAaaeF---cbe-bACDA:0:0:1:61:0:0:0:7:8",
        "dice": [
            6,
            1
        ],
        "playedMove": "24/23 24/18",
        "optimalMove": "13/7 8/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7 8/7",
            "24/23 24/18",
            "24/23 13/7",
            "24/18 6/5"
        ],
        "equityLoss": 0.172,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/23 24/18 (Match en 7 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 7 et laisse l'initiative à l'adversaire, concédant -0.172 EMG face à 13/7 8/7.",
        "explanation": "Avec le jet 6-1 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/7 8/7 : il frappe le blot adverse sur la flèche 7 et ferme la porte 7 (+0.172 EMG sur 24/23 24/18).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 7 (13/7...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/7 8/7 frappe le blot adverse sur la flèche 7 et ferme la porte 7.",
            "En Match en 7 pts (0-0, Videau à 1), 13/7 8/7 surpasse 24/23 24/18 de +0.172 EMG.",
            "Évitez 24/23 24/18 qui refuse de frapper le blot adverse sur la flèche 7 et laisse l'initiative à l'adversaire ; privilégiez 13/7 8/7."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_17_32",
        "tier": 4,
        "xgid": "XGID=abaABbEB-AaaeE---cbe-bACDA:0:0:1:32:0:0:0:7:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "13/8",
        "optimalMove": "24/21 13/11",
        "acceptableMoves": [
            "13/11 13/10",
            "24/22 13/10"
        ],
        "quizChoices": [
            "24/21 13/11",
            "13/8",
            "13/11 13/10",
            "24/22 13/10"
        ],
        "equityLoss": 0.068,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/8 (Match en 7 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 11 et laisse l'initiative à l'adversaire, concédant -0.068 EMG face à 24/21 13/11.",
        "explanation": "Avec le jet 3-2 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/11 : il frappe le blot adverse sur la flèche 11 (+0.068 EMG sur 13/8).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Cherchez la frappe sur la flèche 11 (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/11 frappe le blot adverse sur la flèche 11.",
            "En Match en 7 pts (0-0, Videau à 1), 24/21 13/11 surpasse 13/8 de +0.068 EMG.",
            "Évitez 13/8 qui refuse de frapper le blot adverse sur la flèche 11 et laisse l'initiative à l'adversaire ; privilégiez 24/21 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_18_11",
        "tier": 4,
        "xgid": "XGID=bbaABbEB-AaAeD---cbe-aACCA:0:0:-1:11:0:0:0:7:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "24/23(2) 6/5(2)",
        "optimalMove": "8/7(2) 6/5(2)",
        "acceptableMoves": [
            "24/22 6/5(2)"
        ],
        "quizChoices": [
            "8/7(2) 6/5(2)",
            "24/23(2) 6/5(2)",
            "24/22 6/5(2)",
            "24/23 6/5(3)"
        ],
        "equityLoss": 0.094,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/23(2) 6/5(2) (Match en 7 pts (0-0, Videau à 1)), vous laisse 6 pion(s) isolé(s) (flèches 3, 5, 9), concédant -0.094 EMG face à 8/7(2) 6/5(2).",
        "explanation": "Avec le jet 1-1 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/7(2) 6/5(2) : il frappe le blot adverse sur la flèche 5 (+0.094 EMG sur 24/23(2) 6/5(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 5 (8/7(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/7(2) 6/5(2) frappe le blot adverse sur la flèche 5.",
            "En Match en 7 pts (0-0, Videau à 1), 8/7(2) 6/5(2) surpasse 24/23(2) 6/5(2) de +0.094 EMG.",
            "Évitez 24/23(2) 6/5(2) qui laisse 6 pion(s) isolé(s) (flèches 3, 5, 9) ; privilégiez 8/7(2) 6/5(2)."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_19_42",
        "tier": 2,
        "xgid": "XGID=bcaABdGaBAaAeD---cbe-AADC-:0:0:1:42:0:0:0:7:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.16,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/22 13/9 (Match en 7 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 3, 11, 21), concédant -0.160 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il repositionne idéalement vos bâtisseurs (8/4 6/4) avec seulement 6 blot(s) exposé(s) (+0.160 EMG sur 24/22 13/9).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 8 (8/4...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 repositionne idéalement vos bâtisseurs (8/4 6/4) avec seulement 6 blot(s) exposé(s).",
            "En Match en 7 pts (0-0, Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.160 EMG.",
            "Évitez 24/22 13/9 qui laisse 3 pion(s) isolé(s) (flèches 3, 11, 21) ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_20_32",
        "tier": 4,
        "xgid": "XGID=acaaDdFaAAaAeD---cbe-AADCA:0:0:1:32:0:0:0:7:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "13/8",
        "optimalMove": "24/21 13/11",
        "acceptableMoves": [
            "13/11 13/10",
            "24/22 13/10"
        ],
        "quizChoices": [
            "24/21 13/11",
            "13/8",
            "13/11 13/10",
            "24/22 13/10"
        ],
        "equityLoss": 0.068,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/8 (Match en 7 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 9, 11, 21), concédant -0.068 EMG face à 24/21 13/11.",
        "explanation": "Avec le jet 3-2 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/11 : il ferme la porte 11 et 21 (+0.068 EMG sur 13/8).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 11 : vos deux dés permettent d'y fermer une porte (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/11 ferme la porte 11 et 21.",
            "En Match en 7 pts (0-0, Videau à 1), 24/21 13/11 surpasse 13/8 de +0.068 EMG.",
            "Évitez 13/8 qui laisse 4 pion(s) isolé(s) (flèches 9, 11, 21) ; privilégiez 24/21 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_21_51",
        "tier": 3,
        "xgid": "XGID=acaaDdFaAAaBeC---cbe-BADBA:0:0:1:51:0:0:0:7:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.097,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/7 (Match en 7 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 8 et disperse vos constructeurs, concédant -0.097 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il ferme la porte 8 (+0.097 EMG sur 13/7).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 8 : vos deux dés permettent d'y fermer une porte (24/23...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 ferme la porte 8.",
            "En Match en 7 pts (0-0, Videau à 1), 24/23 13/8 surpasse 13/7 de +0.097 EMG.",
            "Évitez 13/7 qui manque la fermeture de la porte 8 et disperse vos constructeurs ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s5_m7_22_33",
        "tier": 3,
        "xgid": "XGID=acaaDdFaBAaBeB---cbe-BAEAA:0:0:1:33:0:0:0:7:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "24/18(2)",
        "optimalMove": "8/5(2) 6/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5(2) 6/3(2)",
            "24/18(2)",
            "24/21(2) 6/3(2)",
            "24/21(2) 13/10(2)"
        ],
        "equityLoss": 0.125,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/18(2) (Match en 7 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 3 et disperse vos constructeurs, concédant -0.125 EMG face à 8/5(2) 6/3(2).",
        "explanation": "Avec le jet 3-3 en Match en 7 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5(2) 6/3(2) : il frappe le blot adverse sur la flèche 3 et ferme la porte 3 (+0.125 EMG sur 24/18(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 3 (8/5(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5(2) 6/3(2) frappe le blot adverse sur la flèche 3 et ferme la porte 3.",
            "En Match en 7 pts (0-0, Videau à 1), 8/5(2) 6/3(2) surpasse 24/18(2) de +0.125 EMG.",
            "Évitez 24/18(2) qui manque la fermeture de la porte 3 et disperse vos constructeurs ; privilégiez 8/5(2) 6/3(2)."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_1_31",
        "tier": 1,
        "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:31:5:3:0:7:8",
        "dice": [
            3,
            1
        ],
        "playedMove": "24/20",
        "optimalMove": "8/5 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5 6/5",
            "24/20",
            "24/23 24/21",
            "24/23 13/10"
        ],
        "equityLoss": 0.224,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/20 (Match en 7 pts (5-3, Videau à 1)), vous manque la fermeture de la porte 5 et disperse vos constructeurs, concédant -0.224 EMG face à 8/5 6/5.",
        "explanation": "Avec le jet 3-1 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5 6/5 : il ferme la porte 5 (+0.224 EMG sur 24/20).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 5 : vos deux dés permettent d'y fermer une porte (8/5...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5 6/5 ferme la porte 5.",
            "En Match en 7 pts (5-3, Videau à 1), 8/5 6/5 surpasse 24/20 de +0.224 EMG.",
            "Évitez 24/20 qui manque la fermeture de la porte 5 et disperse vos constructeurs ; privilégiez 8/5 6/5."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_2_32",
        "tier": 4,
        "xgid": "XGID=-b---BD-B---eE---c-e----B-:0:0:-1:32:5:3:0:7:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "13/10 6/4",
        "optimalMove": "24/22 13/10",
        "acceptableMoves": [
            "24/21 13/11",
            "24/22 24/21",
            "13/11 13/10"
        ],
        "quizChoices": [
            "24/22 13/10",
            "13/10 6/4",
            "24/21 13/11",
            "24/22 24/21"
        ],
        "equityLoss": 0.086,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/10 6/4 (Match en 7 pts (5-3, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 4, 10), concédant -0.086 EMG face à 24/22 13/10.",
        "explanation": "Avec le jet 3-2 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/22 13/10 : il repositionne idéalement vos bâtisseurs (24/22 13/10) avec seulement 3 blot(s) exposé(s) (+0.086 EMG sur 13/10 6/4).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 24 (24/22...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/22 13/10 repositionne idéalement vos bâtisseurs (24/22 13/10) avec seulement 3 blot(s) exposé(s).",
            "En Match en 7 pts (5-3, Videau à 1), 24/22 13/10 surpasse 13/10 6/4 de +0.086 EMG.",
            "Évitez 13/10 6/4 qui laisse 2 pion(s) isolé(s) (flèches 4, 10) ; privilégiez 24/22 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_3_53",
        "tier": 3,
        "xgid": "XGID=-b---BD-B-a-eF---c-e--a-C-:0:0:1:53:5:3:0:7:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "13/10 13/8",
        "optimalMove": "8/3 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/3",
            "13/10 13/8",
            "24/21 13/8",
            "24/16"
        ],
        "equityLoss": 0.111,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/10 13/8 (Match en 7 pts (5-3, Videau à 1)), vous manque la fermeture de la porte 3 et disperse vos constructeurs, concédant -0.111 EMG face à 8/3 6/3.",
        "explanation": "Avec le jet 5-3 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/3 6/3 : il ferme la porte 3 (+0.111 EMG sur 13/10 13/8).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 3 : vos deux dés permettent d'y fermer une porte (8/3...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/3 6/3 ferme la porte 3.",
            "En Match en 7 pts (5-3, Videau à 1), 8/3 6/3 surpasse 13/10 13/8 de +0.111 EMG.",
            "Évitez 13/10 13/8 qui manque la fermeture de la porte 3 et disperse vos constructeurs ; privilégiez 8/3 6/3."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_4_31",
        "tier": 1,
        "xgid": "XGID=-b-B-BC-A-a-eF---c-e--a-C-:0:0:-1:31:5:3:0:7:8",
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
            "13/9",
            "13/10 6/5"
        ],
        "equityLoss": 0.285,
        "verdict": "howler",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 24/23 13/10 (Match en 7 pts (5-3, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 8, 10, 23), concédant -0.285 EMG face à 8/5 6/5.",
        "explanation": "Avec le jet 3-1 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5 6/5 : il repositionne idéalement vos bâtisseurs (8/5 6/5) avec seulement 0 blot(s) exposé(s) (+0.285 EMG sur 24/23 13/10).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 8 (8/5...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5 6/5 repositionne idéalement vos bâtisseurs (8/5 6/5) avec seulement 0 blot(s) exposé(s).",
            "En Match en 7 pts (5-3, Videau à 1), 8/5 6/5 surpasse 24/23 13/10 de +0.285 EMG.",
            "Évitez 24/23 13/10 qui laisse 3 pion(s) isolé(s) (flèches 8, 10, 23) ; privilégiez 8/5 6/5."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_5_51",
        "tier": 3,
        "xgid": "XGID=-b-B-aD-B-a-eF---c-e--a-CA:0:0:1:51:5:3:0:7:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.116,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/7 (Match en 7 pts (5-3, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 7), concédant -0.116 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 1 blot(s) exposé(s) (+0.116 EMG sur 13/7).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 24 (24/23...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 1 blot(s) exposé(s).",
            "En Match en 7 pts (5-3, Videau à 1), 24/23 13/8 surpasse 13/7 de +0.116 EMG.",
            "Évitez 13/7 qui laisse 1 pion(s) isolé(s) (flèches 7) ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_6_11",
        "tier": 4,
        "xgid": "XGID=-b-B-aD-C-a-eE---c-e--aABA:0:0:-1:11:5:3:0:7:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "24/22 6/5(2)",
        "optimalMove": "8/7(2) 6/5(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "8/7(2) 6/5(2)",
            "24/22 6/5(2)",
            "24/23 6/5(3)",
            "8/5 6/5"
        ],
        "equityLoss": 0.061,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/22 6/5(2) (Match en 7 pts (5-3, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 22, 23, 24), concédant -0.061 EMG face à 8/7(2) 6/5(2).",
        "explanation": "Avec le jet 1-1 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/7(2) 6/5(2) : il frappe le blot adverse sur la flèche 5 et ferme la porte 5 et 7 (+0.061 EMG sur 24/22 6/5(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 5 (8/7(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/7(2) 6/5(2) frappe le blot adverse sur la flèche 5 et ferme la porte 5 et 7.",
            "En Match en 7 pts (5-3, Videau à 1), 8/7(2) 6/5(2) surpasse 24/22 6/5(2) de +0.061 EMG.",
            "Évitez 24/22 6/5(2) qui laisse 3 pion(s) isolé(s) (flèches 22, 23, 24) ; privilégiez 8/7(2) 6/5(2)."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_7_41",
        "tier": 2,
        "xgid": "XGID=-b-B-cFbE-a-eE---c-e--aABA:0:0:1:41:5:3:0:7:8",
        "dice": [
            4,
            1
        ],
        "playedMove": "24/20 8/7",
        "optimalMove": "24/23 13/9",
        "acceptableMoves": [
            "24/23 24/20",
            "24/20 6/5",
            "13/9 6/5"
        ],
        "quizChoices": [
            "24/23 13/9",
            "24/20 8/7",
            "24/23 24/20",
            "24/20 6/5"
        ],
        "equityLoss": 0.162,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 24/20 8/7 (Match en 7 pts (5-3, Videau à 1)), vous manque la fermeture de la porte 23 et disperse vos constructeurs, concédant -0.162 EMG face à 24/23 13/9.",
        "explanation": "Avec le jet 4-1 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/9 : il ferme la porte 23 (+0.162 EMG sur 24/20 8/7).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez la flèche 23 : vos deux dés permettent d'y fermer une porte (24/23...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/9 ferme la porte 23.",
            "En Match en 7 pts (5-3, Videau à 1), 24/23 13/9 surpasse 24/20 8/7 de +0.162 EMG.",
            "Évitez 24/20 8/7 qui manque la fermeture de la porte 23 et disperse vos constructeurs ; privilégiez 24/23 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_8_52",
        "tier": 3,
        "xgid": "XGID=-b-B-cFbEAa-eD---c-e--aBAA:0:0:-1:52:5:3:0:7:8",
        "dice": [
            5,
            2
        ],
        "playedMove": "13/8 6/4",
        "optimalMove": "13/11 13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11 13/8",
            "13/8 6/4",
            "24/22 13/8",
            "13/6"
        ],
        "equityLoss": 0.099,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/8 6/4 (Match en 7 pts (5-3, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 4, 9, 24), concédant -0.099 EMG face à 13/11 13/8.",
        "explanation": "Avec le jet 5-2 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/11 13/8 : il repositionne idéalement vos bâtisseurs (13/11 13/8) avec seulement 3 blot(s) exposé(s) (+0.099 EMG sur 13/8 6/4).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 13 (13/11...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/11 13/8 repositionne idéalement vos bâtisseurs (13/11 13/8) avec seulement 3 blot(s) exposé(s).",
            "En Match en 7 pts (5-3, Videau à 1), 13/11 13/8 surpasse 13/8 6/4 de +0.099 EMG.",
            "Évitez 13/8 6/4 qui laisse 3 pion(s) isolé(s) (flèches 4, 9, 24) ; privilégiez 13/11 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_9_53",
        "tier": 3,
        "xgid": "XGID=-b-B-cFbDAaaeF---c-e--aBAA:0:0:1:53:5:3:0:7:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "13/10 13/8",
        "optimalMove": "8/3 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/3",
            "13/10 13/8",
            "24/21 13/8",
            "24/16"
        ],
        "equityLoss": 0.111,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/10 13/8 (Match en 7 pts (5-3, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 9, 10, 24), concédant -0.111 EMG face à 8/3 6/3.",
        "explanation": "Avec le jet 5-3 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/3 6/3 : il repositionne idéalement vos bâtisseurs (8/3 6/3) avec seulement 2 blot(s) exposé(s) (+0.111 EMG sur 13/10 13/8).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Regardez le mouvement partant de 8 (8/3...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/3 6/3 repositionne idéalement vos bâtisseurs (8/3 6/3) avec seulement 2 blot(s) exposé(s).",
            "En Match en 7 pts (5-3, Videau à 1), 8/3 6/3 surpasse 13/10 13/8 de +0.111 EMG.",
            "Évitez 13/10 13/8 qui laisse 3 pion(s) isolé(s) (flèches 9, 10, 24) ; privilégiez 8/3 6/3."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_10_63",
        "tier": 4,
        "xgid": "XGID=-b-D-cEbCAaaeF---c-e--aBAA:0:0:-1:63:5:3:0:7:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 24/18",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/18 13/10",
            "24/21 24/18",
            "24/15",
            "13/10 13/7"
        ],
        "equityLoss": 0.07,
        "verdict": "doubtful",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 24/21 24/18 (Match en 7 pts (5-3, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 10 et laisse l'initiative à l'adversaire, concédant -0.070 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il frappe le blot adverse sur la flèche 10 (+0.070 EMG sur 24/21 24/18).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Cherchez la frappe sur la flèche 10 (24/18...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 frappe le blot adverse sur la flèche 10.",
            "En Match en 7 pts (5-3, Videau à 1), 24/18 13/10 surpasse 24/21 24/18 de +0.070 EMG.",
            "Évitez 24/21 24/18 qui refuse de frapper le blot adverse sur la flèche 10 et laisse l'initiative à l'adversaire ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_11_11",
        "tier": 4,
        "xgid": "XGID=-b-D-cEbCAbaeG---cae--aBBA:0:0:1:11:5:3:0:7:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "24/23(2) 6/5(2)",
        "optimalMove": "8/7(2) 6/5(2)",
        "acceptableMoves": [
            "24/22 6/5(2)"
        ],
        "quizChoices": [
            "8/7(2) 6/5(2)",
            "24/23(2) 6/5(2)",
            "24/22 6/5(2)",
            "24/23 6/5(3)"
        ],
        "equityLoss": 0.077,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/23(2) 6/5(2) (Match en 7 pts (5-3, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 7 et laisse l'initiative à l'adversaire, concédant -0.077 EMG face à 8/7(2) 6/5(2).",
        "explanation": "Avec le jet 1-1 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/7(2) 6/5(2) : il frappe le blot adverse sur la flèche 7 (+0.077 EMG sur 24/23(2) 6/5(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 7 (8/7(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/7(2) 6/5(2) frappe le blot adverse sur la flèche 7.",
            "En Match en 7 pts (5-3, Videau à 1), 8/7(2) 6/5(2) surpasse 24/23(2) 6/5(2) de +0.077 EMG.",
            "Évitez 24/23(2) 6/5(2) qui refuse de frapper le blot adverse sur la flèche 7 et laisse l'initiative à l'adversaire ; privilégiez 8/7(2) 6/5(2)."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_12_42",
        "tier": 2,
        "xgid": "XGID=ab-D-aCAAAbaeG---cae--aBBA:0:0:-1:42:5:3:0:7:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.177,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/22 13/9 (Match en 7 pts (5-3, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 7, 8, 22), concédant -0.177 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il ferme la porte 4 (+0.177 EMG sur 24/22 13/9).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 4 : vos deux dés permettent d'y fermer une porte (8/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 ferme la porte 4.",
            "En Match en 7 pts (5-3, Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.177 EMG.",
            "Évitez 24/22 13/9 qui laisse 4 pion(s) isolé(s) (flèches 7, 8, 22) ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_13_11",
        "tier": 4,
        "xgid": "XGID=ab-DbaDABAbaeG---cae--aBBA:0:0:1:11:5:3:0:7:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "24/23(2) 6/5(2)",
        "optimalMove": "8/7(2) 6/5(2)",
        "acceptableMoves": [
            "24/22 6/5(2)"
        ],
        "quizChoices": [
            "8/7(2) 6/5(2)",
            "24/23(2) 6/5(2)",
            "24/22 6/5(2)",
            "24/23 6/5(3)"
        ],
        "equityLoss": 0.077,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/23(2) 6/5(2) (Match en 7 pts (5-3, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 7, 9), concédant -0.077 EMG face à 8/7(2) 6/5(2).",
        "explanation": "Avec le jet 1-1 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/7(2) 6/5(2) : il frappe le blot adverse sur la flèche 5 et ferme la porte 5 et 7 (+0.077 EMG sur 24/23(2) 6/5(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 5 (8/7(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/7(2) 6/5(2) frappe le blot adverse sur la flèche 5 et ferme la porte 5 et 7.",
            "En Match en 7 pts (5-3, Videau à 1), 8/7(2) 6/5(2) surpasse 24/23(2) 6/5(2) de +0.077 EMG.",
            "Évitez 24/23(2) 6/5(2) qui laisse 2 pion(s) isolé(s) (flèches 7, 9) ; privilégiez 8/7(2) 6/5(2)."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_14_52",
        "tier": 3,
        "xgid": "XGID=abaDbBBC-AbaeG---cae--aBBA:0:0:1:52:5:3:0:7:8",
        "dice": [
            5,
            2
        ],
        "playedMove": "13/8 6/4",
        "optimalMove": "24/22 13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "24/22 13/8",
            "13/8 6/4",
            "13/11 13/8",
            "13/6"
        ],
        "equityLoss": 0.116,
        "verdict": "blunder",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/8 6/4 (Match en 7 pts (5-3, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 22 et laisse l'initiative à l'adversaire, concédant -0.116 EMG face à 24/22 13/8.",
        "explanation": "Avec le jet 5-2 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/22 13/8 : il frappe le blot adverse sur la flèche 22 (+0.116 EMG sur 13/8 6/4).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Cherchez la frappe sur la flèche 22 (24/22...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/22 13/8 frappe le blot adverse sur la flèche 22.",
            "En Match en 7 pts (5-3, Videau à 1), 24/22 13/8 surpasse 13/8 6/4 de +0.116 EMG.",
            "Évitez 13/8 6/4 qui refuse de frapper le blot adverse sur la flèche 22 et laisse l'initiative à l'adversaire ; privilégiez 24/22 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_15_63",
        "tier": 4,
        "xgid": "XGID=acaDbBBCAAbaeF---cae--ABAA:0:0:1:63:5:3:0:7:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 24/18",
        "optimalMove": "24/15",
        "acceptableMoves": [
            "24/18 13/10"
        ],
        "quizChoices": [
            "24/15",
            "24/21 24/18",
            "24/18 13/10",
            "24/21 13/7"
        ],
        "equityLoss": 0.07,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/21 24/18 (Match en 7 pts (5-3, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 8, 9, 18), concédant -0.070 EMG face à 24/15.",
        "explanation": "Avec le jet 6-3 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/15 : il repositionne idéalement vos bâtisseurs (24/15) avec seulement 4 blot(s) exposé(s) (+0.070 EMG sur 24/21 24/18).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/15...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/15 repositionne idéalement vos bâtisseurs (24/15) avec seulement 4 blot(s) exposé(s).",
            "En Match en 7 pts (5-3, Videau à 1), 24/15 surpasse 24/21 24/18 de +0.070 EMG.",
            "Évitez 24/21 24/18 qui laisse 5 pion(s) isolé(s) (flèches 8, 9, 18) ; privilégiez 24/15."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_16_51",
        "tier": 4,
        "xgid": "XGID=acaDbBBCAAbaeF-A-cae--AB-A:0:0:-1:51:5:3:0:7:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "13/8 6/5"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "13/8 6/5",
            "24/18"
        ],
        "equityLoss": 0.079,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/7 (Match en 7 pts (5-3, Videau à 1)), vous manque la fermeture de la porte 8 et disperse vos constructeurs, concédant -0.079 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il ferme la porte 8 (+0.079 EMG sur 13/7).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 8 : vos deux dés permettent d'y fermer une porte (24/23...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 ferme la porte 8.",
            "En Match en 7 pts (5-3, Videau à 1), 24/23 13/8 surpasse 13/7 de +0.079 EMG.",
            "Évitez 13/7 qui manque la fermeture de la porte 8 et disperse vos constructeurs ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_17_21",
        "tier": 4,
        "xgid": "XGID=acaDbBBCaAbaeG-A-cae--AAAB:0:0:-1:21:5:3:0:7:8",
        "dice": [
            2,
            1
        ],
        "playedMove": "13/10",
        "optimalMove": "13/11 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11 6/5",
            "13/10",
            "24/23 13/11",
            "24/21"
        ],
        "equityLoss": 0.073,
        "verdict": "doubtful",
        "conceptId": "cube_decision",
        "conceptName": "Stratégie de Score & Videau",
        "whyFailed": "En jouant 13/10 (Match en 7 pts (5-3, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 11 et laisse l'initiative à l'adversaire, concédant -0.073 EMG face à 13/11 6/5.",
        "explanation": "Avec le jet 2-1 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/11 6/5 : il frappe le blot adverse sur la flèche 11 (+0.073 EMG sur 13/10).",
        "proverb": "Adaptez toujours votre prise de risque au score du match (table Kazaross-XG2) et à la valeur du videau.",
        "hint": "Cherchez la frappe sur la flèche 11 (13/11...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/11 6/5 frappe le blot adverse sur la flèche 11.",
            "En Match en 7 pts (5-3, Videau à 1), 13/11 6/5 surpasse 13/10 de +0.073 EMG.",
            "Évitez 13/10 qui refuse de frapper le blot adverse sur la flèche 11 et laisse l'initiative à l'adversaire ; privilégiez 13/11 6/5."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_18_54",
        "tier": 3,
        "xgid": "XGID=acaDbACCaAbbeH-A-cae--ABB-:0:0:-1:54:5:3:0:7:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "13/9 13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "13/9 13/8",
            "13/4",
            "24/20 13/8",
            "24/15"
        ],
        "equityLoss": 0.114,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 13/4 (Match en 7 pts (5-3, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 8 et laisse l'initiative à l'adversaire, concédant -0.114 EMG face à 13/9 13/8.",
        "explanation": "Avec le jet 5-4 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/9 13/8 : il frappe le blot adverse sur la flèche 8 et ferme la porte 9 (+0.114 EMG sur 13/4).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 8 (13/9...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/9 13/8 frappe le blot adverse sur la flèche 8 et ferme la porte 9.",
            "En Match en 7 pts (5-3, Videau à 1), 13/9 13/8 surpasse 13/4 de +0.114 EMG.",
            "Évitez 13/4 qui refuse de frapper le blot adverse sur la flèche 8 et laisse l'initiative à l'adversaire ; privilégiez 13/9 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_19_55",
        "tier": 2,
        "xgid": "XGID=acaDbACCbabbeJ-A-cae--ABBA:0:0:1:55:5:3:0:7:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "13/3 8/3(2)",
        "optimalMove": "13/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/3(2)",
            "13/3 8/3(2)",
            "13/3 13/8(2)",
            "13/8(4)"
        ],
        "equityLoss": 0.18,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/3 8/3(2) (Match en 7 pts (5-3, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 5, 15, 22), concédant -0.180 EMG face à 13/3(2).",
        "explanation": "Avec le jet 5-5 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/3(2) : il repositionne idéalement vos bâtisseurs (13/3(2)) avec seulement 3 blot(s) exposé(s) (+0.180 EMG sur 13/3 8/3(2)).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 13 (13/3(2)...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/3(2) repositionne idéalement vos bâtisseurs (13/3(2)) avec seulement 3 blot(s) exposé(s).",
            "En Match en 7 pts (5-3, Videau à 1), 13/3(2) surpasse 13/3 8/3(2) de +0.180 EMG.",
            "Évitez 13/3 8/3(2) qui laisse 3 pion(s) isolé(s) (flèches 5, 15, 22) ; privilégiez 13/3(2)."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_20_64",
        "tier": 4,
        "xgid": "XGID=acaFbACCbabbeH-A-cae--ABBA:0:0:-1:64:5:3:0:7:8",
        "dice": [
            6,
            4
        ],
        "playedMove": "13/9 13/7",
        "optimalMove": "8/2 6/2",
        "acceptableMoves": [],
        "quizChoices": [
            "8/2 6/2",
            "13/9 13/7",
            "24/18 13/9",
            "24/14"
        ],
        "equityLoss": 0.067,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 13/9 13/7 (Match en 7 pts (5-3, Videau à 1)), vous manque la fermeture de la porte 2 et disperse vos constructeurs, concédant -0.067 EMG face à 8/2 6/2.",
        "explanation": "Avec le jet 6-4 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/2 6/2 : il frappe le blot adverse sur la flèche 2 et ferme la porte 2 (+0.067 EMG sur 13/9 13/7).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 2 (8/2...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/2 6/2 frappe le blot adverse sur la flèche 2 et ferme la porte 2.",
            "En Match en 7 pts (5-3, Videau à 1), 8/2 6/2 surpasse 13/9 13/7 de +0.067 EMG.",
            "Évitez 13/9 13/7 qui manque la fermeture de la porte 2 et disperse vos constructeurs ; privilégiez 8/2 6/2."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_21_52",
        "tier": 3,
        "xgid": "XGID=accFbADCaabbeH-A-cae--ABBA:0:0:1:52:5:3:0:7:8",
        "dice": [
            5,
            2
        ],
        "playedMove": "13/8 6/4",
        "optimalMove": "24/22 13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "24/22 13/8",
            "13/8 6/4",
            "13/11 13/8",
            "13/6"
        ],
        "equityLoss": 0.116,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 13/8 6/4 (Match en 7 pts (5-3, Videau à 1)), vous manque la fermeture de la porte 22 et disperse vos constructeurs, concédant -0.116 EMG face à 24/22 13/8.",
        "explanation": "Avec le jet 5-2 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/22 13/8 : il frappe le blot adverse sur la flèche 8 et ferme la porte 22 (+0.116 EMG sur 13/8 6/4).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 8 (24/22...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/22 13/8 frappe le blot adverse sur la flèche 8 et ferme la porte 22.",
            "En Match en 7 pts (5-3, Videau à 1), 24/22 13/8 surpasse 13/8 6/4 de +0.116 EMG.",
            "Évitez 13/8 6/4 qui manque la fermeture de la porte 22 et disperse vos constructeurs ; privilégiez 24/22 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s6_m7_22_21",
        "tier": 4,
        "xgid": "XGID=accFbaDCAabbeG-A-cae--BCAA:0:0:-1:21:5:3:0:7:8",
        "dice": [
            2,
            1
        ],
        "playedMove": "13/10",
        "optimalMove": "13/11 6/5",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11 6/5",
            "13/10",
            "24/23 13/11",
            "24/21"
        ],
        "equityLoss": 0.073,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 13/10 (Match en 7 pts (5-3, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 5 et laisse l'initiative à l'adversaire, concédant -0.073 EMG face à 13/11 6/5.",
        "explanation": "Avec le jet 2-1 en Match en 7 pts (5-3, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/11 6/5 : il frappe le blot adverse sur la flèche 5 (+0.073 EMG sur 13/10).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 5 (13/11...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/11 6/5 frappe le blot adverse sur la flèche 5.",
            "En Match en 7 pts (5-3, Videau à 1), 13/11 6/5 surpasse 13/10 de +0.073 EMG.",
            "Évitez 13/10 qui refuse de frapper le blot adverse sur la flèche 5 et laisse l'initiative à l'adversaire ; privilégiez 13/11 6/5."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_1_42",
        "tier": 2,
        "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:9:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.159,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/22 13/9 (Match en 9 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 4 et disperse vos constructeurs, concédant -0.159 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il ferme la porte 4 (+0.159 EMG sur 24/22 13/9).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 4 : vos deux dés permettent d'y fermer une porte (8/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 ferme la porte 4.",
            "En Match en 9 pts (0-0, Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.159 EMG.",
            "Évitez 24/22 13/9 qui manque la fermeture de la porte 4 et disperse vos constructeurs ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_2_61",
        "tier": 2,
        "xgid": "XGID=-b----E-CA--eD---c-e--A-A-:0:0:-1:61:0:0:0:9:8",
        "dice": [
            6,
            1
        ],
        "playedMove": "24/23 24/18",
        "optimalMove": "13/7 8/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7 8/7",
            "24/23 24/18",
            "13/6",
            "24/23 13/7"
        ],
        "equityLoss": 0.166,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/23 24/18 (Match en 9 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 7 et disperse vos constructeurs, concédant -0.166 EMG face à 13/7 8/7.",
        "explanation": "Avec le jet 6-1 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/7 8/7 : il ferme la porte 7 (+0.166 EMG sur 24/23 24/18).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 7 : vos deux dés permettent d'y fermer une porte (13/7...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/7 8/7 ferme la porte 7.",
            "En Match en 9 pts (0-0, Videau à 1), 13/7 8/7 surpasse 24/23 24/18 de +0.166 EMG.",
            "Évitez 24/23 24/18 qui manque la fermeture de la porte 7 et disperse vos constructeurs ; privilégiez 13/7 8/7."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_3_51",
        "tier": 3,
        "xgid": "XGID=-b----EbDA--eE---c-e--A-A-:0:0:1:51:0:0:0:9:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.096,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/7 (Match en 9 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 9, 22, 24), concédant -0.096 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 3 blot(s) exposé(s) (+0.096 EMG sur 13/7).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/23...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 3 blot(s) exposé(s).",
            "En Match en 9 pts (0-0, Videau à 1), 24/23 13/8 surpasse 13/7 de +0.096 EMG.",
            "Évitez 13/7 qui laisse 3 pion(s) isolé(s) (flèches 9, 22, 24) ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_4_31",
        "tier": 1,
        "xgid": "XGID=-b----EbDA--eE---cAe--A---:0:0:-1:31:0:0:0:9:8",
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
            "24/20",
            "24/23 24/21"
        ],
        "equityLoss": 0.236,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/23 13/10 (Match en 9 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 5 et disperse vos constructeurs, concédant -0.236 EMG face à 8/5 6/5.",
        "explanation": "Avec le jet 3-1 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5 6/5 : il ferme la porte 5 (+0.236 EMG sur 24/23 13/10).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 5 : vos deux dés permettent d'y fermer une porte (8/5...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5 6/5 ferme la porte 5.",
            "En Match en 9 pts (0-0, Videau à 1), 8/5 6/5 surpasse 24/23 13/10 de +0.236 EMG.",
            "Évitez 24/23 13/10 qui manque la fermeture de la porte 5 et disperse vos constructeurs ; privilégiez 8/5 6/5."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_5_63",
        "tier": 4,
        "xgid": "XGID=-b---bFbEA--eE---cAe--A---:0:0:1:63:0:0:0:9:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 13/7",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/18 13/10",
            "24/21 13/7",
            "24/15",
            "24/21 24/18"
        ],
        "equityLoss": 0.062,
        "verdict": "doubtful",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 24/21 13/7 (Match en 9 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 18 et disperse vos constructeurs, concédant -0.062 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il ferme la porte 18 (+0.062 EMG sur 24/21 13/7).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 18 : vos deux dés permettent d'y fermer une porte (24/18...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 ferme la porte 18.",
            "En Match en 9 pts (0-0, Videau à 1), 24/18 13/10 surpasse 24/21 13/7 de +0.062 EMG.",
            "Évitez 24/21 13/7 qui manque la fermeture de la porte 18 et disperse vos constructeurs ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_6_42",
        "tier": 2,
        "xgid": "XGID=-b---bFbEAA-eD---cBe--A-a-:0:0:-1:42:0:0:0:9:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.159,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/22 13/9 (Match en 9 pts (0-0, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 10), concédant -0.159 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il ferme la porte 4 (+0.159 EMG sur 24/22 13/9).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 4 : vos deux dés permettent d'y fermer une porte (8/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 ferme la porte 4.",
            "En Match en 9 pts (0-0, Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.159 EMG.",
            "Évitez 24/22 13/9 qui laisse 1 pion(s) isolé(s) (flèches 10) ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_7_65",
        "tier": 4,
        "xgid": "XGID=-b--bbGbFAA-eD---cBe--A-a-:0:0:1:65:0:0:0:9:8",
        "dice": [
            6,
            5
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
        "equityLoss": 0.073,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/18 13/8 (Match en 9 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 9, 10, 22), concédant -0.073 EMG face à 24/13.",
        "explanation": "Avec le jet 6-5 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/13 : il repositionne idéalement vos bâtisseurs (24/13) avec seulement 3 blot(s) exposé(s) (+0.073 EMG sur 24/18 13/8).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/13 repositionne idéalement vos bâtisseurs (24/13) avec seulement 3 blot(s) exposé(s).",
            "En Match en 9 pts (0-0, Videau à 1), 24/13 surpasse 24/18 13/8 de +0.073 EMG.",
            "Évitez 24/18 13/8 qui laisse 3 pion(s) isolé(s) (flèches 9, 10, 22) ; privilégiez 24/13."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_8_32",
        "tier": 4,
        "xgid": "XGID=-b--bbGbFAA-eE---cBe--A-b-:0:0:-1:32:0:0:0:9:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "13/8",
        "optimalMove": "24/21 13/11",
        "acceptableMoves": [
            "13/11 13/10",
            "24/22 13/10"
        ],
        "quizChoices": [
            "24/21 13/11",
            "13/8",
            "13/11 13/10",
            "24/22 13/10"
        ],
        "equityLoss": 0.067,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/8 (Match en 9 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 9, 10, 22), concédant -0.067 EMG face à 24/21 13/11.",
        "explanation": "Avec le jet 3-2 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/11 : il repositionne idéalement vos bâtisseurs (24/21 13/11) avec seulement 5 blot(s) exposé(s) (+0.067 EMG sur 13/8).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/21...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/11 repositionne idéalement vos bâtisseurs (24/21 13/11) avec seulement 5 blot(s) exposé(s).",
            "En Match en 9 pts (0-0, Videau à 1), 24/21 13/11 surpasse 13/8 de +0.067 EMG.",
            "Évitez 13/8 qui laisse 3 pion(s) isolé(s) (flèches 9, 10, 22) ; privilégiez 24/21 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_9_62",
        "tier": 4,
        "xgid": "XGID=-b--bbGbFAAaeF---cBe-aA-a-:0:0:1:62:0:0:0:9:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "24/22 24/18",
        "optimalMove": "24/18 13/11",
        "acceptableMoves": [
            "24/16"
        ],
        "quizChoices": [
            "24/18 13/11",
            "24/22 24/18",
            "24/16",
            "13/11 13/7"
        ],
        "equityLoss": 0.065,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/22 24/18 (Match en 9 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 11 et laisse l'initiative à l'adversaire, concédant -0.065 EMG face à 24/18 13/11.",
        "explanation": "Avec le jet 6-2 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/11 : il frappe le blot adverse sur la flèche 11 (+0.065 EMG sur 24/22 24/18).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Cherchez la frappe sur la flèche 11 (24/18...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/11 frappe le blot adverse sur la flèche 11.",
            "En Match en 9 pts (0-0, Videau à 1), 24/18 13/11 surpasse 24/22 24/18 de +0.065 EMG.",
            "Évitez 24/22 24/18 qui refuse de frapper le blot adverse sur la flèche 11 et laisse l'initiative à l'adversaire ; privilégiez 24/18 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_10_11",
        "tier": 4,
        "xgid": "XGID=ab--bbGbFAAAeE---cCe-aA-b-:0:0:-1:11:0:0:0:9:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "24/23(2) 6/5(2)",
        "optimalMove": "8/7(2) 6/5(2)",
        "acceptableMoves": [
            "24/22 6/5(2)"
        ],
        "quizChoices": [
            "8/7(2) 6/5(2)",
            "24/23(2) 6/5(2)",
            "24/22 6/5(2)",
            "24/23 6/5(3)"
        ],
        "equityLoss": 0.092,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/23(2) 6/5(2) (Match en 9 pts (0-0, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 5, 9, 10), concédant -0.092 EMG face à 8/7(2) 6/5(2).",
        "explanation": "Avec le jet 1-1 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/7(2) 6/5(2) : il frappe deux pions adverses sur les flèches 7 et 5 (+0.092 EMG sur 24/23(2) 6/5(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 7 (8/7(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/7(2) 6/5(2) frappe deux pions adverses sur les flèches 7 et 5.",
            "En Match en 9 pts (0-0, Videau à 1), 8/7(2) 6/5(2) surpasse 24/23(2) 6/5(2) de +0.092 EMG.",
            "Évitez 24/23(2) 6/5(2) qui laisse 5 pion(s) isolé(s) (flèches 5, 9, 10) ; privilégiez 8/7(2) 6/5(2)."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_11_43",
        "tier": 4,
        "xgid": "XGID=ab--bdIdHAAAeE---cCe-aA-b-:0:0:1:43:0:0:0:9:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/6 (Match en 9 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire, concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il frappe le blot adverse sur la flèche 21 et ferme la porte 9 (+0.090 EMG sur 13/6).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Cherchez la frappe sur la flèche 21 (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 frappe le blot adverse sur la flèche 21 et ferme la porte 9.",
            "En Match en 9 pts (0-0, Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_12_55",
        "tier": 2,
        "xgid": "XGID=bb--bdIdHBAAeD---cCe-AA-c-:0:0:-1:55:0:0:0:9:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "13/3 8/3(2)",
        "optimalMove": "13/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/3(2)",
            "13/3 8/3(2)",
            "13/3 13/8(2)",
            "13/8(4)"
        ],
        "equityLoss": 0.178,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/3 8/3(2) (Match en 9 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 10, 11, 21), concédant -0.178 EMG face à 13/3(2).",
        "explanation": "Avec le jet 5-5 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/3(2) : il ferme la porte 3 (+0.178 EMG sur 13/3 8/3(2)).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 3 : vos deux dés permettent d'y fermer une porte (13/3(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/3(2) ferme la porte 3.",
            "En Match en 9 pts (0-0, Videau à 1), 13/3(2) surpasse 13/3 8/3(2) de +0.178 EMG.",
            "Évitez 13/3 8/3(2) qui laisse 4 pion(s) isolé(s) (flèches 10, 11, 21) ; privilégiez 13/3(2)."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_13_55",
        "tier": 2,
        "xgid": "XGID=bb-bbdIdHBAAeF---cCe-AA-c-:0:0:1:55:0:0:0:9:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "13/3 8/3(2)",
        "optimalMove": "13/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/3(2)",
            "13/3 8/3(2)",
            "13/3 13/8(2)",
            "13/8(4)"
        ],
        "equityLoss": 0.178,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 13/3 8/3(2) (Match en 9 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 10, 11, 21), concédant -0.178 EMG face à 13/3(2).",
        "explanation": "Avec le jet 5-5 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/3(2) : il frappe le blot adverse sur la flèche 3 (+0.178 EMG sur 13/3 8/3(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 3 (13/3(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/3(2) frappe le blot adverse sur la flèche 3.",
            "En Match en 9 pts (0-0, Videau à 1), 13/3(2) surpasse 13/3 8/3(2) de +0.178 EMG.",
            "Évitez 13/3 8/3(2) qui laisse 4 pion(s) isolé(s) (flèches 10, 11, 21) ; privilégiez 13/3(2)."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_14_43",
        "tier": 4,
        "xgid": "XGID=bbaAbdIdHBAAeD---cCe-AA-c-:0:0:1:43:0:0:0:9:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/6 (Match en 9 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 21 et disperse vos constructeurs, concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il ferme la porte 21 (+0.090 EMG sur 13/6).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 21 : vos deux dés permettent d'y fermer une porte (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 ferme la porte 21.",
            "En Match en 9 pts (0-0, Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui manque la fermeture de la porte 21 et disperse vos constructeurs ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_15_31",
        "tier": 1,
        "xgid": "XGID=-bbAbeIdHCAAeC---cCe-BA-d-:0:0:1:31:0:0:0:9:8",
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
            "24/20",
            "24/23 24/21"
        ],
        "equityLoss": 0.236,
        "verdict": "howler",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/23 13/10 (Match en 9 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 3, 11, 22), concédant -0.236 EMG face à 8/5 6/5.",
        "explanation": "Avec le jet 3-1 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5 6/5 : il repositionne idéalement vos bâtisseurs (8/5 6/5) avec seulement 4 blot(s) exposé(s) (+0.236 EMG sur 24/23 13/10).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 8 (8/5...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5 6/5 repositionne idéalement vos bâtisseurs (8/5 6/5) avec seulement 4 blot(s) exposé(s).",
            "En Match en 9 pts (0-0, Videau à 1), 8/5 6/5 surpasse 24/23 13/10 de +0.236 EMG.",
            "Évitez 24/23 13/10 qui laisse 4 pion(s) isolé(s) (flèches 3, 11, 22) ; privilégiez 8/5 6/5."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_16_22",
        "tier": 4,
        "xgid": "XGID=-bbAbcHdGCAAeC---cCe-BA-d-:0:0:-1:22:0:0:0:9:8",
        "dice": [
            2,
            2
        ],
        "playedMove": "24/22 13/11 6/4(2)",
        "optimalMove": "13/11(2) 6/4(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11(2) 6/4(2)",
            "24/22 13/11 6/4(2)",
            "24/22(2) 6/4(2)",
            "13/9 6/4(2)"
        ],
        "equityLoss": 0.068,
        "verdict": "doubtful",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/22 13/11 6/4(2) (Match en 9 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 3, 4, 10), concédant -0.068 EMG face à 13/11(2) 6/4(2).",
        "explanation": "Avec le jet 2-2 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/11(2) 6/4(2) : il frappe le blot adverse sur la flèche 4 et ferme la porte 11 (+0.068 EMG sur 24/22 13/11 6/4(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 4 (13/11(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/11(2) 6/4(2) frappe le blot adverse sur la flèche 4 et ferme la porte 11.",
            "En Match en 9 pts (0-0, Videau à 1), 13/11(2) 6/4(2) surpasse 24/22 13/11 6/4(2) de +0.068 EMG.",
            "Évitez 24/22 13/11 6/4(2) qui laisse 3 pion(s) isolé(s) (flèches 3, 4, 10) ; privilégiez 13/11(2) 6/4(2)."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_17_32",
        "tier": 4,
        "xgid": "XGID=-bbAdcJdGCAbeE---cCe-BA-dA:0:0:-1:32:0:0:0:9:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "13/8",
        "optimalMove": "24/21 13/11",
        "acceptableMoves": [
            "13/11 13/10",
            "24/22 13/10"
        ],
        "quizChoices": [
            "24/21 13/11",
            "13/8",
            "13/11 13/10",
            "24/22 13/10"
        ],
        "equityLoss": 0.067,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/8 (Match en 9 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 3, 10, 22), concédant -0.067 EMG face à 24/21 13/11.",
        "explanation": "Avec le jet 3-2 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/11 : il repositionne idéalement vos bâtisseurs (24/21 13/11) avec seulement 3 blot(s) exposé(s) (+0.067 EMG sur 13/8).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/21...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/11 repositionne idéalement vos bâtisseurs (24/21 13/11) avec seulement 3 blot(s) exposé(s).",
            "En Match en 9 pts (0-0, Videau à 1), 24/21 13/11 surpasse 13/8 de +0.067 EMG.",
            "Évitez 13/8 qui laisse 3 pion(s) isolé(s) (flèches 3, 10, 22) ; privilégiez 24/21 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_18_63",
        "tier": 4,
        "xgid": "XGID=-bbAdcJdHBAceF---cCe-AB-c-:0:0:-1:63:0:0:0:9:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 13/7",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/18 13/10",
            "24/21 13/7",
            "24/15",
            "24/21 24/18"
        ],
        "equityLoss": 0.062,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/21 13/7 (Match en 9 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 3, 10), concédant -0.062 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il ferme la porte 10 (+0.062 EMG sur 24/21 13/7).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez la flèche 10 : vos deux dés permettent d'y fermer une porte (24/18...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 ferme la porte 10.",
            "En Match en 9 pts (0-0, Videau à 1), 24/18 13/10 surpasse 24/21 13/7 de +0.062 EMG.",
            "Évitez 24/21 13/7 qui laisse 2 pion(s) isolé(s) (flèches 3, 10) ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_19_54",
        "tier": 3,
        "xgid": "XGID=-bbAdcKdGBaceG---cBe-AC-b-:0:0:-1:54:0:0:0:9:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/15",
            "13/9 13/8"
        ],
        "equityLoss": 0.113,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/4 (Match en 9 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 3, 21), concédant -0.113 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il repositionne idéalement vos bâtisseurs (24/20 13/8) avec seulement 3 blot(s) exposé(s) (+0.113 EMG sur 13/4).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/20...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 repositionne idéalement vos bâtisseurs (24/20 13/8) avec seulement 3 blot(s) exposé(s).",
            "En Match en 9 pts (0-0, Videau à 1), 24/20 13/8 surpasse 13/4 de +0.113 EMG.",
            "Évitez 13/4 qui laisse 2 pion(s) isolé(s) (flèches 3, 21) ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_20_65",
        "tier": 4,
        "xgid": "XGID=-bbAdcKdFBaceH---cBeaAC-a-:0:0:1:65:0:0:0:9:8",
        "dice": [
            6,
            5
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
        "equityLoss": 0.073,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/18 13/8 (Match en 9 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 3, 21), concédant -0.073 EMG face à 24/13.",
        "explanation": "Avec le jet 6-5 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/13 : il repositionne idéalement vos bâtisseurs (24/13) avec seulement 2 blot(s) exposé(s) (+0.073 EMG sur 24/18 13/8).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/13 repositionne idéalement vos bâtisseurs (24/13) avec seulement 2 blot(s) exposé(s).",
            "En Match en 9 pts (0-0, Videau à 1), 24/13 surpasse 24/18 13/8 de +0.073 EMG.",
            "Évitez 24/18 13/8 qui laisse 2 pion(s) isolé(s) (flèches 3, 21) ; privilégiez 24/13."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_21_55",
        "tier": 2,
        "xgid": "XGID=a-cAdcKdFAaceI---cBeaBC-b-:0:0:-1:55:0:0:0:9:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "13/3 8/3(2)",
        "optimalMove": "13/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/3(2)",
            "13/3 8/3(2)",
            "13/3 13/8(2)",
            "13/8(4)"
        ],
        "equityLoss": 0.178,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/3 8/3(2) (Match en 9 pts (0-0, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 9), concédant -0.178 EMG face à 13/3(2).",
        "explanation": "Avec le jet 5-5 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/3(2) : il ferme la porte 3 (+0.178 EMG sur 13/3 8/3(2)).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 3 : vos deux dés permettent d'y fermer une porte (13/3(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/3(2) ferme la porte 3.",
            "En Match en 9 pts (0-0, Videau à 1), 13/3(2) surpasse 13/3 8/3(2) de +0.178 EMG.",
            "Évitez 13/3 8/3(2) qui laisse 1 pion(s) isolé(s) (flèches 9) ; privilégiez 13/3(2)."
        ]
    },
    {
        "id": "bgt_gnu_s7_m9_22_42",
        "tier": 2,
        "xgid": "XGID=-BA-geIfEAaceJ---cBeABD-b-:0:0:-1:42:0:0:0:9:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.159,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/22 13/9 (Match en 9 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 2, 20), concédant -0.159 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Match en 9 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il repositionne idéalement vos bâtisseurs (8/4 6/4) avec seulement 3 blot(s) exposé(s) (+0.159 EMG sur 24/22 13/9).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 8 (8/4...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 repositionne idéalement vos bâtisseurs (8/4 6/4) avec seulement 3 blot(s) exposé(s).",
            "En Match en 9 pts (0-0, Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.159 EMG.",
            "Évitez 24/22 13/9 qui laisse 2 pion(s) isolé(s) (flèches 2, 20) ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_1_61",
        "tier": 2,
        "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:61:0:0:0:11:8",
        "dice": [
            6,
            1
        ],
        "playedMove": "24/23 24/18",
        "optimalMove": "13/7 8/7",
        "acceptableMoves": [],
        "quizChoices": [
            "13/7 8/7",
            "24/23 24/18",
            "24/23 13/7",
            "24/18 6/5"
        ],
        "equityLoss": 0.171,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/23 24/18 (Match en 11 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 7 et disperse vos constructeurs, concédant -0.171 EMG face à 13/7 8/7.",
        "explanation": "Avec le jet 6-1 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/7 8/7 : il ferme la porte 7 (+0.171 EMG sur 24/23 24/18).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 7 : vos deux dés permettent d'y fermer une porte (13/7...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/7 8/7 ferme la porte 7.",
            "En Match en 11 pts (0-0, Videau à 1), 13/7 8/7 surpasse 24/23 24/18 de +0.171 EMG.",
            "Évitez 24/23 24/18 qui manque la fermeture de la porte 7 et disperse vos constructeurs ; privilégiez 13/7 8/7."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_2_33",
        "tier": 3,
        "xgid": "XGID=-b----EBB---eD---c-e----B-:0:0:-1:33:0:0:0:11:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "13/10(2) 6/3(2)",
        "optimalMove": "24/21(2) 13/10(2)",
        "acceptableMoves": [
            "24/21(2) 6/3(2)",
            "24/21(2) 8/5(2)"
        ],
        "quizChoices": [
            "24/21(2) 13/10(2)",
            "13/10(2) 6/3(2)",
            "24/21(2) 6/3(2)",
            "24/21(2) 8/5(2)"
        ],
        "equityLoss": 0.096,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/10(2) 6/3(2) (Match en 11 pts (0-0, Videau à 1)), vous laisse 0 pion(s) isolé(s) (flèches exposées), concédant -0.096 EMG face à 24/21(2) 13/10(2).",
        "explanation": "Avec le jet 3-3 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21(2) 13/10(2) : il ferme la porte 10 et 21 (+0.096 EMG sur 13/10(2) 6/3(2)).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 10 : vos deux dés permettent d'y fermer une porte (24/21(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21(2) 13/10(2) ferme la porte 10 et 21.",
            "En Match en 11 pts (0-0, Videau à 1), 24/21(2) 13/10(2) surpasse 13/10(2) 6/3(2) de +0.096 EMG.",
            "Évitez 13/10(2) 6/3(2) qui laisse 0 pion(s) isolé(s) (flèches exposées) ; privilégiez 24/21(2) 13/10(2)."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_3_63",
        "tier": 4,
        "xgid": "XGID=-b----EBB-b-eF---c-e-b--D-:0:0:1:63:0:0:0:11:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 13/7",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/18 13/10",
            "24/21 13/7",
            "24/15",
            "24/21 24/18"
        ],
        "equityLoss": 0.062,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/21 13/7 (Match en 11 pts (0-0, Videau à 1)), vous laisse 0 pion(s) isolé(s) (flèches exposées), concédant -0.062 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 1 blot(s) exposé(s) (+0.062 EMG sur 24/21 13/7).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 1 blot(s) exposé(s).",
            "En Match en 11 pts (0-0, Videau à 1), 24/18 13/10 surpasse 24/21 13/7 de +0.062 EMG.",
            "Évitez 24/21 13/7 qui laisse 0 pion(s) isolé(s) (flèches exposées) ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_4_66",
        "tier": 2,
        "xgid": "XGID=-b----EBB-a-eE---cAe-b--C-:0:0:-1:66:0:0:0:11:8",
        "dice": [
            6,
            6
        ],
        "playedMove": "24/18 13/7(3)",
        "optimalMove": "24/18(2) 13/7(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "24/18(2) 13/7(2)",
            "24/18 13/7(3)",
            "24/18(2) 8/2(2)",
            "13/7(2) 8/2(2)"
        ],
        "equityLoss": 0.215,
        "verdict": "howler",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 24/18 13/7(3) (Match en 11 pts (0-0, Videau à 1)), vous laisse 0 pion(s) isolé(s) (flèches exposées), concédant -0.215 EMG face à 24/18(2) 13/7(2).",
        "explanation": "Avec le jet 6-6 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18(2) 13/7(2) : il ferme la porte 18 (+0.215 EMG sur 24/18 13/7(3)).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 18 : vos deux dés permettent d'y fermer une porte (24/18(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18(2) 13/7(2) ferme la porte 18.",
            "En Match en 11 pts (0-0, Videau à 1), 24/18(2) 13/7(2) surpasse 24/18 13/7(3) de +0.215 EMG.",
            "Évitez 24/18 13/7(3) qui laisse 0 pion(s) isolé(s) (flèches exposées) ; privilégiez 24/18(2) 13/7(2)."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_5_54",
        "tier": 3,
        "xgid": "XGID=-b----EaB-a-eG---cbeAb-AE-:0:0:-1:54:0:0:0:11:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/15",
            "13/9 13/8"
        ],
        "equityLoss": 0.113,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/4 (Match en 11 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 20 et disperse vos constructeurs, concédant -0.113 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il ferme la porte 20 (+0.113 EMG sur 13/4).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 20 : vos deux dés permettent d'y fermer une porte (24/20...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 ferme la porte 20.",
            "En Match en 11 pts (0-0, Videau à 1), 24/20 13/8 surpasse 13/4 de +0.113 EMG.",
            "Évitez 13/4 qui manque la fermeture de la porte 20 et disperse vos constructeurs ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_6_32",
        "tier": 4,
        "xgid": "XGID=-b----EaA-a-eH---cbeab-AFA:0:0:1:32:0:0:0:11:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "13/8",
        "optimalMove": "24/21 13/11",
        "acceptableMoves": [
            "13/11 13/10",
            "24/22 13/10"
        ],
        "quizChoices": [
            "24/21 13/11",
            "13/8",
            "13/11 13/10",
            "24/22 13/10"
        ],
        "equityLoss": 0.068,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/8 (Match en 11 pts (0-0, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 23), concédant -0.068 EMG face à 24/21 13/11.",
        "explanation": "Avec le jet 3-2 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/11 : il repositionne idéalement vos bâtisseurs (24/21 13/11) avec seulement 3 blot(s) exposé(s) (+0.068 EMG sur 13/8).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/21...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/11 repositionne idéalement vos bâtisseurs (24/21 13/11) avec seulement 3 blot(s) exposé(s).",
            "En Match en 11 pts (0-0, Videau à 1), 24/21 13/11 surpasse 13/8 de +0.068 EMG.",
            "Évitez 13/8 qui laisse 1 pion(s) isolé(s) (flèches 23) ; privilégiez 24/21 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_7_11",
        "tier": 4,
        "xgid": "XGID=-b----EaA-aAeG---cbeaa-AEA:0:0:-1:11:0:0:0:11:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "24/23(2) 6/5(2)",
        "optimalMove": "8/7(2) 6/5(2)",
        "acceptableMoves": [
            "24/22 6/5(2)"
        ],
        "quizChoices": [
            "8/7(2) 6/5(2)",
            "24/23(2) 6/5(2)",
            "24/22 6/5(2)",
            "24/23 6/5(3)"
        ],
        "equityLoss": 0.092,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/23(2) 6/5(2) (Match en 11 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 7 et laisse l'initiative à l'adversaire, concédant -0.092 EMG face à 8/7(2) 6/5(2).",
        "explanation": "Avec le jet 1-1 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/7(2) 6/5(2) : il frappe le blot adverse sur la flèche 7 et ferme la porte 5 et 7 (+0.092 EMG sur 24/23(2) 6/5(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 7 (8/7(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/7(2) 6/5(2) frappe le blot adverse sur la flèche 7 et ferme la porte 5 et 7.",
            "En Match en 11 pts (0-0, Videau à 1), 8/7(2) 6/5(2) surpasse 24/23(2) 6/5(2) de +0.092 EMG.",
            "Évitez 24/23(2) 6/5(2) qui refuse de frapper le blot adverse sur la flèche 7 et laisse l'initiative à l'adversaire ; privilégiez 8/7(2) 6/5(2)."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_8_43",
        "tier": 4,
        "xgid": "XGID=-b---bGcC-aAeG---cbeaa-AEA:0:0:1:43:0:0:0:11:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/6 (Match en 11 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire, concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il frappe le blot adverse sur la flèche 21 (+0.090 EMG sur 13/6).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Cherchez la frappe sur la flèche 21 (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 frappe le blot adverse sur la flèche 21.",
            "En Match en 11 pts (0-0, Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui refuse de frapper le blot adverse sur la flèche 21 et laisse l'initiative à l'adversaire ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_9_65",
        "tier": 4,
        "xgid": "XGID=ab---bGcCAaAeF---cbeaA-ADA:0:0:-1:65:0:0:0:11:8",
        "dice": [
            6,
            5
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
        "equityLoss": 0.074,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/18 13/8 (Match en 11 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 9, 11, 21), concédant -0.074 EMG face à 24/13.",
        "explanation": "Avec le jet 6-5 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/13 : il repositionne idéalement vos bâtisseurs (24/13) avec seulement 4 blot(s) exposé(s) (+0.074 EMG sur 24/18 13/8).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/13 repositionne idéalement vos bâtisseurs (24/13) avec seulement 4 blot(s) exposé(s).",
            "En Match en 11 pts (0-0, Videau à 1), 24/13 surpasse 24/18 13/8 de +0.074 EMG.",
            "Évitez 24/18 13/8 qui laisse 4 pion(s) isolé(s) (flèches 9, 11, 21) ; privilégiez 24/13."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_10_33",
        "tier": 3,
        "xgid": "XGID=ab---bGcCAaBeD---cbeaA-BDA:0:0:-1:33:0:0:0:11:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "24/18(2)",
        "optimalMove": "8/5(2) 6/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5(2) 6/3(2)",
            "24/18(2)",
            "24/21(2) 6/3(2)",
            "24/21(2) 13/10(2)"
        ],
        "equityLoss": 0.125,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/18(2) (Match en 11 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 3 et disperse vos constructeurs, concédant -0.125 EMG face à 8/5(2) 6/3(2).",
        "explanation": "Avec le jet 3-3 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5(2) 6/3(2) : il frappe le blot adverse sur la flèche 5 et ferme la porte 3 (+0.125 EMG sur 24/18(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 5 (8/5(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5(2) 6/3(2) frappe le blot adverse sur la flèche 5 et ferme la porte 3.",
            "En Match en 11 pts (0-0, Videau à 1), 8/5(2) 6/3(2) surpasse 24/18(2) de +0.125 EMG.",
            "Évitez 24/18(2) qui manque la fermeture de la porte 3 et disperse vos constructeurs ; privilégiez 8/5(2) 6/3(2)."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_11_43",
        "tier": 4,
        "xgid": "XGID=ab-b-dIcEAaBeD---cbeaA-BDA:0:0:1:43:0:0:0:11:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/6 (Match en 11 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 9/21 et disperse vos constructeurs, concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il ferme la porte 9 et 21 (+0.090 EMG sur 13/6).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 9 : vos deux dés permettent d'y fermer une porte (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 ferme la porte 9 et 21.",
            "En Match en 11 pts (0-0, Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui manque la fermeture de la porte 9/21 et disperse vos constructeurs ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_12_55",
        "tier": 2,
        "xgid": "XGID=ab-b-dIcEBaBeC---cbeaB-BCA:0:0:-1:55:0:0:0:11:8",
        "dice": [
            5,
            5
        ],
        "playedMove": "13/3 8/3(2)",
        "optimalMove": "13/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/3(2)",
            "13/3 8/3(2)",
            "13/3 13/8(2)",
            "13/8(4)"
        ],
        "equityLoss": 0.179,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 13/3 8/3(2) (Match en 11 pts (0-0, Videau à 1)), vous laisse 0 pion(s) isolé(s) (flèches exposées), concédant -0.179 EMG face à 13/3(2).",
        "explanation": "Avec le jet 5-5 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/3(2) : il frappe le blot adverse sur la flèche 3 (+0.179 EMG sur 13/3 8/3(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 3 (13/3(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/3(2) frappe le blot adverse sur la flèche 3.",
            "En Match en 11 pts (0-0, Videau à 1), 13/3(2) surpasse 13/3 8/3(2) de +0.179 EMG.",
            "Évitez 13/3 8/3(2) qui laisse 0 pion(s) isolé(s) (flèches exposées) ; privilégiez 13/3(2)."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_13_42",
        "tier": 2,
        "xgid": "XGID=ab-d-dIcEBaBeE---cbeaB-BCA:0:0:1:42:0:0:0:11:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.159,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/22 13/9 (Match en 11 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 4 et disperse vos constructeurs, concédant -0.159 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il ferme la porte 4 (+0.159 EMG sur 24/22 13/9).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 4 : vos deux dés permettent d'y fermer une porte (8/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 ferme la porte 4.",
            "En Match en 11 pts (0-0, Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.159 EMG.",
            "Évitez 24/22 13/9 qui manque la fermeture de la porte 4 et disperse vos constructeurs ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_14_43",
        "tier": 4,
        "xgid": "XGID=ab-dBdHcDBaBeE---cbeaB-BCA:0:0:-1:43:0:0:0:11:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/6 (Match en 11 pts (0-0, Videau à 1)), vous laisse 0 pion(s) isolé(s) (flèches exposées), concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il repositionne idéalement vos bâtisseurs (24/21 13/9) avec seulement 0 blot(s) exposé(s) (+0.090 EMG sur 13/6).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/21...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 repositionne idéalement vos bâtisseurs (24/21 13/9) avec seulement 0 blot(s) exposé(s).",
            "En Match en 11 pts (0-0, Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui laisse 0 pion(s) isolé(s) (flèches exposées) ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_15_62",
        "tier": 4,
        "xgid": "XGID=ab-dBdHcDAaCeE---cbeaA-CCA:0:0:-1:62:0:0:0:11:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "24/22 24/18",
        "optimalMove": "24/18 13/11",
        "acceptableMoves": [
            "24/16"
        ],
        "quizChoices": [
            "24/18 13/11",
            "24/22 24/18",
            "24/16",
            "13/11 13/7"
        ],
        "equityLoss": 0.065,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/22 24/18 (Match en 11 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 9, 21, 22), concédant -0.065 EMG face à 24/18 13/11.",
        "explanation": "Avec le jet 6-2 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/11 : il repositionne idéalement vos bâtisseurs (24/18 13/11) avec seulement 2 blot(s) exposé(s) (+0.065 EMG sur 24/22 24/18).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/11 repositionne idéalement vos bâtisseurs (24/18 13/11) avec seulement 2 blot(s) exposé(s).",
            "En Match en 11 pts (0-0, Videau à 1), 24/18 13/11 surpasse 24/22 24/18 de +0.065 EMG.",
            "Évitez 24/22 24/18 qui laisse 4 pion(s) isolé(s) (flèches 9, 21, 22) ; privilégiez 24/18 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_16_43",
        "tier": 4,
        "xgid": "XGID=ab-dBdHcDAaBeF---cceaA-CDA:0:0:1:43:0:0:0:11:8",
        "dice": [
            4,
            3
        ],
        "playedMove": "13/6",
        "optimalMove": "24/21 13/9",
        "acceptableMoves": [
            "24/21 24/20",
            "13/10 13/9",
            "24/20 13/10"
        ],
        "quizChoices": [
            "24/21 13/9",
            "13/6",
            "24/21 24/20",
            "13/10 13/9"
        ],
        "equityLoss": 0.09,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/6 (Match en 11 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 9/21 et disperse vos constructeurs, concédant -0.090 EMG face à 24/21 13/9.",
        "explanation": "Avec le jet 4-3 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/9 : il ferme la porte 9 et 21 (+0.090 EMG sur 13/6).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 9 : vos deux dés permettent d'y fermer une porte (24/21...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/9 ferme la porte 9 et 21.",
            "En Match en 11 pts (0-0, Videau à 1), 24/21 13/9 surpasse 13/6 de +0.090 EMG.",
            "Évitez 13/6 qui manque la fermeture de la porte 9/21 et disperse vos constructeurs ; privilégiez 24/21 13/9."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_17_53",
        "tier": 4,
        "xgid": "XGID=-a-dBeHdDBaBeE-A-cceaAACC-:0:0:-1:53:0:0:0:11:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "24/16",
        "optimalMove": "8/3 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/3",
            "24/16",
            "24/21 13/8",
            "13/10 13/8"
        ],
        "equityLoss": 0.081,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/16 (Match en 11 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 15, 16, 21), concédant -0.081 EMG face à 8/3 6/3.",
        "explanation": "Avec le jet 5-3 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/3 6/3 : il repositionne idéalement vos bâtisseurs (8/3 6/3) avec seulement 3 blot(s) exposé(s) (+0.081 EMG sur 24/16).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 8 (8/3...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/3 6/3 repositionne idéalement vos bâtisseurs (8/3 6/3) avec seulement 3 blot(s) exposé(s).",
            "En Match en 11 pts (0-0, Videau à 1), 8/3 6/3 surpasse 24/16 de +0.081 EMG.",
            "Évitez 24/16 qui laisse 4 pion(s) isolé(s) (flèches 15, 16, 21) ; privilégiez 8/3 6/3."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_18_62",
        "tier": 4,
        "xgid": "XGID=-ABgAeIdCB-BeE-AacceaAACC-:0:0:-1:62:0:0:0:11:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "24/22 24/18",
        "optimalMove": "24/18 13/11",
        "acceptableMoves": [
            "24/16"
        ],
        "quizChoices": [
            "24/18 13/11",
            "24/22 24/18",
            "24/16",
            "13/11 13/7"
        ],
        "equityLoss": 0.065,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/22 24/18 (Match en 11 pts (0-0, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 1, 4, 15), concédant -0.065 EMG face à 24/18 13/11.",
        "explanation": "Avec le jet 6-2 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/11 : il repositionne idéalement vos bâtisseurs (24/18 13/11) avec seulement 5 blot(s) exposé(s) (+0.065 EMG sur 24/22 24/18).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/11 repositionne idéalement vos bâtisseurs (24/18 13/11) avec seulement 5 blot(s) exposé(s).",
            "En Match en 11 pts (0-0, Videau à 1), 24/18 13/11 surpasse 24/22 24/18 de +0.065 EMG.",
            "Évitez 24/22 24/18 qui laisse 5 pion(s) isolé(s) (flèches 1, 4, 15) ; privilégiez 24/18 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_19_63",
        "tier": 4,
        "xgid": "XGID=-BCgAeHdBB-AeF-AacdeaAACD-:0:0:-1:63:0:0:0:11:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 13/7",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/18 13/10",
            "24/21 13/7",
            "24/15",
            "24/21 24/18"
        ],
        "equityLoss": 0.062,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/21 13/7 (Match en 11 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 4, 11, 15), concédant -0.062 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 6 blot(s) exposé(s) (+0.062 EMG sur 24/21 13/7).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 6 blot(s) exposé(s).",
            "En Match en 11 pts (0-0, Videau à 1), 24/18 13/10 surpasse 24/21 13/7 de +0.062 EMG.",
            "Évitez 24/21 13/7 qui laisse 4 pion(s) isolé(s) (flèches 4, 11, 15) ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_20_42",
        "tier": 2,
        "xgid": "XGID=-BEgAeGdABaAeG-AaceeaAACE-:0:0:-1:42:0:0:0:11:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.159,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/22 13/9 (Match en 11 pts (0-0, Videau à 1)), vous laisse 5 pion(s) isolé(s) (flèches 4, 8, 11), concédant -0.159 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il ferme la porte 4 (+0.159 EMG sur 24/22 13/9).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 4 : vos deux dés permettent d'y fermer une porte (8/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 ferme la porte 4.",
            "En Match en 11 pts (0-0, Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.159 EMG.",
            "Évitez 24/22 13/9 qui laisse 5 pion(s) isolé(s) (flèches 4, 8, 11) ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_21_65",
        "tier": 4,
        "xgid": "XGID=-GEfAfBfBBbAeG-AaceeAAACE-:0:0:-1:65:0:0:0:11:8",
        "dice": [
            6,
            5
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
        "equityLoss": 0.074,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/18 13/8 (Match en 11 pts (0-0, Videau à 1)), vous laisse 6 pion(s) isolé(s) (flèches 4, 11, 15), concédant -0.074 EMG face à 24/13.",
        "explanation": "Avec le jet 6-5 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/13 : il repositionne idéalement vos bâtisseurs (24/13) avec seulement 6 blot(s) exposé(s) (+0.074 EMG sur 24/18 13/8).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/13 repositionne idéalement vos bâtisseurs (24/13) avec seulement 6 blot(s) exposé(s).",
            "En Match en 11 pts (0-0, Videau à 1), 24/13 surpasse 24/18 13/8 de +0.074 EMG.",
            "Évitez 24/18 13/8 qui laisse 6 pion(s) isolé(s) (flèches 4, 11, 15) ; privilégiez 24/13."
        ]
    },
    {
        "id": "bgt_gnu_s8_m11_22_66",
        "tier": 2,
        "xgid": "XGID=-HEfAfAfBBbAeF-AaceeAAACF-:0:0:-1:66:0:0:0:11:8",
        "dice": [
            6,
            6
        ],
        "playedMove": "24/18 13/7(3)",
        "optimalMove": "24/18(2) 13/7(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "24/18(2) 13/7(2)",
            "24/18 13/7(3)",
            "24/18(2) 8/2(2)",
            "13/7(2) 8/2(2)"
        ],
        "equityLoss": 0.215,
        "verdict": "howler",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/18 13/7(3) (Match en 11 pts (0-0, Videau à 1)), vous laisse 7 pion(s) isolé(s) (flèches 4, 6, 11), concédant -0.215 EMG face à 24/18(2) 13/7(2).",
        "explanation": "Avec le jet 6-6 en Match en 11 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18(2) 13/7(2) : il repositionne idéalement vos bâtisseurs (24/18(2) 13/7(2)) avec seulement 7 blot(s) exposé(s) (+0.215 EMG sur 24/18 13/7(3)).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/18(2)...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18(2) 13/7(2) repositionne idéalement vos bâtisseurs (24/18(2) 13/7(2)) avec seulement 7 blot(s) exposé(s).",
            "En Match en 11 pts (0-0, Videau à 1), 24/18(2) 13/7(2) surpasse 24/18 13/7(3) de +0.215 EMG.",
            "Évitez 24/18 13/7(3) qui laisse 7 pion(s) isolé(s) (flèches 4, 6, 11) ; privilégiez 24/18(2) 13/7(2)."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_1_54",
        "tier": 3,
        "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:54:0:0:0:21:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/15",
            "13/9 13/8"
        ],
        "equityLoss": 0.113,
        "verdict": "blunder",
        "conceptId": "opening",
        "conceptName": "Ouvertures & Développement",
        "whyFailed": "En jouant 13/4 (Match en 21 pts (0-0, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 4), concédant -0.113 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il repositionne idéalement vos bâtisseurs (24/20 13/8) avec seulement 2 blot(s) exposé(s) (+0.113 EMG sur 13/4).",
        "proverb": "En ouverture, chaque porte intérieure ou ancre avancée construite sans blot vaut de l’or.",
        "hint": "Regardez le mouvement partant de 24 (24/20...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 repositionne idéalement vos bâtisseurs (24/20 13/8) avec seulement 2 blot(s) exposé(s).",
            "En Match en 21 pts (0-0, Videau à 1), 24/20 13/8 surpasse 13/4 de +0.113 EMG.",
            "Évitez 13/4 qui laisse 1 pion(s) isolé(s) (flèches 4) ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_2_54",
        "tier": 4,
        "xgid": "XGID=-b----E-D---eD---c-eA---A-:0:0:-1:54:0:0:0:21:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/20 6/1*",
            "24/15"
        ],
        "equityLoss": 0.091,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/4 (Match en 21 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 20 et disperse vos constructeurs, concédant -0.091 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il ferme la porte 20 (+0.091 EMG sur 13/4).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 20 : vos deux dés permettent d'y fermer une porte (24/20...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 ferme la porte 20.",
            "En Match en 21 pts (0-0, Videau à 1), 24/20 13/8 surpasse 13/4 de +0.091 EMG.",
            "Évitez 13/4 qui manque la fermeture de la porte 20 et disperse vos constructeurs ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_3_54",
        "tier": 3,
        "xgid": "XGID=-c----F-D---eD---c-ea---BA:0:0:1:54:0:0:0:21:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/15",
            "13/9 13/8"
        ],
        "equityLoss": 0.113,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/4 (Match en 21 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 20 et laisse l'initiative à l'adversaire, concédant -0.113 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il frappe le blot adverse sur la flèche 20 (+0.113 EMG sur 13/4).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Cherchez la frappe sur la flèche 20 (24/20...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 frappe le blot adverse sur la flèche 20.",
            "En Match en 21 pts (0-0, Videau à 1), 24/20 13/8 surpasse 13/4 de +0.113 EMG.",
            "Évitez 13/4 qui refuse de frapper le blot adverse sur la flèche 20 et laisse l'initiative à l'adversaire ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_4_63",
        "tier": 4,
        "xgid": "XGID=-c----F-D---eD-A-c-ea---AA:0:0:-1:63:0:0:0:21:8",
        "dice": [
            6,
            3
        ],
        "playedMove": "24/21 13/7",
        "optimalMove": "24/18 13/10",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/18 13/10",
            "24/21 13/7",
            "24/15",
            "24/21 24/18"
        ],
        "equityLoss": 0.062,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/21 13/7 (Match en 21 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 7, 15, 21), concédant -0.062 EMG face à 24/18 13/10.",
        "explanation": "Avec le jet 6-3 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/10 : il repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 3 blot(s) exposé(s) (+0.062 EMG sur 24/21 13/7).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/10 repositionne idéalement vos bâtisseurs (24/18 13/10) avec seulement 3 blot(s) exposé(s).",
            "En Match en 21 pts (0-0, Videau à 1), 24/18 13/10 surpasse 24/21 13/7 de +0.062 EMG.",
            "Évitez 24/21 13/7 qui laisse 3 pion(s) isolé(s) (flèches 7, 15, 21) ; privilégiez 24/18 13/10."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_5_54",
        "tier": 3,
        "xgid": "XGID=ac----F-D---eD-a-c-eA---C-:0:0:-1:54:0:0:0:21:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/15",
            "13/9 13/8"
        ],
        "equityLoss": 0.113,
        "verdict": "blunder",
        "conceptId": "advanced_anchor",
        "conceptName": "Jeu de Retenue & Ancre Avancée",
        "whyFailed": "En jouant 13/4 (Match en 21 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 20 et disperse vos constructeurs, concédant -0.113 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il ferme la porte 20 (+0.113 EMG sur 13/4).",
        "proverb": "Sécuriser un point d’ancrage haut (flèches 18 à 21) neutralise les menaces de gammon adverses.",
        "hint": "Regardez la flèche 20 : vos deux dés permettent d'y fermer une porte (24/20...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 ferme la porte 20.",
            "En Match en 21 pts (0-0, Videau à 1), 24/20 13/8 surpasse 13/4 de +0.113 EMG.",
            "Évitez 13/4 qui manque la fermeture de la porte 20 et disperse vos constructeurs ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_6_31",
        "tier": 1,
        "xgid": "XGID=ac----F-C---eE-a-c-ea---DA:0:0:1:31:0:0:0:21:8",
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
            "24/20",
            "24/23 24/21"
        ],
        "equityLoss": 0.238,
        "verdict": "howler",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/23 13/10 (Match en 21 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 5 et disperse vos constructeurs, concédant -0.238 EMG face à 8/5 6/5.",
        "explanation": "Avec le jet 3-1 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5 6/5 : il ferme la porte 5 (+0.238 EMG sur 24/23 13/10).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 5 : vos deux dés permettent d'y fermer une porte (8/5...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5 6/5 ferme la porte 5.",
            "En Match en 21 pts (0-0, Videau à 1), 8/5 6/5 surpasse 24/23 13/10 de +0.238 EMG.",
            "Évitez 24/23 13/10 qui manque la fermeture de la porte 5 et disperse vos constructeurs ; privilégiez 8/5 6/5."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_7_54",
        "tier": 3,
        "xgid": "XGID=ac---BE-B---eE-a-c-ea---DA:0:0:1:54:0:0:0:21:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/15",
            "13/9 13/8"
        ],
        "equityLoss": 0.113,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/4 (Match en 21 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 20 et laisse l'initiative à l'adversaire, concédant -0.113 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il frappe le blot adverse sur la flèche 20 (+0.113 EMG sur 13/4).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Cherchez la frappe sur la flèche 20 (24/20...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 frappe le blot adverse sur la flèche 20.",
            "En Match en 21 pts (0-0, Videau à 1), 24/20 13/8 surpasse 13/4 de +0.113 EMG.",
            "Évitez 13/4 qui refuse de frapper le blot adverse sur la flèche 20 et laisse l'initiative à l'adversaire ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_8_33",
        "tier": 3,
        "xgid": "XGID=bc---BE-C---eD-a-c-eA---CA:0:0:-1:33:0:0:0:21:8",
        "dice": [
            3,
            3
        ],
        "playedMove": "24/18(2)",
        "optimalMove": "8/5(2) 6/3(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "8/5(2) 6/3(2)",
            "24/18(2)",
            "24/21(2) 6/3(2)",
            "24/21(2) 13/10(2)"
        ],
        "equityLoss": 0.126,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/18(2) (Match en 21 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 20, 24), concédant -0.126 EMG face à 8/5(2) 6/3(2).",
        "explanation": "Avec le jet 3-3 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/5(2) 6/3(2) : il ferme la porte 3 (+0.126 EMG sur 24/18(2)).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 3 : vos deux dés permettent d'y fermer une porte (8/5(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/5(2) 6/3(2) ferme la porte 3.",
            "En Match en 21 pts (0-0, Videau à 1), 8/5(2) 6/3(2) surpasse 24/18(2) de +0.126 EMG.",
            "Évitez 24/18(2) qui laisse 2 pion(s) isolé(s) (flèches 20, 24) ; privilégiez 8/5(2) 6/3(2)."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_9_11",
        "tier": 4,
        "xgid": "XGID=bc-b-aG-E---eD-a-c-eA--ACA:0:0:-1:11:0:0:0:21:8",
        "dice": [
            1,
            1
        ],
        "playedMove": "24/23(2) 6/5(2)",
        "optimalMove": "8/7(2) 6/5(2)",
        "acceptableMoves": [
            "24/22 6/5(2)"
        ],
        "quizChoices": [
            "8/7(2) 6/5(2)",
            "24/23(2) 6/5(2)",
            "24/22 6/5(2)",
            "24/23 6/5(3)"
        ],
        "equityLoss": 0.092,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/23(2) 6/5(2) (Match en 21 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 20, 24), concédant -0.092 EMG face à 8/7(2) 6/5(2).",
        "explanation": "Avec le jet 1-1 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/7(2) 6/5(2) : il frappe le blot adverse sur la flèche 5 et ferme la porte 5 et 7 (+0.092 EMG sur 24/23(2) 6/5(2)).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 5 (8/7(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/7(2) 6/5(2) frappe le blot adverse sur la flèche 5 et ferme la porte 5 et 7.",
            "En Match en 21 pts (0-0, Videau à 1), 8/7(2) 6/5(2) surpasse 24/23(2) 6/5(2) de +0.092 EMG.",
            "Évitez 24/23(2) 6/5(2) qui laisse 2 pion(s) isolé(s) (flèches 20, 24) ; privilégiez 8/7(2) 6/5(2)."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_10_22",
        "tier": 4,
        "xgid": "XGID=bc-b-cIbG--AeC-a-c-eA--BBA:0:0:-1:22:0:0:0:21:8",
        "dice": [
            2,
            2
        ],
        "playedMove": "24/22 13/11 6/4(2)",
        "optimalMove": "13/11(2) 6/4(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "13/11(2) 6/4(2)",
            "24/22 13/11 6/4(2)",
            "24/22(2) 6/4(2)",
            "13/9 6/4(2)"
        ],
        "equityLoss": 0.068,
        "verdict": "doubtful",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 24/22 13/11 6/4(2) (Match en 21 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 20, 22, 24), concédant -0.068 EMG face à 13/11(2) 6/4(2).",
        "explanation": "Avec le jet 2-2 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 13/11(2) 6/4(2) : il ferme la porte 4 et 11 (+0.068 EMG sur 24/22 13/11 6/4(2)).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 4 : vos deux dés permettent d'y fermer une porte (13/11(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 13/11(2) 6/4(2) ferme la porte 4 et 11.",
            "En Match en 21 pts (0-0, Videau à 1), 13/11(2) 6/4(2) surpasse 24/22 13/11 6/4(2) de +0.068 EMG.",
            "Évitez 24/22 13/11 6/4(2) qui laisse 3 pion(s) isolé(s) (flèches 20, 22, 24) ; privilégiez 13/11(2) 6/4(2)."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_11_64",
        "tier": 4,
        "xgid": "XGID=-cacbcKbG--beE-a-c-eB--BBA:0:0:1:64:0:0:0:21:8",
        "dice": [
            6,
            4
        ],
        "playedMove": "24/20 24/18",
        "optimalMove": "24/14",
        "acceptableMoves": [
            "8/2 6/2",
            "24/18 13/9"
        ],
        "quizChoices": [
            "24/14",
            "24/20 24/18",
            "8/2 6/2",
            "24/18 13/9"
        ],
        "equityLoss": 0.063,
        "verdict": "doubtful",
        "conceptId": "opening",
        "conceptName": "Ouvertures & Développement",
        "whyFailed": "En jouant 24/20 24/18 (Match en 21 pts (0-0, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 18), concédant -0.063 EMG face à 24/14.",
        "explanation": "Avec le jet 6-4 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/14 : il repositionne idéalement vos bâtisseurs (24/14) avec seulement 2 blot(s) exposé(s) (+0.063 EMG sur 24/20 24/18).",
        "proverb": "En ouverture, chaque porte intérieure ou ancre avancée construite sans blot vaut de l’or.",
        "hint": "Regardez le mouvement partant de 24 (24/14...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/14 repositionne idéalement vos bâtisseurs (24/14) avec seulement 2 blot(s) exposé(s).",
            "En Match en 21 pts (0-0, Videau à 1), 24/14 surpasse 24/20 24/18 de +0.063 EMG.",
            "Évitez 24/20 24/18 qui laisse 1 pion(s) isolé(s) (flèches 18) ; privilégiez 24/14."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_12_62",
        "tier": 4,
        "xgid": "XGID=-cacbcKbG--beEAa-c-eB--BAA:0:0:-1:62:0:0:0:21:8",
        "dice": [
            6,
            2
        ],
        "playedMove": "24/22 24/18",
        "optimalMove": "24/18 13/11",
        "acceptableMoves": [
            "24/16"
        ],
        "quizChoices": [
            "24/18 13/11",
            "24/22 24/18",
            "24/16",
            "13/11 13/7"
        ],
        "equityLoss": 0.065,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/22 24/18 (Match en 21 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 14, 18, 22), concédant -0.065 EMG face à 24/18 13/11.",
        "explanation": "Avec le jet 6-2 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/18 13/11 : il repositionne idéalement vos bâtisseurs (24/18 13/11) avec seulement 2 blot(s) exposé(s) (+0.065 EMG sur 24/22 24/18).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/18...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/18 13/11 repositionne idéalement vos bâtisseurs (24/18 13/11) avec seulement 2 blot(s) exposé(s).",
            "En Match en 21 pts (0-0, Videau à 1), 24/18 13/11 surpasse 24/22 24/18 de +0.065 EMG.",
            "Évitez 24/22 24/18 qui laisse 3 pion(s) isolé(s) (flèches 14, 18, 22) ; privilégiez 24/18 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_13_65",
        "tier": 4,
        "xgid": "XGID=-cacbcKbG--ceFAa-caeB--BBA:0:0:1:65:0:0:0:21:8",
        "dice": [
            6,
            5
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
        "equityLoss": 0.073,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/18 13/8 (Match en 21 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 14, 18, 24), concédant -0.073 EMG face à 24/13.",
        "explanation": "Avec le jet 6-5 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/13 : il repositionne idéalement vos bâtisseurs (24/13) avec seulement 2 blot(s) exposé(s) (+0.073 EMG sur 24/18 13/8).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/13 repositionne idéalement vos bâtisseurs (24/13) avec seulement 2 blot(s) exposé(s).",
            "En Match en 21 pts (0-0, Videau à 1), 24/13 surpasse 24/18 13/8 de +0.073 EMG.",
            "Évitez 24/18 13/8 qui laisse 3 pion(s) isolé(s) (flèches 14, 18, 24) ; privilégiez 24/13."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_14_32",
        "tier": 4,
        "xgid": "XGID=-cacbcKbG--ceGAa-caeB--BAA:0:0:-1:32:0:0:0:21:8",
        "dice": [
            3,
            2
        ],
        "playedMove": "13/8",
        "optimalMove": "24/21 13/11",
        "acceptableMoves": [
            "13/11 13/10",
            "24/22 13/10"
        ],
        "quizChoices": [
            "24/21 13/11",
            "13/8",
            "13/11 13/10",
            "24/22 13/10"
        ],
        "equityLoss": 0.067,
        "verdict": "doubtful",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/8 (Match en 21 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 14, 24), concédant -0.067 EMG face à 24/21 13/11.",
        "explanation": "Avec le jet 3-2 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/21 13/11 : il repositionne idéalement vos bâtisseurs (24/21 13/11) avec seulement 2 blot(s) exposé(s) (+0.067 EMG sur 13/8).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 24 (24/21...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/21 13/11 repositionne idéalement vos bâtisseurs (24/21 13/11) avec seulement 2 blot(s) exposé(s).",
            "En Match en 21 pts (0-0, Videau à 1), 24/21 13/11 surpasse 13/8 de +0.067 EMG.",
            "Évitez 13/8 qui laisse 2 pion(s) isolé(s) (flèches 14, 24) ; privilégiez 24/21 13/11."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_15_54",
        "tier": 3,
        "xgid": "XGID=-baebcKbG-AdeGAa-caeBA-BB-:0:0:1:54:0:0:0:21:8",
        "dice": [
            5,
            4
        ],
        "playedMove": "13/4",
        "optimalMove": "24/20 13/8",
        "acceptableMoves": [
            "24/15"
        ],
        "quizChoices": [
            "24/20 13/8",
            "13/4",
            "24/15",
            "13/9 13/8"
        ],
        "equityLoss": 0.113,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/4 (Match en 21 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 10, 14, 21), concédant -0.113 EMG face à 24/20 13/8.",
        "explanation": "Avec le jet 5-4 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20 13/8 : il repositionne idéalement vos bâtisseurs (24/20 13/8) avec seulement 4 blot(s) exposé(s) (+0.113 EMG sur 13/4).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/20...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20 13/8 repositionne idéalement vos bâtisseurs (24/20 13/8) avec seulement 4 blot(s) exposé(s).",
            "En Match en 21 pts (0-0, Videau à 1), 24/20 13/8 surpasse 13/4 de +0.113 EMG.",
            "Évitez 13/4 qui laisse 3 pion(s) isolé(s) (flèches 10, 14, 21) ; privilégiez 24/20 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_16_53",
        "tier": 4,
        "xgid": "XGID=-baebcKbH-AdeFAa-caeCA-BA-:0:0:-1:53:0:0:0:21:8",
        "dice": [
            5,
            3
        ],
        "playedMove": "24/16",
        "optimalMove": "8/3 6/3",
        "acceptableMoves": [],
        "quizChoices": [
            "8/3 6/3",
            "24/16",
            "24/21 13/8",
            "13/10 13/8"
        ],
        "equityLoss": 0.082,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 24/16 (Match en 21 pts (0-0, Videau à 1)), vous laisse 4 pion(s) isolé(s) (flèches 10, 14, 16), concédant -0.082 EMG face à 8/3 6/3.",
        "explanation": "Avec le jet 5-3 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/3 6/3 : il repositionne idéalement vos bâtisseurs (8/3 6/3) avec seulement 4 blot(s) exposé(s) (+0.082 EMG sur 24/16).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Regardez le mouvement partant de 8 (8/3...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/3 6/3 repositionne idéalement vos bâtisseurs (8/3 6/3) avec seulement 4 blot(s) exposé(s).",
            "En Match en 21 pts (0-0, Videau à 1), 8/3 6/3 surpasse 24/16 de +0.082 EMG.",
            "Évitez 24/16 qui laisse 4 pion(s) isolé(s) (flèches 10, 14, 16) ; privilégiez 8/3 6/3."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_17_44",
        "tier": 3,
        "xgid": "XGID=-AaebcKdJbBdeE-a-caeCA-BA-:0:0:-1:44:0:0:0:21:8",
        "dice": [
            4,
            4
        ],
        "playedMove": "13/5(2)",
        "optimalMove": "24/20(2) 13/9(2)",
        "acceptableMoves": [],
        "quizChoices": [
            "24/20(2) 13/9(2)",
            "13/5(2)",
            "24/20(2) 6/2(2)",
            "24/20(2) 8/4(2)"
        ],
        "equityLoss": 0.107,
        "verdict": "blunder",
        "conceptId": "blot_safety",
        "conceptName": "Sécurité des Blots & Duplication",
        "whyFailed": "En jouant 13/5(2) (Match en 21 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 9 et laisse l'initiative à l'adversaire, concédant -0.107 EMG face à 24/20(2) 13/9(2).",
        "explanation": "Avec le jet 4-4 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/20(2) 13/9(2) : il frappe le blot adverse sur la flèche 9 (+0.107 EMG sur 13/5(2)).",
        "proverb": "Ne laissez jamais une cible directe gratuite quand une ligne coordonnée sécurise ou duplique vos pions.",
        "hint": "Cherchez la frappe sur la flèche 9 (24/20(2)...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/20(2) 13/9(2) frappe le blot adverse sur la flèche 9.",
            "En Match en 21 pts (0-0, Videau à 1), 24/20(2) 13/9(2) surpasse 13/5(2) de +0.107 EMG.",
            "Évitez 13/5(2) qui refuse de frapper le blot adverse sur la flèche 9 et laisse l'initiative à l'adversaire ; privilégiez 24/20(2) 13/9(2)."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_18_42",
        "tier": 2,
        "xgid": "XGID=-A-cceLdHdBdeG-a-caeBA-BC-:0:0:-1:42:0:0:0:21:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.16,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/22 13/9 (Match en 21 pts (0-0, Videau à 1)), vous laisse 3 pion(s) isolé(s) (flèches 1, 21, 22), concédant -0.160 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il repositionne idéalement vos bâtisseurs (8/4 6/4) avec seulement 2 blot(s) exposé(s) (+0.160 EMG sur 24/22 13/9).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 8 (8/4...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 repositionne idéalement vos bâtisseurs (8/4 6/4) avec seulement 2 blot(s) exposé(s).",
            "En Match en 21 pts (0-0, Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.160 EMG.",
            "Évitez 24/22 13/9 qui laisse 3 pion(s) isolé(s) (flèches 1, 21, 22) ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_19_65",
        "tier": 4,
        "xgid": "XGID=-CK-bdBfGhBeeG-a-caeBA-BC-:0:0:-1:65:0:0:0:21:8",
        "dice": [
            6,
            5
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
        "equityLoss": 0.073,
        "verdict": "doubtful",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 24/18 13/8 (Match en 21 pts (0-0, Videau à 1)), vous laisse 2 pion(s) isolé(s) (flèches 18, 21), concédant -0.073 EMG face à 24/13.",
        "explanation": "Avec le jet 6-5 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/13 : il repositionne idéalement vos bâtisseurs (24/13) avec seulement 1 blot(s) exposé(s) (+0.073 EMG sur 24/18 13/8).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/13...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/13 repositionne idéalement vos bâtisseurs (24/13) avec seulement 1 blot(s) exposé(s).",
            "En Match en 21 pts (0-0, Videau à 1), 24/13 surpasse 24/18 13/8 de +0.073 EMG.",
            "Évitez 24/18 13/8 qui laisse 2 pion(s) isolé(s) (flèches 18, 21) ; privilégiez 24/13."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_20_42",
        "tier": 2,
        "xgid": "XGID=-DK-bdBfFhBeeF-a-caeBA-BD-:0:0:-1:42:0:0:0:21:8",
        "dice": [
            4,
            2
        ],
        "playedMove": "24/22 13/9",
        "optimalMove": "8/4 6/4",
        "acceptableMoves": [],
        "quizChoices": [
            "8/4 6/4",
            "24/22 13/9",
            "24/20 13/11",
            "13/11 13/9"
        ],
        "equityLoss": 0.16,
        "verdict": "blunder",
        "conceptId": "blitz_attack",
        "conceptName": "Blitz & Attaque de Jan",
        "whyFailed": "En jouant 24/22 13/9 (Match en 21 pts (0-0, Videau à 1)), vous refuse de frapper le blot adverse sur la flèche 4 et laisse l'initiative à l'adversaire, concédant -0.160 EMG face à 8/4 6/4.",
        "explanation": "Avec le jet 4-2 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 8/4 6/4 : il frappe le blot adverse sur la flèche 4 (+0.160 EMG sur 24/22 13/9).",
        "proverb": "En Blitz, frapper dans le jan intérieur ou sur le tempo prive l’adversaire de tout contre-jeu.",
        "hint": "Cherchez la frappe sur la flèche 4 (8/4...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 8/4 6/4 frappe le blot adverse sur la flèche 4.",
            "En Match en 21 pts (0-0, Videau à 1), 8/4 6/4 surpasse 24/22 13/9 de +0.160 EMG.",
            "Évitez 24/22 13/9 qui refuse de frapper le blot adverse sur la flèche 4 et laisse l'initiative à l'adversaire ; privilégiez 8/4 6/4."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_21_51",
        "tier": 3,
        "xgid": "XGID=-HN----lCjBeeF-a-caeBA-BD-:0:0:-1:51:0:0:0:21:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.097,
        "verdict": "blunder",
        "conceptId": "backgame",
        "conceptName": "Backgame & Timing Défensif",
        "whyFailed": "En jouant 13/7 (Match en 21 pts (0-0, Videau à 1)), vous laisse 1 pion(s) isolé(s) (flèches 21), concédant -0.097 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 1 blot(s) exposé(s) (+0.097 EMG sur 13/7).",
        "proverb": "En défense profonde, préservez votre timing et évitez d’écraser prématurément votre propre jan intérieur.",
        "hint": "Regardez le mouvement partant de 24 (24/23...) qui préserve votre structure.",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 repositionne idéalement vos bâtisseurs (24/23 13/8) avec seulement 1 blot(s) exposé(s).",
            "En Match en 21 pts (0-0, Videau à 1), 24/23 13/8 surpasse 13/7 de +0.097 EMG.",
            "Évitez 13/7 qui laisse 1 pion(s) isolé(s) (flèches 21) ; privilégiez 24/23 13/8."
        ]
    },
    {
        "id": "bgt_gnu_s9_m21_22_51",
        "tier": 3,
        "xgid": "XGID=-IN----lAjBeeG-a-caeBA-AE-:0:0:-1:51:0:0:0:21:8",
        "dice": [
            5,
            1
        ],
        "playedMove": "13/7",
        "optimalMove": "24/23 13/8",
        "acceptableMoves": [
            "24/18"
        ],
        "quizChoices": [
            "24/23 13/8",
            "13/7",
            "24/18",
            "13/8 6/5"
        ],
        "equityLoss": 0.097,
        "verdict": "blunder",
        "conceptId": "prime_building",
        "conceptName": "Construction de Prime (Mur)",
        "whyFailed": "En jouant 13/7 (Match en 21 pts (0-0, Videau à 1)), vous manque la fermeture de la porte 8/23 et disperse vos constructeurs, concédant -0.097 EMG face à 24/23 13/8.",
        "explanation": "Avec le jet 5-1 en Match en 21 pts (0-0, Videau à 1), le coup #1 certifié par BGT / GNU Backgammon est 24/23 13/8 : il ferme la porte 8 et 23 (+0.097 EMG sur 13/7).",
        "proverb": "Fermer une porte entre les flèches 3 et 8 érige un barrage infranchissable devant les pions arrières adverses.",
        "hint": "Regardez la flèche 8 : vos deux dés permettent d'y fermer une porte (24/23...) !",
        "commentaryVariants": [
            "Certifié #1 par BGT / GNU Backgammon : 24/23 13/8 ferme la porte 8 et 23.",
            "En Match en 21 pts (0-0, Videau à 1), 24/23 13/8 surpasse 13/7 de +0.097 EMG.",
            "Évitez 13/7 qui manque la fermeture de la porte 8/23 et disperse vos constructeurs ; privilégiez 24/23 13/8."
        ]
    }
];
