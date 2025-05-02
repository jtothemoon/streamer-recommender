import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { gameTypeToKeyword } from "../../constants/gameKeywords";

/**
 * 스트리머-키워드 매핑 스크립트
 * 
 * 용도: 스트리머의 게임 타입에 따라 적절한 키워드를 연결
 * 작동: 모든 스트리머 조회 → game_type 확인 → 키워드 매핑 → DB 연결
 * 
 * 실행 방법: 
 * npx ts-node --project tsconfig.scripts.json src/scripts/youtube/linkStreamersToKeywords.ts
 * 
 * 처리 과정:
 * 1. streamers 테이블에서 모든 스트리머 정보 조회
 * 2. 각 스트리머의 game_type에 맞는 키워드 확인
 * 3. 필요한 경우 키워드 자동 생성
 * 4. streamer_keywords 테이블에 관계 저장 (upsert)
 */
export async function linkStreamersToKeywords() {
  // 환경변수 설정
  dotenv.config();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 키워드 조회 또는 생성
  const getOrCreateKeyword = async (keywordName: string): Promise<string | null> => {
    // 키워드 조회
    const { data: keyword, error: keywordError } = await supabase
      .from("keywords")
      .select("id")
      .eq("name", keywordName)
      .single();
      
    // 키워드가 있으면 ID 반환
    if (keyword) {
      return keyword.id;
    }
    
    // 에러가 있고 키워드가 없으면 생성
    if (keywordError) {
      console.log(`➕ 키워드 생성: ${keywordName}`);
      const { data: insertedKeyword, error: insertError } = await supabase
        .from("keywords")
        .insert({ name: keywordName, type: "game_title" })
        .select()
        .single();
        
      if (insertError || !insertedKeyword) {
        console.error(`❌ 키워드 생성 실패: ${keywordName}`, insertError);
        return null;
      }
      
      return insertedKeyword.id;
    }
    
    return null;
  };
  
  // 스트리머-키워드 매핑
  const linkStreamerToKeyword = async (streamerId: string, keywordId: string): Promise<boolean> => {
    // 중복 매핑 확인
    const { data: existingMappings, error: checkError } = await supabase
      .from("streamer_keywords")
      .select("id")
      .eq("streamer_id", streamerId)
      .eq("keyword_id", keywordId);
      
    if (checkError) {
      console.error(`❌ 매핑 확인 오류: ${streamerId} - ${keywordId}`, checkError);
      return false;
    }
    
    // 이미 매핑 존재
    if (existingMappings && existingMappings.length > 0) {
      console.log(`⏩ 이미 매핑됨: ${streamerId} - ${keywordId}`);
      return true;
    }
    
    // 매핑 생성
    const { error: insertError } = await supabase
      .from("streamer_keywords")
      .insert({
        streamer_id: streamerId,
        keyword_id: keywordId,
      });
      
    if (insertError) {
      console.error(`❌ 매핑 생성 실패: ${streamerId} - ${keywordId}`, insertError);
      return false;
    }
    
    console.log(`✅ 매핑 완료: ${streamerId} - ${keywordId}`);
    return true;
  };

  async function main() {
    console.log("🚀 스트리머와 키워드 연결 시작");

    // 옵션: 플랫폼별 필터링 추가 가능
    const { data: streamers, error: streamerError } = await supabase
      .from("streamers")
      .select("id, name, game_type");

    if (streamerError) {
      console.error("❌ 스트리머 가져오기 실패:", streamerError);
      return;
    }

    if (!streamers || streamers.length === 0) {
      console.log("❗ 스트리머가 없습니다.");
      return;
    }
    
    console.log(`ℹ️ 총 ${streamers.length}명의 스트리머 로드 완료`);
    
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (const streamer of streamers) {
      const { id: streamerId, name: streamerName, game_type: gameType } = streamer;

      if (!gameType || !gameTypeToKeyword[gameType]) {
        console.warn(`⚠️ 매핑할 키워드가 없는 스트리머: ${streamerName} (${streamerId})`);
        skipCount++;
        continue;
      }

      const keywordName = gameTypeToKeyword[gameType];
      
      // 키워드 조회 또는 생성
      const keywordId = await getOrCreateKeyword(keywordName);
      
      if (!keywordId) {
        console.error(`❌ 키워드 ID 획득 실패: ${keywordName}`);
        failCount++;
        continue;
      }

      // 매핑 생성
      const success = await linkStreamerToKeyword(streamerId, keywordId);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log("\n===== 스트리머-키워드 매핑 결과 =====");
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`⏩ 스킵: ${skipCount}개`);
    console.log("🎉 모든 스트리머-키워드 연결 완료!");
  }

  // 실행
  await main();
}

// 직접 실행 시
if (require.main === module) {
  linkStreamersToKeywords().catch((err) => {
    console.error("❌ 스크립트 실행 오류:", err);
    process.exit(1);
  });
}