import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { gameKeywords, gameTypeToKeyword } from "../constants/gameKeywords";
import {
  searchChannels,
  getChannelDetails,
  isKoreanText,
} from "./utils/channels";
import { isGameChannel } from "./utils/video";

/**
 * 신규 스트리머 발굴 스크립트
 *
 * 용도: 새로운 게임 스트리머를 발굴하여 DB에 추가
 * 작동: 키워드 검색으로 스트리머 찾기 + 검증 후 저장 + 키워드 매핑
 *
 * 실행 방법:
 * npx ts-node --project tsconfig.scripts.json src/scripts/youtube/discoverNewStreamers.ts
 *
 * 옵션:
 * --game=게임1,게임2: 특정 게임 카테고리만 처리 (예: --game=롤,피파)
 * --keywords=키워드1,키워드2: 특정 키워드만 검색 (예: --keywords="게임 스트리머,롤 유튜버")
 * --skip-mapping: 키워드 매핑 단계 건너뜀
 */
export async function discoverNewStreamers() {
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

  // Supabase 업서트 함수
  const upsertStreamer = async (data: {
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

    // 1. 메인 streamer 테이블 업서트
    const { error } = await supabase.from("streamers").upsert({
      id: data.id,
      name: data.name,
      description: data.description,
      profile_image_url: data.profileImage,
      platform: "youtube",
      gender: "unknown",
      channel_url: data.channelUrl,
      subscribers: data.subscribers,
      game_type: data.gameType,
      latest_uploaded_at: data.latestUploadDate
        ? data.latestUploadDate.toISOString()
        : null,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      console.error("❌ Supabase streamer 업서트 실패:", error);
      return false;
    }

    // 2. streamer_platforms 테이블 업서트
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
        created_at: now,
        updated_at: now,
      });

    if (platformError) {
      console.error("❌ Supabase platform 업서트 실패:", platformError);
      // 메인 스트리머는 저장됐으므로 true 반환
      console.log(`⚠️ 플랫폼 저장 실패했으나 스트리머는 저장됨: ${data.name}`);
      return true;
    }

    console.log(`✅ 저장 완료: ${data.name} (구독자: ${data.subscribers}명)`);
    return true;
  };

  // 스트리머-키워드 매핑
  const linkStreamerToKeyword = async (
    streamerId: string,
    gameType: string
  ) => {
    // 게임 타입에 맞는 키워드 찾기
    const keywordName = gameTypeToKeyword[gameType];
    if (!keywordName) {
      console.log(`⚠️ 매핑 키워드 없음: ${gameType}`);
      return false;
    }

    // 키워드 ID 찾기
    const { data: keywords, error: keywordError } = await supabase
      .from("keywords")
      .select("id")
      .eq("name", keywordName)
      .limit(1);

    if (keywordError || !keywords || keywords.length === 0) {
      console.log(`⚠️ 키워드 ID 없음: ${keywordName}`);
      return false;
    }

    const keywordId = keywords[0].id;

    // 중복 매핑 확인
    const { data: existingMappings, error: mappingError } = await supabase
      .from("streamer_keywords")
      .select("id")
      .eq("streamer_id", streamerId)
      .eq("keyword_id", keywordId);

    if (mappingError) {
      console.error(
        `❌ 매핑 확인 오류: ${streamerId} -> ${keywordName}`,
        mappingError
      );
      return false;
    }

    // 이미 매핑이 있으면 스킵
    if (existingMappings && existingMappings.length > 0) {
      console.log(`⏩ 이미 매핑됨: ${streamerId} -> ${keywordName}`);
      return true;
    }

    // 매핑 추가
    const { error: insertError } = await supabase
      .from("streamer_keywords")
      .insert({
        streamer_id: streamerId,
        keyword_id: keywordId,
      });

    if (insertError) {
      console.error(
        `❌ 매핑 추가 실패: ${streamerId} -> ${keywordName}`,
        insertError
      );
      return false;
    } else {
      console.log(`✅ 매핑 추가: ${streamerId} -> ${keywordName}`);
      return true;
    }
  };

  // 메인 실행 함수
  const main = async () => {
    console.log("🔍 신규 스트리머 발굴 시작...");

    // 기존 스트리머 ID 목록 가져오기 (중복 방지용)
    const { data: existingStreamers, error } = await supabase
      .from("streamers")
      .select("id")
      .eq("platform", "youtube");

    if (error) {
      console.error("❌ 기존 스트리머 조회 실패:", error);
      return;
    }

    const existingIds = new Set(existingStreamers.map((s) => s.id));
    console.log(`ℹ️ 기존 ${existingIds.size}명의 스트리머 ID 로드 완료`);

    let newStreamersCount = 0;
    let totalSearches = 0;
    let discoveredChannels = 0;
    let mappingCount = 0;

    // 필터링된 게임 타입
    const filteredGameTypes = targetGameTypes
      ? Object.keys(gameKeywords).filter((gt) => targetGameTypes.includes(gt))
      : Object.keys(gameKeywords);

    console.log(`ℹ️ 검색 대상 게임 타입: ${filteredGameTypes.join(", ")}`);

    // 키워드 검색 및 스트리머 처리
    for (const gameType of filteredGameTypes) {
      console.log(`\n🎯 [${gameType}] 키워드 검색 시작...`);

      // 해당 게임 타입의 모든 키워드
      const allKeywords = gameKeywords[gameType];

      // 필터링된 키워드
      const filteredKeywords = targetKeywords
        ? allKeywords.filter((kw) => targetKeywords.includes(kw))
        : allKeywords;

      if (filteredKeywords.length === 0) {
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

          // 이미 DB에 있는 스트리머면 새 스트리머 등록은 스킵하되, 키워드 매핑은 진행
          if (existingIds.has(channelId)) {
            console.log(
              `⏩ 이미 등록된 스트리머: ${snippet.title}, 키워드 매핑 진행`
            );

            // 키워드 매핑 (skip-mapping 옵션이 없을 때만)
            if (!skipMapping) {
              const mapped = await linkStreamerToKeyword(channelId, gameType);
              if (mapped) mappingCount++;
            }

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

          const { subscribers, latestUploadDate, profileImage } =
            channelDetails.data;

          // 검증 완료된 채널 저장
          const streamerSaved = await upsertStreamer({
            id: channelId,
            name: snippet.title,
            description: snippet.description || "",
            profileImage:
              profileImage || snippet.thumbnails?.default?.url || "",
            subscribers: subscribers,
            channelUrl: `https://www.youtube.com/channel/${channelId}`,
            gameType: gameType,
            latestUploadDate: latestUploadDate,
          });

          if (streamerSaved) {
            newStreamersCount++;
            existingIds.add(channelId); // 중복 추가 방지용 ID 추가

            // 키워드 매핑 (skip-mapping 옵션이 없을 때만)
            if (!skipMapping) {
              const mapped = await linkStreamerToKeyword(channelId, gameType);
              if (mapped) mappingCount++;
            }
          }
        }
      }
    }

    console.log("\n===== 신규 스트리머 발굴 결과 =====");
    console.log(`🔍 총 검색 키워드: ${totalSearches}개`);
    console.log(`🧐 발견된 채널: ${discoveredChannels}개`);
    console.log(`✅ 새로 추가된 스트리머: ${newStreamersCount}명`);
    console.log(`🔗 키워드 매핑: ${mappingCount}개`);
    console.log("🎉 신규 스트리머 발굴 완료!");
  };

  // 실행
  await main();
}

// 직접 실행 시
if (require.main === module) {
  discoverNewStreamers().catch((err) => {
    console.error("❌ 스크립트 실행 오류:", err);
    process.exit(1);
  });
}
