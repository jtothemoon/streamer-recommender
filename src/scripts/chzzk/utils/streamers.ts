import { callChzzkApi } from './api';

// 타입 정의
// 치지직 채널 타입
export interface ChzzkChannel {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  verifiedMark: boolean;
  activatedChannelBadgeIds: string[];
}

// 치지직 라이브 전체 데이터 타입
export interface ChzzkLiveData {
  liveId: string;
  liveTitle: string;
  liveImageUrl: string | null;
  defaultThumbnailImageUrl: string | null;
  concurrentUserCount: number;
  accumulateCount: number;
  openDate: string;
  adult: boolean;
  tags: string[];
  categoryType: string;
  liveCategory: string; 
  liveCategoryValue: string;
  channel: ChzzkChannel;
  blindType: null | string;
}

// 게임 카테고리 타입
export interface ChzzkGame {
  id: string;
  name: string;
  displayName?: string;
}

// API 응답 타입
interface ChzzkApiResponse {
  code: number;
  message: string | null;
  content: {
    size: number;
    page: {
      next: {
        concurrentUserCount: number;
        liveId: number;
      } | null;
    };
    data: ChzzkLiveData[];
  };
}

/**
 * 치지직 라이브 스트리머 가져오기
 */
export async function getLiveStreamers(limit: number = 50): Promise<ChzzkLiveData[]> {
  const result: ChzzkLiveData[] = [];
  let nextCursor: {concurrentUserCount: number, liveId: number} | null = null;
  
  try {
    while (result.length < limit) {
      const params: Record<string, string | number> = {};
      
      // 페이지네이션 처리 - next 객체의 값들을 파라미터로 전달
      if (nextCursor) {
        params.concurrentUserCount = nextCursor.concurrentUserCount;
        params.liveId = nextCursor.liveId;
      }
      
      const response = await callChzzkApi<ChzzkApiResponse>('/service/v1/lives', params);
      
      if (response.code !== 200) {
        throw new Error(`API 오류: ${response.message}`);
      }
      
      const liveData = response.content?.data || [];
      nextCursor = response.content?.page?.next;
      
      result.push(...liveData);
      
      // 로그
      console.log(`스트리머 ${result.length}/${limit} 조회 중...`);
      
      // 결과가 없거나 페이지네이션이 끝났으면 종료
      if (liveData.length === 0 || !nextCursor) {
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