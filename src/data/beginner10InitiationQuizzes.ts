export interface BeginnerInitiationQuiz {
  id: number;
  linkedEpisodeId: number;
  titleFr: string;
  titleEn: string;
  questionFr: string;
  questionEn: string;
  dice: [number, number];
  boardHighlights: { points?: number[]; bar?: boolean; cube?: boolean };
  options: {
    id: string;
    labelFr: string;
    labelEn: string;
    isCorrect: boolean;
    explanationFr: string;
    explanationEn: string;
  }[];
  pointsReward: number; // 200
}

export const BEGINNER_10_INITIATION_QUIZZES: BeginnerInitiationQuiz[] = [
  // ÉPISODE 1 (Quiz 1 & 2)
  {
    id: 1,
    linkedEpisodeId: 1,
    titleFr: "Quiz 1/10 : Le Sens de Circulation",
    titleEn: "Quiz 1/10: Direction of Play",
    questionFr: "Dans quel sens vos pions blancs voyagent-ils sur le plateau ?",
    questionEn: "In which direction do your white checkers travel around the board?",
    dice: [3, 1],
    boardHighlights: { points: [24, 1] },
    options: [
      {
        id: "A",
        labelFr: "De la flèche 24 vers votre Jan intérieur (flèches 1 à 6)",
        labelEn: "From point 24 toward your home board (points 1 to 6)",
        isCorrect: true,
        explanationFr: "Exact ! Les blancs avancent toujours en fer à cheval vers les petites flèches (1 à 6).",
        explanationEn: "Correct! White checkers always travel in a horseshoe towards points 1 to 6.",
      },
      {
        id: "B",
        labelFr: "De la flèche 1 vers la flèche 24",
        labelEn: "From point 1 toward point 24",
        isCorrect: false,
        explanationFr: "Non, c'est le sens de l'adversaire noir !",
        explanationEn: "No, that is your black opponent's direction!",
      },
      {
        id: "C",
        labelFr: "Ils ne bougent que dans leur propre camp",
        labelEn: "They only move within their home board",
        isCorrect: false,
        explanationFr: "Tous les 15 pions doivent traverser tout le plateau.",
        explanationEn: "All 15 checkers must journey across the entire board.",
      },
    ],
    pointsReward: 200,
  },
  {
    id: 2,
    linkedEpisodeId: 1,
    titleFr: "Quiz 2/10 : La Condition de Victoire",
    titleEn: "Quiz 2/10: Victory Condition",
    questionFr: "Quand avez-vous le droit de commencer à sortir (bear-off) vos pions du plateau ?",
    questionEn: "When are you allowed to start bearing off your checkers?",
    dice: [6, 4],
    boardHighlights: { points: [1, 2, 3, 4, 5, 6] },
    options: [
      {
        id: "A",
        labelFr: "Dès que vous obtenez un double 6",
        labelEn: "As soon as you roll double 6s",
        isCorrect: false,
        explanationFr: "Le score des dés n'autorise pas la sortie si des pions sont encore dehors.",
        explanationEn: "Dice value does not permit bearing off if checkers remain outside.",
      },
      {
        id: "B",
        labelFr: "Dès que l'intégralité de vos 15 pions se trouve dans les flèches 1 à 6",
        labelEn: "Only when all 15 of your checkers have reached points 1 to 6",
        isCorrect: true,
        explanationFr: "Bravo ! Les 15 pions doivent obligatoirement être à la maison.",
        explanationEn: "Bravo! All 15 checkers must be home before bearing off.",
      },
      {
        id: "C",
        labelFr: "Dès qu'un pion adverse est envoyé sur la barre",
        labelEn: "As soon as an opponent checker is sent to the bar",
        isCorrect: false,
        explanationFr: "Frapper un pion adverse ne permet pas de sortir ses pions prématurément.",
        explanationEn: "Hitting an opponent checker does not let you bear off early.",
      },
    ],
    pointsReward: 200,
  },
  // ÉPISODE 2 (Quiz 3 & 4)
  {
    id: 3,
    linkedEpisodeId: 2,
    titleFr: "Quiz 3/10 : La Frappe d'un Pion Isolé (Blot)",
    titleEn: "Quiz 3/10: Hitting an Isolated Checker (Blot)",
    questionFr: "L'adversaire a laissé un seul pion noir sur la flèche 20. Vous jouez 2 et atterrissez dessus. Que se passe-t-il ?",
    questionEn: "The opponent left a single checker on point 20. You roll a 2 and land on it. What happens?",
    dice: [2, 1],
    boardHighlights: { points: [20], bar: true },
    options: [
      {
        id: "A",
        labelFr: "Le pion noir est frappé et envoyé sur la barre centrale !",
        labelEn: "The black checker is hit and sent directly to the bar!",
        isCorrect: true,
        explanationFr: "Coup gagnant ! Un pion seul (blot) est capturé et doit repartir depuis la barre.",
        explanationEn: "Winning move! A single checker (blot) is hit and must restart from the bar.",
      },
      {
        id: "B",
        labelFr: "Rien ne se passe, vous devez contourner la case",
        labelEn: "Nothing happens, you must bypass the point",
        isCorrect: false,
        explanationFr: "Au Backgammon, un pion seul ne bloque personne et se fait frapper.",
        explanationEn: "In Backgammon, a solo blot never blocks and gets hit.",
      },
      {
        id: "C",
        labelFr: "Le pion noir est définitivement éliminé de la partie",
        labelEn: "The black checker is permanently removed from the match",
        isCorrect: false,
        explanationFr: "Les pions ne sont jamais éliminés : ils rentrent à nouveau par le camp adverse.",
        explanationEn: "Checkers are never permanently eliminated: they re-enter from the bar.",
      },
    ],
    pointsReward: 200,
  },
  {
    id: 4,
    linkedEpisodeId: 2,
    titleFr: "Quiz 4/10 : La Sortie de la Barre",
    titleEn: "Quiz 4/10: Entering from the Bar",
    questionFr: "Vous avez un pion blanc sur la barre centrale. Que devez-vous faire avant tout autre mouvement ?",
    questionEn: "You have a white checker on the bar. What must you do before any other move?",
    dice: [4, 3],
    boardHighlights: { bar: true, points: [21, 22] },
    options: [
      {
        id: "A",
        labelFr: "Faire rentrer impérativement le pion de la barre dans le camp adverse (flèches 19 à 24)",
        labelEn: "Must enter the checker from the bar into the opponent board (points 19 to 24)",
        isCorrect: true,
        explanationFr: "Règle absolue : tant qu'un pion est sur la barre, aucun autre pion ne peut bouger !",
        explanationEn: "Golden rule: while on the bar, no other checkers may move!",
      },
      {
        id: "B",
        labelFr: "Sortir d'abord vos pions de votre maison",
        labelEn: "Bear off checkers from your home board first",
        isCorrect: false,
        explanationFr: "Interdit ! La barre a la priorité absolue sur tous les coups.",
        explanationEn: "Forbidden! The bar has absolute priority over all checker moves.",
      },
    ],
    pointsReward: 200,
  },
  // ÉPISODE 3 (Quiz 5 & 6)
  {
    id: 5,
    linkedEpisodeId: 3,
    titleFr: "Quiz 5/10 : La Porte d'Or (Flèche 5)",
    titleEn: "Quiz 5/10: The Golden 5-Point",
    questionFr: "Pourquoi la flèche 5 est-elle considérée comme la plus précieuse du plateau ?",
    questionEn: "Why is the 5-point considered the most valuable point on the board?",
    dice: [3, 1],
    boardHighlights: { points: [5] },
    options: [
      {
        id: "A",
        labelFr: "Elle bloque la fuite des pions adverses et fortifie votre maison",
        labelEn: "It traps opponent back checkers and anchors your home board",
        isCorrect: true,
        explanationFr: "Parfait ! La flèche 5 contrôle le centre et constitue la clé de voûte de toute attaque.",
        explanationEn: "Perfect! Point 5 commands the board and anchors your prime.",
      },
      {
        id: "B",
        labelFr: "Elle donne 5 points bonus au classement",
        labelEn: "It awards 5 bonus rating points",
        isCorrect: false,
        explanationFr: "Non, les flèches n'attribuent pas de points de score direct.",
        explanationEn: "Points on the board do not grant game score directly.",
      },
    ],
    pointsReward: 200,
  },
  {
    id: 6,
    linkedEpisodeId: 3,
    titleFr: "Quiz 6/10 : Le Mur Infranchissable (Prime de 6)",
    titleEn: "Quiz 6/10: The Unbreakable 6-Prime",
    questionFr: "Combien de portes consécutives faut-il aligner pour qu'un pion adverse soit totalement bloqué, quel que soit son dé ?",
    questionEn: "How many consecutive points are required to completely block an opponent checker from jumping over?",
    dice: [6, 6],
    boardHighlights: { points: [3, 4, 5, 6, 7, 8] },
    options: [
      {
        id: "A",
        labelFr: "6 portes d'affilée (un dé classique n'allant que de 1 à 6)",
        labelEn: "6 consecutive points (since a die maxes out at 6)",
        isCorrect: true,
        explanationFr: "Brillant ! Le Prime de 6 est la barrière suprême : aucun pion ne peut franchir 6 cases en 1 dé.",
        explanationEn: "Brilliant! A 6-prime is unbreakable: no single die roll can leap over 6 points.",
      },
      {
        id: "B",
        labelFr: "2 portes seulement",
        labelEn: "Only 2 points",
        isCorrect: false,
        explanationFr: "Un simple 3, 4, 5 ou 6 saute facilement par-dessus 2 portes.",
        explanationEn: "A roll of 3, 4, 5 or 6 can easily leap over 2 points.",
      },
    ],
    pointsReward: 200,
  },
  // ÉPISODE 4 (Quiz 7 & 8)
  {
    id: 7,
    linkedEpisodeId: 4,
    titleFr: "Quiz 7/10 : Le Dé Double",
    titleEn: "Quiz 7/10: Rolling Doubles",
    questionFr: "Vous obtenez un double 4 (🎲 4-4). Combien de fois pouvez-vous déplacer un pion de 4 cases ?",
    questionEn: "You roll double 4s (🎲 4-4). How many times can you move a checker 4 points?",
    dice: [4, 4],
    boardHighlights: { points: [13, 9, 5, 1] },
    options: [
      {
        id: "A",
        labelFr: "4 fois le chiffre 4 (soit 16 cases au total !)",
        labelEn: "4 times the number 4 (16 pips total!)",
        isCorrect: true,
        explanationFr: "Exact ! En cas de double, vous jouez 4 fois la valeur indiquée.",
        explanationEn: "Exact! Rolling doubles awards 4 moves of that value.",
      },
      {
        id: "B",
        labelFr: "2 fois seulement (comme un lancer normal)",
        labelEn: "2 times only (like a standard roll)",
        isCorrect: false,
        explanationFr: "Au Backgammon, un double double vos mouvements et se joue 4 fois !",
        explanationEn: "In Backgammon, doubles grant 4 moves, not 2!",
      },
    ],
    pointsReward: 200,
  },
  {
    id: 8,
    linkedEpisodeId: 4,
    titleFr: "Quiz 8/10 : Sortie par le Haut (Case Vide)",
    titleEn: "Quiz 8/10: Bearing Off Higher Checkers",
    questionFr: "Tous vos pions sont sur les cases 1, 2 et 3. Vous lancez un 6. Que faites-vous ?",
    questionEn: "All your checkers are on points 1, 2 and 3. You roll a 6. What do you do?",
    dice: [6, 1],
    boardHighlights: { points: [1, 2, 3] },
    options: [
      {
        id: "A",
        labelFr: "Vous sortez un pion de la flèche la plus éloignée occupée (la case 3)",
        labelEn: "Bear off a checker from the highest occupied point (point 3)",
        isCorrect: true,
        explanationFr: "Règle officielle : si la flèche du dé est vide et qu'aucun pion n'est derrière, on sort le plus haut !",
        explanationEn: "Official rule: if that point is empty with no checkers behind, bear off the highest!",
      },
      {
        id: "B",
        labelFr: "Le dé 6 est perdu et vous passez votre tour",
        labelEn: "The 6 is lost and you pass your turn",
        isCorrect: false,
        explanationFr: "Faux ! On ne perd jamais un gros dé lors du bear-off si des pions peuvent sortir.",
        explanationEn: "Wrong! You never forfeit a higher die when bearing off.",
      },
    ],
    pointsReward: 200,
  },
  // ÉPISODE 5 (Quiz 9 & 10)
  {
    id: 9,
    linkedEpisodeId: 5,
    titleFr: "Quiz 9/10 : Le Rôle du Videau",
    titleEn: "Quiz 9/10: Role of the Doubling Cube",
    questionFr: "À quel moment exact avez-vous le droit de proposer le videau à votre adversaire ?",
    questionEn: "At what exact moment are you allowed to propose the doubling cube to your opponent?",
    dice: [0, 0],
    boardHighlights: { cube: true },
    options: [
      {
        id: "A",
        labelFr: "Au début de votre tour, avant d'avoir lancé les dés",
        labelEn: "At the start of your turn, before rolling the dice",
        isCorrect: true,
        explanationFr: "Parfait ! La proposition de videau se fait impérativement avant le lancer de dés (:00:).",
        explanationEn: "Perfect! Cube proposals must strictly take place before rolling dice (:00:).",
      },
      {
        id: "B",
        labelFr: "Après avoir vu le résultat de vos dés",
        labelEn: "After having seen your dice roll",
        isCorrect: false,
        explanationFr: "Interdit ! Vous ne pouvez pas doubler une fois que vous avez vu vos dés.",
        explanationEn: "Forbidden! You cannot double after discovering your dice.",
      },
    ],
    pointsReward: 200,
  },
  {
    id: 10,
    linkedEpisodeId: 5,
    titleFr: "Quiz 10/10 : Le Refus du Videau (Pass / Drop)",
    titleEn: "Quiz 10/10: Dropping the Cube",
    questionFr: "L'adversaire vous propose le videau à 2. Vous refusez (Drop / Pass). Quel est le résultat ?",
    questionEn: "The opponent offers the cube at 2. You refuse (Drop / Pass). What is the outcome?",
    dice: [0, 0],
    boardHighlights: { cube: true },
    options: [
      {
        id: "A",
        labelFr: "Vous perdez immédiatement la manche en concédant seulement 1 point",
        labelEn: "You immediately lose the game conceding only 1 point",
        isCorrect: true,
        explanationFr: "Exact ! Refuser le videau permet de limiter ses pertes à 1 point plutôt que d'en risquer 2.",
        explanationEn: "Exact! Dropping caps your loss at 1 point instead of risking 2.",
      },
      {
        id: "B",
        labelFr: "La manche continue normalement sans doubler",
        labelEn: "The game continues normally without doubling",
        isCorrect: false,
        explanationFr: "Si vous refusez, la partie s'arrête instantanément en faveur de l'adversaire.",
        explanationEn: "If you drop, the game ends instantly in favor of the opponent.",
      },
    ],
    pointsReward: 200,
  },
];

