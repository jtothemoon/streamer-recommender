import { callYoutubeApi } from './api';

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    categoryId: string;
  };
}

export interface YouTubeApiResponse<T> {
  items: T[];
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
}

// 비디오 정보 가져오기
export async function getVideoInfo(videoId: string): Promise<YouTubeApiResponse<YouTubeVideo>> {
  return callYoutubeApi<YouTubeApiResponse<YouTubeVideo>>('/videos', {
    part: 'snippet',
    id: videoId
  });
}

// 게임 채널 여부 확인
export async function isGameChannel(videoId: string): Promise<boolean> {
  try {
    const videoData = await getVideoInfo(videoId);
    
    if (!videoData.items?.length) {
      return false;
    }
    
    const categoryId = videoData.items[0].snippet.categoryId;
    return categoryId === "20"; // 20 = 게임 카테고리
  } catch (err) {
    console.error(`❌ 게임 채널 확인 실패: ${videoId}`, err);
    return false;
  }
}