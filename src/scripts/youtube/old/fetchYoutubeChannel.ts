import dotenv from "dotenv";
import axios from "axios";
import { createClient } from '@supabase/supabase-js'

// .env 파일 불러오기
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 환경변수에서 YouTube API 키 읽기
const apiKey = process.env.YOUTUBE_API_KEY!;

// 테스트할 채널 ID (아무 유튜브 채널 ID 하나 넣으면 됨)
const channelId = "UC_x5XG1OV2P6uZZ5FSM9Ttw"; // 예시

// 채널 정보 가져오는 함수
const fetchChannelInfo = async () => {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "snippet,statistics",
          id: channelId,
          key: apiKey,
        },
      }
    );

    const channel = response.data.items[0];
    if (!channel) {
      console.log("채널을 찾을 수 없습니다.");
      return;
    }

    const info = {
      name: channel.snippet.title,
      description: channel.snippet.description,
      profileImage: channel.snippet.thumbnails?.default?.url,
      subscribers: parseInt(channel.statistics.subscriberCount, 10),
      channelUrl: `https://www.youtube.com/channel/${channelId}`,
    };

    console.log("📦 채널 정보:", info);

    await upsertStreamer({
        id: channel.id,
        name: info.name,
        description: info.description,
        profileImage: info.profileImage,
        subscribers: info.subscribers,
        channelUrl: info.channelUrl,
      });
  } catch (err) {
    console.error("❌ API 요청 실패:", err);
  }

  
};

const upsertStreamer = async (data: {
  id: string;
  name: string;
  description: string;
  profileImage: string;
  subscribers: number;
  channelUrl: string;
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
  });

  if (error) {
    console.error("❌ Supabase 업서트 실패:", error);
  } else {
    console.log("✅ Supabase에 저장 완료!");
  }
};

// 실행
fetchChannelInfo();
