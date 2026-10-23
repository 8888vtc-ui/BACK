/**
 * Matrice Terminologique Multilingue Internationale (EN / FR / ES / PT / DE / AR / JA).
 *
 * Alignée sur les standards internationaux d'eXtreme Gammon (XG), Snowie 4 et Backgammon Galaxy.
 * Permet de traduire de façon cohérente les termes techniques du Backgammon,
 * les verdicts du moteur, les concepts stratégiques et les indicateurs de Performance Rating.
 */

export type InternationalLocale = 'en' | 'fr' | 'es' | 'pt' | 'de' | 'ar' | 'ja';

export const SUPPORTED_INTERNATIONAL_LOCALES: readonly InternationalLocale[] = [
    'en',
    'fr',
    'es',
    'pt',
    'de',
    'ar',
    'ja',
] as const;

export interface BackgammonTerminologyEntry {
    en: string;
    fr: string;
    es: string;
    pt: string;
    de: string;
    ar: string;
    ja: string;
}

export type BackgammonTermKey =
    | 'doublingCube'
    | 'blot'
    | 'point'
    | 'bar'
    | 'bearOff'
    | 'pipCount'
    | 'prime'
    | 'goldenPoint'
    | 'barPoint'
    | 'advancedAnchor'
    | 'crawfordRule'
    | 'doubleMatchPoint'
    | 'takePoint'
    | 'gammonPrice'
    | 'matchWinningChance'
    | 'performanceRating'
    | 'snowieErrorRate'
    | 'luckAdjustedPR'
    | 'blunder'
    | 'howler'
    | 'doubtful'
    | 'optimal'
    | 'blunderTraining'
    | 'bronsteinDelay'
    | 'fischerIncrement';

export const BACKGAMMON_TERMINOLOGY_MATRIX: Record<BackgammonTermKey, BackgammonTerminologyEntry> = {
    doublingCube: {
        en: 'Doubling Cube',
        fr: 'Videau',
        es: 'Cubo de doblaje',
        pt: 'Dado de dobra (Cubo)',
        de: 'Dopplungswürfel',
        ar: 'مكعب المضاعفة (Doubling Cube)',
        ja: 'ダブリングキューブ',
    },
    blot: {
        en: 'Blot (exposed checker)',
        fr: 'Blot (pion isolé)',
        es: 'Blot (ficha descubierta)',
        pt: 'Blot (pedra exposta)',
        de: 'Blot (einzelner Stein)',
        ar: 'حجر مكشوف (Blot)',
        ja: 'ブロット（単独チェッカー）',
    },
    point: {
        en: 'Point',
        fr: 'Flèche / Porte',
        es: 'Punto',
        pt: 'Casa / Porta',
        de: 'Punkt / Zunge',
        ar: 'نقطة / بوابة (Point)',
        ja: 'ポイント',
    },
    bar: {
        en: 'Bar',
        fr: 'Barre',
        es: 'Barra',
        pt: 'Barra',
        de: 'Bar',
        ar: 'البار (Bar)',
        ja: 'バー',
    },
    bearOff: {
        en: 'Bear-off',
        fr: 'Sortie (Bear-off)',
        es: 'Sacada (Bear-off)',
        pt: 'Retirada (Bear-off)',
        de: 'Auswürfeln (Bear-off)',
        ar: 'إخراج الأحجار (Bear-off)',
        ja: 'ベアオフ',
    },
    pipCount: {
        en: 'Pip Count',
        fr: 'Compte de pips (Course)',
        es: 'Conteo de pips',
        pt: 'Contagem de pips (Corrida)',
        de: 'Pip-Count (Rennen)',
        ar: 'حساب النقاط (Pip Count)',
        ja: 'ピップカウント',
    },
    prime: {
        en: 'Prime',
        fr: 'Prime (barrage de portes)',
        es: 'Prime (bloqueo consecutivo)',
        pt: 'Prime (bloqueio de portas)',
        de: 'Prime (Blockade)',
        ar: 'حاجز متصل (Prime)',
        ja: 'プライム',
    },
    goldenPoint: {
        en: 'Golden Point (5-point)',
        fr: 'Golden Point (Porte du 5)',
        es: 'Punto Dorado (Punto 5)',
        pt: 'Ponto de Ouro (Casa 5)',
        de: 'Golden Point (5er-Punkt)',
        ar: 'النقطة الذهبية (النقطة 5)',
        ja: 'ゴールデンポイント（5ポイント）',
    },
    barPoint: {
        en: 'Bar Point (7-point)',
        fr: 'Bar Point (Porte du 7)',
        es: 'Punto de Barra (Punto 7)',
        pt: 'Ponto da Barra (Casa 7)',
        de: 'Bar-Punkt (7er-Punkt)',
        ar: 'نقطة البار (النقطة 7)',
        ja: 'バーポイント（7ポイント）',
    },
    advancedAnchor: {
        en: 'Advanced Anchor',
        fr: 'Ancre avancée',
        es: 'Ancla avanzada',
        pt: 'Âncora avançada',
        de: 'Fortgeschrittener Anker',
        ar: 'مرساة متقدمة (Advanced Anchor)',
        ja: 'アドバンストアンカー',
    },
    crawfordRule: {
        en: 'Crawford Rule',
        fr: 'Règle de Crawford',
        es: 'Regla de Crawford',
        pt: 'Regra de Crawford',
        de: 'Crawford-Regel',
        ar: 'قاعدة كروفورد (Crawford Rule)',
        ja: 'クロフォードルール',
    },
    doubleMatchPoint: {
        en: 'Double Match Point (DMP)',
        fr: 'Double Match Point (DMP)',
        es: 'Doble Punto de Partido (DMP)',
        pt: 'Duplo Match Point (DMP)',
        de: 'Double Match Point (DMP)',
        ar: 'نقطة المباراة المزدوجة (DMP)',
        ja: 'ダブルマッチポイント (DMP)',
    },
    takePoint: {
        en: 'Take Point',
        fr: 'Seuil de prise (Take Point)',
        es: 'Punto de aceptación (Take Point)',
        pt: 'Ponto de aceitação (Take Point)',
        de: 'Annahmepunkt (Take Point)',
        ar: 'نقطة القبول (Take Point)',
        ja: 'テイクポイント',
    },
    gammonPrice: {
        en: 'Gammon Price',
        fr: 'Prix du gammon',
        es: 'Precio del gammon',
        pt: 'Preço do gammon',
        de: 'Gammon-Preis',
        ar: 'سعر الغامون (Gammon Price)',
        ja: 'ギャモン価格',
    },
    matchWinningChance: {
        en: 'Match Winning Chance (MWC %)',
        fr: 'Probabilité de gain du match (MWC %)',
        es: 'Probabilidad de ganar el partido (MWC %)',
        pt: 'Probabilidade de vitória na partida (MWC %)',
        de: 'Match-Gewinnwahrscheinlichkeit (MWC %)',
        ar: 'احتمالية الفوز بالمباراة (MWC %)',
        ja: 'マッチ勝率 (MWC %)',
    },
    performanceRating: {
        en: 'Performance Rating (PR)',
        fr: 'Performance Rating (PR)',
        es: 'Índice de Rendimiento (PR)',
        pt: 'Índice de Desempenho (PR)',
        de: 'Performance Rating (PR)',
        ar: 'تقييم الأداء (PR)',
        ja: 'パフォーマンスレーティング (PR)',
    },
    snowieErrorRate: {
        en: 'Snowie Error Rate (ER)',
        fr: 'Taux d’erreur Snowie (ER)',
        es: 'Tasa de error Snowie (ER)',
        pt: 'Taxa de erro Snowie (ER)',
        de: 'Snowie-Fehlerrate (ER)',
        ar: 'معدل خطأ سنوي (ER)',
        ja: 'Snowieエラーレート (ER)',
    },
    luckAdjustedPR: {
        en: 'Luck-Adjusted PR',
        fr: 'PR Ajusté à la Chance',
        es: 'PR Ajustado por Suerte',
        pt: 'PR Ajustado à Sorte',
        de: 'Glücksbereinigtes PR',
        ar: 'تقييم الأداء المعدل بالحظ',
        ja: 'ラック調整済みPR',
    },
    blunder: {
        en: 'Blunder',
        fr: 'Blunder (Erreur franche)',
        es: 'Error grave (Blunder)',
        pt: 'Erro grave (Blunder)',
        de: 'Grobe Fehlentscheidung (Blunder)',
        ar: 'خطأ فادح (Blunder)',
        ja: 'ブランダー（大悪手）',
    },
    howler: {
        en: 'Howler (Major Blunder)',
        fr: 'Gaffe majeure (Howler)',
        es: 'Error garrafal (Howler)',
        pt: 'Erro crasso (Howler)',
        de: 'Schwerer Patzer (Howler)',
        ar: 'خطأ كارثي (Howler)',
        ja: 'ハウラー（致命的悪手）',
    },
    doubtful: {
        en: 'Doubtful Move',
        fr: 'Coup douteux',
        es: 'Jugada dudosa',
        pt: 'Lance duvidoso',
        de: 'Zweifelhafter Zug',
        ar: 'نقلة مشكوك فيها (Doubtful)',
        ja: '疑問手（ダウトフル）',
    },
    optimal: {
        en: 'Optimal Move',
        fr: 'Coup optimal',
        es: 'Jugada óptima',
        pt: 'Lance ótimo',
        de: 'Optimaler Zug',
        ar: 'النقلة المثلى (Optimal)',
        ja: '最善手',
    },
    blunderTraining: {
        en: 'Blunder Training (Replay & Drill)',
        fr: 'Blunder Training (Rejeu des erreurs)',
        es: 'Entrenamiento de Errores (Drill)',
        pt: 'Treino de Erros (Replay & Drill)',
        de: 'Fehler-Training (Replay & Drill)',
        ar: 'تدريب تصحيح الأخطاء (Drill)',
        ja: 'ブランダートレーニング（復習ドリル）',
    },
    bronsteinDelay: {
        en: 'Bronstein / WBF Delay',
        fr: 'Délai Bronstein / WBF',
        es: 'Retardo Bronstein / WBF',
        pt: 'Atraso Bronstein / WBF',
        de: 'Bronstein- / WBF-Verzögerung',
        ar: 'تأخير برونشتاين (Bronstein Delay)',
        ja: 'ブロンシュタイン・ディレイ',
    },
    fischerIncrement: {
        en: 'Fischer Increment',
        fr: 'Incrément Fischer',
        es: 'Incremento Fischer',
        pt: 'Incremento Fischer',
        de: 'Fischer-Inkrement',
        ar: 'زيادة فيشر الزمنية (Fischer)',
        ja: 'フィッシャー・インクリメント',
    },
};

/**
 * Récupère la ligne terminologique complète d'un terme technique.
 */
export function getTerminologyRow(key: BackgammonTermKey): BackgammonTerminologyEntry | undefined {
    return BACKGAMMON_TERMINOLOGY_MATRIX[key];
}

/**
 * Récupère le terme localisé dans la langue souhaitée (avec repli sur l'anglais international).
 */
export function getInternationalTerm(
    key: BackgammonTermKey,
    locale: InternationalLocale = 'en',
): string {
    const entry = BACKGAMMON_TERMINOLOGY_MATRIX[key];
    if (!entry) return key;
    return entry[locale] || entry.en;
}
