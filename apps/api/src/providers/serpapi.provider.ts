import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { VideoProvider, VideoResult } from './video-provider.interface';

@Injectable()
export class SerpApiProvider implements VideoProvider {
  readonly name = 'serpapi';
  private readonly logger = new Logger(SerpApiProvider.name);

  async search(query: string, apiKey: string): Promise<VideoResult[]> {
    const res = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'youtube',
        search_query: query,
        api_key: apiKey,
        gl: 'vi',
        hl: 'vi',
      },
    });

    const results = res.data.video_results as any[] || [];

    return results.map((item) => ({
      videoId: item.link?.split('v=')?.[1]?.split('&')?.[0] || '',
      title: item.title,
      description: item.description || '',
      thumbnail: item.thumbnail?.static || '',
      channelTitle: item.channel?.name || '',
      channelAvatar: item.channel?.thumbnail || '',
      publishedAt: item.published_date || '',
      viewCount: parseInt((item.views || '0').toString().replace(/[^0-9]/g, ''), 10),
      duration: item.length || '',
    }));
  }
}
