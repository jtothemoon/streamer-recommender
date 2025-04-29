"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const router = useRouter();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/"); // Next.js 내비게이션
    location.replace("/"); // 강제 리로드로 쿼리스트링 제거
  };

  // 베타 배너 높이: 32px (py-1 = 8px * 2 + text size + padding)
  // 헤더 높이: 72px (p-4 = 16px * 2 + content height)
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* 베타 배너: 32px 높이 */}
      <div className="w-full bg-[#00C7AE] text-white py-1 px-4 text-center text-sm">
        🚀 베타 서비스 진행 중
        <span className="hidden md:inline"> - 현재 스트리머 데이터를 수집하고 있습니다. 더 많은 추천이 곧 추가될 예정입니다.</span>
      </div>
      
      {/* 헤더: 72px 높이 */}
      <header className="w-full p-4 flex justify-between items-center bg-white dark:bg-[#111111] shadow-sm">
        <Link
          href="/"
          onClick={handleLogoClick}
          className="text-2xl font-bold hover:text-[#00C7AE] transition-colors"
        >
          Spick
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/about" className="hover:text-[#00C7AE] transition-colors">
            About
          </Link>
        </nav>
      </header>
    </div>
  );
}