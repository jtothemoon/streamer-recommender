'use client';

import { useState, useEffect } from 'react';

type ToastProps = {
  message: string;
  isVisible: boolean;
  onClose: () => void;
};

export default function Toast({ message, isVisible, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        // 페이드 아웃 시작
        setIsExiting(true);
        
        // 페이드 아웃 애니메이션 후 닫기
        setTimeout(() => {
          setIsExiting(false);
          onClose();
        }, 500); // 애니메이션 시간
      }, 2500); // 표시 시간
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-[#00C7AE] text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      {message}
    </div>
  );
}