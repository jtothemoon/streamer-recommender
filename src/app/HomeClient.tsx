"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";
import { YoutubeStreamer } from "@/types/youtube";
import { TwitchStreamer } from "@/types/twitch";
import { ChzzkStreamer } from "@/types/chzzk";

import { fetchYoutubeCategories } from "@/utils/fetchYoutubeCategories";
import { fetchTwitchCategories } from "@/utils/fetchTwitchCategories";
import { fetchChzzkCategories } from "@/utils/fetchChzzkCategories";

import { CategorySelector } from "@/components/streamer/CategorySelector";
import { YoutubeStreamerCard } from "@/components/streamer/YoutubeStreamerCard";
import { TwitchStreamerCard } from "@/components/streamer/TwitchStreamerCard";
import { ChzzkStreamerCard } from "@/components/streamer/ChzzkStreamerCard";

import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function HomeClient() {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  // 플랫폼별 결과 상태 분리
  const [youtubeResults, setYoutubeResults] = useState<YoutubeStreamer[]>([]);
  const [twitchResults, setTwitchResults] = useState<TwitchStreamer[]>([]);
  const [chzzkResults, setChzzkResults] = useState<ChzzkStreamer[]>([]); // 치지직 결과 상태 추가

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // 초기 로딩 상태 추가
  const [categoriesLoading, setCategoriesLoading] = useState(false); // 카테고리 로딩 상태 추가
  const router = useRouter();
  const searchParams = useSearchParams();

  // 컴포넌트 마운트 시 ref 초기화
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // 초기 로딩 처리
  useEffect(() => {
    // 페이지 로드 시 초기 로딩 상태 설정
    setInitialLoading(true);

    // 컴포넌트 마운트 후 로딩 상태 해제
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 300); // 300ms 딜레이 (필요에 따라 조정)

    return () => clearTimeout(timer);
  }, []);

  // 스크롤 이벤트 핸들러 - 간단하게 유지
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        // 현재 스크롤 위치 저장
        const currentPosition = window.scrollY;
        if (currentPosition > 10) {
          sessionStorage.setItem(
            "homeScrollPosition",
            currentPosition.toString()
          );
          console.log("🔵 스크롤 위치 저장:", currentPosition);
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 페이지 로드 시 스크롤 복원 - 로딩 완료 후 실행
  useEffect(() => {
    if (!initialLoading) {
      const savedPosition = sessionStorage.getItem("homeScrollPosition");

      if (savedPosition && parseInt(savedPosition) > 0) {
        const position = parseInt(savedPosition);
        console.log("🔵 스크롤 복원 시도:", position);

        // 약간의 지연 추가
        setTimeout(() => {
          window.scrollTo({
            top: position,
            behavior: "smooth",
          });
        }, 100);
      }
    }
  }, [initialLoading]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const fetchStreamers = () => {
    if (!selectedPlatform) return;
    const query =
      selectedCategories.length > 0 ? selectedCategories.join(",") : "";
    const platformQuery = `platform=${selectedPlatform}`;

    const url = query
      ? `/?categories=${query}&${platformQuery}`
      : `/?${platformQuery}`;

    router.push(url);
  };

  // 플랫폼별 데이터 조회 로직
  const doFetchStreamers = async (
    categories: string[],
    platform?: string | null
  ) => {
    setLoading(true);

    // 결과 초기화
    setYoutubeResults([]);
    setTwitchResults([]);
    setChzzkResults([]); // 치지직 결과 초기화

    if (platform === "youtube") {
      // 유튜브 스트리머 조회 - 효율적인 접근법
      if (categories.length === 0) {
        // 카테고리 미선택 시 활성 상태인 모든 스트리머 가져오기
        const { data } = await supabase
          .from("youtube_streamers")
          .select("*")
          .eq("is_active", true)
          .order("subscribers", { ascending: false });
          
        setYoutubeResults(data || []);
      } else {
        // 카테고리 선택 시
        // 1. 카테고리 ID 조회
        const { data: categoryMatches } = await supabase
          .from("youtube_game_categories")
          .select("id")
          .in("name", categories);
          
        if (!categoryMatches?.length) {
          setLoading(false);
          return;
        }
        
        const categoryIds = categoryMatches.map(c => c.id);
        
        // 2. 매핑 테이블에서 스트리머 ID 조회
        const { data: mappings } = await supabase
          .from("youtube_streamer_categories")
          .select("streamer_id")
          .in("category_id", categoryIds);
          
        if (!mappings?.length) {
          setLoading(false);
          return;
        }
        
        const streamerIds = [...new Set(mappings.map(m => m.streamer_id))];
        
        // 3. 활성 상태인 스트리머만 최종 조회
        const { data } = await supabase
          .from("youtube_streamers")
          .select("*")
          .in("id", streamerIds)
          .eq("is_active", true)
          .order("subscribers", { ascending: false });
          
        setYoutubeResults(data || []);
      }
      
      setLoading(false);
    } else if (platform === "twitch") {
      // 트위치 스트리머 조회
      let matchedStreamerIds: string[] = [];

      if (categories.length === 0) {
        // 카테고리 미선택 시 전체 트위치 스트리머 가져오기
        const { data: allStreamers } = await supabase
          .from("twitch_streamers")
          .select("id");

        matchedStreamerIds = (allStreamers ?? []).map((s) => s.id);
      } else {
        // 카테고리 선택 시 해당 카테고리와 매핑된 스트리머만 가져오기
        const { data: categoryMatches } = await supabase
          .from("twitch_game_categories")
          .select("id")
          .in("name", categories);

        const categoryIds = (categoryMatches ?? []).map((k) => k.id);

        const { data: mappings } = await supabase
          .from("twitch_streamer_categories")
          .select("streamer_id")
          .in("category_id", categoryIds);

        matchedStreamerIds = (mappings ?? []).map((m) => m.streamer_id);
      }

      if (matchedStreamerIds.length === 0) {
        setLoading(false);
        return;
      }

      // 최종 스트리머 데이터 가져오기
      const { data: finalStreamers } = await supabase
        .from("twitch_streamers")
        .select("*")
        .in("id", matchedStreamerIds);

      setTwitchResults(finalStreamers || []);
    } else if (platform === "chzzk") {
      // 치지직 스트리머 조회 로직 (추가)
      let matchedStreamerIds: string[] = [];

      if (categories.length === 0) {
        // 카테고리 미선택 시 전체 치지직 스트리머 가져오기
        const { data: allStreamers } = await supabase
          .from("chzzk_streamers")
          .select("id");

        matchedStreamerIds = (allStreamers ?? []).map((s) => s.id);
      } else {
        // 카테고리 선택 시 해당 카테고리와 매핑된 스트리머만 가져오기
        const { data: categoryMatches } = await supabase
          .from("chzzk_game_categories")
          .select("id")
          .in("name", categories);

        const categoryIds = (categoryMatches ?? []).map((k) => k.id);

        const { data: mappings } = await supabase
          .from("chzzk_streamer_categories")
          .select("streamer_id")
          .in("category_id", categoryIds);

        matchedStreamerIds = (mappings ?? []).map((m) => m.streamer_id);
      }

      if (matchedStreamerIds.length === 0) {
        setLoading(false);
        return;
      }

      // 최종 스트리머 데이터 가져오기
      const { data: finalStreamers } = await supabase
        .from("chzzk_streamers")
        .select("*")
        .in("id", matchedStreamerIds);

      setChzzkResults(finalStreamers || []);
    }

    setLoading(false);
  };

  // 플랫폼에 따라 카테고리 로드
  useEffect(() => {
    const loadCategories = async () => {
      if (!selectedPlatform) return;

      setCategoriesLoading(true); // 로딩 시작

      if (selectedPlatform === "youtube") {
        const data = await fetchYoutubeCategories();
        setCategories(data.map((c) => c.name));
      } else if (selectedPlatform === "twitch") {
        const data = await fetchTwitchCategories();
        setCategories(data.map((c) => c.name));
      } else if (selectedPlatform === "chzzk") {
        // 치지직 카테고리 로드 추가
        const data = await fetchChzzkCategories();
        setCategories(data.map((c) => c.name));
      }

      setCategoriesLoading(false); // 로딩 완료
    };

    if (selectedPlatform) {
      loadCategories();
    }
  }, [selectedPlatform]);

  // URL 파라미터 변경 감지
  useEffect(() => {
    const categoriesParam = searchParams.get("categories");
    const categoriesFromURL = categoriesParam
      ? categoriesParam.split(",").filter((c) => c.length > 0)
      : [];

    const platformFromURL = searchParams.get("platform") || null;

    if (!platformFromURL) {
      return;
    }

    setSelectedCategories(categoriesFromURL);
    setSelectedPlatform(platformFromURL);

    doFetchStreamers(categoriesFromURL, platformFromURL);
  }, [searchParams]);

  // 현재 플랫폼에 따른 결과
  const results =
    selectedPlatform === "youtube"
      ? youtubeResults
      : selectedPlatform === "twitch"
      ? twitchResults
      : selectedPlatform === "chzzk"
      ? chzzkResults
      : [];

  return (
    <main className="p-6 max-w-4xl mx-auto bg-[var(--background)] text-[var(--foreground)]">
      {initialLoading ? (
        <div className="flex justify-center items-center h-[70vh]">
          <LoadingSpinner text="로딩 중..." size="large" />
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6">🎮 스트리머 추천 받기</h1>

          <CategorySelector
            categories={categories}
            selectedCategories={selectedCategories}
            selectedPlatform={selectedPlatform}
            onToggleCategory={toggleCategory}
            onSelectPlatform={setSelectedPlatform}
            categoriesLoading={categoriesLoading} // 로딩 상태 전달
          />

          {/* 추천 버튼 */}
          <div className="mt-8">
            <button
              onClick={fetchStreamers}
              className={`px-6 py-2 rounded-lg flex items-center justify-center gap-2 min-w-[120px] ${
                !selectedPlatform
                  ? "bg-[var(--button-disabled-bg)] text-[var(--button-disabled-text)] cursor-not-allowed"
                  : "bg-[var(--button-bg)] text-[var(--button-text)] hover:bg-[var(--button-hover-bg)] transition-colors cursor-pointer"
              }`}
              disabled={loading || !selectedPlatform}
            >
              {loading ? (
                <LoadingSpinner text="추천 중..." size="small" />
              ) : (
                "추천 받기 🔎"
              )}
            </button>
          </div>

          {/* 결과 출력 */}
          <section className="mt-10">
            {results.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {selectedPlatform === "youtube" &&
                  youtubeResults
                    .sort((a, b) => (b.subscribers ?? 0) - (a.subscribers ?? 0))
                    .map((s) => (
                      <YoutubeStreamerCard key={s.id} streamer={s} />
                    ))}

                {selectedPlatform === "twitch" &&
                  twitchResults
                    .sort(
                      (a, b) => (b.viewer_count ?? 0) - (a.viewer_count ?? 0)
                    )
                    .map((s) => <TwitchStreamerCard key={s.id} streamer={s} />)}
                {selectedPlatform === "chzzk" &&
                  chzzkResults
                    .sort(
                      (a, b) => (b.viewer_count ?? 0) - (a.viewer_count ?? 0)
                    )
                    .map((s) => <ChzzkStreamerCard key={s.id} streamer={s} />)}
              </div>
            )}

            {results.length === 0 && !loading && (
              <p className="text-center text-[var(--foreground-soft)] mt-8">
                조건에 맞는 스트리머가 없습니다.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
