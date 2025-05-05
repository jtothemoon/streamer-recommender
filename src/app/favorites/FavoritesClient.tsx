"use client";

import { useState, useEffect } from "react";
import { ChevronUpIcon } from "@heroicons/react/24/solid";
import { useFavoriteStore } from "@/store/favoriteStore";
import { YoutubeStreamer } from "@/types/youtube";
import { TwitchStreamer } from "@/types/twitch";
import { ChzzkStreamer } from "@/types/chzzk";
import { YoutubeStreamerCard } from "@/components/streamer/YoutubeStreamerCard";
import { TwitchStreamerCard } from "@/components/streamer/TwitchStreamerCard";
import { ChzzkStreamerCard } from "@/components/streamer/ChzzkStreamerCard";

export default function FavoritesClient() {
  const [isVisible, setIsVisible] = useState(false);
  const { getFavorites } = useFavoriteStore();
  const [youtubeFavorites, setYoutubeFavorites] = useState<YoutubeStreamer[]>(
    []
  );
  const [twitchFavorites, setTwitchFavorites] = useState<TwitchStreamer[]>([]);
  const [chzzkFavorites, setChzzkFavorites] = useState<ChzzkStreamer[]>([]);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  useEffect(() => {
    const allFavorites = getFavorites();

    setYoutubeFavorites(
      allFavorites.filter((s): s is YoutubeStreamer => s.platform === "youtube")
    );

    setTwitchFavorites(
      allFavorites.filter((s): s is TwitchStreamer => s.platform === "twitch")
    );

    setChzzkFavorites(
      allFavorites.filter((s): s is ChzzkStreamer => s.platform === "chzzk")
    );

    const unsubscribe = useFavoriteStore.subscribe((state) => {
      const updated = state.getFavorites();
      setYoutubeFavorites(
        updated.filter((s): s is YoutubeStreamer => s.platform === "youtube")
      );
      setTwitchFavorites(
        updated.filter((s): s is TwitchStreamer => s.platform === "twitch")
      );
      setChzzkFavorites(
        updated.filter((s): s is ChzzkStreamer => s.platform === "chzzk")
      );
    });

    return () => unsubscribe();
  }, [getFavorites]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">❤️ 즐겨찾기한 스트리머</h1>

      <section className="mt-10">
        {youtubeFavorites.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-4">🎥 유튜브 즐겨찾기</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {youtubeFavorites
                .sort((a, b) => (b.subscribers ?? 0) - (a.subscribers ?? 0))
                .map((s) => (
                  <YoutubeStreamerCard key={s.id} streamer={s} />
                ))}
            </div>
          </>
        )}

        {twitchFavorites.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mt-10 mb-4">
              💜 트위치 즐겨찾기
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {twitchFavorites
                .sort((a, b) => (b.viewer_count ?? 0) - (a.viewer_count ?? 0))
                .map((s) => (
                  <TwitchStreamerCard key={s.id} streamer={s} />
                ))}
            </div>
          </>
        )}

        {chzzkFavorites.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mt-10 mb-4">
              🟢 치지직 즐겨찾기
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {chzzkFavorites
                .sort((a, b) => (b.viewer_count ?? 0) - (a.viewer_count ?? 0))
                .map((s) => (
                  <ChzzkStreamerCard key={s.id} streamer={s} />
                ))}
            </div>
          </>
        )}

        {youtubeFavorites.length === 0 && twitchFavorites.length === 0 && chzzkFavorites.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              즐겨찾기한 스트리머가 없습니다.
            </p>
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
