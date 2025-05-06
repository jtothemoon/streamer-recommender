"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import YoutubeIcon from "../icons/YoutubeIcon";
import FavoriteButton from "../ui/FavoriteButton";
import { YoutubeStreamer } from "@/types/youtube";

export function YoutubeStreamerCard({
  streamer,
}: {
  streamer: YoutubeStreamer;
}) {
  const router = useRouter();

  const displayName = streamer.name || "이름 없음";

  const isNew = (() => {
    if (!streamer.created_at) return false;
    const createdDate = new Date(streamer.created_at);
    const now = new Date();
    const diff = now.getTime() - createdDate.getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return diff < sevenDays;
  })();

  // 최근 업로드 확인 (오늘 또는 어제 업로드 여부)
  const isRecentUpload = (() => {
    if (!streamer.latest_uploaded_at) return false;
    const uploadDate = new Date(streamer.latest_uploaded_at);
    const now = new Date();

    // 날짜 차이 계산 (밀리초)
    const diffTime = now.getTime() - uploadDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 오늘(0일) 또는 어제(1일) 업로드된 경우 true 반환
    return diffDays <= 1;
  })();

  function formatCount(count?: number | null) {
    if (!count) return "정보 없음";
    if (count >= 10000) return `${(count / 10000).toFixed(1)}만명`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}천명`;
    return `${count}명`;
  }

  const borderColor = "border-[var(--youtube)]";

  return (
    <div
      onClick={() => router.push(`/streamer/${streamer.id}?platform=youtube`)}
      className={`p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-transform transform hover:scale-[1.02] hover:ring-2 hover:ring-[var(--primary)] relative bg-[var(--background-soft)] cursor-pointer`}
    >
      <div className="absolute top-2 left-2 flex space-x-1">
        {isNew && (
          <div className="bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center animate-pulse">
            N
          </div>
        )}
        {isRecentUpload && (
          <div className="bg-green-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center animate-pulse">
            🔥
          </div>
        )}
      </div>

      <div className="absolute top-2 right-2">
        <FavoriteButton streamer={{ ...streamer, platform: "youtube" }} />
      </div>

      <Image
        src={streamer.profile_image_url || "/placeholder.jpg"}
        alt={displayName}
        width={80}
        height={80}
        className={`rounded-full mx-auto mb-3 object-cover border ${borderColor}`}
      />

      <h2 className="text-lg font-semibold text-center truncate">
        {displayName}
      </h2>

      <div className="mt-2 text-sm text-[var(--foreground-soft)] text-center flex items-center justify-center gap-1">
        <span className="text-lg">👥</span>
        {`${formatCount(streamer.subscribers)} 구독자`}
      </div>

      <p className="text-xs text-[var(--foreground-soft)] text-center mt-1 truncate">
        {streamer.description || "채널 설명 없음"}
      </p>

      <div className="flex items-center justify-center gap-1 text-xs text-[var(--foreground-soft)] mt-1">
        <YoutubeIcon />
        <span>YOUTUBE</span>
      </div>

      <a
        href={streamer.channel_url || "#"}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-block mt-3 text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
      >
        🔗 채널 방문
      </a>
    </div>
  );
}
