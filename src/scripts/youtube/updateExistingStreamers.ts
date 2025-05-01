import dotenv from "dotenv";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

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
  const apiKey = process.env.YOUTUBE_API_KEY!;

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

  // 타입 정의
  type ChannelDetailsResult =
    | {
        success: true;
        data: {
          subscribers: number;
          latestUploadDate: Date | null;
          profileImage: string;
          description: string;
        };
      }
    | { success: false; message: string };

  // 채널 세부 정보 가져오기
  const getChannelDetails = async (
    channelId: string
  ): Promise<ChannelDetailsResult> => {
    try {
      // 채널 정보 가져오기 (구독자 수, 설명, 업로드 플레이리스트 등)
      const { data: channelData } = await axios.get(
        "https://www.googleapis.com/youtube/v3/channels",
        {
          params: {
            part: "contentDetails,statistics,snippet",
            id: channelId,
            key: apiKey,
          },
        }
      );

      if (!channelData.items?.length) {
        return { success: false, message: "채널 정보 없음" };
      }

      const channelItem = channelData.items[0];

      // 구독자 수 확인
      const statistics = channelItem.statistics || {};
      const subscriberCount = statistics.subscriberCount;
      const hiddenSubscriberCount = statistics.hiddenSubscriberCount;

      // 구독자 수 비공개 채널 스킵
      if (hiddenSubscriberCount) {
        return { success: false, message: "구독자 수 비공개" };
      }

      // 구독자 수 값
      const subscribers = parseInt(subscriberCount || "0", 10);

      // 프로필 이미지와 설명 가져오기
      const snippet = channelItem.snippet || {};
      const profileImage = snippet.thumbnails?.default?.url || "";
      const description = snippet.description || "";

      // 업로드 플레이리스트 ID
      const uploadsPlaylistId =
        channelItem?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) {
        return { success: false, message: "업로드 플레이리스트 정보 없음" };
      }

      // 최신 동영상 정보 가져오기
      let latestUploadDate: Date | null = null;

      try {
        const { data: playlistData } = await axios.get(
          "https://www.googleapis.com/youtube/v3/playlistItems",
          {
            params: {
              part: "snippet",
              playlistId: uploadsPlaylistId,
              maxResults: 1,
              key: apiKey,
            },
          }
        );

        if (playlistData.items?.length) {
          const publishedAt = playlistData.items[0].snippet?.publishedAt;
          if (publishedAt) {
            latestUploadDate = new Date(publishedAt);
          }
        }
      } catch (err) {
        console.error(`⚠️ 최신 동영상 정보 가져오기 실패: ${channelId}`, err);
        // 최신 동영상 정보가 없어도 업데이트는 계속 진행
      }

      // 성공시 필요 정보 반환
      return {
        success: true,
        data: {
          subscribers,
          latestUploadDate,
          profileImage,
          description,
        },
      };
    } catch (err) {
      console.error(`❌ 채널 세부 정보 가져오기 실패: ${channelId}`, err);
      return { success: false, message: "API 호출 오류" };
    }
  };

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
    } else {
      console.log(
        `✅ 업데이트 완료: ${data.name} (구독자: ${data.subscribers}명)`
      );
      return true;
    }
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

      // 채널 세부 정보 가져오기
      const channelDetails = await getChannelDetails(streamer.id);

      if (!channelDetails.success) {
        console.log(`⚠️ ${channelDetails.message}: ${streamer.name}`);
        failCount++;
        continue;
      }

      const { subscribers, latestUploadDate, profileImage, description } =
        channelDetails.data;

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
