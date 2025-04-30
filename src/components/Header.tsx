'use client';

import { useRouter } from "next/navigation";
import Link from 'next/link';
import dynamic from 'next/dynamic';

// 클라이언트 컴포넌트를 dynamic import로 불러와 SSR 비활성화
const BetaBanner = dynamic(() => import('./BetaBanner'), { ssr: false });

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
      {/* 베타 배너 - 클라이언트 사이드에서만 렌더링 */}
      <BetaBanner />
      
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