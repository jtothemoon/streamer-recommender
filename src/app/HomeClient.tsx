"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";
import { Streamer } from "@/types/streamer";
import { ChevronUpIcon } from "@heroicons/react/24/solid";

import { fetchKeywords } from "@/utils/fetchKeywords";

import { KeywordSelector } from "@/components/KeywordSelector";
import { StreamerCard } from "@/components/StreamerCard";

export default function HomeClient() {
  const [isVisible, setIsVisible] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
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
    const loadKeywords = async () => {
      const data = await fetchKeywords();
      setKeywords(data.map((k) => k.name));
    };
    loadKeywords();
  }, []);

  useEffect(() => {
    const keywordsFromURL = searchParams.get("keywords")?.split(",") || [];
    if (keywordsFromURL.length > 0) {
      setSelectedKeywords(keywordsFromURL);
      doFetchStreamers(keywordsFromURL);
    }
  }, [searchParams]);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🎮 스트리머 추천 받기</h1>

      <KeywordSelector
        keywords={keywords}
        selectedKeywords={selectedKeywords}
        // selectedPlatform={selectedPlatform}
        // selectedGender={selectedGender}
        onToggleKeyword={toggleKeyword}
        // onSelectPlatform={setSelectedPlatform}
        // onSelectGender={setSelectedGender}
      />

      {/* 추천 버튼 */}
      <div className="mt-8">
        <button
          onClick={fetchStreamers}
          className="bg-black text-white dark:bg-gray-200 dark:text-black px-6 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
              .map((s) => (
                <StreamerCard key={s.id} streamer={s} />
              ))}
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
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#00C7AE] hover:bg-[#00b19c] text-white rounded-full shadow-lg flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronUpIcon className="w-6 h-6" />
        </button>
      )}
    </main>
  );
}
