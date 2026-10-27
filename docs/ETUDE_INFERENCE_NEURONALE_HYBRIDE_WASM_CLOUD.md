# Inférence Neuronale Hybride pour le Backgammon Compétitif : Équilibrage WASM/ONNX Client-Side vs Micro-services Cloud GPU/CPU

> [!IMPORTANT]
> **Statut d'implémentation réel (Octobre 2026)** :
> L'étude théorique ci-dessous explorait initialement un modèle hybride « Edge WASM (WildBG / ONNX) + Cloud (bgsage) ».
> Suite à l'audit empirique mesurant un PR de **~26,6** pour l'évaluateur 0-ply WildBG en WASM (dû à l'absence de recherche multi-ply sur les 21 tirages), **WildBG WASM a été archivé** ([`ADR 0009`](adr/0009-open-sage-cloud-run.md)).
> L'architecture de production repose désormais exclusivement sur **Open Sage (`bgsage-service` Stage 11 à 24 réseaux neuronaux)** sur **Google Cloud Run** pour les 4 niveaux de bots IA et le Coach IA, couplé à un **repli déterministe local en TypeScript pur** (`evaluator.ts` + table de Bear-Off exacte 54 264 états + Keith Count) garantissant la fluidité 100 % hors-ligne.

## 1. Contexte & Problématique Système

L'architecture des moteurs de backgammon compétitifs a connu une mutation structurelle majeure, passant des réseaux peu profonds entraînés par différence temporelle dans les années 1990 à des perceptrons multicouches (MLP) profonds couplés à des recherches stochastiques massivement parallèles et des rollouts à réduction de variance.

Contrairement aux échecs ou au jeu de Go, où la profondeur de l'arbre combinatoire impose des réseaux convolutifs ou des transformeurs à plusieurs dizaines de millions de paramètres, la dynamique stochastique du backgammon est gouvernée par un facteur de branchement aléatoire de 21 tirages de dés distincts à chaque demi-coup (ply). Cette topologie particulière déplace le goulot d'étranglement matériel : un évaluateur neuronal de backgammon doit être suffisamment compact pour tenir entièrement dans les caches L1/L2 du processeur et exécuter des dizaines de milliers d'inférences par seconde lors des recherches expectiminimax multi-plis, tout en offrant une précision au milli-point d'équité près pour trancher les décisions de videau (*cube actions*) et les fins de partie complexes.

Le déploiement d'un tel moteur au sein d'une plateforme web et mobile moderne pose un dilemme d'ingénierie système et financier :
- **Cloud pur** : puissance constante mais coûts d'infrastructure convexes (vCPU, RAM, egress réseau) à grande échelle (MAU/DAU).
- **Client pur (WASM/WebGPU)** : zéro coût marginal et zéro latence réseau, mais hétérogénéité matérielle, plafonds mémoire des navigateurs mobiles (iOS WebKit / Android Chrome) et étranglement thermique (*thermal throttling*).
- **Architecture Hybride Cible** : 95 % des coups résolus localement en WASM/WebGPU, 5 % des coups litigieux/blunders et analyses VIP Grand-Maître délégués à Open Sage sur Google Cloud Run avec cache multi-niveaux.

---

## 2. Architecture des Poids et Topologie des Réseaux de Backgammon

### Anatomie des Réseaux d'Évaluation Neuronale de Référence

> **Convention de nomenclature** :
> - **Convention GnuBG (structurelle)** : 0-ply = réseau direct sans recherche ; 1-ply = 21 tirages adverses ; 2-ply = 441 séquences de dés.
> - **Convention XG / Open Sage** : 1-ply (1P) = réseau direct ; 2-ply (2P) = 1 coup d'avance ; 3-ply (3P) = 2 coups d'avance.

| Moteur / Modèle | Topologie des Couches ($d_{\text{in}} \to \text{Hidden} \to d_{\text{out}}$) | Activations | Paramètres | Coût Arithmétique (FLOPs / éval) | Spécialisation & Videau |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TD-Gammon 1.0** | $198 \to [80] \to 4$ | Sigmoïde ($\sigma$) | $16\,244$ | $32\,488$ | Réseau monolithique unique ; sans videau (*cubeless*). |
| **GnuBG (2-layer)** | $250 \to [128, 128] \to 5$ | Sigmoïde / ReLU | $49\,285$ (par net) | $98\,570$ | 3 réseaux par phase (Contact, Race, Crashed) + Bearoff DB ; modèle de Janowski. |
| **WildBG (v2024+)** | $200 \to [256, 128, 64] \to 6$ | HardSigmoid (Contact) / ReLU (Race) | $92\,998$ (par net) | $185\,996$ | 2 réseaux séparés (Contact, Race) ; supervisé rollouts AdamW. |
| **Open Sage / PureTD** | $200 \to [512, 512, 256, 256] \to 5 \text{ (ou } 1)$ | ReLU (Cachées) / Sigmoïde ou Linéaire | $563\,973$ | $1\,127\,946$ | MLP profond 4 couches ; équité *cubeful* native normalisée ou multi-ply + rollouts. |

### Quantification et Dégradation Mesurable du PR

L'équité sans videau s'exprime par :
$$E_{\text{cubeless}} = 2 P(\text{win}) - 1 + P(\text{win gammon}) + P(\text{win backgammon}) - P(\text{lose gammon}) - P(\text{lose backgammon})$$

La relation entre le taux d'erreur GnuBG (mEMG en milli-points) et le Performance Rating (PR) est :
$$\text{PR} = \frac{\sum_{i=1}^{N_{\text{déc}}} \Delta E_i}{N_{\text{déc}}} \times 500 = \frac{\text{mEMG}}{2,0}$$
*(Un PR de 1,0 correspond exactement à 2,0 milli-points d'erreur moyenne par décision).*

| Modèle & Variante | Poids FP32 | Poids FP16 | Poids INT8 | Perte d'Équité (INT8 Q8 vs FP32) | Dégradation PR en FP16 | Dégradation PR en INT8 Q8 / W8A8 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TD-Gammon** | $63,45\text{ Ko}$ | $31,73\text{ Ko}$ | $15,86\text{ Ko}$ | $\sim 0,80\text{ mEq}$ | $< 0,02$ | $+0,40\text{ (Q8)} \text{ / } +1,80\text{ (W8A8)}$ |
| **GnuBG (2 couches)** | $192,52\text{ Ko}$ | $96,26\text{ Ko}$ | $48,13\text{ Ko}$ | $\sim 0,45\text{ mEq}$ | $< 0,01$ | $+0,22\text{ (Q8)} \text{ / } +1,15\text{ (W8A8)}$ |
| **WildBG (3 couches)** | $363,27\text{ Ko}$ | $181,64\text{ Ko}$ | $90,82\text{ Ko}$ | $\sim 0,35\text{ mEq}$ | $< 0,01$ | $+0,18\text{ (Q8)} \text{ / } +0,95\text{ (W8A8)}$ |
| **Open Sage (4 couches)** | $2\,203,02\text{ Ko}$ | $1\,101,51\text{ Ko}$ | $550,75\text{ Ko}$ | $\sim 0,25\text{ mEq}$ | $< 0,01$ | $+0,12\text{ (Q8)} \text{ / } +0,75\text{ (W8A8)}$ |

*Conclusion quantification* : Seule la quantification **INT8 Q8 (poids INT8, accumulation 32 bits)** ou **FP16** est retenue en production locale. La quantification statique W8A8 est proscrite car elle détruit la précision sur les backgames ($P(\text{BG}) \le 1,5\%$) et les décisions de videau critiques à $\pm 3\text{ mEq}$.

### Arbre de Recherche Stochastique & Complexité par Coup

- **0-ply (1P Sage)** : $B_0 \approx 20\text{ évals}$ $\to$ **$22,56\text{ MFLOPs}$** (Open Sage).
- **1-ply filtré (2P Sage)** : $B_0 + K_0 \times 21 \times \bar{B} \approx 20 + 5 \times 21 \times 20 = 2\,120\text{ évals}$ $\to$ **$2,39\text{ GFLOPs}$**.
- **2-ply filtré (3P Sage / XG 3-ply)** : $B_0 + K_0 \times 21 \times (\bar{B} + K_1 \times 21 \times \bar{B}) \approx 72\,260\text{ évals}$ $\to$ **$81,51\text{ GFLOPs}$**.

---

## 3. Inférence Locale Navigateur (WebAssembly & ONNX Runtime Web)

### Benchmarks & Paliers Matériels

| Palier Matériel & Runtime Client | Speedup Relatif ORT-Web | Débit WildBG (pos/s) | Débit Open Sage (pos/s) | Latence 0-ply [20 pos] | Latence 1-ply [2 120 pos] | Latence 2-ply (3P) [72 260 pos] | Viabilité UX Temps Réel (< 1,5 s) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Desktop Tier A** (WebGPU FP16 + IO Binding) | $550\times$ | $\sim 420\,000$ | $\sim 185\,000$ | $1,2\text{ ms}^*$ | $11,5\text{ ms}$ | $390\text{ ms}$ | **Totale** (0-ply, 1-ply et 2-ply) |
| **Desktop Tier B** (WASM SIMD128 + 8/16 Workers Q8) | $26,5\times$ | $\sim 125\,000$ | $\sim 24\,000$ | $0,8\text{ ms}$ | $88,3\text{ ms}$ | $3\,010\text{ ms}$ | 0-ply & 1-ply (2-ply acceptable en différé) |
| **Mobile Haut de Gamme** (iOS/Android SIMD + 4 Workers) | $\sim 8\times\text{ – }12\times$ | $\sim 38\,000$ | $\sim 6\,800$ | $2,9\text{ ms}$ | $311,8\text{ ms}$ | $10\,626\text{ ms}$ | 0-ply & 1-ply uniquement (2-ply trop chaud) |
| **Mobile Tier C** (Ancien iPhone / WebView 1-Thread Scalaire) | $1,0\times$ | $\sim 3\,200$ | $\sim 550$ | $36,4\text{ ms}$ | $3\,854,5\text{ ms}$ | $131\,380\text{ ms}$ | 0-ply uniquement (délestage Cloud Run requis) |

*\*Note : En 0-ply (lot de 20 positions), l'appel synchrone WASM SIMD en cache L1 est plus direct que l'ordonnancement asynchrone WebGPU (~1 ms).*

### Contraintes Mobiles Critiques
1. **Mémoire & Heap WASM** :
   - iOS WebKit (Jetsam) termine brutalement le processus WebContent si la mémoire dépasse 256 à 512 Mo.
   - Solution : Allocateur d'arène statique de **32 Mo pré-alloués** (512 pages WASM), zéro allocation dynamique pendant la recherche d'arbre.
2. **Thermal Throttling & Batterie** :
   - Une recherche 2-ply continue sur smartphone fait chuter les cœurs CPU de 35% à 50% après 90 à 150 s.
   - Règle système : l'inférence locale en cours de jeu mobile est **strictement plafonnée à 1-ply (< 315 ms)**.
3. **Poids du Bundle & Initialisation** :
   - Bundle complet : WASM runtime (~1,8 Mo Brotli) + WildBG INT8 (91 Ko) + Open Sage FP16 (1,1 Mo) = **~3,0 Mo** (téléchargé en ~240 ms en 4G/5G).
   - Persistance dans IndexedDB/OPFS avec Web Lock pour empêcher la suspension d'arrière-plan.

### Pipeline de Repli en 4 Paliers (Graceful Degradation)
- **Palier 1 (Tier A)** : WebGPU + FP16 + IO Binding (`adapter.info`, warmup en arrière-plan).
- **Palier 2 (Tier B)** : WASM SIMD128 + SharedArrayBuffer + Workers (INT8 Q8) sous en-têtes COOP/COEP.
- **Palier 3 (Tier C)** : WASM mono-worker sans SAB (transferts zéro-copie ArrayBuffer, modèle compact WildBG/GnuBG 0-ply).
- **Palier 4 (Tier D)** : Délestage Cloud Run pour les analyses 3-ply + fallback heuristique pubeval pur JS (< 5 Ko) hors-ligne.

---

## 4. Inférence Distante sur Google Cloud Run (Open Sage / bgsage-service)

### Modélisation Économique & Arbitrage CPU vs GPU Serverless

- **Cloud Run CPU (bgsage-service en C++ AVX2)** :
  - Configuration : 2 vCPU, 1 GiB RAM, `concurrency = 2`.
  - Coût : $\sim \$0,00002525\text{/s}$ (~$0,091/heure).
  - 1 instance chaude permanente (`min-instances = 1`) = **$49,41 / mois** (élimine tout cold start de 400-1200 ms).
- **Cloud Run GPU (NVIDIA L4 serverless, scale-to-zero)** :
  - Facturé à la seconde ($0,0001867/s) avec 4 vCPU + 16 GiB RAM obligatoires = $\sim \$0,000349\text{/s}$ (~$1,25/heure).
  - **13,8 fois plus cher qu'une instance CPU !**
  - *Règle FinOps* : Le GPU L4 est **strictement réservé aux Full Rollouts Pass 3 (20 736 trajectoires) et au tuteur LLM**. L'inférence 3-ply / 3T standard tourne exclusivement sur CPU AVX2.

### Simulation Comparative du Coût Total de Possession (TCO)

*Hypothèse : DAU/MAU = 15 %, 3 parties/jour/DAU, 25 décisions/partie = 75 décisions/jour/DAU (2 287,5 décisions/mois/DAU).*

| Métrique Financière & Volumétrie | 10 000 MAU (1 500 DAU) | 100 000 MAU (15 000 DAU) | 1 000 000 MAU (150 000 DAU) | Analyse FinOps |
| :--- | :--- | :--- | :--- | :--- |
| **Décisions Totales Générées / Mois** | $3\,431\,250$ | $34\,312\,500$ | $343\,125\,000$ | Croissance linéaire avec l'engagement. |
| **Scénario A : Cloud Pur (Sans Cache, 20 ms)** | $53,96 / mois | $88,98 / mois | $439,13 / mois | En 3-ply (300 ms), le coût à 1M MAU exploserait à $2 812 / mois. |
| **Scénario B : Cloud Pur + Cache 70 % Hit** | $51,24 / mois | $61,74 / mois | $166,79 / mois | Réduction de 70% des coûts variables (vCPU, requêtes, egress). |
| **Scénario C : Hybride WASM (95%) + Cloud 3-ply (5%)** | **$50,77 / mois** | **$57,11 / mois** | **$120,44 / mois** | **Optimal : Précision Grand-Maître 3-ply pour 0,0001 $ / MAU (-72,6% vs Scénario A).** |

### Protocole Binaire Canonique `bgsage-bin` (20 octets)

Pour diviser par 14 la facture d'egress réseau ($0,12/Go) par rapport au JSON :
- **Requête binaire (20 octets / 160 bits)** :
  - Octets 0-14 (120 bits) : 24 flèches encodées sur 5 bits signés ($-15$ à $+15$).
  - Octet 15 : Barres X et O ($4 + 4\text{ bits}$).
  - Octet 16 : Dé 1 ($3\text{ bits}$), Dé 2 ($3\text{ bits}$), Trait ($1\text{ bit}$), Crawford ($1\text{ bit}$).
  - Octet 17 : $\log_2(\text{cube})$ ($4\text{ bits}$), propriétaire ($2\text{ bits}$), type décision ($2\text{ bits}$).
  - Octets 18-19 : Away scores Joueur 1 et Joueur 2 ($2 \times \text{uint8}$).
- **Réponse binaire (144 octets)** :
  - 8 meilleurs coups candidats $\times$ 18 octets (4 octets mouvements + 10 octets probabilités uint16 + 4 octets float32 équité).
  - Économie : **83,9 % de compression à l'aller, 93 % au retour vs JSON (2 Ko $\to$ 144 octets)**.

### Réduction par Caches Multi-Niveaux (> 70 % de Cache Hit)
1. **Canonisation Algébrique** :
   - Tri des dés ($d_1 \ge d_2$, 21 tirages au lieu de 36).
   - Invariance linéaire du videau en money play ($\text{cube} \ge 2 \to 2$ avec équité mise à l'échelle par $\frac{\text{cube}}{2}$).
   - Scores exprimés en distance restante (*away scores*) pour fusionner toutes les longueurs de match identiques.
2. **Cache L1 — Precomputed Opening Book** :
   - Sous-ensemble compact XG `.ob` (13,6 Mo, 53 210 entrées) ou BGDB Opening Book (1,7 Go partagé en mémoire).
   - Résout en $O(1)$ (< 0,2 ms) 100 % des coups des 2 à 3 premiers tours (~25 % des décisions d'un match).
3. **Cache L2 — Anneau LRU In-Memory & Edge CDN** :
   - Cache public immuable Google Cloud CDN sur `GET /v1/eval/{base64_20bytes}` + Redis/Dragonfly LRU de 2 millions d'entrées (328 Mo de RAM).

---

## 5. Matrice de Décision & Architecture Hybride Cible

### Algorithme de Routage en Cascade par Écart d'Équité (*Equity Gap*)

$$\Delta E_{1,2} = E(a_{(1)}) - E(a_{(2)})$$

1. **Décision certifiée localement (WASM/WebGPU)** si :
   - Coup forcé ($B_0 \le 1$), OU
   - Coup présent dans l'Opening Book / Bearoff DB, OU
   - Écart franc en 1-ply local ($\Delta E_{1,2} > 0,050$) ET le joueur a joué le meilleur coup ($a_{\text{joueur}} = a_{(1)}$).
   - *(Représente ~90 % à 95 % des coups en partie).*
2. **Escalade vers Google Cloud Run (bgsage-service 3P)** si :
   - Position litigieuse ($\Delta E_{1,2} \le 0,050$), OU
   - Erreur potentielle du joueur ($\Delta E_{\text{joueur}} \ge 0,008$, soit $\ge 8\text{ mEq}$), OU
   - Décision de videau à $\pm 0,035$ des seuils théoriques.
3. **Escalade vers Rollout Tronqué 3T (7 tours)** si :
   - L'écart 3-ply sur Cloud Run reste serré : $\Delta E_{1,2}^{\text{3P}} \le 0,020$.

| Contexte d'Usage | Cible d'Inférence | Moteur & Profondeur | Seuil de Déclenchement | Latence (p95) |
| :--- | :--- | :--- | :--- | :--- |
| **Jeu Hors-Ligne / Bot Débutant & Moyen** | 100 % Local (Tier A/B/C) | WildBG / GnuBG 0-ply + bruit gaussien | Mode avion ou bot PR > 4,0 | $< 5\text{ ms}$ |
| **Bot Maître / Jeu Compétitif Direct** | 100 % Local (Tier A/B) | Open Sage / WildBG 1-ply (2P) | Appareil avec WebGPU ou WASM SIMD | $15\text{ – }120\text{ ms}$ |
| **Ouvertures (Tours 1 à 3) & Bearoff** | Cache Local / Edge CDN | Opening Book & Bearoff DB | Clé canonique 20 octets trouvée | $< 1\text{ ms}$ (Local) / $15\text{ ms}$ (CDN) |
| **Post-Analyse — Coups Évidents** | 100 % Local (Pass 0 Client) | Open Sage 1-ply (2P) | $\Delta E_{1,2} > 0,050$ et coup joué $= a_{(1)}$ | $\sim 400\text{ ms}$ (match complet) |
| **Post-Analyse GM — Blunders & Coups Serrés** | Cloud Run CPU (bgsage-service) | Open Sage 3P $\to$ 3T (Rollout 7t) | $\Delta E_{1,2} \le 0,050$ ou $\Delta E_{\text{joueur}} \ge 0,008$ | $250\text{ – }900\text{ ms}$ (en lot) |
| **Vérité Terrain & Tuteur Pédagogique VIP** | Cloud Run GPU L4 / LLM | Full Rollout (Pass 3) + bgsage Game Plan + LLM | Demande explicite d'audit ou bouton « Expliquer mon erreur » | $1,5\text{ – }4,0\text{ s}$ (Stream LLM) |

---

## 6. Diagramme d'Architecture et Séquencement

### Schéma d'Architecture Hybride

```
+---------------------------------------------------------------------------------------+
| NAVIGATEUR CLIENT (PWA Web / Mobile)                                                  |
|                                                                                       |
|  [ Interface Utilisateur (React 19 / Canvas 2D / 60 FPS) ]                           |
|                         |                                                             |
|                         v                                                             |
|  [ Orchestrateur d'Inférence Hybride ]                                                |
|      |                                                                                |
|      +---> Palier 1 : ONNX Runtime Web (WebGPU FP16 + IO Binding)                     |
|      +---> Palier 2 : WASM SIMD128 + Multithreading (SharedArrayBuffer INT8 Q8)       |
|      +---> Palier 3 : WASM Mono-Worker Scalaire (WildBG / GnuBG 0-ply)                |
|      |                                                                                |
|      |  Filtre d'écart d'équité :                                                     |
|      |    Si ΔE(1,2) > 0.050 & coup optimal -> [ SETTLED_LOCAL (95% des coups) ]      |
|      |    Si ΔE(1,2) <= 0.050 ou erreur >= 0.008 -> Encodage bgsage-bin (20 octets)   |
+------|--------------------------------------------------------------------------------+
       |
       | HTTP/3 POST /v1/analyze-batch (Lot de 5-10 positions litigieuses)
       v
+---------------------------------------------------------------------------------------+
| GOOGLE CLOUD RUN (Région europe-west1 / us-central1)                                  |
|                                                                                       |
|  [ Proxy API & Normalisation Algébrique ] (concurrency = 80, 0.25 vCPU, 512 MiB)      |
|      |                                                                                |
|      +---> [ Cache L1 : Opening Book BGDB / .ob ] (Temps constant O(1) < 0.2 ms)      |
|      +---> [ Cache L2 : Redis LRU 2M entrées / Cloud CDN ] (Hit ~50-70%)              |
|      |                                                                                |
|      +---> Cache Miss : Transfert interne                                             |
|             |                                                                         |
|             v                                                                         |
|  [ Worker de Calcul C++ bgsage-service ] (concurrency = 2, 2 vCPU AVX2, 1 GiB)       |
|      - Pass 1 : Open Sage 3-ply (Sage 3P)                                             |
|      - Pass 2 : Rollout Tronqué 7 tours (Sage 3T) si ΔE(1,2) <= 0.020                 |
|             |                                                                         |
|             v (En cas de demande explicite VIP / Tuteur)                              |
|  [ Pool GPU NVIDIA L4 Serverless ] (scale-to-zero, min-instances = 0)                 |
|      - Pass 3 : Full Rollouts (20 736 trajectoires)                                   |
|      - Synthèse Pédagogique LLM (bgsage Game Plan structuré -> LLM en streaming)      |
+---------------------------------------------------------------------------------------+
```

### Séquencement Optimistic UI du Performance Rating (PR)

1. **$t_0 + 300\text{ ms}$ (Phase 1 - Évaluation Optimiste Locale)** :
   Le pool de Workers local évalue le match complet en 1-ply (Sage 2P). L'UI affiche immédiatement un PR estimé provisoire et le graphe d'équité avec indicateur « Certification GM en cours ».
2. **$t_0 + 350\text{ ms}$ (Phase 2 - Filtrage Différentiel)** :
   Sélection des 5 à 10 coups litigieux ($\Delta E \ge 0,008$ ou écart $\le 0,050$). Encodage bgsage-bin (200 octets).
3. **$t_0 + 400\text{ ms} \dots 1\,100\text{ ms}$ (Phase 3 - Résolution Cloud Run 3P/3T)** :
   Le proxy Cloud Run résout le lot (Cache hits + inférence C++ AVX2 pour les cache misses).
4. **$t_0 + 1\,200\text{ ms}$ (Phase 4 - Réconciliation Atomique du PR)** :
   Remplacement des équités provisoires par les équités 3-ply/3T certifiées, recalcul du PR officiel, mise à jour fluide de l'UI et écriture dans le cache IndexedDB/OPFS client.

---

## 7. Synthèse des Recommandations d'Implémentation

1. **Standardisation Client sur Double Modèle Quantifié** :
   - Modèle léger : **WildBG INT8 Q8 (~182 Ko)** pour compatibilité universelle et jeu hors-ligne 0 ms.
   - Modèle profond : **Open Sage 4 couches INT8 Q8 (551 Ko) / FP16 (1,1 Mo)** via ONNX Runtime Web (WebGPU Tier A / WASM SIMD128 Tier B).
2. **Ségrégation Stricte CPU vs GPU sur Google Cloud Run** :
   - `bgsage-service` (3-ply et rollouts tronqués 3T) déployé sur **instances CPU AVX2 pures** (2 vCPU, 1 GiB, min-instances = 1 à ~$49/mois).
   - Les instances **GPU NVIDIA L4** sont maintenues à `min-instances = 0` et réservées aux rollouts de vérité terrain et au pipeline LLM.
3. **Optimisation FinOps par Protocole Binaire & Caches** :
   - Format `bgsage-bin` (20 octets requête / 144 octets réponse) réduisant de 93% l'egress Cloud.
   - Caches Opening Book + Redis LRU + seuil d'écart d'équité $\tau = 0,050$ ramenant le **TCO d'infrastructure à 120,44 $/mois pour 1 000 000 de MAU (0,0001 $ / MAU)** avec une précision analytique équivalente à XG Roller++.
