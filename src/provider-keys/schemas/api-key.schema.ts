import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApiKeyDocument = ApiKey & Document;

export enum ProviderType {
  YOUTUBE = 'youtube',
  SERPAPI = 'serpapi',
}

export enum ApiKeyStatus {
  ACTIVE = 'active',
  EXHAUSTED = 'exhausted',
  DISABLED = 'disabled',
}

@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ required: true })
  key: string; // AES encrypted

  @Prop({ required: true, enum: ProviderType })
  provider: ProviderType;

  @Prop()
  name: string;

  @Prop({ enum: ApiKeyStatus, default: ApiKeyStatus.ACTIVE })
  status: ApiKeyStatus;

  @Prop({ default: 0 })
  quotaUsed: number;

  @Prop({ default: 10000 })
  quotaLimit: number;

  @Prop({ type: Date, default: null })
  resetAt: Date | null;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

// Index for efficient rotation queries
ApiKeySchema.index({ provider: 1, status: 1 });
ApiKeySchema.index({ provider: 1, status: 1, resetAt: 1 });
