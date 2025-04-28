"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { ChevronUpIcon } from "@heroicons/react/24/solid";

import Link from "next/link";

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
};

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  // const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  // const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [results, setResults] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // 게임 타이틀 키워드만 사용
  const keywords = [
    "LOL",
    "피파",
    "발로란트",
    "배틀그라운드",
    "오버워치",
    "스타크래프트",
    "서든어택",
    "GTA",
    "마인크래프트",
    "모바일게임",
    "디아블로",
    "게임 방송", // 종합 게임 방송
  ];

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
    );
  };

  const fetchStreamers = () => {
    if (selectedKeywords.length === 0) return;
    const query = selectedKeywords.join(",");
    router.push(`/?keywords=${query}`);
  };

  const doFetchStreamers = async (keywords: string[]) => {
    setLoading(true);

    const { data: keywordMatches } = await supabase
      .from("keywords")
      .select("id")
      .in("name", keywords);

    const keywordIds = (keywordMatches ?? []).map((k) => k.id);

    const { data: mappings } = await supabase
      .from("streamer_keywords")
      .select("streamer_id")
      .in("keyword_id", keywordIds);

    const matchedStreamerIds = (mappings ?? []).map((m) => m.streamer_id);

    let query = supabase.from("streamers").select("*");
    if (matchedStreamerIds.length > 0) {
      query = query.in("id", matchedStreamerIds);
    }

    const { data: finalStreamers } = await query;
    setResults(finalStreamers || []);
    setLoading(false);
  };

  useEffect(() => {
    const keywordsFromURL = searchParams.get("keywords")?.split(",") || [];
    if (keywordsFromURL.length > 0) {
      setSelectedKeywords(keywordsFromURL);
      doFetchStreamers(keywordsFromURL);
    }
  }, [searchParams]);

  const formatSubscribers = (count?: number | null) => {
    if (!count) return "정보 없음";
    if (count >= 10000) return `${(count / 10000).toFixed(1)}만명`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}천명`;
    return `${count}명`;
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🎮 스트리머 추천 받기</h1>

      {/* 키워드 선택 */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">🔍 키워드 선택</h2>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <button
              key={keyword}
              onClick={() => toggleKeyword(keyword)}
              className={`px-4 py-1 rounded-full border text-sm transition-colors duration-200 ${
                selectedKeywords.includes(keyword)
                  ? "bg-[#00C7AE] text-white border-[#00C7AE]"
                  : "bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {keyword}
            </button>
          ))}
        </div>
      </section>

      {/* 플랫폼 선택 */}
      {/* <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">🎮 플랫폼</h2>
        <div className="flex gap-4">
          {["전체", "twitch", "youtube"].map((platform) => (
            <button
              key={platform}
              onClick={() =>
                setSelectedPlatform(platform === "전체" ? null : platform)
              }
              className={`px-4 py-1 rounded-full border text-sm capitalize ${
                selectedPlatform === (platform === "전체" ? null : platform)
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
      </section> */}

      {/* 성별 선택 */}
      {/* <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">🚻 성별</h2>
        <div className="flex gap-4">
          {["전체", "male", "female"].map((gender) => (
            <button
              key={gender}
              onClick={() =>
                setSelectedGender(gender === "전체" ? null : gender)
              }
              className={`px-4 py-1 rounded-full border text-sm capitalize ${
                selectedGender === (gender === "전체" ? null : gender)
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {gender}
            </button>
          ))}
        </div>
      </section> */}

      {/* 추천 버튼 */}
      <div className="mt-8">
        <button
          onClick={fetchStreamers}
          className="bg-black text-white dark:bg-gray-200 dark:text-black px-6 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              추천 중...
            </>
          ) : (
            "추천 받기 🔎"
          )}
        </button>
      </div>

      {/* 결과 출력 */}
      <section className="mt-10">
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {results
              .sort((a, b) => (b.subscribers ?? 0) - (a.subscribers ?? 0))
              .map((s) => {
                const isNew = (() => {
                  if (!s.created_at) return false;
                  const createdDate = new Date(s.created_at);
                  const now = new Date();
                  const diff = now.getTime() - createdDate.getTime();
                  const sevenDays = 7 * 24 * 60 * 60 * 1000;
                  return diff < sevenDays;
                })();

                return (
                  <Link href={`/streamer/${s.id}`} className="block" key={s.id}>
                    <div
                      key={s.id}
                      onClick={() => router.push(`/streamer/${s.id}`)}
                      className="p-4 rounded-xl shadow transition-transform transform hover:scale-[1.02] hover:ring-2 hover:ring-[#00C7AE] relative bg-white dark:bg-[#1a1a1a] cursor-pointer"
                    >
                      {isNew && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                          N
                        </div>
                      )}

                      <Image
                        src={s.profile_image_url || "/placeholder.jpg"}
                        alt={s.name}
                        width={80}
                        height={80}
                        className="rounded-full mx-auto mb-3 object-cover border border-[#00C7AE]"
                      />
                      <h2 className="text-lg font-semibold text-center truncate">
                        {s.name}
                      </h2>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-300 text-center flex items-center justify-center gap-1">
                        <span className="text-lg">👥</span>
                        {formatSubscribers(s.subscribers)}
                      </div>

                      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1 truncate">
                        {s.description || "채널 설명 없음"}
                      </p>

                      <div className="flex items-center justify-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="text-red-500"
                        >
                          <path d="M23.498 6.186a2.99 2.99 0 0 0-2.107-2.116C19.412 3.5 12 3.5 12 3.5s-7.412 0-9.391.57A2.99 2.99 0 0 0 .502 6.186 29.838 29.838 0 0 0 0 12c0 2.007.127 3.959.502 5.814a2.99 2.99 0 0 0 2.107 2.116c1.979.57 9.391.57 9.391.57s7.412 0 9.391-.57a2.99 2.99 0 0 0 2.107-2.116c.375-1.855.502-3.807.502-5.814s-.127-3.959-.502-5.814zM9.75 15.02V8.98l6.5 3.02-6.5 3.02z" />
                        </svg>
                        <span>YOUTUBE</span>

                        {s.gender !== "unknown" && (
                          <>
                            <span className="mx-1 text-gray-300">|</span> 🚻{" "}
                            {s.gender}
                          </>
                        )}
                      </div>

                      <a
                        href={s.channel_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()} // ✅ 추가
                        className="inline-block mt-3 text-[#00C7AE] text-xs font-bold hover:text-[#00b19c] transition-colors"
                      >
                        🔗 채널 방문
                      </a>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}

        {results.length === 0 && !loading && (
          <p className="text-center text-gray-500 mt-8">
            조건에 맞는 스트리머가 없습니다.
          </p>
        )}
      </section>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#00C7AE] hover:bg-[#00b19c] text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        >
          <ChevronUpIcon className="w-6 h-6" />
        </button>
      )}
    </main>
  );
}