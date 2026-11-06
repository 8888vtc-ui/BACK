import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function getAllFilesRecursively(dir: string, extensions: string[]): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
            results.push(...getAllFilesRecursively(fullPath, extensions));
        } else if (entry.isFile()) {
            if (extensions.some((ext) => entry.name.endsWith(ext))) {
                results.push(fullPath);
            }
        }
    }
    return results;
}

describe('Mission 48 — Codebase Constitution Audit', () => {
    const srcDir = path.resolve(process.cwd(), 'src');

    it('Règle 1 : Aucun fichier .tsx dans src/ (100% du dépôt, tests inclus) ne doit dépasser 300 lignes', () => {
        const tsxFiles = getAllFilesRecursively(srcDir, ['.tsx']);
        const oversized: { file: string; lines: number }[] = [];

        for (const file of tsxFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const lines = content.split('\n').length;
            if (lines > 300) {
                oversized.push({ file: path.relative(process.cwd(), file).replace(/\\/g, '/'), lines });
            }
        }

        expect(
            oversized,
            `Fichiers .tsx dépassant 300 lignes :\n${oversized.map((o) => ` - ${o.file} (${o.lines} lignes)`).join('\n')}`,
        ).toEqual([]);
    });

    it('Règle 2 : Aucun fichier .ts de composants ou hooks ne doit dépasser 400 lignes', () => {
        const targetDirs = [
            path.join(srcDir, 'hooks'),
            path.join(srcDir, 'components'),
        ];
        const tsFiles = targetDirs
            .flatMap((d) => getAllFilesRecursively(d, ['.ts']))
            .filter((f) => !f.endsWith('.test.ts') && !f.endsWith('.spec.ts'));

        const oversized: { file: string; lines: number }[] = [];

        for (const file of tsFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const lines = content.split('\n').length;
            if (lines > 400) {
                oversized.push({ file: path.relative(process.cwd(), file).replace(/\\/g, '/'), lines });
            }
        }

        expect(
            oversized,
            `Fichiers .ts dépassant 400 lignes :\n${oversized.map((o) => ` - ${o.file} (${o.lines} lignes)`).join('\n')}`,
        ).toEqual([]);
    });

    it('Règle 3a : 0 occurrence de ERH ou Mistral dans tout src/', () => {
        const allCodeFiles = getAllFilesRecursively(srcDir, ['.ts', '.tsx']).filter(
            (f) => !f.includes('day48_codebase_constitution_audit.test.ts'),
        );
        const violations: { file: string; word: string; line: number }[] = [];

        for (const file of allCodeFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((lineText, idx) => {
                if (/\bERH\b/.test(lineText)) {
                    violations.push({
                        file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
                        word: 'ERH',
                        line: idx + 1,
                    });
                }
                if (/Mistral/i.test(lineText)) {
                    violations.push({
                        file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
                        word: 'Mistral',
                        line: idx + 1,
                    });
                }
            });
        }

        expect(
            violations,
            `Mots interdits trouvés dans src/ :\n${violations.map((v) => ` - ${v.file}:${v.line} (${v.word})`).join('\n')}`,
        ).toEqual([]);
    });

    it('Règle 3b : 0 occurrence de any dans les fichiers modifiés par git', () => {
        let diff = '';
        try {
            diff = execSync('git diff -U0 -- src/').toString();
        } catch {
            diff = '';
        }
        const lines = diff.split('\n');
        const additions = lines.filter((l) => l.startsWith('+') && !l.startsWith('+++'));
        const anyViolations = additions.filter((l) => /:\s*any\b|\bas any\b/.test(l));

        expect(
            anyViolations,
            `Occurrences de any détectées dans les lignes ajoutées/modifiées :\n${anyViolations.join('\n')}`,
        ).toEqual([]);
    });
});
