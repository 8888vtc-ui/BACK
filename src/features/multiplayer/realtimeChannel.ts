/**
 * Gestionnaire de Channel Supabase Realtime (Broadcast + Presence) pour les matchs multijoueurs.
 *
 * Fonctionnalités :
 * - Diffusion temps réel des actions de jeu (dés, déplacements, videau, fin de tour)
 * - Suivi de présence (en ligne / déconnecté)
 * - Détection des déconnexions avec compte à rebours de reconnexion (45s)
 * - Synchronisation d'état complet (SYNC_STATE) lors de la reconnexion
 * - Fallback autonome résilient si Supabase est hors-ligne ou non configuré
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import type {
    RealtimeBroadcastAction,
    PresenceUserInfo,
    MultiplayerRole,
} from './types';

export type ChannelConnectionStatus =
    | 'SUBSCRIBED'
    | 'RECONNECTING'
    | 'CLOSED'
    | 'TIMED_OUT'
    | 'CHANNEL_ERROR';

export interface RealtimeChannelCallbacks {
    onActionReceived: (action: RealtimeBroadcastAction) => void;
    onOpponentPresenceChange: (isOnline: boolean, opponentInfo?: PresenceUserInfo) => void;
    onChannelStatusChange: (status: ChannelConnectionStatus) => void;
    onOpponentForfeitByDisconnect?: () => void;
}

export class MultiplayerRealtimeManager {
    private channel: RealtimeChannel | null = null;
    private roomId: string;
    private localUser: PresenceUserInfo;
    private callbacks: RealtimeChannelCallbacks;
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private opponentTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 5;
    private readonly baseReconnectDelayMs = 1000;
    private isConnected = false;
    private isReconnecting = false;
    private pendingActions: RealtimeBroadcastAction[] = [];
    private onlineListener: (() => void) | null = null;
    private isDestroyed = false;

    // Simulation interne si Supabase n'est pas branché
    private static mockChannels: Map<string, MultiplayerRealtimeManager[]> = new Map();

    constructor(
        roomId: string,
        localUser: PresenceUserInfo,
        callbacks: RealtimeChannelCallbacks,
    ) {
        this.roomId = roomId;
        this.localUser = localUser;
        this.callbacks = callbacks;
    }

    /**
     * Retourne l'état courant de la connexion et de la file de résilience.
     */
    public getConnectionState(): {
        isConnected: boolean;
        isReconnecting: boolean;
        reconnectAttempts: number;
        pendingActionsCount: number;
    } {
        return {
            isConnected: this.isConnected,
            isReconnecting: this.isReconnecting,
            reconnectAttempts: this.reconnectAttempts,
            pendingActionsCount: this.pendingActions.length,
        };
    }

    /**
     * Initialise la souscription au canal temps réel du match.
     */
    public async connect(): Promise<void> {
        this.isDestroyed = false;
        this.registerOnlineListener();

        if (!isSupabaseConfigured() || typeof window === 'undefined') {
            // Mode fallback local / test
            this.registerMockChannel();
            this.isConnected = true;
            this.isReconnecting = false;
            this.reconnectAttempts = 0;
            this.callbacks.onChannelStatusChange('SUBSCRIBED');
            await this.flushPendingActions();
            return;
        }

        try {
            const channelName = `bg_match_${this.roomId}`;
            this.channel = supabase.channel(channelName, {
                config: {
                    broadcast: { self: false, ack: false },
                    presence: { key: this.localUser.userId },
                },
            });

            // 1. Écoute des actions de jeu broadcastées
            this.channel.on('broadcast', { event: 'game_action' }, (event) => {
                if (this.isDestroyed) return;
                const action = event.payload as RealtimeBroadcastAction;
                if (action && action.player !== this.localUser.role) {
                    this.resetOpponentActivityTimer();
                    this.callbacks.onActionReceived(action);
                }
            });

            // 2. Écoute de la présence (connexion / déconnexion de l'adversaire)
            this.channel.on('presence', { event: 'sync' }, () => {
                if (this.isDestroyed || !this.channel) return;
                const state = this.channel.presenceState<PresenceUserInfo>();
                this.handlePresenceSync(state);
            });

            this.channel.on('presence', { event: 'join' }, ({ newPresences }) => {
                if (this.isDestroyed) return;
                for (const p of newPresences as unknown as PresenceUserInfo[]) {
                    if (p.userId !== this.localUser.userId) {
                        this.clearOpponentTimeout();
                        this.callbacks.onOpponentPresenceChange(true, p);
                    }
                }
            });

            this.channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
                if (this.isDestroyed) return;
                for (const p of leftPresences as unknown as PresenceUserInfo[]) {
                    if (p.userId !== this.localUser.userId) {
                        this.startOpponentDisconnectCountdown();
                    }
                }
            });

            // 3. Souscription effective
            this.channel.subscribe(async (status) => {
                if (this.isDestroyed) return;
                if (status === 'SUBSCRIBED') {
                    this.isConnected = true;
                    this.isReconnecting = false;
                    this.reconnectAttempts = 0;
                    this.clearReconnectTimer();
                    await this.channel?.track({
                        userId: this.localUser.userId,
                        username: this.localUser.username,
                        role: this.localUser.role,
                        lastPing: Date.now(),
                    });
                    this.callbacks.onChannelStatusChange('SUBSCRIBED');
                    this.startHeartbeat();
                    await this.flushPendingActions();
                } else if (status === 'CHANNEL_ERROR') {
                    this.isConnected = false;
                    this.callbacks.onChannelStatusChange('CHANNEL_ERROR');
                    this.attemptReconnect();
                } else if (status === 'TIMED_OUT') {
                    this.isConnected = false;
                    this.callbacks.onChannelStatusChange('TIMED_OUT');
                    this.attemptReconnect();
                } else if (status === 'CLOSED') {
                    this.isConnected = false;
                    this.callbacks.onChannelStatusChange('CLOSED');
                }
            });
        } catch (err) {
            console.warn('[MultiplayerRealtime] Erreur connexion Supabase :', err);
            this.registerMockChannel();
            this.isConnected = true;
            this.isReconnecting = false;
            this.callbacks.onChannelStatusChange('SUBSCRIBED');
            await this.flushPendingActions();
        }
    }

    /**
     * Déclenche une tentative de reconnexion avec backoff exponentiel (1s, 2s, 4s, 8s, 16s).
     */
    public attemptReconnect(immediate = false): void {
        if (this.isDestroyed) return;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.isReconnecting = false;
            return;
        }

        this.clearReconnectTimer();
        this.isConnected = false;
        this.isReconnecting = true;
        this.reconnectAttempts += 1;
        this.callbacks.onChannelStatusChange('RECONNECTING');

        const delayMs = immediate
            ? 0
            : this.baseReconnectDelayMs * Math.pow(2, Math.max(0, this.reconnectAttempts - 1));

        this.reconnectTimer = setTimeout(() => {
            if (this.isDestroyed) return;
            if (this.channel) {
                supabase.removeChannel(this.channel).catch(() => {});
                this.channel = null;
            }
            void this.connect();
        }, delayMs);
    }

    /**
     * Envoie une action de jeu à l'adversaire via Broadcast (ou la met en file d'attente si en reconnexion).
     */
    public async sendAction(action: RealtimeBroadcastAction): Promise<void> {
        if (this.isDestroyed) return;

        if (this.isReconnecting && action.type !== 'HEARTBEAT') {
            this.pendingActions.push(action);
            return;
        }

        if (!this.channel) {
            // Mode mock : envoi direct aux autres instances du mock channel
            const roomInstances = MultiplayerRealtimeManager.mockChannels.get(this.roomId) || [];
            for (const peer of roomInstances) {
                if (peer !== this && !peer.isDestroyed) {
                    peer.callbacks.onActionReceived(action);
                }
            }
            return;
        }

        try {
            await this.channel.send({
                type: 'broadcast',
                event: 'game_action',
                payload: action,
            });
        } catch (err) {
            console.warn('[MultiplayerRealtime] Échec envoi broadcast, mise en file d’attente :', err);
            if (action.type !== 'HEARTBEAT') {
                this.pendingActions.push(action);
            }
            this.attemptReconnect();
        }
    }

    /**
     * Vide la file d'actions en attente une fois la connexion rétablie.
     */
    private async flushPendingActions(): Promise<void> {
        if (this.pendingActions.length === 0 || this.isDestroyed || this.isReconnecting) return;
        const queue = [...this.pendingActions];
        this.pendingActions = [];
        for (const action of queue) {
            await this.sendAction(action);
        }
    }

    /**
     * Nettoie et ferme la connexion au salon.
     */
    public disconnect(): void {
        this.isDestroyed = true;
        this.isConnected = false;
        this.isReconnecting = false;
        this.pendingActions = [];
        this.clearHeartbeat();
        this.clearOpponentTimeout();
        this.clearReconnectTimer();
        this.unregisterOnlineListener();

        if (this.channel) {
            supabase.removeChannel(this.channel).catch(() => {});
            this.channel = null;
        }

        // Nettoyage mock
        const instances = MultiplayerRealtimeManager.mockChannels.get(this.roomId);
        if (instances) {
            const next = instances.filter((i) => i !== this);
            if (next.length === 0) {
                MultiplayerRealtimeManager.mockChannels.delete(this.roomId);
            } else {
                MultiplayerRealtimeManager.mockChannels.set(this.roomId, next);
            }
        }
    }

    private startHeartbeat(): void {
        this.clearHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.isDestroyed) return;
            this.sendAction({
                type: 'HEARTBEAT',
                player: this.localUser.role,
                timestamp: Date.now(),
            }).catch(() => {});
        }, 15000);
    }

    private clearHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    private resetOpponentActivityTimer(): void {
        this.clearOpponentTimeout();
    }

    private startOpponentDisconnectCountdown(): void {
        this.clearOpponentTimeout();
        this.callbacks.onOpponentPresenceChange(false);

        // Si l'adversaire n'est pas réapparu après 45s, il est considéré forfait
        this.opponentTimeoutTimer = setTimeout(() => {
            if (!this.isDestroyed) {
                this.callbacks.onOpponentPresenceChange(false);
                this.callbacks.onOpponentForfeitByDisconnect?.();
            }
        }, 45000);
    }

    private clearOpponentTimeout(): void {
        if (this.opponentTimeoutTimer) {
            clearTimeout(this.opponentTimeoutTimer);
            this.opponentTimeoutTimer = null;
        }
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    private registerOnlineListener(): void {
        if (typeof window === 'undefined' || this.onlineListener) return;
        this.onlineListener = () => {
            if (!this.isDestroyed && !this.isConnected) {
                this.reconnectAttempts = 0;
                this.attemptReconnect(true);
            }
        };
        window.addEventListener('online', this.onlineListener);
    }

    private unregisterOnlineListener(): void {
        if (typeof window === 'undefined' || !this.onlineListener) return;
        window.removeEventListener('online', this.onlineListener);
        this.onlineListener = null;
    }

    private handlePresenceSync(state: Record<string, PresenceUserInfo[]>): void {
        let opponentPresent: PresenceUserInfo | null = null;
        for (const key of Object.keys(state)) {
            const presences = state[key];
            if (!presences) continue;
            for (const p of presences) {
                if (p.userId !== this.localUser.userId) {
                    opponentPresent = p;
                    break;
                }
            }
        }

        if (opponentPresent) {
            this.clearOpponentTimeout();
            this.callbacks.onOpponentPresenceChange(true, opponentPresent);
        }
    }

    private registerMockChannel(): void {
        const list = MultiplayerRealtimeManager.mockChannels.get(this.roomId) || [];
        if (!list.includes(this)) {
            list.push(this);
        }
        MultiplayerRealtimeManager.mockChannels.set(this.roomId, list);

        // Notifier les pairs existants dans ce mock room
        for (const peer of list) {
            if (peer !== this) {
                peer.callbacks.onOpponentPresenceChange(true, this.localUser);
                this.callbacks.onOpponentPresenceChange(true, peer.localUser);
            }
        }
    }
}
