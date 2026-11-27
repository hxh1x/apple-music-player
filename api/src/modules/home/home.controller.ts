import { OpenAPIHono } from '@hono/zod-openapi'
import {
  createDownloadLinks,
  createImageLinks,
  getGlobalStarterSongs,
  HOME_ARTIST_QUERIES
} from '#common/helpers'
import { userAgents } from '#common/constants'
import { PlaylistService } from '#modules/playlists/services'
import { SearchService } from '#modules/search/services'
import { SongService } from '#modules/songs/services'
import type { Routes } from '#common/types'

interface SyncedLyricLine {
  time: number
  text: string
}

function parseLrc(lrc: string): SyncedLyricLine[] {
  const lines: SyncedLyricLine[] = []
  const regex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)/
  for (const rawLine of lrc.split(/\r?\n/)) {
    const match = rawLine.match(regex)
    if (!match) continue
    const mins = Number(match[1])
    const secs = Number(match[2])
    const msStr = (match[3] || '0').padEnd(3, '0').slice(0, 3)
    const time = mins * 60 + secs + Number(msStr) / 1000
    const text = match[4].trim()
    if (text) {
      lines.push({ time, text })
    }
  }
  return lines
}

async function fetchLrcLib(params: {
  title: string
  artist: string
  album?: string
  duration?: number | null
}): Promise<{ synced: SyncedLyricLine[] | null; plain: string | null } | null> {
  const cleanTitle = params.title.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim()
  const primaryArtist = params.artist.split(',')[0]?.trim() || params.artist

  try {
    const getUrl = new URL('https://lrclib.net/api/get')
    getUrl.searchParams.set('track_name', cleanTitle)
    getUrl.searchParams.set('artist_name', primaryArtist)
    if (params.album) getUrl.searchParams.set('album_name', params.album)
    if (params.duration) getUrl.searchParams.set('duration', String(Math.round(params.duration)))

    const res = await fetch(getUrl.toString(), {
      headers: { 'User-Agent': 'AppleMusicJioSaavn/1.0' }
    })
    if (res.ok) {
      const json = (await res.json()) as { syncedLyrics?: string; plainLyrics?: string }
      if (json.syncedLyrics || json.plainLyrics) {
        const synced = json.syncedLyrics ? parseLrc(json.syncedLyrics) : null
        return {
          synced: synced && synced.length > 0 ? synced : null,
          plain: json.plainLyrics || null
        }
      }
    }
  } catch {
    // fall through to search
  }

  try {
    const searchUrl = new URL('https://lrclib.net/api/search')
    searchUrl.searchParams.set('track_name', cleanTitle)
    searchUrl.searchParams.set('artist_name', primaryArtist)
    const sRes = await fetch(searchUrl.toString(), {
      headers: { 'User-Agent': 'AppleMusicJioSaavn/1.0' }
    })
    if (sRes.ok) {
      const results = (await sRes.json()) as Array<{
        syncedLyrics?: string
        plainLyrics?: string
      }>
      const best = results.find((r) => r.syncedLyrics) || results.find((r) => r.plainLyrics)
      if (best) {
        const synced = best.syncedLyrics ? parseLrc(best.syncedLyrics) : null
        return {
          synced: synced && synced.length > 0 ? synced : null,
          plain: best.plainLyrics || null
        }
      }
    }
  } catch {
    // ignore
  }
  return null
}

interface RawItem {
  id: string
  title?: string
  name?: string
  subtitle?: string
  secondary_subtitle?: string
  header_desc?: string
  type?: string
  perma_url?: string
  image?: string
  language?: string
  year?: string
  explicit_content?: string
  count?: number | string
  more_info?: {
    song_count?: string
    follower_count?: string
    duration?: string
    encrypted_media_url?: string
    album?: string
    album_id?: string
    firstname?: string
    artistMap?: {
      primary_artists?: Array<{ id: string; name: string; image?: string; perma_url?: string; role?: string }>
    }
  }
}

const decodeHtml = (input?: string): string => {
  if (!input) return ''
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

const normalizeHomeItem = (item: RawItem) => {
  const primaryArtists = item.more_info?.artistMap?.primary_artists?.map((a) => ({
    id: a.id,
    name: decodeHtml(a.name),
    role: a.role || 'primary_artists',
    image: createImageLinks(a.image || ''),
    type: 'artist',
    url: a.perma_url || ''
  })) || []

  return {
    id: item.id,
    name: decodeHtml(item.title || item.name || ''),
    subtitle: decodeHtml(item.subtitle || item.secondary_subtitle || item.more_info?.firstname || ''),
    type: item.type || 'playlist',
    url: item.perma_url || '',
    language: item.language || '',
    year: item.year || null,
    explicitContent: item.explicit_content === '1',
    songCount: item.count ? Number(item.count) : item.more_info?.song_count ? Number(item.more_info.song_count) : null,
    duration: item.more_info?.duration ? Number(item.more_info.duration) : null,
    album: item.more_info?.album
      ? { id: item.more_info.album_id || null, name: decodeHtml(item.more_info.album), url: null }
      : null,
    artists: {
      primary: primaryArtists
    },
    image: createImageLinks(item.image || ''),
    downloadUrl: item.more_info?.encrypted_media_url
      ? createDownloadLinks(item.more_info.encrypted_media_url)
      : []
  }
}

export class HomeController implements Routes {
  public controller: OpenAPIHono
  private songService: SongService
  private playlistService: PlaylistService
  private searchService: SearchService

  constructor() {
    this.controller = new OpenAPIHono()
    this.songService = new SongService()
    this.playlistService = new PlaylistService()
    this.searchService = new SearchService()
  }

  public initRoutes() {
    this.controller.get('/home', async (ctx) => {
      const language =
        ctx.req.query('language') ||
        'hindi,english,punjabi,tamil,telugu,marathi,bengali,kannada,malayalam,gujarati'
      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]
      const url = 'https://www.jiosaavn.com/api.php?__call=webapi.getLaunchData&_format=json&_marker=0&api_version=4&ctx=web6dot0&cc=in'

      const [response, intlPlaylist] = await Promise.all([
        fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': randomUserAgent,
            Cookie: `L=${encodeURIComponent(language)}; gdpr_acceptance=true; DL=english`
          }
        }),
        this.playlistService
          .getPlaylistById({ id: '1134595537', page: 0, limit: 20 })
          .catch(() => null)
      ])

      const raw = (await response.json()) as Record<string, unknown>
      const mapList = (key: string) =>
        Array.isArray(raw[key]) ? (raw[key] as RawItem[]).map(normalizeHomeItem) : []

      const isSpamSleep = (name: string) =>
        /sleep songs|baby sleep|lullaby|meditation at the spa/i.test(name)

      const intlSongs = (intlPlaylist?.songs || []).map((s) => ({
        id: s.id,
        name: decodeHtml(s.name),
        subtitle: s.artists?.primary?.map((a) => decodeHtml(a.name)).join(', ') || '',
        type: 'song',
        url: s.url,
        language: s.language || 'english',
        year: s.year,
        explicitContent: s.explicitContent,
        songCount: null,
        duration: s.duration,
        album: s.album,
        artists: { primary: s.artists?.primary || [] },
        image: s.image,
        downloadUrl: s.downloadUrl
      }))

      const intlAlbums = (intlPlaylist?.songs || [])
        .filter((s) => s.album?.id && s.album?.name)
        .map((s) => ({
          id: s.album!.id!,
          name: decodeHtml(s.album!.name!),
          subtitle: s.artists?.primary?.map((a) => decodeHtml(a.name)).join(', ') || 'Album',
          type: 'album',
          url: s.album?.url || '',
          language: s.language || 'english',
          year: s.year,
          explicitContent: s.explicitContent,
          songCount: null,
          duration: null,
          album: null,
          artists: { primary: s.artists?.primary || [] },
          image: s.image,
          downloadUrl: []
        }))

      const intlArtists = (intlPlaylist?.songs || [])
        .flatMap((s) => s.artists?.primary || [])
        .filter((a) => a.id && a.name && a.image?.length)
        .map((a) => ({
          id: a.id,
          name: decodeHtml(a.name),
          subtitle: 'Artist',
          type: 'artist',
          url: a.url || '',
          language: 'english',
          year: null,
          explicitContent: false,
          songCount: null,
          duration: null,
          album: null,
          artists: { primary: [] },
          image: a.image,
          downloadUrl: []
        }))

      const dedupeById = <T extends { id: string }>(arr: T[]) => {
        const seen = new Set<string>()
        return arr.filter((item) => {
          if (!item.id || seen.has(item.id)) return false
          seen.add(item.id)
          return true
        })
      }

      const rawArtists = Array.isArray(raw['artist_recos'])
        ? (raw['artist_recos'] as RawItem[]).map((a) => ({
            ...normalizeHomeItem(a),
            type: 'artist',
            subtitle: 'Artist'
          }))
        : []

      // When hosted outside India (e.g. Render US), JioSaavn hides artist_recos & intl playlists;
      // populate Global/US + Indian hits via song.getDetails (unblocked on all IPs) and real Artist search.
      let fallbackSongs: typeof intlSongs = []
      let fallbackAlbums: typeof intlAlbums = []
      let fallbackArtists: typeof intlArtists = []

      if (intlSongs.length < 4 || rawArtists.length < 4) {
        const [starterSongs, artistBatches] = await Promise.all([
          getGlobalStarterSongs(),
          Promise.all(
            HOME_ARTIST_QUERIES.map((q) =>
              this.searchService
                .searchArtists({ query: q, page: 0, limit: 1 })
                .then((r) => r.results?.[0] || null)
                .catch(() => null)
            )
          )
        ])

        for (const s of starterSongs) {
          fallbackSongs.push({
            id: s.id,
            name: decodeHtml(s.name),
            subtitle: s.artists?.primary?.map((a) => decodeHtml(a.name)).join(', ') || '',
            type: 'song',
            url: s.url,
            language: s.language || 'english',
            year: s.year,
            explicitContent: s.explicitContent,
            songCount: null,
            duration: s.duration,
            album: s.album,
            artists: { primary: s.artists?.primary || [] },
            image: s.image,
            downloadUrl: s.downloadUrl
          })
          if (s.album?.id && s.album?.name) {
            fallbackAlbums.push({
              id: s.album.id,
              name: decodeHtml(s.album.name),
              subtitle: s.artists?.primary?.map((a) => decodeHtml(a.name)).join(', ') || 'Album',
              type: 'album',
              url: s.album.url || '',
              language: s.language || 'english',
              year: s.year,
              explicitContent: s.explicitContent,
              songCount: null,
              duration: null,
              album: null,
              artists: { primary: s.artists?.primary || [] },
              image: s.image,
              downloadUrl: []
            })
          }
        }

        for (const a of artistBatches) {
          if (a && a.id && a.name) {
            fallbackArtists.push({
              id: a.id,
              name: decodeHtml(a.name),
              subtitle: 'Artist',
              type: 'artist',
              url: a.url || '',
              language: 'english',
              year: null,
              explicitContent: false,
              songCount: null,
              duration: null,
              album: null,
              artists: { primary: [] },
              image: a.image,
              downloadUrl: []
            })
          }
        }
      }

      // Interleave international + regional artists, albums, and trending songs
      const mixedArtists = dedupeById([
        ...intlArtists.slice(0, 8),
        ...fallbackArtists,
        ...rawArtists.slice(0, 8),
        ...intlArtists.slice(8)
      ])
      const regionalAlbums = mapList('new_albums').filter((i) => !isSpamSleep(i.name))
      const regionalTrending = mapList('new_trending').filter((i) => !isSpamSleep(i.name))

      const interleave = <T extends { id: string }>(primary: T[], secondary: T[]) => {
        const out: T[] = []
        const max = Math.max(primary.length, secondary.length)
        for (let i = 0; i < max; i++) {
          if (i < primary.length) out.push(primary[i])
          if (i < secondary.length) out.push(secondary[i])
        }
        return dedupeById(out)
      }

      return ctx.json({
        success: true,
        data: {
          trending: interleave([...intlSongs.slice(0, 10), ...fallbackSongs], regionalTrending),
          charts: mapList('charts'),
          albums: interleave([...intlAlbums.slice(0, 10), ...fallbackAlbums], regionalAlbums),
          playlists: mapList('top_playlists'),
          artists: mixedArtists,
          freshHits: mapList('promo:vx:data:68'),
          genresMoods: mapList('promo:vx:data:76'),
          decades: mapList('promo:vx:data:185')
        }
      })
    })

    this.controller.get('/songs/:id/lyrics', async (ctx) => {
      const id = ctx.req.param('id')
      let title = ctx.req.query('title') || ''
      let artist = ctx.req.query('artist') || ''
      let album = ctx.req.query('album') || ''
      let duration = ctx.req.query('duration') ? Number(ctx.req.query('duration')) : null

      if (!title || !artist) {
        try {
          const songs = await this.songService.getSongByIds({ songIds: id })
          const s = songs[0]
          if (s) {
            title = decodeHtml(s.name)
            artist = s.artists?.primary?.map((a) => decodeHtml(a.name)).filter(Boolean).join(', ') || ''
            album = decodeHtml(s.album?.name)
            duration = s.duration
          }
        } catch {
          // continue to JioSaavn lyrics attempt
        }
      }

      // 1. Try LRCLIB (supports time-synced LRC + plain lyrics for global & Indian catalog)
      if (title && artist) {
        const lrc = await fetchLrcLib({ title, artist, album, duration })
        if (lrc && (lrc.synced || lrc.plain)) {
          const plainHtml = (lrc.plain || lrc.synced?.map((l) => l.text).join('\n') || '').replace(
            /\r?\n/g,
            '<br />'
          )
          return ctx.json({
            success: true,
            data: {
              synced: lrc.synced,
              lyrics: plainHtml,
              snippet: '',
              copyright: '',
              source: 'lrclib'
            }
          })
        }
      }

      // 2. Fallback to JioSaavn lyrics.getLyrics
      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]
      const url = new URL('https://www.jiosaavn.com/api.php')
      url.searchParams.set('__call', 'lyrics.getLyrics')
      url.searchParams.set('_format', 'json')
      url.searchParams.set('_marker', '0')
      url.searchParams.set('api_version', '4')
      url.searchParams.set('ctx', 'web6dot0')
      url.searchParams.set('lyrics_id', id)

      const response = await fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json', 'User-Agent': randomUserAgent }
      })
      const data = (await response.json()) as { lyrics?: string; snippet?: string; lyrics_copyright?: string }

      if (!data?.lyrics) {
        return ctx.json({ success: false, message: 'Lyrics not available for this track' }, 404)
      }

      return ctx.json({
        success: true,
        data: {
          synced: null,
          lyrics: data.lyrics,
          snippet: data.snippet || '',
          copyright: data.lyrics_copyright || '',
          source: 'jiosaavn'
        }
      })
    })
  }
}
