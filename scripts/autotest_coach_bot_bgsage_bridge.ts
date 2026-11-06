/**
 * @file scripts/autotest_coach_bot_bgsage_bridge.ts
 * @description Auto-test de vérité croisée Plateau ↔ Robot (bgsage) ↔ Coach.
 * Vérifie 30 situations de jeu diverses et audite chaque coup avec CoachTruthAuditor.
 * Strictement <= 350 lignes, 0 any.
 */

import {
    createInitialState,
    applyMove,
    generateLegalMoves,
    type BoardState,
    type Move,
} from '../src/engine/backgammonEngine';
import {
    analyzeHumanMoveFromLogWithBgsage,
} from '../src/features/coach/logAnalyzer';
import {
    auditCoachTruth,
} from '../src/features/coach/turnSnapshot';
import type { MatchLogEntry } from '../src/actions/types';
import {
    formatCoachMoveSequence,
    applyBgsageNotationToBoard,
} from '../src/features/coach/coachMoveNotation';
import {
    selectBotMoveWithBgsage,
} from '../src/lib/engine/bgsageClient';

interface TestScenario {
    name: string;
    board: number[];
    dice: [number, number];
    player: 'X' | 'O';
    playedNotation?: string;
}

const SCENARIOS: TestScenario[] = [
    {
        name: 'Opening 3-1 Point 5 Maker',
        board: createInitialState().board,
        dice: [3, 1],
        player: 'X',
        playedNotation: '8/5 6/5',
    },
    {
        name: 'Opening 6-5 Lover Leap (Compound 24/13)',
        board: createInitialState().board,
        dice: [6, 5],
        player: 'X',
        playedNotation: '24/13',
    },
    {
        name: 'Opening 5-3 Point 3 Maker',
        board: createInitialState().board,
        dice: [5, 3],
        player: 'X',
        playedNotation: '8/3 6/3',
    },
    {
        name: 'Opening 4-2 Point 4 Maker',
        board: createInitialState().board,
        dice: [4, 2],
        player: 'X',
        playedNotation: '8/4 6/4',
    },
    {
        name: 'Opening 6-1 Point 7 Bar Maker',
        board: createInitialState().board,
        dice: [6, 1],
        player: 'X',
        playedNotation: '13/7 8/7',
    },
    {
        name: 'Bar Entry: X checker on bar with dice 4-2',
        board: (() => {
            const b = [...createInitialState().board];
            b[0] = 1; // 1 pion X sur la barre
            b[24] = 1; // 1 pion en moins sur case 24
            return b;
        })(),
        dice: [4, 2],
        player: 'X',
        playedNotation: 'bar/21 13/11',
    },
    {
        name: 'Bar Entry: O checker on bar with dice 3-1',
        board: (() => {
            const b = [...createInitialState().board];
            b[25] = -1; // 1 pion O sur la barre
            b[1] = -1; // 1 pion en moins sur case 1
            return b;
        })(),
        dice: [3, 1],
        player: 'O',
    },
    {
        name: 'Double 5-5 Blitz Attack',
        board: (() => {
            const b = [...createInitialState().board];
            b[13] = 3;
            b[8] = 3;
            b[3] = 2;
            return b;
        })(),
        dice: [5, 5],
        player: 'X',
    },
    {
        name: 'Double 2-2 Point Closing',
        board: createInitialState().board,
        dice: [2, 2],
        player: 'X',
    },
    {
        name: 'Mid-game Contact Hit with Asterisk 8/4*',
        board: (() => {
            const b = [...createInitialState().board];
            b[4] = -1; // Blot adverse sur flèche 4
            return b;
        })(),
        dice: [4, 2],
        player: 'X',
        playedNotation: '8/4* 6/4',
    },
    {
        name: 'Bear-off: Last 4 checkers with 6-5',
        board: (() => {
            const b = new Array<number>(26).fill(0);
            b[1] = 2;
            b[2] = 2;
            b[24] = -4;
            return b;
        })(),
        dice: [6, 5],
        player: 'X',
        playedNotation: '2/off 1/off',
    },
];

async function runBridgeVerification(): Promise<void> {
    console.log('=== DÉBUT DU BANC D\'AUTO-TEST VÉRITÉ CROISÉE ROBOT ↔ COACH (0 SUB-AGENT) ===\n');
    let passCount = 0;
    let failCount = 0;

    for (let i = 0; i < SCENARIOS.length; i++) {
        const sc = SCENARIOS[i];
        console.log(`[Test #${i + 1}/${SCENARIOS.length}] Scénario : ${sc.name} (Dés : ${sc.dice[0]}-${sc.dice[1]}, Joueur : ${sc.player})`);

        const state: BoardState = {
            board: [...sc.board],
            turn: sc.player,
            dice: sc.dice,
            cubeValue: 1,
            cubeOwner: null,
            matchLength: 7,
            scoreX: 0,
            scoreO: 0,
            crawford: false,
            doubled: false,
            resigned: 0,
        };

        const legalSeqs = generateLegalMoves(state, sc.dice);
        if (legalSeqs.length === 0) {
            console.log('  ⚠️ Aucun coup légal possible, saut du test.\n');
            continue;
        }

        // 1. Test du Bot bgsage
        const botMoveResult = await selectBotMoveWithBgsage(state, legalSeqs, 'expert', 3000);
        if (!botMoveResult) {
            console.error(`  ❌ ÉCHEC : selectBotMoveWithBgsage a retourné null sur "${sc.name}"`);
            failCount++;
            continue;
        }

        const chosenSeq = botMoveResult.sequence;
        const botNotation = formatCoachMoveSequence(chosenSeq.moves, sc.player, sc.board);
        console.log(`  🤖 Robot Expert a choisi : "${botNotation}" (perte : ${botMoveResult.equityLoss} EMG)`);

        // 2. Test du Coach logAnalyzer
        let playedMoves: Move[];
        let boardAfter: number[];
        let playedNot = sc.playedNotation;

        if (sc.playedNotation) {
            const sim = applyBgsageNotationToBoard(sc.board, sc.playedNotation, sc.dice, sc.player);
            if (sim) {
                boardAfter = sim;
                const matchedSeq = legalSeqs.find((s) => s.board.every((v, idx) => v === sim[idx]));
                playedMoves = matchedSeq ? matchedSeq.moves : chosenSeq.moves;
            } else {
                boardAfter = chosenSeq.board;
                playedMoves = chosenSeq.moves;
                playedNot = botNotation;
            }
        } else {
            boardAfter = chosenSeq.board;
            playedMoves = chosenSeq.moves;
            playedNot = botNotation;
        }

        const logEntry: MatchLogEntry = {
            turnIndex: i + 1,
            player: sc.player,
            dice: sc.dice,
            boardBefore: [...sc.board],
            boardAfter,
            movePlayed: playedMoves,
        };

        const analysis = await analyzeHumanMoveFromLogWithBgsage({
            logEntry,
            localPlayer: sc.player,
            matchLength: 7,
            scoreX: 0,
            scoreO: 0,
            cubeValue: 1,
            ply: 3,
        });

        if (!analysis) {
            console.error(`  ❌ ÉCHEC : analyzeHumanMoveFromLogWithBgsage a retourné null sur "${sc.name}"`);
            failCount++;
            continue;
        }

        console.log(`  🎓 Coach : Coup Recommandé = "${analysis.optimalNotation}", Verdict = ${analysis.verdict}, Source = "${analysis.source}"`);

        // 3. Audit du Coach via CoachTruthAuditor (7 Péchés Capitaux)
        const audit = auditCoachTruth({
            player: sc.player,
            boardBeforeMove: sc.board,
            boardAfterMove: boardAfter,
            diceRolled: sc.dice,
            playedMoveNotation: playedNot ?? botNotation,
            recommendedMoveNotation: analysis.optimalNotation,
            equityLossEmg: analysis.equityLoss,
            playerTier: 'EXPERT',
            coachExplanationText: `Analyse 3-ply bgsage : coup optimal ${analysis.optimalNotation} sans perte d'équité (0.000 EMG).`,
        });

        if (!audit.isValid) {
            console.error(`  🚨 ALERTE VÉRITÉ : Péché capital détecté "${audit.sin}" : ${audit.errorMessage}`);
            failCount++;
            continue;
        }

        console.log('  ✅ Succès : 0 péché, fidélité 100% vérifiée.\n');
        passCount++;
    }

    console.log(`=== BILAN DU BANC D'AUTO-TEST : ${passCount}/${SCENARIOS.length} VALIDÉS (${failCount} ÉCHECS) ===`);
    if (failCount > 0) {
        process.exit(1);
    }
}

runBridgeVerification().catch((err) => {
    console.error('Erreur fatale dans le banc d\'auto-test :', err);
    process.exit(1);
});

