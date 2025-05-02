import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// 트위치 관련 테이블 비우기 함수
export async function truncateTwitchTables() {
  dotenv.config();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log("🗑️ 트위치 관련 테이블 비우기 시작...");

  // 1. 매핑 테이블 먼저 비우기 (외래 키 제약조건 때문)
  const { error: truncateMappingError } = await supabase
    .from("twitch_streamer_categories")
    .delete()
    .neq("id", "dummy");

  if (truncateMappingError) {
    console.error("❌ 매핑 테이블 비우기 실패:", truncateMappingError);
    throw truncateMappingError;
  }

  // 2. 스트리머 테이블 비우기
  const { error: truncateError } = await supabase
    .from("twitch_streamers")
    .delete()
    .neq("id", "dummy");

  if (truncateError) {
    console.error("❌ 스트리머 테이블 비우기 실패:", truncateError);
    throw truncateError;
  }

  // 3. 게임 카테고리 테이블 비우기
  const { error: truncateCategoryError } = await supabase
    .from("twitch_game_categories")
    .delete()
    .neq("id", "dummy");

  if (truncateCategoryError) {
    console.error(
      "❌ 게임 카테고리 테이블 비우기 실패:",
      truncateCategoryError
    );
    throw truncateCategoryError;
  }

  console.log("✅ 테이블 비우기 완료");
}
