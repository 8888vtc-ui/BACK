/**
 * @file src/features/coach/coachVariedCheckerBank.ts
 * @description Banque de gabarits factuels 3-ply courts et variés pour le Coach IA (Checker Play).
 * Strictement <= 200 lignes, 0 any, déterministe et conforme aux standards XG / Open Sage.
 */

import {
    selectVariantIndex,
    type VariedCheckerCategory,
    type VariedCopyContext,
    type VariedExplanationCopy,
} from './coachVariedMessagesBank';

interface ContextView {
    readonly pld: string;
    readonly opt: string;
    readonly lossStr: string;
    readonly uShots: number;
    readonly bShots: number;
}

interface ThemeInfo {
    readonly theme: string;
    readonly concept: string;
    readonly principle: string;
}

const CATEGORY_THEMES: Record<VariedCheckerCategory, ThemeInfo> = {
    SHOT_EXPOSURE: { theme: 'exposition aux tirs', concept: 'la sécurité des pions', principle: 'minimiser les tirs directs adverses' },
    GOLDEN_POINT: { theme: 'point 20 / point 5 (Golden Point)', concept: 'le contrôle du Golden Point', principle: 'occuper le point 20 ou le point 5 pour ancrer la position' },
    BAR_POINT: { theme: 'point 18 / point 7 (Bar Point)', concept: 'le contrôle du bar-point', principle: 'bloquer la sortie adverse via le bar-point' },
    PRIME_EXTEND: { theme: 'construction de prime', concept: 'l’extension du barrage', principle: 'maintenir une prime continue pour asphyxier l’adversaire' },
    TEMPO_HIT: { theme: 'frappe de tempo', concept: 'l’initiative tactique', principle: 'frapper au bon tempo pour priver l’adversaire de relance' },
    REAR_ESCAPE: { theme: 'libération des coureurs', concept: 'l’évasion des dames arrières', principle: 'avancer les pions arrières avant d’être bloqué' },
    ENDGAME_CONTACT_BREAK: { theme: 'rupture de contact en finale', concept: 'le timing de désengagement', principle: 'conserver le contact tant que la course est défavorable' },
    PURE_RACE: { theme: 'transition en course pure', concept: 'l’efficacité des pips', principle: 'maximiser la vitesse en course sans concéder de retard' },
    HOME_GATE: { theme: 'fermeture de porte intérieure', concept: 'la consolidation du jan intérieur', principle: 'fermer son jan pour punir les rentrées adverses' },
    ADVANCED_ANCHOR: { theme: 'ancrage avancé', concept: 'la solidité des ancres', principle: 'établir une ancre avancée contre les attaques adverses' },
    BACK_SPLIT: { theme: 'séparation des coureurs', concept: 'la diversification des cibles', principle: 'séparer ses pions arrières pour multiplier les options de sortie' },
    MIDPOINT_UNSTACK: { theme: 'dégagement du point 13', concept: 'la fluidité des constructeurs', principle: 'dégager le point 13 pour alimenter ses blocs d’attaque' },
    POSITIONAL_FLEXIBILITY: { theme: 'flexibilité positionnelle', concept: 'la mobilité globale', principle: 'préserver la mobilité de ses pions sur tous les lancers' },
};

const TEMPLATES: ReadonlyArray<(c: ContextView, t: ThemeInfo) => VariedExplanationCopy> = [
    (c, t) => ({
        summary: `Priorité tactique (${t.theme}) : ${c.opt} surpasse ${c.pld} (-${c.lossStr} EMG).`,
        whyFailed: `En jouant ${c.pld}, vous négligez ${t.concept} essentiel à cette phase.`,
        whyOptimal: `Le coup optimal ${c.opt} renforce directement ${t.concept} tout en préservant l'initiative.`,
        advice: `Règle clé : ${t.principle} reste la priorité selon l'analyse 3-ply.`,
    }),
    (c, t) => ({
        summary: `Choix stratégique (${t.theme}) : ${c.opt} est supérieur à ${c.pld} (-${c.lossStr} EMG).`,
        whyFailed: `Votre coup ${c.pld} compromet ${t.concept} sans compensation suffisante.`,
        whyOptimal: `Jouer ${c.opt} maximise l'efficacité positionnelle et consolide ${t.concept}.`,
        advice: `Pensez à ${t.principle} pour stabiliser votre équité globale.`,
    }),
    (c, t) => ({
        summary: `Analyse 3-ply (${t.theme}) : recommandation ${c.opt} contre ${c.pld} (-${c.lossStr} EMG).`,
        whyFailed: `Avec ${c.pld}, vous perdez le contrôle sur ${t.concept} face à l'adversaire.`,
        whyOptimal: `La ligne ${c.opt} verrouille ${t.concept} et réduit les faiblesses structurelles.`,
        advice: `Garder en tête : ${t.principle} évite les retournements de situation.`,
    }),
    (c, t) => ({
        summary: `Structure & tempo (${t.theme}) : ${c.opt} gagne nettement sur ${c.pld} (-${c.lossStr} EMG).`,
        whyFailed: `Le coup ${c.pld} déséquilibre vos blocs et affaiblit ${t.concept}.`,
        whyOptimal: `Préférer ${c.opt} assure la cohésion des pions tout en appuyant ${t.concept}.`,
        advice: `La théorie moderne enseigne de ${t.principle}.`,
    }),
    (c, t) => ({
        summary: `Évaluation cubeful (${t.theme}) : ${c.opt} devance ${c.pld} de -${c.lossStr} EMG.`,
        whyFailed: `En optant pour ${c.pld}, vous exposez une faiblesse liée à ${t.concept}.`,
        whyOptimal: `Sélectionner ${c.opt} convertit l'avantage tactique grâce à ${t.concept}.`,
        advice: `Dans cette configuration, ${t.principle} produit le meilleur rendement d'équité.`,
    }),
    (c, t) => ({
        summary: `Vision Grand-Maître (${t.theme}) : ${c.opt} est plus solide que ${c.pld} (-${c.lossStr} EMG).`,
        whyFailed: `Votre sélection ${c.pld} fragilise ${t.concept} au mauvais moment.`,
        whyOptimal: `Le coup de référence ${c.opt} optimise immédiatement ${t.concept}.`,
        advice: `Appliquez le principe : ${t.principle}.`,
    }),
    (c, t) => ({
        summary: `Différentiel d'équité (${t.theme}) : ${c.opt} surpasse ${c.pld} (-${c.lossStr} EMG).`,
        whyFailed: `Le choix ${c.pld} cède du terrain sur ${t.concept}.`,
        whyOptimal: `Adopter ${c.opt} restaure la supériorité en imposant ${t.concept}.`,
        advice: `Surveillez toujours : ${t.principle}.`,
    }),
    (c, t) => ({
        summary: `Optimisation de position (${t.theme}) : ${c.opt} bat ${c.pld} (-${c.lossStr} EMG).`,
        whyFailed: `En jouant ${c.pld}, vous manquez l'opportunité de servir ${t.concept}.`,
        whyOptimal: `Exécuter ${c.opt} coordonne vos dames et matérialise ${t.concept}.`,
        advice: `Retenez cette loi du jeu : ${t.principle}.`,
    }),
    (c, t) => ({
        summary: `Précision technique (${t.theme}) : ${c.opt} est le choix 3-ply face à ${c.pld} (-${c.lossStr} EMG).`,
        whyFailed: `Ce coup ${c.pld} sous-estime l'importance de ${t.concept}.`,
        whyOptimal: `La recommandation ${c.opt} stabilise la position en sécurisant ${t.concept}.`,
        advice: `Le plan directeur exige de ${t.principle}.`,
    }),
    (c, t) => ({
        summary: `Bilan positionnel (${t.theme}) : ${c.opt} surclasse ${c.pld} (-${c.lossStr} EMG).`,
        whyFailed: `La ligne ${c.pld} disperse l'effort au détriment de ${t.concept}.`,
        whyOptimal: `Le jeu optimal ${c.opt} unifie vos forces autour de ${t.concept}.`,
        advice: `Conseil stratégique : ${t.principle}.`,
    }),
];

export function pickVariedCheckerErrorCopy(
    category: VariedCheckerCategory,
    ctx: VariedCopyContext,
): VariedExplanationCopy {
    const lossMilli = Math.round(Math.abs(ctx.equityLoss) * 1000);
    const lossStr = Math.abs(ctx.equityLoss).toFixed(3);
    const seed = `${category}|${ctx.playedMove}|${ctx.optimalMove}|${lossMilli}|${ctx.userShots ?? 0}|${ctx.playerPips ?? 0}|${ctx.seedExtra ?? ''}`;
    const idx =
        typeof ctx.seedExtra === 'number' && Number.isFinite(ctx.seedExtra)
            ? Math.abs(Math.trunc(ctx.seedExtra)) % 10
            : selectVariantIndex(seed, 10);

    const view: ContextView = {
        pld: ctx.playedMove || 'Coup joué',
        opt: ctx.optimalMove || 'Coup optimal',
        lossStr,
        uShots: ctx.userShots ?? 0,
        bShots: ctx.bestShots ?? 0,
    };

    if (category === 'SHOT_EXPOSURE') {
        const shotsVariants: ReadonlyArray<VariedExplanationCopy> = [
            { summary: `Le coup ${view.pld} concède ${view.uShots} tirs directs contre seulement ${view.bShots} pour ${view.opt}.`, whyFailed: `En jouant ${view.pld}, vous laissez un blot vulnérable offrant ${view.uShots} chances sur 36 de frapper.`, whyOptimal: `Le coup optimal ${view.opt} réduit cette exposition à ${view.bShots} tirs tout en consolidant votre structure.`, advice: `Surveillez toujours les tirs directs (1–6 cases) avant de laisser un blot.` },
            { summary: `Exposition critique : ${view.pld} offre ${view.uShots} tirs directs sur 36 (contre ${view.bShots} avec ${view.opt}).`, whyFailed: `Votre coup ${view.pld} disperse vos pions et multiplie les dés de frappe (${view.uShots}/36).`, whyOptimal: `Jouer ${view.opt} resserre vos blocs et abaisse immédiatement le danger à ${view.bShots}/36.`, advice: `Dupliquez les dés adverses pour minimiser les tirs directs concédés.` },
            { summary: `Danger de frappe : ${view.uShots} tirs directs concédés sur ${view.pld} au lieu de ${view.bShots} via ${view.opt}.`, whyFailed: `Avec ${view.pld}, un pion reste à découvert sous le feu adverse (${view.uShots} lancers sur 36).`, whyOptimal: `La variante ${view.opt} sécurise vos pions vulnérables (${view.bShots}/36 tirs) sans céder le tempo.`, advice: `Un pion frappé vous fait perdre la course en pips et l'initiative tactique.` },
            { summary: `Vulnérabilité tactique : ${view.pld} concède ${view.uShots} tirs directs face à ${view.opt} (${view.bShots}/36).`, whyFailed: `Le choix ${view.pld} sous-estime la probabilité de riposte adverse (${view.uShots} combinaisons).`, whyOptimal: `Préférer ${view.opt} verrouille la sécurité de vos dames (${view.bShots}/36) et préserve votre équité.`, advice: `Évitez d'offrir des tirs directs quand l'adversaire possède un jan offensif.` },
            { summary: `Alerte tirs directs : ${view.pld} concède ${view.uShots} tirs directs contre ${view.bShots} pour ${view.opt}.`, whyFailed: `Votre ligne ${view.pld} cède ${view.uShots} dés directs sans compensation d'équité.`, whyOptimal: `Le choix ${view.opt} neutralise la menace (${view.bShots}/36 tirs) avec efficacité.`, advice: `La sécurité des blocs passe avant toute dispersion de pions.` },
            { summary: `Péril de réplique : ${view.pld} concède ${view.uShots} tirs directs contre ${view.bShots} pour ${view.opt}.`, whyFailed: `En jouant ${view.pld}, vous invitez l'adversaire à frapper (${view.uShots}/36).`, whyOptimal: `La recommandation ${view.opt} immunise vos pions (${view.bShots}/36).`, advice: `Ne laissez pas de cible sans calcul strict des tirs adverses.` },
            { summary: `Fragilité défensive : ${view.pld} concède ${view.uShots} tirs directs contre ${view.bShots} via ${view.opt}.`, whyFailed: `Ce choix ${view.pld} ouvre ${view.uShots} tirs sur 36 au joueur adverse.`, whyOptimal: `L'alternative ${view.opt} consolide les ancres et limite à ${view.bShots}/36.`, advice: `Minimisez les tirs directs pour conserver votre contrôle de position.` },
            { summary: `Calcul d'exposition : ${view.pld} autorise ${view.uShots} tirs directs contre ${view.bShots} avec ${view.opt}.`, whyFailed: `Avec ${view.pld}, la probabilité de riposte adverse est élevée (${view.uShots}/36).`, whyOptimal: `Jouer ${view.opt} protège l'essentiel avec seulement ${view.bShots}/36 tirs.`, advice: `Anticipez toujours la riposte avant de bouger un constructeur.` },
            { summary: `Menace adverse : ${view.pld} subit ${view.uShots} tirs directs contre ${view.bShots} pour ${view.opt}.`, whyFailed: `Le jeu ${view.pld} offre ${view.uShots} lancers gagnants à l'adversaire.`, whyOptimal: `Le coup ${view.opt} réduit drastiquement l'exposition à ${view.bShots}/36.`, advice: `La réduction des tirs directs est un pilier de la victoire 3-ply.` },
            { summary: `Exposition inutile : ${view.pld} concède ${view.uShots} tirs directs face à ${view.opt} (${view.bShots}/36).`, whyFailed: `Vous laissez ${view.pld} exposé à ${view.uShots} tirs directs alors que ${view.opt} était sûr.`, whyOptimal: `Adopter ${view.opt} est plus solide (${view.bShots}/36 tirs) et préserve vos gains.`, advice: `Quand une ligne sûre existe (${view.bShots} tirs), évitez l'aventure à ${view.uShots} tirs.` },
        ];
        return shotsVariants[idx % shotsVariants.length];
    }

    const theme = CATEGORY_THEMES[category] ?? CATEGORY_THEMES.POSITIONAL_FLEXIBILITY;
    const templateFn = TEMPLATES[idx % TEMPLATES.length] ?? TEMPLATES[0];
    return templateFn(view, theme);
}
