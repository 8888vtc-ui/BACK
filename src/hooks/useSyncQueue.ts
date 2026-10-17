'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    subscribeSyncStatus,
    processSyncQueue,
    initOfflineSync,
    SyncStatus,
} from '../lib/offline/persistenceService';
import { getPendingSyncCount } from '../lib/offline/syncQueue';

export interface UseSyncQueueReturn {
    status: SyncStatus;
    pendingCount: number;
    syncNow: (force?: boolean) => Promise<void>;
}

export function useSyncQueue(): UseSyncQueueReturn {
    const [status, setStatus] = useState<SyncStatus>('idle');
    const [pendingCount, setPendingCount] = useState<number>(0);

    useEffect(() => {
        initOfflineSync();

        getPendingSyncCount().then((count) => setPendingCount(count));

        const unsubscribe = subscribeSyncStatus((newStatus, count) => {
            setStatus(newStatus);
            setPendingCount(count);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const syncNow = useCallback(async (force: boolean = false) => {
        await processSyncQueue(force);
    }, []);

    return {
        status,
        pendingCount,
        syncNow,
    };
}
