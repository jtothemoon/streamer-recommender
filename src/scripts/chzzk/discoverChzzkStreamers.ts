import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getLiveStreamers, ChzzkLiveData, ChzzkGame } from "./utils/streamers";

/**
 * 치지직 스트리머 발굴 스크립트
 *
 * 용도: 치지직 라이브 중인 스트리머 수집 + DB 추가 + 카테고리 매핑
 *
 * 실행 방법:
 * npx ts-node --project tsconfig.scripts.json src/scripts/chzzk/discoverChzzkStreamers.ts
 *
 * 옵션:
 * --limit=N: 수집할 스트리머 수 (기본값: 50)
 * --skip-mapping: 카테고리 매핑 단계 건너뜀
 */
export async function discoverChzzkStreamers() {
  dotenv.config();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const args = process.argv.slice(2);
  let skipMapping = false;
  let limit = 100; // 스트리머 수집 제한 (기본값 100명)

  for (const arg of args) {
    if (arg === "--skip-mapping") {
      skipMapping = true;
    } else if (arg.startsWith("--limit=")) {
      limit = parseInt(arg.split("=")[1], 10);
    }
  }

  // Supabase 치지직 스트리머 저장
  const upsertStreamer = async (
    liveData: ChzzkLiveData
  ): Promise<string | null> => {
    const now = new Date().toISOString();
    const channel = liveData.channel;

    // chzzk_streamers 테이블에 스트리머 정보 저장
    const { data: insertedStreamer, error } = await supabase
      .from("chzzk_streamers")
      .upsert({
        chzzk_id: channel.channelId,
        login_name: channel.channelName,
        display_name: channel.channelName,
        description: "", // API에 description 필드가 없음
        profile_image_url: channel.channelImageUrl || null,
        channel_url: `https://chzzk.naver.com/live/${channel.channelId}`,
        viewer_count: liveData.concurrentUserCount,
        started_at: liveData.openDate ? new Date(liveData.openDate).toISOString() : null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error(
        `❌ Supabase 스트리머 저장 실패: ${channel.channelName}`,
        error
      );
      return null;
    } else {
      console.log(`✅ 스트리머 저장 완료: ${channel.channelName}`);
      return insertedStreamer.id;
    }
  };

  // 게임 카테고리 저장 또는 가져오기
  const getOrCreateGameCategory = async (
    game: ChzzkGame
  ): Promise<string | null> => {
    // 기존 카테고리 조회
    const { data: existingCategory, error: fetchError } = await supabase
      .from("chzzk_game_categories")
      .select("id")
      .eq("chzzk_game_id", game.id)
      .single();

    if (!fetchError && existingCategory) {
      return existingCategory.id;
    }

    // 새 카테고리 생성
    const { data: newCategory, error: insertError } = await supabase
      .from("chzzk_game_categories")
      .insert({
        chzzk_game_id: game.id,
        name: game.name.toLowerCase().replace(/\s+/g, ''),
        display_name: game.displayName || game.name,
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

  // 치지직 스트리머-카테고리 매핑
  const linkStreamerToCategory = async (
    streamerId: string,
    categoryId: string
  ) => {
    // 매핑 추가 (upsert로 중복 방지)
    const { error: insertError } = await supabase
      .from("chzzk_streamer_categories")
      .upsert({
        streamer_id: streamerId,
        category_id: categoryId,
      }, {
        onConflict: 'streamer_id,category_id'
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

  // 게임 정보 생성 함수
  const createGameInfo = (liveData: ChzzkLiveData): ChzzkGame => {
    return {
      id: liveData.liveCategory,
      name: liveData.liveCategory.toLowerCase().replace(/\s+/g, ''),
      displayName: liveData.liveCategoryValue
    };
  };

  const existingIds = new Set<string>();

  // 치지직 라이브 스트리머 조회
  console.log(`🔍 치지직 라이브 스트리머 조회 시작...`);
  const liveChannels = await getLiveStreamers(limit);
  console.log(`✅ 치지직 라이브 스트리머 ${liveChannels.length}명 조회 완료`);

  let newStreamersCount = 0;
  let mappingCount = 0;

  // 각 스트리머별 처리
  for (const liveData of liveChannels) {
    const channel = liveData.channel;

    // 이미 등록된 스트리머 확인
    const isExisting = existingIds.has(channel.channelId);

    // 스트리머 정보 저장
    const streamerId = await upsertStreamer(liveData);

    if (!streamerId) continue;

    // 새 스트리머면 카운트 증가
    if (!isExisting) {
      newStreamersCount++;
      existingIds.add(channel.channelId);
      console.log(`✅ 신규 스트리머 발견: ${channel.channelName}`);
    }

    // 게임 정보가 있으면 카테고리 매핑
    if (liveData.liveCategory && !skipMapping) {
      // 게임 정보 생성
      const game = createGameInfo(liveData);

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

  console.log("\n===== 치지직 스트리머 발굴 결과 =====");
  console.log(`✅ 신규 스트리머 등록: ${newStreamersCount}명`);
  console.log(`🔗 카테고리 매핑: ${mappingCount}개`);
  console.log("🎉 작업 완료!");
}

// 직접 실행 시
if (require.main === module) {
  discoverChzzkStreamers().catch((err) => {
    console.error("❌ 스크립트 실행 오류:", err);
    process.exit(1);
  });
}