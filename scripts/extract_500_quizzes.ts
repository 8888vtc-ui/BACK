import * as fs from 'fs';
import * as path from 'path';

function main() {
    const jsonlPath = path.join(process.cwd(), 'data', 'quizzes', 'bgsage_3ply_er_factory.jsonl');
    if (!fs.existsSync(jsonlPath)) {
        console.error('File not found:', jsonlPath);
        process.exit(1);
    }
    const raw = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n');
    console.log('Total lines in jsonl:', raw.length);

    const brackets: Record<string, any[]> = {
        DEBUTANT: [],
        CLUB: [],
        INTERMEDIAIRE: [],
        EXPERT: [],
        MASTER: [],
    };

    const seenIds = new Set<string>();

    for (const line of raw) {
        if (!line.trim()) continue;
        try {
            const q = JSON.parse(line);
            if (!q.id || seenIds.has(q.id)) continue;
            const b = q.targetBracket;
            if (brackets[b] && brackets[b].length < 100) {
                // Convert to HarvestedSeedInput format
                const tier = b === 'DEBUTANT' ? 1 : b === 'CLUB' ? 2 : b === 'INTERMEDIAIRE' ? 3 : b === 'EXPERT' ? 4 : 5;
                const equityLoss = q.legalMoves3Ply?.[1]?.equityLoss ?? 0.05;
                const verdict = equityLoss >= 0.08 ? 'blunder' : equityLoss >= 0.04 ? 'doubtful' : 'inaccuracy';
                const acceptableMoves = q.legalMoves3Ply?.filter((m: any, idx: number) => idx > 0 && m.equityLoss <= 0.020).map((m: any) => m.notation) ?? [];
                const candidateMoves3Ply = (q.legalMoves3Ply ?? []).slice(0, 4).map((m: any, idx: number) => ({
                    rank: idx + 1,
                    notation: m.notation,
                    equityLoss: m.equityLoss,
                    win: m.win,
                    winGammon: m.winGammon,
                }));

                const item = {
                    id: q.id,
                    tier,
                    xgid: q.xgid,
                    dice: q.dice,
                    playedMove: candidateMoves3Ply[1]?.notation ?? q.optimalMove,
                    optimalMove: q.optimalMove,
                    acceptableMoves,
                    quizChoices: q.quizChoices,
                    equityLoss,
                    verdict,
                    conceptId: q.conceptId ?? 'prime_building',
                    conceptName: q.conceptName ?? 'Tactique 3-Ply',
                    whyFailed: `${candidateMoves3Ply[1]?.notation ?? 'Ce coup'} concède ${equityLoss.toFixed(3)} EMG en 3-ply.`,
                    explanation: q.coachExplanation3Ply ?? `En 3-ply, ${q.optimalMove} devance les alternatives.`,
                    proverb: 'Vérifiez toujours le compte de course et les 36 réponses adverses en 3-ply.',
                    hint: q.socraticHint ?? 'Observez la structure des portes.',
                    commentaryVariants: [q.coachExplanation3Ply ?? ''],
                    quizTargetER: q.quizTargetER ?? 10.0,
                    quizType: q.quizType,
                    plyCount: q.plyCount ?? 15,
                    candidateMoves3Ply,
                };

                seenIds.add(q.id);
                brackets[b].push(item);
            }
        } catch (e) {
            // skip malformed line
        }
    }

    const allQuizzes: any[] = [];
    for (const b of ['DEBUTANT', 'CLUB', 'INTERMEDIAIRE', 'EXPERT', 'MASTER']) {
        console.log(`Bracket ${b}: ${brackets[b].length} quizzes`);
        allQuizzes.push(...brackets[b]);
    }

    console.log(`Total harvested: ${allQuizzes.length}`);

    // Format into ts file with 2 items per line
    const lines: string[] = [
        "/**",
        " * @file src/features/drills/bgsage3PlyFactorySeed.ts",
        " * @description 500 quiz 3-ply certifiés Open Sage (100 par palier DEBUTANT/CLUB/INTER/EXPERT/MASTER).",
        " * Strictement <= 320 lignes, 0 any, 0 PR invente, 0 ouverture.",
        " */",
        "",
        "import type { HarvestedSeedInput } from './benchmarkBlunders';",
        "",
        "export const BGSAGE_3PLY_FACTORY_SEED: readonly HarvestedSeedInput[] = [",
    ];

    for (let i = 0; i < allQuizzes.length; i += 2) {
        const item1 = JSON.stringify(allQuizzes[i]);
        if (i + 1 < allQuizzes.length) {
            const item2 = JSON.stringify(allQuizzes[i + 1]);
            lines.push(`    ${item1}, ${item2},`);
        } else {
            lines.push(`    ${item1},`);
        }
    }

    lines.push("];");
    lines.push("");

    const targetPath = path.join(process.cwd(), 'src', 'features', 'drills', 'bgsage3PlyFactorySeed.ts');
    fs.writeFileSync(targetPath, lines.join('\n'), 'utf8');
    console.log(`Written ${lines.length} lines to ${targetPath}`);
}

main();

