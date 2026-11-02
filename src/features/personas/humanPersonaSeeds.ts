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
    // Famille 1 : Prénom/Surnom + Département ou Année
    ['thomas_69', '🇫🇷', 'France', 'cautious'], ['laurent75', '🇫🇷', 'France', 'balanced'],
    ['mehdi_92', '🇫🇷', 'France', 'aggressive'], ['david_bg64', '🇫🇷', 'France', 'balanced'],
    ['philippe59', '🇫🇷', 'France', 'cautious'], ['marc_33', '🇫🇷', 'France', 'balanced'],
    ['nicolas_44', '🇫🇷', 'France', 'cautious'], ['romain_13', '🇫🇷', 'France', 'aggressive'],
    ['guillaume_31', '🇫🇷', 'France', 'balanced'], ['antoine_06', '🇫🇷', 'France', 'cautious'],
    ['sebastien_38', '🇫🇷', 'France', 'balanced'], ['jerome_67', '🇫🇷', 'France', 'cautious'],
    ['benoit_35', '🇫🇷', 'France', 'balanced'], ['cedric_83', '🇫🇷', 'France', 'aggressive'],
    ['florian_34', '🇫🇷', 'France', 'balanced'], ['maxime_54', '🇫🇷', 'France', 'cautious'],
    ['quentin_76', '🇫🇷', 'France', 'aggressive'], ['alexis_29', '🇫🇷', 'France', 'balanced'],
    ['hugo_74', '🇫🇷', 'France', 'cautious'], ['lucas_63', '🇫🇷', 'France', 'balanced'],
    ['mathieu_21', '🇫🇷', 'France', 'cautious'], ['vincent_37', '🇫🇷', 'France', 'balanced'],
    ['damien_49', '🇫🇷', 'France', 'aggressive'], ['olivier_17', '🇫🇷', 'France', 'cautious'],
    ['christophe78', '🇫🇷', 'France', 'balanced'], ['stephane_91', '🇫🇷', 'France', 'cautious'],
    ['franck_95', '🇫🇷', 'France', 'aggressive'], ['patrice_84', '🇫🇷', 'France', 'balanced'],
    // Famille 2 : Pseudo club / international crédible
    ['Mateo_Madrid', '🇪🇸', 'Espagne', 'balanced'], ['Giulia_Roma', '🇮🇹', 'Italie', 'cautious'],
    ['Thiago_Rio', '🇧🇷', 'Brésil', 'aggressive'], ['Chloe_Mtl', '🇨🇦', 'Canada', 'balanced'],
    ['Mason_Austin', '🇺🇸', 'États-Unis', 'aggressive'], ['Thomas_Bxl', '🇧🇪', 'Belgique', 'cautious'],
    ['Tiago_Lisboa', '🇵🇹', 'Portugal', 'balanced'], ['Diego_CDMX', '🇲🇽', 'Mexique', 'aggressive'],
    ['Valentina_BA', '🇦🇷', 'Argentine', 'balanced'], ['Jakub_Waw', '🇵🇱', 'Pologne', 'cautious'],
    ['Yassine_Casa', '🇲🇦', 'Maroc', 'aggressive'], ['Lena_Koeln', '🇩🇪', 'Allemagne', 'cautious'],
    ['Harry_Leeds', '🇬🇧', 'Royaume-Uni', 'balanced'], ['Lucia_Sevilla', '🇪🇸', 'Espagne', 'cautious'],
    ['Marco_Torino', '🇮🇹', 'Italie', 'balanced'], ['Chloe_Denver', '🇺🇸', 'États-Unis', 'cautious'],
    ['Liam_Sydney', '🇦🇺', 'Australie', 'aggressive'], ['Conor_Dublin', '🇮🇪', 'Irlande', 'balanced'],
    ['Matias_Stgo', '🇨🇱', 'Chili', 'balanced'], ['Sofia_Bogota', '🇨🇴', 'Colombie', 'cautious'],
    ['Amine_Tunis', '🇹🇳', 'Tunisie', 'aggressive'], ['Moussa_Dakar', '🇸🇳', 'Sénégal', 'balanced'],
    ['Andrei_Buc', '🇷🇴', 'Roumanie', 'cautious'], ['Tomas_Praha', '🇨🇿', 'Tchéquie', 'balanced'],
    ['Bence_Pest', '🇭🇺', 'Hongrie', 'aggressive'], ['Luka_Split', '🇭🇷', 'Croatie', 'balanced'],
    ['Aleksi_Hel', '🇫🇮', 'Finlande', 'cautious'], ['Ingrid_Oslo', '🇳🇴', 'Norvège', 'balanced'],
    ['MinJun_Seoul', '🇰🇷', 'Corée du Sud', 'cautious'], ['Wei_Marina', '🇸🇬', 'Singapour', 'balanced'],
    ['Liam_Cape', '🇿🇦', 'Afrique du Sud', 'aggressive'], ['Finn_Auckland', '🇳🇿', 'Nouvelle-Zélande', 'balanced'],
    // Famille 3 : Jargon Backgammon naturel
    ['PipMaster', '🇨🇦', 'Canada', 'balanced'], ['DoubleSix_FR', '🇫🇷', 'France', 'aggressive'],
    ['BackgameKing', '🇺🇸', 'États-Unis', 'cautious'], ['Anchor24', '🇪🇸', 'Espagne', 'cautious'],
    ['CubeHunter', '🇮🇹', 'Italie', 'aggressive'], ['PrimeBuilder', '🇧🇷', 'Brésil', 'balanced'],
    ['GoldenPoint5', '🇬🇧', 'Royaume-Uni', 'cautious'], ['BarPoint7', '🇩🇪', 'Allemagne', 'balanced'],
    ['HitAndCover', '🇺🇸', 'États-Unis', 'aggressive'], ['RunningPip', '🇦🇺', 'Australie', 'cautious'],
    ['DeepAnchor22', '🇫🇷', 'France', 'cautious'], ['TavliRoll', '🇬🇷', 'Grèce', 'aggressive'],
    ['GammonSaver', '🇨🇭', 'Suisse', 'cautious'], ['SlotAndMake', '🇸🇪', 'Suède', 'aggressive'],
    ['DuplicationX', '🇳🇱', 'Pays-Bas', 'balanced'], ['BearOffClean', '🇩🇰', 'Danemark', 'cautious'],
    ['SixPrimeWall', '🇧🇪', 'Belgique', 'balanced'], ['Split24_18', '🇵🇹', 'Portugal', 'cautious'],
    ['OuterBoardAce', '🇮🇪', 'Irlande', 'balanced'], ['TempoHit', '🇹🇷', 'Turquie', 'aggressive'],
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
    // Famille 2 : Pseudo club / international crédible
    ['Kosta_Ath', '🇬🇷', 'Grèce', 'aggressive'], ['SvenBG', '🇸🇪', 'Suède', 'balanced'],
    ['Murat_34', '🇹🇷', 'Turquie', 'aggressive'], ['Giorgio_Mi', '🇮🇹', 'Italie', 'balanced'],
    ['Hans_HH', '🇩🇪', 'Allemagne', 'cautious'], ['Taro_Tokyo', '🇯🇵', 'Japon', 'balanced'],
    ['Alex_Lon', '🇬🇧', 'Royaume-Uni', 'aggressive'], ['Nikos_Tavli', '🇬🇷', 'Grèce', 'aggressive'],
    ['Emre_Bosphorus', '🇹🇷', 'Turquie', 'aggressive'], ['Lukas_Munich', '🇩🇪', 'Allemagne', 'cautious'],
    ['Oliver_Mayfair', '🇬🇧', 'Royaume-Uni', 'balanced'], ['Kenji_Shibuya', '🇯🇵', 'Japon', 'balanced'],
    ['Erik_Stockholm', '🇸🇪', 'Suède', 'cautious'], ['Marc_Geneve', '🇨🇭', 'Suisse', 'cautious'],
    ['Daan_Amsterdam', '🇳🇱', 'Pays-Bas', 'balanced'], ['Felix_Wien', '🇦🇹', 'Autriche', 'cautious'],
    ['Mikkel_Cph', '🇩🇰', 'Danemark', 'balanced'], ['Noam_TelAviv', '🇮🇱', 'Israël', 'aggressive'],
    ['Karim_Beirut', '🇱🇧', 'Liban', 'aggressive'], ['Julien_Paris16', '🇫🇷', 'France', 'balanced'],
    ['Alessio_Firenze', '🇮🇹', 'Italie', 'balanced'], ['Carlos_BCN', '🇪🇸', 'Espagne', 'aggressive'],
    ['Logan_Chicago', '🇺🇸', 'États-Unis', 'balanced'], ['Felix_Quebec', '🇨🇦', 'Canada', 'cautious'],
    ['Rafael_SP', '🇧🇷', 'Brésil', 'aggressive'], ['Nicolas_Rosario', '🇦🇷', 'Argentine', 'balanced'],
    ['Diogo_Porto', '🇵🇹', 'Portugal', 'cautious'], ['Arthur_Anvers', '🇧🇪', 'Belgique', 'balanced'],
    ['Stavros_Limassol', '🇨🇾', 'Chypre', 'aggressive'], ['Omar_Alexandria', '🇪🇬', 'Égypte', 'balanced'],
    ['Tariq_Dubai', '🇦🇪', 'Émirats Arabes Unis', 'aggressive'], ['Arjun_Mumbai', '🇮🇳', 'Inde', 'balanced'],
    ['Yui_Osaka', '🇯🇵', 'Japon', 'cautious'], ['Hanna_Berlin', '🇩🇪', 'Allemagne', 'balanced'],
    ['Charlotte_Bath', '🇬🇧', 'Royaume-Uni', 'cautious'], ['Oskar_Uppsala', '🇸🇪', 'Suède', 'balanced'],
    ['Henrik_Bergen', '🇳🇴', 'Norvège', 'cautious'], ['Soren_Aarhus', '🇩🇰', 'Danemark', 'balanced'],
    ['Kamil_Krakow', '🇵🇱', 'Pologne', 'aggressive'], ['Nikola_Belgrade', '🇷🇸', 'Serbie', 'aggressive'],
    // Famille 1 : Prénom/Surnom + Département ou Année
    ['fabrice_69', '🇫🇷', 'France', 'balanced'], ['thibault_75', '🇫🇷', 'France', 'cautious'],
    ['yannick_44', '🇫🇷', 'France', 'balanced'], ['sylvain_31', '🇫🇷', 'France', 'aggressive'],
    ['arnaud_33', '🇫🇷', 'France', 'balanced'], ['gilles_06', '🇫🇷', 'France', 'cautious'],
    ['fred_92', '🇫🇷', 'France', 'aggressive'], ['ludovic_59', '🇫🇷', 'France', 'balanced'],
    ['herve_67', '🇫🇷', 'France', 'cautious'], ['bruno_13', '🇫🇷', 'France', 'aggressive'],
    ['pascal_78', '🇫🇷', 'France', 'balanced'], ['didier_38', '🇫🇷', 'France', 'cautious'],
    ['loic_35', '🇫🇷', 'France', 'balanced'], ['gael_29', '🇫🇷', 'France', 'aggressive'],
    ['remy_74', '🇫🇷', 'France', 'cautious'], ['corentin_63', '🇫🇷', 'France', 'balanced'],
    ['florent_83', '🇫🇷', 'France', 'aggressive'], ['tristan_34', '🇫🇷', 'France', 'balanced'],
    ['baptiste_49', '🇫🇷', 'France', 'cautious'], ['morgan_17', '🇫🇷', 'France', 'balanced'],
    // Famille 3 : Jargon Backgammon naturel
    ['BlitzOrPrime', '🇺🇸', 'États-Unis', 'aggressive'], ['BackgamePro', '🇬🇧', 'Royaume-Uni', 'cautious'],
    ['KeithCount', '🇨🇦', 'Canada', 'balanced'], ['JanowskiCube', '🇫🇷', 'France', 'balanced'],
    ['WoolseyLaw', '🇺🇸', 'États-Unis', 'aggressive'], ['MagrielSafe', '🇮🇱', 'Israël', 'cautious'],
    ['Point20Anchor', '🇮🇹', 'Italie', 'cautious'], ['FivePrimeLock', '🇩🇪', 'Allemagne', 'balanced'],
    ['CrawfordEdge', '🇸🇪', 'Suède', 'balanced'], ['BeaverCube', '🇦🇺', 'Australie', 'aggressive'],
    ['DeadCubePlay', '🇩🇰', 'Danemark', 'cautious'], ['ContactBlitz', '🇹🇷', 'Turquie', 'aggressive'],
    ['PureRacePip', '🇳🇱', 'Pays-Bas', 'cautious'], ['HoldingGame20', '🇪🇸', 'Espagne', 'cautious'],
    ['MidpointGuard', '🇨🇭', 'Suisse', 'balanced'], ['BuilderSlot', '🇧🇪', 'Belgique', 'aggressive'],
    ['EscapeRunner', '🇵🇹', 'Portugal', 'cautious'], ['Recube Vig', '🇺🇸', 'États-Unis', 'aggressive'],
    ['DoubleTiger', '🇯🇵', 'Japon', 'aggressive'], ['QuietAnchor', '🇳🇴', 'Norvège', 'cautious'],
    // Famille 4 : Prénom + Initiale
    ['Antoine R.', '🇫🇷', 'France', 'balanced'], ['Valerie C.', '🇫🇷', 'France', 'cautious'],
    ['Sandro M.', '🇮🇹', 'Italie', 'aggressive'], ['beatriz G.', '🇪🇸', 'Espagne', 'balanced'],
    ['Stefan K.', '🇩🇪', 'Allemagne', 'cautious'], ['Alistair P.', '🇬🇧', 'Royaume-Uni', 'balanced'],
    ['pieter V.', '🇳🇱', 'Pays-Bas', 'cautious'], ['Anders L.', '🇸🇪', 'Suède', 'balanced'],
    ['Morten S.', '🇩🇰', 'Danemark', 'aggressive'], ['Tarek H.', '🇱🇧', 'Liban', 'aggressive'],
    ['Dimitri K.', '🇬🇷', 'Grèce', 'aggressive'], ['Kenzo T.', '🇯🇵', 'Japon', 'balanced'],
    ['helena N.', '🇦🇹', 'Autriche', 'cautious'], ['Gabriel F.', '🇧🇷', 'Brésil', 'aggressive'],
    ['Martin D.', '🇨🇭', 'Suisse', 'cautious'], ['Samir B.', '🇲🇦', 'Maroc', 'balanced'],
    ['Damian W.', '🇵🇱', 'Pologne', 'aggressive'], ['Ilona R.', '🇭🇺', 'Hongrie', 'cautious'],
    ['Victor M.', '🇫🇷', 'France', 'balanced'], ['Aurelie P.', '🇫🇷', 'France', 'cautious'],
];

const TIER3_RAW: readonly RawEntry[] = [
    // Famille 2 : Pseudo club / international crédible
    ['Giorgi_Tbilisi', '🇬🇪', 'Géorgie', 'aggressive'], ['Haruto_Kyoto', '🇯🇵', 'Japon', 'balanced'],
    ['Dimitris_Ath', '🇬🇷', 'Grèce', 'aggressive'], ['Freja_Odense', '🇩🇰', 'Danemark', 'balanced'],
    ['Nathan_NYC', '🇺🇸', 'États-Unis', 'aggressive'], ['Arthur_Chelsea', '🇬🇧', 'Royaume-Uni', 'balanced'],
    ['Maximilian_HH', '🇩🇪', 'Allemagne', 'cautious'], ['Lorenzo_Milano', '🇮🇹', 'Italie', 'balanced'],
    ['Kerem_Ankara', '🇹🇷', 'Turquie', 'aggressive'], ['Antoine_MC', '🇲🇨', 'Monaco', 'balanced'],
    ['Astrid_Malmo', '🇸🇪', 'Suède', 'cautious'], ['Elena_Zurich', '🇨🇭', 'Suisse', 'balanced'],
    ['Armen_Yerevan', '🇦🇲', 'Arménie', 'aggressive'], ['Edouard_Cannes', '🇫🇷', 'France', 'balanced'],
    ['Takumi_Ginza', '🇯🇵', 'Japon', 'balanced'], ['Kasper_Roskilde', '🇩🇰', 'Danemark', 'cautious'],
    ['Victoria_Boston', '🇺🇸', 'États-Unis', 'balanced'], ['Yonatan_Haifa', '🇮🇱', 'Israël', 'aggressive'],
    ['Florian_FFM', '🇩🇪', 'Allemagne', 'cautious'], ['Sebastian_Ox', '🇬🇧', 'Royaume-Uni', 'balanced'],
    ['Bram_Rotterdam', '🇳🇱', 'Pays-Bas', 'balanced'], ['Magnus_Trond', '🇳🇴', 'Norvège', 'cautious'],
    ['Selim_Izmir', '🇹🇷', 'Turquie', 'aggressive'], ['Kostas_Thess', '🇬🇷', 'Grèce', 'aggressive'],
    ['Edoardo_Venezia', '🇮🇹', 'Italie', 'cautious'], ['Alvaro_Bilbao', '🇪🇸', 'Espagne', 'balanced'],
    ['Moritz_Salzburg', '🇦🇹', 'Autriche', 'cautious'], ['Laurent_West', '🇨🇦', 'Canada', 'balanced'],
    ['Oliver_Melb', '🇦🇺', 'Australie', 'aggressive'], ['Santiago_Pal', '🇦🇷', 'Argentine', 'aggressive'],
    ['Ziad_Achrafieh', '🇱🇧', 'Liban', 'aggressive'], ['Charlotte_MC', '🇲🇨', 'Monaco', 'balanced'],
    ['Ren_Yokohama', '🇯🇵', 'Japon', 'balanced'], ['Levan_Batumi', '🇬🇪', 'Géorgie', 'aggressive'],
    ['Tigran_Yvn', '🇦🇲', 'Arménie', 'aggressive'], ['Masayuki_Minato', '🇯🇵', 'Japon', 'balanced'],
    ['Michy_Chiyoda', '🇯🇵', 'Japon', 'balanced'], ['Dirk_Muenchen', '🇩🇪', 'Allemagne', 'cautious'],
    ['Falafel_TLV', '🇮🇱', 'Israël', 'aggressive'], ['Sander_Utrecht', '🇳🇱', 'Pays-Bas', 'balanced'],
    // Famille 1 : Prénom/Surnom + Département ou Année
    ['jean_philippe75', '🇫🇷', 'France', 'balanced'], ['stanislas_06', '🇫🇷', 'France', 'aggressive'],
    ['charles_92', '🇫🇷', 'France', 'cautious'], ['alexandre_69', '🇫🇷', 'France', 'balanced'],
    ['bertrand_33', '🇫🇷', 'France', 'cautious'], ['emmanuel_78', '🇫🇷', 'France', 'balanced'],
    ['gregoire_64', '🇫🇷', 'France', 'aggressive'], ['hugues_13', '🇫🇷', 'France', 'balanced'],
    ['thibaut_74', '🇫🇷', 'France', 'cautious'], ['raphael_67', '🇫🇷', 'France', 'aggressive'],
    ['augustin_44', '🇫🇷', 'France', 'balanced'], ['gaspard_31', '🇫🇷', 'France', 'cautious'],
    ['amaury_59', '🇫🇷', 'France', 'balanced'], ['aymeric_35', '🇫🇷', 'France', 'aggressive'],
    ['tanguy_29', '🇫🇷', 'France', 'cautious'], ['wandrille_75', '🇫🇷', 'France', 'balanced'],
    ['clement_38', '🇫🇷', 'France', 'aggressive'], ['etienne_21', '🇫🇷', 'France', 'cautious'],
    [' Come_92', '🇫🇷', 'France', 'balanced'], ['gonzague_06', '🇫🇷', 'France', 'aggressive'],
    // Famille 3 : Jargon Backgammon naturel
    ['KazarossXG2', '🇺🇸', 'États-Unis', 'balanced'], ['MonteCarloCube', '🇲🇨', 'Monaco', 'balanced'],
    ['TimmesFormula', '🇩🇪', 'Allemagne', 'cautious'], ['IsightCount', '🇩🇪', 'Allemagne', 'balanced'],
    ['EPCMaster7n1', '🇬🇧', 'Royaume-Uni', 'cautious'], ['CubeVigPro', '🇺🇸', 'États-Unis', 'aggressive'],
    ['GammonGo2Away', '🇯🇵', 'Japon', 'aggressive'], ['PostCrawfordX', '🇸🇪', 'Suède', 'balanced'],
    ['ThreePlyVision', '🇩🇰', 'Danemark', 'balanced'], ['DeepBackgame', '🇮🇹', 'Italie', 'cautious'],
    ['Containment6', '🇨🇭', 'Suisse', 'cautious'], ['MutualHolding', '🇫🇷', 'France', 'balanced'],
    ['CrunchDefense', '🇳🇴', 'Norvège', 'cautious'], ['PrimeVsPrime', '🇳🇱', 'Pays-Bas', 'balanced'],
    ['TakePoint215', '🇬🇧', 'Royaume-Uni', 'cautious'], ['DoublePass80', '🇦🇹', 'Autriche', 'balanced'],
    ['SnakePrime', '🇬🇷', 'Grèce', 'aggressive'], ['RoofPoint16', '🇹🇷', 'Turquie', 'aggressive'],
    ['TimingMaster', '🇯🇵', 'Japon', 'cautious'], ['EquityPure', '🇨🇦', 'Canada', 'balanced'],
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
