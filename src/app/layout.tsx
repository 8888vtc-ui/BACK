import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppProviders from '../components/providers/AppProviders';
import { buildGlobalStructuredData, DEFAULT_SITE_URL } from '../lib/seo/structuredData';

export const viewport: Viewport = {
    themeColor: '#090d16',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    interactiveWidget: 'resizes-content',
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: 'Backgammon Tour — Cercle Monte-Carlo & Coach Grand-Maître IA',
        template: '%s | Backgammon Tour',
    },
    description:
        'Salon officiel Backgammon Tour & Cercle Monte-Carlo : jouez au Backgammon en ligne gratuit (matchs en 7 pts, Money Game, ELO) et progressez avec le Coach Vocal IA 3-Ply, la Méthode ERH (Exploitation du Risque Humain), le Quizz de vos Blunders et les Règles en 5 minutes.',
    applicationName: 'Backgammon Tour',
    authors: [{ name: 'Backgammon Tour & Gammon Academy', url: SITE_URL }],
    generator: 'Next.js 15',
    keywords: [
        'backgammon tour',
        'gammon academy',
        'backgammon en ligne',
        'jouer au backgammon gratuit',
        'apprendre le backgammon',
        'règles du backgammon',
        'méthode erh backgammon',
        'quizz backgammon adaptatif',
        'backgammon online tournament',
        'coach backgammon ia',
        'backgammon ai coach',
        'monte-carlo 3-ply',
        'cercle monte-carlo backgammon',
        'analyse pr backgammon',
        'videau backgammon',
        'doubling cube trainer',
        'puzzles backgammon',
        'drills backgammon',
        'backgammon opening rolls',
    ],
    alternates: {
        canonical: '/',
        languages: {
            'fr-FR': '/',
            'en-US': '/?lang=en',
            'es-ES': '/?lang=es',
            'pt-BR': '/?lang=pt',
            'de-DE': '/?lang=de',
            'ar-SA': '/?lang=ar',
        },
    },
    openGraph: {
        type: 'website',
        locale: 'fr_FR',
        alternateLocale: ['en_US', 'es_ES', 'pt_BR', 'de_DE', 'ar_SA'],
        url: SITE_URL,
        siteName: 'Backgammon Tour',
        title: 'Backgammon Tour — Cercle Monte-Carlo & Gammon Academy (IA 3-Ply)',
        description:
            'Plateau de Backgammon Tournament-Grade, Coach IA Monte-Carlo 3-Ply en temps réel, Académie d’entraînement (15 Ouvertures, Videau, Drills, Puzzles) et Salon Multijoueur.',
        images: [
            {
                url: '/og-image.svg',
                width: 1200,
                height: 630,
                alt: 'Backgammon Tour — Cercle Monte-Carlo & Gammon Academy',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Backgammon Tour — Cercle Monte-Carlo & Gammon Academy',
        description:
            'Jouez au Backgammon en conditions de tournoi et réduisez votre PR avec le Coach Grand-Maître IA Monte-Carlo 3-Ply.',
        images: ['/og-image.svg'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Backgammon Tour',
    },
    icons: {
        icon: [
            { url: '/icons/logo-crest.svg', type: 'image/svg+xml' },
            { url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
            { url: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
        apple: [
            { url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
        ],
        shortcut: [
            { url: '/icons/logo-crest.svg', type: 'image/svg+xml' },
        ],
    },
};

const STRUCTURED_DATA_JSON_LD = buildGlobalStructuredData(SITE_URL);

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" className="h-dvh max-h-dvh overflow-hidden">
            <body className="h-dvh max-h-dvh overflow-hidden m-0 p-0 bg-slate-900 text-slate-100">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA_JSON_LD) }}
                />
                <AppProviders>
                    {children}
                </AppProviders>
            </body>
        </html>
    );
}
