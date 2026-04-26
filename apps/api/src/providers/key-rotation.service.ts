import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKey, ApiKeyDocument, KeyStatus, Provider } from '../database/api-key.schema';
import { EncryptionService } from '../common/encryption/encryption.service';
import { VideoResult } from './video-provider.interface';
import { YouTubeProvider } from './youtube.provider';
import { SerpApiProvider } from './serpapi.provider';
import { UsageLog, UsageLogDocument } from '../database/usage-log.schema';

@Injectable()
export class KeyRotationService {
  private readonly logger = new Logger(KeyRotationService.name);

  constructor(
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
    @InjectModel(UsageLog.name) private usageLogModel: Model<UsageLogDocument>,
    private encryptionService: EncryptionService,
    private youtubeProvider: YouTubeProvider,
    private serpApiProvider: SerpApiProvider,
  ) {}

  async search(query: string): Promise<VideoResult[]> {
    // Try YouTube keys first
    const youtubeKeys = await this.getActiveKeys(Provider.YOUTUBE);
    for (const keyDoc of youtubeKeys) {
      try {
        const rawKey = this.encryptionService.decrypt(keyDoc.key);
        const results = await this.youtubeProvider.search(query, rawKey);
        await this.incrementQuota(keyDoc._id.toString());
        await this.logUsage('/api/search', Provider.YOUTUBE, keyDoc._id.toString(), 'success');
        return results;
      } catch (err) {
        const status = err?.response?.status;
        this.logger.warn(`YouTube key ${keyDoc._id} failed with status ${status}`);
        if (status === 403 || status === 429) {
          await this.markExhausted(keyDoc._id.toString());
        }
      }
    }

    // Fallback to SerpAPI
    const serpKeys = await this.getActiveKeys(Provider.SERPAPI);
    for (const keyDoc of serpKeys) {
      try {
        const rawKey = this.encryptionService.decrypt(keyDoc.key);
        const results = await this.serpApiProvider.search(query, rawKey);
        await this.incrementQuota(keyDoc._id.toString());
        await this.logUsage('/api/search', Provider.SERPAPI, keyDoc._id.toString(), 'success');
        return results;
      } catch (err) {
        const status = err?.response?.status;
        this.logger.warn(`SerpAPI key ${keyDoc._id} failed with status ${status}`);
        if (status === 403 || status === 429) {
          await this.markExhausted(keyDoc._id.toString());
        }
      }
    }

    await this.logUsage('/api/search', 'none', null, 'all_keys_exhausted');
    throw new Error('All API keys exhausted. Please try again later.');
  }

  private async getActiveKeys(provider: Provider): Promise<ApiKeyDocument[]> {
    const now = new Date();
    // Reset exhausted keys whose resetAt has passed
    await this.apiKeyModel.updateMany(
      { provider, status: KeyStatus.EXHAUSTED, resetAt: { $lte: now } },
      { $set: { status: KeyStatus.ACTIVE, quotaUsed: 0, resetAt: null } },
    );
    return this.apiKeyModel.find({ provider, status: KeyStatus.ACTIVE });
  }

  private async markExhausted(id: string): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    await this.apiKeyModel.findByIdAndUpdate(id, {
      status: KeyStatus.EXHAUSTED,
      resetAt: tomorrow,
    });
  }

  private async incrementQuota(id: string): Promise<void> {
    await this.apiKeyModel.findByIdAndUpdate(id, { $inc: { quotaUsed: 1 } });
  }

  private async logUsage(endpoint: string, provider: string, apiKeyId: any, status: string): Promise<void> {
    await this.usageLogModel.create({ endpoint, providerUsed: provider, apiKeyId, status });
  }
}
