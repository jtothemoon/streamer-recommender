import { supabase } from "@/lib/supabaseClient";
import { TwitchGameCategory } from "@/types/twitch";

/**
 * 트위치 게임 카테고리 목록을 가져오는 함수
 * 
 * @returns 게임 카테고리 배열
 */
export async function fetchTwitchCategories(): Promise<TwitchGameCategory[]> {
  const { data, error } = await supabase
    .from("twitch_game_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("트위치 게임 카테고리 가져오기 실패:", error);
    return [];
  }

  return data || [];
}