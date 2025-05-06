"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileMenu from "./MobileMenu";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNoticeStore } from "@/store/noticeStore";

export default function Header() {
  const router = useRouter();
  
  // Zustand 스토어에서 값과 함수 가져오기
  const { hasUnreadNotices, readNoticeIds, setHasUnreadNotices, updateLatestNoticeDate } = useNoticeStore();

  // 읽지 않은 공지사항 확인
  useEffect(() => {
    const checkUnreadNotices = async () => {
      try {
        // 최신 공지사항 가져오기
        const { data, error } = await supabase
          .from("notices")
          .select("id, published_at")
          .order("published_at", { ascending: false })
          .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const latestNotice = data[0];
          
          // 최신 공지 날짜 저장
          updateLatestNoticeDate(latestNotice.published_at);
          
          // 읽지 않은 공지사항이 있는지 확인
          const isUnread = !readNoticeIds.includes(latestNotice.id);
          setHasUnreadNotices(isUnread);
        }
      } catch (err) {
        console.error("공지사항 확인 오류:", err);
      }
    };
    
    checkUnreadNotices();
  }, [readNoticeIds, setHasUnreadNotices, updateLatestNoticeDate]);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/");
    location.replace("/");
  };

  // 링크 정보 - hasUnreadNotices 상태에 따라 Notice에 배지 표시
  const navLinks = [
    { href: "/notices", label: "Notice", hasBadge: hasUnreadNotices },
    { href: "/favorites", label: "Favorites", hasBadge: false },
    { href: "/about", label: "About", hasBadge: false }
  ];

  return (
    <header className="w-full p-4 flex justify-between items-center bg-[var(--background)] text-[var(--foreground)] shadow-sm">
      <Link
        href="/"
        onClick={handleLogoClick}
        className="text-2xl font-bold hover:text-[#00C7AE] transition-colors"
      >
        Spick
      </Link>
      
      {/* 데스크톱 메뉴 */}
      <nav className="hidden md:flex gap-4 text-sm">
        {navLinks.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className="hover:text-[#00C7AE] transition-colors relative"
          >
            {link.label}
            {link.hasBadge && (
              <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </Link>
        ))}
      </nav>
      
      {/* 모바일 메뉴 */}
      <MobileMenu links={navLinks} />
    </header>
  );
}