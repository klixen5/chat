import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import pg from 'pg';
import { WebSocket } from 'ws';
import { createChatServer } from '../src/server.js';
import { startLocalPostgres } from '../scripts/local-postgres.mjs';

let root, database, pool, server, baseUrl, wsUrl;
const clients = new Set();

async function unusedPort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve); });
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  return port;
}

before(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'learning-chat-test-'));
  database = await startLocalPostgres(root, await unusedPort());
  pool = new pg.Pool({ connectionString: database.databaseUrl });
  server = await createChatServer({ databaseUrl: database.databaseUrl });
  const address = await server.listen(0);
  baseUrl = `http://127.0.0.1:${address.port}`;
  wsUrl = `ws://127.0.0.1:${address.port}/ws`;
});

beforeEach(async () => {
  for (const client of clients) client.ws.terminate();
  clients.clear();
  if (pool) await pool.query('DELETE FROM messages');
});

after(async () => {
  for (const client of clients) client.ws.terminate();
  await server?.close();
  await pool?.end();
  await database?.stop();
  if (root) await rm(root, { recursive: true, force: true });
});

async function client(name, roomId = 'react') {
  const ws = new WebSocket(wsUrl, { origin: 'http://localhost:5173' });
  const packets = [];
  const waiting = new Set();
  ws.on('message', raw => {
    const packet = JSON.parse(raw.toString());
    const match = [...waiting].find(waiter => waiter.match(packet));
    if (match) { waiting.delete(match); clearTimeout(match.timeout); match.resolve(packet); }
    else packets.push(packet);
  });
  ws.on('error', () => {});
  const wait = (type, predicate = () => true) => {
    const match = packet => packet.type === type && predicate(packet);
    const index = packets.findIndex(match);
    if (index !== -1) return Promise.resolve(packets.splice(index, 1)[0]);
    return new Promise((resolve, reject) => {
      const waiter = { match, resolve };
      waiter.timeout = setTimeout(() => { waiting.delete(waiter); reject(new Error(`Нет события ${type}`)); }, 4000);
      waiting.add(waiter);
    });
  };
  const api = {
    ws, packets, wait,
    send(type, data = {}, requestId = randomUUID()) {
      ws.send(JSON.stringify({ type, data, requestId }));
      return requestId;
    },
    async message(text, roomId = 'react', id = randomUUID()) {
      const requestId = this.send('message:send', { roomId, text, clientMessageId: id });
      return (await wait('message:ack', packet => packet.requestId === requestId)).data;
    },
  };
  clients.add(api);
  await wait('connection:ready');
  if (name !== undefined) { api.send('session:identify', { name }); await wait('session:ready'); }
  if (name !== undefined && roomId) { api.send('room:join', { roomId }); await wait('room:joined'); }
  return api;
}

async function history(query = '', roomId = 'react') {
  const response = await fetch(`${baseUrl}/api/rooms/${roomId}/messages${query}`);
  assert.equal(response.status, 200);
  return response.json();
}

test('REST: здоровье, три комнаты, пустая история и CORS для Vite', async () => {
  const health = await fetch(`${baseUrl}/api/health`);
  assert.deepEqual(await health.json(), { status: 'ok', database: 'connected' });
  const response = await fetch(`${baseUrl}/api/rooms`, { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.deepEqual((await response.json()).items.map(room => room.id), ['javascript', 'react', 'algorithms']);
  assert.deepEqual((await history()).items, []);
});

test('REST: неверные параметры и неизвестная комната дают JSON-ошибки', async () => {
  for (const query of ['?limit=0', '?limit=101', '?limit=1&limit=2', '?before=1&after=2', '?after=NaN', '?before=2147483648']) {
    const response = await fetch(`${baseUrl}/api/rooms/react/messages${query}`);
    assert.equal(response.status, 400, query);
    assert.equal((await response.json()).error.code, 'VALIDATION_ERROR');
  }
  const missing = await fetch(`${baseUrl}/api/rooms/missing/messages`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error.code, 'ROOM_NOT_FOUND');
});

test('HTTP и WebSocket отклоняют посторонний Origin', async () => {
  const response = await fetch(`${baseUrl}/api/rooms`, { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'ORIGIN_NOT_ALLOWED');
  await new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl, { origin: 'https://untrusted.example' });
    ws.on('error', () => {});
    ws.on('open', () => { ws.terminate(); reject(new Error('Неожиданно подключились')); });
    ws.on('unexpected-response', (_req, res) => { assert.equal(res.statusCode, 403); res.resume(); ws.terminate(); resolve(); });
  });
});

test('два клиента получают сообщение с автором сервера; другая комната его не получает', async () => {
  const alice = await client('Алиса');
  const bob = await client('Боб');
  const outsider = await client('Дима', 'algorithms');
  const id = randomUUID();
  const requestId = alice.send('message:send', { roomId: 'react', text: '  Привет!  ', clientMessageId: id, authorName: 'Подмена' });
  const received = await bob.wait('message:created');
  const own = await alice.wait('message:created');
  const ack = await alice.wait('message:ack', packet => packet.requestId === requestId);
  assert.equal(received.data.message.text, 'Привет!');
  assert.equal(received.data.message.authorName, 'Алиса');
  assert.equal(received.data.message.clientMessageId, id);
  assert.ok(Number.isInteger(received.data.message.id));
  assert.ok(Number.isFinite(Date.parse(received.data.message.createdAt)));
  assert.deepEqual(own.data.message, received.data.message);
  assert.deepEqual(ack.data.message, received.data.message);
  await outsider.message('Другое сообщение', 'algorithms');
  assert.equal(outsider.packets.some(packet => packet.type === 'message:created' && packet.data.message.roomId === 'react'), false);
  assert.equal((await history()).items.length, 1);
  assert.equal((await history('', 'algorithms')).items.length, 1);
});

test('повтор отправки, в том числе после переподключения, не создаёт дубликат', async () => {
  const alice = await client('Алиса');
  const id = randomUUID();
  const first = await alice.message('Один раз', 'react', id);
  const repeated = await alice.message('Один раз', 'react', id);
  assert.equal(first.duplicate, false);
  assert.equal(repeated.duplicate, true);
  assert.equal(first.message.id, repeated.message.id);
  alice.ws.terminate();
  const reconnected = await client('Алиса');
  assert.equal((await reconnected.message('Один раз', 'react', id)).duplicate, true);
  assert.equal((await history()).items.length, 1);
  const requestId = reconnected.send('message:send', { roomId: 'react', text: 'Другой текст', clientMessageId: id });
  assert.equal((await reconnected.wait('error', packet => packet.requestId === requestId)).data.code, 'MESSAGE_ID_CONFLICT');
});

test('история листается назад и вперёд без пропуска и возвращается от старых к новым', async () => {
  const alice = await client('Алиса');
  const sent = [];
  for (let index = 0; index < 5; index += 1) sent.push((await alice.message(`Сообщение ${index}`)).message.id);
  const latest = await history('?limit=2');
  assert.deepEqual(latest.items.map(message => message.id), sent.slice(3));
  assert.equal(latest.pagination.hasMore, true);
  const older = await history(`?limit=2&before=${latest.pagination.nextBefore}`);
  assert.deepEqual(older.items.map(message => message.id), sent.slice(1, 3));
  const oldest = await history(`?limit=2&before=${older.pagination.nextBefore}`);
  assert.deepEqual(oldest.items.map(message => message.id), sent.slice(0, 1));
  assert.equal(oldest.pagination.hasMore, false);
  const missed = await history(`?limit=2&after=${sent[0]}`);
  assert.deepEqual(missed.items.map(message => message.id), sent.slice(1, 3));
  const rest = await history(`?limit=2&after=${missed.pagination.nextAfter}`);
  assert.deepEqual(rest.items.map(message => message.id), sent.slice(3));
  assert.equal(rest.pagination.hasMore, false);
});

test('вход, выбор комнаты и проверка текста обязательны; повреждённый JSON не ломает соединение', async () => {
  const anonymous = await client();
  anonymous.send('room:join', { roomId: 'react' });
  assert.equal((await anonymous.wait('error')).data.code, 'IDENTIFY_REQUIRED');
  anonymous.send('session:identify', { name: ' ' });
  assert.equal((await anonymous.wait('error')).data.code, 'VALIDATION_ERROR');
  anonymous.send('session:identify', { name: 'Саша' }); await anonymous.wait('session:ready');
  anonymous.send('message:send', { roomId: 'react', text: 'Привет', clientMessageId: randomUUID() });
  assert.equal((await anonymous.wait('error')).data.code, 'JOIN_REQUIRED');
  anonymous.send('room:join', { roomId: 'react' }); await anonymous.wait('room:joined');
  anonymous.ws.send('{broken');
  assert.equal((await anonymous.wait('error')).data.code, 'INVALID_JSON');
  for (const text of [' ', 'a'.repeat(2001), '\u0000']) {
    anonymous.send('message:send', { roomId: 'react', text, clientMessageId: randomUUID() });
    assert.equal((await anonymous.wait('error')).data.code, 'VALIDATION_ERROR');
  }
  assert.equal((await anonymous.message('Работает')).message.authorName, 'Саша');
});

test('смена комнаты обрабатывается последовательно; неудачный переход сохраняет текущую', async () => {
  const alice = await client('Алиса');
  alice.send('room:join', { roomId: 'missing' });
  assert.equal((await alice.wait('error')).data.code, 'ROOM_NOT_FOUND');
  await alice.message('Осталась в React');
  alice.send('room:join', { roomId: 'javascript' });
  const requestId = alice.send('message:send', { roomId: 'javascript', text: 'Теперь JS', clientMessageId: randomUUID() });
  await alice.wait('room:joined');
  assert.equal((await alice.wait('message:ack', packet => packet.requestId === requestId)).data.message.roomId, 'javascript');
  alice.send('message:send', { roomId: 'react', text: 'Не туда', clientMessageId: randomUUID() });
  assert.equal((await alice.wait('error')).data.code, 'ROOM_MISMATCH');
  alice.send('room:leave'); await alice.wait('room:left');
  alice.send('message:send', { roomId: 'javascript', text: 'Не в комнате', clientMessageId: randomUUID() });
  assert.equal((await alice.wait('error')).data.code, 'JOIN_REQUIRED');
});

test('одновременная отправка даёт всем клиентам один порядок сохранённых сообщений', async () => {
  const alice = await client('Алиса');
  const bob = await client('Боб');
  await Promise.all([alice.message('Первое'), bob.message('Второе')]);
  const a = [await alice.wait('message:created'), await alice.wait('message:created')];
  const b = [await bob.wait('message:created'), await bob.wait('message:created')];
  const ids = a.map(packet => packet.data.message.id);
  assert.deepEqual(b.map(packet => packet.data.message.id), ids);
  assert.deepEqual((await history()).items.map(message => message.id), ids);
  assert.ok(ids[0] < ids[1]);
});

test('история и подпись автора сохраняются после перезапуска Express', async () => {
  const alice = await client('Алиса');
  const sent = await alice.message('Сохранить после выхода');
  alice.ws.terminate();
  await server.close();
  server = await createChatServer({ databaseUrl: database.databaseUrl });
  const address = await server.listen(0);
  baseUrl = `http://127.0.0.1:${address.port}`;
  wsUrl = `ws://127.0.0.1:${address.port}/ws`;
  assert.equal((await history()).items[0].id, sent.message.id);
  assert.equal((await history()).items[0].authorName, 'Алиса');
});
