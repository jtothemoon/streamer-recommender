// src/scripts/twitch/discoverTwitchStreamers.ts
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  getTopGames,
  getTopStreamersByGame,
  getUsersByIds,
  TwitchStream,
  TwitchUser,
  TwitchGame
} from "./utils/streamers";

/**
 * 트위치 스트리머 발굴 스크립트 (실시간 인기 게임 기준)
 *
 * 용도: 실시간 인기 게임의 상위 스트리머 수집 + DB 추가 + 카테고리 매핑
 *
 * 실행 방법:
 * npx ts-node --project tsconfig.scripts.json src/scripts/twitch/discoverTwitchStreamers.ts
 *
 * 옵션:
 * --top=N: 수집할 인기 게임 수 (기본값: 5)
 * --skip-mapping: 카테고리 매핑 단계 건너뜀
 * --language=ko: 방송 언어 필터 (기본값: ko)
 */
export async function discoverTwitchStreamers() {
  dotenv.config();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const args = process.argv.slice(2);
  let topGamesCount = 5; // 기본값 5개
  let skipMapping = false;
  let language = "ko"; // 기본값 한국어

  for (const arg of args) {
    if (arg.startsWith("--top=")) {
      topGamesCount = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--skip-mapping") {
      skipMapping = true;
    } else if (arg.startsWith("--language=")) {
      language = arg.split("=")[1];
    }
  }

  // Supabase 트위치 스트리머 저장
  const upsertStreamer = async (
    user: TwitchUser,
    stream: TwitchStream | null
  ): Promise<string | null> => {
    const now = new Date().toISOString();
    
    // twitch_streamers 테이블에 스트리머 정보 저장
    const { data: insertedStreamer, error } = await supabase
      .from("twitch_streamers")
      .upsert({
        twitch_id: user.id,
        login_name: user.login,
        display_name: user.display_name,
        description: user.description || "",
        profile_image_url: user.profile_image_url,
        channel_url: `https://twitch.tv/${user.login}`,
        viewer_count: stream?.viewer_count || null,
        started_at: stream?.started_at || null,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Supabase 스트리머 저장 실패: ${user.display_name}`, error);
      return null;
    } else {
      console.log(`✅ 스트리머 저장 완료: ${user.display_name}`);
      return insertedStreamer.id;
    }
  };

  // 게임 카테고리 저장 또는 가져오기
  const getOrCreateGameCategory = async (game: TwitchGame): Promise<string | null> => {
    // 기존 카테고리 조회
    const { data: existingCategory, error: fetchError } = await supabase
      .from("twitch_game_categories")
      .select("id")
      .eq("twitch_game_id", game.id)
      .single();
      
    if (!fetchError && existingCategory) {
      return existingCategory.id;
    }
    
    // 새 카테고리 생성
    const { data: newCategory, error: insertError } = await supabase
      .from("twitch_game_categories")
      .insert({
        twitch_game_id: game.id,
        name: game.name,
        display_name: game.name,
        box_art_url: game.box_art_url,
        sort_order: 0 // 정렬 순서는 필요시 별도 업데이트
      })
      .select()
      .single();
      
    if (insertError) {
      console.error(`❌ 게임 카테고리 생성 실패: ${game.name}`, insertError);
      return null;
    }
    
    console.log(`✅ 게임 카테고리 생성 완료: ${game.name}`);
    return newCategory.id;
  };

  // 트위치 스트리머-카테고리 매핑
  const linkStreamerToCategory = async (
    streamerId: string,
    categoryId: string
  ) => {
    // 중복 매핑 확인
    const { data: existingMappings, error: mappingError } = await supabase
      .from("twitch_streamer_categories")
      .select("id")
      .eq("streamer_id", streamerId)
      .eq("category_id", categoryId);

    if (mappingError) {
      console.error(
        `❌ 매핑 확인 오류: ${streamerId} -> ${categoryId}`,
        mappingError
      );
      return false;
    }

    // 이미 매핑이 있으면 스킵
    if (existingMappings && existingMappings.length > 0) {
      console.log(`⏩ 이미 매핑됨: ${streamerId} -> ${categoryId}`);
      return true;
    }

    // 매핑 추가
    const { error: insertError } = await supabase
      .from("twitch_streamer_categories")
      .insert({
        streamer_id: streamerId,
        category_id: categoryId,
      });

    if (insertError) {
      console.error(
        `❌ 매핑 추가 실패: ${streamerId} -> ${categoryId}`,
        insertError
      );
      return false;
    } else {
      console.log(`✅ 매핑 추가 완료: ${streamerId} -> ${categoryId}`);
      return true;
    }
  };

  // 기존 스트리머 ID 조회
  const { data: existingStreamers, error: fetchError } = await supabase
    .from("twitch_streamers")
    .select("twitch_id");

  if (fetchError) {
    console.error("❌ 기존 스트리머 조회 실패:", fetchError);
    return;
  }

  const existingIds = new Set(existingStreamers?.map(s => s.twitch_id) || []);
  console.log(`ℹ️ 기존 ${existingIds.size}명의 트위치 스트리머 ID 로드 완료`);

  // 인기 게임 조회
  console.log(`🔍 현재 인기 게임 상위 ${topGamesCount}개 조회 시작...`);
  const topGames = await getTopGames(topGamesCount);
  console.log("✅ 인기 게임 조회 완료:", topGames.map(g => g.name).join(", "));

  let newStreamersCount = 0;
  let mappingCount = 0;

  // 게임별 스트리머 수집
  for (const game of topGames) {
    console.log(`\n🎮 [${game.name}] 게임 ID: ${game.id} 수집 시작...`);
    
    // 게임 카테고리 저장 또는 가져오기
    const categoryId = await getOrCreateGameCategory(game);
    if (!categoryId) {
      console.log(`⚠️ [${game.name}] 카테고리 생성 실패, 스킵`);
      continue;
    }
    
    // 현재 방송 중인 스트림 가져오기
    const streams = await getTopStreamersByGame(game.id, 50, language);
    if (streams.length === 0) {
      console.log(`⚠️ [${game.name}] 현재 ${language} 언어로 방송 중인 스트리머가 없음`);
      continue;
    }
    
    console.log(`ℹ️ [${game.name}] ${streams.length}명의 실시간 스트리머 발견`);
    
    // 스트리머 상세 정보 가져오기
    const userIds = streams.map(s => s.user_id);
    const users = await getUsersByIds(userIds);
    
    console.log(`ℹ️ [${game.name}] ${users.length}명의 스트리머 정보 로드 완료`);

    // 각 스트리머 처리
    for (const user of users) {
      // 이미 등록된 스트리머 확인
      const isExisting = existingIds.has(user.id);
      
      // 현재 방송 중인 스트림 정보 찾기
      const stream = streams.find(s => s.user_id === user.id);
      
      // 스트리머 정보 저장
      const streamerId = await upsertStreamer(user, stream || null);
      
      if (!streamerId) {
        continue;
      }
      
      // 새 스트리머면 카운트 증가
      if (!isExisting) {
        newStreamersCount++;
        existingIds.add(user.id);
      }
      
      // 카테고리 매핑
      if (!skipMapping) {
        const mapped = await linkStreamerToCategory(streamerId, categoryId);
        if (mapped && !isExisting) {
          mappingCount++;
        }
      }
    }
  }

  console.log("\n===== 트위치 스트리머 발굴 결과 =====");
  console.log(`✅ 신규 스트리머 등록: ${newStreamersCount}명`);
  console.log(`🔗 카테고리 매핑: ${mappingCount}개`);
  console.log("🎉 작업 완료!");
}

// 직접 실행 시
if (require.main === module) {
  discoverTwitchStreamers().catch((err) => {
    console.error("❌ 스크립트 실행 오류:", err);
    process.exit(1);
  });
}