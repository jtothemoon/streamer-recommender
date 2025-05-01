import axios, { AxiosError } from 'axios';
import { getTwitchToken } from './auth';

// API 요청 기본 설정
const twitchApiClient = axios.create({
  baseURL: 'https://api.twitch.tv/helix',
  headers: {
    'Content-Type': 'application/json'
  }
});

// API 요청 전송 함수
export async function callTwitchApi<T>(endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
  try {
    const token = await getTwitchToken();
    const clientId = process.env.TWITCH_CLIENT_ID;
    
    const response = await twitchApiClient.get<T>(endpoint, {
      params,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': clientId as string
      }
    });
    
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(`Twitch API 호출 실패: ${endpoint}`, axiosError.response?.data || axiosError.message);
    throw new Error(`Twitch API 호출 실패: ${axiosError.message}`);
  }
}

interface TwitchResponse<T> {
  data: T[];
  pagination?: {
    cursor?: string;
  };
}

// 페이지네이션 처리된 모든 결과 가져오는 함수
export async function fetchAllPages<T>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {}
): Promise<T[]> {
  let results: T[] = [];
  let cursor: string | null = null;
  
  do {
    const queryParams = { ...params };
    if (cursor) {
      queryParams.after = cursor;
    }
    
    const response = await callTwitchApi<TwitchResponse<T>>(endpoint, queryParams);
    
    if (response.data && response.data.length > 0) {
      results = [...results, ...response.data];
    }
    
    cursor = response.pagination?.cursor || null;
  } while (cursor);
  
  return results;
}