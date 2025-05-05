"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import YoutubeIcon from "@/components/icons/YoutubeIcon";
import TwitchIcon from "@/components/icons/TwitchIcon";
import ChzzkIcon from "@/components/icons/ChzzkIcon";

import { YoutubeStreamer, YoutubeGameCategory } from "@/types/youtube";
import { TwitchStreamer, TwitchGameCategory } from "@/types/twitch";
import { ChzzkStreamer, ChzzkGameCategory } from "@/types/chzzk";

type SimpleCategory = {
  id: string;
  name: string;
  display_name: string;
};

// 공통 카테고리 타입
type CategoryInfo =
  | YoutubeGameCategory
  | TwitchGameCategory
  | ChzzkGameCategory;

// 유니언 스트리머 타입
type FavoriteStreamer = YoutubeStreamer | TwitchStreamer | ChzzkStreamer;

export default function StreamerDetail({
  id,
  platform,
}: {
  id: string;
  platform: "youtube" | "twitch" | "chzzk";
}) {
  const router = useRouter();
  const [streamer, setStreamer] = useState<FavoriteStreamer | null>(null);
  const [categories, setCategories] = useState<SimpleCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreamer = async () => {
      let streamerData = null;
      let streamerError = null;

      if (platform === "youtube") {
        const { data, error } = await supabase
          .from("youtube_streamers")
          .select("*")
          .eq("id", id)
          .single();
        streamerData = data;
        streamerError = error;
      } else if (platform === "twitch") {
        const { data, error } = await supabase
          .from("twitch_streamers")
          .select("*")
          .eq("id", id)
          .single();
        streamerData = data;
        streamerError = error;
      } else if (platform === "chzzk") {
        // 치지직 스트리머 데이터 가져오기 추가
        const { data, error } = await supabase
          .from("chzzk_streamers")
          .select("*")
          .eq("id", id)
          .single();
        streamerData = data;
        streamerError = error;
      }

      if (streamerError) {
        console.error("❌ 스트리머 불러오기 실패", streamerError);
        setLoading(false);
        return;
      }

      if (streamerData) {
        setStreamer({
          ...streamerData,
          platform,
          gender: streamerData.gender ?? null,
          game_type: streamerData.game_type ?? null,
        });
      }

      try {
        let categoryLinks = null;
        if (platform === "youtube") {
          const { data } = await supabase
            .from("youtube_streamer_categories")
            .select("category_id")
            .eq("streamer_id", id);
          categoryLinks = data;
        } else if (platform === "twitch") {
          const { data } = await supabase
            .from("twitch_streamer_categories")
            .select("category_id")
            .eq("streamer_id", id);
          categoryLinks = data;
        } else if (platform === "chzzk") {
          // 치지직 카테고리 링크 가져오기 추가
          const { data } = await supabase
            .from("chzzk_streamer_categories")
            .select("category_id")
            .eq("streamer_id", id);
          categoryLinks = data;
        }

        if (categoryLinks && categoryLinks.length > 0) {
          const categoryIds = categoryLinks.map((link) => link.category_id);

          let categoryData = null;
          if (platform === "youtube") {
            const { data } = await supabase
              .from("youtube_game_categories")
              .select("id, name, display_name")
              .in("id", categoryIds);
            categoryData = data;
          } else if (platform === "twitch") {
            const { data } = await supabase
              .from("twitch_game_categories")
              .select("id, name, display_name")
              .in("id", categoryIds);
            categoryData = data;
          } else if (platform === "chzzk") {
            // 치지직 카테고리 데이터 가져오기 추가
            const { data } = await supabase
              .from("chzzk_game_categories")
              .select("id, name, display_name")
              .in("id", categoryIds);
            categoryData = data;
          }

          if (categoryData) {
            setCategories(categoryData as CategoryInfo[]);
          }
        }
      } catch (error) {
        console.error("카테고리 정보 로드 실패:", error);
      }

      setLoading(false);
    };

    fetchStreamer();
  }, [id, platform]);

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
    <main className="p-6 max-w-3xl mx-auto bg-[var(--background)] text-[var(--foreground)]">
      <button
        onClick={() => {
          // 세션 스토리지를 검사하지 않고 back() 호출만 수행
          console.log("🔵 뒤로가기 호출");
          router.back();
        }}
        className="flex items-center gap-1 text-sm mb-4 text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors cursor-pointer"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>뒤로가기</span>
      </button>

      <div className="text-center">
        <Image
          src={streamer.profile_image_url || "/placeholder.jpg"}
          alt={
            "display_name" in streamer ? streamer.display_name : streamer.name
          }
          width={120}
          height={120}
          className="w-[120px] h-[120px] rounded-full mx-auto mb-4 object-cover border border-[var(--primary)]"
        />
        <h1 className="text-2xl font-bold">
          {"display_name" in streamer ? streamer.display_name : streamer.name}
        </h1>

        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {categories.map((category) => (
              <span
                key={category.id}
                className="px-3 py-1 bg-[var(--background-soft-hover)] rounded-full text-sm shadow"
              >
                {category.display_name || category.name}
              </span>
            ))}
          </div>
        )}

        <p className="text-[var(--foreground-soft)] mt-4 whitespace-pre-wrap break-words">
          {streamer.description}
        </p>

        <div className="flex flex-wrap justify-center gap-3 mt-6 text-sm text-[var(--foreground-soft)] items-center">
          <div className="flex items-center gap-1">
            {platform === "youtube" && <YoutubeIcon />}
            {platform === "twitch" && <TwitchIcon />}
            {platform === "chzzk" && <ChzzkIcon />}
            <span>{platform.toUpperCase()}</span>
          </div>

          <span>
            {platform === "youtube" && streamer && (
              <>
                👥{" "}
                {streamer.subscribers !== null &&
                streamer.subscribers !== undefined
                  ? `${streamer.subscribers.toLocaleString()}명`
                  : "구독자 수 제공 안됨"}
              </>
            )}

            {platform === "twitch" && "viewer_count" in streamer && (
              <>
                👀{" "}
                {streamer.viewer_count !== null &&
                streamer.viewer_count !== undefined
                  ? `${streamer.viewer_count.toLocaleString()}명 시청 중`
                  : "시청자 수 제공 안됨"}
              </>
            )}

            {platform === "chzzk" && "viewer_count" in streamer && (
              <>
                👀{" "}
                {streamer.viewer_count !== null &&
                streamer.viewer_count !== undefined
                  ? `${streamer.viewer_count.toLocaleString()}명 시청 중`
                  : "시청자 수 제공 안됨"}
              </>
            )}
          </span>
        </div>

        {platform === "youtube" &&
          (streamer as YoutubeStreamer).latest_uploaded_at && (
            <p className="text-gray-400 mt-2 text-sm">
              ⏰ 최근 업로드:{" "}
              {new Date(
                (streamer as YoutubeStreamer).latest_uploaded_at!
              ).toLocaleDateString()}
            </p>
          )}
        {/* 유튜브 대표 영상 */}
        {platform === "youtube" &&
          (streamer as YoutubeStreamer).featured_video_id && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-3 text-center">
                📺 대표 영상
              </h2>
              <div className="relative w-full pt-[56.25%]">
                <iframe
                  src={`https://www.youtube.com/embed/${
                    (streamer as YoutubeStreamer).featured_video_id
                  }`}
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title="YouTube 동영상"
                ></iframe>
              </div>
            </div>
          )}
        <a
          href={streamer.channel_url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-6 px-6 py-2 bg-[var(--primary)] text-white rounded-full font-semibold hover:bg-[var(--primary-hover)] transition-colors"
        >
          🔗 {platform.toUpperCase()} 채널 방문하기
        </a>
      </div>
    </main>
  );
}
