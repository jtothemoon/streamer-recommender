"use client";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  
  return (
    // 베타 배너(32px) + 헤더(72px)의 총 높이만큼 패딩 적용
    <div className="pt-[104px]">
      {children}
    </div>
  );
}