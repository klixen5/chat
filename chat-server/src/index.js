import { createChatServer } from './server.js';

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '127.0.0.1';
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT должен быть числом от 1 до 65535.');
  process.exit(1);
}
const server = await createChatServer({
  databaseUrl: process.env.DATABASE_URL,
  allowedOrigins: (process.env.CLIENT_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean),
});
try {
  await server.listen(port, host);
  console.log(`Чат запущен: http://${host}:${port}`);
  console.log(`WebSocket: ws://${host}:${port}/ws`);
  console.log('Документация: docs/API.md. Остановка: Ctrl+C.');
} catch (error) {
  await server.close();
  console.error(error.code === 'EADDRINUSE' ? `Порт ${port} уже занят. Остановите другой сервер или задайте PORT в .env.` : error.message);
  process.exitCode = 1;
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await server.close();
  });
}
