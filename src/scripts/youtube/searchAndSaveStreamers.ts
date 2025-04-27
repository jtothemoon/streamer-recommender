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

  // 대표 영상으로 게임 채널인지 확인
  const isGameChannel = async (channelId: string) => {
    try {
      const uploadsRes = await axios.get(
        "https://www.googleapis.com/youtube/v3/channels",
        {
          params: {
            part: "contentDetails",
            id: channelId,
            key: apiKey,
          },
        }
      );
      const uploadsPlaylistId =
        uploadsRes.data.items[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) return false;

      const videosRes = await axios.get(
        "https://www.googleapis.com/youtube/v3/playlistItems",
        {
          params: {
            part: "contentDetails",
            maxResults: 1,
            playlistId: uploadsPlaylistId,
            key: apiKey,
          },
        }
      );
      const videoId = videosRes.data.items[0]?.contentDetails?.videoId;
      if (!videoId) return false;

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
      return categoryId === "20"; // 20 = 게임
    } catch (err) {
      console.error(`❌ 게임 채널 확인 실패: ${channelId}`, err);
      return false;
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

          const isGame = await isGameChannel(channelId);
          if (!isGame) {
            console.log(`🚫 게임 채널 아님: ${snippet.title}`);
            continue;
          }

          // 구독자 수 가져오기
          const channelDetail = await axios.get(
            "https://www.googleapis.com/youtube/v3/channels",
            {
              params: {
                part: "statistics",
                id: channelId,
                key: apiKey,
              },
            }
          );
          const subscriberCount =
            channelDetail.data.items[0]?.statistics?.subscriberCount;
          const hiddenSubscriberCount =
            channelDetail.data.items[0]?.statistics?.hiddenSubscriberCount;

          // 구독자 수 비공개 채널 스킵
          if (hiddenSubscriberCount) {
            console.log(`🚫 구독자 수 비공개: ${snippet.title}`);
            continue;
          }

          // 구독자 수 1,000명 미만 스킵
          const subscribers = parseInt(subscriberCount || "0", 10);
          if (subscribers < 1000) {
            console.log(
              `🚫 구독자 수 미달: ${snippet.title} (${subscribers}명)`
            );
            continue;
          }

          await upsertStreamer({
            id: channelId,
            name: snippet.title,
            description: snippet.description || "",
            profileImage: snippet.thumbnails?.default?.url || "",
            subscribers: subscribers,
            channelUrl: `https://www.youtube.com/channel/${channelId}`,
            gameType: gameType,
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
