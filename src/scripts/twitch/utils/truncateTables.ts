import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

/**
* 트위치 관련 테이블 비우기 스크립트
* 
* 용도: 트위치 데이터 전체 갱신을 위해 기존 테이블 데이터를 모두 비움
* 작동: 외래 키 제약조건을 고려하여 순서대로 테이블 비우기 (매핑 → 스트리머 → 카테고리)
* 
* 실행 방법:
* npx ts-node --project tsconfig.scripts.json src/scripts/twitch/utils/truncateTables.ts
* 
* 참고사항:
* - 실행 전 반드시 데이터 백업 확인 필요
* - 트위치는 유튜브와 달리 최신 데이터를 유지하는 것이 중요하므로 주기적 전체 갱신 권장
* - 이 스크립트 실행 후 discoverTwitchStreamers.ts 스크립트를 실행하여 새 데이터 수집
*/

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
    .gte("id", "00000000-0000-0000-0000-000000000000");

  if (truncateMappingError) {
    console.error("❌ 매핑 테이블 비우기 실패:", truncateMappingError);
    throw truncateMappingError;
  }

  // 2. 스트리머 테이블 비우기
  const { error: truncateError } = await supabase
    .from("twitch_streamers")
    .delete()
    .gte("id", "00000000-0000-0000-0000-000000000000");

  if (truncateError) {
    console.error("❌ 스트리머 테이블 비우기 실패:", truncateError);
    throw truncateError;
  }

  // 3. 게임 카테고리 테이블 비우기
  const { error: truncateCategoryError } = await supabase
    .from("twitch_game_categories")
    .delete()
    .gte("id", "00000000-0000-0000-0000-000000000000");

  if (truncateCategoryError) {
    console.error(
      "❌ 게임 카테고리 테이블 비우기 실패:",
      truncateCategoryError
    );
    throw truncateCategoryError;
  }

  console.log("✅ 테이블 비우기 완료");
}

// 직접 실행 시
if (require.main === module) {
  truncateTwitchTables().catch((err) => {
    console.error("❌ 스크립트 실행 오류:", err);
    process.exit(1);
  });
}