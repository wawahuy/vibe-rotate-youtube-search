import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserApiKeyDocument = UserApiKey & Document;

export enum UserApiKeyStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

@Schema({ timestamps: true })
export class UserApiKey {
  @Prop({ required: true, unique: true, index: true })
  key: string;

  @Prop()
  name: string;

  @Prop({ enum: UserApiKeyStatus, default: UserApiKeyStatus.ACTIVE })
  status: UserApiKeyStatus;

  /** Max requests per hour. 0 = unlimited. */
  @Prop({ default: 0 })
  rateLimit: number;

  /** Current count in the active rate-limit window */
  @Prop({ default: 0 })
  rateLimitCount: number;

  /** When the current rate-limit window resets */
  @Prop({ type: Date, default: null })
  rateLimitResetAt: Date | null;

  @Prop({ default: 0 })
  usageCount: number;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const UserApiKeySchema = SchemaFactory.createForClass(UserApiKey);
