import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiKey, ApiKeySchema } from '../database/api-key.schema';
import { UsageLog, UsageLogSchema } from '../database/usage-log.schema';
import { EncryptionModule } from '../common/encryption/encryption.module';
import { YouTubeProvider } from './youtube.provider';
import { SerpApiProvider } from './serpapi.provider';
import { KeyRotationService } from './key-rotation.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApiKey.name, schema: ApiKeySchema },
      { name: UsageLog.name, schema: UsageLogSchema },
    ]),
    EncryptionModule,
  ],
  providers: [YouTubeProvider, SerpApiProvider, KeyRotationService],
  exports: [KeyRotationService],
})
export class ProvidersModule {}
