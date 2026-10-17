import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const apiDir = path.resolve('src/app/api');
const apiBackupDir = path.resolve('.temp_api_backup');

let apiMoved = false;

try {
    if (fs.existsSync(apiDir)) {
        fs.renameSync(apiDir, apiBackupDir);
        apiMoved = true;
    }

    console.log('[Mobile Build] Running Next.js static export for Capacitor / Netlify...');
    execSync('npx next build', {
        stdio: 'inherit',
        env: { ...process.env, CAPACITOR_BUILD: 'true' },
    });

    console.log('[Mobile Build] Syncing assets with Capacitor native platforms...');
    execSync('npx cap sync', { stdio: 'inherit' });

    console.log('[Mobile Build] Capacitor mobile build & sync completed successfully!');
} catch (error) {
    console.error('[Mobile Build] Error during mobile build:', error);
    process.exitCode = 1;
} finally {
    if (apiMoved && fs.existsSync(apiBackupDir)) {
        fs.renameSync(apiBackupDir, apiDir);
    }
}
