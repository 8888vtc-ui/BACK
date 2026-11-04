'use client';

/**
 * @file src/components/common/CountryFlagSvg.tsx
 * @description Composant de drapeaux vectoriels SVG Haute-Horlogerie (ratio 3:2, coins arrondis).
 * Élimine définitivement le bug Windows où les émojis drapeaux s'affichent en lettres capitales brutes ("SE", "TR", "FR").
 * Strictement < 220 lignes, 0 `any`.
 */

import React from 'react';

export interface CountryFlagSvgProps {
    readonly countryName?: string | null;
    readonly countryFlag?: string | null;
    readonly className?: string;
}

type FlagSpec =
    | { readonly kind: 'v3'; readonly c: readonly [string, string, string] }
    | { readonly kind: 'h3'; readonly c: readonly [string, string, string] }
    | { readonly kind: 'h2'; readonly c: readonly [string, string] }
    | { readonly kind: 'nordic'; readonly bg: string; readonly cross: string }
    | { readonly kind: 'swiss' }
    | { readonly kind: 'turkey' }
    | { readonly kind: 'japan' }
    | { readonly kind: 'uk' }
    | { readonly kind: 'us' }
    | { readonly kind: 'greece' }
    | { readonly kind: 'brazil' }
    | { readonly kind: 'canada' }
    | { readonly kind: 'israel' };

const COUNTRY_TO_SPEC: Readonly<Record<string, FlagSpec>> = {
    // Tricolores verticaux
    france: { kind: 'v3', c: ['#002395', '#FFFFFF', '#ED2939'] },
    italie: { kind: 'v3', c: ['#009246', '#FFFFFF', '#CE2B37'] },
    belgique: { kind: 'v3', c: ['#000000', '#FAE042', '#ED2939'] },
    irlande: { kind: 'v3', c: ['#169B62', '#FFFFFF', '#FF883E'] },
    roumanie: { kind: 'v3', c: ['#002B7F', '#FCD116', '#CE1126'] },
    mexique: { kind: 'v3', c: ['#006847', '#FFFFFF', '#CE1126'] },
    sénégal: { kind: 'v3', c: ['#00853F', '#FDEF42', '#E31B23'] },
    portugal: { kind: 'v3', c: ['#006600', '#FF0000', '#FF0000'] },
    canada: { kind: 'canada' },
    // Tricolores horizontaux
    allemagne: { kind: 'h3', c: ['#000000', '#DD0000', '#FFCE00'] },
    espagne: { kind: 'h3', c: ['#AA151B', '#F1BF00', '#AA151B'] },
    'pays-bas': { kind: 'h3', c: ['#AE1C28', '#FFFFFF', '#21468B'] },
    autriche: { kind: 'h3', c: ['#ED2939', '#FFFFFF', '#ED2939'] },
    hongrie: { kind: 'h3', c: ['#CE2939', '#FFFFFF', '#477050'] },
    argentine: { kind: 'h3', c: ['#74ACDF', '#FFFFFF', '#74ACDF'] },
    colombie: { kind: 'h3', c: ['#FCD116', '#003893', '#CE1126'] },
    liban: { kind: 'h3', c: ['#ED1C24', '#FFFFFF', '#ED1C24'] },
    égypte: { kind: 'h3', c: ['#CE1126', '#FFFFFF', '#000000'] },
    arménie: { kind: 'h3', c: ['#D90012', '#0033A0', '#F2A800'] },
    serbie: { kind: 'h3', c: ['#C6363C', '#0C4076', '#FFFFFF'] },
    croatie: { kind: 'h3', c: ['#FF0000', '#FFFFFF', '#171796'] },
    inde: { kind: 'h3', c: ['#FF9933', '#FFFFFF', '#138808'] },
    'émirats arabes unis': { kind: 'h3', c: ['#00732F', '#FFFFFF', '#000000'] },
    'afrique du sud': { kind: 'h3', c: ['#E03C31', '#007749', '#001489'] },
    // Bicolores horizontaux
    pologne: { kind: 'h2', c: ['#FFFFFF', '#DC143C'] },
    monaco: { kind: 'h2', c: ['#CE1126', '#FFFFFF'] },
    singapour: { kind: 'h2', c: ['#EF3340', '#FFFFFF'] },
    tchéquie: { kind: 'h2', c: ['#FFFFFF', '#D7141A'] },
    chili: { kind: 'h2', c: ['#FFFFFF', '#D52B1E'] },
    // Croix nordiques
    suède: { kind: 'nordic', bg: '#006AA7', cross: '#FECC02' },
    danemark: { kind: 'nordic', bg: '#C8102E', cross: '#FFFFFF' },
    norvège: { kind: 'nordic', bg: '#BA0C2F', cross: '#00205B' },
    finlande: { kind: 'nordic', bg: '#FFFFFF', cross: '#003580' },
    géorgie: { kind: 'nordic', bg: '#FFFFFF', cross: '#FF0000' },
    // Drapeaux emblématiques spécifiques
    suisse: { kind: 'swiss' },
    turquie: { kind: 'turkey' },
    tunisie: { kind: 'turkey' },
    maroc: { kind: 'h2', c: ['#C1272D', '#C1272D'] },
    japon: { kind: 'japan' },
    'corée du sud': { kind: 'japan' },
    chypre: { kind: 'h3', c: ['#FFFFFF', '#D57800', '#FFFFFF'] },
    'royaume-uni': { kind: 'uk' },
    australie: { kind: 'uk' },
    'nouvelle-zélande': { kind: 'uk' },
    'états-unis': { kind: 'us' },
    grèce: { kind: 'greece' },
    brésil: { kind: 'brazil' },
    israël: { kind: 'israel' },
};

function resolveFlagSpec(countryName?: string | null): FlagSpec {
    const key = (countryName ?? '').trim().toLowerCase();
    return COUNTRY_TO_SPEC[key] ?? { kind: 'v3', c: ['#002395', '#FFFFFF', '#ED2939'] };
}

export const CountryFlagSvg: React.FC<CountryFlagSvgProps> = React.memo(({
    countryName,
    className = 'h-3 w-[18px]',
}) => {
    const spec = resolveFlagSpec(countryName);

    return (
        <svg
            viewBox="0 0 18 12"
            data-testid="country-flag-svg"
            aria-label={countryName ?? 'Drapeau'}
            className={`inline-block shrink-0 rounded-[2px] ring-1 ring-white/25 shadow-sm overflow-hidden ${className}`}
        >
            {spec.kind === 'v3' && (
                <>
                    <rect x="0" y="0" width="6" height="12" fill={spec.c[0]} />
                    <rect x="6" y="0" width="6" height="12" fill={spec.c[1]} />
                    <rect x="12" y="0" width="6" height="12" fill={spec.c[2]} />
                </>
            )}
            {spec.kind === 'h3' && (
                <>
                    <rect x="0" y="0" width="18" height="4" fill={spec.c[0]} />
                    <rect x="0" y="4" width="18" height="4" fill={spec.c[1]} />
                    <rect x="0" y="8" width="18" height="4" fill={spec.c[2]} />
                </>
            )}
            {spec.kind === 'h2' && (
                <>
                    <rect x="0" y="0" width="18" height="6" fill={spec.c[0]} />
                    <rect x="0" y="6" width="18" height="6" fill={spec.c[1]} />
                </>
            )}
            {spec.kind === 'nordic' && (
                <>
                    <rect x="0" y="0" width="18" height="12" fill={spec.bg} />
                    <rect x="5" y="0" width="2.4" height="12" fill={spec.cross} />
                    <rect x="0" y="4.8" width="18" height="2.4" fill={spec.cross} />
                </>
            )}
            {spec.kind === 'swiss' && (
                <>
                    <rect x="0" y="0" width="18" height="12" fill="#D52B1E" />
                    <rect x="7.8" y="2.5" width="2.4" height="7" fill="#FFFFFF" />
                    <rect x="5.5" y="4.8" width="7" height="2.4" fill="#FFFFFF" />
                </>
            )}
            {spec.kind === 'turkey' && (
                <>
                    <rect x="0" y="0" width="18" height="12" fill="#E30A17" />
                    <circle cx="7.4" cy="6" r="3" fill="#FFFFFF" />
                    <circle cx="8.2" cy="6" r="2.4" fill="#E30A17" />
                    <polygon points="11.8,6 10.2,6.6 10.6,5 9.5,6.2 11.1,6.5" fill="#FFFFFF" />
                </>
            )}
            {spec.kind === 'japan' && (
                <>
                    <rect x="0" y="0" width="18" height="12" fill="#FFFFFF" />
                    <circle cx="9" cy="6" r="3.2" fill="#BC002D" />
                </>
            )}
            {spec.kind === 'uk' && (
                <>
                    <rect x="0" y="0" width="18" height="12" fill="#012169" />
                    <path d="M0,0 L18,12 M18,0 L0,12" stroke="#FFFFFF" strokeWidth="2.2" />
                    <path d="M9,0 V12 M0,6 H18" stroke="#FFFFFF" strokeWidth="3.2" />
                    <path d="M9,0 V12 M0,6 H18" stroke="#C8102E" strokeWidth="1.8" />
                </>
            )}
            {spec.kind === 'us' && (
                <>
                    <rect x="0" y="0" width="18" height="12" fill="#B22234" />
                    <path d="M0,2 H18 M0,4 H18 M0,6 H18 M0,8 H18 M0,10 H18" stroke="#FFFFFF" strokeWidth="1" />
                    <rect x="0" y="0" width="8" height="6.5" fill="#3C3B6E" />
                </>
            )}
            {spec.kind === 'greece' && (
                <>
                    <rect x="0" y="0" width="18" height="12" fill="#0D5EAF" />
                    <path d="M0,2.5 H18 M0,5.5 H18 M0,8.5 H18 M0,11 H18" stroke="#FFFFFF" strokeWidth="1.2" />
                    <rect x="0" y="0" width="7" height="6.5" fill="#0D5EAF" />
                    <path d="M3.5,0 V6.5 M0,3.25 H7" stroke="#FFFFFF" strokeWidth="1.3" />
                </>
            )}
            {spec.kind === 'brazil' && (
                <>
                    <rect x="0" y="0" width="18" height="12" fill="#009739" />
                    <polygon points="9,1.5 16,6 9,10.5 2,6" fill="#FEDD00" />
                    <circle cx="9" cy="6" r="2.2" fill="#012169" />
                </>
            )}
            {spec.kind === 'canada' && (
                <>
                    <rect x="0" y="0" width="4.5" height="12" fill="#FF0000" />
                    <rect x="4.5" y="0" width="9" height="12" fill="#FFFFFF" />
                    <rect x="13.5" y="0" width="4.5" height="12" fill="#FF0000" />
                    <polygon points="9,2.8 10.6,6 9.6,6 9.6,9.2 8.4,9.2 8.4,6 7.4,6" fill="#FF0000" />
                </>
            )}
            {spec.kind === 'israel' && (
                <>
                    <rect x="0" y="0" width="18" height="12" fill="#FFFFFF" />
                    <rect x="0" y="1.2" width="18" height="1.5" fill="#0038B8" />
                    <rect x="0" y="9.3" width="18" height="1.5" fill="#0038B8" />
                    <polygon points="9,3.5 11,7.5 7,7.5" fill="none" stroke="#0038B8" strokeWidth="0.9" />
                    <polygon points="9,8.5 11,4.5 7,4.5" fill="none" stroke="#0038B8" strokeWidth="0.9" />
                </>
            )}
        </svg>
    );
});
CountryFlagSvg.displayName = 'CountryFlagSvg';
export default CountryFlagSvg;

