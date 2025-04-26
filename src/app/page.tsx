"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

type Streamer = {
  id: string;
  name: string;
  description: string;
  platform: string;
  gender: string;
  profile_image_url: string;
  channel_url: string;
};

export default function Home() {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [results, setResults] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(false);

  const keywords = ["FPS", "LOL", "고수", "재밌는", "소통 잘함"];

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
    );
  };

  const fetchStreamers = async () => {
    setLoading(true);

    // 키워드 ID 목록 가져오기
    const { data: keywordMatches, error: keywordError } = await supabase
      .from("keywords")
      .select("id")
      .in("name", selectedKeywords);

    if (keywordError) {
      console.error("❌ 키워드 불러오기 실패:", keywordError);
      setLoading(false);
      return;
    }

    const keywordIds = keywordMatches.map((k) => k.id);

    // 키워드 포함된 스트리머 ID들 가져오기
    const { data: mappings } = await supabase
      .from("streamer_keywords")
      .select("streamer_id")
      .in("keyword_id", keywordIds);

    const matchedStreamerIds = (mappings ?? []).map((m) => m.streamer_id);

    // 최종 조건: platform, gender, streamer_id
    let query = supabase.from("streamers").select("*");

    if (selectedPlatform) {
      query = query.eq("platform", selectedPlatform);
    }
    if (selectedGender) {
      query = query.eq("gender", selectedGender);
    }
    if (matchedStreamerIds.length > 0) {
      query = query.in("id", matchedStreamerIds);
    }

    const { data: finalStreamers, error } = await query;

    if (error) console.error("❌ 스트리머 불러오기 실패:", error);
    else setResults(finalStreamers);

    setLoading(false);
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
              className={`px-4 py-1 rounded-full border text-sm ${
                selectedKeywords.includes(keyword)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {keyword}
            </button>
          ))}
        </div>
      </section>

      {/* 플랫폼 선택 */}
      <section className="mb-6">
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
      </section>

      {/* 성별 선택 */}
      <section className="mb-6">
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
      </section>

      {/* 추천 버튼 */}
      <div className="mt-8">
        <button
          onClick={fetchStreamers}
          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
        >
          {loading ? "추천 중..." : "추천 받기 🔎"}
        </button>
      </div>

      {/* 결과 출력 */}
      <section className="mt-10">
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {results.map((s) => (
              <div
                key={s.id}
                className="border p-4 rounded-xl shadow hover:shadow-lg transition"
              >
                <Image
                  src={s.profile_image_url || "/placeholder.jpg"}
                  alt={s.name}
                  width={100}
                  height={100}
                  className="rounded-full mx-auto mb-4 object-cover"
                />
                <h2 className="text-xl font-semibold">{s.name}</h2>
                <p className="text-sm text-gray-600 mb-2">{s.description}</p>
                <div className="text-sm text-gray-500 mb-2">
                  🎮 {s.platform.toUpperCase()}
                  {s.gender !== "unknown" && <>&nbsp;|&nbsp; 🚻 {s.gender}</>}
                </div>

                <a
                  href={s.channel_url}
                  target="_blank"
                  className="inline-block mt-2 text-blue-600 hover:underline text-sm"
                  rel="noreferrer"
                >
                  🔗 채널 보기
                </a>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !loading && (
          <p className="text-center text-gray-500 mt-8">
            조건에 맞는 스트리머가 없습니다.
          </p>
        )}
      </section>
    </main>
  );
}
