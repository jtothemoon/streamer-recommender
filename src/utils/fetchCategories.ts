import { supabase } from "@/lib/supabaseClient";
import { YoutubeGameCategory } from "@/types/youtube";

/**
 * 유튜브 게임 카테고리 목록을 가져오는 함수
 * 
 * @returns 게임 카테고리 배열
 */
export async function fetchCategories(): Promise<YoutubeGameCategory[]> {
  const { data, error } = await supabase
    .from("youtube_game_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("게임 카테고리 가져오기 실패:", error);
    return [];
  }

  return data || [];
}