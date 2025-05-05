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

  return (
    <header className="w-full p-4 flex justify-between items-center bg-[var(--background)] text-[var(--foreground)] shadow-sm">
      <Link
        href="/"
        onClick={handleLogoClick}
        className="text-2xl font-bold hover:text-[#00C7AE] transition-colors"
      >
        Spick
      </Link>
      <nav className="flex gap-4 text-sm">
        <Link
          href="/favorites"
          className="hover:text-[#00C7AE] transition-colors"
        >
          Favorites
        </Link>
        <Link href="/about" className="hover:text-[#00C7AE] transition-colors">
          About
        </Link>
      </nav>
    </header>
  );
}
