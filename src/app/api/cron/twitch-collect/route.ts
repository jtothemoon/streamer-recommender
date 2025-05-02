import { NextResponse } from 'next/server';
import { discoverTwitchStreamers } from '@/scripts/twitch/discoverTwitchStreamers';
import { truncateTwitchTables } from '@/scripts/twitch/utils/truncateTables';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5분 (Vercel의 Hobby 플랜 제한)

export async function GET(request: Request) {
  try {
    // 인증 확인 (선택 사항)
    const { searchParams } = new URL(request.url);
    const authToken = searchParams.get('token');
    
    // 간단한 인증 확인 (더 복잡한 방식으로 변경 가능)
    if (process.env.CRON_SECRET && authToken !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }
    
    // 테이블 비우기
    await truncateTwitchTables();
    
    // 스트리머 데이터 수집
    await discoverTwitchStreamers();
    
    return NextResponse.json({ success: true, message: '트위치 스트리머 수집 완료' });
  } catch (error) {
    console.error('트위치 스트리머 수집 실패:', error);
    return NextResponse.json(
      { error: '트위치 스트리머 수집 실패', details: error },
      { status: 500 }
    );
  }
}