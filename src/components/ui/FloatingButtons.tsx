// src/components/ui/FloatingButtons.tsx 수정
'use client';

import { useState, useEffect } from 'react';
import { ChevronUpIcon, MoonIcon, SunIcon, XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/solid';
import { useThemeStore } from '@/store/themeStore';
import Toast from './Toast';

export default function FloatingButtons() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  // HTML에 다크모드 클래스 적용
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 스크롤 위치에 따라 상단으로 버튼 표시/숨김
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  // 공통 버튼 스타일
  const buttonStyle = "w-12 h-12 bg-[#00C7AE] hover:bg-[#00b19c] text-white rounded-full shadow-lg flex items-center justify-center transition-colors cursor-pointer";
  
  return (
    <>
      {/* 왼쪽 하단 메뉴 버튼 */}
      <div className="fixed bottom-6 left-6 flex flex-col gap-3 z-50">
        {/* 메뉴 버튼 클릭 시 표시되는 옵션들 */}
        {isMenuOpen && (
          <>
            {/* 다크모드 토글 */}
            <button
              onClick={() => {
                toggleDarkMode();
                setIsMenuOpen(false); // 버튼 클릭 후 메뉴 닫기
              }}
              className={`${buttonStyle} mb-3`}
              aria-label={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {isDarkMode ? (
                <SunIcon className="w-6 h-6" />
              ) : (
                <MoonIcon className="w-6 h-6" />
              )}
            </button>

            {/* 구글폼 링크 (준비 중) */}
            <button
              onClick={() => {
                showToast('피드백 기능은 현재 준비 중입니다.');
                setIsMenuOpen(false); // 버튼 클릭 후 메뉴 닫기
              }}
              className={`${buttonStyle} mb-3`}
              aria-label="피드백 남기기"
            >
              <DocumentTextIcon className="w-6 h-6" />
            </button>

            {/* 메뉴 닫기 버튼 */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className={buttonStyle}
              aria-label="메뉴 닫기"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </>
        )}

        {/* 메인 메뉴 토글 버튼 */}
        {!isMenuOpen && (
          <button
            onClick={toggleMenu}
            className={buttonStyle}
            aria-label="메뉴 열기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>

      {/* 오른쪽 하단 상단으로 버튼 */}
      {isVisible && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-6 right-6 ${buttonStyle}`}
        >
          <ChevronUpIcon className="w-6 h-6" />
        </button>
      )}

      {/* 토스트 메시지 */}
      <Toast 
        message={toastMessage} 
        isVisible={toastVisible} 
        onClose={() => setToastVisible(false)} 
      />
    </>
  );
}