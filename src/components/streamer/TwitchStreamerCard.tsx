"use client";

import { TwitchStreamer } from "@/types/twitch";
import Image from "next/image";
import { useRouter } from "next/navigation";
import TwitchIcon from "../icons/TwitchIcon";
import FavoriteButton from "../ui/FavoriteButton";
import { useTwitchLiveStatus } from "@/hooks/useTwitchLiveStatus";

interface TwitchStreamerCardProps {
  streamer: TwitchStreamer;
}

export function TwitchStreamerCard({ streamer }: TwitchStreamerCardProps) {
  const router = useRouter();

  // 라이브 상태 가져오기
  const { status } = useTwitchLiveStatus([streamer.twitch_id]);
  const streamStatus = status?.[streamer.twitch_id];
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
      onClick={() => router.push(`/streamer/${streamer.id}?platform=twitch`)}
      className="p-4 rounded-xl shadow transition-transform transform hover:scale-[1.02] hover:ring-2 hover:ring-[var(--primary)] relative bg-[var(--background-soft)] cursor-pointer"
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
        <FavoriteButton streamer={{ ...streamer, platform: "twitch" }} />
      </div>

      <Image
        src={streamer.profile_image_url || "/placeholder.jpg"}
        alt={streamer.display_name}
        width={80}
        height={80}
        className="rounded-full mx-auto mb-3 object-cover border border-[var(--twitch)]"
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
        <TwitchIcon />
        <span>TWITCH</span>
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
