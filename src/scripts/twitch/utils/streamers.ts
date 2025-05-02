import { callTwitchApi, fetchAllPages } from './api';

// 트위치 유저 정보 타입
export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  created_at: string;
}

// 게임 정보 타입
export interface TwitchGame {
  id: string;
  name: string;
  box_art_url: string;
}

// 스트림 정보 타입
export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

// 여러 사용자 정보 가져오기
export async function getUsersByIds(userIds: string[]): Promise<TwitchUser[]> {
  if (!userIds.length) return [];
  
  // Twitch API는 한 번에 최대 100개까지만 요청 가능
  const chunks = [];
  for (let i = 0; i < userIds.length; i += 100) {
    chunks.push(userIds.slice(i, i + 100));
  }
  
  const results: TwitchUser[] = [];
  
  for (const chunk of chunks) {
    const params: Record<string, string> = {};
    chunk.forEach((id, index) => {
      params[`id${index > 0 ? `[${index}]` : ''}`] = id;
    });
    
    const response = await callTwitchApi<{ data: TwitchUser[] }>('/users', params);
    if (response.data) {
      results.push(...response.data);
    }
  }
  
  return results;
}

// 게임/카테고리별 상위 스트리머 가져오기
export async function getTopStreamersByGame(gameId: string, limit: number = 100, language: string = "ko"): Promise<TwitchStream[]> {
  const streams = await fetchAllPages<TwitchStream>(
    '/streams',
    { game_id: gameId, first: Math.min(limit, 100), language }
  );
  
  return streams.slice(0, limit);
}

// 인기 게임 목록 가져오기
export async function getTopGames(limit: number = 20): Promise<TwitchGame[]> {
  const games = await fetchAllPages<TwitchGame>(
    '/games/top',
    { first: Math.min(limit, 100) }
  );
  
  return games.slice(0, limit);
}

// 한국어 방송 스트리머 가져오기 (딱 limit 개수만큼만)
export async function getKoreanStreamers(limit: number = 100, language: string = "ko"): Promise<TwitchStream[]> {
  const streams = await fetchAllPages<TwitchStream>(
    '/streams',
    { language: language, first: Math.min(limit, 100) }
  );
  
  // 정확히 limit 개수만 반환
  return streams.slice(0, limit);
}

// 채널 팔로워 수 가져오기 (이 부분은 OAuth 사용자 토큰 필요, 불가능할 수 있음)
export async function getChannelFollowers(broadcasterId: string): Promise<number> {
  try {
    const response = await callTwitchApi<{ total: number }>('/users/follows', {
      to_id: broadcasterId
    });
    
    return response.total;
  } catch (error) {
    console.error(`팔로워 수 조회 실패: ${broadcasterId}`, error);
    return 0;
  }
}