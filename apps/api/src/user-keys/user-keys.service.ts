import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserApiKey, UserApiKeyDocument, generateUserApiKey } from '../database/user-api-key.schema';
import { CreateUserKeyDto, UpdateUserKeyDto } from './user-keys.dto';

@Injectable()
export class UserKeysService {
  constructor(
    @InjectModel(UserApiKey.name) private userApiKeyModel: Model<UserApiKeyDocument>,
  ) {}

  async findAll(): Promise<any[]> {
    return this.userApiKeyModel.find().sort({ createdAt: -1 }).lean();
  }

  async create(dto: CreateUserKeyDto): Promise<any> {
    const key = generateUserApiKey();
    const created = await this.userApiKeyModel.create({ key, label: dto.label, status: 'active' });
    // Return full key only once on creation
    return created.toObject();
  }

  async update(id: string, dto: UpdateUserKeyDto): Promise<any> {
    const updated = await this.userApiKeyModel.findByIdAndUpdate(id, dto, { new: true }).lean();
    if (!updated) throw new NotFoundException('User key not found');
    return { ...updated, key: updated.key.slice(0, 8) + '****' };
  }

  async remove(id: string): Promise<any> {
    const deleted = await this.userApiKeyModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('User key not found');
    return { message: 'Deleted successfully' };
  }

  async revoke(id: string): Promise<any> {
    const updated = await this.userApiKeyModel.findByIdAndUpdate(id, { status: 'revoked' }, { new: true });
    if (!updated) throw new NotFoundException('User key not found');
    return { message: 'Key revoked' };
  }
}
