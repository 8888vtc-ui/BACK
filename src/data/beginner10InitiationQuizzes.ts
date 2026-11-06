/**
 * @file src/data/beginner10InitiationQuizzes.ts
 * @description Banque des 10 quiz d'initiation visuelle pour l'Académie Débutant.
 * 100 % basé sur le plateau visuel SVG, zéro jargon ("Maison" au lieu de termes techniques, zéro numéro de case).
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
  // QUIZ 1
  {
    id: 1, linkedEpisodeId: 1, pointsReward: 200, dice: [3, 1], boardHighlights: {},
    titleFr: "Quiz 1/10 : Le Sens de Circulation",
    titleEn: "Quiz 1/10: Direction of Play",
    questionFr: "Regardez le plateau ci-dessus : quel chemin vos pions blancs doivent-ils suivre pour rentrer chez vous ?",
    questionEn: "Look at the board above: which path must your white checkers follow to reach home?",
    options: [
      {
        id: "A", isCorrect: true,
        labelFr: "Suivre la grande flèche dorée en fer à cheval jusqu'à Votre Maison (en bas à droite)",
        labelEn: "Follow the golden horseshoe arrow all the way to Your Home (bottom right)",
        explanationFr: "Exact ! Vos pions font toujours le tour en fer à cheval jusqu'à votre Maison d'arrivée.",
        explanationEn: "Correct! Your checkers always journey in a horseshoe path right into your Home Board.",
      },
      {
        id: "B", isCorrect: false,
        labelFr: "Reculer vers le camp adverse en haut",
        labelEn: "Move backwards into the opponent camp at the top",
        explanationFr: "Non, c'est le sens de marche de votre adversaire !",
        explanationEn: "No, that is your opponent's direction of movement!",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "Rester immobiles au milieu du tapis",
        labelEn: "Stay motionless in the center of the board",
        explanationFr: "Vos 15 pions doivent obligatoirement traverser pour rentrer à la Maison.",
        explanationEn: "All 15 checkers must travel across the board to reach Home.",
      },
    ],
  },
  // QUIZ 2
  {
    id: 2, linkedEpisodeId: 1, pointsReward: 200, dice: [6, 4], boardHighlights: {},
    titleFr: "Quiz 2/10 : Le But du Jeu",
    titleEn: "Quiz 2/10: The Goal of the Game",
    questionFr: "Comment gagne-t-on une partie de Backgammon ?",
    questionEn: "How do you win a game of Backgammon?",
    options: [
      {
        id: "A", isCorrect: true,
        labelFr: "En amenant ses 15 pions dans sa Maison, puis en les sortant tous du plateau en premier",
        labelEn: "By bringing all 15 checkers into Home, then bearing them all off first",
        explanationFr: "Bravo ! Le premier joueur qui sort ses 15 pions remporte la manche.",
        explanationEn: "Bravo! The first player to bear off all 15 checkers wins the game.",
      },
      {
        id: "B", isCorrect: false,
        labelFr: "En capturant tous les pions adverses comme aux échecs",
        labelEn: "By capturing all opposing checkers like in chess",
        explanationFr: "Au Backgammon, les pions frappés reviennent en jeu, ils ne sont pas éliminés.",
        explanationEn: "In Backgammon, captured checkers re-enter play; they are never eliminated.",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "En faisant le plus grand nombre de tours possibles sur le plateau",
        labelEn: "By completing as many laps around the board as possible",
        explanationFr: "Le but n'est pas de tourner en rond, mais d'arriver à la Maison pour sortir.",
        explanationEn: "The goal is not to run in circles, but to reach Home and exit.",
      },
    ],
  },
  // QUIZ 3
  {
    id: 3, linkedEpisodeId: 2, pointsReward: 200, dice: [2, 1], boardHighlights: {},
    titleFr: "Quiz 3/10 : Pion Seul vs Porte (Bouclier)",
    titleEn: "Quiz 3/10: Single Checker vs Gate (Shield)",
    questionFr: "Comment protéger vos pions pour que l'adversaire ne puisse JAMAIS les frapper ?",
    questionEn: "How do you protect your checkers so the opponent can NEVER hit them?",
    options: [
      {
        id: "A", isCorrect: true,
        labelFr: "En plaçant au moins 2 pions de votre couleur sur la même pointe pour former une Porte",
        labelEn: "By placing at least 2 checkers of your color on the same point to form a Gate",
        explanationFr: "Parfait ! Une Porte (2 pions ou plus) forme un bouclier imprenable.",
        explanationEn: "Perfect! A Gate (2 or more checkers) creates an impenetrable shield.",
      },
      {
        id: "B", isCorrect: false,
        labelFr: "En laissant chaque pion tout seul et isolé sur une pointe différente",
        labelEn: "By leaving each checker completely alone on a different point",
        explanationFr: "Un pion seul est vulnérable et peut se faire frapper à tout moment !",
        explanationEn: "A single blot is vulnerable and can be hit at any moment!",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "En les cachant derrière le bord de l'échiquier",
        labelEn: "By hiding them behind the edge of the board",
        explanationFr: "Les pions doivent obligatoirement rester sur les pointes du plateau.",
        explanationEn: "Checkers must stay strictly on legal board points.",
      },
    ],
  },
  // QUIZ 4
  {
    id: 4, linkedEpisodeId: 2, pointsReward: 200, dice: [3, 1], boardHighlights: {},
    titleFr: "Quiz 4/10 : Construire une Porte avec les Dés",
    titleEn: "Quiz 4/10: Building a Gate with Dice",
    questionFr: "Regardez les flèches dorées sur le plateau : pourquoi ce déplacement est-il le meilleur ?",
    questionEn: "Look at the golden arrows on the board: why is this move the best?",
    options: [
      {
        id: "A", isCorrect: true,
        labelFr: "Parce qu'il réunit deux pions ensemble pour créer un bouclier imprenable",
        labelEn: "Because it brings two checkers together to create an impassable shield",
        explanationFr: "Exact ! Réunir 2 pions crée une nouvelle Porte sécurisée que l'adversaire ne peut attaquer.",
        explanationEn: "Exact! Combining 2 checkers makes a safe Gate that the opponent cannot attack.",
      },
      {
        id: "B", isCorrect: false,
        labelFr: "Parce qu'il sépare deux pions pour les rendre plus vulnérables",
        labelEn: "Because it splits two checkers to make them more vulnerable",
        explanationFr: "Séparer ses pions augmente le danger au lieu de vous protéger.",
        explanationEn: "Splitting checkers increases danger instead of protecting you.",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "Parce qu'il fait reculer vos pions dans votre camp adverse",
        labelEn: "Because it moves checkers backward into the opponent camp",
        explanationFr: "Les pions ne reculent jamais au Backgammon.",
        explanationEn: "Checkers never move backwards in Backgammon.",
      },
    ],
  },
  // QUIZ 5
  {
    id: 5, linkedEpisodeId: 3, pointsReward: 200, dice: [3, 2], boardHighlights: {},
    titleFr: "Quiz 5/10 : Frapper un Pion Adverse Isolé",
    titleEn: "Quiz 5/10: Hitting an Isolated Checker",
    questionFr: "Que se passe-t-il si votre pion s'arrête sur une pointe où il n'y a qu'UN SEUL pion adverse ?",
    questionEn: "What happens if your checker lands on a point with only ONE opponent checker?",
    options: [
      {
        id: "A", isCorrect: true,
        labelFr: "Vous le frappez ! Il est envoyé sur la Barre centrale et doit repartir de tout au début",
        labelEn: "You hit it! It is sent to the Center Bar and must restart from the beginning",
        explanationFr: "Magique ! Un pion adverse seul est expulsé sur la barre et perd toute son avance.",
        explanationEn: "Brilliant! An isolated opponent checker is sent to the bar and loses its race lead.",
      },
      {
        id: "B", isCorrect: false,
        labelFr: "Rien ne se passe, vous devez vous arrêter juste devant lui",
        labelEn: "Nothing happens, you must stop right in front of it",
        explanationFr: "Un pion seul ne bloque personne : vous pouvez et devez le frapper !",
        explanationEn: "A lone blot blocks no one: you can and should hit it!",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "Votre pion est détruit et éliminé définitivement",
        labelEn: "Your checker is destroyed and permanently removed",
        explanationFr: "Aucun pion n'est détruit : c'est le pion adverse qui va sur la barre.",
        explanationEn: "No checkers are destroyed: the opponent blot goes to the bar.",
      },
    ],
  },
  // QUIZ 6
  {
    id: 6, linkedEpisodeId: 3, pointsReward: 200, dice: [4, 2], boardHighlights: { bar: true },
    titleFr: "Quiz 6/10 : Sortir de la Barre Centrale en Priorité",
    titleEn: "Quiz 6/10: Entering from the Center Bar",
    questionFr: "Vous avez un pion prisonnier sur la Barre centrale. Qu'avez-vous le droit de jouer ?",
    questionEn: "You have a checker trapped on the Center Bar. What are you allowed to play?",
    options: [
      {
        id: "A", isCorrect: true,
        labelFr: "Priorité absolue : vous devez d'abord faire rentrer ce pion sur une pointe libre en face avant de bouger tout autre pion",
        labelEn: "Absolute priority: you must enter this checker onto an open point before moving any other",
        explanationFr: "Règle d'or : tant qu'un pion est sur la Barre, aucun autre pion sur le plateau ne peut avancer !",
        explanationEn: "Golden rule: while on the Bar, no other checker on the board can advance!",
      },
      {
        id: "B", isCorrect: false,
        labelFr: "Vous pouvez ignorer ce pion et faire avancer n'importe quel autre pion",
        labelEn: "You may ignore this checker and advance any other checker instead",
        explanationFr: "Interdit par les règles : la rentrée de barre est obligatoire en premier.",
        explanationEn: "Forbidden by the rules: re-entry from the bar is strictly mandatory first.",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "Vous perdez immédiatement la manche sans jouer",
        labelEn: "You immediately forfeit the match without playing",
        explanationFr: "Vous ne perdez pas : vous lancez vos dés pour tenter de rentrer.",
        explanationEn: "You do not forfeit: you simply roll dice to enter.",
      },
    ],
  },
  // QUIZ 7
  {
    id: 7, linkedEpisodeId: 4, pointsReward: 200, dice: [5, 3], boardHighlights: {},
    titleFr: "Quiz 7/10 : Le Mur de Portes (Bloquer l'adversaire)",
    titleEn: "Quiz 7/10: The Wall of Gates (Prime)",
    questionFr: "Pourquoi aligner plusieurs Portes côte à côte (comme sur le plateau) est-il redoutable ?",
    questionEn: "Why is aligning several Gates side-by-side (like on the board) so formidable?",
    options: [
      {
        id: "A", isCorrect: true,
        labelFr: "Cela forme un mur continu que le pion adverse derrière ne peut plus sauter",
        labelEn: "It forms a continuous wall that opposing checkers trapped behind cannot leap over",
        explanationFr: "Chef-d'œuvre tactique ! Un alignement de portes (Prime) emprisonne l'adversaire.",
        explanationEn: "Tactical masterpiece! A wall of gates (Prime) traps opposing checkers completely.",
      },
      {
        id: "B", isCorrect: false,
        labelFr: "Cela donne 10 points de bonus immédiats",
        labelEn: "It grants 10 immediate bonus points",
        explanationFr: "Les portes ne donnent pas de points directs, elles offrent le contrôle tactique.",
        explanationEn: "Gates do not award direct score points; they provide positional control.",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "Cela oblige l'adversaire à retirer ses dés",
        labelEn: "It forces the opponent to remove their dice",
        explanationFr: "L'adversaire continue de lancer ses dés, mais ses coups restent bloqués.",
        explanationEn: "The opponent still rolls, but finds their checkers completely blocked.",
      },
    ],
  },
  // QUIZ 8
  {
    id: 8, linkedEpisodeId: 4, pointsReward: 200, dice: [6, 1], boardHighlights: {},
    titleFr: "Quiz 8/10 : Quand Peut-on Sortir ses Pions ?",
    titleEn: "Quiz 8/10: When Can You Bear Off?",
    questionFr: "Regardez le pion blanc retardataire à gauche : pouvez-vous déjà sortir vos autres pions ?",
    questionEn: "Look at the laggard white checker on the left: can you already bear off other checkers?",
    options: [
      {
        id: "A", isCorrect: true,
        labelFr: "Non, vos 15 pions doivent TOUS être arrivés dans votre Maison avant d'en sortir un seul",
        labelEn: "No, all 15 of your checkers must be safely inside your Home before bearing off any",
        explanationFr: "Exactement ! La sortie (bear-off) est strictement interdite tant qu'un seul pion est dehors.",
        explanationEn: "Exactly! Bearing off is strictly forbidden as long as even a single checker remains outside.",
      },
      {
        id: "B", isCorrect: false,
        labelFr: "Oui, dès qu'au moins 5 pions sont arrivés dans la Maison",
        labelEn: "Yes, as soon as at least 5 checkers reach the Home board",
        explanationFr: "5 pions ne suffisent pas : il faut impérativement réunir les 15 pions !",
        explanationEn: "5 checkers are not enough: you must gather all 15 checkers first!",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "Oui, tant que l'adversaire n'a aucun pion sur la Barre",
        labelEn: "Yes, as long as the opponent has no checkers on the Bar",
        explanationFr: "L'état de l'adversaire ne change rien : tous vos 15 pions doivent être rentrés.",
        explanationEn: "The opponent's position changes nothing: all 15 of your checkers must be home.",
      },
    ],
  },
  // QUIZ 9
  {
    id: 9, linkedEpisodeId: 5, pointsReward: 200, dice: [0, 0], boardHighlights: {},
    titleFr: "Quiz 9/10 : Gagner Double (Gammon x2)",
    titleEn: "Quiz 9/10: Winning Double (Gammon x2)",
    questionFr: "Vous avez sorti vos 15 pions alors que l'adversaire n'en a sorti aucun : que gagnez-vous ?",
    questionEn: "You bore off all 15 checkers while your opponent bore off none: what do you win?",
    options: [
      {
        id: "A", isCorrect: true,
        labelFr: "Vous gagnez le DOUBLE des points (2 points au lieu d'1) !",
        labelEn: "You win DOUBLE points (2 points instead of 1)!",
        explanationFr: "Victoire écrasante (Gammon) ! Sortir ses 15 pions avant le premier pion adverse rapporte le double.",
        explanationEn: "Crushing victory (Gammon)! Bearing off all 15 before the opponent bears off 1 awards double.",
      },
      {
        id: "B", isCorrect: false,
        labelFr: "Vous gagnez seulement 1 point classique",
        labelEn: "You only win a standard single 1 point",
        explanationFr: "Non ! Une telle avance est récompensée par une victoire double (Gammon).",
        explanationEn: "No! Such dominance is rewarded with a double victory (Gammon).",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "La partie est annulée et doit être rejouée",
        labelEn: "The game is void and must be replayed",
        explanationFr: "La victoire est validée avec éclat et rapporte le double de points !",
        explanationEn: "The victory is validated with glory and awards double points!",
      },
    ],
  },
  // QUIZ 10
  {
    id: 10, linkedEpisodeId: 5, pointsReward: 200, dice: [0, 0], boardHighlights: { cube: true },
    titleFr: "Quiz 10/10 : Le Dé Multiplicateur (x2)",
    titleEn: "Quiz 10/10: The Doubling Cube (x2)",
    questionFr: "À quoi sert ce gros dé spécial marqué 2, 4, 8 sur le côté du plateau ?",
    questionEn: "What is this special large die marked 2, 4, 8 on the side of the board used for?",
    options: [
      {
        id: "A", isCorrect: true,
        labelFr: "À proposer de doubler les points de la manche quand votre stratégie vous donne l'avantage !",
        labelEn: "To propose doubling the game stakes when your strategy gives you the advantage!",
        explanationFr: "Génie stratégique ! Le Videau permet de doubler la mise de la manche avant de lancer les dés.",
        explanationEn: "Strategic genius! The Doubling Cube doubles the match stakes before rolling dice.",
      },
      {
        id: "B", isCorrect: false,
        labelFr: "À relancer les dés gratuitement si votre tirage ne vous plaît pas",
        labelEn: "To re-roll dice for free if you dislike your roll",
        explanationFr: "Le videau ne permet pas de relancer : c'est un multiplicateur d'enjeu.",
        explanationEn: "The cube does not grant re-rolls: it multiplies game points.",
      },
      {
        id: "C", isCorrect: false,
        labelFr: "À compter le nombre de tours de jeu écoulés",
        labelEn: "To count the number of elapsed game turns",
        explanationFr: "Ce n'est pas un compte-tours, mais le célèbre dé de doublement (Videau).",
        explanationEn: "It is not a turn counter, but the famous Doubling Cube.",
      },
    ],
  },
];
