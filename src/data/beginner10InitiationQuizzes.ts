/**
 * @file src/data/beginner10InitiationQuizzes.ts
 * @description Banque des 10 quiz d'initiation visuelle pour l'Académie Débutant.
 * Choix A, B, C équilibrés (65-80 car.), 1 seule ligne, zéro jargon, distribution équilibrée.
 * Strictement <= 400 lignes, 0 `any`.
 */

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
  // QUIZ 1 (Réponse B)
  {
    id: 1, linkedEpisodeId: 1, pointsReward: 200, dice: [3, 1], boardHighlights: {},
    titleFr: "Quiz 1/10 : Le Sens de Circulation",
    titleEn: "Quiz 1/10: Direction of Play",
    questionFr: "Quel chemin vos pions blancs doivent-ils suivre pour rentrer chez vous\u00A0?",
    questionEn: "Which path must your white checkers follow to reach your Home Board?",
    options: [
      {
        id: "A", isCorrect: false,
        labelFr: "Reculer directement vers le camp adverse situé en haut de l'échiquier",
        labelEn: "Move directly backwards toward the opponent camp at the top",
        explanationFr: "Non, c'est le sens de marche de votre adversaire !",
        explanationEn: "No, that is your opponent's direction of movement!",
      },
      {
        id: "B", isCorrect: true,
        labelFr: "Suivre le chemin en fer à cheval jusqu'à Votre Maison en bas à droite",
        labelEn: "Follow the golden horseshoe path right into your Home Board at bottom right",
        explanationFr: "Exact ! Vos pions font le tour en fer à cheval jusqu'à votre Maison.",
        explanationEn: "Correct! Your checkers journey in a horseshoe path into your Home Board.",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "Rester obligatoirement immobiles et groupés au centre du tapis de jeu",
        labelEn: "Stay permanently motionless in the center of the board",
        explanationFr: "Vos 15 pions doivent obligatoirement traverser pour rentrer à la Maison.",
        explanationEn: "All 15 checkers must travel across the board to reach Home.",
      },
    ],
  },
  // QUIZ 2 (Réponse C)
  {
    id: 2, linkedEpisodeId: 1, pointsReward: 200, dice: [6, 4], boardHighlights: {},
    titleFr: "Quiz 2/10 : Le But du Jeu",
    titleEn: "Quiz 2/10: The Goal of the Game",
    questionFr: "Comment gagne-t-on une partie de Backgammon\u00A0?",
    questionEn: "How do you win a game of Backgammon?",
    options: [
      {
        id: "A", isCorrect: false,
        labelFr: "En capturant tous les pions adverses pour les éliminer de la partie",
        labelEn: "By capturing and permanently eliminating all opposing checkers",
        explanationFr: "Au Backgammon, les pions frappés reviennent en jeu, ils ne sont pas éliminés.",
        explanationEn: "In Backgammon, captured checkers re-enter play; they are never eliminated.",
      },
      {
        id: "B", isCorrect: false,
        labelFr: "En réalisant le plus grand nombre de tours possibles sur l'échiquier",
        labelEn: "By completing as many laps around the board as possible",
        explanationFr: "Le but n'est pas de tourner en rond, mais d'arriver à la Maison pour sortir.",
        explanationEn: "The goal is not to run in circles, but to reach Home and exit.",
      },
      {
        id: "C", isCorrect: true,
        labelFr: "En rentrant ses 15 pions dans sa Maison puis en les sortant en premier",
        labelEn: "By bringing all 15 checkers into Home and bearing them off first",
        explanationFr: "Bravo ! Le premier joueur qui sort ses 15 pions remporte la manche.",
        explanationEn: "Bravo! The first player to bear off all 15 checkers wins the game.",
      },
    ],
  },
  // QUIZ 3 (Réponse B)
  {
    id: 3, linkedEpisodeId: 2, pointsReward: 200, dice: [2, 1], boardHighlights: {},
    titleFr: "Quiz 3/10 : Pion Seul vs Porte (Bouclier)",
    titleEn: "Quiz 3/10: Single Checker vs Gate (Shield)",
    questionFr: "Comment protéger vos pions pour que l'adversaire ne puisse JAMAIS les frapper\u00A0?",
    questionEn: "How do you protect your checkers so the opponent can NEVER hit them?",
    options: [
      {
        id: "A", isCorrect: false,
        labelFr: "En laissant chaque pion isolé tout seul sur des flèches différentes",
        labelEn: "By leaving each checker completely isolated on separate points",
        explanationFr: "Un pion seul est vulnérable et peut se faire frapper à tout moment !",
        explanationEn: "A single blot is vulnerable and can be hit at any moment!",
      },
      {
        id: "B", isCorrect: true,
        labelFr: "En plaçant au moins 2 pions sur la même flèche pour former une Porte",
        labelEn: "By placing at least 2 checkers on the same point to make a Gate",
        explanationFr: "Parfait ! Une Porte (2 pions ou plus) forme un bouclier imprenable.",
        explanationEn: "Perfect! A Gate (2 or more checkers) creates an impenetrable shield.",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "En cachant vos pions derrière la bordure extérieure de l'échiquier",
        labelEn: "By hiding your checkers behind the outer frame of the board",
        explanationFr: "Les pions doivent obligatoirement rester sur les pointes du plateau.",
        explanationEn: "Checkers must stay strictly on legal board points.",
      },
    ],
  },
  // QUIZ 4 (Réponse B)
  {
    id: 4, linkedEpisodeId: 2, pointsReward: 200, dice: [3, 1], boardHighlights: {},
    titleFr: "Quiz 4/10 : Construire une Porte avec les Dés",
    titleEn: "Quiz 4/10: Building a Gate with Dice",
    questionFr: "Pourquoi ce déplacement simultané de deux pions est-il le meilleur coup\u00A0?",
    questionEn: "Why is this simultaneous two-checker move the optimal play?",
    options: [
      {
        id: "A", isCorrect: false,
        labelFr: "Parce qu'il sépare deux pions pour les rendre plus vulnérables aux tirs",
        labelEn: "Because it splits two checkers to make them more vulnerable to hits",
        explanationFr: "Séparer ses pions augmente le danger au lieu de vous protéger.",
        explanationEn: "Splitting checkers increases danger instead of protecting you.",
      },
      {
        id: "B", isCorrect: true,
        labelFr: "Parce qu'il réunit deux pions ensemble pour créer un bouclier imprenable",
        labelEn: "Because it brings two checkers together to build an impassable shield",
        explanationFr: "Exact ! Réunir 2 pions crée une nouvelle Porte sécurisée imprenable.",
        explanationEn: "Exact! Combining 2 checkers makes a safe Gate that cannot be attacked.",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "Parce qu'il force vos pions à reculer dans le camp de votre adversaire",
        labelEn: "Because it forces checkers to move backward into the opponent camp",
        explanationFr: "Les pions ne reculent jamais au Backgammon.",
        explanationEn: "Checkers never move backwards in Backgammon.",
      },
    ],
  },
  // QUIZ 5 (Réponse C)
  {
    id: 5, linkedEpisodeId: 3, pointsReward: 200, dice: [3, 2], boardHighlights: {},
    titleFr: "Quiz 5/10 : Frapper un Pion Adverse Isolé",
    titleEn: "Quiz 5/10: Hitting an Isolated Checker",
    questionFr: "Que se passe-t-il quand vous arrivez sur une pointe avec 1 seul pion adverse\u00A0?",
    questionEn: "What happens when you land on a point with a single opponent checker?",
    options: [
      {
        id: "A", isCorrect: false,
        labelFr: "Rien ne se passe, vous devez obligatoirement vous arrêter devant lui",
        labelEn: "Nothing happens, you must strictly stop right in front of it",
        explanationFr: "Un pion seul ne bloque personne : vous pouvez et devez le frapper !",
        explanationEn: "A lone blot blocks no one: you can and should hit it!",
      },
      {
        id: "B", isCorrect: false,
        labelFr: "Votre pion est détruit et définitivement retiré de la partie en cours",
        labelEn: "Your checker is destroyed and permanently removed from play",
        explanationFr: "Aucun pion n'est détruit : c'est le pion adverse qui va sur la barre.",
        explanationEn: "No checkers are destroyed: the opponent blot goes to the bar.",
      },
      {
        id: "C", isCorrect: true,
        labelFr: "Vous le frappez : il va sur la Barre et doit repartir depuis le début",
        labelEn: "You hit it: it goes to the Bar and must restart from the beginning",
        explanationFr: "Magique ! Un pion adverse seul est expulsé sur la barre et perd son avance.",
        explanationEn: "Brilliant! An isolated opponent checker goes to the bar and loses its lead.",
      },
    ],
  },
  // QUIZ 6 (Réponse B)
  {
    id: 6, linkedEpisodeId: 3, pointsReward: 200, dice: [4, 2], boardHighlights: { bar: true },
    titleFr: "Quiz 6/10 : Sortir de la Barre Centrale en Priorité",
    titleEn: "Quiz 6/10: Entering from the Center Bar",
    questionFr: "Vous avez un pion sur la Barre centrale : que devez-vous jouer en priorité\u00A0?",
    questionEn: "You have a checker trapped on the Center Bar: what is your top priority?",
    options: [
      {
        id: "A", isCorrect: false,
        labelFr: "Ignorer ce pion prisonnier et faire avancer n'importe quel autre pion sur le tapis",
        labelEn: "Ignore this trapped checker and advance any other checker across the board",
        explanationFr: "Interdit par les règles : la rentrée de barre est obligatoire en premier.",
        explanationEn: "Forbidden by the rules: re-entry from the bar is strictly mandatory first.",
      },
      {
        id: "B", isCorrect: true,
        labelFr: "Obligation absolue : faire rentrer ce pion en jeu sur une pointe libre en face",
        labelEn: "Strict obligation: enter this checker into play onto an open opposing point",
        explanationFr: "Règle d'or : tant qu'un pion est sur la Barre, aucun autre pion ne peut avancer !",
        explanationEn: "Golden rule: while on the Bar, no other checker on the board can advance!",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "Passer immédiatement son tour sans lancer les dés jusqu'au tour suivant",
        labelEn: "Immediately forfeit your turn without rolling dice until the next round",
        explanationFr: "Vous ne perdez pas : vous lancez vos dés pour tenter de rentrer.",
        explanationEn: "You do not forfeit: you simply roll dice to enter.",
      },
    ],
  },
  // QUIZ 7 (Réponse A)
  {
    id: 7, linkedEpisodeId: 4, pointsReward: 200, dice: [5, 3], boardHighlights: {},
    titleFr: "Quiz 7/10 : Le Mur de Portes (Bloquer l'adversaire)",
    titleEn: "Quiz 7/10: The Wall of Gates (Prime)",
    questionFr: "Pourquoi aligner plusieurs Portes côte à côte est-il si redoutable\u00A0?",
    questionEn: "Why is lining up several consecutive points side by side so powerful?",
    options: [
      {
        id: "A", isCorrect: true,
        labelFr: "Cela forme un mur continu que le pion adverse derrière ne peut plus franchir",
        labelEn: "It forms a continuous wall that opposing checkers trapped behind cannot pass",
        explanationFr: "Chef-d'œuvre tactique ! Un alignement de portes (Prime) emprisonne l'adversaire.",
        explanationEn: "Tactical masterpiece! A wall of gates (Prime) traps opposing checkers completely.",
      },
      {
        id: "B", isCorrect: false,
        labelFr: "Cela attribue immédiatement un bonus de points doublés pour la manche",
        labelEn: "It immediately awards a double point bonus for the current game",
        explanationFr: "Les portes ne donnent pas de points directs, elles offrent le contrôle tactique.",
        explanationEn: "Gates do not award direct score points; they provide positional control.",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "Cela oblige votre adversaire à défausser ses dés sans jouer son tour",
        labelEn: "It forces the opponent to discard their dice without taking their turn",
        explanationFr: "L'adversaire continue de lancer ses dés, mais ses coups restent bloqués.",
        explanationEn: "The opponent still rolls, but finds their checkers completely blocked.",
      },
    ],
  },
  // QUIZ 8 (Réponse C)
  {
    id: 8, linkedEpisodeId: 4, pointsReward: 200, dice: [6, 1], boardHighlights: {},
    titleFr: "Quiz 8/10 : Quand Peut-on Sortir ses Pions ?",
    titleEn: "Quiz 8/10: When Can You Bear Off?",
    questionFr: "Pion retardataire dehors : avez-vous le droit de sortir vos pions\u00A0?",
    questionEn: "Laggard checker outside: are you allowed to bear off your checkers?",
    options: [
      {
        id: "A", isCorrect: false,
        labelFr: "Oui, dès qu'au moins 5 pions de votre couleur sont arrivés dans la Maison",
        labelEn: "Yes, as soon as at least 5 checkers of your color reach Home",
        explanationFr: "5 pions ne suffisent pas : il faut impérativement réunir les 15 pions !",
        explanationEn: "5 checkers are not enough: you must gather all 15 checkers first!",
      },
      {
        id: "B", isCorrect: false,
        labelFr: "Oui, tant que l'adversaire n'a aucun pion prisonnier sur la Barre centrale",
        labelEn: "Yes, as long as the opponent has no trapped checkers on the Bar",
        explanationFr: "L'état de l'adversaire ne change rien : tous vos 15 pions doivent être rentrés.",
        explanationEn: "The opponent's position changes nothing: all 15 of your checkers must be home.",
      },
      {
        id: "C", isCorrect: true,
        labelFr: "Non, vos 15 pions doivent TOUS être dans la Maison avant d'en sortir un seul",
        labelEn: "No, all 15 of your checkers must be safely inside Home before bearing off any",
        explanationFr: "Exactement ! La sortie (bear-off) est strictement interdite tant qu'un pion est dehors.",
        explanationEn: "Exactly! Bearing off is strictly forbidden as long as even 1 checker is outside.",
      },
    ],
  },
  // QUIZ 9 (Réponse B)
  {
    id: 9, linkedEpisodeId: 5, pointsReward: 200, dice: [0, 0], boardHighlights: {},
    titleFr: "Quiz 9/10 : Gagner Double (Gammon x2)",
    titleEn: "Quiz 9/10: Winning Double (Gammon x2)",
    questionFr: "Vos 15 pions sortis alors que l'adversaire en a sorti 0 : résultat\u00A0?",
    questionEn: "All 15 checkers borne off while opponent has borne off 0: outcome?",
    options: [
      {
        id: "A", isCorrect: false,
        labelFr: "Vous gagnez seulement 1 point classique comme lors d'une fin normale",
        labelEn: "You only win a single standard point like in an ordinary finish",
        explanationFr: "Non ! Une telle avance est récompensée par une victoire double (Gammon).",
        explanationEn: "No! Such dominance is rewarded with a double victory (Gammon).",
      },
      {
        id: "B", isCorrect: true,
        labelFr: "Vous gagnez le DOUBLE des points de la manche (Victoire Gammon ×2) !",
        labelEn: "You win DOUBLE match points for this game (Gammon victory ×2)!",
        explanationFr: "Victoire écrasante (Gammon) ! Sortir ses 15 pions avant le 1er adverse rapporte le double.",
        explanationEn: "Crushing victory (Gammon)! Bearing off 15 before the opponent awards double.",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "La manche est considérée comme nulle et doit être intégralement rejouée",
        labelEn: "The game is declared a draw and must be completely replayed",
        explanationFr: "La victoire est validée avec éclat et rapporte le double de points !",
        explanationEn: "The victory is validated with glory and awards double points!",
      },
    ],
  },
  // QUIZ 10 (Réponse C)
  {
    id: 10, linkedEpisodeId: 5, pointsReward: 200, dice: [0, 0], boardHighlights: { cube: true },
    titleFr: "Quiz 10/10 : Le Dé Multiplicateur (x2)",
    titleEn: "Quiz 10/10: The Doubling Cube (x2)",
    questionFr: "À quoi sert le gros dé spécial marqué 2, 4, 8 (Videau) sur le tapis\u00A0?",
    questionEn: "What is the special doubling die marked 2, 4, 8 (Cube) used for?",
    options: [
      {
        id: "A", isCorrect: false,
        labelFr: "À relancer gratuitement vos deux dés si votre tirage ne vous convient pas",
        labelEn: "To re-roll your dice for free if your roll is unfavorable",
        explanationFr: "Le videau ne permet pas de relancer : c'est un multiplicateur d'enjeu.",
        explanationEn: "The cube does not grant re-rolls: it multiplies game points.",
      },
      {
        id: "B", isCorrect: false,
        labelFr: "À comptabiliser précisément le nombre total de tours de jeu écoulés",
        labelEn: "To keep track of the total number of game rounds played",
        explanationFr: "Ce n'est pas un compte-tours, mais le célèbre dé de doublement (Videau).",
        explanationEn: "It is not a turn counter, but the famous Doubling Cube.",
      },
      {
        id: "C", isCorrect: true,
        labelFr: "À proposer de doubler la mise de la partie lorsque votre position domine",
        labelEn: "To propose doubling match stakes when your position is dominant",
        explanationFr: "Génie stratégique ! Le Videau permet de doubler la mise avant de lancer les dés.",
        explanationEn: "Strategic genius! The Doubling Cube doubles the stakes before rolling dice.",
      },
    ],
  },
];
