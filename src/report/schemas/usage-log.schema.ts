import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UsageLogDocument = UsageLog & Document;

@Schema({ timestamps: false })
export class UsageLog {
  @Prop({ required: true })
  endpoint: string;

  @Prop({ default: 'GET' })
  method: string;

  @Prop()
  providerUsed: string;

  @Prop({ type: Types.ObjectId, ref: 'ApiKey', default: null })
  apiKeyId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'UserApiKey', default: null })
  userApiKeyId: Types.ObjectId | null;

  @Prop({ type: Date, default: () => new Date(), index: true })
  timestamp: Date;

  @Prop({ default: 'success' })
  status: 'success' | 'error';

  @Prop({ default: 200 })
  statusCode: number;

  @Prop()
  query: string;

  @Prop()
  errorMessage: string;
}

export const UsageLogSchema = SchemaFactory.createForClass(UsageLog);
UsageLogSchema.index({ timestamp: -1 });
UsageLogSchema.index({ providerUsed: 1, timestamp: -1 });
UsageLogSchema.index({ userApiKeyId: 1, timestamp: -1 });
