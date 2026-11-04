export interface GuideChapterSection {
  id: string;
  badgeFr: string;
  badgeEn: string;
  titleFr: string;
  titleEn: string;
  summaryFr: string;
  summaryEn: string;
  paragraphsFr: string[];
  paragraphsEn: string[];
  keyTakeawayFr: string;
  keyTakeawayEn: string;
  highlightPoints?: number[];
  highlightCube?: boolean;
  highlightBar?: boolean;
}

export const BEGINNER_MASTER_GUIDE_CHAPTERS: GuideChapterSection[] = [
  {
    id: 'strategy_vs_luck',
    badgeFr: 'Philosophie & Hasard',
    badgeEn: 'Philosophy & Luck',
    titleFr: "1. L'Alliance Unique du Hasard et de la Stratégie",
    titleEn: '1. The Unique Blend of Luck and Strategy',
    summaryFr: "Pourquoi le hasard des dés fait le charme du jeu, tandis que la statistique sacre les champions.",
    summaryEn: 'Why dice luck brings thrilling suspense, while statistics and precision crown true champions.',
    paragraphsFr: [
      "Le backgammon est un jeu unique qui marie le hasard et la stratégie — et c'est exactement ce mélange qui en fait tout le charme ! Oui, le hasard des dés est bien réel : sur une partie, un coup de chance peut faire gagner n'importe qui. Mais alors, pourquoi existe-t-il des Championnats du Monde à Monte-Carlo et pourquoi les meilleurs joueurs de la planète gagnent-ils toujours sur la durée ?",
      "Parce qu'ils manient les calculs et les statistiques sur les 36 combinaisons de dés, commettent le moins d'erreurs possible (les fameux Blunders mesurés par le niveau d'erreur ER/PR) et utilisent au moment parfait le Videau — le dé multiplicateur qui double les points de la manche !",
      "Sur un seul tour, un double 6 chanceux peut faire vaciller n'importe quel joueur. Mais sur un match ou un tournoi, tout le monde reçoit exactement les mêmes probabilités de dés. Le joueur amateur subit le sort ; le grand stratège place ses pions pour que 25 lancers sur 36 soient favorables, transformant le hasard en allié mathématique.",
    ],
    paragraphsEn: [
      "Backgammon is a unique game that blends luck and strategy — and that exact mix is what gives the game all its charm! Yes, dice luck is very real: in a single game, a lucky roll can let anyone win. So why are there World Championships in Monte-Carlo, and why do the world's best players always win over time?",
      "Because they master calculations and statistics across the 36 dice combinations, make the fewest mistakes possible (avoiding Blunders measured by the ER/PR error rate), and use the Doubling Cube at the exact right moment to double the stakes!",
      "On a single roll, lucky double sixes can shake any master. But over a full match or tournament, both players receive identical dice odds. Amateurs blame the dice; true strategists position checkers so that 25 rolls out of 36 deliver value, turning luck into a mathematical ally.",
    ],
    keyTakeawayFr: "💡 Règle d'or : Le hasard apporte l'adrénaline et le suspense, mais la stratégie et les statistiques sur 36 lancers décident du vainqueur sur la durée.",
    keyTakeawayEn: '💡 Golden Rule: Luck brings adrenaline and suspense, but strategy and 36-roll statistics decide the winner over time.',
  },
  {
    id: 'rules_and_board',
    badgeFr: 'Anatomie du Plateau',
    badgeEn: 'Board Anatomy',
    titleFr: '2. Le Circuit en Fer à Cheval & Les Portes Infranchissables',
    titleEn: '2. The Horseshoe Track & Impassable Gates',
    summaryFr: 'Traverser le plateau de la case 24 à la case 1 pour ramener tous ses pions à la maison.',
    summaryEn: 'Travel the board from point 24 to point 1 to bring all checkers safely home.',
    paragraphsFr: [
      'Le plateau compte 24 flèches triangulaires. Vos 15 pions démarrent répartis sur le plateau et cheminent en fer à cheval vers votre Jan intérieur (flèches 1 à 6).',
      'Un pion seul sur une flèche est un "blot" : s\'il est frappé par un pion adverse, il est banni sur la barre centrale et perd un temps précieux.',
      'Deux pions ou plus sur la même case forment une "porte" : un bastion imprenable où l\'adversaire ne peut ni vous frapper, ni poser le moindre pion. En fermant plusieurs portes successives, vous créez un Prime : une muraille totale.',
    ],
    paragraphsEn: [
      'The board consists of 24 triangular points. Your 15 checkers embark on a horseshoe journey towards your home board (points 1 to 6).',
      'A single checker on a point is a "blot": if hit by an enemy checker, it is sent to the central bar, forfeiting vital race tempo.',
      'Two or more checkers together establish a "gate" (made point): a fortified stronghold where the opponent can neither hit you nor land. Connecting several gates builds a Prime: an impenetrable wall.',
    ],
    keyTakeawayFr: 'Construisez des portes pour verrouiller votre camp et avancez en meute sans laisser de pions isolés.',
    keyTakeawayEn: 'Build points to lock your home board and advance in pairs without exposing isolated blots.',
    highlightPoints: [1, 2, 3, 4, 5, 6, 20],
  },
  {
    id: 'doubling_cube_secrets',
    badgeFr: "L'Arme du Videau",
    badgeEn: 'The Doubling Cube',
    titleFr: '3. Le Videau (Doubling Cube) : Le Dé qui Multiplie les Enjeux',
    titleEn: '3. The Doubling Cube: Multiplying the Stakes',
    summaryFr: "Ce dé gravé 2, 4, 8, 16, 32, 64 permet de doubler la mise et d'abréger une manche gagnée.",
    summaryEn: 'This cube marked 2, 4, 8, 16, 32, 64 doubles stakes and secures won positions early.',
    paragraphsFr: [
      "Le videau est le cœur stratégique qui sépare le joueur chanceux du grand stratège. Au début de votre tour, avant de lancer les dés, si vos calculs indiquent que vos chances de victoire dominent, vous proposez de doubler la valeur de la manche (×2).",
      "Votre adversaire fait alors face à un choix crucial : accepter le défi (Take) et se battre pour 2 points, ou abandonner immédiatement (Drop / Pass) pour ne perdre qu'un seul point sans risquer davantage.",
      "Savoir quand doubler permet de convertir un avantage statistique en points garantis, sans laisser aux dés le temps d'offrir un retournement miraculeux à l'adversaire.",
    ],
    paragraphsEn: [
      "The doubling cube is the strategic core dividing the merely lucky from true masters. At the start of your turn, before rolling the dice, if your odds command the game, you propose to double the stakes (×2).",
      "Your opponent faces a crucial crossroad: accept the challenge (Take) battling for 2 points, or forfeit immediately (Drop / Pass) giving up just 1 point.",
      "Knowing precisely when to turn the cube converts a statistical edge into victory, before runaway dice can give your rival a miracle swing.",
    ],
    keyTakeawayFr: 'Proposez le videau dès que votre avantage est clair ; refusez-le si vos chances de retour tombent sous 25 %.',
    keyTakeawayEn: 'Offer the cube when holding a strong advantage; drop if your winning chances fall below 25%.',
    highlightCube: true,
  },
  {
    id: 'match_vs_money_game',
    badgeFr: 'Format de Jeu & Monte-Carlo',
    badgeEn: 'Game Formats & Monte Carlo',
    titleFr: '4. Match vs Money Game & Les Championnats du Monde',
    titleEn: '4. Match Play vs Money Game & World Championships',
    summaryFr: 'Pourquoi la stratégie change radicalement entre un tournoi à Monte-Carlo et une partie libre.',
    summaryEn: 'Why strategy shifts dramatically between tournament match play and money play.',
    paragraphsFr: [
      'En Money Game (partie libre), chaque point gagné ou perdu compte de façon indépendante. Un Gammon rapporte le double des points et un Backgammon le triple.',
      'En Match Play (tournoi officiel de Monte-Carlo, matchs en 3, 5, 7, 11 ou 21 points), seul le score global compte. Dès qu\'un joueur n\'est plus qu\'à 1 point de la victoire finale, la manche suivante applique la célèbre "Règle Crawford" : interdiction formelle de doubler au videau pendant cette manche !',
      'Aux Championnats du Monde, les Grands-Maîtres adaptent chaque coup au score exact. Une prise de risque insensée en partie libre peut devenir le coup mathématiquement parfait en fin de match.',
    ],
    paragraphsEn: [
      'In Money Play, each point won or lost has direct, standalone value. A gammon pays double points and a backgammon pays triple.',
      'In Match Play (official Monte Carlo World Championships, 3, 5, 7, 11, or 21-point matches), the match score is paramount. When a leader reaches 1 point from victory, the next game triggers the "Crawford Rule": doubling is forbidden for that single game!',
      'At world-class tournaments, grandmasters tailor every move to the match score. A reckless play in money game can be the mathematically optimal choice in match play.',
    ],
    keyTakeawayFr: 'En match, surveillez toujours le score restant avant de risquer un gammon ou de doubler.',
    keyTakeawayEn: 'In match play, always track distance to score before risking a gammon or turning the cube.',
  },
  {
    id: 'blunder_and_pr_demystified',
    badgeFr: 'Vérité Statistique & IA',
    badgeEn: 'Statistical Truth & AI',
    titleFr: "5. Qu'est-ce qu'un Blunder & Le Niveau d'Erreur (ER / PR) ?",
    titleEn: '5. Demystifying Blunders & Performance Rating (ER / PR)',
    summaryFr: 'Comprendre ces notions pour mesurer ses progrès indépendamment de la chance des dés.',
    summaryEn: 'Understanding key benchmarks to track your progress independently of dice luck.',
    paragraphsFr: [
      'Ne soyez jamais effrayé par le mot "Blunder" : ce n\'est ni une honte ni une punition ! Un blunder est simplement une gaffe tactique qui gâche une fraction de vos chances de gain (comme laisser un pion exposé sans raison ou rater une porte clé).',
      "Le Niveau d'Erreur (ER / PR) est votre note de précision officielle calculée par notre IA Championne du Monde (Open Sage & GNU Backgammon). Elle évalue la qualité de vos décisions indépendamment de la chance des dés !",
      'Même si vous perdez une partie sur des dés malheureux, si vous avez joué les meilleurs coups statistiques, votre note ER/PR reste d\'excellence mondiale (proche de 0). Un ER de 0 à 4 correspond aux champions du monde, 5 à 9 aux joueurs de club, et 15 à 25 aux joueurs qui découvrent les secrets du jeu.',
    ],
    paragraphsEn: [
      'Never fear the word "Blunder": it is neither a shame nor a failure! A blunder simply marks a tactical mistake that gives away winning equity (like leaving an exposed checker or missing a vital gate).',
      'The Performance Rating (ER / PR) is your official precision benchmark calculated by world-class neural networks (Open Sage & GNU Backgammon). It measures the quality of your decisions independently of dice rolls!',
      'Even if you lose a game to unlucky dice, if you made the correct statistical moves, your ER/PR remains world-class (near 0). An ER of 0 to 4 is World Champion tier, 5 to 9 is club level, and 15 to 25 represents active learners discovering the game.',
    ],
    keyTakeawayFr: "Un blunder identifié et compris est le moyen le plus rapide d'abaisser votre ER/PR vers le niveau Grand-Maître.",
    keyTakeawayEn: 'A blunder identified and understood is the fastest path to lowering your ER/PR toward Grandmaster level.',
  },
  {
    id: 'five_golden_secrets',
    badgeFr: 'Les 36 Combinaisons',
    badgeEn: 'The 36 Combinations',
    titleFr: '6. Les 36 Combinaisons de Dés & Les Secrets des Champions',
    titleEn: '6. The 36 Dice Combinations & Grandmaster Secrets',
    summaryFr: 'Comment utiliser la table des 36 lancers pour avoir toujours un coup d\'avance.',
    summaryEn: 'How to use the 36-roll probability grid to stay one step ahead.',
    paragraphsFr: [
      "1. La Table des 36 Lancers : Avec deux dés à 6 faces, il y a 6 × 6 = 36 combinaisons possibles. Les champions ne devinent rien : ils calculent combien de lancers parmi les 36 permettent d'atteindre leur objectif ou menacent leur adversaire.",
      "2. La Porte 5 d'Or : C'est la flèche la plus puissante du plateau. Fermez la flèche 5 adverse ou la vôtre dès que vos dés l'autorisent pour confisquer les meilleurs lancers de l'autre camp.",
      "3. Deux par deux : Ne laissez jamais un pion seul (blot) à portée directe de frappe (distance 1 à 6, très fréquente parmi les 36 lancers) sans une compensation majeure.",
      "4. Attaquez pour gagner du temps : Frapper un pion adverse le renvoie sur la barre centrale et vous fait gagner un tour complet.",
      "5. Gardez votre calme face aux dés : Sur 36 lancers, les séries chanceuses s'équilibrent toujours. C'est votre régularité stratégique qui fera craquer l'adversaire.",
    ],
    paragraphsEn: [
      '1. The 36 Dice Grid: With two six-sided dice, there are 6 × 6 = 36 possible outcomes. Champions never guess: they calculate how many rolls out of 36 achieve their goal or threaten the opponent.',
      '2. The Golden 5-Point: This is the single strongest asset on the board. Make point 5 whenever dice permit to deny your opponent their best rolls.',
      '3. Move in Pairs: Never leave an isolated blot within direct hitting distance (points 1 to 6, which appear frequently across the 36 combinations).',
      '4. Strike to Steal Tempo: Hitting an opponent checker banishes them to the roof, gaining an entire turn of racing momentum.',
      '5. Stay Composed: Across 36 combinations, lucky streaks always balance out. Your steady statistical consistency will outplay any opponent.',
    ],
    keyTakeawayFr: 'Maîtrisez les 36 combinaisons, faites la case 5, et les mathématiques feront le reste.',
    keyTakeawayEn: 'Master the 36 combinations, secure point 5, and the mathematics will do the rest.',
    highlightPoints: [5, 20],
  },
];
