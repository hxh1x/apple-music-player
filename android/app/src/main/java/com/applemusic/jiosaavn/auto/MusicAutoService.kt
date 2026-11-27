package com.applemusic.jiosaavn.auto

import android.net.Uri
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.LibraryResult
import androidx.media3.session.MediaLibraryService
import androidx.media3.session.MediaSession
import com.applemusic.jiosaavn.data.ApiClient
import com.applemusic.jiosaavn.data.CollectionItem
import com.applemusic.jiosaavn.data.PrefsStore
import com.applemusic.jiosaavn.data.SyncedLibrary
import com.applemusic.jiosaavn.data.TrackItem
import com.google.common.collect.ImmutableList
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.SettableFuture
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class MusicAutoService : MediaLibraryService() {
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private lateinit var player: ExoPlayer
    private lateinit var session: MediaLibrarySession
    private lateinit var apiClient: ApiClient

    private var cachedLibrary: SyncedLibrary? = null
    private val trackCache = mutableMapOf<String, TrackItem>()

    companion object {
        private const val ROOT_ID = "root"
        private const val LISTEN_NOW_ID = "listen_now"
        private const val LIKED_ID = "liked_songs"
        private const val PLAYLISTS_ID = "playlists"
        private const val ALBUMS_ID = "albums"
    }

    override fun onCreate() {
        super.onCreate()
        apiClient = ApiClient(PrefsStore(this))

        player = ExoPlayer.Builder(this)
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                    .setUsage(C.USAGE_MEDIA)
                    .build(),
                true
            )
            .setHandleAudioBecomingNoisy(true)
            .build()

        // Auto-queue similar tracks when playback nears the end
        player.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                if (playbackState == Player.STATE_ENDED && !player.hasNextMediaItem()) {
                    val currentId = player.currentMediaItem?.mediaId ?: return
                    serviceScope.launch {
                        val suggestions = apiClient.getSuggestions(currentId, 8)
                        val items = suggestions.filter { it.id != currentId && !it.streamUrl.isNullOrBlank() }
                            .map(::toPlayableMediaItem)
                        if (items.isNotEmpty()) {
                            player.addMediaItems(items)
                            player.prepare()
                            player.play()
                        }
                    }
                }
            }
        })

        session = MediaLibrarySession.Builder(this, player, AutoLibraryCallback())
            .build()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaLibrarySession = session

    override fun onDestroy() {
        session.release()
        player.release()
        serviceScope.cancel()
        super.onDestroy()
    }

    private fun browsableItem(id: String, title: String, subtitle: String? = null, artwork: String? = null): MediaItem {
        val meta = MediaMetadata.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setArtworkUri(artwork?.let(Uri::parse))
            .setIsBrowsable(true)
            .setIsPlayable(false)
            .setMediaType(MediaMetadata.MEDIA_TYPE_FOLDER_MIXED)
            .build()
        return MediaItem.Builder().setMediaId(id).setMediaMetadata(meta).build()
    }

    private fun toPlayableMediaItem(track: TrackItem): MediaItem {
        trackCache[track.id] = track
        val meta = MediaMetadata.Builder()
            .setTitle(track.title)
            .setArtist(track.artist)
            .setAlbumTitle(track.album)
            .setArtworkUri(track.artworkUrl?.let(Uri::parse))
            .setIsBrowsable(false)
            .setIsPlayable(true)
            .setMediaType(MediaMetadata.MEDIA_TYPE_MUSIC)
            .build()

        return MediaItem.Builder()
            .setMediaId(track.id)
            .setUri(track.streamUrl)
            .setMediaMetadata(meta)
            .build()
    }

    private inner class AutoLibraryCallback : MediaLibrarySession.Callback {
        override fun onGetLibraryRoot(
            session: MediaLibrarySession,
            browser: MediaSession.ControllerInfo,
            params: LibraryParams?
        ): ListenableFuture<LibraryResult<MediaItem>> {
            return Futures.immediateFuture(
                LibraryResult.ofItem(browsableItem(ROOT_ID, "Apple Music JioSaavn"), params)
            )
        }

        override fun onGetChildren(
            session: MediaLibrarySession,
            browser: MediaSession.ControllerInfo,
            parentId: String,
            page: Int,
            pageSize: Int,
            params: LibraryParams?
        ): ListenableFuture<LibraryResult<ImmutableList<MediaItem>>> {
            val future = SettableFuture.create<LibraryResult<ImmutableList<MediaItem>>>()
            serviceScope.launch {
                val lib = apiClient.getSyncedLibrary().also { cachedLibrary = it }
                val items: List<MediaItem> = when (parentId) {
                    ROOT_ID -> listOf(
                        browsableItem(LISTEN_NOW_ID, "Listen Now", "History & Similar"),
                        browsableItem(LIKED_ID, "Liked Songs", "${lib?.likedSongs?.size ?: 0} songs"),
                        browsableItem(PLAYLISTS_ID, "Playlists", "${lib?.playlists?.size ?: 0} playlists"),
                        browsableItem(ALBUMS_ID, "Albums", "${lib?.albums?.size ?: 0} albums")
                    )
                    LISTEN_NOW_ID -> {
                        val recent = lib?.recentlyPlayed.orEmpty()
                        if (recent.isNotEmpty()) {
                            recent.map(::toPlayableMediaItem)
                        } else {
                            apiClient.searchSongs("top hits", 15).map(::toPlayableMediaItem)
                        }
                    }
                    LIKED_ID -> lib?.likedSongs.orEmpty().map(::toPlayableMediaItem)
                    PLAYLISTS_ID -> lib?.playlists.orEmpty().map { pl ->
                        browsableItem("pl:${pl.id}", pl.title, pl.subtitle, pl.artworkUrl)
                    }
                    ALBUMS_ID -> lib?.albums.orEmpty().map { al ->
                        browsableItem("al:${al.id}", al.title, al.subtitle, al.artworkUrl)
                    }
                    else -> when {
                        parentId.startsWith("pl:") -> {
                            val id = parentId.removePrefix("pl:")
                            val localPl: CollectionItem? = lib?.playlists?.find { it.id == id }
                            val tracks = if (localPl != null && localPl.isUserPlaylist) {
                                localPl.songs
                            } else {
                                apiClient.getPlaylistTracks(id)
                            }
                            tracks.map(::toPlayableMediaItem)
                        }
                        parentId.startsWith("al:") -> {
                            val id = parentId.removePrefix("al:")
                            apiClient.getAlbumTracks(id).map(::toPlayableMediaItem)
                        }
                        else -> emptyList()
                    }
                }
                future.set(LibraryResult.ofItemList(ImmutableList.copyOf(items), params))
            }
            return future
        }

        override fun onSearch(
            session: MediaLibrarySession,
            browser: MediaSession.ControllerInfo,
            query: String,
            params: LibraryParams?
        ): ListenableFuture<LibraryResult<Void>> {
            serviceScope.launch {
                val results = apiClient.searchSongs(query, 20)
                results.forEach { trackCache[it.id] = it }
                session.notifySearchResultChanged(browser, query, results.size, params)
            }
            return Futures.immediateFuture(LibraryResult.ofVoid())
        }

        override fun onGetSearchResult(
            session: MediaLibrarySession,
            browser: MediaSession.ControllerInfo,
            query: String,
            page: Int,
            pageSize: Int,
            params: LibraryParams?
        ): ListenableFuture<LibraryResult<ImmutableList<MediaItem>>> {
            val future = SettableFuture.create<LibraryResult<ImmutableList<MediaItem>>>()
            serviceScope.launch {
                val results = apiClient.searchSongs(query, 20).map(::toPlayableMediaItem)
                future.set(LibraryResult.ofItemList(ImmutableList.copyOf(results), params))
            }
            return future
        }

        override fun onAddMediaItems(
            mediaSession: MediaSession,
            controller: MediaSession.ControllerInfo,
            mediaItems: MutableList<MediaItem>
        ): ListenableFuture<MutableList<MediaItem>> {
            val future = SettableFuture.create<MutableList<MediaItem>>()
            serviceScope.launch {
                val resolved = mediaItems.map { item ->
                    val existingUri = item.localConfiguration?.uri?.toString()
                    if (!existingUri.isNullOrBlank()) {
                        item
                    } else {
                        val track = trackCache[item.mediaId] ?: apiClient.getSongById(item.mediaId)
                        if (track != null && !track.streamUrl.isNullOrBlank()) {
                            toPlayableMediaItem(track)
                        } else {
                            item
                        }
                    }
                }.toMutableList()
                future.set(resolved)
            }
            return future
        }
    }
}
