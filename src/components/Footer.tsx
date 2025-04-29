"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const showFooter = pathname === "/about";

  if (!showFooter) {
    return null;
  }

  return (
    <footer className="w-full py-2 mt-40 text-center text-[10px] text-gray-400 border-t border-gray-200 dark:border-gray-700">
      © 2025 Spick. Made by Jtothemoon.
    </footer>
  );
}
