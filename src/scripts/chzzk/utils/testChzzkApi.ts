// testChzzkApi.ts
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// 환경 변수
const CHZZK_CLIENT_ID = process.env.CHZZK_CLIENT_ID!;
const CHZZK_CLIENT_SECRET = process.env.CHZZK_CLIENT_SECRET!;

async function testApi() {
  try {
    console.log('치지직 API 테스트 시작...');
    console.log(`클라이언트 ID: ${CHZZK_CLIENT_ID.substring(0, 5)}...`);
    
    const response = await axios.get('https://api.chzzk.naver.com/service/v1/lives', {
      headers: {
        'Accept': 'application/json',
        'x-naver-client-id': CHZZK_CLIENT_ID,
        'x-naver-client-secret': CHZZK_CLIENT_SECRET
      }
    });
    
    console.log('응답 상태:', response.status);
    console.log('응답 데이터:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
  } catch (error) {
    console.error('API 테스트 실패:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // 서버가 응답을 반환한 경우
        console.log('응답 상태:', error.response.status);
        console.log('응답 데이터:', error.response.data);
      } else if (error.request) {
        // 요청은 이루어졌지만 응답을 받지 못한 경우
        console.log('요청이 이루어졌지만 응답이 없음');
      } else {
        // 요청 설정 중 오류가 발생한 경우
        console.log('요청 설정 오류:', error.message);
      }
    }
  }
}

testApi();