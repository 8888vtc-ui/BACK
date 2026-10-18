//! Algorithme de recherche Expectiminimax 2-ply avec élagage (Pruning).
//! Conforme au cahier des charges :
//! - 0-ply : évalue tous les coups légaux et retient le Top 8.
//! - 1-ply : balaye les 21 tirages de dés adverses pondérés (1/36 pour doubles, 2/36 pour simples).
//! - 2-ply : évalue la meilleure réplique adverse et retourne l'équité cubeless exacte.

use crate::bitboard::{generate_moves, Board, LegalMoveSequence, Move};
use crate::mlp::{EvaluationProbabilities, TriPhaseEngine};

pub const DISTINCT_ROLLS: [(u8, u8, f32); 21] = [
    (1, 1, 1.0 / 36.0), (2, 2, 1.0 / 36.0), (3, 3, 1.0 / 36.0),
    (4, 4, 1.0 / 36.0), (5, 5, 1.0 / 36.0), (6, 6, 1.0 / 36.0),
    (2, 1, 2.0 / 36.0), (3, 1, 2.0 / 36.0), (4, 1, 2.0 / 36.0),
    (5, 1, 2.0 / 36.0), (6, 1, 2.0 / 36.0), (3, 2, 2.0 / 36.0),
    (4, 2, 2.0 / 36.0), (5, 2, 2.0 / 36.0), (6, 2, 2.0 / 36.0),
    (4, 3, 2.0 / 36.0), (5, 3, 2.0 / 36.0), (6, 3, 2.0 / 36.0),
    (5, 4, 2.0 / 36.0), (6, 4, 2.0 / 36.0), (6, 5, 2.0 / 36.0),
];

#[derive(Clone, Copy, Debug)]
pub struct ScoredMove {
    pub moves: [Move; 4],
    pub count: u8,
    pub board: Board,
    pub equity: f32,
    pub probs: EvaluationProbabilities,
}

pub struct SearchEngine<'a> {
    pub engine: &'a TriPhaseEngine,
}

impl<'a> SearchEngine<'a> {
    pub fn new(engine: &'a TriPhaseEngine) -> Self {
        Self { engine }
    }

    /// Recherche 0-ply (évaluation directe de tous les coups légaux).
    pub fn search_0ply(&self, board: &Board, d1: u8, d2: u8, player: i8) -> Vec<ScoredMove> {
        let legal_seqs = generate_moves(board, d1, d2, player);
        let mut scored: Vec<ScoredMove> = legal_seqs
            .into_iter()
            .map(|seq| {
                let probs = self.engine.evaluate(&seq.resulting_board, player);
                ScoredMove {
                    moves: seq.moves,
                    count: seq.count,
                    board: seq.resulting_board,
                    equity: probs.cubeless_equity,
                    probs,
                }
            })
            .collect();

        // Tri décroissant par équité
        scored.sort_by(|a, b| b.equity.partial_cmp(&a.equity).unwrap_or(std::cmp::Ordering::Equal));
        scored
    }

    /// Recherche 2-ply avec élagage (Expectiminimax).
    /// Filtre sur le Top 8 candidats 0-ply, puis explore les 21 tirages de l'adversaire.
    pub fn search_2ply(&self, board: &Board, d1: u8, d2: u8, player: i8) -> Vec<ScoredMove> {
        let candidates_0ply = self.search_0ply(board, d1, d2, player);
        if candidates_0ply.is_empty() {
            return Vec::new();
        }

        // Rétention des 8 meilleurs coups 0-ply
        let top_candidates: Vec<ScoredMove> = candidates_0ply.into_iter().take(8).collect();
        let opp = -player;

        let mut scored_2ply = Vec::with_capacity(top_candidates.len());
        let mut best_alpha = f32::NEG_INFINITY;

        for cand in top_candidates {
            let mut expected_equity = 0.0f32;
            let mut prunable = false;

            // Exploration des 21 lancers adverses
            for (roll_idx, &(opp_d1, opp_d2, weight)) in DISTINCT_ROLLS.iter().enumerate() {
                let opp_moves = generate_moves(&cand.board, opp_d1, opp_d2, opp);

                // L'adversaire choisit le coup qui maximise son équité (minimise la nôtre)
                let mut best_opp_equity = f32::NEG_INFINITY;
                for opp_seq in &opp_moves {
                    let opp_eval = self.engine.evaluate(&opp_seq.resulting_board, opp);
                    if opp_eval.cubeless_equity > best_opp_equity {
                        best_opp_equity = opp_eval.cubeless_equity;
                    }
                }

                // Notre équité face au meilleur coup adverse est l'inverse
                let our_equity_on_reply = -best_opp_equity;
                expected_equity += weight * our_equity_on_reply;

                // Élagage dynamique : si même en supposant +1.0 sur les lancers restants on ne peut pas battre alpha
                let remaining_weight: f32 = DISTINCT_ROLLS[roll_idx + 1..].iter().map(|r| r.2).sum();
                let upper_bound = expected_equity + remaining_weight * 1.5;
                if upper_bound < best_alpha - 0.25 {
                    prunable = true;
                    break;
                }
            }

            let final_equity = if prunable { expected_equity } else { expected_equity };
            if final_equity > best_alpha {
                best_alpha = final_equity;
            }

            let mut final_probs = cand.probs;
            final_probs.cubeless_equity = final_equity;

            scored_2ply.push(ScoredMove {
                moves: cand.moves,
                count: cand.count,
                board: cand.board,
                equity: final_equity,
                probs: final_probs,
            });
        }

        scored_2ply.sort_by(|a, b| b.equity.partial_cmp(&a.equity).unwrap_or(std::cmp::Ordering::Equal));
        scored_2ply
    }
}
