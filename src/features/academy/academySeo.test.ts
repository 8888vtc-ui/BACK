import { describe, it, expect } from 'vitest';
import { OPENING_ROLLS_15 } from './academyData';
import { getAcademyContent } from './academyTranslations';
import { buildGlobalStructuredData } from '../../lib/seo/structuredData';
import { PRIMARY_LOCALES } from '../../lib/i18n/types';

describe('Gammon Academy SEO Hub & Structured Data Graph', () => {
    it('contient exactement les 15 rouleaux d ouverture sans doublon avec équité 3-Ply et notes en 6 langues', () => {
        expect(OPENING_ROLLS_15).toHaveLength(15);
        const rolls = OPENING_ROLLS_15.map((r) => r.roll);
        expect(new Set(rolls).size).toBe(15);
        expect(rolls).toContain('3-1');
        expect(rolls).toContain('4-2');
        expect(rolls).toContain('6-1');
        expect(rolls).toContain('6-5');

        for (const item of OPENING_ROLLS_15) {
            expect(item.optimalMove.length).toBeGreaterThan(0);
            expect(item.equity3Ply.startsWith('+') || item.equity3Ply.startsWith('-')).toBe(true);
            for (const loc of PRIMARY_LOCALES) {
                expect(item.nickname[loc].length).toBeGreaterThan(2);
                expect(item.strategicNote[loc].length).toBeGreaterThan(10);
            }
        }
    });

    it('fournit un contenu éditorial complet (Videau, Stratégie, FAQ SEO) dans les 6 langues', () => {
        for (const loc of PRIMARY_LOCALES) {
            const content = getAcademyContent(loc);
            expect(content.heroTitle.length).toBeGreaterThan(5);
            expect(content.cubePillars.length).toBeGreaterThanOrEqual(4);
            expect(content.strategyPillars.length).toBeGreaterThanOrEqual(4);
            expect(content.faqs.length).toBeGreaterThanOrEqual(4);
            for (const faq of content.faqs) {
                expect(faq.question.length).toBeGreaterThan(10);
                expect(faq.answer.length).toBeGreaterThan(20);
            }
        }
    });

    it('génère un graphe JSON-LD Schema.org complet (WebSite, VideoGame, SoftwareApplication, Course, FAQPage, BreadcrumbList)', () => {
        const jsonLd = buildGlobalStructuredData() as { '@context': string; '@graph': Array<{ '@type': string | string[] }> };
        expect(jsonLd['@context']).toBe('https://schema.org');
        const types = jsonLd['@graph'].flatMap((node) => Array.isArray(node['@type']) ? node['@type'] : [node['@type']]);
        expect(types).toContain('WebSite');
        expect(types).toContain('VideoGame');
        expect(types).toContain('SoftwareApplication');
        expect(types).toContain('Course');
        expect(types).toContain('FAQPage');
        expect(types).toContain('BreadcrumbList');
    });
});
