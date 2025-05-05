"use client";

import { ChzzkStreamer } from "@/types/chzzk";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ChzzkIcon from "../icons/ChzzkIcon";
import FavoriteButton from "../ui/FavoriteButton";
import { useChzzkLiveStatus } from "@/hooks/useChzzkLiveStatus";

interface ChzzkStreamerCardProps {
  streamer: ChzzkStreamer;
}

export function ChzzkStreamerCard({ streamer }: ChzzkStreamerCardProps) {
  const router = useRouter();

  // 라이브 상태 가져오기
  const { status } = useChzzkLiveStatus([streamer.chzzk_id]);
  const streamStatus = status?.[streamer.chzzk_id];
  const isLive = streamStatus?.isLive || false;

  const isNew = (() => {
    if (!streamer.created_at) return false;
    const createdDate = new Date(streamer.created_at);
    const now = new Date();
    const diff = now.getTime() - createdDate.getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return diff < sevenDays;
  })();

  function formatViewers(count?: number | null) {
    if (!count) return "정보 없음";
    if (count >= 10000) return `${(count / 10000).toFixed(1)}만명`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}천명`;
    return `${count}명`;
  }

  // 시청자 수 - 라이브 중이면 실시간 데이터 사용
  const viewerCount = isLive
    ? streamStatus?.viewerCount
    : streamer.viewer_count;

  return (
    <div
      onClick={() => router.push(`/streamer/${streamer.id}?platform=chzzk`)}
      className={`p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-transform transform hover:scale-[1.02] hover:ring-2 hover:ring-[var(--primary)] relative bg-[var(--background-soft)] cursor-pointer`}
    >
      {isNew && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
          N
        </div>
      )}

      {isLive && (
        <div className="absolute top-2 left-2 ml-8 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
          <span>
            LIVE{" "}
            {streamStatus?.viewerCount &&
              `· ${formatViewers(streamStatus.viewerCount)}`}
          </span>
        </div>
      )}

      <div className="absolute top-2 right-2">
        <FavoriteButton streamer={{ ...streamer, platform: "chzzk" }} />
      </div>

      <Image
        src={streamer.profile_image_url || "/placeholder.jpg"}
        alt={streamer.display_name}
        width={80}
        height={80}
        className="rounded-full mx-auto mb-3 object-cover border border-[var(--chzzk)]"
      />

      <h2 className="text-lg font-semibold text-center truncate">
        {streamer.display_name}
      </h2>

      <div className="mt-2 text-sm text-[var(--foreground-soft)] text-center flex items-center justify-center gap-1">
        <span className="text-lg">👀</span>
        {`${formatViewers(viewerCount)} 시청자`}
      </div>

      {/* 라이브 중일 때 게임명과 제목 표시 */}
      {isLive && streamStatus?.gameName && (
        <div className="mt-2 text-xs text-[var(--foreground-soft)] text-center">
          <p className="font-bold">{streamStatus.gameName}</p>
          {streamStatus.title && (
            <p className="truncate">{streamStatus.title}</p>
          )}
        </div>
      )}

      <p className="text-xs text-[var(--foreground-soft)] text-center mt-1 truncate">
        {streamer.description || "채널 설명 없음"}
      </p>

      <div className="flex items-center justify-center gap-1 text-xs text-[var(--foreground-soft)] mt-1">
        <ChzzkIcon width={16} height={16} />
        <span>CHZZK</span>
      </div>

      <a
        href={streamer.channel_url || "#"}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-block mt-3 text-[var(--primary)] text-xs font-bold hover:text-[var(--primary-hover)] transition-colors"
      >
        🔗 채널 방문
      </a>
    </div>
  );
}
