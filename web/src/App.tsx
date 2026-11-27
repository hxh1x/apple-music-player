import { createHashRouter, Navigate, RouterProvider } from "react-router-dom";
import AlbumView from "./pages/AlbumView";
import ArtistView from "./pages/ArtistView";
import Home from "./pages/Home";
import LibraryView from "./pages/LibraryView";
import PlaylistView from "./pages/PlaylistView";
import RootLayout from "./pages/RootLayout";
import SearchView from "./pages/SearchView";
import SongView from "./pages/SongView";

const router = createHashRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "search", element: <SearchView /> },
      { path: "library", element: <LibraryView /> },
      { path: "album/:id", element: <AlbumView /> },
      { path: "playlist/:id", element: <PlaylistView /> },
      { path: "artist/:id", element: <ArtistView /> },
      { path: "song/:id", element: <SongView /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
