"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import YoutubeIcon from "@/components/icons/YoutubeIcon";
import TwitchIcon from "@/components/icons/TwitchIcon";

type Streamer = {
  id: string;
  name: string;
  description: string;
  platform: string;
  gender: string;
  profile_image_url: string;
  channel_url: string;
  created_at: string;
  subscribers: number | null;
  latest_uploaded_at: string | null;
};

export default function StreamerDetail({ id }: { id: string }) {
  const router = useRouter();
  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreamer = async () => {
      const { data, error } = await supabase
        .from("streamers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ 스트리머 불러오기 실패", error);
      } else {
        setStreamer(data);
      }
      setLoading(false);
    };

    fetchStreamer();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh] gap-2">
        <div className="w-4 h-4 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
        <span>로딩 중...</span>
      </div>
    );

  if (!streamer)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        ❌ 스트리머 정보를 불러올 수 없습니다.
      </div>
    );

  return (
    <main className="p-6 max-w-3xl mx-auto">
      {/* 뒤로가기 */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm mb-4 text-[#00C7AE] hover:text-[#00b19c] transition-colors cursor-pointer"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>뒤로가기</span>
      </button>

      {/* 스트리머 상세 */}
      <div className="text-center">
        <Image
          src={streamer.profile_image_url || "/placeholder.jpg"}
          alt={streamer.name}
          width={120}
          height={120}
          className="w-[120px] h-[120px] rounded-full mx-auto mb-4 object-cover border border-[#00C7AE]"
        />
        <h1 className="text-2xl font-bold">{streamer.name}</h1>

        {/* 설명 */}
        <p className="text-gray-500 mt-4 whitespace-pre-wrap break-words">
          {streamer.description}
        </p>

        {/* 기본 정보 */}
        <div className="flex justify-center gap-2 mt-6 text-sm text-gray-400 items-center">
          {streamer.platform === "youtube" && <YoutubeIcon />}
          {streamer.platform === "twitch" && <TwitchIcon />}
          <span>{streamer.platform.toUpperCase()}</span>

          {streamer.gender !== "unknown" && <span>🚻 {streamer.gender}</span>}

          <span>
            👥{" "}
            {streamer.subscribers
              ? `${streamer.subscribers.toLocaleString()}명`
              : "구독자 수 제공 안됨"}
          </span>
        </div>

        {/* 최근 업로드 */}
        {streamer.latest_uploaded_at && (
          <p className="text-gray-400 mt-2 text-sm">
            ⏰ 최근 업로드:{" "}
            {new Date(streamer.latest_uploaded_at).toLocaleDateString()}
          </p>
        )}

        {/* 채널 링크 */}
        <a
          href={streamer.channel_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-6 px-6 py-2 bg-[#00C7AE] text-white rounded-full font-semibold hover:bg-[#00b19c] transition-colors"
        >
          🔗 채널 방문하기
        </a>
      </div>
    </main>
  );
}
