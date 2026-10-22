import pg from 'pg';
import { AppError } from './errors.js';

const roomColumns = 'id, name, description';
const messageColumns = `id, room_id AS "roomId", client_message_id AS "clientMessageId",
  author_name AS "authorName", text, created_at AS "createdAt"`;

export async function createStore(connectionString) {
  if (!connectionString) throw new Error('Не задан DATABASE_URL. Используйте npm start для автоматического запуска.');
  const pool = new pg.Pool({ connectionString, max: 5, connectionTimeoutMillis: 5000 });
  pool.on('error', error => console.error('Потеряно соединение с PostgreSQL:', error.message));
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id text PRIMARY KEY,
        name text NOT NULL,
        description text NOT NULL,
        position integer NOT NULL
      );
      CREATE TABLE IF NOT EXISTS messages (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        room_id text NOT NULL REFERENCES rooms(id),
        client_message_id uuid NOT NULL UNIQUE,
        author_name text NOT NULL CHECK (char_length(author_name) BETWEEN 2 AND 30),
        text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 2000),
        created_at timestamptz NOT NULL DEFAULT clock_timestamp()
      );
      CREATE INDEX IF NOT EXISTS messages_room_id_id_idx ON messages(room_id, id);
      INSERT INTO rooms(id, name, description, position) VALUES
        ('javascript', 'JavaScript', 'Обсуждаем язык, браузер и задачи.', 1),
        ('react', 'React', 'Компоненты, хуки и разработка приложений.', 2),
        ('algorithms', 'Алгоритмы', 'Разбираем подходы к решению задач.', 3)
      ON CONFLICT (id) DO NOTHING;
    `);
  } catch (error) {
    await pool.end();
    throw error;
  }

  return {
    async health() { await pool.query('SELECT 1'); },
    async rooms() {
      return (await pool.query(`SELECT ${roomColumns} FROM rooms ORDER BY position, id`)).rows;
    },
    async room(id) {
      if (typeof id !== 'string' || id.length > 80) throw new AppError('ROOM_NOT_FOUND', 'Комната не найдена.', 404);
      const { rows } = await pool.query(`SELECT ${roomColumns} FROM rooms WHERE id = $1`, [id]);
      if (!rows[0]) throw new AppError('ROOM_NOT_FOUND', 'Комната не найдена.', 404);
      return rows[0];
    },
    async history(roomId, { limit, before, after }) {
      await this.room(roomId);
      const direction = after !== undefined ? 'ASC' : 'DESC';
      const cursor = after ?? before;
      const comparison = after !== undefined ? '>' : '<';
      const params = [roomId, limit + 1];
      // Direction and comparison are chosen above, never taken from request input.
      const condition = cursor === undefined ? '' : `AND id ${comparison} $3`;
      if (cursor !== undefined) params.push(cursor);
      const { rows } = await pool.query(
        `SELECT ${messageColumns} FROM messages WHERE room_id = $1 ${condition}
         ORDER BY id ${direction} LIMIT $2`, params,
      );
      const hasMore = rows.length > limit;
      const selected = rows.slice(0, limit);
      if (direction === 'DESC') selected.reverse();
      return {
        items: selected,
        pagination: {
          limit, hasMore,
          nextBefore: selected[0]?.id ?? null,
          nextAfter: selected.at(-1)?.id ?? null,
        },
      };
    },
    async addMessage({ roomId, authorName, text, clientMessageId }) {
      const { rows } = await pool.query(
        `INSERT INTO messages(room_id, author_name, text, client_message_id)
         VALUES ($1, $2, $3, $4) ON CONFLICT (client_message_id) DO NOTHING
         RETURNING ${messageColumns}`,
        [roomId, authorName, text, clientMessageId],
      );
      if (rows[0]) return { message: rows[0], created: true };
      const existing = (await pool.query(
        `SELECT ${messageColumns} FROM messages WHERE client_message_id = $1`, [clientMessageId],
      )).rows[0];
      if (!existing || existing.roomId !== roomId || existing.authorName !== authorName || existing.text !== text) {
        throw new AppError('MESSAGE_ID_CONFLICT', 'Этот clientMessageId уже использован для другого сообщения.', 409);
      }
      return { message: existing, created: false };
    },
    close() { return pool.end(); },
  };
}
