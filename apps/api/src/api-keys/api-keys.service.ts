import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { ApiKey, ApiKeyDocument, KeyStatus, Provider } from '../database/api-key.schema';
import { EncryptionService } from '../common/encryption/encryption.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from './api-keys.dto';

const PROVIDER_QUOTA_DEFAULTS: Record<Provider, number> = {
  [Provider.YOUTUBE]: 10000,
  [Provider.SERPAPI]: 250,
};

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
    private encryptionService: EncryptionService,
  ) {}

  async findAll(): Promise<any[]> {
    const keys = await this.apiKeyModel.find().lean();
    return keys.map((k) => ({ ...k, key: '****' + k.key.slice(-8) }));
  }

  /** Verify key against provider API and return real quota limit */
  async verifyAndLoadQuota(rawKey: string, provider: Provider): Promise<{ valid: boolean; quotaLimit: number; detail?: string }> {
    try {
      if (provider === Provider.YOUTUBE) {
        // Make a minimal quota-cheap request (1 unit)
        await axios.get('https://www.googleapis.com/youtube/v3/videoCategories', {
          params: { part: 'snippet', regionCode: 'US', key: rawKey },
          timeout: 8000,
        });
        // YouTube free quota is 10,000 units/day — no API to read actual limit
        return { valid: true, quotaLimit: PROVIDER_QUOTA_DEFAULTS[Provider.YOUTUBE] };
      }

      if (provider === Provider.SERPAPI) {
        const res = await axios.get('https://serpapi.com/account', {
          params: { api_key: rawKey },
          timeout: 8000,
        });
        const remaining = res.data?.searches_per_month_remaining ?? PROVIDER_QUOTA_DEFAULTS[Provider.SERPAPI];
        const total = res.data?.searches_per_month ?? PROVIDER_QUOTA_DEFAULTS[Provider.SERPAPI];
        return { valid: true, quotaLimit: total, detail: `${remaining} searches remaining this month` };
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403 || status === 400) {
        return { valid: false, quotaLimit: PROVIDER_QUOTA_DEFAULTS[provider], detail: 'Key invalid or quota exceeded' };
      }
      this.logger.warn(`Could not verify key for ${provider}: ${err?.message}`);
    }
    return { valid: true, quotaLimit: PROVIDER_QUOTA_DEFAULTS[provider] };
  }

  async create(dto: CreateApiKeyDto): Promise<any> {
    const { valid, quotaLimit, detail } = await this.verifyAndLoadQuota(dto.key, dto.provider);
    if (!valid) {
      throw new BadRequestException(`Key validation failed: ${detail}`);
    }
    const encryptedKey = this.encryptionService.encrypt(dto.key);
    const created = await this.apiKeyModel.create({
      key: encryptedKey,
      provider: dto.provider,
      label: dto.label || '',
      quotaLimit,
      status: KeyStatus.ACTIVE,
    });
    return { ...created.toObject(), key: '****', quotaLimit, detail };
  }

  async update(id: string, dto: UpdateApiKeyDto): Promise<any> {
    const update: any = { ...dto };
    if (dto.key) {
      const provider = dto.provider ?? ((await this.apiKeyModel.findById(id))?.provider as Provider);
      const { valid, quotaLimit, detail } = await this.verifyAndLoadQuota(dto.key, provider);
      if (!valid) throw new BadRequestException(`Key validation failed: ${detail}`);
      update.key = this.encryptionService.encrypt(dto.key);
      update.quotaLimit = quotaLimit;
    }
    const updated = await this.apiKeyModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) throw new NotFoundException('API key not found');
    return { ...updated, key: '****' + updated.key.slice(-8) };
  }

  async remove(id: string) {
    const deleted = await this.apiKeyModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('API key not found');
    return { message: 'Deleted successfully' };
  }

  async resetStatus(id: string) {
    const updated = await this.apiKeyModel.findByIdAndUpdate(
      id,
      { status: KeyStatus.ACTIVE, quotaUsed: 0, resetAt: null },
      { new: true },
    );
    if (!updated) throw new NotFoundException('API key not found');
    return { message: 'Reset successfully' };
  }
}

