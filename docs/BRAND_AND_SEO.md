# 🏆 Charte de Marque, Stratégie de Domaines, Logo & Architecture SEO / ASO

> **Statut** : Référentiel officiel d'identité de marque, de nommage DNS, d'assets graphiques et de référencement naturel (SEO Web & ASO App Store / Google Play).

---

## 1. Architecture de Marque & Noms de Domaine Officiels

L'application s'articule autour d'une **architecture de marque unifiée** combinant l'autorité compétitive mondiale, le prestige visuel de Monte-Carlo et l'excellence pédagogique du Coach IA :

| Rôle Stratégique | Domaine Officiel | Statut RDAP Verisign | Cible & Usage |
| :--- | :--- | :---: | :--- |
| **1. Domaine Principal (Production & App Store)** | **`backgammontour.com`** | 🟢 Libre (`404` RDAP) | Adresse canonique (`NEXT_PUBLIC_SITE_URL`), Salon Multijoueur, Matchs en 7 pts, Classement ELO, Identifiant mobile Capacitor (`com.backgammontour.app`). |
| **2. Domaine Académie & Coach IA** | **`gammonacademy.com`** | 🟢 Libre (`404` RDAP) | Porte d'entrée pédagogique dédiée au Coach IA Open Sage 3-Ply, aux Drills de Blunders (`/drills`), aux Puzzles Quotidiens (`/puzzles`) et aux Ouvertures. |
| **3. Domaine Prestige & Défensif** | **`bgmontecarlo.com`** *(ou `montecarlobg.com`)* | 🟢 Libre (`404` RDAP) | Redirection `HTTP 301` de marque appuyant la direction artistique **« Cercle Monte-Carlo »** du Salon Privé. |

### Signature Officielle dans l'Interface
- **Nom de l'application (Web & PWA)** : **Backgammon Tour — Cercle Monte-Carlo & Gammon Academy**
- **Nom court (App Store / Google Play — ≤ 30 car.)** : `Backgammon Tour & Coach IA` (FR) / `Backgammon Tour & AI Coach` (EN)
- **Sous-titre Store (≤ 30 car.)** : `Cercle Monte-Carlo & Académie` (FR) / `Monte-Carlo & Gammon Academy` (EN)
- **Bundle ID / Application ID Capacitor** : `com.backgammontour.app` ([`capacitor.config.ts`](../capacitor.config.ts))

---

## 2. Synthèse de l'Audit Forensique (RDAP Verisign + Wayback Machine 2000–2022)

Avant de figer le choix sur **`backgammontour.com`** et **`gammonacademy.com`**, une investigation technique complète a été menée sur les registres **RDAP Verisign/PIR** et sur l'historique des captures **Archive.org (CDX API)** :

| Domaine Audité | Résultat de l'Investigation Forensique | Décision |
| :--- | :--- | :---: |
| **`backgammontour.com`** | **50+ URLs archivées (2011–2015)** sur la stratégie et l'étiquette des tournois de backgammon. Aucun spam toxique, contient le mot-clé maître exact **`backgammon`** en entier, zéro conflit de marque. | ✅ **RETENU (Domaine Principal N°1)** |
| **`gammonacademy.com`** | Portail communautaire en 2005 puis domaine parké jusqu'en 2017. Historique **100 % propre** (zéro spam casino) et correspondance sémantique directe avec le module **Académie XG / Drills / Puzzles**. | ✅ **RETENU (Domaine Académie N°2)** |
| **`bgmontecarlo.com`** / **`montecarlobg.com`** | Domaines vierges (aucun antécédent toxique). Incarnent la direction artistique *Salon Privé Monte-Carlo*. | ✅ **RETENU (Marque & Redirection)** |
| **`gammonpress.com`** | En 2000–2003, simple page *Coming Soon!*, puis en 2004–2005 redirection `302` vers `thegammonpress.com`. **Attention** : la maison d'édition de Bill Robertie (**The Gammon Press**) est toujours en activité sur **`thegammonpress.com`** (créé le 12/03/2003). Risque élevé de confusion de marque et de litige. | ❌ **Écarté en marque principale** *(uniquement pertinent en redirection secondaire)* |
| **`gammonmasters.com`** | **0 page HTML (`HTTP 200`) archivée** (uniquement des redirections `301` vers `empiregammon.com`). **Collision frontale** sur l'App Store / Google Play avec l'application mobile active *Backgammon Masters* (`backgammonmasters.com`, 2KB LLC). | ❌ **Écarté (Conflit App Store)** |
| **`backgammonmagazine.com`** | Le code source archivé en 2012–2015 révèle un **PBN d'affiliation casinos et machines à sous** (*"History of casino slots games"*, *"proper casino bonus usage UK online casinos"*). | 🚫 **Banni (Spam Casino Toxique)** |
| **`worldbackgammonfederation.com`** | La vraie fédération historique était sur `wbf.net` (et l'actuelle WBGF est sur `wbgf.info`). L'archive de 2004 révèle un site parodique personnel (*"UNDISPUTED backgammon champion of both known Universes : Bill Smith"*). | 🚫 **Banni (Parodie & Usurpation)** |

---

## 3. Logo Officiel « Blason Horloger Monte-Carlo » & Assets Vectoriels

La direction artistique s'inspire de la **haute horlogerie et des salons privés de Monte-Carlo** :

### Palette Chromatique Officielle
- **Ébène de Minuit (Fond profond)** : `#06090f` → `#090d16` → `#0e1422`
- **Or Ciselé (Filets, Couronne & Blason)** : `#fff6d1` (reflet) → `#f3c65f` (or clair) → `#d4af37` (or impérial) → `#8c5f12` (bronze d'ombre)
- **Pion Ivoire Royal (`X`)** : `#fffdf5` → `#f3e3b8` → `#b89246`
- **Pion Ébène Ardoise (`O`)** : `#334155` → `#0f172a` → `#020617`

### Référentiel des Fichiers Graphiques (`public/`)

| Fichier | Dimensions | Rôle & Intégration |
| :--- | :---: | :--- |
| [`public/icons/logo-crest.svg`](../public/icons/logo-crest.svg) | `256×256` (Vectoriel) | **Blason Officiel Backgammon Tour** : écusson octogonal horloger, couronne Monte-Carlo à 3 pointes, 4 flèches de jan bicolores, pions Ébène & Ivoire sertis d'or, dé diamanté central et cartouche `TOUR`. Utilisé en favicon SVG et dans la barre de navigation ([`AppNavbar.tsx`](../src/components/nav/AppNavbar.tsx)). |
| [`public/icons/icon-192.svg`](../public/icons/icon-192.svg) | `192×192` | Icône PWA & Apple Touch Icon aux couleurs *Salon Privé Monte-Carlo* avec cartouche `TOUR · IA`. |
| [`public/icons/icon-512.svg`](../public/icons/icon-512.svg) | `512×512` | Icône haute résolution PWA, Splash Screen & Store Master (`TOUR · IA`). |
| [`public/og-image.svg`](../public/og-image.svg) | `1200×630` | Bannière **OpenGraph & Twitter Card** (`summary_large_image`) pour l'aperçu enrichi des liens partagés sur Discord, X, WhatsApp, LinkedIn et iMessage. |

---

## 4. Architecture SEO Technique & Données Structurées (Next.js 15)

L'ensemble du référencement naturel est câblé nativement dans le projet et compatible à 100 % avec le build serveur (Vercel/Netlify/Docker) comme avec l'export statique mobile Capacitor (`npm run build:mobile`) :

1. **Métadonnées Centralisées ([`src/app/layout.tsx`](../src/app/layout.tsx))** :
   - `metadataBase` calé sur `https://backgammontour.com` (surchargeable via `NEXT_PUBLIC_SITE_URL`).
   - Balises `title` avec `template: '%s | Backgammon Tour'`, `description` enrichie, `keywords` multilingues (FR/EN/ES/PT/DE/AR), `alternates` (`canonical` + `hreflang` 6 langues `fr-FR`, `en-US`, `es-ES`, `pt-BR`, `de-DE`, `ar-SA`), `openGraph` et `twitter`.
2. **Données Structurées JSON-LD (`Schema.org`) ([`src/lib/seo/structuredData.ts`](../src/lib/seo/structuredData.ts))** :
   - Injectées dans [`src/app/layout.tsx`](../src/app/layout.tsx) sous forme de graphe `@graph` combinant :
     - `@type: "WebSite"` (`Backgammon Tour — Cercle Monte-Carlo & Gammon Academy`)
     - `@type: ["VideoGame", "SoftwareApplication"]` avec propriété `sameAs: ["https://gammonacademy.com", "https://bgmontecarlo.com"]`
     - `@type: "Course"` pour le hub encyclopédique `/academy` (*Gammon Academy*)
     - `@type: "FAQPage"` et `@type: "BreadcrumbList"`.
3. **Hub Éditorial « Gammon Academy » ([`src/app/academy/page.tsx`](../src/app/academy/page.tsx))** :
   - Encyclopédie stratégique en 6 langues : table interactive des **15 Rouleaux d'Ouverture** (équités 3-Ply Open Sage), guide mathématique du **Videau** (*Take Point* 21,5 %, Crawford, Jacoby, MET Kazaross-XG2), **Keith Count**, échelle **PR** et matrice terminologique.
4. **Indexation & Crawlabilité** :
   - [`public/robots.txt`](../public/robots.txt) : autorise l'indexation de `/`, `/academy`, `/puzzles`, `/drills`, `/progression`, bloque `/api/` et déclare le sitemap canonique.
   - [`public/sitemap.xml`](../public/sitemap.xml) : déclare les 5 routes majeures avec balises `xhtml:link` `hreflang` pour `fr`, `en`, `es`, `pt`, `de`, `ar` et `x-default`.
5. **Fiches Stores en 6 Langues ([`store-assets/metadata/`](../store-assets/metadata/))** :
   - Synchronisées en `fr-FR`, `en-US`, `es-ES`, `pt-BR`, `de-DE` et `ar-SA` avec l'URL officielle `https://backgammontour.com` et `https://gammonacademy.com`.
   - Voir [`docs/SEO_AND_I18N_MASTERPLAN.md`](SEO_AND_I18N_MASTERPLAN.md) pour la cartographie complète fichier par fichier.

---

## 5. Configuration DNS Recommandée lors de l'Achat des Domaines

1. **Domaine principal `backgammontour.com`** :
   - Enregistrement `A` (`@`) et `CNAME` (`www`) pointant vers votre hébergeur de production (Vercel / Netlify / Cloud Run).
   - Redirection automatique `www.backgammontour.com` → `https://backgammontour.com` (301 Permanent).
2. **Domaine secondaire `gammonacademy.com`** :
   - Redirection `HTTP 301` (via Cloudflare Page Rules / Redirect Rules) :
     - `gammonacademy.com/` → `https://backgammontour.com/drills` (ou `https://backgammontour.com/?utm_source=gammonacademy`)
     - `gammonacademy.com/puzzles` → `https://backgammontour.com/puzzles`
3. **Domaine secondaire `bgmontecarlo.com`** :
   - Redirection `HTTP 301` globale vers `https://backgammontour.com/`.
