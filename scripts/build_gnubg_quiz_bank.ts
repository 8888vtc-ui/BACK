import * as fs from 'node:fs';
import * as path from 'node:path';

interface CandidateRaw {
  rank: number;
  notation: string;
  equity: number;
  equityLoss: number;
  win: number;
  winGammon: number;
  winBackgammon: number;
  loseWin: number;
  loseGammon: number;
  loseBackgammon: number;
}

interface QuizRaw {
  id: string;
  xgid: string;
  dice: [number, number];
  requiredEr: number;
  is3PlyTrapVs0Ply: boolean;
  conceptId: string;
  optimalMove: string;
  playedMove: string;
  equityLoss: number;
  quizChoices: string[];
  candidateMoves3Ply: CandidateRaw[];
  conceptName?: string;
}

function main() {
  const inputPath = path.resolve('data/quizzes/quizzes_3ply_checkpoint.jsonl');
  const outputPath = path.resolve('src/features/drills/gnubg3PlyQuizBank.ts');

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const lines = fs.readFileSync(inputPath, 'utf-8').split(/\r?\n/).filter(line => line.trim().length > 0);
  const entries: QuizRaw[] = [];

  for (const line of lines) {
    const obj = JSON.parse(line);
    const cleaned: QuizRaw = {
      id: obj.id,
      xgid: obj.xgid,
      dice: obj.dice,
      requiredEr: obj.requiredEr,
      is3PlyTrapVs0Ply: obj.is3PlyTrapVs0Ply,
      conceptId: obj.conceptId,
      optimalMove: obj.optimalMove,
      playedMove: obj.playedMove,
      equityLoss: obj.equityLoss,
      quizChoices: obj.quizChoices,
      candidateMoves3Ply: (obj.candidateMoves3Ply || []).map((c: CandidateRaw) => ({
        rank: c.rank,
        notation: c.notation,
        equity: c.equity,
        equityLoss: c.equityLoss,
        win: c.win,
        winGammon: c.winGammon,
        winBackgammon: c.winBackgammon,
        loseWin: c.loseWin,
        loseGammon: c.loseGammon,
        loseBackgammon: c.loseBackgammon
      }))
    };
    entries.push(cleaned);
  }

  const fileContent = `/**
 * Banque de quiz validés par GNU Backgammon 3-ply cubeful (gnubg-cli.exe -t -q). Générée par scripts/build_gnubg_quiz_bank.ts depuis data/quizzes/quizzes_3ply_checkpoint.jsonl. Ne pas éditer à la main.
 */

export interface Gnubg3PlyQuizCandidate {
    readonly rank: number;
    readonly notation: string;
    readonly equity: number;
    readonly equityLoss: number;
    readonly win: number;
    readonly winGammon: number;
    readonly winBackgammon: number;
    readonly loseWin: number;
    readonly loseGammon: number;
    readonly loseBackgammon: number;
}

export interface Gnubg3PlyQuizEntry {
    readonly id: string;
    readonly xgid: string;
    readonly dice: readonly [number, number];
    readonly requiredEr: number;
    readonly is3PlyTrapVs0Ply: boolean;
    readonly conceptId: string;
    readonly optimalMove: string;
    readonly playedMove: string;
    readonly equityLoss: number;
    readonly quizChoices: readonly string[];
    readonly candidateMoves3Ply: readonly Gnubg3PlyQuizCandidate[];
}

export const GNUBG_3PLY_QUIZ_BANK: ReadonlyArray<Gnubg3PlyQuizEntry> = ${JSON.stringify(entries, null, 4)};
`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, fileContent, 'utf-8');

  const outputLines = fileContent.split(/\r?\n/).length;
  console.log(`WROTE_ENTRIES:${entries.length}`);
  console.log(`TOTAL_LINES:${outputLines}`);
}

main();
