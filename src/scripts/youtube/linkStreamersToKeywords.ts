import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

export async function linkStreamersToKeywords() {
  // 환경변수 설정
  dotenv.config();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // gameType → 키워드 매핑 확장
  const gameTypeToKeyword: { [key: string]: string } = {
    종겜: "게임 방송",
    롤: "LOL",
    피파: "피파",
    발로란트: "발로란트",
    배틀그라운드: "배틀그라운드",
    오버워치: "오버워치",
    스타크래프트: "스타크래프트",
    서든어택: "서든어택",
    GTA: "GTA",
    마인크래프트: "마인크래프트",
    모바일게임: "모바일게임",
    디아블로: "디아블로",
  };

  async function main() {
    console.log("🚀 스트리머와 키워드 연결 시작");

    // 1. streamers 테이블에서 스트리머 전체 가져오기
    const { data: streamers, error: streamerError } = await supabase
      .from("streamers")
      .select("id, game_type");

    if (streamerError) {
      console.error("❌ 스트리머 가져오기 실패:", streamerError);
      return;
    }

    if (!streamers || streamers.length === 0) {
      console.log("❗ 스트리머가 없습니다.");
      return;
    }

    for (const streamer of streamers) {
      const { id: streamerId, game_type: gameType } = streamer;

      if (!gameType || !gameTypeToKeyword[gameType]) {
        console.warn(`⚠️ 매핑할 키워드가 없는 스트리머: ${streamerId}`);
        continue;
      }

      const keywordName = gameTypeToKeyword[gameType];

      // 2. keywords 테이블에서 키워드 찾기
      const { data, error: keywordError } = await supabase
        .from("keywords")
        .select("*")
        .eq("name", keywordName)
        .single();

      let keyword = data;

      // 키워드가 없으면 삽입
      if (keywordError || !keyword) {
        console.log(`➕ 키워드 삽입: ${keywordName}`);
        const { data: insertedKeyword, error: insertError } = await supabase
          .from("keywords")
          .insert({ name: keywordName, type: "game_title" })
          .select()
          .single();

        if (insertError || !insertedKeyword) {
          console.error(`❌ 키워드 삽입 실패: ${keywordName}`, insertError);
          continue;
        }
        keyword = insertedKeyword;
      }

      const keywordId = keyword.id;

      // 3. streamer_keywords 테이블에 연결 (upsert)
      const { error: mappingError } = await supabase
        .from("streamer_keywords")
        .upsert({
          streamer_id: streamerId,
          keyword_id: keywordId,
        });

      if (mappingError) {
        console.error(
          `❌ 스트리머-키워드 매핑 실패: ${streamerId} - ${keywordName}`,
          mappingError
        );
      } else {
        console.log(`✅ 매핑 완료: ${streamerId} - ${keywordName}`);
      }
    }

    console.log("🎉 모든 스트리머-키워드 연결 완료!");
  }

  // 실행
  main();
}
