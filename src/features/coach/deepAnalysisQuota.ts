/**
 * @file src/features/coach/deepAnalysisQuota.ts
 * @description Gestion du quota quotidien « 🧠 Analyse Profonde » (1 offerte / jour en mode Gratuit,
 * illimitée en mode Pass Club / Grand-Maître) et des 3 Questions Socratiques en 1 clic basées
 * sur la télémétrie complète Open Sage Max (0 mention de numéro de modèle technique, 0 `any`).
 */

import type { StrategicFeatures } from './featureExtractor';
import type { PedagogicalExplanation, SymbolicAudit } from '../../lib/coach/symbolicAudit';

export const FREE_DAILY_DEEP_ANALYSES_LIMIT = 1;
export const DEEP_ANALYSIS_QUOTA_STORAGE_KEY = 'backgammon.dailyDeepAnalysisQuota';
export const VIP_OVERRIDE_STORAGE_KEY = 'backgammon.vipPassActive';
export const CHAMELEON_LAYER_STORAGE_KEY = 'backgammon.chameleonLayer';

export type ChameleonUxLayer = 'L0' | 'L1' | 'L2';

export function readChameleonUxLayer(): ChameleonUxLayer {
    if (typeof window === 'undefined' || !window.localStorage) return 'L1';
    try {
        const val = window.localStorage.getItem(CHAMELEON_LAYER_STORAGE_KEY);
        if (val === 'L0' || val === 'L1' || val === 'L2') return val;
    } catch {
        // ignore
    }
    return 'L1';
}

export function writeChameleonUxLayer(layer: ChameleonUxLayer): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(CHAMELEON_LAYER_STORAGE_KEY, layer);
    } catch {
        // ignore
    }
}

export function formatChameleonLossBadge(
    equityLoss: number | null | undefined,
    layer: ChameleonUxLayer,
    locale: string = 'fr',
): string {
    const absLoss = Math.abs(equityLoss ?? 0);
    const isEn = locale.startsWith('en');
    const winDropPct = Math.min(48, Math.max(1, Math.round(absLoss * 50)));
    if (layer === 'L0') {
        return isEn ? `-${winDropPct}% win chance` : `-${winDropPct} % de chances de gagner`;
    }
    if (layer === 'L1') {
        return isEn
            ? `-${winDropPct}% win · -${absLoss.toFixed(3)} EMG`
            : `-${winDropPct} % de gain · -${absLoss.toFixed(3)} EMG`;
    }
    const pr = (absLoss * 500).toFixed(1);
    return `-${absLoss.toFixed(3)} EMG · PR +${pr} · -${winDropPct}% MWC`;
}

export interface DeepAnalysisQuotaRecord {
    readonly dateKey: string;
    readonly usedCount: number;
    readonly unlockedMoveKeys: ReadonlyArray<string>;
}

export interface DeepAnalysisQuotaState {
    readonly isVip: boolean;
    readonly usedToday: number;
    readonly maxDaily: number;
    readonly remainingToday: number;
    readonly canRunDeepAnalysis: boolean;
    readonly isCurrentMoveUnlocked: boolean;
    readonly isPaywallLocked: boolean;
}

export type DeepQuestionId = 'why_equity' | 'next_36_rolls' | 'cube_and_plan';

export interface DeepSocraticQuestionItem {
    readonly id: DeepQuestionId;
    readonly label: string;
    readonly answer: string;
}

function getTodayDateKey(now: Date = new Date()): string {
    return now.toISOString().slice(0, 10);
}

export function isVipPassActiveInStorage(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
        if (window.localStorage.getItem(VIP_OVERRIDE_STORAGE_KEY) === 'true') return true;
        const rawProfile = window.localStorage.getItem('backgammon.subscriptionTier');
        return (
            rawProfile === 'coach_monthly' ||
            rawProfile === 'coach_yearly' ||
            rawProfile === 'club_chouette' ||
            rawProfile === 'pro_reverse_trial'
        );
    } catch {
        return false;
    }
}

export function loadDeepAnalysisQuotaRecord(now: Date = new Date()): DeepAnalysisQuotaRecord {
    const today = getTodayDateKey(now);
    const fresh: DeepAnalysisQuotaRecord = {
        dateKey: today,
        usedCount: 0,
        unlockedMoveKeys: [],
    };
    if (typeof window === 'undefined' || !window.localStorage) return fresh;
    try {
        const raw = window.localStorage.getItem(DEEP_ANALYSIS_QUOTA_STORAGE_KEY);
        if (!raw) return fresh;
        const parsed = JSON.parse(raw) as Partial<DeepAnalysisQuotaRecord> | null;
        if (!parsed || parsed.dateKey !== today) {
            window.localStorage.setItem(DEEP_ANALYSIS_QUOTA_STORAGE_KEY, JSON.stringify(fresh));
            return fresh;
        }
        return {
            dateKey: today,
            usedCount:
                typeof parsed.usedCount === 'number' && Number.isFinite(parsed.usedCount)
                    ? Math.max(0, Math.floor(parsed.usedCount))
                    : 0,
            unlockedMoveKeys: Array.isArray(parsed.unlockedMoveKeys)
                ? parsed.unlockedMoveKeys.filter((k): k is string => typeof k === 'string')
                : [],
        };
    } catch {
        return fresh;
    }
}

export function getDeepAnalysisQuotaState(
    moveKey: string,
    isVipOverride?: boolean,
    now: Date = new Date(),
): DeepAnalysisQuotaState {
    const isVip = Boolean(isVipOverride || isVipPassActiveInStorage());
    const rec = loadDeepAnalysisQuotaRecord(now);
    const isCurrentMoveUnlocked = isVip || (Boolean(moveKey) && rec.unlockedMoveKeys.includes(moveKey));
    const remainingToday = isVip
        ? Number.POSITIVE_INFINITY
        : Math.max(0, FREE_DAILY_DEEP_ANALYSES_LIMIT - rec.usedCount);
    const canRunDeepAnalysis = isVip || isCurrentMoveUnlocked || remainingToday > 0;
    return {
        isVip,
        usedToday: rec.usedCount,
        maxDaily: FREE_DAILY_DEEP_ANALYSES_LIMIT,
        remainingToday,
        canRunDeepAnalysis,
        isCurrentMoveUnlocked,
        isPaywallLocked: !canRunDeepAnalysis,
    };
}

export function consumeDeepAnalysisQuota(
    moveKey: string,
    isVipOverride?: boolean,
    now: Date = new Date(),
): { allowed: boolean; state: DeepAnalysisQuotaState } {
    const current = getDeepAnalysisQuotaState(moveKey, isVipOverride, now);
    if (current.isVip || current.isCurrentMoveUnlocked) {
        return { allowed: true, state: { ...current, isCurrentMoveUnlocked: true, isPaywallLocked: false } };
    }
    if (!current.canRunDeepAnalysis) {
        return { allowed: false, state: current };
    }
    const rec = loadDeepAnalysisQuotaRecord(now);
    const nextRecord: DeepAnalysisQuotaRecord = {
        dateKey: rec.dateKey,
        usedCount: rec.usedCount + 1,
        unlockedMoveKeys: moveKey ? [...rec.unlockedMoveKeys, moveKey] : rec.unlockedMoveKeys,
    };
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.setItem(DEEP_ANALYSIS_QUOTA_STORAGE_KEY, JSON.stringify(nextRecord));
        } catch {
            // ignore storage quota errors
        }
    }
    return {
        allowed: true,
        state: getDeepAnalysisQuotaState(moveKey, isVipOverride, now),
    };
}

export interface DeepAnalysisCopyLabels {
    readonly buttonTitle: string;
    readonly freeBadgeAvailable: string;
    readonly unlockedBadge: string;
    readonly lockedBadge: string;
    readonly paywallHeadline: string;
    readonly paywallSubtext: string;
    readonly paywallCta: string;
    readonly tabDiagnostic: string;
    readonly tabCandidates: string;
    readonly tabQuestions: string;
}

export interface ChameleonCardLocaleLabels {
    readonly beginner: string;
    readonly club: string;
    readonly pro: string;
    readonly brilliantBadge: string;
    readonly savedQuizBadge: string;
    readonly formatWinChanceLoss: (pct: number) => string;
}

export function getChameleonCardLocaleLabels(locale: string = 'fr'): ChameleonCardLocaleLabels {
    const lang = locale.slice(0, 2).toLowerCase();
    switch (lang) {
        case 'en':
            return {
                beginner: '🌱 Beginner',
                club: '⚔️ Club',
                pro: '👑 Pro',
                brilliantBadge: 'BRILLIANT FIND',
                savedQuizBadge: 'Saved to Adaptive Quiz',
                formatWinChanceLoss: (pct) => `-${pct}% win chance`,
            };
        case 'es':
            return {
                beginner: '🌱 Principiante',
                club: '⚔️ Club',
                pro: '👑 Pro',
                brilliantBadge: 'HALLAZGO MAESTRO',
                savedQuizBadge: 'Añadido a tu Quiz Adaptativo',
                formatWinChanceLoss: (pct) => `-${pct} % de victoria`,
            };
        case 'pt':
            return {
                beginner: '🌱 Iniciante',
                club: '⚔️ Clube',
                pro: '👑 Pro',
                brilliantBadge: 'JOGADA DE MESTRE',
                savedQuizBadge: 'Salvo no Quiz Adaptativo',
                formatWinChanceLoss: (pct) => `-${pct} % de chance`,
            };
        case 'de':
            return {
                beginner: '🌱 Einsteiger',
                club: '⚔️ Klub',
                pro: '👑 Profi',
                brilliantBadge: 'MEISTERZUG',
                savedQuizBadge: 'Im Adaptiven Quiz gespeichert',
                formatWinChanceLoss: (pct) => `-${pct} % Siegchance`,
            };
        case 'ar':
            return {
                beginner: '🌱 مبتدئ',
                club: '⚔️ نادي',
                pro: '👑 محترف',
                brilliantBadge: 'نقلة عبقرية',
                savedQuizBadge: 'أُضيف إلى اختبارك التكيفي',
                formatWinChanceLoss: (pct) => `-${pct}% فرصة فوز`,
            };
        default:
            return {
                beginner: '🌱 Débutant',
                club: '⚔️ Club',
                pro: '👑 Pro',
                brilliantBadge: 'TROUVAILLE DE MAÎTRE',
                savedQuizBadge: 'Ajouté à votre Quizz Adaptatif',
                formatWinChanceLoss: (pct) => `-${pct} % de chances`,
            };
    }
}

export function getDeepAnalysisCopyLabels(locale: string = 'fr'): DeepAnalysisCopyLabels {
    const lang = locale.slice(0, 2).toLowerCase();
    if (lang === 'en') {
        return {
            buttonTitle: '🧠 Deep Analysis',
            freeBadgeAvailable: '🎁 1/1 free today',
            unlockedBadge: '✨ Deep Analysis Active',
            lockedBadge: '🔒 0/1 today · Club Pass',
            paywallHeadline: 'Daily Free Deep Analysis Used (1/1)',
            paywallSubtext:
                'Unlock unlimited Deep Analysis, 1-click Grandmaster Socratic Q&A, and full Open Sage Max neural telemetry on every turn.',
            paywallCta: '👑 Unlock Unlimited Deep Analysis',
            tabDiagnostic: '🎯 Verdict',
            tabCandidates: '📊 Top 5',
            tabQuestions: '💬 Coach Q&A',
        };
    }
    return {
        buttonTitle: '🧠 Analyse Profonde',
        freeBadgeAvailable: "🎁 1/1 offerte aujourd'hui",
        unlockedBadge: '✨ Analyse Profonde Active',
        lockedBadge: "🔒 0/1 aujourd'hui · Pass Club",
        paywallHeadline: 'Votre Analyse Profonde gratuite du jour a été utilisée (1/1)',
        paywallSubtext:
            "Passez au Pass Club / Grand-Maître pour débloquer l'Analyse Profonde en illimité, les questions interactives en 1 clic et toute la télémétrie Open Sage Max à chaque coup.",
        paywallCta: "👑 Débloquer l'Analyse Profonde Illimitée",
        tabDiagnostic: '🎯 Diagnostic',
        tabCandidates: '📊 Top 5',
        tabQuestions: '💬 Questions Q/R',
    };
}

export function buildDeepSocraticQuestions(params: {
    playedMove?: string | null;
    optimalMove?: string | null;
    equityLoss?: number | null;
    features?: StrategicFeatures;
    symbolicAudit?: SymbolicAudit | null;
    pedagogicalExplanation?: PedagogicalExplanation | null;
    whyFailed?: string | null;
    whyOptimal?: string | null;
    locale?: string;
}): ReadonlyArray<DeepSocraticQuestionItem> {
    const isEn = Boolean(params.locale && params.locale.startsWith('en'));
    const played = params.playedMove || (isEn ? 'your move' : 'votre coup');
    const optimal = params.optimalMove || (isEn ? 'the best move' : 'le meilleur coup');
    const loss = Math.abs(params.equityLoss ?? params.symbolicAudit?.blunder_delta_equity ?? 0);
    const bgsage = params.features?.bgsage;
    const optM = bgsage?.optimalMetrics;
    const pldM = bgsage?.playedMetrics;
    const shotsAfter =
        params.features?.shotExposure?.user.totalRolls ??
        params.symbolicAudit?.direct_shots_conceded ??
        0;
    const shotsBest = params.features?.shotExposure?.best.totalRolls ?? 0;
    const pipsPlayer = params.features?.pipCountDiff.player ?? params.symbolicAudit?.player_pip ?? 150;
    const pipsOpp = params.features?.pipCountDiff.opponent ?? params.symbolicAudit?.opponent_pip ?? 150;
    const theme = bgsage?.playerGamePlan ?? params.symbolicAudit?.dominant_theme ?? 'CONTACT';

    const winDeltaStr =
        optM && pldM
            ? isEn
                ? `Win probability drops from ${(optM.winProb * 100).toFixed(1)}% (Gammon ${(optM.winGammonProb * 100).toFixed(1)}%) down to ${(pldM.winProb * 100).toFixed(1)}% (Opponent Gammon risk ${(pldM.loseGammonProb * 100).toFixed(1)}%).`
                : `Vos chances de gain passent de ${(optM.winProb * 100).toFixed(1)}% (Gammon ${(optM.winGammonProb * 100).toFixed(1)}%) à ${(pldM.winProb * 100).toFixed(1)}% (Risque de gammon adverse ${(pldM.loseGammonProb * 100).toFixed(1)}%).`
            : isEn
              ? `Equity drops by -${loss.toFixed(3)} EMG (~-${Math.min(45, Math.max(1, Math.round(loss * 85)))}% match win chance).`
              : `Vous cédez -${loss.toFixed(3)} EMG (~-${Math.min(45, Math.max(1, Math.round(loss * 85)))}% de chances de victoire).`;

    const userBlotsCount = params.features?.blotsAndShots.user.length ?? 0;
    const bestBlotsCount = params.features?.blotsAndShots.best.length ?? 0;
    const userBlotPts = (params.features?.blotsAndShots.user ?? []).map((b) => b.point).slice(0, 4);
    const userInner = params.features?.boardStructure.innerBoardPoints ?? 2;
    const bestInner = params.features?.bestBoardStructure?.innerBoardPoints ?? userInner;
    const userPrime = params.features?.boardStructure.longestPrime ?? 1;
    const bestPrime = params.features?.bestBoardStructure?.longestPrime ?? userPrime;

    const next36LeadEn =
        shotsAfter !== shotsBest
            ? `After ${played}, the opponent has ${shotsAfter}/36 hitting rolls (vs ${shotsBest}/36 after ${optimal}).`
            : bestInner > userInner
              ? `On the next 36 rolls, ${optimal} locks ${bestInner} inner-board gates (vs ${userInner} after ${played}), punishing any opponent blot and boosting your gammon threat.`
              : bestPrime > userPrime
                ? `On the next 36 rolls, ${optimal} erects a ${bestPrime}-point prime blockade (vs ${userPrime} after ${played}), cutting the opponent's 6s and escape numbers.`
                : userBlotsCount > bestBlotsCount
                  ? `Instead of scattering ${userBlotsCount} loose blots${userBlotPts.length > 0 ? ` (points ${userBlotPts.join(', ')})` : ''} with ${played}, ${optimal} keeps only ${bestBlotsCount} blot(s) and maximizes your point-making numbers out of 36.`
                  : `On the next 36 rolls, ${optimal} coordinates your spare builders to cover key gates, whereas ${played} leaves rigid stacks.`;

    const next36LeadFr =
        shotsAfter !== shotsBest
            ? `Après ${played}, l'adversaire dispose de ${shotsAfter}/36 lancers frappants (contre ${shotsBest}/36 avec ${optimal}).`
            : bestInner > userInner
              ? `Sur les 36 prochains lancers, ${optimal} verrouille ${bestInner} portes intérieures (contre ${userInner} avec ${played}), ce qui prive l'adversaire de cases de réentrée et augmente vos menaces de gammon.`
              : bestPrime > userPrime
                ? `Sur les 36 prochains lancers, ${optimal} érige un barrage de ${bestPrime} portes consécutives (contre ${userPrime} avec ${played}), coupant les dés d'évasion adverses.`
                : userBlotsCount > bestBlotsCount
                  ? `Au lieu de disperser ${userBlotsCount} pions isolés${userBlotPts.length > 0 ? ` (flèches ${userBlotPts.join(', ')})` : ''} avec ${played}, ${optimal} n'en laisse que ${bestBlotsCount} et maximise vos combinaisons de fermeture sur 36.`
                  : `Sur les 36 prochains lancers, ${optimal} coordonne vos bâtisseurs de réserve (spares) pour couvrir de nouvelles portes, là où ${played} fige votre structure.`;

    if (isEn) {
        return [
            {
                id: 'why_equity',
                label: '❓ Why does my move lose equity?',
                answer: `${params.whyFailed || `Playing ${played} weakens your structure.`} ${winDeltaStr} ${params.whyOptimal || `By contrast, ${optimal} locks key points and preserves your equity.`}`,
            },
            {
                id: 'next_36_rolls',
                label: '🎲 What happens on the next 36 dice rolls?',
                answer: `${next36LeadEn} ${params.pedagogicalExplanation?.idea_problem_solution?.canonical_solution || `Playing ${optimal} maximizes your constructive builders on the next roll.`}`,
            },
            {
                id: 'cube_and_plan',
                label: '🧭 What is the Grandmaster Game Plan & Cube strategy?',
                answer: `Plan: ${String(theme).toUpperCase()} (Race ${pipsPlayer} vs ${pipsOpp} pips). ${bgsage?.cubeDecision?.optimalAction ? `Open Sage Cube Verdict: ${bgsage.cubeDecision.optimalAction} (No Double ${bgsage.cubeDecision.noDouble?.toFixed(3) ?? '—'} / Double-Take ${bgsage.cubeDecision.doubleTake?.toFixed(3) ?? '—'}).` : params.pedagogicalExplanation?.michy_proverb || 'Keep your checkers connected (< 6 pips) and avoid impure hybrid plays.'}`,
            },
        ];
    }

    return [
        {
            id: 'why_equity',
            label: "❓ Pourquoi mon coup perd de l'équité ?",
            answer: `${params.whyFailed || `Jouer ${played} fragilise votre structure.`} ${winDeltaStr} ${params.whyOptimal || `À l'inverse, ${optimal} verrouille les cases clés.`}`,
        },
        {
            id: 'next_36_rolls',
            label: '🎲 Que se passe-t-il sur les 36 prochains dés ?',
            answer: `${next36LeadFr} ${params.pedagogicalExplanation?.idea_problem_solution?.canonical_solution || `Jouer ${optimal} maximise vos constructeurs actifs au tour suivant.`}`,
        },
        {
            id: 'cube_and_plan',
            label: '🧭 Quel est le Plan Grand-Maître & Videau ici ?',
            answer: `Plan directeur : ${String(theme).toUpperCase()} (Course ${pipsPlayer} contre ${pipsOpp} pips). ${bgsage?.cubeDecision?.optimalAction ? `Verdict Videau Open Sage : ${bgsage.cubeDecision.optimalAction} (Pas de Double ${bgsage.cubeDecision.noDouble?.toFixed(3) ?? '—'} / Double-Pris ${bgsage.cubeDecision.doubleTake?.toFixed(3) ?? '—'}).` : params.pedagogicalExplanation?.michy_proverb || 'Gardez vos pions connectés (< 6 cases) sans mélanger deux plans contradictoires.'}`,
        },
    ];
}

