//! Représentation compacte du plateau de Backgammon et générateur de coups légaux.
//! Conforme aux conventions du projet (board[0] = barre X, board[1..=24] = points, board[25] = barre O).

pub const X_BAR: usize = 0;
pub const O_BAR: usize = 25;
pub const X_OFF: usize = 0;
pub const O_OFF: usize = 25;

pub const PLAYER_X: i8 = 1;
pub const PLAYER_O: i8 = -1;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Move {
    pub from: u8,
    pub to: u8,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Board {
    pub points: [i8; 26],
}

impl Default for Board {
    fn default() -> Self {
        Self::new()
    }
}

impl Board {
    pub const fn new() -> Self {
        Self { points: [0; 26] }
    }

    pub fn initial() -> Self {
        let mut b = Self::new();
        // X (positif)
        b.points[6] = 5;
        b.points[8] = 3;
        b.points[13] = 5;
        b.points[24] = 2;
        // O (négatif)
        b.points[1] = -2;
        b.points[12] = -5;
        b.points[17] = -3;
        b.points[19] = -5;
        b
    }

    #[inline(always)]
    pub fn checkers_on_board(&self, player: i8) -> i8 {
        let mut total = 0;
        if player == PLAYER_X {
            total += self.points[X_BAR].max(0);
            for p in 1..=24 {
                if self.points[p] > 0 {
                    total += self.points[p];
                }
            }
        } else {
            total += (-self.points[O_BAR]).max(0);
            for p in 1..=24 {
                if self.points[p] < 0 {
                    total += -self.points[p];
                }
            }
        }
        total
    }

    #[inline(always)]
    pub fn borne_off(&self, player: i8) -> i8 {
        (15 - self.checkers_on_board(player)).clamp(0, 15)
    }

    #[inline(always)]
    pub fn pip_count(&self, player: i8) -> i32 {
        let mut pips = 0;
        if player == PLAYER_X {
            pips += (self.points[X_BAR].max(0) as i32) * 25;
            for p in 1..=24 {
                if self.points[p] > 0 {
                    pips += (self.points[p] as i32) * (p as i32);
                }
            }
        } else {
            pips += ((-self.points[O_BAR]).max(0) as i32) * 25;
            for p in 1..=24 {
                if self.points[p] < 0 {
                    pips += (-self.points[p] as i32) * ((25 - p) as i32);
                }
            }
        }
        pips
    }

    #[inline(always)]
    pub fn can_bear_off(&self, player: i8) -> bool {
        if player == PLAYER_X {
            if self.points[X_BAR] > 0 {
                return false;
            }
            for p in 7..=24 {
                if self.points[p] > 0 {
                    return false;
                }
            }
        } else {
            if self.points[O_BAR] < 0 {
                return false;
            }
            for p in 1..=18 {
                if self.points[p] < 0 {
                    return false;
                }
            }
        }
        true
    }

    pub fn apply_move(&self, m: Move, player: i8) -> Self {
        let mut next = *self;
        let from = m.from as usize;
        let to = m.to as usize;

        // Décrémente départ
        if player == PLAYER_X {
            next.points[from] -= 1;
        } else {
            next.points[from] += 1;
        }

        // Si arrivée sur le plateau
        if to >= 1 && to <= 24 {
            if player == PLAYER_X {
                // Si blot adverse, on l'envoie sur la barre O (points[25])
                if next.points[to] == -1 {
                    next.points[to] = 0;
                    next.points[O_BAR] -= 1;
                }
                next.points[to] += 1;
            } else {
                // Pour O, blot adverse X sur points[0]
                if next.points[to] == 1 {
                    next.points[to] = 0;
                    next.points[X_BAR] += 1;
                }
                next.points[to] -= 1;
            }
        }
        next
    }
}

/// Séquence de coups légale (jusqu'à 4 coups pour un double).
#[derive(Clone, Copy, Debug)]
pub struct LegalMoveSequence {
    pub moves: [Move; 4],
    pub count: u8,
    pub resulting_board: Board,
}

impl LegalMoveSequence {
    pub const fn empty(board: Board) -> Self {
        Self {
            moves: [Move { from: 0, to: 0 }; 4],
            count: 0,
            resulting_board: board,
        }
    }
}

/// Générateur sans allocation mémoire sur le tas pour les coups légaux d'un lancer de dés.
pub fn generate_moves(board: &Board, d1: u8, d2: u8, player: i8) -> Vec<LegalMoveSequence> {
    let mut sequences = Vec::with_capacity(64);
    let is_double = d1 == d2;
    let dice = if is_double {
        [d1, d1, d1, d1]
    } else {
        [d1, d2, 0, 0]
    };
    let num_dice: usize = if is_double { 4 } else { 2 };

    let mut current_moves = [Move { from: 0, to: 0 }; 4];
    let mut max_used = 0u8;

    if is_double {
        explore_moves(board, player, &dice[0..4], 0, &mut current_moves, 0, &mut sequences, &mut max_used);
    } else {
        let order1 = [d1, d2];
        let order2 = [d2, d1];
        explore_moves(board, player, &order1, 0, &mut current_moves, 0, &mut sequences, &mut max_used);
        explore_moves(board, player, &order2, 0, &mut current_moves, 0, &mut sequences, &mut max_used);
    }

    // Filtrage pour ne conserver que les séquences utilisant le maximum de dés
    sequences.retain(|s| s.count == max_used);

    // Déduplication par plateau résultant
    sequences.sort_by_key(|s| s.resulting_board.points);
    sequences.dedup_by(|a, b| a.resulting_board.points == b.resulting_board.points);

    if sequences.is_empty() {
        sequences.push(LegalMoveSequence::empty(*board));
    }
    sequences
}

fn explore_moves(
    b: &Board,
    player: i8,
    dice: &[u8],
    dice_idx: usize,
    cur_moves: &mut [Move; 4],
    moves_count: u8,
    out: &mut Vec<LegalMoveSequence>,
    max_used: &mut u8,
) {
    if dice_idx >= dice.len() {
        if moves_count > *max_used {
            *max_used = moves_count;
        }
        out.push(LegalMoveSequence {
            moves: *cur_moves,
            count: moves_count,
            resulting_board: *b,
        });
        return;
    }

    let die = dice[dice_idx];
    let mut any_move = false;

    // Si pion sur la barre, DOIT rentrer
    let bar_checkers = if player == PLAYER_X {
        b.points[X_BAR]
    } else {
        -b.points[O_BAR]
    };

    if bar_checkers > 0 {
        let target = if player == PLAYER_X {
            25 - (die as usize)
        } else {
            die as usize
        };
        if is_point_open(b, target, player) {
            let from_pt = if player == PLAYER_X { X_BAR } else { O_BAR };
            let m = Move { from: from_pt as u8, to: target as u8 };
            let nb = b.apply_move(m, player);
            cur_moves[moves_count as usize] = m;
            explore_moves(&nb, player, dice, dice_idx + 1, cur_moves, moves_count + 1, out, max_used);
            any_move = true;
        }
    } else {
        let can_bear = b.can_bear_off(player);

        for p in 1..=24 {
            let cnt = if player == PLAYER_X { b.points[p] } else { -b.points[p] };
            if cnt <= 0 {
                continue;
            }

            // Mouvement normal ou sortie
            if player == PLAYER_X {
                if (p as u8) > die {
                    let to = p - (die as usize);
                    if is_point_open(b, to, player) {
                        let m = Move { from: p as u8, to: to as u8 };
                        let nb = b.apply_move(m, player);
                        cur_moves[moves_count as usize] = m;
                        explore_moves(&nb, player, dice, dice_idx + 1, cur_moves, moves_count + 1, out, max_used);
                        any_move = true;
                    }
                } else if can_bear {
                    let is_exact = (p as u8) == die;
                    let is_highest = p == highest_point(b, player);
                    if is_exact || is_highest {
                        let m = Move { from: p as u8, to: X_OFF as u8 };
                        let nb = b.apply_move(m, player);
                        cur_moves[moves_count as usize] = m;
                        explore_moves(&nb, player, dice, dice_idx + 1, cur_moves, moves_count + 1, out, max_used);
                        any_move = true;
                    }
                }
            } else {
                // Player O
                if (p as u8) + die <= 24 {
                    let to = p + (die as usize);
                    if is_point_open(b, to, player) {
                        let m = Move { from: p as u8, to: to as u8 };
                        let nb = b.apply_move(m, player);
                        cur_moves[moves_count as usize] = m;
                        explore_moves(&nb, player, dice, dice_idx + 1, cur_moves, moves_count + 1, out, max_used);
                        any_move = true;
                    }
                } else if can_bear {
                    let is_exact = (25 - p) as u8 == die;
                    let is_highest = p == lowest_point_o(b);
                    if is_exact || is_highest {
                        let m = Move { from: p as u8, to: O_OFF as u8 };
                        let nb = b.apply_move(m, player);
                        cur_moves[moves_count as usize] = m;
                        explore_moves(&nb, player, dice, dice_idx + 1, cur_moves, moves_count + 1, out, max_used);
                        any_move = true;
                    }
                }
            }
        }
    }

    if !any_move {
        // Enregistre la séquence terminale avec les coups joués jusqu'ici
        if moves_count > *max_used {
            *max_used = moves_count;
        }
        out.push(LegalMoveSequence {
            moves: *cur_moves,
            count: moves_count,
            resulting_board: *b,
        });
    }
}

#[inline(always)]
fn is_point_open(b: &Board, point: usize, player: i8) -> bool {
    if player == PLAYER_X {
        b.points[point] >= -1
    } else {
        b.points[point] <= 1
    }
}

fn highest_point(b: &Board, player: i8) -> usize {
    if player == PLAYER_X {
        for p in (1..=24).rev() {
            if b.points[p] > 0 {
                return p;
            }
        }
    }
    0
}

fn lowest_point_o(b: &Board) -> usize {
    for p in 1..=24 {
        if b.points[p] < 0 {
            return p;
        }
    }
    25
}
