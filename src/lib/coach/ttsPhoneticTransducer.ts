/**
 * @file src/lib/coach/ttsPhoneticTransducer.ts
 * @description Glossaire Officiel WBGF en 7 Langues (EN, FR, ES, PT, DE, AR, JA)
 * et Transducteur Phonétique Déterministe AST-to-SSML pour la Synthèse Vocale Adaptative (TTS).
 *
 * Règles (Rapport #13 Axe 5) :
 * - Ne jamais envoyer une notation algébrique brute (`24/18 13/8*`, `8/5(2)`, `ΔEq -0.120`, `3-ply`)
 *   au moteur TTS.
 * - Convertir `*` en « en frappant » / « hitting » suivi de `<break time="150ms"/>`.
 * - Convertir `(2)` sur la flèche 5 en « deux pions ... pour fermer le point d'or ».
 * - Exprimer les pertes d'équité en millièmes en français (`cent vingt millièmes`)
 *   et avec `<emphasis level="moderate">`.
 * - Strictement 0 `any`, 100 % pur et déterministe.
 */

export type SupportedCoachLanguage = 'en' | 'fr' | 'es' | 'pt' | 'de' | 'ar' | 'ja';

export type CanonicalGlossaryTermId =
    | 'DOUBLING_CUBE'
    | 'GOLDEN_POINT'
    | 'BAR_POINT'
    | 'PRIME'
    | 'BLOT'
    | 'PIP_COUNT'
    | 'RACE'
    | 'BEAR_OFF'
    | 'GAMMON_BACKGAMMON'
    | 'ANCHOR'
    | 'BEAVER'
    | 'RACCOON'
    | 'CRAWFORD_RULE'
    | 'DMP'
    | 'TAKE_POINT'
    | 'DROP_POINT'
    | 'MARKET_LOSS'
    | 'FREE_DROP';

export type MultilingualGlossaryRow = Readonly<Record<SupportedCoachLanguage, string>>;

/**
 * Cartographie comparative officielle WBGF / USBGF / UKBGF dans les 7 langues cibles.
 */
export const WBGF_MULTILINGUAL_GLOSSARY: Readonly<Record<CanonicalGlossaryTermId, MultilingualGlossaryRow>> = {
    DOUBLING_CUBE: {
        en: 'Doubling cube',
        fr: 'Videau / Cube de doublement',
        es: 'Dado de doblaje / Cubo de doblaje',
        pt: 'Cubo de duplicação / Dado de dobra',
        de: 'Verdopplungswürfel / Dopplerwürfel',
        ar: 'مكعب المضاعفة (Mukaʻab al-Mudāʻafa)',
        ja: 'ダブリングキューブ / キューブ (Daburingu Kyūbu)',
    },
    GOLDEN_POINT: {
        en: 'Golden Point (5-pt)',
        fr: "Point d'or (Point 5)",
        es: 'Punto de oro (Punto 5)',
        pt: 'Ponto de ouro (Casa 5)',
        de: 'Goldener Punkt (5er-Punkt)',
        ar: 'النقطة الذهبية (An-Nuqta adh-Dhahabiyya)',
        ja: 'ゴールデンポイント (Gōruden Pointo)',
    },
    BAR_POINT: {
        en: 'Bar Point (7-pt)',
        fr: 'Point de barre (Point 7)',
        es: 'Punto de barra (Punto 7)',
        pt: 'Ponto de barra (Casa 7)',
        de: 'Bar-Punkt (7er-Punkt)',
        ar: 'نقطة الحاجز / نقطة البار (Nuqtat al-Bār)',
        ja: 'バーポイント (Bā Pointo)',
    },
    PRIME: {
        en: 'Prime (Blocking wall)',
        fr: 'Prime / Mur de blocage',
        es: 'Prima / Bloqueo (Muro)',
        pt: 'Prime / Bloqueio (Paredão)',
        de: 'Prime / Blockade (Sechserblock)',
        ar: 'حائط الصد / برايم (Hāʼit as-Sadd)',
        ja: 'プライム (Puraimu)',
    },
    BLOT: {
        en: 'Blot (Single checker)',
        fr: 'Blot / Pion isolé',
        es: 'Blot / Ficha descubierta',
        pt: 'Blot / Pedra solta',
        de: 'Blot / Einzelstein',
        ar: 'حجر مكشوف / بلوت (Hajar Makshūf)',
        ja: 'ブロット (Burotto)',
    },
    PIP_COUNT: {
        en: 'Pip count',
        fr: 'Compte de pips / Compte à la course',
        es: 'Conteo de pips',
        pt: 'Contagem de pips',
        de: 'Pip-Count / Augenanzahl',
        ar: 'تعداد النقاط / حساب البيب (Taʻdād an-Niqāt)',
        ja: 'ピップカウント (Pippu Kaunto)',
    },
    RACE: {
        en: 'Race (No contact)',
        fr: 'Course pure sans contact',
        es: 'Carrera pura',
        pt: 'Corrida',
        de: 'Rennen (Laufspiel)',
        ar: 'سباق (Sibāq)',
        ja: 'レース (Rēsu)',
    },
    BEAR_OFF: {
        en: 'Bear-off',
        fr: 'Sortie des pions / Bear-off',
        es: 'Sacar fichas / Bear-off',
        pt: 'Retirar as pedras / Bear-off',
        de: 'Auswürfeln / Abtragen (Bear-off)',
        ar: 'إخراج الأحجار (Ikhrāj al-Ahjār)',
        ja: 'ベアオフ (Bea Ofu)',
    },
    GAMMON_BACKGAMMON: {
        en: 'Gammon / Backgammon',
        fr: 'Gammon (Double) / Backgammon (Triple)',
        es: 'Gammon / Backgammon',
        pt: 'Gamão (Jogo duplo) / Backgammon (Triplo)',
        de: 'Gammon / Backgammon',
        ar: 'غامون (مارس) / باك غامون (Ghāmūn / Bāk Ghāmūn)',
        ja: 'ギャモン / バックギャモン (Gyamon / Bakkugyamon)',
    },
    ANCHOR: {
        en: 'Anchor',
        fr: 'Ancre (Ancre avancée / haute)',
        es: 'Ancla (Ancla avanzada)',
        pt: 'Âncora',
        de: 'Anker (Vorgeschobener Anker)',
        ar: 'مرساة / أنكر (Mirsāt / Ankar)',
        ja: 'アンカー (Ankā)',
    },
    BEAVER: {
        en: 'Beaver',
        fr: 'Beaver (Contre-double immédiat conservé)',
        es: 'Beaver (Redoble inmediato retenido)',
        pt: 'Beaver (Redobra imediata mantendo o cubo)',
        de: 'Beaver (Sofortiges Gegenverdoppeln)',
        ar: 'بيفر (Bīfar)',
        ja: 'ビーバー (Bībā)',
    },
    RACCOON: {
        en: 'Raccoon',
        fr: 'Raccoon (Sur-contre immédiat après un Beaver)',
        es: 'Raccoon (Re-redoble inmediato tras Beaver)',
        pt: 'Raccoon (Tréplica imediata ao Beaver)',
        de: 'Raccoon (Erneutes Verdoppeln nach Beaver)',
        ar: 'راكون (Rākūn)',
        ja: 'ラクーン (Rakūn)',
    },
    CRAWFORD_RULE: {
        en: 'Crawford rule',
        fr: 'Règle de Crawford (Partie Crawford)',
        es: 'Regla de Crawford',
        pt: 'Regra de Crawford',
        de: 'Crawford-Regel',
        ar: 'قاعدة كروفورد (Qāʻidat Krūfūrd)',
        ja: 'クロフォードルール (Kurofōdo Rūru)',
    },
    DMP: {
        en: 'DMP (Double Match Point)',
        fr: 'DMP / Double point de match (1-away 1-away)',
        es: 'DMP / Doble punto de partido',
        pt: 'DMP / Duplo ponto de partida',
        de: 'DMP / Doppelter Matchpunkt',
        ar: 'نقطة المباراة المزدوجة (DMP)',
        ja: 'ダブルマッチポイント / DMP',
    },
    TAKE_POINT: {
        en: 'Take Point',
        fr: "Point d'acceptation / Take Point",
        es: 'Punto de aceptación / Take Point',
        pt: 'Ponto de aceitação / Take Point',
        de: 'Take-Punkt / Annahmeschwelle',
        ar: 'نقطة القبول (Nuqtat al-Qabūl)',
        ja: 'テイクポイント (Teiku Pointo)',
    },
    DROP_POINT: {
        en: 'Drop Point (Pass)',
        fr: 'Point de refus / Pass (Drop)',
        es: 'Punto de abandono / Pass (Drop)',
        pt: 'Ponto de recusa / Pass (Drop)',
        de: 'Pass-Punkt / Ablehnungspunkt (Drop)',
        ar: 'نقطة الانسحاب / باس (Nuqtat al-Insihāb)',
        ja: 'ドロップポイント / パス (Doroppu Pointo)',
    },
    MARKET_LOSS: {
        en: 'Market loss',
        fr: 'Perte de marché (Perdre son marché)',
        es: 'Pérdida de mercado',
        pt: 'Perda de mercado',
        de: 'Marktverlust',
        ar: 'فقدان السوق (Fiqdān as-Sūq)',
        ja: 'マーケットロス (Māketto Rosu)',
    },
    FREE_DROP: {
        en: 'Free drop',
        fr: 'Free drop / Refus gratuit (Post-Crawford pair)',
        es: 'Free drop / Abandono gratuito',
        pt: 'Free drop / Recusa gratuita',
        de: 'Free Drop / Kostenloses Passen',
        ar: 'انسحاب مجاني (Insihāb Majjānī)',
        ja: 'フリードロップ (Furī Doroppu)',
    },
};

export function getGlossaryTerm(termId: CanonicalGlossaryTermId, lang: SupportedCoachLanguage = 'fr'): string {
    return WBGF_MULTILINGUAL_GLOSSARY[termId][lang];
}

const FR_POINTS: Readonly<Record<string, string>> = {
    bar: 'la barre',
    off: 'la sortie',
    '1': 'un',
    '2': 'deux',
    '3': 'trois',
    '4': 'quatre',
    '5': 'cinq',
    '6': 'six',
    '7': 'sept',
    '8': 'huit',
    '9': 'neuf',
    '10': 'dix',
    '11': 'onze',
    '12': 'douze',
    '13': 'treize',
    '14': 'quatorze',
    '15': 'quinze',
    '16': 'seize',
    '17': 'dix-sept',
    '18': 'dix-huit',
    '19': 'dix-neuf',
    '20': 'vingt',
    '21': 'vingt-et-un',
    '22': 'vingt-deux',
    '23': 'vingt-trois',
    '24': 'vingt-quatre',
};

const EN_POINTS: Readonly<Record<string, string>> = {
    bar: 'the bar',
    off: 'off',
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'nine',
    '10': 'ten',
    '11': 'eleven',
    '12': 'twelve',
    '13': 'thirteen',
    '14': 'fourteen',
    '15': 'fifteen',
    '16': 'sixteen',
    '17': 'seventeen',
    '18': 'eighteen',
    '19': 'nineteen',
    '20': 'twenty',
    '21': 'twenty-one',
    '22': 'twenty-two',
    '23': 'twenty-three',
    '24': 'twenty-four',
};

function verbalizePoint(token: string, lang: 'fr' | 'en'): string {
    const key = token.trim().toLowerCase();
    return (lang === 'fr' ? FR_POINTS[key] : EN_POINTS[key]) ?? key;
}

/**
 * Transduit un sous-mouvement algébrique (`24/18`, `13/8*`, `8/5(2)`) en locution parlée naturelle.
 */
export function transduceSingleStepToSpeech(stepRaw: string, lang: 'fr' | 'en' = 'fr'): string {
    const trimmed = stepRaw.trim();
    const match = trimmed.match(/^(bar|\d+)\/(off|\d+)(\*)?(?:\((\d+)\))?$/i);
    if (!match) return trimmed;

    const fromToken = match[1] ?? '';
    const toToken = match[2] ?? '';
    const isHit = match[3] === '*';
    const multiplier = match[4] ? Number(match[4]) : 1;

    const fromWord = verbalizePoint(fromToken, lang);
    const toWord = verbalizePoint(toToken, lang);

    if (lang === 'fr') {
        const countPrefix = multiplier === 2 ? 'deux pions ' : multiplier > 2 ? `${multiplier} pions ` : '';
        const goldenSuffix =
            multiplier >= 2 && toToken === '5'
                ? " pour fermer le point d'or"
                : multiplier >= 2 && toToken === '7'
                  ? ' pour fermer le point de barre'
                  : '';
        const hitSuffix = isHit ? ' en frappant' : '';
        const prep = fromToken.toLowerCase() === 'bar' ? 'de la barre' : `du ${fromWord}`;
        const dest = toToken.toLowerCase() === 'off' ? 'vers la sortie' : `au ${toWord}`;
        return `${countPrefix}${prep} ${dest}${goldenSuffix}${hitSuffix}`;
    }

    const countPrefix = multiplier === 2 ? 'two checkers from the ' : multiplier > 2 ? `${multiplier} checkers from the ` : '';
    const goldenSuffix =
        multiplier >= 2 && toToken === '5'
            ? ' to make the golden point'
            : multiplier >= 2 && toToken === '7'
              ? ' to make the bar point'
              : '';
    const hitSuffix = isHit ? ' hitting' : '';
    return `${countPrefix}${fromWord} to ${multiplier >= 2 ? `the ${toWord}` : toWord}${goldenSuffix}${hitSuffix}`;
}

/**
 * Transduit une notation complète de coup + perte d'équité optionnelle en script SSML `<speak>...</speak>`.
 */
export function transduceMoveNotationToSsml(params: {
    readonly moveNotation: string;
    readonly deltaEquityNemg?: number;
    readonly directShotsOutOf36?: number;
    readonly lang?: 'fr' | 'en';
}): string {
    const lang = params.lang ?? 'fr';
    const steps = params.moveNotation
        .trim()
        .split(/\s+/)
        .filter((s) => s.length > 0);

    const spokenSteps = steps.map((step, idx) => {
        const phrase = transduceSingleStepToSpeech(step, lang);
        if (idx === 0) {
            return lang === 'fr' ? `Jouer ${phrase}` : `Playing ${phrase}`;
        }
        return lang === 'fr' ? `puis ${phrase}` : phrase;
    });

    const joinedMoves = spokenSteps.join(', <break time="150ms"/> ');

    let metricClause = '';
    if (typeof params.deltaEquityNemg === 'number' && Math.abs(params.deltaEquityNemg) > 0.0005) {
        const milli = Math.round(Math.abs(params.deltaEquityNemg) * 1000);
        if (lang === 'fr') {
            metricClause = `, <break time="200ms"/> entraîne une perte d'équité de <emphasis level="moderate">${milli} millièmes</emphasis>.`;
        } else {
            const digits = Math.abs(params.deltaEquityNemg).toFixed(3).slice(2).split('').join(' ');
            metricClause = `, <break time="200ms"/> results in an equity loss of <emphasis level="moderate">point ${digits}</emphasis>.`;
        }
    } else {
        metricClause = '.';
    }

    let shotsClause = '';
    if (typeof params.directShotsOutOf36 === 'number') {
        const shots = Math.max(0, Math.round(params.directShotsOutOf36));
        shotsClause =
            lang === 'fr'
                ? ` <break time="250ms"/> L'analyse à trois niveaux confirme que l'adversaire a ${shots} tirs directs sur trente-six.`
                : ` <break time="250ms"/> Three-ply evaluation confirms the opponent has ${shots} direct shots out of thirty-six.`;
    }

    return `<speak>${joinedMoves}${metricClause}${shotsClause}</speak>`;
}

