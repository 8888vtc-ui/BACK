'use client';

import React from 'react';
import { I18nProvider } from '../../lib/i18n';
import { ToastProvider } from '../toast/ToastContext';
import ToastContainer from '../toast/ToastContainer';
import ErrorBoundary from '../common/ErrorBoundary';
import { AnnouncerProvider } from '../common/LiveAnnouncer';
import { BoardThemeProvider } from '../../hooks/useBoardTheme';
import { runMobileCacheAndSwPurge } from '../../lib/storage/dbCleanMigration';
import TermsAndPrPolicyModal from '../legal/TermsAndPrPolicyModal';

// Purge mobile cache, SW & db_clean_v3 : exécutée dès le chargement du module côté client.
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
