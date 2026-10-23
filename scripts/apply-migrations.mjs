/**
 * Applique les migrations Supabase via l'API Management (endpoint /database/query).
 * Usage : node scripts/apply-migrations.mjs
 * Requiert : SUPABASE_ACCESS_TOKEN (token sbp_...) et SUPABASE_PROJECT_REF.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'rcyiezdlsxriplvumnbm';

if (!TOKEN) {
    console.error('SUPABASE_ACCESS_TOKEN manquant.');
    process.exit(1);
}

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

async function runQuery(sql) {
    const res = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: sql }),
        },
    );

    const text = await res.text();
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return text;
}

async function main() {
    // Filtre optionnel : n'appliquer que les migrations dont le nom contient l'argument.
    const filter = process.argv[2];
    const files = readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .filter((f) => !filter || f.includes(filter))
        .sort();

    console.log(`Migrations à appliquer : ${files.length}`);

    for (const file of files) {
        const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
        console.log(`\n▶ Application de ${file}...`);
        try {
            const result = await runQuery(sql);
            console.log(`  ✅ ${file} appliquée (${result.length} octets de réponse)`);
        } catch (err) {
            console.error(`  ❌ ${file} échouée : ${err.message}`);
            process.exit(1);
        }
    }

    console.log('\n🎉 Toutes les migrations ont été appliquées avec succès.');
}

main().catch((err) => {
    console.error('Erreur fatale :', err);
    process.exit(1);
});
