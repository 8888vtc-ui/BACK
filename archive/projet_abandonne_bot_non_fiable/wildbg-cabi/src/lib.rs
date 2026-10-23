//! C ABI bindings for the WildBG backgammon engine.
//!
//! Exposes a minimal, wasm-bindgen-free C ABI so the engine can be loaded
//! directly via `WebAssembly.instantiate` from TypeScript without needing
//! `wasm-bindgen-cli` (which requires a native Windows toolchain).
//!
//! Input board encoding (the project's convention, see `backgammonEngine.ts`):
//! - `board[0]`     : X bar (positive)
//! - `board[1..24]` : points 1..24 (positive = X, negative = O)
//! - `board[25]`    : O bar (negative)
//! - `turn`         : 1 for X, -1 for O (the active player)
//!
//! WildBG uses the mirrored convention (`pips[25]` = X bar, `pips[0]` = O bar),
//! so `position_from_board` converts by reversing the index order.

use engine::composite::CompositeEvaluator;
use engine::dice::Dice;
use engine::position::Position;
use engine::probabilities::Probabilities;
use logic::wildbg_api::{ScoreConfig, WildbgApi};
use std::sync::OnceLock;

type Api = WildbgApi<CompositeEvaluator>;

static API: OnceLock<Api> = OnceLock::new();

fn get_api() -> &'static Api {
    API.get_or_init(|| WildbgApi::try_default().expect("failed to load wildbg neural nets"))
}

/// Build a `Position` from a 26-element board array in the project's
/// convention (`board[0]` = X bar, `board[25]` = O bar), converting to
/// WildBG's convention (`pips[25]` = X bar, `pips[0]` = O bar).
///
/// Points 1..24 are identical in both conventions; only the two bar indices
/// (0 and 25) are swapped.
///
/// The result is then flipped via `sides_switched()` when `turn` is O, so that
/// positive checkers always belong to the active player.
fn position_from_board(board: &[i8; 26], turn: i8) -> Position {
    let mut wildbg_pips = [0i8; 26];
    // Points 1..24 are identical.
    for i in 1..25 {
        wildbg_pips[i] = board[i];
    }
    // Swap the two bar indices.
    wildbg_pips[25] = board[0]; // X bar
    wildbg_pips[0] = board[25]; // O bar
    let pos = Position::try_from(wildbg_pips).expect("invalid board");
    if turn >= 0 {
        pos
    } else {
        pos.sides_switched()
    }
}

/// Convert a WildBG move step (from/to in wildbg convention) back to the
/// project's convention.
///
/// For `turn = X` (no `sides_switched`), points 1..24 are identical and only
/// the bar (25) and bear-off (0) indices are swapped.
///
/// For `turn = O` (after `sides_switched`), the whole board is mirrored, so a
/// full `25 - index` reversal is applied.
fn to_project_step(from: usize, to: usize, turn: i8) -> (f32, f32) {
    let (project_from, project_to) = if turn >= 0 {
        let f = if from == 25 { 0 } else { from };
        let t = if to == 0 { 25 } else { to };
        (f, t)
    } else {
        (25 - from, 25 - to)
    };
    (project_from as f32, project_to as f32)
}

/// Initialize the engine (loads the embedded ONNX neural nets).
/// Returns 1 on success, 0 on failure.
#[unsafe(no_mangle)]
pub extern "C" fn wildbg_init() -> i32 {
    let _ = get_api();
    1
}

/// Evaluate a position from the active player's perspective.
///
/// Writes 7 f32 into `out_ptr`:
/// [win, win_gammon, win_backgammon, lose, lose_gammon, lose_backgammon, cubeless_equity]
///
/// Returns 0 on success, -1 on error.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn wildbg_evaluate(
    board_ptr: *const i8,
    turn: i8,
    out_ptr: *mut f32,
) -> i32 {
    if board_ptr.is_null() || out_ptr.is_null() {
        return -1;
    }
    let mut board = [0i8; 26];
    unsafe {
        for i in 0..26 {
            board[i] = *board_ptr.add(i);
        }
    }
    let position = position_from_board(&board, turn);
    let probs: Probabilities = get_api().probabilities(&position);

    unsafe {
        *out_ptr.add(0) = probs.win_normal + probs.win_gammon + probs.win_bg; // win
        *out_ptr.add(1) = probs.win_gammon + probs.win_bg; // win_gammon (cumulative)
        *out_ptr.add(2) = probs.win_bg; // win_backgammon
        *out_ptr.add(3) = probs.lose_normal + probs.lose_gammon + probs.lose_bg; // lose
        *out_ptr.add(4) = probs.lose_gammon + probs.lose_bg; // lose_gammon (cumulative)
        *out_ptr.add(5) = probs.lose_bg; // lose_backgammon
        *out_ptr.add(6) = probs.equity(); // cubeless equity
    }

    0
}

/// Find the best move for the active player given a dice roll.
///
/// Inputs: board (26 x i8), turn (i8), d1 (u8), d2 (u8).
/// Output written into `out_ptr`:
///   [0] = number of move steps (max 4)
///   [1..9] = 4 pairs of (from, to) as f32
///   [9] = cubeless equity of the resulting position
///
/// Returns 0 on success, -1 on error.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn wildbg_best_move(
    board_ptr: *const i8,
    turn: i8,
    d1: u8,
    d2: u8,
    out_ptr: *mut f32,
) -> i32 {
    if board_ptr.is_null() || out_ptr.is_null() {
        return -1;
    }
    let mut board = [0i8; 26];
    unsafe {
        for i in 0..26 {
            board[i] = *board_ptr.add(i);
        }
    }
    let position = position_from_board(&board, turn);
    let dice = match Dice::try_from((d1 as usize, d2 as usize)) {
        Ok(d) => d,
        Err(_) => return -1,
    };

    let api = get_api();
    let bg_move = api.best_move(&position, &dice, &ScoreConfig::MoneyGame);
    let details = bg_move.into_details();

    let count = details.len().min(4);
    unsafe {
        *out_ptr.add(0) = count as f32;
        for (i, step) in details.iter().take(4).enumerate() {
            let (from, to) = to_project_step(step.from(), step.to(), turn);
            *out_ptr.add(1 + i * 2) = from;
            *out_ptr.add(1 + i * 2 + 1) = to;
        }

        // Equity of the resulting position (from the mover's perspective).
        let new_position = api
            .all_moves(&position, &dice, &ScoreConfig::MoneyGame)
            .into_iter()
            .max_by(|a, b| a.1.equity().partial_cmp(&b.1.equity()).unwrap())
            .map(|(_, p)| p.equity())
            .unwrap_or(0.0);
        *out_ptr.add(9) = new_position;
    }

    0
}

/// Compute the doubling cube decision for the active player.
///
/// Writes 3 f32 into `out_ptr`:
/// [should_double (0/1), should_take (0/1), cubeless_equity]
///
/// Returns 0 on success, -1 on error.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn wildbg_cube_info(
    board_ptr: *const i8,
    turn: i8,
    out_ptr: *mut f32,
) -> i32 {
    if board_ptr.is_null() || out_ptr.is_null() {
        return -1;
    }
    let mut board = [0i8; 26];
    unsafe {
        for i in 0..26 {
            board[i] = *board_ptr.add(i);
        }
    }
    let position = position_from_board(&board, turn);
    let api = get_api();
    let cube = api.cube_info(&position);
    let probs = api.probabilities(&position);

    unsafe {
        *out_ptr.add(0) = if cube.double() { 1.0 } else { 0.0 };
        *out_ptr.add(1) = if cube.accept() { 1.0 } else { 0.0 };
        *out_ptr.add(2) = probs.equity();
    }

    0
}
