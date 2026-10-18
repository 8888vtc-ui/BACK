//! xg-web-core : Moteur de Backgammon haute performance en Rust compilé en WebAssembly.
//! Fournit les exports C ABI légers consommables depuis le Web Worker TypeScript.

pub mod bitboard;
pub mod met;
pub mod mlp;
pub mod search;

use bitboard::{Board, PLAYER_O, PLAYER_X};
use met::{calculate_take_point, get_match_equity};
use mlp::TriPhaseEngine;
use search::SearchEngine;
use std::sync::OnceLock;

static ENGINE: OnceLock<TriPhaseEngine> = OnceLock::new();

fn get_engine() -> &'static TriPhaseEngine {
    ENGINE.get_or_init(TriPhaseEngine::new)
}

/// Initialise le moteur avec des poids personnalisés (ou les poids calibrés par défaut).
#[no_mangle]
pub extern "C" fn xg_init() -> i32 {
    let _ = get_engine();
    1
}

/// Évalue une position (plateau de 26 entiers i8, joueur au trait 1 pour X, -1 pour O).
/// Écrit 7 floats dans `out_ptr` : [win, win_g, win_bg, lose, lose_g, lose_bg, cubeless_equity].
#[no_mangle]
pub unsafe extern "C" fn xg_evaluate(board_ptr: *const i8, turn: i8, out_ptr: *mut f32) -> i32 {
    if board_ptr.is_null() || out_ptr.is_null() {
        return -1;
    }
    let mut board = Board::new();
    for i in 0..26 {
        board.points[i] = *board_ptr.add(i);
    }

    let engine = get_engine();
    let player = if turn >= 0 { PLAYER_X } else { PLAYER_O };
    let eval = engine.evaluate(&board, player);

    *out_ptr.add(0) = eval.win;
    *out_ptr.add(1) = eval.win_gammon;
    *out_ptr.add(2) = eval.win_backgammon;
    *out_ptr.add(3) = eval.lose;
    *out_ptr.add(4) = eval.lose_gammon;
    *out_ptr.add(5) = eval.lose_backgammon;
    *out_ptr.add(6) = eval.cubeless_equity;

    0
}

/// Recherche de coups (0-ply ou 2-ply).
/// Entrée : plateau (26 x i8), joueur au trait (i8), d1 (u8), d2 (u8), ply (i32: 0 ou 2).
/// Sortie écrite dans `out_ptr` :
/// [0] = nombre de coups retournés (max 8)
/// Pour chaque coup k (k in 0..count):
///   base = 1 + k * 18
///   base+0..base+7 : 4 moves (from, to)
///   base+8 : nombre de sous-coups (count)
///   base+9 : équité cubeless
///   base+10..base+15 : probabilités
#[no_mangle]
pub unsafe extern "C" fn xg_search_moves(
    board_ptr: *const i8,
    turn: i8,
    d1: u8,
    d2: u8,
    ply: i32,
    out_ptr: *mut f32,
) -> i32 {
    if board_ptr.is_null() || out_ptr.is_null() {
        return -1;
    }
    let mut board = Board::new();
    for i in 0..26 {
        board.points[i] = *board_ptr.add(i);
    }

    let engine = get_engine();
    let player = if turn >= 0 { PLAYER_X } else { PLAYER_O };
    let searcher = SearchEngine::new(engine);

    let results = if ply >= 3 {
        searcher.search_3ply_selective(&board, d1, d2, player)
    } else if ply >= 2 {
        searcher.search_2ply(&board, d1, d2, player)
    } else {
        searcher.search_0ply(&board, d1, d2, player)
    };

    let count = results.len().min(8);
    *out_ptr = count as f32;

    for (k, scored) in results.iter().take(count).enumerate() {
        let base = 1 + k * 18;
        // 4 coups (from, to)
        for m_idx in 0..4 {
            *out_ptr.add(base + m_idx * 2) = scored.moves[m_idx].from as f32;
            *out_ptr.add(base + m_idx * 2 + 1) = scored.moves[m_idx].to as f32;
        }
        *out_ptr.add(base + 8) = scored.count as f32;
        *out_ptr.add(base + 9) = scored.equity;
        *out_ptr.add(base + 10) = scored.probs.win;
        *out_ptr.add(base + 11) = scored.probs.win_gammon;
        *out_ptr.add(base + 12) = scored.probs.win_backgammon;
        *out_ptr.add(base + 13) = scored.probs.lose;
        *out_ptr.add(base + 14) = scored.probs.lose_gammon;
        *out_ptr.add(base + 15) = scored.probs.lose_backgammon;
        *out_ptr.add(base + 16) = scored.probs.cubeless_equity;
        *out_ptr.add(base + 17) = 0.0; // padding
    }

    0
}

/// Retourne l'équité de match Kazaross-XG2.
#[no_mangle]
pub extern "C" fn xg_match_equity(away1: usize, away2: usize) -> f32 {
    get_match_equity(away1, away2)
}

/// Retourne le Take Point de Janowski en match play.
#[no_mangle]
pub extern "C" fn xg_take_point(away_leader: usize, away_trailer: usize, cube_val: usize) -> f32 {
    calculate_take_point(away_leader, away_trailer, cube_val)
}
