import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stopLocalPostgres } from './local-postgres.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
try { process.loadEnvFile(path.join(root, '.env')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
try { await stopLocalPostgres(root); }
catch (error) { console.error(error.stderr?.trim() || error.message); process.exitCode = 1; }
