import { callChzzkApi } from './api';

// 타입 정의
export interface ChzzkStream {
  liveId: string;
  liveTitle: string;
  status: string;
  concurrentUserCount: number;
  openDate: string;
  liveCategory: {
    categoryType: string;
    categoryId: string;
    categoryName: string;
  };
  thumbnail: {
    thumbnailImageUrl: string;
  };
}

export interface ChzzkChannel {
  channelId: string;
  channelName: string;
  channelImageUrl: string;
  channelDescription: string;
  followerCount: number;
}

export interface ChzzkLiveChannel {
  channel: ChzzkChannel;
  live: ChzzkStream;
}

export interface ChzzkGame {
  id: string;
  name: string;
  displayName?: string;
}

/**
 * 치지직 라이브 스트리머 가져오기
 */
export async function getLiveStreamers(limit: number = 50): Promise<ChzzkLiveChannel[]> {
  const result: ChzzkLiveChannel[] = [];
  let nextCursor: string | null = '';
  
  try {
    while (nextCursor !== null && result.length < limit) {
      const params: Record<string, string> = {};
      if (nextCursor && nextCursor !== '') {
        params.next = nextCursor;
      }

      interface ChzzkApiResponse {
        code: number;
        message: string;
        content: {
          streamingList: ChzzkLiveChannel[];
          page: {
            next: string | null;
          };
        };
      }
      
      const response = await callChzzkApi<ChzzkApiResponse>('/service/v1/lives', params);
      
      if (response.code !== 200) {
        throw new Error(`API 오류: ${response.message}`);
      }
      
      const streamingList = response.content?.streamingList || [];
      const nextPage = response.content?.page?.next || null;
      
      result.push(...streamingList);
      nextCursor = nextPage;
      
      // 로그
      console.log(`스트리머 ${result.length}/${limit} 조회 중...`);
      
      // 결과가 없거나 페이지네이션이 끝났으면 종료
      if (streamingList.length === 0 || !nextCursor) {
        break;
      }
    }
    
    // 제한된 수만큼 반환
    return result.slice(0, limit);
  } catch (error) {
    console.error('치지직 라이브 스트리머 조회 실패:', error);
    return [];
  }
}