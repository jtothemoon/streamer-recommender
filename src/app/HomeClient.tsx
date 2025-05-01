"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";
import { Streamer } from "@/types/streamer";
import { ChevronUpIcon } from "@heroicons/react/24/solid";

import { fetchKeywords } from "@/utils/fetchKeywords";

import { KeywordSelector } from "@/components/streamer/KeywordSelector";
import { StreamerCard } from "@/components/streamer/StreamerCard";

import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function HomeClient() {
  const [isVisible, setIsVisible] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
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
    if (!selectedPlatform) return;
    const query = selectedKeywords.length > 0 ? selectedKeywords.join(",") : null;
    const platformQuery = `platform=${selectedPlatform}`;
    
    const url = query
      ? `/?keywords=${query}&${platformQuery}`
      : `/?${platformQuery}`;
  
    router.push(url);
  };

  const doFetchStreamers = async (keywords: string[], platform?: string | null) => {
    setLoading(true);
  
    let matchedStreamerIds: string[] = [];
  
    if (keywords.length === 0) {
      const { data: allStreamers } = await supabase
        .from("streamers")
        .select("id");
  
      matchedStreamerIds = (allStreamers ?? []).map((s) => s.id);
    } else {
      const { data: keywordMatches } = await supabase
        .from("keywords")
        .select("id")
        .in("name", keywords);
  
      const keywordIds = (keywordMatches ?? []).map((k) => k.id);
  
      const { data: mappings } = await supabase
        .from("streamer_keywords")
        .select("streamer_id")
        .in("keyword_id", keywordIds);
  
      matchedStreamerIds = (mappings ?? []).map((m) => m.streamer_id);
    }
  
    if (matchedStreamerIds.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }
  
    const { data: finalStreamers } = await supabase
      .from("streamers")
      .select(`
        *,
        platforms:streamer_platforms(*)
      `)
      .in("id", matchedStreamerIds);
  
    let filteredResults = finalStreamers || [];
    if (platform) {
      filteredResults = filteredResults.filter((streamer) =>
        streamer.platforms.some((p: { platform: string }) => p.platform === platform)
      );
    }
  
    setResults(filteredResults);
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
    const keywordsParam = searchParams.get("keywords");
    const keywordsFromURL = keywordsParam
      ? keywordsParam.split(",").filter((k) => k.length > 0)
      : [];
    
    const platformFromURL = searchParams.get("platform") || null;
  
    if (!platformFromURL) {
      return;
    }
  
    setSelectedKeywords(keywordsFromURL);
    setSelectedPlatform(platformFromURL);
  
    doFetchStreamers(keywordsFromURL, platformFromURL);
  }, [searchParams]);
  

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🎮 스트리머 추천 받기</h1>

      <KeywordSelector
        keywords={keywords}
        selectedKeywords={selectedKeywords}
        selectedPlatform={selectedPlatform}
        // selectedGender={selectedGender}
        onToggleKeyword={toggleKeyword}
        onSelectPlatform={setSelectedPlatform}
        // onSelectGender={setSelectedGender}
      />

      {/* 추천 버튼 */}
      <div className="mt-8">
        <button
          onClick={fetchStreamers}
          className={`px-6 py-2 rounded-lg flex items-center justify-center gap-2 min-w-[120px] ${
            !selectedPlatform
              ? "bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
              : "bg-black text-white dark:bg-gray-200 dark:text-black hover:bg-gray-800 dark:hover:bg-gray-300 transition-colors cursor-pointer"
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
            {results
              // .sort((a, b) => (b.subscribers ?? 0) - (a.subscribers ?? 0))
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
