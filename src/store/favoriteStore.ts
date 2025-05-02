import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { YoutubeStreamer } from '@/types/youtube';
import { TwitchStreamer } from '@/types/twitch';

// 통합 FavoriteStreamer 타입
type FavoriteStreamer = YoutubeStreamer | TwitchStreamer;

interface FavoriteStore {
  favorites: Record<string, FavoriteStreamer>;
  addFavorite: (streamer: FavoriteStreamer) => void;
  removeFavorite: (streamerId: string) => void;
  isFavorite: (streamerId: string) => boolean;
  getFavorites: () => FavoriteStreamer[];
}

export const useFavoriteStore = create<FavoriteStore>()(
  persist(
    (set, get) => ({
      favorites: {},

      addFavorite: (streamer) =>
        set((state) => ({
          favorites: { ...state.favorites, [streamer.id]: streamer },
        })),

      removeFavorite: (streamerId) =>
        set((state) => {
          const newFavorites = { ...state.favorites };
          delete newFavorites[streamerId];
          return { favorites: newFavorites };
        }),

      isFavorite: (streamerId) => !!get().favorites[streamerId],

      getFavorites: () => Object.values(get().favorites),
    }),
    {
      name: 'spick-favorites',
    }
  )
);
