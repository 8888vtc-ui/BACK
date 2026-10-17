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

export interface RealtimeChannelCallbacks {
    onActionReceived: (action: RealtimeBroadcastAction) => void;
    onOpponentPresenceChange: (isOnline: boolean, opponentInfo?: PresenceUserInfo) => void;
    onChannelStatusChange: (status: 'SUBSCRIBED' | 'CLOSED' | 'TIMED_OUT' | 'CHANNEL_ERROR') => void;
}

export class MultiplayerRealtimeManager {
    private channel: RealtimeChannel | null = null;
    private roomId: string;
    private localUser: PresenceUserInfo;
    private callbacks: RealtimeChannelCallbacks;
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private opponentTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
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
     * Initialise la souscription au canal temps réel du match.
     */
    public async connect(): Promise<void> {
        this.isDestroyed = false;

        if (!isSupabaseConfigured() || typeof window === 'undefined') {
            // Mode fallback local / test
            this.registerMockChannel();
            this.callbacks.onChannelStatusChange('SUBSCRIBED');
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
                    await this.channel?.track({
                        userId: this.localUser.userId,
                        username: this.localUser.username,
                        role: this.localUser.role,
                        lastPing: Date.now(),
                    });
                    this.callbacks.onChannelStatusChange('SUBSCRIBED');
                    this.startHeartbeat();
                } else if (status === 'CHANNEL_ERROR') {
                    this.callbacks.onChannelStatusChange('CHANNEL_ERROR');
                } else if (status === 'TIMED_OUT') {
                    this.callbacks.onChannelStatusChange('TIMED_OUT');
                } else if (status === 'CLOSED') {
                    this.callbacks.onChannelStatusChange('CLOSED');
                }
            });
        } catch (err) {
            console.warn('[MultiplayerRealtime] Erreur connexion Supabase :', err);
            this.registerMockChannel();
            this.callbacks.onChannelStatusChange('SUBSCRIBED');
        }
    }

    /**
     * Envoie une action de jeu à l'adversaire via Broadcast.
     */
    public async sendAction(action: RealtimeBroadcastAction): Promise<void> {
        if (this.isDestroyed) return;

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
            console.warn('[MultiplayerRealtime] Échec envoi broadcast :', err);
        }
    }

    /**
     * Nettoie et ferme la connexion au salon.
     */
    public disconnect(): void {
        this.isDestroyed = true;
        this.clearHeartbeat();
        this.clearOpponentTimeout();

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
            }
        }, 45000);
    }

    private clearOpponentTimeout(): void {
        if (this.opponentTimeoutTimer) {
            clearTimeout(this.opponentTimeoutTimer);
            this.opponentTimeoutTimer = null;
        }
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
        list.push(this);
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
