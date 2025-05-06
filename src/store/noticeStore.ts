// src/store/noticeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NoticeState {
  readNoticeIds: string[];
  hasUnreadNotices: boolean;
  latestNoticeDate: string | null;
  markAsRead: (id: string) => void;
  setHasUnreadNotices: (value: boolean) => void;
  updateLatestNoticeDate: (date: string) => void;
}

export const useNoticeStore = create<NoticeState>()(
  persist(
    (set) => ({
      readNoticeIds: [],
      hasUnreadNotices: false,
      latestNoticeDate: null,
      
      markAsRead: (id: string) => set((state) => ({
        readNoticeIds: [...state.readNoticeIds, id],
        hasUnreadNotices: false,
      })),
      
      setHasUnreadNotices: (value: boolean) => set({
        hasUnreadNotices: value,
      }),
      
      updateLatestNoticeDate: (date: string) => set((state) => {
        if (!state.latestNoticeDate || new Date(date) > new Date(state.latestNoticeDate)) {
          return { latestNoticeDate: date };
        }
        return {};
      }),
    }),
    {
      name: 'notice-storage',
    }
  )
);