import dotenv from "dotenv";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

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
  const apiKey = process.env.YOUTUBE_API_KEY!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 커맨드라인 인자 파싱
  const args = process.argv.slice(2);
  let targetGameTypes: string[] | null = null;
  let targetKeywords: string[] | null = null;
  let skipMapping = false;

  for (const arg of args) {
    if (arg.startsWith('--game=')) {
      targetGameTypes = arg.split('=')[1].split(',');
    } else if (arg.startsWith('--keywords=')) {
      targetKeywords = arg.split('=')[1].split(',');
    } else if (arg === '--skip-mapping') {
      skipMapping = true;
    }
  }

  // 게임별 키워드 설정 확장
  const gameKeywords: { [key: string]: string[] } = {
    종겜: ["게임 스트리머", "종합게임 스트리머", "게임 방송"],
    롤: ["롤 스트리머", "리그오브레전드 방송", "롤 유튜버"],
    피파: ["피파 스트리머", "피파 유튜버", "피파 방송"],
    발로란트: ["발로란트 스트리머", "발로 유튜버", "발로란트 방송"],
    배틀그라운드: ["배그 스트리머", "배틀그라운드 방송", "PUBG 유튜버"],
    오버워치: ["오버워치 스트리머", "옵치 방송", "오버워치 유튜버"],
    스타크래프트: ["스타 스트리머", "스타크래프트 방송", "스타 유튜버"],
    서든어택: ["서든 스트리머", "서든어택 방송", "서든 유튜버"],
    GTA: ["GTA 스트리머", "GTA 방송", "지티에이 유튜버"],
    마인크래프트: ["마크 스트리머", "마인크래프트 방송", "마크 유튜버"],
    모바일게임: ["모바일게임 스트리머", "리니지M 방송", "오딘 방송"],
    디아블로: ["디아블로 스트리머", "디아4 방송", "디아블로 유튜버"],
  };

  // 타입 정의
  type ChannelDetailsResult = 
    | { success: true; data: { subscribers: number; latestUploadDate: Date } }
    | { success: false; message: string };

  // 한글 여부 판별
  const isKoreanText = (text: string) => {
    const koreanMatches = text.match(/[\uac00-\ud7af]/g) || [];
    const ratio = koreanMatches.length / text.length;
    return ratio > 0.2; // 20% 이상이면 한국어로 간주
  };

  // Search API 호출해서 채널 리스트 가져오기
  const searchChannels = async (query: string) => {
    try {
      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/search",
        {
          params: {
            part: "snippet",
            q: query,
            type: "channel",
            maxResults: 20,
            key: apiKey,
          },
        }
      );
      return response.data.items || [];
    } catch (err) {
      console.error(`❌ Search API 실패: ${query}`, err);
      return [];
    }
  };

  // 채널 세부 정보 가져오기 (중복 API 호출 방지)
  const getChannelDetails = async (channelId: string): Promise<ChannelDetailsResult> => {
    try {
      // 한 번의 API 호출로 여러 정보를 함께 가져옴
      const { data: channelData } = await axios.get(
        "https://www.googleapis.com/youtube/v3/channels",
        {
          params: {
            part: "contentDetails,statistics",
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
      
      // 구독자 수 1,000명 미만 스킵
      const subscribers = parseInt(subscriberCount || "0", 10);
      if (subscribers < 1000) {
        return { success: false, message: `구독자 수 미달: ${subscribers}명` };
      }

      // 업로드 플레이리스트 ID
      const uploadsPlaylistId = channelItem?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) {
        return { success: false, message: "업로드 플레이리스트 정보 없음" };
      }

      // 최신 동영상 정보 가져오기 (한 번만 호출)
      const { data: playlistData } = await axios.get(
        "https://www.googleapis.com/youtube/v3/playlistItems",
        {
          params: {
            part: "snippet,contentDetails",
            playlistId: uploadsPlaylistId,
            maxResults: 1,
            key: apiKey,
          },
        }
      );

      if (!playlistData.items?.length) {
        return { success: false, message: "동영상 정보 없음" };
      }
      
      const latestVideo = playlistData.items[0];
      const videoId = latestVideo.contentDetails?.videoId;
      const publishedAt = latestVideo.snippet?.publishedAt;
      
      if (!publishedAt) {
        return { success: false, message: "업로드 날짜 정보 없음" };
      }
      
      const latestUploadDate = new Date(publishedAt);
      
      // 한 달 이내 업로드 확인
      const daysSinceUpload = (Date.now() - latestUploadDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpload > 30) {
        return { success: false, message: "최근 1개월 업로드 없음" };
      }
      
      // 게임 채널 확인 (필요 시만 추가 API 호출)
      let isGameChannel = false;
      
      if (videoId) {
        try {
          const videoRes = await axios.get(
            "https://www.googleapis.com/youtube/v3/videos",
            {
              params: {
                part: "snippet",
                id: videoId,
                key: apiKey,
              },
            }
          );
          const categoryId = videoRes.data.items[0]?.snippet?.categoryId;
          isGameChannel = categoryId === "20"; // 20 = 게임
        } catch (err) {
          console.error(`❌ 동영상 정보 가져오기 실패: ${videoId}`, err);
        }
      }
      
      if (!isGameChannel) {
        return { success: false, message: "게임 채널 아님" };
      }
      
      // 성공시 필요 정보 반환
      return {
        success: true,
        data: {
          subscribers,
          latestUploadDate,
        }
      };
      
    } catch (err) {
      console.error(`❌ 채널 세부 정보 가져오기 실패: ${channelId}`, err);
      return { success: false, message: "API 호출 오류" };
    }
  };

  // Supabase 업서트
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
      latest_uploaded_at: data.latestUploadDate ? data.latestUploadDate.toISOString() : null,
      created_at: now,
      updated_at: now
    });

    if (error) {
      console.error("❌ Supabase 업서트 실패:", error);
      return false;
    } else {
      console.log(`✅ 저장 완료: ${data.name} (구독자: ${data.subscribers}명)`);
      return true;
    }
  };

  // 스트리머-키워드 매핑
  const linkStreamerToKeyword = async (streamerId: string, gameType: string) => {
    // 게임 타입과 키워드 매핑 정보
    const gameTypeToKeyword: { [key: string]: string } = {
      "종겜": "게임 방송",
      "롤": "LOL",
      "피파": "피파",
      "발로란트": "발로란트",
      "배틀그라운드": "배틀그라운드",
      "오버워치": "오버워치",
      "스타크래프트": "스타크래프트",
      "서든어택": "서든어택",
      "GTA": "GTA",
      "마인크래프트": "마인크래프트",
      "모바일게임": "모바일게임",
      "디아블로": "디아블로"
    };
    
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
      console.error(`❌ 매핑 확인 오류: ${streamerId} -> ${keywordName}`, mappingError);
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
        keyword_id: keywordId
      });
    
    if (insertError) {
      console.error(`❌ 매핑 추가 실패: ${streamerId} -> ${keywordName}`, insertError);
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
    
    const existingIds = new Set(existingStreamers.map(s => s.id));
    console.log(`ℹ️ 기존 ${existingIds.size}명의 스트리머 ID 로드 완료`);
    
    let newStreamersCount = 0;
    let totalSearches = 0;
    let discoveredChannels = 0;
    let mappingCount = 0;
    
    // 필터링된 게임 타입
    const filteredGameTypes = targetGameTypes 
      ? Object.keys(gameKeywords).filter(gt => targetGameTypes.includes(gt))
      : Object.keys(gameKeywords);
    
    console.log(`ℹ️ 검색 대상 게임 타입: ${filteredGameTypes.join(', ')}`);
    
    // 키워드 검색 및 스트리머 처리
    for (const gameType of filteredGameTypes) {
      console.log(`\n🎯 [${gameType}] 키워드 검색 시작...`);
      
      // 해당 게임 타입의 모든 키워드
      const allKeywords = gameKeywords[gameType];
      
      // 필터링된 키워드
      const filteredKeywords = targetKeywords 
        ? allKeywords.filter(kw => targetKeywords.includes(kw))
        : allKeywords;
      
      if (filteredKeywords.length === 0) {
        console.log(`⚠️ [${gameType}] 검색할 키워드가 없습니다.`);
        continue;
      }
      
      console.log(`ℹ️ 검색 키워드: ${filteredKeywords.join(', ')}`);

      for (const keyword of filteredKeywords) {
        console.log(`\n🔎 키워드: "${keyword}" 검색 중...`);
        totalSearches++;
        
        // 키워드로 채널 검색
        const channels = await searchChannels(keyword);
        console.log(`ℹ️ "${keyword}" 검색 결과: ${channels.length}개 채널 발견`);
        
        // API 할당량 고려 간단한 딜레이
        await new Promise(resolve => setTimeout(resolve, 500));

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

          // 채널 세부 정보 가져오기
          console.log(`🔍 채널 세부 정보 검사 중: ${snippet.title}`);
          const channelDetails = await getChannelDetails(channelId);
          
          if (!channelDetails.success) {
            console.log(`🚫 ${channelDetails.message}: ${snippet.title}`);
            continue;
          }
          
          const { subscribers, latestUploadDate } = channelDetails.data;
          
          // 검증 완료된 채널 저장
          const streamerSaved = await upsertStreamer({
            id: channelId,
            name: snippet.title,
            description: snippet.description || "",
            profileImage: snippet.thumbnails?.default?.url || "",
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
  discoverNewStreamers()
    .catch(err => {
      console.error("❌ 스크립트 실행 오류:", err);
      process.exit(1);
    });
}