import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  getKoreanStreamers,
  getUsersByIds,
  TwitchStream,
  TwitchUser,
  TwitchGame,
} from "./utils/streamers";

/**
 * 트위치 스트리머 발굴 스크립트 (한국어 방송 스트리머 기준)
 *
 * 용도: 한국어 방송 중인 스트리머 수집 + DB 추가 + 카테고리 매핑
 *
 * 실행 방법:
 * npx ts-node --project tsconfig.scripts.json src/scripts/twitch/discoverTwitchStreamers.ts
 *
 * 옵션:
 * --limit=N: 수집할 스트리머 수 (기본값: 100)
 * --skip-mapping: 카테고리 매핑 단계 건너뜀
 * --language=ko: 방송 언어 필터 (기본값: ko)
 */
export async function discoverTwitchStreamers() {
  dotenv.config();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const args = process.argv.slice(2);
  let skipMapping = false;
  let language = "ko"; // 기본값 한국어
  let limit = 100; // 스트리머 수집 제한 (기본값 100명)

  for (const arg of args) {
    if (arg === "--skip-mapping") {
      skipMapping = true;
    } else if (arg.startsWith("--language=")) {
      language = arg.split("=")[1];
    } else if (arg.startsWith("--limit=")) {
      limit = parseInt(arg.split("=")[1], 10);
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
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error(
        `❌ Supabase 스트리머 저장 실패: ${user.display_name}`,
        error
      );
      return null;
    } else {
      console.log(`✅ 스트리머 저장 완료: ${user.display_name}`);
      return insertedStreamer.id;
    }
  };

  // 게임 카테고리 저장 또는 가져오기
  const getOrCreateGameCategory = async (
    game: TwitchGame
  ): Promise<string | null> => {
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
        sort_order: 0, // 정렬 순서는 필요시 별도 업데이트
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

  // // 기존 스트리머 ID 조회
  // const { data: existingStreamers, error: fetchError } = await supabase
  //   .from("twitch_streamers")
  //   .select("twitch_id");

  // if (fetchError) {
  //   console.error("❌ 기존 스트리머 조회 실패:", fetchError);
  //   return;
  // }

  // const existingIds = new Set(existingStreamers?.map((s) => s.twitch_id) || []);
  // console.log(`ℹ️ 기존 ${existingIds.size}명의 트위치 스트리머 ID 로드 완료`);
  const existingIds = new Set<string>();

  // 한국어 스트리머 조회로 변경
  console.log(`🔍 한국어 방송 스트리머 조회 시작...`);
  // 추가한 getKoreanStreamers 함수 사용
  const koreanStreams = await getKoreanStreamers(limit, language);
  console.log(`✅ 한국어 방송 스트리머 ${koreanStreams.length}명 조회 완료`);

  // 스트리머 상세 정보 가져오기
  const userIds = koreanStreams.map((s) => s.user_id);
  const users = await getUsersByIds(userIds);
  console.log(`ℹ️ ${users.length}명의 스트리머 정보 로드 완료`);

  let newStreamersCount = 0;
  let mappingCount = 0;

  // 각 스트리머별 처리
  for (const user of users) {
    // 현재 방송 중인 스트림 정보 찾기
    const stream = koreanStreams.find((s) => s.user_id === user.id);
    if (!stream) continue;

    // 이미 등록된 스트리머 확인
    const isExisting = existingIds.has(user.id);

    // 스트리머 정보 저장
    const streamerId = await upsertStreamer(user, stream);

    if (!streamerId) continue;

    // 새 스트리머면 카운트 증가
    if (!isExisting) {
      newStreamersCount++;
      existingIds.add(user.id);
      console.log(`✅ 신규 스트리머 발견: ${user.display_name}`);
    }

    // 게임 정보가 있으면 카테고리 매핑
    if (stream.game_id && !skipMapping) {
      // 게임 정보 생성
      const game: TwitchGame = {
        id: stream.game_id,
        name: stream.game_name,
        box_art_url: "", // 필요하면 별도 API로 가져올 수 있음
      };

      // 게임 카테고리 저장 또는 가져오기
      const categoryId = await getOrCreateGameCategory(game);

      if (categoryId) {
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
