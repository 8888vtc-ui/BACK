'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { I18nProvider } from '../../lib/i18n';
import { ToastProvider } from '../toast/ToastContext';
import ToastContainer from '../toast/ToastContainer';
import ErrorBoundary from '../common/ErrorBoundary';
import { AnnouncerProvider } from '../common/LiveAnnouncer';
import { BoardThemeProvider } from '../../hooks/useBoardTheme';
import { runMobileCacheAndSwPurge } from '../../lib/storage/dbCleanMigration';
import TermsAndPrPolicyModal from '../legal/TermsAndPrPolicyModal';
import { stopCoachVoice } from '../../hooks/useCoachVoice';

function RouteAudioCleanup() {
    const pathname = usePathname();

    useEffect(() => {
        stopCoachVoice();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
        }
    }, [pathname]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleCancel = () => {
            stopCoachVoice();
            if ('speechSynthesis' in window) {
                try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
            }
        };
        window.addEventListener('popstate', handleCancel);
        window.addEventListener('pagehide', handleCancel);
        window.addEventListener('beforeunload', handleCancel);
        return () => {
            window.removeEventListener('popstate', handleCancel);
            window.removeEventListener('pagehide', handleCancel);
            window.removeEventListener('beforeunload', handleCancel);
        };
    }, []);

    return null;
}

if (typeof window !== 'undefined') {
    runMobileCacheAndSwPurge();
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary name="Application">
            <BoardThemeProvider>
                <I18nProvider>
                    <AnnouncerProvider>
                        <ToastProvider listenNetworkEvents={true}>
                            <RouteAudioCleanup />
                            {children}
                            <ToastContainer />
                            <TermsAndPrPolicyModal />
                        </ToastProvider>
                    </AnnouncerProvider>
                </I18nProvider>
            </BoardThemeProvider>
        </ErrorBoundary>
    );
}
