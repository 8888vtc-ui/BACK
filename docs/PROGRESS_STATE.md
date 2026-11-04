# État d'Avancement — Refonte UI/UX Haute Horlogerie ("Linear meets Cercle Monte-Carlo")

**Date de mise à jour :** 2026-11-04

## 1. Synthèse des 7 Améliorations UI/UX Codées sur le Salon d'Accueil (`/`)

1. **Éradication des Emojis Windows & Passage aux Icônes Vectorielles Horlogères (`lucide-react`)** :
   - Remplacement intégral des emojis système (`🤖`, `🧩`, `🎯`, `📚`, `💰`, `⚡`, `🌱`, `🎲`, `⚙️`) par des icônes vectorielles `lucide-react` (`strokeWidth={1.5}`, `14px`–`18px`) teintées en Or Champagne (`#D4AF37`) et Émeraude (`#10B981`).
2. **Isolation du Signal Chromatique & Fin du Sur-Encadrement (Style Linear)** :
   - Conteneurs passifs unifiés en `border border-white/[0.06] bg-[#0B0E14]/90 backdrop-blur-md`.
   - Seul l'élément actif d'un groupe porte l'éclat Or Champagne (`border-[#D4AF37]/60 bg-[#D4AF37]/10 text-[#F3E5AB] shadow-[0_0_20px_rgba(212,175,55,0.12)]`).
   - Pilules inactives de format et cadence allégées (`border-white/[0.05] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200 transition-all duration-150`).
3. **Sublimation des 2 CTAs Principaux (`OpenMatchesTable.tsx` & `LobbyScreen.tsx`)** :
   - **CTA Primaire (`TROUVER UN ADVERSAIRE` & Lancement Match IA)** : Dégradé Or Horloger `bg-gradient-to-b from-[#E6C665] via-[#D4AF37] to-[#B89225] text-[#050505]` avec reflet spéculaire supérieur `shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_25px_-4px_rgba(212,175,55,0.35)]` et micro-interaction `hover:brightness-105 active:scale-[0.99]`.
   - **CTA Secondaire (`INVITER UN AMI — LIEN 1-CLIC`)** : Suédine Malachite profonde `bg-gradient-to-b from-[#0F2922] to-[#091915] border border-[#10B981]/30 hover:border-[#10B981]/60 text-white` avec sous-titre `Sans création de compte • Accès < 3s` en `text-[#34D399] text-xs`.
4. **Épuration & Hiérarchie de la Sidebar Gauche (`LobbySidebarAndWidgets.tsx`)** :
   - Unification orthographique stricte : `"Quiz"` partout (`Puzzles & Quiz`, `Quiz PR`, `Quiz ER / PR & Blunders`).
   - Remplacement du lourd rectangle jaune actif par un filet vertical Or (`border-l-2 border-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/12 to-transparent text-[#F3E5AB]`).
   - Structuration en 3 blocs respirants (`Tables`, `Entraînement`, `Circuit`) avec séparateurs discrets.
5. **Fusion Élégante de la Barre `"Mon Espace Joueur"` et de la Section `"Académie"` (`PlayerProfileCard.tsx` & `LobbyScreen.tsx`)** :
   - `PlayerProfileCard` intégré comme en-tête unifié du bloc inférieur `ACADÉMIE & ANALYSE GRAND MAÎTRE`.
   - Métriques (`ELO 1500`, `PR — Non calibré`, `MATCHS 0`) alignées en `font-mono tabular-nums` avec séparateurs verticaux `h-4 w-[1px] bg-white/[0.08]`.
6. **Transformation des Cartes `"0%"` en Cartes d'Engagement Actives (`ModuleProgressCard.tsx` & `LearningModulesGrid.tsx`)** :
   - **Puzzles Quotidiens** : Badge d'appel `Calibrer mon PR →` et jauge pré-amorcée subtile (`8%`).
   - **Drills de Blunders** : Texte explicite `Capturés automatiquement en match (3-Ply)` et CTA dynamique `Lancer un match →` (ou `Corriger →` dès qu'un blunder est capturé).
   - **Ouvertures** : `15 lancers de départ certifiés Open Sage 3-Ply` et CTA `Étudier →`.
7. **Finition Typographique & Micro-Interactions (60/120 FPS)** :
   - Courbes `ease-[cubic-bezier(0.22,1,0.36,1)] duration-200` avec élévation subtile `hover:-translate-y-[1px] hover:border-white/15` sur les 3 cartes supérieures et les 3 cartes inférieures.
   - Badge d'en-tête `v3.0 • 3-Ply • Mistral Large 4` dans une pilule Émeraude/Or (`AppNavbar.tsx`).

## 2. Conformité Architecturale & Budgets de Lignes (`<= 300` lignes)

| Fichier modifié | Lignes | Statut Budget (`<= 300`) |
|---|---|---|
| `src/components/lobby/LobbyScreen.tsx` | 297 | ✅ Conforme |
| `src/components/nav/AppNavbar.tsx` | 263 | ✅ Conforme |
| `src/components/lobby/LobbySidebarAndWidgets.tsx` | 247 | ✅ Conforme |
| `src/components/lobby/OpenMatchesTable.tsx` | 242 | ✅ Conforme |
| `src/components/lobby/LearningModulesGrid.tsx` | 167 | ✅ Conforme |
| `src/components/lobby/PlayerProfileCard.tsx` | 146 | ✅ Conforme |
| `src/components/lobby/ModuleProgressCard.tsx` | 108 | ✅ Conforme |

- **TypeScript (`npx tsc --noEmit`)** : `0` erreur (`0 any`, `0 ERH`).
- **Tests Unitaires (`npx vitest run src/components/lobby`)** : `100 % PASS` (19/19 tests).
- **Plein Écran Desktop** : `h-[100dvh] lg:overflow-hidden` préservé sans scroll parasite.

## 3. Harmonisation du Plateau & Éradication des Trahisons "Bot" en Matchmaking (`BoardSideRails.tsx`)

1. **Purge des Pseudos Techniques / `*BG` (`src/features/personas/humanPersonaSeeds.ts`)** :
   - Suppression de 100 % des pseudos avec suffixe `BG` (`SvenBG` $\rightarrow$ `Sven L.`, `david_bg64` $\rightarrow$ `david_64`) et de tous les pseudos de jargon (`HitAndCover`, `BarPoint7`, `PipMaster`, etc.) au profit de prénoms et noms humains internationaux naturels.
   - Suppression du préfixe drapeau emoji brut dans `displayName` (`clubChallengerPool.ts`) qui affichait des codes ISO (`SE`) sous Windows.
2. **Dissociation Stricte Joueur En Ligne vs Bot IA (`BoardSideRails.tsx` & `BoardPortraitAndActionRails.tsx`)** :
   - En mode En Ligne (`challengerProfile` présent) :
     - **Avatar** : Affiche le vrai portrait photographique du challenger (`resolveNaturalChallengerAvatarUrl` accordé au genre du prénom : `/avatars/user-avatar-1..5.jpg`), jamais le portrait de Sofia ou de l'Homme d'Affaires.
     - **Bulle de Dialogue** : Suppression totale de la citation pré-enregistrée de Sofia (`activePersona.dialogues.opening.fun`), remplacée par un indicateur discret `● Connecté · Match classé`.
     - **Badge** : Remplacement de `CLUB SUÈDE` par `En ligne · Suède`.
3. **Harmonisation de l'Avatar `"Vous"` (`MonteCarloIcons.tsx`)** :
   - Suppression du personnage vectoriel cartoon vert au profit du Blason Royal Haute Horlogerie (`/avatars/user-avatar-5.jpg`) ou du portrait choisi dans le Passeport Joueur.
4. **Découpage Modulaire `< 300` lignes** :
   - `src/components/board/BoardSideRails.tsx` : 247 lignes (`<= 300`).
   - `src/components/board/BoardPortraitAndActionRails.tsx` : 262 lignes (`<= 300`).
   - `src/components/common/MonteCarloIcons.tsx` : 239 lignes (`<= 300`).
   - `src/components/common/CountryFlagSvg.tsx` : 204 lignes (`<= 300`).
   - `src/hooks/useOpeningAssistant.ts` : 153 lignes (`<= 300`).
5. **Finition PC / Windows (Drapeaux SVG, Fin du Spoil 1er Coup & Pseudos Nobles)** :
   - **Fin du Spoil du 1er Coup (`useOpeningAssistant.ts`)** : Désactivation par défaut des flèches automatiques d'ouverture en match (`isLiveAdviceEnabled = false` par défaut et désactivé en `isMultiplayerActive`) pour laisser le joueur réfléchir librement.
   - **Vrais Drapeaux Vectoriels SVG (`CountryFlagSvg.tsx`)** : Intégration de drapeaux SVG nets (ratio 3:2, coins arrondis) dans le badge adverse (`[Drapeau SVG] Turquie · En ligne`) sur Desktop, Portrait et Matchmaking.
   - **Purge des Pseudos à Numéros (`humanPersonaSeeds.ts`)** : Remplacement intégral des pseudos de type `Murat_34`, `thomas_69`, `laurent75` par des patronymes et initiales nobles (`Murat K.`, `Thomas R.`, `Laurent B.`).
   - **Épuration du Badge `PR —`** : Masquage de la boîte `PR —` sur la carte adversaire tant qu'aucun coup n'a été évalué.



