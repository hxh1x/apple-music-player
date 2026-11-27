import { AlbumService } from '#modules/albums/services'
import { SongService } from '#modules/songs/services'
import type { AlbumModel } from '#modules/albums/models'
import type { SongModel } from '#modules/songs/models'
import type { z } from 'zod'

type SongEntity = z.infer<typeof SongModel>
type AlbumEntity = z.infer<typeof AlbumModel>

interface ArtistSeedSpec {
  artistId: string
  names: string[]
  albumIds: string[]
}

/** Verified JioSaavn flagship album IDs whose album.getAlbumDetails + song.getDetails work globally including US IPs. */
export const GLOBAL_ARTIST_SEEDS: ArtistSeedSpec[] = [
  { artistId: '615155', names: ['the weeknd', 'weeknd'], albumIds: ['19531208', '25118096'] },
  { artistId: '565990', names: ['taylor swift'], albumIds: ['39265812', '49624334'] },
  { artistId: '603814', names: ['sabrina carpenter'], albumIds: ['53344805'] },
  { artistId: '612060', names: ['kendrick lamar'], albumIds: ['54052203'] },
  { artistId: '1918741', names: ['billie eilish'], albumIds: ['54389925'] },
  { artistId: '566404', names: ['bruno mars'], albumIds: ['57194862'] },
  { artistId: '567820', names: ['lady gaga'], albumIds: ['57194862'] },
  { artistId: '578407', names: ['ed sheeran'], albumIds: ['10436096', '70391404'] },
  { artistId: '589552', names: ['ariana grande'], albumIds: ['52442940'] },
  { artistId: '1274170', names: ['dua lipa'], albumIds: ['23241654'] },
  { artistId: '575153', names: ['coldplay'], albumIds: ['16219386'] },
  { artistId: '599452', names: ['imagine dragons'], albumIds: ['13435951'] },
  { artistId: '512453', names: ['drake'], albumIds: ['2306373'] },
  { artistId: '610240', names: ['eminem'], albumIds: ['15362948'] },
  { artistId: '2255753', names: ['olivia rodrigo'], albumIds: ['75155662'] },
  { artistId: '577199', names: ['harry styles'], albumIds: ['35081244'] },
  { artistId: '910050', names: ['post malone'], albumIds: ['44705255'] },
  { artistId: '568565', names: ['justin bieber'], albumIds: ['28662278'] },
  { artistId: '5387954', names: ['the kid laroi', 'kid laroi'], albumIds: ['28662278'] },
  { artistId: '859314', names: ['sza'], albumIds: ['41575734'] },
  { artistId: '614647', names: ['travis scott'], albumIds: ['47089165'] }
]

/** Verified global + Indian hit song IDs for single-request /api/songs?ids=... hydration. */
export const GLOBAL_STARTER_SONG_IDS = [
  'fW-Mxsnu', // Blinding Lights - The Weeknd
  '4SQmljgZ', // Cruel Summer - Taylor Swift
  'BhKP6P-H', // Espresso - Sabrina Carpenter
  'qrJ2aEQy', // Not Like Us - Kendrick Lamar
  'JR8ew5Yw', // BIRDS OF A FEATHER - Billie Eilish
  'VaNhRJHr', // Die With A Smile - Lady Gaga, Bruno Mars
  'VuWIzpSf', // Shape of You - Ed Sheeran
  '-4_Zpp7Z', // we can't be friends - Ariana Grande
  '3IoDK8qI', // Levitating - Dua Lipa
  'DYBuG4Ko', // Yellow - Coldplay
  'BeXBcbVK', // Believer - Imagine Dragons
  'TcDP-KUl', // Starboy - The Weeknd
  'vfmUBh3t', // Anti-Hero - Taylor Swift
  'xKlnh38y', // One Dance - Drake
  'It96yG1r', // As It Was - Harry Styles
  'IF2UR2N2', // Sunflower - Post Malone
  '0Ke627qR', // STAY - The Kid LAROI, Justin Bieber
  'ugbJof_Q', // Kill Bill - SZA
  'G1kEe5uL', // FE!N - Travis Scott
  '6o8JoQ8b', // Perfect - Ed Sheeran
  'KGfDrbWe', // Kesariya - Pritam, Arijit Singh
  'aRZbUYD7', // Tum Hi Ho - Arijit Singh
  'M7k5t7vw' // Lover - Diljit Dosanjh
]

export const HOME_ARTIST_QUERIES = [
  'The Weeknd',
  'Taylor Swift',
  'Sabrina Carpenter',
  'Kendrick Lamar',
  'Billie Eilish',
  'Ed Sheeran',
  'Bruno Mars',
  'Ariana Grande',
  'Dua Lipa',
  'Coldplay',
  'Imagine Dragons',
  'Arijit Singh',
  'Diljit Dosanjh',
  'Anirudh Ravichander',
  'A.R. Rahman'
]

const CACHE_TTL_MS = 30 * 60 * 1000

let albumServiceInstance: AlbumService | null = null
let songServiceInstance: SongService | null = null

const getAlbumService = () => {
  if (!albumServiceInstance) albumServiceInstance = new AlbumService()
  return albumServiceInstance
}

const getSongService = () => {
  if (!songServiceInstance) songServiceInstance = new SongService()
  return songServiceInstance
}

let starterSongsCache: { data: SongEntity[]; expiresAt: number } | null = null
let starterSongsInFlight: Promise<SongEntity[]> | null = null

let catalogCache: { albums: AlbumEntity[]; songs: SongEntity[]; expiresAt: number } | null = null
let catalogInFlight: Promise<{ albums: AlbumEntity[]; songs: SongEntity[] }> | null = null

const isTributeOrKaraoke = (text: string) =>
  /\b(karaoke|instrumental|8-bit|16-bit|emulation|lullaby|made famous|tribute to|masala|sleep songs|cover version)\b/i.test(
    text
  )

const decodeBasic = (str: string) =>
  str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

/** Fetch and cache the starter global + Indian hit songs using JioSaavn song.getDetails (works from all IPs). */
export async function getGlobalStarterSongs(): Promise<SongEntity[]> {
  if (starterSongsCache && starterSongsCache.expiresAt > Date.now()) {
    return starterSongsCache.data
  }
  if (starterSongsInFlight) return starterSongsInFlight

  starterSongsInFlight = getSongService()
    .getSongByIds({ songIds: GLOBAL_STARTER_SONG_IDS.join(',') })
    .then((songs) => {
      const valid = songs.filter((s) => s.id && s.downloadUrl?.length)
      starterSongsCache = { data: valid, expiresAt: Date.now() + CACHE_TTL_MS }
      return valid
    })
    .catch(() => [])
    .finally(() => {
      starterSongsInFlight = null
    })

  return starterSongsInFlight
}

/** Fetch and cache curated flagship global albums and their full playable tracklists (works on US IPs). */
export async function getGlobalAlbumCatalog(): Promise<{ albums: AlbumEntity[]; songs: SongEntity[] }> {
  if (catalogCache && catalogCache.expiresAt > Date.now()) {
    return { albums: catalogCache.albums, songs: catalogCache.songs }
  }
  if (catalogInFlight) return catalogInFlight

  const uniqueAlbumIds = Array.from(new Set(GLOBAL_ARTIST_SEEDS.flatMap((a) => a.albumIds)))

  catalogInFlight = Promise.allSettled(uniqueAlbumIds.map((id) => getAlbumService().getAlbumById(id)))
    .then((settled) => {
      const albums: AlbumEntity[] = []
      const songMap = new Map<string, SongEntity>()

      for (const item of settled) {
        if (item.status !== 'fulfilled' || !item.value) continue
        const album = item.value
        albums.push(album)
        for (const s of album.songs || []) {
          if (s.id && !songMap.has(s.id) && s.downloadUrl?.length) {
            songMap.set(s.id, s)
          }
        }
      }

      const songs = Array.from(songMap.values())
      if (albums.length > 0) {
        catalogCache = { albums, songs, expiresAt: Date.now() + CACHE_TTL_MS }
      }
      return { albums, songs }
    })
    .catch(() => ({ albums: [], songs: [] }))
    .finally(() => {
      catalogInFlight = null
    })

  return catalogInFlight
}

/** Populate topSongs and topAlbums for global artists whose JioSaavn artist page is geo-stripped on US IPs. */
export async function getGlobalArtistFallback(
  artistId: string,
  artistName: string
): Promise<{ topSongs: SongEntity[]; topAlbums: AlbumEntity[] }> {
  const normName = decodeBasic(artistName || '').trim().toLowerCase()
  const seed = GLOBAL_ARTIST_SEEDS.find(
    (s) => s.artistId === artistId || s.names.some((n) => normName === n || normName.includes(n))
  )

  let candidateAlbums: AlbumEntity[] = []
  if (seed) {
    const settled = await Promise.allSettled(seed.albumIds.map((id) => getAlbumService().getAlbumById(id)))
    candidateAlbums = settled
      .filter((r): r is PromiseFulfilledResult<AlbumEntity> => r.status === 'fulfilled' && Boolean(r.value))
      .map((r) => r.value)
  }

  if (candidateAlbums.length === 0) {
    const catalog = await getGlobalAlbumCatalog()
    candidateAlbums = catalog.albums.filter(
      (a) =>
        a.artists.primary.some(
          (ar) => ar.id === artistId || decodeBasic(ar.name).toLowerCase() === normName
        ) ||
        (a.songs || []).some((s) =>
          s.artists.primary.some(
            (ar) => ar.id === artistId || decodeBasic(ar.name).toLowerCase() === normName
          )
        )
    )
  }

  const songMap = new Map<string, SongEntity>()
  for (const album of candidateAlbums) {
    for (const s of album.songs || []) {
      if (!s.id || songMap.has(s.id)) continue
      const matchesArtist =
        seed !== undefined ||
        s.artists.primary.some(
          (ar) => ar.id === artistId || decodeBasic(ar.name).toLowerCase() === normName
        )
      if (matchesArtist) {
        songMap.set(s.id, s)
      }
    }
  }

  return {
    topSongs: Array.from(songMap.values()).slice(0, 25),
    topAlbums: candidateAlbums.slice(0, 12)
  }
}

/** Match curated official JioSaavn global songs & albums against a user search query. */
export async function searchGlobalCatalog(query: string): Promise<{
  songs: SongEntity[]
  albums: AlbumEntity[]
  wantsCleanResults: boolean
}> {
  const q = query.trim().toLowerCase()
  if (!q || q.length < 2) return { songs: [], albums: [], wantsCleanResults: false }

  const wantsCleanResults = !isTributeOrKaraoke(q)
  const [{ songs: catalogSongs, albums: catalogAlbums }, starterSongs] = await Promise.all([
    getGlobalAlbumCatalog(),
    getGlobalStarterSongs()
  ])

  const allSongsMap = new Map<string, SongEntity>()
  for (const s of [...starterSongs, ...catalogSongs]) {
    if (s.id && !allSongsMap.has(s.id)) allSongsMap.set(s.id, s)
  }

  const tokens = q.split(/\s+/).filter((t) => t.length >= 2)
  const scoreSong = (s: SongEntity): number => {
    const title = decodeBasic(s.name).toLowerCase()
    const album = decodeBasic(s.album?.name || '').toLowerCase()
    const artists = s.artists.primary.map((a) => decodeBasic(a.name).toLowerCase()).join(' ')
    const combined = `${title} ${artists} ${album}`
    if (!tokens.every((t) => combined.includes(t))) return 0
    let score = 1
    if (title === q) score += 10
    else if (title.includes(q)) score += 6
    if (artists.includes(q)) score += 5
    return score
  }

  const scoreAlbum = (a: AlbumEntity): number => {
    const title = decodeBasic(a.name).toLowerCase()
    const artists = a.artists.primary.map((ar) => decodeBasic(ar.name).toLowerCase()).join(' ')
    const combined = `${title} ${artists}`
    if (!tokens.every((t) => combined.includes(t))) return 0
    let score = 1
    if (title === q) score += 10
    else if (title.includes(q)) score += 6
    if (artists.includes(q)) score += 5
    return score
  }

  const matchedSongs = Array.from(allSongsMap.values())
    .map((s) => ({ item: s, score: scoreSong(s) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item)

  const matchedAlbums = catalogAlbums
    .map((a) => ({ item: a, score: scoreAlbum(a) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item)

  return { songs: matchedSongs, albums: matchedAlbums, wantsCleanResults }
}

export function filterOutKaraoke<T extends { name?: string; title?: string }>(items: T[]): T[] {
  return items.filter((item) => !isTributeOrKaraoke(decodeBasic(item.name || item.title || '')))
}
