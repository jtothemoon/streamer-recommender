import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getChannelDetails } from "./utils/channels";

/**
 * 기존 스트리머 정보 업데이트 스크립트
 *
 * 용도: 이미 DB에 저장된 스트리머 정보를 최신 상태로 업데이트
 * 작동: 구독자 수, 최근 업로드 일자, 프로필 정보 등을 갱신
 *
 * 실행 방법:
 * npx ts-node --project tsconfig.scripts.json src/scripts/youtube/updateExistingStreamers.ts
 *
 * 옵션:
 * --limit=N: 처리할 스트리머 수 제한 (예: --limit=20)
 * --game=게임1,게임2: 특정 게임 카테고리만 처리 (예: --game=롤,피파)
 */
export async function updateExistingStreamers() {
  // 환경변수 설정
  dotenv.config();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 커맨드라인 인자 파싱
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let gameTypes: string[] | null = null;

  for (const arg of args) {
    if (arg.startsWith("--limit=")) {
      limit = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--game=")) {
      gameTypes = arg.split("=")[1].split(",");
    }
  }

  // Supabase 업데이트
  const updateStreamer = async (data: {
    id: string;
    name: string;
    description: string;
    profileImage: string;
    subscribers: number;
    channelUrl: string;
    gameType: string;
    latestUploadDate: Date | null;
  }) => {
    const now = new Date().toISOString();

    // 1. 메인 streamers 테이블 업데이트
    const { error } = await supabase
      .from("streamers")
      .update({
        description: data.description,
        profile_image_url: data.profileImage,
        subscribers: data.subscribers,
        latest_uploaded_at: data.latestUploadDate
          ? data.latestUploadDate.toISOString()
          : null,
        updated_at: now,
      })
      .eq("id", data.id);

    if (error) {
      console.error(`❌ 스트리머 업데이트 실패 (${data.name}):`, error);
      return false;
    }

    // 2. streamer_platforms 테이블 업데이트 (upsert)
    const { error: platformError } = await supabase
      .from("streamer_platforms")
      .upsert({
        streamer_id: data.id,
        platform: "youtube",
        platform_id: data.id, // YouTube는 채널 ID가 streamer ID와 동일
        channel_url: data.channelUrl,
        profile_image_url: data.profileImage,
        subscribers: data.subscribers,
        latest_uploaded_at: data.latestUploadDate
          ? data.latestUploadDate.toISOString()
          : null,
        updated_at: now,
      }, { onConflict: 'platform,platform_id' });

    if (platformError) {
      console.error(`❌ 플랫폼 정보 업데이트 실패 (${data.name}):`, platformError);
      // 메인 스트리머는 업데이트됐으므로 true 반환
      console.log(`⚠️ 플랫폼 업데이트 실패했으나 스트리머는 업데이트됨: ${data.name}`);
      return true;
    }

    console.log(`✅ 업데이트 완료: ${data.name} (구독자: ${data.subscribers}명)`);
    return true;
  };

  // 메인 실행 함수
  const main = async () => {
    console.log("🔄 기존 스트리머 정보 업데이트 시작...");

    // 쿼리 구성 (제한 및 필터 적용)
    let query = supabase
      .from("streamers")
      .select("*")
      .eq("platform", "youtube");

    // 게임 타입 필터 적용
    if (gameTypes && gameTypes.length > 0) {
      query = query.in("game_type", gameTypes);
      console.log(`ℹ️ 게임 필터 적용: ${gameTypes.join(", ")}`);
    }

    // 정렬 (업데이트 시간 오래된 순)
    query = query.order("updated_at", { ascending: true, nullsFirst: true });

    // 제한 적용
    if (limit) {
      query = query.limit(limit);
      console.log(`ℹ️ 제한 적용: ${limit}개`);
    }

    // 데이터 가져오기
    const { data: streamers, error } = await query;

    if (error) {
      console.error("❌ 스트리머 조회 실패:", error);
      return;
    }

    console.log(`ℹ️ 총 ${streamers.length}명 스트리머 업데이트 대상`);

    let successCount = 0;
    let failCount = 0;

    // 각 스트리머 업데이트
    for (const streamer of streamers) {
      console.log(`🔄 스트리머 정보 업데이트 중: ${streamer.name}`);

      // YouTube 채널만 처리
      if (streamer.platform !== "youtube") {
        console.log(
          `⏩ YouTube 채널 아님: ${streamer.name} (${streamer.platform})`
        );
        continue;
      }

      // 채널 세부 정보 가져오기 (유틸리티 함수 사용)
      const channelDetails = await getChannelDetails(streamer.id);

      if (!channelDetails.success) {
        console.log(`⚠️ ${channelDetails.message}: ${streamer.name}`);
        failCount++;
        continue;
      }

      if (!channelDetails.data) {
        console.log(`⚠️ 채널 데이터 누락: ${streamer.name}`);
        failCount++;
        continue;
      }

      const { subscribers, latestUploadDate, profileImage, description } = channelDetails.data;

      // 업데이트 수행
      const result = await updateStreamer({
        id: streamer.id,
        name: streamer.name,
        description: description || streamer.description || "",
        profileImage: profileImage || streamer.profile_image_url || "",
        subscribers: subscribers,
        channelUrl: streamer.channel_url,
        gameType: streamer.game_type,
        latestUploadDate: latestUploadDate,
      });

      if (result) successCount++;
      else failCount++;
    }

    console.log("\n===== 업데이트 결과 =====");
    console.log(`✅ 성공: ${successCount}명`);
    console.log(`❌ 실패: ${failCount}명`);
    console.log("🎉 기존 스트리머 업데이트 완료!");
  };

  // 실행
  await main();
}

// 직접 실행 시
if (require.main === module) {
  updateExistingStreamers().catch((err) => {
    console.error("❌ 스크립트 실행 오류:", err);
    process.exit(1);
  });
}