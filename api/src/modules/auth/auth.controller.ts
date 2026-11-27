import { OpenAPIHono } from '@hono/zod-openapi'
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { Routes } from '#common/types'
import { db, getServerSecret } from './db'

const SECRET = getServerSecret()

export interface SyncedLibraryPayload {
  likedSongs: unknown[]
  savedAlbums: unknown[]
  savedPlaylists: unknown[]
  followedArtists: unknown[]
  recentlyPlayed: unknown[]
  userPlaylists: unknown[]
  language: string
  theme: 'dark' | 'light'
}

const DEFAULT_LIBRARY: SyncedLibraryPayload = {
  likedSongs: [],
  savedAlbums: [],
  savedPlaylists: [],
  followedArtists: [],
  recentlyPlayed: [],
  userPlaylists: [],
  language: 'english,hindi',
  theme: 'dark'
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(':')
  if (!salt || !hashHex) return false
  const derived = scryptSync(password, salt, 64)
  const expected = Buffer.from(hashHex, 'hex')
  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}

function signToken(payload: { userId: string; username: string; email: string }): string {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 60 })
  ).toString('base64url')
  const sig = createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

function verifyToken(token: string): { userId: string; username: string; email: string } | null {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = createHmac('sha256', SECRET).update(body).digest('base64url')
  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      userId: string
      username: string
      email: string
      exp: number
    }
    if (!parsed.userId || parsed.exp < Date.now()) return null
    return { userId: parsed.userId, username: parsed.username, email: parsed.email }
  } catch {
    return null
  }
}

function sanitizeLibrary(input: unknown): SyncedLibraryPayload {
  const raw = (input && typeof input === 'object' ? input : {}) as Partial<SyncedLibraryPayload>
  return {
    likedSongs: Array.isArray(raw.likedSongs) ? raw.likedSongs : [],
    savedAlbums: Array.isArray(raw.savedAlbums) ? raw.savedAlbums : [],
    savedPlaylists: Array.isArray(raw.savedPlaylists) ? raw.savedPlaylists : [],
    followedArtists: Array.isArray(raw.followedArtists) ? raw.followedArtists : [],
    recentlyPlayed: Array.isArray(raw.recentlyPlayed) ? raw.recentlyPlayed.slice(0, 30) : [],
    userPlaylists: Array.isArray(raw.userPlaylists) ? raw.userPlaylists : [],
    language: typeof raw.language === 'string' && raw.language ? raw.language : 'english,hindi',
    theme: raw.theme === 'light' ? 'light' : 'dark'
  }
}

function getBearerUser(authHeader?: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null
  return verifyToken(authHeader.slice(7).trim())
}

export class AuthController implements Routes {
  public controller: OpenAPIHono

  constructor() {
    this.controller = new OpenAPIHono()
  }

  public initRoutes() {
    this.controller.post('/auth/register', async (ctx) => {
      const body = (await ctx.req.json()) as {
        username?: string
        email?: string
        password?: string
        initialLibrary?: unknown
      }

      const username = (body.username || '').trim()
      const email = (body.email || '').trim().toLowerCase()
      const password = body.password || ''

      if (username.length < 2) {
        return ctx.json({ success: false, message: 'Username must be at least 2 characters' }, 400)
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return ctx.json({ success: false, message: 'Please enter a valid email address' }, 400)
      }
      if (password.length < 6) {
        return ctx.json({ success: false, message: 'Password must be at least 6 characters' }, 400)
      }

      const existing = db
        .query<{ id: string }, [string, string]>(
          `SELECT id FROM users WHERE lower(username) = lower(?) OR lower(email) = lower(?)`
        )
        .get(username, email)

      if (existing) {
        return ctx.json({ success: false, message: 'Username or email is already registered' }, 409)
      }

      const userId = randomBytes(12).toString('hex')
      const now = Date.now()
      const passwordHash = hashPassword(password)
      const library = body.initialLibrary ? sanitizeLibrary(body.initialLibrary) : DEFAULT_LIBRARY

      db.query(
        `INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`
      ).run(userId, username, email, passwordHash, now)

      db.query(`INSERT INTO user_library (user_id, payload, updated_at) VALUES (?, ?, ?)`).run(
        userId,
        JSON.stringify(library),
        now
      )

      const token = signToken({ userId, username, email })
      return ctx.json({
        success: true,
        data: {
          user: { id: userId, username, email },
          token,
          library,
          updatedAt: now
        }
      })
    })

    this.controller.post('/auth/login', async (ctx) => {
      const body = (await ctx.req.json()) as {
        identifier?: string
        password?: string
      }

      const identifier = (body.identifier || '').trim()
      const password = body.password || ''

      if (!identifier || !password) {
        return ctx.json({ success: false, message: 'Email/username and password are required' }, 400)
      }

      const userRow = db
        .query<{ id: string; username: string; email: string; password_hash: string }, [string, string]>(
          `SELECT id, username, email, password_hash FROM users WHERE lower(email) = lower(?) OR lower(username) = lower(?)`
        )
        .get(identifier, identifier)

      if (!userRow || !verifyPassword(password, userRow.password_hash)) {
        return ctx.json({ success: false, message: 'Invalid credentials' }, 401)
      }

      const libRow = db
        .query<{ payload: string; updated_at: number }, [string]>(
          `SELECT payload, updated_at FROM user_library WHERE user_id = ?`
        )
        .get(userRow.id)

      const library = libRow ? sanitizeLibrary(JSON.parse(libRow.payload)) : DEFAULT_LIBRARY
      const token = signToken({
        userId: userRow.id,
        username: userRow.username,
        email: userRow.email
      })

      return ctx.json({
        success: true,
        data: {
          user: { id: userRow.id, username: userRow.username, email: userRow.email },
          token,
          library,
          updatedAt: libRow?.updated_at || Date.now()
        }
      })
    })

    this.controller.get('/auth/me', async (ctx) => {
      const authUser = getBearerUser(ctx.req.header('Authorization'))
      if (!authUser) {
        return ctx.json({ success: false, message: 'Unauthorized' }, 401)
      }

      const userRow = db
        .query<{ id: string; username: string; email: string }, [string]>(
          `SELECT id, username, email FROM users WHERE id = ?`
        )
        .get(authUser.userId)

      if (!userRow) {
        return ctx.json({ success: false, message: 'Account not found' }, 404)
      }

      const libRow = db
        .query<{ payload: string; updated_at: number }, [string]>(
          `SELECT payload, updated_at FROM user_library WHERE user_id = ?`
        )
        .get(userRow.id)

      const library = libRow ? sanitizeLibrary(JSON.parse(libRow.payload)) : DEFAULT_LIBRARY
      return ctx.json({
        success: true,
        data: {
          user: userRow,
          library,
          updatedAt: libRow?.updated_at || Date.now()
        }
      })
    })

    this.controller.get('/sync/library', async (ctx) => {
      const authUser = getBearerUser(ctx.req.header('Authorization'))
      if (!authUser) {
        return ctx.json({ success: false, message: 'Unauthorized' }, 401)
      }

      const libRow = db
        .query<{ payload: string; updated_at: number }, [string]>(
          `SELECT payload, updated_at FROM user_library WHERE user_id = ?`
        )
        .get(authUser.userId)

      return ctx.json({
        success: true,
        data: {
          library: libRow ? sanitizeLibrary(JSON.parse(libRow.payload)) : DEFAULT_LIBRARY,
          updatedAt: libRow?.updated_at || Date.now()
        }
      })
    })

    this.controller.put('/sync/library', async (ctx) => {
      const authUser = getBearerUser(ctx.req.header('Authorization'))
      if (!authUser) {
        return ctx.json({ success: false, message: 'Unauthorized' }, 401)
      }

      const body = await ctx.req.json()
      const library = sanitizeLibrary(body)
      const now = Date.now()

      db.query(
        `INSERT INTO user_library (user_id, payload, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`
      ).run(authUser.userId, JSON.stringify(library), now)

      return ctx.json({
        success: true,
        data: { updatedAt: now }
      })
    })
  }
}
