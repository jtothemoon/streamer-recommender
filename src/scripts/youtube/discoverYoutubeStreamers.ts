import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { gameKeywords } from "../constants/gameKeywords";
import {
  searchChannels,
  getChannelDetails,
  isKoreanText,
} from "./utils/channels";
import { isGameChannel } from "./utils/video";

/**
 * 유튜브 스트리머 발굴 스크립트 (새 테이블 구조)
 *
 * 용도: 새로운 게임 스트리머를 발굴하여 DB에 추가
 * 작동: 키워드 검색으로 스트리머 찾기 + 검증 후 저장 + 카테고리 매핑
 *
 * 실행 방법:
 * npx ts-node --project tsconfig.scripts.json src/scripts/youtube/discoverYoutubeStreamers.ts
 *
 * 옵션:
 * --game=게임1,게임2: 특정 게임 카테고리만 처리 (예: --game=롤,피파)
 * --keywords=키워드1,키워드2: 특정 키워드만 검색 (예: --keywords="게임 스트리머,롤 유튜버")
 * --skip-mapping: 카테고리 매핑 단계 건너뜀
 */
export async function discoverYoutubeStreamers() {
  // 환경변수 설정
  dotenv.config();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 커맨드라인 인자 파싱
  const args = process.argv.slice(2);
  let targetGameTypes: string[] | null = null;
  let targetKeywords: string[] | null = null;
  let skipMapping = false;

  for (const arg of args) {
    if (arg.startsWith("--game=")) {
      targetGameTypes = arg.split("=")[1].split(",");
    } else if (arg.startsWith("--keywords=")) {
      targetKeywords = arg.split("=")[1].split(",");
    } else if (arg === "--skip-mapping") {
      skipMapping = true;
    }
  }

  // Supabase 업서트 함수 - 새 테이블 구조에 맞게 수정
  const upsertStreamer = async (data: {
    channel_id: string;
    name: string;
    description: string;
    profile_image_url: string;
    subscribers: number;
    channel_url: string;
    game_type: string;
    latest_upload_date: Date | null;
  }) => {
    const now = new Date().toISOString();

    // youtube_streamers 테이블에 스트리머 정보 저장
    const { data: insertedStreamer, error } = await supabase
      .from("youtube_streamers")
      .upsert({
        youtube_channel_id: data.channel_id,
        name: data.name,
        description: data.description,
        profile_image_url: data.profile_image_url,
        channel_url: data.channel_url,
        subscribers: data.subscribers,
        latest_uploaded_at: data.latest_upload_date
          ? data.latest_upload_date.toISOString()
          : null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase youtube_streamers 업서트 실패:", error);
      return false;
    }
    console.log(`✅ 저장 완료: ${data.name} (구독자: ${data.subscribers}명)`);
    return insertedStreamer;
  };

  // 스트리머-카테고리 매핑 함수 - 새 테이블 구조에 맞게 수정
  const linkStreamerToCategory = async (
    streamerId: string,
    gameType: string
  ) => {
    // 게임 타입에 맞는 카테고리 찾기
    const { data: categories, error: categoryError } = await supabase
      .from("youtube_game_categories")
      .select("id")
      .eq("name", gameType)
      .limit(1);

    if (categoryError || !categories || categories.length === 0) {
      console.log(`⚠️ 카테고리 ID 없음: ${gameType}`);
      return false;
    }

    const categoryId = categories[0].id;

    // 중복 매핑 확인
    const { data: existingMappings, error: mappingError } = await supabase
      .from("youtube_streamer_categories")
      .select("id")
      .eq("streamer_id", streamerId)
      .eq("category_id", categoryId);

    if (mappingError) {
      console.error(
        `❌ 매핑 확인 오류: ${streamerId} -> ${gameType}`,
        mappingError
      );
      return false;
    }

    // 이미 매핑이 있으면 스킵
    if (existingMappings && existingMappings.length > 0) {
      console.log(`⏩ 이미 매핑됨: ${streamerId} -> ${gameType}`);
      return true;
    }

    // 매핑 추가
    const { error: insertError } = await supabase
      .from("youtube_streamer_categories")
      .insert({
        streamer_id: streamerId,
        category_id: categoryId,
      });

    if (insertError) {
      console.error(
        `❌ 매핑 추가 실패: ${streamerId} -> ${gameType}`,
        insertError
      );
      return false;
    } else {
      console.log(`✅ 매핑 추가: ${streamerId} -> ${gameType}`);
      return true;
    }
  };

  // 메인 실행 함수
  const main = async () => {
    console.log("🔍 유튜브 스트리머 발굴 시작...");

    const { data: gameCategories, error: categoryError } = await supabase
      .from("youtube_game_categories")
      .select("id, name, display_name")
      .order("sort_order", { ascending: true });

    if (categoryError || !gameCategories || gameCategories.length === 0) {
      console.error(
        "❌ 게임 카테고리 조회 실패:",
        categoryError || "카테고리가 없습니다."
      );
      return;
    }

    console.log(`ℹ️ DB에서 ${gameCategories.length}개 게임 카테고리 로드 완료`);

    // 동적으로 gameKeywords 객체 구성
    // 카테고리 이름을 기준으로 기존 gameKeywords에서 키워드 가져오기
    // 없으면 기본 키워드 패턴 사용
    const dbGameKeywords: { [key: string]: string[] } = {};
    
    for (const category of gameCategories) {
      const categoryName = category.name;
      const displayName = category.display_name;
      
      // 기존 gameKeywords에 해당 카테고리가 있으면 그 키워드 사용
      if (gameKeywords[categoryName]) {
        dbGameKeywords[categoryName] = gameKeywords[categoryName];
      } else {
        // 없으면 기본 키워드 패턴 생성
        dbGameKeywords[categoryName] = [
          `${categoryName} 스트리머`,
          `${categoryName} 방송`,
          `${categoryName} 유튜버`,
          `${displayName} streamer`
        ];
      }
    }

    // 기존 스트리머 ID 목록 가져오기 (중복 방지용)
    const { data: existingStreamers, error } = await supabase
      .from("youtube_streamers")
      .select("youtube_channel_id");

    if (error) {
      console.error("❌ 기존 스트리머 조회 실패:", error);
      return;
    }

    const existingIds = new Set(
      existingStreamers.map((s) => s.youtube_channel_id)
    );
    console.log(`ℹ️ 기존 ${existingIds.size}명의 스트리머 ID 로드 완료`);

    let newStreamersCount = 0;
    let totalSearches = 0;
    let discoveredChannels = 0;
    let mappingCount = 0;

    // 필터링된 게임 타입 (이제 DB에서 가져온 카테고리 사용)
    const filteredGameTypes = targetGameTypes
      ? gameCategories.filter(cat => targetGameTypes.includes(cat.name)).map(cat => cat.name)
      : gameCategories.map(cat => cat.name);

    console.log(`ℹ️ 검색 대상 게임 타입: ${filteredGameTypes.join(", ")}`);

    // 키워드 검색 및 스트리머 처리
    for (const gameType of filteredGameTypes) {
      console.log(`\n🎯 [${gameType}] 키워드 검색 시작...`);

      // DB에서 구성한 키워드 객체 사용
      const allKeywords = dbGameKeywords[gameType] || [];

      // 필터링된 키워드
      const filteredKeywords = targetKeywords
        ? allKeywords.filter((kw) => targetKeywords.includes(kw))
        : allKeywords;

      if (allKeywords.length === 0) {
        console.log(`⚠️ [${gameType}] 검색할 키워드가 없습니다.`);
        continue;
      }

      console.log(`ℹ️ 검색 키워드: ${filteredKeywords.join(", ")}`);

      for (const keyword of filteredKeywords) {
        console.log(`\n🔎 키워드: "${keyword}" 검색 중...`);
        totalSearches++;

        // 키워드로 채널 검색 (유틸리티 함수 사용)
        const searchResult = await searchChannels(keyword);
        const channels = searchResult.items || [];
        console.log(
          `ℹ️ "${keyword}" 검색 결과: ${channels.length}개 채널 발견`
        );

        // API 할당량 고려 간단한 딜레이
        await new Promise((resolve) => setTimeout(resolve, 500));

        for (const channel of channels) {
          discoveredChannels++;
          const snippet = channel.snippet;
          const channelId = channel.id.channelId;
          if (!channelId) continue;

          // 이미 DB에 있는 스트리머면 스킵
          if (existingIds.has(channelId)) {
            console.log(`⏩ 이미 등록된 스트리머: ${snippet.title}`);
            continue;
          }

          const text = (snippet.title || "") + (snippet.description || "");
          if (!isKoreanText(text)) {
            console.log(`🚫 한국어 채널 아님: ${snippet.title}`);
            continue;
          }

          // 채널 세부 정보 가져오기 (유틸리티 함수 사용)
          console.log(`🔍 채널 세부 정보 검사 중: ${snippet.title}`);
          const channelDetails = await getChannelDetails(channelId);

          if (!channelDetails.success) {
            console.log(`🚫 ${channelDetails.message}: ${snippet.title}`);
            continue;
          }

          // data 속성이 항상 존재하는지 확인
          if (!channelDetails.data) {
            console.log(`🚫 채널 세부 정보 없음: ${snippet.title}`);
            continue;
          }

          // 게임 채널 확인
          if (channelDetails.data.videoId) {
            const isGame = await isGameChannel(channelDetails.data.videoId);
            if (!isGame) {
              console.log(`🚫 게임 채널 아님: ${snippet.title}`);
              continue;
            }
          }

          const { subscribers, latestUploadDate, profileImage, description } =
            channelDetails.data;

          // 검증 완료된 채널 저장
          const insertedStreamer = await upsertStreamer({
            channel_id: channelId,
            name: snippet.title,
            description: description || "",
            profile_image_url:
              profileImage || snippet.thumbnails?.default?.url || "",
            subscribers: subscribers,
            channel_url: `https://www.youtube.com/channel/${channelId}`,
            game_type: gameType,
            latest_upload_date: latestUploadDate,
          });

          if (insertedStreamer) {
            newStreamersCount++;
            existingIds.add(channelId); // 중복 추가 방지용 ID 추가

            // 카테고리 매핑 (skip-mapping 옵션이 없을 때만)
            if (!skipMapping) {
              const mapped = await linkStreamerToCategory(
                insertedStreamer.id,
                gameType
              );
              if (mapped) mappingCount++;
            }
          }
        }
      }
    }

    console.log("\n===== 유튜브 스트리머 발굴 결과 =====");
    console.log(`🔍 총 검색 키워드: ${totalSearches}개`);
    console.log(`🧐 발견된 채널: ${discoveredChannels}개`);
    console.log(`✅ 새로 추가된 스트리머: ${newStreamersCount}명`);
    console.log(`🔗 카테고리 매핑: ${mappingCount}개`);
    console.log("🎉 유튜브 스트리머 발굴 완료!");
  };

  // 실행
  await main();
}

// 직접 실행 시
if (require.main === module) {
  discoverYoutubeStreamers().catch((err) => {
    console.error("❌ 스크립트 실행 오류:", err);
    process.exit(1);
  });
}
