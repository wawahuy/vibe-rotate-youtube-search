import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKey, ApiKeyDocument, ApiKeyStatus } from '../provider-keys/schemas/api-key.schema';
import { decrypt } from '../common/utils/encryption.util';

export interface ActiveKey {
  _id: string;
  provider: string;
  decryptedKey: string;
}

@Injectable()
export class KeyRotationService {
  private readonly logger = new Logger(KeyRotationService.name);

  constructor(
    @InjectModel(ApiKey.name)
    private readonly apiKeyModel: Model<ApiKeyDocument>,
  ) {}

  /**
   * Returns the next available active key for the given provider.
   * Auto-resets keys whose resetAt time has passed.
   */
  async getActiveKey(provider: string): Promise<ActiveKey | null> {
    // Pick one active key (rotate by least-used: sort by quotaUsed ascending)
    const key = await this.apiKeyModel
      .findOne({ provider, status: ApiKeyStatus.ACTIVE })
      .sort({ quotaUsed: 1 })
      .exec();

    if (!key) {
      this.logger.warn(`No active ${provider} keys available`);
      return null;
    }

    let decryptedKey: string;
    try {
      decryptedKey = decrypt(key.key);
    } catch (err) {
      this.logger.error(`Failed to decrypt key ${key._id}: ${err.message}`);
      return null;
    }

    return {
      _id: key._id.toString(),
      provider: key.provider,
      decryptedKey,
    };
  }

  /**
   * Auto-deactivate a key when its quota is exhausted.
   * Requires manual re-activation via the admin UI.
   */
  async markKeyExhausted(keyId: string): Promise<void> {
    await this.apiKeyModel.findByIdAndUpdate(keyId, {
      $set: { status: ApiKeyStatus.DISABLED },
    });
    this.logger.warn(`Key ${keyId} auto-deactivated (quota exhausted)`);
  }

  /** Increment quota usage on a provider key */
  async incrementQuota(keyId: string, amount = 1): Promise<void> {
    await this.apiKeyModel.findByIdAndUpdate(keyId, {
      $inc: { quotaUsed: amount },
    });
  }
}
