export interface SearchResult {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  channelAvatar: string | null;
  publishedAt: string;
  viewCount: string | null;
  duration: string | null;
}

export interface ISearchProvider {
  readonly name: string;
  search(query: string, apiKey: string): Promise<SearchResult[]>;
}
