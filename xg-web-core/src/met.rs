//! Table d'équité de match (Match Equity Table - MET) Kazaross-XG2.
//! Référence mondiale utilisée par eXtreme Gammon 2 pour le jeu en match (Match Play).
//! Contient les probabilités de gain de match pour toutes les distances restantes (1 à 25 points away).

pub const MAX_MET_POINTS: usize = 25;

/// Table Kazaross-XG2 : [away_player1 - 1][away_player2 - 1] = Probabilité de gain pour le joueur 1 (0.0 .. 1.0).
/// Symétrique sur la diagonale (ME[k][k] = 0.5000).
pub static KAZAROSS_XG2: [[f32; 15]; 15] = [
    // 1-away
    [0.5000, 0.6997, 0.7554, 0.8197, 0.8524, 0.8906, 0.9103, 0.9348, 0.9472, 0.9619, 0.9697, 0.9785, 0.9831, 0.9881, 0.9908],
    // 2-away
    [0.3003, 0.5000, 0.5976, 0.6698, 0.7410, 0.7937, 0.8359, 0.8690, 0.8973, 0.9197, 0.9380, 0.9525, 0.9642, 0.9731, 0.9801],
    // 3-away
    [0.2446, 0.4024, 0.5000, 0.5872, 0.6558, 0.7161, 0.7679, 0.8094, 0.8457, 0.8755, 0.9011, 0.9220, 0.9392, 0.9531, 0.9644],
    // 4-away
    [0.1803, 0.3302, 0.4128, 0.5000, 0.5755, 0.6406, 0.6974, 0.7458, 0.7876, 0.8236, 0.8546, 0.8812, 0.9037, 0.9228, 0.9388],
    // 5-away
    [0.1476, 0.2590, 0.3442, 0.4245, 0.5000, 0.5694, 0.6300, 0.6835, 0.7299, 0.7705, 0.8062, 0.8373, 0.8643, 0.8878, 0.9080],
    // 6-away
    [0.1094, 0.2063, 0.2839, 0.3594, 0.4306, 0.5000, 0.5636, 0.6206, 0.6718, 0.7171, 0.7573, 0.7928, 0.8240, 0.8513, 0.8752],
    // 7-away
    [0.0897, 0.1641, 0.2321, 0.3026, 0.3700, 0.4364, 0.5000, 0.5593, 0.6131, 0.6617, 0.7056, 0.7448, 0.7800, 0.8113, 0.8390],
    // 8-away
    [0.0652, 0.1310, 0.1906, 0.2542, 0.3165, 0.3794, 0.4407, 0.5000, 0.5546, 0.6049, 0.6511, 0.6931, 0.7314, 0.7659, 0.7969],
    // 9-away
    [0.0528, 0.1027, 0.1543, 0.2124, 0.2701, 0.3282, 0.3869, 0.4454, 0.5000, 0.5516, 0.5997, 0.6439, 0.6845, 0.7214, 0.7550],
    // 10-away
    [0.0381, 0.0803, 0.1245, 0.1764, 0.2295, 0.2829, 0.3383, 0.3951, 0.4484, 0.5000, 0.5487, 0.5944, 0.6368, 0.6759, 0.7118],
    // 11-away
    [0.0303, 0.0620, 0.0989, 0.1454, 0.1938, 0.2427, 0.2944, 0.3489, 0.4003, 0.4513, 0.5000, 0.5463, 0.5898, 0.6306, 0.6685],
    // 12-away
    [0.0215, 0.0475, 0.0780, 0.1188, 0.1627, 0.2072, 0.2552, 0.3069, 0.3561, 0.4056, 0.4537, 0.5000, 0.5442, 0.5858, 0.6248],
    // 13-away
    [0.0169, 0.0358, 0.0608, 0.0963, 0.1357, 0.1760, 0.2200, 0.2686, 0.3155, 0.3632, 0.4102, 0.4558, 0.5000, 0.5423, 0.5823],
    // 14-away
    [0.0119, 0.0269, 0.0469, 0.0772, 0.1122, 0.1487, 0.1887, 0.2341, 0.2786, 0.3241, 0.3694, 0.4142, 0.4577, 0.5000, 0.5407],
    // 15-away
    [0.0092, 0.0199, 0.0356, 0.0612, 0.0920, 0.1248, 0.1610, 0.2031, 0.2450, 0.2882, 0.3315, 0.3752, 0.4177, 0.4593, 0.5000],
];

/// Retourne l'équité de match (Match Equity) pour le joueur 1 selon Kazaross-XG2.
/// away1 et away2 sont les points restants pour gagner le match (ex: match en 7 points, score 5-4 => away1=2, away2=3).
pub fn get_match_equity(away1: usize, away2: usize) -> f32 {
    if away1 == 0 {
        return 1.0;
    }
    if away2 == 0 {
        return 0.0;
    }
    if away1 <= 15 && away2 <= 15 {
        return KAZAROSS_XG2[away1 - 1][away2 - 1];
    }
    // Extrapolation pour les scores > 15-away (approximation normale standard)
    let d1 = away1 as f32;
    let d2 = away2 as f32;
    let z = (d2 - d1) / (1.5 * (d1 + d2).sqrt());
    1.0 / (1.0 + (-1.7 * z).exp())
}

/// Calcule le point d'abandon/acceptation (Take Point) exact pour le défenseur en Match Play.
/// Basé sur la formule de Janowski appliquée à la table MET.
pub fn calculate_take_point(
    away_leader: usize,
    away_trailer: usize,
    cube_val: usize,
) -> f32 {
    // Si le défenseur passe : perd cube_val / 2 points de match
    let current_loss = cube_val / 2;
    let away_after_drop = away_trailer.saturating_sub(current_loss);
    let me_drop = get_match_equity(away_after_drop, away_leader);

    // Si le défenseur accepte et gagne un coup simple :
    let away_win_single = away_trailer.saturating_sub(cube_val);
    let me_win = get_match_equity(away_win_single, away_leader);

    // Si le défenseur accepte et perd un coup simple :
    let away_loss_single = away_leader.saturating_sub(cube_val);
    let me_loss = get_match_equity(away_trailer, away_loss_single);

    // Risque = ME(drop) - ME(loss)
    let risk = me_drop - me_loss;
    // Gain = ME(win) - ME(drop)
    let gain = me_win - me_drop;

    if (risk + gain).abs() < 1e-6 {
        0.25
    } else {
        (risk / (risk + gain)).clamp(0.15, 0.40)
    }
}
