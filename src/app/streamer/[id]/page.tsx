'use client';

import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import StreamerDetail from './StreamerDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const searchParams = useSearchParams();
  const platform = searchParams.get('platform') as 'youtube' | 'twitch';

  return <StreamerDetail id={id} platform={platform} />;
}
