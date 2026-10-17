import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppProviders from '../components/providers/AppProviders';
import InstallPrompt from '../components/pwa/InstallPrompt';

export const viewport: Viewport = {
    themeColor: '#0f172a',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export const metadata: Metadata = {
    title: 'Backgammon Tournament & Grand-Maître Coach',
    description: 'Jeu de Backgammon Tournament Grade avec analyse IA en temps réel, mode offline et suivi de progression.',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Backgammon Pro',
    },
    icons: {
        icon: [
            { url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
            { url: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
        apple: [
            { url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
        ],
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" className="h-dvh max-h-dvh overflow-hidden">
            <body className="h-dvh max-h-dvh overflow-hidden m-0 p-0 bg-slate-900 text-slate-100">
                <AppProviders>
                    {children}
                    <InstallPrompt />
                </AppProviders>
            </body>
        </html>
    );
}