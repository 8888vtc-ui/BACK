'use client';

import React from 'react';
import { I18nProvider } from '../../lib/i18n';
import { ToastProvider } from '../toast/ToastContext';
import ToastContainer from '../toast/ToastContainer';
import ErrorBoundary from '../common/ErrorBoundary';
import { AnnouncerProvider } from '../common/LiveAnnouncer';
import { BoardThemeProvider } from '../../hooks/useBoardTheme';

export default function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary name="Application">
            <BoardThemeProvider>
                <I18nProvider>
                    <AnnouncerProvider>
                        <ToastProvider listenNetworkEvents={true}>
                            {children}
                            <ToastContainer />
                        </ToastProvider>
                    </AnnouncerProvider>
                </I18nProvider>
            </BoardThemeProvider>
        </ErrorBoundary>
    );
}
