import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'

const dataDir = path.resolve(process.cwd(), 'data')
mkdirSync(dataDir, { recursive: true })

export const db = new Database(path.join(dataDir, 'music.db'), { create: true })

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_library (
    user_id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`)

export function getServerSecret(): string {
  const row = db.query<{ value: string }, []>(`SELECT value FROM meta WHERE key = 'jwt_secret'`).get()
  if (row?.value) return row.value
  const secret = randomBytes(32).toString('hex')
  db.query(`INSERT INTO meta (key, value) VALUES ('jwt_secret', ?)`).run(secret)
  return secret
}
