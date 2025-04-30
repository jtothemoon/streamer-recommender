import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Streamer } from '@/types/streamer';

interface FavoriteStore {
  favorites: Record<string, Streamer>;
  addFavorite: (streamer: Streamer) => void;
  removeFavorite: (streamerId: string) => void;
  isFavorite: (streamerId: string) => boolean;
  getFavorites: () => Streamer[];
}

export const useFavoriteStore = create<FavoriteStore>()(
  persist(
    (set, get) => ({
      favorites: {},
      
      addFavorite: (streamer) => 
        set((state) => ({
          favorites: { ...state.favorites, [streamer.id]: streamer }
        })),
        
      removeFavorite: (streamerId) => 
        set((state) => {
          const newFavorites = { ...state.favorites };
          delete newFavorites[streamerId];
          return { favorites: newFavorites };
        }),
        
      isFavorite: (streamerId) => 
        !!get().favorites[streamerId],
        
      getFavorites: () => 
        Object.values(get().favorites),
    }),
    {
      name: 'spick-favorites',
    }
  )
);