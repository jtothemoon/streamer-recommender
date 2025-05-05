import { NextResponse } from 'next/server';
import { callChzzkApi } from '@/scripts/chzzk/utils/api';

// 캐싱 설정
const cache: Record<string, {data: Record<string, unknown>, timestamp: number}> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5분

// 응답 타입 정의
interface ChzzkLiveResponse {
  code: number;
  message: string;
  content: {
    status: string;
    liveTitle: string;
    concurrentUserCount: number;
    liveCategory: {
      categoryName: string;
    };
    thumbnail: {
      thumbnailImageUrl: string;
    };
    openDate: string;
  } | null;
}

export async function POST(request: Request) {
  try {
    const { chzzkIds } = await request.json();
    
    if (!chzzkIds || !Array.isArray(chzzkIds) || chzzkIds.length === 0) {
      return NextResponse.json(
        { error: '치지직 ID 배열이 필요합니다' },
        { status: 400 }
      );
    }

    // 캐시 키 생성
    const cacheKey = chzzkIds.sort().join(',');
    const now = Date.now();
    
    // 캐시 확인
    if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
      return NextResponse.json(cache[cacheKey].data);
    }

    // 결과 객체 초기화
    const result: Record<string, unknown> = {};
    
    // 각 채널 ID에 대해 라이브 상태 조회
    for (const channelId of chzzkIds) {
      try {
        const response = await callChzzkApi<ChzzkLiveResponse>(`/service/v1/channels/${channelId}/live-detail`);
        
        if (response.code === 200 && response.content) {
          const liveInfo = response.content;
          
          result[channelId] = {
            isLive: liveInfo.status === 'OPEN',
            viewerCount: liveInfo.concurrentUserCount || 0,
            title: liveInfo.liveTitle || null,
            gameName: liveInfo.liveCategory?.categoryName || null,
            thumbnailUrl: liveInfo.thumbnail?.thumbnailImageUrl || null,
            startedAt: liveInfo.openDate || null
          };
        } else {
          // 라이브 중이 아닌 경우
          result[channelId] = {
            isLive: false,
            viewerCount: 0,
            title: null,
            gameName: null,
            thumbnailUrl: null,
            startedAt: null
          };
        }
      } catch (error) {
        console.error(`채널 ID ${channelId} 조회 실패:`, error);
        result[channelId] = {
          isLive: false,
          error: '조회 실패'
        };
      }
    }

    // 캐시 업데이트
    cache[cacheKey] = {
      data: result,
      timestamp: now
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('치지직 라이브 상태 조회 오류:', error);
    return NextResponse.json(
      { error: '치지직 API 호출 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}