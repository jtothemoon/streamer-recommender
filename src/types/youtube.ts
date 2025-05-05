// 유튜브 게임 카테고리 타입
export interface YoutubeGameCategory {
    id: string;
    name: string;
    display_name: string;
    sort_order: number;
    created_at: string | null;
  }
  
  // 유튜브 스트리머 타입
  export interface YoutubeStreamer {
    id: string;
    youtube_channel_id: string;
    name: string;
    description: string | null;
    profile_image_url: string | null;
    channel_url: string | null;
    subscribers: number | null;
    latest_uploaded_at: string | null;
    featured_video_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    
    // Streamer 타입과의 호환성을 위한 추가 속성
    platform: string; // "youtube"로 고정
    gender: string | null; // undefined 불가
    game_type: string | null; // undefined 불가
  }