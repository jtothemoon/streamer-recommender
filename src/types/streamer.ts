export type Platform = {
  id: string;
  streamer_id: string;
  platform: string;
  platform_id: string;
  channel_url: string | null;
  profile_image_url: string | null;
  subscribers: number | null;
  latest_uploaded_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Streamer = {
  id: string;
  name: string;
  description: string | null;
  platform: string;
  gender: string | null;
  profile_image_url: string | null;
  channel_url: string | null;
  subscribers: number | null;
  game_type: string | null;
  latest_uploaded_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  platforms?: Platform[]; // streamer_platforms 테이블 데이터
};