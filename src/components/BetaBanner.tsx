'use client';

import { useEffect } from 'react';
import { useBannerStore } from '@/store/bannerStore';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function BetaBanner() {
  const { isBannerVisible, setBannerVisible } = useBannerStore();

  useEffect(() => {
    const closed = localStorage.getItem('betaBannerClosed') === 'true';
    setBannerVisible(!closed);
  }, [setBannerVisible]);

  if (!isBannerVisible) return null;

  const closeBanner = () => {
    localStorage.setItem('betaBannerClosed', 'true');
    setBannerVisible(false);
  };

  return (
    <div className="w-full bg-[#00C7AE] text-white py-1 px-4 flex justify-between items-center text-sm">
      <div className="flex-grow text-center">
        🚀 베타 서비스 진행 중
        <span className="hidden md:inline">
          {' '} - 현재 스트리머 데이터를 수집하고 있습니다. 더 많은 추천이 곧 추가될 예정입니다.
        </span>
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