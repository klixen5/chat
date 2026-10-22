import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, chmod, access } from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';

const execute = promisify(execFile);

async function binary(name) {
  if (process.env.PG_BINDIR) {
    const file = path.join(process.env.PG_BINDIR, name);
    await access(file);
    return file;
  }
  try { return (await execute('which', [name])).stdout.trim(); }
  catch { throw new Error(`Не найден ${name}. Укажите PG_BINDIR в .env или установите PostgreSQL и добавьте его bin в PATH.`); }
}

async function canListen(port) {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', () => reject(new Error(`Порт PostgreSQL ${port} занят. Задайте LOCAL_PG_PORT в .env.`)));
    server.listen(port, '127.0.0.1', resolve);
  });
  await new Promise(resolve => server.close(resolve));
}

export async function startLocalPostgres(root, port = 55432) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('LOCAL_PG_PORT: укажите порт от 1024 до 65535.');
  const directory = path.join(root, '.local');
  const data = path.join(directory, 'postgres');
  const passwordFile = path.join(directory, 'postgres-password');
  const portFile = path.join(directory, 'postgres-port');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const pgCtl = await binary('pg_ctl');
  let password;
  try { password = (await readFile(passwordFile, 'utf8')).trim(); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    password = randomBytes(24).toString('hex');
    await writeFile(passwordFile, password, { mode: 0o600, flag: 'wx' });
  }
  await chmod(passwordFile, 0o600);
  let initialized = true;
  try { await access(path.join(data, 'PG_VERSION')); }
  catch { initialized = false; }
  if (!initialized) {
    const initdb = await binary('initdb');
    console.log('Подготавливаю отдельную PostgreSQL для чата…');
    await execute(initdb, ['-D', data, '--username=chat_dev', `--pwfile=${passwordFile}`,
      '--auth-host=scram-sha-256', '--auth-local=trust', '--encoding=UTF8', '--locale=C']);
  }
  let running = true;
  try { await execute(pgCtl, ['-D', data, 'status']); }
  catch (error) {
    if (error.code === 3) running = false;
    else throw error;
  }
  if (running) {
    const recordedPort = Number((await readFile(portFile, 'utf8')).trim());
    if (recordedPort !== port) throw new Error('Локальная база уже запущена на другом порту. Сначала выполните npm run db:stop.');
  } else {
    await canListen(port);
    await writeFile(portFile, String(port));
    console.log(`Запускаю PostgreSQL на 127.0.0.1:${port}…`);
    await execute(pgCtl, ['-D', data, '-l', path.join(directory, 'postgres.log'), '-w', '-t', '15',
      '-o', `-h 127.0.0.1 -p ${port} -c unix_socket_directories=''`, 'start']);
  }
  const stop = async () => {
    if (!running) await execute(pgCtl, ['-D', data, '-m', 'fast', '-w', '-t', '15', 'stop']);
  };
  try {
    const psql = await binary('psql');
    const args = ['-h', '127.0.0.1', '-p', String(port), '-U', 'chat_dev', '-d', 'postgres', '-X', '-v', 'ON_ERROR_STOP=1'];
    const options = { env: { ...process.env, PGPASSWORD: password } };
    const exists = await execute(psql, [...args, '-Atc', "SELECT 1 FROM pg_database WHERE datname = 'chat'"], options);
    if (!exists.stdout.trim()) await execute(psql, [...args, '-c', 'CREATE DATABASE chat'], options);
  } catch (error) { await stop(); throw error; }
  return { databaseUrl: `postgresql://chat_dev:${password}@127.0.0.1:${port}/chat`, stop };
}

export async function stopLocalPostgres(root) {
  const data = path.join(root, '.local', 'postgres');
  try { await access(path.join(data, 'PG_VERSION')); }
  catch { console.log('Локальная база ещё не создавалась.'); return; }
  const pgCtl = await binary('pg_ctl');
  try { await execute(pgCtl, ['-D', data, 'status']); }
  catch (error) {
    if (error.code === 3) { console.log('PostgreSQL уже остановлена.'); return; }
    throw error;
  }
  await execute(pgCtl, ['-D', data, '-m', 'fast', '-w', '-t', '15', 'stop']);
  console.log('Локальная PostgreSQL остановлена. Данные сохранены.');
}
