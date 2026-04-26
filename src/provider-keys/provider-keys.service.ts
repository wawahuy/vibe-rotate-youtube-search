import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKey, ApiKeyDocument, ApiKeyStatus } from './schemas/api-key.schema';
import { CreateProviderKeyDto } from './dto/create-provider-key.dto';
import { UpdateProviderKeyDto } from './dto/update-provider-key.dto';
import { encrypt } from '../common/utils/encryption.util';

@Injectable()
export class ProviderKeysService {
  constructor(
    @InjectModel(ApiKey.name)
    private readonly apiKeyModel: Model<ApiKeyDocument>,
  ) {}

  async create(dto: CreateProviderKeyDto): Promise<ApiKeyDocument> {
    const encryptedKey = encrypt(dto.key);
    const created = new this.apiKeyModel({
      ...dto,
      key: encryptedKey,
      quotaLimit: dto.quotaLimit ?? 10000,
      status: ApiKeyStatus.ACTIVE,
    });
    return created.save();
  }

  async findAll(provider?: string): Promise<ApiKeyDocument[]> {
    const filter = provider ? { provider } : {};
    return this.apiKeyModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<ApiKeyDocument> {
    const key = await this.apiKeyModel.findById(id).exec();
    if (!key) throw new NotFoundException(`Provider key ${id} not found`);
    return key;
  }

  async update(id: string, dto: UpdateProviderKeyDto): Promise<ApiKeyDocument> {
    const updateData: any = { ...dto };
    if (dto.key) {
      updateData.key = encrypt(dto.key);
    }
    const updated = await this.apiKeyModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updated) throw new NotFoundException(`Provider key ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.apiKeyModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Provider key ${id} not found`);
  }

  async resetKey(id: string): Promise<ApiKeyDocument> {
    const updated = await this.apiKeyModel
      .findByIdAndUpdate(
        id,
        { status: ApiKeyStatus.ACTIVE, quotaUsed: 0, resetAt: null },
        { new: true },
      )
      .exec();
    if (!updated) throw new NotFoundException(`Provider key ${id} not found`);
    return updated;
  }

  async disableKey(id: string): Promise<ApiKeyDocument> {
    const updated = await this.apiKeyModel
      .findByIdAndUpdate(id, { status: ApiKeyStatus.DISABLED }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException(`Provider key ${id} not found`);
    return updated;
  }

  async activateKey(id: string): Promise<ApiKeyDocument> {
    const updated = await this.apiKeyModel
      .findByIdAndUpdate(id, { status: ApiKeyStatus.ACTIVE }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException(`Provider key ${id} not found`);
    return updated;
  }

  /** Return sanitized list (key masked) */
  sanitize(keys: ApiKeyDocument[]) {
    return keys.map((k) => ({
      _id: k._id,
      provider: k.provider,
      name: k.name,
      status: k.status,
      quotaUsed: k.quotaUsed,
      quotaLimit: k.quotaLimit,
      resetAt: k.resetAt,
      createdAt: (k as any).createdAt,
      updatedAt: (k as any).updatedAt,
    }));
  }
}
