# ADR-004 : Multijoueur Supabase Realtime & Validation Serveur Anti-Triche

- **Statut** : Accepté
- **Date** : 2026-10-16
- **Décideurs** : Équipe d'ingénierie Backgammon Suite
- **Domaine** : Multijoueur en ligne, Sécurité & Intégrité

---

## Contexte
Le mode multijoueur synchrone impose une latence ultra-faible pour l'échange des coups et de l'état des horloges de tournoi.
Cependant, dans un jeu de compétition doté d'un classement ELO :
1. Les clients connectés ne doivent **jamais** pouvoir falsifier les dés, jouer des déplacements interdits ou manipuler arbitrairement la valeur du videau.
2. Déployer un serveur de jeu centralisé persistant (WebSockets Node.js ou Go dédié) ajouterait une complexité d'infrastructure et de scaling considérable pour une équipe réduite.

## Décision
Nous concevons une architecture **P2P assistée par Supabase Realtime avec validation d'autorité serveur** :

1. **Canal WebSocket Haute Vitesse (Supabase Realtime Broadcast & Presence)** :
   - Échange direct des actions (`game_action`, `clock_tick`, `cube_action`) sous forme de messages typés Zod.
   - Suivi d'état en direct des joueurs (connecté, déconnecté, reconnexion sous 60s) via Supabase Presence.

2. **Validation d'Autorité Serveur (`POST /api/multiplayer/validate-action`)** :
   - Avant qu'une action critique (application d'un coup de pion ou incrément du videau) ne soit validée pour le score du match :
     - Le payload est validé par un schéma strict Zod (`ActionValidatorSchema`).
     - Le moteur de règles pur [`src/engine/backgammonEngine.ts`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/src/engine/backgammonEngine.ts) rejoue le coup côté serveur à partir du `BoardState` d'origine et du jet de dés légitime.
     - Si le coup viole les règles officielles (ex. coup bloqué, saut illégal, dés non respectés), la requête est rejetée avec HTTP 400 et le match est sanctionné.

3. **Protection de la Base de Données (RLS PostgreSQL)** :
   - Des politiques RLS strictes sur les tables `multiplayer_rooms`, `multiplayer_matches` et `profiles` garantissent que seul le joueur authentifié associé à la chambre peut soumettre un coup ou mettre à jour son score.

## Conséquences

### Positives
- Latence réseau minimale (< 50ms) pour le ressenti visuel du joueur adverse.
- Zéro risque de triche sur les scores, les règles de match et les classements ELO.
- Infrastructure serverless auto-scalable sans gestion de clusters WebSocket.

### Négatives / Contraintes
- Nécessité de gérer la reprise de session en cas de coupure réseau temporaire (`sessionRecovery.ts`).
