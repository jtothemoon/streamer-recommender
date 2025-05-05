// 치지직 게임 카테고리 타입
export interface ChzzkGameCategory {
  id: string;
  chzzk_game_id: string;
  name: string;
  display_name: string;
  box_art_url: string | null;
  sort_order: number;
  created_at: string | null;
}

// 치지직 스트리머 타입
export interface ChzzkStreamer {
  id: string;
  chzzk_id: string;
  login_name: string;
  display_name: string;
  description: string | null;
  profile_image_url: string | null;
  channel_url: string | null;
  viewer_count: number | null;
  started_at: string | null;
  created_at: string | null;
  updated_at: string | null;

  // Streamer 타입과의 호환성을 위한 추가 속성
  platform?: string; // "chzzk"로 고정
  gender?: string | null;
  game_type?: string | null;
  subscribers?: number | null; // viewer_count를 subscribers로 표시
}
