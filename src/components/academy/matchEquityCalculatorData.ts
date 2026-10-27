import type { PrimaryLocale } from '../../lib/i18n/types';

export interface CalcLabels {
    readonly badge: string;
    readonly title: string;
    readonly subtitle: string;
    readonly matchLengthLabel: string;
    readonly moneyGameLabel: string;
    readonly pointsToWinX: string;
    readonly pointsToWinO: string;
    readonly crawfordToggle: string;
    readonly mwcLabel: string;
    readonly takePointDeadLabel: string;
    readonly takePointLiveLabel: string;
    readonly gammonPriceLabel: string;
    readonly keithTitle: string;
    readonly pipsXLabel: string;
    readonly pipsOLabel: string;
    readonly penaltyXLabel: string;
    readonly penaltyOLabel: string;
    readonly keithVerdictLabel: string;
    readonly copyXgidBtn: string;
    readonly copiedXgidMsg: string;
}

export const CALC_LABELS: Record<PrimaryLocale, CalcLabels> = {
    fr: {
        badge: 'OUTIL INTERACTIF GRATUIT · KAZAROSS-XG2 & KEITH COUNT',
        title: 'Calculateur d’Équité de Match (MET), Take Point & Course de Keith',
        subtitle: 'Simulez n’importe quel score de tournoi (ou Money Game) pour obtenir instantanément votre probabilité de gain (MWC %), votre seuil de prise exact (Take Point), le prix du Gammon et la décision de videau en course.',
        matchLengthLabel: 'Format du Match',
        moneyGameLabel: 'Money Game (Illimité)',
        pointsToWinX: 'Votre Score (Points acquis)',
        pointsToWinO: 'Score Adversaire',
        crawfordToggle: 'Manche de Crawford active',
        mwcLabel: 'Probabilité de Gain Match (MWC)',
        takePointDeadLabel: 'Take Point (Cube Mort)',
        takePointLiveLabel: 'Take Point Réel (Cube Vivant)',
        gammonPriceLabel: 'Prix du Gammon (Gammon Price)',
        keithTitle: 'Calculateur Rapide de Course (Algorithme de Keith)',
        pipsXLabel: 'Votre Pip Count',
        pipsOLabel: 'Pip Count Adverse',
        penaltyXLabel: 'Vos Pénalités Keith',
        penaltyOLabel: 'Pénalités Adverses',
        keithVerdictLabel: 'Décision Videau Recommandée (3-Ply / Keith)',
        copyXgidBtn: '🔗 Copier un Permalien d’Analyse XGID',
        copiedXgidMsg: '✓ Permalien XGID copié dans le presse-papiers !',
    },
    en: {
        badge: 'FREE INTERACTIVE TOOL · KAZAROSS-XG2 & KEITH COUNT',
        title: 'Match Equity (MET), Take Point & Keith Count Race Calculator',
        subtitle: 'Simulate any tournament match score (or Money Game) to instantly compute your Match Winning Chance (MWC %), exact Take Point, Gammon Price, and pure-race cube action.',
        matchLengthLabel: 'Match Format',
        moneyGameLabel: 'Money Play (Unlimited)',
        pointsToWinX: 'Your Score (Points won)',
        pointsToWinO: 'Opponent Score',
        crawfordToggle: 'Crawford Game Active',
        mwcLabel: 'Match Winning Chance (MWC)',
        takePointDeadLabel: 'Dead Cube Take Point',
        takePointLiveLabel: 'Live Cube Take Point (~Est.)',
        gammonPriceLabel: 'Gammon Price',
        keithTitle: 'Pure Race Cube Calculator (Keith Count Algorithm)',
        pipsXLabel: 'Your Pip Count',
        pipsOLabel: 'Opponent Pip Count',
        penaltyXLabel: 'Your Keith Penalties',
        penaltyOLabel: 'Opponent Penalties',
        keithVerdictLabel: 'Recommended Cube Action (3-Ply / Keith)',
        copyXgidBtn: '🔗 Copy Shareable XGID Analysis Link',
        copiedXgidMsg: '✓ Shareable XGID link copied to clipboard!',
    },
    es: {
        badge: 'HERRAMIENTA INTERACTIVA · KAZAROSS-XG2 & KEITH COUNT',
        title: 'Calculadora de Equidad de Partido (MET), Take Point y Conteo Keith',
        subtitle: 'Simula cualquier marcador de torneo para obtener al instante tu probabilidad de ganar el partido (MWC %), el Take Point exacto, el precio del Gammon y la decisión de cubo en carrera.',
        matchLengthLabel: 'Formato del Partido',
        moneyGameLabel: 'Money Game (Libre)',
        pointsToWinX: 'Tu Puntuación',
        pointsToWinO: 'Puntuación Rival',
        crawfordToggle: 'Juego Crawford activo',
        mwcLabel: 'Probabilidad de Ganar (MWC)',
        takePointDeadLabel: 'Take Point (Cubo Muerto)',
        takePointLiveLabel: 'Take Point Real (Cubo Vivo)',
        gammonPriceLabel: 'Precio del Gammon',
        keithTitle: 'Calculadora de Carrera Pura (Algoritmo de Keith)',
        pipsXLabel: 'Tus Pips',
        pipsOLabel: 'Pips del Rival',
        penaltyXLabel: 'Tus Penalizaciones Keith',
        penaltyOLabel: 'Penalizaciones Rival',
        keithVerdictLabel: 'Decisión de Cubo Recomendada (Keith)',
        copyXgidBtn: '🔗 Copiar Enlace de Posición XGID',
        copiedXgidMsg: '✓ ¡Enlace XGID copiado!',
    },
    pt: {
        badge: 'FERRAMENTA INTERATIVA · KAZAROSS-XG2 & KEITH COUNT',
        title: 'Calculadora de Equidade de Partida (MET), Take Point e Contagem Keith',
        subtitle: 'Simule qualquer placar de torneio para calcular instantaneamente sua chance de vitória (MWC %), Take Point exato, preço do Gammon e decisão do cubo na corrida.',
        matchLengthLabel: 'Formato da Partida',
        moneyGameLabel: 'Money Game (Livre)',
        pointsToWinX: 'Sua Pontuação',
        pointsToWinO: 'Pontuação Adversário',
        crawfordToggle: 'Partida Crawford ativa',
        mwcLabel: 'Chance de Vitória na Partida (MWC)',
        takePointDeadLabel: 'Take Point (Cubo Morto)',
        takePointLiveLabel: 'Take Point Real (Cubo Vivo)',
        gammonPriceLabel: 'Preço do Gammon',
        keithTitle: 'Calculadora de Corrida Pura (Algoritmo de Keith)',
        pipsXLabel: 'Seus Pips',
        pipsOLabel: 'Pips do Adversário',
        penaltyXLabel: 'Suas Penalidades Keith',
        penaltyOLabel: 'Penalidades Adversário',
        keithVerdictLabel: 'Decisão do Cubo Recomendada (Keith)',
        copyXgidBtn: '🔗 Copiar Link Compartilhável XGID',
        copiedXgidMsg: '✓ Link XGID copiado!',
    },
    de: {
        badge: 'INTERAKTIVES TOOL · KAZAROSS-XG2 & KEITH COUNT',
        title: 'Match-Equity-Rechner (MET), Take Point & Keith-Count-Rennrechner',
        subtitle: 'Simulieren Sie jeden Turnierspielstand für exakte Match-Gewinnwahrscheinlichkeit (MWC %), Take Point, Gammon-Preis und Dopplungswürfel-Entscheidung im Rennen.',
        matchLengthLabel: 'Match-Format',
        moneyGameLabel: 'Money Game (Unbegrenzt)',
        pointsToWinX: 'Ihr Punktestand',
        pointsToWinO: 'Gegner-Punktestand',
        crawfordToggle: 'Crawford-Spiel aktiv',
        mwcLabel: 'Match-Gewinnchance (MWC)',
        takePointDeadLabel: 'Dead Cube Take Point',
        takePointLiveLabel: 'Live Cube Take Point',
        gammonPriceLabel: 'Gammon-Preis',
        keithTitle: 'Renn-Würfelrechner (Keith-Count-Algorithmus)',
        pipsXLabel: 'Ihr Pip-Count',
        pipsOLabel: 'Gegner Pip-Count',
        penaltyXLabel: 'Ihre Keith-Strafen',
        penaltyOLabel: 'Gegner-Strafen',
        keithVerdictLabel: 'Empfohlene Würfel-Entscheidung (Keith)',
        copyXgidBtn: '🔗 Teilbaren XGID-Analyse-Link kopieren',
        copiedXgidMsg: '✓ XGID-Link kopiert!',
    },
    ar: {
        badge: 'أداة تفاعلية مجانية · KAZAROSS-XG2 و KEITH COUNT',
        title: 'حاسبة احتمالية الفوز بالمباراة (MET) ونقطة القبول وحساب كيث للسباق',
        subtitle: 'قم بمحاكاة أي نتيجة في البطولة لمعرفة نسبة الفوز بالمباراة (MWC %)، ونقطة قبول المضاعفة (Take Point)، وسعر الغامون، وقرار المكعب في السباق الخالص.',
        matchLengthLabel: 'نظام المباراة',
        moneyGameLabel: 'لعب حر (Money Game)',
        pointsToWinX: 'نقاطك الحالية',
        pointsToWinO: 'نقاط الخصم',
        crawfordToggle: 'جولة كروفورد نشطة',
        mwcLabel: 'احتمالية الفوز بالمباراة (MWC)',
        takePointDeadLabel: 'نقطة القبول (مكعب ميت)',
        takePointLiveLabel: 'نقطة القبول الفعلية (مكعب حي)',
        gammonPriceLabel: 'سعر الغامون (Gammon Price)',
        keithTitle: 'حاسبة السباق الخالص (خوارزمية كيث Keith Count)',
        pipsXLabel: 'نقاطك (Pip Count)',
        pipsOLabel: 'نقاط الخصم (Pip Count)',
        penaltyXLabel: 'عقوبات كيث الخاصة بك',
        penaltyOLabel: 'عقوبات الخصم',
        keithVerdictLabel: 'قرار المكعب الموصى به (Keith)',
        copyXgidBtn: '🔗 نسخ رابط تحليل الوضعية (XGID)',
        copiedXgidMsg: '✓ تم نسخ رابط الوضعية XGID بنجاح!',
    },
};

export interface KeithDecision {
    readonly keithX: number;
    readonly keithO: number;
    readonly thresholdTake: number;
    readonly actionCode: 'NO_DOUBLE' | 'DOUBLE_TAKE' | 'REDOUBLE_TAKE' | 'DOUBLE_PASS';
}

export function evaluateKeithRaceDecision(
    pipsX: number,
    pipsO: number,
    penX: number,
    penO: number,
): KeithDecision {
    const keithX = Math.max(1, pipsX + penX);
    const keithO = Math.max(1, pipsO + penO);
    const thresholdTake = Math.floor((keithX * 8) / 7) - 3;
    const diff = thresholdTake - keithO;

    let actionCode: KeithDecision['actionCode'] = 'NO_DOUBLE';
    if (diff > 4) {
        actionCode = 'NO_DOUBLE';
    } else if (diff === 4) {
        actionCode = 'DOUBLE_TAKE';
    } else if (diff >= 0 && diff <= 3) {
        actionCode = 'REDOUBLE_TAKE';
    } else {
        actionCode = 'DOUBLE_PASS';
    }

    return { keithX, keithO, thresholdTake, actionCode };
}
