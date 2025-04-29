"use client";

import { usePathname } from "next/navigation";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  return (
    <div className={isLandingPage ? "pt-0" : "pt-16"}>
      {children}
    </div>
  );
}