import dotenv from "dotenv";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

export async function searchAndSaveStreamers() {
  // 환경변수 설정
  dotenv.config();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const apiKey = process.env.YOUTUBE_API_KEY!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

  // 한글 여부 판별
  const isKoreanText = (text: string) => {
    const koreanMatches = text.match(/[\uac00-\ud7af]/g) || [];
    const ratio = koreanMatches.length / text.length;
    return ratio > 0.2; // 20% 이상이면 한국어로 간주
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
    });

    if (error) {
      console.error("❌ Supabase 업서트 실패:", error);
    } else {
      console.log(`✅ 저장 완료: ${data.name}`);
    }
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
  // 타입 정의 추가
  type ChannelDetailsResult = 
    | { success: true; data: { subscribers: number; latestUploadDate: Date } }
    | { success: false; message: string };
    
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

  // 메인 실행 함수
  const main = async () => {
    for (const [gameType, keywords] of Object.entries(gameKeywords)) {
      console.log(`🎯 [${gameType}] 키워드 검색 시작...`);

      for (const keyword of keywords) {
        console.log(`🔎 키워드: ${keyword}`);
        const channels = await searchChannels(keyword);

        for (const channel of channels) {
          const snippet = channel.snippet;
          const channelId = channel.id.channelId;
          if (!channelId) continue;

          const text = (snippet.title || "") + (snippet.description || "");
          if (!isKoreanText(text)) {
            console.log(`🚫 한국어 채널 아님: ${snippet.title}`);
            continue;
          }

          // 한 번의 통합된 함수로 모든 검증 및 정보 가져오기
          const channelDetails = await getChannelDetails(channelId);
          
          if (!channelDetails.success) {
            console.log(`🚫 ${channelDetails.message}: ${snippet.title}`);
            continue;
          }
          
          // TypeScript는 이제 channelDetails.success가 true일 때만 
          // data 속성이 존재함을 이해합니다
          const { subscribers, latestUploadDate } = channelDetails.data;
          
          // 검증 완료된 채널 저장
          await upsertStreamer({
            id: channelId,
            name: snippet.title,
            description: snippet.description || "",
            profileImage: snippet.thumbnails?.default?.url || "",
            subscribers: subscribers,
            channelUrl: `https://www.youtube.com/channel/${channelId}`,
            gameType: gameType,
            latestUploadDate: latestUploadDate,
          });
        }
      }
    }

    console.log("🎉 모든 작업 완료!");
  };

  // 실행
  main();
}

if (require.main === module) {
  searchAndSaveStreamers();
}