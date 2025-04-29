import React from 'react';

const BetaBanner = () => {
  return (
    <div className="bg-blue-500 dark:bg-blue-600 text-white text-center py-2 px-4 text-sm">
      <span className="font-medium">🚀 베타 서비스 진행 중</span>
      <span className="hidden sm:inline"> - 현재 스트리머 데이터를 수집하고 있습니다. 더 많은 추천이 곧 추가될 예정입니다.</span>
    </div>
  );
};

export default BetaBanner;