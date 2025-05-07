'use client';

import { useEffect } from 'react';

export default function ServiceClosedNotice() {
  // 페이지 로드 시 스크롤 막기
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl text-center">
        <h2 className="text-2xl font-bold mb-4 text-[var(--foreground-strong)]">서비스 종료 안내</h2>
        <p className="mb-6 text-[var(--foreground)]">
          안녕하세요, Spick을 이용해 주셔서 감사합니다.
          <br /><br />
          서비스가 종료되었습니다. 그동안 이용해 주셔서 감사합니다.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => window.location.href = 'https://github.com/jtothemoon/streamer-recommender'}
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold py-2 px-4 rounded transition-colors"
          >
            GitHub 방문하기
          </button>
        </div>
      </div>
    </div>
  );
}