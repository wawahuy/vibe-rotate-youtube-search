import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserApiKey, UserApiKeyDocument, UserApiKeyStatus } from './schemas/user-api-key.schema';
import { CreateUserKeyDto } from './dto/create-user-key.dto';
import { UpdateUserKeyDto } from './dto/update-user-key.dto';
import { generateApiKey } from '../common/utils/encryption.util';

@Injectable()
export class UserKeysService {
  constructor(
    @InjectModel(UserApiKey.name)
    private readonly model: Model<UserApiKeyDocument>,
  ) {}

  async create(dto: CreateUserKeyDto): Promise<UserApiKeyDocument> {
    const key = generateApiKey(32); // 64 hex chars
    const created = new this.model({
      key,
      name: dto.name,
      rateLimit: dto.rateLimit ?? 0,
      status: UserApiKeyStatus.ACTIVE,
    });
    return created.save();
  }

  async findAll(): Promise<UserApiKeyDocument[]> {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<UserApiKeyDocument> {
    const item = await this.model.findById(id).exec();
    if (!item) throw new NotFoundException(`User API key ${id} not found`);
    return item;
  }

  async findByKey(key: string): Promise<UserApiKeyDocument | null> {
    return this.model.findOne({ key }).exec();
  }

  async update(id: string, dto: UpdateUserKeyDto): Promise<UserApiKeyDocument> {
    const updated = await this.model
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException(`User API key ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.model.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`User API key ${id} not found`);
  }

  async disable(id: string): Promise<UserApiKeyDocument> {
    return this.update(id, { status: UserApiKeyStatus.DISABLED });
  }

  async enable(id: string): Promise<UserApiKeyDocument> {
    return this.update(id, { status: UserApiKeyStatus.ACTIVE });
  }
}
