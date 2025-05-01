import dotenv from 'dotenv';
import { getTopGames, getTopStreamersByGame, getUsersByIds } from './utils/streamers';

dotenv.config();

async function testTwitchApi() {
  try {
    console.log('트위치 API 테스트 시작...');
    
    // 1. 인기 게임 목록 가져오기
    console.log('인기 게임 목록 가져오는 중...');
    const topGames = await getTopGames(5);
    console.log('인기 게임 5개:');
    topGames.forEach((game, index) => {
      console.log(`${index + 1}. ${game.name} (ID: ${game.id})`);
    });
    
    if (topGames.length > 0) {
      // 2. 첫 번째 게임의 인기 스트리머 가져오기
      const gameId = topGames[0].id;
      console.log(`\n"${topGames[0].name}" 게임의 인기 스트리머 가져오는 중...`);
      const topStreamers = await getTopStreamersByGame(gameId, 5);
      
      console.log(`"${topGames[0].name}" 인기 스트리머 5명:`);
      topStreamers.forEach((stream, index) => {
        console.log(`${index + 1}. ${stream.user_name} (ID: ${stream.user_id}) - 시청자: ${stream.viewer_count}명`);
      });
      
      // 3. 스트리머 상세 정보 가져오기
      if (topStreamers.length > 0) {
        const userIds = topStreamers.map(stream => stream.user_id);
        console.log('\n스트리머 상세 정보 가져오는 중...');
        const userDetails = await getUsersByIds(userIds);
        
        console.log('스트리머 상세 정보:');
        userDetails.forEach((user, index) => {
          console.log(`${index + 1}. ${user.display_name}`);
          console.log(`   - 설명: ${user.description.substring(0, 100)}${user.description.length > 100 ? '...' : ''}`);
          console.log(`   - 프로필 이미지: ${user.profile_image_url}`);
          console.log(`   - 총 조회수: ${user.view_count}`);
          console.log(`   - 계정 생성일: ${user.created_at}`);
          console.log('');
        });
      }
    }
    
    console.log('트위치 API 테스트 완료!');
  } catch (error) {
    console.error('테스트 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행될 때만 테스트 함수 호출
if (require.main === module) {
  testTwitchApi();
}