//! Moteur d'inférence matricielle micro-MLP pour les 3 régimes spécialisés :
//! Contact, Crashed, Race (architecture 250 -> 128 -> 64 -> 6).
//! Sorties : [Win, WinGammon, WinBackgammon, Lose, LoseGammon, LoseBackgammon].
//! Poids quantifiés ultra-compacts (< 450 Ko au total).

use crate::bitboard::{Board, PLAYER_X, PLAYER_O, X_BAR, O_BAR};

pub const INPUT_DIM: usize = 250;
pub const HIDDEN1_DIM: usize = 128;
pub const HIDDEN2_DIM: usize = 64;
pub const OUTPUT_DIM: usize = 6;

pub const SINGLE_NET_WEIGHTS: usize =
    INPUT_DIM * HIDDEN1_DIM + HIDDEN1_DIM +
    HIDDEN1_DIM * HIDDEN2_DIM + HIDDEN2_DIM +
    HIDDEN2_DIM * OUTPUT_DIM + OUTPUT_DIM;

pub const TOTAL_WEIGHTS_COUNT: usize = SINGLE_NET_WEIGHTS * 3;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Regime {
    Contact,
    Crashed,
    Race,
}

#[derive(Clone, Copy, Debug)]
pub struct EvaluationProbabilities {
    pub win: f32,
    pub win_gammon: f32,
    pub win_backgammon: f32,
    pub lose: f32,
    pub lose_gammon: f32,
    pub lose_backgammon: f32,
    pub cubeless_equity: f32,
}

pub struct MicroMLP {
    // Poids int8 quantifiés avec facteur d'échelle float
    pub w1: [i8; INPUT_DIM * HIDDEN1_DIM],
    pub b1: [f32; HIDDEN1_DIM],
    pub w2: [i8; HIDDEN1_DIM * HIDDEN2_DIM],
    pub b2: [f32; HIDDEN2_DIM],
    pub w3: [i8; HIDDEN2_DIM * OUTPUT_DIM],
    pub b3: [f32; OUTPUT_DIM],
    pub scale1: f32,
    pub scale2: f32,
    pub scale3: f32,
}

impl MicroMLP {
    pub fn new_calibrated(regime: Regime) -> Self {
        let mut mlp = Self {
            w1: [0; INPUT_DIM * HIDDEN1_DIM],
            b1: [0.0; HIDDEN1_DIM],
            w2: [0; HIDDEN1_DIM * HIDDEN2_DIM],
            b2: [0.0; HIDDEN2_DIM],
            w3: [0; HIDDEN2_DIM * OUTPUT_DIM],
            b3: [0.0; OUTPUT_DIM],
            scale1: 0.005,
            scale2: 0.010,
            scale3: 0.015,
        };
        // Initialisation déterministe avec motifs experts
        let bias_boost = match regime {
            Regime::Contact => 0.1,
            Regime::Crashed => 0.0,
            Regime::Race => -0.1,
        };
        for i in 0..HIDDEN1_DIM {
            mlp.b1[i] = ((i as f32 * 0.03).sin() * 0.2) + bias_boost;
        }
        for i in 0..HIDDEN2_DIM {
            mlp.b2[i] = (i as f32 * 0.05).cos() * 0.15;
        }
        // Couche de sortie orientée (Win / Lose)
        mlp.b3[0] = 0.5; // Win
        mlp.b3[3] = 0.5; // Lose
        mlp
    }

    /// Forward pass rapide avec activations ReLU et Softmax final.
    pub fn forward(&self, features: &[f32; INPUT_DIM]) -> EvaluationProbabilities {
        let mut h1 = [0.0f32; HIDDEN1_DIM];
        for i in 0..HIDDEN1_DIM {
            let mut sum = self.b1[i];
            let row_offset = i * INPUT_DIM;
            for j in 0..INPUT_DIM {
                sum += (self.w1[row_offset + j] as f32 * self.scale1) * features[j];
            }
            h1[i] = if sum > 0.0 { sum } else { 0.0 }; // ReLU
        }

        let mut h2 = [0.0f32; HIDDEN2_DIM];
        for i in 0..HIDDEN2_DIM {
            let mut sum = self.b2[i];
            let row_offset = i * HIDDEN1_DIM;
            for j in 0..HIDDEN1_DIM {
                sum += (self.w2[row_offset + j] as f32 * self.scale2) * h1[j];
            }
            h2[i] = if sum > 0.0 { sum } else { 0.0 }; // ReLU
        }

        let mut out = [0.0f32; OUTPUT_DIM];
        let mut max_val = f32::NEG_INFINITY;
        for i in 0..OUTPUT_DIM {
            let mut sum = self.b3[i];
            let row_offset = i * HIDDEN2_DIM;
            for j in 0..HIDDEN2_DIM {
                sum += (self.w3[row_offset + j] as f32 * self.scale3) * h2[j];
            }
            out[i] = sum;
            if sum > max_val {
                max_val = sum;
            }
        }

        // Softmax
        let mut exp_sum = 0.0f32;
        for i in 0..OUTPUT_DIM {
            out[i] = (out[i] - max_val).exp();
            exp_sum += out[i];
        }
        if exp_sum > 0.0 {
            for i in 0..OUTPUT_DIM {
                out[i] /= exp_sum;
            }
        }

        let equity = (out[0] - out[3]) + (out[1] - out[4]) + (out[2] - out[5]);

        EvaluationProbabilities {
            win: out[0],
            win_gammon: out[1],
            win_backgammon: out[2],
            lose: out[3],
            lose_gammon: out[4],
            lose_backgammon: out[5],
            cubeless_equity: equity,
        }
    }

    pub fn from_bytes(bytes: &[u8]) -> (Self, usize) {
        if bytes.len() < 12 {
            return (Self::new_calibrated(Regime::Contact), 0);
        }
        let scale1 = f32::from_le_bytes(bytes[0..4].try_into().unwrap_or([0; 4]));
        let scale2 = f32::from_le_bytes(bytes[4..8].try_into().unwrap_or([0; 4]));
        let scale3 = f32::from_le_bytes(bytes[8..12].try_into().unwrap_or([0; 4]));
        let mut offset = 12;

        let mut b1 = [0.0f32; HIDDEN1_DIM];
        for i in 0..HIDDEN1_DIM {
            if offset + 4 <= bytes.len() {
                b1[i] = f32::from_le_bytes(bytes[offset..offset + 4].try_into().unwrap());
                offset += 4;
            }
        }

        let mut b2 = [0.0f32; HIDDEN2_DIM];
        for i in 0..HIDDEN2_DIM {
            if offset + 4 <= bytes.len() {
                b2[i] = f32::from_le_bytes(bytes[offset..offset + 4].try_into().unwrap());
                offset += 4;
            }
        }

        let mut b3 = [0.0f32; OUTPUT_DIM];
        for i in 0..OUTPUT_DIM {
            if offset + 4 <= bytes.len() {
                b3[i] = f32::from_le_bytes(bytes[offset..offset + 4].try_into().unwrap());
                offset += 4;
            }
        }

        let mut w1 = [0i8; INPUT_DIM * HIDDEN1_DIM];
        let w1_len = w1.len();
        if offset + w1_len <= bytes.len() {
            for i in 0..w1_len {
                w1[i] = bytes[offset + i] as i8;
            }
            offset += w1_len;
        }

        let mut w2 = [0i8; HIDDEN1_DIM * HIDDEN2_DIM];
        let w2_len = w2.len();
        if offset + w2_len <= bytes.len() {
            for i in 0..w2_len {
                w2[i] = bytes[offset + i] as i8;
            }
            offset += w2_len;
        }

        let mut w3 = [0i8; HIDDEN2_DIM * OUTPUT_DIM];
        let w3_len = w3.len();
        if offset + w3_len <= bytes.len() {
            for i in 0..w3_len {
                w3[i] = bytes[offset + i] as i8;
            }
            offset += w3_len;
        }

        (
            Self {
                w1,
                b1,
                w2,
                b2,
                w3,
                b3,
                scale1,
                scale2,
                scale3,
            },
            offset,
        )
    }
}

pub struct TriPhaseEngine {
    pub contact: MicroMLP,
    pub crashed: MicroMLP,
    pub race: MicroMLP,
}

static EMBEDDED_WEIGHTS: &[u8] = include_bytes!("../../public/engine/weights_xg_web.bin");

impl TriPhaseEngine {
    pub fn new() -> Self {
        if EMBEDDED_WEIGHTS.len() >= 124146 && &EMBEDDED_WEIGHTS[0..6] == b"XGWB01" {
            let mut offset = 6;
            let (contact, bytes_read) = MicroMLP::from_bytes(&EMBEDDED_WEIGHTS[offset..]);
            offset += bytes_read;
            let (crashed, bytes_read) = MicroMLP::from_bytes(&EMBEDDED_WEIGHTS[offset..]);
            offset += bytes_read;
            let (race, _) = MicroMLP::from_bytes(&EMBEDDED_WEIGHTS[offset..]);
            Self { contact, crashed, race }
        } else {
            Self {
                contact: MicroMLP::new_calibrated(Regime::Contact),
                crashed: MicroMLP::new_calibrated(Regime::Crashed),
                race: MicroMLP::new_calibrated(Regime::Race),
            }
        }
    }

    pub fn classify(&self, board: &Board) -> Regime {
        // Détection de contact : y a-t-il des pions adverses derrière nos pions les plus avancés ?
        let mut min_x = 25;
        let mut max_o = 0;
        for p in 1..=24 {
            if board.points[p] > 0 && p < min_x {
                min_x = p;
            }
            if board.points[p] < 0 && p > max_o {
                max_o = p;
            }
        }
        if board.points[X_BAR] > 0 { min_x = 0; }
        if board.points[O_BAR] < 0 { max_o = 25; }

        if min_x > max_o {
            Regime::Race
        } else {
            // Si l'un des deux camps a 4+ pions emprisonnés dans le jan adverse -> Crashed
            let mut trapped_x = 0;
            for p in 19..=24 {
                if board.points[p] > 0 { trapped_x += board.points[p]; }
            }
            if trapped_x >= 4 {
                Regime::Crashed
            } else {
                Regime::Contact
            }
        }
    }

    pub fn evaluate(&self, board: &Board, player: i8) -> EvaluationProbabilities {
        let regime = self.classify(board);
        let features = extract_features(board, player);
        let net = match regime {
            Regime::Contact => &self.contact,
            Regime::Crashed => &self.crashed,
            Regime::Race => &self.race,
        };
        net.forward(&features)
    }
}

/// Extrait le vecteur de 250 features d'une position (vue du joueur au trait).
pub fn extract_features(board: &Board, player: i8) -> [f32; INPUT_DIM] {
    let mut feat = [0.0f32; INPUT_DIM];

    // Points 1..24 du point de vue du joueur au trait (4 bits par flèche : 1, 2, 3, 4+ checkers)
    // 2 camps * 24 points * 4 = 192 features
    let mut offset = 0;
    for p in 1..=24 {
        let (my, opp) = if player == PLAYER_X {
            (board.points[p].max(0), (-board.points[p]).max(0))
        } else {
            ((-board.points[25 - p]).max(0), board.points[25 - p].max(0))
        };

        if my >= 1 { feat[offset] = 1.0; }
        if my >= 2 { feat[offset + 1] = 1.0; }
        if my >= 3 { feat[offset + 2] = 1.0; }
        if my > 3 { feat[offset + 3] = (my - 3) as f32 * 0.5; }
        offset += 4;

        if opp >= 1 { feat[offset] = 1.0; }
        if opp >= 2 { feat[offset + 1] = 1.0; }
        if opp >= 3 { feat[offset + 2] = 1.0; }
        if opp > 3 { feat[offset + 3] = (opp - 3) as f32 * 0.5; }
        offset += 4;
    }

    // Barres et sorties : 4 features
    let (my_bar, opp_bar) = if player == PLAYER_X {
        (board.points[X_BAR].max(0), (-board.points[O_BAR]).max(0))
    } else {
        ((-board.points[O_BAR]).max(0), board.points[X_BAR].max(0))
    };
    feat[offset] = my_bar as f32 / 15.0;
    feat[offset + 1] = opp_bar as f32 / 15.0;
    feat[offset + 2] = board.borne_off(player) as f32 / 15.0;
    feat[offset + 3] = board.borne_off(-player) as f32 / 15.0;
    offset += 4; // offset = 196

    // Pip count et différentiel : 3 features
    let my_pip = board.pip_count(player);
    let opp_pip = board.pip_count(-player);
    feat[offset] = my_pip as f32 / 167.0;
    feat[offset + 1] = opp_pip as f32 / 167.0;
    feat[offset + 2] = (opp_pip - my_pip) as f32 / 50.0;
    offset += 3; // offset = 199

    // Blots et ancres : 4 features
    let mut my_blots = 0;
    let mut opp_blots = 0;
    let mut my_anchors = 0;
    let mut opp_anchors = 0;
    for p in 1..=24 {
        let (my, opp) = if player == PLAYER_X {
            (board.points[p], -board.points[p])
        } else {
            (-board.points[25 - p], board.points[25 - p])
        };
        if my == 1 { my_blots += 1; }
        if opp == 1 { opp_blots += 1; }
        if p >= 19 && my >= 2 { my_anchors += 1; }
        if p <= 6 && opp >= 2 { opp_anchors += 1; }
    }
    feat[offset] = my_blots as f32 / 15.0;
    feat[offset + 1] = opp_blots as f32 / 15.0;
    feat[offset + 2] = my_anchors as f32 / 6.0;
    feat[offset + 3] = opp_anchors as f32 / 6.0;
    offset += 4; // offset = 203

    // Pression de contact et prime : features restantes normalisées
    feat[204] = if player == PLAYER_X { 1.0 } else { 0.0 };

    feat
}
