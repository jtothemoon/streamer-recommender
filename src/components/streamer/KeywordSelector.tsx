"use client";

type Props = {
  keywords: string[];
  selectedKeywords: string[];
//   selectedPlatform: string | null;
//   selectedGender: string | null;
  onToggleKeyword: (keyword: string) => void;
//   onSelectPlatform: (platform: string | null) => void;
//   onSelectGender: (gender: string | null) => void;
};

export function KeywordSelector({
  keywords,
  selectedKeywords,
//   selectedPlatform,
//   selectedGender,
  onToggleKeyword,
//   onSelectPlatform,
//   onSelectGender,
}: Props) {
  return (
    <section className="mb-6 space-y-6">
      {/* 키워드 선택 */}
      <div>
        <h2 className="text-lg font-semibold mb-2">🔍 키워드 선택</h2>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <button
              key={keyword}
              onClick={() => onToggleKeyword(keyword)}
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
      </div>
      {/* 플랫폼 선택 */}
      {/* <div>
        <h2 className="text-lg font-semibold mb-2">🎮 플랫폼</h2>
        <div className="flex gap-4">
          {["전체", "twitch", "youtube"].map((platform) => (
            <button
              key={platform}
              onClick={() =>
                onSelectPlatform(platform === "전체" ? null : platform)
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
      </div> */}
      {/* 성별 선택 */}
      {/* <div>
        <h2 className="text-lg font-semibold mb-2">🚻 성별</h2>
        <div className="flex gap-4">
          {["전체", "male", "female"].map((gender) => (
            <button
              key={gender}
              onClick={() => onSelectGender(gender === "전체" ? null : gender)}
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
      </div> */}
    </section>
  );
}
