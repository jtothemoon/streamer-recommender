"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { supabase } from "@/lib/supabaseClient";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useNoticeStore } from "@/store/noticeStore";

interface Notice {
  id: string;
  title: string;
  content: string;
  is_important: boolean;
  created_at: string;
  updated_at: string;
  published_at: string;
}

export default function NoticeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const markAsRead = useNoticeStore(state => state.markAsRead);

  useEffect(() => {
    const fetchNotice = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("공지사항 로딩 오류:", error);
        setError(true);
        setLoading(false);
        return;
      }

      setNotice(data as Notice);
      markAsRead(id);
      setLoading(false);
    };

    if (id) {
      fetchNotice();
    }
  }, [id, markAsRead]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex justify-center py-10">
        <LoadingSpinner text="공지사항 로딩 중..." size="default" />
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-10">
        <p className="text-[var(--foreground-soft)] mb-4">
          공지사항을 찾을 수 없습니다.
        </p>
        <Link
          href="/notices"
          className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
        >
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href="/notices"
        className="flex items-center gap-1 text-sm mb-4 text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span>목록으로 돌아가기</span>
      </Link>

      <div className="bg-[var(--background-soft)] rounded-lg p-6 shadow-sm border border-[var(--border-color)]">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">
            {notice.is_important && (
              <span className="text-[var(--primary)] mr-2">중요</span>
            )}
            {notice.title}
          </h1>
          <span className="text-sm text-[var(--foreground-soft)]">
            {new Date(notice.published_at).toLocaleDateString()}
          </span>
        </div>

        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
          {notice.content}
        </div>
      </div>
    </div>
  );
}
