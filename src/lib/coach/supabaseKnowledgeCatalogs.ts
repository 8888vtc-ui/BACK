/**
 * @file src/lib/coach/supabaseKnowledgeCatalogs.ts
 * @description Catalogues statiques certifiés (18 Motifs Géométriques XAI, 7 Formules de
 * Course/Videau & 15 Ouvertures 3-Ply) pour le Corpus Supabase du Coach Grand-Maître.
 * Strictement < 350 lignes, 0 `any`.
 */

import type { MotifId } from '../../features/coach/detectPositionalMotif';
import type { CorpusDominantTheme } from './supabaseKnowledgeCorpus';

export const POSITIONAL_MOTIFS_CATALOG: ReadonlyArray<{
    readonly motifId: MotifId;
    readonly theme: CorpusDominantTheme;
    readonly titleFr: string;
    readonly titleEn: string;
    readonly summaryFr: string;
    readonly summaryEn: string;
    readonly goldenRuleFr: string;
    readonly goldenRuleEn: string;
}> = [
    {
        motifId: 'BLITZ_HIT_AND_COVER',
        theme: 'BLITZ',
        titleFr: 'Blitz — Frapper et Couvrir au Jan Intérieur',
        titleEn: 'Blitz — Hit and Cover in the Home Board',
        summaryFr: 'Frappe un blot adverse dans le jan intérieur tout en sécurisant une nouvelle porte.',
        summaryEn: 'Hits an opponent blot inside the home board while securing a new inner point.',
        goldenRuleFr: 'En Blitz, chaque pion adverse sur la barre combiné à une porte supplémentaire multiplie les menaces de gammon.',
        goldenRuleEn: 'In a Blitz, every opponent checker on the bar paired with a new home-board point multiplies gammon threats.',
    },
    {
        motifId: 'EXTEND_PRIME_WALL',
        theme: 'PRIME',
        titleFr: 'Extension de la Prime (Mur de Portes Consécutives)',
        titleEn: 'Extending the Prime Wall',
        summaryFr: 'Allonge une barricade de portes consécutives (4-prime, 5-prime ou 6-prime) devant les pions arrières adverses.',
        summaryEn: 'Extends a consecutive wall of points (4-prime, 5-prime, or 6-prime) in front of opponent back checkers.',
        goldenRuleFr: 'Une prime de 5 portes consécutives paralyse quasi totalement l’évasion des pions arrières adverses.',
        goldenRuleEn: 'A 5-point consecutive prime nearly paralyzes opponent back-checker escape.',
    },
    {
        motifId: 'MAKE_KEY_POINT_5_4_7',
        theme: 'PRIME',
        titleFr: 'Construction d’une Porte Clé (Point 5, Bar-Point 7 ou Point 4)',
        titleEn: 'Making a Key Strategic Point (5-Point, Bar-Point 7, or 4-Point)',
        summaryFr: 'Verrouille l’une des trois portes stratégiques majeures sans laisser de faiblesse structurelle.',
        summaryEn: 'Locks one of the three highest-value strategic points without structural weakness.',
        goldenRuleFr: 'La porte du 5 est le joyau de la couronne : qui contrôle le point 5 contrôle la partie.',
        goldenRuleEn: 'The 5-point is the crown jewel: whoever commands the 5-point commands the game.',
    },
    {
        motifId: 'SECURE_ADVANCED_ANCHOR',
        theme: 'HOLDING',
        titleFr: 'Sécurisation d’une Ancre Avancée (Points 20, 21 ou 18)',
        titleEn: 'Securing an Advanced Anchor (20, 21, or 18-Point)',
        summaryFr: 'Établit une porte défensive haute dans le jan intérieur ou au bar-point adverse.',
        summaryEn: 'Establishes a high defensive anchor in the opponent inner board or bar-point.',
        goldenRuleFr: 'Une ancre avancée sur le point 20 ou 21 neutralise le Blitz adverse et garantit un palier de réentrée.',
        goldenRuleEn: 'An advanced 20 or 21-point anchor neutralizes opponent Blitz and guarantees reentry.',
    },
    {
        motifId: 'TEMPO_HIT_OUTFIELD',
        theme: 'BLITZ',
        titleFr: 'Frappe de Tempo dans le Champ Extérieur',
        titleEn: 'Outfield Tempo Hit',
        summaryFr: 'Frappe un pion adverse en transit pour voler un demi-tour de développement.',
        summaryEn: 'Hits a blot in the outfield to steal a half-turn of development tempo.',
        goldenRuleFr: 'Frapper à l’extérieur force l’adversaire à dépenser un dé sur la barre au lieu de construire.',
        goldenRuleEn: 'Hitting in the outfield forces the opponent to spend a die entering from the bar instead of building.',
    },
    {
        motifId: 'DIRECT_VS_INDIRECT_SHOT',
        theme: 'HOLDING',
        titleFr: 'Arbitrage Tir Direct (≤ 6) vs Tir Indirect (≥ 7)',
        titleEn: 'Direct Shot (≤ 6) vs Indirect Shot (≥ 7) Trade-off',
        summaryFr: 'Minimise l’exposition en plaçant les blots hors de portée directe (distance ≥ 7 pips).',
        summaryEn: 'Minimizes blot exposure by placing checkers at indirect distance (≥ 7 pips).',
        goldenRuleFr: 'Ne laissez jamais un tir direct (11 à 17 lancers sur 36) quand un tir indirect (1 à 6 lancers) suffit.',
        goldenRuleEn: 'Never leave a direct shot (11–17 rolls) when an indirect shot (1–6 rolls) is available.',
    },
    {
        motifId: 'EXACT_DICE_DUPLICATION',
        theme: 'HOLDING',
        titleFr: 'Duplication Exacte des Dés Adverses',
        titleEn: 'Exact Opponent Dice Duplication',
        summaryFr: 'Fait dépendre plusieurs objectifs adverses (frapper, entrer, couvrir) du même chiffre de dé.',
        summaryEn: 'Forces multiple opponent goals (hitting, entering, covering) to require the exact same die number.',
        goldenRuleFr: 'La duplication réduit drastiquement le nombre de lancers constructifs adverses sur les 36 possibles.',
        goldenRuleEn: 'Duplication drastically reduces the opponent’s constructive rolls out of 36.',
    },
    {
        motifId: 'INTENTIONAL_SLOTTING',
        theme: 'PRIME',
        titleFr: 'Slotting Intentionnel (Placement Proactif d’un Bâtisseur)',
        titleEn: 'Intentional Slotting',
        summaryFr: 'Dépose volontairement un pion isolé sur une flèche clé pour la couvrir au tour suivant.',
        summaryEn: 'Proactively places a single checker on a key point to cover it on the next roll.',
        goldenRuleFr: 'Slottez quand l’adversaire a peu de tirs directs ou a déjà des pions sur la barre.',
        goldenRuleEn: 'Slot when the opponent has few direct shots or already has checkers on the bar.',
    },
    {
        motifId: 'ESCAPE_LAST_RUNNER',
        theme: 'RACE',
        titleFr: 'Évasion du Dernier Coureur Arrière',
        titleEn: 'Escaping the Last Back Runner',
        summaryFr: 'Libère le dernier pion arrière pour convertir la partie en course ou en jeu de retenue favorable.',
        summaryEn: 'Frees the last rear checker to convert the game into a favorable race or holding game.',
        goldenRuleFr: 'En tête à la course, la priorité absolue est d’évader le dernier pion arrière.',
        goldenRuleEn: 'When ahead in the race, the top priority is escaping the last back checker.',
    },
    {
        motifId: 'SPLIT_VS_STACK_BACK',
        theme: 'PRIME',
        titleFr: 'Séparation des Pions Arrières (Split vs Regroupement)',
        titleEn: 'Splitting vs Stacking Back Checkers',
        summaryFr: 'Sépare les deux pions du point 24 pour menacer une ancre avancée et diversifier les sorties.',
        summaryEn: 'Splits the back checkers from the 24-point to threaten an advanced anchor and diversify escapes.',
        goldenRuleFr: 'Séparez les pions arrières tôt si le jan intérieur adverse est encore faible.',
        goldenRuleEn: 'Split back checkers early while the opponent inner board is still weak.',
    },
    {
        motifId: 'UNSTACK_MIDPOINT',
        theme: 'PRIME',
        titleFr: 'Dégorgement du Point Médian 13 (Break the Mountain)',
        titleEn: 'Unstacking the Midpoint 13 (Break the Mountain)',
        summaryFr: 'Libère les pions excédentaires de la tour du 13 ou du 6 pour créer des bâtisseurs actifs.',
        summaryEn: 'Frees excess checkers from the 13 or 6-point tower to create active builders.',
        goldenRuleFr: 'Un chandelier de 5 pions sur le point 6 ou 13 stérilise votre flexibilité.',
        goldenRuleEn: 'A 5-checker candlestick on point 6 or 13 sterilizes your flexibility.',
    },
    {
        motifId: 'BRING_DOWN_BUILDERS',
        theme: 'PRIME',
        titleFr: 'Descente de Bâtisseurs dans la Zone d’Attaque (Points 8-11)',
        titleEn: 'Bringing Down Builders into the Attack Zone (Points 8–11)',
        summaryFr: 'Achemine des munitions du point 13 vers les flèches 11, 10, 9 et 8.',
        summaryEn: 'Brings ammunition from the midpoint into points 11, 10, 9, and 8.',
        goldenRuleFr: 'On ne construit pas de portes intérieures sans munitions entre les flèches 8 et 11.',
        goldenRuleEn: 'You cannot make inner points without builders staged on points 8 to 11.',
    },
    {
        motifId: 'BACKGAME_DOUBLE_ANCHOR',
        theme: 'HOLDING',
        titleFr: 'Synchronisation de Backgame à Double Ancre',
        titleEn: 'Double-Anchor Backgame Synchronization',
        summaryFr: 'Maintient deux ancres profondes (ex: 22-23 ou 21-23) tout en préservant le timing.',
        summaryEn: 'Maintains two deep anchors (e.g., 22-23 or 21-23) while preserving timing.',
        goldenRuleFr: 'En backgame, ne précipitez pas votre course : préservez votre timing pour frapper au dégagement.',
        goldenRuleEn: 'In a backgame, do not rush the race: preserve timing to hit when the opponent bears in.',
    },
    {
        motifId: 'HOLDING_GAME_TIMING',
        theme: 'HOLDING',
        titleFr: 'Préservation du Point Médian 13 et du Timing en Holding Game',
        titleEn: 'Midpoint and Timing Preservation in Holding Games',
        summaryFr: 'Conserve le relai du point 13 pour protéger le retour des pions arrières.',
        summaryEn: 'Holds the midpoint 13 as a safe relay for returning back checkers.',
        goldenRuleFr: 'En jeu de retenue, le point 13 est le pont de sécurité de votre ancre.',
        goldenRuleEn: 'In a holding game, the 13-point is the safety bridge for your anchor.',
    },
    {
        motifId: 'KILL_A_NUMBER_DEFENSE',
        theme: 'HOLDING',
        titleFr: 'Défense Tactique (« Tuer un Dé » / Empêcher la Couverture)',
        titleEn: 'Kill-a-Number Tactical Defense',
        summaryFr: 'Frappe un bâtisseur ou un slot adverse pour l’empêcher de fermer une porte critique.',
        summaryEn: 'Hits an opponent builder or slot to prevent them from closing a critical point.',
        goldenRuleFr: 'Même sous risque, frappez le slot sur le point 5 adverse avant qu’il ne le couvre.',
        goldenRuleEn: 'Even at some risk, hit the opponent’s 5-point slot before they cover it.',
    },
    {
        motifId: 'SAFE_BEAR_IN_CONTACT',
        theme: 'BEAROFF',
        titleFr: 'Rentrée et Dégagement Sécurisés sous Contact d’Ancre',
        titleEn: 'Safe Bear-In and Clearing Under Anchor Contact',
        summaryFr: 'Vide les flèches hautes (8, 7, 6) par l’arrière sans jamais exposer de blot à l’ancre adverse.',
        summaryEn: 'Clears high points (8, 7, 6) from the rear without exposing a blot to the opponent anchor.',
        goldenRuleFr: 'Videz toujours de l’arrière vers l’avant et commencez 3 pips devant l’ancre adverse.',
        goldenRuleEn: 'Always clear from the rear forward, starting 3 pips ahead of the opponent anchor.',
    },
    {
        motifId: 'BEAROFF_WASTAGE_EPC',
        theme: 'BEAROFF',
        titleFr: 'Optimisation de la Sortie Pure (Minimisation de l’EPC & du Gaspillage)',
        titleEn: 'Pure Bear-Off Optimization (Minimizing EPC & Wastage)',
        summaryFr: 'Maximise les pions sortis et lisse la distribution intérieure pour réduire l’EPC.',
        summaryEn: 'Maximizes checkers borne off and smooths inner distribution to reduce EPC.',
        goldenRuleFr: 'En sortie pure sans contact, chaque pion sorti et chaque trou comblé réduit directement l’EPC.',
        goldenRuleEn: 'In a pure non-contact bear-off, every checker borne off and gap filled directly lowers EPC.',
    },
    {
        motifId: 'FLEXIBILITY_SPARES',
        theme: 'PRIME',
        titleFr: 'Distribution des Pions de Réserve (Spares) & Anti-Stripping',
        titleEn: 'Spare Checker Distribution & Anti-Stripping',
        summaryFr: 'Évite les portes écorchées (2 pions exactement) en répartissant des troisièmes pions de réserve.',
        summaryEn: 'Avoids stripped 2-checker points by distributing third spare checkers.',
        goldenRuleFr: 'Une porte à 3 pions offre un bâtisseur libre ; une porte à 2 pions (écorchée) menace de casser.',
        goldenRuleEn: 'A 3-checker point provides a free spare; a 2-checker stripped point threatens to break.',
    },
];

export const RACE_CUBE_AND_MET_FORMULAS: ReadonlyArray<{
    readonly id: string;
    readonly slug: string;
    readonly titleFr: string;
    readonly titleEn: string;
    readonly author: string;
    readonly formula: string;
    readonly summaryFr: string;
    readonly summaryEn: string;
}> = [
    {
        id: 'formula-timmes-2026',
        slug: 'timmes-oct-2026-race-cube',
        titleFr: 'Méthode de Timmes (Octobre 2026) — Videau en Course Longue',
        titleEn: 'Timmes Method (October 2026) — Long Race Cube Algorithm',
        author: 'Hendrik Timmes (2026)',
        formula: 'A = round((P - 5) / 7); POLT = P + A; Double >= POLT - 3; Redouble >= POLT - 2; Take <= POLT',
        summaryFr: 'Calibrée sur des millions de rollouts XG pour les courses longues : Point of Last Take = P + round((P - 5)/7).',
        summaryEn: 'Calibrated on millions of XG rollouts for long races: Point of Last Take = P + round((P - 5)/7).',
    },
    {
        id: 'formula-isight-reichert',
        slug: 'isight-method-axel-reichert',
        titleFr: 'Méthode Isight (Axel Reichert) — Pip Count Ajusté aux Pénalités',
        titleEn: 'Isight Method (Axel Reichert) — Penalty-Adjusted Pip Count',
        author: 'Axel Reichert',
        formula: 'l_adj = l + 2*max(0, c_1-2) + max(0, c_2-2) + max(0, c_3-3) + gaps_456 + max(0, cross_L - cross_T); Threshold = 84 - l_adj/6',
        summaryFr: 'Intègre les pénalités de gaspillage (empilements sur 1-2-3, trous sur 4-5-6, crossovers) dans la décision de videau.',
        summaryEn: 'Integrates wastage penalties (stacks on 1-2-3, gaps on 4-5-6, crossovers) into the race cube decision.',
    },
    {
        id: 'formula-keith-count',
        slug: 'keith-count-algorithm',
        titleFr: 'Algorithme de Keith — Course Moyenne et Courte',
        titleEn: 'Keith Count Algorithm — Medium and Short Race',
        author: 'Tom Keith',
        formula: 'K = P + 2*max(0, c_1-2) + max(0, c_2-2) + max(0, c_3-3) + gaps_456; Double: K_L <= floor(K_T*8/7) - 4; Take: K_L >= floor(K_T*8/7) - 2',
        summaryFr: 'Standard classique ajoutant les pénalités de structure avant d’appliquer le bonus de 1/7 (~14,3 %) au receveur.',
        summaryEn: 'Classic standard adding structural penalties before applying the 1/7 (~14.3%) bonus to the trailer.',
    },
    {
        id: 'formula-trice-benjamin-62',
        slug: 'trice-benjamin-rule-of-62',
        titleFr: 'Critère de Trice / Benjamin (Seuil Pip 62 : Règle des 9 & 10 %)',
        titleEn: 'Trice / Benjamin Criterion (Pip 62 Threshold: Rule of 9 & 10%)',
        author: 'Walter Trice & Danny Benjamin',
        formula: 'P_L < 62 => POLT = P_L - 5 + round(P_L/10); P_L >= 62 => POLT = P_L + ceil((P_L - 62)/9) + 1',
        summaryFr: 'Scinde les courses pures au pivot de 62 pips : règle des 10 % sous 62 pips, règle des 9 au-dessus.',
        summaryEn: 'Splits pure races at the 62-pip pivot: 10% rule below 62 pips, Rule of 9 above 62 pips.',
    },
    {
        id: 'formula-benjamin-3v3',
        slug: 'benjamin-3v3-short-bearoff',
        titleFr: 'Formule de Benjamin 3v3 — Finale Courte de Sortie (≤ 3 Pions)',
        titleEn: 'Benjamin 3v3 Formula — Short Bear-Off (≤ 3 Checkers)',
        author: 'Danny Benjamin',
        formula: 'S = BasePips + 2*N_extra_checkers + StackGaps; Double: S_T - S_L >= 2 (ou 1 si S_L <= 14); Take: S_T - S_L <= 4',
        summaryFr: 'Évalue avec précision les finales de 2 ou 3 pions où le pip count brut échoue.',
        summaryEn: 'Accurately evaluates 2 or 3-checker bear-off endings where raw pip counts fail.',
    },
    {
        id: 'formula-epc-walter-trice',
        slug: 'epc-effective-pip-count-7n-plus-1',
        titleFr: 'EPC (Effective Pip Count — Formule 7n + 1 de Walter Trice)',
        titleEn: 'EPC (Effective Pip Count — Walter Trice 7n + 1 Formula)',
        author: 'Walter Trice',
        formula: 'EPC = AvgRolls * (49 / 6) ≈ 8.167 * AvgRolls = RawPips + Wastage',
        summaryFr: 'Convertit le nombre moyen exact de lancers restants en équivalent pips (8,167 pips par lancer moyen).',
        summaryEn: 'Converts exact average remaining rolls into effective pips (8.167 pips per average roll).',
    },
    {
        id: 'formula-janowski-2013-met',
        slug: 'janowski-2013-revised-met-take-point',
        titleFr: 'Équations Révisées de Janowski (2013) & Take Point Rétrograde Kazaross-XG2',
        titleEn: 'Janowski Revised Equations (2013) & Kazaross-XG2 Retrograde Take Point',
        author: 'Rick Janowski & Neil Kazaross',
        formula: 'E_eff(P) = E(P) + (1 - E(P))*x*(3 - x)/4; TP_live = (L_pass - L_take_lose) / (W_take_win - L_take_lose)',
        summaryFr: 'Modélise l’indice de vie du videau x in [0, 1] et le Take Point exact en match selon la table Kazaross-XG2.',
        summaryEn: 'Models the cube life index x in [0, 1] and exact match Take Point from the Kazaross-XG2 table.',
    },
    {
        id: 'stage11-containment-nn-21',
        slug: 'open-sage-stage11-containment-nn-index-21',
        titleFr: 'Open Sage Stage 11 (Indice 21) — Réseau de Confinement (« The Escaper »)',
        titleEn: 'Open Sage Stage 11 (Index 21) — Containment Game Neural Network',
        author: 'Mark Higgins (Open Sage stage11)',
        formula: 'borne_off > 0 && 1 <= checkers_back <= 3 && opp_pip > own_pip => NN_Index = 21',
        summaryFr: 'Spécialisé pour les finales d’endiguement où un camp a déjà sorti des pions mais doit ramener 1 à 3 pions frappés.',
        summaryEn: 'Specialized for containment endings where one side has borne off checkers but must bring home 1 to 3 hit checkers.',
    },
    {
        id: 'stage11-snake-nn-22',
        slug: 'open-sage-stage11-snake-nn-index-22',
        titleFr: 'Open Sage Stage 11 (Indice 22) — Réseau Serpent (« The Snake » / stage11s)',
        titleEn: 'Open Sage Stage 11 (Index 22) — The Snake Neural Network (stage11s)',
        author: 'Mark Higgins (Open Sage stage11)',
        formula: 'max_consec_outer_points(13..22) >= 4 && opp_stragglers == 1 => NN_Index = 22',
        summaryFr: 'Barrage avancé de 4+ portes consécutives en terrain adverse bloquant un unique pion retardataire pendant que l’adversaire s’écrase.',
        summaryEn: 'Advanced prime of 4+ consecutive points in opponent territory trapping a single straggler while the opponent crunches.',
    },
    {
        id: 'stage11-massive-backgame-23',
        slug: 'open-sage-stage11-massive-backgame-nn-index-23',
        titleFr: 'Open Sage Stage 11 (Indice 23) — Réseau de Backgame Massif',
        titleEn: 'Open Sage Stage 11 (Index 23) — Massive Backgame Neural Network',
        author: 'Mark Higgins (Open Sage stage11)',
        formula: 'own_anchors_deep >= 3 || (own_anchors_deep == 2 && own_checkers_back >= 7) => NN_Index = 23',
        summaryFr: 'Activé dès 3 ancres profondes dans le jan adverse ou 2 ancres avec au moins 7 pions reculés.',
        summaryEn: 'Activated when holding 3+ deep anchors in the opponent home board or 2 anchors with 7+ checkers back.',
    },
    {
        id: 'stage11-move-filter-a1a9517',
        slug: 'open-sage-move-filter-and-a1a9517-invariant',
        titleFr: 'Filtre d’Élagage Open Sage (Top 5 ≤ 0.08) & Invariant Commit a1a9517',
        titleEn: 'Open Sage Move Filter (Top 5 ≤ 0.08) & Commit a1a9517 Ranking Invariant',
        author: 'Mark Higgins & Alexander Strehl',
        formula: 'C_2ply = { m_r | 1 <= r <= min(5, M) && E_1(1) - E_1(r) <= 0.08 }; sort_2ply(C_2ply) only',
        summaryFr: 'Ne conserve que les 5 meilleurs coups à moins de 0.08 d’équité 1-ply et interdit de reclasser un coup élagué sur sa valeur 1-ply.',
        summaryEn: 'Retains at most the top 5 moves within 0.08 1-ply equity and never ranks a pruned candidate on its 1-ply value.',
    },
];

export const OPENING_ROLLS_3PLY: ReadonlyArray<{
    readonly roll: string;
    readonly bestMove: string;
    readonly altMove: string;
    readonly xgid: string;
    readonly summaryFr: string;
    readonly summaryEn: string;
}> = [
    { roll: '2-1', bestMove: '13/11, 6/5', altMove: '24/23, 13/11', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:21:0:0:0:0:10', summaryFr: 'Slotter le point d’or 5 ou splitter au point 23 tout en descendant un bâtisseur en 11.', summaryEn: 'Slot the golden 5-point or split to the 23-point while bringing a builder to 11.' },
    { roll: '3-1', bestMove: '8/5, 6/5', altMove: '8/5, 6/5 (Forcé stratégique)', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:31:0:0:0:0:10', summaryFr: 'Le meilleur lancer d’ouverture : construit immédiatement la porte maîtresse du 5.', summaryEn: 'The best opening roll: immediately builds the master 5-point.' },
    { roll: '4-1', bestMove: '24/23, 13/9', altMove: '13/9, 6/5', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:41:0:0:0:0:10', summaryFr: 'Splitter en 23 et descendre un bâtisseur en 9 (ou slotter le point 5 en Blitz).', summaryEn: 'Split to 23 and bring a builder to 9 (or slot the 5-point for Blitz).' },
    { roll: '5-1', bestMove: '24/23, 13/8', altMove: '13/8, 6/5', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:51:0:0:0:0:10', summaryFr: 'Renforcer le point 8 tout en splittant au point 23 (ou slotter le point 5).', summaryEn: 'Reinforce the 8-point while splitting to 23 (or slot the 5-point).' },
    { roll: '6-1', bestMove: '13/7, 8/7', altMove: '13/7, 8/7 (Standard universel)', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:61:0:0:0:0:10', summaryFr: 'Verrouille immédiatement le Bar-Point (flèche 7), deuxième meilleure porte après le 5.', summaryEn: 'Immediately locks the Bar-Point (7-point), second-best point after the 5-point.' },
    { roll: '3-2', bestMove: '24/21, 13/11', altMove: '13/11, 13/10', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:32:0:0:0:0:10', summaryFr: 'Splitter au point 21 (ancre avancée) et descendre un bâtisseur actif en 11.', summaryEn: 'Split to the 21-point advanced anchor and bring an active builder to 11.' },
    { roll: '4-2', bestMove: '8/4, 6/4', altMove: '8/4, 6/4 (Standard universel)', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10', summaryFr: 'Construit immédiatement la porte intérieure du 4 sans aucune concession.', summaryEn: 'Immediately makes the inner 4-point with zero downside.' },
    { roll: '5-2', bestMove: '24/22, 13/8', altMove: '13/11, 13/8', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:52:0:0:0:0:10', summaryFr: 'Splitter en 22 et renforcer la flèche 8 (ou descendre deux bâtisseurs 13/11, 13/8).', summaryEn: 'Split to 22 and reinforce the 8-point (or bring two builders 13/11, 13/8).' },
    { roll: '6-2', bestMove: '24/18, 13/11', altMove: '13/5', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:62:0:0:0:0:10', summaryFr: 'Avancer au bar-point adverse (18) tout en descendant un bâtisseur en 11.', summaryEn: 'Advance to the opponent bar-point (18) while bringing a builder to 11.' },
    { roll: '4-3', bestMove: '24/20, 13/10', altMove: '13/10, 13/9', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:43:0:0:0:0:10', summaryFr: 'Viser l’ancre d’or 20 avec un bâtisseur en 10, ou descendre deux bâtisseurs 10 et 9.', summaryEn: 'Aim for the golden 20-point anchor with a builder on 10, or bring down two builders to 10 and 9.' },
    { roll: '5-3', bestMove: '8/3, 6/3', altMove: '13/10, 13/8', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:53:0:0:0:0:10', summaryFr: 'Construit la porte intérieure du 3 dès l’ouverture (validé en 3-ply moderne).', summaryEn: 'Makes the inner 3-point right from the opening (validated by modern 3-ply).' },
    { roll: '6-3', bestMove: '24/18, 13/10', altMove: '24/15', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:63:0:0:0:0:10', summaryFr: 'Splitter au bar-point adverse 18 et descendre un bâtisseur en 10.', summaryEn: 'Split to the opponent bar-point 18 and bring a builder to 10.' },
    { roll: '5-4', bestMove: '24/20, 13/8', altMove: '13/9, 13/8', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:54:0:0:0:0:10', summaryFr: 'Splitter sur le point d’or adverse 20 tout en renforçant le point 8.', summaryEn: 'Split to the opponent golden 20-point while reinforcing the 8-point.' },
    { roll: '6-4', bestMove: '24/14', altMove: '8/2, 6/2 ou 24/18, 13/9', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:64:0:0:0:0:10', summaryFr: 'Trois écoles presque ex-aequo en 3-ply : course (24/14), porte du 2 (8/2, 6/2) ou split (24/18, 13/9).', summaryEn: 'Three schools nearly tied in 3-ply: running (24/14), making the 2-point (8/2, 6/2), or splitting (24/18, 13/9).' },
    { roll: '6-5', bestMove: '24/13', altMove: '24/13 (Lover’s Leap universel)', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:65:0:0:0:0:10', summaryFr: 'Lover’s Leap : met immédiatement un pion arrière en sécurité absolue sur le point 13.', summaryEn: 'Lover’s Leap: immediately brings a back checker to complete safety on the midpoint 13.' },
];

