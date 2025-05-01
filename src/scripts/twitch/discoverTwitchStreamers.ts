// src/scripts/twitch/discoverTwitchStreamers.ts
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  getTopGames,
  getTopStreamersByGame,
  getUsersByIds,
} from "./utils/streamers";
import { gameTypeToKeyword } from "../constants/gameKeywords";
import { gameTypeToTwitchGameId } from "../constants/gameKeywords";
import { TwitchStream } from "./utils/streamers";

/**
 * 신규 트위치 스트리머 발굴 스크립트
 *
 * 용도: 인기 게임별 상위 스트리머 수집 + DB 추가 + 키워드 매핑
 *
 * 실행 방법:
 * npx ts-node --project tsconfig.scripts.json src/scripts/twitch/discoverTwitchStreamers.ts
 *
 * 옵션:
 * --game=게임1,게임2: 특정 게임 카테고리만 처리
 * --skip-mapping: 키워드 매핑 단계 건너뜀
 */
export async function discoverTwitchStreamers() {
  dotenv.config();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const args = process.argv.slice(2);
  let targetGameTypes: string[] | null = null;
  let skipMapping = false;

  for (const arg of args) {
    if (arg.startsWith("--game=")) {
      targetGameTypes = arg.split("=")[1].split(",");
    } else if (arg === "--skip-mapping") {
      skipMapping = true;
    }
  }

  // Supabase streamer 저장
  const upsertStreamer = async (data: {
    id: string;
    name: string;
    description: string;
    profileImage: string;
    channelUrl: string;
    subscribers: number | null;
    latestUploadedAt: string | null;
    gameType: string | null;
  }) => {
    const now = new Date().toISOString();
    const { error } = await supabase.from("streamers").upsert({
      id: data.id,
      name: data.name,
      description: data.description,
      platform: "twitch",
      gender: "unknown",
      profile_image_url: data.profileImage,
      channel_url: data.channelUrl,
      subscribers: data.subscribers,
      latest_uploaded_at: data.latestUploadedAt,
      game_type: data.gameType,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      console.error(`❌ Supabase 스트리머 저장 실패: ${data.name}`, error);
      return false;
    } else {
      console.log(`✅ 스트리머 저장 완료: ${data.name}`);
      return true;
    }
  };

  // Supabase 플랫폼 저장
  const upsertStreamerPlatform = async (
    streamerId: string,
    userId: string,
    stream: TwitchStream
  ) => {
    const now = new Date().toISOString();
    const { error } = await supabase.from("streamer_platforms").upsert({
      streamer_id: streamerId,
      platform: "twitch",
      platform_id: userId,
      channel_url: `https://twitch.tv/${stream.user_login}`,
      profile_image_url: stream.thumbnail_url,
      subscribers: stream.viewer_count,
      latest_uploaded_at: stream.started_at,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      console.error(`❌ 플랫폼 데이터 저장 실패: ${stream.user_name}`, error);
      return false;
    } else {
      console.log(`✅ 플랫폼 저장 완료: ${stream.user_name}`);
      return true;
    }
  };

  const linkStreamerToKeyword = async (
    streamerId: string,
    gameType: string
  ) => {
    const keywordName = gameTypeToKeyword[gameType];
    if (!keywordName) {
      console.log(`⚠️ 매핑 키워드 없음: ${gameType}`);
      return false;
    }

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

    if (existingMappings && existingMappings.length > 0) {
      console.log(`⏩ 이미 매핑됨: ${streamerId} -> ${keywordName}`);
      return true;
    }

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

  const { data: existingStreamers, error: fetchError } = await supabase
    .from("streamers")
    .select("id");

  if (fetchError) {
    console.error("❌ 기존 스트리머 조회 실패:", fetchError);
    return;
  }

  const existingIds = new Set(existingStreamers.map((s) => s.id));
  console.log(`ℹ️ 기존 ${existingIds.size}명의 스트리머 ID 로드 완료`);

  const topGames = await getTopGames(20);
  console.log("✅ getTopGames 결과:", topGames);

  const filteredGameTypes = targetGameTypes
    ? Object.keys(gameTypeToKeyword).filter((gt) =>
        targetGameTypes.includes(gt)
      )
    : Object.keys(gameTypeToKeyword);

  console.log(`ℹ️ 수집 대상 게임 타입: ${filteredGameTypes.join(", ")}`);

  let newStreamersCount = 0;
  let mappingCount = 0;

  for (const gameType of filteredGameTypes) {
    const twitchGameId = gameTypeToTwitchGameId[gameType];
    if (!twitchGameId) {
      console.log(`⚠️ [${gameType}] 해당하는 Twitch 게임 ID를 찾지 못함`);
      continue;
    }

    // 시간 때에 따라서 탑 20게임이 달라질 수 있음
    // const isInTopGames = topGames.some((g) => String(g.id) === twitchGameId);
    // if (!isInTopGames) {
    //   console.log(`⚠️ [${gameType}] Twitch topGames에 포함되지 않음`);
    //   continue;
    // }

    console.log(`\n🎯 [${gameType}] 게임 ID: ${twitchGameId} 수집 시작...`);
    const streams = await getTopStreamersByGame(twitchGameId, 50, "ko");
    const userIds = streams.map((s) => s.user_id);
    const users = await getUsersByIds(userIds);

    for (const user of users) {
      const streamerId = user.id;
      if (existingIds.has(streamerId)) {
        console.log(`⏩ 이미 등록된 스트리머: ${user.display_name}`);
        if (!skipMapping) {
          const mapped = await linkStreamerToKeyword(streamerId, gameType);
          if (mapped) mappingCount++;
        }
        continue;
      }

      const stream = streams.find((s) => s.user_id === user.id);
      const savedStreamer = await upsertStreamer({
        id: streamerId,
        name: user.display_name,
        description: user.description || "",
        profileImage: user.profile_image_url,
        channelUrl: `https://twitch.tv/${user.login}`,
        subscribers: null, // getChannelFollowers 결과
        latestUploadedAt: stream?.started_at ?? null,
        gameType: gameType,
      });

      if (savedStreamer) {
        newStreamersCount++;
        existingIds.add(streamerId);
      } else {
        continue;
      }

      if (stream) {
        const savedPlatform = await upsertStreamerPlatform(
          streamerId,
          user.id,
          stream
        );
        if (!savedPlatform) continue;
      }

      if (!skipMapping) {
        const mapped = await linkStreamerToKeyword(streamerId, gameType);
        if (mapped) mappingCount++;
      }
    }
  }

  console.log("\n===== 신규 트위치 스트리머 발굴 결과 =====");
  console.log(`✅ 신규 스트리머 등록: ${newStreamersCount}명`);
  console.log(`🔗 키워드 매핑: ${mappingCount}개`);
  console.log("🎉 작업 완료!");
}

if (require.main === module) {
  discoverTwitchStreamers().catch((err) => {
    console.error("❌ 스크립트 실행 오류:", err);
    process.exit(1);
  });
}
