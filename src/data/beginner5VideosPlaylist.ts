export interface VideoChapterCue {
  id: string;
  startSec: number;
  durationSec: number;
  frText: string;
  enText: string;
  highlightPoints?: number[];      // Pointes ciblées de la Maison d'arrivée
  highlightBar?: boolean;          // Illumination barre centrale
  highlightCube?: boolean;         // Illumination videau
  boardAction?: 'BEAR_OFF' | 'PRIME' | 'HIT' | 'ANCHOR' | 'INTRO';
}

export interface BeginnerVideoEpisode {
  id: number;
  titleFr: string;
  titleEn: string;
  durationLabel: string; // "25s"
  descriptionFr: string;
  descriptionEn: string;
  cues: VideoChapterCue[];
}

export const BEGINNER_5_VIDEOS_PLAYLIST: BeginnerVideoEpisode[] = [
  {
    id: 1,
    titleFr: "Épisode 1 : Le But Ultime & L'Alliance Hasard-Stratégie",
    titleEn: "Episode 1: The Goal & Luck-Strategy Alliance",
    durationLabel: "25s",
    descriptionFr: "Comment traverser le plateau et pourquoi la stratégie gouverne le hasard sur la durée.",
    descriptionEn: "How to navigate the 24 points and why strategy governs luck over time.",
    cues: [
      {
        id: "e1-1",
        startSec: 0,
        durationSec: 8,
        frText: "Bienvenue au Backgammon ! Le jeu marie avec passion hasard et stratégie : sur une manche la chance sourit, mais vos choix décident de la victoire !",
        enText: "Welcome to Backgammon! The game blends luck and strategy: in one game luck can swing, but your choices decide the match!",
        highlightPoints: [1, 2, 3, 4, 5, 6],
        boardAction: 'INTRO',
      },
      {
        id: "e1-2",
        startSec: 8,
        durationSec: 9,
        frText: "Vos pions avancent en fer à cheval, de la flèche 24 tout là-bas jusqu'à votre maison flèches 1 à 6.",
        enText: "Checkers advance in a horseshoe trajectory from point 24 straight to your home board 1 to 6.",
        highlightPoints: [24, 20, 13, 8, 6, 1],
      },
      {
        id: "e1-3",
        startSec: 17,
        durationSec: 8,
        frText: "Dès que vos 15 pions sont à la maison, vous commencez à les sortir. Le premier qui sort tout gagne la partie !",
        enText: "Once all 15 checkers are home, you can bear them off. First player to bear off wins!",
        highlightPoints: [1, 2, 3, 4, 5, 6],
        boardAction: 'BEAR_OFF',
      },
    ],
  },
  {
    id: 2,
    titleFr: "Épisode 2 : L'Attaque & La Barre Centrale",
    titleEn: "Episode 2: Hitting & The Central Bar",
    durationLabel: "28s",
    descriptionFr: "Un pion seul est vulnérable : frappez-le et renvoyez-le sur la barre !",
    descriptionEn: "A single checker is vulnerable: hit it and send it to the roof!",
    cues: [
      {
        id: "e2-1",
        startSec: 0,
        durationSec: 9,
        frText: "Quand un pion adverse est tout seul sur une flèche, il est vulnérable : vous pouvez le frapper !",
        enText: "When an opponent checker stands alone on a point, it is vulnerable: you can hit it!",
        highlightPoints: [20],
      },
      {
        id: "e2-2",
        startSec: 9,
        durationSec: 10,
        frText: "Si vous atterrissez dessus, vous le frappez ! Le pion capturé monte sur la barre centrale.",
        enText: "Land on it to hit! The captured checker is banished to the center bar.",
        highlightBar: true,
        boardAction: 'HIT',
      },
      {
        id: "e2-3",
        startSec: 19,
        durationSec: 9,
        frText: "Tant qu'il est sur la barre, votre adversaire doit obligatoirement rentrer par vos dés avant de pouvoir rejouer.",
        enText: "While on the bar, your opponent must enter into your home board before moving anywhere else.",
        highlightPoints: [19, 20, 21, 22, 23, 24],
      },
    ],
  },
  {
    id: 3,
    titleFr: "Épisode 3 : Les Portes & La Sécurité (La Porte 5 d'Or)",
    titleEn: "Episode 3: Making Points & The Golden 5-Point",
    durationLabel: "27s",
    descriptionFr: "Deux pions ensemble forment une forteresse infranchissable.",
    descriptionEn: "Two checkers together build an impregnable gate.",
    cues: [
      {
        id: "e3-1",
        startSec: 0,
        durationSec: 9,
        frText: "Deux pions de votre couleur sur la même flèche créent une 'porte' : l'adversaire ne peut ni vous frapper, ni s'y poser !",
        enText: "Two checkers on the same point make a gate: your opponent cannot hit you nor land there!",
        highlightPoints: [5],
        boardAction: 'ANCHOR',
      },
      {
        id: "e3-2",
        startSec: 9,
        durationSec: 9,
        frText: "La flèche 5 est surnommée la 'Porte d'Or' : elle bloque la sortie adverse et sécurise votre camp.",
        enText: "The 5-point is the Golden Point: it traps opponent checkers and fortifies your home.",
        highlightPoints: [5, 20],
      },
      {
        id: "e3-3",
        startSec: 18,
        durationSec: 9,
        frText: "Alignez plusieurs portes consécutives pour bâtir un 'Prime' : une véritable muraille infranchissable !",
        enText: "Chain several gates to create a 'Prime': an impassable great wall!",
        highlightPoints: [4, 5, 6, 7, 8],
        boardAction: 'PRIME',
      },
    ],
  },
  {
    id: 4,
    titleFr: "Épisode 4 : La Sortie des Pions (Bear-off)",
    titleEn: "Episode 4: Bearing Off Checkers",
    durationLabel: "26s",
    descriptionFr: "Comment transformer vos dés en victoire finale lors du bear-off.",
    descriptionEn: "Convert your dice into victory during the final bear-off phase.",
    cues: [
      {
        id: "e4-1",
        startSec: 0,
        durationSec: 8,
        frText: "Règle essentielle : aucun pion ne peut être sorti tant que tous vos 15 pions ne sont pas dans les flèches 1 à 6.",
        enText: "Crucial rule: no checker can be borne off until all 15 checkers reach points 1 to 6.",
        highlightPoints: [1, 2, 3, 4, 5, 6],
      },
      {
        id: "e4-2",
        startSec: 8,
        durationSec: 9,
        frText: "Chaque dé vous permet de sortir un pion de la flèche correspondante : un 6 sort un pion de la case 6 !",
        enText: "Each die removes a checker from that exact point: rolling a 6 removes a checker from point 6!",
        highlightPoints: [6],
        boardAction: 'BEAR_OFF',
      },
      {
        id: "e4-3",
        startSec: 17,
        durationSec: 9,
        frText: "Si la case du dé est vide, vous avancez un pion ou sortez le pion le plus éloigné si aucun n'est derrière.",
        enText: "If that point is empty, advance from a higher point or bear off from the highest occupied point.",
        highlightPoints: [1, 2, 3, 4, 5, 6],
      },
    ],
  },
  {
    id: 5,
    titleFr: "Épisode 5 : Le Videau (Doubling Cube) & Les Points",
    titleEn: "Episode 5: The Doubling Cube & Match Points",
    durationLabel: "30s",
    descriptionFr: "Le dé numéroté 2, 4, 8, 16, 32, 64 qui multiplie les enjeux et sacre les champions.",
    descriptionEn: "The cube numbered 2, 4, 8, 16, 32, 64 that raises stakes and crowns champions.",
    cues: [
      {
        id: "e5-1",
        startSec: 0,
        durationSec: 10,
        frText: "Le videau est l'arme maîtresse du joueur stratégique. Avant de lancer vos dés, vous pouvez proposer de doubler la mise à 2 !",
        enText: "The doubling cube is the strategist's ultimate weapon. Before rolling, offer to double the stakes to 2!",
        highlightCube: true,
      },
      {
        id: "e5-2",
        startSec: 10,
        durationSec: 10,
        frText: "L'adversaire a deux choix : accepter le défi (Take) ou abandonner immédiatement en concédant 1 point (Drop / Pass).",
        enText: "Your opponent has two options: accept the challenge (Take) or forfeit immediately for 1 point (Drop / Pass).",
        highlightCube: true,
      },
      {
        id: "e5-3",
        startSec: 20,
        durationSec: 10,
        frText: "Maîtriser le videau selon l'adversaire (doubler plus tôt s'il fuit, attendre s'il prend trop tard) sacre les champions. C'est l'âme du Backgammon !",
        enText: "Mastering cube play against your rival (doubling earlier if timid, delaying if reckless) crowns true champions. This is the soul of Backgammon!",
        highlightCube: true,
      },
    ],
  },
];

