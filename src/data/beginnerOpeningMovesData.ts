/**
 * @file src/data/beginnerOpeningMovesData.ts
 * @description Les 15 lancers de départ du backgammon certifiés 3-ply, répartis en 3 familles pédagogiques.
 * Zéro chiffre de notation technique (8/5, 13/7) dans le vocabulaire débutant : 100 % visuel et naturel.
 * Strictement <= 400 lignes, 0 any.
 */

export interface OpeningMove {
  readonly roll: [number, number];
  readonly id: string;
  readonly family: 'GATES' | 'RUNNING' | 'BUILDING';
  readonly notation: string;
  readonly keywordFr: string;
  readonly keywordEn: string;
  readonly titleFr: string;
  readonly titleEn: string;
  readonly explanationFr: string;
  readonly explanationEn: string;
  readonly moveFromTo: Array<{ from: number; to: number }>;
}

export const OPENING_FAMILIES = {
  GATES: {
    labelFr: 'Bâtir une Porte (Bouclier)',
    labelEn: 'Make a Gate (Shield)',
    color: 'from-amber-500/20 to-amber-900/30 border-amber-500/40 text-amber-300',
  },
  RUNNING: {
    labelFr: 'Course & Grande Évasion',
    labelEn: 'Running & Great Escape',
    color: 'from-emerald-500/20 to-emerald-900/30 border-emerald-500/40 text-emerald-300',
  },
  BUILDING: {
    labelFr: 'Construction & Préparation',
    labelEn: 'Construction & Preparation',
    color: 'from-sky-500/20 to-sky-900/30 border-sky-500/40 text-sky-300',
  },
} as const;

export const COACH_GATE_EXPLANATION_FR =
  "Bâtissez une Porte imprenable ! Suivez les deux flèches dorées : en réunissant ces deux pions ensemble sur la même pointe, vous créez un bouclier solide. L'adversaire ne pourra ni s'y poser, ni frapper vos pions !";
export const COACH_GATE_EXPLANATION_EN =
  'Build an Impenetrable Gate! Follow the two golden arrows: by bringing these two checkers together on the same point, you create a solid shield. Your opponent cannot land there or hit your checkers!';

export const COACH_RUNNING_EXPLANATION_FR =
  "La Grande Évasion ! Suivez la longue flèche dorée pour faire fuir l'un de vos deux pions prisonniers au fond du camp adverse et le ramener en sécurité vers vos autres pions.";
export const COACH_RUNNING_EXPLANATION_EN =
  "The Great Escape! Follow the long golden arrow to free one of your trapped back checkers from the opponent's camp and bring it safely home.";

export const COACH_BUILDING_EXPLANATION_FR =
  'Préparez le terrain ! Comme les dés ne permettent pas de fermer une porte tout de suite, faites avancer vos pions du milieu et décollez un pion arrière en suivant les flèches dorées pour préparer une porte au prochain tour.';
export const COACH_BUILDING_EXPLANATION_EN =
  'Prepare the Ground! Since the dice cannot make a gate right now, advance your middle checkers and unstick a back checker along the golden arrows to prepare a gate for next turn.';

export const OPENING_MOVES: OpeningMove[] = [
  // 1. Les Lancers Royaux (Bâtir une Porte)
  {
    roll: [3, 1],
    id: '3-1',
    family: 'GATES',
    notation: '8/5, 6/5',
    keywordFr: 'Porte Royale',
    keywordEn: 'Golden Gate',
    titleFr: "Le Coup d'Or absolu",
    titleEn: 'The Golden Point',
    explanationFr: COACH_GATE_EXPLANATION_FR,
    explanationEn: COACH_GATE_EXPLANATION_EN,
    moveFromTo: [{ from: 8, to: 5 }, { from: 6, to: 5 }],
  },
  {
    roll: [4, 2],
    id: '4-2',
    family: 'GATES',
    notation: '8/4, 6/4',
    keywordFr: 'Maison Forte',
    keywordEn: 'Strong Home',
    titleFr: 'La Porte Intérieure',
    titleEn: 'The Solid Home Gate',
    explanationFr: COACH_GATE_EXPLANATION_FR,
    explanationEn: COACH_GATE_EXPLANATION_EN,
    moveFromTo: [{ from: 8, to: 4 }, { from: 6, to: 4 }],
  },
  {
    roll: [5, 3],
    id: '5-3',
    family: 'GATES',
    notation: '8/3, 6/3',
    keywordFr: 'Attaque Profonde',
    keywordEn: 'Deep Strike',
    titleFr: "L'Ancrage Profond",
    titleEn: 'The Deep Anchor',
    explanationFr: COACH_GATE_EXPLANATION_FR,
    explanationEn: COACH_GATE_EXPLANATION_EN,
    moveFromTo: [{ from: 8, to: 3 }, { from: 6, to: 3 }],
  },
  {
    roll: [6, 1],
    id: '6-1',
    family: 'GATES',
    notation: '13/7, 8/7',
    keywordFr: 'Grande Barre',
    keywordEn: 'The Bar-Point',
    titleFr: 'Le Bar-Point Imprenable',
    titleEn: 'The Impenetrable Bar',
    explanationFr: COACH_GATE_EXPLANATION_FR,
    explanationEn: COACH_GATE_EXPLANATION_EN,
    moveFromTo: [{ from: 13, to: 7 }, { from: 8, to: 7 }],
  },

  // 2. Les Lancers de Course & d'Évasion
  {
    roll: [6, 5],
    id: '6-5',
    family: 'RUNNING',
    notation: '24/13',
    keywordFr: "Saut de l'Amoureux",
    keywordEn: "Lover's Leap",
    titleFr: "Le Grand Saut d'Évasion",
    titleEn: 'The Great Escape Leap',
    explanationFr: COACH_RUNNING_EXPLANATION_FR,
    explanationEn: COACH_RUNNING_EXPLANATION_EN,
    moveFromTo: [{ from: 24, to: 13 }],
  },
  {
    roll: [6, 4],
    id: '6-4',
    family: 'RUNNING',
    notation: '24/14',
    keywordFr: 'Grande Évasion',
    keywordEn: 'Great Escape',
    titleFr: 'La Fuite Rapide',
    titleEn: 'The Swift Escape',
    explanationFr: COACH_RUNNING_EXPLANATION_FR,
    explanationEn: COACH_RUNNING_EXPLANATION_EN,
    moveFromTo: [{ from: 24, to: 14 }],
  },
  {
    roll: [6, 3],
    id: '6-3',
    family: 'RUNNING',
    notation: '24/15',
    keywordFr: 'Course Rapide',
    keywordEn: 'Fast Runner',
    titleFr: 'Le Dégagement Arrière',
    titleEn: 'The Rear Breakout',
    explanationFr: COACH_RUNNING_EXPLANATION_FR,
    explanationEn: COACH_RUNNING_EXPLANATION_EN,
    moveFromTo: [{ from: 24, to: 15 }],
  },
  {
    roll: [6, 2],
    id: '6-2',
    family: 'RUNNING',
    notation: '24/18, 13/11',
    keywordFr: 'Éclaireur Avancé',
    keywordEn: 'Advanced Scout',
    titleFr: "L'Éclaireur Tactique",
    titleEn: 'The Tactical Scout',
    explanationFr: COACH_RUNNING_EXPLANATION_FR,
    explanationEn: COACH_RUNNING_EXPLANATION_EN,
    moveFromTo: [{ from: 24, to: 18 }, { from: 13, to: 11 }],
  },

  // 3. Les Lancers de Construction & Split
  {
    roll: [5, 2],
    id: '5-2',
    family: 'BUILDING',
    notation: '13/8, 13/11',
    keywordFr: 'Avancer & Protéger',
    keywordEn: 'Advance & Shield',
    titleFr: 'Avancer & Protéger',
    titleEn: 'Advance & Shield',
    explanationFr: COACH_BUILDING_EXPLANATION_FR,
    explanationEn: COACH_BUILDING_EXPLANATION_EN,
    moveFromTo: [{ from: 13, to: 8 }, { from: 13, to: 11 }],
  },
  {
    roll: [4, 3],
    id: '4-3',
    family: 'BUILDING',
    notation: '13/9, 24/21',
    keywordFr: 'Avancée & Embuscade',
    keywordEn: 'Advance & Ambush',
    titleFr: 'Avancée & Embuscade',
    titleEn: 'Advance & Ambush',
    explanationFr: COACH_BUILDING_EXPLANATION_FR,
    explanationEn: COACH_BUILDING_EXPLANATION_EN,
    moveFromTo: [{ from: 13, to: 9 }, { from: 24, to: 21 }],
  },
  {
    roll: [5, 4],
    id: '5-4',
    family: 'BUILDING',
    notation: '13/8, 24/20',
    keywordFr: 'Visée Stratégique',
    keywordEn: 'Strategic Aim',
    titleFr: 'Visée Stratégique',
    titleEn: 'Strategic Aim',
    explanationFr: COACH_BUILDING_EXPLANATION_FR,
    explanationEn: COACH_BUILDING_EXPLANATION_EN,
    moveFromTo: [{ from: 13, to: 8 }, { from: 24, to: 20 }],
  },
  {
    roll: [5, 1],
    id: '5-1',
    family: 'BUILDING',
    notation: '13/8, 24/23',
    keywordFr: 'Renfort & Envol',
    keywordEn: 'Reinforce & Lift',
    titleFr: 'Renfort & Envol',
    titleEn: 'Reinforce & Lift',
    explanationFr: COACH_BUILDING_EXPLANATION_FR,
    explanationEn: COACH_BUILDING_EXPLANATION_EN,
    moveFromTo: [{ from: 13, to: 8 }, { from: 24, to: 23 }],
  },
  {
    roll: [4, 1],
    id: '4-1',
    family: 'BUILDING',
    notation: '13/9, 24/23',
    keywordFr: 'Bâtisseur Futur',
    keywordEn: 'Future Builder',
    titleFr: 'Le Bâtisseur Futur',
    titleEn: 'The Future Builder',
    explanationFr: COACH_BUILDING_EXPLANATION_FR,
    explanationEn: COACH_BUILDING_EXPLANATION_EN,
    moveFromTo: [{ from: 13, to: 9 }, { from: 24, to: 23 }],
  },
  {
    roll: [3, 2],
    id: '3-2',
    family: 'BUILDING',
    notation: '13/10, 24/22',
    keywordFr: 'Double Menace',
    keywordEn: 'Dual Threat',
    titleFr: 'La Double Menace',
    titleEn: 'The Dual Threat',
    explanationFr: COACH_BUILDING_EXPLANATION_FR,
    explanationEn: COACH_BUILDING_EXPLANATION_EN,
    moveFromTo: [{ from: 13, to: 10 }, { from: 24, to: 22 }],
  },
  {
    roll: [2, 1],
    id: '2-1',
    family: 'BUILDING',
    notation: '13/11, 24/23',
    keywordFr: 'Placement Prudent',
    keywordEn: 'Prudent Placement',
    titleFr: 'Placement Prudent',
    titleEn: 'Prudent Placement',
    explanationFr: COACH_BUILDING_EXPLANATION_FR,
    explanationEn: COACH_BUILDING_EXPLANATION_EN,
    moveFromTo: [{ from: 13, to: 11 }, { from: 24, to: 23 }],
  },
];
