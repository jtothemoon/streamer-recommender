'use client';

import { useState, useEffect } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useFavoriteStore } from '@/store/favoriteStore';
import { YoutubeStreamer } from '@/types/youtube';
import { TwitchStreamer } from '@/types/twitch';

// FavoriteStreamer 타입
type FavoriteStreamer = YoutubeStreamer | TwitchStreamer;

interface FavoriteButtonProps {
  streamer: FavoriteStreamer;
  className?: string;
}

export default function FavoriteButton({ streamer, className = '' }: FavoriteButtonProps) {
  const { addFavorite, removeFavorite, isFavorite } = useFavoriteStore();
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    setIsFav(isFavorite(streamer.id));
  }, [streamer.id, isFavorite]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFav) {
      removeFavorite(streamer.id);
    } else {
      addFavorite(streamer);
    }

    setIsFav(!isFav);
  };

  return (
    <button
      onClick={toggleFavorite}
      className={`transition-colors ${className}`}
      aria-label={isFav ? '즐겨찾기 제거' : '즐겨찾기 추가'}
    >
      {isFav ? (
        <HeartSolidIcon className="h-6 w-6 text-red-500" />
      ) : (
        <HeartIcon className="h-6 w-6 hover:text-red-500" />
      )}
    </button>
  );
}
