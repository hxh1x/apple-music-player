import { existsSync } from 'node:fs'
import path from 'node:path'
import { OpenAPIHono } from '@hono/zod-openapi'
import { userAgents } from '#common/constants'
import type { Routes } from '#common/types'
import { AlbumService } from '#modules/albums/services'
import { PlaylistService } from '#modules/playlists/services'
import { SongService } from '#modules/songs/services'
import { embedMp3Id3Tags } from './id3-tagger'
import { buildZipArchive, type ZipEntry } from './zip-builder'

type Quality = '320kbps' | '160kbps' | '96kbps'

function resolveFfmpegPath(): string {
  const candidates = [
    path.resolve(process.cwd(), '../.tools/ffmpeg.exe'),
    path.resolve(process.cwd(), '.tools/ffmpeg.exe')
  ]
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  return 'ffmpeg'
}

const FFMPEG_BIN = resolveFfmpegPath()

const mp3Cache = new Map<string, { filename: string; bytes: Uint8Array }>()
function setCachedMp3(key: string, val: { filename: string; bytes: Uint8Array }) {
  if (mp3Cache.size >= 12) {
    const firstKey = mp3Cache.keys().next().value
    if (firstKey) mp3Cache.delete(firstKey)
  }
  mp3Cache.set(key, val)
}

function decodeHtml(str?: string | null): string {
  if (!str) return ''
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

function pickDownloadUrl(
  links: Array<{ quality: string; url: string }> | undefined,
  preferred: Quality = '320kbps'
): string | null {
  if (!links?.length) return null
  const order: Quality[] =
    preferred === '320kbps'
      ? ['320kbps', '160kbps', '96kbps']
      : preferred === '160kbps'
        ? ['160kbps', '320kbps', '96kbps']
        : ['96kbps', '160kbps', '320kbps']
  for (const q of order) {
    const match = links.find((l) => l.quality === q)
    if (match?.url) return match.url
  }
  return links[links.length - 1]?.url || null
}

function qualityToMp3Bitrate(quality: Quality): string {
  if (quality === '320kbps') return '320k'
  if (quality === '160kbps') return '192k'
  return '128k'
}

async function transcodeMp4ToMp3(mp4Bytes: Uint8Array, bitrate: string): Promise<Uint8Array> {
  const proc = Bun.spawn(
    [
      FFMPEG_BIN,
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      'pipe:0',
      '-vn',
      '-c:a',
      'libmp3lame',
      '-b:a',
      bitrate,
      '-threads',
      '2',
      '-compression_level',
      '7',
      '-write_xing',
      '1',
      '-f',
      'mp3',
      'pipe:1'
    ],
    {
      stdin: mp4Bytes,
      stdout: 'pipe',
      stderr: 'pipe'
    }
  )
  const [outBuf, errBuf, exitCode] = await Promise.all([
    new Response(proc.stdout).arrayBuffer(),
    new Response(proc.stderr).text(),
    proc.exited
  ])
  if (exitCode !== 0 || outBuf.byteLength === 0) {
    throw new Error(`FFmpeg conversion failed: ${errBuf || exitCode}`)
  }
  return new Uint8Array(outBuf)
}

async function fetchFullLyrics(params: {
  id: string
  title: string
  artist: string
  album?: string
  duration?: number | null
}): Promise<string | undefined> {
  const cleanTitle = params.title.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim()
  const primaryArtist = params.artist.split(',')[0]?.trim() || params.artist

  // 1. Try LRCLIB (works for both global and Indian songs, gives clean plain + synced lyrics)
  try {
    const u = new URL('https://lrclib.net/api/get')
    u.searchParams.set('track_name', cleanTitle)
    u.searchParams.set('artist_name', primaryArtist)
    if (params.album) u.searchParams.set('album_name', params.album)
    if (params.duration) u.searchParams.set('duration', String(Math.round(params.duration)))
    const res = await fetch(u.toString(), {
      headers: { 'User-Agent': 'AppleMusicJioSaavn/1.0' },
      signal: AbortSignal.timeout(4000)
    })
    if (res.ok) {
      const json = (await res.json()) as { plainLyrics?: string; syncedLyrics?: string }
      const text = json.plainLyrics || json.syncedLyrics
      if (text) return text.replace(/^\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]\s*/gm, '').trim()
    }
  } catch {
    // fall through
  }

  try {
    const su = new URL('https://lrclib.net/api/search')
    su.searchParams.set('track_name', cleanTitle)
    su.searchParams.set('artist_name', primaryArtist)
    const sRes = await fetch(su.toString(), {
      headers: { 'User-Agent': 'AppleMusicJioSaavn/1.0' },
      signal: AbortSignal.timeout(4000)
    })
    if (sRes.ok) {
      const arr = (await sRes.json()) as Array<{ plainLyrics?: string; syncedLyrics?: string }>
      const best = arr.find((r) => r.plainLyrics) || arr.find((r) => r.syncedLyrics)
      const text = best?.plainLyrics || best?.syncedLyrics
      if (text) return text.replace(/^\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]\s*/gm, '').trim()
    }
  } catch {
    // fall through
  }

  // 2. Fallback to JioSaavn lyrics.getLyrics
  try {
    const ua = userAgents[Math.floor(Math.random() * userAgents.length)]
    const url = new URL('https://www.jiosaavn.com/api.php')
    url.searchParams.set('__call', 'lyrics.getLyrics')
    url.searchParams.set('_format', 'json')
    url.searchParams.set('_marker', '0')
    url.searchParams.set('api_version', '4')
    url.searchParams.set('ctx', 'web6dot0')
    url.searchParams.set('lyrics_id', params.id)
    const res = await fetch(url.toString(), { headers: { 'User-Agent': ua } })
    const data = (await res.json()) as { lyrics?: string }
    if (data?.lyrics) {
      return decodeHtml(data.lyrics.replace(/<br\s*\/?>/gi, '\n')).trim()
    }
  } catch {
    // ignore
  }

  return undefined
}

export class DownloadController implements Routes {
  public controller: OpenAPIHono
  private songService: SongService
  private playlistService: PlaylistService
  private albumService: AlbumService

  constructor() {
    this.controller = new OpenAPIHono()
    this.songService = new SongService()
    this.playlistService = new PlaylistService()
    this.albumService = new AlbumService()
  }

  private async buildTaggedMp3File(
    songId: string,
    quality: Quality,
    trackNumber?: number,
    totalTracks?: number
  ): Promise<{ filename: string; bytes: Uint8Array }> {
    const cacheKey = `${songId}:${quality}:${trackNumber || 0}:${totalTracks || 0}`
    const cached = mp3Cache.get(cacheKey)
    if (cached) return cached

    const songs = await this.songService.getSongByIds({ songIds: songId })
    const song = songs[0]
    if (!song) throw new Error(`Song ${songId} not found`)

    const audioUrl = pickDownloadUrl(song.downloadUrl, quality)
    if (!audioUrl) throw new Error(`No stream available for ${song.name}`)

    const title = decodeHtml(song.name)
    const primaryArtists =
      song.artists?.primary?.map((a) => decodeHtml(a.name)).filter(Boolean).join(', ') || 'Unknown Artist'
    const albumName = decodeHtml(song.album?.name) || title

    const coverUrl =
      song.image?.find((i) => i.quality === '500x500')?.url ||
      song.image?.[song.image.length - 1]?.url

    const [audioBuf, coverBuf, lyrics] = await Promise.all([
      fetch(audioUrl).then(async (r) => {
        if (!r.ok) throw new Error(`Audio fetch failed (${r.status})`)
        return new Uint8Array(await r.arrayBuffer())
      }),
      coverUrl
        ? fetch(coverUrl)
            .then(async (r) => (r.ok ? new Uint8Array(await r.arrayBuffer()) : undefined))
            .catch(() => undefined)
        : Promise.resolve(undefined),
      fetchFullLyrics({
        id: song.id,
        title,
        artist: primaryArtists,
        album: albumName,
        duration: song.duration
      })
    ])

    const rawMp3 = await transcodeMp4ToMp3(audioBuf, qualityToMp3Bitrate(quality))

    const taggedMp3 = embedMp3Id3Tags(rawMp3, {
      title,
      artist: primaryArtists,
      albumArtist: primaryArtists,
      album: albumName,
      year: song.year || undefined,
      label: decodeHtml(song.label) || undefined,
      copyright: decodeHtml(song.copyright) || undefined,
      lyrics,
      trackNumber,
      totalTracks,
      coverArt: coverBuf
    })

    const prefix = trackNumber ? `${String(trackNumber).padStart(2, '0')} - ` : ''
    const filename = `${prefix}${sanitizeFilename(`${primaryArtists} - ${title}`) || song.id}.mp3`
    const result = { filename, bytes: taggedMp3 }
    setCachedMp3(cacheKey, result)
    return result
  }

  public initRoutes() {
    this.controller.get('/download/song', async (ctx) => {
      const id = ctx.req.query('id')
      const quality = (ctx.req.query('quality') as Quality) || '320kbps'
      const trackParam = ctx.req.query('track')
      const totalParam = ctx.req.query('total')
      if (!id) return ctx.json({ success: false, message: 'Song id is required' }, 400)

      const { filename, bytes } = await this.buildTaggedMp3File(
        id,
        quality,
        trackParam ? Number(trackParam) : undefined,
        totalParam ? Number(totalParam) : undefined
      )

      const asciiName = filename.replace(/[^\x20-\x7E]/g, '_')
      return new Response(bytes, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(bytes.length),
          'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`
        }
      })
    })

    this.controller.post('/download/zip', async (ctx) => {
      const body = (await ctx.req.json()) as {
        title?: string
        quality?: Quality
        songIds?: string[]
        collectionType?: 'playlist' | 'album'
        collectionId?: string
      }

      const quality: Quality = body.quality || '320kbps'
      let title = sanitizeFilename(body.title || 'Music Collection') || 'Music Collection'
      let songIds = body.songIds || []

      if (!songIds.length && body.collectionType && body.collectionId) {
        if (body.collectionType === 'playlist') {
          const pl = await this.playlistService.getPlaylistById({
            id: body.collectionId,
            page: 0,
            limit: 60
          })
          title = sanitizeFilename(decodeHtml(pl.name)) || title
          songIds = (pl.songs || []).map((s) => s.id)
        } else {
          const al = await this.albumService.getAlbumById(body.collectionId)
          title = sanitizeFilename(decodeHtml(al.name)) || title
          songIds = (al.songs || []).map((s) => s.id)
        }
      }

      if (!songIds.length) {
        return ctx.json({ success: false, message: 'No songs provided to download' }, 400)
      }

      const targetIds = songIds.slice(0, 60)
      const totalTracks = targetIds.length
      const entries: ZipEntry[] = []
      const usedNames = new Set<string>()

      // Process in chunks of 3 concurrent FFmpeg transcodes
      for (let i = 0; i < targetIds.length; i += 3) {
        const batch = targetIds.slice(i, i + 3)
        const results = await Promise.allSettled(
          batch.map((sid, idx) => this.buildTaggedMp3File(sid, quality, i + idx + 1, totalTracks))
        )
        for (const r of results) {
          if (r.status === 'fulfilled') {
            let name = r.value.filename
            if (usedNames.has(name)) {
              name = name.replace(/\.mp3$/, ` (${usedNames.size}).mp3`)
            }
            usedNames.add(name)
            entries.push({ name: `${title}/${name}`, data: r.value.bytes })
          }
        }
      }

      if (!entries.length) {
        return ctx.json({ success: false, message: 'Failed to download tracks' }, 500)
      }

      const zipBytes = buildZipArchive(entries)
      const zipFilename = `${title}.zip`
      const asciiZip = zipFilename.replace(/[^\x20-\x7E]/g, '_')

      return new Response(zipBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Length': String(zipBytes.length),
          'Content-Disposition': `attachment; filename="${asciiZip}"; filename*=UTF-8''${encodeURIComponent(zipFilename)}`
        }
      })
    })
  }
}
