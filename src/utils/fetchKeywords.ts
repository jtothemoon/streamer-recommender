import { supabase } from "@/lib/supabaseClient";
import { Keyword } from "@/types/keywords";

export async function fetchKeywords(): Promise<Keyword[]> {
  const { data, error } = await supabase
    .from("keywords")
    .select("*")
    .eq("type", "game_title")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("❌ 키워드 가져오기 실패:", error.message);
    return [];
  }

  return data || [];
}