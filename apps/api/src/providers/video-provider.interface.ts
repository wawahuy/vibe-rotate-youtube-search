export interface VideoResult {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  channelAvatar: string;
  publishedAt: string;
  viewCount: number;
  duration: string;
}

export interface VideoProvider {
  search(query: string, apiKey: string): Promise<VideoResult[]>;
  readonly name: string;
}
