'use client';

import { useEffect, useState } from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  // 초기 상태를 null로 설정해 서버와 클라이언트 불일치 방지
  const [topPadding, setTopPadding] = useState<string | null>(null);
  
  // 컴포넌트 마운트 시와 localStorage 변경 시 패딩 조정
  useEffect(() => {
    const checkBannerStatus = () => {
      const bannerClosed = localStorage.getItem('betaBannerClosed') === 'true';
      setTopPadding(bannerClosed ? 'pt-[72px]' : 'pt-[104px]');
    };
    
    // 초기 체크
    checkBannerStatus();
    
    // storage 이벤트 리스너 추가
    window.addEventListener('storage', checkBannerStatus);
    
    // 커스텀 이벤트 리스너 추가 (BetaBanner에서 발생시킴)
    window.addEventListener('bannerClosed', checkBannerStatus);
    
    return () => {
      window.removeEventListener('storage', checkBannerStatus);
      window.removeEventListener('bannerClosed', checkBannerStatus);
    };
  }, []);
  
  // 초기 상태는 배너가 있다고 가정해 최대 패딩으로 설정 (깜빡임 방지)
  const paddingClass = topPadding === null ? 'pt-[104px]' : topPadding;
  
  return (
    <main className={`w-full min-h-screen ${paddingClass} pb-8 px-4 md:px-8 lg:px-16 transition-all duration-300`}>
      {children}
    </main>
  );
}