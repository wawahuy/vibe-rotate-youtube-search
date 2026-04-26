import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { VideoProvider, VideoResult } from './video-provider.interface';

@Injectable()
export class YouTubeProvider implements VideoProvider {
  readonly name = 'youtube';
  private readonly logger = new Logger(YouTubeProvider.name);

  async search(query: string, apiKey: string): Promise<VideoResult[]> {
    const searchUrl = 'https://www.googleapis.com/youtube/v3/search';
    const videosUrl = 'https://www.googleapis.com/youtube/v3/videos';

    const searchRes = await axios.get(searchUrl, {
      params: {
        part: 'snippet',
        q: query,
        maxResults: 10,
        type: 'video',
        key: apiKey,
      },
    });

    const items = searchRes.data.items as any[];
    const videoIds = items.map((i) => i.id.videoId).join(',');

    const statsRes = await axios.get(videosUrl, {
      params: {
        part: 'statistics,contentDetails',
        id: videoIds,
        key: apiKey,
      },
    });

    const statsMap: Record<string, any> = {};
    for (const item of statsRes.data.items) {
      statsMap[item.id] = item;
    }

    return items.map((item) => {
      const videoId = item.id.videoId;
      const stats = statsMap[videoId];
      return {
        videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        channelTitle: item.snippet.channelTitle,
        channelAvatar: '',
        publishedAt: item.snippet.publishedAt,
        viewCount: parseInt(stats?.statistics?.viewCount || '0', 10),
        duration: stats?.contentDetails?.duration || 'PT0S',
      };
    });
  }
}
