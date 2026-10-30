/**
 * @file src/features/academy/beginnerRulesCourse.ts
 * @description Parcours Interactif « Apprendre à Jouer au Backgammon (Spécial Débutant) » en 5 Leçons + Quiz + Bravos + Sync Supabase.
 *
 * Conçu pour une personne qui n'a JAMAIS joué au Backgammon :
 *   - Leçon 1 : Le But du Jeu & Le Trajet en Fer à Cheval (15 dames vers la Maison)
 *   - Leçon 2 : Lancer les Dés & Le Cadeau des Doubles (jouer 4 fois !)
 *   - Leçon 3 : La Porte (2 dames = mur protégé) vs Le Pion Isolé (envoyé sur la Barre)
 *   - Leçon 4 : La Sortie des Dames (Bear-Off : vider sa Maison en premier)
 *   - Leçon 5 : Le Dé Multiplicateur (Videau x2) & Le Gammon (Gagner Double)
 *
 * Couche Logique Pure & Persistance Hybride (localStorage + Supabase) : 0 `any`, ≤ 300 lignes.
 */

import { createInitialState } from '../../engine/backgammonEngine';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase/client';

export const BEGINNER_COURSE_STORAGE_KEY = 'bg_beginner_rules_completed_v1';

export interface BeginnerLessonQuizOption {
    readonly id: 'a' | 'b' | 'c';
    readonly text: string;
    readonly isCorrect: boolean;
    readonly feedbackText: string;
}

export interface BeginnerRuleLesson {
    readonly id: string;
    readonly stepNumber: 1 | 2 | 3 | 4 | 5;
    readonly icon: string;
    readonly title: string;
    readonly subtitle: string;
    readonly visualCaption: string;
    readonly keyRuleBullets: readonly [string, string, string];
    readonly board: ReadonlyArray<number>;
    readonly dice: readonly [number, number];
    readonly quizQuestion: string;
    readonly quizOptions: readonly [
        BeginnerLessonQuizOption,
        BeginnerLessonQuizOption,
        BeginnerLessonQuizOption,
    ];
    readonly bravoTitle: string;
    readonly bravoRewardBadge: string;
}

function createCustomBoard(xPoints: Record<number, number>, oPoints: Record<number, number>): number[] {
    const b = new Array<number>(26).fill(0);
    for (const [pt, count] of Object.entries(xPoints)) b[Number(pt)] = count;
    for (const [pt, count] of Object.entries(oPoints)) b[Number(pt)] = -count;
    return b;
}

export const BEGINNER_RULES_LESSONS: ReadonlyArray<BeginnerRuleLesson> = [
    {
        id: 'lesson-1-horseshoe',
        stepNumber: 1,
        icon: '🧭',
        title: 'Leçon 1 : Le But du Jeu & Le Sens de Marche',
        subtitle: 'Ramenez vos 15 dames dans votre Maison et sortez-les avant votre adversaire !',
        visualCaption: 'Position de départ : vos 15 dames claires descendent de la case 24 vers votre Maison (cases 6 à 1).',
        keyRuleBullets: [
            'Vous commencez avec 15 dames disposées sur le plateau en forme de fer à cheval.',
            'Vos dames avancent toujours dans le même sens : de la case 24 jusqu’à la case 1 (votre Maison).',
            'Votre adversaire fait le chemin inverse : le premier qui sort ses 15 dames du plateau gagne !',
        ],
        board: createInitialState().board,
        dice: [3, 1],
        quizQuestion: 'Quel est votre objectif final pour remporter une partie de Backgammon ?',
        quizOptions: [
            {
                id: 'a',
                text: 'Capturer définitivement toutes les dames de l’adversaire comme aux Dames.',
                isCorrect: false,
                feedbackText: 'Au Backgammon, aucune dame n’est jamais éliminée du jeu ! Tout le monde reste en course.',
            },
            {
                id: 'b',
                text: 'Ramener vos 15 dames dans votre Maison (cases 1 à 6) puis les sortir toutes en premier.',
                isCorrect: true,
                feedbackText: '🎉 Bravo ! C’est une course tactique : rassemblez vos 15 dames dans votre Maison puis sortez-les toutes !',
            },
            {
                id: 'c',
                text: 'Aligner 5 dames sur la barre centrale.',
                isCorrect: false,
                feedbackText: 'La barre centrale est une prison temporaire, pas un objectif !',
            },
        ],
        bravoTitle: '🎉 Bravo ! Vous maîtrisez le sens de marche (+20 XP)',
        bravoRewardBadge: '🧭 Explorateur du Tablier',
    },
    {
        id: 'lesson-2-dice-doubles',
        stepNumber: 2,
        icon: '🎲',
        title: 'Leçon 2 : Lancer les Dés & Le Cadeau des Doubles',
        subtitle: 'Chaque dé est un déplacement... et les Doubles comptent double !',
        visualCaption: 'Exemple : avec un lancer 5 et 3, vous pouvez avancer une dame de 5 cases + une autre de 3 cases (ou la même dame de 5 puis 3) !',
        keyRuleBullets: [
            'Vous lancez 2 dés : vous pouvez déplacer deux dames différentes, ou une seule dame en deux étapes.',
            'Cadeau spécial : si vous tirez un Double (ex: deux 6), vous jouez QUATRE fois le chiffre 6 !',
            'Si les deux dés peuvent être joués légalement, vous avez l’obligation d’utiliser les deux.',
        ],
        board: createCustomBoard({ 24: 2, 13: 5, 8: 2, 6: 4, 3: 2 }, { 1: 2, 12: 5, 17: 3, 19: 5 }),
        dice: [6, 6],
        quizQuestion: 'Surprise ! Vous lancez un Double 4 (4 et 4). Combien de fois avez-vous le droit d’avancer de 4 cases ?',
        quizOptions: [
            {
                id: 'a',
                text: '2 fois seulement, comme un lancer normal.',
                isCorrect: false,
                feedbackText: 'Encore mieux que ça : un double est le plus beau cadeau du Backgammon !',
            },
            {
                id: 'b',
                text: '4 fois ! Vous jouez quatre déplacements de 4 cases (soit 16 cases au total).',
                isCorrect: true,
                feedbackText: '🎉 Bravo ! Tous les doubles (1-1 à 6-6) se jouent 4 fois : c’est un turbo décisif dans la course !',
            },
            {
                id: 'c',
                text: 'Vous rejouez simplement les dés sans bouger.',
                isCorrect: false,
                feedbackText: 'Non, vous avancez bel et bien 4 fois de 4 cases !',
            },
        ],
        bravoTitle: '🎉 Bravo ! Le secret des Doubles n’a plus de mystère (+20 XP)',
        bravoRewardBadge: '🎲 Maître des Dés',
    },
    {
        id: 'lesson-3-doors-and-hits',
        stepNumber: 3,
        icon: '🏰',
        title: 'Leçon 3 : Créer une Porte vs Frapper un Pion Isolé',
        subtitle: 'Deux dames ensemble forment un bouclier ; une dame seule est en danger !',
        visualCaption: 'Sur la case 5, vos 2 dames forment une Porte infranchissable. Une dame ennemie isolée frappée va sur la Barre centrale !',
        keyRuleBullets: [
            'Une Porte (2 dames ou plus de votre couleur sur la même flèche) bloque totalement l’adversaire : il ne peut pas s’y poser.',
            'Un Pion isolé (1 seule dame sur une flèche) est vulnérable : si l’adversaire atterrit dessus, il le frappe !',
            'Un pion frappé est posé sur la Barre centrale et doit repartir tout au début du parcours adverse.',
        ],
        board: createCustomBoard({ 24: 2, 13: 4, 8: 2, 6: 5, 5: 2 }, { 25: 1, 1: 1, 12: 5, 17: 3, 19: 5 }),
        dice: [3, 1],
        quizQuestion: 'Combien de dames devez-vous placer sur une même case pour créer une « Porte » imprenable ?',
        quizOptions: [
            {
                id: 'a',
                text: 'Au moins 2 dames de votre couleur.',
                isCorrect: true,
                feedbackText: '🎉 Bravo ! Dès que 2 de vos dames occupent une case, elle devient une forteresse interdite à l’adversaire !',
            },
            {
                id: 'b',
                text: '1 seule dame suffit pour bloquer la case.',
                isCorrect: false,
                feedbackText: 'Attention : 1 seule dame est un pion isolé qui peut être frappé et envoyé sur la Barre !',
            },
            {
                id: 'c',
                text: 'Il faut obligatoirement empiler 5 dames.',
                isCorrect: false,
                feedbackText: '2 dames suffisent ! Au-delà de 2, vos dames supplémentaires peuvent servir ailleurs.',
            },
        ],
        bravoTitle: '🎉 Bravo ! Vous savez bâtir des Portes et frapper (+20 XP)',
        bravoRewardBadge: '🏰 Bâtisseur de Portes',
    },
    {
        id: 'lesson-4-bearoff',
        stepNumber: 4,
        icon: '🏁',
        title: 'Leçon 4 : Sortir ses Dames de la Maison',
        subtitle: 'La ligne d’arrivée : videz votre Maison pour remporter la manche !',
        visualCaption: 'Vos 15 dames sont toutes arrivées dans votre Maison (cases 1 à 6) : chaque dé sort désormais une dame dans le râtelier !',
        keyRuleBullets: [
            'Vous ne pouvez commencer à sortir vos dames que lorsque vos 15 dames sont toutes dans votre Maison (cases 1 à 6).',
            'Un dé 4 permet de sortir une dame située sur la case 4 (et un dé 6 sort de la case 6 ou de la case occupée la plus haute).',
            'Attention : si une de vos dames est frappée pendant la sortie, elle doit refaire tout le tour avant que vous puissiez ressortir !',
        ],
        board: createCustomBoard({ 6: 2, 5: 3, 4: 3, 3: 3, 2: 2, 1: 2 }, { 19: 3, 20: 3, 21: 3, 22: 3, 23: 3 }),
        dice: [6, 4],
        quizQuestion: 'À quelle condition avez-vous le droit de commencer à sortir vos dames hors du plateau ?',
        quizOptions: [
            {
                id: 'a',
                text: 'Dès le premier tour de jeu si vous tirez un 6.',
                isCorrect: false,
                feedbackText: 'Non, il faut d’abord ramener toute votre armée à la maison !',
            },
            {
                id: 'b',
                text: 'Uniquement lorsque vos 15 dames sont toutes réunies dans votre Maison (cases 1 à 6).',
                isCorrect: true,
                feedbackText: '🎉 Bravo ! Dès que les 15 dames sont à la Maison, la sortie commence jusqu’à la victoire !',
            },
            {
                id: 'c',
                text: 'Quand l’adversaire vous en donne l’autorisation.',
                isCorrect: false,
                feedbackText: 'Pas besoin de permission : rassemblez vos 15 dames dans les cases 1 à 6 et sortez !',
            },
        ],
        bravoTitle: '🎉 Bravo ! Vous êtes prêt à franchir la ligne d’arrivée (+20 XP)',
        bravoRewardBadge: '🏁 Finisseur Éclair',
    },
    {
        id: 'lesson-5-cube-and-gammon',
        stepNumber: 5,
        icon: '💎',
        title: 'Leçon 5 : Le Videau (x2) & Le Gammon (Victoire Double)',
        subtitle: 'Le piment du Backgammon : doublez les enjeux ou gagnez 2 points d’un coup !',
        visualCaption: 'Le gros dé « 2, 4, 8… » est le Videau : proposez-le avant de lancer vos dés si vous sentez que vous avez un net avantage !',
        keyRuleBullets: [
            'Victoire simple = 1 point. Mais si vous sortez vos 15 dames avant que l’adversaire n’en ait sorti une seule, c’est un GAMMON = 2 points !',
            'Avant de lancer vos dés, vous pouvez tourner le Videau sur « 2 » pour proposer de doubler la valeur de la partie.',
            'Votre adversaire a alors un choix : Accepter (la partie vaut désormais 2 points) ou Abandonner immédiatement en vous laissant 1 point !',
        ],
        board: createCustomBoard({ 3: 2, 2: 2, 1: 2 }, { 19: 5, 20: 5, 21: 5 }),
        dice: [3, 2],
        quizQuestion: 'Vous proposez le Videau (x2) parce que vous dominez la partie. Que se passe-t-il si votre adversaire a peur et refuse ?',
        quizOptions: [
            {
                id: 'a',
                text: 'La partie continue normalement pour 1 point.',
                isCorrect: false,
                feedbackText: 'Au contraire : refuser le Videau équivaut à déposer les armes sur cette manche !',
            },
            {
                id: 'b',
                text: 'Vous gagnez immédiatement la manche et marquez 1 point sans même avoir à finir !',
                isCorrect: true,
                feedbackText: '🎉 Bravo ! Forcer l’adversaire à abandonner grâce au Videau est l’une des plus grandes joies du Backgammon !',
            },
            {
                id: 'c',
                text: 'Vous perdez votre tour de jeu.',
                isCorrect: false,
                feedbackText: 'Non : s’il refuse, vous remportez la manche sur-le-champ ; s’il accepte, vous lancez vos dés pour 2 points !',
            },
        ],
        bravoTitle: '🏆 Félicitations ! Diplôme d’Initiation au Backgammon Débloqué (+50 XP)',
        bravoRewardBadge: '🎓 Diplômé Gammon Academy',
    },
];

/** Lit la liste des identifiants de leçons débutant validées localement. */
export function getCompletedBeginnerLessons(): string[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
        const raw = window.localStorage.getItem(BEGINNER_COURSE_STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
        return [];
    }
}

/**
 * Enregistre la réussite d'une leçon débutant dans `localStorage` et synchronise
 * de manière non-bloquante avec Supabase (`user_achievements`) si l'utilisateur est connecté.
 */
export async function markBeginnerLessonCompleted(lessonId: string): Promise<string[]> {
    const current = getCompletedBeginnerLessons();
    const updated = current.includes(lessonId) ? current : [...current, lessonId];

    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.setItem(BEGINNER_COURSE_STORAGE_KEY, JSON.stringify(updated));
        } catch {
            // Ignore quota
        }
    }

    if (isSupabaseConfigured()) {
        try {
            const supabase = getSupabaseClient();
            if (supabase) {
                const { data } = await supabase.auth.getUser();
                const userId = data?.user?.id;
                if (userId) {
                    await supabase
                        .from('profiles')
                        .update({
                            activated_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            ...(updated.length >= BEGINNER_RULES_LESSONS.length
                                ? { experience_level: 'intermediate' as const }
                                : {}),
                        })
                        .eq('id', userId);
                }
            }
        } catch {
            // Synchronisation cloud silencieuse en arrière-plan
        }
    }

    return updated;
}
