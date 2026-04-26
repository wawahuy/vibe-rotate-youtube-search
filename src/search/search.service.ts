import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { KeyRotationService } from '../key-rotation/key-rotation.service';
import { YoutubeProvider } from '../providers/youtube.provider';
import { SerpapiProvider } from '../providers/serpapi.provider';
import { ReportService } from '../report/report.service';
import { SearchResult } from '../providers/interfaces/search-provider.interface';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly keyRotation: KeyRotationService,
    private readonly youtube: YoutubeProvider,
    private readonly serpapi: SerpapiProvider,
    private readonly report: ReportService,
  ) {}

  async search(query: string, userApiKeyId?: string): Promise<SearchResult[]> {
    // ── Try YouTube first ────────────────────────────────────────────────────
    const ytKey = await this.keyRotation.getActiveKey('youtube');
    if (ytKey) {
      try {
        const results = await this.youtube.search(query, ytKey.decryptedKey);
        await this.keyRotation.incrementQuota(ytKey._id);
        await this.report.createLog({
          endpoint: '/api/search',
          providerUsed: 'youtube',
          apiKeyId: ytKey._id,
          userApiKeyId: userApiKeyId || null,
          status: 'success',
          statusCode: 200,
          query,
        });
        return results;
      } catch (err) {
        this.logger.warn(`YouTube search failed: ${err.message}`);
        if (this.isQuotaOrForbidden(err)) {
          await this.keyRotation.markKeyExhausted(ytKey._id);
        }
        // Fall through to SerpAPI
      }
    }

    // ── Fallback: SerpAPI ────────────────────────────────────────────────────
    const serpKey = await this.keyRotation.getActiveKey('serpapi');
    if (serpKey) {
      try {
        const results = await this.serpapi.search(query, serpKey.decryptedKey);
        await this.keyRotation.incrementQuota(serpKey._id);
        await this.report.createLog({
          endpoint: '/api/search',
          providerUsed: 'serpapi',
          apiKeyId: serpKey._id,
          userApiKeyId: userApiKeyId || null,
          status: 'success',
          statusCode: 200,
          query,
        });
        return results;
      } catch (err) {
        this.logger.warn(`SerpAPI search failed: ${err.message}`);
        if (this.isQuotaOrForbidden(err)) {
          await this.keyRotation.markKeyExhausted(serpKey._id);
        }
        await this.report.createLog({
          endpoint: '/api/search',
          providerUsed: 'serpapi',
          apiKeyId: serpKey._id,
          userApiKeyId: userApiKeyId || null,
          status: 'error',
          statusCode: err.status || 500,
          query,
          errorMessage: err.message,
        });
        throw new HttpException(
          `All search providers failed: ${err.message}`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }

    // ── No providers available ───────────────────────────────────────────────
    await this.report.createLog({
      endpoint: '/api/search',
      providerUsed: null,
      apiKeyId: null,
      userApiKeyId: userApiKeyId || null,
      status: 'error',
      statusCode: 503,
      query,
      errorMessage: 'No active provider keys',
    });

    throw new HttpException(
      'No active provider API keys available. Please add provider keys first.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  private isQuotaOrForbidden(err: any): boolean {
    return (
      err?.status === 403 ||
      err?.response?.status === 403 ||
      err?.message?.toLowerCase().includes('quota') ||
      err?.message?.includes('403')
    );
  }
}
