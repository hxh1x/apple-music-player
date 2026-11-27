import { AlbumController, ArtistController, SearchController, SongController } from '#modules/index'
import { AuthController } from '#modules/auth/auth.controller'
import { DownloadController } from '#modules/download/download.controller'
import { HomeController } from '#modules/home/home.controller'
import { PlaylistController } from '#modules/playlists/controllers'
import { App } from './app'

const app = new App([
  new HomeController(),
  new AuthController(),
  new DownloadController(),
  new SearchController(),
  new SongController(),
  new AlbumController(),
  new ArtistController(),
  new PlaylistController()
]).getApp()

export default {
  port: Number(process.env.PORT || 3000),
  idleTimeout: 255,
  fetch: app.fetch
}
