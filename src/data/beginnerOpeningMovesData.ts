/**
 * @file src/data/beginnerOpeningMovesData.ts
 * @description Les 15 lancers de départ du backgammon certifiés 3-ply, répartis en 3 familles.
 * Bilingue FR / EN, notation standard et conseils pédagogiques immédiats.
 */

export interface OpeningMove {
  readonly roll: [number, number];
  readonly id: string;
  readonly family: 'GATES' | 'RUNNING' | 'BUILDING';
  readonly notation: string;
  readonly titleFr: string;
  readonly titleEn: string;
  readonly explanationFr: string;
  readonly explanationEn: string;
  readonly moveFromTo: Array<{ from: number; to: number }>;
}

export const OPENING_FAMILIES = {
  GATES: {
    labelFr: '🏛️ Les Lancers Royaux (Bâtir une Porte)',
    labelEn: '🏛️ Royal Rolls (Make a Gate)',
    color: 'from-amber-500/20 to-amber-900/30 border-amber-500/40 text-amber-300',
  },
  RUNNING: {
    labelFr: "🏃 Les Lancers de Course & d'Évasion",
    labelEn: '🏃 Running & Escaping Rolls',
    color: 'from-emerald-500/20 to-emerald-900/30 border-emerald-500/40 text-emerald-300',
  },
  BUILDING: {
    labelFr: '🔨 Les Lancers de Construction & Split',
    labelEn: '🔨 Constructing & Splitting Rolls',
    color: 'from-sky-500/20 to-sky-900/30 border-sky-500/40 text-sky-300',
  },
} as const;

export const OPENING_MOVES: OpeningMove[] = [
  // 1. Les Lancers Royaux
  {
    roll: [3, 1],
    id: '3-1',
    family: 'GATES',
    notation: '8/5, 6/5',
    titleFr: "Le Coup d'Or absolu (Case 5)",
    titleEn: 'The Golden Point (5-Point)',
    explanationFr: 'Ferme la case 5, la flèche la plus précieuse du jeu pour bloquer l’adversaire.',
    explanationEn: 'Makes the 5-point, the single most valuable point on the board to trap opponent.',
    moveFromTo: [{ from: 8, to: 5 }, { from: 6, to: 5 }],
  },
  {
    roll: [4, 2],
    id: '4-2',
    family: 'GATES',
    notation: '8/4, 6/4',
    titleFr: 'La Porte 4 (Maison forte)',
    titleEn: 'The 4-Point (Solid Home)',
    explanationFr: 'Ferme la case 4 sans risque pour construire votre forteresse intérieure.',
    explanationEn: 'Safely creates the 4-point to build up your inner board strength.',
    moveFromTo: [{ from: 8, to: 4 }, { from: 6, to: 4 }],
  },
  {
    roll: [5, 3],
    id: '5-3',
    family: 'GATES',
    notation: '8/3, 6/3',
    titleFr: 'La Porte 3 (Attaque profonde)',
    titleEn: 'The 3-Point (Deep Strike)',
    explanationFr: 'Crée une porte solide en case 3 tout en dégageant les dames de réserve.',
    explanationEn: 'Establishes a solid anchor on the 3-point utilizing spare checkers.',
    moveFromTo: [{ from: 8, to: 3 }, { from: 6, to: 3 }],
  },
  {
    roll: [6, 1],
    id: '6-1',
    family: 'GATES',
    notation: '13/7, 8/7',
    titleFr: 'La Barre (Case 7 / Bar-Point)',
    titleEn: 'The Bar-Point (7-Point)',
    explanationFr: 'Ferme la case 7 (la barre) pour dresser une barrière imprenable contre les dames adverses.',
    explanationEn: 'Makes the bar-point (7-point) to build an impenetrable barrier against enemy checkers.',
    moveFromTo: [{ from: 13, to: 7 }, { from: 8, to: 7 }],
  },

  // 2. Les Lancers de Course & d'Évasion
  {
    roll: [6, 5],
    id: '6-5',
    family: 'RUNNING',
    notation: '24/13',
    titleFr: "Le Saut de l'Amoureux (Lover's Leap)",
    titleEn: "Lover's Leap (24/13)",
    explanationFr: 'Échappe un pion lointain de la case 24 directement vers la sécurité en case 13.',
    explanationEn: 'Escapes a deep back checker directly from 24 to the safety of the midpoint 13.',
    moveFromTo: [{ from: 24, to: 13 }],
  },
  {
    roll: [6, 4],
    id: '6-4',
    family: 'RUNNING',
    notation: '24/14 ou 24/18, 13/9',
    titleFr: 'Grande Évasion ou Construction',
    titleEn: 'High Escape or Construction',
    explanationFr: 'Fait courir un pion en case 14 ou avance en 18 tout en préparant les portes extérieures.',
    explanationEn: 'Runs a back checker out to 14 or splits to 18 while preparing outer builders.',
    moveFromTo: [{ from: 24, to: 14 }],
  },
  {
    roll: [6, 3],
    id: '6-3',
    family: 'RUNNING',
    notation: '24/15 ou 24/18, 13/10',
    titleFr: 'Course rapide 24/15',
    titleEn: 'Swift Escape 24/15',
    explanationFr: 'Sort un pion arriéré ou prépare une embuscade avancée.',
    explanationEn: 'Escapes a rear checker or sets up an advanced anchor.',
    moveFromTo: [{ from: 24, to: 15 }],
  },
  {
    roll: [6, 2],
    id: '6-2',
    family: 'RUNNING',
    notation: '24/18, 13/11',
    titleFr: 'Avance tactique & Éclaireur',
    titleEn: 'Tactical Split & Builder',
    explanationFr: 'Place un éclaireur sur la barre adverse (18) et prépare le terrain en 11.',
    explanationEn: 'Spots a checker on opponent bar-point (18) and drops a builder on 11.',
    moveFromTo: [{ from: 24, to: 18 }, { from: 13, to: 11 }],
  },
  {
    roll: [5, 2],
    id: '5-2',
    family: 'RUNNING',
    notation: '13/8, 13/11 ou 24/22, 13/8',
    titleFr: 'Déploiement flexible',
    titleEn: 'Flexible Deployment',
    explanationFr: 'Ramène du matériel offensif vers la maison sans offrir de cible facile.',
    explanationEn: 'Brings active builders into the offensive zone without offering easy hits.',
    moveFromTo: [{ from: 13, to: 8 }, { from: 13, to: 11 }],
  },

  // 3. Les Lancers de Construction & Split
  {
    roll: [4, 3],
    id: '4-3',
    family: 'BUILDING',
    notation: '13/9, 24/21 ou 13/10, 13/9',
    titleFr: 'Le Split & Builder moderne',
    titleEn: 'Modern Split & Builder',
    explanationFr: 'Scinde les arrières pour contester le terrain et place un bâtisseur en 9.',
    explanationEn: 'Splits rear checkers to contest the board while placing a builder on 9.',
    moveFromTo: [{ from: 13, to: 9 }, { from: 24, to: 21 }],
  },
  {
    roll: [5, 4],
    id: '5-4',
    family: 'BUILDING',
    notation: '13/8, 24/20 ou 13/8, 13/9',
    titleFr: 'Visée de la case 20 adverse',
    titleEn: 'Targeting Enemy 20-Point',
    explanationFr: 'Place une dame en embuscade en 20 et renforce le bastion en 8.',
    explanationEn: 'Threatens the key 20-point anchor while reinforcing the 8-point.',
    moveFromTo: [{ from: 13, to: 8 }, { from: 24, to: 20 }],
  },
  {
    roll: [5, 1],
    id: '5-1',
    family: 'BUILDING',
    notation: '13/8, 24/23',
    titleFr: 'Renfort 13/8 & Petit Split',
    titleEn: 'Reinforce 13/8 & Small Split',
    explanationFr: 'Solidifie la case 8 et prépare une porte d’ancrage en 23.',
    explanationEn: 'Strengthens the 8-point builder and prepares an anchor on 23.',
    moveFromTo: [{ from: 13, to: 8 }, { from: 24, to: 23 }],
  },
  {
    roll: [4, 1],
    id: '4-1',
    family: 'BUILDING',
    notation: '13/9, 24/23',
    titleFr: 'Bâtisseur en 9 & Split',
    titleEn: 'Builder on 9 & Split',
    explanationFr: 'Place un bâtisseur parfait en 9 pour viser la case 5 au coup suivant.',
    explanationEn: 'Drops a prime builder on 9 to target making the 5-point on the next turn.',
    moveFromTo: [{ from: 13, to: 9 }, { from: 24, to: 23 }],
  },
  {
    roll: [3, 2],
    id: '3-2',
    family: 'BUILDING',
    notation: '13/10, 24/22 ou 13/11, 24/21',
    titleFr: 'Double menace extérieure',
    titleEn: 'Dual Outer Threat',
    explanationFr: 'Un coup classique qui diversifie vos options d’attaque et de défense.',
    explanationEn: 'A classic play that diversifies both offensive and defensive threats.',
    moveFromTo: [{ from: 13, to: 10 }, { from: 24, to: 22 }],
  },
  {
    roll: [2, 1],
    id: '2-1',
    family: 'BUILDING',
    notation: '13/11, 24/23',
    titleFr: 'Placement subtil & Découverte',
    titleEn: 'Subtle Placement & Split',
    explanationFr: 'Un petit lancer adroit pour débuter la construction sans trop s’exposer.',
    explanationEn: 'A nimble roll to initiate construction while limiting risk of being hit.',
    moveFromTo: [{ from: 13, to: 11 }, { from: 24, to: 23 }],
  },
];

