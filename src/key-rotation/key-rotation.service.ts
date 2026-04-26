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
    const now = new Date();

    // Reset any exhausted keys whose resetAt has passed
    const resetResult = await this.apiKeyModel.updateMany(
      {
        provider,
        status: ApiKeyStatus.EXHAUSTED,
        resetAt: { $ne: null, $lte: now },
      },
      {
        $set: { status: ApiKeyStatus.ACTIVE, quotaUsed: 0, resetAt: null },
      },
    );

    if (resetResult.modifiedCount > 0) {
      this.logger.log(
        `Reset ${resetResult.modifiedCount} exhausted ${provider} key(s)`,
      );
    }

    // Pick one active key (round-robin by least recently used would be ideal,
    // but for simplicity we just grab any active key)
    const key = await this.apiKeyModel
      .findOne({ provider, status: ApiKeyStatus.ACTIVE })
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
   * Mark a key as exhausted. Sets resetAt to 24 h from now by default.
   */
  async markKeyExhausted(keyId: string, resetAt?: Date): Promise<void> {
    const resetTime = resetAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.apiKeyModel.findByIdAndUpdate(keyId, {
      $set: { status: ApiKeyStatus.EXHAUSTED, resetAt: resetTime },
    });
    this.logger.warn(`Key ${keyId} marked exhausted. Resets at ${resetTime.toISOString()}`);
  }

  /** Increment quota usage on a provider key */
  async incrementQuota(keyId: string, amount = 1): Promise<void> {
    await this.apiKeyModel.findByIdAndUpdate(keyId, {
      $inc: { quotaUsed: amount },
    });
  }
}
