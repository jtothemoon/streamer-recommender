import { useState, useEffect, useCallback, useRef } from 'react';

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

// 클라이언트 캐싱 - 메모리 내 싱글톤으로 유지
const globalCache: Record<string, { 
  data: Record<string, StreamStatus>, 
  timestamp: number 
}> = {};
const CACHE_TTL = 2 * 60 * 1000; // 2분

// 배치 요청 관리 최적화
const pendingFetches: Record<string, Promise<Record<string, StreamStatus>>> = {};

export function useTwitchLiveStatus(twitchIds: string[]): UseTwitchLiveStatusResult {
  const [status, setStatus] = useState<Record<string, StreamStatus> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 마운트 상태 추적
  const isMounted = useRef(true);
  
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
      if (globalCache[twitchIdsKey] && now - globalCache[twitchIdsKey].timestamp < CACHE_TTL) {
        setStatus(globalCache[twitchIdsKey].data);
        setLoading(false);
        return;
      }
      
      // 이미 진행 중인 요청이 있는지 확인 (중복 요청 방지)
      if (twitchIdsKey in pendingFetches) {
        const result = await pendingFetches[twitchIdsKey];
        if (isMounted.current) {
          setStatus(result);
          setLoading(false);
        }
        return;
      }
      
      // 새 요청 생성 및 pending 목록에 추가
      const fetchPromise = (async () => {
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
        globalCache[twitchIdsKey] = {
          data,
          timestamp: now
        };
        
        // pending 목록에서 제거
        delete pendingFetches[twitchIdsKey];
        
        return data;
      })();
      
      // pending 목록에 추가
      pendingFetches[twitchIdsKey] = fetchPromise;
      
      // 결과 처리
      const result = await fetchPromise;
      
      if (isMounted.current) {
        setStatus(result);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('알 수 없는 오류'));
        console.error('트위치 라이브 상태 조회 실패:', err);
      }
      
      // 오류 발생 시 pending 목록에서 제거
      delete pendingFetches[twitchIdsKey];
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [twitchIds, twitchIdsKey]);

  // 컴포넌트 마운트/언마운트 관리
  useEffect(() => {
    isMounted.current = true;
    
    fetchStatus();
    
    // 자동 갱신 간격 설정
    const intervalId = setInterval(() => {
      if (status && Object.values(status).some(s => s.isLive)) {
        // 라이브 중인 스트리머가 있을 때만 더 자주 갱신
        fetchStatus();
      }
    }, CACHE_TTL);
    
    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
    };
  }, [fetchStatus, status]);

  // 수동 갱신 함수
  const refetch = useCallback(async () => {
    // 캐시 무효화 후 다시 가져오기
    if (twitchIdsKey in globalCache) {
      delete globalCache[twitchIdsKey];
    }
    await fetchStatus();
  }, [fetchStatus, twitchIdsKey]);

  return { status, loading, error, refetch };
}