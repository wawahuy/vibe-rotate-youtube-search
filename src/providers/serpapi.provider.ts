import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { ISearchProvider, SearchResult } from './interfaces/search-provider.interface';

const SERPAPI_URL = 'https://serpapi.com/search.json';

/** Extract YouTube video ID from URL */
function extractVideoId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

@Injectable()
export class SerpapiProvider implements ISearchProvider {
  readonly name = 'serpapi';
  private readonly logger = new Logger(SerpapiProvider.name);

  async search(query: string, apiKey: string): Promise<SearchResult[]> {
    let response: any;
    try {
      response = await axios.get(SERPAPI_URL, {
        params: {
          engine: 'youtube',
          search_query: query,
          api_key: apiKey,
        },
        timeout: 15000,
      });
    } catch (err) {
      this.handleApiError(err);
    }

    const results: any[] = response.data.video_results || [];

    return results.slice(0, 10).map((item: any): SearchResult => {
      const videoId = extractVideoId(item.link || '') || '';
      return {
        videoId,
        title: item.title || '',
        description: item.description || '',
        thumbnail: item.thumbnail?.static || item.thumbnail?.rich || '',
        channelTitle: item.channel?.name || '',
        channelAvatar: item.channel?.thumbnail || null,
        publishedAt: item.published_date || '',
        viewCount: item.views != null ? String(item.views) : null,
        duration: item.length || null,
      };
    });
  }

  private handleApiError(err: AxiosError): never {
    const status = err.response?.status;
    const data: any = err.response?.data;
    const message = data?.error || err.message;

    if (status === 401 || status === 403) {
      throw new HttpException(
        `SerpAPI quota exceeded or forbidden: ${message}`,
        HttpStatus.FORBIDDEN,
      );
    }
    throw new HttpException(
      `SerpAPI error: ${message}`,
      HttpStatus.BAD_GATEWAY,
    );
  }
}
