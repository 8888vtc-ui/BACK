/**
 * @file src/app/api/quizzes/factory/route.ts
 * @description Route API Netlify / Next.js pour l'usine à quiz 3-ply bgsage.
 * Strictement <= 80 lignes, 0 any.
 */

import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { BGSAGE_3PLY_FACTORY_SEED } from '../../../../features/drills/bgsage3PlyFactorySeed';

export async function GET() {
    try {
        const jsonlPath = path.join(process.cwd(), 'data', 'quizzes', 'bgsage_3ply_er_factory.jsonl');
        let totalOnDisk = BGSAGE_3PLY_FACTORY_SEED.length;
        if (fs.existsSync(jsonlPath)) {
            const raw = fs.readFileSync(jsonlPath, 'utf8').trim();
            totalOnDisk = raw ? raw.split('\n').length : totalOnDisk;
        }
        const totalQuizzes = BGSAGE_3PLY_FACTORY_SEED.length;
        const checkerCount = BGSAGE_3PLY_FACTORY_SEED.filter((q) => q.quizType !== 'CUBE_DECISION').length;
        const cubeCount = BGSAGE_3PLY_FACTORY_SEED.filter((q) => q.quizType === 'CUBE_DECISION').length;
        const recentQuizzes = BGSAGE_3PLY_FACTORY_SEED.slice(-50);
        return NextResponse.json({
            success: true,
            totalOnDisk,
            totalQuizzes,
            checkerCount,
            cubeCount,
            source: 'bgsage_3ply_er_factory.jsonl',
            certifiedPly: 3,
            quizzes: recentQuizzes,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
