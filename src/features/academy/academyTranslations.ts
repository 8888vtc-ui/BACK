/**
 * Contenus éditoriaux multilingues (FR, EN, ES, PT, DE, AR) du Hub SEO "Gammon Academy".
 * Couvre :
 * - En-tête & Navigation de l'Académie
 * - Guide Mathématique du Videau (Doubling Cube, Take Point 21.5% / 25%, Jacoby, Crawford, MET Kazaross-XG2)
 * - Lexique & Stratégie Grand-Maître (Course/Keith Count, Blitz, Prime vs Prime, Holding/Back Game, PR & Open Sage 3-Ply)
 * - Foire Aux Questions (FAQ SEO) ciblant les requêtes mondiales à fort volume.
 * Strictement 0 any, < 395 lignes.
 */

import type { Locale, PrimaryLocale } from '../../lib/i18n/types';

export interface AcademyFaqItem {
    readonly question: string;
    readonly answer: string;
}

export interface AcademyGuidePillar {
    readonly badge: string;
    readonly title: string;
    readonly summary: string;
    readonly formula: string;
    readonly details: ReadonlyArray<string>;
}

export interface AcademyLocaleContent {
    readonly heroBadge: string;
    readonly heroTitle: string;
    readonly heroSubtitle: string;
    readonly navOpenings: string;
    readonly navCube: string;
    readonly navStrategy: string;
    readonly navGlossary: string;
    readonly navFaq: string;
    readonly openingsSectionTitle: string;
    readonly openingsSectionDesc: string;
    readonly colRoll: string;
    readonly colName: string;
    readonly colOptimal: string;
    readonly colAlt: string;
    readonly colEquity: string;
    readonly colStrategy: string;
    readonly filterAll: string;
    readonly filterMakePoint: string;
    readonly filterSplit: string;
    readonly filterSlot: string;
    readonly filterRun: string;
    readonly cubeSectionTitle: string;
    readonly cubeSectionDesc: string;
    readonly cubePillars: ReadonlyArray<AcademyGuidePillar>;
    readonly strategySectionTitle: string;
    readonly strategySectionDesc: string;
    readonly strategyPillars: ReadonlyArray<AcademyGuidePillar>;
    readonly glossarySectionTitle: string;
    readonly glossarySectionDesc: string;
    readonly faqSectionTitle: string;
    readonly faqSectionDesc: string;
    readonly faqs: ReadonlyArray<AcademyFaqItem>;
    readonly ctaPlayTitle: string;
    readonly ctaPlayBtn: string;
    readonly ctaDrillsBtn: string;
    readonly ctaPuzzlesBtn: string;
}

export const ACADEMY_CONTENT: Record<PrimaryLocale, AcademyLocaleContent> = {
    fr: {
        heroBadge: 'BACKGAMMONTOUR.COM · GAMMONACADEMY.COM',
        heroTitle: 'Gammon Academy — Encyclopédie Grand-Maître & Théorie 3-Ply',
        heroSubtitle: 'Référentiel stratégique officiel : les 15 rouleaux d’ouverture certifiés Open Sage 3-Ply (PR 0.23), la mathématique du Videau (Take Point 21,5 %, Crawford, Jacoby, MET Kazaross-XG2) et le calcul du Performance Rating.',
        navOpenings: '1. Les 15 Ouvertures',
        navCube: '2. Maîtrise du Videau',
        navStrategy: '3. Stratégie & PR 3-Ply',
        navGlossary: '4. Matrice Terminologique',
        navFaq: '5. FAQ Officielle Tournoi',
        openingsSectionTitle: 'I. Guide Complet des 15 Rouleaux d’Ouverture au Backgammon (Équité 3-Ply)',
        openingsSectionDesc: 'Au premier tour, les doubles étant impossibles, il existe exactement 15 combinaisons de dés. Voici la table de vérité évaluée par notre moteur neuronal Open Sage 3-Ply et conforme aux rollouts eXtreme Gammon (XG).',
        colRoll: 'Jet',
        colName: 'Nom Classique',
        colOptimal: 'Coup Optimal (3-Ply)',
        colAlt: 'Alternative (DMP / Score)',
        colEquity: 'Équité & Gain',
        colStrategy: 'Explication Stratégique Grand-Maître',
        filterAll: 'Tous les 15 jets',
        filterMakePoint: 'Portes fermées (4)',
        filterSplit: 'Split & Construction (7)',
        filterSlot: 'Slot agressif (3)',
        filterRun: 'Course pure (1)',
        cubeSectionTitle: 'II. Guide de Maîtrise du Videau (Doubling Cube & Match Equity)',
        cubeSectionDesc: 'Le videau (64) transforme le backgammon en un jeu d’espérance mathématique pure. Maîtriser les seuils de prise (Take Point) et les règles de tournoi WBGF divise votre taux d’erreur par deux.',
        cubePillars: [
            {
                badge: 'Seuil Mathématique',
                title: 'Take Point Théorique (25,0 %) vs Cube Vivant (21,5 %)',
                summary: 'Sans gammons et avec un videau mort (Dead Cube), accepter un double exige 25,0 % de chances de gain. Mais grâce à la vigueur du re-double (Cube Ownership), le seuil réel en partie descend autour de 21,5 %.',
                formula: 'Take Point (Dead Cube) = Risque / (Risque + Gain) = 1 / (1 + 3) = 25,0 % → Live Cube ≈ 21,5 %',
                details: [
                    'Fenêtre de Double initial : doublez dès que votre probabilité de gain franchit 66 % (avec volatilité) et jusqu’à 75 %.',
                    'Market Loser : une position qui risque de dépasser 76–80 % au prochain lancer (perdant son marché) doit être doublée immédiatement.',
                    'Too Good to Double : si votre chance de Gammon dépasse ~35 % avec >80 % de gain, conservez le cube à 1 pour jouer les 2 points du Gammon.',
                ],
            },
            {
                badge: 'Règles Officielles WBGF',
                title: 'Règle de Crawford, Post-Crawford & Règle de Jacoby',
                summary: 'Le comportement du videau change radicalement selon que vous jouez en Partie d’Argent (Money Game) ou en Match de Tournoi (ex. Match en 7 points).',
                formula: 'MET Kazaross-XG2 : Gammon Price & Take Point varient à chaque score (ex. 2-away / 4-away)',
                details: [
                    'Règle de Crawford (Match) : lorsqu’un joueur atteint 1 point de la victoire (1-away), le videau est gelé pendant exactement une manche.',
                    'Post-Crawford : dès la manche suivante, le joueur mené doit doubler dès sa première occasion légale, et le leader bénéficie du « Free Drop ».',
                    'Règle de Jacoby (Money Game) : les Gammons (2×) et Backgammons (3×) ne comptent comme multiples que si le videau a été tourné au moins à 2.',
                ],
            },
        ],
        strategySectionTitle: 'III. Plans de Jeu Grand-Maître, Keith Count & Performance Rating (PR)',
        strategySectionDesc: 'Comment les champions du monde et le moteur Open Sage 3-Ply (PR 0.23) évaluent une position en moins de 5 secondes.',
        strategyPillars: [
            {
                badge: 'Plans de Jeu',
                title: 'Les 5 Archétypes : Course, Blitz, Prime vs Prime, Holding & Back Game',
                summary: 'Chaque coup doit servir un plan cohérent dicté par le Pip Count, le nombre de portes fermées et la position des pions arrières.',
                formula: 'Keith Count = Pip Count + Pénalités (Empilements >3 sur portes 1-3, flèches vides 4-6, pions hors jan)',
                details: [
                    'Course (Running Game) : en course pure, appliquez l’algorithme de Keith : doublez à +4 pips corrigés, acceptez jusqu’à +14 %.',
                    'Blitz d’Attaque : avec ≥10 pions dans la zone d’attaque et un pion adverse sur la barre, frappez à outrance pour fermer le jan (Gammon >35 %).',
                    'Prime vs Prime & Holding Game : verrouillez le Point d’Or (5) et le Bar Point (7) pour construire un mur de 6 portes infranchissable.',
                ],
            },
            {
                badge: 'Mesure de Niveau',
                title: 'Performance Rating (PR) & Architecture Hybride Open Sage 3-Ply',
                summary: 'Le PR mesure votre perte moyenne d’équité par décision non-forcée multipliée par 500. Plus votre PR est proche de 0.00, plus votre jeu est parfait.',
                formula: 'PR = (Somme des pertes d’équité sur coups + videau / Nombre de décisions réelles) × 500',
                details: [
                    'Échelle mondiale : Super-GM (< 2.50) · Grand-Maître (2.50–5.00) · Maître (5.00–7.50) · Expert (7.50–10.00) · Intermédiaire (10.00–15.00).',
                    'Seuil de Blunder : une erreur ≥ 0.080 d’équité est un Blunder ; entre 0.020 et 0.080, une Imprécision (Doubtful) ; < 0.020, un coup Optimal/Bon.',
                    'Moteur Hybride : Open Sage 3-Ply Cloud Run (PR 0.23) + Évaluateur local tri-phase (Contact / Crashed / Bear-off exact 54 264 états).',
                ],
            },
        ],
        glossarySectionTitle: 'IV. Matrice Terminologique Internationale (6 Langues)',
        glossarySectionDesc: 'Dictionnaire comparatif officiel des termes techniques du Backgammon de compétition (XG / WBGF).',
        faqSectionTitle: 'V. Foire Aux Questions (FAQ Officielle Backgammon Tour & Coach IA)',
        faqSectionDesc: 'Réponses aux questions les plus recherchées sur les règles de tournoi, le Coach IA et l’entraînement.',
        faqs: [
            {
                question: 'Comment jouer au backgammon en ligne gratuitement avec un Coach IA ?',
                answer: 'Sur Backgammon Tour (backgammontour.com), vous pouvez lancer instantanément une partie gratuite contre notre moteur neuronal Open Sage (4 niveaux de Novice à Grand-Maître 3-Ply) ou défier d’autres joueurs en multijoueur, avec analyse d’équité en temps réel et mode 100 % hors-ligne.',
            },
            {
                question: 'Quel est le meilleur coup d’ouverture au backgammon ?',
                answer: 'Le meilleur jet d’ouverture est le 3-1 joué en 8/5 6/5 (+0.194 d’équité), qui construit immédiatement le Point d’Or (porte 5). Il est suivi du 4-2 (8/4 6/4, +0.168) et du 6-1 (13/7 8/7, +0.155, qui ferme le Bar Point).',
            },
            {
                question: 'Quand faut-il doubler avec le videau (Doubling Cube) au backgammon ?',
                answer: 'Vous devez proposer le videau lorsque votre probabilité de gain dépasse ~66 % avec une volatilité suffisante (Market Losers), et votre adversaire doit accepter (Take) tant que ses chances de gain restent supérieures à ~21,5 % en cube vivant (25 % en cube mort sans gammons).',
            },
            {
                question: 'Comment est calculé le Performance Rating (PR) au backgammon ?',
                answer: 'Selon le standard international eXtreme Gammon (XG), le PR est égal à la perte moyenne d’équité par décision non-forcée (pions et videau) multipliée par 500. Un PR inférieur à 5.0 correspond au niveau Grand-Maître.',
            },
        ],
        ctaPlayTitle: 'Prêt à appliquer la théorie sur le plateau du Cercle Monte-Carlo ?',
        ctaPlayBtn: '🎲 Jouer contre l’IA 3-Ply',
        ctaDrillsBtn: '🎯 Lancer un Drill de Blunders',
        ctaPuzzlesBtn: '🧩 Résoudre le Puzzle du Jour',
    },
    en: {
        heroBadge: 'BACKGAMMONTOUR.COM · GAMMONACADEMY.COM',
        heroTitle: 'Gammon Academy — Grandmaster Encyclopedia & 3-Ply Theory',
        heroSubtitle: 'Official strategy reference: all 15 opening rolls certified by Open Sage 3-Ply (PR 0.23), Doubling Cube mathematics (21.5% Live Take Point, Crawford, Jacoby, Kazaross-XG2 MET), and Performance Rating mastery.',
        navOpenings: '1. The 15 Opening Rolls',
        navCube: '2. Doubling Cube Mastery',
        navStrategy: '3. Strategy & 3-Ply PR',
        navGlossary: '4. Terminology Matrix',
        navFaq: '5. Official Tournament FAQ',
        openingsSectionTitle: 'I. Complete Guide to the 15 Backgammon Opening Rolls (3-Ply Equity)',
        openingsSectionDesc: 'Because doubles cannot be rolled on the opening turn, there are exactly 15 non-double opening rolls. Below is the ground-truth table certified by our Open Sage 3-Ply neural engine and XG rollouts.',
        colRoll: 'Roll',
        colName: 'Classic Name',
        colOptimal: 'Optimal Move (3-Ply)',
        colAlt: 'Alternative (DMP / Score)',
        colEquity: 'Equity & Win %',
        colStrategy: 'Grandmaster Strategic Explanation',
        filterAll: 'All 15 Rolls',
        filterMakePoint: 'Point-Making (4)',
        filterSplit: 'Split & Build (7)',
        filterSlot: 'Aggressive Slot (3)',
        filterRun: 'Pure Running (1)',
        cubeSectionTitle: 'II. Doubling Cube Mastery & Match Equity Guide',
        cubeSectionDesc: 'The doubling cube transforms backgammon into a game of pure mathematical expectation. Mastering Take Points and WBGF tournament rules cuts your error rate in half.',
        cubePillars: [
            {
                badge: 'Mathematical Threshold',
                title: 'Dead Cube Take Point (25.0%) vs Live Cube (21.5%)',
                summary: 'In a gammonless dead-cube race, taking a double requires 25.0% winning chances. However, because owning the cube grants redoubling vigor, the true live-cube Money Take Point drops to ~21.5%.',
                formula: 'Dead Cube Take Point = Risk / (Risk + Gain) = 1 / (1 + 3) = 25.0% → Live Cube ≈ 21.5%',
                details: [
                    'Initial Double Window: double as soon as your winning probability crosses ~66% (with market volatility) up to 75%.',
                    'Market Losers: positions that threaten to jump past 76–80% on the next roll must be doubled immediately.',
                    'Too Good to Double: if your gammon threat exceeds ~35% with >80% win rate, hold the cube to play for a 2-point gammon.',
                ],
            },
            {
                badge: 'Official WBGF Rules',
                title: 'Crawford Rule, Post-Crawford & Jacoby Rule',
                summary: 'Cube strategy shifts dramatically between Money Play and Tournament Match Play (e.g., 7-point matches).',
                formula: 'Kazaross-XG2 MET: Gammon Price & Take Point change at every match score (e.g., 2-away / 4-away)',
                details: [
                    'Crawford Rule (Match): when either player reaches 1 point away from winning (1-away), the doubling cube is frozen for one game.',
                    'Post-Crawford: in subsequent games, the trailer doubles at the first opportunity, and the leader enjoys the "Free Drop".',
                    'Jacoby Rule (Money Play): Gammons (2×) and Backgammons (3×) only count as multiples if the cube has been turned to at least 2.',
                ],
            },
        ],
        strategySectionTitle: 'III. Grandmaster Game Plans, Keith Count & Performance Rating (PR)',
        strategySectionDesc: 'How World Champions and the Open Sage 3-Ply neural engine (PR 0.23) evaluate any board in under 5 seconds.',
        strategyPillars: [
            {
                badge: 'Game Plans',
                title: 'The 5 Archetypes: Race, Blitz, Prime vs Prime, Holding & Back Game',
                summary: 'Every checker play must serve a coherent strategic plan dictated by pip count, closed points, and back checkers.',
                formula: 'Keith Count = Pip Count + Penalties (Stacks >3 on pts 1-3, gaps on pts 4-6, checkers outside home board)',
                details: [
                    'Running Game (Race): in a pure race, apply the Keith Count: double at +4 adjusted pips, take up to +14% trailing.',
                    'Attacking Blitz: with ≥10 checkers in the attack zone and an opponent on the bar, hit relentlessly to close the home board.',
                    'Prime vs Prime & Holding Game: secure the Golden Point (5) and Bar Point (7) to construct an impassable 6-prime wall.',
                ],
            },
            {
                badge: 'Skill Metric',
                title: 'Performance Rating (PR) & Hybrid Open Sage 3-Ply Architecture',
                summary: 'PR measures your average equity lost per non-forced decision multiplied by 500. The closer to 0.00, the stronger your play.',
                formula: 'PR = (Total Equity Lost on Checker + Cube Decisions / Total Non-Forced Decisions) × 500',
                details: [
                    'World Scale: Super-GM (< 2.50) · Grandmaster (2.50–5.00) · Master (5.00–7.50) · Expert (7.50–10.00) · Intermediate (10.00–15.00).',
                    'Blunder Threshold: an equity loss ≥ 0.080 is a Blunder; 0.020 to 0.080 is an Inaccuracy (Doubtful); < 0.020 is Optimal/Good.',
                    'Hybrid Engine: Open Sage 3-Ply Cloud Run (PR 0.23) + Local tri-phase evaluator (Contact / Crashed / Exact 54,264-state Bear-off).',
                ],
            },
        ],
        glossarySectionTitle: 'IV. International Backgammon Terminology Matrix (6 Languages)',
        glossarySectionDesc: 'Official comparative dictionary of competitive backgammon terms (XG / WBGF standards).',
        faqSectionTitle: 'V. Frequently Asked Questions (Official Backgammon Tour & AI Coach FAQ)',
        faqSectionDesc: 'Answers to the most searched questions on tournament backgammon rules, AI coaching, and training.',
        faqs: [
            {
                question: 'How can I play tournament backgammon online for free with an AI Coach?',
                answer: 'On Backgammon Tour (backgammontour.com), you can play free matches instantly against our Open Sage neural engine (4 levels from Novice to 3-Ply Grandmaster) or challenge live opponents in Multiplayer, with real-time equity analysis and 100% offline support.',
            },
            {
                question: 'What is the best opening move in backgammon?',
                answer: 'The strongest opening roll is 3-1 played 8/5 6/5 (+0.194 equity), which immediately makes the Golden Point (5-point). It is followed by 4-2 (8/4 6/4, +0.168) and 6-1 (13/7 8/7, +0.155, securing the Bar Point).',
            },
            {
                question: 'When should I double and take with the Doubling Cube in backgammon?',
                answer: 'Offer a double when your winning chances exceed ~66% with market volatility (Market Losers). Accept (Take) a double as long as your winning probability remains above ~21.5% with a live cube (or 25.0% in a gammonless dead-cube race).',
            },
            {
                question: 'How is Performance Rating (PR) calculated in backgammon?',
                answer: 'Following the eXtreme Gammon (XG) international standard, PR equals your average equity loss per non-forced checker and cube decision multiplied by 500. A PR below 5.0 represents Grandmaster-level play.',
            },
        ],
        ctaPlayTitle: 'Ready to apply Grandmaster theory at the Monte-Carlo Salon table?',
        ctaPlayBtn: '🎲 Play vs 3-Ply AI',
        ctaDrillsBtn: '🎯 Start Blunder Drills',
        ctaPuzzlesBtn: '🧩 Solve Daily Puzzle',
    },
    es: {
        heroBadge: 'BACKGAMMONTOUR.COM · GAMMONACADEMY.COM',
        heroTitle: 'Gammon Academy — Enciclopedia Gran Maestro y Teoría 3-Ply',
        heroSubtitle: 'Referencia estratégica oficial: las 15 tiradas de apertura certificadas por Open Sage 3-Ply (PR 0.23), matemática del Cubo de Doblaje (Take Point 21,5 %, Crawford, Jacoby, MET Kazaross-XG2) y cálculo de PR.',
        navOpenings: '1. Las 15 Aperturas',
        navCube: '2. Dominio del Cubo',
        navStrategy: '3. Estrategia y PR 3-Ply',
        navGlossary: '4. Matriz Terminológica',
        navFaq: '5. FAQ Oficial de Torneo',
        openingsSectionTitle: 'I. Guía Completa de las 15 Aperturas de Backgammon (Equidad 3-Ply)',
        openingsSectionDesc: 'En el primer turno existen exactamente 15 combinaciones sin dobles. Esta es la tabla oficial certificada por el motor neuronal Open Sage 3-Ply.',
        colRoll: 'Dados',
        colName: 'Nombre Clásico',
        colOptimal: 'Jugada Óptima (3-Ply)',
        colAlt: 'Alternativa (DMP / Score)',
        colEquity: 'Equidad y %',
        colStrategy: 'Explicación Estratégica Gran Maestro',
        filterAll: 'Las 15 tiradas',
        filterMakePoint: 'Cerrar puntos (4)',
        filterSplit: 'Split y Construcción (7)',
        filterSlot: 'Slot agresivo (3)',
        filterRun: 'Carrera pura (1)',
        cubeSectionTitle: 'II. Guía de Dominio del Cubo de Doblaje (Doubling Cube & MET)',
        cubeSectionDesc: 'El cubo de doblaje convierte al backgammon en un juego de esperanza matemática pura. Dominar el Take Point reduce tu PR a la mitad.',
        cubePillars: [
            {
                badge: 'Umbral Matemático',
                title: 'Take Point Teórico (25,0 %) vs Cubo Vivo (21,5 %)',
                summary: 'Con cubo muerto sin gammons, aceptar un doble exige 25,0 % de victoria. Con cubo vivo, el poder de redoblar reduce el umbral a ~21,5 %.',
                formula: 'Take Point (Cubo Muerto) = 1 / (1 + 3) = 25,0 % → Cubo Vivo ≈ 21,5 %',
                details: [
                    'Ventana de Doblaje Inicial: dobla entre el 66 % y el 75 % de probabilidad de victoria con volatilidad.',
                    'Market Losers: posiciones que amenazan con superar el 76–80 % en la siguiente tirada deben doblarse de inmediato.',
                    'Too Good to Double: con >35 % de gammon y >80 % de victoria, conserva el cubo para jugar por el gammon (2 puntos).',
                ],
            },
            {
                badge: 'Reglas Oficiales WBGF',
                title: 'Regla de Crawford, Post-Crawford y Regla de Jacoby',
                summary: 'El uso del cubo cambia radicalmente entre partidas libres (Money Game) y partidos de torneo a 7 u 11 puntos.',
                formula: 'MET Kazaross-XG2: el precio del gammon varía según el marcador exacto',
                details: [
                    'Regla de Crawford: cuando un jugador llega a 1 punto de ganar (1-away), el cubo queda congelado durante un juego.',
                    'Post-Crawford: el jugador en desventaja dobla en su primera oportunidad y el líder dispone del «Free Drop».',
                    'Regla de Jacoby (Money): los Gammons (2×) y Backgammons (3×) solo valen doble o triple si el cubo ha sido doblado.',
                ],
            },
        ],
        strategySectionTitle: 'III. Planes de Juego Gran Maestro, Conteo Keith y Performance Rating (PR)',
        strategySectionDesc: 'Cómo evalúan las posiciones los campeones mundiales y el motor neuronal Open Sage 3-Ply (PR 0.23).',
        strategyPillars: [
            {
                badge: 'Planes de Juego',
                title: 'Los 5 Arquetipos: Carrera, Blitz, Prime vs Prime, Holding y Back Game',
                summary: 'Cada jugada debe responder a un plan coherente guiado por el conteo de pips y la estructura de bloqueos.',
                formula: 'Keith Count = Pips + Penalizaciones (Pilas >3 en puntos 1-3, huecos en 4-6, fichas fuera del tablero propio)',
                details: [
                    'Carrera (Running Game): aplica el algoritmo de Keith: dobla con ventaja corregida de +4 pips y acepta hasta +14 %.',
                    'Blitz de Ataque: con ≥10 fichas en zona de ataque y rival en la barra, golpea sin tregua para cerrar tu tablero.',
                    'Prime vs Prime y Holding Game: asegura el Punto Dorado (5) y el Punto de Barra (7) para formar un muro de 6 puntos.',
                ],
            },
            {
                badge: 'Métrica de Nivel',
                title: 'Performance Rating (PR) y Arquitectura Híbrida Open Sage 3-Ply',
                summary: 'El PR mide la pérdida media de equidad por decisión no forzada multiplicada por 500.',
                formula: 'PR = (Pérdida total de equidad / Decisiones reales no forzadas) × 500',
                details: [
                    'Escala Mundial: Super-GM (< 2.50) · Gran Maestro (2.50–5.00) · Maestro (5.00–7.50) · Experto (7.50–10.00).',
                    'Umbral de Blunder: pérdida ≥ 0.080 de equidad es Blunder; entre 0.020 y 0.080 es Dudosa; < 0.020 es Óptima.',
                    'Motor Híbrido: Open Sage 3-Ply Cloud Run (PR 0.23) + Evaluador local trifásico con Bear-off exacto de 54 264 estados.',
                ],
            },
        ],
        glossarySectionTitle: 'IV. Matriz Terminológica Internacional (6 Idiomas)',
        glossarySectionDesc: 'Diccionario comparativo oficial de términos técnicos de competición (estándar XG / WBGF).',
        faqSectionTitle: 'V. Preguntas Frecuentes (FAQ Oficial Backgammon Tour & Coach IA)',
        faqSectionDesc: 'Respuestas a las consultas más buscadas sobre reglas de torneo, entrenamiento e inteligencia artificial.',
        faqs: [
            {
                question: '¿Cómo jugar al backgammon online gratis con un Coach de IA?',
                answer: 'En Backgammon Tour (backgammontour.com) puedes jugar gratis al instante contra nuestro motor neuronal Open Sage (4 niveles hasta Gran Maestro 3-Ply) o en modo Multijugador, con análisis de equidad en tiempo real y soporte 100 % offline.',
            },
            {
                question: '¿Cuál es la mejor jugada de apertura en el backgammon?',
                answer: 'La mejor tirada inicial es 3-1 jugada 8/5 6/5 (+0.194 de equidad), que cierra inmediatamente el Punto Dorado (punto 5), seguida de 4-2 (8/4 6/4, +0.168) y 6-1 (13/7 8/7, +0.155, Punto de Barra).',
            },
            {
                question: '¿Cuándo doblar y aceptar el cubo de doblaje en backgammon?',
                answer: 'Ofrece el cubo cuando tu probabilidad de victoria supere el ~66 % con volatilidad, y acepta (Take) siempre que conserves al menos un ~21,5 % de opciones de ganar con cubo vivo (25 % con cubo muerto).',
            },
            {
                question: '¿Cómo se calcula el Performance Rating (PR) en backgammon?',
                answer: 'Según el estándar eXtreme Gammon (XG), el PR es la pérdida media de equidad por decisión no forzada multiplicada por 500. Un PR menor a 5.0 equivale a nivel Gran Maestro.',
            },
        ],
        ctaPlayTitle: '¿Listo para aplicar la teoría en la mesa del Círculo Monte-Carlo?',
        ctaPlayBtn: '🎲 Jugar contra la IA 3-Ply',
        ctaDrillsBtn: '🎯 Iniciar Drills de Blunders',
        ctaPuzzlesBtn: '🧩 Resolver Problema Diario',
    },
    pt: {
        heroBadge: 'BACKGAMMONTOUR.COM · GAMMONACADEMY.COM',
        heroTitle: 'Gammon Academy — Enciclopédia Grande Mestre & Teoria 3-Ply',
        heroSubtitle: 'Referência estratégica oficial: os 15 lançamentos de abertura certificados pelo Open Sage 3-Ply (PR 0.23), matemática do Dado de Dobra (Take Point 21,5%, Crawford, Jacoby, MET Kazaross-XG2) e cálculo de PR.',
        navOpenings: '1. As 15 Aberturas',
        navCube: '2. Domínio do Cubo',
        navStrategy: '3. Estratégia & PR 3-Ply',
        navGlossary: '4. Matriz Terminológica',
        navFaq: '5. FAQ Oficial de Torneio',
        openingsSectionTitle: 'I. Guia Completo das 15 Aberturas no Gamão / Backgammon (Equidade 3-Ply)',
        openingsSectionDesc: 'No primeiro lance existem exatamente 15 combinações não-duplas. Confira a tabela oficial certificada pelo motor neural Open Sage 3-Ply.',
        colRoll: 'Dados',
        colName: 'Nome Clássico',
        colOptimal: 'Lance Ótimo (3-Ply)',
        colAlt: 'Alternativa (DMP / Placar)',
        colEquity: 'Equidade e %',
        colStrategy: 'Explicação Estratégica de Grande Mestre',
        filterAll: 'Todos os 15 lances',
        filterMakePoint: 'Fechar casas (4)',
        filterSplit: 'Split e Construção (7)',
        filterSlot: 'Slot agressivo (3)',
        filterRun: 'Corrida pura (1)',
        cubeSectionTitle: 'II. Guia de Domínio do Dado de Dobra (Doubling Cube & MET)',
        cubeSectionDesc: 'O cubo transforma o gamão em um jogo de expectativa matemática pura. Dominar o Take Point reduz sua taxa de erro pela metade.',
        cubePillars: [
            {
                badge: 'Limite Matemático',
                title: 'Take Point Teórico (25,0%) vs Cubo Vivo (21,5%)',
                summary: 'Com cubo morto sem gammons, aceitar uma dobra exige 25,0% de chance de vitória. Com cubo vivo, o poder de redobrar reduz o limite para ~21,5%.',
                formula: 'Take Point (Cubo Morto) = 1 / (1 + 3) = 25,0% → Cubo Vivo ≈ 21,5%',
                details: [
                    'Janela Inicial de Dobra: dobre entre 66% e 75% de probabilidade de vitória com volatilidade.',
                    'Market Losers: posições que podem ultrapassar 76–80% no próximo turno devem ser dobradas imediatamente.',
                    'Too Good to Double: com >35% de gammon e >80% de vitória, segure o cubo para buscar os 2 pontos do gammon.',
                ],
            },
            {
                badge: 'Regras Oficiais WBGF',
                title: 'Regra de Crawford, Pós-Crawford e Regra de Jacoby',
                summary: 'A estratégia do cubo muda radicalmente entre Money Game e partidas de torneio (ex.: partidas de 7 pontos).',
                formula: 'MET Kazaross-XG2: o preço do gammon muda a cada placar da partida',
                details: [
                    'Regra de Crawford: quando um jogador fica a 1 ponto da vitória (1-away), o cubo fica congelado por uma partida.',
                    'Pós-Crawford: nas partidas seguintes, quem está atrás dobra na primeira oportunidade e o líder tem o «Free Drop».',
                    'Regra de Jacoby (Money): Gammons (2×) e Backgammons (3×) só contam em dobro/triplo se o cubo tiver sido dobrado.',
                ],
            },
        ],
        strategySectionTitle: 'III. Planos de Jogo Grande Mestre, Contagem Keith & Performance Rating (PR)',
        strategySectionDesc: 'Como os campeões mundiais e o motor neural Open Sage 3-Ply (PR 0.23) avaliam uma posição em segundos.',
        strategyPillars: [
            {
                badge: 'Planos de Jogo',
                title: 'Os 5 Arquétipos: Corrida, Blitz, Prime vs Prime, Holding e Back Game',
                summary: 'Cada movimento deve servir a um plano estratégico coerente ditado pela contagem de pips e estrutura de portas.',
                formula: 'Keith Count = Pips + Penalidades (Pilhas >3 nas casas 1-3, casas vazias 4-6, pedras fora do jan interno)',
                details: [
                    'Corrida (Running Game): aplique o algoritmo de Keith: dobre com +4 pips ajustados de vantagem e aceite até +14%.',
                    'Blitz de Ataque: com ≥10 pedras na zona de ataque e adversário na barra, capture sem trégua para fechar o tabuleiro.',
                    'Prime vs Prime e Holding Game: conquiste o Ponto de Ouro (5) e o Ponto da Barra (7) para erguer um muro de 6 portas.',
                ],
            },
            {
                badge: 'Métrica de Nível',
                title: 'Performance Rating (PR) e Arquitetura Híbrida Open Sage 3-Ply',
                summary: 'O PR mede sua perda média de equidade por decisão não-forçada multiplicada por 500.',
                formula: 'PR = (Perda total de equidade / Decisões reais não-forçadas) × 500',
                details: [
                    'Escala Mundial: Super-GM (< 2.50) · Grande Mestre (2.50–5.00) · Mestre (5.00–7.50) · Expert (7.50–10.00).',
                    'Limite de Blunder: perda ≥ 0.080 de equidade é Blunder; entre 0.020 e 0.080 é Duvidoso; < 0.020 é Ótimo.',
                    'Motor Híbrido: Open Sage 3-Ply Cloud Run (PR 0.23) + Avaliador local trifásico com Bear-off exato de 54.264 estados.',
                ],
            },
        ],
        glossarySectionTitle: 'IV. Matriz Terminológica Internacional (6 Idiomas)',
        glossarySectionDesc: 'Dicionário comparativo oficial dos termos técnicos de competição (padrão XG / WBGF).',
        faqSectionTitle: 'V. Perguntas Frequentes (FAQ Oficial Backgammon Tour & Coach IA)',
        faqSectionDesc: 'Respostas às dúvidas mais buscadas sobre regras de torneio, treinamento e inteligência artificial.',
        faqs: [
            {
                question: 'Como jogar gamão (backgammon) online grátis com um Coach de IA?',
                answer: 'No Backgammon Tour (backgammontour.com) você joga gratuitamente contra o motor neural Open Sage (4 níveis até Grande Mestre 3-Ply) ou no modo Multijogador, com análise de equidade em tempo real e modo 100% offline.',
            },
            {
                question: 'Qual é o melhor lance de abertura no gamão?',
                answer: 'O melhor lançamento inicial é 3-1 jogado 8/5 6/5 (+0.194 de equidade), fechando imediatamente o Ponto de Ouro (casa 5), seguido por 4-2 (8/4 6/4, +0.168) e 6-1 (13/7 8/7, +0.155, Ponto da Barra).',
            },
            {
                question: 'Quando dobrar e aceitar o dado de dobra no gamão?',
                answer: 'Ofereça o cubo quando sua chance de vitória superar ~66% com volatilidade, e aceite (Take) enquanto mantiver pelo menos ~21,5% de chance de vitória com cubo vivo (25% com cubo morto).',
            },
            {
                question: 'Como é calculado o Performance Rating (PR) no backgammon?',
                answer: 'Pelo padrão internacional eXtreme Gammon (XG), o PR equivale à perda média de equidade por decisão não-forçada multiplicada por 500. Um PR abaixo de 5.0 indica nível de Grande Mestre.',
            },
        ],
        ctaPlayTitle: 'Pronto para aplicar a teoria na mesa do Círculo Monte-Carlo?',
        ctaPlayBtn: '🎲 Jogar contra a IA 3-Ply',
        ctaDrillsBtn: '🎯 Treino de Blunders',
        ctaPuzzlesBtn: '🧩 Desafio Diário',
    },
    de: {
        heroBadge: 'BACKGAMMONTOUR.COM · GAMMONACADEMY.COM',
        heroTitle: 'Gammon Academy — Großmeister-Enzyklopädie & 3-Ply-Theorie',
        heroSubtitle: 'Offizielles Strategie-Kompendium: Alle 15 Eröffnungswürfe zertifiziert durch Open Sage 3-Ply (PR 0.23), Dopplungswürfel-Mathematik (21,5 % Live Take Point, Crawford, Jacoby, Kazaross-XG2 MET) und PR-Berechnung.',
        navOpenings: '1. Die 15 Eröffnungen',
        navCube: '2. Dopplungswürfel',
        navStrategy: '3. Strategie & 3-Ply PR',
        navGlossary: '4. Fachbegriffe (6 Sprachen)',
        navFaq: '5. Offizielle Turnier-FAQ',
        openingsSectionTitle: 'I. Kompletter Leitfaden der 15 Backgammon-Eröffnungswürfe (3-Ply-Equity)',
        openingsSectionDesc: 'Da beim ersten Wurf keine Paschs möglich sind, gibt es exakt 15 Eröffnungskombinationen. Hier ist die durch Open Sage 3-Ply zertifizierte Referenz-Tabelle.',
        colRoll: 'Wurf',
        colName: 'Klassischer Name',
        colOptimal: 'Optimaler Zug (3-Ply)',
        colAlt: 'Alternative (DMP / Score)',
        colEquity: 'Equity & Sieg %',
        colStrategy: 'Strategische Großmeister-Erklärung',
        filterAll: 'Alle 15 Würfe',
        filterMakePoint: 'Punkt machen (4)',
        filterSplit: 'Split & Aufbau (7)',
        filterSlot: 'Aggressiver Slot (3)',
        filterRun: 'Reines Rennen (1)',
        cubeSectionTitle: 'II. Dopplungswürfel-Meisterschaft (Doubling Cube & Match Equity)',
        cubeSectionDesc: 'Der Dopplungswürfel macht Backgammon zu einem Spiel reiner mathematischer Erwartungswerte. Wer Take Points beherrscht, halbiert seine Fehlerrate.',
        cubePillars: [
            {
                badge: 'Mathematische Schwelle',
                title: 'Dead Cube Take Point (25,0 %) vs. Live Cube (21,5 %)',
                summary: 'Ohne Gammons und mit totem Würfel erfordert die Annahme 25,0 % Gewinnchance. Durch das Redouble-Recht sinkt der reale Live-Cube-Take-Point auf ~21,5 %.',
                formula: 'Dead Cube Take Point = 1 / (1 + 3) = 25,0 % → Live Cube ≈ 21,5 %',
                details: [
                    'Initiales Dopplungsfenster: Doppeln Sie ab ~66 % bis 75 % Gewinnwahrscheinlichkeit bei ausreichender Volatilität.',
                    'Market Losers: Stellungen, die im nächsten Wurf über 76–80 % springen könnten, müssen sofort gedoppelt werden.',
                    'Too Good to Double: Bei >35 % Gammon-Chance und >80 % Siegquote behalten Sie den Würfel für den 2-Punkte-Gammon.',
                ],
            },
            {
                badge: 'Offizielle WBGF-Regeln',
                title: 'Crawford-Regel, Post-Crawford & Jacoby-Regel',
                summary: 'Die Würfelstrategie unterscheidet sich grundlegend zwischen Money Game und Turnier-Matches (z. B. 7-Punkte-Match).',
                formula: 'Kazaross-XG2 MET: Gammon-Preis und Take Point ändern sich bei jedem Spielstand',
                details: [
                    'Crawford-Regel: Erreicht ein Spieler 1 Punkt vor dem Sieg (1-away), bleibt der Dopplungswürfel für genau ein Spiel gesperrt.',
                    'Post-Crawford: In den Folgepartien doppelt der Zurückliegende sofort, während der Führende den „Free Drop“ nutzt.',
                    'Jacoby-Regel (Money Game): Gammons (2×) und Backgammons (3×) zählen nur doppelt/dreifach, wenn zuvor gedoppelt wurde.',
                ],
            },
        ],
        strategySectionTitle: 'III. Großmeister-Spielpläne, Keith Count & Performance Rating (PR)',
        strategySectionDesc: 'Wie Weltmeister und die neuronale Open Sage 3-Ply-Engine (PR 0.23) jede Stellung analysieren.',
        strategyPillars: [
            {
                badge: 'Spielpläne',
                title: 'Die 5 Archetypen: Rennen, Blitz, Prime vs. Prime, Holding & Back Game',
                summary: 'Jeder Zug muss einem klaren Plan folgen, bestimmt durch Pip-Count, geschlossene Punkte und hintere Steine.',
                formula: 'Keith Count = Pip-Count + Strafen (Türme >3 auf Pkt. 1-3, Lücken auf 4-6, Steine außerhalb des Heimfelds)',
                details: [
                    'Rennen (Running Game): Nutzen Sie den Keith Count: Doppeln ab +4 korrigierten Pips, annehmen bis +14 % Rückstand.',
                    'Blitz-Angriff: Mit ≥10 Steinen in der Angriffszone und einem Gegner auf der Bar gnadenlos schlagen und das Heimfeld schließen.',
                    'Prime vs. Prime & Holding Game: Sichern Sie Golden Point (5) und Bar-Punkt (7) für eine unüberwindbare 6er-Prime.',
                ],
            },
            {
                badge: 'Spielstärke-Metrik',
                title: 'Performance Rating (PR) & Hybride Open Sage 3-Ply-Architektur',
                summary: 'Das PR misst Ihren durchschnittlichen Equity-Verlust pro echter Entscheidung multipliziert mit 500.',
                formula: 'PR = (Gesamter Equity-Verlust / Anzahl nicht-erzwungener Entscheidungen) × 500',
                details: [
                    'Weltskala: Super-GM (< 2.50) · Großmeister (2.50–5.00) · Meister (5.00–7.50) · Experte (7.50–10.00).',
                    'Blunder-Schwelle: Equity-Verlust ≥ 0.080 ist ein Blunder; 0.020 bis 0.080 eine Ungenauigkeit; < 0.020 Optimal.',
                    'Hybrid-Engine: Open Sage 3-Ply Cloud Run (PR 0.23) + Lokaler 3-Phasen-Evaluator mit exakter 54.264-Staaten-Bear-off-Datenbank.',
                ],
            },
        ],
        glossarySectionTitle: 'IV. Internationale Terminologie-Matrix (6 Sprachen)',
        glossarySectionDesc: 'Offizielles Fachwörterbuch des Turnier-Backgammons (XG / WBGF-Standard).',
        faqSectionTitle: 'V. Häufig gestellte Fragen (Offizielle Backgammon Tour & KI-Coach FAQ)',
        faqSectionDesc: 'Antworten auf die wichtigsten Fragen zu Turnierregeln, KI-Training und Strategie.',
        faqs: [
            {
                question: 'Wie kann ich kostenlos Backgammon online mit einem KI-Coach spielen?',
                answer: 'Auf Backgammon Tour (backgammontour.com) spielen Sie sofort kostenlos gegen unsere neuronale Open Sage Engine (4 Stufen bis Großmeister 3-Ply) oder im Mehrspieler-Modus – inklusive Echtzeit-Equity-Analyse und 100 % Offline-Modus.',
            },
            {
                question: 'Was ist der beste Eröffnungszug beim Backgammon?',
                answer: 'Der stärkste Eröffnungswurf ist 3-1 gespielt als 8/5 6/5 (+0.194 Equity), womit sofort der Golden Point (5er-Punkt) besetzt wird, gefolgt von 4-2 (8/4 6/4, +0.168) und 6-1 (13/7 8/7, +0.155, Bar-Punkt).',
            },
            {
                question: 'Wann sollte man beim Backgammon doppeln und annehmen (Take)?',
                answer: 'Bieten Sie das Doppel ab ~66 % Gewinnchance mit Marktvolatilität an und nehmen Sie an (Take), solange Ihre Gewinnchance mit lebendigem Würfel über ~21,5 % liegt (25 % bei totem Würfel).',
            },
            {
                question: 'Wie wird das Performance Rating (PR) im Backgammon berechnet?',
                answer: 'Nach dem internationalen eXtreme Gammon (XG)-Standard entspricht das PR dem durchschnittlichen Equity-Verlust pro echter Entscheidung multipliziert mit 500. Ein PR unter 5.0 entspricht Großmeister-Niveau.',
            },
        ],
        ctaPlayTitle: 'Bereit, die Großmeister-Theorie am Tisch des Cercle Monte-Carlo anzuwenden?',
        ctaPlayBtn: '🎲 Gegen 3-Ply-KI spielen',
        ctaDrillsBtn: '🎯 Blunder-Drills starten',
        ctaPuzzlesBtn: '🧩 Tägliches Puzzle lösen',
    },
    ar: {
        heroBadge: 'BACKGAMMONTOUR.COM · GAMMONACADEMY.COM',
        heroTitle: 'أكاديمية الغامون (Gammon Academy) — موسوعة الأستاذ الكبير ونظرية 3-Ply',
        heroSubtitle: 'المرجع الاستراتيجي الرسمي: جميع الرميات الافتتاحية الـ 15 المعتمدة من محرك Open Sage 3-Ply (PR 0.23)، ورياضيات مكعب المضاعفة (نقطة القبول 21.5%، قاعدة كروفورد، جاكوبي، وجدول Kazaross-XG2 MET)، وحساب تقييم الأداء PR.',
        navOpenings: '1. الافتتاحيات الـ 15',
        navCube: '2. إتقان مكعب المضاعفة',
        navStrategy: '3. الاستراتيجية ومعدل PR',
        navGlossary: '4. مصفوفة المصطلحات',
        navFaq: '5. الأسئلة الشائعة للبطولات',
        openingsSectionTitle: 'I. الدليل الكامل للرميات الافتتاحية الـ 15 في الباك غامون (القيمة المتوقعة 3-Ply)',
        openingsSectionDesc: 'نظراً لعدم إمكانية رمي نرد مزدوج في الدور الأول، توجد 15 رمية افتتاحية بالضبط. إليك الجدول المرجعي المعتمد من محركنا العصبي Open Sage 3-Ply.',
        colRoll: 'الرمية',
        colName: 'اللقب الكلاسيكي',
        colOptimal: 'النقلة المثلى (3-Ply)',
        colAlt: 'البديل (DMP / النتيجة)',
        colEquity: 'القيمة المتوقعة والفوز',
        colStrategy: 'الشرح الاستراتيجي للأستاذ الكبير',
        filterAll: 'جميع الرميات الـ 15',
        filterMakePoint: 'بناء البوابات (4)',
        filterSplit: 'الفصل والبناء (7)',
        filterSlot: 'التمهيد الهجومي (3)',
        filterRun: 'سباق خالص (1)',
        cubeSectionTitle: 'II. دليل إتقان مكعب المضاعفة (Doubling Cube & Match Equity)',
        cubeSectionDesc: 'يحوّل مكعب المضاعفة لعبة الباك غامون إلى رياضة احتمالات رياضية دقيقة. إتقان نقاط القبول (Take Points) وقواعد الاتحاد الدولي WBGF يختصر نصف أخطائك.',
        cubePillars: [
            {
                badge: 'العتبة الرياضية',
                title: 'نقطة القبول النظرية (25.0%) مقابل المكعب الحي (21.5%)',
                summary: 'مع مكعب ميت وبدون غامون، يتطلب قبول المضاعفة فرصة فوز 25.0%. لكن بفضل ميزة امتلاك المكعب وإعادة المضاعفة، تنخفض نقطة القبول الفعلية إلى ~21.5%.',
                formula: 'نقطة القبول (مكعب ميت) = 1 / (1 + 3) = 25.0% ← مكعب حي ≈ 21.5%',
                details: [
                    'نافذة المضاعفة الأولى: ضاعف عندما تتجاوز احتمالية فوزك 66% (مع وجود تقلبات في الموقف) وحتى 75%.',
                    'خسارة السوق (Market Losers): الوضعيات التي قد تقفز فوق 76–80% في الرمية القادمة يجب مضاعفتها فوراً.',
                    'أفضل من أن تضاعف (Too Good): إذا تجاوزت فرصة الغامون ~35% مع نسبة فوز >80%، احتفظ بالمكعب للعب على نقطتي الغامون.',
                ],
            },
            {
                badge: 'قواعد البطولات الرسمية WBGF',
                title: 'قاعدة كروفورد، ما بعد كروفورد وقاعدة جاكوبي',
                summary: 'تتغير استراتيجية المكعب جذرياً بين اللعب الحر (Money Game) ومباريات البطولات (مثل مباراة من 7 نقاط).',
                formula: 'جدول Kazaross-XG2 MET: يتغير سعر الغامون ونقطة القبول عند كل نتيجة في المباراة',
                details: [
                    'قاعدة كروفورد (Crawford): عندما يصل أحد اللاعبين إلى نقطة واحدة من الفوز (1-away)، يُجمّد المكعب لجولة واحدة بالضبط.',
                    'ما بعد كروفورد: في الجولات التالية، يضاعف المتأخر في أول فرصة قانونية، ويتمتع المتقدم بميزة الانسحاب المجاني (Free Drop).',
                    'قاعدة جاكوبي (Money Game): لا يُحتسب الغامون (2×) أو الباك غامون (3×) مضاعفاً إلا إذا تمت مضاعفة المكعب إلى 2 على الأقل.',
                ],
            },
        ],
        strategySectionTitle: 'III. خطط لعب الأستاذ الكبير، حساب كيث (Keith Count) وتقييم الأداء (PR)',
        strategySectionDesc: 'كيف يقيّم أبطال العالم ومحرك Open Sage 3-Ply (PR 0.23) أي وضعية على اللوحة في ثوانٍ.',
        strategyPillars: [
            {
                badge: 'خطط اللعب',
                title: 'الأنماط الخمسة: السباق، الهجوم الخاطف (Blitz)، الحاجز، الإمساك واللعب الخلفي',
                summary: 'يجب أن تخدم كل نقلة خطة متكاملة يحددها حساب النقاط (Pip Count) وهيكل البوابات المغلقة.',
                formula: 'حساب كيث = مجموع النقاط + العقوبات (تكدس >3 في النقاط 1-3، فراغات في 4-6، أحجار خارج البيت)',
                details: [
                    'السباق الخالص (Race): طبّق خوارزمية كيث: ضاعف عند التقدم بـ +4 نقاط مصححة، واقبل المكعب حتى تأخر بنسبة +14%.',
                    'الهجوم الخاطف (Blitz): مع وجود ≥10 أحجار في منطقة الهجوم وحجر للخصم على البار، اضرب بقوة لإغلاق بيتك الداخلي.',
                    'الحاجز المتصل (Prime vs Prime): سيطر على النقطة الذهبية (5) ونقطة البار (7) لبناء جدار من 6 بوابات متتالية.',
                ],
            },
            {
                badge: 'مقياس الاحتراف',
                title: 'تقييم الأداء (PR) والهندسة الهجينة لمحرك Open Sage 3-Ply',
                summary: 'يقيس معدل PR متوسط خسارتك في القيمة المتوقعة لكل قرار غير إجباري مضروباً في 500. كلما اقترب من الصفر زادت دقتك.',
                formula: 'PR = (إجمالي خسارة القيمة المتوقعة / عدد القرارات غير الإجبارية) × 500',
                details: [
                    'المقياس العالمي: أستاذ كبير خارق (< 2.50) · أستاذ كبير (2.50–5.00) · أستاذ (5.00–7.50) · خبير (7.50–10.00).',
                    'عتبة الخطأ الفادح (Blunder): خسارة ≥ 0.080 هي خطأ فادح؛ ومن 0.020 إلى 0.080 نقلة مشكوك فيها؛ وأقل من 0.020 نقلة مثلى.',
                    'المحرك الهجين: Open Sage 3-Ply السحابي (PR 0.23) + المقيّم المحلي ثلاثي المراحل مع قاعدة إخراج دقيقة لـ 54,264 حالة.',
                ],
            },
        ],
        glossarySectionTitle: 'IV. مصفوفة المصطلحات الدولية للباك غامون (6 لغات)',
        glossarySectionDesc: 'القاموس المقارن الرسمي لمصطلحات الباك غامون التنافسية (معيار XG / WBGF).',
        faqSectionTitle: 'V. الأسئلة الشائعة (الدليل الرسمي لـ Backgammon Tour والمدرب الذكي)',
        faqSectionDesc: 'إجابات شاملة لأكثر الأسئلة بحثاً حول قواعد البطولات، المدرب الذكي والتدريب التكتيكي.',
        faqs: [
            {
                question: 'كيف ألعب الباك غامون أونلاين مجاناً مع مدرب ذكاء اصطناعي؟',
                answer: 'على منصة Backgammon Tour (backgammontour.com)، يمكنك اللعب مجاناً فوراً ضد محركنا العصبي Open Sage (4 مستويات حتى الأستاذ الكبير 3-Ply) أو ضد لاعبين حقيقيين، مع تحليل فوري للقيمة المتوقعة ودعم كامل للعمل بدون إنترنت.',
            },
            {
                question: 'ما هي أفضل نقلة افتتاحية في الباك غامون؟',
                answer: 'أقوى رمية افتتاحية هي 3-1 وتُلعب 8/5 6/5 (+0.194 قيمة متوقعة) لبناء النقطة الذهبية (النقطة 5) فوراً، تليها 4-2 (8/4 6/4، +0.168) ثم 6-1 (13/7 8/7، +0.155 لبناء نقطة البار).',
            },
            {
                question: 'متى يجب مضاعفة المكعب أو قبوله في الباك غامون؟',
                answer: 'اعرض المضاعفة عندما تتجاوز فرصة فوزك ~66% مع وجود تقلبات، واقبل المضاعفة (Take) طالما بقيت فرصتك في الفوز أعلى من ~21.5% مع مكعب حي (أو 25% مع مكعب ميت).',
            },
            {
                question: 'كيف يتم حساب تقييم الأداء (PR) في الباك غامون؟',
                answer: 'وفق المعيار الدولي eXtreme Gammon (XG)، يساوي معدل PR متوسط خسارة القيمة المتوقعة لكل قرار غير إجباري مضروباً في 500. تحقيق معدل أقل من 5.0 يعني اللعب بمستوى الأستاذ الكبير.',
            },
        ],
        ctaPlayTitle: 'هل أنت مستعد لتطبيق نظرية الأساتذة الكبار على طاولة نادي مونت كارلو؟',
        ctaPlayBtn: '🎲 العب ضد الذكاء الاصطناعي 3-Ply',
        ctaDrillsBtn: '🎯 ابدأ تدريبات تصحيح الأخطاء',
        ctaPuzzlesBtn: '🧩 حل لغز اليوم',
    },
};

export function getAcademyContent(locale: Locale): AcademyLocaleContent {
    if (locale in ACADEMY_CONTENT) {
        return ACADEMY_CONTENT[locale as PrimaryLocale];
    }
    return ACADEMY_CONTENT.en;
}
