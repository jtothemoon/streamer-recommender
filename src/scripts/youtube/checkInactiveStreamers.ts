// src/scripts/youtube/checkInactiveStreamers.ts
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getChannelDetails } from "./utils/channels";

/**
 * 유튜브 스트리머 활성 상태 체크 스크립트
 * 
 * 용도: 
 * 1. 최근 1주일간 영상을 업로드하지 않은 유튜브 스트리머를 비활성화(is_active=false)로 표시
 * 2. 비활성 상태인 스트리머 중 최근 활동이 재개된 스트리머를 다시 활성화
 * 
 * 실행 방법:
 * npx ts-node --project tsconfig.scripts.json src/scripts/youtube/checkInactiveStreamers.ts
 * 
 * 옵션:
 * --check-inactive-only: 비활성화 체크만 수행 (재활성화 체크 건너뜀)
 * --check-reactive-only: 재활성화 체크만 수행 (비활성화 체크 건너뜀)
 */
async function checkInactiveStreamers() {
  // 환경변수 설정
  dotenv.config();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 커맨드라인 인자 파싱
  const args = process.argv.slice(2);
  const checkInactiveOnly = args.includes("--check-inactive-only");
  const checkReactiveOnly = args.includes("--check-reactive-only");

  console.log("🔍 유튜브 스트리머 활성 상태 체크 시작...");

  // 기본적으로 양쪽 모두 체크, 아니면 인자에 따라 선택적으로 체크
  const shouldCheckInactive = !checkReactiveOnly || checkInactiveOnly;
  const shouldCheckReactive = !checkInactiveOnly || checkReactiveOnly;

  // 1. 비활성화 처리 - 최근 1주일 이상 영상 업로드 없는 스트리머 체크
  if (shouldCheckInactive) {
    console.log("\n📅 비활성 스트리머 체크 시작 (1주일 기준)...");
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString();

    const { data: inactiveStreamers, error: queryError } = await supabase
      .from("youtube_streamers")
      .select("id, name, latest_uploaded_at")
      .lt("latest_uploaded_at", oneWeekAgoStr)
      .eq("is_active", true);

    if (queryError) {
      console.error("❌ 비활성 스트리머 조회 실패:", queryError);
      throw queryError;
    }

    console.log(`ℹ️ 1주일 이상 업로드 없는 스트리머 수: ${inactiveStreamers?.length || 0}`);

    // 비활성화 처리
    if (inactiveStreamers && inactiveStreamers.length > 0) {
      const inactiveStreamerIds = inactiveStreamers.map(s => s.id);
      
      const { error: updateError } = await supabase
        .from("youtube_streamers")
        .update({ is_active: false })
        .in("id", inactiveStreamerIds);

      if (updateError) {
        console.error("❌ 비활성 처리 실패:", updateError);
        throw updateError;
      }

      console.log(`✅ ${inactiveStreamers.length}개 채널 비활성화 처리 완료`);
      inactiveStreamers.forEach(s => {
        console.log(`  - ${s.name} (마지막 업로드: ${new Date(s.latest_uploaded_at).toLocaleDateString()})`);
      });
    } else {
      console.log("✅ 모든 스트리머가 활성 상태입니다.");
    }
  }

  // 2. 재활성화 처리 - 비활성 상태지만 최근 활동이 재개된 스트리머 체크
  if (shouldCheckReactive) {
    console.log("\n🔄 비활성 스트리머 재활성화 검사 시작...");
    
    const { data: currentInactiveStreamers, error: inactiveError } = await supabase
      .from("youtube_streamers")
      .select("id, youtube_channel_id, name")
      .eq("is_active", false);
      
    if (inactiveError) {
      console.error("❌ 비활성 스트리머 조회 실패:", inactiveError);
      throw inactiveError;
    }

    console.log(`ℹ️ ${currentInactiveStreamers?.length || 0}명의 비활성 스트리머 검사 시작`);
    
    let reactivatedCount = 0;
    
    if (currentInactiveStreamers && currentInactiveStreamers.length > 0) {
      for (const streamer of currentInactiveStreamers) {
        console.log(`🔍 체크 중: ${streamer.name} (${streamer.youtube_channel_id})`);
        
        // 채널 최신 정보 확인
        const channelDetails = await getChannelDetails(streamer.youtube_channel_id);
        
        if (channelDetails.success && channelDetails.data) {
          const { latestUploadDate } = channelDetails.data;
          
          // 최근 업로드가 있으면 활성화 (getChannelDetails에서 이미 1개월 기준 검증)
          // 채널 정보도 함께 업데이트
          const { error: updateError } = await supabase
            .from("youtube_streamers")
            .update({ 
              is_active: true,
              latest_uploaded_at: latestUploadDate.toISOString(),
              subscribers: channelDetails.data.subscribers,
              updated_at: new Date().toISOString()
            })
            .eq("id", streamer.id);
            
          if (!updateError) {
            console.log(`✅ 재활성화: ${streamer.name} (최근 업로드: ${latestUploadDate.toLocaleDateString()})`);
            reactivatedCount++;
          } else {
            console.error(`❌ 재활성화 실패: ${streamer.name}`, updateError);
          }
        } else {
          console.log(`⏩ 활동 없음: ${streamer.name} (${channelDetails.message || "채널 정보 없음"})`);
        }
        
        // API 할당량 고려 간단한 딜레이
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      
      console.log(`🔄 총 ${reactivatedCount}명의 스트리머 재활성화 완료`);
    } else {
      console.log("ℹ️ 비활성 상태인 스트리머가 없습니다.");
    }
  }

  console.log("🎉 유튜브 스트리머 활성 상태 체크 완료!");
}

// 직접 실행 시
if (require.main === module) {
  checkInactiveStreamers().catch((err) => {
    console.error("❌ 스크립트 실행 오류:", err);
    process.exit(1);
  });
}

export { checkInactiveStreamers };