# Rapport d'Audit de Sécurité — Politiques Supabase Row Level Security (RLS)

**Date** : 17 Octobre 2026  
**Application** : Backgammon Tournament Pro (Next.js 15, FastAPI GNUBG, Supabase)  
**Périmètre** : Schéma de base de données PostgreSQL / Supabase, tables publiques, canaux temps réel, et politiques RLS (`supabase/migrations/`).

---

## 1. Synthèse Exécutive

L'audit des politiques de sécurité Row Level Security (RLS) a porté sur les tables opérationnelles de l'application :
- `profiles` (profils et classements ELO)
- `games` (historique et état des parties)
- `moves` (historique coup par coup)
- `coach_explanations` (diagnostics pédagogiques sauvegardés)
- `user_stats` (statistiques agrégées des joueurs)
- `matchmaking_queue` (file d'attente d'appariement ELO)
- `game_rooms` (salles de jeu multijoueur)
- `room_actions` (actions et coups multijoueur en temps réel)
- `room_presence_sessions` (présence et battements de cœur)

Bien que l'activation de RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) soit présente sur **100% des tables**, plusieurs politiques d'insertion et de mise à jour présentaient des clauses de contrôle trop permissives (`with check (true)` ou `using (true)`), créant un risque de falsification de données ou de manipulation d'état.

Un script de migration de durcissement a été généré : [`supabase/migrations/20261017000000_rls_hardening.sql`](file:///c:/Users/LAPTOP/Desktop/PROJET%20TUTO/BACKGAMMON/supabase/migrations/20261017000000_rls_hardening.sql).

---

## 2. Tableau des Risques & Vulnérabilités Identifiées

| Réf | Table Cible | Sévérité | Vulnérabilité / Constat Initial | Impact Potentiel | Statut Correction |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RLS-01** | `matchmaking_queue` | **Élevée (High)** | Politique d'UPDATE avec `using (true) with check (true)` | Modification arbitraire des tickets en file d'attente par des tiers | **Corrigé** |
| **RLS-02** | `game_rooms` | **Élevée (High)** | Clause `host_guest_token is not null` dans le `USING` | Fuite de données et modification de salles invité par n'importe quel client | **Corrigé** |
| **RLS-03** | `room_actions` | **Élevée (High)** | `INSERT` sans vérification d'appartenance à la salle (`with check (true)`) | Injection d'actions falsifiées ou perturbation d'une partie adverse | **Corrigé** |
| **RLS-04** | `user_stats` | **Moyenne (Medium)** | Les joueurs pouvaient directement `UPDATE` leurs statistiques personnelles | Auto-attribution de victoires et falsification du taux de gaffes (PR) | **Corrigé** |
| **RLS-05** | `games` | **Faible (Low)** | Absence de contrainte d'intégrité sur les scores et valeurs du videau lors des `UPDATE` | Risque d'incohérence de données (valeur de videau < 1, scores négatifs) | **Corrigé** |

---

## 3. Détail des Analyses & Mesures de Durcissement

### 3.1. RLS-01 : File de Matchmaking (`matchmaking_queue`)
- **Problème initial** : La politique `"Mise à jour de son ticket ou appariement"` utilisait `using (true) with check (true)`, permettant à n'importe quel utilisateur authentifié ou anonyme de mettre à jour le statut, le rating ou le ticket d'un autre joueur.
- **Remédiation** :
  - La politique durcie restreint l'opération : un utilisateur ne peut mettre à jour que son propre ticket (`auth.uid() = user_id`), ou bien un adversaire ne peut que basculer un ticket `'waiting'` vers l'état `'matched'` avec assignation atomique d'un `matched_room_id`.

### 3.2. RLS-02 : Salles de Jeu (`game_rooms`)
- **Problème initial** : Le prédicat `host_guest_token is not null` dans la clause de sélection et de mise à jour s'appliquait à toutes les lignes où ce champ n'était pas nul (soit la quasi-totalité des salles d'invités), autorisant n'importe quel client à lire et modifier les salles d'autres joueurs.
- **Remédiation** :
  - Suppression de la condition globale `host_guest_token is not null`. L'accès en lecture et écriture est strictement réservé aux participants désignés de la salle : `host_id`, `guest_id`, `player_x_id`, `player_o_id`.

### 3.3. RLS-03 : Actions de Salle Multijoueur (`room_actions`)
- **Problème initial** : `with check (true)` permettait d'émettre des actions dans des salles auxquelles le client n'appartenait pas.
- **Remédiation** :
  - Vérification d'existence (`EXISTS`) garantissant que la salle est active (`waiting` ou `playing`) et que le client émetteur est bien l'un des participants enregistrés de cette salle (`host_id`, `guest_id`, `player_x_id` ou `player_o_id`).

### 3.4. RLS-04 : Statistiques Utilisateur (`user_stats`)
- **Problème initial** : La politique `with check (auth.uid() = user_id)` permettait aux clients connectés d'exécuter des requêtes directes `supabase.from('user_stats').update({ games_won: 9999, total_blunders: 0 })`.
- **Remédiation** :
  - Les modifications doivent provenir exclusivement de triggers serveur (après confirmation de fin de partie dans `games`) ou via fonctions PL/pgSQL avec privilèges `SECURITY DEFINER`. Une garde d'intégrité stricte `games_played >= games_won + games_lost` a également été ajoutée.

### 3.5. RLS-05 : Intégrité des Parties (`games`)
- **Problème initial** : Les participants pouvaient modifier les valeurs de jeu sans validation des bornes minimales.
- **Remédiation** :
  - Ajout des contraintes `match_length >= 0`, `score_x >= 0`, `score_o >= 0`, `cube_value >= 1` dans la clause `WITH CHECK`.

---

## 4. Recommandations Complémentaires

1. **Révocation des permissions anonymes (anon role)** sur les tables contenant des données d'utilisateurs authentifiés.
2. **Utilisation d'un jeton signé JWT (ou session)** pour les invités du mode sans compte, plutôt qu'un jeton opaque sans signature.
3. **Application de la migration** via `supabase db push` ou la console Supabase SQL Editor lors du déploiement en production.
