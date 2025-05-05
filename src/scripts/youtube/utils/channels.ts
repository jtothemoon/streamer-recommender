import { callYoutubeApi } from './api';

// 채널 정보 타입 정의
export interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  statistics: {
    subscriberCount?: string;
    videoCount?: string;
    viewCount?: string;
    hiddenSubscriberCount?: boolean;
  };
  contentDetails?: {
    relatedPlaylists?: {
      uploads?: string;
    };
  };
  brandingSettings?: {
    channel?: {
      unsubscribedTrailer?: string;
      description?: string;
      title?: string;
    };
  };
}

// 검색 결과 채널 타입 정의
export interface YouTubeSearchResultItem {
  id: {
    kind: string;
    channelId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
}

// 플레이리스트 아이템 타입 정의
export interface YouTubePlaylistItem {
  contentDetails: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    resourceId: {
      videoId: string;
    };
  };
}

export interface YouTubeApiResponse<T> {
  items: T[];
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
  nextPageToken?: string;
}

// 한글 여부 판별
export function isKoreanText(text: string): boolean {
  const koreanMatches = text.match(/[\uac00-\ud7af]/g) || [];
  const ratio = koreanMatches.length / text.length;
  return ratio > 0.2; // 20% 이상이면 한국어로 간주
}

// 채널 검색
export async function searchChannels(query: string, maxResults: number = 20): Promise<YouTubeApiResponse<YouTubeSearchResultItem>> {
  return callYoutubeApi<YouTubeApiResponse<YouTubeSearchResultItem>>('/search', {
    part: 'snippet',
    q: query,
    type: 'channel',
    maxResults
  });
}

// 채널 상세 정보 조회
export async function getChannelsInfo(channelIds: string[]): Promise<YouTubeApiResponse<YouTubeChannel>> {
  return callYoutubeApi<YouTubeApiResponse<YouTubeChannel>>('/channels', {
    part: 'contentDetails,statistics,snippet',
    id: channelIds.join(','),
    maxResults: channelIds.length
  });
}

// 채널별 최신 동영상 조회
export async function getLatestVideos(playlistId: string, maxResults: number = 1): Promise<YouTubeApiResponse<YouTubePlaylistItem>> {
  return callYoutubeApi<YouTubeApiResponse<YouTubePlaylistItem>>('/playlistItems', {
    part: 'snippet,contentDetails',
    playlistId,
    maxResults
  });
}

// 채널 세부 정보 가져오기 (중복 API 호출 방지)
export async function getChannelDetails(channelId: string) {
  try {
    // 채널 정보와 브랜딩 설정을 함께 가져오기 위해 part 파라미터 수정
    const channelData = await callYoutubeApi<YouTubeApiResponse<YouTubeChannel>>('/channels', {
      part: 'contentDetails,statistics,snippet,brandingSettings',
      id: channelId
    });

    if (!channelData.items?.length) {
      return { success: false, message: "채널 정보 없음" };
    }

    const channelItem = channelData.items[0];

    // 구독자 수 확인
    const statistics = channelItem.statistics || {};
    const subscriberCount = statistics.subscriberCount;
    const hiddenSubscriberCount = statistics.hiddenSubscriberCount;

    // 구독자 수 비공개 채널 스킵
    if (hiddenSubscriberCount) {
      return { success: false, message: "구독자 수 비공개" };
    }

    // 구독자 수 값
    const subscribers = parseInt(subscriberCount || "0", 10);
    
    // 구독자 수 1,000명 미만 스킵 (신규 스트리머 발굴 시)
    if (subscribers < 1000) {
      return { success: false, message: `구독자 수 미달: ${subscribers}명` };
    }

    // 프로필 이미지와 설명
    const snippet = channelItem.snippet || {};
    const profileImage = snippet.thumbnails?.high?.url || 
                     snippet.thumbnails?.medium?.url || 
                     snippet.thumbnails?.default?.url || "";
    const description = snippet.description || "";

    // 업로드 플레이리스트 ID
    const uploadsPlaylistId = channelItem?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      return { success: false, message: "업로드 플레이리스트 정보 없음" };
    }

    // 대표 영상 ID (채널 트레일러) 가져오기
    const featuredVideoId = channelItem.brandingSettings?.channel?.unsubscribedTrailer || null;

    // 최신 동영상 정보 가져오기
    const playlistData = await getLatestVideos(uploadsPlaylistId);

    if (!playlistData.items?.length) {
      return { success: false, message: "동영상 정보 없음" };
    }

    const latestVideo = playlistData.items[0];
    const videoId = latestVideo.contentDetails?.videoId || latestVideo.snippet?.resourceId?.videoId;
    const publishedAt = latestVideo.snippet?.publishedAt;

    if (!publishedAt) {
      return { success: false, message: "업로드 날짜 정보 없음" };
    }

    const latestUploadDate = new Date(publishedAt);

    // 한 달 이내 업로드 확인
    const daysSinceUpload = (Date.now() - latestUploadDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpload > 30) {
      return { success: false, message: "최근 1개월 업로드 없음" };
    }

    // 성공시 필요 정보 반환
    return {
      success: true,
      data: {
        subscribers,
        latestUploadDate,
        profileImage,
        description,
        videoId,
        featured_video_id: featuredVideoId || videoId  // 대표 영상 ID (없으면 최신 영상으로 대체)
      }
    };
  } catch (err) {
    console.error(`❌ 채널 세부 정보 가져오기 실패: ${channelId}`, err);
    return { success: false, message: "API 호출 오류" };
  }
}