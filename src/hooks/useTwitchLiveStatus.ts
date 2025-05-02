import { useState, useEffect, useCallback } from 'react';

// 라이브 상태 타입 정의
interface StreamStatus {
  isLive: boolean;
  viewerCount: number | null;
  title: string | null;
  gameName: string | null;
  thumbnailUrl: string | null;
  startedAt: string | null;
}

// 결과 타입
interface UseTwitchLiveStatusResult {
  status: Record<string, StreamStatus> | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// 클라이언트 캐싱
const cache: Record<string, { 
  data: Record<string, StreamStatus>, 
  timestamp: number 
}> = {};
const CACHE_TTL = 2 * 60 * 1000; // 2분

export function useTwitchLiveStatus(twitchIds: string[]): UseTwitchLiveStatusResult {
  const [status, setStatus] = useState<Record<string, StreamStatus> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 트위치 ID 배열을 문자열로 변환 (의존성 배열용)
  const twitchIdsKey = twitchIds.sort().join(',');

  const fetchStatus = useCallback(async () => {
    if (!twitchIds.length) {
      setStatus({});
      return;
    }

    try {
      setLoading(true);
      
      // 캐시 확인
      const now = Date.now();
      if (cache[twitchIdsKey] && now - cache[twitchIdsKey].timestamp < CACHE_TTL) {
        setStatus(cache[twitchIdsKey].data);
        setLoading(false);
        return;
      }
      
      // API 호출
      const response = await fetch('/api/twitch/live-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ twitchIds }),
      });
      
      if (!response.ok) {
        throw new Error('트위치 라이브 상태 조회 실패');
      }
      
      const data = await response.json();
      
      // 캐시 업데이트
      cache[twitchIdsKey] = {
        data,
        timestamp: now
      };
      
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알 수 없는 오류'));
      console.error('트위치 라이브 상태 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [twitchIds, twitchIdsKey]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // 수동 갱신 함수
  const refetch = async () => {
    await fetchStatus();
  };

  return { status, loading, error, refetch };
}