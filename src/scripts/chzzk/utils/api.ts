import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// 환경 변수
const CHZZK_CLIENT_ID = process.env.CHZZK_CLIENT_ID!;
const CHZZK_CLIENT_SECRET = process.env.CHZZK_CLIENT_SECRET!;

/**
 * 치지직 API 호출 유틸리티 함수
 */
export async function callChzzkApi<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  try {
    const response = await axios.get(`https://api.chzzk.naver.com${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'x-naver-client-id': CHZZK_CLIENT_ID,
        'x-naver-client-secret': CHZZK_CLIENT_SECRET,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://chzzk.naver.com/'
      },
      params
    });
    
    return response.data as T;
  } catch (error) {
    console.error(`치지직 API 호출 실패 (${endpoint}):`, error);
    throw error;
  }
}