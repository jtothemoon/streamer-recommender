"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

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
  latest_upload_at: string | null;
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
          {/* 유튜브 아이콘 */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 576 512"
            fill="currentColor"
            className="text-red-500"
          >
            <path d="M549.7 124.1c-6.3-23.7-24.9-42.2-48.6-48.5C456.5 64 288 64 288 64S119.5 64 74.9 75.6c-23.7 6.3-42.3 24.9-48.6 48.5C16 168.5 16 256 16 256s0 87.5 10.3 131.9c6.3 23.7 24.9 42.2 48.6 48.5C119.5 448 288 448 288 448s168.5 0 213.1-11.6c23.7-6.3 42.3-24.9 48.6-48.5C560 343.5 560 256 560 256s0-87.5-10.3-131.9zM232 336V176l142 80-142 80z" />
          </svg>
          <span>{streamer.platform.toUpperCase()}</span>

          {streamer.gender !== "unknown" && <span>🚻 {streamer.gender}</span>}

          <span>
            👥{" "}
            {streamer.subscribers
              ? `${streamer.subscribers.toLocaleString()}명`
              : "정보 없음"}
          </span>
        </div>

        {/* 최근 업로드 */}
        {streamer.latest_upload_at && (
          <p className="text-gray-400 mt-2 text-sm">
            ⏰ 최근 업로드:{" "}
            {new Date(streamer.latest_upload_at).toLocaleDateString()}
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
