import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeState = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false, // 기본값
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    {
      name: 'theme-storage', // localStorage 키 이름
    }
  )
);