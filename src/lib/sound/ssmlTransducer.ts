/**
 * @file src/lib/sound/ssmlTransducer.ts
 * @description Transducteur phonétique & SSML (W3C Speech Synthesis Markup Language)
 * pour le Coach IA Backgammon.
 * Transforme la notation algébrique compacte (ex: `13/8 6/5*`, `bar/20*`, `6/off(2)`, `ΔEq`, `EPC`)
 * en texte parlé naturel et en enveloppe SSML structurée (`<speak>`, `<prosody>`, `<break>`, `<emphasis>`).
 */

export interface PhoneticLocaleLexicon {
    xmlLang: string;
    toWord: string;
    barWord: string;
    offWord: string;
    hitSuffix: string;
    deltaWord: string;
    epcWord: string;
    timesFormat: (count: string) => string;
}

const LEXICON_BY_LANG: Record<string, PhoneticLocaleLexicon> = {
    fr: {
        xmlLang: 'fr-FR',
        toWord: 'vers',
        barWord: 'barre',
        offWord: 'sortie',
        hitSuffix: 'avec frappe',
        deltaWord: 'delta équité',
        epcWord: 'compte de pips effectifs',
        timesFormat: (count) => `${count} fois`,
    },
    en: {
        xmlLang: 'en-US',
        toWord: 'to',
        barWord: 'bar',
        offWord: 'off',
        hitSuffix: 'hitting',
        deltaWord: 'delta equity',
        epcWord: 'effective pip count',
        timesFormat: (count) => `${count} times`,
    },
    es: {
        xmlLang: 'es-ES',
        toWord: 'a',
        barWord: 'barra',
        offWord: 'salida',
        hitSuffix: 'golpeando',
        deltaWord: 'delta de equidad',
        epcWord: 'conteo efectivo de pips',
        timesFormat: (count) => `${count} veces`,
    },
    de: {
        xmlLang: 'de-DE',
        toWord: 'nach',
        barWord: 'Bar',
        offWord: 'Hinaus',
        hitSuffix: 'mit Schlag',
        deltaWord: 'Delta Equity',
        epcWord: 'effektiver Pip-Zähler',
        timesFormat: (count) => `${count} Mal`,
    },
    ja: {
        xmlLang: 'ja-JP',
        toWord: 'から',
        barWord: 'バー',
        offWord: 'ゴール',
        hitSuffix: 'ヒット',
        deltaWord: 'デルタエクイティ',
        epcWord: '有効ピップ数',
        timesFormat: (count) => `${count}回`,
    },
};

export function getPhoneticLexicon(locale = 'fr'): PhoneticLocaleLexicon {
    const short = (locale || 'fr').toLowerCase().slice(0, 2);
    return LEXICON_BY_LANG[short] ?? LEXICON_BY_LANG.fr;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Transduit la notation algébrique de Backgammon (`13/8 6/5*`, `bar/20*`, `6/off(2)`)
 * en texte phonétique naturel adapté aux synthétiseurs vocaux (Web Speech API / TTS).
 */
export function transduceMoveNotationToPhonetic(rawText: string, locale = 'fr'): string {
    if (!rawText) return '';
    const lex = getPhoneticLexicon(locale);

    return rawText
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/(^|\s)\*([^*\d\s][^*]*)\*(?=\s|[.,;:!?]|$)/g, '$1$2')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/ΔEq/gi, lex.deltaWord)
        .replace(/\bEPC\b/g, lex.epcWord)
        .replace(
            /\b(\d+)\/36\b/g,
            (_, n: string) =>
                (locale || 'fr').toLowerCase().startsWith('en')
                    ? `${n} chances out of 36`
                    : `${n} chances sur 36`,
        )
        .replace(
            /\bbar\/(\d+)(\*)?(?:\((\d+)\))?(\*)?/gi,
            (_, to: string, hit1?: string, count?: string, hit2?: string) => {
                const isHit = Boolean(hit1 || hit2);
                const parts = [`${lex.barWord} ${lex.toWord} ${to}`];
                if (count) parts.push(lex.timesFormat(count));
                if (isHit) parts.push(lex.hitSuffix);
                return parts.join(' ');
            },
        )
        .replace(
            /\b(\d+)\/off(\*)?(?:\((\d+)\))?(\*)?/gi,
            (_, from: string, _hit1?: string, count?: string) => {
                const parts = [`${from} ${lex.toWord} ${lex.offWord}`];
                if (count) parts.push(lex.timesFormat(count));
                return parts.join(' ');
            },
        )
        .replace(
            /\b(\d+)\/(\d+)(\*)?(?:\((\d+)\))?(\*)?/g,
            (_, from: string, to: string, hit1?: string, count?: string, hit2?: string) => {
                const isHit = Boolean(hit1 || hit2);
                const parts = [`${from} ${lex.toWord} ${to}`];
                if (count) parts.push(lex.timesFormat(count));
                if (isHit) parts.push(lex.hitSuffix);
                return parts.join(' ');
            },
        )
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Génère une enveloppe SSML W3C complète (`<speak>...</speak>`) avec balises
 * prosodiques (`<prosody>`), pauses cognitives (`<break>`) et emphase sur les frappes (`<emphasis>`).
 */
export function transduceToPhoneticSSML(
    rawText: string,
    locale = 'fr',
    options?: { ratePercent?: number; pitchSt?: string },
): string {
    const lex = getPhoneticLexicon(locale);
    const rate = options?.ratePercent ?? 102;
    const pitch = options?.pitchSt ?? '+0st';

    if (!rawText || !rawText.trim()) {
        return `<speak xml:lang="${lex.xmlLang}"></speak>`;
    }

    const strippedMarkdown = rawText
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/(^|\s)\*([^*\d\s][^*]*)\*(?=\s|[.,;:!?]|$)/g, '$1$2')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/ΔEq/gi, lex.deltaWord)
        .replace(/\bEPC\b/g, lex.epcWord);

    const escaped = escapeXml(strippedMarkdown);

    const withMoves = escaped
        .replace(
            /\bbar\/(\d+)(\*)?(?:\((\d+)\))?(\*)?/gi,
            (_, to: string, hit1?: string, count?: string, hit2?: string) => {
                const isHit = Boolean(hit1 || hit2);
                const countPart = count ? ` ${lex.timesFormat(count)}` : '';
                const hitPart = isHit
                    ? ` <emphasis level="moderate">${lex.hitSuffix}</emphasis>`
                    : '';
                return `${lex.barWord} ${lex.toWord} <say-as interpret-as="cardinal">${to}</say-as>${countPart}${hitPart}<break time="180ms"/>`;
            },
        )
        .replace(
            /\b(\d+)\/off(\*)?(?:\((\d+)\))?(\*)?/gi,
            (_, from: string, _hit1?: string, count?: string) => {
                const countPart = count ? ` ${lex.timesFormat(count)}` : '';
                return `<say-as interpret-as="cardinal">${from}</say-as> ${lex.toWord} ${lex.offWord}${countPart}<break time="180ms"/>`;
            },
        )
        .replace(
            /\b(\d+)\/(\d+)(\*)?(?:\((\d+)\))?(\*)?/g,
            (_, from: string, to: string, hit1?: string, count?: string, hit2?: string) => {
                const isHit = Boolean(hit1 || hit2);
                const countPart = count ? ` ${lex.timesFormat(count)}` : '';
                const hitPart = isHit
                    ? ` <emphasis level="moderate">${lex.hitSuffix}</emphasis>`
                    : '';
                return `<say-as interpret-as="cardinal">${from}</say-as> ${lex.toWord} <say-as interpret-as="cardinal">${to}</say-as>${countPart}${hitPart}<break time="180ms"/>`;
            },
        )
        .replace(/\s+/g, ' ')
        .trim();

    return `<speak xml:lang="${lex.xmlLang}"><prosody rate="${rate}%" pitch="${pitch}">${withMoves}</prosody></speak>`;
}
