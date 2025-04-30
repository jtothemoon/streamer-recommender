import { create } from 'zustand';

interface BannerStore {
  isBannerVisible: boolean;
  setBannerVisible: (value: boolean) => void;
}

export const useBannerStore = create<BannerStore>((set) => ({
  isBannerVisible: true,
  setBannerVisible: (value) => set({ isBannerVisible: value }),
}));