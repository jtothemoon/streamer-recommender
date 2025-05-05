"use client";

import LoadingSpinner from "@/components/ui/LoadingSpinner";

type Props = {
  categories: string[];
  selectedCategories: string[];
  selectedPlatform: string | null;
  //   selectedGender: string | null;
  onToggleCategory: (category: string) => void;
  onSelectPlatform: (platform: string | null) => void;
  //   onSelectGender: (gender: string | null) => void;
  categoriesLoading: boolean; // 로딩 상태 추가
};

export function CategorySelector({
  

  categories,
  selectedCategories,
  selectedPlatform,
  //   selectedGender,
  onToggleCategory,
  onSelectPlatform,
  categoriesLoading, // 로딩 상태 받기
}: //   onSelectGender,
Props) {
  const unselectedColor =
  "bg-transparent text-[var(--foreground-soft)] border-[var(--border-color)] hover:bg-[var(--background-soft-hover)]";
  
  return (
    <section className="mb-6 space-y-6">
      {/* 플랫폼 선택 */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          🖥️ 플랫폼 선택 <span className="text-red-500 text-sm ml-1">*</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            "twitch",
            "youtube",
            // , "chzzk"
          ].map((platform) => {
            const isSelected = selectedPlatform === platform;
            let selectedColor = "bg-[#00C7AE] text-white border-[#00C7AE]";

            // 플랫폼별 색상 지정
            if (platform === "twitch") {
              selectedColor =
                "bg-[var(--twitch)] text-white border-[var(--twitch)]";
            } else if (platform === "youtube") {
              selectedColor =
                "bg-[var(--youtube)] text-white border-[var(--youtube)]";
            } else if (platform === "chzzk") {
              selectedColor =
                "bg-[var(--chzzk)] text-white border-[var(--chzzk)]";
            }

            return (
              <button
                key={platform}
                onClick={() =>
                  onSelectPlatform(
                    selectedPlatform === platform ? null : platform
                  )
                }
                className={`px-4 py-1 rounded-full border text-sm transition-colors duration-200 ${
                  isSelected ? selectedColor : unselectedColor
                }`}
              >
                {platform}
              </button>
            );
          })}
        </div>
      </div>
      {/* 카테고리 선택 */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          🔍 카테고리 선택
          {categoriesLoading && (
            <span className="ml-2 inline-block">
              <LoadingSpinner text="" size="small" />
            </span>
          )}
        </h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onToggleCategory(category)}
              className={`px-4 py-1 rounded-full border text-sm transition-colors duration-200 ${
                selectedCategories.includes(category)
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : unselectedColor
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
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
