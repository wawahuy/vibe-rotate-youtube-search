import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UsageLogDocument = UsageLog & Document;

@Schema({ timestamps: true })
export class UsageLog {
  @Prop({ required: true })
  endpoint: string;

  @Prop({ required: true })
  providerUsed: string;

  @Prop({ type: Types.ObjectId, ref: 'ApiKey', default: null })
  apiKeyId: Types.ObjectId | null;

  @Prop({ default: 'success' })
  status: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export const UsageLogSchema = SchemaFactory.createForClass(UsageLog);
