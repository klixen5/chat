import http from 'node:http';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { createStore } from './store.js';
import { AppError, errorBody } from './errors.js';
import { object, text, displayName, positiveInteger, clientMessageId } from './validation.js';

function originAllowed(origin, configured) {
  if (!origin) return true; // Node clients and local command-line tools have no Origin.
  if (configured.length) return configured.includes(origin);
  try {
    const url = new URL(origin);
    return ['http:', 'https:'].includes(url.protocol)
      && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      && url.origin === origin;
  } catch { return false; }
}

export async function createChatServer({ databaseUrl, allowedOrigins = [] }) {
  const store = await createStore(databaseUrl);
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.vary('Origin');
    const origin = req.headers.origin;
    if (!originAllowed(origin, allowedOrigins)) {
      return next(new AppError('ORIGIN_NOT_ALLOWED', 'Этот адрес фронтенда не разрешён.', 403));
    }
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.get('/', (_req, res) => res.json({
    name: 'Learning Chat API', version: '1.0.0',
    health: '/api/health', rooms: '/api/rooms', websocket: '/ws', docs: 'docs/API.md',
  }));
  app.get('/api/health', async (_req, res) => {
    try { await store.health(); res.json({ status: 'ok', database: 'connected' }); }
    catch { throw new AppError('DATABASE_UNAVAILABLE', 'PostgreSQL недоступен.', 503); }
  });
  app.get('/api/rooms', async (_req, res) => res.json({ items: await store.rooms() }));
  app.get('/api/rooms/:roomId', async (req, res) => res.json({ room: await store.room(req.params.roomId) }));
  app.get('/api/rooms/:roomId/messages', async (req, res) => {
    const limit = req.query.limit === undefined ? 30 : positiveInteger(req.query.limit, 'limit', 100);
    const before = req.query.before === undefined ? undefined : positiveInteger(req.query.before, 'before', 2147483647);
    const after = req.query.after === undefined ? undefined : positiveInteger(req.query.after, 'after', 2147483647);
    if (before !== undefined && after !== undefined) {
      throw new AppError('VALIDATION_ERROR', 'Используйте только один курсор: before или after.');
    }
    res.json(await store.history(req.params.roomId, { limit, before, after }));
  });
  app.use((_req, _res, next) => next(new AppError('NOT_FOUND', 'Маршрут не найден.', 404)));
  app.use((error, _req, res, _next) => {
    if (!(error instanceof AppError)) console.error('Ошибка HTTP:', error);
    res.status(error instanceof AppError ? error.status : 500).json({ error: errorBody(error) });
  });

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024, perMessageDeflate: false });
  const roomQueues = new Map();
  let stopping = false;

  function send(ws, packet) {
    if (ws.readyState !== WebSocket.OPEN) return;
    if (ws.bufferedAmount > 1024 * 1024) { ws.close(1013, 'Client too slow'); return; }
    ws.send(JSON.stringify(packet));
  }
  function broadcast(roomId, packet) {
    for (const client of wss.clients) {
      if (client.roomId === roomId) send(client, packet);
    }
  }
  function inRoomOrder(roomId, operation) {
    const previous = roomQueues.get(roomId) ?? Promise.resolve();
    const next = previous.catch(() => {}).then(operation);
    roomQueues.set(roomId, next);
    void next.finally(() => {
      if (roomQueues.get(roomId) === next) roomQueues.delete(roomId);
    }).catch(() => {});
    return next;
  }

  httpServer.on('upgrade', (req, socket, head) => {
    const reject = (status, label) => socket.end(`HTTP/1.1 ${status} ${label}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
    if (stopping) return reject(503, 'Service Unavailable');
    let path;
    try { path = new URL(req.url, 'http://localhost').pathname; }
    catch { return reject(400, 'Bad Request'); }
    if (path !== '/ws') return reject(404, 'Not Found');
    if (!originAllowed(req.headers.origin, allowedOrigins)) return reject(403, 'Forbidden');
    socket.on('error', () => {});
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
  });

  wss.on('connection', ws => {
    ws.connectionId = randomUUID();
    ws.authorName = null;
    ws.roomId = null;
    ws.alive = true;
    let queue = Promise.resolve();
    let pending = 0;
    let windowStart = Date.now();
    let packetCount = 0;
    ws.on('pong', () => { ws.alive = true; });
    ws.on('error', () => {}); // Transport errors also trigger close; they are not application events.
    send(ws, { type: 'connection:ready', data: { connectionId: ws.connectionId } });

    async function handle(packet) {
      const { type, requestId } = object(packet);
      if (typeof type !== 'string') throw new AppError('INVALID_EVENT', 'У события должно быть строковое поле type.');
      if (requestId !== undefined && (typeof requestId !== 'string' || requestId.length < 1 || requestId.length > 100)) {
        throw new AppError('VALIDATION_ERROR', 'requestId должен быть строкой длиной от 1 до 100 символов.');
      }
      const data = object(packet.data ?? {});
      const reply = (type, data) => send(ws, { type, ...(requestId === undefined ? {} : { requestId }), data });

      if (type === 'session:identify') {
        if (ws.authorName) throw new AppError('ALREADY_IDENTIFIED', 'Имя уже задано. Для нового имени переподключитесь.');
        ws.authorName = displayName(data.name);
        reply('session:ready', { connectionId: ws.connectionId, name: ws.authorName });
        return;
      }
      if (!ws.authorName) throw new AppError('IDENTIFY_REQUIRED', 'Сначала отправьте session:identify с именем.');
      if (type === 'room:join') {
        const room = await store.room(data.roomId);
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.roomId = room.id;
        reply('room:joined', { room });
      } else if (type === 'room:leave') {
        const roomId = ws.roomId;
        ws.roomId = null;
        reply('room:left', { roomId });
      } else if (type === 'message:send') {
        if (!ws.roomId) throw new AppError('JOIN_REQUIRED', 'Сначала войдите в комнату через room:join.');
        if (data.roomId !== ws.roomId) throw new AppError('ROOM_MISMATCH', 'Сообщение можно отправить только в текущую комнату.');
        const input = {
          roomId: ws.roomId,
          authorName: ws.authorName,
          text: text(data.text, 'text', 1, 2000),
          clientMessageId: clientMessageId(data.clientMessageId),
        };
        await inRoomOrder(input.roomId, async () => {
          const { message, created } = await store.addMessage(input);
          if (created) broadcast(input.roomId, { type: 'message:created', data: { message } });
          reply('message:ack', { message, duplicate: !created });
        });
      } else {
        throw new AppError('UNKNOWN_EVENT', `Неизвестное событие: ${type}`);
      }
    }

    ws.on('message', (raw, binary) => {
      if (stopping) return;
      if (Date.now() - windowStart >= 10_000) { windowStart = Date.now(); packetCount = 0; }
      packetCount += 1;
      if (packetCount > 60 || pending >= 60) {
        send(ws, { type: 'error', data: { code: 'RATE_LIMITED', message: 'Слишком много событий. Подключитесь повторно через несколько секунд.' } });
        ws.close(1008, 'Rate limit');
        return;
      }
      pending += 1;
      queue = queue.then(async () => {
        if (ws.readyState !== WebSocket.OPEN) return;
        let packet;
        try {
          if (binary) throw new AppError('INVALID_JSON', 'Отправляйте текстовый JSON, не бинарные данные.');
          try { packet = JSON.parse(raw.toString()); }
          catch { throw new AppError('INVALID_JSON', 'Не удалось разобрать JSON.'); }
          await handle(packet);
        } catch (error) {
          if (!(error instanceof AppError)) console.error('Ошибка WebSocket:', error);
          const requestId = packet?.requestId;
          send(ws, {
            type: 'error',
            ...(typeof requestId === 'string' && requestId.length <= 100 ? { requestId } : {}),
            data: errorBody(error),
          });
        }
      }).finally(() => { pending -= 1; });
    });
  });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.alive) { ws.terminate(); continue; }
      ws.alive = false;
      ws.ping();
    }
  }, 30_000);
  heartbeat.unref();

  let closePromise;
  return {
    app, httpServer,
    async listen(port = 3001, host = '127.0.0.1') {
      await new Promise((resolve, reject) => {
        const onError = error => { httpServer.off('listening', onListen); reject(error); };
        const onListen = () => { httpServer.off('error', onError); resolve(); };
        httpServer.once('error', onError);
        httpServer.once('listening', onListen);
        httpServer.listen(port, host);
      });
      return httpServer.address();
    },
    close() {
      closePromise ??= (async () => {
        stopping = true;
        clearInterval(heartbeat);
        const closed = new Promise(resolve => httpServer.close(resolve));
        httpServer.closeIdleConnections();
        for (const ws of wss.clients) ws.close(1001, 'Server shutting down');
        const force = setTimeout(() => { for (const ws of wss.clients) ws.terminate(); }, 500);
        force.unref();
        await new Promise(resolve => wss.close(resolve));
        clearTimeout(force);
        await Promise.allSettled([...roomQueues.values()]);
        await closed;
        await store.close();
      })();
      return closePromise;
    },
  };
}
