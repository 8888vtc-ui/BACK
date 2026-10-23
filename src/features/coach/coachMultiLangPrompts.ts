/**
 * Extension multilingue du Coach IA Grand-Maître pour ES, PT, DE, AR, JA.
 * Conserve la rétrocompatibilité exacte de `fr` et `en` tout en permettant au Coach
 * (LLM et repli heuristique offline) de répondre nativement dans les 6 langues du projet.
 */

import type { Locale } from '../../lib/i18n/types';
import type { CoachPromptParams, CoachStructuredResponse } from './prompts';

const SYSTEM_LANGUAGE_DIRECTIVES: Partial<Record<Locale, string>> = {
    es: `\n\n### IDIOMA DE RESPUESTA OBLIGATORIO: ESPAÑOL (ES)
Escribe TODOS los campos de texto del JSON ("summary", "whyFailed", "whyOptimal", "keyConcept", "advice", "explanation") en ESPAÑOL utilizando la terminología oficial de Backgammon (Cubo de doblaje, Punto Dorado, Punto de Barra, Blot, Prime, Conteo de pips, Regla de Crawford, Take Point).`,
    pt: `\n\n### IDIOMA DE RESPOSTA OBRIGATÓRIO: PORTUGUÊS (PT)
Escreva TODOS os campos de texto do JSON ("summary", "whyFailed", "whyOptimal", "keyConcept", "advice", "explanation") em PORTUGUÊS utilizando a terminologia oficial de Gamão / Backgammon (Dado de dobra, Ponto de Ouro, Ponto da Barra, Blot, Prime, Contagem de pips, Regra de Crawford, Take Point).`,
    de: `\n\n### VERPFLICHTENDE ANTWORTSPRACHE: DEUTSCH (DE)
Schreibe ALLE Textfelder des JSON ("summary", "whyFailed", "whyOptimal", "keyConcept", "advice", "explanation") auf DEUTSCH unter Verwendung der offiziellen Backgammon-Fachbegriffe (Dopplungswürfel, Golden Point, Bar-Punkt, Blot, Prime, Pip-Count, Crawford-Regel, Take Point).`,
    ar: `\n\n### لغة الإجابة الإلزامية: العربية (AR)
اكتب جميع الحقول النصية في كائن JSON ("summary", "whyFailed", "whyOptimal", "keyConcept", "advice", "explanation") باللغة العربية الفصحى باستخدام مصطلحات الباك غامون الاحترافية (مكعب المضاعفة، النقطة الذهبية، نقطة البار، حجر مكشوف Blot، حاجز Prime، حساب النقاط Pip Count، قاعدة كروفورد، نقطة القبول Take Point).`,
    ja: `\n\n### 必須回答言語: 日本語 (JA)
JSONのすべてのテキストフィールド ("summary", "whyFailed", "whyOptimal", "keyConcept", "advice", "explanation") をバックギャモンの公式専門用語を用いて日本語で記述してください。`,
};

export function appendCoachLanguageDirective(basePromptEn: string, language: Locale): string {
    const directive = SYSTEM_LANGUAGE_DIRECTIVES[language];
    if (!directive) return basePromptEn;
    return `${basePromptEn}${directive}`;
}

export function localizeOfflineExplanation(
    enResponse: CoachStructuredResponse,
    params: CoachPromptParams,
): CoachStructuredResponse {
    const lang = (params.language ?? 'fr') as Locale;
    const played = params.playedMove || 'Move';
    const optimal = params.optimalMove || 'Optimal';
    const loss = Math.abs(params.equityLoss ?? 0.05).toFixed(3);
    const userShots = Math.min(
        36,
        (params.features?.blotsAndShots?.user ?? []).reduce((a, b) => a + b.totalShots, 0),
    );
    const bestShots = Math.min(
        36,
        (params.features?.blotsAndShots?.best ?? []).reduce((a, b) => a + b.totalShots, 0),
    );

    if (lang === 'es') {
        const hasShotDiff = userShots > bestShots;
        const whyFailed = hasShotDiff
            ? `Al jugar ${played}, dejas un blot vulnerable que concede ${userShots} tiros de 36 al rival.`
            : `La jugada ${played} pierde -${loss} de equidad frente al plan estratégico de la posición.`;
        const whyOptimal = hasShotDiff
            ? `La jugada óptima ${optimal} reduce la exposición a ${bestShots} tiros y asegura tu estructura.`
            : `La jugada óptima ${optimal} maximiza tu equidad 3-Ply y consolida los puntos clave.`;
        return {
            ...enResponse,
            summary: hasShotDiff
                ? `Tu jugada concede ${userShots} tiros directos frente a solo ${bestShots} de la mejor jugada.`
                : `Tu jugada ${played} pierde -${loss} de equidad comparada con ${optimal}.`,
            whyFailed,
            whyOptimal,
            explanation: `${whyFailed} ${whyOptimal}`,
            keyConcept: hasShotDiff ? 'Minimización de tiros' : 'Estructura y Equidad 3-Ply',
            advice: 'Antes de dispersar tus fichas, cuenta siempre cuántos tiros directos concedes sobre 36.',
        };
    }

    if (lang === 'pt') {
        const hasShotDiff = userShots > bestShots;
        const whyFailed = hasShotDiff
            ? `Ao jogar ${played}, você deixa um blot vulnerável concedendo ${userShots} tiros em 36 ao adversário.`
            : `O lance ${played} perde -${loss} de equidade em relação ao plano estratégico da posição.`;
        const whyOptimal = hasShotDiff
            ? `O lance ótimo ${optimal} reduz a exposição para ${bestShots} tiros e protege sua estrutura.`
            : `O lance ótimo ${optimal} maximiza sua equidade 3-Ply e controla as casas-chave.`;
        return {
            ...enResponse,
            summary: hasShotDiff
                ? `O lance concede ${userShots} tiros diretos contra apenas ${bestShots} do melhor lance.`
                : `Seu lance ${played} perde -${loss} de equidade em comparação a ${optimal}.`,
            whyFailed,
            whyOptimal,
            explanation: `${whyFailed} ${whyOptimal}`,
            keyConcept: hasShotDiff ? 'Minimização de tiros' : 'Estrutura e Equidade 3-Ply',
            advice: 'Avalie sempre o número de tiros diretos concedidos em 36 antes de deixar pedras expostas.',
        };
    }

    if (lang === 'de') {
        const hasShotDiff = userShots > bestShots;
        const whyFailed = hasShotDiff
            ? `Mit ${played} hinterlassen Sie ein verwundbares Blot und geben dem Gegner ${userShots} von 36 Treffern.`
            : `Der Zug ${played} verliert -${loss} Equity gegenüber dem optimalen Spielplan.`;
        const whyOptimal = hasShotDiff
            ? `Der optimale Zug ${optimal} reduziert das Risiko auf ${bestShots} Würfe und sichert Ihre Struktur.`
            : `Der optimale Zug ${optimal} maximiert Ihre 3-Ply-Equity und sichert wichtige Punkte.`;
        return {
            ...enResponse,
            summary: hasShotDiff
                ? `Der Zug erlaubt ${userShots} direkte Treffer im Vergleich zu nur ${bestShots} beim besten Zug.`
                : `Ihr Zug ${played} kostet -${loss} Equity im Vergleich zu ${optimal}.`,
            whyFailed,
            whyOptimal,
            explanation: `${whyFailed} ${whyOptimal}`,
            keyConcept: hasShotDiff ? 'Treffer-Minimierung' : 'Struktur & 3-Ply-Equity',
            advice: 'Prüfen Sie vor jedem Zug, wie viele der 36 Würfe Ihre Blots direkt treffen können.',
        };
    }

    if (lang === 'ar') {
        const hasShotDiff = userShots > bestShots;
        const whyFailed = hasShotDiff
            ? `بلعبك ${played}، تترك حجراً مكشوفاً (Blot) يمنح الخصم ${userShots} فرصة من أصل 36 للضرب.`
            : `النقلة ${played} تخسر -${loss} من القيمة المتوقعة (Equity) مقارنة بالخطة المثلى.`;
        const whyOptimal = hasShotDiff
            ? `النقلة المثلى ${optimal} تقلل هذا الخطر إلى ${bestShots} رميات وتؤمّن هيكل البوابات.`
            : `النقلة المثلى ${optimal} تعظم القيمة المتوقعة 3-Ply وتسيطر على النقاط الاستراتيجية.`;
        return {
            ...enResponse,
            summary: hasShotDiff
                ? `النقلة تمنح الخصم ${userShots} رمية مباشرة مقابل ${bestShots} فقط للنقلة المثلى.`
                : `نقلتك ${played} تفقد -${loss} من القيمة المتوقعة مقارنة بـ ${optimal}.`,
            whyFailed,
            whyOptimal,
            explanation: `${whyFailed} ${whyOptimal}`,
            keyConcept: hasShotDiff ? 'تقليل الرميات المباشرة' : 'الهيكل والقيمة المتوقعة 3-Ply',
            advice: 'احسب دائماً عدد الرميات المواتية للخصم من أصل 36 قبل ترك أي حجر مكشوف.',
        };
    }

    return enResponse;
}
