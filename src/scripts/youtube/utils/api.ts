import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// API 요청 기본 설정
const youtubeApiClient = axios.create({
  baseURL: 'https://www.googleapis.com/youtube/v3',
  headers: {
    'Content-Type': 'application/json'
  }
});

// API 요청 전송 함수
export async function callYoutubeApi<T>(
  endpoint: string, 
  params: Record<string, string | number | boolean> = {}
): Promise<T> {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      throw new Error('YouTube API 키가 없습니다. .env 파일을 확인하세요.');
    }
    
    const response = await youtubeApiClient.get<T>(endpoint, {
      params: {
        ...params,
        key: apiKey
      }
    });
    
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(`YouTube API 호출 실패: ${endpoint}`, axiosError.response?.data || axiosError.message);
    throw new Error(`YouTube API 호출 실패: ${axiosError.message}`);
  }
}