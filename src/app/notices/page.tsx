"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Notice {
  id: string;
  title: string;
  content: string;
  is_important: boolean;
  created_at: string;
  updated_at: string;
  published_at: string;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("is_important", { ascending: false })
        .order("published_at", { ascending: false });
      
      if (error) {
        console.error("공지사항 로딩 오류:", error);
      } else {
        setNotices(data || []);
      }
      
      setLoading(false);
    };
    
    fetchNotices();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📢 공지사항</h1>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner text="공지사항 로딩 중..." size="default" />
        </div>
      ) : notices.length > 0 ? (
        <div className="space-y-4">
          {notices.map((notice) => (
            <Link 
              href={`/notices/${notice.id}`} 
              key={notice.id}
              className="block"
            >
              <div className={`p-4 rounded-lg border ${
                notice.is_important 
                  ? 'border-[var(--primary)] bg-[var(--background-soft)]' 
                  : 'border-[var(--border-color)]'
              } hover:shadow-md transition-shadow`}>
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold">
                    {notice.is_important && (
                      <span className="text-[var(--primary)] mr-2">중요</span>
                    )}
                    {notice.title}
                  </h2>
                  <span className="text-sm text-[var(--foreground-soft)]">
                    {new Date(notice.published_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-[var(--foreground-soft)]">
            등록된 공지사항이 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}