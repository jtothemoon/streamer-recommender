import { NextResponse } from "next/server";
import { searchAndSaveStreamers } from "@/scripts/youtube/old/searchAndSaveStreamers";
import { linkStreamersToKeywords } from "@/scripts/youtube/linkStreamersToKeywords";

export async function GET() {
  try {
    console.log("🚀 Cron 시작: 스트리머 수집 및 키워드 매핑");

    await searchAndSaveStreamers();
    await linkStreamersToKeywords();

    return NextResponse.json({ message: "Cron 작업 완료" });
  } catch (error) {
    console.error("❌ Cron 작업 실패:", error);
    return NextResponse.json({ message: "오류 발생" }, { status: 500 });
  }
}
