import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApiKeyDocument = ApiKey & Document;

export enum Provider {
  YOUTUBE = 'youtube',
  SERPAPI = 'serpapi',
}

export enum KeyStatus {
  ACTIVE = 'active',
  EXHAUSTED = 'exhausted',
}

@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ required: true })
  key: string; // AES encrypted

  @Prop({ required: true, enum: Provider })
  provider: Provider;

  @Prop({ default: KeyStatus.ACTIVE, enum: KeyStatus })
  status: KeyStatus;

  @Prop({ default: 0 })
  quotaUsed: number;

  @Prop({ default: 10000 })
  quotaLimit: number;

  @Prop({ type: Date, default: null })
  resetAt: Date | null;

  @Prop({ default: '' })
  label: string;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
