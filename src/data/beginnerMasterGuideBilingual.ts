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
    badgeFr: 'Philosophie du Jeu',
    badgeEn: 'Game Philosophy',
    titleFr: '1. Pourquoi le Backgammon est de la pure Stratégie et non du Hasard',
    titleEn: '1. Why Backgammon is Pure Strategy, Not Luck',
    summaryFr: "Les dés apportent l'inattendu, mais c'est la gestion du risque qui couronne le champion.",
    summaryEn: 'Dice bring variance, but probability management crowns the champion.',
    paragraphsFr: [
      "Le Backgammon a traversé plus de 5 000 ans d'histoire : des tombes royales d'Ur en Mésopotamie jusqu'aux luxueux salons de Monte-Carlo. Pourquoi les mêmes Grands Maîtres gagnent-ils année après année si les dés sont aléatoires ?",
      "Sur une manche, n'importe qui peut avoir de la chance. Mais sur un match ou une série de parties, tout le monde reçoit exactement les mêmes probabilités de dés. La différence fondamentale réside dans votre capacité à placer vos dames là où chaque dé futur sera une arme pour vous et un piège pour votre adversaire.",
      "Le joueur amateur subit les dés ; le maître du Backgammon prépare le terrain pour que n'importe quel lancer le serve. C'est l'art de dompter l'incertitude.",
    ],
    paragraphsEn: [
      'Backgammon spans over 5,000 years of royal heritage: from the Royal Tombs of Ur in Mesopotamia to the legendary palaces of Monte Carlo. Why do the exact same Grandmasters win consistently if dice rolls are random?',
      'Over a single game, anyone can get lucky. But over a match or tournament, both players receive identical dice probabilities. The crucial distinction lies in checker placement: making every future roll an asset for you and a liability for your rival.',
      'Amateurs blame the dice; true strategists build positions where almost any roll delivers value. This is the supreme art of mastering uncertainty.',
    ],
    keyTakeawayFr: "Règle d'or : Vous ne contrôlez pas les dés, mais vous contrôlez à 100 % vos décisions.",
    keyTakeawayEn: 'Golden Rule: You cannot control the dice, but you control 100% of your decisions.',
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
      'Le plateau compte 24 flèches triangulaires. Vos 15 pions blancs démarrent répartis sur le plateau et cheminent en fer à cheval vers votre Jan intérieur (flèches 1 à 6).',
      'Un pion seul sur une flèche est un "blot" : s\'il est frappé par un pion adverse, il est banni sur la barre centrale et perd un temps précieux.',
      'Deux pions ou plus sur la même case forment une "porte" : un sanctuaire imprenable où l\'adversaire ne peut ni vous frapper, ni poser le moindre pion.',
    ],
    paragraphsEn: [
      'The board consists of 24 triangular points. Your 15 checkers embark on a horseshoe journey towards your home board (points 1 to 6).',
      'A single checker on a point is a "blot": if hit by an enemy checker, it is sent to the central bar, forfeiting vital race tempo.',
      'Two or more checkers together establish a "gate" (made point): a fortified stronghold where the opponent can neither hit you nor land.',
    ],
    keyTakeawayFr: 'Construisez des portes pour verrouiller votre camp et avancez en meute sans laisser de pions isolés.',
    keyTakeawayEn: 'Build points to lock your home board and advance in pairs without exposing isolated blots.',
    highlightPoints: [1, 2, 3, 4, 5, 6, 20],
  },
  {
    id: 'doubling_cube_secrets',
    badgeFr: "L'Arme Secrète",
    badgeEn: 'The Secret Weapon',
    titleFr: '3. Le Videau (Doubling Cube) : Le Dé qui Dompte les Dés',
    titleEn: '3. The Doubling Cube: The Die That Masters Luck',
    summaryFr: "Ce gros dé gravé 2, 4, 8, 16, 32, 64 permet de doubler la mise et d'abréger une manche gagnée.",
    summaryEn: 'This large die marked 2, 4, 8, 16, 32, 64 raises stakes and secures won positions early.',
    paragraphsFr: [
      "Le videau est l'invention moderne qui a révolutionné le Backgammon au XXe siècle. Au début de votre tour, avant de lancer les dés (:00:), si vous sentez que votre position a pris un bel avantage, vous pouvez proposer le videau à 2.",
      "Votre adversaire se retrouve alors face à un dilemme psychologique : accepter (Take) et jouer pour 2 points, ou refuser immédiatement (Drop / Pass) et vous concéder 1 point sans risquer davantage.",
      "Savoir quand doubler permet de convertir une supériorité stratégique en victoire mathématique sans laisser aux dés le temps de se retourner contre vous.",
    ],
    paragraphsEn: [
      'The doubling cube revolutionized 20th-century Backgammon. At the start of your turn, before rolling the dice (:00:), if your position holds a distinct advantage, you can propose to double the stakes to 2.',
      'Your opponent faces a critical crossroad: accept (Take) and battle for 2 points, or decline (Drop / Pass) conceding 1 point immediately.',
      'Knowing when to double converts strategic dominance into guaranteed points before the dice can swing against you.',
    ],
    keyTakeawayFr: 'Proposez le videau quand votre avantage est net ; refusez-le si vos chances de retour tombent sous 25 %.',
    keyTakeawayEn: 'Offer the cube when holding a strong advantage; drop if your winning chances fall below 25%.',
    highlightCube: true,
  },
  {
    id: 'match_vs_money_game',
    badgeFr: 'Format de Jeu',
    badgeEn: 'Game Formats',
    titleFr: '4. Match vs Money Game & Les Championnats du Monde',
    titleEn: '4. Match Play vs Money Game & World Championships',
    summaryFr: 'Pourquoi la stratégie change radicalement entre un tournoi à Monte-Carlo et une partie libre.',
    summaryEn: 'Why strategy shifts dramatically between tournament match play and money play.',
    paragraphsFr: [
      'En Money Game (partie libre), chaque point gagné ou perdu a la même valeur monétaire. Un Gammon rapporte 2x la mise et un Backgammon 3x.',
      'En Match Play (tournoi de Monte-Carlo, parties en 3, 5, 7 ou 11 points), seul compte le score global. Dès qu\'un joueur est à 1 point de la victoire, la manche suivante applique la "Règle Crawford" : interdiction formelle d\'utiliser le videau sur cette manche !',
      'Aux Championnats du Monde de Monte-Carlo, les joueurs adaptent chaque décision au score exact du match. Une prise de risque insensée en partie libre peut devenir le coup parfait en fin de tournoi.',
    ],
    paragraphsEn: [
      'In Money Play, each point won or lost has direct, identical value. A gammon pays 2x and a backgammon pays 3x.',
      'In Match Play (Monte Carlo World Championships, 3, 5, 7, or 11-point matches), overall score is paramount. When a leader reaches 1 point from victory, the next game triggers the "Crawford Rule": doubling is forbidden for that single game!',
      'At world-class tournaments, every cube and checker move strictly adjusts to the match score scoreboard.',
    ],
    keyTakeawayFr: 'En match, surveillez toujours le score restant avant de risquer un gammon ou de doubler.',
    keyTakeawayEn: 'In match play, always track distance to score before risking a gammon or turning the cube.',
  },
  {
    id: 'blunder_and_pr_demystified',
    badgeFr: 'Vérité Mathématique',
    badgeEn: 'Mathematical Truth',
    titleFr: "5. Qu'est-ce qu'un Blunder & Le Niveau d'Erreur (PR / ER) ?",
    titleEn: '5. Demystifying Blunders & Performance Rating (PR / ER)',
    summaryFr: 'Comprendre ces mots techniques pour mesurer ses progrès comme un grand maître.',
    summaryEn: 'Understanding key analytics terms to track personal progress like a grandmaster.',
    paragraphsFr: [
      'Ne soyez pas effrayé par le mot "Blunder" : ce n\'est ni une honte, ni une fatalité ! C\'est simplement une gaffe tactique où vous perdez une fraction appréciable de vos chances de victoire (par exemple en laissant une dame frappable inutilement).',
      "Le Niveau d'Erreur (PR / ER) est votre note de précision officielle calculée par les réseaux neuronaux Champions du Monde (Open Sage & GNU Backgammon).",
      'Contrairement aux classements habituels, plus votre PR est bas, plus votre jeu est pur ! Un PR de 0 à 3 correspond aux champions du monde, 4 à 8 aux joueurs de club chevronnés, et 15 à 25 aux joueurs en plein apprentissage.',
    ],
    paragraphsEn: [
      'Do not fear the word "Blunder": it is neither a disgrace nor a failure! It simply denotes a missed tactical opportunity that forfeits winning equity (like leaving an unnecessary loose blot).',
      'The Performance Rating (PR / ER) is your official precision benchmark calculated by world-class neural networks (Open Sage & GNU Backgammon).',
      'Unlike classic ratings, a lower PR reflects purer play! A PR between 0 and 3 equals World Champion caliber, 4 to 8 marks club players, and 15 to 25 represents active learners.',
    ],
    keyTakeawayFr: 'Un blunder identifié et compris est une victoire immédiate pour votre progression future.',
    keyTakeawayEn: 'A blunder identified and understood is an immediate leap in your future playing strength.',
  },
  {
    id: 'five_golden_secrets',
    badgeFr: 'Astuces de Champions',
    badgeEn: 'Master Tips',
    titleFr: '6. Les 5 Secrets pour Gagner dès Vos Premières Parties',
    titleEn: '6. The 5 Golden Secrets to Win Your Very First Matches',
    summaryFr: 'Cinq repères visuels simples pour dominer vos adversaires immédiatement.',
    summaryEn: 'Five simple visual keys to command the board immediately.',
    paragraphsFr: [
      "1. La Porte 5 d'Or : C'est la flèche la plus puissante du jeu. Fermez la flèche 5 adverse ou la vôtre dès que vos dés l'autorisent.",
      "2. La Règle de la Course : Si vous avez de l'avance aux pips, fuyez et évitez les contacts. Si vous êtes en retard, maintenez le contact et bâtissez une muraille !",
      "3. Deux par deux : Ne laissez jamais un blot vulnérable si vous n'avez pas une compensation majeure (comme frapper un pion adverse).",
      '4. Attaquez en zone ennemie : Frapper un pion adverse envoie son armée au point de départ et vous fait gagner un tour complet.',
      "5. Ne paniquez pas sur les doubles adverses : Les dés oscillent sans cesse, c'est votre calme qui fera craquer l'adversaire.",
    ],
    paragraphsEn: [
      '1. The Golden 5-Point: This is the single strongest asset on the board. Make point 5 whenever dice permit.',
      '2. The Race Principle: When leading in pip count, disengage and race. When trailing, hold anchors and build a prime!',
      '3. Move in Pairs: Avoid leaving loose blots unless gaining substantial tactical leverage (like hitting enemy checkers).',
      '4. Strike in the Outfield: Hitting an opponent checker banishes them to the roof, gaining a full tempo advantage.',
      '5. Stay Composed: Dice variance swings both ways; emotional resilience outlasts hot streaks.',
    ],
    keyTakeawayFr: 'Faites la case 5, avancez vos pions deux par deux, et le jeu sera naturellement vôtre.',
    keyTakeawayEn: 'Secure the 5-point, move checkers in pairs, and the board is naturally yours.',
    highlightPoints: [5, 20],
  },
];

