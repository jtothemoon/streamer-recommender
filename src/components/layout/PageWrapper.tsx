'use client';

import { useBannerStore } from '@/store/bannerStore';

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const { isBannerVisible } = useBannerStore();
  const paddingClass = isBannerVisible ? 'pt-[104px]' : 'pt-[72px]';

  return (
    <main className={`w-full min-h-screen ${paddingClass} pb-8 px-4 md:px-8 lg:px-16 transition-all duration-300`}>
      {children}
    </main>
  );
}
