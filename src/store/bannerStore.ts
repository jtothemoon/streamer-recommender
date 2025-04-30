import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BannerStore {
  isBannerVisible: boolean;
  setBannerVisible: (value: boolean) => void;
}

export const useBannerStore = create<BannerStore>()(
  persist(
    (set) => ({
      isBannerVisible: true,
      setBannerVisible: (value) => set({ isBannerVisible: value }),
    }),
    {
      name: 'banner-storage', // localStorage에 저장될 키 이름
    }
  )
);