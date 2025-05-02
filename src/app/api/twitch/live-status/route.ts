import { NextResponse } from 'next/server';
import { callTwitchApi } from '@/scripts/twitch/utils/api';
import { TwitchStream } from '@/scripts/twitch/utils/streamers';

// 캐싱 설정
const cache: Record<string, {data: Record<string, unknown>, timestamp: number}> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5분

export async function POST(request: Request) {
  try {
    const { twitchIds } = await request.json();
    
    if (!twitchIds || !Array.isArray(twitchIds) || twitchIds.length === 0) {
      return NextResponse.json(
        { error: '트위치 ID 배열이 필요합니다' },
        { status: 400 }
      );
    }

    // 캐시 키 생성
    const cacheKey = twitchIds.sort().join(',');
    const now = Date.now();
    
    // 캐시 확인
    if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
      return NextResponse.json(cache[cacheKey].data);
    }

    // 트위치 API 호출 (파라미터 수정)
    const params: Record<string, string> = {};
    twitchIds.forEach((id, index) => {
      params[`user_id${index > 0 ? `[${index}]` : ''}`] = id;
    });
    
    const response = await callTwitchApi<{data: TwitchStream[]}>('/streams', params);

    const liveStreams = response.data || [];
    
    // 결과 가공
    const result = twitchIds.reduce((acc: Record<string, unknown>, id: string) => {
      const stream = liveStreams.find(s => s.user_id === id);
      
      acc[id] = {
        isLive: !!stream,
        viewerCount: stream?.viewer_count || null,
        title: stream?.title || null,
        gameName: stream?.game_name || null,
        thumbnailUrl: stream?.thumbnail_url || null,
        startedAt: stream?.started_at || null
      };
      
      return acc;
    }, {});

    // 캐시 업데이트
    cache[cacheKey] = {
      data: result,
      timestamp: now
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('트위치 라이브 상태 조회 오류:', error);
    return NextResponse.json(
      { error: '트위치 API 호출 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}