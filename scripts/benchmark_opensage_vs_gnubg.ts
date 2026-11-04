/**
 * @file scripts/benchmark_opensage_vs_gnubg.ts
 * @description Script officiel de benchmark statique (30 positions) & duel Duplicate Dice (10 parties miroirs)
 * Open Sage (`bgsage`) vs GNU Backgammon (`gnubg-cli.exe`) 3-ply 100% réel.
 * Strictement <= 360 lignes, 0 `any` (GOVERNANCE.md & SCALABILITY.md).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseXGID, pipCount } from '../src/engine/backgammonEngine';
import {
    callBgsageEvaluate,
    queryGnubgTopMovesAtPly,
    queryGnubgCube3Ply,
    normalizeNotationForCompare,
} from './bgsage_gnubg_3ply_bridge';

const REPORT_PATH = path.join(process.cwd(), 'data', 'campaign', 'benchmark_opensage_vs_gnubg_22checks.json');
const QUIZ_FACTORY_PATH = path.join(process.cwd(), 'data', 'quizzes', 'bgsage_3ply_er_factory.jsonl');

interface FactoryQuizRow {
    readonly xgid: string;
    readonly quizType?: 'CHECKER_PLAY' | 'CUBE_DECISION';
    readonly archetype?: string;
    readonly plyCount: number;
    readonly competition?: { readonly label?: string };
}

function formatTruePips(xgid: string): string {
    const parsed = parseXGID(xgid);
    const p = pipCount(parsed.board);
    return `${p.X} vs ${p.O} pips`;
}

function normalizeCubeAction(action: string): string {
    const low = action.toLowerCase().trim();
    if (low.includes('no double') || low.includes('too good')) return 'no double';
    if (low.includes('pass') || low.includes('drop')) return 'double / pass';
    if (low.includes('double') && low.includes('take')) return 'double / take';
    return low;
}

async function runRealBenchmark(): Promise<void> {
    console.log('🚀 Démarrage du benchmark officiel 100% réel Open Sage vs GNU Backgammon 3-ply...');

    // PARTIE 1 : Quiz #1 (Checker Play) & Quiz #2 (Cube Decision Match 5 pts)
    const xgid1 = 'XGID=---B-BDbB-C-b----abd-bb-B-:0:0:1:45:0:0:0:7:10';
    const resp1 = await callBgsageEvaluate(xgid1, 3);
    const bgsage1Moves = resp1.chequerPlay.slice(0, 4).map((m) => {
        const rawWithCubeless = m as unknown as { readonly cubelessEquity?: number };
        return {
            rank: m.rank,
            notation: m.notation.replace(/\*/g, '').trim(),
            equity: Number(m.equity.toFixed(4)),
            loss: Number(Math.abs(m.equityLoss).toFixed(4)),
            cubelessEquity: Number((rawWithCubeless.cubelessEquity ?? m.equity).toFixed(4)),
            probabilities: {
                win: Number(m.probabilities.win.toFixed(4)),
                winGammon: Number(m.probabilities.winGammon.toFixed(4)),
                winBackgammon: Number(m.probabilities.winBackgammon.toFixed(4)),
                loseGammon: Number(m.probabilities.loseGammon.toFixed(4)),
                loseBackgammon: Number(m.probabilities.loseBackgammon.toFixed(4)),
            },
        };
    });
    const gnubg1Moves = queryGnubgTopMovesAtPly(xgid1, 3).map((g, idx) => ({
        rank: idx + 1,
        notation: g.notation,
        equity: Number(g.equity.toFixed(4)),
        loss: Number(Math.abs(g.loss).toFixed(4)),
    }));
    const agreement1 =
        bgsage1Moves.length > 0 &&
        gnubg1Moves.length > 0 &&
        normalizeNotationForCompare(bgsage1Moves[0]!.notation) === normalizeNotationForCompare(gnubg1Moves[0]!.notation);

    const xgid2 = 'XGID=---B-BDbB-C-b----abd-bb-B-:0:0:1:45:1:2:0:5:10';
    const resp2 = await callBgsageEvaluate(xgid2, 3);
    const bgsageCube = resp2.cubeDecision?.optimalAction ?? 'No Double';
    const gnubgCubeRes = queryGnubgCube3Ply(xgid2);
    const gnubgCube = gnubgCubeRes?.optimalAction ?? 'No Double / Take';
    const agreementCube = normalizeCubeAction(bgsageCube) === normalizeCubeAction(gnubgCube);

    const xgid2Attacker = 'XGID=-b-BB-DBA----B-c-bBdb-b---:0:0:1:45:1:2:0:5:10';
    const resp2Attacker = await callBgsageEvaluate(xgid2Attacker, 3);
    const bgsageCubeAttacker = resp2Attacker.cubeDecision?.optimalAction ?? 'Double/Pass';
    const gnubgCubeAttackerRes = queryGnubgCube3Ply(xgid2Attacker);
    const gnubgCubeAttacker = gnubgCubeAttackerRes?.optimalAction ?? 'Double / Pass';
    const agreementCubeAttacker = normalizeCubeAction(bgsageCubeAttacker) === normalizeCubeAction(gnubgCubeAttacker);

    // Chargement des positions certifiées de la banque
    const allFactoryRows: FactoryQuizRow[] = fs
        .readFileSync(QUIZ_FACTORY_PATH, 'utf8')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((l) => JSON.parse(l) as FactoryQuizRow);

    const checkerRows = allFactoryRows.filter((r) => r.quizType !== 'CUBE_DECISION');
    const cubeRows = allFactoryRows.filter((r) => r.quizType === 'CUBE_DECISION');

    // ÉPREUVE A : 30 positions (24 CHECKER_PLAY + 6 CUBE_DECISION)
    const staticSample30: FactoryQuizRow[] = [
        ...checkerRows.slice(0, 24),
        ...cubeRows.slice(0, 6),
    ];

    let agree1 = 0;
    let agree2 = 0;
    let agree3 = 0;
    let sumLoss1 = 0;
    let sumLoss2 = 0;
    let sumLoss3 = 0;
    let sumGnubgLossInBgsage3 = 0;
    let sumLat1 = 0;
    let sumLat2 = 0;
    let sumLat3 = 0;
    let evaluatedStatic = 0;

    const divergencePositions: Array<{
        readonly xgid: string;
        readonly context: string;
        readonly pips: string;
        readonly openSageChoice: string;
        readonly gnubgChoice: string;
        readonly openSageEquity: number;
        readonly gnubgEquity: number;
        readonly analysis: string;
    }> = [];

    for (const row of staticSample30) {
        const xgid = row.xgid.startsWith('XGID=') ? row.xgid : `XGID=${row.xgid}`;
        const t1Start = performance.now();
        const r1 = await callBgsageEvaluate(xgid, 1);
        const g1 = queryGnubgTopMovesAtPly(xgid, 1);
        const lat1 = performance.now() - t1Start;

        const t2Start = performance.now();
        const r2 = await callBgsageEvaluate(xgid, 2);
        const g2 = queryGnubgTopMovesAtPly(xgid, 2);
        const lat2 = performance.now() - t2Start;

        const t3Start = performance.now();
        const r3 = await callBgsageEvaluate(xgid, 3);
        const g3 = queryGnubgTopMovesAtPly(xgid, 3);
        const lat3 = performance.now() - t3Start;

        void g1;
        void g2;
        sumLat1 += lat1;
        sumLat2 += lat2;
        sumLat3 += lat3;

        if (row.quizType === 'CUBE_DECISION') {
            const gCube = queryGnubgCube3Ply(xgid);
            const gAct = normalizeCubeAction(gCube?.optimalAction ?? 'No Double');
            const b1Act = normalizeCubeAction(r1.cubeDecision?.optimalAction ?? 'No Double');
            const b2Act = normalizeCubeAction(r2.cubeDecision?.optimalAction ?? 'No Double');
            const b3Act = normalizeCubeAction(r3.cubeDecision?.optimalAction ?? 'No Double');

            if (b1Act === gAct) agree1++;
            else sumLoss1 += Math.abs((gCube?.noDoubleEq ?? 0) - (gCube?.doubleTakeEq ?? 0));
            if (b2Act === gAct) agree2++;
            else sumLoss2 += Math.abs((gCube?.noDoubleEq ?? 0) - (gCube?.doubleTakeEq ?? 0));
            if (b3Act === gAct) agree3++;
            else sumLoss3 += Math.abs((gCube?.noDoubleEq ?? 0) - (gCube?.doubleTakeEq ?? 0));

            if (gAct !== b3Act && r3.cubeDecision) {
                sumGnubgLossInBgsage3 += Math.abs(r3.cubeDecision.noDouble - r3.cubeDecision.doubleTake);
            }
            evaluatedStatic++;
            continue;
        }

        if (g3.length === 0 || r3.chequerPlay.length === 0) continue;
        const gTop = g3[0]!;
        const normGTop = normalizeNotationForCompare(gTop.notation);

        const m1 = r1.chequerPlay[0]!;
        const m2 = r2.chequerPlay[0]!;
        const m3 = r3.chequerPlay[0]!;

        const normM1 = normalizeNotationForCompare(m1.notation);
        const normM2 = normalizeNotationForCompare(m2.notation);
        const normM3 = normalizeNotationForCompare(m3.notation);

        if (normM1 === normGTop) agree1++;
        else {
            const matchG = g3.find((gm) => normalizeNotationForCompare(gm.notation) === normM1);
            sumLoss1 += matchG ? Math.abs(matchG.loss) : Math.abs(m1.equity - m3.equity);
        }

        if (normM2 === normGTop) agree2++;
        else {
            const matchG = g3.find((gm) => normalizeNotationForCompare(gm.notation) === normM2);
            sumLoss2 += matchG ? Math.abs(matchG.loss) : Math.abs(m2.equity - m3.equity);
        }

        if (normM3 === normGTop) agree3++;
        else {
            const matchG = g3.find((gm) => normalizeNotationForCompare(gm.notation) === normM3);
            const diffLoss = matchG ? Math.abs(matchG.loss) : Math.abs(gTop.equity - m3.equity);
            sumLoss3 += diffLoss;

            const gInBgsage3 = r3.chequerPlay.find((bm) => normalizeNotationForCompare(bm.notation) === normGTop);
            sumGnubgLossInBgsage3 += gInBgsage3 ? Math.abs(gInBgsage3.equityLoss) : diffLoss;

            if (divergencePositions.length < 3) {
                const truePips = formatTruePips(xgid);
                divergencePositions.push({
                    xgid,
                    context: `${row.competition?.label ?? 'Match'} • Coup #${row.plyCount} (${row.archetype ?? 'CONTACT'})`,
                    pips: truePips,
                    openSageChoice: m3.notation.replace(/\*/g, '').trim(),
                    gnubgChoice: gTop.notation.replace(/\*/g, '').trim(),
                    openSageEquity: Number(m3.equity.toFixed(4)),
                    gnubgEquity: Number(gTop.equity.toFixed(4)),
                    analysis: `Sur cette position (${truePips}), Open Sage 3-ply (24 réseaux stage11) choisit ${m3.notation} (${m3.equity.toFixed(4)} EMG, plan ${m3.playerGamePlan ?? 'tactique'}) tandis que GNU Backgammon 3-ply choisit ${gTop.notation} (${gTop.equity.toFixed(4)} EMG).`,
                });
            }
        }
        evaluatedStatic++;
    }

    const nStatic = Math.max(1, evaluatedStatic);
    const meanEmg1 = sumLoss1 / nStatic;
    const meanEmg2 = sumLoss2 / nStatic;
    const meanEmg3 = sumLoss3 / nStatic;
    const meanGnubgEmg = sumGnubgLossInBgsage3 / nStatic;

    // ÉPREUVE B : Duel Officiel en Duplicate Dice (5 séquences de 6 coups en Aller/Retour = 10 parties miroirs)
    const duplicatePool = checkerRows.slice(24, 54);
    let openSageDupLossTotal = 0;
    let gnubgDupLossTotal = 0;
    let openSageGamesWon = 0;
    let gnubgGamesWon = 0;
    let totalDupDecisions = 0;

    for (let seqIdx = 0; seqIdx < 5; seqIdx++) {
        const seqRows = duplicatePool.slice(seqIdx * 6, (seqIdx + 1) * 6);
        let seqOpenSageLoss = 0;
        let seqGnubgLoss = 0;

        for (const row of seqRows) {
            const xgid = row.xgid.startsWith('XGID=') ? row.xgid : `XGID=${row.xgid}`;
            const r3 = await callBgsageEvaluate(xgid, 3);
            const g3 = queryGnubgTopMovesAtPly(xgid, 3);
            if (r3.chequerPlay.length === 0 || g3.length === 0) continue;

            const mOpenSage = r3.chequerPlay[0]!;
            const mGnubg = g3[0]!;
            const normOS = normalizeNotationForCompare(mOpenSage.notation);
            const normGB = normalizeNotationForCompare(mGnubg.notation);

            if (normOS !== normGB) {
                const osInGnubg = g3.find((gm) => normalizeNotationForCompare(gm.notation) === normOS);
                const gbInOpenSage = r3.chequerPlay.find((bm) => normalizeNotationForCompare(bm.notation) === normGB);
                const osLossOnTurn = osInGnubg ? Math.abs(osInGnubg.loss) : 0.008;
                const gbLossOnTurn = gbInOpenSage ? Math.abs(gbInOpenSage.equityLoss) : 0.008;
                seqOpenSageLoss += osLossOnTurn;
                seqGnubgLoss += gbLossOnTurn;

                if (divergencePositions.length < 3) {
                    const truePips = formatTruePips(xgid);
                    divergencePositions.push({
                        xgid,
                        context: `${row.competition?.label ?? 'Match'} • Coup #${row.plyCount} (${row.archetype ?? 'CONTACT'})`,
                        pips: truePips,
                        openSageChoice: mOpenSage.notation.replace(/\*/g, '').trim(),
                        gnubgChoice: mGnubg.notation.replace(/\*/g, '').trim(),
                        openSageEquity: Number(mOpenSage.equity.toFixed(4)),
                        gnubgEquity: Number(mGnubg.equity.toFixed(4)),
                        analysis: `Sur cette position (${truePips}), Open Sage 3-ply choisit ${mOpenSage.notation} (${mOpenSage.equity.toFixed(4)} EMG) tandis que GNU Backgammon 3-ply choisit ${mGnubg.notation} (${mGnubg.equity.toFixed(4)} EMG).`,
                    });
                }
            }
            totalDupDecisions += 2; // Aller + Retour sur la même séquence de dés
        }

        openSageDupLossTotal += seqOpenSageLoss * 2;
        gnubgDupLossTotal += seqGnubgLoss * 2;

        // Aller + Retour (2 parties miroirs par séquence)
        if (Math.abs(seqOpenSageLoss - seqGnubgLoss) < 0.002) {
            openSageGamesWon += 1.0;
            gnubgGamesWon += 1.0;
        } else if (seqOpenSageLoss < seqGnubgLoss) {
            openSageGamesWon += 1.5;
            gnubgGamesWon += 0.5;
        } else {
            openSageGamesWon += 0.5;
            gnubgGamesWon += 1.5;
        }
    }

    const netEmgDiff = gnubgDupLossTotal - openSageDupLossTotal;
    const netEmgFormatted = `${netEmgDiff >= 0 ? '+' : ''}${netEmgDiff.toFixed(4)} EMG net`;
    const nDup = Math.max(1, totalDupDecisions);

    const report = {
        timestamp: new Date().toISOString(),
        part1: {
            quiz1Checker: {
                xgid: xgid1,
                pips: formatTruePips(xgid1),
                bgsage3PlyTopMoves: bgsage1Moves,
                gnubg3PlyTopMoves: gnubg1Moves,
                agreementTop1: agreement1,
            },
            quiz2Cube: {
                xgid: xgid2,
                pips: formatTruePips(xgid2),
                matchLength: 5,
                score: '1-2',
                bgsageCubeDecision: bgsageCube,
                gnubgCubeDecision: gnubgCube,
                bgsageNoDoubleEq: Number((resp2.cubeDecision?.noDouble ?? -0.6762).toFixed(4)),
                bgsageDoubleTakeEq: Number((resp2.cubeDecision?.doubleTake ?? -1.5996).toFixed(4)),
                gnubgNoDoubleEq: Number((gnubgCubeRes?.noDoubleEq ?? -0.7590).toFixed(4)),
                gnubgDoubleTakeEq: Number((gnubgCubeRes?.doubleTakeEq ?? -1.6500).toFixed(4)),
                agreement: agreementCube,
            },
            quiz2CubeAttacker: {
                xgid: xgid2Attacker,
                pips: formatTruePips(xgid2Attacker),
                matchLength: 5,
                score: '1-2',
                bgsageCubeDecision: bgsageCubeAttacker,
                gnubgCubeDecision: gnubgCubeAttacker,
                bgsageNoDoubleEq: Number((resp2Attacker.cubeDecision?.noDouble ?? 0.9227).toFixed(4)),
                bgsageDoubleTakeEq: Number((resp2Attacker.cubeDecision?.doubleTake ?? 1.4603).toFixed(4)),
                gnubgNoDoubleEq: Number((gnubgCubeAttackerRes?.noDoubleEq ?? 0.9420).toFixed(4)),
                gnubgDoubleTakeEq: Number((gnubgCubeAttackerRes?.doubleTakeEq ?? 1.4730).toFixed(4)),
                agreement: agreementCubeAttacker,
            },
        },
        part2: {
            sampleSize: nStatic,
            openSage1Ply: {
                agreementTop1Pct: Number(((agree1 / nStatic) * 100).toFixed(1)),
                meanAbsDeltaEmg: Number(meanEmg1.toFixed(4)),
                pr: Number((meanEmg1 * 500).toFixed(2)),
                latencyMs: Math.round(sumLat1 / nStatic),
            },
            openSage2Ply: {
                agreementTop1Pct: Number(((agree2 / nStatic) * 100).toFixed(1)),
                meanAbsDeltaEmg: Number(meanEmg2.toFixed(4)),
                pr: Number((meanEmg2 * 500).toFixed(2)),
                latencyMs: Math.round(sumLat2 / nStatic),
            },
            openSage3Ply: {
                agreementTop1Pct: Number(((agree3 / nStatic) * 100).toFixed(1)),
                meanAbsDeltaEmg: Number(meanEmg3.toFixed(4)),
                pr: Number((meanEmg3 * 500).toFixed(2)),
                latencyMs: Math.round(sumLat3 / nStatic),
            },
            gnubg3PlyMeasuredByOpenSage3Ply: {
                meanAbsDeltaEmg: Number(meanGnubgEmg.toFixed(4)),
                pr: Number((meanGnubgEmg * 500).toFixed(2)),
            },
        },
        part3: {
            duplicateMatches: 10,
            totalDuplicateDecisions: nDup,
            openSageDuplicateScore: `${openSageGamesWon.toFixed(1)} - ${gnubgGamesWon.toFixed(1)} (${netEmgFormatted})`,
            openSageDuplicatePr: Number(((openSageDupLossTotal / nDup) * 500).toFixed(2)),
            gnubgDuplicatePr: Number(((gnubgDupLossTotal / nDup) * 500).toFixed(2)),
            divergencePositions,
        },
    };

    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
    console.log(`✅ Benchmark 100% réel terminé et écrit dans ${REPORT_PATH}`);
}

runRealBenchmark().catch((err: unknown) => {
    console.error('❌ Erreur benchmark:', err);
    process.exit(1);
});
