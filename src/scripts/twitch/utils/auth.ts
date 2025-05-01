import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface TwitchToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: TwitchToken | null = null;
let tokenExpiry: number = 0;

export async function getTwitchToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Twitch API 인증 정보가 없습니다. .env 파일을 확인하세요.');
  }
  
  const now = Date.now();
  
  // 토큰이 유효하면 캐시된 토큰 사용
  if (cachedToken && tokenExpiry > now) {
    return cachedToken.access_token;
  }
  
  // 새 토큰 발급
  try {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      }
    });
    
    cachedToken = response.data as TwitchToken;
    // 만료 시간 설정 (약간의 여유 시간 두기)
    tokenExpiry = now + (cachedToken.expires_in * 1000) - 300000;
    
    return cachedToken.access_token;
  } catch (error) {
    console.error('Twitch 토큰 발급 실패:', error);
    throw new Error(`트위치 토큰 발급 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}