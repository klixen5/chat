import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import { startLocalPostgres } from './local-postgres.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
try { process.loadEnvFile(path.join(root, '.env')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

function child(command, args, env = process.env) {
  const processChild = spawn(command, args, { cwd: root, env, stdio: 'inherit' });
  const done = new Promise((resolve, reject) => {
    processChild.once('error', reject);
    processChild.once('exit', (code, signal) => resolve({ code, signal }));
  });
  return { processChild, done };
}

async function checkPort() {
  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT: укажите число от 1 до 65535.');
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', () => reject(new Error(`Порт ${port} занят. Задайте другой PORT в .env.`)));
    server.listen(port, process.env.HOST ?? '127.0.0.1', resolve);
  });
  await new Promise(resolve => server.close(resolve));
}

let database;
let serverChild;
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    serverChild?.kill(signal);
  });
}

try {
  await checkPort();
  let needsInstall = false;
  for (const dependency of ['express', 'pg', 'ws']) {
    try { require.resolve(dependency); } catch { needsInstall = true; }
  }
  if (needsInstall) {
    console.log('Устанавливаю зависимости (нужно только при первом запуске)…');
    let hasLock = true;
    try { await access(path.join(root, 'package-lock.json')); } catch { hasLock = false; }
    const result = await child('npm', [hasLock ? 'ci' : 'install', '--no-audit', '--no-fund']).done;
    if (result.code !== 0) throw new Error('Не удалось установить зависимости. Проверьте доступ к npm и повторите npm start.');
  }
  if (!stopping && !process.env.DATABASE_URL) {
    database = await startLocalPostgres(root, Number(process.env.LOCAL_PG_PORT ?? 55432));
  }
  if (!stopping) {
    const started = child(process.execPath, ['src/index.js'], {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? database.databaseUrl,
    });
    serverChild = started.processChild;
    const result = await started.done;
    if (!stopping && result.code !== 0) process.exitCode = result.code ?? 1;
  }
} catch (error) {
  console.error('Не удалось запустить чат:', error.stderr?.trim() || error.message);
  process.exitCode = 1;
} finally {
  if (database) {
    try { await database.stop(); }
    catch (error) {
      console.error('Не удалось остановить PostgreSQL. Выполните npm run db:stop:', error.message);
      process.exitCode = 1;
    }
  }
}
