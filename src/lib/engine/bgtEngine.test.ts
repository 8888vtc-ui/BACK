import { describe, it, expect } from 'vitest';
import {
    BGT_ENGINE_METADATA,
    evaluateWithBgtSync,
    inspectBgtWeightsFile,
    isBgtAvailable,
    parseBgtGnubgOutput,
    projectBoardToBgtWireBoard,
} from './bgtEngine';
import { bgsageMoveBoardToProjectBoard, selectBotMoveWithBgsage } from './bgsageClient';
import { generateLegalMoves, parseXGID } from '../../engine/backgammonEngine';

const OPENING_31_XGID = 'XGID=-b----E-C---eE---c-e----B-:0:0:1:31:0:0:0:0:10';

describe('BGT (BackgammonTour Open-Source Neural Engine)', () => {
    it('expose les métadonnées Open-Source officielles pointant vers https://backgammontour.com', () => {
        expect(BGT_ENGINE_METADATA.shortName).toBe('bgt');
        expect(BGT_ENGINE_METADATA.homepage).toBe('https://backgammontour.com');
        expect(BGT_ENGINE_METADATA.license).toBe('GPL-3.0-or-later');
    });

    it('assure une bijection exacte entre projectBoardToBgtWireBoard et bgsageMoveBoardToProjectBoard pour X et O', () => {
        const stateX = parseXGID(OPENING_31_XGID);
        const wireX = projectBoardToBgtWireBoard(stateX.board, 'X');
        const roundtripX = bgsageMoveBoardToProjectBoard(wireX, 'X', 'bgt-gnubg');
        expect(roundtripX.slice(0, 26)).toEqual(stateX.board.slice(0, 26));

        const stateO = parseXGID('XGID=-b----E-C---eE---c-e----B-:0:0:-1:31:0:0:0:0:10');
        const wireO = projectBoardToBgtWireBoard(stateO.board, 'O');
        const roundtripO = bgsageMoveBoardToProjectBoard(wireO, 'O', 'bgt-gnubg');
        expect(roundtripO.slice(0, 26)).toEqual(stateO.board.slice(0, 26));
    });

    it('parse fidèlement la sortie gnubg-cli (coups + probabilités + videau) et apparie les coups légaux', async () => {
        const sampleStdout = `
Cube analysis
2-ply cubeless equity +0,076
  0,525 0,149 0,007 - 0,475 0,125 0,005
Cubeful equities:
1. No double           +0,105
2. Double, pass        +1,000  (+0,895)
3. Double, take        -0,171  (-0,276)
Proper cube action: No double, take (23,6%)

    1. Cubeful 2-ply    8/5 6/5                      Eq.: +0,219
       0,551 0,174 0,013 - 0,449 0,124 0,005
    2. Cubeful 2-ply    24/23 13/10                  Eq.: -0,011 (-0,230)
       0,497 0,137 0,008 - 0,503 0,140 0,007
`;
        const state = parseXGID(OPENING_31_XGID);
        const parsed = parseBgtGnubgOutput(sampleStdout, state);

        expect(parsed.source).toBe('bgt-gnubg');
        expect(parsed.cubeDecision.optimalAction).toBe('NO_DOUBLE');
        expect(parsed.cubeDecision.noDouble).toBeCloseTo(0.105, 3);
        expect(parsed.cubeDecision.doubleTake).toBeCloseTo(-0.171, 3);
        expect(parsed.chequerPlay.length).toBe(2);
        expect(parsed.chequerPlay[0].notation).toBe('8/5 6/5');
        expect(parsed.chequerPlay[0].equity).toBeCloseTo(0.219, 3);
        expect(parsed.chequerPlay[0].equityLoss).toBe(0);
        expect(parsed.chequerPlay[0].probabilities?.win).toBeCloseTo(0.551, 3);
        expect(parsed.chequerPlay[0].moves?.length).toBe(2);
        expect(parsed.chequerPlay[1].equityLoss).toBeCloseTo(0.23, 3);

        const legalSeqs = generateLegalMoves(state, [3, 1]);
        const botChoice = await selectBotMoveWithBgsage(
            state,
            legalSeqs,
            'grandmaster',
            2000,
            Math.random,
            parsed,
        );
        expect(botChoice).not.toBeNull();
        expect(botChoice?.sequence.board[5]).toBe(2);
    });

    it('évalue en conditions réelles via gnubg-cli.exe et inspecte gnubg.wd si installés sur la machine', () => {
        const weights = inspectBgtWeightsFile();
        if (weights.available) {
            expect(weights.byteLength).toBeGreaterThan(300_000);
            expect(weights.homepage).toBe('https://backgammontour.com');
        }

        if (isBgtAvailable()) {
            const liveEval = evaluateWithBgtSync(OPENING_31_XGID, 2, 5000);
            expect(liveEval).not.toBeNull();
            expect(liveEval?.source).toBe('bgt-gnubg');
            expect(liveEval?.chequerPlay[0].notation).toBe('8/5 6/5');
            expect(liveEval?.cubeDecision.optimalAction).toBe('NO_DOUBLE');
        }
    });
});
