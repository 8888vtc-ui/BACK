# ADR-006 : Stratégie Local-First (IndexedDB, SQLite & SyncQueue)

- **Statut** : Accepté
- **Date** : 2026-10-17
- **Décideurs** : Équipe d'ingénierie Backgammon Suite
- **Domaine** : Persistance, Mode Hors-Ligne & Synchronisation

---

## Contexte
Les joueurs de Backgammon utilisent l'application en mobilité (transports en commun, avions, zones blanches).
La perte de réseau ne doit sous aucun prétexte interrompre une partie en cours contre l'IA, bloquer la résolution d'un puzzle ou perdre les métriques de Performance Rating (PR) calculées sur un match terminé.

## Décision
Nous concevons une architecture **Local-First avec file de synchronisation asynchrone (SyncQueue)** :

1. **Couche de Persistance Adaptative à la Plateforme** :
   - **Navigateur Web / PWA** : Utilisation d'**IndexedDB** avec schéma transactionnel (`idb.ts`).
   - **Application Mobile Native (Capacitor iOS & Android)** : Utilisation de **Capacitor SQLite** pour des performances disques maximales et une persistance robuste à l'abri des purges automatiques de cache du navigateur.
   - Une interface unifiée (`persistenceService.ts`) abstrait la détection automatique du support natif.

2. **File d'Attente de Synchronisation Résiliente (`syncQueue.ts`)** :
   - Toute modification locale (fin de match, nouveau record de blunder drill, puzzle résolu) est d'abord commitée dans le stockage local persistant avec un statut `pending_sync`.
   - Dès que l'événement navigateur `online` se déclenche, la `SyncQueue` dépile les mutations en arrière-plan et les envoie à Supabase avec gestion des conflits par horodatage (Last-Write-Wins).

3. **Indicateur Visuel Non Intrusif (`SyncIndicator.tsx`)** :
   - Le HUD informe l'utilisateur en temps réel de son état de synchronisation : `En ligne`, `Hors-ligne (données sauvegardées en local)` ou `Synchronisation en cours...`.

## Conséquences

### Positives
- Zéro perte de données en conditions de réseau dégradées.
- Expérience utilisateur fluide et instantanée : les écritures locales sont synchrones du point de vue de l'interface.
- Intégrité garantie sur iOS et Android sans risque de purge de LocalStorage par le système d'exploitation.

### Négatives / Contraintes
- Gestion nécessaire des conflits de synchronisation en cas d'utilisation simultanée sur plusieurs appareils.
