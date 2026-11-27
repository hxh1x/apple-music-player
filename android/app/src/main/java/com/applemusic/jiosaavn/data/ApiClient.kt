package com.applemusic.jiosaavn.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.net.URLEncoder
import java.util.concurrent.TimeUnit

data class TrackItem(
    val id: String,
    val title: String,
    val artist: String,
    val album: String,
    val artworkUrl: String?,
    val streamUrl: String?
)

data class CollectionItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val artworkUrl: String?,
    val isUserPlaylist: Boolean = false,
    val songs: List<TrackItem> = emptyList()
)

data class SyncedLibrary(
    val likedSongs: List<TrackItem>,
    val recentlyPlayed: List<TrackItem>,
    val playlists: List<CollectionItem>,
    val albums: List<CollectionItem>
)

class ApiClient(private val prefs: PrefsStore) {
    private val http = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    private fun base() = prefs.apiBaseUrl.trimEnd('/')

    private fun decodeHtml(input: String): String =
        input.replace("&amp;", "&")
            .replace("&quot;", "\"")
            .replace("&#039;", "'")
            .replace("&apos;", "'")
            .replace("&lt;", "<")
            .replace("&gt;", ">")

    private fun bestImage(arr: JSONArray?): String? {
        if (arr == null || arr.length() == 0) return null
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optString("quality") == "500x500") {
                return o.optString("url").replace("http://", "https://")
            }
        }
        return arr.optJSONObject(arr.length() - 1)?.optString("url")?.replace("http://", "https://")
    }

    private fun bestStream(arr: JSONArray?): String? {
        if (arr == null || arr.length() == 0) return null
        val order = listOf("320kbps", "160kbps", "96kbps")
        for (q in order) {
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                if (o.optString("quality") == q && o.optString("url").isNotBlank()) {
                    return o.optString("url").replace("http://", "https://")
                }
            }
        }
        return arr.optJSONObject(arr.length() - 1)?.optString("url")?.replace("http://", "https://")
    }

    private fun parseSong(obj: JSONObject): TrackItem {
        val artistsArr = obj.optJSONObject("artists")?.optJSONArray("primary")
        val artistNames = buildList {
            if (artistsArr != null) {
                for (i in 0 until artistsArr.length()) {
                    val n = artistsArr.optJSONObject(i)?.optString("name")
                    if (!n.isNullOrBlank()) add(decodeHtml(n))
                }
            }
        }.joinToString(", ").ifBlank { "Unknown Artist" }

        val albumName = decodeHtml(obj.optJSONObject("album")?.optString("name") ?: "")
        return TrackItem(
            id = obj.optString("id"),
            title = decodeHtml(obj.optString("name")),
            artist = artistNames,
            album = albumName,
            artworkUrl = bestImage(obj.optJSONArray("image")),
            streamUrl = bestStream(obj.optJSONArray("downloadUrl"))
        )
    }

    suspend fun login(identifier: String, password: String): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val body = JSONObject()
                .put("identifier", identifier)
                .put("password", password)
                .toString()
                .toRequestBody("application/json".toMediaType())

            val req = Request.Builder()
                .url("${base()}/api/auth/login")
                .post(body)
                .build()

            http.newCall(req).execute().use { res ->
                val json = JSONObject(res.body?.string() ?: "{}")
                if (!res.isSuccessful || !json.optBoolean("success")) {
                    throw IllegalStateException(json.optString("message", "Login failed"))
                }
                val data = json.getJSONObject("data")
                val token = data.getString("token")
                val user = data.getJSONObject("user").getString("username")
                prefs.authToken = token
                prefs.username = user
                user
            }
        }
    }

    suspend fun getSyncedLibrary(): SyncedLibrary? = withContext(Dispatchers.IO) {
        val token = prefs.authToken ?: return@withContext null
        runCatching {
            val req = Request.Builder()
                .url("${base()}/api/sync/library")
                .addHeader("Authorization", "Bearer $token")
                .get()
                .build()

            http.newCall(req).execute().use { res ->
                if (!res.isSuccessful) return@use null
                val lib = JSONObject(res.body?.string() ?: "{}")
                    .optJSONObject("data")
                    ?.optJSONObject("library") ?: return@use null

                fun parseSongList(key: String): List<TrackItem> {
                    val arr = lib.optJSONArray(key) ?: return emptyList()
                    return (0 until arr.length()).mapNotNull { idx ->
                        arr.optJSONObject(idx)?.let(::parseSong)
                    }
                }

                val playlistsArr = lib.optJSONArray("userPlaylists")
                val userPlaylists = buildList {
                    if (playlistsArr != null) {
                        for (i in 0 until playlistsArr.length()) {
                            val p = playlistsArr.optJSONObject(i) ?: continue
                            val songsArr = p.optJSONArray("songs")
                            val songs = if (songsArr != null) {
                                (0 until songsArr.length()).mapNotNull { idx ->
                                    songsArr.optJSONObject(idx)?.let(::parseSong)
                                }
                            } else emptyList()
                            add(
                                CollectionItem(
                                    id = p.optString("id"),
                                    title = decodeHtml(p.optString("name")),
                                    subtitle = "${songs.size} songs",
                                    artworkUrl = songs.firstOrNull()?.artworkUrl,
                                    isUserPlaylist = true,
                                    songs = songs
                                )
                            )
                        }
                    }
                }

                val savedPlArr = lib.optJSONArray("savedPlaylists")
                val savedPlaylists = buildList {
                    if (savedPlArr != null) {
                        for (i in 0 until savedPlArr.length()) {
                            val p = savedPlArr.optJSONObject(i) ?: continue
                            add(
                                CollectionItem(
                                    id = p.optString("id"),
                                    title = decodeHtml(p.optString("name")),
                                    subtitle = "Saved Playlist",
                                    artworkUrl = bestImage(p.optJSONArray("image"))
                                )
                            )
                        }
                    }
                }

                val albumsArr = lib.optJSONArray("savedAlbums")
                val savedAlbums = buildList {
                    if (albumsArr != null) {
                        for (i in 0 until albumsArr.length()) {
                            val a = albumsArr.optJSONObject(i) ?: continue
                            add(
                                CollectionItem(
                                    id = a.optString("id"),
                                    title = decodeHtml(a.optString("name")),
                                    subtitle = "Album",
                                    artworkUrl = bestImage(a.optJSONArray("image"))
                                )
                            )
                        }
                    }
                }

                SyncedLibrary(
                    likedSongs = parseSongList("likedSongs"),
                    recentlyPlayed = parseSongList("recentlyPlayed"),
                    playlists = userPlaylists + savedPlaylists,
                    albums = savedAlbums
                )
            }
        }.getOrNull()
    }

    suspend fun searchSongs(query: String, limit: Int = 20): List<TrackItem> = withContext(Dispatchers.IO) {
        runCatching {
            val q = URLEncoder.encode(query, "UTF-8")
            val req = Request.Builder().url("${base()}/api/search/songs?query=$q&limit=$limit").get().build()
            http.newCall(req).execute().use { res ->
                val arr = JSONObject(res.body?.string() ?: "{}")
                    .optJSONObject("data")
                    ?.optJSONArray("results") ?: return@use emptyList()
                (0 until arr.length()).mapNotNull { i -> arr.optJSONObject(i)?.let(::parseSong) }
            }
        }.getOrDefault(emptyList())
    }

    suspend fun getSongById(id: String): TrackItem? = withContext(Dispatchers.IO) {
        runCatching {
            val req = Request.Builder().url("${base()}/api/songs/${URLEncoder.encode(id, "UTF-8")}").get().build()
            http.newCall(req).execute().use { res ->
                val arr = JSONObject(res.body?.string() ?: "{}").optJSONArray("data") ?: return@use null
                arr.optJSONObject(0)?.let(::parseSong)
            }
        }.getOrNull()
    }

    suspend fun getSuggestions(id: String, limit: Int = 10): List<TrackItem> = withContext(Dispatchers.IO) {
        runCatching {
            val req = Request.Builder()
                .url("${base()}/api/songs/${URLEncoder.encode(id, "UTF-8")}/suggestions?limit=$limit")
                .get()
                .build()
            http.newCall(req).execute().use { res ->
                val arr = JSONObject(res.body?.string() ?: "{}").optJSONArray("data") ?: return@use emptyList()
                (0 until arr.length()).mapNotNull { i -> arr.optJSONObject(i)?.let(::parseSong) }
            }
        }.getOrDefault(emptyList())
    }

    suspend fun getPlaylistTracks(id: String): List<TrackItem> = withContext(Dispatchers.IO) {
        runCatching {
            val req = Request.Builder()
                .url("${base()}/api/playlists?id=${URLEncoder.encode(id, "UTF-8")}&limit=50")
                .get()
                .build()
            http.newCall(req).execute().use { res ->
                val arr = JSONObject(res.body?.string() ?: "{}")
                    .optJSONObject("data")
                    ?.optJSONArray("songs") ?: return@use emptyList()
                (0 until arr.length()).mapNotNull { i -> arr.optJSONObject(i)?.let(::parseSong) }
            }
        }.getOrDefault(emptyList())
    }

    suspend fun getAlbumTracks(id: String): List<TrackItem> = withContext(Dispatchers.IO) {
        runCatching {
            val req = Request.Builder()
                .url("${base()}/api/albums?id=${URLEncoder.encode(id, "UTF-8")}")
                .get()
                .build()
            http.newCall(req).execute().use { res ->
                val arr = JSONObject(res.body?.string() ?: "{}")
                    .optJSONObject("data")
                    ?.optJSONArray("songs") ?: return@use emptyList()
                (0 until arr.length()).mapNotNull { i -> arr.optJSONObject(i)?.let(::parseSong) }
            }
        }.getOrDefault(emptyList())
    }
}
