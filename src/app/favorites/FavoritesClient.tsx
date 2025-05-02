"use client";

import { useState, useEffect } from "react";
import { ChevronUpIcon } from "@heroicons/react/24/solid";
import { useFavoriteStore } from "@/store/favoriteStore";
import { YoutubeStreamer } from "@/types/youtube";
import { StreamerCard } from "@/components/streamer/StreamerCard";

export default function FavoritesClient() {
  const [isVisible, setIsVisible] = useState(false);
  const { getFavorites } = useFavoriteStore();
  const [favorites, setFavorites] = useState<YoutubeStreamer[]>([]);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  useEffect(() => {
    // 초기 데이터 설정
    setFavorites(getFavorites());
    
    // Zustand store 변경 감지하여 업데이트
    const unsubscribe = useFavoriteStore.subscribe((state) => {
      setFavorites(state.getFavorites());
    });
    
    return () => unsubscribe();
  }, [getFavorites]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">❤️ 즐겨찾기한 스트리머</h1>

      {/* 결과 출력 */}
      <section className="mt-10">
        {favorites.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {favorites
              .sort((a, b) => (b.subscribers ?? 0) - (a.subscribers ?? 0))
              .map((s) => (
                <StreamerCard key={s.id} streamer={s} />
              ))}
          </div>
        )}

        {favorites.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">즐겨찾기한 스트리머가 없습니다.</p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              스트리머 카드에서 하트 아이콘을 클릭하여 즐겨찾기에 추가해보세요.
            </p>
          </div>
        )}
      </section>

      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#00C7AE] hover:bg-[#00b19c] text-white rounded-full shadow-lg flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronUpIcon className="w-6 h-6" />
        </button>
      )}
    </main>
  );
}