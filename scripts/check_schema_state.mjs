/**
 * Interroge l'état réel du schéma public en production (tables + politiques RLS).
 * Usage : node scripts/check_schema_state.mjs
 * Requiert : SUPABASE_ACCESS_TOKEN (token sbp_...) et SUPABASE_PROJECT_REF.
 */

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'rcyiezdlsxriplvumnbm';

if (!TOKEN) {
    console.error('SUPABASE_ACCESS_TOKEN manquant.');
    process.exit(1);
}

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
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function main() {
    console.log('=== ÉTAT DU SCHÉMA PUBLIC EN PRODUCTION ===\n');

    // 1. Tables publiques
    const tables = await runQuery(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`,
    );
    console.log('--- Tables publiques ---');
    console.table(tables);

    // 2. Politiques RLS existantes
    const policies = await runQuery(
        `SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;`,
    );
    console.log('\n--- Politiques RLS existantes ---');
    console.table(policies);

    // 3. Fonctions RPC
    const rpcs = await runQuery(
        `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name;`,
    );
    console.log('\n--- Fonctions RPC ---');
    console.table(rpcs);
}

main().catch((err) => {
    console.error('Erreur :', err.message);
    process.exit(1);
});
