import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { ISearchProvider, SearchResult } from './interfaces/search-provider.interface';

const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YT_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

/** Convert ISO 8601 duration (PT1H2M3S) to a readable string (1:02:03) */
function parseDuration(iso: string): string {
  if (!iso) return '0:00';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseInt(match[3] || '0', 10);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

@Injectable()
export class YoutubeProvider implements ISearchProvider {
  readonly name = 'youtube';
  private readonly logger = new Logger(YoutubeProvider.name);

  async search(query: string, apiKey: string): Promise<SearchResult[]> {
    // Step 1: search.list
    let searchResponse: any;
    try {
      searchResponse = await axios.get(YT_SEARCH_URL, {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: 10,
          key: apiKey,
        },
        timeout: 10000,
      });
    } catch (err) {
      this.handleApiError(err);
    }

    const items: any[] = searchResponse.data.items || [];
    if (items.length === 0) return [];

    const videoIds = items.map((i: any) => i.id.videoId).join(',');

    // Step 2: videos.list for duration + stats (single call)
    let videosResponse: any;
    try {
      videosResponse = await axios.get(YT_VIDEOS_URL, {
        params: {
          part: 'contentDetails,statistics',
          id: videoIds,
          key: apiKey,
        },
        timeout: 10000,
      });
    } catch (err) {
      this.logger.warn('Failed to fetch video details, returning without duration/stats');
      videosResponse = { data: { items: [] } };
    }

    // Build lookup map
    const detailsMap: Record<string, any> = {};
    for (const v of videosResponse.data.items || []) {
      detailsMap[v.id] = v;
    }

    return items.map((item: any) => {
      const details = detailsMap[item.id.videoId];
      const snippet = item.snippet;
      return {
        videoId: item.id.videoId,
        title: snippet.title,
        description: snippet.description || '',
        thumbnail:
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          '',
        channelTitle: snippet.channelTitle,
        channelAvatar: null, // Requires extra API call — skipped to conserve quota
        publishedAt: snippet.publishedAt,
        viewCount: details?.statistics?.viewCount ?? null,
        duration: details?.contentDetails?.duration
          ? parseDuration(details.contentDetails.duration)
          : null,
      } as SearchResult;
    });
  }

  private handleApiError(err: AxiosError): never {
    const status = err.response?.status;
    const data: any = err.response?.data;
    const message = data?.error?.message || err.message;

    if (status === 403) {
      throw new HttpException(
        `YouTube API quota exceeded or forbidden: ${message}`,
        HttpStatus.FORBIDDEN,
      );
    }
    if (status === 400) {
      throw new HttpException(`YouTube API bad request: ${message}`, HttpStatus.BAD_REQUEST);
    }
    throw new HttpException(
      `YouTube API error: ${message}`,
      HttpStatus.BAD_GATEWAY,
    );
  }
}
