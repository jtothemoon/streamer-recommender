import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getChannelDetails } from "./utils/channels";

/**
 * 유튜브 스트리머 정보 업데이트 스크립트
 *
 * 용도: 이미 DB에 저장된 유튜브 스트리머 정보를 최신 상태로 업데이트
 * 작동: 구독자 수, 최근 업로드 일자, 프로필 정보 등을 갱신
 *
 * 실행 방법:
 * npx ts-node --project tsconfig.scripts.json src/scripts/youtube/updateYoutubeStreamers.ts
 *
 * 옵션:
 * --limit=N: 처리할 스트리머 수 제한 (예: --limit=20)
 * --category=카테고리1,카테고리2: 특정 게임 카테고리만 처리 (예: --category=롤,피파)
 */
export async function updateYoutubeStreamers() {
  // 환경변수 설정
  dotenv.config();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 커맨드라인 인자 파싱
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let categories: string[] | null = null;

  for (const arg of args) {
    if (arg.startsWith("--limit=")) {
      limit = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--category=")) {
      categories = arg.split("=")[1].split(",");
    }
  }

  // Supabase 업데이트
  const updateStreamer = async (data: {
    id: string;
    youtube_channel_id: string;
    name: string;
    description: string;
    profile_image_url: string;
    subscribers: number;
    channel_url: string;
    latest_upload_date: Date | null;
  }) => {
    const now = new Date().toISOString();

    // youtube_streamers 테이블 업데이트
    const { error } = await supabase
      .from("youtube_streamers")
      .update({
        description: data.description,
        profile_image_url: data.profile_image_url,
        subscribers: data.subscribers,
        latest_uploaded_at: data.latest_upload_date
          ? data.latest_upload_date.toISOString()
          : null,
        updated_at: now,
      })
      .eq("id", data.id);

    if (error) {
      console.error(`❌ 스트리머 업데이트 실패 (${data.name}):`, error);
      return false;
    }

    console.log(`✅ 업데이트 완료: ${data.name} (구독자: ${data.subscribers}명)`);
    return true;
  };

  // 메인 실행 함수
  const main = async () => {
    console.log("🔄 유튜브 스트리머 정보 업데이트 시작...");

    // 기본 쿼리 구성
    let query = supabase
      .from("youtube_streamers")
      .select("*");

    // 특정 카테고리 필터링 (카테고리 지정된 경우)
    if (categories && categories.length > 0) {
      console.log(`ℹ️ 카테고리 필터 적용: ${categories.join(", ")}`);
      
      // 카테고리 ID 조회
      const { data: categoryData, error: categoryError } = await supabase
        .from("youtube_game_categories")
        .select("id")
        .in("name", categories);
        
      if (categoryError || !categoryData || categoryData.length === 0) {
        console.error("❌ 카테고리 조회 실패:", categoryError || "카테고리를 찾을 수 없음");
        return;
      }
      
      const categoryIds = categoryData.map(c => c.id);
      
      // 카테고리와 매핑된 스트리머 ID 조회
      const { data: mappingsData, error: mappingsError } = await supabase
        .from("youtube_streamer_categories")
        .select("streamer_id")
        .in("category_id", categoryIds);
        
      if (mappingsError) {
        console.error("❌ 카테고리 매핑 조회 실패:", mappingsError);
        return;
      }
      
      if (!mappingsData || mappingsData.length === 0) {
        console.log("⚠️ 선택한 카테고리에 매핑된 스트리머가 없습니다.");
        return;
      }
      
      const streamerIds = mappingsData.map(m => m.streamer_id);
      query = query.in("id", streamerIds);
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

    if (!streamers || streamers.length === 0) {
      console.log("⚠️ 업데이트할 스트리머가 없습니다.");
      return;
    }

    console.log(`ℹ️ 총 ${streamers.length}명 스트리머 업데이트 대상`);

    let successCount = 0;
    let failCount = 0;

    // 각 스트리머 업데이트
    for (const streamer of streamers) {
      console.log(`🔄 스트리머 정보 업데이트 중: ${streamer.name}`);

      // 채널 세부 정보 가져오기 (유틸리티 함수 사용)
      const channelDetails = await getChannelDetails(streamer.youtube_channel_id);

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
        youtube_channel_id: streamer.youtube_channel_id,
        name: streamer.name,
        description: description || streamer.description || "",
        profile_image_url: profileImage || streamer.profile_image_url || "",
        subscribers: subscribers,
        channel_url: streamer.channel_url,
        latest_upload_date: latestUploadDate,
      });

      if (result) successCount++;
      else failCount++;
    }

    console.log("\n===== 업데이트 결과 =====");
    console.log(`✅ 성공: ${successCount}명`);
    console.log(`❌ 실패: ${failCount}명`);
    console.log("🎉 유튜브 스트리머 업데이트 완료!");
  };

  // 실행
  await main();
}

// 직접 실행 시
if (require.main === module) {
  updateYoutubeStreamers().catch((err) => {
    console.error("❌ 스크립트 실행 오류:", err);
    process.exit(1);
  });
}