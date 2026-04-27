import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AppConfigDocument = AppConfig & Document;

@Schema({ timestamps: true })
export class AppConfig {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ type: String, default: '' })
  value: string;
}

export const AppConfigSchema = SchemaFactory.createForClass(AppConfig);
