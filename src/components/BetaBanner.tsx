'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function BetaBanner() {
  // 초기 상태를 null로 설정해 서버와 클라이언트 불일치 방지
  const [isVisible, setIsVisible] = useState<boolean | null>(null);
  
  // 컴포넌트 마운트 시 localStorage에서 상태 확인
  useEffect(() => {
    const bannerClosed = localStorage.getItem('betaBannerClosed');
    setIsVisible(bannerClosed !== 'true');
  }, []);
  
  const closeBanner = () => {
    setIsVisible(false);
    localStorage.setItem('betaBannerClosed', 'true');
    // 다른 탭에도 변경을 알리기 위한 이벤트 발생
    window.dispatchEvent(new Event('bannerClosed'));
  };
  
  // 초기 렌더링(서버 사이드)에서는 아무것도 표시하지 않음
  if (isVisible === null) {
    return null;
  }
  
  // 클라이언트 사이드에서 확인 후 보여주지 않음
  if (isVisible === false) {
    return null;
  }
  
  return (
    <div className="w-full bg-[#00C7AE] text-white py-1 px-4 flex justify-between items-center text-sm">
      <div className="flex-grow text-center">
        🚀 베타 서비스 진행 중
        <span className="hidden md:inline"> - 현재 스트리머 데이터를 수집하고 있습니다. 더 많은 추천이 곧 추가될 예정입니다.</span>
      </div>
      <button 
        onClick={closeBanner}
        className="text-white hover:text-gray-200 transition-colors"
        aria-label="베타 배너 닫기"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}