import { Endpoints } from '#common/constants'
import { getGlobalPlaylistFallbackSongs, useFetch } from '#common/helpers'
import { createPlaylistPayload } from '#modules/playlists/helpers'
import { HTTPException } from 'hono/http-exception'
import type { IUseCase } from '#common/types'
import type { PlaylistAPIResponseModel, PlaylistModel } from '#modules/playlists/models'
import type { z } from 'zod'

export interface GetPlaylistByIdArgs {
  id: string
  limit: number
  page: number
}

export class GetPlaylistByIdUseCase implements IUseCase<GetPlaylistByIdArgs, z.infer<typeof PlaylistModel>> {
  constructor() {}

  async execute({ id, limit, page }: GetPlaylistByIdArgs) {
    const { data } = await useFetch<z.infer<typeof PlaylistAPIResponseModel>>({
      endpoint: Endpoints.playlists.id,
      params: {
        listid: id,
        n: limit,
        p: page
      }
    })

    if (!data) throw new HTTPException(404, { message: 'playlist not found' })

    const playlist = createPlaylistPayload(data)
    let songs = playlist?.songs?.slice(0, limit) || []

    // On non-India IPs (e.g. Render US), JioSaavn strips tracks from international editorial playlists.
    if (songs.length === 0) {
      const fallback = await getGlobalPlaylistFallbackSongs(limit || 40)
      songs = fallback.slice(0, limit || 40)
    }

    return {
      ...playlist,
      songCount: songs.length || null,
      songs
    }
  }
}
