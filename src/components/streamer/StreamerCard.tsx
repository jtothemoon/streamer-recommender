"use client";

import { Streamer } from "@/types/streamer";
import Image from "next/image";
import { useRouter } from "next/navigation";

import YoutubeIcon from "../icons/YoutubeIcon";
import FavoriteButton from "../ui/FavoriteButton";

export function StreamerCard({ streamer }: { streamer: Streamer }) {
  const router = useRouter();

  const isNew = (() => {
    if (!streamer.created_at) return false;
    const createdDate = new Date(streamer.created_at);
    const now = new Date();
    const diff = now.getTime() - createdDate.getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return diff < sevenDays;
  })();

  function formatSubscribers(count?: number | null) {
    if (!count) return "정보 없음";
    if (count >= 10000) return `${(count / 10000).toFixed(1)}만명`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}천명`;
    return `${count}명`;
  }

  return (
    <div
      onClick={() => router.push(`/streamer/${streamer.id}`)}
      className="p-4 rounded-xl shadow transition-transform transform hover:scale-[1.02] hover:ring-2 hover:ring-[#00C7AE] relative bg-white dark:bg-[#1a1a1a] cursor-pointer"
    >
      {isNew && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
          N
        </div>
      )}

      <div className="absolute top-2 right-2">
        <FavoriteButton streamer={streamer} />
      </div>

      <Image
        src={streamer.profile_image_url || "/placeholder.jpg"}
        alt={streamer.name}
        width={80}
        height={80}
        className="rounded-full mx-auto mb-3 object-cover border border-[#00C7AE]"
      />
      <h2 className="text-lg font-semibold text-center truncate">
        {streamer.name}
      </h2>
      <div className="mt-2 text-sm text-gray-500 dark:text-gray-300 text-center flex items-center justify-center gap-1">
        <span className="text-lg">👥</span>
        {formatSubscribers(streamer.subscribers)}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1 truncate">
        {streamer.description || "채널 설명 없음"}
      </p>
      <div className="flex items-center justify-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-1">
        <YoutubeIcon />
        <span>YOUTUBE</span>
        {streamer.gender !== "unknown" && (
          <>
            <span className="mx-1 text-gray-300">|</span> 🚻 {streamer.gender}
          </>
        )}
      </div>
      <a
        href={streamer.channel_url}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-block mt-3 text-[#00C7AE] text-xs font-bold hover:text-[#00b19c] transition-colors"
      >
        🔗 채널 방문
      </a>
    </div>
  );
}
