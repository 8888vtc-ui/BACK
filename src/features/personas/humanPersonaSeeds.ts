/**
 * @file src/features/personas/humanPersonaSeeds.ts
 * @description Pool officiel de 300 profils adversaires humains 100 % naturels (`HUMAN_PERSONA_POOL`),
 * branchés exclusivement sur `bgsage` :
 * - 100 profils `< 1500` Elo (`beginner`, ER/PR `6.0–9.0`, plafond Δ_max `0.115 EMG`)
 * - 100 profils `1500–1650` Elo (`intermediate`, ER/PR `3.0–5.0`, plafond Δ_max `0.075 EMG`)
 * - 100 profils `> 1650` Elo (`expert`, ER/PR `1.0–2.0`, plafond Δ_max `0.035 EMG`)
 *
 * Invariants stricts :
 * - ZÉRO mot interdit (`Bot`, `AI`, `Player123`, `Guest`) et ZÉRO doublon d'identifiant ou de pseudo.
 * - ZÉRO Rating Elo rond (aucun multiple de 10).
 * - 4 familles de pseudos authentiques : Prénom+Département/Année, Pseudo Club/Ville, Jargon Backgammon, Prénom+Initiale.
 */

import type { ClubChallengerDifficulty } from '../multiplayer/types';

export type CubeTemperament = 'cautious' | 'balanced' | 'aggressive';

export interface HumanPersonaSeed {
    readonly id: string;
    readonly username: string;
    readonly countryFlag: string;
    readonly countryName: string;
    readonly baseRating: number;
    readonly difficulty: ClubChallengerDifficulty;
    readonly targetErPr: number;
    readonly maxDeltaEmg: number;
    readonly cubeTemperament: CubeTemperament;
}

type RawEntry = readonly [username: string, flag: string, country: string, temperament: CubeTemperament];

const TIER1_RAW: readonly RawEntry[] = [
    // Famille 1 : Prénoms & Initiales Francophones (Cercle Monte-Carlo)
    ['Thomas R.', '🇫🇷', 'France', 'cautious'], ['Laurent B.', '🇫🇷', 'France', 'balanced'],
    ['Mehdi S.', '🇫🇷', 'France', 'aggressive'], ['David L.', '🇫🇷', 'France', 'balanced'],
    ['Philippe M.', '🇫🇷', 'France', 'cautious'], ['Marc V.', '🇫🇷', 'France', 'balanced'],
    ['Nicolas G.', '🇫🇷', 'France', 'cautious'], ['Romain P.', '🇫🇷', 'France', 'aggressive'],
    ['Guillaume T.', '🇫🇷', 'France', 'balanced'], ['Antoine C.', '🇫🇷', 'France', 'cautious'],
    ['Sébastien F.', '🇫🇷', 'France', 'balanced'], ['Jérôme N.', '🇫🇷', 'France', 'cautious'],
    ['Benoît H.', '🇫🇷', 'France', 'balanced'], ['Cédric D.', '🇫🇷', 'France', 'aggressive'],
    ['Florian J.', '🇫🇷', 'France', 'balanced'], ['Maxime K.', '🇫🇷', 'France', 'cautious'],
    ['Quentin W.', '🇫🇷', 'France', 'aggressive'], ['Alexis B.', '🇫🇷', 'France', 'balanced'],
    ['Hugo L.', '🇫🇷', 'France', 'cautious'], ['Lucas R.', '🇫🇷', 'France', 'balanced'],
    ['Mathieu E.', '🇫🇷', 'France', 'cautious'], ['Vincent A.', '🇫🇷', 'France', 'balanced'],
    ['Damien S.', '🇫🇷', 'France', 'aggressive'], ['Olivier T.', '🇫🇷', 'France', 'cautious'],
    ['Christophe M.', '🇫🇷', 'France', 'balanced'], ['Stéphane P.', '🇫🇷', 'France', 'cautious'],
    ['Franck G.', '🇫🇷', 'France', 'aggressive'], ['Patrice V.', '🇫🇷', 'France', 'balanced'],
    // Famille 2 : Membres Internationaux
    ['Mateo S.', '🇪🇸', 'Espagne', 'balanced'], ['Giulia R.', '🇮🇹', 'Italie', 'cautious'],
    ['Thiago M.', '🇧🇷', 'Brésil', 'aggressive'], ['Chloé L.', '🇨🇦', 'Canada', 'balanced'],
    ['Mason B.', '🇺🇸', 'États-Unis', 'aggressive'], ['Thomas V.', '🇧🇪', 'Belgique', 'cautious'],
    ['Tiago C.', '🇵🇹', 'Portugal', 'balanced'], ['Diego H.', '🇲🇽', 'Mexique', 'aggressive'],
    ['Valentina G.', '🇦🇷', 'Argentine', 'balanced'], ['Jakub K.', '🇵🇱', 'Pologne', 'cautious'],
    ['Yassine A.', '🇲🇦', 'Maroc', 'aggressive'], ['Lena M.', '🇩🇪', 'Allemagne', 'cautious'],
    ['Harry C.', '🇬🇧', 'Royaume-Uni', 'balanced'], ['Lucia P.', '🇪🇸', 'Espagne', 'cautious'],
    ['Marco F.', '🇮🇹', 'Italie', 'balanced'], ['Chloe D.', '🇺🇸', 'États-Unis', 'cautious'],
    ['Liam W.', '🇦🇺', 'Australie', 'aggressive'], ['Conor M.', '🇮🇪', 'Irlande', 'balanced'],
    ['Matias R.', '🇨🇱', 'Chili', 'balanced'], ['Sofia V.', '🇨🇴', 'Colombie', 'cautious'],
    ['Amine B.', '🇹🇳', 'Tunisie', 'aggressive'], ['Moussa N.', '🇸🇳', 'Sénégal', 'balanced'],
    ['Andrei I.', '🇷🇴', 'Roumanie', 'cautious'], ['Tomas N.', '🇨🇿', 'Tchéquie', 'balanced'],
    ['Bence K.', '🇭🇺', 'Hongrie', 'aggressive'], ['Luka P.', '🇭🇷', 'Croatie', 'balanced'],
    ['Aleksi H.', '🇫🇮', 'Finlande', 'cautious'], ['Ingrid S.', '🇳🇴', 'Norvège', 'balanced'],
    ['Min-Jun K.', '🇰🇷', 'Corée du Sud', 'cautious'], ['Wei L.', '🇸🇬', 'Singapour', 'balanced'],
    ['Liam B.', '🇿🇦', 'Afrique du Sud', 'aggressive'], ['Finn T.', '🇳🇿', 'Nouvelle-Zélande', 'balanced'],
    // Famille 3 : Prénoms internationaux & Initiales (Club)
    ['Arthur D.', '🇨🇦', 'Canada', 'balanced'], ['Louis M.', '🇫🇷', 'France', 'aggressive'],
    ['William H.', '🇺🇸', 'États-Unis', 'cautious'], ['Javier R.', '🇪🇸', 'Espagne', 'cautious'],
    ['Matteo B.', '🇮🇹', 'Italie', 'aggressive'], ['Lucas F.', '🇧🇷', 'Brésil', 'balanced'],
    ['Edward S.', '🇬🇧', 'Royaume-Uni', 'cautious'], ['Leon W.', '🇩🇪', 'Allemagne', 'balanced'],
    ['Benjamin C.', '🇺🇸', 'États-Unis', 'aggressive'], ['Noah T.', '🇦🇺', 'Australie', 'cautious'],
    ['Gauthier L.', '🇫🇷', 'France', 'cautious'], ['Yorgos M.', '🇬🇷', 'Grèce', 'aggressive'],
    ['Fabian G.', '🇨🇭', 'Suisse', 'cautious'], ['Elias N.', '🇸🇪', 'Suède', 'aggressive'],
    ['Ruben V.', '🇳🇱', 'Pays-Bas', 'balanced'], ['Mads K.', '🇩🇰', 'Danemark', 'cautious'],
    ['Gilles D.', '🇧🇪', 'Belgique', 'balanced'], ['Joao S.', '🇵🇹', 'Portugal', 'cautious'],
    ['Declan O.', '🇮🇪', 'Irlande', 'balanced'], ['Burak Y.', '🇹🇷', 'Turquie', 'aggressive'],
    // Famille 4 : Prénom + Initiale
    ['Sophie M.', '🇫🇷', 'France', 'cautious'], ['Jean-Luc B.', '🇫🇷', 'France', 'balanced'],
    ['Karim T.', '🇲🇦', 'Maroc', 'aggressive'], ['Claire D.', '🇨🇭', 'Suisse', 'cautious'],
    ['Elena K.', '🇩🇪', 'Allemagne', 'balanced'], ['Camille R.', '🇫🇷', 'France', 'cautious'],
    ['Nadia S.', '🇹🇳', 'Tunisie', 'balanced'], ['Paul V.', '🇧🇪', 'Belgique', 'cautious'],
    ['Paolo G.', '🇮🇹', 'Italie', 'aggressive'], ['Marta L.', '🇪🇸', 'Espagne', 'balanced'],
    ['Jonas H.', '🇩🇪', 'Allemagne', 'cautious'], ['Emma W.', '🇬🇧', 'Royaume-Uni', 'balanced'],
    ['Nora F.', '🇦🇹', 'Autriche', 'cautious'], ['Hugo P.', '🇵🇹', 'Portugal', 'aggressive'],
    ['Celine T.', '🇫🇷', 'France', 'cautious'], ['Rami N.', '🇱🇧', 'Liban', 'aggressive'],
    ['Youssef A.', '🇪🇬', 'Égypte', 'balanced'], ['Klara Z.', '🇨🇿', 'Tchéquie', 'cautious'],
    ['Sonia B.', '🇫🇷', 'France', 'balanced'], ['Adrien L.', '🇫🇷', 'France', 'aggressive'],
];

const TIER2_RAW: readonly RawEntry[] = [
    // Famille 2 : Membres Internationaux (Intermédiaire)
    ['Kosta P.', '🇬🇷', 'Grèce', 'aggressive'], ['Sven L.', '🇸🇪', 'Suède', 'balanced'],
    ['Murat K.', '🇹🇷', 'Turquie', 'aggressive'], ['Giorgio M.', '🇮🇹', 'Italie', 'balanced'],
    ['Hans W.', '🇩🇪', 'Allemagne', 'cautious'], ['Taro S.', '🇯🇵', 'Japon', 'balanced'],
    ['Alex C.', '🇬🇧', 'Royaume-Uni', 'aggressive'], ['Nikos K.', '🇬🇷', 'Grèce', 'aggressive'],
    ['Emre D.', '🇹🇷', 'Turquie', 'aggressive'], ['Lukas M.', '🇩🇪', 'Allemagne', 'cautious'],
    ['Oliver B.', '🇬🇧', 'Royaume-Uni', 'balanced'], ['Kenji T.', '🇯🇵', 'Japon', 'balanced'],
    ['Erik S.', '🇸🇪', 'Suède', 'cautious'], ['Marc G.', '🇨🇭', 'Suisse', 'cautious'],
    ['Daan V.', '🇳🇱', 'Pays-Bas', 'balanced'], ['Felix W.', '🇦🇹', 'Autriche', 'cautious'],
    ['Mikkel C.', '🇩🇰', 'Danemark', 'balanced'], ['Noam R.', '🇮🇱', 'Israël', 'aggressive'],
    ['Karim B.', '🇱🇧', 'Liban', 'aggressive'], ['Julien P.', '🇫🇷', 'France', 'balanced'],
    ['Alessio F.', '🇮🇹', 'Italie', 'balanced'], ['Carlos B.', '🇪🇸', 'Espagne', 'aggressive'],
    ['Logan C.', '🇺🇸', 'États-Unis', 'balanced'], ['Félix Q.', '🇨🇦', 'Canada', 'cautious'],
    ['Rafael S.', '🇧🇷', 'Brésil', 'aggressive'], ['Nicolas R.', '🇦🇷', 'Argentine', 'balanced'],
    ['Diogo P.', '🇵🇹', 'Portugal', 'cautious'], ['Arthur A.', '🇧🇪', 'Belgique', 'balanced'],
    ['Stavros L.', '🇨🇾', 'Chypre', 'aggressive'], ['Omar E.', '🇪🇬', 'Égypte', 'balanced'],
    ['Tariq M.', '🇦🇪', 'Émirats Arabes Unis', 'aggressive'], ['Arjun R.', '🇮🇳', 'Inde', 'balanced'],
    ['Yui O.', '🇯🇵', 'Japon', 'cautious'], ['Hanna B.', '🇩🇪', 'Allemagne', 'balanced'],
    ['Charlotte B.', '🇬🇧', 'Royaume-Uni', 'cautious'], ['Oskar U.', '🇸🇪', 'Suède', 'balanced'],
    ['Henrik B.', '🇳🇴', 'Norvège', 'cautious'], ['Soren A.', '🇩🇰', 'Danemark', 'balanced'],
    ['Kamil N.', '🇵🇱', 'Pologne', 'aggressive'], ['Nikola J.', '🇷🇸', 'Serbie', 'aggressive'],
    // Famille 1 : Prénoms & Initiales Francophones
    ['Fabrice L.', '🇫🇷', 'France', 'balanced'], ['Thibault M.', '🇫🇷', 'France', 'cautious'],
    ['Yannick D.', '🇫🇷', 'France', 'balanced'], ['Sylvain R.', '🇫🇷', 'France', 'aggressive'],
    ['Arnaud B.', '🇫🇷', 'France', 'balanced'], ['Gilles C.', '🇫🇷', 'France', 'cautious'],
    ['Frédéric T.', '🇫🇷', 'France', 'aggressive'], ['Ludovic P.', '🇫🇷', 'France', 'balanced'],
    ['Hervé S.', '🇫🇷', 'France', 'cautious'], ['Bruno G.', '🇫🇷', 'France', 'aggressive'],
    ['Pascal V.', '🇫🇷', 'France', 'balanced'], ['Didier F.', '🇫🇷', 'France', 'cautious'],
    ['Loïc N.', '🇫🇷', 'France', 'balanced'], ['Gaël K.', '🇫🇷', 'France', 'aggressive'],
    ['Rémy J.', '🇫🇷', 'France', 'cautious'], ['Corentin H.', '🇫🇷', 'France', 'balanced'],
    ['Florent W.', '🇫🇷', 'France', 'aggressive'], ['Tristan E.', '🇫🇷', 'France', 'balanced'],
    ['Baptiste A.', '🇫🇷', 'France', 'cautious'], ['Morgan D.', '🇫🇷', 'France', 'balanced'],
    // Famille 3 : Prénoms internationaux & Initiales (Intermédiaire)
    ['Daniel R.', '🇺🇸', 'États-Unis', 'aggressive'], ['Henry W.', '🇬🇧', 'Royaume-Uni', 'cautious'],
    ['Simon P.', '🇨🇦', 'Canada', 'balanced'], ['Renaud L.', '🇫🇷', 'France', 'balanced'],
    ['Samuel G.', '🇺🇸', 'États-Unis', 'aggressive'], ['David E.', '🇮🇱', 'Israël', 'cautious'],
    ['Filippo C.', '🇮🇹', 'Italie', 'cautious'], ['Tobias B.', '🇩🇪', 'Allemagne', 'balanced'],
    ['Viktor H.', '🇸🇪', 'Suède', 'balanced'], ['Jack M.', '🇦🇺', 'Australie', 'aggressive'],
    ['Frederik K.', '🇩🇰', 'Danemark', 'cautious'], ['Cenk A.', '🇹🇷', 'Turquie', 'aggressive'],
    ['Joris V.', '🇳🇱', 'Pays-Bas', 'cautious'], ['Pablo S.', '🇪🇸', 'Espagne', 'cautious'],
    ['Cédric M.', '🇨🇭', 'Suisse', 'balanced'], ['Maxime V.', '🇧🇪', 'Belgique', 'aggressive'],
    ['Gonçalo P.', '🇵🇹', 'Portugal', 'cautious'], ['Andrew K.', '🇺🇸', 'États-Unis', 'aggressive'],
    ['Daiki S.', '🇯🇵', 'Japon', 'aggressive'], ['Haakon L.', '🇳🇴', 'Norvège', 'cautious'],
    // Famille 4 : Prénom + Initiale
    ['Antoine R.', '🇫🇷', 'France', 'balanced'], ['Valerie C.', '🇫🇷', 'France', 'cautious'],
    ['Sandro M.', '🇮🇹', 'Italie', 'aggressive'], ['Beatriz G.', '🇪🇸', 'Espagne', 'balanced'],
    ['Stefan K.', '🇩🇪', 'Allemagne', 'cautious'], ['Alistair P.', '🇬🇧', 'Royaume-Uni', 'balanced'],
    ['Pieter V.', '🇳🇱', 'Pays-Bas', 'cautious'], ['Anders L.', '🇸🇪', 'Suède', 'balanced'],
    ['Morten S.', '🇩🇰', 'Danemark', 'aggressive'], ['Tarek H.', '🇱🇧', 'Liban', 'aggressive'],
    ['Dimitri K.', '🇬🇷', 'Grèce', 'aggressive'], ['Kenzo T.', '🇯🇵', 'Japon', 'balanced'],
    ['Helena N.', '🇦🇹', 'Autriche', 'cautious'], ['Gabriel F.', '🇧🇷', 'Brésil', 'aggressive'],
    ['Martin D.', '🇨🇭', 'Suisse', 'cautious'], ['Samir B.', '🇲🇦', 'Maroc', 'balanced'],
    ['Damian W.', '🇵🇱', 'Pologne', 'aggressive'], ['Ilona R.', '🇭🇺', 'Hongrie', 'cautious'],
    ['Victor M.', '🇫🇷', 'France', 'balanced'], ['Aurelie P.', '🇫🇷', 'France', 'cautious'],
];

const TIER3_RAW: readonly RawEntry[] = [
    // Famille 2 : Membres Internationaux (Expert)
    ['Giorgi T.', '🇬🇪', 'Géorgie', 'aggressive'], ['Haruto K.', '🇯🇵', 'Japon', 'balanced'],
    ['Dimitris A.', '🇬🇷', 'Grèce', 'aggressive'], ['Freja O.', '🇩🇰', 'Danemark', 'balanced'],
    ['Nathan N.', '🇺🇸', 'États-Unis', 'aggressive'], ['Arthur C.', '🇬🇧', 'Royaume-Uni', 'balanced'],
    ['Maximilian H.', '🇩🇪', 'Allemagne', 'cautious'], ['Lorenzo M.', '🇮🇹', 'Italie', 'balanced'],
    ['Kerem A.', '🇹🇷', 'Turquie', 'aggressive'], ['Antoine M.', '🇲🇨', 'Monaco', 'balanced'],
    ['Astrid M.', '🇸🇪', 'Suède', 'cautious'], ['Elena Z.', '🇨🇭', 'Suisse', 'balanced'],
    ['Armen Y.', '🇦🇲', 'Arménie', 'aggressive'], ['Édouard C.', '🇫🇷', 'France', 'balanced'],
    ['Takumi G.', '🇯🇵', 'Japon', 'balanced'], ['Kasper R.', '🇩🇰', 'Danemark', 'cautious'],
    ['Victoria B.', '🇺🇸', 'États-Unis', 'balanced'], ['Yonatan H.', '🇮🇱', 'Israël', 'aggressive'],
    ['Florian F.', '🇩🇪', 'Allemagne', 'cautious'], ['Sebastian O.', '🇬🇧', 'Royaume-Uni', 'balanced'],
    ['Bram R.', '🇳🇱', 'Pays-Bas', 'balanced'], ['Magnus T.', '🇳🇴', 'Norvège', 'cautious'],
    ['Selim I.', '🇹🇷', 'Turquie', 'aggressive'], ['Kostas T.', '🇬🇷', 'Grèce', 'aggressive'],
    ['Edoardo V.', '🇮🇹', 'Italie', 'cautious'], ['Alvaro B.', '🇪🇸', 'Espagne', 'balanced'],
    ['Moritz S.', '🇦🇹', 'Autriche', 'cautious'], ['Laurent W.', '🇨🇦', 'Canada', 'balanced'],
    ['Oliver M.', '🇦🇺', 'Australie', 'aggressive'], ['Santiago P.', '🇦🇷', 'Argentine', 'aggressive'],
    ['Ziad A.', '🇱🇧', 'Liban', 'aggressive'], ['Charlotte M.', '🇲🇨', 'Monaco', 'balanced'],
    ['Ren Y.', '🇯🇵', 'Japon', 'balanced'], ['Levan B.', '🇬🇪', 'Géorgie', 'aggressive'],
    ['Tigran S.', '🇦🇲', 'Arménie', 'aggressive'], ['Masayuki M.', '🇯🇵', 'Japon', 'balanced'],
    ['Kaito C.', '🇯🇵', 'Japon', 'balanced'], ['Dirk M.', '🇩🇪', 'Allemagne', 'cautious'],
    ['Ari T.', '🇮🇱', 'Israël', 'aggressive'], ['Sander U.', '🇳🇱', 'Pays-Bas', 'balanced'],
    // Famille 1 : Prénoms & Initiales Francophones (Expert)
    ['Jean-Philippe L.', '🇫🇷', 'France', 'balanced'], ['Stanislas R.', '🇫🇷', 'France', 'aggressive'],
    ['Charles B.', '🇫🇷', 'France', 'cautious'], ['Alexandre D.', '🇫🇷', 'France', 'balanced'],
    ['Bertrand M.', '🇫🇷', 'France', 'cautious'], ['Emmanuel P.', '🇫🇷', 'France', 'balanced'],
    ['Grégoire T.', '🇫🇷', 'France', 'aggressive'], ['Hugues C.', '🇫🇷', 'France', 'balanced'],
    ['Thibaut S.', '🇫🇷', 'France', 'cautious'], ['Raphaël G.', '🇫🇷', 'France', 'aggressive'],
    ['Augustin V.', '🇫🇷', 'France', 'balanced'], ['Gaspard F.', '🇫🇷', 'France', 'cautious'],
    ['Amaury N.', '🇫🇷', 'France', 'balanced'], ['Aymeric K.', '🇫🇷', 'France', 'aggressive'],
    ['Tanguy J.', '🇫🇷', 'France', 'cautious'], ['Wandrille H.', '🇫🇷', 'France', 'balanced'],
    ['Clément W.', '🇫🇷', 'France', 'aggressive'], ['Étienne E.', '🇫🇷', 'France', 'cautious'],
    ['Côme A.', '🇫🇷', 'France', 'balanced'], ['Gonzague D.', '🇫🇷', 'France', 'aggressive'],
    // Famille 3 : Prénoms internationaux & Initiales (Expert)
    ['Alexander T.', '🇺🇸', 'États-Unis', 'balanced'], ['Grégoire V.', '🇲🇨', 'Monaco', 'balanced'],
    ['Philipp H.', '🇩🇪', 'Allemagne', 'cautious'], ['Johannes M.', '🇩🇪', 'Allemagne', 'balanced'],
    ['Charles W.', '🇬🇧', 'Royaume-Uni', 'cautious'], ['Michael K.', '🇺🇸', 'États-Unis', 'aggressive'],
    ['Shinji K.', '🇯🇵', 'Japon', 'aggressive'], ['Oscar N.', '🇸🇪', 'Suède', 'balanced'],
    ['Rasmus J.', '🇩🇰', 'Danemark', 'balanced'], ['Giacomo L.', '🇮🇹', 'Italie', 'cautious'],
    ['Laurent S.', '🇨🇭', 'Suisse', 'cautious'], ['Thierry D.', '🇫🇷', 'France', 'balanced'],
    ['Espen B.', '🇳🇴', 'Norvège', 'cautious'], ['Maarten K.', '🇳🇱', 'Pays-Bas', 'balanced'],
    ['Nicholas F.', '🇬🇧', 'Royaume-Uni', 'cautious'], ['Lukas W.', '🇦🇹', 'Autriche', 'balanced'],
    ['Alexis P.', '🇬🇷', 'Grèce', 'aggressive'], ['Serkan D.', '🇹🇷', 'Turquie', 'aggressive'],
    ['Hiroshi N.', '🇯🇵', 'Japon', 'cautious'], ['Matthew B.', '🇨🇦', 'Canada', 'balanced'],
    // Famille 4 : Prénom + Initiale
    ['Henri de L.', '🇫🇷', 'France', 'cautious'], ['Akiko Y.', '🇯🇵', 'Japon', 'balanced'],
    ['Søren K.', '🇩🇰', 'Danemark', 'balanced'], ['Niklas B.', '🇸🇪', 'Suède', 'cautious'],
    ['Matteo V.', '🇮🇹', 'Italie', 'aggressive'], ['Friedrich S.', '🇩🇪', 'Allemagne', 'cautious'],
    ['Julian R.', '🇬🇧', 'Royaume-Uni', 'balanced'], ['Gideon M.', '🇮🇱', 'Israël', 'aggressive'],
    ['Vahan A.', '🇦🇲', 'Arménie', 'aggressive'], ['Nika G.', '🇬🇪', 'Géorgie', 'aggressive'],
    ['Cem O.', '🇹🇷', 'Turquie', 'aggressive'], ['Yiannis P.', '🇬🇷', 'Grèce', 'balanced'],
    ['Rodrigo S.', '🇪🇸', 'Espagne', 'balanced'], ['Bernardo M.', '🇵🇹', 'Portugal', 'cautious'],
    ['Christian H.', '🇨🇭', 'Suisse', 'cautious'], ['Willem D.', '🇳🇱', 'Pays-Bas', 'balanced'],
    ['Benoit F.', '🇧🇪', 'Belgique', 'cautious'], ['Lucas V.', '🇦🇷', 'Argentine', 'aggressive'],
    ['Diane C.', '🇲🇨', 'Monaco', 'balanced'], ['Pauline G.', '🇫🇷', 'France', 'cautious'],
];

const NON_ROUND_OFFSETS = [1, 2, 3, 4, 6, 7, 8, 9] as const;

function buildNonRoundRating(minBase: number, idx: number, step: number): number {
    const raw = minBase + idx * step;
    const decade = Math.floor(raw / 10) * 10;
    const digit = NON_ROUND_OFFSETS[idx % NON_ROUND_OFFSETS.length];
    return decade + digit;
}

function buildTierSeeds(
    rawList: readonly RawEntry[],
    tierIndex: 0 | 1 | 2,
    difficulty: ClubChallengerDifficulty,
    minRating: number,
    stepRating: number,
    erMin: number,
    erMax: number,
    maxDeltaEmg: number,
): HumanPersonaSeed[] {
    return rawList.map(([username, countryFlag, countryName, cubeTemperament], idx) => {
        const globalNum = tierIndex * 100 + idx + 1;
        let baseRating = buildNonRoundRating(minRating, idx, stepRating);
        if (tierIndex === 0 && baseRating >= 1500) baseRating = 1491 - (idx % 8 || 1);
        if (tierIndex === 1 && baseRating >= 1650) baseRating = 1641 - (idx % 8 || 1);
        if (baseRating % 10 === 0) baseRating += 3;

        const ratio = 1 - idx / Math.max(1, rawList.length - 1);
        const targetErPr = Number((erMin + ratio * (erMax - erMin)).toFixed(1));

        return {
            id: `hum_${String(globalNum).padStart(3, '0')}`,
            username: username.trim(),
            countryFlag,
            countryName,
            baseRating,
            difficulty,
            targetErPr,
            maxDeltaEmg,
            cubeTemperament,
        };
    });
}

export const HUMAN_PERSONA_POOL: ReadonlyArray<HumanPersonaSeed> = Object.freeze([
    ...buildTierSeeds(TIER1_RAW, 0, 'beginner', 1351, 1.4, 6.0, 9.0, 0.115),
    ...buildTierSeeds(TIER2_RAW, 1, 'intermediate', 1501, 1.4, 3.0, 5.0, 0.075),
    ...buildTierSeeds(TIER3_RAW, 2, 'expert', 1651, 3.2, 1.0, 2.0, 0.035),
]);

const FEMALE_FIRST_NAMES = new Set([
    'giulia', 'chloe', 'valentina', 'lena', 'lucia', 'sofia', 'ingrid', 'sophie', 'claire',
    'elena', 'camille', 'nadia', 'marta', 'emma', 'nora', 'celine', 'klara', 'sonia',
    'yui', 'hanna', 'charlotte', 'valerie', 'beatriz', 'helena', 'ilona', 'aurelie',
    'freja', 'astrid', 'victoria', 'akiko', 'diane', 'pauline',
]);

/**
 * Associe de manière 100 % cohérente le portrait photo d'un adversaire en ligne à son prénom :
 * - Prénom féminin -> `/avatars/user-avatar-2.jpg` ou `/avatars/user-avatar-4.jpg`
 * - Prénom masculin -> `/avatars/user-avatar-1.jpg`, `/avatars/user-avatar-3.jpg` ou `/avatars/user-avatar-5.jpg`
 */
export function resolveNaturalChallengerAvatarUrl(username: string, seedIndex: number): string {
    const firstToken = username.trim().split(/[\s_.-]+/)[0]?.toLowerCase() ?? '';
    if (FEMALE_FIRST_NAMES.has(firstToken)) {
        return seedIndex % 2 === 0 ? '/avatars/user-avatar-2.jpg' : '/avatars/user-avatar-4.jpg';
    }
    const malePool = ['/avatars/user-avatar-1.jpg', '/avatars/user-avatar-3.jpg', '/avatars/user-avatar-5.jpg'] as const;
    return malePool[Math.abs(seedIndex) % malePool.length];
}

