import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

/**
 * 유튜브 스트리머-카테고리 매핑 스크립트
 * 
 * 용도: 유튜브 스트리머의 게임 타입에 따라 적절한 카테고리를 연결
 * 작동: 모든 유튜브 스트리머 조회 → 카테고리 매핑 → DB 연결
 * 
 * 실행 방법: 
 * npx ts-node --project tsconfig.scripts.json src/scripts/youtube/linkYoutubeStreamerCategories.ts
 * 
 * 처리 과정:
 * 1. youtube_streamers 테이블에서 모든 스트리머 정보 조회
 * 2. 각 스트리머에 대해 해당하는 게임 카테고리 찾기
 * 3. youtube_streamer_categories 테이블에 관계 저장
 */
export async function linkYoutubeStreamerCategories() {
  // 환경변수 설정
  dotenv.config();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // 스트리머-카테고리 매핑
  const linkStreamerToCategory = async (streamerId: string, categoryId: string): Promise<boolean> => {
    // 중복 매핑 확인
    const { data: existingMappings, error: checkError } = await supabase
      .from("youtube_streamer_categories")
      .select("id")
      .eq("streamer_id", streamerId)
      .eq("category_id", categoryId);
      
    if (checkError) {
      console.error(`❌ 매핑 확인 오류: ${streamerId} - ${categoryId}`, checkError);
      return false;
    }
    
    // 이미 매핑 존재
    if (existingMappings && existingMappings.length > 0) {
      console.log(`⏩ 이미 매핑됨: ${streamerId} - ${categoryId}`);
      return true;
    }
    
    // 매핑 생성
    const { error: insertError } = await supabase
      .from("youtube_streamer_categories")
      .insert({
        streamer_id: streamerId,
        category_id: categoryId,
      });
      
    if (insertError) {
      console.error(`❌ 매핑 생성 실패: ${streamerId} - ${categoryId}`, insertError);
      return false;
    }
    
    console.log(`✅ 매핑 완료: ${streamerId} - ${categoryId}`);
    return true;
  };

  async function main() {
    console.log("🚀 유튜브 스트리머와 카테고리 연결 시작");

    // 유튜브 스트리머 조회
    const { data: streamers, error: streamerError } = await supabase
      .from("youtube_streamers")
      .select("*");

    if (streamerError) {
      console.error("❌ 스트리머 가져오기 실패:", streamerError);
      return;
    }

    if (!streamers || streamers.length === 0) {
      console.log("❗ 유튜브 스트리머가 없습니다.");
      return;
    }
    
    console.log(`ℹ️ 총 ${streamers.length}명의 유튜브 스트리머 로드 완료`);
    
    // youtube_game_categories 조회
    const { data: categories, error: categoriesError } = await supabase
      .from("youtube_game_categories")
      .select("id, name");
      
    if (categoriesError) {
      console.error("❌ 카테고리 가져오기 실패:", categoriesError);
      return;
    }
    
    if (!categories || categories.length === 0) {
      console.log("❗ 게임 카테고리가 없습니다.");
      return;
    }
    
    console.log(`ℹ️ 총 ${categories.length}개의 게임 카테고리 로드 완료`);
    
    // 카테고리 맵 생성 (이름 -> ID)
    const categoryMap = new Map();
    categories.forEach(cat => categoryMap.set(cat.name, cat.id));
    
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    // 특정 유튜브 채널의 영상 콘텐츠 분석을 통해 적절한 카테고리에 매핑
    for (const streamer of streamers) {
      // 각 스트리머에 대해 카테고리 정보 검색 또는 추론
      // 이 부분은 실제 스트리머 데이터에 따라 다를 수 있음
      // 예를 들어, 채널 설명이나 제목에서 게임 이름을 추출할 수도 있음
      
      // 여기서는 간단히 모든 스트리머를 모든 카테고리와 매핑하는 예시
      // 실제로는 스트리머별 게임 카테고리를 분석해야 함
      
      // 채널 설명이나 데이터를 분석해서 카테고리 결정하는 로직 추가 필요
      // 예시: 채널 이름이나 설명에 "롤"이 포함되면 "롤" 카테고리에 매핑
      
      const streamerName = streamer.name.toLowerCase();
      const streamerDesc = (streamer.description || "").toLowerCase();
      const content = `${streamerName} ${streamerDesc}`;
      
      // 간단한 키워드 매칭으로 카테고리 찾기
      let matched = false;
      
      for (const [categoryName, categoryId] of categoryMap.entries()) {
        // 카테고리 이름이 콘텐츠에 포함되어 있는지 확인
        // 실제로는 더 정교한 매칭 로직 필요
        if (content.includes(categoryName.toLowerCase())) {
          // 매핑 진행
          const success = await linkStreamerToCategory(streamer.id, categoryId);
          
          if (success) {
            console.log(`✅ 카테고리 연결: ${streamer.name} -> ${categoryName}`);
            successCount++;
            matched = true;
          } else {
            console.error(`❌ 카테고리 연결 실패: ${streamer.name} -> ${categoryName}`);
            failCount++;
          }
        }
      }
      
      if (!matched) {
        console.log(`⚠️ 매칭된 카테고리 없음: ${streamer.name}`);
        skipCount++;
      }
    }

    console.log("\n===== 유튜브 스트리머-카테고리 매핑 결과 =====");
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`⏩ 스킵: ${skipCount}개`);
    console.log("🎉 모든 스트리머-카테고리 연결 완료!");
  }

  // 실행
  await main();
}

// 직접 실행 시
if (require.main === module) {
  linkYoutubeStreamerCategories().catch((err) => {
    console.error("❌ 스크립트 실행 오류:", err);
    process.exit(1);
  });
}