import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { filterOutKaraoke, searchGlobalCatalog } from '#common/helpers'
import {
  SearchAlbumModel,
  SearchArtistModel,
  SearchModel,
  SearchPlaylistModel,
  SearchSongModel
} from '#modules/search/models'
import { SearchService } from '#modules/search/services'
import type { Routes } from '#common/types'

export class SearchController implements Routes {
  public controller: OpenAPIHono
  private searchService: SearchService

  constructor() {
    this.controller = new OpenAPIHono()
    this.searchService = new SearchService()
  }

  public initRoutes() {
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/search',
        tags: ['Search'],
        summary: 'Global search',
        description: 'Search for songs, albums, artists, and playlists based on the provided query string.',
        operationId: 'globalSearch',
        request: {
          query: z.object({
            query: z.string().openapi({
              title: 'Search query',
              description: 'Search query',
              type: 'string',
              example: 'Imagine Dragons'
            })
          })
        },
        responses: {
          200: {
            description: 'Successful global search',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean().openapi({
                    description: 'Indicates whether the search was successful',
                    type: 'boolean',
                    example: true
                  }),
                  data: SearchModel.openapi({
                    description: 'Search results including songs, albums, artists, and playlists'
                  })
                })
              }
            }
          }
        }
      }),
      async (ctx) => {
        const { query } = ctx.req.valid('query')

        const result = await this.searchService.searchAll(query)

        const catalog = await searchGlobalCatalog(query)
        if (catalog.songs.length > 0 || catalog.albums.length > 0) {
          const seenSongIds = new Set(catalog.songs.map((s) => s.id))
          const cleanExistingSongs = catalog.wantsCleanResults
            ? filterOutKaraoke(result.songs.results)
            : result.songs.results
          const prependedSongs = catalog.songs.slice(0, 5).map((s) => ({
            id: s.id,
            title: s.name,
            image: s.image,
            album: s.album?.name || '',
            url: s.url,
            type: 'song',
            description: s.artists.primary.map((a) => a.name).join(', '),
            primaryArtists: s.artists.primary.map((a) => a.name).join(', '),
            singers: s.artists.primary.map((a) => a.name).join(', '),
            language: s.language || 'english'
          }))
          result.songs.results = [
            ...prependedSongs,
            ...cleanExistingSongs.filter((s) => !seenSongIds.has(s.id))
          ]

          const seenAlbumIds = new Set(catalog.albums.map((a) => a.id))
          const cleanExistingAlbums = catalog.wantsCleanResults
            ? filterOutKaraoke(result.albums.results)
            : result.albums.results
          const prependedAlbums = catalog.albums.slice(0, 4).map((a) => ({
            id: a.id,
            title: a.name,
            image: a.image,
            artist: a.artists.primary.map((ar) => ar.name).join(', '),
            url: a.url,
            type: 'album',
            description: a.description || '',
            year: String(a.year || ''),
            language: a.language || 'english',
            songIds: (a.songs || []).map((s) => s.id).join(',')
          }))
          result.albums.results = [
            ...prependedAlbums,
            ...cleanExistingAlbums.filter((a) => !seenAlbumIds.has(a.id))
          ]

          if (result.topQuery.results.length === 0 && prependedSongs.length > 0) {
            const top = prependedSongs[0]
            result.topQuery.results = [
              {
                id: top.id,
                title: top.title,
                image: top.image,
                album: top.album,
                url: top.url,
                type: 'song',
                description: top.description,
                primaryArtists: top.primaryArtists,
                singers: top.singers,
                language: top.language
              }
            ]
          }
        }

        return ctx.json({ success: true, data: result })
      }
    )

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/search/songs',
        tags: ['Search'],
        summary: 'Search for songs',
        description: 'Search for songs based on the provided query',
        operationId: 'searchSongs',
        request: {
          query: z.object({
            query: z.string().openapi({
              title: 'Search query',
              description: 'Search query for songs',
              type: 'string',
              example: 'Believer'
            }),
            page: z.string().pipe(z.coerce.number()).optional().openapi({
              title: 'Page Number',
              description: 'The page number of the search results to retrieve',
              type: 'integer',
              example: '0',
              default: '0'
            }),
            limit: z.string().pipe(z.coerce.number()).optional().openapi({
              title: 'Limit',
              description: 'Number of search results per page',
              type: 'integer',
              example: '10',
              default: '10'
            })
          })
        },
        responses: {
          200: {
            description: 'Successful response with song search results',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean().openapi({
                    description: 'Indicates whether the song search was successful',
                    type: 'boolean',
                    example: true
                  }),
                  data: SearchSongModel.openapi({
                    description: 'Search results for songs'
                  })
                })
              }
            }
          }
        }
      }),
      async (ctx) => {
        const { query, page, limit } = ctx.req.valid('query')
        const pageNum = page || 0
        const pageSize = limit || 10

        const result = await this.searchService.searchSongs({ query, page: pageNum, limit: pageSize })

        if (pageNum === 0) {
          const catalog = await searchGlobalCatalog(query)
          if (catalog.songs.length > 0) {
            const seen = new Set<string>()
            const base = catalog.wantsCleanResults ? filterOutKaraoke(result.results) : result.results
            const merged = [...catalog.songs, ...base].filter((s) => {
              if (!s.id || seen.has(s.id)) return false
              seen.add(s.id)
              return true
            })
            result.results = merged.slice(0, Math.max(pageSize, 20))
            result.total = Math.max(result.total, result.results.length)
          }
        }

        return ctx.json({ success: true, data: result })
      }
    )

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/search/albums',
        tags: ['Search'],
        summary: 'Search for albums',
        description: 'Search for albums based on the provided query',
        operationId: 'searchAlbums',
        request: {
          query: z.object({
            query: z.string().openapi({
              description: 'Search query for albums',
              type: 'string',
              example: 'Evolve'
            }),
            page: z.string().pipe(z.coerce.number()).optional().openapi({
              description: 'The page number of the search results to retrieve',
              type: 'integer',
              example: '0',
              default: '0'
            }),
            limit: z.string().pipe(z.coerce.number()).optional().openapi({
              description: 'The number of search results per page',
              type: 'integer',
              example: '10',
              default: '10'
            })
          })
        },
        responses: {
          200: {
            description: 'Successful response with album search results',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean().openapi({
                    description: 'Indicates whether the album search was successful',
                    type: 'boolean',
                    example: true
                  }),
                  data: SearchAlbumModel.openapi({
                    description: 'Search results for albums'
                  })
                })
              }
            }
          }
        }
      }),
      async (ctx) => {
        const { query, page, limit } = ctx.req.valid('query')
        const pageNum = page || 0
        const pageSize = limit || 10

        const result = await this.searchService.searchAlbums({ query, page: pageNum, limit: pageSize })

        if (pageNum === 0) {
          const catalog = await searchGlobalCatalog(query)
          if (catalog.albums.length > 0) {
            const seen = new Set<string>()
            const base = catalog.wantsCleanResults ? filterOutKaraoke(result.results) : result.results
            const catalogFormatted = catalog.albums.map((a) => ({
              id: a.id,
              name: a.name,
              description: a.description,
              year: a.year,
              type: a.type,
              playCount: a.playCount,
              language: a.language,
              explicitContent: a.explicitContent,
              artists: a.artists,
              url: a.url,
              image: a.image
            }))
            const merged = [...catalogFormatted, ...base].filter((a) => {
              if (!a.id || seen.has(a.id)) return false
              seen.add(a.id)
              return true
            })
            result.results = merged.slice(0, Math.max(pageSize, 15))
            result.total = Math.max(result.total, result.results.length)
          }
        }

        return ctx.json({ success: true, data: result })
      }
    )

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/search/artists',
        tags: ['Search'],
        summary: 'Search for artists',
        description: 'Search for artists based on the provided query',
        operationId: 'searchArtists',
        request: {
          query: z.object({
            query: z.string().openapi({
              title: 'Search query',
              description: 'Search query for artists',
              type: 'string',
              example: 'Adele'
            }),
            page: z.string().pipe(z.coerce.number()).optional().openapi({
              title: 'Page Number',
              description: 'The page number of the search results to retrieve',
              type: 'integer',
              example: '0',
              default: '0'
            }),
            limit: z.string().pipe(z.coerce.number()).optional().openapi({
              title: 'Limit',
              description: 'Number of search results per page',
              type: 'integer',
              example: '10',
              default: '10'
            })
          })
        },
        responses: {
          200: {
            description: 'Successful response with artist search results',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean().openapi({
                    description: 'Indicates whether the artist search was successful',
                    type: 'boolean',
                    example: true
                  }),
                  data: SearchArtistModel.openapi({
                    description: 'Search results for artists'
                  })
                })
              }
            }
          }
        }
      }),
      async (ctx) => {
        const { query, page, limit } = ctx.req.valid('query')

        const result = await this.searchService.searchArtists({ query, page: page || 0, limit: limit || 10 })

        return ctx.json({ success: true, data: result })
      }
    )

    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/search/playlists',
        tags: ['Search'],
        summary: 'Search for playlists',
        description: 'Search for playlists based on the provided query',
        operationId: 'searchPlaylists',
        request: {
          query: z.object({
            query: z.string().openapi({
              title: 'Search query',
              description: 'Search query for playlists',
              type: 'string',
              example: 'Indie'
            }),
            page: z.string().pipe(z.coerce.number()).optional().openapi({
              title: 'Page Number',
              description: 'The page number of the search results to retrieve',
              type: 'integer',
              example: '0',
              default: '0'
            }),
            limit: z.string().pipe(z.coerce.number()).optional().openapi({
              title: 'Limit',
              description: 'Number of search results per page',
              type: 'integer',
              example: '10',
              default: '10'
            })
          })
        },
        responses: {
          200: {
            description: 'Successful response with playlist search results',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean().openapi({
                    description: 'Indicates whether the playlist search was successful',
                    type: 'boolean',
                    example: true
                  }),
                  data: SearchPlaylistModel.openapi({
                    description: 'Search results for playlist'
                  })
                })
              }
            }
          }
        }
      }),
      async (ctx) => {
        const { query, page, limit } = ctx.req.valid('query')

        const result = await this.searchService.searchPlaylists({ query, page: page || 0, limit: limit || 10 })

        return ctx.json({ success: true, data: result })
      }
    )
  }
}
