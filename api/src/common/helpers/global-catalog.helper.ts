import { AlbumService } from '#modules/albums/services'
import { SongService } from '#modules/songs/services'
import type { AlbumModel } from '#modules/albums/models'
import type { SongModel } from '#modules/songs/models'
import type { z } from 'zod'

type SongEntity = z.infer<typeof SongModel>
type AlbumEntity = z.infer<typeof AlbumModel>

export interface ArtistSeedSpec {
  artistId: string
  names: string[]
  albumIds: string[]
  keywords?: string[]
}

/**
 * Verified JioSaavn artist -> flagship album IDs whose song.getDetails and album.getAlbumDetails
 * endpoints return full playable 320kbps tracks even from non-India server IPs (e.g. Render US/SG).
 */
export const GLOBAL_ARTIST_SEEDS: ArtistSeedSpec[] = [
  { artistId: '615155', names: ['the weeknd', 'weeknd'], albumIds: ['19531208', '25118096'], keywords: ['blinding lights', 'starboy', 'after hours', 'save your tears', 'heartless', 'die for you', 'highlights'] },
  { artistId: '565990', names: ['taylor swift'], albumIds: ['39265812', '49624334'], keywords: ['cruel summer', 'anti-hero', 'midnights', 'lavender haze', 'lover', 'karma'] },
  { artistId: '603814', names: ['sabrina carpenter'], albumIds: ['57366862', '53344805'], keywords: ['espresso', 'short n sweet', 'please please please', 'taste'] },
  { artistId: '612060', names: ['kendrick lamar'], albumIds: ['54052203'], keywords: ['not like us'] },
  { artistId: '1918741', names: ['billie eilish'], albumIds: ['54389925'], keywords: ['birds of a feather', 'hit me hard and soft', 'lunch', 'chihiro'] },
  { artistId: '566404', names: ['bruno mars'], albumIds: ['57194862'], keywords: ['die with a smile'] },
  { artistId: '567820', names: ['lady gaga'], albumIds: ['57194862'], keywords: ['die with a smile'] },
  { artistId: '578407', names: ['ed sheeran'], albumIds: ['10436096', '70391404'], keywords: ['shape of you', 'perfect', 'divide', 'bad habits', 'shivers'] },
  { artistId: '589552', names: ['ariana grande'], albumIds: ['52442940'], keywords: ['we cant be friends', "we can't be friends", 'eternal sunshine', 'yes and'] },
  { artistId: '1274170', names: ['dua lipa'], albumIds: ['23241654'], keywords: ['levitating', 'future nostalgia', 'dont start now', "don't start now", 'physical'] },
  { artistId: '575153', names: ['coldplay'], albumIds: ['16219386'], keywords: ['yellow', 'parachutes', 'sparks', 'shiver'] },
  { artistId: '599452', names: ['imagine dragons'], albumIds: ['13435951'], keywords: ['believer', 'thunder', 'evolve', 'whatever it takes'] },
  { artistId: '512453', names: ['drake'], albumIds: ['2306373'], keywords: ['one dance', 'views', 'hotline bling', 'controlla'] },
  { artistId: '610240', names: ['eminem'], albumIds: ['15362948'], keywords: ['lose yourself', 'just lose it'] },
  { artistId: '2255753', names: ['olivia rodrigo'], albumIds: ['75155662'], keywords: ['drivers license'] },
  { artistId: '577199', names: ['harry styles'], albumIds: ['35081244'], keywords: ['as it was', 'harrys house', "harry's house", 'late night talking'] },
  { artistId: '910050', names: ['post malone'], albumIds: ['44705255'], keywords: ['sunflower', 'circles', 'rockstar', 'congratulations'] },
  { artistId: '568565', names: ['justin bieber'], albumIds: ['28662278'], keywords: ['stay'] },
  { artistId: '5387954', names: ['the kid laroi', 'kid laroi'], albumIds: ['28662278'], keywords: ['stay'] },
  { artistId: '859314', names: ['sza'], albumIds: ['41575734'], keywords: ['kill bill'] },
  { artistId: '614647', names: ['travis scott'], albumIds: ['47089165'], keywords: ['fein', 'fe!n', 'utopia', 'i know', 'meltdown'] },
  { artistId: '598321', names: ['rihanna'], albumIds: ['1789864', '1111244'], keywords: ['diamonds', 'anti', 'kiss it better', 'needed me', 'work'] },
  { artistId: '513159', names: ['michael jackson'], albumIds: ['40041722', '77992384'], keywords: ['beat it', 'billie jean', 'thriller'] },
  { artistId: '527759', names: ['queen'], albumIds: ['77003743'], keywords: ['bohemian rhapsody', 'a night at the opera', 'love of my life'] },
  { artistId: '654619', names: ['linkin park'], albumIds: ['1179494', '54101648'], keywords: ['numb', 'in the end', 'hybrid theory', 'papercuts', 'crawling', 'faint'] },
  { artistId: '606325', names: ['arctic monkeys'], albumIds: ['10131765', '10144428'], keywords: ['do i wanna know', 'i wanna be yours', '505', 'r u mine', 'am'] },
  { artistId: '601595', names: ['lana del rey'], albumIds: ['1130484', '1142508'], keywords: ['summertime sadness', 'young and beautiful', 'born to die', 'video games', 'blue jeans'] },
  { artistId: '528092', names: ['beyonce', 'beyoncé'], albumIds: ['1100751'], keywords: ['halo', 'single ladies', 'if i were a boy'] },
  { artistId: '527097', names: ['kanye west', 'ye'], albumIds: ['1945440', '1115860'], keywords: ['stronger', 'flashing lights', 'graduation', 'good life', 'homecoming'] },
  { artistId: '3315420', names: ['bts'], albumIds: ['31044739'], keywords: ['dynamite'] },
  { artistId: '8711782', names: ['jung kook', 'jungkook'], albumIds: ['49428469'], keywords: ['seven', 'standing next to you', 'golden', '3d'] },
  { artistId: '2518190', names: ['blackpink'], albumIds: ['28638373'], keywords: ['how you like that'] },
  { artistId: '2029479', names: ['bad bunny'], albumIds: ['34762522'], keywords: ['titi me pregunto', 'me porto bonito', 'un verano sin ti', 'ojitos lindos'] },
  { artistId: '565985', names: ['calvin harris'], albumIds: ['1152139'], keywords: ['summer'] },
  { artistId: '601469', names: ['avicii'], albumIds: ['71621964'], keywords: ['wake me up'] },
  { artistId: '1335467', names: ['alan walker'], albumIds: ['14508997'], keywords: ['faded', 'alone', 'darkside', 'different world'] },
  { artistId: '615629', names: ['the chainsmokers', 'chainsmokers'], albumIds: ['2963522'], keywords: ['closer', 'dont let me down', 'setting fires'] },
  { artistId: '862454', names: ['marshmello'], albumIds: ['2337820'], keywords: ['alone'] },
  { artistId: '755042', names: ['charlie puth'], albumIds: ['16226582'], keywords: ['attention', 'how long', 'voicenotes', 'done for me'] },
  { artistId: '739614', names: ['shawn mendes'], albumIds: ['81337997'], keywords: ['stitches', 'treat you better'] },
  { artistId: '597966', names: ['maroon 5'], albumIds: ['1455826'], keywords: ['sugar', 'maps', 'animals', 'payphone', 'moves like jagger'] },
  { artistId: '598351', names: ['onerepublic', 'one republic'], albumIds: ['2339177'], keywords: ['counting stars', 'native', 'if i lose myself'] },
  { artistId: '727680', names: ['hozier'], albumIds: ['2339167'], keywords: ['take me to church'] },
  { artistId: '617132', names: ['tame impala'], albumIds: ['70330717'], keywords: ['the less i know the better'] },
  { artistId: '574561', names: ['frank ocean'], albumIds: ['37503520'], keywords: ['pink + white', 'pink and white', 'nights', 'blonde', 'ivy'] },
  { artistId: '576472', names: ['tyler the creator', 'tyler, the creator'], albumIds: ['11177774'], keywords: ['see you again', 'flower boy', 'boredom'] },
  { artistId: '1665644', names: ['21 savage'], albumIds: ['14691118', '42678691'], keywords: ['a lot', 'creepin', 'heroes and villains'] },
  { artistId: '576342', names: ['future'], albumIds: ['11075731'], keywords: ['mask off'] },
  { artistId: '1001541', names: ['metro boomin'], albumIds: ['42678691'], keywords: ['creepin', 'superhero', 'heroes and villains'] },
  { artistId: '575038', names: ['j. cole', 'j cole'], albumIds: ['31529554'], keywords: ['no role modelz', 'wet dreamz', '2014 forest hills drive', 'love yourz'] },
  { artistId: '570828', names: ['50 cent'], albumIds: ['1125343'], keywords: ['in da club', 'pimp', '21 questions', 'many men'] },
  { artistId: '697799', names: ['doja cat'], albumIds: ['54289830'], keywords: ['paint the town red', 'agora hills'] },
  { artistId: '569160', names: ['nicki minaj'], albumIds: ['1107191'], keywords: ['super bass'] },
  { artistId: '603634', names: ['miley cyrus'], albumIds: ['47896036'], keywords: ['flowers', 'endless summer vacation'] },
  { artistId: '477817', names: ['rema', 'selena gomez'], albumIds: ['44926643'], keywords: ['calm down'] },
  { artistId: '603812', names: ['selena gomez'], albumIds: ['44926643'], keywords: ['calm down'] },
  { artistId: '568707', names: ['sia'], albumIds: ['1759503'], keywords: ['cheap thrills', 'unstoppable', 'chandelier'] },
  { artistId: '1342580', names: ['camila cabello'], albumIds: ['12042117'], keywords: ['havana', 'never be the same'] },
  { artistId: '11623303', names: ['benson boone'], albumIds: ['51148695'], keywords: ['beautiful things'] },
  { artistId: '6397524', names: ['teddy swims'], albumIds: ['53711083'], keywords: ['lose control', 'the door'] },
  { artistId: '3680991', names: ['chappell roan'], albumIds: ['53081584'], keywords: ['good luck babe', 'good luck, babe'] },
  { artistId: '4162772', names: ['tate mcrae'], albumIds: ['48184469'], keywords: ['greedy'] },
  { artistId: '701967', names: ['charli xcx'], albumIds: ['54981300'], keywords: ['apple', 'brat', '360', 'guess'] },
  { artistId: '3448908', names: ['central cee'], albumIds: ['38043906'], keywords: ['doja'] },
  { artistId: '624737', names: ['the beatles', 'beatles'], albumIds: ['2382896'], keywords: ['here comes the sun', 'come together', 'something', 'abbey road'] },
  { artistId: '568665', names: ['david guetta'], albumIds: ['16294623'], keywords: ['titanium'] },
  { artistId: '720746', names: ['twenty one pilots'], albumIds: ['16238633'], keywords: ['stressed out', 'ride', 'heathens', 'blurryface'] },
  { artistId: '582471', names: ['the neighbourhood', 'neighbourhood'], albumIds: ['12795036'], keywords: ['sweater weather', 'afraid', 'i love you'] },
  { artistId: '681966', names: ['ap dhillon'], albumIds: ['22560477'], keywords: ['brown munde'] },
  { artistId: '697691', names: ['karan aujla'], albumIds: ['47572803'], keywords: ['softly', 'making memories'] },
  { artistId: '14087974', names: ['shubh'], albumIds: ['45268609'], keywords: ['cheques', 'still rollin'] },
  { artistId: '6241383', names: ['hanumankind'], albumIds: ['55928397'], keywords: ['big dawgs'] },
  { artistId: '3319750', names: ['sidhu moose wala'], albumIds: ['66335818'], keywords: ['295'] }
]

/** Verified global + Indian hit song IDs hydrated in one fast batch call for /api/home & playlist fallbacks. */
export const GLOBAL_STARTER_SONG_IDS = [
  'fW-Mxsnu', // Blinding Lights - The Weeknd
  '4SQmljgZ', // Cruel Summer - Taylor Swift
  'MncQRJch', // Espresso - Sabrina Carpenter
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
  'fUMvktiR', // Diamonds - Rihanna
  'nWjRJA8R', // Kiss It Better - Rihanna
  'uNDkNIeX', // Beat It - Michael Jackson
  'MfRzXOA6', // Bohemian Rhapsody - Queen
  '-kHTGQQr', // In the End - Linkin Park
  '0NQPTLJg', // Numb - Linkin Park
  'iE8z2T-c', // I Wanna Be Yours - Arctic Monkeys
  'X031nLVY', // 505 - Arctic Monkeys
  'vThnFAZ9', // Summertime Sadness - Lana Del Rey
  'bmyZQVPn', // Halo - Beyonce
  'vdcjl4dH', // Flashing Lights - Kanye West
  'jwf7pyLP', // Dynamite - BTS
  'cgpBLZ-e', // Seven - Jung Kook
  'YthOHb2v', // Titi Me Pregunto - Bad Bunny
  'Pf5IqYMQ', // Closer - The Chainsmokers
  'WsHtbZuu', // Faded - Alan Walker
  'PX3J3pID', // Attention - Charlie Puth
  'Jph__cJ0', // Take Me To Church - Hozier
  'Dvw0ZCh_', // The Less I Know The Better - Tame Impala
  'HWt7Dl7c', // Pink + White - Frank Ocean
  'GI-wViYn', // See You Again - Tyler, The Creator
  'BKwCuS4M', // No Role Modelz - J. Cole
  'tJ3_J4wW', // In Da Club - 50 Cent
  'qM1qDx-m', // Flowers - Miley Cyrus
  'lAvhMilw', // Calm Down - Rema, Selena Gomez
  'iWt8op78', // Cheap Thrills - Sia
  'goiYrrSu', // Beautiful Things - Benson Boone
  'ibJxq97h', // Lose Control - Teddy Swims
  'g6nQ4zq4', // Good Luck, Babe! - Chappell Roan
  'x6_xf8d9', // greedy - Tate McRae
  '8Ti1DvzG', // Sweater Weather - The Neighbourhood
  '3RqR-Q5E', // Stressed Out - Twenty One Pilots
  'tQHkKKpA', // Titanium - David Guetta, Sia
  '1T0Ic4t3', // Here Comes The Sun - The Beatles
  'q7nvYeRF', // Big Dawgs - Hanumankind
  'xzUVX40K', // Brown Munde - AP Dhillon
  'iMzGQX6_', // Softly - Karan Aujla
  'FoOWz-cQ', // Cheques - Shubh
  'H2r9PnvA', // 295 - Sidhu Moose Wala
  'KGfDrbWe', // Kesariya - Pritam, Arijit Singh
  'aRZbUYD7', // Tum Hi Ho - Arijit Singh
  'M7k5t7vw' // Lover - Diljit Dosanjh
]

export const HOME_ARTIST_QUERIES = [
  'The Weeknd',
  'Taylor Swift',
  'Sabrina Carpenter',
  'Billie Eilish',
  'Kendrick Lamar',
  'Ed Sheeran',
  'Bruno Mars',
  'Ariana Grande',
  'Dua Lipa',
  'Coldplay',
  'Imagine Dragons',
  'Drake',
  'Rihanna',
  'Michael Jackson',
  'Linkin Park',
  'Lana Del Rey',
  'Arctic Monkeys',
  'BTS',
  'Arijit Singh',
  'Diljit Dosanjh',
  'Pritam',
  'Karan Aujla',
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

const albumCache = new Map<string, { album: AlbumEntity; expiresAt: number }>()
const albumInFlight = new Map<string, Promise<AlbumEntity | null>>()

const getAlbumCached = (albumId: string): Promise<AlbumEntity | null> => {
  const cached = albumCache.get(albumId)
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.album)
  }
  const existing = albumInFlight.get(albumId)
  if (existing) return existing

  const promise = getAlbumService()
    .getAlbumById(albumId)
    .then((album) => {
      if (album) {
        albumCache.set(albumId, { album, expiresAt: Date.now() + CACHE_TTL_MS })
      }
      return album || null
    })
    .catch(() => null)
    .finally(() => {
      albumInFlight.delete(albumId)
    })

  albumInFlight.set(albumId, promise)
  return promise
}

const isTributeOrKaraoke = (text: string) =>
  /\b(karaoke|instrumental|8-bit|16-bit|emulation|lullaby|made famous|tribute to|masala|sleep songs|cover version|piano cover|solo violin|music box)\b/i.test(
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

  const chunks: string[][] = []
  for (let i = 0; i < GLOBAL_STARTER_SONG_IDS.length; i += 35) {
    chunks.push(GLOBAL_STARTER_SONG_IDS.slice(i, i + 35))
  }

  starterSongsInFlight = Promise.all(
    chunks.map((chunk) =>
      getSongService()
        .getSongByIds({ songIds: chunk.join(',') })
        .catch(() => [] as SongEntity[])
    )
  )
    .then((batches) => {
      const seen = new Set<string>()
      const valid = batches.flat().filter((s) => {
        if (!s?.id || !s.downloadUrl?.length || seen.has(s.id)) return false
        seen.add(s.id)
        return true
      })
      if (valid.length > 0) {
        starterSongsCache = { data: valid, expiresAt: Date.now() + CACHE_TTL_MS }
      }
      return valid
    })
    .catch(() => [])
    .finally(() => {
      starterSongsInFlight = null
    })

  return starterSongsInFlight
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
    const resolved = await Promise.all(seed.albumIds.map((id) => getAlbumCached(id)))
    candidateAlbums = resolved.filter((a): a is AlbumEntity => Boolean(a))
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

  // Also include matching tracks from cached starter hits so single-release artists have extra top tracks
  if (songMap.size < 10 && normName.length >= 2) {
    const starters = await getGlobalStarterSongs()
    for (const s of starters) {
      if (songMap.has(s.id)) continue
      const matches = s.artists.primary.some(
        (ar) => ar.id === artistId || decodeBasic(ar.name).toLowerCase().includes(normName)
      )
      if (matches) songMap.set(s.id, s)
    }
  }

  return {
    topSongs: Array.from(songMap.values()).slice(0, 30),
    topAlbums: candidateAlbums.slice(0, 12)
  }
}

/** Match and hydrate only the relevant official JioSaavn albums & songs for a user query. */
export async function searchGlobalCatalog(query: string): Promise<{
  songs: SongEntity[]
  albums: AlbumEntity[]
  wantsCleanResults: boolean
}> {
  const q = query.trim().toLowerCase()
  if (!q || q.length < 2) return { songs: [], albums: [], wantsCleanResults: false }

  const wantsCleanResults = !isTributeOrKaraoke(q)
  const tokens = q.split(/\s+/).filter((t) => t.length >= 2)

  // Match against our 70+ curated artist/keyword seeds so we only fetch matching albums on demand
  const matchedSeeds = GLOBAL_ARTIST_SEEDS.filter((seed) => {
    const corpus = [...seed.names, ...(seed.keywords || [])].join(' ')
    if (seed.names.some((n) => n === q || n.includes(q) || q.includes(n))) return true
    if ((seed.keywords || []).some((k) => k.includes(q) || q.includes(k))) return true
    return tokens.length > 0 && tokens.every((t) => corpus.includes(t))
  }).slice(0, 4)

  const targetAlbumIds = Array.from(new Set(matchedSeeds.flatMap((s) => s.albumIds))).slice(0, 6)

  const [starterSongs, fetchedAlbums] = await Promise.all([
    getGlobalStarterSongs(),
    Promise.all(targetAlbumIds.map((id) => getAlbumCached(id)))
  ])

  const hydratedAlbums = fetchedAlbums.filter((a): a is AlbumEntity => Boolean(a))
  const cachedAlbumsAll = Array.from(albumCache.values()).map((c) => c.album)

  const allAlbumMap = new Map<string, AlbumEntity>()
  for (const a of [...hydratedAlbums, ...cachedAlbumsAll]) {
    if (a.id && !allAlbumMap.has(a.id)) allAlbumMap.set(a.id, a)
  }

  const allSongsMap = new Map<string, SongEntity>()
  for (const s of starterSongs) {
    if (s.id && !allSongsMap.has(s.id)) allSongsMap.set(s.id, s)
  }
  for (const album of allAlbumMap.values()) {
    for (const s of album.songs || []) {
      if (s.id && s.downloadUrl?.length && !allSongsMap.has(s.id)) {
        allSongsMap.set(s.id, s)
      }
    }
  }

  const scoreSong = (s: SongEntity): number => {
    const title = decodeBasic(s.name).toLowerCase()
    const album = decodeBasic(s.album?.name || '').toLowerCase()
    const artists = s.artists.primary.map((a) => decodeBasic(a.name).toLowerCase()).join(' ')
    const combined = `${title} ${artists} ${album}`
    if (!tokens.every((t) => combined.includes(t))) return 0
    let score = 1
    if (title === q) score += 12
    else if (title.includes(q)) score += 7
    if (artists.includes(q)) score += 6
    if (album.includes(q)) score += 3
    return score
  }

  const scoreAlbum = (a: AlbumEntity): number => {
    const title = decodeBasic(a.name).toLowerCase()
    const artists = a.artists.primary.map((ar) => decodeBasic(ar.name).toLowerCase()).join(' ')
    const combined = `${title} ${artists}`
    if (!tokens.every((t) => combined.includes(t))) return 0
    let score = 1
    if (title === q) score += 12
    else if (title.includes(q)) score += 7
    if (artists.includes(q)) score += 6
    return score
  }

  const matchedSongs = Array.from(allSongsMap.values())
    .map((s) => ({ item: s, score: scoreSong(s) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item)

  const matchedAlbums = Array.from(allAlbumMap.values())
    .map((a) => ({ item: a, score: scoreAlbum(a) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item)

  return { songs: matchedSongs, albums: matchedAlbums, wantsCleanResults }
}

/** Fallback playlist songs when JioSaavn returns 0 tracks for an English/International playlist on US IPs. */
export async function getGlobalPlaylistFallbackSongs(limit = 40): Promise<SongEntity[]> {
  const songs = await getGlobalStarterSongs()
  return songs.slice(0, limit)
}

export function filterOutKaraoke<T extends { name?: string; title?: string }>(items: T[]): T[] {
  return items.filter((item) => !isTributeOrKaraoke(decodeBasic(item.name || item.title || '')))
}
